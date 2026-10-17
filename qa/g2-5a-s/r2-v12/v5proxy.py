# V5 helper metric (scratch): how the UNLIT lantern stands out on the pilot dark background #1E1B2E. Not an artistic gate.
# inner rim = opaque non-plum px 4-adjacent to a plum px that touches the outside; reports dE00 of inner-rim colours vs dark bg, and L* stats
import sys, math, json
import numpy as np
from PIL import Image
src = open(sys.argv[2]).read(); ns = {'math': math}; exec(src[src.index('def lab'):src.index('def hexc')], ns); de00 = ns['de00']; lab = ns['lab']
BG = (30, 27, 46); PL = (0x3A, 0x1E, 0x3F)
for d in sys.argv[3:]:
    a = np.array(Image.open(d + '/c2-held-lantern_L0-S-trial.png').convert('RGBA')).astype(int); op = a[..., 3] > 0
    col = lambda x, y: tuple(int(v) for v in a[y, x, :3])
    outer_pl = {(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) == PL and any(not (0 <= y + dy < 32 and 0 <= x + dx < 32) or not op[y + dy, x + dx] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))}
    rim = [(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) != PL and any((x + dx, y + dy) in outer_pl for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))]
    ds = sorted(de00(col(x, y), BG) for x, y in rim)
    weak = [(x, y, '#%02X%02X%02X' % col(x, y)) for x, y in rim if de00(col(x, y), BG) < 15]
    allL = [lab(col(x, y))[0] for y, x in zip(*np.nonzero(op))]
    print(d.split('/')[-1], json.dumps({'plum_vs_bg': round(de00(PL, BG), 2), 'rim_px': len(rim), 'rim_dE_min': round(ds[0], 2), 'rim_dE_median': round(ds[len(ds) // 2], 2),
        'rim_share_dE>=20': '%d/%d' % (sum(v >= 20 for v in ds), len(ds)), 'rim_weak(<15)': weak, 'mean_L': round(float(np.mean(allL)), 1)}, default=int))
