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

// Focused test: can the knight duel by day AND guard by night, same day?
sandbox.State.variables.game = GameState.create();
const g = sandbox.State.variables.game;
console.log('=== 骑士双技能独立冷却测试 ===');
console.log('初始: duelCD=' + g.godSkills.knight.duelCooldown + ' guardCD=' + g.godSkills.knight.guardCooldown);

// Day 1: duel a wolf (zhou_yang is wolf_king -> mutual kill, but let's use a normal wolf)
// zhao_mingcheng is 'wolf' (not wolf_king), safe to duel
console.log('\n白天: 决斗赵明城(狼)');
const d1 = Game.knightDuel('zhao_mingcheng');
console.log('决斗结果:', d1.reason, '| 赵明城存活:', Game.isAlive('zhao_mingcheng'));
console.log('决斗后: duelCD=' + g.godSkills.knight.duelCooldown + ' guardCD=' + g.godSkills.knight.guardCooldown);
console.log('能否再次决斗(应false):', !Game.knightDuelOnCooldown());
console.log('能否守卫(应true):', !Game.knightGuardOnCooldown());

// Same day night: guard su_wan
console.log('\n当夜: 守卫苏晚');
const guard1 = Game.knightGuard('su_wan');
console.log('守卫结果:', guard1.reason, '| guardCD=' + g.godSkills.knight.guardCooldown);
console.log('能否决斗(仍受决斗CD限制, 应false):', !Game.knightDuelOnCooldown());
console.log('能否再次守卫(应false):', !Game.knightGuardOnCooldown());

// Night resolution: knightReset ticks both down
console.log('\n黎明: knightReset() 递减两个冷却');
Game.knightReset();
console.log('reset后: duelCD=' + g.godSkills.knight.duelCooldown + ' guardCD=' + g.godSkills.knight.guardCooldown);

// Next day: both should be available again (each was 1, ticked to 0)
console.log('\n次日白天: 能否决斗(应true):', !Game.knightDuelOnCooldown());
console.log('次日夜: 能否守卫(应true):', !Game.knightGuardOnCooldown());

// Verify knightWeakened coarse gate: true only when BOTH on cooldown
sandbox.State.variables.game = GameState.create();
const g2 = sandbox.State.variables.game;
g2.godSkills.knight.duelCooldown = 1;
g2.godSkills.knight.guardCooldown = 0;
console.log('\n=== 粗粒度knightWeakened测试 ===');
console.log('只有决斗CD: knightWeakened=' + Game.knightWeakened() + ' (应false, 还能守卫不算完全虚弱)');
g2.godSkills.knight.guardCooldown = 1;
console.log('两个都CD: knightWeakened=' + Game.knightWeakened() + ' (应true)');
