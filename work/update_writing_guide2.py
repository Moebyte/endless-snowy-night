# -*- coding: utf-8 -*-
p = 'docs/writing-guide.md'
f = open(p, 'r', encoding='utf-8')
lines = f.readlines()
f.close()

new_lines = []
for line in lines:
    new_lines.append(line)
    if line.strip().startswith('2. **安全屋规则**') and '强闯一间安全屋' in line:
        new_lines.append('   - **能力时间规则**：神职能力来源于村民，任意时间可用；狼人能力来源于夜光，仅夜晚可用。\n')
        new_lines.append('   - 例外：狼王被杀时可同归于尽（被动，任何时间，但被诅咒杀死时不能发动）；机械狼弑神后白天也可使用偷来的神力。\n')

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Updated writing-guide with time rules')