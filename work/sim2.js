var fs = require('fs');
var code1 = fs.readFileSync('./src/scripts/state.js', 'utf8');
var code2 = fs.readFileSync('./src/scripts/game.js', 'utf8');
var sandbox = {}; sandbox.window = sandbox; sandbox.GameState = {}; sandbox.Game = {}; sandbox.State = { variables: {} };
with (sandbox) { eval(code1); eval(code2); }

var GS = sandbox.GameState;
var G = sandbox.Game;
var S = sandbox.State;

function newGame() {
  S.variables.game = GS.create();
  S.variables.game.day = 1;
  S.variables.game.time = '23:00';
  return S.variables.game;
}

function aliveList(g) {
  return Object.keys(g.alive).filter(function(k) { return g.alive[k]; });
}

function aliveGood(g) {
  var wolves = ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'];
  return Object.keys(g.alive).filter(function(k) { return g.alive[k] && wolves.indexOf(k) === -1; });
}

function aliveWolves(g) {
  var wolves = ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'];
  return wolves.filter(function(w) { return g.alive[w]; });
}

function name(id) { return GS.PROFILES[id] ? GS.PROFILES[id].name : id; }

console.log('========================================');
console.log('  《无尽雪夜》10 夜 AI 决策模拟');
console.log('========================================\n');

var g = newGame();

for (var night = 1; night <= 10; night++) {
  g.day = night;
  g.time = '23:00';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('第 ' + night + ' 夜  |  存活: ' + aliveList(g).length + '/12');
  console.log('  好人: ' + aliveGood(g).map(name).join(', '));
  console.log('  狼人: ' + aliveWolves(g).map(name).join(', '));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (aliveGood(g).length <= 1) {
    console.log('  >> 好人阵营覆灭，模拟结束。\n');
    break;
  }
  if (aliveWolves(g).length === 0) {
    console.log('  >> 狼人全灭，好人胜利！\n');
    break;
  }

  // ---- 预言家行动 ----
  if (G.isAlive('fang_heng')) {
    // 验一个没验过的活人（优先验未知角色）
    var candidates = aliveList(g).filter(function(k) { return k !== 'fang_heng'; });
    if (candidates.length > 0) {
      var target = candidates[Math.floor(Math.random() * candidates.length)];
      var result = G.prophetCheck(target);
      console.log('  [预言家] 方衡 验 ' + name(target) + ' -> "' + result.perception.substring(0, 30) + '..."');
    }
  } else {
    console.log('  [预言家] 方衡已死');
  }

  // ---- 魔术师行动 ----
  if (G.isAlive('shen_shen')) {
    // 随机选两个活人交换（模拟盲赌）
    var allAlive = aliveList(g).filter(function(k) { return k !== 'shen_shen'; });
    if (allAlive.length >= 2 && G.magicianSwapsRemaining() > 0) {
      var a = allAlive[Math.floor(Math.random() * allAlive.length)];
      var remaining = allAlive.filter(function(k) { return k !== a; });
      var b = remaining[Math.floor(Math.random() * remaining.length)];
      var swapR = G.magicianSwap(a, b);
      if (swapR.ok) {
        console.log('  [魔术师] 沈慎交换: ' + name(a) + ' <-> ' + name(b));
      } else {
        console.log('  [魔术师] 沈慎无法交换 (' + swapR.reason + ')');
      }
    }
  } else {
    console.log('  [魔术师] 沈慎已死');
  }

  // ---- 狼人击杀 ----
  var killResult = G.executeWolfKill();
  if (killResult.target) {
    var line = '  [狼人] 目标: ' + name(killResult.target);
    if (killResult.swapped) {
      line += ' -> (交换!) 实际: ' + name(killResult.actualTarget);
    } else {
      line += ' -> 击杀: ' + name(killResult.actualTarget || killResult.target);
    }
    if (killResult.friendlyFire) line += ' [友军伤害!]';
    if (killResult.mutualKill) line += ' [狼王同归于尽! ' + name(killResult.killer) + ' 也死]';
    if (killResult.special === 'body_removed') line += ' [清道夫抹尸]';
    if (killResult.special === 'protected_by_knight') line += ' [骑士保护! 无人死亡]';
    if (!killResult.killed) line += ' [目标存活]';
    console.log(line);
  } else {
    console.log('  [狼人] 无可用目标');
  }
  G.setLastWolfKill(killResult);

  // ---- 女巫感知 + AI 决策 ----
  if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
    var sensed = G.witchSenseDeath();
    if (sensed) {
      console.log('  [女巫] 叶知秋感知到: ' + name(sensed) + ' 正在死去');
      var shouldSave = G.witchAIShouldSave(sensed);
      var remaining = G.witchRemaining();
      if (shouldSave && remaining > 0) {
        var reviveR = G.witchRevive(sensed, false);
        console.log('  [女巫] 叶知秋决定还魂 ' + name(sensed) + ' (额度 ' + (remaining-1) + '/3 剩余)');
        if (reviveR.reason === 'broken') {
          console.log('  [女巫] !! 叶知秋精神崩溃！永久失去能力');
        }
      } else {
        console.log('  [女巫] 叶知秋选择不救 (评分不足或保留额度, 剩余 ' + remaining + '/3)');
      }
    } else {
      if (killResult.killed) {
        console.log('  [女巫] 叶知秋无法感知尸体 (可能被抹除)');
      }
    }
  } else if (!G.isAlive('ye_zhiqiu')) {
    console.log('  [女巫] 叶知秋已死');
  }

  // ---- 骑士保护（已在 executeWolfKill 内处理） ----
  if (killResult.special === 'protected_by_knight') {
    console.log('  [骑士] 林小满保护了目标，但进入虚弱状态');
  }

  // ---- 结算 ----
  console.log('');
  console.log('  >> 本夜结果:');
  var deaths = [];
  if (killResult.killed && killResult.special !== 'protected_by_knight') {
    if (killResult.actualTarget && !G.isAlive(killResult.actualTarget)) {
      deaths.push(name(killResult.actualTarget));
    }
    if (killResult.mutualKill && killResult.killer && !G.isAlive(killResult.killer)) {
      deaths.push(name(killResult.killer));
    }
  }
  if (deaths.length > 0) {
    console.log('  死亡: ' + deaths.join(', '));
  } else {
    console.log('  无人死亡');
  }

  // 每日重置
  G.knightReset();
  G.magicianResetDaily();

  // ---- 女巫诅咒 AI 决策（新增）----
  if (G.isAlive('ye_zhiqiu') && !G.witchBroken() && G.witchRemaining() > 0) {
    var curseTarget = G.witchAIGetCurseTarget();
    if (curseTarget) {
      var curseScore = G.witchScoreCurse(curseTarget);
      var curseR = G.witchCurse(curseTarget);
      var remAfter = G.witchRemaining();
      console.log('  [女巫诅咒] 叶知秋诅咒 ' + name(curseTarget) + ' (评分' + curseScore + ', 剩余额度 ' + remAfter + '/3)');
      if (curseR.reason === 'broken') {
        console.log('  [女巫诅咒] !! 叶知秋精神崩溃！永久失去能力');
      }
    }
  }

  G.witchClearSensedDeath();

  console.log('\n');
}

console.log('========================================');
console.log('  模拟结束');
console.log('  最终存活: ' + aliveList(g).map(name).join(', '));
console.log('========================================');