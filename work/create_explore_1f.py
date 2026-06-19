import os

explore_dir = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/chapter03_06'

passages = {
    'Explore_GrandHall.twee': """:: Explore_GrandHall
<<run Game.visitLocation('grand_hall')>>
<<run Game.visit()>>
<h2>大厅</h2>
<p>壁炉里的火劈啪作响。前台是一张沉重的橡木桌，上面挂满了房间钥匙，每把钥匙都系着一条褪色的绸带，编号从 1 到 12。</p>
<p>墙上挂着一幅巨大的油画：庄园建成时的样子。画里的天空是蓝色的，花园里开满玫瑰，完全不像现在这样被风雪吞没。</p>
<p>角落里有一台老式座钟，钟摆有节奏地摆动。时间永远停在 11:58。</p>
<p class="thought">陈默（内心）：11:58……还有两分钟到午夜。然后是 23:00 的规则。这个庄园的时间是不是被设计过的？</p>
<div class="choice-list">
[[检查前台抽屉|Search_FrontDesk]]
[[细看那幅油画|Search_Painting]]
[[返回|Map_Main1F]]
</div>""",
    'Search_FrontDesk.twee': """:: Search_FrontDesk
<<run Game.addItem('guest_register')>>
<<run Game.addClue('old_guests')>>
<<run Game.visit()>>
<h2>前台抽屉</h2>
<p>抽屉没有上锁。里面是一本厚厚的住客登记簿，纸页发黄。</p>
<p>你翻开最近几页。上面写着不同年份的住客名字，有些名字被划掉了，旁边标注着简短的备注：</p>
<blockquote>"2019.1 — 6人入住，1人离开。"<br>"2020.7 — 4人入住，0人离开。"<br>"2021.3 — 8人入住，2人离开。"</blockquote>
<p>最新一页是空的，等待新的住客登记。</p>
<p class="system-hint">你获得了道具：住客登记簿。线索：之前的客人。</p>
<div class="choice-list">
[[返回大厅|Explore_GrandHall]]
</div>""",
    'Search_Painting.twee': """:: Search_Painting
<<run Game.addClue('fang_temperature')>>
<<run Game.visit()>>
<h2>油画</h2>
<p>你凑近细看那幅油画。画中庄园的窗户里隐约有人影，其中一个窗台边站着一个人，穿着深色大衣——和方衡的穿着一模一样。</p>
<p>你揉了揉眼睛再看，人影已经不见了。</p>
<p class="thought">陈默（内心）：是错觉吗？还是这幅画在告诉我什么？</p>
<p class="system-hint">你注意到油画中的异常人影，与方衡的装束相似。</p>
<div class="choice-list">
[[返回大厅|Explore_GrandHall]]
</div>""",
    'Explore_DiningRoom.twee': """:: Explore_DiningRoom
<<run Game.visitLocation('dining_room')>>
<<run Game.visit()>>
<h2>餐厅</h2>
<p>长条橡木餐桌足有六米长，能轻松坐下二十人。桌上铺着落满灰尘的白布，银质餐具已经发黑。</p>
<p>墙上挂着十二幅肖像画，画中人穿着不同年代的衣服，表情却惊人地相似——都是那种空洞的、被什么东西注视着的表情。</p>
<p>餐柜里还剩几瓶没开封的红酒。</p>
<div class="choice-list">
[[检查餐柜|Search_Sideboard]]
[[细看肖像画|Search_Portraits]]
[[返回|Map_Main1F]]
</div>""",
    'Search_Sideboard.twee': """:: Search_Sideboard
<<run Game.addItem('bread')>>
<<run Game.addItem('medicine_bottle')>>
<<run Game.visit()>>
<h2>餐柜</h2>
<p>餐柜深处藏着几袋密封的干粮，还有一个小药瓶。药瓶的标签被撕掉了，摇晃时能听到药片的声音。</p>
<p class="thought">陈默（内心）：止痛药？安眠药？还是……毒药？这东西出现在餐厅而不是医务室，有点奇怪。</p>
<p class="system-hint">你获得了道具：干粮、药瓶。</p>
<div class="choice-list">
[[返回餐厅|Explore_DiningRoom]]
</div>""",
    'Search_Portraits.twee': """:: Search_Portraits
<<run Game.addClue('old_guests')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>肖像画</h2>
<p>十二幅肖像画，每幅画的右下角都有签名和年份。最早的一幅是 1903 年，最新的一幅是去年。</p>
<p>你发现了一件令人不安的事：每幅画中人的眼睛，都似乎在跟随着你移动。当你仔细凝视其中一幅时，画中人的嘴角似乎微微上扬。</p>
<p class="system-hint">肖像画引发不安。理智 -5。你更确信这座庄园有自己的意志。</p>
<div class="choice-list">
[[返回餐厅|Explore_DiningRoom]]
</div>""",
    'Explore_Kitchen.twee': """:: Explore_Kitchen
<<run Game.visitLocation('kitchen')>>
<<run Game.addItem('bread')>>
<<run Game.visit()>>
<h2>厨房</h2>
<p>厨房很大，能同时供几个厨师工作。但现在炉灶是冷的，只有储物架角落还剩几袋干粮。</p>
<p>水龙头还在滴水，水流进一个生锈的铁盆。你尝了一口，水是冰的，但没有异味。</p>
<p>砧板上有一把厨师刀，刀刃还很锋利。</p>
<div class="choice-list">
[[拿走干粮和水|Search_Kitchen Supplies]]
[[检查砧板上的刀|Search_Knife]]
[[前往储藏室|Explore_Pantry]]
[[返回|Map_Main1F]]
</div>""",
    'Search_KitchenSupplies.twee': """:: Search_KitchenSupplies
<<run Game.addItem('bread')>>
<<run Game.visit()>>
<h2>厨房储物</h2>
<p>你把剩下的干粮和水装好。干粮的味道像压缩饼干，但能填饱肚子。</p>
<p class="system-hint">你获得了道具：干粮。</p>
<div class="choice-list">
[[返回厨房|Explore_Kitchen]]
</div>""",
    'Search_Knife.twee': """:: Search_Knife
<<run Game.addItem('pocket_knife')>>
<<run Game.visit()>>
<h2>厨师刀</h2>
<p>你拿起砧板上的厨师刀。刀身沉重，刃口磨得锃亮。这不是一把普通的厨房刀具——刀柄上刻着一个狼头图案。</p>
<p class="thought">陈默（内心）：狼头……这把刀和狼人有关？还是说，庄园的主人本身就是猎人？</p>
<p class="system-hint">你获得了道具：折叠小刀（刻有狼头图案）。</p>
<div class="choice-list">
[[返回厨房|Explore_Kitchen]]
</div>""",
    'Explore_Pantry.twee': """:: Explore_Pantry
<<run Game.visitLocation('pantry')>>
<<run Game.addItem('compass')>>
<<run Game.visit()>>
<h2>储藏室</h2>
<p>储藏室比厨房更深更暗。货架大多空了，只剩罐头和杂物。</p>
<p>在最底层的角落，你发现一个坏掉的指南针。指针在晃动，最终稳定地指向地下。</p>
<p class="thought">陈默（内心）：指针指向地下……酒窖？祭祀空间？它到底在指什么？</p>
<p class="system-hint">你获得了道具：坏掉的指南针。指针永远指向庄园地下。</p>
<div class="choice-list">
[[返回厨房|Explore_Kitchen]]
</div>""",
    'Explore_DrawingRoom.twee': """:: Explore_DrawingRoom
<<run Game.visitLocation('drawing_room')>>
<<run Game.visit()>>
<h2>会客厅</h2>
<p>壁炉旁的休息区。深色天鹅绒沙发，茶几上摆着一套精致的瓷茶具。角落里有一架旧钢琴，琴盖半开。</p>
<p>沙发缝隙里塞着一张纸条，上面写着潦草的字：</p>
<blockquote>"第三个晚上，别相信镜子里的自己。"</blockquote>
<p class="thought">陈默（内心）：谁写的？也是之前的住客吗？</p>
<div class="choice-list">
[[弹一下钢琴|Search_Piano]]
[[返回|Map_Main1F]]
</div>""",
    'Search_Piano.twee': """:: Search_Piano
<<run Game.changeSan(-3)>>
<<run Game.visit()>>
<h2>钢琴</h2>
<p>你按下琴键。第一个音是准的，但第二个音开始走调，越弹越刺耳，最后几个音完全不像钢琴发出的——更像是某种低沉的呜咽。</p>
<p>琴谱架上有一本翻开的乐谱，页面上用红笔画满了圈，圈住的音符排列出一个图案：一只眼睛。</p>
<p class="system-hint">钢琴的异响让你不安。理智 -3。</p>
<div class="choice-list">
[[返回会客厅|Explore_DrawingRoom]]
</div>""",
    'Explore_Study.twee': """:: Explore_Study
<<run Game.visitLocation('study')>>
<<run Game.addItem('lighter')>>
<<run Game.addClue('laozheng_knowledge')>>
<<run Game.visit()>>
<h2>书房</h2>
<p>满墙的书架，书脊上的字大多褪色了。书桌上有一盏老式台灯、一个放大镜、几封拆开的信件。</p>
<p>信件是庄园管家写给主人的，内容平淡，但最后一封的末尾写着：</p>
<blockquote>"……客人们又来了。和上次一样，十二个人。先生，您说过，只要仪式完成，一切都会结束。我信您。"</blockquote>
<p>书桌抽屉里有一只打火机，刻着"S.S."两个字母。</p>
<p class="thought">陈默（内心）：S.S.……沈慎？沈慎的打火机怎么会在这里？</p>
<p class="system-hint">你获得了破局线索：老郑的秘密。道具：打火机（刻有 S.S.）。</p>
<div class="choice-list">
[[返回|Map_Main1F]]
</div>""",
    'Explore_Gallery.twee': """:: Explore_Gallery
<<run Game.visitLocation('gallery')>>
<<run Game.addClue('chenmo_guilt')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>画廊</h2>
<p>这是一条狭长的走廊，两侧挂着历任庄园主人的肖像。从最早的一幅到最新的一幅，画中人的表情越来越空洞。</p>
<p>走到走廊尽头，你看到最后一幅画。画框是新的，颜料还没完全干透。</p>
<p>画上的人是你。</p>
<p>你的肖像穿着深色外套，站在庄园门前，背景是永恒的风雪。画中你的眼睛是闭着的，但嘴角有一丝笑意。</p>
<p>肖像下方有一行小字："陈默——候选继承者。下一个。"</p>
<p class="system-hint">你获得了破局线索：陈默的见死不救。你看到了自己的肖像，被系统标记为候选者。理智 -5。</p>
<div class="choice-list">
[[返回|Map_Main1F]]
</div>"""
}

for name, content in passages.items():
    path = os.path.join(explore_dir, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created {name}')

print('1F exploration passages done.')
