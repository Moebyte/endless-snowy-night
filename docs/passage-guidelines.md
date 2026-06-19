# Passage 命名与组织规范

## 命名格式

所有 passage 名称使用英文 PascalCase，必要时用下划线分隔语义单元：

```text
Chapter01_Start
Chapter01_Day1_Evening
Chapter02_BranchA
Ending_Good
Ending_Bad_Starvation
Common_Inventory
Common_ClueList
```

## 保留名称

以下 passage 名称由 SugarCube 2 引擎保留，具有特殊功能：

- `Start`：游戏开始 passage
- `StoryInit`：游戏初始化时执行一次
- `StoryCaption`：侧边栏/底部状态面板
- `StoryMenu`：侧边菜单
- `StoryJavaScript`：全局 JavaScript
- `StoryStylesheet`：全局 CSS

## 目录结构

```text
src/passages/
├── chapter01/          # 第一章（Loop X 第 1 天）
├── chapter02/          # 第二章（Loop X 第 2 天）
├── chapter03_06/       # 第三至六章框架
├── chapter07/          # 第七章（结局）
└── common/             # 公共 UI、系统提示
```

## 文件命名

每个 passage 一个文件，文件名与 passage 名一致：

```text
Chapter01_Start.twee
Ending_Good.twee
```

## Tags

当前不使用 passage tags。如需使用（例如 `nobr`），请统一在团队内讨论。

## 链接写法

推荐显式目标写法，避免歧义：

```twee
[[去大厅|Chapter01_Hall]]
```

可接受的写法：

```twee
[[Chapter01_Hall]]
<<link "去大厅">><<goto "Chapter01_Hall">><</link>>
<<button "去大厅">><<goto "Chapter01_Hall">><</button>>
```

禁止随意命名目标 passage。
