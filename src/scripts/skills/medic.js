/*
 * medic.js
 * Su Wan's observation skill (现实技能，非神力)
 *
 * Su Wan is a top medical student (clinical medicine). She can observe
 * physiological signs in living people — elevated heart rate, hand tremors,
 * pupil dilation — that reveal stress from recent violence.
 *
 * Key design: her intel is shared ONLY with Chen Mo (the player).
 * She's his girlfriend; she whispers her observations to him privately.
 * No other character receives her intel. This makes her the player's
 * exclusive information source.
 *
 * Mechanism:
 *   - Each day (Day 2+), Su Wan observes ONE alive person.
 *   - If that person killed someone last night (wolf kill), adrenaline
 *     residue gives a 60% chance of detection (medical observation isn't
 *     perfect, and some people are good at hiding stress).
 *   - If detected, she tells Chen Mo: "That person's pulse was racing,
 *     their hands were shaking — they did something terrible last night."
 *   - This gives the player a direct clue about who the killer is.
 *   - Does NOT work through walls/exile — she must be near them.
 *   - She NEVER observes Chen Mo (she trusts him completely).
 */

(function () {
  "use strict";

  var Game = window.Game;
  var ensureState = Game.ensureState;

  // ── Initialize observation state ──
  Game.medicInit = function () {
    var g = ensureState();
    g.medic = {
      observations: [],      // history: { day, target, detected, killerId }
      lastObserved: null,     // today's observation target
      lastResult: null        // today's result for Chen Mo UI
    };
  };

  // ── Su Wan observes one person each day ──
  // AI: pick someone to observe. Priority: people who seem agitated today
  // (involved in conflicts, acting suspicious). She's smart — she doesn't
  // waste her observation on people who seem calm.
  Game.medicAIObserve = function () {
    var g = ensureState();
    if (!g.alive['su_wan']) return null;
    if (typeof Game.isExiled === 'function' && Game.isExiled('su_wan')) return null;
    if (!g.medic) Game.medicInit();

    // Candidates: alive, not Su Wan, not Chen Mo (she trusts him)
    var candidates = Game.activeList().filter(function (c) {
      if (c === 'su_wan' || c === 'chen_mo') return false;
      return true;
    });
    if (!candidates.length) return null;

    // Score: prefer people involved in today's events (they're on her mind)
    var events = Game.getDayEvents(g.day);
    var scored = candidates.map(function (cid) {
      var score = Math.random() * 10; // base randomness
      for (var i = 0; i < events.length; i++) {
        if (events[i].a === cid || events[i].b === cid || events[i].target === cid) {
          score += events[i].weight * 0.3;
        }
      }
      return { id: cid, score: score };
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    return scored[0].id;
  };

  // ── Perform observation: check if target killed last night ──
  // Returns { target, detected, isKiller } for Chen Mo's UI.
  Game.medicObserve = function (targetId) {
    var g = ensureState();
    if (!g.alive['su_wan']) return { ok: false, reason: 'su_wan_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (!g.medic) Game.medicInit();

    // Check if this person was the killer last night
    var lastKill = g.lastWolfKill;
    var isKiller = lastKill && lastKill.killer === targetId && lastKill.killed;

    // 60% detection rate if they actually killed
    var detected = false;
    if (isKiller) {
      detected = Math.random() < 0.6;
    }

    var result = {
      ok: true,
      day: g.day,
      target: targetId,
      detected: detected,
      isKiller: isKiller
    };

    g.medic.observations.push(result);
    g.medic.lastObserved = targetId;
    g.medic.lastResult = result;

    return result;
  };

  // ── AI: run the full observation for today ──
  Game.medicAIRun = function () {
    var target = Game.medicAIObserve();
    if (!target) return null;
    return Game.medicObserve(target);
  };

  // ── Get today's observation result for Chen Mo ──
  Game.medicGetResult = function () {
    var g = ensureState();
    if (!g.medic) return null;
    return g.medic.lastResult;
  };

  // ── Reset on loop reset ──
  Game.medicReset = function () {
    Game.medicInit();
  };

})();
