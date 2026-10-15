#!/usr/bin/env python3
# ASSET_SPEC_12 independent QA (Claude) · part B = walk cleanup (48 frames) · section 8 of the spec, numbers only.
# usage: python3 -I qa_asset12.py walk SRC.png SPRITE.png MASK.png CHANGES.json HOLES.json STRAP.json OUT_DIR
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

def check_walk(srcp, sprp, mskp, chgp, holp, strp, od):
    os.makedirs(od, exist_ok=True)
    S = q.load(srcp); A = q.load(sprp); M = q.load(mskp); CH = json.load(open(chgp, encoding='utf-8'))['changes']
    HO = json.load(open(holp, encoding='utf-8')); ST = json.load(open(strp, encoding='utf-8'))
    ID = M[..., 0].astype(int); G = M[..., 1].astype(int); nf = 6
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
            if g['px'] <= 3: exp_fill |= {(i * C + y, k * C + x) for x, y in g['pts']}
            else: kept_big.append((key, g['px']))
    achg = {(int(y), int(x)) for y, x in zip(*np.nonzero(S[..., 3] != A[..., 3]))}
    R['alpha_changed'] = len(achg); R['alpha_expected'] = len(exp_fill)
    H['02 alpha changes = listed hole fills exactly'] = achg == exp_fill and all(A[y, x, 3] == 255 and S[y, x, 3] == 0 for y, x in achg)
    per = {}; plum_bad = 0; plum_miss = 0; other_out = 0; head_chg = 0; newcol = 0; small_left = 0; big_ok = 0; gold = []; nonplum_edge = []
    for i, D, k, sl in cells(A, nf):
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
        box = ST['frames'].get(key, {}).get('box_x0y0x1y1')
        inbox = np.zeros_like(op)
        if box: x0, y0, x1, y1 = box; inbox[max(0, y0 - 1):y1 + 2, max(0, x0 - 1):x1 + 2] = True
        o = int((chg & ~inbox).sum()); other_out += o
        head_chg += int(chg[:51].sum())
        sc = {tuple(c) for c in s[s[..., 3] > 0][:, :3]}; ac = {tuple(c) for c in a[op][:, :3]} - {tuple(PLUM)}
        nc = len(ac - sc); newcol += nc
        hs = enclosed(op); small = [h for h in hs if len(h) <= 3]; small_left += len(small)
        if key == 'SE f3': big_ok = int(any(len(h) == 6 for h in hs))
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
        if e.get('anim') != 'walk': continue
        i = L8.index(e['dir']); k = e['frame'] - 1; y = i * C + e['y']; x = k * C + e['x']
        log[(y, x)] = e; tasks[e['task']] += 1
        if hx(S[y, x]) != e['before'].upper() or hx(A[y, x]) != e['after'].upper(): bad_log += 1
    diff = {(int(y), int(x)) for y, x in zip(*np.nonzero((S != A).any(-1)))}
    back = A.copy()
    for (y, x), e in log.items():
        h = e['before'].lstrip('#'); back[y, x] = [int(h[j:j + 2], 16) for j in (0, 2, 4, 6)]
    R['log'] = {'entries': len(log), 'diff_px': len(diff), 'tasks': dict(tasks), 'wrong_before_after': bad_log}
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
    images(S, A, ID, G, nonplum_edge, od)
    json.dump(R, open(os.path.join(od, 'qa-asset12-B.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=int)
    return R

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
    print('usage: walk SRC SPRITE MASK CHANGES HOLES STRAP OUT'); sys.exit(2)
