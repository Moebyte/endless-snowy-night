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
const nm = c => (N[c]||{}).name || c;
const WOLVES = ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'];

function runOne(seed) {
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
        for (let t = 0; t < 15; t++) { const cand = alive[Math.floor(Math.random() * alive.length)]; if (cand !== a && !Game.wasInLastSwap(a) && !Game.wasInLastSwap(cand)) { b = cand; break; } }
        if (!b) for (const cand of alive) if (cand !== a && !Game.wasInLastSwap(cand)) { b = cand; break; }
        if (a && b) { const r = Game.magicianSwap(a, b); if (r.ok) swap = { a, b }; }
      }
    }
    let prophetCheck = null, prophetShared = null;
    if (Game.isAlive('fang_heng')) {
      const target = Game.prophetAIGetCheckTarget();
      if (target && typeof Game.prophetCheck === 'function') prophetCheck = { target, result: Game.prophetCheck(target) };
      if (Game.prophetShouldShare && typeof Game.prophetAICheckNight === 'function') {
        const st = Game.prophetAICheckNight();
        if (st && prophetCheck) prophetShared = Game.prophetShareInfo(st, prophetCheck.target);
      }
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
    log.push({ day, kill, swap, guardTarget, prophetCheck: prophetCheck ? { target: prophetCheck.target, alignment: prophetCheck.result.alignment } : null, prophetShared, witch: witchAct });
    const goodAlive = Game.aliveList().filter(c => WOLVES.indexOf(c) === -1).length;
    const wolvesAlive = Game.aliveList().filter(c => WOLVES.indexOf(c) !== -1).length;
    if (goodAlive === 0 || wolvesAlive === 0) break;
  }
  return { loop: seed, finalAlive: Game.aliveList(), log,
    wolvesDead: 4 - Game.aliveList().filter(c=>WOLVES.indexOf(c)!==-1).length };
}

const all = [];
for (let i = 1; i <= 50; i++) all.push(runOne(i));

// 统计
let stats = { deaths:0, witchSave:0, witchCurse:0, swaps:0, guards:0, shares:0, wk:0, ff:0, guarded:0, witchCurseWolvesOnly:0, witchCurseTotal:0 };
all.forEach(r => r.log.forEach(l => {
  if (l.kill.killed) stats.deaths++;
  if (l.swap) stats.swaps++;
  if (l.guardTarget) stats.guards++;
  if (l.prophetShared && l.prophetShared.ok) stats.shares++;
  if (l.kill.special === 'wolf_king_mutual') stats.wk++;
  if (l.kill.friendlyFire) stats.ff++;
  if (l.kill.special === 'protected_by_knight') stats.guarded++;
  if (l.witch && l.witch.ok) {
    if (l.witch.action === 'save') stats.witchSave++;
    else { stats.witchCurse++; stats.witchCurseTotal++; if (WOLVES.indexOf(l.witch.target)!==-1) stats.witchCurseWolvesOnly++; }
  }
}));

console.log('===== 50轮汇总 =====');
console.log('平均每轮死亡: ' + (stats.deaths/50).toFixed(1));
console.log('渡君救人: ' + stats.witchSave + ' | 渡君诅咒: ' + stats.witchCurse + ' (其中堕仙: ' + stats.witchCurseWolvesOnly + '/' + stats.witchCurseTotal + ')');
console.log('幻真交换: ' + stats.swaps + ' | 镇煚守卫: ' + stats.guards + ' | 昭判分享: ' + stats.shares);
console.log('幽主同归: ' + stats.wk + ' | 堕仙误杀同伴: ' + stats.ff + ' | 镇煚挡刀: ' + stats.guarded);

// 给每轮打标签，挑特殊的
function tag(r) {
  const tags = [];
  const deaths = r.log.filter(l=>l.kill.killed).length;
  const curses = r.log.filter(l=>l.witch && l.witch.action==='curse' && l.witch.ok).length;
  const saves = r.log.filter(l=>l.witch && l.witch.action==='save' && l.witch.ok).length;
  const ff = r.log.filter(l=>l.kill.friendlyFire).length;
  const wk = r.log.filter(l=>l.kill.special==='wolf_king_mutual').length;
  const guarded = r.log.filter(l=>l.kill.special==='protected_by_knight').length;
  if (r.wolvesDead >= 3) tags.push('堕仙队覆灭('+r.wolvesDead+'狼死)');
  if (curses >= 3) tags.push('渡君三杀');
  if (saves >= 3) tags.push('渡君三救');
  if (ff >= 2) tags.push('幻真多次致幻('+ff+')');
  if (wk >= 1) tags.push('幽主同归');
  if (guarded >= 3) tags.push('镇煚神守('+guarded+')');
  if (deaths <= 2) tags.push('极低死亡('+deaths+')');
  if (r.finalAlive.filter(c=>WOLVES.indexOf(c)===-1).length <= 2) tags.push('好人濒灭');
  // 连续诅咒同一阵营
  return tags;
}

all.forEach(r => r.tags = tag(r));
const special = all.filter(r => r.tags.length > 0);
console.log('\n===== 特殊轮次 (' + special.length + '/50) =====');
special.forEach(r => {
  console.log('\n【轮' + r.loop + '】' + r.tags.join(' | ') + ' | 最终存活(' + r.finalAlive.length + '): ' + r.finalAlive.map(nm).join(','));
  r.log.forEach(l => {
    const wt = nm(l.kill.actualTarget);
    const killer = l.kill.killer ? nm(l.kill.killer) : '';
    let line = '  D' + l.day + ': 堕仙杀' + wt + (killer?'('+killer+')':'');
    if (l.kill.killed) line += ' ✓死';
    if (l.kill.special === 'body_removed') line += ' {抹尸}';
    else if (l.kill.special === 'wolf_king_mutual') line += ' {幽主同归}';
    else if (l.kill.special === 'friendly_fire') line += ' {致幻误杀同伴}';
    else if (l.kill.special === 'protected_by_knight') line += ' {镇煚挡下}';
    if (l.prophetCheck) line += ' | 验' + nm(l.prophetCheck.target) + '=' + (l.prophetCheck.alignment==='enemy'?'敌人':'盟友');
    if (l.prophetShared && l.prophetShared.ok) line += '(分享)';
    if (l.swap) line += ' | 换' + nm(l.swap.a) + '↔' + nm(l.swap.b);
    if (l.guardTarget) line += ' | 守' + nm(l.guardTarget);
    if (l.witch) line += ' | 渡君' + l.witch.action + nm(l.witch.target) + (l.witch.ok?'✓':'✗');
    console.log(line);
  });
});
