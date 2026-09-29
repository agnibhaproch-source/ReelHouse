// First-load JS for a route (spec 61). Usage: pnpm build && pnpm start, then
//   node scripts/measure-bundle.mjs [http://localhost:3000/]
// Sums gzip -9 of every <script src> in the HTML, excluding the legacy `noModule` polyfill.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const url = process.argv[2] ?? 'http://localhost:3000/';
const html = await (await fetch(url)).text();
const tags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"[^>]*>/g)];
let total = 0;
const rows = [];
for (const [tag, src] of tags) {
  if (/nomodule/i.test(tag) || !src.startsWith('/_next/')) continue;
  const bytes = gzipSync(readFileSync(`.next${src.slice('/_next'.length)}`), { level: 9 }).length;
  total += bytes;
  rows.push([bytes, src]);
}
rows.sort((a, b) => b[0] - a[0]);
for (const [b, s] of rows.slice(0, 12))
  console.log(`${(b / 1024).toFixed(1).padStart(6)} KB  ${s}`);
console.log(
  `\nFirst-load JS (gzip): ${(total / 1024).toFixed(1)} KB across ${rows.length} scripts — ${url}`,
);
