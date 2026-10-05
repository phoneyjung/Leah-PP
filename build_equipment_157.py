#!/usr/bin/env python3
"""Extract isolated shapes from original paintings and pack alpha WebP atlases.
Usage: python3 build_equipment_157.py [source_folder] [output_folder]
Requires Pillow. Original art PNGs are preserved; no painted pixels are retouched.
"""
import json
import sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
GEAR = ['neck', 'ring_blue', 'ring_green', 'boots', 'pants', 'skirt',
        'gloves', 'glasses', 'shield', 'sword1', 'sword2', 'bow1',
        'bow2', 'staff1', 'staff2', 'dagger1', 'dagger2', 'axe1',
        'axe2', 'hammer1', 'hammer2', 'armor', 'armor_fine', 'charm']
OUTFIT = ['shirt_a', 'shirt_b', 'bottom_a', 'bottom_b', 'boots_a', 'boots_b',
          'mouth_leaf', 'mouth_rose', 'mouth_candy', 'mouth_feather', 'gloves_b', 'glasses_b']

def build(source, output, names, rows):
    width, height = 768, rows*128
    painting = Image.open(source).convert('RGBA').resize((width, height), Image.Resampling.LANCZOS)
    alpha = painting.getchannel('A')
    if alpha.getextrema()[0] > 8:
        raise ValueError('Artwork needs a transparent outside')
    pixels = alpha.load()
    seen = set()
    groups = [[] for _ in names]
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < 32 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            component = []
            while queue:
                xx, yy = queue.popleft()
                component.append((xx, yy))
                for nx, ny in [(xx-1, yy), (xx+1, yy), (xx, yy-1), (xx, yy+1)]:
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen and pixels[nx, ny] >= 32:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) < 3:
                continue
            cx = sum(x for x, _ in component)/len(component)
            cy = sum(y for _, y in component)/len(component)
            index = min(len(names)-1, int(cy//128)*6 + min(5, int(cx//128)))
            groups[index].extend(component)
    atlas = Image.new('RGBA', (width, height))
    tiles = {}
    for i, name in enumerate(names):
        points = groups[i]
        if len(points) < 200:
            raise ValueError(f'{name}: missing/incorrectly assigned art; inspect source grid')
        mask = Image.new('L', painting.size)
        mp = mask.load()
        for x, y in points:
            mp[x, y] = 255
        # Keep antialias edges, exclude neighboring shapes that overlap a bounding rectangle.
        mask = mask.filter(ImageFilter.MaxFilter(7))
        isolated = painting.copy()
        isolated.putalpha(ImageChops.multiply(alpha, mask))
        bounds = isolated.getchannel('A').getbbox()
        tile = isolated.crop(bounds)
        scale = min(116/tile.width, 116/tile.height)
        tile = tile.resize((max(1, round(tile.width*scale)), max(1, round(tile.height*scale))), Image.Resampling.LANCZOS)
        x, y = (i % 6)*128, (i//6)*128
        atlas.alpha_composite(tile, (x+(128-tile.width)//2, y+(128-tile.height)//2))
        tiles[name] = {'rect': [x, y, 128, 128], 'sourcePixels': len(points)}
    atlas.save(output, 'WEBP', quality=90, method=6, exact=True)
    return {'file': output.name, 'width': width, 'height': height, 'tiles': tiles}

def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else source
    target.mkdir(parents=True, exist_ok=True)
    data = {'schema': 1,
            'gear': build(source/'art-equipment-157.png', target/'equipment-157.webp', GEAR, 4),
            'outfit': build(source/'art-outfit-157.png', target/'outfit-157.webp', OUTFIT, 2)}
    (target/'equipment-157.json').write_text(json.dumps(data, indent=2)+'\n')
    print(json.dumps({'images': len(GEAR)+len(OUTFIT), 'runtimeBytes': sum((target/f).stat().st_size for f in ['equipment-157.webp','outfit-157.webp','equipment-157.json'])}))
if __name__ == '__main__':
    main()
