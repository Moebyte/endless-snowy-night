/*
 * exile.js - Public accusation + exile system (daytime social combat)
 *
 * v9.2 design (design-doc 8.5):
 *   Three tracked accusers can publicly accuse someone:
 *     - Lin Xiaoman (knight): driven by her own suspicion (protects Tang)
 *     - Fang Heng (prophet):  driven by "hostile" check results + cop instinct
 *     - Zhao Mingcheng (wolf): political manipulator, frames good people
 *
 *   Flow per day (at most ONE accusation):
 *     1. Accuser accumulated suspicion toward someone crosses threshold
 *     2. Accuser publicly accuses: "I think X is a traitor"
 *     3. COLLECTIVE VOTE: every alive character votes exile / spare
 *        - Chen Mo (player) is a normal participant, one vote
 *        - Majority (> half of alive, excluding the accused) -> exile
 *     4. Exiled character is locked in a cellar, exits all interactions
 *        (cannot be killed, cannot kill, cannot vote, cannot be checked)
 *     5. Chen Mo can visit the cellar (protagonist privilege) for intel
 *
 *   Social credit: each accusation costs the accuser credibility.
 *   Frequent accusers lose influence -> later votes swing against them.
 *   Fang Heng CANNOT accuse after his gun is exposed (nobody believes him).
 *
 *   Vote logic by role:
 *     - Good: votes by own judgment (day events + received info), can be misled
 *     - Wolves: secretly protect teammates, frame good people (not too obvious)
 *     - Tang Xiaotang (hidden wolf): tacitly aids wolf team, leans toward
 *       exiling good people, but never too visibly
 *     - Fang Heng: uses cop instinct, but post-exposure his vote is ignored
 *     - Lin Xiaoman: heavily influenced by Tang Xiaotang hints
 */

(function () {
  'use strict';

  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return State.variables.game;
  }

  var Game = window.Game;
  var WOLF_ROLES = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];

  // The three tracked accusers
  var ACCUSERS = ['fang_heng', 'jiang_bai', 'zhao_mingcheng', 'gu_yan'];

  // Accusation thresholds (suspicion needed to trigger)
  var THRESHOLDS = {
        fang_heng: 55,       // cop instinct; slightly lower
    zhao_mingcheng: 50,  // manipulator; uses accusations strategically
    gu_yan: 45,           // physicist
    jiang_bai: 55          // trap evidence
  };

  // Exile majority = strictly more than half of "voters"
  // voters = alive characters except the accused (accuser CAN vote)
  function majorityNeeded(aliveCount) {
    return Math.floor(aliveCount / 2) + 1;
  }

  function ensureExile(g) {
    if (!g.exile) {
      g.exile = {
        suspicion: { lin_xiaoman: {}, fang_heng: {}, jiang_bai: {}, zhao_mingcheng: {}, gu_yan: {} },
        credit: { lin_xiaoman: 80, fang_heng: 80, jiang_bai: 70, zhao_mingcheng: 70, gu_yan: 65 },
        history: [],
        exiled: {},
        lastAccusationDay: 0,
        fangExposed: false
      };
    }
    var e = g.exile;
    if (!e.suspicion) e.suspicion = { lin_xiaoman: {}, fang_heng: {}, jiang_bai: {}, zhao_mingcheng: {}, gu_yan: {} };
    if (!e.credit) e.credit = { lin_xiaoman: 80, fang_heng: 80, jiang_bai: 70, zhao_mingcheng: 70, gu_yan: 65 };
    if (!e.history) e.history = [];
    if (!e.exiled) e.exiled = {};
    return e;
  }

  Game.exileEnsure = function () { return ensureExile(ensureState()); };

  // ---- Query ----

  Game.isExiled = function (charId) {
    var g = ensureState();
    return !!(g.exile && g.exile.exiled && g.exile.exiled[charId]);
  };

  Game.exiledList = function () {
    var g = ensureState();
    if (!g.exile || !g.exile.exiled) return [];
    return Object.keys(g.exile.exiled).filter(function (id) { return g.exile.exiled[id]; });
  };

  Game.exileCanParticipate = function (charId) {
    if (Game.isExiled(charId)) return false;
    return Game.isAlive(charId);
  };

  // Characters who can still be targeted/voted on/checked.
  Game.exileActiveList = function () {
    return Game.activeList().filter(function (id) { return !Game.isExiled(id); });
  };

  // ---- Suspicion update (called once per day, after day events) ----

  Game.exileUpdateSuspicion = function () {
    var g = ensureState();
    var e = ensureExile(g);
    var day = g.day;
    var events = Game.getDayEvents(day);

    // Daily decay so old suspicions fade slightly across the loop.
    ['fang_heng', 'jiang_bai', 'zhao_mingcheng', 'gu_yan'].forEach(function (acc) {
      var s = e.suspicion[acc];
      if (!s) { e.suspicion[acc] = {}; return; }
      Object.keys(s).forEach(function (tgt) {
        s[tgt] = Math.max(0, s[tgt] - 3);
      });
    });

    // [v9.5.1] Self-stab aftermath: the feigning wolf looks "weakened" today.
    // Fang Heng (cop instinct) notices the odd physical state and gains suspicion.
    if (g.flags) {
      var weakKeys = ["zhou_yang", "tang_xiaotang", "zhao_mingcheng"];
      for (var wi = 0; wi < weakKeys.length; wi++) {
        if (g.flags["weakened_" + weakKeys[wi]] && g.alive[weakKeys[wi]]) {
          var cur = (e.suspicion.fang_heng || {})[weakKeys[wi]] || 0;
          if (!e.suspicion.fang_heng) e.suspicion.fang_heng = {};
          e.suspicion.fang_heng[weakKeys[wi]] = cur + 15;
          delete g.flags["weakened_" + weakKeys[wi]];  // one-time effect
        }
      }
    }

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];

      // Lin Xiaoman: echoes events she personally observed.
      if (ev.observer === 'lin_xiaoman' || ev.a === 'lin_xiaoman') {
        var t1 = ev.target;
        if (t1 && t1 !== 'lin_xiaoman') {
          e.suspicion.lin_xiaoman[t1] = (e.suspicion.lin_xiaoman[t1] || 0) + Math.floor(ev.weight / 3);
        }
      }
      // Anyone targeting Tang -> Lin Xiaoman's exile-suspicion spikes hard.
      if (ev.target === 'tang_xiaotang' || ev.b === 'tang_xiaotang') {
        var agg = ev.a;
        if (agg && agg !== 'lin_xiaoman') {
          e.suspicion.lin_xiaoman[agg] = (e.suspicion.lin_xiaoman[agg] || 0) + ev.weight;
        }
      }
      // Fang Heng: weights events he observed; heavier on direct cop tells.
      if (ev.observer === 'fang_heng' || ev.a === 'fang_heng') {
        var t2 = ev.target;
        if (t2 && t2 !== 'fang_heng') {
          e.suspicion.fang_heng[t2] = (e.suspicion.fang_heng[t2] || 0) + Math.floor(ev.weight / 2);
        }
      }
      // Fang Heng also echoes strong observation tells from anyone.
      if (ev.type === 'observation' && ev.observer !== 'fang_heng') {
        var t3 = ev.target;
        if (t3 && t3 !== 'fang_heng' && ev.weight >= 12) {
          e.suspicion.fang_heng[t3] = (e.suspicion.fang_heng[t3] || 0) + Math.floor(ev.weight / 3);
        }
      }
      // ── Both wolves actively frame good people (shared wolf tactic) ──
      // Active suspicion construction is a wolf-team universal skill, not
      // exclusive to one member. Both Zhao Mingcheng and Gu Yan absorb events
      // from ALL observers (not just their own) and build cases against
      // threats. Personality differences are reflected in weight and style.

      var tWolf = ev.target || ev.b;
      // Zhao Mingcheng: political fixer — watches from shadows, plants seeds.
      // Absorbs events at 1/3 weight (quieter, less direct than Gu Yan).
      if (tWolf && tWolf !== 'zhao_mingcheng') {
        var zmWeight = (ev.observer === 'zhao_mingcheng') ? Math.floor(ev.weight / 2) : Math.floor(ev.weight / 3);
        e.suspicion.zhao_mingcheng[tWolf] = (e.suspicion.zhao_mingcheng[tWolf] || 0) + zmWeight;
      }
      // Gu Yan: physicist — analytical, builds logical cases openly.
      // Absorbs events at 1/2 weight (more assertive than Zhao).
      if (tWolf && tWolf !== 'gu_yan') {
        var gyWeight = (ev.observer === 'gu_yan') ? ev.weight : Math.floor(ev.weight / 2);
        e.suspicion.gu_yan[tWolf] = (e.suspicion.gu_yan[tWolf] || 0) + gyWeight;
      }

      // Both wolves actively build cases against key threats:
      // Fang Heng (prophet), Lin Xiaoman (knight), Shen Shen (magician).
      var wolfThreats = ['fang_heng', 'lin_xiaoman', 'shen_shen'];
      for (var wt = 0; wt < wolfThreats.length; wt++) {
        var wThreat = wolfThreats[wt];
        if (ev.a === wThreat || ev.b === wThreat || ev.target === wThreat) {
          // Gu Yan: 1/3 extra (analytical, builds detailed case)
          if (wThreat !== 'gu_yan') {
            e.suspicion.gu_yan[wThreat] = (e.suspicion.gu_yan[wThreat] || 0) + Math.floor(ev.weight / 3);
          }
          // Zhao Mingcheng: 1/4 extra (quieter, but just as targeted)
          if (wThreat !== 'zhao_mingcheng') {
            e.suspicion.zhao_mingcheng[wThreat] = (e.suspicion.zhao_mingcheng[wThreat] || 0) + Math.floor(ev.weight / 4);
          }
        }
      }
    }

    // Lin Xiaoman: mirror knight.suspicion (authoritative, includes Tang bias).
    if (g.godSkills && g.godSkills.knight && g.godSkills.knight.suspicion) {
      var ks = g.godSkills.knight.suspicion;
      Object.keys(ks).forEach(function (tgt) {
        e.suspicion.lin_xiaoman[tgt] = Math.max(e.suspicion.lin_xiaoman[tgt] || 0, ks[tgt] || 0);
      });
    }

    // Fang Heng: fold his "hostile" prophet checks into suspicion.
    if (g.godSkills && g.godSkills.prophet && g.godSkills.prophet.checks) {
      g.godSkills.prophet.checks.forEach(function (chk) {
        if (chk.result === 'hostile') {
          e.suspicion.fang_heng[chk.target] = (e.suspicion.fang_heng[chk.target] || 0) + 25;
        }
      });
    }

    // Cap + protected characters per accuser.
var protect = {
      lin_xiaoman: ['tang_xiaotang', 'chen_mo', 'lin_xiaoman'],
      fang_heng: ['fang_heng', 'chen_mo'],
      zhao_mingcheng: ['zhao_mingcheng'],
      gu_yan: ['gu_yan'],  // Gu Yan
      jiang_bai: ['jiang_bai', 'chen_mo', 'su_wan']
    };
    var wolfTeam = ['zhou_yang', 'tang_xiaotang', 'gu_yan', 'zhao_mingcheng'];
    ['fang_heng', 'jiang_bai', 'zhao_mingcheng', 'gu_yan'].forEach(function (acc) {
      var s = e.suspicion[acc];
      if (!s) { e.suspicion[acc] = {}; return; }
      Object.keys(s).forEach(function (tgt) {
        if (s[tgt] > 100) s[tgt] = 100;
        if (protect[acc].indexOf(tgt) !== -1) s[tgt] = 0;
      });
      // Zhao Mingcheng never seriously accuses his own wolf teammates.
      if (acc === 'zhao_mingcheng') {
        wolfTeam.forEach(function (wt) {
          if (s[wt]) s[wt] = Math.min(s[wt], 20);
        });
      }
      // Gu Yan also protects wolf teammates from his own accusations
      if (acc === 'gu_yan') {
        wolfTeam.forEach(function (wt) {
          if (s[wt]) s[wt] = Math.min(s[wt], 20);
        });
      }
    });
  };

  Game.exileGetSuspicion = function (accuser, target) {
    var e = ensureExile(ensureState());
    return (e.suspicion[accuser] || {})[target] || 0;
  };

  Game.exileGetCredit = function (accuser) {
    var e = ensureExile(ensureState());
    return e.credit[accuser] || 0;
  };

  // ---- Fang Heng exposure (called by prophet.js when he shoots) ----

  Game.exileMarkFangExposed = function () {
    var e = ensureExile(ensureState());
    e.fangExposed = true;
    e.credit.fang_heng = 0;  // nobody trusts an exposed gunman
  };

  // ---- AI: who does each accuser want to accuse today? ----

  Game.exileAIGetAccusationTarget = function (accuser) {
    var g = ensureState();
    var e = ensureExile(g);

    if (g.day === e.lastAccusationDay) return null;
    if (accuser === 'fang_heng' && e.fangExposed) return null;
    if (!g.alive[accuser]) return null;

    // Jiang Bai: his accusation comes from TRAP EVIDENCE, not accumulated
    // suspicion. Check this BEFORE the generic candidates filter, because
    // his suspicion values won't reach threshold through day events.
    if (accuser === 'jiang_bai') {
      var jbG = ensureState();
      var trapTarget = null;
      if (jbG.traps && jbG.traps.lastObservedInjury && jbG.alive[jbG.traps.lastObservedInjury]) {
        trapTarget = jbG.traps.lastObservedInjury;
      }
      if (trapTarget) {
        // Protected: never accuse roommate or girlfriend
        if (trapTarget === 'chen_mo' || trapTarget === 'su_wan' || trapTarget === 'jiang_bai') return null;
        // Low-credit check: even with evidence, sometimes holds back
        if ((e.credit['jiang_bai'] || 0) < 20 && Math.random() < 0.4) return null;
        return trapTarget;
      }
      // No trap evidence -> Jiang Bai doesn't accuse
      return null;
    }

    var threshold = THRESHOLDS[accuser] || 60;
    var s = e.suspicion[accuser] || {};

    var candidates = Game.exileActiveList().filter(function (id) {
      if (id === accuser) return false;
      if (s[id] === undefined || s[id] < threshold) return false;
      return true;
    });
    if (!candidates.length) return null;

    candidates.sort(function (a, b) { return s[b] - s[a]; });
    var target = candidates[0];

// Zhao Mingcheng: never accuse a wolf teammate, never on day 1.
    if (accuser === 'zhao_mingcheng') {
      var tRole = Game.roleOf(target);
      if (WOLF_ROLES.indexOf(tRole) !== -1) return null;
      if (g.day < 2) return null;
    }

    // Gu Yan: never accuse a wolf teammate, never on day 1.
    // He's more patient than Zhao — waits for day 2+ to build a case.
    if (accuser === 'gu_yan') {
      var tRoleG = Game.roleOf(target);
      if (WOLF_ROLES.indexOf(tRoleG) !== -1) return null;
      if (g.day < 2) return null;
    }

    // Lin Xiaoman: never accuse Tang or Chen Mo.
    if (accuser === 'lin_xiaoman') {
      if (target === 'tang_xiaotang' || target === 'chen_mo') return null;
    }

    // Low-credit accusers sometimes hold back.
    if ((e.credit[accuser] || 0) < 20 && Math.random() < 0.6) return null;

    return target;
  };

  // ---- Vote simulation (three-state: exile / abstain / spare) ----
  // [v9.3.2] Rule: exile succeeds if votesFor > votesAgainst (simple majority).
  // Abstains do NOT count — silence is neither support nor opposition.
  // Returns { votesFor, votesAgainst, abstains, voters: [{id, vote, reason}] }

  Game.exileVote = function (accuser, target) {
    var g = ensureState();
    var voters = Game.exileActiveList().filter(function (id) {
      return id !== target;
    });

    var e = ensureExile(g);
    var targetRole = Game.roleOf(target);
    var targetIsWolf = WOLF_ROLES.indexOf(targetRole) !== -1;
    var accuserExposed = (accuser === 'fang_heng' && e.fangExposed);

    var votesFor = 0, votesAgainst = 0, abstains = 0;
    var voterLog = [];

    // Precompute Chen Mo's vote so Jiang Bai & Su Wan can follow it.
    // Chen Mo NEVER abstains — the player always makes a choice.
    var chenMoVoteResult = null;  // 'exile' | 'spare'
    if (g.alive['chen_mo'] && voters.indexOf('chen_mo') !== -1) {
      var _sAcc = (e.suspicion[accuser] || {})[target] || 0;
      var _pEvt = 0;
      var _evsCM = Game.getDayEvents(g.day);
      for (var _k = 0; _k < _evsCM.length; _k++) {
        if (_evsCM[_k].target === target || _evsCM[_k].b === target) _pEvt += _evsCM[_k].weight;
      }
      var _cmScore = _sAcc * 0.5 + _pEvt * 0.5 + (e.credit[accuser] || 0) * 0.2;
      // Jiang Bai's trap evidence is compelling — Chen Mo trusts physical proof
      if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
        _cmScore += 30;  // physical evidence boost
      }
      chenMoVoteResult = _cmScore > 45 ? 'exile' : 'spare';
    }

    for (var i = 0; i < voters.length; i++) {
      var v = voters[i];
      var vRole = Game.roleOf(v);
      var vIsWolf = WOLF_ROLES.indexOf(vRole) !== -1;
      var vote = 'abstain';  // default to abstain (three-state)
      var reason = '';

      if (v === accuser) {
        // Accuser votes exile (unless exposed -> abstain, nobody listens)
        vote = accuserExposed ? 'abstain' : 'exile';
        reason = accuserExposed ? 'accuser_exposed_abstain' : 'self_accuse';
      }
      // Chen Mo: player vote. NEVER abstains (player always chooses).
      else if (v === 'chen_mo') {
        vote = chenMoVoteResult !== null ? chenMoVoteResult : 'spare';
        reason = 'player_judgment';
      }
      // Su Wan: follow Chen Mo 65% (45% if Fang accuses).
      // Jiang Bai: NOW a tracked accuser with trap evidence, so he has his
      // own vote logic below. When he's a voter (not the accuser), he still
      // leans toward Chen Mo but has independent judgment from trap evidence.
      else if (v === 'su_wan') {
        if (chenMoVoteResult !== null) {
          var followRate = (accuser === 'fang_heng') ? 0.45 : 0.65;
          if (Math.random() < followRate) {
            vote = chenMoVoteResult;
            reason = 'follow_chen_mo';
          } else {
            vote = 'abstain';
            reason = 'no_opinion';
          }
        } else {
          vote = 'abstain';
          reason = 'lost_chenmo_anchor';
        }
      }
      // Jiang Bai as voter: if his trap caught the accused person, he votes
      // exile with high confidence (physical proof). Otherwise follows Chen Mo
      // but more independently than Su Wan (he's the pragmatic engineer).
      else if (v === 'jiang_bai') {
        var jbTrapMatch = false;
        if (g.traps && g.traps.lastObservedInjury === target) {
          jbTrapMatch = true;
        }
        if (jbTrapMatch) {
          // Trap evidence matches the accused — strong conviction
          vote = 'exile';
          reason = 'trap_evidence_match';
        } else if (chenMoVoteResult !== null) {
          var jbFollow = (accuser === 'fang_heng') ? 0.45 : 0.65;
          if (Math.random() < jbFollow) {
            vote = chenMoVoteResult;
            reason = 'follow_chen_mo';
          } else {
            vote = 'abstain';
            reason = 'no_opinion';
          }
        } else {
          vote = 'abstain';
          reason = 'lost_chenmo_anchor';
        }
      }
      // Wolves vote strategically.
      else if (vIsWolf) {
        if (targetIsWolf) {
          // Protect teammate — but smart wolves sometimes abstain to hide
          if ((v === 'zhao_mingcheng' || v === 'gu_yan') && Math.random() < 0.25) {
            vote = 'abstain';
            reason = 'wolf_hide_stance';
          } else {
            vote = 'spare';
            reason = 'wolf_protect_teammate';
          }
        } else {
          // Frame a good person — willingness varies by personality
          var blocWillingness = {
            zhao_mingcheng: 0.50,
            gu_yan: 0.55,
            zhou_yang: 0.85,
            tang_xiaotang: 0.75
          };
          var will = blocWillingness[v] !== undefined ? blocWillingness[v] : 0.7;
          if (v === 'tang_xiaotang' && g.day <= 3) will = 0.30;
          // [v9.6] Phase aggression: later loops = bolder framing.
          if (typeof Game.wolfBlocModifier === 'function') {
            will = Math.min(0.95, will * Game.wolfBlocModifier());
          }

          var roll = Math.random();
          if (roll < will) {
            vote = 'exile';
            reason = (v === 'tang_xiaotang' && g.day <= 3) ? 'tang_laying_low' : 'wolf_frame_good';
          } else if (roll < will + 0.20) {
            // Smart wolves sometimes abstain instead of openly opposing
            vote = 'abstain';
            reason = 'wolf_abstain_strategic';
          } else {
            vote = 'spare';
            reason = 'wolf_feign_neutral';
          }
        }
      }
      // Fang Heng: never abstains (cop instinct — he always has an opinion).
      else if (v === 'fang_heng') {
        var fSusp = (e.suspicion.fang_heng || {})[target] || 0;
        var fCred = e.credit[accuser] || 0;
        if (accuserExposed) fCred = 0;
        // Fang Heng gives weight to Jiang Bai's trap evidence (physical proof)
        if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
          fSusp += 35;
        }
        vote = (fSusp + fCred * 0.3) > 50 ? 'exile' : 'spare';
        reason = 'cop_instinct';
      }
      // Lin Xiaoman: rarely abstains (she always has strong feelings).
      // Only abstains if Tang hasn't hinted AND she has no personal read.
      else if (v === 'lin_xiaoman') {
        var lSusp = (e.suspicion.lin_xiaoman || {})[target] || 0;
        // Check Tang hint
        var tangHinted = false;
        var evsL = Game.getDayEvents(g.day);
        for (var li = 0; li < evsL.length; li++) {
          if (evsL[li].type === 'tang_hint' && evsL[li].target === target) { tangHinted = true; break; }
        }
        if (tangHinted) lSusp += 40;
        // Gold water for Lin too (she barely trusts Fang, but +45 is strong)
        if (typeof Game.prophetReceivedInfo === 'function') {
          var lGold = Game.prophetReceivedInfo('lin_xiaoman', target);
          if (lGold && lGold.result === 'hostile') lSusp += 45;
        }
        if (lSusp > 50) { vote = 'exile'; reason = tangHinted ? 'tang_hinted' : 'own_suspicion'; }
        else if (lSusp > 15) { vote = 'spare'; reason = 'insufficient_suspicion'; }
        else { vote = 'abstain'; reason = 'no_read'; }  // rare
      }
      // Ye Zhiqiu (witch): gentle, hesitant. Abstains when unsure.
      else if (v === 'ye_zhiqiu') {
        var ySusp = 0;
        // Ye Zhiqiu trusts Jiang Bai's physical trap evidence
        if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
          ySusp += 40;
        }
        var evsY = Game.getDayEvents(g.day);
        for (var yi = 0; yi < evsY.length; yi++) {
          if ((evsY[yi].target === target || evsY[yi].b === target) && evsY[yi].observer === 'ye_zhiqiu') {
            ySusp += evsY[yi].weight;
          }
        }
        // Silver water: if she revived this person, she trusts them -> spare
        var witchY = g.godSkills && g.godSkills.witch;
        if (witchY && witchY.revivedTargets && witchY.revivedTargets.indexOf(target) !== -1) {
          vote = 'spare'; reason = 'silver_water_trust';
        } else if (ySusp > 50) { vote = 'exile'; reason = 'observed_suspicion'; }
        else if (ySusp > 20) { vote = 'abstain'; reason = 'uncertain'; }  // gentle hesitation
        else { vote = 'abstain'; reason = 'no_opinion'; }
      }
      // Shen Shen (magician): gambler, hedges bets -> abstains often.
      else if (v === 'shen_shen') {
        var sSusp = 0;
        var evsS = Game.getDayEvents(g.day);
        for (var si = 0; si < evsS.length; si++) {
          if ((evsS[si].target === target || evsS[si].b === target)) sSusp += Math.floor(evsS[si].weight / 2);
        }
        if (sSusp > 55) { vote = 'exile'; reason = 'gambler_read'; }
        else if (sSusp > 30) { vote = 'abstain'; reason = 'hedging'; }
        else { vote = 'abstain'; reason = 'no_stake'; }
      }
      // Zheng Shoushan (old driver villager): not a detective, abstains often.
      else if (v === 'zheng_shoushan') {
        var zSusp = 0;
        var evsZ = Game.getDayEvents(g.day);
        for (var zi = 0; zi < evsZ.length; zi++) {
          if ((evsZ[zi].target === target || evsZ[zi].b === target) && evsZ[zi].observer === 'zheng_shoushan') {
            zSusp += evsZ[zi].weight;
          }
        }
        // Gold water helps — if Fang told him, he listens
        if (typeof Game.prophetReceivedInfo === 'function') {
          var zGold = Game.prophetReceivedInfo('zheng_shoushan', target);
          if (zGold && zGold.result === 'hostile') zSusp += 45;
        }
        if (zSusp > 50) { vote = 'exile'; reason = 'gold_water_or_observation'; }
        else if (zSusp > 25) { vote = 'abstain'; reason = 'insufficient_info'; }
        else { vote = 'abstain'; reason = 'just_a_driver'; }
      }
      // Generic good character (fallback)
      else {
        var gSusp = 0;
        var evsG = Game.getDayEvents(g.day);
        for (var gi = 0; gi < evsG.length; gi++) {
          if ((evsG[gi].target === target || evsG[gi].b === target) && evsG[gi].observer === v) {
            gSusp += evsG[gi].weight;
          }
        }
        // Gold water
        if (typeof Game.prophetReceivedInfo === 'function') {
          var gGold = Game.prophetReceivedInfo(v, target);
          if (gGold && gGold.result === 'hostile') { gSusp += 45; reason = 'gold_water'; }
        }
        var gCred = e.credit[accuser] || 0;
        if (accuserExposed) gCred = 0;
        var gTotal = gSusp + gCred * 0.3;
        if (gTotal > 50) { vote = 'exile'; if(!reason) reason = 'own_judgment'; }
        else if (gTotal > 20) { vote = 'abstain'; reason = 'uncertain'; }
        else { vote = 'abstain'; reason = 'no_opinion'; }
      }

      // Tally
      if (vote === 'exile') votesFor++;
      else if (vote === 'spare') votesAgainst++;
      else abstains++;
      voterLog.push({ id: v, vote: vote, reason: reason });
    }

    return { votesFor: votesFor, votesAgainst: votesAgainst, abstains: abstains, voters: voterLog };
  };

  // ---- Execute accusation + vote + exile ----

  Game.exileAccuse = function (accuser, target) {
    var g = ensureState();
    var e = ensureExile(g);

    if (g.day === e.lastAccusationDay) return { ok: false, reason: 'already_accused_today' };
    if (!g.alive[accuser]) return { ok: false, reason: 'accuser_dead' };
    if (!g.alive[target]) return { ok: false, reason: 'target_dead' };
    if (Game.isExiled(target)) return { ok: false, reason: 'target_already_exiled' };
    if (accuser === 'fang_heng' && e.fangExposed) return { ok: false, reason: 'fang_exposed_cannot_accuse' };

    e.lastAccusationDay = g.day;

    var voteResult = Game.exileVote(accuser, target);

    // [v9.5] Ye Zhiqiu silver-water intervention (BEFORE final tally).
    // If the accused is the person she revived this round, she may publicly
    // veto. Her veto adds moral weight (3 spare votes) and EXPOSES her as
    // the witch -> wolves prioritize her tonight.
    var witchProtectTriggered = false;
    if (typeof Game.witchShouldProtect === "function" && Game.isAlive("ye_zhiqiu") && !Game.isExiled("ye_zhiqiu")) {
      if (Game.witchShouldProtect(target, voteResult)) {
        var wWeight = Game.witchProtectVoteWeight();
        voteResult.votesAgainst += wWeight;
        witchProtectTriggered = true;
        Game.revealInfo("ye_zhiqiu", "witch_exposed");
        if (!g.flags) g.flags = {};
        g.flags["ye_zhiqiu_exposed"] = true;
        voteResult.voters.push({ id: "ye_zhiqiu", vote: "spare", reason: "silver_water_veto", weight: wWeight });
      }
    }

    // [v9.3.2] SIMPLE MAJORITY: exile succeeds if votesFor > votesAgainst.
    // Abstains do NOT count. Even 2:1 exile wins. Silence = passive acceptance.
    var exiled = voteResult.votesFor > voteResult.votesAgainst;

    // [v9.3.2] CHEN MO TIE-BREAKER: if it's a tie (votesFor === votesAgainst)
    // and Chen Mo voted exile, his vote breaks the tie -> exile succeeds.
    // This gives the player decisive influence in close votes.
    var swingTriggered = false;
    if (!exiled && voteResult.votesFor === voteResult.votesAgainst && voteResult.votesFor > 0) {
      var chenMoVotedExile = voteResult.voters.some(function (vt) {
        return vt.id === 'chen_mo' && vt.vote === 'exile';
      });
      if (chenMoVotedExile) {
        exiled = true;
        swingTriggered = true;
      }
    }


    // Accuser pays credibility (failed accusations cost more).
    var cost = exiled ? 15 : 25;
    if (accuser === 'zhao_mingcheng') cost = Math.floor(cost * 0.7);
    e.credit[accuser] = Math.max(0, (e.credit[accuser] || 0) - cost);

    var record = {
      day: g.day,
      loop: g.loop,
      accuser: accuser,
      target: target,
      votesFor: voteResult.votesFor,
      votesAgainst: voteResult.votesAgainst,
      abstains: voteResult.abstains,
      exiled: exiled,
      voters: voteResult.voters
    };
    e.history.push(record);

    // [v9.3-C] Track vote patterns for bloc-detection backfire.
    Game.exileRecordVotePattern(voteResult, target, exiled);

    if (exiled) {
      e.exiled[target] = true;
      // Clear pending god-skill state involving them (e.g. knight guarding).
      if (g.godSkills && g.godSkills.knight && g.godSkills.knight.guarding === target) {
        g.godSkills.knight.guarding = null;
      }
    }

    return {
      ok: true,
      reason: exiled ? 'exiled' : 'spared',
      accuser: accuser,
      target: target,
      votesFor: voteResult.votesFor,
      votesAgainst: voteResult.votesAgainst,
      abstains: voteResult.abstains,
      exiled: exiled,
      swingTriggered: swingTriggered,
      witchProtectTriggered: witchProtectTriggered
    };
  };

  // ---- AI: run the daytime accusation phase (at most one per day) ----
  // Priority: Jiang Bai (physical trap evidence) > Lin Xiaoman > Fang Heng > Zhao Mingcheng > Gu Yan.
  // Jiang Bai's trap evidence is a hard physical fact, so it takes precedence
  // over everyone else's suspicion/intuition/framing. When he has no evidence,
  // he simply doesn't participate and the normal order runs.

  Game.exileAIPhase = function () {
    var g = ensureState();
    if (!g.alive['chen_mo']) return null;

    Game.exileUpdateSuspicion();

    // Jiang Bai goes FIRST if he has trap evidence today.
    if (g.alive['jiang_bai'] && !(typeof Game.isExiled === 'function' && Game.isExiled('jiang_bai'))) {
      var jbTarget = Game.exileAIGetAccusationTarget('jiang_bai');
      if (jbTarget) {
        return Game.exileAccuse('jiang_bai', jbTarget);
      }
    }

    // Normal order for the other four accusers.
    var order = ['fang_heng', 'zhao_mingcheng', 'gu_yan'];
    for (var i = 0; i < order.length; i++) {
      var acc = order[i];
      if (!g.alive[acc]) continue;
      // [v9.3.3 FIX] Exiled accusers cannot initiate accusations.
      if (typeof Game.isExiled === 'function' && Game.isExiled(acc)) continue;
      var target = Game.exileAIGetAccusationTarget(acc);
      if (target) {
        return Game.exileAccuse(acc, target);
      }
    }
    return null;
  };

  // ---- Chen Mo visits an exiled character (protagonist privilege) ----

  Game.exileVisit = function (target) {
    var g = ensureState();
    if (!Game.isExiled(target)) return { ok: false, reason: 'not_exiled' };
    return { ok: true, target: target, day: g.day };
  };

  // ---- Reset (on loop reset) ----

  Game.exileReset = function () {
    var g = ensureState();
    g.exile = null;
    ensureExile(g);
  };


  // ---- [v9.3-C] Vote-pattern detection: bloc-voting backfires on wolves ----
  // In real werewolf, 4 wolves always voting together is the easiest tell.
  // We track which wolves voted "exile" on successful good-person exiles.
  // After 2 bloc patterns (>=3 wolves voting exile on a good target),
  // a day event fires that raises suspicion toward those wolves.

  Game.exileRecordVotePattern = function (voteResult, target, exiled) {
    var g = ensureState();
    var e = ensureExile(g);
    if (!e.votePatterns) e.votePatterns = [];

    // Only track patterns when the target was a GOOD person (wolves framing).
    var targetRole = Game.roleOf(target);
    var targetIsWolf = WOLF_ROLES.indexOf(targetRole) !== -1;
    if (targetIsWolf) return;  // wolves voting to protect a wolf isn't a tell

    // Record which wolves voted "exile" (frame good) this round.
    var wolvesVotingExile = [];
    for (var i = 0; i < voteResult.voters.length; i++) {
      var vt = voteResult.voters[i];
      var vtRole = Game.roleOf(vt.id);
      if (WOLF_ROLES.indexOf(vtRole) !== -1 && vt.vote === 'exile') {
        wolvesVotingExile.push(vt.id);
      }
    }

    // A "bloc pattern" = >=2 wolves voting exile on a good target.
    // (In a 12-player game, even 2 people always voting together is a tell.)
    if (wolvesVotingExile.length >= 2) {
      e.votePatterns.push({
        day: g.day,
        loop: g.loop,
        target: target,
        exiled: exiled,
        wolves: wolvesVotingExile
      });
    }

    // [v9.3-C tuned] After 1 bloc pattern, trigger suspicion backfire immediately.
    // Even a single instance of 2+ wolves voting together to frame a good
    // person is a noticeable tell to a cop (Fang Heng) and Chen Mo.
    if (e.votePatterns.length >= 1 && !e.backfireTriggered) {
      Game.exileTriggerBackfire(e.votePatterns);
      e.backfireTriggered = true;
    }
  };

  Game.exileTriggerBackfire = function (patterns) {
    var g = ensureState();
    var e = ensureExile(g);

    // Count how many times each wolf appeared in bloc patterns.
    var wolfCounts = {};
    for (var i = 0; i < patterns.length; i++) {
      for (var j = 0; j < patterns[i].wolves.length; j++) {
        var w = patterns[i].wolves[j];
        wolfCounts[w] = (wolfCounts[w] || 0) + 1;
      }
    }

    // Generate a day event: "several people always vote together, it's suspicious"
    // This raises Fang Heng's and Chen Mo's suspicion toward repeat offenders.
    var backfireEvent = {
      day: g.day,
      type: 'observation',
      a: 'chen_mo',               // Chen Mo notices the voting pattern
      b: 'chen_mo',
      target: 'chen_mo',          // placeholder, overridden per-wolf below
      observer: 'fang_heng',      // Fang Heng (cop) also reads the pattern
      weight: 30,                 // strong signal
      desc: '票型反噬: 大家发现这几个人总是一起投票，杀心太重'
    };
    g.dayEvents = g.dayEvents || [];
    g.dayEvents.push(backfireEvent);

    // Also directly inject suspicion into Fang Heng and Chen Mo toward
    // wolves who appeared in >=2 patterns (the core bloc).
    Object.keys(wolfCounts).forEach(function (wid) {
      if (wolfCounts[wid] >= 1 && g.alive[wid]) {
        // Fang Heng's exile-suspicion spikes toward repeat bloc-voters.
        e.suspicion.fang_heng[wid] = (e.suspicion.fang_heng[wid] || 0) + 35;
        // Per-wolf day event so other observers pick it up too.
        var ev = {
          day: g.day,
          type: 'observation',
          a: wid,
          b: wid,
          target: wid,
          observer: 'fang_heng',
          weight: 25,
          desc: wid + ' 连续多轮绑票，行为可疑'
        };
        g.dayEvents.push(ev);
      }
    });
  };

  // ---- Integration guards: exiled characters cannot be targeted by any system ----
  // We wrap the key entry points so exile filtering lives entirely in this module.

  function wrapIf(name) {
    if (typeof Game[name] !== 'function') return;
    if (Game['__exile_wrapped_' + name]) return;
    var orig = Game[name];
    Game[name] = function (targetId) {
      // For target-selection getters: return null if the picked target is exiled.
      if (targetId && Game.isExiled(targetId)) {
        return null;
      }
      var result = orig.apply(this, arguments);
      // getters that return a STRING target id pointing at an exiled char
      if (typeof result === 'string' && Game.isExiled(result)) {
        return null;
      }
      // getters that return an object with .target/.a/.b pointing at an exiled char
      if (result && typeof result === 'object') {
        if (result.target && Game.isExiled(result.target)) return null;
        if (result.a && Game.isExiled(result.a)) return null;
        if (result.b && Game.isExiled(result.b)) return null;
      }
      return result;
    };
    Game['__exile_wrapped_' + name] = true;
  }

  // Wrap wolf-target getter: wolves cannot pick an exiled target.
  if (typeof Game.getWolfTarget === 'function' && !Game.__exile_wrapped_getWolfTarget) {
    var origGWT = Game.getWolfTarget;
    Game.getWolfTarget = function () {
      var t = origGWT.apply(this, arguments);
      if (t && Game.isExiled(t)) return null;
      return t;
    };
    Game.__exile_wrapped_getWolfTarget = true;
  }

  // Wrap prophet check: cannot investigate an exiled character.
  wrapIf('prophetAIGetCheckTarget');

  // Wrap witch bind/revive AI: should not target exiled characters.
  wrapIf('witchAIDecidePreKill');
  wrapIf('witchAIDecideRevive');

  // Wrap knight AI targeters: cannot duel/guard an exiled character.
  wrapIf('knightAIGetDuelTarget');
  wrapIf('knightAIGetGuardTarget');

  // Wrap magician AI: cannot swap an exiled character.
  wrapIf('magicianAIDecideSwap');

})();
