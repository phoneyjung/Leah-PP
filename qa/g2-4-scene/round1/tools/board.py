"""G2.4 round-1 scale board: Wang tiles A (dirt/grass) + B (grass/cliff) + locked kid + 3 slime picks, true size, shown 3x."""
import sys, json
from PIL import Image, ImageDraw
R = sys.argv[1]; KID = sys.argv[2]; OUT = sys.argv[3]
A = Image.open(f'{R}/a-tileset-grass-dirt.png').convert('RGBA'); B = Image.open(f'{R}/b-tileset-grass-cliff.png').convert('RGBA')
def cls(c):
    r, g, b, a = c
    if g > r + 20: return 'G'
    if r > g + 15 and r > b: return 'D'
    return 'S'
def corners(im, tx, ty):
    p = im.load(); x0, y0 = tx*32, ty*32
    boxes = [(0, 0), (26, 0), (0, 26), (26, 26)]   # 6x6 boxes at NW NE SW SE
    out = []
    for (bx, by) in boxes:
        votes = {}
        for dx in range(6):
            for dy in range(6):
                k = cls(p[x0+bx+dx, y0+by+dy]); votes[k] = votes.get(k, 0) + 1
        out.append(max(votes, key=votes.get))
    return ''.join(out)
lut = {}
for name, im in (('A', A), ('B', B)):
    for ty in range(4):
        for tx in range(4):
            key = corners(im, tx, ty); lut.setdefault(key, (name, tx, ty))
# vertex map 15 x 9 -> 14 x 8 tiles (448 x 256)
W, H = 14, 8
V = [['G']*(W+1) for _ in range(H+1)]
for y in range(0, H+1):
    for x in (7, 8): V[y][x] = 'D'          # path down from the cave
for x in range(8, 13): V[6][x] = 'D'; V[7][x] = 'D'   # path bends right toward the hut
board = Image.new('RGBA', (W*32, H*32), (20, 20, 30, 255)); missing = []
for ty in range(H):
    for tx in range(W):
        key = V[ty][tx] + V[ty][tx+1] + V[ty+1][tx] + V[ty+1][tx+1]
        if key not in lut: missing.append((tx, ty, key)); continue
        n, sx, sy = lut[key]; src = A if n == 'A' else B
        board.alpha_composite(src.crop((sx*32, sy*32, sx*32+32, sy*32+32)), (tx*32, ty*32))
kid = Image.open(KID).convert('RGBA').crop((0, 0, 96, 96))          # feet at [48,94]
picks = [('d1-slime-a-dusty.png', 4*32+16), ('d1-slime-b-dustcrown.png', 10*32), ('d1-slime-c-tall.png', 12*32+8)]
kx, ky = 7*32+16, 7*32+20                                            # kid feet position on the path
board.alpha_composite(kid, (kx-48, ky-94))
meta = {'lut_keys': sorted(lut.keys()), 'missing': missing, 'kid_feet': [kx, ky], 'slimes': []}
for f, fx in picks:
    s = Image.open(f'{R}/{f}').convert('RGBA'); bb = s.getbbox(); fy = ky
    board.alpha_composite(s, (fx - 32, fy - bb[3]))
    meta['slimes'].append({'file': f, 'bbox': bb, 'h': bb[3]-bb[1], 'w': bb[2]-bb[0], 'ratio_to_kid_83': round((bb[3]-bb[1])/83, 2)})
# right side: tileset B raw (4x4 Wang) and tileset A raw, true size, for the owner
sheet = Image.new('RGBA', (board.width + 8 + 128, max(board.height, 264)), (20, 20, 30, 255))
sheet.alpha_composite(board, (0, 0)); sheet.alpha_composite(B, (board.width + 8, 0)); sheet.alpha_composite(A, (board.width + 8, 136))
board = sheet
big = board.resize((board.width*3, board.height*3), Image.NEAREST)
big.save(OUT); print(json.dumps(meta, indent=1))
