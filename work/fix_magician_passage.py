# -*- coding: utf-8 -*-
import os, itertools

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

chars = ['su_wan','jiang_bai','fang_heng','shen_shen','ye_zhiqiu','zheng_shoushan','lin_xiaoman','zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan']
names = {
    'su_wan': '苏晚', 'jiang_bai': '江白', 'fang_heng': '方衡', 'shen_shen': '沈慎',
    'ye_zhiqiu': '叶知秋', 'zheng_shoushan': '老郑', 'lin_xiaoman': '林小满',
    'zhou_yang': '周阳', 'tang_xiaotang': '唐小棠', 'zhao_mingcheng': '赵明城', 'gu_yan': '顾言'
}

# Generate all unique pairs
pairs = list(itertools.combinations(chars, 2))

# Build link lines for each pair
swap_links = []
for a, b in pairs:
    link = f"""<<if Game.isAlive('{a}') and Game.isAlive('{b}')>>
<<link "{names[a]} ↔ {names[b]}">><<run Game.magicianSwap('{a}', '{b}')>><<goto 'God_Magician_Result'>><</link>>
<</if>>"""
    swap_links.append(link)

swap_links_str = '\n'.join(swap_links)

magician_content = f""":: God_Magician
<<run Game.visit()>>
<h2>沈慎 · 魔术师</h2>
<<set _remaining to Game.magicianSwapsRemaining()>>
<<set _currentSwap to Game.getMagicianSwap()>>

<p>沈慎坐在壁炉旁的阴影里，手指不停地搓着一张扑克牌。</p>
<blockquote>沈慎：「我可以让两个人在夜里互换身份。狼只会看到交换后的样子。如果它们冲着一个人去……杀的其实是另一个。」</blockquote>
<p class="system-hint">身份交换：选择两人互换，只有夜晚狼人形态能感知。交换在当夜生效，次日重置。每天可用一次。</p>
<p class="muted">沈慎不知道谁是狼人，所以交换是盲赌。如果换到狼王，被同伴误杀时会触发同归于尽。</p>

<<if _currentSwap>>
<p class="warning">今晚已设置交换：<strong><<print GameState.PROFILES[_currentSwap.a].name>></strong> ↔ <strong><<print GameState.PROFILES[_currentSwap.b].name>></strong></p>
<p class="muted">交换已生效，无法更改。</p>
<<else>>
<p>剩余交换次数：<strong><<print _remaining>></strong>/7</p>

<<if _remaining > 0>>
<h3>选择交换的两人</h3>
<p class="muted">提示：考虑将可能被狼人攻击的好人，和高威胁的狼人交换。但沈慎不知道谁是狼。</p>
<div class="choice-list">
{swap_links_str}
</div>
<</if>>
<</if>>

<div class="choice-list">
[[返回神职面板|God_Panel]]
</div>
"""

with open(os.path.join(base, 'God_Magician.twee'), 'w', encoding='utf-8') as f:
    f.write(magician_content)
print('Rewrote God_Magician with static pair list')
print(f'Generated {len(pairs)} pair links')