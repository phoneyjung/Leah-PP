// Claude 2.39 (G4.3 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.3 §4.2 §4.3 rows W6 W7 W8 W9 W12 · gate M4): the points that hang off the
// player's body (name label, emote, floating numbers, sparks, the compass, dig bar, weapon arc, fishing line, after-image, see-through /
// HUD / context-button / line-gap boxes) follow the NEW character's anchors when it is drawn, and stay the OLD numbers when it is not.
// The expected numbers are worked out HERE from the plan's table (k_old head 60 · body 30 · top 60 · label 66 · e per site) and the anchors
// Char2 gives for the actor's CURRENT frame (Char2 is the oracle only for its own anchors, as the plan says) — never from c234D / c234Box4.
// S  static: the 37 planned sites, each exactly once in the branch with the planned kind and old distance (and the old literal gone);
//    the same old literal once in main (MAIN_PORT) · other players' label (P4) untouched · W10 (≤ 20 px from the feet) untouched
// F  formula: 8 directions × idle / walking × not holding (capital) / holding (cavemouth) × 3 steps × every kind and planned distance:
//    c234D(kind, d) = 94 − anchor_y + d − k_old (0 px) · c234Box4() = [P.x + x0 − 48 + ro, P.y − (94 − y0 + 4), x1 − x0, 94 − y0 + 8]
//    flag off: c234D(kind, d) = d · c234Box4() = null
// D  live sites (a kid's reachable ones), flag on AND off:
//    D1 name label + emote bubble drawn in render (W7) · D2 gainExp → the "+n EXP" number (W8 e 12) · D3 celebrate → rays (W9 e 0) and
//    confetti (W8 e 0) · D4 skill guard → shield (W9 e −6) · hawk → feathers (W9 e 0) · D5 evade → after-image ghosts drawn by Char2 at the
//    old ghost's feet with alpha .35·al (W6), flag off = the old sheet · D6 charClip → the player's line-gap box (W12 L4072)
// K  failure: Char2.anchor → null while drawn → 'failed' and the old number in that same call
// Screenshots for the owner (phone 844×390): the name label, wading and sitting with the flag on and off. Prints one JSON line, then `errors N`.
//   PORT=8781 MAIN_PORT=8780 CHROME_EXE=/path/to/chromium node test_239_anchor.js
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-239-anchor'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8781) + '/';
const mainBase = process.env.MAIN_PORT ? 'http://localhost:' + process.env.MAIN_PORT + '/' : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = {};
const ck = (c, m) => { if (!c) errors.push(m); };
// the plan's table §4.3: [row, kind, old distance d, branch text, main text]
const H = (d) => "c234D('head'," + d + ')', B = (d) => "c234D('body'," + d + ')', T = (d) => "c234D('top'," + d + ')';
const SITES = [
  ['W7', 'label', '(PS.F||64)+2', "label(P.x-camX,P.y-camY-c234D('label',(PS.F||64)+2),", 'label(P.x-camX,P.y-camY-(PS.F||64)-2,'],
  ['W7', 'label', '(PS.F||64)+16', "emoteBubble(P.x-camX,P.y-camY-c234D('label',(PS.F||64)+16),", 'emoteBubble(P.x-camX,P.y-camY-(PS.F||64)-16,'],
  ['W8', 'head', 72, 'y:P.y-' + H(72) + ",s:'+'+n+' EXP'", "y:P.y-72,s:'+'+n+' EXP'"],
  ['W8', 'head', 66, 'y:P.y-' + H(66) + ",s:t('miss')", "y:P.y-66,s:t('miss')"],
  ['W8', 'head', 66, 'y:P.y-' + H(66) + ",s:'-'+n", "y:P.y-66,s:'-'+n"],
  ['W8', 'head', 66, 'y:P.y-' + H(66) + ",s:'+HP'", "y:P.y-66,s:'+HP'"],
  ['W8', 'head', 66, 'y:P.y-' + H(66) + ",s:'+1 \\u{1F9EA}'", "y:P.y-66,s:'+1 \\u{1F9EA}'"],
  ['W8', 'head', 70, 'y:P.y-' + H(70) + ",s:'✉️ +5🪙'", "y:P.y-70,s:'✉️ +5🪙'"],
  ['W8', 'head', 92, 'P.y-camY-' + H(92) + '),n=DIG', 'P.y-camY-92),n=DIG'],
  ['W8', 'head', 66, 'Y=(P.y-' + H(66) + '-camY+', 'Y=(P.y-66-camY+'],
  ['W8', 'head', 60, 'y:P.y-' + H(60) + ',vx:(Math.random', 'y:P.y-60,vx:(Math.random'],
  ['W9', 'body', 30, "k:'rays',x:P.x,y:P.y-" + B(30), "k:'rays',x:P.x,y:P.y-30"],
  ['W9', 'body', 26, 'x:P.x,y:P.y-' + B(26) + ',tx:mo', 'x:P.x,y:P.y-26,tx:mo'],
  ['W9', 'body', 26, 'x:P.x,y:P.y-' + B(26) + ',tx:o,', 'x:P.x,y:P.y-26,tx:o,'],
  ['W9', 'body', 26, "k:'staff',x:P.x,y:P.y-" + B(26) + ',tx:tgt', "k:'staff',x:P.x,y:P.y-26,tx:tgt"],
  ['W9', 'body', 26, 'y=P.y-' + B(26) + '-camY+Math.sin(an)', 'y=P.y-26-camY+Math.sin(an)'],
  ['W9', 'body', 30, "k:'star',x:P.x,y:P.y-" + B(30) + ',vx:Math.cos(i/24*6.28)*60', "k:'star',x:P.x,y:P.y-30,vx:Math.cos(i/24*6.28)*60"],
  ['W9', 'body', 30, 'y:P.y-' + B(30) + '+(rnd()-.5)*50', 'y:P.y-30+(rnd()-.5)*50'],
  ['W9', 'body', 30, "k:'star',x:P.x,y:P.y-" + B(30) + ',vx:Math.cos(i/18', "k:'star',x:P.x,y:P.y-30,vx:Math.cos(i/18"],
  ['W9', 'body', 30, "k:'star',x:P.x,y:P.y-" + B(30) + ',vx:Math.cos(i/24*6.28)*70', "k:'star',x:P.x,y:P.y-30,vx:Math.cos(i/24*6.28)*70"],
  ['W9', 'body', 30, 'burst(P.x,P.y-' + B(30) + ',16', 'burst(P.x,P.y-30,16'],
  ['W9', 'body', 30, 'let a={x:P.x,y:P.y-' + B(30) + '}', 'let a={x:P.x,y:P.y-30}'],
  ['W9', 'body', 40, "k:'star',x:P.x,y:P.y-" + B(40) + ',vx:Math.cos(i/20', "k:'star',x:P.x,y:P.y-40,vx:Math.cos(i/20"],
  ['W9', 'body', 40, "k:'star',x:P.x,y:P.y-" + B(40) + ',vx:(rnd()-.5)*120,vy:-60-rnd()*80,t:0,life:1.2', "k:'star',x:P.x,y:P.y-40,vx:(rnd()-.5)*120,vy:-60-rnd()*80,t:0,life:1.2"],
  ['W9', 'body', 40, "k:'star',x:P.x,y:P.y-" + B(40) + ',vx:(rnd()-.5)*90', "k:'star',x:P.x,y:P.y-40,vx:(rnd()-.5)*90"],
  ['W9', 'body', 40, "k:'star',x:P.x,y:P.y-" + B(40) + ',vx:(rnd()-.5)*120,vy:-60-rnd()*80,t:0,life:1.3', "k:'star',x:P.x,y:P.y-40,vx:(rnd()-.5)*120,vy:-60-rnd()*80,t:0,life:1.3"],
  ['W9', 'body', 50, "k:'bonk',x:P.x,y:P.y-" + B(50), "k:'bonk',x:P.x,y:P.y-50"],
  ['W9', 'body', 24, "k:'shield2',x:P.x,y:P.y-" + B(24), "k:'shield2',x:P.x,y:P.y-24"],
  ['W9', 'body', 24, 'x=P.x-camX;y=P.y-' + B(24) + '-camY}', 'x=P.x-camX;y=P.y-24-camY}'],
  ['W9', 'body', 22, 'Y=(P.y-' + B(22) + '-camY)*SC,R=30*SC', 'Y=(P.y-22-camY)*SC,R=30*SC'],
  ['W9', 'body', 40, 'rx=P.x-camX+10,ry=P.y-camY-' + B(40) + ';', 'rx=P.x-camX+10,ry=P.y-camY-40;'],
  ['W12', 'top', 50, 'P.y-' + T(50) + '<o.y)tg=.42', 'P.y-50<o.y)tg=.42'],
  ['W12', 'top', 48, 'P.y-' + T(48) + '<o.y,tgt=', 'P.y-48<o.y,tgt='],
  ['W12', 'top', 50, 'Tp=cr.top+(P.y-' + T(50) + '-camY)*k,B=cr.top+(P.y+4-camY)*k', 'Tp=cr.top+(P.y-50-camY)*k,B=cr.top+(P.y+4-camY)*k'],
  ['W12', 'top', 62, 'top:(P.y-camY-' + T(62) + ')*q+r.top,right:(P.x-camX+20)*q', 'top:(P.y-camY-62)*q+r.top,right:(P.x-camX+20)*q'],
  ['W12', 'box4', 64, 'if(P)add(...(c234Box4()||[P.x-20,P.y-64,40,68]))', 'if(P)add(P.x-20,P.y-64,40,68)'],
  ['W6', 'after', 0, "case'after':{if(c234After(f,al))break;const im=P.moving?PS.walk:PS.stand;", "case'after':{const im=P.moving?PS.walk:PS.stand;"],
];
const KOLD = { head: 60, body: 30, top: 60, label: 66 };
const count = (s, x) => s.split(x).length - 1;
async function open(browser, w = 844, h = 390) {
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true); p.on('request', (r) => (/firebase|gstatic|googleapis/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto(base + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
async function setup(p, o) {
  await p.evaluate((o) => {
    const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'Pim', kid: 0, house: o.house ?? 1, age: 7 }), o.on === false ? {} : { char2On: true })]; d.cur = 0; Store.put(d);
    S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
    goMap(o.map || 'capital'); LITE = false; S.eco = false; fpsChecks = 6; PAUSE = false;
  }, o);
  if (o.on !== false) await p.waitForFunction(() => C234.st === 'ready', { timeout: 25000 }).catch(() => {});
  await sleep(400);
  // the test's own view of the actor: dc as the plan defines it (house · lantern only when DARK() && LKID()) and the anchors Char2 gives
  await p.evaluate(() => {
    window.__dc = () => { const h = HOUSES[S.house] || HOUSES[0], dc = { house: h.id }; if (DARK() && LKID()) dc.held = { id: C234.pack ? C234.pack.lantern.id : 'lantern_L0', on: true, lit: true, power: 100 }; return dc; };
    window.__on = () => C234.st === 'ready' && C234.A && C234.app && C234.pack;
    window.__k = (kind) => { if (!window.__on()) return null; const nm = { head: 'head_top', body: 'body', top: 'box', label: 'label' }[kind], a = Char2.anchor(C234.A, nm, window.__dc()); return a ? 94 - a[1] : NaN; };
    window.__exp = (kind, d) => { const KO = { head: 60, body: 30, top: 60, label: 66 }, k = window.__k(kind); return k === null ? d : k + d - KO[kind]; };
  });
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  // ── S static
  {
    const br = await (await fetch(base + 'index.html')).text(), mn = mainBase ? await (await fetch(mainBase + 'index.html')).text() : null;
    const rows = SITES.map(([w, k, d, nb, om]) => ({ w, k, d, inBranch: count(br, nb), oldInBranch: count(br, om), oldInMain: mn === null ? null : count(mn, om) }));
    const bad = rows.filter((r) => r.inBranch !== 1 || r.oldInBranch !== 0 || (r.oldInMain !== null && r.oldInMain !== 1));
    const helpers = { c234D: count(br, "c234D('"), box4: count(br, 'add(...(c234Box4()'), after: count(br, 'if(c234After(f,al))break') };
    const p4 = { branch: count(br, 'o.y-camY-F-2'), main: mn === null ? null : count(mn, 'o.y-camY-F-2') };
    const w10 = ["y:P.y-10,life:.5+i*.15", 'P.y-20+(Math.random()-.5)*30'].map((x) => [count(br, x), mn === null ? null : count(mn, x)]);
    R.S = { sites: SITES.length, bad: bad.length, byRow: SITES.reduce((a, s) => ((a[s[0]] = (a[s[0]] || 0) + 1), a), {}), helpers, p4, w10, mainChecked: mn !== null };
    ck(bad.length === 0, 'S planned sites ' + JSON.stringify(bad));
    ck(helpers.c234D === 35 && helpers.box4 === 1 && helpers.after === 1, 'S helper calls in old code ' + JSON.stringify(helpers));   // 35 c234D calls in old lines (2 label + 9 head + 20 body + 4 top)
    ck(p4.branch >= 1 && (p4.main === null || p4.main === p4.branch), 'S other players label untouched ' + JSON.stringify(p4));
    ck(w10.every(([b, m]) => b >= 1 && (m === null || m === b)), 'S W10 near-feet untouched ' + JSON.stringify(w10));
  }
  // ── F formula (8 dirs × idle/walk × not holding / holding × 3 steps × every kind and planned d)
  {
    const D = { head: [72, 66, 70, 92, 60], body: [30, 26, 40, 50, 24, 22], top: [50, 48, 62], label: [66, 80] };
    R.F = { n: 0, bad: 0, box: 0, boxBad: 0, off: 0, offBad: 0, cases: [] };
    for (const map of ['capital', 'cavemouth']) {
      const t = await open(browser); await setup(t.p, { map });
      const r = await t.p.evaluate(async (D) => {
        const res = { n: 0, bad: [], box: 0, boxBad: [], held: !!__dc().held, dirs: new Set(), anims: new Set() };
        PAUSE = true;   // the game's own update would tick the actor back to idle (no input); here the test ticks it: 8 dirs × idle/walk × 3 steps
        for (let row = 0; row < 8; row++) for (const mv of [false, true]) {
          P.row = row;
          for (let s = 0; s < 3; s++) {
            Char2.tick(C234.A, 130, { dir: C234.pack.dirs[row], moving: mv, holding: DARK() && LKID() });
            res.dirs.add(C234.A.dir); res.anims.add(C234.A.anim);
            for (const kind of Object.keys(D)) for (const d of D[kind]) { const want = __exp(kind, d), got = c234D(kind, d); res.n++; if (got !== want) res.bad.push([row, mv, kind, d, got, want]); }
            const b = Char2.anchor(C234.A, 'box', __dc()), ro = C234.pack.render_offset[C234.A.dir] || 0, top = 94 - b[1] + 4, want = [P.x + b[0] - 48 + ro, P.y - top, b[2] - b[0], top + 4], got = c234Box4();
            res.box++; if (JSON.stringify(got) !== JSON.stringify(want)) res.boxBad.push([row, mv, got, want]);
          }
        }
        PAUSE = false; return { n: res.n, bad: res.bad.slice(0, 5), nBad: res.bad.length, box: res.box, boxBad: res.boxBad.slice(0, 3), nBoxBad: res.boxBad.length, held: res.held, dirs: [...res.dirs], anims: [...res.anims], st: C234.st };
      }, D);
      R.F.n += r.n; R.F.bad += r.nBad; R.F.box += r.box; R.F.boxBad += r.nBoxBad; R.F.cases.push({ map, held: r.held, dirs: r.dirs.length, anims: r.anims, st: r.st, firstBad: r.bad, firstBoxBad: r.boxBad });
      ck(r.st === 'ready' && r.dirs.length === 8 && r.anims.length >= 2 && r.held === (map === 'cavemouth'), 'F ' + map + ' coverage ' + JSON.stringify({ st: r.st, dirs: r.dirs, anims: r.anims, held: r.held }));
      ck(t.pe.length === 0, 'F page errors ' + t.pe.join(' | '));
      await t.bc.close();
    }
    { const t = await open(browser); await setup(t.p, { map: 'capital', on: false });
      const r = await t.p.evaluate((D) => { let n = 0, bad = 0; for (const kind of Object.keys(D)) for (const d of D[kind]) { n++; if (c234D(kind, d) !== d) bad++; } return { n, bad, box: c234Box4(), st: C234.st, calls: Object.values(C234.n).reduce((a, b) => a + b, 0) }; }, D);
      R.F.off = r.n; R.F.offBad = r.bad; R.F.offBox = r.box; R.F.offSt = r.st; R.F.offCalls = r.calls;
      ck(r.bad === 0 && r.box === null && r.st === 'off' && r.calls === 0, 'F flag off ' + JSON.stringify(r)); await t.bc.close(); }
    ck(R.F.bad === 0 && R.F.boxBad === 0 && R.F.n > 0, 'F formula ' + JSON.stringify(R.F.cases.map((c) => [c.map, c.firstBad, c.firstBoxBad])));
  }
  // ── D live sites, flag on and off
  R.D = {};
  for (const on of [true, false]) for (const map of ['capital', 'cavemouth']) {
    const tag = (on ? 'on' : 'off') + '-' + map, t = await open(browser); await setup(t.p, { map, on });
    const r = await t.p.evaluate(async () => {
      const F = PS.F || 64, out = {}, near = (a, b) => a === b;
      // D1 label + emote: record the calls render makes for the player (name Pim) and the expected y at that very call
      const L = [], E = [], ol = label, oe = emoteBubble;
      label = function (x, y, s) { if (String(s).endsWith('Pim')) L.push({ y, want: P.y - camY - __exp('label', F + 2), x, wx: P.x - camX }); return ol.apply(this, arguments); };
      emoteBubble = function (x, y) { E.push({ y, want: P.y - camY - __exp('label', F + 16), x, wx: P.x - camX }); return oe.apply(this, arguments); };
      myEmote = '😀'; myEmoteT = 2; await new Promise((ok) => setTimeout(ok, 500)); label = ol; emoteBubble = oe;
      out.D1 = { label: L.length, labelBad: L.filter((c) => c.y !== c.want || c.x !== c.wx).length, emote: E.length, emoteBad: E.filter((c) => c.y !== c.want || c.x !== c.wx).length, ex: L[0] };
      // D2 the "+n EXP" number
      { const n0 = TXT.length; gainExp(1); const nw = TXT.slice(n0).filter((q) => / EXP$/.test(q.s)), tx = nw[0], want = P.y - __exp('head', 72); out.D2 = { pushed: nw.length, y: tx && tx.y, want, ok: nw.length === 1 && tx.y === want && tx.x === P.x }; }
      // D3 celebrate: rays (body e 0) + confetti (head e 0)
      { const f0 = FX.length; celebrate(); const nw = FX.slice(f0), rays = nw.filter((f) => f.k === 'rays'), conf = nw.filter((f) => f.k === 'confetti'), wb = P.y - __exp('body', 30), wh = P.y - __exp('head', 60);
        out.D3 = { rays: rays.length, raysOk: rays.every((f) => f.y === wb), conf: conf.length, confOk: conf.every((f) => f.y === wh), wb, wh }; }
      // D4 skills guard (body e −6) and hawk (body e 0)
      { const f0 = FX.length; SKFX.guard({ x: P.x, y: P.y }); const g = FX.slice(f0).filter((f) => f.k === 'shield2'), wg = P.y - __exp('body', 24);
        const f1 = FX.length; SKFX.hawk({ x: P.x, y: P.y }); const h = FX.slice(f1).filter((f) => f.k === 'feather'), wh = P.y - __exp('body', 30);
        out.D4 = { guard: g.length, guardOk: g.every((f) => f.y === wg && f.x === P.x), hawk: h.length, hawkOk: h.every((f) => f.y === wh && f.x === P.x) }; }
      // D5 evade → after-image ghosts: Char2 draws (alpha < 1) at the old ghost feet, or the old sheet when off
      { for (let i = FX.length - 1; i >= 0; i--) if (FX[i].k !== 'after') FX.splice(i, 1);
        const C = window.Char2, rec = []; let oldSheets = 0; const odi = ctx.drawImage;
        window.Char2 = Object.assign({}, C, { draw(c, app, dc, A, x, y, s) { rec.push({ x, y, al: c.globalAlpha }); return C.draw.apply(C, arguments); } });
        ctx.drawImage = function (im) { if ((im === PS.walk || im === PS.stand) && ctx.globalAlpha < 1) oldSheets++; return odi.apply(this, arguments); };
        SKFX.evade({ x: P.x, y: P.y }); const afters = FX.filter((f) => f.k === 'after');
        PAUSE = true; rec.length = 0; oldSheets = 0; render(performance.now() / 1000); PAUSE = false;
        const wantFeet = afters.map((f) => [Math.round(P.x - F / 2 - camX + f.ox) + F / 2, Math.round(P.y - (F - 2) - camY) + F - 2]);   // the camera as render left it
        const ghosts = rec.filter((q) => q.al < 1), body = rec.filter((q) => q.al >= 1);
        const okFeet = wantFeet.every((w) => ghosts.some((q) => q.x === w[0] && q.y === w[1])) && ghosts.length === wantFeet.length;
        window.Char2 = C; ctx.drawImage = odi;
        out.D5 = { afters: afters.length, ghosts: ghosts.length, okFeet, alphaOk: ghosts.every((q) => q.al > 0 && q.al <= .35 + 1e-9), body: body.length, oldSheets, ex: [wantFeet[0], ghosts[0]] }; }
      // D6 the player's line-gap box (charClip cuts holes: the first rect after the huge one is the player's)
      { const rs = [], orc = ctx.rect; ctx.rect = function () { if (arguments[0] !== -9999) rs.push([...arguments]); return orc.apply(this, arguments); }; ctx.save(); charClip(); ctx.restore(); ctx.rect = orc;
        const b = rs[0], ro = window.__on() ? (C234.pack.render_offset[C234.A.dir] || 0) : 0, bx = window.__on() ? Char2.anchor(C234.A, 'box', __dc()) : null;
        const want = bx ? [P.x + bx[0] - 48 + ro - camX, P.y - (94 - bx[1] + 4) - camY, bx[2] - bx[0], 94 - bx[1] + 8] : [P.x - 20 - camX, P.y - 64 - camY, 40, 68];
        out.D6 = { got: b, want, ok: JSON.stringify(b) === JSON.stringify(want) }; }
      out.st = C234.st; out.n = Object.assign({}, C234.n); out.held = !!(DARK() && LKID());
      return out;
    });
    R.D[tag] = r;
    const okLab = r.D1.label >= 3 && r.D1.labelBad === 0 && r.D1.emote >= 3 && r.D1.emoteBad === 0;
    ck(okLab, 'D1 ' + tag + ' label/emote ' + JSON.stringify(r.D1));
    ck(r.D2.ok && r.D2.pushed >= 1, 'D2 ' + tag + ' EXP number ' + JSON.stringify(r.D2));
    ck(r.D3.rays === 1 && r.D3.raysOk && r.D3.conf > 0 && r.D3.confOk, 'D3 ' + tag + ' celebrate ' + JSON.stringify(r.D3));
    ck(r.D4.guard === 1 && r.D4.guardOk && r.D4.hawk > 0 && r.D4.hawkOk, 'D4 ' + tag + ' skills ' + JSON.stringify(r.D4));
    if (on) ck(r.D5.afters === 5 && r.D5.ghosts === 5 && r.D5.okFeet && r.D5.alphaOk && r.D5.oldSheets === 0 && r.D5.body === 1, 'D5 ' + tag + ' after-image by Char2 ' + JSON.stringify(r.D5));
    else ck(r.D5.afters === 5 && r.D5.ghosts === 0 && r.D5.oldSheets === 5, 'D5 ' + tag + ' after-image old sheet ' + JSON.stringify(r.D5));
    ck(r.D6.ok, 'D6 ' + tag + ' line-gap box ' + JSON.stringify(r.D6));
    ck(on ? r.st === 'ready' && r.n.anchor > 0 && r.n.after >= 5 : r.st === 'off' && Object.values(r.n).every((v) => v === 0), 'D ' + tag + ' state ' + JSON.stringify({ st: r.st, n: r.n }));
    ck(r.held === (map === 'cavemouth'), 'D ' + tag + ' lantern ' + r.held);
    ck(t.pe.length === 0, 'D ' + tag + ' page errors ' + t.pe.join(' | '));
    await t.bc.close();
  }
  // ── K anchor null → failed and the old number in the same call
  { const t = await open(browser); await setup(t.p, { map: 'capital' });
    const r = await t.p.evaluate(() => { const C = window.Char2; let left = 1; window.Char2 = Object.assign({}, C, { anchor(...a) { if (left > 0) { left--; return null; } return C.anchor(...a); } });
      const v = c234D('head', 72), st = C234.st, why = C234.why, v2 = c234D('body', 30), b = c234Box4(); window.Char2 = C; return { v, st, why, v2, b }; });
    R.K = r; ck(r.v === 72 && r.st === 'failed' && r.why === 'anchor head' && r.v2 === 30 && r.b === null, 'K anchor null ' + JSON.stringify(r));
    ck(t.pe.length === 0, 'K page errors ' + t.pe.join(' | ')); await t.bc.close(); }
  // ── screenshots for the owner: name label (capital), wading, sitting · flag on and off
  R.shots = [];
  for (const on of [true, false]) {
    const t = await open(browser); await setup(t.p, { map: 'capital', on });
    await t.p.evaluate(() => { myEmote = '😀'; myEmoteT = 2.4; }); await sleep(300);
    const f1 = path.join(out, 'm4-label-' + (on ? 'on' : 'off') + '.png'); await t.p.screenshot({ path: f1 }); R.shots.push(path.basename(f1));
    await t.bc.close();
  }
  R.errorsN = errors.length;
  console.log(JSON.stringify({ errors, results: R }));
  console.log('errors', errors.length);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.log(JSON.stringify({ errors: ['crash ' + String(e && e.stack || e).slice(0, 400)] })); console.log('errors 1'); process.exit(2); });
