# The hat sits on the top edge of the head. For each frame: the top edge (first opaque row per column, rows < 50) and the side edges
# (first/last opaque column per row, top 16 rows), compared with idle f1 of the same direction after the best shift from head_fit.json.
import sys, json
from PIL import Image
DIRS = ['S','SE','E','NE','N','NW','W','SW']
def load(path, n):
    im = Image.open(path).convert('RGBA'); px = im.load(); out = {}
    for r, d in enumerate(DIRS):
        out[d] = []
        for f in range(n):
            a = [[px[f*96+x, r*96+y][3] > 0 for x in range(96)] for y in range(96)]
            top = min(y for y in range(50) for x in range(96) if a[y][x])
            prof = {x: min(y for y in range(50) if a[y][x]) for x in range(96) if any(a[y][x] for y in range(50))}
            sides = {y: (min(x for x in range(96) if a[y][x]), max(x for x in range(96) if a[y][x])) for y in range(top, top + 17) if any(a[y])}
            out[d].append((prof, sides))
    return out
root, fit = sys.argv[1], json.load(open(sys.argv[2]))
sets = {'idle': load(root + '/c2-pilot-kid4-idleanim.png', 4), 'walk': load(root + '/c2-pilot-kid4-walk.png', 6), 'walkhold': load(root + '/c2-pilot-kid4-walkhold.png', 6)}
worst_top = worst_side = 0; rows = []
for d in DIRS:
    rp, rs = sets['idle'][d][0]; wt = ws = 0
    for name in sets:
        for i, (p, s) in enumerate(sets[name][d]):
            dx, dy = fit[d][name][i][:2]
            # top edge: columns present in both
            diffs = [abs(p[x] - (rp[x - dx] + dy)) for x in p if (x - dx) in rp]
            t = max(diffs) if diffs else 99
            sd = [max(abs(s[y][0] - (rs[y - dy][0] + dx)), abs(s[y][1] - (rs[y - dy][1] + dx))) for y in s if (y - dy) in rs]
            si = max(sd) if sd else 99
            wt = max(wt, t); ws = max(ws, si)
    rows.append((d, wt, ws)); worst_top = max(worst_top, wt); worst_side = max(worst_side, ws)
    print(d, 'top edge off by at most', wt, 'px · side edges (top 16 rows) off by at most', ws, 'px')
print('ALL: top', worst_top, 'side', worst_side)
