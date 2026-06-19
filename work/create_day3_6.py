import os

ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md'
PASSAGE_DIR = os.path.join(ROOT, 'src', 'passages', 'chapter03_06')

files = {
    'Chapter03_Start.twee': """:: Chapter03_Start
<<set $game.day to 3>>
<<set $game.time to '06:00'>>
<<run Game.addMemory('这是第 ' + $game.loop + ' 轮的第 3 天。我开始习惯这种重复。')>>
<<run Game.visit()>>
<h2>Day 3 路 习惯的深渊</h2>
<p>再次醒来。</p>
<p>天花板上的水渍还是那张闭着眼的人脸。床头柜上还是那行字：23:00 前，必须回到房间。</p>
<p>你已经知道今天会发生什么：苏晚会给大家做体检，周阳会把手插在口袋里，沈慎会坐在角落，顾言会在纸上写写画画。</p>
<p>但你也知道，有些东西正在改变。每次轮回，你的记忆都在累加。每次轮回，你都比上一次多知道一点。</p>
<p class="thought">陈默（内心）：不能再被动了。今天必须去地下酒窖，必须搞清楚那扇铁门后面是什么。</p>
<p class="system-hint">进入第 3 天。你可以利用已获得的线索主动调查。</p>
<div class="choice-list">
[[去大厅集合|Chapter03_Hall]]
</div>
""",
    'Chapter03_Hall.twee': """:: Chapter03_Hall
<<set $game.time to '09:00'>>
<<run Game.visit()>>
<h2>Day 3 路 大厅</h2>
<p>大厅里弥漫着焦虑和饥饿。干粮只够两天，这是每个人心里都算得清的账。</p>
<p>苏晚低声对你说：「你今天脸色更差了。是不是又没睡好？」</p>
<p>你摇摇头，把注意力投向人群。你可以选择调查方向。</p>
<div class="choice-list">
<<if Game.hasItem('old_key')>>
[[用旧钥匙去地下酒窖|Chapter03_Cellar]]
<</if>>
[[找沈慎谈话|Chapter03_ShenShen]]
[[找方衡谈话|Chapter03_FangHeng]]
[[等到晚上，观察安全屋规则|Chapter03_NightReturn]]
</div>
""",
    'Chapter03_Cellar.twee': """:: Chapter03_Cellar
<<set $game.time to '14:00'>>
<<run Game.addClue('ritual_tablet')>>
<<run Game.addClue('recruitment_tablet')>>
<<run Game.revealInfo('shen_shen', 'cellar_connection')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>Day 3 路 祭坛空间</h2>
<p>旧钥匙插进铁门的锁孔，发出干涩的转动声。</p>
<p>门后不是酒窖，而是一个低矮的地下空间。墙壁上刻满了名字，有些已经模糊，有些还很新。</p>
<p>中央有一块倾斜的石碑，上面刻着规则：</p>
<blockquote><strong>「七日为一轮。轮末未出神者，循环重置。神死者，其力归弑神者。」</strong></blockquote>
<p>另一块较小的石碑上刻着一串名单，最下方有一个你熟悉的名字：</p>
<blockquote><strong>「陈默——候选继承者。」</strong></blockquote>
<p class="thought">陈默（内心）：候选继承者？这个山庄不是在杀人，是在筛选新的"神"。</p>
<p>你注意到角落里有一张掉落的赌场工作证，照片上是沈慎。他来过这里——不止一次。</p>
<p class="system-hint">你获得了线索：规则石碑、招募名单。你推理出沈慎与这个空间有关。</p>
<div class="choice-list">
[[返回大厅|Chapter03_NightReturn]]
</div>
""",
    'Chapter03_ShenShen.twee': """:: Chapter03_ShenShen
<<set $game.time to '11:00'>>
<<run Game.revealInfo('shen_shen', 'gambler')>>
<<run Game.changeTrust('shenshen', -5)>>
<<run Game.visit()>>
<h2>Day 3 路 沈慎</h2>
<p>沈慎坐在壁炉边的阴影里，手指不停地敲击着膝盖。</p>
<p>你走过去，在他对面坐下：「你以前来过这种地方吗？」</p>
<p>他的动作停了一瞬，然后笑了：「小兄弟，我这种人，去过的地下场子比你上的课还多。」</p>
<p>他没有正面回答，但你知道他在暗示什么。一个赌鬼，对规则和概率的敏感远超常人。他在观察局势，等待下注的时机。</p>
<p class="system-hint">你解锁了沈慎的隐藏信息：地下赌场荷官，资深赌鬼。</p>
<div class="choice-list">
[[返回大厅|Chapter03_Hall]]
</div>
""",
    'Chapter03_FangHeng.twee': """:: Chapter03_FangHeng
<<set $game.time to '11:00'>>
<<run Game.revealInfo('fang_heng', 'zhao_connection')>>
<<run Game.changeTrust('fang_heng', 5)>>
<<run Game.visit()>>
<h2>Day 3 路 方衡</h2>
<p>方衡站在窗边，像是在观察外面的雪。</p>
<p>你走过去：「你和赵明城不是第一次见面吧？」</p>
<p>他转过头，目光平静：「你怎么看出来的？」</p>
<p>「你们之间的眼神。不是陌生人。」你说。</p>
<p>方衡沉默片刻，说：「我是市刑警支队的。赵明城是我这次要跟的人。但我也没想到会困在这里。」</p>
<p class="system-hint">你解锁了方衡的隐藏信息：与赵明城相识，此行另有目的。</p>
<div class="choice-list">
[[返回大厅|Chapter03_NightReturn]]
</div>
""",
    'Chapter03_NightReturn.twee': """:: Chapter03_NightReturn
<<set $game.time to '23:00'>>
<<run Game.visit()>>
<h2>Day 3 路 23:00</h2>
<p>钟声再次响起。安全屋规则生效。</p>
<p>你知道狼人今晚只能强闯一间房。问题是：他们会选哪一间？</p>
<div class="choice-list">
[[独自回房，用柜子抵住门|Chapter04_Start][$game.flags.night3_choice to 'alone']]
[[和苏晚待在一起|Chapter04_Start][$game.flags.night3_choice to 'suwan']]
[[去找江白，两人互相照应|Chapter04_Start][$game.flags.night3_choice to 'jiangbai']]
</div>
""",
    'Chapter04_Start.twee': """:: Chapter04_Start
<<set $game.day to 4>>
<<set $game.time to '06:00'>>
<<run Game.addMemory('第 4 天。安全屋规则第一次真正威胁到我。')>>
<<run Game.visit()>>
<h2>Day 4 路 06:00</h2>
<<if $game.flags.night3_choice is 'alone'>>
<p>你独自熬过了夜晚。柜子抵着门，外面有脚步声，但没有停在你的门前。</p>
<p>你感到一阵虚脱。独自守夜消耗了你的精神。</p>
<<run Game.changeSan(-5)>>
<<elseif $game.flags.night3_choice is 'suwan'>>
<p>你和苏晚互相守夜。凌晨时分，走廊里传来沉重的脚步声，停在了隔壁房间门口。</p>
<p>苏晚紧紧抓住你的手。脚步声很快远去，但你们都知道，隔壁的人逃过了一劫。</p>
<<run Game.changeTrust('su_wan', 10)>>
<<else>>
<p>你和江白轮流守夜。他右手腕上的旧伤在灯光下格外明显。</p>
<p>你问他：「这真的是车祸划的？」</p>
<p>江白沉默了很久，说：「不是。是小时候……被玻璃划的。」</p>
<p>他的回答没有解开你的疑惑，反而让那道伤痕显得更加刻意。</p>
<<run Game.addClue('jiangbai_scar')>>
<</if>>
<p class="system-hint">你活到了第 4 天。昨夜的选择产生了后果。</p>
<div class="choice-list">
[[去大厅|Chapter04_Hall]]
</div>
""",
    'Chapter04_Hall.twee': """:: Chapter04_Hall
<<set $game.time to '09:00'>>
<<run Game.visit()>>
<h2>Day 4 路 互相试探</h2>
<p>大厅里的气氛更紧张了。昨晚有人试图闯入一间房——门上有新的抓痕。</p>
<p>周阳第一个开口：「我们得主动出击。谁知道规则，谁就活着。」</p>
<p>林小满冷笑：「出击？出去喂狼吗？」</p>
<p>你可以选择继续调查某个人。</p>
<div class="choice-list">
[[观察周阳的一举一动|Chapter04_ZhouYang]]
[[注意唐小棠的状态|Chapter04_TangXiaotang]]
[[和顾言讨论规则石碑|Chapter04_GuYan]]
[[等到晚上|Chapter04_NightReturn]]
</div>
""",
    'Chapter04_ZhouYang.twee': """:: Chapter04_ZhouYang
<<set $game.time to '12:00'>>
<<run Game.revealInfo('zhou_yang', 'aggressive')>>
<<run Game.addClue('zhouyang_pocket')>>
<<run Game.visit()>>
<h2>Day 4 路 周阳</h2>
<p>周阳站在壁炉前，右手始终插在口袋里。你发现他看人的方式不像运动员，更像捕食者在评估猎物。</p>
<p>他说：「陈默，你这几天太安静了。你是不是知道什么？」</p>
<p>你反问：「你为什么总把手插在口袋里？」</p>
<p>他的笑容僵了一瞬，然后把手抽出来——掌心有一道新鲜的擦伤。</p>
<p>「昨晚推门的时候划的。」他说，「我试过救人，没成功。」</p>
<p class="system-hint">你标记周阳为好胜、攻击性强的可疑对象。他的口袋引起了你的注意。</p>
<div class="choice-list">
[[返回大厅|Chapter04_NightReturn]]
</div>
""",
    'Chapter04_TangXiaotang.twee': """:: Chapter04_TangXiaotang
<<set $game.time to '12:00'>>
<<run Game.revealInfo('tang_xiaotang', 'unstable')>>
<<run Game.changeTrust('tang_xiaotang', -5)>>
<<run Game.visit()>>
<h2>Day 4 路 唐小棠</h2>
<p>唐小棠坐在角落，手指无意识地抠着袖口。林小满一直在她身边，像一只要炸毛的猫。</p>
<p>你走过去，她抬头看你，眼神有一瞬间的空洞。</p>
<p>「学长，」她说，「你有没有想过，如果这里的人都是被选中的，那选中我们的东西……想看什么？」</p>
<p>她的声音很轻，但话里的东西让你后背发凉。</p>
<p class="system-hint">你注意到唐小棠精神状态不稳定。她与林小满的关系远超普通闺蜜。</p>
<div class="choice-list">
[[返回大厅|Chapter04_NightReturn]]
</div>
""",
    'Chapter04_GuYan.twee': """:: Chapter04_GuYan
<<set $game.time to '12:00'>>
<<run Game.revealInfo('gu_yan', 'observer')>>
<<run Game.changeTrust('gu_yan', 5)>>
<<run Game.visit()>>
<h2>Day 4 路 顾言</h2>
<p>顾言的纸上写满了符号和公式。你发现他在尝试用物理学推导这个山庄的"规则"。</p>
<p>「如果规则能被写出来，就能被破解。」他说，「问题是，我们不知道规则的全部变量。」</p>
<p>你提到地下酒窖的石碑，他的眼睛亮了起来：「候选继承者？这像是某种……系统迭代。旧的"神"死了，新的"神"继位。」</p>
<p class="system-hint">你发现顾言在理性分析规则。他渴望证明自己。</p>
<div class="choice-list">
[[返回大厅|Chapter04_NightReturn]]
</div>
""",
    'Chapter04_NightReturn.twee': """:: Chapter04_NightReturn
<<set $game.time to '23:00'>>
<<run Game.visit()>>
<h2>Day 4 路 23:00</h2>
<p>今晚的气氛不同了。每个人都清楚，狼人已经尝过血的味道。</p>
<p>你听到楼下有争吵声，然后是赵明城的声音：「各自锁好门。别做英雄。」</p>
<div class="choice-list">
[[守在苏晚和唐小棠房间外|Chapter05_Start][$game.flags.night4_choice to 'guard']]
[[跟踪周阳|Chapter05_Start][$game.flags.night4_choice to 'follow']]
[[回自己房间锁门|Chapter05_Start][$game.flags.night4_choice to 'hide']]
</div>
""",
    'Chapter05_Start.twee': """:: Chapter05_Start
<<set $game.day to 5>>
<<set $game.time to '06:00'>>
<<run Game.addMemory('第 5 天。人数开始减少。')>>
<<run Game.visit()>>
<h2>Day 5 路 06:00</h2>
<<if $game.flags.night4_choice is 'guard'>>
<p>你守在走廊里，直到天亮。没有人来袭击苏晚和唐小棠的房间。</p>
<p>但当你下楼时，发现顾言的房间门大开。他倒在书桌前，手里还攥着写满公式的纸。</p>
<p>没有外伤。像是被某种力量从内部停止了呼吸。</p>
<<run Game.kill('gu_yan')>>
<<run Game.changeSan(-10)>>
<<elseif $game.flags.night4_choice is 'follow'>>
<p>你悄悄跟在周阳身后。他在走廊尽头停下，敲了敲一扇门。</p>
<p>门开了一条缝，你看见赵明城的脸。然后你踩到了一块松动的地板。</p>
<p>周阳猛地回头。你转身跑回房间，心脏狂跳。</p>
<p>天亮后，所有人都活着。但你知道，自己已经暴露了一部分。</p>
<<run Game.setFlag('zhou_zhao_meeting')>>
<<run Game.changeSan(-5)>>
<<else>>
<p>你锁好门，用被子蒙住头。半夜，走廊里传来一声闷响，然后是重物倒地的声音。</p>
<p>天亮后，叶知秋的房间门开着。她倒在门口，手里握着一支空了的注射器。</p>
<p>苏晚检查后摇头：「没有中毒迹象。像是心脏骤停。」</p>
<<run Game.kill('ye_zhiqiu')>>
<<run Game.changeSan(-10)>>
<</if>>
<p class="system-hint">第 5 天。你的选择决定了谁活过昨晚。</p>
<div class="choice-list">
[[去大厅|Chapter05_Hall]]
</div>
""",
    'Chapter05_Hall.twee': """:: Chapter05_Hall
<<set $game.time to '09:00'>>
<<run Game.visit()>>
<h2>Day 5 路 崩解</h2>
<p>死亡让所有人濒临崩溃。赵明城提议把所有人集中到一个房间过夜，但方衡反对：「集中就是给狼人一锅端。」</p>
<p>你可以利用混乱继续收集信息。</p>
<div class="choice-list">
<<if Game.isAlive('ye_zhiqiu')>>
[[向叶知秋请教急救与毒药|Chapter05_YeZhiqiu]]
<</if>>
[[观察林小满的保护行为|Chapter05_LinXiaoman]]
[[质问赵明城昨晚的去向|Chapter05_ZhaoMingcheng]]
[[等到晚上|Chapter05_NightReturn]]
</div>
""",
    'Chapter05_YeZhiqiu.twee': """:: Chapter05_YeZhiqiu
<<set $game.time to '12:00'>>
<<run Game.revealInfo('ye_zhiqiu', 'medical_background')>>
<<run Game.changeTrust('ye_zhiqiu', 5)>>
<<run Game.visit()>>
<h2>Day 5 路 叶知秋</h2>
<p>叶知秋正在整理药箱。她的手指修长而稳定，但眼神里有一种你看不懂的疲惫。</p>
<p>「我以前是医学院的学生。」她说，「后来出了事故，退学了。」</p>
<p>她没有说是什么事故。但你注意到她处理药品的方式极其专业——专业到让人不安。</p>
<p class="system-hint">你解锁了叶知秋的隐藏信息：前医学院学生，因医疗事故退学。</p>
<div class="choice-list">
[[返回大厅|Chapter05_NightReturn]]
</div>
""",
    'Chapter05_LinXiaoman.twee': """:: Chapter05_LinXiaoman
<<set $game.time to '12:00'>>
<<run Game.revealInfo('lin_xiaoman', 'protector')>>
<<run Game.changeTrust('lin_xiaoman', 5)>>
<<run Game.visit()>>
<h2>Day 5 路 林小满</h2>
<p>林小满一直守在唐小棠身边。你注意到她的右手始终握着某种东西——一把折叠小刀。</p>
<p>「别告诉任何人。」她说，「我不是坏人。我只是要保护棠棠。」</p>
<p>「你们是什么关系？」</p>
<p>她沉默了一下：「她没有别人了。」</p>
<p class="system-hint">你解锁了林小满的隐藏信息：唐小棠的闺蜜，极度护短，具备武力值。</p>
<div class="choice-list">
[[返回大厅|Chapter05_NightReturn]]
</div>
""",
    'Chapter05_ZhaoMingcheng.twee': """:: Chapter05_ZhaoMingcheng
<<set $game.time to '12:00'>>
<<run Game.revealInfo('zhao_mingcheng', 'ruthless')>>
<<run Game.changeTrust('zhao_mingcheng', -10)>>
<<run Game.visit()>>
<h2>Day 5 路 赵明城</h2>
<p>赵明城面对你的质问，只是笑了笑：「年轻人，在这种地方，知道得太多不是好事。」</p>
<p>他的态度不像被困的旅客，更像一个已经看过剧本的人。</p>
<p>「你和方衡到底来做什么？」你追问。</p>
<p>他没有回答，但眼神里的东西让你确定：他知道的远比他说出来的多。</p>
<p class="system-hint">你确定赵明城冷酷、掌控欲强，与方衡有秘密联系。</p>
<div class="choice-list">
[[返回大厅|Chapter05_NightReturn]]
</div>
""",
    'Chapter05_NightReturn.twee': """:: Chapter05_NightReturn
<<set $game.time to '23:00'>>
<<run Game.visit()>>
<h2>Day 5 路 23:00</h2>
<p>第 5 个夜晚。安全屋规则依然有效，但信任已经碎裂。</p>
<p>你意识到，今晚的选择可能决定谁能活到第 7 天。</p>
<div class="choice-list">
[[保护苏晚|Chapter06_Start][$game.flags.night5_choice to 'suwan']]
[[保护江白|Chapter06_Start][$game.flags.night5_choice to 'jiangbai']]
[[独自躲藏|Chapter06_Start][$game.flags.night5_choice to 'hide']]
</div>
""",
    'Chapter06_Start.twee': """:: Chapter06_Start
<<set $game.day to 6>>
<<set $game.time to '06:00'>>
<<run Game.addMemory('第 6 天。离第 7 天只剩一次黑夜。')>>
<<run Game.visit()>>
<h2>Day 6 路 06:00</h2>
<<if $game.flags.night5_choice is 'suwan'>>
<p>你守在苏晚门前。半夜，你听见走廊尽头传来搏斗声。</p>
<p>天快亮时，林小满从阴影里走出来，手里的小刀上有血。她看了你一眼，没说话。</p>
<p>没有人死。但你知道，昨夜有人试图进入某个房间，被挡住了。</p>
<<run Game.changeTrust('su_wan', 10)>>
<<run Game.changeTrust('lin_xiaoman', 10)>>
<<elseif $game.flags.night5_choice is 'jiangbai'>>
<p>你和江白守在一起。凌晨，门被猛烈撞击，但你们用家具死死抵住。</p>
<p>撞击持续了十分钟，然后停止。门外传来一声低笑，然后是远去的脚步声。</p>
<p>「他们今晚不会只来一次的。」江白说，声音发抖。</p>
<<run Game.changeTrust('jiangbai', 10)>>
<<run Game.changeSan(-5)>>
<<else>>
<p>你躲在房间里，听着外面的动静。有脚步声，有低语，但没有撞击你的门。</p>
<p>天亮后，你发现走廊里有血迹，但不知道是谁的。</p>
<<run Game.changeSan(-10)>>
<</if>>
<p class="system-hint">第 6 天。明天就是第 7 天，结局之日。</p>
<div class="choice-list">
[[去大厅做最后准备|Chapter06_Hall]]
</div>
""",
    'Chapter06_Hall.twee': """:: Chapter06_Hall
<<set $game.time to '09:00'>>
<<run Game.visit()>>
<h2>Day 6 路 最后一日</h2>
<p>大厅里剩下的人已经不多了。每个人都知道，明天就是第 7 天。</p>
<p>你可以做最后的调查，或者直接为第 7 天做准备。</p>
<div class="choice-list">
<<if Game.hasClue('ritual_tablet') and Game.hasClue('recruitment_tablet')>>
[[整理所有线索，准备进入祭坛空间|Chapter06_PrepareRitual]]
<</if>>
[[观察剩余人员的阵营|Chapter06_Observe]]
[[保存体力，等待夜幕降临|Chapter06_NightReturn]]
</div>
""",
    'Chapter06_PrepareRitual.twee': """:: Chapter06_PrepareRitual
<<set $game.time to '14:00'>>
<<run Game.setFlag('prepared_ritual')>>
<<run Game.changeSan(5)>>
<<run Game.visit()>>
<h2>Day 6 路 备战</h2>
<p>你把石碑上的规则整理成清晰的结论：</p>
<blockquote><strong>1. 七日一轮。</strong><br><strong>2. 神死者，力归弑神者。</strong><br><strong>3. 候选继承者可以拒绝成神。</strong></blockquote>
<p>你意识到，好结局的关键不是杀光狼人，而是在第 7 天带着幸存者进入祭坛空间，打破轮回。</p>
<p class="system-hint">你准备好了进入祭坛空间。第 7 天将可以尝试好结局。</p>
<div class="choice-list">
[[返回大厅|Chapter06_NightReturn]]
</div>
""",
    'Chapter06_Observe.twee': """:: Chapter06_Observe
<<set $game.time to '14:00'>>
<<run Game.revealInfo('zhou_yang', 'wolf_king')>>
<<run Game.revealInfo('tang_xiaotang', 'hidden_wolf')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>Day 6 路 阵营</h2>
<p>你把所有线索拼凑在一起：</p>
<p>周阳的攻击性、口袋里藏着的刀、他看人的方式——他是狼群的首领。</p>
<p>唐小棠的精神状态、她对规则的异常敏感、林小满对她的过度保护——她是隐藏在村民中的狼。</p>
<p>你不敢完全确定，但到了这一步，你必须下注。</p>
<p class="system-hint">你推理出周阳和唐小棠的隐藏身份。理智 -5。</p>
<div class="choice-list">
[[返回大厅|Chapter06_NightReturn]]
</div>
""",
    'Chapter06_NightReturn.twee': """:: Chapter06_NightReturn
<<set $game.time to '23:00'>>
<<run Game.visit()>>
<h2>Day 6 路 23:00</h2>
<p>最后一个夜晚。</p>
<p>你锁好门，把旧钥匙攥在手心。明天，要么走出暴风雪，要么开始下一轮。</p>
<p>你闭上眼睛，等待 06:00 的到来。</p>
<div class="choice-list">
[[进入第 7 天|Chapter03_06_Framework]]
</div>
"""
}

os.makedirs(PASSAGE_DIR, exist_ok=True)
for name, content in files.items():
    path = os.path.join(PASSAGE_DIR, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created {path}')

# Update Chapter02_Outcome link
ch02_outcome_path = os.path.join(ROOT, 'src', 'passages', 'chapter02', 'Chapter02_Outcome.twee')
with open(ch02_outcome_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('[[继续|Chapter03_06_Framework]]', '[[继续|Chapter03_Start]]')
with open(ch02_outcome_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Updated {ch02_outcome_path}')

print('Day 3-6 passages created.')
