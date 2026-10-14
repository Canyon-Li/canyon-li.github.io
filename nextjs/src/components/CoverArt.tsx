import type { CSSProperties, ReactElement } from 'react';
import { COVER_FAMILIES, type CoverFamily, type Work } from '@/lib/types';

/**
 * 生成式封面（设计预览版）
 *
 * 为什么重做：原来的 `thumbArt` 只让**图标和底色**随 slug 变化，两块矩形的坐标是写死的，
 * 所以首页三张卡片并排时看起来是同一张图换了颜色 —— 这是全站最明显的「临时感」。
 *
 * 两个决定：
 *
 * 1. **构图家族由内容层分配**（`work.cover`），不在这里用哈希算。
 *    哈希在 6 个家族里撞车是大概率事件（6 个项目全不撞只有约 11%），
 *    而「并排两张同构图」正是要修的问题。内容层按全量顺序轮转，保证同屏不重复。
 *    这里的哈希只用来做**家族内部的微调**（比例档位、左右镜像），所以同一个项目
 *    在任何页面上拿到的封面都完全一致。
 *
 * 2. **六个家族全部以拱形为母题**，只在数量、大小、组合上变化。
 *    这是刻意的：拱形已经在 Hero 的肖像框里出现，把它变成贯穿全站的签名，
 *    比六种互不相干的抽象图形更像「一套系统」。
 *
 * 确定性：纯函数 + 整数哈希，不用 `Math.random()`，服务端与客户端渲染结果一致。
 */

/** FNV-1a：比「字符码求和」分布好，避免 slug 相近时微调也相近 */
function hashOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 所有构图的形状都落在 11%–89% 之间，保证六张图视觉重量接近 */
const shape = (style: CSSProperties, key: string) => (
  <i key={key} style={{ position: 'absolute', display: 'block', ...style }} />
);

/** 拱形的圆角：浏览器会按盒子的宽高自动收敛，所以窄高盒得到正拱、宽扁盒得到缓丘 */
const ARCH = '999px 999px 0 0';

export function CoverArt({ work }: { work: Work }) {
  const h = hashOf(work.slug);
  const family: CoverFamily = work.cover ?? COVER_FAMILIES[h % COVER_FAMILIES.length];
  const flip = ((h >>> 3) & 1) === 1;
  const lean = (h >>> 5) % 3;

  const isTool = work.category === 'tool';
  const archived = work.status === '已归档';

  const base = archived ? 'var(--bg-alt)' : isTool ? 'var(--sage-tint)' : 'var(--wood-tint)';
  const primary = isTool ? 'var(--sage)' : 'var(--wood)';
  const deep = isTool ? 'var(--sage-deep)' : 'var(--wood-deep)';
  const accent = isTool ? 'var(--wood-deep)' : 'var(--sage)';

  /** 地平线：给所有构图一个共同的落脚点，也是「同一套系统」最省力的线索 */
  const baseline = shape(
    { left: '11%', right: '11%', bottom: '15%', height: '1px', background: 'var(--hair-strong)' },
    'baseline',
  );

  const farSide = flip ? { left: '13%' } : { right: '13%' };

  let art: ReactElement;

  switch (family) {
    /* 单拱门：一根主拱 + 一颗小圆 */
    case 'portal': {
      art = (
        <>
          {baseline}
          {shape(
            {
              left: '50%',
              bottom: '15%',
              transform: 'translateX(-50%)',
              width: '46%',
              height: `${64 + lean * 5}%`,
              borderRadius: ARCH,
              background: primary,
            },
            'arch',
          )}
          {shape({ ...farSide, top: '15%', width: '11%', aspectRatio: '1', borderRadius: '50%', background: accent, opacity: 0.8 }, 'sun')}
        </>
      );
      break;
    }

    /* 双拱：两根不等高的拱并排 */
    case 'arcade': {
      art = (
        <>
          {baseline}
          {shape(
            { left: '17%', bottom: '15%', width: '27%', height: `${56 + lean * 5}%`, borderRadius: ARCH, background: primary },
            'a',
          )}
          {shape(
            { left: '51%', bottom: '15%', width: '27%', height: `${36 + lean * 6}%`, borderRadius: ARCH, background: deep, opacity: 0.78 },
            'b',
          )}
        </>
      );
      break;
    }

    /* 拱廊：三根拱，中间最高 */
    case 'colonnade': {
      const hs = flip ? [42, 56, 34] : [34, 56, 42];
      art = (
        <>
          {baseline}
          {hs.map((v, i) =>
            shape(
              {
                left: `${12 + i * 26}%`,
                bottom: '15%',
                width: '20%',
                height: `${v + lean * 4}%`,
                borderRadius: ARCH,
                background: i === 1 ? primary : deep,
                opacity: i === 1 ? 1 : 0.66,
              },
              `c${i}`,
            ),
          )}
        </>
      );
      break;
    }

    /* 地平线：一缓丘 + 一轮日 */
    case 'horizon': {
      art = (
        <>
          {baseline}
          {shape(
            {
              left: '11%',
              bottom: '15%',
              width: '78%',
              height: `${28 + lean * 5}%`,
              borderRadius: ARCH,
              background: primary,
            },
            'hill',
          )}
          {shape(
            { ...farSide, top: '15%', width: '13%', aspectRatio: '1', borderRadius: '50%', background: accent, opacity: 0.85 },
            'sun',
          )}
        </>
      );
      break;
    }

    /* 拱与圆：一根拱 + 一个压上来的大圆 */
    case 'arch-disc': {
      art = (
        <>
          {baseline}
          {shape(
            { [flip ? 'right' : 'left']: '12%', bottom: '15%', width: '32%', height: `${58 + lean * 5}%`, borderRadius: ARCH, background: primary },
            'arch',
          )}
          {shape(
            { [flip ? 'left' : 'right']: '11%', top: '18%', width: '40%', aspectRatio: '1', borderRadius: '50%', background: deep, opacity: 0.72 },
            'disc',
          )}
        </>
      );
      break;
    }

    /* 拱与地层：拱立在被水平带切分的地面上 */
    default: {
      art = (
        <>
          {baseline}
          {shape({ left: '11%', right: '11%', bottom: '15%', height: '10%', background: deep, opacity: 0.3 }, 's1')}
          {shape({ left: '11%', right: '11%', bottom: '25%', height: '10%', background: deep, opacity: 0.52 }, 's2')}
          {shape(
            {
              left: '50%',
              bottom: '35%',
              transform: 'translateX(-50%)',
              width: '34%',
              height: `${40 + lean * 5}%`,
              borderRadius: ARCH,
              background: primary,
            },
            'arch',
          )}
        </>
      );
      break;
    }
  }

  return (
    <div className="thumb" style={{ background: base }} aria-hidden="true">
      {art}
    </div>
  );
}
