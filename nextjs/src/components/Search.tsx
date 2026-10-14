'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { useFocusTrap } from '@/components/useFocusTrap';

interface Item {
  type: 'work' | 'post';
  title: string;
  summary: string;
  url: string;
  tags: string[];
  meta: string;
  text: string;
}

const TYPE_LABEL: Record<Item['type'], string> = { work: '项目', post: '文章' };
const MAX_RESULTS = 8;

/** 标题 > 标签 > 摘要 > 正文，逐级降权 */
function score(item: Item, query: string): number {
  const title = item.title.toLowerCase();
  const tags = item.tags.join(' ').toLowerCase();
  const summary = item.summary.toLowerCase();
  const text = (item.text ?? '').toLowerCase();

  if (title === query) return 100;
  if (title.startsWith(query)) return 70;
  if (title.includes(query)) return 50;
  if (tags.includes(query)) return 30;
  if (summary.includes(query)) return 20;
  if (text.includes(query)) return 5;
  return 0;
}

/** 正文里命中时，截一段上下文出来 */
function excerpt(item: Item, query: string): string {
  const text = item.text ?? '';
  const index = text.toLowerCase().indexOf(query);
  if (index < 0) return item.summary;

  const radius = 36;
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

/** 把命中的部分包成 <mark> */
function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;

  const haystack = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let at = haystack.indexOf(needle);
  let key = 0;

  while (at >= 0) {
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(<mark key={key++}>{text.slice(at, at + needle.length)}</mark>);
    cursor = at + needle.length;
    at = haystack.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

/**
 * 站内搜索。索引是构建时生成的 /search-index.json，**首次打开面板时才拉取**，
 * 不拖慢首屏。支持 Cmd/Ctrl+K 或 / 唤起、↑↓ 选择、Enter 打开、Esc 关闭。
 */
export function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // 唤起快捷键
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 首次打开才拉索引
  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;

    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, items]);

  // 关闭时清空，下次打开是干净的
  useEffect(() => {
    if (open) return;
    setQuery('');
    setActive(0);
  }, [open]);

  useFocusTrap(panelRef, open, { onEscape: () => setOpen(false), restoreTo: triggerRef });

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !items) return [];

    return items
      .map((item) => ({ item, value: score(item, needle) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_RESULTS)
      .map((entry) => entry.item);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const target = results[active];
      if (target) {
        event.preventDefault();
        go(target.url);
      }
    }
  };

  const needle = query.trim();

  const panel = (
    <div
      className="search-panel"
      onMouseDown={(event) => {
        // 点遮罩关闭，点面板内部不关
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="search-panel-inner" ref={panelRef} role="dialog" aria-modal="true" aria-label="站内搜索">
        <div className="search-head">
          <div className="search">
            <Icon name="search" size="xs" />
            <input
              className="input"
              type="search"
              value={query}
              placeholder="搜项目、文章、标签…"
              aria-label="搜索关键词"
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `search-hit-${active}` : undefined}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
            />
          </div>
        </div>

        {/* role="listbox" 只在真的有 option 子节点时才挂：空态/无结果时这里是普通容器，
            挂着 listbox 会违反 aria-required-children（listbox 必须含 option/group） */}
        <div
          className="search-body"
          id="search-results"
          role={needle && results.length ? 'listbox' : undefined}
          aria-label={needle && results.length ? '搜索结果' : undefined}
        >
          {!needle ? (
            <div className="search-empty">
              <Icon name="search" size="md" tone="sage" />
              <p>
                输入关键词开始搜索。也可以按 <span className="kbd">/</span> 随时唤起这里。
              </p>
            </div>
          ) : results.length ? (
            results.map((item, index) => (
              <Link
                key={item.url}
                id={`search-hit-${index}`}
                href={item.url}
                role="option"
                aria-selected={index === active}
                className="search-hit"
                onMouseEnter={() => setActive(index)}
                onClick={() => setOpen(false)}
              >
                <span className="t">
                  <Highlight text={item.title} query={needle} />
                </span>
                <span className="d">
                  <Highlight
                    text={item.summary.toLowerCase().includes(needle.toLowerCase()) ? item.summary : excerpt(item, needle)}
                    query={needle}
                  />
                </span>
                <span className="m">
                  <span className={item.type === 'work' ? 'badge badge-new' : 'badge'}>{TYPE_LABEL[item.type]}</span>
                  <span className="num">{item.meta}</span>
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </Link>
            ))
          ) : (
            <div className="search-empty">
              <Icon name="hills" size="md" />
              <p>
                没有匹配「{needle}」的内容。
                <br />
                换个词试试，或者去 <Link href="/archive">归档页</Link> 翻翻。
              </p>
            </div>
          )}
        </div>

        <div className="search-foot">
          <span className="search-keys flex-center gap-4">
            <span className="flex-center gap-2">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> 选择
            </span>
            <span className="flex-center gap-2">
              <span className="kbd">Enter</span> 打开
            </span>
            <span className="flex-center gap-2">
              <span className="kbd">Esc</span> 关闭
            </span>
          </span>
          <span className="meta">{items ? `已索引 ${items.length} 条` : '索引加载中…'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        className="nav-search"
        type="button"
        aria-label="搜索站内内容"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => setOpen(true)}
      >
        <Icon name="search" size="xs" />
      </button>

      {/* 面板用 portal 挂到 body：顶栏有 backdrop-filter，会给 position:fixed 重新建立包含块 */}
      {mounted && open ? createPortal(panel, document.body) : null}
    </>
  );
}
