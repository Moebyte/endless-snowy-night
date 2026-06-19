# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

witch_content = """:: God_Witch
<<run Game.visit()>>
<h2>叶知秋 · 女巫</h2>
<<set _remaining to Game.witchRemaining()>>
<<set _uses to Game.witchUses()>>
<<set _broken to Game.witchBroken()>>
<<set _sensed to Game.witchGetSensedDeath()>>

<<if _broken>>
<p class="danger">叶知秋已经精神崩溃了。她的眼神空洞，手指不停地颤抖。她再也无法使用诅咒或还魂的能力。</p>
<div class="choice-list">
[[返回|God_Panel]]
</div>
<<else>>
<p>叶知秋坐在角落，手指无意识地摩挲着一支空注射器。</p>
<blockquote>叶知秋：「我能感知生命的流逝。如果有人死了，我会知道。我能把生命推回去——但每一次，都是从我自己身上剜掉一块。」</blockquote>

<hr>
<h3>生命感知</h3>
<<if _sensed>>
<p class="warning">叶知秋感知到：<strong><<print GameState.PROFILES[_sensed].name>></strong> 正在死去。她可以在今夜将生命推回去。</p>
<<if _remaining > 0>>
<div class="choice-list">
<<link "还魂 <<print GameState.PROFILES[_sensed].name>>（消耗 1 次）">><<run Game.witchRevive(_sensed, false)>><<goto 'God_Witch_Result'>><</link>>
<<link "在众人面前还魂（会暴露身份）">><<run Game.witchRevive(_sensed, true)>><<goto 'God_Witch_Result'>><</link>>
</div>
<<else>>
<p class="danger">但她已经没有余力了。再使用一次就会崩溃。</p>
<</if>>
<<else>>
<p class="muted">目前没有感知到生命流逝。</p>
<</if>>

<hr>
<h3>诅咒与还魂（已用 <<print _uses>>/3）</h3>
<<if _remaining > 0>>
<p class="muted">诅咒是神力，直接夺走生命。还魂是神力，将生命推回。合计 3 次/轮。</p>
<div class="choice-list">
<<if Game.isAlive('zhou_yang')>>
<<link "诅咒周阳（杀人）">><<run Game.witchCurse('zhou_yang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "诅咒唐小棠（杀人）">><<run Game.witchCurse('tang_xiaotang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('zhao_mingcheng')>>
<<link "诅咒赵明城（杀人）">><<run Game.witchCurse('zhao_mingcheng')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('gu_yan')>>
<<link "诅咒顾言（杀人）">><<run Game.witchCurse('gu_yan')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
</div>
<<else>>
<p class="danger">诅咒/还魂额度已用完。</p>
<</if>>

<hr>
<h3>毒药制作（不消耗额度，需要材料）</h3>
<<set _mats to $game.godSkills.witch.materials>>
<p class="muted">材料：药瓶 <<print _mats.medicine_bottle || 0>> | 注射器 <<print _mats.syringe || 0>> | 草药束 <<print _mats.herb_bundle || 0>> | 化学试剂 <<print _mats.chemical_vial || 0>></p>
<div class="choice-list">
<<if Game.witchCanCraft('sleeping_potion')>>
<<link "制作安眠药（药瓶 x1）">><<run Game.witchCraftPotion('sleeping_potion')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.witchCanCraft('paralytic')>>
<<link "制作麻痹剂（药瓶 x1 + 注射器 x1）">><<run Game.witchCraftPotion('paralytic')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.witchCanCraft('deep_sedative')>>
<<link "制作强效镇静剂（注射器 + 草药 + 试剂）">><<run Game.witchCraftPotion('deep_sedative')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.witchCanCraft('truth_serum')>>
<<link "制作吐真剂（草药 + 试剂）">><<run Game.witchCraftPotion('truth_serum')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
</div>
<p class="muted">材料可通过探索庄园（餐厅、主卧、温室、工坊）获得。</p>

<hr>
<h3>使用毒药</h3>
<<set _pots to $game.godSkills.witch.potions>>
<div class="choice-list">
<<if _pots.sleeping_potion > 0>>
<<if Game.isAlive('zhou_yang')>>
<<link "对周阳使用安眠药">><<run Game.witchUsePotion('sleeping_potion', 'zhou_yang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "对唐小棠使用安眠药">><<run Game.witchUsePotion('sleeping_potion', 'tang_xiaotang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<</if>>
<<if _pots.paralytic > 0>>
<<if Game.isAlive('zhou_yang')>>
<<link "对周阳使用麻痹剂">><<run Game.witchUsePotion('paralytic', 'zhou_yang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<<if Game.isAlive('tang_xiaotang')>>
<<link "对唐小棠使用麻痹剂">><<run Game.witchUsePotion('paralytic', 'tang_xiaotang')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<</if>>
<<if _pots.deep_sedative > 0>>
<<if Game.isAlive('zhao_mingcheng')>>
<<link "对赵明城使用强效镇静剂">><<run Game.witchUsePotion('deep_sedative', 'zhao_mingcheng')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<</if>>
<<if _pots.truth_serum > 0>>
<<if Game.isAlive('gu_yan')>>
<<link "对顾言使用吐真剂">><<run Game.witchUsePotion('truth_serum', 'gu_yan')>><<goto 'God_Witch_Result'>><</link>>
<</if>>
<</if>>
</div>

<hr>
<h3>治愈重伤</h3>
<<if $game.pursuit and $game.pursuit.playerInjured>>
<p class="warning">你在追击战中受了伤。叶知秋可以治愈你，但这会暴露她的女巫身份。</p>
<div class="choice-list">
<<link "让叶知秋治愈重伤（暴露身份）">><<run Game.witchHeal('chen_mo')>><<goto 'God_Witch_Result'>><</link>>
</div>
<<else>>
<p class="muted">目前没有需要治愈的重伤。</p>
<</if>>

<</if>>

<div class="choice-list">
[[返回神职面板|God_Panel]]
</div>
"""
with open(os.path.join(base, 'God_Witch.twee'), 'w', encoding='utf-8') as f:
    f.write(witch_content)
print('Rewrote God_Witch')

# Rewrite God_Witch_Result
result_content = """:: God_Witch_Result
<<run Game.visit()>>
<<if Game.witchBroken()>>
<h2>精神崩溃</h2>
<p class="danger">叶知秋施完最后一次能力后，整个人像被抽空了。她的瞳孔涣散，嘴角不受控制地抽搐。</p>
<blockquote>叶知秋：「我……我看到了。那些被我害死的人。他们都在看着我……」</blockquote>
<p class="system-hint">叶知秋精神崩溃。她永久失去了女巫能力。她的医疗事故黑历史可能被触发，有黑化风险。</p>
<<run Game.revealInfo('ye_zhiqiu', 'witch_broken')>>
<<else>>
<h2>完成</h2>
<p>叶知秋闭上眼睛，嘴唇无声地翕动。空气中弥漫着某种沉重的气息，像是有什么东西从她身上剥离了。</p>
<p class="system-hint">能力已施展。诅咒/还魂剩余：<strong><<print Game.witchRemaining()>></strong>/3</p>
<</if>>
<div class="choice-list">
[[返回女巫面板|God_Witch]]
</div>
"""
with open(os.path.join(base, 'God_Witch_Result.twee'), 'w', encoding='utf-8') as f:
    f.write(result_content)
print('Rewrote God_Witch_Result')