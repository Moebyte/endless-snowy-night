const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];

// Count total [[ links in current (cleaned) files
let linksAfter = 0;
let residual = 0;
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.twee'))) {
    const lines = fs.readFileSync(path.join(fullDir, f), 'utf8').split(/\r?\n/);
    lines.forEach(function(line) {
      var m = line.match(/\[\[/g);
      if (m) linksAfter += m.length;
      var t = line.trim();
      if (t === '' || t.indexOf('::') === 0 || t.indexOf('<<') === 0 || t.indexOf('[[') === 0) return;
      if (/^<\/?\w/.test(t) || t.indexOf('[待填剧情]') !== -1) return;
      var inner = t.replace(/<[^>]+>/g,'').trim();
      if (inner.length > 2) residual++;
    });
  }
}
console.log('Total links after clean: ' + linksAfter);
console.log('Residual narrative lines: ' + residual);
