/**
 * 内容层的「客户端安全」部分：类型与纯函数。
 *
 * 为什么单独一个文件：`content.ts` 依赖 node:fs，只能活在服务端。
 * 而 `ui.tsx`（Tag/PostList/WorkCard…）同时被服务端页面和客户端组件
 * （WorksFilter、Toc）引用——一旦它从 content.ts 取值，node:fs 就会被打进
 * 浏览器包，构建直接失败。所以类型和 formatDate 放在这里，两边都能用。
 */

/* ---------- 类型 ---------- */

export type WorkStatus = '活跃' | '维护中' | '已归档';
export type WorkCategory = 'web' | 'tool';

/**
 * 生成式封面的构图家族。
 *
 * 放在这里（而不是组件里）是因为**内容层要按全量列表分配它** ——
 * 分配必须基于「全部项目」的稳定顺序，才能保证任意页面上同一个项目的封面一致、
 * 且同屏出现的项目构图不撞脸。组件只负责把家族画出来。
 */
export const COVER_FAMILIES = ['portal', 'arcade', 'colonnade', 'horizon', 'arch-disc', 'arch-strata'] as const;
export type CoverFamily = (typeof COVER_FAMILIES)[number];

export interface Metric {
  value: string;
  label: string;
}

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** 项目（规范 15 节的九个字段 + 可选补充） */
export interface Work {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  period: string;
  status: WorkStatus;
  stack: string[];
  category: WorkCategory;
  year: number;
  featured: boolean;
  platform?: string;
  license?: string;
  size?: string;
  demo?: string;
  repo?: string;
  note?: string;
  metrics: Metric[];
  relatedPosts: string[];
  /** 生成式封面的构图家族，由 content.ts 按全量顺序分配；缺省时组件回退到 slug 哈希 */
  cover?: CoverFamily;
  /**
   * 详情页 hero 的真实截图，指向 `public/` 下的文件（如 `/images/peregrine.png`）。
   *
   * - **不要叫 `cover`** —— 那个名字已经被生成式封面的构图家族占用了，两者含义完全不同。
   * - **可选**：缺省时 hero 回退到 `MockApp`（几何块拼的界面示意），所以不填也不会空。
   * - 资产按 **16:10** 准备：`.cover-inset > img` 是 `object-fit: cover`，比例不符会裁掉两边。
   * - 浅色衬底由 `.cover-inset` 提供，深色截图放进去不会刺眼（规范 16 节）。
   */
  coverImage?: string;
  html: string;
  toc: TocItem[];
}

/** 文章（规范 14 节的 frontmatter） */
export interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  updated?: string;
  cover?: string;
  series?: string;
  draft: boolean;
  readingMinutes: number;
  html: string;
  toc: TocItem[];
}

/* ---------- 纯函数 ---------- */

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${year} / ${month} / ${day}`;
}
