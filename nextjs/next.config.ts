import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 全站静态生成：内容来自本地 Markdown，不需要服务端运行时
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
