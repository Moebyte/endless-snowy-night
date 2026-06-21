/*
 * night-kill.js
 * Night kill resolution + god/wolf action checks
 *
 * Gu Yan (mechanical wolf) only gets power-steal when HE personally kills
 * a god. If another wolf makes the kill, no power-steal triggers.
 */

(function () {
  "use strict";

  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return State.variables.game;
  }

  var Game = window.Game;

  // Known wolves (Tang Xiaotang is hidden — not part of pack kills)
  var WOLF_IDS = ["zhou_yang", "zhao_mingcheng", "gu_yan"];
  var GOD_ROLES = ["prophet", "witch", "knight", "magician"];

  // Resolve the wolf pack's night kill.
  // Returns { target, killed, actualTarget, killer, special }
  Game.executeWolfKill = function () {
    var g = ensureState();

    var wolfTarget = Game.getWolfTarget();
    if (!wolfTarget) return { target: null, killed: false, special: "no_target" };

    var aliveWolves = WOLF_IDS.filter(function (w) {
      if (!g.alive[w]) return false;
      if (typeof Game.isExiled === 'function' && Game.isExiled(w)) return false;
      return true;
    });
    if (aliveWolves.length === 0) return { target: wolfTarget, killed: false, special: "no_wolves" };

    // Check if target is magician-swapped
    var resolvedTarget = wolfTarget;
    var swap = Game.getMagicianSwap();
    if (swap) {
      var mapped = Game.resolveSwapTarget(wolfTarget);
      if (mapped && mapped !== wolfTarget) resolvedTarget = mapped;
    }

    // Check if target is soul-bound (witch's 缚魂)
    if (Game.isSoulBound(resolvedTarget)) {
      return { target: wolfTarget, killed: false, actualTarget: resolvedTarget, special: "soul_bound" };
    }

    // Determine the killer for this kill
    var killer = Game.selectWolfKiller(resolvedTarget, aliveWolves, g);

    // Check knight guard: if the knight is guarding the target, kill fails
    if (typeof Game.knightIsGuarding === "function" && Game.knightIsGuarding(resolvedTarget)) {
      return {
        target: wolfTarget,
        killed: false,
        actualTarget: resolvedTarget,
        killer: killer,
        special: "guarded"
      };
    }

    // Detect friendly fire: magician swap redirected the kill onto a wolf
    var resolvedIsWolf = WOLF_IDS.indexOf(resolvedTarget) !== -1;
    var friendlyFire = resolvedTarget !== wolfTarget && resolvedIsWolf;

    // Execute the kill
    Game.kill(resolvedTarget);
    var isGod = GOD_ROLES.indexOf(Game.roleOf(resolvedTarget)) !== -1;

    // Track the kill result
    g.lastWolfKill = {
      target: wolfTarget,
      actualTarget: resolvedTarget,
      killed: true,
      day: g.day,
      loop: g.loop,
      killer: killer,
      isGod: isGod,
      friendlyFire: friendlyFire
    };

    // Jiang Bai's trap: if the killer triggers a trap, record the injury.
    // Does NOT prevent the kill — only leaves evidence for the day phase.
    if (typeof Game.trapCheckTrigger === 'function' && killer) {
      Game.trapCheckTrigger(killer);
    }

    var special = null;

    // ── Friendly fire (magician swap caused wolves to kill their own) ──
    if (friendlyFire) {
      special = "friendly_fire";
      g.lastWolfKill.special = "friendly_fire";
    }

    // ── Mech wolf power steal ──
    // ONLY triggers if Gu Yan personally made the kill
    if (killer === "gu_yan" && isGod && !Game.hasFlag("gu_yan_stole_god_power")) {
      var stolenRole = Game.roleOf(resolvedTarget);
      Game.mechWolfStealPower(resolvedTarget);
      special = "mech_steal_" + stolenRole;
      g.lastWolfKill.special = special;
    }

    // ── Body removal (cleaner wolf) ──
    if (killer === "zhao_mingcheng" && isGod) {
      special = "body_removed";
      g.lastWolfKill.special = "body_removed";
    }

    // ── Wolf king mutual kill (被动同归) ──
    // When Zhou Yang (wolf king) is KILLED by a wolf teammate due to
    // magician swap (致幻自杀), his death reflex triggers and takes
    // the killer down with him.
    if (friendlyFire && resolvedTarget === "zhou_yang" && killer !== "zhou_yang") {
      // Zhou Yang is dead (just killed), now kill the killer too
      Game.kill(killer);
      special = "wolf_king_mutual_swap";
      g.lastWolfKill.special = special;
      g.lastWolfKill.mutualKillTarget = killer;
    }

    // Record the killer preference for narrative
    g.lastWolfKill.killer = killer;
    if (special) g.lastWolfKill.special = special;

    return {
      target: wolfTarget,
      killed: true,
      actualTarget: resolvedTarget,
      killer: killer,
      special: special,
      friendlyFire: friendlyFire
    };
  };

  // ── Hidden wolf awakening kill ──
  // When all 3 known wolves are dead, Tang Xiaotang awakens and kills alone.
  // She is invisible to the prophet (always reads friendly/neutral).
  // Her kills happen AFTER the main wolf kill check returns no_target (no wolves alive).
  Game.hiddenWolfKill = function () {
    var g = ensureState();
    if (!g.alive["tang_xiaotang"]) return { target: null, killed: false, special: "hw_dead" };
    if (typeof Game.hiddenWolfAwakened !== "function" || !Game.hiddenWolfAwakened()) {
      return { target: null, killed: false, special: "hw_not_awakened" };
    }

    var target = Game.hiddenWolfAIGetKillTarget();
    if (!target) return { target: null, killed: false, special: "hw_no_target" };

    // Check knight guard
    if (typeof Game.knightIsGuarding === "function" && Game.knightIsGuarding(target)) {
      return { target: target, killed: false, actualTarget: target, killer: "tang_xiaotang", special: "hw_guarded" };
    }

    // Check soul bind
    if (Game.isSoulBound(target)) {
      return { target: target, killed: false, actualTarget: target, killer: "tang_xiaotang", special: "hw_soul_bound" };
    }

    // Check magician swap
    var resolvedTarget = target;
    var swap = Game.getMagicianSwap();
    if (swap) {
      var mapped = Game.resolveSwapTarget(target);
      if (mapped && mapped !== target) resolvedTarget = mapped;
    }

    // Execute kill
    Game.kill(resolvedTarget);

    g.lastWolfKill = {
      target: target,
      actualTarget: resolvedTarget,
      killed: true,
      day: g.day,
      loop: g.loop,
      killer: "tang_xiaotang",
      isGod: GOD_ROLES.indexOf(Game.roleOf(resolvedTarget)) !== -1,
      special: "hidden_wolf_kill"
    };

    return {
      target: target,
      killed: true,
      actualTarget: resolvedTarget,
      killer: "tang_xiaotang",
      special: "hidden_wolf_kill"
    };
  };

  // ── Select which wolf makes the kill ──
  // Gu Yan (mech wolf) actively volunteers if target is a known god
  // Zhao Mingcheng (cleaner) steps up if he wants the body gone
  // Zhou Yang (wolf king) takes charge by default
  Game.selectWolfKiller = function (target, aliveWolves, g) {
    var targetRole = Game.roleOf(target);
    var isGod = GOD_ROLES.indexOf(targetRole) !== -1;

    // ── God targets: special motives ──
    // Gu Yan (mech wolf) wants to kill gods to steal their power
    if (isGod && aliveWolves.indexOf("gu_yan") !== -1 && !Game.hasFlag("gu_yan_stole_god_power")) {
      if (Math.random() < 0.6) return "gu_yan";
    }
    // Zhao Mingcheng (cleaner) wants to kill gods to remove the body
    if (isGod && aliveWolves.indexOf("zhao_mingcheng") !== -1) {
      if (Math.random() < 0.45) return "zhao_mingcheng";
    }

    // ── Non-god targets or god kill fell through: rotate fairly ──
    // All three wolves share the risk. No one defaults to always killing.
    // Weighted random: Zhou Yang slightly lower (he's the most valuable piece).
    var candidates = aliveWolves.filter(function (w) { return w !== "tang_xiaotang"; });
    var weights = candidates.map(function (w) {
      if (w === "zhou_yang") return 2;      // wolf king: valuable, less risky assignments
      if (w === "zhao_mingcheng") return 3; // cleaner: willing
      if (w === "gu_yan") return 3;         // mech wolf: willing
      return 1;
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var roll = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < candidates.length; i++) {
      acc += weights[i];
      if (roll < acc) return candidates[i];
    }
    return candidates[candidates.length - 1];
  };
})();
