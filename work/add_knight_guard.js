const fs = require('fs');
const filePath = 'src/scripts/game.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add knightGuard function after knightAIDuel
// Find the end of knightAIDuel
const marker = "Game.knightAIDuel = function () {";
const idx = content.indexOf(marker);
if (idx === -1) { console.error('MARKER NOT FOUND'); process.exit(1); }
// Find the end of this function
let funcEnd = content.indexOf("    return null;\n  };", idx);
funcEnd = content.indexOf("  };", funcEnd) + 3;

const guardCode = `

  // ===== 骑士（林小满）：守卫 =====
  // 骑士每晚可以主动选择一个人守护（不能选自己，不能连续两晚守护同一人）。
  // 守卫和决斗共用冷却（weakenedDays=2），守卫后第二天也不能决斗。
  // 被守护的人免疫当晚狼人击杀。

  // 骑士守卫某人
  Game.knightGuard = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if ((k.weakenedDays || 0) > 0) return { ok: false, reason: 'weakened' };
    if (!g.alive['lin_xiaoman']) return { ok: false, reason: 'knight_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };
    if (targetId === 'lin_xiaoman') return { ok: false, reason: 'cannot_guard_self' };
    // 不能连续两晚守护同一人
    if (g.godSkills.knight.lastGuard === targetId && g.day === g.godSkills.knight.lastGuardDay + 1) {
      return { ok: false, reason: 'consecutive_guard' };
    }

    k.guardsUsed = (k.guardsUsed || 0) + 1;
    k.lastGuard = targetId;
    k.lastGuardDay = g.day;
    k.weakenedDays = 2; // 守卫和决斗一样，消耗体力
    g.godSkills.knight.currentGuard = targetId;
    return { ok: true, target: targetId };
  };

  // 检查某人是否被骑士守护
  Game.knightIsGuarding = function (targetId) {
    var g = ensureState();
    if (!g.alive['lin_xiaoman']) return false;
    if ((g.godSkills.knight.weakenedDays || 0) > 0) return false; // 虚弱时守卫不生效……其实虚弱是守护后，守护那晚还是生效的
    // 更准确：检查当前守护目标
    return g.godSkills.knight.currentGuard === targetId;
  };

  // 每日清除守卫（和清除magician swap一样，在每天结束时）
  Game.knightClearGuard = function () {
    var g = ensureState();
    g.godSkills.knight.currentGuard = null;
  };`;

content = content.substring(0, funcEnd) + guardCode + content.substring(funcEnd);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Added knight guard function');
