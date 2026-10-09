// Version 1.86 (Claude, owner's order of 9 Oct 08:04, item ② navigation; the S16 map mockup is the model): the map page and walking across maps.
// Real taps/clicks on three players — a 12-year-old on a phone (844×390), a 12-year-old on a computer (1180×820, mouse, key M), a 9-year-old on a phone:
//   the page opens on the 5×5 blocks round the player (H9 in the middle, the "you" badge on it, 25 cells ≥ 44 px), the gold "see the whole world" button pulses
//   and a tip shows the first time; the world view dims unknown blocks and marks the player; a tap on the world goes back to the blocks; the panel lists the
//   block's maps (village · cave mouth · cave floor 1 · home) and the places of each; a tap on a place walks there (the board: arrival measured); a place on
//   another map walks across maps (village → cave mouth → cave floor 1, the crystal reached, time measured); the stone list is still there for class 5;
//   the child opens the page from the minimap and from the bag; world-map.json missing → the page still opens as a list; world-map.jpg missing → flat colours.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_186_world_map.js   (serve the repo root first)
// Version 1.85 gives errors ≥ 10 (no page); 1.86 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-186-map'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

async function player(browser, w, h, touch, age, block) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  if (block) { await pg.setRequestInterception(true); pg.on('request', r => { if (block.some(b => r.url().includes(b))) r.abort(); else r.continue(); }); }
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { const r = await el.boundingBox(); const x = r.x + r.width / 2, y = r.y + r.height / 2; if (touch) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); await sleep(320); };
  const tapAt = async (x, y) => { if (touch) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); await sleep(320); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
  await pg.evaluate(() => { S.hp = 9999; if (S.st) { S.st.agi = 0; } });
  return { ctx, pg, press, tapAt };
}
const rect = (pg, sel) => pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, shown: getComputedStyle(e).display !== 'none' && r.width > 0 }; }, sel);
const state = pg => pg.evaluate(() => ({ open: WM186.open, view: WM186.view, sel: WM186.sel, data: !!WM186.data, img: !!WM186.img, pause: PAUSE, map: M.id, cells: document.querySelectorAll('#wmCells .cell').length, you: (document.querySelector('#wmCells .cell .you') || { parentNode: {} }).parentNode.dataset ? document.querySelector('#wmCells .cell .you').parentNode.dataset.wm : null, pins: document.querySelectorAll('#wmPins .pin').length, mePins: document.querySelectorAll('#wmPins .pin.me').length, tip: !document.getElementById('wmTip').classList.contains('hide'), pulse: document.getElementById('wmWorld').classList.contains('pulse'), worldTxt: document.getElementById('wmWorld').textContent, tabs: [...document.querySelectorAll('#wmMid [data-tab]')].map(b => b.textContent.trim()), list: [...document.querySelectorAll('#wmPanel .row')].map(b => b.textContent.trim()), stageShown: getComputedStyle(document.getElementById('wmStage')).display !== 'none' }));
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(100); } return -1; };
async function tapList(pg, press, re) { const hs = await pg.$$('#wmPanel .row'); for (const h of hs) { const tx = await pg.evaluate(e => e.textContent, h); if (re.test(tx)) { await h.evaluate(e => e.scrollIntoView({ block: 'center' })); await sleep(150); await press(h); await sleep(150); const go = await pg.$('#wmGo'); if (go) await press(go); return tx.trim(); } } return null; }   /* 1.88: a row picks the place, the Navigate button walks */

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch, age] of [['phone12', 844, 390, true, 12], ['pc12', 1180, 820, false, 12], ['phone9', 844, 390, true, 9]]) {
      const { ctx, pg, press, tapAt } = await player(browser, w, h, touch, age); const R = results[dev] = {}; const kid = age < 10;
      // A. the way in: the map button for a fighter of class 1, the minimap for a child
      const bm = await rect(pg, '#bMap'); R.bMapShown = !!(bm && bm.shown); if (R.bMapShown === kid) fail(dev + ': map button shown = ' + R.bMapShown);
      if (R.bMapShown) await press(await pg.$('#bMap')); else await press(await pg.$('#mmw')); await sleep(1500);
      let st = await state(pg); R.open = { view: st.view, sel: st.sel, cells: st.cells, you: st.you, tip: st.tip, pulse: st.pulse, pause: st.pause, data: st.data, img: st.img };
      if (!st.open || st.view !== 'near' || st.sel !== 'H9') fail(dev + ': page did not open on the blocks round H9: ' + JSON.stringify(R.open));
      if (st.cells !== 25) fail(dev + ': ' + st.cells + ' cells'); if (st.you !== 'H9') fail(dev + ': the you badge is on ' + st.you);
      if (!st.tip || !st.pulse) fail(dev + ': first time: tip ' + st.tip + ' pulse ' + st.pulse); if (!st.pause) fail(dev + ': the game is not paused behind the page');
      const cell = await rect(pg, '#wmCells .cell'), wb = await rect(pg, '#wmWorld'), stg = await rect(pg, '#wmStage'); R.cell = cell; R.worldBtn = wb; R.stage = stg;
      if (!cell || cell.w < 36 || cell.h < 36) fail(dev + ': a cell is ' + (cell && cell.w.toFixed(0)) + '×' + (cell && cell.h.toFixed(0)) + ' px (want ≥ 36; the owner shrank the left map to 40% on 9 Oct 13:19)');
      if (!wb || wb.h < 36 || wb.w < 80) fail(dev + ': the world button is ' + JSON.stringify(wb)); if (Math.abs(stg.w / stg.h - 1.5) > .03) fail(dev + ': the stage is not 3:2 (' + stg.w.toFixed(0) + '×' + stg.h.toFixed(0) + ')');
      R.tabs = st.tabs; if (st.tabs.length !== 4) fail(dev + ': ' + st.tabs.length + ' map tabs in the block (want 4): ' + st.tabs.join('|'));
      R.listN = st.list.length; if (!st.list.some(x => /ปากถ้ำ|Cave mouth/.test(x))) fail(dev + ': no way to the cave mouth in the list'); if (!st.list.some(x => /บอร์ด|board/i.test(x))) fail(dev + ': no board in the list');
      if (st.list.some(x => /\?\?\?/.test(x))) fail(dev + ': "???" in the list');
      await pg.screenshot({ path: out + '/' + dev + '_near.png' });
      // B. the whole world and back
      await press(await pg.$('#wmWorld')); await sleep(500); st = await state(pg); R.world = { view: st.view, pins: st.pins, mePins: st.mePins, tip: st.tip, pulse: st.pulse };
      if (st.view !== 'world' || st.mePins !== 1 || st.tip) fail(dev + ': world view: ' + JSON.stringify(R.world)); if (st.pins < 5) fail(dev + ': only ' + st.pins + ' pins on the world');
      await pg.screenshot({ path: out + '/' + dev + '_world.png' });
      const sr = await rect(pg, '#wmStage'); { const p = await pg.evaluate(() => { const G = wmWorldGeom191(); WZ191.x = G.W / 2 - 7.5 * G.cw * WZ191.s; WZ191.y = G.H / 2 - 8.5 * G.ch * WZ191.s; wmWorldPaint191(false); return [(WZ191.x + 7.5 * G.cw * WZ191.s) / G.dpr, (WZ191.y + 8.5 * G.ch * WZ191.s) / G.dpr]; }); await tapAt(sr.x + p[0], sr.y + p[1]); }   /* the pan is clamped at the world's edge, so read H9's place back after the paint */   /* 1.91: the world pans and zooms, so bring H9 to the middle first */ await sleep(600); st = await state(pg); R.back = { view: st.view, sel: st.sel, pulse: st.pulse, tip: st.tip };
      if (st.view !== 'near' || st.sel !== 'H9') fail(dev + ': a tap on the world did not go back to the blocks: ' + JSON.stringify(R.back)); if (st.pulse || st.tip) fail(dev + ': the pulse/tip did not stop after the world was seen');
      // C. a neighbour block: tap G9 (west of H9) → the panel says locked with the reason
      const g9 = await pg.$('#wmCells .cell[data-wm="G9"]'); await press(g9); await sleep(400); R.g9 = await pg.evaluate(() => ({ sel: WM186.sel, h3: document.querySelector('#wmMid h3').textContent, note: (document.querySelector('#wmMid .note') || {}).textContent || '' }));
      if (R.g9.sel !== 'G9' || !/🔒/.test(R.g9.note)) fail(dev + ': G9 panel ' + JSON.stringify(R.g9));
      const f9 = await pg.$('#wmCells .cell[data-wm="F9"]'); await press(f9); await sleep(300); R.f9 = await pg.evaluate(() => document.querySelector('#wmMid h3').textContent); if (!/ไม่รู้จัก|Unknown/.test(R.f9)) fail(dev + ': an unknown block shows "' + R.f9 + '"');
      await press(await pg.$('#wmCells .cell[data-wm="H9"]')); await sleep(300);
      // D. walk to the board on this map
      R.board = { tapped: await tapList(pg, press, /บอร์ด|board/i) }; await sleep(300); st = await pg.evaluate(() => ({ open: WM186.open, pause: PAUSE, path: !!(P.path && P.path.length), dest: ROV180.dest && ROV180.dest.label }));
      R.board.after = st; if (st.open || st.pause || !st.path) fail(dev + ': after tapping the board: ' + JSON.stringify(st));
      R.board.ms = await waitFor(pg, () => M.board && Math.hypot(M.board.x - P.x, M.board.y + 16 - P.y) < 40, 30000); if (R.board.ms < 0) fail(dev + ': did not reach the board in 30 s');
      // E. walk across maps: the first crystal of cave floor 1 (village → cave mouth → floor 1)
      if (R.bMapShown) await press(await pg.$('#bMap')); else await press(await pg.$('#mmw')); await sleep(800);
      const tb = (await pg.$$('#wmMid [data-tab]'))[2]; await press(tb); await sleep(500); st = await state(pg); R.cave = { tab: st.tabs[2], list: st.list.slice(0, 6) };
      if (!st.list.some(x => /คริสตัล|Crystal/.test(x))) fail(dev + ': no crystal in the cave floor list');
      R.cave.tapped = await tapList(pg, press, /คริสตัล|Crystal/); await sleep(200); R.cave.route = await pg.evaluate(() => ROV180.route && ROV180.route.hops);
      if (!R.cave.route || R.cave.route.join('>') !== 'capital>cavemouth>hunt1') fail(dev + ': route ' + JSON.stringify(R.cave.route));
      const t0 = Date.now(); R.cave.mouthMs = await waitFor(pg, () => M.id === 'cavemouth', 40000); R.cave.floorMs = R.cave.mouthMs < 0 ? -1 : await waitFor(pg, () => M.id === 'hunt1', 50000);
      R.cave.arriveMs = R.cave.floorMs < 0 ? -1 : await waitFor(pg, () => ROV180.dest === null && !ROV180.route && M.id === 'hunt1' && M.crystals.some(c => Math.hypot(c.x - P.x, c.y + 14 - P.y) < 60), 40000); R.cave.totalMs = Date.now() - t0;
      if (R.cave.arriveMs < 0) fail(dev + ': the cross-map walk did not reach the crystal (mouth ' + R.cave.mouthMs + ' floor ' + R.cave.floorMs + ' arrive ' + R.cave.arriveMs + ', now on ' + await pg.evaluate(() => M.id) + ')');
      await pg.screenshot({ path: out + '/' + dev + '_cave.png' });
      // F. opened blocks are remembered; the page in the cave shows the floor tab first; a lock reason is not "???"
      if (R.bMapShown) await press(await pg.$('#bMap')); else await press(await pg.$('#mmw')); await sleep(800); st = await state(pg); R.inCave = { sel: st.sel, map: st.map, seen: await pg.evaluate(() => S.wm186.seen), tabOn: await pg.evaluate(() => (document.querySelector('#wmMid [data-tab].on') || {}).textContent) };
      if (st.sel !== 'H9' || !/ชั้น 1|floor 1/i.test(R.inCave.tabOn || '')) fail(dev + ': in the cave the page shows ' + JSON.stringify(R.inCave));
      // G. the child's bag has the map; a fighter of class 5 keeps the stone list; key M / Escape on a computer
      await pg.evaluate(() => closeModal()); await sleep(200);
      if (kid) { await press(await pg.$('#bBag')); await sleep(500); R.kidBag = await pg.evaluate(() => !!document.querySelector('#bKidMap186,#bKidMap171')); if (!R.kidBag) fail(dev + ': no map button in the child\'s bag'); await pg.evaluate(() => closeModal()); }
      else { await pg.evaluate(() => { S.rank = 5; S.stones = ['capital']; hud(); }); await sleep(300); if (R.bMapShown) await press(await pg.$('#bMap')); else await press(await pg.$('#mmw')); await sleep(800); await press(await pg.$('#wmCells .cell[data-wm="H9"]')); await sleep(300);
        R.warpBtn = !!(await pg.$('#wmMid [data-warp]')); if (!R.warpBtn) fail(dev + ': no stone-warp button for class 5'); await pg.evaluate(() => document.querySelector('#wmMid [data-warp]').scrollIntoView({ block: 'center' })); await sleep(150); await press(await pg.$('#wmMid [data-warp]')); await sleep(400); R.warpList = await pg.evaluate(() => !WM186.open && !document.getElementById('modal').classList.contains('hide') && document.querySelectorAll('#mBody [data-id]').length); if (!R.warpList) fail(dev + ': the stone list did not open'); await pg.evaluate(() => closeModal()); }
      if (!touch) { await pg.keyboard.press('m'); await sleep(600); R.keyM = await pg.evaluate(() => WM186.open); await pg.keyboard.press('Escape'); await sleep(300); R.keyEsc = await pg.evaluate(() => !WM186.open && !PAUSE); if (!R.keyM || !R.keyEsc) fail(dev + ': key M ' + R.keyM + ' Escape ' + R.keyEsc); }
      await ctx.close(); }
    // H. files missing: no world-map.json → a list; no world-map.jpg → flat colours, everything else the same
    for (const [name, block] of [['noJson', ['world-map.json']], ['noJpg', ['world-map.jpg']]]) {
      const { ctx, pg, press } = await player(browser, 844, 390, true, 12, block); const R = results[name] = {};
      await press(await pg.$('#bMap')); await sleep(1500); const st = await state(pg); R.st = { open: st.open, data: st.data, img: st.img, view: st.view, stageShown: st.stageShown, cells: st.cells, listN: st.list.length, pause: st.pause };
      if (!st.open) fail(name + ': page did not open'); if (name === 'noJson' && (st.data || st.stageShown || st.list.length < 3)) fail(name + ': ' + JSON.stringify(R.st)); if (name === 'noJpg' && (!st.data || st.img || st.cells !== 25)) fail(name + ': ' + JSON.stringify(R.st));
      R.tapped = await tapList(pg, press, /บอร์ด|board/i); await sleep(300); R.walk = await pg.evaluate(() => !WM186.open && !PAUSE && !!(P.path && P.path.length)); if (!R.walk) fail(name + ': a tap on the board did not walk');
      await pg.screenshot({ path: out + '/' + name + '.png' }); await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
