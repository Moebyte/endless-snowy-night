const fs = require('fs');
const path = require('path');

// Clear narrative text from a .twee file while preserving structure.
// Rules:
//  - passage header (:: Name [tags]) -> keep
//  - full-line macros (<<...>>) -> keep
//  - links ([[...]]) -> keep
//  - structural tags (div/ul/ol/details/summary open/close) -> keep
//  - narrative tags (p/blockquote/h1-3/li/span) -> replace inner text with placeholder,
//    preserving classes and tag structure
//  - macro followed by HTML on same line -> keep macro, clear the HTML part
function clearNarrative(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
    const t = line.trim();
    if (t === '' || t.startsWith('::') || t.startsWith('[[')) return line;

    // Full-line macro
    if (t.startsWith('<<') && t.endsWith('>>')) return line;

    // Structural tags only
    if (/^<\/?(div|details|summary|ul|ol)\b[^>]*>$/.test(t)) return line;

    // Bare closing tag
    if (/^<\/[a-z0-9]+>$/.test(t)) return line;

    // Macro then HTML on same line: split at >><
    if (t.startsWith('<<') && t.includes('>><')) {
      const idx = t.indexOf('>><');
      const macroPart = line.substring(0, idx + 2);
      const htmlPart = line.substring(idx + 2);
      return macroPart + clearHtml(htmlPart);
    }

    // Narrative HTML line
    return clearHtml(line);
  }).join(eol);
}

function clearHtml(html) {
  // Replace text content inside narrative tags, preserving tag attributes.
  // Handles nested/multiple tags on one line by processing each tag pair.
  let result = html;
  // p, blockquote, h1-3, li, span with class attrs
  result = result.replace(/(<(?:p|blockquote|h[1-3]|li|span)\b[^>]*>)([^<]*?)(<\/(?:p|blockquote|h[1-3]|li|span)>)/g,
    (m, open, inner, close) => {
      // keep if inner is already empty or just whitespace tag content
      const trimmed = inner.replace(/&[a-z]+;|&#\d+;/g,'').trim();
      if (trimmed === '') return m;
      return open + '[待填剧情]' + close;
    });
  // Handle lines with stray tags like </strong> inside blockquote (collapse to single placeholder)
  result = result.replace(/\[待填剧情\]<\/strong>\[待填剧情\]/g, '[待填剧情]');
  result = result.replace(/>\[待填剧情\]<\/strong>/g, '>[待填剧情]');
  return result;
}

// Process all narrative files in chapter folders
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];
let total = 0;
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.twee'));
  for (const f of files) {
    const fp = path.join(fullDir, f);
    const raw = fs.readFileSync(fp, 'utf8');
    const cleaned = clearNarrative(raw);
    fs.writeFileSync(fp, cleaned, 'utf8');
    total++;
  }
}
console.log('Cleared narrative text in ' + total + ' files');
