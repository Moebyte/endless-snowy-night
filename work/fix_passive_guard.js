const fs = require('fs');
const filePath = 'src/scripts/game.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the 15% passive protection with active guard check
const oldBlock = "    // 3. 骑士保护检查（15% 概率）\n    if (Game.isAlive('lin_xiaoman') && !Game.knightWeakened()) {\n      if (wolfTarget !== 'tang_xiaotang' && Math.random() < 0.15) {\n        result.killed = false;\n        result.special = 'protected_by_knight';\n        Game.magicianResetDaily();\n        return result;\n      }\n    }";

const newBlock = "    // 3. 骑士守卫检查（主动守护）\n    if (Game.knightIsGuarding(wolfTarget)) {\n      result.killed = false;\n      result.special = 'protected_by_knight';\n      Game.magicianResetDaily();\n      return result;\n    }";

if (content.indexOf(oldBlock) !== -1) {
  content = content.replace(oldBlock, newBlock);
} else {
  const oldB2 = oldBlock.replace(/\n/g, '\r\n');
  const newB2 = newBlock.replace(/\n/g, '\r\n');
  content = content.replace(oldB2, newB2);
}

// Add knightClearGuard to knightReset  
content = content.replace(
  "if (k.weakenedDays > 0) k.weakenedDays -= 1;",
  "if (k.weakenedDays > 0) k.weakenedDays -= 1;\n    k.currentGuard = null;"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced passive protection with active guard');
