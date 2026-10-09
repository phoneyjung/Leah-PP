// Version 1.88 (Claude, owner's play test of 9 Oct 13:19 with a reference game's world map): real taps on a 12-year-old (phone 844×390 and computer
// 1180×820 mouse) and a 9-year-old (phone):
//   the map page is three columns 40·40·20 (blocks · the map with pins · the list), the page itself never scrolls, the right list scrolls on its own;
//   a tap on a person/place row (or its pin) picks it and lights the Navigate button, Navigate walks there (across maps when needed);
//   a map with monsters lists them on the right with the kinds and counts of its spawn list; the stick is 20% when idle on a phone;
//   potions never exceed the limit (99 → 10 for a class-9 level-30 player, 4 for a new one); the quest button sits beside the top-left card with a count,
//   opens the quest list (main · mail · today's missions · weekly) and each Navigate walks (the main quest: village → cave mouth).
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_188_map_columns.js   (serve the repo root first)
// Version 1.87 gives errors ≥ 10; 1.88 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-188-map'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
async function player(browser, w, h, touch, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const tapAt = async (x, y) => { if (touch) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); await sleep(320); };
  const press = async el => { const r = await el.boundingBox(); await tapAt(r.x + r.width / 2, r.y + r.height / 2); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
  await pg.evaluate(() => { S.hp = 9999; if (S.st) S.st.agi = 0; }); await sleep(600);
  return { ctx, pg, press, tapAt };
}
const quiet = pg => pg.evaluate(() => { try { closeModal(); } catch (e) { } if (DLG) { DLG = null; document.getElementById('dlg').classList.add('hide'); } PAUSE = false; });
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(100); } return -1; };
const box = (pg, sel) => pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch, age] of [['phone12', 844, 390, true, 12], ['pc12', 1180, 820, false, 12], ['phone9', 844, 390, true, 9]]) {
      const { ctx, pg, press, tapAt } = await player(browser, w, h, touch, age); const R = results[dev] = {}; const kid = age < 10;
      // A. the stick 20% idle (phone), potions capped, the quest button beside the card
      R.joyOpacity = await pg.evaluate(() => +getComputedStyle(document.getElementById('joy')).opacity); if (touch && Math.abs(R.joyOpacity - .2) > .02) fail(dev + ': stick idle opacity ' + R.joyOpacity);
      R.pot = await pg.evaluate(async () => { const o = {}; S.potions = 99; await new Promise(r => setTimeout(r, 400)); o.newPlayer = S.potions; o.max1 = potMax181(); S.rank = 9; S.lv = 30; S.potions = 99; await new Promise(r => setTimeout(r, 400)); o.class9lv30 = S.potions; o.max2 = potMax181(); S.rank = 1; S.lv = 1; S.potions = 2; return o; });
      if (R.pot.newPlayer !== R.pot.max1 || R.pot.class9lv30 !== R.pot.max2 || R.pot.max2 !== 10) fail(dev + ': potion cap ' + JSON.stringify(R.pot));   /* 4 + 3 classes + 3 per 10 levels = 10; the owner's GM at level 50 sees 12 */
      await pg.evaluate(() => hud()); await sleep(300); const hud = await box(pg, '#hud'), qb = await box(pg, '#bQLog188'); R.questBtn = { hud, qb, badge: await pg.evaluate(() => document.getElementById('bQLog188').querySelector('b').textContent), shown: await pg.evaluate(() => getComputedStyle(document.getElementById('bQLog188')).display !== 'none') };
      if (!qb || !R.questBtn.shown || qb.w < 44 || qb.h < 44 || qb.x < hud.r || Math.abs(qb.y - hud.y) > 4) fail(dev + ': quest button ' + JSON.stringify(R.questBtn)); if (!(+R.questBtn.badge >= 1)) fail(dev + ': quest count "' + R.questBtn.badge + '"');
      // B. the quest list: the main quest first, Navigate walks (village → cave mouth)
      await press(await pg.$('#bQLog188')); await sleep(600); R.qlog = await pg.evaluate(() => [...document.querySelectorAll('.ql188')].map(q => ({ t: q.textContent.trim().slice(0, 40), nav: !!q.querySelector('[data-ql]') })));
      if (!R.qlog.length || !/🎯/.test(R.qlog[0].t) || !R.qlog[0].nav) fail(dev + ': quest list ' + JSON.stringify(R.qlog.slice(0, 2))); if (R.qlog.length !== +R.questBtn.badge) fail(dev + ': badge ' + R.questBtn.badge + ' vs rows ' + R.qlog.length);
      await pg.screenshot({ path: out + '/' + dev + '_qlog.png' }); await press(await pg.$('[data-ql="0"]')); await sleep(400); R.qlogWalk = await pg.evaluate(() => ({ modal: !document.getElementById('modal').classList.contains('hide'), route: ROV180.route && ROV180.route.hops, path: !!(P.path && P.path.length) }));
      if (R.qlogWalk.modal || !R.qlogWalk.path || !R.qlogWalk.route || R.qlogWalk.route[1] !== 'cavemouth') fail(dev + ': quest Navigate ' + JSON.stringify(R.qlogWalk));
      R.mouthMs = await waitFor(pg, () => M.id === 'cavemouth', 40000); if (R.mouthMs < 0) fail(dev + ': did not reach the cave mouth'); await sleep(500); await quiet(pg); await pg.evaluate(() => { P.path = null; ROV180.route = null; ROV180.dest = null; });
      // C. the map page: three columns, no page scroll, the list on the right with people, places and monsters
      await press(await pg.$(kid ? '#mmw' : '#bMap')); await sleep(1500);
      R.cols = await pg.evaluate(() => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }; const main = r('#wm186 .main'); return { main, c1: r('.c1'), c2: r('.c2'), c3: r('.c3'), stage: r('#wmStage'), thumb: document.querySelector('.thumb') ? r('.thumb') : null, pageScroll: [document.getElementById('wm186').scrollHeight, document.getElementById('wm186').clientHeight], panelScroll: [document.getElementById('wmPanel').scrollHeight, document.getElementById('wmPanel').clientHeight], rows: document.querySelectorAll('#wmPanel .row').length, npcSec: !!document.querySelector('#wmPanel .sec'), mons: [...document.querySelectorAll('#wmPanel .mon')].map(m => m.textContent.trim()), spawns: (M.spawns || []).reduce((o, s) => (o[s.kind] = (o[s.kind] || 0) + 1, o), {}), pins: document.querySelectorAll('[data-pin]').length, go: document.getElementById('wmGo').disabled }; });
      const C = R.cols, tot = C.c1.w + C.c2.w + C.c3.w; R.ratio = [C.c1.w / tot, C.c2.w / tot, C.c3.w / tot].map(v => +(v * 100).toFixed(1));
      if (Math.abs(R.ratio[0] - 40) > 3 || Math.abs(R.ratio[1] - 40) > 3 || Math.abs(R.ratio[2] - 20) > 3) fail(dev + ': columns ' + R.ratio.join('/') + ' (want 40/40/20)');
      if (C.pageScroll[0] > C.pageScroll[1] + 1) fail(dev + ': the page scrolls (' + C.pageScroll + ')'); if (C.c3.h < C.main.h - 2 || C.c2.h < C.main.h - 2) fail(dev + ': columns do not fill the height');
      if (!C.thumb || C.thumb.x < C.c2.x - 1 || C.thumb.w > C.c2.w + 1 || C.thumb.b > C.c2.y + C.c2.h + 1) fail(dev + ': the map thumbnail is not inside the middle column ' + JSON.stringify(C.thumb));
      if (Math.abs(C.stage.w / C.stage.h - 1.5) > .03 || C.stage.w > C.c1.w + 1) fail(dev + ': the blocks stage ' + JSON.stringify(C.stage));
      if (C.rows < 3 || !C.go) fail(dev + ': the list has ' + C.rows + ' rows, Navigate disabled ' + C.go);
      const want = Object.entries(C.spawns).map(([k, n]) => n); R.monsCheck = { listed: C.mons, spawns: C.spawns }; if (!C.mons.length || C.mons.length !== want.length || !want.every(n => C.mons.some(m => m.includes('×' + n)))) fail(dev + ': monsters on the right ' + JSON.stringify(R.monsCheck));
      if (!kid && !C.mons.every(m => /เลือด|HP/.test(m))) fail(dev + ': a fighter sees no HP on the monsters'); if (kid && C.mons.some(m => /เลือด|HP/.test(m))) fail(dev + ': a child sees monster HP');
      // C2. the lower left under the blocks (owner, 14:07): a small whole-world picture with the 5×5 frame and your dot, the block name, the exploration bar; a tap swaps world ↔ blocks
      R.ov = await pg.evaluate(() => { const o = document.getElementById('wmOv'), r = o.getBoundingClientRect(), c = o.querySelector('canvas').getBoundingClientRect(); return { on: o.classList.contains('on'), h: r.height, cw: c.width, ch: c.height, name: document.getElementById('wmOvName').textContent, n: document.getElementById('wmOvN').textContent, bar: document.getElementById('wmOvBar').style.width, inCol: r.x >= document.querySelector('.c1').getBoundingClientRect().x - 1 && r.bottom <= document.querySelector('.c1').getBoundingClientRect().bottom + 1 }; });
      if (!R.ov.on || R.ov.h < 40 || R.ov.cw < 60 || !R.ov.inCol || !/⭐/.test(R.ov.name) || !/1 \/ \d+/.test(R.ov.n) || !R.ov.bar) fail(dev + ': overview ' + JSON.stringify(R.ov));
      await press(await pg.$('#wmOv canvas')); await sleep(500); R.ovTap = await pg.evaluate(() => WM186.view);
      // C3. the whole world fills the page (owner, 14:19): the two other columns hidden, the stage at least 90% of the row's width or height, 3:2
      R.world = await pg.evaluate(() => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, shown: getComputedStyle(e).display !== 'none' && b.width > 0 }; }; return { main: r('#wm186 .main'), stage: r('#wmStage'), c2: r('.c2'), c3: r('.c3'), cls: document.getElementById('wm186').classList.contains('world') }; });
      { const m = R.world.main, st = R.world.stage; if (!R.world.cls || R.world.c2.shown || R.world.c3.shown || st.w < m.w * .95 || st.h < m.h * .95) fail(dev + ': the world view does not fill the page ' + JSON.stringify(R.world)); }
      // C4. a phone map (owner, 14:26): pinch zooms, drag pans, + − buttons, a tap picks the block under the finger
      R.zoom = await pg.evaluate(() => ({ s: +WZ191.s.toFixed(3), min: +WZ191.min.toFixed(3), max: +WZ191.max.toFixed(3), x: Math.round(WZ191.x), y: Math.round(WZ191.y), zb: document.querySelectorAll('#wmStage .zb').length }));
      if (R.zoom.zb !== 2 || R.zoom.s < R.zoom.min || R.zoom.s > R.zoom.max) fail(dev + ': zoom state ' + JSON.stringify(R.zoom));
      { const sr0 = R.world.stage, cx = sr0.x + sr0.w / 2, cy = sr0.y + sr0.h / 2; if (touch) { await pg.touchscreen.touchStart(cx, cy); await pg.touchscreen.touchMove(cx - 40, cy - 20); await pg.touchscreen.touchMove(cx - 100, cy - 50); await pg.touchscreen.touchEnd(); } else { await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx - 40, cy - 20); await pg.mouse.move(cx - 100, cy - 50); await pg.mouse.up(); } await sleep(300);
        R.drag = await pg.evaluate(() => ({ view: WM186.view, x: Math.round(WZ191.x), y: Math.round(WZ191.y) })); if (R.drag.view !== 'world' || (R.drag.x === R.zoom.x && R.drag.y === R.zoom.y)) fail(dev + ': a drag did not pan (or left the world) ' + JSON.stringify(R.drag));
        if (touch) { const cdp = await pg.createCDPSession(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 30, y: cy, id: 1 }, { x: cx + 30, y: cy, id: 2 }] }); for (let i = 1; i <= 4; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 30 - i * 10, y: cy, id: 1 }, { x: cx + 30 + i * 10, y: cy, id: 2 }] }); await sleep(40); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(300); }
        else { await pg.mouse.move(cx, cy); await pg.mouse.wheel({ deltaY: -200 }); await sleep(300); }
        R.pinch = await pg.evaluate(() => +WZ191.s.toFixed(3)); if (!(R.pinch > R.zoom.s * 1.2)) fail(dev + ': pinch/wheel did not zoom in (' + R.zoom.s + ' → ' + R.pinch + ')');
        await press(await pg.$('#wmStage .zb.out')); await sleep(300); R.zoomOut = await pg.evaluate(() => +WZ191.s.toFixed(3)); if (!(R.zoomOut < R.pinch)) fail(dev + ': the − button did not zoom out'); await pg.screenshot({ path: out + '/' + dev + '_zoom.png' }); }
      await pg.screenshot({ path: out + '/' + dev + '_world.png' });
      { const sr = R.world.stage; const p = await pg.evaluate(() => { const G = wmWorldGeom191(); return [(WZ191.x + 7.5 * G.cw * WZ191.s) / G.dpr, (WZ191.y + 8.5 * G.ch * WZ191.s) / G.dpr]; }); if (p[0] < 0 || p[1] < 0 || p[0] > sr.w || p[1] > sr.h) { const q = await pg.evaluate(() => { const G = wmWorldGeom191(); WZ191.x = G.W / 2 - 7.5 * G.cw * WZ191.s; WZ191.y = G.H / 2 - 8.5 * G.ch * WZ191.s; wmWorldPaint191(false); return [(WZ191.x + 7.5 * G.cw * WZ191.s) / G.dpr, (WZ191.y + 8.5 * G.ch * WZ191.s) / G.dpr]; }); p[0] = q[0]; p[1] = q[1]; } await tapAt(sr.x + p[0], sr.y + p[1]); } await sleep(600); R.ovTap2 = await pg.evaluate(() => ({ view: WM186.view, c3: getComputedStyle(document.querySelector('.c3')).display !== 'none', cls: document.getElementById('wm186').classList.contains('world'), sel: WM186.sel }));
      if (R.ovTap !== 'world' || R.ovTap2.view !== 'near' || !R.ovTap2.c3 || R.ovTap2.cls || R.ovTap2.sel !== 'H9') fail(dev + ': world ↔ blocks ' + R.ovTap + ' / ' + JSON.stringify(R.ovTap2));
      await pg.screenshot({ path: out + '/' + dev + '_map.png' });
      // D. pick a row → the button lights and names it; the pin lights; Navigate walks; a pin tap picks too
      const rows = await pg.$$('#wmPanel .row'); let picked = null; for (const r0 of rows) { const tx = await pg.evaluate(e => e.textContent, r0); if (/คริสตัล|Crystal/.test(tx)) { await r0.evaluate(e => e.scrollIntoView({ block: 'center' })); await sleep(150); await press(r0); picked = tx.trim(); break; } }
      R.pick = await pg.evaluate(() => ({ pick: WM186.pick && WM186.pick.label, go: document.getElementById('wmGo').textContent, dis: document.getElementById('wmGo').disabled, on: document.querySelectorAll('#wmPanel .row.on').length, sel: document.querySelectorAll('[data-pin].sel').length }));
      if (!picked || !R.pick.pick || R.pick.dis || R.pick.on !== 1 || R.pick.sel !== 1 || !/คริสตัล|Crystal/.test(R.pick.go)) fail(dev + ': picking a row ' + JSON.stringify(R.pick));
      await pg.screenshot({ path: out + '/' + dev + '_pick.png' });
      const pin = await pg.$('[data-pin]:not(.me)'); if (pin) { await press(pin); await sleep(200); R.pinPick = await pg.evaluate(() => ({ on: document.querySelectorAll('#wmPanel .row.on').length, pick: WM186.pick && WM186.pick.label })); if (R.pinPick.on !== 1) fail(dev + ': a pin tap did not pick ' + JSON.stringify(R.pinPick)); }
      await press(await pg.$('#wmGo')); await sleep(400); R.go = await pg.evaluate(() => ({ open: WM186.open, pause: PAUSE, path: !!(P.path && P.path.length) })); if (R.go.open || R.go.pause || !R.go.path) fail(dev + ': Navigate ' + JSON.stringify(R.go));
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
