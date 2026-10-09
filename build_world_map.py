#!/usr/bin/env python3
"""Builds the two files the in-game map page (version 1.86, `openWorldMap186`) reads:
  world-map.json  compact block data cut from world-atlas.json (land blocks only: col, row, name, kind, biome, realm, chapter, dungeon)
  world-map.jpg   the world painting art-world-map.png as a JPEG (same 1536x1024 pixels, nothing cropped or recoloured; only the file format changes)
Run from the repo root:  python3 build_world_map.py        (the game must keep working when either file is missing: the page then shows a plain list)
"""
import json, os, sys
root = os.path.dirname(os.path.abspath(__file__))
atlas = json.load(open(os.path.join(root, 'world-atlas.json'), encoding='utf-8'))
BIOME_TH = {'meadow': 'ทุ่งหญ้า', 'forest': 'ป่า', 'mushroom': 'ป่าเห็ด', 'water': 'ริมน้ำ', 'desert': 'ทะเลทราย', 'snow': 'ทุ่งหิมะ', 'thorn': 'ป่าหนาม',
            'plateau': 'ที่ราบสูง', 'mountain': 'ภูเขา', 'volcano': 'ภูเขาไฟ', 'mirror': 'แดนกระจก', 'mystery': 'หมอกปริศนา', 'dark': 'แดนมืด', 'sea': 'ทะเล'}
BIOME_EN = {'meadow': 'Meadow', 'forest': 'Forest', 'mushroom': 'Mushroom woods', 'water': 'Waterside', 'desert': 'Desert', 'snow': 'Snowfield', 'thorn': 'Thorn woods',
            'plateau': 'Plateau', 'mountain': 'Mountains', 'volcano': 'Volcano', 'mirror': 'Mirror land', 'mystery': 'Mystery mist', 'dark': 'Dark land', 'sea': 'Sea'}
out = {'grid': atlas['grid'], 'img': 'world-map.jpg', 'blocks': {}, 'biomeTh': BIOME_TH, 'biomeEn': BIOME_EN}
for bid, b in atlas['blocks'].items():
    if b.get('realm') == 'sea' and not b.get('name'):
        continue
    e = {'c': b['col'], 'r': b['row'], 'b': b.get('biome', ''), 'rl': b.get('realm', '')}
    name = b.get('name') or b.get('purpose')
    if name: e['n'] = name
    if b.get('kind'): e['k'] = b['kind']
    if b.get('chapter'): e['ch'] = b['chapter']
    if b.get('dungeon'):
        d = b['dungeon']; e['d'] = [d.get('name', ''), d.get('floors', 0)]
    if b.get('status'): e['st'] = b['status']
    if b.get('exits'): e['x'] = b['exits']
    out['blocks'][bid] = e
p = os.path.join(root, 'world-map.json')
json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('world-map.json', os.path.getsize(p), 'bytes,', len(out['blocks']), 'blocks')
try:
    from PIL import Image
    im = Image.open(os.path.join(root, 'art-world-map.png')).convert('RGB')
    assert im.size == (1536, 1024), im.size
    q = os.path.join(root, 'world-map.jpg')
    im.save(q, quality=72, optimize=True, progressive=True)
    print('world-map.jpg', os.path.getsize(q), 'bytes', im.size)
except Exception as ex:
    print('world-map.jpg not written:', ex, file=sys.stderr)
