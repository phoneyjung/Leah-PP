#!/usr/bin/env python3
# Claude's QA for ASSET_SPEC_13 (G2.5a lantern L0) - part S trial, spec section 7 (Claude · 17 Oct 2569). Read-only on the delivered files.
# usage: python3 -I qa_asset13.py DIR_WITH_4_FILES HOLD_ANCHORS_JSON OUT_JSON [1.1|1.2 [BEFORE_DIR]]
#   no 4th arg = spec v1 (crystal 2-6 px) · '1.1' = spec v1.1 section 9 (crystal 6-8 px + checks 8a-8d; with BEFORE_DIR also 9 unchanged-frame and 10 compare sheet)
#   '1.2' = spec v1.2 section 10 (B2, 17 Oct): 13 kept checks + C1 C2 C2b C3 C4a C4b G2 G3 V5a V5b + 10' (fix2 compare sheet) = 24 gates; BEFORE_DIR = fix1 (12948e2); G1 report only
import sys, os, json, math, hashlib, collections
import numpy as np
from PIL import Image

D, ANCH, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
V12 = len(sys.argv) > 4 and sys.argv[4] == '1.2'; V11 = len(sys.argv) > 4 and sys.argv[4] in ('1.1', '1.2'); BEFORE = sys.argv[5] if len(sys.argv) > 5 else None
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
CR = (6, 8) if V11 else (2, 6)
ok('5 light layer: only #FFB36B / #FFF0C9, every light px on a glass/crystal base px (not plum, not copper), crystal %d-%d px' % CR,
   set(lcols) <= {GLASS_L, CRYS_L} and on_glass and CR[0] <= n_crys <= CR[1],
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
if V11:   # spec 13 v1.1 section 9
    BRIGHT = COPPER[1:]   # #67413A #915B49 #BB7A57
    def runs(y, pal):   # longest run of horizontally adjacent pixels whose colour is in pal
        best = cur = 0
        for xx in range(32):
            cur = cur + 1 if op[y, xx] and tuple(a[y, xx, :3]) in pal else 0; best = max(best, cur)
        return best
    gl_rows = sorted(set(int(y) for y in np.nonzero(lop)[0])); gtop = gl_rows[0]
    above_rows = {y: runs(y, COPPER) for y in range(bb[1], gtop)}
    if not V12: ok('8a cap rim: row directly above the glass has >= 7 adjacent copper px', runs(gtop - 1, COPPER) >= 7,
       {'glass_top_row': gtop, 'row': gtop - 1, 'run_copper4': runs(gtop - 1, COPPER), 'run_bright3': runs(gtop - 1, BRIGHT), 'all_rows_above': above_rows})
    bot3 = {y: runs(y, COPPER) for y in range(bb[3] - 3, bb[3])}
    if not V12: ok('8b base band: a bottom-3 row has >= 5 adjacent copper px, bbox still [10,4,23,22]', max(bot3.values()) >= 5 and bb == [10, 4, 23, 22],
       {'bottom3_run_copper4': bot3, 'bottom3_run_bright3': {y: runs(y, BRIGHT) for y in bot3}, 'bbox': bb})
    pairs = []
    for y, xx in zip(*np.nonzero(lop)):
        lc = tuple(int(v) for v in l[y, xx, :3]); uc = tuple(int(v) for v in a[y, xx, :3])
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            yy, x2 = y + dy, xx + dx
            if 0 <= yy < 32 and 0 <= x2 < 32 and op[yy, x2] and not lop[yy, x2] and tuple(a[yy, x2, :3]) in BRIGHT:
                cc = tuple(int(v) for v in a[yy, x2, :3]); pairs.append(((int(xx), int(y)), (int(x2), int(yy)), de00(uc, cc), de00(lc, cc)))
    mu = min(p[2] for p in pairs) if pairs else None; ml = min(p[3] for p in pairs) if pairs else None
    ok('8c glass/copper separation: every 4-adjacent pair (light-layer px, bright copper px) dE00 >= 10 unlit and lit', bool(pairs) and mu >= 10 and ml >= 10,
       {'pairs': len(pairs), 'min_dE_unlit': round(mu, 4) if pairs else None, 'min_dE_lit': round(ml, 4) if pairs else None,
        'worst_unlit': [p[:2] for p in sorted(pairs, key=lambda p: p[2])[:3]]})
    cm = np.zeros((32, 32), bool)
    for y, xx in zip(*np.nonzero(lop)):
        if tuple(int(v) for v in l[y, xx, :3]) == CRYS_L: cm[y, xx] = True
    cy, cx = np.nonzero(cm); cw = int(cx.max() - cx.min() + 1); chh = int(cy.max() - cy.min() + 1)
    widths = [int(cm[y].sum()) for y in range(int(cy.min()), int(cy.max()) + 1)]
    contig = all(cm[y].sum() == 0 or (np.nonzero(cm[y])[0].max() - np.nonzero(cm[y])[0].min() + 1 == cm[y].sum()) for y in range(32))
    tones = collections.defaultdict(list)
    for y, xx in zip(cy, cx): tones[tuple(int(v) for v in a[y, xx, :3])].append((int(xx), int(y)))
    tl = None
    if len(tones) == 2:
        (c1, p1), (c2, p2) = sorted(tones.items(), key=lambda kv: -lab(kv[0])[0])   # c1 = lighter
        m1 = (np.mean([p[0] for p in p1]), np.mean([p[1] for p in p1])); m2 = (np.mean([p[0] for p in p2]), np.mean([p[1] for p in p2]))
        tl = {'light': hexc(c1), 'light_px': p1, 'dark': hexc(c2), 'dark_px': p2, 'light_centre': m1, 'dark_centre': m2, 'light_upper_left': m1[0] <= m2[0] and m1[1] <= m2[1] and m1 != m2}
    ok('8d crystal diamond: #FFF0C9 6-8 px, 3 wide x 4 tall, rows 1-3-3-1 (each row contiguous), unlit base under it = 2 tones, lighter tone upper-left',
       6 <= n_crys <= 8 and cw == 3 and chh == 4 and widths == [1, 3, 3, 1] and contig and tl is not None and tl['light_upper_left'],
       {'crystal_px': n_crys, 'w': cw, 'h': chh, 'row_widths': widths, 'rows_contiguous': contig, 'tones': tl or {hexc(c): len(p) for c, p in tones.items()}})
    if BEFORE:
        pb = os.path.join(BEFORE, BASE + '.png'); lb = os.path.join(BEFORE, BASE + '-light.png')
        b0 = np.array(Image.open(pb).convert('RGBA')).astype(int); bl = np.array(Image.open(lb).convert('RGBA')).astype(int)
        diff = [(int(xx), int(y)) for y, xx in zip(*np.nonzero((b0 != a).any(axis=2)))]
        bys, bxs = np.nonzero(b0[..., 3] > 0); bbb = [int(bxs.min()), int(bys.min()), int(bxs.max()) + 1, int(bys.max()) + 1]
        ring_same = all((b0[y, xx] == a[y, xx]).all() for y in range(bb[1], 10) for xx in range(32))   # ring + neck rows 4-9 untouched
        if not V12: ok('9 unchanged vs before: same bbox, same hole, ring/neck rows 4-9 identical, changes only inside the bbox',
           bbb == bb and ring_same and all(bb[0] <= p[0] < bb[2] and bb[1] <= p[1] < bb[3] for p in diff),
           {'bbox_before': bbb, 'bbox_after': bb, 'ring_neck_rows_identical': ring_same, 'base_px_changed': len(diff),
            'light_px_changed': int((bl != l).any(axis=2).sum()), 'opaque_before': int((b0[..., 3] > 0).sum()), 'opaque_after': int(op.sum())})
        cmp_p = os.path.join(D, BASE + ('-fix2-compare-x8.png' if V12 else '-fix1-compare-x8.png'))
        if os.path.exists(cmp_p):
            C = np.array(Image.open(cmp_p).convert('RGBA')).astype(int)
            def lit(base, light):
                o = base.copy(); m = light[..., 3] > 0; o[m] = light[m]; return o
            def x8n(img): return np.repeat(np.repeat(img, 8, axis=0), 8, axis=1)
            panels = {'before_unlit': (0, 32, b0), 'after_unlit': (256, 32, a), 'before_lit': (0, 320, lit(b0, bl)), 'after_lit': (256, 320, lit(a, l))}
            bad = {}
            for k, (px, py, img) in panels.items():
                ref = x8n(img); sub = C[py:py + 256, px:px + 256]; m = ref[..., 3] > 0
                bad[k] = int((sub[m][:, :3] != ref[m][:, :3]).any(axis=1).sum()) if sub.shape[:2] == (256, 256) else -1
            ok(('10\' ' if V12 else '10 ') + 'compare-x8 sheet: 512x576, 4 panels = nearest x8 of before/after unlit/lit (opaque px exact)', C.shape[:2] == (576, 512) and all(v == 0 for v in bad.values()),
               {'size': [C.shape[1], C.shape[0]], 'mismatched_px': bad})
        else:
            ok(('10\' ' if V12 else '10 ') + 'compare-x8 sheet present', False, cmp_p)
if V12:   # spec 13 v1.2 section 10 (B2) - criteria agreed with ChatGPT 17 Oct (draft rev 2b), owner locked ~23:5x
    N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); PLc = PLUM; BG_DARK = (30, 27, 46)
    colA = lambda x, y: tuple(int(v) for v in a[y, x, :3]); lcolA = lambda x, y: tuple(int(v) for v in l[y, x, :3])
    iscop = lambda x, y: bool(op[y, x]) and colA(x, y) in COPPER
    cryM = lop & np.all(l[..., :3] == CRYS_L, axis=2); glaM = lop & np.all(l[..., :3] == GLASS_L, axis=2)
    ok('C1 cap: rows 10 and 11 each have >= 9 adjacent copper px', runs(10, COPPER) >= 9 and runs(11, COPPER) >= 9, {10: runs(10, COPPER), 11: runs(11, COPPER)})
    ok('C3 base: rows 19 and 20 each have >= 9 adjacent copper px (bottom row stays 21)', runs(19, COPPER) >= 9 and runs(20, COPPER) >= 9 and bb[3] == 22, {19: runs(19, COPPER), 20: runs(20, COPPER), 'bottom_row': bb[3] - 1})
    ccx = float(np.nonzero(cryM)[1].mean()) if cryM.any() else 16.0
    mat = lambda x, y: bool(op[y, x]) and colA(x, y) not in COPPER and colA(x, y) != PLc   # glass/crystal material, not metal/outline
    rib = np.zeros((32, 32), bool)
    for y in range(1, 31):
        for x in range(1, 31):
            if not iscop(x, y): continue
            so = -1 if x < ccx else 1
            if glaM[y, x + so] and mat(x + so, y) and lop[y, x - so] and mat(x - so, y): rib[y, x] = True
    rcols = sorted(set(int(x) for x in np.nonzero(rib)[1]))
    def vrun(x):
        b_ = c_ = 0
        for y in range(32): c_ = c_ + 1 if rib[y, x] else 0; b_ = max(b_, c_)
        return b_
    RL = [x for x in rcols if x < ccx]; RR = [x for x in rcols if x > ccx]
    rp = []
    for y, x in zip(*np.nonzero(rib)):
        for dx, dy in N4:
            if lop[y + dy, x + dx]: rp.append(('crystal' if cryM[y + dy, x + dx] else 'glass', de00(colA(x + dx, y + dy), colA(x, y)), de00(lcolA(x + dx, y + dy), colA(x, y))))
    mn = lambda kind, i: round(min(p[i] for p in rp if kind in (None, p[0])), 2) if any(kind in (None, p[0]) for p in rp) else None
    ok('C2 ribs: exactly 1 rib column left + 1 right of the crystal, 1 px wide; outer 4-nbr = glass (light #FFB36B and base not metal/plum), inner 4-nbr = glass/crystal (light and base not metal); each >= 4 px vertical run; dE00 >= 15 vs every touching glass/crystal px, unlit and lit',
       bool(len(RL) == 1 and len(RR) == 1 and vrun(RL[0]) >= 4 and vrun(RR[0]) >= 4 and rp and mn(None, 1) >= 15 and mn(None, 2) >= 15),
       {'rib_cols_run': {x: vrun(x) for x in rcols}, 'pairs': len(rp), 'glass_min_unlit_lit': [mn('glass', 1), mn('glass', 2)], 'crystal_min_unlit_lit': [mn('crystal', 1), mn('crystal', 2)]})
    def gw(y, x0, step):
        n_ = 0; x = x0 + step
        while 0 <= x < 32 and glaM[y, x]: n_ += 1; x += step
        return n_
    rows2 = sum(1 for y in range(32) if RL and RR and rib[y, RL[0]] and rib[y, RR[0]] and gw(y, RL[0], -1) >= 2 and gw(y, RR[0], 1) >= 2)
    ok('C2b layout B (owner choice): glass outside each rib >= 2 px wide on both sides in >= 4 rib rows (= ribs x14/x18 in this frame)', rows2 >= 4, {'rows': rows2, 'rib_cols': rcols})
    ys_, xs_ = np.nonzero(cryM)
    ab = all(glaM[int(ys_.min()) - 1, x] for x in xs_[ys_ == ys_.min()]); be = all(glaM[int(ys_.max()) + 1, x] for x in xs_[ys_ == ys_.max()])
    fc = rv = lc_ = rc_ = 0
    for y, x in zip(ys_, xs_):
        for dx, dy in N4:
            xx, yy = x + dx, y + dy
            if op[yy, xx] and not lop[yy, xx]:
                if rib[yy, xx]:
                    if dy: rv += 1
                    elif dx < 0: lc_ += 1
                    else: rc_ += 1
                else: fc += 1
    ok('C4a crystal: glass directly above its top px and below its bottom px; 0 contact with cap/base/outer frame', ab and be and fc == 0,
       {'rows': [int(ys_.min()), int(ys_.max())], 'glass_above': bool(ab), 'glass_below': bool(be), 'frame_contact': fc})
    ok('C4b crystal-rib contact allowed on the sides only (not required): top/bottom contact 0', rv == 0, {'left_side_contact': lc_, 'right_side_contact': rc_, 'top_bottom_contact': rv})
    if BEFORE:
        f0 = np.array(Image.open(os.path.join(BEFORE, BASE + '.png')).convert('RGBA')).astype(int)
        same48 = bool((a[4:9] == f0[4:9]).all()); r9 = [int(x) for x in range(32) if (a[9, x] != f0[9, x]).any()]
        ok('G2 rows 4-8 identical to fix1; row 9 may only gain plum outline px', same48 and all(colA(x, 9) == PLc and f0[9, x, 3] == 0 for x in r9),
           {'rows4_8_identical': same48, 'row9_changed_x': r9})
        # G3 body px covered by the lantern in the hand (fist excluded), every hold frame, 7 dirs: increase vs fix1 <= 10
        adir = os.path.dirname(os.path.abspath(ANCH)); D8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
        sheets = {k: np.array(Image.open(os.path.join(adir, A['files'][k])).convert('RGBA'))[..., 3] > 0 for k in ('idle_hold', 'walk_hold')}
        def cover(lan_alpha):
            ly_, lx_ = np.nonzero(lan_alpha); out_ = {}
            for k in ('idle_hold', 'walk_hold'):
                for di in ('S', 'SE', 'E', 'NE', 'NW', 'W', 'SW'):
                    r_ = D8.index(di)
                    for fi, fr in enumerate(A[k][di]):
                        ax, ay = fr['anchor']; fist = {tuple(p) for p in fr['fist']}; cell = sheets[k][r_ * 96:(r_ + 1) * 96, fi * 96:(fi + 1) * 96]
                        n_ = sum(1 for y, x in zip(ly_, lx_) if 0 <= ay - GRIP[1] + y < 96 and 0 <= ax - GRIP[0] + x < 96 and cell[ay - GRIP[1] + y, ax - GRIP[0] + x] and (ax - GRIP[0] + x, ay - GRIP[1] + y) not in fist)
                        out_[di] = max(out_.get(di, 0), n_)
            return out_
        cn, cf = cover(op), cover(f0[..., 3] > 0); inc = {k: cn[k] - cf[k] for k in cn}
        ok('G3 in hand: body px covered by the lantern (fist excluded) increase vs fix1 <= 10 in every direction', max(inc.values()) <= 10, {'increase': inc, 'now': cn, 'fix1': cf})
    outer_pl = {(x, y) for y, x in zip(*np.nonzero(op)) if colA(x, y) == PLc and any(not op[y + dy, x + dx] for dx, dy in N4)}
    rim = [(int(x), int(y)) for y, x in zip(*np.nonzero(op)) if y >= 10 and colA(x, y) != PLc and any((x + dx, y + dy) in outer_pl for dx, dy in N4)]
    weak = [(x, y) for x, y in rim if de00(colA(x, y), BG_DARK) < 20]
    ok('V5a unlit edge: every inner-rim px (rows 10-21, just inside the plum outline) dE00 >= 20 vs the pilot dark bg #1E1B2E', not weak, {'rim_px': len(rim), 'weak': weak})
    gweak = sorted({hexc(colA(x, y)) for y, x in zip(*np.nonzero(glaM)) if de00(colA(x, y), BG_DARK) < 15})
    ok('V5b unlit glass: every glass px (unlit colour) dE00 >= 15 vs #1E1B2E', not gweak, {'glass_px': int(glaM.sum()), 'weak_colours': gweak})
    R['info'] = {'G1_glass_light_px (report only, not a gate)': int(glaM.sum()), 'G1_fix1': 42}
R['measure'] = {'bbox': bb, 'size': [w, h], 'below_grip': below, 'above_grip': above, 'hole': holes, 'hole_centre': hc, 'ring_w': ring_w, 'colours': {hexc(c): n for c, n in cols.most_common()},
                'opaque_px': int(op.sum()), 'sha256': {k: sha(p) for k, p in paths.items()}}
json.dump(R, open(OUT, 'w'), indent=1, ensure_ascii=False)
for c in R['checks']: print(('PASS ' if c['pass'] else 'FAIL ') + c['check'] + ' :: ' + json.dumps(c['value'], ensure_ascii=False)[:300])
print('TOTAL %d/%d PASS' % (sum(c['pass'] for c in R['checks']), len(R['checks'])))
