import os

explore_dir = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/chapter03_06'

# Rewrite the old passages to fit the new zone structure
rewrites = {
    'Explore_Attic.twee': """:: Explore_Attic
<<run Game.visitLocation('attic')>>
<<run Game.addItem('old_photo')>>
<<run Game.addClue('laozheng_survivor')>>
<<run Game.addItem('bible')>>
<<run Game.visit()>>
<h2>阁楼</h2>
<p>陡峭的楼梯通向布满灰尘的阁楼。木箱里堆着旧物：褪色的衣服、生锈的玩具、一本破旧圣经。</p>
<p>圣经的扉页写着一行字，墨迹已经发黄：</p>
<blockquote>"愿主宽恕我幸存者的罪。我只看了，没有救。——郑守山"</blockquote>
<p>夹在圣经里的是一张泛黄照片，背景是这座庄园，日期是二十年前。照片上最后一排左边第三个人，长得很像年轻时的老郑。</p>
<p class="thought">陈默（内心）：老郑……他真的是上一轮的幸存者。他知道一切，却一直不说。</p>
<p class="system-hint">你获得了破局线索：老郑的幸存者身份。道具：破旧圣经、泛黄照片。</p>
<div class="choice-list">
[[返回|Map_Main3F]]
</div>
""",
    'Explore_Library.twee': """:: Explore_Library
<<run Game.visitLocation('library')>>
<<run Game.addItem('guest_register')>>
<<run Game.addClue('old_guests')>>
<<run Game.visit()>>
<h2>图书室</h2>
<p>满架的旧书蒙着厚厚的灰。你在前台抽屉里找到一本住客登记簿，上面密密麻麻写满了名字，有些被划掉，旁边标注着日期。</p>
<p>书架深处藏着一本日记，记录着庄园二十年前的往事：曾经有一群大学生在这里失踪，只有一个导游活了下来。</p>
<p>日记的最后一页写着：</p>
<blockquote>"仪式需要十二个人。必须有一个人觉醒，必须有一个人弑神。否则循环不会结束。"</blockquote>
<p class="system-hint">你获得了道具：住客登记簿。线索：之前的客人。</p>
<div class="choice-list">
[[返回|Map_EastWing]]
</div>
""",
    'Explore_Broadcast.twee': """:: Explore_Broadcast
<<run Game.visitLocation('broadcast_room')>>
<<run Game.addItem('cassette_tape')>>
<<run Game.addClue('system_origin')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>广播室</h2>
<p>布满灰尘的广播设备。你按下播放键，一段断断续续的独白传出：</p>
<blockquote>"……系统衰竭了。我们需要新的神。七日一轮，弑神迭代……我就是这么来的。如果你听到这段话，说明我也失败了。别相信任何人，包括你自己……"</blockquote>
<p>声音沙哑，带着绝望。磁带的最后是一声尖叫，然后是静默。</p>
<p class="thought">陈默（内心）：说话的人是上一任"神"。他失败了，被取代了。沈慎取代了他，现在轮到我了吗？</p>
<p class="system-hint">你获得了破局线索：系统的起源。道具：磁带。理智 -5。</p>
<div class="choice-list">
[[返回|Map_EastWing]]
</div>
""",
    'Explore_Courtyard.twee': """:: Explore_Courtyard
<<run Game.visitLocation('courtyard')>>
<<run Game.addClue('mirror_exit')>>
<<run Game.visit()>>
<h2>中庭</h2>
<p>刺骨的风雪。你只能在中庭短暂停留。</p>
<p>你掏出坏掉的指南针——指针剧烈转动，最终稳定指向地下的方向，正是祭祀空间的位置。</p>
<p>中庭中央有一个破碎的镜框，镜面已经不在，但框架的形状与祭坛的镜子完全吻合。似乎庄园的每一面镜子，都连接着同一个出口。</p>
<p class="thought">陈默（内心）：镜子是出口。打碎所有镜子，也许能打开真正的出口。</p>
<p class="system-hint">你获得了破局线索：镜子出口。</p>
<div class="choice-list">
[[返回|Map_Courtyard]]
</div>
""",
    'Explore_Generator.twee': """:: Explore_Generator
<<run Game.visitLocation('generator_room')>>
<<if Game.isAlive('jiang_bai')>>
<<run Game.addItem('wire')>>
<<run Game.addItem('flashlight')>>
<</if>>
<<run Game.visit()>>
<h2>配电室</h2>
<<if Game.isAlive('jiang_bai')>>
<p>江白正在这里检修电路。看到你来，他递过来一截金属丝和修好的手电筒。</p>
<blockquote>江白：「这地方线路老化得厉害。我勉强修好了手电筒，金属丝你拿着，说不定有用。」</blockquote>
<p>他的右手腕又露出来了，那道整齐的旧疤在灯光下格外显眼。</p>
<p class="system-hint">你获得了道具：金属丝、手电筒。</p>
<<else>>
<p>配电室空无一人，设备发出低沉的嗡鸣。没有了江白，这里的电路无人维护。</p>
<</if>>
<div class="choice-list">
[[返回|Map_WestWing]]
</div>
""",
    'Explore_Cellar.twee': """:: Explore_Cellar
<<run Game.visitLocation('cellar_door')>>
<<if not Game.hasClue('ritual_tablet')>>
<<run Game.addClue('cellar_door')>>
<<run Game.addClue('cellar_blood')>>
<<run Game.visit()>>
<h2>地下铁门</h2>
<p>铁门后的楼梯通向黑暗。空气中弥漫着血腥味和某种古老的气息。</p>
<p>门上用红漆写着四个字："天黑请闭眼"。</p>
<p class="thought">陈默（内心）："天黑请闭眼"……这不只是山庄的规矩，这是某种仪式的暗语。</p>
<p class="system-hint">你获得了线索：地下酒窖铁门、酒窖血腥味。</p>
<<else>>
<<run Game.visit()>>
<h2>地下铁门</h2>
<p>铁门敞开着。你已经知道门后是什么了。</p>
<</if>>
<div class="choice-list">
<<if Game.hasClue('cellar_door')>>
[[前往祭祀空间|Explore_Altar]]
<</if>>
[[返回|Map_Underground]]
</div>
"""
}

for fname, content in rewrites.items():
    path = os.path.join(explore_dir, fname)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {fname}')

print('Old exploration passages updated.')
