# compose_piece2.py — ชิ้นล่างซ้ายของ G9 รอบ 3: พื้นที่ AI วาด + ต้นไม้ชุดใหม่ (objects-3) + ของแยกชิ้น (objects-1/2)
# ใช้: python3 compose_piece2.py [seed]
import numpy as np, cv2, json, sys
from PIL import Image, ImageDraw, ImageFilter

U = 40                                   # world px per plan tile
X0, Y0, TW, TH = 0, 14, 27, 18
S = json.load(open('/home/claude/g9/map-G9-spec.json'))
rs = np.random.RandomState(int(sys.argv[1]) if len(sys.argv) > 1 else 5)
K = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0      # tree size factor: 1.0 = big 176 / medium 126 px; 0.75 = the sizes the AI reference uses in this world

ground = Image.open('/home/claude/gt/in/g0.png').convert('RGB').resize((TW*U, TH*U), Image.LANCZOS).convert('RGBA')
W, H = ground.size
LIBS = [(Image.open(p + '.png').convert('RGBA'), json.load(open(p + '.json'))) for p in
        ((sys.argv[4] if len(sys.argv) > 4 else '/home/claude/lib3/objects-3'), '/home/claude/lib2/objects-2', '/home/claude/v108/objects-1')]

# leaf tones, target = whole crowns of the AI reference: hue 63.9, brightness p10/50/90 = 58/127/195
TONES = {'deep': (65.0, 64, 122, 190), 'mid': (63.5, 70, 134, 204), 'light': (61.5, 78, 146, 214)}
def regrade(im, tone):
    hue, lo, mid, hi = TONES[tone]
    a = np.asarray(im).copy(); al = a[..., 3] > 0
    hsv = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2HSV).astype(np.float32)
    leaf = al & (hsv[..., 0] > 30) & (hsv[..., 0] < 90) & (hsv[..., 1] > 80)
    if leaf.sum() < 50: return im
    p10, p50, p90 = np.percentile(hsv[..., 2][leaf], [10, 50, 90])
    newv = np.interp(hsv[..., 2], [0, p10, p50, p90, 255], [0, lo, mid, hi, min(255, hi + 20)])
    hsv[..., 2] = np.where(leaf, newv, hsv[..., 2])
    hsv[..., 0] = np.where(leaf, hsv[..., 0] + (hue - hsv[..., 0][leaf].mean()), hsv[..., 0])
    a[..., :3] = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB)
    return Image.fromarray(a, 'RGBA')

_c = {}
def spr(n, scale=1.0, h=None, flip=False, tone=None):
    key = (n, round(scale, 3), h, flip, tone)
    if key not in _c:
        src, P = next((s_, p_) for s_, p_ in LIBS if n in p_)
        x, y, w, hh = P[n]; im = src.crop((x, y, x + w, y + hh))
        if tone: im = regrade(im, tone)
        if h: scale = h / im.height
        if scale != 1: im = im.resize((max(2, round(im.width * scale)), max(2, round(im.height * scale))), Image.LANCZOS)
        _c[key] = im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
    return _c[key]

OB = []
def add(n, tx, ty, **k): OB.append(((ty - Y0) * U, (tx - X0) * U, spr(n, **k), n))

# keep-out, measured on the painted ground itself
g = np.asarray(ground.convert('RGB')); hsv = cv2.cvtColor(g, cv2.COLOR_RGB2HSV)
h_, s_, v_ = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
op = lambda m, k: cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k))) > 0
dil = lambda m, k: cv2.dilate(m.astype(np.uint8), np.ones((k, k))) > 0
sand = op((h_ >= 14) & (h_ <= 31) & (s_ > 55) & (s_ < 200) & (v_ > 175), 7)
water = op((h_ > 88) & (h_ < 125) & (s_ > 90) & (v_ > 120), 5)
rock = op((s_ < 50) & (v_ > 90) & (v_ < 215), 9)
trunk_block = dil(sand, 13) | dil(water, 27) | dil(rock, 17)
water_d = dil(water, 7)

PROPS = [(3.0, 17.5), (12, 30.2), (S['well'][0], S['well'][1])] + [tuple(b) for b in S['benches']] + [tuple(l) for l in S['lamps']] + [tuple(q) for q in S['signs']]
BIG, MID = ['treeA', 'treeB', 'treeC'], ['treeD', 'treeE', 'treeF']
placed = []                                # (x, y, crown half-width in tiles)
def try_tree(x, y, r):
    if r >= 26:   name = BIG[rs.randint(3)]; sc = float(np.clip(0.86 + (r - 26) * 0.013, 0.86, 1.12))
    else:         name = MID[rs.randint(3)]; sc = float(np.clip(0.84 + (r - 13) * 0.024, 0.84, 1.15))
    sc *= K
    depth = float(np.clip((y - Y0) / TH, 0, 1))
    tone = 'deep' if rs.rand() < 0.36 - 0.2 * depth else ('light' if rs.rand() < 0.32 + 0.2 * depth else 'mid')
    im = spr(name, scale=sc, flip=rs.rand() < 0.5, tone=tone)
    px, py = int((x - X0) * U), int((y - Y0) * U)
    if not (6 < px < W - 6 and 16 < py < H + 60): return False
    if trunk_block[min(H - 1, py), px]: return False
    box = (slice(max(0, py - im.height), min(H, max(1, py - 14))), slice(max(0, px - im.width // 2), min(W, px + im.width // 2)))
    if water_d[box].mean() > 0.03 or sand[box].mean() > 0.14 or rock[box].mean() > 0.25: return False
    hw = im.width / 2 / U
    if any(np.hypot(x - a, (y - b) * 1.5) < (hw + c) * 0.74 for a, b, c in placed): return False
    if any(abs(x - a) < hw + 0.5 and -0.5 < y - b < im.height / U * 0.85 for a, b in PROPS): return False
    OB.append((py, px, im, name)); placed.append((x, y, hw)); return True

ref_trees = [(cx / 32 + X0, (cy + r * 1.25) / 32 + Y0, r) for cx, cy, r in np.load('/home/claude/gt/ref_trees.npy')]
small, nudged, lost = [], 0, 0
for x, y, r in sorted(ref_trees, key=lambda t: -t[2]):
    if r < 13: small.append((x, y)); continue
    if try_tree(x, y, r): continue
    for _ in range(30):
        if try_tree(x + rs.uniform(-1.1, 1.1), y + rs.uniform(-0.9, 0.9), r): nudged += 1; break
    else: lost += 1

# bushes: where the reference has its small crowns, and a few at the foot of the trees
def free_small(x, y):
    px, py = int((x - X0) * U), int((y - Y0) * U)
    return 0 <= px < W and 0 <= py < H and not trunk_block[py, px]
for x, y in small:
    if free_small(x, y): add(rs.choice(['bushBig', 'bushLow', 'bushBloom']), x, y, tone='mid', flip=rs.rand() < 0.5)
for x, y, hw in placed:
    if rs.rand() < 0.6:
        bx, by = x + rs.choice([-1, 1]) * rs.uniform(0.5, hw + 0.4), y + rs.uniform(0.05, 0.45)
        if free_small(bx, by):
            kind = rs.choice(['bushLow', 'bushBloom', 'mushroom', 'rockS', 'log', 'stump', 'flowerW', 'flowerR', 'grass'])
            add(kind, bx, by, flip=rs.rand() < 0.5, tone='mid' if kind.startswith('bush') else None, scale=0.7 if kind in ('stump', 'log') else 1.0)   # foot-of-tree decor sized to the trees

# props of this piece
inside = lambda x, y: X0 - 0.5 < x < X0 + TW + 0.5 and Y0 - 0.2 < y < Y0 + TH + 1
for x, y in S['lamps']:
    if inside(x, y): add('lamp', x, y, h=88)
add('well', S['well'][0], S['well'][1] + 0.3)
for x, y in S['benches']:
    if inside(x, y): add('bench', x, y)
for x, y in S['signs']:
    if inside(x, y): add('sign', x, y)
add('logs', 3.2, 16.7); add('logs', 2.8, 18.3); add('thicket', 12, 30.2)

# shadows: light from the upper left of the painted ground -> cast shadow to the lower right + dark contact at the foot
out = ground.copy(); cast = Image.new('L', (W, H), 0); contact = Image.new('L', (W, H), 0)
dc, dk = ImageDraw.Draw(cast), ImageDraw.Draw(contact)
for by, bx, im, nm in OB:
    tree = nm.startswith('tree') or nm == 'clump'
    rw = im.width * (0.36 if tree else 0.42); rh = max(4, im.height * (0.10 if tree else 0.13)); off = im.height * (0.09 if tree else 0.05)
    dc.ellipse((bx - rw + off, by - rh + off * 0.35, bx + rw + off, by + rh + off * 0.35), fill=115 if tree else 92)
    dk.ellipse((bx - rw * 0.42, by - rh * 0.42, bx + rw * 0.42, by + rh * 0.42), fill=118)
shade = np.maximum(np.asarray(cast.filter(ImageFilter.GaussianBlur(5)), np.float32), np.asarray(contact.filter(ImageFilter.GaussianBlur(2)), np.float32)) / 255.0
gg = np.asarray(out).astype(np.float32); tint = np.array([28, 62, 46], np.float32)
gg[..., :3] = gg[..., :3] * (1 - shade[..., None] * 0.6) + tint * (shade[..., None] * 0.6)
out = Image.fromarray(gg.astype(np.uint8), 'RGBA')
for by, bx, im, nm in sorted(OB, key=lambda o: o[0]): out.alpha_composite(im, (int(bx - im.width / 2), int(by - im.height)))
out.convert('RGB').save(sys.argv[3] if len(sys.argv) > 3 else '/home/claude/gt/piece3_r3.png')
import collections
kinds = collections.Counter(o[3] for o in OB)
print(json.dumps({'reference_points': len(ref_trees), 'trees': sum(v for k, v in kinds.items() if k.startswith('tree')), 'tree_shapes_used': sorted(k for k in kinds if k.startswith('tree')),
                  'nudged': nudged, 'no_room': lost, 'bushes': sum(v for k, v in kinds.items() if k.startswith('bush')), 'objects': len(OB)}))
