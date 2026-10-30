#!/usr/bin/env python3
# G2.4 round-1 PixelLab reference images (Claude · 30 Oct 2569) · built from the locked kid sprite, never scaled (whole pixels only)
# style refs = the c2 kid S idle f1 at true size · shape refs = flat silhouettes with the target size (what PixelLab should fill)
# usage: python3 -I make_refs.py REPO_ROOT OUT_DIR
import sys, os, json
from PIL import Image, ImageDraw
R, O = sys.argv[1], sys.argv[2]; os.makedirs(O, exist_ok=True)
sheet = Image.open(os.path.join(R, 'c2-pilot-kid4-idleanim.png')).convert('RGBA')
kid = sheet.crop((0, 0, 96, 96))                     # row S, frame 1 · feet [48,94]
bb = kid.getbbox(); info = {'kid_bbox': bb, 'kid_height': bb[3] - bb[1]}
SIL, DOOR = (58, 30, 63, 255), (20, 12, 24, 255)     # plum silhouette · darker door opening
# hut: 192 x 192 canvas · footprint 6 tiles wide = 192 px · 4 px clear margin left/right/top · front wall 116 px · roof to y 6 · door opening 64 x 100 at x 64..127 (cols 5-6 of the map) · kid is 83 px tall
hut = Image.new('RGBA', (192, 192), (0, 0, 0, 0)); d = ImageDraw.Draw(hut)
d.rectangle([10, 76, 181, 191], fill=SIL)                      # front wall 172 x 116
d.polygon([(4, 80), (96, 6), (187, 80)], fill=SIL)             # roof (gable, eaves 6 px past the wall)
d.rectangle([64, 92, 127, 191], fill=DOOR)                     # door opening 64 x 100
hut.save(os.path.join(O, 'ref192-2-shape-hut.png'))
st = Image.new('RGBA', (192, 192), (0, 0, 0, 0)); st.alpha_composite(kid, (96, 96)); st.save(os.path.join(O, 'ref192-1-style-kid.png'))
# slime: 64 x 64 · body 60 wide x 60 tall (rows 4-63 = 0.72 x kid height 83 · inside the 0.6-1.0 rule with room) · bottom row 63
sl = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(sl)
d.ellipse([4, 4, 59, 62], fill=SIL); d.rectangle([4, 40, 59, 62], fill=SIL); d.ellipse([2, 52, 61, 63], fill=SIL)
sl.save(os.path.join(O, 'ref64-2-shape-slime.png'))
k64 = kid.crop((16, 8, 80, 72))                                # head + upper body of the kid at true size = style only
k64.save(os.path.join(O, 'ref64-1-style-kid.png'))
# scale board: kid next to the hut and the slime on 32 px tiles (for the owner / Codex, not uploaded to PixelLab)
bd = Image.new('RGBA', (320, 224), (79, 110, 94, 255)); d = ImageDraw.Draw(bd)
for x in range(0, 320, 32): d.line([(x, 0), (x, 224)], fill=(70, 98, 84, 255))
for y in range(0, 224, 32): d.line([(0, y), (320, y)], fill=(70, 98, 84, 255))
bd.alpha_composite(hut, (0, 32)); bd.alpha_composite(kid, (200, 128)); bd.alpha_composite(sl, (256, 160))
bd = bd.resize((960, 672), Image.NEAREST); bd.save(os.path.join(O, 'scale-board-3x.png'))
for f in ('ref192-1-style-kid.png', 'ref192-2-shape-hut.png', 'ref64-1-style-kid.png', 'ref64-2-shape-slime.png'):
    im = Image.open(os.path.join(O, f)); a = im.getchannel('A'); info[f] = {'size': im.size, 'bbox': im.getbbox(), 'alpha_values': sorted(set(a.get_flattened_data()))}
json.dump(info, open(os.path.join(O, 'refs.json'), 'w'), indent=1); print(json.dumps(info))
