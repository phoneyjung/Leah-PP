# FEASIBILITY VARIANTS ONLY (not designs, not assets). fix1 + round-2 changes. variant A: ribs x13/x19 · variant B: ribs x14/x18 (crystal between ribs)
# usage: make_feas2.py FIX1_DIR OUT_DIR A|B RIBHEX ROW9PLUM(0/1)
import sys, json, hashlib
import numpy as np
from PIL import Image
S, O, V, RH, R9 = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] == '1'; B = 'c2-held-lantern_L0-S-trial'
import os; os.makedirs(O, exist_ok=True)
a = np.array(Image.open(S + '/' + B + '.png').convert('RGBA')); l = np.array(Image.open(S + '/' + B + '-light.png').convert('RGBA'))
h = lambda s: np.array([int(s[i:i+2], 16) for i in (1, 3, 5)] + [255], np.uint8)
PL, C0, C1, C2, C3 = h('#3A1E3F'), h('#3D292C'), h('#67413A'), h('#915B49'), h('#BB7A57'); GL, CR = h('#FFB36B'), h('#FFF0C9')
def put(x, y, c): a[y, x] = c
if R9: put(12, 9, PL); put(20, 9, PL)
put(11, 10, PL); put(21, 10, PL)
for x, c in zip(range(12, 21), [C3, C3, C2, C2, C2, C1, C1, C0, C0]): put(x, 10, c)
for y, cs in ((19, [C3, C3, C2, C2, C2, C1, C1, C1, C0]), (20, [C2, C2, C2, C1, C1, C1, C1, C0, C0])):
    put(11, y, PL); put(21, y, PL)
    for x, c in zip(range(12, 21), cs): put(x, y, c)
gb = a[13, 16].copy()
for x, y in [(16, 14), (15, 15), (16, 15), (17, 15), (15, 16), (16, 16), (17, 16), (16, 17)]: a[y, x] = gb; l[y, x] = GL
rx = (13, 19) if V == 'A' else (14, 18)
for y in range(12, 18):
    for x in rx: put(x, y, h(RH)); l[y, x] = 0
for x, y in [(16, 13), (15, 14), (16, 14), (15, 15)]: a[y, x] = h('#A89AA1'); l[y, x] = CR
for x, y in [(17, 14), (16, 15), (17, 15), (16, 16)]: a[y, x] = h('#81717E'); l[y, x] = CR
Image.fromarray(a).save(O + '/' + B + '.png'); Image.fromarray(l).save(O + '/' + B + '-light.png')
Image.fromarray(np.repeat(np.repeat(a, 8, 0), 8, 1)).save(O + '/' + B + '-x8.png')
op = a[..., 3] > 0; ys, xs = np.nonzero(op); lop = l[..., 3] > 0
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
J = {'grip': [16, 6], 'bbox_xyxy_exclusive': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1], 'size': [int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
     'below_grip': int(ys.max()) - 6, 'above_grip': 6 - int(ys.min()), 'ring_hole_px': [[16, 5], [16, 6]],
     'light_px': {'glass': int((lop & np.all(l[..., :3] == GL[:3], 2)).sum()), 'crystal': int((lop & np.all(l[..., :3] == CR[:3], 2)).sum())},
     'colors': sorted({'#%02X%02X%02X' % tuple(int(v) for v in p[:3]) for p in a[op]}), 'sha256': {'png': sha(O + '/' + B + '.png'), 'light': sha(O + '/' + B + '-light.png')}}
json.dump(J, open(O + '/' + B + '.json', 'w'), indent=1)
