/* char2.js — Lantern Academy character renderer v2 (G3 · Claude · stage G3.2: pack · load · look · fallbacks)
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

  let LOADING = null;   // the one load promise (until release)
  let ST = null;        // loaded state
  const ZERO = () => ({ hit: 0, miss: 0, evict: 0, refused: 0, rebuilt: 0, peak: 0 });
  let CNT = ZERO();

  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const isInt = (v) => Number.isInteger(v);
  const isPt = (p, lim) => Array.isArray(p) && p.length === 2 && p.every((v) => isInt(v) && v >= 0 && v < lim);
  const HEX = /^#[0-9A-F]{6}$/;

  // ---------- pack check (any doubt -> not ready) ----------
  function packOk(p) {
    try {
      if (!isObj(p) || p.schema !== 'c2-pack/1' || typeof p.set !== 'string' || !isInt(p.cell) || p.cell < 8) return false;
      const C = p.cell;
      if (!isPt(p.feet, C) || !Array.isArray(p.dirs) || p.dirs.length !== 8 || new Set(p.dirs).size !== 8) return false;
      for (const k of ['idle', 'walk', 'walkhold']) {
        const s = p.sheets && p.sheets[k];
        if (!isObj(s) || typeof s.src !== 'string' || typeof s.mask !== 'string' || !isInt(s.frames) || s.frames < 1 ||
            !Array.isArray(s.size) || s.size[0] !== s.frames * C || s.size[1] !== 8 * C) return false;
      }
      const b = p.sheets.idle.breathe;
      if (b && !(p.dirs.includes(b.dir) && isInt(b.frame) && b.frame >= 0 && b.frame < p.sheets.idle.frames && isInt(b.cut) && b.cut > 0 && b.cut < C)) return false;
      for (const g of GROUPS) {
        const L = p.palette && p.palette[g];
        if (!Array.isArray(L) || !L.length) return false;
        const n = L[0][1] && L[0][1].length;
        if (!L.every((e) => Array.isArray(e) && typeof e[0] === 'string' && Array.isArray(e[1]) && e[1].length === n && e[1].every((h) => HEX.test(h)))) return false;
      }
      if (!isObj(p.bases) || !Object.keys(p.bases).length) return false;
      for (const k in p.bases) {
        const B = p.bases[k];
        if (!isObj(B) || (B.gender !== 'f' && B.gender !== 'm') || !isObj(B.parts) || !isObj(B.defaults)) return false;
        if (!SLOT_NEED.every((s) => Array.isArray(B.parts[s]) && B.parts[s].length && B.parts[s].every((x) => typeof x === 'string'))) return false;
        if (!SLOT_OPT.every((s) => B.parts[s] === undefined || (Array.isArray(B.parts[s]) && B.parts[s].every((x) => typeof x === 'string')))) return false;
        if (!['hair', 'iris', 'skin'].every((g) => colourIx(p, g, B.defaults[g]) >= 0)) return false;
      }
      if (!Array.isArray(p.deprecated) || !isObj(p.render_offset) || !p.dirs.every((d) => isInt(p.render_offset[d]) && Math.abs(p.render_offset[d]) <= 8)) return false;
      const t = p.timing, e = p.ease, L = p.lantern;
      if (!isObj(t) || !isInt(t.walk_ms) || !isInt(t.idle_ms) || !Array.isArray(t.idle_loop) || !Array.isArray(t.blink_dirs)) return false;
      if (!isObj(e) || !isInt(e.max_px) || !isInt(e.window_ms)) return false;
      if (!isObj(L) || !isInt(L.cell) || !isPt(L.grip, L.cell) || !isPt(L.light_centre, L.cell) || !isPt(L.n_hole, C) || !isObj(L.power_light)) return false;
      if (!isObj(p.materials) || !isObj(p.materials.recolour) || !isObj(p.budget) || !isInt(p.budget.bytes) || !isInt(p.budget.borrow_max)) return false;
      for (const id in p.materials.recolour) if (!GROUPS.includes(p.materials.recolour[id])) return false;
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
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] === 0) { if (m[i + 3] !== 0) return false; continue; }
        const id = m[i], g = m[i + 1];
        if (m[i + 3] !== 255 || id < 1 || id > 11) return false;
        if (R[id] !== undefined) { const s = smap.materials && smap.materials[id]; if (!s || !Array.isArray(s.shade_index_by_G) || !(g < s.shade_index_by_G.length)) return false; }
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
  function holdOk(p, j) {   // c2-pilot-hold-anchors.json: cell / feet as the pack, every direction has the right frame count, points inside the cell
    try {
      const C = p.cell;
      if (!isObj(j) || j.schema !== 1 || !Array.isArray(j.cell) || j.cell[0] !== C || j.cell[1] !== C || !isPt(j.feet, C) || j.feet[0] !== p.feet[0] || j.feet[1] !== p.feet[1]) return false;
      for (const [key, n] of [['idle_hold', p.sheets.idle.frames], ['walk_hold', p.sheets.walkhold.frames]]) {
        if (!isObj(j[key])) return false;
        for (const d of p.dirs) {
          const L = j[key][d];
          if (!Array.isArray(L) || L.length !== n) return false;
          for (const f of L) {
            if (!isObj(f)) return false;
            if (f.anchor === null) continue;   // N: hand under the cape, no lantern (D-HAND)
            if (!isPt(f.anchor, C) || !Array.isArray(f.fist) || !f.fist.every((q) => isPt(q, C))) return false;
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
    LOADING = doLoad(packUrl).catch(() => ({ ready: false, failed: ['internal'], pack: null }));
    return LOADING;
  }
  async function doLoad(packUrl) {
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
    const hold = holdOk(p, hj.j) ? hj.j : null; if (!hold) failed.push('hold');
    const lanA = pixels(lb, L.cell, L.cell), lanL = pixels(ll, L.cell, L.cell);
    if (!lanA) failed.push('lantern'); if (!lanL) failed.push('lantern-light');
    if (lanA) fixed.other += lanA.data.length; if (lanL) fixed.other += lanL.data.length;
    const holdOn = !!(hold && lanA && sh.walkhold && sh.idle);
    // portrait (used from G3.4): missing image -> no portrait; mask / meta / shade map wrong -> portrait as drawn
    const P = p.portrait, [pw, ph] = P.size;
    const [pi, pm, pj, ps] = await Promise.all([getImg(at(P.src)), getImg(at(P.mask)), getJSON(at(P.mask_meta)), getJSON(at(P.shademap))]);
    const PA = pixels(pi, pw, ph); let PM = PA ? pixels(pm, pw, ph) : null;
    if (!PA) failed.push('portrait');
    else if (!(PM && isObj(pj.j) && isObj(ps.j) && ptMaskOk(p, PA, PM, pj.j, ps.j))) { PM = null; failed.push('portrait-mask'); }
    if (PA) fixed.images += PA.data.length; if (PM) fixed.masks += PM.data.length;
    ST = { pack: deepFreeze(p), key: p.id + '@' + p.version + '#' + hashText(t), sh, idleFrom, walkFrom, raw: raw.sort(), hold, holdOn,
           lantern: lanA ? { A: lanA, light: lanL } : null, portrait: PA ? { A: PA, M: PM, meta: pj.j, smap: ps.j } : null, fixed };
    CNT.peak = Math.max(CNT.peak, total());
    return { ready: true, failed: failed.sort(), pack: ST.pack,
             modes: { idle: idleFrom, walk: walkFrom, raw: ST.raw.slice(), hold: holdOn, lantern_light: !!lanL, portrait: PA ? (PM ? 'recolour' : 'raw') : null } };
  }
  function deepFreeze(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; }

  // ---------- look: a save (read only) -> a NEW Appearance, or null = the old system draws ----------
  const ix = (v, n) => (isInt(v) && v >= 0 && v < n ? v : null);
  function pd219Look(o) { return isObj(o) && o.v === 1 && PD219_PARTS.every((k) => isInt(o[k]) && o[k] >= 1); }   // game check with the paper-doll pack not loaded
  function look169Valid(a) {
    return isObj(a) && a.v === 1 && ix(a.hair, 3) !== null && ix(a.face, 3) !== null && ix(a.hc, HAIRC.length) !== null && ix(a.ec, EYEC.length) !== null;
  }
  function look(save) {
    if (!ST || !isObj(save)) return null;
    const p = ST.pack, c = save.char2;
    if (isObj(c) && c.v === 2 && c.set === p.set) return fromChar2(p, c);   // other v / set -> read the old fields (they are never changed)
    return fromOld(p, save);
  }
  function fromChar2(p, c) {
    const B = p.bases[c.base]; if (!isObj(B)) return null;                 // no art for that base
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

  // ---------- stats / release ----------
  function total() { return ST ? ST.fixed.images + ST.fixed.masks + ST.fixed.other : 0; }
  function stats() {
    const f = ST ? Object.assign({}, ST.fixed) : { images: 0, masks: 0, other: 0 };
    return Object.assign({ budget: ST ? ST.pack.budget.bytes : 0, fixed: f, cache: 0, borrowed: 0, scratch: 0, total: total(),
                           entries: { cached: 0, pinned: 0 }, handles: 0 }, CNT);
  }
  function release() { ST = null; LOADING = null; CNT = ZERO(); }

  window.Char2 = Object.freeze({ version: 'g3.2', load, look, stats, release,
    _test: Object.freeze({ packOk, kidMaskOk, holdOk, state: () => (ST ? { key: ST.key, idleFrom: ST.idleFrom, walkFrom: ST.walkFrom, raw: ST.raw.slice(), holdOn: ST.holdOn } : null) }) });
})();
