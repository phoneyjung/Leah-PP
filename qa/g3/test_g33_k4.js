// G3.3 K4 memory / cache test (Claude · 2 Nov 2569) · G3_0_RENDERER_PLAN.md v1.4 K4 + section 4 (cache and budget) + the counter rules of T19 item 2
// Independent counter (addInitScript, before char2.js loads): every canvas / ImageData / typed array / ArrayBuffer / Image MADE BY char2.js code
// (creator stack contains /char2.js) is tracked by identity, no strong reference:
//   canvas  = width x height x 4 from its first getContext (Chromium has no pixel buffer before that); every later width / height change is
//             counted before -> after (also down to 0) · ImageData and typed arrays = their ArrayBuffer, counted once per buffer (views share it)
//   Image   = naturalWidth x naturalHeight x 4 from its load event · gone = FinalizationRegistry after gc() (a 0-size canvas is not taken off twice)
//   live = what is held now · peak = max(live) · cum = everything ever made (reported only, not a gate)
// Scenarios (plan K4): load · (ก) 4 actors in 4 colour sets x 120 frames · (ข) one actor through looks 1->8->1, then 1->8 again in another house ·
// (ค) borrow all 3 sheets of looks 1-8 without returning while the 4 actors draw · borrow look 1 again · release one by one · (ค2) borrow some
// sheets first, then draw the same looks so more sheets are built · (ค2 หน้า, G3.4) borrow the portraits of 8 looks (= borrowMax) first, one more sheet
// is refused, then draw those looks so their sheets are built: borrowed stays 8 x 589,824 ·
// (ง) trim() · (จ) release(). gc() after every call that built a sheet, so the garbage of an earlier step is not counted in a later one.
// Every checkpoint (after gc + finalizers): independent live == stats().total (byte for byte) and <= 40 MiB · fixed.other <= 256 KiB · scratch 0.
// Every op: the counters of Char2 (hit miss evict refused rebuilt cache borrowed) == an LRU model written here from the plan rules (section 4),
// with sheet sizes from the pack and fist sizes from c2-pilot-hold-anchors.json (not from char2.js).
// Colour check: S idle-hold f1 of the looks in use == the Python composed hashes of K3b (colours not swapped, picture not empty).
// usage: PORT=<server at repo root> node qa/g3/test_g33_k4.js OUT.json DIR_WITH_composed.json      env INJECT=M1..M5 must FAIL
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const PORT = process.env.PORT || 8792, OUT = process.argv[2] || '/tmp/g33-k4.json', REFJ = process.argv[3], ROOT = process.cwd(), base = 'http://127.0.0.1:' + PORT + '/';
const MiB = 1048576;
const INJ = {   // plan K4: 5 faults that must be caught
  M1: ["if (e.pins) { b += e.bytes; nb++; }", "if (e.pins) { b += e.cv.width * e.cv.height * 4; nb++; }"],                          // borrowed count misses the fists
  M2: ["function drop(k, e) { kill(e.cv);", "function drop(k, e) {"],                                                                  // evict does not clear the canvas
  M3: ["if (!e.pins && sizes().b + e.bytes > ST.pack.budget.borrow_max) { CNT.refused++; return null; }", ""],                      // borrow ignores borrowMax
  M4: ["CACHE.set(k, e); }", "CACHE.set(k, e); const tail = k.slice(k.indexOf('|')); for (const [k2, e2] of CACHE) if (k2 !== k && e2.pins && k2.slice(k2.indexOf('|')) === tail) { e.pins++; break; } }"],   // pin the whole colour set
  M5: ["SCR = 0; return e;", "SCR = 0; (build.keep = build.keep || []).push(out); return e;"],                                       // scratch buffer kept
  S0: ['', ''],                                                                                                                       // the readable source unchanged (must pass)
}[process.env.INJECT || ''];
let C2SRC = null;
if (process.env.INJECT) { if (!INJ) { console.log('unknown INJECT'); process.exit(2); } C2SRC = fs.readFileSync(path.join(ROOT, 'char2.src.js'), 'utf8'); if (!C2SRC.includes(INJ[0])) { console.log('inject target missing'); process.exit(2); } C2SRC = C2SRC.replace(INJ[0], INJ[1]); }

const HOOK = () => {
  let live = 0, peak = 0, cum = 0, nid = 0, typed = 0; const REC = new Map(), IDOF = new WeakMap(), BUFS = new WeakSet(), KIND = {};
  Error.stackTraceLimit = 40;
  let WHERE = '';   // creator of the object being tracked (the char2.js frames of its stack, for the leftover list)
  const fromC2 = () => { const st = new Error().stack || ''; if (!/\/char2\.js/.test(st)) return false; WHERE = st.split('\n').filter((l) => /char2\.js/.test(l)).slice(0, 3).map((l) => l.trim().replace(/^at /, '').replace(/\(?https?:\/\/[^/]+\//, '').replace(/\)$/, '')).join(' < '); return true; };
  const fin = new FinalizationRegistry((id) => { const r = REC.get(id); if (!r) return; live -= r.bytes; REC.delete(id); });
  const bump = () => { if (live > peak) peak = live; };
  const track = (o, bytes, kind, ctx) => { const id = ++nid; REC.set(id, { bytes, kind, ctx, where: WHERE }); IDOF.set(o, id); fin.register(o, id); live += bytes; cum += bytes; KIND[kind] = (KIND[kind] || 0) + 1; bump(); return id; };
  const setBytes = (o, bytes) => { const id = IDOF.get(o), r = id && REC.get(id); if (!r) return; live += bytes - r.bytes; if (bytes > r.bytes) cum += bytes - r.bytes; r.bytes = bytes; bump(); };
  const buf = (b, kind) => { if (b && !BUFS.has(b)) { BUFS.add(b); track(b, b.byteLength, kind); } };
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const e = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas' && fromC2()) track(e, 0, 'canvas', false); return e; };
  for (const prop of ['width', 'height']) { const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop);
    Object.defineProperty(HTMLCanvasElement.prototype, prop, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, v); const id = IDOF.get(this), r = id && REC.get(id); if (r && r.ctx) setBytes(this, this.width * this.height * 4); } }); }
  const gctx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { const c = gctx.apply(this, a); const id = IDOF.get(this), r = id && REC.get(id); if (r && !r.ctx) { r.ctx = true; setBytes(this, this.width * this.height * 4); } return c; };
  const C2 = CanvasRenderingContext2D.prototype, gid = C2.getImageData, cid = C2.createImageData;
  C2.getImageData = function (...a) { const d = gid.apply(this, a); if (fromC2()) buf(d.data.buffer, 'imagedata'); return d; };
  C2.createImageData = function (...a) { const d = cid.apply(this, a); if (fromC2()) buf(d.data.buffer, 'imagedata'); return d; };
  const ID = window.ImageData; window.ImageData = function ImageData(...a) { const d = new ID(...a); if (fromC2()) buf(d.data.buffer, 'imagedata'); return d; }; window.ImageData.prototype = ID.prototype;
  for (const n of ['Uint8ClampedArray', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer']) { const T = window[n];
    window[n] = new Proxy(T, { construct(t, args, nt) { const o = Reflect.construct(t, args, nt === window[n] ? t : nt); if (fromC2()) { typed++; buf(o instanceof T && n === 'ArrayBuffer' ? o : o.buffer, 'typed'); } return o; } }); }
  const I = window.Image; window.Image = function Image(...a) { const i = new I(...a); if (fromC2()) { track(i, 0, 'image'); i.addEventListener('load', () => setBytes(i, i.naturalWidth * i.naturalHeight * 4)); } return i; }; window.Image.prototype = I.prototype;
  window.__mem = () => ({ live, peak, cum, tracked: REC.size, typed, kinds: Object.assign({}, KIND) });
  window.__peakFromNow = () => { peak = live; };
  window.__left = () => [...REC.values()].filter((r) => r.bytes).map((r) => [r.kind, r.bytes, r.where]);
  // gc() as its own task (execution async): a GC called from inside running JS may scan the native stack conservatively and keep a stray
  // small object alive (seen once: one 224 B fist buffer) · then wait for the FinalizationRegistry callbacks
  window.__settle = async () => { let last = -1; for (let k = 0; k < 12; k++) { await gc({ type: 'major', execution: 'async' }); await new Promise((r) => setTimeout(r, 25)); const n = REC.size; if (n === last && k >= 2) break; last = n; } };
};

(async () => {
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, 'c2-pack.json'))), H = JSON.parse(fs.readFileSync(path.join(ROOT, 'c2-pilot-hold-anchors.json')));
  const fistBytes = (key) => { let t = 0; for (const L of Object.values(H[key])) for (const f of L) { if (!f.anchor) continue; const xs = f.fist.map((q) => q[0]), ys = f.fist.map((q) => q[1]); t += (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1) * 4; } return t; };
  const C = pack.cell, SZ = {}; for (const an of ['idle', 'walk', 'walkhold']) SZ[an] = pack.sheets[an].size[0] * pack.sheets[an].size[1] * 4; SZ.stand8 = 8 * C * C * 4; SZ.portrait = pack.portrait.size[0] * pack.portrait.size[1] * 4;
  const FIST = { idle: fistBytes('idle_hold'), walkhold: fistBytes('walk_hold'), walk: 0, stand8: 0, portrait: 0 };
  const refC = JSON.parse(fs.readFileSync(path.join(REFJ, 'composed.json')));
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc'] }); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(HOOK); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  if (C2SRC) await p.route((u) => u.pathname.endsWith('/char2.js'), (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: C2SRC }));
  await p.goto(base + 'qa/g3/k3-harness.html', { waitUntil: 'load' });
  const run = await p.evaluate(async ({ refC }) => {
    const ops = [], cps = [], checks = [], handles = [], keptCanvases = [], fail = [];
    const r0 = await Char2.load('../../c2-pack.json'); const pk = r0.pack, PAL = pk.palette, ix = (g, n) => PAL[g].findIndex((e) => e[0] === n);
    const HOUSES = PAL.house.map((e) => e[0]);
    const LOOK = Array.from({ length: 8 }, (_, i) => ({ v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair: PAL.hair[i % PAL.hair.length][0], iris: PAL.iris[i % PAL.iris.length][0], skin: PAL.skin[i % PAL.skin.length][0] } }));
    const lk = (app, house) => '|' + ix('hair', app.color.hair) + '|' + ix('iris', app.color.iris) + '|' + ix('skin', app.color.skin) + '|' + ix('house', house);
    const name = (app, house) => [app.color.hair, app.color.iris, app.color.skin, house].join('/');
    const DCof = (house) => ({ house, held: { id: 'lantern_L0', on: true, lit: true, power: 100 } });
    const scr = document.getElementById('c2'); scr.width = 844; scr.height = 390; const sg = scr.getContext('2d');
    const rec = (op, key, extra) => { const s = Char2.stats(); ops.push(Object.assign({ op, key, hit: s.hit, miss: s.miss, evict: s.evict, refused: s.refused, rebuilt: s.rebuilt, cache: s.cache, borrowed: s.borrowed, total: s.total, scratch: s.scratch }, extra || {})); };
    const cp = async (nm, extra) => { await __settle(); const m = __mem(), s = Char2.stats(); cps.push(Object.assign({ name: nm, left: m.live !== s.total ? __left().slice(-8) : undefined, resident: m.live, total: s.total, fixed: s.fixed, cache: s.cache, borrowed: s.borrowed, scratch: s.scratch, entries: s.entries, handles: s.handles, peakIndep: m.peak, peakC2: s.peak, cum: m.cum, typed: m.typed, kinds: m.kinds }, extra || {})); };
    const sheetOf = (inp) => inp.moving ? (inp.holding ? 'walkhold' : 'walk') : 'idle';
    async function drawOne(app, house, A, inp, x, y) {   // one tick + one draw on the screen, recorded; gc() when it built a sheet
      const m0 = Char2.stats().miss; Char2.tick(A, 16, inp); const ok = Char2.draw(sg, app, DCof(house), A, x, y, 1);
      rec('draw', sheetOf(inp) + lk(app, house), { ok }); if (Char2.stats().miss !== m0) await __settle(); return ok;
    }
    async function colour(app, house, tag) {   // S idle-hold f1 at (80,120) scale 1 vs the Python composed hash (K3b)
      const X = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(X, 0, { moving: false, dir: 'S', holding: true });
      const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); const m0 = Char2.stats().miss;
      const ok = Char2.draw(g, app, DCof(house), X, 80, 120, 1); rec('draw', 'idle' + lk(app, house), { ok, colour: tag });
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', g.getImageData(0, 0, 160, 160).data))].map((v) => v.toString(16).padStart(2, '0')).join('');
      const want = refC[name(app, house)] && refC[name(app, house)]['S:idle']; checks.push({ tag, look: name(app, house), ok: ok && h === want }); c.width = c.height = 0;
      if (Char2.stats().miss !== m0) await __settle();
    }
    {   // warm-up: one see-through draw (A3 composition canvas) and one lit-glass draw (its small canvas) -> both fixed.other canvases exist from here on
      const W0 = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(W0, 0, { moving: false, dir: 'S', holding: true });
      sg.save(); sg.globalAlpha = 0.35; const okA = Char2.draw(sg, LOOK[0], DCof('wing'), W0, 100, 300, 1); sg.restore(); rec('draw', 'idle' + lk(LOOK[0], 'wing'), { ok: okA });
      const okE = Char2.draw(sg, LOOK[0], DCof('wing'), W0, 100, 300, 1, { only: 'emissive' }); rec('draw', 'idle' + lk(LOOK[0], 'wing'), { ok: okE });
    }
    await cp('load', { ready: r0.ready, failed: r0.failed });
    const loadPeak = __mem().peak; __peakFromNow();
    // ---- (ก) 4 actors, 4 colour sets (4 houses), 120 frames
    const ACT = [[LOOK[0], 'wing', { moving: true, dir: 'E', holding: true }], [LOOK[1], 'sun', { moving: false, dir: 'S', holding: true }],
                 [LOOK[2], 'leaf', { moving: true, dir: 'W', holding: false }], [LOOK[3], 'flame', { moving: false, dir: 'N', holding: false }]].map(([app, house, inp]) => ({ app, house, inp, A: Char2.actor() }));
    let allDrawn = true;
    const four = async () => { for (let i = 0; i < 4; i++) { const a = ACT[i]; if (!(await drawOne(a.app, a.house, a.A, a.inp, 100 + 200 * i, 300))) allDrawn = false; } };
    const g0 = Char2.stats(); for (let f = 0; f < 120; f++) await four(); const g1 = Char2.stats();
    const repeatHits = { hits: g1.hit - g0.hit, misses: g1.miss - g0.miss };
    for (const a of ACT) await colour(a.app, a.house, 'ก');
    await cp('ก', { allDrawn, repeatHits });
    // ---- (ข) one actor: looks 1->8->1 (wing), then 1->8 (sun), 5 frames idle-hold + 5 frames walk-hold each, the 4 actors keep drawing
    const X = Char2.actor(); let xDrawn = true;
    const seq = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => [i, 'wing']).concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i, 'sun']));
    for (const [i, house] of seq) for (let f = 0; f < 10; f++) { if (!(await drawOne(LOOK[i], house, X, { moving: f >= 5, dir: 'SE', holding: true }, 420, 200))) xDrawn = false; await four(); }
    const r1 = Char2.stats(); for (let f = 0; f < 10; f++) await drawOne(LOOK[7], 'sun', X, { moving: true, dir: 'SE', holding: true }, 420, 200); const r2 = Char2.stats();
    const repeatHits2 = { hits: r2.hit - r1.hit, misses: r2.miss - r1.miss };
    await colour(LOOK[0], 'wing', 'ข'); await colour(LOOK[7], 'sun', 'ข');
    await cp('ข', { xDrawn, allDrawn, repeatHits: repeatHits2 });
    // ---- (ค) borrow idle / walk / walkhold of looks 1-8 (wing) without returning, the 4 actors draw after every borrow
    for (let i = 0; i < 8; i++) for (const an of ['idle', 'walk', 'walkhold']) {
      const m0 = Char2.stats().miss, h = Char2.sheet(LOOK[i], DCof('wing'), an), hid = handles.length; handles.push(h);
      if (h) keptCanvases.push(h.canvas);   // a careless caller keeps the canvas after release: eviction must still give the memory back
      rec('sheet', an + lk(LOOK[i], 'wing'), { hid, got: !!h }); if (Char2.stats().miss !== m0) await __settle(); await four();
    }
    const firstL1 = handles[0], cumBefore = (await __settle(), __mem().cum), bBefore = Char2.stats().borrowed;
    const again = Char2.sheet(LOOK[0], DCof('wing'), 'idle'), hidA = handles.length; handles.push(again); rec('sheet', 'idle' + lk(LOOK[0], 'wing'), { hid: hidA, got: !!again });
    await __settle(); const reborrow = { same: !!(again && firstL1 && again.canvas === firstL1.canvas), newBytes: __mem().cum - cumBefore, borrowedDelta: Char2.stats().borrowed - bBefore };
    await cp('ค ยืม', { allDrawn, reborrow, got: handles.map((h) => !!h) });
    for (let k = 0; k < handles.length; k++) if (handles[k]) { handles[k].release(); rec('release', null, { hid: k }); handles[k].release(); rec('release', null, { hid: k, twice: true }); await four(); }
    await cp('ค คืน', { allDrawn });
    // ---- (ค2) borrow idle of looks 5-7 first, then draw looks 5-7 walking (walk + walkhold are built); borrowed must not grow
    const H2 = [4, 5, 6].map((i) => { const h = Char2.sheet(LOOK[i], DCof('wing'), 'idle'), hid = handles.length; handles.push(h); rec('sheet', 'idle' + lk(LOOK[i], 'wing'), { hid, got: !!h }); if (h) keptCanvases.push(h.canvas); return h; });
    await __settle(); const b2 = Char2.stats().borrowed; let b2max = b2;
    const Y = [4, 5, 6].map(() => Char2.actor());
    for (let f = 0; f < 10; f++) for (let j = 0; j < 3; j++) { await drawOne(LOOK[4 + j], 'wing', Y[j], { moving: true, dir: 'S', holding: f < 5 }, 150 + 250 * j, 150); b2max = Math.max(b2max, Char2.stats().borrowed); await four(); }
    await cp('ค2', { allDrawn, borrowedAtStart: b2, borrowedMax: b2max, got: H2.map((h) => !!h) });
    // ---- (ค2 หน้า · G3.4) the 3 sheets go back, then the portraits of looks 1-8 are borrowed (8 x 589,824 = borrowMax exactly) and kept
    for (const h of H2) if (h) { h.release(); rec('release', null, { hid: handles.indexOf(h) }); }
    const HP = [];
    for (const L of LOOK) { const m0 = Char2.stats().miss, h = Char2.portrait(L, DCof('wing')), hid = handles.length; handles.push(h); HP.push(h); rec('sheet', 'portrait' + lk(L, 'wing'), { hid, got: !!h }); if (h) keptCanvases.push(h.canvas); if (Char2.stats().miss !== m0) await __settle(); }
    await __settle(); const bP = Char2.stats().borrowed; let bPmax = bP;
    const mX = Char2.stats().miss, extra = Char2.sheet(LOOK[0], DCof('wing'), 'walk'), hidX = handles.length; handles.push(extra); rec('sheet', 'walk' + lk(LOOK[0], 'wing'), { hid: hidX, got: !!extra }); if (Char2.stats().miss !== mX) await __settle();
    const Z = [0, 1, 2, 3, 4, 5].map(() => Char2.actor());
    for (let f = 0; f < 10; f++) for (let j = 0; j < 6; j++) { await drawOne(LOOK[j], 'wing', Z[j], { moving: f >= 3, dir: 'SW', holding: j % 2 === 0 }, 100 + 120 * j, 200); bPmax = Math.max(bPmax, Char2.stats().borrowed); if (j === 5) await four(); }
    await cp('ค2 หน้า', { allDrawn, borrowedAtStart: bP, borrowedMax: bPmax, got: HP.map((h) => !!h), extraRefused: extra === null, ptSize: HP[0] ? [HP[0].canvas.width, HP[0].canvas.height] : null });
    // ---- (ง) trim(): cache 0, fixed and borrowed unchanged, evicted canvases 0 x 0 even though this page still holds them
    const pre = Char2.stats(); Char2.trim(); rec('trim', null);
    const pinnedCanvases = new Set(HP.filter(Boolean).map((h) => h.canvas));   // the 8 portraits are still borrowed (the 3 ค2 sheets were given back)
    const evictedNonZero = keptCanvases.filter((c) => !pinnedCanvases.has(c) && (c.width || c.height)).length, pinnedOk = [...pinnedCanvases].every((c) => c.width > 0);
    await cp('ง', { fixedSame: JSON.stringify(pre.fixed) === JSON.stringify(Char2.stats().fixed), borrowedSame: pre.borrowed === Char2.stats().borrowed, evictedNonZero, pinnedOk, kept: keptCanvases.length });
    await four(); const afterTrimDrawn = allDrawn;
    // ---- (จ) release(): everything back
    Char2.release(); rec('release_all', null);
    const dead = handles.filter(Boolean).every((h) => h.canvas === null), drawAfter = Char2.draw(sg, LOOK[0], DCof('wing'), ACT[0].A, 100, 300, 1), sheetAfter = Char2.sheet(LOOK[0], DCof('wing'), 'idle');
    await cp('จ', { dead, drawAfter, sheetAfter: sheetAfter === null, allZero: keptCanvases.every((c) => c.width === 0 && c.height === 0), afterTrimDrawn });
    return { ops, cps, checks, loadPeak, fixed0: cps[0].fixed, budget: pk.budget, houses: HOUSES };
  }, { refC });
  await b.close();

  // ---- independent LRU model (plan section 4) replayed over the recorded ops
  const BUD = run.budget.bytes, BMAX = run.budget.borrow_max, FX = run.fixed0.images + run.fixed0.masks + run.fixed0.other;
  const cache = new Map(), gone = new Set(), hs = []; let use = 0; const M = { hit: 0, miss: 0, evict: 0, refused: 0, rebuilt: 0 };
  const sums = () => { let c = 0, bb = 0; for (const e of cache.values()) if (e.pins) bb += e.bytes; else c += e.bytes; return { c, b: bb }; };
  const entry = (k) => { const an = k.split('|')[0]; let e = cache.get(k);
    if (e) M.hit++; else { M.miss++; const need = 2 * SZ[an] + 16384;
      while (FX + sums().c + sums().b + need > BUD) { let v = null; for (const kv of cache) if (!kv[1].pins && (!v || kv[1].last < v[1].last)) v = kv; if (!v) return null; cache.delete(v[0]); gone.add(v[0]); M.evict++; }
      e = { bytes: SZ[an] + FIST[an], pins: 0, last: 0 }; if (gone.has(k)) M.rebuilt++; cache.set(k, e); }
    e.last = ++use; return e; };
  let opBad = 0, firstOpBad = null, released = false;
  for (const o of run.ops) {
    let got = null;
    if (o.op === 'draw') { got = !!entry(o.key); }
    else if (o.op === 'sheet') { const e = entry(o.key); if (!e) got = false; else if (!e.pins && sums().b + e.bytes > BMAX) { M.refused++; got = false; } else { e.pins++; got = true; hs[o.hid] = { e, dead: false }; } }
    else if (o.op === 'release') { const h = hs[o.hid]; if (h && !h.dead) { h.dead = true; h.e.pins--; } }
    else if (o.op === 'trim') { for (const [k, e] of [...cache]) if (!e.pins) { cache.delete(k); gone.add(k); M.evict++; } }
    else if (o.op === 'release_all') { cache.clear(); gone.clear(); released = true; }
    if (released) continue;   // after release() Char2's counters restart at 0 (checked at checkpoint จ)
    const z = sums(), want = Object.assign({}, M, { cache: z.c, borrowed: z.b }), have = { hit: o.hit, miss: o.miss, evict: o.evict, refused: o.refused, rebuilt: o.rebuilt, cache: o.cache, borrowed: o.borrowed };
    const same = JSON.stringify(want) === JSON.stringify(have) && (o.op !== 'sheet' || got === o.got) && (o.op !== 'draw' || o.ok === true) && o.borrowed <= BMAX && o.total <= BUD && o.scratch === 0;
    if (!same) { opBad++; if (!firstOpBad) firstOpBad = { op: o, model: want, got }; }
  }
  // ---- gates
  const cpBad = [];
  for (const c of run.cps) {
    const why = [];
    if (c.resident !== c.total) why.push('resident ' + c.resident + ' != total ' + c.total);
    if (c.resident > BUD) why.push('resident > 40 MiB');
    if (c.fixed.other > run.budget.fixed_other_max) why.push('fixed.other ' + c.fixed.other);
    if (c.scratch !== 0) why.push('scratch ' + c.scratch);
    if (c.typed) why.push('typed arrays made ' + c.typed);
    if (c.name === 'load' && !c.ready) why.push('not ready');
    if (c.name === 'ก' && (!c.allDrawn || c.repeatHits.misses !== 4 || c.repeatHits.hits !== 476)) why.push('ก draws / hits ' + JSON.stringify(c.repeatHits));
    if (c.name === 'ข' && (!c.xDrawn || !c.allDrawn || c.repeatHits.misses !== 0)) why.push('ข draws / repeat ' + JSON.stringify(c.repeatHits));
    if (c.name === 'ค ยืม' && (!c.allDrawn || !c.reborrow.same || c.reborrow.newBytes !== 0 || c.reborrow.borrowedDelta !== 0)) why.push('ค re-borrow ' + JSON.stringify(c.reborrow));
    if (c.name === 'ค คืน' && (c.borrowed !== 0 || c.handles !== 0 || !c.allDrawn)) why.push('ค release: borrowed ' + c.borrowed + ' handles ' + c.handles);
    if (c.name === 'ค2' && (c.borrowedMax !== c.borrowedAtStart || !c.allDrawn || !c.got.every(Boolean))) why.push('ค2 borrowed ' + c.borrowedAtStart + ' -> max ' + c.borrowedMax);
    if (c.name === 'ค2 หน้า' && (c.borrowedAtStart !== 8 * SZ.portrait || c.borrowedMax !== c.borrowedAtStart || !c.allDrawn || !c.got.every(Boolean) || !c.extraRefused || JSON.stringify(c.ptSize) !== '[384,384]'))
      why.push('ค2 หน้า ' + JSON.stringify({ borrowed: c.borrowedAtStart, max: c.borrowedMax, got: c.got, extraRefused: c.extraRefused, ptSize: c.ptSize }));
    if (c.name === 'ง' && (c.cache !== 0 || !c.fixedSame || !c.borrowedSame || c.evictedNonZero || !c.pinnedOk)) why.push('ง trim ' + JSON.stringify({ cache: c.cache, fixedSame: c.fixedSame, borrowedSame: c.borrowedSame, evictedNonZero: c.evictedNonZero, pinnedOk: c.pinnedOk }));
    if (c.name === 'จ' && (c.total !== 0 || c.resident !== 0 || !c.dead || c.drawAfter !== false || !c.sheetAfter || !c.allZero || !c.afterTrimDrawn)) why.push('จ release ' + JSON.stringify({ total: c.total, resident: c.resident, dead: c.dead, drawAfter: c.drawAfter, allZero: c.allZero }));
    if (why.length) cpBad.push(c.name + ': ' + why.join(' · '));
  }
  const last = run.cps[run.cps.length - 1], peakAll = Math.max(run.loadPeak, ...run.cps.map((c) => c.peakIndep)), peakC2 = Math.max(...run.cps.filter((c) => c.name !== 'จ').map((c) => c.peakC2));
  const colourOk = run.checks.every((c) => c.ok);
  const gate = { peakLE40: peakAll <= BUD, c2PeakLEindep: peakC2 <= peakAll };
  const R = { inject: process.env.INJECT || null, ops: run.ops.length, opBad, firstOpBad, checkpoints: run.cps, cpBad, colour: run.checks.filter((c) => c.ok).length + '/' + run.checks.length,
    peak: { load_indep: run.loadPeak, ก_to_จ_indep: Math.max(...run.cps.slice(1).map((c) => c.peakIndep)), all_indep: peakAll, char2_stats: peakC2, MiB: +(peakAll / MiB).toFixed(3) },
    cumulative_made: last.cum, gate, sizes: { sheet: SZ, fist: FIST }, model_counters: M, pageErrors: errs };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  const ok = !opBad && !cpBad.length && colourOk && gate.peakLE40 && gate.c2PeakLEindep && !errs.length;
  console.log((ok ? 'PASS ' : 'FAIL ') + 'K4' + (R.inject ? ' inject ' + R.inject : '') + ' · ops ' + run.ops.length + ' (model mismatch ' + opBad + ') · checkpoints ' + (run.cps.length - cpBad.length) + '/' + run.cps.length + ' · colour ' + R.colour
    + ' · peak ' + R.peak.MiB + ' MiB (Char2 stats ' + +(peakC2 / MiB).toFixed(3) + ') · made in all ' + +(last.cum / MiB).toFixed(1) + ' MiB · counters ' + JSON.stringify(M)
    + (cpBad.length ? '\n  ' + cpBad.join('\n  ') : '') + (firstOpBad ? '\n  first op mismatch: ' + JSON.stringify(firstOpBad).slice(0, 600) : '') + (errs.length ? '\n  page errors: ' + errs.join(' | ') : ''));
  process.exit(ok ? 0 : 1);
})();
