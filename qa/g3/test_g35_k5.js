// G3.5 K5 (Claude · 3 Nov 2569): FPS of the kid renderer, old Pilot code vs char2.js, in ONE page with ONE switch (G3_0_RENDERER_PLAN.md table 6 K5).
// Page pilot-g3-char2.html?gm&bench: the G2.4 scene, 4 kids (4 looks / 4 houses in char2 mode), all holding the lit lantern, light holes + glow + glass pass,
// slimes, street lamps · every kid walks back and forth between its 2 bench cells. Only &r=pilot changes (= the Pilot drawKid / cutLight / relight code, no recolour).
// Method A5 (G2.6): 844x390 DPR 3, CPU 4x, warm 5 s, measure 30 s, 3 rounds per renderer, order alternates, median. Pass: char2 >= 90 % of Pilot.
// Reported, not gates: p95 frame time (median of the 3 runs) · colour / cache build time at CPU 4x (all 4 looks from empty, and 1 colour change) · Char2.stats().
// Each run also checks that the renderer asked for drew every kid every frame (page counters) and that all 4 kids kept walking.
// INJECT=SLOW (must fail): char2.js is served as char2.src.js with a 1.5 ms busy wait at the start of Char2.draw (built file never touched).
// usage: PORT=<server at repo root> node qa/g3/test_g35_k5.js [OUT.json] [measure_s]
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 8792, MEAS = +(process.argv[3] || 30), INJ = process.env.INJECT || '', base = 'http://127.0.0.1:' + PORT + '/pilot-g3-char2.html?gm&bench';
const FPS = (ms) => `new Promise(r=>{let n=0,last=0;const iv=[];const t0=performance.now();const f=(t)=>{if(last)iv.push(t-last);last=t;n++;if(performance.now()-t0<${ms})requestAnimationFrame(f);else{iv.sort((a,b)=>a-b);r({fps:n/((performance.now()-t0)/1000),p95:iv[Math.floor(iv.length*0.95)]||0})}};requestAnimationFrame(f)})`;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  if (INJ === 'SLOW') { const src = fs.readFileSync(path.join(__dirname, '..', '..', 'char2.src.js'), 'utf8'), at = 'function draw(ctx, app, dc, A, x, y, s, op) {';
    if (!src.includes(at)) throw new Error('inject point missing');
    const body = src.replace(at, at + ' { const __t = performance.now(); while (performance.now() - __t < 1.5); }');
    await p.route('**/char2.js', (rt) => rt.fulfill({ status: 200, contentType: 'application/javascript', body })); }
  const cdp = await ctx.newCDPSession(p); const vals = { pilot: [], char2: [] }, p95 = { pilot: [], char2: [] }, runs = [];
  for (let rnd = 0; rnd < 3; rnd++) for (const which of rnd % 2 ? ['char2', 'pilot'] : ['pilot', 'char2']) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.goto(base + (which === 'pilot' ? '&r=pilot' : '')); await p.waitForFunction('window.PG&&PG.ST.ready', null, { timeout: 30000, polling: 100 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.waitForTimeout(5000);                                   // warm up 5 s
    const a = await p.evaluate(() => ({ cnt: { ...PG.ST.cnt }, pos: PG.KIDS.map((K) => [K.pos.x, K.pos.y]), walked: PG.KIDS.map(() => 0) }));
    await p.evaluate(() => { window.__walk = PG.KIDS.map(() => 0); window.__last = PG.KIDS.map((K) => [K.pos.x, K.pos.y]);
      window.__wi = setInterval(() => PG.KIDS.forEach((K, i) => { __walk[i] += Math.hypot(K.pos.x - __last[i][0], K.pos.y - __last[i][1]); __last[i] = [K.pos.x, K.pos.y]; }), 250); });
    const m = await p.evaluate(FPS(MEAS * 1000));
    const z = await p.evaluate(() => { clearInterval(__wi); return { cnt: { ...PG.ST.cnt }, walk: __walk.map(Math.round), r: PG.ST.renderer, c2: PG.C2.ready, stats: window.Char2 ? Char2.stats() : null, loopErr: PG.ST.loopErr || null }; });
    const fr = z.cnt.frames - a.cnt.frames, mine = which === 'char2' ? z.cnt.c2 - a.cnt.c2 : z.cnt.pilot - a.cnt.pilot, other = which === 'char2' ? z.cnt.pilot - a.cnt.pilot : z.cnt.c2 - a.cnt.c2;
    const run = { round: rnd + 1, renderer: which, fps: +m.fps.toFixed(2), p95_ms: +m.p95.toFixed(1), frames: fr, kid_draws: mine, other_draws: other, c2fail: z.cnt.c2fail, walked_px: z.walk, loopErr: z.loopErr,
      ok: z.r === which && fr > 0 && mine === 4 * fr && other === 0 && z.cnt.c2fail === 0 && z.walk.every((w) => w > 300) && !z.loopErr, stats: which === 'char2' ? z.stats : undefined };
    runs.push(run); vals[which].push(m.fps); p95[which].push(+m.p95.toFixed(1));
    console.log('round', rnd + 1, which, run.fps, 'fps · p95', run.p95_ms, 'ms · frames', fr, '· draws', mine, '· walked', z.walk.join('/'), run.ok ? '' : 'RUN CHECK FAILED');
  }
  // reported separately: colour / cache build time at CPU 4x (char2 page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await p.goto(base); await p.waitForFunction('window.PG&&PG.ST.ready', null, { timeout: 30000, polling: 100 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await p.waitForTimeout(1000);
  const build = await p.evaluate(() => { const out = { all4_from_empty_ms: [], one_change_ms: [] }; for (let k = 0; k < 3; k++) { Char2.trim(); const t0 = performance.now(); PG.prewarmAll(); out.all4_from_empty_ms.push(+(performance.now() - t0).toFixed(1)); }
    const hs = ['red', 'silver', 'blue']; for (const h of hs) out.one_change_ms.push(+PG.setLook(0, { hair: h }).toFixed(1)); out.stats = Char2.stats(); return out; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const R = { method: 'A5: 844x390 DPR 3 · CPU 4x · warm 5 s · ' + MEAS + ' s x 3 · order alternates · median', inject: INJ || null, fps: vals, median: { pilot: +med(vals.pilot).toFixed(2), char2: +med(vals.char2).toFixed(2) },
    p95_ms: p95, p95_median_ms: { pilot: med(p95.pilot), char2: med(p95.char2) }, runs, build_cpu4x: build, errors: errs, measure_s: MEAS };
  R.ratio_char2_vs_pilot = +(R.median.char2 / R.median.pilot).toFixed(3); R.runs_ok = runs.every((r) => r.ok);
  R.pass = R.ratio_char2_vs_pilot >= 0.9 && R.runs_ok && errs.length === 0;
  console.log(JSON.stringify({ median: R.median, ratio: R.ratio_char2_vs_pilot, p95_median_ms: R.p95_median_ms, runs_ok: R.runs_ok, build_cpu4x: { all4: build.all4_from_empty_ms, change: build.one_change_ms }, pass: R.pass, errors: errs.length }));
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
