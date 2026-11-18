# G4.0 replay harness, part 3 (v2 after Codex T34): compares two replay.js output folders.
#   python3 qa/g4/compare.py A B [--json out.json]
# Before any picture is compared, both folders must be trustworthy (meta checks — any failure makes the result bad):
#   run.json present on both sides · complete (checkpoints == expected from the scenario) · the same checkpoint names on both sides ·
#   the same scenario hash / zoom / epoch / seed / save / intro / Chromium args / Chromium version · page errors 0 · virtual-clock errors 0
#   (the run and every checkpoint) · `inject` is the only run field allowed to differ.
# Then per checkpoint: screenshot pixels that differ · game-canvas pixels that differ (the canvas as drawn, before the HUD covers it) ·
# state fields that differ · draw log (y-sort order + positions + transform) equal or not.
# exit 0 only when the meta checks pass and every checkpoint has 0 px (screen and canvas), 0 state fields and the same draw log.
import json, sys, os
import numpy as np
from PIL import Image

SAME = ('scenHash', 'zoom', 'epoch', 'seed', 'save', 'intro', 'args', 'chromium', 'expected')

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

def pxdiff(fa, fb):
    if not (os.path.exists(fa) and os.path.exists(fb)): return -2
    ia = np.asarray(Image.open(fa).convert('RGBA'), dtype=np.int16)
    ib = np.asarray(Image.open(fb).convert('RGBA'), dtype=np.int16)
    return int((np.abs(ia - ib).max(axis=2) > 0).sum()) if ia.shape == ib.shape else -1

def main():
    a, b = sys.argv[1], sys.argv[2]
    out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    meta = []
    runs = {}
    for side, d in (('A', a), ('B', b)):
        p = os.path.join(d, 'run.json')
        if not os.path.exists(p): meta.append(f'{side}: no run.json (the run did not finish)'); continue
        r = runs[side] = json.load(open(p))
        if not r.get('complete') or r.get('checkpoints') != r.get('expected'): meta.append(f"{side}: incomplete {r.get('checkpoints')}/{r.get('expected')}")
        if r.get('pageErrors'): meta.append(f"{side}: page errors {len(r['pageErrors'])}")
        if (r.get('vcErrors') or {}).get('n'): meta.append(f"{side}: virtual-clock errors {r['vcErrors']['n']}")
    if len(runs) == 2:
        for k in SAME:
            if runs['A'].get(k) != runs['B'].get(k): meta.append(f'run field differs: {k}')
    na = sorted(f[:-5] for f in os.listdir(a) if f.startswith('cp') and f.endswith('.json'))
    nb = sorted(f[:-5] for f in os.listdir(b) if f.startswith('cp') and f.endswith('.json'))
    if na != nb: meta.append(f'checkpoint names differ: A {len(na)} B {len(nb)}')
    for side, names in (('A', na), ('B', nb)):
        if side in runs and len(names) != runs[side].get('expected'): meta.append(f"{side}: {len(names)} checkpoint files, expected {runs[side].get('expected')}")
    rows, bad = [], 0
    for n in sorted(set(na) & set(nb)):
        ja, jb = (json.load(open(os.path.join(d, n + '.json'))) for d in (a, b))
        for side, j in (('A', ja), ('B', jb)):
            if (j['state'].get('vcErrors') or {}).get('n'): meta.append(f"{side} {n}: virtual-clock errors {j['state']['vcErrors']['n']}")
        px = pxdiff(os.path.join(a, n + '.png'), os.path.join(b, n + '.png'))
        cpx = pxdiff(os.path.join(a, n + '.canvas.png'), os.path.join(b, n + '.canvas.png'))
        fa, fb = flat(ja['state']), flat(jb['state'])
        sd = sorted(k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k))
        dr = ja['draw'] == jb['draw']
        if px != 0 or cpx != 0 or sd or not dr: bad += 1
        rows.append({'cp': n, 'case': ja.get('case'), 'map': ja['map'], 'vnow': round(ja['state']['vnow']), 'px': px, 'canvasPx': cpx, 'state': sd[:12], 'stateN': len(sd),
                     'draw': dr, 'drawN': [ja['draw']['n'], jb['draw']['n']], 'phase': ja['state']['phase'], 'msg': ja['state']['msg']})
    res = {'a': a, 'b': b, 'meta': meta, 'metaOk': not meta, 'checkpoints': len(rows), 'bad': bad,
           'pxTotal': sum(max(r['px'], 0) for r in rows), 'canvasPxTotal': sum(max(r['canvasPx'], 0) for r in rows),
           'stateTotal': sum(r['stateN'] for r in rows), 'drawDiff': sum(not r['draw'] for r in rows), 'rows': rows}
    if out: json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
    for r in rows:
        if r['px'] or r['canvasPx'] or r['stateN'] or not r['draw']:
            print(r['cp'], r['case'], r['map'], r['vnow'], 'px', r['px'], 'canvas', r['canvasPx'], 'state', r['stateN'], r['state'][:4], 'draw', 'same' if r['draw'] else 'DIFF', r['drawN'])
    for m in meta: print('META', m)
    print(json.dumps({k: res[k] for k in ('metaOk', 'checkpoints', 'bad', 'pxTotal', 'canvasPxTotal', 'stateTotal', 'drawDiff')}))
    sys.exit(0 if not meta and bad == 0 and rows else 1)

main()
