const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\knight.js';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
// split preserving no trailing eol issues
let lines = raw.split(/\r?\n/);

// helper: replace a line whose trimmed content matches, with one or more new lines (array)
function replaceLine(trimMatch, newLines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === trimMatch) {
      lines.splice(i, 1, ...newLines);
      return true;
    }
  }
  console.error('NOT FOUND: ' + trimMatch);
  process.exit(1);
}

// 1. knightDuel cooldown check: weakenedDays -> duelCooldown
replaceLine("if ((k.weakenedDays || 0) > 0) return { ok: false, reason: 'weakened' };", [
  "    if ((k.duelCooldown || 0) > 0) return { ok: false, reason: 'duel_cooldown' };"
]);

// 2. After isWolf declaration, set duelCooldown on the action path.
replaceLine("var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;", [
  "    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;",
  "",
  "    // Duel is a day action with its own cooldown, independent of guarding.",
  "    k.duelCooldown = 1;"
]);

// 3. knightWeakened body: check both cooldowns
replaceLine("return (k.weakenedDays || 0) > 0;", [
  "    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;"
]);

// 4. Replace the closing of knightWeakened to append precise checks.
// The line "  };" appears many times, so we anchor on the unique knightReset start.
replaceLine("if (k.weakenedDays > 0) k.weakenedDays -= 1;", [
  "    // Each night both independent cooldowns tick down by one.",
  "    if ((k.duelCooldown || 0) > 0) k.duelCooldown -= 1;",
  "    if ((k.guardCooldown || 0) > 0) k.guardCooldown -= 1;",
  "    // Legacy field kept at 0 for old-save compatibility.",
  "    k.weakenedDays = 0;"
]);

// 5. Insert precise per-skill check functions right before knightReset.
// Find knightReset line and inject before it.
const resetIdx = lines.findIndex(l => l.includes('Game.knightReset = function'));
if (resetIdx === -1) { console.error('knightReset not found'); process.exit(1); }
lines.splice(resetIdx, 0,
  "  // Precise per-skill cooldown checks (day duel vs night guard are independent).",
  "  Game.knightDuelOnCooldown = function () {",
  "    var k = ensureState().godSkills.knight;",
  "    return (k.duelCooldown || 0) > 0;",
  "  };",
  "  Game.knightGuardOnCooldown = function () {",
  "    var k = ensureState().godSkills.knight;",
  "    return (k.guardCooldown || 0) > 0;",
  "  };",
  ""
);

// 6. knightAIGetDuelTarget: first occurrence of "if (Game.knightWeakened()) return null;"
// We need the one in the duel AI (before "var shared"). Replace by matching next line.
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Game.knightWeakened()') && lines[i].includes('return null') && lines[i+1] && lines[i+1].includes('var shared')) {
    lines[i] = lines[i].replace('Game.knightWeakened()', 'Game.knightDuelOnCooldown()');
    break;
  }
}

// 7. knightGuard cooldown check (the second "weakenedDays" line)
// Re-find since array changed; match by content
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("weakenedDays || 0") && lines[i].includes("reason: 'weakened'")) {
    lines[i] = "    if ((k.guardCooldown || 0) > 0) return { ok: false, reason: 'guard_cooldown' };";
  }
}

// 8. knightGuard success: weakenedDays = 2 -> guardCooldown = 1
replaceLine("k.weakenedDays = 2;", [
  "    // Guard has its own cooldown, independent of dueling.",
  "    k.guardCooldown = 1;"
]);

// 9. knightAIGetGuardTarget: the other "if (Game.knightWeakened()) return null;" -> guard check.
// It's followed by "// Prioritize protecting key good guys"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Game.knightWeakened()') && lines[i].includes('return null') && lines[i+1] && lines[i+1].includes('Prioritize protecting')) {
    lines[i] = lines[i].replace('Game.knightWeakened()', 'Game.knightGuardOnCooldown()');
    break;
  }
}

// Verify no stray weakenedDays in logic (except legacy reset which we set to 0)
const remaining = lines.filter(l => l.includes('weakenedDays')).map((l,i,arr)=>l);
console.log('Remaining weakenedDays refs:', remaining.length);
remaining.forEach(l => console.log('  ', l.trim()));

fs.writeFileSync(p, lines.join(eol), 'utf8');
console.log('knight.js written, ' + lines.length + ' lines');
