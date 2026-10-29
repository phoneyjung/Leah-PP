#!/usr/bin/env python3
# Screenshots of the real page (not the simulation): phone 844x390 and iPad 1180x820, cave, facing N, power 100 / 50, k 0 (old) vs k 1 (A) + NE reference
# usage: python3 -I shots.py PORT OUT_DIR
import sys, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') else ImageFont.load_default()
ERR = []
with sync_playwright() as p:
    br = p.chromium.launch()
    for name, vw, vh, dpr in (('phone-844x390', 844, 390, 2.625), ('ipad-1180x820', 1180, 820, 2)):
        ctx = br.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr); pg = ctx.new_page(); pg.on('pageerror', lambda e: ERR.append(str(e)))
        pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html?gm&scene=cave' % PORT); pg.wait_for_function('window.PT&&PT.ST.ok.lantern&&PT.ST.img.lanternLight&&PT.FX.dark', timeout=20000)
        tiles = []
        for lab, d, pw, k in (('N k0 (old) p100', 'N', 100, 0), ('N k1 (A) p100', 'N', 100, 1), ('N k1 (A) p50', 'N', 50, 1), ('NE p100 (ref)', 'NE', 100, 1)):
            pg.evaluate("(a)=>{PT.NHOLE.k=a.k;PT.pause(true);PT.set({dir:a.d,anim:'idle',fi:0,hold:true,fx:true,power:a.pw,scene:'cave',lpos:null,ldir:null,clean:false});PT.draw()}", {'d': d, 'pw': pw, 'k': k})
            f = os.path.join(OUT, '%s-%s.png' % (name, lab.split(' ')[0] + '-' + lab.split(' ')[1] + '-' + lab.split(' ')[-1]))
            pg.screenshot(path=f); tiles.append((lab, f))
        ctx.close()
        ims = [Image.open(f).convert('RGB') for _, f in tiles]; w, h = ims[0].size; sc = 0.5
        sheet = Image.new('RGB', (int(w * sc) * 2 + 30, (int(h * sc) + 40) * 2 + 10), (255, 255, 255)); d_ = ImageDraw.Draw(sheet)
        for i, ((lab, _), im) in enumerate(zip(tiles, ims)):
            x, y = (i % 2) * (int(w * sc) + 10) + 10, (i // 2) * (int(h * sc) + 40) + 5
            d_.text((x, y), lab, fill=(0, 0, 0), font=F); sheet.paste(im.resize((int(w * sc), int(h * sc)), Image.LANCZOS), (x, y + 30))
        sheet.save(os.path.join(OUT, 'sheet-%s.jpg' % name), quality=90)
    br.close()
print('pageerrors', len(ERR), ERR[:3])
