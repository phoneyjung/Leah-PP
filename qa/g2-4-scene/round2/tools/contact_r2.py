"""G2.4 round-2 contact sheets (true pixels, shown 2x) with the locked kid for scale and numbered candidates."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
D, KID, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
F = ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf', 13)
kid = Image.open(KID).convert('RGBA').crop((0, 0, 96, 96))
BG = (58, 82, 80, 255)
def sheet(name, f, cs, cols, n, title, picks=None):
    a = Image.open(os.path.join(D, f)).convert('RGBA'); pad = 18
    W = 96 + 8 + n * (cs + 8); H = max(cs, 96) + pad + 4
    im = Image.new('RGBA', (W, H), BG); d = ImageDraw.Draw(im)
    base = H - 4
    im.alpha_composite(kid, (0, base - 95)); d.text((4, 2), 'เด็ก 83', font=F, fill=(255, 230, 160))
    for k in range(n):
        cy, cx = divmod(k, cols); c = a.crop((cx * cs, cy * cs, cx * cs + cs, cy * cs + cs)); bb = c.getbbox()
        x = 104 + k * (cs + 8); im.alpha_composite(c, (x, base - bb[3]))
        d.text((x + 2, 2), '%s%d' % (title, k + 1), font=F, fill=(255, 230, 160))
    im = im.resize((W * 2, H * 2), Image.NEAREST); im.save(os.path.join(OUT, name)); return im.size
print(sheet('pick-trees.png', 'f-trees-4up-raw.png', 128, 2, 4, 'ต้นไม้ '))
print(sheet('pick-lamps.png', 'g-lamps-4up-raw.png', 128, 2, 4, 'เสาไฟ '))
print(sheet('pick-caves.png', 'e-cave-4up-raw.png', 128, 2, 4, 'ปากถ้ำ '))
print(sheet('pick-gates.png', 'i-gates-16up-raw.png', 64, 4, 16, ''))
print(sheet('pick-slime8.png', 'd2-slime-rot-raw.png', 64, 3, 8, ''))
