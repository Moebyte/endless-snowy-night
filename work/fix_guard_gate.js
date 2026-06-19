const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\common\\God_Knight_Guard.twee';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);

// Replace the knightWeakened() gate in God_Knight_Guard with the precise guard check
let changed = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Game.knightWeakened()')) {
    lines[i] = lines[i].replace('Game.knightWeakened()', 'Game.knightGuardOnCooldown()');
    changed++;
  }
}
// Also update the "无法行动" text to be guard-specific
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('上次行动的消耗还没恢复。她今天无法行动。')) {
    lines[i] = lines[i].replace('她今天无法行动。', '守卫的消耗还没恢复，今夜无法再守卫（但白天决斗不受影响）。');
    changed++;
  }
}
fs.writeFileSync(p, lines.join(eol), 'utf8');
console.log('God_Knight_Guard.twee updated, ' + changed + ' lines changed');
