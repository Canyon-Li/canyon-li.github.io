import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { site } from '@/lib/site';

/** 页脚。联系区块在「关于」页（id="contact"），导航里的「联系」指向那里。 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site" id="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="brand" href="/">
              <span className="mark" aria-hidden="true">
                C
              </span>
              {site.name}
            </Link>
            <p className="body-sm mt-4" style={{ maxWidth: '34ch' }}>
              路过的人~欢迎你
            </p>
            <div className="flex gap-3 mt-5">
              <a className="btn btn-icon-sm" href={`mailto:${site.email}`} aria-label="写邮件">
                <Icon name="moon" size="xs" />
              </a>
              <a className="btn btn-icon-sm" href={site.github} aria-label="GitHub">
                <Icon name="diamond" size="xs" />
              </a>
              <Link className="btn btn-icon-sm" href="/rss.xml" aria-label="RSS 订阅">
                <Icon name="wave" size="xs" />
              </Link>
            </div>
          </div>

          <div>
            {/* h3 而不是 h4：页脚前面最后一个标题是 h2，跳到 h4 会构成标题层级跳跃 */}
            <h3>站点</h3>
            <ul>
              <li>
                <Link href="/works">项目</Link>
              </li>
              <li>
                <Link href="/posts">文章</Link>
              </li>
              <li>
                <Link href="/about">关于我</Link>
              </li>
              <li>
                <Link href="/#subscribe">订阅</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>其他</h3>
            <ul>
              <li>
                <Link href="/archive">文章归档</Link>
              </li>
              <li>
                <Link href="/now">近况</Link>
              </li>
              <li>
                <Link href="/tags/技术">按标签看</Link>
              </li>
              <li>
                <Link href="/about#contact">联系</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>
            © <span className="num">{year}</span> {site.name} · 文字 CC BY-NC-SA 4.0 · 代码 MIT
          </span>
          <div className="foot-links">
            <a href={`mailto:${site.email}`}>邮件</a>
            <a href={site.github}>GitHub</a>
            <Link href="/rss.xml">RSS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
