// G4 screenshots for the owner (plan G4_0 §8.2 · M7): phone 844×390 DPR 3 and iPad 1180×820 DPR 2, game zoom 100 % and 75 %,
// the 3 M6 scenes. Synthetic save · Firebase blocked (Google Fonts allowed so the game's own font shows) · real time.
//   BASE=http://127.0.0.1:8780 TAG=main node qa/g4/shots.js OUTDIR [--patch '{"char2On":true}']
'use strict';
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8780', TAG = process.env.TAG || 'main', OUT = process.argv[2];
const PATCH = process.argv.includes('--patch') ? JSON.parse(process.argv[process.argv.indexOf('--patch') + 1]) : null;
const SCENES = require('./m6-scenes.json'), SAVE = { name: 'P', kid: 0, house: 1, age: 7 };
const DEV = [['phone', { width: 844, height: 390 }, 3], ['ipad', { width: 1180, height: 820 }, 2]];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined }), R = [], errs = [];
  for (const [dev, vp, dpr] of DEV) for (const zoom of [1, 0.75]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, timezoneId: 'Asia/Bangkok', locale: 'th-TH', serviceWorkers: 'block' });
    await ctx.route('**/*', r => { const h = new URL(r.request().url()).hostname; return (h === '127.0.0.1' || /fonts\.(googleapis|gstatic)\.com$/.test(h)) ? r.continue() : r.abort(); });
    await ctx.addInitScript(z => { try { localStorage.setItem('la-zoom', String(z)) } catch (e) {} }, zoom);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ' ' + zoom + ': ' + String(e.message).slice(0, 140)));
    await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), null, { timeout: 90000 }); await p.waitForTimeout(800);
    await p.evaluate(([sv, patch]) => { const d = Store.all(); d.slots = [Object.assign(newSave(sv), patch || {})]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
      document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {} LITE = false; fpsChecks = 6; S.eco = false; }, [SAVE, PATCH]);
    for (const sc of SCENES) {
      await p.evaluate(sc => { goMap(sc.map); P.path = P.act = null; }, sc); await p.waitForTimeout(2500);
      const f = `g40-${TAG}-${dev}-z${Math.round(zoom * 100)}-${sc.id}.png`;
      await p.screenshot({ path: path.join(OUT, f) });
      R.push({ f, dev, zoom, scene: sc.id, ZOOM: await p.evaluate(() => ZOOM), SC: await p.evaluate(() => SC) });
    }
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify({ shots: R.length, errors: errs, list: R }));
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify({ base: BASE, tag: TAG, patch: PATCH, shots: R, errors: errs }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
