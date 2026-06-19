const fs = require('fs');
const path = require('path');

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

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

const tweeFiles = walk('src/passages', '.twee');
tweeFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = stripBOM(content);
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Stripped BOM from ' + tweeFiles.length + ' .twee files');

let build = fs.readFileSync('tools/build.js', 'utf8');
build = build.replace(/const STORY_NAME = '[^']+';/, "const STORY_NAME = '\\u65e0\\u5c3d\\u96ea\\u591c';");
if (!build.includes('function stripBOM')) {
  build = build.replace(
    "function concatFiles(files) {\n  return files.map(f => fs.readFileSync(f, 'utf8')).join('\\n\\n');\n}",
    "function stripBOM(content) {\n  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;\n}\n\nfunction concatFiles(files) {\n  return files.map(f => stripBOM(fs.readFileSync(f, 'utf8'))).join('\\n\\n');\n}"
  );
  build = build.replace(
    "const passageContents = passageFiles.map(f => fs.readFileSync(f, 'utf8'));",
    "const passageContents = passageFiles.map(f => stripBOM(fs.readFileSync(f, 'utf8')));"
  );
}
fs.writeFileSync('tools/build.js', build, 'utf8');
console.log('Updated tools/build.js');

let check = fs.readFileSync('tools/check-links.js', 'utf8');
if (!check.includes('function stripBOM')) {
  check = check.replace(
    "function findTweeFiles() {",
    "function stripBOM(content) {\n  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;\n}\n\nfunction findTweeFiles() {"
  );
  check = check.replace(
    /const content = fs\.readFileSync\(file, 'utf8'\);/g,
    "const content = stripBOM(fs.readFileSync(file, 'utf8'));"
  );
}
fs.writeFileSync('tools/check-links.js', check, 'utf8');
console.log('Updated tools/check-links.js');

let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(
  /\"description\":\s*\"[^\"]+\"/,
  '"description": "Twine 2 + SugarCube 2 \\u6587\\u5b57\\u5192\\u9669\\u6e38\\u620f\\uff1a\\u65e0\\u5c3d\\u96ea\\u591c"'
);
fs.writeFileSync('package.json', pkg, 'utf8');
console.log('Updated package.json');