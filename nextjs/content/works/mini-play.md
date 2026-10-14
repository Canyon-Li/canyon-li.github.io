---
title: Mini-Play
tagline: 把技术概念演成一场人人看得懂的小剧场
role: 设计与开发
period: 2026.09
status: 维护中
stack: [Python, Claude Code Skill, pydantic, Jinja2, YAML]
category: tool
year: 2026
featured: false
license: MIT
size: 26 个文件 · 6 个 Python
demo: https://canyon-li.github.io/Mini-Play/
repo: https://github.com/Canyon-Li/Mini-Play
metrics:
  - value: 6 种
    label: beat 类型
  - value: 2 个
    label: 解耦 skill
  - value: 8 角色
    label: 最长示例剧本
---

## 为什么做

我写技术文档时最大的挫败感是：**概念本身不难，难的是让人有理由去理解它**。
平铺直叙地讲「重排序是怎么工作的」，读者只会记住一句话；但如果先让一个角色
把问题问错，再让另一个角色被这个错误卡住，读者就有了跟着往下走的动力。

概念的产生本来就是矛盾推动的——知识盲区、常见误区、方案之争。所以这个项目
把技术概念写成**角色扮演对话**：不是聊天记录整理器，而是一套剧本 DSL。

## 关键决策

### 剧本即源码，Markdown 和 HTML 都是渲染产物

YAML 剧本是唯一真相。角色、台词、旁白、代码块、谢幕总结都是结构化字段，
渲染成什么格式是后面的事。校验失败只影响渲染，不会破坏剧本本身；
改了剧本随时重新渲染，就像改了源码重新编译。

代价是多了一层 DSL 要学——写一个剧本得先知道 `beats` 有哪六种、
`closing.table` 长什么样。对一次性内容来说这层抽象是亏的，只有当剧本要反复渲染、
或者要进版本管理时才回本。

### 拆成「创作」和「渲染」两个 skill，而不是一个大 skill

`mini-play` 只负责把主题写成结构化 YAML，`mini-play-render` 只负责把 YAML
渲染成 Markdown 或自包含 HTML。渲染器不依赖 Claude，可以直接在命令行跑：
`python skills/mini-play/render.py html <剧本.yaml>`。

代价是两个 skill 必须一起装——渲染器住在创作 skill 的目录里，
单装一个会找不到渲染器。我在文档里把这点写在安装步骤的第一行。

### 用 pydantic 强制校验，不靠提示词自律

模型写出来的 YAML 很容易出现角色名对不上、beat 少字段、字段名拼错这类问题。
这些全靠提示词约束是拦不住的，所以用 pydantic 模型做强制校验：
角色引用完整性、beat 必填字段、防 typo，校验不过就不渲染。

代价是 schema 一变就要同步改模型和文档，扩展 beat 类型不再是一件随手的事。
换来的是渲染器可以假定输入是干净的，不用在每个渲染分支里写防御代码。

## 结果

- 六种 beat：`line`（台词）/ `thought`（内心独白）/ `stage_direction`（舞台说明）/
  `aside`（旁白）/ `code`（代码块）/ `transition`（转场）
- 渲染出的 HTML 是**自包含单文件**，内联 CSS / JS，离线可开；支持点击角色名弹出角色卡、
  旁白默认折叠不打断剧情、幕间导航、深色主题
- 两部示例剧本：《元数据知识库的诞生》（8 角色）与《LLM 的 12 步喂饭之旅》（2 角色 / 9 幕）
- 可通过 Claude Code 插件市场一行安装

## 不足与下一步

1. **渲染目标只有 Markdown 和 HTML。** PDF 和 Slides 都还没有，
   想做演示稿的话得自己再接一层。
2. **情绪枚举只有中文。** 英文剧本能写，但 `emotion` 字段没有对应的枚举集，
   多语言剧本暂时不支持。
3. **规模还没被验证过。** 最长的示例剧本是 8 个角色、9 幕这个量级。
   再长会不会失控，我还没有真实的用例来说话。
