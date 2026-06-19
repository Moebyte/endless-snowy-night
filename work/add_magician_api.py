# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Add magician API after the prophet section, before resetGodSkillsDaily
marker = "  // ===== 神职技能每日/每轮重置 ====="

magician_api = """
  // ===== 魔术师（沈慎）：身份交换，只有夜晚狼人形态可见 =====
  // 每天选择两人交换身份。狼人夜间看到的是交换后的身份。
  // 如果狼人攻击交换后的目标，实际被杀的是另一个人。
  // 如果实际被杀的是狼王，触发同归于尽，动手的狼也死。

  Game.magicianSwap = function (charA, charB) {
    var g = ensureState();
    var m = g.godSkills.magician;
    if (m.swapsUsed >= m.maxSwaps) return { ok: false, reason: 'max_reached' };
    if (charA === charB) return { ok: false, reason: 'same_person' };
    if (!Game.isAlive(charA) || !Game.isAlive(charB)) return { ok: false, reason: 'dead' };
    m.swapsUsed += 1;
    m.currentSwap = { a: charA, b: charB };
    m.swapHistory.push({ day: g.day, a: charA, b: charB });
    return { ok: true, swap: m.currentSwap };
  };

  // 获取当前生效的交换
  Game.getMagicianSwap = function () {
    return ensureState().godSkills.magician.currentSwap;
  };

  // 检查某人在狼人眼中实际对应的是谁（经过交换后的映射）
  Game.resolveSwapTarget = function (charId) {
    var swap = Game.getMagicianSwap();
    if (!swap) return charId;
    if (swap.a === charId) return swap.b;
    if (swap.b === charId) return swap.a;
    return charId;
  };

  Game.magicianSwapsRemaining = function () {
    var m = ensureState().godSkills.magician;
    return m.maxSwaps - m.swapsUsed;
  };

  // 每天清除当前交换（交换只在当夜生效）
  Game.magicianResetDaily = function () {
    var g = ensureState();
    g.godSkills.magician.currentSwap = null;
  };

"""

if marker in c and 'magicianSwap' not in c:
    c = c.replace(marker, magician_api + '\n' + marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added magician API. Length:', len(c))
else:
    print('Issue:', marker in c, 'magicianSwap exists:', 'magicianSwap' in c)