const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];
let fixed = 0;
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.twee'))) {
    const fp = path.join(fullDir, f);
    const eol = fs.readFileSync(fp, 'utf8').includes('\r\n') ? '\r\n' : '\n';
    let lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/);
    let mod = false;
    lines = lines.map(function(line) {
      var t = line.trim();
      if (!/<(?:blockquote|p|h[1-3]|li|span)\b/.test(t)) return line;
      if (t.indexOf('[待填剧情]') !== -1) return line;
      var inner = t.replace(/<[^>]+>/g, '').trim();
      if (inner.length === 0) return line;
      mod = true;
      var openTags = t.match(/<[^>]+>/g) || [];
      var openStr = '';
      var closeStr = '';
      openTags.forEach(function(tag) {
        if (tag.indexOf('</') === 0) closeStr += tag;
        else openStr += tag;
      });
      return openStr + '[待填剧情]' + closeStr;
    });
    if (mod) {
      fs.writeFileSync(fp, lines.join(eol), 'utf8');
      fixed++;
    }
  }
}
console.log('Fixed: ' + fixed);
var residual = 0;
dirs.forEach(function(dir) {
  var fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return;
  fs.readdirSync(fullDir).filter(function(x){return x.endsWith('.twee')}).forEach(function(f) {
    var lines = fs.readFileSync(path.join(fullDir, f), 'utf8').split(/\r?\n/);
    lines.forEach(function(line) {
      var t = line.trim();
      if (t === '' || t.indexOf('::') === 0 || t.indexOf('<<') === 0 || t.indexOf('[[') === 0) return;
      if (/^<\/?\w/.test(t) || t.indexOf('[待填剧情]') !== -1) return;
      var inner = t.replace(/<[^>]+>/g, '').trim();
      if (inner.length > 2) {
        residual++;
        console.log('RESIDUAL: ' + f + ': ' + t.substring(0,50));
      }
    });
  });
});
console.log('Residual: ' + residual);
