const fs = require('fs');
const path = require('path');

function clearNarrative(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
    const t = line.trim();
    if (t === '' || t.startsWith('::')) return line;
    // CRITICAL: any line containing a link [[ ]] is preserved entirely
    if (t.indexOf('[[') !== -1) return line;
    // Full-line macros preserved
    if (t.startsWith('<<') && t.endsWith('>>')) return line;
    // Structural tags only
    if (/^<\/?(div|details|summary|ul|ol)\b[^>]*>$/.test(t)) return line;
    if (/^<\/[a-z0-9]+$/.test(t)) return line;
    // Macro then HTML on same line
    if (t.startsWith('<<') && t.indexOf('>><') !== -1) {
      const idx = t.indexOf('>><');
      return line.substring(0, idx + 2) + clearHtml(line.substring(idx + 2));
    }
    return clearHtml(line);
  }).join(eol);
}

function clearHtml(line) {
  if (line.indexOf('[待填剧情]') !== -1) return line;
  if (!/<(?:blockquote|p|h[1-3]|li|span)\b/.test(line.trim())) return line;
  var inner = line.replace(/<[^>]+>/g, '').trim();
  if (inner.length === 0) return line;
  var tags = line.match(/<[^>]+>/g) || [];
  var openStr = '', closeStr = '';
  tags.forEach(function(tag) {
    if (tag.indexOf('</') === 0) closeStr += tag;
    else openStr += tag;
  });
  return openStr + '[待填剧情]' + closeStr;
}

const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];
let total = 0;
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.twee'))) {
    const fp = path.join(fullDir, f);
    const raw = fs.readFileSync(fp, 'utf8');
    fs.writeFileSync(fp, clearNarrative(raw), 'utf8');
    total++;
  }
}
console.log('Cleared ' + total + ' files (links preserved)');

// Verify no links were lost: count [[ in all files before/after via git
