// G4.0 replay harness, part 2 (v2 after Codex T34): plays one fixed scenario on the game at BASE and writes every checkpoint to OUT:
// the screenshot (cpNN.png) · the game canvas itself, read before the HUD covers it (cpNN.canvas.png) · the state (cpNN.json) ·
// the drawImage log of one frame (cpNN.draw.txt, order = y-sort, arguments + full transform = positions). Plan G4_0 §8.1 · M1/M4/M5.
//   BASE=http://127.0.0.1:8780 OUT=/tmp/x node qa/g4/replay.js        (OUT must be outside the repo)
//   INJECT=pos@13 → the player is moved 1 px just before checkpoint 13 (the comparison must fail from 13 on)
//   INJECT=img@13 → 4 px painted on the game canvas at (560,230), clear of the HUD (screenshot and canvas must both differ)
//   INJECT=hud@13 → 4 px painted on the game canvas at (100,100), UNDER the HUD (the screenshot cannot see it; the canvas file must)
//   ZOOM=1 / ZOOM=0.75 → the game's own zoom set before load (localStorage la-zoom) · unset = the game's default
//   SCEN=<file.json> → another scenario: a plain list [[map, steps], …] or {intro?, cases:[{map, steps, stay?}, …]} (M5 doors, intro)
// A step: {s} idle seconds (virtual) · {at:[tx,ty]} put the kid on a tile centre · {walk:[dx,dy], via?:[tx,ty]} the game's own path
// (findPath), via = a tile the path must cross (else the run fails) · {exit:'id'} walk to that exit · {tap:'#dlg'} click like a finger.
// A case with stay:true continues where the previous case ended (no goMap) and must already be on its map.
// A new browser per run · Asia/Bangkok · virtual clock (vclock.js) · service workers blocked · every host but 127.0.0.1 blocked ·
// a synthetic save (never a real one) · run.json carries everything compare.py checks before it trusts a folder.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { chromium } = require('playwright');
const vclock = require('./vclock.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8780', OUT = process.env.OUT;
if (!OUT) { console.error('OUT= is required (a folder outside the repo)'); process.exit(2); }
const INJ = /^(pos|img|hud)@(\d+)$/.exec(process.env.INJECT || '') || null;
const ZOOM = process.env.ZOOM ? +process.env.ZOOM : null; // null = the game's default (a new player gets 75 % on entering capital, L2657)
// 16:59:00 in Bangkok on 6 Nov 2026 → 17:00 (day → dusk) is crossed at virtual 60 s
const EPOCH = Date.UTC(2026, 10, 6, 9, 59, 0), SEED = 20261106, FPS = 60;
const SAVE = { name: 'P', kid: 0, house: 1, age: 7 }; // girl, braids, house 1 (gold), age 7 → lantern in the dark
const DEFAULT_SCEN = [
  // game 2.33 new world: plaza/cave1 and the other old maps send the player to 'capital' (L3320 L4158) → capital, farm, cavemouth (dark)
  ['capital', [{ s: .5 }, { s: 2 }, { walk: [3, 0], s: 1.5 }, { walk: [0, 3], s: 1.5 }, { s: 3.5 }, { walk: [-4, 0], s: 2 }, { s: 4 }, { walk: [0, -3], s: 2 }]],
  // farm: the spawn is the east gate back to capital, so the walk heads west first · the 32 s idle crosses 17:00 (day → dusk)
  ['farm', [{ s: .5 }, { walk: [-4, 0], s: 2 }, { walk: [0, 3], s: 2 }, { s: 5 }, { walk: [-3, 0], s: 2 }, { s: 32, phase: 1 }, { walk: [2, -2], s: 2 }, { s: 2 }]],
  ['cavemouth', [{ s: .5 }, { walk: [3, 0], s: 2 }, { walk: [0, 3], s: 2 }, { s: 5 }, { walk: [-3, 0], s: 2 }, { s: 45, backup: 1 }, { walk: [0, -2], s: 2 }, { s: 1 }]],
];
const RAW = process.env.SCEN ? JSON.parse(fs.readFileSync(process.env.SCEN, 'utf8')) : DEFAULT_SCEN;
const INTRO = !Array.isArray(RAW) && !!RAW.intro; // play the intro of a new save instead of marking it seen
const SCEN = (Array.isArray(RAW) ? RAW.map(([map, steps]) => ({ map, steps })) : RAW.cases).map(c => ({ map: c.map, steps: c.steps, stay: !!c.stay, id: c.id || c.map }));
const EXPECTED = SCEN.reduce((n, c) => n + c.steps.length, 0);
const SCEN_HASH = crypto.createHash('sha256').update(JSON.stringify({ SCEN, INTRO })).digest('hex').slice(0, 16);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/^cp\d+|^run\.json$/.test(f)) fs.unlinkSync(path.join(OUT, f)); // never mix with an older run
  const t0 = Date.now(), blocked = new Set(), pageErrors = [], consoleErr = [], requests = [];
  // pinned raster/compositing (G4.0: without these, 1–20 colour levels moved on DOM edges between two identical runs — layer and
  // raster-thread timing; with them every checkpoint was identical) · CHROME_ARGS=' ' turns them off
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
  await ev(([sv, intro]) => { const d = Store.all(); d.slots = [newSave(sv)]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = intro ? {} : { intro: 1 }; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {}
    LITE = false; fpsChecks = 6; S.eco = false; }, [SAVE, INTRO]);
  await settle();
  const startV = await ev(() => __VC.now());

  const state = () => ev(() => {
    const hs = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(16) };
    const pk = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
    const msg = document.getElementById('msg'), dlg = document.getElementById('dlg');
    return { vnow: __VC.now(), frames: __VC.frames(), map: M && M.id, dark: DARK(), lkid: LKID(), phase: dayPhase(), phaseK: phaseK(),
      P: Object.assign(pk(P, ['x', 'y', 'row', 'moving', 'dist', 'cd', 'hurt', 'dizzy', 'atkAnim']), { path: P.path ? P.path.length : 0 }),
      cam: [camX, camY, SC, VW, VH], ZOOM, LITE, fpsChecks, eco: !!S.eco, PAUSE: !!PAUSE,
      S: pk(S, ['hp', 'lamp', 'lampLv', 'house', 'age', 'kid', 'coins', 'lv', 'exp']), Shash: hs(JSON.stringify(S)), seen: Object.keys(S.seen || {}).sort(),
      dlg: DLG ? { i: DLG.i, n: DLG.lines.length, open: !dlg.classList.contains('hide') } : null,
      msg: msg ? msg.textContent : null, timers: __VC.timers(), vcErrors: __VC.errors() };
  });

  const cps = [];
  let k = 0;
  for (const c of SCEN) {
    if (c.stay) { const cur = await ev(() => M && M.id); if (cur !== c.map) throw new Error(`case ${c.id}: stay on ${c.map} but the kid is on ${cur}`); }
    else if (k > 0 || (await ev(() => M && M.id)) !== c.map) { await ev(id => { goMap(id); P.path = P.act = null; }, c.map); await settle(); }
    for (const st of c.steps) {
      k++;
      let via = null;
      if (st.at) await ev(([tx, ty]) => { P.x = tx * T + T / 2; P.y = ty * T + T / 2; P.path = P.act = null; }, st.at);
      // walking = the game's own tap-to-walk path (findPath, L1244); a straight line only when no path exists
      if (st.walk) via = await ev(([dx, dy, v]) => { const gx = P.x + dx * T, gy = P.y + dy * T; const pth = findPath(M, P.x, P.y, gx, gy); P.path = pth || [[gx, gy]];
        if (!v) return null; // via: walk the path's polyline from where the kid stands in steps of ≤ 4 px and look for the tile
        const pts = [[P.x, P.y], ...(pth || [])]; let on = false;
        for (let i = 1; i < pts.length && !on; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
          for (let j = 0; j <= n; j++) { if (Math.floor((x0 + (x1 - x0) * j / n) / T) === v[0] && Math.floor((y0 + (y1 - y0) * j / n) / T) === v[1]) { on = true; break; } } }
        return { tile: v, onPath: !!pth && on }; }, [st.walk[0], st.walk[1], st.via || null]);
      if (via && !via.onPath) throw new Error(`case ${c.id} checkpoint ${k}: the path does not cross tile ${via.tile}`);
      if (st.exit) await ev(id => { const e = M.exits.find(q => q.id === id); if (!e) throw new Error('no exit ' + id + ' in ' + M.id); P.path = findPath(M, P.x, P.y, e.x, e.y) || [[e.x, e.y]]; }, st.exit);
      if (st.tap) await ev(sel => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.click(); }, st.tap);
      await frames(sec(st.s) - 1);
      if (INJ && +INJ[2] === k && INJ[1] === 'pos') await ev(() => { P.x += 1; });
      await settle();
      const rec = await ev(() => __VC.recFrame());
      await settle();
      const s = await state();
      if (INJ && +INJ[2] === k && (INJ[1] === 'img' || INJ[1] === 'hud')) await ev(xy => { const c = document.getElementById('c').getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ff00ff'; c.fillRect(xy[0], xy[1], 2, 2); c.restore(); }, INJ[1] === 'img' ? [560, 230] : [100, 100]);
      const nn = String(k).padStart(2, '0');
      // the game canvas as the game drew it (nothing of the DOM on top): catches what the HUD hides from the screenshot
      const png = await ev(() => document.getElementById('c').toDataURL('image/png'));
      fs.writeFileSync(path.join(OUT, `cp${nn}.canvas.png`), Buffer.from(png.split(',')[1], 'base64'));
      await page.screenshot({ path: path.join(OUT, `cp${nn}.png`), animations: 'disabled' });
      fs.writeFileSync(path.join(OUT, `cp${nn}.draw.txt`), rec.log.join('\n'));
      const cp = { k, case: c.id, map: c.map, step: st, via, draw: { n: rec.n, hash: rec.hash }, state: s };
      fs.writeFileSync(path.join(OUT, `cp${nn}.json`), JSON.stringify(cp, null, 1));
      cps.push(cp);
      // the pins hold at every checkpoint (plan §8.1)
      if (s.LITE !== false || s.fpsChecks !== 6 || s.eco !== false) throw new Error('pin lost at cp' + k + ' ' + JSON.stringify([s.LITE, s.fpsChecks, s.eco]));
    }
  }
  const vcErrors = await ev(() => __VC.errors());
  const run = { base: BASE, args: ARGS, inject: process.env.INJECT || null, zoom: ZOOM, epoch: EPOCH, seed: SEED, save: SAVE, intro: INTRO, scenHash: SCEN_HASH,
    expected: EXPECTED, checkpoints: cps.length, complete: cps.length === EXPECTED, fontStatus, bootFrames, startV,
    endV: await ev(() => __VC.now()), frames: await ev(() => __VC.frames()), blocked: [...blocked].sort(),
    pageErrors, vcErrors, consoleErrors: consoleErr.slice(0, 20), requests: requests.length, chromium: browser.version(), ms: Date.now() - t0 };
  fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(run, null, 1));
  console.log(JSON.stringify({ checkpoints: cps.length, expected: EXPECTED, startV, endV: run.endV, frames: run.frames, pageErrors: pageErrors.length, vcErrors: vcErrors.n, ms: run.ms }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
