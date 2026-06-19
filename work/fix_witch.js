const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\witch.js';
let s = fs.readFileSync(p, 'utf8');

// Use regex to be resilient to exact whitespace
// Fix 1: raise base wolf threat score 15 -> 20
let m1 = s.match(/(if \(WOLF_ROLES\.indexOf\(role\) !== -1\) \{\s*)score \+= 15 \* w\.threat;/);
if (!m1) { console.error('FAIL: pattern 1 not found'); process.exit(1); }
s = s.replace(/(if \(WOLF_ROLES\.indexOf\(role\) !== -1\) \{\s*)score \+= 15 \* w\.threat;/,
  '$1// Wolves radiate killing intent the witch can sense; base score clears\n      // the curse threshold on its own (see witchAIGetCurseTarget).\n      score += 20 * w.threat;');

// Fix 2: lower curse threshold 25 -> 15
let m2 = s.match(/Only curse confirmed\/strongly suspected wolves \(score >= 25\)/);
if (!m2) { console.error('FAIL: pattern 2 not found'); process.exit(1); }
s = s.replace(
  /\/\/ Only curse confirmed\/strongly suspected wolves \(score >= 25\)\s*return bestScore >= 25 \? best : null;/,
  '// Curse wolves the witch can sense killing intent from (score >= 15).\n    // A bare wolf scores 20*1.2 = 24 before variance (~20-28 after),\n    // while a non-wolf only scores ~3, so innocents are never cursed on\n    // identity alone. Suspect/behaviour flags push borderline cases over.\n    return bestScore >= 15 ? best : null;');

// Fix 3: update curseMargin baseline
let m3 = s.match(/var curseMargin = curseTarget \? \(curseScore - 25\) \/ 25 : -1/);
if (!m3) { console.error('FAIL: pattern 3 not found'); process.exit(1); }
s = s.replace(/var curseMargin = curseTarget \? \(curseScore - 25\) \/ 25 : -1/,
  'var curseMargin = curseTarget ? (curseScore - 15) / 15 : -1');

fs.writeFileSync(p, s, 'utf8');
console.log('witch.js patched OK');
