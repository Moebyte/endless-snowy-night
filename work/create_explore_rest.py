import os

explore_dir = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/chapter03_06'

passages = {
    # ===== 主楼二层 =====
    'Explore_GuestCorridor.twee': """:: Explore_GuestCorridor
<<run Game.visitLocation('guest_corridor')>>
<<run Game.visit()>>
<h2>客房走廊</h2>
<p>十二扇门沿着走廊排开，每扇门上都有一个铜制号码牌。门锁是老式的，从里面用插销锁住。</p>
<p>走廊尽头有一面落地镜。镜面发暗，你走近时，镜子里的你似乎比真实的你慢了半拍。</p>
<p class="thought">陈默（内心）：镜子……和祭祀空间的那面镜子，会不会有关系？</p>
<div class="choice-list">
[[检查落地镜|Search_Mirror2F]]
[[返回|Map_Main2F]]
</div>""",
    'Search_Mirror2F.twee': """:: Search_Mirror2F
<<run Game.addClue('mirror_exit')>>
<<run Game.visit()>>
<h2>落地镜</h2>
<p>你站在镜子前。镜面有一道细微的裂纹，从右上角延伸到左下角。</p>
<p>你注意到裂纹的形状和祭祀空间的镜子完全一致。似乎庄园里的每一面镜子，都连接着同一个出口。</p>
<p class="thought">陈默（内心）：镜子是出口。打碎它，也许就能离开。但需要先知道全部规则。</p>
<p class="system-hint">你获得了破局线索：镜子出口。</p>
<div class="choice-list">
[[返回走廊|Explore_GuestCorridor]]
</div>""",
    'Explore_MasterBedroom.twee': """:: Explore_MasterBedroom
<<run Game.visitLocation('master_bedroom')>>
<<run Game.addItem('syringe')>>
<<run Game.visit()>>
<h2>主卧</h2>
<p>庄园主人曾住的房间。四柱床上铺着厚重的帷幔，床头柜上放着一面蒙灰的小镜子。</p>
<p>梳妆台的抽屉里有一支注射器，针筒里残留着干涸的液体。抽屉底部还压着一张处方笺，上面的字迹很潦草。</p>
<p class="thought">陈默（内心）：注射器……叶知秋的？还是庄园主人留下的？</p>
<p class="system-hint">你获得了道具：注射器（残留干涸液体）。</p>
<div class="choice-list">
[[返回|Map_Main2F]]
</div>""",
    'Explore_ChildrenRoom.twee': """:: Explore_ChildrenRoom
<<run Game.visitLocation('children_room')>>
<<run Game.addClue('tangxiaotang_trauma')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>儿童房</h2>
<p>积灰的童床，角落里有一只掉了一只眼睛的木马。墙上满是蜡笔涂鸦，大多是歪歪扭扭的房子和人。</p>
<p>有一面墙的涂鸦与众不同：画的是一个小人缩在角落，旁边站着一个巨大的黑色人影。小人的头上画满了眼泪，黑色人影的手伸得很长很长。</p>
<p>你在涂鸦下面发现一行字，是用指甲刻在墙上的：</p>
<blockquote>"他不让我说。但这里没有人会听。"</blockquote>
<p class="thought">陈默（内心）：这让我想起唐小棠……她幼年被养父虐待的事。这些涂鸦是谁画的？</p>
<p class="system-hint">你获得了线索：唐小棠的创伤。理智 -5。</p>
<div class="choice-list">
[[返回|Map_Main2F]]
</div>""",
    'Explore_SewingRoom.twee': """:: Explore_SewingRoom
<<run Game.visitLocation('sewing_room')>>
<<run Game.addItem('wire')>>
<<run Game.visit()>>
<h2>缝纫室</h2>
<p>旧式缝纫机靠窗放着，踏板已经生锈。布料卷堆在角落，大多是褪色的丝绸和棉布。</p>
<p>抽屉里有针线盒、剪刀，还有一卷细金属丝——用来固定布料的，但也能用作简易工具。</p>
<p class="system-hint">你获得了道具：金属丝。</p>
<div class="choice-list">
[[返回|Map_Main2F]]
</div>""",
    'Explore_Balcony.twee': """:: Explore_Balcony
<<run Game.visitLocation('balcony')>>
<<run Game.addClue('locked_doors')>>
<<run Game.visit()>>
<h2>阳台</h2>
<p>刺骨的风雪扑面而来。你只能短暂停留。</p>
<p>从阳台俯瞰，庄园被三米厚的积雪完全包围。盘山公路已经看不见了，只剩下白色的荒原。没有救援队，没有车灯，没有任何人类活动的痕迹。</p>
<p>你注意到中庭花园的尽头有一座小教堂，尖顶上的十字架歪斜着，像是在鞠躬。</p>
<p class="system-hint">你确认了线索：门窗被封死。庄园与外界完全隔绝。</p>
<div class="choice-list">
[[返回|Map_Main2F]]
</div>""",

    # ===== 阁楼 / 档案室 =====
    'Explore_ArchiveRoom.twee': """:: Explore_ArchiveRoom
<<run Game.visitLocation('archive_room')>>
<<run Game.addItem('old_photo')>>
<<run Game.addClue('shenshen_identity')>>
<<run Game.visit()>>
<h2>档案室</h2>
<p>锁着的铁柜被你的旧钥匙打开了。里面是庄园二十年来的文件：账本、住客名单、员工档案。</p>
<p>员工档案里有一份赌场荷官的入职申请，照片上是沈慎，日期是二十年前。职位一栏写着："祭祀执行人"。</p>
<p>你还在档案夹里找到一张泛黄的合影。照片上是十二个年轻人，背景就是这座庄园。最后一排左边第三个，长得很像年轻时的老郑。</p>
<p class="system-hint">你获得了破局线索：沈慎的真身。道具：泛黄照片。</p>
<div class="choice-list">
[[返回|Map_Main3F]]
</div>""",

    # ===== 东厢房 =====
    'Explore_MusicRoom.twee': """:: Explore_MusicRoom
<<run Game.visitLocation('music_room')>>
<<run Game.visit()>>
<h2>音乐室</h2>
<p>三角钢琴占据了大半个房间。琴键落满灰尘，但你按下时，第一个音依然清亮。</p>
<p>大提琴靠在角落，琴弦断了两根。琴谱架上有一本翻开的乐谱，上面的音符排列成一个图案：一只睁开的眼睛。</p>
<p>和会客厅钢琴上看到的图案一样。</p>
<p class="thought">陈默（内心）：眼睛的图案到处都是。这个庄园一直在"看着"我们。</p>
<div class="choice-list">
[[返回|Map_EastWing]]
</div>""",
    'Explore_Conservatory.twee': """:: Explore_Conservatory
<<run Game.visitLocation('conservatory')>>
<<run Game.addClue('mirror_exit')>>
<<run Game.visit()>>
<h2>温室</h2>
<p>玻璃穹顶已经碎裂，雪花飘进来，覆盖了枯死的植物。玫瑰丛变成了黑色的荆棘，干涸的喷泉池里结了一层冰。</p>
<p>喷泉中央有一面镜子的碎片，镶嵌在石雕的眼睛位置。你拿起碎片，发现它的裂纹形状与祭祀空间的镜子一致。</p>
<p class="thought">陈默（内心）：庄园里所有的镜子碎片，裂纹都一样。它们是从同一面镜子上碎下来的。</p>
<p class="system-hint">你确认了破局线索：镜子出口。庄园所有的镜子碎片都是同一面镜子的组成部分。</p>
<div class="choice-list">
[[返回|Map_EastWing]]
</div>""",

    # ===== 西厢房 =====
    'Explore_Workshop.twee': """:: Explore_Workshop
<<run Game.visitLocation('workshop')>>
<<run Game.addItem('wire')>>
<<run Game.addItem('flashlight')>>
<<run Game.visit()>>
<h2>工坊</h2>
<p>木工和金工工具整齐地挂在墙上。工作台上有一盏修好的手电筒，旁边是一卷金属丝。</p>
<p>墙角堆着几个未完工的木箱，其中一个箱盖上刻着和画廊肖像下方一样的文字："候选继承者"。</p>
<p class="thought">陈默（内心）：这个庄园一直在为"继承者"做准备。箱子是给我准备的。</p>
<p class="system-hint">你获得了道具：手电筒、金属丝。</p>
<div class="choice-list">
[[返回|Map_WestWing]]
</div>""",
    'Explore_Armory.twee': """:: Explore_Armory
<<run Game.visitLocation('armory')>>
<<run Game.addItem('first_aid_kit')>>
<<run Game.visit()>>
<h2>杂物间</h2>
<p>堆满旧家具和旅行箱。其中一个旅行箱的锁已经坏了，打开后里面是一套急救用品：绷带、消毒水、止血带。</p>
<p>旅行箱的夹层里还有一本日记，字迹和书房里管家信件的笔迹一致。最后一页写着：</p>
<blockquote>"仪式需要十二个人。必须有一个人觉醒，必须有一个人弑神。否则循环不会结束。"</blockquote>
<p class="thought">陈默（内心）：十二个人，一个觉醒者，一个弑神者。这就是规则的全部。</p>
<p class="system-hint">你获得了道具：急救包。你更接近真相了。</p>
<div class="choice-list">
[[返回|Map_WestWing]]
</div>""",
    'Explore_WineCellar.twee': """:: Explore_WineCellar
<<run Game.visitLocation('wine_cellar')>>
<<run Game.addClue('cellar_blood')>>
<<run Game.visit()>>
<h2>酒窖</h2>
<p>酒架沿着墙壁排成弧形，大部分格子都空了，只剩几瓶落灰的红酒。空气阴冷潮湿。</p>
<p>酒窖最深处有一扇铁门，门上用红漆写着四个字："天黑请闭眼"。门缝里渗出淡淡的血腥味。</p>
<p class="thought">陈默（内心）：这就是老郑说过的祭祀空间入口。</p>
<p class="system-hint">你获得了线索：酒窖血腥味。铁门后是祭祀空间。</p>
<<if Game.hasItem('old_key')>>
<div class="choice-list">
[[用旧钥匙打开铁门|Explore_Cellar]]
<</if>>
<div class="choice-list">
[[返回|Map_WestWing]]
</div>""",

    # ===== 庭院 =====
    'Explore_Garden.twee': """:: Explore_Garden
<<run Game.visitLocation('garden')>>
<<run Game.visit()>>
<h2>花园</h2>
<p>枯死的玫瑰丛被雪覆盖，只露出黑色的荆棘。干涸的喷泉池里结着厚厚的冰。</p>
<p>你扒开喷泉边的积雪，发现下面是一块墓碑。碑上没有名字，只有一个日期和一行字：</p>
<blockquote>"1903—2023。继承人永不停歇。"</blockquote>
<p class="thought">陈默（内心）：从 1903 到现在，120 年。这个庄园已经"运转"了 120 年。</p>
<div class="choice-list">
[[返回|Map_Courtyard]]
</div>""",
    'Explore_Well.twee': """:: Explore_Well
<<run Game.visitLocation('well')>>
<<run Game.addClue('system_origin')>>
<<run Game.changeSan(-5)>>
<<run Game.visit()>>
<h2>古井</h2>
<p>井口结了一层薄冰。你趴在井沿上往下看——深不见底，但你能听到微弱的回声，像是风在井底呜咽，又像是无数人在低声说话。</p>
<p>你扔下一块碎冰。很久之后，传来一声闷响，不是水声，而是某种……金属碰撞的声音。</p>
<p>然后回声变了。你听清了井底传来的声音——是录音，循环播放的录音：</p>
<blockquote>"……系统衰竭了。我们需要新的神。七日一轮，弑神迭代……"</blockquote>
<p>和广播室磁带里的独白一模一样。整个庄园的地下，似乎都是连通的。</p>
<p class="system-hint">你获得了破局线索：系统的起源。庄园地下连通，循环播放着前任神的独白。理智 -5。</p>
<div class="choice-list">
[[返回|Map_Courtyard]]
</div>""",
    'Explore_Chapel.twee': """:: Explore_Chapel
<<run Game.visitLocation('chapel')>>
<<run Game.addItem('bible')>>
<<run Game.addClue('laozheng_survivor')>>
<<run Game.visit()>>
<h2>小教堂</h2>
<p>废弃的家庭礼拜堂。木制长椅歪斜地摆放着，圣坛上的十字架倒了下来。地上散落着撕碎的圣经书页。</p>
<p>圣坛后方有一本完整的圣经，比散落的页脚更厚。你翻开扉页，上面写着：</p>
<blockquote>"愿主宽恕我幸存者的罪。我只看了，没有救。——郑守山"</blockquote>
<p>圣经的夹层里有一张手绘的庄园地图，标注了所有镜子碎片的位置，用红线连成一个完整的镜面轮廓。</p>
<p class="system-hint">你获得了破局线索：老郑的幸存者身份。道具：破旧圣经（含手绘镜子地图）。</p>
<div class="choice-list">
[[返回|Map_Courtyard]]
</div>""",

    # ===== 地下 =====
    'Explore_Altar.twee': """:: Explore_Altar
<<run Game.visitLocation('altar')>>
<<run Game.addClue('ritual_tablet')>>
<<run Game.addClue('recruitment_tablet')>>
<<run Game.addClue('god_kill_method')>>
<<run Game.addItem('ritual_dagger')>>
<<run Game.addItem('mirror_shard')>>
<<run Game.visit()>>
<h2>祭祀空间</h2>
<p>铁门后的空间比想象的更大。石壁上刻满了名字，有些模糊，有些清晰。</p>
<p>中央有一块倾斜的石碑，刻着规则：</p>
<blockquote><strong>"七日为一轮。轮末未出神者，循环重置。神死者，其力归弑神者。弑神需以骨刀，于祭祀空间内行之。"</strong></blockquote>
<p>另一块石碑刻着名单，最下方是你的名字。祭坛上放着一把骨刀，刀刃泛着幽光。祭坛后的镜面完整，但映出的不是你的倒影，而是一个闭着眼的人脸。</p>
<p class="thought">陈默（内心）：骨刀是弑神的唯一工具。镜子是出口。我终于看清了全部规则。</p>
<p class="system-hint">你获得了破局线索：规则石碑、招聘碑、弑神之法。道具：祭祀骨刀、镜子碎片。</p>
<div class="choice-list">
[[探索地下墓穴|Explore_Crypt]]
[[返回|Map_Underground]]
</div>""",
    'Explore_Crypt.twee': """:: Explore_Crypt
<<run Game.visitLocation('crypt')>>
<<run Game.addClue('recruitment_tablet')>>
<<run Game.changeSan(-10)>>
<<run Game.visit()>>
<h2>地下墓穴</h2>
<p>祭祀空间后方有一条狭窄的甬道，通向地下墓穴。两侧排列着石棺，每口石棺上都刻着一个名字和年份。</p>
<p>你数了数——总共十二口石棺。最早的几口已经斑驳，最新的那口还是空的，棺盖半开，里面铺着白色的绸缎。</p>
<p>空棺的边缘刻着一行字：</p>
<blockquote>"等待第十二位继承者。"</blockquote>
<p>甬道尽头的墙壁上密密麻麻刻满了名字，你认出了其中几个——和画廊肖像上的名字一致。这些人都曾是"继承者"，都曾以为自己能打破轮回。</p>
<p class="thought">陈默（内心）：我不是第一个。在我之前，有多少人走到了这里，又失败了？</p>
<p class="system-hint">你确认了破局线索：招聘碑。地下墓穴有十二口石棺，等待第十二位继承者。理智 -10。</p>
<div class="choice-list">
[[返回祭祀空间|Explore_Altar]]
</div>"""
}

for name, content in passages.items():
    path = os.path.join(explore_dir, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created {name}')

print('All exploration passages created.')
