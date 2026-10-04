# -*- coding: utf-8 -*-
# Room guide for the INSIDE of the house, step 1, drawn from the approved plan (house_layouts.json, L1, 26 x 14 tiles).
# Owner's decisions (4 Oct): inner walls are cut low so every room shows at once; the house comes with plain furniture that can be moved and replaced,
# so the room picture is EMPTY and every piece of furniture is a separate sprite.
# Layout of the picture: 1536x1024, one plan tile = 59 px. Above plan row 0 stand two more rows: together the top three rows are the tall back wall, seen from the front.
import json
from PIL import Image, ImageDraw
P = json.load(open('/home/claude/house/plan3.json', encoding='utf8'))['L1']['grid']
C = 59; W, H = 1536, 1024; GW, GH = 26, 14; OX = (W - GW * C) // 2; OY = 40 + 2 * C     # OY = top of plan row 0
OUT = (20, 16, 34); TOPW = (70, 60, 66); BACK = (236, 222, 190); LOWFACE = (206, 190, 158); WIN = (150, 200, 236)
FLOOR = {'K': (232, 196, 150), 'D': (232, 196, 150), 'L': (198, 146, 90), 'H': (198, 146, 90), 'B': (214, 170, 120), 'T': (176, 212, 226), 'S': (186, 180, 170), '+': (198, 146, 90), 'E': (150, 104, 60), 'P': (140, 104, 70)}
g = lambda x, y: P[y][x] if 0 <= y < len(P) and 0 <= x < len(P[y]) else ' '
im = Image.new('RGB', (W, H), OUT); d = ImageDraw.Draw(im)
R = lambda x, y, c, y0=0.0, y1=1.0: d.rectangle((OX + x * C, OY + (y + y0) * C, OX + (x + 1) * C - 1, OY + (y + y1) * C - 1), fill=c)
inside = lambda v: v not in '# P'
for y in range(GH):
    for x in range(GW):
        v = g(x, y)
        if v in FLOOR:
            col = FLOOR[v]
            if v == '+':                                         # a doorway takes the floor of the room beside it
                for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    if g(x + dx, y + dy) in 'LHBTSKD': col = FLOOR[g(x + dx, y + dy)]; break
            R(x, y, col)
for y in range(GH):
    for x in range(GW):
        if g(x, y) != '#': continue
        below = g(x, y + 1)
        if y == 0: continue                                       # the back wall is drawn afterwards, three tiles tall
        R(x, y, TOPW)
        if inside(below) and below != '+': R(x, y, LOWFACE, 0.55, 1.0)      # a low wall seen from the front shows a short face toward the room below it
# the tall back wall: plan row 0 and the two rows above it, over every column that has a room under it
for x in range(GW):
    if inside(g(x, 1)): d.rectangle((OX + x * C, OY - 2 * C, OX + (x + 1) * C - 1, OY + C - 1), fill=BACK)
    else: d.rectangle((OX + x * C, OY - 2 * C, OX + (x + 1) * C - 1, OY + C - 1), fill=TOPW)
d.rectangle((OX, OY - 2 * C, OX + GW * C - 1, OY - 2 * C + 14), fill=TOPW)                                      # its top edge
for wx in (3, 6.5, 11, 13.5, 18, 22):                                                                           # windows in the back wall
    d.rectangle((OX + wx * C - 34, OY - 1.45 * C, OX + wx * C + 34, OY + 0.25 * C), fill=WIN)
im.save('2_room-guide.png'); print(im.size, 'tile', C, 'origin of plan row 0:', (OX, OY))
json.dump({'C': C, 'OX': OX, 'OY': OY, 'plan': 'L1', 'back_wall_rows_above_plan': 2}, open('guide.json', 'w'))
