const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\knight.js';
let s = fs.readFileSync(p, 'utf8');

// --- Refactor: split shared weakenedDays into independent duel/guard cooldowns ---
// Duel (day action) and guard (night action) no longer share a cooldown.

// 1. knightDuel: check duelCooldown, set duelCooldown=1 on success
const oldDuelCheck = "    var k = g.godSkills.knight;\n    if ((k.weakenedDays || 0) > 0) return { ok: false, reason: 'weakened' };\n    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };\n    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };\n    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_duel_self' };\n\n    var targetRole = Game.roleOf(targetId);\n    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;\n\n    if (isWolf) {\n      Game.kill(targetId);";
const newDuelCheck = "    var k = g.godSkills.knight;\n    if ((k.duelCooldown || 0) > 0) return { ok: false, reason: 'duel_cooldown' };\n    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };\n    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };\n    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_duel_self' };\n\n    var targetRole = Game.roleOf(targetId);\n    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;\n\n    // Duel is a day action with its own cooldown, independent of guarding.\n    k.duelCooldown = 1;\n\n    if (isWolf) {\n      Game.kill(targetId);";
if (!s.includes(oldDuelCheck)) { console.error('FAIL: duel block not found'); process.exit(1); }
s = s.replace(oldDuelCheck, newDuelCheck);

// 2. knightWeakened -> keep as "either cooldown active" for UI/AI gating,
//    but add precise checks. Replace the function body.
const oldWeak = "  Game.knightWeakened = function () {\n    var k = ensureState().godSkills.knight;\n    return (k.weakenedDays || 0) > 0;\n  };";
const newWeak = "  // True if either skill is on cooldown (used as a coarse gate).\n  Game.knightWeakened = function () {\n    var k = ensureState().godSkills.knight;\n    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;\n  };\n  // Precise per-skill cooldown checks.\n  Game.knightDuelOnCooldown = function () {\n    var k = ensureState().godSkills.knight;\n    return (k.duelCooldown || 0) > 0;\n  };\n  Game.knightGuardOnCooldown = function () {\n    var k = ensureState().godSkills.knight;\n    return (k.guardCooldown || 0) > 0;\n  };";
if (!s.includes(oldWeak)) { console.error('FAIL: weakened block not found'); process.exit(1); }
s = s.replace(oldWeak, newWeak);

// 3. knightReset: tick down BOTH cooldowns each night
const oldReset = "  Game.knightReset = function () {\n    var g = ensureState();\n    var k = g.godSkills.knight;\n    if (k.weakenedDays > 0) k.weakenedDays -= 1;\n    k.currentGuard = null;\n    k.guarding = null;\n  };";
const newReset = "  Game.knightReset = function () {\n    var g = ensureState();\n    var k = g.godSkills.knight;\n    // Each night, both independent cooldowns tick down by one.\n    if ((k.duelCooldown || 0) > 0) k.duelCooldown -= 1;\n    if ((k.guardCooldown || 0) > 0) k.guardCooldown -= 1;\n    // Legacy field kept at 0 for old-save compatibility.\n    k.weakenedDays = 0;\n    k.currentGuard = null;\n    k.guarding = null;\n  };";
if (!s.includes(oldReset)) { console.error('FAIL: reset block not found'); process.exit(1); }
s = s.replace(oldReset, newReset);

// 4. knightAIGetDuelTarget: use precise duel cooldown check
const oldDuelAI = "    if (Game.knightWeakened()) return null;\n\n    var shared = g.godSkills.prophet.sharedWith;";
const newDuelAI = "    if (Game.knightDuelOnCooldown()) return null;\n\n    var shared = g.godSkills.prophet.sharedWith;";
if (!s.includes(oldDuelAI)) { console.error('FAIL: duel AI block not found'); process.exit(1); }
s = s.replace(oldDuelAI, newDuelAI);

// 5. knightGuard: check guardCooldown (not shared), set guardCooldown=1
const oldGuard = "    var k = g.godSkills.knight;\n    if ((k.weakenedDays || 0) > 0) return { ok: false, reason: 'weakened' };\n    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };\n    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };\n    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_guard_self' };\n\n    // Cannot guard same person two nights in a row\n    if (k.lastGuardTarget === targetId) return { ok: false, reason: 'consecutive_guard' };\n\n    k.guarding = targetId;\n    k.lastGuardTarget = targetId;\n    k.weakenedDays = 2;";
const newGuard = "    var k = g.godSkills.knight;\n    if ((k.guardCooldown || 0) > 0) return { ok: false, reason: 'guard_cooldown' };\n    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };\n    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };\n    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_guard_self' };\n\n    // Cannot guard same person two nights in a row\n    if (k.lastGuardTarget === targetId) return { ok: false, reason: 'consecutive_guard' };\n\n    k.guarding = targetId;\n    k.lastGuardTarget = targetId;\n    // Guard has its own cooldown, independent of dueling.\n    k.guardCooldown = 1;";
if (!s.includes(oldGuard)) { console.error('FAIL: guard block not found'); process.exit(1); }
s = s.replace(oldGuard, newGuard);

// 6. knightAIGetGuardTarget: use precise guard cooldown check
const oldGuardAI = "    if (Game.knightWeakened()) return null;\n\n    // Prioritize protecting key good guys";
const newGuardAI = "    if (Game.knightGuardOnCooldown()) return null;\n\n    // Prioritize protecting key good guys";
if (!s.includes(oldGuardAI)) { console.error('FAIL: guard AI block not found'); process.exit(1); }
s = s.replace(oldGuardAI, newGuardAI);

fs.writeFileSync(p, s, 'utf8');
console.log('knight.js refactored: duel/guard cooldowns split');
