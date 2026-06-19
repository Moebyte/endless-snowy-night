const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'outputs', '暴风雪山庄_无限流_剧本_Pilot.md');
let text = fs.readFileSync(filePath, 'utf8');
const oldRule = '1. **时间循环**：每日 06:00 醒来，永远是“被困第三天”；23:00 必须回到各自房间。第 7 天若未逃出，全员因脱水和饥饿进入真实死亡。\n2. **重置条件**：主角陆沉死亡，或第 7 天 06:00 到来时自动重置。';
const newRule = '1. **时间循环**：每 7 天为一个完整轮回。轮回内每天 06:00 正常推进，23:00 必须回到各自房间。第 7 天若未逃出山庄，全员因脱水和饥饿进入真实死亡。\n2. **重置条件**：主角陆沉死亡，或第 7 天结束时仍未逃出，轮回会重置。主角回到下一轮的第 1 天 06:00，保留全部记忆；其他人和世界状态重置。';
if (text.includes(oldRule)) {
  text = text.replace(oldRule, newRule);
} else {
  console.warn('WARN: time loop rule block not found');
}
fs.writeFileSync(filePath, text, 'utf8');
console.log('done');
