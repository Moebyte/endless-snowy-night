/*
 * fake-jump.js - Fake-jump wolf: pretends to be the prophet to mislead good guys
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
  var GOD_ROLES = ['prophet', 'witch', 'knight', 'magician'];

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
    var validJumpers = ['zhao_mingcheng', 'gu_yan'];

    // If the last wolf kill produced a deep-water (hidden-wolf friendly fire)
    // situation, sometimes hold off on the jump to keep cover
    var lastKill = g.lastWolfKill;
    if (lastKill && lastKill.killed && lastKill.actualTarget && !g.alive[lastKill.actualTarget]) {
      if (Math.random() < 0.5) return { ok: false, reason: 'deep_water' };
    }

    if (validJumpers.indexOf(wolfId) === -1) return { ok: false, reason: 'cannot_jump' };
    if (!g.alive[wolfId]) return { ok: false, reason: 'dead' };

    g.godSkills.fakeProphet = {
      wolfId: wolfId,
      day: g.day,
      reports: [],     // list of {target, alignment, faked}
      exposed: true    // a fake-jumper is effectively "out" once declared
    };

    return { ok: true };
  };

  Game.fakeProphetReport = function (targetId, alignment) {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return { ok: false, reason: 'no_jump' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };

    for (var i = 0; i < fp.reports.length; i++) {
      if (fp.reports[i].target === targetId) return { ok: false, reason: 'already_reported' };
    }

    var report = {
      target: targetId,
      alignment: alignment,  // 'ally' or 'enemy', as faked by the wolf
      day: g.day,
      faked: true
    };

    fp.reports.push(report);

    // Distribute the faked info to god-role holders, mimicking real prophet sharing
    ensureFakeProphet(g);
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === fp.wolfId) return; // do not inform the faker itself
      if (GOD_ROLES.indexOf(g.roles[charId]) === -1) return; // only gods receive prophet info

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

  Game.fakeProphetAIReport = function () {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return null;
    if (!g.alive[fp.wolfId]) return null;

    var aliveList = Object.keys(g.alive).filter(function (k) { return g.alive[k]; });

    var unreported = aliveList.filter(function (k) {
      if (k === fp.wolfId) return false;
      return !fp.reports.some(function (r) { return r.target === k; });
    });

    if (unreported.length === 0) return null;

    var target = unreported[Math.floor(Math.random() * unreported.length)];
    var targetRole = g.roles[target];
    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;

    var reportTrue = Math.random() < 0.5;

    var alignment;
    if (reportTrue) {
      // Report the real alignment
      alignment = isWolf ? 'enemy' : 'ally';
    } else {
      // Lie: frame a good guy as enemy, or vouch for a fellow wolf
      alignment = isWolf ? 'ally' : 'enemy';
    }

    return Game.fakeProphetReport(target, alignment);
  };

  Game.prophetCheckFakeJump = function () {
    var g = ensureState();
    var fp = g.godSkills.fakeProphet;
    if (!fp) return null;

    // The real prophet (Fang Heng) can sense whether the fake-jumper has an aura
    if (!Game.isAlive('fang_heng')) return null;

    var hasAura = Game.prophetSenseAura(fp.wolfId);

    return {
      wolfId: fp.wolfId,
      hasAura: hasAura
    };
  };
})();