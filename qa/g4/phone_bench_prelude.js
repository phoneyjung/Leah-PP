// G4.6 phone bench v6 — the load record. build_phone_bench.py puts this, after window.__benchBuild, as the FIRST script of the
// test copy, so it runs before any script of the game. It changes no request and no answer; it only keeps what the game itself
// received, so that phone_bench.js can check THAT and not a second read of the file (Codex T48: a server whose first answer is
// wrong and whose later answers are right passed v3 whenever the browser kept no copy of the first answer).
//   images   every <img>/Image whose src is set: the element itself is kept (the game often drops the raw image after drawing it
//            to a canvas) — the bench compares its pixels with a decode of the verified file on the same device
//   fetch    every fetch of a file of the copy: a clone of the answer the game got — the bench hashes those very bytes
//   scripts  every <script> whose src is a file of the copy gets integrity="sha256-…" from the build, so the BROWSER refuses to run
//            a char2.js that is not the build's; whether it ran or was refused is kept (the game then falls back, and the bench
//            reports the file as not the build's — the run does not count)
// v5: every load also gets its start and end time (L.time), so the bench can wait until the game has loaded everything before it
// measures and can see a load that falls inside a measured window; a GET keeps its status whatever it is (a bare 304 with no
// body reaches the game as a failure — Codex T49-N1); an image load keeps how it ended (load or error) and which element it was.
// v6: a fetch ends when its body has arrived, not when its headers have (Codex T50-N1).
// The bench's own reads use fetch0 and imgSrc0, the original fetch and the original src setter, and are not recorded.
(function () {
  'use strict';
  const B = window.__benchBuild, L = window.__benchLoads = { img: [], fetch: [], script: [], time: [], fetch0: window.fetch.bind(window) };
  const now = () => performance.now();
  const base = new URL('.', document.baseURI).href;
  // the path of a file of the copy, or null for anything else (data:, blob:, another origin)
  L.rel = (u) => { try { const a = new URL(u, document.baseURI).href; return a.startsWith(base) ? decodeURIComponent(a.slice(base.length).split(/[?#]/)[0]) : null; } catch (e) { return null; } };
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  L.imgSrc0 = d.set;
  Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, enumerable: d.enumerable, get: d.get,
    set(v) { L.img.push(this); const r = L.rel(v);
      if (r) { const el = this, rec = { kind: 'img', rel: r, el, t0: now(), t1: 0, end: '' },   // end: how this load ended — 'load' or 'error'
          fin = (ev) => { rec.t1 = now(); rec.end = ev.type; el.removeEventListener('load', fin); el.removeEventListener('error', fin); };
        L.time.push(rec); el.addEventListener('load', fin); el.addEventListener('error', fin); }
      d.set.call(this, v); } });
  window.fetch = function (input, init) {
    const p = L.fetch0.apply(null, arguments); let rec = null;
    try { const r = L.rel(typeof input === 'string' ? input : input && input.url);
      if (r !== null) { rec = { kind: 'fetch', rel: r, method: String((init && init.method) || (input && input.method) || 'GET').toUpperCase(), status: 0, ok: false, body: null, t0: now(), t1: 0 }; L.fetch.push(rec); L.time.push(rec); } } catch (e) {}
    // v6: th = the answer's headers are here (the game gets its Response now, as always); t1 = the load has ENDED — for a GET that
    // was answered well that is when the whole body has arrived (the copy made here is read to its end; the game reads its own),
    // for anything else it is th. v5 set t1 with the headers (Codex T50-N1).
    return rec ? p.then((res) => { rec.status = res.status; rec.ok = res.ok; rec.th = now();
      if (rec.method === 'GET' && res.ok) { let b; try { b = res.clone().arrayBuffer(); } catch (e) { b = Promise.reject(e); }
        rec.body = b; b.then(() => { rec.t1 = now(); }, () => { rec.t1 = now(); rec.bodyErr = true; }); }
      else rec.t1 = rec.th;
      return res; }, (err) => { rec.t1 = now(); throw err; }) : p;
  };
  const sd = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  const b64 = (hex) => btoa(hex.match(/../g).map((h) => String.fromCharCode(parseInt(h, 16))).join(''));
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, enumerable: sd.enumerable, get: sd.get,
    set(v) { const r = L.rel(v), m = r !== null && B && B.meta && B.meta[r], rec = { kind: 'script', el: this, rel: r, guarded: !!m, state: 'pending', t0: now(), t1: 0 }; L.script.push(rec); if (r) L.time.push(rec);
      this.addEventListener('load', () => { rec.state = 'loaded'; rec.t1 = now(); }); this.addEventListener('error', () => { rec.state = 'error'; rec.t1 = now(); });   // refused by the browser, or not there
      if (m) this.integrity = 'sha256-' + b64(m[1]); sd.set.call(this, v); } });
})();
