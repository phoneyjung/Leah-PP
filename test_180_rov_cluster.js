// Version 1.80 (Claude, owner's order of 9 Oct with an RoV settings screenshot): the button cluster for players 12+ laid out the RoV way —
// 2.00 (owner 9 Oct 17:22, RoV screenshot): skills in an arc around the attack button — skill 1 left (between the bottom row and the attack), skill 2 up-left, skill 3 on top;
//   the bottom row is buff · potion · blink; standing by a dig spot shows the small action button #bCtx200 at the attack button's lower left, the big button keeps "attack".
// bottom row from the left: buff slot (one support skill) · potion · blink · skill 1; skill 2 up-left of the attack button; skill 3 (the ultimate) above it;
// above the cluster the bot button (one tap on/off, hold for its settings) and, flush right beside it, the guide button (1.83: dim until a destination is picked from its list; a tap then walks there).
// Measured through the screen (phone 844×390 with real taps, computer 1180×820 with clicks and keys): where every button sits and that none overlap,
// what each press DOES (buff effect and cooldown, bot on/off and its settings on a hold, the bot walking to a drop, the guide walking to a sleeping crystal,
// to the way down, and to an NPC whose request is ready), and that a child's screen has none of it.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_180_rov_cluster.js   (serve the repo root first)
// Versions up to 1.79 give errors 6 and then stop at the first missing button (no buff slot, no guide, the bot button hidden on phones); 1.80 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-180-rov'; fs.mkdirSync(out, { recursive: true });
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
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1200);
  await pg.evaluate(() => {
    const T = window.__t180 = {};
    // setup only: a level-12 swordsman with three skills learned, rank 6 (bot and blink open), one potion charge in hand
    T.adult = () => { S.rank = 6; S.lv = 12; S.job = 'sword'; S.jp = { sword: 0 }; S.learn = ['bash', 'guard', 'provoke']; S.slots = ['bash', 'provoke']; S.slotBuff = 'guard'; S.hp = hpMax(); S.potions = 3; S.st.dex = 99; hud(); };
    T.calm = () => { try { closeModal(); } catch (e) { } PAUSE = false; P.sit = null; P.target = null; P.act = null; P.path = null; P.dead = 0; AUTO.on = false; try { HOLD = null; } catch (e) { } S.hp = hpMax(); hud(); };
    T.go = async id => { if (M.id !== id) { goMap(id); await new Promise(r => setTimeout(r, 1500)); } T.calm(); for (const m of MONS) m.x += 6000; };
    T.rect = id => { const b = document.getElementById(id); if (!b) return null; const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, shown: cs.display !== 'none' && r.width > 0, label: (b.querySelector('small') || {}).textContent || '', cls: b.className }; };
    T.all = () => { const o = {}; for (const id of ['bAtk', 'bSk', 'bJ1', 'bJ2', 'bDash', 'bPot', 'bBuff', 'bAuto', 'bQuest', 'bRest', 'bCmp', 'mm', 'bCtx200']) o[id] = T.rect(id); return o; };
    T.state = () => ({ map: M.id, x: P.x, y: P.y, path: !!(P.path && P.path.length), pathLen: P.path ? P.path.length : 0, auto: !!AUTO.on, guard: !!(S.eff && S.eff.guard > performance.now()), guardCd: ((JCD.guard || 0) - performance.now()) / 1000,
      modal: !document.getElementById('modal').classList.contains('hide'), modalAuto: !!document.getElementById('aGo'), modalJobs: !!document.querySelector('[data-slb]'), msg: +document.getElementById('msg').style.opacity > 0 ? document.getElementById('msg').textContent : '',
      rov: document.body.classList.contains('rov180'), slotBuff: S.slotBuff || null, coins: S.coins, drops: DROPS.filter(d => !d.taken).length, buffOn: document.getElementById('bBuff') ? document.getElementById('bBuff').classList.contains('cd179on') : null });
    T.tx = k => t(k);
    T.nearestSleeping = () => { const cs = (M.crystals || []).filter(c => !c.awake); let b = null, d = 1e9; for (const c of cs) { const n = Math.hypot(c.x - P.x, c.y - P.y); if (n < d) { d = n; b = c; } } return b ? { x: b.x, y: b.y, d: Math.round(d) } : null; };
    T.exitN = () => { const e = (M.exits || []).find(e => e.id === 'n' || e.id === 'down'); return e ? { x: e.x, y: e.y, to: e.to } : null; };
  });
  return { ctx, pg };
}
const T = (pg, fn, ...a) => pg.evaluate((fn, a) => window.__t180[fn](...a), fn, a);
const overlap = (a, b) => a && b && a.shown && b.shown && a.x < b.x + b.w - 2 && b.x < a.x + a.w - 2 && a.y < b.y + b.h - 2 && b.y < a.y + a.h - 2;
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(25); } return -1; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [dev, w, h, touch] of [['phone', 844, 390, true], ['computer', 1180, 820, false]]) {
      const { ctx, pg } = await player(browser, w, h, touch, 30); const R = results[dev] = {};
      const tap = async id => { const r = await T(pg, 'rect', id); if (!r || !r.shown) { fail(dev + ': ' + id + ' not on screen to press'); return; } if (touch) await pg.touchscreen.tap(r.cx, r.cy); else await pg.mouse.click(r.cx, r.cy); };
      const hold = async (id, ms) => { const r = await T(pg, 'rect', id); if (touch) { await pg.touchscreen.touchStart(r.cx, r.cy); await sleep(ms); await pg.touchscreen.touchEnd(); } else { await pg.mouse.move(r.cx, r.cy); await pg.mouse.down(); await sleep(ms); await pg.mouse.up(); } };
      await pg.evaluate(() => window.__t180.adult()); await T(pg, 'go', 'cavemouth'); await sleep(700);

      // A · the layout
      { const A = R.layout = {}; const o = await T(pg, 'all'); A.shown = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, !!(v && v.shown)]));
        for (const id of ['bAtk', 'bSk', 'bJ1', 'bJ2', 'bDash', 'bPot', 'bBuff', 'bAuto', 'bQuest']) if (!o[id] || !o[id].shown) fail(dev + ': ' + id + ' not shown');
        { const row = ['bBuff', 'bPot', 'bDash', 'bAtk'].map(id => o[id]).filter(Boolean); A.rowX = row.map(r => Math.round(r.cx));   // 1.84: the computer has the phone layout too
          for (let i = 1; i < row.length; i++) if (!(row[i].cx > row[i - 1].cx + 30)) fail(dev + ': bottom row out of order at ' + i + ': ' + A.rowX.join(','));
          const bottoms = row.map(r => Math.round(r.y + r.h)); A.rowBottom = bottoms; if (Math.max(...bottoms) - Math.min(...bottoms) > 6) fail(dev + ': bottom row not level: ' + bottoms.join(','));
          if (!(o.bJ1.cx > o.bDash.cx + 30 && o.bJ1.cx < o.bAtk.cx - 60 && o.bJ1.cy < o.bAtk.cy && o.bJ1.cy > o.bJ2.cy + 30)) fail(dev + ': skill 1 not left of the attack button between the bottom row and skill 2'); if (!(o.bJ2.cy < o.bAtk.cy - 30 && o.bJ2.cx < o.bAtk.cx - 30)) fail(dev + ': skill 2 not up-left of the attack button'); if (!(o.bSk.cy < o.bAtk.cy - 50 && Math.abs(o.bSk.cx - o.bAtk.cx) < 30)) fail(dev + ': skill 3 not above the attack button');
          if (!(o.bAuto.cy < o.bDash.cy - 60)) fail(dev + ': bot button not above the cluster'); if (!(Math.abs(o.bQuest.cy - o.bAuto.cy) < 4 && o.bQuest.x > o.bAuto.x + o.bAuto.w - 2)) fail(dev + ': guide button not beside (right of) the bot button');
          if (!(o.bQuest.x + o.bQuest.w >= o.bAtk.x + o.bAtk.w - 4)) fail(dev + ': guide button not flush right (' + Math.round(o.bQuest.x + o.bQuest.w) + ' vs ' + Math.round(o.bAtk.x + o.bAtk.w) + ')'); if (o.mm && o.mm.shown && !(o.bQuest.y > o.mm.y + o.mm.h + 4)) fail(dev + ': guide button not below the minimap'); }
        // 1.84: on a computer every cluster button carries a small key tag; on a phone the tags stay hidden
        A.tags = await pg.evaluate(() => { const o = {}; for (const id of ['bAtk', 'bSk', 'bJ1', 'bJ2', 'bPot', 'bBuff', 'bDash', 'bAuto', 'bQuest']) { const t = document.querySelector('#' + id + ' .kb184'); o[id] = t ? [t.dataset.k, getComputedStyle(t).display] : null; } return o; });
        const wantKeys = { bAtk: 'Space', bSk: '3', bJ1: '1', bJ2: '2', bPot: '4', bBuff: '5', bDash: 'Shift', bAuto: 'B', bQuest: 'G' };
        for (const [id, k] of Object.entries(wantKeys)) { const t = A.tags[id]; if (!touch) { if (!t || t[0] !== k || t[1] === 'none') fail(dev + ': key tag on ' + id + ' is ' + JSON.stringify(t) + ' (want ' + k + ', shown)'); } else if (t && t[1] !== 'none') fail(dev + ': key tag shown on a phone (' + id + ')'); }
        const ids = ['bAtk', 'bSk', 'bJ1', 'bJ2', 'bDash', 'bPot', 'bBuff', 'bAuto', 'bQuest', 'bCmp', 'bRest', 'mm', 'bCtx200']; A.overlaps = [];
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (overlap(o[ids[i]], o[ids[j]])) A.overlaps.push(ids[i] + '+' + ids[j]); if (A.overlaps.length) fail(dev + ': overlapping buttons ' + A.overlaps.join(' '));
        for (const id of ids) { const r = o[id]; if (r && r.shown && (r.x < 0 || r.y < 0 || r.x + r.w > w + 1 || r.y + r.h > h + 1)) fail(dev + ': ' + id + ' outside the screen'); }
        A.labels = { buff: o.bBuff.label, quest: o.bQuest.label }; if (o.bBuff.label !== (await T(pg, 'tx', 'k_guard')).split(' ')[0]) fail(dev + ': buff slot label "' + o.bBuff.label + '"'); if (o.bQuest.label !== await T(pg, 'tx', 'guideBtn')) fail(dev + ': guide label "' + o.bQuest.label + '"');
        await pg.screenshot({ path: out + '/' + dev + '_layout.png' }); }
      // A2 · 2.00: beside a dig spot the small action button sits at the attack button's lower left, smaller than it, overlapping nothing
      { const back = await pg.evaluate(() => { const d = (M.digs || []).find(x => !x.done); if (!d) return null; const b = [P.x, P.y]; P.x = d.x; P.y = d.y; P.path = null; P.act = null; P.target = null; return b; }); await sleep(800); const o = await T(pg, 'all'), c = o.bCtx200;
        R.ctx = c ? { cx: Math.round(c.cx), cy: Math.round(c.cy), w: Math.round(c.w), shown: c.shown } : null;
        if (!back) fail(dev + ': no dig spot to stand by'); else if (!c || !c.shown || !(c.cx < o.bAtk.cx - 30 && c.cy > o.bAtk.cy - 4 && c.w < o.bAtk.w * .7)) fail(dev + ': small action button ' + JSON.stringify(R.ctx));
        else { const ov = ['bAtk', 'bSk', 'bJ1', 'bJ2', 'bDash', 'bPot', 'bBuff', 'bCmp', 'bRest'].filter(id => overlap(c, o[id])); if (ov.length) fail(dev + ': small action button overlaps ' + ov.join(' ')); }
        if (back) await pg.evaluate(b => { P.x = b[0]; P.y = b[1]; P.path = null; P.act = null; }, back); await sleep(400); }

      // B · the buff slot: a press casts the buff, the sweep shows; an empty slot says so and opens the jobs window; the jobs window has a Buff slot button
      { const B = R.buff = {}; await tap('bBuff'); await sleep(150); const s1 = await T(pg, 'state'); B.guard = s1.guard; B.cd = +s1.guardCd.toFixed(1); B.sweep = s1.buffOn;
        if (!s1.guard) fail(dev + ': buff press did not cast guard'); if (!(s1.guardCd > 10)) fail(dev + ': guard cooldown not set (' + s1.guardCd + ')'); if (!s1.buffOn) fail(dev + ': no cooldown sweep on the buff slot');
        await pg.evaluate(() => { S.slotBuff = null; S.eff = {}; JCD.guard = 0; hud(); }); await sleep(400); const r2 = await T(pg, 'rect', 'bBuff'); B.emptyLabel = r2.label; if (!/empty180/.test(r2.cls)) fail(dev + ': empty buff slot not drawn as empty');
        await tap('bBuff'); await sleep(400); const s2 = await T(pg, 'state'); B.emptyMsg = s2.msg; B.jobsOpened = s2.modalJobs; if (!s2.modalJobs) fail(dev + ': empty buff slot did not open the jobs window with a Buff slot button');
        const slb = await pg.$('[data-slb="guard"]'); if (slb) { await slb.click(); await sleep(400); } const s3 = await T(pg, 'state'); B.setBack = s3.slotBuff; if (s3.slotBuff !== 'guard') fail(dev + ': the Buff slot button did not set guard (' + s3.slotBuff + ')');
        await pg.evaluate(() => window.__t180.calm()); await sleep(300); }

      // C · the bot button: a tap on an uncleared floor refuses with the message; once cleared, tap = on, tap = off; a hold opens the settings; the bot walks to a drop
      { const C = R.bot = {}; await tap('bAuto'); await sleep(300); const s1 = await T(pg, 'state'); C.refuseMsg = s1.msg; C.refusedOff = !s1.auto; if (s1.auto) fail(dev + ': bot started on an uncleared floor'); if (s1.msg !== await T(pg, 'tx', 'autoNo')) fail(dev + ': uncleared floor message "' + s1.msg + '"');
        await pg.evaluate(() => { S.cleared = S.cleared || {}; S.cleared[M.id] = 1; }); await tap('bAuto'); await sleep(300); const s2 = await T(pg, 'state'); C.on = s2.auto; if (!s2.auto) fail(dev + ': bot did not start on a cleared floor (' + s2.msg + ')');
        const outline = await pg.evaluate(() => getComputedStyle(document.getElementById('bAuto')).outlineStyle); C.outline = outline; if (outline === 'none') fail(dev + ': bot button not marked while on');
        // the bot walks to a coin 150 px away (no monsters anywhere) and picks it up
        await pg.evaluate(() => { P.path = null; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; for (const [dx, dy] of dirs) { const x = P.x + dx * 150, y = P.y + dy * 150; if (!blockedAt(M, x, y) && findPath(M, P.x, P.y, x, y).length) { DROPS.push({ k: 'coin', n: 7, x, y }); window.__t180.drop = { x, y }; break; } } });
        await pg.evaluate(() => { window.__c0 = S.coins; }); const got = await waitFor(pg, () => S.coins > window.__c0, 6000); C.pickupMs = got; if (got < 0) fail(dev + ': the bot did not walk to the coin within 6 s');
        await tap('bAuto'); await sleep(300); const s3 = await T(pg, 'state'); C.off = !s3.auto; if (s3.auto) fail(dev + ': second tap did not stop the bot');
        await hold('bAuto', 800); await sleep(400); const s4 = await T(pg, 'state'); C.holdSettings = s4.modalAuto; C.holdKeptOff = !s4.auto; if (!s4.modalAuto) fail(dev + ': holding the bot button did not open its settings'); if (s4.auto) fail(dev + ': the hold toggled the bot');
        await pg.evaluate(() => window.__t180.calm()); await sleep(300); }

      // D · the guide (1.83): dim until a destination is chosen — a tap opens the picker; choosing walks there; arriving clears it. Destinations: a sleeping crystal, the way to the next map, Leah with a ready request, the post office for the mail
      { const D = R.guide = {}; await pg.evaluate(() => { for (const m of MONS) m.x += 6000; P.path = null; }); const c = await T(pg, 'nearestSleeping'); D.crystalDist = c ? c.d : null;
        const q0 = await T(pg, 'rect', 'bQuest'); D.dimBefore = /dim183/.test(q0.cls); if (!D.dimBefore) fail(dev + ': guide button not dim before a destination is chosen');
        const pick = async (match, label) => { await tap('bQuest'); await sleep(350); const items = await pg.evaluate(() => [...document.querySelectorAll('[data-gd]')].map(b => b.textContent)); if (!items.length) { fail(dev + ': ' + label + ': the picker did not open'); return null; }
          const i = items.findIndex(x => x.includes(match)); if (i < 0) { fail(dev + ': ' + label + ': no entry "' + match + '" in ' + items.join(' | ')); await pg.evaluate(() => closeModal()); return null; } const el = await pg.$('[data-gd="' + i + '"]'); try { await el.scrollIntoView(); await el.click(); } catch (e) { await pg.evaluate(i => document.querySelector('[data-gd="' + i + '"]').click(), i); } await sleep(150); return items; };
        D.items1 = await pick(await T(pg, 'tx', 'gdCry'), 'crystal'); const s1 = await T(pg, 'state'); D.msg1 = s1.msg; D.pathSet = s1.path; if (!s1.path) fail(dev + ': choosing the crystal set no path (' + s1.msg + ')');
        const q1 = await T(pg, 'rect', 'bQuest'); D.labelWhileSet = q1.label; if (/dim183/.test(q1.cls)) fail(dev + ': guide button still dim with a destination set');
        const arrived = await waitFor(pg, () => { const c = window.__t180.nearestSleeping(); return !c || c.d < 70 || (!P.path || !P.path.length); }, 12000); const c2 = await T(pg, 'nearestSleeping'); D.crystalAfter = c2 ? c2.d : null; D.arriveMs = arrived;
        if (!(c2 && c2.d < 70)) fail(dev + ': guide did not reach a sleeping crystal (' + (c2 ? c2.d : 'none') + ' px after ' + arrived + ' ms)');
        await sleep(400); const q2 = await T(pg, 'rect', 'bQuest'); D.dimAfterArrive = /dim183/.test(q2.cls); if (!D.dimAfterArrive) fail(dev + ': guide button not dim again after arriving');
        await pg.evaluate(() => { P.path = null; P.target = null; try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(300); const ex = await T(pg, 'exitN'); D.exit = ex;
        D.items2 = await pick(await T(pg, 'tx', 'gdMap'), 'exit'); const s2 = await T(pg, 'state'); D.msg2 = s2.msg; if (!s2.path) fail(dev + ': choosing the next map set no path (' + s2.msg + ')');
        const far = await pg.evaluate(() => { const e = window.__t180.exitN(); return e ? Math.hypot(e.x - P.x, e.y - P.y) : 0; }); const left = await waitFor(pg, () => { const e = window.__t180.exitN(); return !e || M.id !== 'cavemouth' || Math.hypot(e.x - P.x, e.y - P.y) < 40; }, 15000); const s3 = await T(pg, 'state'); D.exitResult = { from: Math.round(far), ms: left, map: s3.map };
        if (left < 0) fail(dev + ': guide did not reach the way to the next map');
        // in town: a request that is ready to hand in leads to that NPC, and the mail entry leads to the post office
        await T(pg, 'go', 'capital'); await pg.evaluate(() => { S.days = S.days || {}; const r = reqBase(); S.days[today()] = Object.assign(S.days[today()] || {}, { q: r.base.q + 5 }); updateGoal(); }); await sleep(700);
        const npc = await pg.evaluate(() => { const n = (M.npcs || []).find(n => n.npc === 'leah'); return n ? { x: n.x, y: n.y, mark: REQMARK[n.npc], d: Math.round(Math.hypot(n.x - P.x, n.y - P.y)) } : null; }); D.npc = npc;
        if (!npc) D.npcNote = 'no Leah on this map, skipped'; else if (npc.mark !== 'ready') fail(dev + ': Leah\'s request not marked ready (' + npc.mark + ')'); else { D.items3 = await pick(await T(pg, 'tx', 'gdNpc'), 'npc'); const s4 = await T(pg, 'state'); D.msg3 = s4.msg; if (!s4.path) fail(dev + ': choosing Leah set no path');
          const near = await waitFor(pg, () => { const n = (M.npcs || []).find(n => n.npc === 'leah'); return n && Math.hypot(n.x - P.x, n.y - P.y) < 60; }, 15000); D.npcMs = near; if (near < 0) fail(dev + ': guide did not reach Leah'); }
        await pg.evaluate(() => { P.path = null; try { closeModal(); } catch (e) { } PAUSE = false; }); const mailOk = await pg.evaluate(() => !!(M.capA || M.h9) && !mailToday().got); D.mailMap = mailOk;
        if (mailOk) { D.items4 = await pick(await T(pg, 'tx', 'gdMailGet'), 'mail'); const s5 = await T(pg, 'state'); if (!s5.path) fail(dev + ': choosing the post office set no path'); const d0 = await pg.evaluate(() => { const [x, y] = mailDoorPt('post_office'); return Math.hypot(x - P.x, y - P.y); });
          const got = await waitFor(pg, () => { const [x, y] = mailDoorPt('post_office'); return Math.hypot(x - P.x, y - P.y) < 40 || !(P.path && P.path.length); }, 25000); const d1 = await pg.evaluate(() => { const [x, y] = mailDoorPt('post_office'); return Math.hypot(x - P.x, y - P.y); }); D.mail = { from: Math.round(d0), to: Math.round(d1), ms: got }; if (!(d1 < 40)) fail(dev + ': guide did not reach the post office (' + Math.round(d1) + ' px left)'); }
        await pg.evaluate(() => window.__t180.calm()); }

      // E · keys on a computer: 5 casts the buff, G guides, B toggles the bot
      if (!touch) { const E = R.keys = {}; await T(pg, 'go', 'cavemouth'); await pg.evaluate(() => { S.eff = {}; JCD.guard = 0; S.cleared = S.cleared || {}; S.cleared[M.id] = 1; P.path = null; });
        await pg.keyboard.press('5'); await sleep(150); E.guard = (await T(pg, 'state')).guard; if (!E.guard) fail('computer: key 5 did not cast the buff');
        // 1.84 numbering: 1 = skill 1 (slot 1), 2 = skill 2 (slot 2), 3 = skill 3 (the weapon skill)
        await pg.evaluate(() => { S.learn = ['bash', 'guard', 'provoke', 'evade']; S.slots = ['evade', 'provoke']; S.slotBuff = 'guard'; S.eff = {}; JCD.evade = 0; JCD.provoke = 0; P.skCd = 0; hud(); }); await sleep(200);
        await pg.keyboard.press('1'); await sleep(150); E.key1 = await pg.evaluate(() => !!(S.eff.evade > performance.now())); if (!E.key1) fail('computer: key 1 did not cast skill 1 (evade)');
        await pg.keyboard.press('2'); await sleep(150); E.key2 = await pg.evaluate(() => (JCD.provoke || 0) > performance.now()); if (!E.key2) fail('computer: key 2 did not cast skill 2 (provoke)');
        await pg.keyboard.press('3'); await sleep(150); E.key3 = await pg.evaluate(() => (P.skCd || 0) > 0); if (!E.key3) fail('computer: key 3 did not cast the weapon skill');
        await pg.keyboard.press('KeyG'); await sleep(300); E.guidePicker = await pg.evaluate(() => document.querySelectorAll('[data-gd]').length); if (!E.guidePicker) fail('computer: key G did not open the destination picker'); await pg.evaluate(() => closeModal()); await sleep(100);
        await pg.keyboard.press('KeyB'); await sleep(150); E.bot = (await T(pg, 'state')).auto; if (!E.bot) fail('computer: key B did not start the bot'); await pg.keyboard.press('KeyB'); await sleep(150); E.botOff = !(await T(pg, 'state')).auto; if (!E.botOff) fail('computer: key B did not stop the bot'); }
      await ctx.close(); }

    // F · a child (age 7) sees none of this: no rov180 class, the buff, guide and bot buttons hidden
    { const { ctx, pg } = await player(browser, 844, 390, true, 7); const K = results.kid = {}; await pg.evaluate(() => { S.lv = 12; S.rank = 6; hud(); }); await sleep(500);
      const o = await T(pg, 'all'); K.rov = await pg.evaluate(() => document.body.classList.contains('rov180')); K.shown = { buff: !!(o.bBuff && o.bBuff.shown), quest: !!(o.bQuest && o.bQuest.shown), auto: !!(o.bAuto && o.bAuto.shown), pot: !!(o.bPot && o.bPot.shown) };
      if (K.rov) fail('kid: rov180 layout applied'); for (const [k, v] of Object.entries(K.shown)) if (v) fail('kid: ' + k + ' button shown'); await pg.screenshot({ path: out + '/kid.png' }); await ctx.close(); }
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
