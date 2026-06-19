const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\common\\God_Panel.twee';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);

// Replace the single knightWeakened block with precise per-skill status
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Game.knightWeakened()') && lines[i+1] && lines[i+1].includes('林小满处于虚弱状态，今天无法行动')) {
    lines.splice(i, 2,
      '<<if Game.knightDuelOnCooldown()>>',
      '<p class="warning">林小满明日白天无法决斗（但夜晚守卫不受影响）。</p>',
      '<</if>>',
      '<<if Game.knightGuardOnCooldown()>>',
      '<p class="warning">林小满今夜无法守卫（但白天决斗不受影响）。</p>',
      '<</if>>'
    );
    break;
  }
}
fs.writeFileSync(p, lines.join(eol), 'utf8');
console.log('God_Panel.twee updated');
