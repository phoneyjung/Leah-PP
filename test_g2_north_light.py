#!/usr/bin/env python3
# O13 north light test (Claude · 29 Oct 2569 · Pilot GM only, no index.html / sw.js / save)
# Rule (option D, candidate A): cave + facing N + held lit lantern (light layer ok, power 100/50) + Glow+C on -> the lantern stays hidden (D-HAND)
# but ONE cave-darkness hole opens: the existing LHOLE stamp, centre = feet [48,94] 10 px up (cell px 48,84), alpha = power-table hole x NHOLE.k (k = 1).
# Nothing else changes: no lantern, Glow, light layer or C at N; every other state draws the same pixels as the Pilot before this change.
# usage: python3 -I test_g2_north_light.py NEW_PORT OUT_DIR OLD_PORT SIM_PORT
#   OLD_PORT = Pilot before this change (claude/g2-pilot 62f93a9) · SIM_PORT = the O13 simulation page the owner saw (NH_DEFAULT=null, ST.nh set by the test)
import sys, os, json
from playwright.sync_api import sync_playwright
PN, OUT, PO, PS = sys.argv[1:5]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, 'pilot-g2-motion.html'), encoding='utf-8').read()
CHECK = []; R = {'meta': {'viewport': [844, 390], 'dpr': 2.625, 'new': PN, 'old': PO, 'sim': PS}}
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name, flush=True)
URL = lambda port, extra='': 'http://127.0.0.1:%s/pilot-g2-motion.html?gm%s' % (port, extra)
LIB = """window.__M={
 h(D){let a=2166136261>>>0,b=0x9747b28c;for(let i=0;i<D.length;i++){a=Math.imul(a^D[i],16777619)>>>0;b=Math.imul(b^D[i],0x01000193^0x2f)>>>0;b=(b<<13|b>>>19)>>>0}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')},
 set(o){const P=PT;P.pause(true);P.set(Object.assign({pos:{x:160,y:120},t:0,lpos:null,ldir:null,lhist:null,zoom:1,clean:false,blinkNow:false,guides:false,moving:false,mv:null},o))},
 cfg(c){const P=PT,S=P.ST;if(P.NHOLE&&c&&'k' in c)P.NHOLE.k=c.k;if('nh' in S)S.nh=c&&c.nh?c.nh:null},
 fin(v){return typeof v==='number'?Number.isFinite(v):Array.isArray(v)?v.every(x=>__M.fin(x)):v&&typeof v==='object'?Object.values(v).every(x=>__M.fin(x)):true}};"""
# every state: 8 dirs x scene x power x Glow+C x hold x idle/walk x light layer ok/missing = 1536 · canvas hash + draw flags + finite numbers + draw errors
MATRIX = """(c)=>{const P=PT,S=P.ST,cv=document.getElementById('cv'),g=cv.getContext('2d'),o={};const keepL=S.img.lanternLight;__M.cfg(c);
 for(const d of ['S','SE','E','NE','N','NW','W','SW'])for(const sc of ['light','dark','cave'])for(const pw of [100,50,10,0])for(const fx of [true,false])for(const hold of [true,false])for(const an of ['idle','walk'])for(const lay of ['ok','missing']){
  S.img.lanternLight=lay==='ok'?keepL:null;__M.set({dir:d,anim:an,fi:an==='walk'?3:0,hold,fx,power:pw,scene:sc});
  let err=null;try{P.draw()}catch(e){err=String(e)}const L=S.last,D=L.gm.drawn;
  o[[d,sc,pw,fx,hold,an,lay].join(' ')]={err,h:__M.h(g.getImageData(0,0,cv.width,cv.height).data),lantern:!!L.lantern,light:D.light,glow:D.glow,pool:D.pool,hole:D.caveHole,nHole:!!D.nHole,
   fin:__M.fin({s:L.s,fx:L.fx,fy:L.fy,sx:L.sx,sy:L.sy,tag:L.tag,lan:L.lantern?L.lantern.drawn:[]})}}
 S.img.lanternLight=keepL;__M.cfg({k:1,nh:null});return o}"""
# draw calls of the light / C / lantern images in one frame (recorded by the test, the page is not changed)
CALLS = """(a)=>{const P=PT,S=P.ST,rec=[],pr=CanvasRenderingContext2D.prototype,orig=pr.drawImage;const name=im=>im===P.FX.lhole?'lhole':im===P.FX.glow?'glow':im===P.FX.poolHole?'poolHole':im===P.FX.poolFlat?'poolFlat':im===S.img.lantern?'lantern':im===S.img.lanternLight?'light':null;
 pr.drawImage=function(im,...r){const n=name(im);if(n)rec.push([n,Math.round(this.globalAlpha*1000)/1000,this.globalCompositeOperation,this.canvas===P.FX.dark?'dark layer':'screen',r.slice(0,2).map(v=>Math.round(v))]);return orig.call(this,im,...r)};
 try{__M.set(a);P.draw()}finally{pr.drawImage=orig}return {rec,sx:S.last.sx,sy:S.last.sy,s:S.last.s}}"""
# one N cave picture: body mask from the light floor, then k = 0 (old N) vs the page's k at the same place
SHOT = """(a)=>{const P=PT,S=P.ST,cv=document.getElementById('cv'),g=cv.getContext('2d');const st={dir:'N',anim:a.an,fi:a.fi,hold:true,fx:true,power:a.pw,zoom:a.z};
 const grab=(sc,k,blank,nodark)=>{P.NHOLE.k=k;__M.set(Object.assign({scene:sc},st));const keep={idle:S.img.idle,walk:S.img.walk,walkhold:S.img.walkhold};
  if(blank)for(const q in keep)if(keep[q]){const b=document.createElement('canvas');b.width=keep[q].width;b.height=keep[q].height;S.img[q]=b}
  const pr=CanvasRenderingContext2D.prototype,orig=pr.drawImage;if(nodark)pr.drawImage=function(im,...r){if(im===P.FX.dark)return;return orig.call(this,im,...r)};   // reference only: the same frame without the cave darkness layer (test-side, page unchanged)
  try{P.draw()}finally{pr.drawImage=orig}for(const q in keep)S.img[q]=keep[q];const L=S.last;return {D:g.getImageData(0,0,cv.width,cv.height).data,sx:L.sx,sy:L.sy,s:L.s,drawn:Object.assign({},L.gm.drawn),lantern:!!L.lantern}};
 const W=cv.width,H=cv.height;const lt=grab('light',1,false),lb=grab('light',1,true);const mask=new Uint8Array(W*H);let nb=0;
 for(let i=0,p=0;i<lt.D.length;i+=4,p++)if(lt.D[i]!==lb.D[i]||lt.D[i+1]!==lb.D[i+1]||lt.D[i+2]!==lb.D[i+2]){mask[p]=1;nb++}
 const base=grab('cave',0,false),cand=grab('cave',1,false),ref=grab('cave',1,false,true);P.NHOLE.k=1;const s=base.s,sx=base.sx,sy=base.sy;const Y=(D,i)=>0.2126*D[i]+0.7152*D[i+1]+0.0722*D[i+2];
 let lumB=0,lumC=0,lumL=0,ch=0,chBody=0,closer=0,worse=0,maxDev=0,maxR=0,brighter=0,darker=0,away=0;const cx0=sx+48*s,cy0=sy+84*s;
 for(let p=0,i=0;p<W*H;p++,i+=4){const dif=base.D[i]!==cand.D[i]||base.D[i+1]!==cand.D[i+1]||base.D[i+2]!==cand.D[i+2];
  if(mask[p]){lumB+=Y(base.D,i);lumC+=Y(cand.D,i);lumL+=Y(lt.D,i)}
  if(dif){ch++;const x=p%W,y=(p/W)|0;maxR=Math.max(maxR,Math.hypot(x+0.5-cx0,y+0.5-cy0)/s);if(Y(cand.D,i)>Y(base.D,i))brighter++;else darker++;{const Rf=[ref.D[i],ref.D[i+1],ref.D[i+2]],dB=Math.hypot(...Rf.map((t,j)=>t-base.D[i+j])),dC=Math.hypot(...Rf.map((t,j)=>t-cand.D[i+j]));if(dC>dB+0.5)away++}
   if(mask[p]){chBody++;const T=[lt.D[i],lt.D[i+1],lt.D[i+2]],B0=[base.D[i],base.D[i+1],base.D[i+2]],C0=[cand.D[i],cand.D[i+1],cand.D[i+2]];
    const dB=Math.hypot(...T.map((t,j)=>t-B0[j])),dC=Math.hypot(...T.map((t,j)=>t-C0[j]));if(dC<=dB+0.5)closer++;else worse++;
    const v=T.map((t,j)=>t-B0[j]),u=C0.map((c,j)=>c-B0[j]),vv=v.reduce((q,x)=>q+x*x,0)||1,tt=Math.max(0,Math.min(1,u.reduce((q,x,j)=>q+x*v[j],0)/vv));maxDev=Math.max(maxDev,Math.hypot(...u.map((x,j)=>x-tt*v[j])))}}}
 return {s,bodyPx:nb,lumBase:+(lumB/nb).toFixed(1),lumNew:+(lumC/nb).toFixed(1),lumLight:+(lumL/nb).toFixed(1),changedPx:ch,changedBodyPx:chBody,awayFromUndarkened:away,bodyCloser:closer,bodyWorse:worse,brighter,darker,maxTintDev:+maxDev.toFixed(2),maxR_art:+maxR.toFixed(2),drawn:cand.drawn,lantern:cand.lantern}}"""
TURN = """()=>{const P=PT,S=P.ST,o={};for(const [sc,pw] of [['cave',100],['cave',50],['cave',10],['dark',100]]){const k=sc+' '+pw;o[k]=[];for(const [a,c] of [['NE','N'],['N','NE'],['NW','N'],['N','NW']]){P.pause(true);P.set({dir:a,anim:'walk',fi:0,hold:true,power:pw,fx:true,scene:sc,lpos:null,ldir:null,clean:false});P.draw();
  for(let i=0;i<10;i++){P.step(16);P.draw()}S.dir=c;P.step(16);P.draw();const D=S.last.gm.drawn;o[k].push([!!S.last.lantern,D.glow,D.caveHole,!!D.nHole,D.pool])}}return o}"""
FPS = """(k)=>{PT.NHOLE.k=k;PT.set({hold:true,power:100,fx:true,scene:'cave',clean:false,lpos:null,ldir:null,pos:{x:160,y:200},zoom:1});PT.pause(false);PT.walk('N')}"""
RAF = "()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})"
med = lambda v: sorted(v)[len(v) // 2]
def allowed(key):
    d, sc, pw, fx, hold, an, lay = key.split(' ')
    return d == 'N' and sc == 'cave' and pw in ('100', '50') and fx == 'true' and hold == 'true' and lay == 'ok'

ok('N0 page source: one NHOLE = {cx:48,cy:84,k:1} (P2 = feet 10 px up, k 1.00 = candidate A) · no rotation / ctx.filter', SRC.count('const NHOLE={cx:48,cy:84,k:1};') == 1 and SRC.count('NHOLE.k>0') == 1
   and SRC.count('rotate') + SRC.count('setTransform') + SRC.count('.filter=') + SRC.count('.filter =') == 0, SRC.count('const NHOLE='))
with sync_playwright() as p:
    br = p.chromium.launch(); ctx = br.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    errs = {'new': [], 'old': [], 'sim': []}; pages = {}
    for name, port in (('new', PN), ('old', PO), ('sim', PS)):
        pg = ctx.new_page(); pg.on('pageerror', lambda e, n=name: errs[n].append(str(e))); pg.goto(URL(port))
        pg.wait_for_function("window.PT&&PT.ST.ok.walk&&PT.ST.ok.idle&&PT.FX.dark&&PT.ST.ok.lantern&&PT.ST.ok.walkhold&&PT.ST.img.lanternLight", timeout=20000); pg.evaluate(LIB); pages[name] = pg
    new, old, sim = pages['new'], pages['old'], pages['sim']
    ok('N0b default k = 1 on the GM page', new.evaluate('PT.NHOLE.k') == 1, new.evaluate('PT.NHOLE'))
    M = {'old': old.evaluate(MATRIX, None), 'new': new.evaluate(MATRIX, {'k': 1}), 'new k0': new.evaluate(MATRIX, {'k': 0}), 'new k0.6': new.evaluate(MATRIX, {'k': 0.6}),
         'sim A': sim.evaluate(MATRIX, {'nh': {'cx': 48, 'cy': 84, 'k': 1}}), 'sim B': sim.evaluate(MATRIX, {'nh': {'cx': 48, 'cy': 84, 'k': 0.6}})}
    keys = sorted(M['old']); n = len(keys); R['states'] = n
    FL = ('lantern', 'light', 'glow', 'pool', 'hole')
    def same(a, b, k): return M[a][k]['h'] == M[b][k]['h'] and all(M[a][k][f] == M[b][k][f] for f in FL)
    diff_keys = [k for k in keys if not same('old', 'new', k)]
    bad_out = [k for k in diff_keys if not allowed(k)]; inside = [k for k in keys if allowed(k)]
    flags_in = {k: {f: M['new'][k][f] for f in FL + ('nHole',)} for k in inside}
    want_in = lambda k: {'lantern': False, 'light': 0, 'glow': False, 'pool': False, 'hole': 1 if k.split(' ')[2] == '100' else 0.5, 'nHole': True}
    ok('N1 regression (%d states = 8 dirs x light/dark/cave x power 100/50/10/0 x Glow+C on/off x hold on/off x idle/walk x light layer ok/missing): same pixels and draw flags as before this change, except the allowed states (N + cave + hold + Glow+C on + light layer ok + power 100/50)' % n,
       not bad_out and set(diff_keys) == set(inside) and len(inside) == 4, {'differ': len(diff_keys), 'allowed': len(inside), 'differ_outside_allowed': bad_out[:5], 'differ_keys': diff_keys})
    ok('N2 allowed states: no lantern, no light layer, no Glow, no C · one cave hole with alpha = hole x k (power 100 -> 1, 50 -> 0.5) · nHole flag only there',
       all(flags_in[k] == want_in(k) for k in inside) and not [k for k in keys if M['new'][k]['nHole'] and not allowed(k)], flags_in)
    ok('N3 draw() throws 0 times and every number is finite (all states, old / new / k 0 / k 0.6)', all(M[m][k]['err'] is None and M[m][k]['fin'] for m in ('old', 'new', 'new k0', 'new k0.6') for k in keys),
       sum(1 for m in ('new', 'new k0', 'new k0.6') for k in keys if M[m][k]['err'] or not M[m][k]['fin']))
    ok('N4 k = 0 draws exactly the old page in every state (the switch fully restores the old N)', all(same('old', 'new k0', k) for k in keys), sum(1 for k in keys if not same('old', 'new k0', k)))
    ok('N5 the real page = the simulation the owner looked at, in every state: k 1.00 = SIM P2 k1.00 (A) · k 0.60 = SIM P2 k0.60 (B)',
       all(same('new', 'sim A', k) and M['new'][k]['nHole'] == M['sim A'][k]['nHole'] for k in keys) and all(same('new k0.6', 'sim B', k) for k in keys),
       {'A_differ': sum(1 for k in keys if not same('new', 'sim A', k)), 'B_differ': sum(1 for k in keys if not same('new k0.6', 'sim B', k))})
    # draw calls at N: exactly one lhole (the N light) in the allowed states, no lantern / light / glow / C anywhere at N
    calls = {}
    for sc in ('cave', 'dark', 'light'):
        for pw in (100, 50, 10, 0):
            for an, fi in (('idle', 0), ('walk', 3)):
                for fx in (True, False):
                    c = new.evaluate(CALLS, {'dir': 'N', 'anim': an, 'fi': fi, 'hold': True, 'fx': fx, 'power': pw, 'scene': sc})
                    calls['%s %d %s fx%s' % (sc, pw, an, fx)] = c
    def good(k, c):
        sc, pw, an, fx = k.split(' '); want = sc == 'cave' and pw in ('100', '50') and fx == 'fxTrue'
        lh = [r for r in c['rec'] if r[0] == 'lhole']; other = [r for r in c['rec'] if r[0] != 'lhole']
        if other: return False
        if not want: return not lh
        a = 1 if pw == '100' else 0.5
        return len(lh) == 1 and lh[0][1] == a and lh[0][2] == 'destination-out' and lh[0][3] == 'dark layer'
    ok('N6 facing N (cave / dark / light x power 100/50/10/0 x idle/walk x Glow+C on/off): lantern, light layer, Glow and C are never drawn · the cave hole is drawn once (destination-out on the darkness, alpha 1 / 0.5) only in cave + power 100/50 + Glow+C on',
       all(good(k, c) for k, c in calls.items()), {k: c['rec'] for k, c in calls.items() if c['rec'] or not good(k, c)})
    # where the light goes and what it does to the body: every frame, zoom 100 / 75, power 100 / 50
    shots = {}
    for pw in (100, 50):
        for z in (1, 0.75):
            for an, nf in (('idle', 4), ('walk', 6)):
                for fi in range(nf): shots['%d z%s %s f%d' % (pw, z, an, fi + 1)] = new.evaluate(SHOT, {'pw': pw, 'z': z, 'an': an, 'fi': fi})
    R['shots'] = shots
    ok('N7 the light stays inside the hole: every changed px is within 74 art px of the centre (feet 10 px up; stamp radius 72 + 2 px for whole-px placement) and moves toward the same picture without the cave darkness (0 away) · every frame, idle/walk, zoom 100/75, power 100/50',
       all(v['changedPx'] > 0 and v['maxR_art'] <= 74 and v['awayFromUndarkened'] == 0 for v in shots.values()),
       {'cases': len(shots), 'maxR_art_max': max(v['maxR_art'] for v in shots.values()), 'away_max': max(v['awayFromUndarkened'] for v in shots.values()), 'darker_lum_info_max': max(v['darker'] for v in shots.values()), 'changed_min': min(v['changedPx'] for v in shots.values())})
    ok('N8 the body is only uncovered, never tinted: every changed body px moves toward its true colour (0 worse) · tint off the base->true line <= 2',
       all(v['changedBodyPx'] > 0 and v['bodyWorse'] == 0 and v['maxTintDev'] <= 2 for v in shots.values()),
       {'worse_max': max(v['bodyWorse'] for v in shots.values()), 'tint_max': max(v['maxTintDev'] for v in shots.values()), 'changed_body_min': min(v['changedBodyPx'] for v in shots.values())})
    a1, a5 = shots['100 z1 idle f1'], shots['50 z1 idle f1']
    R['luma'] = {k: [v['lumBase'], v['lumNew'], v['lumLight']] for k, v in shots.items()}
    ok('N9 body brightness facing N in the cave (idle f1, zoom 100) = the simulation: power 100 55.2 (was 16.4) · power 50 35.5 (+-0.1)',
       abs(a1['lumNew'] - 55.2) <= 0.1 and abs(a1['lumBase'] - 16.4) <= 0.1 and abs(a5['lumNew'] - 35.5) <= 0.1, {'100': [a1['lumBase'], a1['lumNew'], a1['lumLight']], '50': [a5['lumBase'], a5['lumNew'], a5['lumLight']]})
    turn = new.evaluate(TURN)
    F, T = False, True
    W = {'cave 100': [[F, F, 1, T, F], [T, T, 1, F, T], [F, F, 1, T, F], [T, T, 1, F, T]], 'cave 50': [[F, F, 0.5, T, F], [T, T, 0.5, F, T], [F, F, 0.5, T, F], [T, T, 0.5, F, T]],
         'cave 10': [[F, F, 0, F, F], [T, F, 0, F, T], [F, F, 0, F, F], [T, F, 0, F, T]], 'dark 100': [[F, F, 0, F, F], [T, T, 0, F, T], [F, F, 0, F, F], [T, T, 0, F, T]]}
    ok('N10 turning NE/NW -> N -> NE/NW while walking: the N light and the lantern (+ its light, Glow, C) swap on the same frame · cave 100 / 50 / 10 and dark floor 100',
       turn == W, {'got': turn, 'want': W})
    # URL switch ?nk (GM only)
    url = {}
    for v in ('0', '0.6', '0.35', '.5', '1', '2', '-1', 'abc', '', '1e-1', '%20', '%200.6', '0x1', 'Infinity'):
        pg = ctx.new_page(); e = []; pg.on('pageerror', lambda x, e=e: e.append(str(x))); pg.goto(URL(PN, '&nk=' + v)); pg.wait_for_function('window.PT&&PT.ST.ok.lantern', timeout=15000)
        url[v] = [pg.evaluate('PT.NHOLE.k'), len(e)]; pg.close()
    pg = ctx.new_page(); pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html?nk=0' % PN); pg.wait_for_function('window.PT&&PT.ST.ok.walk', timeout=15000); url['no gm, nk=0'] = [pg.evaluate('PT.NHOLE.k'), 0]; pg.close()
    want_url = {'0': 0, '0.6': 0.6, '0.35': 0.35, '.5': 0.5, '1': 1, '2': 1, '-1': 1, 'abc': 1, '': 1, '1e-1': 1, '%20': 1, '%200.6': 1, '0x1': 1, 'Infinity': 1, 'no gm, nk=0': 1}
    ok('N11 GM switch ?nk=0..1 (plain decimal digits only) sets k (0 = old N, 0.6 = candidate B) · out of range / not a number / empty / spaces / 1e-1 / 0x1 / without ?gm -> ignored (k stays 1) · 0 page errors',
       {k: v[0] for k, v in url.items()} == want_url and all(v[1] == 0 for v in url.values()), url)
    # FPS walking N in the cave: k 1 vs k 0, same page, 5 alternating pairs, 4x CPU, median of the per-pair ratios
    # the old / sim pages keep drawing every frame (their loop never stops) -> close them first so only the measured page uses the CPU (fix after runs 1-2, criterion unchanged)
    R['n13_errors_before_close'] = {k: list(v) for k, v in errs.items()}; old.close(); sim.close()
    cdp = ctx.new_cdp_session(new); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4}); pairs = []
    for rnd in range(5):
        r_ = {}
        for k in ((0, 1) if rnd % 2 == 0 else (1, 0)):
            new.evaluate(FPS, k); new.wait_for_timeout(300); r_[k] = new.evaluate(RAF); r_['n%d' % k] = new.evaluate('!!PT.ST.last.gm.drawn.nHole&&PT.ST.dir==="N"&&PT.ST.anim==="walk"'); new.evaluate('PT.stop()')
        pairs.append([round(r_[0], 1), round(r_[1], 1), round(r_[1] / r_[0], 3), r_['n0'], r_['n1']])
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); new.evaluate('PT.NHOLE.k=1')
    dms = new.evaluate("""()=>{const P=PT;const run=(k)=>{P.NHOLE.k=k;P.pause(true);P.set({hold:true,power:100,fx:true,scene:'cave',dir:'N',anim:'walk',fi:0,clean:false,lpos:null,ldir:null});for(let i=0;i<60;i++){P.step(16);P.draw()}
       const g=document.getElementById('cv').getContext('2d');g.getImageData(0,0,1,1);const t0=performance.now();for(let i=0;i<300;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);return (performance.now()-t0)/300};const r=[];for(let q=0;q<7;q++)r.push([run(0),run(1)]);P.NHOLE.k=1;
       const m=v=>v.slice().sort((a,b)=>a-b)[3];return {k0:+m(r.map(x=>x[0])).toFixed(3),k1:+m(r.map(x=>x[1])).toFixed(3)}}""")
    R['fps_pairs_k0_k1_ratio'] = pairs; R['draw_ms_cpu1x'] = dms
    ok('N12 FPS walking N in the cave with the N light >= 90 % of the same walk without it (4x CPU, rAF 2 s, 5 alternating pairs, median of ratios) · the N light really drawn in the k1 runs and not in the k0 runs · not at the 60 fps cap · draw ms reported',
       med([q[2] for q in pairs]) >= 0.9 and all(q[3] is False and q[4] is True for q in pairs) and max(max(q[0], q[1]) for q in pairs) < 55,
       {'pairs [k0, k1, ratio, nHole k0, nHole k1]': pairs, 'median_ratio': med([q[2] for q in pairs]), 'draw_ms_cpu1x': dms})
    ok('N13 page errors 0 (new / old / sim pages)', not any(errs.values()), {k: v[:3] for k, v in errs.items()})
    R['matrix_sample'] = {k: M['new'][k] for k in inside}
    br.close()
R['checks'] = CHECK
json.dump(R, open(os.path.join(OUT, 'o13-north-light.json'), 'w'), ensure_ascii=False, indent=1)
np_ = sum(c['pass'] for c in CHECK); print('%d/%d PASS' % (np_, len(CHECK)))
sys.exit(0 if np_ == len(CHECK) else 1)
