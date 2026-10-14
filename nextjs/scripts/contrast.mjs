/**
 * 对比度计算：node scripts/contrast.mjs [候选色…]
 *
 * 为什么单独有这个脚本：v1.2.1 发现规范里的对比度表是手算的，而手算的规则本身
 * 就写错了（把 14px 当「大字」），结果全站 707 处小字不达标。以后改颜色令牌，
 * 先用这个算一遍再写进文档，别凭感觉。
 *
 * 无依赖。用法：
 *   node scripts/contrast.mjs                 # 复核 tokens.css 里所有颜色令牌
 *   node scripts/contrast.mjs 726B62 6C655D   # 试算候选值
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/** 承载文字的所有底色 —— 最暗的那个决定小字能不能过 AA */
const BACKGROUNDS = [
  ['--bg', '#FBF8F3'],
  ['--bg-alt', '#F5F0E8'],
  ['--surface', '#FFFFFF'],
  ['--wood-tint', '#F3E4D1'],
  ['--sage-tint', '#EAF0E7'],
];

/** AA 门槛：正文 4.5:1；大字（≥24px，或 ≥18.66px 且加粗）与 UI 图形 3:1 */
const AA_TEXT = 4.5;
const AA_LARGE = 3;

/**
 * 承载文字的令牌：必须对底色过 4.5:1，不过就是 bug。
 * 其余令牌（底色、木色、灰绿、浅底）不参与这个判定 —— 拿底色去比底色没有意义。
 */
const TEXT_TOKENS = ['--ink', '--ink-soft', '--muted', '--wood-dark', '--sage-text', '--danger'];

/** 规范 03 节明确定义为「仅装饰、禁止承载信息」的令牌，不参与判定 */
const DECORATIVE = new Set(['--muted-2']);

const toRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

const luminance = (hex) =>
  toRgb(hex)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const pad = (value, width) => String(value).padEnd(width);

/** 把 tokens.css 里的 `--name:#HEX;` 全部抽出来 */
function readTokens() {
  const css = readFileSync(TOKENS, 'utf8');
  const found = [];
  for (const match of css.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;/gm)) {
    found.push([match[1], match[2].toUpperCase()]);
  }
  return found;
}

const candidates = process.argv.slice(2);

if (candidates.length) {
  console.log('候选值试算（最差一列若 < 4.5 就不能用来写正文）\n');
  for (const candidate of candidates) {
    const hex = candidate.startsWith('#') ? candidate : `#${candidate}`;
    if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
      console.log(`  ${candidate}  不是合法的 16 进制色值，跳过`);
      continue;
    }
    const values = BACKGROUNDS.map(([, bg]) => contrast(hex, bg));
    const worst = Math.min(...values);
    const verdict = worst >= AA_TEXT ? '✓ 正文可用' : worst >= AA_LARGE ? '! 仅大字/图形' : '✗ 装饰以外都不行';
    console.log(`  ${pad(hex.toUpperCase(), 9)} ${values.map((v) => v.toFixed(2)).join('  ')}   最差 ${worst.toFixed(2)}  ${verdict}`);
  }
  console.log(`\n背景顺序：${BACKGROUNDS.map(([name]) => name).join('  ')}`);
} else {
  const tokens = readTokens();
  const textTokens = tokens.filter(([name]) => TEXT_TOKENS.includes(name));
  const otherTokens = tokens.filter(([name]) => !TEXT_TOKENS.includes(name));

  const worstOf = (hex) => Math.min(...BACKGROUNDS.map(([, bg]) => contrast(hex, bg)));

  console.log(`复核 ${TOKENS}\n`);
  console.log(`【文字令牌】必须过 4.5:1 —— 这些是正文与次要文字，不过就是缺陷\n`);
  console.log(`  ${pad('令牌', 18)}${pad('色值', 10)}${BACKGROUNDS.map(([name]) => pad(name, 10)).join('')}最差`);
  console.log(`  ${'-'.repeat(18 + 10 + BACKGROUNDS.length * 10 + 6)}`);

  let failing = 0;
  for (const [name, hex] of textTokens) {
    const values = BACKGROUNDS.map(([, bg]) => contrast(hex, bg));
    const worst = worstOf(hex);
    const decorative = DECORATIVE.has(name);
    const flag = decorative ? '·' : worst >= AA_TEXT ? '✓' : worst >= AA_LARGE ? '!' : '✗';
    if (!decorative && worst < AA_TEXT) failing++;
    console.log(
      `  ${pad(name, 18)}${pad(hex, 10)}${values.map((v) => pad(v.toFixed(2), 10)).join('')}${worst.toFixed(2)}  ${flag}`,
    );
  }

  console.log('\n  ✓ ≥4.5 正文可用    ! 3–4.5 仅大字/图形    · 规范标注为仅装饰    ✗ <3 不能承载信息');

  // 其余令牌是底色与强调色，不做 AA 正文判定；但 UI 图形（描边、图标）若要承载
  // 「这是可点的」这类信息，按 WCAG 1.4.11 需要 ≥3:1。不过本脚本只知道令牌值，
  // 不知道谁挨着谁（--hair-strong 的 .24 压在暖白底上渲染成 #CECDCC，不是墨色），
  // 所以这里只是「值得怀疑的清单」，真正的 1.4.11 判定在 nontext-contrast.mjs。
  const lowContrastAccents = otherTokens
    .map(([name, hex]) => [name, hex, worstOf(hex)])
    .filter(([, , worst]) => worst < AA_LARGE);

  console.log(`\n【底色与强调色】不做正文判定，仅供参考（最差底上的值 < 3:1 的有 ${lowContrastAccents.length} 个）\n`);
  for (const [name, hex, worst] of lowContrastAccents) {
    console.log(`  ${pad(name, 18)}${pad(hex, 10)}最差 ${worst.toFixed(2)}`);
  }
  console.log(
    '\n  这些是背景、浅底、描边与装饰图形。若某个值被用来表达「这里可点」这类信息\n' +
      '  （而不是纯装饰或与其他线索重复），按 WCAG 1.4.11 需要 ≥3:1。\n' +
      '  注意：上面的值是「令牌两两之间」的比值，不等于渲染后的实际对比度。\n' +
      '  要实测哪些边界真的需要 3:1、有没有达标，跑 node scripts/nontext-contrast.mjs。',
  );

  console.log(
    failing
      ? `\n✗ ${failing} 个文字令牌没过 AA 4.5:1`
      : '\n✓ 所有文字令牌都过了 4.5:1',
  );
  process.exit(failing ? 1 : 0);
}
