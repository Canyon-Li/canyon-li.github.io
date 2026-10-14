'use client';

import { useState } from 'react';
import { WorkCard } from '@/components/ui';
import type { Work, WorkCategory } from '@/lib/types';

interface Chip {
  key: 'all' | WorkCategory;
  label: string;
}

/**
 * 项目列表的筛选与视图切换。
 * 用 React 状态直接过滤数据（不做 DOM 隐藏），所以筛选结果始终与计数一致。
 */
export function WorksFilter({
  works,
  chips,
  showViewToggle = true,
}: {
  works: Work[];
  chips: Chip[];
  /** 首页只保留筛选，列表页才给网格/列表切换 */
  showViewToggle?: boolean;
}) {
  const [key, setKey] = useState<Chip['key']>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const list = key === 'all' ? works : works.filter((work) => work.category === key);

  return (
    <>
      <div className="flex between flex-center wrap-gap works-toolbar">
        <div className="chips" role="group" aria-label="按类型筛选项目">
          {chips.map((chip) => (
            <button
              key={chip.key}
              className="chip"
              type="button"
              aria-pressed={key === chip.key}
              onClick={() => setKey(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {showViewToggle ? (
          <div className="btn-group" role="group" aria-label="切换视图">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              网格
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              列表
            </button>
          </div>
        ) : null}
      </div>

      {list.length ? (
        <div className={view === 'grid' ? 'grid grid-3' : 'grid grid-list'}>
          {list.map((work) => (
            <WorkCard key={work.slug} work={work} />
          ))}
        </div>
      ) : (
        <p className="list-empty">这一类下面还没有项目。</p>
      )}

      <p className="works-count body-sm" role="status">
        共 {works.length} 个项目，当前显示 {list.length} 个
      </p>
    </>
  );
}
