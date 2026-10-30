#!/usr/bin/env python3
# G2.4 round-2 PixelLab references (Claude · 30 Oct 2569) · whole pixels only, never scaled
# style refs = the locked kid at true size (or the round-1 tiles for the 32 px props) · shape refs = flat plum silhouettes at the target size
# usage: python3 -I make_refs_r2.py REPO_ROOT ROUND1_IMG_DIR OUT_DIR
import sys, os, json
from PIL import Image, ImageDraw
R, IMG, O = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(O, exist_ok=True)
kid = Image.open(os.path.join(R, 'c2-pilot-kid4-idleanim.png')).convert('RGBA').crop((0, 0, 96, 96))   # feet [48,94] · 83 px tall
SIL, HOLE = (58, 30, 63, 255), (20, 12, 24, 255)
def save(im, n): im.save(os.path.join(O, n)); return n
out = []
st = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); st.alpha_composite(kid, (16, 32)); out.append(save(st, 'ref128-1-style-kid.png'))   # kid feet at (64,126)
# cave mouth 128: rock outcrop over the cliff, dark opening 64 wide at x 32-95 from y 40 down to y 124 (= exits X cols 16-17) + a 3 px rock lip y 125-127 (v2: keeps the opening enclosed so background removal cannot cut it)
cv = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); d = ImageDraw.Draw(cv)
d.polygon([(2, 127), (4, 60), (14, 30), (34, 12), (64, 6), (94, 12), (114, 30), (124, 60), (125, 127)], fill=SIL)
d.rectangle([32, 52, 95, 124], fill=HOLE); d.ellipse([32, 40, 95, 66], fill=HOLE); out.append(save(cv, 'ref128-2-shape-cave.png'))
# tree 128: canopy x 16-111 y 4-92 · trunk x 56-71 y 86-124 (base centre 64,124)
tr = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); d = ImageDraw.Draw(tr)
d.rectangle([56, 86, 71, 124], fill=SIL); d.ellipse([16, 4, 111, 92], fill=SIL); out.append(save(tr, 'ref128-2-shape-tree.png'))
# lamp post 128: post x 60-67 y 28-124 · arm to the left x 44-67 y 28-33 · 1 px cord x 49 y 34-37 · lantern x 44-55 y 38-58 · base x 54-73 y 118-124 (97 px tall, base centre 64,124)
lp = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); d = ImageDraw.Draw(lp)
d.rectangle([60, 28, 67, 124], fill=SIL); d.rectangle([44, 28, 67, 33], fill=SIL); d.rectangle([49, 34, 49, 37], fill=SIL); d.rectangle([44, 38, 55, 58], fill=SIL); d.rectangle([54, 118, 73, 124], fill=SIL)
out.append(save(lp, 'ref128-2-shape-lamp.png'))
# gate 64: two posts x 2-9 / 54-61 y 8-62 · closed boards x 10-53 y 20-58
gt = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(gt)
d.rectangle([2, 8, 9, 62], fill=SIL); d.rectangle([54, 8, 61, 62], fill=SIL); d.rectangle([10, 20, 53, 58], fill=SIL); out.append(save(gt, 'ref64-2-shape-gate.png'))
k64 = kid.crop((16, 8, 80, 72)); out.append(save(k64, 'ref64-1-style-kid.png'))
# props 32: style from the round-1 tiles (pure grass tile of A · a pure stone tile of B)
A = Image.open(os.path.join(IMG, 'a-tileset-grass-dirt.png')).convert('RGBA'); B = Image.open(os.path.join(IMG, 'b-tileset-grass-cliff.png')).convert('RGBA')
out.append(save(A.crop((0, 96, 32, 128)), 'ref32-1-style-grass.png')); out.append(save(B.crop((0, 96, 32, 128)), 'ref32-2-style-stone.png'))
info = {}
for f in out:
    im = Image.open(os.path.join(O, f)); info[f] = {'size': im.size, 'bbox': im.getbbox(), 'alpha_values': sorted(set(im.getchannel('A').get_flattened_data()))}
json.dump(info, open(os.path.join(O, 'refs-r2.json'), 'w'), indent=1); print(json.dumps(info))
