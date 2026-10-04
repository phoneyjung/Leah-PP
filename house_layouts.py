# -*- coding: utf-8 -*-
# House interior layouts, draft 2 (owner, 4 Oct: draft 1 was too small, hardly any room to walk).
# Bigger houses built round one rule: a HALL two tiles wide runs through the middle, rooms open onto it through doors two tiles wide,
# and the big furniture is drawn at its real size so the free walking room can be counted, not guessed.
# Units: game tiles (32 px). Rows 0-2 = back wall. The game's room sizes (HSZ) are numbers in the code and will be changed to these.
import json
from PIL import Image, ImageDraw, ImageFont
C = 34
FB = '/usr/share/fonts/opentype/tlwg/Loma-Bold.otf'; FR = '/usr/share/fonts/opentype/tlwg/Loma.otf'
L = ImageFont.Layout.RAQM
f_room = ImageFont.truetype(FB, 19, layout_engine=L); f_small = ImageFont.truetype(FR, 14, layout_engine=L); f_title = ImageFont.truetype(FB, 27, layout_engine=L); f_tiny = ImageFont.truetype(FR, 12, layout_engine=L)
COL = {'bath': (176, 214, 228), 'bed': (236, 190, 196), 'living': (222, 184, 128), 'kitchen': (240, 218, 156), 'book': (196, 180, 226), 'ball': (156, 224, 196), 'work': (182, 206, 166), 'hall': (240, 228, 204)}
NAME = {'bath': 'ห้องน้ำ', 'bed': 'ห้องนอน', 'living': 'ห้องนั่งเล่น', 'kitchen': 'ครัว', 'book': 'ห้องหนังสือ', 'ball': 'บ้านบอล', 'work': 'ห้องทำงาน', 'hall': 'โถงทางเดิน'}
WALL = (66, 58, 70); BACK = (226, 212, 184); LOW = (150, 110, 70); THING = (120, 92, 70)

def base(W, H, upper, lower, extra_walls=(), low=(), things=(), stairs=None, door=None, title='', pid=''):
    # upper = [(kind, x0, x1, open)] rooms along the back wall, rows 3..6; a wall column stands between neighbours; open=True means no wall toward the hall
    rooms = []; walls = []; x_prev_end = None
    for k, x0, x1, opn, doorx in upper:
        rooms.append([k, x0, 3, x1, 6 if not opn else 7])
        if not opn:
            for x in range(x0, x1 + 1):
                if doorx is None or x not in (doorx, doorx + 1): walls.append([x, 7, x, 7])
                else: rooms.append(['hall', x, 7, x, 7])
    xs = sorted((x0, x1) for _, x0, x1, _, _ in upper)
    for (a0, a1), (b0, b1) in zip(xs, xs[1:]):
        for x in range(a1 + 1, b0): walls.append([x, 3, x, 7])
    rooms.append(['hall', 1, 8, W - 2, 9])
    for k, x0, y0, x1, y1 in lower: rooms.append([k, x0, y0, x1, y1])
    return {'id': pid, 'title': title, 'W': W, 'H': H, 'door': door, 'rooms': rooms, 'walls': walls + [list(w) for w in extra_walls], 'low': [list(l) for l in low], 'things': [list(t) for t in things], 'stairs': stairs}

PLANS = [
 base(22, 15, pid='L1', title='ขั้น 1 · บ้านชั้นเดียว (22×15 ช่อง)', door=(10, 11),
   upper=[('bath', 1, 4, False, 2), ('bed', 6, 12, False, 8), ('kitchen', 14, 20, True, None)],
   lower=[('living', 1, 10, 20, 13)],
   things=[('อ่าง', 1, 3, 2, 3), ('อ่างล้างหน้า', 4, 3, 4, 3), ('เตียง', 6, 3, 7, 4), ('ตู้', 11, 3, 12, 3), ('เตา', 14, 3, 15, 3), ('เคาน์เตอร์', 16, 3, 19, 3), ('โต๊ะกินข้าว', 14, 5, 15, 6),
           ('ชั้น', 1, 10, 1, 11), ('โซฟา', 3, 11, 5, 11), ('พรม+โต๊ะ', 3, 13, 5, 13), ('ต้นไม้', 20, 13, 20, 13), ('ของเล่น', 17, 12, 18, 13)]),
 base(30, 16, pid='L2', title='ขั้น 2 · ชั้นเดียว ขยาย (30×16 ช่อง)', door=(10, 11),
   upper=[('bath', 1, 4, False, 2), ('bed', 6, 12, False, 8), ('kitchen', 14, 20, True, None), ('book', 22, 28, False, 24)],
   lower=[('living', 1, 10, 16, 14), ('ball', 19, 11, 28, 14), ('hall', 17, 10, 17, 14), ('hall', 22, 10, 23, 10)],
   low=[(18, 10, 18, 14), (19, 10, 21, 10), (24, 10, 28, 10)],
   things=[('อ่าง', 1, 3, 2, 3), ('อ่างล้างหน้า', 4, 3, 4, 3), ('เตียง', 6, 3, 7, 4), ('ตู้', 11, 3, 12, 3), ('เตา', 14, 3, 15, 3), ('เคาน์เตอร์', 16, 3, 19, 3), ('โต๊ะกินข้าว', 14, 5, 15, 6),
           ('ชั้นหนังสือ', 22, 3, 27, 3), ('เก้าอี้อ่าน', 27, 5, 28, 6), ('ชั้น', 1, 10, 1, 11), ('โซฟา', 3, 11, 5, 11), ('พรม+โต๊ะ', 3, 13, 5, 13), ('ของเล่น', 13, 13, 14, 14), ('สไลเดอร์', 26, 11, 28, 12)]),
 base(30, 16, pid='L3a', title='ขั้น 3 · สองชั้น · ชั้นล่าง (30×16 ช่อง)', door=(10, 11), stairs=[19, 3, 20, 5],
   upper=[('bath', 1, 4, False, 2), ('bed', 6, 12, False, 8), ('kitchen', 14, 20, True, None), ('book', 22, 28, False, 24)],
   lower=[('living', 1, 10, 16, 14), ('ball', 19, 11, 28, 14), ('hall', 17, 10, 17, 14), ('hall', 22, 10, 23, 10)],
   low=[(18, 10, 18, 14), (19, 10, 21, 10), (24, 10, 28, 10)],
   things=[('อ่าง', 1, 3, 2, 3), ('อ่างล้างหน้า', 4, 3, 4, 3), ('เตียง', 6, 3, 7, 4), ('ตู้', 11, 3, 12, 3), ('เตา', 14, 3, 15, 3), ('เคาน์เตอร์', 16, 3, 18, 3), ('โต๊ะกินข้าว', 14, 5, 15, 6),
           ('ชั้นหนังสือ', 22, 3, 27, 3), ('เก้าอี้อ่าน', 27, 5, 28, 6), ('ชั้น', 1, 10, 1, 11), ('โซฟา', 3, 11, 5, 11), ('พรม+โต๊ะ', 3, 13, 5, 13), ('ของเล่น', 13, 13, 14, 14), ('สไลเดอร์', 26, 11, 28, 12)]),
 base(30, 16, pid='L3b', title='ขั้น 3 · สองชั้น · ชั้นบน (30×16 ช่อง)', door=None, stairs=[19, 3, 20, 5],
   upper=[('bed', 1, 9, False, 4), ('bath', 11, 14, False, 12), ('hall', 16, 20, True, None), ('work', 22, 28, False, 24)],
   lower=[('living', 1, 10, 28, 14)],
   things=[('เตียงคู่', 1, 3, 3, 4), ('ตู้เสื้อผ้า', 7, 3, 9, 3), ('โต๊ะข้างเตียง', 4, 3, 4, 3), ('อ่าง', 11, 3, 12, 3), ('อ่างล้างหน้า', 14, 3, 14, 3), ('โต๊ะทำงาน', 22, 3, 24, 3), ('ชั้น', 27, 3, 28, 3), ('เก้าอี้', 23, 5, 23, 5),
           ('โซฟาใหญ่', 4, 11, 7, 11), ('พรม+โต๊ะ', 4, 13, 7, 13), ('โต๊ะเกม', 10, 12, 11, 13), ('ชั้น', 28, 10, 28, 12), ('ต้นไม้', 1, 14, 1, 14), ('เบาะนั่ง', 21, 13, 23, 14)]),
]
NAME_UP = {'L3b': {'living': 'ส่วนกลางนั่งเล่น'}}

def cells(r): return [(x, y) for x in range(r[0], r[2] + 1) for y in range(r[1], r[3] + 1)]
def analyse(p):
    W, H = p['W'], p['H']; solid = set()
    for r in p['walls'] + p['low']: solid.update(cells(r))
    if p['stairs']: solid.update(cells(p['stairs']))
    furn = set()
    for t in p['things']: furn.update(cells(t[1:]))
    floor = {(x, y) for x in range(1, W - 1) for y in range(3, H - 1)} - solid
    free = floor - furn
    start = (p['door'][0], H - 2) if p['door'] else (p['stairs'][0], p['stairs'][3] + 1)
    seen = {start} if start in free else set(); q = list(seen)
    while q:
        x, y = q.pop()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n in free and n not in seen: seen.add(n); q.append(n)
    wide = {c for c in free if any(all((c[0] + dx + i, c[1] + dy + j) in free for i in (0, 1) for j in (0, 1)) for dx in (-1, 0) for dy in (-1, 0))}
    kind = {}
    for k, x0, y0, x1, y1 in p['rooms']:
        for c in cells((x0, y0, x1, y1)): kind[c] = k
    hall = {c for c in free if kind.get(c) == 'hall'}
    area = {}
    for c in floor: area[kind.get(c, '?')] = area.get(kind.get(c, '?'), 0) + 1
    doors = []                                                    # runs of open tiles in the wall row (y=7) that have wall on both sides
    x = 1
    while x < W - 1:
        if (x, 7) in floor and (x - 1, 7) in solid:
            x1 = x
            while (x1 + 1, 7) in floor: x1 += 1
            if (x1 + 1, 7) in solid: doors.append(x1 - x + 1)
            x = x1 + 1
        else: x += 1
    return {'floor': len(floor), 'furniture': len(furn & floor), 'free': len(free), 'reach': len(seen), 'two_wide': len(wide), 'hall': len(hall), 'hall_two_wide': len(hall & wide), 'doors': doors, 'area': area}

def draw(p, st):
    W, H = p['W'], p['H']; im = Image.new('RGB', (W * C + 2, H * C + 2 + 44), (250, 247, 240)); d = ImageDraw.Draw(im); oy = 44
    d.text((4, 2), p['title'], font=f_title, fill=(40, 30, 60))
    R = lambda r, c: d.rectangle((r[0] * C, oy + r[1] * C, (r[2] + 1) * C - 1, oy + (r[3] + 1) * C - 1), fill=c)
    R((0, 0, W - 1, H - 1), WALL); R((1, 0, W - 2, 2), BACK); R((1, 3, W - 2, H - 2), COL['hall'])
    for k, x0, y0, x1, y1 in p['rooms']: R((x0, y0, x1, y1), COL[k])
    for r in p['walls']: R(r, WALL)
    for r in p['low']:
        R(r, LOW)
        for (x, y) in cells(r): d.line((x * C + 5, oy + y * C + C // 2, (x + 1) * C - 5, oy + y * C + C // 2), fill=(240, 220, 180), width=3)
    if p['stairs']:
        x0, y0, x1, y1 = p['stairs']; R(p['stairs'], (170, 130, 90))
        for i in range(8): yy = oy + y0 * C + i * ((y1 - y0 + 1) * C) / 8; d.line((x0 * C + 3, yy, (x1 + 1) * C - 3, yy), fill=(110, 80, 50), width=2)
        d.text((x0 * C + 12, oy + (y1 + 1) * C - 20), 'บันได', font=f_small, fill=(50, 30, 10))
    if p['door']:
        R((p['door'][0], H - 1, p['door'][1], H - 1), (150, 104, 60)); d.text((p['door'][0] * C + 4, oy + (H - 1) * C + 8), 'ประตูบ้าน', font=f_small, fill=(255, 255, 255))
    for x in range(W + 1): d.line((x * C, oy, x * C, oy + H * C), fill=(150, 140, 140), width=1)
    for y in range(H + 1): d.line((0, oy + y * C, W * C, oy + y * C), fill=(150, 140, 140), width=1)
    for t in p['things']:
        lab, x0, y0, x1, y1 = t; d.rounded_rectangle((x0 * C + 3, oy + y0 * C + 3, (x1 + 1) * C - 3, oy + (y1 + 1) * C - 3), 5, fill=THING, outline=(60, 40, 30), width=2)
        w = d.textlength(lab, font=f_tiny); cx = (x0 + x1 + 1) / 2 * C; cy = oy + (y0 + y1 + 1) / 2 * C
        if w < (x1 - x0 + 1) * C - 4: d.text((cx - w / 2, cy - 9), lab, font=f_tiny, fill=(255, 240, 210))
        else: d.rectangle((cx - w / 2 - 2, cy + C / 2 - 2, cx + w / 2 + 2, cy + C / 2 + 14), fill=(255, 255, 255)); d.text((cx - w / 2, cy + C / 2 - 3), lab, font=f_tiny, fill=(60, 40, 30))
    big = {}
    for k, x0, y0, x1, y1 in p['rooms']:
        a = (x1 - x0 + 1) * (y1 - y0 + 1)
        if k != 'hall' and (k not in big or a > big[k][0]): big[k] = (a, x0, y0, x1, y1)
    for k, (a, x0, y0, x1, y1) in big.items():
        t = NAME_UP.get(p['id'], {}).get(k, NAME[k]); s2 = '%d ช่อง' % st['area'].get(k, 0); w = d.textlength(t, font=f_room); w2 = d.textlength(s2, font=f_small); ww = max(w, w2)
        cx = (x0 + x1 + 1) / 2 * C; cy = oy + (y0 + y1 + 1) / 2 * C + 4
        d.rectangle((cx - ww / 2 - 5, cy - 3, cx + ww / 2 + 5, cy + 38), fill=(255, 255, 255)); d.text((cx - w / 2, cy - 4), t, font=f_room, fill=(40, 30, 60)); d.text((cx - w2 / 2, cy + 18), s2, font=f_small, fill=(90, 80, 100))
    hx = (W // 2 + 4) * C; d.text((hx, oy + 8 * C + 14), 'โถงทางเดิน กว้าง 2 ช่อง', font=f_small, fill=(110, 90, 60))
    return im

stats = [analyse(p) for p in PLANS]; ims = [draw(p, s) for p, s in zip(PLANS, stats)]
Wm = max(i.width for i in ims) + 20; S = Image.new('RGB', (Wm, sum(i.height + 20 for i in ims) + 84), (250, 247, 240)); d = ImageDraw.Draw(S); y = 10
for i in ims: S.paste(i, (10, y)); y += i.height + 20
lx = 10
for k in ('bath', 'bed', 'living', 'kitchen', 'book', 'ball', 'work', 'hall'):
    d.rectangle((lx, y, lx + 22, y + 22), fill=COL[k], outline=(90, 80, 90)); d.text((lx + 27, y - 1), NAME[k], font=f_small, fill=(40, 30, 60)); lx += 40 + d.textlength(NAME[k], font=f_small)
y += 32; d.rectangle((10, y, 32, y + 22), fill=WALL); d.text((38, y - 1), 'ผนังเต็ม', font=f_small, fill=(40, 30, 60)); d.rectangle((130, y, 152, y + 22), fill=LOW); d.text((158, y - 1), 'รั้วคอกบอลเตี้ย', font=f_small, fill=(40, 30, 60))
d.rounded_rectangle((300, y, 322, y + 22), 4, fill=THING); d.text((328, y - 1), 'ของชิ้นใหญ่ วาดตามขนาดจริง (เดินทับไม่ได้)', font=f_small, fill=(40, 30, 60))
S.save('house-layouts-2.png'); json.dump(PLANS, open('layouts2.json', 'w', encoding='utf8'), ensure_ascii=False); print(S.size)
for p, s in zip(PLANS, stats):
    print(p['id'], '| floor', s['floor'], '| furniture', s['furniture'], '| free to walk', s['free'], '(%d%%)' % round(100 * s['free'] / s['floor']), '| reachable', s['reach'], '| free tiles that sit in a 2x2 clear patch', s['two_wide'], '(%d%%)' % round(100 * s['two_wide'] / s['free']),
          '| hall', s['hall'], 'of which 2 wide', s['hall_two_wide'], '| door widths', s['doors'], '| rooms', {k: v for k, v in s['area'].items() if k != 'hall'})
