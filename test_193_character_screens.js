// Version 1.93 (Claude, owner's reference screens of 9 Oct 14:40, item ④): the character create and select screens.
// Real taps on a phone (844×390), a short phone (812×330) and an iPad (1180×820), and the village picture blocked once:
//   create — the rail of round category buttons switches the right panel (age first, open at the start; look; colours; house; hat "soon"); the age buttons ≥ 44 px;
//   a look, a hair colour and a house change what the big preview draws (pixels measured); 🔄 turns the character, dragging turns it too; 🎲 beside the name
//   gives a name; the create button is whole on the first screen and makes a player with exactly the chosen age, look, colour, house and name;
//   select — after a reload with 3 players: the list shows 3 + "new", a tap picks (the big preview and its name change), "adventure on" starts the picked one,
//   the bin removes the picked one (the browser question answered yes), "new" opens the create screen and its back button returns.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_193_character_screens.js   (serve the repo root first)
// Version 1.92 gives errors ≥ 10; 1.93 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-193-chars'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const sum = (pg, sel) => pg.evaluate(sel => { const c = document.querySelector(sel); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 16) { if (d[i + 3] > 0) { s += d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7; n++; } } return s + '/' + n; }, sel);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, block] of [['phone', 844, 390, false], ['short', 812, 330, false], ['ipad', 1180, 820, false], ['noPicture', 844, 390, true]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); const R = results[dev] = {};
      pg.on('pageerror', e => fail(dev + ' page error: ' + e.message)); pg.on('dialog', d => d.accept());
      await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await pg.setBypassServiceWorker(true);
      if (block) { await pg.setRequestInterception(true); pg.on('request', r => { if (r.url().includes('map-H9-village')) r.abort(); else r.continue(); }); }
      await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      const press = async el => { const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(300); };
      const vis = sel => pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, sel);
      // A. the first screen: the create screen, age open, everything needed on screen
      R.first = await pg.evaluate(() => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, b: b.bottom, r: b.right }; }; return { c193: document.getElementById('cr').classList.contains('c193'), tab: C193.tab, cgo: r('#cgo'), name: r('#cname'), ages: [...document.querySelectorAll('#ca button')].map(b => { const q = b.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }), rail: document.querySelectorAll('#cr .rail [data-tab]').length, note: document.getElementById('crole').textContent.slice(0, 12) }; });
      if (!R.first.c193 || R.first.tab !== 'age' || R.first.rail !== 5) fail(dev + ': first screen ' + JSON.stringify(R.first));
      if (R.first.cgo.b > h || R.first.cgo.y < 0) fail(dev + ': the create button is off screen ' + JSON.stringify(R.first.cgo)); if (R.first.ages.length !== 8 || R.first.ages.some(([a, b]) => a < 44 || b < 44)) fail(dev + ': age buttons ' + JSON.stringify(R.first.ages)); if (R.first.name.w < 120) fail(dev + ': name box ' + R.first.name.w + ' px');
      await pg.screenshot({ path: out + '/' + dev + '_create.png' });
      // B. tabs switch the panel; choices change the preview
      const p0 = await sum(pg, '#cpv');
      await press(await pg.$('#cr .rail [data-tab="look"]')); R.lookShown = await vis('#ck'); R.ageHidden = !(await vis('#ca')); if (!R.lookShown || !R.ageHidden) fail(dev + ': the look tab did not switch the panel');
      await press((await pg.$$('#ck .opt'))[3]); await sleep(150); const p1 = await sum(pg, '#cpv'); if (p1 === p0) fail(dev + ': choosing a look did not change the preview');
      await press(await pg.$('#cr .rail [data-tab="col"]')); R.colShown = await vis('#chc'); if (!R.colShown) fail(dev + ': colours not shown for the curly look'); await press((await pg.$$('#chc .sw'))[2]); await sleep(150); const p2 = await sum(pg, '#cpv'); if (p2 === p1) fail(dev + ': a hair colour did not change the preview');
      await press(await pg.$('#cr .rail [data-tab="house"]')); await press((await pg.$$('#ch .opt'))[1]); await sleep(150); const p3 = await sum(pg, '#cpv'); if (p3 === p2) fail(dev + ': a house did not change the preview');
      await press(await pg.$('#cr .rail [data-tab="hat"]')); R.hatSoon = await vis('#cr .tp[data-tp="hat"] .soon'); if (!R.hatSoon) fail(dev + ': the hat tab has no "soon" note');
      const d0 = await pg.evaluate(() => C193.dir); await press(await pg.$('#c3Turn')); const d1 = await pg.evaluate(() => C193.dir); if (d1 === d0) fail(dev + ': 🔄 did not turn'); await sleep(150); const p4 = await sum(pg, '#cpv'); if (p4 === p3) fail(dev + ': turning did not change the preview');
      { const r = await (await pg.$('#cpv')).boundingBox(); await pg.touchscreen.touchStart(r.x + r.width / 2, r.y + r.height / 2); await pg.touchscreen.touchMove(r.x + r.width / 2 + 40, r.y + r.height / 2); await pg.touchscreen.touchMove(r.x + r.width / 2 + 90, r.y + r.height / 2); await pg.touchscreen.touchEnd(); await sleep(150); R.dragDir = await pg.evaluate(() => C193.dir); if (R.dragDir === d1) fail(dev + ': dragging did not turn'); }
      await press(await pg.$('#crnd')); R.name = await pg.evaluate(() => CR_STATE.name); if (!R.name) fail(dev + ': the name dice gave no name');
      await press(await pg.$('#cr .rail [data-tab="age"]')); await press((await pg.$$('#ca button'))[4]);   /* age 10 */
      R.state = await pg.evaluate(() => ({ ...CR_STATE })); await press(await pg.$('#cgo')); await sleep(1500);
      R.made = await pg.evaluate(() => S && { age: S.age, kid: S.kid, house: S.house, hc: S.hc, name: S.name }); const st = R.state;
      if (!R.made || R.made.age !== 10 || R.made.kid !== 3 || R.made.house !== 1 || R.made.hc !== 2 || R.made.name !== st.name) fail(dev + ': the player made ' + JSON.stringify(R.made) + ' from ' + JSON.stringify(st));
      // C. the select screen after a reload with 3 players
      await pg.evaluate(() => { const d = Store.all(); d.slots.push(newSave({ name: 'Mango', kid: 1, house: 2, age: 9 })); d.slots.push(newSave({ name: 'Rocky', kid: 5, house: 3, age: 30 })); d.cur = -1; Store.put(d); });
      await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      R.pick = await pg.evaluate(() => ({ p193: document.getElementById('cr').classList.contains('p193'), rows: document.querySelectorAll('#pk .pn').length, add: !!document.getElementById('pNew'), go: (b => [b.bottom <= innerHeight, b.right <= innerWidth])(document.getElementById('pGo').getBoundingClientRect()) }));
      if (!R.pick.p193 || R.pick.rows !== 3 || !R.pick.add || !R.pick.go.every(Boolean)) fail(dev + ': select screen ' + JSON.stringify(R.pick));
      const v0 = await sum(pg, '#pkv'); await press((await pg.$$('#pk .pn'))[2]); await sleep(200); const v1 = await sum(pg, '#pkv'); R.picked = await pg.evaluate(() => ({ i: C193.pick, label: document.querySelector('#cr .pnm').textContent, on: document.querySelectorAll('#pk .pn.on').length }));
      if (v1 === v0 || R.picked.i !== 2 || !/Rocky/.test(R.picked.label) || R.picked.on !== 1) fail(dev + ': picking a player ' + JSON.stringify(R.picked));
      await pg.screenshot({ path: out + '/' + dev + '_select.png' });
      await press(await pg.$('#pk .pn')); await press(await pg.$('#pDel')); await sleep(400); R.afterDel = await pg.evaluate(() => ({ slots: Store.all().slots.map(s => s.name), rows: document.querySelectorAll('#pk .pn').length })); if (R.afterDel.slots.length !== 2 || R.afterDel.rows !== 2 || R.afterDel.slots.includes(R.made.name)) fail(dev + ': delete ' + JSON.stringify(R.afterDel));
      await press(await pg.$('#pNew')); R.newOpens = await pg.evaluate(() => document.getElementById('cr').classList.contains('c193')); await press(await pg.$('#c3Back')); R.backOpens = await pg.evaluate(() => document.getElementById('cr').classList.contains('p193'));
      if (!R.newOpens || !R.backOpens) fail(dev + ': new → create ' + R.newOpens + ', back → select ' + R.backOpens);
      await press((await pg.$$('#pk .pn'))[1]); await press(await pg.$('#pGo')); await sleep(1500); R.started = await pg.evaluate(() => ({ name: S && S.name, hidden: document.getElementById('cr').classList.contains('hide'), cur: Store.all().cur }));
      if (R.started.name !== 'Rocky' || !R.started.hidden) fail(dev + ': adventure on ' + JSON.stringify(R.started));
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
