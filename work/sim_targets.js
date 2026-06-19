const fs = require('fs');
let code1 = fs.readFileSync('src/scripts/state.js', 'utf8');
let code2 = fs.readFileSync('src/scripts/game.js', 'utf8');
var sandbox = {}; sandbox.window = sandbox; sandbox.GameState = {}; sandbox.Game = {}; sandbox.State = { variables: {} };
with (sandbox) { eval(code1); eval(code2); }
var GS = sandbox.GameState, G = sandbox.Game, S = sandbox.State;

function name(id) { return GS.PROFILES[id] ? GS.PROFILES[id].name : id; }
function role(id) { return G.roleOf(id); }
function aliveList(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k];}); }
function aliveWolves(g) { return ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].filter(function(w){return g.alive[w];}); }
function aliveGood(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k] && ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(k)===-1;}); }

var targetStats = {};
var knightTargets = {};

for (var run = 0; run < 10; run++) {
  S.variables.game = GS.create();
  var g = S.variables.game;
  
  for (var day = 1; day <= 7; day++) {
    g.day = day;
    var good = aliveGood(g), wolves = aliveWolves(g);
    if (good.length <= 1 || wolves.length === 0) break;

    if (G.isAlive('fang_heng')) {
      var ct = G.prophetAIGetCheckTarget();
      if (ct) { var r = G.prophetCheck(ct); if (r.alignment === 'enemy') G.prophetAIShareEnemyInfo(); }
    }
    if (G.isAlive('lin_xiaoman') && !G.knightWeakened()) {
      var dt = G.knightAIGetDuelTarget();
      if (dt) { G.knightDuel(dt); knightTargets[dt] = (knightTargets[dt]||0)+1; }
    }
    if (G.isAlive('shen_shen')) {
      var al = aliveList(g).filter(function(k){return k!=='shen_shen';});
      if (al.length >= 2 && G.magicianSwapsRemaining() > 0) {
        var a = al[Math.floor(Math.random()*al.length)];
        var rem = al.filter(function(k){return k!==a;});
        G.magicianSwap(a, rem[Math.floor(Math.random()*rem.length)]);
      }
    }
    var kill = G.executeWolfKill();
    G.setLastWolfKill(kill);
    if (kill.actualTarget && !G.isAlive(kill.actualTarget)) {
      targetStats[kill.actualTarget] = (targetStats[kill.actualTarget]||0)+1;
    }
    if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
      var sensed = G.witchSenseDeath();
      if (sensed && G.witchAIShouldSave(sensed) && G.witchRemaining()>0) G.witchRevive(sensed,false);
      var ct2 = G.witchAIGetCurseTarget();
      if (ct2) { G.witchCurse(ct2); targetStats[ct2] = (targetStats[ct2]||0)+1; }
    }
    G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  }
}

console.log('=== 狼人/女巫击杀目标统计（10轮）===');
Object.keys(targetStats).sort(function(a,b){return targetStats[b]-targetStats[a];}).forEach(function(id){
  var r = role(id);
  var godRoles = ['prophet','witch','knight','magician'];
  var cat = godRoles.indexOf(r) !== -1 ? '神职' : (r === 'memory' ? '主角' : '村民');
  console.log('  ' + name(id).padEnd(6) + ' (' + r.padEnd(15) + ') [' + cat + ']: ' + targetStats[id] + '次');
});

console.log('\n=== 骑士决斗目标统计 ===');
Object.keys(knightTargets).forEach(function(id){
  console.log('  ' + name(id) + ' (' + role(id) + '): ' + knightTargets[id] + '次');
});
