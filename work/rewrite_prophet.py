# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

old_func = """  Game.prophetCheck = function (targetId) {
    var g = ensureState();
    var pr = g.godSkills.prophet;
    var targetRole = Game.roleOf(targetId);
    var wolfRoles = ['wolf_king', 'hidden_wolf', 'wolf', 'mechanical_wolf'];
    var godRoles = ['prophet', 'witch', 'knight', 'magician'];
    var result;
    if (wolfRoles.indexOf(targetRole) !== -1) {
      // 隐狼对预言家显示为盟友
      if (targetRole === 'hidden_wolf') {
        result = 'ally';
      } else {
        result = 'enemy';
      }
    } else if (godRoles.indexOf(targetRole) !== -1) {
      result = 'ally';
    } else {
      // 村民：怀有杀意时显示为敌人
      result = 'ally';
    }
    pr.checks.push({ target: targetId, result: result });
    return { ok: true, result: result, target: targetId };
  };"""

new_func = """  // 预言家模糊感知文本池（每种角色状态对应多条描述，随机选取）
  Game.PROPHET_TEXTS = {
    // 普通狼人：浓烈的夜光气息、嗜血的渴望
    wolf: [
      '此人身上弥漫着浓烈的夜光气息，像月光凝固成了鳞片。方衡感到一阵刺骨的寒意——是猎食者。',
      '方衡闭上眼，感受到对方胸腔里有什么东西在低吼。不是心跳，是更原始的东西。那是饥饿。',
      '一团黑色的雾气缠绕着此人。方衡辨认出那是杀意的形状——不是一时的冲动，而是刻进骨头里的本能。'
    ],
    // 狼王：更强的压迫感，几乎让预言家窒息
    wolf_king: [
      '方衡感到一阵窒息。此人体内的夜光浓度远超常人，像一轮黑色的太阳在燃烧。这不是普通的猎食者——是头狼。',
      '一股压倒性的力量从此人身上涌出。方衡的手在发抖，他感知到的不是一只狼，而是一整片狼群的嚎叫。',
      '方衡看到了一片血色的原野，此人站在最高处，脚边是无数尸体。这是王者的气息——也是暴君的。'
    ],
    // 隐狼：误导性描述，看起来像好人但有一丝违和
    hidden_wolf: [
      '方衡感到一阵温和的气息。此人看起来是盟友——但他的影子比本人长了半拍，像是一面说谎的镜子。',
      '此人的内心似乎是平静的。但方衡总觉得有什么东西藏在那层平静底下，像湖面下的暗流。',
      '方衡感知到的是善意。但善意太完美了，完美得像一张画上去的面具。他说不上来哪里不对。'
    ],
    // 机械狼：诡异的空洞感，像机器在模仿人
    mechanical_wolf: [
      '方衡感到一种前所未有的违和感。此人体内好像是空的——没有温度，没有情绪，只有某种冰冷的秩序在运转。',
      '此人的存在感很奇怪。方衡觉得自己不是在看一个人，而是在看一台精密的仪器。它有心跳，但那心跳像齿轮在咬合。',
      '方衡什么都没感知到。不是"安全"，而是真正的空白。就像此人灵魂的位置放着一面没有映像的镜子。'
    ],
    // 神职：温暖的能量，像是某种力量在守护
    prophet: [
      '方衡感到一阵熟悉的共鸣。此人身上有一种和自己相似的能量——来自他人的力量，温和但坚定。',
      '一股暖流从此人身上传来。方衡辨认出那是信仰的力量，来源于身边人的存在。',
    ],
    witch: [
      '方衡感知到生与死在此人身上交织。她的手指能触摸生命的边缘——既能推回去，也能拉过来。',
      '一股草药和泥土的气息。方衡感到此人身上有两股力量在拉扯：一股是治愈，一股是诅咒。',
    ],
    knight: [
      '方衡感受到一种锐利的正义感，像一把出鞘的剑。此人随时准备为保护他人而战——也可能因误判而伤人。',
      '一股炽热的力量。方衡辨认出那是守护的意志，坚硬如铁，但也容易伤到自己。',
    ],
    magician: [
      '方衡感到一阵眩晕。此人的存在像是水面上的涟漪，不断变化，难以捉摸。真实与幻象在他身上没有界限。',
      '方衡觉得自己在看一面万花筒。此人的本质不断翻转、重组，每一秒都和上一秒不同。',
    ],
    // 村民：平静但各有特质
    villager_calm: [
      '方衡感到一阵平静。此人没有杀意，只是一个普通人。',
      '此人身上没有夜光气息，也没有特殊能量。方衡只感知到一个普通人的心跳。',
      '温和的、无害的。方衡确认此人是盟友——至少此刻是。'
    ],
    villager_guilty: [
      '方衡感知到一股沉重的愧疚。此人没有杀意，但内心有一个巨大的空洞，是被什么东西腐蚀过的痕迹。',
      '此人身上没有夜光的气息。但方衡感到一种沉甸甸的负担，像背着一具看不见的尸体。',
    ],
    // 特殊状态
    broken_witch: [
      '方衡感到一阵寒意。此人曾经拥有生与死的力量，但现在那力量碎裂了，残片像玻璃一样扎进她的精神。',
      '一股失控的能量。方衡辨认出这是崩溃的征兆——此人曾经能救人，现在她可能变成最危险的人。',
    ],
    memory_user: [
      '方衡感到一阵前所未有的眩晕。此人身上重叠着无数层时间的痕迹，像是千百个版本的他压缩在一起。',
      '方衡看到了一条首尾相连的河流。此人的存在不属于现在——他同时存在于许多个昨天和明天。',
    ]
  };

  Game.prophetCheck = function (targetId) {
    var g = ensureState();
    var pr = g.godSkills.prophet;
    var targetRole = Game.roleOf(targetId);

    // 确定感知类型
    var pool;
    if (targetId === 'chen_mo' && Game.hasFlag('loop_awakened')) {
      pool = Game.PROPHET_TEXTS.memory_user;
    } else if (targetId === 'ye_zhiqiu' && Game.witchBroken()) {
      pool = Game.PROPHET_TEXTS.broken_witch;
    } else if (targetId === 'chen_mo' || targetId === 'zheng_shoushan') {
      // 陈默和老郑有深重的过去
      pool = Game.PROPHET_TEXTS.villager_guilty;
    } else {
      pool = Game.PROPHET_TEXTS[targetRole] || Game.PROPHET_TEXTS.villager_calm;
    }

    // 随机选一条描述
    var text = pool[Math.floor(Math.random() * pool.length)];

    // 简化阵营判定（供内部逻辑用，不直接显示）
    var wolfRoles = ['wolf_king', 'wolf', 'mechanical_wolf'];
    var hiddenWolf = targetRole === 'hidden_wolf';
    var isWolf = wolfRoles.indexOf(targetRole) !== -1;
    // 隐狼不算明确的敌人
    var alignment = (isWolf && !hiddenWolf) ? 'enemy' : 'ally';

    var record = {
      target: targetId,
      text: text,
      alignment: alignment,
      day: g.day,
      loop: g.loop
    };
    pr.checks.push(record);
    return { ok: true, perception: text, alignment: alignment, target: targetId };
  };"""

if old_func in c:
    c = c.replace(old_func, new_func)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Rewrote prophetCheck with fuzzy perception. Length:', len(c))
else:
    print('Could not find old prophetCheck')