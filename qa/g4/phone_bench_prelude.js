// G4.6 phone bench v4 — the load record. build_phone_bench.py puts this, after window.__benchBuild, as the FIRST script of the
// test copy, so it runs before any script of the game. It changes no request and no answer; it only keeps what the game itself
// received, so that phone_bench.js can check THAT and not a second read of the file (Codex T48: a server whose first answer is
// wrong and whose later answers are right passed v3 whenever the browser kept no copy of the first answer).
//   images   every <img>/Image whose src is set: the element itself is kept (the game often drops the raw image after drawing it
//            to a canvas) — the bench compares its pixels with a decode of the verified file on the same device
//   fetch    every fetch of a file of the copy: a clone of the answer the game got — the bench hashes those very bytes
//   scripts  every <script> whose src is a file of the copy gets integrity="sha256-…" from the build, so the BROWSER refuses to run
//            a char2.js that is not the build's; whether it ran or was refused is kept (the game then falls back, and the bench
//            reports the file as not the build's — the run does not count)
// The bench's own reads use fetch0, the original fetch, and are not recorded.
(function () {
  'use strict';
  const B = window.__benchBuild, L = window.__benchLoads = { img: [], fetch: [], script: [], fetch0: window.fetch.bind(window) };
  const base = new URL('.', document.baseURI).href;
  // the path of a file of the copy, or null for anything else (data:, blob:, another origin)
  L.rel = (u) => { try { const a = new URL(u, document.baseURI).href; return a.startsWith(base) ? decodeURIComponent(a.slice(base.length).split(/[?#]/)[0]) : null; } catch (e) { return null; } };
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { L.img.push(this); d.set.call(this, v); } });
  window.fetch = function (input, init) {
    const p = L.fetch0.apply(null, arguments); let rec = null;
    try { const r = L.rel(typeof input === 'string' ? input : input && input.url);
      if (r !== null) { rec = { rel: r, method: String((init && init.method) || (input && input.method) || 'GET').toUpperCase(), status: 0, body: null }; L.fetch.push(rec); } } catch (e) {}
    return rec ? p.then((res) => { rec.status = res.status;
      if (rec.method === 'GET' && res.ok) { try { rec.body = res.clone().arrayBuffer(); rec.body.catch(() => {}); } catch (e) { rec.body = Promise.reject(e); rec.body.catch(() => {}); } }
      return res; }) : p;
  };
  const sd = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  const b64 = (hex) => btoa(hex.match(/../g).map((h) => String.fromCharCode(parseInt(h, 16))).join(''));
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, enumerable: sd.enumerable, get: sd.get,
    set(v) { const r = L.rel(v), m = r !== null && B && B.meta && B.meta[r], rec = { el: this, rel: r, guarded: !!m, state: 'pending' }; L.script.push(rec);
      this.addEventListener('load', () => { rec.state = 'loaded'; }); this.addEventListener('error', () => { rec.state = 'error'; });   // refused by the browser, or not there
      if (m) this.integrity = 'sha256-' + b64(m[1]); sd.set.call(this, v); } });
})();
