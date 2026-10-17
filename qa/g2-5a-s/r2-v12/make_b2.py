# FEASIBILITY ONLY: variant B + V5 proposal: inner-rim #3D292C (rows 10-21) -> #67413A, glass #3C2C3B -> #55434C. Not a design.
import sys, json, hashlib, os
import numpy as np
from PIL import Image
S, O = sys.argv[1], sys.argv[2]; os.makedirs(O, exist_ok=True); B = 'c2-held-lantern_L0-S-trial'
a = np.array(Image.open(S + '/' + B + '.png').convert('RGBA')); l = np.array(Image.open(S + '/' + B + '-light.png').convert('RGBA'))
op = a[..., 3] > 0; h = lambda s: np.array([int(s[i:i+2], 16) for i in (1, 3, 5)] + [255], np.uint8)
PL = (0x3A, 0x1E, 0x3F)
col = lambda x, y: tuple(int(v) for v in a[y, x, :3])
outer_pl = {(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) == PL and any(not op[y + dy, x + dx] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))}
for y, x in zip(*np.nonzero(op)):
    if y >= 10 and col(x, y) == (0x3D, 0x29, 0x2C) and any((x + dx, y + dy) in outer_pl for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))): a[y, x] = h('#67413A')
    if l[y, x, 3] and col(x, y) == (0x3C, 0x2C, 0x3B): a[y, x] = h('#55434C')
Image.fromarray(a).save(O + '/' + B + '.png'); Image.fromarray(l).save(O + '/' + B + '-light.png')
Image.fromarray(np.repeat(np.repeat(a, 8, 0), 8, 1)).save(O + '/' + B + '-x8.png')
op = a[..., 3] > 0; ys, xs = np.nonzero(op); lop = l[..., 3] > 0
GL, CR = h('#FFB36B'), h('#FFF0C9'); sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
J = {'grip': [16, 6], 'bbox_xyxy_exclusive': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1], 'size': [int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
     'below_grip': int(ys.max()) - 6, 'above_grip': 6 - int(ys.min()), 'ring_hole_px': [[16, 5], [16, 6]],
     'light_px': {'glass': int((lop & np.all(l[..., :3] == GL[:3], 2)).sum()), 'crystal': int((lop & np.all(l[..., :3] == CR[:3], 2)).sum())},
     'colors': sorted({'#%02X%02X%02X' % tuple(int(v) for v in p[:3]) for p in a[op]}), 'sha256': {'png': sha(O + '/' + B + '.png'), 'light': sha(O + '/' + B + '-light.png')}}
json.dump(J, open(O + '/' + B + '.json', 'w'), indent=1)
