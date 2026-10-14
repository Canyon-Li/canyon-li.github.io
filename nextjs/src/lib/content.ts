import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { COVER_FAMILIES, type Metric, type Post, type TocItem, type Work, type WorkCategory, type WorkStatus } from './types';

/**
 * 内容层（仅服务端）。类型与 formatDate 在 ./types，客户端组件请从那里取，
 * 否则 node:fs 会被打进浏览器包。
 */
export type { Metric, Post, TocItem, Work, WorkCategory, WorkStatus } from './types';
export { formatDate } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const marked = new Marked({ gfm: true });

/* ---------- Markdown 渲染 ---------- */

/** 生成锚点：保留中英文与数字，其余转连字符 */
function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** 给 h2/h3/h4 补 id，并同时产出目录（id 与目录必然一致） */
function addHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();

  const html2 = html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (_match, depthRaw: string, inner: string) => {
    const depth = Number(depthRaw);
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let id = slugify(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    if (depth === 2 || depth === 3) toc.push({ id, text, depth: depth as 2 | 3 });
    return `<h${depth} id="${id}">${inner}</h${depth}>`;
  });

  return { html: html2, toc };
}

/**
 * 代码块在窄屏下会横向滚动。可滚动区域必须能用键盘到达（WCAG 2.1.1），
 * 否则键盘用户看不到被裁掉的那半截代码。给每个 <pre> 补 tabindex。
 * 不做「只给真的溢出加」的优化：同一个代码块在桌面不溢出、在手机上溢出，
 * 而这是构建期产物，判断不了运行时宽度。
 */
function makeCodeBlocksFocusable(html: string): string {
  return html.replace(/<pre>/g, '<pre tabindex="0">');
}

function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
  const raw = marked.parse(md, { async: false }) as string;
  return addHeadingIds(makeCodeBlocksFocusable(raw));
}

/** 中文按 350 字/分钟、英文按 220 词/分钟估算 */
function readingMinutes(md: string): number {
  const cjk = (md.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (md.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 350 + words / 220));
}

/* ---------- 读取内容 ---------- */

function listFiles(dir: string): string[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'));
}

function readEntry(dir: string, file: string) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, dir, file), 'utf8');
  return matter(raw);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim());
  return [];
}

function asMetrics(value: unknown): Metric[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    return { value: String(record.value ?? ''), label: String(record.label ?? '') };
  });
}

/**
 * YAML 会把 `date: 2026-09-08` 解析成 Date 对象（不是字符串）。
 * 如果直接 String() 它，拿到的是 "Tue Sep 08 2026 08:00:00 GMT+0800"——
 * 日期格式、排序、RSS 全都会歪。所以这里统一还原成 YYYY-MM-DD。
 * 用 UTC 取值：YAML 的纯日期按 UTC 零点解析，只有 UTC 取值才不受机器时区影响。
 */
function asDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const text = value ? String(value) : '';
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : text;
}

/* ---------- 项目 ---------- */

/**
 * 取 `period`（如 `2026.10 – 至今`）开头的 `YYYY.MM` 作为排序键。
 * 取不到就退回年份，保证不会因为格式没写对而让顺序乱掉。
 */
function periodKey(work: Work): string {
  return work.period.match(/\d{4}\.\d{2}/)?.[0] ?? String(work.year);
}

let worksCache: Work[] | null = null;

export function getWorks(): Work[] {
  if (worksCache) return worksCache;

  worksCache = listFiles('works')
    .map((file) => {
      const { data, content } = readEntry('works', file);
      const { html, toc } = renderMarkdown(content);
      return {
        slug: String(data.slug ?? file.replace(/\.md$/, '')),
        title: String(data.title ?? ''),
        tagline: String(data.tagline ?? ''),
        role: String(data.role ?? ''),
        period: String(data.period ?? ''),
        status: (data.status ?? '活跃') as WorkStatus,
        stack: asStringArray(data.stack),
        category: (data.category ?? 'web') as WorkCategory,
        year: Number(data.year ?? 0),
        featured: Boolean(data.featured ?? false),
        platform: data.platform ? String(data.platform) : undefined,
        license: data.license ? String(data.license) : undefined,
        size: data.size ? String(data.size) : undefined,
        demo: data.demo ? String(data.demo) : undefined,
        repo: data.repo ? String(data.repo) : undefined,
        note: data.note ? String(data.note) : undefined,
        coverImage: data.coverImage ? String(data.coverImage) : undefined,
        metrics: asMetrics(data.metrics),
        relatedPosts: asStringArray(data.relatedPosts),
        html,
        toc,
      } satisfies Work;
    })
    // 排序：年份新的在前；同年按 `period` 的起止年月倒序（新项目在前）；
    // 都相同才回落到标题。`period` 是自由文本（`2026.10 – 至今`），
    // 所以只取开头的 `YYYY.MM` 来比，避免「– 至今」这类后缀把顺序带偏。
    .sort(
      (a, b) =>
        b.year - a.year ||
        periodKey(b).localeCompare(periodKey(a)) ||
        a.title.localeCompare(b.title, 'zh'),
    )
    // 封面构图按**全量列表的稳定顺序**分配，不用 slug 哈希：
    // 哈希在 6 个家族里撞车是大概率事件（6 个项目全不撞只有约 1.5%，4 个也只有约 28%），
    // 而并排两张同构图的封面正是要修的问题。按序号轮转可以保证同屏不重复，
    // 且因为基于缓存的全量列表，同一个项目在任何页面上拿到的都是同一个家族。
    .map((work, index) => ({ ...work, cover: COVER_FAMILIES[index % COVER_FAMILIES.length] }));

  return worksCache;
}

export function getWork(slug: string): Work | undefined {
  return getWorks().find((work) => work.slug === slug);
}

export function getFeaturedWorks(limit = 3): Work[] {
  const featured = getWorks().filter((work) => work.featured);
  return (featured.length ? featured : getWorks()).slice(0, limit);
}

export function getWorkNeighbors(slug: string): { prev?: Work; next?: Work } {
  const list = getWorks();
  const index = list.findIndex((work) => work.slug === slug);
  if (index < 0) return {};
  return { prev: list[index - 1], next: list[index + 1] };
}

/* ---------- 文章 ---------- */

let postsCache: Post[] | null = null;

export function getPosts(options: { includeDrafts?: boolean } = {}): Post[] {
  if (!postsCache) {
    postsCache = listFiles('posts')
      .map((file) => {
        const { data, content } = readEntry('posts', file);
        const { html, toc } = renderMarkdown(content);
        return {
          slug: String(data.slug ?? file.replace(/\.md$/, '')),
          title: String(data.title ?? ''),
          date: asDate(data.date),
          summary: String(data.summary ?? ''),
          tags: asStringArray(data.tags),
          updated: data.updated ? asDate(data.updated) : undefined,
          cover: data.cover ? String(data.cover) : undefined,
          series: data.series ? String(data.series) : undefined,
          draft: Boolean(data.draft ?? false),
          readingMinutes: readingMinutes(content),
          html,
          toc,
        } satisfies Post;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  return options.includeDrafts ? postsCache : postsCache.filter((post) => !post.draft);
}

export function getPost(slug: string, options: { includeDrafts?: boolean } = {}): Post | undefined {
  return getPosts(options).find((post) => post.slug === slug);
}

export function getPostNeighbors(slug: string): { prev?: Post; next?: Post } {
  const list = getPosts();
  const index = list.findIndex((post) => post.slug === slug);
  if (index < 0) return {};
  return { prev: list[index - 1], next: list[index + 1] };
}

export function getPostsByTag(tag: string): Post[] {
  return getPosts().filter((post) => post.tags.includes(tag));
}

/** 归档页用：按年份分组，新的在前 */
export function getPostsByYear(): { year: string; posts: Post[] }[] {
  const groups = new Map<string, Post[]>();
  for (const post of getPosts()) {
    const year = post.date.slice(0, 4) || '未知';
    const list = groups.get(year);
    if (list) list.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

export function getPostsBySlugs(slugs: string[]): Post[] {
  const list = getPosts();
  return slugs.map((slug) => list.find((post) => post.slug === slug)).filter((post): post is Post => Boolean(post));
}

export function getAllTags(): { tag: string; count: number }[] {
  const counter = new Map<string, number>();
  for (const post of getPosts()) {
    for (const tag of post.tags) counter.set(tag, (counter.get(tag) ?? 0) + 1);
  }
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
