/*
 * vote-beta.js - Wolf pack discussion flow (BETA)
 *
 * Key change from vote.js:
 *   - Soul-bound (缚魂) wolves CANNOT attend the nightly meeting
 *   - Remaining wolves need UNANIMOUS consent to kill
 *   - If even 1 attending wolf disagrees -> safe night (no kill)
 *   - Single wolf alone: 50% chance too scared to act alone
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
  var WOLF_IDS = ["zhou_yang", "zhao_mingcheng", "gu_yan"];
  var GOD_ROLES = ["prophet", "witch", "knight", "magician"];

  var REASONS = {
    aggressive: ["他白天太活跃了。", "他看我的眼神不对劲。", "留着他迟早出事。"],
    calculated: ["他知道得太多了。", "他是最大的变数。", "他活着对我们不利。"],
    mech: ["他身上有我想要的东西。", "杀了他我能获得能力。"],
    wolf_king: ["他是最硬的骨头。", "杀了他其他人就不敢动了。"]
  };

  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  Game.wolfName = function (wolfId) {
    var names = { zhou_yang: "周阳", tang_xiaotang: "唐小棠", zhao_mingcheng: "赵明城", gu_yan: "顾言" };
    return names[wolfId] || wolfId;
  };

  // ── Get attending wolves (alive AND not soul-bound) ──
  // Kill-heart threshold: probability each wolf will attend tonight's hunt.
  // Early days = high hesitation. Each wolf has different psychology.
  // Root cause: system psychological erosion intensifies over days.
  var KILL_HEART = {
    // zhou_yang: killed before as a child, violence closest to surface
    zhou_yang:       { d2: 0.60, d3: 0.85, d4plus: 0.98 },
    // zhao_mingcheng: white glove, used to dirty business but first-hand kill is a threshold
    zhao_mingcheng:  { d2: 0.30, d3: 0.70, d4plus: 0.95 },
    // gu_yan: physicist, scholar, hardest to cross the line
    gu_yan:          { d2: 0.10, d3: 0.40, d4plus: 0.85 }
  };

  // Count alive gods (prophet, witch, knight, magician)
  var GOD_ROLE_LIST = ["prophet", "witch", "knight", "magician"];
  Game.aliveGodsCount = function () {
    var g = ensureState();
    return GOD_ROLE_LIST.filter(function (role) {
      for (var cid in g.roles) {
        if (g.roles[cid] === role && g.alive[cid] &&
            !(typeof Game.isExiled === 'function' && Game.isExiled(cid))) {
          return true;
        }
      }
      return false;
    }).length;
  };

  // [v9.5.2] Dynamic kill-heart: base psychology + situation awareness.
  // Fewer gods alive = wolves smell blood = bolder.
  // Each dead god adds +8% kill-heart. All gods dead: +15% flat boost.
  Game.wolfKillHeart = function (wolfId) {
    var g = ensureState();
    var kh = KILL_HEART[wolfId];
    if (!kh) return 1.0;
    var day = g.day || 2;
    var threshold;
    if (day <= 2) threshold = kh.d2;
    else if (day === 3) threshold = kh.d3;
    else threshold = kh.d4plus;

    var aliveGods = Game.aliveGodsCount();
    var godBoost = (4 - aliveGods) * 0.08;
    if (aliveGods === 0) godBoost = 0.15;

    threshold = Math.min(0.99, threshold + godBoost);
    return threshold;
  };

  Game.getAttendingWolves = function () {
    var g = ensureState();
    return WOLF_IDS.filter(function (w) {
      if (!g.alive[w]) return false;
      // [v9.3.3 FIX] Exiled wolves are locked in the cellar — cannot attend
      // the nightly kill meeting or participate in any wolf action.
      if (typeof Game.isExiled === 'function' && Game.isExiled(w)) return false;
      if (Game.isSoulBound(w)) return false;
      // Kill-heart check: wolf may hesitate (not attend) early on
      var heart = Game.wolfKillHeart(w);
      return Math.random() < heart;
    });
  };

  Game.selectWolfLeader = function (exclude) {
    exclude = exclude || [];
    var attending = Game.getAttendingWolves();
    if (attending.length === 0) return null;
    var priority = ["zhou_yang", "zhao_mingcheng", "gu_yan"];
    for (var i = 0; i < priority.length; i++) {
      if (attending.indexOf(priority[i]) !== -1 && exclude.indexOf(priority[i]) === -1) {
        return priority[i];
      }
    }
    return attending[attending.length - 1];
  };

  Game.leaderProposal = function (leaderId) {
    var g = ensureState();
    var candidates = Game.activeList().filter(function (cid) {
      return cid !== "chen_mo" && cid !== "tang_xiaotang" &&
           WOLF_IDS.indexOf(cid) === -1 &&
           Game.roleOf(cid) !== "hidden_wolf";
    });
    if (candidates.length === 0) return null;

    // Global: if Fang Heng has been exposed (shot someone), ALL wolves prioritize him.
    // In China, a man with a gun is terrifying — he must be eliminated first.
    var pr = g.godSkills.prophet;
    if (pr && pr.exposed && candidates.indexOf("fang_heng") !== -1 && g.alive["fang_heng"]) {
      return { target: "fang_heng", reason: "He has a gun. He already killed someone. Eliminate him now." };

    // If Lao Zheng publicly spoke about hearing footsteps at night,
    // ALL wolves prioritize killing him — he's a surveillance threat.
    if (Game.hasFlag("zheng_spoke_hearing") && candidates.indexOf("zheng_shoushan") !== -1 && g.alive["zheng_shoushan"]) {
      return { target: "zheng_shoushan", reason: "他能听见我们夜里的动静。必须处理掉。" };
    }

    // [v9.5] If the witch (Ye Zhiqiu) exposed herself to veto an exile,
    // wolves prioritize her — she can revive anyone they kill.
    if (Game.hasFlag("ye_zhiqiu_exposed") && candidates.indexOf("ye_zhiqiu") !== -1 && g.alive["ye_zhiqiu"]) {
      return { target: "ye_zhiqiu", reason: "She just revealed she can bring the dead back. She dies tonight." };
    }

    }

    if (g.day <= 1) {
      return { target: candidates[Math.floor(Math.random() * candidates.length)], reason: "先随便解决一个。" };
    }

    var target = null, reason = "";

    if (leaderId === "zhou_yang") {
      var aggressive = candidates.filter(function (c) {
        return Game.hasFlag("confronted_wolf_" + c) || GOD_ROLES.indexOf(Game.roleOf(c)) !== -1;
      });
      target = aggressive.length > 0 ? aggressive[Math.floor(Math.random() * aggressive.length)] : candidates[Math.floor(Math.random() * candidates.length)];
      reason = randomFrom(REASONS.aggressive);
    } else if (leaderId === "zhao_mingcheng") {
      // If Fang Heng has been exposed (shot someone), he is top priority —
      // a man with a gun who is not afraid to use it is the biggest threat.
      var exposed = false;
      var pr = g.godSkills.prophet;
      if (pr && pr.exposed) exposed = true;
      if (exposed && candidates.indexOf("fang_heng") !== -1) {
        return { target: "fang_heng", reason: "He has a gun. He already killed someone. We are next." };
      }
      var infoRisks = candidates.filter(function (c) {
        return c === "zheng_shoushan" || c === "fang_heng" || Game.hasRevealed(c, "backstory");
      });
      target = infoRisks.length > 0 ? infoRisks[Math.floor(Math.random() * infoRisks.length)] : candidates[Math.floor(Math.random() * candidates.length)];
      reason = randomFrom(REASONS.calculated);
    } else if (leaderId === "gu_yan") {
      var gods = candidates.filter(function (c) {
        return GOD_ROLES.indexOf(Game.roleOf(c)) !== -1 && !Game.hasFlag("gu_yan_stole_god_power");
      });
      if (gods.length > 0) {
        target = gods[Math.floor(Math.random() * gods.length)];
        reason = randomFrom(REASONS.mech);
      } else {
        target = candidates[Math.floor(Math.random() * candidates.length)];
        reason = "没有更好的目标了。";
      }
    }

    return { target: target, reason: reason };
  };

  Game.wolfResponse = function (wolfId, proposedTarget, leaderId) {
    var g = ensureState();
    var resp = { wolf: wolfId, vote: null, narrative: "" };

    if (wolfId === "zhao_mingcheng") {
      if (proposedTarget === "chen_mo") {
        resp.vote = "oppose";
      } else if (proposedTarget === "zheng_shoushan" || proposedTarget === "fang_heng") {
        resp.vote = "approve";
      } else if (Math.random() < 0.2 && leaderId !== "zhao_mingcheng") {
        resp.vote = "oppose";
      } else {
        resp.vote = "approve";
      }
    } else if (wolfId === "gu_yan") {
      var targetRole = Game.roleOf(proposedTarget);
      if (GOD_ROLES.indexOf(targetRole) !== -1) {
        resp.vote = "approve";
      } else if (Math.random() < 0.4) {
        resp.vote = "oppose";
      } else {
        resp.vote = "approve";
      }
    } else if (wolfId === "zhou_yang") {
      if (wolfId === leaderId) {
        resp.vote = "leader";
      } else {
        if (proposedTarget === "tang_xiaotang" || proposedTarget === "chen_mo") {
          resp.vote = "oppose";
        } else {
          resp.vote = "approve";
        }
      }
    }
    return resp;
  };

  // ── Resolve discussion: UNANIMOUS consent required ──
  Game.resolveWolfDiscussion = function () {
    var g = ensureState();
    var attending = Game.getAttendingWolves();

    // No wolves attending -> safe night
    if (attending.length === 0) {
      return { leader: null, finalTarget: null, resolution: "no_attendance", absent: "all_bound" };
    }

    // [v9.5.2] Single wolf: dynamic hesitation based on gods alive.
    // All gods dead = 10% hesitate. Fewer gods = wolves sense victory.
    if (attending.length === 1) {
      var aliveGods = Game.aliveGodsCount();
      var loneHesitate;
      if (aliveGods === 0) loneHesitate = 0.10;
      else if (aliveGods === 1) loneHesitate = 0.20;
      else if (aliveGods === 2) loneHesitate = 0.35;
      else loneHesitate = 0.50;
      if (Math.random() < loneHesitate) {
        return { leader: attending[0], finalTarget: null, resolution: "lone_wolf_hesitated", absent: "alone", godsAlive: aliveGods };
      }
    }

    var maxRounds = 3;
    var usedLeaders = [];

    for (var round = 1; round <= maxRounds; round++) {
      var leader = Game.selectWolfLeader(usedLeaders);
      if (!leader) break;
      usedLeaders.push(leader);

      var proposal = Game.leaderProposal(leader);
      if (!proposal) return null;

      // Check responses from ALL attending wolves
      var approve = 0, oppose = 0;
      attending.forEach(function (wid) {
        if (wid === leader) { approve++; return; }
        var r = Game.wolfResponse(wid, proposal.target, leader);
        if (r.vote === "approve") approve++;
        else if (r.vote === "oppose") oppose++;
      });

      // UNANIMOUS: everyone must approve (no opposes)
      if (oppose === 0) {
        return {
          leader: leader,
          finalTarget: proposal.target,
          resolution: "unanimous",
          attendingCount: attending.length
        };
      }

      // Someone disagreed — try next round with a different leader
    }

    // All rounds exhausted, no consensus -> SAFE NIGHT
    return {
      leader: null,
      finalTarget: null,
      resolution: "no_consensus",
      attendingCount: attending.length
    };
  };

  function makeResult(leader, proposal, responses, resolution, finalTarget) {
    return {
      leader: leader,
      leaderName: leader ? Game.wolfName(leader) : null,
      proposal: proposal,
      responses: responses,
      resolution: resolution,
      finalTarget: finalTarget
    };
  }

  // ── Target selection ──
  Game.getWolfTarget = function () {
    var discussion = Game.resolveWolfDiscussion();
    if (discussion && discussion.finalTarget) return discussion.finalTarget;
    return null;
  };

  // ── Expose how many wolves are attending (for stats) ──
  Game.wolfAttendingCount = function () {
    return Game.getAttendingWolves().length;
  };

  // ── Expose last discussion result for stats ──
  Game.lastDiscussionResult = null;
  var origGetWolfTarget = Game.getWolfTarget;
  Game.getWolfTarget = function () {
    var result = Game.resolveWolfDiscussion();
    Game.lastDiscussionResult = result;
    if (result && result.finalTarget) return result.finalTarget;
    return null;
  };

})();
