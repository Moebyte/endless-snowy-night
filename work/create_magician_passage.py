# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

# Create God_Magician passage
magician_content = """:: God_Magician
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
<<set _chars to ['su_wan','jiang_bai','fang_heng','shen_shen','ye_zhiqiu','zheng_shoushan','lin_xiaoman','zhou_yang','tang_xiaotang','zhao_mingcheng','gu_yan']>>
<<for _i to 0>>_LOOP
<<if _i < _chars.length>>
<<set _a to _chars[_i]>>
<<if Game.isAlive(_a)>>
<<for _j to (_i + 1)>>_LOOP2
<<if _j < _chars.length>>
<<set _b to _chars[_j]>>
<<if Game.isAlive(_b)>>
<<link "<<print GameState.PROFILES[_a].name>> ↔ <<print GameState.PROFILES[_b].name>>">><<run Game.magicianSwap(_a, _b)>><<goto 'God_Magician_Result'>><</link>>
<</if>>
<</if>>
_LOOP2
<</if>>
<</if>>
_LOOP
<</for>>
</div>
<</if>>
<</if>>

<div class="choice-list">
[[返回神职面板|God_Panel]]
</div>
"""
with open(os.path.join(base, 'God_Magician.twee'), 'w', encoding='utf-8') as f:
    f.write(magician_content)
print('Created God_Magician')

# Create result passage
result_content = """:: God_Magician_Result
<<run Game.visit()>>
<<set _swap to Game.getMagicianSwap()>>
<h2>交换已设置</h2>
<p>沈慎微微点头，手中的扑克牌无声地翻转。</p>
<blockquote>沈慎：「<strong><<print GameState.PROFILES[_swap.a].name>></strong>和<strong><<print GameState.PROFILES[_swap.b].name>></strong>。今晚，在狼的眼里，他们就是彼此。」</blockquote>
<p class="system-hint">交换将在今夜生效。如果狼人攻击其中一人，实际被杀的是另一人。</p>
<p class="muted">沈慎不知道这是否有用。赌博就是这样——你永远不知道牌面是什么，直到翻开。</p>
<div class="choice-list">
[[返回神职面板|God_Panel]]
</div>
"""
with open(os.path.join(base, 'God_Magician_Result.twee'), 'w', encoding='utf-8') as f:
    f.write(result_content)
print('Created God_Magician_Result')

# Update God_Panel to add magician entry
panel_path = os.path.join(base, 'God_Panel.twee')
with open(panel_path, 'r', encoding='utf-8') as f:
    panel = f.read()

if 'God_Magician' not in panel:
    old_section = """<<if Game.isAlive('fang_heng')>>
[[联络方衡（预言家）|God_Prophet]]
<<else>>
<p class="muted">方衡已死亡。预言家能力消失。</p>
<</if>>"""
    new_section = """<<if Game.isAlive('fang_heng')>>
[[联络方衡（预言家）|God_Prophet]]
<<else>>
<p class="muted">方衡已死亡。预言家能力消失。</p>
<</if>>

<<if Game.isAlive('shen_shen')>>
[[联络沈慎（魔术师）|God_Magician]]
<<else>>
<p class="muted">沈慎已死亡。魔术师能力消失。</p>
<</if>>"""
    panel = panel.replace(old_section, new_section)
    with open(panel_path, 'w', encoding='utf-8') as f:
        f.write(panel)
    print('Added magician to God_Panel')

print('Done.')