#!/usr/bin/env python3
# QG-1 (close G2.1) summary for ASSET_SPEC_09 v2.9 section 23 · Claude.
# Renders only from locked files: A2 sprite (5bfda3b) + A3.1 mask (2813279) with the D-A3-1 = A defaults. Writes nothing into the sources.
# usage: python3 -I qa_g2_1_qg1.py A2.png MASK_A31.png MASK_A31.json EXPECTED_A3.json OUT_DIR
# needs qa_asset09_a3.py (e1d74b4) in the same folder
import sys, os, json
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_asset09_a3 as q

LIGHT = (232, 230, 240); DARK = (30, 27, 46); GRASS = (140, 176, 112); CAVE = (38, 34, 52)
PHONE = (844, 390); DPR = 2.625          # typical Android phone, landscape (game target size 844x390)

def enclosed_holes(c):
    """transparent 4-connected pieces inside one 96 cell that do not touch the cell border"""
    t = c[..., 3] == 0; seen = np.zeros_like(t); out = []
    for y0, x0 in zip(*np.nonzero(t)):
        if seen[y0, x0]: continue
        dq = deque([(y0, x0)]); seen[y0, x0] = True; pts = []; edge = False
        while dq:
            y, x = dq.popleft(); pts.append((x, y)); edge |= x in (0, 95) or y in (0, 95)
            for dx, dy in q.N4:
                yy, xx = y + dy, x + dx
                if 0 <= yy < 96 and 0 <= xx < 96 and t[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
        if not edge: out.append(pts)
    return out

def metrics(A, M, E):
    ID = M[..., 0]; rows = {}
    for i, l in enumerate(q.L8):
        c = A[i * 96:(i + 1) * 96]; op = c[..., 3] > 0; ys, xs = np.nonzero(op)
        feet = [x for x, y in zip(xs, ys) if y >= 88]
        hs = enclosed_holes(c)
        rows[l] = {'cell': list(c.shape[:2]), 'bottom_row': int(ys.max()), 'top_row': int(ys.min()), 'height': int(ys.max() - ys.min() + 1),
                   'feet_centre_x': round((min(feet) + max(feet)) / 2, 1), 'feet_centre_off': round(abs((min(feet) + max(feet)) / 2 - 48), 1),
                   'bbox_centre_x': round((xs.min() + xs.max()) / 2, 1), 'semi_alpha': int(((c[..., 3] > 0) & (c[..., 3] < 255)).sum()),
                   'holes_1_3px': sum(1 for h in hs if len(h) <= 3), 'holes_any': len(hs),
                   'plum': int((op & (c[..., 0] == q.PLUM[0]) & (c[..., 1] == q.PLUM[1]) & (c[..., 2] == q.PLUM[2])).sum()),
                   'opaque_without_id': int((op & (ID[i * 96:(i + 1) * 96] == 0)).sum())}
    return rows

def default_checks(A, M):
    ID, G = M[..., 0], M[..., 1]; op = A[..., 3] > 0; R = {}
    out = q.render(A, ID, G, q.DEFAULT)
    fixed = np.isin(ID, q.FIXED) & op
    R['fixed_changed_px'] = int(((out[..., :3] != A[..., :3]).any(-1) & fixed).sum())
    ok = 0; tot = 0
    for k, grp in q.RECOL.items():
        m = ID == k; want = q.ramp_arr(grp, q.DEFAULT[grp])[G[m]]; ok += int((out[m, :3] == want).all(-1).sum()); tot += int(m.sum())
    R['recolour_px_on_default_ramp'] = '%d/%d' % (ok, tot)
    def cnt(img, h): c = q.rgb(h); return int(((img[..., :3] == c).all(-1) & (img[..., 3] > 0)).sum())
    R['EAB15C_in_A2'] = cnt(A, '#EAB15C'); R['EAB15C_in_default'] = cnt(out, '#EAB15C'); R['F9DA99_in_default'] = cnt(out, '#F9DA99')
    near = {}
    for c in {tuple(int(v) for v in x) for x in out[op, :3]}:
        d = [round(q.de00(c, s), 1) for s in q.SIG]
        if min(d) < q.SIG_MIN: near[q.hexc(c)] = {'px': cnt(out, q.hexc(c)), 'de00_gold_cyan': d}
    R['default_colours_near_signal'] = near
    R['houses_order'] = [n for n, _ in q.RAMPS['house']]; R['house_ids'] = q.HOUSE_IDS
    return R, out

def up(a, s): a = np.ascontiguousarray(a); return Image.fromarray(a, 'RGBA').resize((int(round(a.shape[1] * s)), int(round(a.shape[0] * s))), Image.NEAREST)
def cell(a, i): return a[i * 96:(i + 1) * 96]
def label(d, xy, t, bg): d.text(xy, t, fill=(235, 235, 245) if sum(bg) < 300 else (20, 20, 30))
def grid(rows, s, bg, rlabels=None, clabels=None, pad=8):
    """rows: list of list of 96x96 arrays"""
    lw = 120; ch = 16 if clabels else 0; cw = int(96 * s) + pad
    W = lw + max(len(r) for r in rows) * cw + pad; H = ch + len(rows) * (int(96 * s) + pad) + pad
    im = Image.new('RGBA', (W, H), bg + (255,)); d = ImageDraw.Draw(im)
    for c, t in enumerate(clabels or []): label(d, (lw + c * cw + 2, 3), t, bg)
    for r, row in enumerate(rows):
        y = ch + pad + r * (int(96 * s) + pad)
        if rlabels: label(d, (4, y + 4), rlabels[r], bg)
        for c, a in enumerate(row): im.alpha_composite(up(a, s), (lw + c * cw, y))
    return im
def stack(parts, gap=0):
    W = max(p.width for p in parts); im = Image.new('RGBA', (W, sum(p.height for p in parts) + gap * (len(parts) - 1)), (255, 255, 255, 255)); y = 0
    for p in parts: im.paste(p.getpixel((0, 0)), (0, y, W, y + p.height)); im.alpha_composite(p, (0, y)); y += p.height + gap
    return im
def title(im, t):
    top = Image.new('RGBA', (im.width, 22), (255, 255, 255, 255)); ImageDraw.Draw(top).text((6, 5), t, fill=(20, 20, 30)); return stack([top, im])

def phone(frames_top, frames_bot, zoom, top_bg, bot_bg, caption):
    """device-resolution mock of an 844x390 landscape phone at DPR 2.625; game scale SC = round(dh/384) * zoom (index.html resize)"""
    dw, dh = round(PHONE[0] * DPR), round(PHONE[1] * DPR); base = max(1, round(dh / 384)); sc = base * zoom
    im = Image.new('RGBA', (dw, dh), top_bg + (255,)); ImageDraw.Draw(im).rectangle((0, dh // 2, dw, dh), fill=bot_bg + (255,))
    for half, frames in ((0, frames_top), (1, frames_bot)):
        n = len(frames); step = dw / (n + 0.4)
        for k, a in enumerate(frames):
            s = up(a, sc); x = int(step * (k + 0.7) - s.width / 2); y = int(dh // 2 * half + dh // 2 - 8 - 94 * sc - (sc - 1))
            im.alpha_composite(s, (max(0, x), max(0, y)))
    d = ImageDraw.Draw(im); d.text((10, 8), '%s · %dx%d @DPR %.3g · scale %.2f device px per art px (zoom %d%%)' % (caption, PHONE[0], PHONE[1], DPR, sc, round(zoom * 100)), fill=(20, 20, 30))
    return im, sc

def main():
    a2, m31, j31, ej, od = sys.argv[1:6]; os.makedirs(od, exist_ok=True)
    A = q.load(a2); M = q.load(m31); J = json.load(open(j31, encoding='utf-8')); E = json.load(open(ej, encoding='utf-8'))
    R = {'inputs': {'a2_png_sha256': q.sha(open(a2, 'rb').read()), 'mask_png_sha256': q.sha(open(m31, 'rb').read())}}
    R['a3_checks'], ID, G = q.check(A, M, J, E, os.path.getsize(m31))
    R['a3_checks'] = {'hard': R['a3_checks']['hard'], 'PASS': R['a3_checks']['PASS'], 'leak': R['a3_checks']['leak'], 'id11': {k: v for k, v in R['a3_checks']['id11'].items() if k != 'failing_groups'},
                      'signal': R['a3_checks']['signal']}
    R['metrics'] = metrics(A, M, E)
    R['default'], Dimg = default_checks(A, M)
    mt = R['metrics']
    R['g2_1_criteria'] = {
        '8/8 cells 96x96': all(v['cell'] == [96, 96] for v in mt.values()),
        'bottom row 94 (feet [48,94])': all(v['bottom_row'] == 94 for v in mt.values()),
        'feet centre within 2 px of x=48': all(v['feet_centre_off'] <= 2 for v in mt.values()),
        'height 80-88': all(80 <= v['height'] <= 88 for v in mt.values()),
        'semi-transparent 0': all(v['semi_alpha'] == 0 for v in mt.values()),
        'enclosed holes 1-3 px 0': all(v['holes_1_3px'] == 0 for v in mt.values()),
        'plum outline 1,882 = ID 1': sum(v['plum'] for v in mt.values()) == 1882 and R['a3_checks']['hard']['8_id1_eq_plum_1882'],
        'opaque without mask ID 0': all(v['opaque_without_id'] == 0 for v in mt.values()),
        '5,120-image leak test 0': R['a3_checks']['hard']['15_leak_5120'],
        'signal colours only locked exceptions': R['a3_checks']['hard']['14_signal_de00'],
        'house order Sun Wing Leaf Flame 4/4': R['a3_checks']['leak'].get('house_distinct') == 4 and q.HOUSE_IDS == ['sun', 'wing', 'leaf', 'flame'],
        'default render: fixed materials unchanged': R['default']['fixed_changed_px'] == 0,
        'default render: #EAB15C replaced by Brown ramp': R['default']['EAB15C_in_default'] == 0,
        'default render: #F9DA99 kept (6 px)': R['default']['F9DA99_in_default'] == 6}
    R['PASS'] = all(R['g2_1_criteria'].values())
    # ---------- sheets ----------
    made = []
    def save(im, n): im.save(os.path.join(od, n), optimize=True); made.append(n)
    dirs = [cell(Dimg, i) for i in range(8)]; orig = [cell(A, i) for i in range(8)]
    p = [grid([dirs], 4, LIGHT, ['A default'], q.L8), grid([dirs], 4, DARK, ['A default'], q.L8),
         grid([dirs, orig], 1, LIGHT, ['real size A', 'real size _4'], q.L8), grid([dirs, orig], 1, DARK, ['real size A', 'real size _4'], q.L8)]
    save(title(stack(p), 'QG-1 sheet 1 · default colours (D-A3-1 = A: hair Brown · eyes Green · skin Medium · cape Wing) · 8 directions · 4x and real size · light / dark'), 'qg1-1-default-8dirs.png')
    hs = [[cell(q.render(A, ID, G, dict(q.DEFAULT, house=b)), i) for i in range(8)] for b in range(4)]
    hn = [n for n, _ in q.RAMPS['house']]
    save(title(stack([grid(hs, 2, LIGHT, hn, q.L8), grid(hs, 2, DARK, hn, q.L8)]), 'QG-1 sheet 2 · cape 4 houses x 8 directions (order Sun Wing Leaf Flame) · light / dark'), 'qg1-2-houses-4x8.png')
    sk = [[cell(q.render(A, ID, G, dict(q.DEFAULT, skin=k)), i) for i in range(8)] for k in range(4)]
    sn = [n + (' (Pilot only)' if True else '') for n, _ in q.RAMPS['skin']]
    faces = []
    for k in range(4):
        img = q.render(A, ID, G, dict(q.DEFAULT, skin=k)); row = []
        for l, (x0, y0) in (('S', (30, 24)), ('SE', (34, 24)), ('W', (28, 24))):
            c = np.zeros((96, 96, 4), np.uint8); cr = cell(img, q.L8.index(l))[y0:y0 + 26, x0:x0 + 36]; c[:26, :36] = cr; row.append(c[:26, :36])
        faces.append(row)
    def facegrid(bg):
        s = 6; W = 120 + 3 * (36 * s + 8); H = 16 + 4 * (26 * s + 10); im = Image.new('RGBA', (W, H), bg + (255,)); d = ImageDraw.Draw(im)
        for c, t in enumerate(['S', 'SE', 'W']): label(d, (120 + c * (36 * s + 8), 2), t, bg)
        for r, row in enumerate(faces):
            label(d, (4, 20 + r * (26 * s + 10)), q.RAMPS['skin'][r][0], bg)
            for c, a in enumerate(row): im.alpha_composite(up(a, s), (120 + c * (36 * s + 8), 16 + r * (26 * s + 10)))
        return im
    save(title(stack([grid(sk, 2, LIGHT, sn, q.L8), grid(sk, 2, DARK, sn, q.L8), facegrid(LIGHT), facegrid(DARK)]),
               'QG-1 sheet 3 · skin 4 levels x 8 directions + faces (cheeks fixed, P3 trial) · light / dark · skin ramp = Pilot only'), 'qg1-3-skin-4.png')
    rng = np.random.RandomState(9); combos = []
    for _ in range(16): combos.append({g: int(rng.randint(len(q.RAMPS[g]))) for g in q.RAMPS})
    mix = [cell(q.render(A, ID, G, o), 0) for o in combos]
    ml = ['/'.join(q.RAMPS[g][o[g]][0][:4] for g in ('hair', 'iris', 'skin', 'house')) for o in combos]
    def mixgrid(bg):
        im = grid([mix[r * 8:(r + 1) * 8] for r in range(2)], 3, bg); d = ImageDraw.Draw(im)
        for j, t in enumerate(ml): label(d, (120 + (j % 8) * (96 * 3 + 8) + 2, 8 + (j // 8) * (96 * 3 + 8) + 2), t, bg)
        return im
    save(title(stack([mixgrid(LIGHT), mixgrid(DARK)]), 'QG-1 sheet 4 · 16 mixed colour sets (hair/eyes/skin/house, fixed seed) · direction S · light / dark'), 'qg1-4-mix16.png')
    houses_S = [cell(q.render(A, ID, G, dict(q.DEFAULT, house=b)), 0) for b in range(4)]
    skins_S = [cell(q.render(A, ID, G, dict(q.DEFAULT, skin=k)), 0) for k in range(4)]
    for z, n in ((1.0, 'qg1-5-phone-zoom100.png'), (0.75, 'qg1-6-phone-zoom75.png')):
        im, sc = phone(dirs, houses_S + skins_S, z, GRASS, CAVE, 'top: default 8 dirs on light ground · bottom: 4 houses + 4 skins on dark cave')
        save(im, n); R.setdefault('phone_scale', {})[n] = sc
    R['images'] = made
    json.dump(R, open(os.path.join(od, 'qg1-report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for k, v in R['g2_1_criteria'].items(): print(('PASS ' if v else 'FAIL ') + k)
    print('per direction:'); [print(' ', l, {k: v[k] for k in ('bottom_row', 'height', 'feet_centre_x', 'bbox_centre_x', 'semi_alpha', 'holes_1_3px', 'holes_any', 'plum')}) for l, v in mt.items()]
    print('default:', {k: v for k, v in R['default'].items() if k not in ('houses_order', 'house_ids')})
    print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); return 0 if R['PASS'] else 1

if __name__ == '__main__':
    sys.exit(main())
