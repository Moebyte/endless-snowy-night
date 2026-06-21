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

    // ── Wolf king mutual kill ──
    if (killer === "zhou_yang" && !g.alive["zhou_yang"]) {
      // Zhou Yang was killed in the process (e.g. by knight duel)
      // Handled elsewhere; note it here
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

    // Gu Yan wants to kill gods to steal their power
    if (isGod && aliveWolves.indexOf("gu_yan") !== -1 && !Game.hasFlag("gu_yan_stole_god_power")) {
      // 70% chance Gu Yan volunteers for the kill
      if (Math.random() < 0.7) return "gu_yan";
    }

    // Zhao Mingcheng prefers to kill high-value targets (body removal)
    if (isGod && aliveWolves.indexOf("zhao_mingcheng") !== -1) {
      if (Math.random() < 0.5) return "zhao_mingcheng";
    }

    // Zhou Yang, as wolf king, takes charge by default
    if (aliveWolves.indexOf("zhou_yang") !== -1) return "zhou_yang";

    // Fallback: random alive wolf
    return aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
  };
})();
