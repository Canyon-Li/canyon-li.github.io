---
title: migrate-blog
tagline: 把 WordPress 导出的 XML 变成干净的 Markdown
role: 工具脚本
period: 2025.09 – 2025.10
status: 活跃
stack: [Node, Cheerio]
category: tool
year: 2025
featured: true
license: MIT
size: 约 400 行
repo: https://github.com/example/migrate-blog
metrics:
  - value: 187
    label: 篇成功迁移
  - value: 3
    label: 个必须手工修的坑
  - value: 11
    label: 分钟跑完全量
relatedPosts: [wordpress-to-static]
---

## 为什么做

旧博客在 WordPress 上放了六年，187 篇文章。我想搬到静态站，但试过的几个导出插件
都有同一个毛病：把 HTML 原样塞进 Markdown，图片还是绝对地址，日期全是 UTC。
结果就是我还要手工修 187 次。

于是写了个一次性脚本，但按"可重复运行"来设计——因为我知道自己一定会跑第二遍。

## 关键决策

### 不追求 100% 自动，只把手工量压到 3 处

完全自动化的代价是要处理所有边角情况，而边角情况只有个位数篇。我的做法是：
脚本跑完输出一份"需要人工确认"的清单，然后我在编辑器里逐个处理。
187 篇里只有 3 篇需要动手。

### 日期统一按原文时区解析，再转成本地

第一版直接 `new Date(str)`，结果所有文章都往前挪了一天。原因是导出的时间戳带 `+0000`，
而我在东八区。修正后先按原文时区解析再转本地，问题消失。

### 图片下载到本地，不保留外链

旧站随时可能关停。脚本会把图片下载到 `public/uploads/`，并把正文里的地址改成相对路径。
代价是仓库变大（约 40MB），但换来了不再依赖别人。

## 技术细节

正文清洗的核心是三步：先剥掉 WordPress 塞进来的空段落和 `<!--more-->`，
再把 `<pre>` 里的内容原样保留（不能转义），最后处理图片地址。

```js
const clean = (html) =>
  html
    .replace(/<!--more-->/g, '')
    .replace(/<p>\s*(&nbsp;|\s)*<\/p>/g, '')
    .replace(/<pre([\s\S]*?)<\/pre>/g, (m) => m.replace(/<br\s*\/?>/g, '\n'))
    .trim();
```

## 结果

- 187 篇全部迁移完成，其中 3 篇手工修正
- 全量运行 11 分钟，其中 9 分钟在下载图片
- 后来朋友搬家时又用了两次，所以我把它整理成了带参数的命令行工具

## 不足与下一步

1. **只支持 WordPress。** 其他平台的导出格式没做，也不打算做——需求太分散。
2. **没有断点续传。** 中途断了要重跑，图片会重复下载。
3. **评论全丢了。** 这是个取舍：静态站没有评论后端，我把有价值的几条手工抄进了文章末尾。
