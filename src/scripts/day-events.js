/*
 * day-events.js
 *
 * White-day event simulator. Generates plausible daytime interactions
 * (conflicts, suspicions, observations) that drive all god-role AI.
 *
 * Events are based on the character interaction matrix:
 *   - Natural tensions (who dislikes whom)
 *   - Random triggered conflicts (two people clash over something)
 *   - Observations (someone notices something "off" about another)
 *
 * Each event has: { day, type, a, b, target, observer, weight, desc }
 *   - type: "conflict" | "suspicion" | "observation" | "tang_hint"
 *   - weight: how much this event affects suspicion (5-50)
 *   - "tang_hint": Tang Xiaotang subtly hints someone is suspicious (huge weight for Lin Xiaoman)
 */

(function () {
  'use strict';

  var Game = window.Game;
  var ensureState = Game.ensureState;

  // Natural tension matrix: a -> b means a has friction with b
  // Values are base suspicion weights when a conflict triggers
  var TENSIONS = {
    // Lin Xiaoman's natural dislikes (from they.md)
    // She observes others' behavior — not because they target Tang,
    // but because their vibe is "wrong" to her protective instinct
    lin_xiaoman: {
      zhou_yang: 20,      // she senses "hunter's eyes", something dark under his smile
      fang_heng: 15,      // he interrogates people like suspects
      zhao_mingcheng: 20, // he evaluates people like merchandise
      shen_shen: 10,      // he makes people uncomfortable, calculating gaze
      gu_yan: 15          // he looks at people like lab samples, too intense
    },
    // Fang Heng's natural targets (cop instinct)
    fang_heng: {
      zhou_yang: 20,      // "right hand always in pocket"
      chen_mo: 15,        // "knows something but won't say"
      zhao_mingcheng: 10, // old acquaintance, mutual wariness
      gu_yan: 10          // "writing formulas, intense"
    },
    // Tang Xiaotang's emotional dislikes (hidden wolf, but has feelings)
    tang_xiaotang: {
      su_wan: 10,         // rival for Chen Mo
      fang_heng: 5        // fears being caught
    },
    // Zhao Mingcheng targets Fang Heng (secret rivalry)
    zhao_mingcheng: {
      fang_heng: 25       // wants to eliminate Fang Heng
    },
    // Zhou Yang's fear (he fears people who can expose him)
    zhou_yang: {
      chen_mo: 15,        // "he knows something, won't say"
      fang_heng: 20       // "cop instinct, can see through me"
    },
    // Gu Yan observes everyone analytically
    gu_yan: {
      fang_heng: 10,
      chen_mo: 10
    },
    // Shen Shen evaluates everyone
    shen_shen: {
      zhao_mingcheng: 10,
      chen_mo: 10
    }
  };

  // Characters who can trigger conflict events
  var CONFLICT_STARTERS = Object.keys(TENSIONS);

  // ---- Public API ----

  // Generate day events for the current day.
  // Called once per day (at morning transition).
  Game.generateDayEvents = function () {
    var g = ensureState();
    var day = g.day;
    g.dayEvents = g.dayEvents || [];

    var aliveList = Game.activeList();
    if (aliveList.length < 3) return g.dayEvents;

    var newEvents = [];

    // 1. Generate 1-3 conflict/suspicion events based on tensions
    var numEvents = Math.floor(Math.random() * 3); // 0-2 (less noise, B-type carries more signal)

    for (var i = 0; i < numEvents; i++) {
      // Pick a random starter who is alive
      var starters = CONFLICT_STARTERS.filter(function (s) {
        return aliveList.indexOf(s) !== -1;
      });
      if (!starters.length) break;

      var starter = starters[Math.floor(Math.random() * starters.length)];
      var targets = Object.keys(TENSIONS[starter]).filter(function (t) {
        return aliveList.indexOf(t) !== -1;
      });
      if (!targets.length) continue;

      var target = targets[Math.floor(Math.random() * targets.length)];
      var baseWeight = TENSIONS[starter][target];
      // Good-vs-good tensions produce weaker events (noise)
      var starterRole = (typeof Game !== 'undefined' && typeof Game.roleOf === 'function') ? Game.roleOf(starter) : '';
      var targetRole2 = (typeof Game !== 'undefined' && typeof Game.roleOf === 'function') ? Game.roleOf(target) : '';
      var isWolfStarter = starterRole === 'wolf_king' || starterRole === 'hidden_wolf' || starterRole === 'wolf' || starterRole === 'mechanical_wolf';
      var isWolfTarget = targetRole2 === 'wolf_king' || targetRole2 === 'hidden_wolf' || targetRole2 === 'wolf' || targetRole2 === 'mechanical_wolf';
      // If neither is a wolf, this is good-vs-good noise — halve the weight
      if (!isWolfStarter && !isWolfTarget) baseWeight = Math.floor(baseWeight / 2);

      // Random variation
      var weight = Math.max(5, baseWeight + Math.floor(Math.random() * 10) - 5);

      // Pick event type
      var types = ['conflict', 'suspicion', 'observation'];
      var type = types[Math.floor(Math.random() * types.length)];

      // For conflict: both parties are involved
      // For suspicion: starter observes target
      // For observation: starter notices something about target
      var event = {
        day: day,
        type: type,
        a: starter,
        b: target,
        target: target,
        observer: starter,
        weight: weight,
        desc: type + ': ' + starter + ' -> ' + target + ' (w:' + weight + ')'
      };

      newEvents.push(event);
      g.dayEvents.push(event);
    }

    var WOLF_ROLES_FOR_TELL = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];
    // 1b. B-type events: wolves reveal tells during the day
    // These give good guys a chance to catch wolves through observation
    var WOLF_TELLS = {
      zhou_yang: [
        { type: 'observation', desc: 'zhou_yang right hand always in pocket', weight: 15 },
        { type: 'observation', desc: 'zhou_yang smile vanishes for a split second', weight: 12 },
        { type: 'suspicion', desc: 'zhou_yang looks at someone like prey', weight: 18 }
      ],
      zhao_mingcheng: [
        { type: 'observation', desc: 'zhao_mingcheng exchanges glances with fang_heng', weight: 15 },
        { type: 'suspicion', desc: 'zhao_mingcheng mediates a conflict too smoothly', weight: 10 },
        { type: 'observation', desc: 'zhao_mingcheng evaluates people like merchandise', weight: 18 }
      ],
      gu_yan: [
        { type: 'observation', desc: 'gu_yan stares at people too intensely', weight: 12 },
        { type: 'suspicion', desc: 'gu_yan writes formulas obsessively, muttering', weight: 15 },
        { type: 'observation', desc: 'gu_yan tries to get close to someone with god powers', weight: 20 }
      ],
      shen_shen: [
        // Shen Shen is a god, but his behavior looks suspicious (sitting in corners, evaluating)
        { type: 'observation', desc: 'shen_shen sits alone, watching everyone', weight: 8 },
        { type: 'suspicion', desc: 'shen_shen makes someone see things that arent real', weight: 25 }
      ]
    };

    // 70% chance of a wolf tell event per day
    if (Math.random() < 0.7) {
      var wolfTellStarters = Object.keys(WOLF_TELLS).filter(function(w) {
        return aliveList.indexOf(w) !== -1;
      });
      if (wolfTellStarters.length) {
        var tellWolf = wolfTellStarters[Math.floor(Math.random() * wolfTellStarters.length)];
        var tells = WOLF_TELLS[tellWolf];
        var tell = tells[Math.floor(Math.random() * tells.length)];

        // A random good guy observes this tell
        var observers = aliveList.filter(function(c) {
          return c !== tellWolf &&
                 WOLF_ROLES_FOR_TELL.indexOf(c) === -1; // not a wolf
        });
        if (observers.length) {
          var observer = observers[Math.floor(Math.random() * observers.length)];
          var tellEvent = {
            day: day,
            type: tell.type,
            a: tellWolf,
            b: tellWolf,       // the wolf is both source and target of observation
            target: tellWolf,
            observer: observer,
            weight: tell.weight,
            desc: tell.desc + ' (observed by ' + observer + ')'
          };
          newEvents.push(tellEvent);
          g.dayEvents.push(tellEvent);
        }
      }
    }

        // 2. Tang Xiaotang hint event (only if Tang is alive and it's day 3+)
    // She subtly hints someone is suspicious — Lin Xiaoman trusts this implicitly.
    // [v9.3.3 FIX] Tang Xiaotang is a hidden wolf. She senses her wolf teammates
    // (awakened via the system on Night 1). She would NEVER hint a teammate as
    // suspicious — that would get them killed. Her hints always target GOOD people.
    if (g.alive['tang_xiaotang'] && day >= 3 && Math.random() < 0.3) {
      var WOLF_TEAM = ['zhou_yang', 'tang_xiaotang', 'gu_yan', 'zhao_mingcheng'];
      var tangTargets = aliveList.filter(function (c) {
        // Never hint herself, Chen Mo (she loves him), Lin Xiaoman (her best friend),
        // or any wolf teammate (she protects them).
        return c !== 'tang_xiaotang' && c !== 'chen_mo' && c !== 'lin_xiaoman' &&
               WOLF_TEAM.indexOf(c) === -1;
      });
      if (tangTargets.length) {
        var hintTarget = tangTargets[Math.floor(Math.random() * tangTargets.length)];
        var hintEvent = {
          day: day,
          type: 'tang_hint',
          a: 'tang_xiaotang',
          b: hintTarget,
          target: hintTarget,
          observer: 'lin_xiaoman', // Lin overhears
          weight: 50, // Huge weight for Lin Xiaoman
          desc: 'tang_hint: tang_xiaotang hints ' + hintTarget + ' is suspicious'
        };
        newEvents.push(hintEvent);
        g.dayEvents.push(hintEvent);
      }
    }

    return newEvents;
  };

  // Get all events for a specific day
  Game.getDayEvents = function (day) {
    var g = ensureState();
    var d = day || g.day;
    return (g.dayEvents || []).filter(function (e) { return e.day === d; });
  };

  // Get all events involving a specific character (as a, b, target, or observer)
  Game.getEventsInvolving = function (charId, day) {
    var g = ensureState();
    var events = g.dayEvents || [];
    if (day !== undefined) events = events.filter(function (e) { return e.day === day; });
    return events.filter(function (e) {
      return e.a === charId || e.b === charId || e.target === charId || e.observer === charId;
    });
  };

  // Get events where someone targets Tang Xiaotang (for Lin Xiaoman's rage)
  Game.getEventsTargetingTang = function (day) {
    var g = ensureState();
    var events = g.dayEvents || [];
    if (day !== undefined) events = events.filter(function (e) { return e.day === day; });
    return events.filter(function (e) {
      return e.target === 'tang_xiaotang' || e.b === 'tang_xiaotang';
    });
  };

  // Clear all day events (on loop reset)
  Game.clearDayEvents = function () {
    var g = ensureState();
    g.dayEvents = [];
  };

})();
