import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { Toc } from '@/components/Toc';
import {
  Breadcrumb,
  Callout,
  Cover,
  MetaRow,
  PostList,
  ProjectNav,
  Prose,
  SectionHead,
  StatusBadge,
  Tag,
} from '@/components/ui';
import { getPostsBySlugs, getWork, getWorkNeighbors, getWorks } from '@/lib/content';

export function generateStaticParams() {
  return getWorks().map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return { title: '项目未找到' };

  return {
    title: work.title,
    description: work.tagline,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: {
      type: 'article',
      title: work.title,
      description: work.tagline,
      url: `/works/${work.slug}`,
    },
  };
}

/** 封面里的界面示意：用几何块拼出「左列表 + 右内容」的常见工具布局 */
function MockApp({ category }: { category: 'web' | 'tool' }) {
  const accent = category === 'tool' ? 'var(--sage)' : 'var(--wood)';
  return (
    <div className="mock-app">
      <div className="mock-side">
        <div className="mock-row" style={{ width: '60%', background: 'var(--wood-deep)', opacity: 0.8 }} />
        <div className="mock-row" style={{ width: '88%' }} />
        <div className="mock-row" style={{ width: '74%' }} />
        <div className="mock-row" style={{ width: '82%' }} />
        <div className="mock-row" style={{ width: '56%' }} />
      </div>
      <div className="mock-main">
        <div className="mock-row" style={{ width: '44%', background: 'var(--ink)', opacity: 0.35 }} />
        <div className="mock-card">
          <div className="mock-row" style={{ width: '92%' }} />
          <div className="mock-row" style={{ width: '70%', marginTop: 8 }} />
        </div>
        <div className="mock-card" style={{ background: 'var(--wood-tint)', borderColor: 'transparent' }}>
          <div className="mock-row" style={{ width: '80%', background: 'var(--wood-dark)', opacity: 0.5 }} />
          <div className="mock-row" style={{ width: '52%', marginTop: 8, background: 'var(--wood-dark)', opacity: 0.3 }} />
        </div>
        <div className="mock-card">
          <div className="mock-row" style={{ width: '64%' }} />
          <div className="mock-row" style={{ width: '40%', marginTop: 8, background: accent, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}

export default async function WorkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const { prev, next } = getWorkNeighbors(work.slug);
  const related = getPostsBySlugs(work.relatedPosts);

  const metaItems: { label: string; value: ReactNode }[] = [
    { label: '角色', value: work.role },
    { label: '时间', value: work.period },
    { label: '状态', value: <StatusBadge status={work.status} /> },
  ];
  if (work.platform) metaItems.push({ label: '平台', value: work.platform });
  if (work.license) metaItems.push({ label: '许可', value: work.license });
  if (work.size) metaItems.push({ label: '体量', value: <span className="num">{work.size}</span> });

  const infoRows: { label: string; value: ReactNode }[] = [];
  if (work.repo) {
    infoRows.push({
      label: '仓库',
      value: (
        <a href={work.repo} rel="noreferrer">
          GitHub ↗
        </a>
      ),
    });
  }
  if (work.demo) {
    infoRows.push({
      label: '演示',
      value: (
        <a href={work.demo} rel="noreferrer">
          网页版 ↗
        </a>
      ),
    });
  }
  if (work.license) infoRows.push({ label: '许可', value: work.license });
  infoRows.push({ label: '反馈', value: '邮件优先' });

  return (
    <>
      <div className="wrap" style={{ paddingTop: 56 }}>
        <Breadcrumb
          items={[{ href: '/', label: '首页' }, { href: '/works', label: '项目' }, { label: work.title }]}
        />

        {/* 一句话定位 + 角色 / 时间 / 状态 */}
        <div className="proj-head" style={{ marginTop: 'var(--sp-6)' }}>
          <div>
            <span className="eyebrow">
              <span className="dot dot-wood" />
              项目 · {work.category === 'tool' ? '工具' : '网页'}
            </span>
            <h1 className="display mt-5">{work.title}</h1>
            <p className="prose-lead mt-4">{work.tagline}</p>

            <div className="stack-row mt-6">
              {work.stack.map((item) => (
                <Tag key={item} variant="line">
                  {item}
                </Tag>
              ))}
            </div>

            <div className="flex gap-3 wrap-gap mt-6">
              {work.demo ? (
                <a className="btn btn-solid" href={work.demo} rel="noreferrer">
                  打开演示
                  <Icon name="arrow-r" size="xs" className="arw" style={{ width: 16, height: 10 }} />
                </a>
              ) : null}
              {work.repo ? (
                <a className="btn" href={work.repo} rel="noreferrer">
                  查看仓库
                </a>
              ) : null}
              {related[0] ? (
                <Link className="btn btn-ghost" href={`/posts/${related[0].slug}`}>
                  读开发笔记
                </Link>
              ) : null}
            </div>
          </div>

          <MetaRow items={metaItems} />
        </div>

        {/* 封面：有真实截图就渲染截图，没有就回退到几何块示意（规范 16 节） */}
        <Cover caption={`图 1 · ${work.title} 主界面。`}>
          {work.coverImage ? (
            // 用原生 img 而不是 next/image：全站没有用 next/image（静态导出下不需要），保持一致
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.coverImage} alt={`${work.title} 主界面截图`} />
          ) : (
            <MockApp category={work.category} />
          )}
        </Cover>
      </div>

      {/* 正文 + 侧栏 */}
      <div className="wrap grid grid-side proj-body">
        <Prose html={work.html} />

        <aside className="sticky-side rel">
          <Toc items={work.toc} />

          <div className="tile tile-tint mt-6">
            <div className="h4">项目信息</div>
            <dl className="info-list mt-3">
              {infoRows.map((row) => (
                <div className="row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Icon name="arrow" size="md" className="orn-abs" style={{ right: 0, top: -46, opacity: 0.5 }} />
        </aside>
      </div>

      {/* 相关文章 */}
      {related.length ? (
        <section className="section">
          <div className="wrap">
            <SectionHead eyebrow="相关" title="做这个项目时写下的文章" />
            <PostList posts={related} />
          </div>
        </section>
      ) : null}

      {/* 上一个 / 下一个 */}
      <section className="section">
        <div className="wrap">
          <ProjectNav prev={prev} next={next} />
          <div className="center mt-7">
            <Link className="btn" href="/works">
              ← 回到全部项目
            </Link>
          </div>
        </div>
      </section>

      {work.note ? (
        <div className="wrap" style={{ paddingBottom: 'var(--sp-8)' }}>
          <Callout tone="note" icon="spark">
            {work.note}
          </Callout>
        </div>
      ) : null}
    </>
  );
}
