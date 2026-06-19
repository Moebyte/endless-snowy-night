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

// Check if prophetCheck exists
console.log('prophetCheck exists:', typeof Game.prophetCheck);

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

    // Prophet: check AND share (this sets suspect flags -> enables witch curses)
    let prophetCheck = null, prophetShared = null;
    if (Game.isAlive('fang_heng')) {
      const target = Game.prophetAIGetCheckTarget();
      if (target && typeof Game.prophetCheck === 'function') {
        prophetCheck = { target, result: Game.prophetCheck(target) };
      }
      // Prophet shares info at night (sets suspect_/silver_water_ flags)
      if (Game.prophetShouldShare && typeof Game.prophetAICheckNight === 'function') {
        const shareTarget = Game.prophetAICheckNight();
        if (shareTarget && prophetCheck) {
          prophetShared = Game.prophetShareInfo(shareTarget, prophetCheck.target);
        }
      }
    }

    let guardTarget = null;
    if (Game.isAlive('lin_xiaoman') && !Game.knightWeakened()) {
      const gt = Game.knightAIGetGuardTarget();
      if (gt) { const r = Game.knightGuard(gt); if (r.ok) guardTarget = gt; }
    }

    const kill = Game.executeWolfKill();
    Game.setLastWolfKill(kill);
    Game.witchSenseDeath();

    let witchAct = null;
    if (Game.isAlive('ye_zhiqiu') && !Game.witchBroken() && Game.witchRemaining() > 0) {
      const dec = Game.witchAIDecide();
      if (dec.action === 'save') { const sd = Game.witchGetSensedDeath(); const r = Game.witchRevive(sd); witchAct = { action: 'save', target: sd, result: r }; }
      else if (dec.action === 'curse') { const r = Game.witchCurse(dec.target); witchAct = { action: 'curse', target: dec.target, result: r }; }
    }

    log.push({ day, wolfTarget: kill.actualTarget, killer: kill.killer, killed: kill.killed, special: kill.special, swap, guardTarget, prophetCheck: prophetCheck ? prophetCheck.target : null, prophetShared, witch: witchAct });
    const goodAlive = Game.aliveList().filter(c => ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(c) === -1).length;
    const wolvesAlive = Game.aliveList().filter(c => ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'].indexOf(c) !== -1).length;
    if (goodAlive === 0 || wolvesAlive === 0) break;
  }
  results.push({ loop: i+1, finalAlive: Game.aliveList(), log });
}

let witchSaves = 0, witchCurses = 0, swaps = 0, guards = 0, deaths = 0, prophetShares = 0;
const witchSaveTargets = {}, witchCurseTargets = {};
results.forEach(r => r.log.forEach(l => {
  if (l.killed) deaths++;
  if (l.swap) swaps++;
  if (l.guardTarget) guards++;
  if (l.prophetShared && l.prophetShared.ok) prophetShares++;
  if (l.witch) {
    if (l.witch.action === 'save' && l.witch.result.ok) { witchSaves++; witchSaveTargets[l.witch.target] = (witchSaveTargets[l.witch.target]||0)+1; }
    if (l.witch.action === 'curse' && l.witch.result.ok) { witchCurses++; witchCurseTargets[l.witch.target] = (witchCurseTargets[l.witch.target]||0)+1; }
  }
}));
console.log('\n=== 20 loops WITH prophet sharing (sets suspect flags) ===');
console.log('Deaths:', deaths, '| avg/loop:', (deaths/20).toFixed(1));
console.log('Witch saves:', witchSaves, '| Witch curses:', witchCurses, '| Prophet shares:', prophetShares);
console.log('Magician swaps:', swaps, '| Knight guards:', guards);
console.log('\nWitch save targets:', Object.entries(witchSaveTargets).map(([k,v])=>((GameState.PROFILES[k]||{}).name||k)+':'+v).join(', '));
console.log('Witch curse targets:', Object.entries(witchCurseTargets).map(([k,v])=>((GameState.PROFILES[k]||{}).name||k)+':'+v).join(', '));
console.log('\nSample loops (first 4):');
results.slice(0,4).forEach(r => {
  console.log('Loop ' + r.loop + ' alive(' + r.finalAlive.length + '): ' + r.finalAlive.map(c=>((GameState.PROFILES[c]||{}).name||c)).join(','));
  r.log.forEach(l => {
    const wt = ((GameState.PROFILES[l.wolfTarget]||{}).name||l.wolfTarget);
    let line = '  D' + l.day + ': wolf->' + wt + (l.killer ? '(' + ((GameState.PROFILES[l.killer]||{}).name||l.killer) + ')' : '');
    if (l.killed) line += ' [KILLED]'; if (l.special) line += ' {' + l.special + '}';
    if (l.prophetCheck) line += ' prophet(' + ((GameState.PROFILES[l.prophetCheck]||{}).name||l.prophetCheck) + ')';
    if (l.prophetShared && l.prophetShared.ok) line += ' shared->' + ((GameState.PROFILES[l.prophetShared]||{}).name||'?');
    if (l.swap) line += ' swap(' + ((GameState.PROFILES[l.swap.a]||{}).name||l.swap.a) + '<->' + ((GameState.PROFILES[l.swap.b]||{}).name||l.swap.b) + ')';
    if (l.guardTarget) line += ' guard(' + ((GameState.PROFILES[l.guardTarget]||{}).name||l.guardTarget) + ')';
    if (l.witch) line += ' witch.' + l.witch.action + '(' + ((GameState.PROFILES[l.witch.target]||{}).name||l.witch.target) + ':' + (l.witch.result.ok?'ok':l.witch.result.reason) + ')';
    console.log(line);
  });
});
