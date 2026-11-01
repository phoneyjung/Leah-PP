// G2.6 A5 (Claude · 1 Nov 2569): FPS with the NEW kid sprite vs the OLD 2.33 sprite in the SAME scene page, same path, same lantern/light work.
// Only the kid picture changes (?oldkid draws game 2.33 kid-bob sheets instead of the c2 sheets). Plan G2.0 table A: 844x390 DPR 3,
// warm 5 s, measure 30 s, 3 rounds each (order alternates), median; CPU 4x like the G11 / S8h method. Pass: new >= 90 % of old.
// The kid walks back and forth between 2 fixed cells the whole time (field, lantern held, slimes moving).
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_fps.js [OUT.json] [measure_s]
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8792, MEAS = +(process.argv[3] || 30), base = 'http://127.0.0.1:' + PORT + '/pilot-g2-scene.html?gm';
const FPS = (ms) => `new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<${ms})requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})`;
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const cdp = await ctx.newCDPSession(p); const vals = { old: [], new: [] }, info = {};
  for (let rnd = 0; rnd < 3; rnd++) for (const which of rnd % 2 ? ['new', 'old'] : ['old', 'new']) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.goto(base + (which === 'old' ? '&oldkid' : '')); await p.waitForFunction('window.PS&&PS.ST.ready', null, { timeout: 30000 });
    info[which] = await p.evaluate(() => ({ old_sheets: !!PS.ST.img.oldWalk, files: Object.keys(PS.ST.files) }));
    await p.evaluate(() => { PS.teleport(16, 11, 'N'); let a = 0; const pts = [[26, 10], [16, 11]]; PS.goto(...pts[0]);
      window.__bf = setInterval(() => { if (!PS.ST.auto && !PS.ST.moving) { a = 1 - a; PS.goto(...pts[a]); } }, 100); });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.waitForTimeout(5000);                                   // warm up 5 s
    const walkedBefore = await p.evaluate(() => [PS.ST.pos.x, PS.ST.pos.y]);
    vals[which].push(await p.evaluate(FPS(MEAS * 1000)));
    const walkedAfter = await p.evaluate(() => [PS.ST.pos.x, PS.ST.pos.y, PS.ST.anim]);
    info[which + '_moving'] = JSON.stringify(walkedBefore) !== JSON.stringify(walkedAfter.slice(0, 2)) || walkedAfter[2] === 'walk';
    console.log('round', rnd + 1, which, vals[which][vals[which].length - 1].toFixed(2), 'fps');
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const R = { fps: vals, median: { old: +med(vals.old).toFixed(2), new: +med(vals.new).toFixed(2) }, info, errors: errs, measure_s: MEAS };
  R.ratio_new_vs_old = +(R.median.new / R.median.old).toFixed(3); R.pass = R.ratio_new_vs_old >= 0.9 && errs.length === 0 && info.old.old_sheets && !info.new.old_sheets;
  console.log(JSON.stringify({ median: R.median, ratio: R.ratio_new_vs_old, pass: R.pass, errors: errs.length, old_sheets_used: info.old.old_sheets }));
  if (process.argv[2]) require('fs').writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
