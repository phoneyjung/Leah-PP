// G4 M9 (plan G4_0 §8 M9): picture memory of the WHOLE game, counted once per object (method G2.6 A6 v2).
// Tracked with a WeakRef from the moment it is made: every <img>/Image given a src, every canvas (createElement + OffscreenCanvas),
// ImageData (getImageData / createImageData / new ImageData) and ImageBitmap. After each scene: 1.5 s, then gc() ×3 (--expose-gc);
// RESIDENT = objects still alive (w×h×4) · the screen canvas #c is reported apart · MADE = everything ever made (upper bound of a peak).
// Includes the game's blurred shadow sheets (PS.*), UI tiles and map caches because they are canvases/images like any other.
// Scenes: the 3 M6 scenes (m6-scenes.json) visited in order with a short walk · synthetic save · external hosts blocked.
//   BASE=http://127.0.0.1:8780 node qa/g4/memory.js OUT.json [--patch '{"char2On":true}'] [--inject]
//   --inject: a 4096×4096 canvas is made and kept → resident must grow by 64 MiB (proves the count can see a leak)
'use strict';
const fs = require('fs'), { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8780', MiB = 1048576;
const OUTF = process.argv[2], INJECT = process.argv.includes('--inject');
const PATCH = process.argv.includes('--patch') ? JSON.parse(process.argv[process.argv.indexOf('--patch') + 1]) : null;
const SCENES = require('./m6-scenes.json'), SAVE = { name: 'P', kid: 0, house: 1, age: 7 };
const HOOK = () => {
  const T = window.__t = []; const add = (kind, o, w, h) => T.push({ kind, ref: new WeakRef(o), w0: w || 0, h0: h || 0 });
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const e = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas') add('canvas', e); return e; };
  if (window.OffscreenCanvas) { const O = window.OffscreenCanvas; window.OffscreenCanvas = function (w, h) { const o = new O(w, h); add('canvas', o, w, h); return o; }; window.OffscreenCanvas.prototype = O.prototype; }
  const C2 = CanvasRenderingContext2D.prototype, gid = C2.getImageData, cid = C2.createImageData;
  C2.getImageData = function (...a) { const d = gid.apply(this, a); add('imagedata', d, d.width, d.height); return d; };
  C2.createImageData = function (...a) { const d = cid.apply(this, a); add('imagedata', d, d.width, d.height); return d; };
  const ID = window.ImageData; window.ImageData = function (...a) { const d = new ID(...a); add('imagedata', d, d.width, d.height); return d; }; window.ImageData.prototype = ID.prototype;
  if (window.createImageBitmap) { const cib = window.createImageBitmap; window.createImageBitmap = (...a) => cib(...a).then(b => { add('bitmap', b, b.width, b.height); return b; }); }
  const seen = new WeakSet(), d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: d.get, set(v) { if (!seen.has(this)) { seen.add(this); add('image', this); } d.set.call(this, v); } });
  const gc2 = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { const r = gc2.apply(this, a); for (let i = T.length - 1; i >= 0 && i > T.length - 400; i--) { const t = T[i]; if (t.kind === 'canvas' && t.ref.deref() === this) { t.w0 = Math.max(t.w0, this.width); t.h0 = Math.max(t.h0, this.height); break; } } return r; };
};
const MEASURE = async () => {
  for (let k = 0; k < 3; k++) { if (window.gc) gc(); await new Promise(r => setTimeout(r, 100)); }
  // <img> elements written in the page itself (not through .src) count too
  const extra = [...document.images].filter(i => !window.__t.some(t => t.kind === 'image' && t.ref.deref() === i));
  let res = { image: 0, canvas: 0, imagedata: 0, bitmap: 0 }, made = { image: 0, canvas: 0, imagedata: 0, bitmap: 0 }, alive = 0, screen = 0;
  for (const t of window.__t) { const o = t.ref.deref(); let w = t.w0, h = t.h0;
    if (o) { if (t.kind === 'canvas') { w = Math.max(w, o.width); h = Math.max(h, o.height); if (o.id === 'c') { screen += o.width * o.height * 4; continue; } }
      if (t.kind === 'image') { w = o.naturalWidth || 0; h = o.naturalHeight || 0; t.w0 = w; t.h0 = h; } }
    made[t.kind] += w * h * 4; if (o) { alive++; res[t.kind] += (t.kind === 'canvas' ? o.width * o.height : w * h) * 4; } }
  for (const i of extra) { res.image += i.naturalWidth * i.naturalHeight * 4; made.image += i.naturalWidth * i.naturalHeight * 4; }
  // the game canvas #c is written in the page (not made by script): reported as screen, never in the totals
  if (!screen) { const c = document.getElementById('c'); if (c) screen = c.width * c.height * 4; }
  const mb = x => +(x / 1048576).toFixed(2), tot = o => Object.values(o).reduce((a, b) => a + b, 0);
  return { resident_MiB: mb(tot(res)), made_MiB: mb(tot(made)), by_kind_resident_MiB: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, mb(v)])),
    screen_MiB: mb(screen), tracked: window.__t.length, alive, gc: !!window.gc, map: M && M.id };
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: 'Asia/Bangkok', locale: 'th-TH', serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') ? r.continue() : r.abort(); });
  await ctx.addInitScript(HOOK);
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), null, { timeout: 90000 }); await p.waitForTimeout(800);
  const R = { base: BASE, patch: PATCH, inject: INJECT, steps: {} };
  R.steps.title = await p.evaluate(MEASURE);
  await p.evaluate(([sv, patch]) => { const d = Store.all(); d.slots = [Object.assign(newSave(sv), patch || {})]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {} LITE = false; fpsChecks = 6; S.eco = false; }, [SAVE, PATCH]);
  for (const sc of SCENES) {
    await p.evaluate(sc => { goMap(sc.map); P.path = P.act = null; const g = [P.x + sc.go[0] * T, P.y + sc.go[1] * T]; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [g]; }, sc);
    await p.waitForTimeout(3000);
    if (INJECT && sc === SCENES[SCENES.length - 1]) await p.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 4096; c.getContext('2d').fillRect(0, 0, 1, 1); window.__inj = c; });
    await p.waitForTimeout(1500);
    R.steps[sc.id] = await p.evaluate(MEASURE);
    console.log(sc.id, JSON.stringify(R.steps[sc.id]));
  }
  R.peak_resident_MiB = Math.max(...Object.values(R.steps).map(s => s.resident_MiB));
  R.peak_made_MiB = Math.max(...Object.values(R.steps).map(s => s.made_MiB));
  R.errors = errs; R.pass = errs.length === 0 && Object.values(R.steps).every(s => s.gc);
  console.log(JSON.stringify({ peak_resident_MiB: R.peak_resident_MiB, peak_made_MiB: R.peak_made_MiB, errors: errs.length, pass: R.pass }));
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
