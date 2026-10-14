import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@/styles/tokens.css';
import '@/styles/components.css';
import './globals.css';
import { ClientFx } from '@/components/ClientFx';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { Sprite } from '@/components/Sprite';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  authors: [{ name: site.author }],
  creator: site.author,
  keywords: [...site.tags],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': '/rss.xml' },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: '/',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBF8F3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main">
          跳到主要内容
        </a>

        {/* 装饰图形精灵：同文档引用，避免跨文件 <use> 被拦截 */}
        <Sprite />

        {/* role="region" + 名字：公告条在 <header> 外面，不挂 landmark 的话
            读屏用户没法用「按地标跳转」找到它（axe 的 region 规则也会报） */}
        <div className="announce" role="region" aria-label="站点公告">
          <span className="pulse" aria-hidden="true" />
          <span>Peregrine 开源：本地优先的 Agent 工作台</span>
          <Link href="/works/peregrine">看项目</Link>
        </div>

        <SiteHeader />

        <main id="main">{children}</main>

        <SiteFooter />
        <ClientFx />
      </body>
    </html>
  );
}
