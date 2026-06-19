# 无尽雪夜（Endless Snow Night）

基于 Twine 2 + SugarCube 2 的文字冒险游戏。十二个陌生人被困在与世隔绝的落雁山庄，每七天一个轮回——只有陈默记得发生过的一切。

## 快速开始

```bash
# 安装依赖（可选，构建脚本纯 Node.js）
npm install

# 构建游戏
npm run build

# 构建并监听文件变化
npm run dev

# 检查链接完整性
npm run check
```

构建完成后，直接在浏览器打开 `dist/index.html` 即可游玩。

## 游戏简介

- **体裁**：文字冒险 / 悬疑生存 / 无限流
- **核心机制**：每 7 天一个轮回，主角陈默保留记忆，其他人全部重置
- **阵营**：4 神（预言家、女巫、骑士、魔术师） vs 4 村民 vs 4 狼（狼王、隐狼、清道夫、机械狼）
- **结局**：真结局、好结局、坏结局、隐藏结局（弑神分支）

详细设定见 [docs/design-doc.md](docs/design-doc.md)。

## 目录结构

```
src/
  passages/           # 所有剧情 passage（.twee）
    chapter01/        # Day 1：抵达山庄
    chapter02/        # Day 2：循环觉醒
    chapter03_06/     # Day 3-6：推理调查 + 探索场景
    chapter07/        # Day 7：结局
    common/           # 公共 UI（状态栏、地图、道具栏、神职面板、夜间结算）
  scripts/            # SugarCube Story JavaScript
    state.js          # 状态结构与常量（角色、道具、线索、地图）
    game.js           # 公共 API（道具/线索/Flag/轮回/安全屋）
    skills/           # 神职 AI 技能（witch/knight/prophet/magician）
    wolves/           # 狼队 AI（投票、夜间击杀、悍跳、隐狼、机械狼）
    pursuit.js        # 夜间追击战
  styles/
    story.css         # 游戏样式
tools/
  build.js            # 构建脚本（Twee → HTML）
  check-links.js      # 链接检查
  sim_v*.js           # AI 决策模拟脚本
dist/
  index.html          # 可发布 HTML
  storydata.twee      # Twee 源码产物
docs/
  design-doc.md       # 游戏设计文档
  writing-guide.md    # 写作指南
  variable-guide.md   # 变量指南
  passage-guidelines.md
  character-bible.md  # 角色圣经（作者用）
outputs/
  暴风雪山庄_无限流_剧本_Pilot.md  # 原始剧本
```

## 开发指南

### 写新剧情

1. 在 `src/passages/chapterXX/` 下新建 `.twee` 文件
2. 第一行格式：`:: PassageName`（PascalCase + 下划线）
3. 用 `<<run Game.addClue("clue_id")>>` 添加线索
4. 用 `<<run Game.addItem("item_id")>>` 添加道具
5. 用 `<<run Game.setFlag("flag_id")>>` 设置事件标记
6. 用 `[[显示文字->PassageName]]` 做跳转

详细规范见 [docs/writing-guide.md](docs/writing-guide.md)。

### 运行 AI 模拟

```bash
node tools/sim_v14.js
```

模拟 20 轮 7 天轮回，输出神职和狼队的死亡分布，用于平衡性调参。

### 部署到 GitHub Pages

1. `npm run build`
2. 把 `dist/index.html` 推送到 `gh-pages` 分支
3. 访问 `https://<username>.github.io/<repo>/`

## 技术栈

- **引擎**：Twine 2 + SugarCube 2.37
- **构建**：纯 Node.js（无需外部依赖）
- **状态管理**：统一挂在 `State.variables.game`，通过 `Game.*` API 访问
- **编码**：全部 UTF-8（无 BOM）

## License

MIT