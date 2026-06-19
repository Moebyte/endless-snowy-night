const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\witch.js';
let s = fs.readFileSync(p, 'utf8');

// The witch is gentle by nature: she only curses someone the prophet has
// confirmed as an enemy (suspect flag), not merely anyone she senses killing
// intent from. Threshold 30 means: bare wolf (24) is NOT enough, but a
// suspect-flagged wolf (24 + 8*1.2 = ~34) clears it. This keeps her saves
// as the primary action and makes curses rare, evidence-driven decisions.
const before1 = "    // Curse wolves the witch can sense killing intent from (score >= 15).\n    // A bare wolf scores 20*1.2 = 24 before variance (~20-28 after),\n    // while a non-wolf only scores ~3, so innocents are never cursed on\n    // identity alone. Suspect/behaviour flags push borderline cases over.\n    return bestScore >= 15 ? best : null;";
const after1 = "    // The witch is gentle: she only curses someone the prophet confirmed as\n    // an enemy (suspect flag), not merely anyone radiating killing intent.\n    // Threshold 30: a bare wolf scores ~24 (not enough), but a suspect-flagged\n    // wolf scores ~34 (clears it). Keeps curses rare and evidence-driven.\n    return bestScore >= 30 ? best : null;";
if (!s.includes(before1)) { console.error('FAIL pattern 1'); process.exit(1); }
s = s.replace(before1, after1);

// Update curseMargin baseline to match (30, not 15)
const before2 = "    var curseMargin = curseTarget ? (curseScore - 15) / 15 : -1;";
const after2 = "    var curseMargin = curseTarget ? (curseScore - 30) / 30 : -1;";
if (!s.includes(before2)) { console.error('FAIL pattern 2'); process.exit(1); }
s = s.replace(before2, after2);

fs.writeFileSync(p, s, 'utf8');
console.log('witch.js re-patched: curse threshold 15 -> 30 (evidence-driven, gentle witch)');
