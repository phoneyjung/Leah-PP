# -*- coding: utf-8 -*-
# Furniture "paint-over" guides, round 2 (4 Oct). Round 1 gave the painter plain two-tone boxes and it ignored them and drew its usual low camera.
# This time every piece is modelled from small blocks and drawn in the room's own projection, so the guide already LOOKS like the furniture:
#   screen x = across, screen y = depth toward the viewer minus height. The floor is seen from straight above, every upright side at full height.
# Each piece is drawn four times: facing the viewer, facing right, facing away, facing left. 72 px per floor tile (the game uses 32).
import json, numpy as np
from PIL import Image
PX = 72; W, H = 1536, 1024; CW, CH = W // 4, H // 3; MAG = (255, 0, 255)
PINE = (226, 186, 124); PINE2 = (204, 160, 100); DARKW = (124, 76, 50); BLUE = (120, 142, 172); WHITE = (244, 240, 230); IRON = (70, 70, 78); IRON2 = (104, 104, 112)
BEIGE = (214, 196, 160); BEIGE2 = (196, 176, 140); STONE = (160, 160, 158); BOOK = (150, 70, 60); INK = (40, 40, 52); CLAY = (190, 110, 70); LEAF = (90, 160, 80); RUG = (150, 110, 80); RUG2 = (176, 138, 100); TUBIN = (150, 112, 70); JAR = (200, 190, 170); JAR2 = (120, 150, 110)
B = lambda u0, u1, v0, v1, z0, z1, c: ('box', u0, u1, v0, v1, z0, z1, c)          # u across the front, v from the back (0) to the front, z up
CYL = lambda u, v, r, z0, z1, c: ('cyl', u, v, r, z0, z1, c)
STOOL = lambda u, v: [B(u - 0.18, u - 0.11, v - 0.15, v - 0.08, 0, 0.48, PINE2), B(u + 0.11, u + 0.18, v - 0.15, v - 0.08, 0, 0.48, PINE2), B(u - 0.035, u + 0.035, v + 0.1, v + 0.17, 0, 0.48, PINE2), CYL(u, v, 0.27, 0.48, 0.56, PINE)]   # the same stool everywhere: a round seat on three legs
PIECES = {
 'bed': (1.6, 3.0, [B(0, 1.6, 0.15, 2.85, 0, 0.45, PINE), B(0.08, 1.52, 0.2, 2.8, 0.45, 0.7, BLUE), B(0.08, 1.52, 0.2, 1.0, 0.7, 0.72, WHITE), B(0.3, 1.3, 0.3, 0.85, 0.72, 0.86, WHITE),
                    B(0, 1.6, 0, 0.15, 0, 1.3, PINE2), B(0, 1.6, 2.85, 3.0, 0, 0.8, PINE2)]),
 'wardrobe': (2.0, 0.9, [B(0, 2.0, 0, 0.86, 0, 2.3, PINE), B(-0.05, 2.05, -0.03, 0.9, 2.3, 2.4, PINE2), B(0.08, 0.98, 0.86, 0.9, 0.15, 2.2, PINE2), B(1.02, 1.92, 0.86, 0.9, 0.15, 2.2, PINE2),
                         B(0.86, 0.94, 0.9, 0.93, 1.1, 1.25, IRON), B(1.06, 1.14, 0.9, 0.93, 1.1, 1.25, IRON)]),
 'desk': (1.8, 0.9, [B(0, 1.8, 0, 0.9, 0.9, 1.0, PINE), B(0.05, 0.17, 0.05, 0.85, 0, 0.9, PINE2), B(1.15, 1.75, 0.05, 0.85, 0.35, 0.9, PINE2), B(1.63, 1.75, 0.05, 0.85, 0, 0.35, PINE2),
                     B(0.25, 0.75, 0.2, 0.65, 1.0, 1.08, BOOK), B(1.25, 1.45, 0.2, 0.4, 1.0, 1.16, INK)] + STOOL(0.73, 1.2)),
 'piano': (2.2, 0.9, [B(0, 2.2, 0, 0.5, 0, 1.6, DARKW), B(0, 2.2, 0.5, 0.9, 0, 0.92, DARKW), B(0.12, 2.08, 0.55, 0.86, 0.92, 0.95, WHITE), B(0.12, 2.08, 0.55, 0.66, 0.95, 0.98, INK),
                      B(0.75, 1.45, 1.05, 1.5, 0, 0.6, DARKW)]),
 'counter': (3.0, 0.9, [B(0, 3.0, 0.02, 0.86, 0, 1.0, PINE2), B(-0.04, 3.04, 0, 0.9, 1.0, 1.1, PINE), B(0.2, 1.0, 0.18, 0.72, 1.1, 1.12, STONE), B(0.5, 0.7, 0.04, 0.16, 1.1, 1.4, IRON2),
                        B(0.12, 0.72, 0.86, 0.9, 0.12, 0.9, PINE), B(0.78, 1.38, 0.86, 0.9, 0.12, 0.9, PINE), B(1.6, 2.9, 0.86, 0.9, 0.55, 0.9, PINE), B(1.6, 2.9, 0.86, 0.9, 0.12, 0.48, PINE)]),
 'stove': (1.1, 0.9, [B(0.03, 1.07, 0.03, 0.87, 0.15, 1.05, IRON), B(0, 1.1, 0, 0.9, 1.05, 1.1, IRON2), CYL(0.32, 0.5, 0.17, 1.1, 1.12, IRON), CYL(0.78, 0.5, 0.17, 1.1, 1.12, IRON), CYL(0.55, 0.15, 0.13, 1.1, 2.0, IRON2),
                      B(0.25, 0.85, 0.87, 0.91, 0.35, 0.9, IRON2), B(0.08, 0.2, 0.08, 0.2, 0, 0.15, IRON), B(0.9, 1.02, 0.08, 0.2, 0, 0.15, IRON), B(0.08, 0.2, 0.7, 0.82, 0, 0.15, IRON), B(0.9, 1.02, 0.7, 0.82, 0, 0.15, IRON)]),
 'shelf': (2.0, 0.6, [B(0, 2.0, 0, 0.08, 0, 1.4, PINE2), B(0, 0.1, 0, 0.6, 0, 1.4, PINE), B(1.9, 2.0, 0, 0.6, 0, 1.4, PINE), B(0, 2.0, 0, 0.6, 1.32, 1.4, PINE), B(0.1, 1.9, 0.08, 0.6, 0.62, 0.7, PINE), B(0.1, 1.9, 0.08, 0.6, 0, 0.08, PINE),
                      CYL(0.45, 0.35, 0.16, 1.4, 1.7, JAR), CYL(1.4, 0.32, 0.14, 1.4, 1.62, JAR2), CYL(0.5, 0.38, 0.15, 0.7, 0.98, JAR2), CYL(1.0, 0.38, 0.15, 0.7, 1.0, JAR), CYL(1.5, 0.38, 0.15, 0.7, 0.95, CLAY), CYL(0.7, 0.38, 0.17, 0.08, 0.4, CLAY), CYL(1.35, 0.38, 0.17, 0.08, 0.42, IRON)]),
 'sofa': (2.6, 1.1, [B(0, 2.6, 0, 0.32, 0, 1.0, BEIGE2), B(0, 0.3, 0.32, 1.1, 0, 0.75, BEIGE2), B(2.3, 2.6, 0.32, 1.1, 0, 0.75, BEIGE2), B(0.3, 2.3, 0.32, 1.1, 0, 0.42, BEIGE2), B(0.33, 1.28, 0.34, 1.08, 0.42, 0.52, BEIGE), B(1.32, 2.27, 0.34, 1.08, 0.42, 0.52, BEIGE)]),
 'bathtub': (2.4, 1.1, [B(0, 2.4, 0, 1.1, 0, 0.8, PINE2), B(0.14, 2.26, 0.14, 0.96, 0.8, 0.81, TUBIN), B(0, 2.4, 1.1, 1.13, 0.2, 0.28, IRON), B(0, 2.4, 1.1, 1.13, 0.55, 0.63, IRON), B(-0.03, 0, 0, 1.1, 0.2, 0.28, IRON), B(-0.03, 0, 0, 1.1, 0.55, 0.63, IRON), B(2.4, 2.43, 0, 1.1, 0.2, 0.28, IRON), B(2.4, 2.43, 0, 1.1, 0.55, 0.63, IRON), B(0, 2.4, -0.03, 0, 0.2, 0.28, IRON), B(0, 2.4, -0.03, 0, 0.55, 0.63, IRON)]),
 'toilet': (0.8, 1.1, [B(0.08, 0.72, 0, 0.34, 0, 0.9, WHITE), B(0.05, 0.75, 0, 0.36, 0.9, 0.95, STONE), B(0.2, 0.6, 0.34, 0.6, 0, 0.42, WHITE), CYL(0.4, 0.72, 0.3, 0.2, 0.45, WHITE), CYL(0.4, 0.72, 0.2, 0.45, 0.46, STONE)]),
 'bedside': (0.9, 0.7, [B(0.04, 0.86, 0.03, 0.66, 0, 0.82, PINE2), B(0, 0.9, 0, 0.7, 0.82, 0.9, PINE), B(0.12, 0.78, 0.66, 0.7, 0.45, 0.75, PINE), B(0.41, 0.49, 0.7, 0.73, 0.57, 0.64, IRON), CYL(0.3, 0.3, 0.1, 0.9, 1.25, WHITE)]),
 'washstand': (1.2, 0.7, [B(0.04, 1.16, 0.03, 0.66, 0, 1.0, PINE2), B(0, 1.2, 0, 0.7, 1.0, 1.08, PINE), CYL(0.6, 0.35, 0.28, 1.08, 1.2, WHITE), CYL(0.6, 0.35, 0.2, 1.2, 1.21, STONE), B(0.12, 0.62, 0.66, 0.7, 0.15, 0.85, PINE), B(0.72, 1.08, 0.7, 0.76, 0.3, 0.9, WHITE)]),
}
ONE = {'plant': (0.8, 0.8, [CYL(0.4, 0.4, 0.3, 0, 0.5, CLAY), CYL(0.4, 0.4, 0.4, 0.5, 1.1, LEAF)]),
       'roundtable': (2.4, 2.4, STOOL(1.2, 0.3) + STOOL(0.3, 1.2) + STOOL(2.1, 1.2) + [CYL(1.2, 1.2, 0.16, 0, 0.82, PINE2), CYL(1.2, 1.2, 0.7, 0.82, 0.9, PINE)] + STOOL(1.2, 2.1)),
       'rug': (3.0, 2.0, [B(0, 3.0, 0, 2.0, 0, 0, RUG), B(0.2, 2.8, 0.2, 1.8, 0, 0.01, RUG2), B(0.4, 2.6, 0.4, 1.6, 0.01, 0.02, RUG)]),
       'washtub': (1.2, 1.2, [CYL(0.6, 0.6, 0.6, 0, 0.65, PINE2), CYL(0.6, 0.6, 0.5, 0.65, 0.66, TUBIN), B(0.5, 1.0, 0.25, 0.33, 0.3, 1.15, STONE)])}
SHEETS = {'A': ['bed', 'wardrobe', 'desk'], 'B': ['piano', 'counter', 'stove'], 'C': ['shelf', 'sofa', 'bathtub'], 'D': ['toilet', 'washstand', 'bedside', '*']}   # D has four rows: a sparse sheet made the painter enlarge the pieces
VIEWS = ['S', 'E', 'N', 'W']
def tr(view, w, d, u, v):                                            # piece coordinates -> (across, depth toward the viewer)
    return {'S': (u, v), 'E': (v, w - u), 'N': (w - u, d - v), 'W': (d - v, u)}[view]
def render(parts, w, d, view, PX=PX):
    prim = []
    for p in parts:
        if p[0] == 'box':
            _, u0, u1, v0, v1, z0, z1, c = p; (xa, ya), (xb, yb) = tr(view, w, d, u0, v0), tr(view, w, d, u1, v1); prim.append(('box', min(xa, xb), max(xa, xb), min(ya, yb), max(ya, yb), z0, z1, c))
        else:
            _, u, v, r, z0, z1, c = p; x, y = tr(view, w, d, u, v); prim.append(('cyl', x, y, r, z0, z1, c))
    xs0 = min(q[1] if q[0] == 'box' else q[1] - q[3] for q in prim); xs1 = max(q[2] if q[0] == 'box' else q[1] + q[3] for q in prim)
    ys0 = min((q[3] - q[6]) if q[0] == 'box' else (q[2] - q[3] - q[5]) for q in prim); ys1 = max(q[4] if q[0] == 'box' else q[2] + q[3] for q in prim)
    Wp, Hp = int(np.ceil((xs1 - xs0) * PX)) + 6, int(np.ceil((ys1 - ys0) * PX)) + 6
    col = np.zeros((Hp, Wp, 3), np.uint8); dep = np.full((Hp, Wp), -1e9); fid = np.zeros((Hp, Wp), np.int32)
    Y, X = np.mgrid[0:Hp, 0:Wp]; xw = (X - 3) / PX + xs0; yw = (Y - 3) / PX + ys0      # world coordinates of each pixel: across, and (depth - height)
    k = 0
    def put(mask, depth, c, shade):
        nonlocal k; k += 1; m = mask & (depth > dep); col[m] = tuple(int(v * shade) for v in c); dep[m] = depth[m]; fid[m] = k
    for q in prim:
        if q[0] == 'box':
            _, x0, x1, y0, y1, z0, z1, c = q; inx = (xw >= x0) & (xw < x1)
            put(inx & (yw >= y0 - z1) & (yw < y1 - z1), yw + 2 * z1, c, 1.0)                      # top, seen from above
            if z1 > z0: put(inx & (yw >= y1 - z1) & (yw < y1 - z0), 2 * y1 - yw, c, 0.78)         # the side facing the viewer
        else:
            _, x, y, r, z0, z1, c = q; dx = xw - x; inr = np.abs(dx) < r; half = np.sqrt(np.clip(r * r - dx * dx, 0, None)); yf = y + half
            put(dx * dx + (yw + z1 - y) ** 2 < r * r, yw + 2 * z1, c, 1.0)
            if z1 > z0: put(inr & (yw >= yf - z1) & (yw < yf - z0), 2 * yf - yw, c, 0.78)
    edge = np.zeros((Hp, Wp), bool); edge[:, 1:] |= fid[:, 1:] != fid[:, :-1]; edge[1:, :] |= fid[1:, :] != fid[:-1, :]
    edge2 = edge.copy(); edge2[:, :-1] |= edge[:, 1:]; edge2[:-1, :] |= edge[1:, :]
    a = np.where(fid > 0, 255, 0).astype(np.uint8); col[edge2 & (fid > 0)] = (70, 52, 40); a[edge2] = 255; col[edge2 & (fid == 0)] = (70, 52, 40)
    return Image.fromarray(np.dstack([col, a]), 'RGBA'), [round(xs1 - xs0, 2), round(ys1 - ys0, 2), round(3 - xs0 * PX, 1), round(3 - ys0 * PX, 1)]      # size in tiles, then where the back-left corner of the floor footprint sits inside the picture (px)
meta = {}
for name, rows in SHEETS.items():
    CH = H // len(rows); im = Image.new('RGBA', (W, H), MAG + (255,)); meta[name] = {'rows': len(rows)}
    for r, piece in enumerate(rows):
        base = r * CH + CH - 8
        if piece == '*':
            for c, (k, (w, d, parts)) in enumerate(ONE.items()):
                s, sz = render(parts, w, d, 'S'); x = c * CW + (CW - s.width) // 2; im.alpha_composite(s, (x, base - s.height)); meta[name][k] = {'views': 1, 'box': [x, base - s.height, x + s.width, base], 'tiles': sz, 'foot': [w, d]}
            continue
        w, d, parts = PIECES[piece]; meta[name][piece] = {'views': 4, 'foot_w_d': [w, d], 'boxes': [], 'tiles': []}
        for c, v in enumerate(VIEWS):
            s, sz = render(parts, w, d, v); x = c * CW + (CW - s.width) // 2; assert s.height <= CH - 4, (piece, v, s.height); im.alpha_composite(s, (x, base - s.height)); meta[name][piece]['boxes'].append([x, base - s.height, x + s.width, base]); meta[name][piece]['tiles'].append(sz)
    im.convert('RGB').save(f'2_guide-{name}.png')
json.dump({'px_per_tile': PX, 'cell_w': CW, 'columns': ['facing viewer', 'facing right', 'facing away', 'facing left'], 'sheets': meta}, open('furniture_guides.json', 'w'))
# ---- sheet D again, larger (4 Oct): at 72 px a tile the toilet was only 57 px wide, and the painter blew the small pieces up by 1.2-1.65 times and flattened the round table top.
# Two sheets at 108 px a tile, so every shape is big enough to be painted inside: D1 = toilet and washstand (2 rows x 4 views), D2 = the four single pieces (2 x 2).
P2 = 108; meta['D1'] = {'px_per_tile': P2}; meta['D2'] = {'px_per_tile': P2}
im = Image.new('RGBA', (W, H), MAG + (255,))
for r, piece in enumerate(['toilet', 'washstand']):
    w, d, parts = PIECES[piece]; base = r * 512 + 512 - 40; meta['D1'][piece] = {'views': 4, 'foot_w_d': [w, d], 'boxes': []}
    for c, v in enumerate(VIEWS):
        s_, sz = render(parts, w, d, v, P2); x = c * 384 + (384 - s_.width) // 2; assert s_.height <= 500 and s_.width <= 380, (piece, v, s_.size); im.alpha_composite(s_, (x, base - s_.height)); meta['D1'][piece]['boxes'].append([x, base - s_.height, x + s_.width, base])
im.convert('RGB').save('2_guide-D1.png')
im = Image.new('RGBA', (W, H), MAG + (255,))
for i_, (k, (w, d, parts)) in enumerate(ONE.items()):
    s_, sz = render(parts, w, d, 'S', P2); cx = (i_ % 2) * 768 + 384; base = (i_ // 2) * 512 + 512 - 40; assert s_.height <= 470, (k, s_.size); x = cx - s_.width // 2; im.alpha_composite(s_, (x, base - s_.height)); meta['D2'][k] = {'views': 1, 'box': [x, base - s_.height, x + s_.width, base], 'foot': [w, d]}
im.convert('RGB').save('2_guide-D2.png')
json.dump({'px_per_tile': PX, 'cell': [CW, CH], 'columns': ['facing viewer', 'facing right', 'facing away', 'facing left'], 'sheets': meta}, open('furniture_guides.json', 'w'))
S2 = Image.new('RGB', (W * 2 + 10, H), (20, 20, 20)); S2.paste(Image.open('2_guide-D1.png'), (0, 0)); S2.paste(Image.open('2_guide-D2.png'), (W + 10, 0)); S2.resize((1540, 512)).save('_D12.png')
S = Image.new('RGB', (W + 10, H * 2 + 10), (20, 20, 20))
for i, n in enumerate('AB'): S.paste(Image.open(f'2_guide-{n}.png'), (0, i * (H + 10)))
S.resize((1152, int((H * 2 + 10) * 1152 / (W + 10)))).save('_AB.png')
S = Image.new('RGB', (W + 10, H * 2 + 10), (20, 20, 20))
for i, n in enumerate('CD'): S.paste(Image.open(f'2_guide-{n}.png'), (0, i * (H + 10)))
S.resize((1152, int((H * 2 + 10) * 1152 / (W + 10)))).save('_CD.png'); print('ok')
