'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';

/**
 * 客户端效果：
 * 1. 滚动入场（.reveal → .in），用 MutationObserver 兼顾筛选后新挂载的卡片
 * 2. 回到顶部按钮（滚过一屏才出现）
 * 两个效果都尊重 prefers-reduced-motion（由 CSS 兜底）。
 */
export function ClientFx() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'));

    // 不支持 IntersectionObserver 时直接全部显示，不做降级动画
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll<HTMLElement>('.reveal').forEach((node) => node.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    );

    const scan = () => nodes().forEach((node) => observer.observe(node));
    scan();

    // 筛选、切换视图后会有新的 .reveal 节点，需要重新登记
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      className={`to-top${showTop ? ' show' : ''}`}
      type="button"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Icon name="up" size="xs" />
    </button>
  );
}
