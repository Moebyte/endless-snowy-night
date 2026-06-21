/*
 * knight.js - Knight (Lin Xiaoman) skills: duel + guard + AI
 *
 * v9 AI redesign:
 *   - Guard: driven by day events (who is in danger/conflict)
 *   - Duel: driven by Lin Xiaoman's own suspicion, NOT prophet sharing
 *   - Tang Xiaotang bias: Tang's hints are weighted 10x
 *   - Anyone targeting Tang gets massive suspicion spike
 *   - Guard can be consecutive (night apart)
 */

(function () {
  'use strict';

  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return State.variables.game;
  }

  var Game = window.Game;
  var WOLF_ROLES = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];

  // ---- Skill: Duel (day action) ----

  Game.knightDuel = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.duelCooldown || 0) > 0) return { ok: false, reason: 'duel_cooldown' };
    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_duel_self' };
    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: 'target_exiled' };

    var targetRole = Game.roleOf(targetId);
    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;

    k.duelCooldown = 1;
    k.duelsUsed = (k.duelsUsed || 0) + 1;

    if (isWolf) {
      Game.kill(targetId);
      if (targetRole === 'wolf_king') {
        Game.kill('lin_xiaoman');
        return { ok: true, reason: 'wolf_king_mutual' };
      }
      return { ok: true, reason: 'killed_wolf', role: targetRole };
    } else {
      Game.kill('lin_xiaoman');
      return { ok: true, reason: 'innocent_killed', role: targetRole };
    }
  };

  // ---- Skill: Guard (night action) ----

  Game.knightGuard = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.guardCooldown || 0) > 0) return { ok: false, reason: 'guard_cooldown' };
    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_guard_self' };

    // Guard CAN be consecutive — night apart is enough recovery.
    k.guarding = targetId;
    k.guardCooldown = 1;
    return { ok: true, reason: 'guarding', target: targetId };
  };

  // ---- Cooldown / state management ----

  Game.knightWeakened = function () {
    var k = ensureState().godSkills.knight;
    return (k.duelCooldown || 0) > 0;
  };

  Game.knightDuelOnCooldown = function () {
    var k = ensureState().godSkills.knight;
    return (k.duelCooldown || 0) > 0;
  };

  Game.knightGuardOnCooldown = function () {
    var k = ensureState().godSkills.knight;
    return (k.guardCooldown || 0) > 0;
  };

  Game.knightReset = function () {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.duelCooldown || 0) > 0) k.duelCooldown -= 1;
    if ((k.guardCooldown || 0) > 0) k.guardCooldown -= 1;
    k.weakenedDays = 0;
    k.guarding = null;
  };

  Game.knightIsGuarding = function (targetId) {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return false;
    if (targetId === undefined) return !!g.godSkills.knight.guarding;
    return g.godSkills.knight.guarding === targetId;
  };

  Game.knightClearGuard = function () {
    ensureState().godSkills.knight.guarding = null;
  };

  // ---- AI: Suspicion system ----

  // Update Lin Xiaoman's suspicion based on day events.
  // Called at the start of each night (after day events are generated).
  Game.knightUpdateSuspicion = function () {
    var g = ensureState();
    var k = g.godSkills.knight;
    k.suspicion = k.suspicion || {};

    var todayEvents = Game.getDayEvents(g.day);
    if (!todayEvents.length) return;

    for (var i = 0; i < todayEvents.length; i++) {
      var e = todayEvents[i];

      // Rule 1: Anyone targeting Tang Xiaotang gets massive suspicion spike
      if (e.target === 'tang_xiaotang' || e.b === 'tang_xiaotang') {
        var aggressor = e.a;
        if (aggressor && aggressor !== 'lin_xiaoman') {
          k.suspicion[aggressor] = (k.suspicion[aggressor] || 0) + (e.weight * 2);
        }
      }

      // Rule 2: Tang Xiaotang hints someone is suspicious -> +50 (she trusts Tang blindly)
      if (e.type === 'tang_hint') {
        var hintTarget = e.target;
        k.suspicion[hintTarget] = (k.suspicion[hintTarget] || 0) + e.weight;
      }

      // Rule 3: General events Lin Xiaoman personally observes
      // She notices conflicts and forms her own opinions
      if (e.observer === 'lin_xiaoman' || e.a === 'lin_xiaoman') {
        var observedTarget = e.target;
        if (observedTarget && observedTarget !== 'lin_xiaoman') {
          k.suspicion[observedTarget] = (k.suspicion[observedTarget] || 0) + Math.floor(e.weight / 2);
        }
      }

      // Rule 4: Events she witnesses as a bystander (weaker effect)
      // Only if the event involves someone she cares about
      if (e.a !== 'lin_xiaoman' && e.b !== 'lin_xiaoman') {
        var target = e.target;
        if (target && target !== 'lin_xiaoman' && target !== 'tang_xiaotang') {
          // Small suspicion from bystander observation
          k.suspicion[target] = (k.suspicion[target] || 0) + Math.floor(e.weight / 4);
        }
      }
    }

    // Rule 5: Fang Heng's shared info — Lin Xiaoman distrusts him deeply.
    // She thinks he's targeting Tang Xiaotang, so his info is heavily discounted.
    // (He shares "hostile" checks -> she barely listens, tiny suspicion bump)
    if (typeof Game.prophetReceivedInfo === 'function') {
      var fangChecked = Game.aliveList().filter(function (cid) {
        if (cid === 'fang_heng' || cid === 'lin_xiaoman') return false;
        return Game.prophetReceivedInfo('lin_xiaoman', cid) !== null;
      });
      for (var fi = 0; fi < fangChecked.length; fi++) {
        var info = Game.prophetReceivedInfo('lin_xiaoman', fangChecked[fi]);
        if (info && info.result === 'hostile') {
          // She distrusts Fang Heng personally, but a cop calling someone
          // "hostile" is serious professional intel. Set a floor of 45 so
          // it can compete with Tang's hints (+50) and accumulated events.
          // It won't override a stronger read, but it won't be ignored either.
          var cur = k.suspicion[fangChecked[fi]] || 0;
          if (cur < 45) k.suspicion[fangChecked[fi]] = 45;
        }
        // If Fang Heng checked Tang Xiaotang and shared it -> Lin Xiaoman gets
        // MORE suspicious of FANG HENG (he's investigating her best friend!)
        if (info && fangChecked[fi] === 'tang_xiaotang') {
          k.suspicion['fang_heng'] = (k.suspicion['fang_heng'] || 0) + 10;
        }
      }
    }

    // Rule 6: If Fang Heng shot someone today, Lin Xiaoman is FURIOUS.
    // She sees him as the most dangerous person — gun + killing = maximum threat.
    var gunEvents = todayEvents.filter(function (e) {
      return e.a === 'fang_heng' && e.observer === 'public' && e.weight >= 50;
    });
    if (gunEvents.length > 0) {
      k.suspicion['fang_heng'] = (k.suspicion['fang_heng'] || 0) + 80;
    }

    // Cap suspicion at 100
    var keys = Object.keys(k.suspicion);
    for (var j = 0; j < keys.length; j++) {
      if (k.suspicion[keys[j]] > 100) k.suspicion[keys[j]] = 100;
      // Never be suspicious of Tang Xiaotang or Chen Mo
      if (keys[j] === 'tang_xiaotang' || keys[j] === 'chen_mo') {
        k.suspicion[keys[j]] = 0;
      }
    }
  };

  Game.knightGetSuspicion = function (charId) {
    var k = ensureState().godSkills.knight;
    return (k.suspicion || {})[charId] || 0;
  };

  Game.knightGetAllSuspicion = function () {
    var k = ensureState().godSkills.knight;
    return k.suspicion || {};
  };

  // ---- AI: Decide who to guard ----
  // Lin Xiaoman guards people she trusts (protagonist group).
  // She's not a detective — she protects the people she cares about.
  // Suspicion is for dueling, not guarding.

  Game.knightAIGetGuardTarget = function () {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return null;
    if (Game.knightGuardOnCooldown()) return null;

    // The people Lin Xiaoman cares about and would protect
    // Tang Xiaotang > Su Wan > Chen Mo > Jiang Bai
    // NOTE: Fang Heng is NEVER on this list. If he has been exposed (shot someone),
    // Lin Xiaoman actively refuses to guard him — "You have a gun, protect yourself."
    var protectList = ['su_wan', 'chen_mo', 'jiang_bai'];

    // Score each based on: is Tang uneasy today? Has this person been in danger?
    var scores = {};
    for (var i = 0; i < protectList.length; i++) {
      var charId = protectList[i];
      if (!g.alive[charId]) continue;
      var score = 10; // base: she cares about them

// If this person was targeted in a conflict today, they might be in danger
      var events = Game.getEventsInvolving(charId, g.day);
      for (var j = 0; j < events.length; j++) {
        if (events[j].target === charId || events[j].b === charId) {
          score += events[j].weight;
        }
      }

      scores[charId] = score;
    }

    // Pick highest scoring
    var best = null;
    var bestScore = -1;
    for (var key in scores) {
      if (scores[key] > bestScore) {
        bestScore = scores[key];
        best = key;
      }
    }

    return best || null;
  };

  // ---- AI: Decide who to duel ----

  Game.knightAIGetDuelTarget = function () {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return null;
    if (Game.knightDuelOnCooldown()) return null;

    var k = g.godSkills.knight;
    k.suspicion = k.suspicion || {};

    var alive = Game.aliveList().filter(function (c) {
      return c !== 'lin_xiaoman' &&
             c !== 'tang_xiaotang' && // never duel Tang (bias)
             c !== 'chen_mo';         // never duel Chen Mo (protagonist)
    });
    // [v9.3.3 FIX] Cannot duel someone who is already exiled (locked in cellar).
    if (typeof Game.isExiled === 'function') {
      alive = alive.filter(function (c) { return !Game.isExiled(c); });
    }

    if (!alive.length) return null;

    // [v9.4] Cross-validation: Lin Xiaoman doesn't trust Fang Heng, but
    // if he points at someone AND she personally has some unease about that
    // same person (suspicion >= 10), the two independent signals align and
    // she acts. This isn't trust — it's "two different sources saying the
    // same thing is harder to ignore than one."
    // If her own suspicion is 0 (she saw nothing), she ignores Fang entirely.
    if (typeof Game.prophetReceivedInfo === 'function') {
      for (var gwi = 0; gwi < alive.length; gwi++) {
        var gwInfo = Game.prophetReceivedInfo('lin_xiaoman', alive[gwi]);
        if (gwInfo && gwInfo.result === 'hostile') {
          var ownSusp = k.suspicion[alive[gwi]] || 0;
          if (ownSusp >= 10) {
            // Cross-validated: her gut + cop's intel agree. She acts.
            return alive[gwi];
          }
          break;  // only check the first hostile target
        }
      }
    }

    // Find the most suspicious person
    var best = null;
    var bestSusp = 0;

    // [v9.4] Before relying on her own emotional suspicion, check if Fang
    // Heng shared a "hostile" gold-water read about someone. The cop's
    // professional assessment gets +30 in the duel decision — she won't
    // fully trust him, but if he specifically warned about someone, that
    // person jumps to the front of the line for a duel.
    var goldWaterBonus = {};
    if (typeof Game.prophetReceivedInfo === 'function') {
      for (var gi = 0; gi < alive.length; gi++) {
        var info = Game.prophetReceivedInfo('lin_xiaoman', alive[gi]);
        if (info && info.result === 'hostile') {
          goldWaterBonus[alive[gi]] = 30;
        }
      }
    }

    for (var i = 0; i < alive.length; i++) {
      var susp = (k.suspicion[alive[i]] || 0) + (goldWaterBonus[alive[i]] || 0);
      if (susp > bestSusp) {
        bestSusp = susp;
        best = alive[i];
      }
    }

    // Only duel if suspicion is high enough (threshold)
    // Lin Xiaoman is impulsive but not stupid — she needs to feel strongly
    // If the target is Fang Heng and he has been exposed (has a gun, refuses to surrender),
    // Lin Xiaoman will NEVER duel him. She does not know if her ability or a bullet is faster.
    if (best === 'fang_heng') {
      var pr = g.godSkills.prophet;
      if (pr && pr.exposed) {
        return null;  // she won't risk it against a gun
      }
    }

    if (bestSusp >= 65) {
      return best;
    }

    // Lower threshold on later days (she gets more desperate)
    if (g.day >= 5 && bestSusp >= 50) {
      return best;
    }

    return null;
  };

})();
