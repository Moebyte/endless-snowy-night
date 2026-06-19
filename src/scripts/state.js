/*
 * state.js
 * Game state initial structure and constant definitions.
 * All state hangs on State.variables.game to avoid global pollution.
 */

(function () {
  'use strict';

  window.GameState = window.GameState || {};

  // Character IDs
  GameState.CHARACTERS = {
    CHEN_MO: 'chen_mo',
    SU_WAN: 'su_wan',
    JIANG_BAI: 'jiang_bai',
    FANG_HENG: 'fang_heng',
    SHEN_SHEN: 'shen_shen',
    YE_ZHIQIU: 'ye_zhiqiu',
    ZHENG_SHOUSHAN: 'zheng_shoushan',
    LIN_XIAOMAN: 'lin_xiaoman',
    GU_YAN: 'gu_yan',
    ZHOU_YANG: 'zhou_yang',
    TANG_XIAOTANG: 'tang_xiaotang',
    ZHAO_MINGCHENG: 'zhao_mingcheng'
  };

  // Role IDs
  GameState.ROLES = {
    MEMORY: 'memory',
    PROPHET: 'prophet',
    WITCH: 'witch',
    KNIGHT: 'knight',
    MAGICIAN: 'magician',
    VILLAGER: 'villager',
    WOLF_KING: 'wolf_king',
    HIDDEN_WOLF: 'hidden_wolf',
    WOLF: 'wolf',
    MECHANICAL_WOLF: 'mechanical_wolf'
  };

  // Ending IDs
  GameState.ENDINGS = {
    GOOD: 'good',
    BAD_STARVATION: 'starvation',
    HIDDEN_GOD: 'god_of_gods',
    REFUSE_GOD: 'refuse_god'
  };
  // ITEMS: Chinese names + descriptions
  GameState.ITEMS = {
    notebook: { name: "笔记本", desc: "陈默用来记录跨轮回情报的笔记本。最后一页写着：不要相信任何人。" },
    old_key: { name: "旧钥匙", desc: "一把锈迹斑斑的铁钥匙，可能能打开地下酒窖的铁门。" },
    wolf_knife: { name: "狼牙匕首", desc: "造型狰狞的匕首，刀刃有暗红色痕迹。" },
    bread: { name: "面包", desc: "山庄厨房仅剩的干粮，硬得能砸核桃。" },
    compass: { name: "损坏的指南针", desc: "指针一直在转，从不指向同一个方向。" },
    lighter: { name: "打火机", desc: "老式煤油打火机，还能打火。" },
    flashlight: { name: "手电筒", desc: "光线已经很微弱了，但还能用一会儿。" },
    first_aid_kit: { name: "急救箱", desc: "苏晚随身携带的急救箱，里面有纱布、碘伏和止血药。" },
    syringe: { name: "注射器", desc: "干净的注射器，可用于注射药液。" },
    pocket_knife: { name: "折叠刀", desc: "江白随身的小刀，刀刃锋利。" },
    ritual_dagger: { name: "仪式匕首", desc: "祭坛上发现的骨制匕首，刀柄刻满符文。" },
    mirror_shard: { name: "镜子碎片", desc: "从祭祀空间的镜子上敲下来的碎片，倒影里好像有另一个世界。" },
    guest_register: { name: "住客登记簿", desc: "前台找到的登记簿，密密麻麻写满了名字，有些被划掉。" },
    old_photo: { name: "泛黄照片", desc: "二十年前在山庄拍摄的合影，老郑站在最后一排。" },
    cassette_tape: { name: "磁带", desc: "广播室找到的老式磁带，录音内容是前任祭坛守护者的独白。" },
    medicine_bottle: { name: "药瓶", desc: "标签被撕掉的药瓶，含化学药剂。" },
    wire: { name: "铜线", desc: "一段约两米的铜线，可以用于临时电路修复。" },
    bible: { name: "破旧圣经", desc: "阁楼找到的圣经，扉页写着老郑的忏悔。" },
    old_note: { name: "发黄的纸条", desc: "铁门门缝里塞的纸条：他们不会让人出去的，不要相信导游。" },
    ritual_log: { name: "祭祀日志", desc: "神秘房间找到的日志，记载了仪式的规则和历史。" },
  };
  // CLUES: Chinese names + descriptions (breaking = key to true ending)
  GameState.CLUES = {
    locked_doors: { name: "锁门规律", desc: "每晚23:00后，所有安全屋自动上锁，只有狼能闯入。" },
    cellar_door: { name: "地下铁门", desc: "酒窖深处的铁门，需要特定形状钥匙才能打开。" },
    jiangbai_scar: { name: "江白旧疤", desc: "江白右手腕上的疤很整齐，不像玻璃划伤。" },
    zhouyang_pocket: { name: "周阳插口袋", desc: "周阳的右手始终插在口袋里。" },
    fang_temperature: { name: "方衡体温异常", desc: "方衡体温偏低，但不像是生病的温度。" },
    phone_battery: { name: "手机电量异常", desc: "林小满的手机显示被困第三天，电量一直是100%。" },
    cellar_blood: { name: "酒窖血腥味", desc: "铁门后有明显的血腥味。" },
    old_guests: { name: "以往的客人", desc: "住客登记簿显示多年来的访客记录，有些人再也没有离开。" },
    ritual_tablet: { name: "祭祀铭文", desc: "祭坛上的铭文：第七日，祭品满，门开。存者出，亡者留。", breaking: true },
    recruitment_tablet: { name: "招募铭文", desc: "铭文后半部分：掌祭者即掌生死，存者若取祭者之位，则轮回终，新神立。", breaking: true },
    shenshen_identity: { name: "沈慎暗示", desc: "沈慎说看所有人都是双重曝光的——他也能感知到轮回的痕迹。", breaking: true },
    laozheng_survivor: { name: "老郑幸存者身份", desc: "老郑是上一轮轮回的幸存者，他知道部分真相。", breaking: true },
    god_kill_method: { name: "弑神方法", desc: "取代祭坛的守护者就能终结轮回，但需要等价交换。", breaking: true },
    fang_heng_theory: { name: "方衡的推测", desc: "狼的杀戮可能有特定目标顺序，而不是随机。" },
    tang_saw_3f: { name: "唐小棠目击证词", desc: "唐小棠声称昨晚23:00后看到有人上三楼。" },
    fang_and_zhao_known: { name: "方衡与赵明城相识", desc: "周阳观察到两人交换眼神，顾言证实赵明城介绍他来山庄。" },
    hidden_floor: { name: "隐藏夹层", desc: "顾言通过建筑结构对称性推算山庄存在隐藏空间。" },
    burned_notebook: { name: "烧毁的笔记", desc: "有人烧了一本笔记，灰烬上残留着'者笔记别让人看到'字样。" },
    ye_supernatural_wound: { name: "超自然伤口", desc: "叶知秋验尸确认伤口不是人类能造成的。" },
    ye_opinion_fang_shen: { name: "叶知秋对方衡和沈慎的评价", desc: "方衡身上有不干净的味道，沈慎对死亡过于熟悉。" },
    six_digit_lock: { name: "六进制密码锁", desc: "二楼走廊尽头的房间门装有六进制密码锁。" },
    mystery_room: { name: "神秘房间", desc: "密码锁后面的房间，藏有祭祀日志和关于仪式的书籍。" },
    zhao_fang_deal: { name: "赵明城与方衡的交易", desc: "两人来山庄是为了取走前主人留下的东西——各取所需。" },
    altar_inscription: { name: "祭坛铭文", desc: "铁门后的祭坛刻着：第七日，祭品满，门开。存者出，亡者留。" },
  };

  GameState.BREAKING_CLUES = Object.keys(GameState.CLUES).filter(function (id) {
    return GameState.CLUES[id].breaking === true;
  });

  // WITCH_MATERIALS: materials for crafting potions
  GameState.WITCH_MATERIALS = {
    medicine_bottle: { name: "药瓶", desc: "标签被撕掉的药瓶，含化学药剂。", sources: ["dining_room"] },
    syringe: { name: "注射器", desc: "干净的注射器，可用于注射药液。", sources: ["master_bedroom"] },
    herb_bundle: { name: "草药束", desc: "温室里找到的干燥草药。", sources: ["conservatory"] },
    chemical_vial: { name: "化学试剂瓶", desc: "工坊里的化学试剂。", sources: ["workshop"] },
  };

  // WITCH_POTIONS: non-lethal potions (control effects)
  GameState.WITCH_POTIONS = {
    sleeping_potion: {
      name: "安眠药",
      desc: "让目标当晚深度睡眠，不会醒来，不会目击夜间事件。",
      recipe: { medicine_bottle: 1 },
      effect: "sleep"
    },
    paralytic: {
      name: "麻痹剂",
      desc: "让目标当晚身体无法动弹，无法行动。",
      recipe: { medicine_bottle: 1, syringe: 1 },
      effect: "paralyze"
    },
    deep_sedative: {
      name: "强效镇静剂",
      desc: "同时麻痹和安眠，目标当晚完全失去行动能力。",
      recipe: { syringe: 1, chemical_vial: 1, herb_bundle: 1 },
      effect: "deep_sedation"
    },
    truth_serum: {
      name: "吐真剂",
      desc: "让目标在白天对话中不自觉地吐露真实想法。一次性。",
      recipe: { chemical_vial: 1, herb_bundle: 1 },
      effect: "truth"
    },
  };

  // MAP: location id -> {name, desc, zone}
  GameState.MAP = {
    foyer: { name: "门厅", desc: "庄园正门入口，双开橡木门已被积雪封死。水晶吊灯倾斜悬挂。", zone: "main_1f" },
    grand_hall: { name: "大厅", desc: "壁炉、前台、通往各处的走廊。所有人白天的聚集地。", zone: "main_1f" },
    dining_room: { name: "餐厅", desc: "长条橡木餐桌，能坐二十人。墙上有肖像画。", zone: "main_1f" },
    kitchen: { name: "厨房", desc: "仅剩干粮的地方，也是食物危机的源头。", zone: "main_1f" },
    pantry: { name: "储藏室", desc: "厨房后方的储藏室，货架大多空了。", zone: "main_1f" },
    drawing_room: { name: "会客室", desc: "壁炉旁的休息区，沙发和旧钢琴。", zone: "main_1f" },
    study: { name: "书房", desc: "满墙书架，书桌上有放大镜和信件。", zone: "main_1f" },
    gallery: { name: "画廊", desc: "挂着历任庄园主人肖像的走廊，画中人的眼睛似乎在追踪你。", zone: "main_1f" },
    guest_corridor: { name: "客房走廊", desc: "十二间客房，夜间是各自的安全屋。", zone: "main_2f" },
    master_bedroom: { name: "主卧", desc: "庄园主人曾住的房间，床头的镜子蒙着灰。", zone: "main_2f" },
    children_room: { name: "儿童房", desc: "积灰的童床和木马，墙上有蜡笔画痕迹。", zone: "main_2f" },
    sewing_room: { name: "缝纫室", desc: "旧式缝纫机和布料，抽屉里可能有针线。", zone: "main_2f" },
    balcony: { name: "阳台", desc: "能俯瞰中庭和庭院，风雪很大。", zone: "main_2f" },
    attic: { name: "阁楼", desc: "布满灰尘，能找到泛黄的照片和二十年前的物件。", zone: "main_3f" },
    archive_room: { name: "档案室", desc: "庄园二十年的文件和账本，锁着的铁柜里有秘密。", zone: "main_3f" },
    library: { name: "图书室", desc: "满架旧书，藏着山庄的历史和往届住客的记录。", zone: "east_wing" },
    music_room: { name: "音乐室", desc: "三角钢琴和大提琴，琴键落满灰尘。", zone: "east_wing" },
    conservatory: { name: "温室", desc: "玻璃已碎，枯死的植物在雪中僵立。", zone: "east_wing" },
    broadcast_room: { name: "广播室", desc: "老旧的广播设备，磁带里录着前任神的独白。", zone: "east_wing" },
    generator_room: { name: "配电室", desc: "庄园的电力来源，江白能在这里发挥作用。", zone: "west_wing" },
    workshop: { name: "工坊", desc: "木工和金工工具，能制作简易武器和工具。", zone: "west_wing" },
    armory: { name: "杂物间", desc: "堆满旧家具和旅行箱，可能藏着前任住客的遗物。", zone: "west_wing" },
    wine_cellar: { name: "酒窖", desc: "酒架大多空了，最深处通向地下铁门。", zone: "west_wing" },
    courtyard: { name: "中庭", desc: "被风雪包围的露天区域，指南针在这里会剧烈转动。", zone: "courtyard" },
    garden: { name: "花园", desc: "枯萎的玫瑰丛和干涸的喷泉，雪下有墓碑。", zone: "courtyard" },
    well: { name: "古井", desc: "井口结冰，扔下去能听到微弱的回声。", zone: "courtyard" },
    chapel: { name: "小教堂", desc: "废弃的家庭礼拜堂，十字架歪斜，圣经散落。", zone: "courtyard" },
    cellar_door: { name: "地下铁门", desc: "酒窖深处的铁门，门上写着天黑请闭眼。", zone: "underground" },
    altar: { name: "祭祀空间", desc: "石阶、镜子、骨刀。轮回的真相所在。", zone: "underground" },
    crypt: { name: "地下墓室", desc: "铁门后的岩路，排列着石椁和刻着名字的墙壁。", zone: "underground" },
  };

  GameState.BACKSTORY_KEYS = {
    chen_mo: 'chenmo_guilt',
    su_wan: 'suwan_resolve',
    jiang_bai: 'jiangbai_origin',
    fang_heng: 'fang_corruption',
    shen_shen: 'shenshen_debt',
    ye_zhiqiu: 'yezhiqiu_malpractice',
    zheng_shoushan: 'laozheng_knowledge',
    lin_xiaoman: 'linxiaoman_devotion',
    zhou_yang: 'zhouyang_arrogance',
    tang_xiaotang: 'tangxiaotang_trauma',
    zhao_mingcheng: 'zhaomingcheng_network',
    gu_yan: 'guyan_ambition'
  };

  // (comment)
  GameState.FLAGS = {
    MET_EVERYONE: 'met_everyone',
    SAW_LAOZHENG_DIE: 'saw_laozheng_die',
    LOOP_AWAKENED: 'loop_awakened',
    JIANGBAI_TRUSTS: 'jiangbai_trusts',
    ZHOU_SUSPICIOUS: 'zhou_suspicious',
    TANG_SUSPICIOUS: 'tang_suspicious',
    SHENSHEN_REVEALED: 'shenshen_revealed',
    FANG_REVEALED: 'fang_revealed',
    FANG_ZHAO_CONNECTION: 'fang_zhao_connection', // (comment)
    DOOR_OPENED: 'door_opened',
    MIRROR_BROKEN: 'mirror_broken'
  };

  
  // PROFILES: public identity + first impression + unlockable personality/talent/secret
  GameState.PROFILES = {
    chen_mo: { name: "陈默", firstImpression: "你自己。白衬衫皱巴巴的，袖口还有血迹。", age: 22, job: "信息工程学院计算机科学专业大四学生", personality: "冷静理性，不善表达", talent: "逻辑分析、记笔记", secret: "你拥有跨轮回的记忆。某次见死不救的经历，让你在循环中反复自我惩罚。" },
    su_wan: { name: "苏晚", firstImpression: "穿白大褂的女生，气质温和，一直随身带着急救箱。", age: 21, job: "医学院临床医学专业大四学生", personality: "温柔倔强，医者仁心", talent: "急救、诊断伤势、安抚他人", secret: "她对陈默有过超出同学的好感，但从未说出口。" },
    jiang_bai: { name: "江白", firstImpression: "戴耳机的男生，话不多，总坐在靠窗的位置。", age: 22, job: "电气电子工程学院电气工程专业大三学生", personality: "踏实可靠，话少行动力强", talent: "修电路、接发电机、做简单工具", secret: "他右手腕的旧疤不是玻璃划的，来源他一直含糊带过。" },
    fang_heng: { name: "方衡", firstImpression: "三十多岁的男人，穿着深色夹克，话不多，总在观察四周。", age: 35, job: "市公安局刑侦支队副队长", personality: "沉稳世故，表面温和", talent: "观察细节、推理、追踪", secret: "他是黑警，与赵明城在来山庄前就有私下来往。" },
    shen_shen: { name: "沈慎", firstImpression: "沉默的中年男人，手指修长，动作很轻，几乎不发出声音。", age: 38, job: "自由职业魔术师/手艺人", personality: "沉默寡言，动作利落", talent: "手速快、魔术技巧、观察人心", secret: "他曾是地下赌场荷官兼老千，出千害得别人家破人亡。" },
    ye_zhiqiu: { name: "叶知秋", firstImpression: "安静的女人，捧着热水杯，指尖发白，不爱说话。", age: 32, job: "殡仪馆入殓师，前医学院学生", personality: "沉静温柔，不爱多言", talent: "医疗护理、急救包扎、配制药剂", secret: "她曾因医疗事故致人死亡，从此离开临床。" },
    zheng_shoushan: { name: "郑守山", firstImpression: "年纪最大的男人，自称老郑，说自己是这次旅行的导游。", age: 58, job: "退休旅行团导游", personality: "圆滑谨慎，阅历丰富", talent: "野外生存、认路、讲故事", secret: "他是上一轮轮回的幸存者，知道山庄的部分真相。" },
    lin_xiaoman: { name: "林小满", firstImpression: "染着浅色头发的女生，一直护着身边的唐小棠，眼神带刺。", age: 20, job: "艺术学院绘画专业学生", personality: "冲动仗义，护短，外刚内软", talent: "体能好、保护他人、观察细节", secret: "她有太妹背景，为了保护唐小棠可以不择手段。" },
    zhou_yang: { name: "周阳", firstImpression: "高个子体育生，笑容阳光，喜欢和人打招呼。", age: 23, job: "体育学院田径专业研究生", personality: "阳光开朗，人缘好", talent: "奔跑、体能好、带动气氛", secret: "他好胜心极强，享受在竞争中把对手压垮的感觉。" },
    tang_xiaotang: { name: "唐小棠", firstImpression: "爱笑的女生，紧紧挽着林小满的手臂，看起来有点怕生。", age: 20, job: "文学院汉语言文学专业大二学生", personality: "活泼敏感，依赖性强", talent: "读文字、察言观色、写作", secret: "她幼年被养父虐待猥亵，精神状态长期不稳定，暗恋陈默。" },
    zhao_mingcheng: { name: "赵明城", firstImpression: "西装革履的中年男人，气场沉稳，自称做外贸生意。", age: 45, job: "外贸公司老板", personality: "圆滑世故，擅长斡旋", talent: "谈判、资源调配、心理分析", secret: "他实际是政治掮客、黑手套，与方衡一起来山庄各取所需。" },
    gu_yan: { name: "顾言", firstImpression: "戴眼镜的年轻人，手里拿着笔记本，不时低头记录什么。", age: 24, job: "理学院物理学博士研究生", personality: "敏感自尊，观察力强", talent: "物理推理、拆解机关、实验验证", secret: "他曾强夺同门师兄弟的学术成果，对权力极度渴望。" },
  };

GameState.getProfile = function (charId) {
  return GameState.PROFILES[charId] || null;
};

// GOD_KILLERS: only chen_mo and lao_zheng can slay a god
    GameState.GOD_KILLERS = {
      CHEN_MO: 'chen_mo',
      LAO_ZHENG: 'zheng_shoushan'
  };

  // GameState.create: fresh game state
  GameState.create = function () {
    return {
      // chapter and loop
      chapter: 1,
      loop: 1,
      day: 1,
      time: '06:00',

      // protagonist state
      stats: {
        san: 100,
        hunger: 0,
        trust_suwan: 50,
        trust_jiangbai: 30,
        trust_fang_heng: 30,
        trust_shenshen: 20,
        fear_level: 0
      },

      // alive status (true = alive)
      alive: {
        chen_mo: true,
        su_wan: true,
        jiang_bai: true,
        fang_heng: true,
        shen_shen: true,
        ye_zhiqiu: true,
        zheng_shoushan: true,
        lin_xiaoman: true,
        gu_yan: true,
        zhou_yang: true,
        tang_xiaotang: true,
        zhao_mingcheng: true
      },

      // current role assignments
      roles: {
        chen_mo: 'memory',
        su_wan: 'villager',
        jiang_bai: 'villager',
        fang_heng: 'prophet',
        shen_shen: 'magician',
        ye_zhiqiu: 'witch',
        zheng_shoushan: 'villager',
        lin_xiaoman: 'knight',
        gu_yan: 'mechanical_wolf',
        zhou_yang: 'wolf_king',
        tang_xiaotang: 'hidden_wolf',
        zhao_mingcheng: 'wolf'
      },

      // inventory, clues, flags, endings
      inventory: {},
      clues: {},
      flags: {},
      endings: {},

      // passage visit log
      visited: {},

      // visited locations (map)
      visitedLocations: {},

      // revealed character hidden info
      revealed: {},

      // characters the protagonist has met
      metCharacters: {},

      // per-character unlocked info aspects (basic/personality/talent/backstory/identity)
      characterReveals: {},

      // safehouse status (intruded each night)
      safehouse: {
        intruded: false,
        target: null
      },

      // god skills (reset each loop)
      godSkills: {
        witch: {
          uses: 0,
          maxUses: 3,
          broken: false,
          curses: [],
          materials: {},
          potions: {},
          sensedDeath: null
        },
        knight: {
          duelsUsed: 0,
          weakenedDays: 0,
          lastTarget: null,
          guarding: null
        },
        prophet: {
          checks: [],
          exposed: false
        },
        magician: {
          swapsUsed: 0,
          maxSwaps: 7,
          currentSwap: null,
          swapHistory: [],
          lastSwapPair: null
        }
      },

      // last wolf kill result
      lastWolfKill: null,

      // memory fragments (persist across loops)
      memories: []
    };
  };

})();
