 /*
 * magician
 * ???????????????????????
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

Game.wasInLastSwap = function (charId) {

    var g = ensureState();

    var history = g.godSkills.magician.swapHistory;

    if (history.length === 0) return false;

    var last = history[history.length - 1];

    return last.a === charId || last.b === charId;

  }

Game.magicianSwap = function (charA, charB) {

    var g = ensureState();

    var m = g.godSkills.magician;

    if (m.swapsUsed >= m.maxSwaps) return { ok: false, reason: 'max_reached' };

    if (charA === charB) return { ok: false, reason: 'same_person' };

    if (!Game.isAlive(charA) || !Game.isAlive(charB)) return { ok: false, reason: 'dead' };

    if (Game.wasInLastSwap(charA)) return { ok: false, reason: 'repeated_' + charA };

    if (Game.wasInLastSwap(charB)) return { ok: false, reason: 'repeated_' + charB };

    m.swapsUsed += 1;

    m.currentSwap = { a: charA, b: charB };

    m.swapHistory.push({ day: g.day, a: charA, b: charB });

    return { ok: true, swap: m.currentSwap };

  }

Game.getMagicianSwap = function () {

    return ensureState().godSkills.magician.currentSwap;

  }

Game.resolveSwapTarget = function (charId) {

    var swap = Game.getMagicianSwap();

    if (!swap) return charId;

    if (swap.a === charId) return swap.b;

    if (swap.b === charId) return swap.a;

    return charId;

  }

Game.magicianSwapsRemaining = function () {

    var m = ensureState().godSkills.magician;

    return m.maxSwaps - m.swapsUsed;

  }

Game.magicianResetDaily = function () {

    var g = ensureState();

    g.godSkills.magician.currentSwap = null;

  }
})();
