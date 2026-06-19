# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

# Create Common_NightResolution - AI-driven night kill result
resolution_content = """:: Common_NightResolution
<<set _kill to Game.executeWolfKill()>>
<<run Game.setLastWolfKill(_kill)>>
<<run Game.visit()>>
<<if _kill.killed>>
<<set _targetName to GameState.PROFILES[_kill.target].name>>
<h2>黎明 · 新的死者</h2>
<p>尖叫声把你从梦中惊醒。你冲出房间，看到走廊上已经围了一圈人。</p>
<<if _kill.special is 'body_removed'>>
<p><strong><<print _targetName>></strong> 的房间门大开着，但里面没有尸体。只有大量的血迹和拖拽的痕迹，延伸到走廊尽头就消失了。</p>
<p class="danger">尸体被抹除了。没有尸体，就没有证据。女巫即使有还魂之力，也无处施展。</p>
<p class="system-hint"><<print _targetName>> 被杀。清道夫狼抹除了尸体，女巫无法复活。</p>
<<else>>
<p><strong><<print _targetName>></strong> 倒在自己的房间里。门窗从内部锁死，没有搏斗痕迹。</p>
<p>苏晚检查后摇头：「死亡时间大约在凌晨两点。没有外伤，像是……在睡梦中被某种力量夺走了呼吸。」</p>
<p class="system-hint"><<print _targetName>> 被狼人杀害。</p>
<</if>>
<<if _kill.target is 'su_wan'>>
<<run Game.changeSan(-20)>>
<p class="danger">苏晚死了。你的手在发抖。你蹲下来，握住她已经冰冷的手。天花板上水渍的形状开始变化。</p>
<p class="system-hint">苏晚的死亡让你遭受重创。理智 -20。</p>
<</if>>
<<run Game.changeSan(-10)>>
<p class="system-hint">理智 -10。</p>
<<else>>
<<if _kill.special is 'protected_by_knight'>>
<h2>黎明 · 无人死亡</h2>
<p>你冲出房间时，发现林小满靠在走廊的墙上，手里的小刀上有血。她对你点了点头：</p>
<blockquote>林小满：「昨晚有东西想闯进来。我挡住了。」</blockquote>
<p class="system-hint">昨夜无人死亡。林小满的保护奏效了，但她现在很虚弱。</p>
<<run Game.knightReset()>>
<<else>>
<h2>黎明 · 无人死亡</h2>
<p>走廊很安静。你检查了每一扇门，所有人都还活着。</p>
<p>但你知道，这只是暂时的。狼还在。</p>
<p class="system-hint">昨夜无人死亡。但恐惧不会消失。</p>
<</if>>
<</if>>

<<run Game.addMemory('第 ' + $game.loop + ' 轮第 ' + $game.day + ' 天夜间：' + (_kill.killed ? _kill.targetName + ' 被杀。' : '无人死亡。'))>>

<div class="choice-list">
[[继续新的一天|Common_DayTransition]]
</div>
"""
with open(os.path.join(base, 'Common_NightResolution.twee'), 'w', encoding='utf-8') as f:
    f.write(resolution_content)
print('Created Common_NightResolution')

# Create Common_DayTransition - advances day and routes to next chapter
transition_content = """:: Common_DayTransition
<<run Game.visit()>>
<<set _advanced to Game.advanceDay()>>
<<if _advanced>>
<<set _chapter to 'Chapter03_06_Framework'>>
<<else>>
<<set _chapter to 'Chapter0' + $game.day + '_Hall'>>
<</if>>
<<goto _chapter>>
"""
with open(os.path.join(base, 'Common_DayTransition.twee'), 'w', encoding='utf-8') as f:
    f.write(transition_content)
print('Created Common_DayTransition')

print('Night resolution system done.')