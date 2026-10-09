// Version 1.71 (Claude, on the owner's order of 8 Oct): the fewest buttons on a child's main screen, and the class panel for today's world.
// 1.74 (owner, 8 Oct afternoon: "don't forget the sit button, R"): the sit button is back for children, beside the stick.
// Drives the real page with real taps. Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_171_kid_hud.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-171-kid-hud'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));

async function open(browser, w, h, query, opts = {}) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  if (opts.noArt) { await pg.setRequestInterception(true); pg.on('request', r => /\.(png|jpe?g|webp|mp3)(\?|$)/.test(r.url()) ? r.abort() : r.continue()); }
  await pg.goto(base + query, { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 });
  return { ctx, pg };
}
const tapXY = async (pg, x, y) => { await pg.touchscreen.tap(x, y); await sleep(320); };
async function tap(pg, sel) { const e = await pg.$(sel); if (!e) throw new Error('missing ' + sel); await e.scrollIntoView(); const r = await e.boundingBox(); if (!r) throw new Error('not showing ' + sel); await tapXY(pg, r.x + r.width / 2, r.y + r.height / 2); }
const quiet = pg => pg.evaluate(() => { try { closeModal(); } catch (e) { } if (DLG) { DLG = null; document.getElementById('dlg').classList.add('hide'); } PAUSE = false; });
// buttons a player can see and touch on the main screen (not inside a window)
const mainButtons = pg => pg.evaluate(() => [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(), s = getComputedStyle(b);
  return r.width > 4 && r.height > 4 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > .05 && !b.closest('#modal') && !b.closest('#cr') && !b.closest('#title') && !b.closest('#picker'); }).map(b => b.id || '?').filter(id => !/^context/.test(id)).sort());
const windowTitle = pg => pg.evaluate(() => { const w = document.getElementById('wm186'); if (w && !w.classList.contains('hide')) return ((w.querySelector('#wmTitle') || {}).textContent || '(map page)').trim();   /* 1.86: the map is a full page, not a modal */
  const m = document.getElementById('modal'); return m && !m.classList.contains('hide') ? ((m.querySelector('h2') || {}).textContent || '(no title)').trim() : null; });
// a player made by hand in the creator: tap the age, tap start, tap through the opening lines
async function newPlayer(browser, w, h, age, opts) {
  const { ctx, pg } = await open(browser, w, h, '?rank=1', opts); await sleep(2500);
  const ages = await pg.$$('#ca button'), a = ages[age >= 18 ? ages.length - 1 : age - 6], r = await a.boundingBox(); await tapXY(pg, r.x + r.width / 2, r.y + r.height / 2);
  await tap(pg, '#cgo'); await sleep(2300);
  for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) { const d = await (await pg.$('#dlg')).boundingBox(); await tapXY(pg, d.x + d.width / 2, d.y + d.height / 2); }
  await quiet(pg); await sleep(300); return { ctx, pg };
}
// a character with every class open (the automation bypass gives class 10), as the other suites use
async function fullPlayer(browser, w, h, age) {
  const { ctx, pg } = await open(browser, w, h, '?gm'); await pg.waitForFunction(() => typeof ROOM2 !== 'undefined' && ROOM2, { timeout: 90000 });
  await pg.evaluate(age => { const d = Store.all(), g = newSave({ name: 'T', kid: 0, house: 0, age }); d.slots = [g]; d.cur = 0; Store.put(d); S = Store.all().slots[0]; S.snd = S.mus = false; S.joy = true; S.seen = { intro: 1 }; ensureDaily(); S.daily.seen = 1;
    startGame(); document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; document.getElementById('dlg').classList.add('hide'); closeModal(); }, age);
  await sleep(2300); await quiet(pg); return { ctx, pg };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // ---- 1. a brand-new 7-year-old, phone and iPad: stick, big button, bag, settings and nothing else
    for (const [name, w, h] of [['phone', 844, 390], ['ipad', 1180, 820]]) {
      const { ctx, pg } = await newPlayer(browser, w, h, 7); const b = await mainButtons(pg);
      results['newChild-' + name] = b; await pg.screenshot({ path: path.join(out, 'new-child-' + name + '.png') });
      if (!same(b, ['bAtk', 'bBag', 'bQLog188', 'bRest', 'bSet'])) fail('new child ' + name + ': main screen shows ' + b.join(' ') + ', expected only bAtk bBag bQLog188 bRest bSet');   /* 1.88: the quest button beside the card (owner, 9 Oct 13:19) is the one addition to the child's screen */
      if (!(await pg.$('#joy'))) fail('new child ' + name + ': the walking stick is missing');
      await ctx.close();
    }
    // ---- 2. a child with every class open: only buttons that belong to the place are added, and they sit next to the big button with no gap
    { const { ctx, pg } = await fullPlayer(browser, 844, 390, 7), seen = {};
      for (const [id, want] of [['capital', ['bAtk', 'bBag', 'bQLog188', 'bRest', 'bSet']], ['cavemouth', ['bAtk', 'bBag', 'bCmp', 'bQLog188', 'bRest', 'bSet']], ['room', ['bAtk', 'bBag', 'bDeco', 'bQLog188', 'bRest', 'bSet']]]) {
        await pg.evaluate(id => goMap(id), id); await sleep(1900); await quiet(pg); await pg.evaluate(() => hud()); await sleep(700);
        const b = await mainButtons(pg); seen[id] = b; await pg.screenshot({ path: path.join(out, 'child-' + id + '.png') });
        if (!same(b, want)) fail('child with everything open, ' + id + ': shows ' + b.join(' ') + ', expected ' + want.join(' ')); }
      await pg.evaluate(() => goMap('cavemouth')); await sleep(1900); await quiet(pg); await sleep(700);
      const gap = await pg.evaluate(() => { const a = document.getElementById('bAtk').getBoundingClientRect(), c = document.getElementById('bCmp').getBoundingClientRect(); return Math.round(a.left - c.right); });
      seen.compassToBigButtonPx = gap; if (gap < 0 || gap > 90) fail('the compass sits ' + gap + ' px from the big button (a hidden button still holds a place)');
      // ---- 3. what left the main screen is in the bag: the book, the map
      await tap(pg, '#bBag'); const bag = await windowTitle(pg); const has = await pg.evaluate(() => ['bKidBook171', 'bKidMap171'].map(id => !!document.getElementById(id)));
      seen.bag = { title: bag, book: has[0], map: has[1] }; if (!bag || !has[0] || !has[1]) fail('child bag: book button ' + has[0] + ', map button ' + has[1] + ' (window "' + bag + '")');
      await pg.screenshot({ path: path.join(out, 'child-bag.png') });
      if (has[0]) { await tap(pg, '#bKidBook171'); const direct = await pg.evaluate(() => { openBook(); return ((document.querySelector('#modal h2') || {}).textContent || '').trim(); }); await tap(pg, '#mX'); await tap(pg, '#bBag'); await tap(pg, '#bKidBook171');
        const t = await windowTitle(pg); seen.bookFromBag = t; if (!t || t !== direct) fail('tapping the book in the bag opened "' + t + '", the book window is "' + direct + '"'); await tap(pg, '#mX'); }
      if (has[1]) { await tap(pg, '#bBag'); await tap(pg, '#bKidMap171'); const t = await windowTitle(pg); seen.mapFromBag = t; if (!t) fail('tapping the map in the bag opened nothing'); await quiet(pg); }
      // ---- 4. the small map in the corner opens the same map
      await tap(pg, '#mmw'); const viaMini = await windowTitle(pg); seen.mapFromSmallMap = viaMini; if (!viaMini || viaMini !== seen.mapFromBag) fail('tapping the small map opened "' + viaMini + '", the bag map button opened "' + seen.mapFromBag + '"'); await quiet(pg);
      // ---- 5. the kid-mode switch in settings brings every button back, and hides them again
      await pg.evaluate(() => goMap('capital')); await sleep(1900); await quiet(pg);
      await tap(pg, '#bSet'); await tap(pg, '#kOn'); await quiet(pg); await sleep(500); const off = await mainButtons(pg);
      await tap(pg, '#bSet'); await tap(pg, '#kOn'); await quiet(pg); await sleep(500); const on = await mainButtons(pg);
      seen.kidModeOff = off; seen.kidModeOnAgain = on;
      for (const id of ['bMap', 'bBook', 'bRest']) if (!off.includes(id)) fail('kid mode off: ' + id + ' did not come back (' + off.join(' ') + ')');
      if (!same(on, ['bAtk', 'bBag', 'bQLog188', 'bRest', 'bSet'])) fail('kid mode on again: shows ' + on.join(' '));
      results.childFull = seen; await ctx.close(); }
    // ---- 6. grown-ups keep their screen
    { const { ctx, pg } = await fullPlayer(browser, 844, 390, 30), b = await mainButtons(pg); results.adult = b;
      for (const id of ['bBag', 'bMap', 'bBook', 'bSet', 'bRest', 'bAtk', 'bStat', 'bEmo']) if (!b.includes(id)) fail('adult: ' + id + ' is missing from the main screen (' + b.join(' ') + ')');
      if (await pg.evaluate(() => document.body.classList.contains('kidmin171'))) fail('adult: the child layout is switched on');
      await ctx.close(); }
    // ---- 7. the class panel and the goal line for today's world, Thai and English
    { const { ctx, pg } = await newPlayer(browser, 844, 390, 7), r = {};
      await pg.evaluate(() => { S.rank = 2; S.crystals = { cavemouth: ['a'] }; save(); updateGoal(); });
      for (const L of ['th', 'en']) { r['goalClass3-' + L] = await pg.evaluate(L => { const k = LANG; LANG = L; updateGoal(); const g = document.getElementById('goal').textContent; LANG = k; return g; }, L);
        if (!/1\/4/.test(r['goalClass3-' + L])) fail('class 3 goal (' + L + ') should count the cave-mouth crystals 1/4: "' + r['goalClass3-' + L] + '"'); }
      if (!/ปากถ้ำ/.test(r['goalClass3-th']) || !/cave mouth/i.test(r['goalClass3-en'])) fail('class 3 goal text: "' + r['goalClass3-th'] + '" / "' + r['goalClass3-en'] + '"');
      r.missingEnglish = await pg.evaluate(() => Object.keys(TX.th).filter(k => /^(rk|kb171)/.test(k) && !(k in TX.en)));
      if (r.missingEnglish.length) fail('texts without English: ' + r.missingEnglish.join(' '));
      await pg.evaluate(() => { S.rank = 6; save(); updateGoal(); openRank(); }); await sleep(400);
      r.panel = await pg.evaluate(() => [...document.querySelectorAll('#mBody .pn')].map(e => e.textContent.trim().slice(0, 40)));
      const soon = r.panel.filter(x => /เร็ว ๆ นี้/.test(x)).length; r.comingSoonRows = soon; if (soon !== 4) fail('class panel at class 6: ' + soon + ' "coming soon" rows, expected 4 (classes 7-10)');
      if (r.panel.some(x => /ถ้ำชั้น 3|หอฝึก|ราชาเห็ด|สฟิงซ์/.test(x))) fail('class panel still names a place that left the game');
      await pg.screenshot({ path: path.join(out, 'class-panel.png') }); await quiet(pg);
      r.goalAtClass6 = await pg.evaluate(() => { updateGoal(); return document.getElementById('goal').textContent; });
      if (/^🎓/.test(r.goalAtClass6)) fail('goal line at class 6 still shows a class task: "' + r.goalAtClass6 + '"');
      results.classes = r; await ctx.close(); }
    // ---- 8. every picture and sound missing: the child's screen and bag still work
    { const { ctx, pg } = await newPlayer(browser, 844, 390, 7, { noArt: true }), b = await mainButtons(pg);
      await tap(pg, '#bBag'); const t = await windowTitle(pg); const closeOk = await pg.evaluate(() => { const x = document.getElementById('mX'); if (!x) return false; const q = x.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, Math.min(innerHeight - 2, q.top + q.height / 2)); return q.top < innerHeight - 24 && !!e && (e === x || x.contains(e)); });
      results.noArt = { buttons: b, bag: t, closeOnScreen: closeOk };
      if (!same(b, ['bAtk', 'bBag', 'bQLog188', 'bRest', 'bSet'])) fail('no art: main screen shows ' + b.join(' ')); if (!t) fail('no art: the bag did not open'); if (!closeOk) fail('no art: the bag close button is not on screen');
      await ctx.close(); }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
