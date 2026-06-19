const fs = require('fs');

function editFile(path, edits) {
  const raw = fs.readFileSync(path, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let lines = raw.split(/\r?\n/);
  for (const [trimMatch, newLines] of edits) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === trimMatch) {
        lines.splice(i, 1, ...newLines);
        found = true;
        break;
      }
    }
    if (!found) { console.error('NOT FOUND in ' + path + ': ' + trimMatch); process.exit(1); }
  }
  fs.writeFileSync(path, lines.join(eol), 'utf8');
  console.log('edited ' + path.split('\\').pop() + ' -> ' + lines.length + ' lines');
}

// game.js: sync the duplicate knightWeakened to check both cooldowns
editFile('C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\game.js', [
  ["return (ensureState().godSkills.knight.weakenedDays || 0) > 0;", [
    "    var k = ensureState().godSkills.knight;",
    "    return (k.duelCooldown || 0) > 0 || (k.guardCooldown || 0) > 0;"
  ]]
]);

// state.js: add the new cooldown fields to the knight initial structure
editFile('C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\state.js', [
  ["weakenedDays: 0,", [
    "          weakenedDays: 0,",
    "          // Independent cooldowns: duel (day) and guard (night) no longer share.",
    "          duelCooldown: 0,",
    "          guardCooldown: 0,"
  ]]
]);
