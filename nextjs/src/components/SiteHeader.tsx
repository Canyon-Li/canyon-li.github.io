'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search } from '@/components/Search';
import { useFocusTrap } from '@/components/useFocusTrap';
import { site } from '@/lib/site';

/** 与 components.css 里 860px 那个断点保持一致 */
const DESKTOP_QUERY = '(min-width: 861px)';

/**
 * 顶栏 + 移动端抽屉。
 * 抽屉是「模态式」的：打开时锁滚动、焦点移入并在内部循环、Esc 关闭、关闭后焦点还给触发按钮。
 * 所以它同时带 role="dialog" 与 aria-modal——行为和语义必须一致（设计规范 10 节）。
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // 切换路由时收起抽屉
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 视口放大回桌面宽度时收起：否则焦点会困在 display:none 的链接上
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [open]);

  useFocusTrap(drawerRef, open, { onEscape: () => setOpen(false), restoreTo: toggleRef });

  // 带 # 的导航项（联系）不做当前态标记
  const isCurrent = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">
            C
          </span>
          {site.name}
        </Link>

        <nav className="nav-links" aria-label="主导航">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Search />
          <Link className="btn btn-sm hide-sm" href="/#subscribe">
            订阅更新
          </Link>
          <button
            ref={toggleRef}
            className="nav-toggle"
            type="button"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            <i />
          </button>
        </div>
      </div>

      <div
        className={`nav-drawer${open ? ' open' : ''}`}
        id="nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="站点导航"
      >
        <nav className="wrap" aria-label="站点导航">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/#subscribe">订阅更新</Link>
        </nav>
      </div>
    </header>
  );
}
