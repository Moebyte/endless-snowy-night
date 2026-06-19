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

var g = S.variables.game = GS.create();
console.log('============================================');
console.log('  金水 + 深水倒钩 7天模拟');
console.log('============================================\n');

for (var day = 1; day <= 7; day++) {
  g.day = day;
  var good = aliveGood(g), wolves = aliveWolves(g);
  console.log('===== 第' + day + '天  好人' + good.length + ' 狼人' + wolves.length + ' =====');
  if (good.length <= 1) { console.log('好人覆灭\n'); break; }
  if (wolves.length === 0) { console.log('狼全灭！\n'); break; }

  // 预言家
  if (G.isAlive('fang_heng')) {
    var ct = G.prophetAIGetCheckTarget();
    if (ct) {
      var r = G.prophetCheck(ct);
      var ali = r.alignment === 'enemy' ? '[敌人!]' : '[盟友/金水]';
      console.log('  [预言家] 验 ' + name(ct) + ' ' + ali);
      if (r.alignment === 'enemy') {
        var shares = G.prophetAIShareEnemyInfo();
        if (shares) shares.forEach(function(s) {
          var tag = s.result.leaked ? ' [泄漏!]' : '';
          console.log('    → 查杀告诉 ' + name(s.target) + ': "' + name(s.infoTarget) + '是狼"' + tag);
        });
      } else {
        var goldShares = G.prophetAIShareAllyInfo();
        if (goldShares) goldShares.forEach(function(s) {
          console.log('    → 金水告诉 ' + name(s.target) + ': "' + name(s.infoTarget) + '是好人"');
        });
      }
    }
  }

  // 隐狼深水倒钩
  if (G.isAlive('tang_xiaotang') && G.isGoldWater('tang_xiaotang')) {
    var mislead = G.hiddenWolfAIMislead();
    if (mislead) {
      var tn = mislead.type === 'protect' ? '保护同伴' : '误导好人';
      console.log('  [隐狼倒钩] 唐小棠传假情报: ' + tn + ' → ' + name(mislead.target));
    }
  }

  // 骑士
  if (G.isAlive('lin_xiaoman') && !G.knightWeakened()) {
    var dt = G.knightAIGetDuelTarget();
    if (dt) {
      var dr = G.knightDuel(dt);
      if (dr.ok) {
        if (dr.reason === 'killed_wolf') console.log('  [骑士] 决斗斩杀 ' + name(dt) + ' [虚弱]');
        else if (dr.reason === 'wolf_king_mutual') console.log('  [骑士] 决斗 ' + name(dt) + '(狼王) 同归于尽!');
      }
    }
  }

  // 魔术师
  if (G.isAlive('shen_shen')) {
    var al = aliveList(g).filter(function(k){return k!=='shen_shen';});
    if (al.length >= 2 && G.magicianSwapsRemaining() > 0) {
      var a = al[Math.floor(Math.random()*al.length)];
      var rem = al.filter(function(k){return k!==a;});
      G.magicianSwap(a, rem[Math.floor(Math.random()*rem.length)]);
    }
  }

  // 狼人
  var kill = G.executeWolfKill();
  G.setLastWolfKill(kill);
  var kl = '  [狼人] 杀 ' + name(kill.target);
  if (kill.swapped) kl += ' →(交换)' + name(kill.actualTarget);
  if (kill.special === 'body_removed') kl += ' [抹尸]';
  if (kill.friendlyFire) kl += ' [友伤!]';
  if (kill.mutualKill) kl += ' [同归于尽!]';
  console.log(kl);

  // 女巫（每天只能救或诅咒一次）
  if (G.isAlive('ye_zhiqiu') && !G.witchBroken()) {
    var decision = G.witchAIDecideNight();
    if (decision.action === 'save') {
      G.witchRevive(decision.target, false);
      console.log('  [女巫] 救 ' + name(decision.target) + ' (剩余' + G.witchRemaining() + '/3)');
    } else if (decision.action === 'curse') {
      G.witchCurse(decision.target);
      console.log('  [女巫] 诅咒 ' + name(decision.target) + ' (剩余' + G.witchRemaining() + '/3)');
    }
  }

  G.knightReset(); G.magicianResetDaily(); G.witchClearSensedDeath();
  console.log('');
}
console.log('最终存活: ' + aliveList(g).map(name).join(', '));
