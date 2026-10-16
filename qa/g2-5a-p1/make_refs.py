#!/usr/bin/env python3
# G2.5a P1 reference images (Claude · 17 Oct 2569) - guides only, NOT game assets:
#   1-style.png              32x32 crop of the locked kid sprite (S idle f1: brooch, tunic, belt, gloves, cape edge, plum outline) = PixelLab style reference
#   2-shape.png              32x32 size/silhouette guide 13x18, lit glass (13 px wide, 15 px below the grip = the ceiling) = PixelLab shape reference
#   guide-small-11x16.png    32x32 smaller guide 11x16 (13 px below the grip), unlit glass, for the scale comparison only
#   2-shape-unlit.png        32x32 same 13x18 silhouette as 2-shape.png, dark glass + crystal shape without light (proposed PixelLab shape reference)
# grip = ring centre (16,6) in every guide. Colours: plum outline #3A1E3F, Copper Trim 4 shades (proposed), light #FFB36B / #FFF0C9.
# usage: python3 -I make_refs.py WORKTREE OUT_DIR
import sys, os
from PIL import Image
WT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
Image.open(os.path.join(WT, 'c2-pilot-kid4-idleanim.png')).convert('RGBA').crop((32, 50, 64, 82)).save(os.path.join(OUT, '1-style.png'))
P = {'o': (0x3A, 0x1E, 0x3F), 'c': (0x91, 0x5B, 0x49), 'd': (0x67, 0x41, 0x3A), 'h': (0xBB, 0x7A, 0x57), 's': (0x3D, 0x29, 0x2C),
     'g': (0x4E, 0x33, 0x3B), 'k': (0xFF, 0xB3, 0x6B), 'w': (0xFF, 0xF0, 0xC9), 'G': (0xFF, 0xB3, 0x6B), 'K': (0xFF, 0xF0, 0xC9)}
RING = {4: (15, 'ooo'), 5: (14, 'ohcco'), 6: (14, 'oc.do'), 7: (14, 'occdo'), 8: (15, 'ooo'), 9: (15, 'oco')}   # ring (hole = grip) + neck
LARGE = {**RING, **{   # 13 wide (x10-22), bottom row 21 = 15 below the grip, lit glass (G) and core (K)
    10: (13, 'ohhcddo'), 11: (11, 'ohhcccccddo'), 12: (10, 'odddddddddddo'),
    13: (10, 'ocGGcGGGcGGdo'), 14: (10, 'ocGGcGKGcGGdo'), 15: (10, 'ocGGcKKKcGGdo'), 16: (10, 'ocGGcKKKcGGdo'), 17: (10, 'ocGGcGKGcGGdo'), 18: (10, 'ocGGcGGGcGGdo'),
    19: (10, 'odddddddddddo'), 20: (12, 'ohccccddo'), 21: (13, 'ooooooo')}}
SMALL = {**RING, **{   # 11 wide (x11-21), bottom row 19 = 13 below the grip, unlit glass (g) with a small core (k/w)
    10: (14, 'ohcdo'), 11: (12, 'ohhcccddo'), 12: (11, 'odddddddddo'),
    13: (11, 'ocgcgggcgdo'), 14: (11, 'ocgcwkkcgdo'), 15: (11, 'ocgckkkcgdo'), 16: (11, 'ocgcgkgcgdo'),
    17: (11, 'odddddddddo'), 18: (13, 'ohcccdo'), 19: (14, 'ooooo')}}
UNLIT = {y: (x0, pat.replace('G', 'g').replace('K', 'h')) for y, (x0, pat) in LARGE.items()}   # same silhouette, dark warm glass, crystal shape in copper tones (no light) - matches the 'no emitted light' prompt
for name, rows in (('2-shape.png', LARGE), ('guide-small-11x16.png', SMALL), ('2-shape-unlit.png', UNLIT)):
    g = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    for y, (x0, pat) in rows.items():
        for i, ch in enumerate(pat):
            if ch != '.': g.putpixel((x0 + i, y), P[ch] + (255,))
    g.save(os.path.join(OUT, name)); bb = g.getbbox()
    print(name, 'bbox', bb, 'w', bb[2] - bb[0], 'h', bb[3] - bb[1], 'below grip', bb[3] - 1 - 6, 'above grip', 6 - bb[1])
