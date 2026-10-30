#!/usr/bin/env python3
# G2.4 hut retry at 256 (owner 30 Oct 23:0x · PixelLab draws the door about 40 % of the hut height, so a 100 px door needs a ~250 px hut)
# usage: python3 -I make_refs256.py REPO_ROOT OUT_DIR
import sys, os, json
from PIL import Image, ImageDraw
R, O = sys.argv[1], sys.argv[2]; os.makedirs(O, exist_ok=True)
kid = Image.open(os.path.join(R, 'c2-pilot-kid4-idleanim.png')).convert('RGBA').crop((0, 0, 96, 96))   # feet [48,94] · 83 px tall
SIL, DOOR = (58, 30, 63, 255), (20, 12, 24, 255)
hut = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); d = ImageDraw.Draw(hut)
d.rectangle([12, 126, 243, 255], fill=SIL)                     # front wall 232 x 130 (8 tiles wide footprint)
d.polygon([(4, 130), (128, 6), (251, 130)], fill=SIL)          # gable roof, eaves 8 px past the wall, 4 px clear margin
d.rectangle([96, 156, 159, 255], fill=DOOR)                    # door opening 64 x 100 = map cols +3..+4
hut.save(os.path.join(O, 'ref256-2-shape-hut.png'))
st = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); st.alpha_composite(kid, (144, 160)); st.save(os.path.join(O, 'ref256-1-style-kid.png'))
info = {}
for f in ('ref256-1-style-kid.png', 'ref256-2-shape-hut.png'):
    im = Image.open(os.path.join(O, f)); info[f] = {'size': im.size, 'bbox': im.getbbox(), 'alpha_values': sorted(set(im.getchannel('A').get_flattened_data()))}
json.dump(info, open(os.path.join(O, 'refs256.json'), 'w'), indent=1); print(json.dumps(info))
