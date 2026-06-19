const fs = require('fs');
const s = fs.readFileSync('C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\scripts\\skills\\knight.js', 'utf8');
const lines = s.split('\n');
console.log('Total lines:', lines.length, '| CRLF:', s.includes('\r\n'));
for (let i = 18; i < 42; i++) console.log(i+1, JSON.stringify(lines[i]));
