# -*- coding: utf-8 -*-
p = 'src/scripts/state.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Add god skill state to create()
# Insert after the pursuit block in create()
old_marker = "      // 记忆碎片（跨循环累积）"
new_state = """      // 神职技能状态（每轮重置）
      godSkills: {
        witch: {
          uses: 0,              // 已使用次数（复活+投毒合计）
          maxUses: 3,           // 上限
          broken: false,        // 是否精神崩溃
          hasReviveTarget: null,// 当前可复活的目标
          curses: []            // 已施加的诅咒列表 [{target, type}]
        },
        knight: {
          duelsUsed: 0,         // 本轮已决斗次数
          weakened: false,      // 是否处于虚弱状态
          lastTarget: null      // 上次决斗目标
        },
        prophet: {
          checks: [],           // 本轮已探查的结果 [{target, result}]
          exposed: false        // 身份是否已暴露
        }
      },

"""
if old_marker in c and 'godSkills' not in c:
    c = c.replace(old_marker, new_state + old_marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added godSkills state. File length:', len(c))
elif 'godSkills' in c:
    print('godSkills already exists')
else:
    print('Marker not found')