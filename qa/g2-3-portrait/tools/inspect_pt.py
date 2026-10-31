#!/usr/bin/env python3
# G2.3 portrait inspection (Claude · 31 Oct 2569): size, alpha, half-transparent px, enclosed holes, light/white px on the outline ring,
# old background colours left, colour list, and each colour's nearest colour in the in-game kid (S idle f0 + its material mask, ΔE00).
# usage: python3 -I inspect_pt.py PORTRAIT.png SPRITE_SHEET.png SPRITE_MASK.png OUT.json
import sys, json, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2lab, deltaE_ciede2000
P, SS, SM, OUT = sys.argv[1:5]
NAMES = {1: 'outline', 2: 'face lines', 3: 'skin', 4: 'hair', 5: 'iris', 6: 'ivory cloth', 7: 'leather', 8: 'cape', 9: 'copper', 10: 'mouth/cheek', 11: 'inner lines'}
p = np.array(Image.open(P).convert('RGBA')).astype(int); op = p[..., 3] > 0
lab, n = ndimage.label(~op); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
holes = []
for i in range(1, n + 1):
    if i in edge: continue
    ys, xs = np.where(lab == i); holes.append({'px': int(len(xs)), 'x': [int(xs.min()), int(xs.max())], 'y': [int(ys.min()), int(ys.max())]})
ring = op & ndimage.binary_dilation(~op, structure=np.ones((3, 3)))
L = 0.2126 * p[..., 0] + 0.7152 * p[..., 1] + 0.0722 * p[..., 2]
s = np.array(Image.open(SS).convert('RGBA'))[0:96, 0:96]; m = np.array(Image.open(SM).convert('RGBA'))[0:96, 0:96]
sop = s[..., 3] > 0; sid = m[..., 0]
S = [(tuple(int(v) for v in s[y, x, :3]), int(sid[y, x])) for y, x in zip(*np.where(sop))]
S = sorted(set(S)); SL = rgb2lab(np.array([[c for c, _ in S]], float) / 255)[0]
cols, cnt = np.unique(p[op][:, :3], axis=0, return_counts=True); PL = rgb2lab(cols[None].astype(float) / 255)[0]
table = []
for k, c in enumerate(cols):
    de = deltaE_ciede2000(np.tile(PL[k], (len(SL), 1)), SL); j = int(np.argmin(de))
    same = sorted({NAMES[i] for (cc, i) in S if cc == tuple(int(v) for v in c)})
    table.append({'colour': '#%02X%02X%02X' % tuple(c), 'px': int(cnt[k]), 'sprite_nearest': '#%02X%02X%02X' % S[j][0], 'dE00': round(float(de[j]), 1), 'identical_in_sprite_as': same})
table.sort(key=lambda r: -r['px'])
res = {'file': P, 'sha256': hashlib.sha256(open(P, 'rb').read()).hexdigest(), 'size': list(p.shape[1::-1]), 'alpha_values': sorted(int(v) for v in np.unique(p[..., 3])),
       'half_transparent_px': int(((p[..., 3] > 0) & (p[..., 3] < 255)).sum()), 'opaque_px': int(op.sum()),
       'bbox': [int(np.where(op)[1].min()), int(np.where(op)[0].min()), int(np.where(op)[1].max()), int(np.where(op)[0].max())],
       'enclosed_holes': holes, 'outline_ring_px': int(ring.sum()), 'ring_light_px_L200': int((ring & (L > 200)).sum()),
       'ring_near_white_px': int((ring & (p[..., 0] > 230) & (p[..., 1] > 230) & (p[..., 2] > 230)).sum()),
       'old_bg_F8F9F9_px_on_ring': int((ring & (p[..., 0] == 248) & (p[..., 1] == 249) & (p[..., 2] == 249)).sum()),
       'colours': len(cols), 'colours_identical_to_sprite': sum(1 for r in table if r['dE00'] == 0), 'colours_shared_by_2plus_sprite_materials': sum(1 for r in table if len(r['identical_in_sprite_as']) > 1),
       'colour_table': table}
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in res.items() if k != 'colour_table'}, ensure_ascii=False))
