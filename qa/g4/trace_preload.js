// G4 runner trace (suites_pair.sh v3.3, after Codex T39 on test_227: "keep the requests that did not finish / failed, page errors, loader state and timing").
// Loaded with NODE_OPTIONS=--require by the runner, the same way on main and on the branch. It only LISTENS (no interception, no evaluate, no extra
// CDP command), so a suite runs as before. When the suite exits non-zero (or is stopped by `timeout`), TRACE_FILE gets one JSON:
//   code · ms · per page: when it opened/closed, the last navigations and load events, requests finished, requests still open (url end + ms since start),
//   failed requests (+ error text), page errors.  The loader itself is not read (that would need evaluate); an open image request = loader still up.
// No TRACE_FILE → does nothing.  Exit code of the suite is kept (timeout's SIGTERM → exit 124, the code `timeout` reports anyway).
'use strict';
const F = process.env.TRACE_FILE;
if (F) {
  const fs = require('fs'), Module = require('module'), T0 = Date.now(), pages = [];
  const now = () => Date.now() - T0, end = (u) => String(u).slice(-90);
  const hook = (b) => {
    const att = async (t) => {
      if (t.type() !== 'page') return; let p = null; try { p = await t.page(); } catch (e) { return; } if (!p) return;
      const P = { i: pages.length, open: now(), closed: null, nav: [], done: 0, pend: new Map(), failed: [], pe: [] }; pages.push(P);
      p.on('request', (r) => P.pend.set(r, { u: end(r.url()), t: now() }));
      p.on('requestfinished', (r) => { P.pend.delete(r); P.done++; });
      p.on('requestfailed', (r) => { P.pend.delete(r); P.failed.push({ u: end(r.url()), t: now(), e: (r.failure() || {}).errorText || '' }); });
      p.on('pageerror', (e) => P.pe.push({ t: now(), m: String((e && e.message) || e).slice(0, 160) }));
      p.on('framenavigated', (f) => { if (f === p.mainFrame()) P.nav.push({ t: now(), u: end(f.url()) }); });
      p.on('domcontentloaded', () => P.nav.push({ t: now(), dom: 1 }));
      p.on('load', () => P.nav.push({ t: now(), load: 1 }));
      p.on('close', () => { P.closed = now(); });
    };
    try { b.on('targetcreated', att); } catch (e) {}
    return b;
  };
  let wrapped = null; const load0 = Module._load;
  Module._load = function (req) {
    const real = load0.apply(this, arguments);
    if (req !== 'puppeteer') return real;
    if (!wrapped) { wrapped = Object.assign({}, real); wrapped.launch = async (...a) => hook(await real.launch(...a)); wrapped.connect = async (...a) => hook(await real.connect(...a)); }
    return wrapped;
  };
  const write = (code) => {
    try {
      fs.writeFileSync(F, JSON.stringify({ code, ms: now(), pages: pages.map((P) => ({ i: P.i, open: P.open, closed: P.closed, nav: P.nav.slice(-8), done: P.done,
        pend: [...P.pend.values()].slice(0, 20), nPend: P.pend.size, failed: P.failed.slice(-10), pe: P.pe.slice(-10) })) }));
    } catch (e) {}
  };
  process.on('exit', (code) => { if (code) write(code); });
  process.on('SIGTERM', () => { process.exit(124); });
}
