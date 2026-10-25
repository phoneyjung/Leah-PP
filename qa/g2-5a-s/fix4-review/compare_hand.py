# fix3 vs fix4 in hand at 75% (x4): crops the same window from two review-hand-x4-75 sheets (both rendered by review_lantern.py from real Codex files).
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
f3, f4, out = sys.argv[1:4]
A3, A4 = [np.array(Image.open(p).convert('RGB')) for p in (f3, f4)]
assert A3.shape == A4.shape == (2428, 1705, 3)
CX = [0, 341, 682, 1023, 1364]; RY = [22, 423, 824, 1225, 1626, 2027]; CW, CH = 336, 396
# lantern centre from light ON / bare / fix4: bright light pixels (R>230, 150<G<200, B<140)
c = A4[RY[1]:RY[1] + CH, CX[0]:CX[0] + CW].astype(int)
m = (c[..., 0] > 230) & (c[..., 1] > 150) & (c[..., 1] < 200) & (c[..., 2] < 140)
ys, xs = np.nonzero(m); cy, cx = int((ys.min() + ys.max()) / 2), int((xs.min() + xs.max()) / 2)
S = 180; y0, x0 = cy - S // 2 + 6, cx - S // 2
assert 16 <= y0 and y0 + S <= CH and 0 <= x0 and x0 + S <= CW, (y0, x0)
cols = [('bare (no Glow/C)', 'fix3 776eae0 (Codex)', A3, 0), ('bare (no Glow/C)', 'fix4 44d2b62 (Codex)', A4, 0),
        ('B2+Glow+C', 'fix3 776eae0 (Codex)', A3, 2), ('B2+Glow+C', 'fix4 44d2b62 (Codex)', A4, 2)]
rows = ['light OFF', 'light ON', 'dark OFF', 'dark ON', 'cave OFF', 'cave ON']
L, T, G = 130, 52, 6
img = Image.new('RGB', (L + 4 * (S + G), T + 6 * (S + G)), (34, 32, 46)); d = ImageDraw.Draw(img)
try: fn = ImageFont.truetype('DejaVuSans.ttf', 11)
except Exception: fn = ImageFont.load_default()
d.text((6, 4), 'Lantern 75% in hand (x4) - fix3 vs fix4 B36 (both real Codex assets) - SIZE PREVIEW ONLY - 24 Oct 2569', fill=(255, 214, 120), font=fn)
for j, (h1, h2, A, ci) in enumerate(cols):
    x = L + j * (S + G); d.text((x, 22), h1, fill=(240, 240, 240), font=fn); d.text((x, 36), h2, fill=(190, 190, 200), font=fn)
    for i, r in enumerate(rows):
        y = T + i * (S + G)
        img.paste(Image.fromarray(A[RY[i] + y0:RY[i] + y0 + S, CX[ci] + x0:CX[ci] + x0 + S]), (x, y))
        if j == 0: d.text((6, y + S // 2 - 6), r, fill=(240, 240, 240), font=fn)
img.save(out); print(out, img.size, 'crop', x0, y0, S)
