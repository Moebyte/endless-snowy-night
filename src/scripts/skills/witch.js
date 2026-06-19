/*
 * witch.js - Witch (Ye Zhiqiu) AI: sense death + save/curse + potions + AI
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

  // AI scoring weights for save decisions
  Game.WITCH_AI_WEIGHTS = {
    chenmo_proximity: 1.0,
    role_value: 1.0,
    threat: 1.2,
    isolation: 1.0
  };

  function ensureWitch(g) {
    var w = g.godSkills.witch;
    if (!w.curses) w.curses = [];
    if (!w.materials) w.materials = {};
    if (!w.potions) w.potions = {};
    if (typeof w.uses !== 'number') w.uses = 0;
    if (typeof w.maxUses !== 'number') w.maxUses = 3;
    if (typeof w.broken !== 'boolean') w.broken = false;
    return w;
  }

  Game.witchSenseDeath = function () {
    var g = ensureState();
    var w = ensureWitch(g);
    if (w.broken) return null;

    var lastKill = g.lastWolfKill;
    if (!lastKill || !lastKill.killed) return null;
    if (lastKill.special === 'body_removed') return null;

    w.sensedDeath = lastKill.actualTarget;
    return lastKill.actualTarget;
  };

  Game.witchGetSensedDeath = function () {
    var w = ensureState().godSkills.witch;
    return w.sensedDeath || null;
  };

  Game.witchClearSensedDeath = function () {
    var w = ensureWitch(ensureState());
    w.sensedDeath = null;
    w.actedTonight = false;
  };

  Game.witchScoreSave = function (targetId) {
    var g = ensureState();
    var score = 0;
    var w = Game.WITCH_AI_WEIGHTS;

    // Proximity to Chen Mo (protagonist) makes a target worth saving
    var proximityMap = {
      su_wan: 10, jiang_bai: 8, zheng_shoushan: 6,
      lin_xiaoman: 5, fang_heng: 5, shen_shen: 4,
      ye_zhiqiu: 3, gu_yan: 3, zhou_yang: 1,
      tang_xiaotang: 1, zhao_mingcheng: 1
    };
    score += (proximityMap[targetId] || 3) * w.chenmo_proximity;

    var role = Game.roleOf(targetId);
    if (GOD_ROLES.indexOf(role) !== -1) {
      score += 9 * w.role_value;
    } else if (targetId === 'zheng_shoushan' || targetId === 'chen_mo') {
      score += 5 * w.role_value;
    } else {
      score += 3 * w.role_value;
    }

    // Exposed/known threats are more valuable to keep alive
    if (Game.hasRevealed(targetId, 'identity_exposed')) {
      score += 4 * w.threat;
    }

    // Random variance
    score *= (0.85 + Math.random() * 0.3);
    return Math.round(score);
  };

  Game.witchScoreCurse = function (targetId) {
    var g = ensureState();
    var score = 0;
    var w = Game.WITCH_AI_WEIGHTS;

    var role = Game.roleOf(targetId);
    if (WOLF_ROLES.indexOf(role) !== -1) {
      score += 15 * w.threat;
    } else {
      score += 3;
    }

    // Suspect-flagged characters are prime curse targets
    if (Game.hasFlag('suspect_' + targetId)) {
      score += 8 * w.threat;
    }
    if (Game.hasFlag('suspicious_behavior_' + targetId)) {
      score += 5 * w.threat;
    }

    // Isolated characters are safer curse targets (less fallout)
    if (Game.hasRevealed(targetId, 'identity_exposed')) {
      score += 4 * w.isolation;
    }

    score *= (0.85 + Math.random() * 0.3);
    return Math.round(score);
  };

  Game.witchAIShouldSave = function (targetId) {
    var g = ensureState();
    if (!g.alive[targetId]) return false;
    // Always consider saving a sensed death if the target is valuable
    var score = Game.witchScoreSave(targetId);
    return score >= 200;
  };

  Game.witchAIGetCurseTarget = function () {
    var g = ensureState();
    var candidates = [];

    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === 'ye_zhiqiu') return;
      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    var best = null;
    var bestScore = 0;
    candidates.forEach(function (c) {
      var s = Game.witchScoreCurse(c);
      if (s > bestScore) { bestScore = s; best = c; }
    });

    return bestScore >= 220 ? best : null;
  };

  // Main witch AI: decide between save, curse, or pass for the night
  Game.witchAIDecide = function () {
    if (Game.witchRemaining() <= 0) return { action: 'pass' };

    var g = ensureState();

    var saveTarget = null;
    var saveScore = 0;
    var curseTarget = null;
    var curseScore = 0;

    // Consider saving the sensed death
    var sensed = Game.witchSenseDeath();
    if (sensed && Game.witchAIShouldSave(sensed)) {
      saveTarget = sensed;
      saveScore = Game.witchScoreSave(sensed);
    }

    curseTarget = Game.witchAIGetCurseTarget();
    if (curseTarget) {
      curseScore = Game.witchScoreCurse(curseTarget);
    }

    var saveMargin = saveTarget ? (saveScore - 200) / 200 : -1;
    var curseMargin = curseTarget ? (curseScore - 220) / 220 : -1;

    if (saveMargin < 0 && curseMargin < 0) {
      return { action: 'pass' };
    }

    if (saveMargin >= curseMargin) {
      return { action: 'save', target: saveTarget, score: saveScore };
    } else {
      return { action: 'curse', target: curseTarget, score: curseScore };
    }
  };

  Game.witchUses = function () {
    return ensureState().godSkills.witch.uses;
  };

  Game.witchRemaining = function () {
    var w = ensureState().godSkills.witch;
    return w.broken ? 0 : (w.maxUses - w.uses);
  };

  Game.witchBroken = function () {
    return !!ensureState().godSkills.witch.broken;
  };

  Game.witchCurse = function (targetId) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: 'broken' };
    if (w.actedTonight) return { ok: false, reason: 'already_acted' };

    w.actedTonight = true;
    w.uses += 1;
    w.curses.push({ target: targetId, type: 'curse' });
    Game.kill(targetId);

    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }

    return { ok: true, reason: 'ok' };
  };

  Game.witchRevive = function (targetId, witnessed) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: 'broken' };
    if (g.alive[targetId]) return { ok: false, reason: 'alive' };

    // Guard collision: if the knight is guarding the target, the revive fizzles
    if (typeof Game.knightIsGuarding === 'function' && Game.knightIsGuarding(targetId)) {
      w.actedTonight = true;
      w.uses += 1;
      return { ok: false, reason: 'guarded' };
    }

    if (w.actedTonight) return { ok: false, reason: 'already_acted' };

    w.actedTonight = true;
    w.uses += 1;
    Game.revive(targetId);

    if (!w.revivedTargets) w.revivedTargets = [];
    w.revivedTargets.push(targetId);
    w.sensedDeath = null;

    if (witnessed) {
      Game.revealInfo('ye_zhiqiu', 'witch_exposed');
    }

    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }

    return { ok: true, reason: 'ok' };
  };

  Game.witchIsExposed = function () {
    return Game.hasRevealed('ye_zhiqiu', 'witch_exposed');
  };

  Game.witchHeal = function (targetId) {
    var g = ensureState();
    if (!g.pursuit || !g.pursuit.playerInjured) return { ok: false, reason: 'not_injured' };

    g.pursuit.playerInjured = false;
    Game.revealInfo('ye_zhiqiu', 'witch_exposed');
    return { ok: true, reason: 'exposed' };
  };

  Game.witchAddMaterial = function (materialId) {
    var g = ensureState();
    var w = ensureWitch(g);
    w.materials[materialId] = (w.materials[materialId] || 0) + 1;
  };

  Game.witchHasMaterial = function (materialId) {
    var w = ensureState().godSkills.witch;
    return !!(w.materials && w.materials[materialId]);
  };

  Game.witchCanCraft = function (potionId) {
    var w = ensureState().godSkills.witch;
    if (!GameState.WITCH_POTIONS || !GameState.WITCH_POTIONS[potionId]) return false;
    var recipe = GameState.WITCH_POTIONS[potionId].recipe;
    if (!w.materials) return false;
    for (var mat in recipe) {
      if (recipe.hasOwnProperty(mat) && (w.materials[mat] || 0) < recipe[mat]) return false;
    }
    return true;
  };

  Game.witchCraftPotion = function (potionId) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (!Game.witchCanCraft(potionId)) return { ok: false, reason: 'no_materials' };

    var recipe = GameState.WITCH_POTIONS[potionId].recipe;
    for (var mat in recipe) {
      if (recipe.hasOwnProperty(mat)) {
        w.materials[mat] -= recipe[mat];
        if (w.materials[mat] <= 0) delete w.materials[mat];
      }
    }

    w.potions[potionId] = (w.potions[potionId] || 0) + 1;
    return { ok: true, potion: potionId };
  };

  Game.witchHasPotion = function (potionId) {
    var w = ensureState().godSkills.witch;
    return !!(w.potions && w.potions[potionId]);
  };

  Game.witchUsePotion = function (potionId, targetId) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (!w.potions || !w.potions[potionId]) return { ok: false, reason: 'no_potion' };
    if (!GameState.WITCH_POTIONS || !GameState.WITCH_POTIONS[potionId]) return { ok: false, reason: 'unknown_potion' };

    var potion = GameState.WITCH_POTIONS[potionId];
    w.potions[potionId] -= 1;
    if (w.potions[potionId] <= 0) delete w.potions[potionId];

    // Record the active effect on the target for later resolution
    if (!g.flags) g.flags = {};
    var effectKey = 'potion_effect_' + targetId;
    g.flags[effectKey] = potion.effect;

    return { ok: true, target: targetId, effect: potion.effect, name: potion.name };
  };

  Game.witchPotionEffect = function (targetId) {
    var g = ensureState();
    if (!g.flags) return null;
    var effectKey = 'potion_effect_' + targetId;
    return g.flags[effectKey] || null;
  };
})();