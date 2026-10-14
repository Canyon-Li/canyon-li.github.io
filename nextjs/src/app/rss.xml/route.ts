import { getPosts } from '@/lib/content';
import { site } from '@/lib/site';

/** 静态导出下路由处理器必须是静态的 */
export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (value: number) => String(value).padStart(2, '0');

/**
 * 日期按北京时间当天零点处理，并直接用 +0800 偏移输出。
 * 不用 toUTCString()：那样 2026-09-21 会写成 "20 Sep 2026 16:00 GMT"，
 * 读者看到的日期比作者写的早一天。
 */
function toRfc822(date: string): string {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return new Date().toUTCString();

  const shifted = new Date(parsed.getTime() + 8 * 60 * 60 * 1000);
  return (
    `${DAYS[shifted.getUTCDay()]}, ${pad(shifted.getUTCDate())} ${MONTHS[shifted.getUTCMonth()]} ` +
    `${shifted.getUTCFullYear()} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(
      shifted.getUTCSeconds(),
    )} +0800`
  );
}

export function GET() {
  const posts = getPosts().slice(0, 30);
  const buildDate = toRfc822(posts[0]?.date ?? new Date().toISOString().slice(0, 10));

  const items = posts
    .map((post) => {
      const link = absolute(`/posts/${post.slug}`);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${toRfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(site.url)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(absolute('/rss.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
