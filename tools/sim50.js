const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md';
const sandbox = { window: {}, State: { variables: {} }, passage: () => 'test', Config: { saves: {} }, console: console, Math, Date, JSON, Object, Array, String, Number, Boolean };
sandbox.window = sandbox; sandbox.global = sandbox;
vm.createContext(sandbox);
const scripts = [
  'src/scripts/state.js','src/scripts/game.js',
  'src/scripts/loop-phase.js',
  'src/scripts/skills/prophet.js','src/scripts/skills/witch.js',
  'src/scripts/skills/knight.js','src/scripts/skills/magician.js',
  'src/scripts/wolves/vote.js','src/scripts/wolves/night-kill.js',
  'src/scripts/wolves/mech-wolf.js','src/scripts/wolves/hidden-wolf.js',
  'src/scripts/wolves/fake-jump.js',
  'src/scripts/wolves/self-stab.js',
  'src/scripts/day-events.js',
  'src/scripts/skills/exile.js',
  'src/scripts/skills/traps.js',
  'src/scripts/skills/medic.js',
  'src/scripts/skills/hearer.js',
];
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), sandbox, { filename: s });
const { Game, GameState } = sandbox.window;
const N = GameState.PROFILES;
const nm = c => (N[c]||{}).name || c;
const WOLVES = ['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'];

function runOne(seed, loopNum) {
  sandbox.State.variables.game = GameState.create();
  const g = sandbox.State.variables.game;
  g.day = 2;
  g.loop = loopNum || 1;
  const log = [];
  let hearerResult = null;
  for (let day = 2; day <= 7; day++) {
    g.day = day;
    hearerResult = null;
    // Generate daytime events (conflicts, suspicions, observations)
    Game.generateDayEvents();
    if (typeof Game.clearSoulBounds === 'function') Game.clearSoulBounds();
    // Update Lin Xiaoman's suspicion based on today's events
    if (typeof Game.knightUpdateSuspicion === 'function') Game.knightUpdateSuspicion();

    // Jiang Bai checks his trap from last night (morning check).
    // This stores the observed injury for the exile phase to use.
    let trapCheck = null;
    if (typeof Game.trapMorningCheck === 'function') {
      trapCheck = Game.trapMorningCheck();
      if (typeof Game.trapStoreObservation === 'function') Game.trapStoreObservation(trapCheck);
    }

    // v9.2: Exile accusation phase (at most one per day).
    let exileResult = null;
    if (typeof Game.exileAIPhase === 'function') {
      exileResult = Game.exileAIPhase();
    }
    // Su Wan medic observation (only shares with Chen Mo)
    let medicObs = null;
    if (typeof Game.medicAIRun === 'function') {
      const result = Game.medicAIRun();
      if (result) medicObs = result;
    }

    // Day phase: Lin Xiaoman can duel (day action, before night)
    let duelTarget = null;
    if (Game.isAlive('lin_xiaoman') && !Game.knightDuelOnCooldown()) {
      const dt = Game.knightAIGetDuelTarget();
      if (dt) { const r = Game.knightDuel(dt); if (r.ok) duelTarget = { target: dt, result: r.reason }; }
    }

    // Fang Heng active shoot (daytime, after duel phase)
    let prophetShot = null;
    if (Game.isAlive('fang_heng') && typeof Game.prophetAIShoot === 'function') {
      const shootDecision = Game.prophetAIShoot();
      if (shootDecision && typeof Game.prophetShoot === 'function') {
        const r = Game.prophetShoot(shootDecision.target);
        if (r.ok) prophetShot = { target: shootDecision.target, score: shootDecision.score, reason: r.reason, mutualKill: r.reason === 'wolf_king_mutual' };
      }
    }

    // Reset daily cooldowns
    if (Game.knightWeakened()) Game.knightReset();
    Game.magicianResetDaily();
    Game.witchClearSensedDeath();
    if (typeof Game.witchClearSilverWater === "function") Game.witchClearSilverWater();
    let swap = null;
    if (Game.isAlive('shen_shen') && Game.magicianSwapsRemaining() > 0) {
      if (typeof Game.magicianAIDecideSwap === 'function') {
        const decision = Game.magicianAIDecideSwap();
        if (decision) { const r = Game.magicianSwap(decision.a, decision.b); if (r.ok) swap = { a: decision.a, b: decision.b, reason: decision.reason }; }
      }
    }
    let prophetCheck = null, prophetShared = null;
    if (Game.isAlive('fang_heng')) {
      const target = Game.prophetAIGetCheckTarget();
      if (target && typeof Game.prophetCheck === 'function') {
        const result = Game.prophetCheck(target);
        prophetCheck = { target, result: result };
      }
      // Share based on trust (new v9 logic)
      // [v9.4] Fang shares ALL accumulated checks, not just one.
      if (Game.prophetShouldShare && prophetCheck) {
        const shareResult = Game.prophetAIShareTarget();
        if (shareResult && shareResult.allChecks) {
          let sharedCount = 0;
          for (const chk of shareResult.allChecks) {
            if (Game.isAlive(chk.target)) {
              Game.prophetShareInfo(shareResult.shareTarget, chk.target);
              sharedCount++;
            }
          }
          prophetShared = { ok: sharedCount > 0, count: sharedCount };
        }
      }
    }
    let guardTarget = null;
    if (Game.isAlive('lin_xiaoman') && !Game.knightGuardOnCooldown()) {
      const gt = Game.knightAIGetGuardTarget();
      if (gt) { const r = Game.knightGuard(gt); if (r.ok) guardTarget = gt; }
    }
    // Witch Phase 1: bind soul BEFORE wolf kill
    let witchAct = null;
    if (Game.isAlive('ye_zhiqiu') && !Game.witchBroken() && !(typeof Game.isExiled === 'function' && Game.isExiled('ye_zhiqiu'))) {
      const preKill = Game.witchAIDecidePreKill();
      if (preKill && preKill.action === 'bind') {
        const r = Game.witchBindSoul(preKill.target);
        witchAct = { action: 'bind', target: preKill.target, ok: r.ok };
      }
    }
    // Jiang Bai arms his trap for tonight (before the kill).
    if (typeof Game.trapArm === 'function') Game.trapArm();

    // [v9.5.1] Self-stab deception (low-frequency night-1 flavor event)
    let selfStabResult = null;
    if (typeof Game.wolvesConsiderSelfStab === 'function') {
      const ssDecision = Game.wolvesConsiderSelfStab();
      if (ssDecision) {
        const ssExec = Game.wolvesExecuteSelfStab(ssDecision);
        selfStabResult = ssExec;
      }
    }

    // If self-stab feint is active, there is no real wolf kill tonight.
    let kill;
    if (selfStabResult) {
      kill = { target: null, killed: false, actualTarget: null, killer: null, special: 'self_stab_night' };
      g.lastWolfKill = kill;
    } else {
      kill = Game.executeWolfKill();
    }
    if (typeof Game.hearerNightCheck === 'function') { const hr = Game.hearerNightCheck(kill); if (hr) hearerResult = hr; }
    g.lastWolfKill = kill;
    // If main wolves are dead/inactive, check hidden wolf awakening.
    // Trigger when no kill happened AND it is because wolves are dead (not just hesitating).
    if (!kill.killed) {
      var knownWolvesActive = ['zhou_yang', 'zhao_mingcheng', 'gu_yan'].some(function(w) { return g.alive[w] && !(typeof Game.isExiled === 'function' && Game.isExiled(w)); });
      if (!knownWolvesActive) {
      if (typeof Game.hiddenWolfKill === 'function') {
        const hwKill = Game.hiddenWolfKill();
        if (hwKill.killed) {
          kill = hwKill;
          g.lastWolfKill = kill;
        }
      }
    }
    }
    Game.witchSenseDeath();
    // [v9.5.1] Self-stab: if a wolf is feigning death, the witch may attempt revive.
    // Her wound-analysis skill may reveal the self-inflicted wound.
    if (selfStabResult && typeof Game.selfStabGetStabber === 'function') {
      const ssStabber = Game.selfStabGetStabber();
      if (ssStabber && Game.isAlive('ye_zhiqiu') && !Game.witchBroken() && Game.witchRemaining() > 0 && !witchAct) {
        // The witch sensed "someone dying" - she decides whether to revive.
        // Her gentle nature means she usually tries. But last-use caution applies.
        const remaining = Game.witchRemaining();
        let willAttempt = true;
        if (remaining === 1) { if (Math.random() < 0.3) willAttempt = false; }
        if (willAttempt) {
          const ssRevive = Game.witchAttemptSelfStabRevive(ssStabber);
          selfStabResult.witchRecognized = ssRevive.recognized;
          selfStabResult.witchRevived = ssRevive.revived;
          if (ssRevive.revived) {
            witchAct = { action: 'save', target: ssStabber, ok: true, selfStab: true };
          }
        }
        // Apply weakened effect for next day (regardless of revive outcome)
        if (typeof Game.selfStabApplyWeakenedEffect === 'function') {
          Game.selfStabApplyWeakenedEffect(ssStabber);
        }
      }
    }
    // Witch Phase 2: revive AFTER wolf kill (only if she didn't bind tonight)
    if (Game.isAlive('ye_zhiqiu') && !Game.witchBroken() && Game.witchRemaining() > 0 && !witchAct && !(typeof Game.isExiled === 'function' && Game.isExiled('ye_zhiqiu'))) {
      const rev = Game.witchAIDecideRevive();
      if (rev && rev.action === 'revive') {
        const r = Game.witchRevive(rev.target);
        witchAct = { action: 'save', target: rev.target, ok: r.ok };
      }
    }
    // Fang Heng passive counter-shoot: AFTER witch revive. Only if he's still dead.
    // He must GUESS the killer. Right guess = take killer down. Wrong guess = shoot innocent.
    let prophetCounter = null;
    if (!Game.isAlive('fang_heng') && kill && kill.actualTarget === 'fang_heng' && kill.killed && typeof Game.prophetAICounterShoot === 'function') {
      const counterDecision = Game.prophetAICounterShoot();
      if (counterDecision) {
        const realKiller = kill.killer || null;
        const hit = realKiller && counterDecision.target === realKiller;
        if (hit) {
          // Guessed right: bullet + kill the killer
          if (typeof Game.prophetCounterShoot === 'function') Game.prophetCounterShoot(counterDecision.target);
        } else {
          // Guessed wrong: bullet spent, nobody dies
          Game.prophetSpendBullet();
        }
        prophetCounter = { target: counterDecision.target, realKiller, hit, reason: counterDecision.reason };
      }
    }
    log.push({ day, kill, swap, duelTarget, guardTarget, trap: trapCheck, exile: exileResult, selfStab: selfStabResult, prophetCheck: prophetCheck ? { target: prophetCheck.target, alignment: prophetCheck.result.result } : null, prophetShared, prophetShot, prophetCounter, witch: witchAct, medic: medicObs, hearer: hearerResult });
    const goodAlive = Game.aliveList().filter(c => WOLVES.indexOf(c) === -1).length;
    const wolvesAlive = Game.aliveList().filter(c => WOLVES.indexOf(c) !== -1).length;
    if (goodAlive === 0 || wolvesAlive === 0) break;
  }
  var _exileMeta = (Game.exileEnsure ? (function(){ var ex = Game.exileEnsure(); return { patterns: (ex.votePatterns||[]).length, backfire: !!ex.backfireTriggered }; })() : { patterns: 0, backfire: false });
  return { loop: seed, finalAlive: Game.aliveList(), log,
    wolvesDead: 4 - Game.aliveList().filter(c=>WOLVES.indexOf(c)!==-1).length, exileMeta: _exileMeta };
}

const all = [];
// Run across all three phases to verify phase-gating works.
  // Loops 1-17 = early (loop 1-3), 18-34 = mid (loop 4-7), 35-50 = late (loop 8+).
  for (let i = 1; i <= 50; i++) {
    let loopNum;
    if (i <= 17) loopNum = ((i - 1) % 3) + 1;       // early: 1,2,3 cycling
    else if (i <= 34) loopNum = ((i - 18) % 4) + 4;  // mid: 4,5,6,7 cycling
    else loopNum = ((i - 35) % 3) + 8;                // late: 8,9,10 cycling
    all.push(runOne(i, loopNum));
  }
// DEBUG: check exileMeta capture
let _dbgBackfire = all.filter(r => r.exileMeta && r.exileMeta.backfire).length;
let _dbgPatterns = all.reduce((s,r) => s + ((r.exileMeta&&r.exileMeta.patterns)||0), 0);
console.log('DEBUG exileMeta: ' + _dbgPatterns + ' patterns, ' + _dbgBackfire + ' backfires across 50 runs');

// 统计
let stats = { deaths:0, witchSave:0, witchCurse:0, swaps:0, guards:0, shares:0, wk:0, ff:0, guarded:0, witchCurseWolvesOnly:0, witchCurseTotal:0, duels:0, duelsKilledWolf:0, duelsKilledSelf:0, duelsMutualKill:0, duelsInnocent:0, hwKills:0, hwAwakened:0, prophetShots:0, prophetShotsKilledWolf:0, prophetCounterShots:0, prophetCounterHit:0, prophetCounterMiss:0, exileAccusations:0, exileSuccessful:0, exileFailed:0, exiledWolves:0, exiledGood:0, swingWins:0, goldWaterExiles:0, blocBackfires:0, trapTriggered:0, trapObserved:0, jbAccuse:0, jbAccuseWolf:0, jbExileWolf:0, medicObs:0, medicDetect:0, medicDetectWolf:0, hearerWoke:0, hearerDir:0, hearerNeighbor:0, witchProtect:0, witchProtectBlocked:0, witchExposed:0, selfStabAttempts:0, selfStabRevived:0, selfStabDetected:0 };
all.forEach(r => r.log.forEach(l => {
  if (l.kill.killed) stats.deaths++;
  if (l.swap) stats.swaps++;
  if (l.guardTarget) stats.guards++;
  if (l.kill.special === 'hidden_wolf_kill') { stats.hwKills++; }
  if (l.duelTarget) { stats.duels++; if (l.duelTarget.result === 'killed_wolf') stats.duelsKilledWolf++; else if (l.duelTarget.result === 'wolf_king_mutual') { stats.duelsMutualKill++; stats.duelsKilledSelf++; } else if (l.duelTarget.result === 'innocent_killed') { stats.duelsInnocent++; stats.duelsKilledSelf++; } }
  if (l.prophetShared && l.prophetShared.ok) stats.shares++;
  if (l.prophetShot) { stats.prophetShots++; if (WOLVES.indexOf(l.prophetShot.target)!==-1) stats.prophetShotsKilledWolf++; if (l.prophetShot.mutualKill) stats.wk++; }
      if (l.medic) { stats.medicObs++; if (l.medic.detected) { stats.medicDetect++; if (l.medic.isKiller) stats.medicDetectWolf++; } }
    if (l.hearer) { if (l.hearer.woke) { stats.hearerWoke++; if (l.hearer.direction) stats.hearerDir++; if (l.hearer.neighborLeft) stats.hearerNeighbor++; } }
if (l.prophetCounter) { stats.prophetCounterShots++; if (l.prophetCounter.hit) stats.prophetCounterHit++; else stats.prophetCounterMiss++; }
  if (l.kill.special === 'wolf_king_mutual' || l.kill.special === 'wolf_king_mutual_swap') stats.wk++;
  if (l.kill.friendlyFire) stats.ff++;
  if (l.kill.special === 'guarded') stats.guarded++;
  if (l.witch && l.witch.ok) {
    if (l.witch.action === 'save') stats.witchSave++;
    else { stats.witchCurse++; stats.witchCurseTotal++; if (WOLVES.indexOf(l.witch.target)!==-1) stats.witchCurseWolvesOnly++; }
  }
  if (l.trap && l.trap.triggered) stats.trapTriggered++;
  if (l.trap && l.trap.observed) stats.trapObserved++;
  if (l.exile && l.exile.ok && l.exile.accuser === 'jiang_bai') {
    stats.jbAccuse++;
    if (WOLVES.indexOf(l.exile.target) !== -1) stats.jbAccuseWolf++;
    if (l.exile.exiled && WOLVES.indexOf(l.exile.target) !== -1) stats.jbExileWolf++;
  }
  if (l.exile && l.exile.ok) {
    stats.exileAccusations++;
    if (l.exile.exiled) {
      stats.exileSuccessful++;
      if (WOLVES.indexOf(l.exile.target) !== -1) stats.exiledWolves++; else stats.exiledGood++;
      if (l.exile.swingTriggered) stats.swingWins++;
    } else {
      stats.exileFailed++;
    }
    if (l.exile.witchProtectTriggered) {
      stats.witchProtect++;
      if (!l.exile.exiled) stats.witchProtectBlocked++;
      stats.witchExposed++;
    }
  }
  if (l.selfStab) {
    stats.selfStabAttempts++;
    if (l.selfStab.witchRevived) stats.selfStabRevived++;
    if (l.selfStab.witchRecognized) stats.selfStabDetected++;
  }
}));

// Count backfires per-run (not per-day) to avoid multi-counting
all.forEach(r => { if (r.exileMeta && r.exileMeta.backfire) stats.blocBackfires++; });

// 胜负统计
let goodWin = 0, wolfWin = 0, draws = 0;
all.forEach(r => {
  const aliveWolves = r.finalAlive.filter(c => WOLVES.indexOf(c) !== -1).length;
  const aliveGood = r.finalAlive.filter(c => WOLVES.indexOf(c) === -1).length;
  if (aliveWolves === 0) goodWin++;
  else if (aliveGood === 0) wolfWin++;
  else draws++;
});
console.log('===== 胜负统计 =====');
console.log('好人胜: ' + goodWin + '/50 (' + (goodWin/50*100).toFixed(0) + '%) | 堕仙胜: ' + wolfWin + '/50 (' + (wolfWin/50*100).toFixed(0) + '%) | 平局(7天未分): ' + draws + '/50 (' + (draws/50*100).toFixed(0) + '%)');
console.log('');
console.log('===== 50轮汇总 =====');
// Per-phase breakdown
  let earlyDeaths = 0, midDeaths = 0, lateDeaths = 0;
  let earlyRuns = 0, midRuns = 0, lateRuns = 0;
  let earlyDuels = 0, midDuels = 0, lateDuels = 0;
  all.forEach(r => {
    const phase = r.loop <= 3 ? 'early' : (r.loop <= 7 ? 'mid' : 'late');
    const deaths = r.log.filter(l=>l.kill.killed).length;
    const duels = r.log.filter(l=>l.duelTarget).length;
    if (phase === 'early') { earlyDeaths += deaths; earlyRuns++; earlyDuels += duels; }
    else if (phase === 'mid') { midDeaths += deaths; midRuns++; midDuels += duels; }
    else { lateDeaths += deaths; lateRuns++; lateDuels += duels; }
  });
  console.log('--- 阶段对比 ---');
  console.log('初期(loop1-3): 平均死亡' + (earlyDeaths/earlyRuns).toFixed(1) + ' 决斗' + earlyDuels + '次/' + earlyRuns + '轮');
  console.log('中期(loop4-7): 平均死亡' + (midDeaths/midRuns).toFixed(1) + ' 决斗' + midDuels + '次/' + midRuns + '轮');
  console.log('后期(loop8+):  平均死亡' + (lateDeaths/lateRuns).toFixed(1) + ' 决斗' + lateDuels + '次/' + lateRuns + '轮');
  
  // Night kill failure breakdown
  let killAttempts = 0, killGuarded = 0, killSoulBound = 0, killNoTarget = 0, witchSaves = 0, witchBinds = 0;
  all.forEach(r => r.log.forEach(l => {
    if (l.kill) {
      if (l.kill.special === 'guarded') killGuarded++;
      if (l.kill.special === 'soul_bound') killSoulBound++;
      if (l.kill.special === 'no_target' || l.kill.special === 'no_wolves' || (!l.kill.killed && !l.kill.special)) killNoTarget++;
    }
    if (l.witch && l.witch.action === 'save' && l.witch.ok) witchSaves++;
    if (l.witch && l.witch.action === 'bind' && l.witch.ok) witchBinds++;
  }));
  console.log('--- 夜杀失败原因 ---');
  console.log('镇煞守卫挡下: ' + killGuarded + ' | 缚魂阻止: ' + killSoulBound + ' | 无人可杀/安全夜: ' + killNoTarget);
  console.log('女巫救人成功: ' + witchSaves + ' | 女巫缚魂成功: ' + witchBinds);

console.log('平均每轮死亡: ' + (stats.deaths/50).toFixed(1));
console.log('渡君救人: ' + stats.witchSave + ' | 渡君缚魂: ' + stats.witchCurse + ' (其中堕仙: ' + stats.witchCurseWolvesOnly + '/' + stats.witchCurseTotal + ')');
console.log('幻真交换: ' + stats.swaps + ' | 镇煞守卫: ' + stats.guards + ' | 昭判分享: ' + stats.shares);
console.log('昭判主动开枪: ' + stats.prophetShots + ' (杀狼:' + stats.prophetShotsKilledWolf + ') | 临死反杀: ' + stats.prophetCounterShots + ' (猜中凶手:' + stats.prophetCounterHit + ' 打偏:' + stats.prophetCounterMiss + ')');
console.log('幽主同归: ' + stats.wk + ' | 堕仙误杀同伴: ' + stats.ff + ' | 镇煞挡刀: ' + stats.guarded);
console.log('镇煞决斗: ' + stats.duels + ' (杀狼:' + stats.duelsKilledWolf + ' 同归狼王:' + stats.duelsMutualKill + ' 砍好人:' + stats.duelsInnocent + ')');
console.log('隐狼觉醒击杀: ' + stats.hwKills);
console.log('流放系统: 质疑' + stats.exileAccusations + '次 (成功:' + stats.exileSuccessful + ' 流放狼:' + stats.exiledWolves + ' 流放好人:' + stats.exiledGood + ' 陈默关键票翻盘:' + stats.swingWins + ' 票型反噬:' + stats.blocBackfires + ' 失败:' + stats.exileFailed + ')');
console.log('叶知秋银水保护: 介入' + stats.witchProtect + '次 (成功阻断流放:' + stats.witchProtectBlocked + ' 暴露次数:' + stats.witchExposed + ')');
console.log('自刀骗药: 尝试' + stats.selfStabAttempts + '次 (被骗复活:' + stats.selfStabRevived + ' 识破:' + stats.selfStabDetected + ') [仅mid/late阶段触发]');
console.log('江白陷阱: 触发' + stats.trapTriggered + ' 观察' + stats.trapObserved + ' 质疑' + stats.jbAccuse + '(质疑狼:' + stats.jbAccuseWolf + ' 流放狼:' + stats.jbExileWolf + ')');;
console.log('老郑感知: 醒来' + stats.hearerWoke + '次(听出方向' + stats.hearerDir + ' 隔壁出门' + stats.hearerNeighbor + ')');
console.log('苏晚体检: 观察' + stats.medicObs + ' 检测' + stats.medicDetect + '(检出杀手:' + stats.medicDetectWolf + ')');

// 给每轮打标签，挑特殊的
function tag(r) {
  const tags = [];
  const deaths = r.log.filter(l=>l.kill.killed).length;
  const curses = r.log.filter(l=>l.witch && l.witch.action==='curse' && l.witch.ok).length;
  const saves = r.log.filter(l=>l.witch && l.witch.action==='save' && l.witch.ok).length;
  const ff = r.log.filter(l=>l.kill.friendlyFire).length;
  const wk = r.log.filter(l=>l.kill.special==='wolf_king_mutual'||l.kill.special==='wolf_king_mutual_swap').length;
  const guarded = r.log.filter(l=>l.kill.special==='guarded').length;
  if (r.wolvesDead >= 3) tags.push('堕仙队覆灭('+r.wolvesDead+'狼死)');
  if (curses >= 3) tags.push('渡君三杀');
  if (saves >= 3) tags.push('渡君三救');
  if (ff >= 2) tags.push('幻真多次致幻('+ff+')');
  if (wk >= 1) tags.push('幽主同归');
  if (guarded >= 3) tags.push('镇煞神守('+guarded+')');
  const hwKills = r.log.filter(l=>l.kill.special==='hidden_wolf_kill').length;
  if (hwKills > 0) tags.push('隐狼觉醒('+hwKills+'杀)');
  const duels = r.log.filter(l=>l.duelTarget).length;
  const duelsKilledWolf = r.log.filter(l=>l.duelTarget && l.duelTarget.result==='killed_wolf').length;
  if (duelsKilledWolf >= 2) tags.push('镇煞双杀('+duelsKilledWolf+')');
  if (duels >= 1 && r.log.some(l=>l.duelTarget && (l.duelTarget.result==='innocent_killed'||l.duelTarget.result==='wolf_king_mutual'))) tags.push('镇煞阵亡');
  if (deaths <= 2) tags.push('极低死亡('+deaths+')');
  if (r.finalAlive.filter(c=>WOLVES.indexOf(c)===-1).length <= 2) tags.push('好人濒灭');
  const exileAccusations = r.log.filter(l=>l.exile && l.exile.ok).length;
  const exileSuccess = r.log.filter(l=>l.exile && l.exile.ok && l.exile.exiled).length;
  if (exileAccusations >= 2) tags.push('多次质疑('+exileAccusations+')');
  if (exileSuccess >= 1) tags.push('成功流放('+exileSuccess+')');
  // 连续诅咒同一阵营
  return tags;
}

all.forEach(r => r.tags = tag(r));
const special = all.filter(r => r.tags.length > 0);
console.log('\n===== 特殊轮次 (' + special.length + '/50) =====');
special.forEach(r => {
  console.log('\n【轮' + r.loop + '】' + r.tags.join(' | ') + ' | 最终存活(' + r.finalAlive.length + '): ' + r.finalAlive.map(nm).join(','));
  r.log.forEach(l => {
    const wt = l.kill.actualTarget ? nm(l.kill.actualTarget) : '（无人）';
    const killer = l.kill.killer ? nm(l.kill.killer) : '';
    let line = '  D' + l.day + ': 堕仙杀' + wt + (killer?'('+killer+')':'');
    if (l.kill.killed) line += ' ✓死';
    if (l.kill.special === 'hidden_wolf_kill') line += ' {隐狼觉醒}';
    if (l.kill.special === 'body_removed') line += ' {抹尸}';
    else if (l.kill.special === 'wolf_king_mutual') line += ' {幽主同归}';
    else if (l.kill.special === 'wolf_king_mutual_swap') line += ' {致幻同归}';
    else if (l.kill.special === 'friendly_fire') line += ' {致幻自杀}';
    else if (l.kill.special === 'guarded') line += ' {镇煞挡下}';
    if (l.duelTarget) line += ' | 镇煞决斗' + nm(l.duelTarget.target) + '(' + (l.duelTarget.result==='killed_wolf'?'杀狼':l.duelTarget.result==='wolf_king_mutual'?'同归':'自杀') + ')';
    if (l.prophetCheck) line += ' | 验' + nm(l.prophetCheck.target) + '=' + ({friendly:'友善',neutral:'中立',hostile:'恶意'}[l.prophetCheck.alignment]||l.prophetCheck.alignment);
    if (l.prophetShared && l.prophetShared.ok) line += '(分享)';
    if (l.prophetShot) line += ' | 枪杀' + nm(l.prophetShot.target) + (l.prophetShot.mutualKill?'{同归}':'');
    if (l.prophetCounter) line += ' | 临死指认' + nm(l.prophetCounter.target) + '(' + (l.prophetCounter.hit?('✓猜中'+(l.prophetCounter.realKiller==='zhou_yang'?'{狼王同归}':'')):'打偏') + (l.prophetCounter.realKiller?' 真凶手'+nm(l.prophetCounter.realKiller):'') + ')';
    if (l.swap) line += ' | 换' + nm(l.swap.a) + '↔' + nm(l.swap.b);
    if (l.guardTarget) line += ' | 守' + nm(l.guardTarget);
    if (l.exile && l.exile.ok) line += ' | ' + nm(l.exile.accuser) + '质疑' + nm(l.exile.target) + '(' + l.exile.votesFor + '赞:' + l.exile.votesAgainst + '反:' + (l.exile.abstains||0) + '弃' + (l.exile.exiled?(l.exile.swingTriggered?'→陈默破平流放':'→流放'):'→保留') + ')';
    if (l.witch) line += ' | 渡君' + l.witch.action + nm(l.witch.target) + (l.witch.ok?'✓':'✗');
    if (l.selfStab) line += ' | 自刀' + nm(l.selfStab.stabber) + (l.selfStab.witchRecognized?'{识破}':l.selfStab.witchRevived?'{被骗复活}':'{未救}');
    console.log(line);
  });
});
