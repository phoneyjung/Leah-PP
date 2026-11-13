// G4.6: self-test of the phone bench (qa/g4/phone_bench.js v3) — it must not say "ผ่าน" when the measurement cannot be trusted.
//   node qa/g4/phone_bench_selftest.js <out dir of build_phone_bench.py> [results.json]      CASES=a,b  FULL=1  CHROME_EXE=…
// Serves the built copy itself (page.html inside the same skeleton the artifact host adds + exactly the files of files.json; a case
// can leave a file out or answer 200 with other bytes — the fault is at the server, no request is intercepted in the browser) and runs the bench in test timing
// (window.__benchTest: settle 300 ms · count 1000 ms — such a run never counts; the self-test reads verdictIfCounted, the verdict the
// same checks would give in a full-length run). FULL=1 adds one full-length run on an emulated phone, which must say "ผ่าน".
// Exit 0 = every case as expected · 1 = a case is wrong · 2 = could not run.
const http = require('http'), fs = require('fs'), path = require('path'), puppeteer = require('puppeteer');
const dir = process.argv[2], outFile = process.argv[3];
if (!dir || !fs.existsSync(path.join(dir, 'page.html'))) { console.error('usage: phone_bench_selftest.js <built dir> [results.json]'); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SKEL = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
const TYPES = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', json: 'application/json', js: 'text/javascript', mp3: 'audio/mpeg', webmanifest: 'application/manifest+json' };
const MAP = JSON.parse(fs.readFileSync(path.join(dir, 'files.json'), 'utf8')), PAGE = SKEL + fs.readFileSync(path.join(dir, 'page.html'), 'utf8') + '</body></html>';
// HTTP 200 with the wrong body (T47-N4): a valid 1×1 transparent PNG in place of a file · the file with the same length and 4,000 bytes zeroed
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const sameSize = (name) => { const b = Buffer.from(fs.readFileSync(MAP[name])); b.fill(0, Math.floor(b.length * 0.6), Math.floor(b.length * 0.6) + 4000); return b; };
function serve(deny, swap) {
  return new Promise((res) => { const s = http.createServer((q, r) => {
    const p = decodeURIComponent(new URL(q.url, 'http://x').pathname).slice(1) || 'index.html';
    if (p === 'index.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(q.method === 'HEAD' ? undefined : PAGE); }
    if (deny.includes(p) || !MAP[p]) { r.writeHead(404); return r.end(); }
    if (swap && swap[p]) { r.writeHead(200, { 'content-type': TYPES[p.split('.').pop()] || 'application/octet-stream', 'content-length': swap[p].length }); return r.end(q.method === 'HEAD' ? undefined : swap[p]); }
    r.writeHead(200, { 'content-type': TYPES[p.split('.').pop()] || 'application/octet-stream', 'content-length': fs.statSync(MAP[p]).size });
    if (q.method === 'HEAD') return r.end(); fs.createReadStream(MAP[p]).pipe(r); });
    s.listen(0, '127.0.0.1', () => res(s)); });
}
// Faults put into the page (after it loaded, before "เริ่มวัด"). The bench's progress pill tells which run is on.
function fault(kind) {
  const txt = () => { for (const d of document.body.children) { const t = d.textContent || ''; if (/^ฉาก \d\/3/.test(t)) return t; } return ''; };
  const burn = (ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms); };
  if (kind === 'unlisted') window.__benchBuild.files.splice(window.__benchBuild.files.indexOf('kit-town.png'), 1);
  if (kind === 'build') window.__benchBuild.version = 'Lantern Academy 0.00';
  // T47-N1: the renderer is never told to hold the lantern · T47-N1b: it is told, but the actor never holds, so no lantern is drawn
  if (kind === 'nolantern') c234Hold = () => false;
  if (kind === 'nohold') { const o = c234Go; c234Go = function () { if (C234.A) C234.A.holding = false; return o.apply(this, arguments); }; }
  // T47-N2: the old character is not drawn when the flag is off — put around drawPlayer before the bench's own wrapper (inside it) or after (outside it)
  const noOld = () => { const o = drawPlayer; drawPlayer = function () { if (!c234Use()) return; return o.apply(this, arguments); }; };
  if (kind === 'nooldbody') noOld();
  if (kind === 'nooldbody_late') { const t = setInterval(() => { if (txt()) { clearInterval(t); setTimeout(noOld, 150); } }, 20); }
  // the new shadow is not drawn · the game turns its light mode on by itself · half of the scene is not drawn when the flag is on (put outside the bench's wrappers)
  if (kind === 'noshadow') c234Shadow = function () { return c234Use(); };
  if (kind === 'lite') setInterval(() => { if (/ฉาก 2\/3/.test(txt())) LITE = true; }, 40);
  if (kind === 'fewdraws') { const t = setInterval(() => { if (!txt()) return; clearInterval(t); setTimeout(() => { let inp = 0, k = 0; const dp = drawPlayer, o = ctx.drawImage;
    drawPlayer = function () { inp++; try { return dp.apply(this, arguments); } finally { inp--; } };
    ctx.drawImage = function () { if (!inp && c234Use() && (k++ % 2)) return; return o.apply(this, arguments); }; }, 150); }, 20); }
  if (kind === 'stall') { let last = ''; setInterval(() => { const t = txt(); if (/^ฉาก 1\/3.*ตัวใหม่ ปิด/.test(t) && t !== last) { last = t; setTimeout(() => burn(900), 500); } }, 30); }
  if (kind === 'slowoff' || kind === 'slowon') { const re = kind === 'slowoff' ? /^ฉาก 2\/3.*ตัวใหม่ ปิด/ : /ตัวใหม่ เปิด/; let k = 0;
    const f = () => { if (re.test(txt()) && (kind === 'slowoff' || ++k % 3 === 0)) burn(kind === 'slowoff' ? 25 : 28); requestAnimationFrame(f); }; requestAnimationFrame(f); }   // slowon: every 3rd frame is late → 65–80 %
  if (kind === 'hidden') { let h = false, done = false; Object.defineProperty(document, 'hidden', { get: () => h, configurable: true });
    setInterval(() => { if (!done && /^ฉาก 3\/3.*คู่ 2\/3/.test(txt())) { done = true; setTimeout(() => { h = true; document.dispatchEvent(new Event('visibilitychange')); setTimeout(() => { h = false; document.dispatchEvent(new Event('visibilitychange')); }, 100); }, 600); } }, 30); }
}
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
// name · what is wrong · expected reasons besides "mode" · expected verdictIfCounted · extra check
const CASES = [
  { name: 'ok', want: [], verdict: 'pass', more: (r) => r.files.ok && r.files.asked >= 150 && r.files.hashed >= 150 && !r.files.wrong.length && r.device.phone && r.rows.every((x) => x.ok && !x.cut && !x.shaky && x.jsOn > 0 && x.jsOff > 0) &&
      r.runs.every((x) => x.on ? x.ev.newD >= 0.8 * x.frames && x.ev.oldD === 0 : x.ev.oldD >= 0.8 * x.frames && x.ev.newD === 0) &&      // what was drawn, both ways
      r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === x.ev.newD && x.ev.vis > 0 && x.ev.heldCmd === x.ev.vis) && r.runs.filter((x) => x.scene !== 'S3').every((x) => x.ev.heldCfg === 0) },
  { name: 'desktop', desktop: true, want: ['device'], verdict: 'void', more: (r) => !r.device.phone && r.files.ok },
  { name: 'nofile', deny: ['kit-town.png'], want: ['files'], verdict: 'void', more: (r) => r.files.failed.includes('kit-town.png') && !r.files.missing.length },
  { name: 'unlisted', fault: 'unlisted', want: ['files'], verdict: 'void', more: (r) => r.files.missing.includes('kit-town.png') },
  { name: 'build', fault: 'build', want: ['build'], verdict: 'void' },
  { name: 'c2fail', deny: ['c2-pack.json'], want: ['files'], verdict: 'void', more: (r) => r.files.failed.includes('c2-pack.json') && r.rows.every((x) => !x.ok && x.why === 'ตัวใหม่ไม่พร้อม') },
  { name: 'stall', fault: 'stall', wantHas: ['interrupted'], verdict: 'void', more: (r) => r.rows[0].cut && !r.rows[1].cut && !r.rows[2].cut },
  { name: 'hidden', fault: 'hidden', want: ['interrupted'], verdict: 'void', more: (r) => r.rows[2].cut && r.runs.filter((x) => x.hidden).length === 1 },
  { name: 'slowoff', fault: 'slowoff', want: ['unstable'], verdict: 'void', more: (r) => r.rows[1].shaky && r.rows[1].ratio > 1.10 && !r.rows[0].shaky },
  { name: 'slowon', fault: 'slowon', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => x.ok && x.ratio < 0.90 && x.ratio > 0.60) },
  { name: 'lowfps', slowRaf: true, wantHas: ['interrupted'], verdict: 'void' },
  // v3 (Codex T47-N1 N2 N4): each of these passed in v2
  { name: 'nolantern', fault: 'nolantern', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'ตะเกียงไม่ถูกวาด' && r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === 0 && x.ev.newD > 0) },
  { name: 'nohold', fault: 'nohold', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'ตะเกียงไม่ถูกวาด' && r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === x.ev.newD && x.ev.vis === 0) },
  { name: 'nooldbody', fault: 'nooldbody', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ตัวเดิมไม่ถูกวาด') && r.runs.filter((x) => !x.on).every((x) => x.ev.oldD === 0 && x.ev.calls > 0) },
  { name: 'nooldbody_late', fault: 'nooldbody_late', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ตัวเดิมไม่ถูกวาด') && r.runs.filter((x) => !x.on).every((x) => x.ev.oldD === 0 && x.ev.calls === 0) },
  { name: 'noshadow', fault: 'noshadow', want: [], verdict: 'fail', more: (r) => !r.rows[0].ok && r.rows[0].why === 'เงาไม่ตรง' && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'เงาไม่ตรง' },
  { name: 'lite', fault: 'lite', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && !r.rows[1].ok && r.rows[1].why === 'เกมเปลี่ยนโหมดกราฟิกเอง' },
  { name: 'fewdraws', fault: 'fewdraws', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ฉากวาดไม่ครบตอนเปิด' && x.draws[0] < 0.8 * x.draws[1]) },
  { name: 'wrongimage', swap: () => ({ 'map-cave-mouth.jpg': PNG1 }), want: ['files'], verdict: 'void', more: (r) => r.files.wrong.includes('map-cave-mouth.jpg') && !r.files.missing.length && !r.files.failed.length },
  { name: 'wrongsame', swap: () => ({ 'map-cave-mouth.jpg': sameSize('map-cave-mouth.jpg') }), want: ['files'], verdict: 'void', more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'map-cave-mouth.jpg' && !r.files.missing.length && !r.files.failed.length },
];
if (process.env.FULL) CASES.push({ name: 'full', full: true, want: [], verdict: 'pass', exact: 'pass', more: (r) => r.files.ok && r.device.phone && !r.reasons.length && /→ ผ่าน \(เกณฑ์/.test(r.line) });
const ONLY = process.env.CASES ? process.env.CASES.split(',') : null;
(async () => {
  const out = []; let browser;
  try {
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE, args: ['--no-sandbox'] });
    for (const c of CASES) {
      if (ONLY && !ONLY.includes(c.name)) continue;
      // Up to 3 tries: a 1-second test run on a busy machine can trip the bench's own noise guards (unstable / interrupted), which
      // is the bench working, not the case being wrong. A fault the bench misses is missed on every try. "tries" is in the result.
      for (let tries = 1; tries <= 3; tries++) {
      if (tries > 1) out.pop();
      const srv = await serve(c.deny || [], c.swap ? c.swap() : null), port = srv.address().port, bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
      const row = { name: c.name, tries }; out.push(row);
      try {
        p.on('pageerror', (e) => pe.push(String(e.message).slice(0, 120)));
        if (c.desktop) await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
        else { await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
          await p.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',
            { brands: [{ brand: 'Chromium', version: '153' }], fullVersion: '153.0.0.0', platform: 'Android', platformVersion: '10', architecture: '', model: 'K', mobile: true }); }
        if (!c.full) await p.evaluateOnNewDocument(() => { window.__benchTest = { settle: 300, meas: 1000 }; });
        if (c.slowRaf) await p.evaluateOnNewDocument(() => { window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 400); });
        await p.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'load' });
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'เริ่มวัด'), { timeout: 120000 });
        if (c.fault) await p.evaluate(fault, c.fault);
        await sleep(300); const bt = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'เริ่มวัด')); await bt.click();
        await sleep(1500); row.panelHidden = await p.evaluate(() => ![...document.querySelectorAll('button')].some((b) => b.textContent === 'เริ่มวัด' && b.getClientRects().length));
        await p.waitForFunction(() => window.__benchResult, { timeout: c.full ? 400000 : 240000 }); await sleep(200);
        if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'selftest.' + c.name + '.png') });
        const r = await p.evaluate(() => { const b = window.__benchResult; return { verdict: b.verdict, verdictIfCounted: b.verdictIfCounted, pass: b.pass, reasons: b.reasons, device: b.device, files: b.files, rows: b.rows, line: b.line,
          runs: b.runs.map((x) => ({ scene: x.scene, on: x.on, fps: +x.fps.toFixed(1), frames: x.frames, gap: x.gap, hidden: x.hidden, sts: x.sts, body: x.body, ev: x.ev, pins: x.pins })), err: b.runs.err || null,
          head: (document.querySelector('h2') || {}).textContent }; });
        const counted = r.reasons.filter((x) => x !== 'mode');
        row.reasons = r.reasons; row.verdict = r.verdict; row.verdictIfCounted = r.verdictIfCounted; row.head = r.head; row.line = r.line;
        row.rows = r.rows.map((x) => ({ id: x.id, ratio: x.ratio === null ? null : +x.ratio.toFixed(3), ok: x.ok, why: x.why, cut: x.cut, shaky: x.shaky, fps: [+x.fpsOn.toFixed(1), +x.fpsOff.toFixed(1)], js: [+x.jsOn.toFixed(2), +x.jsOff.toFixed(2)],
          draws: x.draws.map((v) => +v.toFixed(1)), shadow: x.shadow.map((v) => +v.toFixed(2)) }));
        row.files = { ok: r.files.ok, asked: r.files.asked, hashed: r.files.hashed, missing: r.files.missing, failed: r.files.failed, wrong: r.files.wrong, why: r.files.why }; row.runs = r.runs; row.phone = r.device.phone; row.pageErrors = pe;
        const checks = {
          reasons: c.wantHas ? c.wantHas.every((x) => counted.includes(x)) : sameSet(counted, c.want),
          verdictIfCounted: r.verdictIfCounted === c.verdict,
          verdict: r.verdict === (c.exact || 'void') && r.pass === (r.verdict === 'pass'),   // a test-timing run never counts
          mode: c.full ? !r.reasons.includes('mode') : r.reasons.includes('mode'),
          head: c.exact === 'pass' ? /ผ่าน/.test(r.head) && !/ไม่/.test(r.head) : /ไม่นับ/.test(r.head),
          panelHidden: row.panelHidden, noPageError: !pe.length && !r.err, more: c.more ? !!c.more(r) : true };
        row.checks = checks; row.ok = Object.values(checks).every(Boolean);
      } catch (e) { row.ok = false; row.error = String(e && e.message || e).slice(0, 300); }
      console.log(JSON.stringify({ name: row.name, tries, ok: row.ok, verdict: row.verdict, verdictIfCounted: row.verdictIfCounted, reasons: row.reasons, checks: row.checks, error: row.error }));
      await bc.close(); if (srv.closeAllConnections) srv.closeAllConnections(); await new Promise((r) => srv.close(r));
      if (row.ok) break;
      }
    }
  } catch (e) { console.error(String(e && e.stack || e)); if (browser) await browser.close(); process.exit(2); }
  await browser.close();
  const sum = { cases: out.length, ok: out.filter((x) => x.ok).length, retried: out.filter((x) => x.tries > 1).map((x) => x.name + '×' + x.tries), verdict: out.length && out.every((x) => x.ok) ? 'pass' : 'fail' };
  if (outFile) fs.writeFileSync(outFile, JSON.stringify({ summary: sum, cases: out }, null, 1));
  console.log(JSON.stringify(sum)); process.exit(sum.verdict === 'pass' ? 0 : 1);
})();
