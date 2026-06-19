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
console.log('  各神职 7 天轨迹模拟 v2（完整信息链）');
console.log('============================================\n');

for (var day = 1; day <= 7; day++) {
  g.day = day; g.time = '23:00';
  var good = aliveGood(g), wolves = aliveWolves(g);
  console.log('======== 第' + day + '天  好人' + good.length + ' 狼人' + wolves.length + ' ========');
  if (good.length <= 1) { console.log('好人覆灭\n'); break; }
  if (wolves.length === 0) { console.log('狼人全灭！好人胜利\n'); break; }

  // ---- 预言家 ----
  console.log('  [预言家]');
  if (G.isAlive('fang_heng')) {
    var checkTarget = G.prophetAIGetCheckTarget();
    if (checkTarget) {
      var result = G.prophetCheck(checkTarget);
      var ali = result.alignment === 'enemy' ? '[敌人!]' : '[盟友]';
      console.log('    验 ' + name(checkTarget) + ' ' + ali);
      if (result.alignment === 'enemy') {
        var shares = G.prophetAIShareEnemyInfo();
        if (shares) {
          shares.forEach(function(s) {
            var tag = s.result.leaked ? ' [泄漏!]' : '';
            console.log('    → 告诉 ' + name(s.target) + ': "' + name(s.infoTarget) + '是狼"' + tag);
          });
        }
      }
    }
  } else {
    console.log('    方衡已死');
  }

  // ---- 骑士决斗（白天，基于预言家信息）----
  if (G.isAlive('lin_xiaoman') && !G.knightWeakened()) {
    var duelTarget = G.knightAIGetDuelTarget();
    if (duelTarget) {
      var duelResult = G.knightDuel(duelTarget);
      if (duelResult.ok) {
        if (duelResult.reason === 'killed_wolf') {
          console.log('  [骑士] 林小满决斗斩杀 ' + name(duelTarget) + '! (' + duelResult.role + ') [虚弱]');
        } else if (duelResult.reason === 'wolf_king_mutual') {
          console.log('  [骑士] 林小满决斗 ' + name(duelTarget) + '(狼王) → 同归于尽!');
        } else if (duelResult.reason === 'innocent_killed') {
          console.log('  [骑士] 林小满误杀 ' + name(duelTarget) + '! 骑士自己死了');
        }
      }
    }
  }

  // ---- 魔术师 ----
  if (G.isAlive('shen_shen')) {
    var allAlive = aliveList(g).filter(function(k){return k!=='shen_shen';});
    if (allAlive.length >= 2 && G.magicianSwapsRemaining() > 0) {
      var a = allAlive[Math.floor(Math.random()*allAlive.length)];
      var rem = allAlive.filter(function(k){return k!==a;});
      var b = rem[Math.floor(Math.random()*rem.length)];
      var sr = G.magicianSwap(a, b);
      if (sr.ok) console.log('  [魔术师] 交换 ' + name(a) + ' <-> ' + name(b));
    }
  }

  // ---- 狼人 ----
  var kill = G.executeWolfKill();
  G.setLastWolfKill(kill);
  var kl = '  [狼人] 杀 ' + name(kill.target);
  if (kill.swapped) kl += ' →(交换)实际' + name(kill.actualTarget);
  if (kill.special === 'body_removed') kl += ' [抹尸]';
  if (kill.special === 'protected_by_knight') kl += ' [骑士夜间挡!]';
  if (kill.friendlyFire) kl += ' [友伤!]';
  if (kill.mutualKill) kl += ' [狼王同归于尽!]';
  console.log(kl);

  // ---- 女巫 ----
  console.log('  [女巫]');
  if (!G.isAlive('ye_zhiqiu')) { console.log('    已死'); }
  else if (G.witchBroken()) { console.log('    已崩溃'); }
  else {
    var sensed = G.witchSenseDeath();
    if (sensed) {
      console.log('    感知 ' + name(sensed) + ' 正在死去');
      if (G.witchAIShouldSave(sensed) && G.witchRemaining() > 0) {
        var rr = G.witchRevive(sensed, false);
        var bt = rr.reason === 'broken' ? ' [崩溃!]' : '';
        console.log('    → 还魂 ' + name(sensed) + ' (剩余' + G.witchRemaining() + '/3)' + bt);
      } else {
        console.log('    → 不救 (剩余' + G.witchRemaining() + '/3)');
      }
    }
    var ct = G.witchAIGetCurseTarget();
    if (ct) {
      var cs = G.witchScoreCurse(ct);
      var cr = G.witchCurse(ct);
      var bt2 = cr.reason === 'broken' ? ' [崩溃!]' : '';
      console.log('    → 诅咒 ' + name(ct) + ' (评分' + cs + ', 剩余' + G.witchRemaining() + '/3)' + bt2);
    }
  }

  // ---- 结算 ----
  var deaths = [];
  if (kill.killed && kill.special !== 'protected_by_knight' && kill.special !== 'body_removed') {
    if (kill.actualTarget && !G.isAlive(kill.actualTarget)) deaths.push(name(kill.actualTarget));
  }
  if (kill.mutualKill && kill.killer && !G.isAlive(kill.killer)) deaths.push(name(kill.killer));
  console.log('  >> 死亡: ' + (deaths.length > 0 ? deaths.join(', ') : '无人'));

  G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  console.log('');
}

console.log('============================================');
console.log('  最终存活: ' + aliveList(g).map(name).join(', '));
console.log('============================================');
