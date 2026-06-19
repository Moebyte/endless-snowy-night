const fs = require('fs');
const path = require('path');

function walk(dir, ext) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['vendor','dist','.git','node_modules'].includes(entry.name)) {
        result.push(...walk(fullPath, ext));
      }
    } else if (entry.isFile() && (!ext || fullPath.endsWith(ext))) {
      result.push(fullPath);
    }
  });
  return result;
}

// 1. Update state.js
let state = fs.readFileSync('src/scripts/state.js', 'utf8');
state = state.replace(/FANG_ZHIHENG/g, 'FANG_HENG');
state = state.replace(/fang_zhiheng/g, 'fang_heng');
state = state.replace(/trust_fang(?!_heng)/g, 'trust_fang_heng');
state = state.replace(/文学院研究生/g, '理学院物理系研究生');

// Add PROFILES before GameState.create
const profilesBlock = `
// 角色档案（年龄 + 身份，集中管理便于 UI 显示）
GameState.PROFILES = {
  chen_mo: { name: '陈默', age: 22, job: '计算机科学专业大四学生' },
  su_wan: { name: '苏晚', age: 21, job: '医学院大四学生' },
  jiang_bai: { name: '江白', age: 22, job: '电气工程专业大三学生' },
  fang_heng: { name: '方衡', age: 35, job: '市刑警支队副队长' },
  shen_shen: { name: '沈慎', age: 38, job: '地下赌场荷官' },
  ye_zhiqiu: { name: '叶知秋', age: 32, job: '殡仪馆入殓师' },
  zheng_shoushan: { name: '郑守山', age: 58, job: '退休旅行团导游' },
  lin_xiaoman: { name: '林小满', age: 20, job: '高职大三服装设计专业学生' },
  zhou_yang: { name: '周阳', age: 23, job: '体育学院田径专业研究生' },
  tang_xiaotang: { name: '唐小棠', age: 20, job: '中文系大二学生' },
  zhao_mingcheng: { name: '赵明城', age: 45, job: '外贸公司老板' },
  gu_yan: { name: '顾言', age: 24, job: '理学院物理系研究生' }
};

GameState.getProfile = function (charId) {
  return GameState.PROFILES[charId] || null;
};

`;

state = state.replace(
  '// 创建全新游戏状态\n  GameState.create = function () {',
  profilesBlock + '// 创建全新游戏状态\n  GameState.create = function () {'
);

fs.writeFileSync('src/scripts/state.js', state, 'utf8');
console.log('Updated src/scripts/state.js');

// 2. Update game.js
let game = fs.readFileSync('src/scripts/game.js', 'utf8');
game = game.replace(/fang_zhiheng/g, 'fang_heng');
fs.writeFileSync('src/scripts/game.js', game, 'utf8');
console.log('Updated src/scripts/game.js');

// 3. Update variable-guide.md
let guide = fs.readFileSync('docs/variable-guide.md', 'utf8');
guide = guide.replace(/trust_fang(?!_heng)/g, 'trust_fang_heng');
fs.writeFileSync('docs/variable-guide.md', guide, 'utf8');
console.log('Updated docs/variable-guide.md');

// 4. Rewrite Common_Characters.twee
const commonChars = `:: Common_Characters
<h2>登场人物</h2>
<p><strong>陈默</strong> — 22岁，计算机科学专业大四学生。无限记忆者（主角），曾见死不救。</p>
<p><strong>苏晚</strong> — 21岁，医学院大四学生。陈默的恋人，本作女主，正面角色。</p>
<p><strong>江白</strong> — 22岁，电气工程专业大三学生。陈默的室友，无黑历史。</p>
<p><strong>方衡</strong> — 35岁，市刑警支队副队长。预言家，黑警。</p>
<p><strong>叶知秋</strong> — 32岁，殡仪馆入殓师。女巫，接触尸体可复活，接触活人可毒可愈。</p>
<p><strong>沈慎</strong> — 38岁，地下赌场荷官兼老千。魔术师（致幻），曾出千令一人家破人亡。</p>
<p><strong>郑守山（老郑）</strong> — 58岁，退休旅行团导游。实为上一轮轮回幸存者。</p>
<p><strong>林小满</strong> — 20岁，高职大三服装设计专业学生。骑士，小太妹，唐小棠闺蜜，讲义气有武力。</p>
<p><strong>周阳</strong> — 23岁，体育学院田径专业研究生。狼王，表面阳光开朗。</p>
<p><strong>唐小棠</strong> — 20岁，中文系大二学生。隐狼，陈默学妹，喜欢陈默，幼年遭养父虐待猥亵。</p>
<p><strong>赵明城</strong> — 45岁，外贸公司老板，政治掮客。清道夫狼。</p>
<p><strong>顾言</strong> — 24岁，理学院物理系研究生。机械狼，曾强夺同门成果。</p>
<p>[[返回|Start]]</p>
`;
fs.writeFileSync('src/passages/common/Common_Characters.twee', commonChars, 'utf8');
console.log('Updated src/passages/common/Common_Characters.twee');

// 5. Bulk replace in passage files
const passageFiles = walk('src/passages', '.twee');
passageFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/方知衡/g, '方衡');
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Replaced 方知衡 -> 方衡 in ' + passageFiles.length + ' passage files');

// 6. Update outputs file
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');
outputs = outputs.replace(/方知衡/g, '方衡');
outputs = outputs.replace(/文学院研究生/g, '理学院物理系研究生');
fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs/暴风雪山庄_无限流_剧本_Pilot.md');