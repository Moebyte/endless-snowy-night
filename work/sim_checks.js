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

var checkTargets = {};
var checkAlignments = { enemy: 0, ally: 0 };
var hiddenWolfResults = 0;

for (var run = 0; run < 10; run++) {
  S.variables.game = GS.create();
  var g = S.variables.game;
  
  for (var day = 1; day <= 7; day++) {
    g.day = day;
    var good = aliveGood(g), wolves = aliveWolves(g);
    if (good.length <= 1 || wolves.length === 0) break;

    if (G.isAlive('fang_heng')) {
      var ct = G.prophetAIGetCheckTarget();
      if (ct) {
        var r = G.prophetCheck(ct);
        checkTargets[ct] = (checkTargets[ct]||0)+1;
        checkAlignments[r.alignment] = (checkAlignments[r.alignment]||0)+1;
        if (ct === 'tang_xiaotang') {
          console.log('Run' + run + ' Day' + day + ': 验唐小棠(隐狼) -> ' + r.alignment);
          if (r.alignment === 'ally') hiddenWolfResults++;
        }
        if (r.alignment === 'enemy') G.prophetAIShareEnemyInfo();
      }
    }
    if (G.isAlive('lin_xiaoman') && !G.knightWeakened()) {
      var dt = G.knightAIGetDuelTarget();
      if (dt) G.knightDuel(dt);
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
    if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
      var sensed = G.witchSenseDeath();
      if (sensed && G.witchAIShouldSave(sensed) && G.witchRemaining()>0) G.witchRevive(sensed,false);
      var ct2 = G.witchAIGetCurseTarget();
      if (ct2) G.witchCurse(ct2);
    }
    G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  }
}

console.log('\n=== 预言家查验目标统计（10轮）===');
Object.keys(checkTargets).sort(function(a,b){return checkTargets[b]-checkTargets[a];}).forEach(function(id){
  var r = role(id);
  var wolfRoles = ['wolf_king','wolf','mechanical_wolf'];
  var hiddenWolf = r === 'hidden_wolf';
  var tag = wolfRoles.indexOf(r) !== -1 ? ' [明确狼]' : (hiddenWolf ? ' [隐狼-测为盟友]' : ' [好人]');
  console.log('  ' + name(id).padEnd(6) + ' (' + r.padEnd(15) + '): ' + checkTargets[id] + '次' + tag);
});

console.log('\n验出敌人: ' + checkAlignments.enemy + '次, 盟友: ' + checkAlignments.ally + '次');
console.log('隐狼被验测为盟友: ' + hiddenWolfResults + '次');
