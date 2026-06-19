const fs = require('fs');

// 1. Update state.js comment
let state = fs.readFileSync('src/scripts/state.js', 'utf8');
state = state.replace(
  /神职被系统告知：保护好没有能力的村民，他们的存在很重要。/,
  '神职被系统告知：保护好没有能力的村民，他们的存在至关重要；且不得轻易透露自己的能力与身份。'
);
fs.writeFileSync('src/scripts/state.js', state, 'utf8');
console.log('Updated state.js');

// 2. Update writing-guide.md
let guide = fs.readFileSync('docs/writing-guide.md', 'utf8');
guide = guide.replace(
  /系统会告知所有神职——“保护好那些没有能力的人，他们的存在很重要。”/,
  '系统会告知所有神职——“保护好那些没有能力的人，他们的存在至关重要；且不得轻易透露自己的能力与身份。”'
);
fs.writeFileSync('docs/writing-guide.md', guide, 'utf8');
console.log('Updated writing-guide.md');

// 3. Update outputs file rule
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');
outputs = outputs.replace(
  /系统会告知所有神职——“保护好那些没有能力的人，他们的存在很重要。”/,
  '系统会告知所有神职——“保护好那些没有能力的人，他们的存在至关重要；且不得轻易透露自己的能力与身份。”'
);
fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs file rule');

// 4. Rewrite Common_Characters.twee with polished descriptions
const commonChars = `:: Common_Characters
<h2>登场人物</h2>
<p><strong>陈默</strong> — 22岁，信息工程学院计算机科学专业大四学生。冷静理性，寡言，习惯用笔记与逻辑拆解一切。背负见死不救的往事，是保留跨轮回记忆的无限记忆者。</p>
<p><strong>苏晚</strong> — 21岁，医学院临床医学专业大四学生。温柔而倔强，有医者的仁心与底线。陈默的恋人，本作女主，正面角色。</p>
<p><strong>江白</strong> — 22岁，电气电子工程学院电气工程专业大三学生。踏实可靠，话少但动手能力强。陈默的室友，无黑历史。</p>
<p><strong>方衡</strong> — 35岁，市刑警支队副队长。敏锐世故，表面温和，内里精于算计。擅长读人、审讯与追踪。预言家，黑警。</p>
<p><strong>叶知秋</strong> — 32岁，前医学院学生，因医疗事故被退学后转入殡仪馆任入殓师。沉静温柔，对生死淡漠。能验尸、保存证据，也能配药或下毒。女巫。</p>
<p><strong>沈慎</strong> — 38岁，地下赌场荷官兼老千。沉默寡言，动作利落，惯于赌命。擅长出千、致幻布置与冷读。魔术师，曾出千令一人家破人亡。</p>
<p><strong>郑守山（老郑）</strong> — 58岁，退休旅行团导游。圆滑谨慎，知道太多却不敢多说。熟悉山庄结构与隐藏通道，实为上一轮轮回幸存者。</p>
<p><strong>林小满</strong> — 20岁，艺术学院绘画专业学生，唐小棠同校闺蜜。冲动仗义，护短，外刚内软。擅长打架、保护他人与观察细节。骑士，小太妹。</p>
<p><strong>周阳</strong> — 23岁，体育学院田径专业研究生。阳光开朗，人缘极佳，实则好胜心强。擅长奔跑、体能压制与煽动气氛。狼王。</p>
<p><strong>唐小棠</strong> — 20岁，文学院汉语言文学专业大二学生。活泼敏感，依赖性强，精神脆弱。擅长读文字暗号、察言观色与情感操控。隐狼，陈默学妹，喜欢陈默，幼年遭养父虐待猥亵。</p>
<p><strong>赵明城</strong> — 45岁，外贸公司老板，政治掮客。圆滑世故，擅长斡旋，手段冷酷。擅长谈判、找把柄、资源调配与心理施压。清道夫狼。</p>
<p><strong>顾言</strong> — 24岁，理学院物理学博士研究生。敏感自尊，观察力强，情绪容易崩溃。擅长物理推理、拆解机关与实验验证。机械狼，曾强夺同门成果。</p>
<p>[[返回|Start]]</p>
`;
fs.writeFileSync('src/passages/common/Common_Characters.twee', commonChars, 'utf8');
console.log('Polished Common_Characters.twee');