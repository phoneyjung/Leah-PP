// Claude 2.34 (G4.1 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.2 sections 3, 6 and 8 M1/M8): the character-v2 flag, its state and its owner — nothing is drawn with Char2 in G4.1.
// A  flag values that are NOT true (missing · false · 1 · "true" · {}) on a girl of 7: state off, Char2 never loaded, 0 requests for char2.js / c2-*, no S.char2      → 5/5
// B  who may use it (D-G4-2 ก): ages 5–13 × gender194 f / m / none (kid 0 = girl look, kid 3 = boy look) → c234Who '' only for a girl of 6–9 (table 9 × 4 = 36)
//    + flag on for a boy of 7 and a girl of 10: state off, 0 requests
// C  flag on, girl 7: ready within 15 s · each of the 15 files asked for once · S.char2 = v 2 set c2 + from · every old field unchanged (deep compare) · written by save()
// D  turning the flag off while it loads, at 4 seams of Char2.load (pack held · body sheet held · lantern held · portrait held): the late result is dropped (state off,
//    no S.char2) · after the hold is released 0 new loads and no file asked for twice · turning it on again reuses the first load → ready, still 15 files once each
// E  switching saves A (flag on) → B (flag off) → A while A loads: B never gets char2, A gets it once, no save written across (Store checked after save())
// F  GM panel (S.gm): the row, the state text, the on/off button (≥ 44 px) and "clear v2" needing a second tap; a boy's row is disabled with "ยังไม่มีตัวแบบนี้"
//    2.36 (Codex T39-N4): the on/off button is aria-pressed false/true, no inline background, and when on its text reads on the drawn pixels (contrast ≥ 4.5)
// G  the offline cache after a fresh install (service worker on, flag off): 0 character-v2 files and 0 bytes in it (sw.js lists them, never installs them)
// Prints one JSON line, then `errors N`.  Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_234_flag.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-234-flag'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
const C2 = /\/(char2\.js|c2-[^/?#]+)(\?|$)/;
async function open(browser, hold) {   // hold: a file name whose response is held until release()
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [], req = [];
  let release = null; const gate = new Promise((r) => { release = r; });
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  p.on('request', async (r) => {
    const m = r.url().match(C2); if (m) req.push(m[1]);
    if (/firebase|gstatic|googleapis/.test(r.url())) return r.abort();
    if (hold && m && m[1] === hold) { await gate; }
    try { await r.continue(); } catch (e) {}
  });
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(600);
  return { bc, p, pe, req, release };
}
const play = (p, saves, cur) => p.evaluate((saves, cur) => {
  const d = Store.all(); d.slots = saves.map((s) => Object.assign(newSave({ name: s.name || 'Pim', kid: s.kid || 0, house: 1, age: s.age || 7 }), s.x || {})); d.cur = cur; Store.put(d);
  S = d.slots[cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
  document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
}, saves, cur);
const state = (p) => p.evaluate(() => ({ st: C234.st, why: C234.why, owner: C234.owner === S, char2: S.char2 === undefined ? null : S.char2, cnt: Object.assign({}, C234.cnt), has: typeof window.Char2, script: !!document.querySelector('script[src="char2.js"]') }));
const untilNot = (p, st, ms) => p.waitForFunction((st) => C234.st !== st, { timeout: ms }, st).then(() => true).catch(() => false);
const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.char2; delete c.char2On; return c; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // A: values that are not true
    R.A = [];
    for (const [lab, v] of [['missing', undefined], ['false', false], ['1', 1], ['"true"', 'true'], ['{}', {}]]) {
      const t = await open(browser); await play(t.p, [{ age: 7, x: v === undefined ? {} : { char2On: v } }], 0); await sleep(2500);
      const s = await state(t.p); R.A.push({ lab, st: s.st, req: t.req.length, has: s.has, char2: !!s.char2, pe: t.pe.length });
      ck(s.st === 'off' && t.req.length === 0 && s.has === 'undefined' && !s.char2 && !s.script && t.pe.length === 0, 'A ' + lab + ': ' + JSON.stringify(R.A[R.A.length - 1]));
      await t.bc.close();
    }
    // B: the table + two flag-on players who may not use it
    const t0 = await open(browser);
    R.B = await t0.p.evaluate(() => { const r = []; for (let age = 5; age <= 13; age++) for (const [g, kid] of [['f', 0], ['m', 3], [null, 0], [null, 3]]) {
      const s = { age, kid }; if (g) s.gender194 = g; const w = c234Who(s), want = ((g || (kid === 3 ? 'm' : 'f')) === 'f' && age >= 6 && age <= 9) ? '' : 'x'; r.push({ age, g, kid, w, ok: (w === '') === (want === '') }); } return r; });
    ck(R.B.length === 36 && R.B.every((x) => x.ok), 'B table: ' + JSON.stringify(R.B.filter((x) => !x.ok)));
    ck(await t0.p.evaluate(() => c234Who({ age: 7, kid: 0, gender194: 'm' }) === 'gender'), 'B gender194 m on a girl look must win');
    await t0.bc.close();
    R.B2 = [];
    for (const s0 of [{ age: 7, kid: 3 }, { age: 10, kid: 0 }]) {
      const t = await open(browser); await play(t.p, [{ age: s0.age, kid: s0.kid, x: { char2On: true } }], 0); await sleep(2500);
      const s = await state(t.p); R.B2.push({ s0, st: s.st, why: s.why, req: t.req.length });
      ck(s.st === 'off' && t.req.length === 0 && !s.char2, 'B2 ' + JSON.stringify(R.B2[R.B2.length - 1])); await t.bc.close();
    }
    // C: flag on, girl 7
    { const t = await open(browser); const x = { char2On: true, gender194: 'f', hc: 3, ec: 2, hcol: null };
      await play(t.p, [{ age: 7, x }], 0); const before = await t.p.evaluate(() => JSON.parse(JSON.stringify(S)));
      const ok = await untilNot(t.p, 'loading', 15000); const s = await state(t.p);
      const after = await t.p.evaluate(() => JSON.parse(JSON.stringify(S)));
      await t.p.evaluate(() => save()); const stored = await t.p.evaluate(() => Store.all().slots[0]);
      const uniq = new Set(t.req).size;
      R.C = { ok, st: s.st, why: s.why, char2: s.char2, req: t.req.length, uniq, cnt: s.cnt, oldSame: JSON.stringify(strip(before)) === JSON.stringify(strip(after)), stored: !!(stored.char2 && stored.char2.v === 2 && stored.char2On === true), pe: t.pe };
      ck(ok && s.st === 'ready' && s.char2 && s.char2.v === 2 && s.char2.set === 'c2' && s.char2.from === 'hc' && s.char2.color.hair === 'red' && s.char2.color.iris === 'green', 'C ready + look ' + JSON.stringify(R.C).slice(0, 400));
      ck(t.req.length === 15 && uniq === 15, 'C 15 files once each: ' + t.req.length + '/' + uniq);
      ck(R.C.oldSame && R.C.stored && t.pe.length === 0, 'C old fields / stored / errors ' + JSON.stringify({ oldSame: R.C.oldSame, stored: R.C.stored, pe: t.pe }));
      await t.p.screenshot({ path: path.join(out, 'c-ready.png') }); await t.bc.close(); }
    // D: off while loading, at 4 seams
    R.D = [];
    for (const hold of ['c2-pack.json', 'c2-pilot-kid4-idleanim.png', 'c2-held-lantern_L0-S-trial.png', 'c2-pilot-kid4-pt.png']) {
      const t = await open(browser, hold); await play(t.p, [{ age: 7, x: { char2On: true } }], 0);
      await t.p.waitForFunction(() => true); let waited = 0; while (!t.req.includes(hold) && waited < 15000) { await sleep(100); waited += 100; }
      await t.p.evaluate(() => { S.char2On = false; c234Sync(); }); const mid = await state(t.p);
      t.release(); await sleep(2500); const s1 = await state(t.p); const n1 = t.req.length;
      await t.p.evaluate(() => { S.char2On = true; c234Sync(); }); const ok2 = await untilNot(t.p, 'loading', 15000); const s2 = await state(t.p);
      const uniq = new Set(t.req).size;
      const row = { hold, seen: t.req.includes(hold), mid: mid.st, after: s1.st, char2After: !!s1.char2, reqAfterOff: n1, again: s2.st, loads: s2.cnt.load, scripts: s2.cnt.script, req: t.req.length, uniq, pe: t.pe.length };
      R.D.push(row);
      ck(row.seen && row.mid === 'off' && row.after === 'off' && !row.char2After && ok2 && row.again === 'ready' && row.loads <= 2 && row.scripts === 1 && row.req === row.uniq && row.uniq === 15 && row.pe === 0, 'D ' + JSON.stringify(row));
      await t.bc.close();
    }
    // E: A (on) → B (off) → A while A loads
    { const t = await open(browser, 'c2-pilot-kid4-walk.png');
      await play(t.p, [{ name: 'A', age: 7, x: { char2On: true } }, { name: 'B', age: 8 }], 0);
      let w = 0; while (!t.req.includes('c2-pilot-kid4-walk.png') && w < 15000) { await sleep(100); w += 100; }
      const go = (i) => t.p.evaluate((i) => { save(); const d = Store.all(); d.cur = i; Store.put(d); S = d.slots[i]; S.seen = { intro: 1 }; startGame(); try { closeModal(); } catch (e) {} }, i);
      await go(1); const onB = await state(t.p); t.release(); await sleep(2000); const onB2 = await state(t.p);
      await go(0); const ok = await untilNot(t.p, 'loading', 15000); const onA = await state(t.p);
      await t.p.evaluate(() => save()); const st = await t.p.evaluate(() => Store.all().slots.map((s) => ({ name: s.name, char2: !!s.char2, on: s.char2On === true })));
      R.E = { onB: onB.st, onB2: onB2.st, onBchar2: !!onB2.char2, onA: onA.st, ok, stored: st, req: t.req.length, uniq: new Set(t.req).size, pe: t.pe.length };
      ck(onB.st === 'off' && onB2.st === 'off' && !onB2.char2 && ok && onA.st === 'ready' && onA.char2 && st[0].char2 && !st[1].char2 && R.E.req === R.E.uniq && t.pe.length === 0, 'E ' + JSON.stringify(R.E));
      await t.bc.close(); }
    // F: GM panel
    { const t = await open(browser); await play(t.p, [{ age: 7, x: { gm: true } }], 0); await sleep(500);
      await t.p.evaluate(() => openGM()); await sleep(300);
      const row = await t.p.evaluate(() => { const r = document.getElementById('c234row'), b = document.getElementById('c234on'); return r && b ? { text: r.textContent, h: b.getBoundingClientRect().height, dis: b.disabled, clr: !!document.getElementById('c234clr'), pressed: b.getAttribute('aria-pressed') } : null; });
      await t.p.click('#c234on'); const ok = await untilNot(t.p, 'loading', 15000); await sleep(200);
      const s1 = await state(t.p); const row2 = await t.p.evaluate(() => document.getElementById('c234row')?.textContent || '');
      await t.p.screenshot({ path: path.join(out, 'f-gm-row.png') });
      // 2.36 (Codex T39-N4): the "on" button must read well ON THE PIXELS DRAWN (the frame art paints over the CSS background, so the computed
      // background says nothing): the commonest colour of the button's own screenshot vs its text colour, WCAG contrast ≥ 4.5 · pressed the game's way
      { const bb = await (await t.p.$('#c234on')).boundingBox(), shot = await t.p.screenshot({ clip: bb, encoding: 'base64' });
        R.Fbtn = await t.p.evaluate(async (b64) => { const b = document.getElementById('c234on'), cs = getComputedStyle(b), img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, n = {};
          for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3); n[k] = (n[k] || 0) + 1; }
          const bg = Object.entries(n).sort((a, z) => z[1] - a[1])[0][0].split(',').map((v) => v * 8 + 4), fg = cs.color.match(/\d+/g).slice(0, 3).map(Number);
          const L = (a) => { const s = a.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
          const l1 = L(fg), l2 = L(bg); return { pressed: b.getAttribute('aria-pressed'), inlineBg: b.style.background || '', frames: document.body.classList.contains('art156-frames'), color: cs.color, bg, contrast: +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2) }; }, shot); }
      await t.p.click('#c234clr'); const armed = await t.p.evaluate(() => ({ char2: !!S.char2, on: S.char2On === true, text: document.getElementById('c234clr')?.textContent || '' }));
      await t.p.click('#c234clr'); await sleep(200); const cleared = await t.p.evaluate(() => ({ char2: S.char2 === undefined ? null : S.char2, on: S.char2On, st: C234.st, stored: Store.all().slots[0].char2 === undefined }));
      R.F = { row, s1: s1.st, char2: !!s1.char2, row2: row2.slice(0, 120), armed, cleared, pe: t.pe.length };
      ck(row && !row.dis && row.h >= 44 && !row.clr && row.pressed === 'false' && /ตัวละครรุ่น 2/.test(row.text), 'F row ' + JSON.stringify(row));
      ck(R.Fbtn.pressed === 'true' && !R.Fbtn.inlineBg && R.Fbtn.contrast >= 4.5, 'F on button readable (Codex T39-N4) ' + JSON.stringify(R.Fbtn));
      ck(ok && s1.st === 'ready' && s1.char2 && /พร้อม/.test(row2), 'F on → ready ' + JSON.stringify(R.F).slice(0, 300));
      ck(armed.char2 && armed.on && /แตะอีกครั้ง/.test(armed.text), 'F first tap must not clear ' + JSON.stringify(armed));
      ck(cleared.char2 === null && cleared.on === false && cleared.st === 'off' && cleared.stored && t.pe.length === 0, 'F second tap clears ' + JSON.stringify(cleared));
      await t.bc.close(); }
    { const t = await open(browser); await play(t.p, [{ age: 7, kid: 3, x: { gm: true } }], 0); await sleep(400); await t.p.evaluate(() => openGM()); await sleep(300);
      R.F2 = await t.p.evaluate(() => ({ dis: document.getElementById('c234on')?.disabled, text: document.getElementById('c234row')?.textContent || '' }));
      ck(R.F2.dis === true && /ยังไม่มีตัวแบบนี้/.test(R.F2.text) && t.req.length === 0, 'F boy row ' + JSON.stringify(R.F2));
      await t.bc.close(); }
    // G: the service worker's install leaves the character-v2 files out
    { const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = []; p.on('pageerror', (e) => pe.push(e.message));
      await p.setViewport({ width: 844, height: 390 }); await p.goto(base + '?rank=1', { waitUntil: 'load' });
      await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: 'load' });
      await p.waitForFunction(() => !document.getElementById('load') && !!navigator.serviceWorker.controller, { timeout: 90000 }); await sleep(1500);
      R.G = await p.evaluate(async () => { const out = { caches: await caches.keys(), files: 0, c2: [], bytes: 0 };
        for (const k of out.caches) { const c = await caches.open(k); for (const r of await c.keys()) { out.files++; if (/\/(char2\.js|c2-[^/]*)$/.test(new URL(r.url).pathname)) { out.c2.push(r.url.split('/').pop()); const b = await (await c.match(r)).arrayBuffer(); out.bytes += b.byteLength; } } }
        return out; });
      R.G.pe = pe.length;
      ck(R.G.caches.includes('lantern-v243') && R.G.files > 50 && R.G.c2.length === 0 && R.G.bytes === 0 && pe.length === 0, 'G install ' + JSON.stringify(R.G).slice(0, 300));
      await bc.close(); }
  } catch (e) { errors.push('crash: ' + String(e && e.stack || e).slice(0, 300)); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ results: R, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
