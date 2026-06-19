# -*- coding: utf-8 -*-
p = 'src/scripts/state.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Add magician swap state to godSkills in create()
old = """        prophet: {
          checks: [],           // 本轮已探查的结果 [{target, result}]
          exposed: false        // 身份是否已暴露
        }
      },"""

new = """        prophet: {
          checks: [],           // 本轮已探查的结果 [{target, result}]
          exposed: false        // 身份是否已暴露
        },
        magician: {
          swapsUsed: 0,         // 本轮已使用交换次数
          maxSwaps: 7,          // 每天一次，最多 7 天 = 7 次
          currentSwap: null,    // 当前生效的交换 {a: charId, b: charId}
          swapHistory: []       // 历史交换记录 [{day, a, b}]
        }
      },"""

if old in c and 'magician' not in c.split('godSkills')[1].split('memories')[0] if 'godSkills' in c else False:
    c = c.replace(old, new)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added magician state')
else:
    # Try simpler approach
    lines = c.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        if 'exposed: false' in line and 'prophet' in lines[i-1] if i > 0 else False:
            pass  # we'll handle this differently
    # Actually let's just check and do a direct replacement
    if 'currentSwap' not in c:
        target_line = None
        for i, line in enumerate(lines):
            if 'exposed: false' in line and i > 0 and 'prophet' in lines[i-1]:
                target_line = i
                break
        if target_line is not None:
            # Replace the closing of prophet block
            indent = '        '
            lines[target_line] = lines[target_line].rstrip()
            # Insert magician block after the prophet block's closing brace
            # Find the closing } of godSkills object
            for j in range(target_line, len(lines)):
                if lines[j].strip() == '},':
                    # Insert before this line
                    lines.insert(j, indent + 'magician: {')
                    lines.insert(j+1, indent + '  swapsUsed: 0,         // 本轮已使用交换次数')
                    lines.insert(j+2, indent + '  maxSwaps: 7,          // 每天一次，最多 7 天')
                    lines.insert(j+3, indent + "  currentSwap: null,    // 当前生效的交换 {a, b}")
                    lines.insert(j+4, indent + '  swapHistory: []       // 历史交换记录')
                    lines.insert(j+5, indent + '},')
                    break
            c = '\n'.join(lines)
            f = open(p, 'w', encoding='utf-8')
            f.write(c)
            f.close()
            print('Added magician state (line insertion)')
        else:
            print('Could not find insertion point')
    else:
        print('magician state already exists')