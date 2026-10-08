// Version 1.76 (Claude, on the owner's report of 8 Oct after Leah's play test: "while I steer I cannot press anything else").
// What 1.75 did: the press arrived, but the walking code wiped the attack / explore / dig / talk one frame later while a direction was held.
// This suite measures the RESULT of each press (monster HP, swings, the question window, sitting), never just "the button was pressed":
// test_174 replaced the buttons' handlers with counters and so could not see the bug.
// Real fingers (CDP touch points, two at once), real keys, and a stand-in gamepad. Setup (where the player and one monster stand) is done
// directly; everything under test goes through the screen. Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_176_steer_and_act.js   (serve the repo root first)
// Version 1.75 gives errors 60; 1.76 must give errors 0.
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-176-steer-act'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

// a brand-new player made with real taps/clicks in the creator (?rank=1: no automation shortcuts)
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
  await sleep(1500);
  // helpers that live in the page: setup and read-only sampling
  await pg.evaluate(() => {
    const T = window.__t176 = { s: [], mo: null, pin: null };
    const dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
    const run = (x, y, d, n) => { for (let i = 0; i <= n; i += 6) if (blockedAt(M, x + d[0] * i, y + d[1] * i)) return i; return n; };
    // setup only: a swing can MISS (12–35% for a new character), so the test character gets enough DEX to always hit; HP lost is then a fair measure
    T.calm = () => { try { closeModal(); } catch (e) { } PAUSE = false; P.sit = null; P.target = null; P.act = null; P.path = null; try { HOLD = null; } catch (e) { } S.hp = 99999; if (S.st) S.st.dex = 99; };
    T.cave = async () => { if (M.id !== 'cavemouth') { goMap('cavemouth'); await new Promise(r => setTimeout(r, 1300)); } for (const m of MONS) if (m.__hx === undefined) { m.__hx = m.x; m.__hy = m.y; } T.calm(); };
    // stand `gap` px from one monster on the side that has `need` px of open ground behind the player; the monster stays put and cannot be worn down
    T.mon = async (gap, need) => { await T.cave(); if (T.pin) clearInterval(T.pin);
      let best = null; for (const o of MONS) { if (o.gone) continue; for (const d of dirs) { const f = run(o.__hx + d[0] * gap, o.__hy + d[1] * gap, d, need); if (f >= need && !best) best = { o, d }; } }
      if (!best) return null; const o = best.o, d = best.d; for (const m of MONS) if (m !== o) m.x = m.__hx + 6000;
      o.happy = false; o.hp = o.max = 1e6; o.sh = o.shMax = 0; o.spd = 0; const X = o.x = o.__hx, Y = o.y = o.__hy; T.mo = o; T.pin = setInterval(() => { o.x = X; o.y = Y; if (o.hp < 5e5) o.hp = 1e6; }, 8);
      T.place = () => { P.x = X + d[0] * gap; P.y = Y + d[1] * gap; P.target = null; P.act = null; P.path = null; P.cd = 0; }; T.place(); return { d, dist: Math.round(Math.hypot(P.x - X, P.y - Y)) }; };
    T.noMon = async () => { await T.cave(); if (T.pin) clearInterval(T.pin); T.mo = null; for (const m of MONS) m.x = m.__hx + 6000; };
    // stand `gap` px from a sleeping crystal on a side that has open ground to walk away on, and say where it is on the screen
    T.crystal = async (gap, need) => { await T.noMon(); let best = null;
      for (const c of M.crystals) { if (c.awake) continue; for (const d of dirs) { if (best) break; const f = run(c.x + d[0] * gap, c.y + d[1] * gap, d, need); if (f < need) continue;
        const px = c.x + d[0] * gap, py = c.y + d[1] * gap, ox = P.x, oy = P.y; P.x = px; P.y = py; const ok = lit(c.x, c.y); P.x = ox; P.y = oy; if (ok) best = { c, d }; } }
      if (!best) return null; const c = best.c, d = best.d; T.c = c; T.place = () => { P.x = c.x + d[0] * gap; P.y = c.y + d[1] * gap; P.target = null; P.act = null; P.path = null; }; T.place();
      T.cScreen = () => { const dpr = devicePixelRatio || 1; return [Math.round((c.x - camX) * SC / dpr), Math.round((c.y - 10 - camY) * SC / dpr)]; }; return { d, up: run(P.x, P.y, [0, -1], 120), down: run(P.x, P.y, [0, 1], 120) }; };
    T.freeDir = need => { for (const d of dirs) if (run(P.x, P.y, d, need) >= need) return d; return null; };
    T.start = () => { T.s = []; if (T.iv) clearInterval(T.iv); const take = () => { T.s.push([performance.now(), P.x, P.y, P.cd, T.mo ? T.mo.hp : 0, JOY.id !== null ? 1 : 0, window.CMD176 && CMD176.on ? 1 : 0]); }; take(); T.iv = setInterval(take, 12); };
    T.stop = () => { clearInterval(T.iv); return T.s; };
    T.now = () => performance.now();
    T.state = () => ({ x: P.x, y: P.y, target: !!P.target, act: P.act ? P.act.k : null, sit: !!P.sit, stick: JOY.id !== null, cmd: !!(window.CMD176 && CMD176.on), zoom: ZOOM, saved: localStorage.getItem('la-zoom'),
      modal: !document.getElementById('modal').classList.contains('hide'), msg: +document.getElementById('msg').style.opacity > 0 ? document.getElementById('msg').textContent : '' });
  });
  return { ctx, pg };
}
// real fingers: every touch gets a new id. Lifting ONE finger while another stays down is a touchEnd that names that finger.
// (Leaving a finger out of a touchMove does not lift it: measured on Chromium 141, no pointerup arrives. test_174 lifted fingers that way,
// so its second fingers stayed down; its verdicts stand, but copy the method from here, not from there.)
function fingers(cdp) { const pts = {}; let next = 20; const list = () => Object.entries(pts).map(([id, p]) => ({ x: Math.round(p[0]), y: Math.round(p[1]), id: +id }));
  return { down: async (x, y) => { const id = next++; pts[id] = [x, y]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: list() }); return id; },
    move: async (id, x, y) => { pts[id] = [x, y]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: list() }); },
    up: async id => { const p = pts[id]; if (!p) return; delete pts[id]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: Math.round(p[0]), y: Math.round(p[1]), id: +id }] }); },
    clear: async () => { for (const id of Object.keys(pts)) { const p = pts[id]; delete pts[id]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: Math.round(p[0]), y: Math.round(p[1]), id: +id }] }); } } }; }
const centre = (pg, sel) => pg.evaluate(sel => { const q = document.querySelector(sel).getBoundingClientRect(); return [Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2)]; }, sel);
const T = (pg, fn, ...a) => pg.evaluate((fn, a) => window.__t176[fn](...a), fn, a);
// reading the samples [time, x, y, attack cooldown, monster HP, stick held, command on]
const at = (s, t) => s.reduce((b, r) => Math.abs(r[0] - t) < Math.abs(b[0] - t) ? r : b, s[0]);
const moved = (s, t0, t1) => { const a = at(s, t0), b = at(s, t1); return Math.round(Math.hypot(b[1] - a[1], b[2] - a[2])); };
const swingTimes = (s, t0, t1) => { const r = []; for (let i = 1; i < s.length; i++) if (s[i][0] >= t0 && s[i][0] <= t1 && s[i][3] > s[i - 1][3] + .05) r.push(s[i][0]); return r; };
const hpLost = (s, t0, t1) => { let n = 0; for (let i = 1; i < s.length; i++) if (s[i][0] >= t0 && s[i][0] <= t1 && s[i][4] < s[i - 1][4] && s[i - 1][4] - s[i][4] < 1e5) n += s[i - 1][4] - s[i][4]; return n; };
const allHeld = (s, t0, t1) => s.filter(r => r[0] >= t0 && r[0] <= t1).every(r => r[5] === 1);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // ================= touch screens =================
    const only = process.env.ONLY || '';   // ONLY=phone | ipad | computer runs one part
    for (const [dev, w, h, sticks] of [['phone', 844, 390, ['corner', 'zone']], ['ipad', 1180, 820, ['zone']]]) { if (only && only !== dev) continue;
      const R = results[dev] = {};
      // ---------- a grown-up ----------
      { const { ctx, pg } = await player(browser, w, h, true, 30), cdp = await pg.createCDPSession(), F = fingers(cdp), joyC = await centre(pg, '#joy');
        const stickAt = mode => mode === 'corner' ? joyC : [Math.round(w * .3), Math.round(h * .62)];
        const steer = async (mode, d) => { const j = stickAt(mode), id = await F.down(j[0], j[1]); await sleep(50); await F.move(id, j[0] + d[0] * 24, j[1] + d[1] * 24); await sleep(140); return { id, j }; };
        // sitting, in the town where no monster is near (a monster within 110 px refuses the sit)
        { const d = await T(pg, 'freeDir', 110), r = R['sit while steering'] = {}; if (!d) fail(dev + ' adult: no open ground to test sitting'); else {
            await T(pg, 'calm'); const st = await steer('corner', d); await sleep(200); const b = await centre(pg, '#bRest'), f2 = await F.down(b[0], b[1]); await sleep(90); await F.up(f2); await sleep(350);
            const a = await T(pg, 'state'); await sleep(350); const a2 = await T(pg, 'state'); r.sat = a.sit; r.stickHeld = a.stick; r.movedWhileSitting = Math.round(Math.hypot(a2.x - a.x, a2.y - a.y));
            if (!a.sit) fail(dev + ' adult: the sit button did not sit while the stick was held'); if (!a.stick) fail(dev + ' adult: the stick let go when the sit button was pressed'); if (r.movedWhileSitting > 3) fail(dev + ' adult: walked ' + r.movedWhileSitting + ' px while sitting');
            await F.move(st.id, st.j[0] - d[0] * 24, st.j[1] - d[1] * 24); await sleep(350); const c = await T(pg, 'state'); r.stoodAfterNewDirection = !c.sit; if (c.sit) fail(dev + ' adult: steering a new way did not stand up');
            await F.clear(); await sleep(300); } }
        for (const mode of sticks) {
          // --- attack with the stick held: one press = one swing, a short stand-still, then the stick walks on by itself ---
          { const r = R['attack, ' + mode + ' stick'] = {}, m = await T(pg, 'mon', 20, 260); if (!m) { fail(dev + ': no monster with open ground beside it'); continue; }
            const st = await steer(mode, m.d); await T(pg, 'place'); await T(pg, 'start'); const b = await centre(pg, '#bAtk'), t0 = await T(pg, 'now'), f2 = await F.down(b[0], b[1]); await sleep(80); await F.up(f2); await sleep(1700);
            const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t0 + 1700); r.swings = sw.length; r.hpLost = hpLost(s, t0, t0 + 1700); r.stickHeldThroughout = allHeld(s, t0, t0 + 1700);
            if (sw.length !== 1) fail(dev + ', ' + mode + ' stick: one press of attack while steering made ' + sw.length + ' swings, expected 1'); if (!(r.hpLost > 0)) fail(dev + ', ' + mode + ' stick: the monster lost ' + r.hpLost + ' HP');
            if (!r.stickHeldThroughout) fail(dev + ', ' + mode + ' stick: the stick let go when attack was pressed');
            if (sw.length) { r.movedDuringSwing = moved(s, sw[0], sw[0] + 200); r.walkedAfter = moved(s, sw[0] + 350, sw[0] + 1150); r.msToSwing = Math.round(sw[0] - t0);
              if (r.movedDuringSwing > 6) fail(dev + ', ' + mode + ' stick: moved ' + r.movedDuringSwing + ' px during the swing'); if (r.walkedAfter < 50) fail(dev + ', ' + mode + ' stick: after the swing the held stick walked only ' + r.walkedAfter + ' px in 0.8 s');
              if (r.msToSwing > 600) fail(dev + ', ' + mode + ' stick: the swing came ' + r.msToSwing + ' ms after the press'); }
            const e = await T(pg, 'state'); r.targetKept = e.target; if (e.target) fail(dev + ', ' + mode + ' stick: the monster was still targeted after walking on'); await F.clear(); await sleep(300); }
          // --- two presses, the second during the first swing: two swings, then the stick walks on ---
          { const r = R['two presses, ' + mode + ' stick'] = {}, m = await T(pg, 'mon', 20, 260); if (!m) { fail(dev + ': no monster with open ground beside it (two presses)'); continue; } const st = await steer(mode, m.d); await T(pg, 'place'); await T(pg, 'start');
            const b = await centre(pg, '#bAtk'), t0 = await T(pg, 'now'); let f2 = await F.down(b[0], b[1]); await sleep(60); await F.up(f2); await sleep(130); f2 = await F.down(b[0], b[1]); await sleep(60); await F.up(f2); await sleep(2000);
            const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t0 + 2200); r.swings = sw.length; r.walkedAfter = sw.length ? moved(s, sw[sw.length - 1] + 350, sw[sw.length - 1] + 1150) : -1;
            if (sw.length !== 2) fail(dev + ', ' + mode + ' stick: two presses of attack made ' + sw.length + ' swings, expected 2'); if (r.walkedAfter < 50) fail(dev + ', ' + mode + ' stick: after two swings the held stick walked only ' + r.walkedAfter + ' px in 0.8 s'); await F.clear(); await sleep(300); }
          // --- holding the attack button: stands and keeps attacking; letting go walks on ---
          { const r = R['hold attack, ' + mode + ' stick'] = {}, m = await T(pg, 'mon', 20, 260); if (!m) { fail(dev + ': no monster with open ground beside it (hold)'); continue; } const st = await steer(mode, m.d); await T(pg, 'place'); await T(pg, 'start');
            const b = await centre(pg, '#bAtk'), t0 = await T(pg, 'now'), f2 = await F.down(b[0], b[1]); await sleep(1700); const t1 = await T(pg, 'now'); await F.up(f2); await sleep(1100);
            const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t1); r.swingsWhileHeld = sw.length; r.movedWhileHeld = sw.length ? moved(s, sw[0], t1) : -1; r.walkedAfterRelease = moved(s, t1 + 300, t1 + 1000); r.swingsAfterRelease = swingTimes(s, t1 + 300, t1 + 1100).length;
            if (sw.length < 2) fail(dev + ', ' + mode + ' stick: holding attack 1.7 s made ' + sw.length + ' swings, expected 2 or more'); if (r.movedWhileHeld > 8) fail(dev + ', ' + mode + ' stick: moved ' + r.movedWhileHeld + ' px while attack was held');
            if (r.walkedAfterRelease < 45) fail(dev + ', ' + mode + ' stick: after letting go of attack the stick walked only ' + r.walkedAfterRelease + ' px in 0.7 s'); if (r.swingsAfterRelease) fail(dev + ', ' + mode + ' stick: ' + r.swingsAfterRelease + ' swings after letting go and walking away');
            await F.clear(); await sleep(300); }
          // --- the monster is too far: no stand-still, the stick keeps walking, a hint says why ---
          { const r = R['attack out of reach, ' + mode + ' stick'] = {}, m = await T(pg, 'mon', 120, 160); if (!m) { fail(dev + ': no monster with 280 px of open ground'); } else {
              const st = await steer(mode, m.d); await T(pg, 'place'); await T(pg, 'start'); const b = await centre(pg, '#bAtk'), t0 = await T(pg, 'now'), f2 = await F.down(b[0], b[1]); await sleep(80); await F.up(f2); await sleep(700);
              const s = await T(pg, 'stop'), e = await T(pg, 'state'); r.swings = swingTimes(s, t0, t0 + 700).length; r.walked = moved(s, t0 + 60, t0 + 560); r.hint = e.msg; r.target = e.target;
              if (r.swings) fail(dev + ', ' + mode + ' stick: swung at a monster 120 px away'); if (r.walked < 40) fail(dev + ', ' + mode + ' stick: an out-of-reach attack stopped the walk (' + r.walked + ' px in 0.5 s)');
              if (!/ระยะ/.test(r.hint)) fail(dev + ', ' + mode + ' stick: no out-of-reach hint (message: "' + r.hint + '")'); if (r.target) fail(dev + ', ' + mode + ' stick: the far monster stayed targeted'); await F.clear(); await sleep(300); } }
          // --- "explore" on the big button beside a crystal, with the stick held: the question opens ---
          { const r = R['explore, ' + mode + ' stick'] = {}, c = await T(pg, 'crystal', 38, 200); if (!c) { fail(dev + ': no crystal with open ground beside it'); } else {
              const st = await steer(mode, c.d); await T(pg, 'place'); const b = await centre(pg, '#bAtk'), f2 = await F.down(b[0], b[1]); await sleep(80); await F.up(f2); await sleep(150); const mid = await T(pg, 'state'); await sleep(2300); const e = await T(pg, 'state');
              r.stickHeldUntilQuestion = mid.stick || mid.modal; r.question = e.modal; if (!e.modal) fail(dev + ', ' + mode + ' stick: "explore" pressed while steering did not open the question');
              if (!mid.stick && !mid.modal) fail(dev + ', ' + mode + ' stick: the stick let go when the big button was pressed');   // an opening window ends the floating stick, as before
              await F.clear(); await T(pg, 'calm'); await sleep(300); } }
          // --- a second finger taps a crystal in the scene: the stick stays, the character goes there, the question opens ---
          { const r = R['tap a crystal, ' + mode + ' stick'] = {}, c = await T(pg, 'crystal', 64, 200); if (c) { const st = await steer(mode, c.d); await T(pg, 'place'); await sleep(40); const p = await T(pg, 'cScreen'), f2 = await F.down(p[0], p[1]); await sleep(90); await F.up(f2); await sleep(120);
              const mid = await T(pg, 'state'); await sleep(2600); const e = await T(pg, 'state'); r.stickHeldAfterTap = mid.stick; r.question = e.modal; r.zoomSame = e.zoom === mid.zoom && !/🔍/.test(mid.msg);
              if (!mid.stick) fail(dev + ', ' + mode + ' stick: a second finger on the scene ended the stick'); if (!e.modal) fail(dev + ', ' + mode + ' stick: tapping a crystal while steering did not open the question'); if (!r.zoomSame) fail(dev + ', ' + mode + ' stick: tapping the scene while steering zoomed or showed the zoom message ("' + mid.msg + '")');
              await F.clear(); await T(pg, 'calm'); await sleep(300); } }
          // --- steering a clearly new way cancels the command, the way moving always did ---
          { const r = R['new direction cancels, ' + mode + ' stick'] = {}, c = await T(pg, 'crystal', 64, 200); if (c && (c.up >= 110 || c.down >= 110)) { const side = c.up >= 110 ? [0, -1] : [0, 1];
              const st = await steer(mode, c.d); await T(pg, 'place'); await sleep(40); const p = await T(pg, 'cScreen'), f2 = await F.down(p[0], p[1]); await sleep(70); await F.up(f2); await sleep(60); const on = await T(pg, 'state');
              await F.move(st.id, st.j[0] + side[0] * 26, st.j[1] + side[1] * 26); await sleep(260); const off = await T(pg, 'state'); await sleep(2000); const e = await T(pg, 'state');
              r.commandOn = on.act; r.afterTurn = off.act; r.question = e.modal; r.walked = Math.round(Math.hypot(e.x - off.x, e.y - off.y));
              if (on.act !== 'crystal') fail(dev + ', ' + mode + ' stick: the crystal tap was not being carried out (' + on.act + ')'); if (off.act) fail(dev + ', ' + mode + ' stick: steering a new way did not cancel the walk to the crystal'); if (e.modal) fail(dev + ', ' + mode + ' stick: the question opened after the walk was cancelled');
              if (r.walked < 60) fail(dev + ', ' + mode + ' stick: after cancelling, the stick walked only ' + r.walked + ' px in 2 s'); await F.clear(); await T(pg, 'calm'); await sleep(300); } else fail(dev + ': no crystal with room to turn aside'); }
          // --- no zoom while steering: the stick finger keeps moving, the other finger holds a button, then the scene ---
          { const r = R['zoom, ' + mode + ' stick'] = {}; await T(pg, 'noMon'); const z0 = await T(pg, 'state'), j = stickAt(mode), id = await F.down(j[0], j[1]); await sleep(50); let a = 0;
            const circle = async ms => { const t = Date.now(); while (Date.now() - t < ms) { a += .4; await F.move(id, j[0] + 30 * Math.cos(a), j[1] + 30 * Math.sin(a)); await sleep(22); } };
            await circle(250); const b = await centre(pg, '#bAtk'), f2 = await F.down(b[0], b[1]); await circle(450); await F.up(f2); await circle(150);
            const gp = [Math.round(w * .7), Math.round(h * .45)], f3 = await F.down(gp[0], gp[1]); await circle(450); const mid = await T(pg, 'state'); await F.up(f3); await circle(200); const e = await T(pg, 'state');
            r.zoom = [z0.zoom, mid.zoom, e.zoom]; r.saved = [z0.saved, e.saved]; r.stickHeld = e.stick; r.msg = e.msg;
            if (mid.zoom !== z0.zoom || e.zoom !== z0.zoom) fail(dev + ', ' + mode + ' stick: the view zoomed while steering: ' + r.zoom.join(' → ')); if (e.saved !== z0.saved) fail(dev + ', ' + mode + ' stick: the saved zoom changed ' + r.saved.join(' → '));
            if (!e.stick) fail(dev + ', ' + mode + ' stick: the stick let go when a second finger touched the ground'); if (/🔍/.test(e.msg) || /🔍/.test(mid.msg)) fail(dev + ', ' + mode + ' stick: the zoom message showed without a zoom'); await F.clear(); await sleep(300); }
        }
        // --- the old rule stays: attack first, then start steering = walk away and stop attacking ---
        { const r = R['steer after attack (old rule)'] = {}, m = await T(pg, 'mon', 20, 260); await T(pg, 'start'); const b = await centre(pg, '#bAtk'), t0 = await T(pg, 'now'); await pg.touchscreen.tap(b[0], b[1]); await sleep(1300);
          const t1 = await T(pg, 'now'), j = joyC, id = await F.down(j[0], j[1]); await sleep(50); await F.move(id, j[0] + m.d[0] * 24, j[1] + m.d[1] * 24); await sleep(1200); const s = await T(pg, 'stop'), e = await T(pg, 'state');
          r.swingsStanding = swingTimes(s, t0, t1).length; r.swingsAfterSteering = swingTimes(s, t1 + 300, t1 + 1200).length; r.walked = moved(s, t1 + 200, t1 + 1100); r.target = e.target;
          if (r.swingsStanding < 2) fail(dev + ': standing still, attack made ' + r.swingsStanding + ' swings in 1.3 s'); if (r.swingsAfterSteering) fail(dev + ': kept attacking (' + r.swingsAfterSteering + ' swings) after steering away'); if (r.walked < 60) fail(dev + ': steering after an attack walked only ' + r.walked + ' px'); if (e.target) fail(dev + ': the monster stayed targeted after steering away');
          await F.clear(); await sleep(300); }
        // --- pinch zoom still works: two fingers on the scene, no stick ---
        { const r = R['pinch zoom'] = {}; await T(pg, 'noMon'); await T(pg, 'calm'); const z0 = await T(pg, 'state'), y = Math.round(h * .22), a = await F.down(Math.round(w * .56), y); await sleep(60); const b2 = await F.down(Math.round(w * .68), y); await sleep(60);
          for (let i = 1; i <= 8; i++) { await F.move(a, Math.round(w * (.56 - .012 * i)), y); await F.move(b2, Math.round(w * (.68 + .012 * i)), y); await sleep(30); } const e = await T(pg, 'state'); await F.clear(); await sleep(300);
          r.zoom = [z0.zoom, e.zoom]; if (!(e.zoom > z0.zoom)) fail(dev + ': spreading two fingers on the scene did not zoom in (' + r.zoom.join(' → ') + ')'); }
        await pg.screenshot({ path: path.join(out, dev + '-adult.png') }); await ctx.close(); }
      // ---------- a 7-year-old ----------
      { const { ctx, pg } = await player(browser, w, h, true, 7), cdp = await pg.createCDPSession(), F = fingers(cdp), joyC = await centre(pg, '#joy');
        const stickAt = mode => mode === 'corner' ? joyC : [Math.round(w * .3), Math.round(h * .62)];
        const steer = async (mode, d) => { const j = stickAt(mode), id = await F.down(j[0], j[1]); await sleep(50); await F.move(id, j[0] + d[0] * 24, j[1] + d[1] * 24); await sleep(140); return { id, j }; };
        { const d = await T(pg, 'freeDir', 110), r = R['child sits while steering'] = {}; if (d) { await T(pg, 'calm'); const st = await steer('zone', d); await sleep(200); const b = await centre(pg, '#bRest'), f2 = await F.down(b[0], b[1]); await sleep(90); await F.up(f2); await sleep(500);
            const a = await T(pg, 'state'); r.sat = a.sit; r.stickHeld = a.stick; if (!a.sit) fail(dev + ' child: the sit button did not sit while the stick was held');
            await F.move(st.id, st.j[0] - d[0] * 24, st.j[1] - d[1] * 24); await sleep(450); const c = await T(pg, 'state'); r.stoodAfterNewDirection = !c.sit; if (c.sit) fail(dev + ' child: steering a new way did not stand up'); await F.clear(); await sleep(300); } else fail(dev + ' child: no open ground to test sitting'); }
        for (const mode of sticks) {
          { const r = R['child explores, ' + mode + ' stick'] = {}, c = await T(pg, 'crystal', 38, 200); if (!c) { fail(dev + ' child: no crystal with open ground beside it'); continue; }
            const st = await steer(mode, c.d); await T(pg, 'place'); const b = await centre(pg, '#bAtk'), f2 = await F.down(b[0], b[1]); await sleep(80); await F.up(f2); await sleep(2500); const e = await T(pg, 'state');
            r.question = e.modal; if (!e.modal) fail(dev + ' child, ' + mode + ' stick: the big button beside a crystal did not open the question while steering'); await F.clear(); await T(pg, 'calm'); await sleep(300); }
          { const r = R['child taps a crystal, ' + mode + ' stick'] = {}, c = await T(pg, 'crystal', 64, 200); if (c) { const st = await steer(mode, c.d); await T(pg, 'place'); await sleep(40); const p = await T(pg, 'cScreen'), f2 = await F.down(p[0], p[1]); await sleep(90); await F.up(f2); await sleep(120);
              const mid = await T(pg, 'state'); await sleep(2600); const e = await T(pg, 'state'); r.stickHeldAfterTap = mid.stick; r.question = e.modal;
              if (!mid.stick) fail(dev + ' child, ' + mode + ' stick: a second finger on the scene ended the stick'); if (!e.modal) fail(dev + ' child, ' + mode + ' stick: tapping a crystal while steering did not open the question'); await F.clear(); await T(pg, 'calm'); await sleep(300); } }
        }
        await pg.screenshot({ path: path.join(out, dev + '-child.png') }); await ctx.close(); }
    }
    // ================= computer: keys, then a stand-in gamepad =================
    if (!only || only === 'computer') { const R = results.computer = {}, { ctx, pg } = await player(browser, 1366, 768, false, 30), key = d => d[0] > 0 ? 'd' : d[0] < 0 ? 'a' : d[1] > 0 ? 's' : 'w';
      { const r = R['Space once while a key walks'] = {}, m = await T(pg, 'mon', 20, 260), k = key(m.d); await pg.keyboard.down(k); await sleep(200); await T(pg, 'place'); await T(pg, 'start'); const t0 = await T(pg, 'now'); await pg.keyboard.down(' '); await sleep(60); await pg.keyboard.up(' '); await sleep(1700);
        const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t0 + 1700); await pg.keyboard.up(k); r.swings = sw.length; r.hpLost = hpLost(s, t0, t0 + 1700); if (sw.length) { r.movedDuringSwing = moved(s, sw[0], sw[0] + 200); r.walkedAfter = moved(s, sw[0] + 350, sw[0] + 1150); }
        if (sw.length !== 1) fail('computer: Space once while walking made ' + sw.length + ' swings, expected 1'); if (!(r.hpLost > 0)) fail('computer: the monster lost ' + r.hpLost + ' HP'); if (sw.length && r.movedDuringSwing > 6) fail('computer: moved ' + r.movedDuringSwing + ' px during the swing');
        if (sw.length && r.walkedAfter < 50) fail('computer: after the swing the held key walked only ' + r.walkedAfter + ' px'); await sleep(300); }
      { const r = R['Space held while a key walks'] = {}, m = await T(pg, 'mon', 20, 260), k = key(m.d); await pg.keyboard.down(k); await sleep(200); await T(pg, 'place'); await T(pg, 'start'); const t0 = await T(pg, 'now'); await pg.keyboard.down(' '); await sleep(1700); const t1 = await T(pg, 'now'); await pg.keyboard.up(' '); await sleep(1100);
        const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t1); await pg.keyboard.up(k); r.swingsWhileHeld = sw.length; r.movedWhileHeld = sw.length ? moved(s, sw[0], t1) : -1; r.walkedAfterRelease = moved(s, t1 + 300, t1 + 1000);
        if (sw.length < 2) fail('computer: holding Space 1.7 s made ' + sw.length + ' swings, expected 2 or more'); if (r.movedWhileHeld > 8) fail('computer: moved ' + r.movedWhileHeld + ' px while Space was held'); if (r.walkedAfterRelease < 45) fail('computer: after letting go of Space the held key walked only ' + r.walkedAfterRelease + ' px'); await sleep(300); }
      { const r = R['Space explores while a key walks'] = {}, c = await T(pg, 'crystal', 38, 200), k = key(c.d); await pg.keyboard.down(k); await sleep(200); await T(pg, 'place'); await pg.keyboard.press(' '); await sleep(2500); const e = await T(pg, 'state'); await pg.keyboard.up(k);
        r.question = e.modal; if (!e.modal) fail('computer: Space beside a crystal did not open the question while a key was held'); await T(pg, 'calm'); await sleep(300); }
      // a stand-in gamepad (not a real one): the stick axes and button 0, read by the game's own gamepad code
      { await pg.evaluate(() => { window.__pad = { connected: true, axes: [0, 0], buttons: Array.from({ length: 12 }, () => ({ pressed: false })) }; Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad], configurable: true }); });
        const r = R['gamepad button while its stick walks (stand-in)'] = {}, m = await T(pg, 'mon', 20, 260); await pg.evaluate(d => { window.__pad.axes = [d[0] * .8, d[1] * .8]; }, m.d); await sleep(250); await T(pg, 'place'); await T(pg, 'start'); const t0 = await T(pg, 'now');
        await pg.evaluate(() => { window.__pad.buttons[0].pressed = true; }); await sleep(90); await pg.evaluate(() => { window.__pad.buttons[0].pressed = false; }); await sleep(1700); const s = await T(pg, 'stop'), sw = swingTimes(s, t0, t0 + 1700);
        r.swings = sw.length; if (sw.length) { r.movedDuringSwing = moved(s, sw[0], sw[0] + 200); r.walkedAfter = moved(s, sw[0] + 350, sw[0] + 1150); }
        if (sw.length !== 1) fail('gamepad stand-in: one press while its stick walks made ' + sw.length + ' swings, expected 1'); if (sw.length && r.movedDuringSwing > 6) fail('gamepad stand-in: moved ' + r.movedDuringSwing + ' px during the swing'); if (sw.length && r.walkedAfter < 50) fail('gamepad stand-in: after the swing the stick walked only ' + r.walkedAfter + ' px');
        await pg.evaluate(() => { window.__pad.axes = [0, 0]; window.__pad.connected = false; }); await sleep(300); }
      await pg.screenshot({ path: path.join(out, 'computer-adult.png') }); await ctx.close(); }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
