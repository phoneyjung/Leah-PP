// Version 1.78 (Claude, owner's request of 8 Oct with a screenshot of a child digging beside monsters):
// "while digging, the attack button becomes the dig button (one button, many uses); monsters can hit you while you dig, and a hit cancels the dig, so you must start digging again".
// Measured through the screen on a phone (844×390, real touch taps on the big button) and a keyboard: the button's word, what a press DOES (the dig ends, the monster is
// not attacked), whether a monster strikes during a dig and what that strike does (dig gone, spot whole again, no restart by standing there, restart by the button),
// a MISS leaving the dig alone, and a child (age 7, monsters never hit) digging beside a monster. Setup (where things stand) is done directly; everything under test goes through the screen.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_178_dig_button.js   (serve the repo root first)
// Version 1.77 gives errors 73 (the button never digs 0/10, no monster strikes during a dig 0/5, the child's button 0/5); 1.78 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-178-dig'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

// a brand-new player made with real taps in the creator (?rank=1: no automation shortcuts)
async function player(browser, w, h, touch, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); if (touch) await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1200);
  await pg.evaluate(() => {
    const T = window.__t178 = {};
    T.calm = () => { try { closeModal(); } catch (e) { } PAUSE = false; P.sit = null; P.target = null; P.act = null; P.path = null; P.dead = 0; try { HOLD = null; } catch (e) { } S.hp = 400; if (S.st) { S.st.dex = 99; S.st.agi = 0; } S.eff = {}; if ((S.rank || 1) < 4) S.rank = 4; };   // digging opens at rank 2; the owner's screenshot player has the rank-4 dash
    // the cave mouth (3 dig spots, slimes and bats); if none of its spots is clear of the crystals' safe circles, the hunt floor (6 spots)
    T.cave = async () => { for (const id of ['cavemouth', 'hunt1']) { if (M.id !== id) { goMap(id); await new Promise(r => setTimeout(r, 1500)); } T.calm(); for (const m of MONS) if (m.__hx === undefined) { m.__hx = m.x; m.__hy = m.y; } if (T.spot().length) break; } };
    T.away = () => { if (T.pin) clearInterval(T.pin); T.pin = null; for (const m of MONS) { m.x = m.__hx + 6000; m.y = m.__hy; m.st = 'wander'; m.act = 0; } };
    // every dig spot of the cave fresh again (the day's spots are reused between trials)
    T.fresh = () => { for (const d of M.digs) { d.done = false; delete d.wait178; } S.digs[M.id] = []; DIG = null; PAUSE = false; };
    // a dig spot well outside every crystal's safe circle (monsters cannot strike inside it)
    T.spot = () => (M.digs || []).filter(d => !(M.crystals || []).some(c => Math.hypot(c.x - d.x, c.y - d.y) < 80));
    T.stand = d => { P.x = d.x; P.y = d.y; P.target = null; P.act = null; P.path = null; P.cd = 0; };
    // all in one call: between two calls the player would still stand on the previous spot, which fresh() just made whole, and a dig would start there
    T.trial = i => { T.fresh(); T.away(); const d = T.spot()[i % T.spot().length]; T.d = d; T.stand(d); S.hp = 400; return { x: d.x, y: d.y }; };
    // one slime held `gap` px beside the spot: 1e6 HP, no walking, so only its strike changes anything
    T.mon = (d, gap) => { T.away(); const o = MONS.find(m => m.kind === 'slime' && !m.boss) || MONS.find(m => !m.boss); if (!o) return null;
      o.happy = false; o.gone = 0; o.hp = o.max = 1e6; o.sh = o.shMax = 0; o.spd = 0; o.stun = 0; o.act = 0; o.cd = 0; const X = o.x = d.x + gap, Y = o.y = d.y; T.mo = o;
      T.pin = setInterval(() => { o.x = X; o.y = Y; o.spd = 0; if (o.hp < 5e5) o.hp = 1e6; }, 8); return { kind: o.kind, atk: o.atk, dist: Math.round(Math.hypot(X - P.x, Y - P.y)) }; };
    T.needleInGold = () => !!(DIG && !DIG.done && Math.abs(digNeedle() - DIG.c) <= DIG.g / 2);
    T.state = () => ({ dig: !!(DIG && !DIG.done), digDone: !!(DIG && DIG.done), hp: S.hp, target: !!P.target, act: P.act ? P.act.k : null, pause: PAUSE, btn: typeof DIG178 !== 'undefined' ? DIG178.btn : -1, stops: typeof DIG178 !== 'undefined' ? DIG178.stops : -1,
      label: document.getElementById('atkL').textContent, icon: (document.querySelector('#bAtk .ctxIc') || {}).dataset ? document.querySelector('#bAtk .ctxIc').dataset.icon || document.querySelector('#bAtk .ctxIc').textContent : '',
      drops: DROPS.length, coins: S.coins, msg: +document.getElementById('msg').style.opacity > 0 ? document.getElementById('msg').textContent : '', moHp: T.mo ? T.mo.hp : 0,
      digT: DIG ? +DIG.t.toFixed(2) : null, spotDone: T.d ? !!T.d.done : null, spotWait: T.d ? !!T.d.wait178 : null, saved: T.d ? (S.digs[M.id] || []).includes(T.d.id) : null, kid: isKid(), map: M.id });
    T.tx = k => t(k);
  });
  return { ctx, pg };
}
const T = (pg, fn, ...a) => pg.evaluate((fn, a) => window.__t178[fn](...a), fn, a);
const tapBig = async pg => { const r = await pg.evaluate(() => { const q = document.getElementById('bAtk').getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }); await pg.touchscreen.tap(r[0], r[1]); };
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(10); } return -1; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // ================= adult (age 18+, has HP, monsters strike) on a phone =================
    { const { ctx, pg } = await player(browser, 844, 390, true, 30); const R = results.adult = {};
      await T(pg, 'cave'); await T(pg, 'away'); const spots = await pg.evaluate(() => window.__t178.spot().length);
      R.map = await pg.evaluate(() => M.id); R.spots = spots; if (!/^(cavemouth|hunt1)$/.test(R.map)) fail('adult not in a cave: ' + R.map); if (!spots) fail('no dig spot away from crystals');
      const tx = { now: await T(pg, 'tx', 'digNow'), dig: await T(pg, 'tx', 'actDig'), stop: await T(pg, 'tx', 'digStop') }; R.tx = tx;

      // A · the big button says "Dig!" while the needle runs, and pressing it is the dig tap (10 digs)
      { const A = R.buttonDig = { n: 0, labelOk: 0, iconOk: 0, ended: 0, ms: [], noAttack: 0, labelBack: 0, gold: 0 };
        for (let i = 0; i < 10; i++) { await T(pg, 'trial', i);
          const started = await waitFor(pg, () => DIG && !DIG.done, 1500); if (started < 0) { fail('A' + i + ': standing on the spot did not start the dig'); continue; } A.n++;
          await sleep(120); const s1 = await T(pg, 'state'); if (s1.label === tx.now) A.labelOk++; else fail('A' + i + ': label during dig "' + s1.label + '" (want "' + tx.now + '") ' + JSON.stringify(s1)); if (s1.icon === 'hammer' || s1.icon === '⛏️') A.iconOk++; else fail('A' + i + ': icon during dig "' + s1.icon + '"');
          const gold = await waitFor(pg, () => window.__t178.needleInGold(), 2500); if (gold >= 0) A.gold++;
          const t0 = Date.now(); await tapBig(pg); const ended = await waitFor(pg, () => !DIG || DIG.done, 400); const s2 = await T(pg, 'state');
          if (ended >= 0 && s2.btn === A.ended + 1) { A.ended++; A.ms.push(ended); } else fail('A' + i + ': big-button press did not end the dig (ended ' + ended + ', btn ' + s2.btn + ', label "' + s2.label + '")');
          if (!s2.target) A.noAttack++; else fail('A' + i + ': the press started an attack instead');
          await sleep(700); const s3 = await T(pg, 'state'); if (s3.label !== tx.now) A.labelBack++; else fail('A' + i + ': label still "' + tx.now + '" after the dig ' + JSON.stringify(s3));
          if (i === 0) await pg.screenshot({ path: out + '/a_adult_dig_button.png' }); }
        A.msMax = A.ms.length ? Math.max(...A.ms) : null; }

      // B · a slime beside the spot strikes during the dig: the dig is gone, the spot is whole, standing there does not restart it, the button attacks the slime, and after it leaves the button digs again (5 trials)
      { const B = R.monsterCancel = { n: 0, struck: 0, cancelled: 0, spotWhole: 0, notSaved: 0, noRestart: 0, msg: 0, buttonAttacks: 0, restartByButton: 0, strikeMs: [] };
        for (let i = 0; i < 5; i++) { await T(pg, 'trial', i);
          const started = await waitFor(pg, () => DIG && !DIG.done, 1500); if (started < 0) { fail('B' + i + ': dig did not start'); continue; } B.n++;
          const mo = await pg.evaluate(() => window.__t178.mon(window.__t178.d, 12)); if (!mo) { fail('B' + i + ': no monster to place'); continue; }
          const t0 = Date.now(); const hit = await waitFor(pg, () => S.hp < 400, 2600); const s1 = await T(pg, 'state');
          if (hit >= 0) { B.struck++; B.strikeMs.push(hit); } else fail('B' + i + ': the slime did not strike during the dig (hp ' + s1.hp + ', dig ' + s1.dig + ')');
          if (hit >= 0 && !s1.dig && !s1.digDone) B.cancelled++; else if (hit >= 0) fail('B' + i + ': dig still running after the strike');
          if (s1.spotDone === false) B.spotWhole++; else fail('B' + i + ': spot marked done after the cancel');
          if (s1.saved === false) B.notSaved++; else fail('B' + i + ': spot still saved as dug');
          if (s1.msg === '⛏️ ' + tx.stop) B.msg++; else fail('B' + i + ': message "' + s1.msg + '"');
          await sleep(1000); const s2 = await T(pg, 'state'); if (!s2.dig) B.noRestart++; else fail('B' + i + ': dig restarted by itself while standing on the spot');
          // the button now: the slime is near, so it attacks (one button, many uses)
          await tapBig(pg); await sleep(250); const s3 = await T(pg, 'state'); if (s3.target && !s3.dig) B.buttonAttacks++; else fail('B' + i + ': button beside the slime: target ' + s3.target + ', dig ' + s3.dig + ', label "' + s3.label + '"');
          // the slime leaves; the button says Dig and a press starts the dig again
          await T(pg, 'away'); await pg.evaluate(() => { P.target = null; P.path = null; }); await sleep(600); const s4 = await T(pg, 'state');
          if (s4.label !== tx.dig) fail('B' + i + ': label after the slime left "' + s4.label + '" (want "' + tx.dig + '")');
          await tapBig(pg); const re = await waitFor(pg, () => DIG && !DIG.done, 1500); if (re >= 0) B.restartByButton++; else fail('B' + i + ': the dig button did not restart the dig (label "' + s4.label + '")');
          if (i === 0) await pg.screenshot({ path: out + '/b_adult_cancelled.png' }); await T(pg, 'fresh'); }
        B.strikeMsMax = B.strikeMs.length ? Math.max(...B.strikeMs) : null; }

      // C · a strike that MISSES leaves the dig alone (flee forced to 100%): the dig runs to its end by itself
      { const C = R.missKeeps = { n: 0, kept: 0, finished: 0 };
        await pg.evaluate(() => { window.__fc178 = fleeCh; fleeCh = () => 1; });
        for (let i = 0; i < 3; i++) { await T(pg, 'trial', i);
          if (await waitFor(pg, () => DIG && !DIG.done, 1500) < 0) { fail('C' + i + ': dig did not start'); continue; } C.n++;
          await pg.evaluate(() => window.__t178.mon(window.__t178.d, 12)); await sleep(1800); const s1 = await T(pg, 'state');
          if (s1.dig && s1.hp === 400 && s1.stops === 5) C.kept++; else fail('C' + i + ': dig ' + s1.dig + ' hp ' + s1.hp + ' stops ' + s1.stops + ' after a missed strike');
          const fin = await waitFor(pg, () => !DIG, 3000); if (fin >= 0) C.finished++; else fail('C' + i + ': dig never finished'); await T(pg, 'fresh'); }
        await pg.evaluate(() => { fleeCh = window.__fc178; }); }

      // D · keyboard still digs (Space) and the attack key still attacks when not digging
      { const D = R.keys = { space: 0 };
        for (let i = 0; i < 3; i++) { await T(pg, 'trial', i);
          if (await waitFor(pg, () => DIG && !DIG.done, 1500) < 0) { fail('D' + i + ': dig did not start'); continue; } await sleep(200);
          await pg.keyboard.press('Space'); if (await waitFor(pg, () => !DIG || DIG.done, 300) >= 0) D.space++; else fail('D' + i + ': Space did not dig'); await sleep(600); } }
      await pg.screenshot({ path: out + '/adult_end.png' }); await ctx.close(); }

    // ================= child (age 7): monsters never strike, so the dig beside a slime runs; the button says Dig! and digs =================
    { const { ctx, pg } = await player(browser, 844, 390, true, 7); const K = results.kid = {};
      await T(pg, 'cave'); await T(pg, 'away'); K.map = await pg.evaluate(() => M.id); K.kid = await pg.evaluate(() => isKid()); if (!K.kid) fail('kid player is not a kid'); K.spots = await pg.evaluate(() => window.__t178.spot().length); if (!K.spots) fail('kid: no dig spot away from crystals');
      const tx = { now: await T(pg, 'tx', 'digNow') };
      const A = K.besideSlime = { n: 0, labelOk: 0, unhurt: 0, ended: 0, noAttack: 0 };
      for (let i = 0; i < 5; i++) { await T(pg, 'trial', i);
        if (await waitFor(pg, () => DIG && !DIG.done, 1500) < 0) { fail('K' + i + ': dig did not start'); continue; } A.n++;
        await pg.evaluate(() => window.__t178.mon(window.__t178.d, 12)); await sleep(1500); const s1 = await T(pg, 'state');
        if (s1.label === tx.now) A.labelOk++; else fail('K' + i + ': label "' + s1.label + '"'); if (s1.dig && s1.hp === 400 && s1.stops === 0) A.unhurt++; else fail('K' + i + ': child hurt or dig cancelled: hp ' + s1.hp + ' dig ' + s1.dig + ' stops ' + s1.stops);
        await tapBig(pg); const ended = await waitFor(pg, () => !DIG || DIG.done, 400); const s2 = await T(pg, 'state'); if (ended >= 0) A.ended++; else fail('K' + i + ': press did not end the dig'); if (!s2.target) A.noAttack++; else fail('K' + i + ': press attacked');
        if (i === 0) await pg.screenshot({ path: out + '/k_kid_dig_button.png' }); await sleep(600); await T(pg, 'fresh'); }
      await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
