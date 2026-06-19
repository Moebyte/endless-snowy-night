const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md';
const sandbox = { window: {}, State: { variables: {} }, passage: () => 'test', Config: { saves: {} }, console: console, Math, Date, JSON, Object, Array, String, Number, Boolean };
sandbox.window = sandbox; sandbox.global = sandbox;
vm.createContext(sandbox);
const scripts = [
  'src/scripts/state.js','src/scripts/game.js',
  'src/scripts/skills/prophet.js','src/scripts/skills/witch.js',
  'src/scripts/skills/knight.js','src/scripts/skills/magician.js',
  'src/scripts/wolves/vote.js','src/scripts/wolves/night-kill.js',
  'src/scripts/wolves/mech-wolf.js','src/scripts/wolves/hidden-wolf.js',
  'src/scripts/wolves/fake-jump.js',
];
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), sandbox, { filename: s });
const { Game, GameState } = sandbox.window;
const N = GameState.PROFILES;

const results = [];
for (let i = 0; i < 20; i++) {
  sandbox.State.variables.game = GameState.create();
  const g = sandbox.State.variables.game;
  g.day = 2;
  const log = [];
  for (let day = 2; day <= 7; day++) {
    g.day = day;
    if (Game.knightWeakened()) Game.knightReset();
    Game.magicianResetDaily();
    Game.witchClearSensedDeath();
    let swap = null;
    if (Game.isAlive('shen_shen') && Game.magicianSwapsRemaining() > 0) {
      const alive = Game.aliveList().filter(c => c !== 'shen_shen' && c !== 'chen_mo');
      if (alive.length >= 2) {
        let a = alive[Math.floor(Math.random() * alive.length)];
        let b = null;
        for (let t = 0; t < 15; t++) {
          const cand = alive[Math.floor(Math.random() * alive.length)];
          if (cand !== a && !Game.wasInLastSwap(a) && !Game.wasInLastSwap(cand)) { b = cand; break; }
        }
        if (!b) for (const cand of alive) if (cand !== a && !Game.wasInLastSwap(cand)) { b = cand; break; }
        if (a && b) { const r = Game.magicianSwap(a, b); if (r.ok) swap = { a, b }; }
      }
    }
    let prophetCheck = null, prophetShared = null;
    if (Game.isAlive('fang_heng')) {
      const target = Game.prophetAIGetCheckTarget();
      if (target) { prophetCheck = target; if (Game.prophetShouldShare()) { const st = Game.prophetAICheckNight(); if (st) prophetShared = Game.prophetShareInfo(st, target); } }
    }
    let guardTarget = null;
    if (Game.isAlive('lin_xiaoman') && !Game.knightGuardOnCooldown()) {
      const gt = Game.knightAIGetGuardTarget();
      if (gt) { const r = Game.knightGuard(gt); if (r.ok) guardTarget = gt; }
    }
    const kill = Game.executeWolfKill();
    Game.setLastWolfKill(kill);
    Game.witchSenseDeath();
    let witchAct = null;
    if (Game.isAlive('ye_zhiqiu') && !Game.witchBroken() && Game.witchRemaining() > 0) {
      const dec = Game.witchAIDecide();
      if (dec.action === 'save') { const sd = Game.witchGetSensedDeath(); const r = Game.witchRevive(sd); witchAct = { action: 'save', target: sd, ok: r.ok }; }
      else if (dec.action === 'curse') { const r = Game.witchCurse(dec.target); witchAct = { action: 'curse', target: dec.target, ok: r.ok }; }
    }
    log.push({ day, kill, swap, guardTarget, prophetCheck, prophetShared, witchAct });
    const goodAlive = Game.aliveList().filter(c => ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(c) === -1).length;
    const wolvesAlive = Game.aliveList().filter(c => ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(c) !== -1).length;
    if (goodAlive === 0 || wolvesAlive === 0) break;
  }
  results.push({ loop: i+1, finalAlive: Game.aliveList(), log });
}

// 汇总统计
let witchSaves = 0, witchCurses = 0, swaps = 0, guards = 0, deaths = 0, shares = 0;
let wk = 0, ff = 0, guarded = 0;
const killTargets = {};
results.forEach(r => r.log.forEach(l => {
  if (l.kill.killed) { deaths++; const t = l.kill.actualTarget; killTargets[t] = (killTargets[t]||0)+1; }
  if (l.swap) swaps++;
  if (l.guardTarget) guards++;
  if (l.prophetShared && l.prophetShared.ok) shares++;
  if (l.witch && l.witch.ok) { if (l.witch.action==='save') witchSaves++; else witchCurses++; }
  if (l.kill.special === 'wolf_king_mutual') wk++;
  if (l.kill.friendlyFire) ff++;
  if (l.kill.special === 'protected_by_knight') guarded++;
}));

console.log('===== 20轮汇总 =====');
console.log('总死亡: ' + deaths + ' | 平均每轮: ' + (deaths/20).toFixed(1));
console.log('女巫救人: ' + witchSaves + ' | 女巫诅咒: ' + witchCurses);
console.log('魔术师交换: ' + swaps + ' | 骑士守卫: ' + guards + ' | 预言家分享: ' + shares);
console.log('狼王同归于尽: ' + wk + ' | 狼人误杀同伴: ' + ff + ' | 骑士挡刀: ' + guarded);
console.log('\n被狼杀目标分布:');
Object.entries(killTargets).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + (N[k]||{}).name + ': ' + v));

console.log('\n===== 全部20轮详情 =====');
results.forEach(r => {
  const survivors = r.finalAlive.map(c => (N[c]||{}).name).join(',');
  console.log('\n【轮' + r.loop + '】存活(' + r.finalAlive.length + '): ' + survivors);
  r.log.forEach(l => {
    const wt = (N[l.kill.actualTarget]||{}).name || l.kill.actualTarget;
    const killer = l.kill.killer ? ((N[l.kill.killer]||{}).name) : '';
    let line = '  D' + l.day + ': 狼杀' + wt + (killer ? '(' + killer + ')' : '');
    if (l.kill.killed) line += ' ✓死'; 
    if (l.kill.special === 'body_removed') line += ' {清道夫抹尸}';
    else if (l.kill.special === 'wolf_king_mutual') line += ' {狼王同归}';
    else if (l.kill.special === 'friendly_fire') line += ' {魔术师致幻误杀同伴}';
    else if (l.kill.special === 'protected_by_knight') line += ' {骑士挡下}';
    if (l.prophetCheck) line += ' | 预言家验' + (N[l.prophetCheck]||{}).name;
    if (l.prophetShared && l.prophetShared.ok) line += '(分享)';
    if (l.swap) line += ' | 魔术师换' + (N[l.swap.a]||{}).name + '↔' + (N[l.swap.b]||{}).name;
    if (l.guardTarget) line += ' | 骑士守' + (N[l.guardTarget]||{}).name;
    if (l.witch) line += ' | 女巫' + l.witch.action + (N[l.witch.target]||{}).name + (l.witch.ok?'✓':'✗');
    console.log(line);
  });
});
