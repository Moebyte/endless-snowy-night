/*
 * loop-phase.js - Loop progression system
 *
 * The game evolves as Chen Mo loops more times. Three phases:
 *   early  (loop 1-3):  cautious play, basic interactions, wolves hold back
 *   mid    (loop 4-7):  self-stab, hard-jump, deeper backstories, bolder wolves
 *   late   (loop 8+):   dark reversals, trust collapse, truth fragments
 *
 * AI aggression scales with phase: wolves bind/frame/jump more readily,
 * god-roles share/shoot/duel more aggressively, Tang awakens easier.
 *
 * Daytime event pools are also phase-gated (separate system in day-events).
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

  // ── Phase boundaries ──
  var EARLY_MAX = 3;   // loop 1-3
  var MID_MAX = 7;     // loop 4-7

  // Get the current phase name.
  Game.getLoopPhase = function () {
    var g = ensureState();
    var loop = g.loop || 1;
    if (loop <= EARLY_MAX) return "early";
    if (loop <= MID_MAX) return "mid";
    return "late";
  };

  // Numeric phase index: 0 = early, 1 = mid, 2 = late.
  Game.getLoopPhaseIndex = function () {
    var phase = Game.getLoopPhase();
    if (phase === "early") return 0;
    if (phase === "mid") return 1;
    return 2;
  };

  // Aggression multiplier (0.0 - 1.0+). Scales AI boldness.
  // early: 0.5 (cautious), mid: 0.75 (normal), late: 1.0+ (aggressive)
  // Beyond late (loop 11+), keeps climbing slightly.
  Game.getAggression = function () {
    var g = ensureState();
    var loop = g.loop || 1;
    if (loop <= EARLY_MAX) return 0.5;
    if (loop <= MID_MAX) return 0.75;
    // late: ramp from 1.0 to ~1.2 by loop 12
    var over = loop - MID_MAX;  // 1, 2, 3...
    return Math.min(1.2, 1.0 + (over - 1) * 0.04);
  };

  // Convenience booleans for AI logic.
  Game.isEarlyPhase = function () { return Game.getLoopPhase() === "early"; };
  Game.isMidPhase = function () { return Game.getLoopPhase() === "mid"; };
  Game.isLatePhase = function () { return Game.getLoopPhase() === "late"; };

  // ── Phase-gated feature checks ──
  // Self-stab deception: only mid-phase and later.
  Game.canSelfStab = function () {
    var phase = Game.getLoopPhase();
    return phase === "mid" || phase === "late";
  };

  // Hard-jump wolf (fake prophet claim): mid and late only.
  Game.canHardJump = function () {
    var phase = Game.getLoopPhase();
    return phase === "mid" || phase === "late";
  };

  // Tang Xiaotang hidden-wolf: in late phase, awakens when 2 wolves are down
  // (instead of all 3). Makes late-game more dangerous.
  Game.hiddenWolfAwakenThreshold = function () {
    if (Game.isLatePhase()) return 2;  // 2 wolves dead/exiled -> awaken
    return 3;  // default: all 3 must be down
  };

  // Wolf bloc-vote willingness modifier. Later phases = bolder framing.
  Game.wolfBlocModifier = function () {
    return Game.getAggression();
  };

  // Prophet sharing willingness modifier.
  Game.prophetShareModifier = function () {
    return Game.getAggression();
  };
})();
