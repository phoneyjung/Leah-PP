# -*- coding: utf-8 -*-
# Guides for steps 2 and 3 of the house (4 Oct). Same methods that passed for step 1:
#   rooms   = flat colour floor plan, painted over ("keep every shape where it is")
#   objects = block models drawn in the room's own projection, painted over
# Step 2 keeps the step-1 picture untouched and adds ONLY the new wing (plan columns 25-36), so the old rooms look exactly as before.
# Step 3 ground floor = step 2 + a stairs object in the old storage room; step 3 upper floor is a new picture at the step-1 scale.
import json, numpy as np
from PIL import Image, ImageDraw
PLAN = json.load(open('/home/claude/house/plan3.json', encoding='utf8'))
OUT = (20, 16, 34); TOPW = (70, 60, 66); BACK = (236, 222, 190); LOWFACE = (206, 190, 158); WIN = (150, 200, 236)
def room_guide(grid, x0, x1, C, size, floors, windows, extra=None):
    W, H = size; GW = x1 - x0; GH = len(grid); OX = (W - GW * C) // 2; OY = (H - (GH + 2) * C) // 2 + 2 * C
    g = lambda x, y: grid[y][x] if 0 <= y < GH and 0 <= x < len(grid[y]) else ' '
    im = Image.new('RGB', (W, H), OUT); d = ImageDraw.Draw(im); inside = lambda v: v not in '# PV'
    R = lambda x, y, c, a=0.0, b=1.0: d.rectangle((OX + (x - x0) * C, OY + (y + a) * C, OX + (x - x0 + 1) * C - 1, OY + (y + b) * C - 1), fill=c)
    for y in range(GH):
        for x in range(x0, x1):
            v = g(x, y)
            if v == '+':
                for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    if g(x + dx, y + dy) in floors and g(x + dx, y + dy) not in '+': v = g(x + dx, y + dy); break
            if v in floors: R(x, y, floors[v])
    for y in range(1, GH):
        for x in range(x0, x1):
            if g(x, y) != '#': continue
            R(x, y, TOPW)
            if inside(g(x, y + 1)) and g(x, y + 1) != '+': R(x, y, LOWFACE, 0.55, 1.0)
    for x in range(x0, x1):
        d.rectangle((OX + (x - x0) * C, OY - 2 * C, OX + (x - x0 + 1) * C - 1, OY + C - 1), fill=BACK if inside(g(x, 1)) else TOPW)
    d.rectangle((OX, OY - 2 * C, OX + GW * C - 1, OY - 2 * C + round(C * 0.24)), fill=TOPW)
    for wx in windows: d.rectangle((OX + (wx - x0) * C - C * 0.58, OY - 1.45 * C, OX + (wx - x0) * C + C * 0.58, OY + 0.25 * C), fill=WIN)
    if extra: extra(d, lambda x, y: (OX + (x - x0) * C, OY + y * C), C)
    return im, {'C': C, 'OX': OX, 'OY': OY, 'x0': x0, 'cols': GW, 'rows': GH}
WOOD = (198, 146, 90); meta = {}
# --- step 2: the new wing only (portrait). Library on top, corridor, play room with the ball pit below.
def wing_extra(d, P, C):
    x, y = P(26, 12); x2, y2 = P(33, 15); d.rounded_rectangle((x + 6, y + 6, x2 - 6, y2 - 6), 26, fill=(236, 120, 110)); d.rounded_rectangle((x + 26, y + 26, x2 - 26, y2 - 26), 18, fill=(110, 170, 226))   # the ball pit: padded rim, soft floor
im, meta['wing'] = room_guide(PLAN['L2']['grid'], 25, 37, 85, (1024, 1536), {'Y': (150, 104, 70), 'H': WOOD, 'O': (244, 224, 150), 'L': WOOD}, [28.5, 33], wing_extra); im.save('2_guide-wing.png')
# --- step 3: the upper floor (landscape, the step-1 scale)
def upper_extra(d, P, C):
    x, y = P(23, 10); x2, y2 = P(25, 13); d.rectangle((x, y, x2 - 1, y2 - 1), fill=(120, 84, 56))
    for i in range(9): yy = y + (y2 - y) * i / 9; d.rectangle((x + 6, yy + 2, x2 - 7, yy + (y2 - y) / 9 - 3), fill=(170 - i * 9, 124 - i * 7, 84 - i * 5))     # steps going down, darker the deeper
    xa, ya = P(0, 11); xb, yb = P(7, 14); d.rectangle((xa, ya, xb - 1, yb - 1), fill=(140, 104, 70)); d.rectangle((xa, yb - 16, xb - 1, yb - 1), fill=(96, 70, 48)); d.rectangle((xa, ya, xa + 13, yb - 1), fill=(96, 70, 48))   # balcony deck and its railing on the two open sides
im, meta['upper'] = room_guide(PLAN['L3b']['grid'], 0, 26, 59, (1536, 1024), {'B': (214, 170, 120), 'T': (176, 212, 226), 'W': (170, 150, 110), 'G': WOOD, 'R': WOOD, 'V': (140, 104, 70)}, [3, 7, 12.5, 18, 22], upper_extra); im.save('2_guide-upper.png')
# --- objects: sheet E (bookshelf, armchair, double bed, four views each, 72 px a tile) and sheet F (slide, stairs, one view each, 108 px a tile)
src = open('/home/claude/furn5/blocks.py', encoding='utf8').read(); ns = {}; exec(src[:src.index("meta = {}\nfor name, rows in SHEETS.items():")], ns)
render, B, CYL, VIEWS = ns['render'], ns['B'], ns['CYL'], ns['VIEWS']; PINE, PINE2, BEIGE, WHITE, BLUE, IRON = ns['PINE'], ns['PINE2'], ns['BEIGE'], ns['WHITE'], ns['BLUE'], ns['IRON']
BK = [(170, 70, 60), (70, 110, 160), (90, 140, 90), (200, 160, 70), (120, 80, 130), (190, 120, 70)]
books = lambda z0: [B(0.16 + i * 0.21, 0.16 + i * 0.21 + 0.17, 0.5, 0.6, z0, z0 + 0.46 + (i % 3) * 0.05, BK[(i + int(z0 * 3)) % 6]) for i in range(8)]
NEW = {
 'bookshelf': (2.0, 0.6, [B(0, 2.0, 0, 0.08, 0, 2.2, PINE2), B(0, 0.12, 0, 0.6, 0, 2.2, PINE), B(1.88, 2.0, 0, 0.6, 0, 2.2, PINE), B(0, 2.0, 0, 0.6, 2.12, 2.2, PINE)] + [B(0.12, 1.88, 0.08, 0.6, z, z + 0.08, PINE) for z in (0, 0.7, 1.4)] + books(0.08) + books(0.78) + books(1.48)),
 'armchair': (1.3, 1.1, [B(0, 1.3, 0, 0.3, 0, 1.05, PINE2), B(0, 0.25, 0.3, 1.1, 0, 0.75, PINE2), B(1.05, 1.3, 0.3, 1.1, 0, 0.75, PINE2), B(0.25, 1.05, 0.3, 1.1, 0, 0.4, PINE2), B(0.28, 1.02, 0.33, 1.07, 0.4, 0.52, BEIGE), B(0.28, 1.02, 0.3, 0.42, 0.52, 0.95, BEIGE)]),
 'bedbig': (3.0, 3.0, [B(0, 3.0, 0.15, 2.85, 0, 0.45, PINE), B(0.08, 2.92, 0.2, 2.8, 0.45, 0.7, BLUE), B(0.08, 2.92, 0.2, 1.0, 0.7, 0.72, WHITE), B(0.3, 1.35, 0.3, 0.85, 0.72, 0.86, WHITE), B(1.65, 2.7, 0.3, 0.85, 0.72, 0.86, WHITE), B(0, 3.0, 0, 0.15, 0, 1.3, PINE2), B(0, 3.0, 2.85, 3.0, 0, 0.8, PINE2)])}
RED = (224, 96, 76); SKY = (90, 150, 220); YEL = (244, 200, 80)
SLIDE = (1.6, 3.2, [B(0.1, 1.5, 0, 1.0, 0, 1.5, PINE2), B(0.1, 1.5, 0, 1.0, 1.5, 1.56, YEL)] + [B(0.3, 1.3, 1.0 + i * 0.22, 1.0 + (i + 1) * 0.22, 0, 1.5 - i * 0.14, RED) for i in range(10)] +
         [B(0.18, 0.3, 1.0 + i * 0.22, 1.0 + (i + 1) * 0.22, 0, 1.72 - i * 0.14, SKY) for i in range(10)] + [B(1.3, 1.42, 1.0 + i * 0.22, 1.0 + (i + 1) * 0.22, 0, 1.72 - i * 0.14, SKY) for i in range(10)] + [B(0.1, 0.2, 0, 1.0, 1.56, 2.1, SKY), B(1.4, 1.5, 0, 1.0, 1.56, 2.1, SKY), B(0.1, 1.5, 0, 0.1, 1.56, 2.1, SKY)])
STAIRS = (2.0, 3.0, [B(0.12, 1.88, 3.0 - (i + 1) * 0.375, 3.0 - i * 0.375, 0, (i + 1) * 0.3, PINE) for i in range(8)] + [B(0, 0.12, 0, 3.0, 0, 3.2, PINE2), B(1.88, 2.0, 0, 3.0, 0, 3.2, PINE2)])
W, H, MAG = 1536, 1024, (255, 0, 255); meta['E'] = {'px_per_tile': 72}; meta['F'] = {'px_per_tile': 108}
im = Image.new('RGBA', (W, H), MAG + (255,))
for r, (k, (w, dd, parts)) in enumerate(NEW.items()):
    base = r * 341 + 341 - 8; meta['E'][k] = {'foot_w_d': [w, dd], 'boxes': []}
    for c, v in enumerate(VIEWS):
        s, sz = render(parts, w, dd, v, 72); x = c * 384 + (384 - s.width) // 2; assert s.height <= 337 and s.width <= 380, (k, v, s.size); im.alpha_composite(s, (x, base - s.height)); meta['E'][k]['boxes'].append([x, base - s.height, x + s.width, base])
im.convert('RGB').save('2_guide-E.png')
im = Image.new('RGBA', (W, H), MAG + (255,))
for c, (k, (w, dd, parts)) in enumerate((('slide', SLIDE), ('stairs', STAIRS))):
    s, sz = render(parts, w, dd, 'S', 108); x = c * 768 + (768 - s.width) // 2; base = 1024 - 60; assert s.height <= 950, (k, s.size); im.alpha_composite(s, (x, base - s.height)); meta['F'][k] = {'foot_w_d': [w, dd], 'box': [x, base - s.height, x + s.width, base]}
im.convert('RGB').save('2_guide-F.png')
json.dump(meta, open('guides_step23.json', 'w')); print({k: (v if k in ('wing', 'upper') else list(v)) for k, v in meta.items()})
a = Image.open('2_guide-wing.png').resize((512, 768)); b = Image.open('2_guide-upper.png').resize((1152, 768)); S = Image.new('RGB', (512 + 10 + 1152, 768), (60, 60, 60)); S.paste(a, (0, 0)); S.paste(b, (522, 0)); S.save('_rooms.png')
a = Image.open('2_guide-E.png').resize((960, 640)); b = Image.open('2_guide-F.png').resize((960, 640)); S = Image.new('RGB', (960 * 2 + 10, 640), (60, 60, 60)); S.paste(a, (0, 0)); S.paste(b, (970, 0)); S.save('_objs.png')
