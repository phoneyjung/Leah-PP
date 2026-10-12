"""Rebuild set 08 lantern sheet and 6x review from raw + recorded translations.
No API calls. Missing levels stay transparent; inspect manifest status before use.
"""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parent

def build():
    meta=json.loads((ROOT/'kid-lantern.json').read_text())
    out=Image.new('RGBA',tuple(meta['sheet_size']))
    for level in meta['levels']:
        if not level.get('raw_file'):
            continue
        raw=Image.open(ROOT/level['raw_file']).convert('RGBA')
        for i,frame in enumerate(level['frames']):
            source=raw.crop((32*i,0,32*i+32,32))
            cell=Image.new('RGBA',(32,32))
            cell.paste(source,tuple(frame['translation_xy']))
            assert sum(p[3]>0 for p in cell.get_flattened_data())==sum(p[3]>0 for p in source.get_flattened_data())
            out.paste(cell,(32*i,32*level['level']))
    out.save(ROOT/'kid-lantern.png',optimize=True)
    out.resize((1536,768),Image.Resampling.NEAREST).save(ROOT/'kid-lantern-6x.png',optimize=True)

if __name__=='__main__':
    build()
