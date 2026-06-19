/*
 * hidden-wolf.js - Hidden wolf (Tang Xiaotang) deep-water misleading AI
 * Injects fake prophet info to protect herself and misdirect good guys
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

  Game.hiddenWolfAIMislead = function () {
    var g = ensureState();
    if (!g.alive['tang_xiaotang']) return null;
    if (!g.alive['fang_heng']) return null; // needs prophet alive
    if (!Game.isGoldWater('tang_xiaotang')) return null;

    var aliveWolves = [];
    var aliveGoodNonWolf = [];

    Object.keys(g.alive).forEach(function (cid) {
      if (!g.alive[cid]) return;
      if (cid === 'tang_xiaotang') return;
      var role = Game.roleOf(cid);
      if (WOLF_ROLES.indexOf(role) !== -1) {
        aliveWolves.push(cid);
      } else {
        aliveGoodNonWolf.push(cid);
      }
    });

    var result = null;

    // Strategy 1: protect a fellow wolf by faking them as "ally" (gold water)
    if (aliveWolves.length > 0) {
      var protectTarget = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];

      if (!g.godSkills.prophet.sharedWith) g.godSkills.prophet.sharedWith = {};
      if (!g.godSkills.prophet.sharedWith['tang_xiaotang']) g.godSkills.prophet.sharedWith['tang_xiaotang'] = [];

      // Check not already faked
      var alreadyFaked = g.godSkills.prophet.sharedWith['tang_xiaotang'].some(function (s) {
        return s.infoTarget === protectTarget && s.alignment === 'ally';
      });

      if (!alreadyFaked) {
        g.godSkills.prophet.sharedWith['tang_xiaotang'].push({
          infoTarget: protectTarget,
          alignment: 'ally',
          day: g.day,
          loop: g.loop,
          faked: true
        });

        // Also mislead Lin Xiaoman (knight) to trust the wolf
        if (g.alive['lin_xiaoman']) {
          if (!g.godSkills.prophet.sharedWith['lin_xiaoman']) g.godSkills.prophet.sharedWith['lin_xiaoman'] = [];
          g.godSkills.prophet.sharedWith['lin_xiaoman'].push({
            infoTarget: protectTarget,
            alignment: 'ally',
            day: g.day,
            loop: g.loop,
            faked: true
          });
        }
        result = { type: 'protect', target: protectTarget };
      }
    } else if (aliveGoodNonWolf.length > 0) {
      // Strategy 2: frame a good guy as "enemy" to make knight duel them
      var misleadTarget = aliveGoodNonWolf[Math.floor(Math.random() * aliveGoodNonWolf.length)];

      if (!g.godSkills.prophet.sharedWith) g.godSkills.prophet.sharedWith = {};
      if (!g.godSkills.prophet.sharedWith['tang_xiaotang']) g.godSkills.prophet.sharedWith['tang_xiaotang'] = [];

      var alreadyFaked2 = g.godSkills.prophet.sharedWith['tang_xiaotang'].some(function (s) {
        return s.infoTarget === misleadTarget && s.alignment === 'enemy';
      });

      if (!alreadyFaked2) {
        g.godSkills.prophet.sharedWith['tang_xiaotang'].push({
          infoTarget: misleadTarget,
          alignment: 'enemy',
          day: g.day,
          loop: g.loop,
          faked: true
        });

        if (g.alive['lin_xiaoman']) {
          if (!g.godSkills.prophet.sharedWith['lin_xiaoman']) g.godSkills.prophet.sharedWith['lin_xiaoman'] = [];
          g.godSkills.prophet.sharedWith['lin_xiaoman'].push({
            infoTarget: misleadTarget,
            alignment: 'enemy',
            day: g.day,
            loop: g.loop,
            faked: true
          });
        }
        result = { type: 'mislead', target: misleadTarget };
      }
    }

    return result;
  };

})();