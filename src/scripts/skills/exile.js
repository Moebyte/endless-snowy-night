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

  var Game = window.Game;
  var ensureState = Game.ensureState;
  var WOLF_ROLES = GameState.WOLF_ROLES;

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
  // Export shared helpers for exile-vote.js and exile-ai.js
  // Shared with exile-vote.js / exile-ai.js. ensureState + WOLF_ROLES now use
  // the public Game.ensureState() / GameState.WOLF_ROLES; the rest stay private.
  Game._exileEnsureExile = ensureExile;
  Game._exileACCUSERS = ACCUSERS;
  Game._exileTHRESHOLDS = THRESHOLDS;
  Game._exileMajorityNeeded = majorityNeeded;
})();

