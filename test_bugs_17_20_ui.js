// Claude: BUG-17, 18, 19, 20 and 22 (found in version 1.70). Drives the real page; reads real pixels from a screenshot.
// Written before the fix: version 1.70 prints `errors 40`. After the fix it must print `errors 0`.
// Screenshots and results.json go to OUT_DIR (default /tmp/leah-bugs-17-20), never into the repo folder.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_bugs_17_20_ui.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-bugs-17-20'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

async function page(browser, w, h, query) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + query, { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 60000 });
  return { ctx, pg };
}
async function enterGame(pg) {
  await pg.waitForFunction(() => typeof ROOM2 !== 'undefined' && ROOM2, { timeout: 60000 });
  await pg.evaluate(() => { gmMakeSlot(); const d = Store.all(); S = d.slots[d.cur]; S.seen = { intro: 1 }; S.mus = S.snd = false; S.joy = true; save(); startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; document.getElementById('dlg').classList.add('hide'); closeModal(); goMap('farm'); });
  await sleep(1800); await pg.evaluate(() => { closeModal(); DLG = null; PAUSE = false; });
}
async function tap(pg, sel) { const e = await pg.$(sel); if (!e) throw new Error('missing ' + sel); const r = await e.boundingBox(); if (!r) throw new Error('hidden ' + sel); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(250); }

// Contrast between a label's text colour and the surface really painted behind it, measured on a screenshot.
async function contrasts(pg, selectors, shot) {
  const b64 = await pg.screenshot({ encoding: 'base64' }); fs.writeFileSync(shot, Buffer.from(b64, 'base64'));
  return pg.evaluate(async (b64, selectors) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const lum = ([r, gg, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(gg) + .0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
    const res = [];
    for (const sel of selectors) for (const e of document.querySelectorAll(sel)) {
      if (!e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (r.width < 8 || r.bottom > innerHeight || r.top < 0) { res.push({ sel, text: e.textContent.trim().slice(0, 20), offscreen: true }); continue; }
      const s = getComputedStyle(e), tc = s.color.match(/[\d.]+/g).slice(0, 3).map(Number), bg = s.backgroundColor.match(/[\d.]+/g).map(Number);
      const x0 = Math.round(r.left + r.width * .12), y0 = Math.round(r.top + r.height * .25), w = Math.round(r.width * .76), h = Math.round(r.height * .5);
      const d = g.getImageData(x0, y0, w, h).data, px = [];
      for (let i = 0; i < d.length; i += 4) { const p = [d[i], d[i + 1], d[i + 2]]; if (Math.abs(p[0] - tc[0]) + Math.abs(p[1] - tc[1]) + Math.abs(p[2] - tc[2]) > 60) px.push(p); }
      const med = k => px.map(p => p[k]).sort((a, b) => a - b)[px.length >> 1] || 0, surface = [med(0), med(1), med(2)];
      res.push({ sel, text: e.textContent.trim().slice(0, 20), textColour: tc, surface, ratio: +ratio(tc, surface).toFixed(2), ownColour: bg.slice(0, 3), ownAlpha: bg.length > 3 ? bg[3] : 1,
        surfaceToOwn: Math.abs(surface[0] - bg[0]) + Math.abs(surface[1] - bg[1]) + Math.abs(surface[2] - bg[2]) });
    }
    return res;
  }, b64, selectors);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // ---- BUG-17: a control scrolled into view must not end up under the sticky header of the settings window
    results.bug17 = [];
    for (const [name, w, h] of [['phone', 812, 330], ['small', 667, 375], ['phone844', 844, 390]]) {
      const { ctx, pg } = await page(browser, w, h, '?gm'); await enterGame(pg); await tap(pg, '#bSet');
      // Same order a player meets them: bottom of the list first, then back up. `scrollIntoView()` here is the browser's own
      // "bring this control into view" (what keyboard focus and every test tap use), with no extra scrolling by hand.
      const ids = ['sOn', 'jOn', 'gOn', 'ecoB', 'kOn', 'tOn', 'mOn'], covered = [];
      for (const id of ids) {
        const e = await pg.$('#' + id); if (!e) { fail('BUG-17 ' + name + ': missing #' + id); continue; }
        await e.scrollIntoView(); await sleep(80);
        const r = await e.evaluate(e => { const b = e.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          const sticky = [...document.querySelectorAll('#modal *')].filter(n => getComputedStyle(n).position === 'sticky').map(n => n.getBoundingClientRect().bottom).sort((p, q) => q - p)[0] || 0;
          return { top: Math.round(b.top), headerBottom: Math.round(sticky), reachable: !!hit && (hit === e || e.contains(hit)) }; });
        if (!r.reachable) covered.push(id + ' top ' + r.top + ' < header bottom ' + r.headerBottom);
      }
      await pg.screenshot({ path: path.join(out, 'bug17-' + name + '.png') });
      results.bug17.push({ name, size: [w, h], covered });
      if (covered.length) fail('BUG-17 ' + name + ' ' + w + 'x' + h + ': ' + covered.length + ' of ' + ids.length + ' settings controls sit under the sticky header after being brought into view: ' + covered.join(' · '));
      await ctx.close();
    }
    // ---- BUG-18 (contrast), BUG-19 (start button on screen), BUG-20 (age button size), BUG-22 (name box): the character creator a new player sees first
    results.creator = [];
    for (const [name, w, h] of [['phone', 812, 330], ['small', 667, 375], ['phone844', 844, 390]]) {
      const { ctx, pg } = await page(browser, w, h, '?rank=1'); await sleep(2500);
      if (await pg.$('#cg194 [data-g="f"]')) { await tap(pg, '#cg194 [data-g="f"]'); await sleep(400); }   /* 1.94: the gender screen comes first */
      // The start button is the one button every new player must find: it has to be whole on the first screen, with no scrolling.
      const start = await pg.$eval('#cgo', e => { const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, Math.min(innerHeight - 1, r.top + r.height / 2));
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), viewport: innerHeight, reachable: !!hit && (hit === e || e.contains(hit)) }; });
      if (start.bottom > h + .5 || start.top < 0 || !start.reachable) fail('BUG-19 ' + name + ' ' + w + 'x' + h + ': the start button spans ' + start.top + '–' + start.bottom + ' px, the screen is ' + h + ' px high');
      const ages = await pg.$$eval('#ca button', bs => bs.filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { label: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; }));
      const small = ages.filter(a => a.w < 44 || a.h < 44);
      if (small.length) fail('BUG-20 ' + name + ' ' + w + 'x' + h + ': ' + small.length + ' of ' + ages.length + ' age buttons are under 44 px: ' + small.map(a => a.label + ' ' + a.w + 'x' + a.h).join(' · '));
      // BUG-22: the box where the child types a name must be wide enough to read what was typed
      const nameBox = await pg.$eval('#cname', e => Math.round(e.getBoundingClientRect().width));
      if (nameBox < 120) fail('BUG-22 ' + name + ' ' + w + 'x' + h + ': the name box is ' + nameBox + ' px wide, needs at least 120 px');
      const cs = await contrasts(pg, ['#cgo', '#ch .hs', '#instTitle'], path.join(out, 'creator-' + name + '.png'));
      for (const c of cs) {
        if (c.offscreen) continue;                                   // reported by BUG-19
        if (c.ratio < 4.5) fail('BUG-18 ' + name + ': "' + c.text + '" contrast ' + c.ratio + ':1 (text ' + c.textColour + ' on painted surface ' + c.surface + '), needs 4.5:1');
        if (c.sel === '#ch .hs' && c.surfaceToOwn > 120) fail('BUG-18 ' + name + ': house button "' + c.text + '" does not show its house colour ' + c.ownColour + ' (painted surface ' + c.surface + ')');
      }
      results.creator.push({ name, size: [w, h], start, ages, nameBox, contrast: cs }); await ctx.close();
    }
    // ---- BUG-18 in the game: the lucky wheel button and its spin button
    { const { ctx, pg } = await page(browser, 844, 390, '?gm'); await enterGame(pg);
      await pg.evaluate(() => { closeModal(); openBoard(); }); await sleep(500);
      const board = await contrasts(pg, ['#bWheel'], path.join(out, 'board.png'));
      await pg.evaluate(() => { closeModal(); openWheel(); }); await sleep(500);
      const wheel = await contrasts(pg, ['#whGo'], path.join(out, 'wheel.png'));
      for (const c of [...board, ...wheel]) if (!c.offscreen && c.ratio < 4.5) fail('BUG-18 game: "' + c.text + '" contrast ' + c.ratio + ':1, needs 4.5:1');
      results.game = { board, wheel }; await ctx.close(); }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
