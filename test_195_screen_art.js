// Version 1.95 (owner's art of 9 Oct 15:40–15:54): the painted backdrop, the stone stand and the gold icons on the gender, create and select screens — GM first.
// Real taps on a phone (844×390) and an iPad (1180×820) with ?gm, a phone without GM, and a phone with ?gm and the five new files blocked:
//   GM — the gender screen shows the painted backdrop (no blur) and both children stand on the stone stand; the create screen has 5 rail icons + 3 tool icons (the back arrow too once players exist),
//        the stand under the feet (stand pixels measured right under the character) and the painted clearing within 40 px of the feet; the create button is gold with dark text
//        (contrast ≥ 4.5:1); the select screen has the night stand, the "new" and "delete" icons (delete keeps a word) and still picks, deletes and starts;
//   no GM — none of the new look (no .art195, no icons), exactly the 1.94 screens;
//   files missing — no page error, the screens work and fall back to the 1.94 look part by part.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_195_screen_art.js   (serve the repo root first)
// Version 1.97 (owner 16:36 "วิจารหน่อย อยากให้ 9.5+"): GM screens also draw the backdrop on the character's pixel grid (#bg197 canvas, its CSS pixel = the character's pixel ±0.01),
//   the stand ring takes the house colour (a tinted stand per house), gender cards carry a ♀/♂ pill, the face tab shows a face and the hair tab the palette, the house name sits above
//   the character, the delete button is 🗑 with its word; a player without GM and a page with the files missing get none of it.
// Version 1.94 gives errors ≥ 8 here; 1.95 errors 0 on its own checks; 1.97 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-195-art'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const NEW = ['bg-create.jpg', 'bg-select.jpg', 'ui-icons-3.png', 'stand-create.png', 'stand-select.png'];
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, gm, block] of [['phone', 844, 390, true, false], ['ipad', 1180, 820, true, false], ['player', 844, 390, false, false], ['missing', 844, 390, true, true]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); const R = results[dev] = {};
      pg.on('pageerror', e => fail(dev + ' page error: ' + e.message)); pg.on('dialog', d => d.accept());
      await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await pg.setBypassServiceWorker(true);
      if (block) { await pg.setRequestInterception(true); pg.on('request', r => { if (NEW.some(f => r.url().includes(f))) r.abort(); else r.continue(); }); }
      await pg.goto(base + '?rank=1' + (gm ? '&gm' : ''), { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      const press = async el => { const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(300); };
      const look = () => pg.evaluate(() => { const el = document.getElementById('cr'), bf = getComputedStyle(el, '::before'), c = document.getElementById('bg197'); return { art: el.classList.contains('art195'), bg: /bg-(create|select)\.jpg/.test(bf.backgroundImage), filter: bf.filter, icons: el.querySelectorAll('.ic195').length, fit: ART195.fit || null, feet: ART195.feet || null, pix: c ? { on: el.classList.contains('pix197'), before: bf.display, cssW: parseFloat(c.style.width), w: c.width, grid: +(parseFloat(c.style.width) / c.width).toFixed(3), want: +px197().toFixed(3), cover: parseFloat(c.style.width) >= innerWidth && parseFloat(c.style.height) >= innerHeight } : null }; });
      // A. gender screen
      await sleep(400); R.gender = await look(); R.gender.pill = await pg.evaluate(() => ({ sy: document.querySelectorAll('#cg194 .gc small .sy').length, sign: [...document.querySelectorAll('#cg194 .gc .sg')].filter(e => getComputedStyle(e).display !== 'none').length })); R.gender.standPx = await pg.evaluate(() => { const c = document.querySelector('#cg194 .gc canvas'); const d = c.getContext('2d').getImageData(0, Math.round(c.height * .80), c.width, Math.round(c.height * .12)).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; });
      await pg.screenshot({ path: out + '/' + dev + '_gender.png' });
      await press(await pg.$('#cg194 [data-g="f"]')); await sleep(600);
      // B. create screen
      await sleep(300); R.create = await look(); R.create.tabs = await pg.evaluate(() => [...document.querySelectorAll('#cr .rail [data-tab]')].map(b => { const i = b.querySelector('.ic195'); return b.dataset.tab + ':' + (i ? i.dataset.i : '-'); }).join(' ')); R.create.cnm = await pg.evaluate(() => document.getElementById('cnm').textContent);
      R.create.stand = await pg.evaluate(() => { const c = document.getElementById('cpv'), f = ART195.feet && ART195.feet.c; if (!f) return -1; const r = c.getBoundingClientRect(), sx = c.width / r.width, g = c.getContext('2d'); const y = Math.round((f[1] - r.top + 10) * sx), d = g.getImageData(0, y, c.width, 2).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] > 150 && d[i + 2] > 150) n++; return n; });
      R.create.gold = await pg.evaluate(() => { const s = getComputedStyle(document.getElementById('cgo')); return { bg: s.backgroundImage, color: s.color }; });
      await pg.screenshot({ path: out + '/' + dev + '_create.png' });
      // the ring takes the house colour: a tinted stand for house 0, then house 1 after a real tap
      R.create.st0 = await pg.evaluate(() => Object.keys(ART197.st).join()); await press(await pg.$('#cr .rail [data-tab="house"]')); await press((await pg.$$('#ch .opt'))[1]); await sleep(300); R.create.st1 = await pg.evaluate(() => Object.keys(ART197.st).join()); R.create.cnm1 = await pg.evaluate(() => document.getElementById('cnm').textContent);
      // a choice still works with the icons in place
      // 2.19: with the paperdoll files (GM) the hairstyles are the paperdoll's own (#pd219hair); without them the 1.94 looks (#ck)
      R.pd = await pg.evaluate(() => document.getElementById('cr').classList.contains('pd219'));
      await press(await pg.$('#cr .rail [data-tab="hair"]')); await press(await pg.$(R.pd ? '#pd219hair .opt[data-n="2"]' : '#ck .opt[data-k="1"]')); R.kid = await pg.evaluate(pd => pd ? CR_STATE.pd.hair : CR_STATE.kid, R.pd);
      await press(await pg.$('#c3Turn')); R.dir = await pg.evaluate(() => C193.dir);
      await press(await pg.$('#crnd')); await press(await pg.$('#cgo')); await sleep(1800); R.made = await pg.evaluate(() => S && { kid: S.kid, name: S.name, hair: S.pd219 && S.pd219.hair });
      if (!R.made || (R.pd ? R.made.hair !== 2 || R.kid !== 2 || R.made.kid !== 0 : R.made.kid !== 1 || R.kid !== 1) || R.dir !== 1) fail(dev + ': creating with the new look ' + JSON.stringify({ pd: R.pd, kid: R.kid, dir: R.dir, made: R.made }));
      // C. select screen
      await pg.evaluate(() => { const d = Store.all(); d.slots.push(newSave({ name: 'Mango', kid: 2, house: 2, age: 9 })); d.cur = -1; Store.put(d); });
      await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      R.select = await look(); R.select.pkv = await pg.evaluate(() => { const c = document.getElementById('pkv'); return [c.width, c.height]; }); R.select.del = await pg.evaluate(() => document.getElementById('pDel').textContent.trim());
      await pg.screenshot({ path: out + '/' + dev + '_select.png' });
      await press((await pg.$$('#pk .pn'))[1]); R.pick = await pg.evaluate(() => C193.pick); await press(await pg.$('#pGo')); await sleep(1500); R.started = await pg.evaluate(() => S && S.name);
      if (R.pick !== 1 || R.started !== 'Mango') fail(dev + ': select with the new look: pick ' + R.pick + ', started ' + R.started);
      // checks per kind of page
      if (dev === 'phone' || dev === 'ipad') {
        if (!R.gender.art || !R.gender.bg || R.gender.filter !== 'none') fail(dev + ': gender screen backdrop ' + JSON.stringify(R.gender));
        if (R.gender.standPx < 300) fail(dev + ': no stand under the gender screen children (' + R.gender.standPx + ' px)');
        /* 2.19: the paperdoll's body tab keeps its 👕 until a gold icon exists */ if (!R.create.bg || R.create.icons < (R.pd ? 7 : 8)) fail(dev + ': create screen backdrop/icons ' + JSON.stringify(R.create));
        if (!(R.create.stand > 20)) fail(dev + ': no stand under the feet on the create screen (' + R.create.stand + ' px)');
        if (!R.create.fit || !R.create.feet || Math.abs(R.create.fit[0] - R.create.feet.c[0]) > 40 || Math.abs(R.create.fit[1] - R.create.feet.c[1]) > 40) fail(dev + ': the painted clearing is not under the feet ' + JSON.stringify({ fit: R.create.fit, feet: R.create.feet }));
        { const m = R.create.gold.bg.match(/rgb\((\d+), (\d+), (\d+)\)/g) || [], c = R.create.gold.color.match(/\d+/g).map(Number); const worst = Math.min(...m.map(s => ratio(s.match(/\d+/g).map(Number), c))); R.create.goldContrast = +worst.toFixed(2); if (!/gradient/.test(R.create.gold.bg) || !(worst >= 4.5)) fail(dev + ': create button gold/contrast ' + JSON.stringify(R.create.gold) + ' ' + worst); }
        if (!R.select.bg || R.select.icons < 1 || R.select.pkv[1] <= R.select.pkv[0] || !/🗑/.test(R.select.del) || !/ลบ|Delete/.test(R.select.del)) fail(dev + ': select screen ' + JSON.stringify(R.select));
        for (const [k, L] of [['gender', R.gender], ['create', R.create], ['select', R.select]]) { const q = L.pix; if (!q || !q.on || q.before !== 'none' || Math.abs(q.grid - q.want) > .01 || !q.cover) fail(dev + ': ' + k + ' backdrop not on the character pixel grid ' + JSON.stringify(q)); }
        if (R.gender.pill.sy !== 2 || R.gender.pill.sign !== 0) fail(dev + ': gender pills ' + JSON.stringify(R.gender.pill));
        if (!/hair:2/.test(R.create.tabs) || !/face:1/.test(R.create.tabs)) fail(dev + ': hair/face icons ' + R.create.tabs);
        if (!/บ้านดวงอาทิตย์|Sun House/.test(R.create.cnm) || !/บ้านปีกฟ้า|Wing House/.test(R.create.cnm1)) fail(dev + ': the house name above the character ' + R.create.cnm + ' → ' + R.create.cnm1);
        if (!/d0/.test(R.create.st0) || !/d1/.test(R.create.st1)) fail(dev + ': the ring did not take the house colour ' + R.create.st0 + ' → ' + R.create.st1);
      } else if (dev === 'player') {
        if (R.gender.art || R.create.art || R.select.art || R.gender.icons || R.create.icons || R.select.icons || R.gender.bg || R.create.bg) fail('player: the GM-only look shows to a player ' + JSON.stringify({ g: R.gender, c: R.create, s: R.select }));
        if (R.select.pkv[1] !== R.select.pkv[0]) fail('player: the select preview changed shape ' + R.select.pkv);
        if (R.gender.pix || R.create.pix || R.select.pix) fail('player: the GM pixel backdrop shows to a player');
      } else {
        if (R.gender.bg || R.create.bg || R.create.icons || R.select.icons || R.gender.pix || R.create.pix || R.select.pix) fail('missing: a missing file still shows ' + JSON.stringify({ g: R.gender, c: R.create, s: R.select }));
      }
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
