#!/usr/bin/env python3
# G2.5a round 2 references at 18x18 (Claude · 17 Oct 2569) - guides only, NOT game assets. PixelLab output size = reference size,
# so an 18x18 frame keeps the lantern near 13x18 (round 1 at 32x32 came back 18-20 x 31, 27 px below the ring centre).
#   1-style-18.png   18x18 crop of the locked kid sprite (S idle f1 · brooch, collar, tunic, belt, plum outline)
#   2-shape-18.png   18x18 round-body guide like grid #33: 13 wide x 18 tall, ring centre (9,2) -> 15 px below the grip, unlit glass
# usage: python3 -I make_refs_18.py WORKTREE OUT_DIR
import sys, os
from PIL import Image
WT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
Image.open(os.path.join(WT, 'c2-pilot-kid4-idleanim.png')).convert('RGBA').crop((39, 51, 57, 69)).save(os.path.join(OUT, '1-style-18.png'))
P = {'o': (0x3A, 0x1E, 0x3F), 'c': (0x91, 0x5B, 0x49), 'd': (0x67, 0x41, 0x3A), 'h': (0xBB, 0x7A, 0x57), 'g': (0x4E, 0x33, 0x3B)}
ROWS = {  # y: (x0, pattern) · 18x18 frame · ring rows 0-4 (hole = grip (9,2)) · body rows 8-15 round · base rows 16-17
    0: (8, 'ooo'), 1: (7, 'ohcco'), 2: (7, 'oc.do'), 3: (7, 'occdo'), 4: (8, 'ooo'),
    5: (8, 'oco'),
    6: (6, 'ohhcddo'), 7: (4, 'ohhcccccddo'),
    8: (3, 'odddddddddddo'),
    9: (4, 'ocggghgggdo'), 10: (3, 'ocgggghggggdo'), 11: (3, 'ocggghhhgggdo'), 12: (3, 'ocggghhhgggdo'), 13: (3, 'ocgggghggggdo'), 14: (4, 'ocggggggddo'),
    15: (3, 'odddddddddddo'),
    16: (5, 'ohccccddo'), 17: (6, 'ooooooo'),
}
g = Image.new('RGBA', (18, 18), (0, 0, 0, 0))
for y, (x0, pat) in ROWS.items():
    for i, ch in enumerate(pat):
        if ch != '.': g.putpixel((x0 + i, y), P[ch] + (255,))
g.save(os.path.join(OUT, '2-shape-18.png')); bb = g.getbbox()
print('2-shape-18 bbox', bb, 'w', bb[2] - bb[0], 'h', bb[3] - bb[1], 'below grip', bb[3] - 1 - 2, 'above grip', 2 - bb[1])
