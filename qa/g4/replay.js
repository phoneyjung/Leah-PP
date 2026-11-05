// G4.0 replay harness, part 2: plays one fixed scenario on the game at BASE and writes 24 checkpoints to OUT
// (screenshot + state + y-sort draw log per checkpoint). Plan G4_0 §8.1 · used for the main→main proof (G4.0) and M1/M4/M5.
//   BASE=http://127.0.0.1:8780 OUT=/tmp/x node qa/g4/replay.js        (OUT must be outside the repo)
//   INJECT=pos@13 → the player is moved 1 px just before checkpoint 13 (the comparison must fail from 13 on)
//   INJECT=img@13 → 4 px painted on the game canvas (560,230: clear of the HUD) just before the screenshot of checkpoint 13 (pixels only)
//   ZOOM=1 / ZOOM=0.75 → the game's own zoom set before load (localStorage la-zoom) · unset = the game's default · SCEN=<file.json> → another scenario (M5 doors)
// A new browser context per run · timezone Asia/Bangkok · virtual clock from vclock.js · service workers blocked ·
// every host except 127.0.0.1/localhost blocked (Firebase, Google Fonts) · a synthetic save (never a real one).
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const vclock = require('./vclock.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8780', OUT = process.env.OUT;
if (!OUT) { console.error('OUT= is required (a folder outside the repo)'); process.exit(2); }
const INJ = /^(pos|img)@(\d+)$/.exec(process.env.INJECT || '') || null;
const ZOOM = process.env.ZOOM ? +process.env.ZOOM : null; // null = the game's default (a new player gets 75 % on entering capital, L2657)
// 16:59:00 in Bangkok on 6 Nov 2026 → 17:00 (day → dusk) is crossed at virtual 60 s
const EPOCH = Date.UTC(2026, 10, 6, 9, 59, 0), SEED = 20261106, FPS = 60;
const SAVE = { name: 'P', kid: 0, house: 1, age: 7 }; // girl, braids, house 1 (gold), age 7 → lantern in the dark
const DEFAULT_SCEN = [
  // game 2.33 new world: plaza/cave1 and the other old maps send the player to 'capital' (L3320 L4158) → capital, farm, cavemouth (dark)
  // [map, [checkpoint steps]] · a step: {s: seconds} idle, or {walk:[dx,dy] in tiles, s} · times are virtual
  ['capital', [{ s: .5 }, { s: 2 }, { walk: [3, 0], s: 1.5 }, { walk: [0, 3], s: 1.5 }, { s: 3.5 }, { walk: [-4, 0], s: 2 }, { s: 4 }, { walk: [0, -3], s: 2 }]],
  // farm: the spawn is the east gate back to capital, so the walk heads west first · the 32 s idle crosses 17:00 (day → dusk)
  ['farm', [{ s: .5 }, { walk: [-4, 0], s: 2 }, { walk: [0, 3], s: 2 }, { s: 5 }, { walk: [-3, 0], s: 2 }, { s: 32, phase: 1 }, { walk: [2, -2], s: 2 }, { s: 2 }]],
  ['cavemouth', [{ s: .5 }, { walk: [3, 0], s: 2 }, { walk: [0, 3], s: 2 }, { s: 5 }, { walk: [-3, 0], s: 2 }, { s: 45, backup: 1 }, { walk: [0, -2], s: 2 }, { s: 1 }]],
];
const SCEN = (() => { if (!process.env.SCEN) return DEFAULT_SCEN; const j = JSON.parse(fs.readFileSync(process.env.SCEN, 'utf8'));
  return Array.isArray(j) ? j : j.cases.map(c => [c.map, c.steps]); })(); // a plain list, or the M5 door file {cases:[{map, steps, …}]}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t0 = Date.now(), blocked = new Set(), pageErrors = [], consoleErr = [], requests = [];
  // pinned raster/compositing (G4.0: without these, 1–20 colour levels moved on DOM edges between two identical runs — layer and
  // raster-thread timing; with them 3/3 runs × 63 checkpoints were identical) · CHROME_ARGS=' ' turns them off
  const ARGS = (process.env.CHROME_ARGS || '--disable-gpu --disable-gpu-compositing --disable-lcd-text --disable-partial-raster --num-raster-threads=1 --run-all-compositor-stages-before-draw').split(' ').filter(Boolean);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ARGS });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
    timezoneId: 'Asia/Bangkok', locale: 'th-TH', serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); if (u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.protocol === 'data:' || u.protocol === 'blob:') return r.continue(); blocked.add(u.hostname); return r.abort(); });
  await ctx.addInitScript({ content: vclock({ epoch: EPOCH, seed: SEED }) });
  if (ZOOM !== null) await ctx.addInitScript({ content: `try{localStorage.setItem('la-zoom','${ZOOM}')}catch(e){}` });
  const page = await ctx.newPage();
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 160)); });
  page.on('request', q => requests.push(q.url().replace(BASE, '')));
  const ev = (f, a) => page.evaluate(f, a);
  const settle = async () => { const s = Date.now(); for (;;) { const p = await ev(() => __VC.pending()); if (!p) return; if (Date.now() - s > 30000) throw new Error('loads stuck: ' + JSON.stringify(await ev(() => __VC.pendingList()))); await sleep(10); } };
  const frames = async nf => { let left = nf; while (left > 0) { await settle(); left = (await ev(n => __VC.run(n), left)).left; } await settle(); };
  const sec = s => Math.round(s * FPS);

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await settle();
  const fontStatus = await ev(async () => { await document.fonts.ready; return document.fonts.status; });
  let bootFrames = 0;
  while (await ev(() => !!document.getElementById('load'))) { await frames(6); bootFrames += 6; if (bootFrames > 3600) throw new Error('loading screen never closed'); }
  await frames(6);
  // a synthetic save, the same boot as test_risk_monthly.js · then pin LITE / fpsChecks / eco (plan §8.1)
  await ev(sv => { const d = Store.all(); d.slots = [newSave(sv)]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {}
    LITE = false; fpsChecks = 6; S.eco = false; }, SAVE);
  await settle();
  const startV = await ev(() => __VC.now());

  const state = () => ev(() => {
    const hs = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(16) };
    const pk = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
    const msg = document.getElementById('msg');
    return { vnow: __VC.now(), frames: __VC.frames(), map: M && M.id, dark: DARK(), lkid: LKID(), phase: dayPhase(), phaseK: phaseK(),
      P: Object.assign(pk(P, ['x', 'y', 'row', 'moving', 'dist', 'cd', 'hurt', 'dizzy', 'atkAnim']), { path: P.path ? P.path.length : 0 }),
      cam: [camX, camY, SC, VW, VH], ZOOM, LITE, fpsChecks, eco: !!S.eco, PAUSE: !!PAUSE,
      S: pk(S, ['hp', 'lamp', 'lampLv', 'house', 'age', 'kid', 'coins', 'lv', 'exp']), Shash: hs(JSON.stringify(S)),
      msg: msg ? msg.textContent : null, timers: __VC.timers(), vcErrors: __VC.errors() };
  });

  const cps = [];
  let k = 0;
  for (const [mapId, steps] of SCEN) {
    if (k > 0 || (await ev(() => M && M.id)) !== mapId) { await ev(id => { goMap(id); P.path = P.act = null; }, mapId); await settle(); }
    for (const st of steps) {
      k++;
      // M5 door cases: {at:[tx,ty]} puts the kid on a tile centre first · {exit:'id'} walks to that exit of the current map
      if (st.at) await ev(([tx, ty]) => { P.x = tx * T + T / 2; P.y = ty * T + T / 2; P.path = P.act = null; }, st.at);
      // walking = the game's own tap-to-walk path (findPath, L1244); a straight line only when no path exists
      if (st.walk) await ev(([dx, dy]) => { const gx = P.x + dx * T, gy = P.y + dy * T; P.path = findPath(M, P.x, P.y, gx, gy) || [[gx, gy]]; }, st.walk);
      if (st.exit) await ev(id => { const e = M.exits.find(q => q.id === id); if (!e) throw new Error('no exit ' + id + ' in ' + M.id); P.path = findPath(M, P.x, P.y, e.x, e.y) || [[e.x, e.y]]; }, st.exit);
      await frames(sec(st.s) - 1);
      if (INJ && +INJ[2] === k && INJ[1] === 'pos') await ev(() => { P.x += 1; });
      await settle();
      const rec = await ev(() => __VC.recFrame());
      await settle();
      const s = await state();
      if (INJ && +INJ[2] === k && INJ[1] === 'img') await ev(() => { const c = document.getElementById('c').getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ff00ff'; c.fillRect(560, 230, 2, 2); c.restore(); });
      const nn = String(k).padStart(2, '0');
      if (process.env.SHOT_WAIT) await sleep(+process.env.SHOT_WAIT);
      await page.screenshot({ path: path.join(OUT, `cp${nn}.png`), animations: 'disabled' });
      fs.writeFileSync(path.join(OUT, `cp${nn}.draw.txt`), rec.log.join('\n'));
      const cp = { k, map: mapId, step: st, draw: { n: rec.n, hash: rec.hash }, state: s };
      fs.writeFileSync(path.join(OUT, `cp${nn}.json`), JSON.stringify(cp, null, 1));
      cps.push(cp);
      // the pins hold at every checkpoint (plan §8.1)
      if (s.LITE !== false || s.fpsChecks !== 6 || s.eco !== false) throw new Error('pin lost at cp' + k + ' ' + JSON.stringify([s.LITE, s.fpsChecks, s.eco]));
    }
  }
  const run = { base: BASE, args: ARGS, inject: process.env.INJECT || null, zoom: ZOOM, epoch: EPOCH, seed: SEED, save: SAVE, fontStatus, bootFrames, startV,
    endV: await ev(() => __VC.now()), frames: await ev(() => __VC.frames()), checkpoints: cps.length, blocked: [...blocked].sort(),
    pageErrors, consoleErrors: consoleErr.slice(0, 20), requests: requests.length, chromium: browser.version(), ms: Date.now() - t0 };
  fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(run, null, 1));
  console.log(JSON.stringify({ checkpoints: cps.length, startV, endV: run.endV, frames: run.frames, pageErrors: pageErrors.length, blocked: run.blocked, ms: run.ms }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
