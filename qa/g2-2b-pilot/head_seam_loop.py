#!/usr/bin/env python3
# Head seam per adjacent walk frame pair incl. the loop f6->f1 (rows 4-46): changed px, centroid shift x/y, top-row shift (Claude 16 Oct 2569)
# usage: python3 -I qa/g2-2b-pilot/head_seam_loop.py WALK_PNG WALKHOLD_PNG OUT_JSON
import sys, json
from PIL import Image; import numpy as np
D = 'S SE E NE N NW W SW'.split()
def pairs(a, i):
    out = []
    for k in range(6):
        A = a[i*96+4:i*96+47, k*96:k*96+96]; B = a[i*96+4:i*96+47, ((k+1) % 6)*96:((k+1) % 6)*96+96]
        diff = int(((A[..., 3] > 0) != (B[..., 3] > 0)).sum() + (((A[..., 3] > 0) & (B[..., 3] > 0)) & (np.abs(A[..., :3]-B[..., :3]).sum(-1) > 0)).sum())
        ya, xa = np.nonzero(A[..., 3]); yb, xb = np.nonzero(B[..., 3])
        out.append((diff, round(float(abs(xa.mean()-xb.mean())), 2), round(float(abs(ya.mean()-yb.mean())), 2), int(abs(ya.min()-yb.min()))))
    return out
R = {}
for name, p in (('walk', sys.argv[1]), ('walkhold', sys.argv[2])):
    a = np.array(Image.open(p).convert('RGBA')).astype(int); R[name] = {d: pairs(a, i) for i, d in enumerate(D)}
    for d in D: pr = R[name][d]; print(name, d, 'f6->f1', pr[5], '| other pairs max dx', max(x[1] for x in pr[:5]))
json.dump(R, open(sys.argv[3], 'w'), indent=1)
