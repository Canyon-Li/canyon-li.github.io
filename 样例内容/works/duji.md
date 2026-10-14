---
title: 读记
tagline: 把读过的书，变成可检索的笔记
role: 产品设计与开发
period: 2025.03 – 至今
status: 活跃
stack: [TypeScript, Tauri, SQLite FTS5, Svelte]
category: tool
year: 2025
featured: true
platform: macOS · Windows
license: MIT
size: 约 9,400 行
demo: https://example.com/duji
repo: https://github.com/example/duji
metrics:
  - value: 400+
    label: 使用者
  - value: 12,000+
    label: 条摘抄入库
  - value: 4.8/5
    label: 评价（少量样本）
relatedPosts: [local-first, fts5-chinese-search]
---

## 为什么做

我读书时习惯在页边划线，但读完从来不会回看。三年下来，家里二十多本书的空白处都写满了，
真正被用到的句子却不超过十句——因为要找的时候根本找不到。

我试过几个主流笔记应用，问题都一样：**录入太重**。要先建一本书、再建一条笔记、再挑标签、
再选归属，一套流程走完，刚才想记的那句话已经忘了。有些工具还要求先登录、再等同步，
写完一句话要等两秒才落盘。

所以我想做的其实不是"更好的笔记应用"，而是一个只做一件事的工具：
**打开就能写，写完就能搜**。其他都可以不要。

## 关键决策

### 不做云同步，先做本地优先

这是最容易被质疑的一条。放弃同步意味着换电脑就得手动搬数据，也意味着不可能有移动端。
但我的判断是：这是一个每天用十分钟的个人工具，**延迟比便利更重要**。
数据直接落进本地 SQLite，输入框的响应是即时的，没有网络等待，也不会有冲突合并这种麻烦事。

代价我认了，并在文档里明确写出来。

### 选 Tauri，不选 Electron

同样的界面，Tauri 打出来的安装包是 `8MB`，Electron 是 `90MB` 起步。
对一个"随手打开"的工具来说，安装体积直接影响我会不会真的去用它。
代价是有些能力要在 Rust 侧写胶水代码，我为此多花了大概两周。

### 搜索交给 SQLite FTS5，不自己造索引

全文搜索是"写完就能搜"的核心。自己维护倒排索引要多写几百行，还要处理增量更新；
用 FTS5 只需要一张虚表。中文分词我选了 trigram 方案，效果一般但足够用。

## 技术细节

搜索的实现比看上去简单，核心就是一张虚表加一段查询：

```sql
-- 用 trigram 分词器处理中文
CREATE VIRTUAL TABLE notes_fts USING fts5(
  content,
  book_title,
  tokenize = 'trigram'
);

-- 带高亮的检索，按相关度排序
SELECT book_title, snippet(notes_fts, 0, '<mark>', '</mark>', '…', 12)
FROM notes_fts
WHERE notes_fts MATCH ?
ORDER BY rank
LIMIT 50;
```

索引体积大约是正文的 2.6 倍——这是我为了中文可搜索付出的代价，目前 12,000 条摘抄的索引
还不到 4MB，可以接受。

## 结果

没有推广，也没有上架商店。发布只是把仓库链接贴到了两个论坛，之后一直是自然增长。
比数字更有意义的是：**我自己每天都在用**，这是唯一一个我坚持用下来的个人项目。

## 不足与下一步

1. **多设备同步还没做。** 这是被问得最多的一条，也是我一直在犹豫的——一旦引入同步，本地优先的简单性就没了。
2. **中文分词效果一般。** trigram 会把"读书笔记"切成三个字，搜"笔记"能命中，搜"读记"就容易过召回。后面想试试 jieba 的 Rust 绑定。
3. **导出只支持 Markdown。** 有用户要 PDF，但我暂时不想为了导出引入一个排版引擎。

> 如果你也在做本地优先的工具，欢迎写封信给我——我很好奇别人怎么处理同步这件事。
