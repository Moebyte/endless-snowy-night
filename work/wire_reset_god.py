# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

lines = c.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    # After the line that says "保留 clues、memories、endings"
    stripped = line.strip()
    if stripped.startswith('// 保留 clues') and 'endings' in stripped:
        new_lines.append('    // 重置神职技能（每轮重置）')
        new_lines.append('    Game.resetGodSkillsLoop();')

with open(p, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
print('Wired resetGodSkillsLoop into resetLoopState')