/*
 * witch.js - Witch (Ye Zhiqiu) AI
 *
 * v9 design:
 *   - 还魂 (revive): 2 uses total. True scarcity — save who, when?
 *   - 缚魂 (bind soul): FREE, no cooldown, 1 per night. Defensive tool.
 *   - One action per night: bind OR revive (not both)
 *   - Gentle: revives almost anyone. Bind only with a signal.
 *   - Bind is decided BEFORE wolf kill. Revive is decided AFTER.
 */

(function () {
  "use strict";

  var Game = window.Game;
  var ensureState = Game.ensureState;
  var WOLF_ROLES = GameState.WOLF_ROLES;
  var GOD_ROLES = GameState.GOD_ROLES;

  function ensureWitch(g) {
    var w = g.godSkills.witch;
    if (!w.curses) w.curses = [];
    if (!w.materials) w.materials = {};
    if (!w.potions) w.potions = {};
    if (typeof w.uses !== "number") w.uses = 0;
    if (typeof w.maxUses !== "number") w.maxUses = 2; // revive only: 2 uses
    if (typeof w.broken !== "boolean") w.broken = false;
    return w;
  }

  // ── Sense death (passive) ──
  Game.witchSenseDeath = function () {
    var g = ensureState();
    var w = ensureWitch(g);
    if (w.broken) return null;

    var lastKill = g.lastWolfKill;
    if (!lastKill || !lastKill.killed) return null;
    if (lastKill.special === "body_removed") return null;

    w.sensedDeath = lastKill.actualTarget;
    return lastKill.actualTarget;
  };

  Game.witchGetSensedDeath = function () {
    return ensureState().godSkills.witch.sensedDeath || null;
  };

  Game.witchClearSensedDeath = function () {
    var w = ensureWitch(ensureState());
    w.sensedDeath = null;
    // NOTE: silverWater is NOT cleared here. It must survive the morning
    // so the exile phase (later today) can trigger her intervention.
    w.actedTonight = false;
  };

  // Clear silverWater AFTER the exile phase resolves (next night begins).
  Game.witchClearSilverWater = function () {
    var w = ensureWitch(ensureState());
    w.silverWater = null;
  };

  // Silver-water: the person Ye Zhiqiu revived this round.
  Game.witchGetSilverWater = function () {
    var w = ensureState().godSkills.witch;
    return w ? (w.silverWater || null) : null;
  };

  // ---- Exile intervention AI ----
  // Should Ye Zhiqiu publicly protect a silver-water target about to be exiled?
  // Standing up = exposing herself as the witch.
  Game.witchShouldProtect = function (target, voteResult) {
    var g = ensureState();
    if (!g.alive["ye_zhiqiu"]) return false;
    if (!target) return false;
    var w = ensureWitch(g);
    if (w.silverWater !== target) return false;
    if (Game.witchIsExposed()) return true;

    // She already invested a revive in this person — she values their life.
    // Base willingness to protect (then modified by situation).
    var chance = 0.30;
    var KEY_ROLES = ["fang_heng", "lin_xiaoman", "chen_mo"];
    if (KEY_ROLES.indexOf(target) !== -1) chance += 0.35;
    else if (target === "su_wan" || target === "jiang_bai" || target === "shen_shen") chance += 0.20;

    // Her veto only matters if the vote is close (her 3 votes can flip it).
    var margin = voteResult.votesFor - voteResult.votesAgainst;
    if (margin <= 2) chance += 0.25;
    else chance -= 0.15;  // landslide — no point exposing herself

    // Self-preservation: exposure makes her a wolf priority tonight.
    var wolvesLeft = 0;
    Game.activeList().forEach(function (cid) {
      if (WOLF_ROLES.indexOf(Game.roleOf(cid)) !== -1) wolvesLeft += 1;
    });
    if (wolvesLeft >= 3) chance -= 0.20;
    if (wolvesLeft <= 1) chance += 0.15;

    chance = Math.max(0.10, Math.min(0.90, chance));
    return Math.random() < chance;
  };

  // Her opposition carries moral weight (3 votes when she stands up).
  Game.witchProtectVoteWeight = function () { return 3; };

  // Clear all soul_bound flags (called at morning transition, daily reset)
  // [v9.5.3] clearSoulBounds clears the soul_bound FLAG (effect expires at dawn)
  // but does NOT clear lastBoundTarget. That persists so the witch cannot bind
  // the same person again the following night.
  Game.clearSoulBounds = function () {
    var g = ensureState();
    if (!g.flags) return;
    var keys = Object.keys(g.flags);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf("soul_bound_") === 0) {
        delete g.flags[keys[i]];
      }
    }
  };

  // ── Bind Soul (缚魂) – FREE, 1 per night, blocks target's night action ──
  Game.witchBindSoul = function (targetId) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (!g.alive[targetId]) return { ok: false, reason: "target_dead" };
    if (targetId === "ye_zhiqiu") return { ok: false, reason: "cannot_bind_self" };
    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: "target_exiled" };
    if (w.actedTonight) return { ok: false, reason: "already_acted" };
    // NOTE: bind does NOT consume revive uses (w.uses)

    w.actedTonight = true;
    w.curses.push({ target: targetId, type: "bind_soul", day: g.day });
    g.flags["soul_bound_" + targetId] = true;
    // [v9.5.3] Track last bound target to prevent consecutive binds
    w.lastBoundTarget = targetId;

    return { ok: true, reason: "bound", target: targetId };
  };

  Game.isSoulBound = function (charId) {
    return !!ensureState().flags["soul_bound_" + charId];
  };

  // ── Revive (还魂) – 2 uses total ──
  Game.witchRevive = function (targetId, witnessed) {
    var g = ensureState();
    var w = ensureWitch(g);

    if (w.broken || w.uses >= w.maxUses) return { ok: false, reason: "no_uses" };
    if (g.alive[targetId]) return { ok: false, reason: "alive" };
    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: "target_exiled" };

    // Guard collision: knight guard + witch revive = target dies anyway
    if (typeof Game.knightIsGuarding === "function" && Game.knightIsGuarding(targetId)) {
      w.actedTonight = true;
      w.uses += 1;
      return { ok: false, reason: "guarded_collision" };
    }

    if (w.actedTonight) return { ok: false, reason: "already_acted" };

    w.actedTonight = true;
    w.uses += 1;
    Game.revive(targetId);

    if (!w.revivedTargets) w.revivedTargets = [];
    w.revivedTargets.push(targetId);
    w.sensedDeath = null;
    w.silverWater = targetId;

    if (witnessed) Game.revealInfo("ye_zhiqiu", "witch_exposed");

    return { ok: true, reason: "ok", usesLeft: w.maxUses - w.uses };
  };

  // ── Scoring: who to bind tonight (decided BEFORE wolf kill) ──
  // Ye Zhiqiu binds based on daytime observations — who felt "dangerous"
  Game.witchScoreBind = function (targetId) {
    var g = ensureState();
    var score = 0;

    // [v9.5.1] Self-stab suspect: she recognized the self-inflicted wound.
    if (typeof Game.witchSelfStabSuspect === "function" && Game.witchSelfStabSuspect(targetId)) {
      score += 40;  // she knows this wolf faked death
    }

    // Check if Fang Heng shared hostile info about this person (gold-water)
    var shared = g.godSkills.prophet.sharedWith;
    if (shared && shared["ye_zhiqiu"]) {
      for (var i = 0; i < shared["ye_zhiqiu"].length; i++) {
        if (shared["ye_zhiqiu"][i].infoTarget === targetId && shared["ye_zhiqiu"][i].result === "hostile") {
          score += 30; // prophet confirmed hostile — strong signal
        }
      }
    }

    // Day events: who behaved dangerously today?
    var events = Game.getEventsInvolving(targetId, g.day);
    for (var j = 0; j < events.length; j++) {
      var e = events[j];
      // Wolf tell observed by Ye Zhiqiu
      if (e.target === targetId && (e.type === 'observation' || e.type === 'suspicion')) {
        score += Math.floor(e.weight / 2);
      }
    }

    // Her personal unease map (from character interactions)
    var uneaseMap = {
      zhou_yang: 5,
      zhao_mingcheng: 8,   // she has bad feeling about him
      gu_yan: 5,
      shen_shen: 3,
      fang_heng: 2,        // slight unease but not much
      chen_mo: 0,
      su_wan: 0,
      jiang_bai: 0,
      zheng_shoushan: 0,
      tang_xiaotang: 0,
      lin_xiaoman: 0
    };
    score += (uneaseMap[targetId] || 0);

    score += Math.floor(Math.random() * 5);
    return score;
  };

  // ── AI: get bind target (decided before wolf kill) ──
  Game.witchAIGetBindTarget = function () {
    var g = ensureState();
    if (!g.alive["ye_zhiqiu"]) return null;

    var w = ensureWitch(g);
    var candidates = Game.activeList().filter(function (c) {
      // [v9.5.3] Cannot bind the same person two nights in a row
      if (w.lastBoundTarget && c === w.lastBoundTarget) return false;
      return c !== "ye_zhiqiu" && c !== "chen_mo"; // never bind Chen Mo
    });
    if (!candidates.length) return null;

    var best = null, bestScore = 0;
    candidates.forEach(function (c) {
      var s = Game.witchScoreBind(c);
      if (s > bestScore) { bestScore = s; best = c; }
    });

    // Bind threshold: 20 (needs prophet confirmation or strong day events)
    if (best && bestScore >= 20) return best;
    return null;
  };

  // ── AI: decide bind BEFORE wolf kill ──
  // Returns { action: "bind", target } or null (save action for revive)
  Game.witchAIDecidePreKill = function () {
    var g = ensureState();
    if (!g.alive["ye_zhiqiu"]) return null;

    var w = ensureWitch(g);
    if (w.actedTonight) return null;

    var bindTarget = Game.witchAIGetBindTarget();
    if (bindTarget) {
      // She feels strongly enough to bind tonight
      // But: if she has 0 revive uses left, she's more willing to bind
      // If she has revive uses, she might prefer to save action for revive
      var reviveUses = w.maxUses - w.uses;

      // 60% chance to bind if she has a target (she can't just wait and hope)
      // Higher if she's out of revive uses
      var bindChance = reviveUses > 0 ? 0.6 : 0.9;
      if (Math.random() < bindChance) {
        return { action: "bind", target: bindTarget };
      }
    }

    return null;
  };

  // ── AI: decide revive AFTER wolf kill ──
  Game.witchAIDecideRevive = function () {
    var g = ensureState();
    if (!g.alive["ye_zhiqiu"]) return null;

    var w = ensureWitch(g);
    if (w.broken || w.uses >= w.maxUses) return null;
    if (w.actedTonight) return null;

    var sensed = Game.witchGetSensedDeath();
    if (!sensed) return null;

    // Ye Zhiqiu is gentle — she saves almost everyone
    // Only hesitates if: only 1 use left AND the dead person is someone she distrusts
    var reviveUses = w.maxUses - w.uses;
    if (reviveUses === 1) {
      // Last revive — 70% chance to save (she might hold it)
      if (Math.random() < 0.3) return null;
    }

    // She saves. She doesn't judge.
    return { action: "revive", target: sensed };
  };

  // ── Legacy: unified night action (for compatibility) ──
  // Tries bind first, then revive
  Game.witchAIDecideNightAction = function () {
    var g = ensureState();
    if (!g.alive["ye_zhiqiu"]) return null;

    var w = ensureWitch(g);
    if (w.actedTonight) return null;

    // Try bind first
    var preKill = Game.witchAIDecidePreKill();
    if (preKill) return preKill;

    // Then revive
    return Game.witchAIDecideRevive();
  };

  // ── Utility ──
  Game.witchUses = function () { return ensureState().godSkills.witch.uses; };
  Game.witchRemaining = function () {
    var w = ensureState().godSkills.witch;
    return w.broken ? 0 : (w.maxUses - w.uses);
  };
  Game.witchBroken = function () { return !!ensureState().godSkills.witch.broken; };
  Game.witchIsExposed = function () { return Game.hasRevealed("ye_zhiqiu", "witch_exposed"); };

  // ── Materials & potions (mortal skills) ──
  Game.witchAddMaterial = function (materialId) {
    var w = ensureWitch(ensureState());
    w.materials[materialId] = (w.materials[materialId] || 0) + 1;
  };

  Game.witchHasMaterial = function (materialId) {
    return !!(ensureState().godSkills.witch.materials || {})[materialId];
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
    if (!Game.witchCanCraft(potionId)) return { ok: false, reason: "no_materials" };
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
    return !!(ensureState().godSkills.witch.potions || {})[potionId];
  };

  Game.witchUsePotion = function (potionId, targetId) {
    var g = ensureState();
    var w = ensureWitch(g);
    if (!w.potions || !w.potions[potionId]) return { ok: false, reason: "no_potion" };
    if (!GameState.WITCH_POTIONS || !GameState.WITCH_POTIONS[potionId]) return { ok: false, reason: "unknown_potion" };

    var potion = GameState.WITCH_POTIONS[potionId];
    w.potions[potionId] -= 1;
    if (w.potions[potionId] <= 0) delete w.potions[potionId];

    if (!g.flags) g.flags = {};
    g.flags["potion_effect_" + targetId] = potion.effect;

    return { ok: true, target: targetId, effect: potion.effect, name: potion.name };
  };

  Game.witchPotionEffect = function (targetId) {
    var g = ensureState();
    if (!g.flags) return null;
    return g.flags["potion_effect_" + targetId] || null;
  };
})();
