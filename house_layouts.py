# -*- coding: utf-8 -*-
# House layouts, draft 3 (owner, 4 Oct: drafts 1-2 looked stiff; make it a real family house plan; add a piano that can be played).
# Each plan is a letter map, one letter per game tile (32 px): '#' wall, '+' doorway (floor), 'E' front door, ' ' / 'P' outside / porch.
# Drawn the way an architect's plan is drawn (door swings, windows in the walls, furniture symbols), but still on the game's tile grid so it can be built as is.
import json, math
from PIL import Image, ImageDraw, ImageFont
C = 40
FB = '/usr/share/fonts/opentype/tlwg/Loma-Bold.otf'; FR = '/usr/share/fonts/opentype/tlwg/Loma.otf'; LY = ImageFont.Layout.RAQM
f_room = ImageFont.truetype(FB, 20, layout_engine=LY); f_small = ImageFont.truetype(FR, 14, layout_engine=LY); f_title = ImageFont.truetype(FB, 28, layout_engine=LY); f_tiny = ImageFont.truetype(FR, 12, layout_engine=LY)
ROOM = {'K': ('ครัว', (247, 236, 200)), 'D': ('กินข้าว', (247, 236, 200)), 'L': ('ห้องนั่งเล่น', (243, 226, 196)), 'H': ('ทางเดิน', (238, 232, 222)), 'B': ('ห้องนอน', (244, 216, 220)), 'T': ('ห้องน้ำ', (208, 230, 240)),
        'S': ('เก็บของ', (228, 222, 210)), 'R': ('โถงบันได', (228, 222, 210)), 'Y': ('ห้องหนังสือ', (224, 214, 240)), 'O': ('บ้านบอล', (200, 236, 216)), 'W': ('ห้องทำงาน', (214, 228, 204)), 'G': ('ส่วนกลางนั่งเล่น', (243, 226, 196)),
        'V': ('ระเบียง', (226, 206, 176)), 'P': ('ระเบียงหน้าบ้าน', (226, 206, 176))}
INK = (52, 44, 60); WALLC = (60, 52, 66)

L1 = [
"##########################",
"#KKKKKKKKDDDDDD#BBBBBBBBB#",
"#KKKKKKKKDDDDDD#BBBBBBBBB#",
"#KKKKKKKKDDDDDD#BBBBBBBBB#",
"#KKKKKKKKDDDDDD#BBBBBBBBB#",
"#LLLLLLLLLLLLLL#BBBBBBBBB#",
"#LLLLLLLLLLLLLL##++#######",
"#LLLLLLLLLLLLLL+HHHHHHHHH#",
"#LLLLLLLLLLLLLL+HHHHHHHHH#",
"#LLLLLLLLLLLLLL##++###++##",
"###EE###LLLLLLL#TTTT#SSSS#",
"PPPPPPP#LLLLLLL#TTTT#SSSS#",
"PPPPPPP#LLLLLLL#TTTT#SSSS#",
"PPPPPPP###################"]
EXT = [                                  # the extension added in step 2, to the right of the old outside wall (11 columns)
"###########", "YYYYYYYYYY#", "YYYYYYYYYY#", "YYYYYYYYYY#", "YYYYYYYYYY#", "YYYYYYYYYY#", "###++######", "HHHHHHHHHH#", "HHHHHHHHHH#", "###++######", "OOOOOOOOOO#", "OOOOOOOOOO#", "OOOOOOOOOO#", "OOOOOOOOOO#", "OOOOOOOOOO#", "###########"]
def extend(base, stairs=False):
    rows = [r for r in base] + ["P" * 7 + " " * 19, " " * 26]
    out = []
    for i, r in enumerate(rows):
        r = r.replace('S', 'R') if stairs else r
        if i in (7, 8): r = r[:25] + '+'                       # the corridor runs on through the old outside wall
        elif i in (14, 15): r = "       " + " " * 18 + ("#" if True else " ")
        out.append(r[:26] + EXT[i])
    out[14] = " " * 25 + "#" + EXT[14]; out[15] = " " * 25 + "#" + EXT[15]
    out[13] = base[13][:25] + "#" + EXT[13]
    return out
L2 = extend(L1); L3A = extend(L1, stairs=True)
L3B = [
"##########################",
"#BBBBBBBBB#TTTT#WWWWWWWWW#",
"#BBBBBBBBB#TTTT#WWWWWWWWW#",
"#BBBBBBBBB#TTTT#WWWWWWWWW#",
"#BBBBBBBBB#TTTT#WWWWWWWWW#",
"#BBBBBBBBB##++##WWWWWWWWW#",
"####++#####GGGG###++######",
"#GGGGGGGGGGGGGGGGGGGGGGGG#",
"#GGGGGGGGGGGGGGGGGGGGGGGG#",
"#GGGGGGGGGGGGGGGGGGGGGGGG#",
"###++###GGGGGGGGGGGG#RRRR#",
"VVVVVVV#GGGGGGGGGGGG#RRRR#",
"VVVVVVV#GGGGGGGGGGGG#RRRR#",
"VVVVVVV###################"]

# furniture: (symbol, x0, y0, x1, y1[, option]) in tiles, inclusive
F1 = [('counter', 1, 1, 6, 1), ('stove', 7, 1, 8, 1), ('counter', 1, 2, 1, 3), ('island', 4, 3, 6, 3), ('table', 10, 2, 12, 3), ('piano', 1, 6, 1, 8), ('sofa', 4, 6, 7, 6), ('rug', 4, 7, 7, 8), ('shelf', 11, 12, 13, 12), ('plant', 14, 5, 14, 5),
      ('bed', 16, 1, 18, 3), ('wardrobe', 22, 1, 24, 1), ('desk', 23, 4, 24, 5), ('tub', 16, 12, 18, 12), ('toilet', 19, 10, 19, 10), ('sink', 16, 10, 16, 10), ('washer', 21, 12, 22, 12), ('box', 24, 11, 24, 12)]
F2 = F1 + [('shelf', 26, 1, 33, 1), ('shelf', 35, 2, 35, 4), ('armchair', 27, 4, 28, 5), ('readtable', 31, 3, 32, 4), ('slide', 33, 10, 35, 11), ('balls', 26, 12, 32, 14)]
F3A = [f for f in F2 if f[0] not in ('washer', 'box')] + [('stairs', 23, 10, 24, 12)]
F3B = [('bedbig', 1, 1, 4, 3), ('wardrobe', 7, 1, 9, 1), ('desk', 8, 4, 9, 5), ('tub', 11, 1, 13, 1), ('toilet', 14, 1, 14, 1), ('sink', 11, 4, 11, 4), ('desk', 16, 1, 19, 1), ('shelf', 22, 1, 24, 1), ('armchair', 23, 4, 24, 5),
       ('sofa', 9, 8, 13, 8), ('rug', 9, 9, 13, 10), ('table', 15, 10, 17, 11), ('shelf', 17, 12, 19, 12), ('plant', 1, 7, 1, 7), ('stairs', 23, 10, 24, 12), ('chairs', 0, 12, 1, 12)]
PLANS = [('L1', 'ขั้น 1 · บ้านชั้นเดียว', L1, F1), ('L2', 'ขั้น 2 · ต่อเติมปีกขวา: ห้องหนังสือ + บ้านบอล', L2, F2), ('L3a', 'ขั้น 3 · บ้านสองชั้น · ชั้นล่าง', L3A, F3A), ('L3b', 'ขั้น 3 · บ้านสองชั้น · ชั้นบน', L3B, F3B)]
NAMES = {'wardrobe': 'ตู้เสื้อผ้า', 'piano': 'เปียโน', 'slide': 'สไลเดอร์', 'washer': 'ซักผ้า', 'stairs': 'บันได', 'island': 'เคาน์เตอร์กลาง', 'readtable': 'โต๊ะอ่าน'}
SOLID_F = {'rug': False, 'balls': False}                     # things you walk over

def cells(f): return [(x, y) for x in range(f[1], f[3] + 1) for y in range(f[2], f[4] + 1)]
def analyse(grid, furn):
    H = len(grid); W = max(len(r) for r in grid); g = {(x, y): (grid[y][x] if x < len(grid[y]) else ' ') for y in range(H) for x in range(W)}
    inside = {c for c, v in g.items() if v not in '# P'}; taken = set(); bad = []
    for f in furn:
        for c in cells(f):
            if c not in inside or g[c] in '+E': bad.append((f[0], c))
            if SOLID_F.get(f[0], True):
                if c in taken: bad.append((f[0], c, 'overlap'))
                taken.add(c)
    free = inside - taken; start = next(c for c, v in g.items() if v == 'E') if any(v == 'E' for v in g.values()) else next(c for c, v in g.items() if v == 'R' and c not in taken)
    seen = {start}; q = [start]
    while q:
        x, y = q.pop()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n in free and n not in seen: seen.add(n); q.append(n)
    wide = {c for c in free if any(all((c[0] + dx + i, c[1] + dy + j) in free for i in (0, 1) for j in (0, 1)) for dx in (-1, 0) for dy in (-1, 0))}
    area = {}
    for c in inside: area[g[c]] = area.get(g[c], 0) + 1
    doors = sorted(c for c, v in g.items() if v == '+'); runs = {}
    for (x, y) in doors:
        k = ('h', y) if ((x - 1, y) in doors or (x + 1, y) in doors) else ('v', x); runs[k + ((x if k[0] == 'h' else y) // 3,)] = runs.get(k + ((x if k[0] == 'h' else y) // 3,), 0) + 1
    return {'size': [W, H], 'inside': len(inside), 'furniture': len(taken), 'free': len(free), 'reach': len(seen), 'two_wide_%': round(100 * len(wide) / len(free)), 'area': area, 'bad': bad, 'door_tiles': len(doors)}, g, W, H

def sym(d, f, ox, oy):
    k = f[0]; x0, y0, x1, y1 = f[1] * C + ox, f[2] * C + oy, (f[3] + 1) * C + ox, (f[4] + 1) * C + oy; p = 5; w = (255, 255, 255)
    box = lambda fill=w, r=6, pad=p: d.rounded_rectangle((x0 + pad, y0 + pad, x1 - pad, y1 - pad), r, fill=fill, outline=INK, width=2)
    if k in ('bed', 'bedbig'):
        box((255, 250, 244)); n = 2 if k == 'bedbig' else 1; pw = (x1 - x0 - 2 * p - 8) / n
        for i in range(n): d.rounded_rectangle((x0 + p + 6 + i * pw, y0 + p + 6, x0 + p + i * pw + pw, y0 + p + 26), 5, fill=w, outline=INK, width=2)
        d.rectangle((x0 + p + 2, y0 + p + 34, x1 - p - 2, y1 - p - 2), fill=(214, 228, 244), outline=INK, width=2)
    elif k == 'sofa':
        box((206, 222, 200)); d.rounded_rectangle((x0 + p, y0 + p, x1 - p, y0 + p + 11), 4, fill=(176, 198, 170), outline=INK, width=2)
        for xx in (x0 + p, x1 - p - 11): d.rounded_rectangle((xx, y0 + p, xx + 11, y1 - p), 4, fill=(176, 198, 170), outline=INK, width=2)
    elif k == 'armchair':
        box((206, 222, 200)); d.rounded_rectangle((x0 + p, y0 + p, x1 - p, y0 + p + 12), 4, fill=(176, 198, 170), outline=INK, width=2)
    elif k == 'rug':
        d.rounded_rectangle((x0 + 8, y0 + 8, x1 - 8, y1 - 8), 10, fill=(232, 200, 190), outline=(170, 110, 100), width=2); d.rounded_rectangle((x0 + 16, y0 + 16, x1 - 16, y1 - 16), 8, outline=(170, 110, 100), width=1)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; d.rounded_rectangle((cx - 30, cy - 12, cx + 30, cy + 12), 5, fill=w, outline=INK, width=2)
    elif k in ('table', 'readtable'):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; rw, rh = (x1 - x0) / 2 - 16, (y1 - y0) / 2 - 12
        for a in range(0, 360, 60 if k == 'table' else 90): px, py = cx + (rw + 9) * math.cos(math.radians(a)), cy + (rh + 9) * math.sin(math.radians(a)); d.ellipse((px - 7, py - 7, px + 7, py + 7), fill=w, outline=INK, width=2)
        d.ellipse((cx - rw, cy - rh, cx + rw, cy + rh), fill=(240, 222, 190), outline=INK, width=2)
    elif k in ('counter', 'island', 'shelf', 'wardrobe', 'desk', 'box'):
        box({'counter': (236, 232, 226), 'island': (236, 232, 226), 'shelf': (226, 206, 176), 'wardrobe': (226, 206, 176), 'desk': (240, 222, 190), 'box': (226, 206, 176)}[k], 3)
        if k == 'shelf':
            horiz = (x1 - x0) >= (y1 - y0); n = int(((x1 - x0) if horiz else (y1 - y0)) / 14)
            for i in range(1, n):
                if horiz: d.line((x0 + p + i * 14, y0 + p + 3, x0 + p + i * 14, y1 - p - 3), fill=INK, width=1)
                else: d.line((x0 + p + 3, y0 + p + i * 14, x1 - p - 3, y0 + p + i * 14), fill=INK, width=1)
        if k == 'wardrobe': d.line(((x0 + x1) / 2, y0 + p, (x0 + x1) / 2, y1 - p), fill=INK, width=2)
        if k == 'counter' and (x1 - x0) > 3 * C: cx = x0 + 2.5 * C; d.rounded_rectangle((cx - 16, y0 + 10, cx + 16, y1 - 10), 5, fill=(214, 230, 240), outline=INK, width=2)
    elif k == 'stove':
        box((236, 232, 226), 3)
        for i in range(2):
            for j in range(2): cx = x0 + (x1 - x0) * (0.3 + 0.4 * i); cy = y0 + (y1 - y0) * (0.33 + 0.36 * j); d.ellipse((cx - 6, cy - 5, cx + 6, cy + 5), outline=INK, width=2)
    elif k == 'tub': box((255, 255, 255), 14); d.rounded_rectangle((x0 + 11, y0 + 10, x1 - 11, y1 - 10), 10, fill=(214, 236, 246), outline=INK, width=1)
    elif k == 'toilet': d.rectangle((x0 + 9, y0 + 5, x1 - 9, y0 + 14), fill=w, outline=INK, width=2); d.ellipse((x0 + 8, y0 + 12, x1 - 8, y1 - 5), fill=w, outline=INK, width=2)
    elif k == 'sink': box(w, 4); d.ellipse((x0 + 11, y0 + 11, x1 - 11, y1 - 11), fill=(214, 236, 246), outline=INK, width=2)
    elif k == 'plant': d.ellipse((x0 + 7, y0 + 7, x1 - 7, y1 - 7), fill=(170, 210, 160), outline=(70, 120, 70), width=2); d.ellipse((x0 + 15, y0 + 15, x1 - 15, y1 - 15), fill=(120, 170, 110))
    elif k == 'washer': box(w, 4); d.ellipse((x0 + 12, y0 + 9, x0 + C - 12, y1 - 9), outline=INK, width=2); d.ellipse((x0 + C + 12, y0 + 9, x1 - 12, y1 - 9), outline=INK, width=2)
    elif k == 'piano':                                         # upright piano against the left wall: body, keys along its open side, a stool
        d.rectangle((x0 + 4, y0 + 6, x0 + 22, y1 - 6), fill=(60, 48, 44), outline=INK, width=2); d.rectangle((x0 + 22, y0 + 6, x1 - 4, y1 - 6), fill=w, outline=INK, width=2)
        n = int((y1 - y0 - 12) / 9)
        for i in range(1, n): yy = y0 + 6 + i * 9; d.line((x0 + 22, yy, x1 - 4, yy), fill=INK, width=1); (i % 7 not in (0, 3)) and d.rectangle((x0 + 22, yy - 3, x0 + 30, yy + 3), fill=INK)
        d.ellipse((x1 + 8, (y0 + y1) / 2 - 11, x1 + 30, (y0 + y1) / 2 + 11), fill=(206, 222, 200), outline=INK, width=2)
    elif k == 'slide':
        d.rounded_rectangle((x1 - C + 4, y0 + 4, x1 - 4, y0 + C - 4), 4, fill=(250, 214, 150), outline=INK, width=2)
        for i in range(3): d.line((x1 - C + 8, y0 + 10 + i * 8, x1 - 8, y0 + 10 + i * 8), fill=INK, width=1)
        d.polygon([(x1 - C + 4, y0 + C - 6), (x1 - 4, y0 + C - 6), (x1 - C * 0.6, y1 - 6), (x0 + 10, y1 - 6), (x0 + 6, y1 - C * 0.8)], fill=(250, 190, 120), outline=INK); d.line((x1 - C / 2, y0 + C, x0 + C * 0.8, y1 - 12), fill=INK, width=2)
    elif k == 'balls':
        d.rounded_rectangle((x0 + 3, y0 + 3, x1 - 3, y1 - 3), 14, outline=(110, 150, 130), width=2); import random; rr = random.Random(7)
        for _ in range(90): bx = rr.uniform(x0 + 12, x1 - 12); by = rr.uniform(y0 + 12, y1 - 12); d.ellipse((bx - 6, by - 6, bx + 6, by + 6), fill=rr.choice([(240, 100, 100), (250, 200, 80), (100, 170, 240), (130, 210, 130), (200, 130, 230)]), outline=INK)
    elif k == 'stairs':
        d.rectangle((x0 + 4, y0 + 4, x1 - 4, y1 - 4), fill=(236, 226, 206), outline=INK, width=2); n = 9
        for i in range(1, n): yy = y0 + 4 + i * (y1 - y0 - 8) / n; d.line((x0 + 4, yy, x1 - 4, yy), fill=INK, width=1)
        d.line(((x0 + x1) / 2, y1 - 10, (x0 + x1) / 2, y0 + 12), fill=INK, width=2); d.polygon([((x0 + x1) / 2 - 7, y0 + 20), ((x0 + x1) / 2 + 7, y0 + 20), ((x0 + x1) / 2, y0 + 8)], fill=INK)
    elif k == 'chairs':
        for i in range(2): cx = x0 + (x1 - x0) * (0.25 + 0.5 * i); d.rounded_rectangle((cx - 16, y0 + 12, cx + 16, y1 - 12), 6, fill=(206, 222, 200), outline=INK, width=2)
    if k in NAMES:
        t = NAMES[k]; tw = d.textlength(t, font=f_tiny); cx = (x0 + x1) / 2; ty = y1 - 2 if k not in ('balls', 'slide') else y0 - 16
        if k == 'piano': cx += C * 0.9; ty = y1 - 6
        d.rectangle((cx - tw / 2 - 2, ty, cx + tw / 2 + 2, ty + 15), fill=(255, 255, 255)); d.text((cx - tw / 2, ty - 1), t, font=f_tiny, fill=INK)

def draw(pid, title, grid, furn, st, g, W, H):
    im = Image.new('RGB', (W * C + 24, H * C + 70), (252, 250, 246)); d = ImageDraw.Draw(im); ox, oy = 12, 52
    d.text((ox, 6), '%s (%d×%d ช่อง)' % (title, W, H), font=f_title, fill=INK)
    for (x, y), v in g.items():
        X, Y = ox + x * C, oy + y * C
        if v in ROOM or v in '+E':
            col = ROOM[v][1] if v in ROOM else (243, 226, 196)
            d.rectangle((X, Y, X + C, Y + C), fill=col)
            if v in 'LGKDBWYHRS':                             # floor boards
                for i in range(1, 4): d.line((X, Y + i * C / 4, X + C, Y + i * C / 4), fill=tuple(int(c * 0.93) for c in col), width=1)
            if v in 'T': d.line((X + C / 2, Y, X + C / 2, Y + C), fill=(186, 212, 224), width=1); d.line((X, Y + C / 2, X + C, Y + C / 2), fill=(186, 212, 224), width=1)
            if v in 'PV':
                for i in range(1, 4): d.line((X + i * C / 4, Y, X + i * C / 4, Y + C), fill=(200, 176, 140), width=1)
    for (x, y), v in g.items():                                  # walls: a thick dark line through the middle of each wall tile, joined to its neighbours, like a drawn plan
        if v != '#': continue
        X, Y = ox + x * C + C / 2, oy + y * C + C / 2; t = 9
        d.rectangle((X - t, Y - t, X + t, Y + t), fill=WALLC)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if g.get((x + dx, y + dy)) in ('#',): d.rectangle((min(X, X + dx * C / 2) - (t if dx == 0 else 0), min(Y, Y + dy * C / 2) - (t if dy == 0 else 0), max(X, X + dx * C / 2) + (t if dx == 0 else 0), max(Y, Y + dy * C / 2) + (t if dy == 0 else 0)), fill=WALLC)
            elif g.get((x + dx, y + dy)) in ('+', 'E'):       # wall end at a door: run the wall to the tile edge
                d.rectangle((min(X, X + dx * C / 2) - (t if dx == 0 else 0), min(Y, Y + dy * C / 2) - (t if dy == 0 else 0), max(X, X + dx * C / 2) + (t if dx == 0 else 0), max(Y, Y + dy * C / 2) + (t if dy == 0 else 0)), fill=WALLC)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):        # floor up to the wall line where a room meets a wall tile
            v2 = g.get((x + dx, y + dy), ' ')
            if v2 in ROOM:
                col = ROOM[v2][1]
                if dx: d.rectangle((X + (t if dx > 0 else -C / 2), Y - C / 2, X + (C / 2 if dx > 0 else -t), Y + C / 2), fill=col)
                else: d.rectangle((X - C / 2, Y + (t if dy > 0 else -C / 2), X + C / 2, Y + (C / 2 if dy > 0 else -t)), fill=col)
    for (x, y), v in g.items():
        if v != '#': continue
        X, Y = ox + x * C + C / 2, oy + y * C + C / 2; t = 9; d.rectangle((X - t, Y - t, X + t, Y + t), fill=WALLC)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if g.get((x + dx, y + dy)) in ('#', '+', 'E'): d.rectangle((min(X, X + dx * C / 2) - (t if dx == 0 else 0), min(Y, Y + dy * C / 2) - (t if dy == 0 else 0), max(X, X + dx * C / 2) + (t if dx == 0 else 0), max(Y, Y + dy * C / 2) + (t if dy == 0 else 0)), fill=WALLC)
    done = set()                                                 # doors: a gap two tiles wide, two leaves with their swing arcs
    for (x, y), v in sorted(g.items()):
        if v not in '+E' or (x, y) in done: continue
        horiz = g.get((x + 1, y)) in ('+', 'E'); n = 2 if (horiz or g.get((x, y + 1)) in ('+', 'E')) else 1
        cellsd = [(x + i, y) if horiz else (x, y + i) for i in range(n)]; done.update(cellsd)
        X0, Y0 = ox + x * C, oy + y * C; col = (243, 226, 196)
        if horiz or n == 1:
            d.rectangle((X0, Y0 + C / 2 - 10, X0 + n * C, Y0 + C / 2 + 10), fill=col); yy = Y0 + C / 2
            for sx, hx in ((X0, 1), (X0 + n * C, -1)):
                d.line((sx, yy, sx, yy + C * 0.95), fill=INK, width=3); d.arc((sx - C * 0.95, yy - C * 0.95, sx + C * 0.95, yy + C * 0.95), 0 if hx > 0 else 90, 90 if hx > 0 else 180, fill=INK, width=1)
            if v == 'E': d.text((X0 + 2 * C + 8, Y0 + C + 2), 'ประตูบ้าน', font=f_small, fill=INK)
        else:
            d.rectangle((X0 + C / 2 - 10, Y0, X0 + C / 2 + 10, Y0 + n * C), fill=col); xx = X0 + C / 2
            d.line((xx - 4, Y0, xx - 4, Y0 + n * C), fill=(150, 140, 130), width=1); d.line((xx + 4, Y0, xx + 4, Y0 + n * C), fill=(150, 140, 130), width=1)
    # windows: double blue lines in the outer walls, every few tiles along a room
    for (x, y), v in g.items():
        if v != '#': continue
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            a = g.get((x + dx, y + dy), ' '); b = g.get((x - dx, y - dy), ' ')
            if a in ROOM and a not in 'PVHSR' and b in (' ', 'P', 'V', None) and ((x if dy else y) % 4 == 2):
                X, Y = ox + x * C + C / 2, oy + y * C + C / 2
                if dy: d.rectangle((X - C * 0.9, Y - 9, X + C * 0.9, Y + 9), fill=(255, 255, 255), outline=INK, width=2); d.line((X - C * 0.9, Y, X + C * 0.9, Y), fill=(90, 150, 210), width=3)
                else: d.rectangle((X - 9, Y - C * 0.9, X + 9, Y + C * 0.9), fill=(255, 255, 255), outline=INK, width=2); d.line((X, Y - C * 0.9, X, Y + C * 0.9), fill=(90, 150, 210), width=3)
    for f in furn: sym(d, f, ox, oy)
    lab = {}
    for (x, y), v in g.items():
        if v in ROOM and v not in 'HR': lab.setdefault(v, []).append((x, y))
    taken = {c for f in furn if SOLID_F.get(f[0], True) or f[0] == 'balls' for c in cells(f)}
    for v, cs in lab.items():
        cset = set(cs)                                            # the label needs three clear tiles in a row, away from doors, furniture and walls
        def ok(c): return all((c[0] + i, c[1]) in cset and (c[0] + i, c[1]) not in taken and not any(g.get((c[0] + i + dx, c[1] + dy)) in ('+', 'E') for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))) for i in (-1, 0, 1))
        cand = [c for c in cs if ok(c)]
        def room_score(c):
            dist = min([abs(c[0] - t[0]) + abs(c[1] - t[1]) for t in taken] + [6]); edge = min(sum(1 for i in range(1, 6) if (c[0] + i, c[1]) in cset), sum(1 for i in range(1, 6) if (c[0] - i, c[1]) in cset), 4)
            return (dist + edge, -abs(c[1] - sum(y for _, y in cs) / len(cs)))
        if v in 'PV': cand = [c for c in cand if c[1] == max(y for _, y in cs)] or cand
        best = max(cand, key=room_score) if cand else (round(sum(x for x, _ in cs) / len(cs)), round(sum(y for _, y in cs) / len(cs)))
        t = ROOM[v][0]; s2 = '%d ช่อง' % len(cs); w = d.textlength(t, font=f_room); w2 = d.textlength(s2, font=f_small); cx = ox + best[0] * C + C / 2; cy = oy + best[1] * C
        d.text((cx - w / 2, cy - 2), t, font=f_room, fill=INK); d.text((cx - w2 / 2, cy + 22), s2, font=f_small, fill=(110, 100, 120))
    return im

ims = []; rep = []
for pid, title, grid, furn in PLANS:
    st, g, W, H = analyse(grid, furn); rep.append((pid, st)); ims.append(draw(pid, title, grid, furn, st, g, W, H))
Wm = max(i.width for i in ims); S = Image.new('RGB', (Wm, sum(i.height + 16 for i in ims)), (252, 250, 246)); y = 0
for i in ims: S.paste(i, (0, y)); y += i.height + 16
S.save('house-plan-3.png'); json.dump({p[0]: {'grid': p[2], 'furniture': p[3]} for p in PLANS}, open('plan3.json', 'w', encoding='utf8'), ensure_ascii=False); print(S.size)
for pid, st in rep: print(pid, st['size'], '| inside', st['inside'], '| furniture', st['furniture'], '| free', st['free'], '(%d%%)' % round(100 * st['free'] / st['inside']), '| reachable', st['reach'], '| 2-wide', str(st['two_wide_%']) + '%', '| misplaced', st['bad'][:4], '| rooms', {ROOM[k][0] if k in ROOM else k: v for k, v in st['area'].items() if k in ROOM})
