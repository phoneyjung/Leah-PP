// G3.3 K3 tests (Claude · 2 Nov 2569) · G3_0_BASELINE.md sections 2, 3, 5, 6 · G3_0_RENDERER_PLAN.md K3a K3b K3d (+ A12)
// k3a : two tabs in ONE browser context (baseline 6.1): tab P = the frozen Pilot pilot-g2-motion.html?gm&clean, its 3 sheet URLs answered by
//       page.route with the Python reference sheets (qa/g3/ref) · tab C = qa/g3/k3-harness.html + char2.js, NO route (raw bytes, own recolour).
//       Both run the same scripted 16 ms steps from a fresh load; every step hashes the whole canvas; a step whose hashes differ is replayed
//       and its RGB / alpha px are counted separately (baseline 2: 0 and 0). Blink steps must match (6.4).
// k3d : tab P = pilot-g2-motion.html?gm&scene=cave&power=100 (not clean): drawImage is watched (no file changed) -> the light hole it really
//       draws and the lit glass it draws again after the darkness · tab C: Char2.light() and Char2.draw(..., {only:'emissive'}) · + D3-D6
// k3b : tab C only: Char2.sheet() for 640 colour sets x idle / walk / walkhold / stand8 + 16 composed draws per set vs the Python reference
//       hashes (qa/g3/ref_char2.py) · anchors head_top / body / box / label vs the Python geometry · INJECT=B1..B5 (must fail)
// a12 : drawing with the caller's globalAlpha = "draw at alpha 1 on a clear canvas, then draw that canvas once at alpha" (+ clip, alpha 0 / 1, afterimage)
// usage: PORT=<server at repo root> node qa/g3/test_g33_k3.js k3a|k3d|k3b|a12 OUT.json [DIR with sheets/composed/anchors.json for k3b]
//        env K3_GROUPS=A2,A4 runs some groups only (not GROUPS: bash keeps that name read-only) · INJECT=B1..B5 / T1..T3 edits char2.src.js
//        in memory and serves it as char2.js (B = K3b faults, T = timing faults that K3a must catch) · exit 0 = all pass
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const PORT = process.env.PORT || 8792, MODE = process.argv[2], OUT = process.argv[3] || '/tmp/g33-' + MODE + '.json', REFJ = process.argv[4];
const ROOT = process.cwd(), base = 'http://127.0.0.1:' + PORT + '/', REF = path.join(ROOT, 'qa/g3/ref');
const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'], sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const SHEETS = ['c2-pilot-kid4-walk.png', 'c2-pilot-kid4-idleanim.png', 'c2-pilot-kid4-walkhold.png'];
const REFSHA = JSON.parse(fs.readFileSync(path.join(REF, 'SHA256.json'))).files;
const FROZEN = {};   // baseline section 1: the raw sheets tab C must receive
for (const line of fs.readFileSync(path.join(ROOT, 'G3_0_BASELINE.md'), 'utf8').split('\n')) { const m = line.match(/`([^`]+)`\s*\|\s*`([0-9a-f]{64})`/); if (m) FROZEN[m[1]] = m[2]; }
// K3b injections (plan K3b: 5 faults that must be caught · the last 3 only by the composed images)
const INJ = { B1: ["d[j] = c[0]; d[j + 1] = c[1];", "d[j] = c[0] ^ (an === 'walk' && !build.f ? (build.f = 1) : 0); d[j + 1] = c[1];"],   // 1 px in 1 sheet
  B2: ["house: colourIx(p, 'house', dc.house) };", "house: (colourIx(p, 'house', dc.house) + 1) % 4 };"],                                   // house swapped
  B3: ["D.data.set(img.data.subarray(", "D.data.set(ST.sh[an].A.data.subarray("],                                                       // fist px from another look (the raw one)
  B4: ["X0 = Math.round(x - p.feet[0] * s + p.render_offset[d] * s)", "X0 = Math.round(x - p.feet[0] * s + (p.render_offset[d] + (d === 'E' ? 1 : 0)) * s)"],   // offset E +1
  B5: ["lx = t ? Math.round(lp[0]) - G[0] : 0", "lx = t ? Math.round(lp[0]) - G[0] + 1 : 0"],          // grip 1 px
  S0: ['', ''],                                                                                                                       // the readable source unchanged (must pass)
  // K3a sensitivity (not in the baseline list): timing faults
  T1: ["A.anim = 'idle'; A.fi = T.stop_fi;", "A.anim = 'idle'; A.fi = T.stop_fi + 1;"],                                                 // stop -> idle starts 1 frame late
  T2: ["A.fi % L === L - 1 && A.blinkClock", "A.fi % L === L - 2 && A.blinkClock"],                                                 // blink on the wrong loop position
  T4: ["A.blinkAt = T.blink_min_ms + A.rand() * T.blink_span_ms;", "A.blinkAt = T.blink_min_ms + T.blink_span_ms;"],                 // next blink ignores rand()
  T3: ["+ E.max_px, Math.max(", "+ E.max_px + 1, Math.max("],                                                                        // ease allows 4 px
  X1: ["comp = a0 < 1 && !emis", "comp = false && a0 < 1 && !emis"],                                                                // A12: alpha per layer (no composition)
  // T25 N1 (Codex): X2 = only the actor check of G3.3 v1 (the frame-index check still stops NaN / -1 frames) · X3 = both checks as in G3.3 v1 (v1 behaviour)
  X2: ["function actorOk(A) {", "function actorOk(A) { return isObj(A) && ST.pack.dirs.includes(A.dir);"],
  X3: [["function actorOk(A) {", "function actorOk(A) { return isObj(A) && ST.pack.dirs.includes(A.dir);"],
       ["if (!e || !isInt(kk) || kk < 0 || (kk + 1) * C > e.cv.width) return false;", "if (!e) return false;"]],
  X4: ["A.lpos.length === 2 && inCell(A.lpos[0]) && inCell(A.lpos[1])", "A.lpos.length === 2 && A.lpos.every(inCell)"] }[process.env.INJECT || ''];   // X4 = T26 N2: the v1.1 lpos check (every() skips holes)
let C2SRC = null;
if (process.env.INJECT) {
  if (!INJ) { console.log('unknown INJECT'); process.exit(2); }
  C2SRC = fs.readFileSync(path.join(ROOT, 'char2.src.js'), 'utf8');
  for (const [from, to] of Array.isArray(INJ[0]) ? INJ : [INJ]) { if (!C2SRC.includes(from)) { console.log('inject target missing'); process.exit(2); } C2SRC = C2SRC.replace(from, to); }
}
const ONLY = process.env.K3_GROUPS ? process.env.K3_GROUPS.split(',') : null;

// page helpers shared by both tabs: a 64-bit hash of the whole canvas (two 32-bit lanes) and its bytes as base64 (for the px count of a bad step)
const HELP = () => {
  window.__hash = (c) => { const d = new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer); let a = 0x811c9dc5, b = 0x9747b28c;
    for (let i = 0; i < d.length; i++) { const v = d[i]; a = Math.imul(a ^ v, 0x01000193); b = Math.imul(b ^ v, 0x5bd1e995); b ^= b >>> 15; } return (a >>> 0).toString(16) + '.' + (b >>> 0).toString(16) + '.' + c.width + 'x' + c.height; };
  window.__b64 = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = ''; for (let i = 0; i < d.length; i += 32768) s += String.fromCharCode.apply(null, d.subarray(i, i + 32768)); return btoa(s); };
};

async function newCtx(b, dpr) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: dpr });
  await ctx.addInitScript(() => {
    if (!location.pathname.endsWith('pilot-g2-motion.html')) return;   // tab P only
    Math.random = () => 0.5;                                          // baseline 2: the page's only Math.random (next blink) -> 4,100 ms
    window.requestAnimationFrame = () => 0;                           // baseline 6.2: the page loop never runs by itself; the test steps it
    const di = CanvasRenderingContext2D.prototype.drawImage; window.__holes = []; window.__dark = []; window.__lcell = [];
    CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {   // K3d: what the Pilot really draws (no file is changed)
      try { const FX = window.PT && window.PT.FX;
        if (FX && img === FX.lhole) window.__holes.push({ x: a[0], y: a[1], alpha: this.globalAlpha });
        else if (FX && img === FX.dark) window.__dark.push({ DX: a[4], DY: a[5], aw: a[2], dw: a[6] });
        else if (FX && FX.lcell && img === FX.lcell && this.canvas.id === 'cv') { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); window.__lcell.push({ c, x: a[4], y: a[5], w: a[6], alpha: this.globalAlpha }); }
      } catch (e) {}
      return di.call(this, img, ...a);
    };
  });
  return ctx;
}
async function openPilot(ctx, query) {
  const p = await ctx.newPage(), errs = [], served = {};
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.route((u) => SHEETS.includes(path.basename(u.pathname)), (r) => {   // baseline 6.1: route on tab P only, before the page opens
    const name = path.basename(new URL(r.request().url()).pathname), body = fs.readFileSync(path.join(REF, name)); served[name] = sha(body);
    return r.fulfill({ status: 200, contentType: 'image/png', body });
  });
  await p.goto(base + 'pilot-g2-motion.html?' + query, { waitUntil: 'load' });
  await p.waitForFunction(() => { const S = window.PT && window.PT.ST; return !!(S && S.ok.walk && S.ok.idle && S.ok.walkhold && S.ok.hold && S.ok.lantern && S.img.lanternLight && document.getElementById('cv').width > 0); }, null, { timeout: 20000, polling: 100 });   // polling by timer: the page has no requestAnimationFrame (6.2)
  await p.evaluate(HELP);
  const start = await p.evaluate(() => { const S = PT.ST, cv = document.getElementById('cv');
    window.K3P = {
      step(inp) {   // the page's own controls: hold button (hold + lpos null), power, pad walk / stop, then one 16 ms step + draw
        if (inp.hold !== S.hold) PT.set({ hold: inp.hold, lpos: null });
        if (inp.power !== undefined && inp.power !== S.power) PT.set({ power: inp.power });
        if (inp.moving) PT.walk(inp.dir); else { PT.stop(); PT.setDir(inp.dir); }
        window.__holes = []; window.__dark = []; window.__lcell = [];
        PT.step(16); PT.set({ pos: { x: 160, y: 120 } }); PT.draw();
        const L = S.last; return { st: [L.sheet, L.dir, L.frame], li: S.anim === 'idle' ? S.fi % 4 : -1, blink: !!S.blinkNow, holdOn: PT.holdOn(), fx: L.fx, fy: L.fy, s: L.s };
      },
      pixels(inp) { const r = K3P.step(inp); r.h = __hash(cv); return r; },
      light(inp) {   // K3d: hole centre and the re-drawn lit glass, both converted to art px from the logical feet
        const r = K3P.step(inp), s = r.s, h = __holes[__holes.length - 1], dk = __dark[__dark.length - 1], lc = __lcell[__lcell.length - 1];
        r.hole = h && dk ? [(dk.DX + (h.x + PT.LHOLE.R) * (dk.dw / dk.aw) - r.fx) / s, (dk.DY + (h.y + PT.LHOLE.R) * (dk.dw / dk.aw) - r.fy) / s] : null;
        r.holes = __holes.length; r.tableHole = PT.GM_POW[S.power].hole; r.power = S.power;
        r.emis = null;
        if (lc) { const E = document.createElement('canvas'); E.width = E.height = 160; const g = E.getContext('2d'); g.imageSmoothingEnabled = false; g.globalAlpha = lc.alpha;
          g.drawImage(lc.c, 80 + (lc.x - r.fx) / s, 120 + (lc.y - r.fy) / s); r.emis = __hash(E); r.emisAt = [(lc.x - r.fx) / s, (lc.y - r.fy) / s, lc.w / s]; }
        return r;
      } };
    return { fi: S.fi, t: S.t, blinkClock: S.blinkClock || 0, lpos: S.lpos, w: cv.width, h: cv.height, s: PT.scale() }; });
  return { p, errs, served, start };
}
async function openChar2(ctx, w, h, s, opt) {
  const p = await ctx.newPage(), errs = [], served = {};
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('response', async (r) => { try { const n = path.basename(new URL(r.url()).pathname); if (SHEETS.includes(n)) served[n] = sha(await r.body()); } catch (e) {} });
  if (C2SRC) await p.route((u) => u.pathname.endsWith('/char2.js'), (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: C2SRC }));
  if (opt && opt.abort) await p.route((u) => opt.abort.includes(path.basename(u.pathname)), (r) => r.fulfill({ status: 404, body: '' }));
  await p.goto(base + 'qa/g3/k3-harness.html', { waitUntil: 'load' });
  await p.evaluate(HELP);
  const init = await p.evaluate(async ({ w, h, s }) => {
    const r = await Char2.load('../../c2-pack.json'), c = document.getElementById('c2'); c.width = w; c.height = h;
    window.APP = Char2.look({}); window.DC = { house: 'wing', held: { id: 'lantern_L0', on: true, lit: true, power: 100 } };
    window.A = Char2.actor({ rand: () => 0.5, blinkAt: 4000 });
    const fx = Math.round(w / 2 - 160 * s) + 160 * s, fy = Math.round(h / 2 - 120 * s) + 120 * s, g = c.getContext('2d');
    window.K3C = {
      tick(inp) { if (inp.power !== undefined) DC.held.power = inp.power; Char2.tick(A, 16, { moving: inp.moving, dir: inp.dir, holding: inp.hold }); },
      pixels(inp) { K3C.tick(inp); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#00ff00'; g.fillRect(0, 0, w, h);
        const ok = Char2.draw(g, APP, DC, A, fx, fy, s); return { ok, blink: A.blinkNow, h: __hash(c) }; },
      light(inp) { K3C.tick(inp); const E = document.createElement('canvas'); E.width = E.height = 160;
        const ok = Char2.draw(E.getContext('2d'), APP, DC, A, 80, 120, 1, { only: 'emissive' }); return { c2: Char2.light(A, DC), emis: ok ? __hash(E) : null, dir: A.dir, blink: A.blinkNow }; } };
    return { ready: r.ready, failed: r.failed, app: APP, fx, fy };
  }, { w, h, s });
  return { p, errs, served, init };
}
const b64diff = (a, b) => { const A = Buffer.from(a, 'base64'), B = Buffer.from(b, 'base64'); let rgb = 0, al = 0; const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i += 4) { if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2]) rgb++; if (A[i + 3] !== B[i + 3]) al++; } return { rgb, al, sizes: [A.length, B.length] }; };

// ---- scripted groups (baseline 2, A1-A11) · each group starts on freshly loaded tabs ----
const seg = (n, moving, dir, hold, extra) => Array.from({ length: n }, () => Object.assign({ moving, dir, hold }, extra || {}));
const GROUPS = {   // far = blinkAt far away on both sides (A1, A3: no blink · baseline 2)
  A1: { far: true, steps: DIRS.flatMap((d) => seg(50, false, d, false)) },                 // 4 idle loop positions per dir (800 ms each)
  A2: { steps: DIRS.flatMap((d) => seg(40, true, d, false)) },                              // 6 walk frames per dir
  A3: { far: true, steps: DIRS.flatMap((d) => seg(50, false, d, true)) },
  A4: { steps: DIRS.flatMap((d) => seg(40, true, d, true)) },
  A5: { steps: DIRS.concat(['S']).flatMap((d) => seg(30, true, d, false)).concat(DIRS.concat(['S']).flatMap((d) => seg(30, true, d, true))) },   // turning while walking
  A6: { steps: DIRS.flatMap((d) => seg(20, true, d, false).concat(seg(20, false, d, false))) },                                          // walk -> stop, every dir
  A6h: { steps: DIRS.flatMap((d) => seg(20, true, d, true).concat(seg(20, false, d, true))) },                                          // + walk -> stop while holding (ease 4-8 px · not in baseline 2)
  A7: { steps: seg(20, false, 'S', false).concat(seg(20, false, 'S', true), seg(20, true, 'E', true), seg(20, true, 'E', false)) },    // hold on / off
  A8: { steps: seg(30, true, 'N', true).concat(seg(30, true, 'NE', true), seg(30, true, 'N', true), seg(30, true, 'NW', true)) },      // leaving N
  A9: { steps: seg(125, true, 'E', true) },                                                                                              // 2 s walk-hold (ease)
  A11: { steps: [100, 50, 10, 0].flatMap((pw) => seg(16, false, 'S', true, { power: pw })) },                                            // power
};
for (const d of ['S', 'SE', 'E', 'W', 'SW']) for (const hold of [false, true]) GROUPS['A10-' + d + (hold ? '-hold' : '')] = { steps: seg(625, false, d, hold) };   // blink 0-10 s

async function runGroup(b, dpr, gname, G, mode, upto) {   // upto = replay to this step and return both canvases (px count of a bad step)
  const ctx = await newCtx(b, dpr);
  const P = await openPilot(ctx, mode === 'k3a' ? 'gm&clean' : 'gm&scene=cave&power=100');
  const Cq = await openChar2(ctx, P.start.w, P.start.h, P.start.s);
  if (G.far) { await P.p.evaluate(() => PT.set({ blinkAt: 1e12 })); await Cq.p.evaluate(() => { A.blinkAt = 1e12; }); }
  const steps = upto === undefined ? G.steps : G.steps.slice(0, upto + 1), fn = mode === 'k3a' ? 'pixels' : 'light';
  const pr = await P.p.evaluate(({ steps, fn }) => steps.map((s) => K3P[fn](s)), { steps, fn });
  const cr = await Cq.p.evaluate(({ steps, fn }) => steps.map((s) => K3C[fn](s)), { steps, fn });
  let bytes = null;
  if (upto !== undefined) bytes = [await P.p.evaluate(() => __b64(document.getElementById('cv'))), await Cq.p.evaluate(() => __b64(document.getElementById('c2')))];
  const rej = await Cq.p.evaluate(() => window.__rej); await ctx.close();
  return { P, Cq, pr, cr, rej, bytes };
}

(async () => {
  const b = await chromium.launch(); const R = { mode: MODE, inject: process.env.INJECT || null, frozen_raw: SHEETS.map((n) => FROZEN[n]) }; let fails = 0;
  if (MODE === 'k3a' || MODE === 'k3d') {
    R.runs = [];
    for (const dpr of [3, 1]) {
      const cover = new Set();
      for (const [gname, G] of Object.entries(GROUPS)) {
        if (ONLY && !ONLY.includes(gname)) continue;
        if (MODE === 'k3d' && !['A3', 'A4', 'A6h', 'A7', 'A8', 'A9', 'A11'].includes(gname)) continue;
        const { P, Cq, pr, cr, rej } = await runGroup(b, dpr, gname, G, MODE);
        const startOk = P.start.fi === 0 && P.start.t === 0 && P.start.blinkClock === 0 && P.start.lpos === null && Cq.init.ready;
        const servedOk = SHEETS.every((n) => P.served[n] === REFSHA[n] && Cq.served[n] === FROZEN[n]);
        const row = { group: gname, dpr, steps: pr.length, startOk, servedOk, served: { P: P.served, C: Cq.served }, pageErrors: P.errs.length + Cq.errs.length, rejections: rej };
        let ok = startOk && servedOk && !row.pageErrors && !rej;
        if (MODE === 'k3a') {
          const bad = []; let blinkP = 0, blinkC = 0, blinkBad = 0;
          pr.forEach((r, i) => { const c = cr[i]; if (!c.ok || c.h !== r.h) bad.push(i); if (r.blink) blinkP++; if (c.blink) blinkC++; if (r.blink !== c.blink) blinkBad++;
            if (['A1', 'A2', 'A3', 'A4'].includes(gname)) cover.add(gname + ':' + r.st[1] + ':' + (r.li >= 0 ? 'li' + r.li : 'f' + r.st[2])); });
          const starts = (L) => L.map((r, i) => (r.blink && !(i && L[i - 1].blink) ? i + 1 : 0)).filter(Boolean);   // step number (1-based) where a blink begins
          Object.assign(row, { badSteps: bad.length, blinkSteps: [blinkP, blinkC], blinkBad, blinkStartsP: starts(pr), blinkStartsC: starts(cr) });
          if (bad.length) {   // replay to the first bad step and count the px (RGB and alpha separately)
            const rr = await runGroup(b, dpr, gname, G, MODE, bad[0]); row.firstBad = Object.assign({ step: bad[0], pilot: pr[bad[0]], char2: { ok: cr[bad[0]].ok } }, b64diff(rr.bytes[0], rr.bytes[1]));
          }
          ok = ok && !bad.length && !blinkBad;
          console.log((ok ? 'PASS ' : 'FAIL ') + 'k3a dpr' + dpr + ' ' + gname + ' · ' + pr.length + ' steps · bad ' + bad.length + (row.firstBad ? ' (first step ' + row.firstBad.step + ': rgb ' + row.firstBad.rgb + ' / alpha ' + row.firstBad.al + ' px)' : '') + ' · blink steps ' + blinkP + '/' + blinkC + (row.blinkStartsP.length ? ' starts ' + row.blinkStartsP.map((k) => k * 16 + ' ms').join(' ') : '') + (startOk && servedOk ? '' : ' · start ' + startOk + ' served ' + servedOk));
        } else {
          let holes = 0, hidden = 0, holeBad = 0, emis = 0, emisBad = 0, firstBad = null;
          pr.forEach((r, i) => {
            const c = cr[i], L = c.c2; let good;
            if (!r.holdOn) good = L === null;                                                                  // not holding -> null
            else if (r.hole) { holes++; if (L && L.hidden) hidden++; good = !!L && L.x === r.hole[0] && L.y === r.hole[1] && L.hidden === (c.dir === 'N') && L.lit === true && L.power === r.power; }
            else good = !!L && L.power === r.power && (!L.lit || r.tableHole === 0);                            // no hole: no light, or the scene's own power table opens none
            if (!good) { holeBad++; if (!firstBad) firstBad = { step: i, pilot: r, char2: c }; }
            if (r.emis || c.emis) emis++;
            if (r.emis !== c.emis) { emisBad++; if (!firstBad) firstBad = { step: i, pilot: r, char2: c }; }
            if (['A3', 'A4'].includes(gname)) cover.add(gname + ':' + r.st[1] + ':' + (r.li >= 0 ? 'li' + r.li : 'f' + r.st[2]));
          });
          Object.assign(row, { holes, hidden, holeBad, emis, emisBad, firstBad });
          ok = ok && !holeBad && !emisBad;
          console.log((ok ? 'PASS ' : 'FAIL ') + 'k3d dpr' + dpr + ' ' + gname + ' · ' + pr.length + ' steps · holes ' + holes + ' (N ' + hidden + ') bad ' + holeBad + ' · lit glass ' + emis + ' bad ' + emisBad);
        }
        row.ok = ok; if (!ok) fails++; R.runs.push(row);
      }
      R['steps_dpr' + dpr] = R.runs.filter((r) => r.dpr === dpr).reduce((n, r) => n + r.steps, 0);
      const want = MODE === 'k3a' ? 160 : 80;
      if (!ONLY) { R['cover_dpr' + dpr] = cover.size + '/' + want; console.log('held / static states covered (dpr ' + dpr + '): ' + cover.size + ' / ' + want); if (cover.size !== want) fails++; }
    }
    if (MODE === 'k3d') {   // D3-D6 on Char2 alone
      const ctx = await newCtx(b, 3), C1 = await openChar2(ctx, 900, 600, 3);
      const d = await C1.p.evaluate(() => {
        const out = {}, mkA = () => Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }), J = JSON.stringify;
        const A1 = mkA(), B1 = mkA(); for (const X of [A1, B1]) for (let i = 0; i < 9; i++) Char2.tick(X, 16, { moving: true, dir: 'E', holding: true });
        const la = Char2.light(A1, DC), lb = Char2.light(B1, DC), wa = [100 + la.x, 100 + la.y], wb = [200 + lb.x, 100 + lb.y];
        out.D3 = J(la) === J(lb) && wb[0] - wa[0] === 100 && wb[1] - wa[1] === 0;
        const M = mkA(); for (let i = 0; i < 5; i++) Char2.tick(M, 16, { moving: true, dir: 'SE', holding: true });
        const before = J(Char2.light(M, DC)), big = document.createElement('canvas'), mini = document.createElement('canvas'); big.width = 900; big.height = 600; mini.width = 200; mini.height = 120;
        const seen = [];
        for (let i = 0; i < 6; i++) { Char2.draw(big.getContext('2d'), APP, DC, M, 450, 400, 3); seen.push(J(Char2.light(M, DC))); Char2.draw(mini.getContext('2d'), APP, DC, M, 30 + i, 100, 1); seen.push(J(Char2.light(M, DC))); }
        out.D4 = seen.every((v) => v === seen[0]); out.D5 = before === seen[0];
        const pw = {}; for (const v of [100, 50, 10, 0]) pw[v] = Char2.light(M, { house: 'wing', held: Object.assign({}, DC.held, { power: v }) });
        const off = Char2.light(M, { house: 'wing', held: Object.assign({}, DC.held, { lit: false }) }), none = Char2.light(M, { house: 'wing', held: null });
        const N = mkA(); Char2.tick(N, 16, { moving: false, dir: 'S', holding: false }); const notHolding = Char2.light(N, DC);
        out.D6 = pw[100].lit && pw[50].lit && pw[10].lit && !pw[0].lit && [100, 50, 10, 0].every((v) => pw[v].power === v && pw[v].x === pw[100].x && pw[v].y === pw[100].y)
          && off && off.lit === false && none === null && notHolding === null;
        out.detail = { la, pw, off, none, notHolding };
        // E1 (extra): anchor(actor, name, dc) follows the sheet draw really uses - holding but dc.held null -> the plain walk sheet
        const W1 = mkA(), W2 = mkA(); for (let i = 0; i < 3; i++) { Char2.tick(W1, 16, { moving: true, dir: 'E', holding: true }); Char2.tick(W2, 16, { moving: true, dir: 'E', holding: false }); }
        const nd = { house: 'wing', held: null };
        out.E1 = ['head_top', 'body', 'box'].every((n) => J(Char2.anchor(W1, n, nd)) === J(Char2.anchor(W2, n)) && J(Char2.anchor(W1, n, DC)) === J(Char2.anchor(W1, n)));
        // E2 (extra): a huge dt returns at once (<= 60 s per call) and leaves a drawable actor
        const Z = mkA(), t0 = performance.now(); Char2.tick(Z, 1e15, { moving: true, dir: 'S', holding: true }); const ms = performance.now() - t0;
        const zc = document.createElement('canvas'); zc.width = zc.height = 160; out.E2 = ms < 200 && Char2.draw(zc.getContext('2d'), APP, DC, Z, 80, 120, 1) === true; out.E2ms = +ms.toFixed(1);
        // E3 (Codex T25 N1): an actor the caller broke -> draw false with no pixel touched (on a clear canvas and on a filled one) · light / anchor null
        const BAD = [['fi NaN', (a) => { a.fi = NaN; }], ['fi missing', (a) => { delete a.fi; }], ['fi -1', (a) => { a.fi = -1; }], ['fi Infinity', (a) => { a.fi = Infinity; }],
          ['fi 1.5', (a) => { a.fi = 1.5; }], ["anim 'jump'", (a) => { a.anim = 'jump'; }], ['lpos NaN', (a) => { a.lpos = [NaN, 70]; }], ['lpos outside', (a) => { a.lpos = [500, 70]; }], ['lpos 3 values', (a) => { a.lpos = [30, 70, 1]; }],
          // Codex T26 N2: sparse arrays (every() skips the holes)
          ['lpos new Array(2)', (a) => { a.lpos = new Array(2); }], ['lpos hole at 0', (a) => { a.lpos = (a.lpos || [30, 70]).slice(); delete a.lpos[0]; }], ['lpos hole at 1', (a) => { a.lpos = [30, , ]; }]];
        const px = (c) => c.getContext('2d').getImageData(0, 0, 160, 160).data, mkC = () => { const c = document.createElement('canvas'); c.width = c.height = 160; return c; };
        out.E3 = [];
        for (const [nm, f] of BAD) for (const mv of [false, true]) {
          const a = mkA(); for (let i = 0; i < 3; i++) Char2.tick(a, 16, { moving: mv, dir: 'E', holding: true }); f(a);
          const c1 = mkC(), c2 = mkC(), g2 = c2.getContext('2d'); g2.fillStyle = '#336699'; g2.fillRect(0, 0, 160, 160); const before = px(c2).join();
          const r1 = Char2.draw(c1.getContext('2d'), APP, DC, a, 80, 120, 1), r2 = Char2.draw(g2, APP, DC, a, 80, 120, 1);
          const clear = px(c1).every((v, i) => (i & 3) !== 3 || v === 0), same = px(c2).join() === before;
          out.E3.push({ nm, walk: mv, draw: [r1, r2], clear, same, light: Char2.light(a, DC), anchor: Char2.anchor(a, 'head_top'),
            ok: r1 === false && r2 === false && clear && same && Char2.light(a, DC) === null && Char2.anchor(a, 'head_top') === null });
        }
        const okA = mkA(); for (let i = 0; i < 3; i++) Char2.tick(okA, 16, { moving: true, dir: 'E', holding: true }); const oc = mkC();
        const okL = Char2.light(okA, DC);
        out.E3control = Char2.draw(oc.getContext('2d'), APP, DC, okA, 80, 120, 1) === true && px(oc).some((v, i) => (i & 3) === 3 && v > 0) && !!okL && Number.isFinite(okL.x) && Number.isFinite(okL.y);
        out.E3ok = out.E3.every((r) => r.ok) && out.E3control; out.E3n = out.E3.filter((r) => r.ok).length + '/' + out.E3.length;
        return out;
      });
      // D6 files: lantern base missing -> null · light layer missing -> lit false (plan API table)
      const C2 = await openChar2(ctx, 200, 200, 1, { abort: ['c2-held-lantern_L0-S-trial.png'] }), C3 = await openChar2(ctx, 200, 200, 1, { abort: ['c2-held-lantern_L0-S-trial-light.png'] });
      const fileCase = async (Cx) => Cx.p.evaluate(() => { const X = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(X, 16, { moving: false, dir: 'S', holding: true }); return Char2.light(X, DC); });
      d.noLantern = await fileCase(C2); d.noLightLayer = await fileCase(C3);
      d.D6files = d.noLantern === null && !!d.noLightLayer && d.noLightLayer.lit === false;
      await ctx.close(); R.props = d; const ok = d.D3 && d.D4 && d.D5 && d.D6 && d.D6files && d.E1 && d.E2 && d.E3ok && !C1.errs.length; if (!ok) fails++;
      console.log((ok ? 'PASS ' : 'FAIL ') + 'D3 ' + d.D3 + ' · D4 ' + d.D4 + ' · D5 ' + d.D5 + ' · D6 ' + d.D6 + ' · D6 files ' + d.D6files + ' · E1 anchor+dc ' + d.E1 + ' · E2 huge dt ' + d.E2 + ' (' + d.E2ms + ' ms) · E3 broken actor ' + d.E3n + ' + control ' + d.E3control + (d.E3ok ? '' : ' · bad: ' + d.E3.filter((r) => !r.ok).map((r) => r.nm + (r.walk ? '/walk' : '') + ' ' + JSON.stringify(r.draw)).join(', ')));
    }
  } else if (MODE === 'k3b') {
    const refS = JSON.parse(fs.readFileSync(path.join(REFJ, 'sheets.json'))), refC = JSON.parse(fs.readFileSync(path.join(REFJ, 'composed.json'))), refA = JSON.parse(fs.readFileSync(path.join(REFJ, 'anchors.json')));
    const ctx = await newCtx(b, 1), Cq = await openChar2(ctx, 160, 160, 1);
    const out = await Cq.p.evaluate(async ({ names }) => {
      const hex = async (u8) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u8))].map((x) => x.toString(16).padStart(2, '0')).join('');
      const sheets = {}, comp = {}, cv = document.createElement('canvas'); cv.width = cv.height = 160; const g = cv.getContext('2d');
      let refused = 0, maxTotal = 0;
      for (const n of names) {   // one colour set at a time, then trim (never 640 sets at once)
        const [hair, iris, skin, house] = n.split('/'), app = { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair, iris, skin } }, dc = { house, held: { id: 'lantern_L0', on: true, lit: true, power: 100 } };
        sheets[n] = {};
        for (const an of ['idle', 'walk', 'walkhold', 'stand8']) {
          const h = Char2.sheet(app, dc, an); if (!h) { refused++; sheets[n][an] = null; continue; }
          const c = h.canvas, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; h.release(); sheets[n][an] = await hex(d);
        }
        comp[n] = {};
        for (const d of ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']) for (const an of ['idle', 'walk']) {   // first frame after hold on: lantern at its target, power 100, scale 1, feet (80,120)
          const X = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(X, 0, { moving: an === 'walk', dir: d, holding: true });
          g.clearRect(0, 0, 160, 160); const ok = Char2.draw(g, app, dc, X, 80, 120, 1); comp[n][d + ':' + an] = ok ? await hex(g.getImageData(0, 0, 160, 160).data) : 'draw false';
        }
        maxTotal = Math.max(maxTotal, Char2.stats().total); Char2.trim();
      }
      // anchors on every frame of every anim / dir (4 states: idle, idle while holding, walk, walk while holding)
      const geo = {};
      for (const [st, an, mv, hold, n] of [['idle', 'idle', false, false, 4], ['idlehold', 'idle', false, true, 4], ['walk', 'walk', true, false, 6], ['walkhold', 'walkhold', true, true, 6]]) {
        geo[st] = {};
        for (const d of ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']) {
          geo[st][d] = { an, fr: [], box: [] };
          for (let k = 0; k < n; k++) {
            const X = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(X, 0, { moving: mv, dir: d, holding: hold });
            if (an === 'idle' && k === 3) { if (!['S', 'SE', 'E', 'W', 'SW'].includes(d)) { geo[st][d].fr.push(null); continue; } X.fi = 3; X.blinkNow = true; }   // idle f4 = the blink frame (back views never blink)
            else X.fi = k;   // idle loop [0,1,2,1]: fi 0..2 -> f1..f3
            geo[st][d].fr.push({ head_top: Char2.anchor(X, 'head_top'), body: Char2.anchor(X, 'body') }); geo[st][d].box.push(JSON.stringify(Char2.anchor(X, 'box')));
          }
        }
      }
      const X = Char2.actor(); Char2.tick(X, 0, {}); const label = Char2.anchor(X, 'label');
      return { sheets, comp, geo, label, refused, maxTotal, stats: Char2.stats() };
    }, { names: Object.keys(refS) });
    await ctx.close();
    let sOk = 0, sAll = 0, cOk = 0, cAll = 0, aOk = 0, aAll = 0; const sBad = [], cBad = [], aBad = [];
    for (const n of Object.keys(refS)) {
      for (const an of ['idle', 'walk', 'walkhold', 'stand8']) { sAll++; if (out.sheets[n][an] === refS[n][an]) sOk++; else if (sBad.length < 5) sBad.push(n + ' ' + an); }
      for (const k of Object.keys(refC[n])) { cAll++; if (out.comp[n][k] === refC[n][k]) cOk++; else if (cBad.length < 5) cBad.push(n + ' ' + k); }
    }
    for (const st of Object.keys(out.geo)) for (const d of DIRS) {
      const O = out.geo[st][d], G = refA.geometry[O.an][d];
      O.box.forEach((bx) => { aAll++; if (bx === JSON.stringify(G.box)) aOk++; else if (aBad.length < 5) aBad.push(st + ' ' + d + ' box ' + bx + ' vs ' + JSON.stringify(G.box)); });
      G.frames.forEach((f, k) => { if (!O.fr[k]) return; aAll++; if (JSON.stringify(O.fr[k]) === JSON.stringify(f)) aOk++; else if (aBad.length < 5) aBad.push(st + ' ' + d + ' f' + (k + 1) + ' ' + JSON.stringify(O.fr[k]) + ' vs ' + JSON.stringify(f)); });
    }
    aAll++; if (JSON.stringify(out.label) === JSON.stringify(refA.label)) aOk++; else aBad.push('label ' + JSON.stringify(out.label) + ' vs ' + JSON.stringify(refA.label));
    Object.assign(R, { sheets: sOk + '/' + sAll, composed: cOk + '/' + cAll, anchors: aOk + '/' + aAll, headTopVsJson: refA.head_top_equal_json + '/' + refA.head_top_frames,
      refused: out.refused, maxTotal: out.maxTotal, sBad, cBad, aBad, pageErrors: Cq.errs.length, stats: out.stats });
    const ok = sOk === sAll && cOk === cAll && aOk === aAll && !out.refused && !Cq.errs.length && refA.head_top_equal_json === refA.head_top_frames; if (!ok) fails++;
    console.log((ok ? 'PASS ' : 'FAIL ') + 'K3b sheets ' + R.sheets + ' · composed ' + R.composed + ' · anchors ' + R.anchors + ' · head_top vs JSON ' + R.headTopVsJson + ' · peak total ' + out.maxTotal
      + (sBad.length ? '\n  sheets: ' + sBad.join(', ') : '') + (cBad.length ? '\n  composed: ' + cBad.join(', ') : '') + (aBad.length ? '\n  anchors: ' + aBad.join(' | ') : ''));
  } else if (MODE === 'a12') {
    const ctx = await newCtx(b, 3), Cq = await openChar2(ctx, 600, 600, 3);
    const out = await Cq.p.evaluate(() => {
      const W = 600, H = 600, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }, res = [];
      const bg = (g) => { g.fillStyle = '#336699'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffcc00'; g.fillRect(0, 0, W, 210); }, px = (c) => c.getContext('2d').getImageData(0, 0, W, H).data;
      const diff = (a, b) => { let rgb = 0, al = 0; for (let i = 0; i < a.length; i += 4) { if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) rgb++; if (a[i + 3] !== b[i + 3]) al++; } return { rgb, al }; };
      const step = (a, b) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
      const one = (dir, an, alpha, clip, power) => {
        const dc = { house: 'wing', held: { id: 'lantern_L0', on: true, lit: true, power: power || 100 } };
        const X = Char2.actor({ rand: () => 0.5, blinkAt: 1e12 }); Char2.tick(X, 0, { moving: an === 'walk', dir, holding: true });
        const gp = Char2.anchor(X, 'grip'), cy = 400 - 94 * 3 + ((gp ? gp[1] : Char2.anchor(X, 'body')[1]) + 2) * 3;   // clip edge 2 art px under the hand: cuts the lantern ring and the fist
        const clipR = (g) => { g.beginPath(); g.rect(0, 0, W, cy); g.clip(); };
        const got = mk(), g = got.getContext('2d'); bg(g); g.save(); if (clip) clipR(g); g.globalAlpha = alpha; const ok = Char2.draw(g, APP, dc, X, 300, 400, 3); g.restore();
        // criterion: the same actor drawn at alpha 1, scale 1, on a clear canvas (= the composed image K3a / K3b check against the Pilot and Python),
        // then that canvas drawn ONCE at alpha, scaled x3 to the same place
        const T = document.createElement('canvas'); T.width = T.height = 256; Char2.draw(T.getContext('2d'), APP, dc, X, 128, 160, 1);
        const want = mk(), w = want.getContext('2d'); bg(w); w.save(); if (clip) clipR(w); w.imageSmoothingEnabled = false; w.globalAlpha = alpha; w.drawImage(T, 0, 0, 256, 256, 300 - 128 * 3, 400 - 160 * 3, 768, 768); w.restore();
        // report: the full-size alpha-1 drawing drawn 1:1 at alpha -> largest channel step (a second alpha on the overlap gives tens of levels)
        const T2 = mk(); Char2.draw(T2.getContext('2d'), APP, dc, X, 300, 400, 3);
        const w1 = mk(), v = w1.getContext('2d'); bg(v); v.save(); if (clip) clipR(v); v.globalAlpha = alpha; v.drawImage(T2, 0, 0); v.restore();
        const G = px(got), d = diff(G, px(want)); return ok ? { n: d.rgb + d.al, rgb: d.rgb, al: d.al, step1to1: step(G, px(w1)) } : { n: -1 };
      };
      const add = (k, a, d, an, clip, power) => res.push(Object.assign({ k, a, d, an }, one(d, an, a, clip, power)));
      for (const a of [0.5, 0.4, 0.35]) for (const d of ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']) for (const an of ['idle', 'walk']) add('main', a, d, an, false);
      for (const a of [0, 1]) for (const d of ['S', 'E', 'W']) add('alpha0/1', a, d, 'walk', false);
      for (const a of [0.35, 0.175, 0.0875]) for (const d of ['S', 'E', 'W']) add('afterimage', a, d, 'walk', false);   // ghost alpha by age
      for (const d of ['S', 'SE', 'E', 'W', 'SW']) for (const an of ['idle', 'walk']) add('clip', 0.5, d, an, true);
      for (const d of ['S', 'E']) add('power10', 0.5, d, 'idle', false, 10);
      return res;
    });
    await ctx.close();
    const main = out.filter((r) => r.k === 'main'), extra = out.filter((r) => r.k !== 'main');
    Object.assign(R, { main: main.filter((r) => r.n === 0).length + '/' + main.length, extra: extra.filter((r) => r.n === 0).length + '/' + extra.length,
      byKind: [...new Set(extra.map((r) => r.k))].map((k) => k + ' ' + extra.filter((r) => r.k === k && r.n === 0).length + '/' + extra.filter((r) => r.k === k).length),
      step1to1_max: Math.max(...out.map((r) => r.step1to1 || 0)), bad: out.filter((r) => r.n !== 0).slice(0, 8), pageErrors: Cq.errs.length });
    const ok = out.every((r) => r.n === 0) && !Cq.errs.length; if (!ok) fails++;
    console.log((ok ? 'PASS ' : 'FAIL ') + 'A12 main ' + R.main + ' · ' + R.byKind.join(' · ') + ' · vs 1:1 full-size blit: largest channel step ' + R.step1to1_max);
  }
  R.fails = fails; fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); await b.close(); process.exit(fails ? 1 : 0);
})();
