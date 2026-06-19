const fs = require("fs");
const path = require("path");

const PASSAGES_DIR = path.join(__dirname, "..", "src", "passages");

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function findTweeFiles() {
  const result = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && fullPath.endsWith(".twee")) result.push(fullPath);
    });
  }
  walk(PASSAGES_DIR);
  return result;
}

function parsePassageName(line) {
  const m = line.match(/^::\s+([^[{\n]+)/);
  return m ? m[1].trim() : null;
}

function isDynamicTarget(target) {
  if (!target) return true;
  if (target.startsWith("$") || target.startsWith("_")) return true;
  if (target.includes("(")) return true;
  return ["passage()", "previous()", "return"].includes(target);
}

function extractLinks(content) {
  const links = new Set();
  let m;
  // [[Label->Target]] ? label can contain <<print>>, only Target matters
  const arrowRe = /\[\[[^\]]+?->\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\]/g;
  while ((m = arrowRe.exec(content)) !== null) links.add(m[1]);
  // [[Label|Target]]
  const pipeRe = /\[\[[^\]|]+?\|\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\]/g;
  while ((m = pipeRe.exec(content)) !== null) links.add(m[1]);
  // [[Target]] (no -> or |, entire thing is target)
  const simpleRe = /\[\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\]/g;
  while ((m = simpleRe.exec(content)) !== null) links.add(m[1]);
  // <<goto "Target">>
  const gotoRe = /<<goto\s+["']([^"']+)["']>>/g;
  while ((m = gotoRe.exec(content)) !== null) {
    if (!isDynamicTarget(m[1])) links.add(m[1]);
  }
  // <<include "Target">>
  const includeRe = /<<include\s+["']([^"']+)["']>>/g;
  while ((m = includeRe.exec(content)) !== null) {
    if (!isDynamicTarget(m[1])) links.add(m[1]);
  }
  return Array.from(links);
}

function main() {
  const files = findTweeFiles();
  const passages = new Map();

  files.forEach(file => {
    const content = stripBOM(fs.readFileSync(file, "utf8"));
    const lines = content.split("\n");
    let currentPassage = null;
    let currentContent = "";
    lines.forEach(line => {
      if (line.startsWith("::")) {
        if (currentPassage) passages.set(currentPassage, { file, content: currentContent });
        currentPassage = parsePassageName(line);
        currentContent = "";
      } else if (currentPassage) {
        currentContent += line + "\n";
      }
    });
    if (currentPassage) passages.set(currentPassage, { file, content: currentContent });
  });

  const passageNames = Array.from(passages.keys());
  const brokenLinks = [];
  const incoming = {};
  passageNames.forEach(n => (incoming[n] = []));

  files.forEach(file => {
    const content = stripBOM(fs.readFileSync(file, "utf8"));
    extractLinks(content).forEach(link => {
      if (!passages.has(link)) brokenLinks.push({ file, target: link });
      else incoming[link].push(file);
    });
  });

  const special = ["Start", "StoryInit", "StoryCaption", "StoryMenu", "StoryJavaScript", "StoryStylesheet"];
  const orphans = passageNames.filter(n => {
    if (incoming[n].length > 0) return false;
    if (special.includes(n)) return false;
    return true;
  });

  console.log("=== Twine Passage Check Report ===\n");
  console.log("Files scanned: " + files.length);
  console.log("Passages found: " + passageNames.length + "\n");

  if (brokenLinks.length) {
    console.log("Broken links:");
    brokenLinks.forEach(x => console.log("  - " + x.target + " (from " + path.basename(x.file) + ")"));
    console.log("");
  }
  if (orphans.length) {
    console.log("Orphaned passages (no incoming links):");
    orphans.forEach(n => console.log("  - " + n));
    console.log("");
  }

  if (!brokenLinks.length && !orphans.length) {
    console.log("All checks passed.");
  } else {
    console.log("Please fix the issues above.");
    process.exit(1);
  }
}

main();