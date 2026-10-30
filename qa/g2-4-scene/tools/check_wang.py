#!/usr/bin/env python3
# G2.4 Wang check (Claude · 31 Oct 2569 · ASSET_SPEC_10 section 7 item 4)
# PixelLab puts the 16 Wang tiles in ONE fixed 4x4 template (U = upper terrain, L = lower; corners NW,NE,SW,SE; [x,y] = top-left px in the sheet).
# Proof from the pixels: (a) the path sheet (no wall) - every corner read from its 6x6 corner box (colour sets of the pure tiles) = TEMPLATE 16/16;
# (b) the cliff sheet - its two pure tiles sit at the TEMPLATE places and every NW/NE corner = TEMPLATE (SW/SE cannot be read: the cliff face hangs into them).
# With a json: it must equal TEMPLATE with the terrain names of each sheet, and 3 random 8x8 maps (seed 10) must find a tile for every corner combo.
# usage: python3 -I check_wang.py TILES_DIR [g24-tiles.json]   (TILES_DIR may hold the round-1 originals a-tileset-grass-dirt.png / b-tileset-grass-cliff.png)
import sys, os, json, random
from PIL import Image
D = sys.argv[1]; J = sys.argv[2] if len(sys.argv) > 2 else None
TEMPLATE = {(0, 0): 'UULU', (1, 0): 'ULUL', (2, 0): 'LULL', (3, 0): 'UULL', (0, 1): 'LUUL', (1, 1): 'ULLL', (2, 1): 'LLLL', (3, 1): 'LLLU',
            (0, 2): 'ULUU', (1, 2): 'LLUU', (2, 2): 'LLUL', (3, 2): 'LULU', (0, 3): 'UUUU', (1, 3): 'UUUL', (2, 3): 'ULLU', (3, 3): 'LUUU'}
SHEETS = {'g24-tiles-path.png': ('dirt', 'grass', 'a-tileset-grass-dirt.png', 4), 'g24-tiles-cliff.png': ('grass', 'cliff', 'b-tileset-grass-cliff.png', 2)}
BOX = [(0, 0), (26, 0), (0, 26), (26, 26)]
def expected(lo, up): return {','.join(up if c == 'U' else lo for c in v): [t[0] * 32, t[1] * 32] for t, v in TEMPLATE.items()}
def px(im, x, y): return im.getpixel((x, y))
fails, res = [], {}
for n, (lo, up, orig, ncorner) in SHEETS.items():
    p = os.path.join(D, n); im = Image.open(p if os.path.exists(p) else os.path.join(D, orig)).convert('RGB')
    tl = lambda t: [px(im, t[0] * 32 + x, t[1] * 32 + y) for y in range(32) for x in range(32)]
    U = set(tl(next(t for t, v in TEMPLATE.items() if v == 'UUUU'))); L = set(tl(next(t for t, v in TEMPLATE.items() if v == 'LLLL')))
    U, L = U - L, L - U; wrong = []
    for t, v in TEMPLATE.items():
        for i, b in enumerate(BOX[:ncorner]):
            cs = [px(im, t[0] * 32 + b[0] + a, t[1] * 32 + b[1] + c) for c in range(6) for a in range(6)]
            got = 'U' if sum(c in U for c in cs) > sum(c in L for c in cs) else 'L'
            if got != v[i]: wrong.append([t[0] * 32, t[1] * 32, 'NW NE SW SE'.split()[i], 'want ' + v[i]])
    res[n] = {'corners_checked': 16 * ncorner, 'wrong': wrong, 'pure_upper_colours': len(U), 'pure_lower_colours': len(L)}
    if wrong: fails.append('%s: %d corners differ from the template' % (n, len(wrong)))
if J:
    j = json.load(open(J)); rng = random.Random(10); miss = 0; placed = 0
    for n, (lo, up, _, _) in SHEETS.items():
        got = j.get('files', {}).get(n, {}); want = expected(lo, up)
        if got.get('tiles') != want or got.get('lower') != lo or got.get('upper') != up: fails.append('%s: json != template (%d of 16 tiles match)' % (n, sum(1 for k, v in want.items() if got.get('tiles', {}).get(k) == v)))
        inv = got.get('tiles', {})
        for _ in range(3):
            V = [[rng.choice([lo, up]) for _ in range(9)] for _ in range(9)]
            for y in range(8):
                for x in range(8):
                    placed += 1; miss += ','.join((V[y][x], V[y][x + 1], V[y + 1][x], V[y + 1][x + 1])) not in inv
    res['random_maps'] = {'tiles_placed': placed, 'missing_combo': miss}
    if miss: fails.append('%d random-map tiles had no tile in the json' % miss)
res['expected_json'] = {'schema': 1, 'tile': 32, 'files': {n: {'lower': lo, 'upper': up, 'tiles': expected(lo, up)} for n, (lo, up, _, _) in SHEETS.items()}}
res['fails'] = fails; print(json.dumps(res, indent=1)); sys.exit(1 if fails else 0)
