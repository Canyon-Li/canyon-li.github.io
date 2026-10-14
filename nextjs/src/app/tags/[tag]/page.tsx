import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb, EmptyState, PostList, SectionHead } from '@/components/ui';
import { getAllTags, getPostsByTag } from '@/lib/content';

/** 路由参数可能已被解码，也可能没有——两种都兜住，且不因异常字符抛错 */
function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeParam(tag);
  const count = getPostsByTag(name).length;

  return {
    title: `标签：${name}`,
    description: `标签「${name}」下的 ${count} 篇文章。`,
    alternates: { canonical: `/tags/${encodeURIComponent(name)}` },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const name = decodeParam(tag);
  const posts = getPostsByTag(name);

  if (!posts.length) notFound();

  const others = getAllTags().filter((item) => item.tag !== name);

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { href: '/posts', label: '文章' }, { label: name }]} />

        <span className="eyebrow mt-6" style={{ display: 'inline-flex' }}>
          <span className="dot" />
          标签 · {posts.length} 篇
        </span>
        <h1 className="display mt-5">{name}</h1>
        <p className="lede">
          标签「{name}」下面目前有 {posts.length} 篇文章，按时间倒序。
        </p>
      </div>

      <section className="section-plain">
        <div className="wrap">
          <PostList posts={posts} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="换个标签" title="其他标签" more="全部文章 →" moreHref="/posts" />

          {others.length ? (
            <div className="tag-cloud reveal">
              {others.map(({ tag: other, count }) => (
                <Link
                  key={other}
                  href={`/tags/${encodeURIComponent(other)}`}
                  className="tag"
                  style={{ padding: '7px 15px' }}
                >
                  {other}
                  <span className="num" style={{ color: 'var(--muted)' }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="还没有别的标签" description="等文章多一些，这里会自动长出来。" />
          )}
        </div>
      </section>
    </>
  );
}
