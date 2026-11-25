# qa/g5/qa_asset15.py — checks for asset set 15 (the char2 beret), ASSET_SPEC_15_c2_hat.md section 7 (C1–C13).
# v1.1 (Codex T54-R1, N1): C12 materials (every edge pixel is the plum outline, the house colour is most of the hat in every picture with at
# least 3 shades on a sprite and 4 on the portrait, inner lines are lines) · C13 the JSON · C8 a pin on the portrait too. C9 (light from the
# top left) is a pointer only: it cannot prove that no view is a mirror — that is the JSON's "mirrored_views": [] plus the owner's eye.
# v1.2 (Codex T55-N1): C13 checks types as well as values (picked true, schema true, a ref of another frame or not a string all fail).
# v1.3 (Claude G5.4, set 15 rev 1): C14 the hat's outline is as thick as the outline of the picture it sits on (sprite: body 1 px; portrait:
# the portrait's chunky pixels, median 5 px) - the portrait hat of rev 1 had a 1 px outline on a 5 px portrait.
#   python3 -I qa/g5/qa_asset15.py BASE_DIR HAT_DIR [OUT_JSON]     exit 0 = every check passed
#   python3 -I qa/g5/qa_asset15.py --selftest BASE_DIR [KEEP_DIR] a made-up hat must pass, and 23 broken copies must each fail their check
# BASE_DIR holds the locked body files (main @ 95d9f7e): c2-pilot-kid4-idleanim.png + -mask.png, c2-pilot-kid4-pt.png + -pt-mask.png
# HAT_DIR holds c2-hat-beret.png, -mask.png, -pt.png, -pt-mask.png. Masks: R = ID, G = shade, A = 255 on hat pixels.
import sys, os, json, math, tempfile
from PIL import Image

DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
EYES = {2, 5}
OUTLINE = (0x3A, 0x1E, 0x3F)
HOUSES = [['#C0900C', '#F0B512', '#F3C546', '#F6D579'], ['#133C72', '#1B56A4', '#2370D5', '#508FE2'],
          ['#165A19', '#218324', '#2BAB2F', '#3BCE40'], ['#7F1015', '#B0161D', '#E01C25', '#E94951']]   # c2-pack.json palette.house (Sun Wing Leaf Flame)
SIGNAL = ['#FFC857', '#5FE0FF']
FILES = ['c2-hat-beret.png', 'c2-hat-beret-mask.png', 'c2-hat-beret-pt.png', 'c2-hat-beret-pt-mask.png']
JSON = 'c2-hat-beret.json'
REF = 'c2-pilot-kid4-idleanim.png frame 1'   # spec section 1, exactly

def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def lum(c): return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

def lab(c):
    def f(u):
        u /= 255; return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
    r, g, b = (f(v) for v in c[:3])
    x, y, z = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, r * 0.2126 + g * 0.7152 + b * 0.0722, (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    t = lambda v: v ** (1 / 3) if v > 0.008856 else 7.787 * v + 16 / 116
    return (116 * t(y) - 16, 500 * (t(x) - t(y)), 200 * (t(y) - t(z)))

def de00(c1, c2):   # CIEDE2000
    L1, a1, b1 = lab(c1); L2, a2, b2 = lab(c2)
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2; C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p, h2p = math.degrees(math.atan2(b1, a1p)) % 360, math.degrees(math.atan2(b2, a2p)) % 360
    dL, dC = L2 - L1, C2p - C1p
    dh = 0 if C1p * C2p == 0 else (h2p - h1p if abs(h2p - h1p) <= 180 else h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360)
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lm, Cmp = (L1 + L2) / 2, (C1p + C2p) / 2
    hm = h1p + h2p if C1p * C2p == 0 else ((h1p + h2p) / 2 if abs(h1p - h2p) <= 180 else (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2)
    T = 1 - 0.17 * math.cos(math.radians(hm - 30)) + 0.24 * math.cos(math.radians(2 * hm)) + 0.32 * math.cos(math.radians(3 * hm + 6)) - 0.2 * math.cos(math.radians(4 * hm - 63))
    SL = 1 + 0.015 * (Lm - 50) ** 2 / math.sqrt(20 + (Lm - 50) ** 2); SC = 1 + 0.045 * Cmp; SH = 1 + 0.015 * Cmp * T
    RT = -2 * math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-((hm - 275) / 25) ** 2)))
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))

def outline_median(img, msk):
    """median length of the horizontal runs of outline (mask ID 1) that start at the picture's outer edge (left neighbour see-through)"""
    p, m = img.load(), msk.load(); W, H = img.size; rs = []
    for y in range(H):
        x = 0
        while x < W:
            if m[x, y][3] and m[x, y][0] == 1:
                x0 = x
                while x + 1 < W and m[x + 1, y][3] and m[x + 1, y][0] == 1: x += 1
                if x0 == 0 or p[x0 - 1, y][3] == 0: rs.append(x - x0 + 1)
            x += 1
    rs.sort(); return rs[len(rs) // 2] if rs else None

def body(base):
    """per direction (idle frame 1) and for the portrait: head pixels, eye pixels, head top, eye top, head width"""
    out = {}
    im = Image.open(os.path.join(base, 'c2-pilot-kid4-idleanim.png')).convert('RGBA').load()
    mk = Image.open(os.path.join(base, 'c2-pilot-kid4-idleanim-mask.png')).convert('RGBA').load()
    for r, d in enumerate(DIRS):
        op = {(x, y) for y in range(96) for x in range(96) if im[x, r * 96 + y][3] > 0}
        top = min(y for x, y in op); width = {y: sum(1 for x in range(96) if (x, y) in op) for y in range(top, 60)}
        neck = min(range(top + 18, 56), key=lambda y: (width.get(y, 99), y))
        head = {(x, y) for x, y in op if y < neck}; eyes = {(x, y) for (x, y) in op if mk[x, r * 96 + y][0] in EYES}
        out[d] = dict(head=head, eyes=eyes, top=top, eye_top=min((y for x, y in eyes), default=None), head_w=max(x for x, y in head) - min(x for x, y in head) + 1, scale=1)
    pi = Image.open(os.path.join(base, 'c2-pilot-kid4-pt.png')).convert('RGBA'); W, H = pi.size; p = pi.load()
    pm = Image.open(os.path.join(base, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA').load()
    hair = {(x, y) for y in range(H) for x in range(W) if p[x, y][3] > 0 and pm[x, y][0] in (1, 2, 3, 4, 5, 10, 11)}
    eyes = {(x, y) for y in range(H) for x in range(W) if p[x, y][3] > 0 and pm[x, y][0] in EYES}
    eye_top = min(y for x, y in eyes); head = {(x, y) for (x, y) in hair if y < eye_top + 40}
    out['portrait'] = dict(head=head, eyes=eyes, top=min(y for x, y in head), eye_top=eye_top, head_w=max(x for x, y in head) - min(x for x, y in head) + 1, scale=4)
    out['outline'] = {'sprite': outline_median(Image.open(os.path.join(base, 'c2-pilot-kid4-idleanim.png')).convert('RGBA'), Image.open(os.path.join(base, 'c2-pilot-kid4-idleanim-mask.png')).convert('RGBA')),
                      'portrait': outline_median(pi, Image.open(os.path.join(base, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA'))}
    return out

def cells(img, msk, n, size):
    a, m = img.load(), msk.load(); res = []
    for i in range(n):
        px = {}
        for y in range(size):
            for x in range(size):
                c, k = a[i * size + x, y], m[i * size + x, y]
                px[(x, y)] = (c, k)
        res.append(px)
    return res

def check(base, hatdir):
    B = body(base); R = {}; bad = []
    def rec(cid, ok, info):
        R.setdefault(cid, {'ok': True, 'info': {}}); R[cid]['ok'] &= bool(ok); R[cid]['info'].update(info)
        if not ok: bad.append([cid, info])
    paths = [os.path.join(hatdir, f) for f in FILES]
    if not all(os.path.exists(p) for p in paths): rec('C1', False, {'missing': [f for f, p in zip(FILES, paths) if not os.path.exists(p)]}); return R, bad
    im, mk, pt, ptm = (Image.open(p) for p in paths)
    rec('C1', im.size == (768, 96) and mk.size == (768, 96) and pt.size == (384, 384) and ptm.size == (384, 384) and all(x.mode == 'RGBA' for x in (im, mk, pt, ptm)),
        {'sizes': [im.size, mk.size, pt.size, ptm.size], 'modes': [im.mode, mk.mode, pt.mode, ptm.mode]})
    if not R['C1']['ok']: return R, bad
    sets = [(d, c, 'sprite') for d, c in zip(DIRS, cells(im, mk, 8, 96))] + [('portrait', cells(pt, ptm, 1, 384)[0], 'portrait')]
    semi = mism = 0; ids = set(); c3 = {'outline_wrong': 0, 'copper_not_warm': 0, 'copper_near_signal': 0, 'copper_yellow': {}, 'line_too_light': 0, 'shade_order': {}}
    house_px = []; pins = {}
    for name, px, kind in sets:
        b = B[name]; hat = set(); bylvl = {}
        for (x, y), (c, k) in px.items():
            if c[3] not in (0, 255) or k[3] not in (0, 255): semi += 1
            if (c[3] == 255) != (k[3] == 255): mism += 1
            if c[3] == 255:
                hat.add((x, y)); i = k[0]; ids.add(i)
                if i == 1 and c[:3] != OUTLINE: c3['outline_wrong'] += 1
                if i == 8: bylvl.setdefault(k[1], []).append(lum(c)); house_px.append((name, k[1]))
                if i == 9:
                    pins[name] = pins.get(name, 0) + 1
                    if not c[0] > c[2]: c3['copper_not_warm'] += 1
                    if de00(c, hexrgb('#5FE0FF')) < 10: c3['copper_near_signal'] += 1
                    if de00(c, hexrgb('#FFC857')) < 10 or de00(c, hexrgb('#F9DA99')) < 10: c3['copper_yellow'][name] = c3['copper_yellow'].get(name, 0) + 1
                if i == 11 and lum(c) >= 0.25: c3['line_too_light'] += 1
                if i not in (1, 8, 9, 11) or (i == 8 and k[1] > 3): c3.setdefault('bad_id', 0); c3['bad_id'] += 1
        means = [sum(bylvl[g]) / len(bylvl[g]) for g in sorted(bylvl)]
        # C12 materials: an edge pixel (a 4-neighbour is see-through or outside the picture) must be the outline (ID 1); the house colour
        # (ID 8) is at least half of the hat, with >= 3 shades on a sprite and all 4 on the portrait; inner lines (ID 11) at most a fifth
        size_ = 384 if kind == 'portrait' else 96; ids_ = {q: px[q][1][0] for q in px if px[q][0][3] == 255}
        edge = [q for q in ids_ if any(not (0 <= q[0] + dx < size_ and 0 <= q[1] + dy < size_) or px[(q[0] + dx, q[1] + dy)][0][3] != 255 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        n_ = max(1, len(ids_)); share8 = sum(1 for v in ids_.values() if v == 8) / n_; share11 = sum(1 for v in ids_.values() if v == 11) / n_
        edge_bad = sum(1 for q in edge if ids_[q] != 1); shades = len(bylvl)
        rec('C12', bool(ids_) and edge_bad == 0 and share8 >= 0.5 and share11 <= 0.2 and shades >= (4 if kind == 'portrait' else 3),
            {name: {'edge_px': len(edge), 'edge_not_outline': edge_bad, 'house_share': round(share8, 3), 'line_share': round(share11, 3), 'house_shades': shades}})
        c3['shade_order'][name] = all(a < b2 for a, b2 in zip(means, means[1:]))
        if not hat: rec('C7', False, {name: 'empty'}); continue
        s = b['scale']; xs = [x for x, y in hat]; ys = [y for x, y in hat]
        # C4 eyes
        over = len(hat & b['eyes']); gap_ok = b['eye_top'] is None or max(ys) <= b['eye_top'] - 3
        rec('C4', over == 0 and gap_ok, {name: {'eye_px_covered': over, 'hat_bottom': max(ys), 'eye_top': b['eye_top']}})
        # C5 crown: the top 3 rows of the head (12 on the portrait)
        crown = {(x, y) for (x, y) in b['head'] if y <= b['top'] + 3 * s - 1}; cov = len(crown & hat) / max(1, len(crown))
        rec('C5', cov >= 0.95, {name: round(cov, 3)})
        # C6 not floating: the lowest hat pixel of each column reaches the head's top edge in that column (on it or right above it); where the
        # head's top edge is lower by at most 6 rows (24 on the portrait), the gap is at most 1 row (4 on the portrait)
        touch = 0; worst = 0; first = {}
        for (x, y) in b['head']: first[x] = min(first.get(x, 9999), y)   # the head's top edge per column (gaps between hair strands do not count)
        for x in set(xs):
            yb = max(y for (xx, y) in hat if xx == x)
            if x in first and yb >= first[x] - 1: touch += 1; continue
            if x in first and first[x] - yb - 1 <= 6 * s: worst = max(worst, first[x] - yb - 1)
        share = touch / len(set(xs))
        rec('C6', share >= 0.60 and worst <= 1 * s, {name: {'touch_share': round(share, 3), 'worst_gap_rows': worst}})
        # C7 size
        w = max(xs) - min(xs) + 1
        rec('C7', w <= b['head_w'] + 8 * (4.65 if s == 4 else 1) and min(ys) >= (2 if s == 4 else 1), {name: {'width': w, 'head_w': b['head_w'], 'top': min(ys)}})
    rec('C2', semi == 0 and mism == 0, {'semi_transparent_px': semi, 'image_vs_mask_mismatch_px': mism})
    rec('C3', c3['outline_wrong'] == 0 and c3['copper_not_warm'] == 0 and c3['copper_near_signal'] == 0 and max(c3['copper_yellow'].values(), default=0) <= 2 and
        c3['line_too_light'] == 0 and not c3.get('bad_id') and all(c3['shade_order'].values()), {**c3, 'ids': sorted(ids)})
    # C8 pin
    pc = {d: pins.get(d, 0) for d in DIRS}
    pc['portrait'] = pins.get('portrait', 0)
    rec('C8', all(pc[d] >= 4 for d in ('S', 'SE', 'SW')) and all(pc[d] == 0 for d in ('NE', 'N', 'NW')) and pc['portrait'] >= 40, {'pin_px': pc})
    # C9 light from the top left of the screen in every view (Route K · this is what a left-right mirror breaks): the house-colour pixels of
    # the left half of the hat have on average a shade at least as light as those of the right half
    res9 = {}
    for name, px, kind in sets:
        h8 = [(x, k[1]) for (x, y), (c, k) in px.items() if c[3] == 255 and k[0] == 8]
        if not h8: continue
        mid = (min(x for x, g in h8) + max(x for x, g in h8)) / 2
        L = [g for x, g in h8 if x < mid]; Rr = [g for x, g in h8 if x > mid]
        res9[name] = [round(sum(L) / max(1, len(L)), 2), round(sum(Rr) / max(1, len(Rr)), 2)]
    rec('C9', all(l >= r for l, r in res9.values()), {'shade_left_vs_right': res9})
    # C10 the fixed colours (outline ID 1, inner lines ID 11) stay away from the signal colours. House-colour pixels (ID 8) become the same four
    # ramps as the cape, with the cape's approved exceptions (Sun 2-4), and the copper pin has its own rule in C3.
    near = sum(1 for _, px, _ in sets for (c, k) in px.values() if c[3] == 255 and k[0] in (1, 11) and any(de00(c[:3], hexrgb(s2)) < 10 for s2 in SIGNAL))
    rec('C10', near == 0, {'fixed_px_near_signal': near})
    size = sum(os.path.getsize(p) for p in paths)
    rec('C11', size <= 80 * 1024, {'bytes_4_png': size})
    # C13 the JSON that comes with the pictures (spec section 1)
    jp = os.path.join(hatdir, JSON); why = []
    try:
        j = json.load(open(jp, encoding='utf-8'))
        # exact types as well as values (Codex T55-N1): in Python True == 1 and isinstance(True, int), so a whole number is checked with type() is int
        isint = lambda v: type(v) is int
        if not (isint(j.get('schema')) and j['schema'] == 1): why.append('schema')
        if j.get('id') != 'beret' or type(j.get('id')) is not str: why.append('id')
        if not (isinstance(j.get('cell'), list) and len(j['cell']) == 2 and all(isint(v) and v == 96 for v in j['cell'])): why.append('cell')
        if not (isinstance(j.get('dirs'), list) and all(type(v) is str for v in j['dirs']) and j['dirs'] == DIRS): why.append('dirs')
        if not (type(j.get('ref')) is str and j['ref'] == REF): why.append('ref')
        pl = j.get('pixellab') if isinstance(j.get('pixellab'), dict) else {}
        if not (isint(pl.get('picked')) and 1 <= pl['picked'] <= 16): why.append('pixellab.picked')
        if not (type(pl.get('file')) is str and pl['file'].strip()): why.append('pixellab.file')
        if type(j.get('tilt')) is not str or j['tilt'] not in ('char_right', 'char_left'): why.append('tilt')
        if type(j.get('light')) is not str or j['light'] != 'top-left': why.append('light')
        if not (isinstance(j.get('mirrored_views'), list) and j['mirrored_views'] == []): why.append('mirrored_views')
        if type(j.get('note')) is not str: why.append('note')
    except FileNotFoundError: why.append('missing ' + JSON)
    except Exception as e: why.append('unreadable: %s' % e)
    rec('C13', not why, {'json_problems': why})
    # C14 outline as thick as the picture the hat sits on (sprite: at most the body's + 1 · portrait: within the portrait's +-1)
    ms, mp_ = outline_median(im, mk), outline_median(pt, ptm); bs, bp = B['outline']['sprite'], B['outline']['portrait']
    rec('C14', ms is not None and mp_ is not None and ms <= bs + 1 and abs(mp_ - bp) <= 1, {'hat_outline_median': {'sprite': ms, 'portrait': mp_}, 'base_outline_median': {'sprite': bs, 'portrait': bp}})
    return R, bad

def selftest(base, keep=None):
    """a made-up hat on every head: it must pass; then each broken copy must fail the check named for it"""
    B = body(base); tmp = tempfile.mkdtemp(prefix='qa15-')
    ramp = [hexrgb(h) for h in HOUSES[1]]
    def cap(a, m, ox, head, cx, w2, dome, sink, low, shift=0, stalk=0, ow=1):
        """a cap that sits on the head: in each column over the head, from (top of head - dome) down to (top of head + sink), not below `low`"""
        prof = {}
        for x, y in head: prof[x] = min(prof.get(x, 999), y)
        pts = set()
        for x, p in prof.items():
            u = (x - cx) / w2
            if abs(u) > 1 or p + 1 > low: continue   # no scraps where the head's edge is already below the lowest row allowed
            for y in range(int(p - dome * math.sqrt(1 - u * u)), min(low, p + sink) + 1): pts.add((x, y + shift))
        if stalk:
            t = min(y for x, y in pts)
            for y in range(t - 3, t): pts.update({(int(cx + stalk), y), (int(cx + stalk) + 1, y)})
        bot = max(y for x, y in pts); topy = min(y for x, y in pts)
        for x, y in pts:
            if y < 0: continue
            edge = any(q not in pts for q in ((x - k, y) for k in range(1, ow + 1))) or any(q not in pts for q in ((x + k, y) for k in range(1, ow + 1))) or any(q not in pts for q in ((x, y - k) for k in range(1, ow + 1))) or any(q not in pts for q in ((x, y + k) for k in range(1, ow + 1)))
            if edge: a[ox + x, y] = OUTLINE + (255,); m[ox + x, y] = (1, 0, 0, 255)
            else:
                g = max(0, min(3, 3 - (y - topy) * 4 // (bot - topy + 1) + (1 if x < cx - 2 else 0) - (1 if x > cx + 2 else 0)))
                a[ox + x, y] = ramp[g] + (255,); m[ox + x, y] = (8, g, 0, 255)
        return bot
    def make(variant=None):
        im = Image.new('RGBA', (768, 96)); mk = Image.new('RGBA', (768, 96)); a, m = im.load(), mk.load()
        for i, d in enumerate(DIRS):
            b = B[d]; hx = [x for x, y in b['head'] if y <= b['top'] + 4]; cx = (min(hx) + max(hx)) / 2
            low = (b['eye_top'] - 3) if b['eye_top'] else b['top'] + 20
            shift = 22 if variant == 'down' else (-9 if variant == 'up' and d == 'S' else 0)
            bot = cap(a, m, i * 96, b['head'], cx, b['head_w'] / 2 + 1, 5, 4, low, shift, stalk=3)   # the stalk on the same side in every view
            if d in ('S', 'SE', 'SW', 'E', 'W') and variant != 'nopin':
                cb = min(max(y for y in range(96) if m[i * 96 + x, y][3]) for x in (int(cx), int(cx) + 1))   # inside the hat, above its outline
                for dy in (0, 1):
                    for dx in (0, 1):
                        x, y = int(cx) + dx, cb - 3 + dy; a[i * 96 + x, y] = (0xBB, 0x7A, 0x57, 255); m[i * 96 + x, y] = (9, 0, 0, 255)
        if variant == 'mirror':
            e = im.crop((2 * 96, 0, 3 * 96, 96)).transpose(Image.FLIP_LEFT_RIGHT); em = mk.crop((2 * 96, 0, 3 * 96, 96)).transpose(Image.FLIP_LEFT_RIGHT)
            im.paste(e, (6 * 96, 0)); mk.paste(em, (6 * 96, 0))
        sx, sy = 48, B['S']['top'] + 1
        if variant == 'semi': a[sx, sy] = a[sx, sy][:3] + (128,)
        if variant == 'maskgap': m[sx, sy] = (0, 0, 0, 0)
        if variant == 'outline':
            for x in range(768):
                for y in range(96):
                    if m[x, y][0] == 1 and m[x, y][3]: a[x, y] = (0, 0, 0, 255)
        if variant == 'cyan':
            for x in range(768):
                for y in range(96):
                    if m[x, y][0] == 9 and m[x, y][3]: a[x, y] = hexrgb('#5FE0FF') + (255,)
        if variant == 'wide':
            for y in range(B['S']['top'] + 2, B['S']['top'] + 4):
                for x in range(4, 10): a[x, y] = OUTLINE + (255,); m[x, y] = (1, 0, 0, 255)
        if variant == 'gold11':   # a few house pixels turned into an inner line in the signal gold
            n = 0
            for x in range(96):
                for y in range(96):
                    if n < 3 and m[x, y][0] == 8 and m[x, y][3]: a[x, y] = hexrgb('#FFC857') + (255,); m[x, y] = (11, 0, 0, 255); n += 1
        if variant == 'big':      # invisible noise (alpha 0) makes the file large without changing any hat pixel
            import random; rnd = random.Random(15)
            for x in range(768):
                for y in range(96):
                    if a[x, y][3] == 0: a[x, y] = (rnd.randrange(256), rnd.randrange(256), rnd.randrange(256), 0)
        if variant == 'size': im = im.crop((0, 0, 760, 96))
        im.save(os.path.join(tmp, FILES[0])); mk.save(os.path.join(tmp, FILES[1]))
        P = B['portrait']; pim = Image.new('RGBA', (384, 384)); pmk = Image.new('RGBA', (384, 384))
        hx = [x for x, y in P['head'] if y <= P['top'] + 12]; cx = (min(hx) + max(hx)) / 2
        cap(pim.load(), pmk.load(), 0, P['head'], cx, P['head_w'] / 2 + 2, 16, 16, P['eye_top'] - 12, ow=(1 if variant == 'pt_thin' else B['outline']['portrait']))
        pa, pm = pim.load(), pmk.load()
        if variant != 'pt_nopin':
            cb = min(max(y for y in range(384) if pm[x, y][3]) for x in range(int(cx) - 3, int(cx) + 4))
            for dy in range(7):
                for dx in range(7):
                    x, y = int(cx) - 3 + dx, cb - 10 + dy; pa[x, y] = (0xBB, 0x7A, 0x57, 255); pm[x, y] = (9, 0, 0, 255)
        if variant in ('no_outline', 'no_house', 'flat_mirror'):
            for (img, msk, w) in ((im, mk, 768), (pim, pmk, 384)):
                ia, ma = img.load(), msk.load()
                for x in range(w):
                    for y in range(img.size[1]):
                        if not ma[x, y][3]: continue
                        if variant == 'no_outline' and ma[x, y][0] == 1: ia[x, y] = ramp[0] + (255,); ma[x, y] = (8, 0, 0, 255)
                        if variant == 'no_house' and ma[x, y][0] == 8: ia[x, y] = (20, 10, 25, 255); ma[x, y] = (11, 0, 0, 255)
                        if variant == 'flat_mirror' and ma[x, y][0] == 8: ia[x, y] = ramp[0] + (255,); ma[x, y] = (8, 0, 0, 255)
            if variant == 'flat_mirror':
                e = im.crop((2 * 96, 0, 3 * 96, 96)).transpose(Image.FLIP_LEFT_RIGHT); em = mk.crop((2 * 96, 0, 3 * 96, 96)).transpose(Image.FLIP_LEFT_RIGHT)
                im.paste(e, (6 * 96, 0)); mk.paste(em, (6 * 96, 0))
            im.save(os.path.join(tmp, FILES[0])); mk.save(os.path.join(tmp, FILES[1]))
        pim.save(os.path.join(tmp, FILES[2])); pmk.save(os.path.join(tmp, FILES[3]))
        meta = {'schema': 1, 'id': 'beret', 'cell': [96, 96], 'dirs': DIRS, 'ref': 'c2-pilot-kid4-idleanim.png frame 1', 'pixellab': {'picked': 7, 'file': 'made-up.png'},
                'tilt': 'char_right', 'light': 'top-left', 'mirrored_views': [], 'note': 'made-up hat of the self-test, not an asset'}
        if variant == 'bad_json': meta['mirrored_views'] = ['W']
        if variant == 'picked_true': meta['pixellab']['picked'] = True
        if variant == 'ref_frame4': meta['ref'] = 'c2-pilot-kid4-idleanim.png frame 4'
        if variant == 'ref_object': meta['ref'] = {'idleanim': False}
        if variant == 'schema_true': meta['schema'] = True
        jpath = os.path.join(tmp, JSON)
        if variant == 'no_json':
            if os.path.exists(jpath): os.remove(jpath)
        else: json.dump(meta, open(jpath, 'w'))
        return tmp
    cases = [(None, None), ('down', 'C4'), ('up', 'C6'), ('semi', 'C2'), ('maskgap', 'C2'), ('mirror', 'C9'), ('nopin', 'C8'), ('outline', 'C3'), ('cyan', 'C3'), ('wide', 'C7'), ('gold11', 'C10'), ('big', 'C11'), ('size', 'C1'),
             ('no_outline', 'C12'), ('no_house', 'C12'), ('flat_mirror', 'C12'), ('pt_nopin', 'C8'), ('no_json', 'C13'), ('bad_json', 'C13'),
             ('picked_true', 'C13'), ('ref_frame4', 'C13'), ('ref_object', 'C13'), ('schema_true', 'C13'),
             ('pt_thin', 'C14')]
    out = []; ok_all = True
    for v, want in cases:
        R, bad = check(base, make(v)); failed = sorted({b[0] for b in bad})
        good = (not failed) if v is None else (want in failed)
        ok_all &= good; out.append({'case': v or 'made-up hat', 'expect': 'pass' if v is None else 'fail ' + want, 'failed': failed, 'ok': good})
        print(('ok   ' if good else 'FAIL ') + (v or 'made-up hat') + ' -> failed ' + (','.join(failed) or 'nothing'))
        if v is None and not good: print(json.dumps(bad)[:2000])
    print(json.dumps({'selftest': 'pass' if ok_all else 'FAIL', 'cases': len(out)}))
    if keep:   # the made-up hat, for a look (not an asset)
        import shutil; d = make(None)
        for f in FILES + [JSON]: shutil.copy(os.path.join(d, f), os.path.join(keep, f))
    import shutil; shutil.rmtree(tmp, ignore_errors=True)
    return ok_all

if __name__ == '__main__':
    if sys.argv[1] == '--selftest': sys.exit(0 if selftest(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None) else 1)
    R, bad = check(sys.argv[1], sys.argv[2])
    res = {'pass': not bad, 'checks': {k: v['ok'] for k, v in sorted(R.items())}, 'detail': R}
    if len(sys.argv) > 3: json.dump(res, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'pass': res['pass'], 'checks': res['checks']}))
    for b in bad[:12]: print('FAIL', b[0], json.dumps(b[1])[:300])
    sys.exit(0 if not bad else 1)
