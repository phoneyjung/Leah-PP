# Scale mock (QA only, not an asset): size guide lantern vs set-08 stand-in in the kid's hand, 7 dirs, zoom 100/75, light/dark (Claude 17 Oct 2569)
# QA mock only (not an asset). Run from the scratch folder that has site/ (pilot page + sheets, kid-lantern-{lit,large,old}.png) served on port 8772.
import os, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
DIRS = ['S', 'SE', 'E', 'NE', 'NW', 'W', 'SW']; rows = []
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    for label, route in (('A size guide 11x16 lit (13 px below grip) - no glow yet', 'lit'), ('B size guide 13x18 lit (15 px below grip = ceiling) - no glow yet', 'large'), ('C set-08 stand-in 13x22 (sinks 4 px, for comparison)', 'old')):
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
out.save('lantern-scale-mock.png'); print(out.size)
