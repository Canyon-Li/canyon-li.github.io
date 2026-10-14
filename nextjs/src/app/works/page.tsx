import type { Metadata } from 'next';
import { Subscribe } from '@/components/Subscribe';
import { WorksFilter } from '@/components/WorksFilter';
import { Breadcrumb } from '@/components/ui';
import { getWorks } from '@/lib/content';

export const metadata: Metadata = {
  title: '项目',
  description:
    '做过的项目：Peregrine、AuditronClaw、JeRAG、RAG-MCP、Mini-Play，每个都写了为什么做、怎么取舍、结果如何。',
  alternates: { canonical: '/works' },
};

export default function WorksPage() {
  const works = getWorks();

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumb items={[{ href: '/', label: '首页' }, { label: '项目' }]} />

        <span className="eyebrow mt-6" style={{ display: 'inline-flex' }}>
          <span className="dot dot-wood" />
          项目 · {works.length} 个
        </span>
        <h1 className="display mt-5">做过的东西</h1>
        <p className="lede">
          看完这些，你会知道每个项目为什么做、怎么做选择的、结果怎样、还有哪里不够好。
          对了，所有源码都在 GitHub 上，每页底部能找到链接。
        </p>
      </div>

      <section className="section-plain" style={{ paddingBottom: 'var(--sp-9)' }}>
        <div className="wrap">
          {/* 卡片本身是 h3，这一层 h2 只在读屏里存在：不加的话页面从 h1 直接跳到 h3。
              视觉上不需要标题——上面已经有 h1 和筛选 chips 了。 */}
          <h2 className="sr-only">全部项目</h2>
          <WorksFilter
            works={works}
            chips={[
              { key: 'all', label: '全部' },
              { key: 'web', label: '网页' },
              { key: 'tool', label: '工具' },
            ]}
          />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Subscribe title="有新项目时，给你一封信" />
        </div>
      </section>
    </>
  );
}
