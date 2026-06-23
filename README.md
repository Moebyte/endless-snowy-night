# 无尽雪夜（Endless Snow Night）

基于 Twine 2 + SugarCube 2 的文字冒险游戏。十二名陌生人在暴风雪中被困于落雁山庄，每七天一个轮回——只有陈默记得发生过的一切。

## 快速开始

```bash
# 构建（纯 Node.js，无需 npm install）
npm run build

# 构建并监听文件变化
npm run dev

# 检查链接完整性
npm run check

# 跑 50 轮 AI 模拟（平衡性调参）
node tools/sim50.js

# 跑单种子详细模拟
node tools/sim_detail.js <seed>
```

构建完成后，直接在浏览器打开 `dist/index.html` 即可游玩。

## 游戏简介

- **体裁**：文字冒险 / 悬疑生存 / 无限流
- **核心机制**：每 7 天一个轮回，主角陈默保留记忆，其他人全部重置
- **阵营**：4 神（昭判、渡君、镇煞、幻真） vs 4 村民 vs 4 狼
- **结局**：真结局、好结局、坏结局等多结局分支

详细设定见 [docs/design-doc.md](docs/design-doc.md)。

## 目录结构

```
src/
  passages/           # 剧情 passage（.twee）
    common/           # Start、Day_Morning、Day_Evening、Day7_Ending、夜间结算、UI
    story/            # 昼夜流程入口
  scripts/            # SugarCube Story JavaScript（自动拼接进 HTML）
    state.js          # 状态结构与常量（角色、道具、线索、地图、房间）
    game.js           # 公共 API（道具/线索/Flag/轮回/安全屋）
    skills/           # 神职 AI（prophet/witch/knight/magician + exile 三件套）
    wolves/           # 狼队 AI（vote/night-kill/hidden-wolf/mech-wolf/fake-jump/self-stab）
    day-events.js     # 白天事件池
    pursuit.js        # 夜间追击战
  styles/
    story.css
vendor/
  sugarcube-2/        # SugarCube 2 格式文件（构建用）
tools/
  build.js            # 构建脚本（Twee + JS → 单 HTML）
  check-links.js      # passage 链接完整性检查
  sim50.js            # 50 轮 AI 模拟（批量统计）
  sim_detail.js       # 单种子详细模拟（输出逐日行动日志）
dist/
  index.html          # 可发布 HTML
docs/
  design-doc.md       # 游戏设计文档 v9
  character-bible.md  # 角色圣经 v9（作者用）
  writing-guide.md    # 写作指南（含陈默视角限制）
  variable-guide.md   # 变量与状态管理指南
  passage-guidelines.md
  story-outlines.md   # 三条完整 Day1-7 剧情大纲（取自模拟器）
  story-pool/         # 每个角色的白天剧情池素材
  character_pools/    # 角色卡 me.md / they.md + 交互矩阵
  prompts/            # 角色写作提示词（批量生成剧情池用）
```

## 安全提醒

- 本地 `.ssh/` 目录存放 GitHub Deploy Key，已加入 `.gitignore`。
- 之前暴露的 PAT 已删除，仅使用 SSH deploy key 推送。

## 开发指南

### 写新剧情

1. 在 `src/passages/common/` 或 `src/passages/story/` 下新建 `.twee` 文件
2. 第一行格式：`:: PassageName`（PascalCase + 下划线）
3. 用 `<<run Game.addClue("clue_id")>>` 添加线索
4. 用 `<<run Game.addItem("item_id")>>` 添加道具
5. 用 `<<run Game.setFlag("flag_id")>>` 设置事件标记
6. 用 `[[显示文字->PassageName]]` 做跳转

详细规范见 [docs/writing-guide.md](docs/writing-guide.md)。

### 运行 AI 模拟

```bash
# 50 轮批量统计
node tools/sim50.js

# 单种子逐日日志（用于提取剧情素材）
node tools/sim_detail.js 42
```

模拟器会输出每轮的死亡顺序、神职和狼队的技能发动情况、流放结果。

### 部署到 GitHub Pages

1. `npm run build`
2. 推送 `dist/index.html` 到 `gh-pages` 分支（或配置 GitHub Actions 自动部署，见 `.github/workflows/deploy.yml`）
3. 访问 `https://<username>.github.io/<repo>/`

## 技术栈

- **引擎**：Twine 2 + SugarCube 2.37
- **构建**：纯 Node.js（无需外部依赖）
- **状态管理**：统一挂在 `State.variables.game`，通过 `Game.*` API 访问
- **编码**：全部 UTF-8（无 BOM）

## License

MIT
