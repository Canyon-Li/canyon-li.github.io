import type { CSSProperties } from 'react';

export type IconName =
  | 'sun'
  | 'arch'
  | 'hills'
  | 'branch'
  | 'wave'
  | 'rings'
  | 'star'
  | 'dots'
  | 'sprout'
  | 'diamond'
  | 'arrow'
  | 'moon'
  | 'sign'
  | 'check'
  | 'info'
  | 'spark'
  | 'search'
  | 'up'
  | 'arrow-r';

type Tone = 'wood' | 'sage' | 'ink';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  name: IconName;
  /** 尺寸档位（设计规范 08 节：只用这五档） */
  size?: Size;
  tone?: Tone;
  /** 需要绝对定位等一次性微调时使用 */
  style?: CSSProperties;
  className?: string;
}

/** 装饰图形。默认 aria-hidden，因为它只承担装饰职责。 */
export function Icon({ name, size = 'md', tone = 'wood', style, className = '' }: IconProps) {
  const toneClass = tone === 'sage' ? ' orn-sage' : tone === 'ink' ? ' orn-ink' : '';
  return (
    <svg
      className={`orn orn-${size}${toneClass}${className ? ` ${className}` : ''}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#o-${name}`} />
    </svg>
  );
}
