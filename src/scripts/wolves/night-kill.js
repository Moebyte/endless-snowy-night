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

Game.executeWolfKill = function () {

    var g = ensureState();

    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];

    var wolfTarget = Game.getWolfTarget();

    if (!wolfTarget) return { target: null, killed: false };

    var aliveWolves = wolves.filter(function (w) { return g.alive[w]; });

    var availableKillers = aliveWolves.filter(function (w) {

      var swap = Game.getMagicianSwap();

      if (swap) {

        var resolved = Game.resolveSwapTarget(w);

        if (resolved === wolfTarget) return false;

      }

      return true;

    });

    if (availableKillers.length === 0) availableKillers = aliveWolves; // fallback

    var killer = null;

    if (availableKillers.length > 0) {

      if (isKnownGod && availableKillers.indexOf('gu_yan') !== -1 && !Game.hasMechWolfPower()) {

        killer = 'gu_yan';

      } else if (availableKillers.indexOf('zhao_mingcheng') !== -1 && Math.random() < 0.4) {

        killer = 'zhao_mingcheng';

      } else {

        var regulars = availableKillers.filter(function(w) {

          return w !== 'gu_yan' && w !== 'zhao_mingcheng';

        });

        if (regulars.length > 0) {

          killer = regulars[Math.floor(Math.random() * regulars.length)];

        } else {

          killer = availableKillers[Math.floor(Math.random() * availableKillers.length)];

        }

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

    if (Game.knightIsGuarding(wolfTarget)) {

      result.killed = false;

      result.special = 'protected_by_knight';

      Game.magicianResetDaily();

      return result;

    }

    var actualVictim = wolfTarget;

    var swap = Game.getMagicianSwap();

    if (swap && Game.isAlive('shen_shen')) {

      var resolved = Game.resolveSwapTarget(wolfTarget);

      if (resolved !== wolfTarget) {

        actualVictim = resolved;

        result.swapped = true;

        result.actualTarget = resolved;

        result.actualTargetName = GameState.PROFILES[resolved] ? GameState.PROFILES[resolved].name : resolved;

        if (aliveWolves.indexOf(resolved) !== -1) {

          result.friendlyFire = true;

          result.special = 'friendly_fire';

          if (resolved === 'zhou_yang') {

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

    var godRoles4 = ['prophet', 'witch', 'knight', 'magician'];

    if (killer === 'gu_yan' && godRoles4.indexOf(Game.roleOf(actualVictim)) !== -1 && !Game.hasFlag('gu_yan_stole_god_power')) {

      Game.mechWolfStealPower(actualVictim);

    }

    if (killer === 'zhao_mingcheng') {

      result.special = 'body_removed';

    }

    Game.magicianResetDaily();

    return result;

  }

Game.getLastWolfKill = function () {

    var g = ensureState();

    return g.lastWolfKill || null;

  }

Game.setLastWolfKill = function (result) {

    var g = ensureState();

    g.lastWolfKill = result;

  }

Game.canGodAct = function () {

    return true; // 缂備椒鑳堕崑鐘崇閹绢喗鍤勯柦妯侯槸閿熻棄绻樺鍫曞Ψ閿斿墽鍩嶆繛瀛樼矊鐎涒晛顭囧▎蹇ユ嫹濡鐓€缂佽鲸绻冪粙澶婎吋閸涱厾绉梺鍝勫暙閻栫厧螞閸ф鈷旈柟甯嫹闁糕敒?
  }

Game.canWolfAct = function (charId) {

    if (Game.isNight()) return true;

    var role = Game.roleOf(charId);

    if (role === 'mechanical_wolf') {

      return !!Game.hasFlag('gu_yan_stole_god_power');

    }

    return false;

  }

Game.canWolfKingRetaliate = function (causeOfDeath) {

    if (causeOfDeath === 'curse') return false;

    return true; // 闂佺绻戝﹢鍦垝閿熻姤鎱ㄥ┑濠忔嫹閸欏顦梺鎸庣☉閻楀棝宕伴崨鏉戞婵＄偟銆嬮幏閿嬫媴閸濄儲鎮欑紓浣疯兌閸嬬喖鎮洪幋锔芥櫖濠㈣泛锕ョ紞鍡涙煕濞嗘瑦瀚归梺鍛婄懕锟??

  }

Game.resetGodSkillsDaily = function () {

    var g = ensureState();

    g.godSkills.knight.weakened = false;

  }

Game.resetGodSkillsLoop = function () {

    var g = ensureState();

    g.godSkills.witch = { uses: 0, maxUses: 3, broken: false, hasReviveTarget: null, curses: [], actedTonight: false };

    g.godSkills.knight = { duelsUsed: 0, weakened: false, lastTarget: null };

    g.godSkills.prophet = { checks: [], exposed: false, sharedWith: {} };

  }
})();
