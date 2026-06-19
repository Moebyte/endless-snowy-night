const fs = require('fs');
let code1 = fs.readFileSync('src/scripts/state.js', 'utf8');
let code2 = fs.readFileSync('src/scripts/game.js', 'utf8');
var sandbox = {}; sandbox.window = sandbox; sandbox.GameState = {}; sandbox.Game = {}; sandbox.State = { variables: {} };
with (sandbox) { eval(code1); eval(code2); }
var GS = sandbox.GameState, G = sandbox.Game, S = sandbox.State;

function name(id) { return GS.PROFILES[id] ? GS.PROFILES[id].name : id; }
function aliveList(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k];}); }
function aliveWolves(g) { return ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].filter(function(w){return g.alive[w];}); }
function aliveGood(g) { return Object.keys(g.alive).filter(function(k){return g.alive[k] && ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(k)===-1;}); }

var killerStats = {};
var knightUses = 0;
var bodyRemovedCount = 0;
var curseCount = 0;

for (var run = 0; run < 5; run++) {
  S.variables.game = GS.create();
  var g = S.variables.game;
  
  for (var day = 1; day <= 7; day++) {
    g.day = day;
    var good = aliveGood(g), wolves = aliveWolves(g);
    if (good.length <= 1 || wolves.length === 0) break;

    // Prophet
    if (G.isAlive('fang_heng')) {
      var ct = G.prophetAIGetCheckTarget();
      if (ct) {
        var r = G.prophetCheck(ct);
        if (r.alignment === 'enemy') G.prophetAIShareEnemyInfo();
      }
    }

    // Knight duel
    if (G.isAlive('lin_xiaoman') && !G.knightWeakened()) {
      var dt = G.knightAIGetDuelTarget();
      if (dt) { G.knightDuel(dt); knightUses++; }
    }

    // Magician
    if (G.isAlive('shen_shen')) {
      var al = aliveList(g).filter(function(k){return k!=='shen_shen';});
      if (al.length >= 2 && G.magicianSwapsRemaining() > 0) {
        var a = al[Math.floor(Math.random()*al.length)];
        var rem = al.filter(function(k){return k!==a;});
        var b = rem[Math.floor(Math.random()*rem.length)];
        G.magicianSwap(a,b);
      }
    }

    // Wolf kill
    var kill = G.executeWolfKill();
    G.setLastWolfKill(kill);
    if (kill.killer) killerStats[kill.killer] = (killerStats[kill.killer]||0) + 1;
    if (kill.special === 'body_removed') bodyRemovedCount++;

    // Witch
    if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
      var sensed = G.witchSenseDeath();
      if (sensed && G.witchAIShouldSave(sensed) && G.witchRemaining()>0) G.witchRevive(sensed,false);
      var ct2 = G.witchAIGetCurseTarget();
      if (ct2) { G.witchCurse(ct2); curseCount++; }
    }

    G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  }
  
  console.log('Run ' + (run+1) + ': 好人' + aliveGood(g).length + ' 狼人' + aliveWolves(g).length + 
    ' | 存活: ' + aliveList(g).map(name).join(', '));
}

console.log('\n=== 统计（5轮平均）===');
console.log('狼人杀手分布:', JSON.stringify(killerStats));
console.log('清道夫抹尸次数:', bodyRemovedCount);
console.log('骑士决斗总次数:', knightUses);
console.log('女巫诅咒总次数:', curseCount);
