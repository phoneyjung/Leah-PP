// qa/frames_selftest.js: proof for qa/frames.js (the "frame over 50 ms" rule of test_risk_monthly.js and test_213_labels.js).
//   node qa/frames_selftest.js            part A only (made-up traces, no browser)
//   PORT=<game served here> CHROME_EXE=… node qa/frames_selftest.js        part A + B (the real game, with planted stalls)
// exit 0 = every check held. Part B's "stop" plants need a POSIX kill (Linux / macOS); elsewhere they are skipped and said so.
'use strict';
const F = require('./frames.js'), { execSync } = require('child_process');
const bad = [], ok = (name, cond, got) => { if (!cond) bad.push([name, got]); console.log((cond ? 'ok   ' : 'FAIL ') + name + (got !== undefined ? ' ' + JSON.stringify(got) : '')); };

// ---- A: the arithmetic, on made-up traces (µs). The page: pid 1 (main 11, compositor 12) · GPU process: pid 2 (CrGpuMain 21, viz 22)
const meta = [['process_name', 1, 0, 'Renderer'], ['process_name', 2, 0, 'GPU Process'], ['thread_name', 1, 11, 'CrRendererMain'], ['thread_name', 1, 12, 'Compositor'], ['thread_name', 2, 21, 'CrGpuMain'], ['thread_name', 2, 22, 'VizCompositorThread']]
  .map(([name, pid, tid, n]) => ({ ph: 'M', name, pid, tid, args: { name: n } }));
const T0 = 5e6, mark = { ph: 'I', name: 'TimeStamp', pid: 1, tid: 11, ts: T0, args: { data: { message: F.MARK } } };
const task = (tid, fromMs, wallMs, cpuMs, name) => ({ ph: 'X', name: name || 'ThreadControllerImpl::RunTask', pid: tid > 20 ? 2 : 1, tid, ts: T0 + fromMs * 1000, dur: wallMs * 1000, ...(cpuMs == null ? {} : { tdur: cpuMs * 1000 }) });
const one = (tasks, gap, noMark) => F.attribute(meta.concat(noMark ? [] : [mark], tasks), { gaps: [gap] }).gaps[0];
// a gap from 1000 to 1087 ms after the marker
const G = [1000, 1087];
{ const g = one([task(11, 1000, 87, 8)], G); ok('A1 page stopped from outside: 87 ms task, 8 ms CPU → outside', !g.own && g.cpu === 8, g); }
{ const g = one([task(11, 1003, 78, 73)], G); ok('A2 the page worked 73 ms → own (main)', g.own && g.by === 'main', g); }
{ const g = one([task(22, 1010, 45, 40)], [1000, 1060]); ok('A3 the GPU process drew 40 ms → own (viz)', g.own && g.by === 'viz', g); }
{ const g = one([task(11, 1000, 22, 20), task(11, 1030, 22, 20)], [1000, 1060]); ok('A4 two jobs of 20 ms on one thread = 40 → own', g.own && g.cpu === 40, g); }
{ const g = one([task(11, 1000, 22, 20), task(22, 1025, 22, 20)], [1000, 1060]); ok('A5 20 ms on two threads at once (max 20) → outside', !g.own && g.cpu === 20, g); }
{ const g = one([task(11, 1005, 40, null)], [1000, 1060]); ok('A6 no CPU time recorded: the 40 ms wall counts → own', g.own && g.cpu === 40, g); }
{ const g = one([task(11, 1000, 50, 20), task(11, 1005, 30, 15, 'RunTask')], [1000, 1060]); ok('A7 a task inside a task is not counted twice (20, not 35) → outside', !g.own && g.cpu === 20, g); }
{ const g = one([task(11, 1003, 78, 73)], G, true); ok('A8 no marker: cannot tell → own', g.own && g.cpu === null, g); }
{ const a = one([task(11, 1020, 100, 100)], [1000, 1060]), b = one([task(11, 1030, 100, 100)], [1000, 1060]);
  ok('A9 a task partly inside the gap counts its share: 40 ms of it inside → own, 30 ms inside → outside', a.own && a.cpu === 40 && !b.own && b.cpu === 30, [a.cpu, b.cpu]); }
{ const g = one([task(12, 1000, 34, 34)], [1000, 1060]); ok('A10 the page\'s compositor thread 34 ms → own', g.own && g.by === 'compositor', g); }
{ const g = one([task(11, 1000, 33, 33), task(22, 1000, 33, 33)], [1000, 1060]); ok('A11 33 ms on two threads (under 33.3 on each) → outside', !g.own, g); }

// ---- B: the real game, with planted stalls
(async () => {
  if (!process.env.PORT) { console.log('part B skipped (no PORT)'); return; }
  const puppeteer = require('puppeteer'), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE, args: ['--no-sandbox'] });
  try { const pg = await browser.newPage(); await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await pg.setBypassServiceWorker(true);
    await pg.goto('http://localhost:' + process.env.PORT + '/?rank=1', { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2000);
    await pg.evaluate(() => { const d = Store.all(); d.slots = [newSave({ name: 'P', kid: 0, house: 1, age: 7 })]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame(); document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {} });
    await sleep(2500); await F.walk(pg, 4000, { tries: 1 });   // warm-up
    const short = (w) => ({ fps: w.fps, hitch: w.hitch, own: w.own, tries: w.tries, windows: w.windows.map((x) => [x.own, x.outside, x.gaps]) });
    // B1 nothing planted
    { const w = await F.walk(pg, 4000); ok('B1 nothing planted: one clean walk', w.tries === 1 && w.hitch === 0 && w.own === 0, short(w)); }
    // B2 the game's frame does 70 ms of work once (1.5 s into the first walk) → own, no second walk
    await pg.evaluate(() => { const o = window.loop; let done = 0; window.__plantAt = performance.now() + 1500; window.loop = function () { if (!done && performance.now() > window.__plantAt) { done = 1; const a = performance.now(); while (performance.now() - a < 70); } return o.apply(this, arguments); }; window.__unplant = () => { window.loop = o; }; });
    { const w = await F.walk(pg, 4000); ok('B2 70 ms planted in the game\'s frame: own, not walked again', w.own >= 1 && w.tries === 1 && w.windows[0].gaps.some((g) => g[2] >= 60 && g[3] === 'main'), short(w)); }
    await pg.evaluate(() => window.__unplant());
    const posix = process.platform !== 'win32';
    const stop = async () => { const c = await browser.target().createCDPSession(), info = await c.send('SystemInfo.getProcessInfo'), rs = info.processInfo.filter((x) => x.type === 'renderer').map((x) => x.id);
      await sleep(1500); execSync(`kill -STOP ${rs.join(' ')}; sleep 0.08; kill -CONT ${rs.join(' ')}`); };
    if (!posix) console.log('B3/B4 skipped (no POSIX kill here)');
    else {
      // B3 the page process stopped 80 ms from outside, in the first walk only → outside, walked again, clean
      { const w = await F.walk(pg, 4000, { during: (i) => (i === 0 ? stop() : null) }); ok('B3 page stopped 80 ms in walk 1 only: outside, walked again, clean', w.own === 0 && w.tries === 2 && w.hitch === 0 && w.windows[0].outside >= 1, short(w)); }
      // B4 stopped in every walk → 3 walks, still a frame over 50 ms → the suites fail
      { const w = await F.walk(pg, 4000, { during: () => stop() }); ok('B4 page stopped in every walk: 3 walks, never clean → fails', w.own === 0 && w.tries === 3 && w.hitch >= 1, short(w)); }
    }
  } finally { await browser.close(); }
})().catch((e) => { bad.push(['crash', String(e && e.stack || e)]); console.error(e); }).finally(() => { console.log(JSON.stringify({ failed: bad.length })); process.exit(bad.length ? 1 : 0); });
