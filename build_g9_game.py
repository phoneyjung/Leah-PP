# build_g9_game.py — แปลงฉาก G9 ที่ประกอบแล้ว (ชั้นจาก compose_g9_full.py) เป็นไฟล์ที่เกมใช้:
#   map-G9b-ground.jpg (พื้น + เงา) · g9b-sprites.png (ของแยกชิ้น) · g9b-scene.json (ตำแหน่งของ ตารางชน จุดสำคัญ)
# โลกในเกม: 60x40 ช่อง ช่องละ 32 พิกเซล = 1920x1280 พิกเซล ตรงกับภาพพื้น 1:1
import numpy as np, cv2, json, sys, hashlib, collections
from PIL import Image
SRC = '/home/claude/g9full'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/g9game'
import os; os.makedirs(OUT, exist_ok=True)
T = 32; GW, GH = 60, 40
sc = json.load(open(SRC + '/scene.json')); atlas = Image.open(SRC + '/sprites.png').convert('RGBA'); W, H = sc['w'], sc['h']
Image.open(SRC + '/ground.png').convert('RGB').save(OUT + '/map-G9b-ground.jpg', quality=88, optimize=True, progressive=True)

# ---------- sprites: drop the house (the game draws it by level), reuse one picture for a thing and its mirror image, outline the things you can tap ----------
TAP = ('board', 'crate', 'mailbox')
def outlined(im):
    a = np.asarray(im); pad = 2; hh, ww = a.shape[:2]; big = np.zeros((hh + 2 * pad, ww + 2 * pad, 4), np.uint8); big[pad:pad + hh, pad:pad + ww] = a
    al = (big[..., 3] > 0).astype(np.uint8); ring = (cv2.dilate(al, np.ones((3, 3), np.uint8)) > 0) & (al == 0); big[ring] = (255, 226, 120, 235); return Image.fromarray(big, 'RGBA')
pics = []; pic_name = []; by_hash = {}; inst = []
def pic_id(im):
    b = im.tobytes() + bytes(str(im.size), 'ascii'); h = hashlib.md5(b).hexdigest()
    if h in by_hash: return by_hash[h], 0
    m = im.transpose(Image.FLIP_LEFT_RIGHT); hm = hashlib.md5(m.tobytes() + bytes(str(m.size), 'ascii')).hexdigest()
    if hm in by_hash: return by_hash[hm], 1
    by_hash[h] = len(pics); pics.append(im); return by_hash[h], 0
for i in sc['inst']:
    if i['n'] == 'house': continue
    r = i['r']; im = atlas.crop((r[0], r[1], r[0] + r[2], r[1] + r[3])); x, by = i['x'], i['by']
    if i['n'] in TAP: im = outlined(im); x -= 2; by += 2
    pid, fl = pic_id(im)
    if pid == len(pic_name): pic_name.append(i['n'])
    inst.append({'n': i['n'], 'p': pid, 'x': x, 'by': by, 'w': im.width, 'h': im.height, 'fl': fl, 'f': i['f'], 'lv': i['lv']})
# cleared-by-hand things on the wild plots, half size (the world is smaller than the old scene)
O1 = Image.open('/home/claude/v108/objects-1.png').convert('RGBA'); P1 = json.load(open('/home/claude/v108/objects-1.json')); wild = {}
for k in ('bush', 'rock', 'stump'):
    r = P1[k]; im = O1.crop((r[0], r[1], r[0] + r[2], r[1] + r[3])); im = im.resize((round(im.width * 0.5), round(im.height * 0.5)), Image.LANCZOS); wild[k] = len(pics); pics.append(im); pic_name.append('wild')
# Two sheets, each with its own 255 colours (a full-colour sheet weighs 2.3 MB; one shared palette dulled the leaves): plants on one, everything else on the other.
# Edges are made crisp first: the resized pictures had picked up a half-transparent rim, which pixel art does not have.
VEG = lambda n: n.startswith('tree') or n.startswith('bush') or n in ('clump', 'oak', 'tuft', 'grass', 'thicket', 'flowerW', 'flowerY', 'flowerR', 'mushroom')
rects = [None] * len(pics); sizes = {}; errs = {}
for sheet_id, fname in ((0, 'g9b-sprites.png'), (1, 'g9b-plants.png')):
    ids = [k for k in range(len(pics)) if (1 if VEG(pic_name[k]) else 0) == sheet_id]; aw = 1024; x = y = rowh = 0
    for k in sorted(ids, key=lambda k: -pics[k].height):
        im = pics[k]
        if x + im.width + 1 > aw: x = 0; y += rowh + 1; rowh = 0
        rects[k] = [x, y, im.width, im.height, sheet_id]; x += im.width + 1; rowh = max(rowh, im.height)
    sheet = Image.new('RGBA', (aw, y + rowh), (0, 0, 0, 0))
    for k in ids: sheet.paste(pics[k], tuple(rects[k][:2]))
    a = np.asarray(sheet).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); a[a[..., 3] == 0] = 0; m = a[..., 3] > 0
    q = Image.fromarray(a[..., :3], 'RGB').quantize(colors=255, method=Image.MEDIANCUT, dither=Image.Dither.NONE); pal = q.getpalette()[:765] + [0, 0, 0]
    idx = np.asarray(q).copy(); idx[~m] = 255; P_ = Image.fromarray(idx, 'P'); P_.putpalette(pal); P_.save(OUT + '/' + fname, optimize=True, transparency=255)
    back = np.asarray(Image.open(OUT + '/' + fname).convert('RGBA')).astype(int); sizes[fname] = [list(sheet.size), os.path.getsize(OUT + '/' + fname) // 1024, len(ids)]
    errs[fname] = round(float(np.abs(a[..., :3].astype(int) - back[..., :3])[m].mean()), 2)

# ---------- collision: what you cannot walk through, on the game's 32-px tiles ----------
g = np.asarray(Image.open('/home/claude/gt/ground_full.png').convert('RGB')); hsv = cv2.cvtColor(g, cv2.COLOR_RGB2HSV); hh_, ss_, vv_ = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
op = lambda m, k: cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k))) > 0
water = op((hh_ > 88) & (hh_ < 125) & (ss_ > 90) & (vv_ > 120), 5); rock = op((ss_ < 50) & (vv_ > 90) & (vv_ < 215), 9)
sand = op((hh_ >= 14) & (hh_ <= 31) & (ss_ > 55) & (ss_ < 200) & (vv_ > 175), 7)
solid = np.zeros((GH, GW), bool)
frac = lambda m: m[:GH * T, :GW * T].reshape(GH, T, GW, T).mean((1, 3))
solid |= frac(water) >= 0.22; solid |= frac(rock) >= 0.40          # the stream is about one tile wide: a low share of water already closes a tile, or you could wade across
def open_rect(x0, y0, x1, y1):                                     # wooden ways over water stay open
    for ty in range(int(y0 // T), int(y1 // T) + 1):
        for tx in range(int(x0 // T), int(x1 // T) + 1): solid[ty, tx] = False
BRIDGE = (12 * 40, 24.8 * 40); DOCK = (20.5 * 40, 22.6 * 40)
open_rect(BRIDGE[0] - 14, BRIDGE[1] - 44, BRIDGE[0] + 14, BRIDGE[1] + 30); open_rect(DOCK[0] - 6, DOCK[1] - 30, DOCK[0] + 6, DOCK[1] + 26)
def block(x0, y0, x1, y1):
    for ty in range(max(0, int(y0 // T)), min(GH, int(y1 // T) + 1)):
        for tx in range(max(0, int(x0 // T)), min(GW, int(x1 // T) + 1)):
            ox = min(x1, (tx + 1) * T) - max(x0, tx * T); oy = min(y1, (ty + 1) * T) - max(y0, ty * T)
            if ox >= 5 and oy >= 5: solid[ty, tx] = True
NOFOOT = ('rockS', 'mushroom', 'flowerW', 'flowerY', 'flowerR', 'grass', 'tuft')
for i in inst:
    n, x, by, w, h = i['n'], i['x'], i['by'], i['w'], i['h']; f0, fw = i['f']; cx = x + f0 + fw / 2
    if n in NOFOOT: continue
    if n.startswith('tree'): hw = max(8, fw * 0.35); block(cx - hw, by - 12, cx + hw, by)
    elif n == 'clump': block(x + f0, by - 14, x + f0 + fw, by)
    elif n == 'oak': block(x + w / 2 - 40, by - 30, x + w / 2 + 40, by)
    elif n == 'thicket': block(x, by - 30, x + w, by)
    elif n.startswith('bush'): block(x + w * 0.2, by - 10, x + w * 0.8, by)
    elif n in ('lamp', 'pillar', 'sign', 'mailbox', 'board', 'scarecrow'): block(cx - 6, by - 8, cx + 6, by)
    elif n == 'bench': block(x + 4, by - 12, x + w - 4, by)
    elif n in ('well', 'firepit'): block(x + 5, by - h * 0.6, x + w - 5, by)
    elif n in ('logSeatL', 'logSeatR', 'log', 'stump', 'rockM'): block(x + 3, by - h * 0.5, x + w - 3, by)
    elif n == 'logs': block(x, by - h * 0.7, x + w, by)
    elif n == 'crate': block(x + 2, by - 14, x + w - 2, by)
    elif n in ('fenceH', 'gateShut', 'lockgate'): block(x, by - 10, x + w, by)
    elif n == 'fenceV': block(x, by - h, x + w, by)
    elif n in ('shed', 'hut'): block(x + 4, by - h * 0.5, x + w - 4, by)
    else: block(cx - 6, by - 8, cx + 6, by)
solid[0, :] = solid[-1, :] = True; solid[:, 0] = solid[:, -1] = True
ys = np.where(sand[:, W - 20])[0]; ey = (ys.min() + ys.max()) / 2 / T                    # the main road at the east edge = the way to the village
for ty in range(int(ys.min() // T) + 1, int(ys.max() // T)): solid[ty, GW - 1] = False

# ---------- places the game needs, in game tiles ----------
find = lambda name: [i for i in inst if i['n'] == name]
cxy = lambda i: (i['x'] + i['w'] / 2, i['by'])
DX, HB = sc['door_x'], sc['house_base']; hb_t = HB / T
P = {'w': GW, 'h': GH, 'spawn': [GW - 3.5, round(ey, 2)], 'exitE': [GW - 0.4, round(ey, 2)], 'door': [round(DX / T, 2), round(hb_t + 0.2, 2)], 'houseBase': round(hb_t, 2),
     'houseBox': {k: [round((DX - off) / T, 2), round(hb_t - 313 / T, 2), round((DX - off + wd) / T, 2)] for k, (off, wd) in {'1': (105, 256), '2': (96, 375), '3': (94, 427)}.items()}}
mb = find('mailbox')[0]; P['mailbox'] = [round(cxy(mb)[0] / T, 2), round(cxy(mb)[1] / T, 2)]
sh = find('shed')[0]; P['shed'] = [round(cxy(sh)[0] / T, 2), round((sh['by'] + 10) / T, 2)]
cr = find('crate')[0]; P['crate'] = [round(cxy(cr)[0] / T, 2), round(cr['by'] / T, 2)]
fp = find('firepit')[0]; P['camp'] = [round(cxy(fp)[0] / T, 2), round((fp['by'] + 26) / T, 2)]
bd = find('board')[0]; P['sign'] = [round(cxy(bd)[0] / T, 2), round((bd['by'] + 6) / T, 2)]
P['conv'] = [30, 16]
# fishing: stand on the wooden dock, near its end
dock_x = int(20.5 * 40); col = np.where(~water[820:1000, dock_x] )[0]; col = col[col < 120]; P['fish'] = [round(dock_x / T, 2), round((820 + col.max() - 16) / T, 2)]
(p1x, p1y, p1w, p1h), (p2x, p2y, p2w, p2h), p3, p4 = sc['plots']; FP = sc['fper']; soil = lambda px, pw: (px + 12, pw - 24)
sx0, sw_ = soil(p1x, p1w); P['plots'] = [[round((sx0 + (c + .5) * sw_ / 4) / T, 2), round((p1y + 22 + (2 * r + 1) * FP + 4) / T, 2)] for r in range(3) for c in range(4)]
sx0, sw_ = soil(p2x, p2w); P['extra'] = [[round((sx0 + (c + .5) * sw_ / 4) / T, 2), round((p2y + 22 + (2 * r + 1) * FP + 4) / T, 2)] for r in range(2) for c in range(4)]
wl = []
for (px, py, pw, ph) in (p3, p4):
    for ty in range(int((py + 22) // T) + 1, int((py + ph - 26) // T) + 1):
        for tx in range(int((px + 14) // T) + 1, int((px + pw - 14) // T)):
            wl.append([('bush', 'rock', 'stump')[(tx * 7 + ty * 3) % 3], tx + .5, ty + .5])
P['wild'] = wl
lg = find('logs'); lk = find('lockgate')[0]; th = find('thicket')[0]
P['locks'] = {'w': {'at': [round((max(cxy(l)[0] + l['w'] / 2 for l in lg) + 26) / T, 2), round(np.mean([l['by'] - l['h'] / 2 for l in lg]) / T, 2)], 'msg': 'g9LockW'},
              'n': {'at': [round(cxy(lk)[0] / T, 2), round((lk['by'] + 30) / T, 2)], 'msg': 'g9LockN'},
              's': {'at': [round(cxy(th)[0] / T, 2), round((th['by'] - th['h'] - 22) / T, 2)], 'msg': 'g9LockS'}}
P['lamps'] = [[round(cxy(l)[0]), round(l['by'] - l['h'] + 12)] for l in find('lamp') + find('pillar')]
P['wildPic'] = wild
P['grid'] = ''.join('1' if v else '0' for v in solid.reshape(-1))
P['rects'] = rects; P['inst'] = [[i['p'], i['x'], i['by'], i['fl']] for i in inst]
json.dump(P, open(OUT + '/g9b-scene.json', 'w'), separators=(',', ':'))

# ---------- can you walk to everything? ----------
s2 = solid.copy(); hx0, hy0, hx1 = P['houseBox']['1']; s2[int(hy0):int(hb_t), int(hx0):int(np.ceil(hx1))] = True
start = (int(P['spawn'][1]), int(P['spawn'][0])); seen = np.zeros_like(s2); st = [start]; seen[start] = True
while st:
    y_, x_ = st.pop()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        a, b = y_ + dy, x_ + dx
        if 0 <= a < GH and 0 <= b < GW and not s2[a, b] and not seen[a, b]: seen[a, b] = True; st.append((a, b))
near = lambda tx, ty: any(seen[min(GH - 1, max(0, int(ty) + dy)), min(GW - 1, max(0, int(tx) + dx))] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
targets = {'front door': P['door'], 'shed': P['shed'], 'crate': P['crate'], 'mailbox': P['mailbox'], 'fishing spot': P['fish'], 'camp': P['camp'], 'house sign': P['sign'], 'converter': P['conv'],
           'lock west': P['locks']['w']['at'], 'lock north': P['locks']['n']['at'], 'lock south': P['locks']['s']['at'], 'exit east': [GW - 1, P['exitE'][1]]}
for k_, v in enumerate(P['plots'] + P['extra']): targets['plot %d' % k_] = v
bx_ = int(BRIDGE[0] // T); col = ''.join('#' if solid[ty, bx_] else '.' for ty in range(26, 36)); print('bridge column, tiles y26..35 (# = closed):', col, '| stream tiles left and right of the bridge closed:', bool(solid[int(BRIDGE[1] // T), bx_ - 2]), bool(solid[int(BRIDGE[1] // T), bx_ + 2]))
bad = [k for k, v in targets.items() if not near(*v)]
print(json.dumps({'ground_KB': os.path.getsize(OUT + '/map-G9b-ground.jpg') // 1024, 'sheets [size, KB, pictures]': sizes, 'mean colour error after 255 colours': errs, 'scene_KB': os.path.getsize(OUT + '/g9b-scene.json') // 1024,
                  'pictures': len(pics), 'things': len(inst), 'mirrored_reused': sum(i['fl'] for i in inst), 'solid_tiles': int(solid.sum()), 'open_tiles': int((~solid).sum()),
                  'reachable_open_tiles': int(seen.sum()), 'targets': len(targets), 'not_reachable': bad, 'wild': len(wl), 'lamps': len(P['lamps'])}))
print({k: P[k] for k in ('spawn', 'exitE', 'door', 'houseBase', 'houseBox', 'mailbox', 'shed', 'crate', 'fish', 'camp', 'sign', 'locks')})
# picture for the eye: solid tiles red, reachable green dots, targets
ov = Image.open(SRC + '/ground.png').convert('RGBA'); full = Image.open('/home/claude/gt/g9_full.png').convert('RGBA'); a = np.asarray(full).copy()
for ty in range(GH):
    for tx in range(GW):
        if solid[ty, tx]: a[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T, :3] = (a[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T, :3] * 0.45 + np.array([255, 40, 40]) * 0.55).astype(np.uint8)
        elif not seen[ty, tx]: a[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T, :3] = (a[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T, :3] * 0.5 + np.array([60, 60, 255]) * 0.5).astype(np.uint8)
for v in targets.values(): cv2.circle(a, (int(v[0] * T), int(v[1] * T)), 6, (255, 255, 0, 255), -1)
Image.fromarray(a, 'RGBA').convert('RGB').resize((1440, 960), Image.LANCZOS).save(OUT + '/_collision.jpg', quality=85)
