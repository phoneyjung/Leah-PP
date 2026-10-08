// Version 1.75 (Claude, on the owner's order of 8 Oct): one status line at the top left: time, battery, connection, FPS, ping.
// Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_175_status.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-175-status'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const line = pg => pg.evaluate(() => { const e = document.getElementById('sys175'), r = e.getBoundingClientRect(), s = getComputedStyle(e), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const bx = id => { const x = document.getElementById(id); if (!x || getComputedStyle(x).display === 'none') return null; const q = x.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; };
  const d = new Date(); return { shown: s.display !== 'none' && r.width > 20, box: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], text: e.textContent, takesTaps: !!hit && (hit === e || e.contains(hit)),
    hud: bx('hud'), lamp: bx('lampBar'), now: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }; });

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // not on the title screen
    { const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); pg.on('pageerror', e => fail('page error: ' + e.message));
      await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true }); await pg.setBypassServiceWorker(true);
      await pg.goto(base + '?title=1', { waitUntil: 'load' }); await sleep(3500); const l = await line(pg); results.title = l.shown; if (l.shown) fail('the status line shows on the title screen'); await ctx.close(); }
    for (const [name, w, h, touch, age] of [['phone-child', 844, 390, true, 7], ['phone-short-adult', 812, 330, true, 30], ['ipad-child', 1180, 820, true, 7], ['computer-child', 1366, 768, false, 7]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(), r = {}; pg.on('pageerror', e => fail('page error: ' + e.message));
      await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch }); await pg.setBypassServiceWorker(true);
      await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      r.inCreator = (await line(pg)).shown; if (r.inCreator) fail(name + ': the status line shows in the character creator');
      const press = async el => { await el.scrollIntoView(); const q = await el.boundingBox(); if (touch) await pg.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2); else await pg.mouse.click(q.x + q.width / 2, q.y + q.height / 2); await sleep(320); };
      const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
      for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(400); }
      await sleep(3500); const a = await line(pg); r.online = a;
      if (!a.shown) fail(name + ': no status line in the game');
      else { if (a.box[0] > 16 || a.box[1] > 8) fail(name + ': the status line is at ' + a.box[0] + ',' + a.box[1] + ', not the top left');
        if (!a.text.includes(a.now)) fail(name + ': the time "' + a.now + '" is missing from "' + a.text + '"');
        const f = /FPS (\d+)/.exec(a.text); if (!f || +f[1] < 1) fail(name + ': no FPS number in "' + a.text + '"');
        if (!/Ping \d+ ms/.test(a.text)) fail(name + ': no ping in ms in "' + a.text + '"'); if (!/📶/.test(a.text)) fail(name + ': no connection mark in "' + a.text + '"');
        if (a.takesTaps) fail(name + ': the status line catches taps meant for the game');
        if (a.hud && a.hud[1] < a.box[3]) fail(name + ': the player card (top ' + a.hud[1] + ') overlaps the status line (bottom ' + a.box[3] + ')');
        if (a.hud && a.lamp && a.lamp[1] < a.hud[3]) fail(name + ': the lantern bar (top ' + a.lamp[1] + ') overlaps the player card (bottom ' + a.hud[3] + ')');
        if (a.box[2] > w / 2) fail(name + ': the status line is ' + (a.box[2] - a.box[0]) + ' px wide, past the middle of the screen'); }
      // offline: says so and drops the ping; back online: the ping comes back
      await pg.setOfflineMode(true); await sleep(1300); const o = await line(pg); r.offline = o.text;
      if (!/ออฟไลน์|Offline/.test(o.text) || /Ping/.test(o.text)) fail(name + ': offline the line reads "' + o.text + '"');
      await pg.setOfflineMode(false); await sleep(1500); const b = await line(pg); r.backOnline = b.text; if (!/Ping/.test(b.text) || /ออฟไลน์|Offline/.test(b.text)) fail(name + ': back online the line reads "' + b.text + '"');
      await pg.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: 0, width: Math.min(w, 460), height: 200 } });
      results[name] = r; await ctx.close();
    }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
