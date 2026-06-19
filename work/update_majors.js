const fs = require('fs');

// 1. Update state.js comments and PROFILES
let state = fs.readFileSync('src/scripts/state.js', 'utf8');

// Update character constant comments
state = state.replace(
  /CHEN_MO: 'chen_mo',\s*\/\/ 男主角 \/ 无限记忆者[^\n]*/,
  "CHEN_MO: 'chen_mo',         // 男主角 / 无限记忆者，信息工程学院计算机科学专业"
);
state = state.replace(
  /SU_WAN: 'su_wan',\s*\/\/ 村民 \/ 女主[^\n]*/,
  "SU_WAN: 'su_wan',           // 村民 / 女主，医学院临床医学专业"
);
state = state.replace(
  /JIANG_BAI: 'jiang_bai',\s*\/\/ 村民 \/ 男主室友[^\n]*/,
  "JIANG_BAI: 'jiang_bai',     // 村民 / 男主室友，电气电子工程学院电气工程专业"
);
state = state.replace(
  /FANG_HENG: 'fang_heng',\s*\/\/ 预言家 \/ 黑警[^\n]*/,
  "FANG_HENG: 'fang_heng',     // 预言家 / 黑警，市刑警支队副队长；与赵明城相识，此行另有所图"
);
state = state.replace(
  /LIN_XIAOMAN: 'lin_xiaoman',\s*\/\/ 骑士 \/ 小太妹[^\n]*/,
  "LIN_XIAOMAN: 'lin_xiaoman', // 骑士 / 小太妹，艺术学院绘画专业，唐小棠同校闺蜜"
);
state = state.replace(
  /GU_YAN: 'gu_yan',\s*\/\/ 机械狼 \/[^\n]*/,
  "GU_YAN: 'gu_yan',           // 机械狼 / 理学院物理学博士研究生"
);
state = state.replace(
  /ZHOU_YANG: 'zhou_yang',\s*\/\/ 狼王 \/[^\n]*/,
  "ZHOU_YANG: 'zhou_yang',     // 狼王 / 体育学院田径专业研究生"
);
state = state.replace(
  /TANG_XIAOTANG: 'tang_xiaotang',\s*\/\/ 隐狼 \/[^\n]*/,
  "TANG_XIAOTANG: 'tang_xiaotang', // 隐狼 / 文学院汉语言文学专业，男主学妹"
);
state = state.replace(
  /ZHAO_MINGCHENG: 'zhao_mingcheng'\s*\/\/ 清道夫狼 \/[^\n]*/,
  "ZHAO_MINGCHENG: 'zhao_mingcheng' // 清道夫狼 / 商人、政治掮客；与方衡相识，此行另有所图"
);

// Replace entire PROFILES block
const newProfiles = `// 角色档案（年龄 + 身份，集中管理便于 UI 显示）
GameState.PROFILES = {
  chen_mo: { name: '陈默', age: 22, job: '信息工程学院计算机科学专业大四学生' },
  su_wan: { name: '苏晚', age: 21, job: '医学院临床医学专业大四学生' },
  jiang_bai: { name: '江白', age: 22, job: '电气电子工程学院电气工程专业大三学生' },
  fang_heng: { name: '方衡', age: 35, job: '市刑警支队副队长' },
  shen_shen: { name: '沈慎', age: 38, job: '地下赌场荷官' },
  ye_zhiqiu: { name: '叶知秋', age: 32, job: '殡仪馆入殓师' },
  zheng_shoushan: { name: '郑守山', age: 58, job: '退休旅行团导游' },
  lin_xiaoman: { name: '林小满', age: 20, job: '艺术学院绘画专业学生，唐小棠同校闺蜜' },
  zhou_yang: { name: '周阳', age: 23, job: '体育学院田径专业研究生' },
  tang_xiaotang: { name: '唐小棠', age: 20, job: '文学院汉语言文学专业大二学生' },
  zhao_mingcheng: { name: '赵明城', age: 45, job: '外贸公司老板、政治掮客' },
  gu_yan: { name: '顾言', age: 24, job: '理学院物理学博士研究生' }
};`;

state = state.replace(
  /\/\/ 角色档案[\s\S]*?\n\};/,
  newProfiles
);

// Add FANG_ZHAO_CONNECTION flag
if (!state.includes('FANG_ZHAO_CONNECTION')) {
  state = state.replace(
    /FANG_REVEALED: 'fang_revealed',/,
    "FANG_REVEALED: 'fang_revealed',\n    FANG_ZHAO_CONNECTION: 'fang_zhao_connection' // 方衡与赵明城相识，此行另有目的"
  );
}

fs.writeFileSync('src/scripts/state.js', state, 'utf8');
console.log('Updated src/scripts/state.js');

// 2. Rewrite Common_Characters.twee
const commonChars = `:: Common_Characters
<h2>登场人物</h2>
<p><strong>陈默</strong> — 22岁，信息工程学院计算机科学专业大四学生。无限记忆者（主角），曾见死不救。</p>
<p><strong>苏晚</strong> — 21岁，医学院临床医学专业大四学生。陈默的恋人，本作女主，正面角色。</p>
<p><strong>江白</strong> — 22岁，电气电子工程学院电气工程专业大三学生。陈默的室友，无黑历史。</p>
<p><strong>方衡</strong> — 35岁，市刑警支队副队长。预言家，黑警。</p>
<p><strong>叶知秋</strong> — 32岁，殡仪馆入殓师。女巫，接触尸体可复活，接触活人可毒可愈。</p>
<p><strong>沈慎</strong> — 38岁，地下赌场荷官兼老千。魔术师（致幻），曾出千令一人家破人亡。</p>
<p><strong>郑守山（老郑）</strong> — 58岁，退休旅行团导游。实为上一轮轮回幸存者。</p>
<p><strong>林小满</strong> — 20岁，艺术学院绘画专业学生，唐小棠同校闺蜜。骑士，小太妹，讲义气有武力。</p>
<p><strong>周阳</strong> — 23岁，体育学院田径专业研究生。狼王，表面阳光开朗。</p>
<p><strong>唐小棠</strong> — 20岁，文学院汉语言文学专业大二学生。隐狼，陈默学妹，喜欢陈默，幼年遭养父虐待猥亵。</p>
<p><strong>赵明城</strong> — 45岁，外贸公司老板，政治掮客。清道夫狼。</p>
<p><strong>顾言</strong> — 24岁，理学院物理学博士研究生。机械狼，曾强夺同门成果。</p>
<p>[[返回|Start]]</p>
`;
fs.writeFileSync('src/passages/common/Common_Characters.twee', commonChars, 'utf8');
console.log('Updated src/passages/common/Common_Characters.twee');

// 3. Update outputs file
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');
outputs = outputs.replace(
  /\| \*\*陈默\*\* \| 男主角 \/ 玩家视角 \| 大四学生/,
  '| **陈默** | 男主角 / 玩家视角 | 信息工程学院计算机科学专业大四学生'
);
outputs = outputs.replace(
  /\| \*\*苏晚\*\* \| 女主角 \| 陈默的恋人，医学生/,
  '| **苏晚** | 女主角 | 陈默的恋人，医学院临床医学专业大四学生'
);
outputs = outputs.replace(
  /\| \*\*江白\*\* \| 室友 \| 陈默的室友，普通大学生/,
  '| **江白** | 室友 | 陈默的室友，电气电子工程学院电气工程专业大三学生'
);
outputs = outputs.replace(
  /\| \*\*方衡\*\* \| 黑警 \| 中年，表面温和/,
  '| **方衡** | 黑警 | 市刑警支队副队长，表面温和'
);
outputs = outputs.replace(
  /\| \*\*顾言\*\* \| 文学院研究生 \|/,
  '| **顾言** | 理学院物理学博士研究生 |'
);
outputs = outputs.replace(
  /\| \*\*林小满\*\* \| 小太妹 \| 活泼仗义，有武力值，唐小棠闺蜜/,
  '| **林小满** | 小太妹 | 艺术学院绘画专业学生，唐小棠同校闺蜜，活泼仗义，有武力值'
);
outputs = outputs.replace(
  /\| \*\*周阳\*\* \| 阳光体育生 \|/,
  '| **周阳** | 体育学院田径专业研究生 |'
);
outputs = outputs.replace(
  /\| \*\*唐小棠\*\* \| 陈默的学妹 \|/,
  '| **唐小棠** | 文学院汉语言文学专业大二学生 |'
);
outputs = outputs.replace(
  /\| \*\*赵明城\*\* \| 商人\/黑手套 \|/,
  '| **赵明城** | 外贸公司老板、政治掮客 |'
);

// Add hidden connection note if not present
if (!outputs.includes('方衡与赵明城')) {
  outputs = outputs.replace(
    '**初始配置**：4 神',
    '> **隐藏设定**：方衡与赵明城并非初次相识，两人来落雁山庄另有私事。\n\n**初始配置**：4 神'
  );
}

fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs/暴风雪山庄_无限流_剧本_Pilot.md');