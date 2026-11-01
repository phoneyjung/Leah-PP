// G2.6 A6 v2 (Claude · 1 Nov 2569 · after Codex T14 R3). Bytes (w x h x 4) of the pictures the character system holds on each Pilot page.
// v1 counted only canvases made by document.createElement, missed the HTML <canvas> in the page, ImageData and the held-lantern files,
// kept every canvas alive itself (so short-lived ones looked resident) and had no 40 MiB check. v2:
//  - every canvas (createElement + OffscreenCanvas), ImageData (getImageData / createImageData / new ImageData) and ImageBitmap is tracked with a
//    WeakRef + the functions that made it; after load the page is left 1.5 s, then gc() x 3 (Chromium --expose-gc): RESIDENT = still alive,
//    MADE = everything ever made whose size could be read (upper bound of the load peak). HTML <canvas> in the page = "screen" (the game has its own).
//  - decoded picture files: character = c2-pilot-* / kid-* / c2-held-* ; others = scene.
//  - category of a tracked buffer: portrait page and motion page = character (both pages only draw the kid); scene page = character when made by
//    breatheW / buildFists / sheet8 / gmLantern / buildFx / stampRadial / stampPool (kid sheets, fists, lantern and its light), else scene.
//  - 4 kids in 4 colours (plan G2.0 A6) is a MODEL - the Pilot never draws 4 full colour sets: per colour set = the 3 kid sheets as decoded here;
//    shared = the original sheets + 3 masks of the same size + the portrait page's character resident + the lantern buffers.
// PASS: every page's character RESIDENT <= 40 MiB and the 4-colour model <= 40 MiB.  --inject: a 4096 x 4096 canvas is made inside a function
// named breatheW and kept alive on every page -> must FAIL (exit 1): proves the check can fail.
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_memory.js [OUT.json] [--inject]
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8794, base = 'http://127.0.0.1:' + PORT + '/', MiB = 1048576, BUDGET = 40 * MiB;
const INJECT = process.argv.includes('--inject'), OUTF = process.argv.slice(2).find(a => !a.startsWith('--'));
const HOOK = () => {
  const T = window.__t = []; const who = () => (new Error().stack || '').split("\n").slice(2, 16).map(l => (l.trim().match(/^at (?:new )?([\w$.<>]+)/) || [])[1]).filter(x => x && !/^(Document|HTMLDocument|CanvasRenderingContext2D|OffscreenCanvas|ImageData|window\.)/.test(x)).join('<');
  const add = (kind, o, w, h) => T.push({ kind, ref: new WeakRef(o), w0: w, h0: h, fn: who(), o: kind === 'canvas' ? null : undefined });
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const e = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas') add('canvas', e); return e; };
  if (window.OffscreenCanvas) { const O = window.OffscreenCanvas; window.OffscreenCanvas = function (w, h) { const o = new O(w, h); add('canvas', o, w, h); return o; }; window.OffscreenCanvas.prototype = O.prototype; }
  const C2 = CanvasRenderingContext2D.prototype, gid = C2.getImageData, cid = C2.createImageData;
  C2.getImageData = function (...a) { const d = gid.apply(this, a); add('imagedata', d, d.width, d.height); return d; };
  C2.createImageData = function (...a) { const d = cid.apply(this, a); add('imagedata', d, d.width, d.height); return d; };
  const ID = window.ImageData; window.ImageData = function (...a) { const d = new ID(...a); add('imagedata', d, d.width, d.height); return d; }; window.ImageData.prototype = ID.prototype;
  if (window.createImageBitmap) { const cib = window.createImageBitmap; window.createImageBitmap = (...a) => cib(...a).then(b => { add('bitmap', b, b.width, b.height); return b; }); }
  // a canvas's size is set after createElement: remember the largest size seen when a 2d context is asked for or drawn into
  const gc2 = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { const r = gc2.apply(this, a); for (const t of T) if (t.kind === 'canvas' && t.ref.deref() === this) { t.w0 = Math.max(t.w0 || 0, this.width); t.h0 = Math.max(t.h0 || 0, this.height); } return r; };
};
const INJ = () => { window.addEventListener('load', () => setTimeout(function breatheW() { const c = document.createElement('canvas'); c.width = c.height = 4096; c.getContext('2d').fillRect(0, 0, 1, 1); window.__inj = c; }, 200)); };
const CHAR_FN = /\b(breatheW|buildFists|sheet8|gmLantern|buildFx|stampRadial|stampPool)\b/;
(async () => {
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc'] }); const R = { pages: {}, inject: INJECT };
  for (const [name, url, ready, allChar] of [['scene', 'pilot-g2-scene.html?gm', 'window.PS&&PS.ST.ready', false], ['portrait', 'pilot-g2-portrait.html?gm', 'window.PT&&PT.S&&PT.S.ready', true], ['motion', 'pilot-g2-motion.html?gm&hold', 'window.PT&&PT.ST&&PT.ST.img.walk', true]]) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625 }); const p = await ctx.newPage();
    await p.addInitScript(HOOK); if (INJECT) await p.addInitScript(INJ);
    await p.goto(base + url); await p.waitForFunction(ready, null, { timeout: 30000 });
    if (name === 'portrait') { await p.locator('#luOpen').click(); await p.waitForTimeout(300); }      // the 4-kid quiz open = the most this page holds
    await p.waitForTimeout(1500);
    R.pages[name] = await p.evaluate(async ([allChar, CF]) => {
      for (let k = 0; k < 3; k++) { if (window.gc) gc(); await new Promise(r => setTimeout(r, 100)); }
      const CHAR = new RegExp(CF), screen = new Set(document.querySelectorAll('canvas')), items = [];
      // T15 N1: buffers the character system HOLDS are known by identity (not only by the function names in a cut stack): the scene page's
      // fist overlays (PS.FIST) and kid pictures (PS.ST.img) -> character, whatever made them
      const own = new Set(), walk = (o, d) => { if (!o || d > 6 || typeof o !== 'object') return; if (o instanceof HTMLCanvasElement || o instanceof ImageData || o instanceof HTMLImageElement) { own.add(o); return; }
        for (const v of (Array.isArray(o) ? o : Object.values(o))) walk(v, d + 1); };
      if (window.PS) { walk(PS.FIST, 0); walk(PS.ST && PS.ST.img, 0); }
      for (const t of window.__t) { const o = t.ref.deref(), alive = !!o; let w = t.w0 || 0, h = t.h0 || 0;
        if (t.kind === 'canvas' && o) { w = Math.max(w, o.width); h = Math.max(h, o.height); if (screen.has(o)) continue; }
        const cat = allChar || (o && own.has(o)) || CHAR.test(t.fn) ? 'character' : 'scene';
        items.push({ kind: t.kind, w, h, bytes: w * h * 4, live_bytes: alive ? (t.kind === 'canvas' ? o.width * o.height * 4 : w * h * 4) : 0, alive, cat, fn: t.fn.slice(0, 60) }); }
      const scr = [...screen].map(c => ({ id: c.id || '(no id)', w: c.width, h: c.height, bytes: c.width * c.height * 4 }));
      const files = [...new Set(performance.getEntriesByType('resource').map(e => e.name.split('/').pop().split('?')[0]).filter(f => /\.(png|jpe?g)$/i.test(f)))];
      const dims = {}; await Promise.all(files.map(f => new Promise(r => { const i = new Image(); i.onload = () => { dims[f] = [i.naturalWidth, i.naturalHeight]; r(); }; i.onerror = r; i.src = f; })));
      const img = Object.entries(dims).map(([f, [w, h]]) => ({ file: f, w, h, bytes: w * h * 4, cat: /^(c2-pilot|kid-|c2-held)/.test(f) ? 'character' : 'scene' }));
      const sum = (a, f, k = 'bytes') => a.filter(f).reduce((s, x) => s + x[k], 0);
      return { gc: !!window.gc, images: img, tracked: items, screen: scr,
        character_resident: sum(img, x => x.cat === 'character') + sum(items, x => x.cat === 'character', 'live_bytes'),
        character_made: sum(img, x => x.cat === 'character') + sum(items, x => x.cat === 'character'),
        scene_resident: sum(img, x => x.cat === 'scene') + sum(items, x => x.cat === 'scene', 'live_bytes'), screen_bytes: sum(scr, () => true),
        kid_sheets: img.filter(x => /^c2-pilot-kid4-(walk|idleanim|walkhold)\.png$/.test(x.file)).map(x => [x.file, x.w, x.h]),
        lantern: sum(img, x => /^(c2-held|kid-lantern)/.test(x.file)) + sum(items, x => /\b(sheet8|gmLantern|buildFx|stampRadial|stampPool)\b/.test(x.fn), 'live_bytes') };
    }, [allChar, CHAR_FN.source]);
    await ctx.close();
  }
  const P = R.pages, mb = x => +(x / MiB).toFixed(3);
  const sheets = P.motion.kid_sheets.length === 3 ? P.motion.kid_sheets : P.scene.kid_sheets, perSet = sheets.reduce((s, [, w, h]) => s + w * h * 4, 0);
  const model = { per_colour_set: perSet, originals: perSet, masks_3: perSet, four_sets: 4 * perSet, portrait_page_character_resident: P.portrait.character_resident, lantern: Math.max(P.scene.lantern, P.motion.lantern) };
  model.total = model.originals + model.masks_3 + model.four_sets + model.portrait_page_character_resident + model.lantern;
  R.model_4_colours = Object.fromEntries(Object.entries(model).map(([k, v]) => [k + '_MiB', mb(v)]));
  R.summary = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, { gc: v.gc, character_resident_MiB: mb(v.character_resident), character_made_MiB: mb(v.character_made), scene_resident_MiB: mb(v.scene_resident), screen_MiB: mb(v.screen_bytes), tracked: v.tracked.length, alive: v.tracked.filter(x => x.alive).length }]));
  R.pass = Object.values(P).every(v => v.gc && v.character_resident <= BUDGET) && model.total <= BUDGET && sheets.length === 3;
  console.log(JSON.stringify({ summary: R.summary, model_4_colours: R.model_4_colours, pass: R.pass, inject: INJECT }));
  if (OUTF) require('fs').writeFileSync(OUTF, JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
