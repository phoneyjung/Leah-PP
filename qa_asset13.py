#!/usr/bin/env python3
# Claude's QA for ASSET_SPEC_13 (G2.5a lantern L0) - part S trial, spec section 7 (Claude · 17 Oct 2569). Read-only on the delivered files.
# usage: python3 -I qa_asset13.py DIR_WITH_4_FILES HOLD_ANCHORS_JSON OUT_JSON
import sys, os, json, math, hashlib, collections
import numpy as np
from PIL import Image

D, ANCH, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
BASE = 'c2-held-lantern_L0-S-trial'
GRIP = (16, 6)
PLUM = (0x3A, 0x1E, 0x3F); COPPER = [(0x3D, 0x29, 0x2C), (0x67, 0x41, 0x3A), (0x91, 0x5B, 0x49), (0xBB, 0x7A, 0x57)]
GOLD = (0xFF, 0xC8, 0x57); CYAN = (0x5F, 0xE0, 0xFF); GLASS_L = (0xFF, 0xB3, 0x6B); CRYS_L = (0xFF, 0xF0, 0xC9)   # light layer: glass #FFB36B · crystal #FFF0C9 (spec 13 section 1)

def lab(c):
    r, g, b = [v / 255 for v in c]
    f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    r, g, b = f(r), f(g), f(b)
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047; Y = 0.2126 * r + 0.7152 * g + 0.0722 * b; Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    t = lambda v: v ** (1 / 3) if v > 0.008856 else 7.787 * v + 16 / 116
    return 116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))

def de00(a, b):
    L1, a1, b1 = lab(a); L2, a2, b2 = lab(b); C1 = math.hypot(a1, b1); C2 = math.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7))); a1p = (1 + G) * a1; a2p = (1 + G) * a2; C1p = math.hypot(a1p, b1); C2p = math.hypot(a2p, b2)
    h1 = math.degrees(math.atan2(b1, a1p)) % 360; h2 = math.degrees(math.atan2(b2, a2p)) % 360; dL = L2 - L1; dC = C2p - C1p; dh = h2 - h1
    if C1p * C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2)); Lb = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hb = (h1 + h2) / 2 if abs(h1 - h2) <= 180 else ((h1 + h2 + 360) / 2 if h1 + h2 < 360 else (h1 + h2 - 360) / 2)
    T = 1 - 0.17 * math.cos(math.radians(hb - 30)) + 0.24 * math.cos(math.radians(2 * hb)) + 0.32 * math.cos(math.radians(3 * hb + 6)) - 0.20 * math.cos(math.radians(4 * hb - 63))
    dth = 30 * math.exp(-((hb - 275) / 25) ** 2); RC = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2); SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T; RT = -math.sin(math.radians(2 * dth)) * RC
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))

def hexc(c): return '#%02X%02X%02X' % tuple(int(v) for v in c[:3])

R = {'checks': []}
def ok(name, cond, val): R['checks'].append({'check': name, 'pass': bool(cond), 'value': val})

paths = {k: os.path.join(D, BASE + s) for k, s in (('png', '.png'), ('light', '-light.png'), ('json', '.json'), ('x8', '-x8.png'))}
ok('1a 4 files present', all(os.path.exists(p) for p in paths.values()), {k: os.path.exists(p) for k, p in paths.items()})
im = Image.open(paths['png']); li = Image.open(paths['light']); x8 = Image.open(paths['x8'])
ok('1b sizes 32x32 / 32x32 / 256x256', im.size == (32, 32) and li.size == (32, 32) and x8.size == (256, 256), [im.size, li.size, x8.size])
a = np.array(im.convert('RGBA')).astype(int); l = np.array(li.convert('RGBA')).astype(int)
al = a[..., 3]; ll = l[..., 3]
ok('1c alpha only 0/255 (base and light)', set(np.unique(al)) <= {0, 255} and set(np.unique(ll)) <= {0, 255}, {'base': sorted(set(np.unique(al).tolist())), 'light': sorted(set(np.unique(ll).tolist()))})
# connected components (8- and 4-neighbour) of opaque base pixels
def comps(mask, eight):
    seen = np.zeros_like(mask, bool); n = 0
    nb = [(-1, 0), (1, 0), (0, -1), (0, 1)] + ([(-1, -1), (-1, 1), (1, -1), (1, 1)] if eight else [])
    for y in range(32):
        for x in range(32):
            if mask[y, x] and not seen[y, x]:
                n += 1; st = [(y, x)]; seen[y, x] = True
                while st:
                    cy, cx = st.pop()
                    for dy, dx in nb:
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < 32 and 0 <= xx < 32 and mask[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; st.append((yy, xx))
    return n
op = al > 0
ok('1d one piece (4-neighbour and 8-neighbour)', comps(op, False) == 1 and comps(op, True) == 1, {'4n': comps(op, False), '8n': comps(op, True)})
ys, xs = np.nonzero(op); bb = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
w, h = bb[2] - bb[0], bb[3] - bb[1]; below = bb[3] - 1 - GRIP[1]; above = GRIP[1] - bb[1]
# outside transparent region (flood fill from the border) -> holes = transparent pixels not reachable
out = np.zeros_like(op); st = [(y, x) for y in range(32) for x in (0, 31)] + [(y, x) for x in range(32) for y in (0, 31)]
st = [(y, x) for y, x in st if not op[y, x]]
for y, x in st: out[y, x] = True
while st:
    cy, cx = st.pop()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        yy, xx = cy + dy, cx + dx
        if 0 <= yy < 32 and 0 <= xx < 32 and not op[yy, xx] and not out[yy, xx]: out[yy, xx] = True; st.append((yy, xx))
holes = [(int(x), int(y)) for y, x in zip(*np.nonzero(~op & ~out))]
hc = (float(np.mean([p[0] for p in holes])), float(np.mean([p[1] for p in holes]))) if holes else None
ring_rows = range(bb[1], (max(p[1] for p in holes) + 2) if holes else bb[1] + 5)
ring_w = max(int(np.nonzero(op[y])[0].max() - np.nonzero(op[y])[0].min() + 1) for y in ring_rows if op[y].any())
ok('2 size: w 11-13, h 17-18, below grip <= 15, above <= 3, ring <= 5', 11 <= w <= 13 and 17 <= h <= 18 and below <= 15 and above <= 3 and ring_w <= 5,
   {'bbox': bb, 'w': w, 'h': h, 'below_grip': below, 'above_grip': above, 'ring_w': ring_w})
ok('3 ring hole hollow, centre within 0.5 px per axis of [16,6], contains (16,6)', bool(holes) and abs(hc[0] - 16) <= 0.5 and abs(hc[1] - 6) <= 0.5 and (16, 6) in holes,
   {'hole_px': holes, 'centre': hc})
cols = collections.Counter(tuple(int(v) for v in p[:3]) for p in a[op])
mind = lambda ref: min(de00(c, ref) for c in cols)
metal = [c for c in cols if c in COPPER]
outer = [(x, y) for y, x in zip(*np.nonzero(op)) if any(0 <= y + dy < 32 and 0 <= x + dx < 32 and out[y + dy, x + dx] or not (0 <= y + dy < 32 and 0 <= x + dx < 32) for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)))]
plum_outer = sum(1 for x, y in outer if tuple(a[y, x, :3]) == PLUM)
ok('4 colours: gold/cyan dE00 >= 10, base vs light colours >= 5, copper vs #FFB36B >= 10, outer edge plum >= 90 %',
   mind(GOLD) >= 10 and mind(CYAN) >= 10 and mind(GLASS_L) >= 5 and mind(CRYS_L) >= 5 and all(de00(c, GLASS_L) >= 10 for c in metal) and plum_outer >= 0.9 * len(outer),
   {'min_dE_gold': round(mind(GOLD), 2), 'min_dE_cyan': round(mind(CYAN), 2), 'min_dE_FFB36B': round(mind(GLASS_L), 3), 'min_dE_FFF0C9': round(mind(CRYS_L), 3),
    'copper_min_dE_FFB36B': round(min(de00(c, GLASS_L) for c in metal), 2) if metal else None, 'outer_plum': '%d/%d' % (plum_outer, len(outer)), 'n_colours': len(cols)})
lop = ll > 0
lcols = collections.Counter(tuple(int(v) for v in p[:3]) for p in l[lop])
under = [tuple(int(v) for v in a[y, x, :3]) for y, x in zip(*np.nonzero(lop))]
on_glass = all(op[y, x] and tuple(a[y, x, :3]) != PLUM and tuple(a[y, x, :3]) not in COPPER for y, x in zip(*np.nonzero(lop)))
n_glass = lcols.get(GLASS_L, 0); n_crys = lcols.get(CRYS_L, 0)
ok('5 light layer: only #FFB36B / #FFF0C9, every light px on a glass/crystal base px (not plum, not copper), crystal 2-6 px',
   set(lcols) <= {GLASS_L, CRYS_L} and on_glass and 2 <= n_crys <= 6,
   {'colours': {hexc(c): n for c, n in lcols.items()}, 'on_glass': on_glass, 'glass': n_glass, 'crystal': n_crys, 'base_under_light': sorted({hexc(c) for c in under})})
J = json.load(open(paths['json']))
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
jok = (J.get('grip') == [16, 6] and J.get('bbox_xyxy_exclusive') == bb and J.get('size') == [w, h] and J.get('below_grip') == below and J.get('above_grip') == above
       and sorted(map(tuple, J.get('ring_hole_px', []))) == sorted(holes) and J.get('light_px') == {'glass': n_glass, 'crystal': n_crys}
       and sorted(J.get('colors', [])) == sorted(hexc(c) for c in cols) and J.get('sha256', {}).get('png') == sha(paths['png']) and J.get('sha256', {}).get('light') == sha(paths['light']))
ok('6 json matches the images (bbox, size, grip, hole, light counts, colours, sha256)', jok, {'json_bbox': J.get('bbox_xyxy_exclusive'), 'json_colors': len(J.get('colors', []))})
# x8 preview = the base image, nearest x8 (check opaque pixel colours at cell centres)
x = np.array(x8.convert('RGBA')).astype(int); mism = 0
for y in range(32):
    for xx in range(32):
        if op[y, xx] and tuple(x[y * 8 + 4, xx * 8 + 4, :3]) != tuple(a[y, xx, :3]): mism += 1
ok('6b x8 preview shows the same pixels (opaque centres)', mism == 0, mism)
# bottom row in the hand: drawn lantern bottom = anchor y - grip y + bottom row (D-EASE-STEP keeps the drawn position inside the targets' range)
A = json.load(open(ANCH)); bot = {}
for d in ('S', 'SE', 'E', 'NE', 'NW', 'W', 'SW'):
    yy = [f['anchor'][1] for k in ('idle_hold', 'walk_hold') for f in A[k][d]]
    bot[d] = max(yy) - GRIP[1] + (bb[3] - 1)
ok('7a lantern bottom row in the hand <= 92 (7 dirs, all 70 frames)', max(bot.values()) <= 92, bot)
R['measure'] = {'bbox': bb, 'size': [w, h], 'below_grip': below, 'above_grip': above, 'hole': holes, 'hole_centre': hc, 'ring_w': ring_w, 'colours': {hexc(c): n for c, n in cols.most_common()},
                'opaque_px': int(op.sum()), 'sha256': {k: sha(p) for k, p in paths.items()}}
json.dump(R, open(OUT, 'w'), indent=1, ensure_ascii=False)
for c in R['checks']: print(('PASS ' if c['pass'] else 'FAIL ') + c['check'] + ' :: ' + json.dumps(c['value'], ensure_ascii=False)[:300])
print('TOTAL %d/%d PASS' % (sum(c['pass'] for c in R['checks']), len(R['checks'])))
