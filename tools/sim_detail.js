const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT='C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md';
const sb={window:{},State:{variables:{}},passage:()=>'test',Config:{saves:{}},console,Math,Date,JSON,Object,Array,String,Number,Boolean};
sb.window=sb;sb.global=sb;vm.createContext(sb);
const scripts=['src/scripts/state.js','src/scripts/game.js','src/scripts/skills/prophet.js','src/scripts/skills/prophet-gun.js','src/scripts/skills/witch.js','src/scripts/skills/knight.js','src/scripts/skills/magician.js','src/scripts/wolves/vote.js','src/scripts/wolves/night-kill.js','src/scripts/wolves/mech-wolf.js','src/scripts/wolves/hidden-wolf.js','src/scripts/wolves/fake-jump.js','src/scripts/wolves/self-stab.js','src/scripts/day-events.js','src/scripts/skills/exile.js','src/scripts/skills/exile-vote.js','src/scripts/skills/exile-ai.js','src/scripts/skills/traps.js','src/scripts/skills/medic.js','src/scripts/skills/hearer.js'];
for(const s of scripts)vm.runInContext(fs.readFileSync(path.join(ROOT,s),'utf8'),sb,{filename:s});
const sandbox=sb;
const {Game,GameState}=sb.window;
const WOLVES=['zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan'];
const N=GameState.PROFILES;const nm=c=>(N[c]||{}).name||c;
const ALIGN={friendly:'友善',neutral:'中立',hostile:'恶意'};
const seed=parseInt(process.argv[2])||5;
function runOne(seed) {
  sandbox.State.variables.game = GameState.create();
  const g = sandbox.State.variables.game;
  g.day = 2;
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

const r=runOne(seed);
const aw=r.finalAlive.filter(c=>WOLVES.indexOf(c)!==-1).length;
const ag=r.finalAlive.length-aw;
console.log('===== SEED '+seed+' =====');
console.log('最终存活('+r.finalAlive.length+'): '+r.finalAlive.map(nm).join(', '));
console.log('好人存活:'+ag+' | 狼存活:'+aw+' | '+(aw===0?'好人胜':ag===0?'堕仙胜':'平局(轮回)'));
r.log.forEach(l=>{
  console.log('');
  console.log('--- D'+l.day+' ---');
  if(l.exile&&l.exile.ok){const ex=l.exide||l.exile;let s='  [流放] '+nm(ex.accuser)+' 质疑 '+nm(ex.target)+' ('+ex.votesFor+'赞:'+ex.votesAgainst+'反:'+(ex.abstains||0)+'弃)';if(ex.exiled){s+=' -> 流放';if(ex.swingTriggered)s+=' (陈默破平)';}else{s+=' -> 保留';}if(ex.witchProtectTriggered)s+=' ***[银水介入]***';console.log(s);}
  if(l.trap&&l.trap.triggered)console.log('  [陷阱] 江白发现 '+nm(l.trap.target)+' 受伤');
  if(l.duelTarget){const r2=l.duelTarget.result;const rs=r2==='killed_wolf'?'杀狼':r2==='wolf_king_mutual'?'同归狼王':r2==='innocent_killed'?'砍好人(自杀)':'?';console.log('  [镇煞决斗] 林小满 -> '+nm(l.duelTarget.target)+' = '+rs);}
  if(l.prophetShot){let s='  [昭判枪] 方衡 -> '+nm(l.prophetShot.target);if(l.prophetShot.mutualKill)s+=' (狼王同归)';console.log(s);}
  if(l.swap)console.log('  [幻真] '+nm(l.swap.a)+' <-> '+nm(l.swap.b)+' ('+l.swap.reason+')');
  if(l.prophetCheck){let s='  [昭判] 验 '+nm(l.prophetCheck.target)+' = '+(ALIGN[l.prophetCheck.alignment]||l.prophetCheck.alignment);if(l.prophetShared&&l.prophetShared.ok)s+=' (分享'+l.prophetShared.count+'条)';console.log(s);}
  if(l.guardTarget)console.log('  [镇煞守卫] 守 '+nm(l.guardTarget));
  if(l.selfStab){let s='  *[自刀] '+nm(l.selfStab.stabber||'?');if(l.selfStab.witchRevived)s+=' -> 女巫被骗复活!!';else if(l.selfStab.witchRecognized)s+=' -> 女巫识破';else s+=' -> 女巫未介入';console.log(s);}
  if(l.witch&&!l.witch.selfStab){if(l.witch.action==='save')console.log('  [渡君还魂] 救 '+nm(l.witch.target));else console.log('  [渡君缚魂] 缚 '+nm(l.witch.target));}
  if(l.kill){if(l.kill.killed){let s='  [夜杀] '+nm(l.kill.actualTarget||l.kill.target)+' 被 '+nm(l.kill.killer||'?')+' 杀';const sp=l.kill.special;if(sp==='hidden_wolf_kill')s+=' {隐狼觉醒}';else if(sp==='body_removed')s+=' {抹尸}';else if(sp==='wolf_king_mutual')s+=' {狼王同归}';else if(sp==='wolf_king_mutual_swap')s+=' {致幻同归}';else if(sp==='friendly_fire')s+=' {致幻误杀同伴}';else if(sp==='guarded')s+=' {镇煞挡下}';if(l.kill.friendlyFire)s+=' [误杀同伴]';console.log(s);}else if(l.kill.special==='self_stab_night'){console.log('  [夜杀] (自刀夜)');}else{console.log('  [夜杀] 平安夜');}}
  if(l.prophetCounter){let s='  [临死反杀] 方衡指认 '+nm(l.prophetCounter.target);if(l.prophetCounter.hit){s+=' -> 命中!';if(l.prophetCounter.realKiller==='zhou_yang')s+=' (周阳狼王同归)';}else{s+=' -> 打偏!';}if(l.prophetCounter.realKiller)s+=' [真凶='+nm(l.prophetCounter.realKiller)+']';console.log(s);}
  if(l.hearer&&l.hearer.woke){let s='  [老郑] 夜里醒来，听到'+(l.hearer.direction||'?')+'方向脚步声';if(l.hearer.neighborLeft)s+=' (隔壁出门)';console.log(s);}
  if(l.medic&&l.medic.detected)console.log('  [苏晚] 体检发现 '+nm(l.medic.target)+' 异常');
});
