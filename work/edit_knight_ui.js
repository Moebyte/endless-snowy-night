const fs = require('fs');

function patchFile(path, replacements) {
  const raw = fs.readFileSync(path, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let lines = raw.split(/\r?\n/);
  let changed = 0;
  for (const [trimMatch, newLines] of replacements) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === trimMatch) {
        lines.splice(i, 1, ...newLines);
        changed++;
        break;
      }
    }
  }
  if (changed !== replacements.length) {
    console.error('PARTIAL FAIL ' + path.split('\\').pop() + ': ' + changed + '/' + replacements.length);
    process.exit(1);
  }
  fs.writeFileSync(path, lines.join(eol), 'utf8');
  console.log('patched ' + path.split('\\').pop());
}

const KNIGHT_DIR = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\common\\';

// God_Knight.twee: rewrite the shared-cooldown hint to independent cooldowns
patchFile(KNIGHT_DIR + 'God_Knight.twee', [
  ["<p class=\"system-hint\">骑士有两种能力，<strong>每次只能选一种</strong>，使用后进入虚弱状态（明日无法行动）：</p>", [
    "<p class=\"system-hint\">骑士有白天与夜晚两种能力，<strong>各自独立冷却</strong>，互不影响：</p>"
  ]],
  ["<li><strong>决斗</strong>：指认一人为狼。若真是狼则斩杀；若不是则林小满自己死。狼王同归于尽。</li>", [
    "<li><strong>决斗（白天）</strong>：指认一人为狼。若真是狼则斩杀；若不是则林小满自己死。狼王同归于尽。决斗后次日白天无法再次决斗，但不影响守卫。</li>"
  ]],
  ["<li><strong>守卫</strong>：保护一人，今晚狼人袭击该人时被挡下。不可连续两晚守同一人。与女巫救人冲突时互相抵消。</li>", [
    "<li><strong>守卫（夜晚）</strong>：保护一人，今晚狼人袭击该人时被挡下。不可连续两晚守同一人。守卫后次夜无法再次守卫，但不影响决斗。与女巫救人冲突时互相抵消。</li>"
  ]]
]);

// God_Knight_Duel.twee
patchFile(KNIGHT_DIR + 'God_Knight_Duel.twee', [
  ["<p class=\"warning\">决斗后林小满进入虚弱状态，次日无法行动。</p>", [
    "<p class=\"warning\">决斗后林小满次日白天无法再次决斗，但夜晚仍可守卫。</p>"
  ]]
]);

// God_Knight_Guard.twee
patchFile(KNIGHT_DIR + 'God_Knight_Guard.twee', [
  ["<blockquote>林小满：「你想让我守着谁？我只能护一个人，而且之后两天我都动不了了——你确定？」</blockquote>", [
    "<blockquote>林小满：「你想让我守着谁？我只能护一个人，而且下一晚不能再守卫——但白天砍人不受影响。你确定？」</blockquote>"
  ]],
  ["<p class=\"system-hint\">守卫：今晚狼人袭击该目标时，林小满会挡下。守卫后林小满进入虚弱状态，次日无法行动。</p>", [
    "<p class=\"system-hint\">守卫：今晚狼人袭击该目标时，林小满会挡下。守卫后次夜无法再次守卫，但白天决斗不受影响。</p>"
  ]]
]);

// God_Knight_Guard_Result.twee
patchFile(KNIGHT_DIR + 'God_Knight_Guard_Result.twee', [
  ["<p class=\"warning\">林小满进入虚弱状态，明天无法行动。</p>", [
    "<p class=\"warning\">林小满次夜无法再次守卫，但白天决斗不受影响。</p>"
  ]]
]);

// God_Knight_Result.twee (duel result)
patchFile(KNIGHT_DIR + 'God_Knight_Result.twee', [
  ["<p class=\"system-hint\">一只狼被斩杀。但林小满现在很虚弱，明天无法行动。</p>", [
    "<p class=\"system-hint\">一只狼被斩杀。林小满次日白天无法再次决斗，但夜晚守卫不受影响。</p>"
  ]]
]);
