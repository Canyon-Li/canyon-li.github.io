/**
 * 装饰图形精灵：全站一次性内联，页面各处用 <Icon name="..." /> 引用。
 * 为什么不放外部 svg 文件：跨文件 <use> 在 file:// 与部分部署环境下会被拦截（设计规范 08 节）。
 */
export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <symbol id="o-sun" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <circle cx="24" cy="24" r="8" />
        <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2" />
      </symbol>
      <symbol id="o-arch" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 44V24a16 16 0 0 1 32 0v20" />
        <path d="M17 44V27a7 7 0 0 1 14 0v17" />
        <path d="M4 44h40" />
      </symbol>
      <symbol id="o-hills" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 34l11-15 8 10 9-13 12 18" />
        <path d="M4 40h40" />
      </symbol>
      <symbol id="o-branch" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M24 44V12" />
        <path d="M24 34c7-2 10-7 10-14-7 1-10 6-10 14z" />
        <path d="M24 26c-6-2-9-6-9-12 6 1 9 5 9 12z" />
      </symbol>
      <symbol id="o-wave" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M2 24q5.5-9 11 0t11 0 11 0 11 0" />
      </symbol>
      <symbol id="o-rings" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="24" cy="24" r="6" />
        <circle cx="24" cy="24" r="12" />
        <circle cx="24" cy="24" r="18" />
      </symbol>
      <symbol id="o-star" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18" />
      </symbol>
      <symbol id="o-dots" viewBox="0 0 48 48" fill="currentColor">
        <circle cx="8" cy="8" r="2" /><circle cx="24" cy="8" r="2" /><circle cx="40" cy="8" r="2" />
        <circle cx="8" cy="24" r="2" /><circle cx="24" cy="24" r="2" /><circle cx="40" cy="24" r="2" />
        <circle cx="8" cy="40" r="2" /><circle cx="24" cy="40" r="2" /><circle cx="40" cy="40" r="2" />
      </symbol>
      <symbol id="o-sprout" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M24 44V22" />
        <path d="M24 30c-6 0-10-4-10-12 8 0 10 4 10 12z" />
        <path d="M24 30c6 0 10-4 10-12-8 0-10 4-10 12z" />
        <path d="M6 44h36" />
      </symbol>
      <symbol id="o-diamond" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M24 6l18 18-18 18L6 24z" />
        <path d="M24 17l7 7-7 7-7-7z" />
      </symbol>
      <symbol id="o-arrow" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 40C6 22 18 10 38 12" />
        <path d="M31 6l7 6-6 8" />
      </symbol>
      <symbol id="o-moon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M31 7a18 18 0 1 0 0 34 14 14 0 0 1 0-34z" />
      </symbol>
      <symbol id="o-sign" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 44C18 16 32 8 34 20c2 14-10 26-18 20-8-6 4-18 18-20 12-2 18 10 26 14 10 5 16-8 26-12 8-3 12 6 20 8 10 2 18-10 30-8 10 2 14 12 24 10 10-2 16-12 28-10" />
      </symbol>
      <symbol id="o-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M6.5 10.4l2.4 2.4 4.6-5" />
      </symbol>
      <symbol id="o-info" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 9v5M10 6.4v.2" />
      </symbol>
      <symbol id="o-spark" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v16M3 10h14M5 5l10 10M15 5L5 15" />
      </symbol>
      <symbol id="o-search" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5L18 18" />
      </symbol>
      <symbol id="o-up" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 16V4M4.5 9.5L10 4l5.5 5.5" />
      </symbol>
      <symbol id="o-arrow-r" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 6h17M13 1l5 5-5 5" />
      </symbol>
    </svg>
  );
}
