p = 'src/scripts/state.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

new_map = """GameState.MAP = {
    foyer: { name: '门厅', desc: '庄园正门入口，双开橡木门已被积雪封死。水晶吊灯歪斜悬挂。', zone: 'main_1f' },
    grand_hall: { name: '大厅', desc: '壁炉、前台、通往各处的枢纽。所有人白天的聚集地。', zone: 'main_1f' },
    dining_room: { name: '餐厅', desc: '长条橡木餐桌，能坐二十人。墙上有肖像画。', zone: 'main_1f' },
    kitchen: { name: '厨房', desc: '仅剩干粮的地方，也是食物冲突的源头。', zone: 'main_1f' },
    pantry: { name: '储藏室', desc: '厨房后方的储藏室，货架大多空了。', zone: 'main_1f' },
    drawing_room: { name: '会客厅', desc: '壁炉旁的休息区，沙发和旧钢琴。', zone: 'main_1f' },
    study: { name: '书房', desc: '满墙书架，书桌上有放大镜和信件。', zone: 'main_1f' },
    gallery: { name: '画廊', desc: '挂着历任庄园主人肖像的走廊，画中人的眼睛似乎在追踪你。', zone: 'main_1f' },
    guest_corridor: { name: '客房走廊', desc: '十二间客房，夜间是各自的安全屋。', zone: 'main_2f' },
    master_bedroom: { name: '主卧', desc: '庄园主人曾住的房间，床头的镜子蒙着灰。', zone: 'main_2f' },
    children_room: { name: '儿童房', desc: '积灰的童床和木马，墙上有蜡笔涂鸦。', zone: 'main_2f' },
    sewing_room: { name: '缝纫室', desc: '旧式缝纫机和布料，抽屉里可能有针线。', zone: 'main_2f' },
    balcony: { name: '阳台', desc: '能俯瞰中庭和庭院，风雪很大。', zone: 'main_2f' },
    attic: { name: '阁楼', desc: '布满灰尘，能找到泛黄的照片和二十年前的物件。', zone: 'main_3f' },
    archive_room: { name: '档案室', desc: '庄园二十年的文件和账本，锁着的铁柜里有秘密。', zone: 'main_3f' },
    library: { name: '图书室', desc: '满架旧书，藏着山庄的历史和往届住客的记录。', zone: 'east_wing' },
    music_room: { name: '音乐室', desc: '三角钢琴和大提琴，琴键落满灰尘。', zone: 'east_wing' },
    conservatory: { name: '温室', desc: '玻璃已碎，枯死的植物在雪中僵立。', zone: 'east_wing' },
    broadcast_room: { name: '广播室', desc: '老旧的广播设备，磁带里录着前任神的独白。', zone: 'east_wing' },
    generator_room: { name: '配电室', desc: '山庄的电力来源，江白能在这里发挥作用。', zone: 'west_wing' },
    workshop: { name: '工坊', desc: '木工和金工工具，能制作简易武器和工具。', zone: 'west_wing' },
    armory: { name: '杂物间', desc: '堆满旧家具和旅行箱，可能藏着前任住客的遗物。', zone: 'west_wing' },
    wine_cellar: { name: '酒窖', desc: '酒架大多空了，最深处通向地下铁门。', zone: 'west_wing' },
    courtyard: { name: '中庭', desc: '被风雪包围的露天区域，指南针在这里会剧烈转动。', zone: 'courtyard' },
    garden: { name: '花园', desc: '枯死的玫瑰丛和干涸的喷泉，雪下有墓碑。', zone: 'courtyard' },
    well: { name: '古井', desc: '井口结冰，趴下去能听到微弱的回声。', zone: 'courtyard' },
    chapel: { name: '小教堂', desc: '废弃的家庭礼拜堂，十字架歪斜，圣经散落。', zone: 'courtyard' },
    cellar_door: { name: '地下铁门', desc: '酒窖深处的铁门，门上写着天黑请闭眼。', zone: 'underground' },
    altar: { name: '祭祀空间', desc: '石碑、镜子、骨刀。轮回的真相所在。', zone: 'underground' },
    crypt: { name: '地下墓穴', desc: '铁门后的岔路，排列着石棺和刻着名字的墙壁。', zone: 'underground' }
  };"""

start = c.find('GameState.MAP = {')
end = c.find('};', start)
c = c[:start] + new_map + c[end+2:]

f = open(p, 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done. Locations with zone:', c.count('zone:'))
