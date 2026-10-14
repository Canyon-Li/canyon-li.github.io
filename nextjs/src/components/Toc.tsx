'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/types';

/** 本页目录：滚动时高亮当前所在小节（设计规范 12 节）。 */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (!items.length) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!headings.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // 取「已经越过吸顶栏的最后一个小节」
      let current = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 150) current = heading.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="toc" aria-label="本页目录">
      <div className="body-sm toc-title">本页目录</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={[item.depth === 3 ? 'lvl2' : '', active === item.id ? 'active' : ''].filter(Boolean).join(' ')}
          aria-current={active === item.id ? 'true' : undefined}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
