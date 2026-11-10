// G4.2 cost probe — the M6 gate for G4.2–G4.5 (owner D-G4-7, 10 Nov 2026 = a+c · plan 1.3): what the flag-on player costs per frame,
// measured INSIDE one page, the same scene and the same state, old way vs Char2 way, blocks alternating — this keeps most of the machine's
// drift (the noise that made the FPS ratio of fps.js unable to decide) out of the difference; it does not prove that no drift enters at all.
// Gate: per scene, the player's extra cost (body + shadow + tick, on − off) ≤ LIMIT (0.10) × the old frame time (= the FPS drop ≤ ~10 % of
// the master plan) → exit 0 · over → exit 1 · errors / not ready / a replay that is not faithful → exit 2. fps.js still runs every step as a
// report + its hard checks; the owner's real phone is measured once before G4.6 (this probe never stands in for it).
// 844×390 DPR 3 (as fps.js) · CPU throttled (CPU, default 4×).
//   whole: render(…) of a full frame, N frames per block, each frame followed by a 1-px getImageData (the canvas must raster before the
//          next frame starts) · blocks alternate on/off (on-off, off-on, …) · paired difference per pair of blocks → median + all pairs
//   body:  drawPlayer(…) alone, N×20 calls per block, a 1-px getImageData every 20 calls · old body vs Char2 body (+ lantern when held)
//   shadow: the shadow pass alone — old = the blurred, skewed shadow sheet (the game's own call, recorded once and replayed),
//          new = c234Shadow() (the ellipse) · same block scheme
//   tick:  the work 2.38 adds to every update step (c234Use + Char2.tick, walking) · off = c234Use() alone (false)
//   "off" = the same page with C234.A taken away for the block (c234Use() false → every helper gives the old value), then put back.
// v2 (Codex T41-N1): the shadow replays carry the WHOLE canvas state of the real call (transform · globalAlpha · globalCompositeOperation ·
//   imageSmoothingEnabled/Quality · filter · shadow*) — the old sheet is drawn with multiply + smoothing on, the ellipse inside the same save —
//   and each replay is proved byte-identical to the real call: the pixels under it are saved before the real call and read after it; the
//   replay puts the same "before" back, draws, and must give the same "after" (0 differing bytes) and the same state, else exit 2.
// INJECT_MS=3: every Char2.draw first burns 3 ms (wall clock) → the probe must MEASURE it (proof that it reacts; never in a real measurement):
//   exit 0 = seen in every scene (playerDiff ≥ 0.8 × INJECT_MS) · 1 = missed · the 10 % verdict is not used then (3 ms is under 10 % of a
//   frame longer than 30 ms, which is the gate working, not the probe failing — Codex T41 §4).
// Known limits (Codex T41 §4 · T42-N1): the kid does not walk in the world (the loop is paused during the blocks; render still draws every
//   call) — the tick part walks the actor (idle → walk frames), but not every pose, turn or route, nor touch-to-screen delay; cache misses,
//   batching differences (forced 1-px readbacks) and GPU/compositor time outside the canvas raster are not in it; "off" is the same build
//   without C234.A, not main (M1 = 0 px); the replay check covers the W3 calls as they are now (no clip/filter/shadow blur — re-check if added).
// DROP_STATE=globalCompositeOperation,imageSmoothingEnabled: replays WITHOUT those (the v1 mistake) → the replay check must fail (exit 2).
//   PORT=8791 CHROME_EXE=… node qa/g4/cost_probe.js OUT.json      (MAPS=cavemouth,capital,farm · N=15 · BL=30 · CPU=4)
'use strict';
const fs = require('fs'), puppeteer = require('puppeteer');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = 'http://localhost:' + (process.env.PORT || 8791) + '/';
const MAPS = (process.env.MAPS || 'cavemouth,capital,farm').split(','), N = +(process.env.N || 15), BL = +(process.env.BL || 30), CPU = +(process.env.CPU || 4);
const LIMIT = +(process.env.LIMIT || 0.10), INJ = +(process.env.INJECT_MS || 0), DROP = (process.env.DROP_STATE || '').split(',').filter(Boolean);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  const out = { probe: 'cost_probe v2', browser: await b.version(), N, BL, CPU, LIMIT, INJECT_MS: INJ, DROP_STATE: DROP, maps: {} };
  for (const map of MAPS) {
    const bc = await b.createBrowserContext(), p = await bc.newPage(), pe = []; p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
    await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); await p.setBypassServiceWorker(true);
    await p.setRequestInterception(true); p.on('request', (r) => { const u = new URL(r.url()); return (u.hostname === 'localhost' || u.hostname === '127.0.0.1') ? r.continue() : r.abort(); });
    await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
    await p.evaluate((map) => { const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'P', kid: 0, house: 1, age: 7 }), { char2On: true })]; d.cur = 0; Store.put(d);
      S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
      goMap(map); LITE = false; S.eco = false; fpsChecks = 6; PAUSE = false; }, map);
    const ready = await p.waitForFunction(() => C234.st === 'ready', { timeout: 25000 }).then(() => true, () => false); await sleep(1500);
    if (!ready) { out.maps[map] = { error: 'C234 not ready: ' + (await p.evaluate(() => C234.st + ' ' + C234.why)) }; await bc.close(); continue; }
    if (INJ > 0) await p.evaluate((ms) => { const C = window.Char2; window.Char2 = Object.assign({}, C, { draw(...a) { const e = performance.now() + ms; while (performance.now() < e); return C.draw(...a); } }); }, INJ);
    const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const r = await p.evaluate(async (N, BL, DROP) => {
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; }, r3 = (x) => Math.round(x * 1000) / 1000;
      const keepA = C234.A, flush = () => ctx.getImageData(0, 0, 1, 1), wait = () => new Promise((res) => setTimeout(res, 30)), W0 = ctx.canvas.width, H0 = ctx.canvas.height;
      // the whole 2D state a draw call depends on (no clip is set around either shadow: index.html W3 block = save · smoothing · multiply)
      const KEYS = ['globalAlpha', 'globalCompositeOperation', 'imageSmoothingEnabled', 'imageSmoothingQuality', 'filter', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY'];
      const snap = () => { const s = { m: ctx.getTransform() }; for (const k of KEYS) s[k] = ctx[k]; return s; };
      const apply = (s) => { ctx.setTransform(s.m); for (const k of KEYS) if (!DROP.includes(k)) ctx[k] = s[k]; };
      const same = (s) => { const m = ctx.getTransform(), bad = []; for (const k of ['a', 'b', 'c', 'd', 'e', 'f']) if (m[k] !== s.m[k]) bad.push('m.' + k); for (const k of KEYS) if (ctx[k] !== s[k]) bad.push(k); return bad; };
      const box = (m, x, y, w, h) => { const P = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([u, v]) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f]);
        const x0 = Math.max(0, Math.floor(Math.min(...P.map((q) => q[0]))) - 2), y0 = Math.max(0, Math.floor(Math.min(...P.map((q) => q[1]))) - 2);
        const x1 = Math.min(W0, Math.ceil(Math.max(...P.map((q) => q[0]))) + 2), y1 = Math.min(H0, Math.ceil(Math.max(...P.map((q) => q[1]))) + 2); return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }; };
      const grab = (bb) => ctx.getImageData(bb.x, bb.y, bb.w, bb.h);
      const diffBytes = (A, B) => { let n = 0; for (let i = 0; i < A.data.length; i++) if (A.data[i] !== B.data[i]) n++; return n; };
      // the real arguments of render and drawPlayer, from live frames
      let RA = null, PA = null, SH = null, NS = null;
      { const orr = render, odp = drawPlayer; render = function () { RA = [...arguments]; return orr.apply(this, arguments); }; drawPlayer = function () { PA = [...arguments]; return odp.apply(this, arguments); };
        await new Promise((res) => setTimeout(res, 300)); render = orr; drawPlayer = odp; }
      // the old shadow call of a real frame (flag taken away): image, 8 numbers, the whole state, the pixels under it before and after
      { const odi = ctx.drawImage; C234.A = null;
        ctx.drawImage = function (im) { if (!SH && (im === PS.shW || im === PS.shS) && arguments.length === 9) { const a = [...arguments].slice(1), st = snap(), bb = box(st.m, a[4], a[5], a[6], a[7]), before = grab(bb);
            const res = odi.apply(this, arguments); SH = { im, a, st, bb, before, after: grab(bb) }; return res; } return odi.apply(this, arguments); };
        render(...RA); flush(); ctx.drawImage = odi; C234.A = keepA; }
      // the ellipse of a real frame (flag on): the state when c234Shadow is called (inside the same save), the pixels under the ellipse
      { const os = c234Shadow; c234Shadow = function () { if (NS) return os.apply(this, arguments); const st = snap(), ro = C234.pack.render_offset[C234.A.dir] || 0, cx = Math.round(P.x - camX) + ro, cy = Math.round(P.y - camY);
          const bb = box(st.m, cx - 16, cy - 5, 32, 10), before = grab(bb), res = os.apply(this, arguments); NS = { st, bb, before, after: grab(bb), drew: res }; return res; };
        render(...RA); flush(); c234Shadow = os; }
      // faithful replay check: same "before" pixels back, replay with the recorded state, compare the "after" pixels and the state at the call
      const check = { old: null, new: null };
      if (SH) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.putImageData(SH.before, SH.bb.x, SH.bb.y); ctx.restore(); ctx.save(); apply(SH.st); const bad = same(SH.st); ctx.drawImage(SH.im, ...SH.a); ctx.restore();
        const got = grab(SH.bb); check.old = { box: SH.bb, stateBad: bad, bytesDiff: diffBytes(got, SH.after), bytes: got.data.length, changedByReal: diffBytes(SH.before, SH.after), gco: SH.st.globalCompositeOperation, smoothing: SH.st.imageSmoothingEnabled, alpha: SH.st.globalAlpha }; }
      if (NS && NS.drew) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.putImageData(NS.before, NS.bb.x, NS.bb.y); ctx.restore(); ctx.save(); apply(NS.st); const bad = same(NS.st); c234Shadow(); ctx.restore();
        const got = grab(NS.bb); check.new = { box: NS.bb, stateBad: bad, bytesDiff: diffBytes(got, NS.after), bytes: got.data.length, changedByReal: diffBytes(NS.before, NS.after), gco: NS.st.globalCompositeOperation, smoothing: NS.st.imageSmoothingEnabled, alpha: NS.st.globalAlpha }; }
      const faithful = (!SH || (check.old.stateBad.length === 0 && check.old.bytesDiff === 0 && check.old.changedByReal > 0)) && (!NS || !NS.drew || (check.new.stateBad.length === 0 && check.new.bytesDiff === 0 && check.new.changedByReal > 0));
      PAUSE = true;
      const W = { on: [], off: [], d: [] }, B = { on: [], off: [], d: [] }, Sh = { on: [], off: [], d: [] }, Tk = { on: [], off: [], d: [] };
      const block = (mode, fn, n) => { C234.A = mode === 'on' ? keepA : null; const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); } flush(); const dt = (performance.now() - t0) / n; C234.A = keepA; return dt; };
      const whole = () => { render(...RA); flush(); };
      const body = (i) => { ctx.save(); try { drawPlayer(...PA); } finally { ctx.restore(); } if (i % 20 === 19) flush(); };
      const shOld = (i) => { if (!SH) return; ctx.save(); apply(SH.st); ctx.drawImage(SH.im, ...SH.a); ctx.restore(); if (i % 20 === 19) flush(); };
      const shNew = (i) => { if (!NS || !NS.drew) return; ctx.save(); apply(NS.st); c234Shadow(); ctx.restore(); if (i % 20 === 19) flush(); };
      const dirs = C234.pack.dirs, hold = c234Hold();
      const tick = (i) => { if (c234Use()) Char2.tick(C234.A, 1000 / 60, { dir: dirs[P.row], moving: true, holding: hold }); };
      for (let k = 0; k < BL; k++) {
        const ord = k % 2 ? ['off', 'on'] : ['on', 'off'], w = {}, bb = {}, s = {}, t = {};
        for (const m of ord) { w[m] = block(m, whole, N); await wait(); }
        for (const m of ord) { bb[m] = block(m, body, N * 20); await wait(); }
        for (const m of ord) { s[m] = m === 'on' ? block('on', shNew, N * 20) : block('off', shOld, N * 20); await wait(); }
        for (const m of ord) { t[m] = block(m, tick, N * 20); await wait(); }
        for (const [X, v] of [[W, w], [B, bb], [Sh, s], [Tk, t]]) { X.on.push(r3(v.on)); X.off.push(r3(v.off)); X.d.push(r3(v.on - v.off)); }
      }
      PAUSE = false;
      const sum = (X) => ({ on: med(X.on), off: med(X.off), diff: med(X.d), diffs: X.d });
      const body1 = sum(B), sh1 = sum(Sh), tk1 = sum(Tk), pd = body1.diff + sh1.diff + tk1.diff;
      return { map: M.id, bright: !!M.bright, held: !!c234DC().held, SC, canvas: [W0, H0], oldShadow: SH ? { w: SH.a[6], h: SH.a[7] } : null, check, faithful, n: Object.assign({}, C234.n), st: C234.st,
        whole: sum(W), body: body1, shadow: sh1, tick: tk1, playerDiff: r3(pd), frameMs: med(W.off), playerShare: r3(pd / med(W.off)) };
    }, N, BL, DROP);
    r.pe = pe;
    r.m6b = INJ > 0 ? (r.playerDiff >= 0.8 * INJ ? 'inject seen' : 'inject missed') : (r.playerShare <= LIMIT ? 'pass' : 'fail');
    out.maps[map] = r;
    console.log(JSON.stringify({ map, held: r.held, frameMs: r.frameMs, whole: [r.whole.on, r.whole.off, r.whole.diff], body: [r.body.on, r.body.off, r.body.diff], shadow: [r.shadow.on, r.shadow.off, r.shadow.diff], tick: [r.tick.on, r.tick.off, r.tick.diff],
      playerDiff: r.playerDiff, share: r.playerShare, m6b: r.m6b, faithful: r.faithful, oldReplay: r.check.old && [r.check.old.gco, r.check.old.smoothing, r.check.old.alpha, r.check.old.bytesDiff, r.check.old.changedByReal, r.check.old.stateBad.length],
      newReplay: r.check.new && [r.check.new.gco, r.check.new.bytesDiff, r.check.new.changedByReal, r.check.new.stateBad.length], pe: pe.length, st: r.st }));
    await bc.close();
  }
  await b.close();
  const maps = Object.values(out.maps), bad = maps.some((m) => m.error || (m.pe && m.pe.length) || m.st !== 'ready' || !m.faithful);
  const over = INJ > 0 ? maps.some((m) => m.m6b !== 'inject seen') : maps.some((m) => m.m6b !== 'pass');
  out.verdict = bad ? 'errors' : INJ > 0 ? (over ? 'inject missed' : 'inject seen') : over ? 'fail' : 'pass'; if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ verdict: out.verdict, LIMIT, INJECT_MS: INJ })); process.exit(bad ? 2 : over ? 1 : 0);
})();
