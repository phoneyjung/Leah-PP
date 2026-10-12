"""Rebuild set 08 v12 inspection sheets from raw RGBA + recorded QA masks.

Run after kid-b1-v12-qa.json exists. No API calls, resizing of sprite pixels,
recolouring or polishing. The 4x output uses nearest-neighbour only.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent


def masked(frame, config):
    mask = Image.new('L', frame.size)
    draw = ImageDraw.Draw(mask)
    for box in config.get('rectangles_inclusive', []):
        draw.rectangle(box, fill=255)
    for points in config.get('polygons', []):
        draw.polygon(points, fill=255)
    for x, y in config.get('pixels', []):
        mask.putpixel((x, y), 255)
    out = Image.new('RGBA', frame.size)
    out.paste(frame, (0, 0), mask)
    return out


def shifted(frame, xy):
    out = Image.new('RGBA', frame.size)
    out.paste(frame, tuple(xy))
    return out


def composite(head_raw, body_raw, config):
    head = shifted(masked(head_raw, config['head_mask']),
                   config['head_translation_xy'])
    body = shifted(masked(body_raw, config['body_mask']),
                   config['body_translation_xy'])
    if config['layer_order'] == 'body_then_head':
        frame = Image.alpha_composite(body, head)
    else:
        seam = config['head_split_y']
        back, front = head.copy(), head.copy()
        back.paste((0, 0, 0, 0), (0, 0, 64, seam))
        front.paste((0, 0, 0, 0), (0, seam, 64, 64))
        frame = Image.alpha_composite(Image.alpha_composite(back, body), front)
    frame = shifted(frame, config['whole_translation_xy'])
    frame.putdata([p if p[3] else (0, 0, 0, 0)
                   for p in frame.get_flattened_data()])
    return frame


def rebuild():
    qa = json.loads((ROOT / 'kid-b1-v12-qa.json').read_text())
    cache = {}
    for sheet in qa['assembly']['sheets']:
        out = Image.new('RGBA', tuple(sheet['size']))
        for row in sheet['rows']:
            for filename in (row['head_raw_file'], row['body_raw_file']):
                if filename not in cache:
                    cache[filename] = Image.open(ROOT / filename).convert('RGBA')
                    assert cache[filename].size == (512, 64)
            for i, config in enumerate(row['frames']):
                box = (i * 64, 0, (i + 1) * 64, 64)
                frame = composite(cache[row['head_raw_file']].crop(box),
                                  cache[row['body_raw_file']].crop(box), config)
                out.paste(frame, (i * 64, row['row'] * 64))
        out.save(ROOT / sheet['file'], optimize=True)
        if sheet.get('preview_file'):
            out.resize((out.width * 4, out.height * 4), Image.Resampling.NEAREST).save(
                ROOT / sheet['preview_file'], optimize=True)
    # Missing levels remain transparent, with their explicit unavailable status
    # in kid-lantern.json. This preserves the specified four-row layout.
    if (ROOT / 'kid-lantern.json').exists():
        lantern = json.loads((ROOT / 'kid-lantern.json').read_text())
        out = Image.new('RGBA', (256, 128))
        for level in lantern['levels']:
            if not level.get('raw_file'):
                continue
            raw = Image.open(ROOT / level['raw_file']).convert('RGBA')
            assert raw.size == (256, 32)
            for i, frame in enumerate(level['frames']):
                source = raw.crop((i * 32, 0, (i + 1) * 32, 32))
                placed = shifted(source, frame['translation_xy'])
                out.paste(placed, (i * 32, level['level'] * 32))
        out.save(ROOT / 'kid-lantern.png', optimize=True)
    print('Rebuilt v12 inspection sheets; raw inputs unchanged.')


if __name__ == '__main__':
    rebuild()
