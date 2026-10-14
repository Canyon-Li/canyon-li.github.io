---
title: RAG-MCP
tagline: 把私有知识检索封装成 Agent 能直接调用的工具
role: 设计与开发
period: 2026.07 – 至今
status: 活跃
stack: [Python, MCP, ChromaDB, BM25, Streamlit, pytest]
category: web
year: 2026
featured: false
platform: Windows · macOS · Linux
license: MIT
size: 311 个文件 · 264 个 Python · 113 个测试文件
repo: https://github.com/Canyon-Li/RAG-MCP
metrics:
  - value: 6 个
    label: 可插拔环节
  - value: 113
    label: 个测试文件
  - value: 7 页
    label: 管理台
---

## 为什么做

给 Agent 加私有知识检索，常见做法是给它封装一个检索函数。这么做通常会撞上三个问题：

1. **检索后端与 Agent 耦合。** 换一个 embedding 模型或向量库，Agent 侧代码也得跟着改。
2. **PDF 处理困难。** 同一份文件可能同时包含原生文本、表格、矢量图、扫描件，
   单一 parser 难免丢内容。
3. **文档删除不彻底。** 向量、倒排索引、图片、摄取记录分散在四个存储里，
   删一份文档要协调四套接口，漏掉任何一处都会残留脏数据。

这个项目要做的是把这三个问题都变成**可以通过配置切换的架构决策**，
而不是硬编码在代码里的功能。

> 需要说清楚的是：这是一个学习导向的实战项目，不是经过生产验证的系统。
> 重点在架构思路与设计判断，不在功能罗列。

## 关键决策

### 用 Factory + Registry 做可插拔，不上 IoC 容器

每个可替换环节（LLM、Embedding、Parser、Reranker、VectorStore、Splitter）
都抽象成 `Base* 抽象类 + Factory + 类级注册表`，链路只面向抽象类编程，
用哪个实现由配置文件的 `provider` 字段在运行时决定。
新增一个 Provider 只改三处：写类、注册一行、改 yaml，两条 pipeline 一行不动。

为什么不用 Spring 风格的 IoC 容器？在 Python 项目里那是过度设计。
代价也很实在：抽象层多了一次间接调用，调试时得先穿过 Factory 才能看到具体实现。
补偿措施是注册时打日志，并在 trace 里记 `method` 字段标明实际用了哪个 Provider。

### PDF 按场景分 parser，能力边界显式声明

没有任何单一工具能覆盖所有 PDF。所以这里让多个 parser 并存，各自负责擅长的场景，
局限写在文档的表格里而不是留给使用者去踩：

| Parser | 擅长 | 局限 |
| --- | --- | --- |
| `pdf_table` | 线条 / 对齐型表格 | 检测到无文本层会降级并标记 `degraded=true` |
| `pdf_text` | 纯文本 PDF | 不抽表格、不抽图 |
| `docling` | 矢量绘制的图（架构图 / 流程图） | 计算开销大 |
| `docling_vlm` | 复杂版式 / 扫描件 | 依赖 Vision LLM |

踩过的一个具体的坑：架构图是矢量绘制的，`get_images()` 返回空，抓不到。
解法是让 `docling` 走 bbox 区域渲染，其他 parser 走 `get_images()`——图片抽取按 parser 分路径。

代价是使用者得知道自己手上的 PDF 属于哪一类，选错 parser 就会丢内容。
我选择把选择权交出去并写清边界，而不是假装一个 parser 能通吃。

### 文档删除选 Fail-safe，不做伪事务

数据分散在四个存储里，删除入口只有一个 `DocumentManager`，一次调用级联清理。
为什么不实现事务？因为 Chroma、BM25、SQLite 三者不共享事务边界，
强行套伪事务反而更脆弱。所以选 Fail-safe：任何一步失败都写进 `DeleteResult.errors`
并继续清理剩余存储。

代价是可能留下「部分删除」的状态。我的判断是残留数据的危害大于部分删除——
宁可留错误日志供人工补删，也不能因为 BM25 删失败就让 Chroma 里的脏数据长期留存。

### BM25 分词收口到一个函数，索引和查询必须对齐

这是踩得最狠的一条。BM25 是稀疏检索，**索引侧切出的 term 必须和查询侧一致，否则查不中**。
项目最初只支持中文、用 jieba，英文只是附带处理。切到英文文献场景后立刻暴露两个问题：

- 同源词不收敛：`optimization` / `optimize` / `optimizing` 是三个不同 token
- 索引侧和查询侧各写了一份 `_tokenize`，从初期就已经漂移——
  索引侧保留词频，查询侧去重；索引侧最短词长 2，查询侧 1。
  结果是查询 token 经常落在索引从未存过的集合里，产生**零召回噪声**

修法是把分词收口到一个 `tokenize()`，两侧都调它，只是参数不同。
并加了一条跨层测试专门守护这个不变量：**查询侧 keyword 必须是索引侧 term 的子集**——
这不是惯例，是 BM25 召回的充要条件。

为什么不直接用 NLTK / spaCy？项目面向「绝对本地」，每多一个依赖就多一个联网下载入口
（NLTK 要下语料、spaCy 要下模型）。Porter 是 1980 年的算法，纯 Python 实现两三百行，
够用且可控。

## 结果

- 四层架构、两条链路（摄取 / 查询）共用同一套存储层与 Trace
- 6 个可插拔环节，全部由配置文件的 `provider` 字段切换，代码零改动
- 对外提供 `query_knowledge_hub`、`list_collections`、`get_document_summary`
  与一组文档生命周期接口，Copilot / Cursor / Claude Desktop 可直接接入
- 内置 7 页 Streamlit 管理台：trace 查看、集合管理、检索三路对比
  （Dense / Sparse / RRF，交集高亮）、评估回归
- 检索质量用 golden test set 做回归，指标为 `context_precision` 与 `context_recall`；
  judge 与被测链路完全解耦，避免「既当运动员又当裁判」
- 264 个 Python 文件、113 个测试文件，测试分 unit / integration / e2e 三层，
  e2e 以子进程拉起真实的 MCP Server

## 不足与下一步

1. **扫描件表格不支持。** 需要 OCR，目前 `pdf_table` 检测到无文本层会自动降级到纯文本，
   并标记 `degraded=true`——下游能看到这个标记，不会把它当高质量数据用。
2. **两个环节只有框架、没测完。** Custom Evaluator 与 Cross-Encoder Reranker
   都搭好了架子，前者可独立补完，后者需要下载本地模型。
3. **没有生产级高可用。** 架构上留了空间（查询无状态 + 后端可插拔），但没有实现。
