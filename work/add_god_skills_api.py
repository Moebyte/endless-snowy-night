# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Find the pursuit section marker and insert god skills before it
marker = "  // ---------- 追击战系统 ----------"

god_skills_api = """
  // ---------- 神职技能系统 ----------

  // ===== 女巫（叶知秋）：诅咒与还魂，合计 3 次/轮 =====
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
  // 诅咒（投毒）
  Game.witchCurse = function (targetId) {
    var g = ensureState();
    var w = g.godSkills.witch;
    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: 'broken' };
    w.uses += 1;
    w.curses.push({ target: targetId, type: 'curse' });
    // 诅咒在当夜生效，目标死亡
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
    if (witnessed) {
      // 众人面前还魂会暴露身份
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

  // ===== 骑士（林小满）：决斗斩杀 =====
  Game.knightDuel = function (targetId) {
    var g = ensureState();
    var k = g.godSkills.knight;
    if (k.weakened) return { ok: false, reason: 'weakened' };
    k.duelsUsed += 1;
    k.lastTarget = targetId;
    k.weakened = true; // 决斗后进入虚弱状态
    var targetRole = Game.roleOf(targetId);
    var wolfRoles = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];
    var isWolf = wolfRoles.indexOf(targetRole) !== -1;
    if (isWolf) {
      // 斩杀狼人
      Game.kill(targetId);
      // 如果是狼王，触发同归于尽（除非被毒，但这里是决斗不是毒）
      if (targetRole === 'wolf_king') {
        // 狼王同归于尽：骑士也死
        Game.kill('lin_xiaoman');
        return { ok: true, reason: 'wolf_king_mutual' };
      }
      return { ok: true, reason: 'killed_wolf', role: targetRole };
    } else {
      // 目标不是狼人，骑士自己死
      Game.kill('lin_xiaoman');
      return { ok: true, reason: 'innocent_killed', role: targetRole };
    }
  };
  Game.knightWeakened = function () {
    return ensureState().godSkills.knight.weakened;
  };
  // 每天重置骑士虚弱状态
  Game.knightReset = function () {
    var g = ensureState();
    g.godSkills.knight.weakened = false;
  };

  // ===== 预言家（方衡）：夜间探查阵营 =====
  Game.prophetCheck = function (targetId) {
    var g = ensureState();
    var pr = g.godSkills.prophet;
    var targetRole = Game.roleOf(targetId);
    var wolfRoles = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];
    var godRoles = ['prophet', 'witch', 'knight', 'magician'];
    var result;
    if (wolfRoles.indexOf(targetRole) !== -1) {
      // 隐狼对预言家显示为盟友
      if (targetRole === 'hidden_wolf') {
        result = 'ally';
      } else {
        result = 'enemy';
      }
    } else if (godRoles.indexOf(targetRole) !== -1) {
      result = 'ally';
    } else {
      // 村民：怀有杀意时显示为敌人
      result = 'ally';
    }
    pr.checks.push({ target: targetId, result: result });
    return { ok: true, result: result, target: targetId };
  };
  Game.prophetResults = function () {
    return ensureState().godSkills.prophet.checks;
  };
  Game.prophetLastResult = function (targetId) {
    var checks = ensureState().godSkills.prophet.checks;
    for (var i = checks.length - 1; i >= 0; i--) {
      if (checks[i].target === targetId) return checks[i].result;
    }
    return null;
  };

  // ===== 神职技能每日/每轮重置 =====
  Game.resetGodSkillsDaily = function () {
    var g = ensureState();
    g.godSkills.knight.weakened = false;
  };

  Game.resetGodSkillsLoop = function () {
    var g = ensureState();
    g.godSkills.witch = { uses: 0, maxUses: 3, broken: false, hasReviveTarget: null, curses: [] };
    g.godSkills.knight = { duelsUsed: 0, weakened: false, lastTarget: null };
    g.godSkills.prophet = { checks: [], exposed: false };
  };

"""

if marker in c and 'witchCurse' not in c:
    c = c.replace(marker, god_skills_api + '\n' + marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added god skills API. File length:', len(c))
elif 'witchCurse' in c:
    print('God skills already exist')
else:
    print('Marker not found')