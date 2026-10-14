import Link from 'next/link';
import { Icon } from '@/components/Icon';

export default function NotFound() {
  return (
    <div className="wrap center" style={{ paddingTop: 'var(--sp-9)', paddingBottom: 'var(--sp-9)' }}>
      <Icon name="hills" size="xl" style={{ margin: '0 auto', opacity: 0.5 }} />
      <span className="eyebrow mt-6" style={{ justifyContent: 'center', display: 'flex' }}>
        <span className="dot" />
        404
      </span>
      <h1 className="display mt-5">这一页不存在</h1>
      <p className="lede" style={{ margin: 'var(--sp-5) auto 0' }}>
        可能是链接拼错了，也可能是我把某篇文章删掉了。
        不管怎样，从这里回去就好。
      </p>

      <div className="flex gap-3 wrap-gap mt-7" style={{ justifyContent: 'center' }}>
        <Link className="btn btn-solid" href="/">
          回到首页
          <Icon name="arrow-r" size="xs" className="arw" style={{ width: 16, height: 10 }} />
        </Link>
        <Link className="btn" href="/works">
          看项目
        </Link>
        <Link className="btn btn-ghost" href="/posts">
          读文章
        </Link>
      </div>

      <Icon name="wave" size="md" tone="sage" style={{ margin: 'var(--sp-8) auto 0', opacity: 0.6 }} />
    </div>
  );
}
