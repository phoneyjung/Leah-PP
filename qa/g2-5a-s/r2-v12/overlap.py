# Body px covered by the lantern in hand (all hold frames, 7 dirs), fist px excluded (the fist is redrawn on top). Scratch analysis only.
import sys, json
import numpy as np
from PIL import Image
WT = sys.argv[1]; dirs = sys.argv[2:]
A = json.load(open(WT + '/c2-pilot-hold-anchors.json')); D8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
sheets = {k: np.array(Image.open(WT + '/' + A['files'][k]).convert('RGBA'))[..., 3] > 0 for k in ('idle_hold', 'walk_hold')}
for d in dirs:
    lan = np.array(Image.open(d + '/c2-held-lantern_L0-S-trial.png').convert('RGBA'))[..., 3] > 0
    ly, lx = np.nonzero(lan); tot = {}; mx = 0
    for k in ('idle_hold', 'walk_hold'):
        for di in ('S', 'SE', 'E', 'NE', 'NW', 'W', 'SW'):
            r = D8.index(di)
            for fi, fr in enumerate(A[k][di]):
                ax, ay = fr['anchor']; fist = {tuple(p) for p in fr['fist']}
                cell = sheets[k][r * 96:(r + 1) * 96, fi * 96:(fi + 1) * 96]
                n = sum(1 for y, x in zip(ly, lx) if 0 <= ay - 6 + y < 96 and 0 <= ax - 16 + x < 96 and cell[ay - 6 + y, ax - 16 + x] and (ax - 16 + x, ay - 6 + y) not in fist)
                tot.setdefault(di, []).append(n)
    print(d.split('/')[-1], 'opaque', int(lan.sum()), 'covered body px per dir (max over frames):', {k: max(v) for k, v in tot.items()})
