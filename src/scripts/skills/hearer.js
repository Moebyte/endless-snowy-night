/*
 * hearer.js
 * Lao Zheng (郑守山) night footstep perception skill.
 *
 * Lao Zheng has driven mountain roads for 30 years and stayed in
 * countless inns. He has an old man'''s light sleep and a driver'''s
 * directional instinct. When wolves walk the corridor at night to kill,
 * there'''s a chance he wakes up and can tell which direction they came
 * from (west stairs vs east stairs) and which way they went.
 *
 * Key rules:
 *   - Only triggers on WOLF kill movement (not witch/knight/magician).
 *   - Only感知 his own floor (Floor 2, room 203).
 *   - 35% chance to wake up when a wolf kills on his floor.
 *   - If he wakes, he detects the direction: W->E or E->W.
 *   - He can also tell if someone left the room NEXT to his (204 = Gu Yan).
 *   - Intel is shared verbally during daytime, not auto-transmitted.
 *
 * This is a reality skill (现实技能), not a god power.
 */

(function () {
  "use strict";

  var Game = window.Game;

  function ensureState() {
    if (!State.variables.game) State.variables.game = GameState.create();
    return State.variables.game;
  }

  // Lao Zheng'''s room and floor
  var LAO_ZHENG_ROOM = "203";
  var LAO_ZHENG_FLOOR = 2;
  var NEIGHBOR_ROOM = "204"; // Gu Yan lives next door

  // ── Initialize hearing state ──
  Game.hearerInit = function () {
    var g = ensureState();
    g.hearer = {
      lastResult: null,
      history: []
    };
  };

  // ── Main: called after wolf kill each night ──
  // killInfo: { killer, target, killed, actualTarget, special }
  // Returns { woke, direction, neighborLeft, day } or null if Lao Zheng is dead.
  Game.hearerNightCheck = function (killInfo) {
    var g = ensureState();
    if (!g.alive["zheng_shoushan"]) return null;
    if (typeof Game.isExiled === "function" && Game.isExiled("zheng_shoushan")) return null;
    if (!g.hearer) Game.hearerInit();

    var result = {
      day: g.day,
      woke: false,
      direction: null,      // "W2E" or "E2W"
      neighborLeft: false,   // did someone leave room 204 (Gu Yan)?
      killerOnFloor: false   // was the kill on the same floor?
    };

    // Only check if the wolf kill happened on Lao Zheng'''s floor.
    // Determine the killer'''s room and target'''s room.
    var killerRoom = GameState.CHAR_ROOMS ? GameState.CHAR_ROOMS[killInfo.killer] : null;
    var targetRoom = GameState.CHAR_ROOMS ? GameState.CHAR_ROOMS[killInfo.actualTarget || killInfo.target] : null;

    var killerFloor = killerRoom ? GameState.ROOMS[killerRoom].floor : null;
    var targetFloor = targetRoom ? GameState.ROOMS[targetRoom].floor : null;

    // Did the wolf pass through floor 2 corridor?
    // This happens if: killer is on floor 2, or target is on floor 2,
    // or wolf crossed through floor 2 (from floor 1 to floor 3 via stairs).
    // For simplicity: only trigger if killer OR target is on floor 2.
    if (killerFloor === LAO_ZHENG_FLOOR || targetFloor === LAO_ZHENG_FLOOR) {
      result.killerOnFloor = true;

      // 35% chance to wake up
      if (Math.random() < 0.35) {
        result.woke = true;

        // Determine direction based on killer and target room positions
        // If killer is west of target: W->E
        // If killer is east of target: E->W
        if (killerRoom && targetRoom) {
          var killerPos = GameState.ROOMS[killerRoom].pos;
          var targetPos = GameState.ROOMS[targetRoom].pos;
          // Simple heuristic: compare room numbers on same floor
          var killerNum = parseInt(killerRoom, 10);
          var targetNum = parseInt(targetRoom, 10);
          if (killerNum < targetNum) {
            result.direction = "W2E"; // west to east
          } else {
            result.direction = "E2W"; // east to west
          }
        }

        // Check if the neighbor (204, Gu Yan) left his room
        if (killInfo.killer === GameState.ROOMS[NEIGHBOR_ROOM].char) {
          result.neighborLeft = true;
        }
      }
    }

    g.hearer.lastResult = result;
    g.hearer.history.push(result);
    return result;
  };

  // ── Get today'''s hearing result (for UI / dialogue) ──
  Game.hearerGetResult = function () {
    var g = ensureState();
    if (!g.hearer) return null;
    return g.hearer.lastResult;
  };

  // ── Reset on loop reset ──
  Game.hearerReset = function () {
    Game.hearerInit();
  };

})();
