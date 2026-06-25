/*
 * prophet.js - Prophet (Fang Heng) AI
 *
 * v9 design:
 *   - Check target: driven by day events (who behaves abnormally)
 *   - Check result: gold-water 3-tier (friendly / neutral / hostile)
 *   - Hidden wolf always reads friendly/neutral. Chen Mo always neutral.
 *   - Share info: based on trust from daytime interactions (NOT aura sensing)
 *   - Fang Heng doesn't know who has powers — he shares with people he trusts
 *   - Hunter ability: 2 bullets, passive counter-kill + active shoot
 */

(function () {
  "use strict";

  var Game = window.Game;
  var ensureState = Game.ensureState;

  Game.PROPHET_TEXTS = {
    friendly_pool: [
      "气息像春日暖阳晒过的棉被，柔软而安心。",
      "气息像山涧溪水，清澈见底。",
      "气息像篝火余烬，温和平静。",
      "气息像雨后泥土，干净而熟悉。"
    ],
    neutral_pool: [
      "气息像雾中湖面，看不真切。",
      "气息像深秋落叶，随风而走，没有方向。",
      "气息像旧书灰尘，掩着不愿示人的字。",
      "气息像将雨未雨的天空，沉闷而难测。"
    ],
    hostile_pool: [
      "气息像深潭暗流，冰冷刺骨。",
      "气息像锈蚀的铁器，带着血的腥味。",
      "气息像冬夜里的刀锋，寒意逼人。",
      "气息像腐木下的蛆虫，藏不住的恶。"
    ]
  };

  var WOLF_ROLES = GameState.WOLF_ROLES;
  var GOD_ROLES = GameState.GOD_ROLES;

  function ensureProphet(g) {
    var p = g.godSkills.prophet;
    if (!p.checks) p.checks = [];
    if (!p.sharedWith) p.sharedWith = {};
    return p;
  }

  // ── Core check: resolve three-tier result ──
  Game.prophetCheck = function (targetId) {
    var g = ensureState();
    var pr = ensureProphet(g);

    if (!g.alive[targetId]) return null;
    if (targetId === "fang_heng") return null;
    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return null;

    var role = Game.roleOf(targetId);
    var result;

    // Chen Mo is always neutral
    if (targetId === "chen_mo") {
      result = "neutral";
    }
    // Hidden wolf: always friendly or neutral
    else if (role === "hidden_wolf") {
      result = Math.random() < 0.7 ? "friendly" : "neutral";
    }
    // Other wolves: biased toward hostile
    else if (WOLF_ROLES.indexOf(role) !== -1) {
      var recentKill = g.lastWolfKill;
      if (recentKill && recentKill.killed && recentKill.day === g.day) {
        result = "hostile";
      } else if (Math.random() < 0.6) {
        result = "hostile";
      } else {
        result = "neutral";
      }
    }
    // Gods: usually friendly or neutral
    else if (GOD_ROLES.indexOf(role) !== -1) {
      if (Game.hasFlag("god_aggressive_" + targetId)) {
        result = Math.random() < 0.5 ? "hostile" : "neutral";
      } else {
        result = Math.random() < 0.6 ? "friendly" : "neutral";
      }
    }
    // Villagers: usually friendly
    else {
      if (Game.hasBackstory(targetId)) {
        result = Math.random() < 0.5 ? "neutral" : "friendly";
      } else {
        result = Math.random() < 0.7 ? "friendly" : "neutral";
      }
    }

    pr.checks.push({
      target: targetId,
      result: result,
      day: g.day,
      loop: g.loop
    });

    return { target: targetId, result: result, alignment: result };
  };

  Game.prophetCheckText = function (targetId) {
    var g = ensureState();
    var pr = ensureProphet(g);
    var check = null;
    for (var i = pr.checks.length - 1; i >= 0; i--) {
      if (pr.checks[i].target === targetId) { check = pr.checks[i]; break; }
    }
    if (!check) return "你还没有查验过此人。";

    var pool;
    if (check.result === "friendly") pool = Game.PROPHET_TEXTS.friendly_pool;
    else if (check.result === "neutral") pool = Game.PROPHET_TEXTS.neutral_pool;
    else pool = Game.PROPHET_TEXTS.hostile_pool;

    return pool[Math.floor(Math.random() * pool.length)] +
      "\n\n（金水·" + (check.result === "friendly" ? "澄澈" : check.result === "neutral" ? "浊" : "暗涌") + "）";
  };

  // ── Share info ──
  Game.prophetShareInfo = function (targetId, infoTargetId) {
    var g = ensureState();
    if (!g.alive["fang_heng"]) return { ok: false, reason: "prophet_dead" };
    if (!g.alive[targetId]) return { ok: false, reason: "target_dead" };

    var pr = ensureProphet(g);
    var record = null;
    for (var i = pr.checks.length - 1; i >= 0; i--) {
      if (pr.checks[i].target === infoTargetId) { record = pr.checks[i]; break; }
    }
    if (!record) return { ok: false, reason: "no_info" };

    if (!pr.sharedWith[targetId]) pr.sharedWith[targetId] = [];
    pr.sharedWith[targetId].push({
      infoTarget: infoTargetId,
      result: record.result,
      day: g.day,
      loop: g.loop
    });

    var targetRole = Game.roleOf(targetId);
    if (WOLF_ROLES.indexOf(targetRole) !== -1) {
      return { ok: true, reason: "leaked", leaked: true };
    }
    return { ok: true, reason: "shared", leaked: false };
  };

  Game.prophetReceivedInfo = function (targetId, infoTargetId) {
    var g = ensureState();
    var shared = g.godSkills.prophet.sharedWith;
    if (!shared || !shared[targetId]) return null;
    for (var i = shared[targetId].length - 1; i >= 0; i--) {
      if (shared[targetId][i].infoTarget === infoTargetId) return shared[targetId][i];
    }
    return null;
  };

  // ── Should Fang Heng hide? (if a god just died) ──
  Game.prophetShouldHide = function () {
    var g = ensureState();
    if (!g.alive["fang_heng"]) return false;
    var lastKill = g.lastWolfKill;
    if (!lastKill || !lastKill.killed) return false;
    var actualDead = lastKill.actualTarget;
    if (!actualDead) return false;
    if (!g.alive[actualDead]) {
      var deadRole = Game.roleOf(actualDead);
      if (GOD_ROLES.indexOf(deadRole) !== -1) return true;
    }
    return false;
  };

  Game.prophetShouldShare = function () {
    var g = ensureState();
    var pr = ensureProphet(g);
    if (pr.exposed) return false;
    return !Game.prophetShouldHide();
  };

  // ── AI: who to check tonight? ──
  // Driven by day events: check people who behaved abnormally today
  Game.prophetAIGetCheckTarget = function () {
    var g = ensureState();
    if (!g.alive["fang_heng"]) return null;
    // An exiled character is locked in the cellar and exits all interactions.
    if (typeof Game.isExiled === 'function' && Game.isExiled('fang_heng')) return null;
    var pr = ensureProphet(g);

    // Candidates: alive, not Fang Heng, not already checked
    var candidates = [];
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (charId === "fang_heng") return;
      var alreadyChecked = pr.checks.some(function (c) { return c.target === charId; });
      if (alreadyChecked) return;
      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    // Score candidates based on today's day events
    // Fang Heng is a cop — he notices abnormal behavior
    var scored = candidates.map(function (cid) {
      var score = 5; // base
      var events = Game.getEventsInvolving(cid, g.day);

      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        // B-type wolf tell: Fang Heng notices these strongly
        if (e.target === cid && (e.type === 'observation' || e.type === 'suspicion')) {
          score += e.weight;
        }
        // Conflict starter: who initiated conflict today?
        if (e.a === cid && e.type === 'conflict') {
          score += Math.floor(e.weight / 2);
        }
        // Tang hint targeting this person: Fang Heng picks up on social tension
        if (e.type === 'tang_hint' && e.target === cid) {
          score += 15;
        }
      }

      // Fang Heng's cop instinct: he notices people who are too quiet or too intense
      // Simulated via day events
      score += Math.floor(Math.random() * 5);

      return { id: cid, score: score };
    });

    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored[0];

    // If someone has a notably high unease score, check them
    if (top.score >= 20) return top.id;

    // Otherwise pick randomly among unchecked (he wants to cover everyone eventually)
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // ── AI: share check results with someone Fang Heng trusts ──
  // Fang Heng doesn't know who has powers. He shares based on trust.
  Game.prophetAIShareTarget = function () {
    var g = ensureState();
    if (!g.alive["fang_heng"]) return null;
    if (!Game.prophetShouldShare()) return null;

    var pr = ensureProphet(g);

    // Must have at least one check to share
    if (!pr.checks.length) return null;

    // Prioritize sharing "hostile" results — that's actionable intel.
    // If no hostile check exists, share the most recent check (friendly/neutral
    // is still useful for building trust networks).
    var lastCheck = pr.checks[pr.checks.length - 1];
    for (var ci = pr.checks.length - 1; ci >= 0; ci--) {
      if (pr.checks[ci].result === 'hostile') {
        lastCheck = pr.checks[ci];
        break;
      }
    }

    // Who does Fang Heng trust? Based on daytime interactions.
    // He trusts people who: are calm, helped resolve conflicts, agreed with him.
    // He distrusts people who: were aggressive, evasive, or too calculating.
    var candidates = Game.activeList().filter(function (c) {
      return c !== "fang_heng";
    });

    if (!candidates.length) return null;

    // Score trust based on day events
    var scored = candidates.map(function (cid) {
      var trust = 10; // base
      var events = Game.getEventsInvolving(cid, g.day);

      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        // If this person helped resolve a conflict (was the peacemaker)
        if (e.b === cid && e.type === 'conflict') {
          trust += 8; // they were involved in a conflict — could go either way
        }
        // If this person was observed doing something suspicious — less trust
        if (e.target === cid && (e.type === 'observation' || e.type === 'suspicion')) {
          trust -= e.weight;
        }
      }

      // Fang Heng trusts people with a stable demeanor
      // Simple heuristic: villagers and gods get a small trust bonus
      var role = Game.roleOf(cid);
      if (WOLF_ROLES.indexOf(role) !== -1) {
        trust -= 10; // he doesn't know this, but their behavior is subtly off
      }

      trust += Math.floor(Math.random() * 10);
      return { id: cid, trust: trust };
    });

    scored.sort(function (a, b) { return b.trust - a.trust; });

    // Only share if the most trusted person has trust > 15
    if (scored[0] && scored[0].trust > 15) {
      var shareTo = scored[0].id;
      // [v9.4] When Fang has a "hostile" result, he doesn't just share with
      // whoever he trusts most — he shares with someone who can ACT on it.
      // Lin Xiaoman is impulsive, physical, and not afraid of confrontation.
      // Fang doesn't like her, but he's pragmatic: she's the kind of person
      // who'll actually DO something about a threat, not just nod politely.
      // He's using her as a weapon, not befriending her.
      var hasHostile = pr.checks.some(function(c) { return c.result === 'hostile'; });
      if (hasHostile && g.alive['lin_xiaoman']) {
        // He doesn't need to trust her deeply — just needs her to be alive
        // and not openly hostile toward him. Even a low trust score is fine:
        // he's not sharing a secret, he's pointing her at a target.
        shareTo = 'lin_xiaoman';
      }
      // [v9.4] Return ALL accumulated checks — Fang gives the full picture.
      return { shareTarget: shareTo, allChecks: pr.checks.slice() };
    }

    return null;
  };

  // Legacy compatibility: wrapper for old share functions
  Game.prophetAIShareHostileInfo = function () {
    var result = Game.prophetAIShareTarget();
    if (!result || !result.allChecks) return null;
    var hostile = result.allChecks.filter(function(c) { return c.result === 'hostile'; });
    if (!hostile.length) return null;
    for (var i = 0; i < hostile.length; i++) {
      Game.prophetShareInfo(result.shareTarget, hostile[i].target);
    }
    return { shareTarget: result.shareTarget, count: hostile.length };
  };

  Game.prophetAIShareFriendlyInfo = function () {
    var result = Game.prophetAIShareTarget();
    if (!result || !result.allChecks) return null;
    var friendly = result.allChecks.filter(function(c) { return c.result === 'friendly'; });
    if (!friendly.length) return null;
    for (var i = 0; i < friendly.length; i++) {
      Game.prophetShareInfo(result.shareTarget, friendly[i].target);
    }
    return { shareTarget: result.shareTarget, count: friendly.length };
  };

  // ── Hunter ability: shoot ──
  // 2 bullets total. Passive counter-kill when killed + active shoot.

  Game._prophetEnsure = ensureProphet;
})();

