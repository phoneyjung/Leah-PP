#!/usr/bin/env python3
# Owner choice ค (26 Oct): C pool only with fx on + held lantern drawn + light layer present + power > 0 + not facing N.
# A = Pilot GM 1c40891 as is · B = throwaway copy with the proposed 3-line change (cpool_k.diff). No repo change.
# 1) matrix: 8 dirs x power 100/50/10/0 x hold on/off x Glow+C on/off x scene light/dark/cave x light file ok/missing x idle f1 / walk f4
#    - B's C flag (gmDraw.pool) must equal the rule
#    - B's canvas (all but the GM label band at the bottom, whose text names the Glow+C switch) must equal A's canvas, except where the rule removes C: there B must equal A drawn with Glow+C off
#      (valid because in all of those states A draws no glow and no cave lantern light: asserted)
# 2) changes while walking: turn to N and back, power 100 -> 0 -> 10 -> 50, hold off/on, Glow+C off/on -> C follows on the same frame
import sys, json
from playwright.sync_api import sync_playwright
PA, PB, OUT = sys.argv[1:4]
DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
RUN = """(a)=>{const P=PT,cv=document.getElementById('cv'),g=cv.getContext('2d'),o={};
 const h=(D)=>{let x=2166136261>>>0;for(let i=0;i<D.length;i+=4){x=Math.imul(x^D[i],16777619)>>>0;x=Math.imul(x^D[i+1],16777619)>>>0;x=Math.imul(x^D[i+2],16777619)>>>0}return x};
 for(const d of a.dirs)for(const pw of [100,50,10,0])for(const hold of [true,false])for(const fx of [true,false])for(const sc of ['light','dark','cave'])for(const [an,fi] of [['idle',0],['walk',3]]){
  P.pause(true);P.set({pos:{x:160,y:120},dir:d,anim:an,fi,t:0,hold,lpos:null,ldir:null,lhist:null,zoom:1,clean:false,blinkNow:false,guides:false,moving:false,fx,power:pw,scene:sc});P.draw();
  const D=P.ST.last.gm.drawn;const fs=Math.round(11*(window.devicePixelRatio||1)),hh=cv.height-Math.ceil(2.5*fs+12);o[[d,pw,hold,fx,sc,an].join(' ')]={h:h(g.getImageData(0,0,cv.width,hh).data),pool:D.pool,glow:D.glow,hole:D.caveHole,lan:!!P.ST.last.lantern}}return o}"""
TRANS = """()=>{const P=PT,S=P.ST,log=[];P.pause(true);
 P.set({pos:{x:160,y:160},dir:'SE',anim:'walk',fi:0,t:0,hold:true,lpos:null,ldir:null,lhist:null,zoom:1,clean:false,fx:true,power:100,scene:'cave'});P.walk('SE');
 const run=(n,tag)=>{for(let i=0;i<n;i++){P.step(16);P.draw();log.push([tag,S.dir,S.power,S.hold,S.fx,S.gmDraw.pool,!!S.last.lantern])}};
 run(6,'walk SE');P.walk('N');run(6,'turn N');P.walk('NE');run(6,'turn NE');
 S.power=0;run(4,'power 0');S.power=10;run(4,'power 10');S.power=50;run(4,'power 50');S.power=100;run(4,'power 100');
 S.hold=false;run(4,'hold off');S.hold=true;S.lpos=null;run(4,'hold on');S.fx=false;run(4,'fx off');S.fx=true;run(4,'fx on');
 S.scene='dark';P.walk('W');run(4,'dark W');P.walk('N');run(4,'dark N');P.walk('SW');run(4,'dark SW');P.stop();return log}"""
def rule(d, pw, hold, fx, sc, light_ok): return fx and hold and d != 'N' and pw > 0 and light_ok and sc in ('dark', 'cave')
res = {}; errs = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, port in (('A', PA), ('B', PB)):
        for miss in (False, True):
            pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625); e = []; pg.on('pageerror', lambda x, e=e: e.append(str(x)))
            if miss: pg.route('**/c2-held-lantern_L0-S-trial-light.png', lambda r: r.abort())
            pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html?gm&lr=72' % port); pg.wait_for_function('PT.ST.ok.walkhold && PT.FX.glow && PT.ST.last', timeout=15000)
            res[(tag, miss)] = pg.evaluate(RUN, {'dirs': DIRS}); errs['%s %s' % (tag, 'light missing' if miss else 'files ok')] = e
            if tag == 'B' and not miss: trans = pg.evaluate(TRANS)
            pg.close()
    b.close()
n = 0; flag_ok = 0; pix_ok = 0; assert_ok = 0; bad = []; cnt = {'C on': 0, 'C off': 0}
for miss in (False, True):
    A, B = res[('A', miss)], res[('B', miss)]
    for k, vb in B.items():
        d, pw, hold, fx, sc, an = k.split(); pw = int(pw); hold = hold == 'true'; fx = fx == 'true'
        want = rule(d, pw, hold, fx, sc, not miss); n += 1; cnt['C on' if want else 'C off'] += 1
        f_ok = vb['pool'] == want; flag_ok += f_ok
        removes = fx and sc in ('dark', 'cave') and not want
        if removes:
            on = A[k]; a_ok = (on['glow'] is False and not on['hole']); assert_ok += a_ok
            ref = A[' '.join([d, str(pw), str(hold).lower(), 'false', sc, an])]['h']
        else: a_ok = True; assert_ok += 1; ref = A[k]['h']
        p_ok = vb['h'] == ref; pix_ok += p_ok
        if not (f_ok and p_ok and a_ok): bad.append([k, 'light missing' if miss else 'ok', vb['pool'], want, p_ok, a_ok])
# transitions: C must follow the rule on every frame right after each change
t_ok = 0
for tag, d, pw, hold, fx, pool, lan in trans:
    want = fx and hold and d != 'N' and pw > 0 and True
    t_ok += (pool == want)
out = {'matrix_states': n, 'expected': cnt, 'C_flag_matches_rule': flag_ok, 'canvas_matches_reference': pix_ok, 'reference_valid_no_glow_no_hole': assert_ok, 'bad': bad[:20],
       'transition_frames': len(trans), 'transition_frames_ok': t_ok, 'transitions': [[r[0], r[1], r[2], r[3], r[4], r[5]] for r in trans], 'page_errors': errs}
json.dump(out, open(OUT, 'w'), indent=1)
print(json.dumps({k: v for k, v in out.items() if k not in ('transitions',)}))
seen = []
for r in trans:
    if not seen or seen[-1][0] != r[0]: seen.append(r)
print('first frame after each change:', [(r[0], 'C' if r[5] else '-') for r in seen])
sys.exit(0 if (flag_ok == n and pix_ok == n and assert_ok == n and t_ok == len(trans) and not any(errs.values())) else 1)
