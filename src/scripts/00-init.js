/*
 * 00-init.js
 * Must load before all other scripts.
 * Ensures window.Game and window.GameState exist before any IIFE tries to use them.
 */
window.Game = window.Game || {};
window.GameState = window.GameState || {};
