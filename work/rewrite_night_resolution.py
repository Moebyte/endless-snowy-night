# -*- coding: utf-8 -*-
import os

path = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common/Common_NightResolution.twee'

content = """:: Common_NightResolution
<<set _kill to Game.executeWolfKill()>>
<<run Game.setLastWolfKill(_kill)>>
<<run Game.visit()>>
<<if _kill.killed>>
<<set _actualName to GameState.PROFILES[_kill.actualTarget].name>>

<<if _kill.friendlyFire>>
<h2>黎明 · 狼人自相残杀</h2>
<p>尖叫声把你惊醒。但当你冲出房间时，看到的场景让所有人困惑。</p>
<<if _kill.mutualKill>>
<p>走廊上有两具尸体：<strong><<print _actualName>></strong>（狼王）和 <strong><<print _kill.killerName>></strong>。他们倒在一起，像是互相撕咬致死。</p>
<p>没有人能解释发生了什么。狼人怎么会杀自己人？</p>
<p class="system-hint">狼王 <<print _actualName>> 被同伴误杀，同归于尽。执行者 <<print _kill.killerName>> 也死了。这是魔术师的交换所致——但没有人知道。</p>
<<run Game.changeSan(-5)>>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：' + _actualName + ' 和 ' + _kill.killerName + ' 同归于尽。狼人自相残杀！')>>
<<else>>
<p><strong><<print _actualName>></strong> 倒在血泊中。但他/她不是被狼人猎杀的目标——尸体上的伤痕来自狼的爪牙。</p>
<p>没有人知道为什么狼人杀了自己人。</p>
<p class="system-hint">一只狼被同伴误杀。这是魔术师交换的结果——但没有人知道。</p>
<<run Game.changeSan(-5)>>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：' + _actualName + ' 被同伴误杀。')>>
<</if>>

<<elseif _kill.special is 'body_removed'>>
<h2>黎明 · 消失的尸体</h2>
<p><strong><<print _actualName>></strong> 的房间门大开着，但里面没有尸体。只有大量的血迹和拖拽的痕迹，延伸到走廊尽头就消失了。</p>
<p class="danger">尸体被抹除了。没有尸体，就没有证据。女巫即使有还魂之力，也无处施展。</p>
<p class="system-hint"><<print _actualName>> 被杀。清道夫狼抹除了尸体，女巫无法复活。</p>
<<run Game.changeSan(-10)>>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：' + _actualName + ' 被杀，尸体被抹除。')>>

<<else>>
<h2>黎明 · 新的死者</h2>
<p>尖叫声把你从梦中惊醒。你冲出房间，看到走廊上已经围了一圈人。</p>
<p><strong><<print _actualName>></strong> 倒在自己的房间里。门窗从内部锁死，没有搏斗痕迹。</p>
<p>苏晚检查后摇头：「死亡时间大约在凌晨两点。没有外伤，像是……在睡梦中被某种力量夺走了呼吸。」</p>
<p class="system-hint"><<print _actualName>> 被狼人杀害。</p>

<<if _kill.actualTarget is 'su_wan'>>
<<run Game.changeSan(-20)>>
<p class="danger">苏晚死了。你的手在发抖。你蹲下来，握住她已经冰冷的手。天花板上水渍的形状开始变化。</p>
<p class="system-hint">苏晚的死亡让你遭受重创。理智 -20。</p>
<<elseif _kill.actualTarget is 'jiang_bai'>>
<<run Game.changeSan(-15)>>
<p class="danger">江白死了。你的室友，你的死党。他右手腕上的旧疤在晨光中格外刺眼。</p>
<p class="system-hint">江白的死亡让你遭受重创。理智 -15。</p>
<<else>>
<<run Game.changeSan(-10)>>
<</if>>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：' + _actualName + ' 被杀。')>>
<</if>>

<<else>>
<<if _kill.special is 'protected_by_knight'>>
<h2>黎明 · 无人死亡</h2>
<p>你冲出房间时，发现林小满靠在走廊的墙上，手里的小刀上有血。她对你点了点头：</p>
<blockquote>林小满：「昨晚有东西想闯进来。我挡住了。」</blockquote>
<p class="system-hint">昨夜无人死亡。林小满的保护奏效了，但她现在很虚弱。</p>
<<run Game.knightReset()>>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：林小满保护了某人，无人死亡。')>>
<<else>>
<h2>黎明 · 无人死亡</h2>
<p>走廊很安静。你检查了每一扇门，所有人都还活着。</p>
<p>但你知道，这只是暂时的。狼还在。</p>
<p class="system-hint">昨夜无人死亡。但恐惧不会消失。</p>
<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：无人死亡。')>>
<</if>>
<</if>>

<div class="choice-list">
[[继续新的一天|Common_DayTransition]]
</div>
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Rewrote Common_NightResolution with swap/friendly-fire/body-removed handling')