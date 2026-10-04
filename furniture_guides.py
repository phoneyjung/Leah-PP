# -*- coding: utf-8 -*-
# Furniture guides, four views of every piece (owner, 4 Oct: redo the whole plain set at a steeper camera angle; four views of every piece).
# The room's floor is drawn as seen from straight above (a tile is square) and its walls at full height. Furniture must use the same rule:
#   the TOP of a piece is drawn at its full depth, and under it the side that faces the viewer at its full height.
# So each view is a box: width x (depth + height), in floor tiles. 74 px per tile here; the game uses 32.
import json
from PIL import Image, ImageDraw
PX = 74; W, H = 1536, 1024; MAG = (255, 0, 255); TOP = (240, 216, 172); FACE = (198, 160, 112); LINE = (92, 70, 50)
# piece: (width along its front, depth front-to-back, height) in tiles
D = {'bed': (1.6, 3.0, 0.7), 'wardrobe': (2.0, 0.9, 2.4), 'desk': (1.8, 0.9, 1.0), 'piano': (2.2, 0.9, 1.6),
     'counter': (3.0, 0.9, 1.1), 'stove': (1.1, 0.9, 1.1), 'shelf': (2.0, 0.6, 1.4), 'sofa': (2.6, 1.1, 1.0),
     'bathtub': (2.4, 1.1, 0.8), 'toilet': (0.8, 1.1, 0.9), 'washstand': (1.2, 0.7, 1.1)}
ONE = {'plant': ('round', 0.8, 1.2), 'roundtable': ('round', 2.4, 0.9), 'rug': ('flat', 3.0, 2.0), 'washtub': ('round', 1.2, 0.7)}
SHEETS = {'A': ['bed', 'wardrobe', 'desk'], 'B': ['piano', 'counter', 'stove'], 'C': ['shelf', 'sofa', 'bathtub'], 'D': ['toilet', 'washstand', '*singles']}      # three pieces a sheet: big enough for the painter to draw detail
CW, CH = W // 4, H // 3; meta = {}
def box(d, cx, base, w, dep, h):
    x0, x1 = cx - w * PX / 2, cx + w * PX / 2; y_face0 = base - h * PX; y_top0 = y_face0 - dep * PX
    d.rectangle((x0, y_top0, x1, y_face0), fill=TOP, outline=LINE, width=3); d.rectangle((x0, y_face0, x1, base), fill=FACE, outline=LINE, width=3)
    return [round(x0), round(y_top0), round(x1), round(base)]
for name, rows in SHEETS.items():
    im = Image.new('RGB', (W, H), MAG); d = ImageDraw.Draw(im); meta[name] = {}
    for r, piece in enumerate(rows):
        base = r * CH + CH - 12
        if piece == '*singles':
            for c, (k, (kind, a, b)) in enumerate(ONE.items()):
                cx = c * CW + CW // 2
                if kind == 'flat': x0, x1 = cx - a * PX / 2, cx + a * PX / 2; d.rectangle((x0, base - b * PX, x1, base), fill=TOP, outline=LINE, width=3); bx = [round(x0), round(base - b * PX), round(x1), round(base)]
                else:
                    rad = a * PX / 2; d.rectangle((cx - rad, base - rad - b * PX, cx + rad, base - rad), fill=FACE); d.ellipse((cx - rad, base - 2 * rad, cx + rad, base), fill=FACE, outline=LINE, width=3)
                    d.ellipse((cx - rad, base - 2 * rad - b * PX, cx + rad, base - b * PX), fill=TOP, outline=LINE, width=3); bx = [round(cx - rad), round(base - 2 * rad - b * PX), round(cx + rad), round(base)]
                meta[name][k] = {'views': 1, 'box': bx, 'tiles': [a, a if kind == 'round' else b, b if kind == 'round' else 0]}
            continue
        w, dep, h = D[piece]; meta[name][piece] = {'views': 4, 'tiles_w_d_h': [w, dep, h], 'boxes': []}
        for c, (bw, bd) in enumerate(((w, dep), (dep, w), (w, dep), (dep, w))):          # facing the viewer, facing right, facing away, facing left
            meta[name][piece]['boxes'].append(box(d, c * CW + CW // 2, base, bw, bd, h))
    im.save(f'3_guide-{name}.png')
json.dump({'px_per_tile': PX, 'cell': [CW, CH], 'columns': ['facing viewer', 'facing right', 'facing away', 'facing left'], 'sheets': meta}, open('furniture_guides.json', 'w'))
tall = max((dd + hh) for (ww, dd, hh) in D.values()); tall2 = max((ww + hh) for (ww, dd, hh) in D.values()); print('tallest box in tiles: front views', tall, '| side views', tall2, '| cell holds', round((CH - 16) / PX, 2))
S = Image.new('RGB', (W // 2 * 2 + 10, H // 2 * 2 + 10), (20, 20, 20))
for i, n in enumerate('ABCD'): S.paste(Image.open(f'3_guide-{n}.png').resize((W // 2, H // 2)), ((i % 2) * (W // 2 + 10), (i // 2) * (H // 2 + 10)))
S.save('_guides.png'); print(S.size)
