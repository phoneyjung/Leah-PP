# compose_piece2.py — ชิ้นล่างซ้ายของ G9 รอบ 3: พื้นที่ AI วาด + ต้นไม้ชุดใหม่ (objects-3) + ของแยกชิ้น (objects-1/2)
# ใช้: python3 compose_piece2.py [seed]
import numpy as np, cv2, json, sys, collections
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
TONES = {'deep': (65.0, 64, 122, 190), 'mid': (63.5, 70, 134, 204), 'light': (61.5, 78, 146, 214), 'tuft': (46.0, 132, 200, 228)}
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

# ---------- grounding: what makes a thing stand ON the ground instead of floating over it ----------
# Copied from how the AI reference does it (looked at the crisp piece, 2x): (1) a dark, hard-edged patch of the ground's own colour
# hugging the foot, a little wider than the foot and pushed to the lower right (light comes from the upper left); (2) under a tree,
# a wider, lighter patch below the crown; (3) on grass, a few bright grass tufts growing up over the front of the foot.
# No blur and no fixed shadow colour: the ground is multiplied, so a shadow on the road is dark orange and on grass dark green.
SMALL = ('flowerW', 'flowerY', 'flowerR', 'grass', 'mushroom', 'tuft')
def foot_of(im, nm):
    a = np.asarray(im)[..., 3] > 0; hgt = a.shape[0]
    rows = max(3, int(hgt * (0.08 if (nm.startswith('tree') or nm == 'clump') else 0.30)))
    xs = np.where(a[hgt - rows:].any(0))[0]
    return (int(xs.min()), int(xs.max()) + 1) if len(xs) else (0, im.width)
core = np.zeros((H, W), np.uint8); rim = np.zeros((H, W), np.uint8); shade_c = np.zeros((H, W), np.uint8)
_n = np.random.RandomState(77).uniform(-1, 1, (H // 2 + 2, W // 2 + 2)).astype(np.float32)
NOISE = np.kron(_n, np.ones((2, 2), np.float32))[:H, :W]                    # 2-px blocks: edges break up in pixel-art steps
def blob(mask, cx, cy, rw, rh, rag):
    x0, x1 = max(0, int(cx - rw * 1.4) - 2), min(W, int(cx + rw * 1.4) + 3); y0, y1 = max(0, int(cy - rh * 1.5) - 2), min(H, int(cy + rh * 1.5) + 3)
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.mgrid[y0:y1, x0:x1]; d = ((xx - cx) / max(1.0, rw)) ** 2 + ((yy - cy) / max(1.0, rh)) ** 2
    mask[y0:y1, x0:x1] |= (d < 1 + NOISE[y0:y1, x0:x1] * rag).astype(np.uint8)
FEET = []
for by, bx, im, nm in OB:
    if nm in SMALL: continue
    x0 = bx - im.width / 2; f0, f1 = foot_of(im, nm); fw = f1 - f0; cx = x0 + (f0 + f1) / 2
    tree = nm.startswith('tree') or nm == 'clump'
    rw = fw * 0.5 + max(3, fw * 0.12); rh = float(np.clip(fw * 0.13, 3.0, 8.0))          # the patch shows 3-6 px below the foot, more to the right
    blob(rim, cx + 2.5, by - rh * 0.30 + 1.5, rw + 2, rh + 1.5, 0.32)
    blob(core, cx + 1.5, by - rh * 0.45 + 0.5, rw * 0.88, rh * 0.75, 0.22)
    if tree:
        cw = im.width * 0.40; ch = max(8, im.width * 0.15)
        blob(shade_c, bx + 5, by - ch * 0.15 + 2, cw, ch, 0.38)
    FEET.append((by, cx, fw, im, nm))
mult = np.ones((H, W, 3), np.float32)
tone = lambda f: np.array([f * 0.92, f * 0.98, min(1.0, f * 1.10)], np.float32)       # outdoor shadow: darker and a touch cooler
mult[shade_c > 0] = tone(0.87); mult[rim > 0] = tone(0.76); mult[core > 0] = tone(0.58)
mult[water > 0] = 1.0                                                                   # nothing casts a patch onto open water
gg = np.asarray(ground).astype(np.float32); gg[..., :3] = np.clip(gg[..., :3] * mult, 0, 255)
out = Image.fromarray(gg.astype(np.uint8), 'RGBA')
# (3) grass tufts over the front of the foot, only where the ground there is grass
grass_here = lambda x, y: 0 <= int(x) < W and 0 <= int(y) < H and (35 < h_[int(y), int(x)] < 75) and s_[int(y), int(x)] > 110 and not sand[int(y), int(x)] and not water[int(y), int(x)] and not rock[int(y), int(x)]
tufts = 0
for by, cx, fw, im, nm in FEET:
    if nm in ('terrace', 'plot', 'pad', 'bridge', 'dock'): continue
    n_t = 3 if (fw > 46 and im.height > 50) else 2 if fw > 12 else 1       # low things get tufts at the corners only, never across the front
    t_sc = min([0.42, 0.55, 0.7, 0.82, 0.95], key=lambda q: abs(q - float(np.clip(0.30 * im.height / 24.0, 0.42, 0.95))))   # a tuft is at most ~30% as tall as the thing
    spots = [cx - fw * 0.42, cx + fw * 0.42, cx + rs.uniform(-0.12, 0.12) * fw][:n_t] if n_t > 1 else [cx + rs.choice([-1, 1]) * (fw * 0.5 + 2)]
    for tx in spots:
        ty = by + rs.uniform(1.5, 4.0)
        if not grass_here(tx, min(H - 1, ty)): continue
        t_im = spr('grass', scale=t_sc if rs.rand() < 0.6 else max(0.42, t_sc - 0.13), flip=rs.rand() < 0.5, tone='tuft')   # a few fixed sizes: the same pictures are reused everywhere
        OB.append((ty, tx + rs.uniform(-2, 2), t_im, 'tuft')); tufts += 1
for by, bx, im, nm in sorted(OB, key=lambda o: o[0]): out.alpha_composite(im, (int(bx - im.width / 2), int(by - im.height)))
out.convert('RGB').save(sys.argv[3] if len(sys.argv) > 3 else '/home/claude/gt/piece3_r3.png')
# optional export of the layers, for anything that draws the scene itself (the demo page, later the game):
#   ground.png = painted ground + shadows, nothing standing on it · sprites.png + scene.json = every standing thing as its own piece
if len(sys.argv) > 5:
    import os
    ex = sys.argv[5]; os.makedirs(ex, exist_ok=True)
    Image.fromarray(gg.astype(np.uint8), 'RGBA').convert('RGB').save(ex + '/ground.png')          # ground + baked shadows (for still pictures)
    ground.convert('RGB').save(ex + '/ground_plain.png')                                           # bare ground (the game draws shadows itself)
    uniq = {}; order = []
    for by, bx, im, nm in OB:
        if id(im) not in uniq: uniq[id(im)] = len(order); order.append((im, nm))
    aw = 1024; x = y = rowh = 0; pos = []
    for im, nm in sorted(order, key=lambda o: -o[0].height):
        if x + im.width + 1 > aw: x = 0; y += rowh + 1; rowh = 0
        pos.append((id(im), x, y)); x += im.width + 1; rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (aw, y + rowh), (0, 0, 0, 0)); rect = {}
    for (i, x0, y0) in pos:
        im = next(o[0] for o in order if id(o[0]) == i); atlas.paste(im, (x0, y0)); rect[i] = [x0, y0, im.width, im.height]
    atlas.save(ex + '/sprites.png', optimize=True)
    def level(nm): return 'high' if nm in ('treeA', 'treeB', 'treeC', 'clump') else 'small' if nm in ('treeD', 'treeE', 'treeF') else 'mid' if nm.startswith('bush') or nm == 'thicket' else 'low'
    def foot(im, nm):
        f0, f1 = foot_of(im, nm); return [int(f0), int(f1 - f0)]
    inst = [{'n': nm, 'lv': level(nm), 'r': rect[id(im)], 'x': int(bx - im.width / 2), 'y': int(by - im.height), 'by': int(by), 'f': foot(im, nm), 'sh': 0 if nm in SMALL else 1}
            for by, bx, im, nm in sorted(OB, key=lambda o: o[0])]
    json.dump({'w': W, 'h': H, 'inst': inst}, open(ex + '/scene.json', 'w'))
    print(json.dumps({'export': ex, 'unique_sprites': len(order), 'instances': len(inst), 'atlas': list(atlas.size), 'levels': dict(collections.Counter(i['lv'] for i in inst))}))
kinds = collections.Counter(o[3] for o in OB)
print(json.dumps({'reference_points': len(ref_trees), 'trees': sum(v for k, v in kinds.items() if k.startswith('tree')), 'tree_shapes_used': sorted(k for k in kinds if k.startswith('tree')),
                  'nudged': nudged, 'no_room': lost, 'bushes': sum(v for k, v in kinds.items() if k.startswith('bush')), 'objects': len(OB)}))
