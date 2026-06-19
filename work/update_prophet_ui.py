# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

# Rewrite God_Prophet_Result
result_content = """:: God_Prophet_Result
<<run Game.visit()>>
<<set _results to Game.prophetResults()>>
<<set _last to _results[_results.length - 1]>>
<<set _targetName to GameState.PROFILES[_last.target].name>>
<h2>预言家的感知</h2>
<p>方衡凝视了许久。他的瞳孔微微放大，像是看到了某种常人看不到的东西。许久之后，他缓缓开口：</p>
<blockquote><<print _last.text>></blockquote>
<p class="muted">方衡无法给出明确的答案。他感知到的只是气息和意象——是盟友还是敌人，需要你自己判断。</p>
<p class="warning">注意：有些气息具有误导性。完美的善意可能是伪装，空洞的存在可能隐藏着危险。</p>

<<set _allResults to Game.prophetResults()>>
<<if _allResults.length > 1>>
<h3>历史感知记录</h3>
<<for _i to 0>>_HIST
<<if _i < _allResults.length - 1>>
<<set _r to _allResults[_i]>>
<p class="muted">第 <<print _r.loop>> 轮第 <<print _r.day>> 天 · <<print GameState.PROFILES[_r.target].name>>：<<print _r.text>></p>
<</if>>
_HIST
<</for>>
<</if>>

<div class="choice-list">
[[继续探查|God_Prophet]]
[[返回|Start]]
</div>
"""
with open(os.path.join(base, 'God_Prophet_Result.twee'), 'w', encoding='utf-8') as f:
    f.write(result_content)
print('Rewrote God_Prophet_Result')

# Update God_Prophet description
prophet_content = """:: God_Prophet
<<run Game.visit()>>
<h2>方衡 · 预言家</h2>
<p>方衡站在窗边，目光扫过大厅里的每一个人。</p>
<blockquote>方衡：「我能感知到一个人身上的气息。但我看到的不是身份，是意象——雾气、火焰、空洞、涟漪。怎么解读，取决于你自己。」</blockquote>
<p class="system-hint">预言家感知：方衡会描述他感受到的气息和意象。你需要自己判断这些描述意味着什么。</p>
<p class="muted">有些气息具有误导性。隐狼看起来可能像好人，机械狼的空洞感可能是前所未有的新东西。不要急于下结论。</p>

<<set _results to Game.prophetResults()>>
<<if _results.length > 0>>
<h3>已探查记录</h3>
<<for _i to 0>>_SHOW
<<if _i < _results.length>>
<<set _r to _results[_i]>>
<p class="muted"><strong><<print GameState.PROFILES[_r.target].name>></strong>（第 <<print _r.day>> 天）：<<print _r.text>></p>
<</if>>
_SHOW
<</for>>
<</if>>

<h3>选择探查目标</h3>
<div class="choice-list">
<<if Game.isAlive('zhou_yang')>>
<<link "探查周阳">><<run Game.prophetCheck('zhou_yang')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "探查唐小棠">><<run Game.prophetCheck('tang_xiaotang')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('zhao_mingcheng')>>
<<link "探查赵明城">><<run Game.prophetCheck('zhao_mingcheng')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('gu_yan')>>
<<link "探查顾言">><<run Game.prophetCheck('gu_yan')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('shen_shen')>>
<<link "探查沈慎">><<run Game.prophetCheck('shen_shen')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('ye_zhiqiu')>>
<<link "探查叶知秋">><<run Game.prophetCheck('ye_zhiqiu')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('fang_heng')>>
<<link "探查方衡（自己）">><<run Game.prophetCheck('fang_heng')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('lin_xiaoman')>>
<<link "探查林小满">><<run Game.prophetCheck('lin_xiaoman')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('su_wan')>>
<<link "探查苏晚">><<run Game.prophetCheck('su_wan')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('jiang_bai')>>
<<link "探查江白">><<run Game.prophetCheck('jiang_bai')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
<<if Game.isAlive('zheng_shoushan')>>
<<link "探查老郑">><<run Game.prophetCheck('zheng_shoushan')>><<goto 'God_Prophet_Result'>><</link>>
<</if>>
</div>
<div class="choice-list">
[[返回|Start]]
</div>
"""
with open(os.path.join(base, 'God_Prophet.twee'), 'w', encoding='utf-8') as f:
    f.write(prophet_content)
print('Rewrote God_Prophet')