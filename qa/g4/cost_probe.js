// G4.2 cost probe (Codex T40-N3: "find what loads the cave mouth"): what the flag-on player costs per frame, measured INSIDE one page,
// the same scene and the same state, old way vs Char2 way, so the machine's drift (the FPS gate's noise) cannot enter.
// Not a gate yet (M6 stays the gate until the owner decides) — it is the explanation beside it. 844×390 DPR 3 (as fps.js) · CPU throttled (CPU, default 4×).
// Proposed M6b (owner to decide · T40-N3): per scene, the player's extra cost (body + shadow, on − off) ≤ LIMIT (0.10) × the old frame time
// (= the FPS drop ≤ ~10 % of the master plan) → exit 0 · over → exit 1 · errors / not ready → exit 2.
// INJECT_MS=3: every Char2.draw first burns 3 ms (wall clock) → the probe must see it (proof that it reacts; never in a real measurement).
//   whole: render(…) of a full frame, N frames per block, each frame followed by a 1-px getImageData (the canvas must raster before the
//          next frame starts) · blocks alternate on/off (on-off, off-on, …) · paired difference per pair of blocks → median + all pairs
//   body:  drawPlayer(…) alone, N×20 calls per block, a 1-px getImageData every 20 calls · old body vs Char2 body (+ lantern when held)
//   shadow: the shadow pass alone — old = the blurred, skewed shadow sheet (the game's own call, recorded once and replayed),
//          new = c234Shadow() (the ellipse) · same block scheme
//   "off" = the same page with C234.A taken away for the block (c234Use() false → every helper gives the old value), then put back.
// The kid stands still (the game loop is paused during the blocks; render still draws every call).
//   PORT=8791 CHROME_EXE=… node qa/g4/cost_probe.js OUT.json      (MAPS=cavemouth,capital,farm · N=15 · BL=30 · CPU=4)
'use strict';
const fs = require('fs'), puppeteer = require('puppeteer');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = 'http://localhost:' + (process.env.PORT || 8791) + '/';
const MAPS = (process.env.MAPS || 'cavemouth,capital,farm').split(','), N = +(process.env.N || 15), BL = +(process.env.BL || 30), CPU = +(process.env.CPU || 4);
const LIMIT = +(process.env.LIMIT || 0.10), INJ = +(process.env.INJECT_MS || 0);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  const out = { browser: await b.version(), N, BL, CPU, LIMIT, INJECT_MS: INJ, maps: {} };
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
    const r = await p.evaluate(async (N, BL) => {
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; }, r3 = (x) => Math.round(x * 1000) / 1000;
      const keepA = C234.A, flush = () => ctx.getImageData(0, 0, 1, 1), wait = () => new Promise((res) => setTimeout(res, 30));
      // the real arguments of render and drawPlayer, and the old shadow call (image, source rect, transform, alpha), from live frames
      let RA = null, PA = null, SH = null;
      { const orr = render, odp = drawPlayer; render = function () { RA = [...arguments]; return orr.apply(this, arguments); }; drawPlayer = function () { PA = [...arguments]; return odp.apply(this, arguments); };
        await new Promise((res) => setTimeout(res, 300)); render = orr; drawPlayer = odp; }
      { const odi = ctx.drawImage; C234.A = null; ctx.drawImage = function (im) { if (!SH && (im === PS.shW || im === PS.shS)) SH = { im, a: [...arguments].slice(1), m: ctx.getTransform(), al: ctx.globalAlpha }; return odi.apply(this, arguments); };
        render(...RA); flush(); ctx.drawImage = odi; C234.A = keepA; }
      let shadowM = null; { const os = c234Shadow; c234Shadow = function () { if (!shadowM) shadowM = { m: ctx.getTransform(), al: ctx.globalAlpha }; return os.apply(this, arguments); }; render(...RA); flush(); c234Shadow = os; }
      PAUSE = true;
      const W = { on: [], off: [], d: [] }, B = { on: [], off: [], d: [] }, Sh = { on: [], off: [], d: [] };
      const block = (mode, fn, n) => { C234.A = mode === 'on' ? keepA : null; const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); } flush(); const dt = (performance.now() - t0) / n; C234.A = keepA; return dt; };
      const whole = () => { render(...RA); flush(); };
      const body = (i) => { ctx.save(); try { drawPlayer(...PA); } finally { ctx.restore(); } if (i % 20 === 19) flush(); };
      const shOld = (i) => { if (!SH) return; ctx.save(); ctx.setTransform(SH.m); ctx.globalAlpha = SH.al; ctx.drawImage(SH.im, ...SH.a); ctx.restore(); if (i % 20 === 19) flush(); };
      const shNew = (i) => { if (!shadowM) return; ctx.save(); ctx.setTransform(shadowM.m); ctx.globalAlpha = shadowM.al; c234Shadow(); ctx.restore(); if (i % 20 === 19) flush(); };
      for (let k = 0; k < BL; k++) {
        const ord = k % 2 ? ['off', 'on'] : ['on', 'off'], w = {}, bb = {}, s = {};
        for (const m of ord) { w[m] = block(m, whole, N); await wait(); }
        for (const m of ord) { bb[m] = block(m, body, N * 20); await wait(); }
        for (const m of ord) { s[m] = m === 'on' ? block('on', shNew, N * 20) : block('off', shOld, N * 20); await wait(); }
        for (const [X, v] of [[W, w], [B, bb], [Sh, s]]) { X.on.push(r3(v.on)); X.off.push(r3(v.off)); X.d.push(r3(v.on - v.off)); }
      }
      PAUSE = false;
      const sum = (X) => ({ on: med(X.on), off: med(X.off), diff: med(X.d), diffs: X.d });
      const body1 = sum(B), sh1 = sum(Sh);
      return { map: M.id, bright: !!M.bright, held: !!c234DC().held, SC, canvas: [document.getElementById('c').width, document.getElementById('c').height], oldShadow: SH ? { w: SH.a[2], h: SH.a[3], alpha: SH.al } : null, n: Object.assign({}, C234.n), st: C234.st,
        whole: sum(W), body: body1, shadow: sh1, playerDiff: r3(body1.diff + sh1.diff), frameMs: med(W.off), playerShare: r3((body1.diff + sh1.diff) / med(W.off)) };
    }, N, BL);
    r.pe = pe; r.m6b = r.playerShare <= LIMIT ? 'pass' : 'fail'; out.maps[map] = r;
    console.log(JSON.stringify({ map, held: r.held, frameMs: r.frameMs, whole: [r.whole.on, r.whole.off, r.whole.diff], body: [r.body.on, r.body.off, r.body.diff], shadow: [r.shadow.on, r.shadow.off, r.shadow.diff], playerDiff: r.playerDiff, share: r.playerShare, m6b: r.m6b, pe: pe.length, st: r.st }));
    await bc.close();
  }
  await b.close();
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  const bad = Object.values(out.maps).some((m) => m.error || (m.pe && m.pe.length) || m.st !== 'ready'), over = Object.values(out.maps).some((m) => m.m6b !== 'pass');
  out.verdict = bad ? 'errors' : over ? 'fail' : 'pass'; if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ verdict: out.verdict, LIMIT, INJECT_MS: INJ })); process.exit(bad ? 2 : over ? 1 : 0);
})();
