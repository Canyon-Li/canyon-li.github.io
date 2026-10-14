import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Subscribe } from '@/components/Subscribe';
import { Breadcrumb, SectionHead, Stats, Tag } from '@/components/ui';
import { getPosts, getWorks } from '@/lib/content';
import { site, timeline } from '@/lib/site';

export const metadata: Metadata = {
  title: '关于',
  description: '关于我：做 AI Agent / RAG / MCP 的工程实现与安全边界。这里写了我在做什么、怎么联系我。',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const works = getWorks();
  const posts = getPosts();

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { label: '关于' }]} />

        <div className="grid grid-side mt-6">
          <div className="reveal">
            <span className="eyebrow">
              <span className="dot" />
              关于
            </span>
            <h1 className="display mt-5">
              <span className="hl-sage">勤动手</span>，多记录。
            </h1>
            <p className="lede">
              我是 {site.name}，{site.job}。最近在做 AI Agent / RAG / MCP 的工程实现。
            </p>
            <div className="flex gap-3 wrap-gap mt-7">
              <a className="btn btn-solid" href={`mailto:${site.email}`}>
                给我写封信
                <Icon name="arrow-r" size="xs" className="arw" style={{ width: 16, height: 10 }} />
              </a>
              <Link className="btn" href="/works">
                看看项目
              </Link>
              <Link className="btn btn-ghost" href="/posts">
                读读文章
              </Link>
            </div>
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
              源码已在 GitHub 开源。欢迎测试，也欢迎开 issue 和 PR —— 我会尽快回复。
            </div>
          </div>
        </div>
      </div>

      <div className="wrap stats-band reveal">
        <Stats
          items={[
            { value: String(works.length), label: '上线过的项目' },
            { value: String(posts.length), label: '写下来的文章' },
            { value: '3', label: '次合并到上游' },
          ]}
        />
      </div>

      {/* 我在意的事 —— 只有一句，用满宽木色插页给它分量 */}
      <section className="quote-band">
        <div className="wrap-narrow center reveal">
          <Icon name="star" size="md" style={{ margin: '0 auto' }} />
          <blockquote className="pull mt-6 quote-lg">「粗糙的开始最重要。」</blockquote>
        </div>
      </section>

      {/* 历程 */}
      <section className="section">
        <div className="wrap grid grid-side">
          <div className="reveal rel">
            <span className="eyebrow">
              <span className="dot dot-wood" />
              历程
            </span>
            <h2 className="h2 mt-2">这几年做过的事</h2>
            <p className="lede">按时间倒序，只记重要的节点。</p>
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

      {/* 上游贡献 */}
      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="上游" title="读源码时撞到的问题，修完提回去" />
          <div className="grid grid-3">
            <div className="tile reveal">
              <div className="h4">CyberClaw · PR #18</div>
              <p className="body-sm mt-3">
                calculator 工具能用属性链从 <span className="code-inline">eval()</span> 逃逸拿到
                <span className="code-inline">os.system</span>。改成 AST 节点白名单求值器，只放行算术。
              </p>
              <a
                className="link-arrow mt-4"
                href="https://github.com/ttguy0707/CyberClaw/pull/18"
                rel="noreferrer"
              >
                看这个 PR
                <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
              </a>
            </div>

            <div className="tile reveal">
              <div className="h4">CyberClaw · PR #19</div>
              <p className="body-sm mt-3">
                shell 校验只有五条正则黑名单，环境变量展开和引号内联解释器都能绕过。
                换成 shlex 结构化白名单，白名单外的二进制一律拒绝。
              </p>
              <a
                className="link-arrow mt-4"
                href="https://github.com/ttguy0707/CyberClaw/pull/19"
                rel="noreferrer"
              >
                看这个 PR
                <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
              </a>
            </div>

            <div className="tile reveal">
              <div className="h4">deer-flow · PR #6216</div>
              <p className="body-sm mt-3">
                目录和标题对不上，另外 deploy.sh 里的路径写错了。顺手一起修掉。
              </p>
              <a
                className="link-arrow mt-4"
                href="https://github.com/bytedance/deer-flow/pull/6216"
                rel="noreferrer"
              >
                看这个 PR
                <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 引用 */}
      <section className="section">
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

      {/* 联系 */}
      <section className="section" id="contact">
        <div className="wrap grid grid-side">
          <div className="reveal">
            <span className="eyebrow">
              <span className="dot" />
              联系
            </span>
            <h2 className="h2 mt-2">写封信给我</h2>
            <p className="lede">
              不管是想聊一个想法、指出文章里的错，还是发现了某个项目的问题，都欢迎来找我聊聊。
            </p>

            <div className="tile tile-wood mt-6">
              <div className="body-sm" style={{ color: 'var(--wood-dark)' }}>
                邮箱
              </div>
              <a className="h3 mt-2" href={`mailto:${site.email}`} style={{ display: 'inline-block' }}>
                {site.email}
              </a>
            </div>

            <Icon name="sign" tone="ink" className="mt-7" style={{ width: 150, height: 45 }} />
          </div>

          <div className="reveal">
            <div className="tile">
              <div className="h4">几个常被问到的</div>
              <ul className="list-check mt-4">
                <li>代码能直接用吗？——MIT 协议，保留版权声明和许可证全文就行。</li>
                <li>
                  文章可以转载吗？——可以。文字按 CC BY-NC-SA 4.0 授权：署名「Canyon」、附原文链接、非商业用途、
                  并以相同方式共享。
                </li>
                <li>能合作吗？——先写信说说你在做什么。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Subscribe />
        </div>
      </section>
    </>
  );
}
