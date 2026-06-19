const fs = require('fs');

// 1. Update state.js
let state = fs.readFileSync('src/scripts/state.js', 'utf8');
state = state.replace(
  /YE_ZHIQIU: 'ye_zhiqiu',\s*\/\/ 女巫 \/ 入殓师/,
  "YE_ZHIQIU: 'ye_zhiqiu',     // 女巫 / 入殓师，曾是医学院学生，因医疗事故被退学"
);
state = state.replace(
  /ye_zhiqiu: \{ name: '叶知秋', age: 32, job: '殡仪馆入殓师' \}/,
  "ye_zhiqiu: { name: '叶知秋', age: 32, job: '前医学院学生，现为殡仪馆入殓师' }"
);
fs.writeFileSync('src/scripts/state.js', state, 'utf8');
console.log('Updated src/scripts/state.js');

// 2. Update Common_Characters.twee
let chars = fs.readFileSync('src/passages/common/Common_Characters.twee', 'utf8');
chars = chars.replace(
  /<p><strong>叶知秋<\/strong> — 32岁，殡仪馆入殓师。女巫/,
  '<p><strong>叶知秋</strong> — 32岁，前医学院学生，因医疗事故被退学后转行殡仪馆入殓师。女巫'
);
fs.writeFileSync('src/passages/common/Common_Characters.twee', chars, 'utf8');
console.log('Updated src/passages/common/Common_Characters.twee');

// 3. Update outputs file
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');
outputs = outputs.replace(
  /\| \*\*叶知秋\*\* \| 入殓师 \| 温柔，常年与尸体打交道 \| 女巫/,
  '| **叶知秋** | 前医学院学生，现为入殓师 | 温柔，常年与尸体打交道，曾因医疗事故被退学 | 女巫'
);
fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs/暴风雪山庄_无限流_剧本_Pilot.md');