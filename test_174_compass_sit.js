// Version 1.74 (Claude, on the owner's orders of 8 Oct): the compass stick, the round sit button beside it, R to sit,
// and buttons that work with a second finger while the first finger holds the stick.
// Real taps and real key presses. Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_174_compass_sit.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-174-compass-sit'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

// a brand-new player made with real taps/clicks in the creator (?rank=1: no automation shortcuts)
async function player(browser, w, h, touch, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1500); return { ctx, pg, press };
}
const box = (pg, sel) => pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, shown: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 4, bg: s.backgroundImage.slice(0, 40) }; }, sel);
const sitting = pg => pg.evaluate(() => !!P.sit);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [name, w, h, touch, age] of [['phone-child', 844, 390, true, 7], ['phone-adult', 844, 390, true, 30], ['ipad-child', 1180, 820, true, 7], ['computer-child', 1366, 768, false, 7], ['computer-adult', 1366, 768, false, 30]]) {
      const { ctx, pg, press } = await player(browser, w, h, touch, age), r = {};
      const joy = await box(pg, '#joy'), rest = await box(pg, '#bRest'), tag = await box(pg, '#bRest .kb174'), letters = await pg.evaluate(() => document.body.classList.contains('nt174'));
      r.stick = joy; r.sitButton = rest; r.rTagShown = !!(tag && tag.shown); r.letters = letters;
      // the compass is drawn on the stick, everywhere
      if (!joy || !joy.shown) fail(name + ': the stick is not on the screen'); else if (!/svg/.test(joy.bg)) fail(name + ': the stick has no compass picture (' + joy.bg + ')');
      // W A S D letters and the R tag on a computer only
      if (letters !== !touch) fail(name + ': W A S D letters ' + (letters ? 'shown' : 'hidden') + ' on a ' + (touch ? 'touch screen' : 'computer'));
      if (r.rTagShown !== !touch) fail(name + ': the R tag is ' + (r.rTagShown ? 'shown' : 'hidden') + ' on a ' + (touch ? 'touch screen' : 'computer'));
      // the sit button: round, beside the stick (lower-left), not on top of it, and big enough for a finger
      if (!rest || !rest.shown) fail(name + ': the sit button is not on the screen');
      else { const gap = Math.hypot(rest.x - joy.x, rest.y - joy.y) - rest.w / 2 - joy.w / 2; r.gapPx = Math.round(gap);
        if (rest.x > joy.x || rest.y < joy.y) fail(name + ': the sit button is not below-left of the stick'); if (gap < 0) fail(name + ': the sit button overlaps the stick by ' + Math.round(-gap) + ' px');
        if (gap > 40) fail(name + ': the sit button is ' + Math.round(gap) + ' px away from the stick'); if (rest.w < 44 || rest.h < 44) fail(name + ': the sit button is ' + rest.w + 'x' + rest.h); }
      // sit and stand with the button
      const s0 = await sitting(pg); await press(await pg.$('#bRest')); await sleep(400); const s1 = await sitting(pg); await press(await pg.$('#bRest')); await sleep(400); const s2 = await sitting(pg);
      r.button = [s0, s1, s2]; if (s0 || !s1 || s2) fail(name + ': the sit button gave ' + r.button.join(' → ') + ', expected false → true → false');
      if (!touch) {
        // R sits and stands, with the English layout and with the Thai layout (the R key types พ)
        for (const [label, key] of [['r', 'r'], ['Thai พ', 'พ']]) { const k0 = await sitting(pg);
          await pg.evaluate(key => { dispatchEvent(new KeyboardEvent('keydown', { key, code: 'KeyR', bubbles: true })); dispatchEvent(new KeyboardEvent('keyup', { key, code: 'KeyR', bubbles: true })); }, key); await sleep(400); const k1 = await sitting(pg);
          await pg.evaluate(key => { dispatchEvent(new KeyboardEvent('keydown', { key, code: 'KeyR', bubbles: true })); dispatchEvent(new KeyboardEvent('keyup', { key, code: 'KeyR', bubbles: true })); }, key); await sleep(400); const k2 = await sitting(pg);
          r['key ' + label] = [k0, k1, k2]; if (k0 || !k1 || k2) fail(name + ': R (' + label + ') gave ' + [k0, k1, k2].join(' → ') + ', expected false → true → false'); }
        // the knob leans the way the keys walk, and comes back
        const c0 = await box(pg, '#joyK'); await pg.keyboard.down('d'); await sleep(300); const c1 = await box(pg, '#joyK'); await pg.keyboard.up('d'); await sleep(300); const c2 = await box(pg, '#joyK');
        r.knobLean = [Math.round(c1.x - c0.x), Math.round(c2.x - c0.x)]; if (r.knobLean[0] < 8) fail(name + ': D leaned the knob ' + r.knobLean[0] + ' px'); if (Math.abs(r.knobLean[1]) > 1) fail(name + ': the knob stayed ' + r.knobLean[1] + ' px off centre after D');
      }
      // a second finger presses buttons while the first holds the stick (the corner stick, and the floating stick in the lower-left zone)
      if (touch) { const cdp = await pg.createCDPSession(), at = id => pg.evaluate(id => { const q = document.getElementById(id).getBoundingClientRect(); return [Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2)]; }, id);
        await pg.evaluate(() => { window.__hits174 = []; for (const id of ['bAtk', 'bRest', 'bBag']) { const b = document.getElementById(id); if (b) b.onclick = () => window.__hits174.push(id); } });   // count presses only
        const joyC = await at('joy'), zone = [Math.round(w * .3), Math.round(h * .62)]; let fid = 30; r.twoFingers = {};
        for (const [mode, j] of [['corner', joyC], ['zone', zone]]) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j[0], y: j[1], id: 1 }] }); await sleep(60);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: j[0] + 30, y: j[1], id: 1 }] }); await sleep(250);
          const x0 = await pg.evaluate(() => P.x); await pg.evaluate(() => window.__hits174 = []);
          for (const id of ['bAtk', 'bRest', 'bBag']) { const p = await at(id); fid++;
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j[0] + 30, y: j[1], id: 1 }, { x: p[0], y: p[1], id: fid }] }); await sleep(80);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: j[0] + 30, y: j[1], id: 1 }] }); await sleep(250); }
          const st = await pg.evaluate(() => ({ x: P.x, held: JOY.id !== null, hits: window.__hits174.slice() })); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400);
          r.twoFingers[mode] = { hits: st.hits, walkedPx: Math.round(st.x - x0), stickHeld: st.held };
          if (st.hits.join() !== 'bAtk,bRest,bBag') fail(name + ', ' + mode + ' stick held: a second finger pressed ' + (st.hits.join(' ') || 'nothing') + ', expected bAtk bRest bBag once each');
          if (!st.held) fail(name + ', ' + mode + ': the stick let go when the other finger pressed buttons'); if (r.twoFingers[mode].walkedPx < 40) fail(name + ', ' + mode + ': the player walked ' + r.twoFingers[mode].walkedPx + ' px while buttons were pressed'); }
        // one finger alone: each tap is still exactly one press (no double press)
        await pg.evaluate(() => window.__hits174 = []); for (const id of ['bAtk', 'bRest']) { const p = await at(id); await pg.touchscreen.tap(p[0], p[1]); await sleep(700); }
        r.singleTaps = await pg.evaluate(() => window.__hits174.slice()); if (r.singleTaps.join() !== 'bAtk,bRest') fail(name + ': single taps gave ' + r.singleTaps.join(' ') + ', expected bAtk bRest once each'); }
      await pg.screenshot({ path: path.join(out, name + '.png') }); results[name] = r; await ctx.close();
    }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
