// G4.6: the scene numbers of the phone bench (qa/g4/phone_bench.js v6, hook()) checked as properties.
//   node qa/g4/phone_bench_scene_test.js          exit 0 = every property held
// Codex T50-N2: v5 counted "things", and a plant with rows cut out of it counted as several — the number went UP when commands
// were taken away. This test takes the counting code out of phone_bench.js itself (not a copy of it) and runs it on made-up
// scenes (sprites from a few sheets, many of them the same cell side by side, some flipped, some drawn with the short forms):
//   1. wind     the scene drawn whole, and the same scene with any of its sprites drawn in 3 px rows (what the farm does when a
//               plant leans), give the same rows and the same objects, and no missing rows
//   2. removal  taking any commands away never makes rows or objects go up
//   3. inside   cutting a row out of the inside of a sprite that is drawn in rows adds missing rows and leaves the objects as they were
// It says nothing about the real game's scenes; qa/g4/phone_bench_selftest.js does that part in a browser.
'use strict';
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'phone_bench.js'), 'utf8');
const once = (a) => { const i = src.indexOf(a); if (i < 0 || src.indexOf(a, i + 1) >= 0) throw new Error('not exactly once in phone_bench.js: ' + a); return i; };
const STATE = '    let oi = null, ox = 0, ow = 0, oe = 0, oo = 0;', HEAD = 'ctx.drawImage = function (img, sx, sy, sw, sh, dx, dy, dw, dh) { EV.all++;', TAIL = '      if (inP) { if (!n) thin';
once(STATE); const body = src.slice(once(HEAD) + HEAD.length, once(TAIL));
// the bench's own lines, with the two things they read from around them: inP (0 = not inside drawPlayer) and the old shadow sheets
const counter = () => { const EV = { all: 0, rows: 0, obj: 0, gap: 0 }, PS = { shS: {}, shW: {} };
  const f = new Function('EV', 'PS', STATE + ' const inP = 0; return function (img, sx, sy, sw, sh, dx, dy, dw, dh) { ' + body + ' };')(EV, PS);
  return (cmds) => { for (const c of cmds) f.apply(null, c); return { rows: EV.rows, obj: EV.obj, gap: EV.gap }; }; };
const count = (cmds) => counter()(cmds);

let seed = 20261116; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, int = (n) => Math.floor(rnd() * n);
const SHEETS = [{ height: 600 }, { height: 600 }, { height: 300 }];
// a sprite: a cell of a sheet placed on the screen. Cells repeat (rows of the same crop), also at the same y.
function scene() { const cells = [], n = 4 + int(8); for (let i = 0; i < n; i++) cells.push({ img: SHEETS[int(3)], sx: 16 * int(6), sy: 8 * int(30), sw: 8 + int(60), sh: 5 + int(90) });
  // some cells sit right under another one in the same column of the sheet (same sx and sw)
  for (let i = 0; i < 3; i++) { const c = cells[int(cells.length)]; cells.push({ img: c.img, sx: c.sx, sy: c.sy + c.sh, sw: c.sw, sh: 5 + int(40) }); }
  const out = [], m = 20 + int(120); let y = int(400);
  for (let i = 0; i < m; i++) { const c = cells[int(cells.length)], kind = rnd(); if (rnd() < 0.6) y = int(400);   // 40 %: the same y as the sprite before
    if (kind < 0.06) out.push({ short: 3, img: c.img, x: int(900), y }); else if (kind < 0.1) out.push({ short: 5, img: c.img, x: int(900), y, w: c.sw, h: c.sh });
    else out.push({ c, x: int(900), y, flip: rnd() < 0.2, lean: 1 + int(9) }); }
  return out; }
// the commands of a sprite: whole, or in 3 px rows exactly as g9bSway does (flipped ones are drawn at 0,0 under a transform)
function draw(s, rows) { if (s.short === 3) return [[s.img, s.x, s.y]]; if (s.short === 5) return [[s.img, s.x, s.y, s.w, s.h]];
  const o = s.c, bx = s.flip ? 0 : s.x, by = s.flip ? 0 : s.y, sg = s.flip ? -1 : 1;
  if (!rows) return [[o.img, o.sx, o.sy, o.sw, o.sh, bx, by, o.sw, o.sh]];
  const out = []; for (let r = 0; r < o.sh; r += 3) { const hh = Math.min(3, o.sh - r), dx = Math.round(s.lean * Math.pow(1 - r / o.sh, 1.7)); out.push([o.img, o.sx, o.sy + r, o.sw, hh, bx + sg * dx, by + r, o.sw, hh]); }
  return out; }
const flat = (sc, pick) => [].concat(...sc.map((s, i) => draw(s, pick(i))));

const N = { scenes: 0, wind: 0, removal: 0, inside: 0 }, bad = [];
for (let t = 0; t < 400; t++) { const sc = scene(), whole = count(flat(sc, () => false)); N.scenes++;
  // 1. wind
  for (let k = 0; k < 6; k++) { const p = k === 0 ? 1 : rnd(), mask = sc.map(() => rnd() < p), a = count(flat(sc, (i) => mask[i])); N.wind++;
    if (a.rows !== whole.rows || a.obj !== whole.obj || a.gap !== 0 || whole.gap !== 0) bad.push(['wind', t, k, whole, a]); }
  // 2. removal: one command, a few, every third, every other, a random half — from the scene drawn in any mix of whole and rows
  for (let k = 0; k < 12; k++) { const mask = sc.map(() => rnd() < 0.6), cmds = flat(sc, (i) => mask[i]), base = count(cmds);
    const how = k % 6, one = int(cmds.length), few = new Set([0, 0, 0, 0, 0].map(() => int(cmds.length))), ph = int(3);
    const kept = cmds.filter((c, i) => how === 0 ? i !== one : how === 1 ? !few.has(i) : how === 2 ? i % 3 !== ph : how === 3 ? i % 2 !== ph % 2 : how === 4 ? rnd() < 0.5 : rnd() < 0.9), a = count(kept); N.removal++;
    if (kept.length < cmds.length ? !(a.rows <= base.rows && a.obj <= base.obj) : !(a.rows === base.rows && a.obj === base.obj)) bad.push(['removal', t, k, how, base, a]);
    if (how === 2 && kept.length < cmds.length && a.rows === base.rows) bad.push(['removal took no rows', t, k]); }
  // 3. inside: one row out of the inside of one sprite drawn in rows (not its first and not its last)
  for (let k = 0; k < 4; k++) { const tall = sc.map((s, i) => (s.c && s.c.sh > 9 ? i : -1)).filter((i) => i >= 0); if (!tall.length) break; const who = tall[int(tall.length)];
    const parts = sc.map((s, i) => draw(s, i === who)), base = count([].concat(...parts)), at = 1 + int(parts[who].length - 2), gone = parts[who][at][4];
    parts[who].splice(at, 1); const a = count([].concat(...parts)); N.inside++;
    if (!(a.gap === base.gap + gone && a.obj === base.obj && a.rows === base.rows - gone)) bad.push(['inside', t, k, base, a, gone]); } }
console.log(JSON.stringify({ checked: N, failed: bad.length, first: bad.slice(0, 3) }));
process.exit(bad.length ? 1 : 0);
