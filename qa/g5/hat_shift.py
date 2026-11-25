# The hat's place on every frame (for the game's hat_shift table). Start from qa/g5/head_fit.py's crown match; where that leaves the hat
# floating at an edge column, try the 8 neighbouring shifts (1 px) and keep the closest one that has: no eye pixel covered, crown >= 95 %,
# no gap. Prints how many frames moved; writes the table.   python3 -I -B hat_shift.py BASE HATDIR HEAD_FIT OUT_JSON
import sys, json
sys.argv, out = sys.argv[:5], sys.argv[4]
exec(open(__file__.replace('hat_shift.py', 'hat_frames.py')).read().split('# ---- numbers')[0].replace("os.makedirs(out, exist_ok=True)", "pass"))
def measure(anim, d, f, dx, dy):
    body, m = frame(anim, d, f); h = hat_cell(d); hp = h.load(); bp = body.load(); mp = m.load()
    H = {(x + dx, y + dy) for y in range(96) for x in range(96) if hp[x, y][3] == 255}
    op = {(x, y) for y in range(96) for x in range(96) if bp[x, y][3] > 0}
    top = min(y for x, y in op); widths = {y: sum(1 for x in range(96) if (x, y) in op) for y in range(top, 60)}
    neck = min(range(top + 18, 56), key=lambda y: (widths.get(y, 99), y)); head = {(x, y) for x, y in op if y < neck}
    eyes = {(x, y) for (x, y) in op if mp[x, y][3] and mp[x, y][0] in (2, 5)}
    crown = {(x, y) for (x, y) in head if y <= top + 2}; cov = len(crown & H) / max(1, len(crown))
    first = {}
    for (x, y) in head: first[x] = min(first.get(x, 999), y)
    g = 0
    for x in {x for x, y in H}:
        yb = max(y for (xx, y) in H if xx == x)
        if x in first and yb < first[x] - 1 and first[x] - yb - 1 <= 6: g = max(g, first[x] - yb - 1)
    return len(H & eyes), cov, g
table, moved = {}, []
for anim, _, n in ANIMS:
    table[anim] = {}
    for d in DIRS:
        table[anim][d] = []
        for f in range(n):
            bx, by = fit[d][anim][f][:2]; best = None
            for ddx, ddy in sorted([(a, b) for a in (-1, 0, 1) for b in (-1, 0, 1)], key=lambda t: (abs(t[0]) + abs(t[1]), abs(t[1]), t)):
                e, cov, g = measure(anim, d, f, bx + ddx, by + ddy)
                if e == 0 and cov >= 0.95 and g == 0: best = (bx + ddx, by + ddy, cov); break
            if best is None: best = (bx, by, None); moved.append([anim, d, f, 'NO FIT'])
            elif (best[0], best[1]) != (bx, by): moved.append([anim, d, f, [bx, by], [best[0], best[1]]])
            table[anim][d].append([best[0], best[1]])
json.dump({'note': 'hat shift per frame [dx, dy] from idle frame 1 of the same view; crown match, nudged by 1 px where the hat would float', 'shift': table}, open(out, 'w'))
print(json.dumps({'frames': sum(len(v) for a in table.values() for v in a.values()), 'moved': len(moved), 'list': moved}))
