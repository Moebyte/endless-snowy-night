/*
 * self-stab.js - Wolf self-stab deception (low-frequency flavor event)
 *
 * On night 1 (D2), with ~10% chance AND only on a safe night (no real kill),
 * one wolf fakes death to bait the witch's revive.
 *
 * Priority: zhou_yang > tang_xiaotang > zhao_mingcheng
 * (Gu Yan never self-stabs; he is the day-phase attacker.)
 *
 * The witch senses "someone is dying." If she revives, she loses 1 use.
 * Her mortician skill (wound analysis) gives a 35% chance to recognize
 * the wound as self-inflicted (different from divine-killer wounds).
 * On recognition, she does NOT revive and silently remembers the wolf.
 */

(function () {
  "use strict";

  var Game = window.Game;
  var ensureState = Game.ensureState;
  var WOLF_IDS = GameState.WOLF_IDS;
  var SELF_STAB_PRIORITY = ["zhou_yang", "tang_xiaotang", "zhao_mingcheng"];
  var TRIGGER_CHANCE = 0.10;        // 10% on night 1 safe night
  var DETECT_CHANCE = 0.35;         // 35% witch recognizes self-inflicted wound

  // Should the wolves attempt a self-stab tonight?
  // Conditions: night 1 (g.day === 2 means first night happened during day 2),
  // actually we check g.day === 2 (first playable night), AND no real kill target.
  Game.wolvesConsiderSelfStab = function () {
    var g = ensureState();
    // Only night 1 (day index 2 in the sim = first night)
    if (g.day !== 2) return null;
    // Only if there is no real wolf kill target this night (safe night)
    if (Game.getWolfTarget()) return null;
    // Need at least one eligible wolf alive
    var eligible = SELF_STAB_PRIORITY.filter(function (w) {
      return g.alive[w] && !(typeof Game.isExiled === 'function' && Game.isExiled(w));
    });
    if (eligible.length === 0) return null;
    // Roll the dice
    if (Math.random() > TRIGGER_CHANCE) return null;
    var stabber = eligible[0]; // priority order
    return { stabber: stabber };
  };

  // Attempt the self-stab deception. Called when wolvesConsiderSelfStab returns non-null.
  // Returns { stabber, witchNoticed, witchRecognized, witchRevived, success }
  Game.wolvesExecuteSelfStab = function (decision) {
    var g = ensureState();
    var stabber = decision.stabber;

    // Set up a fake "death" so the witch can sense it.
    // We mark the wolf as "feigning death" without actually killing them.
    if (!g.flags) g.flags = {};
    g.flags["self_stab_" + stabber] = true;
    g.flags["self_stab_active"] = true;

    // Simulate the death signal the witch would receive.
    g.lastWolfKill = {
      target: stabber,
      actualTarget: stabber,
      killed: false,           // not actually dead
      day: g.day,
      loop: g.loop,
      killer: stabber,
      isGod: false,
      special: "self_stab_feint",
      selfStab: true
    };

    return { stabber: stabber, feigned: true };
  };

  // Witch attempts to "revive" the self-stabbing wolf.
  // Her mortician wound-analysis skill may recognize the self-inflicted wound.
  // Returns { recognized, revived, target }
  Game.witchAttemptSelfStabRevive = function (stabber) {
    var g = ensureState();

    // Roll detection: does she recognize the wound as self-inflicted?
    var recognized = Math.random() < DETECT_CHANCE;

    if (recognized) {
      // She sees the wound is wrong - not a divine kill. She does NOT revive.
      // Silently remember this wolf as suspicious.
      if (!g.godSkills.witch.selfStabSuspects) g.godSkills.witch.selfStabSuspects = [];
      if (g.godSkills.witch.selfStabSuspects.indexOf(stabber) === -1) {
        g.godSkills.witch.selfStabSuspects.push(stabber);
      }
      // Clear the feign
      g.flags["self_stab_" + stabber] = false;
      g.flags["self_stab_active"] = false;
      return { recognized: true, revived: false, target: stabber };
    }

    // Not recognized - she revives (wastes 1 use)
    // Use the real revive to consume a use and set silverWater
    if (typeof Game.witchRevive === 'function') {
      // The wolf is not actually dead, so witchRevive would fail on "alive" check.
      // We manually consume the use and mark the wolf as "revived from fake death."
      var w = g.godSkills.witch;
      if (w.uses < w.maxUses && !w.broken) {
        w.uses += 1;
        w.actedTonight = true;
        w.silverWater = stabber;
        if (!w.revivedTargets) w.revivedTargets = [];
        w.revivedTargets.push(stabber);
        w.sensedDeath = null;
      }
    }
    g.flags["self_stab_" + stabber] = false;
    g.flags["self_stab_active"] = false;
    // The wolf now has a "silver water" halo - looks like a victim
    return { recognized: false, revived: true, target: stabber };
  };

  // The self-stabbing wolf appears "weakened" the next day, drawing Fang Heng's attention.
  Game.selfStabApplyWeakenedEffect = function (stabber) {
    var g = ensureState();
    if (!g.flags) g.flags = {};
    g.flags["weakened_" + stabber] = true;
  };

  Game.selfStabWasTriggered = function () {
    var g = ensureState();
    return !!(g.flags && g.flags["self_stab_active"]);
  };

  Game.selfStabGetStabber = function () {
    var g = ensureState();
    if (!g.flags || !g.flags["self_stab_active"]) return null;
    var keys = ["zhou_yang", "tang_xiaotang", "zhao_mingcheng"];
    for (var i = 0; i < keys.length; i++) {
      if (g.flags["self_stab_" + keys[i]]) return keys[i];
    }
    return null;
  };

  // Does the witch suspect this character from a self-stab recognition?
  Game.witchSelfStabSuspect = function (charId) {
    var g = ensureState();
    var suspects = g.godSkills.witch.selfStabSuspects || [];
    return suspects.indexOf(charId) !== -1;
  };

  // Get self-stab suspects list (for bind priority)
  Game.witchSelfStabSuspects = function () {
    var g = ensureState();
    return g.godSkills.witch.selfStabSuspects || [];
  };

  // Reset per loop
  Game.selfStabReset = function () {
    var g = ensureState();
    if (g.flags) {
      delete g.flags["self_stab_active"];
      ["zhou_yang", "tang_xiaotang", "zhao_mingcheng"].forEach(function (w) {
        delete g.flags["self_stab_" + w];
        delete g.flags["weakened_" + w];
      });
    }
    if (g.godSkills && g.godSkills.witch) {
      g.godSkills.witch.selfStabSuspects = [];
    }
  };
})();
