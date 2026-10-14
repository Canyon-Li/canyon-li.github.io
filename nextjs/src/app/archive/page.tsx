import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Subscribe } from '@/components/Subscribe';
import { Breadcrumb, EmptyState, PostList } from '@/components/ui';
import { getAllTags, getPosts, getPostsByYear } from '@/lib/content';

export const metadata: Metadata = {
  title: '归档',
  description: '全部文章按年份归档，附每年的篇数与标签入口。',
  alternates: { canonical: '/archive' },
};

export default function ArchivePage() {
  const years = getPostsByYear();
  const posts = getPosts();
  const tags = getAllTags();

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { href: '/posts', label: '文章' }, { label: '归档' }]} />

        <span className="eyebrow mt-6" style={{ display: 'inline-flex' }}>
          <span className="dot" />
          归档 · {years.length} 年 · {posts.length} 篇
        </span>
        <h1 className="display mt-5">全部文章</h1>
        <p className="lede">
          按年份倒序。这里比列表页更适合回头翻——想找某一年写过什么，从这里最快。
        </p>

        <div className="flex gap-3 wrap-gap mt-6">
          <Link className="btn btn-sm" href="/posts">
            看带摘要的列表
          </Link>
          <Link className="btn btn-sm btn-ghost" href="/rss.xml">
            订阅 RSS
            <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
          </Link>
        </div>
      </div>

      {years.length ? (
        years.map(({ year, posts: list }) => (
          <section className="section section-tight" key={year}>
            <div className="wrap">
              <div className="sec-head">
                <div>
                  <span className="eyebrow">
                    <span className="dot dot-wood" />
                    {year}
                  </span>
                  <h2 className="h2 mt-2">
                    {list.length} 篇
                  </h2>
                </div>
              </div>
              <PostList posts={list} />
            </div>
          </section>
        ))
      ) : (
        <section className="section-plain">
          <div className="wrap">
            <EmptyState title="还没有文章" description="等第一篇文章发布，这里就会自动长出来。" />
          </div>
        </section>
      )}

      {tags.length ? (
        <section className="section">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">
                  <span className="dot" />
                  换个切法
                </span>
                <h2 className="h2 mt-2">按标签看</h2>
              </div>
            </div>
            <div className="tag-cloud reveal">
              {tags.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="tag"
                  style={{ padding: '7px 15px' }}
                >
                  {tag}
                  <span className="num" style={{ color: 'var(--muted)' }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="wrap">
          <Subscribe title="有新文章时，给你一封信" />
        </div>
      </section>
    </>
  );
}
