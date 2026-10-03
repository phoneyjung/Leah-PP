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
rock = op((s_ < 50) & (v_ > 90) & (v_ < 215), 9)

# ---------- buildings and yard pieces, from the spec ----------
DX = S['doors']['our_house'][0]
house = Image.open('/home/claude/hs/farm-house-1.png').convert('RGBA'); house = house.resize((245, round(313 * 245 / 256)), Image.LANCZOS)
HX = DX * U - 105 * 245 / 256                                           # the door centre sits 105 px from the left of the 256-px picture
OB.append((10.15 * U, HX + 245 / 2, house, 'house'))
TW_, TH_ = 264, 86; FLAT.append((nine('terrace', TW_, TH_, 34), int(DX * U - TW_ / 2), int(10.05 * U), 'terrace'))
for k_, v in S['plots'].items():
    x0, y0, x1, y1 = v['rect']; FLAT.append((nine('plot', int((x1 - x0) * U), int((y1 - y0) * U)), int(x0 * U), int(y0 * U), 'plot'))
cx_, cy_ = S['converter']; pd = spr('pad'); FLAT.append((pd, int(cx_ * U - pd.width / 2), int(cy_ * U - pd.height / 2), 'pad'))
add('shed', *S['doors']['shed'], scale=0.85); add('hut', *S['doors']['friend_hut'])          # a shed is tapped, not entered: it may be smaller than a house
bt = S['big_tree']; add('oak', bt[0], bt[1] + 1.7, h=274, tone='mid')
# lanterns: the two that stood at the old, smaller forecourt move out to the corners of the terrace
for x, y in S['lamps']:
    if abs(y - 11.1) < 0.3 and 15 < x < 24: x = DX - 3.9 if x < DX else DX + 3.9; y = 12.1
    add('lamp', x, y, h=88)
for x, y in S['gate_pillars']: add('pillar', x, y)
add('mailbox', S['mailbox'][0], S['mailbox'][1] - 0.5); add('board', 23.7, 12.3)
for x, y in S['signs']: add('sign', x, y)
for x, y in S['benches']: add('bench', x, y)
add('well', S['well'][0], S['well'][1] + 0.3)
fx, fy = S['campfire']; add('firepit', fx - 0.2, fy + 0.2); add('logSeatL', fx - 1.4, fy + 0.5); add('logSeatR', fx + 1.0, fy + 0.5)
add('crate', S['shipping_bin'][0], S['shipping_bin'][1] + 0.6, h=34); add('scarecrow', 27.7, 20.4)
# the friend's yard: fence all round, an open gate at the path
fx0, fy0, fx1, fy1 = S['friend_yard']; gx = S['friend_yard_gate'][0]; seg = spr('fenceH').width / U
x = fx0
while x < fx1 - 0.3:
    cxs = x + seg / 2; add('fenceH', cxs, fy0 + 0.2)
    if not (gx - 1.5 < cxs < gx + 1.5): add('fenceH', cxs, fy1)
    x += seg
y = fy0 + 1.9
while y < fy1 + 0.1: add('fenceV', fx0, y); add('fenceV', fx1, y); y += 1.75
add('gate', gx - 0.9, fy1); add('gatePost', gx + 0.9, fy1)
# the three closed ways of this chapter
add('logs', 3.2, 16.3, scale=0.85); add('logs', 2.8, 17.5, scale=0.85); add('thicket', 12, 30.4)
lg = LIBS[2]; r_ = lg[1]['gate']; OB.append((3.9 * U, 34.3 * U, lg[0].crop((r_[0], r_[1], r_[0] + r_[2], r_[1] + r_[3])), 'lockgate'))

# ---------- where trees may not stand ----------
keep = np.zeros((H, W), bool)
def box(x0, y0, x1, y1): keep[max(0, int(y0 * U)):int(y1 * U), max(0, int(x0 * U)):int(x1 * U)] = True
lot = S['house']['lot']; box(lot[0], lot[1], lot[2], lot[3] + 2.2)                # the house lot stays open for the bigger houses to come
for v in S['plots'].values(): box(v['rect'][0] - 0.6, v['rect'][1] - 2.4, v['rect'][2] + 0.6, v['rect'][3] + 0.4)
box(27.2, 8.0, 33.6, 13.6); box(fx0 + 0.3, fy0 + 0.3, fx1 - 0.3, fy1 + 0.6)       # shed · inside the friend's yard
box(bt[0] - 4.6, bt[1] - 5.5, bt[0] + 4.6, bt[1] + 2.6)                           # under the old oak
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
core = np.zeros((H, W), np.uint8); rim = np.zeros((H, W), np.uint8); shade_c = np.zeros((H, W), np.uint8)
NOISE = np.kron(np.random.RandomState(77).uniform(-1, 1, (H // 2 + 2, W // 2 + 2)).astype(np.float32), np.ones((2, 2), np.float32))[:H, :W]
def blob(mask, cx, cy, rw, rh, rag):
    x0, x1 = max(0, int(cx - rw * 1.4) - 2), min(W, int(cx + rw * 1.4) + 3); y0, y1 = max(0, int(cy - rh * 1.5) - 2), min(H, int(cy + rh * 1.5) + 3)
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.mgrid[y0:y1, x0:x1]; d = ((xx - cx) / max(1.0, rw)) ** 2 + ((yy - cy) / max(1.0, rh)) ** 2
    mask[y0:y1, x0:x1] |= (d < 1 + NOISE[y0:y1, x0:x1] * rag).astype(np.uint8)
FEET = []
for by, bx, im, nm in OB:
    if nm in SMALL: continue
    x0 = bx - im.width / 2; f0, f1 = foot_of(im, nm); fw = f1 - f0; cx = x0 + (f0 + f1) / 2; tree = nm.startswith('tree') or nm in ('clump', 'oak')
    rw = fw * 0.5 + max(3, fw * 0.12); rh2 = float(np.clip(fw * 0.13, 3.0, 8.0))
    blob(rim, cx + 2.5, by - rh2 * 0.30 + 1.5, rw + 2, rh2 + 1.5, 0.32); blob(core, cx + 1.5, by - rh2 * 0.45 + 0.5, rw * 0.88, rh2 * 0.75, 0.22)
    if tree: cw = im.width * 0.40; ch = max(8, im.width * 0.15); blob(shade_c, bx + 5, by - ch * 0.15 + 2, cw, ch, 0.38)
    FEET.append((by, cx, fw, im, nm))
mult = np.ones((H, W, 3), np.float32); tone_ = lambda f: np.array([f * 0.92, f * 0.98, min(1.0, f * 1.10)], np.float32)
mult[shade_c > 0] = tone_(0.87); mult[rim > 0] = tone_(0.76); mult[core > 0] = tone_(0.58); mult[water > 0] = 1.0
gg = np.asarray(base).astype(np.float32); gg[..., :3] = np.clip(gg[..., :3] * mult, 0, 255); out = Image.fromarray(gg.astype(np.uint8), 'RGBA')
grass_here = lambda x, y: 0 <= int(x) < W and 0 <= int(y) < H and (35 < h_[int(y), int(x)] < 75) and s_[int(y), int(x)] > 110 and not sand[int(y), int(x)] and not water[int(y), int(x)] and not rock[int(y), int(x)] and not flat_mask[int(y), int(x)]
for by, cx, fw, im, nm in FEET:
    n_t = 3 if (fw > 46 and im.height > 50) else 2 if fw > 12 else 1
    t_sc = min([0.42, 0.55, 0.7, 0.82, 0.95], key=lambda q: abs(q - float(np.clip(0.30 * im.height / 24.0, 0.42, 0.95))))
    spots = [cx - fw * 0.42, cx + fw * 0.42, cx + rs.uniform(-0.12, 0.12) * fw][:n_t] if n_t > 1 else [cx + rs.choice([-1, 1]) * (fw * 0.5 + 2)]
    for tx in spots:
        ty = by + rs.uniform(1.5, 4.0)
        if not grass_here(tx, min(H - 1, ty)): continue
        OB.append((ty, tx + rs.uniform(-2, 2), spr('grass', scale=t_sc if rs.rand() < 0.6 else max(0.42, t_sc - 0.13), flip=rs.rand() < 0.5, tone='tuft'), 'tuft'))
for by, bx, im, nm in sorted(OB, key=lambda o: o[0]): out.alpha_composite(im, (int(bx - im.width / 2), int(by - im.height)))
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
print(json.dumps({'size': [W, H], 'reference_tree_points': len(ref_trees), 'trees': sum(v for k, v in kinds.items() if k.startswith('tree')), 'nudged': nudged, 'no_room': lost,
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
    inst = [{'n': nm, 'lv': level(nm), 'r': rect[id(im)], 'x': int(bx - im.width / 2), 'y': int(by - im.height), 'by': int(by), 'f': [int(foot_of(im, nm)[0]), int(foot_of(im, nm)[1] - foot_of(im, nm)[0])], 'sh': 0 if nm in SMALL else 1}
            for by, bx, im, nm in sorted(OB, key=lambda o: o[0])]
    json.dump({'w': W, 'h': H, 'inst': inst}, open(ex + '/scene.json', 'w'))
    print(json.dumps({'export': ex, 'unique_sprites': len(order), 'instances': len(inst), 'atlas': list(atlas.size)}))
