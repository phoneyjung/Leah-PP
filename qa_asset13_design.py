#!/usr/bin/env python3
# Design Preflight D1-D4 for ASSET_SPEC_13 section 10.10 (v1.2b, owner approved for the repo 18 Oct ~14:58) - fix3 of the lantern L0, S view (Claude · 18 Oct 2569)
# Tested 18 Oct: 72/72 cases. Claude's S3+M feasibility plan reaches PREFLIGHT PASS only with sheet B supplied in memory - that plan is NOT an asset; no real fix3 delivery exists yet.
# NOT a QA gate. The official QA stays qa_asset13.py QA 1.2a (24 gates, unchanged); this script runs it first, then checks D1-D4.
# Read-only on every input. Never crashes on bad input: anything that cannot be evaluated = FAIL (no fake PASS).
# usage: python3 -I qa_asset13_design.py DIR FIX1_DIR FIX2_DIR HOLD_ANCHORS_JSON OUT_JSON
#   DIR      = delivery to check: 4 asset files + sheet A ...-fix2-compare-x8.png (QA 10') + sheet B ...-fix3-vs-fix2-x8.png
#   FIX1_DIR = fix1 12948e2 (reference of QA 1.2a) · FIX2_DIR = fix2 ca3d75b (opaque-px limit of D1d, colours of D3d, "before" of sheet B)
#   pinned by SHA-256 below (read from the committed files): qa_asset13.py, fix1, fix2, the hold anchors json and the 2 sprite sheets G3 uses; any mismatch = PREFLIGHT FAIL
# exit 0 = PREFLIGHT PASS = references OK + QA 1.2a exit code 0 with exactly the 24 gates, 24/24 PASS, no error, nothing skipped + all 15 D items PASS
#          + route M (owner-selected design direction) + sheet A and sheet B strict PASS + no error · 1 = FAIL · 2 = usage/setup error
# Result words: item = PASS / FAIL · D3c row = OK / REVERSED / N/A · route = M / K / UNCLEAR · items judged by people = MANUAL (never counted as PASS)
import sys, os, json, math, ast, hashlib, subprocess
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); QA = os.path.join(HERE, 'qa_asset13.py'); LOAD_ERR = None
QA_SHA = '803625c902527922b2ee38ff0e3ee6d4501241d51a8d46b207adcc4c58508820'   # qa_asset13.py at a2efe77
try:   # the same L*/dE00 code as QA 1.2a, copied at run time from the unchanged file - only after its SHA-256 is confirmed
    _raw = open(QA, 'rb').read()
    if hashlib.sha256(_raw).hexdigest() != QA_SHA: raise ValueError('qa_asset13.py SHA-256 mismatch (not the a2efe77 file)')
    _src = _raw.decode('utf-8'); _ns = {'math': math}
    exec(_src[_src.index('def lab'):_src.index('def hexc')], _ns); lab, de00 = _ns['lab'], _ns['de00']
    EXPECTED_V12 = ast.literal_eval(next(x for x in _src.splitlines() if x.startswith('EXPECTED_V12 = ')).split('=', 1)[1].strip())   # the 24 gate ids of QA 1.2a
except Exception as e: lab = de00 = None; EXPECTED_V12 = []; LOAD_ERR = 'cannot load lab/de00/EXPECTED_V12 from qa_asset13.py: ' + repr(e)
BASE = 'c2-held-lantern_L0-S-trial'; SHEET_A = BASE + '-fix2-compare-x8.png'; SHEET_B = BASE + '-fix3-vs-fix2-x8.png'
ANCH_FILES = ['c2-pilot-kid4-idleanim.png', 'c2-pilot-kid4-walkhold.png']   # the sprite sheets QA G3 reads (named in the pinned anchors json)
REF = {'qa_asset13.py (a2efe77)': QA_SHA,
       'fix1 12948e2 .png': '1b1ae264c8603a4be6c7551b3efe7f73b3eaf189b8c3d0b445cb470ca2c23fa7', 'fix1 12948e2 -light.png': 'd8e75b18f654468627feecf0d75ac991fb1fe3566e6fd629e7f80e0a8f42aeb4',
       'fix2 ca3d75b .png': 'b75105d97518b893179b7dbeaf2cbd10f63660cf640c2b3b2bf6b7aa21cd4409', 'fix2 ca3d75b -light.png': '349ed6efcd204b946d9ba04cf3bfa45060ea809c1d850768c0e77aaa3019388f',
       'hold anchors json (87bba95 = a2efe77)': '38f16cd4418e13b905b6b8fa53b8c307f09489b1248ef92515c601dc2094acba',
       'G3 sheet c2-pilot-kid4-idleanim.png (1714c65 = a2efe77)': '13182512fd2a0d6b2a1947fcc3eea9cd883d760c018792d5cc278ad144156045',
       'G3 sheet c2-pilot-kid4-walkhold.png (fd2a55f = a2efe77)': '3dbe652d8a5f18b869b42ddd27a523d1d03609096e397507839d82c6cb310553'}
ROUTES = {'M': {'frame_left': ['#915B49'], 'frame_right': ['#67413A'], 'rib_left': ['#BB7A57'], 'rib_right': ['#915B49']},   # owner-selected design direction (spec 10.10)
          'K': {'frame_left': ['#BB7A57'], 'frame_right': ['#915B49'], 'rib_left': ['#BB7A57'], 'rib_right': ['#915B49']}}   # backup, NOT approved
APPROVED_ROUTE = 'M'
PLUM = (0x3A, 0x1E, 0x3F); COPPER = [(0x3D, 0x29, 0x2C), (0x67, 0x41, 0x3A), (0x91, 0x5B, 0x49), (0xBB, 0x7A, 0x57)]
GLASS_L = (0xFF, 0xB3, 0x6B); BG_DARK = (0x1E, 0x1B, 0x2E)
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))   # 4-neighbour only, never diagonal
CX = 16                                    # centre column (grip x): left side = x <= 15, right side = x >= 17
ROWS_SIDE = range(12, 19); ROWS_D3C = range(10, 21); MIN_EVAL_D3C = 8; RIB_COLS = [14, 18]
D_IDS = ['D1a', 'D1b', 'D1c', 'D1d', 'D2a', 'D2b', 'D2c', 'D3a', 'D3b', 'D3c', 'D3d', 'D4a', 'D4b', 'D4c', 'D4d']

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def load(d):
    a = np.array(Image.open(os.path.join(d, BASE + '.png')).convert('RGBA')).astype(int)
    l = np.array(Image.open(os.path.join(d, BASE + '-light.png')).convert('RGBA')).astype(int)
    if a.shape != (32, 32, 4) or l.shape != (32, 32, 4): raise ValueError('image size %s / %s, need 32x32' % (a.shape[:2], l.shape[:2]))
    return a, l

def qa_check(qa, gid):   # (pass, value) of one QA 1.2a gate · missing QA, missing gate, errors, exit code not explicitly 0 or pass not boolean true = never a pass
    if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list): return False, None
    for c in qa['checks']:
        if isinstance(c, dict) and str(c.get('check', '')).split(' ')[0] == gid:
            return c.get('pass') is True and not qa.get('errors') and qa.get('_exit_code') == 0, c.get('value')
    return False, None

def qa_gate(rc, qa):   # official QA counts only if: exit code 0, exactly the 24 expected gate ids once each, 24/24 PASS, no errors, nothing 'NOT EVALUATED'
    if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list): return False, {'exit_code': rc, 'result': 'QA json missing or malformed'}
    ch = qa['checks']; ids = [str(c.get('check', '')).split(' ')[0] if isinstance(c, dict) else '?' for c in ch]
    skipped = [str(c.get('check')) for c in ch if isinstance(c, dict) and 'NOT EVALUATED' in str(c.get('check', ''))]
    n_pass = sum(1 for c in ch if isinstance(c, dict) and c.get('pass') is True)
    missing = [g for g in EXPECTED_V12 if g not in ids]; unexpected = [i for i in ids if i not in EXPECTED_V12]; dup = sorted({i for i in ids if ids.count(i) > 1})
    ok = rc == 0 and len(EXPECTED_V12) == 24 and len(ch) == 24 and n_pass == 24 and not missing and not unexpected and not dup and not skipped and not qa.get('errors')
    return ok, {'exit_code': rc, 'gates': len(ch), 'pass': n_pass, 'errors': qa.get('errors'), 'skipped': skipped, 'missing_ids': missing, 'unexpected_ids': unexpected, 'duplicate_ids': dup}

def dv(v, k): return v.get(k) if isinstance(v, dict) else None   # safe read of a QA value (QA may be missing or partial)

def lit(b, li): o = b.copy(); m = li[..., 3] > 0; o[m] = li[m]; return o

def design_checks(a, l, f2, qa):
    """a, l = 32x32 RGBA int arrays of the delivery · f2 = (base, light) of fix2 or None · qa = QA 1.2a json dict or None"""
    if lab is None: raise RuntimeError(LOAD_ERR)
    if a.shape != (32, 32, 4) or l.shape != (32, 32, 4): raise ValueError('image size, need 32x32')
    op = a[..., 3] > 0; lop = l[..., 3] > 0; glass = lop & np.all(l[..., :3] == GLASS_L, axis=2)
    inb = lambda x, y: 0 <= x < 32 and 0 <= y < 32
    col = lambda x, y: tuple(int(v) for v in a[y, x, :3]) if inb(x, y) and op[y, x] else None   # None = transparent / outside
    iscop = lambda x, y: col(x, y) in COPPER
    onplum = lambda x, y: any(col(x + dx, y + dy) == PLUM for dx, dy in N4)
    Lof = lambda x, y: lab(col(x, y))[0]
    mean = lambda v: round(float(np.mean(v)), 2) if len(v) else None
    items, rep = [], {}
    def item(iid, text, fn):
        try: ok, val = fn()
        except Exception as e: ok, val = False, 'ERROR ' + repr(e)   # cannot evaluate = FAIL
        items.append({'id': iid, 'text': text, 'result': 'PASS' if ok else 'FAIL', 'value': val})
    # ---- D1 / D2 silhouette: width of every row y9-21 = rightmost - leftmost opaque x + 1 (0 = empty row)
    W = {y: (int(np.nonzero(op[y])[0].max() - np.nonzero(op[y])[0].min() + 1) if op[y].any() else 0) for y in range(9, 22)}
    rep['width_y9_21'] = [W[y] for y in range(9, 22)]; full = all(W[y] > 0 for y in range(9, 22))   # an empty row can never pass D1 (no vacuous PASS)
    item('D1a', 'width y9 -> y16 never decreases (every row y9-21 non-empty)', lambda: (full and all(W[y + 1] >= W[y] for y in range(9, 16)), [W[y] for y in range(9, 17)]))
    item('D1b', 'width y16 -> y21 never increases (every row y9-21 non-empty)', lambda: (full and all(W[y + 1] <= W[y] for y in range(16, 21)), [W[y] for y in range(16, 22)]))
    pinch = [y for y in range(10, 21) if W[y] < W[y - 1] and W[y] < W[y + 1]]
    item('D1c', 'no pinch row (narrower than both neighbours) in y10-20 (every row y9-21 non-empty)', lambda: (full and not pinch, {'pinch_rows': pinch, 'empty_rows': [y for y in range(9, 22) if W[y] == 0]}))
    n_op = int(op.sum()); n_f2 = int((f2[0][..., 3] > 0).sum()) if f2 else None
    item('D1d', 'S3 shape: cap y10-11 width <= 11, body y12-16 width = 13, opaque px <= fix2',
         lambda: (n_f2 is not None and W[10] <= 11 and W[11] <= 11 and all(W[y] == 13 for y in range(12, 17)) and n_op <= n_f2,
                  {'cap_y10_11': [W[10], W[11]], 'body_y12_16': [W[y] for y in range(12, 17)], 'opaque_px': n_op, 'fix2_opaque_px': n_f2}))
    item('D2a', 'rounded base: width y21 = width y20 - 2', lambda: (W[21] == W[20] - 2, {'y20': W[20], 'y21': W[21]}))
    ys, xs = np.nonzero(op); bb = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if op.any() else None
    item('D2b', 'bottom row y21 and bbox exactly [10,4,23,22]', lambda: (bb == [10, 4, 23, 22], {'bbox_xyxy_exclusive': bb}))
    g3ok, g3 = qa_check(qa, 'G3')
    def d2c():
        if not isinstance(g3, dict) or not isinstance(g3.get('max_increase_per_dir'), dict): return False, 'QA 1.2a G3 result missing'
        m = g3['max_increase_per_dir']; return g3ok and max(m.values()) <= 10, {'max_increase_per_dir': m, 'E': m.get('E'), 'W': m.get('W'), 'QA_G3': g3ok}
    item('D2c', 'G3 from QA 1.2a: every hold frame <= +10 vs fix1 (E/W reported; a QA run with errors = FAIL)', d2c)
    # ---- ribs (used by D3b and D4d): copper px in y12-18 with light on both 4-sides and no copper beside it = exactly 1 px wide
    rib = [(x, y) for y in ROWS_SIDE for x in range(1, 31) if iscop(x, y) and lop[y, x - 1] and lop[y, x + 1] and not iscop(x - 1, y) and not iscop(x + 1, y)]
    ribset = set(rib); rcols = sorted({x for x, _ in rib})
    # ---- D3 light from the upper left (L* of CIELAB D65, same code as QA)
    frames = {'L': [], 'R': []}   # frame = copper px in y12-18, 4-touching a plum px, not a rib column, not the centre column
    for y in ROWS_SIDE:
        for x in range(32):
            if x != CX and x not in RIB_COLS and iscop(x, y) and onplum(x, y): frames['L' if x < CX else 'R'].append((x, y))
    ribs = {'L': [(14, y) for y in ROWS_SIDE if (14, y) in ribset], 'R': [(18, y) for y in ROWS_SIDE if (18, y) in ribset]}
    def diff(pl, pr):
        mL, mR = mean([Lof(*p) for p in pl]), mean([Lof(*p) for p in pr])
        return (mL is not None and mR is not None and mL - mR >= 10), {'left_L': mL, 'right_L': mR, 'diff': round(mL - mR, 2) if None not in (mL, mR) else None, 'left_px': len(pl), 'right_px': len(pr)}
    item('D3a', 'mean L* left frame - right frame >= 10 (frame = copper 4-touching plum, y12-18)', lambda: diff(frames['L'], frames['R']))
    item('D3b', 'mean L* rib x14 - rib x18 >= 10 (rib px only, y12-18)', lambda: diff(ribs['L'], ribs['R']))
    sig = {k: sorted({'#%02X%02X%02X' % col(*q) for q in v}) for k, v in (('frame_left', frames['L']), ('frame_right', frames['R']), ('rib_left', ribs['L']), ('rib_right', ribs['R']))}
    rep['route'] = {'route': next((r for r, sg in ROUTES.items() if sig == sg), 'UNCLEAR'), 'signature': sig}   # exact colour signature, else UNCLEAR
    rows = {}
    for y in ROWS_D3C:
        lc = [Lof(x, y) for x in range(0, CX) if iscop(x, y)]; rc = [Lof(x, y) for x in range(CX + 1, 32) if iscop(x, y)]
        st = 'N/A' if not lc or not rc else ('OK' if np.mean(lc) >= np.mean(rc) - 1e-9 else 'REVERSED')
        rows[y] = {'copper_left_L': mean(lc), 'copper_right_L': mean(rc), 'status': st}
    ev = [y for y in rows if rows[y]['status'] != 'N/A']; rev = [y for y in rows if rows[y]['status'] == 'REVERSED']
    item('D3c', 'every row y10-20: mean L* copper left >= right; a row without copper on both sides = N/A (reported, not counted); >= 8 evaluable rows',
         lambda: (not rev and len(ev) >= MIN_EVAL_D3C, {'reversed_rows': rev, 'na_rows': [y for y in rows if rows[y]['status'] == 'N/A'], 'evaluable_rows': len(ev)}))
    f2cols = sorted({tuple(int(v) for v in p[:3]) for p in f2[0][f2[0][..., 3] > 0]}) if f2 else None
    cols = sorted({tuple(int(v) for v in p[:3]) for p in a[op]})
    item('D3d', 'no new colour: every opaque colour is one of the fix2 colours (Copper Trim 4 shades, plum, glass, crystal)',
         lambda: (f2cols is not None and len(cols) > 0 and set(cols) <= set(f2cols), {'n_colours': len(cols), 'new_colours': ['#%02X%02X%02X' % c for c in cols if not f2cols or c not in f2cols]}))
    rep['L_by_row'] = {y: {'frame_left': mean([Lof(x, yy) for x, yy in frames['L'] if yy == y]), 'frame_right': mean([Lof(x, yy) for x, yy in frames['R'] if yy == y]),
                           'rib_x14': round(Lof(14, y), 2) if (14, y) in ribset else None, 'rib_x18': round(Lof(18, y), 2) if (18, y) in ribset else None,
                           **rows.get(y, {})} for y in range(10, 21)}
    # ---- D4 seams
    gp = [[[int(x), int(y)], [int(x + dx), int(y + dy)]] for y, x in zip(*np.nonzero(glass)) for dx, dy in N4 if col(x + dx, y + dy) == PLUM]
    n_glass = int(glass.sum()); glass_no_base = int((glass & ~op).sum())   # no glass, or glass over nothing = cannot be judged -> FAIL
    item('D4a', 'glass px (light #FFB36B) 4-touching the plum outline = 0 (glass present, every glass px over a base px)',
         lambda: (not gp and n_glass > 0 and glass_no_base == 0, {'contacts': len(gp), 'first': gp[:6], 'glass_px': n_glass, 'glass_without_base': glass_no_base}))
    pairs = []; bad_light = 0   # (light px, 4-adjacent opaque unlit copper px of ALL 4 shades) - stricter than QA 8c, which skips #3D292C
    for y, x in zip(*np.nonzero(lop)):
        if not op[y, x]: bad_light += 1; continue   # light over a transparent base px cannot be measured -> D4b/D4c FAIL
        for dx, dy in N4:
            xx, yy = x + dx, y + dy
            if inb(xx, yy) and op[yy, xx] and not lop[yy, xx] and iscop(xx, yy):
                c = col(xx, yy); pairs.append(([int(x), int(y)], [int(xx), int(yy)], de00(col(x, y), c), de00(tuple(int(v) for v in l[y, x, :3]), c)))
    mu = min(p[2] for p in pairs) if pairs else None; ml = min(p[3] for p in pairs) if pairs else None
    ok8, v8 = qa_check(qa, '8c')
    item('D4b', 'seam unlit: every (light px, 4-adjacent copper px, all 4 shades) dE00 >= 14',
         lambda: (bool(pairs) and not bad_light and mu >= 14, {'pairs': len(pairs), 'light_px_without_base': bad_light, 'min_dE_unlit': round(mu, 2) if pairs else None,
                                                               'QA_8c_min_unlit': dv(v8, 'min_dE_unlit'), 'worst': [p[:2] for p in sorted(pairs, key=lambda p: p[2])[:3]]}))
    item('D4c', 'seam lit: QA 8c PASS and the same pairs lit dE00 >= 10', lambda: (ok8 and bool(pairs) and not bad_light and ml >= 10, {'min_dE_lit': round(ml, 2) if pairs else None, 'QA_8c': ok8}))
    def run(x):   # longest vertical run of rib px in column x
        best = cur = 0
        for y in ROWS_SIDE: cur = cur + 1 if (x, y) in ribset else 0; best = max(best, cur)
        return best
    extra = [[x, y] for y in ROWS_SIDE for x in range(32) if iscop(x, y) and not onplum(x, y) and (x, y) not in ribset]   # 2-px rib, crossbar, stray copper
    okC2, _ = qa_check(qa, 'C2'); okC2b, _ = qa_check(qa, 'C2b')
    item('D4d', 'ribs 1 px wide only at x14 and x18 (run >= 4); every other copper px in y12-18 is a frame px touching plum; QA C2 + C2b PASS',
         lambda: (rcols == RIB_COLS and all(run(x) >= 4 for x in rcols) and not extra and okC2 and okC2b,
                  {'rib_cols': rcols, 'runs': {x: run(x) for x in rcols}, 'extra_copper_px': extra[:8], 'QA_C2': okC2, 'QA_C2b': okC2b}))
    # ---- margins + G1 (report only, never a gate here; an error here never changes an item result)
    try:
        outer = {(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) == PLUM and any(col(x + dx, y + dy) is None for dx, dy in N4)}
        rim = [(x, y) for y, x in zip(*np.nonzero(op)) if y >= 10 and col(x, y) != PLUM and any((x + dx, y + dy) in outer for dx, dy in N4)]
        v5a = min((de00(col(x, y), BG_DARK) for x, y in rim), default=None)
        v5b = min((de00(col(x, y), BG_DARK) for y, x in zip(*np.nonzero(glass)) if col(x, y) is not None), default=None)
        _, c2 = qa_check(qa, 'C2'); g3m = dv(g3, 'max_increase_per_dir')
        g1_f2 = int(((f2[1][..., 3] > 0) & np.all(f2[1][..., :3] == GLASS_L, axis=2)).sum()) if f2 else None
        marg = {'G3_max_per_dir': g3m, 'G3_margin_to_10': (10 - max(g3m.values())) if isinstance(g3m, dict) and g3m else None,
                '8c_unlit_min (QA, >=10)': dv(v8, 'min_dE_unlit'), '8c_lit_min (QA, >=10)': dv(v8, 'min_dE_lit'), 'D4b_unlit_min (>=14)': round(mu, 2) if pairs else None,
                'C2_glass_min_unlit_lit (>=15)': dv(c2, 'glass_min_unlit_lit'), 'C2_crystal_min_unlit_lit (>=15)': dv(c2, 'crystal_min_unlit_lit'),
                'V5a_min (>=20)': round(v5a, 2) if v5a is not None else None, 'V5b_min (>=15)': round(v5b, 2) if v5b is not None else None,
                'G1_glass_light_px (report only)': int(glass.sum()), 'G1_fix2': g1_f2}
    except Exception as e: marg = {'error': repr(e)}
    return items, rep, marg

def check_sheet(C, before, after, name):
    """compare sheet 512x576, every px alpha 255 · 4 panels 256x256, nearest x8: (0,32) before unlit · (256,32) after unlit · (0,320) before lit · (256,320) after lit
       inside the panels: an opaque sprite cell = the exact sprite colour · a transparent sprite cell = the ONE sheet background colour (no stray px)
       bands y0-31 and y288-319 = labels (any colour, alpha 255) · sheet A = fix1 -> new (QA 10' name) · sheet B = fix2 -> new"""
    if C is None: return False, 'missing ' + name
    if C.shape[:2] != (576, 512): return False, {'size': [C.shape[1], C.shape[0]]}
    x8n = lambda img: np.repeat(np.repeat(img, 8, axis=0), 8, axis=1); bad_op, subs = {}, {}
    for k, (px, py, img) in {'before_unlit': (0, 32, before[0]), 'after_unlit': (256, 32, after[0]), 'before_lit': (0, 320, lit(*before)), 'after_lit': (256, 320, lit(*after))}.items():
        ref = x8n(img); sub = C[py:py + 256, px:px + 256]; m = ref[..., 3] > 0
        bad_op[k] = int((sub[m][:, :3] != ref[m][:, :3]).any(axis=1).sum()); subs[k] = sub[~m]
    allbg = np.concatenate(list(subs.values()))
    if not len(allbg): return False, 'no background cell to judge'
    vals, cnt = np.unique(allbg, axis=0, return_counts=True); bg = vals[cnt.argmax()]
    bad_bg = {k: int((v != bg).any(axis=1).sum()) for k, v in subs.items()}; alpha_bad = int((C[..., 3] != 255).sum())
    ok = all(v == 0 for v in bad_op.values()) and all(v == 0 for v in bad_bg.values()) and alpha_bad == 0
    return ok, {'size': [512, 576], 'opaque_mismatch': bad_op, 'stray_px_in_background': bad_bg, 'background': [int(v) for v in bg], 'alpha_not_255': alpha_bad}

MANUAL = [('M1 (D1e)', 'ChatGPT at 75% and 100%: the body y12-16 (13 px wide for 5 rows) no longer reads as a box'),
          ('M2 (G1)', 'ChatGPT: real brightness of the lit glass (G1 px reported) at 75% ON on light / dark / cave'),
          ('M3 (route M)', 'ChatGPT: the light right glass edge next to dark copper reads as a reflection, not reversed light - 75% OFF/ON x light/dark/cave'),
          ('M4 (sheets)', 'sheet A (fixed QA name, fix1 -> new) and sheet B (fix2 -> new) carry readable labels in the top bands; CODEX_STATUS says which is which; '
                          'the sheet background contrasts with the plum outline #3A1E3F (checked by eye - this script does not check it)')]

def main(argv):
    if len(argv) != 5: print('usage: qa_asset13_design.py DIR FIX1_DIR FIX2_DIR HOLD_ANCHORS_JSON OUT_JSON'); return 2
    D, F1, F2, ANCH, OUT = argv
    if not os.path.isdir(os.path.dirname(os.path.abspath(OUT))): print('setup error: folder of OUT_JSON does not exist: ' + OUT); return 2
    if LOAD_ERR: print('setup error: ' + LOAD_ERR); return 2
    errors = []; qa = None; qa_out = OUT + '.qa12a.json'
    refs = {}   # 0) pinned references: unchanged QA 1.2a, the right fix1 and fix2, and the anchors + sprite sheets behind G3
    for k, p in (('qa_asset13.py (a2efe77)', QA), ('fix1 12948e2 .png', os.path.join(F1, BASE + '.png')), ('fix1 12948e2 -light.png', os.path.join(F1, BASE + '-light.png')),
                 ('fix2 ca3d75b .png', os.path.join(F2, BASE + '.png')), ('fix2 ca3d75b -light.png', os.path.join(F2, BASE + '-light.png')),
                 ('hold anchors json (87bba95 = a2efe77)', ANCH),
                 ('G3 sheet c2-pilot-kid4-idleanim.png (1714c65 = a2efe77)', os.path.join(os.path.dirname(os.path.abspath(ANCH)), ANCH_FILES[0])),
                 ('G3 sheet c2-pilot-kid4-walkhold.png (fd2a55f = a2efe77)', os.path.join(os.path.dirname(os.path.abspath(ANCH)), ANCH_FILES[1]))):
        try: refs[k] = 'OK' if sha(p) == REF[k] else 'SHA-256 MISMATCH'
        except Exception as e: refs[k] = 'MISSING ' + type(e).__name__
    refs_ok = all(v == 'OK' for v in refs.values())
    if not refs_ok: errors.append('references: ' + json.dumps(refs))
    try:   # 1) official QA 1.2a, unchanged, in its own process; a stale result file can never be read
        if os.path.exists(qa_out): os.remove(qa_out)
        p = subprocess.run([sys.executable, '-I', QA, D, ANCH, qa_out, '1.2', F1], capture_output=True, text=True, timeout=900)
        rc = p.returncode; qa = json.load(open(qa_out))
        if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list) or not all(isinstance(c, dict) and 'check' in c and 'pass' in c for c in qa['checks']):
            errors.append('QA 1.2a result malformed'); qa = None
        else:
            qa['_exit_code'] = rc   # read by qa_check: QA-based D items never pass on a non-zero exit
            if rc != 0: errors.append('QA 1.2a exit code %d (must be 0)' % rc)
    except Exception as e: errors.append('QA 1.2a not run: ' + repr(e)); qa = None; rc = None
    p0, qa_info = qa_gate(rc, qa)
    qa_n = qa_info.get('gates', 0); qa_pass = qa_info.get('pass', 0)
    a = l = f2 = f1 = None
    try: a, l = load(D)
    except Exception as e: errors.append('delivery: ' + repr(e))
    try: f1 = load(F1)
    except Exception as e: errors.append('fix1: ' + repr(e))
    try: f2 = load(F2)
    except Exception as e: errors.append('fix2: ' + repr(e))
    items, rep, marg = [], {}, {}
    if a is not None:
        try: items, rep, marg = design_checks(a, l, f2, qa)
        except Exception as e: errors.append('design: ' + repr(e)); items = []
    done = {i['id'] for i in items}
    items += [{'id': i, 'text': 'NOT EVALUATED (missing or broken input)', 'result': 'FAIL', 'value': errors[-1] if errors else None} for i in D_IDS if i not in done]
    items.sort(key=lambda i: D_IDS.index(i['id']))
    def sheet(name, before):   # strict check of a compare sheet (A: before = fix1 · B: before = fix2)
        try:
            Cp = os.path.join(D, name)
            C = np.array(Image.open(Cp).convert('RGBA')).astype(int) if os.path.exists(Cp) else None
            return check_sheet(C, before, (a, l), name) if (a is not None and before is not None) else (False, 'delivery or reference images missing')
        except Exception as e: return False, 'ERROR ' + repr(e)
    sa, sb = sheet(SHEET_A, f1), sheet(SHEET_B, f2)
    qa10_ok, _ = qa_check(qa, "10'")
    rt = (rep.get('route') or {}).get('route')
    route_ok = rt == APPROVED_ROUTE
    route_msg = {'M': 'route M (owner-selected design direction)', 'K': 'ROUTE K = backup, NOT approved by the owner -> FAIL', 'UNCLEAR': 'ROUTE UNCLEAR -> needs owner review, no automatic PASS'}.get(rt, 'route not evaluated -> FAIL')
    pre = refs_ok and p0 and all(i['result'] == 'PASS' for i in items) and route_ok and sa[0] and qa10_ok and sb[0] and not errors
    R = {'preflight': 'PASS' if pre else 'FAIL', 'references': refs, 'qa_1_2a': {**qa_info, 'all_24_pass_exit0': p0},
         'items': items, 'route': {'result': 'PASS' if route_ok else 'FAIL', 'value': route_msg, 'signature': (rep.get('route') or {}).get('signature')},
         'sheet_A': {'result': 'PASS' if sa[0] and qa10_ok else 'FAIL', 'strict': sa[1], 'QA_10prime': qa10_ok}, 'sheet_B': {'result': 'PASS' if sb[0] else 'FAIL', 'strict': sb[1]},
         'manual_for_artistic_review': [{'id': i, 'check': t, 'result': 'MANUAL'} for i, t in MANUAL], 'report': rep, 'margins': marg, 'errors': errors,
         'rule': 'Design Preflight is not QA. A FAIL is reported to the owner; only the owner may approve an exception. Experimental scores never replace it.'}
    try: json.dump(R, open(OUT, 'w'), indent=1, ensure_ascii=False, default=str)
    except Exception as e: print('ERROR writing OUT_JSON: ' + repr(e)); pre = False
    print('REFERENCES %s' % ('OK' if refs_ok else json.dumps(refs)))
    print('QA 1.2a: exit %s · %d/%d PASS%s' % (qa_info.get('exit_code'), qa_pass, qa_n, '' if p0 else '  -> not accepted (needs exit 0, the 24 gates, 24/24, no error, nothing skipped)'))
    for i in items: print('%-4s %-4s %s :: %s' % (i['result'], i['id'], i['text'], json.dumps(i['value'], ensure_ascii=False, default=str)[:220]))
    print('%-4s ROUTE %s :: %s' % (R['route']['result'], route_msg, json.dumps(R['route']['signature'])))
    print('%-4s SHEET-A %s (QA 10\' name, fix1 -> new) :: %s' % (R['sheet_A']['result'], SHEET_A, json.dumps(sa[1], default=str)[:200]))
    print('%-4s SHEET-B %s (fix2 -> new) :: %s' % (R['sheet_B']['result'], SHEET_B, json.dumps(sb[1], default=str)[:200]))
    if rep.get('L_by_row'):
        print('D3c rows (copper L* left/right, status): ' + ' · '.join('y%d %s/%s %s' % (y, v['copper_left_L'], v['copper_right_L'], v['status']) for y, v in rep['L_by_row'].items()))
    for i, t in MANUAL: print('MANUAL %s %s' % (i, t))
    print('MARGINS ' + json.dumps(marg, ensure_ascii=False, default=str)); print('ERRORS ' + json.dumps(errors, default=str) if errors else 'ERRORS none')
    print('PREFLIGHT: %s' % ('PASS' if pre else 'FAIL') + ('' if pre else '  -> report to the owner; an exception needs the owner\'s approval'))
    return 0 if pre else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
