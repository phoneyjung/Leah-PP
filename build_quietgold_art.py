#!/usr/bin/env python3
"""Build the Quiet Gold UI atlases from the original art PNGs; no manual retouching.

Usage: python3 build_quietgold_art.py [source_directory] [output_directory]
Requires Pillow. Runtime images are WebP with alpha; source paintings stay untouched.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ICONS = [
    'bag', 'map', 'smile', 'stats', 'book', 'settings',
    'sword', 'star', 'potion', 'bench', 'boot', 'sofa',
    'speaker', 'mute', 'music', 'joystick', 'coin', 'close',
    'armor', 'acc', 'card', 'stamp', 'store', 'sort',
]
FRAMES = ['panel', 'button', 'active', 'circle']
# Search windows measured from the original paintings at the runtime atlas size.
# The painter's rows are uneven; equal grid cells would clip books and sword tips.
ICON_WINDOWS = [
    [10, 20, 133, 147], [133, 20, 265, 147], [265, 20, 380, 147],
    [380, 20, 500, 147], [500, 20, 640, 147], [640, 20, 768, 147],
    [10, 147, 135, 270], [135, 147, 260, 270], [260, 147, 377, 270],
    [377, 147, 505, 270], [505, 147, 625, 270], [625, 147, 768, 270],
    [10, 270, 135, 375], [135, 270, 265, 375], [265, 270, 390, 375],
    [390, 270, 500, 375], [500, 270, 635, 375], [635, 270, 768, 375],
    [10, 375, 145, 512], [145, 375, 265, 512], [265, 375, 380, 512],
    [380, 375, 500, 512], [500, 375, 635, 512], [635, 375, 768, 512],
]
FRAME_WINDOWS = [[0, 0, 430, 270], [430, 0, 768, 247],
                 [0, 270, 470, 512], [470, 247, 768, 512]]


def build(source, output, names, windows):
    painting = Image.open(source).convert('RGBA')
    alpha = painting.getchannel('A')
    if alpha.getextrema()[0] > 8:
        raise ValueError(f'{source.name}: outside the artwork must be transparent')
    painting = painting.resize((768, 512), Image.Resampling.LANCZOS)
    tiles = {}
    for i, name in enumerate(names):
        left, top, right, bottom = windows[i]
        cell = painting.crop((left, top, right, bottom))
        mask = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0)
        bounds = mask.getbbox()
        if not bounds:
            raise ValueError(f'{source.name}: {name} is empty')
        x0, y0, x1, y1 = bounds
        if min(x0, y0, cell.width - x1, cell.height - y1) < 2:
            raise ValueError(f'{source.name}: {name} touches its cell boundary; inspect the source grid')
        pad = 3
        x0, y0, x1, y1 = max(0, x0-pad), max(0, y0-pad), min(cell.width, x1+pad), min(cell.height, y1+pad)
        pixels = sum(cell.getchannel('A').histogram()[25:])
        tiles[name] = {'rect': [left+x0, top+y0, x1-x0, y1-y0], 'pixels': pixels}
    painting.save(output, 'WEBP', quality=88, method=6, exact=True)
    return {'file': output.name, 'width': 768, 'height': 512, 'tiles': tiles}


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else source
    target.mkdir(parents=True, exist_ok=True)
    data = {
        'schema': 1,
        'icons': build(source/'art-ui-quietgold-icons.png', target/'ui-quietgold-icons.webp', ICONS, ICON_WINDOWS),
        'frames': build(source/'art-ui-quietgold-frames.png', target/'ui-quietgold-frames.webp', FRAMES, FRAME_WINDOWS),
    }
    (target/'ui-quietgold-art.json').write_text(json.dumps(data, indent=2)+'\n')
    print(json.dumps({'icons': len(ICONS), 'frames': len(FRAMES),
                      'runtimeBytes': sum((target/f).stat().st_size for f in
                                          ['ui-quietgold-icons.webp', 'ui-quietgold-frames.webp', 'ui-quietgold-art.json'])}))


if __name__ == '__main__':
    main()
