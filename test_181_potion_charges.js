// Version 1.81 (Claude, owner's order of 9 Oct: "healing the Diablo 4 way"): the potion button holds charges — 4 by default — one charge comes back every
// 30 s of play, a potion picked up fills one (none at full charges), and there is a 1 s pause between gulps. Measured through the screen on a phone (real taps)
// and a computer (clicks and the 4 key): HP and charges after each press, the "n/4" on the button, the pause (a second tap 0.3 s later does nothing, one 1.2 s
// later works), the refill clock (charges climb at 1 per 30 s of play, paused while a window is open), the sweep with the seconds left when the bottle is empty,
// a pickup at full charges, and a child (age 7) whose game has no potions at all.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_181_potion_charges.js   (serve the repo root first)
// Versions up to 1.80 give errors 30 (no charge cap, no refill, no pause, no empty-bottle sweep); 1.81 gives errors 0. Part F (1.82): the cap grows with class 7–9 and every 10 levels.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-181-potion'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

async function player(browser, w, h, touch, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1200);
  await pg.evaluate(() => {
    const T = window.__t181 = {};
    T.calm = () => { try { closeModal(); } catch (e) { } PAUSE = false; P.sit = null; P.target = null; P.act = null; P.path = null; P.dead = 0; S.rank = 4; for (const m of MONS) m.x += 6000; hud(); };
    T.set = (pot, hpFrac) => { S.potions = pot; S.potT = 0; P.potCd = 0; S.hp = Math.round(hpMax() * hpFrac); hud(); };
    T.rect = id => { const b = document.getElementById(id); const r = b.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, shown: getComputedStyle(b).display !== 'none' && r.width > 0 }; };
    T.state = () => ({ pot: S.potions, hp: S.hp, hpMax: hpMax(), potT: +(S.potT || 0).toFixed(2), cd: +(P.potCd || 0).toFixed(2), label: (document.querySelector('#bPot small') || {}).textContent || '', sweep: document.getElementById('bPot').classList.contains('cd179on'),
      num: (document.querySelector('#bPot .cd179 b') || {}).textContent || '', msg: +document.getElementById('msg').style.opacity > 0 ? document.getElementById('msg').textContent : '', kid: isKid(), max: typeof potMax181 === 'function' ? potMax181() : null });
  });
  return { ctx, pg };
}
const T = (pg, fn, ...a) => pg.evaluate((fn, a) => window.__t181[fn](...a), fn, a);
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(25); } return -1; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch] of [['phone', 844, 390, true], ['computer', 1180, 820, false]]) {
      const { ctx, pg } = await player(browser, w, h, touch, 30); const R = results[dev] = {};
      await T(pg, 'calm'); await sleep(500);
      const tap = async () => { const r = await T(pg, 'rect', 'bPot'); if (!r.shown) { fail(dev + ': potion button not shown'); return; } if (touch) await pg.touchscreen.tap(r.cx, r.cy); else await pg.mouse.click(r.cx, r.cy); };

      // A · a gulp: HP up, one charge gone, "3/4" on the button, a 1 s pause: a tap 0.3 s later does nothing, one 1.2 s later works
      { const A = R.gulp = {}; await T(pg, 'set', 4, .3); await sleep(200); const s0 = await T(pg, 'state'); A.max = s0.max; A.label0 = s0.label; if (s0.max !== 4) fail(dev + ': max charges ' + s0.max); if (s0.label !== '4/4') fail(dev + ': label before "' + s0.label + '"');
        await tap(); await sleep(120); const s1 = await T(pg, 'state'); A.after = { pot: s1.pot, hp: s1.hp, hpMax: s1.hpMax, label: s1.label, cd: s1.cd, sweep: s1.sweep };
        if (s1.pot !== 3) fail(dev + ': charges after one gulp ' + s1.pot); if (!(s1.hp > s0.hp)) fail(dev + ': HP did not rise'); if (s1.label !== '3/4') fail(dev + ': label after "' + s1.label + '"'); if (!(s1.cd > 0.5)) fail(dev + ': no pause after the gulp (' + s1.cd + ')'); if (!s1.sweep) fail(dev + ': no sweep during the pause');
        await sleep(180); await tap(); await sleep(100); const s2 = await T(pg, 'state'); A.quickSecond = s2.pot; if (s2.pot !== 3) fail(dev + ': a tap during the pause used a charge');
        await sleep(1000); await tap(); await sleep(120); const s3 = await T(pg, 'state'); A.laterThird = s3.pot; if (s3.pot !== 2) fail(dev + ': a tap after the pause did not work (' + s3.pot + ')');
        await sleep(1200); const s4 = await T(pg, 'state'); if (s4.sweep) fail(dev + ': sweep still on 1.2 s after the pause'); }

      // B · the refill clock: 1 charge per 30 s of play — the clock runs at 1 s/s while playing, stops with a window open, and a charge lands when it reaches 30
      { const B = R.refill = {}; await T(pg, 'set', 2, 1); await sleep(2000); const s1 = await T(pg, 'state'); B.potTafter2s = s1.potT; if (!(s1.potT > 1.6 && s1.potT < 2.4)) fail(dev + ': refill clock ran ' + s1.potT + ' s in 2 s');
        await pg.evaluate(() => { PAUSE = true; }); await sleep(1000); const s2 = await T(pg, 'state'); await pg.evaluate(() => { PAUSE = false; }); B.potTpaused = +(s2.potT - s1.potT).toFixed(2); if (B.potTpaused > .2) fail(dev + ': refill clock ran while paused (' + B.potTpaused + ')');
        await pg.evaluate(() => { S.potT = 29.5; }); const landed = await waitFor(pg, () => S.potions === 3, 2000); const s3 = await T(pg, 'state'); B.landedMs = landed; B.afterLanding = { pot: s3.pot, potT: s3.potT, label: s3.label }; if (landed < 0) fail(dev + ': the charge did not land at 30 s'); if (s3.label !== '3/4') fail(dev + ': label after refill "' + s3.label + '"');
        await T(pg, 'set', 4, 1); await sleep(1500); const s4 = await T(pg, 'state'); B.fullClock = s4.potT; if (s4.potT !== 0) fail(dev + ': the clock runs at full charges (' + s4.potT + ')'); }

      // C · empty bottle: the button shows the sweep with the seconds to the next charge, a tap says so and heals nothing
      { const C = R.empty = {}; await T(pg, 'set', 0, .3); await pg.evaluate(() => { S.potT = 10; }); await sleep(300); const s1 = await T(pg, 'state'); C.sweep = s1.sweep; C.num = s1.num; C.label = s1.label; if (!s1.sweep) fail(dev + ': no sweep when empty'); if (!(+s1.num >= 18 && +s1.num <= 20)) fail(dev + ': empty-bottle seconds "' + s1.num + '" (want ~20)'); if (s1.label !== '0/4') fail(dev + ': empty label "' + s1.label + '"');
        const hp0 = s1.hp; await tap(); await sleep(150); const s2 = await T(pg, 'state'); C.tapMsg = s2.msg; C.hpJump = s2.hp - hp0; if (s2.hp - hp0 > s2.hpMax * .2 || s2.pot !== 0) fail(dev + ': an empty tap healed (' + hp0 + ' → ' + s2.hp + ', charges ' + s2.pot + ')'); /* slow natural regen may add a point or two */ if (!s2.msg.includes(await pg.evaluate(() => t('potEmpty')))) fail(dev + ': empty tap message "' + s2.msg + '"'); }

      // D · a potion picked up fills one charge, and none at full charges
      { const D = R.pickup = {}; await T(pg, 'set', 2, 1); await pg.evaluate(() => { DROPS.push({ k: 'potion', x: P.x, y: P.y }); }); await sleep(300); const s1 = await T(pg, 'state'); D.from2 = s1.pot; if (s1.pot !== 3) fail(dev + ': pickup at 2 charges gave ' + s1.pot);
        await T(pg, 'set', 4, 1); await pg.evaluate(() => { DROPS.push({ k: 'potion', x: P.x, y: P.y }); }); await sleep(300); const s2 = await T(pg, 'state'); D.from4 = s2.pot; if (s2.pot !== 4) fail(dev + ': pickup at full charges gave ' + s2.pot);
        await pg.screenshot({ path: out + '/' + dev + '_end.png' }); }

      // F · (1.82) the charge cap grows: +1 at each of classes 7, 8, 9 and +1 every 10 levels, and the button shows the new cap
      { const F = R.cap = {}; const cap = async (lv, rk) => { await pg.evaluate((lv, rk) => { S.lv = lv; S.rank = rk; S.potions = 0; hud(); }, lv, rk); await sleep(150); const s = await T(pg, 'state'); return { max: s.max, label: s.label }; };
        const want = [[1, 4, 4], [9, 4, 4], [10, 4, 5], [20, 4, 6], [10, 7, 6], [10, 8, 7], [10, 9, 8], [10, 10, 8], [30, 9, 10]]; F.rows = [];
        for (const [lv, rk, m] of want) { const r = await cap(lv, rk); F.rows.push([lv, rk, r.max, r.label]); if (r.max !== m) fail(dev + ': cap at lv ' + lv + ' class ' + rk + ' is ' + r.max + ' (want ' + m + ')'); if (r.label !== '0/' + m) fail(dev + ': button at lv ' + lv + ' class ' + rk + ' reads "' + r.label + '"'); }
        await pg.evaluate(() => { S.lv = 1; S.rank = 4; S.potions = 4; hud(); }); }
      await ctx.close(); }

    // E · a child: no potion button, no charges, no clock
    { const { ctx, pg } = await player(browser, 844, 390, true, 7); const K = results.kid = {}; await T(pg, 'calm'); await pg.evaluate(() => { S.potions = 0; S.potT = 0; }); await sleep(1500); const s = await T(pg, 'state'); K.kid = s.kid; K.potT = s.potT; K.shown = (await T(pg, 'rect', 'bPot')).shown;
      if (!s.kid) fail('kid: not a kid'); if (s.potT !== 0) fail('kid: refill clock ran (' + s.potT + ')'); if (K.shown) fail('kid: potion button shown'); await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
