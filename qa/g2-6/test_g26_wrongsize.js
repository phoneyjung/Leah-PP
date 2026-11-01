// G2.6 A3b (Claude · 1 Nov 2569 · after Codex T14 R2): a kid sheet that LOADS (HTTP 200, a real PNG) but has the wrong size must count as missing,
// so the kid stays visible through the existing fallback. Each case answers c2-pilot-kid4-<sheet>.png with a 1 x 1 PNG, then the kid walks S
// (empty hands; walk-hold case: lantern held) for 1 s. Every kid frame the page draws is a drawImage with a 96 x 96 source rectangle: the check
// is that, in the last 0.6 s, >= 10 kid frames were drawn and every one came from a picture at least 384 px wide (a 1 x 1 sheet draws nothing).
// The page must also report that sheet as not ok. Motion + scene pages, sheets walk / idleanim / walkhold. JS errors 0.
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_wrongsize.js [OUT.json]       exit 0 = all pass
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8799, base = 'http://127.0.0.1:' + PORT + '/';
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const HOOK = () => { window.__kd = []; const di = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) { if (a.length === 8 && a[2] === 96 && a[3] === 96) window.__kd.push([img.naturalWidth || img.width, performance.now()]); return di.call(this, img, ...a); }; };
const OK = { walk: 'walk', idleanim: 'idle', walkhold: 'walkhold' };
(async () => {
  const b = await chromium.launch(); const rows = []; let all = true;
  for (const [page, url, ready, api] of [['motion', 'pilot-g2-motion.html?gm', 'window.PT&&PT.ST&&(PT.ST.ok.idle||PT.ST.ok.walk||PT.ST.img.idle===null)', 'PT'], ['scene', 'pilot-g2-scene.html?gm', 'window.PS&&PS.ST.ready', 'PS']])
    for (const sheet of ['walk', 'idleanim', 'walkhold']) {
      const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(String(e))); await p.addInitScript(HOOK);
      await p.route('**/c2-pilot-kid4-' + sheet + '.png', r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG1 }));
      await p.goto(base + url + (sheet === 'walkhold' && page === 'motion' ? '&hold' : '')); await p.waitForFunction(ready, null, { timeout: 30000 }); await p.waitForTimeout(500);
      const hold = sheet === 'walkhold';
      const r = await p.evaluate(async ([api, hold, okKey]) => { const A = window[api];
        if (api === 'PT') { A.set({ hold }); A.set({ pos: { x: 160, y: 120 } }); A.walk('S'); }
        else { A.teleport(16, 11, 'S'); A.ST.hold = hold; A.walk('S'); }
        await new Promise(r => setTimeout(r, 1000)); const t1 = performance.now() - 600, kd = window.__kd.filter(([, t]) => t >= t1);
        return { ok: A.ST.ok[okKey], anim: A.ST.anim, holding: typeof A.holdOn === 'function' ? !!A.holdOn() : hold, kid_frames: kd.length, min_src_w: kd.length ? Math.min(...kd.map(x => x[0])) : 0 }; }, [api, hold, OK[sheet]]);
      r.pass = r.ok === false && r.kid_frames >= 10 && r.min_src_w >= 384 && errs.length === 0; all = all && r.pass;
      rows.push(Object.assign({ page, sheet, errors: errs }, r)); console.log(page, sheet, '1x1 ->', JSON.stringify(r), 'errors', errs.length);
      await ctx.close();
    }
  if (process.argv[2]) require('fs').writeFileSync(process.argv[2], JSON.stringify({ pass: all, rows }, null, 1));
  console.log(all ? 'A3b PASS' : 'A3b FAIL'); await b.close(); process.exit(all ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
