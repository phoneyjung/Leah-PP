// Claude 2.34 (G4.1 · plan G4_0_GAME_INTEGRATION_PLAN.md v1.2 section 6 + 8 M8 basic · DESIGN_CHAR2_SAVE_MIGRATION.md section 4): the first migration of a save
// to S.char2 and the way back. Saves are made here (no real save). Girl, age 7, flag on.
// M  where the colours come from (each colour on its own, the first usable source; `from` = the source of the hair colour):
//    pd219 valid → pd219 · pd219 broken (a part 0) → next · pd219 with a part the paper-doll set does not have (hair 99): PD219 loaded first / not loaded yet
//    (the game waits for it either way → the same result) / PD219 files missing (the game's own pd219Look then has no list → pd219) · appearance169 valid →
//    appearance169 · appearance169 broken + hcol → hcol · only hc/ec → hc · nothing → default
//    for every case: S.char2 v 2 set c2 base kid4 + the expected colours + from · nothing in the stored save until save() · after save() the stored save has it
//    · "old fields changed 0" is measured on the migration step alone (plan 8 M8: before/after the step, a fixture apart from play): c234Migrate(fixture) on a
//    deep copy of the case's save, then the fixture compared with that copy field by field (the game itself writes position, missions … while it runs)
// K  an S.char2 already in the save: a valid one is read, not migrated again (count 0) and not changed · a future one (v 3), a string, an array, another set
//    → failed "unreadable", S.char2 unchanged after save()
// B  the way back: flag off keeps S.char2 · "clear" (flag off + S.char2 removed) → off · flag on again → migrated again from the old fields
// O  game 2.33 (main) opens a save holding char2 + char2On, plays and saves → both kept (needs MAIN_PORT = a server of main; without it this part is reported 'skipped')
// Prints one JSON line, then `errors N`.  Run: PORT=8775 [MAIN_PORT=8776] CHROME_EXE=/path/to/chromium node test_234_save.js
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-234-save'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/', mainBase = process.env.MAIN_PORT ? 'http://localhost:' + process.env.MAIN_PORT + '/' : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], R = { M: [], K: [] };
const ck = (c, m) => { if (!c) errors.push(m); };
async function open(browser, url, block, hold) {
  const bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
  p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 160)));
  await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 }); await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', async (r) => { try { if (/firebase|gstatic|googleapis/.test(r.url()) || (block && block.test(r.url()))) return r.respond({ status: 404, body: '' }); if (hold && hold.re.test(r.url())) await hold.gate; r.continue(); } catch (e) {} });
  await p.goto((url || base) + '?rank=1', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(500);
  return { bc, p, pe };
}
const play = (p, extra, pre) => p.evaluate(async (extra, pre) => {
  if (pre === 'pd219') await pd219Load();
  const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'Pim', kid: 0, house: 1, age: 7 }), extra)]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false;
  window.__before = JSON.parse(JSON.stringify(S));
  startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
  return { pd219Before: { ok: PD219.ok, tried: PD219.tried } };
}, extra, pre || null);
const settle = (p) => p.waitForFunction(() => C234.st !== 'loading', { timeout: 20000 }).then(() => true).catch(() => false);
const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.char2; delete c.char2On; return JSON.stringify(c); };
const fixture = (p, extra) => p.evaluate((extra) => { const f = Object.assign(newSave({ name: 'Pim', kid: 0, house: 1, age: 7 }), extra), copy = JSON.stringify(f), m = c234Migrate(f);
  return { unchanged: JSON.stringify(f) === copy, char2: m && m.char2 }; }, extra);
const snap = (p) => p.evaluate(() => ({ st: C234.st, why: C234.why, mig: C234.cnt.migrate, char2: S.char2 === undefined ? null : JSON.parse(JSON.stringify(S.char2)), before: window.__before, now: JSON.parse(JSON.stringify(S)),
  storedBefore: (Store.all().slots[0] || {}).char2 === undefined ? null : Store.all().slots[0].char2, pd219: { ok: PD219.ok, tried: PD219.tried } }));
const PD = { v: 1, hair: 1, face: 1, eyes: 1, mouth: 1, body: 1, hc: 4, ec: 3, tn: 2 };
const CASES = [
  ['pd219 valid', { pd219: PD, hc: 1, ec: 0 }, null, null, { hair: 'pink', iris: 'blue', skin: 'tan', from: 'pd219' }],
  ['pd219 broken (part 0) → appearance169', { pd219: Object.assign({}, PD, { hair: 0 }), appearance169: { v: 1, hair: 1, face: 1, hc: 5, ec: 4 } }, null, null, { hair: 'blue', iris: 'amber', skin: 'medium', from: 'appearance169' }],
  ['pd219 hair 99 · PD219 loaded first', { pd219: Object.assign({}, PD, { hair: 99 }), hcol: 6, ecol: 2 }, 'pd219', null, { hair: 'silver', iris: 'green', skin: 'medium', from: 'hcol' }],
  ['pd219 hair 99 · PD219 not loaded yet', { pd219: Object.assign({}, PD, { hair: 99 }), hcol: 6, ecol: 2 }, 'hold', null, { hair: 'silver', iris: 'green', skin: 'medium', from: 'hcol' }],
  ['pd219 hair 99 · PD219 files missing', { pd219: Object.assign({}, PD, { hair: 99 }), hcol: 6, ecol: 2 }, null, /\/pd-[^/]*$/, { hair: 'pink', iris: 'blue', skin: 'tan', from: 'pd219' }],
  ['appearance169 valid', { appearance169: { v: 1, hair: 2, face: 0, hc: 3, ec: 1 }, hcol: 6 }, null, null, { hair: 'red', iris: 'black', skin: 'medium', from: 'appearance169' }],
  ['appearance169 broken (hc 99) → hcol', { appearance169: { v: 1, hair: 1, face: 1, hc: 99, ec: 1 }, hcol: 7, ecol: 4 }, null, null, { hair: 'green', iris: 'amber', skin: 'medium', from: 'hcol' }],
  ['only hc / ec', { hc: 7, ec: 1 }, null, null, { hair: 'green', iris: 'black', skin: 'medium', from: 'hc' }],
  ['nothing', {}, null, null, { hair: 'brown', iris: 'green', skin: 'medium', from: 'default' }],
];
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [lab, extra, pre, block, want] of CASES) {
      let rel = null; const hold = pre === 'hold' ? { re: /\/pd-kid\.json/, gate: new Promise((r) => { rel = r; }) } : null;
      const t = await open(browser, null, block, hold); const p0 = await play(t.p, Object.assign({ char2On: true, gender194: 'f' }, extra), pre === 'hold' ? null : pre);
      const mid = pre === 'hold' ? await t.p.evaluate(() => ({ st: C234.st, ok: PD219.ok, tried: PD219.tried })) : null; if (rel) { await sleep(1500); rel(); }
      const ok = await settle(t.p); const s = await snap(t.p);
      await t.p.evaluate(() => save()); const stored = await t.p.evaluate(() => Store.all().slots[0].char2 || null);
      const c = s.char2 || {}, got = { hair: c.color && c.color.hair, iris: c.color && c.color.iris, skin: c.color && c.color.skin, from: c.from };
      const fx = await fixture(t.p, Object.assign({ char2On: true, gender194: 'f' }, extra));
      const row = { lab, ok, st: s.st, why: s.why, got, fixtureUnchanged: fx.unchanged, fixtureSame: JSON.stringify(fx.char2) === JSON.stringify(s.char2), storedBefore: s.storedBefore, storedAfter: !!(stored && stored.v === 2), pd219: s.pd219, p0: p0.pd219Before, mid, pe: t.pe.length };
      R.M.push(row);
      if (pre === 'hold') ck(mid && mid.st === 'loading' && !mid.ok && !mid.tried, 'M ' + lab + ': PD219 must still be undecided while the flag loads ' + JSON.stringify(mid));
      ck(ok && s.st === 'ready' && c.v === 2 && c.set === 'c2' && c.base === 'kid4' && JSON.stringify(got) === JSON.stringify(want) && row.fixtureUnchanged && row.fixtureSame && row.storedBefore === null && row.storedAfter && row.pe === 0,
        'M ' + lab + ' want ' + JSON.stringify(want) + ' got ' + JSON.stringify(row));
      await t.bc.close();
    }
    // K: an S.char2 already there
    const good = { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: null, face_acc: null, back: null }, color: { hair: 'red', iris: 'blue', skin: 'deep' }, from: 'hc' };
    for (const [lab, v, wantSt] of [['valid', good, 'ready'], ['future v 3', Object.assign({}, good, { v: 3 }), 'failed'], ['a string', 'kid4', 'failed'], ['an array', [1, 2], 'failed'], ['another set', Object.assign({}, good, { set: 'c9' }), 'failed']]) {
      const t = await open(browser); await play(t.p, { char2On: true, gender194: 'f', hc: 1, char2: v }); const ok = await settle(t.p); const s = await snap(t.p);
      await t.p.evaluate(() => save()); const stored = await t.p.evaluate(() => Store.all().slots[0].char2);
      const same = JSON.stringify(stored) === JSON.stringify(v) && JSON.stringify(s.char2) === JSON.stringify(v);
      const row = { lab, ok, st: s.st, why: s.why, mig: s.mig, same, pe: t.pe.length }; R.K.push(row);
      ck(ok && s.st === wantSt && s.mig === 0 && same && (wantSt === 'ready' || s.why === 'save look unreadable') && row.pe === 0, 'K ' + JSON.stringify(row));
      await t.bc.close();
    }
    // B: the way back
    { const t = await open(browser); await play(t.p, { char2On: true, gender194: 'f', hc: 3 }); await settle(t.p);
      const first = await t.p.evaluate(() => JSON.stringify(S.char2));
      const off = await t.p.evaluate(() => { S.char2On = false; save(); c234Sync(); return { st: C234.st, kept: JSON.stringify(S.char2) }; });
      const cleared = await t.p.evaluate(() => { S.char2On = false; delete S.char2; save(); c234Sync(); return { st: C234.st, gone: S.char2 === undefined && Store.all().slots[0].char2 === undefined }; });
      await t.p.evaluate(() => { S.hc = 7; S.char2On = true; c234Sync(); }); await settle(t.p);
      const again = await t.p.evaluate(() => ({ st: C234.st, hair: S.char2 && S.char2.color.hair, from: S.char2 && S.char2.from }));
      R.B = { first: JSON.parse(first).color.hair, off, cleared, again, pe: t.pe.length };
      ck(off.st === 'off' && off.kept === first && cleared.st === 'off' && cleared.gone && again.st === 'ready' && again.hair === 'green' && again.from === 'hc' && t.pe.length === 0, 'B ' + JSON.stringify(R.B));
      await t.bc.close(); }
    // O: game 2.33 (main) keeps both fields
    if (mainBase) {
      const t = await open(browser, mainBase);
      R.O = await t.p.evaluate(async (good) => {
        const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'Pim', kid: 0, house: 1, age: 7 }), { char2On: true, char2: good })]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 };
        startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
        await new Promise((r) => setTimeout(r, 2500)); S.coins = (S.coins || 0) + 5; save();
        const s = Store.all().slots[0]; return { version: VERSION, on: s.char2On === true, same: JSON.stringify(s.char2) === JSON.stringify(good), coins: s.coins };
      }, good);
      R.O.pe = t.pe.length;
      ck(/2\.33/.test(R.O.version) && R.O.on && R.O.same && R.O.coins === 5 && R.O.pe === 0, 'O main keeps char2 + char2On ' + JSON.stringify(R.O));
      await t.bc.close();
    } else R.O = 'skipped (MAIN_PORT not set)';
  } catch (e) { errors.push('crash: ' + String(e && e.stack || e).slice(0, 300)); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ results: R, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
