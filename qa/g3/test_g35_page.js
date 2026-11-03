// G3.5 page checks (Claude · 3 Nov 2569) for pilot-g3-char2.html (G3_0_RENDERER_PLAN.md step G3.5 + project rules: fallbacks, TH+EN, phone/iPad screens).
// P1 both renderers draw the 4 kids every frame (counters) · P2 4 looks x 4 houses on screen (exact palette colours in each kid's cell, other houses 0)
// P3 a colour change touches only that kid (other kids 0 px) · P4 portrait (Char2.portrait, whole-number scale, borrow returned, follows the kid)
// P5 one switch: live toggle Char2 <-> Pilot · P6 buttons >= 44 CSS px and not covered (844x390 @3, 1180x820 @2; colour panel + portrait open) + screenshots
// P7 every file the page loads blocked one at a time + all: no page error, and on the ART BUFFER (no DOM UI, no GM label · T29 N2): the scene without kids
//    has >= 12 colours and >= 2 % not its main colour, and every kid adds >= 200 px in its own cell (scene drawn with / without the kids, sim paused)
// P8 movement: bench = all 4 move · friends wander 60 s sim and never step on the door / cave mouth / gate cells · pad still walks kid 1
// P9 memory: Char2.stats().total <= 40 MiB and no borrow left after all of the above · P10 the GM 'measure FPS' button (short phases) runs and puts everything back.
// P11 (T29 N1) the portrait box never covers any part of a button: colour panel + portrait open, then 25 real clicks (kid x4, hair x8, eyes x5, skin x4,
//    house x4) = 26 states x 2 screens · overlap area 0 and 5 hit points per button (centre + 2 px inside each edge) land on the button
// usage: PORT=<server at repo root> [G35_ONLY=P7,P11] node qa/g3/test_g35_page.js [OUT.json]   (groups: P1 P2 P4 P8 P7 P11 · P2 = P2+P3 · P4 = P4+P5+P6 · P8 = P8+P9+P10)
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 8792, BASE = 'http://127.0.0.1:' + PORT + '/pilot-g3-char2.html', ROOT = path.join(__dirname, '..', '..');
const XIMG = process.env.G35_XIMG || require('os').tmpdir(), IMG = process.env.INJECT ? XIMG : path.join(__dirname, 'img'); fs.mkdirSync(IMG, { recursive: true });   // 4 key screenshots in the repo, the rest in a temp folder (repo size) · an INJECT run never writes into the repo
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, 'c2-pack.json'), 'utf8'));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RAMP = {}; for (const g of ['hair', 'iris', 'skin', 'house']) { RAMP[g] = {}; for (const [n, cols] of pack.palette[g]) RAMP[g][n] = cols.map(hex); }
const R = { inject: process.env.INJECT || null, checks: {}, fails: [], errors: [] };
const ok = (name, cond, info) => { R.checks[name] = { pass: !!cond, info }; if (!cond) R.fails.push(name); console.log((cond ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(info).slice(0, 300)); };
// INJECT (must fail, exit 1): HOUSE = every kid gets house option 0 (P2) · NOPT = portrait() gives null (P4) · S0 = the source served unchanged (must pass)
//   served as char2.src.js through page.route (the built char2.js and the page are never touched)
// page INJECT (served through page.route, the file on disk is never touched): BLANK = draw() returns at once (scene empty, UI still there) -> P7
//   NOKIDS = drawKid() draws nothing -> P7 · N1OLD = the T29 order (portrait placed before the labels change) -> P11
const INJ = process.env.INJECT || '', SRC = fs.readFileSync(path.join(ROOT, 'char2.src.js'), 'utf8'), PAGE = fs.readFileSync(path.join(ROOT, 'pilot-g3-char2.html'), 'utf8');
const INJ_SRC = { S0: SRC, HOUSE: SRC.replace("house: colourIx(p, 'house', dc.house)", 'house: 0'), NOPT: SRC.replace("portrait: (app, dc) => sheet(app, dc, 'portrait')", 'portrait: () => null') }[INJ];
const pageSwap = (pairs) => pairs.reduce((t, [a, b]) => { if (t.split(a).length !== 2) throw new Error('page inject point missing: ' + a); return t.replace(a, b); }, PAGE);
const INJ_PAGE = INJ === 'BLANK' ? pageSwap([['function draw(){', 'function draw(){return;']]) : INJ === 'NOKIDS' ? pageSwap([['function drawKid(K,ox,oy,info){', 'function drawKid(K,ox,oy,info){info.K=K;return;']]) :
  INJ === 'N1OLD' ? pageSwap([["ptBox.classList.toggle('open',ST.ptOpen);if(ST.ptOpen)ptShow()}", "ptBox.classList.toggle('open',ST.ptOpen)}"], ["tg('dKid',()=>{ST.sel=(ST.sel+1)%KIDS.length});", "tg('dKid',()=>{ST.sel=(ST.sel+1)%KIDS.length;if(ST.ptOpen)ptShow()});"],
    ["tg('bPt',()=>{ST.ptOpen=!ST.ptOpen});", "tg('bPt',()=>{ST.ptOpen=!ST.ptOpen;if(ST.ptOpen){sync();ptShow()}});"], ["tg('bDress',()=>{ST.dressOpen=!ST.dressOpen});", "tg('bDress',()=>{ST.dressOpen=!ST.dressOpen;if(ST.ptOpen){sync();ptShow()}});"]]) : null;
if (INJ && ((!INJ_SRC && !INJ_PAGE) || (INJ_SRC && INJ !== 'S0' && INJ_SRC === SRC))) throw new Error('unknown inject / inject point missing: ' + INJ);
const ONLY = (process.env.G35_ONLY || '').split(',').filter(Boolean), want = (g) => !ONLY.length || ONLY.includes(g);
const isPage = (u) => new URL(u).pathname === '/pilot-g3-char2.html';
async function open(ctx, q, routeFn) {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  if (INJ_SRC) await p.route('**/char2.js', (rt) => rt.fulfill({ status: 200, contentType: 'application/javascript', body: INJ_SRC }));
  if (INJ_PAGE) await p.route(isPage, (rt) => rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: INJ_PAGE }));
  if (routeFn) await routeFn(p);
  await p.goto(BASE + q); await p.waitForFunction('window.PG&&PG.ST.ready', null, { timeout: 30000, polling: 100 }); p.__errs = errs; return p;
}
// count px in a rect of the art buffer that are exactly one of the given colours
const countIn = (p, rect, sets) => p.evaluate(([rect, sets]) => {
  const d = PG.BUF.getContext('2d').getImageData(rect[0], rect[1], rect[2], rect[3]).data, out = {};
  for (const k in sets) { const S = new Set(sets[k].map((c) => c.join(','))); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255 && S.has(d[i] + ',' + d[i + 1] + ',' + d[i + 2])) n++; out[k] = n; }
  return out; }, [rect, sets]);
const rectPx = (p, rect) => p.evaluate((r) => Array.from(PG.BUF.getContext('2d').getImageData(r[0], r[1], r[2], r[3]).data), rect);
const SPOTS = [[3, 10], [8, 10], [18, 10], [23, 10]];
async function lineup(p) {   // 4 kids apart, facing S, idle, sim paused, no glow / night
  await p.evaluate((SPOTS) => { PG.set({ bench: false, noNight: true, fx: false }); PG.KIDS.forEach((K, i) => { K.wait = 1e12; PG.teleport(i, SPOTS[i][0], SPOTS[i][1], 'S'); });
    PG.pause(true); for (let k = 0; k < 3; k++) PG.step(16); PG.draw(); }, SPOTS);
}
const kidRects = (p) => p.evaluate(() => { PG.draw(); const o = {}; for (const k of PG.ST.last.kids) o[k.id] = [k.sx, k.sy, 96, 96]; return o; });
(async () => {
  const b = await chromium.launch(); const phone = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  // ---------- P1 ----------
  if (want('P1')) for (const r of ['char2', 'pilot']) {
    const p = await open(phone, '?gm' + (r === 'pilot' ? '&r=pilot' : ''));
    const a = await p.evaluate(() => ({ ...PG.ST.cnt })); await p.waitForTimeout(2000); const z = await p.evaluate(() => ({ cnt: { ...PG.ST.cnt }, r: PG.ST.renderer, ready: PG.C2.ready, failed: PG.C2.failed, loopErr: PG.ST.loopErr || null }));
    const fr = z.cnt.frames - a.frames, want = r === 'char2' ? z.cnt.c2 - a.c2 : z.cnt.pilot - a.pilot, other = r === 'char2' ? z.cnt.pilot - a.pilot : z.cnt.c2 - a.c2;
    ok('P1_' + r + '_4_kids_every_frame', fr > 30 && want === 4 * fr && other === 0 && z.cnt.c2fail === 0 && z.ready && !z.loopErr && p.__errs.length === 0, { frames: fr, draws: want, other, c2fail: z.cnt.c2fail, failed: z.failed, errors: p.__errs });
    await p.close();
  }
  // ---------- P2 / P3 ----------
  if (want('P2')) {
    const p = await open(phone, '?gm'); await lineup(p); const rc = await kidRects(p); const looks = await p.evaluate(() => PG.KIDS.map((K) => [K.look.hair, K.look.iris, K.look.skin, K.house]));
    const rows = [];
    for (let i = 0; i < 4; i++) {
      const sets = { own_house: RAMP.house[looks[i][3]], other_houses: Object.keys(RAMP.house).filter((h) => h !== looks[i][3]).flatMap((h) => RAMP.house[h]), own_hair: RAMP.hair[looks[i][0]], own_skin: RAMP.skin[looks[i][2]] };
      rows.push({ kid: i, look: looks[i], ...(await countIn(p, rc[i], sets)) });
    }
    ok('P2_4_looks_4_houses', new Set(looks.map((l) => l[3])).size === 4 && new Set(looks.map((l) => l[0])).size === 4 && rows.every((r) => r.own_house >= 100 && r.other_houses === 0 && r.own_hair >= 100 && r.own_skin >= 20), rows);
    await p.screenshot({ path: path.join(XIMG, 'g35-p2-lineup-char2.png') });
    // pilot: the same line-up with the old code = no recolour (reported)
    await p.evaluate(() => { PG.setRenderer('pilot'); PG.draw(); });
    const prow = []; for (let i = 0; i < 4; i++) prow.push({ kid: i, ...(await countIn(p, rc[i], { own_house: RAMP.house[looks[i][3]] })) });
    R.pilot_lineup_house_px = prow; await p.screenshot({ path: path.join(XIMG, 'g35-p2-lineup-pilot.png') });
    await p.evaluate(() => { PG.setRenderer('char2'); PG.draw(); });
    // P3: change kid 1 hair (brown -> next) · others 0 px
    const before = {}; for (let i = 1; i < 4; i++) before[i] = await rectPx(p, rc[i]);
    const old = looks[0][0], b0 = await countIn(p, rc[0], { old: RAMP.hair[old] });
    const ch = await p.evaluate(() => { PG.ST.sel = 0; PG.cycle(PG.KIDS[0], 'hair'); PG.draw(); return { hair: PG.KIDS[0].look.hair, ms: PG.ST.lastChange }; });
    const a0 = await countIn(p, rc[0], { old: RAMP.hair[old], neu: RAMP.hair[ch.hair] }); let diff = 0;
    for (let i = 1; i < 4; i++) { const now = await rectPx(p, rc[i]); for (let k = 0; k < now.length; k++) if (now[k] !== before[i][k]) diff++; }
    ok('P3_colour_change_one_kid', ch.hair !== old && a0.neu >= 0.9 * b0.old && a0.old <= 0.1 * b0.old && diff === 0, { from: old, to: ch.hair, old_px_before: b0.old, after: a0, other_kids_px_changed: diff, build_ms: ch.ms });
    R.colour_change_ms_cpu1 = ch.ms;
    await p.close();
  }
  // ---------- P4 / P5 / P6 ----------
  const SCREENS = [['phone', { width: 844, height: 390 }, 3], ['ipad', { width: 1180, height: 820 }, 2]];
  if (want('P4')) for (const [name, vp, dpr] of SCREENS) {
    const ctx = name === 'phone' ? phone : await b.newContext({ viewport: vp, deviceScaleFactor: dpr, hasTouch: true });
    const p = await open(ctx, '?gm');
    const btnCheck = async () => p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('button')) { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).display === 'none' || el.closest('[style*="display: none"]')) continue;
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue; const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      out.push({ id: el.id || el.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), free: top === el || el.contains(top) }); } return out; });
    const closed = await btnCheck();
    await p.click('#bDress'); await p.click('#bPt'); await p.waitForTimeout(300);
    const opened = await btnCheck();
    const bad = (L) => L.filter((x) => x.w < 44 || x.h < 44 || !x.free);
    ok('P6_' + name + '_buttons_44_free', closed.length >= 16 && opened.length >= 22 && bad(closed).length === 0 && bad(opened).length === 0, { closed: closed.length, open: opened.length, bad: bad(closed).concat(bad(opened)) });
    // P4 portrait
    const pt = await p.evaluate(() => { const c = document.getElementById('pt'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] === 255) n++;
      const r = c.getBoundingClientRect(); return { ok: PG.ST.ptOk, k: PG.ST.ptK, w: c.width, cssW: +r.width.toFixed(2), dpr: devicePixelRatio, opaque: n, stats: Char2.stats(), cap: document.getElementById('ptCap').textContent }; });
    const ptPx = async () => p.evaluate(() => { const c = document.getElementById('pt'); return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.filter((v, i) => i % 97 === 0)); });
    const first = await ptPx(); await p.click('#dKid'); await p.waitForTimeout(100); const second = await ptPx();
    let pd = 0; for (let i = 0; i < first.length; i++) if (first[i] !== second[i]) pd++;
    const pt2 = await p.evaluate(() => ({ sel: PG.ST.sel, stats: Char2.stats(), cap: document.getElementById('ptCap').textContent }));
    ok('P4_' + name + '_portrait', pt.ok && pt.w === 384 * pt.k && pt.k >= 2 && Math.abs(pt.cssW * pt.dpr - pt.w) < 1 && pt.opaque > 0.3 * pt.w * pt.w && pt.stats.handles === 0 && pt.stats.borrowed === 0 && pd > 50 && pt2.sel === 1 && pt2.stats.handles === 0 && /\/ kid 2/.test(pt2.cap),
      { k: pt.k, w: pt.w, cssW: pt.cssW, opaque: pt.opaque, handles: pt.stats.handles, changed_after_kid_switch: pd, cap1: pt.cap, cap2: pt2.cap });
    await p.waitForTimeout(500); await p.screenshot({ path: path.join(IMG, 'g35-' + name + '-dress-portrait.png') });
    await p.click('#ptClose'); await p.click('#bDress'); await p.waitForTimeout(800); await p.screenshot({ path: path.join(name === 'phone' ? IMG : XIMG, 'g35-' + name + '.png') });
    // P5 live switch (counters read 300 ms after each click: the window holds frames of one renderer only)
    if (name === 'phone') {
      const snap = () => p.evaluate(() => ({ cnt: { ...PG.ST.cnt }, r: PG.ST.renderer, label: document.getElementById('bR').textContent }));
      const win = async () => { await p.waitForTimeout(300); const a = await snap(); await p.waitForTimeout(1000); const z = await snap(); return { r: z.r, label: z.label, frames: z.cnt.frames - a.cnt.frames, c2: z.cnt.c2 - a.cnt.c2, pilot: z.cnt.pilot - a.cnt.pilot, c2fail: z.cnt.c2fail }; };
      await p.click('#bR'); const w1 = await win(); await p.screenshot({ path: path.join(XIMG, 'g35-phone-pilot.png') });
      await p.click('#bR'); const w2 = await win();
      ok('P5_live_switch', w1.r === 'pilot' && w2.r === 'char2' && w1.frames > 20 && w1.pilot === 4 * w1.frames && w1.c2 === 0 && w2.frames > 20 && w2.c2 === 4 * w2.frames && w2.pilot === 0 && w2.c2fail === 0 && /Pilot/.test(w1.label) && /Char2/.test(w2.label) && p.__errs.length === 0,
        { to_pilot: w1, back_to_char2: w2, errors: p.__errs });
    }
    R.errors.push(...p.__errs.map((e) => name + ': ' + e)); await p.close(); if (name !== 'phone') await ctx.close();
  }
  // ---------- P8 ----------
  if (want('P8')) {
    const p = await open(phone, '?gm&bench'); const a = await p.evaluate(() => PG.KIDS.map((K) => [K.pos.x, K.pos.y])); await p.waitForTimeout(3000);
    const z = await p.evaluate(() => PG.KIDS.map((K) => [K.pos.x, K.pos.y])); const moved = z.map((q, i) => Math.hypot(q[0] - a[i][0], q[1] - a[i][1]));
    ok('P8_bench_all_4_move', moved.every((d) => d > 40), { moved_px: moved.map(Math.round) }); await p.close();
    const q = await open(phone, '?gm');
    const sim = await q.evaluate(() => { PG.pause(true); const bad = [], seen = PG.KIDS.map(() => new Set()); let t = 0; const P0 = PG.KIDS.map((K) => [K.pos.x, K.pos.y]);
      while (t < 60000) { PG.step(16); t += 16; PG.KIDS.forEach((K, i) => { const cx = Math.floor(K.pos.x / 32), cy = Math.floor(K.pos.y / 32), c = PG.GRID[cy][cx]; seen[i].add(cx + ',' + cy); if (i > 0 && 'DXG'.includes(c)) bad.push([i, cx, cy, c]); }); }
      return { bad: bad.slice(0, 5), nbad: bad.length, cells: seen.map((s) => s.size) }; });
    ok('P8_friends_wander_not_door_gate_exit', sim.nbad === 0 && sim.cells.slice(1).every((n) => n >= 8), sim);
    await q.evaluate(() => { PG.pause(false); PG.teleport(0, 16, 11, 'N'); });
    const x0 = await q.evaluate(() => PG.KIDS[0].pos.x); const e = await q.$('#pad button[aria-label="E"]'); const bb = await e.boundingBox();
    await q.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await q.mouse.down(); await q.waitForTimeout(700); await q.mouse.up(); await q.waitForTimeout(200);
    const x1 = await q.evaluate(() => ({ x: PG.KIDS[0].pos.x, moving: PG.KIDS[0].moving }));
    ok('P8_pad_walks_kid1', x1.x - x0 > 15 && !x1.moving, { dx: +(x1.x - x0).toFixed(1), moving_after_release: x1.moving });
    // P9 memory after a long colour walk (every hair x house for kid 1, portrait each time)
    const mem = await q.evaluate(() => { let peak = 0; const K = PG.KIDS[0]; for (let h = 0; h < 8; h++) for (let s = 0; s < 4; s++) { PG.cycle(K, 'house'); if (s === 3) PG.cycle(K, 'hair'); PG.ST.sel = 0; PG.ptShow(); PG.draw(); peak = Math.max(peak, Char2.stats().total); }
      const st = Char2.stats(); return { total: st.total, peak_seen: peak, peak: st.peak, handles: st.handles, borrowed: st.borrowed, evict: st.evict, budget: st.budget }; });
    ok('P9_memory_40MiB_no_borrow_left', mem.peak <= 41943040 && mem.total <= 41943040 && mem.handles === 0 && mem.borrowed === 0, mem);
    // P10 GM on-device A/B (short phases): 3 + 3 counts, the renderer and the friends' mode are put back
    const ms = await q.evaluate(async () => { const before = { r: PG.ST.renderer, bench: PG.ST.bench }; const out = await PG.measure(600); return { out, before, after: { r: PG.ST.renderer, bench: PG.ST.bench, meas: PG.ST.meas }, label: document.getElementById('bMeas').textContent, msg: PG.ST.msg && PG.ST.msg.th }; });
    ok('P10_measure_button', ms.out && ms.out.runs.pilot.length === 3 && ms.out.runs.char2.length === 3 && ms.out.pct > 0 && ms.after.r === ms.before.r && ms.after.bench === ms.before.bench && ms.after.meas === null && /%/.test(ms.label) && /Char2/.test(ms.msg || ''), ms);
    R.errors.push(...q.__errs.map((x) => 'P8: ' + x)); await q.close();
  }
  // ---------- P11 (T29 N1) ----------
  if (want('P11')) for (const [name, vp, dpr] of SCREENS) {
    const ctx = name === 'phone' ? phone : await b.newContext({ viewport: vp, deviceScaleFactor: dpr, hasTouch: true });
    const p = await open(ctx, '?gm'); await p.click('#bDress'); await p.click('#bPt'); await p.waitForTimeout(200);
    const probe = () => p.evaluate(() => { const box = document.getElementById('ptBox').getBoundingClientRect(), out = { overlap: [], hit: [] };
      for (const el of document.querySelectorAll('button')) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; const id = el.id || el.getAttribute('aria-label');
        if (!el.closest('#ptBox')) { const ix = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left)), iy = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top)); if (ix * iy > 0) out.overlap.push([id, +(ix * iy).toFixed(2)]); }
        for (const [x, y] of [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2], [r.left + r.width / 2, r.top + 2], [r.left + r.width / 2, r.bottom - 2]]) {
          const t = document.elementFromPoint(x, y); if (!(t === el || el.contains(t))) { out.hit.push([id, Math.round(x), Math.round(y), t && (t.id || t.tagName)]); break; } } }
      out.inView = box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight; out.k = PG.ST.ptK; out.box = [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)]; return out; });
    const states = [{ s: 'open', ...(await probe()) }];
    for (const [id, n] of [['dKid', 4], ['dHair', 8], ['dIris', 5], ['dSkin', 4], ['dHouse', 4]]) for (let i = 0; i < n; i++) { await p.click('#' + id); await p.waitForTimeout(60); states.push({ s: id + ' ' + (i + 1), ...(await probe()) }); }
    const badS = states.filter((x) => x.overlap.length || x.hit.length || !x.inView);
    ok('P11_' + name + '_portrait_never_covers_a_button', states.length === 26 && badS.length === 0 && p.__errs.length === 0, { states: states.length, bad_states: badS.length, bad: badS.slice(0, 3), k: [...new Set(states.map((x) => x.k))], errors: p.__errs });
    R.errors.push(...p.__errs.map((e) => 'P11 ' + name + ': ' + e)); await p.close(); if (name !== 'phone') await ctx.close();
  }
  // ---------- P7 ----------
  if (want('P7')) {
    const p0 = await phone.newPage(); const files = new Set(); p0.on('request', (r) => { const u = new URL(r.url()); if (u.pathname !== '/pilot-g3-char2.html') files.add(u.pathname.slice(1)); });
    await p0.goto(BASE + '?gm'); await p0.waitForFunction('window.PG&&PG.ST.ready', null, { timeout: 30000, polling: 100 }); await p0.click('#bPt'); await p0.waitForTimeout(1500); await p0.close();
    const list = [...files].sort(); R.files_loaded = list; const rows = [];
    for (const f of list.concat(['*ALL*'])) {
      const p = await phone.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
      await p.route('**/*', (rt) => { const u = new URL(rt.request().url()).pathname.slice(1); if (u !== 'pilot-g3-char2.html' && (f === '*ALL*' || u === f)) return rt.abort();
        if (u === 'pilot-g3-char2.html' && INJ_PAGE) return rt.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: INJ_PAGE });
        if (u === 'char2.js' && INJ_SRC) return rt.fulfill({ status: 200, contentType: 'application/javascript', body: INJ_SRC }); return rt.continue(); });
      await p.goto(BASE + '?gm'); let ready = true; try { await p.waitForFunction('window.PG&&PG.ST.ready', null, { timeout: 30000, polling: 100 }); } catch (e) { ready = false; }
      await p.waitForTimeout(1200); if (ready) { await p.click('#bPt').catch(() => {}); await p.waitForTimeout(300); }
      const st = ready ? await p.evaluate(() => ({ c2: PG.C2.ready, failed: PG.C2.failed, cnt: { ...PG.ST.cnt }, loopErr: PG.ST.loopErr || null, ptOk: !!PG.ST.ptOk })) : null;
      // T29 N2: judge the art buffer only (no DOM UI, no GM label): scene without kids + what each kid adds in its own cell
      const art = ready ? await p.evaluate(() => { try {
        PG.pause(true); const keep = { noNight: PG.ST.noNight, fx: PG.ST.fx }; PG.set({ noNight: true, fx: false, hideKids: false }); PG.draw();
        const B = PG.BUF, W = B.width, H = B.height, A = B.getContext('2d').getImageData(0, 0, W, H).data.slice(), kids = ((PG.ST.last && PG.ST.last.kids) || []).map((k) => ({ id: k.id, sx: k.sx, sy: k.sy }));
        PG.set({ hideKids: true }); PG.draw(); const S = B.getContext('2d').getImageData(0, 0, W, H).data; PG.set({ hideKids: false, noNight: keep.noNight, fx: keep.fx }); PG.draw(); PG.pause(false);
        const m = new Map(); for (let i = 0; i < S.length; i += 4) { const k = (S[i] << 16) | (S[i + 1] << 8) | S[i + 2]; m.set(k, (m.get(k) || 0) + 1); } let top = 0, n = 0; for (const v of m.values()) { n += v; if (v > top) top = v; }
        const kidPx = [0, 1, 2, 3].map((id) => { const k = kids.find((q) => q.id === id); if (!k || !Number.isFinite(k.sx) || !Number.isFinite(k.sy)) return 0; let c = 0;
          for (let y = Math.max(0, k.sy); y < Math.min(H, k.sy + 96); y++) for (let x = Math.max(0, k.sx); x < Math.min(W, k.sx + 96); x++) { const o = (y * W + x) * 4; if (A[o] !== S[o] || A[o + 1] !== S[o + 1] || A[o + 2] !== S[o + 2] || A[o + 3] !== S[o + 3]) c++; } return c; });
        return { W, H, sceneColours: m.size, sceneNotBg: +(1 - top / n).toFixed(3), kidPx }; } catch (e) { return { err: String(e) }; } }) : { err: 'not ready' };
      const shot = await p.screenshot({ type: 'png' }), cols = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, m = new Map(); for (let i = 0; i < d.length; i += 16) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; m.set(k, (m.get(k) || 0) + 1); }
        let top = 0, n = 0; for (const v of m.values()) { n += v; if (v > top) top = v; } return { colours: m.size, notBg: +(1 - top / n).toFixed(3) }; }, shot.toString('base64'));
      const pass = ready && errs.length === 0 && st && !st.loopErr && !art.err && art.W > 100 && art.sceneColours >= 12 && art.sceneNotBg >= 0.02 && art.kidPx.every((v) => v >= 200);
      rows.push({ file: f, pass, c2: st && st.c2, failed: st && st.failed, drawn_by: st && (st.cnt.c2 ? 'char2' : 'pilot'), ptOk: st && st.ptOk, art, screenshot: cols, errors: errs });
      if (f === '*ALL*') await p.screenshot({ path: path.join(IMG, 'g35-p7-all-blocked.png') });
      await p.close();
    }
    const mins = { sceneColours: Math.min(...rows.map((r) => r.art.sceneColours || 0)), sceneNotBg: Math.min(...rows.map((r) => r.art.sceneNotBg || 0)), kidPx: Math.min(...rows.map((r) => Math.min(...(r.art.kidPx || [0])))) };
    ok('P7_files_missing_one_by_one_and_all', rows.length >= 30 && rows.every((r) => r.pass), { blocked: rows.length, lowest: mins, failing: rows.filter((r) => !r.pass).slice(0, 4) });
    R.p7 = rows;
  }
  R.pass = R.fails.length === 0 && R.errors.length === 0; console.log(JSON.stringify({ pass: R.pass, fails: R.fails, errors: R.errors.length }));
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
  await b.close(); process.exit(R.pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
