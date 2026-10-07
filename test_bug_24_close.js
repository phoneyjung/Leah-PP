// Claude: BUG-24 (found in version 1.70). On a phone held sideways many windows put their only "close" button below the
// screen: the player has to scroll to the very end to get out, and tapping outside the window does nothing.
// Pass mark: in every window, right after it opens and with no scrolling, a close button can be tapped and the tap closes it.
// Written before the fix: version 1.70 prints `errors 88`. After the fix it must print `errors 0`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_bug_24_close.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-bug-24'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
const GM_ONLY = /^(openGM|openEquipment157|openLook169)$/;   // game-master tools with their own controls, not part of this pass mark

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [who, age] of [['child7', 7], ['adult', 30]]) for (const [w, h] of [[844, 390], [812, 330], [667, 375]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(), tag = who + ' ' + w + 'x' + h;
      pg.on('pageerror', e => fail('page error (' + tag + '): ' + e.message));
      await pg.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await pg.setBypassServiceWorker(true);
      await pg.goto(base + '?gm', { waitUntil: 'load' });
      await pg.waitForFunction(() => !document.getElementById('load') && typeof ROOM2 !== 'undefined' && ROOM2, { timeout: 90000 });
      await pg.evaluate(age => { const d = Store.all(), g = newSave({ name: 'T', kid: 0, house: 0, age }); if (age >= 18) g.gm = 1; d.slots = [g]; d.cur = 0; Store.put(d); S = Store.all().slots[0];
        S.gmInit = 1; S.snd = S.mus = false; S.joy = true; S.seen = { intro: 1 }; ensureDaily(); S.daily.seen = 1; startGame();
        document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; document.getElementById('dlg').classList.add('hide'); closeModal(); if (age >= 18) { try { gmGrant(); } catch (e) { } } }, age);
      await sleep(2200);
      const names = (await pg.evaluate(() => Object.getOwnPropertyNames(window).filter(n => /^open[A-Z0-9]/.test(n) && typeof window[n] === 'function').sort())).filter(n => !GM_ONLY.test(n));
      const row = { opened: 0, stuck: [] };
      for (const n of names) {
        const r = await pg.evaluate(async n => { try { closeModal(); } catch (e) { } try { DLG = null; PAUSE = false; } catch (e) { } try { window[n](); } catch (e) { return { open: false }; } await new Promise(r => setTimeout(r, 350));
          const m = document.getElementById('modal'); if (!m || m.classList.contains('hide')) return { open: false };
          const closers = [...m.querySelectorAll('button')].filter(b => b.id === 'mX' || b.id === 'qClose' || /^(\s*✕?\s*)?(ปิด|Close)\s*$/i.test(b.textContent.trim()));
          for (const b of closers) { const q = b.getBoundingClientRect(), top = Math.max(0, q.top), bottom = Math.min(innerHeight, q.bottom), left = Math.max(0, q.left), right = Math.min(innerWidth, q.right);
            if (bottom - top < 24 || right - left < 24) continue;                                             // at least 24 px of the button must be on screen
            const x = (left + right) / 2, y = (top + bottom) / 2, e = document.elementFromPoint(x, y); if (e && (e === b || b.contains(e))) return { open: true, tapAt: [x, y] }; }
          const f = closers[0] ? closers[0].getBoundingClientRect() : null, pn = m.querySelector('.pn') || m;
          return { open: true, tapAt: null, title: ((m.querySelector('h2') || {}).textContent || '').trim().slice(0, 24), closeTop: f ? Math.round(f.top) : null, content: pn.scrollHeight }; }, n);
        if (!r.open) continue; row.opened++;
        if (r.tapAt) { await pg.touchscreen.tap(r.tapAt[0], r.tapAt[1]); await sleep(220);                      // the real tap must close the window
          if (!(await pg.evaluate(() => document.getElementById('modal').classList.contains('hide')))) { row.stuck.push(n); fail('BUG-24 ' + tag + ': ' + n + ' has a close button on screen but a tap on it does not close the window'); } continue; }
        row.stuck.push(n);
        if (row.stuck.length === 1) await pg.screenshot({ path: path.join(out, 'stuck-' + who + '-' + w + 'x' + h + '.png') });
        fail('BUG-24 ' + tag + ': ' + n + ' "' + r.title + '" close button at y=' + r.closeTop + ' on a ' + h + ' px screen (content ' + r.content + ' px): cannot close without scrolling');
      }
      results[tag] = { windows: row.opened, cannotCloseWithoutScrolling: row.stuck.length, names: row.stuck };
      await ctx.close();
    }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
