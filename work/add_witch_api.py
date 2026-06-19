# -*- coding: utf-8 -*-
p = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Find the old witch API section and replace with expanded version
old_marker = "  // ===== 女巫（叶知秋）：诅咒与还魂，合计 3 次/轮 ====="
end_marker = "  // ===== 骑士（林小满）：决斗斩杀 ====="

new_witch_api = """  // ===== 女巫（叶知秋）：生命感知 + 诅咒/还魂 + 毒药制作 =====

  // ---- 生命感知（被动，不消耗额度） ----
  // 在夜间结算时调用：感知到谁死了，返回可救的目标
  Game.witchSenseDeath = function () {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (w.broken) return null;
    // 从 lastWolfKill 获取今夜被杀的人
    var lastKill = g.lastWolfKill;
    if (!lastKill || !lastKill.killed) return null;
    // 清道夫狼抹除尸体后，女巫无法感知（没有尸体）
    if (lastKill.special === 'body_removed') return null;
    w.sensedDeath = lastKill.actualTarget;
    return lastKill.actualTarget;
  };

  Game.witchGetSensedDeath = function () {
    return ensureState().godSkills.witch.sensedDeath;
  };

  Game.witchClearSensedDeath = function () {
    ensureState().godSkills.witch.sensedDeath = null;
  };

  // ---- 女巫 AI 多维度评分：评估救人的优先级 ----
  // 维度：对陈默的重要性、角色威胁（对狼的威胁=对好人的价值）、稀有度、信任度
  Game.WITCH_AI_WEIGHTS = {
    chenmo_proximity: 35,  // 和陈默的亲近度（苏晚 > 江白 > 老郑 > 其他）
    role_value: 30,        // 角色对好人阵营的价值（神职 > 村民）
    scarcity: 20,          // 角色是否稀有（存活人数越少，每个生命越珍贵）
    trust: 15              // 女巫个人对目标的信任
  };

  Game.witchScoreSave = function (targetId) {
    var g = ensureState();
    var score = 0;
    var w = Game.WITCH_AI_WEIGHTS;

    // 1. 和陈默的亲近度
    var proximityMap = {
      su_wan: 10, jiang_bai: 8, zheng_shoushan: 6,
      lin_xiaoman: 5, fang_heng: 5, shen_shen: 4,
      ye_zhiqiu: 3, gu_yan: 3, zhou_yang: 1,
      tang_xiaotang: 1, zhao_mingcheng: 1
    };
    score += (proximityMap[targetId] || 3) * w.chenmo_proximity;

    // 2. 角色价值（神职 > 有信息的人 > 普通村民）
    var role = Game.roleOf(targetId);
    var godRoles = ['prophet', 'witch', 'knight', 'magician'];
    if (godRoles.indexOf(role) !== -1) {
      score += 9 * w.role_value;
    } else if (targetId === 'zheng_shoushan' || targetId === 'chen_mo') {
      score += 7 * w.role_value; // 有信息的人
    } else {
      score += 4 * w.role_value;
    }

    // 3. 稀有度：存活越少越珍贵
    var aliveCount = Object.keys(g.alive).filter(function (k) { return g.alive[k]; }).length;
    score += (12 - aliveCount) * w.scarcity;

    // 4. 信任度
    var trustKey = 'trust_' + targetId;
    score += (g.stats[trustKey] || 20) / 10 * w.trust;

    return Math.round(score);
  };

  // 女巫 AI 评估是否值得救某人（返回 true/false）
  Game.witchAIShouldSave = function (targetId) {
    if (Game.witchBroken()) return false;
    if (Game.witchRemaining() <= 0) return false;
    var score = Game.witchScoreSave(targetId);
    // 高于阈值才救（保留额度给更重要的人）
    return score > 200;
  };

  // ---- 诅咒与还魂（消耗额度，合计 3 次/轮） ----
  Game.witchUses = function () {
    return ensureState().godSkills.witch.uses;
  };
  Game.witchRemaining = function () {
    var w = ensureState().godSkills.witch;
    return w.broken ? 0 : (w.maxUses - w.uses);
  };
  Game.witchBroken = function () {
    return ensureState().godSkills.witch.broken;
  };

  // 诅咒（杀人）
  Game.witchCurse = function (targetId) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: 'broken' };
    w.uses += 1;
    w.curses.push({ target: targetId, type: 'curse' });
    Game.kill(targetId);
    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }
    return { ok: true, reason: 'ok' };
  };

  // 还魂（复活）
  Game.witchRevive = function (targetId, witnessed) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: 'broken' };
    if (g.alive[targetId]) return { ok: false, reason: 'alive' };
    w.uses += 1;
    Game.revive(targetId);
    w.sensedDeath = null;
    if (witnessed) {
      Game.revealInfo('ye_zhiqiu', 'witch_exposed');
    }
    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }
    return { ok: true, reason: 'ok' };
  };

  Game.witchIsExposed = function () {
    return Game.hasRevealed('ye_zhiqiu', 'witch_exposed');
  };

  // ---- 治愈重伤（会暴露身份） ----
  Game.witchHeal = function (targetId) {
    var g = ensureState();
    if (!g.pursuit || !g.pursuit.playerInjured) return { ok: false, reason: 'not_injured' };
    g.pursuit.playerInjured = false;
    // 治愈重伤会暴露女巫身份
    Game.revealInfo('ye_zhiqiu', 'witch_exposed');
    return { ok: true, reason: 'exposed' };
  };

  // ---- 毒药制作（不消耗额度，需要材料） ----
  Game.witchAddMaterial = function (materialId) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (!w.materials) w.materials = {};
    w.materials[materialId] = (w.materials[materialId] || 0) + 1;
  };

  Game.witchHasMaterial = function (materialId) {
    var w = ensureState().godSkills.witch;
    return !!(w.materials && w.materials[materialId]);
  };

  Game.witchCanCraft = function (potionId) {
    var w = ensureState().godSkills.witch;
    var recipe = GameState.WITCH_POTIONS[potionId].recipe;
    if (!w.materials) return false;
    for (var mat in recipe) {
      if ((w.materials[mat] || 0) < recipe[mat]) return false;
    }
    return true;
  };

  Game.witchCraftPotion = function (potionId) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (!Game.witchCanCraft(potionId)) return { ok: false, reason: 'no_materials' };
    // 消耗材料
    var recipe = GameState.WITCH_POTIONS[potionId].recipe;
    for (var mat in recipe) {
      w.materials[mat] -= recipe[mat];
      if (w.materials[mat] <= 0) delete w.materials[mat];
    }
    // 添加毒药
    if (!w.potions) w.potions = {};
    w.potions[potionId] = (w.potions[potionId] || 0) + 1;
    return { ok: true, potion: potionId };
  };

  Game.witchHasPotion = function (potionId) {
    var w = ensureState().godSkills.witch;
    return !!(w.potions && w.potions[potionId]);
  };

  // 使用毒药（不杀人，只控制）
  Game.witchUsePotion = function (potionId, targetId) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (!w.potions || !w.potions[potionId]) return { ok: false, reason: 'no_potion' };
    var potion = GameState.WITCH_POTIONS[potionId];
    w.potions[potionId] -= 1;
    if (w.potions[potionId] <= 0) delete w.potions[potionId];
    // 记录效果
    if (!g.flags) g.flags = {};
    var effectKey = 'potion_effect_' + targetId;
    g.flags[effectKey] = potion.effect;
    return { ok: true, target: targetId, effect: potion.effect, name: potion.name };
  };

  Game.witchPotionEffect = function (targetId) {
    var g = ensureState();
    var key = 'potion_effect_' + targetId;
    return g.flags[key] || null;
  };

"""

# Replace from old_marker to end_marker
start_idx = c.find(old_marker)
end_idx = c.find(end_marker)
if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
    c = c[:start_idx] + new_witch_api + '\n' + c[end_idx:]
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Replaced witch API with full version. Length:', len(c))
else:
    print('Markers not found:', start_idx, end_idx)