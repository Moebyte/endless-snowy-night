# 变量与状态管理指南

所有游戏状态统一挂在 `State.variables.game` 下。不要直接创建 `$xxx` 形式的零散变量。

## 状态结构

```javascript
{
  chapter: 1,        // 当前章节
  loop: 1,           // 当前轮回
  day: 1,            // 轮回内第几天（1-7）
  time: '06:00',     // 当前时间

  stats: {
    san: 100,        // 理智值 0-100
    hunger: 0,       // 饥饿值 0-100
    trust_suwan: 50, // 苏晚信任度
    trust_jiangbai: 30,
    trust_fang_heng: 30,
    trust_shenshen: 20,
    fear_level: 0
  },

  alive: { /* 角色存活状态 */ },
  roles: { /* 角色当前身份 */ },

  inventory: {},     // 道具
  clues: {},         // 线索
  flags: {},         // 关键事件标记
  endings: {},       // 已解锁结局
  visited: {},       // passage 访问次数

  safehouse: {       // 安全屋状态
    intruded: false,
    target: null
  },

  memories: []       // 跨轮回记忆碎片
}
```

## Game API

### 道具

- `Game.addItem(id, count)`
- `Game.removeItem(id, count)`
- `Game.hasItem(id)`
- `Game.itemCount(id)`
- `Game.itemName(id)`

### 线索

- `Game.addClue(id)`
- `Game.hasClue(id)`
- `Game.clueName(id)`
- `Game.clueDesc(id)`

### Flags

- `Game.setFlag(id, value)`
- `Game.hasFlag(id)`

### 结局

- `Game.unlockEnding(id)`
- `Game.hasEnding(id)`

### 角色

- `Game.isAlive(charId)`
- `Game.kill(charId)`
- `Game.revive(charId)`
- `Game.roleOf(charId)`

### 状态

- `Game.changeSan(delta)`
- `Game.san()`
- `Game.changeTrust(charId, delta)`
- `Game.trust(charId)`

### 循环

- `Game.nextDay()`：进入下一天，若超过第 7 天则自动进入下一轮
- `Game.nextLoop()`：强制进入下一轮
- `Game.advanceDay()`：进入下一天，返回是否进入新轮回
- `Game.resetLoopState()`：重置轮回内世界状态（人物、身份、flags、道具）

### 安全屋

- Game.isNight()：当前时间是否 >= 23:00
- Game.canWolfIntrude()：今夜是否还能强闯一间安全屋
- Game.wolfIntrude(target)：记录狼人强闯目标（每晚只能成功一次）
- Game.getSafehouseTarget()：获取今晚被强闯的目标
- Game.clearSafehouse()：重置当晚安全屋状态（进入新一天时自动调用）

### 访问记录

- `Game.visit(passageName)`
- `Game.hasVisited(passageName)`
- `Game.visitCount(passageName)`

### 记忆

- `Game.addMemory(text)`

### 状态摘要

- `Game.getStatus()`

## 常量

角色 ID、身份、结局 ID、道具 ID、线索 ID、Flag ID 都集中在 `src/scripts/state.js` 中定义。新增时请按现有格式添加。

## 在 passage 中使用

```twee
<<run Game.addClue('cellar_door')>>
<<if Game.hasClue('cellar_door')>>
你想起了那扇铁门。
<</if>>
```

不要直接写：

```twee
<<set $hasKey to true>>
```
