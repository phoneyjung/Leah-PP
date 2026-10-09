// Version 1.96 (owner 9 Oct 16:18 "the_secret_of_the_grotto.mp3", 16:28 "march_of_the_colossus.mp3"): recorded music for the first cave and its boss.
// "เพลงประกอบถ้ำแรก ยกเว้นฉากบอส หรี่เสียงให้เกือบเงียบเลย ตอนอ่านคำถาม ส่วนเวลาปกติ เป็นการเปิดเพลงคลอเบาๆ พอ" · "เพลงฉากบอสในถ้ำตัวแรก"
// The first cave of today's world is the cave mouth (cavemouth) and floor 1 (hunt1); the old Crystal Cave floors 1–3 (?oldworld) use it too, and its cave3 golem is the boss tested here
// (today's first cave has no boss room yet).  A phone (844×390), a new adult player made with real taps, then:
//   village — no recording; cave mouth — bgm-cave1.mp3 (about 3 minutes) plays softly at 0.25–0.30 and the game's own cave tune is stopped;
//   a question on a crystal — the music drops to ≤ 0.05 within 1 s and stays there (still playing); answered with real taps — back to ≥ 0.25 within 3 s;
//   floor 1 — the same recording plays on (not restarted);
//   old cave3 boss room — bgm-cave1-boss.mp3 plays (≥ 0.35), the cave recording stops, no game tune; out of the room — the cave recording again, the boss recording rewound;
//   4 s of play with music ≥ 50 frames a second; music switched off — silent; the village — the recording stops and the town tune plays;
//   both files missing — no page error, the game's own cave tune; only the boss file missing — the game's boss tune in the fight.
// Chrome runs with --autoplay-policy=no-user-gesture-required (as test_119) because a headless page has no speaker to unlock.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_196_cave_music.js   (serve the repo root first)
// Version 1.95 gives errors ≥ 6 here; 1.96 gives errors 0.
const puppeteer = require('puppeteer');
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  try {
    for (const [dev, blockList] of [['phone', []], ['missing', ['bgm-cave1.mp3', 'bgm-cave1-boss.mp3']], ['noBossFile', ['bgm-cave1-boss.mp3']]]) {
      const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); const R = results[dev] = {};
      pg.on('pageerror', e => fail(dev + ' page error: ' + e.message)); pg.on('dialog', d => d.accept());
      await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await pg.setBypassServiceWorker(true);
      if (blockList.length) { await pg.setRequestInterception(true); pg.on('request', r => { if (blockList.some(f => r.url().endsWith(f))) r.abort(); else r.continue(); }); }
      await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
      const press = async el => { const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
      { const gb = await pg.$('#cg194 [data-g="m"]'); if (gb) { await press(gb); await sleep(400); } }
      const ages = await pg.$$('#ca button'); await press(ages[ages.length - 1]); await press(await pg.$('#cgo')); await sleep(2300);
      const settle = () => pg.evaluate(() => { while (DLG) nextLine(); try { closeModal(); } catch (e) { } PAUSE = false; S.tts = false; GM.god = true; });
      await settle();
      const st = () => pg.evaluate(() => { const one = a => a ? { on: !a.paused, vol: +a.volume.toFixed(3), t: +a.currentTime.toFixed(1), len: isFinite(a.duration) ? Math.round(a.duration) : null, src: a.currentSrc.split('/').pop() } : null; return { map: M.id, cave: one(CAVE_BGM.el.cave), boss: one(CAVE_BGM.el.boss), bad: { ...CAVE_BGM.bad }, tune: BGM.timer ? BGM.mode : null }; });
      const go = async id => { await pg.evaluate(id => goMap(id), id); await sleep(800); await settle(); };
      const waitFor = async (test, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (test(s)) return Date.now() - t0; await sleep(100); } return null; };
      const toBossRoom = () => pg.evaluate(() => { if (!M.boss || !M.bossRoom) return false; const r = M.bossRoom, u = typeof T === 'number' ? T : 32; P.path = null; P.x = (r.x + r.w / 2) * u; P.y = (r.y + r.h / 2) * u; return inRoom(P.x, P.y, r); });   /* the room is in tiles */
      const outOfRoom = () => pg.evaluate(() => { const r = M.bossRoom, u = typeof T === 'number' ? T : 32; P.path = null; P.x = (r.x - 3) * u; P.y = (r.y + r.h / 2) * u; return !inRoom(P.x, P.y, r); });
      const oldCave3 = async () => { await pg.evaluate(() => { history.replaceState(null, '', location.pathname + '?rank=1&oldworld'); S.boss = false; }); await go('cave3'); };
      await go('capital'); await sleep(1000); R.village = await st();
      await go('cavemouth'); await sleep(3200); R.mouth = await st();
      if (dev === 'missing') {
        if (!R.mouth.bad.cave || (R.mouth.cave && R.mouth.cave.on) || R.mouth.tune !== 'cave') fail('missing: the game\'s own cave tune should play ' + JSON.stringify(R.mouth));
        await ctx.close(); continue;
      }
      if (dev === 'noBossFile') {
        if (!R.mouth.cave || !R.mouth.cave.on) fail('noBossFile: the cave recording should still play ' + JSON.stringify(R.mouth));
        await oldCave3(); await sleep(1500); if (!(await toBossRoom())) fail('noBossFile: no boss room in cave3');
        const ms = await waitFor(s => s.tune === 'boss' && !(s.cave && s.cave.on) && !(s.boss && s.boss.on), 5000); R.fight = { ms, state: await st() };
        if (ms === null) fail('noBossFile: the game\'s boss tune should play in the fight ' + JSON.stringify(R.fight));
        await ctx.close(); continue;
      }
      if (R.village.cave && R.village.cave.on) fail('the recording plays in the village ' + JSON.stringify(R.village));
      const c = R.mouth.cave; if (!c || !c.on || c.src !== 'bgm-cave1.mp3' || !(c.vol >= .25 && c.vol <= .3) || R.mouth.tune || !(c.len >= 170)) fail('cave mouth music ' + JSON.stringify(R.mouth));
      // a question on a crystal
      await pg.evaluate(() => { const c = M.crystals.find(c => !c.awake) || M.crystals[0]; c.awake = false; openQuiz(c); });
      const quiet = await waitFor(s => s.cave && s.cave.vol <= .05, 1500); await sleep(1200); R.quiz = { quietMs: quiet, later: await st() };
      if (quiet === null || quiet > 1000) fail('the music did not drop to ≤ 0.05 within 1 s of the question ' + JSON.stringify(R.quiz));
      if (!R.quiz.later.cave || !(R.quiz.later.cave.vol <= .05) || !R.quiz.later.cave.on) fail('the music should stay almost silent while the question is open ' + JSON.stringify(R.quiz.later));
      for (let i = 0; i < 8; i++) { const m = await pg.evaluate(() => ({ open: !document.getElementById('modal').classList.contains('hide'), qz: !!document.querySelector('#modal .qz'), x: document.getElementById('qClose') ? '#qClose' : document.getElementById('mX') ? '#mX' : null })); if (!m.open) break; const bs = m.qz ? await pg.$$('#modal .ch button:not([disabled])') : []; if (bs.length) await press(bs[0]); else if (m.x) await press(await pg.$(m.x)); else break; await sleep(900); }   /* two wrong answers show the answer and a close button */
      R.quiz.closed = await pg.evaluate(() => document.getElementById('modal').classList.contains('hide')); await settle();
      R.quiz.backMs = await waitFor(s => s.cave && s.cave.vol >= .25, 3000); if (!R.quiz.closed || R.quiz.backMs === null) fail('after the question the music should be back to ≥ 0.25 within 3 s ' + JSON.stringify(R.quiz));
      // floor 1
      const before = (await st()).cave.t; await go('hunt1'); await sleep(1500); R.floor1 = await st(); R.floor1.before = before;
      if (!R.floor1.cave || !R.floor1.cave.on || !(R.floor1.cave.t > before) || R.floor1.tune) fail('floor 1: the recording should play on ' + JSON.stringify(R.floor1));
      // the old cave3 golem
      await oldCave3(); await sleep(1500); R.cave3 = await st(); if (!(await toBossRoom())) fail('cave3 has no boss room to test'); else {
        const ms = await waitFor(s => s.boss && s.boss.on && s.boss.vol >= .35 && s.boss.src === 'bgm-cave1-boss.mp3' && !(s.cave && s.cave.on) && !s.tune, 6000); R.fight = { ms, state: await st() };
        if (ms === null) fail('the boss fight should play the boss recording alone ' + JSON.stringify(R.fight));
        await outOfRoom(); const back = await waitFor(s => s.cave && s.cave.on && !(s.boss && s.boss.on) && !s.tune, 6000); R.afterFight = { ms: back, state: await st() };
        if (back === null || !(R.afterFight.state.boss && R.afterFight.state.boss.t === 0)) fail('after the fight: the cave recording again, the boss recording rewound ' + JSON.stringify(R.afterFight));
      }
      R.fps = await pg.evaluate(async () => { let n = 0; const t0 = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return +(n / 4).toFixed(1); });
      if (R.fps < 50) fail('frames per second in the cave with music: ' + R.fps);
      await pg.evaluate(() => { MUS = false; }); await sleep(1600); R.off = await st(); await pg.evaluate(() => { MUS = true; }); if ((R.off.cave && R.off.cave.on) || R.off.tune) fail('music off should be silent ' + JSON.stringify(R.off));
      await sleep(2000); await go('capital'); await sleep(1500); R.back = await st();
      if ((R.back.cave && R.back.cave.on) || R.back.tune !== 'town') fail('the village: the recording should stop and the town tune play ' + JSON.stringify(R.back));
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
