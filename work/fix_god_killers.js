const fs = require('fs');
let state = fs.readFileSync('src/scripts/state.js', 'utf8');

if (!state.includes('GameState.GOD_KILLERS')) {
  const insert = `// 弑神者常量（村民中只有陈默和老郑可以弑神夺位）\n  GameState.GOD_KILLERS = {\n    CHEN_MO: 'chen_mo',\n    LAO_ZHENG: 'zheng_shoushan'\n  };\n\n  // 核心规则速查\n  // 1. 神职被系统告知：保护好没有能力的村民，他们的存在很重要。\n  // 2. 狼人第一晚会全员碰面，系统会告知各自技能。\n  // 3. 村民初始没有任何情报；老郑因上一轮幸存者有情报，陈默因轮回记忆有经验。\n  // 4. 村民中只有陈默和老郑可以触发“弑神夺位”。\n\n  `;
  state = state.replace('// 创建全新游戏状态', insert + '// 创建全新游戏状态');
  fs.writeFileSync('src/scripts/state.js', state, 'utf8');
  console.log('Added GOD_KILLERS to state.js');
} else {
  console.log('GOD_KILLERS already exists');
}