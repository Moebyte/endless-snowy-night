const fs = require('fs');
const path = require('path');

// Second pass: clear residual text inside nested tag structures
// (e.g. <blockquote><strong>actual text</strong></blockquote>)
function clearResidual(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  let lines = content.split(/\r?\n/);
  lines = lines.map(line => {
    const t = line.trim();
    // Skip pure structure/macro/link lines
    if (t === '' || t.startsWith('::') || t.startsWith('[[') ||
        (t.startsWith('<<') && t.endsWith('>>')) ||
        /^<\/?(div|details|summary|ul|ol)\b[^>]*>$/.test(t) ||
        /^<\/[a-z0-9]+$/.test(t)) {
      return line;
    }
    // Handle macro+html split
    if (t.startsWith('<<') && t.includes('>><')) {
      const idx = t.indexOf('>><');
      return line.substring(0, idx + 2) + clearResidualHtml(line.substring(idx + 2));
    }
    return clearResidualHtml(line);
  });
  return lines.join(eol);
}

function clearResidualHtml(html) {
  let r = html;
  // If line still has a [待填剧情], it's already processed - skip
  if (r.includes('[待填剧情]')) return r;

  // Clear text inside <strong>/<em>/<b>/<i> that still has Chinese/punctuation content
  // but only when the line is a narrative line (contains blockquote/p/h tag)
  if (/<(?:blockquote|p|h[1-3]|li|span)\b/.test(r)) {
    // Replace any remaining visible text (Chinese chars, quotes, etc.) between tags
    r = r.replace(/>([\u4e00-\u9fa5""''…·、，。！？：；\w\s]{2,})</g, '>[待填剧情]<');
    // Collapse multiple adjacent placeholders
    r = r.replace(/(\[待填剧情\]<\/strong>\[待填剧情\])/g, '[待填剧情]');
    r = r.replace(/(<strong>\[待填剧情\]<\/strong>)/g, '');
    // If blockquote now empty, put single placeholder
    r = r.replace(/<blockquote>\s*<\/blockquote>/g, '<blockquote>[待填剧情]</blockquote>');
    r = r.replace(/<blockquote>(\s*<strong>\s*<\/strong>\s*)<\/blockquote>/g, '<blockquote>[待填剧情]</blockquote>');
  }
  return r;
}

const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages';
const dirs = ['chapter01','chapter02','chapter03_06','chapter07'];
let total = 0, changed = 0;
for (const dir of dirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.twee'))) {
    const fp = path.join(fullDir, f);
    const raw = fs.readFileSync(fp, 'utf8');
    const cleaned = clearResidual(raw);
    if (cleaned !== raw) changed++;
    fs.writeFileSync(fp, cleaned, 'utf8');
    total++;
  }
}
console.log('Pass 2: ' + changed + '/' + total + ' files updated');
