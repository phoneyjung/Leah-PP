"""Recover exact pixel art from a lossless zoom screenshot of an in-page overlay.
Overlay: (w+2)x(h+2) cells of S css px; 1-cell #00ff00 frame; transparent = #ff00ff.
usage: decode_shot.py shot.png w h out.png expected_n expected_cs"""
import sys
from PIL import Image
shot, w, h, out, en, ecs = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
im = Image.open(shot).convert('RGB'); W, H = im.size; px = im.load()
gx = [x for x in range(W) for y in (H//2,) if px[x, y] == (0, 255, 0)]
gy = [y for y in range(H) for x in (W//2,) if px[x, y] == (0, 255, 0)]
x0, x1, y0, y1 = min(gx), max(gx), min(gy), max(gy)
cw = (x1 - x0 + 1) / (w + 2); ch = (y1 - y0 + 1) / (h + 2)
o = Image.new('RGBA', (w, h)); op = o.load(); n = 0; cs = 0
for y in range(h):
    for x in range(w):
        sx = int(x0 + (x + 1.5) * cw); sy = int(y0 + (y + 1.5) * ch)
        r, g, b = px[sx, sy]
        if (r, g, b) == (255, 0, 255):
            op[x, y] = (0, 0, 0, 0)
        else:
            op[x, y] = (r, g, b, 255); n += 1
            cs = (cs + (r*3 + g*5 + b*7) * (((y*w + x) % 97) + 1)) % 1000000007
o.save(out)
print(f'cell={cw:.2f}x{ch:.2f} n={n}/{en} cs={cs}/{ecs} ->', 'MATCH' if (n == en and cs == ecs) else 'MISMATCH')
