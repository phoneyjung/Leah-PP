#!/usr/bin/env python3
# G2.4 cave mouth retry at 192 (owner 31 Oct 00:5x "กดใหม่ใหญ่ขึ้น 192") · round-2 128 caves gave a 36 x 41 entrance (criterion >= 51 x 72)
# shape: rock dome x 4-187 y 8-190 · dark entrance 72 wide x 60-131 from y 60 down to y 187 · rock lip y 188-190 · placed in the world with top-left (448, -64)
# usage: python3 -I make_ref_cave192.py OUT_DIR ROUND2_4UP_PNG
import sys, os
from PIL import Image, ImageDraw
O, UP = sys.argv[1], sys.argv[2]; os.makedirs(O, exist_ok=True)
SIL, HOLE = (58, 30, 63, 255), (20, 12, 24, 255)
cv = Image.new('RGBA', (192, 192), (0, 0, 0, 0)); d = ImageDraw.Draw(cv)
d.polygon([(4, 190), (6, 96), (20, 48), (48, 18), (96, 8), (144, 18), (172, 48), (186, 96), (187, 190)], fill=SIL)
d.rectangle([60, 84, 131, 187], fill=HOLE); d.ellipse([60, 60, 131, 108], fill=HOLE)
cv.save(os.path.join(O, 'ref192-2-shape-cave.png'))
Image.open(UP).convert('RGBA').crop((128, 128, 256, 256)).save(os.path.join(O, 'ref128-3-look-cave4.png'))   # round-2 cave variant 4 (owner's natural-rock pick) = look only
for f in ('ref192-2-shape-cave.png', 'ref128-3-look-cave4.png'):
    im = Image.open(os.path.join(O, f)); print(f, im.size, im.getbbox())
