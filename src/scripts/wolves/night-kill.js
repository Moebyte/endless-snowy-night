/*
 * night-kill.js
 * Night kill resolution + god/wolf action checks
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

  // Resolve the wolf pack's night kill. Handles knight guard, magician swap
  // (including friendly fire / wolf king mutual kill), and mech-wolf power steal.
  Game.executeWolfKill = function () {
    var g = ensureState();

    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];
    var godRoles = ['prophet', 'witch', 'knight', 'magician'];

    var wolfTarget = Game.getWolfTarget();
    if (!wolfTarget) return { target: null, killed: false, special: 'no_target' };

    var aliveWolves = wolves.filter(function (w) { return g.alive[w]; });

    // Determine the actual killer. Mech wolf (gu_yan) prioritises known gods to
    // steal their power; otherwise prefer a regular wolf; zhao_mingcheng (cleaner)
    // sometimes takes the kill so the body can be removed.
    var killer = null;
    var targetRole = Game.roleOf(wolfTarget);
    var isKnownGod = godRoles.indexOf(targetRole) !== -1;

    var availableKillers = aliveWolves.filter(function (w) {
      var swap = Game.getMagicianSwap();
      if (swap) {
        var resolved = Game.resolveSwapTarget(w);
        if (resolved === wolfTarget) return false;
      }
      return true;
    });
    if (availableKillers.length === 0) availableKillers = aliveWolves;

    if (isKnownGod && availableKillers.indexOf('gu_yan') !== -1 && !Game.hasFlag('gu_yan_stole_god_power')) {
      killer = 'gu_yan';
    } else if (availableKillers.indexOf('zhao_mingcheng') !== -1 && Math.random() < 0.4) {
      killer = 'zhao_mingcheng';
    } else {
      var regulars = availableKillers.filter(function (w) {
        return w !== 'gu_yan' && w !== 'zhao_mingcheng';
      });
      if (regulars.length > 0) {
        killer = regulars[Math.floor(Math.random() * regulars.length)];
      } else {
        killer = availableKillers[Math.floor(Math.random() * availableKillers.length)];
      }
    }

    var result = {
      target: wolfTarget,
      targetName: GameState.PROFILES[wolfTarget] ? GameState.PROFILES[wolfTarget].name : wolfTarget,
      actualTarget: wolfTarget,
      actualTargetName: GameState.PROFILES[wolfTarget] ? GameState.PROFILES[wolfTarget].name : wolfTarget,
      killed: true,
      killer: killer,
      killerName: killer ? (GameState.PROFILES[killer] ? GameState.PROFILES[killer].name : killer) : null,
      special: null,
      swapped: false,
      friendlyFire: false,
      mutualKill: false
    };

    // Knight guard cancels the kill
    if (typeof Game.knightIsGuarding === 'function' && Game.knightIsGuarding(wolfTarget)) {
      result.killed = false;
      result.special = 'protected_by_knight';
      Game.magicianResetDaily();
      return result;
    }

    // Magician swap: the wolves think they killed A, but actually killed B
    var actualVictim = wolfTarget;
    var swap = Game.getMagicianSwap();
    if (swap && Game.isAlive('shen_shen')) {
      var resolved = Game.resolveSwapTarget(wolfTarget);
      if (resolved !== wolfTarget) {
        actualVictim = resolved;
        result.swapped = true;
        result.actualTarget = resolved;
        result.actualTargetName = GameState.PROFILES[resolved] ? GameState.PROFILES[resolved].name : resolved;

        // Hitting another wolf = friendly fire
        if (aliveWolves.indexOf(resolved) !== -1) {
          result.friendlyFire = true;
          result.special = 'friendly_fire';
          if (resolved === 'zhou_yang') {
            // Wolf king mutual kill: dies and takes the killer with them
            result.mutualKill = true;
            result.special = 'wolf_king_mutual';
            Game.kill('zhou_yang');
            if (killer) Game.kill(killer);
          } else {
            Game.kill(resolved);
          }
          Game.magicianResetDaily();
          return result;
        }
      }
    }

    Game.kill(actualVictim);

    // Mech wolf steals the god's power on a god kill
    if (killer === 'gu_yan' && godRoles.indexOf(Game.roleOf(actualVictim)) !== -1 && !Game.hasFlag('gu_yan_stole_god_power')) {
      Game.mechWolfStealPower(actualVictim);
    }

    // Cleaner removes the body so the witch cannot sense/revive it
    if (killer === 'zhao_mingcheng') {
      result.special = 'body_removed';
    }

    Game.magicianResetDaily();
    return result;
  };

  Game.getLastWolfKill = function () {
    var g = ensureState();
    return g.lastWolfKill || null;
  };

  Game.setLastWolfKill = function (result) {
    var g = ensureState();
    g.lastWolfKill = result;
  };

  // Gods draw power from the villagers' belief, so they may act at any time.
  Game.canGodAct = function () {
    return true;
  };

  Game.canWolfAct = function (charId) {
    if (Game.isNight()) return true;
    var role = Game.roleOf(charId);
    // Mech wolf may use a stolen god power during the day
    if (role === 'mechanical_wolf') {
      return !!Game.hasFlag('gu_yan_stole_god_power');
    }
    return false;
  };

  // Wolf king retaliation: triggered when killed by a villager/god, but NOT by curse.
  Game.canWolfKingRetaliate = function (causeOfDeath) {
    if (causeOfDeath === 'curse') return false;
    return true;
  };

  Game.resetGodSkillsDaily = function () {
    var g = ensureState();
    g.godSkills.knight.weakened = false;
  };

  Game.resetGodSkillsLoop = function () {
    var g = ensureState();
    g.godSkills.witch = { uses: 0, maxUses: 3, broken: false, hasReviveTarget: null, curses: [], actedTonight: false };
    g.godSkills.knight = { duelsUsed: 0, weakened: false, lastTarget: null };
    g.godSkills.prophet = { checks: [], exposed: false, sharedWith: {} };
  };
})();