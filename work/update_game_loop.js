const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'scripts', 'game.js');
let text = fs.readFileSync(filePath, 'utf8');
const oldBlock = `  // ---------- 循环 ----------
  Game.nextLoop = function () {
    var g = ensureState();
    g.loop += 1;
    g.day = 1;
    g.time = '06:00';
    // 每轮循环损失 SAN
    Game.changeSan(-5);
  };

  Game.nextDay = function () {
    var g = ensureState();
    g.day += 1;
    g.time = '06:00';
    if (g.day >= 7) {
      g.stats.hunger = Math.min(100, g.stats.hunger + 30);
    }
  };`;
const newBlock = `  // ---------- 循环 ----------
  // 每 7 天为一个轮回。第 7 天结束若未逃出，则进入下一轮。
  Game.nextLoop = function () {
    var g = ensureState();
    g.loop += 1;
    g.day = 1;
    g.time = '06:00';
    g.chapter = 1;
    // 重置世界状态（主角记忆保留）
    Game.resetLoopState();
    // 每轮循环损失 SAN
    Game.changeSan(-10);
    Game.addMemory('进入了第 ' + g.loop + ' 轮轮回。');
  };

  Game.nextDay = function () {
    var g = ensureState();
    g.day += 1;
    g.time = '06:00';
    if (g.day > 7) {
      // 第 7 天结束仍未逃出，强制进入下一轮
      Game.nextLoop();
    } else if (g.day === 7) {
      g.stats.hunger = Math.min(100, g.stats.hunger + 50);
    }
  };

  // 重置轮回内世界状态（人物存活、身份、时间相关 flags）
  Game.resetLoopState = function () {
    var g = ensureState();
    g.alive = {
      lu_chen: true,
      su_wan: true,
      chen_mo: true,
      zhou_ye: true,
      lin_xiaoman: true,
      shen_zhiheng: true,
      lao_zhou: true,
      han_lie: true,
      gu_yan: true,
      tang_xiaotang: true
    };
    g.roles = {
      lu_chen: 'memory',
      su_wan: 'villager',
      chen_mo: 'knight',
      zhou_ye: 'wolf',
      lin_xiaoman: 'villager',
      shen_zhiheng: 'prophet',
      lao_zhou: 'villager',
      han_lie: 'guardian',
      gu_yan: 'villager',
      tang_xiaotang: 'wolf'
    };
    g.flags = {};
    g.inventory = {};
    g.stats.hunger = 0;
    // 保留 clues、memories、endings
  };

  // 进入下一天；若返回 true 表示进入了新轮回
  Game.advanceDay = function () {
    var g = ensureState();
    var prevLoop = g.loop;
    Game.nextDay();
    return g.loop !== prevLoop;
  };`;
if (text.includes(oldBlock)) {
  text = text.replace(oldBlock, newBlock);
} else {
  console.warn('WARN: loop block not found');
}
fs.writeFileSync(filePath, text, 'utf8');
console.log('done');
