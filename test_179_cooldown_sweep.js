// Version 1.79 (Claude, owner's request of 8 Oct with a screenshot of the cave: "I want Blink to show its cooldown, and cooldowns done the RoV way: a faded colour
// sweeping round like a clock hand"). Measured through the screen on a phone (844×390, real taps): the dash button and the weapon-skill button during a cooldown
// carry a dark cover whose clear part grows clockwise from 0° to 360° over the whole cooldown, the seconds left stand in the middle, the button's word is hidden
// meanwhile and comes back after, and a second tap during the cooldown changes nothing. Also the computer layout (1180×820, click). Pixels are checked too: in the
// middle of the cooldown the button's top-right quarter (already clear) is brighter than its top-left quarter (still covered).
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_179_cooldown_sweep.js   (serve the repo root first)
// Version 1.77/1.78 gives errors 24 (no cover, no sweep, the dash button shows nothing); 1.79 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-179-cd'; fs.mkdirSync(out, { recursive: true });
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
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1200);
  await pg.evaluate(() => {
    const T = window.__t179 = {};
    T.calm = () => { try { closeModal(); } catch (e) { } PAUSE = false; P.sit = null; P.target = null; P.act = null; P.path = null; P.dead = 0; S.hp = 400; if ((S.rank || 1) < 4) S.rank = 4; try { hud(); ctlVis(); } catch (e) { } for (const m of MONS) { m.x += 6000; } };
    // one reading of a button: cover shown? sweep angle (from the gradient), number in the middle, the word's visibility, the game's own cooldown left
    T.read = id => { const b = document.getElementById(id), e = b && b.querySelector('.cd179'), sm = b && b.querySelector('small');
      const bg = e ? (e.style.background || '') : '', m = bg.match(/rgba\(0, 0, 0, 0\) 0deg, rgba\(0, 0, 0, 0\) (\d+)deg/) || bg.match(/\) 0deg (\d+)deg/); /* the browser's own spelling of the gradient, or ours */ const shown = !!(e && getComputedStyle(e).display !== 'none');
      const left = id === 'bDash' ? DASH.cd : id === 'bSk' ? (P.skCd || 0) : 0;
      return { t: performance.now(), shown, on: !!(b && b.classList.contains('cd179on')), deg: m ? +m[1] : null, num: e ? e.firstChild.textContent : '', word: sm ? getComputedStyle(sm).visibility : '', wordText: sm ? sm.textContent : '', left: +Math.max(0, left).toFixed(2), visible: !!(b && b.offsetParent !== null || (b && getComputedStyle(b).position === 'fixed' && getComputedStyle(b).display !== 'none')) }; };
    T.rect = id => { const q = document.getElementById(id).getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; };
  });
  return { ctx, pg };
}
const T = (pg, fn, ...a) => pg.evaluate((fn, a) => window.__t179[fn](...a), fn, a);
// average brightness of a screen rectangle, from a PNG screenshot (no decoder needed: puppeteer gives us raw pixels through a canvas in the page)
async function brightness(pg, r) { const buf = await pg.screenshot({ clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.max(1, Math.round(r.w)), height: Math.max(1, Math.round(r.h)) }, encoding: 'base64' });
  return pg.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3; return Math.round(s / (d.length / 4)); }, buf); }

async function cooldownRun(pg, id, tapFn, label, R) {
  const r0 = await T(pg, 'read', id); if (!r0.visible) { fail(label + ': button not visible'); return; }
  if (r0.shown || r0.on) fail(label + ': cover shown before the cooldown');
  await tapFn(); await sleep(60);
  const r1 = await T(pg, 'read', id); if (!(r1.left > 0)) { fail(label + ': the tap did not start a cooldown'); return; }
  const total = r1.left + .06; R.total = +total.toFixed(2); const S = [r1]; let pix = null, again = null; const t0 = Date.now();
  while (true) { await sleep(70); const r = await T(pg, 'read', id); S.push(r);
    /* pixel reading while 50–70% of the cooldown is left: the cleared part (clockwise from the top) then covers the top-right quarter and the bottom-left
       quarter is still dark. The bottom-left is compared, not the top-left, because since 1.84 the key tag (Shift, 3) sits on the top-left corner on a computer */
    if (!pix && r.left < total * .7 && r.left > total * .5) { const b = await T(pg, 'rect', id); const q = { w: b.w / 2 - 4, h: b.h / 2 - 4 }; pix = { tr: await brightness(pg, { x: b.x + b.w / 2 + 2, y: b.y + 2, ...q }), bl: await brightness(pg, { x: b.x + 2, y: b.y + b.h / 2 + 2, ...q }), tl: await brightness(pg, { x: b.x + 2, y: b.y + 2, ...q }) }; await pg.screenshot({ path: out + '/' + label.replace(/\W+/g, '_') + '_mid.png' }); }
    if (again === null && r.left < total * .6 && r.left > total * .2) { const lf = r.left; await tapFn(); await sleep(30); const r2 = await T(pg, 'read', id); again = { before: lf, after: r2.left, reset: r2.left > lf + .2 }; }
    if (r.left <= 0 || Date.now() - t0 > (total + 2) * 1000) break; }
  await sleep(120); const rEnd = await T(pg, 'read', id);
  const on = S.filter(r => r.left > 0), degs = on.map(r => r.deg);
  R.samples = on.length; R.shownAll = on.every(r => r.shown && r.on); R.degFirst = degs[0]; R.degLast = degs[degs.length - 1];
  R.degMonotonic = degs.every((d, i) => d !== null && (i === 0 || d >= degs[i - 1])); R.degSteps = new Set(degs).size;
  R.numOk = on.filter(r => r.num === String(Math.ceil(r.left)) || r.num === String(Math.ceil(r.left + .04))).length;   // the number is written once a frame; a reading can land just after a whole second passed R.wordHidden = on.filter(r => r.word === 'hidden').length;
  R.pix = pix; R.again = again; R.end = { shown: rEnd.shown, on: rEnd.on, word: rEnd.word, wordText: rEnd.wordText };
  if (!R.shownAll) fail(label + ': cover missing during the cooldown (' + on.filter(r => !(r.shown && r.on)).length + ' of ' + on.length + ' samples)');
  if (!R.degMonotonic) fail(label + ': sweep angle not growing: ' + degs.join(','));
  if (!(degs[0] <= 40)) fail(label + ': sweep starts at ' + degs[0] + '° (want ≤ 40)'); if (!(R.degLast >= 300)) fail(label + ': sweep ends at ' + R.degLast + '° (want ≥ 300)');
  if (R.degSteps < 8) fail(label + ': only ' + R.degSteps + ' different angles (no sweep)');
  if (R.numOk < on.length) fail(label + ': number wrong in ' + (on.length - R.numOk) + ' samples'); if (R.wordHidden < on.length) fail(label + ': word visible during cooldown in ' + (on.length - R.wordHidden) + ' samples');
  if (!pix) fail(label + ': no mid-cooldown pixel reading'); else if (!(pix.tr > pix.bl + 6)) fail(label + ': cleared quarter not brighter: top-right ' + pix.tr + ' vs bottom-left ' + pix.bl);
  if (!again) fail(label + ': no second tap'); else if (again.reset) fail(label + ': a second tap during the cooldown reset it (' + again.before + ' → ' + again.after + ')');
  if (rEnd.shown || rEnd.on) fail(label + ': cover still shown after the cooldown'); if (rEnd.word !== 'visible') fail(label + ': word not back after the cooldown (' + rEnd.word + ')');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch] of [['phone', 844, 390, true], ['computer', 1180, 820, false]]) {
      const { ctx, pg } = await player(browser, w, h, touch, 30); const R = results[dev] = {};
      await T(pg, 'calm'); await sleep(400);
      const tap = async id => { const b = await T(pg, 'rect', id); if (touch) await pg.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2); else await pg.mouse.click(b.x + b.w / 2, b.y + b.h / 2); };
      R.dash = {}; await cooldownRun(pg, 'bDash', () => tap('bDash'), dev + ' dash', R.dash); await sleep(500);
      R.skill = {}; await cooldownRun(pg, 'bSk', () => tap('bSk'), dev + ' skill', R.skill); await sleep(500);
      // the dash word is the game's own word again (not the number) once the cooldown is over
      R.dashWord = await pg.evaluate(() => document.querySelector('#bDash small').textContent); R.dashT = await pg.evaluate(() => t('dash')); if (R.dashWord !== R.dashT) fail(dev + ': dash word after cooldown "' + R.dashWord + '"');
      await pg.screenshot({ path: out + '/' + dev + '_end.png' }); await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
