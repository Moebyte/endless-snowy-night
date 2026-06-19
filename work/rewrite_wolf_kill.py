# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

old_func = """  Game.executeWolfKill = function () {
    var g = ensureState();
    var target = Game.getWolfTarget();
    if (!target) return { target: null, killed: false };

    var result = {
      target: target,
      targetName: GameState.PROFILES[target] ? GameState.PROFILES[target].name : target,
      killed: true,
      killer: null,
      special: null
    };

    // 检查骑士保护：如果林小满存活且未虚弱，有概率保护目标
    if (Game.isAlive('lin_xiaoman') && !Game.knightWeakened()) {
      if (target === 'tang_xiaotang') {
        // 林小满总是优先保护唐小棠附近的人，但唐小棠是隐狼……
        // 实际上林小满不会保护隐狼，跳过
      } else if (Math.random() < 0.15) {
        // 15% 概率林小满的保护让目标存活
        result.killed = false;
        result.special = 'protected_by_knight';
        return result;
      }
    }

    // 检查女巫还魂：叶知秋有概率自动救人（AI 模拟）
    // 注意：女巫的主动使用由玩家控制，这里不自动触发

    // 执行击杀
    Game.kill(target);

    // 确定凶手（随机选一只活着的狼）
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];
    var aliveWolves = wolves.filter(function (w) { return g.alive[w]; });
    if (aliveWolves.length > 0) {
      result.killer = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
    }

    // 清道夫狼（赵明城）的特殊效果：抹除尸体
    if (result.killer === 'zhao_mingcheng') {
      result.special = 'body_removed'; // 女巫无法救活
    }

    return result;
  };"""

new_func = """  Game.executeWolfKill = function () {
    var g = ensureState();
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];

    // 1. 狼人 AI 选择今夜目标（基于评分）
    var wolfTarget = Game.getWolfTarget();
    if (!wolfTarget) return { target: null, killed: false };

    // 2. 确定执行击杀的狼（排除被魔术师交换的人自身）
    var aliveWolves = wolves.filter(function (w) { return g.alive[w]; });
    var availableKillers = aliveWolves.filter(function (w) {
      // 被交换的人不能自己动手杀自己
      var swap = Game.getMagicianSwap();
      if (swap) {
        var resolved = Game.resolveSwapTarget(w);
        if (resolved === wolfTarget) return false;
      }
      return true;
    });
    if (availableKillers.length === 0) availableKillers = aliveWolves; // fallback
    var killer = availableKillers.length > 0
      ? availableKillers[Math.floor(Math.random() * availableKillers.length)]
      : null;

    var result = {
      target: wolfTarget,
      targetName: GameState.PROFILES[wolfTarget] ? GameState.PROFILES[wolfTarget].name : wolfTarget,
      actualTarget: wolfTarget,
      actualTargetName: GameState.PROFILES[wolfTarget] ? GameState.PROFILES[wolfTarget].name : wolfTarget,
      killed: true,
      killer: killer,
      killerName: killer ? (GameState.PROFILES[killer] ? GameState.PROFILES[killer].name : killer) : null,
      special: null,
      swapped: false,
      friendlyFire: false,
      mutualKill: false
    };

    // 3. 骑士保护检查（15% 概率）
    if (Game.isAlive('lin_xiaoman') && !Game.knightWeakened()) {
      if (wolfTarget !== 'tang_xiaotang' && Math.random() < 0.15) {
        result.killed = false;
        result.special = 'protected_by_knight';
        Game.magicianResetDaily();
        return result;
      }
    }

    // 4. 魔术师交换检查（核心逻辑）
    // 狼人以为自己要杀 wolfTarget，但魔术师可能交换了身份
    var actualVictim = wolfTarget;
    var swap = Game.getMagicianSwap();
    if (swap && Game.isAlive('shen_shen')) {
      // 检查狼人目标是否被交换
      var resolved = Game.resolveSwapTarget(wolfTarget);
      if (resolved !== wolfTarget) {
        // 交换生效！实际被杀的是 resolved
        actualVictim = resolved;
        result.swapped = true;
        result.actualTarget = resolved;
        result.actualTargetName = GameState.PROFILES[resolved] ? GameState.PROFILES[resolved].name : resolved;

        // 检查实际受害者是不是狼人（友军伤害）
        if (aliveWolves.indexOf(resolved) !== -1) {
          result.friendlyFire = true;
          result.special = 'friendly_fire';

          // 如果实际被杀的是狼王，同归于尽
          if (resolved === 'zhou_yang') {
            result.mutualKill = true;
            result.special = 'wolf_king_mutual';
            Game.kill('zhou_yang');
            if (killer) Game.kill(killer);
          } else {
            // 普通狼被友军杀死
            Game.kill(resolved);
          }

          // 清除交换（当夜已使用）
          Game.magicianResetDaily();
          return result;
        }
      }
    }

    // 5. 正常击杀（无交换，或交换后仍杀好人）
    Game.kill(actualVictim);

    // 清道夫狼特殊效果
    if (killer === 'zhao_mingcheng') {
      result.special = 'body_removed';
    }

    // 清除交换（当夜已使用）
    Game.magicianResetDaily();
    return result;
  };"""

if old_func in c:
    c = c.replace(old_func, new_func)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Rewrote executeWolfKill with magician swap logic')
else:
    print('Could not find old executeWolfKill')