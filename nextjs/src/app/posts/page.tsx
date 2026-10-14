import type { Metadata } from 'next';
import Link from 'next/link';
import { Subscribe } from '@/components/Subscribe';
import { Breadcrumb, PostList, SectionHead } from '@/components/ui';
import { getAllTags, getPosts } from '@/lib/content';

export const metadata: Metadata = {
  title: '文章',
  description: '写下来的想法：设计、折腾、技术与阅读笔记。按时间倒序，全部原创。',
  alternates: { canonical: '/posts' },
};

export default function PostsPage() {
  const posts = getPosts();
  const tags = getAllTags();

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { label: '文章' }]} />

        <span className="eyebrow mt-6" style={{ display: 'inline-flex' }}>
          <span className="dot" />
          文章 · {posts.length} 篇
        </span>
        <h1 className="display mt-5">写下来的想法</h1>
        <p className="lede">
          可能关于技术，也可能关于生活。
          <br />
          一些文字分享。
        </p>

        <div className="flex gap-3 wrap-gap mt-6">
          <Link className="btn btn-sm" href="/archive">
            按年份归档
          </Link>
          <Link className="btn btn-sm btn-ghost" href="/rss.xml">
            订阅 RSS
          </Link>
        </div>
      </div>

      <section className="section-plain">
        <div className="wrap">
          <SectionHead eyebrow="标签" title="按标签看" />

          {tags.length ? (
            <div className="tag-cloud reveal">
              {tags.map(({ tag, count }) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag" style={{ padding: '7px 15px' }}>
                  {tag}
                  <span className="num" style={{ color: 'var(--muted)' }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="list-empty">还没有标签。</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="全部" title="全部文章" />
          <PostList posts={posts} empty="还没有发布文章。" />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Subscribe title="有新文章时，给你一封信" />
        </div>
      </section>
    </>
  );
}
