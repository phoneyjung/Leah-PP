# -*- coding: utf-8 -*-
# House interior layouts, three steps (owner brief, 4 Oct). Units: game tiles (32 px). Rows 0-2 = back wall, floor = rows 3..H-2, cols 1..W-2.
# Room sizes come from the game (HSZ): 14x10, 18x11, 22x12.
import json
from PIL import Image, ImageDraw, ImageFont
C = 46                                   # drawing size of one tile in the plan picture
FB = '/usr/share/fonts/opentype/tlwg/Loma-Bold.otf'; FR = '/usr/share/fonts/opentype/tlwg/Loma.otf'
f_room = ImageFont.truetype(FB, 21, layout_engine=ImageFont.Layout.RAQM); f_small = ImageFont.truetype(FR, 16, layout_engine=ImageFont.Layout.RAQM); f_title = ImageFont.truetype(FB, 30, layout_engine=ImageFont.Layout.RAQM)
COL = {'bath': (176, 214, 228), 'bed': (236, 190, 196), 'living': (214, 170, 110), 'kitchen': (238, 214, 150), 'book': (190, 172, 220), 'ball': (150, 220, 190), 'work': (176, 200, 160), 'hall': (224, 196, 150)}
NAME = {'bath': 'ห้องน้ำ', 'bed': 'ห้องนอน', 'living': 'ห้องนั่งเล่น', 'kitchen': 'ครัว', 'book': 'ห้องหนังสือ', 'ball': 'บ้านบอล', 'work': 'ห้องทำงาน', 'hall': 'ส่วนกลางนั่งเล่น'}
WALL = (66, 58, 70); BACK = (226, 212, 184); LOW = (150, 110, 70)

# every plan: rooms = [kind, x0, y0, x1, y1] inclusive tiles · walls = full walls (solid) · low = half walls / play-pen fence (solid, see over) ·
# doors = gaps in a wall line · things = [label, x, y] where the big fixed things go · stairs = [x0, y0, x1, y1]
PLANS = [
 {'id': 'L1', 'title': 'ขั้น 1 · บ้านชั้นเดียว (14×10 ช่อง)', 'W': 14, 'H': 10, 'door': 7,
  'rooms': [['bath', 1, 3, 3, 5], ['bed', 5, 3, 8, 5], ['kitchen', 10, 3, 12, 5], ['living', 4, 6, 12, 8], ['living', 1, 7, 3, 8], ['living', 9, 5, 9, 5], ['living', 4, 5, 4, 5]],
  'walls': [[4, 3, 4, 4], [1, 6, 3, 6]], 'low': [[9, 3, 9, 4]],
  'things': [['อ่าง', 1, 3], ['เตียง', 5, 3], ['เตา', 11, 3], ['โซฟา', 8, 6], ['โต๊ะ', 11, 7]], 'stairs': None, 'windows': [2, 6.5, 11]},
 {'id': 'L2', 'title': 'ขั้น 2 · บ้านชั้นเดียว ขยาย (18×11 ช่อง)', 'W': 18, 'H': 11, 'door': 9,
  'rooms': [['bath', 1, 3, 3, 5], ['book', 1, 7, 4, 9], ['bed', 5, 3, 7, 5], ['kitchen', 9, 3, 11, 5], ['living', 5, 6, 11, 9], ['living', 8, 5, 8, 5], ['living', 4, 5, 4, 6], ['living', 12, 7, 12, 7], ['ball', 13, 3, 16, 9]],
  'walls': [[4, 3, 4, 4], [1, 6, 3, 6]], 'low': [[8, 3, 8, 4], [12, 3, 12, 6], [12, 8, 12, 9]],
  'things': [['อ่าง', 1, 3], ['ชั้นหนังสือ', 1, 7], ['เตียง', 5, 3], ['เตา', 10, 3], ['โซฟา', 8, 7], ['สไลเดอร์', 15, 3], ['บอลหลายสี', 13, 8]], 'stairs': None, 'windows': [2, 6, 10, 14.5]},
 {'id': 'L3a', 'title': 'ขั้น 3 · บ้านสองชั้น · ชั้นล่าง (22×12 ช่อง)', 'W': 22, 'H': 12, 'door': 11,
  'rooms': [['bath', 1, 3, 3, 5], ['book', 1, 7, 4, 10], ['bed', 5, 3, 8, 5], ['kitchen', 10, 3, 12, 5], ['living', 5, 6, 14, 10], ['living', 9, 5, 9, 5], ['living', 4, 5, 4, 6], ['living', 13, 5, 14, 5], ['living', 15, 8, 15, 8], ['ball', 16, 3, 20, 10]],
  'walls': [[4, 3, 4, 4], [1, 6, 3, 6]], 'low': [[9, 3, 9, 4], [15, 3, 15, 7], [15, 9, 15, 10]],
  'things': [['อ่าง', 1, 3], ['ชั้นหนังสือ', 1, 7], ['เตียง', 5, 3], ['เตา', 11, 3], ['โซฟา', 9, 8], ['สไลเดอร์', 19, 3], ['บอลหลายสี', 16, 9]], 'stairs': [13, 3, 14, 4], 'windows': [2, 6.5, 11, 18]},
 {'id': 'L3b', 'title': 'ขั้น 3 · บ้านสองชั้น · ชั้นบน (22×12 ช่อง)', 'W': 22, 'H': 12, 'door': None,
  'rooms': [['bed', 1, 3, 6, 6], ['bath', 1, 8, 3, 10], ['work', 16, 3, 20, 6], ['hall', 8, 3, 14, 7], ['hall', 5, 8, 20, 10], ['hall', 15, 6, 15, 7], ['hall', 16, 7, 20, 7], ['hall', 7, 6, 7, 6], ['hall', 4, 9, 4, 9]],
  'walls': [[7, 3, 7, 5], [1, 7, 7, 7], [4, 8, 4, 8], [4, 10, 4, 10], [15, 3, 15, 5]], 'low': [],
  'things': [['เตียงคู่', 2, 3], ['อ่าง', 1, 8], ['โต๊ะทำงาน', 18, 3], ['โซฟา', 10, 9], ['พรม', 10, 5]], 'stairs': [13, 3, 14, 4], 'windows': [3.5, 10, 18]},
]

def draw(pl):
    W, H = pl['W'], pl['H']; im = Image.new('RGB', (W * C + 2, H * C + 2 + 50), (250, 247, 240)); d = ImageDraw.Draw(im); oy = 50
    d.text((4, 4), pl['title'], font=f_title, fill=(40, 30, 60))
    R = lambda x0, y0, x1, y1, c: d.rectangle((x0 * C, oy + y0 * C, (x1 + 1) * C - 1, oy + (y1 + 1) * C - 1), fill=c)
    R(0, 0, W - 1, H - 1, WALL); R(1, 0, W - 2, 2, BACK)
    R(1, 3, W - 2, H - 2, (205, 190, 170))                       # any floor not given to a room
    for k, x0, y0, x1, y1 in pl['rooms']: R(x0, y0, x1, y1, COL[k])
    for x0, y0, x1, y1 in pl['walls']: R(x0, y0, x1, y1, WALL)
    for x0, y0, x1, y1 in pl['low']:
        R(x0, y0, x1, y1, LOW)
        for yy in range(y0, y1 + 1):
            for xx in range(x0, x1 + 1): d.line((xx * C + 6, oy + yy * C + C // 2, (xx + 1) * C - 6, oy + yy * C + C // 2), fill=(240, 220, 180), width=4)
    for wx in pl['windows']: d.rectangle((wx * C - 26, oy + 1.0 * C, wx * C + 26, oy + 2.4 * C), fill=(150, 200, 236), outline=(110, 80, 50), width=3)
    if pl['stairs']:
        x0, y0, x1, y1 = pl['stairs']; R(x0, y0, x1, y1, (170, 130, 90))
        for i in range(6): yy = oy + y0 * C + i * ((y1 - y0 + 1) * C) / 6; d.line((x0 * C + 3, yy, (x1 + 1) * C - 3, yy), fill=(110, 80, 50), width=2)
        d.text((x0 * C + 6, oy + (y1 + 1) * C - 26), 'บันได', font=f_small, fill=(60, 40, 20))
    if pl['door'] is not None:
        R(pl['door'], H - 1, pl['door'], H - 1, (150, 104, 60)); d.text((pl['door'] * C - 14, oy + (H - 1) * C + 10), 'ประตูบ้าน', font=f_small, fill=(255, 255, 255))
    for x in range(W + 1): d.line((x * C, oy, x * C, oy + H * C), fill=(0, 0, 0, 40) if False else (120, 110, 110), width=1)
    for y in range(H + 1): d.line((0, oy + y * C, W * C, oy + y * C), fill=(120, 110, 110), width=1)
    big = {}; tot = {}                                            # one label per room, on its biggest rectangle; the size shown is the whole room
    for k, x0, y0, x1, y1 in pl['rooms']:
        a = (x1 - x0 + 1) * (y1 - y0 + 1); tot[k] = tot.get(k, 0) + a
        if k not in big or a > big[k][0]: big[k] = (a, x0, y0, x1, y1)
    for k, (a, x0, y0, x1, y1) in big.items():
        t = NAME[k]; w = d.textlength(t, font=f_room); cx = (x0 + x1 + 1) / 2 * C; cy = oy + (y0 + y1 + 1) / 2 * C + 6
        s2 = '%d ช่อง' % tot[k]; w2 = d.textlength(s2, font=f_small); ww = max(w, w2)
        d.rectangle((cx - ww / 2 - 6, cy - 4, cx + ww / 2 + 6, cy + 44), fill=(255, 255, 255)); d.text((cx - w / 2, cy - 4), t, font=f_room, fill=(40, 30, 60)); d.text((cx - w2 / 2, cy + 21), s2, font=f_small, fill=(90, 80, 100))
    for lab, x, y in pl['things']:
        w = d.textlength(lab, font=f_small); d.rounded_rectangle((x * C + 3, oy + y * C + 5, x * C + 11 + w, oy + y * C + 30), 5, fill=(70, 50, 90)); d.text((x * C + 7, oy + y * C + 6), lab, font=f_small, fill=(255, 240, 200))
    return im

ims = [draw(p) for p in PLANS]; Wm = max(i.width for i in ims) + 20; Hs = sum(i.height + 24 for i in ims) + 110
S = Image.new('RGB', (Wm, Hs), (250, 247, 240)); d = ImageDraw.Draw(S); y = 10
for i in ims: S.paste(i, (10, y)); y += i.height + 24
lx = 10
for k in ('bath', 'bed', 'living', 'kitchen', 'book', 'ball', 'work', 'hall'):
    d.rectangle((lx, y, lx + 26, y + 26), fill=COL[k], outline=(90, 80, 90)); d.text((lx + 32, y - 2), NAME[k], font=f_small, fill=(40, 30, 60)); lx += 46 + d.textlength(NAME[k], font=f_small)
y += 40; d.rectangle((10, y, 36, y + 26), fill=WALL); d.text((42, y - 2), 'ผนังเต็ม (มองไม่เห็นข้าม)', font=f_small, fill=(40, 30, 60))
d.rectangle((300, y, 326, y + 26), fill=LOW); d.line((304, y + 13, 322, y + 13), fill=(240, 220, 180), width=4); d.text((332, y - 2), 'ผนังเตี้ย / รั้วคอกบอล (เดินผ่านไม่ได้ มองข้ามได้)', font=f_small, fill=(40, 30, 60))
S.save('house-layouts.png'); json.dump(PLANS, open('layouts.json', 'w', encoding='utf8'), ensure_ascii=False); print(S.size)
# checks a picture cannot show: can every room be walked to from the front door / the stairs?
for p in PLANS:
    W, H = p['W'], p['H']; solid = set()
    for x0, y0, x1, y1 in p['walls'] + p['low']:
        for yy in range(y0, y1 + 1):
            for xx in range(x0, x1 + 1): solid.add((xx, yy))
    if p['stairs']:
        x0, y0, x1, y1 = p['stairs']
        for yy in range(y0, y1 + 1):
            for xx in range(x0, x1 + 1): solid.add((xx, yy))
    floor = {(x, y) for x in range(1, W - 1) for y in range(3, H - 1)} - solid
    start = (p['door'], H - 2) if p['door'] is not None else (p['stairs'][0], p['stairs'][3] + 1)
    seen = {start}; q = [start]
    while q:
        x, y = q.pop()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n in floor and n not in seen: seen.add(n); q.append(n)
    cut = {}
    for k, x0, y0, x1, y1 in p['rooms']:
        t = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if (x, y) in floor]; r = sum(1 for c in t if c in seen)
        cut[k] = cut.get(k, [0, 0]); cut[k][0] += r; cut[k][1] += len(t)
    area = {k: v[1] for k, v in cut.items()}
    print(p['id'], 'floor tiles', len(floor), '| reachable', len(seen), '| unreachable', len(floor) - len(seen), '| room tiles', area, '| stairs foot free' if p['stairs'] and (p['stairs'][0], p['stairs'][3] + 1) in floor else '')
