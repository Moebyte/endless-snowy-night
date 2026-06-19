# -*- coding: utf-8 -*-
p = 'src/scripts/state.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Add lastWolfKill to create()
old = "      // 记忆碎片（跨循环累积）"
new = "      // 上一次狼人击杀结果（供剧情显示）\n      lastWolfKill: null,\n\n"
if 'lastWolfKill' not in c:
    c = c.replace(old, new + old)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added lastWolfKill to state')
else:
    print('lastWolfKill already exists')