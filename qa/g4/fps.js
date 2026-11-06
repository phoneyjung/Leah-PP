// G4 M6 (plan G4_0 §8 M6): frames per second in the real game, 3 fixed scenes, method A5 of G2.6:
// 844×390 DPR 3 · CPU 4× · warm 5 s · measure 30 s · 3 rounds · the order of the targets alternates every round · median.
// Real time (no virtual clock) · LITE=false, eco=false, fpsChecks=6 pinned after the save is chosen and checked after every run ·
// a synthetic save · no other players (every host except 127.0.0.1 blocked) · the kid walks back and forth on the game's own path (findPath).
// Every run also counts drawImage calls on the game canvas per frame and the distance walked, so an empty or frozen screen cannot pass.
//   TARGETS='[{"label":"main","url":"http://127.0.0.1:8780"}]' node qa/g4/fps.js OUT.json [measure_s]
//   a target may carry "patch" (fields merged into the synthetic save, e.g. {"char2On":true}) and "inject":
//   "SLOW" (8 ms of busy work before every frame) or "EMPTY" (drawImage on the game canvas does nothing) → used to prove the gate fails.
// Gate (G4.2+, v2 after Codex T34): reference = target[0] (main), candidate = the last target (the branch). CONTROL=1 adds a second copy of
// main as a control (3 targets). Per scene: ratio = the MEDIAN OF THE PAIRED RATIOS candidate ÷ reference measured in the same round
// (pairs sit next to each other in time, so a slow spell of the machine hits both; G4.0 saw absolute FPS drift 20–30 % in 15 min);
// ratioOfMedians is reported beside it. verdict: fail = ratio < 0.90, or draws/frame < 0.8 × reference, or walked 0, or a pin/map lost ·
// undecided = 0.90 ≤ ratio < 0.95, or the control is off by more than ±5 % → rerun with ROUNDS=5 and report every set; still undecided
// after 5 rounds = "cannot decide" (never pick the better set) · pass otherwise. Exit 0 pass · 1 fail · 3 undecided.
// The draw count proves the screen is drawn at all, not that the kid is: the M3 player-draw counter is used beside it.
// SLOW wraps every rAF callback (the measuring one too): it proves the gate reacts to slowness, it is not a model of an 8 ms renderer.
'use strict';
const fs = require('fs'), { chromium } = require('playwright');
const TARGETS = JSON.parse(process.env.TARGETS || '[{"label":"main","url":"http://127.0.0.1:8780"}]');
if (process.env.CONTROL === '1' && TARGETS.length === 2) TARGETS.splice(1, 0, Object.assign({}, TARGETS[0], { label: TARGETS[0].label + '-control' }));
const OUTF = process.argv[2], MEAS = +(process.argv[3] || 30), WARM = +(process.env.WARM || 5), ROUNDS = +(process.env.ROUNDS || 3);
const SCENES = require('./m6-scenes.json');
const SAVE = { name: 'P', kid: 0, house: 1, age: 7 };
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const COUNT = () => { window.__draws = 0; const DI = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...a) { if (this.canvas && this.canvas.id === 'c') window.__draws++; return DI.apply(this, a); }; };
const INJ = {
  SLOW: () => { const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => r(t => { const e = performance.now() + 8; while (performance.now() < e); f(t); }); },
  EMPTY: () => { const DI = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (...a) { if (this.canvas && this.canvas.id === 'c') return; return DI.apply(this, a); }; },
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined });
  const runs = [], errs = [];
  for (let rnd = 0; rnd < ROUNDS; rnd++) for (const sc of SCENES) {
    const order = rnd % 2 ? [...TARGETS].reverse() : TARGETS;
    for (const tg of order) {
      const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: 'Asia/Bangkok', locale: 'th-TH', serviceWorkers: 'block' });
      await ctx.route('**/*', r => { const u = new URL(r.request().url()); return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') ? r.continue() : r.abort(); });
      await ctx.addInitScript(COUNT); if (tg.inject) await ctx.addInitScript(INJ[tg.inject]);
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tg.label + ': ' + String(e.message).slice(0, 160)));
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await p.goto(tg.url + '/', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), null, { timeout: 90000 }); await p.waitForTimeout(800);
      await p.evaluate(([sv, patch, sc]) => { const d = Store.all(); d.slots = [Object.assign(newSave(sv), patch || {})]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
        document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {}
        goMap(sc.map); P.path = P.act = null; if (sc.at) { P.x = sc.at[0] * T + T / 2; P.y = sc.at[1] * T + T / 2; }
        LITE = false; fpsChecks = 6; S.eco = false;
        const a = [P.x, P.y], bb = [P.x + sc.go[0] * T, P.y + sc.go[1] * T]; let k = 0;
        window.__walk = 0; let lx = P.x, ly = P.y;
        window.__wk = setInterval(() => { if (!P.path || !P.path.length) { k ^= 1; const g = k ? bb : a; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [[g[0], g[1]]]; }
          window.__walk += Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y; }, 100); }, [SAVE, tg.patch, sc]);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.waitForTimeout(WARM * 1000);
      const m = await p.evaluate(ms => new Promise(r => { let n = 0, last = 0; const iv = [], d0 = window.__draws, w0 = window.__walk, t0 = performance.now();
        const f = t => { if (last) iv.push(t - last); last = t; n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else { iv.sort((x, y) => x - y);
          r({ fps: n / ((performance.now() - t0) / 1000), p95: iv[Math.floor(iv.length * .95)] || 0, frames: n, draws: window.__draws - d0, walked: window.__walk - w0,
            map: M && M.id, dark: DARK(), held: !!(DARK() && LKID()), LITE, eco: !!S.eco, fpsChecks }); } }; requestAnimationFrame(f); }), MEAS * 1000);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      m.drawsPerFrame = +(m.draws / Math.max(1, m.frames)).toFixed(1); m.fps = +m.fps.toFixed(2); m.p95 = +m.p95.toFixed(1); m.walked = Math.round(m.walked);
      runs.push(Object.assign({ round: rnd + 1, scene: sc.id, target: tg.label }, m));
      console.log('round', rnd + 1, sc.id, tg.label, m.fps, 'fps p95', m.p95, 'draws/frame', m.drawsPerFrame, 'walked', m.walked, m.map, m.LITE, m.eco);
      await ctx.close();
    }
  }
  await b.close();
  const R = { method: 'A5 · 844x390 DPR3 · CPU 4x · warm ' + WARM + ' s · ' + MEAS + ' s x ' + ROUNDS + ' · order alternates', targets: TARGETS, scenes: SCENES, runs, errors: errs, summary: {} };
  for (const sc of SCENES) { const row = R.summary[sc.id] = {};
    for (const tg of TARGETS) { const rs = runs.filter(r => r.scene === sc.id && r.target === tg.label);
      row[tg.label] = { fps: med(rs.map(r => r.fps)), p95: med(rs.map(r => r.p95)), drawsPerFrame: med(rs.map(r => r.drawsPerFrame)), walked: med(rs.map(r => r.walked)),
        pins: rs.every(r => r.LITE === false && r.eco === false && r.fpsChecks === 6), mapOk: rs.every(r => r.map === sc.map), heldOk: rs.every(r => r.held === !!sc.dark) }; }
    if (TARGETS.length > 1) {
      const ref = TARGETS[0].label, cand = TARGETS[TARGETS.length - 1].label, ctl = TARGETS.length > 2 ? TARGETS[1].label : null;
      const fpsOf = (lab, rd) => (runs.find(r => r.scene === sc.id && r.target === lab && r.round === rd) || {}).fps;
      const paired = lab => [...Array(ROUNDS).keys()].map(i => fpsOf(lab, i + 1) / fpsOf(ref, i + 1)).filter(x => isFinite(x)).map(x => +x.toFixed(3));
      const a = row[ref], c = row[cand];
      row.pairedRatios = paired(cand); row.ratio = med(row.pairedRatios); row.ratioOfMedians = +(c.fps / a.fps).toFixed(3);
      if (ctl) { row.controlPairedRatios = paired(ctl); row.controlRatio = med(row.controlPairedRatios); }
      const hardFail = row.ratio < 0.9 || c.drawsPerFrame < 0.8 * a.drawsPerFrame || !(c.walked > 0) || !c.pins || !c.mapOk;
      const shaky = (row.ratio < 0.95) || (ctl && Math.abs(row.controlRatio - 1) > 0.05);
      row.verdict = hardFail ? 'fail' : shaky ? (ROUNDS >= 5 ? 'cannot decide (after ' + ROUNDS + ' rounds)' : 'undecided: rerun with ROUNDS=5') : 'pass';
      row.gate = row.verdict === 'pass'; } }
  const baseOk = errs.length === 0 && Object.values(R.summary).every(r => Object.values(r).every(v => typeof v !== 'object' || Array.isArray(v) || (v.pins && v.mapOk && v.heldOk && v.walked > 0)));
  const verdicts = Object.values(R.summary).map(r => r.verdict).filter(Boolean);
  R.verdict = !baseOk || verdicts.includes('fail') ? 'fail' : verdicts.some(v => v !== 'pass') ? 'undecided' : 'pass';
  R.pass = R.verdict === 'pass';
  console.log(JSON.stringify({ summary: R.summary, verdict: R.verdict, errors: errs.length }));
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(R, null, 1));
  process.exit(R.verdict === 'pass' ? 0 : R.verdict === 'fail' ? 1 : 3);
})().catch(e => { console.error(e); process.exit(2); });
