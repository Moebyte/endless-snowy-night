/*
 * vote.js - Wolf team voting system: score targets + decide night kill
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

  var WOLF_IDS = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];
  var WOLF_ROLES = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];

  // Scoring weights for wolf target selection
  var WEIGHTS = {
    threat: 2.0,
    isolation: 1.5,
    trust_chenmo: -1.0,
    ability: 1.0,
    info: 1.2
  };

  // Score a potential target for a wolf (higher = more likely to kill)
  Game.scoreTarget = function (charId) {
    var g = ensureState();
    if (!g.alive[charId]) return -1;
    if (WOLF_IDS.indexOf(charId) !== -1) return -1;
    if (charId === 'chen_mo') return -1; // protagonist protected

    var role = Game.roleOf(charId);
    var profile = GameState.PROFILES[charId] || {};

    var score = 10;

    // Threat score: gods are high threat
    var threatScore = 3;
    if (['prophet', 'witch', 'knight', 'magician'].indexOf(role) !== -1) {
      threatScore = 7;
    }
    // Chen Mo with loop memory is dangerous
    if (charId === 'chen_mo' && Game.hasFlag('loop_awakened')) {
      threatScore = 8;
    }
    // Exposed roles are known threats
    if (Game.hasRevealed(charId, 'witch_exposed') || Game.hasRevealed(charId, 'identity_exposed')) {
      threatScore += 3;
    }
    score += threatScore * WEIGHTS.threat;

    // Isolation score: targets that are isolated are easier kills
    var isolationScore = 0;
    if (charId === 'fang_heng' && Game.hasRevealed(charId, 'identity_exposed')) {
      isolationScore += 4;
    }
    if (charId === 'lin_xiaoman' && Game.knightWeakened()) {
      isolationScore += 4;
    }
    if (charId === 'ye_zhiqiu' && Game.witchBroken()) {
      isolationScore += 3;
    }
    score += isolationScore * WEIGHTS.isolation;

    // Trust score: if Chen Mo trusts someone, wolves want them dead
    var trustKey = 'trust_' + charId;
    var trustVal = g.stats[trustKey] || 0;
    var trustScore = trustVal / 10;
    if (charId === 'su_wan' || charId === 'jiang_bai') {
      trustScore = 7;
    }
    score += trustScore * WEIGHTS.trust_chenmo;

    score += (profile.ability || 3) * WEIGHTS.ability;

    // Info score: characters with backstory clues are info-rich targets
    var infoScore = 3;
    var backstoryClue = GameState.BACKSTORY_KEYS[charId];
    if (backstoryClue && Game.hasClue(backstoryClue)) {
      infoScore += 2;
    }
    score += infoScore * WEIGHTS.info;

    // Random variance
    score *= (0.85 + Math.random() * 0.3);

    return Math.round(score);
  };

  // Team-level wolf target selection.
  // Wolves cannot communicate at night (per design), so instead of requiring
  // independent votes to reach consensus, the pack acts as one: each alive wolf
  // contributes its personal preference weights, we aggregate them into a single
  // weighted distribution, and pick one target. This keeps per-wolf personality
  // (protecting friends, targeting rivals) while guaranteeing a kill happens.
  Game.getWolfTarget = function () {
    var g = ensureState();

    var candidates = [];

    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (WOLF_IDS.indexOf(charId) !== -1) return;
      if (charId === 'chen_mo') return; // protagonist protected
      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    // Day 1: wolves don't know identities, random kill
    if (g.day === 1) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    var aliveWolves = WOLF_IDS.filter(function (w) { return g.alive[w]; });

    // Aggregate each wolf's preference weights across all candidates
    var teamWeights = {};
    candidates.forEach(function (c) { teamWeights[c] = 1; }); // baseline

    aliveWolves.forEach(function (wolfId) {
      var preferences = {};
      if (wolfId === 'tang_xiaotang') {
        preferences['su_wan'] = 4;       // jealous of the female lead
        preferences['ye_zhiqiu'] = 2;
      } else if (wolfId === 'gu_yan') {
        preferences['zheng_shoushan'] = 3; // old zheng knows too much
        preferences['jiang_bai'] = 2;
        preferences['su_wan'] = 1;
      } else if (wolfId === 'zhao_mingcheng') {
        preferences['zheng_shoushan'] = 4; // old zheng knows too much
        preferences['fang_heng'] = 3;
      } else if (wolfId === 'zhou_yang') {
        preferences['lin_xiaoman'] = 3;   // knight is dangerous
        preferences['fang_heng'] = 2;     // prophet is dangerous
        preferences['shen_shen'] = 1;
      }

      // Boost preference for exposed roles (pack-wide signal)
      candidates.forEach(function (cid) {
        if (Game.hasRevealed(cid, 'witch_exposed') || Game.hasRevealed(cid, 'identity_exposed')) {
          preferences[cid] = (preferences[cid] || 0) + 4;
        }
      });

      // Some wolves refuse to target certain characters (personal bonds)
      var veto = [];
      if (wolfId === 'tang_xiaotang') veto = ['lin_xiaoman', 'chen_mo'];

      candidates.forEach(function (cid) {
        if (veto.indexOf(cid) !== -1) return;
        teamWeights[cid] += (preferences[cid] || 0);
      });
    });

    // Weighted random selection from the aggregated distribution
    var total = 0;
    candidates.forEach(function (c) { total += teamWeights[c]; });
    var r = Math.random() * total;
    var accum = 0;
    for (var i = 0; i < candidates.length; i++) {
      accum += teamWeights[candidates[i]];
      if (r <= accum) return candidates[i];
    }
    return candidates[candidates.length - 1];
  };
})();