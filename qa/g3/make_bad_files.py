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
h = json.loads((root / 'c2-pilot-hold-anchors.json').read_text(encoding='utf-8'))
h2 = json.loads(json.dumps(h)); h2['walk_hold']['S'] = h2['walk_hold']['S'][:5]; (out / 'hold-5frames.json').write_text(json.dumps(h2))
print('wrote', sorted(p.name for p in out.iterdir()))
