# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

passages = {
    'God_Witch.twee': """:: God_Witch
<<run Game.visit()>>
<h2>叶知秋 · 女巫</h2>
<<set _remaining to Game.witchRemaining()>>
<<set _uses to Game.witchUses()>>
<<set _broken to Game.witchBroken()>>

<<if _broken>>
<p class="danger">叶知秋已经精神崩溃了。她的眼神空洞，手指不停地颤抖。她再也无法使用诅咒或还魂的能力。</p>
<div class="choice-list">
[[返回|Start]]
</div>
<<else>>
<p>叶知秋坐在角落，手指无意识地摩挲着一支空注射器。她看到你走近，低声说：</p>
<blockquote>叶知秋：「我能救人，也能杀人。但每一次……都像是从我自己身上剜掉一块。你确定要我动手吗？」</blockquote>
<p class="system-hint">已使用 <strong><<print _uses>>/3</strong> 次。剩余 <strong><<print _remaining>></strong> 次。超过 3 次将精神崩溃。</p>
<p class="muted">她的能力不是药，是诅咒。施加诅咒的人会无疾而终。还魂的人不会记得自己死过——除非有目击者。</p>

<div class="choice-list">
<<if _remaining > 0>>
<h3>施加诅咒（投毒）</h3>
<<if Game.isAlive('zhou_yang')>>
<<link "诅咒周阳">><<run Game.witchCurse('zhou_yang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "诅咒唐小棠">><<run Game.witchCurse('tang_xiaotang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('zhao_mingcheng')>>
<<link "诅咒赵明城">><<run Game.witchCurse('zhao_mingcheng')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('gu_yan')>>
<<link "诅咒顾言">><<run Game.witchCurse('gu_yan')>><<goto 'God_Witch_Result'>><</link>>
<</if>>

<<if Game.isAlive('fang_heng')>>
<h3>还魂（复活）</h3>
<p class="muted">目前无人需要复活。</p>
<</if>>
<<else>>
<p class="danger">她已经没有余力了。再使用一次，就会彻底崩溃。</p>
<</if>>
</div>
<div class="choice-list">
[[返回|Start]]
</div>
<</if>>
""",
    'God_Witch_Result.twee': """:: God_Witch_Result
<<run Game.visit()>>
<h2>诅咒生效</h2>
<<if Game.witchBroken()>>
<p class="danger">叶知秋施完最后一次诅咒后，整个人像被抽空了。她的瞳孔涣散，嘴角不受控制地抽搐。</p>
<blockquote>叶知秋：「我……我看到了。那些被我害死的人。他们都在看着我……」</blockquote>
<p class="system-hint">叶知秋精神崩溃。她永久失去了女巫能力。她的医疗事故黑历史可能被触发，有黑化风险。</p>
<<run Game.revealInfo('ye_zhiqiu', 'witch_broken')>>
<<else>>
<p>叶知秋闭上眼睛，嘴唇无声地翕动。空气中弥漫着某种沉重的气息，像是有什么东西从她身上剥离了。</p>
<p class="system-hint">诅咒已施加。目标将在今夜无疾而终。剩余次数：<strong><<print Game.witchRemaining()>></strong>/3</p>
<</if>>
<div class="choice-list">
[[返回|God_Witch]]
</div>
""",
    'God_Knight.twee': """:: God_Knight
<<run Game.visit()>>
<h2>林小满 · 骑士</h2>
<<if Game.knightWeakened()>>
<p class="danger">林小满虚弱地靠在墙上，上次决斗的消耗还没恢复。她今天无法再发动决斗。</p>
<div class="choice-list">
[[返回|Start]]
</div>
<<else>>
<p>林小满正在擦拭她的折叠小刀。看到你走近，她挑了挑眉：</p>
<blockquote>林小满：「你如果有目标，就告诉我。但我要提醒你——如果我砍错了人，死的会是我。」</blockquote>
<p class="system-hint">骑士决斗：若目标是狼人，斩杀之；若不是，林小满自己死。若目标是狼王，同归于尽。</p>
<p class="warning">决斗后林小满进入虚弱状态，次日无法行动。</p>
<div class="choice-list">
<<if Game.isAlive('zhou_yang')>>
<<link "指认周阳是狼">><<run Game.knightDuel('zhou_yang')>><<goto 'God_Knight_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "指认唐小棠是狼">><<run Game.knightDuel('tang_xiaotang')>><<goto 'God_Knight_Result'>><</link>>
<</if>>
<<if Game.isAlive('zhao_mingcheng')>>
<<link "指认赵明城是狼">><<run Game.knightDuel('zhao_mingcheng')>><<goto 'God_Knight_Result'>><</link>>
<</if>>
<<if Game.isAlive('gu_yan')>>
<<link "指认顾言是狼">><<run Game.knightDuel('gu_yan')>><<goto 'God_Knight_Result'>><</link>>
<</if>>
</div>
<div class="choice-list">
[[返回|Start]]
</div>
<</if>>
""",
    'God_Knight_Result.twee': """:: God_Knight_Result
<<run Game.visit()>>
<<set _result to $game.godSkills.knight>>
<h2>决斗</h2>
<<if not Game.isAlive('lin_xiaoman')>>
<p class="danger">林小满倒下了。她砍错了人，骑士的代价是自己的命。</p>
<blockquote>林小满（最后的话）：「棠棠……对不起……」</blockquote>
<p class="system-hint">林小满死亡。骑士能力消失。好人阵营失去了唯一的武力淘汰手段。</p>
<<else>>
<p>林小满擦掉刀上的血，面无表情地看着倒下的尸体。</p>
<blockquote>林小满：「它果然是狼。干得漂亮，陈默。」</blockquote>
<p class="system-hint">一只狼被斩杀。但林小满现在很虚弱，明天无法行动。</p>
<p class="danger">如果是狼王，林小满会与之同归于尽。</p>
<</if>>
<div class="choice-list">
[[返回|Start]]
</div>
""",
    'God_Prophet.twee': """:: God_Prophet
<<run Game.visit()>>
<h2>方衡 · 预言家</h2>
<p>方衡站在窗边，目光扫过大厅里的每一个人。</p>
<blockquote>方衡：「我能判断一个人的立场。但我说不出他的具体身份。你要我查谁？」</blockquote>
<p class="system-hint">预言家探查：结果显示"盟友"或"敌人"。怀有杀意者显示为敌人。隐狼显示为盟友。</p>

<<set _results to Game.prophetResults()>>
<<if _results.length > 0>>
<h3>已探查结果</h3>
<</if>>

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
</div>
<div class="choice-list">
[[返回|Start]]
</div>
""",
    'God_Prophet_Result.twee': """:: God_Prophet_Result
<<run Game.visit()>>
<h2>探查结果</h2>
<<set _results to Game.prophetResults()>>
<<set _last to _results[_results.length - 1]>>
<<set _targetName to GameState.PROFILES[_last.target].name>>
<p>方衡凝视了许久，缓缓开口：</p>
<<if _last.result is 'enemy'>>
<blockquote>方衡：「<strong><<print _targetName>></strong>——敌人。他身上有杀意。」</blockquote>
<p class="danger">方衡判定 <<print _targetName>> 为敌人。</p>
<<else>>
<blockquote>方衡：「<strong><<print _targetName>></strong>——盟友。他没有杀意。」</blockquote>
<p class="safe">方衡判定 <<print _targetName>> 为盟友。</p>
<</if>>
<p class="muted">注意：隐狼对预言家显示为盟友。此能力无法识别隐狼。</p>
<div class="choice-list">
[[继续探查|God_Prophet]]
[[返回|Start]]
</div>
"""
}

for name, content in passages.items():
    path = os.path.join(base, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Created', name)

print('God skill passages done.')