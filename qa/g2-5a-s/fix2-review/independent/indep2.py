#!/usr/bin/env python3
# Independent reviewer implementation of ASSET_SPEC_13 v1.2 gates (own code; not derived from qa_asset13.py)
# usage: python3 -I indep.py DIR FIX1_DIR ANCHORS_JSON [OUT_JSON]
import sys, os, json, math, hashlib
import numpy as np
from PIL import Image

# ---------- colour ----------
def srgb_to_lab(rgb):
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(float(v)) for v in rgb[:3])
    X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    Xn, Yn, Zn = 0.95047, 1.0, 1.08883
    eps, kap = 216 / 24389, 24389 / 27
    def f(t): return t ** (1 / 3) if t > eps else (kap * t + 16) / 116
    fx, fy, fz = f(X / Xn), f(Y / Yn), f(Z / Zn)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))

def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1; L2, a2, b2 = lab2
    C1 = math.sqrt(a1 * a1 + b1 * b1); C2 = math.sqrt(a2 * a2 + b2 * b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm ** 7 / (Cm ** 7 + 25.0 ** 7)))
    ap1, ap2 = a1 * (1 + G), a2 * (1 + G)
    Cp1, Cp2 = math.sqrt(ap1 ** 2 + b1 ** 2), math.sqrt(ap2 ** 2 + b2 ** 2)
    def hue(b, ap):
        if b == 0 and ap == 0: return 0.0
        h = math.degrees(math.atan2(b, ap))
        return h + 360 if h < 0 else h
    hp1, hp2 = hue(b1, ap1), hue(b2, ap2)
    dLp = L2 - L1; dCp = Cp2 - Cp1
    if Cp1 * Cp2 == 0: dhp = 0.0
    else:
        dhp = hp2 - hp1
        if dhp > 180: dhp -= 360
        elif dhp < -180: dhp += 360
    dHp = 2 * math.sqrt(Cp1 * Cp2) * math.sin(math.radians(dhp / 2))
    Lpm = (L1 + L2) / 2; Cpm = (Cp1 + Cp2) / 2
    if Cp1 * Cp2 == 0: hpm = hp1 + hp2
    elif abs(hp1 - hp2) <= 180: hpm = (hp1 + hp2) / 2
    elif hp1 + hp2 < 360: hpm = (hp1 + hp2 + 360) / 2
    else: hpm = (hp1 + hp2 - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hpm - 30)) + 0.24 * math.cos(math.radians(2 * hpm))
         + 0.32 * math.cos(math.radians(3 * hpm + 6)) - 0.20 * math.cos(math.radians(4 * hpm - 63)))
    dtheta = 30 * math.exp(-(((hpm - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25.0 ** 7))
    Sl = 1 + 0.015 * (Lpm - 50) ** 2 / math.sqrt(20 + (Lpm - 50) ** 2)
    Sc = 1 + 0.045 * Cpm; Sh = 1 + 0.015 * Cpm * T
    Rt = -math.sin(math.radians(2 * dtheta)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))

_cache = {}
def dE(c1, c2):
    k = (tuple(c1[:3]), tuple(c2[:3]))
    if k not in _cache: _cache[k] = ciede2000(srgb_to_lab(c1), srgb_to_lab(c2))
    return _cache[k]

def H(s): s = s.lstrip('#'); return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
def hx(c): return '#%02X%02X%02X' % tuple(int(v) for v in c[:3])

PLUM = H('3A1E3F'); COP = [H('3D292C'), H('67413A'), H('915B49'), H('BB7A57')]; BRIGHT = COP[1:]
GL, CR = H('FFB36B'), H('FFF0C9'); GOLD, CYAN = H('FFC857'), H('5FE0FF'); BG = H('1E1B2E')
GX, GY = 16, 6
NAME = 'c2-held-lantern_L0-S-trial'
DIRS8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']; DIRS7 = [d for d in DIRS8 if d != 'N']
N4 = [(1, 0), (-1, 0), (0, 1), (0, -1)]

def load(p): return np.array(Image.open(p).convert('RGBA')).astype(int)

def flood_outside(opq):
    h, w = opq.shape; outm = np.zeros_like(opq, bool); stack = []
    for x in range(w):
        for y in (0, h - 1):
            if not opq[y, x] and not outm[y, x]: outm[y, x] = True; stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not opq[y, x] and not outm[y, x]: outm[y, x] = True; stack.append((x, y))
    while stack:
        x, y = stack.pop()
        for dx, dy in N4:
            u, v = x + dx, y + dy
            if 0 <= u < w and 0 <= v < h and not opq[v, u] and not outm[v, u]: outm[v, u] = True; stack.append((u, v))
    return outm

def ncomp(mask, nb):
    h, w = mask.shape; lab = np.zeros(mask.shape, int); n = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not lab[y, x]:
                n += 1; lab[y, x] = n; st = [(x, y)]
                while st:
                    cx, cy = st.pop()
                    for dx, dy in nb:
                        u, v = cx + dx, cy + dy
                        if 0 <= u < w and 0 <= v < h and mask[v, u] and not lab[v, u]: lab[v, u] = n; st.append((u, v))
    return n, lab

def evaluate(D, F1, ANCH):
    G = {}
    def gate(k, ok, val): G[k] = {'pass': bool(ok), 'val': val}
    p = {s: os.path.join(D, NAME + e) for s, e in (('png', '.png'), ('light', '-light.png'), ('json', '.json'), ('x8', '-x8.png'))}
    gate('1a', all(os.path.isfile(v) for v in p.values()), {k: os.path.isfile(v) for k, v in p.items()})
    A = load(p['png']); L = load(p['light']); X8 = load(p['x8'])
    gate('1b', A.shape[:2] == (32, 32) and L.shape[:2] == (32, 32) and X8.shape[:2] == (256, 256), [A.shape[:2], L.shape[:2], X8.shape[:2]])
    gate('1c', set(np.unique(A[..., 3])) <= {0, 255} and set(np.unique(L[..., 3])) <= {0, 255}, [sorted(set(np.unique(A[..., 3]).tolist())), sorted(set(np.unique(L[..., 3]).tolist()))])
    O = A[..., 3] == 255; LO = L[..., 3] == 255
    c = lambda x, y: tuple(int(v) for v in A[y, x, :3]); lc = lambda x, y: tuple(int(v) for v in L[y, x, :3])
    inb = lambda x, y: 0 <= x < 32 and 0 <= y < 32
    n4, _ = ncomp(O, N4); n8, _ = ncomp(O, N4 + [(1, 1), (1, -1), (-1, 1), (-1, -1)])
    gate('1d', n4 == 1 and n8 == 1, {'4n': n4, '8n': n8})
    ys, xs = np.nonzero(O); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = int(x1 - x0 + 1), int(y1 - y0 + 1); below, above = int(y1 - GY), int(GY - y0)
    OUT = flood_outside(O); HOLE = ~O & ~OUT
    nh, hl = ncomp(HOLE, N4)
    holes = sorted((int(x), int(y)) for y, x in zip(*np.nonzero(HOLE)))
    ring_comp = [(int(x), int(y)) for y, x in zip(*np.nonzero(hl == hl[GY, GX]))] if HOLE[GY, GX] else []
    hmaxy = max(q[1] for q in ring_comp) if ring_comp else y0 + 3
    rw = 0
    for yy in range(y0, hmaxy + 2):
        r = np.nonzero(O[yy])[0]
        if len(r): rw = max(rw, int(r.max() - r.min() + 1))
    gate('2', 11 <= w <= 13 and 17 <= h <= 18 and below <= 15 and above <= 3 and rw <= 5, {'bbox': [int(x0), int(y0), int(x1) + 1, int(y1) + 1], 'w': w, 'h': h, 'below': below, 'above': above, 'ring_w': rw})
    if ring_comp:
        cxh = sum(q[0] for q in ring_comp) / len(ring_comp); cyh = sum(q[1] for q in ring_comp) / len(ring_comp)
        surrounded = all(O[q[1] - 1, q[0]] or HOLE[q[1] - 1, q[0]] for q in ring_comp)  # trivially enclosed (not reachable from outside)
        ok3 = abs(cxh - 16) <= 0.5 and abs(cyh - 6) <= 0.5
    else: cxh = cyh = None; ok3 = False
    # stricter enclosure: transparent px must not reach the outside even through diagonal gaps
    def flood_outside8(opq):
        h_, w_ = opq.shape; om = np.zeros_like(opq, bool); st = []
        for yy in range(h_):
            for xx in range(w_):
                if (yy in (0, h_ - 1) or xx in (0, w_ - 1)) and not opq[yy, xx]: om[yy, xx] = True; st.append((xx, yy))
        while st:
            xx, yy = st.pop()
            for dx, dy in N4 + [(1, 1), (1, -1), (-1, 1), (-1, -1)]:
                u, v = xx + dx, yy + dy
                if 0 <= u < w_ and 0 <= v < h_ and not opq[v, u] and not om[v, u]: om[v, u] = True; st.append((u, v))
        return om
    OUT8 = flood_outside8(O); hole8 = sorted((int(x), int(y)) for y, x in zip(*np.nonzero(~O & ~OUT8)))
    ok3 = ok3 and (16, 6) in ring_comp and hole8 == holes
    gate('3', ok3, {'ring_hole': ring_comp, 'centre': [cxh, cyh], 'all_hole_components': nh, 'hole_8n_enclosed': hole8})
    cols = sorted({c(x, y) for y, x in zip(*np.nonzero(O))})
    outer = [(int(x), int(y)) for y, x in zip(*np.nonzero(O)) if any((not inb(x + dx, y + dy)) or OUT[y + dy, x + dx] for dx, dy in N4)]
    plum_out = sum(1 for x, y in outer if c(x, y) == PLUM)
    mg = min(dE(q, GOLD) for q in cols); mc = min(dE(q, CYAN) for q in cols); mgl = min(dE(q, GL) for q in cols); mcr = min(dE(q, CR) for q in cols)
    cop_present = [q for q in cols if q in COP]; mcop = min(dE(q, GL) for q in cop_present) if cop_present else None
    gate('4', mg >= 10 and mc >= 10 and mgl >= 5 and mcr >= 5 and (mcop is None or mcop >= 10) and plum_out >= 0.9 * len(outer),
         {'gold': round(mg, 2), 'cyan': round(mc, 2), 'vsGL': round(mgl, 2), 'vsCR': round(mcr, 2), 'cop_vsGL': round(mcop, 2) if mcop else None, 'outer_plum': f'{plum_out}/{len(outer)}'})
    lpx = [(int(x), int(y)) for y, x in zip(*np.nonzero(LO))]
    lcols = {lc(x, y) for x, y in lpx}
    bad_under = [(x, y) for x, y in lpx if not O[y, x] or c(x, y) == PLUM or c(x, y) in COP]
    crys = [(x, y) for x, y in lpx if lc(x, y) == CR]; glass = [(x, y) for x, y in lpx if lc(x, y) == GL]
    gate('5', lcols <= {GL, CR} and not bad_under and 6 <= len(crys) <= 8, {'lcols': [hx(q) for q in lcols], 'bad_under': bad_under, 'crystal': len(crys), 'glass': len(glass)})
    try:
        J = json.load(open(p['json']))
        sh = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()
        exp = {'grip': [16, 6], 'bbox_xyxy_exclusive': [int(x0), int(y0), int(x1) + 1, int(y1) + 1], 'size': [w, h], 'below_grip': below, 'above_grip': above,
               'light_px': {'glass': len(glass), 'crystal': len(crys)}}
        bad = [k for k, v in exp.items() if J.get(k) != v]
        if sorted(tuple(q) for q in J.get('ring_hole_px', [])) != holes: bad.append('ring_hole_px')
        if sorted(s.upper() for s in J.get('colors', [])) != sorted(hx(q) for q in cols): bad.append('colors')
        if J.get('sha256', {}).get('png') != sh(p['png']): bad.append('sha.png')
        if J.get('sha256', {}).get('light') != sh(p['light']): bad.append('sha.light')
        fixedv = {'schema': 1, 'set': 13, 'part': 'S-trial', 'file': NAME + '.png', 'light_file': NAME + '-light.png', 'cell': [32, 32],
                  'grip_definition': 'centre of the hollow ring hole',
                  'references': {'design': 'qa/g2-5a-r1/r1-grid33.png', 'size': 'qa/g2-5a-r2/2-shape-18.png', 'native_size_example': 'qa/g2-5a-r2/r2-grid41.png'}}
        bad += [k for k, v in fixedv.items() if J.get(k) != v]
        sec4 = ['schema', 'set', 'part', 'file', 'light_file', 'cell', 'grip', 'grip_definition', 'bbox_xyxy_exclusive', 'size', 'below_grip', 'above_grip',
                'ring_hole_px', 'light_px', 'colors', 'references', 'sha256']
        missing = [k for k in sec4 if k not in J]; extra = [k for k in J if k not in sec4]
        if len(J.get('colors', [])) != len(set(J.get('colors', []))): bad.append('colors_dup')
        gate('6', not bad and not missing, {'bad': bad, 'missing_keys': missing, 'extra_keys': extra, 'n_colors': len(J.get('colors', []))})
    except Exception as e:
        gate('6', False, repr(e))
    # x8: every pixel of every opaque cell must equal the base colour; report bg of transparent cells
    mism = 0; bgset = set()
    for y in range(32):
        for x in range(32):
            blk = X8[y * 8:(y + 1) * 8, x * 8:(x + 1) * 8]
            if O[y, x]: mism += int(((blk[..., :3] != A[y, x, :3]).any(axis=2) | (blk[..., 3] != 255)).sum())
            else: bgset |= {tuple(int(v) for v in q) for q in blk.reshape(-1, 4)}
    gate('6b', X8.shape[:2] == (256, 256) and mism == 0 and len(bgset) == 1, {'mismatched_subpx': mism, 'bg_values': len(bgset), 'bg': [list(q) for q in list(bgset)[:3]]})
    AN = json.load(open(ANCH))
    bots = {d: max(f['anchor'][1] for k in ('idle_hold', 'walk_hold') for f in AN[k][d]) - GY + int(y1) for d in DIRS7}
    gate('7a', max(bots.values()) <= 92, bots)
    # 8c
    pairs = []
    for x, y in lpx:
        for dx, dy in N4:
            u, v = x + dx, y + dy
            if inb(u, v) and O[v, u] and not LO[v, u] and c(u, v) in BRIGHT:
                pairs.append((dE(c(x, y), c(u, v)), dE(lc(x, y), c(u, v))))
    mu = min(q[0] for q in pairs) if pairs else None; ml = min(q[1] for q in pairs) if pairs else None
    gate('8c', (not pairs) or (mu >= 10 and ml >= 10), {'pairs': len(pairs), 'min_unlit': round(mu, 2) if pairs else None, 'min_lit': round(ml, 2) if pairs else None})
    # 8d
    if crys:
        cx_ = [q[0] for q in crys]; cy_ = [q[1] for q in crys]
        rows = {}
        for x, y in crys: rows.setdefault(y, []).append(x)
        ry = sorted(rows); widths = [len(rows[y]) for y in range(min(ry), max(ry) + 1) if True] if all(y in rows for y in range(min(ry), max(ry) + 1)) else None
        contig = all(max(v) - min(v) + 1 == len(v) for v in rows.values())
        tones = {}
        for x, y in crys: tones.setdefault(c(x, y), []).append((x, y))
        tl = None
        if len(tones) == 2:
            (ca, pa), (cb, pb) = sorted(tones.items(), key=lambda kv: -srgb_to_lab(kv[0])[0])
            ma = (np.mean([q[0] for q in pa]), np.mean([q[1] for q in pa])); mb = (np.mean([q[0] for q in pb]), np.mean([q[1] for q in pb]))
            tl = {'light': hx(ca), 'dark': hx(cb), 'ma': [round(v, 2) for v in ma], 'mb': [round(v, 2) for v in mb], 'ul': bool(ma[0] <= mb[0] and ma[1] <= mb[1] and ma != mb),
                  'ul_strict': bool(ma[0] < mb[0] and ma[1] < mb[1])}
        cw = max(cx_) - min(cx_) + 1; ch = max(cy_) - min(cy_) + 1
        centred = widths == [1, 3, 3, 1] and rows[ry[0]][0] == min(cx_) + 1 and rows[ry[-1]][0] == min(cx_) + 1
        gate('8d', 6 <= len(crys) <= 8 and cw == 3 and ch == 4 and widths == [1, 3, 3, 1] and contig and tl is not None and tl['ul'],
             {'n': len(crys), 'w': cw, 'h': ch, 'widths': widths, 'centred(info)': centred, 'tones': tl or {hx(k): len(v) for k, v in tones.items()}})
    else:
        gate('8d', False, 'no crystal')
    # ---- v1.2 new ----
    def run_copper(y):
        best = cur = 0
        for x in range(32):
            cur = cur + 1 if O[y, x] and c(x, y) in COP else 0; best = max(best, cur)
        return best
    gate('C1', run_copper(10) >= 9 and run_copper(11) >= 9, {10: run_copper(10), 11: run_copper(11)})
    gate('C3', run_copper(19) >= 9 and run_copper(20) >= 9 and int(y1) == 21, {19: run_copper(19), 20: run_copper(20), 'bottom': int(y1)})
    metal = lambda x, y: c(x, y) in COP or c(x, y) == PLUM
    real_glass = lambda x, y: inb(x, y) and LO[y, x] and lc(x, y) == GL and O[y, x] and not metal(x, y)
    glass_or_crys = lambda x, y: inb(x, y) and LO[y, x] and O[y, x] and not metal(x, y)
    ribL = set(); ribR = set(); ribC = set()
    if crys:
        ccx = sum(q[0] for q in crys) / len(crys)
        for y in range(32):
            for x in range(32):
                if not (O[y, x] and c(x, y) in COP): continue
                if x < ccx and real_glass(x - 1, y) and glass_or_crys(x + 1, y): ribL.add((x, y))
                elif x > ccx and real_glass(x + 1, y) and glass_or_crys(x - 1, y): ribR.add((x, y))
                elif x == ccx and ((real_glass(x - 1, y) and glass_or_crys(x + 1, y)) or (real_glass(x + 1, y) and glass_or_crys(x - 1, y))): ribC.add((x, y))
    else: ccx = None
    rib = ribL | ribR | ribC
    colsL = sorted({q[0] for q in ribL}); colsR = sorted({q[0] for q in ribR}); colsC = sorted({q[0] for q in ribC})
    def vrun(col):
        ys_ = sorted(q[1] for q in rib if q[0] == col); best = cur = 0; prev = None
        for yy in ys_:
            cur = cur + 1 if prev is not None and yy == prev + 1 else 1; prev = yy; best = max(best, cur)
        return best
    rp = []
    for x, y in rib:
        for dx, dy in N4:
            u, v = x + dx, y + dy
            if inb(u, v) and LO[v, u]: rp.append((dE(c(x, y), c(u, v)), dE(c(x, y), lc(u, v)), 'C' if lc(u, v) == CR else 'G'))
    ok_c2 = len(colsL) == 1 and len(colsR) == 1 and not colsC and vrun(colsL[0]) >= 4 and vrun(colsR[0]) >= 4 and rp and min(q[0] for q in rp) >= 15 and min(q[1] for q in rp) >= 15
    gate('C2', ok_c2, {'ccx': ccx, 'left': {x: vrun(x) for x in colsL}, 'right': {x: vrun(x) for x in colsR}, 'centre': colsC, 'rib_colours': sorted({hx(c(*q)) for q in rib}),
                       'min_unlit': round(min(q[0] for q in rp), 2) if rp else None, 'min_lit': round(min(q[1] for q in rp), 2) if rp else None,
                       'glass_min_unlit_lit': [round(min(q[0] for q in rp if q[2] == 'G'), 2), round(min(q[1] for q in rp if q[2] == 'G'), 2)] if any(q[2] == 'G' for q in rp) else None,
                       'crystal_min_unlit_lit': [round(min(q[0] for q in rp if q[2] == 'C'), 2), round(min(q[1] for q in rp if q[2] == 'C'), 2)] if any(q[2] == 'C' for q in rp) else None,
                       'rib_px': sorted(rib), 'pairs': len(rp)})
    nrows = 0
    if len(colsL) >= 1 and len(colsR) >= 1:
        xl, xr = colsL[0], colsR[-1]
        for y in range(32):
            if (xl, y) in rib and (xr, y) in rib:
                gl_ = 0; u = xl - 1
                while real_glass(u, y): gl_ += 1; u -= 1
                gr_ = 0; u = xr + 1
                while real_glass(u, y): gr_ += 1; u += 1
                if gl_ >= 2 and gr_ >= 2: nrows += 1
    gate('C2b', nrows >= 4, {'rows': nrows})
    if crys:
        top = min(q[1] for q in crys); bot = max(q[1] for q in crys)
        above_ok = all(real_glass(x, top - 1) for x, y in crys if y == top); below_ok = all(real_glass(x, bot + 1) for x, y in crys if y == bot)
        fc4 = fc8 = 0; side = {'L': 0, 'R': 0}; tb = 0
        cset = set(crys)
        for x, y in crys:
            for dx, dy in N4 + [(1, 1), (1, -1), (-1, 1), (-1, -1)]:
                u, v = x + dx, y + dy
                if not inb(u, v) or not O[v, u] or LO[v, u]: continue
                if (u, v) in rib:
                    if dx and dy: continue
                    if dy: tb += 1
                    else: side['L' if dx < 0 else 'R'] += 1
                else:
                    if dx and dy: fc8 += 1
                    else: fc4 += 1
        gate('C4a', above_ok and below_ok and fc4 == 0, {'rows': [top, bot], 'glass_above': above_ok, 'glass_below': below_ok, 'frame_contact_4n': fc4, 'frame_contact_diag(info)': fc8})
        gate('C4b', tb == 0, {'side': side, 'top_bottom': tb})
    else:
        gate('C4a', False, 'no crystal'); gate('C4b', False, 'no crystal')
    F = load(os.path.join(F1, NAME + '.png'))
    pm = lambda Z: np.where(Z[..., 3:4] == 0, 0, Z)   # alpha-0 px compare equal whatever their RGB
    Ap, Fp = pm(A), pm(F)
    same48 = bool((Ap[4:9] == Fp[4:9]).all())
    ch9 = [x for x in range(32) if (Ap[9, x] != Fp[9, x]).any()]
    is_outer = lambda x, y: any((not inb(x + dx, y + dy)) or OUT[y + dy, x + dx] for dx, dy in N4)
    ok9 = all(F[9, x, 3] == 0 and A[9, x, 3] == 255 and c(x, 9) == PLUM and is_outer(x, 9) for x in ch9)
    gate('G2', same48 and ok9, {'rows4_8_same': same48, 'row9_changed': [(x, 9, 'fix1a=%d' % F[9, x, 3], hx(c(x, 9)), 'outer' if is_outer(x, 9) else 'INNER') for x in ch9]})
    # G3
    adir = os.path.dirname(os.path.abspath(ANCH))
    sheets = {k: load(os.path.join(adir, AN['files'][k]))[..., 3] > 0 for k in ('idle_hold', 'walk_hold')}
    def covered(mask):
        ly, lx = np.nonzero(mask); res = {}
        for k in ('idle_hold', 'walk_hold'):
            for d in DIRS7:
                r = DIRS8.index(d)
                for i, fr in enumerate(AN[k][d]):
                    ax, ay = fr['anchor']; fist = {tuple(q) for q in fr['fist']}
                    cell = sheets[k][r * 96:(r + 1) * 96, i * 96:(i + 1) * 96]
                    n = 0
                    for yy, xx in zip(ly, lx):
                        X_, Y_ = ax - GX + xx, ay - GY + yy
                        if 0 <= X_ < 96 and 0 <= Y_ < 96 and cell[Y_, X_] and (X_, Y_) not in fist: n += 1
                    res[(k, d, i)] = n
        return res
    # layout sanity: every fist px must be opaque in the cell row DIRS8.index(d), col = frame index
    fist_bad = 0; fist_tot = 0
    for k in ('idle_hold', 'walk_hold'):
        for d in DIRS7:
            r = DIRS8.index(d)
            for i, fr in enumerate(AN[k][d]):
                cell = sheets[k][r * 96:(r + 1) * 96, i * 96:(i + 1) * 96]
                for fx, fy in fr['fist']: fist_tot += 1; fist_bad += int(not cell[fy, fx])
    cn = covered(O); cf = covered(F[..., 3] == 255)
    per_frame = {d: max(cn[q] - cf[q] for q in cn if q[1] == d) for d in DIRS7}
    max_max = {d: max(cn[q] for q in cn if q[1] == d) - max(cf[q] for q in cf if q[1] == d) for d in DIRS7}
    nframes = len(cn); worst = sorted(((cn[q] - cf[q], q) for q in cn), reverse=True)[:3]
    gate('G3', max(per_frame.values()) <= 10 and max(max_max.values()) <= 10,
         {'frames': nframes, 'per_frame_max_inc': per_frame, 'maxnow_minus_maxfix1': max_max, 'worst_frames': worst, 'max_now': {d: max(cn[q] for q in cn if q[1] == d) for d in DIRS7},
          'max_fix1': {d: max(cf[q] for q in cf if q[1] == d) for d in DIRS7}, 'min_frame_inc': min(cn[q] - cf[q] for q in cn), 'fist_px_opaque_check': f'{fist_tot - fist_bad}/{fist_tot}'})
    # V5a
    outer_plum = {(x, y) for x, y in outer if c(x, y) == PLUM}
    rim = [(int(x), int(y)) for y, x in zip(*np.nonzero(O)) if 10 <= y <= 21 and c(x, y) != PLUM and any((x + dx, y + dy) in outer_plum for dx, dy in N4)]
    weak = [(x, y, hx(c(x, y)), round(dE(c(x, y), BG), 1)) for x, y in rim if dE(c(x, y), BG) < 20]
    # variant: outline = plum px 8-adjacent to the outside; rim = any non-outline px (plum included) 4-adjacent to it
    D8_ = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
    outline8 = {(int(x), int(y)) for y, x in zip(*np.nonzero(O)) if c(x, y) == PLUM and any((not inb(x + dx, y + dy)) or OUT[y + dy, x + dx] for dx, dy in N4 + D8_)}
    rim8 = [(int(x), int(y)) for y, x in zip(*np.nonzero(O)) if 10 <= y <= 21 and (x, y) not in outline8 and any((x + dx, y + dy) in outline8 for dx, dy in N4)]
    weak8 = [(x, y, hx(c(x, y)), round(dE(c(x, y), BG), 2)) for x, y in rim8 if dE(c(x, y), BG) < 20]
    inner_plum = [(int(x), int(y)) for y, x in zip(*np.nonzero(O)) if c(x, y) == PLUM and not is_outer(x, y)]
    gate('V5a', bool(rim) and not weak, {'rim': len(rim), 'weak': weak, 'min': round(min(dE(c(x, y), BG) for x, y in rim), 2) if rim else None,
                                         'argmin': min(((round(dE(c(x, y), BG), 2), x, y, hx(c(x, y))) for x, y in rim)) if rim else None,
                                         'variant8_rim': len(rim8), 'variant8_weak': weak8, 'variant8_min': round(min(dE(c(x, y), BG) for x, y in rim8), 2) if rim8 else None,
                                         'inner_plum_px': inner_plum, 'outline8_plum': len(outline8)})
    gw = [(x, y) for x, y in glass]
    gweak = sorted({(hx(c(x, y)), round(dE(c(x, y), BG), 1)) for x, y in gw if dE(c(x, y), BG) < 15})
    gate('V5b', bool(gw) and not gweak, {'glass': len(gw), 'weak': gweak, 'min': round(min(dE(c(x, y), BG) for x, y in gw), 2) if gw else None})
    cmpp = os.path.join(D, NAME + '-fix2-compare-x8.png')
    if os.path.isfile(cmpp):
        C = load(cmpp)
        FL = load(os.path.join(F1, NAME + '-light.png'))
        def lit(base, light):
            o = base.copy(); m = light[..., 3] == 255; o[m] = light[m]; return o
        panels = {'fix1_unlit': (0, 32, F), 'fix2_unlit': (256, 32, A), 'fix1_lit': (0, 320, lit(F, FL)), 'fix2_lit': (256, 320, lit(A, L))}
        res = {}; bg_all = set(); inpanel = np.zeros(C.shape[:2], bool)
        for k, (px, py, img) in panels.items():
            sub = C[py:py + 256, px:px + 256]; inpanel[py:py + 256, px:px + 256] = True
            if sub.shape[:2] != (256, 256): res[k] = 'bad shape'; continue
            mm = 0; bgs = set()
            for y in range(32):
                for x in range(32):
                    blk = sub[y * 8:(y + 1) * 8, x * 8:(x + 1) * 8]
                    if img[y, x, 3] == 255: mm += int(((blk[..., :3] != img[y, x, :3]).any(axis=2) | (blk[..., 3] != 255)).sum())
                    else: bgs |= {tuple(int(v) for v in q) for q in blk.reshape(-1, 4)}
            res[k] = {'mismatch_subpx': mm, 'bg_colours': [list(q) for q in bgs]}; bg_all |= bgs
        outside = C[~inpanel]; out_cols = {tuple(int(v) for v in q) for q in outside.reshape(-1, 4)}
        ok10 = C.shape[:2] == (576, 512) and all(isinstance(v, dict) and v['mismatch_subpx'] == 0 for v in res.values()) and len(bg_all) == 1
        gate("10'", ok10, {'size': [C.shape[1], C.shape[0]], 'panels': res, 'bg_colours_all_panels': len(bg_all), 'outside_panels_n_colours': len(out_cols),
                           'outside_panels_px': int((~inpanel).sum())})
    else:
        gate("10'", False, 'absent')
    # pixel diff vs fix1 (base + light), by row
    diff = {}
    for y in range(32):
        xs_ = [x for x in range(32) if (Ap[y, x] != Fp[y, x]).any()]
        if xs_: diff[y] = xs_
    alpha_add = int(((A[..., 3] == 255) & (F[..., 3] == 0)).sum()); alpha_rem = int(((A[..., 3] == 0) & (F[..., 3] == 255)).sum())
    FLp = pm(load(os.path.join(F1, NAME + '-light.png'))); Lp = pm(L)
    ldiff = int((FLp != Lp).any(axis=2).sum())
    outside_bbox = [(x, y) for y, xs_ in diff.items() for x in xs_ if not (x0 <= x <= x1 and y0 <= y <= y1)]
    info = {'G1_glass_light_px': len(glass), 'crystal_px': len(crys), 'opaque_px': int(O.sum()), 'fix1_opaque_px': int((F[..., 3] == 255).sum()),
            'base_changed_px': sum(len(v) for v in diff.values()), 'alpha_added': alpha_add, 'alpha_removed': alpha_rem, 'light_changed_px': ldiff,
            'changed_by_row': {y: (len(v), v) for y, v in diff.items()}, 'changed_outside_bbox': outside_bbox,
            'colour_counts': {hx(q): int(sum(1 for y, x in zip(*np.nonzero(O)) if c(x, y) == q)) for q in cols}}
    return G, info

ORDER = ['1a', '1b', '1c', '1d', '2', '3', '4', '5', '6', '6b', '7a', '8c', '8d', 'C1', 'C2', 'C2b', 'C3', 'C4a', 'C4b', 'G2', 'G3', 'V5a', 'V5b', "10'"]

if __name__ == '__main__':
    if sys.argv[1] == 'selftest':
        # Sharma, Wu, Dalal (2005) reference pairs
        tests = [((50, 2.6772, -79.7751), (50, 0, -82.7485), 2.0425), ((50, 0, 0), (50, -1, 2), 2.3669),
                 ((50, 2.49, -0.001), (50, -2.49, 0.0009), 7.1792), ((50, 2.49, -0.001), (50, -2.49, 0.0011), 7.2195),
                 ((50, -0.001, 2.49), (50, 0.0009, -2.49), 4.8045), ((50, 2.5, 0), (73, 25, -18), 27.1492),
                 ((50, 2.5, 0), (61, -5, 29), 22.8977), ((50, 2.5, 0), (50, 3.1736, 0.5854), 1.0000),
                 ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387), 1.2644), ((2.0776, 0.0795, -1.135), (0.9033, -0.0636, -0.5514), 0.9082)]
        for l1, l2, e in tests: print(l1, l2, e, round(ciede2000(l1, l2), 4), 'OK' if abs(ciede2000(l1, l2) - e) < 1e-4 else 'BAD')
        sys.exit()
    G, info = evaluate(sys.argv[1], sys.argv[2], sys.argv[3])
    for k in ORDER: print(('PASS ' if G[k]['pass'] else 'FAIL ') + k + ' :: ' + json.dumps(G[k]['val'], default=str)[:1500])
    print('TOTAL %d/%d' % (sum(G[k]['pass'] for k in ORDER), len(ORDER))); print(json.dumps(info, default=str, indent=0))
    if len(sys.argv) > 4: json.dump({k: G[k] for k in ORDER}, open(sys.argv[4], 'w'), default=str, indent=1)
