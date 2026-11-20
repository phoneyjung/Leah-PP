# Reference pictures for the hat (from the locked idle sheet, frame 1, house Wing colours as drawn in the sheet):
#   hat-ref-head-S-64.png   64x64 crop of the S head (cell x 16-79, y 0-63) - the PixelLab reference at the real pixel size
#   hat-ref-heads-8x.png    the 8 directions' 64x64 crops side by side, 4x, with a grey line at the head's top row (owner / Codex view)
import sys, json
from PIL import Image, ImageDraw
DIRS = ['S','SE','E','NE','N','NW','W','SW']
root, out, box = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
sh = Image.open(root + '/c2-pilot-kid4-idleanim.png').convert('RGBA')
crops = []
for r, d in enumerate(DIRS):
    c = sh.crop((16, r*96, 80, r*96 + 64)); crops.append(c)
    if d == 'S': c.save(out + '/hat-ref-head-S-64.png')
W = 64 * 8 * 4 + 7 * 8; big = Image.new('RGBA', (W, 64 * 4 + 24), (238, 236, 244, 255)); dr = ImageDraw.Draw(big)
for i, (d, c) in enumerate(zip(DIRS, crops)):
    x0 = i * (256 + 8); big.paste(c.resize((256, 256), Image.NEAREST), (x0, 24), c.resize((256, 256), Image.NEAREST))
    t = box[d]['top']; dr.line([(x0, 24 + t * 4), (x0 + 255, 24 + t * 4)], fill=(120, 120, 140, 255), width=1)
    dr.text((x0 + 4, 4), '%s  head top y=%d  head %d px wide' % (d, t, box[d]['head_w']), fill=(40, 30, 60, 255))
big.save(out + '/hat-ref-heads-8x.png'); print('ok', big.size)
