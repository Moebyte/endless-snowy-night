/*
 * knight.js - Knight (Lin Xiaoman) skills: duel + guard + AI
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

  // Knight challenges target to a duel. Kills wolf -> ok. Kills villager -> knight dies.
  Game.knightDuel = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.duelCooldown || 0) > 0) return { ok: false, reason: 'duel_cooldown' };
    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_duel_self' };

    var targetRole = Game.roleOf(targetId);
    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;

    // Duel is a day action with its own cooldown, independent of guarding.
    k.duelCooldown = 1;

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

  Game.knightWeakened = function () {
    var k = ensureState().godSkills.knight;
    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;
  };

  // Precise per-skill cooldown checks (day duel vs night guard are independent).
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
    // Each night both independent cooldowns tick down by one.
    if ((k.duelCooldown || 0) > 0) k.duelCooldown -= 1;
    if ((k.guardCooldown || 0) > 0) k.guardCooldown -= 1;
    // Legacy field kept at 0 for old-save compatibility.
    k.weakenedDays = 0;
    k.currentGuard = null;
    k.guarding = null;
  };

  // AI: decide who to duel based on prophet info shared with knight
  Game.knightAIGetDuelTarget = function () {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return null;
    if (Game.knightWeakened()) return null;

    var shared = g.godSkills.prophet.sharedWith;
    if (!shared || !shared['lin_xiaoman']) return null;

    var enemyInfos = [];
    var prophetEnemies = [];
    var transferredEnemies = [];

    for (var i = 0; i < shared['lin_xiaoman'].length; i++) {
      var info = shared['lin_xiaoman'][i];
      if (info.alignment === 'enemy') {
        var isFromProphet = false;
        // Check if info came directly from prophet
        if (info.sources) {
          for (var s = 0; s < info.sources.length; s++) {
            if (info.sources[s] === 'fang_heng' && !info.faked) {
              isFromProphet = true;
              break;
            }
          }
        }
        if (isFromProphet) {
          prophetEnemies.push(info.infoTarget);
        } else {
          transferredEnemies.push(info.infoTarget);
        }
      }
    }

    // Prefer prophet-confirmed enemies
    var target = prophetEnemies[0] || transferredEnemies[0];
    return target || null;
  };

  // Guard: protect a target for the night (cannot guard self, causes weakness)
  Game.knightGuard = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.guardCooldown || 0) > 0) return { ok: false, reason: 'guard_cooldown' };
    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_guard_self' };

    // Cannot guard same person two nights in a row
    if (k.lastGuardTarget === targetId) return { ok: false, reason: 'consecutive_guard' };

    k.guarding = targetId;
    k.lastGuardTarget = targetId;
    // Guard has its own cooldown, independent of dueling.
    k.guardCooldown = 1;
    return { ok: true, reason: 'guarding', target: targetId };
  };

  Game.knightIsGuarding = function (targetId) {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return false;
    if (targetId === undefined) return !!g.godSkills.knight.guarding;
    return g.godSkills.knight.guarding === targetId;
  };

  Game.knightClearGuard = function () {
    var g = ensureState();
    g.godSkills.knight.guarding = null;
  };

  // AI: decide who to guard
  Game.knightAIGetGuardTarget = function () {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return null;
    if (Game.knightWeakened()) return null;

    // Prioritize protecting key good guys
    var candidates = [];
    var priority = ['su_wan', 'chen_mo', 'fang_heng', 'ye_zhiqiu'];
    for (var i = 0; i < priority.length; i++) {
      if (g.alive[priority[i]] && priority[i] !== g.godSkills.knight.lastGuardTarget) {
        candidates.push(priority[i]);
      }
    }
    return candidates[0] || null;
  };

})();