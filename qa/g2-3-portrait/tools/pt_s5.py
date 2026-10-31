#!/usr/bin/env python3
# G2.3 S5 (Claude · 1 Nov 2569): ASSET_SPEC_14 v1.1 section 4 items 4.5 / 4.6 + the 16-set sheet for the owner (4.8).
# D-PT-3 ก: every portrait shade of a colour-changing material is matched to the NEAREST game shade BY BRIGHTNESS (Y) of the base option
# (the game option closest to the portrait's own colours), then that shade index is used for every option. No new colours are made.
# usage: python3 -I pt_s5.py REPO_ROOT OUT_DIR   -> OUT_DIR/s5.json, OUT_DIR/pt-16-sets.png ; writes REPO_ROOT/c2-pilot-kid4-pt-shademap.json
import sys, os, json, itertools
import numpy as np
from PIL import Image, ImageDraw
from skimage.color import rgb2lab, deltaE_ciede2000
ROOT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, ROOT)
import qa_asset09_a3 as q          # RAMPS (locked game ramps, Palette v1.2), sprite renderer, locked signal exceptions

GROUP = {3: 'skin', 4: 'hair', 5: 'iris', 8: 'house'}
SIG = {'#FFC857': 'gold (tap)', '#5FE0FF': 'cyan', '#7FE0FF': 'cyan old'}
EXC = {('hair', 'Blonde', 3), ('iris', 'Amber', 2), ('house', 'Sun', 1), ('house', 'Sun', 2), ('house', 'Sun', 3)}   # (group, option, shade index 0-based)
SETS16 = ['Brown/Green/Medium/Wing', 'Black/Brown/Light/Sun', 'Blonde/Blue/Deep/Sun', 'Red/Amber/Tan/Leaf', 'Pink/Black/Medium/Flame', 'Blue/Green/Light/Leaf',
          'Silver/Amber/Deep/Wing', 'Green/Blue/Tan/Flame', 'Black/Amber/Deep/Leaf', 'Blonde/Brown/Light/Flame', 'Brown/Amber/Tan/Sun', 'Red/Green/Deep/Flame',
          'Pink/Blue/Light/Wing', 'Blue/Brown/Medium/Sun', 'Silver/Black/Tan/Leaf', 'Green/Black/Medium/Wing']

def rgb(h): return [int(h[k:k + 2], 16) for k in (1, 3, 5)]
def Y(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def lab(cols): return rgb2lab(np.array([cols], float) / 255)[0]
def names(g): return [n for n, _ in q.RAMPS[g]]

pt = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-pt.png')).convert('RGBA'))
mk = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA'))
MJ = json.load(open(os.path.join(ROOT, 'c2-pilot-kid4-pt-mask.json')))
R, G = mk[..., 0].astype(int), mk[..., 1].astype(int); op = pt[..., 3] == 255

# ---- shade map (D-PT-3) ----
smap = {'schema': 1, 'image': 'c2-pilot-kid4-pt.png', 'mask': 'c2-pilot-kid4-pt-mask.png',
        'method': 'D-PT-3 ก: base option = game option with the lowest pixel-weighted mean dE00 to the portrait colours of that material; each portrait shade (G) -> the base option shade with the nearest Y = 0.2126R+0.7152G+0.0722B (tie -> darker); the same index is used for every option',
        'materials': {}}
for mid, grp in GROUP.items():
    sh = MJ['materials'][str(mid)]['shades']; px = MJ['materials'][str(mid)]['px']
    L = lab([rgb(h) for h in sh]); best = None
    for oi, (on, ramp) in enumerate(q.RAMPS[grp]):
        RL = lab([rgb(h) for h in ramp])
        d = np.array([deltaE_ciede2000(np.tile(L[i], (len(RL), 1)), RL).min() for i in range(len(sh))])
        score = float((d * np.array(px)).sum() / sum(px))
        if best is None or score < best[0]: best = (score, oi, on)
    ramp = q.RAMPS[grp][best[1]][1]; ry = [Y(rgb(h)) for h in ramp]
    idx = [min(range(len(ramp)), key=lambda k: (abs(Y(rgb(h)) - ry[k]), k)) for h in sh]
    smap['materials'][str(mid)] = {'group': grp, 'base': best[2], 'base_mean_dE00': round(best[0], 2), 'shade_index_by_G': idx,
                                   'px_per_index': [int(sum(p for p, i in zip(px, idx) if i == k)) for k in range(len(ramp))]}
json.dump(smap, open(os.path.join(ROOT, 'c2-pilot-kid4-pt-shademap.json'), 'w'), indent=1)
IDX = {mid: np.array(smap['materials'][str(mid)]['shade_index_by_G']) for mid in GROUP}

def render(opts):
    out = pt.copy()
    for mid, grp in GROUP.items():
        m = R == mid; out[m, :3] = q.ramp_arr(grp, opts[grp])[IDX[mid][G[m]]]
    return out

# ---- 4.5 leak test: 640 combos; change ONE group -> only that group's pixels may change ----
NO = {g: len(q.RAMPS[g]) for g in ('hair', 'iris', 'skin', 'house')}
fixedm = op & ~np.isin(R, list(GROUP)); res = {'combos': 0, 'renders': 0, 'cross_material_px': 0, 'fixed_changed_px': 0, 'alpha_changed_px': 0, 'unchanged_when_option_changes_px': 0}
cache = {}
def get(o):
    k = tuple(o[g] for g in ('hair', 'iris', 'skin', 'house'))
    if k not in cache: cache[k] = render(o); res['renders'] += 1
    return cache[k]
for hi, ii, si, ho in itertools.product(range(NO['hair']), range(NO['iris']), range(NO['skin']), range(NO['house'])):
    o = {'hair': hi, 'iris': ii, 'skin': si, 'house': ho}; a = get(o); res['combos'] += 1
    res['fixed_changed_px'] += int((a[fixedm] != pt[fixedm]).any(1).sum()); res['alpha_changed_px'] += int((a[..., 3] != pt[..., 3]).sum())
    for mid, grp in GROUP.items():
        o2 = dict(o); o2[grp] = (o[grp] + 1) % NO[grp]; b = get(o2); d = (a != b).any(2)
        res['cross_material_px'] += int((d & (R != mid)).sum())
        res['unchanged_when_option_changes_px'] += int(((R == mid) & ~d).sum())   # info: shades two options share
    if len(cache) > 64: cache.clear()

# ---- 4.6 signal colours: every combo, every output colour; locked exceptions reported, anything else = FAIL ----
sig_lab = {h: lab([rgb(h)])[0] for h in SIG}
def near(c):
    l = lab([c])[0]; return {h: float(deltaE_ciede2000(l[None], sig_lab[h][None])[0]) for h in SIG}
colour_src = {}   # rgb -> set of (group, option, index) or ('fixed', id)
for y_, x_ in zip(*np.where(fixedm)): colour_src.setdefault(tuple(int(v) for v in pt[y_, x_, :3]), set()).add(('fixed', int(R[y_, x_])))
for mid, grp in GROUP.items():
    for oi, (on, ramp) in enumerate(q.RAMPS[grp]):
        for k in sorted(set(IDX[mid].tolist())): colour_src.setdefault(tuple(rgb(ramp[k])), set()).add((grp, on, k))
hits = []
for c, src in colour_src.items():
    d = near(c)
    for h, v in d.items():
        if v < 10: hits.append({'colour': '#%02X%02X%02X' % c, 'signal': h, 'dE00': round(v, 2), 'from': sorted(map(list, src)), 'locked_exception': all(tuple(s) in EXC for s in src)})
exc_px = {}
for hit in hits:
    for s in hit['from']:
        if tuple(s) in EXC:
            grp, on, k = s; mid = [m for m, g in GROUP.items() if g == grp][0]
            exc_px['%s %s shade %d %s' % (grp, on, k + 1, hit['colour'])] = int(np.isin(G[R == mid], np.where(IDX[mid] == k)[0]).sum())
res_sig = {'colours_checked': len(colour_src), 'hits': hits, 'unexpected_hits': [h for h in hits if not h['locked_exception']], 'exception_px_when_used': exc_px,
           'source_min_dE00': {h: round(min(near(tuple(int(v) for v in c))[h] for c in np.unique(pt[op][:, :3], axis=0)), 2) for h in SIG}}

# ---- default fidelity: base options vs the portrait as drawn (info for the owner) ----
base = {GROUP[m]: names(GROUP[m]).index(smap['materials'][str(m)]['base']) for m in GROUP}
dflt = render(base); fid = {}
for mid in GROUP:
    m = R == mid; d = deltaE_ciede2000(rgb2lab(pt[m][:, :3][None] / 255.0)[0], rgb2lab(dflt[m][:, :3][None] / 255.0)[0])
    fid[GROUP[mid]] = {'mean_dE00': round(float(d.mean()), 2), 'p95_dE00': round(float(np.percentile(d, 95)), 2)}

# ---- 4.8 sheet: 16 sets, portrait 1:1 next to the in-game kid (S idle f0, game renderer, x2) ----
SA = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-idleanim.png')).convert('RGBA'))[0:96, 0:96]
SM = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-idleanim-mask.png')).convert('RGBA'))[0:96, 0:96]
TW, TH = 384 + 8 + 192 + 16, 384 + 28; sheet = Image.new('RGB', (4 * TW + 8, 4 * TH + 40), (30, 30, 42)); d = ImageDraw.Draw(sheet)
d.text((8, 10), 'G2.3 S5 · 16 colour sets (hair / eyes / skin / house) · portrait 1:1 · in-game kid x2 (same renderer rules) · mouth/cheek fixed (G2.0 P3)', fill=(235, 235, 245))
for i, s in enumerate(SETS16):
    hn, en, sn, un = s.split('/'); o = {'hair': names('hair').index(hn), 'iris': names('iris').index(en), 'skin': names('skin').index(sn), 'house': names('house').index(un)}
    a = Image.fromarray(render(o)); sp = Image.fromarray(q.render(SA, SM[..., 0], SM[..., 1], o)).resize((192, 192), Image.NEAREST)
    x0, y0 = 8 + (i % 4) * TW, 40 + (i // 4) * TH; bg = (54, 54, 72) if (i // 4 + i % 4) % 2 else (44, 46, 60)
    d.rectangle([x0, y0, x0 + TW - 8, y0 + TH - 8], fill=bg); sheet.paste(a, (x0, y0 + 20), a); sheet.paste(sp, (x0 + 392, y0 + 20 + 384 - 192), sp)
    d.text((x0 + 4, y0 + 4), '%d  %s' % (i + 1, s), fill=(235, 235, 245))
sheet.save(os.path.join(OUT, 'pt-16-sets.png'), optimize=True)

R5 = {'shade_map': smap, 'leak_640': res, 'signal': res_sig, 'default_fidelity': fid,
      'pass': {'4.5 cross-material px = 0, fixed px changed = 0, alpha changed = 0 over 640 combos': res['combos'] == 640 and res['cross_material_px'] == 0 and res['fixed_changed_px'] == 0 and res['alpha_changed_px'] == 0,
               '4.6 signal hits outside the 5 locked exceptions = 0': not res_sig['unexpected_hits']}}
json.dump(R5, open(os.path.join(OUT, 's5.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'base': {GROUP[m]: smap['materials'][str(m)]['base'] for m in GROUP}, 'leak': res, 'hits': len(hits), 'unexpected': len(res_sig['unexpected_hits']),
                  'exception_px': exc_px, 'fidelity': fid, 'pass': R5['pass']}, ensure_ascii=False))
sys.exit(0 if all(R5['pass'].values()) else 1)
