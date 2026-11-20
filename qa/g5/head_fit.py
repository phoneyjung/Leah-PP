# Can one hat image per direction fit every frame? For each frame: the crown of the head (opaque pixels from the top row of the head
# down 16 rows), the shift that best matches the same direction's idle f1, and how many pixels still differ after that shift.
import sys, json
from PIL import Image
DIRS = ['S','SE','E','NE','N','NW','W','SW']
def frames(path, n):
    im = Image.open(path).convert('RGBA'); px = im.load(); out = {}
    for r, d in enumerate(DIRS):
        out[d] = []
        for f in range(n):
            pts = set(); top = None
            for y in range(96):
                for x in range(96):
                    if px[f*96+x, r*96+y][3] > 0 and y < 50: pts.add((x, y)); top = y if top is None else min(top, y)
            out[d].append({(x, y) for (x, y) in pts if y <= top + 16})
    return out
def best(ref, cur):
    b = None
    for dy in range(-5, 6):
        for dx in range(-6, 7):
            sh = {(x+dx, y+dy) for (x, y) in ref}; xo = len(sh ^ cur)
            if b is None or xo < b[0]: b = (xo, dx, dy)
    return b
root = sys.argv[1]
idle = frames(root + '/c2-pilot-kid4-idleanim.png', 4); walk = frames(root + '/c2-pilot-kid4-walk.png', 6); hold = frames(root + '/c2-pilot-kid4-walkhold.png', 6)
res = {}; worst = 0
for d in DIRS:
    ref = idle[d][0]; row = {}
    for name, fs in (('idle', idle), ('walk', walk), ('walkhold', hold)):
        row[name] = []
        for f in fs[d]:
            xo, dx, dy = best(ref, f); row[name].append([dx, dy, xo, len(f)]); worst = max(worst, xo / max(1, len(f)))
    res[d] = row
    print(d, 'crown px', len(ref), '| idle', [r[:3] for r in row['idle']], '| walk', [r[:3] for r in row['walk']], '| walkhold', [r[:3] for r in row['walkhold']])
print('worst share of crown pixels that still differ after the best shift: %.3f' % worst)
json.dump(res, open(sys.argv[2], 'w'))
