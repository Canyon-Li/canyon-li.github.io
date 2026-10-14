/**
 * 无障碍审计：CHROME=/path/to/chrome node scripts/a11y.mjs
 * 前置：npm run build && npm run preview
 *
 * DESIGN.md 03/10 节声明了 WCAG 2.1 AA 达标，但那份对比度表是手算的。
 * 这个脚本用 axe-core 把声明实测一遍：遍历 sitemap 里的全部页面，
 * 再额外覆盖两个「只有交互后才存在」的状态（搜索面板、移动端抽屉）。
 *
 * 分两类报告：
 *   - WCAG 违规 → 计入失败，退出码 1
 *   - best-practice → 只提示。axe 的 best-practice 规则比 AA 严（比如要求
 *     所有内容都在 landmark 里），不一定都要满足，逐条判断。
 *
 * 注意：必须先点亮 .reveal（初始 opacity:0），否则 axe 认为这些元素不可见，
 * 会直接跳过它们的对比度检查——审计会假通过。
 */
import { readFile } from 'node:fs/promises';
import { launch, newTab, goto, evaluate, sleep } from './cdp.mjs';

const CHROME = process.env.CHROME;
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const PORT = Number(process.env.CDP_PORT ?? 9334);

/**
 * 可选：给每个待审页面追加一段查询串。
 * 用来审「某个开关打开时」的整站变体，例如 QUERY='?theme=a' 审线条风预览。
 * 页面清单仍然来自 sitemap，所以覆盖范围不变。
 */
const QUERY = process.env.QUERY ?? '';

const axeSource = await readFile(
  new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
  'utf8',
);

/** 页面清单同样从 sitemap 读，新增内容自动纳入 */
const sitemapXml = await fetch(`${BASE}/sitemap.xml`).then((response) => response.text());
const paths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
  try {
    return new URL(match[1].trim()).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return match[1].trim();
  }
});

const targets = [
  ...paths.map((path) => ({ label: path + QUERY, path, width: 1280 })),
  {
    label: `/ · 搜索面板打开${QUERY}`,
    path: '/',
    width: 1280,
    prepare: "document.querySelector('.nav-search').click()",
    settle: 2600,
  },
  {
    label: `/ · 420px 抽屉打开${QUERY}`,
    path: '/',
    width: 420,
    mobile: true,
    prepare: "document.querySelector('.nav-toggle').click()",
    settle: 900,
  },
];

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

const RUN_AXE = `axe.run(document, {
  runOnly: { type: 'tag', values: ${JSON.stringify(AXE_TAGS)} },
  resultTypes: ['violations'],
}).then((r) => JSON.stringify(r.violations.map((v) => ({
  id: v.id,
  impact: v.impact,
  help: v.help,
  tags: v.tags,
  nodes: v.nodes.map((n) => {
    const check = (n.any || []).find((c) => c.data) || {};
    const d = check.data || {};
    return {
      target: n.target.join(' '),
      summary: n.failureSummary || '',
      // color-contrast 的实测值：用来把成百上千处收敛到几个根因
      detail: d.contrastRatio
        ? {
            ratio: d.contrastRatio,
            fg: d.fgColor,
            bg: d.bgColor,
            fontSize: d.fontSize,
            fontWeight: d.fontWeight,
            expected: d.expectedContrastRatio,
          }
        : null,
    };
  }),
}))))`;

const browser = await launch({ chrome: CHROME, port: PORT });
const findings = [];

try {
  for (const target of targets) {
    const tab = await newTab(browser.port, {
      width: target.width,
      mobile: Boolean(target.mobile),
    });

    try {
      await goto(tab.cdp, BASE + target.path + QUERY);

      // 必须先点亮入场元素，否则 opacity:0 的内容会被 axe 当成不可见而跳过
      await evaluate(
        tab.cdp,
        "document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'))",
      );
      await sleep(1400);

      if (target.prepare) {
        await evaluate(tab.cdp, target.prepare);
        await sleep(target.settle ?? 600);
      }

      await evaluate(tab.cdp, axeSource);
      const violations = JSON.parse(
        await evaluate(tab.cdp, RUN_AXE, { awaitPromise: true }),
      );

      findings.push({ label: target.label, violations });
      const wcag = violations.filter((v) => v.tags.some((t) => t.startsWith('wcag')));
      console.log(
        `· ${target.label.padEnd(34)} ${target.width}px  ` +
          (violations.length ? `${violations.length} 类（WCAG ${wcag.length}）` : '通过'),
      );
    } finally {
      await tab.close();
    }
  }
} finally {
  await browser.close();
}

/* ---------- 汇总 ---------- */

const wcagFindings = [];
const bestFindings = [];
for (const finding of findings) {
  for (const violation of finding.violations) {
    const bucket = violation.tags.some((t) => t.startsWith('wcag')) ? wcagFindings : bestFindings;
    bucket.push({ label: finding.label, ...violation });
  }
}

const report = (title, list) => {
  if (!list.length) {
    console.log(`\n${title}：无`);
    return 0;
  }
  const byRule = new Map();
  for (const item of list) {
    if (!byRule.has(item.id)) {
      byRule.set(item.id, { id: item.id, impact: item.impact, help: item.help, hits: [] });
    }
    for (const node of item.nodes) {
      byRule.get(item.id).hits.push({ label: item.label, ...node });
    }
  }
  const total = [...byRule.values()].reduce((sum, rule) => sum + rule.hits.length, 0);
  console.log(`\n${title}：${byRule.size} 条规则 / ${total} 处`);

  for (const rule of byRule.values()) {
    console.log(`  [${rule.impact}] ${rule.id} — ${rule.help}（${rule.hits.length} 处）`);

    // 带实测值的规则（目前只有 color-contrast）按「前景/背景/字号」聚合，
    // 否则几百处逐个列出来看不出根因
    const measured = rule.hits.filter((hit) => hit.detail);
    if (measured.length) {
      const groups = new Map();
      for (const hit of measured) {
        const d = hit.detail;
        const key = `${d.fg} on ${d.bg} @ ${d.fontSize}/${d.fontWeight}`;
        if (!groups.has(key)) {
          groups.set(key, { ...d, count: 0, samples: new Set(), labels: new Set() });
        }
        const group = groups.get(key);
        group.count++;
        if (group.samples.size < 3) group.samples.add(hit.target);
        group.labels.add(hit.label);
      }
      for (const [key, group] of [...groups].sort((a, b) => b[1].count - a[1].count)) {
        const flag = Number(group.ratio) < 3 ? '✗' : '!';
        console.log(
          `      ${flag} ${group.ratio}:1（需要 ${group.expected}）  ${group.count} 处  ${key}`,
        );
        console.log(`        ${[...group.samples].join('   ')}`);
      }
      const unmeasured = rule.hits.filter((hit) => !hit.detail);
      if (unmeasured.length) {
        for (const hit of unmeasured.slice(0, 4)) console.log(`      ? ${hit.label} → ${hit.target}`);
      }
      continue;
    }

    for (const hit of rule.hits.slice(0, 6)) {
      console.log(`      ${hit.label}  →  ${hit.target}`);
      const line = hit.summary.split('\n').map((l) => l.trim()).find((l) => l && !/^Fix any/.test(l));
      if (line) console.log(`        ${line}`);
    }
    if (rule.hits.length > 6) console.log(`      …还有 ${rule.hits.length - 6} 处`);
  }
  return total;
};

console.log('');
const wcagTotal = report('WCAG 2.1 A/AA 违规', wcagFindings);
report('best-practice 提示（逐条判断，不一定是问题）', bestFindings);

console.log(
  wcagTotal
    ? `\n✗ WCAG 违规 ${wcagTotal} 处，需要修`
    : '\n✓ 没有 WCAG 2.1 A/AA 违规',
);
process.exit(wcagTotal ? 1 : 0);
