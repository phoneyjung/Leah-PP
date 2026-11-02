#!/usr/bin/env python3
"""G3.2 K2 fixtures (Claude): damaged COPIES of locked files, written to OUT_DIR only (never to the repo, never committed).
The test serves them with page.route in place of the real file; the locked files are only read.

usage: python3 -I qa/g3/make_bad_files.py REPO_ROOT OUT_DIR
"""
import json, sys
from pathlib import Path
from PIL import Image

root, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)

def first_opaque(img, rec_id=None):
    w, h = img.size; px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and (rec_id is None or r == rec_id): return x, y
    raise SystemExit('no pixel')

m = Image.open(root / 'c2-pilot-kid4-walk-mask.png').convert('RGBA')
x, y = first_opaque(m, 4)                       # a hair pixel (recolour id 4, ramp of 5 shades)
bad = m.copy(); r, g, b, a = bad.getpixel((x, y)); bad.putpixel((x, y), (r, 9, b, a)); bad.save(out / 'walk-mask-G9.png')
bad = m.copy(); r, g, b, a = bad.getpixel((x, y)); bad.putpixel((x, y), (0, g, b, a)); bad.save(out / 'walk-mask-id0.png')
Image.new('RGBA', (575, 768), (0, 0, 0, 0)).save(out / 'walk-575.png')    # one px too narrow
Image.new('RGBA', (32, 31), (0, 0, 0, 0)).save(out / 'lantern-32x31.png')
pack = json.loads((root / 'c2-pack.json').read_text(encoding='utf-8'))
p2 = json.loads(json.dumps(pack)); p2['cell'] = 64; (out / 'pack-cell64.json').write_text(json.dumps(p2))
p3 = json.loads(json.dumps(pack)); p3['palette']['hair'][0][1][0] = 'red'; (out / 'pack-badhex.json').write_text(json.dumps(p3))
p4 = json.loads(json.dumps(pack)); p4['bases']['kid4']['parts']['hair'] = ['kid4', 'kid4b']; p4['deprecated'] = ['kid4b']; (out / 'pack-deprecated.json').write_text(json.dumps(p4))
def pack_edit(name, fn):   # T22 R3: one wrong field per file
    q = json.loads(json.dumps(pack)); fn(q); (out / name).write_text(json.dumps(q))
pack_edit('pack-walkms0.json', lambda q: q['timing'].__setitem__('walk_ms', 0))
pack_edit('pack-idleloop99.json', lambda q: q['timing'].__setitem__('idle_loop', [99]))
pack_edit('pack-budgetneg.json', lambda q: q['budget'].__setitem__('bytes', -1))
pack_edit('pack-recolour-empty.json', lambda q: q['materials'].__setitem__('recolour', {}))
pack_edit('pack-nohold.json', lambda q: q.pop('hold'))
pack_edit('pack-protoname.json', lambda q: q['palette']['hair'][0].__setitem__(0, '__proto__'))
pack_edit('pack-name-array.json', lambda q: q['palette']['hair'][0].__setitem__(0, ['black']))   # T23 N1: a regex would turn these into text
pack_edit('pack-name-null.json', lambda q: q['palette']['hair'][0].__setitem__(0, None))
pack_edit('pack-hex-array.json', lambda q: q['palette']['hair'][0][1].__setitem__(0, ['#18141C']))
h = json.loads((root / 'c2-pilot-hold-anchors.json').read_text(encoding='utf-8'))
def hold_edit(name, fn):  # T22 R4: one wrong hand entry per file
    q = json.loads(json.dumps(h)); fn(q); (out / name).write_text(json.dumps(q))
hold_edit('hold-S-anchor-null.json', lambda q: q['idle_hold']['S'][0].__setitem__('anchor', None))
hold_edit('hold-SE-fist-empty.json', lambda q: q['walk_hold']['SE'][0].__setitem__('fist', []))
def fist_clear(q):   # move one fist px that is NOT the anchor to [0,0] (a clear px of the cell)
    f = q['walk_hold']['S'][0]; i = next(i for i, v in enumerate(f['fist']) if v != f['anchor']); f['fist'][i] = [0, 0]
hold_edit('hold-fist-on-clear.json', fist_clear)
hold_edit('hold-N-has-hand.json', lambda q: q['idle_hold']['N'][0].update({'hand': 'R', 'anchor': [48, 70], 'fist': [[48, 70]]}))
hold_edit('hold-hand-flips.json', lambda q: q['walk_hold']['E'][1].__setitem__('hand', 'L'))
sm = json.loads((root / 'c2-pilot-kid4-pt-shademap.json').read_text(encoding='utf-8'))
q = json.loads(json.dumps(sm)); q['materials']['4']['shade_index_by_G'] = [99] * len(q['materials']['4']['shade_index_by_G']); (out / 'shademap-99.json').write_text(json.dumps(q))
q = json.loads(json.dumps(sm)); q['materials']['5']['shade_index_by_G'] = q['materials']['5']['shade_index_by_G'][:-1]; (out / 'shademap-short.json').write_text(json.dumps(q))
h2 = json.loads(json.dumps(h)); h2['walk_hold']['S'] = h2['walk_hold']['S'][:5]; (out / 'hold-5frames.json').write_text(json.dumps(h2))
print('wrote', sorted(p.name for p in out.iterdir()))
