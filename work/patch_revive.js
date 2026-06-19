const fs = require('fs');
const filePath = 'src/scripts/game.js';
let content = fs.readFileSync(filePath, 'utf8');

// In witchRevive, add revivedTargets tracking
const oldRevive = `    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }
    return { ok: true, reason: 'ok' };
  };

  Game.witchIsExposed = function () {`;

const newRevive = `    if (!w.revivedTargets) w.revivedTargets = [];
    w.revivedTargets.push(targetId);
    if (w.uses >= w.maxUses) {
      w.broken = true;
      return { ok: true, reason: 'broken' };
    }
    return { ok: true, reason: 'ok' };
  };

  Game.witchIsExposed = function () {`;

const idx = content.indexOf(oldRevive);
if (idx === -1) { console.error('OLD REVIVE BLOCK NOT FOUND'); process.exit(1); }
content = content.substring(0, idx) + newRevive + content.substring(idx + oldRevive.length);

// Also add sharedWith init in state reset
const oldReset = `        g.godSkills.prophet = { checks: [], exposed: false };`;
const newReset = `        g.godSkills.prophet = { checks: [], exposed: false, sharedWith: {} };`;
content = content.replace(oldReset, newReset);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched witchRevive + prophet state init');
