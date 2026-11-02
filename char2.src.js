/* char2.js — Lantern Academy character renderer v2 (G3 · Claude · stages G3.2 pack · load · look · fallbacks + G3.3 cache · actor · tick · draw · anchor · light · sheet + G3.4 portrait · encode · decode)
   Plan: G3_0_RENDERER_PLAN.md v1.4 (owner approved 1 Nov 2569 22:32) · notes: G3_2_LOAD_LOOK.md
   One global, window.Char2. No game state, no save writes, no network beyond the pack files. Not loaded by index.html (G4). */
(function () {
  'use strict';
  // save-file orders of game 2.33 (HAIRC / EYEC / AD208.order) - used only to read OLD saves; the pack palettes carry the same names
  const HAIRC = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'silver', 'green'];
  const EYEC = ['brown', 'black', 'green', 'blue', 'amber'];
  const TONES = ['light', 'medium', 'tan', 'deep'];
  const BOYS194 = [3, 4, 5];                                           // game 2.33 G194.m
  const PD219_PARTS = ['hair', 'face', 'eyes', 'mouth', 'body'];
  const SLOT_NEED = ['hair', 'eyes', 'outfit'], SLOT_OPT = ['head', 'face_acc', 'back'];
  const GROUPS = ['hair', 'iris', 'skin', 'house'];

  let LOADING = null, GEN = 0;   // the one load promise (until release) · GEN = load generation: a load started before release() never commits (T22 R2)
  let ST = null;        // loaded state
  const ZERO = () => ({ hit: 0, miss: 0, evict: 0, refused: 0, rebuilt: 0, peak: 0 });
  let CNT = ZERO();

  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const isInt = (v) => Number.isInteger(v);
  const isPt = (p, lim) => Array.isArray(p) && p.length === 2 && p.every((v) => isInt(v) && v >= 0 && v < lim);
  const HEX = /^#[0-9A-F]{6}$/;

  // ---------- pack check: every field that is used later, with its range (any doubt -> not ready · T22 R3) ----------
  const NAME = /^[a-z][a-z0-9_]*$/, isName = (v) => typeof v === 'string' && NAME.test(v), isHex = (v) => typeof v === 'string' && HEX.test(v), own = (o, k) => isObj(o) && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const inR = (v, a, b) => isInt(v) && v >= a && v <= b, isStr = (v) => typeof v === 'string' && v.length > 0;
  const isSize = (z, w, h) => Array.isArray(z) && z.length === 2 && z[0] === w && z[1] === h;
  function packOk(p) {
    try {
      if (!isObj(p) || p.schema !== 'c2-pack/1' || !isStr(p.id) || !isInt(p.version) || !isStr(p.set) || !inR(p.cell, 8, 512)) return false;
      const C = p.cell, S = p.sheets, D = p.dirs;
      if (!isPt(p.feet, C) || !Array.isArray(D) || D.length !== 8 || !D.every(isStr) || new Set(D).size !== 8 || !isObj(S)) return false;
      for (const k of ['idle', 'walk', 'walkhold']) {
        const q = S[k];
        if (!isObj(q) || !isStr(q.src) || !isStr(q.mask) || !inR(q.frames, 1, 64) || !isSize(q.size, q.frames * C, 8 * C)) return false;
      }
      const b = S.idle.breathe, F = S.idle.frames;
      if (b !== undefined && !(isObj(b) && D.includes(b.dir) && inR(b.frame, 0, F - 1) && inR(b.cut, 1, C - 2))) return false;
      for (const g of GROUPS) {
        const L = p.palette && p.palette[g];
        if (!Array.isArray(L) || !L.length || !Array.isArray(L[0]) || !Array.isArray(L[0][1])) return false;
        const n = L[0][1].length;
        if (n < 1 || n > 255 || new Set(L.map((e) => e && e[0])).size !== L.length) return false;
        if (!L.every((e) => Array.isArray(e) && isName(e[0]) && Array.isArray(e[1]) && e[1].length === n && e[1].every(isHex))) return false;
      }
      const R = p.materials && p.materials.recolour, ids = p.materials && p.materials.ids;
      if (!isObj(R) || !Array.isArray(ids) || ids[0] !== 1 || !inR(ids[1], 1, 254)) return false;
      const rk = Object.keys(R);
      if (rk.length !== GROUPS.length || !GROUPS.every((g) => rk.filter((k) => R[k] === g).length === 1) || !rk.every((k) => String(+k) === k && inR(+k, ids[0], ids[1]))) return false;
      if (!isObj(p.bases) || !Object.keys(p.bases).length) return false;
      for (const k of Object.keys(p.bases)) {
        const B = p.bases[k];
        if (!isName(k) || !isObj(B) || (B.gender !== 'f' && B.gender !== 'm') || !isObj(B.parts) || !isObj(B.defaults)) return false;
        if (!SLOT_NEED.every((x) => Array.isArray(B.parts[x]) && B.parts[x].length && B.parts[x].every(isStr))) return false;
        if (!SLOT_OPT.every((x) => B.parts[x] === undefined || (Array.isArray(B.parts[x]) && B.parts[x].every(isStr)))) return false;
        if (!['hair', 'iris', 'skin'].every((g) => colourIx(p, g, B.defaults[g]) >= 0)) return false;
      }
      if (!Array.isArray(p.deprecated) || !p.deprecated.every(isStr) || !isObj(p.render_offset) || !D.every((d) => inR(p.render_offset[d], -8, 8))) return false;
      const t = p.timing, e = p.ease, L = p.lantern, P = p.portrait, H = p.hold, u = p.budget;
      if (!isObj(t) || !inR(t.walk_ms, 16, 2000) || !inR(t.idle_ms, 16, 2000) || !Array.isArray(t.idle_loop) || !t.idle_loop.length ||
          !t.idle_loop.every((v) => inR(v, 0, F - 1)) || !Array.isArray(t.blink_dirs) || !t.blink_dirs.every((d) => D.includes(d)) ||
          !inR(t.blink_min_ms, 0, 60000) || !inR(t.blink_span_ms, 0, 60000) || !inR(t.blink_frame, 0, F - 1) || !inR(t.stop_fi, 0, t.idle_loop.length - 1)) return false;
      if (!isObj(e) || !inR(e.max_px, 0, C) || !inR(e.window_ms, 0, 2000)) return false;
      if (!isObj(L) || !isStr(L.src) || !isStr(L.light) || !inR(L.cell, 1, C) || !isSize(L.size, L.cell, L.cell) || !isPt(L.grip, L.cell) ||
          !isPt(L.light_centre, L.cell) || !isPt(L.n_hole, C) || !Array.isArray(L.hidden_dirs) || !L.hidden_dirs.every((d) => D.includes(d)) ||
          !isObj(L.power_light) || !['0', '10', '50', '100'].every((k) => typeof L.power_light[k] === 'number' && L.power_light[k] >= 0 && L.power_light[k] <= 1)) return false;
      if (!isObj(H) || !isStr(H.src) || !isObj(P) || !isStr(P.src) || !isStr(P.mask) || !isStr(P.mask_meta) || !isStr(P.shademap) ||
          !Array.isArray(P.size) || !inR(P.size[0], 1, 4096) || !inR(P.size[1], 1, 4096)) return false;
      if (!isObj(u) || !inR(u.bytes, 1, 2 ** 31) || !inR(u.borrow_max, 0, u.bytes - 1) || !inR(u.fixed_other_max, 0, u.bytes - 1)) return false;
      return true;
    } catch (err) { return false; }
  }
  function colourIx(p, g, name) { const L = p.palette[g]; for (let i = 0; i < L.length; i++) if (L[i][0] === name) return i; return -1; }
  function hashText(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }

  // ---------- file helpers (never throw, never reject) ----------
  function getText(url) { return fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : null)).catch(() => null); }
  function getJSON(url) { return getText(url).then((t) => { if (t === null) return { t: null, j: null }; try { return { t, j: JSON.parse(t) }; } catch (e) { return { t, j: null }; } }); }
  function getImg(url) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }); }
  function pixels(img, w, h) {   // decoded RGBA of an image of the exact expected size, or null
    if (!img || img.naturalWidth !== w || img.naturalHeight !== h) return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h); c.width = 0; c.height = 0; return d;
  }

  // ---------- mask rules (T11 R3, same rule as the Pilot pages) ----------
  function kidMaskOk(p, A, M) {   // every opaque px: mask alpha 255, id 1-11, a recolour id has G < its ramp length; clear px clear; all 4 groups present
    const a = A.data, m = M.data, seen = {}, R = p.materials.recolour, lim = {};
    for (const id in R) lim[id] = p.palette[R[id]][0][1].length;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] === 0) { if (m[i + 3] !== 0) return false; continue; }
      const id = m[i];
      if (m[i + 3] !== 255 || id < 1 || id > 11) return false;
      if (lim[id] !== undefined) { if (m[i + 1] >= lim[id]) return false; seen[id] = 1; }
    }
    return Object.keys(R).every((id) => seen[id]);
  }
  function ptMaskOk(p, P, M, meta, smap) {   // portrait: same as the Pilot portrait page (validPtMask) - counts per (id, G) must equal pt-mask.json
    try {
      const a = P.data, m = M.data, R = p.materials.recolour, got = new Map();
      for (const id of Object.keys(R)) {   // shade map = the Pilot validMap rule (T22 R5): length = shades in pt-mask.json, every value inside the ramp
        const e = isObj(smap.materials) && smap.materials[id], sh = isObj(meta.materials) && meta.materials[id] && meta.materials[id].shades, n = p.palette[R[id]][0][1].length;
        if (!isObj(e) || !Array.isArray(e.shade_index_by_G) || !Array.isArray(sh) || e.shade_index_by_G.length !== sh.length || !e.shade_index_by_G.every((v) => inR(v, 0, n - 1))) return false;
        if (e.group !== undefined && e.group !== R[id]) return false;
      }
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] === 0) { if (m[i + 3] !== 0) return false; continue; }
        const id = m[i], g = m[i + 1];
        if (m[i + 3] !== 255 || id < 1 || id > 11) return false;
        if (own(R, String(id)) && !(g < smap.materials[id].shade_index_by_G.length)) return false;
        const k = id * 256 + g; got.set(k, (got.get(k) || 0) + 1);
      }
      const want = new Map();
      for (const id in meta.materials) {
        const e = meta.materials[id];
        if (Array.isArray(e.px)) e.px.forEach((n, g) => { if (n) want.set(id * 256 + g, n); });
        else if (isObj(e.parts)) for (const q of Object.values(e.parts)) q.px.forEach((n, j) => { if (n) want.set(id * 256 + q.g0 + j, n); });
        else return false;
      }
      if (want.size !== got.size) return false;
      for (const [k, n] of want) if (got.get(k) !== n) return false;
      return true;
    } catch (e) { return false; }
  }
  function holdOk(p, j, sh) {   // c2-pilot-hold-anchors.json vs the pack and the loaded sheets (T22 R4)
    try {
      const C = p.cell, hid = p.lantern.hidden_dirs;
      if (!isObj(j) || j.schema !== 1 || !Array.isArray(j.cell) || j.cell[0] !== C || j.cell[1] !== C || !isPt(j.feet, C) || j.feet[0] !== p.feet[0] || j.feet[1] !== p.feet[1]) return false;
      for (const [key, an] of [['idle_hold', 'idle'], ['walk_hold', 'walkhold']]) {
        const n = p.sheets[an].frames, A = sh[an] && sh[an].A;
        if (!isObj(j[key]) || !A) return false;
        for (let di = 0; di < 8; di++) {
          const d = p.dirs[di], L = j[key][d];
          if (!Array.isArray(L) || L.length !== n) return false;
          let hand = null;
          for (let k = 0; k < n; k++) {
            const f = L[k];
            if (!isObj(f)) return false;
            if (hid.includes(d)) { if (f.anchor !== null) return false; continue; }   // N: hand under the cape, no lantern (D-HAND)
            if (f.hand !== 'R' && f.hand !== 'L') return false;
            if (hand === null) hand = f.hand; else if (f.hand !== hand) return false;
            if (!isPt(f.anchor, C) || !Array.isArray(f.fist) || !f.fist.length || !f.fist.every((q) => isPt(q, C))) return false;
            if (f.fist_px !== undefined && f.fist_px !== f.fist.length) return false;
            if (!f.fist.some((q) => q[0] === f.anchor[0] && q[1] === f.anchor[1])) return false;
            for (const q of f.fist) if (A.data[((di * C + q[1]) * A.width + k * C + q[0]) * 4 + 3] === 0) return false;   // fist px must be drawn px
          }
        }
      }
      return true;
    } catch (e) { return false; }
  }
  // W idle breathing (contract 5): rows 0..cut-1 of the cell move up 1 px, row cut is repeated. Pure pixel move, done once on image AND mask.
  function breathe(D, p) {
    const b = p.sheets.idle.breathe; if (!b || !D) return;
    const C = p.cell, W = D.width, d = D.data, x0 = b.frame * C, y0 = p.dirs.indexOf(b.dir) * C;
    for (let y = 0; y < b.cut; y++) { const s = ((y0 + y + 1) * W + x0) * 4, t = ((y0 + y) * W + x0) * 4; d.copyWithin(t, s, s + C * 4); }
  }

  // ---------- load ----------
  function load(packUrl) {
    if (LOADING) return LOADING;   // a second load returns the first result (no old/new pack mix) until release()
    const g = GEN;
    LOADING = doLoad(packUrl, g).catch(() => ({ ready: false, failed: ['internal'], pack: null }));
    return LOADING;
  }
  const GONE = { ready: false, failed: ['released'], pack: null };
  async function doLoad(packUrl, g) {
    const base = new URL(String(packUrl || 'c2-pack.json'), location.href);
    const { t, j: p } = await getJSON(base.href);
    if (!packOk(p)) return { ready: false, failed: ['pack'], pack: null };
    const at = (f) => new URL(f, base).href, C = p.cell, failed = [], raw = [], fixed = { images: 0, masks: 0, other: 0 };
    const sh = {};
    await Promise.all(['idle', 'walk', 'walkhold'].map(async (k) => {
      const s = p.sheets[k], [w, h] = s.size;
      const [im, mk] = await Promise.all([getImg(at(s.src)), getImg(at(s.mask))]);
      const A = pixels(im, w, h);
      if (!A) { failed.push(k); return; }
      let M = pixels(mk, w, h);
      if (M && !kidMaskOk(p, A, M)) M = null;
      if (!M) { failed.push(k + '-mask'); raw.push(k); }
      if (k === 'idle') { breathe(A, p); breathe(M, p); }
      sh[k] = { A, M };
      fixed.images += A.data.length; if (M) fixed.masks += M.data.length;
    }));
    if (!sh.idle && !sh.walk) return { ready: false, failed: failed.sort(), pack: null };   // nothing to draw the body with -> old character
    const idleFrom = sh.idle ? 'idle' : 'walk-f1', walkFrom = sh.walk ? 'walk' : 'idle-f1';   // contract 7
    // hold mode needs walkhold + the real idle + hand anchors + the lantern (contract 7 / 12): anything missing -> hold off
    const L = p.lantern;
    const [hj, lb, ll] = await Promise.all([getJSON(at(p.hold.src)), getImg(at(L.src)), getImg(at(L.light))]);
    const hold = holdOk(p, hj.j, sh) ? hj.j : null; if (!hold && sh.idle && sh.walkhold) failed.push('hold');
    const lanA = pixels(lb, L.cell, L.cell), lanL = pixels(ll, L.cell, L.cell);
    if (!lanA) failed.push('lantern'); if (!lanL) failed.push('lantern-light');
    const lanC = lanA && toCanvas(lanA), lanLC = lanL && toCanvas(lanL);
    if (lanC) fixed.other += lanA.data.length; if (lanLC) fixed.other += lanL.data.length;
    const holdOn = !!(hold && lanA && sh.walkhold && sh.idle);
    // portrait (used from G3.4): missing image -> no portrait; mask / meta / shade map wrong -> portrait as drawn
    const P = p.portrait, [pw, ph] = P.size;
    const [pi, pm, pj, ps] = await Promise.all([getImg(at(P.src)), getImg(at(P.mask)), getJSON(at(P.mask_meta)), getJSON(at(P.shademap))]);
    const PA = pixels(pi, pw, ph); let PM = PA ? pixels(pm, pw, ph) : null;
    if (!PA) failed.push('portrait');
    else if (!(PM && isObj(pj.j) && isObj(ps.j) && ptMaskOk(p, PA, PM, pj.j, ps.j))) { PM = null; failed.push('portrait-mask'); }
    if (PA) fixed.images += PA.data.length; if (PM) fixed.masks += PM.data.length;
    if (g !== GEN) return Object.assign({}, GONE, { failed: ['released'] });   // release() was called while this load ran
    ST = { pack: deepFreeze(p), key: p.id + '@' + p.version + '#' + hashText(t), sh, idleFrom, walkFrom, raw: raw.sort(), hold, holdOn,
           lanC, lanL: lanLC, geo: geometry(p, sh), comp: compBox(p, holdOn ? hold : null, lanA, lanL), portrait: PA ? { A: PA, M: PM, meta: pj.j, smap: ps.j } : null, fixed };
    CNT.peak = Math.max(CNT.peak, total());
    return { ready: true, failed: failed.sort(), pack: ST.pack,
             modes: { idle: idleFrom, walk: walkFrom, raw: ST.raw.slice(), hold: holdOn, lantern_light: !!lanL, portrait: PA ? (PM ? 'recolour' : 'raw') : null } };
  }
  function toCanvas(D) { const c = mk(D.width, D.height); c.getContext('2d').putImageData(D, 0, 0); return c; }
  function compBox(p, hold, lanA, lanL) {   // G3.1 A3 composition box [x0,y0,x1,y1) in cell px = the body cell + every lantern px at every hold anchor
    const C = p.cell, LN = p.lantern.cell, G = p.lantern.grip, b = [0, 0, C, C];       // (the eased lantern stays between the anchors of its dir)
    if (!hold || !lanA) return b;
    let x0 = LN, y0 = LN, x1 = -1, y1 = -1;
    for (const D of [lanA, lanL]) if (D) for (let y = 0; y < LN; y++) for (let x = 0; x < LN; x++) if (D.data[(y * LN + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) return b;
    for (const key of ['idle_hold', 'walk_hold']) for (const d of p.dirs) for (const f of hold[key][d]) if (f.anchor) {
      const X = f.anchor[0] - G[0], Y = f.anchor[1] - G[1];
      b[0] = Math.min(b[0], X + x0); b[1] = Math.min(b[1], Y + y0); b[2] = Math.max(b[2], X + x1 + 1); b[3] = Math.max(b[3], Y + y1 + 1);
    }
    return b;   // the Pilot files: lantern px x 23-71, y 70-92 -> the cell itself, 96 x 96 = 36,864 B (plan section 4)
  }
  function geometry(p, sh) {   // per anim / dir / frame from alpha: head_top = [centre x of opaque px in rows <= 50, top row] (= anchors JSON 80/80) · box = [x0,y0,x1,y1) of the anim+dir
    const C = p.cell, G = {}; let top = C;
    for (const an in sh) {
      const A = sh[an].A, n = A.width / C; G[an] = {};
      for (let di = 0; di < 8; di++) {
        const fr = [], bx = [C, C, 0, 0];
        for (let k = 0; k < n; k++) {
          let t = -1, h0 = C, h1 = -1;
          for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (A.data[((di * C + y) * A.width + k * C + x) * 4 + 3]) {
            if (t < 0) t = y; if (y <= 50) { h0 = Math.min(h0, x); h1 = Math.max(h1, x); }
            bx[0] = Math.min(bx[0], x); bx[1] = Math.min(bx[1], y); bx[2] = Math.max(bx[2], x + 1); bx[3] = Math.max(bx[3], y + 1);
          }
          fr.push([Math.floor((h0 + h1) / 2 + 0.5), t]); if (an !== 'walkhold') top = Math.min(top, t);
        }
        G[an][p.dirs[di]] = { fr, box: bx };
      }
    }
    G.label = [p.feet[0], top - 4]; return G;
  }
  function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; }

  // ---------- look: a save (read only) -> a NEW Appearance, or null = the old system draws ----------
  const ix = (v, n) => (isInt(v) && v >= 0 && v < n ? v : null);
  function pd219Look(o) { return isObj(o) && o.v === 1 && PD219_PARTS.every((k) => isInt(o[k]) && o[k] >= 1); }   // game check with the paper-doll pack not loaded
  function look169Valid(a) {
    return isObj(a) && a.v === 1 && ix(a.hair, 3) !== null && ix(a.face, 3) !== null && ix(a.hc, HAIRC.length) !== null && ix(a.ec, EYEC.length) !== null;
  }
  function look(save) { try { return look1(save); } catch (e) { return null; } }   // a broken save never throws into the game (T22 R1)
  function look1(save) {
    if (!ST || !isObj(save)) return null;
    const p = ST.pack, c = save.char2;
    if (isObj(c) && c.v === 2 && c.set === p.set) return fromChar2(p, c);   // other v / set -> read the old fields (they are never changed)
    return fromOld(p, save);
  }
  function fromChar2(p, c) {
    if (!own(p.bases, c.base)) return null;                                // no art for that base (own string keys only)
    const B = p.bases[c.base];
    const gender = c.gender === 'f' || c.gender === 'm' ? c.gender : B.gender;
    if (gender !== B.gender) return null;                                   // e.g. a boy on the girl base: the old system draws
    const parts = {}, inP = isObj(c.parts) ? c.parts : {};
    for (const s of SLOT_NEED) { const v = inP[s]; parts[s] = typeof v === 'string' && B.parts[s].includes(v) && !p.deprecated.includes(v) ? v : B.parts[s][0]; }
    for (const s of SLOT_OPT) { const v = inP[s], L = B.parts[s] || []; parts[s] = typeof v === 'string' && L.includes(v) && !p.deprecated.includes(v) ? v : null; }
    const inC = isObj(c.color) ? c.color : {}, color = {};
    for (const g of ['hair', 'iris', 'skin']) color[g] = typeof inC[g] === 'string' && colourIx(p, g, inC[g]) >= 0 ? inC[g] : B.defaults[g];
    return { v: 2, set: p.set, base: c.base, gender, parts, color };
  }
  function fromOld(p, S) {
    const gender = S.gender194 === 'f' || S.gender194 === 'm' ? S.gender194 : (BOYS194.includes(S.kid) ? 'm' : 'f');
    const baseId = Object.keys(p.bases).find((k) => p.bases[k].gender === gender);
    if (!baseId) return null;                                               // T8: no c2 base for boys yet
    const B = p.bases[baseId], src = [];                                    // migration doc section 4: first usable source, each colour on its own
    if (pd219Look(S.pd219)) src.push([S.pd219.hc, S.pd219.ec, S.pd219.tn]);
    if (look169Valid(S.appearance169)) src.push([S.appearance169.hc, S.appearance169.ec, undefined]);
    src.push([S.hcol, S.ecol, undefined]);
    src.push([S.hc, S.ec, undefined]);
    const pick = (col, L) => { for (const s of src) { const v = ix(s[col], L.length); if (v !== null) return L[v]; } return null; };
    const color = { hair: pick(0, HAIRC) || B.defaults.hair, iris: pick(1, EYEC) || B.defaults.iris, skin: pick(2, TONES) || B.defaults.skin };
    const parts = {}; for (const s of SLOT_NEED) parts[s] = B.parts[s][0]; for (const s of SLOT_OPT) parts[s] = null;
    return { v: 2, set: p.set, base: baseId, gender, parts, color };
  }

  // ---------- G3.3: colour sets · cache · borrow handles · actors · draw · anchors · light (plan v1.4 section 4) ----------
  const CACHE = new Map(), HANDLES = new Set(), GONEK = new Set(); let SCR = 0, USE = 0, SEED = 0x2545f491, COMP = null, LC = null;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const kill = (c) => { if (c) { c.width = 0; c.height = 0; } };
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function sizes() { let c = 0, b = 0, nc = 0, nb = 0; for (const e of CACHE.values()) if (e.pins) { b += e.bytes; nb++; } else { c += e.bytes; nc++; } return { c, b, nc, nb }; }
  function total() { if (!ST) return 0; const z = sizes(), f = ST.fixed; return f.images + f.masks + f.other + z.c + z.b + SCR; }
  function fixedCanvas(w, h) { ST.fixed.other += w * h * 4; return mk(w, h); }
  function opts(app, dc) {   // Appearance + DrawContext -> palette option index per group, or null
    if (!ST || !isObj(app) || !own(ST.pack.bases, app.base) || !isObj(app.color) || !isObj(dc)) return null;
    const p = ST.pack, o = { hair: colourIx(p, 'hair', app.color.hair), iris: colourIx(p, 'iris', app.color.iris), skin: colourIx(p, 'skin', app.color.skin), house: colourIx(p, 'house', dc.house) };
    return o.hair >= 0 && o.iris >= 0 && o.skin >= 0 && o.house >= 0 ? o : null;
  }
  function room(need) {   // evict least-recently-used unpinned entries until fixed + cache + borrowed + scratch + need fits the budget (need = an upper bound)
    while (total() + need > ST.pack.budget.bytes) {
      let v = null; for (const kv of CACHE) if (!kv[1].pins && (!v || kv[1].last < v[1].last)) v = kv;
      if (!v) return false; drop(v[0], v[1]);
    }
    return true;
  }
  function drop(k, e) { kill(e.cv); if (e.fists) for (const r of e.fists) for (const f of r) if (f) kill(f.c); CACHE.delete(k); GONEK.add(k); CNT.evict++; }
  function build(an, o) {   // one recoloured sheet (idle / walk / walkhold / stand8 / portrait) as a canvas + its fist canvases
    const p = ST.pack, C = p.cell, PT = an === 'portrait', S = PT ? ST.portrait : an === 'stand8' ? ST.sh.idle || ST.sh.walk : ST.sh[an]; if (!S) return null;
    const W = an === 'stand8' ? 8 * C : S.A.width, H = an === 'stand8' ? C : S.A.height, b = W * H * 4;
    if (!room(2 * b + 16384)) return null;   // canvas + one scratch ImageData + room for the fists
    SCR = b; const out = new ImageData(W, H), d = out.data, a = S.A.data, m = S.M && S.M.data, R = p.materials.recolour, ramp = Object.create(null);
    if (m) for (const id of Object.keys(R)) {   // portrait: G = portrait shade -> game shade through the shade map (D-PT-3 ก) · no mask = drawn as it is
      const cols = p.palette[R[id]][o[R[id]]][1].map(rgbOf); ramp[id] = PT ? S.smap.materials[id].shade_index_by_G.map((k) => cols[k]) : cols;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (an === 'stand8' ? ((Math.floor(x / C) * C + y) * S.A.width + (x % C)) : (y * W + x)) * 4, j = (y * W + x) * 4;
      if (!a[i + 3]) continue;
      const r = m && ramp[m[i]], c = r ? r[m[i + 1]] : a.subarray(i, i + 3);
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = a[i + 3];
    }
    const e = { cv: mk(W, H), bytes: b, pins: 0, last: 0, fists: null }; e.cv.getContext('2d').putImageData(out, 0, 0);
    if (ST.hold && (an === 'idle' || an === 'walkhold')) e.fists = fists(an, out, e);
    CNT.peak = Math.max(CNT.peak, total() + e.bytes);   // peak = bytes that really exist now: scratch + the new canvas and fists (not yet in CACHE) + all the rest
    SCR = 0; return e;
  }
  function fists(an, img, e) {   // Pilot buildFists: the fist px of each frame, copied from this colour set, drawn again over the lantern ring
    const p = ST.pack, C = p.cell, key = an === 'idle' ? 'idle_hold' : 'walk_hold', out = [];
    for (let di = 0; di < 8; di++) { out.push([]); for (const fr of ST.hold[key][p.dirs[di]]) {
      const k = out[di].length; if (!fr.anchor) { out[di].push(null); continue; }
      const xs = fr.fist.map((q) => q[0]), ys = fr.fist.map((q) => q[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0 + 1, h = Math.max(...ys) - y0 + 1, D = new ImageData(w, h);
      for (const [x, y] of fr.fist) D.data.set(img.data.subarray(((di * C + y) * img.width + k * C + x) * 4, ((di * C + y) * img.width + k * C + x) * 4 + 4), ((y - y0) * w + x - x0) * 4);
      out[di].push({ c: toCanvas(D), x: x0, y: y0, w, h }); e.bytes += w * h * 4; } }
    return out;
  }
  function entry(an, o) {
    const k = an + '|' + o.hair + '|' + o.iris + '|' + o.skin + '|' + o.house; let e = CACHE.get(k);
    if (e) CNT.hit++; else { CNT.miss++; e = build(an, o); if (!e) return null; if (GONEK.has(k)) CNT.rebuilt++; CACHE.set(k, e); }
    e.last = ++USE; return e;
  }
  function sheet(app, dc, an) {   // borrow handle: the cache's own canvas (read only), pinned until handle.release()
    try {
      if (!ST || !['idle', 'walk', 'walkhold', 'stand8', 'portrait'].includes(an)) return null;
      const o = opts(app, dc), e = o && entry(an, o); if (!e) return null;
      if (!e.pins && sizes().b + e.bytes > ST.pack.budget.borrow_max) { CNT.refused++; return null; }
      e.pins++; const h = { canvas: e.cv, release() { if (h.dead) return; h.dead = true; h.canvas = null; e.pins--; HANDLES.delete(h); } };
      HANDLES.add(h); return h;
    } catch (err) { return null; }
  }
  function trim() { for (const kv of [...CACHE]) if (!kv[1].pins) drop(kv[0], kv[1]); }

  // ---------- G3.4 encode / decode: a short text of an Appearance only (no house · not an online envelope) ----------
  // "c2.2|kid4|f|kid4.kid4.kid4.-.-.-|brown.green.medium" = set.v | base | gender | hair.eyes.outfit.head.face_acc.back (- = none) | hair.iris.skin
  const SLOTS = SLOT_NEED.concat(SLOT_OPT), COL = ['hair', 'iris', 'skin'];
  function appOk(p, a) {   // exactly an Appearance this pack draws (encode never fixes a look on its own)
    if (!isObj(a) || a.v !== 2 || a.set !== p.set || !own(p.bases, a.base) || !isObj(a.parts) || !isObj(a.color)) return false;
    const B = p.bases[a.base], ok = (v, L) => isName(v) && L.includes(v) && !p.deprecated.includes(v);
    return a.gender === B.gender && SLOT_NEED.every((x) => ok(a.parts[x], B.parts[x])) && SLOT_OPT.every((x) => a.parts[x] == null || ok(a.parts[x], B.parts[x] || [])) &&
      COL.every((g) => isName(a.color[g]) && colourIx(p, g, a.color[g]) >= 0);
  }
  function encode(app) {
    try { if (!ST || !appOk(ST.pack, app)) return null; return [app.set + '.2', app.base, app.gender, SLOTS.map((x) => app.parts[x] || '-').join('.'), COL.map((g) => app.color[g]).join('.')].join('|'); } catch (e) { return null; }
  }
  function decode(text) {   // wrong shape / set / version -> null · then the save rules (fromChar2): unknown base or other gender -> null, unknown part or colour name -> default
    try {
      if (!ST || typeof text !== 'string' || text.length > 160) return null;
      const p = ST.pack, f = text.split('|'); if (f.length !== 5 || f[0] !== p.set + '.2' || !isName(f[1]) || (f[2] !== 'f' && f[2] !== 'm')) return null;
      const pa = f[3].split('.'), co = f[4].split('.'); if (pa.length !== SLOTS.length || co.length !== 3 || !co.every(isName)) return null;
      if (!pa.every((v, k) => isName(v) || (v === '-' && k >= SLOT_NEED.length))) return null;
      const parts = {}; SLOTS.forEach((x, k) => { parts[x] = pa[k] === '-' ? null : pa[k]; });
      return fromChar2(p, { v: 2, set: p.set, base: f[1], gender: f[2], parts, color: { hair: co[0], iris: co[1], skin: co[2] } });
    } catch (e) { return null; }
  }

  function rng(a) { return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }   // mulberry32
  function actor(o) {   // per-character state, owned by the caller · o.rand / o.blinkAt = tests only
    o = isObj(o) ? o : {}; const rand = typeof o.rand === 'function' ? o.rand : rng(SEED = (SEED + 0x9E3779B9) >>> 0), T = ST ? ST.pack.timing : { blink_min_ms: 3000, blink_span_ms: 2200 };
    return { dir: 'S', anim: 'idle', fi: 0, t: 0, moving: false, holding: false, blinkClock: 0, blinkNow: false, rand,
             blinkAt: Number.isFinite(o.blinkAt) ? o.blinkAt : T.blink_min_ms + rand() * T.blink_span_ms, lpos: null, ldir: null, lhist: null, lclock: 0 };
  }
  const inCell = (v) => Number.isFinite(v) && v >= 0 && v < ST.pack.cell;
  function actorOk(A) {   // T25 N1: an actor the caller broke (fi NaN / -1 / missing / Infinity, unknown anim, lantern position not 2 numbers inside the cell) -> draw false, anchor / light null
    return isObj(A) && ST.pack.dirs.includes(A.dir) && (A.anim === 'idle' || A.anim === 'walk') && Number.isSafeInteger(A.fi) && A.fi >= 0 &&
      (A.lpos == null || (Array.isArray(A.lpos) && A.lpos.length === 2 && inCell(A.lpos[0]) && inCell(A.lpos[1])));   // T26 N2: index both (every() skips holes)
  }
  function frame(A) {   // Pilot curFrame
    const T = ST.pack.timing; if (A.anim === 'walk') return A.fi % ST.pack.sheets.walk.frames;
    const L = T.idle_loop.length, li = A.fi % L; return li === L - 1 && A.blinkNow && T.blink_dirs.includes(A.dir) ? T.blink_frame : T.idle_loop[li];
  }
  function target(A) { if (!ST.holdOn || !A.holding) return null; const f = ST.hold[A.anim === 'walk' ? 'walk_hold' : 'idle_hold'][A.dir][frame(A)]; return f && f.anchor; }
  function tick(A, dt, inp) {   // Pilot walk() / stop() / step() / easeLantern(): the caller owns the time
    try {
      if (!ST || !isObj(A)) return; const p = ST.pack, T = p.timing; dt = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 60000) : 0;   // <= 60 s per call: a huge dt never loops for long (same result as the Pilot for any dt it can get)
      if (isObj(inp)) {
        if (p.dirs.includes(inp.dir)) A.dir = inp.dir;
        const mv = !!inp.moving, h = !!inp.holding;
        if (mv && A.anim !== 'walk') { A.anim = 'walk'; A.fi = 0; A.t = 0; } else if (!mv && A.anim === 'walk') { A.anim = 'idle'; A.fi = T.stop_fi; A.t = 0; }
        A.moving = mv; if (h !== A.holding) { A.holding = h; A.lpos = null; }
      }
      A.t += dt; const ms = A.anim === 'walk' ? T.walk_ms : T.idle_ms, L = T.idle_loop.length;
      if (A.anim === 'idle') A.blinkClock += dt;
      while (A.t >= ms) { A.t -= ms; A.fi++;
        if (A.anim === 'idle') { A.blinkNow = false; if (A.fi % L === L - 1 && A.blinkClock >= A.blinkAt) { A.blinkNow = true; A.blinkClock = 0; A.blinkAt = T.blink_min_ms + A.rand() * T.blink_span_ms; } } }
      const t = target(A); if (!t) { A.lpos = A.ldir = A.lhist = null; return; }
      const now = A.lclock += dt, E = p.ease;   // step ease (D-EASE-STEP): stay within max_px of every position drawn in the last window_ms
      if (!A.lpos || A.ldir !== A.dir) { A.lpos = [t[0], t[1]]; A.ldir = A.dir; A.lhist = [{ t: now, p: [t[0], t[1]] }]; return; }
      A.lhist = A.lhist.filter((q) => now - q.t <= E.window_ms); const Hs = A.lhist.length ? A.lhist : [{ p: A.lpos.map(Math.round) }];
      A.lpos = [0, 1].map((i) => Math.min(Math.min(...Hs.map((q) => q.p[i])) + E.max_px, Math.max(Math.max(...Hs.map((q) => q.p[i])) - E.max_px, t[i])));
      A.lhist.push({ t: now, p: A.lpos.map(Math.round) });
    } catch (e) {}
  }
  function held(A, dc) { const h = isObj(dc) && dc.held; return !!(ST.holdOn && A.holding && isObj(h) && h.id === ST.pack.lantern.id && h.on !== false); }
  function lightA(dc) { const h = dc.held, v = ST.lanL && h.lit ? ST.pack.lantern.power_light[String(h.power)] : 0; return typeof v === 'number' ? v : 0; }
  function pick(A, H) {   // which sheet + frame the Pilot draws (contract 7 fallbacks included)
    const k = frame(A), sh = ST.sh;
    if (A.anim === 'walk') return H ? ['walkhold', k] : sh.walk ? ['walk', k] : ['idle', 0];
    return sh.idle ? ['idle', k] : ['walk', 0];
  }
  function draw(ctx, app, dc, A, x, y, s, op) {   // all checks before the first pixel: false = nothing drawn
    try {
      if (!ST || !ctx || !actorOk(A) || !Number.isFinite(x) || !Number.isFinite(y) || !isInt(s) || s < 1) return false;
      const o = opts(app, dc); if (!o) return false;
      const p = ST.pack, C = p.cell, d = A.dir, di = p.dirs.indexOf(d), H = held(A, dc), [an, kk] = pick(A, H), e = entry(an, o); if (!e || !isInt(kk) || kk < 0 || (kk + 1) * C > e.cv.width) return false;
      const t = H ? target(A) : null, lp = t && (A.lpos && A.ldir === d ? A.lpos : t), la = t ? lightA(dc) : 0, fo = t && e.fists ? e.fists[di][kk] : null;
      const emis = isObj(op) && op.only === 'emissive'; if (emis && !(t && la)) return false;
      const G = p.lantern.grip, LN = p.lantern.cell, X0 = Math.round(x - p.feet[0] * s + p.render_offset[d] * s), Y0 = Math.round(y - p.feet[1] * s);
      const a0 = ctx.globalAlpha, comp = a0 < 1 && !emis, lx = t ? Math.round(lp[0]) - G[0] : 0, ly = t ? Math.round(lp[1]) - G[1] : 0;
      const B = ST.comp; if (comp && !COMP) COMP = fixedCanvas(B[2] - B[0], B[3] - B[1]); if (emis && !LC) LC = fixedCanvas(LN, LN);
      ctx.save();
      try {
        ctx.imageSmoothingEnabled = false;
        if (emis) {   // the lit glass again after the scene's darkness, fist px cut out (Pilot cave pass)
          const q = LC.getContext('2d'); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, LN, LN); q.drawImage(ST.lanL, 0, 0);
          if (fo) { q.globalCompositeOperation = 'destination-out'; q.drawImage(fo.c, fo.x - lx, fo.y - ly); q.globalCompositeOperation = 'source-over'; }
          ctx.globalAlpha = a0 * la; ctx.drawImage(LC, 0, 0, LN, LN, X0 + lx * s, Y0 + ly * s, LN * s, LN * s); return true;
        }
        let g = ctx, sx = X0, sy = Y0, z = s;
        if (comp) { g = COMP.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, COMP.width, COMP.height); g.imageSmoothingEnabled = false; sx = -B[0]; sy = -B[1]; z = 1; }
        g.drawImage(e.cv, kk * C, di * C, C, C, sx, sy, C * z, C * z);
        if (t) {
          g.drawImage(ST.lanC, 0, 0, LN, LN, sx + lx * z, sy + ly * z, LN * z, LN * z);
          if (la) { g.globalAlpha = la; g.drawImage(ST.lanL, 0, 0, LN, LN, sx + lx * z, sy + ly * z, LN * z, LN * z); g.globalAlpha = 1; }
          if (fo) g.drawImage(fo.c, 0, 0, fo.w, fo.h, sx + fo.x * z, sy + fo.y * z, fo.w * z, fo.h * z);
        }
        if (comp) { ctx.globalAlpha = a0; ctx.drawImage(COMP, 0, 0, COMP.width, COMP.height, X0 + B[0] * s, Y0 + B[1] * s, COMP.width * s, COMP.height * s); }   // G3.1 A3: alpha once
        return true;
      } finally { ctx.restore(); }
    } catch (err) { return false; }
  }
  function anchor(A, name, dc) {   // cell px BEFORE renderOffset · dc (optional) = the DrawContext of the draw it goes with (no lantern held -> the sheet draw uses)
    try {
      if (!ST || !actorOk(A)) return null;
      const p = ST.pack, G = ST.geo, H = dc === undefined ? ST.holdOn && A.holding : held(A, dc), [an, kk] = pick(A, H), f = G[an][A.dir], ht = f.fr[kk];
      if (name === 'feet') return p.feet.slice(); if (name === 'label') return G.label.slice(); if (name === 'head_top') return ht.slice();
      if (name === 'body') return [p.feet[0], Math.round((ht[1] + p.feet[1]) / 2)]; if (name === 'box') return f.box.slice();
      const fr = H && ST.hold[A.anim === 'walk' ? 'walk_hold' : 'idle_hold'][A.dir][frame(A)];
      if (name === 'hand_r' || name === 'hand_l') return fr && fr.anchor && fr.hand === (name === 'hand_r' ? 'R' : 'L') ? fr.anchor.slice() : null;
      if (name === 'grip') { const t = H && target(A), lp = t && (A.lpos && A.ldir === A.dir ? A.lpos : t); return lp ? lp.map(Math.round) : null; }
      return null;
    } catch (e) { return null; }
  }
  function light(A, dc) {   // art px from the logical feet, renderOffset included · computed from actor + dc + pack only (T17 N1)
    try {
      if (!ST || !actorOk(A) || !held(A, dc)) return null;
      const p = ST.pack, L = p.lantern, d = A.dir, dx = p.render_offset[d], lit = lightA(dc) > 0, power = dc.held.power;
      if (L.hidden_dirs.includes(d)) return { x: dx + L.n_hole[0] - p.feet[0], y: L.n_hole[1] - p.feet[1], hidden: true, lit, power };
      const t = target(A); if (!t) return null; const lp = A.lpos && A.ldir === d ? A.lpos : t;
      return { x: Math.round(lp[0]) - L.grip[0] + L.light_centre[0] - p.feet[0] + dx, y: Math.round(lp[1]) - L.grip[1] + L.light_centre[1] - p.feet[1], hidden: false, lit, power };
    } catch (e) { return null; }
  }

  // ---------- stats / release ----------
  function stats() {
    const z = ST ? sizes() : { c: 0, b: 0, nc: 0, nb: 0 }, f = ST ? Object.assign({}, ST.fixed) : { images: 0, masks: 0, other: 0 };
    return Object.assign({ budget: ST ? ST.pack.budget.bytes : 0, fixed: f, cache: z.c, borrowed: z.b, scratch: SCR, total: total(), entries: { cached: z.nc, pinned: z.nb }, handles: HANDLES.size }, CNT);
  }
  function release() {   // everything back: every canvas 0 x 0, every handle dead, draw false until load()
    GEN++; for (const kv of [...CACHE]) drop(kv[0], kv[1]); for (const h of [...HANDLES]) { h.dead = true; h.canvas = null; }
    HANDLES.clear(); GONEK.clear(); if (ST) { kill(ST.lanC); kill(ST.lanL); } kill(COMP); kill(LC); COMP = LC = null; SCR = 0;
    ST = null; LOADING = null; CNT = ZERO();
  }

  window.Char2 = Object.freeze({ version: 'g3.4', load, look, actor, tick, draw, anchor, light, sheet, portrait: (app, dc) => sheet(app, dc, 'portrait'), encode, decode, stats, trim, release,
    _test: Object.freeze({ packOk, kidMaskOk, holdOk, state: () => (ST ? { key: ST.key, idleFrom: ST.idleFrom, walkFrom: ST.walkFrom, raw: ST.raw.slice(), holdOn: ST.holdOn } : null) }) });
})();
