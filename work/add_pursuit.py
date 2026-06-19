p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
content = f.read()
f.close()

pursuit_api = '''
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

  Game.isPursuitActive = function () {
    return !!ensureState().pursuit.active;
  };

  Game.getPursuitWolf = function () {
    return ensureState().pursuit.wolfId;
  };

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
    well: ['courtyard'],
    library: ['grand_hall', 'music_room', 'broadcast_room'],
    music_room: ['library'],
    broadcast_room: ['library', 'conservatory'],
    conservatory: ['broadcast_room'],
    generator_room: ['grand_hall', 'workshop', 'wine_cellar'],
    workshop: ['generator_room', 'armory'],
    armory: ['workshop'],
    wine_cellar: ['generator_room'],
    attic: ['guest_corridor'],
    archive_room: ['attic']
  };

  Game.HIDE_SPOTS = ['pantry', 'gallery', 'children_room', 'sewing_room', 'attic', 'archive_room', 'armory', 'conservatory', 'chapel', 'well'];

  Game.canHideAt = function (locId) {
    return Game.HIDE_SPOTS.indexOf(locId) !== -1;
  };

  Game.pursuitMove = function (locId) {
    var g = ensureState();
    var adjacent = Game.PURSUIT_MAP[g.pursuit.playerPos] || [];
    if (adjacent.indexOf(locId) === -1) return false;
    g.pursuit.playerPos = locId;
    g.pursuit.hiding = false;
    return true;
  };

  Game.pursuitHide = function () {
    var g = ensureState();
    if (Game.canHideAt(g.pursuit.playerPos)) {
      g.pursuit.hiding = true;
      return true;
    }
    return false;
  };

  Game.pursuitUseItem = function (itemId) {
    if (!Game.hasItem(itemId)) return null;
    var effects = {
      flashlight: '你用手电筒猛照狼人的眼睛，它惨叫着后退了几步。',
      lighter: '你点燃窗帘，火光阻挡了狼人的去路。',
      wire: '你在门口布下金属丝绊索，狼人被绊倒摔了一跤。',
      pocket_knife: '你挥舞折叠小刀逼退了狼人，但它只是退后了一步。',
      ritual_dagger: '祭祀骨刀发出幽光，狼人发出恐惧的低吼，暂时不敢靠近。',
      first_aid_kit: '你用急救包处理了伤口，感觉恢复了些体力。',
      bread: '你扔出干粮引开狼人的注意力，它迟疑了一瞬间。',
      mirror_shard: '镜子碎片反射出狼人的影子，它似乎被震慑了。'
    };
    Game.removeItem(itemId);
    return effects[itemId] || '道具没有明显效果。';
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
      var adjacent = Game.PURSUIT_MAP[node] || [];
      for (var i = 0; i < adjacent.length; i++) {
        var next = adjacent[i];
        if (next === to) return dist + 1;
        if (!visited[next]) {
          visited[next] = true;
          queue.push([next, dist + 1]);
        }
      }
      if (dist > 10) break;
    }
    return 99;
  };

  Game.wolfTurn = function () {
    var g = ensureState();
    var adjacent = Game.PURSUIT_MAP[g.pursuit.wolfPos] || [];
    var playerPos = g.pursuit.playerPos;

    if (g.pursuit.wolfPos === playerPos) {
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

    var bestMove = null;
    var bestDist = 999;
    for (var i = 0; i < adjacent.length; i++) {
      var dist = Game.pursuitDistance(adjacent[i], playerPos);
      if (dist < bestDist) {
        bestDist = dist;
        bestMove = adjacent[i];
      }
    }
    if (bestMove) {
      g.pursuit.wolfPos = bestMove;
      if (bestMove === playerPos && !g.pursuit.hiding) {
        g.pursuit.playerInjured = true;
        Game.changeSan(-15);
        return 'caught_up';
      }
      if (bestMove === playerPos && g.pursuit.hiding) {
        if (Math.random() < 0.4) {
          g.pursuit.hiding = false;
          g.pursuit.playerInjured = true;
          Game.changeSan(-10);
          return 'found';
        }
      }
    }
    return 'moved';
  };

  Game.pursuitNextTurn = function () {
    var g = ensureState();
    g.pursuit.turn += 1;
    var result = Game.wolfTurn();
    if (g.stats.san <= 0) {
      g.pursuit.active = false;
      return 'defeated';
    }
    if (g.pursuit.turn > 5) {
      g.pursuit.active = false;
      g.pursuit.escaped = true;
      return 'dawn';
    }
    return result;
  };

  Game.endPursuit = function () {
    ensureState().pursuit.active = false;
  };

  Game.isInjured = function () {
    return !!ensureState().pursuit.playerInjured;
  };

  Game.getPursuitMoves = function () {
    var g = ensureState();
    return Game.PURSUIT_MAP[g.pursuit.playerPos] || [];
  };

'''

marker = '  // ---------- 真结局系统 ----------'
if marker in content:
    content = content.replace(marker, pursuit_api + '\n' + marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(content)
    f.close()
    print('OK - pursuit API added. Length:', len(content))
else:
    print('ERROR: marker not found')
