import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/Icon';
import { Subscribe } from '@/components/Subscribe';
import { Breadcrumb, SectionHead } from '@/components/ui';
import { formatDate, getPosts, getWorks } from '@/lib/content';
import { site, timeline } from '@/lib/site';

export const metadata: Metadata = {
  title: '近况',
  description: '此刻在做什么、写什么、读什么。比「关于我」更近，也比时间线更轻。',
  alternates: { canonical: '/now' },
};

interface Doing {
  icon: IconName;
  tone: 'wood' | 'sage' | 'ink';
  label: string;
  title: string;
  desc: string;
  link?: { href: string; label: string };
}

const doing: Doing[] = [
  {
    icon: 'sprout',
    tone: 'wood',
    label: '在做',
    title: 'Peregrine 的运行时',
    desc: '本地优先的对话式 Agent 工作台。工具调用、审批门控、两层上下文压缩、长期记忆、技能沉淀、定时调度、评测框架——都收在同一个后端里，数据全落本地。',
    link: { href: '/works/peregrine', label: '看这个项目' },
  },
  {
    icon: 'branch',
    tone: 'sage',
    label: '在写',
    title: '设计决策记录',
    desc: '每个项目都留一份：背景、备选、理由、代价，一条不落。RAG-MCP 的 DEV_CHANGELOG 就是照这个格式写的——「为什么这么定」有地方可查。',
    link: { href: '/works/rag-mcp', label: '看那份记录' },
  },
  {
    icon: 'moon',
    tone: 'ink',
    label: '在读',
    title: 'letta / llama_index / ragflow 的源码',
    desc: '带着「这条边界他们怎么处理」的问题读。读到能复现的问题就提 PR 回去——CyberClaw 那两个安全修复就是这么来的。',
  },
];

export default function NowPage() {
  const works = getWorks();
  const posts = getPosts();

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { label: '近况' }]} />

        <span className="eyebrow mt-6" style={{ display: 'inline-flex' }}>
          <span className="dot" />
          近况 · 最后更新 {formatDate(site.nowUpdated)}
        </span>
        <h1 className="display mt-5">现在在做什么</h1>
        <p className="lede">
          这里放「此刻」——手上在推的事、在写的东西、在读的书。
          它不像项目页那样只记结果，也不像关于页那样几年不变。
        </p>

        <div className="flex gap-3 wrap-gap mt-6">
          <Link className="btn btn-sm" href="/works">
            {works.length} 个项目
          </Link>
          <Link className="btn btn-sm" href="/posts">
            {posts.length} 篇文章
          </Link>
          <a className="btn btn-sm btn-ghost" href={`mailto:${site.email}`}>
            写封信
            <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
          </a>
        </div>
      </div>

      <section className="section-plain">
        <div className="wrap grid grid-3">
          {doing.map((item) => (
            <div className="tile reveal" key={item.label}>
              <div className="flex-center gap-3">
                <Icon name={item.icon} size="sm" tone={item.tone} />
                <span className="eyebrow" style={{ margin: 0 }}>
                  <span className={item.tone === 'wood' ? 'dot dot-wood' : 'dot'} />
                  {item.label}
                </span>
              </div>
              <div className="h4 mt-4">{item.title}</div>
              <p className="body-sm mt-2">{item.desc}</p>
              {item.link ? (
                <Link className="link-arrow mt-4" href={item.link.href}>
                  {item.link.label}
                  <Icon name="arrow-r" size="xs" style={{ width: 14, height: 10 }} />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap grid grid-side">
          <div className="reveal rel">
            <span className="eyebrow">
              <span className="dot dot-wood" />
              最近
            </span>
            <h2 className="h2 mt-2">最近这几个节点</h2>
            <p className="lede">只记重要的，倒序。</p>
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

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="说明" title="这一页是怎么来的" />

          <div className="grid grid-side">
            <div className="prose reveal">
              <p>
                <span className="code-inline">/now</span> 是个挺老的小惯例：在自己网站上留一页，
                写「此刻在做什么」。它比「关于我」诚实——关于页讲的是过去积累，
                这里讲的是当下状态；也比时间线轻——时间线记里程碑，这里记正在发生的事。
              </p>
              <p>
                我不打算让它一直「新」。这一页过期了，恰恰说明生活真的在动。
                如果你隔几个月回来看发现还是旧内容，那不是我忘了改，就是这段时间确实没干什么值得写的事。
              </p>
            </div>

            <div className="reveal">
              <div className="tile tile-tint">
                <div className="h4">这一页</div>
                <dl className="info-list mt-3">
                  <div className="row">
                    <dt>最后更新</dt>
                    <dd className="num">{formatDate(site.nowUpdated)}</dd>
                  </div>
                  <div className="row">
                    <dt>更新节奏</dt>
                    <dd>想起来了就改</dd>
                  </div>
                  <div className="row">
                    <dt>写什么</dt>
                    <dd>在做 · 在写 · 在读</dd>
                  </div>
                  <div className="row">
                    <dt>不写什么</dt>
                    <dd>日计划、待办清单</dd>
                  </div>
                </dl>
              </div>

              <div className="note mt-5">
                <Icon name="star" size="xs" style={{ position: 'absolute', left: -8, top: -10 }} />
                想知道更细的，直接写封信问我，比看这一页快。
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Subscribe title="我更新的时候，给你一封信" />
        </div>
      </section>
    </>
  );
}
