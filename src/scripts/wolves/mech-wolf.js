 /*
 * mech-wolf.js
 * Mechanical wolf (Gu Yan): steal god power
 */

(function () {
  'use strict';

  var Game = window.Game;
  var ensureState = Game.ensureState;

Game.hasMechWolfPower = function () {

    return !!Game.hasFlag('gu_yan_stole_god_power');

  }

Game.mechWolfStealPower = function (godCharId) {

    var g = ensureState();

    var godRole = Game.roleOf(godCharId);

    g.flags.gu_yan_stole_god_power = true;

    g.flags.gu_yan_stolen_role = godRole;

    return godRole;

  }

Game.getMechWolfStolenRole = function () {

    var g = ensureState();

    return g.flags.gu_yan_stolen_role || null;

  }

Game.mechWolfPeekIdentity = function (targetId) {

    if (!Game.hasMechWolfPower()) return { ok: false, reason: 'no_power' };

    var stolenRole = Game.getMechWolfStolenRole();

    if (stolenRole !== 'prophet') return { ok: false, reason: 'wrong_power' };

    var g = ensureState();

    if (!g.alive['gu_yan']) return { ok: false, reason: 'dead' };

    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };

    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: 'target_exiled' };

    var targetRole = Game.roleOf(targetId);

    var targetName = GameState.PROFILES[targetId] ? GameState.PROFILES[targetId].name : targetId;

    g.flags.gu_yan_stole_god_power = false;

    return { ok: true, identity: targetRole, name: targetName };

  }

Game.mechWolfCurse = function (targetId) {

    if (!Game.hasMechWolfPower()) return { ok: false, reason: 'no_power' };

    var stolenRole = Game.getMechWolfStolenRole();

    if (stolenRole !== 'witch') return { ok: false, reason: 'wrong_power' };

    var g = ensureState();

    if (!g.alive['gu_yan']) return { ok: false, reason: 'dead' };

    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };

    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: 'target_exiled' };

    Game.kill(targetId);

    g.flags.gu_yan_stole_god_power = false;

    return { ok: true, target: targetId };

  }

Game.mechWolfDuel = function (targetId) {

    if (!Game.hasMechWolfPower()) return { ok: false, reason: 'no_power' };

    var stolenRole = Game.getMechWolfStolenRole();

    if (stolenRole !== 'knight') return { ok: false, reason: 'wrong_power' };

    var g = ensureState();

    if (!g.alive['gu_yan']) return { ok: false, reason: 'dead' };

    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };

    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: 'target_exiled' };

    Game.kill(targetId);

    g.flags.gu_yan_stole_god_power = false;

    return { ok: true, target: targetId };

  }

Game.mechWolfSwap = function (charA, charB) {

    if (!Game.hasMechWolfPower()) return { ok: false, reason: 'no_power' };

    var stolenRole = Game.getMechWolfStolenRole();

    if (stolenRole !== 'magician') return { ok: false, reason: 'wrong_power' };

    var g = ensureState();

    if (!g.alive['gu_yan']) return { ok: false, reason: 'dead' };

    if (!g.alive[charA] || !g.alive[charB]) return { ok: false, reason: 'target_dead' };

    if (typeof Game.isExiled === 'function' && (Game.isExiled(charA) || Game.isExiled(charB))) return { ok: false, reason: 'target_exiled' };

    if (charA === charB) return { ok: false, reason: 'same_person' };

    var swapResult = Game.magicianSwap(charA, charB);

    if (swapResult.ok) {

      g.flags.gu_yan_stole_god_power = false;

    }

    return swapResult;

  }

Game.mechWolfAIActivatePower = function () {

    if (!Game.hasMechWolfPower()) return null;

    if (!Game.isAlive('gu_yan')) return null;

    var g = ensureState();

    var stolenRole = Game.getMechWolfStolenRole();

    // Active (non-exiled) good guys as targets. Exiled characters are locked
    // in the cellar and cannot be targeted by the mech wolf's stolen power.
    var aliveGood = Game.activeList().filter(function (cid) {

      return cid !== 'gu_yan' && GameState.WOLF_ROLES.indexOf(g.roles[cid]) === -1;

    });

    if (aliveGood.length === 0) return null;

    var target = aliveGood[Math.floor(Math.random() * aliveGood.length)];

    if (stolenRole === 'prophet') {

      var r = Game.mechWolfPeekIdentity(target);

      return r.ok ? { action: 'peek', target: target, identity: r.identity } : null;

    } else if (stolenRole === 'witch') {

      var r = Game.mechWolfCurse(target);

      return r.ok ? { action: 'curse', target: target } : null;

    } else if (stolenRole === 'knight') {

      var r = Game.mechWolfDuel(target);

      return r.ok ? { action: 'duel', target: target } : null;

    } else if (stolenRole === 'magician') {

      if (aliveGood.length < 2) return null;

      var others = aliveGood.filter(function(c) { return c !== target; });

      var b = others[Math.floor(Math.random() * others.length)];

      var r = Game.mechWolfSwap(target, b);

      return r.ok ? { action: 'swap', a: target, b: b } : null;

    }

    return null;

  }
})();
