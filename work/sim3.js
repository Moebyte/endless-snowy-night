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
console.log('=== 女巫诅咒 AI 连锁模拟（含预言家验证）===\n');

for (var night = 1; night <= 10; night++) {
  g.day = night; g.time = '23:00';
  var good = aliveGood(g), wolves = aliveWolves(g);
  console.log('--- 第' + night + '夜  好人' + good.length + ' 狼人' + wolves.length + ' ---');
  if (good.length <= 1) { console.log('好人覆灭\n'); break; }
  if (wolves.length === 0) { console.log('狼人全灭！好人胜利\n'); break; }

  // 预言家验人
  if (G.isAlive('fang_heng')) {
    var unchecked = aliveList(g).filter(function(k){return k!=='fang_heng';});
    var target = unchecked[Math.floor(Math.random()*unchecked.length)];
    var result = G.prophetCheck(target);
    var ali = result.alignment === 'enemy' ? '[敌人!]' : '[盟友]';
    console.log('  预言家验 ' + name(target) + ' ' + ali);
  }

  // 狼人击杀
  var kill = G.executeWolfKill();
  G.setLastWolfKill(kill);
  var killLine = '  狼人杀 ' + name(kill.target);
  if (kill.swapped) killLine += ' →(交换)实际杀' + name(kill.actualTarget);
  if (kill.special === 'body_removed') killLine += ' [抹尸]';
  if (kill.special === 'protected_by_knight') killLine += ' [骑士挡]';
  if (kill.friendlyFire) killLine += ' [友伤!]';
  console.log(killLine);

  // 女巫救人
  if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
    var sensed = G.witchSenseDeath();
    if (sensed && G.witchAIShouldSave(sensed) && G.witchRemaining()>0) {
      G.witchRevive(sensed, false);
      console.log('  女巫救 ' + name(sensed) + ' (剩余' + G.witchRemaining() + '/3)');
    }
  }

  // 女巫诅咒（新增！）
  if (G.isAlive('ye_zhiqiu') && !G.witchBroken() && G.witchRemaining()>0) {
    var ct = G.witchAIGetCurseTarget();
    if (ct) {
      var cs = G.witchScoreCurse(ct);
      var cr = G.witchCurse(ct);
      var extra = cr.reason==='broken' ? ' [崩溃!]' : '';
      console.log('  女巫诅咒 ' + name(ct) + ' (评分' + cs + ' 剩余' + G.witchRemaining() + '/3)' + extra);
    }
  }

  G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
}
console.log('\n最终存活: ' + aliveList(g).map(name).join(', '));
