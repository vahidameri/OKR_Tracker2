/**
 * سرور استاتیک برای پوشهٔ dist — فقط با ماژول‌های داخلی Node، بدون هیچ
 * وابستگی و بدون نیاز به Docker یا اینترنت.
 *
 *   node serve.mjs            → پورت ۸۰۸۰ روی همهٔ کارت‌های شبکه
 *   node serve.mjs 80         → پورت دلخواه
 *
 * مسیرهای ناشناخته به index.html برمی‌گردند تا آدرس مراحل ویزارد
 * (‏/request، /problem و …) با بازکردن مستقیم هم کار کند.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const ROOT = resolve(import.meta.dirname, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

if (!existsSync(ROOT)) {
  console.error('پوشهٔ dist پیدا نشد. اول دستور «npm run build» را اجرا کنید.');
  process.exit(1);
}

const server = createServer((req, res) => {
  // فقط مسیر را نگه دار و از خروج از پوشهٔ dist جلوگیری کن
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, safe);

  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    // fallback مخصوص تک‌صفحه‌ای‌ها
    file = join(ROOT, 'index.html');
  }

  const ext = extname(file);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  // ‏index.html هرگز کش نشود تا نسخهٔ جدید بلافاصله دیده شود؛
  // فایل‌های assets نام هش‌دار دارند و کش طولانی‌شان امن است.
  res.setHeader(
    'Cache-Control',
    ext === '.html' ? 'no-store, must-revalidate' : 'public, max-age=31536000, immutable',
  );
  createReadStream(file).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log('\n  فرم ثبت درخواست کار — FRM-TPD-01\n');
  console.log(`  روی این دستگاه:  http://localhost:${PORT}`);
  for (const address of addresses) {
    console.log(`  روی شبکه:        http://${address}:${PORT}`);
  }
  console.log('\n  برای توقف: Ctrl+C\n');
});
