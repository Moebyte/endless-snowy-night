(function () {
  "use strict";
  window.Game = window.Game || {};

  // Explore a location: mark visited, return its data for display
  Game.exploreLocation = function (locId) {
    if (!GameState.MAP[locId]) return null;
    Game.visitLocation(locId);
    return GameState.MAP[locId];
  };
})();
