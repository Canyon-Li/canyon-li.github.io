import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { CoverArt } from '@/components/CoverArt';
import { formatDate, type Post, type Work, type WorkStatus } from '@/lib/types';

/* ---------- 标签与徽章 ---------- */

type TagVariant = 'sage' | 'wood' | 'ink' | 'line';

export function Tag({ children, variant = 'sage' }: { children: ReactNode; variant?: TagVariant }) {
  const cls = variant === 'sage' ? 'tag' : `tag tag-${variant}`;
  return <span className={cls}>{children}</span>;
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'new' | 'live' }) {
  const cls = variant === 'default' ? 'badge' : `badge badge-${variant}`;
  return <span className={cls}>{children}</span>;
}

/** 项目状态：活跃带圆点，已归档用更深字色（不靠颜色单独表达，规范 16 节） */
export function StatusBadge({ status }: { status: WorkStatus }) {
  if (status === '活跃') return <Badge variant="live">活跃</Badge>;
  if (status === '维护中') return <Badge>维护中</Badge>;
  return (
    <Badge>
      <span style={{ color: 'var(--ink-soft)' }}>已归档</span>
    </Badge>
  );
}

/* ---------- 区块标题 ---------- */

export function SectionHead({
  eyebrow,
  title,
  more,
  moreHref,
  tone = 'sage',
}: {
  eyebrow?: string;
  title: string;
  more?: string;
  moreHref?: string;
  tone?: 'sage' | 'wood';
}) {
  return (
    <div className="sec-head reveal">
      <div>
        {eyebrow ? (
          <span className="eyebrow">
            <span className={tone === 'wood' ? 'dot dot-wood' : 'dot'} />
            {eyebrow}
          </span>
        ) : null}
        <h2 className="h2 mt-2">{title}</h2>
      </div>
      {more && moreHref ? (
        <Link className="more" href={moreHref}>
          {more}
        </Link>
      ) : null}
    </div>
  );
}

/* ---------- 面包屑 ---------- */

export function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="面包屑">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={{ display: 'contents' }}>
          {index > 0 ? <span className="sep">/</span> : null}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span style={{ color: 'var(--ink)' }}>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ---------- 元信息行（规范 16 节：顺序固定） ---------- */

export function MetaRow({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="meta-row">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- 数据条 ---------- */

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <div className="n num">{item.value}</div>
          <div className="l">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 文章列表 ---------- */

export function PostList({ posts, empty = '这里还空着。' }: { posts: Post[]; empty?: string }) {
  if (!posts.length) return <p className="list-empty">{empty}</p>;
  return (
    <ul className="posts reveal">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`}>
            <span className="idx">{String(index + 1).padStart(2, '0')}</span>
            <span className="date num">{formatDate(post.date)}</span>
            <span>
              <span className="title">{post.title}</span>
              <span className="sub">{post.summary}</span>
            </span>
            <span className="flex-center gap-4">
              {post.tags[0] ? <Tag>{post.tags[0]}</Tag> : null}
              <Icon name="arrow-r" size="xs" tone="ink" className="go" style={{ width: 18, height: 11 }} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- 提示块 ---------- */

/**
 * 四种语气：默认（米灰）/ 建议（灰绿）/ 提醒（木色）/ 草稿（虚线）。
 * 图形不随语气自动切换 —— 原型的站点页面里 `callout-line` 用的就是 `o-info`
 * （只有 components.html 的展示区用了 `o-asterisk`），所以这里保留显式 `icon`，
 * 由调用处决定，避免把展示页的用法当成站点规范。
 */
export function Callout({
  children,
  tone = 'default',
  icon = 'info',
  className = '',
}: {
  children: ReactNode;
  tone?: 'default' | 'tip' | 'note' | 'line';
  icon?: IconName;
  className?: string;
}) {
  const cls = tone === 'default' ? 'callout' : `callout callout-${tone}`;
  return (
    <div className={className ? `${cls} ${className}` : cls}>
      <Icon name={icon} size="xs" tone={tone === 'tip' ? 'sage' : 'wood'} />
      <span>{children}</span>
    </div>
  );
}

/* ---------- 封面（16:10 + 浅色衬底，深色截图不刺眼） ---------- */

export function Cover({ children, caption, inset = true }: { children?: ReactNode; caption?: string; inset?: boolean }) {
  return (
    <figure className="figure">
      <div className="cover">
        {inset ? <div className="cover-inset">{children}</div> : children}
      </div>
      {caption ? <figcaption className="figcaption">{caption}</figcaption> : null}
    </figure>
  );
}

/* ---------- 正文 ---------- */

export function Prose({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`prose${className ? ` ${className}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- 项目卡片 ---------- */

export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="card card-hover reveal" data-cat={work.category}>
      <CoverArt work={work} />
      <div className="pad">
        <div className="flex-center gap-2">
          <StatusBadge status={work.status} />
          <Badge>{work.category === 'tool' ? '工具' : '网页'}</Badge>
        </div>
        <h3 className="h3 mt-3">
          <Link href={`/works/${work.slug}`}>{work.title}</Link>
        </h3>
        <p className="body-sm">{work.tagline}</p>
        <div className="flex gap-2 wrap-gap mt-4">
          {work.stack.map((item) => (
            <Tag key={item} variant="line">
              {item}
            </Tag>
          ))}
        </div>
        <div className="flex between flex-center mt-5">
          <span className="body-sm" style={{ margin: 0 }}>
            {work.period} · {work.role}
          </span>
          <Link className="link-arrow" href={`/works/${work.slug}`}>
            查看
            <Icon name="arrow-r" size="xs" tone="ink" style={{ width: 14, height: 10 }} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- 上一个 / 下一个 ---------- */

export function ProjectNav({ prev, next }: { prev?: Work; next?: Work }) {
  if (!prev && !next) return null;
  return (
    <div className="proj-nav">
      {prev ? (
        <Link href={`/works/${prev.slug}`}>
          <div className="dir">← 上一个项目</div>
          <div className="name">{prev.title}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/works/${next.slug}`} className="to-end">
          <div className="dir">下一个项目 →</div>
          <div className="name">{next.title}</div>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export function PostNav({ prev, next }: { prev?: Post; next?: Post }) {
  if (!prev && !next) return null;
  return (
    <div className="proj-nav">
      {prev ? (
        <Link href={`/posts/${prev.slug}`}>
          <div className="dir">← 上一篇</div>
          <div className="name">{prev.title}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/posts/${next.slug}`} className="to-end">
          <div className="dir">下一篇 →</div>
          <div className="name">{next.title}</div>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

/* ---------- 空状态 ---------- */

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name="hills" size="lg" style={{ margin: '0 auto' }} />
      <div className="h4">{title}</div>
      {description ? <p className="body-sm mt-2">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
