# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

marker = "  // ---------- 能力时间规则 ----------"

wolf_ai = """
  // ---------- 狼人 AI 目标选择系统（完全隐藏，玩家不可见） ----------
  // 多维评分：每个活着的好人每晚被计算一个"猎杀优先级"，狼人攻击最高分目标。
  // 维度：威胁度、孤立度、信任亲近度、自保能力、信息量

  Game.WOLF_AI_WEIGHTS = {
    threat: 30,       // 对狼人阵营的威胁（神职高，有情报村民中，普通村民低）
    isolation: 25,    // 是否落单（独自行动 / 无保护时更高）
    trust_chenmo: 20, // 和陈默的关系（亲近者被优先针对，打击陈默理智）
    ability: 15,      // 自保能力（高能力者对狼人是威胁，但也更难杀）
    info: 10          // 角色知道多少真相（老郑、陈默知道最多）
  };

  // 角色基础属性表（用于 AI 评分，不显示给玩家）
  Game.WOLF_AI_PROFILES = {
    chen_mo:        { threat: 5,  ability: 3, info: 10 }, // 陈默：信息量极高但自保弱，威胁取决于知情程度
    su_wan:         { threat: 2,  ability: 4, info: 2  }, // 苏晚：普通村民，但和陈默亲近
    jiang_bai:      { threat: 2,  ability: 5, info: 1  }, // 江白：自保能力稍强
    fang_heng:      { threat: 9,  ability: 7, info: 5  }, // 预言家：极高威胁
    shen_shen:      { threat: 8,  ability: 8, info: 6  }, // 魔术师：高威胁高能力
    ye_zhiqiu:      { threat: 9,  ability: 7, info: 3  }, // 女巫：极高威胁
    zheng_shoushan: { threat: 4,  ability: 2, info: 8  }, // 老郑：信息量极高但自保弱
    lin_xiaoman:    { threat: 8,  ability: 8, info: 2  }, // 骑士：极高威胁高能力
    gu_yan:         { threat: 0,  ability: 0, info: 0  }, // 狼（不在候选目标中）
    zhou_yang:      { threat: 0,  ability: 0, info: 0  }, // 狼王
    tang_xiaotang:  { threat: 0,  ability: 0, info: 0  }, // 隐狼
    zhao_mingcheng: { threat: 0,  ability: 0, info: 0  }  // 清道夫狼
  };

  // 计算单个角色的猎杀优先级分数
  Game.scoreTarget = function (charId) {
    var g = ensureState();
    var profile = Game.WOLF_AI_PROFILES[charId];
    if (!profile) return 0;

    var w = Game.WOLF_AI_WEIGHTS;
    var score = 0;

    // 1. 威胁度（神职 > 知情村民 > 普通村民）
    var threatScore = profile.threat;
    // 如果陈默已觉醒轮回记忆，陈默的威胁飙升
    if (charId === 'chen_mo' && Game.hasFlag('loop_awakened')) {
      threatScore = 8;
    }
    // 如果角色已被揭示为神职（暴露），威胁更高
    var role = Game.roleOf(charId);
    var godRoles = ['prophet', 'witch', 'knight', 'magician'];
    if (godRoles.indexOf(role) !== -1) {
      // 神职角色基础威胁高，但如果已暴露（被狼人知道身份）威胁更高
      if (Game.hasRevealed(charId, 'witch_exposed') || Game.hasRevealed(charId, 'identity_exposed')) {
        threatScore += 3;
      }
    }
    score += threatScore * w.threat;

    // 2. 孤立度（动态计算：是否在安全屋、是否有同伴保护）
    var isolationScore = 5; // 基础值
    // 夜间在安全屋的降低孤立度
    if (g.day > 1 && Game.isNight()) {
      isolationScore = 3; // 回房了，有门锁保护
    }
    // 如果角色受伤或处于虚弱状态，孤立度更高
    if (charId === 'lin_xiaoman' && Game.knightWeakened()) {
      isolationScore += 4; // 骑士虚弱时更容易被针对
    }
    // 女巫崩溃后是软目标
    if (charId === 'ye_zhiqiu' && Game.witchBroken()) {
      isolationScore += 3;
    }
    score += isolationScore * w.isolation;

    // 3. 信任亲近度（和陈默亲近的人被优先针对，打击陈默理智）
    var trustKey = 'trust_' + charId;
    var trustVal = g.stats[trustKey] || 0;
    // 苏晚特殊处理：她是陈默的恋人，杀她打击最大
    var trustScore = trustVal / 10; // 0-10
    if (charId === 'su_wan') {
      trustScore = 10; // 最高优先级情感打击
    }
    if (charId === 'jiang_bai') {
      trustScore = 7; // 室友，情感打击大
    }
    score += trustScore * w.trust_chenmo;

    // 4. 自保能力（高能力者对狼是威胁，但也意味着杀他们更有价值）
    score += profile.ability * w.ability;

    // 5. 信息量（知道越多越危险）
    var infoScore = profile.info;
    // 如果角色已获得破局线索，信息量更高
    var backstoryClue = GameState.BACKSTORY_KEYS[charId];
    if (backstoryClue && Game.hasClue(backstoryClue)) {
      infoScore += 2;
    }
    score += infoScore * w.info;

    // 加入随机扰动（±15%），避免每次轮回完全相同
    score *= (0.85 + Math.random() * 0.3);

    return Math.round(score);
  };

  // 狼人选择今夜目标（返回 charId）
  Game.getWolfTarget = function () {
    var g = ensureState();
    var candidates = [];
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];

    // 所有活着的好人都是候选目标
    Object.keys(g.alive).forEach(function (charId) {
      if (!g.alive[charId]) return;
      if (wolves.indexOf(charId) !== -1) return; // 狼人不打狼人
      if (charId === 'chen_mo') return; // 陈默是主角，不能被直接杀（他靠轮回存活）
      candidates.push(charId);
    });

    if (candidates.length === 0) return null;

    // 计算每个候选的分数
    var scored = candidates.map(function (id) {
      return { id: id, score: Game.scoreTarget(id) };
    });

    // 按分数排序（降序）
    scored.sort(function (a, b) { return b.score - a.score; });

    // 取最高分目标（有 20% 概率取第二高，增加不可预测性）
    var targetIdx = 0;
    if (scored.length > 1 && Math.random() < 0.2) {
      targetIdx = 1;
    }

    return scored[targetIdx].id;
  };

  // 执行狼人夜间猎杀（返回结果对象）
  Game.executeWolfKill = function () {
    var g = ensureState();
    var target = Game.getWolfTarget();
    if (!target) return { target: null, killed: false };

    var result = {
      target: target,
      targetName: GameState.PROFILES[target] ? GameState.PROFILES[target].name : target,
      killed: true,
      killer: null,
      special: null
    };

    // 检查骑士保护：如果林小满存活且未虚弱，有概率保护目标
    if (Game.isAlive('lin_xiaoman') && !Game.knightWeakened()) {
      if (target === 'tang_xiaotang') {
        // 林小满总是优先保护唐小棠附近的人，但唐小棠是隐狼……
        // 实际上林小满不会保护隐狼，跳过
      } else if (Math.random() < 0.15) {
        // 15% 概率林小满的保护让目标存活
        result.killed = false;
        result.special = 'protected_by_knight';
        return result;
      }
    }

    // 检查女巫还魂：叶知秋有概率自动救人（AI 模拟）
    // 注意：女巫的主动使用由玩家控制，这里不自动触发

    // 执行击杀
    Game.kill(target);

    // 确定凶手（随机选一只活着的狼）
    var wolves = ['zhou_yang', 'tang_xiaotang', 'zhao_mingcheng', 'gu_yan'];
    var aliveWolves = wolves.filter(function (w) { return g.alive[w]; });
    if (aliveWolves.length > 0) {
      result.killer = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
    }

    // 清道夫狼（赵明城）的特殊效果：抹除尸体
    if (result.killer === 'zhao_mingcheng') {
      result.special = 'body_removed'; // 女巫无法救活
    }

    return result;
  };

  // 获取上一次狼人击杀结果（供 passage 显示用）
  Game.getLastWolfKill = function () {
    var g = ensureState();
    return g.lastWolfKill || null;
  };

  Game.setLastWolfKill = function (result) {
    var g = ensureState();
    g.lastWolfKill = result;
  };

"""

if marker in c and 'scoreTarget' not in c:
    c = c.replace(marker, wolf_ai + '\n' + marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added wolf AI system. Length:', len(c))
else:
    print('Issue:', marker in c, 'scoreTarget exists:', 'scoreTarget' in c)