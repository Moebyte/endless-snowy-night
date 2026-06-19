# 写作指南

## 核心世界观规则

在开始写作前，请理解以下世界规则：

1. **7 天一轮回**：每天 06:00 开始，23:00 后各人回房，房间成为安全屋。
2. **安全屋规则**：23:00 后除狼人外不得闯入他人房间；狼人每夜只能强闯一间安全屋。
   - **能力时间规则**：神职能力来源于村民，任意时间可用；狼人能力来源于夜光，仅夜晚可用。
   - 例外：狼王被杀时可同归于尽（被动，任何时间，但被诅咒杀死时不能发动）；机械狼弑神后白天也可使用偷来的神力。
3. **情报差异**：
   - 村民初始没有任何情报。
   - 老郑是上一轮幸存者，知道山庄部分真相。
   - 陈默因无限记忆保留跨轮回经验。
4. **神职使命**：系统会告知所有神职——“保护好那些没有能力的人，他们的存在至关重要；且不得轻易透露自己的能力与身份。”
5. **狼人首夜**：所有狼人第一晚会进入同一个共享噩梦，在梦中本能地知晓自己的技能，并彼此相认。但他们不知道神职的具体能力。
6. **弑神夺位**：
   - 狼人弑神属于正常夜间博弈；机械狼顾言弑神后可获得该神职能力。
   - 村民中只有陈默和老郑可以弑神并夺取神职能力。
   - 苏晚、江白作为正面/无黑历史角色，原则上不触发弑神剧情。

本文档面向后续参与剧情写作的作者。你不需要懂 SugarCube 的全部细节，只需按照以下规范添加 passage 即可。

## 1. Passage 命名规则

统一使用 PascalCase + 下划线，结构清晰：

- `Chapter01_Start`：第一章开始
- `Chapter01_Day1_Evening`：第一章第一天傍晚
- `Chapter02_BranchA`：第二章分支 A
- `Ending_Good`：好结局
- `Common_Inventory`：公共 UI 面板
- `StoryInit` / `StoryCaption` / `StoryJavaScript` / `StoryStylesheet`：SugarCube 保留名

禁止以下命名：

- `开始`
- `树林1`
- `这里`
- `坏结局`
- `结局A`

## 2. 文件组织

每个 passage 一个 `.twee` 文件，放在对应章节目录下：

```text
src/passages/chapter01/Chapter01_Start.twee
src/passages/chapter02/Chapter02_Start.twee
src/passages/chapter07/Ending_Good.twee
src/passages/common/Common_Inventory.twee
```

## 3. 如何添加新道具

道具分两步：

1. 在 `src/scripts/state.js` 的 `GameState.ITEMS` 中注册：

```javascript
mirror_shard: { name: '镜子碎片', desc: '地下祭祀空间掉落的碎片，边缘锋利。' }
```

2. 在剧情 passage 中通过 API 获得：

```twee
<<run Game.addItem('mirror_shard')>>
```

不要直接修改 `$game.inventory.mirror_shard = true`。

## 4. 如何添加新线索

1. 在 `src/scripts/state.js` 的 `GameState.CLUES` 中注册。
2. 在剧情 passage 中：

```twee
<<run Game.addClue('hidden_diary')>>
```

显示时调用：

```twee
<<if Game.hasClue('hidden_diary')>>
你想起了那本日记。
<</if>>
```

## 5. 如何设置 flag

Flag 用于记录关键事件，如“是否见过某人”“是否触发某剧情”。

```twee
<<run Game.setFlag('met_laozheng')>>
<<if Game.hasFlag('met_guardian')>>
老郑会出现在这里。
<</if>>
```

## 6. 如何解锁人物隐藏信息

玩家在 `Common_Characters.twee` 中只能看到角色的表面信息（姓名、年龄、专业、第一印象、关系）。隐藏身份、能力、黑历史需要通过剧情解锁。

1. 在剧情中揭示某条信息时，调用：

```twee
<<run Game.revealInfo("zhou_yang", "wolf_king")>>
```

2. 在人物面板或剧情中判断：

```twee
<<if Game.hasRevealed("zhou_yang", "wolf_king")>>
你已确认周阳是狼王。
<</if>>
```

完整角色设定请查阅 `docs/character-bible.md`。

## 6. 如何写条件分支

简单条件可以直接写在 passage 里：

```twee
<<if Game.hasClue('cellar_door')>>
[[利用铁门情报追问老周|Chapter02_CellarInfo]]
<<else>>
[[继续观察|Chapter02_Observations]]
<</if>>
```

复杂分支（涉及多个变量、随机、结算）请封装到 `src/scripts/game.js`，然后在 passage 中调用函数。

## 7. 如何添加结局

1. 在 `src/scripts/state.js` 的 `GameState.ENDINGS` 中注册结局 ID。
2. 在结局 passage 中解锁：

```twee
<<run Game.unlockEnding('my_ending')>>
```

3. 结局 passage 命名以 `Ending_` 开头，并提供“重新开始”链接到 `Start`。

## 8. 如何避免断链

- 每次新增 passage 后运行 `npm run check`。
- 所有 `[[文字->PassageName]]` 中的 `PassageName` 必须对应一个存在的 passage。
- 不要链接到动态函数如 `passage()`，这是 SugarCube 保留用法，检查工具会忽略。
- 重命名 passage 时，全局搜索旧名称并替换。

## 9. 提交新章节流程

1. 在 `src/passages/chapterXX/` 下新建 `.twee` 文件。
2. 只修改你负责的章节文件，不要改 `src/scripts/state.js`  unless 需要新道具/线索/结局。
3. 运行 `npm run check` 检查断链和孤立节点。
4. 运行 `npm run build` 生成 `dist/storydata.twee`。
5. 提交 PR 时附上演示路径（从 `Start` 到你的新 passage 如何到达）。

## 10. 不应修改的核心文件

- `src/scripts/state.js`：状态结构。如需新增 ID，可修改；不要改已有字段含义。
- `src/scripts/game.js`：公共 API。如需新函数，可扩展；不要删改已有函数。
- `src/styles/story.css`：全局样式。如需新 class，可扩展；不要改已有变量名。
- `tools/check-links.js` / `tools/build.js`：工程工具。

## 11. 写作示例

```twee
:: Chapter03_Day3_Morning
<<set $game.day to 3>>
<<set $game.time to '06:00'>>
<<run Game.visit()>>
<h2>Day 3 · 清晨</h2>
<p>你又醒来了。天花板上的水渍像一张闭眼的人脸。</p>
<<if Game.hasFlag('loop_awakened')>>
<p>这是第 <<print $game.loop>> 轮的第 <<print $game.day>> 天。你记得之前发生过什么。</p>
<</if>>
<p>[[去大厅|Chapter03_Day3_Hall]]</p>
```

## 12. 小贴士

- 段落不要过长，手机屏幕上一段控制在 3-5 行。
- 选项按钮使用 `class="choice-list"` 包裹，保持样式一致。
- 系统提示使用 `<p class="system-hint">...</p>`。
- 内心独白使用 `<p class="thought">...</p>`。
