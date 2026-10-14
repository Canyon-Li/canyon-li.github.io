import type { MetadataRoute } from 'next';
import { getAllTags, getPosts, getWorks } from '@/lib/content';
import { site } from '@/lib/site';

/** 静态导出下元数据路由必须显式声明为静态 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (path: string) => new URL(path, site.url).toString();

  const pages: MetadataRoute.Sitemap = [
    { url: absolute('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absolute('/works'), changeFrequency: 'monthly', priority: 0.9 },
    { url: absolute('/posts'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absolute('/archive'), changeFrequency: 'weekly', priority: 0.6 },
    { url: absolute('/now'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absolute('/about'), changeFrequency: 'yearly', priority: 0.5 },
  ];

  const works: MetadataRoute.Sitemap = getWorks().map((work) => ({
    url: absolute(`/works/${work.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const posts: MetadataRoute.Sitemap = getPosts().map((post) => ({
    url: absolute(`/posts/${post.slug}`),
    lastModified: post.updated ?? post.date,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const tags: MetadataRoute.Sitemap = getAllTags().map(({ tag }) => ({
    url: absolute(`/tags/${encodeURIComponent(tag)}`),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  return [...pages, ...works, ...posts, ...tags];
}
