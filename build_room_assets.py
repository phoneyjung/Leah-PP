# -*- coding: utf-8 -*-
# Builds the game files of the house inside from the chosen paintings (kept in the repo as art-*.png):
#   room-L1.jpg, room-L2.jpg (step 1 picture + the new wing joined on), room-L3b.jpg (upper floor), furn-plain.png + furn-plain.json (every piece, every view).
# usage: python3 build_room_assets.py <folder with the art-*.png files> <folder with furniture_guides.py, house_step23_guides.py, house_layouts.json> <out folder>
import json, sys, os, numpy as np, cv2
from PIL import Image
ART, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; T = 32; M = 10
s = open(SRC + '/furniture_guides.py', encoding='utf8').read(); ns = {}; exec(s[:s.index("meta = {}\nfor name, rows in SHEETS.items():")], ns)
render, PIECES, ONE, VIEWS = ns['render'], ns['PIECES'], ns['ONE'], ns['VIEWS']
s2 = open(SRC + '/house_step23_guides.py', encoding='utf8').read(); i0 = s2.index("BK = ["); i1 = s2.index("W, H, MAG = 1536, 1024"); ns.update({'np': np}); exec(s2[i0:i1], ns); NEW, SLIDE, STAIRS = ns['NEW'], ns['SLIDE'], ns['STAIRS']
PLAN = json.load(open(SRC + '/house_layouts.json', encoding='utf8'))
def key_out(a):
    R, G, B = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int); mag = (R > 150) & (B > 150) & (G < 120) & (np.abs(R - B) < 70) & ((np.minimum(R, B) - G) > 70)
    return np.dstack([a, cv2.morphologyEx((~mag).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3))) * 255]).astype(np.uint8)
def shrink(rgba, k):
    pm = Image.fromarray(rgba, 'RGBA'); arr = np.asarray(pm).astype(np.float32) / 255; arr[..., :3] *= arr[..., 3:4]
    sm = Image.fromarray((arr * 255).astype(np.uint8), 'RGBa').resize((max(1, round(pm.width * k)), max(1, round(pm.height * k))), Image.LANCZOS).convert('RGBA'); b = np.asarray(sm).copy(); b[..., 3] = np.where(b[..., 3] >= 120, 255, 0); b[b[..., 3] == 0] = 0; return Image.fromarray(b, 'RGBA')
def take(path, px, cw, ch, cellx, celly, parts, w, d, view, basepad, margin=M):
    g, sz = render(parts, w, d, view, px); a = np.asarray(Image.open(path).convert('RGB')); base = celly * ch + ch - basepad; x = cellx * cw + (cw - g.width) // 2; y = base - g.height
    x0, y0, x1, y1 = max(0, x - margin), max(0, y - margin), min(a.shape[1], x + g.width + margin), min(a.shape[0], base + margin); k = T / px
    fw, fd = (w, d) if view in ('S', 'N') else (d, w); return shrink(key_out(a[y0:y1, x0:x1]), k), {'ox': round((sz[2] + (x - x0)) * k, 1), 'oy': round((sz[3] + (y - y0)) * k, 1), 'fw': fw, 'fd': fd}
sprites = {}
for sheet, rows in {'A': ['bed', 'wardrobe', 'desk'], 'B': ['piano', 'counter', 'stove'], 'C': ['shelf', 'sofa', 'bathtub']}.items():
    for r, p in enumerate(rows): w, d, parts = PIECES[p]; sprites[p] = [take(f'{ART}/art-furniture-plain-{sheet}.png', 72, 384, 341, c, r, parts, w, d, v, 8) for c, v in enumerate(VIEWS)]
for r, p in enumerate(['toilet', 'washstand']): w, d, parts = PIECES[p]; sprites[p] = [take(f'{ART}/art-furniture-plain-D1.png', 108, 384, 512, c, r, parts, w, d, v, 40) for c, v in enumerate(VIEWS)]
for i, (p, (w, d, parts)) in enumerate(ONE.items()):
    path, px = f'{ART}/art-furniture-plain-D2.png', 108; g, sz = render(parts, w, d, 'S', px); a = np.asarray(Image.open(path).convert('RGB')); cx = (i % 2) * 768 + 384; base = (i // 2) * 512 + 512 - 40; x = cx - g.width // 2; y = base - g.height; m2 = 26 if p in ('plant', 'rug') else M
    x0, y0, x1, y1 = max(0, x - m2), max(0, y - m2), min(1536, x + g.width + m2), min(1024, base + m2); k = T / px; sprites[p] = [(shrink(key_out(a[y0:y1, x0:x1]), k), {'ox': round((sz[2] + (x - x0)) * k, 1), 'oy': round((sz[3] + (y - y0)) * k, 1), 'fw': w, 'fd': d})]
# the rug lies flat and is seen from straight above, so its second view is simply the same picture turned a quarter
imR, mR = sprites['rug'][0]; im2 = imR.rotate(90, expand=True); sprites['rug'].append((im2, {'ox': mR['oy'], 'oy': round(imR.width - mR['ox'] - mR['fw'] * T, 1), 'fw': mR['fd'], 'fd': mR['fw']}))
for r, (p, (w, d, parts)) in enumerate(NEW.items()): sprites[p] = [take(f'{ART}/art-furniture-plain-E.png', 72, 384, 341, c, r, parts, w, d, v, 8) for c, v in enumerate(VIEWS)]
# sheet F: the painter drew the two objects a little larger than the guide; each is cut by its own outline and brought to its floor size
aF = np.asarray(Image.open(f'{ART}/art-furniture-plain-F.png').convert('RGB'))
for i, (p, (w, d, parts), fit) in ((1, ('stairs', STAIRS, 2.0 / 3.0)),):      # the first slide (coming toward the viewer) is no longer used: the owner asked for one that runs right to left
    g, sz = render(parts, w, d, 'S', 108); rgba = key_out(aF[:, i * 768:(i + 1) * 768]); ys, xs = np.where(rgba[..., 3] > 0); rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = (g.width - 6) / rgba.shape[1] * T / 108 * fit; im = shrink(rgba, k); fw, fd = w * fit, d * fit; sprites[p] = [(im, {'ox': round((im.width - fw * T) / 2, 1), 'oy': round(im.height - fd * T - 1, 1), 'fw': round(fw, 2), 'fd': round(fd, 2)})]
# the play slide seen from its side (tower on the right, sliding to the left), shown 1.2 times the size of its guide
SS = json.load(open(SRC + '/house_slide_side.json')); aG = np.asarray(Image.open(f'{ART}/art-furniture-plain-G.png').convert('RGB')); bx = SS['box']; mg = 12; kS = T / SS['px_per_tile'] * 1.2
imS = shrink(key_out(aG[max(0, bx[1] - mg):bx[3] + mg, max(0, bx[0] - mg):bx[2] + mg]), kS); sprites['slideL'] = [(imS, {'ox': round((SS['tiles'][2] + mg) * kS, 1), 'oy': round((SS['tiles'][3] + mg) * kS, 1), 'fw': round(SS['foot_w_d'][0] * 1.2, 2), 'fd': round(SS['foot_w_d'][1] * 1.2, 2)})]
items = [(p, i, im, mt) for p, L in sprites.items() for i, (im, mt) in enumerate(L)]; items.sort(key=lambda t: -t[2].height); AW = 640; x = y = rowh = 0; pos = []
for p, i, im, mt in items:
    if x + im.width + 2 > AW: x = 0; y += rowh + 2; rowh = 0
    pos.append((p, i, im, mt, x, y)); x += im.width + 2; rowh = max(rowh, im.height)
atlas = Image.new('RGBA', (AW, y + rowh), (0, 0, 0, 0)); J = {}
for p, i, im, mt, x, y in pos: atlas.alpha_composite(im, (x, y)); J.setdefault(p, [None] * len(sprites[p]))[i] = [x, y, im.width, im.height, mt['ox'], mt['oy'], mt['fw'], mt['fd']]
atlas.save(OUT + '/furn-plain.png', optimize=True)
# ---- rooms
L1 = Image.open(f'{ART}/art-room-L1.png').convert('RGB').crop((1, 40, 1535, 984)).resize((832, 512), Image.LANCZOS); L1.save(OUT + '/room-L1.jpg', quality=90, optimize=True)
wing = Image.open(f'{ART}/art-room-wing.png').convert('RGB').crop((2, 3, 1022, 1533)).resize((384, 576), Image.LANCZOS)
a1 = np.asarray(L1).astype(np.float32); aw = np.asarray(wing).astype(np.float32); cor1 = a1[9 * T + 6:11 * T - 6, 20 * T:24 * T].reshape(-1, 3).mean(0); corw = aw[9 * T + 6:11 * T - 6, 1 * T + 8:5 * T].reshape(-1, 3).mean(0); gain = cor1 / corw
aw = np.clip(aw * (1 + (gain - 1) * 0.85), 0, 255)                                             # bring the wing's corridor floor to the colour of the old corridor
out_col = tuple(int(v) for v in np.asarray(L1)[505:511, 2:60].reshape(-1, 3).mean(0)) if False else (22, 17, 36)
L2 = Image.new('RGB', (37 * T, 18 * T), out_col); L2.paste(L1, (0, 0)); L2.paste(Image.fromarray(aw.astype(np.uint8)), (25 * T, 0)); L2.save(OUT + '/room-L2.jpg', quality=90, optimize=True)
Image.open(f'{ART}/art-room-upper.png').convert('RGB').crop((1, 40, 1535, 984)).resize((832, 512), Image.LANCZOS).save(OUT + '/room-L3b.jpg', quality=90, optimize=True)
G1 = PLAN['L1']['grid']; G2 = PLAN['L2']['grid']; G3a = PLAN['L3a']['grid']; G3b = PLAN['L3b']['grid']
START1 = [['counter', 0, 1.0, 1.02], ['stove', 0, 4.3, 1.02], ['shelf', 0, 5.7, 1.05], ['roundtable', 0, 9.5, 1.9], ['plant', 0, 13.3, 1.1], ['piano', 1, 1.05, 6.3], ['sofa', 0, 4.2, 5.5], ['rug', 0, 4.0, 7.3], ['bed', 0, 16.15, 1.02], ['wardrobe', 0, 22.5, 1.02], ['desk', 3, 24.05, 3.6],
          ['washstand', 0, 16.0, 10.02], ['toilet', 0, 19.1, 10.02], ['bathtub', 0, 16.2, 11.85], ['washtub', 0, 21.4, 11.6]]
WING = [['bookshelf', 0, 26.1, 1.05], ['bookshelf', 0, 28.3, 1.05], ['bookshelf', 3, 35.35, 2.2], ['armchair', 0, 32.0, 2.4], ['plant', 0, 34.2, 1.1]]
UPPER = [['bedbig', 0, 1.1, 1.02], ['wardrobe', 0, 6.8, 1.02], ['bathtub', 0, 11.2, 1.02], ['toilet', 0, 14.1, 1.02], ['washstand', 1, 11.0, 3.0], ['desk', 0, 16.2, 1.02], ['bookshelf', 0, 19.2, 1.05], ['armchair', 3, 23.6, 3.2], ['plant', 0, 24.1, 1.1],
         ['sofa', 0, 9.0, 7.2], ['rug', 0, 8.8, 8.8], ['roundtable', 0, 14.4, 9.5], ['plant', 0, 1.1, 7.1]]
rooms = {'L1': {'img': 'room-L1.jpg', 'key': 'roomL1', 'w': 26, 'h': 16, 'grid': G1, 'door': [3, 10], 'start': START1, 'add': [], 'fixed': [], 'noPlace': [], 'save': 'room2'},
         'L2': {'img': 'room-L2.jpg', 'key': 'roomL2', 'w': 37, 'h': 18, 'grid': G2, 'door': [3, 10], 'start': START1, 'add': WING, 'fixed': [['slideL', 0, 31.63, 12.2]], 'noPlace': [[26, 12, 33, 15]], 'pit': [26, 12, 33, 15], 'save': 'room2'},
         'L3a': {'img': 'room-L2.jpg', 'key': 'roomL2', 'w': 37, 'h': 18, 'grid': G3a, 'door': [3, 10], 'start': START1, 'add': WING, 'fixed': [['slideL', 0, 31.63, 12.2], ['stairs', 0, 23.6, 10.0]], 'noPlace': [[26, 12, 33, 15], [23, 10, 25, 13]], 'pit': [26, 12, 33, 15], 'stair': {'at': [24.27, 12.35], 'to': 'room2', 'id': 'up', 'toExit': 'down'}, 'save': 'room2'},
         'L3b': {'img': 'room-L3b.jpg', 'key': 'roomL3b', 'w': 26, 'h': 16, 'grid': G3b, 'door': None, 'start': UPPER, 'add': [], 'fixed': [], 'noPlace': [[23, 10, 25, 13], [0, 10, 7, 14]], 'hole': [23, 11, 25, 13], 'stair': {'at': [24.0, 10.45], 'to': 'room', 'id': 'down', 'toExit': 'up'}, 'spawn': [22.5, 9.5], 'save': 'room2U'}}
json.dump({'rowsAbovePlan': 2, 'pieces': J, 'solid': {'rug': 0}, 'act': {'bed': 'sleep', 'bedbig': 'sleep', 'sofa': 'cuddle', 'armchair': 'cuddle', 'piano': 'piano'}, 'rooms': rooms}, open(OUT + '/furn-plain.json', 'w'), separators=(',', ':'), ensure_ascii=False)
for f in ('furn-plain.png', 'furn-plain.json', 'room-L1.jpg', 'room-L2.jpg', 'room-L3b.jpg'): print(f, os.path.getsize(OUT + '/' + f) // 1024, 'KB')
print('atlas', atlas.size, 'sprites', len(items), '| corridor colour old', [round(v) for v in cor1], 'wing', [round(v) for v in corw], '| slide', J['slideL'][0], '| stairs', J['stairs'][0])
