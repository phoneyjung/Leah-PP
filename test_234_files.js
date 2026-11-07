// Claude 2.34 (G4.1 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.2 section 3.4 + 8 M2): the strict load — any character-v2 file missing, of the wrong size, broken or
// too slow → state 'failed' and the ORIGINAL character, with no page error and no white screen. The file list is read from c2-pack.json itself (+ char2.js and the pack).
// COLD (no offline cache): each of the 15 files answered 404, one at a time → failed 15/15 · all 15 at once → failed
// WARM (service worker on, every file already in its cache): the file removed from the cache AND its network request failed (the worker's own request, caught on the
//       worker target) → failed 15/15 · nothing removed → ready (the cache serves a phone that is offline)
// BAD  idle sheet answered with another picture (wrong size) · pack / hold anchors / portrait mask meta / shade map answered with broken JSON → failed 5/5
// SLOW the idle sheet held 25 s → failed ('timeout') at ~20 s and still failed (no S.char2) after it arrives
// Every failed case: S.char2 not created · the player sheets equal the flag-off sheets (same pixels) · the old sheets are drawn on the game canvas in the next second
// Prints one JSON line, then `errors N`.  Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_234_files.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-234-files'; fs.mkdirSync(out, { recursive: true });
const port = process.env.PORT || 8775, base = 'http://localhost:' + port + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = { cold: [], warm: [], bad: [] };
const ck = (c, m) => { if (!c) errors.push(m); };
const pack = JSON.parse(fs.readFileSync(path.join(__dirname, 'c2-pack.json'), 'utf8'));
const FILES = ['char2.js', 'c2-pack.json'].concat([...new Set(JSON.stringify(pack).match(/"[\w.-]+\.(?:png|json)"/g).map((s) => s.slice(1, -1)))].sort());
const nameOf = (u) => { const m = u.match(/\/(char2\.js|c2-[^/?#]+)(\?|$)/); return m ? m[1] : null; };
async function page(bc, rule, sw) {   // rule(name) → 'block' | {body,type} | {hold:ms} | undefined
  const p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 }); if (!sw) await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  p.on('request', async (r) => {
    const n = nameOf(r.url()), a = n && rule ? rule(n) : undefined;
    try {
      if (/firebase|gstatic|googleapis/.test(r.url())) return r.abort();
      if (a === 'block') return r.respond({ status: 404, body: 'blocked' });
      if (a && a.body !== undefined) return r.respond({ status: 200, contentType: a.type, body: a.body });
      if (a && a.hold) await sleep(a.hold);
      await r.continue();
    } catch (e) {}
  });
  return { p, pe };
}
async function boot(p) { await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500); }
const play = (p, on) => p.evaluate((on) => {
  const d = Store.all(); d.slots = [newSave({ name: 'Pim', kid: 0, house: 1, age: 7 })]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; if (on) S.char2On = true;
  startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} goMap('plaza');
}, on);
const settle = (p, ms) => p.waitForFunction(() => C234.st !== 'loading', { timeout: ms }).then(() => true).catch(() => false);
// the original look: sheet pixels as a hash, + how many times the old sheets reach the game canvas in ~1 s, + not a white/empty screen
const look = (p) => p.evaluate(() => new Promise((res) => {
  const h = (c) => { try { const d = c.getContext ? c.getContext('2d').getImageData(0, 0, c.width, c.height).data : null; if (!d) return 'img:' + (c.src || '').slice(-40); let x = 2166136261; for (let i = 0; i < d.length; i += 7) x = Math.imul(x ^ d[i], 16777619) >>> 0; return c.width + 'x' + c.height + ':' + x; } catch (e) { return 'err'; } };
  const DI = CanvasRenderingContext2D.prototype.drawImage; let n = 0;
  CanvasRenderingContext2D.prototype.drawImage = function (im) { if (this.canvas && this.canvas.id === 'c' && (im === PS.stand || im === PS.walk)) n++; return DI.apply(this, arguments); };
  setTimeout(() => { CanvasRenderingContext2D.prototype.drawImage = DI; const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let lit = 0;
    for (let i = 0; i < d.length; i += 4 * 97) if (d[i + 3] && !(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) lit++;
    res({ sheets: h(PS.stand) + '|' + h(PS.walk), drawn: n, lit, st: C234.st, why: C234.why, char2: S.char2 !== undefined, has: typeof window.Char2 }); }, 1000);
}));
async function oneCase(browser, label, rule, opt = {}) {
  const bc = await browser.createBrowserContext(); const { p, pe } = await page(bc, rule, false); await boot(p); await play(p, true);
  const t0 = Date.now(); const done = await settle(p, opt.wait || 15000); const ms = Date.now() - t0; let L = await look(p);
  if (opt.after) { await sleep(opt.after); L = Object.assign(await look(p), { first: L.st, firstWhy: L.why }); }
  await bc.close(); return Object.assign({ label, done, ms, pe: pe.length }, L);
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // the flag-off look of the same save (the reference)
    { const bc = await browser.createBrowserContext(); const { p, pe } = await page(bc, null, false); await boot(p); await play(p, false); await sleep(1500); R.ref = await look(p); R.ref.pe = pe.length; await bc.close(); }
    ck(R.ref.st === 'off' && R.ref.drawn > 0 && R.ref.lit > 100 && R.ref.pe === 0, 'reference ' + JSON.stringify(R.ref));
    const oldLook = (L) => L.st === 'failed' && !L.char2 && L.sheets === R.ref.sheets && L.drawn > 0 && L.lit > 100 && L.pe === 0;
    // COLD
    for (const f of FILES) { const L = await oneCase(browser, f, (n) => (n === f ? 'block' : undefined)); R.cold.push(L); ck(L.done && oldLook(L), 'cold ' + f + ' ' + JSON.stringify(L)); }
    { const L = await oneCase(browser, 'all 15', () => 'block'); R.cold.push(L); ck(L.done && oldLook(L), 'cold all ' + JSON.stringify(L)); }
    // BAD
    const other = fs.readFileSync(path.join(__dirname, 'c2-held-lantern_L0-S-trial.png'));
    for (const [f, body, type] of [['c2-pilot-kid4-idleanim.png', other, 'image/png'], ['c2-pack.json', '{"schema":"c2-pack/1",', 'application/json'], ['c2-pilot-hold-anchors.json', '{oops', 'application/json'],
      ['c2-pilot-kid4-pt-mask.json', '[1,2', 'application/json'], ['c2-pilot-kid4-pt-shademap.json', 'not json', 'application/json']]) {
      const L = await oneCase(browser, 'bad ' + f, (n) => (n === f ? { body, type } : undefined)); R.bad.push(L); ck(L.done && oldLook(L), 'bad ' + f + ' ' + JSON.stringify(L));
    }
    // SLOW: 25 s on the idle sheet
    { const L = await oneCase(browser, 'slow 25 s', (n) => (n === 'c2-pilot-kid4-idleanim.png' ? { hold: 25000 } : undefined), { wait: 24000, after: 8000 }); R.slow = L;
      ck(L.done && L.ms >= 19000 && L.ms < 23000 && L.first === 'failed' && L.firstWhy === 'timeout' && oldLook(L), 'slow ' + JSON.stringify(L)); }
    // WARM: the service worker caches every file first, then one file is taken out of its cache and its network request fails
    for (const f of [null].concat(FILES)) {
      const bc = await browser.createBrowserContext(); let cdp = null;
      const w = await page(bc, null, true); await boot(w.p);
      await w.p.evaluate(() => navigator.serviceWorker.ready); await w.p.reload({ waitUntil: 'load' }); await w.p.waitForFunction(() => !document.getElementById('load') && !!navigator.serviceWorker.controller, { timeout: 90000 });
      await play(w.p, true); await settle(w.p, 15000); const warmSt = await w.p.evaluate(() => C234.st); await sleep(800);
      const cached = await w.p.evaluate(async (names) => { const c = await caches.open((await caches.keys()).find((k) => /^lantern-/.test(k))); const r = []; for (const n of names) r.push(!!(await c.match(new URL(n, location.href).href))); return r; }, FILES);
      if (f) {
        await w.p.evaluate(async (n) => { const c = await caches.open((await caches.keys()).find((k) => /^lantern-/.test(k))); await c.delete(new URL(n, location.href).href); }, f);
        const swt = (await bc.targets()).find((t) => t.type() === 'service_worker'); cdp = await swt.createCDPSession();
        await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/' + f + '*' }] });
        cdp.on('Fetch.requestPaused', (e) => { cdp.send('Fetch.failRequest', { requestId: e.requestId, errorReason: 'InternetDisconnected' }).catch(() => {}); });
      }
      const p2 = await bc.newPage(), pe2 = []; p2.on('pageerror', (e) => pe2.push(String(e.message).slice(0, 160))); await p2.setViewport({ width: 844, height: 390 });
      await boot(p2); const ctl = await p2.evaluate(() => !!navigator.serviceWorker.controller); await play(p2, true); const done = await settle(p2, 15000); const L = Object.assign(await look(p2), { label: f || 'nothing removed', warmSt, cachedAll: cached.every(Boolean), ctl, done, pe: pe2.length });
      R.warm.push(L);
      if (f) ck(ctl && warmSt === 'ready' && L.cachedAll && done && oldLook(L), 'warm ' + f + ' ' + JSON.stringify(L));
      else ck(ctl && warmSt === 'ready' && L.cachedAll && done && L.st === 'ready' && L.char2 && L.pe === 0, 'warm control ' + JSON.stringify(L));
      if (cdp) await cdp.detach().catch(() => {}); await bc.close();
    }
  } catch (e) { errors.push('crash: ' + String(e && e.stack || e).slice(0, 300)); }
  finally { await browser.close(); }
  const brief = (L) => [L.label, L.st, L.why, L.drawn, L.sheets === (R.ref && R.ref.sheets)].join('|');
  console.log(JSON.stringify({ files: FILES.length, ref: R.ref, cold: R.cold.map(brief), bad: R.bad.map(brief), slow: R.slow && brief(R.slow) + '|' + R.slow.ms + 'ms first ' + R.slow.first + ' ' + R.slow.firstWhy, warm: R.warm.map(brief), errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
