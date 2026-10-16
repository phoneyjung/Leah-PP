#!/usr/bin/env python3
# Small real-speed GIF for review: E stop at the worst walk frame, smooth vs step, zoom 100 % and 75 % (Claude 17 Oct 2569)
# usage: python3 -I qa/g2-2b-pilot/make_e_small_gif.py PORT OUT_GIF
import sys, os, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
PORT, OUT = sys.argv[1], sys.argv[2]; STEP = 20; K = None
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html?hold' % PORT); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.walkhold', timeout=15000)
    best = (-1, 0)
    for k in range(6):
        off = pg.evaluate("""(k)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:'E',anim:'idle',fi:0,t:0,hold:true,ease:true,easeStep:false,lpos:null,ldir:null,lhist:null,moving:false,pos:{x:160,y:200}});P.draw();
          for(let t=0;t<600;t+=20){P.step(20);P.draw()}P.walk('E');for(let t=0;t<1200+k*100+40;t+=20){P.step(20);P.draw()}P.stop();let m=0;for(let t=0;t<600;t+=20){P.step(20);P.draw();const L=S.last.lantern;if(L)m=Math.max(m,L.off)}return m}""", k)
        if off > best[0]: best = (off, k)
    K = best[1]; panels = []
    for zoom in (1, 0.75):
        for label, stp in (('SMOOTH', False), ('STEP', True)):
            pg.evaluate("""(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:'E',anim:'idle',fi:0,t:0,hold:true,ease:true,easeStep:a.stp,lpos:null,ldir:null,lhist:null,moving:false,pos:{x:160,y:200},zoom:a.z,clean:false,dark:false,guides:false});P.draw();
              for(let t=0;t<600;t+=20){P.step(20);P.draw()}P.walk('E');for(let t=0;t<1200+a.k*100+40-300;t+=20){P.step(20);P.draw()}}""", {'stp': stp, 'k': K, 'z': zoom})
            fr = []
            for i in range(int(1000 / STEP)):          # 0.3 s walking, stop, 0.7 s standing
                if i == int(300 / STEP): pg.evaluate('PT.stop()')
                pg.evaluate('(s)=>{PT.step(s);PT.draw()}', STEP)
                hgt = 70 * zoom
                png = pg.screenshot(clip={'x': 422 - 34, 'y': 195 - hgt * 0.62, 'width': 68, 'height': hgt * 0.62 + 6})
                im = Image.open(io.BytesIO(png)).convert('RGB'); off = pg.evaluate('PT.ST.last.lantern?PT.ST.last.lantern.off:-1')
                im = im.resize((178, int(im.height * 178 / im.width)), Image.NEAREST)
                cv = Image.new('RGB', (178, im.height + 16), (30, 27, 46)); cv.paste(im, (0, 16))
                ImageDraw.Draw(cv).text((3, 2), '%s %d%% %s %dpx' % (label, zoom * 100, 'walk' if i < int(300 / STEP) else 'STOP', off), fill=(255, 255, 255)); fr.append(cv)
            panels.append(fr)
    b.close()
h = max(p_[0].height for p_ in panels); out = []
for frs in zip(*panels):
    im = Image.new('RGB', (178 * 4 + 12, h), (255, 255, 255))
    for j, f in enumerate(frs): im.paste(f, (j * 182, 0))
    out.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
out[0].save(OUT, save_all=True, append_images=out[1:], duration=STEP, loop=0, optimize=True)
print('stop frame', K + 1, 'size', out[0].size, os.path.getsize(OUT), 'bytes')
