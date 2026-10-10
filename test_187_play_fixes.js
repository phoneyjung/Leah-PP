// Version 1.87 (Claude, owner's play test of 9 Oct 11:22 on a real phone, version 1.86): two fixes measured with real touches.
//   1. A finger that lands ON the corner stick steers at once, the stick follows the finger past the rim (RoV) and goes home on release — before, only a
//      slide that started on empty ground floated, and the stick under the thumb never moved.
//   2. The top-left card sits tight in the corner and small (≤ 170×95 px, 4 px from the edge, the status line above it), its goal line still ≥ 10 px,
//      the child's lamp bar below the card without overlap, the GM button below both.
// Players: a 12-year-old and a 9-year-old on a phone (844×390), a 9-year-old on an iPad (1180×820). A mouse on a computer keeps the old stick (nothing to float).
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_187_play_fixes.js   (serve the repo root first)
// Version 1.86 gives errors ≥ 6; 1.87 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-187-fixes'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
async function player(browser, w, h, touch, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 2 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
  await sleep(1200); return { ctx, pg, press };
}
const box = (pg, id) => pg.evaluate(id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, id);
const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch, age] of [['phone12', 844, 390, true, 12], ['phone9', 844, 390, true, 9], ['ipad9', 1180, 820, true, 9], ['pc12', 1180, 820, false, 12]]) {
      const { ctx, pg } = await player(browser, w, h, touch, age); const R = results[dev] = {};
      // 1. the stick
      const jb = await box(pg, 'joy'); R.joy = jb; if (!jb) { fail(dev + ': no stick'); await ctx.close(); continue; }
      const cx = jb.x + jb.w / 2, cy = jb.y + jb.h / 2, x0 = await pg.evaluate(() => Math.round(P.x));
      if (touch) { await pg.touchscreen.touchStart(cx, cy); await pg.touchscreen.touchMove(cx + 10, cy); await pg.touchscreen.touchMove(cx + 35, cy); } else { await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx + 10, cy); await pg.mouse.move(cx + 35, cy); }
      await sleep(400); R.onStick = await pg.evaluate(() => ({ on: FJ172.on, joyId: JOY.id, jx: +JOY.x.toFixed(2), moving: P.moving, left: document.getElementById('joy').style.left }));
      if (touch) await pg.touchscreen.touchMove(cx + 120, cy); else await pg.mouse.move(cx + 120, cy); await sleep(400);
      R.pastRim = await pg.evaluate(() => ({ on: FJ172.on, jx: +JOY.x.toFixed(2), left: document.getElementById('joy').style.left, px: Math.round(P.x), moving: P.moving })); await pg.screenshot({ path: out + '/' + dev + '_stick.png' });
      if (touch) await pg.touchscreen.touchEnd(); else await pg.mouse.up(); await sleep(350);
      R.released = await pg.evaluate(() => ({ on: FJ172.on, joyId: JOY.id, left: document.getElementById('joy').style.left, knob: document.getElementById('joyK').style.left, px: Math.round(P.x), moving: P.moving })); R.walked = R.released.px - x0;
      if (!R.onStick.moving || R.onStick.jx < .5) fail(dev + ': a finger on the stick did not steer: ' + JSON.stringify(R.onStick));
      if (touch) { if (!R.onStick.on) fail(dev + ': the stick under the finger did not float'); const l0 = parseFloat(R.onStick.left) || 0, l1 = parseFloat(R.pastRim.left) || 0; if (!(l1 > l0 + 40)) fail(dev + ': the stick did not follow the finger past the rim (' + R.onStick.left + ' → ' + R.pastRim.left + ')'); }
      if (R.released.on || R.released.joyId !== null || R.released.left !== '' || R.released.knob !== '36px' || R.released.moving) fail(dev + ': after release ' + JSON.stringify(R.released));
      if (R.walked < 60) fail(dev + ': walked only ' + R.walked + ' px');
      // 2. the top-left card
      const hud = await box(pg, 'hud'), sys = await box(pg, 'sys175'), lamp = await box(pg, 'lampBar'), gm = await box(pg, 'gmBtn'); R.hud = hud; R.sys = sys; R.lamp = lamp; R.gm = gm;
      R.goalFont = await pg.evaluate(() => { const g = document.getElementById('goal'); const r = g.getBoundingClientRect(); const lines = Math.max(1, Math.round(r.height / (parseFloat(getComputedStyle(g).fontSize) * 1.3 * .7))); return { px: +(parseFloat(getComputedStyle(g).fontSize) * .7).toFixed(1), h: r.height, lines }; });
      if (touch) { if (!hud || hud.x > 6 || hud.y > 20 || hud.w > 170 || hud.h > (dev === 'phone12' ? 110 : 95))   /* 2.15: Codex set 05 A2 grown-up labels (owner passed 10 Oct) — EXP 14 px makes a grown-up's card 106 px; a child's card stays ≤ 95 */ fail(dev + ': the card is not tight/small: ' + JSON.stringify(hud)); if (R.goalFont.px < 10) fail(dev + ': goal line only ' + R.goalFont.px + ' px'); }
      if (sys && hud && overlap(sys, hud)) fail(dev + ': the status line overlaps the card'); if (lamp && hud && overlap(lamp, hud)) fail(dev + ': the lamp bar overlaps the card (' + JSON.stringify(lamp) + ' vs ' + JSON.stringify(hud) + ')');
      if (lamp && hud && lamp.y < hud.b) fail(dev + ': the lamp bar is not below the card');
      await pg.screenshot({ path: out + '/' + dev + '_card.png', clip: { x: 0, y: 0, width: 320, height: 170 } });
      await ctx.close(); }
    // the GM button: a GM save, phone
    { const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await pg.setBypassServiceWorker(true);
      await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      const press = async el => { const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); }; { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(ages[6]); await press(await pg.$('#cgo')); await sleep(2300);
      for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
      await pg.evaluate(() => { S.gm = 1; try { gmBtn(); } catch (e) { } hud(); }); await sleep(600); const hud2 = await box(pg, 'hud'), gm = await box(pg, 'gmBtn'); results.gm = { hud: hud2, gm };
      if (gm && hud2 && (overlap(gm, hud2) || gm.y < hud2.b)) fail('GM: the GM button overlaps or sits above the card ' + JSON.stringify(results.gm)); await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
