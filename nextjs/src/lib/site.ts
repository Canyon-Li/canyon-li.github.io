/** 站点级配置：改这里就能改全站文案、导航与元信息 */
export const site = {
  name: 'Canyon',
  title: 'Canyon · AI Agent 开发者',
  tagline: '给 Agent 做工程，也量它的安全边界',
  description:
    '做 AI Agent / RAG / MCP 的工程实现与安全边界。这里放我做过的项目和写过的文章，每个项目都写了为什么做、怎么取舍、结果如何。',
  /**
   * 部署后改成自己的域名，用于 sitemap / RSS 的绝对地址。
   * 目前指向 GitHub Pages 的默认域，可用 NEXT_PUBLIC_SITE_URL 覆盖。
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://canyon-li.github.io',
  author: 'Canyon',
  /** 页脚与「关于」页共用的主页地址 */
  github: 'https://github.com/Canyon-Li',
  email: 'canyonslie@gmail.com',
  job: 'AI Agent 开发者',
  /** TODO 待填：留空时「关于」页与首页都不渲染「现居」那一行 */
  location: '' as string,
  now: '在做 Peregrine · 在读 letta / llama_index / ragflow 的源码 · 不固定更新',
  /** /now 页的「最后更新」日期，改内容时一起改这里 */
  nowUpdated: '2026-10-11',
  nav: [
    { href: '/works', label: '项目' },
    { href: '/posts', label: '文章' },
    { href: '/about', label: '关于' },
    { href: '/about#contact', label: '联系' },
  ],
  /**
   * 固定标签集（规范 14 节：不新造同义词）。
   * 前半段是现在的主线；后半段（技术 / 随笔 / 设计 / 折腾）是站点原型时期留下的，
   * 暂时还有样例文章在用 —— 等真实文章写完可以收掉。
   * 注意：这里只喂 `<meta name="keywords">`；**标签页是从文章 frontmatter 派生的**
   * （`getAllTags()`），所以实际发布的标签一定不能落在这个集合之外。
   */
  tags: ['Agent', 'RAG', '安全', '工程', '技术', '随笔', '设计', '折腾'],
} as const;

/** 个人历程：首页与关于页共用一份，避免两处写歪 */
export const timeline = [
  {
    when: '2026 · 现在',
    what: '在做 Peregrine',
    desc: '本地优先的对话式 Agent 工作台，后端是一套完整的 Agent 运行时。',
  },
  {
    when: '2026.09',
    what: 'JeRAG 与 Mini-Play',
    desc: '一个按问题难度分配算力的本地文献 RAG，一个把技术概念演成小剧场的 skill。',
  },
  {
    when: '2026.08',
    what: '三类边界问题回流上游',
    desc: '审计出 CyberClaw 的 eval 注入、正则绕过与技能命令代理，两个 PR 合并进上游。',
  },
  {
    when: '2026.07',
    what: '转到 AI Agent 工程',
    desc: 'RAG-MCP 与 AuditronClaw 在同一个月起步：一个把检索封装成工具，一个给它量安全边界。',
  },
] as const;
