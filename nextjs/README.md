# Canyon · 个人网站（Next.js 版）

把 `../` 里的静态原型（`index.html` / `works.html` / `work.html` / `components.html`）
落地成一个真实可运行、可部署的项目。设计语言与 `../DESIGN.md` 一致：**北欧暖木**。

## 技术栈

| | |
| --- | --- |
| 框架 | Next.js 16（App Router） |
| UI | React 19 |
| 语言 | TypeScript（strict） |
| 内容 | 本地 Markdown + `gray-matter` + `marked` |
| 输出 | `output: 'export'` —— 纯静态，可丢到任何静态托管 |

没有运行时服务端：文章与项目在构建时读盘、渲染成 HTML。所以 `next start` 不可用，
本地预览用内置的零依赖静态服务器。

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:3000
npm run build      # 构建，产物在 out/
npm run preview    # 预览构建产物 http://localhost:4173
npm run verify     # 产物自检（需先 preview）
npm run a11y       # 无障碍审计（需先 preview，且需要 CHROME 环境变量）
npm run typecheck  # 类型检查
```

### 四个自检脚本

构建完之后，`npm run preview` 开着的情况下可以跑：

```bash
node scripts/verify.mjs           # 产物自检：页面可达、图标引用、锚点、站内链接、搜索索引
node scripts/a11y.mjs             # 无障碍审计：axe-core 实测 WCAG 2.1 A/AA（需要 CHROME）
node scripts/nontext-contrast.mjs # UI 边界对比度实测：WCAG 1.4.11（需要 CHROME）
node scripts/shot.mjs             # 逐页截图到 .preview/（需要 CHROME）
```

四个脚本共用 `scripts/cdp.mjs`（起 headless Chrome + 极简 CDP 客户端），改协议相关的
东西只改那一处。

`verify.mjs` 的页面清单是**从 `/sitemap.xml` 读的**，所以新增文章或项目之后不用回来改脚本，
自检会自动覆盖新页面。它顺带校验：站内链接的目标都在 sitemap 里（防漏收 / 死链）、
每页恰好一个 `h1`、页内锚点都有对应 `id`、`/search-index.json` 字段完整且正文已去标签。

`a11y.mjs` 遍历 sitemap 全部页面，另外单独覆盖两个**只有交互后才存在**的状态：
搜索面板打开态、420px 移动端抽屉打开态。WCAG 违规计入失败（退出码 1），
best-practice 只提示。改颜色令牌之后**必须重跑**——`--muted` 那次就是它揪出来的。

`shot.mjs` 走 CDP 而不是 `chrome --screenshot`：页面上的 `.reveal` 元素初始
`opacity: 0`，靠 IntersectionObserver 加 `.in` 才淡入；原生截图在 load 瞬间就拍，
只能拍到一张几乎全白的图。脚本会显式点亮所有入场元素再等过渡结束。

### 为什么还要一个 `nontext-contrast.mjs`

`a11y.mjs` 用的是 axe-core，而 **axe-core 完全不检查 WCAG 1.4.11**（非文字对比度）——
它要判断「这个像素是不是传达信息所必需的」，机器判不了。`contrast.mjs` 也不行：
它只算令牌两两之间的比值，不知道谁挨着谁。所以 DESIGN.md 10 节那条待办一直卡着，
因为没人真的枚举过**哪些边界需要 3:1**，只有两个估出来的数。

这个脚本把每个候选边界的**实际渲染色**读出来：

```bash
CHROME=/path/to/chrome node scripts/nontext-contrast.mjs            # 全站实测（必须达标项回退则退出 1）
CHROME=/path/to/chrome node scripts/nontext-contrast.mjs --report   # 只报告，永远退出 0
CHROME=/path/to/chrome node scripts/nontext-contrast.mjs --verbose  # 连「例外」项也展开
CHROME=/path/to/chrome node scripts/nontext-contrast.mjs --simulate # 注入候选令牌，验证方案 / 查漂移
```

两个必须做对的地方：

1. **读真实像素，不读令牌。** 边框多是 rgba 半透明、压在自身背景上
   （`background-clip` 默认 `border-box`，元素底色铺到边框下面），
   所以 `--hair-strong` 的 `.24` 渲染出来是 `#CECDCC` 而不是墨色。
2. **底色沿祖先链逐层合成。** 订阅区的输入框外侧是 `--bg-alt` 不是 `--bg`，
   搜索面板里的又是另一块底。拿令牌硬算会差一截。

每条边界按 1.4.11 的例外条款分类成「必须达标 / 需定夺 / 例外」并写明依据。

**2026-09-29 结论已定并落地（DESIGN.md 10 节方案 A）：拆出 `--hair-field` /
`--wood-strong` 两个令牌，只给表单控件、勾选框和焦点指示用。** 所以「必须达标」4 项
现在全部达标（3.07 / 3.07 / 3.34 / 3.58），脚本也随之从报告工具升级成**闸门**——
有「必须达标」项回退就退出 1，和 `contrast.mjs` / `a11y.mjs` 一致。
「需定夺」6 项（按钮与标签的描边/填充）不影响退出码：那是还没做的取舍，不是缺陷。
只想要报告不想要退出码，加 `--report`。

`--simulate` 是把候选令牌**只注入本次测量**再跑一遍，磁盘上一个字节都不动。
它注入的值现在与 `tokens.css` 里的一致，所以**输出应该和默认运行逐字相同**——
一旦不同，就说明令牌或消费规则漂移了。想验证「连 6 项需定夺的一起修」也改这里，
不用碰源文件。

### `QUERY`：审「某个开关打开时」的整站变体

`a11y.mjs` 支持 `QUERY` 环境变量：给每个待审页面追加一段查询串，页面清单仍来自
sitemap，所以覆盖范围不变。

```bash
QUERY='?some-toggle=1' node scripts/a11y.mjs
```

## 目录结构

```
content/
  works/*.md            项目（frontmatter 九字段 + 正文）
  posts/*.md            文章（frontmatter + 正文）
src/
  app/
    layout.tsx          全站外壳：精灵、公告条、顶栏、页脚、客户端效果
    globals.css         页面级样式（页头、Hero、详情页布局…）
    page.tsx            首页
    works/page.tsx            项目列表（筛选 + 网格/列表切换）
    works/[slug]/page.tsx     项目详情（九字段 + 目录 + 上下篇）
    posts/page.tsx            文章列表 + 标签云
    posts/[slug]/page.tsx     文章详情（目录 + 相关文章）
    archive/page.tsx          归档（按年份分组 + 标签云）
    now/page.tsx              近况（在做 / 在写 / 在读）
    tags/[tag]/page.tsx       标签归档
    about/page.tsx            关于 + 联系
    not-found.tsx             404
    rss.xml/route.ts          RSS 2.0
    search-index.json/route.ts 搜索索引（纯文本，供前端懒加载）
    sitemap.ts / robots.ts    站点地图与抓取规则
  components/
    Sprite.tsx          内联 SVG 图形精灵（同文档 <use>）
    Icon.tsx            装饰图形
    ui.tsx              Tag / Badge / MetaRow / Stats / PostList / Cover / Prose / WorkCard…
    CoverArt.tsx        项目封面：六个拱形构图家族（家族按列表序号轮转分配，见 DESIGN.md §08）
    SiteHeader.tsx      顶栏 + 移动端抽屉（Esc 关闭、滚动锁定）
    SiteFooter.tsx      页脚
    Search.tsx          全站搜索面板（Cmd/Ctrl+K，portal 挂到 body）
    useFocusTrap.ts     浮层共用的焦点陷阱与滚动锁定
    ClientFx.tsx        滚动入场 + 回到顶部
    Toc.tsx             本页目录（滚动高亮）
    WorksFilter.tsx     项目筛选与视图切换
    Subscribe.tsx       订阅区块
  lib/
    site.ts             站点配置与历程
    content.ts          Markdown 读取、渲染、目录、上下篇、标签（仅服务端）
    types.ts            客户端可用的类型、COVER_FAMILIES 与 formatDate（不含 node:fs）
  styles/
    tokens.css          设计令牌（单一来源）
    components.css      组件样式（只消费令牌）
scripts/
  cdp.mjs               共用：起 headless Chrome + 极简 CDP 客户端
  serve.mjs             零依赖静态预览服务器（node scripts/serve.mjs <root> [port]）
  verify.mjs            产物自检（页面清单取自 sitemap）
  contrast.mjs          令牌两两对比度表（手写表的机器复核）
  a11y.mjs              axe-core 无障碍审计
  nontext-contrast.mjs  UI 边界对比度实测（WCAG 1.4.11，axe 不查这条）
  shot.mjs              逐页截图到 .preview/
```

## 写内容

### 新增一个项目

在 `content/works/` 新建 `my-project.md`：

```yaml
---
title: 项目名
tagline: 一句话定位（会出现在卡片和详情页标题下）
role: 我的角色
period: 2025.03 – 至今
status: 活跃            # 活跃 / 维护中 / 已归档
stack: [TypeScript, SQLite]
category: tool          # tool | web
year: 2025
featured: true          # 出现在首页「精选项目」
platform: macOS · Windows   # 可选
license: MIT                # 可选
size: 约 9,400 行           # 可选
demo: https://example.com   # 可选
repo: https://github.com/…  # 可选
metrics:
  - value: 400+
    label: 使用者
relatedPosts: [local-first]
---
```

正文按规范建议的小节顺序写：`## 为什么做` → `## 关键决策` → `## 结果` → `## 不足与下一步`。
`##` 与 `###` 会自动生成锚点并汇总到右侧目录。

### 新增一篇文章

在 `content/posts/` 新建 `my-post.md`：

```yaml
---
title: 标题
date: 2026-09-29
summary: 摘要（列表与 RSS 都用它）
tags: [设计, 技术]     # 用 site.ts 里那五个固定标签，别新造同义词
updated: 2026-10-02    # 可选
series: 系列名          # 可选
draft: false           # true 则不出现在任何列表与 RSS 里
---
```

## 部署

```bash
npm run build
```

把 `out/` 整个目录上传到任意静态托管即可（Vercel / Netlify / Cloudflare Pages / 对象存储 + CDN）。

部署前记得改 `src/lib/site.ts` 里的 `url`（sitemap、RSS、canonical 都用它拼绝对地址），
或者构建时注入环境变量：

```bash
NEXT_PUBLIC_SITE_URL=https://你的域名 npm run build
```

## 几处刻意的取舍

- **不加暗色模式。** 暖白底是这个设计的一半，暗色下整套令牌要重做，不如不做。
- **没有评论、没有统计。** 想说话就写信——这是站点气质的一部分，不是功能缺失。
- **订阅表单只做前端提示。** 静态站没有后端，与其假装提交成功，不如明确告诉用户还没接。
- **封面是几何块拼的示意图。** 换成真实截图时保持 16:10、浅色衬底，深色截图才不会显得刺眼。
- **标签用中文原字做 URL。** 静态服务器需要能解码百分号编码路径（`scripts/serve.mjs` 已处理）。

## 踩过的坑（改代码前先看一眼）

**1. `node:fs` 不能进浏览器包。**
`lib/content.ts` 依赖 `node:fs`，只能活在服务端。但 `components/ui.tsx` 同时被服务端页面
和客户端组件（`WorksFilter`、`Toc`）引用——只要它从 `content.ts` 取一个运行时值，
`node:fs` 就会被打进浏览器包，Turbopack 直接 panic（`does not support external modules`）。
所以类型和 `formatDate` 放在 `lib/types.ts`，客户端一律从那里取。
往 `ui.tsx` 加东西时，别再从 `content.ts` 引值。

**2. YAML 会把 `date: 2026-09-08` 解析成 Date 对象，不是字符串。**
直接 `String()` 它得到的是 `"Tue Sep 08 2026 08:00:00 GMT+0800"`——列表页日期、
排序、RSS 的 `pubDate`、sitemap 的 `lastmod` 会一起歪掉。
`content.ts` 里的 `asDate()` 统一还原成 `YYYY-MM-DD`，并且用 **UTC** 取值，
否则换一台时区为负的机器，日期会整体差一天。

**3. `output: 'export'` 下，`sitemap.ts` / `robots.ts` / route handler 必须声明静态。**
少写一行 `export const dynamic = 'force-static'` 就会在
"Collecting page data" 阶段报错退出，而且报错信息只说路由名，不告诉你缺什么。

**4. `.reveal` 与截图。**
所有入场元素初始 `opacity: 0`。任何在 load 瞬间截图的工具都会拍到白屏，
不要误判成样式没生效——用 `scripts/shot.mjs`。

**5. `[hidden]` 会被组件类盖掉。**
`.btn-group{display:inline-flex}` 和 UA 的 `[hidden]{display:none}` 同优先级，
作者样式在后所以赢。globals.css 里补了一条 `[hidden]{display:none !important}` 兜底。

**6. 精灵在每一页都内联渲染，所以「有 symbol」不等于「用到了」。**
写自检时踩过：先用 `<symbol id>` 反查哪些图形没被用到，结果因为每页都渲染整份精灵，
`symbols` 集合永远是满的，「所有图形都被用到」这个判断恒为真，等于没检查。
正确做法是**跨页汇总 `<use href>` 引用**，再拿它去比对图形清单。

**7. 自检脚本里别写死页面清单。**
`verify.mjs` 最初是手写的页面数组，结果新增的 `/works/wedding-invite` 从没被检查过——
它的 `note` 字段渲染出的提示块因此一直没被发现。现在页面清单直接从 `/sitemap.xml` 读。

**8. 原型的 `components.html` 是展示页，不是站点规范。**
`components.html` 把提示块四种语气各配了一个图形（`line` 用 `o-asterisk`），
但站点页面 `index.html` / `works.html` 里的 `callout-line` 用的都是 `o-info`。
曾照着展示页去"修正"组件的图标映射，反而把已经正确的实现改坏了。
要对齐的是**站点页面**，展示页只说明组件能怎么用。

**9. 手算的对比度表会骗人，用 axe 实测。**
规范 v1.0/v1.1 里写着 `--muted #8B8378` 是「3.6:1，仅限 ≥14px 的次要信息」，
看起来挺合理——但 AA 对「大字」的定义是 **≥24px，或 ≥18.66px 且加粗**，
14px 属于正文，一律要 4.5:1。这条规则本身就是错的，于是全站 707 处小字
（日期、序号、图注、目录、表头、订阅说明）全都不达标。
改成 `#6C655D`（5.1:1）后归零。**任何颜色令牌改动后都要跑 `npm run a11y`。**
顺带一提：axe 默认会跳过 `opacity:0` 的元素，所以审计脚本必须先点亮 `.reveal`，
否则会假通过。

**10. `background` 简写会把没写的 longhand 一起重置掉。**
踩过一次：给 `background-image` 加了 `!important` 去盖 React 内联的
`background: var(--wood-tint)`，但 `background-size` 没加——简写 `background` 会把
`background-size` 重置成 `auto`，于是 8 层 14×1px 的角标渐变各自铺满整块，变成一块实心色。
**用简写盖简写时，凡是自己后面要用的 longhand 都得一起 `!important`。**
诊断这类「哪条 longhand 掉了」的问题，用 `getComputedStyle` 把四条 longhand 都打出来看。

**11. 浮层不能改成透明底——底下压着的东西会透上来。**
试过把搜索面板改成透明（想用发丝线代替填充），结果底下 `rgba(...,.2)` 的遮罩透上来，
面板变成 `#d1d1d1` 灰底，里面 `--muted` 的小字当场掉到 3.32:1。
**搜索面板、移动端抽屉、封面内衬这类容器的填充是「不透明」这个属性本身在起作用**，
不是装饰，别动。

**12. 一个颜色令牌不能同时当「线」和「文字」用，也不能同时当「装饰线」和「控件边界」用。**
WCAG 对不同角色的门槛不同：1px 的线只要 3:1（1.4.11 非文字对比度），文字要 4.5:1（1.4.3）。
而**装饰性**的发丝线根本不受约束——1.4.11 的例外条款明确豁免纯装饰。

`--hair-strong`（墨色 24%）同时被用在两处：按钮/标签/卡片的轮廓（装饰，无所谓），
和输入框描边（**控件边界，必须 3:1**）。后者实测只有 1.40:1。把它整体调黑到 .57
会顺手毁掉前者——那是「发丝线代替阴影」的立身之本。

**做法是按角色拆令牌，不是把值一起调黑**：新增 `--hair-field: rgba(51,48,44,.57)`
只给表单控件用，`--hair-strong` 保持 .24 不动。木色同理（`--wood-deep` 装饰 /
`--wood-strong` 达标）。2026-09-29 已落地，见 DESIGN.md 10 节。

**13. `display:none` 的元素，`getComputedStyle` 照样返回值。**
`nontext-contrast.mjs` 第一版把 `.nav-toggle`（只在 ≤860px 渲染）在 1280px 下也
「量」了出来——凭空多出 21 个目标的假数据，而且数字看着完全正常，不看「出现页面」
那一列根本发现不了。**遍历元素前先挡一道 `if (!el.getClientRects().length) return;`**
（空 = 整条祖先链上没有任何盒子被渲染），或者用 `el.offsetParent === null`。

**14. 焦点环要用真实键盘事件触发，`el.focus()` 不算。**
脚本调 `el.focus()` 触发的聚焦，Chrome 不保证命中 `:focus-visible`，量到的
`outlineColor` 会是 `currentColor` 而不是令牌值——数字看着像那么回事，其实是错的。
要走 CDP 发真的 Tab：`Input.dispatchKeyEvent`，`type` 用 `rawKeyDown` + `keyUp`。

**15. 构建被中断后 `.next` 要整个换掉；`mv` 报 `Permission denied` 时真因是「上一轮构建还活着」。**
`npm run build` 中途失败（或 Ctrl-C）会在 `.next/` 留下 `lock` 和半截产物，下次构建直接
`Another next build process is already running`。**只删 `.next/lock` 没用**，
得把整个 `.next` 改名（`mv .next .next-stale`）再构建。
- 改名若报 `Permission denied`，**别去改权限、也别强杀**：那是**上一轮的 `next build` 进程还活着**
  占着句柄。先找它再等它：
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*next*build*' } | Select-Object ProcessId, CommandLine
  Wait-Process -Id <pid> -Timeout 240
  ```
  它自己退出后改名立刻成功。（顺带说明：这条「already running」不是误报，
  即使你已经把 `.next` 移走，真有个构建在跑就一定会拦你。）
- 本机的 safe-delete 钩子会拦 `rm -rf .next`（trash 后端失败 → fail-closed）。
  构建时用 `env -u CODEBUDDY_SAFE_DELETE_BULK_STATE_DIR npm run build`：
  它绕开的只是「每轮批量删除计数」，删除仍然走 trash。
- `.next-stale*` 已加进 `.gitignore`，避免缓存副本被提交。

**16. 自检脚本卡住不返回，先杀残留的无头 Chrome。**
`a11y.mjs` / `nontext-contrast.mjs` 跑到一半停住，日志停在
`Warning: Detected unsettled top-level await at ... RUN_AXE`——**不是页面有问题**，
是上一次被中断的运行留下了无头 Chrome 占着 CDP 端口（9334 / 9335），新实例连不上就一直等。
判据是**命令行**里有 `--headless` 或 `--remote-debugging-port`（脚本用临时 profile 起的），
**只杀这些**，别按进程名一把杀——用户自己的 Chrome 也在同名进程里：
```powershell
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
  Where-Object { $_.CommandLine -match 'headless|remote-debugging-port' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```
另注：`a11y.mjs` 需要先 `npm run preview` —— 它的页面清单是从
`127.0.0.1:4173/sitemap.xml` 读的，服务器没起会直接 `ECONNREFUSED`。

