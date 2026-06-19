const fs = require('fs');
let guide = fs.readFileSync('docs/writing-guide.md', 'utf8');

if (!guide.includes('人物信息解锁')) {
  const newSection = `## 6. 如何解锁人物隐藏信息\n\n玩家在 \`Common_Characters.twee\` 中只能看到角色的表面信息（姓名、年龄、专业、第一印象、关系）。隐藏身份、能力、黑历史需要通过剧情解锁。\n\n1. 在剧情中揭示某条信息时，调用：\n\n\`\`\`twee\n<<run Game.revealInfo("zhou_yang", "wolf_king")>>\n\`\`\`\n\n2. 在人物面板或剧情中判断：\n\n\`\`\`twee\n<<if Game.hasRevealed("zhou_yang", "wolf_king")>>\n你已确认周阳是狼王。\n<</if>>\n\`\`\`\n\n完整角色设定请查阅 \`docs/character-bible.md\`。\n\n## 6. 如何写条件分支`;
  guide = guide.replace('## 6. 如何写条件分支', newSection);
  fs.writeFileSync('docs/writing-guide.md', guide, 'utf8');
  console.log('Updated writing-guide.md');
} else {
  console.log('Section already exists');
}