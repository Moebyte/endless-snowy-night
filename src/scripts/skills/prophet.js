/*
 * prophet.js - Prophet (Fang Heng) AI: check + aura + share info + AI strategy
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
  var GOD_ROLES = ['prophet', 'witch', 'knight', 'magician'];

  function ensureProphet(g) {
    var p = g.godSkills.prophet;
    if (!p.checks) p.checks = [];
    if (!p.sharedWith) p.sharedWith = {};
    return p;
  }

  Game.prophetAICheckNight = function () {
    var g = ensureState();
    var pr = ensureProphet(g);

    var enemyChecks = pr.checks.filter(function (c) {
      return c.alignment === 'enemy';
    });

    if (enemyChecks.length === 0) return null;

    var candidates = [];
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === 'fang_heng') return;
      if (WOLF_ROLES.indexOf(Game.roleOf(charId)) !== -1) return;
      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    var auraHolders = candidates.filter(function (c) { return Game.prophetSenseAura(c); });
    if (auraHolders.length > 0) {
      return auraHolders[Math.floor(Math.random() * auraHolders.length)];
    }

    var silverWater = candidates.filter(function (c) {
      var w = g.godSkills.witch;
      return w && w.revivedTargets && w.revivedTargets.indexOf(c) !== -1;
    });

    if (silverWater.length > 0) {
      return silverWater[Math.floor(Math.random() * silverWater.length)];
    }

    return null;
  };

  Game.prophetAIShareEnemyInfo = function () {
    var g = ensureState();
    if (!g.alive['fang_heng']) return null;
    if (!Game.prophetShouldShare()) return null;

    var pr = ensureProphet(g);
    var enemyChecks = pr.checks.filter(function (c) {
      return c.alignment === 'enemy';
    });

    if (enemyChecks.length === 0) return null;

    var results = [];
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === 'fang_heng') return;
      // Only share with aura-bearing allies
      if (!Game.prophetSenseAura(charId)) return;

      for (var i = 0; i < enemyChecks.length; i++) {
        var infoTarget = enemyChecks[i].target;
        if (g.alive[infoTarget] && !Game.prophetReceivedInfo(charId, infoTarget)) {
          var result = Game.prophetShareInfo(charId, infoTarget);
          results.push({ target: charId, infoTarget: infoTarget, result: result });
          break; // one piece of info per recipient
        }
      }
    });

    return results.length > 0 ? results : null;
  };

  Game.prophetAIShareAllyInfo = function () {
    var g = ensureState();
    if (!g.alive['fang_heng']) return null;
    if (!Game.prophetShouldShare()) return null;

    var pr = ensureProphet(g);
    var allyChecks = pr.checks.filter(function (c) {
      return c.alignment === 'ally';
    });

    if (allyChecks.length === 0) return null;

    var results = [];
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === 'fang_heng') return;
      if (!Game.prophetSenseAura(charId)) return;

      for (var i = 0; i < allyChecks.length; i++) {
        var infoTarget = allyChecks[i].target;
        if (g.alive[infoTarget] && !Game.prophetReceivedInfo(charId, infoTarget)) {
          var result = Game.prophetShareInfo(charId, infoTarget);
          results.push({ target: charId, infoTarget: infoTarget, alignment: 'ally', result: result });
          break;
        }
      }
    });

    return results.length > 0 ? results : null;
  };

  Game.isGoldWater = function (charId) {
    var g = ensureState();
    var shared = g.godSkills.prophet.sharedWith;
    if (!shared || !shared['ye_zhiqiu']) return false;

    for (var i = 0; i < shared['ye_zhiqiu'].length; i++) {
      if (shared['ye_zhiqiu'][i].infoTarget === charId && shared['ye_zhiqiu'][i].alignment === 'ally') {
        return true;
      }
    }
    return false;
  };

  Game.prophetCheck = function (targetId) {
    var g = ensureState();
    var pr = ensureProphet(g);

    var targetRole = Game.roleOf(targetId);
    var pool;

    if (targetId === 'chen_mo' && Game.hasFlag('loop_awakened')) {
      pool = Game.PROPHET_TEXTS.memory_user;
    } else if (targetId === 'ye_zhiqiu' && Game.witchBroken()) {
      pool = Game.PROPHET_TEXTS.broken_witch;
    } else if (targetId === 'chen_mo' || targetId === 'zheng_shoushan') {
      pool = Game.PROPHET_TEXTS.villager_guilty;
    } else {
      pool = Game.PROPHET_TEXTS[targetRole] || Game.PROPHET_TEXTS.villager_calm;
    }

    if (!pool) pool = ['You sense something faint.'];
    var text = pool[Math.floor(Math.random() * pool.length)];

    var hiddenWolf = targetRole === 'hidden_wolf';
    var isWolf = WOLF_ROLES.indexOf(targetRole) !== -1;
    var alignment = (isWolf && !hiddenWolf) ? 'enemy' : 'ally';

    var record = {
      target: targetId,
      text: text,
      alignment: alignment,
      day: g.day,
      loop: g.loop
    };

    pr.checks.push(record);

    return { ok: true, perception: text, alignment: alignment, target: targetId };
  };

  Game.prophetResults = function () {
    return ensureProphet(ensureState()).checks;
  };

  Game.prophetLastResult = function (targetId) {
    var checks = ensureProphet(ensureState()).checks;
    for (var i = checks.length - 1; i >= 0; i--) {
      if (checks[i].target === targetId) return checks[i];
    }
    return null;
  };

  // Aura: gods (and hidden wolf hiding among gods) carry a perceptible aura
  Game.prophetSenseAura = function (targetId) {
    var g = ensureState();
    if (!g.alive[targetId]) return false;
    var role = Game.roleOf(targetId);
    if (GOD_ROLES.indexOf(role) !== -1) return true;
    // Hidden wolf masquerades with an aura to blend in with gods
    if (role === 'hidden_wolf') return true;
    return false;
  };

  Game.prophetAuraText = function (targetId) {
    var role = Game.roleOf(targetId);
    var pool;

    if (Game.prophetSenseAura(targetId)) {
      pool = Game.AURA_TEXTS ? Game.AURA_TEXTS.has_aura : null;
    } else if (role === 'hidden_wolf') {
      pool = Game.AURA_TEXTS ? Game.AURA_TEXTS.hidden_wolf_aura : null;
    } else {
      pool = Game.AURA_TEXTS ? Game.AURA_TEXTS.no_aura : null;
    }

    if (!pool) pool = ['You sense nothing in particular.'];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  Game.prophetShouldHide = function () {
    var g = ensureState();
    if (!g.alive['fang_heng']) return false;

    var lastKill = g.lastWolfKill;
    if (!lastKill || !lastKill.killed) return false;

    var actualDead = lastKill.actualTarget;
    if (!actualDead) return false;

    // If a god role was just killed, the prophet should lay low
    if (!g.alive[actualDead]) {
      var deadRole = Game.roleOf(actualDead);
      if (GOD_ROLES.indexOf(deadRole) !== -1) {
        return true;
      }
    }

    return false;
  };

  Game.prophetShouldShare = function () {
    return !Game.prophetShouldHide();
  };

  Game.prophetAIGetCheckTarget = function () {
    var g = ensureState();
    if (!g.alive['fang_heng']) return null;

    var pr = ensureProphet(g);
    var candidates = [];

    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === 'fang_heng') return;

      var alreadyChecked = pr.checks.some(function (c) {
        return c.target === charId;
      });
      if (alreadyChecked) return;

      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    // Prefer targets without an aura (possible wolves)
    var noAura = candidates.filter(function (c) { return !Game.prophetSenseAura(c); });
    var pool = noAura.length > 0 ? noAura : candidates;

    // First, anyone already flagged as suspicious
    var suspects = pool.filter(function (c) { return Game.hasFlag('suspect_' + c); });
    if (suspects.length > 0) return suspects[Math.floor(Math.random() * suspects.length)];

    // Then, anyone showing suspicious behavior
    var behaviorSus = pool.filter(function (c) {
      return Game.hasFlag('suspicious_behavior_' + c);
    });
    if (behaviorSus.length > 0) return behaviorSus[Math.floor(Math.random() * behaviorSus.length)];

    // Otherwise pick from the untested pool, weighting toward fewest ally-results so far
    var allyCount = pr.checks.filter(function (c) { return c.alignment === 'ally'; }).length;

    // Default: random from pool (ally count recorded for future weighting)
    void allyCount;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  Game.prophetShareInfo = function (targetId, infoTargetId) {
    var g = ensureState();
    if (!g.alive['fang_heng']) return { ok: false, reason: 'prophet_dead' };
    if (!g.alive[targetId]) return { ok: false, reason: 'target_dead' };

    var pr = ensureProphet(g);

    var record = null;
    for (var i = pr.checks.length - 1; i >= 0; i--) {
      if (pr.checks[i].target === infoTargetId) {
        record = pr.checks[i];
        break;
      }
    }

    if (!record) return { ok: false, reason: 'no_info' };

    if (!pr.sharedWith[targetId]) pr.sharedWith[targetId] = [];
    pr.sharedWith[targetId].push({
      infoTarget: infoTargetId,
      alignment: record.alignment,
      day: g.day,
      loop: g.loop
    });

    var targetRole = Game.roleOf(targetId);
    if (WOLF_ROLES.indexOf(targetRole) !== -1) {
      return { ok: true, reason: 'leaked', leaked: true };
    }

    return { ok: true, reason: 'shared', leaked: false };
  };

  Game.prophetReceivedInfo = function (targetId, infoTargetId) {
    var g = ensureState();
    var shared = g.godSkills.prophet.sharedWith;
    if (!shared || !shared[targetId]) return null;

    for (var i = shared[targetId].length - 1; i >= 0; i--) {
      if (shared[targetId][i].infoTarget === infoTargetId) {
        return shared[targetId][i];
      }
    }
    return null;
  };
})();