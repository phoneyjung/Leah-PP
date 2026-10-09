// Version 1.99 (owner 9 Oct 17:07 "แผนที่ซ้ายบน อยากให้เป็นแบบที่คุยไว้อีกแชท"): the 5×5 block grid of the map page in the style of the other chat's world-map mockup.
// Real taps on a phone (844×390) and an iPad (1180×820), an adult (level 1, then 30), a child of 7, and a phone with the 16 plan files blocked:
//   25 cells, each painted with its own block of the drawn plan (wm-draft-X-Y.webp) · the you mark on H9 · open blocks: a level badge whose colour follows the rule
//   (level 1: Lv.1–3 green "right for you" · level 30: the same block grey "too easy" · a chapter-2 block opened at level 1: red/yellow) · towns: "safe" · a child sees ★ instead of levels
//   · blocks not open: a lock, the chapter and "???" · four arrows on the grid's edges (a real tap on ▶ moves the window 2 blocks east) · the legend under the grid has 8 entries (child 5)
//   · with the plan files missing: no page error, no plan picture, the world painting underneath, the grid still works.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_199_map_grid.js   (serve the repo root first)
// Version 1.98 gives errors ≥ 6 here; 1.99 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-199-grid'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, age, block] of [['phone', 844, 390, 30, false], ['ipad', 1180, 820, 30, false], ['kid', 844, 390, 7, false], ['noPlan', 844, 390, 30, true]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); const R = results[dev] = {};
      pg.on('pageerror', e => fail(dev + ' page error: ' + e.message));
      await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await pg.setBypassServiceWorker(true);
      if (block) { await pg.setRequestInterception(true); pg.on('request', r => { if (r.url().includes('wm-draft-')) r.abort(); else r.continue(); }); }
      await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      const press = async el => { const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(350); };
      { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } }
      const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
      // setup: blocks the player has walked into (the game opens a block on arrival) and the level
      await pg.evaluate(() => { while (DLG) nextLine(); try { closeModal(); } catch (e) { } PAUSE = false; S.wm186 = { seen: ['H9', 'G9', 'H10', 'I9', 'H8', 'G10', 'I10', 'G8'], world: 1, tip: 1 }; S.lv = 1; });
      await pg.evaluate(() => openWorldMap186()); await sleep(1500);
      const grid = () => pg.evaluate(() => { const cs = [...document.querySelectorAll('#wmCells .cell')]; const one = id => { const c = document.querySelector('#wmCells .cell[data-wm="' + id + '"]'); if (!c) return null; const lv = c.querySelector('.lv199'); return { cls: c.className, lv: lv ? lv.className.replace('lv199 ', '') + ':' + lv.textContent : null, lock: !!c.querySelector('.lock199'), nm: (c.querySelector('.nm') || {}).textContent, plan: /wm-draft/.test(c.style.backgroundImage), real: /map-H9|map-G9/.test(c.style.backgroundImage), marks: [...c.querySelectorAll('.mk199')].map(m => m.classList.contains('you') ? 'you' : m.classList[m.classList.length - 1]) }; };
        return { n: cs.length, c199: cs.filter(c => c.classList.contains('c199')).length, plan: cs.filter(c => /wm-draft/.test(c.style.backgroundImage)).length, you: (document.querySelector('#wmCells .cell .you') || { parentNode: { dataset: {} } }).parentNode.dataset.wm, H9: one('H9'), H10: one('H10'), G8: one('G8'), J9: one('J9'), pe: [...document.querySelectorAll('#wmStage .pe199')].filter(e => getComputedStyle(e).display !== 'none').length, legend: document.querySelectorAll('#wmLegend > span').length, cx: WM186.cx, cy: WM186.cy }; });
      R.a = await grid(); await pg.screenshot({ path: out + '/' + dev + '_grid.png' });
      if (R.a.n !== 25 || R.a.c199 !== 25 || R.a.you !== 'H9') fail(dev + ': grid ' + JSON.stringify({ n: R.a.n, c199: R.a.c199, you: R.a.you }));
      if (block) { if (R.a.plan !== 0) fail('noPlan: ' + R.a.plan + ' cells still ask for the plan picture'); }
      else if (R.a.plan < 23) fail(dev + ': only ' + R.a.plan + ' cells have their plan picture');
      if (!R.a.H9 || !R.a.H9.marks.includes('you') || !R.a.H9.marks.includes('town') || !R.a.H9.marks.includes('cave') || (!block && !R.a.H9.real)) fail(dev + ': H9 ' + JSON.stringify(R.a.H9));
      if (!R.a.J9 || !R.a.J9.lock || R.a.J9.nm !== '???' || R.a.J9.lv) fail(dev + ': a block not open ' + JSON.stringify(R.a.J9));
      if (age < 10) {
        if (!/d-safe:★/.test(R.a.H10.lv || '') || /Lv/.test(JSON.stringify(R.a))) fail('kid: stars instead of levels ' + JSON.stringify(R.a.H10));
        if (R.a.legend !== 5) fail('kid: legend has ' + R.a.legend + ' entries (want 5)');
      } else {
        if (R.a.H9.lv !== 'd-safe:ปลอดภัย') fail(dev + ': the town badge ' + R.a.H9.lv);
        if (R.a.H10.lv !== 'd-ok:Lv.1–3') fail(dev + ': H10 at level 1 ' + R.a.H10.lv);
        if (!/^d-(bad|warn):Lv\.1[1-9]/.test(R.a.G8.lv || '')) fail(dev + ': a chapter-2 block at level 1 ' + R.a.G8.lv);
        if (R.a.legend !== 8) fail(dev + ': legend has ' + R.a.legend + ' entries (want 8)');
        await pg.evaluate(() => { S.lv = 30; wmDraw186(); }); await sleep(300); R.lv30 = (await grid()).H10.lv; if (R.lv30 !== 'd-grey:Lv.1–3') fail(dev + ': H10 at level 30 ' + R.lv30);
      }
      if (R.a.pe !== 4) fail(dev + ': ' + R.a.pe + ' edge arrows (want 4)');
      await press(await pg.$('#wmStage .pe199.e')); await sleep(400); R.east = await pg.evaluate(() => [WM186.cx, WM186.cy]); if (R.east[0] !== R.a.cx + 2 || R.east[1] !== R.a.cy) fail(dev + ': ▶ moved the window to ' + R.east + ' from ' + [R.a.cx, R.a.cy]);
      await press(await pg.$('#wmStage .pe199.w')); await sleep(400);
      await press(await pg.$('#wmCells .cell[data-wm="H10"]')); await sleep(400); R.sel = await pg.evaluate(() => ({ sel: WM186.sel, dashed: getComputedStyle(document.querySelector('#wmCells .cell[data-wm="H10"]')).outlineStyle })); if (R.sel.sel !== 'H10' || R.sel.dashed !== 'dashed') fail(dev + ': picking a block ' + JSON.stringify(R.sel));
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
