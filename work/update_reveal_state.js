const fs = require('fs');

// Update state.js
let state = fs.readFileSync('src/scripts/state.js', 'utf8');
if (!state.includes('revealed: {}')) {
  state = state.replace(
    '// passage 访问记录\n      visited: {},',
    '// passage 访问记录\n      visited: {},\n\n      // 已解锁的人物隐藏信息\n      revealed: {}'
  );
  fs.writeFileSync('src/scripts/state.js', state, 'utf8');
  console.log('Added revealed state');
}

// Update game.js
let game = fs.readFileSync('src/scripts/game.js', 'utf8');
if (!game.includes('Game.revealInfo')) {
  game = game.replace(
    '// ---------- 工具 ----------',
    `// ---------- 人物信息解锁 ----------\n  Game.revealInfo = function (charId, key) {\n    var g = ensureState();\n    if (!g.revealed) g.revealed = {};\n    if (!g.revealed[charId]) g.revealed[charId] = {};\n    g.revealed[charId][key] = true;\n  };\n\n  Game.hasRevealed = function (charId, key) {\n    var g = ensureState();\n    return !!(g.revealed && g.revealed[charId] && g.revealed[charId][key]);\n  };\n\n  // ---------- 工具 ----------`
  );
  fs.writeFileSync('src/scripts/game.js', game, 'utf8');
  console.log('Added revealInfo helpers');
}