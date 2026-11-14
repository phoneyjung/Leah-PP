// G4.6 (plan G4_0 §9 G4.6 · D-G4-7 "ค"): smoothness of character v2 on the owner's REAL phone, once, before "รับ G4". Version 4.
// Added only to the private test copy of the game (built by qa/g4/build_phone_bench.py); the game in the repo never loads it.
// One button: a synthetic save of its own (this copy has its own storage — no real save is read or written, nothing goes online),
// then 3 fixed scenes of M6 (qa/g4/m6-scenes.json: town · farm · dark cave mouth with the lantern), the kid walking back and forth
// on the game's own path. In each scene 3 pairs, the flag switched in the same page (new character ON / OFF = the old drawing),
// order alternating (on-off · off-on · on-off): settle 1.5 s, count frames 5 s. Pins as M6: LITE off, eco off, fpsChecks 6.
// Per scene: ratio = the median of the 3 paired ratios ON ÷ OFF.
//
// Three results (v2 — v1 said "ผ่าน" on a computer, with game files missing, and with a stalled measurement):
//   ผ่าน     every scene ≥ 90 % AND everything below holds
//   ไม่ผ่าน   the measurement counts, but a scene is < 90 % or the game itself did the wrong thing (a check of a scene failed)
//   ไม่นับ    the measurement cannot be used as evidence: measure again (or send the line back). Reasons:
//     mode         a short / test run (?short · window.__benchTest): never counts
//     device       not a phone (UA not mobile, no coarse pointer, or no touch)
//     build        the copy is not the game version it was built from, or it carries no file list
//     files        a game file asked for by the page is not in the copy, or did not load (HTTP ≥ 400 / network), or is not the
//                  file of the build — HTTP 200 alone proves nothing, and neither does reading the file a second time (v3 did
//                  that; a server whose FIRST answer is wrong passed, Codex T48). v4 checks what the game itself holds, kept by
//                  the load record that runs before the game (phone_bench_prelude.js):
//                    · every file asked for is read once more and its SHA-256 must be the build's — this is only the reference
//                    · every image the game loaded: the very element is compared, pixel by pixel, with a decode of that
//                      reference on this device (same size, every pixel equal)
//                    · every fetch the game made: the bytes the game got are hashed — they must be the build's
//                    · char2.js runs under integrity="sha256-…" — the browser itself refuses any other bytes, and a refused
//                      script makes the run not count
//                    · the size the page received (resource log) must be the build's; an image of the game's first table that
//                      failed (MISSING) counts as failed
//                  or the resource log / the load record / the files cannot be read · no request and no answer is changed
//                  Not covered (said plainly): pictures the page shows through CSS (frames of the HUD, backgrounds of screens
//                  that are hidden while measuring) and the bytes the game's hunting-map worker reads again — for those only the
//                  size and the reference hash; none is drawn on the game canvas in the three scenes
//     interrupted  a run had a frame gap > 300 ms, the page was hidden, or fewer than 10 frames per second
//     unstable     the 3 paired ratios of a scene differ by more than 0.15, or the scene's ratio is above 1.10
// Checks per run (so a frozen or empty screen cannot pass): the right map, the kid walked, and — v3 — what was really DRAWN, counted
// at the draw itself (v2 passed with the lantern not drawn and with the old character not drawn at all, Codex T47-N1 N2):
// while measuring, the bench wraps the game's drawPlayer and the drawImage of the game's main canvas context and, for every player
// draw, counts the drawImage commands issued inside it. The same wrappers are on in ON and OFF runs.
//   ON  = state ready on every sample · the new character drawn (C234.n.body moved AND ≥ 1 draw command) on ≥ 80 % of frames ·
//         the old sheet never drawn
//   OFF = state off on every sample · the new character drawn 0 times · the OLD sheet (PS.walk / PS.stand) really blitted on
//         ≥ 80 % of frames
//   lantern, ON: read from the draw config the game handed to the renderer in that very draw (C234.feet.dc.held) and from the
//         commands: dark scene = held in every new-character draw, and in every draw where the lantern is visible (not a hidden
//         direction such as N — Char2.light says so — and not the half-transparent path) ≥ 2 commands (body + lantern); such
//         draws must be ≥ 50 % of the draws · lit scene = held in none
//   lantern, OFF: the old drawing uses the game's own condition (dark map and a little kid) directly; the bench reads that
//         condition only as the state of the scene, not as proof of a drawing
//   the scene, both ways (medians of the 3 runs): draw commands per frame on the main canvas, ON ≥ 80 % of OFF (as M6's fps.js) ·
//         the player's shadow on the same share of frames (ON: the 14 × 3 ellipse commands of the new shadow, OFF: the old shadow
//         sheet blitted) · LITE off, eco off, fpsChecks 6 still so at the end of every run (the game may not change its own graphics mode)
// Report only (no gate): JS work per frame (ms inside the page's animation-frame callbacks) ON / OFF — it still shows the cost when
// both frame rates sit at the screen's refresh rate. It does not include the GPU's work.
// Result: a table on screen and one line to copy and send back. Takes about 2 minutes; the screen must not be touched.
(function () {
  'use strict';
  const SCENES = [
    { id: 'S1', name: 'เมือง', map: 'capital', go: [5, 0], dark: false },
    { id: 'S2', name: 'ฟาร์ม', map: 'farm', go: [0, 4], dark: false },
    { id: 'S3', name: 'ปากถ้ำ (มืด · ถือตะเกียง)', map: 'cavemouth', go: [4, 0], dark: true },
  ];
  const BUILD = window.__benchBuild || null, LOADS = window.__benchLoads || null, TEST = window.__benchTest || null;
  const SHORT = !!TEST || new URLSearchParams(location.search).has('short');
  const SETTLE = TEST ? TEST.settle : SHORT ? 400 : 1500, MEAS = TEST ? TEST.meas : SHORT ? 1200 : 5000;
  const PAIRS = 3, GATE = 0.90, GAP_MS = 300, MIN_FPS = 10, SPREAD = 0.15, RATIO_MAX = 1.10;
  try { performance.setResourceTimingBufferSize(4000); } catch (e) {}
  const RES0 = (() => { try { return performance.getEntriesByType('resource').length; } catch (e) { return -1; } })();
  // JS work per frame: time inside every animation-frame callback of the page (the game's loop asks for its next frame by the
  // global name, so it runs through this from its next frame on). The bench's own counter uses the original function.
  const raf0 = window.requestAnimationFrame.bind(window), JS = { t: 0 };
  window.requestAnimationFrame = (f) => raf0((t) => { const a = performance.now(); try { return f(t); } finally { JS.t += performance.now() - a; } });
  // What is really drawn (v3). EV counts per player draw; measure() takes the difference over a run.
  const EV = { calls: 0, cmd: 0, newD: 0, oldD: 0, heldCfg: 0, vis: 0, heldCmd: 0, all: 0, oldSh: 0, newSh: 0 };
  let hooked = null;
  function hook() {
    if (hooked) return;   // once: a wrapper put around drawPlayer later stays outside this one, and is seen as draws that never arrive here
    const draw0 = Object.getPrototypeOf(ctx).drawImage; let inP = 0, n = 0, old = false, thin = false;
    ctx.drawImage = function (img) { EV.all++; if (inP) { if (!n) thin = this.globalAlpha < 1; n++; if (img === PS.walk || img === PS.stand) old = true; } else if (img === PS.shS || img === PS.shW) EV.oldSh++;
      return draw0.apply(this, arguments); };
    const ell0 = Object.getPrototypeOf(ctx).ellipse;   // the new character's shadow is the only 14 × 3 ellipse (c234Shadow, W3): the command itself is counted
    ctx.ellipse = function (x, y, rx, ry) { if (rx === 14 && ry === 3) EV.newSh++; return ell0.apply(this, arguments); };
    const dp = drawPlayer;
    drawPlayer = function () { const b0 = C234.n.body; inP++; n = 0; old = false; thin = false;
      try { return dp.apply(this, arguments); } finally { inP--;
        EV.calls++; if (n) EV.cmd++; if (old) EV.oldD++;
        if (C234.n.body > b0) { const f = C234.feet, held = !!(f && f.dc && f.dc.held), L = f && f.L; if (n) EV.newD++;
          if (held) { EV.heldCfg++; if (L && !L.hidden && !thin) { EV.vis++; if (n >= 2) EV.heldCmd++; } } } } };
    hooked = ctx;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  const el = (tag, css, html) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let box, pill, lock = null;
  const FONT = 'font:16px/1.45 system-ui,-apple-system,"Noto Sans Thai",sans-serif';
  const show = (e, on, how) => { e.style.display = on ? how : 'none'; };   // not the hidden attribute: the page may be opened without the host's reset
  function panel(html) {
    if (!box) { box = el('div', 'position:fixed;inset:0;z-index:2147483000;align-items:center;justify-content:center;background:#0b0816cc;padding:max(16px,env(safe-area-inset-left,0px));' + FONT + ';color:#f4ecd8');
      document.body.appendChild(box); }
    box.innerHTML = '<div style="max-width:620px;width:100%;max-height:92vh;overflow:auto;background:#1d1530;border:2px solid #c9a24a;border-radius:14px;padding:16px 18px;box-shadow:0 8px 30px #0008">' + html + '</div>';
    show(box, true, 'flex'); return box;
  }
  function btn(label, fn, main) {
    const b = el('button', 'min-height:48px;min-width:120px;margin:6px 8px 0 0;padding:8px 18px;border-radius:10px;border:2px solid #c9a24a;' + FONT + ';font-weight:700;cursor:pointer;' +
      (main ? 'background:#c9a24a;color:#1d1530' : 'background:#2b2142;color:#f4ecd8'), label); b.onclick = fn; return b;
  }
  function showPill(t) { if (!pill) { pill = el('div', 'position:fixed;top:calc(6px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:2147483000;pointer-events:none;background:#1d1530e6;border:1px solid #c9a24a;border-radius:20px;padding:4px 14px;' + FONT + ';font-size:14px;color:#f4ecd8'); document.body.appendChild(pill); }
    pill.textContent = t; show(pill, true, 'block'); }
  function device() {
    const ua = navigator.userAgent, uad = navigator.userAgentData;
    const mobileUA = (uad && typeof uad.mobile === 'boolean') ? uad.mobile : /Android|iPhone|iPod|Mobile/.test(ua);
    let coarse = false; try { coarse = matchMedia('(pointer:coarse)').matches; } catch (e) {}
    const touch = (navigator.maxTouchPoints || 0) > 0;
    return { phone: !!(mobileUA && coarse && touch), mobileUA: !!mobileUA, coarse, touch,
      screen: Math.round(screen.width) + '×' + Math.round(screen.height) + ' @' + (Math.round(devicePixelRatio * 100) / 100),
      ua: (ua.match(/Android[^;)]*|iPhone OS [\d_]+|iPad|Chrome\/[\d.]+|Version\/[\d.]+ Mobile/g) || []).join(' ') };
  }
  // Every file the page asked for from its own folder must be in the copy and must have loaded. Read from the browser's resource log.
  function files() {
    const out = { ok: false, asked: 0, missing: [], failed: [], wrong: [], why: '', seen: [] };
    if (!BUILD || !Array.isArray(BUILD.files) || !BUILD.meta) { out.why = 'no file list'; return out; }
    let ents; try { ents = performance.getEntriesByType('resource'); } catch (e) { out.why = 'no resource log'; return out; }
    if (RES0 < 0 || RES0 >= 250) { out.why = 'resource log was full before the bench started'; return out; }
    const base = new URL('.', document.baseURI).href, have = new Set(BUILD.files), absent = new Set(BUILD.absent || []), seen = new Set();
    let real = 0;   // entries whose HTTP status the browser shows (a host that serves the files from another origin shows 0 for all)
    for (const e of ents) {
      if (!e.name.startsWith(base)) continue;
      const rel = decodeURIComponent(e.name.slice(base.length).split(/[?#]/)[0]); if (!rel || rel === 'favicon.ico') continue;
      if (e.responseStatus > 0) real++;
      if (absent.has(rel)) continue;
      if (!seen.has(rel)) { seen.add(rel); if (!have.has(rel)) out.missing.push(rel); }
      const bad = typeof e.responseStatus !== 'number' ? false : e.responseStatus >= 400 || (e.responseStatus === 0 && !e.decodedBodySize && !e.transferSize);
      if (bad && have.has(rel) && !out.failed.includes(rel)) out.failed.push(rel);
      // the size of what the page itself received for this request (a HEAD answer has no body: skipped)
      const m = BUILD.meta[rel]; if (m && !bad && e.decodedBodySize > 0 && e.decodedBodySize !== m[0] && !out.wrong.includes(rel)) out.wrong.push(rel);
    }
    out.asked = seen.size; out.seen = [...seen].filter((x) => have.has(x)); out.base = base;
    try { if (typeof MISSING === 'object' && MISSING.size) for (const k of MISSING) out.failed.push('image:' + k); } catch (e) {}
    if (!seen.size) out.why = 'the resource log is empty';
    else if (!real) out.why = 'the browser does not show the status of the files here';
    out.ok = !out.why && !out.missing.length && !out.failed.length && !out.wrong.length; return out;
  }
  // v4. The reference: every file asked for is read once more (the bench's own fetch) and must be the build's by SHA-256.
  // Then what the GAME holds is checked against it: its fetched bytes by hash, its images pixel by pixel.
  async function verify(fl) {
    if (fl.why) return fl;
    if (!(window.crypto && crypto.subtle)) { fl.why = 'no SHA-256 in this browser'; fl.ok = false; return fl; }
    if (!LOADS || !LOADS.fetch0 || !Array.isArray(LOADS.img)) { fl.why = 'no load record'; fl.ok = false; return fl; }
    const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
    const sha = async (buf) => hex(await crypto.subtle.digest('SHA-256', buf));
    const have = new Set(BUILD.files), absent = new Set(BUILD.absent || []), bad = (rel) => { if (!fl.wrong.includes(rel)) fl.wrong.push(rel); };
    const imgs = [...new Set(LOADS.img.concat([...document.images]))], gets = LOADS.fetch.slice(), t0 = performance.now();   // taken before the bench loads anything itself
    const ref = {}; let i = 0, hashed = 0, unread = 0;
    const one = async () => { while (i < fl.seen.length) { const rel = fl.seen[i++], m = BUILD.meta[rel]; if (fl.failed.includes(rel)) continue;
      try { const r = await LOADS.fetch0(fl.base + rel, { cache: 'force-cache' }); if (!r.ok) { unread++; continue; }
        const buf = await r.arrayBuffer(); hashed++; if (buf.byteLength !== m[0] || await sha(buf) !== m[1]) bad(rel); else ref[rel] = buf; }
      catch (e) { unread++; } } };
    await Promise.all([one(), one(), one(), one()]);
    fl.hashed = hashed; if (unread) fl.why = 'cannot read ' + unread + ' files back';
    // the game's own fetches: the bytes it got
    let teed = 0;
    for (const g of gets) { if (absent.has(g.rel) || !g.rel) continue;
      if (!have.has(g.rel)) { if (!fl.missing.includes(g.rel)) fl.missing.push(g.rel); continue; }
      if (g.status >= 400 || !g.status) { if (!fl.failed.includes(g.rel)) fl.failed.push(g.rel); continue; }
      if (!g.body) continue;   // a HEAD
      try { const buf = await g.body, m = BUILD.meta[g.rel]; teed++; if (buf.byteLength !== m[0] || await sha(buf) !== m[1]) bad(g.rel); } catch (e) { fl.why = fl.why || 'cannot read what a fetch of the game received'; } }
    fl.fetches = teed;
    // the game's own images: the elements themselves against a decode of the reference
    const T = 1024, mk = () => { const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d', { willReadFrequently: true }); g.globalCompositeOperation = 'copy'; g.imageSmoothingEnabled = false; return g; };
    const ga = mk(), gb = mk(), setSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
    const same = (a, b) => { const w = a.naturalWidth, h = a.naturalHeight; if (!w || w !== b.naturalWidth || h !== b.naturalHeight) return false;
      for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) { const tw = Math.min(T, w - x), th = Math.min(T, h - y);
        ga.clearRect(0, 0, T, T); gb.clearRect(0, 0, T, T); ga.drawImage(a, x, y, tw, th, 0, 0, tw, th); gb.drawImage(b, x, y, tw, th, 0, 0, tw, th);
        const da = new Uint32Array(ga.getImageData(0, 0, tw, th).data.buffer), db = new Uint32Array(gb.getImageData(0, 0, tw, th).data.buffer);
        for (let k = 0; k < da.length; k++) if (da[k] !== db[k]) return false; }
      return true; };
    let seenImg = 0, eq = 0;   // one image at a time, nothing decoded is kept: a phone has little memory
    for (const el of imgs) { const rel = LOADS.rel(el.currentSrc || el.src); if (!rel || absent.has(rel)) continue;   // data:, blob:, another origin: not a file of the copy
      seenImg++;
      if (!have.has(rel)) { if (!fl.missing.includes(rel)) fl.missing.push(rel); continue; }
      if (!el.complete) { try { await Promise.race([el.decode(), sleep(4000)]); } catch (e) {} }
      if (!el.complete || !el.naturalWidth) { if (!fl.failed.includes(rel)) fl.failed.push(rel); continue; }
      if (!ref[rel]) continue;   // the reference itself is wrong or unread: already counted
      const im = new Image(), u = URL.createObjectURL(new Blob([ref[rel]]));
      try { setSrc.call(im, u); await im.decode(); if (same(el, im)) eq++; else bad(rel); } catch (e) { bad(rel); }
      URL.revokeObjectURL(u); }
    fl.images = seenImg; fl.imagesEqual = eq;
    // the game's own scripts: run only under the build's integrity; one the browser refused (or that never loaded) is not the build's file
    fl.scripts = LOADS.script.filter((x) => x.rel && !absent.has(x.rel)).map((x) => ({ rel: x.rel, guarded: x.guarded && !!x.el.integrity, state: x.state }));
    for (const x of fl.scripts) { if (!have.has(x.rel)) { if (!fl.missing.includes(x.rel)) fl.missing.push(x.rel); } else if (!x.guarded || x.state !== 'loaded') bad(x.rel); }
    fl.ms = Math.round(performance.now() - t0);
    fl.ok = !fl.why && !fl.missing.length && !fl.failed.length && !fl.wrong.length; return fl;
  }
  function start() {
    const b = panel('<h2 style="margin:0 0 8px;font-size:20px">วัดความลื่นตัวละครรุ่น 2 (G4.6)</h2>' +
      '<p style="margin:0 0 6px">หน้านี้เป็น<b>สำเนาทดสอบ</b>ของเกม ' + esc(typeof VERSION === 'string' ? VERSION.replace('Lantern Academy ', '') : '?') + ' · ใช้เซฟทดลองของมันเอง ไม่แตะเซฟของลีอา ไม่ต่อออนไลน์</p>' +
      '<p style="margin:0 0 6px">กดเริ่มแล้ว <b>วางมือถือแนวนอนนิ่ง ๆ ไม่ต้องแตะจอ ไม่สลับแอป</b> ประมาณ <b>2 นาที</b> · ตัวละครจะเดินเองใน 3 ฉาก สลับเปิด-ปิดตัวใหม่ 6 ครั้งต่อฉาก · ตอนจบหน้าจะตรวจไฟล์และภาพของเกมอีกไม่เกินครึ่งนาที</p>' +
      '<p style="margin:0 0 10px;color:#d8c8a0">ผ่านเมื่อเปิดตัวใหม่แล้วยังลื่นอย่างน้อย 90 % ของตอนปิด ทุกฉาก' + (SHORT ? ' · <b>รอบสั้นสำหรับทดสอบ ไม่นับเป็นผล</b>' : '') + '</p>');
    const row = el('div'); row.appendChild(btn('เริ่มวัด', run, true)); b.firstChild.appendChild(row);
  }
  async function setFlag(on) {
    S.char2On = on; try { c234Sync(); } catch (e) {}
    if (on) { const t0 = performance.now(); while (C234.st !== 'ready' && C234.st !== 'failed' && performance.now() - t0 < 20000) await sleep(100); }
    return C234.st;
  }
  function pin() { try { LITE = false; fpsChecks = 6; S.eco = false; } catch (e) {} }
  function measure(ms) {
    return new Promise((r) => { let n = 0, gap = 0, lastT = 0, hid = document.hidden; const b0 = C234.n.body, w0 = window.__bw, j0 = JS.t, e0 = Object.assign({}, EV), g0 = [C234.n.shadow || 0, C234.n.hole || 0], t0 = performance.now(), held0 = [], sts = [];
      const onv = () => { if (document.hidden) hid = true; }; document.addEventListener('visibilitychange', onv);
      const f = () => { const now = performance.now(); if (lastT) gap = Math.max(gap, now - lastT); lastT = now; n++;
        if (n % 10 === 0) { held0.push(!!(DARK() && LKID())); if (!sts.includes(C234.st)) sts.push(C234.st); }
        if (now - t0 < ms) raf0(f);
        else { document.removeEventListener('visibilitychange', onv); const dt = (now - t0) / 1000; if (!sts.includes(C234.st)) sts.push(C234.st);
          const ev = {}; for (const k in EV) ev[k] = EV[k] - e0[k];
          ev.shadow = (C234.n.shadow || 0) - g0[0]; ev.hole = (C234.n.hole || 0) - g0[1];   // the game's own counters at the new shadow and at the lantern's light hole
          let pins = false; try { pins = LITE === false && !S.eco && fpsChecks === 6; } catch (e) {}
          r({ fps: n / dt, frames: n, gap: Math.round(gap), hidden: hid, js: (JS.t - j0) / n, body: C234.n.body - b0, ev, pins, walked: Math.round(window.__bw - w0), map: M && M.id, st: C234.st, sts,
            held: held0.length ? held0.every(Boolean) : !!(DARK() && LKID()), heldAny: held0.some(Boolean) }); } };
      raf0(f); });
  }
  async function run() {
    show(box, false); try { lock = await navigator.wakeLock.request('screen'); } catch (e) {}
    const runs = [];
    try {
      const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'ทดสอบ', kid: 0, house: 1, age: 7 }), { gender194: 'f', hc: 3, char2On: false })]; d.cur = 0; Store.put(d);
      S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
      document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
      hook();
      for (let si = 0; si < SCENES.length; si++) {
        const sc = SCENES[si]; showPill('ฉาก ' + (si + 1) + '/3 ' + sc.name + ' · เตรียม…');
        goMap(sc.map); P.path = P.act = null; DLG = null; try { closeModal(); } catch (e) {} pin();
        const a = [P.x, P.y], b = [P.x + sc.go[0] * T, P.y + sc.go[1] * T]; let k = 0, lx = P.x, ly = P.y; window.__bw = 0; clearInterval(window.__bwk);
        window.__bwk = setInterval(() => { if (!P.path || !P.path.length) { k ^= 1; const g = k ? b : a; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [[g[0], g[1]]]; }
          window.__bw += Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y; }, 100);
        for (let pi = 0; pi < PAIRS; pi++) for (const on of (pi % 2 ? [false, true] : [true, false])) {
          showPill('ฉาก ' + (si + 1) + '/3 ' + sc.name + ' · คู่ ' + (pi + 1) + '/3 · ตัวใหม่ ' + (on ? 'เปิด' : 'ปิด') + ' · อย่าแตะจอ');
          const st = await setFlag(on); pin(); DLG = null; await sleep(SETTLE); pin();
          const m = await measure(MEAS); m.scene = sc.id; m.on = on; m.pair = pi; m.stSet = st; runs.push(m);
        }
        clearInterval(window.__bwk);
      }
    } catch (e) { runs.err = String(e && e.message || e).slice(0, 200); }
    showPill('กำลังตรวจไฟล์และภาพของเกม… อีกสักครู่ อย่าเพิ่งปิดหน้า'); let fl = files();
    try { fl = await verify(fl); } catch (e) { fl.why = fl.why || 'the check of the files stopped: ' + String(e && e.message || e).slice(0, 80); fl.ok = false; }
    try { if (lock) lock.release(); } catch (e) {}
    if (pill) show(pill, false); report(runs, fl);
  }
  function report(runs, fl) {
    const only = (r, s) => r.sts.length === 1 && r.sts[0] === s;
    const rows = SCENES.map((sc) => {
      const rs = runs.filter((r) => r.scene === sc.id), on = rs.filter((r) => r.on), off = rs.filter((r) => !r.on);
      const pairs = [0, 1, 2].map((i) => { const a = on.find((r) => r.pair === i), b = off.find((r) => r.pair === i); return a && b && b.fps > 0 ? a.fps / b.fps : null; }).filter((x) => x !== null);
      const scene = (r) => r.held === sc.dark && (sc.dark || !r.heldAny);                              // the game's own condition: dark map and a little kid
      const drewNew = (r) => r.body >= 0.8 * r.frames && r.ev.newD >= 0.8 * r.frames && r.ev.oldD === 0;   // ON: the new character really drawn, the old sheet never
      const drewOld = (r) => r.body === 0 && r.ev.newD === 0 && r.ev.oldD >= 0.8 * r.frames;             // OFF: the old sheet really blitted
      const lamp = (r) => sc.dark ? r.ev.heldCfg === r.ev.newD && r.ev.newD > 0 && r.ev.vis >= 0.5 * r.ev.newD && r.ev.heldCmd === r.ev.vis : r.ev.heldCfg === 0;   // ON: what the renderer was given and what it drew
      // the scene around the player, both ways (medians of the 3 runs): draw commands per frame on the main canvas (as M6's fps.js:
      // ON ≥ 80 % of OFF) · the player's shadow (ON: the new shadow's ellipse commands · OFF: the old shadow sheet blitted)
      const per = (a, f) => a.length ? med(a.map((r) => f(r) / r.frames)) : 0;
      const drawsOn = per(on, (r) => r.ev.all), drawsOff = per(off, (r) => r.ev.all), shOn = per(on, (r) => r.ev.newSh), shOff = per(off, (r) => r.ev.oldSh);
      const full = drawsOn >= 0.8 * drawsOff && drawsOff > 0, shade = Math.abs(shOn - shOff) <= 0.2, pinned = rs.every((r) => r.pins);
      const ok = rs.length === 6 && pinned && rs.every((r) => r.map === sc.map && r.walked > 20 && scene(r)) &&
        on.every((r) => only(r, 'ready') && drewNew(r) && lamp(r)) && off.every((r) => only(r, 'off') && drewOld(r)) && full && shade;
      const ratio = pairs.length === 3 ? med(pairs) : null;
      const cut = rs.some((r) => r.gap > GAP_MS || r.hidden || r.fps < MIN_FPS);
      const shaky = pairs.length === 3 && (Math.max(...pairs) - Math.min(...pairs) > SPREAD || ratio > RATIO_MAX);
      return { sc, ratio, pairs, ok, cut, shaky, fpsOn: on.length ? med(on.map((r) => r.fps)) : 0, fpsOff: off.length ? med(off.map((r) => r.fps)) : 0,
        jsOn: on.length ? med(on.map((r) => r.js)) : 0, jsOff: off.length ? med(off.map((r) => r.js)) : 0,
        draws: [drawsOn, drawsOff], shadow: [shOn, shOff],
        why: !rs.length ? 'ไม่ได้วัด' : rs.length !== 6 ? 'วัดไม่ครบ' : !pinned ? 'เกมเปลี่ยนโหมดกราฟิกเอง' : rs.some((r) => r.map !== sc.map) ? 'แผนที่ผิด' : rs.some((r) => r.walked <= 20) ? 'ตัวไม่เดิน' : on.some((r) => !only(r, 'ready')) ? 'ตัวใหม่ไม่พร้อม' :
          on.some((r) => !drewNew(r)) ? 'ตัวใหม่วาดไม่ครบ' : off.some((r) => r.body || r.ev.newD || !only(r, 'off')) ? 'ปิดแล้วยังวาดตัวใหม่' : off.some((r) => !drewOld(r)) ? 'ตัวเดิมไม่ถูกวาด' :
          rs.some((r) => !scene(r)) ? 'ตะเกียงไม่ตรง' : on.some((r) => !lamp(r)) ? (sc.dark ? 'ตะเกียงไม่ถูกวาด' : 'วาดตะเกียงในที่สว่าง') : !shade ? 'เงาไม่ตรง' : !full ? 'ฉากวาดไม่ครบตอนเปิด' : '' };
    });
    const dev = device(), ver = typeof VERSION === 'string' ? VERSION : '?';
    const reasons = [];   // why the measurement does not count
    if (SHORT) reasons.push('mode');
    if (!dev.phone) reasons.push('device');
    if (!BUILD || BUILD.version !== ver) reasons.push('build');
    if (!fl.ok) reasons.push('files');
    if (rows.some((r) => r.cut)) reasons.push('interrupted');
    if (rows.some((r) => r.shaky)) reasons.push('unstable');
    const good = !runs.err && rows.every((r) => r.ok && r.ratio !== null && r.ratio >= GATE);
    const counted = reasons.filter((x) => x !== 'mode');   // what the verdict would be in a full-length run (the self-test reads this)
    const verdictIfCounted = counted.length ? 'void' : good ? 'pass' : 'fail', verdict = reasons.length ? 'void' : good ? 'pass' : 'fail';
    const WORD = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', void: 'ไม่นับ' };
    const SAY = { mode: 'รอบสั้นสำหรับทดสอบ', device: 'เครื่องนี้ไม่ใช่มือถือ', build: 'สำเนาไม่ตรงรุ่นเกม',
      files: fl.why ? 'ตรวจไฟล์เกมไม่ได้' : 'ไฟล์เกมไม่ครบหรือไม่ตรง ' + (fl.missing.length + fl.failed.length + fl.wrong.length) + ' ไฟล์', interrupted: 'ระหว่างวัดมีการสะดุดหรือสลับแอป', unstable: 'ผลแต่ละรอบต่างกันมากเกินไป' };
    const pct = (x) => (x === null ? '–' : Math.round(x * 100) + ' %');
    const lost = fl.missing.concat(fl.failed), wrong = fl.wrong;
    const line = 'G4.6 วัดความลื่น v4 · เกม ' + ver.replace('Lantern Academy ', '') + ' · ' +
      rows.map((r) => r.sc.name.split(' ')[0] + ' ' + pct(r.ratio)).join(' · ') + ' → ' + WORD[verdict] + (reasons.length ? ' (' + reasons.map((x) => SAY[x]).join(' · ') + ')' : ' (เกณฑ์ ≥ 90 %)') +
      ' · fps เปิด/ปิด ' + rows.map((r) => r.fpsOn.toFixed(1) + '/' + r.fpsOff.toFixed(1)).join(' · ') +
      ' · งาน JS ms/เฟรม เปิด/ปิด ' + rows.map((r) => r.jsOn.toFixed(2) + '/' + r.jsOff.toFixed(2)).join(' · ') +
      ' · ตรวจ ' + rows.map((r) => (r.ok ? '✓' : '✗' + r.why)).join(' ') +
      ' · ไฟล์ ' + fl.asked + ' ขาด ' + lost.length + (lost.length ? ' [' + lost.slice(0, 8).join(' ') + (lost.length > 8 ? ' …' : '') + ']' : '') +
      ' ผิด ' + wrong.length + (wrong.length ? ' [' + wrong.slice(0, 8).join(' ') + (wrong.length > 8 ? ' …' : '') + ']' : '') + (fl.why ? ' [' + fl.why + ']' : '') +
      ' · ภาพที่เกมถือ ' + (fl.images || 0) + ' ตรง ' + (fl.imagesEqual || 0) + ' · fetch ' + (fl.fetches || 0) +
      ' · ' + (dev.phone ? 'มือถือ' : 'ไม่ใช่มือถือ') + ' ' + dev.screen + ' · ' + dev.ua + (runs.err ? ' · error ' + runs.err : '');
    window.__benchResult = { v: 4, verdict, verdictIfCounted, pass: verdict === 'pass', reasons, device: dev, files: fl, build: BUILD && { version: BUILD.version, files: BUILD.files.length },
      rows: rows.map((r) => ({ id: r.sc.id, ratio: r.ratio, pairs: r.pairs, ok: r.ok, why: r.why, cut: r.cut, shaky: r.shaky, fpsOn: r.fpsOn, fpsOff: r.fpsOff, jsOn: r.jsOn, jsOff: r.jsOff, draws: r.draws, shadow: r.shadow })), runs, line };
    const td = 'padding:4px 8px', tr = rows.map((r) => '<tr><td style="' + td + '">' + r.sc.name + '</td><td style="' + td + ';text-align:right">' + r.fpsOn.toFixed(1) + '</td><td style="' + td + ';text-align:right">' + r.fpsOff.toFixed(1) +
      '</td><td style="' + td + ';text-align:right;font-weight:700">' + pct(r.ratio) + '</td><td style="' + td + ';text-align:right">' + r.jsOn.toFixed(2) + ' / ' + r.jsOff.toFixed(2) + '</td><td style="' + td + '">' + (r.ok ? '✓' : '✗ ' + r.why) + (r.cut ? ' · สะดุด' : '') + (r.shaky ? ' · แกว่ง' : '') + '</td></tr>').join('');
    const head = verdict === 'pass' ? '<span style="color:#8fd18f">ผ่าน</span>' : verdict === 'fail' ? '<span style="color:#ff9a8a">ไม่ผ่าน</span>' : '<span style="color:#f0c869">ไม่นับ · ต้องวัดใหม่</span>';
    const tell = reasons.length ? '<p style="margin:0 0 8px;color:#f0c869">' + reasons.map((x) => esc(SAY[x])).join(' · ') +
      (reasons.includes('interrupted') || reasons.includes('unstable') ? ' → กด "วัดอีกครั้ง" แล้ววางมือถือนิ่ง ๆ' : reasons.includes('device') ? ' → เปิดลิงก์นี้ในมือถือแล้ววัดใหม่' : ' → ส่งข้อความด้านล่างให้ Claude') + '</p>' : '';
    const b = panel('<h2 style="margin:0 0 8px;font-size:20px">ผล: ' + head + '</h2>' + tell +
      '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:15px"><tr style="color:#d8c8a0"><th style="text-align:left;' + td + '">ฉาก</th><th style="' + td + '">fps เปิด</th><th style="' + td + '">fps ปิด</th><th style="' + td + '">เปิด ÷ ปิด</th><th style="' + td + '">งาน JS ms เปิด / ปิด</th><th style="' + td + '">ตรวจ</th></tr>' + tr + '</table></div>' +
      '<p style="margin:8px 0 0;color:#d8c8a0;font-size:14px">ไฟล์เกมที่หน้าเรียก ' + fl.asked + ' ไฟล์ · ขาด ' + lost.length + ' · ไม่ตรง ' + wrong.length + ' · ภาพที่เกมถือ ' + (fl.images || 0) + ' ตรง ' + (fl.imagesEqual || 0) + ' · ' + (dev.phone ? 'มือถือ' : 'ไม่ใช่มือถือ') + ' ' + esc(dev.screen) + '</p>' +
      '<p style="margin:10px 0 4px">กด "คัดลอกผล" แล้วส่งข้อความนี้กลับมาให้ Claude:</p><textarea readonly style="width:100%;min-height:110px;box-sizing:border-box;background:#120d20;color:#f4ecd8;border:1px solid #6b5a8a;border-radius:8px;padding:8px;font-size:13px">' + esc(line) + '</textarea>');
    const row = el('div'), msg = el('span', 'margin-left:6px;color:#8fd18f');
    row.appendChild(btn('คัดลอกผล', () => { const ta = b.querySelector('textarea'); const done = () => { msg.textContent = 'คัดลอกแล้ว'; };
      try { navigator.clipboard.writeText(line).then(done, () => { ta.focus(); ta.select(); msg.textContent = 'เลือกข้อความแล้ว กดคัดลอกเอง'; }); } catch (e) { ta.focus(); ta.select(); } }, true));
    row.appendChild(btn('วัดอีกครั้ง', () => location.reload())); row.appendChild(msg); b.firstChild.appendChild(row);
  }
  const boot = () => { if (document.getElementById('load') || typeof Store !== 'object' || typeof C234 !== 'object') return setTimeout(boot, 300); start(); };
  boot();
})();
