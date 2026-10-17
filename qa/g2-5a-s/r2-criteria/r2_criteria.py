# Round-2 candidate criteria (ChatGPT 17 Oct 17:5x, made measurable by Claude). Read-only. usage: python3 -I r2_criteria.py LANTERN_DIR QA_ASSET13_PY (de00 is taken from qa_asset13.py)
import sys, json
import numpy as np
from PIL import Image

de00_src = open(sys.argv[2]).read()
ns = {'math': __import__('math')}; exec(de00_src[de00_src.index('def lab'):de00_src.index('def hexc')], ns)
de00 = ns['de00']
D = sys.argv[1]; B = 'c2-held-lantern_L0-S-trial'
a = np.array(Image.open(D + '/' + B + '.png').convert('RGBA')).astype(int); l = np.array(Image.open(D + '/' + B + '-light.png').convert('RGBA')).astype(int)
op = a[..., 3] > 0; lop = l[..., 3] > 0
COP = {(0x3D,0x29,0x2C),(0x67,0x41,0x3A),(0x91,0x5B,0x49),(0xBB,0x7A,0x57)}; BR = COP - {(0x3D,0x29,0x2C)}
CRY = (0xFF,0xF0,0xC9)
col = lambda x, y: tuple(int(v) for v in a[y, x, :3])
iscop = lambda x, y: op[y, x] and col(x, y) in COP
def run(y):
    b = c = 0
    for x in range(32): c = c + 1 if iscop(x, y) else 0; b = max(b, c)
    return b
out = {}
out['R2-1 cap rows 10,11 copper run >= 9 each'] = ({10: run(10), 11: run(11)}, run(10) >= 9 and run(11) >= 9)
out['R2-3 base rows 19,20 copper run >= 9 each'] = ({19: run(19), 20: run(20)}, run(19) >= 9 and run(20) >= 9)
# ribs: interior copper px = copper with a light-layer px directly left AND right somewhere in its row segment (glass on both sides within the glass band)
cry = lop & np.all(l[..., :3] == CRY, axis=2)
cx = np.nonzero(cry)[1]; ccx = cx.mean() if len(cx) else 16
rib = {}
for x in range(32):
    best = cur = 0; ys = []
    for y in range(32):
        inside = iscop(x, y) and lop[y, :x].any() and lop[y, x+1:].any()
        cur = cur + 1 if inside else 0; best = max(best, cur)
    if best: rib[x] = best
left = max([v for x, v in rib.items() if x < ccx] or [0]); right = max([v for x, v in rib.items() if x > ccx] or [0])
pairs = []
for y in range(32):
    for x in range(32):
        if iscop(x, y) and lop[y, :x].any() and lop[y, x+1:].any():
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                if lop[y+dy, x+dx] and not cry[y+dy, x+dx]:
                    pairs.append((de00(col(x+dx, y+dy), col(x, y)), de00(tuple(int(v) for v in l[y+dy, x+dx, :3]), col(x, y))))
mn = (round(min(p[0] for p in pairs), 2), round(min(p[1] for p in pairs), 2)) if pairs else None
out['R2-2 interior ribs: left & right run >= 4, rib/glass dE00 >= 15 unlit & lit'] = ({'rib_cols': rib, 'left': left, 'right': right, 'min_dE_unlit_lit': mn}, left >= 4 and right >= 4 and mn is not None and min(mn) >= 15)
ys, xs = np.nonzero(cry)
touch = sum(1 for y, x in zip(ys, xs) for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)) if op[y+dy, x+dx] and not lop[y+dy, x+dx])
below = [y for y in range(int(ys.max()) + 1, 32) if lop[y].any()]
out['R2-4 crystal: 0 px touching copper/plum, >= 1 glass row below it'] = ({'crystal_rows': [int(ys.min()), int(ys.max())], 'touching_metal': touch, 'glass_rows_below': below}, touch == 0 and len(below) >= 1)
for k, (v, p) in out.items(): print(('PASS ' if p else 'FAIL ') + k + ' :: ' + json.dumps(v, default=str))
