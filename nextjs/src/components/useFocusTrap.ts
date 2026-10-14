'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 模态容器的焦点管理（设计规范 10 节）：锁滚动、焦点移入、Tab 在容器内循环、Esc 关闭。
 *
 * 只把容器**内部**的可聚焦元素串成一个环，触发按钮不在环里——这是模态的标准行为，
 * 触发按钮会在关闭时通过 restoreTo 拿回焦点。
 *
 * 回调放进 ref，这样调用方传内联箭头函数也不会让 effect 反复重建。
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: { onEscape?: () => void; restoreTo?: RefObject<HTMLElement | null> } = {},
) {
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // offsetParent 为 null 说明元素不可见（如 display:none 的抽屉），要排除掉
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );

    focusables()[0]?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        latest.current.onEscape?.();
        latest.current.restoreTo?.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current ? items.includes(current) : false;

      if (event.shiftKey) {
        if (!inside || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, containerRef]);
}
