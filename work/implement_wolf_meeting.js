const fs = require('fs');

// 1. Create Chapter01_WolfMeeting passage
const passageContent = `:: Chapter01_WolfMeeting
<<set $game.time to '00:00'>>
<<run Game.setFlag('wolf_meeting_seen')>>

<h2>Day 1 · 子夜 · 共享噩梦</h2>

<p>雪落在眼睛里，不冷，只是很重。</p>

<p>周阳最先“醒”来。他站在一片白茫茫的山脊上，风里有血的味道。右手握着什么，低头看，是一枚狼爪，从自己掌心里长出来的。</p>

<p class="thought">周阳：这是梦吧？</p>

<p>可梦不会这么清晰。他能感到牙变长了，能感到胸腔里有一种声音在咆哮：杀死他们。杀死那些自以为是的人。</p>

<p>不远处，有三个人影。</p>

<p>唐小棠站在那里，瑟瑟发抖。她的影子被月光钉在地上，形状不是人，而是一只蜷缩的狼崽。她看向周阳，眼神里没有惊讶，只有一种认命的恐惧。</p>

<p>赵明城站在她身侧，手里把玩着一柄骨刀。他脚下的雪地正在融化，露出下面黑色的泥土。仿佛他走过的地方，什么痕迹都不会留下。</p>

<p>顾言背对着他们，仰头看着月亮。他的影子在雪地上分裂成好几个，其中有一个，比他自己还要高大。</p>

<p>周阳明白了。不是梦。是某种东西把“狼”从十二个人里挑了出来，让他们在第一个夜里彼此相认。</p>

<p>他没有问“我们是谁”。答案在四人的呼吸里。</p>

<p>他也没有问“那些神职有什么能力”。系统没有告诉他们这个。他们只知道——另外八个人里，有四个和他们一样被“选中”了，只是阵营相反。而那些人此刻正睡在楼下的房间里，一无所知。</p>

<p>风停了。雪地上出现了一行脚印，通向山庄。不是他们中任何一个人留下的。</p>

<p>那是留给他们的路。</p>

<div class="choice-list">
[[从噩梦中醒来|Chapter02_Start]]
</div>
`;

fs.writeFileSync('src/passages/chapter01/Chapter01_WolfMeeting.twee', passageContent, 'utf8');
console.log('Created src/passages/chapter01/Chapter01_WolfMeeting.twee');

// 2. Add WOLF_MEETING_SEEN flag to state.js
let state = fs.readFileSync('src/scripts/state.js', 'utf8');
if (!state.includes('WOLF_MEETING_SEEN')) {
  state = state.replace(
    /FANG_ZHAO_CONNECTION: 'fang_zhao_connection' \/\/ 方衡与赵明城相识，此行另有目的/,
    "FANG_ZHAO_CONNECTION: 'fang_zhao_connection', // 方衡与赵明城相识，此行另有目的\n    WOLF_MEETING_SEEN: 'wolf_meeting_seen' // 是否已展示狼人首夜共享噩梦"
  );
  fs.writeFileSync('src/scripts/state.js', state, 'utf8');
  console.log('Added WOLF_MEETING_SEEN flag');
}

// 3. Update Chapter02_Start to link to wolf meeting on loop > 1
let ch2 = fs.readFileSync('src/passages/chapter02/Chapter02_Start.twee', 'utf8');
if (!ch2.includes('Chapter01_WolfMeeting')) {
  ch2 = ch2.replace(
    '<div class="choice-list">\n[[去大厅|Chapter02_Hall]]\n[[检查笔记|Chapter02_Notebook]]\n[[独自思考|Chapter02_AloneChen]]\n</div>',
    '<div class="choice-list">\n[[去大厅|Chapter02_Hall]]\n[[检查笔记|Chapter02_Notebook]]\n[[独自思考|Chapter02_AloneChen]]\n<<if $game.loop > 1>>\n[[一个噩梦的碎片|Chapter01_WolfMeeting]]\n<</if>>\n</div>'
  );
  fs.writeFileSync('src/passages/chapter02/Chapter02_Start.twee', ch2, 'utf8');
  console.log('Updated Chapter02_Start.twee');
}

// 4. Update writing-guide.md
let guide = fs.readFileSync('docs/writing-guide.md', 'utf8');
guide = guide.replace(
  /5\. \*\*狼人首夜\*\*：所有狼人第一晚会全员碰面，系统会告知各自技能。/,
  '5. **狼人首夜**：所有狼人第一晚会进入同一个共享噩梦，在梦中本能地知晓自己的技能，并彼此相认。但他们不知道神职的具体能力。'
);
fs.writeFileSync('docs/writing-guide.md', guide, 'utf8');
console.log('Updated writing-guide.md');

// 5. Update outputs file rules section
let outputs = fs.readFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', 'utf8');
outputs = outputs.replace(
  /6\. \*\*狼人首夜\*\*：所有狼人第一晚会全员碰面，系统会告知各自技能。/,
  '6. **狼人首夜**：所有狼人第一晚会进入同一个共享噩梦，在梦中本能地知晓自己的技能，并彼此相认。但他们不知道神职的具体能力。'
);
fs.writeFileSync('outputs/暴风雪山庄_无限流_剧本_Pilot.md', outputs, 'utf8');
console.log('Updated outputs file');