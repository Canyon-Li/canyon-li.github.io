/**
 * 非文字对比度实测（WCAG 1.4.11 非文字对比，AA）
 *   CHROME=/path/to/chrome node scripts/nontext-contrast.mjs
 * 前置：npm run build && npm run preview
 *
 * 为什么单独有这一个脚本：
 *   DESIGN.md 10 节曾把「非文字对比度未达标」列为待定夺项，但那条待办一直卡着，
 *   原因是**没人真的枚举过哪些边界需要 3:1**。axe-core 根本不检查 1.4.11
 *   （1.4.11 需要判断「这个像素是不是传达信息所必需的」，机器判不了），
 *   contrast.mjs 只算令牌两两之间的比值，不知道谁挨着谁。
 *   于是那个「约 1.5:1 / 约 2.9:1」是估的，也就没法据以决策。
 *
 * 这个脚本做三件事：
 *   1. 打开真实页面，把每个候选边界的**实际渲染色**读出来
 *      —— 边框常是 rgba 半透明，压在自身背景上，不是令牌里那个值；
 *   2. 沿祖先链逐层合成，算出边界**两侧**的实色底
 *      —— 输入框在 .subscribe 里，外侧是 --bg-alt 而不是 --bg；
 *   3. 取两侧中更差的那个对 3:1，并按 1.4.11 的例外条款逐条给结论。
 *
 * 2026-09-29：DESIGN.md 10 节的结论已定，方案 A 已落地（拆 --hair-field /
 *   --wood-strong 两个令牌）。所以「必须达标」4 项现在**全部达标**，
 *   本脚本也随之从「报告工具」升级成**闸门** —— 和 contrast.mjs / a11y.mjs 一样，
 *   有「必须达标」项不过就退出 1，防止以后改令牌时静默回退。
 *   「需定夺」6 项不影响退出码：那是还没做的取舍，不是缺陷。
 *
 * 用法：
 *   node scripts/nontext-contrast.mjs            # 全站实测；必须达标项不过就退出 1
 *   node scripts/nontext-contrast.mjs --report   # 只报告，永远退出 0
 *   node scripts/nontext-contrast.mjs --verbose  # 连「例外」项也逐条列出
 *   node scripts/nontext-contrast.mjs --simulate # 注入候选令牌，验证方案 / 查漂移
 */
import { launch, newTab, goto, evaluate, sleep } from './cdp.mjs';

const CHROME = process.env.CHROME;
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const PORT = Number(process.env.CDP_PORT ?? 9335);

const GATE = !process.argv.includes('--report');
const VERBOSE = process.argv.includes('--verbose');
const SIMULATE = process.argv.includes('--simulate');

/** 1.4.11 的门槛。与 1.4.3 的正文 4.5:1 是两回事，别混用。 */
const AA_NONTEXT = 3;

/**
 * 候选边界清单。
 *
 * duty 取值 —— 这是本脚本的立场，不是机器的判断，所以每条都写了依据：
 *   must  必须达标：这个边界/状态是唯一的视觉线索，没有别的线索可替代
 *   judge 需定夺：能不能算「必需线索」本身有争议，属于设计取舍
 *   except 例外：命中 1.4.11 的例外条款（纯装饰，或与其他线索重复）
 *
 * kind 取值：
 *   border  读描边色，压在自身背景上，再与两侧比
 *   fill    读元素自身填充色（或伪元素），作为「状态/图形」与外侧比
 *   outline 焦点环，画在元素外侧 3px，只与外侧比
 */
const CHECKS = [
  /* ---- 必须达标 ---- */
  {
    id: 'input-border',
    label: '输入框 / 文本域 / 下拉 · 描边',
    selector: '.input, .textarea, .select',
    kind: 'border',
    duty: 'must',
    basis: '控件自身是纯白 --surface，坐在暖白底上；边框是唯一定义其边界的线索',
  },
  {
    id: 'check-border',
    label: '勾选框 · 未选中描边',
    selector: '.check input:not(:checked)',
    kind: 'border',
    duty: 'must',
    basis: '18×18 方框是唯一能看出「这里有个勾选框」的线索',
  },
  {
    id: 'check-fill',
    label: '勾选框 · 选中填充',
    selector: '.check input:checked',
    kind: 'fill',
    duty: 'must',
    basis: '填充色是「已选中」这个状态的线索；框内白色对勾同色域，同一条数据',
  },
  {
    id: 'focus-ring',
    label: '焦点环（真实 Tab 触发）',
    selector: null,
    kind: 'outline',
    duty: 'must',
    basis: 'WCAG 1.4.11 明文把「焦点指示器」算作必须 3:1 的界面状态',
  },

  /* ---- 需定夺 ---- */
  {
    id: 'btn-border',
    label: '按钮 · 描边（描边式按钮）',
    selector: '.btn:not(.btn-solid):not(.btn-wood):not(.btn-sage):not(.btn-ghost)',
    kind: 'border',
    duty: 'judge',
    basis: '按钮由文字标签识别；描边算不算「必需线索」有争议，取决于是否承认胶囊轮廓也是线索',
  },
  {
    id: 'btn-solid-fill',
    label: '按钮 · 实心填充（.btn-solid）',
    selector: '.btn-solid',
    kind: 'fill',
    duty: 'judge',
    basis: '实心填充既是识别线索也是可点范围；文字对比度是另一条（1.4.3）',
  },
  {
    id: 'btn-wood-fill',
    label: '按钮 · 木色填充（.btn-wood）',
    selector: '.btn-wood',
    kind: 'fill',
    duty: 'judge',
    basis: '同上；木色填充对暖白底天然偏低，是「温度」与「达标」的正面冲突',
  },
  {
    id: 'chip-border',
    label: '筛选标签 · 描边（.chip）',
    selector: '.chip:not([aria-pressed="true"])',
    kind: 'border',
    duty: 'judge',
    basis: '有文字标签，但胶囊轮廓是「这是一个可点的筛选器」的主要线索',
  },
  {
    id: 'chip-pressed',
    label: '筛选标签 · 选中填充',
    selector: '.chip[aria-pressed="true"]',
    kind: 'fill',
    duty: 'judge',
    basis: '选中态靠填充色区分；aria-pressed 对屏幕阅读器有效，对视力用户无效',
  },
  {
    id: 'btngroup-border',
    label: '视图切换组 · 外框（.btn-group）',
    selector: '.btn-group',
    kind: 'border',
    duty: 'judge',
    basis: '组内分段按钮各有文字；外框主要起分组作用',
  },
  {
    id: 'pager-current',
    label: '分页 · 当前页填充（.pager .current）',
    selector: '.pager .current',
    kind: 'fill',
    duty: 'judge',
    basis: '填充是「当前页」的视觉线索，但该组件当前未在任何页面使用',
  },
  {
    id: 'switch-track',
    label: '开关 · 轨道（.switch input）',
    selector: '.switch input:not(:checked)',
    kind: 'fill',
    duty: 'judge',
    basis: '轨道即控件边界；该组件当前未在任何页面使用',
  },
  {
    id: 'switch-on',
    label: '开关 · 打开态（.switch input:checked）',
    selector: '.switch input:checked',
    kind: 'fill',
    duty: 'judge',
    basis: '打开态靠轨道色区分；该组件当前未在任何页面使用',
  },
  {
    id: 'progress-fill',
    label: '进度条 · 填充（.progress i）',
    selector: '.progress i',
    kind: 'fill',
    duty: 'judge',
    basis: '填充长度即信息；该组件当前未在任何页面使用',
  },
  {
    id: 'nav-toggle',
    label: '移动端菜单按钮 · 描边（.nav-toggle）',
    selector: '.nav-toggle',
    kind: 'border',
    duty: 'judge',
    basis: '44×44 按钮内的三条横线才是识别线索，描边属于重复',
  },

  /* ---- 例外 ---- */
  {
    id: 'card-border',
    label: '卡片轮廓（.card / .tile / .card-profile）',
    selector: '.card, .tile, .card-profile',
    kind: 'border',
    duty: 'except',
    basis: '1.4.11 例外①「纯装饰」②「与其他线索重复」——卡片由标题文字识别，轮廓不承载信息',
  },
  {
    id: 'callout-line',
    label: '虚线提示块（.callout-line）',
    selector: '.callout-line',
    kind: 'border',
    duty: 'except',
    basis: '例外①：纯装饰边框，块内文字已完整表达内容',
  },
  {
    id: 'kbd-border',
    label: '键盘按键（.kbd）',
    selector: '.kbd',
    kind: 'border',
    duty: 'except',
    basis: '例外②：键帽轮廓与键名字符重复，字符本身已表达含义',
  },
  {
    id: 'to-top-border',
    label: '回到顶部按钮 · 描边（.to-top）',
    selector: '.to-top',
    kind: 'border',
    duty: 'except',
    basis: '例外②：按钮内的箭头图标才是识别线索，描边重复',
  },
  {
    id: 'avatar-border',
    label: '头像轮廓（.avatar）',
    selector: '.avatar',
    kind: 'border',
    duty: 'except',
    basis: '例外①：纯装饰性描边，头像图片自身已定义边界',
  },
  {
    id: 'badge-dot',
    label: '状态点（.badge-live::before）',
    selector: '.badge-live',
    kind: 'fill',
    pseudo: '::before',
    duty: 'except',
    basis: '例外②：圆点与旁边的「LIVE」文字重复，删掉圆点信息不丢',
  },
  {
    id: 'listcheck-dot',
    label: '列表圆点（.list-check li::before）',
    selector: '.list-check li',
    kind: 'fill',
    pseudo: '::before',
    duty: 'except',
    basis: '例外①：纯装饰的项目符号，列表结构由 <li> 语义承载',
  },
  {
    id: 'section-rule',
    label: '分节线（.section border-bottom）',
    selector: '.section',
    kind: 'border',
    duty: 'except',
    basis: '例外①：分隔线，属于「排版留白的替代物」，不承载信息',
  },
  {
    id: 'post-rule',
    label: '文章列表分隔线（.posts li）',
    selector: '.posts li',
    kind: 'border',
    duty: 'except',
    basis: '例外①：分隔线，条目本身靠标题区分',
  },
  {
    id: 'quote-bar',
    label: '引用竖条（.quote border-left）',
    selector: '.quote',
    kind: 'border',
    duty: 'except',
    basis: '例外①：装饰性竖条，引用语义由 <blockquote> 承载',
  },
  {
    id: 'stat-divider',
    label: '数据分隔线（.stat border-left）',
    selector: '.stat',
    kind: 'border',
    duty: 'except',
    basis: '例外①：分隔线，数字与标签各自已表达内容',
  },
  {
    id: 'toc-rail',
    label: '目录导轨（.toc border-left）',
    selector: '.toc',
    kind: 'border',
    duty: 'except',
    basis: '例外①：装饰性导轨，目录项文字已表达层级',
  },
  {
    id: 'table-head',
    label: '表头下边线（.table th）',
    selector: '.table th',
    kind: 'border',
    duty: 'except',
    basis: '例外②：表头靠加粗与位置区分，边线重复；该组件当前未使用',
  },
];

/**
 * --simulate 时注入的候选覆盖。**只作用于这一次测量**，不写进任何源文件。
 *
 * 下面这组值**已经在 2026-09-29 落地**到 tokens.css 与两份样式文件里了
 * （DESIGN.md 10 节的方案 A）。所以现在 --simulate 的预期结果是
 * **和默认运行逐字相同** —— 一旦两者出现差异，说明令牌或消费规则漂移了，
 * 这就是它的回归检查作用。同时它也是下一次改动的沙箱：
 * 想验证「连 6 项需定夺的一起修」，改这个块里的值再跑 --simulate 就行，
 * 不用碰源文件。
 *
 * 取值来源：先算，再量。α 由「压到 #F5F0E8 上恰好 3:1」反解得到
 *   （.24 → 复合 #CECDCC 1.4:1；.57 → 复合 #8B8987 3.07:1）；
 *   木色 #A87A46 是能过 #F5F0E8 与 #FBF8F3 两块底的最浅值。
 */
const CANDIDATES = `
:root{
  --hair-field: rgba(51,48,44,.57);
  --wood-strong: #A87A46;
}
.input,.textarea,.select{border-color:var(--hair-field);}
.input:focus,.textarea:focus,.select:focus{border-color:var(--wood-strong);}
.check input{border-color:var(--hair-field);}
.check input:checked{background:var(--wood-strong);border-color:var(--wood-strong);}
.switch input{background:var(--hair-field);}
:focus-visible{outline-color:var(--wood-strong);}
`;

/* ---------- 注入页面的测量代码 ---------- */
const MEASURE = String.raw`
(function () {
  const checks = window.__NT_CHECKS;

  const parse = (str) => {
    if (!str || str === 'transparent' || str === 'none') return null;
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(str);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };

  const over = (fg, bg) => {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  };

  const CANVAS = { r: 255, g: 255, b: 255, a: 1 };

  const hex = (c) =>
    '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };

  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  /**
   * 元素「外侧」的实色底：从父级往上走，把沿途所有非全透明的
   * background-color 自外向内压到画布白上。半透明的发丝线、遮罩、
   * 浅底都靠这一步还原成真实像素值 —— 直接读令牌会算错。
   */
  const backdropOf = (el) => {
    const chain = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) chain.push(c);
      if (n === document.documentElement) break;
    }
    let out = CANVAS;
    for (let i = chain.length - 1; i >= 0; i--) out = over(chain[i], out);
    return out;
  };

  /** 元素「里侧」的实色底：自身 background-color 压在 backrop 上 */
  const fillOf = (el, backdrop) => {
    const own = parse(getComputedStyle(el).backgroundColor);
    return own && own.a > 0 ? over(own, backdrop) : backdrop;
  };

  /** 取第一条有宽度的边 —— .section 只有下边线、.quote 只有左边线 */
  const firstSide = (cs) => {
    for (const side of ['Top', 'Bottom', 'Left', 'Right']) {
      const w = parseFloat(cs['border' + side + 'Width']);
      if (w > 0) {
        const c = parse(cs['border' + side + 'Color']);
        if (c && c.a > 0) return { width: w, color: c, side };
      }
    }
    return null;
  };

  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
    return tag + cls;
  };

  const results = [];

  for (const check of checks) {
    if (!check.selector) continue;
    const nodes = [...document.querySelectorAll(check.selector)];
    if (!nodes.length) continue;

    const seen = new Set();

    nodes.forEach((el) => {
      // display:none 的元素 getComputedStyle 照样返回值 —— 不挡住的话
      // 移动端的 .nav-toggle 会在 1280px 下被「量」出来，凭空多出几十处假数据。
      // getClientRects() 为空 = 整条祖先链上没有任何一个盒子被渲染。
      if (!el.getClientRects().length) return;

      const cs = getComputedStyle(el);
      const backdrop = backdropOf(el);
      const fill = fillOf(el, backdrop);

      let fg = null;
      let inside = fill;
      let outside = backdrop;
      let note = '';

      if (check.kind === 'border') {
        const side = firstSide(cs);
        if (!side) return;
        // 边框压在自身背景之上（background-clip 默认 border-box）
        fg = over(side.color, fill);
        note = side.side.toLowerCase() + ' ' + side.width + 'px';
      } else if (check.kind === 'fill') {
        if (check.pseudo) {
          const raw = parse(getComputedStyle(el, check.pseudo).backgroundColor);
          if (!raw || raw.a === 0) return;
          fg = over(raw, fill);
          // 伪元素本身就是那个「图形」，跟外侧底比
          inside = backdrop;
        } else {
          fg = fill;
          inside = backdrop;
        }
      } else if (check.kind === 'outline') {
        const raw = parse(cs.outlineColor);
        if (!raw || raw.a === 0) return;
        // outline-offset:3px，焦点环落在元素外侧，与自身背景无关
        fg = over(raw, backdrop);
        inside = backdrop;
        note = cs.outlineWidth + ' ' + cs.outlineStyle;
      }

      if (!fg) return;

      const rInside = ratio(fg, inside);
      const rOutside = ratio(fg, outside);
      const worst = Math.min(rInside, rOutside);

      // 同一页里同色同底的重复元素只留一条，页面之间再由 Node 汇总
      const signature = [hex(fg), hex(inside), hex(outside)].join('|');
      if (seen.has(signature)) return;
      seen.add(signature);

      results.push({
        check: check.id,
        fg: hex(fg),
        inside: hex(inside),
        outside: hex(outside),
        insideRatio: +rInside.toFixed(2),
        outsideRatio: +rOutside.toFixed(2),
        ratio: +worst.toFixed(2),
        note,
        sample: describe(el),
      });
    });
  }

  return JSON.stringify(results);
})()
`;

/* ---------- 页面清单：与 verify / a11y 一致，从 sitemap 读 ---------- */

const sitemapXml = await fetch(`${BASE}/sitemap.xml`).then((response) => response.text());
const paths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
  try {
    return new URL(match[1].trim()).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return match[1].trim();
  }
});

/**
 * 待测目标。和 a11y.mjs 一样，除了 sitemap 里的全部页面，再补两个
 * 「只有交互后才存在」的状态 —— 少了它们会漏掉整块覆盖：
 *   · 搜索面板：面板里的 .input 与 .kbd 只在这里出现
 *   · 420px 抽屉：.nav-toggle 只在窄屏渲染（1280px 下是 display:none）
 */
const targets = [
  ...paths.map((path) => ({ label: path, path, width: 1280 })),
  {
    label: '/ · 搜索面板打开',
    path: '/',
    width: 1280,
    prepare: "document.querySelector('.nav-search').click()",
    settle: 2600,
  },
  {
    label: '/ · 420px 抽屉打开',
    path: '/',
    width: 420,
    mobile: true,
    prepare: "document.querySelector('.nav-toggle').click()",
    settle: 900,
  },
];

/** 焦点环要单独一轮：只有真实键盘 Tab 才能让 :focus-visible 命中 */
const FOCUS_CHECKS = CHECKS.filter((check) => check.kind === 'outline');
const PAGE_CHECKS = CHECKS.filter((check) => check.selector);

/**
 * 一个页面测两遍：默认状态一遍，把所有勾选框翻转一遍再测。
 * 订阅区的勾选框是 defaultChecked，站点上永远看不到未选中态 ——
 * 但用户一点就能把它取消，那条描边是真实存在的边界，必须量到。
 */
const TOGGLE = `document.querySelectorAll('.check input').forEach((n) => { n.checked = !n.checked; })`;

const browser = await launch({ chrome: CHROME, port: PORT });

/** key → { check, fg, inside, outside, ratio, note, pages:Set, count } */
const found = new Map();
const absent = new Set(PAGE_CHECKS.map((check) => check.id));

const record = (check, page, item) => {
  const key = [check.id, item.fg, item.inside, item.outside].join('|');
  if (!found.has(key)) {
    found.set(key, {
      check,
      fg: item.fg,
      inside: item.inside,
      outside: item.outside,
      insideRatio: item.insideRatio,
      outsideRatio: item.outsideRatio,
      ratio: item.ratio,
      note: item.note,
      sample: item.sample,
      pages: new Set(),
      count: 0,
    });
  }
  const entry = found.get(key);
  entry.count++;
  entry.pages.add(page);
  absent.delete(check.id);
};

try {
  for (const target of targets) {
    const tab = await newTab(browser.port, {
      width: target.width,
      mobile: Boolean(target.mobile),
    });

    try {
      await goto(tab.cdp, BASE + target.path);

      // 入场元素初始 opacity:0，不点亮就量不到（和 a11y.mjs 同一个坑）
      await evaluate(
        tab.cdp,
        "document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'))",
      );
      await sleep(900);

      if (target.prepare) {
        await evaluate(tab.cdp, target.prepare);
        await sleep(target.settle ?? 600);
      }

      // --simulate：把候选覆盖挂到 head 末尾（排在 Next 自己的样式之后），
      // 只改这一次测量的渲染结果，磁盘上的文件一个字节都不动。
      if (SIMULATE) {
        await evaluate(
          tab.cdp,
          `(() => {
            const s = document.createElement('style');
            s.textContent = ${JSON.stringify(CANDIDATES)};
            document.head.appendChild(s);
            return true;
          })()`,
        );
        await sleep(260);
      }

      await evaluate(tab.cdp, `window.__NT_CHECKS = ${JSON.stringify(PAGE_CHECKS)}`);

      // 第一遍：页面默认状态
      let items = JSON.parse(await evaluate(tab.cdp, MEASURE));

      // 第二遍：翻转所有勾选框，把「未选中」那条描边也量出来
      await evaluate(tab.cdp, TOGGLE);
      await sleep(320);
      items = items.concat(JSON.parse(await evaluate(tab.cdp, MEASURE)));

      for (const item of items) {
        const check = CHECKS.find((c) => c.id === item.check);
        record(check, target.label, item);
      }

      /* --- 焦点环：真的按 Tab 走，让 :focus-visible 命中 --- */
      const outline = await measureFocusRing(tab.cdp, FOCUS_CHECKS[0]);
      if (outline) record(FOCUS_CHECKS[0], target.label, outline);

      console.log(`· ${target.label.padEnd(30)} ${target.width}px  ${items.length} 条边界`);
    } finally {
      await tab.close();
    }
  }
} finally {
  await browser.close();
}

/**
 * 逐个 Tab，收集焦点环的实测色。
 * 不能靠 el.focus()：脚本触发的聚焦在 Chrome 里不一定命中 :focus-visible，
 * 那样量到的 outlineColor 是 currentColor 而不是令牌值。
 */
async function measureFocusRing(cdp, check) {
  const seen = new Set();
  let first = null;

  for (let i = 0; i < 14; i++) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await sleep(60);

    const item = await evaluate(
      cdp,
      `(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0) return null;
        return JSON.stringify({
          fg: cs.outlineColor,
          width: cs.outlineWidth,
          style: cs.outlineStyle,
          sample: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\\s+/)[0] : ''),
        });
      })()`,
    );
    if (!item) continue;

    const parsed = JSON.parse(item);
    if (seen.has(parsed.fg)) continue;
    seen.add(parsed.fg);

    // 焦点环落在外侧，用页面求值复用同一套合成逻辑
    const measured = JSON.parse(
      await evaluate(
        cdp,
        `(() => {
          const el = document.activeElement;
          const parse = (str) => {
            const m = /rgba?\\(\\s*([\\d.]+)[,\\s]+([\\d.]+)[,\\s]+([\\d.]+)(?:[,\\s/]+([\\d.]+))?\\s*\\)/.exec(str || '');
            if (!m) return null;
            return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
          };
          const over = (fg, bg) => {
            const a = fg.a + bg.a * (1 - fg.a);
            return {
              r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
              g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
              b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
              a,
            };
          };
          const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
          const lum = (c) => {
            const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
            return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
          };
          const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

          const chain = [];
          for (let n = el.parentElement; n; n = n.parentElement) {
            const c = parse(getComputedStyle(n).backgroundColor);
            if (c && c.a > 0) chain.push(c);
            if (n === document.documentElement) break;
          }
          let backdrop = { r: 255, g: 255, b: 255, a: 1 };
          for (let i = chain.length - 1; i >= 0; i--) backdrop = over(chain[i], backdrop);

          const raw = parse(getComputedStyle(el).outlineColor);
          if (!raw) return null;
          const fg = over(raw, backdrop);
          return JSON.stringify({
            fg: hex(fg),
            inside: hex(backdrop),
            outside: hex(backdrop),
            insideRatio: +ratio(fg, backdrop).toFixed(2),
            outsideRatio: +ratio(fg, backdrop).toFixed(2),
            ratio: +ratio(fg, backdrop).toFixed(2),
            note: getComputedStyle(el).outlineWidth + ' ' + getComputedStyle(el).outlineStyle,
            sample: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\\s+/)[0] : ''),
          });
        })()`,
      ),
    );
    if (!first) first = measured;
  }

  return first;
}

/* ---------- 汇总 ---------- */

const DUTY_LABEL = { must: '必须达标', judge: '需定夺', except: '例外' };
const ORDER = { must: 0, judge: 1, except: 2 };

const rows = [...found.values()].sort((a, b) => {
  const duty = ORDER[a.check.duty] - ORDER[b.check.duty];
  return duty !== 0 ? duty : a.ratio - b.ratio;
});

console.log(
  `\n实测 ${targets.length} 个目标（${paths.length} 个页面 + 搜索面板 + 420px 抽屉）` +
    ` · 门槛 3:1（WCAG 1.4.11 非文字对比，AA）` +
    (SIMULATE ? '\n模式：--simulate（已注入候选令牌，仅本次测量生效，源文件未改动）' : '') +
    '\n',
);

const bar = (value) => (value >= AA_NONTEXT ? '✓' : value >= 2 ? '·' : '✗');

let mustFail = 0;
let judgeFail = 0;
let currentDuty = null;

for (const row of rows) {
  const { check } = row;
  if (check.duty !== currentDuty) {
    currentDuty = check.duty;
    console.log(`\n【${DUTY_LABEL[check.duty]}】`);
  }

  const pass = row.ratio >= AA_NONTEXT;
  if (!pass && check.duty === 'must') mustFail++;
  if (!pass && check.duty === 'judge') judgeFail++;
  if (check.duty === 'except' && !VERBOSE) {
    // 例外项只在 --verbose 下展开，但仍在清单里留一行「已按例外处理」
    continue;
  }

  console.log(
    `  ${bar(row.ratio)} ${String(row.ratio).padStart(5)}:1  ${check.label}`,
  );
  console.log(
    `          ${row.fg} 在 ${row.inside} 上（里 ${row.insideRatio}） / ${row.outside} 旁（外 ${row.outsideRatio}）` +
      `${row.note ? '   ' + row.note : ''}   ${row.count} 处 · ${[...row.pages].slice(0, 3).join(' ')}${row.pages.size > 3 ? ' …' : ''}`,
  );
  console.log(`          依据：${check.basis}`);
}

/* 没在任何页面找到的候选：这本身是有用的结论 */
if (absent.size) {
  console.log('\n【本次未在任何页面出现（该组件未被使用）】');
  for (const id of absent) {
    const check = CHECKS.find((c) => c.id === id);
    console.log(`  · ${check.label}`);
  }
}

const exceptCount = rows.filter((row) => row.check.duty === 'except').length;
console.log(
  `\n汇总：必须达标 ${rows.filter((r) => r.check.duty === 'must').length} 项（${mustFail} 项未过）· ` +
    `需定夺 ${rows.filter((r) => r.check.duty === 'judge').length} 项（${judgeFail} 项未过）· ` +
    `例外 ${exceptCount} 项（默认折叠，--verbose 展开）`,
);

console.log(
  '\n注：「必须达标」项已按 DESIGN.md 10 节方案 A 全部达标（2026-09-29 落地）。\n' +
    '    「需定夺」6 项是尚未做的取舍，不影响退出码 —— 只有「必须达标」项回退才会失败。',
);

if (GATE && mustFail) {
  console.log(`\n✗ ${mustFail} 项「必须达标」的边界没过 3:1 —— 这是回退，需要修`);
  process.exit(1);
}
console.log('\n✓ 没有「必须达标」的边界回退');
process.exit(0);
