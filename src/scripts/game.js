/*
 * game.js
 * Game API: items, clues, flags, endings, loop, safehouse
 */

(function () {
  'use strict';

  window.Game = window.Game || {};

  function migrateState(g) {
    if (!g) return g;
    // Backfill fields added after the original schema. Each branch is idempotent:
    // only seeds a field when missing, never overwrites existing save data.
    // Fresh defaults mirror GameState.create() (state.js).
    var fresh = GameState.create();
    if (!g.metCharacters) g.metCharacters = {};
    if (!g.characterReveals) g.characterReveals = {};
    if (!g.revealed) g.revealed = {};
    if (!g.visitedLocations) g.visitedLocations = {};
    if (!g.visited) g.visited = {};
    if (!g.safehouse) g.safehouse = fresh.safehouse;
    if (!g.godSkills) g.godSkills = fresh.godSkills;
    if (!g.traps) g.traps = fresh.traps;
    if (!g.medic) g.medic = fresh.medic;
    if (!g.hearer) g.hearer = fresh.hearer;
    if (!g.dayEvents) g.dayEvents = fresh.dayEvents;
    if (!g.memories) g.memories = fresh.memories;
    if (g.lastWolfKill === undefined) g.lastWolfKill = fresh.lastWolfKill;
    return g;
  }

  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return migrateState(State.variables.game);
  }

  // Public accessor: all modules should call Game.ensureState() rather than
  // redefining a local copy, so save migration runs uniformly everywhere.
  Game.ensureState = ensureState;

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

    // key clues that point to the true ending unlock the progress panel
    if (GameState.CLUES[id] && GameState.CLUES[id].breaking) {
      Game.setFlag('breaking_progress_unlocked', true);
    }

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


  // Returns array of alive character IDs
  Game.aliveCount = function () {
    var g = ensureState();
    return Object.keys(g.alive).filter(function(k) { return g.alive[k]; }).length;
  }

Game.aliveList = function () {
    var g = ensureState();
    return Object.keys(g.alive).filter(function (id) { return g.alive[id]; });
  };
  // ── Active status: alive AND not exiled ──
  // Use this for target selection, vote participation, AI decisions.
  // Use isAlive() when you need biological life/death (e.g. witch revive).
  Game.isActive = function (charId) {
    var g = ensureState();
    if (!g.alive[charId]) return false;
    if (typeof Game.isExiled === 'function' && Game.isExiled(charId)) return false;
    return true;
  };

  // Returns array of active (alive + not exiled) character IDs
  Game.activeList = function () {
    return Game.aliveList().filter(function (id) {
      return !(typeof Game.isExiled === 'function' && Game.isExiled(id));
    });
  };

  // Count of active characters
  Game.activeCount = function () {
    return Game.activeList().length;
  };

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

    if (typeof Game.resetGodSkillsLoop === 'function') Game.resetGodSkillsLoop();
    // [v9.5] Reset per-loop witch state.
    if (g.godSkills && g.godSkills.witch) {
      g.godSkills.witch.silverWater = null;
      g.godSkills.witch.sensedDeath = null;
      g.godSkills.witch.actedTonight = false;
    }
    g.revealed = {};

    // reset Jiang Bai trap system

    if (typeof Game.trapReset === 'function') Game.trapReset();
    if (typeof Game.medicReset === 'function') Game.medicReset();
    if (typeof Game.hearerReset === 'function') Game.hearerReset();
    if (typeof Game.selfStabReset === 'function') Game.selfStabReset();

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

 Game.getLocationsByZone = function (zoneId) {
   var result = [];
   var map = GameState.MAP;
   Object.keys(map).forEach(function (id) {
     if (map[id].zone === zoneId) {
       result.push({ id: id, name: map[id].name, desc: map[id].desc });
     }
   });
   return result;
 }

 Game.isZoneDiscovered = function (zoneId) {
   var g = ensureState();
   var visited = g.visitedLocations || {};
   var map = GameState.MAP;
   return Object.keys(visited).some(function (locId) {
     return visited[locId] && map[locId] && map[locId].zone === zoneId;
   });
 }

 Game.getVisitedLocationsInZone = function (zoneId) {
   var g = ensureState();
   var visited = g.visitedLocations || {};
   var map = GameState.MAP;
   var result = [];
   Object.keys(visited).forEach(function (locId) {
     if (visited[locId] && map[locId] && map[locId].zone === zoneId) {
       result.push({ id: locId, name: map[locId].name, desc: map[locId].desc });
     }
   });
   return result;
 }

Game.getStatus = function () {

    var g = ensureState();

    return {

      loop: g.loop,

      day: g.day,

      time: g.time,

      san: g.stats.san,

      hunger: g.stats.hunger,

      aliveCount: Game.activeCount()

    };

  }

  // ---------- character info management ----------

  Game.meetCharacter = function (charId) {
    var g = ensureState();
    if (!g.metCharacters) g.metCharacters = {};
    g.metCharacters[charId] = true;
    if (!g.characterReveals) g.characterReveals = {};
    if (!g.characterReveals[charId]) g.characterReveals[charId] = {};
  };

  Game.hasMetCharacter = function (charId) {
    var g = ensureState();
    return !!(g.metCharacters && g.metCharacters[charId]);
  };

  Game.revealCharacterAspect = function (charId, aspect) {
    var g = ensureState();
    if (!g.characterReveals) g.characterReveals = {};
    if (!g.characterReveals[charId]) g.characterReveals[charId] = {};
    g.characterReveals[charId][aspect] = true;
  };

  Game.hasRevealedCharacterAspect = function (charId, aspect) {
    var g = ensureState();
    return !!(g.characterReveals && g.characterReveals[charId] && g.characterReveals[charId][aspect]);
  };

  Game.witchBroken = function () {
    return !!ensureState().godSkills.witch.broken;
  };

  Game.knightWeakened = function () {
    var k = ensureState().godSkills.knight;
    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;
  };

  // migrate old saves that lack newer state fields
  if (window.Config && Config.saves) {
    var _origOnLoad = Config.saves.onLoad;
    Config.saves.onLoad = function (save) {
      if (save && save.state && save.state.variables && save.state.variables.game) {
        migrateState(save.state.variables.game);
      }
      if (_origOnLoad) _origOnLoad.apply(this, arguments);
    };
  }
})();
