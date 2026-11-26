// Claude 2.45 (G5.5 · plan G5_0_HAT_PLAN.md v1.2 §3 §5): the school beret of character v2 in the real game. Saves are made here (never a real save).
// A  placement (phone, in the game page): every frame the game can draw — idle 29 · walk 48 · walk-with-lantern 48 = 125 of the 128 sheet frames (the
//    other 3 are the blink frame facing N / NE / NW, which the game never shows) — × 4 houses: Char2.draw WITH the hat = the same draw WITHOUT it + the
//    hat pixels put in by THIS test from the raw hat PNG + mask, the house ramp and the pack's shift (+ 1 px up on the W breathing frame) → 0 px differ.
//    On every frame (cell px, from the drawn pixels): eye px covered 0 · crown (head rows top..top+2) covered ≥ 90 % · gap under the hat 0 (the rule of
//    qa/g5/hat_shift.py) · exactly one drawImage of the hat sheet per draw with the hat, none without it · anchor box holds every hat px · head_top ≤ the
//    hat top · label = the highest hat px over idle + walk − 4 (and the old [48,4] without the hat or without app)
// A3 the same 125 frames drawn at scale 3 (the phone's), one house: each hat px = a 3×3 block → 0 px differ
// A4 the face portrait and the 8-way stand preview with the hat = the same without it + the hat layer (portrait layer 384 at 0,0 · stand = frame 0 of each
//    dir at its shift, inside its cell) → 0 px differ, 4 houses
// B  the GM colour panel (phone 844×390 @3 · iPad 1180×820 @2): a hat row with 2 buttons ≥ 44 × 44 CSS px (ไม่ใส่ / เบเร่ต์ · None / Beret), "none"
//    pressed at first, the beret picture = the hat in this house's colours · a real tap on beret: the stored save changes ONLY char2.parts.head (null →
//    'beret') · the preview and the HUD face = the portrait with the hat (0 differ) · the game canvas gets the hat every frame · the name label goes up by
//    the hat (c234D) · tap none: the stored char2 is byte-identical to before the first tap · house change → the hat sheet's cloth = the new house ramp ·
//    wrong calls change nothing · a new page in the same storage keeps the hat · "clear v2" removes it
// F  files: each hat file blocked (404) one at a time and all 4 together, with a save that wears the hat: v2 still ready (body drawn), Char2.hats() [],
//    the beret button dimmed + a note, S.char2 not rewritten, 0 page errors · a broken mask (wrong size) → the same · Codex T58: a hat src that is not a
//    plain file name (`http://[`, N1-A) · the hat sprite never answered (N1-B, ready within 20 s) · one mask px with an id the beret may not use (N2) ·
//    the S cell empty in image + mask (N2) → the same · sw.js lists the 4 files and the hat files come into the offline cache once v2 is on; an offline
//    reload still shows the hat · cache: 8 hair colours, same house → 1 hat sheet (T58-N3)
// P  JS per frame = the time spent inside every requestAnimationFrame callback ÷ frames (CPU 4×, 844×390 @3, the kid walking on the game's own path,
//    12 rounds × 4 s per side, hat off / on, the order alternating). Formula (T58-N4): ratio of a round = on ÷ off of THAT round; the result = the
//    median of the 12 round ratios (not median(on) ÷ median(off)). Pass: JS ≤ 1.10 · fps ≥ 0.90. Also the hat's own cost: Char2.draw with ÷ without
//    the hat at scale 3 (the phone's), 2,000 draws each in alternating blocks of 100, CPU 4× (reported). FPS main 2.44 vs this branch: qa/g4/fps.js, reported apart
// Screens: s-phone-*.png / s-ipad-*.png (panel open · hat on in the game).  Prints one JSON line, then `errors N`.
// Run: PORT=8812 CHROME_EXE=/path/to/chromium node test_250_hat.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-250'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8812) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const VIEWS = [{ tag: 'phone', w: 844, h: 390, dpr: 3 }, { tag: 'ipad', w: 1180, h: 820, dpr: 2 }];
const HATS = ['c2-hat-beret.png', 'c2-hat-beret-mask.png', 'c2-hat-beret-pt.png', 'c2-hat-beret-pt-mask.png'];
const C2 = (head) => ({ v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: head || null, face_acc: null, back: null }, color: { hair: 'red', iris: 'green', skin: 'medium' }, from: 'hc' });
const GIRL = (x) => ({ name: 'Pim', kid: 0, house: 1, age: 7, extra: Object.assign({ char2On: true, gender194: 'f', gm: true, hc: 3 }, x || {}) });
async function open(browser, v, o = {}) {
  const bc = o.bc || await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: v.w < 1000, hasTouch: true }); if (!o.sw) await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  p.on('request', async (r) => { try { const u = r.url(), n = decodeURIComponent(u.split('?')[0].split('/').pop());
    if (/firebase|gstatic|googleapis/.test(u)) return r.abort(); if (o.block && o.block(n)) return r.respond({ status: 404, body: 'blocked' });
    if (o.stall && o.stall(n)) return;   // never answered, never aborted (T58-N1 case B)
    if (o.swap && o.swap[n]) { const w = o.swap[n]; return r.respond(Buffer.isBuffer(w) ? { status: 200, contentType: 'image/png', body: w } : { status: 200, contentType: w.type, body: w.body }); } r.continue(); } catch (e) {} });
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
async function start(p, slot, keep) {
  await p.evaluate((x, keep) => {
    const d = Store.all(); if (!keep) { d.slots = [Object.assign(newSave({ name: x.name, kid: x.kid, house: x.house, age: x.age }), x.extra || {})]; d.cur = 0; Store.put(d); }
    S = d.slots[d.cur]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {} goMap('capital');
  }, slot, !!keep);
  await p.waitForFunction(() => C234.st !== 'loading', { timeout: 25000 }).catch(() => {});
  await sleep(600); await helpers(p);
}
async function helpers(p) {
  await p.evaluate(async () => {
    const img = (u) => new Promise((r) => { const i = new Image(); setTimeout(() => r(null), 4000);   // a stalled file (case N1-B) must not hang the test's own reader
      i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); r(g.getImageData(0, 0, c.width, c.height)); }; i.onerror = () => r(null); i.src = u; });
    const pack = await (await fetch('c2-pack.json', { cache: 'no-store' })).json(), H = pack.heads && pack.heads.beret;
    window.__T = { pack, HA: H && await img(H.src), HM: H && await img(H.mask), PA: H && await img(H.pt), PM: H && await img(H.pt_mask),
      MK: { idle: await img(pack.sheets.idle.mask), walk: await img(pack.sheets.walk.mask), walkhold: await img(pack.sheets.walkhold.mask) } };
    window.__px = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    window.__frames = (n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    // the test's own recolour: id -> group (pack.materials.recolour) -> the ramp of the app's colour (house = dc.house) · other ids = the PNG's own colour
    window.__ramp = (app, house) => { const R = pack.materials.recolour, o = {}; for (const id in R) { const g = R[id], name = g === 'house' ? house : app.color[g]; o[id] = pack.palette[g].find((e) => e[0] === name)[1].map(rgb); } return o; };
    window.__overlay = (d, W, Hh, A, M, ramp, sx, sy, w, h, tx, ty, clip) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((sy + y) * A.width + sx + x) * 4; if (!A.data[i + 3]) continue;
      const X = tx + x, Y = ty + y; if (X < clip[0] || Y < clip[1] || X >= clip[2] || Y >= clip[3]) continue; const q = ramp[M.data[i]], c = q ? q[M.data[i + 1]] : [A.data[i], A.data[i + 1], A.data[i + 2]], j = (Y * W + X) * 4;
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255; } };
    window.__shift = (an, dir, k) => { const v = pack.heads.beret.shift[an][dir][k], b = pack.sheets.idle.breathe; return [v[0], v[1] - (an === 'idle' && dir === b.dir && k === b.frame ? 1 : 0)]; };
    window.__diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { n++; i += 3 - (i % 4); } return n; };
    window.__appWith = (head) => Object.assign({}, C234.app, { parts: Object.assign({}, C234.app.parts, { head }) });
    window.__portrait = (head) => { const sh = Char2.sheet(__appWith(head), { house: (HOUSES[S.house] || HOUSES[0]).id }, 'portrait'); if (!sh) return null; const d = __px(sh.canvas), w = sh.canvas.width; sh.release(); return { d, w }; };
    window.__box = (c) => { const cs = getComputedStyle(c), w = parseFloat(cs.width), h = parseFloat(cs.height), r = c.getBoundingClientRect(), k = r.width / w, dpk = devicePixelRatio * k;
      const bw = Math.round(w * dpk), bh = Math.round(h * dpk), box = Math.min(bw, bh), q = [1, 2, 3, 4, 6, 8, 12, 16, 24].find((q) => 384 / q <= box * 1.15), n = 384 / q;
      return { bw, bh, q, n, x: Math.floor((bw - n) / 2), y: Math.floor((bh - n) / 2) }; };
    window.__cmp = (c, src, s, dx = 0, dy = 0) => { const d = __px(c), W = c.width, H = c.height, sh = src.d.length / 4 / src.w; let n = 0, bad = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.ceil((x + .5 - dx) * s) - 1, sy = Math.ceil((y + .5 - dy) * s) - 1, i = (y * W + x) * 4;
        if (sx < 0 || sy < 0 || sx >= src.w || sy >= sh) continue; const j = (sy * src.w + sx) * 4; if (src.d[j + 3] !== 255) continue; n++;
        if (d[i] !== src.d[j] || d[i + 1] !== src.d[j + 1] || d[i + 2] !== src.d[j + 2] || d[i + 3] !== 255) bad++; } return { n, bad }; };
    window.__face = (c, head) => { if (!c) return null; const src = __portrait(head), b = __box(c); return src ? __cmp(c, src, b.q, b.x, b.y) : null; };
    window.__hatRow = () => { const d = document.getElementById('c255'); if (!d) return null;
      return { btn: [...d.querySelectorAll('button[data-hat]')].map((b) => { const r = b.getBoundingClientRect(); return [b.dataset.hat, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10, b.getAttribute('aria-pressed'), b.getAttribute('aria-label'), b.disabled, getComputedStyle(b).opacity]; }),
        name: (document.getElementById('c255n') || {}).textContent, note: d.children.length > 2, pic: (() => { const c = d.querySelector('canvas[data-hatpic]'); if (!c || c.width < 2) return null; const x = __px(c); const cols = new Set(); let n = 0; for (let i = 0; i < x.length; i += 4) if (x[i + 3]) { n++; cols.add('#' + [x[i], x[i + 1], x[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()); } return { w: c.width, h: c.height, n, cols: [...cols] }; })() }; };
    window.__hatDraws = () => { window.__hd = 0; const DI = CanvasRenderingContext2D.prototype.drawImage; if (window.__hdOn) return; window.__hdOn = 1;
      CanvasRenderingContext2D.prototype.drawImage = function (im) { if (this.canvas && this.canvas.id === 'c' && im && im.width === 768 && im.height === 96) window.__hd++; return DI.apply(this, arguments); }; };
  });
}
// A: in-page placement over every frame the game can draw · returns totals + the worst frames
const placement = (p) => p.evaluate(() => {
  const P = __T.pack, C = P.cell, DIRS = P.dirs, HOUSE = P.palette.house.map((e) => e[0]), T = P.timing, hb = P.sheets.idle.breathe, res = { frames: 0, draws: 0, bad: 0, worst: [], eyes: 0, crownMin: 1, gap: 0, hatPx: 1e9, hatDrawsWith: 0, hatDrawsWithout: 0, box: 0, head: 0, label: null, labelOld: null, labelOldApp: null, labelWant: null };
  const cv = document.createElement('canvas'); cv.width = cv.height = 160; const g = cv.getContext('2d', { willReadFrequently: true });
  const a0 = __appWith(null), a1 = __appWith('beret'), DI = CanvasRenderingContext2D.prototype.drawImage; let hd = 0;
  CanvasRenderingContext2D.prototype.drawImage = function (im) { if (this.canvas === cv && im && im.width === 768 && im.height === 96) hd++; return DI.apply(this, arguments); };
  const states = [];
  for (const d of DIRS) { for (let k = 0; k < 4; k++) if (k < 3 || T.blink_dirs.includes(d)) states.push({ d, an: 'idle', k }); for (let k = 0; k < 6; k++) { states.push({ d, an: 'walk', k }); states.push({ d, an: 'walkhold', k }); } }
  let minTop = 1e9;
  try {
    for (const house of HOUSE) for (const st of states) {
      const A = Char2.actor({ blinkAt: 1e12 }); A.dir = st.d; A.anim = st.an === 'idle' ? 'idle' : 'walk'; A.holding = st.an === 'walkhold';
      if (st.an === 'idle') { A.fi = st.k === 3 ? 3 : st.k; A.blinkNow = st.k === 3; } else A.fi = st.k;
      const dc = { house }; if (A.holding) dc.held = { id: P.lantern.id, on: true, lit: false, power: 0 };
      const fx = 80, fy = 130, ro = P.render_offset[st.d], X0 = Math.round(fx - P.feet[0] + ro), Y0 = Math.round(fy - P.feet[1]);
      g.clearRect(0, 0, 160, 160); hd = 0; const ok0 = Char2.draw(g, a0, dc, A, fx, fy, 1); const d0 = g.getImageData(0, 0, 160, 160).data; res.hatDrawsWithout += hd;
      g.clearRect(0, 0, 160, 160); hd = 0; const ok1 = Char2.draw(g, a1, dc, A, fx, fy, 1); const d1 = g.getImageData(0, 0, 160, 160).data; res.hatDrawsWith += hd; res.draws += 2;
      const di = DIRS.indexOf(st.d), [dx, dy] = __shift(st.an, st.d, st.k), want = new Uint8ClampedArray(d0);
      __overlay(want, 160, 160, __T.HA, __T.HM, __ramp(a1, house), di * C, 0, C, C, X0 + dx, Y0 + dy, [0, 0, 160, 160]);
      const bad = ok0 && ok1 ? __diff(want, d1) : 1e6; res.bad += bad; res.frames++; if (bad) res.worst.push([house, st.d, st.an, st.k, bad]);
      if (house !== HOUSE[0]) continue;
      // measures in cell px (before renderOffset), from the drawn pixels
      const Hs = new Set(), HL = []; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (__T.HA.data[(y * __T.HA.width + di * C + x) * 4 + 3]) { Hs.add((x + dx) + ',' + (y + dy)); HL.push([x + dx, y + dy]); }
      res.hatPx = Math.min(res.hatPx, HL.length);
      const op = []; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (d0[(y * 160 + x) * 4 + 3]) op.push([x - X0, y - Y0]);
      const top = Math.min(...op.map((q) => q[1])), wid = {}; for (const [x, y] of op) if (y >= top && y < 60) wid[y] = (wid[y] || 0) + 1;
      let neck = top + 18; for (let y = top + 18; y < 56; y++) if ((wid[y] || 99) < (wid[neck] || 99)) neck = y;
      const head = op.filter((q) => q[1] < neck), crown = head.filter((q) => q[1] <= top + 2), cov = crown.filter((q) => Hs.has(q[0] + ',' + q[1])).length / Math.max(1, crown.length);
      res.crownMin = Math.min(res.crownMin, cov);
      const first = {}; for (const [x, y] of head) first[x] = Math.min(first[x] === undefined ? 999 : first[x], y);
      const bottom = {}; for (const [x, y] of HL) bottom[x] = Math.max(bottom[x] === undefined ? -999 : bottom[x], y);
      let gp = 0; for (const x in bottom) if (first[x] !== undefined && bottom[x] < first[x] - 1 && first[x] - bottom[x] - 1 <= 6) gp = Math.max(gp, first[x] - bottom[x] - 1); res.gap = Math.max(res.gap, gp);
      const MK = __T.MK[st.an], mw = MK.width; let eyes = 0;   // eye px (mask id 2 / 5) of this frame, W breathing applied like the body
      for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) { const sy = st.an === 'idle' && st.d === hb.dir && st.k === hb.frame && y < hb.cut ? y + 1 : y, i = ((di * C + sy) * mw + st.k * C + x) * 4;
        if (MK.data[i + 3] && (MK.data[i] === 2 || MK.data[i] === 5)) { const X = X0 + x, Y = Y0 + y, j = (Y * 160 + X) * 4; if (d1[j] !== d0[j] || d1[j + 1] !== d0[j + 1] || d1[j + 2] !== d0[j + 2] || d1[j + 3] !== d0[j + 3]) eyes++; } }
      res.eyes += eyes;
      const bx = Char2.anchor(A, 'box', dc, a1), ht = Char2.anchor(A, 'head_top', dc, a1), hTop = Math.min(...HL.map((q) => q[1]));
      if (!bx || HL.some(([x, y]) => x < bx[0] || y < bx[1] || x >= bx[2] || y >= bx[3])) res.box++;
      if (!ht || ht[1] > hTop) res.head++;
      if (st.an !== 'walkhold') minTop = Math.min(minTop, hTop);
      if (!res.label) { res.label = Char2.anchor(A, 'label', dc, a1); res.labelOld = Char2.anchor(A, 'label', dc); res.labelOldApp = Char2.anchor(A, 'label', dc, a0); }
    }
  } finally { CanvasRenderingContext2D.prototype.drawImage = DI; }
  res.labelWant = [P.feet[0], Math.min(4, minTop - 4)]; res.worst = res.worst.slice(0, 8); res.crownMin = Math.round(res.crownMin * 1000) / 1000; return res;
});
// A3: the same at scale 3 (the phone's): all 125 frames, one house, each hat px = a 3×3 block → 0 px differ
const placement3 = (p) => p.evaluate(() => {
  const P = __T.pack, C = P.cell, DIRS = P.dirs, T = P.timing, house = P.palette.house[2][0], s = 3, res = { frames: 0, bad: 0, worst: [] };
  const cv = document.createElement('canvas'); cv.width = cv.height = 400; const g = cv.getContext('2d', { willReadFrequently: true }), a0 = __appWith(null), a1 = __appWith('beret'), ramp = __ramp(a1, house);
  for (const d of DIRS) for (const an of ['idle', 'walk', 'walkhold']) for (let k = 0; k < (an === 'idle' ? 4 : 6); k++) {
    if (an === 'idle' && k === 3 && !T.blink_dirs.includes(d)) continue;
    const A = Char2.actor({ blinkAt: 1e12 }); A.dir = d; A.anim = an === 'idle' ? 'idle' : 'walk'; A.holding = an === 'walkhold'; A.fi = k; A.blinkNow = an === 'idle' && k === 3;
    const dc = { house }; if (A.holding) dc.held = { id: P.lantern.id, on: true, lit: false, power: 0 };
    const fx = 200, fy = 330, X0 = Math.round(fx - P.feet[0] * s + P.render_offset[d] * s), Y0 = Math.round(fy - P.feet[1] * s);
    g.clearRect(0, 0, 400, 400); Char2.draw(g, a0, dc, A, fx, fy, s); const d0 = g.getImageData(0, 0, 400, 400).data;
    g.clearRect(0, 0, 400, 400); Char2.draw(g, a1, dc, A, fx, fy, s); const d1 = g.getImageData(0, 0, 400, 400).data;
    const want = new Uint8ClampedArray(d0), di = DIRS.indexOf(d), [dx, dy] = __shift(an, d, k), HA = __T.HA, HM = __T.HM;
    for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) { const i = (y * HA.width + di * C + x) * 4; if (!HA.data[i + 3]) continue; const q = ramp[HM.data[i]], c = q ? q[HM.data[i + 1]] : [HA.data[i], HA.data[i + 1], HA.data[i + 2]];
      for (let v = 0; v < s; v++) for (let u = 0; u < s; u++) { const X = X0 + (x + dx) * s + u, Y = Y0 + (y + dy) * s + v, j = (Y * 400 + X) * 4; want[j] = c[0]; want[j + 1] = c[1]; want[j + 2] = c[2]; want[j + 3] = 255; } }
    const bad = __diff(want, d1); res.frames++; res.bad += bad; if (bad) res.worst.push([d, an, k, bad]);
  }
  res.worst = res.worst.slice(0, 6); return res;
});
const sheets = (p) => p.evaluate(() => {
  const P = __T.pack, C = P.cell, out = [];
  for (const house of P.palette.house.map((e) => e[0])) {
    const a0 = __appWith(null), a1 = __appWith('beret'), get = (a, m) => { const h = Char2.sheet(a, { house }, m); if (!h) return null; const r = { d: __px(h.canvas), w: h.canvas.width, h: h.canvas.height }; h.release(); return r; };
    const s0 = get(a0, 'stand8'), s1 = get(a1, 'stand8'), p0 = get(a0, 'portrait'), p1 = get(a1, 'portrait'), ramp = __ramp(a1, house);
    const ws = new Uint8ClampedArray(s0.d); for (let di = 0; di < 8; di++) { const [x, y] = __shift('idle', P.dirs[di], 0); __overlay(ws, s0.w, s0.h, __T.HA, __T.HM, ramp, di * C, 0, C, C, di * C + x, y, [di * C, 0, di * C + C, C]); }
    const wp = new Uint8ClampedArray(p0.d); __overlay(wp, p0.w, p0.h, __T.PA, __T.PM, ramp, 0, 0, p0.w, p0.h, 0, 0, [0, 0, p0.w, p0.h]);
    out.push({ house, stand: __diff(ws, s1.d), portrait: __diff(wp, p1.d), standChanged: __diff(s0.d, s1.d), portraitChanged: __diff(p0.d, p1.d) });
  }
  return out;
});
const stored = (p) => p.evaluate(() => { save(); return JSON.parse(JSON.stringify(Store.all().slots[0])); });
const keysDiff = (a, b) => [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].filter((k) => !same((a || {})[k], (b || {})[k]));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    if (!process.env.ONLY_P) {   // ONLY_P=1: the timing part alone
    // ── A + A4 (phone)
    { const t = await open(browser, VIEWS[0]); await start(t.p, GIRL());
      const st = await t.p.evaluate(() => ({ st: C234.st, why: C234.why, hats: Char2.hats(), version: Char2.version, res: C234.res }));
      R.A = Object.assign(st, await placement(t.p)); R.A3 = await placement3(t.p); R.A4 = await sheets(t.p); R.A.pe = t.pe.length;
      const A = R.A;
      ck(A.st === 'ready' && same(A.hats, ['beret']) && A.version === 'g5.5', 'A ready with the beret ' + JSON.stringify(st));
      ck(A.frames === 500 && A.bad === 0, 'A placement 125 frames x 4 houses, 0 px differ ' + JSON.stringify({ frames: A.frames, bad: A.bad, worst: A.worst }));
      ck(A.eyes === 0 && A.crownMin >= 0.9 && A.gap === 0 && A.hatPx > 500, 'A eyes / crown / gap ' + JSON.stringify({ eyes: A.eyes, crown: A.crownMin, gap: A.gap, hatPx: A.hatPx }));
      ck(A.hatDrawsWith === 500 && A.hatDrawsWithout === 0, 'A one hat drawImage per draw with the hat, none without ' + JSON.stringify([A.hatDrawsWith, A.hatDrawsWithout]));
      ck(A.box === 0 && A.head === 0 && same(A.label, A.labelWant) && A.label[1] < 4 && same(A.labelOld, [48, 4]) && same(A.labelOldApp, [48, 4]), 'A anchors ' + JSON.stringify({ box: A.box, head: A.head, label: A.label, want: A.labelWant, old: A.labelOld, oldApp: A.labelOldApp }));
      ck(R.A3.frames === 125 && R.A3.bad === 0, 'A3 scale 3: 125 frames, 0 px differ ' + JSON.stringify(R.A3));
      ck(R.A4.length === 4 && R.A4.every((x) => x.stand === 0 && x.portrait === 0 && x.standChanged > 1000 && x.portraitChanged > 5000), 'A4 stand8 + portrait with the hat ' + JSON.stringify(R.A4));
      ck(t.pe.length === 0, 'A page errors ' + t.pe.join(' | '));
      await t.bc.close(); }
    // ── B (phone + iPad) · house change: the cloth = the 4 shades of the new house, every other colour = a fixed-id colour of the raw hat (outline, copper pin)
    for (const v of VIEWS) {
      const t = await open(browser, v); await start(t.p, GIRL()); const B = R['B-' + v.tag] = {};
      const s0 = await stored(t.p);
      B.open = await t.p.evaluate(async () => { openGM(); await new Promise((r) => setTimeout(r, 300)); await __frames(3); return { st: C234.st, row: __hatRow(), labelD: c234D('label', 0) }; });
      const en = await t.p.evaluate(async () => { LANG = 'en'; closeModal(); openGM(); await new Promise((r) => setTimeout(r, 200)); const h = __hatRow(); LANG = 'th'; closeModal(); openGM(); await new Promise((r) => setTimeout(r, 200)); return h; });
      const row = B.open.row, ramp = s0.house !== undefined ? null : null;
      const houseCols = await t.p.evaluate(() => { const id = (HOUSES[S.house] || HOUSES[0]).id; return __T.pack.palette.house.find((e) => e[0] === id)[1].concat(['#3A1E3F']); });
      ck(B.open.st === 'ready' && row && row.btn.length === 2 && row.btn.every((b) => b[1] >= 44 && b[2] >= 44) && same(row.btn.map((b) => b[0]), ['', 'beret']) && same(row.btn.map((b) => b[3]), ['true', 'false']) &&
        row.name === 'ไม่ใส่' && same(row.btn.map((b) => b[4]), ['หมวก ไม่ใส่', 'หมวก เบเร่ต์']) && row.btn.every((b) => !b[5] && b[6] === '1') && !row.note &&
        en && same(en.btn.map((b) => b[4]), ['Hat None', 'Hat Beret']) && en.name === 'None' && row.pic && row.pic.n > 300 && row.pic.cols.filter((c) => houseCols.includes(c)).length >= 4,
      v.tag + ' B hat row ' + JSON.stringify({ row, en: en && { btn: en.btn.map((b) => b[4]), name: en.name }, houseCols }));
      await t.p.screenshot({ path: path.join(out, 's-' + v.tag + '-panel.png') });
      // a real tap on beret
      await t.p.click('#c255 button[data-hat="beret"]'); await sleep(400);
      const on = await t.p.evaluate(async () => { await __frames(3); return { head: S.char2.parts.head, row: __hatRow(), pv: __face(document.getElementById('c245pv'), 'beret'), labelD: c234D('label', 0), n: C234.n.hat }; });
      const s1 = await stored(t.p), top = keysDiff(s0, s1), c2 = keysDiff(s0.char2, s1.char2), parts = keysDiff(s0.char2.parts, s1.char2.parts);
      const play = await t.p.evaluate(async () => { closeModal(); hud(); __hatDraws(); await __frames(30); const n = window.__hd; return { hatDraws: n, hud: __face(document.getElementById('hudPortrait'), 'beret') }; });
      B.on = { head: on.head, pressed: on.row && on.row.btn.map((b) => b[3]), name: on.row && on.row.name, pv: on.pv, labelUp: on.labelD - B.open.labelD, top, c2, parts, s0head: s0.char2.parts.head, play };
      ck(on.head === 'beret' && same(B.on.pressed, ['false', 'true']) && B.on.name === 'เบเร่ต์' && same(top, ['char2']) && same(c2, ['parts']) && same(parts, ['head']) && s1.char2.parts.head === 'beret' && s0.char2.parts.head === null &&
        on.pv && on.pv.bad === 0 && on.pv.n > 2000 && play.hud && play.hud.bad === 0 && play.hud.n > 500 && play.hatDraws >= 30 && B.on.labelUp === 9, v.tag + ' B tap beret ' + JSON.stringify(B.on));
      await t.p.screenshot({ path: path.join(out, 's-' + v.tag + '-game.png') });
      // house change -> the hat cloth follows
      B.house = await t.p.evaluate(async () => { const h0 = S.house; S.house = (S.house + 1) % HOUSES.length; await __frames(4); const id = (HOUSES[S.house] || HOUSES[0]).id;
        const sh = Char2.sheet(C234.app, { house: id }, 'hat'), d = __px(sh.canvas); sh.release(); const ramp = __T.pack.palette.house.find((e) => e[0] === id)[1], cols = new Set();
        for (let i = 0; i < d.length; i += 4) if (d[i + 3]) cols.add('#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase());
        const fixed = new Set(), A = __T.HA.data, M = __T.HM.data; for (let i = 0; i < A.length; i += 4) if (A[i + 3] && !__T.pack.materials.recolour[M[i]]) fixed.add('#' + [A[i], A[i + 1], A[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase());
        hud(); await __frames(3); const hf = __face(document.getElementById('hudPortrait'), 'beret'); S.house = h0; hud(); await __frames(4);
        return { id, inRamp: [...cols].filter((c) => ramp.includes(c)).length, other: [...cols].filter((c) => !ramp.includes(c)), fixed: [...fixed], hud: hf }; });
      ck(B.house.inRamp === 4 && B.house.other.every((c) => B.house.fixed.includes(c)) && B.house.hud && B.house.hud.bad === 0 && B.house.hud.n > 500, v.tag + ' B house change recolours the hat ' + JSON.stringify(B.house));
      // wrong calls
      B.bad = await t.p.evaluate(() => { const b0 = JSON.stringify(S.char2), r = [c255Set('crown'), c255Set(''), c255Set(['beret']), c255Set('Beret')]; S.char2On = false; c234Sync(); r.push(c255Set(null)); const off = JSON.stringify(S.char2) === b0; S.char2On = true; c234Sync(); return { r, same: off && JSON.stringify(S.char2) === b0 }; });
      await t.p.waitForFunction(() => C234.st === 'ready', { timeout: 20000 }).catch(() => {}); await helpers(t.p);
      ck(same(B.bad.r, [false, false, false, false, false]) && B.bad.same, v.tag + ' B wrong calls ' + JSON.stringify(B.bad));
      // tap none: back to the very same save
      await t.p.evaluate(async () => { openGM(); await new Promise((r) => setTimeout(r, 300)); });
      await t.p.click('#c255 button[data-hat=""]'); await sleep(400);
      const s2 = await stored(t.p), off = await t.p.evaluate(async () => { closeModal(); __hatDraws(); await __frames(20); return { hatDraws: window.__hd, row: null }; });
      B.off = { same: same(s0.char2, s2.char2), top: keysDiff(s0, s2), hatDraws: off.hatDraws };
      ck(B.off.same && B.off.hatDraws === 0, v.tag + ' B tap none gives back the same save ' + JSON.stringify(B.off));
      ck(t.pe.length === 0, v.tag + ' B page errors ' + t.pe.join(' | '));
      if (v.tag === 'phone') {   // keeps across a new page · clear removes it
        await t.p.evaluate(() => { c255Set('beret'); save(); });
        const t2 = await open(browser, v, { bc: t.bc }); await start(t2.p, null, true);
        B.reload = await t2.p.evaluate(async () => { __hatDraws(); await __frames(10); return { st: C234.st, head: S.char2 && S.char2.parts.head, migrate: C234.cnt.migrate, hatDraws: window.__hd }; });
        ck(B.reload.st === 'ready' && B.reload.head === 'beret' && B.reload.migrate === 0 && B.reload.hatDraws >= 10, 'B reload keeps the hat ' + JSON.stringify(B.reload));
        B.clear = await t2.p.evaluate(async () => { openGM(); await new Promise((r) => setTimeout(r, 300)); const c = document.getElementById('c234clr'); c.click(); document.getElementById('c234clr').click(); await new Promise((r) => setTimeout(r, 300));
          return { char2: S.char2 === undefined, on: S.char2On }; });
        ck(B.clear.char2 && B.clear.on === false, 'B clear v2 removes the hat ' + JSON.stringify(B.clear));
        ck(t2.pe.length === 0, 'B reload page errors ' + t2.pe.join(' | '));
      }
      await t.bc.close();
    }
    // ── F: files
    { R.F = []; R.Fx = {};   // R.F = one row per file case · R.Fx = the other numbers (an array's own keys would not print)
      const fx = await (async () => {   // broken copies made in a page from the real files (canvas keeps exact RGBA where alpha is 255 or 0)
        const t = await open(browser, VIEWS[0]); const r = await t.p.evaluate(async () => {
          const load = (u) => new Promise((ok) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); ok(c); }; i.src = u + '?fx=' + Date.now(); });
          const b64 = (c) => c.toDataURL('image/png').split(',')[1], img = await load('c2-hat-beret.png'), mk = await load('c2-hat-beret-mask.png');
          const m1 = document.createElement('canvas'); m1.width = mk.width; m1.height = mk.height; const g1 = m1.getContext('2d', { willReadFrequently: true }); g1.drawImage(mk, 0, 0);
          const d = g1.getImageData(0, 0, m1.width, m1.height); let at = -1; for (let i = 0; i < d.data.length; i += 4) if (d.data[i + 3] && d.data[i] === 8) { at = i; break; }
          d.data[at] = 3; d.data[at + 1] = 0; d.data[at + 2] = 0; g1.putImageData(d, 0, 0);
          const e1 = document.createElement('canvas'), e2 = document.createElement('canvas'); for (const [c, s] of [[e1, img], [e2, mk]]) { c.width = s.width; c.height = s.height; const g = c.getContext('2d'); g.drawImage(s, 0, 0); g.clearRect(0, 0, 96, 96); }
          return { wrongId: b64(m1), wrongAt: [(at / 4) % m1.width, Math.floor(at / 4 / m1.width)], emptyImg: b64(e1), emptyMask: b64(e2) }; });
        await t.bc.close(); return r; })();
      const pk = JSON.parse(fs.readFileSync(path.join(__dirname, 'c2-pack.json'), 'utf8')); pk.heads.beret.src = 'http://[';
      R.Fx.fixtures = { wrongAt: fx.wrongAt };
      const cases = HATS.map((f) => [f, { block: (n) => n === f }]).concat([['all 4', { block: (n) => HATS.includes(n) }], ['mask wrong size', { swap: { 'c2-hat-beret-mask.png': fs.readFileSync(path.join(__dirname, 'c2-hat-beret-pt-mask.png')) } }],
        ['N1-A src http://[', { swap: { 'c2-pack.json': { type: 'application/json', body: JSON.stringify(pk) } } }], ['N1-B hat sprite never answers', { stall: (n) => n === 'c2-hat-beret.png' }],
        ['N2 mask id 3 at ' + fx.wrongAt.join(','), { swap: { 'c2-hat-beret-mask.png': Buffer.from(fx.wrongId, 'base64') } }],
        ['N2 S cell empty', { swap: { 'c2-hat-beret.png': Buffer.from(fx.emptyImg, 'base64'), 'c2-hat-beret-mask.png': Buffer.from(fx.emptyMask, 'base64') } }]]);
      for (const [lab, o] of cases) {
        const t = await open(browser, VIEWS[0], o); const t0 = Date.now(); await start(t.p, GIRL({ char2: C2('beret') })); const settleMs = Date.now() - t0;
        const r = await t.p.evaluate(async () => { const c0 = JSON.stringify(S.char2); openGM(); await new Promise((r) => setTimeout(r, 300)); const row = __hatRow(); closeModal(); __hatDraws(); await __frames(10);
          const lit = (() => { const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i + 3]) n++; return n; })();
          return { st: C234.st, why: C234.why, hats: Char2.hats(), failed: C234.res && C234.res.failed, head: S.char2.parts.head, same: JSON.stringify(S.char2) === c0, beret: row && row.btn[1], note: row && row.note, hatDraws: window.__hd, body: C234.n.body || C234.n.call, lit }; });
        r.label = lab; r.pe = t.pe.length; r.settleMs = settleMs; R.F.push(r); await t.bc.close();
        ck(r.st === 'ready' && settleMs < 20000 && same(r.hats, []) && same(r.failed, []) && r.head === 'beret' && r.same && r.beret && r.beret[5] === true && r.beret[6] === '0.45' && r.note && r.hatDraws === 0 && r.lit > 100 && r.pe === 0,
          'F ' + lab + ' -> v2 body without the hat ' + JSON.stringify(r));
      }
      { const t = await open(browser, VIEWS[0]); await start(t.p, GIRL()); await helpers(t.p);   // T58-N3: the hat sheet depends on hat + house only
        R.Fx.cache = await t.p.evaluate(() => { Char2.trim(); const s0 = Char2.stats(), hairs = __T.pack.palette.hair.map((e) => e[0]), out = [];
          for (const h of hairs) { const a = Object.assign({}, __appWith('beret'), { color: Object.assign({}, C234.app.color, { hair: h }) }); const x = Char2.sheet(a, { house: 'wing' }, 'hat'); out.push(!!x); if (x) x.release(); }
          const s1 = Char2.stats(); return { hairs: hairs.length, got: out.filter(Boolean).length, entries: s1.entries.cached - s0.entries.cached, bytes: s1.cache - s0.cache, handles: s1.handles }; });
        ck(R.Fx.cache.hairs === 8 && R.Fx.cache.got === 8 && R.Fx.cache.entries === 1 && R.Fx.cache.bytes === 768 * 96 * 4 && R.Fx.cache.handles === 0, 'F cache: 8 hair colours -> 1 hat sheet ' + JSON.stringify(R.Fx.cache));
        ck(t.pe.length === 0, 'F cache page errors ' + t.pe.join(' | ')); await t.bc.close(); }
      const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8'); R.Fx.sw = { listed: HATS.filter((f) => sw.includes("'" + f + "'")).length, cache: (sw.match(/const CACHE='([^']+)'/) || [])[1] };
      ck(R.Fx.sw.listed === 4, 'F sw.js lists the 4 hat files ' + JSON.stringify(R.Fx.sw));
      // offline: SW on, v2 with the hat → the hat files are cached → offline reload still has the hat
      const bc = await browser.createBrowserContext(); const t = await open(browser, VIEWS[0], { bc, sw: true });
      await t.p.evaluate(() => navigator.serviceWorker.ready); await t.p.reload({ waitUntil: 'load' }); await t.p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 });
      await start(t.p, GIRL({ char2: C2('beret') })); await sleep(1500);
      const cached = await t.p.evaluate(async (names) => { const k = (await caches.keys()).find((x) => /^lantern-/.test(x)); const c = await caches.open(k); const r = []; for (const n of names) r.push(!!(await c.match(new URL(n, location.href).href))); return { k, r, ctl: !!navigator.serviceWorker.controller }; }, HATS);
      await t.p.setOfflineMode(true); await t.p.reload({ waitUntil: 'load' }).catch(() => {}); await t.p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }).catch(() => {});
      await start(t.p, null, true);
      const off = await t.p.evaluate(async () => { __hatDraws(); await __frames(10); return { st: C234.st, hats: Char2.hats(), hatDraws: window.__hd }; });
      R.Fx.offline = { cached, off, pe: t.pe.length }; await bc.close();
      ck(cached.ctl && cached.k === R.Fx.sw.cache && cached.r.every(Boolean) && off.st === 'ready' && same(off.hats, ['beret']) && off.hatDraws >= 10, 'F offline keeps the hat ' + JSON.stringify(R.Fx.offline));
    }
    }
    // ── P: JS per frame, hat off vs on (same build, same save, the kid walking on the game's own path, alternating, paired)
    if (process.env.PERF !== '0') {
      const t = await open(browser, VIEWS[0]); await start(t.p, GIRL()); const cdp = await t.p.target().createCDPSession();
      await t.p.evaluate(() => { const T0 = window.T || 32; goMap('capital'); P.path = P.act = null; LITE = false; fpsChecks = 6; S.eco = false;
        const a = [P.x, P.y], bb = [P.x + 5 * T0, P.y]; let k = 0; window.__walk = 0; let lx = P.x, ly = P.y;
        setInterval(() => { if (!P.path || !P.path.length) { k ^= 1; const g = k ? bb : a; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [[g[0], g[1]]]; } window.__walk += Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y; }, 100);
        const raw = window.requestAnimationFrame.bind(window); window.__raw = raw; window.__js = 0; window.__cb = 0;   // every frame callback timed (the game's loop and anything else on rAF)
        window.requestAnimationFrame = (f) => raw((ts) => { const t0 = performance.now(); try { f(ts); } finally { window.__js += performance.now() - t0; window.__cb++; } });
        window.__nf = 0; const cnt = () => { window.__nf++; raw(cnt); }; raw(cnt); });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await sleep(4000);
      const runs = [], ROUNDS = +(process.env.P_ROUNDS || 12), MS = +(process.env.P_MS || 4000);
      for (let round = 0; round < ROUNDS; round++) { const row = { round: round + 1 };
        for (const k of round % 2 ? ['on', 'off'] : ['off', 'on']) {
          await t.p.evaluate((k) => { c255Set(k === 'on' ? 'beret' : null); }, k); await sleep(2000);
          const a = await t.p.evaluate(() => [window.__js, window.__nf, window.__walk, C234.n.call || 0]); await sleep(MS); const b = await t.p.evaluate(() => [window.__js, window.__nf, window.__walk, C234.n.call || 0]);
          row[k] = { jsms: +((b[0] - a[0]) / Math.max(1, b[1] - a[1])).toFixed(3), fps: +((b[1] - a[1]) / (MS / 1000)).toFixed(2), walked: Math.round(b[2] - a[2]), bodyDraws: b[3] - a[3] }; }
        row.js = +(row.on.jsms / row.off.jsms).toFixed(3); row.fps = +(row.on.fps / row.off.fps).toFixed(3); runs.push(row); }
      const med = (a) => { const q = [...a].sort((x, y) => x - y), n = q.length; return n % 2 ? q[(n - 1) / 2] : +((q[n / 2 - 1] + q[n / 2]) / 2).toFixed(3); };
      const micro = await t.p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = cv.height = 400; const g = cv.getContext('2d'), A = Char2.actor({ blinkAt: 1e12 }); A.dir = 'S'; A.anim = 'walk';
        const dc = { house: (HOUSES[S.house] || HOUSES[0]).id }, a0 = __appWith(null), a1 = __appWith('beret'), T = { off: 0, on: 0 };
        for (let i = 0; i < 40; i++) for (const [k, a] of i % 2 ? [['on', a1], ['off', a0]] : [['off', a0], ['on', a1]]) { const t0 = performance.now(); for (let j = 0; j < 100; j++) { A.fi = j % 6; Char2.draw(g, a, dc, A, 200, 330, 3); } g.getImageData(0, 0, 1, 1); T[k] += performance.now() - t0; }
        return { offUs: +(T.off / 2000 * 1000).toFixed(1), onUs: +(T.on / 2000 * 1000).toFixed(1), ratio: +(T.on / T.off).toFixed(3) }; });
      R.P = { method: '844x390 @3 · CPU 4x · ' + ROUNDS + ' rounds x ' + MS / 1000 + ' s per side · order alternates · ratio = median of the round ratios (on / off of the same round)', runs, micro,
        jsRatio: med(runs.map((r) => r.js)), fpsRatio: med(runs.map((r) => r.fps)), offJs: med(runs.map((r) => r.off.jsms)), onJs: med(runs.map((r) => r.on.jsms)), offFps: med(runs.map((r) => r.off.fps)), onFps: med(runs.map((r) => r.on.fps)) };
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      ck(R.P.jsRatio <= 1.10 && R.P.fpsRatio >= 0.90 && runs.every((r) => r.on.walked > 50 && r.off.walked > 50 && r.on.bodyDraws > 0 && r.off.bodyDraws > 0), 'P JS per frame hat on <= off x 1.10, fps >= 90 %, kid walking + drawn ' + JSON.stringify(R.P));
      ck(t.pe.length === 0, 'P page errors ' + t.pe.join(' | '));
      await t.bc.close();
    }
  } catch (e) { errors.push('crash ' + String(e && e.stack || e).slice(0, 400)); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ R, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
