# Draft v1.2 criteria rev2b (C2 also checks the base material, ChatGPT 22:34) · rev2 (Claude, scratch only, 17 Oct ~22:3x) per ChatGPT 22:19: C2 outer side must be glass / inner side glass or crystal, real 4-neighbour, dE vs the material actually touching;
# C4b contact allowed (side only), not required, counts reported; C2b layout B (owner choice); V5a/V5b helper numbers for the unlit-on-dark read. G1 report only.
# usage: python3 -I r2v12c.py LANTERN_DIR QA_ASSET13_PY FIX1_DIR
import sys, json, math
import numpy as np
from PIL import Image
src = open(sys.argv[2]).read(); ns = {'math': math}; exec(src[src.index('def lab'):src.index('def hexc')], ns); de00 = ns['de00']
B = 'c2-held-lantern_L0-S-trial'
ld = lambda d: (np.array(Image.open(d + '/' + B + '.png').convert('RGBA')).astype(int), np.array(Image.open(d + '/' + B + '-light.png').convert('RGBA')).astype(int))
a, l = ld(sys.argv[1]); f, fl = ld(sys.argv[3])
op = a[..., 3] > 0; lop = l[..., 3] > 0
COP = {(0x3D,0x29,0x2C),(0x67,0x41,0x3A),(0x91,0x5B,0x49),(0xBB,0x7A,0x57)}; PL = (0x3A,0x1E,0x3F); GL = (0xFF,0xB3,0x6B); CR = (0xFF,0xF0,0xC9); BG = (30, 27, 46)
col = lambda x, y: tuple(int(v) for v in a[y, x, :3]); lcol = lambda x, y: tuple(int(v) for v in l[y, x, :3])
iscop = lambda x, y: bool(op[y, x]) and col(x, y) in COP
cry = lop & np.all(l[..., :3] == CR, axis=2); gla = lop & np.all(l[..., :3] == GL, axis=2)
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
R = []
def ok(k, p, v): R.append((k, p, v))
def run(y):
    b = c = 0
    for x in range(32): c = c + 1 if iscop(x, y) else 0; b = max(b, c)
    return b
ok('C1 cap rows 10,11 copper run >= 9', run(10) >= 9 and run(11) >= 9, {10: run(10), 11: run(11)})
ok('C3 base rows 19,20 copper run >= 9', run(19) >= 9 and run(20) >= 9, {19: run(19), 20: run(20)})
ccx = float(np.nonzero(cry)[1].mean()) if cry.any() else 16.0
# C2: rib px = copper px, OUTER 4-neighbour (away from the crystal centre) is glass, INNER 4-neighbour is glass or crystal
rib = np.zeros((32, 32), bool)
for y in range(1, 31):
    for x in range(1, 31):
        if not iscop(x, y): continue
        so = -1 if x < ccx else 1   # outer direction
        mat = lambda xx: bool(op[y, xx]) and col(xx, y) not in COP and col(xx, y) != PL   # base px is a glass/crystal material, not metal/outline
        if gla[y, x + so] and mat(x + so) and lop[y, x - so] and mat(x - so): rib[y, x] = True
cols = sorted(set(int(x) for x in np.nonzero(rib)[1]))
def vrun(x):
    b = c = 0
    for y in range(32): c = c + 1 if rib[y, x] else 0; b = max(b, c)
    return b
L = [x for x in cols if x < ccx]; Rr = [x for x in cols if x > ccx]
pairs = []
for y, x in zip(*np.nonzero(rib)):
    for dx, dy in N4:
        if lop[y + dy, x + dx]: pairs.append(('crystal' if cry[y + dy, x + dx] else 'glass', de00(col(x + dx, y + dy), col(x, y)), de00(lcol(x + dx, y + dy), col(x, y))))
mn = lambda kind, i: round(min(p[i] for p in pairs if kind in (None, p[0])), 2) if any(kind in (None, p[0]) for p in pairs) else None
c2 = len(L) == 1 and len(Rr) == 1 and vrun(L[0]) >= 4 and vrun(Rr[0]) >= 4 and pairs and mn(None, 1) >= 15 and mn(None, 2) >= 15
ok('C2 ribs: 1 left + 1 right column; outer 4-nbr = glass (light #FFB36B AND base not metal/plum), inner 4-nbr = glass/crystal (light AND base not metal); run >= 4; dE00 >= 15 vs every touching glass/crystal px, unlit and lit', bool(c2),
   {'rib_cols_run': {x: vrun(x) for x in cols}, 'pairs': len(pairs), 'glass_min_unlit_lit': [mn('glass', 1), mn('glass', 2)], 'crystal_min_unlit_lit': [mn('crystal', 1), mn('crystal', 2)]})
def gw(y, x0, step):
    n = 0; x = x0 + step
    while 0 <= x < 32 and gla[y, x]: n += 1; x += step
    return n
rows2 = sum(1 for y in range(32) if L and Rr and rib[y, L[0]] and rib[y, Rr[0]] and gw(y, L[0], -1) >= 2 and gw(y, Rr[0], 1) >= 2)
ok('C2b layout B (owner choice): glass outside each rib >= 2 px wide, both sides, in >= 4 rib rows', rows2 >= 4, {'rows': rows2, 'rib_cols': cols})
ys, xs = np.nonzero(cry)
above = all(gla[int(ys.min()) - 1, x] for x in xs[ys == ys.min()]); below = all(gla[int(ys.max()) + 1, x] for x in xs[ys == ys.max()])
frame_c = rv = lc = rc = 0
for y, x in zip(ys, xs):
    for dx, dy in N4:
        xx, yy = x + dx, y + dy
        if op[yy, xx] and not lop[yy, xx]:
            if rib[yy, xx]:
                if dy: rv += 1
                elif dx < 0: lc += 1
                else: rc += 1
            else: frame_c += 1
ok('C4a crystal: glass directly above top px and below bottom px; 0 contact with cap/base/outer frame', above and below and frame_c == 0,
   {'rows': [int(ys.min()), int(ys.max())], 'glass_above': bool(above), 'glass_below': bool(below), 'frame_contact': frame_c})
ok('C4b crystal-rib contact allowed side-only (not required): top/bottom contact 0; side contacts reported', rv == 0, {'left_side_contact': lc, 'right_side_contact': rc, 'top_bottom_contact': rv})
same48 = bool((a[4:9] == f[4:9]).all()); r9 = [int(x) for x in range(32) if (a[9, x] != f[9, x]).any()]
ok('G2 rows 4-8 = fix1; row 9 may only gain plum outline px', same48 and all(col(x, 9) == PL and f[9, x, 3] == 0 for x in r9), {'rows4_8_identical': same48, 'row9_changed_x': r9})
# V5 helpers vs the pilot dark background #1E1B2E (rows 10-21 only: ring/neck rows 4-9 are locked)
outer_pl = {(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) == PL and any(not op[y + dy, x + dx] for dx, dy in N4)}
rim = [(int(x), int(y)) for y, x in zip(*np.nonzero(op)) if y >= 10 and col(x, y) != PL and any((x + dx, y + dy) in outer_pl for dx, dy in N4)]
weak = [(x, y) for x, y in rim if de00(col(x, y), BG) < 20]
ok('V5a unlit edge: every inner-rim px (rows 10-21, just inside the plum outline) dE00 >= 20 vs dark bg #1E1B2E', not weak, {'rim_px': len(rim), 'weak': weak})
gl = [(int(x), int(y)) for y, x in zip(*np.nonzero(gla))]
gweak = sorted({'#%02X%02X%02X' % col(x, y) for x, y in gl if de00(col(x, y), BG) < 15})
ok('V5b unlit glass: every glass px (unlit colour) dE00 >= 15 vs dark bg', not gweak, {'glass_px': len(gl), 'weak_colours': gweak})
ok('G1 glass light px (report only)', None, int(gla.sum()))
for k, p, v in R: print(('INFO ' if p is None else 'PASS ' if p else 'FAIL ') + k + ' :: ' + json.dumps(v, default=str))
