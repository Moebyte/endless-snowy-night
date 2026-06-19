const fs = require('fs');

// 1. Update state.js
let state = fs.readFileSync('src/scripts/state.js', 'utf8');

// Add GOD_KILLERS constant after ROLES section
if (!state.includes('GameState.GOD_KILLERS')) {
  state = state.replace(
    /\};\n\n  \/\/ 创建全新游戏状态/,
    `\};\n\n  // 弑神者常量（村民中只有陈默和老郑可以弑神夺位）\n  GameState.GOD_KILLERS = {\n    CHEN_MO: 'chen_mo',\n    LAO_ZHENG: 'zheng_shoushan'\n  };\n\n  // 核心规则速查\n  // 1. 神职被系统告知：保护好没有能力的村民，他们的存在很重要。\n  // 2. 狼人第一晚会全员碰面，系统会告知各自技能。\n  // 3. 村民初始没有任何情报；老郑因上一轮幸存者有情报，陈默因轮回记忆有经验。\n  // 4. 村民中只有陈默和老郑可以触发“弑神夺位”。\n\n  // 创建全新游戏状态`
  );
}

fs.writeFileSync('src/scripts/state.js', state, 'utf8');
console.log('Updated src/scripts/state.js');

// 2. Update game.js
let game = fs.readFileSync('src/scripts/game.js', 'utf8');
if (!game.includes('Game.canKillGod')) {
  game = game.replace(
    '// ---------- 工具 ----------',
    `// ---------- 弑神规则 ----------\n  Game.canKillGod = function (charId) {\n    var g = ensureState();\n    var role = g.roles[charId];\n    // 狼人可以弑神（机械狼夺能力）\n    var wolfRoles = [\n      GameState.ROLES.WOLF_KING,\n      GameState.ROLES.HIDDEN_WOLF,\n      GameState.ROLES.WOLF,\n      GameState.ROLES.MECHANICAL_WOLF\n    ];\n    if (wolfRoles.indexOf(role) !== -1) {\n      return true;\n    }\n    // 村民中只有陈默和老郑可以弑神夺位\n    return charId === GameState.GOD_KILLERS.CHEN_MO || charId === GameState.GOD_KILLERS.LAO_ZHENG;\n  };\n\n  // ---------- 工具 ----------`
  );
}
fs.writeFileSync('src/scripts/game.js', game, 'utf8');
console.log('Updated src/scripts/game.js');

// 3. Update writing-guide.md
let guide = fs.readFileSync('docs/writing-guide.md', 'utf8');

// Fix old name 韩烈
if (guide.includes('韩烈')) {
  guide = guide.replace('韩烈会出现在这里。', '老郑会出现在这里。');
  guide = guide.replace("Game.setFlag('met_guardian')", "Game.setFlag('met_laozheng')");
}

// Add core rules section after title
if (!guide.includes('## 核心世界观规则')) {
  guide = guide.replace(
    '# 写作指南\n\n本文档面向后续参与剧情写作的作者。',
    `# 写作指南\n\n## 核心世界观规则\n\n在开始写作前，请理解以下世界规则：\n\n1. **7 天一轮回**：每天 06:00 开始，23:00 后各人回房，房间成为安全屋。\n2. **安全屋规则**：23:00 后除狼人外不得闯入他人房间；狼人每夜只能强闯一间安全屋。\n3. **情报差异**：\n   - 村民初始没有任何情报。\n   - 老郑是上一轮幸存者，知道山庄部分真相。\n   - 陈默因无限记忆保留跨轮回经验。\n4. **神职使命**：系统会告知所有神职——“保护好那些没有能力的人，他们的存在很重要。”\n5. **狼人首夜**：所有狼人第一晚会全员碰面，系统会告知各自技能。\n6. **弑神夺位**：\n   - 狼人弑神属于正常夜间博弈；机械狼顾言弑神后可获得该神职能力。\n   - 村民中只有陈默和老郑可以弑神并夺取神职能力。\n   - 苏晚、江白作为正面/无黑历史角色，原则上不触发弑神剧情。\n\n本文档面向后续参与剧情写作的作者。`
  );
}

fs.writeFileSync('docs/writing-guide.md', guide, 'utf8');
console.log('Updated docs/writing-guide.md');

// 4. Update outputs file rules section
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');

const newRulesSection = `## 二、核心规则摘要（剧本内部逻辑）\n\n1. **时间循环**：每 7 天为一个完整轮回。轮回内每天 06:00 正常推进，23:00 必须回到各自房间。第 7 天若未逃出山庄，全员因脱水和饥饿进入真实死亡。\n2. **安全屋规则**：23:00 后，每个人的房间即“安全屋”。所有人在自己的安全屋内是默认安全的；“狼”阵营每夜只能闯入一个安全屋。\n3. **重置条件**：主角陈默死亡，或第 7 天结束时仍未逃出，轮回会重置。主角回到下一轮的第 1 天 06:00，保留全部记忆；其他人和世界状态重置。\n4. **情报差异**：\n   - 村民初始没有任何情报。\n   - 老郑是上一轮轮回幸存者，知道山庄部分结构与规则。\n   - 陈默因无限记忆保留跨轮回经验与线索。\n5. **神职使命**：系统会告知所有神职——“保护好那些没有能力的人，他们的存在很重要。”神职力量 ∝ 存活村民数量，村民死越多，神越弱。\n6. **狼人首夜**：所有狼人第一晚会全员碰面，系统会告知各自技能。\n7. **弑神夺位**：\n   - 狼人弑神属于正常夜间博弈；机械狼顾言弑神后可获得该神职能力。\n   - 村民中只有陈默和老郑可以弑神并夺取神职能力。\n   - 苏晚、江白作为正面/无黑历史角色，原则上不触发弑神剧情。\n8. **禁止透露**：神职不可主动透露自己的身份与能力，违反者会受到系统惩罚（剧烈头痛、暂时失能，严重时直接死亡）。\n9. **SAN 值**：主角每次死亡、目睹惨剧、弑神都会降低；过低时出现幻觉与不可靠叙述。`;

const rulesStart = outputs.indexOf('## 二、核心规则摘要');
const rulesEnd = outputs.indexOf('### 二点一、神职能力');
if (rulesStart !== -1 && rulesEnd !== -1) {
  outputs = outputs.slice(0, rulesStart) + newRulesSection + '\n\n' + outputs.slice(rulesEnd);
  console.log('Updated outputs rules section');
} else {
  console.log('Could not find rules section boundaries');
}

fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs/暴风雪山庄_无限流_剧本_Pilot.md');