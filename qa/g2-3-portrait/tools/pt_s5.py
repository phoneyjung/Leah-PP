#!/usr/bin/env python3
# G2.3 S5 (Claude · 1 Nov 2569 · v1.1 after Codex T11): ASSET_SPEC_14 v1.1 section 4 items 4.5 / 4.6 + the 16-set sheet for the owner (4.8).
# D-PT-3 ก: every portrait shade of a colour-changing material is matched to the NEAREST game shade BY BRIGHTNESS (Y) of the base option
# (the game option closest to the portrait's own colours), then that shade index is used for every option. No new colours are made.
#
# v1.1 (T11 R1): every check reads the pictures the renderer really draws (not the palette tables):
#   - pixel oracle: each of the 640 renders must equal, pixel by pixel, the colour looked up from mask (R id, G shade) + the shade map on disk + Palette
#     (built on a different code path from render()); fixed colours and alpha must not change
#   - signal check: the colours found in those 640 outputs, each with where it came from (material, option, shade), are measured against the signal colours
#   - build and check are separate: by default nothing in REPO_ROOT is written; the shade map on disk must equal the D-PT-3 build byte for byte
#   - --selftest: the checker is run on broken renderers / a wrong shade map and must FAIL each one (exit 0 = every fault caught)
# v1.1.1 (Codex T12 note): importing qa_asset09_a3 from REPO_ROOT no longer leaves REPO_ROOT/__pycache__ behind (dont_write_bytecode)
# usage: python3 -I pt_s5.py REPO_ROOT OUT_DIR [--write-map]   -> OUT_DIR/s5.json, OUT_DIR/pt-16-sets.png   (--write-map: also (re)write the shade map)
#        python3 -I pt_s5.py REPO_ROOT --selftest [OUT.json]
import sys, os, json, itertools
import numpy as np
from PIL import Image, ImageDraw
from skimage.color import rgb2lab, deltaE_ciede2000
ROOT = sys.argv[1]; SELFTEST = '--selftest' in sys.argv; WRITE = '--write-map' in sys.argv
rest = [a for a in sys.argv[2:] if not a.startswith('--')]; OUT = rest[0] if rest else None
sys.path.insert(0, ROOT); sys.dont_write_bytecode = True   # T12: write nothing into REPO_ROOT, not even an import cache
import qa_asset09_a3 as q         # RAMPS (locked game ramps, Palette v1.2), sprite renderer

GROUP = {3: 'skin', 4: 'hair', 5: 'iris', 8: 'house'}; GORDER = ('hair', 'iris', 'skin', 'house')
SIG = {'#FFC857': 'gold (tap)', '#5FE0FF': 'cyan', '#7FE0FF': 'cyan old'}
EXC = {('hair', 'Blonde', 3), ('iris', 'Amber', 2), ('house', 'Sun', 1), ('house', 'Sun', 2), ('house', 'Sun', 3)}   # (group, option, shade index 0-based)
SETS16 = ['Brown/Green/Medium/Wing', 'Black/Brown/Light/Sun', 'Blonde/Blue/Deep/Sun', 'Red/Amber/Tan/Leaf', 'Pink/Black/Medium/Flame', 'Blue/Green/Light/Leaf',
          'Silver/Amber/Deep/Wing', 'Green/Blue/Tan/Flame', 'Black/Amber/Deep/Leaf', 'Blonde/Brown/Light/Flame', 'Brown/Amber/Tan/Sun', 'Red/Green/Deep/Flame',
          'Pink/Blue/Light/Wing', 'Blue/Brown/Medium/Sun', 'Silver/Black/Tan/Leaf', 'Green/Black/Medium/Wing']
MAPFILE = os.path.join(ROOT, 'c2-pilot-kid4-pt-shademap.json')

def rgb(h): return [int(h[k:k + 2], 16) for k in (1, 3, 5)]
def Y(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def lab(cols): return rgb2lab(np.array([cols], float) / 255)[0]
def names(g): return [n for n, _ in q.RAMPS[g]]
def hexs(g, oi): r = q.RAMPS[g][oi][1]; return [h.upper() for h in (r.split() if isinstance(r, str) else list(r))]

pt = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-pt.png')).convert('RGBA'))
mk = np.array(Image.open(os.path.join(ROOT, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA'))
MJ = json.load(open(os.path.join(ROOT, 'c2-pilot-kid4-pt-mask.json')))
R, G = mk[..., 0].astype(int), mk[..., 1].astype(int); op = pt[..., 3] == 255
fixedm = op & ~np.isin(R, list(GROUP))
NO = {g: len(q.RAMPS[g]) for g in GORDER}

# ---- build: shade map (D-PT-3) ----
def build_map():
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
    return smap
BUILT = build_map(); BUILT_TXT = json.dumps(BUILT, indent=1)
if WRITE: open(MAPFILE, 'w').write(BUILT_TXT)
DISK_TXT = open(MAPFILE).read() if os.path.exists(MAPFILE) else ''
DISK = json.loads(DISK_TXT) if DISK_TXT else None

def idx_of(smap): return {mid: np.array(smap['materials'][str(mid)]['shade_index_by_G']) for mid in GROUP}

# ---- renderer under test (same rule as the page) ----
def make_render(IDX):
    def render(opts):
        out = pt.copy()
        for mid, grp in GROUP.items():
            m = R == mid; out[m, :3] = q.ramp_arr(grp, opts[grp])[IDX[mid][G[m]]]
        return out
    return render

# ---- oracle: a different code path (one lookup per (id, G) pair, hex strings from Palette, shade map as given) ----
KEY = R * 256 + G; UKEYS = np.unique(KEY[op & np.isin(R, list(GROUP))])
KEYMASK = {u: KEY == u for u in UKEYS.tolist()}
def make_oracle(smap):
    lut = {}
    def oracle(opts):
        out = pt.copy()
        for u, m in KEYMASK.items():
            mid, g = divmod(u, 256); grp = GROUP[mid]
            k = smap['materials'][str(mid)]['shade_index_by_G'][g]
            ck = (grp, opts[grp], k)
            if ck not in lut: lut[ck] = rgb(hexs(grp, opts[grp])[k])
            out[m, :3] = lut[ck]
        return out
    return oracle

# ---- checks ----
def all_combos(): return [dict(zip(GORDER, c)) for c in itertools.product(*(range(NO[g]) for g in GORDER))]
def diag_combos(): return [{'hair': i % NO['hair'], 'iris': i % NO['iris'], 'skin': i % NO['skin'], 'house': i % NO['house']} for i in range(40)]   # every option of every group

def run_checks(render, smap, combos):
    oracle = make_oracle(smap)
    res = {'combos': len(combos), 'renders': 0, 'oracle_wrong_px': 0, 'cross_material_px': 0, 'fixed_changed_px': 0, 'alpha_changed_px': 0,
           'not_in_ramp_colours': 0, 'unchanged_when_option_changes_px': 0}
    cache = {}
    def get(o):
        k = tuple(o[g] for g in GORDER)
        if k not in cache: cache[k] = render(o); res['renders'] += 1
        return cache[k]
    prov = {}      # output colour -> set of (group, option name, shade index | None) or ('fixed', id, None)
    for o in combos:
        a = get(o); exp = oracle(o)
        res['oracle_wrong_px'] += int((a != exp).any(2).sum())
        res['fixed_changed_px'] += int((a[fixedm] != pt[fixedm]).any(1).sum()); res['alpha_changed_px'] += int((a[..., 3] != pt[..., 3]).sum())
        # colours really drawn, with where they came from
        packed = ((a[..., 0].astype(np.int64) << 16) | (a[..., 1].astype(np.int64) << 8) | a[..., 2].astype(np.int64)) * 16 + R
        for v in np.unique(packed[a[..., 3] > 0]).tolist():
            c, mid = divmod(v, 16); col = '#%06X' % c
            if mid in GROUP:
                grp = GROUP[mid]; hs = hexs(grp, o[grp]); k = hs.index(col) if col in hs else None
                if k is None: res['not_in_ramp_colours'] += 1
                prov.setdefault(col, set()).add((grp, names(grp)[o[grp]], k))
            else: prov.setdefault(col, set()).add(('fixed', mid, None))
        for mid, grp in GROUP.items():
            o2 = dict(o); o2[grp] = (o[grp] + 1) % NO[grp]; b = get(o2); d = (a != b).any(2)
            res['cross_material_px'] += int((d & (R != mid)).sum())
            res['unchanged_when_option_changes_px'] += int(((R == mid) & ~d).sum())   # info: shades two options share
        if len(cache) > 64: cache.clear()
    # 4.6 signal colours measured on the output colours
    hits = []; cols = sorted(prov)
    L = rgb2lab(np.array([[rgb(c) for c in cols]], float) / 255)[0]
    for h in SIG:
        d = deltaE_ciede2000(L, np.tile(lab([rgb(h)])[0], (len(cols), 1)))
        for c, v in zip(cols, d):
            if v < 10:
                src = sorted(prov[c], key=str)
                hits.append({'colour': c, 'signal': h, 'dE00': round(float(v), 2), 'from': [list(s) for s in src],
                             'locked_exception': all(s[2] is not None and (s[0], s[1], s[2]) in EXC for s in src)})
    sig = {'output_colours': len(cols), 'hits': hits, 'unexpected_hits': [h for h in hits if not h['locked_exception']]}
    p = {'map': (DISK_TXT == BUILT_TXT) if smap is DISK else (smap == BUILT),
         '4.5': res['oracle_wrong_px'] == 0 and res['cross_material_px'] == 0 and res['fixed_changed_px'] == 0 and res['alpha_changed_px'] == 0 and res['not_in_ramp_colours'] == 0,
         '4.6': not sig['unexpected_hits']}
    return res, sig, p

if DISK is None:
    print(json.dumps({'error': 'shade map missing: ' + MAPFILE + ' (run once with --write-map)'})); sys.exit(1)

# ---- --selftest: broken renderers / a wrong map must be caught ----
if SELFTEST:
    good = make_render(idx_of(DISK)); C = diag_combos()
    def paint(f):
        def r(o): a = good(o).copy(); f(a, o); return a
        return r
    def off_by_one(o):
        I = idx_of(DISK); I[3] = np.minimum(I[3] + 1, 4); return make_render(I)(o)
    badmap = json.loads(DISK_TXT); bm = badmap['materials']['4']['shade_index_by_G']; j = next(i for i in range(len(bm) - 1) if bm[i] != bm[i + 1]); bm[j], bm[j + 1] = bm[j + 1], bm[j]
    def setpx(sel, val): return lambda a, o: a.__setitem__(sel, val)
    cases = [('clean', good, DISK, set()),
             ('hair painted #FFC857 (T11 R1 probe)', paint(setpx((R == 4, slice(0, 3)), [255, 200, 87])), DISK, {'4.5', '4.6'}),
             ('copper (fixed) painted #FFC857', paint(setpx((R == 9, slice(0, 3)), [255, 200, 87])), DISK, {'4.5', '4.6'}),
             ('no recolour at all', lambda o: pt.copy(), DISK, {'4.5'}),
             ('hair option leaks into skin', paint(lambda a, o: a.__setitem__((R == 3, slice(0, 3)), q.ramp_arr('hair', o['hair'])[2])), DISK, {'4.5'}),
             ('outline colour changed', paint(setpx((R == 1, slice(0, 3)), [1, 2, 3])), DISK, {'4.5'}),
             ('alpha changed', paint(setpx((R == 6, 3), 128)), DISK, {'4.5'}),
             ('skin shade off by one', off_by_one, DISK, {'4.5'}),
             ('shade map on disk differs from the D-PT-3 build', make_render(idx_of(badmap)), badmap, {'map'})]
    out = []
    for name, rend, smap, want_fail in cases:
        _, sig, p = run_checks(rend, smap, C); failed = {k for k, v in p.items() if not v}
        caught = failed == want_fail
        out.append({'case': name, 'want_fail': sorted(want_fail), 'failed': sorted(failed), 'ok': caught, 'unexpected_signal_hits': len(sig['unexpected_hits'])})
        print(('ok   ' if caught else 'MISS ') + name, sorted(failed), flush=True)
    n = sum(c['ok'] for c in out); print('%d/%d' % (n, len(out)))
    if OUT: json.dump({'selftest': out, 'passed': n, 'total': len(out)}, open(OUT, 'w'), indent=1, ensure_ascii=False)
    sys.exit(0 if n == len(out) else 1)

os.makedirs(OUT, exist_ok=True)
IDX = idx_of(DISK); render = make_render(IDX)
res, res_sig, P = run_checks(render, DISK, all_combos())

exc_px = {}
for hit in res_sig['hits']:
    for grp, on, k in map(tuple, hit['from']):
        if (grp, on, k) in EXC:
            mid = [m for m, g in GROUP.items() if g == grp][0]; o = {g: 0 for g in GORDER}; o[grp] = names(grp).index(on)
            exc_px['%s %s shade %d %s' % (grp, on, k + 1, hit['colour'])] = int(((R == mid) & (render(o)[..., :3] == rgb(hit['colour'])).all(2)).sum())
res_sig['exception_px_when_used'] = exc_px
SRC = np.unique(pt[op][:, :3], axis=0); SL = rgb2lab(SRC[None] / 255.0)[0]
res_sig['source_min_dE00'] = {h: round(float(deltaE_ciede2000(SL, np.tile(lab([rgb(h)])[0], (len(SRC), 1))).min()), 2) for h in SIG}

# ---- default fidelity: base options vs the portrait as drawn (info for the owner) ----
# (base_mean_dE00 in the shade map = the score used to CHOOSE the base option; this is the result AFTER the nearest-Y mapping)
base = {GROUP[m]: names(GROUP[m]).index(DISK['materials'][str(m)]['base']) for m in GROUP}
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

R5 = {'version': '1.1', 'shade_map': DISK, 'leak_640': res, 'signal': res_sig, 'default_fidelity_after_mapping': fid,
      'pass': {'map: shade map on disk = D-PT-3 build (byte for byte)': P['map'],
               '4.5 640 renders = pixel oracle (0 wrong px) · cross-material px 0 · fixed px changed 0 · alpha changed 0 · every recolour output colour is a Palette shade': P['4.5'] and res['combos'] == 640,
               '4.6 signal hits in the OUTPUT colours outside the 5 locked exceptions = 0': P['4.6']}}
json.dump(R5, open(os.path.join(OUT, 's5.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'base': {GROUP[m]: DISK['materials'][str(m)]['base'] for m in GROUP}, 'leak': res, 'output_colours': res_sig['output_colours'], 'hits': len(res_sig['hits']),
                  'unexpected': len(res_sig['unexpected_hits']), 'exception_px': exc_px, 'fidelity': fid, 'pass': R5['pass']}, ensure_ascii=False))
sys.exit(0 if all(R5['pass'].values()) else 1)
