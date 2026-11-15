// G4.6: self-test of the phone bench (qa/g4/phone_bench.js v6) — it must not say "ผ่าน" when the measurement cannot be trusted.
//   node qa/g4/phone_bench_selftest.js <out dir of build_phone_bench.py> [results.json]      CASES=a,b  FULL=1  CHROME_EXE=…
// Serves the built copy itself (page.html inside the same skeleton the artifact host adds + exactly the files of files.json; a case
// can leave a file out or answer 200 with other bytes — the fault is at the server, no request is intercepted in the browser) and runs the bench in test timing
// (window.__benchTest: settle 300 ms · count 1000 ms — such a run never counts; the self-test reads verdictIfCounted, the verdict the
// same checks would give in a full-length run). FULL=1 adds full-length runs on an emulated phone: the normal one, which
// must say "ผ่าน"; (v5) the farm's scene data answered 304 with no body, which must say "ไม่นับ"; (v6) Codex's two T50 probes — a
// body that is still coming in when the run would start ("ไม่นับ") and a third of the farm's draw commands gone ("ไม่ผ่าน").
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
// T48: the FIRST answer for a file is wrong (a 1×1 PNG padded to the file's own length, or the file with 4,000 bytes zeroed — same size
// both), every later answer is the real file: a check that reads the file again sees nothing wrong, the game already holds the bad one
const padded = (name) => { const b = Buffer.alloc(fs.statSync(MAP[name]).size); PNG1.copy(b); return b; };
// the file with one piece of text replaced by another of the same length (it must be there exactly once)
const alter = (name, from, to) => { const t = fs.readFileSync(MAP[name], 'latin1'); if (from.length !== to.length || t.split(from).length !== 2) throw Error('alter ' + name); return Buffer.from(t.replace(from, to), 'latin1'); };
// first[name]: the FIRST GET of that file is answered with these bytes (200), or — { status: 304 } — with that status and no body
// (Codex T49-N1: a bare 304, the browser has nothing to show for it); every later answer is the real file.
// hold: GETs of these files are not answered until release() is called (a slow file, v5).
// etag: every file is sent with an ETag and "Cache-Control: no-cache", and a request that brings the ETag back is answered 304 with
// no body — the ordinary way a browser checks its own copy; the game then gets a full 200 answer from the browser (v5).
// part[name] = n: the first GET of that file gets its headers and its first n bytes at once; the rest of the body waits for release()
// (v6) — or, with brk, the connection is cut at release() and the rest never comes.
function serve(deny, swap, first, nostore, hold, etag, part, brk) {
  const served = {}, cc = nostore ? { 'cache-control': 'no-store' } : etag ? { 'cache-control': 'no-cache' } : {}, waiting = [];   // no-store: the browser keeps no copy, so a second read goes to the server again
  let open = false, n304 = 0;
  return new Promise((res) => { const s = http.createServer((q, r) => {
    const p = decodeURIComponent(new URL(q.url, 'http://x').pathname).slice(1) || 'index.html';
    if (p === 'index.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(q.method === 'HEAD' ? undefined : PAGE); }
    if (deny.includes(p) || !MAP[p]) { r.writeHead(404); return r.end(); }
    const type = TYPES[p.split('.').pop()] || 'application/octet-stream';
    if (first && first[p] && q.method === 'GET' && !served[p]) { served[p] = 1;
      if (!Buffer.isBuffer(first[p])) { r.writeHead(first[p].status, cc); return r.end(); }
      r.writeHead(200, Object.assign({ 'content-type': type, 'content-length': first[p].length }, cc)); return r.end(first[p]); }
    if (swap && swap[p]) { r.writeHead(200, { 'content-type': type, 'content-length': swap[p].length }); return r.end(q.method === 'HEAD' ? undefined : swap[p]); }
    if (part && part[p] && q.method === 'GET' && !served[p]) { served[p] = 1; const buf = fs.readFileSync(MAP[p]);
      r.writeHead(200, { 'content-type': type, 'content-length': buf.length, 'cache-control': 'no-store' }); r.flushHeaders(); r.write(buf.subarray(0, part[p]));
      const rest = () => (brk ? r.destroy() : r.end(buf.subarray(part[p]))); if (open) rest(); else waiting.push(rest); return; }
    const tag = etag ? '"' + fs.statSync(MAP[p]).size + '-' + p.length + '"' : null;
    if (tag && q.headers['if-none-match'] === tag) { n304++; r.writeHead(304, Object.assign({ etag: tag }, cc)); return r.end(); }
    const send = () => { r.writeHead(200, Object.assign({ 'content-type': type, 'content-length': fs.statSync(MAP[p]).size }, cc, tag ? { etag: tag } : {}));
      if (q.method === 'HEAD') return r.end(); fs.createReadStream(MAP[p]).pipe(r); };
    if (hold && hold.includes(p) && q.method === 'GET' && !open) return waiting.push(send);
    send(); });
    s.release = () => { open = true; waiting.splice(0).forEach((f) => f()); }; s.n304 = () => n304;
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
  // v6: draw commands of the scene taken away while the flag is on. The wrapper is put OUTSIDE the bench's own (it waits until the
  // bench has put its wrapper on the canvas), so the bench never sees the commands that are dropped; drawPlayer's are left alone.
  // None of these uses the way the bench groups commands into objects.
  const cutOps = (names, pick) => { const t = setInterval(() => { if (!Object.prototype.hasOwnProperty.call(ctx, 'drawImage')) return; clearInterval(t); let inp = 0; const dp = drawPlayer;
    drawPlayer = function () { inp++; try { return dp.apply(this, arguments); } finally { inp--; } };
    for (const k of names) { const o = ctx[k]; ctx[k] = function () { if (!inp && c234Use() && pick.apply(null, arguments)) return; return o.apply(this, arguments); }; } }, 20); };
  const cut = (pick) => cutOps(['drawImage'], pick);
  if (kind === 'norects') cutOps(['fillRect'], function (x, y, w, h) { return Math.abs(h) >= 500; });   // the whole-screen rectangles (tint, darkness)
  if (kind === 'nopaths') cutOps(['fill', 'stroke'], () => true);                                            // every path fill and stroke (the dark scene's light circles, sparkles, outlines)
  let ck = 0, ci = null, cx = 0, cw = 0, cpos = 0;
  if (kind === 'fewdraws') cut(() => ck++ % 2 === 1);                                   // every other command, in every scene
  if (kind === 'fewstrips') cut(() => M.id === 'farm' && ck++ % 3 === 2);               // Codex T50-N2: every third command of the farm (rows go missing inside the plants that lean)
  if (kind === 'nobackground') cut(function (img, sx, sy, sw, sh, dx, dy, dw, dh) { return arguments.length >= 9 && Math.abs(dw * dh) >= 1e6; });                 // the painted ground: one command, a whole screen
  if (kind === 'fewsmall') cut(function (img, sx, sy, sw, sh, dx, dy, dw, dh) { return M.id === 'farm' && arguments.length >= 9 && dh > 3 && dh <= 14; });        // the farm's short things, each of them whole
  if (kind === 'gaprows') cut(function (img, sx, sy, sw, sh) { if (!(M.id === 'farm' && arguments.length >= 9 && sh <= 3)) { ci = null; return false; }           // the second row of every plant that is being drawn in rows
    if (img === ci && sx === cx && sw === cw) cpos++; else { ci = img; cx = sx; cw = sw; cpos = 0; } return cpos === 1; });
  if (kind === 'stall') { let last = ''; setInterval(() => { const t = txt(); if (/^ฉาก 1\/3.*ตัวใหม่ ปิด/.test(t) && t !== last) { last = t; setTimeout(() => burn(900), 500); } }, 30); }
  if (kind === 'slowoff' || kind === 'slowon') { const re = kind === 'slowoff' ? /^ฉาก 2\/3.*ตัวใหม่ ปิด/ : /ตัวใหม่ เปิด/; let k = 0;
    const f = () => { if (re.test(txt()) && (kind === 'slowoff' || ++k % 3 === 0)) burn(kind === 'slowoff' ? 25 : 28); requestAnimationFrame(f); }; requestAnimationFrame(f); }   // slowon: every 3rd frame is late → 65–80 %
  // v5: the farm's scene data is gone (every file is right, the game simply builds the farm the old way) · a file of the copy is
  // loaded in the middle of a measured run · the game's own kind of ping (HEAD) — that one must change nothing
  if (kind === 'standin') { G9B = null; delete CACHE.farm; }
  if (kind === 'lateload') { let done = false; setInterval(() => { if (!done && /^ฉาก 1\/3.*คู่ 2\/3.*ตัวใหม่ เปิด/.test(txt())) { done = true; setTimeout(() => { new Image().src = 'kit-town.png?late=1'; }, 700); } }, 30); }
  if (kind === 'headok') { fetch('manifest.json?ping=1', { method: 'HEAD', cache: 'no-store' }); fetch(new Request('c2-pack.json', { method: 'HEAD' })); }
  // v5: a picture of the copy fails and the page puts a built-in picture in its place (what is left on the element is fine) ·
  // one image element is given two files, one after the other (only the second can still be compared)
  if (kind === 'imgerror') { const im = new Image(); im.onerror = () => { im.onerror = null; im.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; }; im.src = 'gm-c207-g2.png'; window.__keep = im; }
  if (kind === 'imgreuse') { const im = new Image(); im.onload = () => { im.onload = null; im.src = 'gm-c207-g1.png'; }; im.src = 'gm-c207-g2.png'; window.__keep = im; }
  if (kind === 'hidden') { let h = false, done = false; Object.defineProperty(document, 'hidden', { get: () => h, configurable: true });
    setInterval(() => { if (!done && /^ฉาก 3\/3.*คู่ 2\/3/.test(txt())) { done = true; setTimeout(() => { h = true; document.dispatchEvent(new Event('visibilitychange')); setTimeout(() => { h = false; document.dispatchEvent(new Event('visibilitychange')); }, 100); }, 600); } }, 30); }
}
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
// name · what is wrong · expected reasons besides "mode" · expected verdictIfCounted · extra check
// noise: the fault itself can change the speed of some runs (a lighter graphics mode, half of the scene not drawn …) or the machine
// can be busy, so the bench's own noise guards (unstable / interrupted) may ALSO fire: for these cases such extra reasons are let
// through and the verdict may then be "void" — but "more", which reads the very check the case is about, must hold on every
// machine (Codex T48: "lite" came out void + unstable on Codex's machine while its own check had fired). "ok", "full" and "slowon"
// (the 90 % gate itself) stay exact.
const NOISE = ['unstable', 'interrupted'];
const CASES = [
  { name: 'ok', want: [], verdict: 'pass', more: (r) => r.files.ok && r.files.asked >= 150 && r.files.hashed >= 150 && !r.files.wrong.length && r.device.phone &&
      r.files.images >= 100 && r.files.imagesEqual === r.files.images && r.files.fetches >= 20 && r.files.scripts.some((x) => x.rel === 'char2.js' && x.guarded && x.state === 'loaded') &&   // what the game holds
      r.rows.every((x) => x.ok && !x.cut && !x.shaky && !x.standin && x.jsOn > 0 && x.jsOff > 0) &&
      r.rows.every((x) => x.rowsPainted[0] >= 0.97 * x.rowsPainted[1] && x.obj[0] >= x.obj[1] - 1.5 && x.rectRows[0] >= 0.97 * x.rectRows[1] && x.ops[0] >= 0.85 * x.ops[1] && x.rowsMissing[0] === 0 && x.rowsMissing[1] === 0) &&   // v6: the scene outside the player is the same with the flag on and off
      r.files.imageLoads >= 100 && r.files.imageErrors === 0 && r.files.reused === 0 &&                                 // v5: every picture load ended well, no element was given two files
      r.runs.every((x) => x.real && !x.busy.length) && r.files.record[0] > 100 && r.files.record[0] === r.files.record[1] &&   // v5: the real scenes, nothing loading while measuring, the check leaves the load record as it was (T49-N2)
      r.runs.every((x) => x.on ? x.ev.newD >= 0.8 * x.frames && x.ev.oldD === 0 : x.ev.oldD >= 0.8 * x.frames && x.ev.newD === 0) &&      // what was drawn, both ways
      r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === x.ev.newD && x.ev.vis > 0 && x.ev.heldCmd === x.ev.vis) && r.runs.filter((x) => x.scene !== 'S3').every((x) => x.ev.heldCfg === 0) },
  { name: 'desktop', noise: true, desktop: true, want: ['device'], verdict: 'void', more: (r) => !r.device.phone && r.files.ok },
  { name: 'nofile', noise: true, deny: ['kit-town.png'], want: ['files'], verdict: 'void', more: (r) => r.files.failed.includes('kit-town.png') && !r.files.missing.length },
  { name: 'unlisted', noise: true, fault: 'unlisted', want: ['files'], verdict: 'void', more: (r) => r.files.missing.includes('kit-town.png') },
  { name: 'build', noise: true, fault: 'build', want: ['build'], verdict: 'void' },
  { name: 'c2fail', noise: true, deny: ['c2-pack.json'], want: ['files'], verdict: 'void', more: (r) => r.files.failed.includes('c2-pack.json') && r.rows.every((x) => !x.ok && x.why === 'ตัวใหม่ไม่พร้อม') },
  { name: 'stall', fault: 'stall', wantHas: ['interrupted'], verdict: 'void', more: (r) => r.rows[0].cut && !r.rows[1].cut && !r.rows[2].cut },
  { name: 'hidden', fault: 'hidden', want: ['interrupted'], verdict: 'void', more: (r) => r.rows[2].cut && r.runs.filter((x) => x.hidden).length === 1 },
  { name: 'slowoff', fault: 'slowoff', want: ['unstable'], verdict: 'void', more: (r) => r.rows[1].shaky && r.rows[1].ratio > 1.10 && !r.rows[0].shaky },
  { name: 'slowon', fault: 'slowon', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => x.ok && x.ratio < 0.90 && x.ratio > 0.60) },
  { name: 'lowfps', slowRaf: true, wantHas: ['interrupted'], verdict: 'void' },
  // v3 (Codex T47-N1 N2 N4): each of these passed in v2
  { name: 'nolantern', noise: true, fault: 'nolantern', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'ตะเกียงไม่ถูกวาด' && r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === 0 && x.ev.newD > 0) },
  { name: 'nohold', noise: true, fault: 'nohold', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'ตะเกียงไม่ถูกวาด' && r.runs.filter((x) => x.on && x.scene === 'S3').every((x) => x.ev.heldCfg === x.ev.newD && x.ev.vis === 0) },
  { name: 'nooldbody', noise: true, fault: 'nooldbody', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ตัวเดิมไม่ถูกวาด') && r.runs.filter((x) => !x.on).every((x) => x.ev.oldD === 0 && x.ev.calls > 0) },
  { name: 'nooldbody_late', noise: true, fault: 'nooldbody_late', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ตัวเดิมไม่ถูกวาด') && r.runs.filter((x) => !x.on).every((x) => x.ev.oldD === 0 && x.ev.calls === 0) },
  { name: 'noshadow', noise: true, fault: 'noshadow', want: [], verdict: 'fail', more: (r) => !r.rows[0].ok && r.rows[0].why === 'เงาไม่ตรง' && r.rows[1].ok && !r.rows[2].ok && r.rows[2].why === 'เงาไม่ตรง' },
  { name: 'lite', noise: true, fault: 'lite', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && !r.rows[1].ok && r.rows[1].why === 'เกมเปลี่ยนโหมดกราฟิกเอง' },
  // v6: the scene outside the player — rows painted, objects, rows missing inside objects (the three numbers of the bench's check)
  { name: 'fewdraws', noise: true, fault: 'fewdraws', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ฉากวาดไม่ครบตอนเปิด' && x.rowsPainted[0] < 0.9 * x.rowsPainted[1] && x.obj[0] < 0.9 * x.obj[1]) },
  // Codex T50-N2: a third of the farm's commands gone. v5's "things" counted the pieces of a cut plant as new things (87 %) and said "ผ่าน"
  { name: 'fewstrips', noise: true, fault: 'fewstrips', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[2].ok && !r.rows[1].ok && r.rows[1].why === 'ฉากวาดไม่ครบตอนเปิด' &&
      r.rows[1].rowsPainted[0] < 0.9 * r.rows[1].rowsPainted[1] && r.rows[1].obj[0] < 0.9 * r.rows[1].obj[1] && r.rows[1].rowsMissing[0] > r.rows[1].rowsMissing[1] + 1 },
  // each of the three numbers on its own: the painted ground gone (rows only) · the farm's short things gone (objects only) · one row
  // cut out of every leaning plant (missing rows only)
  { name: 'nobackground', noise: true, fault: 'nobackground', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ฉากวาดไม่ครบตอนเปิด' && x.rowsPainted[0] < 0.9 * x.rowsPainted[1] && x.obj[0] >= 0.9 * x.obj[1] && x.rowsMissing[0] <= x.rowsMissing[1] + 1 && x.rectRows[0] >= 0.9 * x.rectRows[1] && x.ops[0] >= 0.8 * x.ops[1]) },
  { name: 'fewsmall', noise: true, fault: 'fewsmall', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[2].ok && !r.rows[1].ok && r.rows[1].why === 'ฉากวาดไม่ครบตอนเปิด' &&
      r.rows[1].obj[0] < 0.9 * r.rows[1].obj[1] && r.rows[1].rowsPainted[0] >= 0.9 * r.rows[1].rowsPainted[1] && r.rows[1].rowsMissing[0] <= r.rows[1].rowsMissing[1] + 1 && r.rows[1].rectRows[0] >= 0.9 * r.rows[1].rectRows[1] && r.rows[1].ops[0] >= 0.8 * r.rows[1].ops[1] },
  // … and what is painted without pictures: the whole-screen rectangles gone (rectangle rows only) · every path fill and stroke gone (number of commands only)
  { name: 'norects', noise: true, fault: 'norects', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ฉากวาดไม่ครบตอนเปิด' && x.rectRows[0] < 0.9 * x.rectRows[1] && x.ops[0] >= 0.8 * x.ops[1] && x.rowsPainted[0] >= 0.9 * x.rowsPainted[1] && x.obj[0] >= 0.9 * x.obj[1] && x.rowsMissing[0] <= x.rowsMissing[1] + 1) },
  { name: 'nopaths', noise: true, fault: 'nopaths', want: [], verdict: 'fail', more: (r) => r.rows.every((x) => !x.ok && x.why === 'ฉากวาดไม่ครบตอนเปิด' && x.ops[0] < 0.8 * x.ops[1] && x.rectRows[0] >= 0.9 * x.rectRows[1] && x.rowsPainted[0] >= 0.9 * x.rowsPainted[1] && x.obj[0] >= 0.9 * x.obj[1] && x.rowsMissing[0] <= x.rowsMissing[1] + 1) },
  { name: 'gaprows', noise: true, fault: 'gaprows', want: [], verdict: 'fail', more: (r) => r.rows[0].ok && r.rows[2].ok && !r.rows[1].ok && r.rows[1].why === 'ฉากวาดไม่ครบตอนเปิด' &&
      r.rows[1].rowsMissing[0] > r.rows[1].rowsMissing[1] + 1 && r.rows[1].rowsPainted[0] >= 0.9 * r.rows[1].rowsPainted[1] && r.rows[1].obj[0] >= 0.9 * r.rows[1].obj[1] && r.rows[1].rectRows[0] >= 0.9 * r.rows[1].rectRows[1] && r.rows[1].ops[0] >= 0.8 * r.rows[1].ops[1] },
  // (v5: a 1×1 picture in place of the painted cave mouth is also not the real scene — "files" and "scene"; a picture of the right size with wrong pixels is "files" only)
  { name: 'wrongimage', noise: true, swap: () => ({ 'map-cave-mouth.jpg': PNG1 }), want: ['files', 'scene'], verdict: 'void', more: (r) => r.files.wrong.includes('map-cave-mouth.jpg') && !r.files.missing.length && !r.files.failed.length && r.rows[2].standin && !r.rows[0].standin && !r.rows[1].standin },
  { name: 'wrongsame', noise: true, swap: () => ({ 'map-cave-mouth.jpg': sameSize('map-cave-mouth.jpg') }), want: ['files'], verdict: 'void', more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'map-cave-mouth.jpg' && !r.files.missing.length && !r.files.failed.length },
  // v4 (Codex T48): only the first answer is wrong, same size
  { name: 'firstwrong', noise: true, first: () => ({ 'map-cave-mouth.jpg': padded('map-cave-mouth.jpg') }), want: ['files', 'scene'], verdict: 'void', more: (r) => r.files.wrong.includes('map-cave-mouth.jpg') && r.rows[2].standin },
  // … and the browser keeps no copy (Cache-Control: no-store): v3 said "ผ่าน" here. An image of another size · an image of the same
  // size in pixels and bytes · a file the game fetches · the script of the new character (same behaviour, one letter of its comment changed)
  { name: 'firstwrong_nostore', noise: true, nostore: true, first: () => ({ 'map-cave-mouth.jpg': padded('map-cave-mouth.jpg') }), want: ['files', 'scene'], verdict: 'void', more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'map-cave-mouth.jpg' && r.files.imagesEqual === r.files.images - 1 && r.rows[2].standin },
  { name: 'firstsame_nostore', noise: true, nostore: true, first: () => ({ 'map-cave-mouth.jpg': sameSize('map-cave-mouth.jpg') }), want: ['files'], verdict: 'void', more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'map-cave-mouth.jpg' && r.files.imagesEqual === r.files.images - 1 },
  { name: 'firstjson_nostore', noise: true, nostore: true, first: () => ({ 'g9b-scene.json': alter('g9b-scene.json', '"mailbox":[22.88,', '"mailbox":[22.89,') }), want: ['files'], verdict: 'void', more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'g9b-scene.json' && r.files.imagesEqual === r.files.images },
  { name: 'firstscript_nostore', noise: true, nostore: true, first: () => ({ 'char2.js': alter('char2.js', 'built from char2.src.js', 'buil7 from char2.src.js') }), want: ['files'], verdict: 'void',
    more: (r) => r.files.wrong.length === 1 && r.files.wrong[0] === 'char2.js' && !r.rows[0].ok && r.rows[0].why === 'ตัวใหม่ไม่พร้อม' && r.files.scripts.some((x) => x.rel === 'char2.js' && x.guarded && x.state === 'error') },
  // v5 (Codex T49-N1): the first GET of the farm's scene data is answered 304 with no body, every later one is right. The game gets
  // nothing, keeps the old farm (17 draw commands a frame instead of 250) — v4 said "ผ่าน". Two guards must fire, each on its own:
  // the file (a GET the game did not get) and the scene (not the real farm).
  { name: 'first304_nostore', noise: true, nostore: true, first: () => ({ 'g9b-scene.json': { status: 304 } }), want: ['files', 'scene'], verdict: 'void',
    more: (r) => r.files.failed.length === 1 && r.files.failed[0] === 'g9b-scene.json' && !r.files.wrong.length && !r.files.missing.length &&
      r.rows[0].ok && r.rows[2].ok && !r.rows[1].ok && r.rows[1].standin && r.rows[1].why === 'ฉากสำรอง' && r.runs.filter((x) => x.scene === 'S2').every((x) => !x.real) && r.runs.filter((x) => x.scene !== 'S2').every((x) => x.real) },
  // the same answer for a picture: the painted cave mouth never arrives
  { name: 'first304img_nostore', noise: true, nostore: true, first: () => ({ 'map-cave-mouth.jpg': { status: 304 } }), want: ['files', 'scene'], verdict: 'void',
    more: (r) => r.files.failed.includes('map-cave-mouth.jpg') && !r.rows[2].ok && r.rows[2].standin && r.rows[0].ok && r.rows[1].ok },
  // only the scene guard: every file is right, the farm is the old one
  { name: 'standin', noise: true, fault: 'standin', want: ['scene'], verdict: 'void', more: (r) => r.files.ok && r.rows[0].ok && r.rows[2].ok && !r.rows[1].ok && r.rows[1].standin && r.rows[1].why === 'ฉากสำรอง' },
  // a slow file that is right: the bench waits for it before it starts the game, and the run is a normal one. The server holds the
  // farm's scene data until the page has shown "waiting for files" for 3 s (or, if the bench does not wait, until the farm is being measured).
  { name: 'slowjson', hold: ['g9b-scene.json'], release: 'waiting', want: [], verdict: 'pass', more: (r) => r.hold.how === 'waiting' && r.waited >= 2500 && r.files.ok && r.rows.every((x) => x.ok && !x.standin && !x.cut) && r.runs.every((x) => x.real && !x.busy.length) },
  // Codex T50-N1: the answer's headers and its first 32 bytes come at once, the rest of the body is held. v5 took the headers for the
  // end of the load. · slowbody: the rest comes once the page has waited 3 s → a normal run. · bodylate: the rest comes only when the
  // first run is being measured — a bench that waits has by then given up on the file (20 s at test timing: the run does not count)
  // and sees the body arrive inside that run (interrupted); one that takes the headers for the end starts at once, sees nothing
  // and says "ผ่าน".
  { name: 'slowbody', part: { 'g9b-scene.json': 32 }, release: 'waiting', want: [], verdict: 'pass', more: (r) => r.hold.how === 'waiting' && r.waited >= 2500 && r.files.ok && r.rows.every((x) => x.ok && !x.standin && !x.cut) && r.runs.every((x) => x.real && !x.busy.length) },
  // the body breaks off: 3 s into the wait the connection is cut. The game never gets the farm's scene data (file + stand-in scene)
  { name: 'bodybreak', noise: true, part: { 'g9b-scene.json': 32 }, partBreak: true, release: 'waiting', want: ['files', 'scene'], verdict: 'void', more: (r) => r.hold.how === 'waiting' && r.waited >= 2500 && r.files.failed.length === 1 && r.files.failed[0] === 'g9b-scene.json' && r.rows[1].standin && !r.rows[0].standin && !r.rows[2].standin },
  { name: 'bodylate', noise: true, part: { 'g9b-scene.json': 32 }, release: 'run1', releaseAfter: 1500, want: ['files'], verdict: 'void', more: (r) => r.hold.how === 'run1' && r.waited >= 19000 && r.waited < 30000 && r.files.failed.length === 1 && r.files.failed[0] === 'g9b-scene.json' && !r.files.wrong.length &&
      r.reasons.includes('interrupted') && r.rows[0].cut && r.runs[0].busy.includes('g9b-scene.json') && r.rows.every((x) => !x.standin) },
  // a file of the copy loaded inside a measured run: that run is not a clean one
  { name: 'lateload', fault: 'lateload', want: ['interrupted'], verdict: 'void', more: (r) => r.files.ok && r.rows[0].cut && !r.rows[1].cut && !r.rows[2].cut && r.runs.filter((x) => x.busy.length).length === 1 && r.runs.find((x) => x.busy.length).busy[0] === 'kit-town.png' && r.runs.every((x) => x.gap <= 300) },
  // a picture load that ended with an error although the element shows a fine picture afterwards (gm-c207-g2.png is a file of the
  // copy that the game itself never asks for here; its first answer is a bare 304) · an element given two files
  { name: 'imgerror', noise: true, nostore: true, fault: 'imgerror', first: () => ({ 'gm-c207-g2.png': { status: 304 } }), want: ['files'], verdict: 'void',
    more: (r) => r.files.failed.length === 1 && r.files.failed[0] === 'gm-c207-g2.png' && r.files.imageErrors === 1 && !r.files.wrong.length && !r.files.missing.length && !r.files.why && r.rows.every((x) => x.ok) },
  { name: 'imgreuse', noise: true, fault: 'imgreuse', want: ['files'], verdict: 'void',
    more: (r) => r.files.reused === 1 && /more than one file/.test(r.files.why) && !r.files.failed.length && !r.files.wrong.length && !r.files.missing.length && r.files.imageErrors === 0 && r.rows.every((x) => x.ok) },
  // the ordinary use of the browser's cache must go on working: the page is loaded once, then loaded again — this time the browser
  // asks the server "is my copy still good?" for every file and is told 304. The game gets full answers from the browser, so this
  // is a normal run (a bare 304 that leaves the game with nothing is first304_nostore above)
  { name: 'revalidate', etag: true, reload: true, want: [], verdict: 'pass', more: (r) => r.files.ok && r.srv.n304 >= 100 && r.files.fetches >= 20 && r.files.imagesEqual === r.files.images && r.rows.every((x) => x.ok && !x.standin) },
  // a HEAD (the game's ping) has no body and must not count as a file the game did not get
  { name: 'headok', fault: 'headok', want: [], verdict: 'pass', more: (r) => r.files.ok && r.files.heads >= 2 },
];
if (process.env.FULL) CASES.push({ name: 'full304', full: true, noise: true, nostore: true, first: () => ({ 'g9b-scene.json': { status: 304 } }), want: ['files', 'scene'], verdict: 'void', exact: 'void',
  more: (r) => r.files.failed.length === 1 && r.files.failed[0] === 'g9b-scene.json' && r.rows[1].standin && /→ ไม่นับ \(/.test(r.line) && !r.pass });
if (process.env.FULL) CASES.push({ name: 'fullbody', full: true, noise: true, part: { 'g9b-scene.json': 32 }, release: 'run1', releaseAfter: 2800, want: ['files'], verdict: 'void', exact: 'void',
  more: (r) => r.hold.how === 'run1' && r.waited >= 44000 && r.waited < 60000 && r.files.failed.length === 1 && r.files.failed[0] === 'g9b-scene.json' && r.reasons.includes('interrupted') && r.runs[0].busy.includes('g9b-scene.json') && /→ ไม่นับ \(/.test(r.line) && !r.pass });
if (process.env.FULL) CASES.push({ name: 'fullstrips', full: true, fault: 'fewstrips', want: [], verdict: 'fail', exact: 'fail',
  more: (r) => !r.rows[1].ok && r.rows[1].why === 'ฉากวาดไม่ครบตอนเปิด' && r.rows[1].rowsPainted[0] < 0.9 * r.rows[1].rowsPainted[1] && r.rows[1].obj[0] < 0.9 * r.rows[1].obj[1] && r.rows[0].ok && r.rows[2].ok && /→ ไม่ผ่าน/.test(r.line) && !r.pass });
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
      const srv = await serve(c.deny || [], c.swap ? c.swap() : null, c.first ? c.first() : null, c.nostore, c.hold, c.etag, c.part, c.partBreak), port = srv.address().port, bc = await browser.createBrowserContext(), p = await bc.newPage(), pe = [];
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
        if (c.reload) { await sleep(1500); await p.reload({ waitUntil: 'load' });   // the second load of the page is the one that is measured
          await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'เริ่มวัด'), { timeout: 120000 }); }
        if (c.fault) await p.evaluate(fault, c.fault);
        await sleep(300); const bt = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'เริ่มวัด')); await bt.click();
        await sleep(1500); row.panelHidden = await p.evaluate(() => ![...document.querySelectorAll('button')].some((b) => b.textContent === 'เริ่มวัด' && b.getClientRects().length));
        if (c.release) { const t0 = Date.now(); let seen = 0, how = '';   // let the held file (or the rest of its body) go
          // 'waiting': after the page has waited 3 s for it — or, a bench that does not wait, in the middle of the farm
          // 'run1':    c.releaseAfter ms after the first run of the first scene is on the screen
          for (;;) { const t = await p.evaluate(() => { for (const d of document.body.children) { const t = d.textContent || ''; if (/^รอให้เกมโหลด|^ฉาก \d\/3/.test(t)) return t; } return ''; });
            if (c.release === 'waiting') { if (/^รอให้เกมโหลด/.test(t)) { if (!seen) seen = Date.now(); if (Date.now() - seen >= 3000) { how = 'waiting'; break; } }
              else if (/^ฉาก 2\/3.*คู่ 2\/3/.test(t)) { how = 'farm'; break; } }
            else if (/^ฉาก 1\/3.*คู่ 1\/3/.test(t)) { await sleep(c.releaseAfter || 700); how = 'run1'; break; }
            if (Date.now() - t0 > 120000) { how = 'timeout'; break; }
            await sleep(100); }
          srv.release(); row.hold = { how, ms: Date.now() - t0 }; }
        await p.waitForFunction(() => window.__benchResult, { timeout: c.full ? 400000 : 240000 }); await sleep(200);
        if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'selftest.' + c.name + '.png') });
        const r = await p.evaluate(() => { const b = window.__benchResult; return { verdict: b.verdict, verdictIfCounted: b.verdictIfCounted, pass: b.pass, reasons: b.reasons, waited: b.waited, device: b.device, files: b.files, rows: b.rows, line: b.line,
          runs: b.runs.map((x) => ({ scene: x.scene, on: x.on, fps: +x.fps.toFixed(1), frames: x.frames, gap: x.gap, hidden: x.hidden, sts: x.sts, body: x.body, ev: x.ev, pins: x.pins, real: x.real, busy: x.busy })), err: b.runs.err || null,
          head: (document.querySelector('h2') || {}).textContent }; });
        r.hold = row.hold || null; row.waited = r.waited; r.srv = row.srv = { n304: srv.n304() };
        const counted = r.reasons.filter((x) => x !== 'mode'), noise = counted.filter((x) => NOISE.includes(x)), firm = c.noise ? counted.filter((x) => !NOISE.includes(x)) : counted;
        row.noise = c.noise ? noise : [];   // only where such reasons were let through
        row.reasons = r.reasons; row.verdict = r.verdict; row.verdictIfCounted = r.verdictIfCounted; row.head = r.head; row.line = r.line;
        row.rows = r.rows.map((x) => ({ id: x.id, ratio: x.ratio === null ? null : +x.ratio.toFixed(3), ok: x.ok, why: x.why, cut: x.cut, shaky: x.shaky, standin: x.standin, fps: [+x.fpsOn.toFixed(1), +x.fpsOff.toFixed(1)], js: [+x.jsOn.toFixed(2), +x.jsOff.toFixed(2)],
          draws: x.draws.map((v) => +v.toFixed(1)), rowsPainted: x.rowsPainted.map((v) => +v.toFixed(1)), obj: x.obj.map((v) => +v.toFixed(2)), rowsMissing: x.rowsMissing.map((v) => +v.toFixed(2)), rectRows: x.rectRows.map((v) => +v.toFixed(1)), ops: x.ops.map((v) => +v.toFixed(1)), shadow: x.shadow.map((v) => +v.toFixed(2)) }));
        row.files = { ok: r.files.ok, asked: r.files.asked, hashed: r.files.hashed, images: r.files.images, imagesEqual: r.files.imagesEqual, fetches: r.files.fetches, heads: r.files.heads, record: r.files.record, imageLoads: r.files.imageLoads, imageErrors: r.files.imageErrors, reused: r.files.reused, scripts: r.files.scripts, ms: r.files.ms, missing: r.files.missing, failed: r.files.failed, wrong: r.files.wrong, why: r.files.why }; row.runs = r.runs; row.phone = r.device.phone; row.pageErrors = pe;
        const checks = {
          reasons: c.wantHas ? c.wantHas.every((x) => counted.includes(x)) : sameSet(firm, c.want),
          verdictIfCounted: r.verdictIfCounted === c.verdict || (!!c.noise && noise.length > 0 && r.verdictIfCounted === 'void'),
          verdict: r.verdict === (c.exact || 'void') && r.pass === (r.verdict === 'pass'),   // a test-timing run never counts
          mode: c.full ? !r.reasons.includes('mode') : r.reasons.includes('mode'),
          head: c.exact === 'pass' ? /ผ่าน/.test(r.head) && !/ไม่/.test(r.head) : c.exact === 'fail' ? /ไม่ผ่าน/.test(r.head) : /ไม่นับ/.test(r.head),
          panelHidden: row.panelHidden, noPageError: !pe.length && !r.err, more: c.more ? !!c.more(r) : true };
        row.checks = checks; row.ok = Object.values(checks).every(Boolean);
      } catch (e) { row.ok = false; row.error = String(e && e.message || e).slice(0, 300); }
      console.log(JSON.stringify({ name: row.name, tries, ok: row.ok, verdict: row.verdict, verdictIfCounted: row.verdictIfCounted, reasons: row.reasons, noise: row.noise, checks: row.checks, error: row.error }));
      await bc.close(); if (srv.closeAllConnections) srv.closeAllConnections(); await new Promise((r) => srv.close(r));
      if (row.ok) break;
      }
    }
  } catch (e) { console.error(String(e && e.stack || e)); if (browser) await browser.close(); process.exit(2); }
  await browser.close();
  // noisy = cases that passed with a noise reason let through
  const sum = { cases: out.length, ok: out.filter((x) => x.ok).length, retried: out.filter((x) => x.tries > 1).map((x) => x.name + '×' + x.tries), noisy: out.filter((x) => x.noise && x.noise.length).map((x) => x.name + ':' + x.noise.join('+')), verdict: out.length && out.every((x) => x.ok) ? 'pass' : 'fail' };
  if (outFile) fs.writeFileSync(outFile, JSON.stringify({ summary: sum, cases: out }, null, 1));
  console.log(JSON.stringify(sum)); process.exit(sum.verdict === 'pass' ? 0 : 1);
})();
