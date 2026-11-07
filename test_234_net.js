// Claude 2.34 (G4.1 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.2 section 8 M10): what the game sends online is the same with character v2 on (ready) as off.
// No real Firebase: firebase.database.ServerValue is stubbed and Net.me.set is replaced by a recorder (the 2.26 wrapper that adds `pd` stays in the path).
// The same save (a girl of 7 with a paper-doll look so `pd` is filled), the same map, the same 24 steps: 12 forced sends at fixed spots/rows/moving, then
// 12 unforced sends with the throttle clock moved on by 200 ms before each (6 of them with an unchanged spot → skipped by the game's own rule).
// Pass: off and on give the same number of sends and every field of every send equal (t left out) · PS.gmSprite170 / PS.local220 unchanged · no page error.
// Limits: no second device, no real database (G8).  Prints one JSON line, then `errors N`.  Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_234_net.js
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-234-net'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
async function run(browser, on) {
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 }); await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', (r) => { try { if (/firebase|gstatic|googleapis/.test(r.url())) return r.abort(); r.continue(); } catch (e) {} });
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  await p.evaluate((on) => {
    const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'Pim', kid: 0, house: 2, age: 7 }), { gender194: 'f', hc: 3, ec: 2, pd219: { v: 1, hair: 1, face: 1, eyes: 1, mouth: 1, body: 1, hc: 4, ec: 3, tn: 2 } }, on ? { char2On: true } : {})];
    d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} goMap('plaza');
  }, on);
  if (on) await p.waitForFunction(() => C234.st !== 'loading', { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  const r = await p.evaluate(() => {
    window.firebase = window.firebase || { database: { ServerValue: { TIMESTAMP: '{TS}' } } };
    const sent = [], ps0 = { g: PS.gmSprite170, l: PS.local220 }; const keep = { online: Net.online, me: Net.me };
    PAUSE = true; P.path = P.act = null;
    Net.online = true; Net.me = { set(v) { sent.push(JSON.parse(JSON.stringify(v))); } };
    const x0 = Math.round(P.x), y0 = Math.round(P.y);
    try {
      for (let i = 0; i < 12; i++) { P.x = x0 + i * 8; P.y = y0 + (i % 3) * 4; P.row = i % 8; P.moving = i % 2 === 1; Net.send(true); }
      for (let i = 0; i < 12; i++) { if (i % 2 === 0) { P.x = x0 + 200 + i * 6; P.row = (i * 3) % 8; } Net.last -= 200; Net.send(); }
    } finally { Net.online = keep.online; Net.me = keep.me; PAUSE = false; }
    return { st: C234.st, sent, ps: { g: PS.gmSprite170 === ps0.g, l: PS.local220 === ps0.l } };
  });
  r.pe = pe; await bc.close(); return r;
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    const off = await run(browser, false), on = await run(browser, true);
    const strip = (L) => L.map((v) => { const c = Object.assign({}, v); delete c.t; return c; });
    const a = strip(off.sent), b = strip(on.sent);
    const diff = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = JSON.stringify(a[i]), y = JSON.stringify(b[i]); if (x !== y) diff.push({ i, off: a[i], on: b[i] }); }
    R.off = { st: off.st, n: a.length, pe: off.pe.length }; R.on = { st: on.st, n: b.length, pe: on.pe.length }; R.fields = a[0] ? Object.keys(a[0]).sort() : []; R.pd = a[0] && a[0].pd; R.diff = diff.slice(0, 3); R.ps = [off.ps, on.ps];
    ck(off.st === 'off' && on.st === 'ready', 'states ' + off.st + ' / ' + on.st);
    ck(a.length === b.length && a.length === 18, 'sends off ' + a.length + ' on ' + b.length + ' (want 18 each: 12 forced + 6 changed spots)');
    ck(diff.length === 0, 'fields differ ' + JSON.stringify(diff.slice(0, 2)));
    ck(typeof R.pd === 'string' && R.pd.length > 0, 'pd must be filled for this save (' + R.pd + ')');
    ck(off.ps.g && off.ps.l && on.ps.g && on.ps.l && off.pe.length === 0 && on.pe.length === 0, 'PS flags / page errors ' + JSON.stringify({ ps: R.ps, pe: [off.pe, on.pe] }));
  } catch (e) { errors.push('crash: ' + String(e && e.stack || e).slice(0, 300)); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ results: R, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
