# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

# Add time-rule helper functions before the god skills section
marker = "  // ---------- 神职技能系统 ----------"

time_rules = """
  // ---------- 能力时间规则 ----------
  // 神职能力来源：村民的存在 → 任意时间可用
  // 狼人能力来源：夜光 → 仅夜晚可用
  // 例外：狼王被杀时同归于尽（被动，不限时间）；机械狼白天可用偷来的神力

  // 神职是否可以当前行动（神职任意时间可用）
  Game.canGodAct = function () {
    return true; // 神职能力来源于村民，不受时间限制
  };

  // 狼人是否可以当前行动（仅夜晚，除非机械狼用偷来的神力）
  Game.canWolfAct = function (charId) {
    if (Game.isNight()) return true;
    // 机械狼白天可以用偷来的神力
    var role = Game.roleOf(charId);
    if (role === 'mechanical_wolf') {
      return !!Game.hasFlag('gu_yan_stole_god_power');
    }
    return false;
  };

  // 狼王同归于尽是否可发动（被动，任何时间，但被诅咒杀死时不能发动）
  Game.canWolfKingRetaliate = function (causeOfDeath) {
    // 被诅咒（女巫毒杀）时无法发动
    if (causeOfDeath === 'curse') return false;
    return true; // 其他死因（决斗、弑神等）均可发动
  };

  // 机械狼是否已偷取神力
  Game.hasMechWolfPower = function () {
    return !!Game.hasFlag('gu_yan_stole_god_power');
  };

  // 机械狼偷取神力（弑神后触发）
  Game.mechWolfStealPower = function (godCharId) {
    var g = ensureState();
    var godRole = Game.roleOf(godCharId);
    g.flags.gu_yan_stole_god_power = true;
    g.flags.gu_yan_stolen_role = godRole;
    return godRole;
  };

  Game.getMechWolfStolenRole = function () {
    var g = ensureState();
    return g.flags.gu_yan_stolen_role || null;
  };

"""

if marker in c and 'canGodAct' not in c:
    c = c.replace(marker, time_rules + '\n' + marker)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added time-rule functions. Length:', len(c))
else:
    print('Marker issue:', marker in c, 'canGodAct exists:', 'canGodAct' in c)