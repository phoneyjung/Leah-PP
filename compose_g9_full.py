# compose_g9_full.py — ประกอบฉาก G9 ทั้งฉาก (ภาพนิ่งสำหรับตรวจ + ส่งออกเป็นชั้นสำหรับเกม)
#   พื้น = ground_full.png (ภาพพื้นที่ AI วาด 4 ชิ้น ต่อด้วย stitch_ground.py) · โลก 48x32 ช่องผัง × 40 พิกเซล = 1920x1280
#   ของทุกชิ้นเป็นภาพแยก (objects-1/2/3 + บ้าน) วางตามสเปก · ต้นไม้วางตามตำแหน่งในภาพต้นแบบของ AI
# ใช้: python3 compose_g9_full.py [seed] [out.png] [export_dir]
import numpy as np, cv2, json, sys, collections
from PIL import Image

U = 40; TW, TH = 48, 32
S = json.load(open('/home/claude/g9/map-G9-spec.json'))
rs = np.random.RandomState(int(sys.argv[1]) if len(sys.argv) > 1 else 5)
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/gt/g9_full.png'
ground = Image.open('/home/claude/gt/ground_full.png').convert('RGBA'); W, H = ground.size
DX = S['doors']['our_house'][0]
def extend_path_up(img, cx, from_y, to_y, src_h=44, half=44):
    # copy a clean slice of the painted path (with its edges and a little grass each side) upward; every other copy is flipped so the rows meet exactly
    g = np.asarray(img).astype(np.float32).copy(); strip = g[from_y:from_y + src_h, cx - half:cx + half].copy()
    wgt = np.ones(2 * half, np.float32); wgt[:10] = np.linspace(0, 1, 10); wgt[-10:] = np.linspace(1, 0, 10); wgt = wgt[None, :, None]
    y = from_y; k = 0
    while y > to_y:
        hh = min(src_h, y - to_y); piece = (strip[::-1] if k % 2 == 0 else strip)[-hh:]
        g[y - hh:y, cx - half:cx + half] = g[y - hh:y, cx - half:cx + half] * (1 - wgt) + piece * wgt; y -= hh; k += 1
    return Image.fromarray(g.astype(np.uint8), 'RGBA')
ground = extend_path_up(ground, int(round(19.46 * U)), int(12.55 * U), int(10.0 * U))        # the painted path to the house ended 2 tiles short of the door
LIBS = [(Image.open(p + '.png').convert('RGBA'), json.load(open(p + '.json'))) for p in
        ('/home/claude/lib3s/objects-3', '/home/claude/lib2/objects-2', '/home/claude/v108/objects-1')]

TONES = {'deep': (65.0, 64, 122, 190), 'mid': (63.5, 70, 134, 204), 'light': (61.5, 78, 146, 214), 'tuft': (46.0, 132, 200, 228)}
def regrade(im, tone):
    hue, lo, mid, hi = TONES[tone]; a = np.asarray(im).copy(); al = a[..., 3] > 0
    hsv = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2HSV).astype(np.float32)
    leaf = al & (hsv[..., 0] > 30) & (hsv[..., 0] < 90) & (hsv[..., 1] > 80)
    if leaf.sum() < 50: return im
    p10, p50, p90 = np.percentile(hsv[..., 2][leaf], [10, 50, 90])
    hsv[..., 2] = np.where(leaf, np.interp(hsv[..., 2], [0, p10, p50, p90, 255], [0, lo, mid, hi, min(255, hi + 20)]), hsv[..., 2])
    hsv[..., 0] = np.where(leaf, hsv[..., 0] + (hue - hsv[..., 0][leaf].mean()), hsv[..., 0])
    a[..., :3] = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB); return Image.fromarray(a, 'RGBA')
_c = {}
def spr(n, scale=1.0, h=None, flip=False, tone=None):
    key = (n, round(scale, 3), h, flip, tone)
    if key not in _c:
        src, P = next((s_, p_) for s_, p_ in LIBS if n in p_); x, y, w, hh = P[n]; im = src.crop((x, y, x + w, y + hh))
        if tone: im = regrade(im, tone)
        if h: scale = h / im.height
        if scale != 1: im = im.resize((max(2, round(im.width * scale)), max(2, round(im.height * scale))), Image.LANCZOS)
        _c[key] = im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
    return _c[key]
def nine(n, w, h, c=22):                        # a framed flat piece stretched to any size, corners kept
    s = spr(n); sw, sh = s.size; out = Image.new('RGBA', (w, h)); xs = [0, c, sw - c, sw]; ys = [0, c, sh - c, sh]; xd = [0, c, w - c, w]; yd = [0, c, h - c, h]
    for j in range(3):
        for i in range(3): out.paste(s.crop((xs[i], ys[j], xs[i + 1], ys[j + 1])).resize((xd[i + 1] - xd[i], yd[j + 1] - yd[j]), Image.LANCZOS), (xd[i], yd[j]))
    return out

OB = []                                          # (foot y, centre x, picture, name)  in world px
FLAT = []                                        # (picture, left, top, name): lies on the ground, under every shadow
def add(n, tx, ty, **k): OB.append((ty * U, tx * U, spr(n, **k), n))

# ---------- what the painted ground itself says ----------
g = np.asarray(ground.convert('RGB')); hsv = cv2.cvtColor(g, cv2.COLOR_RGB2HSV)
h_, s_, v_ = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
op = lambda m, k: cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k))) > 0
dil = lambda m, k: cv2.dilate(m.astype(np.uint8), np.ones((k, k))) > 0
sand = op((h_ >= 14) & (h_ <= 31) & (s_ > 55) & (s_ < 200) & (v_ > 175), 7)
water = op((h_ > 88) & (h_ < 125) & (s_ > 90) & (v_ > 120), 5)
# grass tufts take their colour from the lawn of this ground picture (a little darker, so they still read as tufts)
_hsv = cv2.cvtColor(np.asarray(ground.convert('RGB')), cv2.COLOR_RGB2HSV); _lawn = (_hsv[..., 0] > 30) & (_hsv[..., 0] < 80) & (_hsv[..., 1] > 100) & ~(np.asarray(sand) > 0) & ~(np.asarray(water) > 0)
_v = np.percentile(_hsv[..., 2][_lawn], [10, 50, 90]); TONES['tuft'] = (float(np.median(_hsv[..., 0][_lawn])), float(_v[0] * 0.70), float(_v[1] * 0.84), float(_v[2] * 0.96)); LAWN = (float(np.median(_hsv[..., 0][_lawn])), [float(x) for x in _v])
# the ground picture still carries the beds the AI painted at the old size: lay lawn over them (cloned from the cleanest stretch of this same lawn); our beds go on top
_ga = np.asarray(ground.convert('RGB')).copy(); _int = cv2.integral(_lawn.astype(np.uint8)); _best = None
for _y in range(0, H - 160, 20):
    for _x in range(0, W - 160, 20):
        _f = (_int[_y + 160, _x + 160] - _int[_y, _x + 160] - _int[_y + 160, _x] + _int[_y, _x]) / 25600.0
        if _best is None or _f > _best[0]: _best = (_f, _x, _y)
_smp = _ga[_best[2]:_best[2] + 160, _best[1]:_best[1] + 160]; _tile = np.vstack([np.hstack([_smp, _smp[:, ::-1]]), np.hstack([_smp[::-1], _smp[::-1, ::-1]])])
for _v in S['plots'].values():
    _x0, _y0, _x1, _y1 = [int(t_ * U) for t_ in _v['rect']]; _x0 -= 16; _y0 -= 16; _x1 += 16; _y1 += 16
    _hb = cv2.cvtColor(_ga[_y0:_y1, _x0:_x1], cv2.COLOR_RGB2HSV); _soil = ((_hb[..., 0] < 28) & (_hb[..., 2] < 175)) | (_hb[..., 2] < 80)
    _n, _lb, _st, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(_soil.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5))), connectivity=8)
    _keep = np.zeros_like(_soil, np.uint8)                     # only the bed itself (the big dark block in the middle), never the brown rim of a road that passes nearby
    for _i in range(1, _n):
        if _st[_i][4] > 3000 and _st[_i][0] > 2 and _st[_i][1] > 2 and _st[_i][0] + _st[_i][2] < _soil.shape[1] - 2 and _st[_i][1] + _st[_i][3] < _soil.shape[0] - 2: _keep[_lb == _i] = 1
    _m = cv2.GaussianBlur(cv2.dilate(_keep, np.ones((13, 13))).astype(np.float32), (0, 0), 2)[..., None]
    _fill = np.tile(_tile, ((_y1 - _y0) // 320 + 1, (_x1 - _x0) // 320 + 1, 1))[:_y1 - _y0, :_x1 - _x0]
    _ga[_y0:_y1, _x0:_x1] = (_ga[_y0:_y1, _x0:_x1] * (1 - _m) + _fill * _m).astype(np.uint8)
ground = Image.fromarray(_ga).convert('RGBA')
rock = op((s_ < 50) & (v_ > 90) & (v_ < 215), 9)

# ---------- buildings and yard pieces, from the spec ----------
house = Image.open('/home/claude/hs/farm-house-1.png').convert('RGBA'); house = house.resize((245, round(313 * 245 / 256)), Image.LANCZOS)
HX = DX * U - 105 * 245 / 256                                           # the door centre sits 105 px from the left of the 256-px picture
OB.append((10.15 * U, HX + 245 / 2, house, 'house'))
def straight_plot_parts():
    a = np.asarray(spr('plot')).copy(); hh, ww = a.shape[:2]; al = a[..., 3] > 0; out = np.zeros_like(a)
    for y in range(hh):                                   # stretch every row to the full width: the trapezoid becomes a rectangle
        xs = np.where(al[y])[0]
        if len(xs) < 4: continue
        row = a[y:y + 1, xs.min():xs.max() + 1]; out[y] = cv2.resize(row, (ww, 1), interpolation=cv2.INTER_NEAREST)[0]
    im = Image.fromarray(out, 'RGBA'); g_ = out[..., :3].astype(int).sum(-1)
    # furrows: dark lines between the ridges of soil, found on the middle of the picture
    prof = g_[26:118, 60:190].mean(1); lows = [i + 26 for i in range(2, len(prof) - 2) if prof[i] == prof[max(0, i - 6):i + 7].min()]
    per = int(round(np.median(np.diff(lows)))) if len(lows) > 2 else 19
    return im, lows[0], per
PLOT_IM, FUR0, FPER = straight_plot_parts()
PTOP, PSIDE = 7, 8                                           # soil starts this far inside the picture (room for the uneven edge)
def make_plot(w, n_furrows):
    PW_, PH_ = PLOT_IM.size; soil_h = n_furrows * FPER; h = PTOP + soil_h + 9; a = np.zeros((h, w, 4), np.uint8)
    soil = np.asarray(PLOT_IM.crop((18, FUR0, PW_ - 18, FUR0 + FPER))); sw = soil.shape[1]
    for r in range(n_furrows):
        x = 0
        while x < w:
            piece = soil if (x // sw) % 2 == 0 else soil[:, ::-1]; ww = min(sw, w - x); a[PTOP + r * FPER:PTOP + (r + 1) * FPER, x:x + ww] = piece[:, :ww]; x += sw
    a[:PTOP] = a[PTOP + FPER - PTOP:PTOP + FPER]; a[PTOP + soil_h:] = a[PTOP:PTOP + (h - PTOP - soil_h)]      # real soil rows, not one row smeared
    # uneven edge: rounded corners + clumps of earth, in 3-px steps; then a darker rim, as freshly dug soil has
    yy, xx = np.mgrid[:h, :w]; dx = np.minimum(xx, w - 1 - xx).astype(np.float32); dy = np.minimum(yy, h - 1 - yy).astype(np.float32)
    corner = np.where((dx < 12) & (dy < 12), 12 - np.hypot(12 - dx, 12 - dy), np.minimum(dx, dy)); keep_ = corner > 1.5                      # smooth rounded edge
    a[..., 3] = np.where(keep_, 255, 0); edge = keep_ & ~(cv2.erode(keep_.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)
    a[..., :3] = np.where(edge[..., None], (a[..., :3] * 0.62).astype(np.uint8), a[..., :3]); return Image.fromarray(a, 'RGBA')
def make_cell(w, h, wet):
    soil = np.asarray(PLOT_IM.crop((30, FUR0, 30 + w, FUR0 + h))).astype(np.float32).copy(); soil[..., :3] *= (0.70 if wet else 1.16)
    yy, xx = np.mgrid[:h, :w]; dx = np.minimum(xx, w - 1 - xx).astype(np.float32); dy = np.minimum(yy, h - 1 - yy).astype(np.float32); r = 6
    c = np.where((dx < r) & (dy < r), r - np.hypot(r - dx, r - dy), np.minimum(dx, dy)); soil[..., 3] = np.where(c > 0.3, 255, 0)
    rim = (c <= 2.2) & (c > 0.3); soil[..., :3] = np.where(rim[..., None], soil[..., :3] * 0.55, soil[..., :3])
    hi = (c > 2.2) & (c <= 3.4) & (yy < h // 2); soil[..., :3] = np.where(hi[..., None], np.minimum(255, soil[..., :3] * 1.18), soil[..., :3])
    return Image.fromarray(np.clip(soil, 0, 255).astype(np.uint8), 'RGBA')
CELL_W, CELL_H = 50, 34
# Beds are built around their planting cells, so the blocks the game waters always sit exactly on the blocks painted here:
# a dark earth patch with the dry cells laid on it in a grid; the bed is as big as its grid plus an even margin.
GAPX, GAPY, MARG = 4, 4, 9
GRID = {'plot1_start': (4, 3), 'plot2': (4, 2), 'plot3': (5, 2), 'plot4': (3, 3)}
def make_bed(cols, rows):
    w = cols * CELL_W + (cols - 1) * GAPX + 2 * MARG; h = rows * CELL_H + (rows - 1) * GAPY + 2 * MARG; PW_ = PLOT_IM.size[0]
    a = np.zeros((h, w, 4), np.float32); soil = np.asarray(PLOT_IM.crop((18, FUR0, PW_ - 18, FUR0 + FPER))).astype(np.float32); sw = soil.shape[1]
    for y in range(0, h, FPER):
        for x in range(0, w, sw): hh_, ww_ = min(FPER, h - y), min(sw, w - x); a[y:y + hh_, x:x + ww_] = soil[:hh_, :ww_]
    a[..., :3] *= 0.56; a[..., 3] = 255
    yy, xx = np.mgrid[:h, :w]; dx = np.minimum(xx, w - 1 - xx).astype(np.float32); dy = np.minimum(yy, h - 1 - yy).astype(np.float32); r = 11
    c = np.where((dx < r) & (dy < r), r - np.hypot(r - dx, r - dy), np.minimum(dx, dy)); a[..., 3] = np.where(c > 0.5, 255, 0); a[..., :3] = np.where(((c <= 2.4) & (c > 0.5))[..., None], a[..., :3] * 0.7, a[..., :3])
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA'); cell = make_cell(CELL_W, CELL_H, False); cells = []
    for r_ in range(rows):
        for c_ in range(cols): x = MARG + c_ * (CELL_W + GAPX); y = MARG + r_ * (CELL_H + GAPY); im.alpha_composite(cell, (x, y)); cells.append((x + CELL_W // 2, y + CELL_H // 2))
    return im, cells
PLOT_RECTS = []; PLOT_CELLS = {}
for k_, v in S['plots'].items():
    x0, y0, x1, y1 = v['rect']; cols_, rows_ = GRID.get(k_, (4, 2)); pim, cells_ = make_bed(cols_, rows_); bx_ = int((x0 + x1) / 2 * U - pim.width / 2); by_ = int((y0 + y1) / 2 * U - pim.height / 2)
    FLAT.append((pim, bx_, by_, 'plot')); PLOT_RECTS.append((bx_, by_, pim.width, pim.height)); PLOT_CELLS[k_] = [[bx_ + cx_, by_ + cy_] for cx_, cy_ in cells_]
    _px, _py, _pw, _ph = PLOT_RECTS[-1]; _r = np.random.RandomState(_px + _py)
    tx_ = _px + 10
    while tx_ < _px + _pw - 8: OB.append((_py + _ph + _r.uniform(1, 4), tx_, spr('grass', scale=float(_r.choice([0.55, 0.7, 0.82])), flip=_r.rand() < 0.5, tone='tuft'), 'tuft')); tx_ += _r.uniform(26, 52)
    ty_ = _py + 26
    while ty_ < _py + _ph - 4:
        for sx_ in (_px + 1, _px + _pw - 1): OB.append((ty_ + _r.uniform(-4, 4), sx_ + _r.uniform(-2, 2), spr('grass', scale=float(_r.choice([0.55, 0.7])), flip=_r.rand() < 0.5, tone='tuft'), 'tuft'))
        ty_ += _r.uniform(30, 48)
# the round stone pad is the base of the energy converter; the machine has no picture yet, and a bare stone disc on the lawn explains nothing, so it is left out for now
add('shed', *S['doors']['shed'], scale=0.85); add('hut', *S['doors']['friend_hut'])          # a shed is tapped, not entered: it may be smaller than a house
bt = S['big_tree']; add('oak', bt[0], bt[1] + 1.7, h=274, tone='mid')
# lanterns: the two that stood at the old, smaller forecourt move out to the corners of the terrace
for x, y in S['lamps']:
    if abs(y - 11.1) < 0.3 and 15 < x < 24: x = DX - 1.75 if x < DX else DX + 1.75; y = 11.7       # the pair at the door: one each side of the path
    if abs(x - 36.7) < 0.2 and abs(y - 9.1) < 0.2: x, y = 36.2, 9.6                                # this one stood on the yard fence: moved onto the grass by the trail
    add('lamp', x, y, h=88)
add('pillar', 47.0, 14.2); add('pillar', 47.0, 18.0)                 # one each side of the main road, at the east end
add('mailbox', DX + 1.25, 13.95); add('board', DX - 3.15, 12.75)          # the house grows to the right (256 -> 427 px wide): the sign stands on the front lawn left of the door path, clear of every size of the house
for x, y in S['signs']:
    if x > 45 and 13 < y < 15: x, y = 45.6, 18.1                       # the east sign stood on the fence corner: now south of the road, before the pillar
    add('sign', x, y)
for x, y in S['benches']: add('bench', x, y)
add('well', S['well'][0], S['well'][1] + 0.3)
fx, fy = S['campfire']
_ys, _xs = np.where(sand[int(8.6 * U):int(12.4 * U), int(7.2 * U):int(12.2 * U)])
ccx, ccy = (_xs.mean() + 7.2 * U) / U, (np.percentile(_ys, 30) + 8.6 * U) / U                   # centre of the round part of the clearing
add('firepit', ccx, ccy + 0.55, scale=1.5); add('logSeatL', ccx - 1.15, ccy + 1.15, scale=1.55); add('logSeatR', ccx + 1.15, ccy + 1.15, scale=1.55)
add('crate', 27.55, S['doors']['shed'][1] + 0.05, h=36); add('scarecrow', 26.55, 20.6)             # the crate stands against the shed; the scarecrow stands beside the bed, not in it             # the shipping crate stands against the shed, left of its door
# the friend's yard: fence all round, an open gate at the path
fx0, fy0, fx1, fy1 = S['friend_yard']; gx = S['friend_yard_gate'][0]
FH = spr('fenceH'); HALF = FH.crop((0, 0, 53, FH.height)); STEP = 87
def put(im, left, foot, name): OB.append((foot, left + im.width / 2, im, name))
def run_h(left, foot, n):                                  # n whole sections in a row, sharing posts; returns the x where it ends
    for k in range(n): put(FH, left + k * STEP, foot, 'fenceH')
    return left + (n - 1) * STEP + FH.width
def run_v(xc, top_foot, bottom_foot):                      # a side of the yard, from the bottom corner up to the top corner
    fv = spr('fenceV'); y = bottom_foot
    while y - fv.height > top_foot - 34: put(fv, xc - fv.width / 2, y, 'fenceV'); y -= 62
    put(fv, xc - fv.width / 2, top_foot - 30 + fv.height, 'fenceV')
YL, YT, YB = fx0 * U, (fy0 + 0.2) * U, fy1 * U; YR = run_h(YL, YT, 4)                              # top side: 4 sections = 358 px
put(FH, YL, YB, 'fenceH'); put(HALF, YL + STEP, YB, 'fenceH')                                      # bottom side, left of the gate: 140 px
put(HALF, YR - 140, YB, 'fenceH'); put(FH, YR - FH.width, YB, 'fenceH')                            # bottom side, right of the gate
run_v(YL + 5, YT, YB); run_v(YR - 5, YT, YB)
def gate_shut(width):                                   # hinge post + a leaf swung shut, made from the open-gate picture by sliding its columns back level
    gs = np.asarray(spr('gate')); post = gs[:, :13]; leaf = gs[:, 13:]; lw = leaf.shape[1]; drop = 11; flat = np.zeros((gs.shape[0] + drop, lw, 4), np.uint8)
    for x in range(lw): d_ = int(round(drop * x / (lw - 1))); flat[d_:d_ + gs.shape[0], x] = leaf[:, x]
    ys = np.where(flat[..., 3].any(1))[0]; flat = flat[ys.min():ys.max() + 1]
    lf = Image.fromarray(flat, 'RGBA').resize((width - 13, flat.shape[0]), Image.NEAREST); out = Image.new('RGBA', (width, gs.shape[0]), (0, 0, 0, 0))
    out.paste(lf, (13, gs.shape[0] - lf.height - 2)); out.alpha_composite(Image.fromarray(post, 'RGBA'), (0, 0)); return out
GATE_L, GATE_R = YL + 140 - 11, YR - 140 + 11                     # hinge posts cover the two fence ends
half_w = int(round((GATE_R - GATE_L) / 2)); gl = gate_shut(half_w); put(gl, GATE_L, YB + 1, 'gateShut'); put(gl.transpose(Image.FLIP_LEFT_RIGHT), GATE_R - half_w, YB + 1, 'gateShut')
# the three closed ways of this chapter
add('logs', 3.2, 16.3, scale=0.85); add('logs', 2.8, 17.5, scale=0.85); add('thicket', 12, 30.4)
lg = LIBS[2]; r_ = lg[1]['gate']; lk = lg[0].crop((r_[0], r_[1], r_[0] + r_[2], r_[1] + r_[3])); lk = lk.resize((round(lk.width * 0.62), round(lk.height * 0.62)), Image.LANCZOS)
_r = np.where(sand[int(3.9 * U), 1200:1600])[0] + 1200; NGX, NGY = (_r.min() + _r.max() + 1) / 2.0, 3.9 * U; put(lk, NGX - lk.width / 2, NGY, 'lockgate')      # measured on the painted road at the fence line
LEFT_END = NGX - lk.width / 2 + 6 - (FH.width + STEP); run_h(LEFT_END, NGY - 1, 2); run_h(NGX + lk.width / 2 - 6, NGY - 1, 3)
# a fence that just stops on open grass can be walked round too: each end runs into a clump of trees
add('clump', (LEFT_END - 62) / U, (NGY + 22) / U, tone='mid'); add('clump', (NGX + lk.width / 2 - 6 + FH.width + 2 * STEP + 50) / U, (NGY + 22) / U, tone='deep', flip=True)

# ---------- where trees may not stand ----------
keep = np.zeros((H, W), bool)
def box(x0, y0, x1, y1): keep[max(0, int(y0 * U)):int(y1 * U), max(0, int(x0 * U)):int(x1 * U)] = True
lot = S['house']['lot']; box(lot[0], lot[1], lot[2], lot[3] + 2.2)                # the house lot stays open for the bigger houses to come
for v in S['plots'].values(): box(v['rect'][0] - 0.6, v['rect'][1] - 2.4, v['rect'][2] + 0.6, v['rect'][3] + 0.4)
box(27.2, 8.0, 33.6, 13.6); box(fx0 - 0.4, fy0 - 0.9, fx1 + 0.8, fy1 + 0.9)       # shed · the friend's yard and its fence line
box(DX - 4.4, 10.0, DX + 4.4, 14.1)                                               # nothing grows on the way to the front door
box(bt[0] - 4.6, bt[1] - 5.5, bt[0] + 4.6, bt[1] + 2.6)                           # under the old oak
box(28.0, 3.0, 43.0, 4.3)                                                         # along the north fence
box(fx - 3, fy - 1.5, fx + 3, fy + 2)                                             # the camp
trunk_block = dil(sand, 13) | dil(water, 27) | dil(rock, 17) | keep
water_d = dil(water, 7)
PROPS = [(o[1] / U, o[0] / U) for o in OB if o[3] not in ('house', 'shed', 'hut', 'oak')]

# ---------- trees: where the AI reference has them, in its sizes ----------
ref = np.asarray(Image.open('/home/claude/r2/g4.png').convert('RGB'))               # 1536x1024, 32 px per plan tile
bl = cv2.GaussianBlur(ref, (0, 0), 5); rh = cv2.cvtColor(bl, cv2.COLOR_RGB2HSV)
crown = ((rh[..., 0] > 40) & (rh[..., 0] < 88) & (rh[..., 1] > 120) & (rh[..., 2] < 172)).astype(np.uint8)
crown = cv2.morphologyEx(crown, cv2.MORPH_CLOSE, np.ones((9, 9))); crown = cv2.morphologyEx(crown, cv2.MORPH_OPEN, np.ones((13, 13)))
dist = cv2.GaussianBlur(cv2.distanceTransform(crown, cv2.DIST_L2, 5), (0, 0), 2)
peaks = (dist >= cv2.dilate(dist, np.ones((25, 25))) - 1e-4) & (dist > 10)
n, lab, st, cen = cv2.connectedComponentsWithStats(peaks.astype(np.uint8), connectivity=8)
ref_trees = []
for i in range(1, n):
    cx, cy = cen[i]; r = float(dist[int(cy), int(cx)]); ref_trees.append((cx / 32, (cy + r * 1.25) / 32, r))
BIG, MID = ['treeA', 'treeB', 'treeC'], ['treeD', 'treeE', 'treeF']
placed = []
def try_tree(x, y, r):
    if r >= 26: name = BIG[rs.randint(3)]; sc = float(np.clip(0.86 + (r - 26) * 0.013, 0.86, 1.12))
    else:       name = MID[rs.randint(3)]; sc = float(np.clip(0.84 + (r - 13) * 0.024, 0.84, 1.15))
    depth = float(np.clip(y / TH, 0, 1)); tone = 'deep' if rs.rand() < 0.36 - 0.2 * depth else ('light' if rs.rand() < 0.32 + 0.2 * depth else 'mid')
    im = spr(name, scale=sc, flip=rs.rand() < 0.5, tone=tone); px, py = int(x * U), int(y * U)
    if not (6 < px < W - 6 and 16 < py < H + 60): return False
    if trunk_block[min(H - 1, py), px]: return False
    bx_ = (slice(max(0, py - im.height), min(H, max(1, py - 14))), slice(max(0, px - im.width // 2), min(W, px + im.width // 2)))
    if water_d[bx_].mean() > 0.03 or sand[bx_].mean() > 0.14 or rock[bx_].mean() > 0.25 or keep[bx_].mean() > 0.30: return False
    hw = im.width / 2 / U
    if any(np.hypot(x - a, (y - b) * 1.5) < (hw + c) * 0.74 for a, b, c in placed): return False
    if any(abs(x - a) < hw + 0.5 and -0.5 < y - b < im.height / U * 0.85 for a, b in PROPS): return False
    OB.append((py, px, im, name)); placed.append((x, y, hw)); return True
small, nudged, lost = [], 0, 0
for x, y, r in sorted(ref_trees, key=lambda t: -t[2]):
    if r < 13: small.append((x, y)); continue
    if try_tree(x, y, r): continue
    for _ in range(30):
        if try_tree(x + rs.uniform(-1.1, 1.1), y + rs.uniform(-0.9, 0.9), r): nudged += 1; break
    else: lost += 1
def free_small(x, y):
    px, py = int(x * U), int(y * U); return 0 <= px < W and 0 <= py < H and not trunk_block[py, px]
for x, y in small:
    if free_small(x, y): add(rs.choice(['bushBig', 'bushLow', 'bushBloom']), x, y, tone='mid', flip=rs.rand() < 0.5)
for x, y, hw in placed:
    if rs.rand() < 0.6:
        bx2, by2 = x + rs.choice([-1, 1]) * rs.uniform(0.5, hw + 0.4), y + rs.uniform(0.05, 0.45)
        if free_small(bx2, by2):
            kind = rs.choice(['bushLow', 'bushBloom', 'mushroom', 'rockS', 'log', 'stump', 'flowerW', 'flowerR', 'grass'])
            add(kind, bx2, by2, flip=rs.rand() < 0.5, tone='mid' if kind.startswith('bush') else None, scale=0.7 if kind in ('stump', 'log') else 1.0)

# ---------- flowers: none are painted into the ground any more (they were 20-31 px across, far too big beside a 64-px character),
#            so small flower pieces are scattered by rule: in little groups, mostly beside trees, bushes, fences and things, a few in the open lawn
fl_rs = np.random.RandomState(77); clusters = []; tries = 0; n_fl = 0
anchors = [(o[1] / U, o[0] / U) for o in OB if o[3] != 'tuft']
def lawn_ok(x, y):
    px, py = int(x * U), int(y * U); return 8 <= px < W - 8 and 8 <= py < H - 8 and free_small(x, y) and not sand[py, px] and not water[py, px] and not cv2.dilate(sand[max(0, py - 6):py + 7, max(0, px - 6):px + 7].astype(np.uint8), np.ones((3, 3))).any()
while len(clusters) < 60 and tries < 8000:
    tries += 1
    if fl_rs.rand() < 0.72: ax, ay = anchors[fl_rs.randint(len(anchors))]; x = ax + fl_rs.uniform(-1.6, 1.6); y = ay + fl_rs.uniform(-0.1, 1.2)
    else: x = fl_rs.uniform(1, W / U - 1); y = fl_rs.uniform(1, H / U - 1)
    if not lawn_ok(x, y) or any((x - cx) ** 2 + (y - cy) ** 2 < 1.7 ** 2 for cx, cy in clusters): continue
    clusters.append((x, y)); kind = str(fl_rs.choice(['flowerW', 'flowerY', 'flowerR'], p=[0.45, 0.35, 0.20]))
    for _ in range(fl_rs.randint(2, 5)):
        fx, fy = x + fl_rs.uniform(-0.45, 0.45), y + fl_rs.uniform(-0.3, 0.3)
        if lawn_ok(fx, fy): add(kind if fl_rs.rand() < 0.8 else str(fl_rs.choice(['flowerW', 'flowerY', 'flowerR'])), fx, fy, flip=fl_rs.rand() < 0.5, scale=float(fl_rs.choice([0.8, 1.0]))); n_fl += 1
FLOWER_STATS = {'groups': len(clusters), 'flowers': n_fl}

# ---------- flat pieces onto the ground ----------
base = ground.copy()
for im, x, y, nm in FLAT: base.alpha_composite(im, (x, y))
flat_mask = np.zeros((H, W), bool)
for im, x, y, nm in FLAT: flat_mask[y:y + im.height, x:x + im.width] |= np.asarray(im)[..., 3] > 0

# ---------- grounding (same as the tested piece): dark hard patch at the foot, shade under crowns, grass tufts over the foot ----------
SMALL = ('flowerW', 'flowerY', 'flowerR', 'grass', 'mushroom', 'tuft')
def foot_of(im, nm):
    a = np.asarray(im)[..., 3] > 0; hgt = a.shape[0]; rows = max(3, int(hgt * (0.08 if (nm.startswith('tree') or nm in ('clump', 'oak')) else 0.30)))
    xs = np.where(a[hgt - rows:].any(0))[0]; return (int(xs.min()), int(xs.max()) + 1) if len(xs) else (0, im.width)
SUN_SX, SUN_SY, CAST_A, FOOT_A = 0.43, 0.36, 0.34, 0.30          # 10:00 on a sunny day, the values of sun(10) in the demo
# real height above the ground, in px, of everything that lies or squats (anything not listed stands upright and casts a tipped-over shadow)
LOW_H = {'logSeatL': 9, 'logSeatR': 9, 'log': 7, 'logs': 15, 'firepit': 7, 'rockS': 6, 'rockM': 10, 'stump': 10, 'pad': 4,
         'bush': 13, 'bushFlower': 13, 'bushBig': 13, 'bushLow': 9, 'bushBloom': 11, 'thicket': 16,
         'crate': 13, 'bench': 12, 'well': 16, 'house': 26, 'shed': 22, 'hut': 22}
LOW_A = 0.40
low = np.zeros((H, W), np.float32)
SHADE = np.array([18, 28, 58], np.float32)
cast = np.zeros((H, W), np.float32); footm = np.zeros((H, W), np.float32)
FEET = []
for by, bx, im, nm in OB:
    if nm in SMALL: continue
    w_, hgt = im.size; x0 = bx - w_ / 2; f0, f1 = foot_of(im, nm); fw = f1 - f0; cx = x0 + (f0 + f1) / 2
    if nm in LOW_H:
        dx_, dy_ = int(round(SUN_SX * LOW_H[nm])), int(round(SUN_SY * LOW_H[nm])) + 1; al_ = np.asarray(im)[..., 3].astype(np.float32) / 255.0
        if nm in ('house', 'shed', 'hut'): dy_ = 1
        X0, Y0 = int(x0) + dx_, int(by - hgt) + dy_; ys0, xs0 = max(0, Y0), max(0, X0); ys1, xs1 = min(H, Y0 + hgt), min(W, X0 + w_)
        if ys1 > ys0 and xs1 > xs0: low[ys0:ys1, xs0:xs1] = np.maximum(low[ys0:ys1, xs0:xs1], al_[ys0 - Y0:ys1 - Y0, xs0 - X0:xs1 - X0])
        FEET.append((by, cx, fw, im, nm)); continue
    # cast shadow: output (X, Y) -> sprite (u, v):  v = (by + SY*h - Y) / SY ,  u = X - x0 - SX*(h - v)
    ow, oh = int(w_ + SUN_SX * hgt) + 3, int(SUN_SY * hgt) + 3; X0, Y0 = int(x0) - 1, int(by) - 1
    a_ = Image.fromarray(np.asarray(im)[..., 3], 'L')
    coef = (1, -SUN_SX / SUN_SY, -x0 + SUN_SX * by / SUN_SY + X0 - (SUN_SX / SUN_SY) * Y0, 0, -1 / SUN_SY, by / SUN_SY + hgt - Y0 / SUN_SY)
    sh_ = np.asarray(a_.transform((ow, oh), Image.AFFINE, coef, resample=Image.BILINEAR), np.float32) / 255.0
    ys0, xs0 = max(0, Y0), max(0, X0); ys1, xs1 = min(H, Y0 + oh), min(W, X0 + ow)
    if ys1 > ys0 and xs1 > xs0: cast[ys0:ys1, xs0:xs1] = np.maximum(cast[ys0:ys1, xs0:xs1], sh_[ys0 - Y0:ys1 - Y0, xs0 - X0:xs1 - X0])
    rw = fw * 0.5 + max(3, fw * 0.12); rh2 = min(8.0, max(3.0, fw * 0.13)) + 1
    cv2.ellipse(footm, (int(round(cx + 1.5)), int(round(by - 1))), (int(round(rw)), int(round(rh2))), 0, 0, 360, 1.0, -1)
    FEET.append((by, cx, fw, im, nm))
cast = cv2.GaussianBlur(cast, (0, 0), 2.2); footm = cv2.GaussianBlur(footm, (0, 0), 1.8); low = cv2.GaussianBlur(low, (0, 0), 1.5)
cast[water > 0] = 0; footm[water > 0] = 0; low[water > 0] = 0            # nothing darkens open water
gg = np.asarray(base).astype(np.float32)
for layer, alpha in ((cast, CAST_A), (footm, FOOT_A), (low, LOW_A)):
    k_ = (layer * alpha)[..., None]; gg[..., :3] = gg[..., :3] * (1 - k_) + SHADE * k_
out = Image.fromarray(np.clip(gg, 0, 255).astype(np.uint8), 'RGBA')
grass_here = lambda x, y: 0 <= int(x) < W and 0 <= int(y) < H and (35 < h_[int(y), int(x)] < 75) and s_[int(y), int(x)] > 110 and not sand[int(y), int(x)] and not water[int(y), int(x)] and not rock[int(y), int(x)] and not flat_mask[int(y), int(x)]
for by, cx, fw, im, nm in FEET:
    n_t = 3 if (fw > 46 and im.height > 50) else 2 if fw > 12 else 1
    t_sc = min([0.42, 0.55, 0.7, 0.82, 0.95], key=lambda q: abs(q - float(np.clip(0.30 * im.height / 24.0, 0.42, 0.95))))
    spots = [cx - fw * 0.42, cx + fw * 0.42, cx + rs.uniform(-0.12, 0.12) * fw][:n_t] if n_t > 1 else [cx + rs.choice([-1, 1]) * (fw * 0.5 + 2)]
    for tx in spots:
        ty = by + rs.uniform(1.5, 4.0)
        if not grass_here(tx, min(H - 1, ty)): continue
        OB.append((ty, tx + rs.uniform(-2, 2), spr('grass', scale=t_sc if rs.rand() < 0.6 else max(0.42, t_sc - 0.13), flip=rs.rand() < 0.5, tone='tuft'), 'tuft'))
TAP = ('board', 'crate', 'mailbox')
def with_marker(im):
    a = np.asarray(im); pad = 2; hh, ww = a.shape[:2]; big = np.zeros((hh + 2 * pad, ww + 2 * pad, 4), np.uint8); big[pad:pad + hh, pad:pad + ww] = a
    al = (big[..., 3] > 0).astype(np.uint8); ring = (cv2.dilate(al, np.ones((3, 3), np.uint8)) > 0) & (al == 0)
    big[ring] = (255, 226, 120, 235); return Image.fromarray(big, 'RGBA'), pad
def sparkle(img, x, y, r=3):
    px = img.load()
    for d_ in range(-r, r + 1):
        for (xx, yy) in ((x + d_, y), (x, y + d_)):
            if 0 <= xx < W and 0 <= yy < H: px[xx, yy] = (255, 250, 214, 255) if abs(d_) < r else (255, 226, 120, 255)
    px[x, y] = (255, 255, 255, 255)
SPARK = []
for by, bx, im, nm in sorted(OB, key=lambda o: o[0]):
    if nm in TAP:
        im2, pad = with_marker(im); out.alpha_composite(im2, (int(bx - im.width / 2) - pad, int(by - im.height) - pad))
        SPARK += [(int(bx - im.width / 2) - 5, int(by - im.height) + 3, 3), (int(bx + im.width / 2) + 4, int(by - im.height) - 4, 2)]
    else: out.alpha_composite(im, (int(bx - im.width / 2), int(by - im.height)))
for x_, y_, r_ in SPARK: sparkle(out, x_, y_, r_)
out.convert('RGB').save(OUT)

kinds = collections.Counter(o[3] for o in OB)
# ---------- 60/30/10 of the scene by area: open ground / scenery that gives it shape / places where something happens ----------
scen = np.zeros((H, W), bool); act = np.zeros((H, W), bool)
for by, bx, im, nm in OB:
    x0, y0 = int(bx - im.width / 2), int(by - im.height); a = np.asarray(im)[..., 3] > 0
    ys, xs = np.where(a); ys = ys + y0; xs = xs + x0; okk = (ys >= 0) & (ys < H) & (xs >= 0) & (xs < W)
    tgt = act if nm in ('house', 'shed', 'hut', 'crate', 'mailbox', 'board', 'well', 'firepit', 'logSeatL', 'logSeatR', 'bench', 'scarecrow', 'oak') else scen
    if nm in SMALL: continue
    tgt[ys[okk], xs[okk]] = True
for im, x, y, nm in FLAT: act[y:y + im.height, x:x + im.width] |= np.asarray(im)[..., 3] > 0
scen |= water | rock; scen &= ~act
print(json.dumps({'lawn_hue_and_brightness': LAWN, 'tuft_tone': TONES['tuft'], 'flowers': FLOWER_STATS, 'size': [W, H], 'reference_tree_points': len(ref_trees), 'trees': sum(v for k, v in kinds.items() if k.startswith('tree')), 'nudged': nudged, 'no_room': lost,
                  'bushes': sum(v for k, v in kinds.items() if k.startswith('bush')), 'tufts': kinds['tuft'], 'pieces': len(OB), 'flat': len(FLAT),
                  'area_%': {'open ground': round(100 * float((~scen & ~act).mean()), 1), 'scenery': round(100 * float(scen.mean()), 1), 'activity places': round(100 * float(act.mean()), 1)}}))

if len(sys.argv) > 3:
    import os
    ex = sys.argv[3]; os.makedirs(ex, exist_ok=True)
    base.convert('RGB').save(ex + '/ground_plain.png'); Image.fromarray(gg.astype(np.uint8), 'RGBA').convert('RGB').save(ex + '/ground.png')
    uniq = {}; order = []
    for by, bx, im, nm in OB:
        if id(im) not in uniq: uniq[id(im)] = len(order); order.append((im, nm))
    aw = 1024; x = y = rowh = 0; rect = {}
    for im, nm in sorted(order, key=lambda o: -o[0].height):
        if x + im.width + 1 > aw: x = 0; y += rowh + 1; rowh = 0
        rect[id(im)] = [x, y, im.width, im.height]; x += im.width + 1; rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (aw, y + rowh), (0, 0, 0, 0))
    for im, nm in order: atlas.paste(im, tuple(rect[id(im)][:2]))
    atlas.save(ex + '/sprites.png', optimize=True)
    level = lambda nm: 'high' if nm in ('treeA', 'treeB', 'treeC', 'clump', 'oak') else 'small' if nm in ('treeD', 'treeE', 'treeF') else 'mid' if nm.startswith('bush') or nm == 'thicket' else 'low'
    inst = [{'n': nm, 'lv': level(nm), 'r': rect[id(im)], 'x': int(bx - im.width / 2), 'y': int(by - im.height), 'by': int(by), 'f': [int(foot_of(im, nm)[0]), int(foot_of(im, nm)[1] - foot_of(im, nm)[0])], 'sh': 0 if nm in SMALL else 1, 'hz': LOW_H.get(nm, 0)}
            for by, bx, im, nm in sorted(OB, key=lambda o: o[0])]
    make_cell(CELL_W, CELL_H, False).save(ex + '/cell.png'); make_cell(CELL_W, CELL_H, True).save(ex + '/cell_wet.png')
    json.dump({'w': W, 'h': H, 'inst': inst, 'plots': PLOT_RECTS, 'cells': PLOT_CELLS, 'fper': FPER, 'ptop': MARG, 'pside': MARG, 'door_x': DX * U, 'house_base': 10.15 * U}, open(ex + '/scene.json', 'w'))
    print(json.dumps({'export': ex, 'unique_sprites': len(order), 'instances': len(inst), 'atlas': list(atlas.size)}))
