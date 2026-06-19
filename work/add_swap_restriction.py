# -*- coding: utf-8 -*-
p = 'src/scripts/game.js'
f = open(p, 'r', encoding='utf-8')
c = f.read()
f.close()

old_func = """  Game.magicianSwap = function (charA, charB) {
    var g = ensureState();
    var m = g.godSkills.magician;
    if (m.swapsUsed >= m.maxSwaps) return { ok: false, reason: 'max_reached' };
    if (charA === charB) return { ok: false, reason: 'same_person' };
    if (!Game.isAlive(charA) || !Game.isAlive(charB)) return { ok: false, reason: 'dead' };
    m.swapsUsed += 1;
    m.currentSwap = { a: charA, b: charB };
    m.swapHistory.push({ day: g.day, a: charA, b: charB });
    return { ok: true, swap: m.currentSwap };
  };"""

new_func = """  // 检查某人是否在上一晚的交换中被使用过
  Game.wasInLastSwap = function (charId) {
    var g = ensureState();
    var history = g.godSkills.magician.swapHistory;
    if (history.length === 0) return false;
    var last = history[history.length - 1];
    return last.a === charId || last.b === charId;
  };

  Game.magicianSwap = function (charA, charB) {
    var g = ensureState();
    var m = g.godSkills.magician;
    if (m.swapsUsed >= m.maxSwaps) return { ok: false, reason: 'max_reached' };
    if (charA === charB) return { ok: false, reason: 'same_person' };
    if (!Game.isAlive(charA) || !Game.isAlive(charB)) return { ok: false, reason: 'dead' };
    // 不能连续两晚交换同一个人
    if (Game.wasInLastSwap(charA)) return { ok: false, reason: 'repeated_' + charA };
    if (Game.wasInLastSwap(charB)) return { ok: false, reason: 'repeated_' + charB };
    m.swapsUsed += 1;
    m.currentSwap = { a: charA, b: charB };
    m.swapHistory.push({ day: g.day, a: charA, b: charB });
    return { ok: true, swap: m.currentSwap };
  };"""

if old_func in c:
    c = c.replace(old_func, new_func)
    f = open(p, 'w', encoding='utf-8')
    f.write(c)
    f.close()
    print('Added swap restriction')
else:
    print('Could not find magicianSwap function')