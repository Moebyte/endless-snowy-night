/*
 * hidden-wolf.js - Hidden wolf (Tang Xiaotang) behavior AI
 *
 * v9 design:
 *   - Does NOT attend wolf pack meeting (other 3 wolves don't know she's a wolf)
 *   - Other wolves won't target her (she looks harmless, AI naturally avoids her)
 *   - When all 3 other wolves are dead, she AWAKENS and kills alone
 *   - Prophet always reads her as friendly/neutral (even after awakening)
 *   - Emotion-driven: jealous of Su Wan, protective of Lin Xiaoman
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
  // The 3 wolves that Tang Xiaotang is hidden from
  var KNOWN_WOLVES = ["zhou_yang", "zhao_mingcheng", "gu_yan"];

  // ── Check if Tang Xiaotang has awakened (all other wolves dead) ──
  Game.hiddenWolfAwakened = function () {
    var g = ensureState();
    if (!g.alive["tang_xiaotang"]) return false;

    // Awakened when all 3 known wolves are dead OR exiled (locked in cellar).
    // Being exiled removes a wolf from play just like death.
    var activeKnown = KNOWN_WOLVES.filter(function (w) {
      if (!g.alive[w]) return false;
      if (typeof Game.isExiled === 'function' && Game.isExiled(w)) return false;
      return true;
    });
    // Phase-gated: late phase (loop 8+) awakens when only 2 known wolves remain active.
    var threshold = (typeof Game.hiddenWolfAwakenThreshold === "function")
      ? Game.hiddenWolfAwakenThreshold()
      : 3;
    // threshold=3 means all 3 must be down (activeKnown.length === 0).
    // threshold=2 means 2 down (activeKnown.length <= 1).
    var needed = 3 - threshold;  // how many can remain active
    return activeKnown.length <= needed;
  };

  // ── Tang Xiaotang's emotional state ──
  Game.tangEmotionState = function () {
    var g = ensureState();
    var baseState = Math.random();

    if (g.alive["su_wan"]) baseState += 0.3;
    if (!g.alive["lin_xiaoman"]) baseState += 0.4;
    if (Game.hasFlag("chen_mo_kind_to_tang")) baseState -= 0.2;
    if (g.lastWolfKill && g.lastWolfKill.killed) baseState += 0.1;

    return Math.max(0, Math.min(1, baseState));
  };

  // ── Tang Xiaotang's kill target when awakened ──
  // She kills alone, emotion-driven
  Game.hiddenWolfAIGetKillTarget = function () {
    var g = ensureState();
    if (!Game.hiddenWolfAwakened()) return null;

    var emotion = Game.tangEmotionState();
    var candidates = Game.activeList().filter(function (c) {
      return c !== "tang_xiaotang";
    });
    if (candidates.length === 0) return null;

    // High emotion: prioritize Su Wan (jealousy)
    if (emotion > 0.6 && candidates.indexOf("su_wan") !== -1) {
      if (Math.random() < 0.5) return "su_wan";
    }

    // Never kill Chen Mo (obsessive love) unless desperate
    if (candidates.length <= 2 && candidates.indexOf("chen_mo") !== -1) {
      // Only if literally no other choice
      var others = candidates.filter(function(c) { return c !== "chen_mo"; });
      if (others.length === 0) return "chen_mo";
    }

    // Filter out Chen Mo from normal targets
    var normalTargets = candidates.filter(function(c) { return c !== "chen_mo"; });
    if (normalTargets.length === 0) return null;

    return normalTargets[Math.floor(Math.random() * normalTargets.length)];
  };

  // ── Tang's vote preference (kept for compatibility, but she doesn't participate in wolf votes) ──
  Game.tangVotePreference = function () {
    var g = ensureState();
    if (!g.alive["tang_xiaotang"]) return {};
    // Tang does NOT vote. She is completely isolated from the wolf pack.
    return { __passive: true, __veto: ["lin_xiaoman", "chen_mo"] };
  };

  // ── Tang's emotional hint to Lin Xiaoman (from original design) ──
  // She might accidentally mislead Lin Xiaoman when emotionally unstable
  Game.hiddenWolfAIMislead = function () {
    var g = ensureState();
    if (!g.alive["tang_xiaotang"]) return null;
    if (!g.alive["lin_xiaoman"]) return null;

    var emotion = Game.tangEmotionState();
    if (emotion < 0.7) return null;

    var target = null;
    if (g.alive["su_wan"] && Math.random() < 0.4) {
      target = "su_wan";
    } else {
      var candidates = Game.activeList().filter(function (c) {
        return c !== "tang_xiaotang" && c !== "lin_xiaoman" && c !== "chen_mo";
      });
      if (candidates.length > 0) {
        target = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    if (!target) return null;

    if (!g.godSkills.prophet.sharedWith) g.godSkills.prophet.sharedWith = {};
    if (!g.godSkills.prophet.sharedWith["lin_xiaoman"]) g.godSkills.prophet.sharedWith["lin_xiaoman"] = [];

    g.godSkills.prophet.sharedWith["lin_xiaoman"].push({
      infoTarget: target,
      alignment: "enemy",
      day: g.day,
      loop: g.loop,
      faked: true,
      source: "tang_xiaotang_emotion"
    });

    return { type: "emotional_outburst", target: target };
  };
})();
