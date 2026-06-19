/*
 * game.js
 * Game API: items, clues, flags, endings, loop, safehouse
 */

(function () {
  'use strict';

  window.Game = window.Game || {};

  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return State.variables.game;
  }

Game.addItem = function (id, count) {

    var g = ensureState();

    count = count || 1;

    g.inventory[id] = (g.inventory[id] || 0) + count;

  }

Game.removeItem = function (id, count) {

    var g = ensureState();

    count = count || 1;

    if (!g.inventory[id]) return false;

    g.inventory[id] -= count;

    if (g.inventory[id] <= 0) delete g.inventory[id];

    return true;

  }

Game.hasItem = function (id) {

    var g = ensureState();

    return (g.inventory[id] || 0) > 0;

  }

Game.itemCount = function (id) {

    var g = ensureState();

    return g.inventory[id] || 0;

  }

Game.itemName = function (id) {

    var item = GameState.ITEMS[id];

    return item ? item.name : id;

  }

Game.addClue = function (id) {

    var g = ensureState();

    g.clues[id] = true;

  }

Game.hasClue = function (id) {

    var g = ensureState();

    return !!g.clues[id];

  }

Game.clueName = function (id) {

    var clue = GameState.CLUES[id];

    return clue ? clue.name : id;

  }

Game.clueDesc = function (id) {

    var clue = GameState.CLUES[id];

    return clue ? clue.desc : '';

  }

Game.setFlag = function (id, value) {

    var g = ensureState();

    g.flags[id] = value === undefined ? true : value;

  }

Game.hasFlag = function (id) {

    var g = ensureState();

    return !!g.flags[id];

  }

Game.unlockEnding = function (id) {

    var g = ensureState();

    g.endings[id] = true;

  }

Game.hasEnding = function (id) {

    var g = ensureState();

    return !!g.endings[id];

  }

Game.visit = function (passageName) {

    var g = ensureState();

    passageName = passageName || passage();

    g.visited[passageName] = (g.visited[passageName] || 0) + 1;

  }

Game.hasVisited = function (passageName) {

    var g = ensureState();

    return (g.visited[passageName] || 0) > 0;

  }

Game.visitCount = function (passageName) {

    var g = ensureState();

    return g.visited[passageName] || 0;

  }

Game.isAlive = function (charId) {

    var g = ensureState();

    return !!g.alive[charId];

  }

Game.kill = function (charId) {

    var g = ensureState();

    g.alive[charId] = false;

  }

Game.revive = function (charId) {

    var g = ensureState();

    g.alive[charId] = true;

  }

Game.roleOf = function (charId) {

    var g = ensureState();

    return g.roles[charId] || 'villager';

  }

Game.changeSan = function (delta) {

    var g = ensureState();

    g.stats.san = Math.max(0, Math.min(100, g.stats.san + delta));

  }

Game.san = function () {

    return ensureState().stats.san;

  }

Game.changeTrust = function (charId, delta) {

    var g = ensureState();

    var key = 'trust_' + charId;

    if (g.stats[key] !== undefined) {

      g.stats[key] = Math.max(0, Math.min(100, g.stats[key] + delta));

    }

  }

Game.trust = function (charId) {

    var g = ensureState();

    return g.stats['trust_' + charId] || 0;

  }

Game.nextLoop = function () {

    var g = ensureState();

    // save current breaking_ready state

    var wasBreakingReady = !!g.flags.breaking_ready;

    var breakingJustCompleted = Game.checkBreakingReady();

    g.loop += 1;

    g.day = 1;

    g.time = '06:00';

    g.chapter = 1;

    // save current breaking_ready state
    Game.resetLoopState();

    // preserve breaking_ready across loop reset

    if (wasBreakingReady || breakingJustCompleted) {

      g.flags.breaking_ready = true;

    }

    // sanity penalty if still stuck in loop

    if (!g.flags.breaking_ready) {

      Game.changeSan(-10);

    }

    Game.addMemory('Loop ' + g.loop + ' begins' + (breakingJustCompleted ? ' (breaking ready)' : ''));

  }

Game.nextDay = function () {

    var g = ensureState();

    g.day += 1;

    g.time = '06:00';

    // reset safehouse status for the new day

    g.safehouse = { intruded: false, target: null };

    if (g.day > 7) {

      // after day 7, start next loop

      Game.nextLoop();

    } else if (g.day === 7) {

      g.stats.hunger = Math.min(100, g.stats.hunger + 50);

    }

  }

Game.resetLoopState = function () {

    var g = ensureState();

    g.alive = {

      chen_mo: true,

      su_wan: true,

      jiang_bai: true,

      fang_heng: true,

      shen_shen: true,

      ye_zhiqiu: true,

      zheng_shoushan: true,

      lin_xiaoman: true,

      gu_yan: true,

      zhou_yang: true,

      tang_xiaotang: true,

      zhao_mingcheng: true

    };

    g.roles = {

      chen_mo: 'memory',

      su_wan: 'villager',

      jiang_bai: 'villager',

      fang_heng: 'prophet',

      shen_shen: 'magician',

      ye_zhiqiu: 'witch',

      zheng_shoushan: 'villager',

      lin_xiaoman: 'knight',

      gu_yan: 'mechanical_wolf',

      zhou_yang: 'wolf_king',

      tang_xiaotang: 'hidden_wolf',

      zhao_mingcheng: 'wolf'

    };

    g.flags = {};

    g.inventory = {};

    g.stats.hunger = 0;

    // reset safehouse status

    g.safehouse = { intruded: false, target: null };

    // reset clues, memories, endings

    // reset god skills for new loop

    Game.resetGodSkillsLoop();

  }

Game.advanceDay = function () {

    var g = ensureState();

    var prevLoop = g.loop;

    Game.nextDay();

    return g.loop !== prevLoop;

  }

Game.addMemory = function (text) {

    var g = ensureState();

    g.memories.push({ loop: g.loop, day: g.day, text: text });

  }

Game.isNight = function () {

    return ensureState().time >= '23:00';

  }

Game.canWolfIntrude = function () {

    var g = ensureState();

    return Game.isNight() && !g.safehouse.intruded;

  }

Game.wolfIntrude = function (target) {

    var g = ensureState();

    if (!Game.canWolfIntrude()) return false;

    g.safehouse.intruded = true;

    g.safehouse.target = target || null;

    return true;

  }

Game.getSafehouseTarget = function () {

    return ensureState().safehouse.target;

  }

Game.clearSafehouse = function () {

    var g = ensureState();

    g.safehouse.intruded = false;

    g.safehouse.target = null;

  }

Game.canKillGod = function (charId) {

    var g = ensureState();

    var role = g.roles[charId];

    // 闁绘瑩妫垮Ч澶愬矗閿熻姤绂掗妷 鎼愮紒浣哄剳缁辨瑩寮甸悜姗堟嫹閹?鐎氱偓寰勬ウ鍨幋闁告梹鍐荤槐 

    var wolfRoles = [

      GameState.ROLES.WOLF_KING,

      GameState.ROLES.HIDDEN_WOLF,

      GameState.ROLES.WOLF,

      GameState.ROLES.MECHANICAL_WOLF

    ];

    if (wolfRoles.indexOf(role) !== -1) {

      return true;

    }

    // 闁哄鍨堕惃 濞戞搫鎷烽柛娆欐嫹闁哄牆 鎰?鍙?娑?閹蜂即鎳撴笟 閸庢粓宕ｉ敓鑺ョ閵?鎼愮紒浣哄仜閵囨碍鎷呴敓 

    return charId === GameState.GOD_KILLERS.CHEN_MO || charId === GameState.GOD_KILLERS.LAO_ZHENG;

  }

Game.revealInfo = function (charId, key) {

    var g = ensureState();

    if (!g.revealed) g.revealed = {};

    if (!g.revealed[charId]) g.revealed[charId] = {};

    g.revealed[charId][key] = true;

  }

Game.hasRevealed = function (charId, key) {

    var g = ensureState();

    return !!(g.revealed && g.revealed[charId] && g.revealed[charId][key]);

  }

Game.hasAllBreakingClues = function () {

    return GameState.BREAKING_CLUES.every(function (id) { return !!ensureState().clues[id]; });

  }

Game.trueEndingProgress = function () {

    var g = ensureState(); var t = GameState.BREAKING_CLUES.length;

    var c = GameState.BREAKING_CLUES.filter(function (id) { return !!g.clues[id]; }).length;

    return { collected: c, total: t };

  }

Game.checkBreakingReady = function () {

    var g = ensureState();

    if (Game.hasAllBreakingClues() && !g.flags.breaking_ready) { g.flags.breaking_ready = true; return true; }

    return false;

  }

Game.canReachTrueEnding = function () {

    var g = ensureState();

    return !!g.flags.breaking_ready && g.day >= 7 && Game.isAlive('su_wan');

  }

Game.revealBackstory = function (charId) {

    var cid = GameState.BACKSTORY_KEYS[charId];

    if (cid) Game.addClue(cid);

    Game.revealInfo(charId, 'backstory');

  }

Game.hasBackstory = function (charId) {

    var cid = GameState.BACKSTORY_KEYS[charId];

    return cid ? Game.hasClue(cid) : false;

  }

Game.visitLocation = function (locId) {

    var g = ensureState();

    if (!g.visitedLocations) g.visitedLocations = {};

    g.visitedLocations[locId] = (g.visitedLocations[locId] || 0) + 1;

  }

Game.hasVisitedLocation = function (locId) {

    var g = ensureState();

    return !!(g.visitedLocations && g.visitedLocations[locId]);

  }

Game.getStatus = function () {

    var g = ensureState();

    return {

      loop: g.loop,

      day: g.day,

      time: g.time,

      san: g.stats.san,

      hunger: g.stats.hunger,

      aliveCount: Object.keys(g.alive).filter(function (k) { return g.alive[k]; }).length

    };

  }

  // ---------- ?? ----------
  Game.getStatus = function () {
    var g = ensureState();
    return {
      loop: g.loop,
      day: g.day,
      time: g.time,
      san: g.stats.san,
      hunger: g.stats.hunger,
      aliveCount: Object.keys(g.alive).filter(function (k) { return g.alive[k]; }).length
    };
  };
})();
