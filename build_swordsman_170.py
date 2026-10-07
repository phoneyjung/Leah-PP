"""Package Codex's unarmed study atlas for the GM trial; never paints new art.

Input: 5 columns (idle + four walk poses), 8 rows S,SE,E,NE,N,NW,W,SW.
Keep the source intact. Runtime uses 64px cells and the existing player's scale.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent

def build():
    source = Image.open(ROOT / 'art-swordsman-170.png').convert('RGBA')
    if source.size != (640, 1024):
        raise ValueError('Expected the approved 5 x 8 atlas of 128px cells')
    output = Image.new('RGBA', (320, 512))
    for direction in range(8):
        for frame in range(5):
            tile = source.crop((frame*128, direction*128, (frame+1)*128, (direction+1)*128))
            if not tile.getchannel('A').getbbox():
                raise ValueError(f'Empty source frame {direction}/{frame}')
            # One transform for every frame. Feet land near y=62, the game's anchor.
            scaled = tile.resize((72, 72), Image.Resampling.NEAREST)
            cell = Image.new('RGBA', (64, 64))
            cell.paste(scaled, (-4, 0))
            output.paste(cell, (frame*64, direction*64))
    target = ROOT / 'swordsman-170.webp'
    output.save(target, lossless=True, method=6)
    print(f'{target.name}: {target.stat().st_size} bytes; 320x512; 40 unarmed frames')

if __name__ == '__main__':
    build()
