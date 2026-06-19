const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\chapter01\\Chapter01_Start.twee';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

// Classification rule:
//  - line 0: ":: Name" or ":: Name [tags]" -> KEEP (passage header)
//  - line starts with "<<" and ends with ">>" (macro) -> KEEP
//  - line starts with "[[" (link) -> KEEP
//  - line is "<div...>" / "</div>" / "<details...>" / "</details>" / "<summary>" structural -> KEEP
//  - line is a narrative <p>/<blockquote>/<h2>/<h3>/<li> with text -> REPLACE body with placeholder
//  - empty line -> KEEP
// Only show what WOULD change first (dry run)
let kept = 0, cleared = 0;
const out = lines.map(line => {
  const t = line.trim();
  if (t === '' || t.startsWith('::') || t.startsWith('<<') || t.startsWith('[[') ||
      t.startsWith('<<') || /^<\/?(div|details|summary|ul|ol)/.test(t) || t.startsWith('</')) {
    kept++;
    return line;
  }
  // narrative content line
  if (/<(p|blockquote|h2|h3|h1|li)\b/.test(t) || t.startsWith('<p') || t.startsWith('<blockquote')) {
    cleared++;
    // preserve the tag structure but clear text. For self-contained single-line tags.
    return line.replace(/(<[^>]+>)[\s\S]*?(<\/[^>]+>)/, '$1[待填剧情]$2');
  }
  kept++;
  return line;
});
console.log('DRY RUN: kept=' + kept + ' cleared=' + cleared);
console.log('--- preview first 40 lines ---');
out.slice(0,40).forEach((l,i) => console.log((i<10?' ':'')+i, l));
