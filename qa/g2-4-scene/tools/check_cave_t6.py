"""T6 acceptance check for g24-cave-mouth.png (ASSET_SPEC_10 v1.2, criteria 1-6).
usage: python3 check_cave_t6.py <raw e2-cave192-raw.png> <g24-cave-mouth.png> <g24-cave-mouth.json>
exit 0 = all pass. Criterion 7 (owner score) is not measured here."""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

raw = np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(int)
new = np.array(Image.open(sys.argv[2]).convert('RGBA')).astype(int)
meta = json.load(open(sys.argv[3]))
BX0, BX1, BY0, BY1 = 58, 133, 86, 171
FILL = (20, 12, 24)
res = {}

# 1 size + alpha
inbox = np.zeros(raw.shape[:2], bool); inbox[BY0:BY1 + 1, BX0:BX1 + 1] = True
a = new[..., 3]
res['1_size_alpha'] = bool(new.shape == (192, 192, 4) and set(np.unique(a)) <= {0, 255}
                           and (a[~inbox] == raw[..., 3][~inbox]).all() and (a[inbox] == 255).all())
# 2 outside box identical
res['2_outside_diff_px'] = int((new[~inbox] != raw[~inbox]).any(-1).sum())
# 3 palette
pal = {tuple(c) for c in raw[raw[..., 3] > 0][:, :3]}
opq = new[new[..., 3] > 0][:, :3]
res['3_new_colour_px'] = int(sum(1 for c in map(tuple, opq) if c not in pal))
# 4 opening
m = (new[..., :3] == FILL).all(-1) & (a > 0)
lab, _ = ndimage.label(m)
L = lab[150, 95]
op = lab == L if L else np.zeros_like(m)
ys, xs = np.where(op)
x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
w, h, cx = x1 - x0 + 1, y1 - y0 + 1, (x0 + x1) / 2
res['4_opening'] = [x0, y0, x1, y1]; res['4_w_h_cx'] = [w, h, cx]
res['4_pass'] = bool(L and x0 <= 70 and x1 >= 120 and 51 <= w <= 56 and 94.5 <= cx <= 96.5 and 96 <= y0 <= 100 and y1 == 171)
# 5 solid rows + rounded top
rows = {}
ok = True
for y in range(y0, y1 + 1):
    r = np.where(op[y])[0]
    solid = len(r) == r.max() - r.min() + 1
    rows[y] = len(r); ok &= solid
widths = [rows[y] for y in range(y0, y1 + 1)]
top = widths[:16]
res['5_solid_rows'] = bool(ok)
res['5_min_width_lower'] = int(min(widths[16:]))
res['5_top_non_decreasing'] = bool(all(top[i] <= top[i + 1] for i in range(len(top) - 1)))
res['5_top_row_width'] = int(widths[0])
res['5_pass'] = bool(ok and min(widths[16:]) >= 48 and res['5_top_non_decreasing'] and 8 <= widths[0] <= 30)
# 6 json
res['6_json'] = bool(meta.get('schema') == 1 and meta.get('file') == 'g24-cave-mouth.png' and meta.get('size') == [192, 192]
                     and meta.get('opening') == [x0, y0, x1, y1] and meta.get('floor_y') == 171 and meta.get('fill') == list(FILL))
passed = res['1_size_alpha'] and res['2_outside_diff_px'] == 0 and res['3_new_colour_px'] == 0 and res['4_pass'] and res['5_pass'] and res['6_json']
res['PASS'] = bool(passed)
print(json.dumps(res, ensure_ascii=False, indent=1))
sys.exit(0 if passed else 1)
