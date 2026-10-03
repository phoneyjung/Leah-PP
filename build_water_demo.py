# build_demo.py — สร้าง water-demo.html (ไฟล์เดียวจบ) จากชั้นที่ compose_piece2.py ส่งออก:
#   ground.png (พื้น+เงา) · sprites.png + scene.json (ของทุกชิ้น พร้อมระดับ low / mid / small / high)
# หน้าเว็บแสดง: น้ำขยับ · ใบบัวลอย · เงาปลา · ประกายน้ำ · ลมพัดต้นไม้และพุ่มไม้ 3 ระดับ
import numpy as np, cv2, json, base64, io, sys, os
from PIL import Image

EX = '/home/claude/wd2'
SRC = '/home/claude/g9full'                           # layers exported by compose_g9_full.py (the whole G9 scene)
X, Y, W, H = 470, 792, 600, 440                      # the part of the scene shown on the page (world px): the pond
ground = np.asarray(Image.open(SRC + '/ground_plain.png').convert('RGB'))[Y:Y+H, X:X+W].copy()     # bare ground: shadows are drawn live by the page
scene = json.load(open(SRC + '/scene.json'))
atlas = Image.open(SRC + '/sprites.png').convert('RGBA')

# ---- water: pond body, lily pads lifted out as their own pieces, the water under them filled in ----
hsv = cv2.cvtColor(ground, cv2.COLOR_RGB2HSV); h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
water = ((h > 88) & (h < 125) & (s > 90) & (v > 120)).astype(np.uint8); water = cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((3, 3)))
n, lab, st, cen = cv2.connectedComponentsWithStats(water, connectivity=8); big = max(range(1, n), key=lambda i: st[i][4]); pond = (lab == big).astype(np.uint8)
cnts, _ = cv2.findContours(pond, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); filled = np.zeros_like(pond); cv2.drawContours(filled, cnts, -1, 1, -1)
holes = ((filled == 1) & (pond == 0)).astype(np.uint8); n2, lab2, st2, _ = cv2.connectedComponentsWithStats(holes, connectivity=8)
pads, padmask = [], np.zeros((H, W), np.uint8)
for i in range(1, n2):
    m = (lab2 == i).astype(np.uint8)
    if m.sum() < 40: continue                        # small white ripples at the bank are not pads
    m = cv2.dilate(m, np.ones((3, 3))) & filled
    ys, xs = np.where(m > 0); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    pads.append((int(x0), int(y0), Image.fromarray(np.dstack([ground[y0:y1, x0:x1], (m[y0:y1, x0:x1] * 255).astype(np.uint8)]), 'RGBA'))); padmask |= m
bg = cv2.cvtColor(cv2.inpaint(cv2.cvtColor(ground, cv2.COLOR_RGB2BGR), cv2.dilate(padmask, np.ones((3, 3))), 4, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
pa = Image.new('RGBA', (sum(p[2].width + 2 for p in pads), max(p[2].height for p in pads)), (0, 0, 0, 0)); x = 0; padmeta = []
for px, py, im in pads: pa.paste(im, (x, 0)); padmeta.append([x, 0, im.width, im.height, px, py]); x += im.width + 2
clip = ((pond > 0) | (padmask > 0)).astype(np.uint8)                     # all water: fish are drawn only here
wave = cv2.erode(clip, np.ones((5, 5), np.uint8))                        # moving surface: 2 px in from every bank
deep = cv2.erode(filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
n3, l3, st3, _ = cv2.connectedComponentsWithStats(deep, connectivity=8); deep = (l3 == max(range(1, n3), key=lambda i: st3[i][4])).astype(np.uint8)
ys, xs = np.where(deep > 0); deep_pts = [[int(a), int(b)] for a, b in zip(xs[::37], ys[::37])]
wy, wxs = np.where(wave > 0); wavebox = [int(wxs.min()), int(wy.min()), int(wxs.max()) + 1, int(wy.max()) + 1]

# ---- standing things inside the view: one small atlas with only the sprites that are used ----
inst = [i for i in scene['inst'] if i['x'] + i['r'][2] > X and i['x'] < X + W and i['y'] + i['r'][3] > Y and i['y'] < Y + H]
rects = sorted({tuple(i['r']) for i in inst}, key=lambda r: -r[3]); aw = 760; x = y = rowh = 0; newpos = {}
for r in rects:
    if x + r[2] + 1 > aw: x = 0; y += rowh + 1; rowh = 0
    newpos[r] = (x, y); x += r[2] + 1; rowh = max(rowh, r[3])
sa = Image.new('RGBA', (aw, y + rowh), (0, 0, 0, 0))
for r, (nx, ny) in newpos.items(): sa.paste(atlas.crop((r[0], r[1], r[0] + r[2], r[1] + r[3])), (nx, ny))
out_inst = [{'lv': i['lv'], 'n': i['n'], 'r': [newpos[tuple(i['r'])][0], newpos[tuple(i['r'])][1], i['r'][2], i['r'][3]], 'x': i['x'] - X, 'y': i['y'] - Y, 'by': i['by'] - Y, 'f': i['f'], 'sh': i['sh'], 'hz': i.get('hz', 0)} for i in inst]

def b64(img, fmt='PNG'):
    b = io.BytesIO(); img.save(b, fmt, optimize=True); return base64.b64encode(b.getvalue()).decode()
D = {'w': W, 'h': H, 'bg': b64(Image.fromarray(bg)), 'pads': padmeta, 'padsImg': b64(pa), 'clip': b64(Image.fromarray(clip * 255).convert('L')),
     'wave': b64(Image.fromarray(wave * 255).convert('L')), 'waveBox': wavebox, 'deep': deep_pts, 'sprites': b64(sa), 'inst': out_inst}
import collections
print(json.dumps({'view': [W, H], 'lily_pad_groups': len(pads), 'water_px': int(clip.sum()), 'things_in_view': len(out_inst),
                  'by_level': dict(collections.Counter(i['lv'] for i in out_inst)), 'unique_sprites': len(rects)}))

html = open(EX + '/template.html', encoding='utf8').read().replace('__DATA__', json.dumps(D, separators=(',', ':'))).replace('__W2__', str(W * 2)).replace('__H2__', str(H * 2))
open(EX + '/water-demo.html', 'w', encoding='utf8').write(html)
import re
open(EX + '/_s.js', 'w', encoding='utf8').write(re.findall(r'<script>(.*?)</script>', html, re.S)[-1])
print('water-demo.html', os.path.getsize(EX + '/water-demo.html') // 1024, 'KB')
