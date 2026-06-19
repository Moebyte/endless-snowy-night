const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\knight.js';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);

// Line-level edits. Each entry: [lineIndex(1-based), newContentWithoutEOL]
const edits = {
  // knightDuel: check duelCooldown instead of weakenedDays
  22: "    if ((k.duelCooldown || 0) > 0) return { ok: false, reason: 'duel_cooldown' };",
  // After line 28 (isWolf declaration), insert duelCooldown=1. We do this by
  // modifying line 28 to append the cooldown set on the action path.
  28: "    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;\r\r    // Duel is a day action with its own cooldown, independent of guarding.\r    k.duelCooldown = 1;",
  // knightWeakened: keep as coarse gate, but check both cooldowns
  45: "    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;",
  // Insert precise per-skill checks after line 46 (closing brace of knightWeakened)
  46: "  };\r\r  // Precise per-skill cooldown checks.\r  Game.knightDuelOnCooldown = function () {\r    var k = ensureState().godSkills.knight;\r    return (k.duelCooldown || 0) > 0;\r  };\r  Game.knightGuardOnCooldown = function () {\r    var k = ensureState().godSkills.knight;\r    return (k.guardCooldown || 0) > 0;\r  };",
  // knightReset: tick down BOTH cooldowns
  51: "    // Each night both independent cooldowns tick down by one.\r    if ((k.duelCooldown || 0) > 0) k.duelCooldown -= 1;\r    if ((k.guardCooldown || 0) > 0) k.guardCooldown -= 1;\r    // Legacy field kept at 0 for old-save compatibility.\r    k.weakenedDays = 0;",
  // knightAIGetDuelTarget: use precise duel cooldown
  60: "    if (Game.knightDuelOnCooldown()) return null;",
  // knightGuard: check guardCooldown
  99: "    if ((k.guardCooldown || 0) > 0) return { ok: false, reason: 'guard_cooldown' };",
  // knightGuard success: set guardCooldown=1 instead of weakenedDays=2
  109: "    // Guard has its own cooldown, independent of dueling.\r    k.guardCooldown = 1;",
  // knightAIGetGuardTarget: use precise guard cooldown
  129: "    if (Game.knightGuardOnCooldown()) return null;",
};

// Apply edits. The multi-line insertions use \r as a placeholder that we
// convert to the file's real EOL after joining.
for (const idx in edits) {
  lines[Number(idx) - 1] = edits[idx];
}
let out = lines.join(eol);
// Convert the \r placeholders inside inserted strings to real EOL
out = out.replace(/\r(?!\\)/g, eol);
// But we may have introduced stray \r from the original split; re-normalize.
out = out.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, eol);

fs.writeFileSync(p, out, 'utf8');
console.log('knight.js edited by line numbers');
