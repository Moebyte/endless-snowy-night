const fs = require('fs');
const path = require('path');

const PASSAGES_DIR = path.join(__dirname, '..', 'src', 'passages');

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function findTweeFiles() {
  const result = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.twee')) {
        result.push(fullPath);
      }
    });
  }
  walk(PASSAGES_DIR);
  return result;
}

function parsePassageName(line) {
  const m = line.match(/^::\s+([^[{\n]+)/);
  return m ? m[1].trim() : null;
}

function parseTags(line) {
  const m = line.match(/^::\s+[^[{\n]+\s*\[([^\]]*)\]/);
  return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

function isDynamicTarget(target) {
  if (!target) return true;
  if (target.startsWith('$') || target.startsWith('_')) return true;
  if (target.includes('(')) return true;
  const keywords = ['passage()', 'previous()', 'return'];
  return keywords.includes(target);
}

function extractLinks(content) {
  const links = new Set();
 const patterns = [
    /\[\[([^\]|]+?)\s*->\s*([^\]]+?)\](?:\[[^\]]*\])?\]/g,
    /\[\[([^\]|]+?)\|([^\]]+?)\](?:\[[^\]]*\])?\]/g,
    /\[\[([^\]|]+?)\](?:\[[^\]]*\])?\]/g,
   /<<goto\s+["']([^"']+)["']>>/g,
   /<<link\s+["'][^"']*["']\s*["']([^"']+)["']>>/g,
   /<<button\s+["'][^"']*["']\s*["']([^"']+)["']>>/g,
   /<<link\s+["'][^"']*["']>><<goto\s+["']([^"']+)["']>><<\/link>>/g,
   /<<link\s+["'][^"']*["']\s*["']([^"']+)["']>><<\/link>>/g,
   /<<include\s+["']([^"']+)["']>>/g
 ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(content)) !== null) {
      const target = (m[2] || m[1]).trim();
      if (!isDynamicTarget(target)) {
        links.add(target);
      }
    }
  });
  return Array.from(links);
}

function main() {
  const files = findTweeFiles();
  const passages = new Map();
  const invalidNames = [];
  let currentTags = [];

  files.forEach(file => {
    const content = stripBOM(fs.readFileSync(file, 'utf8'));
    const lines = content.split('\n');
    let currentPassage = null;
    let currentContent = '';
    lines.forEach((line, idx) => {
      if (line.startsWith('::')) {
        if (currentPassage) {
          passages.set(currentPassage, { file, content: currentContent });
        }
        if (currentPassage) {
          passages.set(currentPassage, { file, content: currentContent, tags: currentTags });
        }
        currentPassage = parsePassageName(line);
        currentTags = parseTags(line);
        if (currentPassage && !/^[A-Z][a-zA-Z0-9_]*$/.test(currentPassage)) {
          invalidNames.push({ file, line: idx + 1, name: currentPassage });
        }
        currentContent = '';
      } else if (currentPassage) {
        currentContent += line + '\n';
      }
    });
    if (currentPassage) {
      passages.set(currentPassage, { file, content: currentContent, tags: currentTags });
    }
  });

  const passageNames = Array.from(passages.keys());
  const duplicateNames = passageNames.filter((n, i) => passageNames.indexOf(n) !== i);
  const uniqueDuplicates = Array.from(new Set(duplicateNames));

  const incoming = {};
  passageNames.forEach(n => incoming[n] = []);
  let brokenLinks = [];

  files.forEach(file => {
    const content = stripBOM(fs.readFileSync(file, 'utf8'));
    const links = extractLinks(content);
    links.forEach(link => {
      if (!passages.has(link)) {
        brokenLinks.push({ file, target: link });
      } else {
        incoming[link].push(file);
      }
    });
  });

  const special = ['Start', 'StoryInit', 'StoryCaption', 'StoryMenu', 'StoryJavaScript', 'StoryStylesheet'];
  const orphans = passageNames.filter(n => {
    if (incoming[n].length > 0) return false;
    if (special.includes(n)) return false;
    if (n.startsWith('Common_Night') || n.startsWith('Pursuit_')) return false;
    var t = passages.get(n).tags || [];
    if (t.includes('widget') || t.includes('utility') || t.includes('location') || t.includes('intro')) return false;
    return true;
  });

  console.log('=== Twine Passage Check Report ===\n');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Passages found: ${passageNames.length}\n`);

  if (uniqueDuplicates.length) {
    console.log('Duplicate passages:');
    uniqueDuplicates.forEach(n => console.log(`  - ${n}`));
    console.log('');
  }

  if (invalidNames.length) {
    console.log('Invalid passage names (should be PascalCase with underscore):');
    invalidNames.forEach(x => console.log(`  - ${x.name} (${path.basename(x.file)}:${x.line})`));
    console.log('');
  }

  if (brokenLinks.length) {
    console.log('Broken links:');
    brokenLinks.forEach(x => console.log(`  - ${x.target} (from ${path.basename(x.file)})`));
    console.log('');
  }

  if (orphans.length) {
    console.log('Orphaned passages (no incoming links):');
    orphans.forEach(n => console.log(`  - ${n}`));
    console.log('');
  }

  if (!uniqueDuplicates.length && !brokenLinks.length && !invalidNames.length && !orphans.length) {
    console.log('All checks passed.');
  } else {
    console.log('Please fix the issues above.');
    process.exit(1);
  }
}

main();

