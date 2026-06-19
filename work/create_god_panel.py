# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

panel_content = """:: God_Panel
<<run Game.visit()>>
<h2>神职联络</h2>
<p class="system-hint">你可以私下联络已确认的神职，请他们使用能力。注意：神职不知道彼此身份，除非你告诉他们。</p>

<div class="choice-list">
<<if Game.isAlive('ye_zhiqiu')>>
[[联络叶知秋（女巫）|God_Witch]]
<<else>>
<p class="muted">叶知秋已死亡。女巫能力消失。</p>
<</if>>

<<if Game.isAlive('lin_xiaoman')>>
[[联络林小满（骑士）|God_Knight]]
<<else>>
<p class="muted">林小满已死亡。骑士能力消失。</p>
<</if>>

<<if Game.isAlive('fang_heng')>>
[[联络方衡（预言家）|God_Prophet]]
<<else>>
<p class="muted">方衡已死亡。预言家能力消失。</p>
<</if>>
</div>

<<if Game.witchBroken()>>
<p class="danger">叶知秋已精神崩溃，无法再使用女巫能力。</p>
<</if>>
<<if Game.knightWeakened()>>
<p class="warning">林小满处于虚弱状态，今天无法决斗。</p>
<</if>>

<div class="choice-list">
[[返回|Start]]
</div>
"""
with open(os.path.join(base, 'God_Panel.twee'), 'w', encoding='utf-8') as f:
    f.write(panel_content)
print('Created God_Panel')