// Version 1.72 (Claude, on the owner's order of 8 Oct): the floating stick, tap-to-walk at the same time, and W A S D on a computer.
// Real touches and real key presses. Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_172_float_joy.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-172-float-joy'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// a brand-new 7-year-old made with real taps in the creator (?rank=1: no automation shortcuts)
async function child(browser, w, h, touch) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  await press((await pg.$$('#ca button'))[1]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg'));
  await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(2800);   // let the start-up hint pass
  return { ctx, pg };
}
// a screen point on open ground near the player, with nothing to tap on (no person, crystal, board, bed, monster)
const groundPoint = (pg, dx, dy) => pg.evaluate((dx, dy) => { const dpr = devicePixelRatio || 1, sx = (P.x - camX) * SC / dpr, sy = (P.y - camY) * SC / dpr;
  for (const [ax, ay] of [[dx, dy], [-dx, dy], [dx, -dy], [-dx, -dy], [dx * 1.5, 0], [-dx * 1.5, 0], [0, dy * 1.4], [0, -dy * 1.4]]) {
    const x = sx + ax, y = sy + ay; if (x < 160 || x > innerWidth - 180 || y < 110 || y > innerHeight - 70) continue;
    const el = document.elementFromPoint(x, y); if (!el || el.id !== 'c') continue;
    const wx = x * dpr / SC + camX, wy = y * dpr / SC + camY; if (!walkable(M, Math.floor(wx / T), Math.floor(wy / T))) continue;
    const busy = [...(M.npcs || []), ...(M.crystals || []), ...(MONS || [])].some(o => Math.hypot(o.x - wx, o.y - wy) < 70) || (M.board && Math.hypot(M.board.x - wx, M.board.y - wy) < 70);
    if (!busy) return { x: Math.round(x), y: Math.round(y) }; }
  return null; }, dx, dy);
const state = pg => pg.evaluate(() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(), k = document.getElementById('joyK').getBoundingClientRect();
  return { px: P.x, py: P.y, path: !!(P.path && P.path.length), joyId: JOY.id, jx: Math.round(r.left + r.width / 2), jy: Math.round(r.top + r.height / 2), kx: Math.round(k.left + k.width / 2), ky: Math.round(k.top + k.height / 2), shown: getComputedStyle(j).display !== 'none' && !j.classList.contains('hide'), op: +getComputedStyle(j).opacity }; });

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [name, w, h] of [['phone', 844, 390], ['ipad', 1180, 820]]) {
      const { ctx, pg } = await child(browser, w, h, true), r = {};
      const home = await state(pg); r.homeStick = { x: home.jx, y: home.jy, shown: home.shown, opacity: home.op };
      if (!home.shown) fail(name + ': the stick is not shown in its corner on a touch screen');
      // 1. a quick tap walks to that spot; the stick stays in its corner
      const g = await groundPoint(pg, 150, 70); if (!g) { fail(name + ': no free ground to tap'); await ctx.close(); continue; }
      const t0 = await state(pg); await pg.touchscreen.tap(g.x, g.y); await sleep(1200); const t1 = await state(pg);
      r.tap = { at: g, walkedPx: Math.round(Math.hypot(t1.px - t0.px, t1.py - t0.py)), stickMoved: !near(t1.jx, home.jx, 2) || !near(t1.jy, home.jy, 2) };
      if (r.tap.walkedPx < 24) fail(name + ': a tap on the ground walked ' + r.tap.walkedPx + ' px'); if (r.tap.stickMoved) fail(name + ': a tap moved the stick');
      await sleep(1500);
      // 2. touch and slide anywhere: the stick appears under the finger and steers
      const s = await groundPoint(pg, 120, 60); const a0 = await state(pg);
      await pg.touchscreen.touchStart(s.x, s.y); await sleep(80); await pg.touchscreen.touchMove(s.x + 10, s.y); await pg.touchscreen.touchMove(s.x + 30, s.y); await sleep(900);
      const a1 = await state(pg); await pg.screenshot({ path: path.join(out, name + '-sliding.png') });
      r.slide = { start: s, stickCentre: [a1.jx, a1.jy], knobOffsetX: a1.kx - a1.jx, movedX: Math.round(a1.px - a0.px), movedY: Math.round(a1.py - a0.py), opacity: a1.op, pathLeft: a1.path };
      if (!near(a1.jx, s.x, 3) || !near(a1.jy, s.y, 3)) fail(name + ': the stick appeared at ' + a1.jx + ',' + a1.jy + ', the finger went down at ' + s.x + ',' + s.y);
      if (r.slide.knobOffsetX < 20) fail(name + ': the knob moved ' + r.slide.knobOffsetX + ' px toward the finger');
      if (r.slide.movedX < 24 || Math.abs(r.slide.movedY) > 16) fail(name + ': sliding right moved the player ' + r.slide.movedX + ' px right and ' + r.slide.movedY + ' px down');
      if (a1.path) fail(name + ': the walk started by the touch was not dropped when the slide began');
      if (a1.op < .95) fail(name + ': the stick is faded (' + a1.op + ') while in use');
      // 3. past the rim the stick follows the finger
      await pg.touchscreen.touchMove(s.x + 150, s.y); await sleep(250); const a2 = await state(pg);
      r.follow = { stickCentre: [a2.jx, a2.jy], fingerToCentre: Math.round(Math.hypot(s.x + 150 - a2.jx, s.y - a2.jy)) };
      if (!near(r.follow.fingerToCentre, 40, 3)) fail(name + ': past the rim the finger is ' + r.follow.fingerToCentre + ' px from the stick centre, expected 40');
      // 4. lift the finger: the player stops and the stick goes back to its corner
      await pg.touchscreen.touchEnd(); await sleep(300); const a3 = await state(pg); await sleep(500); const a4 = await state(pg);
      r.release = { stickBackHome: near(a4.jx, home.jx, 2) && near(a4.jy, home.jy, 2), joyId: a4.joyId, driftPx: Math.round(Math.hypot(a4.px - a3.px, a4.py - a3.py)), opacity: a4.op };
      if (!r.release.stickBackHome) fail(name + ': after lifting, the stick is at ' + a4.jx + ',' + a4.jy + ', its corner is ' + home.jx + ',' + home.jy);
      if (a4.joyId !== null) fail(name + ': the stick still holds the finger after lifting'); if (r.release.driftPx > 4) fail(name + ': the player kept moving ' + r.release.driftPx + ' px after lifting');
      // 5. the stick in its corner still works by itself
      const c0 = await state(pg); await pg.touchscreen.touchStart(home.jx, home.jy); await pg.touchscreen.touchMove(home.jx, home.jy - 35); await sleep(700); const c1 = await state(pg); await pg.touchscreen.touchEnd(); await sleep(300);
      r.cornerStick = { movedUp: Math.round(c0.py - c1.py), stickStayed: near(c1.jx, home.jx, 2) && near(c1.jy, home.jy, 2) };
      if (r.cornerStick.movedUp < 16) fail(name + ': the corner stick moved the player ' + r.cornerStick.movedUp + ' px up'); if (!r.cornerStick.stickStayed) fail(name + ': using the corner stick moved it');
      // 6. stick switched off in settings: a slide no longer makes a stick
      if (name === 'phone') { await pg.evaluate(() => { S.joy = false; document.getElementById('joy').classList.add('hide'); }); const s2 = await groundPoint(pg, 120, 60);
        await pg.touchscreen.touchStart(s2.x, s2.y); await pg.touchscreen.touchMove(s2.x + 40, s2.y); await sleep(300); const o = await pg.evaluate(() => ({ joyId: JOY.id, on: document.body.classList.contains('fjOn172') })); await pg.touchscreen.touchEnd();
        r.stickOff = o; if (o.joyId !== null || o.on) fail('stick switched off: a slide still made a stick'); await pg.evaluate(() => { S.joy = true; document.getElementById('joy').classList.remove('hide'); }); }
      results[name] = r; await ctx.close();
    }
    // 7. two fingers (pinch) never make a stick
    { const { ctx, pg } = await child(browser, 844, 390, true), cdp = await pg.createCDPSession(), s = await groundPoint(pg, 120, 60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: s.y, id: 1 }, { x: s.x + 60, y: s.y, id: 2 }] }); await sleep(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: s.x - 30, y: s.y, id: 1 }, { x: s.x + 90, y: s.y, id: 2 }] }); await sleep(250);
      const o = await pg.evaluate(() => ({ joyId: JOY.id, on: document.body.classList.contains('fjOn172') })); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      results.pinch = o; if (o.joyId !== null || o.on) fail('two fingers made a stick'); await ctx.close(); }
    // 8. computer: no stick, W A S D (also with a Thai keyboard layout and Caps Lock), arrows, click to walk
    { const { ctx, pg } = await child(browser, 1366, 768, false), r = {};
      r.stickShown = (await state(pg)).shown; if (r.stickShown) fail('computer: the stick is on the screen');
      for (const [label, key, code] of [['d', 'd', 'KeyD'], ['Thai ก (D key)', 'ก', 'KeyD'], ['Caps D', 'D', 'KeyD'], ['ArrowLeft', 'ArrowLeft', 'ArrowLeft']]) {
        const before = await state(pg); await pg.evaluate((key, code) => dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true })), key, code); await sleep(600);
        await pg.evaluate((key, code) => dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true })), key, code); await sleep(250); const after = await state(pg);
        const dx = Math.round(after.px - before.px); r[label] = dx; const want = code === 'ArrowLeft' ? -1 : 1; if (dx * want < 20) fail('computer: key ' + label + ' moved the player ' + dx + ' px'); }
      const g = await groundPoint(pg, 160, 90), b = await state(pg); await pg.mouse.click(g.x, g.y); await sleep(1200); const a = await state(pg);
      r.clickWalkPx = Math.round(Math.hypot(a.px - b.px, a.py - b.py)); if (r.clickWalkPx < 24) fail('computer: a click on the ground walked ' + r.clickWalkPx + ' px');
      r.hint = await pg.evaluate(() => (document.getElementById('msg') || {}).textContent || ''); await pg.screenshot({ path: path.join(out, 'computer.png') });
      results.computer = r; await ctx.close(); }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
