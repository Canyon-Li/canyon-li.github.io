import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Subscribe } from '@/components/Subscribe';
import { WorksFilter } from '@/components/WorksFilter';
import { PostList, SectionHead, Stats, Tag } from '@/components/ui';
import { getFeaturedWorks, getAllTags, getPosts, getWorks } from '@/lib/content';
import { site, timeline } from '@/lib/site';

export default function HomePage() {
  const works = getWorks();
  const featured = getFeaturedWorks(3);
  const posts = getPosts();
  // 取实际用得最多的标签，而不是写死一个 —— 写死的那个会随内容变动失效
  const topTag = getAllTags()[0]?.tag;
  const latest = posts.slice(0, 4);

  return (
    <>
      {/* ============ Hero：项目优先，紧凑排版 ============ */}
      <section className="section-plain">
        <div className="wrap grid grid-side hero">
          <div className="rel reveal">
            <span className="eyebrow">
              <span className="dot" />
              {site.job}
              {site.location ? ` · 现居${site.location.split(' · ')[0]}` : ''}
            </span>
            <h1 className="display mt-5">
              做 Agent 的工程，
              <br />
              也<span className="hl">量它的边界</span>。
            </h1>
            <p className="lede">
              可以叫我 {site.name}，也可以叫我阿康。这个网站主要记录我的一些项目和思考，仅作分享，不做指导。
              如果你碰巧路过，希望它能满足你的好奇心。
            </p>

            <div className="flex gap-3 wrap-gap mt-7">
              <Link className="btn btn-solid" href="#works">
                看看作品
                <Icon name="arrow-r" size="xs" className="arw" style={{ width: 16, height: 10 }} />
              </Link>
              <Link className="btn" href="#posts">
                读读文章
              </Link>
              <Link className="btn btn-ghost" href="/about">
                关于我
              </Link>
            </div>

            <div className="hero-meta mt-7">
              <span className="item">
                <Icon name="sprout" size="xs" />
                <span className="body-sm">{works.length} 个项目上线</span>
              </span>
              <span className="item">
                <Icon name="rings" size="xs" tone="sage" />
                <span className="body-sm">{posts.length} 篇文章</span>
              </span>
              <span className="item">
                <Icon name="moon" size="xs" />
                <span className="body-sm">全部开源</span>
              </span>
            </div>
          </div>

          <div className="rel reveal">
            <Icon name="sun" size="lg" className="orn-abs" style={{ right: -6, top: -26 }} />
            <Icon name="branch" size="md" tone="sage" className="orn-abs" style={{ left: -14, bottom: 64 }} />
            <Icon name="dots" size="sm" tone="ink" className="orn-abs" style={{ left: -4, top: 16 }} />

            <div className="arch arch-tall rel portrait">
              <svg
                className="ticks"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
                stroke="currentColor"
                strokeWidth=".5"
              >
                <path d="M0 6V0h6M94 0h6v6M100 94v6h-6M6 100H0v-6" />
              </svg>
              <i
                className="layer"
                style={{ left: 0, right: 0, bottom: 0, height: '36%', background: 'var(--wood)', opacity: 0.9 }}
              />
              <i
                className="layer"
                style={{
                  left: '14%',
                  bottom: 0,
                  width: '32%',
                  height: '56%',
                  background: 'var(--wood-deep)',
                  opacity: 0.8,
                  borderRadius: '120px 120px 0 0',
                }}
              />
              <i
                className="layer"
                style={{
                  right: '12%',
                  top: '12%',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--sage)',
                  opacity: 0.5,
                }}
              />
              <span className="p-label">AGENT · RAG</span>
            </div>

            <div className="stamp stamp-badge">
              <svg viewBox="0 0 104 104" className="stamp-ring">
                <defs>
                  <path id="stampArc" d="M52 52m-36 0a36 36 0 1 1 72 0a36 36 0 1 1 -72 0" />
                </defs>
                <circle cx="52" cy="52" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="52" cy="52" r="30" fill="none" stroke="currentColor" strokeWidth=".6" />
                <text fill="currentColor" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.6 }}>
                  <textPath href="#stampArc">KEEP MOVING · KEEP GROWING · </textPath>
                </text>
                <path
                  d="M52 40c5 3 8 7 8 12s-3 9-8 12c-5-3-8-7-8-12s3-9 8-12z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 精选项目（首屏之后立刻出现） ============ */}
      <section className="section works-featured" id="works">
        <div className="wrap">
          <SectionHead
            eyebrow="项目"
            title="精选项目"
            tone="wood"
            more={`全部 ${works.length} 个 →`}
            moreHref="/works"
          />

          <WorksFilter
            works={featured}
            showViewToggle={false}
            chips={[
              { key: 'all', label: '全部' },
              { key: 'web', label: '网页' },
              { key: 'tool', label: '工具' },
            ]}
          />
        </div>
      </section>

      {/* ============ 近况条 ============ */}
      <div className="now-bar">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot dot-wood" />
            最近
          </span>
          <span className="text">{site.now}</span>
          <Link className="link-arrow more" href="/now">
            全部近况
            <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
          </Link>
        </div>
      </div>

      {/* ============ 数据 ============ */}
      <div className="wrap stats-band reveal">
        <Stats
          items={[
            { value: String(works.length), label: '上线过的项目' },
            { value: String(posts.length), label: '写下来的文章' },
            { value: '3', label: '次合并到上游' },
          ]}
        />
      </div>

      {/* ============ 文章 ============ */}
      <section className="section" id="posts">
        <div className="wrap">
          <SectionHead
            eyebrow="文章"
            title="最近写的"
            more={`全部 ${posts.length} 篇 →`}
            moreHref="/posts"
          />
          <PostList posts={latest} empty="还没有发布文章。" />
          <div className="flex between wrap-gap mt-6 flex-center">
            <Link className="link-arrow" href="/posts">
              按月归档
              <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
            </Link>
            {topTag ? (
              <Link className="link-arrow" href={`/tags/${encodeURIComponent(topTag)}`}>
                按标签看
                <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ 引用（满宽木色插页：在长页面里制造一次章节停顿） ============ */}
      <section className="quote-band">
        <div className="wrap-narrow center reveal">
          <Icon name="star" size="md" style={{ margin: '0 auto' }} />
          <blockquote className="pull mt-6 quote-lg">
            「简单不是少，而是<strong style={{ fontWeight: 500 }}>刚刚够</strong>。」
            <cite className="mt-4" style={{ display: 'block' }}>
              —— JeRAG 名字的来源（Je = Just Enough）
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ============ 关于 ============ */}
      <section className="section" id="about">
        <div className="wrap grid grid-side">
          <div className="reveal">
            <span className="eyebrow">
              <span className="dot" />
              关于
            </span>
            <h2 className="h2 mt-2">关于我</h2>
            <p className="lede">
              我一直在感受 AI 带来的生活变化，也在不断了解 AI 技术。把这些都写下来，
              一方面能帮自己巩固知识、锻炼表达；另一方面也想让大家认识我，有机会一起交流。
              碰到值得分享的东西，我就会放上来。
            </p>
            <blockquote className="pull mt-6" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>
              如果你也在做类似的事，欢迎写封信给我，聊聊。
            </blockquote>

            <div className="flex-center gap-5 wrap-gap mt-7">
              <a className="btn btn-wood" href={`mailto:${site.email}`}>
                给我写封信
              </a>
              <Link className="link-arrow" href="/about">
                或者看看我在做什么
                <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
              </Link>
            </div>

            <Icon name="sign" tone="ink" className="mt-7" style={{ width: 150, height: 45 }} />
          </div>

          <div className="reveal">
            <div className="card-profile">
              <span className="avatar" aria-hidden="true">
                C
              </span>
              <div>
                <div className="h4">{site.name}</div>
                <div className="body-sm">{site.job}</div>
                <div className="flex gap-2 mt-2">
                  <Tag>Agent</Tag>
                  <Tag variant="wood">RAG</Tag>
                  <Tag variant="ink">安全</Tag>
                </div>
              </div>
            </div>

            <dl className="mt-6" style={{ borderTop: 'var(--bw-line) solid var(--hair)' }}>
              {site.location ? (
                <div className="about-row">
                  <dt>现居</dt>
                  <dd>{site.location}</dd>
                </div>
              ) : null}
              <div className="about-row">
                <dt>职业</dt>
                <dd>{site.job}</dd>
              </div>
              <div className="about-row">
                <dt>在做</dt>
                <dd>Agent 运行时与 RAG</dd>
              </div>
              <div className="about-row">
                <dt>邮箱</dt>
                <dd className="mono">{site.email}</dd>
              </div>
              <div className="about-row">
                <dt>状态</dt>
                <dd>
                  <span className="badge badge-live">持续开源</span>
                </dd>
              </div>
            </dl>

            <div className="note mt-6">
              <Icon name="star" size="xs" style={{ position: 'absolute', left: -8, top: -10 }} />
              回信通常在两三天内。
            </div>
          </div>
        </div>
      </section>

      {/* ============ 历程 ============ */}
      <section className="section">
        <div className="wrap grid grid-side">
          <div className="reveal rel">
            <span className="eyebrow">
              <span className="dot dot-wood" />
              历程
            </span>
            <h2 className="h2 mt-2">这几年做过的事</h2>
            <Icon name="arch" size="md" className="orn-abs" style={{ right: 0, top: 0, opacity: 0.5 }} />
          </div>
          <ul className="timeline reveal">
            {timeline.map((item) => (
              <li key={item.when}>
                <div className="when">{item.when}</div>
                <div className="what">{item.what}</div>
                <div className="desc">{item.desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ 订阅 ============ */}
      <section className="section" id="subscribe">
        <div className="wrap">
          <Subscribe />
        </div>
      </section>
    </>
  );
}
