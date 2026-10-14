import { getPosts, getWorks } from '@/lib/content';

/** 静态导出下路由处理器必须是静态的 */
export const dynamic = 'force-static';

export interface SearchItem {
  type: 'work' | 'post';
  title: string;
  summary: string;
  url: string;
  tags: string[];
  meta: string;
  /** 正文纯文本，供「只在正文里命中」的结果生成摘要片段 */
  text: string;
}

/** 去掉标签与多余空白，得到可搜索的纯文本 */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function GET() {
  const works: SearchItem[] = getWorks().map((work) => ({
    type: 'work',
    title: work.title,
    summary: work.tagline,
    url: `/works/${work.slug}`,
    tags: work.stack,
    meta: `${work.period} · ${work.role}`,
    text: plainText(work.html),
  }));

  const posts: SearchItem[] = getPosts().map((post) => ({
    type: 'post',
    title: post.title,
    summary: post.summary,
    url: `/posts/${post.slug}`,
    tags: post.tags,
    meta: post.date,
    text: plainText(post.html),
  }));

  return new Response(JSON.stringify({ items: [...works, ...posts] }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // 静态产物里内容不变，但换内容后会重新构建，所以只做短缓存
      'cache-control': 'public, max-age=300',
    },
  });
}
