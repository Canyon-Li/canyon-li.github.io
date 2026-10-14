/**
 * 截图脚本（CDP 驱动）：CHROME=/path/to/chrome node scripts/shot.mjs
 *
 * 为什么不用 `chrome --screenshot`：页面上的 .reveal 元素初始 opacity 为 0，
 * 靠 IntersectionObserver 加 .in 才淡入（700ms）。原生截图在 load 瞬间就拍，
 * 拿到的是一张几乎全白的图。这里通过 CDP 显式把 .reveal 全部点亮，再等过渡结束。
 *
 * 前置：npm run build && npm run preview
 * 用法：
 *   CHROME=/path/to/chrome node scripts/shot.mjs
 *   BASE=http://127.0.0.1:4173 OUT=.preview node scripts/shot.mjs
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { launch, newTab, goto, evaluate, sleep } from './cdp.mjs';

const CHROME = process.env.CHROME;
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const OUT = resolve(process.env.OUT ?? '.preview');
const PORT = Number(process.env.CDP_PORT ?? 9333);

const shots = [
  { name: '01-home', path: '/', width: 1280 },
  { name: '02-works', path: '/works/', width: 1280 },
  { name: '03-work-duji', path: '/works/duji/', width: 1280 },
  { name: '04-post', path: '/posts/local-first/', width: 1280 },
  { name: '05-about', path: '/about/', width: 1280 },
  { name: '06-archive', path: '/archive/', width: 1280 },
  { name: '07-now', path: '/now/', width: 1280 },
  { name: '08-mobile-home', path: '/', width: 420 },
  { name: '09-mobile-works', path: '/works/', width: 420 },
  { name: '10-404', path: '/nope/', width: 1280 },
  {
    // 搜索面板是 portal 挂到 body 的浮层，只拍视口，不然 captureBeyondViewport 会拍出长条
    name: '11-search',
    path: '/',
    width: 1280,
    viewportOnly: true,
    prepare: "document.querySelector('.nav-search').click()",
    type: '本地优先',
    // 面板打开后才会去取 /search-index.json，留足加载与渲染时间
    settle: 2600,
  },
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await launch({ chrome: CHROME, port: PORT });

try {
  for (const shot of shots) {
    const tab = await newTab(browser.port, { width: shot.width, mobile: shot.width < 600 });

    try {
      await goto(tab.cdp, BASE + shot.path);

      // 点亮所有入场元素，再等过渡跑完（700ms + 余量）
      await evaluate(
        tab.cdp,
        "document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'))",
      );
      await sleep(1400);

      // 需要交互才能看到的状态（比如搜索面板）
      if (shot.prepare) {
        await evaluate(tab.cdp, shot.prepare);
        await sleep(300);
      }
      if (shot.type) {
        // React 受控输入：直接改 .value 不会触发 onChange，得走原生 setter 再补一个 input 事件
        await evaluate(
          tab.cdp,
          `(() => {
            const input = document.querySelector('.search-head input');
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(input, ${JSON.stringify(shot.type)});
            input.dispatchEvent(new Event('input', { bubbles: true }));
          })()`,
        );
        await sleep(shot.settle ?? 600);
      }

      const { data } = await tab.cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: !shot.viewportOnly,
      });
      await writeFile(join(OUT, `${shot.name}.png`), Buffer.from(data, 'base64'));

      console.log(`✓ ${shot.name}.png  ${shot.width}px  ${shot.path}`);
    } finally {
      await tab.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`\n截图已写入 ${OUT}`);
