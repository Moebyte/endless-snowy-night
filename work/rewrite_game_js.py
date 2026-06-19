# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
content = f.read()
f.close()

# Insert true ending + pursuit + location APIs before the getStatus function
# First find the getStatus marker
marker = '  // ----------'
# Find the last occurrence of a comment section before getStatus
status_idx = content.find('Game.getStatus = function')
if status_idx == -1:
    print('ERROR: getStatus not found')
    exit(1)

# Find the comment line before getStatus
comment_start = content.rfind('\n  //', 0, status_idx)
if comment_start == -1:
    print('ERROR: comment before getStatus not found')
    exit(1)

new_block = '''
  // ---------- 追击战系统 ----------
  Game.canTriggerPursuit = function () {
    var g = ensureState();
    var alive = Object.keys(g.alive).filter(function (k) { return g.alive[k]; }).length;
    return alive <= 6 && Game.isNight();
  };

  Game.startPursuit = function (wolfId) {
    var g = ensureState();
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];
    g.pursuit.active = true;
    g.pursuit.turn = 1;
    g.pursuit.playerPos = 'guest_corridor';
    g.pursuit.wolfPos = 'grand_hall';
    g.pursuit.wolfId = wolfId || wolves.filter(function (w) { return g.alive[w]; })[0] || 'zhou_yang';
    g.pursuit.hiding = false;
    g.pursuit.playerInjured = false;
    g.pursuit.escaped = false;
  };

  Game.isPursuitActive = function () { return !!ensureState().pursuit.active; };
  Game.getPursuitWolf = function () { return ensureState().pursuit.wolfId; };

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

  Game.HIDE_SPOTS = ['pantry', 'gallery', 'children_room', 'sewing_room', 'chapel', 'well'];

  Game.canHideAt = function (locId) { return Game.HIDE_SPOTS.indexOf(locId) !== -1; };

  Game.pursuitMove = function (locId) {
    var g = ensureState();
    var adj = Game.PURSUIT_MAP[g.pursuit.playerPos] || [];
    if (adj.indexOf(locId) === -1) return false;
    g.pursuit.playerPos = locId;
    g.pursuit.hiding = false;
    return true;
  };

  Game.pursuitHide = function () {
    var g = ensureState();
    if (Game.canHideAt(g.pursuit.playerPos)) { g.pursuit.hiding = true; return true; }
    return false;
  };

  Game.pursuitUseItem = function (itemId) {
    if (!Game.hasItem(itemId)) return null;
    var eff = {
      flashlight: '\u4f60\u7528\u624b\u7535\u7b52\u731b\u7167\u72fc\u4eba\u7684\u773c\u775b\uff0c\u5b83\u60e8\u53eb\u7740\u540e\u9000\u3002',
      lighter: '\u4f60\u70b9\u71c3\u7a97\u5e18\uff0c\u706b\u5149\u963b\u6321\u4e86\u72fc\u4eba\u7684\u53bb\u8def\u3002',
      wire: '\u4f60\u5728\u95e8\u53e3\u5e03\u4e0b\u91d1\u5c5e\u4e1d\u7eca\u7d22\uff0c\u72fc\u4eba\u88ab\u7eca\u5012\u3002',
      pocket_knife: '\u4f60\u6325\u821e\u6298\u53e0\u5c0f\u5200\u903c\u9000\u4e86\u72fc\u4eba\u3002',
      ritual_dagger: '\u796d\u7940\u9aa8\u5200\u53d1\u51fa\u5e7d\u5149\uff0c\u72fc\u4eba\u4e0d\u6562\u9760\u8fd1\u3002',
      first_aid_kit: '\u4f60\u7528\u6025\u6551\u5305\u5904\u7406\u4e86\u4f24\u53e3\u3002',
      bread: '\u4f60\u6254\u51fa\u5e72\u7cae\u5f15\u5f00\u72fc\u4eba\u6ce8\u610f\u529b\u3002',
      mirror_shard: '\u955c\u5b50\u788e\u7247\u53cd\u5c04\u51fa\u72fc\u4eba\u7684\u5f71\u5b50\uff0c\u5b83\u88ab\u9707\u6151\u4e86\u3002'
    };
    Game.removeItem(itemId);
    return eff[itemId] || '\u9053\u5177\u6ca1\u6709\u660e\u663e\u6548\u679c\u3002';
  };

  Game.pursuitDistance = function (from, to) {
    if (from === to) return 0;
    var visited = {}; var queue = [[from, 0]]; visited[from] = true;
    while (queue.length > 0) {
      var item = queue.shift(); var node = item[0]; var dist = item[1];
      var adj = Game.PURSUIT_MAP[node] || [];
      for (var i = 0; i < adj.length; i++) {
        if (adj[i] === to) return dist + 1;
        if (!visited[adj[i]]) { visited[adj[i]] = true; queue.push([adj[i], dist + 1]); }
      }
      if (dist > 10) break;
    }
    return 99;
  };

  Game.wolfTurn = function () {
    var g = ensureState();
    var adj = Game.PURSUIT_MAP[g.pursuit.wolfPos] || [];
    var pp = g.pursuit.playerPos;
    if (g.pursuit.wolfPos === pp) {
      if (g.pursuit.hiding) {
        if (Math.random() < 0.4) { g.pursuit.hiding = false; g.pursuit.playerInjured = true; Game.changeSan(-10); return 'found'; }
        return 'missed';
      }
      g.pursuit.playerInjured = true; Game.changeSan(-15); return 'attacked';
    }
    var best = null; var bd = 999;
    for (var i = 0; i < adj.length; i++) {
      var d = Game.pursuitDistance(adj[i], pp);
      if (d < bd) { bd = d; best = adj[i]; }
    }
    if (best) {
      g.pursuit.wolfPos = best;
      if (best === pp && !g.pursuit.hiding) { g.pursuit.playerInjured = true; Game.changeSan(-15); return 'caught_up'; }
      if (best === pp && g.pursuit.hiding && Math.random() < 0.4) { g.pursuit.hiding = false; g.pursuit.playerInjured = true; Game.changeSan(-10); return 'found'; }
    }
    return 'moved';
  };

  Game.pursuitNextTurn = function () {
    var g = ensureState();
    g.pursuit.turn += 1;
    var r = Game.wolfTurn();
    if (g.stats.san <= 0) { g.pursuit.active = false; return 'defeated'; }
    if (g.pursuit.turn > 5) { g.pursuit.active = false; g.pursuit.escaped = true; return 'dawn'; }
    return r;
  };

  Game.endPursuit = function () { ensureState().pursuit.active = false; };
  Game.isInjured = function () { return !!ensureState().pursuit.playerInjured; };
  Game.getPursuitMoves = function () { return Game.PURSUIT_MAP[ensureState().pursuit.playerPos] || []; };

  // ---------- 真结局系统 ----------
  Game.hasAllBreakingClues = function () {
    return GameState.BREAKING_CLUES.every(function (id) { return !!ensureState().clues[id]; });
  };
  Game.trueEndingProgress = function () {
    var g = ensureState(); var t = GameState.BREAKING_CLUES.length;
    var c = GameState.BREAKING_CLUES.filter(function (id) { return !!g.clues[id]; }).length;
    return { collected: c, total: t };
  };
  Game.checkBreakingReady = function () {
    var g = ensureState();
    if (Game.hasAllBreakingClues() && !g.flags.breaking_ready) { g.flags.breaking_ready = true; return true; }
    return false;
  };
  Game.canReachTrueEnding = function () {
    var g = ensureState();
    return !!g.flags.breaking_ready && g.day >= 7 && Game.isAlive('su_wan');
  };
  Game.revealBackstory = function (charId) {
    var cid = GameState.BACKSTORY_KEYS[charId];
    if (cid) Game.addClue(cid);
    Game.revealInfo(charId, 'backstory');
  };
  Game.hasBackstory = function (charId) {
    var cid = GameState.BACKSTORY_KEYS[charId];
    return cid ? Game.hasClue(cid) : false;
  };
  Game.visitLocation = function (locId) {
    var g = ensureState();
    if (!g.visitedLocations) g.visitedLocations = {};
    g.visitedLocations[locId] = (g.visitedLocations[locId] || 0) + 1;
  };
  Game.hasVisitedLocation = function (locId) {
    var g = ensureState();
    return !!(g.visitedLocations && g.visitedLocations[locId]);
  };

''';

content = content[:comment_start] + new_block + content[comment_start:]

f = open(p, 'w', encoding='utf-8')
f.write(content)
f.close()
print('OK - all APIs inserted. Length:', len(content))