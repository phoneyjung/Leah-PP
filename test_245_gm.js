// Claude 2.42 (G4.5 · plan G4_0_GAME_INTEGRATION_PLAN.md §6.4 + §8 M8 M9 · DESIGN_CHAR2_SAVE_MIGRATION.md §7 T1–T12): the GM colour panel of character v2,
// the full save table in the real game, and the memory of eight looks in a row. Saves are made here (no real save). Gates M8 (full) and M9.
// G  the panel (phone 844×390 @3 · iPad 1180×820 @2, S.gm): only while ready · 17 buttons = the pack's palette (hair 8 · eyes 5 · skin 4) in its order,
//    each ≥ 44 × 44 CSS px · the chosen colours pressed (aria-pressed) · Thai names (English with LANG en) · the preview = the portrait of the look
//    (the test's own sample, 0 pixels differ)
// C  a real tap on "hair pink": S.char2.color.hair → pink and nothing else changes — the stored save before/after: only the top-level key char2 differs,
//    inside it only color.hair · the button pressed, the name shown · preview and HUD face = the new look's portrait (0 differ) · trim once ·
//    wrong calls (unknown colour / group / an array / flag off) change nothing
// N  no panel when the flag is off, for a boy, when failed (a v3 look), while loading (the pack held) — it appears once ready and the panel is reopened
// P  the colours stay: a new page in the same storage reads them (ready, migrated 0 times) · flag off → on keeps them · clear → gone · flag on again →
//    migrated again from the old fields
// T  the save table in the game (each: state, S.char2 colours + from, the migration step leaves a fixture unchanged, the appearance fields unchanged,
//    written by save()): T1 only kid/house/age · T2 hc/ec · T3 hcol/ecol · T4 appearance169 · T5 gmSprite170 + appearance169 · T6 pd219 tn 0–3 ·
//    T7 pd219 set 8 · T8 a boy (no S.char2) · T9 hc 99 / pd219 tn −5 / pd219 incomplete / nulls · T10 4 slots, cur in the middle, sid: only that slot
//    gets char2, the other 3 stored byte-identical · T11 the old key leahpp2d-v1 · T12 an S.char2 already there (read, not rewritten)
// M  memory (M9, phone): eight looks in a row through the panel (hair round the palette back to the start): each tap = one trim (every cached sheet
//    evicted, Char2's own count) · Char2.stats().total and peak ≤ 24 MiB · back at the start the HUD face and the preview are the same pixels as before ·
//    time from tap to the next frame reported
// Prints one JSON line, then `errors N`.  Run: PORT=8812 CHROME_EXE=/path/to/chromium node test_245_gm.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-245'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8812) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = { T: [] };
const ck = (c, m) => { if (!c) errors.push(m); };
const VIEWS = [{ tag: 'phone', w: 844, h: 390, dpr: 3 }, { tag: 'ipad', w: 1180, h: 820, dpr: 2 }];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
async function open(browser, v, o = {}) {
  const bc = o.bc || await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  p.on('request', async (r) => { try { if (/firebase|gstatic|googleapis/.test(r.url())) return r.abort(); if (o.hold && o.hold.re.test(r.url())) await o.hold.gate; r.continue(); } catch (e) {} });
  if (o.pre) await p.evaluateOnNewDocument(o.pre, o.preArg);
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
// slots put in storage and the game started on slots[cur]; returns once Char2 has settled (not loading) or after 25 s
async function start(p, slots, cur = 0, wait = true) {
  await p.evaluate((slots, cur) => {
    const d = Store.all(); d.slots = slots.map((x) => Object.assign(newSave({ name: x.name || 'Pim', kid: x.kid === undefined ? 0 : x.kid, house: x.house === undefined ? 1 : x.house, age: x.age || 7 }), x.extra || {}));
    d.cur = cur; Store.put(d); window.__stored0 = JSON.parse(JSON.stringify(Store.all())); S = d.slots[cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; window.__before = JSON.parse(JSON.stringify(S));
    startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} goMap('capital');
  }, slots, cur);
  if (wait) await p.waitForFunction(() => C234.st !== 'loading', { timeout: 25000 }).catch(() => {});
  await sleep(600); await helpers(p);
}
async function helpers(p) {
  await p.evaluate(() => {
    window.__px = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    window.__portrait = (house) => { const sh = Char2.sheet(C234.app, { house }, 'portrait'); const d = __px(sh.canvas), w = sh.canvas.width; sh.release(); return { d, w }; };
    // nearest sample of each pixel centre, the centre rounded down on a source edge (Chrome's rule, see test_240) · only fully opaque source pixels
    window.__cmp = (c, src, s, dx = 0, dy = 0) => { const d = __px(c), W = c.width, H = c.height, sh = src.d.length / 4 / src.w; let n = 0, bad = 0, nz = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.ceil((x + .5 - dx) * s) - 1, sy = Math.ceil((y + .5 - dy) * s) - 1, i = (y * W + x) * 4;
        if (sx < 0 || sy < 0 || sx >= src.w || sy >= sh) continue; const j = (sy * src.w + sx) * 4; if (src.d[j + 3] !== 255) continue; n++; if (d[i + 3]) nz++;
        if (d[i] !== src.d[j] || d[i + 1] !== src.d[j + 1] || d[i + 2] !== src.d[j + 2] || d[i + 3] !== 255) bad++; }
      return { n, bad, nz }; };
    window.__box = (c) => { const cs = getComputedStyle(c), w = parseFloat(cs.width), h = parseFloat(cs.height), r = c.getBoundingClientRect(), k = r.width / w, dpk = devicePixelRatio * k;
      const bw = Math.round(w * dpk), bh = Math.round(h * dpk), box = Math.min(bw, bh), q = [1, 2, 3, 4, 6, 8, 12, 16, 24].find((q) => 384 / q <= box * 1.15), n = 384 / q;
      return { bw, bh, q, n, x: Math.floor((bw - n) / 2), y: Math.floor((bh - n) / 2) }; };
    window.__face = (c) => { if (!c) return null; const src = __portrait((HOUSES[S.house] || HOUSES[0]).id), b = __box(c); return Object.assign({}, b, { size: b.n }, __cmp(c, src, b.q, b.x, b.y), { w: c.width, h: c.height }); };   // n = compared pixels (the box's n is `size`)
    window.__hash = (c) => { if (!c) return null; const d = __px(c); let h = 2166136261; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); } return [c.width, c.height, h >>> 0]; };
    window.__frames = (n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    window.__panel = () => { const d = document.getElementById('c245'); if (!d) return null;
      return { btn: [...d.querySelectorAll('button[data-g]')].map((b) => { const r = b.getBoundingClientRect(); return [b.dataset.g, b.dataset.n, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10, b.getAttribute('aria-pressed'), b.getAttribute('aria-label')]; }),
        names: ['hair', 'iris', 'skin'].map((g) => (document.getElementById('c245n_' + g) || {}).textContent) }; };
    // the appearance fields of the old system (never written by G4)
    window.__APP = ['kid', 'gender194', 'hc', 'ec', 'hcol', 'ecol', 'appearance169', 'gmSprite170', 'pd219', 'gmAdultSkin', 'house', 'age', 'name'];   // (sid is given by the game itself when a save without one starts — 2.26 — so it is checked in T10/T11, not here)
    window.__appOf = (s) => Object.fromEntries(__APP.map((k) => [k, s && s[k] === undefined ? '∅' : JSON.parse(JSON.stringify(s[k]))]));
  });
}
const GIRL = (x) => ({ name: 'Pim', kid: 0, house: 1, age: 7, extra: Object.assign({ char2On: true, gender194: 'f', gm: true, hc: 3 }, x || {}) });
const PD = { v: 1, hair: 1, face: 1, eyes: 1, mouth: 1, body: 1, hc: 4, ec: 3, tn: 2 };
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    const pack = JSON.parse(fs.readFileSync(path.join(__dirname, 'c2-pack.json'), 'utf8')), PAL = pack.palette;
    const palNames = ['hair', 'iris', 'skin'].map((g) => PAL[g].map((x) => x[0]));
    for (const v of VIEWS) {
      // ── G + C
      const t = await open(browser, v); await start(t.p, [GIRL()]);
      const G = await t.p.evaluate(async () => { openGM(); await new Promise((r) => setTimeout(r, 300)); await __frames(3); return { st: C234.st, color: JSON.parse(JSON.stringify(S.char2.color)), panel: __panel(), pv: __face(document.getElementById('c245pv')) }; });
      await t.p.screenshot({ path: path.join(out, 'g-' + v.tag + '.png') });
      const en = await t.p.evaluate(async () => { LANG = 'en'; closeModal(); openGM(); await new Promise((r) => setTimeout(r, 200)); const p = __panel(); LANG = 'th'; closeModal(); openGM(); await new Promise((r) => setTimeout(r, 200)); return p; });
      const groups = ['hair', 'iris', 'skin'].map((g) => (G.panel ? G.panel.btn.filter((b) => b[0] === g).map((b) => b[1]) : []));
      R[v.tag] = { G: { st: G.st, color: G.color, n: G.panel && G.panel.btn.length, min: G.panel && Math.min(...G.panel.btn.map((b) => Math.min(b[2], b[3]))), pressed: G.panel && G.panel.btn.filter((b) => b[4] === 'true').map((b) => b[1]),
        names: G.panel && G.panel.names, label0: G.panel && G.panel.btn[0][5], en: en && { names: en.names, label0: en.btn[0][5] }, pv: G.pv && { n: G.pv.n, bad: G.pv.bad, nz: G.pv.nz, w: G.pv.w, h: G.pv.h } } };
      const g = R[v.tag].G;
      ck(G.st === 'ready' && g.n === 17 && same(groups, palNames) && g.min >= 44 && same(g.pressed, ['red', 'green', 'medium']) && same(g.names, ['แดง', 'เขียว', 'กลาง']) && g.label0 === 'ผม ดำ' &&
        en && same(g.en.names, ['red', 'green', 'medium']) && g.en.label0 === 'Hair black' && g.pv && g.pv.n > 2000 && g.pv.bad === 0, v.tag + ' G panel ' + JSON.stringify(g) + ' groups ' + JSON.stringify(groups));
      // C: a real tap
      const c0 = await t.p.evaluate(() => { save(); return { stored: JSON.parse(JSON.stringify(Store.all().slots[0])), trim: C234.n.trim, color: C234.n.color || 0 }; });
      await t.p.click('#c245 button[data-g="hair"][data-n="pink"]'); await sleep(400);
      const c1 = await t.p.evaluate(async () => { await __frames(3); const st = JSON.parse(JSON.stringify(Store.all().slots[0]));
        return { stored: st, color: JSON.parse(JSON.stringify(S.char2.color)), n: C234.n.color || 0, panel: __panel(), pv: __face(document.getElementById('c245pv')) }; });
      const topDiff = Object.keys(Object.assign({}, c0.stored, c1.stored)).filter((k) => !same(c0.stored[k], c1.stored[k]));
      const c2Diff = [...new Set([...Object.keys(c0.stored.char2 || {}), ...Object.keys(c1.stored.char2 || {})])].filter((k) => !same((c0.stored.char2 || {})[k], (c1.stored.char2 || {})[k]));
      const colDiff = ['hair', 'iris', 'skin'].filter((k) => (c0.stored.char2 || {}).color[k] !== (c1.stored.char2 || {}).color[k]);
      const hudC = await t.p.evaluate(async () => { closeModal(); hud(); await __frames(4); return { hud: __face(document.getElementById('hudPortrait')), trim: C234.n.trim }; });
      const bad = await t.p.evaluate(() => { const before = JSON.stringify(S.char2), r = [c245Set('hair', 'zzz'), c245Set('hat', 'pink'), c245Set('hair', ['pink']), c245Set('hair', 'Pink')];
        S.char2On = false; c234Sync(); r.push(c245Set('hair', 'blue')); const stillOff = JSON.stringify(S.char2) === before; S.char2On = true; c234Sync(); return { r, same: stillOff && JSON.stringify(S.char2) === before }; });
      R[v.tag].C = { topDiff, c2Diff, colDiff, color: c1.color, n: c1.n - c0.color, pressed: c1.panel && c1.panel.btn.filter((b) => b[4] === 'true').map((b) => b[1]), names: c1.panel && c1.panel.names,
        pv: c1.pv && { n: c1.pv.n, bad: c1.pv.bad }, hud: hudC.hud && { n: hudC.hud.n, bad: hudC.hud.bad, w: hudC.hud.w, h: hudC.hud.h }, trims: hudC.trim - c0.trim, bad, pe: t.pe.length };
      const C = R[v.tag].C;
      ck(same(topDiff, ['char2']) && same(c2Diff, ['color']) && same(colDiff, ['hair']) && c1.stored.char2.color.hair === 'pink' && C.n === 1 && same(C.pressed, ['pink', 'green', 'medium']) && C.names[0] === 'ชมพู' &&
        C.pv && C.pv.bad === 0 && C.pv.n > 2000 && C.hud && C.hud.bad === 0 && C.hud.n > 500 && C.trims === 1, v.tag + ' C tap changes hair only, pictures follow ' + JSON.stringify(C));
      ck(same(bad.r, [false, false, false, false, false]) && bad.same, v.tag + ' C wrong calls change nothing ' + JSON.stringify(bad));
      ck(t.pe.length === 0, v.tag + ' G/C page errors ' + t.pe.join(' | '));
      await t.p.screenshot({ path: path.join(out, 'c-' + v.tag + '-hud.png') });
      await t.bc.close();
    }
    const v = VIEWS[0];
    // ── N: no panel unless ready
    { const N = {};
      for (const [lab, slot] of [['flag off', GIRL({ char2On: false })], ['boy', { name: 'Bo', kid: 3, age: 7, extra: { char2On: true, gender194: 'm', gm: true } }], ['failed (v3 look)', GIRL({ char2: { v: 3 } })]]) {
        const t = await open(browser, v); await start(t.p, [slot]);
        N[lab] = await t.p.evaluate(() => { openGM(); return { st: C234.st, row: !!document.getElementById('c234row'), panel: !!document.getElementById('c245'), set: c245Set('hair', 'pink') }; }); N[lab].pe = t.pe.length; await t.bc.close(); }
      let rel = null; const hold = { re: /c2-pack\.json/, gate: new Promise((r) => { rel = r; }) };
      const t = await open(browser, v, { hold }); await start(t.p, [GIRL()], 0, false);
      N.loading = await t.p.evaluate(() => { openGM(); return { st: C234.st, row: !!document.getElementById('c234row'), panel: !!document.getElementById('c245'), set: c245Set('hair', 'pink') }; });
      rel(); await t.p.waitForFunction(() => C234.st === 'ready', { timeout: 25000 }).catch(() => {});
      N.afterReady = await t.p.evaluate(() => { const before = !!document.getElementById('c245'); closeModal(); openGM(); return { st: C234.st, before, reopened: !!document.getElementById('c245') }; }); N.pe = t.pe.length; await t.bc.close();
      R.N = N;
      ck(['flag off', 'boy', 'failed (v3 look)'].every((k) => N[k].row && !N[k].panel && N[k].set === false && N[k].pe === 0) && N['flag off'].st === 'off' && N.boy.st === 'off' && N['failed (v3 look)'].st === 'failed' &&
        N.loading.st === 'loading' && N.loading.row && !N.loading.panel && N.loading.set === false && N.afterReady.st === 'ready' && !N.afterReady.before && N.afterReady.reopened && N.pe === 0, 'N panel only when ready ' + JSON.stringify(N)); }
    // ── P: the colours stay
    { const t = await open(browser, v); await start(t.p, [GIRL()]);
      const set = await t.p.evaluate(() => [c245Set('hair', 'pink'), c245Set('iris', 'amber'), c245Set('skin', 'deep')]); await t.p.evaluate(() => save());
      const t2 = await open(browser, v, { bc: t.bc });
      const p2 = await t2.p.evaluate(async () => { const d = Store.all(); S = d.slots[d.cur]; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); try { closeModal(); } catch (e) {}
        await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st !== 'loading' && C234.st !== 'off' || Date.now() - t0 > 20000 ? r() : setTimeout(k, 50)); k(); });
        const a = { st: C234.st, mig: C234.cnt.migrate, color: JSON.parse(JSON.stringify(S.char2.color)) };
        S.char2On = false; save(); c234Sync(); S.char2On = true; save(); c234Sync(); await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 20000 ? r() : setTimeout(k, 50)); k(); });
        const b = { st: C234.st, color: JSON.parse(JSON.stringify(S.char2.color)) };
        S.char2On = false; delete S.char2; save(); c234Sync(); const c = { st: C234.st, gone: S.char2 === undefined && Store.all().slots[0].char2 === undefined };
        S.char2On = true; c234Sync(); await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 20000 ? r() : setTimeout(k, 50)); k(); });
        return { a, b, c, d: { st: C234.st, color: JSON.parse(JSON.stringify(S.char2.color)), from: S.char2.from } }; });
      R.P = { set, p2, pe: t.pe.length + t2.pe.length };
      ck(same(set, [true, true, true]) && p2.a.st === 'ready' && p2.a.mig === 0 && same(p2.a.color, { hair: 'pink', iris: 'amber', skin: 'deep' }) && same(p2.b.color, p2.a.color) && p2.b.st === 'ready' &&
        p2.c.st === 'off' && p2.c.gone && p2.d.st === 'ready' && same(p2.d.color, { hair: 'red', iris: 'green', skin: 'medium' }) && p2.d.from === 'hc' && R.P.pe === 0, 'P colours stay, clear brings back the old ' + JSON.stringify(R.P));
      await t.bc.close(); }
    // ── T: the save table T1–T12 in the game
    const GOOD = { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: null, face_acc: null, back: null }, color: { hair: 'red', iris: 'blue', skin: 'deep' }, from: 'hc' };
    const W = (x) => ({ name: 'Pim', kid: 0, house: 1, age: 7, extra: Object.assign({ char2On: true, gender194: 'f' }, x) });
    const TABLE = [
      ['T1 only kid/house/age', W({}), { hair: 'brown', iris: 'green', skin: 'medium', from: 'default' }],
      ['T2 hc/ec', W({ hc: 7, ec: 1 }), { hair: 'green', iris: 'black', skin: 'medium', from: 'hc' }],
      ['T3 hcol/ecol', W({ hc: 1, hcol: 6, ecol: 2 }), { hair: 'silver', iris: 'green', skin: 'medium', from: 'hcol' }],
      ['T4 appearance169', W({ appearance169: { v: 1, hair: 2, face: 0, hc: 3, ec: 1 } }), { hair: 'red', iris: 'black', skin: 'medium', from: 'appearance169' }],
      ['T5 gmSprite170 + appearance169', W({ gmSprite170: 'swordsman', appearance169: { v: 1, hair: 1, face: 1, hc: 5, ec: 4 } }), { hair: 'blue', iris: 'amber', skin: 'medium', from: 'appearance169' }],
      ...['light', 'medium', 'tan', 'deep'].map((sk, tn) => ['T6 pd219 tn ' + tn, W({ pd219: Object.assign({}, PD, { tn }) }), { hair: 'pink', iris: 'blue', skin: sk, from: 'pd219' }]),
      ['T7 pd219 set 8', W({ pd219: Object.assign({}, PD, { set: 8, hc: 2, ec: 2, tn: 3 }) }), { hair: 'blonde', iris: 'green', skin: 'deep', from: 'pd219' }],
      ['T9 hc 99', W({ hc: 99, ec: 1 }), { hair: 'brown', iris: 'black', skin: 'medium', from: 'default' }],
      ['T9 pd219 tn −5', W({ pd219: Object.assign({}, PD, { tn: -5 }) }), { hair: 'pink', iris: 'blue', skin: 'medium', from: 'pd219' }],
      ['T9 pd219 incomplete', W({ pd219: { v: 1, hair: 1, hc: 4 }, hc: 2 }), { hair: 'blonde', iris: 'green', skin: 'medium', from: 'hc' }],
      ['T9 nulls', W({ hc: null, ec: null, hcol: null, ecol: null, pd219: null, appearance169: null }), { hair: 'brown', iris: 'green', skin: 'medium', from: 'default' }],
    ];
    for (const [lab, slot, want] of TABLE) {
      const t = await open(browser, v); await start(t.p, [slot]);
      const r = await t.p.evaluate(() => { const app0 = __appOf(__before), app1 = __appOf(S), fx = JSON.parse(JSON.stringify(__before)); delete fx.char2; const copy = JSON.stringify(fx), m = c234Migrate(fx);
        save(); const st = Store.all().slots[0].char2;
        return { st: C234.st, why: C234.why, mig: C234.cnt.migrate, c: S.char2 ? Object.assign({}, S.char2.color, { from: S.char2.from }) : null, appSame: JSON.stringify(app0) === JSON.stringify(app1),
          fixture: JSON.stringify(fx) === copy && !!m && JSON.stringify(m.char2) === JSON.stringify(S.char2), stored: !!(st && st.v === 2) }; });
      r.lab = lab; r.pe = t.pe.length; R.T.push(r);
      ck(r.st === 'ready' && r.mig === 1 && same(r.c, want) && r.appSame && r.fixture && r.stored && r.pe === 0, 'T ' + lab + ' want ' + JSON.stringify(want) + ' got ' + JSON.stringify(r));
      await t.bc.close();
    }
    { // T8 a boy · T12 an S.char2 already there
      const t = await open(browser, v); await start(t.p, [{ name: 'Bo', kid: 3, age: 7, extra: { char2On: true, gender194: 'm', hc: 2 } }]);
      const r8 = await t.p.evaluate(() => { save(); return { st: C234.st, why: C234.why, none: S.char2 === undefined && Store.all().slots[0].char2 === undefined, appSame: JSON.stringify(__appOf(__before)) === JSON.stringify(__appOf(S)) }; });
      r8.lab = 'T8 a boy'; r8.pe = t.pe.length; R.T.push(r8); await t.bc.close();
      ck(r8.st === 'off' && r8.why === 'gender' && r8.none && r8.appSame && r8.pe === 0, 'T8 ' + JSON.stringify(r8));
      const t2 = await open(browser, v); await start(t2.p, [W({ hc: 1, char2: GOOD })]);
      const r12 = await t2.p.evaluate((good) => { save(); return { st: C234.st, mig: C234.cnt.migrate, same: JSON.stringify(Store.all().slots[0].char2) === JSON.stringify(good) }; }, GOOD);
      r12.lab = 'T12 char2 already there'; r12.pe = t2.pe.length; R.T.push(r12); await t2.bc.close();
      ck(r12.st === 'ready' && r12.mig === 0 && r12.same && r12.pe === 0, 'T12 ' + JSON.stringify(r12)); }
    { // T10 four slots, cur in the middle (1), each with its own sid
      const t = await open(browser, v);
      const sid = (x, id) => Object.assign(x, { extra: Object.assign({}, x.extra, { sid: id }) });
      await start(t.p, [sid({ name: 'Bo', kid: 3, age: 7, extra: { gender194: 'm' } }, 's10a'), sid(W({ hc: 5 }), 's10b'), sid(Object.assign(W({ hc: 2 }), { name: 'Ann' }), 's10c'), sid({ name: 'Cy', kid: 0, age: 8, extra: { gender194: 'f' } }, 's10d')], 1);
      const r10 = await t.p.evaluate(() => { save(); const a = __stored0, b = Store.all();
        return { st: C234.st, cur: b.cur, sids: b.slots.map((s) => s.sid), uniq: new Set(b.slots.map((s) => s.sid)).size, others: [0, 2, 3].map((i) => JSON.stringify(a.slots[i]) === JSON.stringify(b.slots[i])),
          char2: b.slots.map((s) => s.char2 ? s.char2.color.hair : null) }; });
      r10.lab = 'T10 four slots'; r10.pe = t.pe.length; R.T.push(r10); await t.bc.close();
      ck(r10.st === 'ready' && r10.cur === 1 && r10.uniq === 4 && same(r10.others, [true, true, true]) && same(r10.char2, [null, 'blue', null, null]) && same(r10.sids, ['s10a', 's10b', 's10c', 's10d']) && r10.pe === 0, 'T10 ' + JSON.stringify(r10)); }
    { // T11 the old key leahpp2d-v1: a save made by the game's own newSave, stored ALONE under the old key (no slots key), then the page reloaded →
      // the game reads it as slot 0 · flag on → migrated; the old fields kept
      const t = await open(browser, v);
      const old = await t.p.evaluate(() => { const o = Object.assign(newSave({ name: 'Old', kid: 0, house: 2, age: 8 }), { hc: 5, ec: 4, gender194: 'f', char2On: true, sid: 'old11' });
        localStorage.removeItem('leahpp2d-slots'); localStorage.setItem('leahpp2d-v1', JSON.stringify(o)); return o; });
      await t.p.reload({ waitUntil: 'load' }); await t.p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
      const r11 = await t.p.evaluate(async (old) => { const d = Store.all(); const fromOld = d.slots.length === 1 && d.slots[0].sid === 'old11' && d.cur === 0;
        S = d.slots[d.cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
        await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st !== 'loading' && C234.st !== 'off' || Date.now() - t0 > 20000 ? r() : setTimeout(k, 50)); k(); });
        save(); const keep = ['kid', 'gender194', 'hc', 'ec', 'hcol', 'ecol', 'appearance169', 'pd219', 'house', 'age', 'name', 'sid'].every((k) => JSON.stringify(S[k]) === JSON.stringify(old[k]));
        const st = JSON.parse(localStorage.getItem('leahpp2d-slots') || 'null');
        return { fromOld, st: C234.st, c: S.char2 ? Object.assign({}, S.char2.color, { from: S.char2.from }) : null, keep, slotsKey: !!(st && st.slots && st.slots[0] && st.slots[0].sid === 'old11' && st.slots[0].char2) }; }, old);
      r11.lab = 'T11 old key'; r11.pe = t.pe.length; R.T.push(r11); await t.bc.close();
      ck(r11.fromOld && r11.st === 'ready' && same(r11.c, { hair: 'blue', iris: 'amber', skin: 'medium', from: 'hc' }) && r11.keep && r11.slotsKey && r11.pe === 0, 'T11 ' + JSON.stringify(r11)); }
    // ── M: eight looks in a row (hair round the palette back to red)
    { const t = await open(browser, v); await start(t.p, [GIRL()]);
      const MiB = (x) => +(x / 1048576).toFixed(2);
      const m0 = await t.p.evaluate(async () => { hud(); openGM(); await __frames(4); const s = Char2.stats();
        return { hud: __hash(document.getElementById('hudPortrait')), pv: __hash(document.getElementById('c245pv')), total: s.total, peak: s.peak, cached: s.entries.cached, evict: s.evict, trim: C234.n.trim }; });
      const order = PAL.hair.map((x) => x[0]), i0 = order.indexOf('red'), seq = [...order.slice(i0 + 1), ...order.slice(0, i0 + 1)], steps = [];
      let prev = m0;
      for (const n of seq) {
        await t.p.evaluate(() => { window.__t0 = performance.now(); });
        await t.p.click('#c245 button[data-g="hair"][data-n="' + n + '"]');
        const s = await t.p.evaluate(async () => { await __frames(1); const ms = performance.now() - __t0; await __frames(3); const s = Char2.stats();
          return { hair: S.char2.color.hair, ms: +ms.toFixed(1), total: s.total, peak: s.peak, cached: s.entries.cached, evict: s.evict, trim: C234.n.trim, borrowed: s.borrowed }; });
        s.n = n; s.trims = s.trim - prev.trim; s.evicted = s.evict - prev.evict; s.cachedBefore = prev.cached; steps.push(s); prev = s;
      }
      const m1 = await t.p.evaluate(async () => { await __frames(3); return { hud: __hash(document.getElementById('hudPortrait')), pv: __hash(document.getElementById('c245pv')), color: S.char2.color.hair }; });
      R.M = { seq, m0: { total: MiB(m0.total), peak: MiB(m0.peak), cached: m0.cached }, steps: steps.map((s) => ({ n: s.n, hair: s.hair, ms: s.ms, total: MiB(s.total), peak: MiB(s.peak), cached: s.cached, trims: s.trims, evicted: s.evicted, cachedBefore: s.cachedBefore, borrowed: s.borrowed })),
        back: { hud: same(m1.hud, m0.hud), pv: same(m1.pv, m0.pv), color: m1.color }, pe: t.pe.length };
      ck(steps.length === 8 && steps.every((s) => s.hair === s.n && s.trims === 1 && s.evicted === s.cachedBefore && MiB(s.total) <= 24 && MiB(s.peak) <= 24 && s.borrowed === 0), 'M eight looks: one trim each, ≤ 24 MiB ' + JSON.stringify(R.M.steps));
      ck(R.M.back.hud && R.M.back.pv && m1.color === 'red' && R.M.pe === 0, 'M back at the start = the same pictures ' + JSON.stringify(R.M.back));
      await t.bc.close(); }
  } catch (e) { errors.push('crash: ' + String(e && e.stack || e).slice(0, 400)); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ results: R, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
