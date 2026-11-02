// G3.2 tests (Claude · 2 Nov 2569) for char2.js load() + look() on the QA harness page (no game, no real save).
// K2 (load part): every pack file missing / wrong size / damaged, one at a time and all together -> load() resolves (never rejects),
//    reports exactly the expected failed list and modes (contract section 7), 0 page errors, 0 unhandled rejections.
// K7 (look part): T1-T12 sample saves (same samples as qa/g2-6/test_char2_save.js) against the frozen G2.6 dry-run oracle char2_save.js,
//    + 15 broken / odd S.char2 cases with the expected Appearance written in this file -> the save copy is unchanged (0 fields) and
//    every result is a NEW object.
// usage: PORT=<server at repo root> BAD=<dir from make_bad_files.py> node qa/g3/test_g32_load_look.js OUT.json     exit 0 = all pass
//        INJECT=I1|I2|I3|I4 serves a broken copy of char2.js (I1 mask check always true · I2 old-save reader skips pd219 ·
//        I3 look() writes into the save · I4 load() throws when the pack is missing) -> the suite MUST fail (exit 1)
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const { char2FromSave, readSlots } = require('../g2-6/char2_save.js');
const PORT = process.env.PORT || 8792, BAD = process.env.BAD, OUT = process.argv[2] || '/tmp/g32.json';
const base = 'http://127.0.0.1:' + PORT + '/', PAGE = base + 'qa/g3/char2-test.html', PACK = '../../c2-pack.json';
const bad = (f) => ({ file: path.join(BAD, f) });
const INJ = { I1: ['function kidMaskOk(p, A, M) {', 'function kidMaskOk(p, A, M) { return true;'],
  I2: ['if (pd219Look(S.pd219)) src.push', 'if (false) src.push'],
  I3: ['if (!ST || !isObj(save)) return null;', 'if (!ST || !isObj(save)) return null; save.seen = 1;'],
  I4: ["if (!packOk(p)) return { ready: false, failed: ['pack'], pack: null };", "if (!packOk(p)) throw new Error('inject');"] }[process.env.INJECT || ''];
let C2SRC = fs.readFileSync(process.env.C2_FILE || path.join(process.cwd(), 'char2.js'), 'utf8');   // C2_FILE = run the suite on another copy (e.g. the G3.2 first version)
if (INJ) { if (!C2SRC.includes(INJ[0])) { console.log('inject target missing'); process.exit(2); } C2SRC = C2SRC.replace(INJ[0], INJ[1]); }
// I4 also turns the safety catch off, so a throw would surface as a rejection
if (process.env.INJECT === 'I4') { const t = "LOADING = doLoad(packUrl, g).catch(() => ({ ready: false, failed: ['internal'], pack: null }));"; if (!C2SRC.includes(t)) { console.log('inject target missing'); process.exit(2); } C2SRC = C2SRC.replace(t, 'LOADING = doLoad(packUrl, g);'); }
const DEF_PARTS = { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: null, face_acc: null, back: null };
const AP = (hair, iris, skin, parts) => ({ v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: Object.assign({}, DEF_PARTS, parts || {}), color: { hair, iris, skin } });
const FULL_MODES = { idle: 'idle', walk: 'walk', raw: [], hold: true, lantern_light: true, portrait: 'recolour' };
const M = (o) => Object.assign({}, FULL_MODES, o);

// ---- K2 table: route -> expected (failed sorted; modes only when ready) ----
const K2 = [
  ['full set', {}, true, [], FULL_MODES],
  ['pack missing', { 'c2-pack.json': 404 }, false, ['pack']],
  ['pack not JSON', { 'c2-pack.json': { body: 'not json {' } }, false, ['pack']],
  ['pack cell 64', { 'c2-pack.json': bad('pack-cell64.json') }, false, ['pack']],
  ['pack bad palette hex', { 'c2-pack.json': bad('pack-badhex.json') }, false, ['pack']],
  ['idle missing', { 'c2-pilot-kid4-idleanim.png': 404 }, true, ['idle'], M({ idle: 'walk-f1', hold: false })],
  ['idle wrong size', { 'c2-pilot-kid4-idleanim.png': { file: 'c2-pilot-kid4-walk.png' } }, true, ['idle'], M({ idle: 'walk-f1', hold: false })],
  ['walk missing', { 'c2-pilot-kid4-walk.png': 404 }, true, ['walk'], M({ walk: 'idle-f1' })],
  ['walk wrong size 575', { 'c2-pilot-kid4-walk.png': bad('walk-575.png') }, true, ['walk'], M({ walk: 'idle-f1' })],
  ['walkhold missing', { 'c2-pilot-kid4-walkhold.png': 404 }, true, ['walkhold'], M({ hold: false })],
  ['idle + walk missing', { 'c2-pilot-kid4-idleanim.png': 404, 'c2-pilot-kid4-walk.png': 404 }, false, ['idle', 'walk']],
  ['idle mask missing', { 'c2-pilot-kid4-idleanim-mask.png': 404 }, true, ['idle-mask'], M({ raw: ['idle'] })],
  ['walk mask missing', { 'c2-pilot-kid4-walk-mask.png': 404 }, true, ['walk-mask'], M({ raw: ['walk'] })],
  ['walkhold mask missing', { 'c2-pilot-kid4-walkhold-mask.png': 404 }, true, ['walkhold-mask'], M({ raw: ['walkhold'] })],
  ['walk mask G 9 (1 px)', { 'c2-pilot-kid4-walk-mask.png': bad('walk-mask-G9.png') }, true, ['walk-mask'], M({ raw: ['walk'] })],
  ['walk mask id 0 (1 px)', { 'c2-pilot-kid4-walk-mask.png': bad('walk-mask-id0.png') }, true, ['walk-mask'], M({ raw: ['walk'] })],
  ['walk mask = walkhold mask', { 'c2-pilot-kid4-walk-mask.png': { file: 'c2-pilot-kid4-walkhold-mask.png' } }, true, ['walk-mask'], M({ raw: ['walk'] })],
  ['hold anchors missing', { 'c2-pilot-hold-anchors.json': 404 }, true, ['hold'], M({ hold: false })],
  ['hold anchors 5 frames', { 'c2-pilot-hold-anchors.json': bad('hold-5frames.json') }, true, ['hold'], M({ hold: false })],
  ['lantern missing', { 'c2-held-lantern_L0-S-trial.png': 404 }, true, ['lantern'], M({ hold: false })],
  ['lantern 32x31', { 'c2-held-lantern_L0-S-trial.png': bad('lantern-32x31.png') }, true, ['lantern'], M({ hold: false })],
  ['lantern light missing', { 'c2-held-lantern_L0-S-trial-light.png': 404 }, true, ['lantern-light'], M({ lantern_light: false })],
  ['portrait missing', { 'c2-pilot-kid4-pt.png': 404 }, true, ['portrait'], M({ portrait: null })],
  ['portrait mask missing', { 'c2-pilot-kid4-pt-mask.png': 404 }, true, ['portrait-mask'], M({ portrait: 'raw' })],
  ['portrait mask json missing', { 'c2-pilot-kid4-pt-mask.json': 404 }, true, ['portrait-mask'], M({ portrait: 'raw' })],
  ['shade map missing', { 'c2-pilot-kid4-pt-shademap.json': 404 }, true, ['portrait-mask'], M({ portrait: 'raw' })],
  // T22 R3-R5 regressions: a file that loads but carries wrong values
  ['pack walk_ms 0', { 'c2-pack.json': bad('pack-walkms0.json') }, false, ['pack']],
  ['pack idle_loop [99]', { 'c2-pack.json': bad('pack-idleloop99.json') }, false, ['pack']],
  ['pack budget -1', { 'c2-pack.json': bad('pack-budgetneg.json') }, false, ['pack']],
  ['pack recolour {}', { 'c2-pack.json': bad('pack-recolour-empty.json') }, false, ['pack']],
  ['pack without hold', { 'c2-pack.json': bad('pack-nohold.json') }, false, ['pack']],
  ['pack colour named __proto__', { 'c2-pack.json': bad('pack-protoname.json') }, false, ['pack']],
  ['hold S anchor null', { 'c2-pilot-hold-anchors.json': bad('hold-S-anchor-null.json') }, true, ['hold'], M({ hold: false })],
  ['hold SE fist empty', { 'c2-pilot-hold-anchors.json': bad('hold-SE-fist-empty.json') }, true, ['hold'], M({ hold: false })],
  ['hold fist on a clear px', { 'c2-pilot-hold-anchors.json': bad('hold-fist-on-clear.json') }, true, ['hold'], M({ hold: false })],
  ['hold N has a hand', { 'c2-pilot-hold-anchors.json': bad('hold-N-has-hand.json') }, true, ['hold'], M({ hold: false })],
  ['hold hand flips inside a dir', { 'c2-pilot-hold-anchors.json': bad('hold-hand-flips.json') }, true, ['hold'], M({ hold: false })],
  ['shade map values 99', { 'c2-pilot-kid4-pt-shademap.json': bad('shademap-99.json') }, true, ['portrait-mask'], M({ portrait: 'raw' })],
  ['shade map one short', { 'c2-pilot-kid4-pt-shademap.json': bad('shademap-short.json') }, true, ['portrait-mask'], M({ portrait: 'raw' })],
  ['every file but the pack missing', { '*files': 404 }, false, ['idle', 'walk', 'walkhold']],
  ['every file missing', { '*': 404 }, false, ['pack']],
];
const FULL_FIXED = { images: 576 * 768 * 4 * 2 + 384 * 768 * 4 + 384 * 384 * 4, masks: 576 * 768 * 4 * 2 + 384 * 768 * 4 + 384 * 384 * 4, other: 32 * 32 * 4 * 2 };

// ---- K7 samples: the T1-T12 builders of qa/g2-6/test_char2_save.js (same data) ----
const sb = (o) => Object.assign({ v: 1, snd: true, name: 'Test', kid: 0, house: 'sun', age: 7, lang: 'th', lv: 3, exp: 10, coins: 20, sid: 's1' }, o);
const pd = (o) => Object.assign({ v: 1, hair: 1, face: 1, eyes: 1, mouth: 1, body: 1, hc: 2, ec: 4, tn: 1 }, o);
const one = (S) => ({ 'leahpp2d-slots': JSON.stringify({ v: 2, slots: [S], cur: 0 }) });
const T = [
  ['T1', one(sb({}))], ['T2', one(sb({ kid: 1, hc: 3, ec: 4 }))], ['T3', one(sb({ hc: 0, ec: 0, hcol: 5, ecol: 3, gender194: 'f' }))],
  ['T4', one(sb({ hc: 0, ec: 0, appearance169: { v: 1, hair: 1, face: 2, hc: 6, ec: 1 } }))],
  ['T5', one(sb({ gmSprite170: { v: 1, on: true }, appearance169: { v: 1, hair: 0, face: 0, hc: 7, ec: 2 } }))],
  ['T6', { 'leahpp2d-slots': JSON.stringify({ v: 2, cur: 1, slots: [0, 1, 2, 3].map(t => sb({ sid: 's' + t, pd219: pd({ tn: t }) })) }) }],
  ['T7', one(sb({ hcol: 4, pd219: pd({ set: 8, hc: -1, ec: 3, tn: 2 }) }))], ['T8', one(sb({ kid: 4, gender194: 'm', hc: 1, ec: 1 }))],
  ['T9', one(sb({ hc: 99, ec: null, hcol: 'x', ecol: 2.5, appearance169: null, pd219: { v: 1, hair: 1, tn: -5 } }))],
  ['T10', { 'leahpp2d-slots': JSON.stringify({ v: 2, cur: 2, slots: [sb({ sid: 'a', hc: 0, ec: 1 }), sb({ sid: 'b', kid: 3, gender194: 'm' }), sb({ sid: 'c', pd219: pd({ hc: 7, ec: 0, tn: 3 }) }), sb({ sid: 'd' })] }) }],
  ['T11', { 'leahpp2d-v1': JSON.stringify(sb({ hc: 2, ec: 2 })) }],
  ['T12', one(sb({ hc: 1, ec: 1, char2: { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair: 'pink', iris: 'amber', skin: 'deep' }, from: 'owner' } }))],
];
const oracle = (S) => { const r = char2FromSave(S).char2; return r ? AP(r.color.hair, r.color.iris, r.color.skin) : null; };
// ---- K7 broken / odd S.char2 (expected written by hand from G3_2_LOAD_LOOK.md table) ----
const OLD = { hc: 3, ec: 4 };                     // old fields of these saves -> red / amber / medium
const C2 = (o) => Object.assign({ v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4' }, color: { hair: 'pink', iris: 'blue', skin: 'tan' } }, o);
const B7 = [
  ['B1 char2 is a string -> old fields', sb(Object.assign({ char2: 'x' }, OLD)), AP('red', 'amber', 'medium')],
  ['B2 char2 is an array -> old fields', sb(Object.assign({ char2: [] }, OLD)), AP('red', 'amber', 'medium')],
  ['B3 char2 null -> old fields', sb(Object.assign({ char2: null }, OLD)), AP('red', 'amber', 'medium')],
  ['B4 v 1 -> old fields', sb(Object.assign({ char2: C2({ v: 1 }) }, OLD)), AP('red', 'amber', 'medium')],
  ['B5 v 3 (newer game) -> old fields', sb(Object.assign({ char2: C2({ v: 3 }) }, OLD)), AP('red', 'amber', 'medium')],
  ['B6 set c3 -> old fields', sb(Object.assign({ char2: C2({ set: 'c3' }) }, OLD)), AP('red', 'amber', 'medium')],
  ['B7 base with no art -> null', sb({ char2: C2({ base: 'adult1' }) }), null],
  ['B8 gender m on the girl base -> null', sb({ char2: C2({ gender: 'm' }) }), null],
  ['B9 gender missing -> base gender', sb({ char2: C2({ gender: undefined }) }), AP('pink', 'blue', 'tan')],
  ['B10 parts missing -> defaults', sb({ char2: C2({ parts: undefined }) }), AP('pink', 'blue', 'tan')],
  ['B11 unknown parts -> defaults / null', sb({ char2: C2({ parts: { hair: 'zzz', eyes: 7, outfit: null, head: 'hat9', back: {} } }) }), AP('pink', 'blue', 'tan')],
  ['B12 wrong colours -> that field default', sb({ char2: C2({ color: { hair: 'purple', iris: 3 } }) }), AP('brown', 'green', 'medium')],
  ['B13 one wrong colour only', sb({ char2: C2({ color: { hair: 'silver', iris: 'black', skin: 'blue' } }) }), AP('silver', 'black', 'medium')],
  ['B14 valid char2 -> same values, new object', sb({ char2: C2({ from: 'owner', extra: 1 }) }), AP('pink', 'blue', 'tan')],
  ['B15 look({}) -> defaults', {}, AP('brown', 'green', 'medium')],
  ['B16 base __proto__ -> null (T22 R1)', sb({ char2: C2({ base: '__proto__' }) }), null],
  ['B16b base __proto__, no gender / parts -> null (T22 R1 probe)', sb({ char2: { v: 2, set: 'c2', base: '__proto__' } }), null],
  ['B17 base {toString:null} -> null (T22 R1)', sb({ char2: C2({ base: { toString: null } }) }), null],
  ['B18 base constructor -> null', sb({ char2: C2({ base: 'constructor' }) }), null],
  ['B19 base number -> null', sb({ char2: C2({ base: 4 }) }), null],
  ['B20 colour named constructor -> default', sb({ char2: C2({ color: { hair: 'constructor', iris: '__proto__', skin: 'toString' } }) }), AP('brown', 'green', 'medium')],
];
const NOT_SAVES = [null, 'x', 5, [], undefined];

async function run(b, routes, fn, arg) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625 });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  if (INJ || process.env.C2_FILE) await p.route(u => u.href.endsWith('/char2.js'), r => r.fulfill({ status: 200, contentType: 'application/javascript', body: C2SRC }));
  await p.route(u => u.href.startsWith(base) && !u.href.includes('/qa/g3/char2-test.html') && !u.href.endsWith('/char2.js'), async r => {
    const f = r.request().url().slice(base.length).split('?')[0], isPack = f === 'c2-pack.json';
    let a = routes[f]; if (a === undefined && routes['*']) a = routes['*']; if (a === undefined && routes['*files'] && !isPack) a = routes['*files'];
    if (a === undefined) return r.continue();
    if (a === 404) return r.fulfill({ status: 404, body: 'missing' });
    if (a.body !== undefined) return r.fulfill({ status: 200, contentType: 'application/json', body: a.body });
    const src = path.isAbsolute(a.file) ? a.file : path.join(process.cwd(), a.file);
    return r.fulfill({ status: 200, contentType: src.endsWith('.png') ? 'image/png' : 'application/json', body: fs.readFileSync(src) });
  });
  await p.goto(PAGE, { waitUntil: 'load' });
  const out = await p.evaluate(fn, arg);
  const rej = await p.evaluate(() => window.__rej);
  await ctx.close(); return { out, errs, rej };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const b = await chromium.launch(); const R = { k2: [], k7: [], extra: {} }; let fails = 0;
  // ---- K2 ----
  for (const [name, routes, wantReady, wantFailed, wantModes] of K2) {
    const { out, errs, rej } = await run(b, routes, async (pack) => {
      const t0 = performance.now();
      const res = await Promise.race([Char2.load(pack).catch(e => 'rejected'), new Promise(r => setTimeout(() => r('timeout'), 15000))]);
      if (res === 'rejected') return { res: 'timeout', ms: 0, look: null, stats: Char2.stats() };
      return { res: res === 'timeout' ? 'timeout' : { ready: res.ready, failed: res.failed, modes: res.modes || null }, ms: Math.round(performance.now() - t0),
               look: Char2.look({}), stats: Char2.stats() };
    }, PACK);
    const r = out.res, ok = r !== 'timeout' && r.ready === wantReady && same(r.failed, wantFailed) && (!wantReady || same(r.modes, wantModes)) &&
      (wantReady ? same(out.look, AP('brown', 'green', 'medium')) : out.look === null) && errs.length === 0 && rej === 0 &&
      (name !== 'full set' || same(out.stats.fixed, FULL_FIXED));
    if (!ok) fails++;
    R.k2.push({ case: name, ok, ready: r.ready, failed: r.failed, modes: r.modes, want: { ready: wantReady, failed: wantFailed, modes: wantModes || null }, ms: out.ms, pageErrors: errs, rejections: rej, fixed: out.stats.fixed, total: out.stats.total });
    console.log((ok ? 'PASS ' : 'FAIL ') + 'K2 ' + name + ' | ready ' + r.ready + ' failed ' + JSON.stringify(r.failed) + ' | ' + out.ms + ' ms');
  }
  // ---- load twice / release / load again ----
  {
    const { out, errs, rej } = await run(b, {}, async (pack) => {
      const a = await Char2.load(pack), b2 = await Char2.load('nope.json'), sameObj = a === b2;
      const t1 = Char2.stats().total; Char2.release(); const t2 = Char2.stats().total, lookAfter = Char2.look({});
      const c = await Char2.load(pack); return { sameObj, t1, t2, lookAfter, again: c.ready, t3: Char2.stats().total };
    }, PACK);
    const ok = out.sameObj && out.t1 > 0 && out.t2 === 0 && out.lookAfter === null && out.again && out.t3 === out.t1 && !errs.length && !rej;
    if (!ok) fails++; R.extra.loadTwice = Object.assign({ ok }, out); console.log((ok ? 'PASS ' : 'FAIL ') + 'load twice / release / again ' + JSON.stringify(out));
  }
  // ---- T22 R2: release() while a load is still running must not bring the old load back ----
  {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625 }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    if (INJ || process.env.C2_FILE) await p.route(u => u.href.endsWith('/char2.js'), r => r.fulfill({ status: 200, contentType: 'application/javascript', body: C2SRC }));
    let open; const gate = new Promise(r => { open = r; }); let held = 0;
    await p.route(u => u.href.endsWith('/c2-pack.json'), async r => { held++; if (held === 1) await gate; return r.continue(); });
    await p.goto(PAGE, { waitUntil: 'load' });
    const s1 = await p.evaluate((pack) => { window.pA = Char2.load(pack); Char2.release(); return { total: Char2.stats().total, look: Char2.look({}) }; }, PACK);
    const rB = await p.evaluate(async () => { try { const r = await Char2.load('../../nope-pack.json'); window.rB = r; return { ready: r.ready, failed: r.failed }; } catch (e) { return { ready: 'rejected', failed: [] }; } });
    open();
    const s2 = await p.evaluate(async (pack) => { let rA, again; try { rA = await window.pA; again = await Char2.load(pack); } catch (e) { return { rA: { ready: 'rejected' }, total: -1 }; }
      return { rA: { ready: rA.ready, failed: rA.failed }, total: Char2.stats().total, look: Char2.look({}), state: Char2._test.state(), againIsB: again === window.rB }; }, PACK);
    const rej = await p.evaluate(() => window.__rej); await ctx.close();
    const ok = s1.total === 0 && s1.look === null && !rB.ready && same(rB.failed, ['pack']) && !s2.rA.ready && same(s2.rA.failed, ['released']) &&
      s2.total === 0 && s2.look === null && s2.state === null && s2.againIsB && !errs.length && !rej;
    if (!ok) fails++; R.extra.releaseWhileLoading = Object.assign({ ok, s1, rB }, s2);
    console.log((ok ? 'PASS ' : 'FAIL ') + 'release while loading ' + JSON.stringify({ s1, rB, s2 }));
  }
  // ---- K7 T1-T12 against the G2.6 oracle ----
  {
    const items = []; for (const [name, ls] of T) { const d = readSlots(JSON.parse(JSON.stringify(ls))); d.slots.forEach((s, i) => items.push({ name: name + (d.slots.length > 1 ? '#' + i : ''), save: s, want: oracle(s) })); }
    const { out, errs, rej } = await run(b, {}, async ({ pack, items }) => {
      await Char2.load(pack);
      return items.map(it => { const before = JSON.stringify(it.save), got = Char2.look(it.save);
        return { got, unchanged: JSON.stringify(it.save) === before, fresh: !got || (got !== it.save.char2 && (!it.save.char2 || got.color !== it.save.char2.color)) }; });
    }, { pack: PACK, items });
    out.forEach((o, i) => { const it = items[i], ok = same(o.got, it.want) && o.unchanged && o.fresh && !errs.length && !rej; if (!ok) fails++;
      R.k7.push({ case: it.name, ok, got: o.got, want: it.want, unchanged: o.unchanged, fresh: o.fresh });
      console.log((ok ? 'PASS ' : 'FAIL ') + 'K7 ' + it.name + ' | ' + (o.got ? o.got.color.hair + '/' + o.got.color.iris + '/' + o.got.color.skin : 'null')); });
  }
  // ---- K7 broken S.char2 + not-a-save ----
  {
    const { out, errs, rej } = await run(b, {}, async ({ pack, items, ns }) => {
      await Char2.load(pack);
      const r = items.map(([n, s]) => { const before = JSON.stringify(s); let got; try { got = Char2.look(s); } catch (e) { got = 'THREW ' + e.message; }
        return { got, unchanged: JSON.stringify(s) === before, fresh: !got || !s.char2 || (got !== s.char2 && got.parts !== s.char2.parts && got.color !== s.char2.color) }; });
      return { r, ns: ns.map(v => Char2.look(v)), ns2: Char2.look(undefined) };
    }, { pack: PACK, items: B7.map(([n, s]) => [n, s]), ns: NOT_SAVES.filter(v => v !== undefined) });
    out.r.forEach((o, i) => { const [name, , want] = B7[i], ok = same(o.got, want) && o.unchanged && o.fresh && !errs.length && !rej; if (!ok) fails++;
      R.k7.push({ case: name, ok, got: o.got, want, unchanged: o.unchanged, fresh: o.fresh }); console.log((ok ? 'PASS ' : 'FAIL ') + 'K7 ' + name); });
    const nsOk = out.ns.every(v => v === null) && out.ns2 === null; if (!nsOk) fails++;
    R.k7.push({ case: 'not a save (null, string, number, array, undefined) -> null', ok: nsOk, got: out.ns.concat([out.ns2]) }); console.log((nsOk ? 'PASS ' : 'FAIL ') + 'K7 not a save -> null x5');
  }
  // ---- K7 deprecated part (a pack that lists one) ----
  {
    const { out, errs, rej } = await run(b, { 'c2-pack.json': bad('pack-deprecated.json') }, async (pack) => {
      const res = await Char2.load(pack);
      return { ready: res.ready, a: Char2.look({ char2: { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4b', eyes: 'kid4', outfit: 'kid4' }, color: { hair: 'red', iris: 'blue', skin: 'deep' } } }) };
    }, PACK);
    const ok = out.ready && same(out.a, AP('red', 'blue', 'deep')) && !errs.length && !rej; if (!ok) fails++;
    R.k7.push({ case: 'deprecated hair id -> default part', ok, got: out.a }); console.log((ok ? 'PASS ' : 'FAIL ') + 'K7 deprecated part -> default');
  }
  const k2p = R.k2.filter(x => x.ok).length, k7p = R.k7.filter(x => x.ok).length;
  R.inject = process.env.INJECT || null; R.failedCases = R.k2.concat(R.k7).filter(x => !x.ok).map(x => x.case).concat(R.extra.loadTwice.ok ? [] : ['load twice']).concat(R.extra.releaseWhileLoading.ok ? [] : ['release while loading']);
  R.summary = { k2: k2p + '/' + R.k2.length, k7: k7p + '/' + R.k7.length, loadTwice: R.extra.loadTwice.ok, releaseWhileLoading: R.extra.releaseWhileLoading.ok, fails };
  console.log('K2 %s · K7 %s · load twice/release %s · fails %d%s', R.summary.k2, R.summary.k7, R.summary.loadTwice ? 'ok' : 'FAIL', fails, R.inject ? ' · inject ' + R.inject : '');
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); await b.close(); process.exit(fails ? 1 : 0);
})();
