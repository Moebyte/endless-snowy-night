/**
 * exile-ai.js - Exile AI phase, reset, backfire, wrappers
 * Depends on exile.js + exile-vote.js
 */
(function () {

  Game.exileAIPhase = function () {
    var g = Game._exileEnsureState();
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
    var g = Game._exileEnsureState();
    if (!Game.isExiled(target)) return { ok: false, reason: 'not_exiled' };
    return { ok: true, target: target, day: g.day };
  };

  // ---- Reset (on loop reset) ----

  Game.exileReset = function () {
    var g = Game._exileEnsureState();
    g.exile = null;
    Game._exileEnsureExile(g);
  };


  // ---- [v9.3-C] Vote-pattern detection: bloc-voting backfires on wolves ----
  // In real werewolf, 4 wolves always voting together is the easiest tell.
  // We track which wolves voted "exile" on successful good-person exiles.
  // After 2 bloc patterns (>=3 wolves voting exile on a good target),
  // a day event fires that raises suspicion toward those wolves.

  Game.exileRecordVotePattern = function (voteResult, target, exiled) {
    var g = Game._exileEnsureState();
    var e = Game._exileEnsureExile(g);
    if (!e.votePatterns) e.votePatterns = [];

    // Only track patterns when the target was a GOOD person (wolves framing).
    var targetRole = Game.roleOf(target);
    var targetIsWolf = Game._exileWOLF_ROLES.indexOf(targetRole) !== -1;
    if (targetIsWolf) return;  // wolves voting to protect a wolf isn't a tell

    // Record which wolves voted "exile" (frame good) this round.
    var wolvesVotingExile = [];
    for (var i = 0; i < voteResult.voters.length; i++) {
      var vt = voteResult.voters[i];
      var vtRole = Game.roleOf(vt.id);
      if (Game._exileWOLF_ROLES.indexOf(vtRole) !== -1 && vt.vote === 'exile') {
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
    var g = Game._exileEnsureState();
    var e = Game._exileEnsureExile(g);

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
