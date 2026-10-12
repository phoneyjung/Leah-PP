"""Rebuild the v11 diagnostic contact sheet from immutable raw sheets + QA masks.

No API access, repainting, recolouring or rescaling of source sprite pixels.
Only head/carrier separation, integer placement, and a nearest-neighbour preview.
The QA file records every mask/offset; these are inspection composites, not final
paperdoll layers. Run: python build_asset08_b1.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent

def rebuild():
    qa = json.loads((ROOT / 'kid-b1-qa.json').read_text())
    assembly = qa['assembly']
    outfit = Image.open(ROOT / 'kid-b1-of1v2-raw.png').convert('RGBA')
    assert outfit.size == (512, 64)
    output = Image.new('RGBA', (512, 1024))
    for row in assembly['rows']:
        source = Image.open(ROOT / row['raw_file']).convert('RGBA')
        assert source.size == (512, 64)
        for i, item in enumerate(row['frames']):
            box = (i * 64, 0, (i + 1) * 64, 64)
            hf, of = source.crop(box), outfit.crop(box)
            mask = Image.new('L', (64, 64))
            draw = ImageDraw.Draw(mask)
            for rect in item['head_mask']['rectangles_inclusive']:
                draw.rectangle(rect, fill=255)
            for polygon in item['head_mask']['polygons']:
                draw.polygon(polygon, fill=255)
            head = Image.new('RGBA', (64, 64))
            head.paste(hf, (0, 0), mask)
            dy = item['head_translation_xy'][1]
            shifted = Image.new('RGBA', (64, 64))
            shifted.paste(head, (0, dy))
            head = shifted
            bm = Image.new('L', (64, 64))
            bd = ImageDraw.Draw(bm)
            bd.rectangle((0, 28, 63, 63), fill=255)
            for y, interval in enumerate(assembly['body_top_row_intervals'][i], 23):
                bd.line((interval[0], y, interval[1], y), fill=255)
            body = Image.new('RGBA', (64, 64))
            body.paste(of, (0, 0), bm)
            shifted = Image.new('RGBA', (64, 64))
            shifted.paste(body, (0, item['body_translation_xy'][1]))
            body = shifted
            if i in (3, 4, 5):
                frame = Image.alpha_composite(body, head)
            else:
                seam = item['head_cut_y'] + dy + 1
                back, front = head.copy(), head.copy()
                back.paste((0, 0, 0, 0), (0, 0, 64, seam))
                front.paste((0, 0, 0, 0), (0, seam, 64, 64))
                frame = Image.alpha_composite(Image.alpha_composite(back, body), front)
            dx = item['body_translation_xy'][0]
            if dx:
                shifted = Image.new('RGBA', (64, 64))
                shifted.paste(frame, (dx, 0))
                frame = shifted
            # Canonical invisible RGB avoids previewer artefacts; visible RGBA
            # stays unchanged. Raw input files are never written.
            frame.putdata([px if px[3] else (0, 0, 0, 0)
                           for px in frame.get_flattened_data()])
            output.paste(frame, (i * 64, row['row'] * 64))
    output.save(ROOT / 'kid-b1-combos.png', optimize=True)
    output.resize((2048, 4096), Image.Resampling.NEAREST).save(
        ROOT / 'kid-b1-combos-4x.png', optimize=True)
    print(f'Built {len(assembly["rows"]) * 8} inspection frames; source raw sheets untouched.')

if __name__ == '__main__':
    rebuild()
