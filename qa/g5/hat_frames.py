# G5.4: the beret (set 15) on every frame of the new character, before it goes into the game.
#   python3 -I -B hat_frames.py BASE_DIR HAT_DIR HEAD_FIT_JSON OUT_DIR
# For each of the 128 frames (idle 4, walk 6, walkhold 6, x 8 views) the hat of that view is moved by the frame's head shift
# (qa/g5/head_fit.py: the shift that best lays idle frame 1's crown on this frame's crown) and checked:
#   eyes   hat pixels on the frame's eye pixels (mask ID 2/5)                      must be 0
#   crown  share of the frame's top 3 head rows under the hat                      plan section 5: >= 90 %
#   gap    rows between the hat's lowest pixel and the head's top edge, per column (only where the head edge is at most 6 rows lower)
#          plan section 5: 0
# and drawn: look-4houses.png (idle frame 1, 8 views, 4 houses, x3), frames-wing.png (all 128 frames, Wing, x2),
# walk-4houses.gif (the walk with the hat, 8 views, x3), portrait-4houses.png (x1).
import sys, os, json
from PIL import Image, ImageDraw

DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
ANIMS = [('idle', 'c2-pilot-kid4-idleanim', 4), ('walk', 'c2-pilot-kid4-walk', 6), ('walkhold', 'c2-pilot-kid4-walkhold', 6)]
base, hatdir, fitp, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
fit = json.load(open(fitp))
pack = json.load(open(os.path.join(base, 'c2-pack.json')))
HOUSES = [(n, [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in r]) for n, r in pack['palette']['house']]
BG = (236, 234, 242, 255)

def recolour(img, msk, ramp):
    """mask ID 8 (house) -> the house ramp at the mask's shade; everything else as drawn"""
    a, m = img.copy(), msk.load(); p = a.load()
    for y in range(a.size[1]):
        for x in range(a.size[0]):
            k = m[x, y]
            if k[3] and k[0] == 8: p[x, y] = ramp[min(3, k[1])] + (p[x, y][3],)
    return a

hat = Image.open(os.path.join(hatdir, 'c2-hat-beret.png')).convert('RGBA'); hatm = Image.open(os.path.join(hatdir, 'c2-hat-beret-mask.png')).convert('RGBA')
sheets = {n: (Image.open(os.path.join(base, f + '.png')).convert('RGBA'), Image.open(os.path.join(base, f + '-mask.png')).convert('RGBA'), k) for n, f, k in ANIMS}

def hat_cell(d, ramp=None):
    i = DIRS.index(d); c = hat.crop((i * 96, 0, i * 96 + 96, 96)); m = hatm.crop((i * 96, 0, i * 96 + 96, 96))
    return recolour(c, m, ramp) if ramp else c

def frame(anim, d, f, ramp=None):
    img, msk, n = sheets[anim]; r = DIRS.index(d)
    c = img.crop((f * 96, r * 96, f * 96 + 96, r * 96 + 96)); m = msk.crop((f * 96, r * 96, f * 96 + 96, r * 96 + 96))
    return (recolour(c, m, ramp) if ramp else c), m

def placed(anim, d, f, ramp=None):
    dx, dy = fit[d][anim][f][:2]; h = hat_cell(d, ramp); out_ = Image.new('RGBA', (96, 96)); out_.paste(h, (dx, dy), h); return out_

# ---- numbers
rows = []; worst = {'eyes': 0, 'crown': 1.0, 'gap': 0}
for anim, _, n in ANIMS:
    for d in DIRS:
        for f in range(n):
            body, m = frame(anim, d, f); hp = placed(anim, d, f).load(); bp = body.load(); mp = m.load()
            H = {(x, y) for y in range(96) for x in range(96) if hp[x, y][3] == 255}
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
            e = len(H & eyes); rows.append((anim, d, f, e, round(cov, 3), g))
            worst['eyes'] = max(worst['eyes'], e); worst['crown'] = min(worst['crown'], cov); worst['gap'] = max(worst['gap'], g)
bad = [r for r in rows if r[3] > 0 or r[4] < 0.9 or r[5] > 0]
res = {'frames': len(rows), 'worst': {'eye_px': worst['eyes'], 'crown_share': round(worst['crown'], 3), 'gap_rows': worst['gap']},
       'frames_below_plan': len(bad), 'below_plan': bad[:20], 'crown_lowest_5': sorted(rows, key=lambda r: r[4])[:5]}
json.dump(res, open(os.path.join(out, 'hat-frames.json'), 'w'), indent=1)
print(json.dumps({k: res[k] for k in ('frames', 'worst', 'frames_below_plan')}))

# ---- pictures
def board(cells, cols, scale, label_rows=None, pad=6, top=18):
    w = cols * (96 * scale + pad) + pad; rws = (len(cells) + cols - 1) // cols; hgt = rws * (96 * scale + pad + top) + pad
    im = Image.new('RGBA', (w, hgt), BG); dr = ImageDraw.Draw(im)
    for i, (lab, c) in enumerate(cells):
        x = pad + (i % cols) * (96 * scale + pad); y = pad + (i // cols) * (96 * scale + pad + top)
        dr.text((x + 2, y + 2), lab, fill=(40, 30, 60, 255)); im.alpha_composite(c.resize((96 * scale, 96 * scale), Image.NEAREST), (x, y + top))
    return im

def on(anim, d, f, ramp):
    b, _ = frame(anim, d, f, ramp); h = placed(anim, d, f, ramp); c = b.copy(); c.alpha_composite(h); return c

cells = [('%s %s' % (hn, d), on('idle', d, 0, ramp)) for hn, ramp in HOUSES for d in DIRS]
board(cells, 8, 3).save(os.path.join(out, 'look-4houses.png'))
wing = dict(HOUSES)['wing']
cells = []
for d in DIRS:
    for anim, _, n in ANIMS:
        for f in range(n): cells.append(('%s %s%d' % (d, anim[:5], f + 1), on(anim, d, f, wing)))
board(cells, 16, 2, top=14).save(os.path.join(out, 'frames-wing.png'))
gif = []
for f in range(6):
    cells = [('%s' % d, on('walk', d, f, ramp)) for (hn, ramp) in HOUSES[:1] + HOUSES[1:2] for d in DIRS[:4]] if False else [('%s' % d, on('walk', d, f, HOUSES[i % 4][1])) for i, d in enumerate(DIRS)]
    gif.append(board(cells, 4, 3).convert('P', palette=Image.ADAPTIVE, colors=255))
gif[0].save(os.path.join(out, 'walk-4houses.gif'), save_all=True, append_images=gif[1:], duration=120, loop=0, disposal=2)
pt = Image.open(os.path.join(base, 'c2-pilot-kid4-pt.png')).convert('RGBA'); ptm = Image.open(os.path.join(base, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA')
hp = Image.open(os.path.join(hatdir, 'c2-hat-beret-pt.png')).convert('RGBA'); hpm = Image.open(os.path.join(hatdir, 'c2-hat-beret-pt-mask.png')).convert('RGBA')
P = Image.new('RGBA', (384 * 4 + 30, 384 + 30), BG); dr = ImageDraw.Draw(P)
for i, (hn, ramp) in enumerate(HOUSES):
    c = recolour(pt, ptm, ramp); c.alpha_composite(recolour(hp, hpm, ramp)); P.alpha_composite(c, (6 + i * 390, 24)); dr.text((10 + i * 390, 6), hn, fill=(40, 30, 60, 255))
P.save(os.path.join(out, 'portrait-4houses.png'))
print('pictures written')
