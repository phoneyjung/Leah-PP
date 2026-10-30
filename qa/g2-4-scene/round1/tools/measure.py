"""G2.4 round-1 measurements: size, bbox, alpha values, colours, ΔE00 to signal + house colours (pixels < 10)."""
import sys, json, glob, os
import numpy as np
from PIL import Image
from skimage.color import rgb2lab, deltaE_ciede2000
SIG = {'gold #FFC857': (255, 200, 87), 'cyan #5FE0FF': (95, 224, 255), 'cyan #7FE0FF': (127, 224, 255)}
HOUSE = {'sun #F2C230': (242, 194, 48), 'wing #4B8FE0': (75, 143, 224), 'leaf #4FBF5A': (79, 191, 90), 'flame #E0493C': (224, 73, 60)}
def lab(c): return rgb2lab(np.array([[c]], dtype=float) / 255)[0, 0]
out = {}
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.png'))):
    n = os.path.basename(f)
    if n.startswith(('scale-board', 'd1-all16', 'c-hut-vs')): continue
    im = Image.open(f).convert('RGBA'); a = np.array(im); al = a[..., 3]
    op = a[al > 0][:, :3]; cols, cnt = np.unique(op, axis=0, return_counts=True)
    L = rgb2lab(cols[None].astype(float) / 255)[0]
    rec = {'size': list(im.size), 'bbox': list(im.getbbox() or []), 'alpha_values': sorted(set(int(v) for v in np.unique(al))), 'colours': int(len(cols))}
    if rec['bbox']: rec['h'] = rec['bbox'][3] - rec['bbox'][1]; rec['w'] = rec['bbox'][2] - rec['bbox'][0]
    for grp, D in (('signal', SIG), ('house', HOUSE)):
        rec[grp] = {}
        for k, c in D.items():
            de = deltaE_ciede2000(L, np.tile(lab(c), (len(L), 1)))
            rec[grp][k] = {'min_de00': round(float(de.min()), 1), 'px_below_10': int(cnt[de < 10].sum())}
    out[n] = rec
print(json.dumps(out, indent=1, ensure_ascii=False))
