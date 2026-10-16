#!/usr/bin/env python3
# ASSET_SPEC_12 independent QA (Claude) · part B = walk cleanup (48 frames) · section 8 of the spec, numbers only.
# usage: python3 -I qa_asset12.py walk SRC.png SPRITE.png MASK.png CHANGES.json HOLES.json STRAP.json OUT_DIR
#        python3 -I qa_asset12.py walkhold SRC SPRITE MASK CHANGES HOLES STRAP LOCKED_WALK LOCKED_WALK_MASK OUT_DIR   (part D, spec 1.4 section 14)
# needs qa_asset09_a3.py (e1d74b4) and qa_g2_2_intake.py in the same folder. Reads Codex files as data; writes only into OUT_DIR.
import sys, os, json
from collections import deque, Counter
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_asset09_a3 as q

L8 = q.L8; C = 96; PLUM = np.array(q.PLUM, np.uint8); BACK = ['NE', 'N', 'NW']
GOLD = np.array(q.rgb('#F9DA99'), np.uint8); MAX_PNG = 160 * 1024
GRASS = (140, 176, 112); LIGHT = (232, 230, 240); DARK = (30, 27, 46); PHONE = (844, 390); DPR = 2.625

def cells(A, nf):
    for i, D in enumerate(L8):
        for k in range(nf): yield i, D, k, (slice(i * C, (i + 1) * C), slice(k * C, (k + 1) * C))

def outer_mask(op):
    """4-connected flood of transparent pixels from the cell border"""
    out = np.zeros_like(op); dq = deque()
    for y in range(C):
        for x in (0, C - 1):
            if not op[y, x] and not out[y, x]: out[y, x] = True; dq.append((y, x))
    for x in range(C):
        for y in (0, C - 1):
            if not op[y, x] and not out[y, x]: out[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dx, dy in q.N4:
            yy, xx = y + dy, x + dx
            if 0 <= yy < C and 0 <= xx < C and not op[yy, xx] and not out[yy, xx]: out[yy, xx] = True; dq.append((yy, xx))
    return out

def enclosed(op):
    t = ~op; seen = np.zeros_like(t); res = []
    for y0, x0 in zip(*np.nonzero(t)):
        if seen[y0, x0]: continue
        dq = deque([(y0, x0)]); seen[y0, x0] = True; pts = []; edge = False
        while dq:
            y, x = dq.popleft(); pts.append((int(x), int(y))); edge |= x in (0, C - 1) or y in (0, C - 1)
            for dx, dy in q.N4:
                yy, xx = y + dy, x + dx
                if 0 <= yy < C and 0 <= xx < C and t[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
        if not edge: res.append(pts)
    return res

def components(mask):
    seen = np.zeros_like(mask); res = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        dq = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
        while dq:
            y, x = dq.popleft(); pts.append((int(x), int(y)))
            for dx, dy in q.N4:
                yy, xx = y + dy, x + dx
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
        res.append(pts)
    return res

def hx(c): return '#%02X%02X%02X%02X' % tuple(int(v) for v in c)

def check_walk(srcp, sprp, mskp, chgp, holp, strp, od, anim='walk', skip=(), fill_big=(), keep_big=('SE f3',), outname='qa-asset12-B.json', img=True, allow_px=(), log_srcp=None, allow_box=None):
    # log_srcp = original source for the change log / rollback when SRC was adjusted by a spec-approved copy (part D: NW f1 head <- NW f2)
    # allow_box = {(dir, frame): (x0, y0, x1, y1, max_px)} seam edits allowed after such a copy
    # allow_px = {(dir, frame, x, y)} single-pixel colour fixes the spec names explicitly (part D: 2 x #F9DA99 on the W tunic hem)
    # part D (walk_hold, spec 1.4 section 14): anim='walk_hold', skip=('S','N') rows are checked separately (copy of the locked walk),
    # fill_big = '>3 px' holes Claude decided to fill (NE f2, NW f5); keep_big = natural gaps that stay open (SE f3)
    os.makedirs(od, exist_ok=True)
    S = q.load(srcp); A = q.load(sprp); M = q.load(mskp); CH = json.load(open(chgp, encoding='utf-8'))['changes']
    HO = json.load(open(holp, encoding='utf-8')); ST = json.load(open(strp, encoding='utf-8'))
    ID = M[..., 0].astype(int); G = M[..., 1].astype(int); nf = 6
    S0 = q.load(log_srcp) if log_srcp else S
    seam = {}
    R = {'files': {os.path.basename(p): os.path.getsize(p) for p in (sprp, mskp, chgp)}}
    H = {}   # hard checks
    H['01 sprite 576x768'] = A.shape[:2] == (768, 576); H['01 mask 576x768'] = M.shape[:2] == (768, 576)
    H['01 alpha binary (semi 0)'] = int(((A[..., 3] > 0) & (A[..., 3] < 255)).sum()) == 0
    H['01 mask alpha = sprite alpha'] = bool((M[..., 3] == A[..., 3]).all())
    opS = S[..., 3] > 0; opA = A[..., 3] > 0
    # expected hole fills (<= 3 px groups; the 6 px SE f3 gap stays)
    exp_fill = set(); kept_big = []
    for key, groups in HO['holes'].items():
        D, f = key.split(' f'); i = L8.index(D); k = int(f) - 1
        for g in groups:
            if D in skip: continue
            if g['px'] <= 3 or key in fill_big: exp_fill |= {(i * C + y, k * C + x) for x, y in g['pts']}
            else: kept_big.append((key, g['px']))
    achg = {(int(y), int(x)) for y, x in zip(*np.nonzero(S[..., 3] != A[..., 3])) if L8[int(y) // C] not in skip}
    R['alpha_changed'] = len(achg); R['alpha_expected'] = len(exp_fill)
    H['02 alpha changes = listed hole fills exactly'] = achg == exp_fill and all(A[y, x, 3] == 255 and S[y, x, 3] == 0 for y, x in achg)
    per = {}; plum_bad = 0; plum_miss = 0; other_out = 0; head_chg = 0; newcol = 0; small_left = 0; big_ok = 0; gold = []; nonplum_edge = []
    for i, D, k, sl in cells(A, nf):
        if D in skip: continue
        s = S[sl]; a = A[sl]; op = a[..., 3] > 0; key = '%s f%d' % (D, k + 1)
        out = outer_mask(op); edge = op & np.zeros_like(op)
        for dx, dy in q.N4:
            sh = np.zeros_like(out); ys = slice(max(0, dy), C + min(0, dy)); yd = slice(max(0, -dy), C + min(0, -dy))
            xs = slice(max(0, dx), C + min(0, dx)); xd = slice(max(0, -dx), C + min(0, -dx)); sh[yd, xd] = out[ys, xs]; edge |= op & sh
        pre = np.where((s[..., 3] > 0)[..., None], s, a)
        dark = (pre[..., :3].max(-1).astype(int) + pre[..., :3].min(-1).astype(int)) <= 76
        expect = edge & dark; plum = op & (a[..., :3] == PLUM).all(-1)
        plum_bad += int((plum & ~expect).sum()); plum_miss += int((expect & ~plum).sum())
        ys, xs = np.nonzero(edge & ~dark); nonplum_edge += [(i, k, int(x), int(y)) for x, y in zip(xs, ys)]
        holefill = np.zeros_like(op)
        for (yy, xx) in exp_fill:
            if sl[0].start <= yy < sl[0].stop and sl[1].start <= xx < sl[1].stop: holefill[yy - sl[0].start, xx - sl[1].start] = True
        chg = (s != a).any(-1) & ~plum & ~holefill
        for (aD, af, ax, ay) in allow_px:
            if aD == D and af == k + 1: chg[ay, ax] = False
        if allow_box and (D, k + 1) in allow_box:
            bx0, by0, bx1, by1, lim = allow_box[(D, k + 1)]; reg = np.zeros_like(chg); reg[by0:by1 + 1, bx0:bx1 + 1] = True
            seam[key] = int((chg & reg).sum())
            if seam[key] <= lim: chg &= ~reg
        box = ST['frames'].get(key, {}).get('box_x0y0x1y1')
        inbox = np.zeros_like(op)
        if box: x0, y0, x1, y1 = box; inbox[max(0, y0 - 1):y1 + 2, max(0, x0 - 1):x1 + 2] = True
        o = int((chg & ~inbox).sum()); other_out += o
        head_chg += int(chg[:51].sum())
        sc = {tuple(c) for c in s[s[..., 3] > 0][:, :3]}; ac = {tuple(c) for c in a[op][:, :3]} - {tuple(PLUM)}
        nc = len(ac - sc); newcol += nc
        hs = enclosed(op); small = [h for h in hs if len(h) <= 3]; small_left += len(small)
        if key in fill_big: small_left += sum(1 for h in hs if len(h) > 3)
        if key == 'SE f3' and 'SE f3' in keep_big: big_ok = int(any(len(h) == 6 for h in hs))
        g = op & (a[..., :3] == GOLD).all(-1); gs = (s[..., :3] == GOLD).all(-1) & (s[..., 3] > 0)
        gid = ID[sl][g]
        gold.append({'cell': key, 'px': int(g.sum()), 'all_id9': bool((gid == 9).all()), 'new_positions': int((g & ~gs).sum())})
        per[key] = {'changed_non_plum_non_hole': int(chg.sum()), 'outside_strap_box': o, 'head_rows_le_50': int(chg[:51].sum()),
                    'plum_px': int(plum.sum()), 'plum_expected': int(expect.sum()), 'new_colours': nc, 'holes_le3_left': len(small)}
    R['per_cell'] = per; R['kept_big_holes'] = kept_big
    H['03 holes <= 3 px left = 0'] = small_left == 0
    H['03 SE f3 6 px natural gap kept'] = big_ok == 1
    H['04 plum = A2 formula exactly (missing 0 · extra 0)'] = plum_bad == 0 and plum_miss == 0
    R['plum_missing'] = plum_miss; R['plum_extra'] = plum_bad; R['plum_total'] = int(sum(v['plum_px'] for v in per.values()))
    H['05 other changes only inside strap boxes (+1 px)'] = other_out == 0
    H['05 other changes <= 30 px per frame'] = all(v['changed_non_plum_non_hole'] <= 30 for v in per.values())
    H['05 no strap edits in E NE N NW W'] = all(v['changed_non_plum_non_hole'] == 0 for kk, v in per.items() if kk.split()[0] in ('E', 'NE', 'N', 'NW', 'W'))
    H['06 head rows <= 50 unchanged (except plum/holes)'] = head_chg == 0
    H['07 new colours 0 (except plum)'] = newcol == 0
    # change log: exact and reversible
    log = {}; bad_log = 0; tasks = Counter()
    for e in CH:
        if e.get('anim') != anim: continue
        i = L8.index(e['dir']); k = e['frame'] - 1; y = i * C + e['y']; x = k * C + e['x']
        log[(y, x)] = e; tasks[e['task']] += 1
        if hx(S0[y, x]) != e['before'].upper() or hx(A[y, x]) != e['after'].upper(): bad_log += 1
    diff = {(int(y), int(x)) for y, x in zip(*np.nonzero((S0 != A).any(-1))) if L8[int(y) // C] not in skip}
    back = A.copy()
    for (y, x), e in log.items():
        h = e['before'].lstrip('#'); back[y, x] = [int(h[j:j + 2], 16) for j in (0, 2, 4, 6)]
    R['log'] = {'entries': len(log), 'diff_px': len(diff), 'tasks': dict(tasks), 'wrong_before_after': bad_log}
    H['08 change log covers every changed pixel exactly'] = set(log) == diff and bad_log == 0
    keep_rows = np.array([L8[y // C] not in skip for y in range(S.shape[0])])
    H['08 rollback = source RGBA 100%'] = bool((back[keep_rows] == S0[keep_rows]).all())
    R['seam_edits'] = seam
    # mask
    opm = A[..., 3] > 0
    H['09 mask: opaque -> ID 1-11 · transparent -> ID 0'] = bool(((ID >= 1) & (ID <= 11))[opm].all() and (ID[~opm] == 0).all())
    gmax = {k: v[2] for k, v in q.IDS.items()}
    H['09 mask: G within range of its ID'] = all(int(G[ID == k].max(initial=0)) <= gm for k, gm in gmax.items())
    H['09 mask: ID 1 = plum pixels exactly'] = bool(((ID == 1) == (opm & (A[..., :3] == PLUM).all(-1))).all())
    backrows = np.zeros(ID.shape, bool)
    for D in BACK: i = L8.index(D); backrows[i * C:(i + 1) * C] = True
    H['09 mask: back dirs have no ID 2/5/10'] = int((backrows & np.isin(ID, [2, 5, 10])).sum()) == 0
    grp_bad = 0; ngrp = 0; n11 = 0; shade_bad = []; flat = []
    for k in range(nf):
        Ak = np.ascontiguousarray(A[:, k * C:(k + 1) * C]); Ik = np.ascontiguousarray(ID[:, k * C:(k + 1) * C]); Gk = np.ascontiguousarray(G[:, k * C:(k + 1) * C])
        gr = q.id11_groups(Ik, C); ngrp += len(gr); grp_bad += sum(1 for g in gr if not g['ok']); n11 += int((Ik == 11).sum())
        so = q.shade_order(Ak, Ik, Gk)
        shade_bad += ['f%d %s %.3f' % (k + 1, kk, v['rate']) for kk, v in so.items() if not v['ok']]
    R['id11'] = {'px': n11, 'groups': ngrp, 'groups_failing': grp_bad}; R['shade_failing'] = shade_bad
    H['09 mask: ID 11 groups all touch >= 2 materials'] = grp_bad == 0
    H['09 mask: shade order (<= 2% inverted, no flat)'] = not shade_bad
    leg8 = []
    for i, D, k, sl in cells(A, nf):
        I8 = ID[sl] == 8; opk = A[sl][..., 3] > 0
        for comp in components(I8):
            if len(comp) <= 3:
                # spec 1.3.2: a cape-tip remnant (touches another ID 8 px diagonally AND borders transparent space) is not a leg piece
                cs = set(comp)
                touch8 = any(0 <= y + dy < C and 0 <= x + dx < C and I8[y + dy, x + dx] and (x + dx, y + dy) not in cs for x, y in comp for dx in (-1, 0, 1) for dy in (-1, 0, 1))
                border_t = any(0 <= y + dy < C and 0 <= x + dx < C and not opk[y + dy, x + dx] for x, y in comp for dx, dy in q.N4)
                tip = touch8 and border_t
                leg8.append({'cell': '%s f%d' % (D, k + 1), 'size': len(comp), 'x': comp[0][0], 'y': comp[0][1], 'cape_tip': tip, 'leg_zone': comp[0][1] >= 70 and not tip})
    R['id8_small_pieces'] = leg8
    H['09 mask: small ID 8 pieces on legs (row >= 70) = 0'] = sum(1 for p in leg8 if p['leg_zone']) == 0
    # leak test on the whole sheet (640 combos x 48 frame images)
    L = q.leak_test(A, ID, G)
    L['frame_images'] = L['combos'] * 8 * nf
    R['leak'] = {k: v for k, v in L.items() if k not in ('PASS', 'cells')}
    H['10 leak test 640 x 48 = 30,720 images · leaks 0'] = (L['combos'] == 640 and L['fixed_changed_px'] == 0 and L['alpha_changed_px'] == 0 and L['wrong_ramp_px'] == 0
                                                          and L['eye_lines_changed_px'] == 0 and L['cross_material_px'] == 0 and L['missing_change_px'] == 0
                                                          and L['copper_changed_by_house_px'] == 0 and L['house_distinct'] == 4)
    # signal colours (fixed materials) + F9DA99 conditions per frame image
    fails = []
    for kk in q.FIXED:
        m = opm & (ID == kk)
        for c in {tuple(int(v) for v in x) for x in A[m, :3]}:
            if min(q.de00(c, s) for s in q.SIG) < q.SIG_MIN and q.hexc(c) != '#F9DA99': fails.append((kk, q.hexc(c)))
    R['gold_F9DA99'] = gold; R['signal_fails'] = fails
    H['11 signal colours: fixed materials OK (F9DA99 handled below)'] = not fails
    H['11 F9DA99 only ID 9 · <= 6 px per frame · no new positions'] = all(g['all_id9'] and g['px'] <= 6 and g['new_positions'] == 0 for g in gold)
    H['13 PNG <= 160 KB'] = os.path.getsize(sprp) <= MAX_PNG and os.path.getsize(mskp) <= MAX_PNG
    R['hard'] = H; R['PASS'] = all(H.values())
    R['nonplum_outer_edge_px'] = len(nonplum_edge)
    if img: images(S, A, ID, G, nonplum_edge, od)
    json.dump(R, open(os.path.join(od, outname), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)
    return R

def check_walkhold(srcp, sprp, mskp, chgp, holp, strp, lwp, lwmp, od):
    """ASSET_SPEC_12 part D (spec 1.4 section 14): 36 cleaned frames (SE E NE NW W SW) + rows S N copied from the locked walk"""
    # spec 1.4.2: NW f1 rows 4-43 = NW f2 rows 4-43 of the source (same coordinates) before cleanup -> adjusted source for the structural checks
    S0 = q.load(srcp); Sa = S0.copy(); r = L8.index('NW')
    Sa[r * C + 4:r * C + 44, 0:C] = S0[r * C + 4:r * C + 44, C:2 * C]
    os.makedirs(od, exist_ok=True); adj = os.path.join(od, 'walkhold-src-adjusted.png'); Image.fromarray(Sa, 'RGBA').save(adj)
    R = check_walk(adj, sprp, mskp, chgp, holp, strp, od, anim='walk_hold', skip=('S', 'N'), fill_big=('NE f2', 'NW f5'), keep_big=('SE f3',), outname='qa-asset12-D.json', img=False,
                   allow_px={('W', 1, 41, 73), ('W', 5, 38, 75)}, log_srcp=srcp, allow_box={('NW', 1): (0, 42, 95, 46, 10)})
    tasks = R['log']['tasks']; R['head_copy_px'] = int((Sa != S0).any(-1).sum())
    R['hard']['14 NW f1 head copy done (checks 05/06 run against the adjusted source) and logged as task head_copy'] = tasks.get('head_copy', 0) > 0
    Aq = q.load(sprp)
    R['signal_fix_W'] = {'W f1 (41,73)': q.hexc(Aq[6 * C + 73, 0 * C + 41]), 'W f5 (38,75)': q.hexc(Aq[6 * C + 75, 4 * C + 38])}
    R['hard']['14 W f1/f5 hem pixels no longer #F9DA99'] = all(v != '#F9DA99' for v in R['signal_fix_W'].values())
    A = q.load(sprp); M = q.load(mskp); LW = q.load(lwp); LM = q.load(lwmp)
    same = {}
    for D in ('S', 'N'):
        i = L8.index(D); r = slice(i * C, (i + 1) * C)
        vis = LW[r][..., 3] > 0   # visible pixels only: the locked PNG keeps colour under alpha 0 and a PNG writer may zero it
        same[D] = {'alpha_px_diff': int((A[r][..., 3] != LW[r][..., 3]).sum()) + int((M[r][..., 3] != LM[r][..., 3]).sum()),
                   'sprite_px_diff': int(((A[r][..., :3] != LW[r][..., :3]).any(-1) & vis).sum()), 'mask_px_diff': int(((M[r][..., :3] != LM[r][..., :3]).any(-1) & vis).sum())}
    R['rows_S_N_vs_locked_walk'] = same
    R['hard']['14 rows S N = locked walk sprite + mask (alpha everywhere, colour on visible pixels)'] = all(v['alpha_px_diff'] == 0 and v['sprite_px_diff'] == 0 and v['mask_px_diff'] == 0 for v in same.values())
    R['hard']['14 big holes NE f2 / NW f5 filled · SE f3 kept'] = R['hard'].pop('03 SE f3 6 px natural gap kept') and R['hard']['03 holes <= 3 px left = 0']
    R['PASS'] = all(R['hard'].values())
    json.dump(R, open(os.path.join(od, 'qa-asset12-D.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)
    return R

# ---------------------------------------------------------------- part C + A (idle 8 dirs x 4 frames + blink f4)
FACEB = ['S', 'SE', 'E', 'W', 'SW']; EYES = {'S': 2, 'SE': 2, 'SW': 2, 'E': 1, 'W': 1}

def body_metrics(c):
    op = c[..., 3] > 0; ys, xs = np.nonzero(op); y, x = np.nonzero(op[52:87]); hy, hx_ = np.nonzero(op[:51])
    bx = np.nonzero(op[52:87].any(0))[0]
    return {'body_cx': float(x.mean()), 'head_cx': float(hx_.mean()), 'top': int(ys.min()), 'bottom': int(ys.max()), 'width': int(bx.max() - bx.min() + 1)}

def comps8(mask):
    seen = np.zeros_like(mask); out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        st = [(y0, x0)]; seen[y0, x0] = True; n = 0
        while st:
            y, x = st.pop(); n += 1
            for dx, dy in q.N8:
                yy, xx = y + dy, x + dx
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; st.append((yy, xx))
        out.append(n)
    return out

def check_idle(srcp, sprp, mskp, chgp, holp, strp, a2p, m31p, walkp, walkmp, od):
    os.makedirs(od, exist_ok=True); nf = 4
    S = q.load(srcp); A = q.load(sprp); M = q.load(mskp); CH = json.load(open(chgp, encoding='utf-8'))['changes']
    HO = json.load(open(holp, encoding='utf-8')); ST = json.load(open(strp, encoding='utf-8'))
    A2 = q.load(a2p); M31 = q.load(m31p); WK = q.load(walkp); WM = q.load(walkmp)
    ID = M[..., 0].astype(int); G = M[..., 1].astype(int)
    R = {'files': {os.path.basename(p): os.path.getsize(p) for p in (sprp, mskp, chgp)}}; H = {}
    H['01 sprite 384x768'] = A.shape[:2] == (768, 384); H['01 mask 384x768'] = M.shape[:2] == (768, 384)
    H['01 alpha binary (semi 0)'] = int(((A[..., 3] > 0) & (A[..., 3] < 255)).sum()) == 0
    H['01 mask alpha = sprite alpha'] = bool((M[..., 3] == A[..., 3]).all())
    H['01 mask B channel = 0'] = int(M[..., 2][M[..., 3] > 0].max(initial=0)) == 0
    exp_fill = set()
    for key, groups in HO['holes'].items():
        D, f = key.split(' f'); i = L8.index(D); k = int(f) - 1
        for g in groups: exp_fill |= {(i * C + y, k * C + x) for x, y in g['pts']}
    achg = {(int(y), int(x)) for y, x in zip(*np.nonzero(S[..., 3] != A[..., 3]))}
    R['alpha_changed'] = len(achg); R['alpha_expected'] = len(exp_fill)
    H['02 alpha changes = listed hole fills exactly'] = achg == exp_fill and all(A[y, x, 3] == 255 and S[y, x, 3] == 0 for y, x in achg)
    # eye boxes per face direction: ID 2/5 in f1-f3 + ID 2 in f4, bbox, used with +2 px (spec section 5)
    ebox = {}
    for D in FACEB:
        i = L8.index(D); m = np.zeros((C, C), bool)
        for k in range(nf):
            Ik = ID[i * C:(i + 1) * C, k * C:(k + 1) * C]; m |= np.isin(Ik, [2, 5]) if k < 3 else (Ik == 2)
        m[51:] = False   # eyes live in the head (rows <= 50)
        ys, xs = np.nonzero(m); ebox[D] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None
    R['eye_box'] = ebox
    per = {}; plum_bad = plum_miss = other_out = head_chg = newcol = small_left = 0; gold = []; nonplum_edge = []; blink = {}; idfix = 0
    for i, D, k, sl in cells(A, nf):
        s = S[sl]; a = A[sl]; op = a[..., 3] > 0; key = '%s f%d' % (D, k + 1); Ik = ID[sl]
        out = outer_mask(op); edge = np.zeros_like(op)
        for dx, dy in q.N4:
            sh = np.zeros_like(out); ys = slice(max(0, dy), C + min(0, dy)); yd = slice(max(0, -dy), C + min(0, -dy))
            xs = slice(max(0, dx), C + min(0, dx)); xd = slice(max(0, -dx), C + min(0, -dx)); sh[yd, xd] = out[ys, xs]; edge |= op & sh
        pre = np.where((s[..., 3] > 0)[..., None], s, a)
        dark = (pre[..., :3].max(-1).astype(int) + pre[..., :3].min(-1).astype(int)) <= 76
        expect = edge & dark; plum = op & (a[..., :3] == PLUM).all(-1)
        plum_bad += int((plum & ~expect).sum()); plum_miss += int((expect & ~plum).sum())
        ys, xs = np.nonzero(edge & ~dark); nonplum_edge += [(i, k, int(x), int(y)) for x, y in zip(xs, ys)]
        holefill = np.zeros_like(op)
        for (yy, xx) in exp_fill:
            if sl[0].start <= yy < sl[0].stop and sl[1].start <= xx < sl[1].stop: holefill[yy - sl[0].start, xx - sl[1].start] = True
        chg = (s != a).any(-1) & ~plum & ~holefill
        eb = np.zeros_like(op)
        if k == 3 and D in FACEB and ebox[D]:
            x0, y0, x1, y1 = ebox[D]; eb[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = True
        bl = chg & eb; oth = chg & ~eb
        box = ST['frames'].get(key, {}).get('box_x0y0x1y1'); inbox = np.zeros_like(op)
        if box: x0, y0, x1, y1 = box; inbox[max(0, y0 - 1):y1 + 2, max(0, x0 - 1):x1 + 2] = True
        o = int((oth & ~inbox).sum()); other_out += o; head_chg += int(oth[:51].sum())
        idfix += int((chg & np.isin(Ik, [4, 10])).sum())
        if k == 3 and D in FACEB:
            blink[D] = {'changed_px': int(bl.sum()), 'changed_not_id2_or_3': int((bl & ~np.isin(Ik, [2, 3])).sum()), 'id5_px': int((Ik == 5).sum()),
                        'id2_parts_in_eye_box': len([n for n in comps8((Ik == 2) & eb) if n >= 2]), 'eyes_expected': EYES[D]}
        sc = {tuple(c) for c in s[s[..., 3] > 0][:, :3]}; ac = {tuple(c) for c in a[op][:, :3]} - {tuple(PLUM)}
        nc = len(ac - sc); newcol += nc
        small = [h for h in enclosed(op) if len(h) <= 3]; small_left += len(small)
        g = op & (a[..., :3] == GOLD).all(-1); gs = (s[..., :3] == GOLD).all(-1) & (s[..., 3] > 0)
        gold.append({'cell': key, 'px': int(g.sum()), 'all_id9': bool((Ik[g] == 9).all()), 'new_positions': int((g & ~gs).sum())})
        per[key] = {'strap_edits': int(oth.sum()), 'outside_strap_box': o, 'blink_edits': int(bl.sum()), 'plum_px': int(plum.sum()),
                    'plum_expected': int(expect.sum()), 'new_colours': nc, 'holes_le3_left': len(small)}
    R['per_cell'] = per; R['blink'] = blink
    H['03 holes <= 3 px left = 0'] = small_left == 0
    H['04 plum = A2 formula exactly (missing 0 · extra 0)'] = plum_bad == 0 and plum_miss == 0
    R['plum_missing'] = plum_miss; R['plum_extra'] = plum_bad; R['plum_total'] = int(sum(v['plum_px'] for v in per.values()))
    H['05 strap edits only inside strap boxes (+1 px)'] = other_out == 0
    H['05 strap edits <= 30 px per frame'] = all(v['strap_edits'] <= 30 for v in per.values())
    H['05 no strap edits in E NE N NW W'] = all(v['strap_edits'] == 0 for kk, v in per.items() if kk.split()[0] in ('E', 'NE', 'N', 'NW', 'W'))
    H['06 head rows <= 50 unchanged outside the blink eye box'] = head_chg == 0
    H['06 ID 4 / 10 pixels changed = 0'] = idfix == 0
    H['07 new colours 0 (except plum)'] = newcol == 0
    H['07 blink only in f4 of S SE E W SW'] = all(v['blink_edits'] == 0 for kk, v in per.items() if not (kk.endswith('f4') and kk.split()[0] in FACEB))
    H['11 blink: changed px are ID 2 / 3 only'] = all(v['changed_not_id2_or_3'] == 0 for v in blink.values())
    H['11 blink: ID 5 = 0 in f4'] = all(v['id5_px'] == 0 for v in blink.values())
    H['11 blink: lid lines >= visible eyes'] = all(v['id2_parts_in_eye_box'] >= v['eyes_expected'] for v in blink.values())
    H['11 blink: every face direction edited'] = all(v['changed_px'] > 0 for v in blink.values()) and len(blink) == 5
    # W = locked fallback (spec 4.5)
    w = L8.index('W'); ws = slice(w * C, (w + 1) * C); a2w = A2[ws]; m31w = M31[ws]; ew = ebox['W']
    ebw = np.zeros((C, C), bool)
    if ew: ebw[max(0, ew[1] - 2):ew[3] + 3, max(0, ew[0] - 2):ew[2] + 3] = True
    H['4.5 W f1-f3 sprite = locked A2 W cell'] = all(bool((A[ws, k * C:(k + 1) * C] == a2w).all()) for k in range(3))
    H['4.5 W f1-f3 mask = locked A3.1 W cell'] = all(bool((M[ws, k * C:(k + 1) * C] == m31w).all()) for k in range(3))
    H['4.5 W f4 = A2 / A3.1 outside the eye box'] = bool(((A[ws, 3 * C:] == a2w).all(-1) | ebw).all() and ((M[ws, 3 * C:] == m31w).all(-1) | ebw).all())
    # change log
    log = {}; bad_log = 0; tasks = Counter()
    for e in CH:
        if e.get('anim') != 'idle': continue
        i = L8.index(e['dir']); k = e['frame'] - 1; y = i * C + e['y']; x = k * C + e['x']
        log[(y, x)] = e; tasks[e['task']] += 1
        if hx(S[y, x]) != e['before'].upper() or hx(A[y, x]) != e['after'].upper(): bad_log += 1
    diff = {(int(y), int(x)) for y, x in zip(*np.nonzero((S != A).any(-1)))}
    back = A.copy()
    for (y, x), e in log.items():
        h = e['before'].lstrip('#'); back[y, x] = [int(h[j:j + 2], 16) for j in (0, 2, 4, 6)]
    R['log'] = {'entries': len(log), 'diff_px': len(diff), 'tasks': dict(tasks), 'wrong_before_after': bad_log, 'non_idle_entries': sum(1 for e in CH if e.get('anim') != 'idle')}
    H['08 change log covers every changed pixel exactly'] = set(log) == diff and bad_log == 0
    H['08 rollback = source RGBA 100%'] = bool((back == S).all())
    # mask
    opm = A[..., 3] > 0
    H['09 mask: opaque -> ID 1-11 · transparent -> ID 0'] = bool(((ID >= 1) & (ID <= 11))[opm].all() and (ID[~opm] == 0).all())
    gmax = {k: v[2] for k, v in q.IDS.items()}
    H['09 mask: G within range of its ID'] = all(int(G[ID == k].max(initial=0)) <= gm for k, gm in gmax.items())
    H['09 mask: ID 1 = plum pixels exactly'] = bool(((ID == 1) == (opm & (A[..., :3] == PLUM).all(-1))).all())
    backrows = np.zeros(ID.shape, bool)
    for D in BACK: i = L8.index(D); backrows[i * C:(i + 1) * C] = True
    H['09 mask: back dirs have no ID 2/5/10'] = int((backrows & np.isin(ID, [2, 5, 10])).sum()) == 0
    grp_bad = 0; ngrp = 0; n11 = 0; shade_bad = []
    for k in range(nf):
        Ak = np.ascontiguousarray(A[:, k * C:(k + 1) * C]); Ik = np.ascontiguousarray(ID[:, k * C:(k + 1) * C]); Gk = np.ascontiguousarray(G[:, k * C:(k + 1) * C])
        gr = q.id11_groups(Ik, C); ngrp += len(gr); grp_bad += sum(1 for g in gr if not g['ok']); n11 += int((Ik == 11).sum())
        so = q.shade_order(Ak, Ik, Gk); shade_bad += ['f%d %s %.3f' % (k + 1, kk, v['rate']) for kk, v in so.items() if not v['ok']]
    R['id11'] = {'px': n11, 'groups': ngrp, 'groups_failing': grp_bad}; R['shade_failing'] = shade_bad
    H['09 mask: ID 11 groups all touch >= 2 materials'] = grp_bad == 0
    H['09 mask: shade order (<= 2% inverted, no flat)'] = not shade_bad
    leg8 = []
    for i, D, k, sl in cells(A, nf):
        I8 = ID[sl] == 8; opk = A[sl][..., 3] > 0
        for comp in components(I8):
            if len(comp) <= 3:
                cs = set(comp)
                touch8 = any(0 <= y + dy < C and 0 <= x + dx < C and I8[y + dy, x + dx] and (x + dx, y + dy) not in cs for x, y in comp for dx in (-1, 0, 1) for dy in (-1, 0, 1))
                border_t = any(0 <= y + dy < C and 0 <= x + dx < C and not opk[y + dy, x + dx] for x, y in comp for dx, dy in q.N4)
                tip = touch8 and border_t
                leg8.append({'cell': '%s f%d' % (D, k + 1), 'size': len(comp), 'x': comp[0][0], 'y': comp[0][1], 'cape_tip': tip, 'leg_zone': comp[0][1] >= 70 and not tip})
    R['id8_small_pieces'] = leg8
    H['09 mask: small ID 8 pieces on legs (row >= 70) = 0'] = sum(1 for p in leg8 if p['leg_zone']) == 0
    # leak: idle 640 x 32 here + walk (locked B files) 640 x 48 = 51,200
    Li = q.leak_test(A, ID, G); Lw = q.leak_test(WK, WM[..., 0].astype(int), WM[..., 1].astype(int))
    def ok(L): return (L['combos'] == 640 and L['fixed_changed_px'] == 0 and L['alpha_changed_px'] == 0 and L['wrong_ramp_px'] == 0 and L['eye_lines_changed_px'] == 0
                       and L['cross_material_px'] == 0 and L['missing_change_px'] == 0 and L['copper_changed_by_house_px'] == 0 and L['house_distinct'] == 4)
    R['leak'] = {'idle': {k: v for k, v in Li.items() if k not in ('PASS', 'cells')}, 'walk': {k: v for k, v in Lw.items() if k not in ('PASS', 'cells')},
                 'frame_images': Li['combos'] * 8 * nf + Lw['combos'] * 8 * 6}
    H['10 leak test idle 640 x 32 + walk 640 x 48 = 51,200 images · leaks 0'] = ok(Li) and ok(Lw) and R['leak']['frame_images'] == 51200
    fails = []
    for kk in q.FIXED:
        m = opm & (ID == kk)
        for c in {tuple(int(v) for v in x) for x in A[m, :3]}:
            if min(q.de00(c, s) for s in q.SIG) < q.SIG_MIN and q.hexc(c) != '#F9DA99': fails.append((kk, q.hexc(c)))
    R['gold_F9DA99'] = gold; R['signal_fails'] = fails
    H['11 signal colours: fixed materials OK (F9DA99 handled below)'] = not fails
    H['11 F9DA99 only ID 9 · <= 6 px per frame · no new positions'] = all(g['all_id9'] and g['px'] <= 6 and g['new_positions'] == 0 for g in gold)
    # seam f2 -> f4 and idle / walk consistency (section 5, 11.1)
    seam = {}; cons = {}; mir = 0
    for i, D in enumerate(L8):
        f = [body_metrics(A[i * C:(i + 1) * C, k * C:(k + 1) * C]) for k in range(nf)]
        d24 = (A[i * C:(i + 1) * C, C:2 * C] != A[i * C:(i + 1) * C, 3 * C:]).any(-1)
        if D in FACEB and ebox[D]:
            x0, y0, x1, y1 = ebox[D]; d24[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = False
        seam[D] = {'body_dx': round(abs(f[3]['body_cx'] - f[1]['body_cx']), 2), 'top_d': abs(f[3]['top'] - f[1]['top']), 'bottom_d': abs(f[3]['bottom'] - f[1]['bottom']),
                   'px_diff_outside_eye_box': int(d24.sum())}
        wf = [body_metrics(WK[i * C:(i + 1) * C, k * C:(k + 1) * C]) for k in range(6)]; st = body_metrics(A2[i * C:(i + 1) * C])
        cons[D] = {'head_f1_vs_walk_f1': round(f[0]['head_cx'] - wf[0]['head_cx'], 2), 'head_mean_vs_walk_mean': round(np.mean([x['head_cx'] for x in f]) - np.mean([x['head_cx'] for x in wf]), 2),
                   'height_d': abs((f[0]['bottom'] - f[0]['top']) - (wf[0]['bottom'] - wf[0]['top'])), 'cape_width_vs_static': [x['width'] - st['width'] for x in f],
                   'width_changed_from_source': sum(1 for k in range(nf) if f[k]['width'] != body_metrics(S[i * C:(i + 1) * C, k * C:(k + 1) * C])['width'])}
    for Dm, Do in (('W', 'E'), ('SW', 'SE')):
        a = L8.index(Dm); b = L8.index(Do)
        for k in range(nf):
            for j in range(nf):
                if (A[a * C:(a + 1) * C, k * C:(k + 1) * C] == A[b * C:(b + 1) * C, j * C:(j + 1) * C][:, ::-1]).all(): mir += 1
    R['seam_f2_f4'] = seam; R['idle_vs_walk'] = cons; R['mirrored_pairs'] = mir
    H['11 seam f2->f4: body <= 1 · top <= 1 · bottom equal'] = all(v['body_dx'] <= 1 and v['top_d'] <= 1 and v['bottom_d'] == 0 for v in seam.values())
    H['11.1 height idle vs walk <= 2 px'] = all(v['height_d'] <= 2 for v in cons.values())
    # spec 11.1 cape width +-4 vs static is a property of the PixelLab source (Codex may not reshape): reported, and listed in spec section 7 when outside +-4
    R['cape_width_outside_4px_source'] = {D: v['cape_width_vs_static'] for D, v in cons.items() if any(abs(x) > 4 for x in v['cape_width_vs_static'])}
    H['11.1 silhouette width = source in every frame (no reshaping)'] = all(v['width_changed_from_source'] == 0 for v in cons.values())
    H['11.1 W / SW not mirrors of E / SE (0 pairs)'] = mir == 0
    # spec 11.1 "fixed material colour sets (ID 6 / 7 / 9) are the same set" · literal check (v3, 16 Oct):
    # every (colour, ID) pair the idle uses for ID 6 / 7 / 9 must already exist in the locked walk or the locked A3.1 static.
    # (v1 "majority ID per colour" was a wrong proxy: _4 uses one colour for two materials by position, e.g. #CA666B = skin at the ear, leather at the hip.)
    ref = set()
    for X, MM in ((WK, WM), (A2, M31)):
        o = X[..., 3] > 0; ref |= {(q.hexc(c), int(k)) for c, k in zip(X[o, :3], MM[o, 0])}
    newpairs = []
    for y, x in zip(*np.nonzero(opm & np.isin(ID, [6, 7, 9]))):
        pr = (q.hexc(A[y, x, :3]), int(ID[y, x]))
        if pr not in ref: newpairs.append({'cell': '%s f%d' % (L8[y // C], x // C + 1), 'x': int(x % C), 'y': int(y % C), 'colour': pr[0], 'id': pr[1]})
    R['material_new_pairs_6_7_9'] = newpairs
    H['11.1 ID 6 / 7 / 9 colour+ID pairs all seen in locked walk or A3.1 static'] = not newpairs
    H['13 PNG <= 160 KB'] = os.path.getsize(sprp) <= MAX_PNG and os.path.getsize(mskp) <= MAX_PNG
    R['hard'] = H; R['PASS'] = all(H.values()); R['nonplum_outer_edge_px'] = len(nonplum_edge)
    images_idle(S, A, ID, G, nonplum_edge, ebox, od)
    json.dump(R, open(os.path.join(od, 'qa-asset12-CA.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)
    return R

def images_idle(S, A, ID, G, nonplum_edge, ebox, od):
    nf = 4; dflt = q.render(A, ID, G, q.DEFAULT)
    grid(dflt, 2, LIGHT, 'ASSET 12 C+A · idle after cleanup · default colours · light · f4 of S SE E W SW = blink', nf).convert('RGB').save(os.path.join(od, 'ca-idle-default-light.png'), optimize=True)
    grid(dflt, 2, DARK, 'ASSET 12 C+A · idle · default colours · dark', nf).convert('RGB').save(os.path.join(od, 'ca-idle-default-dark.png'), optimize=True)
    cm = A.copy(); g = cm[..., :3].mean(-1).astype(np.uint8); cm[..., 0] = cm[..., 1] = cm[..., 2] = g
    plum = (A[..., :3] == PLUM).all(-1) & (A[..., 3] > 0); hole = (S[..., 3] == 0) & (A[..., 3] > 0); other = (S != A).any(-1) & ~plum & ~hole
    eyes = np.zeros(other.shape, bool)
    for D, b in ebox.items():
        if b: i = L8.index(D); eyes[i * C + max(0, b[1] - 2):i * C + b[3] + 3, 3 * C + max(0, b[0] - 2):3 * C + b[2] + 3] = True
    cm[plum] = (190, 120, 200, 255); cm[hole] = (0, 230, 255, 255); cm[other & ~eyes] = (255, 40, 60, 255); cm[other & eyes] = (40, 200, 60, 255)
    grid(cm, 3, LIGHT, 'changes · red = strap · green = blink · cyan = hole fills · lilac = plum outline', nf).convert('RGB').save(os.path.join(od, 'ca-idle-changes.png'), optimize=True)
    ov = np.zeros_like(A)
    for k, c in q.OVC.items(): ov[ID == k] = tuple(c) + (255,)
    grid(ov, 3, LIGHT, 'mask overlay (colour per material ID, same key as A3)', nf).convert('RGB').save(os.path.join(od, 'ca-idle-mask-overlay.png'), optimize=True)
    ne = A.copy(); ne[..., :3] = (ne[..., :3] * 0.35 + 160).clip(0, 255).astype(np.uint8)
    for i, k, x, y in nonplum_edge: ne[i * C + y, k * C + x] = (255, 120, 0, 255)
    grid(ne, 3, LIGHT, 'outer edge pixels kept in their own (light) colour by the A2 rule = orange', nf).convert('RGB').save(os.path.join(od, 'ca-idle-nonplum-edge.png'), optimize=True)
    # blink close-up: f2 vs f4 heads, x6
    s = 6; im = Image.new('RGBA', (40 + 2 * (60 * s + 10), 20 + 5 * (40 * s + 10)), LIGHT + (255,)); d = ImageDraw.Draw(im)
    d.text((6, 4), 'blink close-up · left f2 (eyes open) · right f4 (blink) · rows 8-47 x 18-77', fill=(20, 20, 30))
    for r, D in enumerate(FACEB):
        i = L8.index(D); d.text((6, 24 + r * (40 * s + 10)), D, fill=(20, 20, 30))
        for c, k in enumerate((1, 3)): im.alpha_composite(up(dflt[i * C + 8:i * C + 48, k * C + 18:k * C + 78], s), (40 + c * (60 * s + 10), 20 + r * (40 * s + 10)))
    im.convert('RGB').save(os.path.join(od, 'ca-blink-closeup.png'), optimize=True)
    # phone GIF: 4 houses x 8 dirs · 200 ms · f1 f2 f3 f2 x2 then f1 f2 f3 f4 (blink in the f2-return slot) · ground shadow
    dw = round(PHONE[0] * DPR); seq = [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3]
    houses = [q.render(A, ID, G, dict(q.DEFAULT, house=b)) for b in range(4)]
    for zoom, zn in ((1.0, '100'), (0.75, '75')):
        sc = round(round(PHONE[1] * DPR) / 384) * zoom; rh = int(C * sc) + 12; frames = []
        for f in seq:
            im = Image.new('RGBA', (dw, 4 * rh + 30), GRASS + (255,)); d = ImageDraw.Draw(im)
            d.text((8, 6), 'ASSET 12 C+A idle · phone 844x390 @DPR 2.625 · zoom %s%% · 200 ms · f1 f2 f3 f2 (x2) then f1 f2 f3 f4=blink · rows = Sun Wing Leaf Flame · W = locked still (code breathing in game)' % zn, fill=(20, 20, 30))
            step = dw / 8.4
            for b in range(4):
                for i, D in enumerate(L8):
                    a = houses[b][i * C:(i + 1) * C, f * C:(f + 1) * C]; sp = up(a, sc); x = int(step * (i + 0.7) - sp.width / 2); y = 26 + b * rh
                    sh = Image.new('RGBA', sp.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((sp.width * 0.33, 92 * sc, sp.width * 0.67, 97 * sc), fill=(40, 50, 40, 90))
                    im.alpha_composite(sh, (x, y)); im.alpha_composite(sp, (x, y))
            frames.append(im.convert('RGB').quantize(colors=255, method=Image.MEDIANCUT))
        frames[0].save(os.path.join(od, 'ca-idle-phone-zoom%s-4houses.gif' % zn), save_all=True, append_images=frames[1:], duration=200, loop=0)

# ---------------------------------------------------------------- pictures
def up(a, s): a = np.ascontiguousarray(a); return Image.fromarray(a, 'RGBA').resize((int(round(a.shape[1] * s)), int(round(a.shape[0] * s))), Image.NEAREST)
def grid(arr, s, bg, title, nf=6):
    lw = 40; im = Image.new('RGBA', (lw + nf * (C * s + 6), 22 + 8 * (C * s + 6)), bg + (255,)); d = ImageDraw.Draw(im)
    d.text((6, 4), title, fill=(235, 235, 245) if sum(bg) < 300 else (20, 20, 30))
    for i, D in enumerate(L8):
        d.text((6, 26 + i * (C * s + 6)), D, fill=(235, 235, 245) if sum(bg) < 300 else (20, 20, 30))
        for k in range(nf): im.alpha_composite(up(arr[i * C:(i + 1) * C, k * C:(k + 1) * C], s), (lw + k * (C * s + 6), 22 + i * (C * s + 6)))
    return im

def images(S, A, ID, G, nonplum_edge, od):
    dflt = q.render(A, ID, G, q.DEFAULT)
    grid(dflt, 2, LIGHT, 'ASSET 12 B · walk after cleanup · default colours (Brown / Green / Medium / Wing) · light').convert('RGB').save(os.path.join(od, 'b-walk-default-light.png'), optimize=True)
    grid(dflt, 2, DARK, 'ASSET 12 B · walk after cleanup · default colours · dark').convert('RGB').save(os.path.join(od, 'b-walk-default-dark.png'), optimize=True)
    # changes map: red = strap/other colour edits, cyan = hole fills, faint plum = outline
    cm = np.zeros_like(A); grey = A.copy(); g = grey[..., :3].mean(-1).astype(np.uint8); grey[..., 0] = grey[..., 1] = grey[..., 2] = g; cm[:] = grey; cm[..., 3] = np.where(A[..., 3] > 0, 255, 0)
    plum = (A[..., :3] == PLUM).all(-1) & (A[..., 3] > 0); hole = (S[..., 3] == 0) & (A[..., 3] > 0); other = (S != A).any(-1) & ~plum & ~hole
    cm[plum] = (190, 120, 200, 255); cm[hole] = (0, 230, 255, 255); cm[other] = (255, 40, 60, 255)
    grid(cm, 3, LIGHT, 'changes · red = strap edits · cyan = hole fills · lilac = plum outline').convert('RGB').save(os.path.join(od, 'b-walk-changes.png'), optimize=True)
    ov = np.zeros_like(A)
    for k, c in q.OVC.items(): ov[ID == k] = tuple(c) + (255,)
    grid(ov, 3, LIGHT, 'mask overlay (colour per material ID, same key as A3)').convert('RGB').save(os.path.join(od, 'b-walk-mask-overlay.png'), optimize=True)
    ne = A.copy(); ne[..., :3] = (ne[..., :3] * 0.35 + 160).clip(0, 255).astype(np.uint8)
    for i, k, x, y in nonplum_edge: ne[i * C + y, k * C + x] = (255, 120, 0, 255)
    grid(ne, 3, LIGHT, 'outer edge pixels kept in their own (light) colour by the A2 rule = orange').convert('RGB').save(os.path.join(od, 'b-walk-nonplum-edge.png'), optimize=True)
    # phone GIFs: 4 houses x 8 directions, game timing 100 ms, with a soft ground shadow under the feet (spec section 7)
    dw = round(PHONE[0] * DPR)
    for zoom, zn in ((1.0, '100'), (0.75, '75')):
        sc = round(round(PHONE[1] * DPR) / 384) * zoom; rh = int(C * sc) + 12; frames = []
        houses = [q.render(A, ID, G, dict(q.DEFAULT, house=b)) for b in range(4)]
        for f in range(6):
            im = Image.new('RGBA', (dw, 4 * rh + 30), GRASS + (255,)); d = ImageDraw.Draw(im)
            d.text((8, 6), 'ASSET 12 B walk · phone 844x390 @DPR 2.625 · %.2f device px per art px (zoom %s%%) · 100 ms · rows = Sun Wing Leaf Flame · soft ground shadow at feet row 94' % (sc, zn), fill=(20, 20, 30))
            step = dw / 8.4
            for b in range(4):
                for i, D in enumerate(L8):
                    a = houses[b][i * C:(i + 1) * C, f * C:(f + 1) * C]; s = up(a, sc)
                    x = int(step * (i + 0.7) - s.width / 2); y = 26 + b * rh
                    sh = Image.new('RGBA', s.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((s.width * 0.33, 92 * sc, s.width * 0.67, 97 * sc), fill=(40, 50, 40, 90))
                    im.alpha_composite(sh, (x, y)); im.alpha_composite(s, (x, y))
            frames.append(im.convert('RGB').quantize(colors=255, method=Image.MEDIANCUT))
        frames[0].save(os.path.join(od, 'b-walk-phone-zoom%s-4houses.gif' % zn), save_all=True, append_images=frames[1:], duration=100, loop=0)

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'walk' and len(a) == 8:
        R = check_walk(*a[1:])
        for k, v in R['hard'].items(): print(('PASS ' if v else 'FAIL ') + k)
        print('log', R['log'], '· plum', R['plum_total'], 'missing', R['plum_missing'], 'extra', R['plum_extra'], '· id11', R['id11'])
        print('leak', R['leak']); print('gold', [(g['cell'], g['px']) for g in R['gold_F9DA99'] if g['px']]); print('signal fails', R['signal_fails'])
        print('small ID8 pieces', R['id8_small_pieces']); print('shade failing', R['shade_failing'][:10]); print('non-plum outer edge px', R['nonplum_outer_edge_px'])
        print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); sys.exit(0 if R['PASS'] else 1)
    if a and a[0] == 'walkhold' and len(a) == 10:
        R = check_walkhold(*a[1:])
        for k, v in R['hard'].items(): print(('PASS ' if v else 'FAIL ') + k)
        print('rows S N vs locked walk', R['rows_S_N_vs_locked_walk']); print('log', R['log'], '· plum', R['plum_total'], 'missing', R['plum_missing'], 'extra', R['plum_extra'])
        print('leak', R['leak']); print('gold', [(g['cell'], g['px']) for g in R['gold_F9DA99'] if g['px']]); print('signal fails', R['signal_fails'])
        print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); sys.exit(0 if R['PASS'] else 1)
    if a and a[0] == 'idle' and len(a) == 12:
        R = check_idle(*a[1:])
        for k, v in R['hard'].items(): print(('PASS ' if v else 'FAIL ') + k)
        print('log', R['log'], '· plum', R['plum_total'], 'missing', R['plum_missing'], 'extra', R['plum_extra'], '· id11', R['id11'])
        print('leak idle', R['leak']['idle']); print('leak walk', R['leak']['walk']); print('images', R['leak']['frame_images'])
        print('gold', [(g['cell'], g['px']) for g in R['gold_F9DA99'] if g['px']]); print('signal fails', R['signal_fails'])
        print('blink', R['blink']); print('seam', R['seam_f2_f4']); print('idle vs walk', R['idle_vs_walk']); print('mirrored', R['mirrored_pairs'])
        print('cape width vs static (source property, spec 7)', R['cape_width_outside_4px_source']); print('material new pairs', R['material_new_pairs_6_7_9']); print('small ID8 pieces', [p for p in R['id8_small_pieces'] if p['leg_zone'] or p['cape_tip']])
        print('shade failing', R['shade_failing'][:10]); print('non-plum outer edge px', R['nonplum_outer_edge_px'])
        print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); sys.exit(0 if R['PASS'] else 1)
    print('usage: walk SRC SPRITE MASK CHANGES HOLES STRAP OUT\n       walkhold SRC SPRITE MASK CHANGES HOLES STRAP LOCKED_WALK LOCKED_WALK_MASK OUT\n       idle SRC SPRITE MASK CHANGES HOLES STRAP A2 MASK31 WALK WALKMASK OUT'); sys.exit(2)
