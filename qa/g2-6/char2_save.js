// G2.6 A4 dry run (Claude · 1 Nov 2569) of DESIGN_CHAR2_SAVE_MIGRATION.md sections 2-4.
// NOT game code: it reads a COPY of a save and returns what S.char2 WOULD be. It never writes a save or touches localStorage.
// Colour tables = game 2.33 HAIRC / EYEC / AD208.order (same order, checked against index.html).
// pd219Look here = the game check with the paper-doll pack not loaded (PD219.ok false): v === 1 and the 5 parts are integers >= 1.
'use strict';
const HAIR = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'silver', 'green'];   // HAIRC order
const IRIS = ['brown', 'black', 'green', 'blue', 'amber'];                                // EYEC order
const SKIN = ['light', 'medium', 'tan', 'deep'];                                          // AD208.order
const DEF = { hair: 'brown', iris: 'green', skin: 'medium' };                              // _4 defaults (section 2)
const G194 = { f: [0, 1, 2], m: [3, 4, 5] };
const PD_P = ['hair', 'face', 'eyes', 'mouth', 'body'];

const ix = (v, n) => (Number.isInteger(v) && v >= 0 && v < n ? v : null);
function pd219Look(o) { return !!(o && typeof o === 'object' && o.v === 1 && PD_P.every(k => Number.isInteger(o[k]) && o[k] >= 1)); }
function look169Valid(a) {
  return !!(a && a.v === 1 && Number.isInteger(a.hair) && a.hair >= 0 && a.hair < 3 && Number.isInteger(a.face) && a.face >= 0 && a.face < 3 &&
    Number.isInteger(a.hc) && a.hc >= 0 && a.hc < HAIR.length && Number.isInteger(a.ec) && a.ec >= 0 && a.ec < IRIS.length);
}
function genderOf194(k) { return G194.m.includes(k) ? 'm' : 'f'; }

// one save slot (an object) -> { char2: object | null, why }
function char2FromSave(S) {
  if (!S || typeof S !== 'object') return { char2: null, why: 'not a save' };
  if (S.char2 && typeof S.char2 === 'object') return { char2: S.char2, why: 'exists (kept, not rebuilt)' };   // T12
  const gender = S.gender194 === 'f' || S.gender194 === 'm' ? S.gender194 : genderOf194(S.kid);
  if (gender !== 'f') return { char2: null, why: 'boy: no c2 base yet (old system keeps drawing)' };          // T8
  const src = [];                                                         // section 4 order; each colour picks separately
  if (pd219Look(S.pd219)) src.push(['pd219', S.pd219.hc, S.pd219.ec, S.pd219.tn]);
  if (look169Valid(S.appearance169)) src.push(['appearance169', S.appearance169.hc, S.appearance169.ec, undefined]);
  src.push(['hcol', S.hcol, S.ecol, undefined]);
  src.push(['hc', S.hc, S.ec, undefined]);
  const pick = (col, n) => { for (const s of src) { const v = ix(s[col], n); if (v !== null) return [v, s[0]]; } return [null, 'default']; };
  const [h, hFrom] = pick(1, HAIR.length), [e] = pick(2, IRIS.length), [t] = pick(3, SKIN.length);
  return {
    char2: { v: 2, set: 'c2', base: 'kid4', gender: 'f',
      parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: null, face_acc: null, back: null },
      color: { hair: h === null ? DEF.hair : HAIR[h], iris: e === null ? DEF.iris : IRIS[e], skin: t === null ? DEF.skin : SKIN[t] },
      from: hFrom },
    why: 'made',
  };
}

// a COPY of localStorage (plain object key -> string) -> slots, read the same way as game 2.33 Store.all()
function readSlots(ls) {
  try {
    let d = JSON.parse(ls['leahpp2d-slots'] || 'null');
    if (!d) { const o = JSON.parse(ls['leahpp2d-v1'] || 'null'); d = { v: 2, slots: o ? [o] : [], cur: o ? 0 : -1 }; }
    return d;
  } catch (e) { return { v: 2, slots: [], cur: -1 }; }
}

module.exports = { char2FromSave, readSlots, HAIR, IRIS, SKIN, DEF };
