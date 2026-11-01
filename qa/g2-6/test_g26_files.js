// G2.6 A2 + A3 (Claude · 1 Nov 2569) on the 3 Pilot pages (motion, scene, portrait · ?gm · phone 844x390 @2.625).
// A2: bytes of every file the page really loads (same origin, from the network) -> <= 3 MB per page.
// A3: block each loaded file ONE AT A TIME, then all of them -> the page must still draw (not a blank screen) and throw 0 page errors
//     (a blocked file's own "failed to load" console line is expected and not counted, same rule as the S5-e / S6 suites).
// "drawn" = the screenshot has >= 12 distinct colours and >= 2 % of its pixels differ from the most common colour.
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_files.js OUT_DIR      exit 0 = all pass
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const PORT = process.env.PORT || 8791, OUT = process.argv[2] || '/tmp/g26-files'; fs.mkdirSync(OUT, { recursive: true });
const PAGES = ['pilot-g2-motion.html?gm', 'pilot-g2-scene.html?gm', 'pilot-g2-portrait.html?gm'];
const base = 'http://127.0.0.1:' + PORT + '/';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function pngStats(buf) {   // tiny PNG reader (8-bit RGBA / RGB, no interlace) -> distinct colours + share of the main colour
  let o = 8, w, h, ct, idat = [];
  while (o < buf.length) { const n = buf.readUInt32BE(o), t = buf.toString('ascii', o + 4, o + 8), d = buf.slice(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (t === 'IDAT') idat.push(d); o += 12 + n; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], src = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = src[x]; if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255; } }
  const cnt = new Map(); for (let i = 0; i < px.length; i += bpp) { const k = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]; cnt.set(k, (cnt.get(k) || 0) + 1); }
  const top = Math.max(...cnt.values()); return { colours: cnt.size, other_share: 1 - top / (w * h) };
}
async function load(b, url, block) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [], files = new Map();
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', async r => { const u = r.url(); if (!u.startsWith(base) || r.request().method() !== 'GET') return;
    try { const body = await r.body(); files.set(u.slice(base.length).split('?')[0], body.length); } catch (e) {} });
  if (block) await p.route(u => { const f = u.href.startsWith(base) ? u.href.slice(base.length).split('?')[0] : ''; return block === '*' ? f && !f.endsWith('.html') : f === block; }, r => r.abort());
  await p.goto(url, { waitUntil: 'load', timeout: 30000 }); await sleep(2500);
  const shot = await p.screenshot(); const st = pngStats(shot);
  await ctx.close(); return { errs, files, st, shot };
}
(async () => {
  const b = await chromium.launch(); const R = { pages: {} }; let ok = true;
  for (const pg of PAGES) {
    const name = pg.split('.')[0], url = base + pg;
    const full = await load(b, url, null);
    const list = [...full.files.entries()].sort(), bytes = list.reduce((s, [, n]) => s + n, 0);
    const drawn = (st) => st.colours >= 12 && st.other_share >= 0.02;
    const rows = [];
    for (const [f] of list) { if (f.endsWith('.html')) continue;
      const r = await load(b, url, f); rows.push({ blocked: f, drawn: drawn(r.st), colours: r.st.colours, other_share: +r.st.other_share.toFixed(3), page_errors: r.errs.length, err: r.errs.slice(0, 2) }); }
    const all = await load(b, url, '*'); fs.writeFileSync(path.join(OUT, name + '-all-blocked.png'), all.shot);
    rows.push({ blocked: '* every file', drawn: drawn(all.st), colours: all.st.colours, other_share: +all.st.other_share.toFixed(3), page_errors: all.errs.length, err: all.errs.slice(0, 2) });
    const pass2 = bytes <= 3 * 1024 * 1024, pass3 = rows.every(r => r.drawn && r.page_errors === 0) && full.errs.length === 0 && drawn(full.st);
    ok = ok && pass2 && pass3;
    R.pages[name] = { files: list.length, bytes, MB: +(bytes / 1048576).toFixed(3), list, A2_pass: pass2, normal_errors: full.errs.length, normal_drawn: drawn(full.st), blocked_runs: rows.length, A3_pass: pass3, rows };
    console.log(name, '| files', list.length, '|', (bytes / 1048576).toFixed(3), 'MB | A2', pass2, '| blocked runs', rows.length, 'drawn', rows.filter(r => r.drawn).length, 'page errors', rows.reduce((s, r) => s + r.page_errors, 0), '| A3', pass3);
  }
  R.pass = ok; fs.writeFileSync(path.join(OUT, 'a2-a3.json'), JSON.stringify(R, null, 1)); await b.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
