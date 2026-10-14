import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Toc } from '@/components/Toc';
import { Breadcrumb, Callout, PostList, PostNav, Prose, SectionHead, Tag } from '@/components/ui';
import { formatDate, getPost, getPostNeighbors, getPosts, getPostsByTag } from '@/lib/content';

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: '文章未找到' };

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: `/posts/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { prev, next } = getPostNeighbors(post.slug);
  const primaryTag = post.tags[0];
  const related = primaryTag
    ? getPostsByTag(primaryTag)
        .filter((item) => item.slug !== post.slug)
        .slice(0, 3)
    : [];

  return (
    <>
      <div className="wrap post-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { href: '/posts', label: '文章' }, { label: post.title }]} />

        <div className="flex gap-2 wrap-gap mt-6">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
              <Tag>{tag}</Tag>
            </Link>
          ))}
        </div>

        <h1 className="display mt-4">{post.title}</h1>

        <p className="post-meta mt-5">
          <span className="num">{formatDate(post.date)}</span>
          <span className="dot-sep">·</span>
          <span>约 {post.readingMinutes} 分钟读完</span>
          {post.series ? (
            <>
              <span className="dot-sep">·</span>
              <span>系列「{post.series}」</span>
            </>
          ) : null}
          {post.updated ? (
            <>
              <span className="dot-sep">·</span>
              <span>修订于 {formatDate(post.updated)}</span>
            </>
          ) : null}
        </p>

        <p className="lede">{post.summary}</p>
      </div>

      <div className="wrap grid grid-side post-body">
        <Prose html={post.html} />

        <aside className="sticky-side">
          <Toc items={post.toc} />

          <div className="tile tile-tint mt-6">
            <div className="h4">这篇文章</div>
            <dl className="info-list mt-3">
              <div className="row">
                <dt>发布</dt>
                <dd className="num">{formatDate(post.date)}</dd>
              </div>
              <div className="row">
                <dt>篇幅</dt>
                <dd>约 {post.readingMinutes} 分钟</dd>
              </div>
              {post.series ? (
                <div className="row">
                  <dt>系列</dt>
                  <dd>{post.series}</dd>
                </div>
              ) : null}
              <div className="row">
                <dt>标签</dt>
                <dd>{post.tags.join(' / ')}</dd>
              </div>
            </dl>
          </div>

          <div className="note mt-5">
            <Icon name="star" size="xs" style={{ position: 'absolute', left: -8, top: -10 }} />
            文章没有评论。想说什么，写封信给我。
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="section">
          <div className="wrap">
            <SectionHead eyebrow="相关" title={`同为「${primaryTag}」的文章`} />
            <PostList posts={related} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="wrap">
          <PostNav prev={prev} next={next} />
          <div className="center mt-7">
            <Link className="btn" href="/posts">
              ← 回到全部文章
            </Link>
          </div>
          <Callout tone="line" icon="info" className="mt-7">
            这篇文章对你有用的话，欢迎转发；注明出处即可，不用先问我。
          </Callout>
        </div>
      </section>
    </>
  );
}
