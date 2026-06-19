const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\knight.js';
const s = fs.readFileSync(p, 'utf8');
const lines = s.split('\n');
// Show all the lines we need to edit with their exact content
[22,43,44,45,46,47,48,49,50,51,52,53,54,55,60,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,129].forEach(n => {
  console.log(n, JSON.stringify(lines[n-1]));
});
