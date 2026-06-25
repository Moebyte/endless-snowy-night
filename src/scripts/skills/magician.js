/*
 * magician.js
 * Magician (Shen Shen) skill: illusion swap + AI
 *
 * v9 design (final):
 *   - MUST swap every night (gambler paranoia: always feels watched)
 *   - Can swap ANY two people, INCLUDING himself
 *   - Cannot swap the same person two nights in a row (lastSwapPair check)
 *
 *   Self-preservation mode (feels threatened):
 *     Swap himself with a "safe-looking" person.
 *       - If wolves target Shen Shen tonight -> that decoy dies, Shen Shen lives (lucky)
 *       - If wolves target the decoy tonight -> Shen Shen dies (he gambled wrong)
 *
 *   Gambling mode (feels safe):
 *     Swap "likely wolf target" <-> "suspected wolf".
 *       - Right guess -> wolves kill their own teammate (dramatic)
 *       - Wrong guess -> an innocent dies in place of the suspected wolf
 */

(function () {
  'use strict';

  var Game = window.Game;
  var ensureState = Game.ensureState;

  // ── Core skill functions ──

  Game.wasInLastSwap = function (charId) {
    var g = ensureState();
    var history = g.godSkills.magician.swapHistory;
    if (!history || history.length === 0) return false;
    var last = history[history.length - 1];
    return last.a === charId || last.b === charId;
  };

  Game.magicianSwap = function (charA, charB) {
    var g = ensureState();
    if (charA === charB) return { ok: false, reason: 'same_person' };
    if (!Game.isAlive(charA) || !Game.isAlive(charB)) return { ok: false, reason: 'dead' };
    if (typeof Game.isExiled === 'function' && (Game.isExiled(charA) || Game.isExiled(charB))) return { ok: false, reason: 'exiled' };
    // Cannot reuse anyone from last night's swap pair
    if (Game.wasInLastSwap(charA)) return { ok: false, reason: 'repeated_' + charA };
    if (Game.wasInLastSwap(charB)) return { ok: false, reason: 'repeated_' + charB };

    g.godSkills.magician.swapsUsed += 1;
    g.godSkills.magician.currentSwap = { a: charA, b: charB };
    g.godSkills.magician.swapHistory.push({ day: g.day, a: charA, b: charB });
    return { ok: true, swap: { a: charA, b: charB } };
  };

  Game.getMagicianSwap = function () {
    return ensureState().godSkills.magician.currentSwap;
  };

  Game.resolveSwapTarget = function (charId) {
    var swap = Game.getMagicianSwap();
    if (!swap) return charId;
    var target = charId;
    if (swap.a === charId) target = swap.b;
    else if (swap.b === charId) target = swap.a;
    // Do not redirect to an exiled person
    if (target !== charId && typeof Game.isExiled === 'function' && Game.isExiled(target)) return charId;
    return target;
  };

  Game.magicianSwapsRemaining = function () {
    // v9: unlimited nights. Always returns >=1 so sim keeps swapping.
    return 1;
  };

  Game.magicianResetDaily = function () {
    ensureState().godSkills.magician.currentSwap = null;
  };

  // ── AI helpers ──

  // Shen Shen's cold-reading: who does he suspect is a wolf?
  Game.magicianSuspectScore = function (charId) {
    var g = ensureState();
    var score = 0;

    var events = Game.getEventsInvolving(charId, g.day);
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.target === charId && (e.type === 'observation' || e.type === 'suspicion')) {
        score += e.weight;
      }
    }

    // Personal instinct (gambler reads people)
    var instinct = {
      zhou_yang: 5,
      zhao_mingcheng: 8,
      gu_yan: 5,
      fang_heng: 2,
      chen_mo: 0,
      su_wan: 0,
      jiang_bai: 0,
      zheng_shoushan: 3,
      tang_xiaotang: 0,
      lin_xiaoman: 2,
      ye_zhiqiu: 2,
      shen_shen: 0
    };
    score += (instinct[charId] || 0);
    return score;
  };

  // Who does Shen Shen think is in danger tonight (likely wolf target)?
  Game.magicianProtectScore = function (charId) {
    var g = ensureState();
    var score = 0;
    var events = Game.getEventsInvolving(charId, g.day);
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.target === charId || e.b === charId) {
        score += Math.floor(e.weight / 2);
      }
      if (e.a === charId && e.type === 'conflict') {
        score += Math.floor(e.weight / 3);
      }
    }
    return score;
  };

  // How threatened does Shen Shen feel tonight? (gambler paranoia)
  Game.magicianSelfDanger = function () {
    var g = ensureState();
    var danger = 0;

    var events = Game.getEventsInvolving('shen_shen', g.day);
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.target === 'shen_shen' || e.b === 'shen_shen') {
        danger += e.weight;
      }
    }

    // If Fang Heng checked him tonight, big danger signal
    var checks = g.godSkills.prophet.checks || [];
    for (var j = 0; j < checks.length; j++) {
      if (checks[j].target === 'shen_shen' && checks[j].day === g.day) {
        danger += 20;
      }
    }

    // Gambler paranoia: base anxiety + random spike.
    // Even with no events he feels ~40% chance of being watched.
    danger += 8;                       // baseline paranoia
    danger += Math.floor(Math.random() * 20);  // mood swing
    return danger;
  };

  // Pick a "safe-looking" person to use as decoy in self-preservation mode.
  // Prefers people he doesn't suspect and who weren't in conflicts today.
  Game.magicianPickDecoy = function (candidates) {
    var scored = candidates.map(function (c) {
      return { id: c, score: Game.magicianSuspectScore(c) + Game.magicianProtectScore(c) };
    }).sort(function (a, b) { return a.score - b.score; });
    // Take the least-suspect, least-in-danger person
    return scored.length > 0 ? scored[0].id : null;
  };

  // ── AI: decide tonight's swap ──
  Game.magicianAIDecideSwap = function () {
    var g = ensureState();
    if (!g.alive['shen_shen']) return null;
    // An exiled character is locked in the cellar and exits all interactions.
    if (typeof Game.isExiled === 'function' && Game.isExiled('shen_shen')) return null;

    var selfDanger = Game.magicianSelfDanger();

    // Candidates excluding anyone in last night's swap pair
    var alive = Game.aliveList().filter(function (c) {
      return c !== 'shen_shen' && !Game.wasInLastSwap(c) &&
             !(typeof Game.isExiled === 'function' && Game.isExiled(c));
    });
    var selfLocked = Game.wasInLastSwap('shen_shen');

    // ── Self-preservation mode ──
    // Feels threatened (paranoia threshold) OR random panic (gambler tilt)
    var panic = Math.random() < 0.3;  // 30% chance of pure panic even if calm
    if ((selfDanger >= 18 || panic) && !selfLocked && alive.length > 0) {
      // Swap himself with a "safe" decoy.
      var decoy = Game.magicianPickDecoy(alive);
      if (decoy) {
        return { a: 'shen_shen', b: decoy, reason: 'self_preservation' };
      }
    }

    // ── Gambling mode ──
    // Swap "likely target" <-> "suspected wolf". Even if it backfires, he's a gambler.
    if (alive.length < 2) return null;

    // Who might get killed tonight?
    var protectCandidates = alive.map(function (c) {
      return { id: c, p: Game.magicianProtectScore(c) };
    }).filter(function (x) { return !Game.wasInLastSwap(x.id); })
      .sort(function (a, b) { return b.p - a.p; });

    // Who might be a wolf?
    var wolfCandidates = alive.map(function (c) {
      return { id: c, s: Game.magicianSuspectScore(c) };
    }).filter(function (x) { return !Game.wasInLastSwap(x.id); })
      .sort(function (a, b) { return b.s - a.s; });

    var target = protectCandidates.length > 0 ? protectCandidates[0].id : null;
    var wolf = wolfCandidates.length > 0 ? wolfCandidates[0].id : null;

    if (target && wolf && target !== wolf) {
      return { a: target, b: wolf, reason: 'gamble_swap' };
    }

    // Fallback: swap two random alive people (pure gamble)
    var a = alive[Math.floor(Math.random() * alive.length)];
    var rest = alive.filter(function (c) { return c !== a; });
    if (rest.length > 0) {
      var b = rest[Math.floor(Math.random() * rest.length)];
      return { a: a, b: b, reason: 'gamble_random' };
    }

    return null;
  };
})();
