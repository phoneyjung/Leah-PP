# -*- coding: utf-8 -*-
# Massing guide for the OUTSIDE of the house, three steps, read off the approved interior plan (house_layouts.py, draft 3):
#   plan width 26 tiles; the front door sits on a porch recessed into the lower-left corner (7 tiles wide, door on tiles 3-4);
#   the other 19 tiles of the front stand forward; step 2 adds a wing of 11 tiles on the right whose lower room comes forward a little;
#   step 3 puts a second storey on the original 26 tiles only, with a balcony over the porch.
# Flat colour blocks on magenta: the painter paints over them and keeps every block where it is.
from PIL import Image, ImageDraw
W, H = 1536, 1024; U = 13.5; BASE = 800
MAG = (255, 0, 255); WALL = (236, 222, 190); WALL_BACK = (212, 196, 164); ROOF = (190, 62, 52); ROOF2 = (166, 72, 62); DOOR = (118, 78, 48); WIN = (150, 200, 236); WOOD = (182, 142, 96); POST = (108, 78, 52); STONE = (150, 142, 138); BEAM = (124, 92, 60)
im = Image.new('RGB', (W, H), MAG); d = ImageDraw.Draw(im)
WH = 120; REC = 22; UP = 112; PW = 10.5                       # wall height, how much higher the recessed porch wall sits, height of the upper storey, porch width in plan tiles
# The porch is drawn wider than in the plan (10.5 tiles, not 7): at game size the door must be wide enough for a character to walk in.

def house(x0, stage):
    u = U; b = BASE; px1 = x0 + PW * u; x1 = x0 + 26 * u; top2 = UP if stage == 3 else 0
    eave_f = b - WH - top2; eave_b = b - REC - WH - top2; ridge = eave_b - 118; d0, d1 = x0 + 2.65 * u, x0 + 7.85 * u
    d.polygon([(x0 - 12, eave_b + 6), (px1, eave_b + 6), (px1, eave_f + 6), (x1 + 12, eave_f + 6), (x1 - 34, ridge), (x0 + 34, ridge)], fill=ROOF)
    d.rectangle((x0 + 16 * u, ridge - 46, x0 + 16 * u + 30, ridge + 26), fill=STONE)                        # chimney
    d.rectangle((x0, b - REC - WH - top2, px1, b - REC), fill=WALL_BACK)                                       # recessed wall behind the porch
    d.rectangle((px1, b - WH - top2, x1, b), fill=WALL)                                                        # the part that stands forward
    if stage == 3:
        d.rectangle((px1, b - WH - 7, x1, b - WH + 7), fill=BEAM)                                               # timber band between the storeys
        for wx in (13, 20): d.rectangle((x0 + wx * u, b - WH - 88, x0 + (wx + 4) * u, b - WH - 34), fill=WIN)
        d.rectangle((d0 + 8, b - REC - WH - 92, d1 - 8, b - REC - WH - 4), fill=DOOR)                           # balcony door upstairs
        d.rectangle((x0 - 6, b - WH - 26, px1, b - WH - 4), fill=WOOD)                                          # balcony floor = porch roof
        for i in range(10): xx = x0 - 4 + i * (PW * u) / 9; d.rectangle((xx, b - WH - 60, xx + 5, b - WH - 26), fill=POST)
        d.rectangle((x0 - 6, b - WH - 64, px1, b - WH - 57), fill=POST)                                         # balcony rail
    else:
        d.polygon([(x0 - 10, b - REC - WH - 4), (px1, b - REC - WH - 4), (px1, b - WH - 4), (x0 - 10, b - WH - 4)], fill=ROOF2)   # lean-to roof over the porch, clear of the door
    d.rectangle((x0, b - REC, px1, b), fill=WOOD)                                                              # porch floor
    d.rectangle((d0 - 8, b, d1 + 8, b + 13), fill=WOOD); d.rectangle((d0 - 18, b + 13, d1 + 18, b + 25), fill=WOOD)   # two steps
    r = (d1 - d0) / 2; d.rectangle((d0, b - REC - 100 + r, d1, b - REC), fill=DOOR); d.pieslice((d0, b - REC - 100, d1, b - REC - 100 + 2 * r), 180, 360, fill=DOOR)   # the front door
    for xx in (x0 + 2, px1 - 12): d.rectangle((xx, b - WH - 4, xx + 10, b), fill=POST)                         # porch posts
    for wx in (13, 20): d.rectangle((x0 + wx * u, b - 92, x0 + (wx + 4) * u, b - 40), fill=WIN)
    if stage >= 2:
        wx0, wx1 = x1, x0 + 37 * u; wb = b + 18; wh = 102
        d.polygon([(wx0 - 4, wb - wh + 6), (wx1 + 12, wb - wh + 6), (wx1 - 26, wb - wh - 104), (wx0 + 6, wb - wh - 104)], fill=ROOF2)
        d.rectangle((wx0, wb - wh, wx1, wb), fill=WALL)
        d.rectangle((wx0 + 1.0 * u, wb - 80, wx0 + 3.6 * u, wb - 34), fill=WIN)
        for cx in (wx0 + 5.7 * u, wx0 + 8.9 * u): d.ellipse((cx - 19, wb - 79, cx + 19, wb - 41), fill=WIN)
    return (x0 - 20, ridge - 50, (x0 + 37 * u if stage >= 2 else x1) + 16, b + 44)

X = {1: 30, 2: 420, 3: 968}; boxes = {s: house(X[s], s) for s in (1, 2, 3)}
im.save('2_house-guide.png'); print(im.size, {k: [round(v) for v in b] for k, b in boxes.items()})
import json; json.dump({'U': U, 'BASE': BASE, 'X': X, 'boxes': {k: [round(v) for v in b] for k, b in boxes.items()}, 'door_u': [2.65, 7.85], 'porch_u': 10.5, 'wall_h': 120, 'recess': 22, 'plan_width_tiles': {'1': 26, '2': 37, '3': 37}}, open('guide.json', 'w'))
# style picture: the house that is in the game now, on magenta, three times its size
s = Image.open('/home/claude/v112/farm-house-1.png').convert('RGBA'); s3 = s.resize((s.width * 3, s.height * 3), Image.NEAREST); bg = Image.new('RGB', (s3.width + 60, s3.height + 60), MAG); bg.paste(s3, (30, 30), s3); bg.save('1_house-style.png'); print('style', bg.size)
