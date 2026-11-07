// G4 M9 (plan G4_0 §8 M9): picture memory of the WHOLE game, counted once per object (method G2.6 A6, v3 after Codex T34-R2,
// v3.1 after Codex T35-N2: ImageData from an OffscreenCanvas 2D context counted too).
// Tracked with a WeakRef: every <img>/Image given a src (+ <img> in the page), every canvas however it was made (createElement,
// OffscreenCanvas, the HTML itself, innerHTML …: caught when it enters the document (MutationObserver), when anything asks it for a
// context (getContext — a canvas only gets pixel memory then) and by a sweep of document canvases at each count), every ImageData
// (getImageData / createImageData of a canvas OR OffscreenCanvas 2D context, new ImageData) together with its pixel buffer, and every
// ImageBitmap. Not seen: pictures made inside a Worker (the hunt1 floor is joined in one; M9's scenes do not visit hunt1) and WebGL /
// VideoFrame / ImageDecoder (the game and char2.js use none of them: grep on main eb60c65 + char2.src.js).
// After each scene: 1.5 s, then gc() ×3 (--expose-gc). RESIDENT = what is still alive (w×h×4): an ImageData counts while its wrapper
// OR its pixel buffer is alive, each pixel buffer once (ImageData sharing a buffer are not counted twice). The game canvas #c is reported
// apart (screen), never in the totals. MADE_CUMULATIVE = everything ever made and tracked — a sum over time, NOT a peak; the peak here is
// only the highest RESIDENT among the counting points (a short peak between two points is not seen; Char2.stats() covers Char2 itself).
// Scenes: the 3 M6 scenes (m6-scenes.json) visited in order with a short walk · synthetic save · external hosts blocked.
//   BASE=http://127.0.0.1:8780 node qa/g4/memory.js OUT.json [--patch '{"char2On":true}'] [--inject canvas|html|imagedata]
//   --inject (at the last scene, kept alive): canvas = createElement 4096² · html = a 4096² canvas written with innerHTML then given a
//   context · imagedata = new ImageData(4096,4096) of which only .data is kept · offscreen = OffscreenCanvas 4096², getImageData of all
//   of it, only .data kept, the canvas shrunk to 0 and let go → each must add 64 MiB to RESIDENT
'use strict';
const fs = require('fs'), { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8780';
const OUTF = process.argv[2], ia = process.argv.indexOf('--inject');
const INJECT = ia > 0 ? (process.argv[ia + 1] && !process.argv[ia + 1].startsWith('--') ? process.argv[ia + 1] : 'canvas') : null;
const PATCH = process.argv.includes('--patch') ? JSON.parse(process.argv[process.argv.indexOf('--patch') + 1]) : null;
const SCENES = require('./m6-scenes.json'), SAVE = { name: 'P', kid: 0, house: 1, age: 7 };
const HOOK = () => {
  const T = window.__t = [], seenC = new WeakSet(), seenI = new WeakSet();
  const add = (kind, o, w, h, buf) => T.push({ kind, ref: new WeakRef(o), buf: buf ? new WeakRef(buf) : null, w0: w || 0, h0: h || 0 });
  const canvas = c => { if (c && !seenC.has(c)) { seenC.add(c); add('canvas', c, c.width, c.height); } };
  window.__trackCanvas = canvas;
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const e = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas') canvas(e); return e; };
  if (window.OffscreenCanvas) { const O = window.OffscreenCanvas; window.OffscreenCanvas = function (w, h) { const o = new O(w, h); canvas(o); return o; }; window.OffscreenCanvas.prototype = O.prototype; }
  const gc2 = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { canvas(this); return gc2.apply(this, a); };
  if (window.OffscreenCanvas) { const go = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function (...a) { canvas(this); return go.apply(this, a); }; }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.tagName === 'CANVAS') canvas(n); else n.querySelectorAll && n.querySelectorAll('canvas').forEach(canvas); } })
    .observe(document, { childList: true, subtree: true });
  const img = d => add('imagedata', d, d.width, d.height, d.data.buffer);
  // both 2D context kinds (T35-N2: an OffscreenCanvas context made ImageData the v3 counter did not see)
  for (const K of [window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D]) { if (!K) continue;
    const C2 = K.prototype, gid = C2.getImageData, cid = C2.createImageData;
    C2.getImageData = function (...a) { const d = gid.apply(this, a); img(d); return d; };
    C2.createImageData = function (...a) { const d = cid.apply(this, a); img(d); return d; }; }
  const ID = window.ImageData; window.ImageData = function (...a) { const d = new ID(...a); img(d); return d; }; window.ImageData.prototype = ID.prototype;
  if (window.createImageBitmap) { const cib = window.createImageBitmap; window.createImageBitmap = (...a) => cib(...a).then(b => { add('bitmap', b, b.width, b.height); return b; }); }
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: d.get, set(v) { if (!seenI.has(this)) { seenI.add(this); add('image', this); } d.set.call(this, v); } });
};
const MEASURE = async () => {
  document.querySelectorAll('canvas').forEach(c => window.__trackCanvas(c)); // canvases the parser made before any hook saw them
  for (let k = 0; k < 3; k++) { if (window.gc) gc(); await new Promise(r => setTimeout(r, 100)); }
  const extra = [...document.images].filter(i => !window.__t.some(t => t.kind === 'image' && t.ref.deref() === i));
  const res = { image: 0, canvas: 0, imagedata: 0, bitmap: 0 }, made = { image: 0, canvas: 0, imagedata: 0, bitmap: 0 }, bufs = new Set();
  let alive = 0, screen = 0, untrackedBefore = 0;
  for (const t of window.__t) { const o = t.ref.deref(); let w = t.w0, h = t.h0;
    if (o && t.kind === 'canvas') { w = Math.max(w, o.width); h = Math.max(h, o.height); t.w0 = w; t.h0 = h; if (o.id === 'c') { screen = o.width * o.height * 4; continue; } }
    if (o && t.kind === 'image') { w = o.naturalWidth || 0; h = o.naturalHeight || 0; t.w0 = w; t.h0 = h; }
    made[t.kind] += w * h * 4;
    if (t.kind === 'imagedata') { const b = (o && o.data.buffer) || (t.buf && t.buf.deref()); if (b && !bufs.has(b)) { bufs.add(b); alive++; res.imagedata += b.byteLength; } continue; }
    if (o) { alive++; res[t.kind] += (t.kind === 'canvas' ? o.width * o.height : w * h) * 4; } }
  for (const i of extra) { res.image += i.naturalWidth * i.naturalHeight * 4; made.image += i.naturalWidth * i.naturalHeight * 4; }
  const mb = x => +(x / 1048576).toFixed(2), tot = o => Object.values(o).reduce((a, b) => a + b, 0);
  const live = [...document.querySelectorAll('canvas')].filter(c => c.id !== 'c').map(c => (c.id || '-') + ':' + c.width + 'x' + c.height);
  return { resident_MiB: mb(tot(res)), made_cumulative_MiB: mb(tot(made)), by_kind_resident_MiB: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, mb(v)])),
    screen_MiB: mb(screen), tracked: window.__t.length, alive, documentCanvases: live, gc: !!window.gc, map: M && M.id };
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: 'Asia/Bangkok', locale: 'th-TH', serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') ? r.continue() : r.abort(); });
  await ctx.addInitScript(HOOK);
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), null, { timeout: 90000 }); await p.waitForTimeout(800);
  const R = { base: BASE, patch: PATCH, inject: INJECT, method: 'v3.1 (T34-R2, T35-N2): canvas by getContext/MutationObserver/sweep · ImageData of both 2D context kinds + new ImageData, by wrapper or buffer, buffer once', steps: {} };
  R.steps.title = await p.evaluate(MEASURE);
  await p.evaluate(([sv, patch]) => { const d = Store.all(); d.slots = [Object.assign(newSave(sv), patch || {})]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {} LITE = false; fpsChecks = 6; S.eco = false; }, [SAVE, PATCH]);
  for (const sc of SCENES) {
    await p.evaluate(sc => { goMap(sc.map); P.path = P.act = null; const g = [P.x + sc.go[0] * T, P.y + sc.go[1] * T]; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [g]; }, sc);
    await p.waitForTimeout(3000);
    if (INJECT && sc === SCENES[SCENES.length - 1]) await p.evaluate(kind => {
      if (kind === 'canvas') { const c = document.createElement('canvas'); c.width = c.height = 4096; c.getContext('2d').fillRect(0, 0, 1, 1); window.__inj = c; }
      if (kind === 'html') { const box = document.createElement('div'); box.style.display = 'none'; box.innerHTML = '<canvas width="4096" height="4096"></canvas>'; document.body.appendChild(box); box.firstChild.getContext('2d').fillRect(0, 0, 1, 1); }
      if (kind === 'imagedata') { const d = new ImageData(4096, 4096); d.data[0] = 123; window.__inj = d.data; }
      if (kind === 'offscreen') { const o = new OffscreenCanvas(4096, 4096), g = o.getContext('2d'); g.fillRect(0, 0, 1, 1); window.__inj = g.getImageData(0, 0, 4096, 4096).data; o.width = o.height = 0; }
    }, INJECT);
    await p.waitForTimeout(1500);
    R.steps[sc.id] = await p.evaluate(MEASURE);
    console.log(sc.id, JSON.stringify(R.steps[sc.id]));
  }
  R.peak_resident_MiB = Math.max(...Object.values(R.steps).map(s => s.resident_MiB));
  R.made_cumulative_MiB_last = R.steps[SCENES[SCENES.length - 1].id].made_cumulative_MiB;
  R.errors = errs; R.pass = errs.length === 0 && Object.values(R.steps).every(s => s.gc);
  console.log(JSON.stringify({ inject: INJECT, peak_resident_MiB: R.peak_resident_MiB, made_cumulative_MiB_last: R.made_cumulative_MiB_last, errors: errs.length, pass: R.pass }));
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
