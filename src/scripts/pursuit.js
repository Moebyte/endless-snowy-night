/*
 * pursuit.js - Night pursuit system: wolf hunts player across the manor map
 */

(function () {
  'use strict';

  var ensureState = Game.ensureState;

  Game.HIDE_SPOTS = ['pantry', 'gallery', 'children_room', 'sewing_room', 'chapel', 'well'];

  Game.PURSUIT_MAP = {
    guest_corridor: ['grand_hall', 'master_bedroom', 'sewing_room', 'balcony'],
    grand_hall: ['guest_corridor', 'dining_room', 'kitchen', 'drawing_room', 'foyer'],
    dining_room: ['grand_hall', 'kitchen'],
    kitchen: ['grand_hall', 'dining_room', 'pantry'],
    pantry: ['kitchen'],
    drawing_room: ['grand_hall', 'study'],
    study: ['drawing_room', 'gallery'],
    gallery: ['study'],
    master_bedroom: ['guest_corridor', 'children_room'],
    children_room: ['master_bedroom', 'sewing_room'],
    sewing_room: ['guest_corridor', 'children_room'],
    balcony: ['guest_corridor'],
    foyer: ['grand_hall', 'courtyard'],
    courtyard: ['foyer', 'garden', 'chapel', 'well'],
    garden: ['courtyard', 'chapel'],
    chapel: ['courtyard', 'garden'],
    well: ['courtyard']
  };

  Game.canTriggerPursuit = function () {
    var g = ensureState();
    var active = Game.activeCount();
    return active <= 6 && Game.isNight();
  };

  Game.startPursuit = function (wolfId) {
    var g = ensureState();
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];

    if (!g.pursuit) g.pursuit = {};
    g.pursuit.active = true;
    g.pursuit.turn = 1;
    g.pursuit.playerPos = 'guest_corridor';
    g.pursuit.wolfPos = 'grand_hall';
    g.pursuit.wolfId = wolfId || wolves.filter(function (w) { return g.alive[w]; })[0] || 'zhou_yang';
    g.pursuit.hiding = false;
    g.pursuit.playerInjured = false;
    g.pursuit.escaped = false;
  };

  Game.isPursuitActive = function () {
    var g = ensureState();
    if (!g.pursuit) return false;
    return !!g.pursuit.active;
  };

  Game.getPursuitWolf = function () {
    var g = ensureState();
    return g.pursuit ? g.pursuit.wolfId : null;
  };

  Game.canHideAt = function (locId) {
    return Game.HIDE_SPOTS.indexOf(locId) !== -1;
  };

  Game.pursuitMove = function (locId) {
    var g = ensureState();
    if (!g.pursuit) return false;
    var adj = Game.PURSUIT_MAP[g.pursuit.playerPos] || [];
    if (adj.indexOf(locId) === -1) return false;
    g.pursuit.playerPos = locId;
    g.pursuit.hiding = false;
    return true;
  };

  Game.pursuitHide = function () {
    var g = ensureState();
    if (!g.pursuit) return false;
    if (Game.canHideAt(g.pursuit.playerPos)) {
      g.pursuit.hiding = true;
      return true;
    }
    return false;
  };

  Game.pursuitUseItem = function (itemId) {
    if (!Game.hasItem(itemId)) return null;

    var eff = {
      flashlight: 'The beam stuns the wolf for a moment, buying you distance.',
      lighter: 'A flare of light startles the wolf, slowing its advance.',
      wire: 'You trip the wolf with the wire and gain a turn.',
      pocket_knife: 'You slash back. The wolf recoils, wounded.',
      ritual_dagger: 'The cursed blade bites deep. The wolf howls and falls back.',
      first_aid_kit: 'You patch your wounds and steady your nerves.',
      bread: 'You choke down the dry bread. A little strength returns.',
      mirror_shard: 'The shard flashes in the dark, confusing the wolf.'
    };

    Game.removeItem(itemId);
    return eff[itemId] || 'The item has no noticeable effect.';
  };

  Game.pursuitDistance = function (from, to) {
    if (from === to) return 0;
    var visited = {};
    var queue = [[from, 0]];
    visited[from] = true;

    while (queue.length > 0) {
      var item = queue.shift();
      var node = item[0];
      var dist = item[1];
      var adj = Game.PURSUIT_MAP[node] || [];

      for (var i = 0; i < adj.length; i++) {
        if (adj[i] === to) return dist + 1;
        if (!visited[adj[i]]) {
          visited[adj[i]] = true;
          queue.push([adj[i], dist + 1]);
        }
      }

      if (dist > 10) break;
    }

    return 99;
  };

  Game.wolfTurn = function () {
    var g = ensureState();
    if (!g.pursuit) return 'inactive';

    var adj = Game.PURSUIT_MAP[g.pursuit.wolfPos] || [];
    var pp = g.pursuit.playerPos;

    if (g.pursuit.wolfPos === pp) {
      if (g.pursuit.hiding) {
        if (Math.random() < 0.4) {
          g.pursuit.hiding = false;
          g.pursuit.playerInjured = true;
          Game.changeSan(-10);
          return 'found';
        }
        return 'missed';
      }
      g.pursuit.playerInjured = true;
      Game.changeSan(-15);
      return 'attacked';
    }

    var best = null;
    var bd = 999;
    for (var i = 0; i < adj.length; i++) {
      var d = Game.pursuitDistance(adj[i], pp);
      if (d < bd) { bd = d; best = adj[i]; }
    }

    if (best) {
      g.pursuit.wolfPos = best;
      if (best === pp && !g.pursuit.hiding) {
        g.pursuit.playerInjured = true;
        Game.changeSan(-15);
        return 'caught_up';
      }
      if (best === pp && g.pursuit.hiding && Math.random() < 0.4) {
        g.pursuit.hiding = false;
        g.pursuit.playerInjured = true;
        Game.changeSan(-10);
        return 'found';
      }
    }

    return 'moved';
  };

  Game.pursuitNextTurn = function () {
    var g = ensureState();
    if (!g.pursuit || !g.pursuit.active) return 'inactive';

    g.pursuit.turn += 1;
    var r = Game.wolfTurn();

    if (g.stats.san <= 0) {
      g.pursuit.active = false;
      return 'defeated';
    }

    if (g.pursuit.turn > 5) {
      g.pursuit.active = false;
      g.pursuit.escaped = true;
      return 'dawn';
    }

    return r;
  };

  Game.endPursuit = function () {
    var g = ensureState();
    if (g.pursuit) g.pursuit.active = false;
  };

  Game.isInjured = function () {
    var g = ensureState();
    return !!(g.pursuit && g.pursuit.playerInjured);
  };

  Game.getPursuitMoves = function () {
    var g = ensureState();
    if (!g.pursuit) return [];
    return Game.PURSUIT_MAP[g.pursuit.playerPos] || [];
  };
})();