// Claude 2.44 (G4.7 · plan G4_0_GAME_INTEGRATION_PLAN.md §3.1 "S.gm or ?gm" · §15 G4.7): the row "ตัวละครรุ่น 2 (ทดสอบ · เซฟนี้)" in ⚙️ settings when
// the link has ?gm, for the save being played — so the owner can switch the new character on in a player's own save (Leah's). Up to 2.43 the
// row was only in the GM panel, which opens only on the GM slot.
// A  no ?gm (a girl of 7, her own save): settings has no row and no GM row
// B  ?gm, the same save, flag off: the row right above the "🛠 GM" button (not in the settings header), the button ≥ 44 × 44 CSS px and enabled, aria-pressed false, "สถานะ: ปิด" · a
//    real tap → settings is open again with the row · S.char2On === true written by save() for that slot only (the other slot byte-identical, in
//    this slot only char2On and char2 differ) · ready within 15 s · the game draws the player with Char2 (its body count goes up) · reopened while
//    ready: the colour panel is there (17 buttons) and a real tap on a hair colour changes S.char2.color.hair only
// C  the flag stays (D-G4-6 ก): a new page from the NORMAL link, same storage → that save is ready again, settings has no row
// D  ?gm: a tap turns it off (state off, S.char2 kept, settings open again) · "clear" needs a second tap (1st: only the text changes) → S.char2 gone
// E  ?gm, a boy of 7 and a girl of 10: the row is there, the button disabled, "ยังไม่มีตัวแบบนี้", a tap changes nothing
// F  ?gm on the GM slot: no row in settings (the GM panel keeps it) · the GM slot made a girl of 7: the GM panel's button still opens the GM panel
//    again after a tap (2.43 behaviour)
// G  English (LANG en): the row reads "Character v2 (trial · this save)" / "Turn v2 on"
// H  screenshots of settings with the row: phone 844×390 @3 and iPad 1180×820 @2 · the button inside the screen
// No page errors anywhere. Prints one JSON line, then `errors N`.  Run: PORT=8813 CHROME_EXE=/path/to/chromium node test_246_settings.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-246'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8813) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SET = /ตั้งค่า|Settings/;   // the settings title (its ⚙️ is drawn as an icon, not text)
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
const PHONE = { w: 844, h: 390, dpr: 3 }, IPAD = { w: 1180, h: 820, dpr: 2 };
async function open(browser, q, v = PHONE, bc0) {
  const bc = bc0 || await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  p.on('request', (r) => { try { if (/firebase|gstatic|googleapis/.test(r.url())) return r.abort(); r.continue(); } catch (e) {} });
  await p.goto(base + '?rank=1' + (q || ''), { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
const play = (p, saves, cur) => p.evaluate((saves, cur) => {
  const d = Store.all(); d.slots = saves.map((s) => Object.assign(newSave({ name: s.name || 'Pim', kid: s.kid || 0, house: 1, age: s.age || 7 }), s.x || {})); d.cur = cur; Store.put(d);
  S = d.slots[cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
  document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
}, saves, cur);
const resume = (p, cur) => p.evaluate((cur) => { const d = Store.all(); d.cur = cur; Store.put(d); S = d.slots[cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
  document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} }, cur);
const settings = (p) => p.evaluate(() => { try { closeModal(); } catch (e) {} openSettings(); });
const look = (p) => p.evaluate(() => { const row = document.getElementById('c234row'), b = document.getElementById('c234on'), h2 = document.querySelector('#modal h2'), r = b && b.getBoundingClientRect();
  return { title: h2 ? h2.textContent : null, row: !!row, under: !!(row && row.nextElementSibling && row.nextElementSibling.id === 'gmRow' && h2 && !h2.parentElement.contains(row)), gmRow: !!document.getElementById('gmRow'), text: row ? row.textContent : '',
    btn: b ? { w: Math.round(r.width), h: Math.round(r.height), dis: b.disabled, pressed: b.getAttribute('aria-pressed'), text: b.textContent, inside: (b.scrollIntoView({ block: 'center' }), (() => { const q = b.getBoundingClientRect(); return q.top >= 0 && q.left >= 0 && q.bottom <= innerHeight && q.right <= innerWidth; })()) } : null,
    panel: !!document.getElementById('c245'), colours: document.querySelectorAll('#c245 button[data-g]').length, st: C234.st, on: S.char2On, char2: S.char2 === undefined ? null : JSON.parse(JSON.stringify(S.char2)) }; });
const until = (p, fn, ms) => p.waitForFunction(fn, { timeout: ms }).then(() => true).catch(() => false);
const stored = (p) => p.evaluate(() => JSON.parse(JSON.stringify(Store.all().slots)));
const without = (o, keys) => { const c = JSON.parse(JSON.stringify(o)); for (const k of keys) delete c[k]; return c; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // A: the normal link
    { const t = await open(browser, ''); await play(t.p, [{ name: 'Leah', age: 7 }], 0); await settings(t.p); await sleep(300); R.A = await look(t.p);
      ck(R.A.title && SET.test(R.A.title) && !R.A.row && !R.A.gmRow && t.pe.length === 0, 'A no row without ?gm ' + JSON.stringify(R.A).slice(0, 300)); await t.bc.close(); }

    // B, C, D: one storage (one browser context)
    const bc = await browser.createBrowserContext();
    { const t = await open(browser, '&gm', PHONE, bc); await play(t.p, [{ name: 'Leah', age: 7, x: { gender194: 'f', hc: 3 } }, { name: 'Peb', age: 8 }], 0);
      await t.p.evaluate(() => save()); const s0 = await stored(t.p);
      await settings(t.p); await sleep(300); const b0 = await look(t.p);
      R.B = { before: { row: b0.row, under: b0.under, gmRow: b0.gmRow, btn: b0.btn, st: b0.st, text: b0.text.slice(0, 120) } };
      ck(b0.row && b0.under && b0.gmRow && b0.btn && !b0.btn.dis && b0.btn.w >= 44 && b0.btn.h >= 44 && b0.btn.pressed === 'false' && b0.btn.inside && /สถานะ: ปิด/.test(b0.text) && /ตัวละครรุ่น 2 \(ทดสอบ · เซฟนี้\)/.test(b0.text), 'B row before ' + JSON.stringify(R.B.before));
      await t.p.click('#c234on'); await sleep(400); const b1 = await look(t.p);
      const ok = await until(t.p, () => C234.st === 'ready', 15000); const n0 = await t.p.evaluate(() => C234.n.body); await sleep(1000); const n1 = await t.p.evaluate(() => C234.n.body);
      await t.p.evaluate(() => save()); const s1 = await stored(t.p);
      R.B.tap = { reopened: b1.row && SET.test(b1.title || ''), on: b1.on, ready: ok, drawn: n1 - n0, slot1Same: same(s0[1], s1[1]), slot0Rest: same(without(s0[0], ['char2On', 'char2']), without(s1[0], ['char2On', 'char2'])), stored: s1[0].char2On === true && !!s1[0].char2 && s1[0].char2.v === 2 };
      ck(R.B.tap.reopened && R.B.tap.on === true && ok && R.B.tap.drawn > 10 && R.B.tap.slot1Same && R.B.tap.slot0Rest && R.B.tap.stored, 'B tap ' + JSON.stringify(R.B.tap));
      await settings(t.p); await sleep(300); const b2 = await look(t.p);
      const hair0 = b2.char2 && b2.char2.color.hair, pick = await t.p.evaluate((h) => { const b = [...document.querySelectorAll('#c245 button[data-g="hair"]')].find((x) => x.dataset.n !== h); return b ? b.dataset.n : null; }, hair0);
      if (pick) await t.p.click('#c245 button[data-g="hair"][data-n="' + pick + '"]'); await sleep(300); const b3 = await look(t.p);
      R.B.panel = { panel: b2.panel, colours: b2.colours, pressed: b2.btn && b2.btn.pressed, from: hair0, to: pick, now: b3.char2 && b3.char2.color.hair, rest: b2.char2 && b3.char2 && same(Object.assign({}, b2.char2.color, { hair: null }), Object.assign({}, b3.char2.color, { hair: null })) };
      ck(b2.panel && b2.colours === 17 && b2.btn.pressed === 'true' && pick && R.B.panel.now === pick && R.B.panel.rest, 'B colour panel in settings ' + JSON.stringify(R.B.panel));
      await t.p.evaluate(() => document.getElementById('c234row').scrollIntoView({ block: 'start' })); await sleep(200); await t.p.screenshot({ path: path.join(out, 'b-settings-phone.png') });
      ck(t.pe.length === 0, 'B page errors ' + JSON.stringify(t.pe)); await t.p.close(); }
    { const t = await open(browser, '', PHONE, bc); await resume(t.p, 0); const ok = await until(t.p, () => C234.st === 'ready', 15000);
      await settings(t.p); await sleep(300); const c = await look(t.p);
      R.C = { ready: ok, row: c.row, on: c.on };
      ck(ok && !c.row && c.on === true && t.pe.length === 0, 'C flag kept on the normal link, no row ' + JSON.stringify(R.C)); await t.p.close(); }
    { const t = await open(browser, '&gm', PHONE, bc); await resume(t.p, 0); await until(t.p, () => C234.st === 'ready', 15000);
      await settings(t.p); await sleep(300); await t.p.click('#c234on'); await sleep(400); const d1 = await look(t.p); d1.row = d1.row && SET.test(d1.title || '');
      const clr1 = await t.p.evaluate(() => { const c = document.getElementById('c234clr'); return c ? c.textContent : null; });
      await t.p.click('#c234clr'); await sleep(200); const d2 = await look(t.p); const clr2 = await t.p.evaluate(() => { const c = document.getElementById('c234clr'); return c ? c.textContent : null; });
      await t.p.click('#c234clr'); await sleep(400); const d3 = await look(t.p); await t.p.evaluate(() => save()); const s = await stored(t.p);
      R.D = { off: { st: d1.st, on: d1.on, kept: !!d1.char2, reopened: d1.row }, clr1, clr2, armed: !!d2.char2, cleared: { char2: d3.char2, on: d3.on, row: d3.row, stored: s[0].char2 === undefined && s[0].char2On === false } };
      ck(d1.st === 'off' && d1.on === false && d1.char2 && d1.row && clr1 && clr2 !== clr1 && /แตะอีกครั้ง/.test(clr2) && d2.char2 && d3.char2 === null && d3.on === false && d3.row && R.D.cleared.stored && t.pe.length === 0, 'D off / clear ' + JSON.stringify(R.D)); await t.p.close(); }
    await bc.close();

    // E: who may not
    R.E = [];
    for (const s0 of [{ age: 7, kid: 3 }, { age: 10, kid: 0 }]) {
      const t = await open(browser, '&gm'); await play(t.p, [{ age: s0.age, kid: s0.kid }], 0); await settings(t.p); await sleep(300); const e0 = await look(t.p);
      await t.p.evaluate(() => document.getElementById('c234on').click()); await sleep(300); const e1 = await look(t.p);
      const row = { s0, row: e0.row, dis: e0.btn && e0.btn.dis, text: /ยังไม่มีตัวแบบนี้/.test(e0.text), after: e1.on, st: e1.st };
      R.E.push(row); ck(row.row && row.dis && row.text && row.after !== true && row.st === 'off' && t.pe.length === 0, 'E ' + JSON.stringify(row)); await t.bc.close();
    }

    // F: the GM slot
    { const t = await open(browser, '&gm'); await play(t.p, [{ name: 'GM', age: 7, x: { gm: 1 } }], 0); await settings(t.p); await sleep(300); const f0 = await look(t.p);
      await t.p.evaluate(() => { closeModal(); openGM(); }); await sleep(300); const f1 = await look(t.p);
      await t.p.click('#c234on'); await sleep(400); const f2 = await look(t.p);
      R.F = { settingsRow: f0.row, gmRow: f0.gmRow, gmPanelRow: f1.row, title: f2.title, reopenedGm: f2.row && /GM/.test(f2.title || '') && !SET.test(f2.title || ''), on: f2.on };
      ck(!f0.row && f0.gmRow && f1.row && R.F.reopenedGm && f2.on === true && t.pe.length === 0, 'F GM slot ' + JSON.stringify(R.F)); await t.bc.close(); }

    // G: English
    { const t = await open(browser, '&gm'); await play(t.p, [{ age: 7 }], 0); await t.p.evaluate(() => { LANG = 'en'; }); await settings(t.p); await sleep(300); const g = await look(t.p);
      R.G = { text: g.text.slice(0, 80), btn: g.btn && g.btn.text };
      ck(/Character v2 \(trial · this save\)/.test(g.text) && g.btn && g.btn.text === 'Turn v2 on' && t.pe.length === 0, 'G English ' + JSON.stringify(R.G)); await t.bc.close(); }

    // H: iPad
    { const t = await open(browser, '&gm', IPAD); await play(t.p, [{ age: 7 }], 0); await settings(t.p); await sleep(300); const h = await look(t.p);
      await t.p.evaluate(() => document.getElementById('c234row').scrollIntoView({ block: 'center' })); await sleep(200); await t.p.screenshot({ path: path.join(out, 'h-settings-ipad.png') });
      R.H = { btn: h.btn, under: h.under };
      ck(h.row && h.under && h.btn && h.btn.inside && h.btn.h >= 44 && h.btn.w >= 44 && t.pe.length === 0, 'H iPad ' + JSON.stringify(R.H)); await t.bc.close(); }
  } catch (e) { errors.push('crash ' + (e && e.stack || e).toString().slice(0, 400)); }
  await browser.close();
  console.log(JSON.stringify(R));
  console.log('errors ' + errors.length); for (const e of errors) console.log(' - ' + e);
  process.exit(errors.length ? 1 : 0);
})();
