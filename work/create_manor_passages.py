import os

root = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md'
common_dir = os.path.join(root, 'src', 'passages', 'common')
explore_dir = os.path.join(root, 'src', 'passages', 'chapter03_06')

# 1. Rewrite Common_Map as zone-based navigation
map_content = """:: Common_Map
<<run Game.visit()>>
<h2>庄园地图</h2>
<p class="system-hint">这是一座建造在雪山深处的老式庄园。主楼三层，东西两翼各有厢房，中庭被风雪包围，地下还有未知的空间。点击区域进入探索。</p>

<div class="zone-list">
<h3>主楼一层</h3>
<p class="muted">门厅、大厅、餐厅、厨房、储藏室、会客厅、书房、画廊</p>
<h3>主楼二层</h3>
<p class="muted">客房走廊、主卧、儿童房、缝纫室、阳台</p>
<h3>主楼三层 / 阁楼</h3>
<p class="muted">阁楼、档案室</p>
<h3>东厢房</h3>
<p class="muted">图书室、音乐室、温室、广播室</p>
<h3>西厢房</h3>
<p class="muted">配电室、工坊、杂物间、酒窖</p>
<h3>庭院</h3>
<p class="muted">中庭、花园、古井、小教堂</p>
<h3>地下空间</h3>
<p class="muted">地下铁门、祭祀空间、地下墓穴</p>
</div>

<div class="choice-list">
[[主楼一层|Map_Main1F]]
[[主楼二层|Map_Main2F]]
[[阁楼 / 档案室|Map_Main3F]]
[[东厢房|Map_EastWing]]
[[西厢房|Map_WestWing]]
[[庭院|Map_Courtyard]]
<<if Game.hasItem('old_key')>>
[[地下空间|Map_Underground]]
<</if>>
[[返回|Start]]
</div>
"""
with open(os.path.join(common_dir, 'Common_Map.twee'), 'w', encoding='utf-8') as f:
    f.write(map_content)
print('Rewrote Common_Map')

# 2. Zone hub passages
zones = {
    'Map_Main1F': """:: Map_Main1F
<<run Game.visit()>>
<h2>主楼一层</h2>
<p class="system-hint">庄园的核心区域。壁炉的火光能照到门厅，所有人的房间钥匙都挂在前台的木架上。</p>
<div class="choice-list">
[[前往大厅|Explore_GrandHall]]
[[前往餐厅|Explore_DiningRoom]]
[[前往厨房|Explore_Kitchen]]
[[前往储藏室|Explore_Pantry]]
[[前往会客厅|Explore_DrawingRoom]]
[[前往书房|Explore_Study]]
[[前往画廊|Explore_Gallery]]
[[返回地图|Common_Map]]
</div>""",
    'Map_Main2F': """:: Map_Main2F
<<run Game.visit()>>
<h2>主楼二层</h2>
<p class="system-hint">客房区。十二扇门沿着走廊排开，夜间是各自的安全屋。走廊尽头有一面落地镜，镜面发暗。</p>
<div class="choice-list">
[[查看客房走廊|Explore_GuestCorridor]]
[[进入主卧|Explore_MasterBedroom]]
[[进入儿童房|Explore_ChildrenRoom]]
[[进入缝纫室|Explore_SewingRoom]]
[[走上阳台|Explore_Balcony]]
[[返回地图|Common_Map]]
</div>""",
    'Map_Main3F': """:: Map_Main3F
<<run Game.visit()>>
<h2>阁楼 / 档案室</h2>
<p class="system-hint">楼梯尽头是一扇低矮的木门。空气里弥漫着灰尘和旧纸的味道。</p>
<div class="choice-list">
[[进入阁楼|Explore_Attic]]
<<if Game.hasItem('old_key')>>
[[进入档案室|Explore_ArchiveRoom]]
<</if>>
[[返回地图|Common_Map]]
</div>""",
    'Map_EastWing': """:: Map_EastWing
<<run Game.visit()>>
<h2>东厢房</h2>
<p class="system-hint">长廊连接着图书室、音乐室、温室和广播室。玻璃窗外的风雪把走廊照得惨白。</p>
<div class="choice-list">
[[前往图书室|Explore_Library]]
[[前往音乐室|Explore_MusicRoom]]
[[前往温室|Explore_Conservatory]]
[[前往广播室|Explore_Broadcast]]
[[返回地图|Common_Map]]
</div>""",
    'Map_WestWing': """:: Map_WestWing
<<run Game.visit()>>
<h2>西厢房</h2>
<p class="system-hint">这里更冷。配电室的嗡鸣声在走廊里回荡。酒窖的入口在走廊尽头。</p>
<div class="choice-list">
[[前往配电室|Explore_Generator]]
[[前往工坊|Explore_Workshop]]
[[前往杂物间|Explore_Armory]]
[[前往酒窖|Explore_WineCellar]]
[[返回地图|Common_Map]]
</div>""",
    'Map_Courtyard': """:: Map_Courtyard
<<run Game.visit()>>
<h2>庭院</h2>
<p class="system-hint">刺骨的风雪。你只能在中庭短暂停留。枯死的花园尽头有一口古井和一座废弃的小教堂。</p>
<div class="choice-list">
[[前往中庭|Explore_Courtyard]]
[[前往花园|Explore_Garden]]
[[查看古井|Explore_Well]]
[[进入小教堂|Explore_Chapel]]
[[返回地图|Common_Map]]
</div>""",
    'Map_Underground': """:: Map_Underground
<<run Game.visit()>>
<h2>地下空间</h2>
<p class="system-hint">你用旧钥匙打开酒窖深处的铁门，走下潮湿的楼梯。空气里有血腥味和某种古老的气息。</p>
<div class="choice-list">
<<if not Game.hasClue('ritual_tablet')>>
[[深入酒窖|Explore_Cellar]]
<</if>>
<<if Game.hasClue('cellar_door')>>
[[前往祭祀空间|Explore_Altar]]
<</if>>
<<if Game.hasClue('ritual_tablet')>>
[[探索地下墓穴|Explore_Crypt]]
<</if>>
[[返回地图|Common_Map]]
</div>"""
}

for name, content in zones.items():
    path = os.path.join(common_dir, name + '.twee')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created {name}')

print('Zone hubs created.')
