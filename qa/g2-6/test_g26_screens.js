// G2.6 A7 (Claude · 1 Nov 2569): the kid holding the lantern on the Pilot motion page (?gm&hold) at the 5 screens of plan G2.0 table A,
// zoom 100 % and 75 % (game formula SC = max(1, round(canvas h / 384)) x zoom -> 3 and 2.25 on 844x390 @2.625).
// Per screen: canvas = stage in device px · scale · kid height on screen (83 art px) · every button >= 44 CSS px and not covered at its centre ·
// art pixels equal = scale is a whole number (else the widths of 1 art px on screen are listed) · a screenshot for the eye check (eyes, house colour,
// lantern seen without zooming). Then a GIF of the kid walking the 8 directions (844x390 @2.625, zoom 100 %).
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_screens.js OUT_DIR
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const PORT = process.env.PORT || 8796, OUT = process.argv[2] || '/tmp/g26-screens'; fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + PORT + '/pilot-g2-motion.html?gm&hold';
const SCREENS = [['phone 740x360', 740, 360, 2.625, true], ['phone 844x390', 844, 390, 2.625, true], ['phone 915x412', 915, 412, 2.625, true], ['iPad 1180x820', 1180, 820, 2, true], ['PC 1920x1080', 1920, 1080, 1, false]];
(async () => {
  const b = await chromium.launch(); const rows = []; let ok = true;
  for (const [name, w, h, dpr, touch] of SCREENS) for (const z of [1, 0.75]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: touch, isMobile: touch });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL + (z === 0.75 ? '&z75' : '')); await p.waitForFunction('window.PT&&PT.ST.img.walk', null, { timeout: 30000 }); await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const cv = document.querySelector('canvas'), bb = cv.getBoundingClientRect(), d = devicePixelRatio, s = PT.scale();
      const btn = [...document.querySelectorAll('button')].filter(e => e.offsetParent !== null).map(e => { const q = e.getBoundingClientRect(), hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
        return { id: e.id || e.textContent.trim().slice(0, 12), w: +q.width.toFixed(1), h: +q.height.toFixed(1), free: !!hit && (hit === e || e.contains(hit)) }; });
      // on-screen width of each of 12 neighbouring art pixels (device px) from the scale: floor((i+1)*s) - floor(i*s)
      const widths = [...new Set(Array.from({ length: 12 }, (_, i) => Math.floor((i + 1) * s) - Math.floor(i * s)))];
      return { scale: s, whole: Number.isInteger(s), canvas_dev: [cv.width, cv.height], canvas_css_x_dpr: [Math.round(bb.width * d), Math.round(bb.height * d)],
        kid_css_px: +(83 * s / d).toFixed(1), art_px_widths_dev: widths, buttons: btn, small: btn.filter(x => x.w < 44 || x.h < 44).map(x => x.id), covered: btn.filter(x => !x.free).map(x => x.id) };
    });
    const tag = name.split(' ')[1] + '-z' + Math.round(z * 100); await p.screenshot({ path: path.join(OUT, 'a7-' + tag + '.png') });
    const canvasOk = Math.abs(r.canvas_dev[0] - r.canvas_css_x_dpr[0]) <= 1 && Math.abs(r.canvas_dev[1] - r.canvas_css_x_dpr[1]) <= 1;
    const pass = canvasOk && r.small.length === 0 && r.covered.length === 0 && errs.length === 0;   // whole-scale is reported, judged with the eye check
    ok = ok && pass; rows.push(Object.assign({ screen: name, dpr, zoom: z, file: 'a7-' + tag + '.png', canvasOk, errors: errs.length, pass }, r));
    console.log(name, '@' + dpr, 'zoom', z * 100 + '%', '| scale', r.scale, r.whole ? 'whole' : 'NOT whole ' + JSON.stringify(r.art_px_widths_dev), '| kid', r.kid_css_px, 'CSS px | buttons', r.buttons.length, 'small', r.small.length, 'covered', r.covered.length, '| canvas', canvasOk, '| errors', errs.length);
    await ctx.close();
  }
  // GIF frames: walk the 8 directions, 0.8 s each, a frame every 100 ms, crop round the kid
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625 }); const p = await ctx.newPage();
  await p.goto(URL); await p.waitForFunction('window.PT&&PT.ST.img.walk', null, { timeout: 30000 }); await p.waitForTimeout(500);
  fs.mkdirSync(path.join(OUT, 'gif'), { recursive: true }); let n = 0;
  for (const d of ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']) {
    await p.evaluate(dd => { PT.set({ pos: { x: 160, y: 120 } }); PT.walk(dd); }, d);
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(100);
      const box = await p.evaluate(() => { const cv = document.querySelector('canvas'), q = cv.getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
      await p.screenshot({ path: path.join(OUT, 'gif', String(n++).padStart(3, '0') + '-' + d + '.png'), clip: { x: box[0], y: box[1], width: box[2], height: box[3] } }); }
  }
  await p.evaluate(() => PT.stop()); await ctx.close(); await b.close();
  fs.writeFileSync(path.join(OUT, 'a7.json'), JSON.stringify({ pass: ok, rows, gif_frames: n }, null, 1));
  console.log('A7', ok ? 'PASS' : 'FAIL', '| gif frames', n); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
