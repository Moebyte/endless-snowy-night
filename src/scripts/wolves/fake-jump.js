/*
 * fake-jump.js - Fake-jump wolf: pretends to be the prophet to mislead good guys
 *
 * Only Zhao Mingcheng (calculated, high-intelligence) or Gu Yan (ambitious)
 * can initiate a fake-prophet jump.
 * Tang Xiaotang (emotional) never fakes – she can''t maintain the lie.
 * Zhou Yang (wolf king) doesn''t fake either – he leads openly.
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
  var WOLF_ROLES = ["wolf_king", "hidden_wolf", "wolf", "mechanical_wolf"];
  var GOD_ROLES = ["prophet", "witch", "knight", "magician"];

  function ensureFakeProphet(g) {
    if (!g.godSkills) g.godSkills = {};
    if (!g.godSkills.prophet) g.godSkills.prophet = {};
    if (!g.godSkills.prophet.sharedWith) g.godSkills.prophet.sharedWith = {};
    return g.godSkills;
  }

  Game.getFakeProphet = function () {
    var g = ensureState();
    return g.godSkills.fakeProphet || null;
  };

  Game.initFakeJump = function (wolfId) {
    var g = ensureState();

    // Only Zhao Mingcheng or Gu Yan can fake-jump as prophet
    var validJumpers = ["zhao_mingcheng", "gu_yan"];

    if (validJumpers.indexOf(wolfId) === -1) return { ok: false, reason: "cannot_jump" };
    if (!g.alive[wolfId]) return { ok: false, reason: "dead" };

    // If the pack is in a deep-water situation (recent kill drew attention),
    // the fake jumper may hold off
    var lastKill = g.lastWolfKill;
    if (lastKill && lastKill.killed && lastKill.actualTarget && !g.alive[lastKill.actualTarget]) {
      // [v9.6] Phase aggression: later loops = less likely to hold off.
      var _holdChance = 0.4;
      if (typeof Game.getAggression === "function") {
        _holdChance = 0.4 / Game.getAggression();  // late: 0.4/1.0 = 0.4, early: 0.4/0.5 = 0.8
      }
      if (Math.random() < _holdChance) return { ok: false, reason: "deep_water" };
    }

    g.godSkills.fakeProphet = {
      wolfId: wolfId,
      day: g.day,
      reports: [],
      exposed: true
    };

    return { ok: true };
  };

  Game.fakeProphetReport = function (targetId, alignment) {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return { ok: false, reason: "no_jump" };
    if (!g.alive[targetId]) return { ok: false, reason: "target_dead" };

    for (var i = 0; i < fp.reports.length; i++) {
      if (fp.reports[i].target === targetId) return { ok: false, reason: "already_reported" };
    }

    var report = {
      target: targetId,
      alignment: alignment,
      day: g.day,
      faked: true
    };

    fp.reports.push(report);

    // Distribute the faked info to god-role holders
    ensureFakeProphet(g);
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === fp.wolfId) return;
      if (GOD_ROLES.indexOf(g.roles[charId]) === -1) return;

      if (!g.godSkills.prophet.sharedWith[charId]) g.godSkills.prophet.sharedWith[charId] = [];
      g.godSkills.prophet.sharedWith[charId].push({
        infoTarget: targetId,
        alignment: alignment,
        day: g.day,
        loop: g.loop,
        faked: true,
        fromFakeProphet: true
      });
    });

    return { ok: true, report: report };
  };

  // AI: fake prophet makes a report
  Game.fakeProphetAIReport = function () {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return null;
    if (!g.alive[fp.wolfId]) return null;

    var aliveList = Game.activeList();
    var unreported = aliveList.filter(function (k) {
      if (k === fp.wolfId) return false;
      return !fp.reports.some(function (r) { return r.target === k; });
    });
    if (unreported.length === 0) return null;

    var target = unreported[Math.floor(Math.random() * unreported.length)];
    var targetRole = g.roles[target];
    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;

    // The fake jumper strategically lies or tells truth
    var alignment;
    if (isWolf) {
      // 70% chance to claim a wolf is "ally" (protect packmate)
      alignment = Math.random() < 0.7 ? "ally" : "enemy";
    } else {
      // 60% chance to frame a good guy as "enemy"
      alignment = Math.random() < 0.6 ? "enemy" : "ally";
    }

    return Game.fakeProphetReport(target, alignment);
  };

  // Real prophet can detect the fake
  Game.prophetCheckFakeJump = function () {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return null;
    if (!Game.isAlive("fang_heng")) return null;

    var hasAura = Game.prophetSenseAura(fp.wolfId);
    return {
      wolfId: fp.wolfId,
      hasAura: hasAura
    };
  };
})();
