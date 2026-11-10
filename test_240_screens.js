// Claude 2.40–2.41 (G4.4 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.3 §7 rows W13 W14 W15 · D-G4-3 = b (the owner, 10 Nov) · gates M7 M9): the screens
// show the new character — HUD and equipment figure = the face portrait, save picker (big view + each slot) = the whole body facing S —
// at a whole-number scale, with every borrowed sheet released in the same call, and the old pictures when the flag is off / the save is
// not eligible / Char2 has no exact look for that slot.
// Run at 844×390 ×3 (phone) and 1180×820 ×2 (iPad):
// H  HUD: backing = 384/q (q whole), device size = backing (±0.5 px) · pixels = the test's own nearest sample of Char2's portrait (0 differ)
//    · flag off → 64 backing, no inline size, the old picture (non-empty) · on again → the face · house changed → the face redrawn (pixels
//    differ, same size) · switch to an old-style save → old · back → face · borrows 0 right after each draw (Char2.stats: borrowed 0, handles 0)
// E  equipment figure (kids reach it via GM): face, whole-number device size, pixels = the test's own sample (0 differ)
// P  picker: big view of the playing save = the S cell at a whole scale k2 (device / source = k2 · backing = device) and pixels = the test's
//    own drawing of the S cell at that scale (0 differ inside the body box) · slots: the playing girl (live look) and another eligible
//    girl with her own stored look = new; an old save, a 10-year-old with the flag, a girl without the flag, a broken stored look = old
//    (the canvas untouched by the new code) · borrows 0
// B  buttons: every visible HUD / picker button has the same box and the same of its 5 points (centre + 4 inset corners) hitting it with the
//    flag on as with the flag off (old pictures) in the same page, and no point lands on a new picture (the new pictures move / cover nothing)
// F  fallback (2.41 · Codex T44-N1 · a ?gm page): Char2.sheet refused for one mode (a copy of its API in window.Char2) → the picker's big view and
//    the playing slot are exactly the old pictures (size + every pixel = the same page drawing them with the slot made ineligible; the old glow's
//    clock held still for both) and the state stays ready · equipment: refused face → exactly the old figure, failed · a face already shown and
//    refused when the screen turns → replaced by exactly the old figure · borrows 0
// R  turning the screen (2.41 · Codex T44-N2 · ?gm page, the picker's stand path): equipment, HUD and picker big view, each turned and turned back:
//    backing = the box's device size (±1 px) and every face / body pixel = the test's own sample after each turn · borrows 0
// M  memory (M9, phone): Char2.stats().total and its peak ≤ 24 MiB after each event (ready · 4 houses · 120 still frames · picker · equipment ·
//    save switch · flag off) · house changed → one Char2.trim() + the current look rebuilt (cache no bigger) · still → no trim · switch / flag off →
//    the cleanup's one trim · flag off → nothing rebuilt · cold rebuild time per sheet reported (the whole-game count is qa/g4/memory.js)
// Screenshots: hud, picker, equipment — phone and iPad. Prints one JSON line, then `errors N`.
//   PORT=8781 MAIN_PORT=8780 CHROME_EXE=/path/to/chromium node test_240_screens.js
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-240-screens'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8781) + '/';
const mainBase = process.env.MAIN_PORT ? 'http://localhost:' + process.env.MAIN_PORT + '/' : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
const VIEWS = [{ tag: 'phone', w: 844, h: 390, dpr: 3 }, { tag: 'ipad', w: 1180, h: 820, dpr: 2 }];
async function open(browser, v, b = base, qs = '?rank=1') {
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true); p.on('request', (r) => (/firebase|gstatic|googleapis/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto(b + qs, { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
// slots: 0 = the girl 7 playing (flag) · 1 = old boy · 2 = girl 10 with the flag · 3 = girl 8 with the flag + her own look (copied, house 3) ·
// 4 = girl 6 without the flag · 5 = girl 9 with the flag and a broken look (v 3)
async function setup(p, on = true) {
  await p.evaluate((on) => {
    const d = Store.all();
    d.slots = [Object.assign(newSave({ name: 'Pim', kid: 0, house: 1, age: 7 }), on ? { char2On: true } : {}), newSave({ name: 'Old', kid: 1, house: 2, age: 8 }),
      Object.assign(newSave({ name: 'Ten', kid: 0, house: 3, age: 10 }), { char2On: true }), Object.assign(newSave({ name: 'Ann', kid: 0, house: 3, age: 8 }), { char2On: true }),
      newSave({ name: 'Bea', kid: 0, house: 0, age: 6 }), Object.assign(newSave({ name: 'Cat', kid: 0, house: 2, age: 9 }), { char2On: true, char2: { v: 3 } })];
    d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} goMap('capital');
  }, on);
  if (on) await p.waitForFunction(() => C234.st === 'ready', { timeout: 25000 }).catch(() => {});
  await sleep(800);
  await p.evaluate(() => {
    // the test's own eyes: Char2's sheets drawn by the TEST (nearest sampling written out here, not the game's drawImage)
    window.__px = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    window.__portrait = (house) => { const sh = Char2.sheet(C234.app, { house }, 'portrait'); const d = __px(sh.canvas), w = sh.canvas.width; sh.release(); return { d, w }; };
    window.__stand = (app, house) => { const sh = Char2.sheet(app, { house }, 'stand8'); const d = __px(sh.canvas), w = sh.canvas.width; sh.release(); return { d, w }; };
    // compare canvas c with the source (d, w) drawn at scale 1/s with its left-top at device (dx, dy): nearest sample of each pixel centre,
    // the centre rounded DOWN when it falls exactly on a source pixel edge (source = ceil((x + .5 − dx)·s) − 1 — Chrome's own rule, measured:
    // 384→96 samples 1 of each 4, 384→64 sample 2 of 6). Only fully opaque source pixels are compared (semi-transparent ones blend / round).
    window.__cmp = (c, src, s, dx = 0, dy = 0) => { const d = __px(c), W = c.width, H = c.height, sh = src.d.length / 4 / src.w; let n = 0, bad = 0, nz = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.ceil((x + .5 - dx) * s) - 1, sy = Math.ceil((y + .5 - dy) * s) - 1, i = (y * W + x) * 4;
        if (sx < 0 || sy < 0 || sx >= src.w || sy >= sh) continue; const j = (sy * src.w + sx) * 4; if (src.d[j + 3] !== 255) continue; n++; if (d[i + 3]) nz++;
        if (d[i] !== src.d[j] || d[i + 1] !== src.d[j + 1] || d[i + 2] !== src.d[j + 2] || d[i + 3] !== 255) bad++; }
      return { n, bad, nz }; };
    window.__nonEmpty = (c) => { const d = __px(c); let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; };
    window.__dev = (c) => { const r = c.getBoundingClientRect(); return [r.width * devicePixelRatio, r.height * devicePixelRatio]; };
    window.__bor = () => { const s = Char2.stats(); return [s.borrowed, s.handles]; };
    // the plan's box rule, worked out here: backing = the CSS box in device px; face 384/q, q the first of 1 2 3 4 6 8 12 16 24 with 384/q ≤ 1.15 × box; centred
    window.__box = (c) => { const cs = getComputedStyle(c), w = parseFloat(cs.width), h = parseFloat(cs.height), r = c.getBoundingClientRect(), k = r.width / w, dpk = devicePixelRatio * k;
      const bw = Math.round(w * dpk), bh = Math.round(h * dpk), box = Math.min(bw, bh), q = [1, 2, 3, 4, 6, 8, 12, 16, 24].find((q) => 384 / q <= box * 1.15), n = 384 / q;
      return { bw, bh, q, n, x: Math.floor((bw - n) / 2), y: Math.floor((bh - n) / 2), inline: c.style.width + c.style.height }; };
    window.__face = (c) => { const src = __portrait((HOUSES[S.house] || HOUSES[0]).id), b = __box(c); return Object.assign(__cmp(c, src, b.q, b.x, b.y), b, { w: c.width, h: c.height, dev: __dev(c) }); };
    // the picker's big view checked with the test's own scales (see P) — reused after turning the screen
    window.__bigChk = () => { const c = $('pkv'), pk = C234.pk || {}, src = __stand(C234.app, (HOUSES[S.house] || HOUSES[0]).id);
      let top = 0; for (top = 0; top < 96; top++) { let hit = false; for (let x = 0; x < 96; x++) if (src.d[(top * src.w + x) * 4 + 3]) { hit = true; break; } if (hit) break; }
      const u = Math.max(1, Math.round((parseFloat(c.style.width) || 64) / 64)) * Math.max(1, Math.round(devicePixelRatio)), k2 = Math.floor(62 * u / (94 - top));
      return Object.assign(__cmp(c, src, 1 / k2, 32 * u - 48 * k2, 62 * u - 94 * k2), { u, k2, top, game: [pk.u, pk.k2], headY: 62 * u - (94 - top) * k2, w: c.width, h: c.height, dev: __dev(c), stand: pk.stand }); };
    window.__hash = (c) => { const d = __px(c); let h = 2166136261, nz = 0; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); if ((i & 3) === 3 && d[i]) nz++; } return [c.width, c.height, h >>> 0, nz]; };
    window.__wait = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__ready = () => new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 15000 ? r() : setTimeout(k, 50)); k(); });
  });
}
const devOk = (f) => f && Math.abs(f.dev[0] - f.w) <= 1 && Math.abs(f.dev[1] - f.h) <= 1;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  for (const v of VIEWS) {
    const t = await open(browser, v); await setup(t.p);
    // ── H HUD
    const H = await t.p.evaluate(async () => {
      const o = {}, c = document.getElementById('hudPortrait'), hid = () => (HOUSES[S.house] || HOUSES[0]).id;
      const face = () => { const src = __portrait(hid()), b = __box(c); return Object.assign(__cmp(c, src, b.q, b.x, b.y), b, { w: c.width, h: c.height, dev: __dev(c) }); };
      hud(); o.on = face(); o.bor1 = __bor(); o.n1 = C234.n.hud;
      S.char2On = false; c234Sync(); hud(); o.off = { w: c.width, css: c.style.width, nz: __nonEmpty(c), st: C234.st }; o.bor2 = __bor();
      S.char2On = true; c234Sync(); await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 15000 ? r() : setTimeout(k, 50)); k(); }); hud(); o.on2 = face();
      const before = __px(c).slice(); S.house = 3; c234Sync(); hud(); const after = __px(c); let diff = 0; for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) diff++;
      o.house = Object.assign(face(), { diff, st: C234.st }); o.bor3 = __bor();
      return o;
    });
    R[v.tag] = { H };
    const okFace = (f, n) => f.w === f.bw && f.h === f.bh && Math.abs(f.dev[0] - f.bw) <= .5 && Math.abs(f.dev[1] - f.bh) <= .6 && f.n === n && f.inline === '' && f.bad === 0 && f.nz > 1000;
    const n = v.dpr === 3 ? 96 : 64;
    ck(okFace(H.on, n) && okFace(H.on2, n) && okFace(H.house, n), v.tag + ' H face whole scale + pixels ' + JSON.stringify(H));
    ck(H.off.w === 64 && H.off.css === '' && H.off.nz > 200 && H.off.st === 'off', v.tag + ' H flag off = old ' + JSON.stringify(H.off));
    // (the face's own pixel count is the `nz` of the compared pixels: every opaque face pixel the test expects is drawn exactly)
    ck(H.house.diff > 1000, v.tag + ' H house change redrawn ' + H.house.diff);
    ck([H.bor1, H.bor2, H.bor3].every((b) => b[0] === 0 && b[1] === 0), v.tag + ' H borrows ' + JSON.stringify([H.bor1, H.bor2, H.bor3]));
    // save switch to the old boy and back
    const SW = await t.p.evaluate(async () => {
      const d = Store.all(), c = () => document.getElementById('hudPortrait'), o = {};
      S = d.slots[1]; d.cur = 1; Store.put(d); c234Sync(); hud(); o.old = { w: c().width, css: c().style.width, st: C234.st };
      S = Store.all().slots[0]; c234Sync(); await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 15000 ? r() : setTimeout(k, 50)); k(); }); hud();
      o.back = { w: c().width, st: C234.st }; o.bor = __bor(); return o;
    });
    R[v.tag].SW = SW;
    ck(SW.old.w === 64 && SW.old.css === '' && SW.old.st === 'off' && SW.back.st === 'ready' && SW.back.w !== 64 && SW.bor[0] === 0 && SW.bor[1] === 0, v.tag + ' H save switch ' + JSON.stringify(SW));
    await t.p.screenshot({ path: path.join(out, 's-' + v.tag + '-hud.png'), clip: { x: 0, y: 10, width: 190, height: 100 } });
    // ── E equipment figure (GM path)
    const E = await t.p.evaluate(async () => { try { openGridBag(); } catch (e) { return { err: e.message }; }
      await new Promise((r) => setTimeout(r, 400)); const c = document.getElementById('equipPortrait'); if (!c) return { none: true };
      const src = __portrait((HOUSES[S.house] || HOUSES[0]).id), b = __box(c); return Object.assign(__cmp(c, src, b.q, b.x, b.y), b, { w: c.width, h: c.height, dev: __dev(c), cnt: C234.n.equip, bor: __bor(), same: c === document.getElementById('equipPortrait') }); });
    R[v.tag].E = E;
    ck(!E.none && !E.err && E.w === E.bw && E.h === E.bh && Math.abs(E.dev[0] - E.bw) <= .5 && E.inline === '' && E.cnt >= 1 && E.nz > 1000 && E.bad === 0 && E.bor[0] === 0 && E.bor[1] === 0, v.tag + ' E equipment face ' + JSON.stringify(E));
    await t.p.screenshot({ path: path.join(out, 's-' + v.tag + '-equip.png') });
    await t.p.evaluate(() => { try { closeModal(); } catch (e) {} });
    // ── P picker
    await t.p.evaluate(() => { try { save(); } catch (e) {} const d = Store.all(); d.slots[3].char2 = JSON.parse(JSON.stringify(S.char2)); Store.put(d); C193.pick = 0; openPicker(Store.all()); });
    await sleep(900);
    const P = await t.p.evaluate(() => {
      const o = {}, c = $('pkv'), sl = Store.all().slots, pk = C234.pk || {};
      const src = __stand(C234.app, (HOUSES[S.house] || HOUSES[0]).id);
      // the test's own scales (not the game's C234.pk): u = the old view's scale (its CSS width / 64) × round(DPR) · top = the S cell's first
      // opaque row in the test's own copy of the sheet · k2 = the largest whole scale with the head inside: floor(62u / (94 − top))
      let top = 0; for (top = 0; top < 96; top++) { let hit = false; for (let x = 0; x < 96; x++) if (src.d[(top * src.w + x) * 4 + 3]) { hit = true; break; } if (hit) break; }
      const u = Math.max(1, Math.round((parseFloat(c.style.width) || 64) / 64)) * Math.max(1, Math.round(devicePixelRatio)), k2 = Math.floor(62 * u / (94 - top));
      // big view: the S cell drawn at k2 with feet (48,94) on (32u, 62u) → its left-top at device (32u − 48k2, 62u − 94k2)
      o.big = Object.assign(__cmp(c, src, 1 / k2, 32 * u - 48 * k2, 62 * u - 94 * k2), { u, k2, top, game: [pk.u, pk.k2], headY: 62 * u - (94 - top) * k2, w: c.width, h: c.height, dev: __dev(c), stand: pk.stand });
      o.slots = [...document.querySelectorAll('#pk .pn canvas')].map((cv, i) => ({ i, name: sl[i] && sl[i].name, w: cv.width, css: cv.style.width, c2: cv.dataset.c2 === '1', dev: __dev(cv) }));
      o.n = { pick: C234.n.pick, list: C234.n.list }; o.pl = C234.pl; o.bor = __bor();
      // which slots the new code drew: dataset.c2 (2.41: no inline size is set — the stylesheet's 44 px !important holds the CSS box)
      o.newSlots = o.slots.filter((s) => s.c2).map((s) => s.name);
      // the playing girl's slot picture vs the test's own crop of the S cell
      //   own sizes: n0 = an untouched (old) slot picture's CSS width × DPR · k = round(n0 / 64) · m = floor(n0 / k) · size = m·k (not the game's C234.pl)
      const cvs = [...document.querySelectorAll('#pk .pn canvas')], cv0 = cvs[0], cOld = cvs.find((x) => !x.dataset.c2), pl = C234.pl || {};
      if (cOld) { const n0 = Math.round(parseFloat(getComputedStyle(cOld).width) * devicePixelRatio), k = Math.max(1, Math.round(n0 / 64)), m = Math.min(96, Math.floor(n0 / k)), x0 = 48 - Math.floor(m / 2), y0 = Math.max(0, Math.min(96 - m, 6));
        o.slot0 = Object.assign(__cmp(cv0, src, 1 / k, -x0 * k, -y0 * k), { n0, k, m, size: m * k, w: cv0.width, game: [pl.n, pl.k, pl.m] }); }
      return o;
    });
    R[v.tag].P = P;
    ck(Number.isInteger(P.big.k2) && P.big.k2 >= 2 && P.big.headY >= 0 && P.big.game[1] === P.big.k2 && P.big.game[0] === P.big.u && Math.abs(P.big.dev[0] - P.big.w) <= .5 && P.big.n > 2000 && P.big.bad === 0, v.tag + ' P big view whole scale + pixels ' + JSON.stringify(P.big));
    ck(JSON.stringify(P.newSlots) === JSON.stringify(['Pim', 'Ann']), v.tag + ' P new slots = Pim + Ann only ' + JSON.stringify(P.newSlots));
    ck(P.slot0 && P.slot0.n > 500 && P.slot0.bad === 0 && P.slot0.w === P.slot0.size && P.slots.every((s) => s.css === '') && P.slots.filter((s) => s.c2).every((s) => Math.abs(s.dev[0] - s.w) <= .5), v.tag + ' P slot picture ' + JSON.stringify([P.slot0, P.slots]));
    ck(P.bor[0] === 0 && P.bor[1] === 0, v.tag + ' P borrows ' + JSON.stringify(P.bor));
    await t.p.screenshot({ path: path.join(out, 's-' + v.tag + '-picker.png') });
    // ── B buttons: the same page, flag on vs flag off (old pictures): every visible button keeps its box and its 5 hit points, and no point
    //    lands on a new picture (#hudPortrait · #pkv · a slot canvas the new code sized · #equipPortrait) unless that picture is inside it
    // (the status line (sys175, which moves the HUD down) and the quest-log button follow the screen on the game's own timers: sysDraw175() then
    //  qlPlace188() are called first so both states are measured settled)
    const btn = async (p) => p.evaluate(() => { try { if (typeof sysDraw175 === 'function') sysDraw175(); if (typeof qlPlace188 === 'function') qlPlace188(); } catch (e) {} const pics = ['hudPortrait', 'pkv', 'equipPortrait'].map((i) => document.getElementById(i)).filter(Boolean).concat([...document.querySelectorAll('#pk .pn canvas')].filter((c) => c.dataset.c2));
      return [...document.querySelectorAll('button,.pn,[role=button]')].filter((b) => { const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.top < innerHeight && r.left < innerWidth && r.bottom > 0 && r.right > 0; })
        .map((b, n) => { const r = b.getBoundingClientRect(), pts = [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]].map(([a, c]) => [r.left + r.width * a, r.top + r.height * c]);
          let hit = 0, onPic = 0; for (const [x, y] of pts) { const e = document.elementFromPoint(x, y); if (e && (e === b || b.contains(e))) hit++; else if (e && pics.some((q) => q === e || q.contains(e))) onPic++; }
          return { n, id: b.id || String(b.className).slice(0, 20) || b.textContent.trim().slice(0, 14), box: [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10), hit, onPic }; }); });
    const B = {};
    { const t2 = await open(browser, v); await setup(t2.p);
      await t2.p.evaluate(() => { try { save(); } catch (e) {} openPicker(Store.all()); }); await sleep(900); const pickOn = await btn(t2.p);
      await t2.p.evaluate(() => { document.querySelectorAll('#cr').forEach((e) => e.classList.add('hide')); hud(); }); await sleep(300); const hudOn = await btn(t2.p);
      await t2.p.evaluate(() => { S.char2On = false; c234Sync(); hud(); }); await sleep(300); const hudOff = await btn(t2.p);
      await t2.p.evaluate(() => { try { save(); } catch (e) {} openPicker(Store.all()); }); await sleep(900); const pickOff = await btn(t2.p);
      B.pick = { on: pickOn, off: pickOff }; B.hud = { on: hudOn, off: hudOff }; t2.pe.length && errors.push(v.tag + ' B page errors ' + t2.pe.join(' | ')); await t2.bc.close(); }
    R[v.tag].B = { pick: B.pick.on.length, hud: B.hud.on.length };
    for (const k of ['pick', 'hud']) {
      // matched by id (and its order among the same id): present in both → the same box and hits · #msg = a passing toast (its text decides its box)
      const key = (L) => { const c = {}; return L.filter((b) => b.id !== 'msg').map((b) => Object.assign({ key: b.id + '#' + (c[b.id] = (c[b.id] || 0) + 1) }, b)); };
      const on = key(B[k].on), off = key(B[k].off), offBy = Object.fromEntries(off.map((b) => [b.key, b])), onBy = Object.fromEntries(on.map((b) => [b.key, b]));
      const both = on.filter((b) => offBy[b.key]), diff = both.filter((b) => JSON.stringify(offBy[b.key].box) !== JSON.stringify(b.box) || offBy[b.key].hit !== b.hit);
      R[v.tag].B[k + 'OneSide'] = on.filter((b) => !offBy[b.key]).map((b) => 'on:' + b.key).concat(off.filter((b) => !onBy[b.key]).map((b) => 'off:' + b.key));   // a button that came or went with time (not with the flag)
      ck(both.length >= Math.min(on.length, off.length) - 1 && diff.length === 0, v.tag + ' B ' + k + ' buttons differ flag on vs off ' + JSON.stringify(diff.map((b) => [b, offBy[b.key]])));
      R[v.tag].B[k + 'OnPic'] = on.filter((b) => b.onPic).map((b) => [b.id, b.onPic, b.hit]);   // reported: a covered button (hit 0 on and off) may sit under a picture of the screen on top
      R[v.tag].B[k + 'Under44'] = on.filter((b) => Math.min(b.box[2], b.box[3]) < 44).map((b) => b.id + ' ' + b.box[2] + '×' + b.box[3]);   // reported: already so with the flag off (same boxes, checked above)
    }
  }
  for (const v of VIEWS) {
    // ── F fallback (T44-N1 · a ?gm page, the kids' way to the equipment screen): Char2.sheet refused for one mode through a copy of its API in
    //    window.Char2 (the game's files untouched) → the picker's big view + the playing slot = exactly the old pictures (size + every pixel = the
    //    same page drawing them with that slot made ineligible) and the state stays ready · equipment: a refused face → the old figure (every
    //    pixel = a fresh old drawing), state failed · a face already shown, refused when the screen turns → replaced by the old figure · borrows 0
    const t = await open(browser, v, base, '?gm'); await setup(t.p);
    const F = await t.p.evaluate(async () => {
      const real = window.Char2, o = {}; window.__deny = null; window.__denied = 0;
      window.Char2 = Object.assign({}, real, { sheet: (a, opt, m) => { if (m === __deny) { __denied++; return null; } return real.sheet(a, opt, m); } });
      try { save(); } catch (e) {} const cvs = () => document.querySelectorAll('#pk .pn canvas');
      // the old big view's glow pulses with performance.now() → both drawings are made (synchronously) with it held at one value, and read at once
      const still = (f) => { performance.now = () => 4321; try { f(); } finally { delete performance.now; } };
      __deny = 'stand8'; C193.pick = 0; still(() => openPicker(Store.all()));
      o.a = { big: __hash($('pkv')), slot0: __hash(cvs()[0]), c2: cvs()[0].dataset.c2 || '', denied: __denied, st: C234.st, stand: $('pkv').height !== $('pkv').width };
      let d = Store.all(); d.slots[0].char2On = false; Store.put(d); still(() => openPicker(Store.all()));
      o.b = { big: __hash($('pkv')), slot0: __hash(cvs()[0]) }; d = Store.all(); d.slots[0].char2On = true; Store.put(d); await __wait(300);
      document.querySelectorAll('#cr').forEach((e) => e.classList.add('hide')); hud();
      __deny = 'portrait'; __denied = 0; openGridBag(); await __wait(500); const e = document.getElementById('equipPortrait');
      o.e = { h: __hash(e), c2: e.dataset.c2 || '', st: C234.st, denied: __denied, ref: __hash(C234.eqOld()) }; try { closeModal(); } catch (x) {}
      __deny = null; S.char2On = false; c234Sync(); S.char2On = true; c234Sync(); await __ready(); hud(); openGridBag(); await __wait(500);
      const e2 = document.getElementById('equipPortrait'); window.__e0 = e2; o.e2a = { c2: e2.dataset.c2 || '', w: e2.width, st: C234.st }; __deny = 'portrait'; __denied = 0;
      return o; });
    await t.p.setViewport({ width: v.h, height: v.w, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); await sleep(700);
    F.e2b = await t.p.evaluate(() => { const e = document.getElementById('equipPortrait'); return { same: e === __e0, h: __hash(e), c2: e.dataset.c2 || '', st: C234.st, denied: __denied, ref: __hash(C234.eqOld()), bor: __bor() }; });
    R[v.tag].F = F; t.pe.length && errors.push(v.tag + ' F page errors ' + t.pe.join(' | ')); await t.bc.close();
    ck(F.a.denied >= 2 && F.a.st === 'ready' && F.a.c2 === '' && same(F.a.big, F.b.big) && same(F.a.slot0, F.b.slot0) && F.a.big[3] > 500 && F.a.slot0[3] > 200,
      v.tag + ' F picker: no sheet → the old big view and slot, exactly ' + JSON.stringify([F.a, F.b]));
    ck(F.e.denied >= 1 && F.e.st === 'failed' && F.e.c2 === '' && same(F.e.h, F.e.ref) && F.e.h[3] > 500, v.tag + ' F equipment: no face → the old figure, exactly ' + JSON.stringify(F.e));
    ck(F.e2a.c2 === '1' && F.e2a.st === 'ready' && F.e2b.denied >= 1 && !F.e2b.same && F.e2b.c2 === '' && same(F.e2b.h, F.e2b.ref) && F.e2b.st === 'failed' && F.e2b.bor[0] === 0 && F.e2b.bor[1] === 0,
      v.tag + ' F equipment: face refused on a turn → the old figure ' + JSON.stringify([F.e2a, F.e2b]));
  }
  for (const v of VIEWS) {
    // ── R turning the screen (T44-N2 · ?gm page, the picker's stand path): equipment open → turn → back · HUD → turn → back · picker → turn →
    //    back: after each, backing = the box's device size (±1 px) and every face / body pixel = the test's own sample (0 differ) · borrows 0
    const t = await open(browser, v, base, '?gm'); await setup(t.p);
    const turn = async (k) => { const w = k % 2 ? v.h : v.w, h = k % 2 ? v.w : v.h; await t.p.setViewport({ width: w, height: h, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); await sleep(700); };
    const RR = { e: [], h: [], p: [] };
    await t.p.evaluate(async () => { openGridBag(); await __wait(500); });
    for (let k = 0; k < 3; k++) { if (k) await turn(k); RR.e.push(await t.p.evaluate(() => { const c = document.getElementById('equipPortrait'); return Object.assign(__face(c), { cnt: C234.n.equip, c2: c.dataset.c2 || '', bor: __bor() }); })); }
    await t.p.evaluate(() => { try { closeModal(); } catch (e) {} hud(); });
    for (let k = 0; k < 3; k++) { if (k) await turn(k); RR.h.push(await t.p.evaluate(() => Object.assign(__face(document.getElementById('hudPortrait')), { bor: __bor() }))); }
    await t.p.evaluate(async () => { try { save(); } catch (e) {} C193.pick = 0; openPicker(Store.all()); await __wait(700); });
    for (let k = 0; k < 3; k++) { if (k) await turn(k); RR.p.push(await t.p.evaluate(() => Object.assign(__bigChk(), { bor: __bor() }))); }
    R[v.tag].R = RR; t.pe.length && errors.push(v.tag + ' R page errors ' + t.pe.join(' | ')); await t.bc.close();
    const bor0 = (x) => x.bor[0] === 0 && x.bor[1] === 0;
    ck(RR.e.every((f) => devOk(f) && f.w === f.bw && f.h === f.bh && f.c2 === '1' && f.bad === 0 && f.nz > 1000 && bor0(f)), v.tag + ' R equipment follows the turn ' + JSON.stringify(RR.e));
    ck(RR.h.every((f) => devOk(f) && f.w === f.bw && f.h === f.bh && f.bad === 0 && f.nz > 500 && bor0(f)), v.tag + ' R HUD follows the turn ' + JSON.stringify(RR.h));
    ck(RR.p.every((f) => devOk(f) && f.stand === true && f.game[1] === f.k2 && f.game[0] === f.u && f.headY >= 0 && f.bad === 0 && f.n > 2000 && bor0(f)), v.tag + ' R picker big view (stand) follows the turn ' + JSON.stringify(RR.p));
  }
  // ── M M9 memory (plan §8 M9 · phone): Char2.stats().total ≤ 24 MiB after each event and its peak ≤ 24 MiB · policy: house changed → Char2.trim()
  //    once and the current look rebuilt at once (the cache no bigger than before) · nothing changed → no trim (120 frames) · save switch / flag off
  //    → trimmed by the cleanup (one trim, not two) · flag off → nothing rebuilt (cache 0 and no new build over 30 frames) · rebuild time reported
  {
    const v = VIEWS[0], t = await open(browser, v); await setup(t.p);
    const M = await t.p.evaluate(async () => {
      const MiB = (x) => +(x / 1048576).toFixed(2), fr = (n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      // Char2 is frozen (its trim cannot be wrapped): a trim is seen by its effect — every cached sheet evicted at once (Char2's own evict count)
      const frozen = Object.isFrozen(Char2), trim0 = () => Char2.trim();
      const ev = [], st = (tag) => { const s = Char2.stats(); ev.push({ tag, total: MiB(s.total), cache: MiB(s.cache), cached: s.entries.cached, peak: MiB(s.peak), miss: s.miss, evict: s.evict, n: C234.n.trim, st: C234.st }); };
      P.path = P.act = null; await fr(20); hud(); await fr(4); st('ready');
      for (const h of [0, 2, 3, 1]) { S.house = h; hud(); await fr(4); st('house' + h); }
      await fr(120); st('still120');
      // rebuild time of the current look (each mode built cold once, after a trim) · reported
      const hid = (HOUSES[S.house] || HOUSES[0]).id, time = {}; for (const m of ['idle', 'walk', 'portrait', 'stand8']) { trim0(); const t0 = performance.now(), sh = Char2.sheet(C234.app, { house: hid }, m); time[m] = +(performance.now() - t0).toFixed(1); sh && sh.release(); }
      await fr(4); st('timed');
      try { save(); } catch (e) {} const d = Store.all(); d.slots[3].char2 = JSON.parse(JSON.stringify(S.char2)); Store.put(d); C193.pick = 0; openPicker(Store.all()); await new Promise((r) => setTimeout(r, 600)); st('picker');
      document.querySelectorAll('#cr').forEach((e) => e.classList.add('hide')); hud(); try { openGridBag(); } catch (e) {} await new Promise((r) => setTimeout(r, 600)); st('equip'); try { closeModal(); } catch (e) {}
      const d2 = Store.all(); d2.cur = 3; Store.put(d2); S = d2.slots[3]; c234Sync(); await new Promise((r) => { const t0 = Date.now(); const k = () => (C234.st === 'ready' || Date.now() - t0 > 15000 ? r() : setTimeout(k, 50)); k(); }); hud(); await fr(6); st('switch');
      S.char2On = false; c234Sync(); hud(); await fr(2); st('off'); await fr(30); st('off30');
      return { ev, time, frozen };
    });
    R.M = M; t.pe.length && errors.push('M page errors ' + t.pe.join(' | ')); await t.bc.close();
    const E = Object.fromEntries(M.ev.map((e) => [e.tag, e])), L = 24;
    ck(M.ev.every((e) => e.total <= L && e.peak <= L), 'M total / peak ≤ 24 MiB ' + JSON.stringify(M.ev.map((e) => [e.tag, e.total, e.peak])));
    // a trim = every sheet cached before is evicted (evict + cached-before) · then the current look is built again (miss + the same count)
    const dEv = (a, b) => E[b].evict - E[a].evict, dMiss = (a, b) => E[b].miss - E[a].miss;
    ck(E.ready.st === 'ready' && E.ready.evict === 0 && E.ready.n === 0, 'M ready, nothing evicted yet ' + JSON.stringify(E.ready));
    const HS = ['ready', 'house0', 'house2', 'house3', 'house1'];
    ck(HS.slice(1).every((k, i) => E[k].n === i + 1 && dEv(HS[i], k) === E[HS[i]].cached && dMiss(HS[i], k) === E[k].cached && E[k].cache <= E.ready.cache && E[k].cached <= E.ready.cached),
      'M house change = one trim (all evicted) + the current look rebuilt, cache no bigger ' + JSON.stringify(HS.map((k) => E[k])));
    ck(E.still120.n === E.house1.n && dEv('house1', 'still120') === 0 && dMiss('house1', 'still120') === 0, 'M no change → no trim, no build over 120 frames ' + JSON.stringify(E.still120));
    ck(E.switch.st === 'ready' && E.switch.n === E.equip.n && dEv('equip', 'switch') === E.equip.cached, 'M save switch = the cleanup\'s one trim (C234.n.trim unchanged) ' + JSON.stringify([E.equip, E.switch]));
    ck(E.off.st === 'off' && E.off.n === E.switch.n && dEv('switch', 'off') === E.switch.cached && E.off.cached === 0 && E.off30.cached === 0 && dMiss('off', 'off30') === 0 && dMiss('switch', 'off') === 0,
      'M flag off = one trim, nothing rebuilt ' + JSON.stringify([E.off, E.off30]));
  }
  console.log(JSON.stringify({ errors, results: R }));
  console.log('errors', errors.length);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.log(JSON.stringify({ errors: ['crash ' + String(e && e.stack || e).slice(0, 400)] })); console.log('errors 1'); process.exit(2); });
