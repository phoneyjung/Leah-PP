// Version 1.93 (Claude, owner's reference screens of 9 Oct 14:40, item ④): the character create and select screens.
// Version 1.94 (owner, 9 Oct 15:31 "ขาดเลือกเพศก่อน และเลือก ทรงผม(เปลี่ยนสีได้) และหน้า(สีตา,ปาก)เปลี่ยนสีได้"): a gender screen first,
//   then hairstyles of that gender with hair colour, and a face tab with eye colour (mouth waits for the face art).
// Real taps on a phone (844×390), a short phone (812×330) and an iPad (1180×820), and the village picture blocked once:
//   gender — two characters side by side, both drawn; a tap on the boy opens the create screen as a boy;
//   create — the rail of round category buttons switches the right panel (age first, open at the start; hair; face; house; hat "soon"); the age buttons ≥ 44 px;
//   only the chosen gender's hairstyles show; a hairstyle, a hair colour (keyed curly and the recoloured spiky look), an eye colour and a house each change the big preview (pixels measured);
//   the blond look says it cannot change colour yet; the mouth tab says "soon"; ♀/♂ beside the name switch the hairstyles; 🔄 and dragging turn the character; 🎲 gives a name;
//   the create button is whole on the first screen and makes a player with exactly the chosen gender, age, look, hair colour, eye colour, house and name, and the game draws that hair colour;
//   select — after a reload with 3 players: the list shows 3 + "new", a tap picks (the big preview and its name change), "adventure on" starts the picked one,
//   the bin removes the picked one (the browser question answered yes), "new" opens the gender screen and its back button returns.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_193_character_screens.js   (serve the repo root first)
// Version 1.93 gives errors ≥ 10 here; 1.94 gives errors 0.
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
      const shown = () => pg.evaluate(() => [...document.querySelectorAll('#ck .opt')].filter(b => b.offsetParent && b.getBoundingClientRect().width > 0).map(b => +b.dataset.k));
      // A. the gender screen comes first: two characters, both drawn, both inside the screen
      R.gender = await pg.evaluate(() => ({ g194: document.getElementById('cr').classList.contains('g194'), cards: [...document.querySelectorAll('#cg194 .gc')].map(b => { const r = b.getBoundingClientRect(), c = b.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return { g: b.dataset.g, h: Math.round(r.height), in: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, px: n }; }) }));
      if (!R.gender.g194 || R.gender.cards.length !== 2 || R.gender.cards.some(c => c.h < 80 || !c.in || c.px < 200)) fail(dev + ': gender screen ' + JSON.stringify(R.gender));
      await pg.screenshot({ path: out + '/' + dev + '_gender.png' });
      await press(await pg.$('#cg194 [data-g="m"]'));
      // B. the create screen, as a boy, age open, everything needed on screen
      R.first = await pg.evaluate(() => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, b: b.bottom, r: b.right }; }; return { c193: document.getElementById('cr').classList.contains('c193'), gender: CR_STATE.gender, kid: CR_STATE.kid, boyOn: document.getElementById('cgM').classList.contains('on'), tab: C193.tab, cgo: r('#cgo'), name: r('#cname'), ages: [...document.querySelectorAll('#ca button')].map(b => { const q = b.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }), rail: [...document.querySelectorAll('#cr .rail [data-tab]')].map(b => b.dataset.tab).join(',') }; });
      if (!R.first.c193 || R.first.gender !== 'm' || R.first.kid !== 5 || !R.first.boyOn || R.first.tab !== 'age' || R.first.rail !== 'age,hair,face,house,hat') fail(dev + ': first create screen ' + JSON.stringify(R.first));
      if (R.first.cgo.b > h || R.first.cgo.y < 0) fail(dev + ': the create button is off screen ' + JSON.stringify(R.first.cgo)); if (R.first.ages.length !== 8 || R.first.ages.some(([a, b]) => a < 44 || b < 44)) fail(dev + ': age buttons ' + JSON.stringify(R.first.ages)); if (R.first.name.w < 120) fail(dev + ': name box ' + R.first.name.w + ' px');
      await pg.screenshot({ path: out + '/' + dev + '_create.png' });
      // C. hair: only the boy hairstyles; a hairstyle and a hair colour change the preview (keyed curly)
      const p0 = await sum(pg, '#cpv');
      await press(await pg.$('#cr .rail [data-tab="hair"]')); R.hairShown = await vis('#ck'); R.ageHidden = !(await vis('#ca')); R.boyLooks = await shown();
      if (!R.hairShown || !R.ageHidden) fail(dev + ': the hair tab did not switch the panel'); if (R.boyLooks.join() !== '3,4,5') fail(dev + ': boy hairstyles ' + R.boyLooks.join());
      await press(await pg.$('#ck .opt[data-k="3"]')); await sleep(150); const p1 = await sum(pg, '#cpv'); if (p1 === p0) fail(dev + ': choosing a hairstyle did not change the preview');
      await press(await pg.$('#cr [data-sub="hair:col"]')); R.colShown = await vis('#chc'); R.origHiddenKeyed = !(await vis('#chc .sw.orig')); if (!R.colShown || !R.origHiddenKeyed) fail(dev + ': hair colours for the curly look ' + R.colShown + ' / original swatch hidden ' + R.origHiddenKeyed);
      await press(await pg.$('#chc .sw[data-v="2"]')); await sleep(150); const p2 = await sum(pg, '#cpv'); R.keyedHc = await pg.evaluate(() => CR_STATE.hc); if (p2 === p1 || R.keyedHc !== 2) fail(dev + ': a hair colour on the curly look: changed ' + (p2 !== p1) + ', hc ' + R.keyedHc);
      // D. the recoloured spiky look
      await press(await pg.$('#cr [data-sub="hair:style"]')); await press(await pg.$('#ck .opt[data-k="5"]')); await sleep(150); const p3 = await sum(pg, '#cpv');
      await press(await pg.$('#cr [data-sub="hair:col"]')); R.origShown = await vis('#chc .sw.orig'); await press(await pg.$('#chc .sw[data-v="4"]')); await sleep(250); const p4 = await sum(pg, '#cpv'); R.hcol = await pg.evaluate(() => CR_STATE.hcol);
      if (!R.origShown || p4 === p3 || R.hcol !== 4) fail(dev + ': a hair colour on the spiky look: original swatch ' + R.origShown + ', changed ' + (p4 !== p3) + ', hcol ' + R.hcol);
      // E. face: eye colour changes the preview; mouth says soon
      await press(await pg.$('#cr .rail [data-tab="face"]')); R.eyeShown = await vis('#cec'); await press(await pg.$('#cec .sw[data-v="3"]')); await sleep(250); const p5 = await sum(pg, '#cpv'); R.ecol = await pg.evaluate(() => CR_STATE.ecol);
      if (!R.eyeShown || p5 === p4 || R.ecol !== 3) fail(dev + ': eye colour: shown ' + R.eyeShown + ', changed ' + (p5 !== p4) + ', ecol ' + R.ecol);
      await press(await pg.$('#cr [data-sub="face:mouth"]')); R.mouthSoon = await vis('#cr [data-sp="face:mouth"] .soon'); if (!R.mouthSoon) fail(dev + ': the mouth tab has no "soon" note');
      await pg.screenshot({ path: out + '/' + dev + '_face.png' });
      // F. blond cannot change colour yet and says so
      await press(await pg.$('#cr .rail [data-tab="hair"]')); await press(await pg.$('#cr [data-sub="hair:style"]')); await press(await pg.$('#ck .opt[data-k="4"]')); await press(await pg.$('#cr [data-sub="hair:col"]'));
      R.blond = { note: await vis('#c4NoHair'), swatches: await vis('#chc') }; if (!R.blond.note || R.blond.swatches) fail(dev + ': blond colour note ' + JSON.stringify(R.blond));
      // G. ♀ / ♂ beside the name switch the hairstyles
      await press(await pg.$('#cgF')); await press(await pg.$('#cr [data-sub="hair:style"]')); R.girlLooks = await shown(); R.girlKid = await pg.evaluate(() => CR_STATE.kid);
      if (R.girlLooks.join() !== '0,1,2' || R.girlKid !== 0) fail(dev + ': ♀ → hairstyles ' + R.girlLooks.join() + ', look ' + R.girlKid);
      await press(await pg.$('#cgM')); await press(await pg.$('#ck .opt[data-k="5"]')); R.backToBoy = await pg.evaluate(() => [CR_STATE.gender, CR_STATE.kid]); if (R.backToBoy.join() !== 'm,5') fail(dev + ': ♂ again ' + R.backToBoy);
      // H. house, hat, turning, dice, age
      const p6 = await sum(pg, '#cpv'); await press(await pg.$('#cr .rail [data-tab="house"]')); await press((await pg.$$('#ch .opt'))[1]); await sleep(150); const p7 = await sum(pg, '#cpv'); if (p7 === p6) fail(dev + ': a house did not change the preview');
      await press(await pg.$('#cr .rail [data-tab="hat"]')); R.hatSoon = await vis('#cr .tp[data-tp="hat"] .soon'); if (!R.hatSoon) fail(dev + ': the hat tab has no "soon" note');
      const d0 = await pg.evaluate(() => C193.dir); await press(await pg.$('#c3Turn')); const d1 = await pg.evaluate(() => C193.dir); if (d1 === d0) fail(dev + ': 🔄 did not turn'); await sleep(150); const p8 = await sum(pg, '#cpv'); if (p8 === p7) fail(dev + ': turning did not change the preview');
      { const r = await (await pg.$('#cpv')).boundingBox(); await pg.touchscreen.touchStart(r.x + r.width / 2, r.y + r.height / 2); await pg.touchscreen.touchMove(r.x + r.width / 2 + 40, r.y + r.height / 2); await pg.touchscreen.touchMove(r.x + r.width / 2 + 90, r.y + r.height / 2); await pg.touchscreen.touchEnd(); await sleep(150); R.dragDir = await pg.evaluate(() => C193.dir); if (R.dragDir === d1) fail(dev + ': dragging did not turn'); }
      await press(await pg.$('#crnd')); R.name = await pg.evaluate(() => CR_STATE.name); if (!R.name) fail(dev + ': the name dice gave no name');
      await press(await pg.$('#cr .rail [data-tab="age"]')); await press((await pg.$$('#ca button'))[4]);   /* age 10 */
      R.state = await pg.evaluate(() => ({ ...CR_STATE })); await press(await pg.$('#cgo')); await sleep(1800);
      R.made = await pg.evaluate(() => S && { age: S.age, kid: S.kid, house: S.house, hcol: S.hcol, ecol: S.ecol, gender: S.gender194, name: S.name }); const st = R.state;
      if (!R.made || R.made.age !== 10 || R.made.kid !== 5 || R.made.house !== 1 || R.made.hcol !== 4 || R.made.ecol !== 3 || R.made.gender !== 'm' || R.made.name !== st.name) fail(dev + ': the player made ' + JSON.stringify(R.made) + ' from ' + JSON.stringify(st));
      // I. the game draws the chosen hair colour: the player's sheet differs from the plain look in that house
      R.inGame = await pg.evaluate(() => { const a = PS.stand, b = recolorKey(IMG['s_kid-spiky'], HOUSES[S.house].h); if (!a || !b) return -1; const da = (a.getContext ? a : toCanvas(a)).getContext('2d').getImageData(0, 0, 512, 64).data, db = b.getContext('2d').getImageData(0, 0, 512, 64).data; let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) n++; return n; });
      if (!(R.inGame > 300)) fail(dev + ': the game sheet does not show the hair colour (' + R.inGame + ' pixels differ)');
      // J. the select screen after a reload with 3 players
      await pg.evaluate(() => { const d = Store.all(); d.slots.push(newSave({ name: 'Mango', kid: 1, house: 2, age: 9 })); d.slots.push(newSave({ name: 'Rocky', kid: 5, house: 3, age: 30 })); d.cur = -1; Store.put(d); });
      await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      R.pick = await pg.evaluate(() => ({ p193: document.getElementById('cr').classList.contains('p193'), rows: document.querySelectorAll('#pk .pn').length, add: !!document.getElementById('pNew'), go: (b => [b.bottom <= innerHeight, b.right <= innerWidth])(document.getElementById('pGo').getBoundingClientRect()) }));
      if (!R.pick.p193 || R.pick.rows !== 3 || !R.pick.add || !R.pick.go.every(Boolean)) fail(dev + ': select screen ' + JSON.stringify(R.pick));
      const v0 = await sum(pg, '#pkv'); await press((await pg.$$('#pk .pn'))[2]); await sleep(200); const v1 = await sum(pg, '#pkv'); R.picked = await pg.evaluate(() => ({ i: C193.pick, label: document.querySelector('#cr .pnm').textContent, on: document.querySelectorAll('#pk .pn.on').length }));
      if (v1 === v0 || R.picked.i !== 2 || !/Rocky/.test(R.picked.label) || R.picked.on !== 1) fail(dev + ': picking a player ' + JSON.stringify(R.picked));
      // the same look (spiky, house 3): the made player's coloured hair shows in the big preview, Rocky's plain hair does not
      await press((await pg.$$('#pk .pn'))[0]); await sleep(200); const vMade = await sum(pg, '#pkv'); R.pickDye = vMade !== v1; if (!R.pickDye) fail(dev + ': the select screen does not show the made player\'s hair colour');
      await pg.screenshot({ path: out + '/' + dev + '_select.png' });
      await press(await pg.$('#pk .pn')); await press(await pg.$('#pDel')); await sleep(400); R.afterDel = await pg.evaluate(() => ({ slots: Store.all().slots.map(s => s.name), rows: document.querySelectorAll('#pk .pn').length })); if (R.afterDel.slots.length !== 2 || R.afterDel.rows !== 2 || R.afterDel.slots.includes(R.made.name)) fail(dev + ': delete ' + JSON.stringify(R.afterDel));
      await press(await pg.$('#pNew')); R.newOpens = await pg.evaluate(() => document.getElementById('cr').classList.contains('g194')); await press(await pg.$('#c3Back')); R.backOpens = await pg.evaluate(() => document.getElementById('cr').classList.contains('p193'));
      if (!R.newOpens || !R.backOpens) fail(dev + ': new → gender screen ' + R.newOpens + ', back → select ' + R.backOpens);
      await press((await pg.$$('#pk .pn'))[1]); await press(await pg.$('#pGo')); await sleep(1500); R.started = await pg.evaluate(() => ({ name: S && S.name, hidden: document.getElementById('cr').classList.contains('hide'), cur: Store.all().cur }));
      if (R.started.name !== 'Rocky' || !R.started.hidden) fail(dev + ': adventure on ' + JSON.stringify(R.started));
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
