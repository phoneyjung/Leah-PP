// G2.6 A6 (Claude · 1 Nov 2569): bytes of the character pictures each Pilot page holds = sum of width x height x 4 of
// (a) every decoded image whose file is a character picture (c2-pilot-*, kid-*) and (b) every canvas the page creates
// (counted from document.createElement('canvas') / OffscreenCanvas, sizes read after load). Scene-page canvases that are
// not the character (world, light, night layers) are listed separately and NOT counted as character memory.
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_memory.js [OUT.json]
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8794, base = 'http://127.0.0.1:' + PORT + '/';
const INIT = () => { window.__cv = []; const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const e = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas') window.__cv.push({ c: e, at: new Error().stack.split('\n')[2] || '' }); return e; }; };
(async () => {
  const b = await chromium.launch(); const R = {};
  for (const [name, url, ready] of [['scene', 'pilot-g2-scene.html?gm', 'window.PS&&PS.ST.ready'], ['portrait', 'pilot-g2-portrait.html?gm', 'document.querySelectorAll("button").length>=21'], ['motion', 'pilot-g2-motion.html?gm', 'window.PT&&PT.ST.img.walk']]) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625 }); const p = await ctx.newPage();
    await p.addInitScript(INIT); await p.goto(base + url); await p.waitForFunction(ready, null, { timeout: 30000 }); await p.waitForTimeout(1500);
    if (name === 'portrait') { await p.getByRole('button', { name: 'Green' }).first().click(); await p.getByRole('button', { name: 'Sun' }).click(); await p.waitForTimeout(500); }
    R[name] = await p.evaluate(() => {
      const imgs = performance.getEntriesByType('resource').map(e => e.name.split('/').pop().split('?')[0]).filter(f => /^(c2-pilot|kid-).*\.png$/.test(f));
      const uniq = [...new Set(imgs)]; const dims = {};
      return Promise.all(uniq.map(f => new Promise(r => { const i = new Image(); i.onload = () => { dims[f] = [i.naturalWidth, i.naturalHeight]; r(); }; i.onerror = r; i.src = f; }))).then(() => {
        const img_bytes = Object.values(dims).reduce((s, [w, h]) => s + w * h * 4, 0);
        const cvs = window.__cv.map(o => ({ w: o.c.width, h: o.c.height, onPage: document.body.contains(o.c), at: o.at.trim().slice(0, 90) }));
        return { images: dims, image_MB: +(img_bytes / 1048576).toFixed(3), canvases: cvs, canvas_MB_all: +(cvs.reduce((s, c) => s + c.w * c.h * 4, 0) / 1048576).toFixed(3) };
      });
    });
    await ctx.close();
  }
  console.log(JSON.stringify(Object.fromEntries(Object.entries(R).map(([k, v]) => [k, { image_MB: v.image_MB, canvases: v.canvases.length, canvas_MB_all: v.canvas_MB_all, big: v.canvases.filter(c => c.w * c.h > 50000).map(c => c.w + 'x' + c.h + (c.onPage ? ' (screen)' : '')) }]))));
  if (process.argv[2]) require('fs').writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
