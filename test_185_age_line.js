// Version 1.85 (Claude, owner's decisions of 8–9 Oct): the child line moves from 12 to 10. Age 9 is still a child (no HP bar, monsters never strike, the
// small-button screen, the child's creator note); age 10 and 11 now fight like 12+ (HP, monsters chase and strike, potion/blink/skill buttons, the bot at
// level 10, the adult creator note). Chat stays 12 and the dark lands 18 (constants only — neither exists in the game yet). Players are made with real taps in
// the creator (?rank=1), one per age, on a phone; what each gets is measured in the game, not read from a flag.
// Prints one JSON line, then `errors N`.  Run: PORT=8777 CHROME_EXE=/path/to/chromium node test_185_age_line.js   (serve the repo root first)
// Version 1.84 gives errors ≥ 12 (ages 10 and 11 are still children); 1.85 gives errors 0.
const fs = require('node:fs'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-185-age'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8777) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

async function player(browser, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error (age ' + age + '): ' + e.message));
  await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await sleep(300);
  const note = await pg.evaluate(() => (document.getElementById('crole') || {}).textContent || '');
  await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  await sleep(1000);
  return { ctx, pg, note };
}
const shown = (pg, id) => pg.evaluate(id => { const b = document.getElementById(id); if (!b) return false; const r = b.getBoundingClientRect(); return getComputedStyle(b).display !== 'none' && r.width > 0 && !b.classList.contains('hide'); }, id);
const waitFor = async (pg, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(fn)) return Date.now() - t0; await sleep(25); } return -1; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const age of [9, 10, 11, 12]) {
      const kid = age < 10; const { ctx, pg, note } = await player(browser, age); const R = results['age' + age] = { note: note.slice(0, 40) };
      const kidNote = await pg.evaluate(() => t('kidNote')), adultNote = await pg.evaluate(() => t('adultNote'));
      R.noteKind = note.startsWith(kidNote) ? 'kid' : note.startsWith(adultNote) ? 'adult' : '?'; if (R.noteKind !== (kid ? 'kid' : 'adult')) fail('age ' + age + ': creator note is "' + note.slice(0, 30) + '"');
      R.isKid = await pg.evaluate(() => isKid()); if (R.isKid !== kid) fail('age ' + age + ': isKid() = ' + R.isKid);
      R.kidUI = await pg.evaluate(() => !!kidUI()); if (R.kidUI !== kid) fail('age ' + age + ': kidUI() = ' + R.kidUI);
      R.hpBar = await pg.evaluate(() => { const b = document.getElementById('hpT') || document.querySelector('#hud .hp,#hud #hpI'); return !!(b && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().width > 0); });
      R.buttons = {}; for (const id of ['bPot', 'bDash', 'bSk', 'bRest']) R.buttons[id] = await shown(pg, id);
      // children: no potion / blink / weapon skill buttons; fighters: potion and weapon skill shown (blink opens at class 4, so set the class first)
      await pg.evaluate(() => { S.rank = 6; S.lv = 10; hud(); }); await sleep(500); for (const id of ['bPot', 'bDash', 'bSk', 'bAuto', 'bBuff']) R.buttons[id] = await shown(pg, id);
      for (const id of ['bPot', 'bDash', 'bSk', 'bAuto']) if (R.buttons[id] !== !kid) fail('age ' + age + ': ' + id + ' shown = ' + R.buttons[id]);
      // in the cave: a slime beside the player strikes a fighter within 3 s and never a child
      await pg.evaluate(() => { goMap('cavemouth'); }); await sleep(1500); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; S.hp = 400; P.target = null; P.path = null; if (S.st) S.st.agi = 0; const o = MONS.find(m => m.kind === 'slime') || MONS[0]; for (const m of MONS) if (m !== o) m.x += 6000; if (o) { o.x = P.x + 12; o.y = P.y; o.spd = 0; o.hp = o.max = 1e6; o.cd = 0; window.__o = o; } });
      await pg.evaluate(() => { window.__hp0 = S.hp; }); const struck = await waitFor(pg, () => S.hp < window.__hp0, 3000); R.struckMs = struck; R.chase = await pg.evaluate(() => window.__o ? window.__o.st : null);
      if (kid && struck >= 0) fail('age ' + age + ': a child was struck'); if (!kid && struck < 0) fail('age ' + age + ': a fighter was not struck within 3 s (hp ' + await pg.evaluate(() => S.hp) + ')');
      // the online flag the game publishes (a = 1 for a child)
      R.netKidFlag = await pg.evaluate(() => { try { return (Net && Net.me && Net.me.p) ? Net.me.p.a : null; } catch (e) { return null; } });
      await pg.screenshot({ path: out + '/age' + age + '.png' }); await ctx.close(); }
    results.constants = await (async () => { const ctx = await browser.createBrowserContext(), pg = await ctx.newPage(); await pg.setBypassServiceWorker(true); await pg.goto(base + '?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); const c = await pg.evaluate(() => (typeof AGE185 !== 'undefined') ? AGE185 : null); await ctx.close(); return c; })();
    if (!results.constants || results.constants.fight !== 10 || results.constants.bot !== 10 || results.constants.chat !== 12 || results.constants.dark !== 18) fail('age constants ' + JSON.stringify(results.constants));
  } catch (e) { fail('crash: ' + (e.stack || e)); }
  await browser.close();
  console.log(JSON.stringify({ results, errors }));
  console.log('errors', errors.length);
  process.exit(errors.length ? 1 : 0);
})();
