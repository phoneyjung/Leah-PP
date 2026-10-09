// Version 1.87 (Claude, owner's order of 9 Oct 08:04, item ③ the main quest): one goal at a time with a place in the world.
// Real taps on a 9-year-old and a 12-year-old (phone 844×390) and a 12-year-old on a computer (mouse):
//   the goal line names the next class task; a tap on it walks there across maps (village → cave mouth, arrival at a sleeping crystal measured);
//   the guide picker (hold the guide button, 10+) lists the goal first; the map page has a goal strip with a walk button for every age;
//   in the cave the goal line says the same step; a gold "!" bobs over the place (pixels measured) and is gone once you stand there;
//   waking that crystal moves the place to the next sleeping one; step 5 (fishing) points at the fishing spot; steps past today's world open the class panel.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_187_main_quest.js   (serve the repo root first)
// Version 1.86 gives errors ≥ 8; 1.87 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-187-quest'; fs.mkdirSync(out, { recursive: true });
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
  const ages = await pg.$$('#ca button'); await press(ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
  await pg.evaluate(() => { S.hp = 9999; if (S.st) S.st.agi = 0; });
  return { ctx, pg, press, tapAt };
}
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(100); } return -1; };
const quiet = pg => pg.evaluate(() => { try { closeModal(); } catch (e) { } if (DLG) { DLG = null; document.getElementById('dlg').classList.add('hide'); } PAUSE = false; });
// gold pixels in a screen rectangle (the marker is #ffd45e on a dark outline)
async function gold(pg, r) { const buf = await pg.screenshot({ clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.max(1, Math.round(r.w)), height: Math.max(1, Math.round(r.h)) }, encoding: 'base64' });
  return pg.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 225 && d[i + 1] > 180 && d[i + 1] < 235 && d[i + 2] < 140) n++; return n; }, buf); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch, age] of [['phone9', 844, 390, true, 9], ['phone12', 844, 390, true, 12], ['pc12', 1180, 820, false, 12]]) { if (process.env.ONLY && process.env.ONLY !== dev) continue;
      const { ctx, pg, press, tapAt } = await player(browser, w, h, touch, age); const R = results[dev] = {}; const kid = age < 10;
      // A. the goal line and the place of step 2
      R.goal = await pg.evaluate(() => { const e = document.getElementById('goal'), r = e.getBoundingClientRect(); return { txt: e.textContent, shown: getComputedStyle(e).display !== 'none' && r.width > 0, r: [r.x, r.y, r.width, r.height], step: questStep187(), place: (p => p && { map: p.map, ic: p.ic })(questPlace187()) }; });
      if (!R.goal.shown || !R.goal.step || R.goal.step.n !== 2) fail(dev + ': goal line ' + JSON.stringify(R.goal)); if (!R.goal.place || R.goal.place.map !== 'cavemouth' || R.goal.place.ic !== '💎') fail(dev + ': step 2 place ' + JSON.stringify(R.goal.place));
      if (!/ชั้น 2|Class 2/.test(R.goal.txt)) fail(dev + ': goal text "' + R.goal.txt + '"');
      // B. a tap on the goal line walks across maps to a sleeping crystal at the cave mouth
      await tapAt(R.goal.r[0] + R.goal.r[2] / 2, R.goal.r[1] + R.goal.r[3] / 2); await sleep(400);
      R.tap = await pg.evaluate(() => ({ route: ROV180.route && ROV180.route.hops, path: !!(P.path && P.path.length), modal: !document.getElementById('modal').classList.contains('hide') }));
      if (!R.tap.route || R.tap.route.join('>') !== 'capital>cavemouth' || !R.tap.path || R.tap.modal) fail(dev + ': goal tap ' + JSON.stringify(R.tap));
      const t0 = Date.now(); R.mouthMs = await waitFor(pg, () => M.id === 'cavemouth', 40000); await sleep(600); await quiet(pg);
      R.arriveMs = R.mouthMs < 0 ? -1 : await waitFor(pg, () => M.id === 'cavemouth' && !ROV180.route && !ROV180.dest && M.crystals.some(c => !c.awake && Math.hypot(c.x - P.x, c.y + 14 - P.y) < 60), 40000); R.totalMs = Date.now() - t0;
      if (R.arriveMs < 0) fail(dev + ': did not arrive at a sleeping crystal (mouth ' + R.mouthMs + ', arrive ' + R.arriveMs + ', on ' + await pg.evaluate(() => M.id) + ')');
      await quiet(pg); await sleep(300); await pg.screenshot({ path: out + '/' + dev + '_arrived.png' });
      // C. the cave goal line says the step; standing on the place hides the marker; a few steps away it shows (gold pixels above the crystal)
      R.caveGoal = await pg.evaluate(() => { updateGoal(); return document.getElementById('goal').textContent; }); if (!/ชั้น 2|Class 2/.test(R.caveGoal)) fail(dev + ': cave goal line "' + R.caveGoal + '"');
      const markerRect = () => pg.evaluate(() => { const p = questPlace187(); if (!p || p.map !== M.id) return null; return { x: (p.x - camX) * SC - 8, y: (p.y - camY - 84) * SC, w: 16, h: 32 }; });
      /* a child standing within 18 px of a sleeping crystal gets its question at once (the game's rule), so stand 30 px off for the "near" reading */
      await pg.evaluate(() => { const p = questPlace187(); P.path = null; P.target = null; for (const dy of [30, -30, 40]) { if (!blockedAt(M, p.x, p.y + dy)) { P.x = p.x; P.y = p.y + dy; break; } } }); await quiet(pg); await sleep(700);
      R.marker = {}; let mr = await markerRect(); R.marker.near = mr ? await gold(pg, mr) : -1;
      await pg.evaluate(() => { const p = questPlace187(); P.path = null; P.target = null; for (const [dx, dy] of [[0, 2], [0, 3], [1, 2], [-1, 2], [0, -2], [0, -3], [2, 0], [-2, 0]]) { const tx = Math.floor(p.x / T) + dx, ty = Math.floor(p.y / T) + dy; if (walkable(M, tx, ty)) { P.x = tx * T + 16; P.y = ty * T + 16; break; } } });   /* stand 2–3 tiles from the crystal */
      await sleep(900); mr = await markerRect(); R.marker.far = mr ? await gold(pg, mr) : -1; await pg.screenshot({ path: out + '/' + dev + '_marker.png' });
      if (R.marker.far < 30) fail(dev + ': no gold marker over the crystal from 2–3 tiles away (' + R.marker.far + ' gold pixels)'); if (R.marker.near > 4) fail(dev + ': marker still drawn while standing on the place (' + R.marker.near + ')');
      // D. waking that crystal moves the place to the next sleeping one
      R.wake = await pg.evaluate(() => { const p = questPlace187(); const c = M.crystals.find(c => Math.abs(c.x - p.x) < 2 && Math.abs(c.y + 14 - p.y) < 2); if (!c) return null; c.awake = true; S.crystals[M.id] = (S.crystals[M.id] || []).concat([c.id]); const n = questPlace187(); return { before: [p.x, p.y], after: n && [n.x, n.y], moved: !!(n && (n.x !== p.x || n.y !== p.y)) }; });
      if (!R.wake || !R.wake.moved) fail(dev + ': waking the crystal did not move the goal place ' + JSON.stringify(R.wake));
      for (let k = 0; k < 3; k++) { await sleep(800); for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); } await quiet(pg); await sleep(300);   /* a class-up scene may follow the first crystal, a moment later */
      R.rankAfterWake = await pg.evaluate(() => S.rank);
      // E. the guide picker lists the goal first (10+); the map page has the goal strip for everyone
      if (!kid) { await pg.evaluate(() => { P.path = null; ROV180.route = null; hud(); }); const bq = await pg.$('#bQuest'); const r = await bq.boundingBox(); if (touch) { await pg.touchscreen.touchStart(r.x + r.width / 2, r.y + r.height / 2); await sleep(800); await pg.touchscreen.touchEnd(); } else { await pg.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await pg.mouse.down(); await sleep(800); await pg.mouse.up(); } await sleep(500);
        R.picker = await pg.evaluate(() => [...document.querySelectorAll('#mBody .grid button')].map(b => b.textContent)); R.pickerDbg = await pg.evaluate(() => ({ modal: !document.getElementById('modal').classList.contains('hide'), h2: ((document.querySelector('#mBody h2') || {}).textContent || ''), pause: PAUSE, dlg: !!DLG, dead: P.dead, held: ROV180.qHeld, list: guideList183().length })); if (!R.picker.length || !/^🎯/.test(R.picker[0])) fail(dev + ': the picker does not list the goal first: ' + JSON.stringify(R.picker.slice(0, 2)));
        await press(await pg.$('#mBody .grid button')); await sleep(400); R.pickerWalk = await pg.evaluate(() => ({ path: !!(P.path && P.path.length), dest: ROV180.dest && ROV180.dest.label })); if (!R.pickerWalk.path) fail(dev + ': the picker goal did not walk'); await quiet(pg); }
      await pg.evaluate(() => { P.path = null; ROV180.route = null; ROV180.dest = null; }); await press(await pg.$(kid ? '#mmw' : '#bMap')); await sleep(1200);
      R.strip = await pg.evaluate(() => { const q = document.querySelector('#wmPanel .qs187'); const b = q && q.querySelector('[data-qgo]'); const r = b && b.getBoundingClientRect(); return q ? { txt: q.textContent.trim(), btn: !!b, h: r && r.height } : null; });
      if (!R.strip || !R.strip.btn || R.strip.h < 28) fail(dev + ': map page goal strip ' + JSON.stringify(R.strip));   /* 1.88: the strip lives in the narrow right column, its button 30 px */ await pg.screenshot({ path: out + '/' + dev + '_strip.png' });
      await press(await pg.$('#wmPanel [data-qgo]')); await sleep(400); R.stripWalk = await pg.evaluate(() => ({ open: WM186.open, path: !!(P.path && P.path.length) })); if (R.stripWalk.open || !R.stripWalk.path) fail(dev + ': the strip button ' + JSON.stringify(R.stripWalk));
      // F. step 5 points at a fishing spot; step 7 (no place in today's world) opens the class panel
      R.steps = await pg.evaluate(() => { const o = {}; const r0 = S.rank; S.rank = 4; const p5 = questPlace187(); o.s5 = p5 && { map: p5.map, ic: p5.ic }; S.rank = 6; o.s7 = questPlace187(); S.rank = r0; return o; });
      if (!R.steps.s5 || R.steps.s5.ic !== '🎣') fail(dev + ': step 5 place ' + JSON.stringify(R.steps.s5)); if (R.steps.s7 !== null) fail(dev + ': step 7 has a place ' + JSON.stringify(R.steps.s7));
      await pg.evaluate(() => { P.path = null; ROV180.route = null; S.rank = 6; hud(); }); await sleep(300); const g2 = await pg.evaluate(() => { const r = document.getElementById('goal').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); await tapAt(g2[0], g2[1]); await sleep(500);
      R.s7tap = await pg.evaluate(() => ({ modal: !document.getElementById('modal').classList.contains('hide'), title: ((document.querySelector('#mBody h2') || {}).textContent || '').trim(), path: !!(P.path && P.path.length) }));
      if (!R.s7tap.modal && !R.s7tap.path) fail(dev + ': step 7 goal tap did nothing ' + JSON.stringify(R.s7tap));   /* no place: the class panel, or in a cave the old compass walk to a crystal */ await quiet(pg);
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
