const fs = require('fs');
let ch2 = fs.readFileSync('src/passages/chapter02/Chapter02_Start.twee', 'utf8');

if (!ch2.includes('Chapter01_WolfMeeting')) {
  ch2 = ch2.replace(
    '<p>[[回到房间记录情报|Chapter02_Notebook]]</p>',
    `<p>[[回到房间记录情报|Chapter02_Notebook]]</p>\n<<if $game.loop > 1>>\n<p class="system-hint">一个噩梦的碎片在记忆里闪回……</p>\n<p>[[狼人的第一夜|Chapter01_WolfMeeting]]</p>\n<</if>>`
  );
  fs.writeFileSync('src/passages/chapter02/Chapter02_Start.twee', ch2, 'utf8');
  console.log('Added wolf meeting link to Chapter02_Start.twee');
} else {
  console.log('Link already exists');
}