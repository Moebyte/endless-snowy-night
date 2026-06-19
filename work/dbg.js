const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\tools\\sim20.js';
let s = fs.readFileSync(p, 'utf8');
// prophetShareInfo(targetId, infoTargetId) - 第一个参数是接收者，第二个是被查验的人
// prophetAICheckNight 返回的是接收者(shareTarget)，prophetCheck 的 target 是被查验者
// 原脚本传的是 prophetShareInfo(st, target) 即 (接收者, 被查验者) - 这是对的
// 问题在 prophetShared.ok 判断后没设 suspect flag？实际 prophetShareInfo 内部会设
// 真正问题：witchAIDecide 需要 sensed death 先被设置。检查 witchSenseDeath 调用顺序
// 让我打印 witchAIDecide 的返回值来诊断
console.log("checking witch flow...");
