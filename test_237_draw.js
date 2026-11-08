// Claude 2.37 (G4.2 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.2 §4 §5 · table W1–W5 + W11 · gate M3): the player drawn with Char2 in the real game.
// Every frame is recorded from inside the page (render wrapped): how often the player is drawn, every Char2.draw call (feet, scale, alpha, house,
// lantern, result), the old body sheets / blurred-shadow sheets drawn on the game canvas, the clip rectangles inside drawPlayer, ellipses, and
// the holes cut in the cave darkness. Expected positions are worked out HERE from P, camX, camY and the plan's formulas (not from game helpers);
// Char2 itself is the oracle only for its own anchors (box, body) and light(), as the plan says.
// A  flag on, capital: every frame the player is drawn = one Char2 body draw that returned true (100 %) · old body sheet 0 · feet = the old sprite's
//    feet (round(P.x−32−camX)+32, round(P.y−62−camY)+62) · s = 1 · idle then walking (anim walk) · one tick per game step
// B  8 directions: P.row 0..7 → the actor's dir = pack.dirs[row] 8/8 · the drawn body differs between the 8 (pixel hash 8 distinct)
// C  houses 4/4: S.house 0..3 → dc.house = HOUSES[h].id · a Char2 draw of that call on a spare canvas shows that house's palette (P2-style count)
// D  lantern held ONLY when DARK() && LKID(): capital / farm 0 %, cavemouth / hunt1 100 % of drawn frames
// E  lantern power (plan 5): S.lamp 0 · w−ε · w · w+ε · 1 · none → 0 · 10 · 10 · 100 · 100 · 100 · glass pixels on a spare canvas 100 > 10 > 0
// F  wading (W2): pool / other water → clip [fx−48, fy0−94, 96, 96−cut] (bottom edge = the old one) · body drawn at fy0 + 8 / 4 · ripple kept
// G  shadow (W3): the ellipse rgba(20,18,40,.35) rx 14 ry 3 at (round(P.x−camX)+ro, round(P.y−camY)) once per frame · blurred sheet 0
// H  sitting (W5, farm bench): clip top = seatY + drop − (94 − box_y0) − 4, height = (seatY − 3) − top, x and width as before
// I  see-through (W4): behind a tall thing → Char2.draw sees α .5 and draws
// J  cave light (W11): no map of game 2.33 uses the cave darkness layer (cavemouth / hunt1 are 'bright') → here cavemouth with bright switched off:
//    the player's hole = drawn feet + Char2.light() (S and N = hidden lantern) · flag off = (P.x−camX, P.y−26−camY)
// K  a Char2.draw that returns false → 'failed' and the OLD body drawn in the same frame (never blank) · light() null while held → 'failed'
// L  no tick while PAUSE or P.dead
// M  flag off: Char2 0 calls, C234 counters 0, old body + blurred shadow every frame (the old game)
// N  not allowed (girl 10 · boy 7) with the flag on: off, Char2 0 calls
// Screenshots for the owner (phone 844×390 · iPad 1180×820) under OUT_DIR. Prints one JSON line, then `errors N`.
//   PORT=8781 CHROME_EXE=/path/to/chromium node test_237_draw.js
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-237-draw'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8781) + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
async function open(browser, w = 844, h = 390) {
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true); p.on('request', (r) => (/firebase|gstatic|googleapis/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
// a synthetic save on a map; flag on → wait for ready; then the recorder is put in (once per page)
async function setup(p, o) {
  await p.evaluate((o) => {
    const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'Pim', kid: o.kid || 0, house: o.house ?? 1, age: o.age || 7 }), o.on === false ? {} : { char2On: true }, o.x || {})]; d.cur = 0; Store.put(d);
    S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
    goMap(o.map || 'capital'); LITE = false; S.eco = false; fpsChecks = 6; PAUSE = false;
  }, o);
  if (o.on !== false && !o.noWait) await p.waitForFunction(() => C234.st !== 'loading' && C234.st !== 'off', { timeout: 25000 }).catch(() => {});
  await sleep(300);
  await p.evaluate(() => {
    if (window.__T) return;
    const T = (window.__T = { on: false, fr: [], cur: null, fail: 0, lightNull: 0 }), g = ctx, P0 = CanvasRenderingContext2D.prototype;
    const odi = g.drawImage; g.drawImage = function (img) { const c = T.cur; if (c) { if (img && (img === PS.walk || img === PS.stand)) c.old++; if (img && (img === PS.shW || img === PS.shS)) c.blur++; } return odi.apply(this, arguments); };
    const orc = g.rect; g.rect = function () { const c = T.cur; if (c && c.inP) c.rects.push([...arguments]); return orc.apply(this, arguments); };
    const oel = g.ellipse; g.ellipse = function () { const c = T.cur; if (c) c.ell.push({ a: [...arguments], fs: String(g.fillStyle) }); return oel.apply(this, arguments); };
    const org = P0.createRadialGradient; P0.createRadialGradient = function () { const c = T.cur; if (c && this === darkG) c.holes.push([...arguments]); return org.apply(this, arguments); };
    const odp = drawPlayer; drawPlayer = function () { const c = T.cur; if (c) { c.player++; c.inP = true; c.P = [P.x, P.y]; c.cam = [camX, camY]; c.atk = P.atkAnim || 0; }   /* the camera may move inside render: take it as drawPlayer sees it */ try { return odp.apply(this, arguments); } finally { if (c) c.inP = false; } };
    const ore = render; render = function () {
      T.cur = T.on ? { player: 0, old: 0, blur: 0, rects: [], ell: [], holes: [], c2: [], inP: false, P: [P.x, P.y], cam: [camX, camY], row: P.row, atk: P.atkAnim || 0, n0: Object.assign({}, C234.n), st0: C234.st } : null;
      try { return ore.apply(this, arguments); } finally { const c = T.cur; if (c) { c.n1 = Object.assign({}, C234.n); c.st1 = C234.st; c.why = C234.why; T.fr.push(c); } T.cur = null; }
    };
  });
  await wrapC2(p);
}
async function wrapC2(p) {   // window.Char2 is frozen → a copy with draw/light wrapped (the game looks Char2 up at every call)
  await p.evaluate(() => {
    if (!window.Char2 || window.Char2.__w) return; const C2 = window.Char2, T = window.__T;
    window.Char2 = Object.assign({}, C2, { __w: 1, __orig: C2,
      draw(...a) { const c = T.cur; if (T.fail > 0 && !(a[7] && a[7].spare)) { T.fail--; if (c) c.c2.push({ forced: 1, r: false }); return false; }
        const r = C2.draw(...a); if (c && !(a[7] && a[7].spare)) c.c2.push({ x: a[4], y: a[5], s: a[6], alpha: a[0].globalAlpha, held: a[2].held ? Object.assign({}, a[2].held) : null, house: a[2].house, dir: a[3].dir, anim: a[3].anim, r }); return r; },
      light(...a) { if (T.lightNull > 0) { T.lightNull--; return null; } return C2.light(...a); } });
  });
}
const rec = (p, n) => p.evaluate((n) => new Promise((res) => { const T = window.__T; T.fr = []; T.on = true; let k = 0; const f = () => { if (++k > n) { T.on = false; res(T.fr.map((c) => { delete c.inP; return c; })); } else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
const feetOf = (c) => [Math.round(c.P[0] - 32 - c.cam[0]) + 32, Math.round(c.P[1] - 62 - c.cam[1]) + 62];   // no lunge (atk 0 checked)
const drawnOK = (fr) => fr.filter((c) => c.player > 0).every((c) => c.c2.length === c.player && c.c2.every((q) => q.r === true) && c.old === 0);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // A: drawn frames + feet + tick (capital)
    { const t = await open(browser); await setup(t.p, { map: 'capital' });
      const st = await t.p.evaluate(() => C234.st); const idle = await rec(t.p, 60);
      await t.p.keyboard.down('ArrowRight'); await sleep(150); const walk = await rec(t.p, 45); await t.p.keyboard.up('ArrowRight');
      const all = idle.concat(walk), drawn = all.filter((c) => c.player > 0), ok = drawn.filter((c) => c.c2.length === c.player && c.c2.every((q) => q.r === true));
      const feetBad = drawn.filter((c) => c.atk === 0 && c.c2[0] && (c.c2[0].x !== feetOf(c)[0] || c.c2[0].y !== feetOf(c)[1] || c.c2[0].s !== 1)).length;
      const ticks = all.slice(1).filter((c, i) => c.n1.tick - all[i].n1.tick === 1).length;
      R.A = { st, frames: all.length, drawn: drawn.length, c2ok: ok.length, old: all.reduce((s, c) => s + c.old, 0), feetBad, walkAnim: walk.filter((c) => c.c2[0] && c.c2[0].anim === 'walk').length, walkFrames: walk.length, ticksOne: ticks, pe: t.pe.length };
      ck(st === 'ready' && drawn.length >= 100 && ok.length === drawn.length && R.A.old === 0 && feetBad === 0 && t.pe.length === 0, 'A drawn ' + JSON.stringify(R.A));
      ck(R.A.walkAnim >= walk.length - 3, 'A walking uses the walk sheet ' + JSON.stringify(R.A));
      ck(ticks >= all.length - 3, 'A one tick per step ' + JSON.stringify(R.A));
      await t.p.screenshot({ path: path.join(out, 'a-capital-walk.png') });
      // B: 8 directions
      const dirs = await t.p.evaluate(() => C234.pack.dirs), B = [];
      for (let k = 0; k < 8; k++) {
        await t.p.evaluate((k) => { P.row = k; P.moving = false; }, k); await sleep(120);
        const fr = await rec(t.p, 2), c = fr[fr.length - 1];
        const hash = await t.p.evaluate(() => { const f = C234.feet, cv = document.getElementById('c'), m = ctx.getTransform(), sc = m.a, x0 = Math.round((f.x - 40) * sc), y0 = Math.round((f.y - 90) * sc), w = Math.round(80 * sc), h = Math.round(90 * sc);
          const d = cv.getContext('2d').getImageData(x0, y0, w, h).data; let a = 0; for (let i = 0; i < d.length; i += 4) a = (Math.imul(a, 31) + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) | 0; return a; });
        B.push({ k, dir: c.c2[0] && c.c2[0].dir, want: dirs[k], hash });
      }
      R.B = { ok: B.filter((b) => b.dir === b.want).length, distinct: new Set(B.map((b) => b.hash)).size };
      ck(R.B.ok === 8 && R.B.distinct === 8, 'B 8 directions ' + JSON.stringify(B));
      await t.p.evaluate(() => { P.row = 0; });
      // C: houses 4/4 (the game's call, then the same call on a spare canvas, counted by house palette)
      const C = [];
      for (let h = 0; h < 4; h++) {
        await t.p.evaluate((h) => { S.house = h; }, h); await sleep(120); const fr = await rec(t.p, 2), c = fr[fr.length - 1];
        const cnt = await t.p.evaluate((h) => { const C2 = Char2.__orig, pk = C234.pack, cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; const g = cv.getContext('2d');
          const A = C2.actor({ rand: () => 0.5 }); C2.tick(A, 0, { dir: 'S', moving: false, holding: false }); C2.draw(g, C234.app, { house: HOUSES[h].id }, A, 48, 94, 1, { spare: 1 });
          const d = g.getImageData(0, 0, 96, 96).data, pal = pk.palette.house.map((q) => new Set(q[1].map((x) => x.toUpperCase()))), n = [0, 0, 0, 0];
          for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const hx = '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(); pal.forEach((s, j) => { if (s.has(hx)) n[j]++; }); }
          return { id: HOUSES[h].id, n }; }, h);
        C.push({ h, house: c.c2[0] && c.c2[0].house, want: cnt.id, n: cnt.n });
      }
      R.C = C; ck(C.every((q) => q.house === q.want && q.n[q.h] >= 10 && q.n[q.h] > 4 * Math.max(...q.n.filter((v, j) => j !== q.h))), 'C houses ' + JSON.stringify(C));
      await t.p.evaluate(() => { S.house = 1; });
      // G: shadow (capital is not g9b)
      { const fr = await rec(t.p, 20), dr = fr.filter((c) => c.player > 0), ro = await t.p.evaluate(() => C234.pack.render_offset);
        const good = dr.filter((c) => { const e = c.ell.filter((q) => /rgba\(20, 18, 40, 0\.35\)/.test(q.fs)); if (e.length !== 1) return false; const a = e[0].a, d = c.c2[0] && c.c2[0].dir;
          return a[0] === Math.round(c.P[0] - c.cam[0]) + (ro[d] || 0) && a[1] === Math.round(c.P[1] - c.cam[1]) && a[2] === 14 && a[3] === 3; });
        R.G = { frames: dr.length, good: good.length, blur: fr.reduce((s, c) => s + c.blur, 0) };
        ck(dr.length > 0 && good.length === dr.length && R.G.blur === 0, 'G shadow ' + JSON.stringify(R.G)); }
      // I: see-through
      { await t.p.evaluate(() => { window.__bo = behindOcc; behindOcc = () => true; }); const fr = await rec(t.p, 6); await t.p.evaluate(() => { behindOcc = window.__bo; });
        const dr = fr.filter((c) => c.player > 0); R.I = { frames: dr.length, half: dr.filter((c) => c.c2[0] && c.c2[0].r && Math.abs(c.c2[0].alpha - 0.5) < 1e-9).length };
        ck(dr.length > 0 && R.I.half === dr.length, 'I see-through ' + JSON.stringify(R.I)); }
      // F: wading
      { const F = [];
        for (const [wet, cut, dy] of [['pool', 22, 8], ['flower', 16, 4]]) {
          await t.p.evaluate((wet) => { window.__ip = inPool; inPool = () => wet; }, wet); const fr = await rec(t.p, 6); await t.p.evaluate(() => { inPool = window.__ip; });
          const dr = fr.filter((c) => c.player > 0 && c.atk === 0);
          const good = dr.filter((c) => { const [fx, fy0] = feetOf(c), r = c.rects[0]; return r && r[0] === fx - 48 && r[1] === fy0 - 94 && r[2] === 96 && r[3] === 96 - cut && r[1] + r[3] === fy0 + 2 - cut && c.c2[0] && c.c2[0].r && c.c2[0].y === fy0 + dy && c.c2[0].x === fx; });
          F.push({ wet, frames: dr.length, good: good.length, ripple: dr.filter((c) => wet !== 'pool' || c.ell.some((q) => q.a[2] >= 10 && q.a[3] === 4)).length });
        }
        R.F = F; ck(F.every((q) => q.frames > 0 && q.good === q.frames && q.ripple === q.frames), 'F wading ' + JSON.stringify(F));
        await t.p.evaluate(() => { inPool = () => 'pool'; }); await sleep(150); await t.p.screenshot({ path: path.join(out, 'f-wading.png') }); await t.p.evaluate(() => { inPool = window.__ip; }); }
      // L: no tick while paused / down
      { const a = await t.p.evaluate(() => C234.n.tick); await t.p.evaluate(() => { PAUSE = true; }); await sleep(400); const b = await t.p.evaluate(() => C234.n.tick); await t.p.evaluate(() => { PAUSE = false; P.dead = 1; }); await sleep(400);
        const c = await t.p.evaluate(() => C234.n.tick); await t.p.evaluate(() => { P.dead = 0; }); await sleep(300); const d = await t.p.evaluate(() => C234.n.tick);
        R.L = { pause: b - a, dead: c - b, after: d - c }; ck(R.L.pause === 0 && R.L.dead === 0 && R.L.after > 0, 'L ticks ' + JSON.stringify(R.L)); }
      R.Ape = t.pe.length; ck(t.pe.length === 0, 'A–L page errors ' + t.pe.join(' | '));
      await t.bc.close(); }
    // D + E: lantern (capital · farm · cavemouth · hunt1)
    { const t = await open(browser); const D = [];
      for (const map of ['capital', 'farm', 'cavemouth', 'hunt1']) {
        if (D.length === 0) await setup(t.p, { map }); else { await t.p.evaluate((map) => goMap(map), map); await sleep(300); }
        const fr = await rec(t.p, 20), dr = fr.filter((c) => c.player > 0), dark = await t.p.evaluate(() => DARK() && LKID());
        D.push({ map, dark, frames: dr.length, held: dr.filter((c) => c.c2[0] && c.c2[0].held).length, ok: dr.filter((c) => c.c2[0] && c.c2[0].r).length });
      }
      R.D = D; ck(D.every((q) => q.frames > 0 && q.ok === q.frames && q.held === (q.dark ? q.frames : 0)) && D.filter((q) => q.dark).length === 2, 'D held only when dark ' + JSON.stringify(D));
      await t.p.evaluate(() => goMap('cavemouth')); await sleep(300);
      const w = await t.p.evaluate(() => LAMP_CFG(S.age).warn), E = [];
      for (const [lab, v, want] of [['0', 0, 0], ['w-e', w - 0.001, 10], ['w', w, 10], ['w+e', w + 0.001, 100], ['1', 1, 100], ['none', undefined, 100]]) {
        await t.p.evaluate((v) => { if (v === null) delete S.lamp; else S.lamp = v; }, v === undefined ? null : v); const fr = await rec(t.p, 3), c = fr.filter((q) => q.player > 0).pop();
        E.push({ lab, power: c && c.c2[0] && c.c2[0].held && c.c2[0].held.power, want });
      }
      const glass = await t.p.evaluate(() => { const C2 = Char2.__orig, pk = C234.pack, res = {};
        for (const pw of [100, 10, 0]) { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; const g = cv.getContext('2d'), A = C2.actor({ rand: () => 0.5 }), dc = { house: 'wing', held: { id: pk.lantern.id, on: true, lit: true, power: pw } };
          C2.tick(A, 0, { dir: 'S', moving: false, holding: true }); C2.tick(A, 16, { dir: 'S', moving: false, holding: true }); C2.draw(g, C234.app, dc, A, 48, 94, 1, { spare: 1 }); const L = C2.light(A, dc);
          const d = g.getImageData(48 + L.x - 3, 94 + L.y - 3, 7, 7).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; res[pw] = s; }
        return res; });
      R.E = { E, glass, warn: w }; ck(E.every((q) => q.power === q.want) && glass[100] > glass[10] && glass[10] > glass[0], 'E lantern power ' + JSON.stringify(R.E));
      await t.p.evaluate(() => { delete S.lamp; P.row = 0; }); await sleep(200); await t.p.screenshot({ path: path.join(out, 'e-cavemouth-lantern.png') });
      // J: cave light hole (bright switched off on this page only)
      const J = [];
      for (const row of [0, 4, 1]) {
        await t.p.evaluate((row) => { M.bright = false; P.row = row; P.moving = false; }, row); await sleep(150); const fr = await rec(t.p, 4), c = fr.filter((q) => q.player > 0).pop();
        const L = await t.p.evaluate(() => { const f = C234.feet; return f && Char2.__orig.light(C234.A, f.dc); });
        const [fx, fy] = feetOf(c), hz = c.holes[0];
        J.push({ row, dir: c.c2[0] && c.c2[0].dir, hidden: L && L.hidden, hole: hz && [hz[0], hz[1]], want: L && [fx + L.x, fy + L.y] });
      }
      await t.p.screenshot({ path: path.join(out, 'j-dark-light.png') }); await t.p.evaluate(() => { M.bright = true; });
      R.J = J; ck(J.every((q) => q.hole && q.want && q.hole[0] === q.want[0] && q.hole[1] === q.want[1]) && J.some((q) => q.hidden === true), 'J cave light ' + JSON.stringify(J));
      ck(t.pe.length === 0, 'D/E/J page errors ' + t.pe.join(' | '));
      await t.bc.close(); }
    // H: sitting on a farm bench
    { const t = await open(browser); await setup(t.p, { map: 'farm' });
      const g9 = await t.p.evaluate(() => !!M.g9b && g9bSeats().length); let H = { g9b: g9 };
      if (g9) {
        await t.p.evaluate(() => { const s = g9bSeats()[0]; g9bSit(s); }); await sleep(400);
        const fr = await rec(t.p, 6), dr = fr.filter((c) => c.player > 0);
        const box = await t.p.evaluate(() => Char2.__orig.anchor(C234.A, 'box', { house: 'wing' })), sit = await t.p.evaluate(() => P.sit && { seatY: P.sit.seatY, drop: G9SIT.drop });
        const good = dr.filter((c) => { const r = c.rects[0]; if (!r || !sit || !box) return false; const top = sit.seatY + sit.drop - (94 - box[1]) - 4;
          return r[0] === c.P[0] - 44 - c.cam[0] && r[1] === top - c.cam[1] && r[2] === 88 && r[3] === sit.seatY - 3 - top && c.c2[0] && c.c2[0].r; });
        H = Object.assign(H, { frames: dr.length, good: good.length, box, sit, sitN: await t.p.evaluate(() => C234.n.sit) });
        await t.p.screenshot({ path: path.join(out, 'h-sitting.png') });
      }
      R.H = H; ck(H.g9b && H.frames > 0 && H.good === H.frames, 'H sitting ' + JSON.stringify(H));
      ck(t.pe.length === 0, 'H page errors ' + t.pe.join(' | '));
      await t.bc.close(); }
    // K: failures are never blank
    { const t = await open(browser); await setup(t.p, { map: 'capital' });
      await t.p.evaluate(() => { __T.fail = 1; }); const fr = await rec(t.p, 4), first = fr.find((c) => c.c2.some((q) => q.forced));
      R.K1 = { st: await t.p.evaluate(() => C234.st), why: await t.p.evaluate(() => C234.why), firstOld: first && first.old, after: fr.slice(fr.indexOf(first) + 1).map((c) => [c.c2.length, c.old]) };
      ck(R.K1.st === 'failed' && R.K1.why === 'draw' && first && first.old >= 1 && R.K1.after.length && R.K1.after.every((q) => q[0] === 0 && q[1] >= 1), 'K draw false → failed, old body same frame ' + JSON.stringify(R.K1));
      await t.bc.close(); }
    { const t = await open(browser); await setup(t.p, { map: 'cavemouth' });
      await t.p.evaluate(() => { M.bright = false; __T.lightNull = 1; }); const fr = await rec(t.p, 4);
      R.K2 = { st: await t.p.evaluate(() => C234.st), why: await t.p.evaluate(() => C234.why), old: fr.slice(1).map((c) => c.old) };
      ck(R.K2.st === 'failed' && R.K2.why === 'light' && R.K2.old.every((v) => v >= 1), 'K light null → failed ' + JSON.stringify(R.K2));
      await t.bc.close(); }
    // M: flag off
    { const t = await open(browser); await setup(t.p, { map: 'capital', on: false }); const fr = await rec(t.p, 30), dr = fr.filter((c) => c.player > 0);
      R.M = { frames: dr.length, c2: fr.reduce((s, c) => s + c.c2.length, 0), oldPerFrame: dr.filter((c) => c.old >= 1).length, blurPerFrame: dr.filter((c) => c.blur >= 1).length, n: await t.p.evaluate(() => C234.n), st: await t.p.evaluate(() => C234.st), char2: await t.p.evaluate(() => typeof window.Char2) };
      ck(R.M.frames > 0 && R.M.c2 === 0 && R.M.oldPerFrame === R.M.frames && R.M.blurPerFrame === R.M.frames && Object.values(R.M.n).every((v) => v === 0) && R.M.st === 'off' && R.M.char2 === 'undefined', 'M flag off = old game ' + JSON.stringify(R.M));
      await t.bc.close(); }
    // N: not allowed
    { const N = [];
      for (const [lab, o] of [['girl 10', { age: 10 }], ['boy 7', { age: 7, kid: 3 }]]) { const t = await open(browser); await setup(t.p, Object.assign({ map: 'capital', noWait: true }, o)); await sleep(1500);
        const fr = await rec(t.p, 10); N.push({ lab, st: await t.p.evaluate(() => C234.st), c2: fr.reduce((s, c) => s + c.c2.length, 0), old: fr.filter((c) => c.player > 0 && c.old >= 1).length, frames: fr.filter((c) => c.player > 0).length }); await t.bc.close(); }
      R.N = N; ck(N.every((q) => q.st === 'off' && q.c2 === 0 && q.old === q.frames && q.frames > 0), 'N not allowed ' + JSON.stringify(N)); }
    // screenshots for the owner: iPad
    { const t = await open(browser, 1180, 820); await setup(t.p, { map: 'capital' }); await sleep(400); await t.p.screenshot({ path: path.join(out, 'ipad-capital.png') });
      await t.p.evaluate(() => goMap('cavemouth')); await sleep(600); await t.p.screenshot({ path: path.join(out, 'ipad-cavemouth.png') }); await t.bc.close(); }
  } catch (e) { errors.push('crash ' + String(e && e.stack || e).slice(0, 400)); }
  await browser.close();
  console.log(JSON.stringify({ results: R, errors }));
  console.log('errors ' + errors.length); process.exit(errors.length ? 1 : 0);
})();
