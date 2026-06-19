const fs = require('fs');
let code1 = fs.readFileSync('src/scripts/state.js', 'utf8');
let code2 = fs.readFileSync('src/scripts/game.js', 'utf8');
var sandbox = {}; sandbox.window = sandbox; sandbox.GameState = {}; sandbox.Game = {}; sandbox.State = { variables: {} };
with (sandbox) { eval(code1); eval(code2); }
var GS = sandbox.GameState, G = sandbox.Game, S = sandbox.State;

function newGame() { S.variables.game = GS.create(); return S.variables.game; }
function name(id) { return GS.PROFILES[id] ? GS.PROFILES[id].name : id; }
function aliveList(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k];}); }
function aliveWolves(g) { return ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].filter(function(w){return g.alive[w];}); }
function aliveGood(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k] && ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(k)===-1;}); }

var g = newGame();
console.log('============================================');
console.log('  各神职 7 天轨迹模拟（含信任传递系统）');
console.log('============================================\n');

for (var day = 1; day <= 7; day++) {
  g.day = day; g.time = '23:00';
  var good = aliveGood(g), wolves = aliveWolves(g);
  console.log('======== 第' + day + '天  好人' + good.length + ' 狼人' + wolves.length + ' ========');
  if (good.length <= 1) { console.log('好人覆灭，模拟结束\n'); break; }
  if (wolves.length === 0) { console.log('狼人全灭！好人胜利\n'); break; }

  // ---- 预言家行动 ----
  console.log('  [预言家]');
  if (G.isAlive('fang_heng')) {
    var checkTarget = G.prophetAIGetCheckTarget();
    if (checkTarget) {
      var result = G.prophetCheck(checkTarget);
      var ali = result.alignment === 'enemy' ? '[敌人!]' : '[盟友]';
      console.log('    验 ' + name(checkTarget) + ' ' + ali);
      
      // 如果验出狼，尝试分享给有气息的人
      if (result.alignment === 'enemy') {
        var shareResult = G.prophetAIShareEnemyInfo();
        if (shareResult) {
          var leakTag = shareResult.result.leaked ? ' [泄漏!方衡暴露]' : '';
          console.log('    → 分享给 ' + name(shareResult.target) + ': "' + name(shareResult.infoTarget) + '是狼"' + leakTag);
        }
      }
    }
  } else {
    console.log('    方衡已死');
  }

  // ---- 魔术师行动 ----
  if (G.isAlive('shen_shen')) {
    var allAlive = aliveList(g).filter(function(k){return k!=='shen_shen';});
    if (allAlive.length >= 2 && G.magicianSwapsRemaining() > 0) {
      var a = allAlive[Math.floor(Math.random()*allAlive.length)];
      var remaining = allAlive.filter(function(k){return k!==a;});
      var b = remaining[Math.floor(Math.random()*remaining.length)];
      var swapR = G.magicianSwap(a, b);
      if (swapR.ok) {
        console.log('  [魔术师] 交换 ' + name(a) + ' <-> ' + name(b));
      }
    }
  }

  // ---- 狼人击杀 ----
  var kill = G.executeWolfKill();
  G.setLastWolfKill(kill);
  var killLine = '  [狼人] 杀 ' + name(kill.target);
  if (kill.swapped) killLine += ' →(交换)实际杀' + name(kill.actualTarget);
  if (kill.special === 'body_removed') killLine += ' [抹尸]';
  if (kill.special === 'protected_by_knight') killLine += ' [骑士挡!无人死]';
  if (kill.friendlyFire) killLine += ' [友伤!]';
  if (kill.mutualKill) killLine += ' [狼王同归于尽!]';
  console.log(killLine);

  // ---- 骑士保护结果 ----
  if (kill.special === 'protected_by_knight') {
    console.log('  [骑士] 林小满保护了目标，进入虚弱');
  }

  // ---- 女巫行动 ----
  console.log('  [女巫]');
  if (!G.isAlive('ye_zhiqiu')) {
    console.log('    叶知秋已死');
  } else if (G.witchBroken()) {
    console.log('    叶知秋已崩溃');
  } else {
    // 感知死亡
    var sensed = G.witchSenseDeath();
    if (sensed) {
      console.log('    感知到 ' + name(sensed) + ' 正在死去');
      if (G.witchAIShouldSave(sensed) && G.witchRemaining() > 0) {
        var reviveR = G.witchRevive(sensed, false);
        var brokenTag = reviveR.reason === 'broken' ? ' [崩溃!]' : '';
        console.log('    → 还魂 ' + name(sensed) + ' (剩余' + G.witchRemaining() + '/3)' + brokenTag);
      } else {
        console.log('    → 不救 (评分不足/保留额度, 剩余' + G.witchRemaining() + '/3)');
      }
    }
    // 诅咒
    var ct = G.witchAIGetCurseTarget();
    if (ct) {
      var cs = G.witchScoreCurse(ct);
      var cr = G.witchCurse(ct);
      var brokenTag2 = cr.reason === 'broken' ? ' [崩溃!]' : '';
      console.log('    → 诅咒 ' + name(ct) + ' (评分' + cs + ', 剩余' + G.witchRemaining() + '/3)' + brokenTag2);
    }
  }

  // ---- 结算 ----
  var deaths = [];
  if (kill.killed && kill.special !== 'protected_by_knight' && kill.special !== 'body_removed') {
    if (kill.actualTarget && !G.isAlive(kill.actualTarget)) deaths.push(name(kill.actualTarget));
  }
  if (kill.mutualKill && kill.killer && !G.isAlive(kill.killer)) deaths.push(name(kill.killer));
  console.log('  >> 死亡: ' + (deaths.length > 0 ? deaths.join(', ') : '无人死亡'));

  G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  console.log('');
}

console.log('============================================');
console.log('  最终存活: ' + aliveList(g).map(name).join(', '));
console.log('============================================');
