import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/** 静态导出下元数据路由必须显式声明为静态 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: new URL('/sitemap.xml', site.url).toString(),
    host: site.url,
  };
}
