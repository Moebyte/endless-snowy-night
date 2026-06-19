const fs = require('fs');
const p = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md\\src\\passages\\common\\Common_NightResolution.twee';
let s = fs.readFileSync(p, 'utf8');

// Bug: when the witch saves the wolf's victim, witchRevive() sets the target
// alive again, but _kill.killed stays true so the narrative falls into the
// "new corpse" branch instead of "saved_by_witch". Fix: after a successful
// revive, mark the kill as saved so the correct narrative branch runs.
const before = `<<if _witchDecision.action is 'save'>>
<<set _witchSaved to Game.witchRevive(Game.witchGetSensedDeath())>>
<</if>>`;
const after = `<<if _witchDecision.action is 'save'>>
<<set _witchSaved to Game.witchRevive(Game.witchGetSensedDeath())>>
<<if _witchSaved.ok>>
/ The witch revived the victim: rewrite the kill result so the narrative
/ takes the "saved_by_witch" branch instead of "new corpse". /
<<set _kill.killed to false>>
<<set _kill.special to 'saved_by_witch'>>
<</if>>
<</if>>`;
if (!s.includes(before)) { console.error('FAIL: save block not found'); process.exit(1); }
s = s.replace(before, after);

fs.writeFileSync(p, s, 'utf8');
console.log('Common_NightResolution.twee patched: witch save now flips _kill to saved_by_witch');
