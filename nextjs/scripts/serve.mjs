/**
 * 零依赖静态预览服务器：node scripts/serve.mjs out [port]
 * 用途：output: 'export' 产物是纯静态文件，next start 不可用，用这个脚本本地预览。
 * 端口默认 4173，也可用环境变量 PORT 覆盖。
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] ?? 'out';
const port = Number(process.argv[3] ?? process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(root, clean),
    join(root, clean, 'index.html'),
    join(root, `${clean}.html`),
  ];
  for (const file of candidates) {
    try {
      const info = await stat(file);
      if (info.isFile()) return file;
    } catch {
      /* 继续尝试下一个候选 */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/');
  if (!file) {
    const notFound = await resolveFile('/404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(notFound ? await readFile(notFound) : 'Not Found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, () => {
  console.log(`预览地址 http://localhost:${port}  （根目录：${root}）`);
});
