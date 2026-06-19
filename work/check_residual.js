const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];
let residual = [];
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.twee'))) {
    const fp = path.join(fullDir, f);
    const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('::') || t.startsWith('<<') || t.startsWith('[[') || t === '' ||
          /^<\/?\w/.test(t) || t.includes('[待填剧情]')) return;
      // This is a line with content that's not a placeholder
      if (/[\u4e00-\u9fa5]{3,}/.test(t)) {
        residual.push(dir + '/' + f + ':' + (i+1) + ' ' + t.substring(0,60));
      }
    });
  }
}
console.log('Lines with residual Chinese narrative: ' + residual.length);
residual.slice(0,20).forEach(r => console.log('  ' + r));
