// Claude: BUG-23 (found in version 1.70). The class ladder (RANK) still asks for places that left the game in 1.02,
// so an ordinary player can never climb past class 2 (child) or class 3 (adult) and most features stay locked for ever.
// Every other suite runs as GM / under automation, where rank() is forced to 10. This one uses `?rank=1` = a real new player.
// Written before the fix: version 1.70 prints `errors 27`. After the fix it must print `errors 0`.
// If the Novice ladder (DESIGN_BUILD_SYSTEM.md 4.7, build step 1) replaces RANK for everyone, test_build_01_novice.js replaces this file.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_bug_23_ladder.js   (serve the repo root first)
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-bug-23'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };
// Features that exist in today's game. A player who has done everything the reachable world offers must have them open.
// ('events' is left out: its four scene themes exist only in the lands that left the game.)
const FEATURES = ['home', 'book', 'fish', 'dash', 'warp', 'tools', 'wheel', 'pets', 'emote', 'visit', 'gift', 'fa', 'sell'];

async function newPlayer(browser, age) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 60000 }); await sleep(2500);
  const tap = async h => { const r = await h.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(300); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await tap(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await tap(ages[age >= 18 ? ages.length - 1 : age - 6]);   // the real creator: tap the age, tap start
  await tap(await pg.$('#cgo')); await sleep(2200);
  return { ctx, pg };
}
// let class-up scenes and other dialogue finish, so the once-a-second class check keeps running
async function settle(pg, ms) { const end = Date.now() + ms; while (Date.now() < end) { await pg.evaluate(() => { try { if (DLG) { DLG = null; document.getElementById('dlg').classList.add('hide'); } closeModal(); PAUSE = false; } catch (e) { } }); await sleep(250); } }

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    for (const [label, age] of [['child7', 7], ['adult', 30]]) {
      const { ctx, pg } = await newPlayer(browser, age); await settle(pg, 2500);
      const r = { age: await pg.evaluate(() => S.age), child: await pg.evaluate(() => isKid()), startClass: await pg.evaluate(() => rank()) };
      // 1) what can be reached on foot through roads that are not closed
      r.world = await pg.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)), seen = {}, queue = [M.id];
        while (queue.length) { const id = queue.shift(); if (seen[id]) continue; goMap(id); await wait(1400); DLG = null; PAUSE = false; try { closeModal(); } catch (e) { }
          if (M.id !== id) { seen[id] = { redirectedTo: M.id }; if (!seen[M.id]) queue.push(M.id); continue; }
          seen[id] = { crystals: (M.crystals || []).length, digs: (M.digs || []).length, plots: (M.plots || []).length, fishSpot: M.fishSpot ? 1 : 0, boss: M.boss ? 1 : 0 };
          for (const e of M.exits || []) if (!e.locked && e.to && !seen[e.to]) queue.push(e.to); }
        return seen; });
      const places = Object.entries(r.world).filter(([, v]) => !v.redirectedTo);
      const canPlant = places.some(([, v]) => v.plots > 0), canFish = places.some(([, v]) => v.fishSpot > 0);
      // 2) do everything that world offers, through the game's own functions:
      //    every crystal (the call the quiz makes on a right answer), every dig spot, a high level, a planted bed only if a bed can be reached, three fish only if fishing is open
      for (const [id, v] of places) if (v.crystals) { await pg.evaluate(id => goMap(id), id); await settle(pg, 1600);
        for (let i = 0; i < v.crystals; i++) { await pg.evaluate(i => { const c = M.crystals[i]; if (!c.awake) wakeCrystal(c, true); }, i); await settle(pg, 1900); } }
      r.crystals = await pg.evaluate(() => totalCrystals()); await settle(pg, 4000);
      r.digs = 0;
      for (const [id, v] of places) if (v.digs) { await pg.evaluate(id => goMap(id), id); await settle(pg, 1600);
        for (let i = 0; i < v.digs; i++) { const dug = await pg.evaluate(async i => { const d = M.digs[i]; if (!d || d.done) return 0; DIG = null; PAUSE = false; doDig(d); if (!d.done) return 0; await new Promise(r => setTimeout(r, 250)); try { digHit(); } catch (e) { } return 1; }, i); r.digs += dug; await settle(pg, 900); await pg.evaluate(() => { DIG = null; }); } }
      await settle(pg, 4000);
      await pg.evaluate(canPlant => { S.lv = 100; if (canPlant) S.planted = 1; save(); }, canPlant); await settle(pg, 7000);
      r.fish = 0;
      if (canFish && await pg.evaluate(() => rHas('fish'))) { const spot = places.find(([, v]) => v.fishSpot)[0]; await pg.evaluate(id => goMap(id), spot); await settle(pg, 1600);
        for (let i = 0; i < 3; i++) { r.fish += await pg.evaluate(() => { try { P.x = M.fishSpot.x; P.y = M.fishSpot.y; FISHING.fish = 0; catchFish(); return 1; } catch (e) { return 0; } }); await settle(pg, 700); } }
      await settle(pg, 9000);
      r.canPlant = canPlant; r.canFish = canFish;
      r.finalClass = await pg.evaluate(() => rank());
      r.nextTask = await pg.evaluate(() => { const n = rank() + 1; return n <= 10 ? { n, progress: rankProg(n), text: rankTask(n) } : null; });
      r.open = await pg.evaluate(list => Object.fromEntries(list.map(f => [f, rHas(f)])), age >= 12 ? FEATURES.concat(['auto']) : FEATURES);
      // 3) the player's own front door
      r.door = await pg.evaluate(async outside => { const wait = ms => new Promise(r => setTimeout(r, ms)), said = [], _say = say; say = function (m) { said.push(String(m)); return _say.apply(this, arguments); };
        let from = null; for (const id of outside) { goMap(id); await wait(1400); DLG = null; PAUSE = false; try { closeModal(); } catch (e) { } if (M.id === id && (M.exits || []).some(e => e.to === 'room' && !e.locked)) { from = id; break; } }
        if (!from) return { found: false }; said.length = 0; const e = M.exits.find(e => e.to === 'room'); exitCool = 0; useExit(e); await wait(1600);
        return { found: true, from, endedIn: M.id, said }; }, places.map(([id]) => id).filter(id => !/^room/.test(id)));
      await pg.screenshot({ path: path.join(out, 'ladder-' + label + '.png') });
      // ---- pass marks
      if (r.finalClass < 3) fail('BUG-23 ' + label + ': after waking ' + r.crystals + ' of ' + r.crystals + ' crystals the player is still class ' + r.finalClass + '; the next task is "' + (r.nextTask && r.nextTask.text) + '" ' + (r.nextTask ? r.nextTask.progress.join('/') : ''));
      if (!r.door.found || r.door.endedIn !== 'room') fail('BUG-23 ' + label + ': cannot enter the own house (ended in ' + r.door.endedIn + ', message: ' + (r.door.said || []).join(' | ') + ')');
      const locked = Object.entries(r.open).filter(([, v]) => !v).map(([k]) => k);
      for (const f of locked) fail('BUG-23 ' + label + ': feature "' + f + '" (class ' + (await pg.evaluate(f => RANK_FEAT[f], f)) + ') can never open; best reachable class is ' + r.finalClass);
      r.lockedFeatures = locked; results[label] = r; await ctx.close();
    }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
