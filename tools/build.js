const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const FORMAT_PATH = path.join(ROOT, 'vendor', 'sugarcube-2', 'twine2', 'sugarcube-2', 'format.js');
const STORY_NAME = '\u65e0\u5c3d\u96ea\u591c';

function walk(dir, ext) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walk(fullPath, ext));
    } else if (entry.isFile() && fullPath.endsWith(ext)) {
      result.push(fullPath);
    }
  });
  return result;
}

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function concatFiles(files) {
  return files.map(f => stripBOM(fs.readFileSync(f, 'utf8'))).join('\n\n');
}

function escapeScriptClose(str) {
  // Only escape </ to prevent premature script tag closure.
  // Do NOT escape &, <, > otherwise JS operators like && break.
  return str.replace(/<\//g, '<\\/');
}
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parsePassage(content) {
  const lines = content.split('\n');
  const passages = [];
  let current = null;

  lines.forEach(line => {
    if (line.startsWith('::')) {
      if (current) passages.push(current);
      const headerMatch = line.match(/^::\s+([^[{(\n]+)(?:\s*\[([^\]]*)\])?(?:\s*\{([^}]*)\})?/);
      const name = headerMatch ? headerMatch[1].trim() : '';
      const tags = headerMatch && headerMatch[2] ? headerMatch[2].trim() : '';
      current = { name, tags, content: [] };
    } else if (current) {
      current.content.push(line);
    }
  });

  if (current) passages.push(current);
  return passages;
}

function makeIfid() {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(STORY_NAME).digest('hex').slice(0, 32).toUpperCase().replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

function buildStoryData(passageContents, jsCode, cssCode) {
  const allPassages = [];

  passageContents.forEach(content => {
    allPassages.push(...parsePassage(content));
  });

  const startNode = Math.max(1, allPassages.findIndex(p => p.name === 'Start') + 1);
  const ifid = makeIfid();

  let passageData = '';
  allPassages.forEach((p, idx) => {
    const pid = idx + 1;
    const rawContent = p.content.join('\n').trim();
    passageData += `  <tw-passagedata pid="${pid}" name="${escapeHtml(p.name)}" tags="${escapeHtml(p.tags)}" position="100,100" size="100,100">${escapeHtml(rawContent)}</tw-passagedata>\n`;
  });

  return `<tw-storydata name="${escapeHtml(STORY_NAME)}" startnode="${startNode}" creator="Twine" creator-version="2.10.0" ifid="${ifid}" format="SugarCube" format-version="2.37.3" options="" hidden>\n` +
    `  <style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css">${escapeHtml(cssCode)}</style>\n` +
    `  <script role="script" id="twine-user-script" type="text/twine-javascript">${escapeScriptClose(jsCode)}</script>\n` +
    passageData +
    `</tw-storydata>`;
}

function loadFormatSource() {
  if (!fs.existsSync(FORMAT_PATH)) {
    throw new Error(`SugarCube format.js not found at ${FORMAT_PATH}`);
  }
  const raw = fs.readFileSync(FORMAT_PATH, 'utf8').trim();
  const jsonStr = raw.replace(/^window\.storyFormat\(/, '').replace(/\);?$/, '');
  const format = JSON.parse(jsonStr);
  return format.source;
}

function build() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const passageFiles = walk(path.join(SRC, 'passages'), '.twee').sort();
  const jsFiles = walk(path.join(SRC, 'scripts'), '.js').sort();
  const cssFiles = walk(path.join(SRC, 'styles'), '.css').sort();

  const passageContents = passageFiles.map(f => stripBOM(fs.readFileSync(f, 'utf8')));
  const jsCode = concatFiles(jsFiles);
  const cssCode = concatFiles(cssFiles);

  const tweeOutput = `:: StoryJavaScript\n${jsCode}\n\n:: StoryStylesheet\n${cssCode}\n\n${passageContents.join('\n\n')}`;
  const tweePath = path.join(DIST, 'storydata.twee');
  fs.writeFileSync(tweePath, tweeOutput, 'utf8');

  const storyData = buildStoryData(passageContents, jsCode, cssCode);
  const formatSource = loadFormatSource();
  const htmlOutput = formatSource
    .replace(/\{\{STORY_NAME\}\}/g, STORY_NAME)
    .replace(/\{\{STORY_DATA\}\}/g, storyData);
  const htmlPath = path.join(DIST, 'index.html');
  fs.writeFileSync(htmlPath, htmlOutput, 'utf8');

  console.log(`Built ${tweePath}`);
  console.log(`Built ${htmlPath}`);
  console.log(`  Passages: ${passageFiles.length}`);
  console.log(`  JS files: ${jsFiles.length}`);
  console.log(`  CSS files: ${cssFiles.length}`);
}

function watch() {
  build();
  console.log('\nWatching for changes...');
  fs.watch(SRC, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.twee') || filename.endsWith('.js') || filename.endsWith('.css'))) {
      console.log(`\n[${new Date().toLocaleTimeString()}] ${eventType}: ${filename}`);
      try {
        build();
      } catch (err) {
        console.error('Build failed:', err.message);
      }
    }
  });
}

const cmd = process.argv[2];
if (cmd === '--watch' || cmd === '-w') {
  watch();
} else {
  build();
}
