# G4.0 replay harness, part 3: compares two replay.js output folders checkpoint by checkpoint.
#   python3 qa/g4/compare.py A B [--json out.json]
# per checkpoint: pixels that differ (any channel) · state fields that differ · draw-log (y-sort order + positions) equal or not
# exit 0 only when every checkpoint has 0 px, 0 state fields and the same draw log (plan §8.1: "ต่าง 0 px และสถานะต่าง 0")
import json, sys, os
import numpy as np
from PIL import Image

def flat(o, p=''):
    if isinstance(o, dict):
        r = {}
        for k, v in o.items(): r.update(flat(v, f'{p}.{k}' if p else k))
        return r
    if isinstance(o, list):
        r = {}
        for i, v in enumerate(o): r.update(flat(v, f'{p}[{i}]'))
        return r
    return {p: o}

def main():
    a, b = sys.argv[1], sys.argv[2]
    out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    names = sorted(f[:-5] for f in os.listdir(a) if f.startswith('cp') and f.endswith('.json'))
    rows, bad = [], 0
    for n in names:
        ja, jb = (json.load(open(os.path.join(d, n + '.json'))) for d in (a, b))
        ia = np.asarray(Image.open(os.path.join(a, n + '.png')).convert('RGBA'), dtype=np.int16)
        ib = np.asarray(Image.open(os.path.join(b, n + '.png')).convert('RGBA'), dtype=np.int16)
        px = int((np.abs(ia - ib).max(axis=2) > 0).sum()) if ia.shape == ib.shape else -1
        fa, fb = flat(ja['state']), flat(jb['state'])
        sd = sorted(k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k))
        dr = ja['draw'] == jb['draw']
        if px != 0 or sd or not dr: bad += 1
        rows.append({'cp': n, 'map': ja['map'], 'vnow': round(ja['state']['vnow']), 'px': px, 'state': sd[:12], 'stateN': len(sd),
                     'draw': dr, 'drawN': [ja['draw']['n'], jb['draw']['n']], 'phase': ja['state']['phase'], 'msg': ja['state']['msg']})
    res = {'a': a, 'b': b, 'checkpoints': len(rows), 'bad': bad, 'pxTotal': sum(max(r['px'], 0) for r in rows),
           'stateTotal': sum(r['stateN'] for r in rows), 'drawDiff': sum(not r['draw'] for r in rows), 'rows': rows}
    if out: json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
    for r in rows: print(r['cp'], r['map'], r['vnow'], 'px', r['px'], 'state', r['stateN'], r['state'][:4], 'draw', 'same' if r['draw'] else 'DIFF', r['drawN'], r['phase'])
    print(json.dumps({k: res[k] for k in ('checkpoints', 'bad', 'pxTotal', 'stateTotal', 'drawDiff')}))
    sys.exit(0 if bad == 0 and rows else 1)

main()
