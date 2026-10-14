'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';

/**
 * 订阅区块。静态站没有后端，所以这里只做「前端校验 + 明确提示」，
 * 不假装提交成功——把 action 换成你自己的订阅接口即可。
 */
export function Subscribe({ title = '有新项目或新文章时，给你一封信' }: { title?: string }) {
  const [note, setNote] = useState('');

  return (
    <div className="subscribe reveal">
      <Icon name="rings" size="xl" className="orn-abs" style={{ right: -24, bottom: -30, opacity: 0.28 }} />
      <Icon name="sprout" size="md" tone="sage" className="orn-abs" style={{ right: 132, top: 26, opacity: 0.5 }} />

      <div className="subscribe-inner">
        <span className="eyebrow">
          <span className="dot" />
          订阅
        </span>
        <h2 className="h2 mt-2">{title}</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setNote('订阅还没开放。想第一时间知道更新，直接写信给我更快。');
          }}
        >
          <input className="input" type="email" name="email" placeholder="you@example.com" aria-label="邮箱地址" required />
          <button className="btn btn-solid" type="submit">
            订阅
            <Icon name="arrow-r" size="xs" className="arw" style={{ width: 16, height: 10 }} />
          </button>
        </form>

        <p className="form-note" role="status">
          {note}
        </p>
      </div>
    </div>
  );
}
