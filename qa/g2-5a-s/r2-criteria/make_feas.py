# FEASIBILITY CHECK ONLY (not a design, not an asset): fix1 + the 4 round-2 changes, to prove all criteria can pass together in 13x18.
import sys, json, hashlib
import numpy as np
from PIL import Image
S, O = sys.argv[1], sys.argv[2]; B = 'c2-held-lantern_L0-S-trial'
a = np.array(Image.open(S + '/' + B + '.png').convert('RGBA')); l = np.array(Image.open(S + '/' + B + '-light.png').convert('RGBA'))
h = lambda s: np.array([int(s[i:i+2], 16) for i in (1, 3, 5)] + [255], np.uint8)
PL, C0, C1, C2, C3 = h('#3A1E3F'), h('#3D292C'), h('#67413A'), h('#915B49'), h('#BB7A57')
GL, CR = h('#FFB36B'), h('#FFF0C9')
RIB = h(sys.argv[3]) if len(sys.argv) > 3 else C3
def put(x, y, c): a[y, x] = c
# cap: row 9 plum corners, row 10 plum x11/x21 + copper x12..x20
put(12, 9, PL); put(20, 9, PL); put(11, 10, PL); put(21, 10, PL)
for x, c in zip(range(12, 21), [C3, C3, C2, C2, C2, C1, C1, C0, C0]): put(x, 10, c)
# base rows 19, 20: plum x11/x21, copper x12..x20
for y, cs in ((19, [C3, C3, C2, C2, C2, C1, C1, C1, C0]), (20, [C2, C2, C2, C1, C1, C1, C1, C0, C0])):
    put(11, y, PL); put(21, y, PL)
    for x, c in zip(range(12, 21), cs): put(x, y, c)
# ribs x13 and x19, rows 12..17 (connect cap frame row 11 to bottom frame row 18); no light on them
for y in range(12, 18):
    for x in (13, 19): put(x, y, RIB); l[y, x] = 0
# crystal up 1 px: clear old crystal light/base -> glass, then rows 13..16 diamond
old = [(16, 14), (15, 15), (16, 15), (17, 15), (15, 16), (16, 16), (17, 16), (16, 17)]
glass_base = a[13, 16].copy()   # a glass tone
for x, y in old: a[y, x] = glass_base; l[y, x] = GL
new_l = [(16, 13), (15, 14), (16, 14), (15, 15)]; new_d = [(17, 14), (16, 15), (17, 15), (16, 16)]
for x, y in new_l: a[y, x] = h('#A89AA1'); l[y, x] = CR
for x, y in new_d: a[y, x] = h('#81717E'); l[y, x] = CR
Image.fromarray(a).save(O + '/' + B + '.png'); Image.fromarray(l).save(O + '/' + B + '-light.png')
Image.fromarray(np.repeat(np.repeat(a, 8, 0), 8, 1)).save(O + '/' + B + '-x8.png')
op = a[..., 3] > 0; ys, xs = np.nonzero(op); lop = l[..., 3] > 0
cols = sorted({'#%02X%02X%02X' % tuple(int(v) for v in p[:3]) for p in a[op]})
lc = {'glass': int((lop & np.all(l[..., :3] == GL[:3], 2)).sum()), 'crystal': int((lop & np.all(l[..., :3] == CR[:3], 2)).sum())}
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
J = {'grip': [16, 6], 'bbox_xyxy_exclusive': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1], 'size': [int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
     'below_grip': int(ys.max()) - 6, 'above_grip': 6 - int(ys.min()), 'ring_hole_px': [[16, 5], [16, 6]], 'light_px': lc, 'colors': cols,
     'sha256': {'png': sha(O + '/' + B + '.png'), 'light': sha(O + '/' + B + '-light.png')}}
json.dump(J, open(O + '/' + B + '.json', 'w'), indent=1); print(J['bbox_xyxy_exclusive'], lc)
