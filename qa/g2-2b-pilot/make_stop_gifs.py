#!/usr/bin/env python3
# Real-speed GIFs from pilot-g2-motion.html?hold: stop (walk -> idle f3) in E / W / NE at the worst stop frame: snap | smooth ease (A) | step ease (Claude 16-17 Oct 2569)
# usage: python3 -I qa/g2-2b-pilot/make_stop_gifs.py PORT OUT_DIR
import sys, os, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
STEP = 20
SIM = """(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:a.d,anim:'idle',fi:0,t:0,hold:true,ease:a.ease,lpos:null,ldir:null,clean:false,zoom:1,off:true,blinkNow:false,moving:false,pos:{x:160,y:200},dark:false,guides:false});P.draw();
 let worst=null;return true}"""
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html?hold' % PORT); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.walkhold && PT.ST.ok.lantern', timeout=15000)
    def worst_k(d):
        best = (-1, 0)
        for k in range(6):
            off = pg.evaluate("""(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:a.d,anim:'idle',fi:0,t:0,hold:true,ease:true,easeStep:false,lpos:null,ldir:null,lhist:null,moving:false,pos:{x:160,y:200}});P.draw();
              for(let t=0;t<600;t+=20){P.step(20);P.draw()}P.walk(a.d);for(let t=0;t<1200+a.k*100+40;t+=20){P.step(20);P.draw()}P.stop();let m=0;
              for(let t=0;t<600;t+=20){P.step(20);P.draw();const L=S.last.lantern;if(L)m=Math.max(m,L.off)}return m}""", {'d': d, 'k': k})
            if off > best[0]: best = (off, k)
        return best[1]
    panels = {}
    MODES = (('SNAP', False, False), ('SMOOTH', True, False), ('STEP', True, True))
    for d in ('E', 'W', 'NE'):
        k = worst_k(d)
        for label, ease, stp in MODES:
            pg.evaluate("""(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:a.d,anim:'idle',fi:0,t:0,hold:true,ease:a.ease,easeStep:a.stp,lpos:null,ldir:null,lhist:null,moving:false,pos:{x:160,y:200}});P.draw();
              for(let t=0;t<600;t+=20){P.step(20);P.draw()}P.walk(a.d);for(let t=0;t<1200+a.k*100+40-600;t+=20){P.step(20);P.draw()}}""", {'d': d, 'ease': ease, 'stp': stp, 'k': k})
            frames = []
            for i in range(int(1600 / STEP)):           # 0.6 s walking, stop, 1.0 s standing
                if i == int(600 / STEP): pg.evaluate('PT.stop()')
                pg.evaluate('(s)=>{PT.step(s);PT.draw()}', STEP)
                png = pg.screenshot(clip={'x': 422 - 52, 'y': 195 - 104, 'width': 104, 'height': 122})
                im = Image.open(io.BytesIO(png)).convert('RGB'); off = pg.evaluate('PT.ST.last.lantern?PT.ST.last.lantern.off:-1')
                dr = ImageDraw.Draw(im); dr.rectangle([0, 0, im.width, 22], fill=(30, 27, 46))
                dr.text((4, 4), '%s %s %s ring-fist %d' % (d, label, 'walk' if i < int(600 / STEP) else 'STOP', off), fill=(255, 255, 255))
                frames.append(im)
            panels[(d, label)] = frames
    b.close()
for d in ('E', 'W', 'NE'):
    ps = [panels[(d, m[0])] for m in MODES]; w, h = ps[0][0].size; out = []
    for fr in zip(*ps):
        im = Image.new('RGB', (w * 3 + 12, h), (255, 255, 255))
        for j, f in enumerate(fr): im.paste(f, (j * (w + 6), 0))
        out.append(im.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    out[0].save(os.path.join(OUT, 'stop-%s-snap-smooth-step-realspeed.gif' % d), save_all=True, append_images=out[1:], duration=STEP, loop=0, optimize=False)
    print(d, 'frames', len(out), 'size', out[0].size)
