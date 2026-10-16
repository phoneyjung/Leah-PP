# Scale mock (QA only, not an asset): size guide lantern vs set-08 stand-in in the kid's hand, 7 dirs, zoom 100/75, light/dark (Claude 17 Oct 2569)
# QA mock only (not an asset): round-2 lanterns placed with the ring centre at [16,6] (whole-pixel shift), lit = rough light approximation for viewing.
import os, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
DIRS = ['S', 'SE', 'E', 'NE', 'NW', 'W', 'SW']; rows = []
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    for label, route in (('#41 unlit 9x16 (14 below grip)', 'r2-41-unlit'), ('#41 lit (light approx, no glow)', 'r2-41-lit'), ('#46 lit', 'r2-46-lit'), ('#9 lit', 'r2-9-lit'), ('#48 lit', 'r2-48-lit'), ('set-08 stand-in (old, sinks 4 px)', 'old')):
        if route:
            fpath = 'site/kid-lantern-%s.png' % route
            pg.route('**/kid-lantern.png', (lambda fp: (lambda r: r.fulfill(path=fp, content_type='image/png')))(fpath))
        pg.goto('http://127.0.0.1:8772/pilot-g2-motion.html?hold'); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.lantern', timeout=15000)
        for zoom, dark in ((1, False), (0.75, True)):
            ims = []
            for d in DIRS:
                pg.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:a.d,anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:a.z,clean:false,dark:a.dark,guides:false,blinkNow:false});PT.draw()}", {'d': d, 'z': zoom, 'dark': dark})
                h = 120 * zoom
                im = Image.open(io.BytesIO(pg.screenshot(clip={'x': 422 - 50 * zoom, 'y': 195 - h + 8, 'width': 100 * zoom, 'height': h}))).convert('RGB')
                ims.append(im)
            w = sum(i.width for i in ims); row = Image.new('RGB', (w, ims[0].height + 18), (30, 27, 46)); x = 0
            for i in ims: row.paste(i, (x, 18)); x += i.width
            ImageDraw.Draw(row).text((4, 3), '%s · zoom %d%% · %s' % (label, zoom * 100, 'dark' if dark else 'light'), fill=(255, 255, 255)); rows.append(row)
        pg.unroute('**/kid-lantern.png')
    b.close()
W = max(r.width for r in rows); H = sum(r.height for r in rows) + 4 * len(rows)
out = Image.new('RGB', (W, H), (255, 255, 255)); y = 0
for r in rows: out.paste(r, (0, y)); y += r.height + 4
out.save('lantern-r2-inhand-mock.png'); print(out.size)
