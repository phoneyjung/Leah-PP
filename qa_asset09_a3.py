#!/usr/bin/env python3
# Independent QA for ASSET_SPEC_09 v2.4 sections 12 + 19 (09-A3 Material Mask). Claude writes and runs this.
# Codex may run it before delivery (copy it out of claude/g2-pilot; do not commit it to the asset branch).
# usage:
#   python3 -I qa_asset09_a3.py check A2.png MASK.png MASK.json EXPECTED.json OUT_DIR [--images]
#   python3 -I qa_asset09_a3.py expected A2.png EXPECTED_OUT.json     (Claude: facts read from the locked A2 only)
#   python3 -I qa_asset09_a3.py selftest A2.png EXPECTED.json         (checker tests on tiny synthetic arrays; never builds a mask of the character)
# Exit code 0 = PASS (all hard checks), 1 = FAIL.  Soft flags never fail; they list places to look at in the Overlay.
import sys, os, json, hashlib, math, colorsys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw

L8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
FACE = ['S', 'SE', 'E', 'W', 'SW']; BACK = ['NE', 'N', 'NW']; MOUTH = ['S', 'SE', 'SW']
PLUM = (0x3A, 0x1E, 0x3F); SIG = ['#FFC857', '#5FE0FF']; SIG_MIN = 10.0
# id: (name, recolour group or 'fixed', max G)
IDS = {0: ('transparent', 'none', 0), 1: ('outer outline', 'fixed', 0), 2: ('fixed eye lines', 'fixed', 0),
       3: ('skin', 'skin', 4), 4: ('hair + brows', 'hair', 4), 5: ('iris', 'iris', 2), 6: ('cloth', 'fixed', 0),
       7: ('leather', 'fixed', 0), 8: ('long cape', 'house', 3), 9: ('copper', 'fixed', 0),
       10: ('mouth G0 / cheek G1', 'fixed', 1), 11: ('inner fixed outline', 'fixed', 0)}
FIXED = [1, 2, 6, 7, 9, 10, 11]; RECOL = {3: 'skin', 4: 'hair', 5: 'iris', 8: 'house'}
# Owner-approved ramps: hair/iris/house = game 2.33 HAIRC/EYEC/HOUSES (locked, save-file order) = Palette v1.2 sections 2-4;
# skin = Palette v1.2 section 5 (D3: pilot only, not production). Index = option index, list index = G (0 = darkest).
RAMPS = {
    'hair': [('Black', ['#18141C', '#28222E', '#3E3646', '#5C5264', '#7E7486']), ('Brown', ['#3A2216', '#5C3822', '#825432', '#AA764A', '#CEA070']),
             ('Blonde', ['#7A4E1E', '#AA722C', '#D6A046', '#F0CC70', '#FFECAA']), ('Red', ['#541814', '#86281E', '#B8422C', '#DC6E46', '#F6A078']),
             ('Pink', ['#6E284A', '#A6426E', '#D66A96', '#F098BA', '#FFCCDE']), ('Blue', ['#1C2860', '#2C4294', '#4668C4', '#7098E4', '#B0CEFA']),
             ('Silver', ['#46485A', '#6E7082', '#9698AA', '#C2C4D2', '#E8EAF2']), ('Green', ['#184628', '#286E3C', '#469650', '#78BE6E', '#B4E6A0'])],
    'iris': [('Brown', ['#281810', '#58361E', '#8C5C34']), ('Black', ['#14121A', '#2E2838', '#50485C']), ('Green', ['#144628', '#288246', '#5ABE6E']),
             ('Blue', ['#14286E', '#285ABE', '#64A0F0']), ('Amber', ['#5A320A', '#AA6E1E', '#E6B446'])],
    'skin': [('Light', ['#9C665C', '#BD846D', '#DEA68E', '#F1C4AA', '#FFE2CB']), ('Medium', ['#73473F', '#98604C', '#BE8366', '#DBA98A', '#EFC9A6']),
             ('Tan', ['#513532', '#75483E', '#98614B', '#BE8765', '#DDA781']), ('Deep', ['#342629', '#503332', '#744839', '#98694F', '#B88A69'])],
    'house': [('Sun', ['#C0900C', '#F0B512', '#F3C546', '#F6D579']), ('Wing', ['#133C72', '#1B56A4', '#2370D5', '#508FE2']),
              ('Leaf', ['#165A19', '#218324', '#2BAB2F', '#3BCE40']), ('Flame', ['#7F1015', '#B0161D', '#E01C25', '#E94951'])]}
HOUSE_IDS = ['sun', 'wing', 'leaf', 'flame']
RAMP_EXC = {('house', 'Sun', 1): 5.8, ('house', 'Sun', 2): 3.5, ('house', 'Sun', 3): 6.3, ('hair', 'Blonde', 3): 5.1, ('iris', 'Amber', 2): 5.3}
FIXED_EXC = {'#F9DA99': {'ids': [9], 'max_px': 6, 'why': 'lantern brooch / buckle highlight, owner 15 Oct 2569'}}
DEFAULT = {'hair': 1, 'iris': 2, 'skin': 1, 'house': 1}   # Brown, Green, Medium, Wing (G1 _4 default)
SHADE_MAX = 0.02; FLAT_MIN_PX = 20; FLAT_MIN_DL = 15.0; ID11_LIMIT = 3729; PNG_MAX = 65536
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))

def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def hexc(c): return '#%02X%02X%02X' % tuple(int(v) for v in c[:3])
def lab(c):
    r, g, b = [v / 255 for v in c[:3]]
    f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    r, g, b = f(r), f(g), f(b)
    X = (r * .4124564 + g * .3575761 + b * .1804375) / .95047; Y = r * .2126729 + g * .7151522 + b * .0721750; Z = (r * .0193339 + g * .1191920 + b * .9503041) / 1.08883
    t = lambda v: v ** (1 / 3) if v > 216 / 24389 else (24389 / 27 * v + 16) / 116
    return 116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))
def de00(c1, c2):
    if isinstance(c1, str): c1 = rgb(c1)
    if isinstance(c2, str): c2 = rgb(c2)
    L1, a1, b1 = lab(c1); L2, a2, b2 = lab(c2)
    C1 = math.hypot(a1, b1); C2 = math.hypot(a2, b2); Cb = (C1 + C2) / 2; G = .5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2; C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dL = L2 - L1; dC = C2p - C1p
    dh = 0 if C1p * C2p == 0 else (h2p - h1p if abs(h2p - h1p) <= 180 else (h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360))
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2)); Lb = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hb = (h1p + h2p) if C1p * C2p == 0 else ((h1p + h2p) / 2 if abs(h1p - h2p) <= 180 else ((h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2))
    T = 1 - .17 * math.cos(math.radians(hb - 30)) + .24 * math.cos(math.radians(2 * hb)) + .32 * math.cos(math.radians(3 * hb + 6)) - .2 * math.cos(math.radians(4 * hb - 63))
    SL = 1 + .015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2); SC = 1 + .045 * Cbp; SH = 1 + .015 * Cbp * T
    RT = -2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-((hb - 275) / 25) ** 2)))
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))

def load(path): return np.array(Image.open(path).convert('RGBA'), dtype=np.uint8)
def sha(b): return hashlib.sha256(b).hexdigest()
def ncell(A): return A.shape[0] // 8
def dirs_of(A): return np.repeat(np.arange(8), ncell(A))[:, None] * np.ones((1, A.shape[1]), int)
def is_dark(A): mx = A[..., :3].max(-1).astype(int); mn = A[..., :3].min(-1).astype(int); return (mx + mn) <= 76
def iris_px(c, ymax):   # same HLS rule as the spec section 10 analysis and qa_asset09_a2.py
    out = []
    for y in range(min(ymax, c.shape[0])):
        for x in range(c.shape[1]):
            if c[y, x, 3]:
                h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c[y, x, :3]])
                if 90 <= h * 360 <= 170 and s > .3 and .15 < l < .75: out.append((x, y))
    return out
def eye_zones(iris):
    if not iris: return []
    xs = sorted(set(x for x, y in iris)); cl = [[xs[0]]]
    for x in xs[1:]: (cl[-1].append(x) if x - cl[-1][-1] <= 3 else cl.append([x]))
    z = []
    for g in cl:
        ys = [y for x, y in iris if g[0] <= x <= g[-1]]
        z.append([g[0] - 3, min(ys) - 4, g[-1] + 3, max(ys) + 2])
    return z
def in_zone(x, y, zones, pad=0): return any(a - pad <= x <= c + pad and b - pad <= y <= d + pad for a, b, c, d in zones)

# ---------- facts read from the locked A2 (no mask needed) ----------
def a2_facts(A, png_bytes=None):
    n = ncell(A); dk = is_dark(A); op = A[..., 3] > 0
    plum = op & (A[..., 0] == PLUM[0]) & (A[..., 1] == PLUM[1]) & (A[..., 2] == PLUM[2])
    F = {'a2_rgba_sha256': sha(A.tobytes()), 'size': [int(A.shape[1]), int(A.shape[0])], 'dirs': {}}
    if png_bytes is not None: F['a2_png_sha256'] = sha(png_bytes)
    for i, l in enumerate(L8):
        c = A[i * n:(i + 1) * n]; o = op[i * n:(i + 1) * n]; ys, xs = np.nonzero(o)
        ir = iris_px(c, 50 if n == 96 else n)
        F['dirs'][l] = dict(opaque=int(o.sum()), plum=int(plum[i * n:(i + 1) * n].sum()), inner_dark=int((dk & op)[i * n:(i + 1) * n].sum()),
                            bbox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None,
                            iris_px=[list(p) for p in ir], eye_zones=eye_zones(ir))
    F['plum_total'] = int(plum.sum()); F['inner_dark_total'] = int((dk & op).sum()); F['opaque_total'] = int(op.sum())
    F['semi_alpha'] = int(((A[..., 3] > 0) & (A[..., 3] < 255)).sum())
    return F

# ---------- renderer (independent of the checks) ----------
def ramp_arr(group, opt): return np.array([rgb(h) for h in RAMPS[group][opt][1]], dtype=np.uint8)
def render(A, ID, G, opts, keep=()):
    """opts = {'hair':i,'iris':i,'skin':i,'house':i}; keep = groups that keep the sprite's own colours (option B)."""
    out = A.copy()
    for k, grp in RECOL.items():
        if grp in keep: continue
        m = ID == k
        if m.any(): out[m, :3] = ramp_arr(grp, opts[grp])[G[m]]
    return out

def leak_test(A, ID, G, renderer=render):
    """640 combos x 8 directions = 5,120 cell images, in memory."""
    op = A[..., 3] > 0; fixed = np.isin(ID, FIXED); n = ncell(A); dirn = dirs_of(A)
    R = {'combos': 0, 'cells': 0, 'fixed_changed_px': 0, 'alpha_changed_px': 0, 'wrong_ramp_px': 0, 'eye_lines_changed_px': 0,
         'cross_material_px': 0, 'missing_change_px': 0, 'house_distinct': 0, 'copper_changed_by_house_px': 0, 'leak_dirs': {}}
    sizes = {g: len(RAMPS[g]) for g in RAMPS}; cache = {}
    def get(o):
        key = (o['hair'], o['iris'], o['skin'], o['house'])
        if key not in cache: cache[key] = renderer(A, ID, G, o)
        return cache[key]
    def note(mask):
        for d in np.unique(dirn[mask]): R['leak_dirs'][L8[d]] = R['leak_dirs'].get(L8[d], 0) + int((mask & (dirn == d)).sum())
    for h in range(sizes['hair']):
        for e in range(sizes['iris']):
            for s in range(sizes['skin']):
                cache.clear()
                for b in range(sizes['house']):
                    o = {'hair': h, 'iris': e, 'skin': s, 'house': b}; out = get(o)
                    R['combos'] += 1; R['cells'] += 8
                    R['alpha_changed_px'] += int((out[..., 3] != A[..., 3]).sum())
                    chg = (out[..., :3] != A[..., :3]).any(-1)
                    bad = chg & fixed & op; R['fixed_changed_px'] += int(bad.sum()); note(bad)
                    R['eye_lines_changed_px'] += int((chg & (ID == 2)).sum())
                    for k, grp in RECOL.items():
                        m = ID == k
                        if m.any():
                            want = ramp_arr(grp, o[grp])[G[m]]
                            wr = (out[m, :3] != want).any(-1); R['wrong_ramp_px'] += int(wr.sum())
                    for grp, k in (('hair', 4), ('iris', 5), ('skin', 3), ('house', 8)):
                        o2 = dict(o); o2[grp] = (o[grp] + 1) % sizes[grp]; out2 = get(o2)
                        d = (out2[..., :3] != out[..., :3]).any(-1)
                        cross = d & (ID != k); R['cross_material_px'] += int(cross.sum()); note(cross)
                        m = ID == k
                        if m.any():
                            diff_ramp = (ramp_arr(grp, o[grp])[G[m]] != ramp_arr(grp, o2[grp])[G[m]]).any(-1)
                            R['missing_change_px'] += int((diff_ramp & ~d[m]).sum())
                        if grp == 'house': R['copper_changed_by_house_px'] += int((d & (ID == 9)).sum())
    outs = [render(A, ID, G, dict(DEFAULT, house=b)) for b in range(4)]
    R['house_distinct'] = len({o[ID == 8].tobytes() for o in outs}) if (ID == 8).any() else 0
    R['PASS'] = (R['combos'] == 640 and R['cells'] == 5120 and R['fixed_changed_px'] == 0 and R['alpha_changed_px'] == 0 and R['wrong_ramp_px'] == 0
                 and R['eye_lines_changed_px'] == 0 and R['cross_material_px'] == 0 and R['missing_change_px'] == 0 and R['copper_changed_by_house_px'] == 0
                 and R['house_distinct'] == 4)
    return R

# ---------- generic checks (work on any 8-cell sheet) ----------
def id11_groups(ID, n):
    """8-connected ID 11 groups; each group must 4-touch at least 2 different materials among ID 3-10 (whole group)."""
    H, W = ID.shape; seen = np.zeros_like(ID, bool); groups = []
    for y0, x0 in zip(*np.nonzero(ID == 11)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; px = []; touch = set()
        while q:
            y, x = q.popleft(); px.append((x, y))
            for dx, dy in N4:
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and yy // n == y // n and 3 <= ID[yy, xx] <= 10: touch.add(int(ID[yy, xx]))
            for dx, dy in N8:
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and yy // n == y // n and not seen[yy, xx] and ID[yy, xx] == 11:
                    seen[yy, xx] = True; q.append((yy, xx))
        groups.append({'dir': L8[y0 // n], 'size': len(px), 'touches': sorted(touch), 'ok': len(touch) >= 2,
                       'first': [int(px[0][0]), int(px[0][1] % n)]})
    return groups

def shade_order(A, ID, G):
    n = ncell(A); res = {}; Lc = {}
    for i, l in enumerate(L8):
        for k in RECOL:
            m = np.zeros(ID.shape, bool); m[i * n:(i + 1) * n] = True; m &= ID == k
            if not m.any(): continue
            cols = A[m, :3]; Ls = np.array([Lc.setdefault(tuple(c), lab(tuple(int(v) for v in c))[0]) for c in cols]); g = G[m].astype(int)
            Gd = g[:, None] > g[None, :]; inv = int((Gd & (Ls[:, None] < Ls[None, :])).sum()); tot = int(Gd.sum())
            flat = len(set(g.tolist())) == 1 and len(g) >= FLAT_MIN_PX and (Ls.max() - Ls.min()) > FLAT_MIN_DL
            res['%s/%d' % (l, k)] = {'px': int(m.sum()), 'shades_used': sorted(set(g.tolist())), 'inverted_pairs': inv, 'pairs': tot,
                                     'rate': round(inv / tot, 4) if tot else 0.0, 'flat': bool(flat),
                                     'ok': (inv / tot <= SHADE_MAX if tot else True) and not flat}
    return res

def signal_check(A, ID):
    op = A[..., 3] > 0; out = {'fixed_fail': [], 'fixed_exceptions': [], 'ramp_fail': [], 'ramp_exceptions': []}
    seen = {}
    for k in FIXED:
        m = op & (ID == k)
        for c in {tuple(int(v) for v in x) for x in A[m, :3]}:
            h = hexc(c); d = [round(de00(c, s), 1) for s in SIG]
            if min(d) >= SIG_MIN: continue
            px = int((m & (A[..., :3] == c).all(-1)).sum())
            seen.setdefault(h, []).append((k, px, d))
    for h, lst in seen.items():
        tot = sum(p for _, p, _ in lst); ex = FIXED_EXC.get(h)
        for k, px, d in lst:
            row = {'colour': h, 'id': k, 'px': px, 'de00_gold_cyan': d}
            (out['fixed_exceptions'] if ex and k in ex['ids'] and tot <= ex['max_px'] else out['fixed_fail']).append(row)
    for grp, lst in RAMPS.items():
        for name, shades in lst:
            for gi, h in enumerate(shades):
                d = [round(de00(h, s), 1) for s in SIG]
                if min(d) >= SIG_MIN: continue
                row = {'ramp': grp, 'option': name, 'G': gi, 'colour': h, 'de00_gold_cyan': d}
                (out['ramp_exceptions'] if (grp, name, gi) in RAMP_EXC else out['ramp_fail']).append(row)
    out['PASS'] = not out['fixed_fail'] and not out['ramp_fail']
    return out

def top_colours(px, n=12):
    if not len(px): return []
    v, c = np.unique(px.astype(np.uint32) @ np.array([65536, 256, 1], np.uint32), return_counts=True)
    return ['#%06X x%d' % (int(a), int(b)) for a, b in sorted(zip(v, c), key=lambda t: -t[1])[:n]]

def islands(A, ID):
    """Soft flag: 1-2 px pieces of one material fully enclosed by a single other material (look at them in the Overlay)."""
    n = ncell(A); H, W = ID.shape; seen = np.zeros_like(ID, bool); out = []
    for y0, x0 in zip(*np.nonzero(ID > 0)):
        if seen[y0, x0]: continue
        k = ID[y0, x0]; q = deque([(y0, x0)]); seen[y0, x0] = True; px = []; nb = set()
        while q:
            y, x = q.popleft(); px.append((x, y))
            for dx, dy in N4:
                yy, xx = y + dy, x + dx
                if not (0 <= yy < H and 0 <= xx < W) or yy // n != y // n: continue
                if ID[yy, xx] == k and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
                elif ID[yy, xx] != k: nb.add(int(ID[yy, xx]))
        if len(px) <= 2 and len(nb - {0, 1, 11}) == 1 and (k in RECOL or (nb - {0, 1, 11}) & set(RECOL)):
            out.append({'dir': L8[y0 // n], 'id': int(k), 'x': int(px[0][0]), 'y': int(px[0][1] % n), 'size': len(px), 'inside': sorted(nb)})
    return out

# ---------- the full check ----------
def check(A, M, J, E, png_size=None):
    n = ncell(A); ID = M[..., 0]; G = M[..., 1]; B = M[..., 2]; op = A[..., 3] > 0; dirn = dirs_of(A)
    R = {}; H = {}
    H['1_size'] = A.shape == M.shape == (768, 96, 4)
    if not H['1_size']: R['hard'] = H; R['PASS'] = False; R['error'] = 'size %s vs %s' % (M.shape, A.shape); return R, ID, G
    H['2_id_range'] = int((ID > 11).sum()) == 0
    gmax = np.array([IDS[k][2] for k in range(12)] + [0] * 244)
    H['3_g_range'] = int((G > gmax[ID]).sum()) == 0 and int((B != 0).sum()) == 0
    R['g_out_of_range_px'] = int((G > gmax[ID]).sum()); R['b_nonzero_px'] = int((B != 0).sum())
    H['4_coverage'] = bool(((ID > 0) == op).all()) and int(((~op) & ((G != 0) | (B != 0))).sum()) == 0
    R['opaque_without_id'] = int((op & (ID == 0)).sum()); R['transparent_with_id'] = int(((~op) & (ID != 0)).sum())
    H['6_alpha'] = bool((M[..., 3] == A[..., 3]).all()) and int(((A[..., 3] > 0) & (A[..., 3] < 255)).sum()) == 0
    R['alpha_diff_px'] = int((M[..., 3] != A[..., 3]).sum())
    H['7_a2_unchanged'] = sha(A.tobytes()) == E['a2_rgba_sha256']
    plum = op & (A[..., 0] == PLUM[0]) & (A[..., 1] == PLUM[1]) & (A[..., 2] == PLUM[2])
    R['id1_missing'] = int((plum & (ID != 1)).sum()); R['id1_extra'] = int(((ID == 1) & ~plum).sum()); R['id1_total'] = int((ID == 1).sum())
    H['8_id1_eq_plum_1882'] = R['id1_missing'] == 0 and R['id1_extra'] == 0 and R['id1_total'] == E['plum_total'] == 1882
    # wrong material (hard rules that do not depend on judgement)
    wm = {'face_ids_in_back_dirs': 0, 'iris_colour_not_id5': [], 'id5_outside_eye_zone': [], 'face_dirs_missing': []}
    for i, l in enumerate(L8):
        sl = slice(i * n, (i + 1) * n); idc = ID[sl]
        if l in BACK: wm['face_ids_in_back_dirs'] += int(np.isin(idc, [2, 5, 10]).sum())
        zones = E['dirs'][l]['eye_zones']
        for x, y in E['dirs'][l]['iris_px']:
            if idc[y, x] != 5: wm['iris_colour_not_id5'].append([l, x, y, int(idc[y, x])])
        for y, x in zip(*np.nonzero(idc == 5)):
            if not in_zone(x, y, zones): wm['id5_outside_eye_zone'].append([l, int(x), int(y)])
        if l in FACE:
            need = {'id2': int((idc == 2).sum()), 'id5': int((idc == 5).sum()), 'cheek_g1': int(((idc == 10) & (G[sl] == 1)).sum())}
            if l in MOUTH: need['mouth_g0'] = int(((idc == 10) & (G[sl] == 0)).sum())
            miss = [k for k, v in need.items() if v == 0]
            if miss: wm['face_dirs_missing'].append([l, miss])
    R['wrong_material'] = wm
    H['5_wrong_material'] = wm['face_ids_in_back_dirs'] == 0 and not wm['iris_colour_not_id5'] and not wm['id5_outside_eye_zone']
    H['9_id2_eyes_present'] = not any('id2' in m or 'id5' in m for _, m in wm['face_dirs_missing'])
    g11 = id11_groups(ID, n); R['id11'] = {'groups': len(g11), 'failing_groups': [g for g in g11 if not g['ok']], 'total_px': int((ID == 11).sum()),
                                          'inner_dark_total': E['inner_dark_total'], 'ratio_of_inner_dark': round(int((ID == 11).sum()) / E['inner_dark_total'], 3),
                                          'not_dark_px': int(((ID == 11) & ~is_dark(A)).sum()), 'max_group': max([g['size'] for g in g11] or [0])}
    H['10_id11_groups'] = not R['id11']['failing_groups'] and R['id11']['total_px'] < ID11_LIMIT
    H['11_mouth_cheek'] = not any(('cheek_g1' in m or 'mouth_g0' in m) for _, m in wm['face_dirs_missing'])
    feet = {}
    for i, l in enumerate(L8):
        ys, xs = np.nonzero(A[i * n:(i + 1) * n, :, 3] > 0); feet[l] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    R['bbox'] = feet
    H['12_feet_shape'] = all(feet[l] == E['dirs'][l]['bbox'] and feet[l][3] == 94 for l in L8) and H['6_alpha']
    so = shade_order(A, ID, G); R['shade_order'] = so
    H['13_shade_order'] = all(v['ok'] for v in so.values()) and all(any(k.endswith('/%d' % i) for k in so) for i in (3, 4, 8))
    sg = signal_check(A, ID); R['signal'] = sg; H['14_signal_de00'] = sg['PASS']
    if H['2_id_range'] and H['3_g_range'] and H['4_coverage']:
        lk = leak_test(A, ID, G); R['leak'] = lk; H['15_leak_5120'] = lk['PASS']
    else:
        R['leak'] = 'skipped: fix checks 2-4 first'; H['15_leak_5120'] = False
    js = {'schema': J.get('schema') == 1, 'file': J.get('file') == 'c2-pilot-kid4-mask.png',
          'ids': sorted(str(k) for k in (J.get('ids') or {})) == sorted(str(k) for k in range(12)),
          'ramps': J.get('ramps') == {'skin': 5, 'hair': 5, 'iris': 3, 'house': 4}}
    sc = J.get('source_colors') or {}; bad = []
    for k in range(1, 12):
        real = {hexc(c) for c in A[op & (ID == k), :3]}; got = {str(h).upper() for h in sc.get(str(k), [])}
        if real != got: bad.append({'id': k, 'missing_in_json': sorted(real - got)[:8], 'extra_in_json': sorted(got - real)[:8]})
    js['source_colors'] = not bad; R['json'] = dict(js, source_color_diffs=bad)
    H['16_json'] = all(js.values())
    R['png_bytes'] = png_size; H['17_png_size'] = png_size is None or png_size <= PNG_MAX
    # counts per ID per direction (report item 3)
    R['counts'] = {l: {str(k): int((ID[i * n:(i + 1) * n] == k).sum()) for k in range(1, 12)} for i, l in enumerate(L8)}
    R['counts']['total'] = {str(k): int((ID == k).sum()) for k in range(1, 12)}
    R['cheek_mouth'] = {l: {'mouth_g0': int(((ID[i * n:(i + 1) * n] == 10) & (G[i * n:(i + 1) * n] == 0)).sum()),
                            'cheek_g1': int(((ID[i * n:(i + 1) * n] == 10) & (G[i * n:(i + 1) * n] == 1)).sum())} for i, l in enumerate(L8)}
    # soft flags (never fail)
    soft = {'islands': islands(A, ID),
            'id2_outside_eye_zone_pad2': [[l, int(x), int(y)] for i, l in enumerate(L8) for y, x in zip(*np.nonzero(ID[i * n:(i + 1) * n] == 2))
                                         if not in_zone(x, y, E['dirs'][l]['eye_zones'], 2)],
            'mouth_g0_in_E_W': {l: R['cheek_mouth'][l]['mouth_g0'] for l in ('E', 'W')},
            'colours_per_id': {str(k): top_colours(A[op & (ID == k), :3]) for k in range(1, 12)}}
    R['soft_flags'] = soft
    R['hard'] = H; R['PASS'] = all(H.values())
    return R, ID, G

# ---------- images (only after a real mask is delivered) ----------
OVC = {1: (224, 64, 251), 2: (0, 229, 255), 3: (255, 138, 101), 4: (255, 235, 59), 5: (0, 230, 118), 6: (124, 77, 255), 7: (141, 110, 99),
       8: (41, 121, 255), 9: (255, 145, 0), 10: (244, 143, 177), 11: (255, 23, 68)}
def up(a, s): a = np.ascontiguousarray(a); return Image.fromarray(a, 'RGBA').resize((a.shape[1] * s, a.shape[0] * s), Image.NEAREST)
def on_bg(a, bg):
    im = Image.new('RGBA', (a.shape[1], a.shape[0]), bg + (255,)); im.alpha_composite(Image.fromarray(a, 'RGBA')); return np.array(im)
def overlay(A, ID, mode):
    o = A.copy(); op = A[..., 3] > 0
    lum = (0.3 * A[..., 0] + 0.59 * A[..., 1] + 0.11 * A[..., 2]).astype(np.uint8)
    for k, c in OVC.items():
        m = op & (ID == k)
        if mode == 'flat': o[m, :3] = c
        elif mode == 'blend': o[m, :3] = (0.45 * lum[m, None] + 0.55 * np.array(c)).astype(np.uint8)
        elif mode == 'only11':
            o[op, :3] = np.stack([lum[op] // 2 + 90] * 3, -1) if k == 1 else o[op, :3]
            if k == 11: o[m, :3] = c
    return o
def cell(a, i, n=96): return a[i * n:(i + 1) * n]
def text(d, xy, s, fill=(20, 20, 30)): d.text(xy, s, fill=fill)
def sheet(rows, s, bg, labels=None, pad=8, top=14, cols=None):
    """rows = list of lists of 96x96 RGBA arrays; cols = optional column labels."""
    ct = 14 if cols else 0; fg = (230, 230, 240) if sum(bg) < 300 else (20, 20, 30)
    w = max(len(r) for r in rows) * (96 * s + pad) + pad + 110; h = len(rows) * (96 * s + pad + top) + pad + ct
    im = Image.new('RGBA', (w, h), bg + (255,)); d = ImageDraw.Draw(im)
    for c, t in enumerate(cols or []): text(d, (110 + c * (96 * s + pad) + 2, 2), t, fg)
    for r, row in enumerate(rows):
        y = ct + pad + r * (96 * s + pad + top)
        if labels: text(d, (4, y + 2), labels[r], fg)
        for c, a in enumerate(row): im.alpha_composite(up(a, s), (110 + c * (96 * s + pad), y + top))
    return im
def stack(parts):
    W = max(p.width for p in parts); im = Image.new('RGBA', (W, sum(p.height for p in parts)), (255, 255, 255, 255)); y = 0
    for p in parts:
        im.paste(p.getpixel((0, 0)), (0, y, W, y + p.height)); im.alpha_composite(p, (0, y)); y += p.height
    return im
def images(A, ID, G, od):
    os.makedirs(od, exist_ok=True); LIGHT = (232, 230, 240); DARK = (30, 27, 46); made = []
    def save(im, name): im.save(os.path.join(od, name), optimize=True); made.append(name)
    # 1. overlay 8 dirs: original / blend / flat
    rows = [[cell(A, i) for i in range(8)], [cell(overlay(A, ID, 'blend'), i) for i in range(8)], [cell(overlay(A, ID, 'flat'), i) for i in range(8)]]
    im = sheet(rows, 3, LIGHT, ['A2 original', 'mask over grey', 'mask colours']); d = ImageDraw.Draw(im)
    for i, l in enumerate(L8): text(d, (110 + i * (96 * 3 + 8) + 4, 2), l)
    leg = Image.new('RGBA', (im.width, 40), LIGHT + (255,)); dl = ImageDraw.Draw(leg); x = 8
    for k, c in OVC.items():
        dl.rectangle((x, 12, x + 14, 26), fill=c + (255,)); text(dl, (x + 18, 13), '%d %s' % (k, IDS[k][0])); x += 26 + 7 * len('%d %s' % (k, IDS[k][0]))
    full = Image.new('RGBA', (im.width, im.height + 40), LIGHT + (255,)); full.alpha_composite(leg, (0, 0)); full.alpha_composite(im, (0, 40)); save(full, 'a3-overlay-8dirs.png')
    # 2. zooms: eyes (face dirs), brooch + cape hem + legs (S), hair (N), ID 11 only (S, N)
    E = a2_facts(A); zs = []
    for i, l in enumerate(L8):
        for z in E['dirs'][l]['eye_zones']: zs.append(('eye ' + l, i, (z[0] - 3, z[1] - 3, z[2] + 4, z[3] + 4)))
    zs += [('brooch+trim S', 0, (30, 44, 66, 62)), ('belt+legs S', 0, (28, 58, 68, 86)), ('cape hem SW', 7, (20, 50, 80, 92)), ('hair N', 4, (20, 6, 76, 52))]
    tiles = []
    for name, i, (x0, y0, x1, y1) in zs:
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(96, x1), min(96, y1); s = 10 if (x1 - x0) < 30 else 6
        a = on_bg(cell(A, i)[y0:y1, x0:x1], LIGHT); b = on_bg(cell(overlay(A, ID, 'flat'), i)[y0:y1, x0:x1], LIGHT)
        t = Image.new('RGBA', ((x1 - x0) * s * 2 + 12, (y1 - y0) * s + 16), (255, 255, 255, 255)); t.alpha_composite(up(a, s), (0, 16)); t.alpha_composite(up(b, s), ((x1 - x0) * s + 12, 16))
        text(ImageDraw.Draw(t), (2, 2), name); tiles.append(t)
    o11 = [up(on_bg(cell(overlay(A, ID, 'only11'), i), LIGHT), 4) for i in (0, 4)]
    for i, t in zip((0, 4), o11):
        tt = Image.new('RGBA', (t.width, t.height + 16), (255, 255, 255, 255)); tt.alpha_composite(t, (0, 16)); text(ImageDraw.Draw(tt), (2, 2), 'ID 11 only (red) ' + L8[i]); tiles.append(tt)
    W = 1800; x = y = 0; rowh = 0; pos = []
    for t in tiles:
        if x + t.width > W: x = 0; y += rowh + 10; rowh = 0
        pos.append((x, y)); x += t.width + 10; rowh = max(rowh, t.height)
    zim = Image.new('RGBA', (W, y + rowh), (255, 255, 255, 255))
    for t, p in zip(tiles, pos): zim.alpha_composite(t, p)
    save(zim, 'a3-overlay-zoom.png')
    # 3-7. colour test previews (official ramps, other options at default)
    def rr(**kw): return render(A, ID, G, dict(DEFAULT, **kw))
    save(sheet([[cell(rr(house=b), i) for i in range(8)] for b in range(4)], 2, LIGHT, [n for n, _ in RAMPS['house']], cols=L8), 'a3-preview-houses.png')
    save(sheet([[cell(rr(skin=k), i) for i in range(8)] for k in range(4)], 2, LIGHT, [n for n, _ in RAMPS['skin']], cols=L8), 'a3-preview-skin.png')
    save(sheet([[cell(rr(hair=k), i) for i in range(8)] for k in range(8)], 2, LIGHT, [n for n, _ in RAMPS['hair']], cols=L8), 'a3-preview-hair.png')
    heads = []
    for k in range(5):
        o = rr(iris=k); row = []
        for l in FACE:
            i = L8.index(l); z = E['dirs'][l]['eye_zones']; x0 = max(0, min(a for a, _, _, _ in z) - 6); y0 = max(0, min(b for _, b, _, _ in z) - 6)
            c = np.zeros((96, 96, 4), np.uint8); crop = cell(o, i)[y0:y0 + 24, x0:x0 + 32]; c[:crop.shape[0], :crop.shape[1]] = crop; row.append(c[:24, :32])
        heads.append(row)
    s = 6; w = 110 + 5 * (32 * s + 8); h = 5 * (24 * s + 22); im = Image.new('RGBA', (w, h), LIGHT + (255,)); d = ImageDraw.Draw(im)
    for r, row in enumerate(heads):
        text(d, (4, r * (24 * s + 22) + 4), RAMPS['iris'][r][0])
        for c, a in enumerate(row): im.alpha_composite(up(a, s), (110 + c * (32 * s + 8), r * (24 * s + 22) + 18)); text(d, (110 + c * (32 * s + 8), r * (24 * s + 22) + 4), FACE[c])
    save(im, 'a3-preview-iris.png')
    rng = np.random.RandomState(9); mix = []; lab16 = []
    for _ in range(16):
        o = {g: int(rng.randint(len(RAMPS[g]))) for g in RAMPS}; mix.append(cell(render(A, ID, G, o), 0)); lab16.append('/'.join(RAMPS[g][o[g]][0][:4] for g in ('hair', 'iris', 'skin', 'house')))
    im = sheet([mix[r * 4:(r + 1) * 4] for r in range(4)], 3, LIGHT); d = ImageDraw.Draw(im)
    for j, t in enumerate(lab16): text(d, (110 + (j % 4) * (96 * 3 + 8), 8 + (j // 4) * (96 * 3 + 8 + 14) + 2), t)
    save(im, 'a3-preview-mix16.png')
    # 8. D-A3-1 comparison: A = official ramps for every default; B = keep the _4 colours for defaults
    Aimg = render(A, ID, G, DEFAULT); Bimg = A.copy(); main5 = [L8.index(l) for l in ('S', 'SE', 'E', 'NE', 'N')]
    parts = []
    for bg in (LIGHT, DARK):
        parts.append(sheet([[cell(Aimg, i) for i in main5], [cell(Bimg, i) for i in main5]], 3, bg, ['A official', 'B keep _4'], cols=['S', 'SE', 'E', 'NE', 'N']))
        parts.append(sheet([[cell(Aimg, i) for i in main5], [cell(Bimg, i) for i in main5]], 1, bg, ['A 1x', 'B 1x']))
    save(stack(parts), 'a3-dA31-main5.png')
    parts = []
    for bg in (LIGHT, DARK):
        ra = [cell(render(A, ID, G, dict(DEFAULT, skin=k)), 0) for k in range(4)]
        rb = [cell(render(A, ID, G, dict(DEFAULT, skin=k), keep=('hair', 'iris', 'house') + (('skin',) if k == DEFAULT['skin'] else ())), 0) for k in range(4)]
        parts.append(sheet([ra, rb], 2, bg, ['A official', 'B (Medium = _4)'], cols=[n for n, _ in RAMPS['skin']]))
        ha = [cell(render(A, ID, G, dict(DEFAULT, house=b)), i) for b in range(4) for i in (0, 4)]
        hb = [cell(render(A, ID, G, dict(DEFAULT, house=b), keep=('hair', 'iris', 'skin') + (('house',) if b == DEFAULT['house'] else ())), i) for b in range(4) for i in (0, 4)]
        parts.append(sheet([ha, hb], 2, bg, ['A official', 'B (Wing = _4)'], cols=['%s %s' % (n, d) for n, _ in RAMPS['house'] for d in ('S', 'N')]))
    save(stack(parts), 'a3-dA31-skin-houses.png')
    return made

def da31_numbers(A, ID):
    """dE00 from each _4 colour to the nearest shade of the default option (and skin Light) - for D-A3-1 sheet 4."""
    op = A[..., 3] > 0; out = {}
    for k, grp in RECOL.items():
        opts = [DEFAULT[grp]] + ([0] if grp == 'skin' else [])
        for o in opts:
            ds = []
            for c in {tuple(int(v) for v in x) for x in A[op & (ID == k), :3]}:
                ds.append(min(de00(c, h) for h in RAMPS[grp][o][1]))
            if ds: out['%s %s' % (grp, RAMPS[grp][o][0])] = {'colours': len(ds), 'min': round(min(ds), 1), 'mean': round(sum(ds) / len(ds), 1), 'max': round(max(ds), 1)}
    return out

# ---------- self-test on tiny synthetic sheets (no character mask is built) ----------
def selftest(a2_path, exp_path):
    ok = True; msgs = []
    def t(name, cond): nonlocal ok; ok &= bool(cond); msgs.append(('ok ' if cond else 'BAD ') + name)
    A2 = load(a2_path); E = json.load(open(exp_path, encoding='utf-8')); F = a2_facts(A2, open(a2_path, 'rb').read())
    t('A2 rgba sha = expected', F['a2_rgba_sha256'] == E['a2_rgba_sha256'])
    t('A2 plum 1882 / inner dark 3729 / opaque 21255', (F['plum_total'], F['inner_dark_total'], F['opaque_total']) == (1882, 3729, 21255))
    t('eye zones S SE E W SW only', [l for l in L8 if F['dirs'][l]['eye_zones']] == FACE)
    t('ramp exceptions = 5 locked ones', sorted((r['ramp'], r['option'], r['G']) for r in signal_check(np.zeros((8, 2, 4), np.uint8), np.zeros((8, 2), np.uint8))['ramp_exceptions']) == sorted(RAMP_EXC))
    # synthetic 8 cells of 6x6: material 3 (skin, 2 shades), 8 (cape), 11 line between them, 6 fixed cloth
    n = 6; A = np.zeros((8 * n, 6, 4), np.uint8); M = np.zeros_like(A)
    for i in range(8):
        y = i * n
        A[y + 1:y + 5, 1:5] = (200, 150, 120, 255); M[y + 1:y + 5, 1:5, 0] = 3
        A[y + 1:y + 3, 1:3, :3] = (150, 100, 80); M[y + 1:y + 3, 1:3, 1] = 0; M[y + 3:y + 5, 1:5, 1] = 2; M[y + 1:y + 3, 3:5, 1] = 2
        A[y + 1:y + 5, 2] = (20, 10, 20, 255); M[y + 1:y + 5, 2, 0] = 11; M[y + 1:y + 5, 2, 1] = 0
        A[y + 1:y + 5, 3:5, :3] = (90, 118, 135); M[y + 1:y + 5, 3:5, 0] = 8; M[y + 1:y + 3, 3:5, 1] = 0; M[y + 3:y + 5, 3:5, 1] = 1
        A[y + 4, 1, :3] = (240, 240, 230); M[y + 4, 1, 0] = 6; M[y + 4, 1, 1] = 0
    M[..., 3] = A[..., 3]; ID, G = M[..., 0], M[..., 1]
    g = id11_groups(ID, n); t('ID 11 line between skin and cape passes', g and all(x['ok'] for x in g))
    M2 = M.copy(); c0 = M2[0:n, :, 0]; c0[(c0 == 6) | (c0 == 8)] = 3; g2 = id11_groups(M2[..., 0], n)
    t('ID 11 inside one material is caught', any(not x['ok'] for x in g2))
    lk = leak_test(A, ID, G)
    t('leak test: good renderer -> 0 leaks, 5,120 cells', lk['cells'] == 5120 and lk['fixed_changed_px'] == 0 and lk['cross_material_px'] == 0 and lk['wrong_ramp_px'] == 0)
    def bad_render(A_, ID_, G_, o, keep=()):
        out = render(A_, ID_, G_, o); m = ID_ == 6; out[m, :3] = ramp_arr('hair', o['hair'])[0]; return out
    lk2 = leak_test(A, ID, G, bad_render); t('leak test: renderer that paints cloth with hair colour is caught', lk2['fixed_changed_px'] > 0 and lk2['cross_material_px'] > 0 and not lk2['PASS'])
    so = shade_order(A, ID, G); t('shade order ok on a correct ramp', all(v['ok'] for v in so.values()))
    M3 = M.copy(); M3[0 * n + 1:0 * n + 3, 1:2, 1] = 4; so3 = shade_order(A, M3[..., 0], M3[..., 1]); t('inverted shades are caught', not all(v['ok'] for v in so3.values()))
    sg = signal_check(np.array([[[0xF9, 0xDA, 0x99, 255]] * 6 + [[0xFF, 0xC8, 0x57, 255]]], np.uint8), np.array([[9] * 6 + [9]], np.uint8))
    t('signal: #F9DA99 x6 on ID 9 = exception, #FFC857 = fail', len(sg['fixed_exceptions']) == 1 and len(sg['fixed_fail']) == 1)
    print('\n'.join(msgs)); print('SELFTEST', 'PASS' if ok else 'FAIL'); return ok

def main():
    a = sys.argv[1:]
    if not a: print(__doc__ or open(__file__).read().split('\nimport')[0]); return 2
    if a[0] == 'expected':
        A = load(a[1]); F = a2_facts(A, open(a[1], 'rb').read())
        F.update({'spec': 'ASSET_SPEC_09 v2.4 sections 12 + 19', 'a2_commit': '5bfda3b', 'base_branch_for_a3': 'codex/asset-09-a3-mask from 5bfda3b',
                  'ids': {str(k): {'name': v[0], 'colour': v[1], 'g_max': v[2]} for k, v in IDS.items()},
                  'ramps': {g: [{'option': n_, 'G0_to_Gmax': s} for n_, s in v] for g, v in RAMPS.items()}, 'house_order': HOUSE_IDS,
                  'ramp_source': 'game 2.33 HAIRC/EYEC/HOUSES (eb60c65) = G1_MATERIAL_PALETTE_V1_2 sections 2-4; skin = section 5 (pilot only, D3)',
                  'signal': {'colours': SIG, 'min_de00': SIG_MIN, 'ramp_exceptions': [list(k) + [v] for k, v in RAMP_EXC.items()], 'fixed_exceptions': FIXED_EXC},
                  'defaults_A': {g: RAMPS[g][i][0] for g, i in DEFAULT.items()}, 'shade_order_max': SHADE_MAX, 'id11_limit': ID11_LIMIT, 'png_max_bytes': PNG_MAX})
        json.dump(F, open(a[2], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':')); print('wrote', a[2]); return 0
    if a[0] == 'selftest': return 0 if selftest(a[1], a[2]) else 1
    if a[0] == 'check':
        A = load(a[1]); M = load(a[2]); J = json.load(open(a[3], encoding='utf-8')); E = json.load(open(a[4], encoding='utf-8')); od = a[5]; os.makedirs(od, exist_ok=True)
        R, ID, G = check(A, M, J, E, os.path.getsize(a[2])); R['inputs'] = {'a2_png_sha256': sha(open(a[1], 'rb').read()), 'mask_png_sha256': sha(open(a[2], 'rb').read())}
        if '--images' in a and R['hard']['2_id_range'] and R['hard']['3_g_range'] and R['hard']['4_coverage']:
            R['images'] = images(A, ID, G, od); R['dA31_de00'] = da31_numbers(A, ID)
        json.dump(R, open(os.path.join(od, 'a3-qa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        for k, v in R['hard'].items(): print(('PASS ' if v else 'FAIL ') + k)
        lk = R['leak'] if isinstance(R['leak'], dict) else {}
        print('ID11: %d px in %d groups (%.0f%% of %d inner dark), failing groups %d' % (R['id11']['total_px'], R['id11']['groups'], 100 * R['id11']['ratio_of_inner_dark'], E['inner_dark_total'], len(R['id11']['failing_groups'])))
        print('leak: %s cells, fixed %s, cross %s, wrong ramp %s' % (lk.get('cells'), lk.get('fixed_changed_px'), lk.get('cross_material_px'), lk.get('wrong_ramp_px')))
        print('soft flags: islands %d, ID2 outside eye zone %d' % (len(R['soft_flags']['islands']), len(R['soft_flags']['id2_outside_eye_zone_pad2'])))
        print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); return 0 if R['PASS'] else 1
    print('unknown command'); return 2

if __name__ == '__main__':
    sys.exit(main())
