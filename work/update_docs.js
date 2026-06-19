const fs = require('fs');

// Update variable-guide.md
let guide = fs.readFileSync('docs/variable-guide.md', 'utf8');

// Fix state structure block
guide = guide.replace(
/```javascript\n\{\n  chapter: 1,[\s\S]*?memories: \[\][\s\S]*?\}\n```/,
`\`\`\`javascript
{
  chapter: 1,        // 当前章节
  loop: 1,           // 当前轮回
  day: 1,            // 轮回内第几天（1-7）
  time: '06:00',     // 当前时间

  stats: {
    san: 100,        // 理智值 0-100
    hunger: 0,       // 饥饿值 0-100
    trust_suwan: 50, // 苏晚信任度
    trust_jiangbai: 30,
    trust_fang: 30,
    trust_shenshen: 20,
    fear_level: 0
  },

  alive: { /* 角色存活状态 */ },
  roles: { /* 角色当前身份 */ },

  inventory: {},     // 道具
  clues: {},         // 线索
  flags: {},         // 关键事件标记
  endings: {},       // 已解锁结局
  visited: {},       // passage 访问次数

  safehouse: {       // 安全屋状态
    intruded: false,
    target: null
  },

  memories: []       // 跨轮回记忆碎片
}
\`\`\``
);

// Add safehouse API section after 循环 section
guide = guide.replace(
/### 循环\n\n- `Game\.nextDay\(\)`[{\s\S]*?重置轮回内世界状态（人物、身份、flags、道具）`\n/,
`### 循环

- \`Game.nextDay()\`：进入下一天，若超过第 7 天则自动进入下一轮
- \`Game.nextLoop()\`：强制进入下一轮
- \`Game.advanceDay()\`：进入下一天，返回是否进入新轮回
- \`Game.resetLoopState()\`：重置轮回内世界状态（人物、身份、flags、道具）

### 安全屋

- \`Game.isNight()\`：当前时间是否 >= 23:00
- \`Game.canWolfIntrude()\`：今夜是否还能强闯一间安全屋
- \`Game.wolfIntrude(target)\`：记录狼人强闯目标（每晚只能成功一次）
- \`Game.getSafehouseTarget()\`：获取今晚被强闯的目标
- \`Game.clearSafehouse()\`：重置当晚安全屋状态（进入新一天时自动调用）
`
);

fs.writeFileSync('docs/variable-guide.md', guide, 'utf8');
console.log('Updated docs/variable-guide.md');

// Update README.md title
let readme = fs.readFileSync('README.md', 'utf8');
readme = readme.replace(/^# 第七日轮回/m, '# 无尽雪夜');
readme = readme.replace(/基于《暴风雪山庄 × 无限流 × 狼人杀》设计文档/, '基于《无尽雪夜》世界观');
fs.writeFileSync('README.md', readme, 'utf8');
console.log('Updated README.md');