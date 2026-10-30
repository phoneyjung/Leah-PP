#!/usr/bin/env python3
# Cave lantern light size try-out (Claude · 30 Oct 2569 · owner 23:26 "ตะเกียงมองเห็นได้แคบไป") · Pilot only, GM only
# The cave hole keeps its band shape and is scaled to R = 72 (the old light) / 100 / 130 / 160 art px: GM button "วงแสง / light" or ?gm&lr=R.
# v1.1 (owner ok 23:48): GM default = 130 · without ?gm nothing changes (R 72, button hidden)
# usage: python3 -I test_g2_lantern_radius.py PORT OUT_DIR   (serve this folder with python3 -m http.server PORT)
import sys, os, json
from playwright.sync_api import sync_playwright
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
BASE = 'http://127.0.0.1:%s/pilot-g2-motion.html' % PORT
B72 = [[20, 1], [32, 0.85], [44, 0.65], [56, 0.42], [66, 0.22], [72, 0.1]]
CHECK = []; R = {}
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name, val, flush=True)
STATE = "()=>({R:PT.LHOLE.R,bands:PT.LHOLE.bands,w:PT.FX.lhole?PT.FX.lhole.width:null,btn:document.getElementById('bLR').textContent,shown:document.getElementById('bLR').style.display!=='none'})"
LIT = r"""(dir)=>{const P=PT,S=P.ST;P.pause(true);P.set({pos:{x:160,y:120},anim:'idle',fi:0,t:0,hold:true,lpos:null,ldir:null,lhist:null,zoom:1,power:100,fx:true,scene:'cave',moving:false});
  P.setDir?P.setDir(dir):null;S.dir=dir;P.draw();const c=document.getElementById('cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let n=0,sum=0;for(let i=0;i<d.length;i+=4){const L=0.3*d[i]+0.59*d[i+1]+0.11*d[i+2];sum+=L;if(L>40)n++}
  return {lit:n,mean:+(sum/(d.length/4)).toFixed(2),hole:S.gmDraw?S.gmDraw.caveHole:null,nHole:!!(S.gmDraw&&S.gmDraw.nHole)}}"""
FPS = "async()=>{PT.pause(false);let n=0;const t0=performance.now();await new Promise(r=>{const f=()=>{n++;performance.now()-t0<3000?requestAnimationFrame(f):r()};requestAnimationFrame(f)});return +(n/((performance.now()-t0)/1000)).toFixed(1)}"
with sync_playwright() as p:
    br = p.chromium.launch(); errs = []
    def page(q):
        pg = br.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.goto(BASE + q); pg.wait_for_function("window.PT&&PT.ST&&(!PT.ST.gm||PT.FX.lhole)&&PT.ST.img&&PT.ST.img.idle", timeout=20000); pg.wait_for_timeout(300); return pg
    pg = page('?gm&scene=cave'); s = pg.evaluate(STATE); R['default'] = s
    W130 = [[round(b[0] * 130 / 72), b[1]] for b in B72]
    ok('L1 GM default = 130: bands = the old 6 scaled x130/72 (same strengths), stamp 261 px, button shown with 130', s['R'] == 130 and s['bands'] == W130 and s['w'] == 261 and s['shown'] and s['btn'].endswith('130'), [s['R'], s['w'], s['btn']])
    seq = []
    for _ in range(4):
        pg.click('#bLR'); seq.append(pg.evaluate(STATE)['R'])
    ok('L2 button cycles 160 -> 72 -> 100 -> 130', seq == [160, 72, 100, 130], seq)
    pg.close(); pg = page('?gm&scene=cave&lr=72'); s = pg.evaluate(STATE)
    ok('L1b ?lr=72 gives the old light exactly: R 72, the old 6 bands, stamp 145 px', s['R'] == 72 and s['bands'] == B72 and s['w'] == 145, [s['R'], s['w']])
    lit = {72: pg.evaluate(LIT, 'S')}; fps = {72: pg.evaluate(FPS)}; pg.close()
    for r in (100, 130, 160):
        pg = page('?gm&scene=cave&lr=%d' % r); s = pg.evaluate(STATE); R['lr%d' % r] = s
        want = [[round(b[0] * r / 72), b[1]] for b in B72]
        ok('L3 ?lr=%d: R %d, bands scaled (same strengths), stamp %d px, button label' % (r, r, 2 * r + 1), s['R'] == r and s['bands'] == want and s['w'] == 2 * r + 1 and s['btn'].endswith(str(r)), [s['R'], s['w'], s['bands'][0], s['bands'][-1]])
        lit[r] = pg.evaluate(LIT, 'S')
        if r == 160:
            n = pg.evaluate(LIT, 'N'); R['north160'] = n
            ok('L5 facing N (lantern hidden) uses the same wider light: N hole on, lit px > R72 facing S', n['nHole'] and n['lit'] > lit[72]['lit'], n)
            fps[160] = pg.evaluate(FPS)
        pg.close()
    R['lit'] = lit; L = [lit[r]['lit'] for r in (72, 100, 130, 160)]
    ok('L4 lit cave px (luminance > 40) grows with every step 72 < 100 < 130 < 160', L[0] < L[1] < L[2] < L[3], L)
    for q, name, want in (('?gm&scene=cave&lr=999', 'not in the list', 130), ('?gm&scene=cave&lr=abc', 'not a number', 130), ('?lr=130', 'no GM', 72)):
        pg = page(q); s = pg.evaluate(STATE)
        ok('L6 %s (%s) ignored: R %d%s' % (q, name, want, ', button hidden' if 'gm' not in q else ''), s['R'] == want and (s['shown'] if 'gm' in q else not s['shown']), [s['R'], s['shown']]); pg.close()
    R['fps'] = fps
    ok('L7 FPS at R 160 >= 90 % of R 72 (same build, 3 s each)', fps[160] >= 0.9 * fps[72], fps)
    ok('L8 page errors 0', not errs, errs[:3])
    br.close()
R['checks'] = CHECK; R['passed'] = sum(c['pass'] for c in CHECK); R['total'] = len(CHECK)
json.dump(R, open(os.path.join(OUT, 'radius.json'), 'w'), indent=1, ensure_ascii=False)
print('%d/%d passed' % (R['passed'], R['total'])); sys.exit(0 if R['passed'] == R['total'] else 1)
