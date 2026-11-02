#!/usr/bin/env python3
"""G3.3 independent reference (Claude · 2 Nov 2569). Never imports or reads char2.js.

Colour = qa_asset09_a3.render (the frozen G2 reference, loaded from its file) on the locked sheets + masks.
Breathing / anchors / composition = the rules written in the contract, the anchors JSON and G3_0_BASELINE.md, done here in numpy.
Pixels with alpha 0 get RGB 0 (what a canvas reads back), so hashes compare with getImageData bytes.

usage: python3 -I qa/g3/ref_char2.py ROOT k3a-ref OUT_DIR      reference sheets for K3a (default look, NOT breathed: the Pilot breathes itself)
       python3 -I qa/g3/ref_char2.py ROOT sheets OUT.json       SHA-256 of idle / walk / walkhold / stand8 for all 640 colour sets
       python3 -I qa/g3/ref_char2.py ROOT composed OUT.json     SHA-256 of 16 composed 160x160 images per colour set (8 dirs x idle-hold f1 + walk-hold f1)
       python3 -I qa/g3/ref_char2.py ROOT anchors OUT.json      head_top / body / box / label + head_top vs c2-pilot-anchors.json
"""
import hashlib, importlib.util, itertools, json, sys
sys.dont_write_bytecode = True   # loading qa_asset09_a3.py must not leave a __pycache__ folder in the repo root
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(sys.argv[1]); MODE = sys.argv[2]; OUT = Path(sys.argv[3])
spec = importlib.util.spec_from_file_location('qa_asset09_a3', ROOT / 'qa_asset09_a3.py'); Q = importlib.util.module_from_spec(spec); spec.loader.exec_module(Q)
P = json.loads((ROOT / 'c2-pack.json').read_text(encoding='utf-8'))
C, FEET, DIRS = P['cell'], P['feet'], P['dirs']
HOLD = json.loads((ROOT / 'c2-pilot-hold-anchors.json').read_text(encoding='utf-8'))
ANCH = json.loads((ROOT / 'c2-pilot-anchors.json').read_text(encoding='utf-8'))
OFF = P['render_offset']; L = P['lantern']; GRIP = L['grip']
rgba = lambda f: np.array(Image.open(ROOT / f).convert('RGBA'))
SH = {k: (rgba(P['sheets'][k]['src']), rgba(P['sheets'][k]['mask'])) for k in ('idle', 'walk', 'walkhold')}
LAN, LAN_L = rgba(L['src']), rgba(L['light'])
NAMES = {g: [n.lower() for n, _ in Q.RAMPS[g]] for g in ('hair', 'iris', 'skin', 'house')}
assert NAMES == {g: [n for n, _ in P['palette'][g]] for g in NAMES}, 'pack palette names != qa_asset09_a3 RAMPS'

def breathe(a):            # contract 5: rows 0..cut-1 of the W f3 cell take rows 1..cut, row cut repeats (a pure pixel move)
    b = P['sheets']['idle']['breathe']; o = a.copy(); y0 = DIRS.index(b['dir']) * C; x0 = b['frame'] * C
    o[y0:y0 + b['cut'], x0:x0 + C] = a[y0 + 1:y0 + b['cut'] + 1, x0:x0 + C]; return o
def zero_clear(a): a = a.copy(); a[a[..., 3] == 0] = 0; return a
def recolour(anim, opts, do_breathe=True):
    A, M = SH[anim]; out = Q.render(A, M[..., 0].astype(int), M[..., 1].astype(int), opts)
    return zero_clear(breathe(out) if anim == 'idle' and do_breathe else out)
def stand8(idle): return np.concatenate([idle[i * C:(i + 1) * C, 0:C] for i in range(8)], axis=1)   # idle f1 of S..SW in one row
def sha(a): return hashlib.sha256(np.ascontiguousarray(a, dtype=np.uint8).tobytes()).hexdigest()
def combos():
    for h, e, s, b in itertools.product(*(range(len(NAMES[g])) for g in ('hair', 'iris', 'skin', 'house'))):
        yield '/'.join([NAMES['hair'][h], NAMES['iris'][e], NAMES['skin'][s], NAMES['house'][b]]), {'hair': h, 'iris': e, 'skin': s, 'house': b}

def over(dst, src, x, y):   # source-over with 0/255 alpha = replace where src is opaque (clipped to dst)
    h, w = src.shape[:2]; H, W = dst.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1: return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]; m = s[..., 3] > 0; d = dst[y0:y1, x0:x1]; d[m] = s[m]
def composed(sheets, dname, anim):   # one frame f1, held lantern at its target (no easing on the first frame), lit, power 100, scale 1, feet at (80,120)
    di = DIRS.index(dname); key = 'idle_hold' if anim == 'idle' else 'walk_hold'; sheet = sheets[anim]
    canvas = np.zeros((160, 160, 4), np.uint8); sx = 80 - FEET[0] + OFF[dname]; sy = 120 - FEET[1]
    cell = sheet[di * C:(di + 1) * C, 0:C]; over(canvas, cell, sx, sy)
    f = HOLD[key][dname][0]
    if f['anchor'] is not None:
        lx, ly = f['anchor']; X, Y = sx + lx - GRIP[0], sy + ly - GRIP[1]
        over(canvas, LAN, X, Y); over(canvas, LAN_L, X, Y)
        for fx, fy in f['fist']: canvas[sy + fy, sx + fx] = cell[fy, fx]
    return zero_clear(canvas)

def geometry():   # alpha rules (head_top = G3_ANCHOR_INVENTORY 4 A2 / anchors JSON rule; box = [x0,y0,x1,y1) of all frames of an anim+dir)
    sheets = {'idle': breathe(SH['idle'][0]), 'walk': SH['walk'][0], 'walkhold': SH['walkhold'][0]}
    g = {}
    for anim, A in sheets.items():
        n = A.shape[1] // C; g[anim] = {}
        for di, d in enumerate(DIRS):
            fr = []; ys_all, xs_all = [], []
            for k in range(n):
                op = A[di * C:(di + 1) * C, k * C:(k + 1) * C, 3] > 0; ys, xs = np.nonzero(op); ys_all += list(ys); xs_all += list(xs)
                top = op.copy(); top[51:] = False; ty, tx = np.nonzero(top)
                ht = [int(np.floor((tx.min() + tx.max()) / 2 + 0.5)), int(ty.min())]
                body = [FEET[0], int(np.floor((ht[1] + FEET[1]) / 2 + 0.5))]          # Math.round = half up (T21)
                fr.append({'head_top': ht, 'body': body})
            g[anim][d] = {'frames': fr, 'box': [int(min(xs_all)), int(min(ys_all)), int(max(xs_all)) + 1, int(max(ys_all)) + 1]}
    tag = min(f['head_top'][1] for a in ('idle', 'walk') for d in DIRS for f in g[a][d]['frames'])
    return g, [FEET[0], tag - 4]

if MODE == 'k3a-ref':
    OUT.mkdir(parents=True, exist_ok=True); D = Q.DEFAULT; res = {}
    for anim in ('idle', 'walk', 'walkhold'):
        a = recolour(anim, D, do_breathe=False); name = Path(P['sheets'][anim]['src']).name
        Image.fromarray(a, 'RGBA').save(OUT / name); res[name] = hashlib.sha256((OUT / name).read_bytes()).hexdigest()
    (OUT / 'SHA256.json').write_text(json.dumps({'look': 'brown/green/medium/wing (qa_asset09_a3 DEFAULT)', 'files': res}, indent=1))
    print('k3a reference sheets', res)
elif MODE == 'sheets':
    out = {}
    for name, o in combos():
        idle = recolour('idle', o)
        out[name] = {'idle': sha(idle), 'walk': sha(recolour('walk', o)), 'walkhold': sha(recolour('walkhold', o)), 'stand8': sha(stand8(idle))}
    OUT.write_text(json.dumps(out)); print('sheets', len(out), 'colour sets x 4 =', 4 * len(out))
elif MODE == 'composed':
    out = {}
    for name, o in combos():
        sheets = {'idle': recolour('idle', o), 'walk': recolour('walkhold', o)}
        out[name] = {d + ':' + a: sha(composed(sheets, d, a)) for d in DIRS for a in ('idle', 'walk')}
    OUT.write_text(json.dumps(out)); print('composed', len(out), 'x 16 =', 16 * len(out))
elif MODE == 'anchors':
    g, label = geometry()
    same = sum(g[a][d]['frames'][k]['head_top'] == ANCH['frames'][a][d][k]['head_top'] for a in ('idle', 'walk') for d in DIRS for k in range(len(g[a][d]['frames'])))
    OUT.write_text(json.dumps({'geometry': g, 'label': label, 'head_top_equal_json': same, 'head_top_frames': 80}))
    print('anchors · head_top equal to c2-pilot-anchors.json', same, '/ 80 · label', label)
else:
    raise SystemExit('mode?')
