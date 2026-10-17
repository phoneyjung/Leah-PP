# Focus sheet (scratch QA only): fix1 / B / B2 at 75% and 100%, dark (and light for lit), unlit/lit, S hand crop x4. Not an asset.
import os, io, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageChops
SITE, OUT = sys.argv[1], sys.argv[2]
V = [('fix1', 's13f1'), ('B', 'fvB'), ('B2', 'fvB2')]
COND = [(0.75, True, 'unlit'), (0.75, True, 'lit'), (1, True, 'unlit'), (1, True, 'lit'), (0.75, False, 'lit'), (1, False, 'lit')]
shots = {}
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    for name, key in V:
        for st in ('unlit', 'lit'):
            fp = os.path.join(SITE, 'kid-lantern-%s-%s.png' % (key, st))
            pg.route('**/kid-lantern.png', (lambda f: (lambda r: r.fulfill(path=f, content_type='image/png')))(fp))
            pg.goto('http://127.0.0.1:8772/pilot-g2-motion.html?hold'); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.lantern', timeout=15000)
            for zoom in (1, 0.75):
                for dark in (False, True):
                    pg.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:'S',anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:a.z,clean:false,dark:a.dark,guides:false,blinkNow:false});PT.draw()}", {'z': zoom, 'dark': dark})
                    h = 120 * zoom
                    shots[(key, st, zoom, dark)] = Image.open(io.BytesIO(pg.screenshot(clip={'x': 422 - 50 * zoom, 'y': 195 - h + 8, 'width': 100 * zoom, 'height': h}))).convert('RGB')
            pg.unroute('**/kid-lantern.png')
    b.close()
rows = []
for zoom, dark, st in COND:
    bb = ImageChops.difference(shots[('s13f1', 'unlit', zoom, False)], shots[('s13f1', 'lit', zoom, False)]).getbbox(); m = int(30 * zoom) + 10
    box = (max(bb[0] - m, 0), max(bb[1] - m, 0), bb[2] + m, bb[3] + m); cells = []
    for name, key in V:
        im = shots[(key, st, zoom, dark)].crop(box); im = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
        c = Image.new('RGB', (im.width, im.height + 18), (30, 27, 46)); c.paste(im, (0, 18))
        ImageDraw.Draw(c).text((4, 3), '%s · %s · %d%% · %s bg' % (name, st, zoom * 100, 'dark' if dark else 'light'), fill=(255, 255, 255)); cells.append(c)
    r = Image.new('RGB', (sum(c.width + 6 for c in cells), max(c.height for c in cells)), (255, 255, 255)); x = 0
    for c in cells: r.paste(c, (x, 0)); x += c.width + 6
    rows.append(r)
W = max(r.width for r in rows); H = sum(r.height + 6 for r in rows) + 24
out = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(out)
d.text((6, 5), 'FEASIBILITY ONLY - not a design, not an asset · S hand x4 · fix1 / B / B2 · SIZE PREVIEW (light layer 100%, no glow FX)', fill=(40, 20, 50)); y = 24
for r in rows: out.paste(r, (0, y)); y += r.height + 6
out.save(os.path.join(OUT, 'feas2-focus-fix1-B-B2.png')); print(out.size)
