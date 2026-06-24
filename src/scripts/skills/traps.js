/*
 * traps.js
 * Jiang Bai's trap system (现实技能，非神力)
 *
 * Design:
 *   - Jiang Bai sets a simple trap each night (electrical engineering skill).
 *   - If wolves execute a kill that night, the wolf who did the killing has a
 *     50% chance of triggering the trap and getting injured.
 *   - The trap does NOT prevent the kill — it only leaves evidence.
 *   - Next morning, Jiang Bai checks the trap. If triggered, he knows someone
 *     was active at night. If he can connect the injury to a specific person
 *     (daytime observation), he gains suspicion toward them.
 *   - Jiang Bai becomes the 5th exile accuser, but ONLY when he has trap
 *     evidence. His accusation threshold is 55 (moderate — he has physical
 *     proof, not just gut feeling).
 */

(function () {
  "use strict";

  var Game = window.Game;
  var ensureState = Game.ensureState;

  // ── Initialize trap state ──
  Game.trapInit = function () {
    var g = ensureState();
    g.traps = {
      armed: false,         // is a trap set tonight?
      triggered: false,     // was it triggered this night?
      injuredWolf: null,    // which wolf triggered it (for day observation)
      lastTriggerDay: 0,    // last day a trap was triggered
      detected: false,      // has Jiang Bai checked it this morning?
      totalTriggers: 0      // across the whole loop
    };
  };

  // ── Jiang Bai arms a trap at the start of each night (Day 2+) ──
  Game.trapArm = function () {
    var g = ensureState();
    if (!g.alive['jiang_bai']) return false;
    if (typeof Game.isExiled === 'function' && Game.isExiled('jiang_bai')) return false;
    if (!g.traps) Game.trapInit();
    g.traps.armed = true;
    g.traps.triggered = false;
    g.traps.injuredWolf = null;
    g.traps.detected = false;
    return true;
  };

  // ── Called during night kill: check if the killer triggers the trap ──
  // Returns true if triggered, false otherwise.
  Game.trapCheckTrigger = function (killer) {
    var g = ensureState();
    if (!g.traps || !g.traps.armed) return false;
    if (!killer) return false;

    // 50% trigger chance — simple electrical trap, not always effective.
    var triggered = Math.random() < 0.5;
    if (triggered) {
      g.traps.triggered = true;
      g.traps.injuredWolf = killer;
      g.traps.lastTriggerDay = g.day;
      g.traps.totalTriggers++;
      g.traps.armed = false;  // trap is consumed
    }
    return triggered;
  };

  // ── Morning: Jiang Bai checks the trap and gains intelligence ──
  // Called during day phase. Returns intelligence object.
  Game.trapMorningCheck = function () {
    var g = ensureState();
    if (!g.traps) Game.trapInit();
    var result = { checked: false, triggered: false, injuredWolfId: null, observed: false };

    if (!g.alive['jiang_bai']) return result;

    g.traps.detected = true;
    result.checked = true;

    if (g.traps.triggered) {
      result.triggered = true;
      // Jiang Bai has a chance to observe WHO is injured during the day.
      // The injured wolf may show signs: limp, bandaged hand, etc.
      // 60% chance to connect the injury to a specific person (he's observant
      // with electronics, but reading people is harder).
      if (g.traps.injuredWolf && g.alive[g.traps.injuredWolf]) {
        if (Math.random() < 0.6) {
          result.observed = true;
          result.injuredWolfId = g.traps.injuredWolf;
        }
      }
    }

    // Reset for next night
    g.traps.armed = false;
    g.traps.triggered = false;

    return result;
  };

  // ── AI: Should Jiang Bai accuse based on trap evidence? ──
  // This is called by exile.js when Jiang Bai is in the accuser order.
  // Returns target id or null.
  Game.trapGetAccusationTarget = function () {
    var g = ensureState();
    if (!g.alive['jiang_bai']) return null;
    if (!g.traps) Game.trapInit();

    // Jiang Bai can ONLY accuse when he has trap evidence from last night
    // AND he successfully observed who was injured.
    // We store the last observed injury for the day phase.
    var lastObserved = g.traps.lastObservedInjury;
    if (lastObserved && g.alive[lastObserved]) {
      // Don't accuse teammates/protected people
      if (lastObserved === 'chen_mo' || lastObserved === 'su_wan' || lastObserved === 'jiang_bai') return null;
      return lastObserved;
    }
    return null;
  };

  // ── Store observation result from morning check for the exile phase ──
  Game.trapStoreObservation = function (checkResult) {
    var g = ensureState();
    if (!g.traps) Game.trapInit();
    if (checkResult.observed && checkResult.injuredWolfId) {
      g.traps.lastObservedInjury = checkResult.injuredWolfId;
    } else {
      g.traps.lastObservedInjury = null;
    }
  };

  // ── Reset on loop reset ──
  Game.trapReset = function () {
    Game.trapInit();
  };

})();