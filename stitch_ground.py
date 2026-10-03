# stitch_ground.py — ต่อภาพพื้น (พื้นอย่างเดียว) 4 ชิ้นของ G9 เป็นพื้นทั้งฉาก 1920x1280 (48x32 ช่องผัง × 40 พิกเซล)
# ชิ้นซ้อนกัน 6 ช่องในแนวนอนและ 4 ช่องในแนวตั้ง:  1 = x0-27,y0-18 · 2 = x21-48,y0-18 · 3 = x0-27,y14-32 · 4 = x21-48,y14-32
# ใช้: python3 stitch_ground.py p1.png p2.png p3.png p4.png out.png
import numpy as np, cv2, json, sys
from PIL import Image

U = 40; PW, PH = 27 * U, 18 * U; OX, OY = 6 * U, 4 * U            # piece size and overlaps in world px
paths = sys.argv[1:5]; out_path = sys.argv[5]
P = [np.asarray(Image.open(p).convert('RGB').resize((PW, PH), Image.LANCZOS)).astype(np.float32) for p in paths]
p1, p2, p3, p4 = P

# ---- 1) colours: every piece was painted on its own, so match each to its neighbour over the strip they share. Piece 3 (approved first) is the anchor.
def stats(a): return a.reshape(-1, 3).mean(0), a.reshape(-1, 3).std(0)
def match(img, own_strip, ref_strip):
    m0, s0 = stats(own_strip); m1, s1 = stats(ref_strip); k = np.clip(s1 / np.maximum(s0, 1e-3), 0.9, 1.1)
    return np.clip((img - m0) * k + m1, 0, 255), float(np.abs(m0 - m1).max())
report = {}
p1m, d = match(p1, p1[PH - OY:], p3[:OY]); report['colour gap piece1 vs piece3 before'] = round(d, 1)
p4m, d = match(p4, p4[:, :OX], p3[:, PW - OX:]); report['colour gap piece4 vs piece3 before'] = round(d, 1)
a, d1 = match(p2, p2[:, :OX], p1m[:, PW - OX:]); b, d2 = match(p2, p2[PH - OY:], p4m[:OY]); p2m = (a + b) / 2
report['colour gap piece2 vs neighbours before'] = round(max(d1, d2), 1)
gap = lambda x, y: round(float(np.abs(x.reshape(-1, 3).mean(0) - y.reshape(-1, 3).mean(0)).max()), 1)
report['colour gap after'] = {'1-3': gap(p1m[PH - OY:], p3[:OY]), '4-3': gap(p4m[:, :OX], p3[:, PW - OX:]), '2-1': gap(p2m[:, :OX], p1m[:, PW - OX:]), '2-4': gap(p2m[PH - OY:], p4m[:OY])}

# ---- 2) seams: inside each shared strip, cut along the path where the two paintings differ least (not a straight line, not a wide cross-fade,
#          which would show two half-transparent sets of flowers). A 5-px feather hides the cut itself.
def seam_cols(A, B):            # A, B: (h, w, 3) same strip from the left and the right piece -> for each row the column where B takes over
    d = cv2.GaussianBlur(np.abs(A - B).sum(-1), (0, 0), 2); h, w = d.shape; cost = d.copy()
    for y in range(1, h):
        prev = cost[y - 1]; m = np.minimum(prev, np.minimum(np.roll(prev, 1), np.roll(prev, -1))); m[0] = min(prev[0], prev[1]); m[-1] = min(prev[-1], prev[-2]); cost[y] += m
    path = np.zeros(h, int); path[-1] = int(np.argmin(cost[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]; lo, hi = max(0, x - 1), min(w, x + 2); path[y] = lo + int(np.argmin(cost[y, lo:hi]))
    return path
def join_lr(A, B):              # A covers x 0..PW, B covers x PW-OX.. ; returns the joined row and the seam
    path = seam_cols(A[:, PW - OX:], B[:, :OX]); h = A.shape[0]; W = 2 * PW - OX
    out = np.zeros((h, W, 3), np.float32); out[:, :PW] = A; out[:, PW:] = B[:, OX:]
    xx = np.arange(OX)[None, :]; mask = np.clip((xx - path[:, None]) / 5.0 + 0.5, 0, 1)[..., None]          # 0 = left piece, 1 = right piece
    out[:, PW - OX:PW] = A[:, PW - OX:] * (1 - mask) + B[:, :OX] * mask
    return out, path
top, s_top = join_lr(p1m, p2m); bot, s_bot = join_lr(p3, p4m)
# top row covers y 0..PH, bottom row y PH-OY..; horizontal seam in the shared OY rows (do it with the same routine on transposed strips)
path_h = seam_cols(top[PH - OY:].transpose(1, 0, 2), bot[:OY].transpose(1, 0, 2))                               # for each column the row where the bottom takes over
Wf, Hf = top.shape[1], 2 * PH - OY; full = np.zeros((Hf, Wf, 3), np.float32); full[:PH] = top; full[PH:] = bot[OY:]
yy = np.arange(OY)[:, None]; mask = np.clip((yy - path_h[None, :]) / 5.0 + 0.5, 0, 1)[..., None]
full[PH - OY:PH] = top[PH - OY:] * (1 - mask) + bot[:OY] * mask
Image.fromarray(np.clip(full, 0, 255).astype(np.uint8)).save(out_path)

# ---- 3) how visible are the seams: step across the cut compared with the ordinary step between two neighbouring pixels of the same piece
g = full.mean(-1)
base_h = float(np.abs(np.diff(g, axis=1)).mean()); base_v = float(np.abs(np.diff(g, axis=0)).mean())
def step_v(path, y0, x0):       # vertical seam at x0+path[y], rows y0..
    v = [abs(g[y0 + y, x0 + x + 3] - g[y0 + y, x0 + x - 3]) for y, x in enumerate(path) if 3 <= x < OX - 3]; return float(np.mean(v))
base3_h = float(np.abs(g[:, 6:] - g[:, :-6]).mean()); base3_v = float(np.abs(g[6:] - g[:-6]).mean())
st = float(np.mean([abs(g[PH - OY + y + 3, x] - g[PH - OY + y - 3, x]) for x, y in enumerate(path_h) if 3 <= y < OY - 3]))
report['step across the seam / ordinary step (1.00 = cannot be told apart)'] = {
    'top row, vertical': round(step_v(s_top, 0, PW - OX) / base3_h, 2), 'bottom row, vertical': round(step_v(s_bot, PH - OY, PW - OX) / base3_h, 2), 'between the rows': round(st / base3_v, 2)}
report['size'] = [Wf, Hf]
json.dump({'s_top': s_top.tolist(), 's_bot': s_bot.tolist(), 'path_h': path_h.tolist()}, open(out_path + '.seams.json', 'w'))
print(json.dumps(report, ensure_ascii=False, indent=1))
