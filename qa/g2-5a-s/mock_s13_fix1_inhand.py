#!/usr/bin/env python3
# In-hand QA mock for ASSET_SPEC_13 v1.1 part S fix1 (Claude · 17 Oct 2569) - QA images only, not assets.
# SIZE PREVIEW ONLY: the S view is reused for all 7 dirs (not an 8-direction result). Light layer at 100 %, no glow FX yet.
# usage: python3 -I mock_s13_fix1_inhand.py SITE_DIR OUT_DIR   (SITE_DIR served at http://127.0.0.1:8772/ with
#        kid-lantern-s13-unlit/lit.png = before ea1dccc and kid-lantern-s13f1-unlit/lit.png = fix1 12948e2, S cell copied to every column)
# writes: lantern-s13fix1-inhand-z100.png, lantern-s13fix1-inhand-z75.png (7 dirs x before/after x unlit/lit x light/dark bg)
#         lantern-s13fix1-S-crops.png (S dir only, zoom 100/75, light/dark bg, before/after, unlit/lit; screenshot enlarged x2 nearest)
import os, io, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
SITE, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
DIRS = ['S', 'SE', 'E', 'NE', 'NW', 'W', 'SW']
VARS = (('before ea1dccc unlit', 's13-unlit'), ('fix1 12948e2 unlit', 's13f1-unlit'), ('before ea1dccc lit', 's13-lit'), ('fix1 12948e2 lit', 's13f1-lit'))
shots = {}
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    for label, route in VARS:
        fpath = os.path.join(SITE, 'kid-lantern-%s.png' % route)
        pg.route('**/kid-lantern.png', (lambda fp: (lambda r: r.fulfill(path=fp, content_type='image/png')))(fpath))
        pg.goto('http://127.0.0.1:8772/pilot-g2-motion.html?hold'); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.lantern', timeout=15000)
        for zoom in (1, 0.75):
            for dark in (False, True):
                for d in DIRS:
                    pg.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:a.d,anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:a.z,clean:false,dark:a.dark,guides:false,blinkNow:false});PT.draw()}", {'d': d, 'z': zoom, 'dark': dark})
                    h = 120 * zoom
                    shots[(route, zoom, dark, d)] = Image.open(io.BytesIO(pg.screenshot(clip={'x': 422 - 50 * zoom, 'y': 195 - h + 8, 'width': 100 * zoom, 'height': h}))).convert('RGB')
        pg.unroute('**/kid-lantern.png')
    b.close()

def sheet(rows, name):
    W = max(r.width for r in rows); H = sum(r.height for r in rows) + 4 * len(rows)
    out = Image.new('RGB', (W, H), (255, 255, 255)); y = 0
    for r in rows: out.paste(r, (0, y)); y += r.height + 4
    out.save(os.path.join(OUT, name)); print(name, out.size)

for zoom in (1, 0.75):
    rows = []
    for dark in (False, True):
        for label, route in VARS:
            ims = [shots[(route, zoom, dark, d)] for d in DIRS]
            row = Image.new('RGB', (sum(i.width for i in ims), ims[0].height + 18), (30, 27, 46)); x = 0
            for i in ims: row.paste(i, (x, 18)); x += i.width
            ImageDraw.Draw(row).text((4, 3), 'SIZE PREVIEW ONLY · %s · zoom %d%% · %s bg · dirs %s' % (label, zoom * 100, 'dark' if dark else 'light', ' '.join(DIRS)), fill=(255, 255, 255)); rows.append(row)
    sheet(rows, 'lantern-s13fix1-inhand-z%d.png' % (zoom * 100))

# S-only crops, enlarged x2 nearest so the lantern pixels are readable
cells = []
for zoom in (1, 0.75):
    for dark in (False, True):
        line = []
        for label, route in VARS:
            im = shots[(route, zoom, dark, 'S')]; im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
            c = Image.new('RGB', (im.width, im.height + 16), (30, 27, 46)); c.paste(im, (0, 16))
            ImageDraw.Draw(c).text((4, 2), '%s · %d%% · %s' % (label, zoom * 100, 'dark' if dark else 'light'), fill=(255, 255, 255)); line.append(c)
        row = Image.new('RGB', (sum(i.width + 4 for i in line), max(i.height for i in line)), (255, 255, 255)); x = 0
        for i in line: row.paste(i, (x, 0)); x += i.width + 4
        cells.append(row)
sheet(cells, 'lantern-s13fix1-S-crops.png')

# tight crop around the lantern + hand (box = where the before unlit/lit shots differ, + margin), enlarged x4 nearest
from PIL import ImageChops
cells = []
for zoom in (1, 0.75):
    bb = ImageChops.difference(shots[('s13-unlit', zoom, False, 'S')], shots[('s13-lit', zoom, False, 'S')]).getbbox()
    m = int(30 * zoom) + 10   # device px around the light-layer area (shows fist, cuff and boot)
    box = (max(bb[0] - m, 0), max(bb[1] - m, 0), bb[2] + m, bb[3] + m)
    for dark in (False, True):
        line = []
        for label, route in VARS:
            im = shots[(route, zoom, dark, 'S')].crop(box); im = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
            c = Image.new('RGB', (max(im.width, 250), im.height + 16), (30, 27, 46)); c.paste(im, (0, 16))
            ImageDraw.Draw(c).text((4, 2), '%s · %d%% · %s' % (label, zoom * 100, 'dark' if dark else 'light'), fill=(255, 255, 255)); line.append(c)
        row = Image.new('RGB', (sum(i.width + 4 for i in line), max(i.height for i in line)), (255, 255, 255)); x = 0
        for i in line: row.paste(i, (x, 0)); x += i.width + 4
        cells.append(row)
sheet(cells, 'lantern-s13fix1-S-hand-x4.png')
