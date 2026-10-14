/**
 * 产物自检：node scripts/verify.mjs
 * 前置：npm run build && npm run preview（另开一个终端）
 *
 * 页面清单直接从 /sitemap.xml 取 —— 以后新增文章或项目，不用回来改这个脚本，
 * 自检会自动覆盖新页面。之前是手写死列表，结果 /works/wedding-invite 从没被检查过。
 *
 * 检查六件事：
 *   1. sitemap 里每一页都能打开
 *   2. <use href="#o-..."> 是否都指向本页定义过的 <symbol>
 *   3. 页内锚点（目录、跳过导航）是否都有对应的 id
 *   4. 每页是否恰好一个 h1，且带搜索入口
 *   5. 站内链接是否都指向 sitemap 里真实存在的页面（防漏收 / 死链）
 *   6. 关键页面与 /search-index.json 的内容是否真的渲染出来了
 *
 * 注意：精灵在每一页都会内联渲染，所以「本页有 symbol」不等于「用到了」。
 * 判断某个图形是否被用到，必须跨页汇总 <use> 引用，不能拿 symbol 定义去反查
 * ——否则「所有图形都被用到」会永远成立。
 */
const base = process.env.BASE ?? 'http://127.0.0.1:4173';

/** 精灵里应当存在的全部图形 */
const ICONS = [
  'sun', 'arch', 'hills', 'branch', 'wave', 'rings', 'star', 'dots', 'sprout',
  'diamond', 'arrow', 'moon', 'sign', 'check', 'info', 'spark', 'search', 'up', 'arrow-r',
];

/** 不是页面、因此不该进 sitemap 的路由 */
const NON_PAGE_ROUTES = new Set(['/rss.xml', '/search-index.json', '/robots.txt']);

/** 统一成可比较的形式：去掉尾部斜杠、解码百分号转义（根路径保持 '/'） */
const normalizePath = (value) => {
  const clean = decodeURIComponent(value).split('#')[0].split('?')[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : '/';
};

const definedSymbols = new Set(); // 跨页汇总：精灵定义过的图形
const usedIcons = new Set(); // 跨页汇总：真的被 <use> 引用过的图形
const seen = new Set(); // 去重，避免同一个问题刷屏
let archiveYears = [];
let iconRefs = 0;

const problems = [];
const fail = (message) => {
  if (seen.has(message)) return;
  seen.add(message);
  problems.push(message);
  console.log(`✗ ${message}`);
};

/* ---------- 0. 页面清单来自 sitemap ---------- */

const sitemapResponse = await fetch(`${base}/sitemap.xml`);
if (!sitemapResponse.ok) fail(`/sitemap.xml 返回 ${sitemapResponse.status}`);

const sitemapXml = sitemapResponse.ok ? await sitemapResponse.text() : '';
const pages = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
  try {
    return normalizePath(new URL(match[1].trim()).pathname);
  } catch {
    return normalizePath(match[1].trim());
  }
});
if (pages.length === 0) fail('sitemap 里没有任何页面');
const sitemapSet = new Set(pages);

/* ---------- 1-5. 逐页检查 ---------- */

for (const path of [...pages, '/nope']) {
  const response = await fetch(base + path);
  const is404 = path === '/nope';
  if (!response.ok && !is404) fail(`${path} 返回 ${response.status}`);

  const html = await response.text();

  // 2. 图标：本页引用必须在本页精灵里定义过
  const pageSymbols = new Set(
    [...html.matchAll(/<symbol id="(o-[^"]+)"/g)].map((match) => match[1]),
  );
  for (const id of pageSymbols) definedSymbols.add(id);

  for (const match of html.matchAll(/<use[^>]*href="#(o-[^"]+)"/g)) {
    iconRefs++;
    usedIcons.add(match[1]);
    if (!pageSymbols.has(match[1])) fail(`${path} 引用了本页未定义的图标 #${match[1]}`);
  }

  // 3. 页内锚点：<a href="#x"> 必须有 id="x"
  // 只匹配 <a>，避开 <use href="#o-..."> 与 fill="url(#grad)" 这类同形写法
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/<a[^>]*href="#([^"]*)"/g)) {
    const target = match[1];
    if (!target) continue; // href="#" 的占位链接
    if (!ids.has(target)) fail(`${path} 的页内链接指向不存在的锚点 #${target}`);
  }

  // 4. 结构：一页一个 h1，且带搜索入口
  const h1Count = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1Count !== 1) fail(`${path} 有 ${h1Count} 个 h1，规范要求恰好 1 个`);
  if (!html.includes('nav-search')) fail(`${path} 缺少搜索入口`);

  // 5. 站内链接：目标页必须真的在 sitemap 里
  // 只匹配 <a>，否则会把 <link rel="stylesheet"> 和 <script src> 的资源路径也算进来
  for (const match of html.matchAll(/<a[^>]*href="(\/[^"]*)"/g)) {
    const target = normalizePath(match[1]);
    if (NON_PAGE_ROUTES.has(target) || sitemapSet.has(target)) continue;
    fail(`${path} 里的链接 ${match[1]} 不在 sitemap 里（页面漏收或链接写错）`);
  }

  // 6. 关键内容
  if (path === '/works/duji' && !html.includes('为什么做')) fail('duji 详情页缺少正文');
  if (path === '/posts/local-first' && !html.includes('<table>')) fail('local-first 的 Markdown 表格没渲染');
  if (path === '/' && !html.includes('精选项目')) fail('首页缺少精选项目区块');
  if (path === '/now' && !(html.includes('在做') && html.includes('在读'))) fail('近况页缺少三栏内容');
  if (path === '/nope' && !html.includes('这一页不存在')) fail('404 页内容不对');

  if (path === '/archive') {
    archiveYears = [
      ...html.matchAll(/class="eyebrow"><span class="dot[^"]*"><\/span>(\d{4})</g),
    ].map((match) => match[1]);
    if (archiveYears.length === 0) fail('归档页没有按年份分组');
  }
}

/* ---------- 6. 搜索索引端点 ---------- */

const REQUIRED_FIELDS = ['type', 'title', 'summary', 'url', 'tags', 'meta', 'text'];
const indexResponse = await fetch(`${base}/search-index.json`);
if (!indexResponse.ok) {
  fail(`/search-index.json 返回 ${indexResponse.status}`);
} else {
  const data = await indexResponse.json();
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    fail('搜索索引没有条目');
  } else {
    const urls = new Set();
    for (const item of items) {
      const label = item.title ?? '(无标题)';
      for (const field of REQUIRED_FIELDS) {
        if (item[field] === undefined || item[field] === null) {
          fail(`搜索索引「${label}」缺字段 ${field}`);
        }
      }
      if (!/^\/(works|posts)\/[\w-]+$/.test(item.url ?? '')) {
        fail(`搜索索引「${label}」的 url 不合法：${item.url}`);
      } else if (!sitemapSet.has(normalizePath(item.url))) {
        fail(`搜索索引「${label}」指向的 ${item.url} 不在 sitemap 里`);
      }
      if (urls.has(item.url)) fail(`搜索索引出现重复 url：${item.url}`);
      urls.add(item.url);
      if (/<[a-z][^>]*>/i.test(item.text ?? '')) {
        fail(`搜索索引「${label}」的 text 里还留着 HTML 标签`);
      }
      if (/&(?:[a-z]+|#\d+);/i.test(item.text ?? '')) {
        fail(`搜索索引「${label}」的 text 里还留着未解码的实体`);
      }
    }
    const byType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `搜索索引：${items.length} 条（项目 ${byType.work ?? 0} · 文章 ${byType.post ?? 0}）`,
    );
  }
}

/* ---------- 汇总 ---------- */

const missing = ICONS.filter((name) => !definedSymbols.has(`o-${name}`));
const unused = ICONS.filter((name) => !usedIcons.has(`o-${name}`));

console.log(
  `\n检查了 ${pages.length} 个页面 + 404、${iconRefs} 处图标引用；精灵定义 ${definedSymbols.size} 个图形，其中 ${usedIcons.size} 个被引用`,
);
if (archiveYears.length) console.log(`归档页年份分组：${archiveYears.join(' · ')}`);
if (missing.length) fail(`精灵里缺少这些图形 → ${missing.join(', ')}`);
console.log(unused.length ? `提示：定义了但没用上 → ${unused.join(', ')}` : '所有图形都被用到了');
console.log(problems.length ? `\n✗ ${problems.length} 个问题` : '\n✓ 全部通过');
process.exit(problems.length ? 1 : 0);
