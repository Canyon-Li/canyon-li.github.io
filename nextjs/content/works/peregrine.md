---
title: Peregrine
tagline: 本地优先的对话式 Agent 工作台
role: 设计与开发
period: 2026.10 – 至今
status: 活跃
stack: [Python, FastAPI, React, TypeScript, WebSocket, SQLite]
category: web
year: 2026
featured: true
platform: Windows · macOS · Linux
license: MIT
size: 442 个文件 · 257 个 Python · 99 个 TS/TSX
repo: https://github.com/Canyon-Li/Peregrine
metrics:
  - value: 81
    label: 个测试文件
  - value: 2 层
    label: 上下文压缩
  - value: 67
    label: 次提交
---

## 为什么做

现在做 Agent 的多数是托管服务：你的对话、记忆、技能都躺在别人的服务器上。
Peregrine 反过来——后端是一套完整的 Agent 运行时，**数据全部落在本地**
（SQLite 加一个 `.peregrine/` 目录），不依赖任何外部托管服务。

我想要的不只是一个聊天框。工具调用、审批门控、上下文压缩、长期记忆、技能沉淀、
任务生命周期、定时调度、检查点——这些是 Agent 真正跑起来之后必然会撞上的问题，
与其每撞一个补一层，不如一次把它们放进同一个运行时里。

## 关键决策

### 后端做成完整运行时，前端只负责界面

前端提供对话、任务可视化和设置三个界面，通过 WebSocket RPC 和后端通信，
自己不含任何 Agent 逻辑。这样同一套运行时可以换界面——终端 CLI（`python -m app`）
和 Web 界面共用同一份后端。

代价是长连接要自己管：重连、心跳、断线后的状态恢复都得写，比 HTTP 的请求-响应麻烦得多。

### 上下文做两层压缩，而不是简单截断

长任务会很快撑爆窗口。Peregrine 分两层处理：一层裁剪、一层摘要压缩，
而不是把超出部分直接丢掉。

代价是压缩必然有信息损耗——被摘要掉的部分不再能逐字回查。
我选择把「压掉了什么」留在可审计的轨迹里，而不是让它悄悄消失。

### 长期记忆做成三层投影，而不是一个文件

Core Memory / Memory / INDEX 三层各司其职：常驻的核心事实、可检索的长期记忆、
以及给检索用的索引投影。

代价是多了一层需要维护的一致性——写入时要保证三层同步，多一处可能不同步的地方。
换来的好处是检索不必每次都扫全量记忆。

## 结果

- 后端 257 个 Python 文件、前端 99 个 TypeScript 文件，81 个测试文件
- 后端 `pytest` + `ruff` + 编译检查、前端 `test` + `typecheck` + `build`，
  全部步骤在 ubuntu 上跑 CI
- 已支持多 Provider 接入，通过 `--provider` 在启动时指定

## 不足与下一步

1. **还在早期。** 运行时骨架已经立起来，但技能的审核流程、检查点与交付物的边界还在改。
2. **只有本地形态。** 数据落本地是刻意的，但这也意味着换机器要手动搬数据，没有多设备方案。
3. **文档偏使用者向。** 目前 README 讲的是怎么跑起来，架构决策的「为什么」还没系统写下来。
