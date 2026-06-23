/**
 * prophet-gun.js - Hunter abilities (shoot + counter-kill)
 * Split from prophet.js
 */
(function () {
  "use strict";
  function ensureState() {
    if (!State.variables.game) {
      State.variables.game = GameState.create();
    }
    return State.variables.game;
  }
  var Game = window.Game;

  Game.prophetShoot = function (targetId) {
    var g = ensureState();
    var p = Game._prophetEnsure(g);
    if (!p.bullets) p.bullets = 2;
    if (p.bullets <= 0) return { ok: false, reason: "no_bullets" };
    if (!g.alive["fang_heng"]) return { ok: false, reason: "fang_heng_dead" };
    if (!g.alive[targetId]) return { ok: false, reason: "target_dead" };
    if (targetId === "fang_heng") return { ok: false, reason: "cannot_shoot_self" };
    if (typeof Game.isExiled === 'function' && Game.isExiled(targetId)) return { ok: false, reason: "target_exiled" };

    p.bullets--;
    Game.kill(targetId);

    var targetRole = Game.roleOf(targetId);

    // Shooting exposes Fang Heng — gunshots are loud, everyone notices.
    // This generates a day event so all suspicion systems pick it up.
    var g2 = ensureState();
    if (!g2.dayEvents) g2.dayEvents = [];
    g2.dayEvents.push({
      day: g2.day,
      type: 'suspicion',
      a: 'fang_heng',
      b: targetId,
      target: 'fang_heng',
      observer: 'public',
      weight: 50,
      desc: 'fang_heng shot someone — everyone heard the gunshot'
    });
    p.exposed = true;  // mark: Fang Heng is exposed, future sharing is weakened
    p.refusedSurrender = true;  // Fang Heng refuses to hand over his gun

    // Refusing to surrender the gun escalates everyone's fear further.
    // This is a separate event from the gunshot — it shows Fang Heng is UNWILLING to disarm.
    g2.dayEvents.push({
      day: g2.day,
      type: 'suspicion',
      a: 'fang_heng',
      b: 'public',
      target: 'fang_heng',
      observer: 'public',
      weight: 30,
      desc: 'fang_heng refused to hand over his gun after shooting someone'
    });

    // Wolf king mutual kill: Zhou Yang takes Fang Heng with him
    if (targetRole === "wolf_king") {
      Game.kill("fang_heng");
      return {
        ok: true,
        reason: "wolf_king_mutual",
        target: targetId,
        role: targetRole,
        bulletsLeft: p.bullets,
        mutualKill: true
      };
    }

    return {
      ok: true,
      reason: "shot",
      target: targetId,
      role: targetRole,
      bulletsLeft: p.bullets
    };
  };

  // Passive: when Fang Heng is killed, he can counter-shoot
  Game.prophetCounterShoot = function (suspectId) {
    var g = ensureState();
    var p = Game._prophetEnsure(g);
    if (!p.bullets) p.bullets = 2;
    if (p.bullets <= 0) return { ok: false, reason: "no_bullets" };
    if (!suspectId || !g.alive[suspectId]) return { ok: false, reason: "no_target" };

    p.bullets--;
    Game.kill(suspectId);

    var suspectRole = Game.roleOf(suspectId);

    // Wolf king mutual kill: counter-shooting Zhou Yang triggers mutual death
    if (suspectRole === "wolf_king") {
      // Fang Heng is already dead (that is why he counter-shoots), so only mark it
      return {
        ok: true,
        reason: "counter_shot_mutual",
        target: suspectId,
        role: suspectRole,
        bulletsLeft: p.bullets,
        mutualKill: true
      };
    }

    return {
      ok: true,
      reason: "counter_shot",
      target: suspectId,
      bulletsLeft: p.bullets
    };
  };

  // Spend a bullet without killing anyone (for missed counter-shots)
  Game.prophetSpendBullet = function () {
    var g = ensureState();
    var p = Game._prophetEnsure(g);
    if (p.bullets === undefined) p.bullets = 2;
    if (p.bullets > 0) p.bullets--;
  };

  Game.prophetBulletsLeft = function () {
    var g = ensureState();
    var p = Game._prophetEnsure(g);
    if (p.bullets === undefined) p.bullets = 2;
    return p.bullets;
  };

  // ── AI: Fang Heng's shoot decisions ──

  // Active shoot (daytime): Fang Heng is a shrewd dirty cop.
  // He only shoots when he has STRONG evidence — a confirmed "hostile" check
  // AND the target showed wolf tells today. He won't waste bullets on hunches.
  Game.prophetAIShoot = function () {
    var g = ensureState();
    if (!g.alive["fang_heng"]) return null;
    var p = Game._prophetEnsure(g);
    if (p.bullets === undefined) p.bullets = 2;
    if (p.bullets <= 0) return null;

    // Requirement: at least one check result of "hostile" for someone still alive
    var hostileChecked = p.checks.filter(function (c) {
      if (c.result !== "hostile") return false;
      if (!g.alive[c.target]) return false;
      // [v9.3.3 FIX] Cannot shoot someone already exiled (locked in cellar).
      if (typeof Game.isExiled === 'function' && Game.isExiled(c.target)) return false;
      return true;
    });
    if (hostileChecked.length === 0) return null;

    // Score each hostile-checked person by today's wolf tells
    var best = null;
    var bestScore = 0;
    hostileChecked.forEach(function (chk) {
      var score = 10; // base: already confirmed hostile
      var events = Game.getEventsInvolving(chk.target, g.day);
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.target === chk.target && (e.type === "observation" || e.type === "suspicion")) {
          score += e.weight;
        }
        if (e.a === chk.target && e.type === "conflict") {
          score += Math.floor(e.weight / 2);
        }
      }
      // Tang hint about this person = strong signal
      if (events.some(function (e) { return e.type === "tang_hint" && e.target === chk.target; })) {
        score += 20;
      }
      if (score > bestScore) { bestScore = score; best = chk.target; }
    });

    // Threshold: Fang Heng is cautious. Needs strong evidence (score >= 25).
    // Also a small chance he decides it's too risky (exposure) and holds fire.
    if (best && bestScore >= 25 && Math.random() < 0.6) {
      return { target: best, score: bestScore };
    }
    return null;
  };

  // Passive counter-shoot: when Fang Heng is killed at night, he fires back.
  // He shoots the person he most suspects (highest hostile check + day tells).
  // If no hostile checks, he shoots based on today's suspicious behavior.
  // Fang Heng must GUESS who killed him. Guess right = take killer down.
  // Guess wrong = shoot an innocent (bullet wasted, Fang Heng still dead).
  // He never "sees" the killer — only daytime evidence guides him.
  Game.prophetAICounterShoot = function () {
    var g = ensureState();
    var p = Game._prophetEnsure(g);
    if (p.bullets === undefined) p.bullets = 2;
    if (p.bullets <= 0) return null;

    // He must name a suspect. Refusing to shoot is allowed (save the bullet).
    // He only fires if he has SOME basis for a guess.
    var candidates = Game.activeList().filter(function (cid) {
      if (!g.alive[cid]) return false;
      if (cid === "fang_heng") return false;
      // [v9.3.3 FIX] Cannot suspect someone already exiled (locked in cellar).
      // Fang Heng is a cop — he knows an exiled person physically cannot
      // have killed him tonight. They're behind a locked door.
      if (typeof Game.isExiled === 'function' && Game.isExiled(cid)) return false;
      return true;
    });
    if (candidates.length === 0) return null;

    // Build suspicion scores from all available intel
    var scored = candidates.map(function (cid) {
      var score = 0;

      // Strongest signal: his own hostile checks
      var chk = p.checks.filter(function (c) { return c.target === cid; });
      if (chk.length > 0) {
        if (chk[chk.length - 1].result === "hostile") score += 30;
        else if (chk[chk.length - 1].result === "neutral") score += 5;
        else score -= 10; // friendly checked — he trusts them
      }

      // Day events: wolf tells today
      var events = Game.getEventsInvolving(cid, g.day);
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.target === cid && (e.type === "observation" || e.type === "suspicion")) {
          score += e.weight;
        }
        if (e.type === "tang_hint" && e.target === cid) score += 15;
      }

      // Cop instinct baseline per person
      var instinct = { zhou_yang: 6, zhao_mingcheng: 8, gu_yan: 4, zheng_shoushan: 2 };
      score += (instinct[cid] || 0);

      return { id: cid, score: score };
    }).sort(function (a, b) { return b.score - a.score; });

    // Fang Heng is shrewd. He won't fire on a hunch.
    // Needs at least moderate suspicion (score >= 12) to risk a shot.
    if (scored.length > 0 && scored[0].score >= 12) {
      return { target: scored[0].id, score: scored[0].score };
    }
    // Not confident enough — hold fire, save the bullet for another night.
    return null;
  };

})();
