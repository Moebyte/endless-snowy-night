const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\common\\Common_NightResolution.twee';
let s = fs.readFileSync(p, 'utf8');

// Make the night log visible by default (open attribute) so players actually
// see the AI-driven events instead of a collapsed panel they may never click.
const before = `<details class="night-log">
<summary>夜间暗流（你的轮回记忆）</summary>`;
const after = `<details class="night-log" open>
<summary>夜间暗流（你的轮回记忆）</summary>`;
if (!s.includes(before)) { console.error('FAIL: details block not found'); process.exit(1); }
s = s.replace(before, after);

fs.writeFileSync(p, s, 'utf8');
console.log('night-log panel set to open by default');
