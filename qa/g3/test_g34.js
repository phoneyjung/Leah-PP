// G3.4 tests (Claude · 2 Nov 2569) · G3_0_RENDERER_PLAN.md K3c K7 (encode / decode) · G3_0_BASELINE.md section 4
// k3c : Char2.portrait() for all 640 colour sets (160 looks x 4 houses) -> PNG files in a folder OUTSIDE the repo -> the frozen-oracle checker
//       python3 -I qa/g2-3-portrait/tools/pt_s5.py ROOT --check DIR (oracle / shade map rule / checks of G2.3 unchanged) must exit 0 ·
//       then 2 broken folders made from it (2 files swapped · 1 px changed) must exit 1 · portrait fallbacks: picture missing -> null,
//       colour mask broken -> the portrait as drawn · borrow rules (handle, release, same canvas) · INJECT=P1 / P2 (must fail)
// k7  : encode(app) -> decode(text) for all 160 looks gives the same Appearance · encode of a look this pack cannot draw -> null ·
//       malformed text -> null · well-formed text with an unknown part / colour name -> that slot's default (the save rule) · never throws
// usage: PORT=<server at repo root> node qa/g3/test_g34.js k3c|k7 OUT.json [TMP_DIR for k3c]       exit 0 = all pass
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
const PORT = process.env.PORT || 8792, MODE = process.argv[2], OUT = process.argv[3] || '/tmp/g34-' + MODE + '.json', TMP = process.argv[4];
const ROOT = process.cwd(), base = 'http://127.0.0.1:' + PORT + '/';
const INJ = {   // the portrait faults K3c must catch
  P1: ["S.smap.materials[id].shade_index_by_G.map((k) => cols[k])", "S.smap.materials[id].shade_index_by_G.map((k) => cols[Math.min(k + 1, cols.length - 1)])"],   // shade map off by one
  P2: ["S = PT ? ST.portrait :", "S = PT ? { A: ST.portrait.A, M: null } :"],                                                       // portrait never recoloured
  E1: ["COL.map((g) => app.color[g]).join('.')", "COL.map((g) => app.color[g]).reverse().join('.')"],                            // encode writes the colours in another order
  S0: ['', ''] }[process.env.INJECT || ''];
let C2SRC = null;
if (process.env.INJECT) { if (!INJ) { console.log('unknown INJECT'); process.exit(2); } C2SRC = fs.readFileSync(path.join(ROOT, 'char2.src.js'), 'utf8'); if (!C2SRC.includes(INJ[0])) { console.log('inject target missing'); process.exit(2); } C2SRC = C2SRC.replace(INJ[0], INJ[1]); }

async function page(b, abort) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  if (C2SRC) await p.route((u) => u.pathname.endsWith('/char2.js'), (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: C2SRC }));
  if (abort) await p.route((u) => abort.includes(path.basename(u.pathname)), (r) => r.fulfill({ status: 404, body: '' }));
  await p.goto(base + 'qa/g3/k3-harness.html', { waitUntil: 'load' });
  const r = await p.evaluate(async () => { const r = await Char2.load('../../c2-pack.json'); return { ready: r.ready, failed: r.failed, modes: r.modes }; });
  return { ctx, p, errs, load: r };
}
const runPy = (dir) => { const r = spawnSync('python3', ['-I', path.join(ROOT, 'qa/g2-3-portrait/tools/pt_s5.py'), ROOT, '--check', dir], { encoding: 'utf8', maxBuffer: 1 << 26 });
  let j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) {} return { code: r.status, json: j, err: r.stderr.slice(-400) }; };

(async () => {
  const b = await chromium.launch(); const R = { mode: MODE, inject: process.env.INJECT || null }; let fails = 0;
  const check = (name, ok, extra) => { if (!ok) fails++; (R.cases = R.cases || []).push(Object.assign({ case: name, ok }, extra || {})); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra && extra.note ? ' · ' + extra.note : '')); };
  if (MODE === 'k3c') {
    if (!TMP) { console.log('k3c needs a TMP_DIR outside the repo'); process.exit(2); }
    const dir = path.join(TMP, 'k3c-' + Date.now()); fs.mkdirSync(dir, { recursive: true });
    const P = await page(b);
    // 640 portraits, one at a time (borrow -> PNG -> release), cache trimmed every set
    const N = await P.p.evaluate(async () => { const pal = Char2._test.state() && (await (await fetch('../../c2-pack.json')).json()).palette; return { hair: pal.hair.map((e) => e[0]), iris: pal.iris.map((e) => e[0]), skin: pal.skin.map((e) => e[0]), house: pal.house.map((e) => e[0]) }; });
    let written = 0, nulls = 0, sizesOk = true, maxBorrowed = 0;
    for (let h = 0; h < N.hair.length; h++) {
      const batch = await P.p.evaluate(({ N, h }) => {
        const out = [];
        for (let i = 0; i < N.iris.length; i++) for (let s = 0; s < N.skin.length; s++) for (let u = 0; u < N.house.length; u++) {
          const app = { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair: N.hair[h], iris: N.iris[i], skin: N.skin[s] } };
          const H = Char2.portrait(app, { house: N.house[u], held: null });
          if (!H) { out.push({ name: [h, i, s, u], png: null }); continue; }
          const c = H.canvas, size = [c.width, c.height], bor = Char2.stats().borrowed; out.push({ name: [h, i, s, u], png: c.toDataURL('image/png').split(',')[1], size, bor }); H.release();
        }
        Char2.trim(); return out;
      }, { N, h });
      for (const x of batch) {
        if (!x.png) { nulls++; continue; }
        if (x.size[0] !== 384 || x.size[1] !== 384) sizesOk = false; maxBorrowed = Math.max(maxBorrowed, x.bor);
        fs.writeFileSync(path.join(dir, 'h' + x.name[0] + '_i' + x.name[1] + '_s' + x.name[2] + '_u' + x.name[3] + '.png'), Buffer.from(x.png, 'base64')); written++;
      }
    }
    const st = await P.p.evaluate(() => Char2.stats());
    check('640 portraits written (384 x 384, borrowed one at a time)', written === 640 && nulls === 0 && sizesOk && maxBorrowed === 589824 && st.borrowed === 0 && st.handles === 0, { note: written + ' files · null ' + nulls + ' · max borrowed ' + maxBorrowed + ' B · after: borrowed ' + st.borrowed + ' handles ' + st.handles });
    const c0 = runPy(dir); R.check = c0.json;
    check('pt_s5.py --check (frozen oracle): 640 x 0 wrong px, no cross-material / fixed / alpha change, every recolour colour a Palette shade',
      c0.code === 0 && c0.json && c0.json.ok && c0.json.files_read === 640 && c0.json.leak_640.oracle_wrong_px === 0, { note: 'exit ' + c0.code + ' · ' + JSON.stringify(c0.json && c0.json.leak_640) + (c0.code ? ' · ' + c0.err : '') });
    if (!process.env.INJECT) {   // the checker must fail on broken folders (made from the real output, then put back)
      const f1 = path.join(dir, 'h0_i0_s0_u0.png'), f2 = path.join(dir, 'h1_i0_s0_u0.png'), a = fs.readFileSync(f1), bb = fs.readFileSync(f2);
      fs.writeFileSync(f1, bb); fs.writeFileSync(f2, a); const c1 = runPy(dir); fs.writeFileSync(f1, a); fs.writeFileSync(f2, bb);
      check('checker catches 2 swapped portraits (exit 1)', c1.code === 1, { note: 'oracle wrong px ' + (c1.json && c1.json.leak_640.oracle_wrong_px) });
      const fx = spawnSync('python3', ['-I', '-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGBA");px=im.load();x,y=next((x,y) for y in range(384) for x in range(384) if px[x,y][3]);r,g,b_,a=px[x,y];px[x,y]=((r+1)%256,g,b_,a);im.save(sys.argv[1])', f1]);
      const c2 = runPy(dir); fs.writeFileSync(f1, a);
      check('checker catches 1 px changed in 1 portrait (exit 1)', fx.status === 0 && c2.code === 1, { note: 'oracle wrong px ' + (c2.json && c2.json.leak_640.oracle_wrong_px) });
      const c3 = runPy(dir); check('folder put back -> exit 0 again', c3.code === 0);
    }
    fs.rmSync(dir, { recursive: true, force: true }); R.tmpRemoved = !fs.existsSync(dir);
    // borrow rules + fallbacks
    const rules = await P.p.evaluate(() => {
      const app = Char2.look({}), dc = { house: 'wing', held: null }, h1 = Char2.portrait(app, dc), h2 = Char2.portrait(app, dc), s1 = Char2.stats();
      const same = !!h1 && !!h2 && h1.canvas === h2.canvas && s1.borrowed === 589824; h1.release(); h1.release(); const s2 = Char2.stats(); h2.release(); const s3 = Char2.stats();
      const bad = [Char2.portrait(null, dc), Char2.portrait(app, null), Char2.portrait(app, { house: 'moon' }), Char2.portrait(Object.assign({}, app, { color: { hair: 'x', iris: 'green', skin: 'medium' } }), dc)];
      return { same, afterOne: s2.borrowed, afterBoth: s3.borrowed, handles: s3.handles, deadCanvas: h1.canvas === null, bad: bad.map((x) => x === null) };
    });
    check('portrait borrow: same canvas twice = +0 B · release twice harmless · all back = 0', rules.same && rules.afterOne === 589824 && rules.afterBoth === 0 && rules.handles === 0 && rules.deadCanvas);
    check('portrait with bad app / dc / house / colour -> null (4/4)', rules.bad.every(Boolean), { note: JSON.stringify(rules.bad) });
    await P.ctx.close();
    const raw = fs.readFileSync(path.join(ROOT, 'c2-pilot-kid4-pt.png')).toString('base64');
    for (const [name, abort, want] of [['portrait picture missing -> portrait() null (the rest still loads)', ['c2-pilot-kid4-pt.png'], 'null'],
      ['portrait colour mask missing -> the portrait as drawn (no recolour)', ['c2-pilot-kid4-pt-mask.png'], 'raw'], ['shade map missing -> the portrait as drawn', ['c2-pilot-kid4-pt-shademap.json'], 'raw']]) {
      const Q = await page(b, abort);
      const got = await Q.p.evaluate(async (raw) => {
        const H = Char2.portrait(Char2.look({}), { house: 'sun', held: null }); if (!H) return 'null';
        const i = new Image(); i.src = 'data:image/png;base64,' + raw; await i.decode(); const c = document.createElement('canvas'); c.width = c.height = 384; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
        const a = g.getImageData(0, 0, 384, 384).data, b = H.canvas.getContext('2d').getImageData(0, 0, 384, 384).data; let d = 0; for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) d++; H.release(); return d === 0 ? 'raw' : 'recoloured (' + d + ' bytes differ from the file)';
      }, raw);
      check(name, Q.load.ready && got === want && !Q.errs.length, { note: 'ready ' + Q.load.ready + ' · failed ' + JSON.stringify(Q.load.failed) + ' · got ' + got });
      await Q.ctx.close();
    }
  } else if (MODE === 'k7') {
    const P = await page(b);
    const out = await P.p.evaluate(() => {
      const J = JSON.stringify, r = { round: 0, roundOf: 0, lens: [], bad: [], enc: [], dec: [], lenient: [], throws: 0 };
      const pk = (Char2._test.state() || {}).key; const pal = { hair: ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'silver', 'green'], iris: ['brown', 'black', 'green', 'blue', 'amber'], skin: ['light', 'medium', 'tan', 'deep'] };
      for (const h of pal.hair) for (const i of pal.iris) for (const s of pal.skin) {   // 160 looks, made through look() (the game's way in)
        const a = Char2.look({ char2: { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair: h, iris: i, skin: s } } }), t = Char2.encode(a), d = Char2.decode(t);
        r.roundOf++; if (a && t && J(d) === J(a) && d !== a) r.round++; else if (r.bad.length < 5) r.bad.push([h, i, s, t, d]); if (t) r.lens.push(t.length);
      }
      const A = Char2.look({}), sample = Char2.encode(A);
      const E = [['null', null], ['string', 'x'], ['v 1', Object.assign({}, A, { v: 1 })], ['set other', Object.assign({}, A, { set: 'c3' })], ['base other', Object.assign({}, A, { base: 'adult1' })],
        ['base __proto__', Object.assign({}, A, { base: '__proto__' })], ['gender m', Object.assign({}, A, { gender: 'm' })], ['hair part unknown', Object.assign({}, A, { parts: Object.assign({}, A.parts, { hair: 'h99' }) })],
        ['outfit missing', Object.assign({}, A, { parts: Object.assign({}, A.parts, { outfit: undefined }) })], ['head part not in base', Object.assign({}, A, { parts: Object.assign({}, A.parts, { head: 'crown' }) })],
        ['colour unknown', Object.assign({}, A, { color: Object.assign({}, A.color, { hair: 'purple' }) })], ['colour array', Object.assign({}, A, { color: Object.assign({}, A.color, { iris: ['green'] }) })],
        ['colour missing', Object.assign({}, A, { color: { hair: 'brown', iris: 'green' } })], ['parts not object', Object.assign({}, A, { parts: 'kid4' })]];
      for (const [n, x] of E) { let v; try { v = Char2.encode(x); } catch (e) { r.throws++; v = 'THROW'; } r.enc.push([n, v === null]); }
      const D = [['not a string', 42], ['object', {}], ['null', null], ['empty', ''], ['spaces', '   '], ['4 fields', 'c2.2|kid4|f|kid4.kid4.kid4.-.-.-'], ['6 fields', sample + '|x'],
        ['version 1', sample.replace('c2.2', 'c2.1')], ['set other', sample.replace('c2.2', 'c3.2')], ['base unknown', sample.replace('|kid4|f|', '|kid9|f|')], ['base __proto__', sample.replace('|kid4|f|', '|__proto__|f|')],
        ['gender x', sample.replace('|f|', '|x|')], ['gender m on a girl base', sample.replace('|f|', '|m|')], ['5 parts', sample.replace('.-.-.-|', '.-.-|')], ['needed part empty', sample.replace('|kid4.', '|-.')],
        ['2 colours', sample.replace(/\.medium$/, '')], ['upper case colour', sample.replace('brown', 'Brown')], ['colour with space', sample.replace('green', 'gr een')], ['too long (1 MB)', sample + 'x'.repeat(1 << 20)],
        ['trailing newline', sample + '\n'], ['unicode', sample.replace('brown', 'บราวน์')]];
      for (const [n, x] of D) { let v; try { v = Char2.decode(x); } catch (e) { r.throws++; v = 'THROW'; } r.dec.push([n, v === null]); }
      const L = [['unknown hair colour -> default brown', sample.replace(/\|[a-z]+\./, '|purple.'), (d) => d && d.color.hair === 'brown'],
        ['unknown iris colour -> default green', sample.replace('.green.', '.violet.'), (d) => d && d.color.iris === 'green'],
        ['unknown hair part -> base part', sample.replace('|kid4.kid4.kid4.', '|h99.kid4.kid4.'), (d) => d && d.parts.hair === 'kid4'],
        ['unknown head part -> none', sample.replace('.-.-.-|', '.crown.-.-|'), (d) => d && d.parts.head === null]];
      for (const [n, x, f] of L) { const d = Char2.decode(x); r.lenient.push([n, !!f(d), Char2.encode(d) !== null]); }
      r.sample = sample; r.maxLen = Math.max(...r.lens); r.notLoaded = (() => { Char2.release(); return [Char2.encode(A), Char2.decode(sample)]; })();
      return r;
    });
    await P.ctx.close();
    check('encode -> decode 160/160 looks give the same Appearance (a new object)', out.round === 160 && out.roundOf === 160, { note: out.round + '/' + out.roundOf + ' · longest text ' + out.maxLen + ' chars · e.g. ' + out.sample + (out.bad.length ? ' · bad ' + JSON.stringify(out.bad) : '') });
    check('encode of a look this pack cannot draw -> null (' + out.enc.length + ' cases)', out.enc.every((x) => x[1]), { note: out.enc.filter((x) => !x[1]).map((x) => x[0]).join(', ') });
    check('decode of malformed text -> null (' + out.dec.length + ' cases)', out.dec.every((x) => x[1]), { note: out.dec.filter((x) => !x[1]).map((x) => x[0]).join(', ') });
    check('decode of well-formed text with an unknown name -> that slot default, encodable again (' + out.lenient.length + ' cases)', out.lenient.every((x) => x[1] && x[2]), { note: out.lenient.filter((x) => !(x[1] && x[2])).map((x) => x[0]).join(', ') });
    check('nothing throws · before load / after release -> null', out.throws === 0 && out.notLoaded[0] === null && out.notLoaded[1] === null);
    R.k7 = out; if (P.errs.length) { fails++; console.log('page errors ' + P.errs.join(' | ')); }
  }
  R.fails = fails; fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); await b.close(); process.exit(fails ? 1 : 0);
})();
