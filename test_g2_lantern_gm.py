#!/usr/bin/env python3
# G2.5a GM lantern test (Claude · 25 Oct 2569 · Pilot only, no index.html / sw.js / save)
# Runs pilot-g2-motion.html?gm in Chromium (844x390 @ DPR 2.625) and checks the real L0 lantern S (Codex fix4 44d2b62) with its light layer,
# power 100/50/10/0 %, Glow + C and light / dark / cave scenes, against G2_5_LANTERN_PLAN.md section 7 (criteria 5, 6, 8, 9, 10) and section 6.
# The hold mechanics (QG-2b numbering: anchor on the fist, D-EASE, fist over the ring) are the existing test: python3 -I test_g2_hold.py PORT OUT gm
# Plan G2.5 criterion 3 (lantern bottom <= row 92 at the drawn position) is G17 here.
# usage: python3 -I test_g2_lantern_gm.py PORT OUT_DIR [OLD_PORT]
#   OLD_PORT (optional) serves the Pilot before this change: then the page WITHOUT ?gm must draw the same canvas pixels as before.
# v2.4 (29 Oct · O13 option D, candidate A): facing N in the cave with a held lit lantern (power 100/50, Glow+C on) now opens ONE cave hole (no lantern, Glow or C).
#   Only G8 and G5b change (their N case): G8 expects caveHole = 1 at N in the cave at power 100 (dark floor and power 10 unchanged = 0);
#   G5b 'cave facing N' keeps "0 px fx on vs off" with the N light switched off (PT.NHOLE.k = 0) and adds "0 C draw calls" with it on. The N light itself: test_g2_north_light.py
# Pixel work runs in the page (helpers in window.__T); Python only judges the numbers.
import sys, os, json, math, hashlib
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
PORT, OUT = sys.argv[1], sys.argv[2]; OLD = sys.argv[3] if len(sys.argv) > 3 else None; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'qa_asset13.py')).read(); ns = {'math': math}; exec(src[src.index('def lab'):src.index('def hexc')], ns); de00 = ns['de00']
DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']; HOLD = [d for d in DIRS if d != 'N']; DPR = 2.625
URL = 'http://127.0.0.1:%s/pilot-g2-motion.html?gm' % PORT
BASE = 'c2-held-lantern_L0-S-trial'
SIGNAL = {'gold #FFC857': (0xFF, 0xC8, 0x57), 'cyan #5FE0FF': (0x5F, 0xE0, 0xFF)}
R = {'meta': {'viewport': [844, 390], 'dpr': DPR, 'page': 'pilot-g2-motion.html?gm', 'lantern': 'Codex fix4 44d2b62 (S cell in all 8 columns = SIZE PREVIEW ONLY)'}}; CHECK = []
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name, flush=True)
sha = lambda p: hashlib.sha256(open(os.path.join(HERE, p), 'rb').read()).hexdigest()
FILES = {BASE + '.png': '8d9485bf70f13f95ffec7d4bed54de895b9f2c00acbc281c28c3819e571684c3', BASE + '-light.png': 'e86599ffcab25f03fc86ca774227806f1c506726ebe80657acbc88cfd645b8a5',
         BASE + '.json': '2637609f5aa4fc201cc9fa6efeadf2349478875444e0473a9c50147113aaf36d'}
got = {f: sha(f) for f in FILES}
ok('G0 lantern files in the Pilot branch = Codex fix4 44d2b62 byte for byte (SHA-256)', got == FILES, {f: v[:16] for f, v in got.items()})
SRC = open(os.path.join(HERE, 'pilot-g2-motion.html'), encoding='utf-8').read()
ok('G0b no rotation / no ctx.filter in the page source', SRC.count('rotate') + SRC.count('setTransform') + SRC.count('.filter=') + SRC.count('.filter =') == 0, 0)

HELPERS = r"""()=>{const P=PT,S=P.ST,C=96;
 const set=(a)=>{P.pause(true);P.set(Object.assign({pos:{x:160,y:120},anim:'idle',fi:0,t:0,hold:true,lpos:null,ldir:null,lhist:null,zoom:1,clean:false,blinkNow:false,nofist:false,guides:false,moving:false,eoff:null},a));P.draw();
   if(a.eoff){const tg=P.lanternTarget();if(tg){S.lpos=[tg[0]+a.eoff[0],tg[1]+a.eoff[1]];S.ldir=S.dir;P.draw()}}return S.last};   // eoff = eased lantern offset from its target (art px)
 const cv=()=>document.getElementById('cv');
 const region=(L)=>{const s=L.s,x0=Math.max(0,Math.round(L.sx-48*s)),y0=Math.max(0,Math.round(L.sy-24*s));return {x0,y0,w:Math.min(cv().width-x0,Math.round(192*s)),h:Math.min(cv().height-y0,Math.round(144*s))}};
 const grab=(Rg)=>cv().getContext('2d').getImageData(Rg.x0,Rg.y0,Rg.w,Rg.h).data;
 const masks=(L)=>{const d=P.DIRS.indexOf(L.dir),img=L.sheet==='walkhold'?S.img.walkhold:S.img.idle;
   const c=document.createElement('canvas');c.width=C;c.height=C;const x=c.getContext('2d');x.drawImage(img,L.frame*C,d*C,C,C,0,0,C,C);const B=x.getImageData(0,0,C,C).data;
   let LA=null,LL=null,org=null;const fr=((S.hanc||{})[L.anim==='walk'?'walk_hold':'idle_hold']||{})[L.dir],ff=fr&&fr[L.frame]&&!S.nofist&&L.lantern?fr[L.frame].fist:[],F=new Set(ff.map(([x,y])=>x+','+y));
   if(L.lantern){const l=document.createElement('canvas');l.width=32;l.height=32;const y=l.getContext('2d');y.drawImage(S.img.lantern,d*32,0,32,32,0,0,32,32);LA=y.getImageData(0,0,32,32).data;
     if(S.img.lanternLight){y.clearRect(0,0,32,32);y.drawImage(S.img.lanternLight,d*32,0,32,32,0,0,32,32);LL=y.getImageData(0,0,32,32).data}
     org=[L.lantern.drawn[0]-S.lanHang[0],L.lantern.drawn[1]-S.lanHang[1]]}
   return {B,LA,LL,org,F}};
 // class per device px: 0 floor · 1 body (sprite opaque, not lantern) · 2 lantern metal · 3 light px ; li = lantern px index (lv*32+lu) for 2/3
 // class of one art px of the 96 cell: [k, lantern px index] · 0 floor · 1 body / fist · 2 lantern metal · 3 light px
 const artClass=(M,u,v)=>{if(u<0||u>=C||v<0||v>=C)return [0,-1];if(M.F.has(u+','+v))return [1,-1];
   if(M.org){const lu=u-M.org[0],lv=v-M.org[1];if(lu>=0&&lu<32&&lv>=0&&lv<32&&M.LA[(lv*32+lu)*4+3]>0)return [(M.LL&&M.LL[(lv*32+lu)*4+3]>0)?3:2,lv*32+lu]}
   return [M.B[(v*C+u)*4+3]>0?1:0,-1]};
 // per device px: the art px under its centre; at zoom 75 % a device px that straddles art px edges gets a class only when every art px it touches has the same class
 // (and, for lantern px, the same lantern px) - otherwise 255 = not assigned (never happens at 100 %, where 1 art px = 3 whole device px)
 const cls=(L,Rg,M)=>{const s=L.s,n=Rg.w*Rg.h,K=new Uint8Array(n),LI=new Int16Array(n).fill(-1);
   for(let Y=0;Y<Rg.h;Y++)for(let X=0;X<Rg.w;X++){const i=Y*Rg.w+X,fu=(Rg.x0+X+0.5-L.sx)/s,fv=(Rg.y0+Y+0.5-L.sy)/s,u=Math.floor(fu),v=Math.floor(fv);
     if(u<0||u>=C||v<0||v>=C)continue;
     const u0=Math.floor((Rg.x0+X-L.sx)/s+1e-6),u1=Math.floor((Rg.x0+X+1-L.sx)/s-1e-6),v0=Math.floor((Rg.y0+Y-L.sy)/s+1e-6),v1=Math.floor((Rg.y0+Y+1-L.sy)/s-1e-6);
     const c0=artClass(M,u,v);let same=true;for(let uu=u0;uu<=u1&&same;uu++)for(let vv=v0;vv<=v1&&same;vv++){const c=artClass(M,uu,vv);if(c[0]!==c0[0]||c[1]!==c0[1])same=false}
     if(!same){K[i]=255;continue}K[i]=c0[0];LI[i]=c0[1]}return {K,LI}};
 // render a and b at the same place: diff px per class and floor energy (sum |diff|)
 const compare=(a,b,glow0)=>{const L=set(a),Rg=region(L),D1=grab(Rg),M=masks(L),Q=cls(L,Rg,M);let keep=null;if(glow0){keep=P.GM_POW[b.power].glow;P.GM_POW[b.power].glow=0}set(b);if(glow0)P.GM_POW[b.power].glow=keep;const D2=grab(Rg);
   const c=[0,0,0,0];let e=0,outCell=0;const s=L.s;for(let i=0;i<Rg.w*Rg.h;i++){const o=i*4,d=Math.abs(D1[o]-D2[o])+Math.abs(D1[o+1]-D2[o+1])+Math.abs(D1[o+2]-D2[o+2]);if(d&&Q.K[i]!==255){c[Q.K[i]]++;if(!Q.K[i])e+=d;
     const X=Rg.x0+i%Rg.w,Y=Rg.y0+Math.floor(i/Rg.w);if(X<L.sx||X>=L.sx+C*s||Y<L.sy||Y>=L.sy+C*s)outCell++}}
   return {floor:c[0],body:c[1],lantern:c[2],light:c[3],energy:e,outCell}};
 // cave: light / C only uncover the body - every changed body px of render a (vs b) is at least as close to the true sprite colour as in b (+1)
 const reveal=(a,b)=>{const L=set(Object.assign({},a,{scene:'light',clean:true,fx:false,power:0})),Rg=region(L),T0=grab(Rg),M=masks(L),Q=cls(L,Rg,M);set(a);const D1=grab(Rg);set(b);const D2=grab(Rg);
   let n=0,bad=0;const dist=(D,o)=>Math.abs(D[o]-T0[o])+Math.abs(D[o+1]-T0[o+1])+Math.abs(D[o+2]-T0[o+2]);for(let i=0;i<Rg.w*Rg.h;i++){if(Q.K[i]!==1)continue;const o=i*4;if(D1[o]===D2[o]&&D1[o+1]===D2[o+1]&&D1[o+2]===D2[o+2])continue;n++;if(dist(D1,o)>dist(D2,o)+1)bad++}return [bad,n]};
 // light px vs a rule: 'light' (= light colour) · 'base' (= lantern colour) · number f (= base*(1-f)+light*f) ; +-2 per channel
 const lightCheck=(a,rule)=>{const L=set(a),Rg=region(L),D=grab(Rg),M=masks(L),Q=cls(L,Rg,M);let bad=0,n=0;
   for(let i=0;i<Rg.w*Rg.h;i++){if(Q.K[i]!==3)continue;n++;const li=Q.LI[i]*4,o=i*4;
     for(let ch=0;ch<3;ch++){const bs=M.LA[li+ch],lg=M.LL[li+ch],w=rule==='light'?lg:rule==='base'?bs:bs*(1-rule)+lg*rule;if(Math.abs(D[o+ch]-w)>2){bad++;break}}}return [bad,n]};
 // unique screen colours that differ between hold on and hold off (everything the lantern, its light and its glow change)
 const changed=(a,noBody)=>{const L=set(Object.assign({},a,{hold:true})),Rg=region(L),D1=grab(Rg),Q=noBody?cls(L,Rg,masks(L)):null;set(Object.assign({},a,{hold:false}));const D2=grab(Rg);const u=new Set(),ub=new Set();
   for(let i=0;i<Rg.w*Rg.h;i++){const o=i*4;if(D1[o]!==D2[o]||D1[o+1]!==D2[o+1]||D1[o+2]!==D2[o+2]){const c=(D1[o]<<16)|(D1[o+1]<<8)|D1[o+2];if(Q&&Q.K[i]===1)ub.add(c);else u.add(c)}}return [[...u],[...ub]]};
 const hash=(a)=>{set(a);const c=cv(),D=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h1=2166136261>>>0,h2=0;for(let i=0;i<D.length;i++){h1=Math.imul(h1^D[i],16777619)>>>0;h2=(h2+D[i]*(i%251+1))>>>0}return h1+':'+h2+':'+c.width+'x'+c.height};
 // v2.3 G18a: every drawImage of the C pool images (FX.poolFlat / FX.poolHole) in one frame: image, alpha, blend, layer, place - recorded by the test, the page is not changed
 const cdraw=(a)=>{const rec=[],pr=CanvasRenderingContext2D.prototype,orig=pr.drawImage;pr.drawImage=function(im,...r){if(im===P.FX.poolFlat||im===P.FX.poolHole)rec.push([im===P.FX.poolFlat?'flat':'hole',this.globalAlpha,this.globalCompositeOperation,this.canvas===P.FX.dark?'dark layer':'screen',r.map(v=>Math.round(v*1000)/1000).join(',')]);return orig.call(this,im,...r)};
   try{set(a)}finally{pr.drawImage=orig}return rec};
 // v2.3 G18b: C alone at power 10 (fx on - fx off) vs C alone at power 100 with GM_POW[100] glow / hole forced 0 · same place · light px of the glass (35 % vs 100 %) excluded
 const cstr=(a)=>{const at=(p,fx,ov)=>{let keep=null;if(ov){keep=Object.assign({},P.GM_POW[p]);Object.assign(P.GM_POW[p],ov)}try{return set(Object.assign({},a,{power:p,fx}))}finally{if(ov)Object.assign(P.GM_POW[p],keep)}};
   const L=at(10,true),Rg=region(L),Q=cls(L,Rg,masks(L)),A1=grab(Rg);at(10,false);const A0=grab(Rg);at(100,true,{glow:0,hole:0});const B1=grab(Rg);at(100,false,{glow:0,hole:0});const B0=grab(Rg);
   let n10=0,n100=0,e10=0,e100=0,mis=0;for(let i=0;i<Rg.w*Rg.h;i++){if(Q.K[i]===3||Q.K[i]===255)continue;const o=i*4;let d10=0,d100=0,df=false;
     for(let ch=0;ch<3;ch++){const u=A1[o+ch]-A0[o+ch],v=B1[o+ch]-B0[o+ch];d10+=Math.abs(u);d100+=Math.abs(v);if(u!==v)df=true}if(d10)n10++;if(d100)n100++;e10+=d10;e100+=d100;if(df)mis++}
   return {px10:n10,px100:n100,ratio:e100?Math.round(e10/e100*1000)/1000:null,mismatch:mis,pool10:L.gm.drawn.pool}};
 window.__T={set,compare,reveal,lightCheck,changed,hash,cdraw,cstr};return true}"""
T = lambda pg, fn, *a: pg.evaluate('(a)=>window.__T.%s(...a)' % fn, list(a))
errors = []
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=DPR)
    ctx.add_init_script("window.__FILTER_SETS=0;{const fd=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'filter');if(fd&&fd.set)Object.defineProperty(CanvasRenderingContext2D.prototype,'filter',{get(){return fd.get.call(this)},set(v){window.__FILTER_SETS++;fd.set.call(this,v)},configurable:true})}")
    page = ctx.new_page(); reqs = []
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None); page.on('request', lambda r: reqs.append(r.url.rsplit('/', 1)[-1]))
    page.goto(URL); page.wait_for_function('PT.ST.ok.walk && PT.ST.ok.idle && PT.ST.ok.hold && PT.ST.ok.walkhold && PT.ST.ok.lantern && PT.FX.glow', timeout=15000); page.evaluate(HELPERS)
    st = page.evaluate("()=>({files:PT.ST.gmFiles,hang:PT.ST.lanHang,hold:PT.holdOn(),gm:PT.ST.gm,w:PT.ST.img.lantern.width,h:PT.ST.img.lantern.height,lw:PT.ST.img.lanternLight&&PT.ST.img.lanternLight.width})")
    ok('G1 ?gm opens with the real lantern: base + light + json, grip [16,6], hold on, 8-column sheets 256x32, Set-08 stand-in never requested',
       st['files'] == {'base': True, 'light': True, 'json': True} and st['hang'] == [16, 6] and st['hold'] and st['w'] == 256 and st['h'] == 32 and st['lw'] == 256 and 'kid-lantern.png' not in reqs, dict(st, kid_lantern_requested='kid-lantern.png' in reqs))
    cols = page.evaluate("""()=>{const r=[];for(const im of [PT.ST.img.lantern,PT.ST.img.lanternLight]){const c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');x.drawImage(im,0,0);const D=x.getImageData(0,0,256,32).data;
      let bad=0;for(let k=1;k<8;k++)for(let y=0;y<32;y++)for(let u=0;u<32;u++)for(let ch=0;ch<4;ch++)if(D[(y*256+k*32+u)*4+ch]!==D[(y*256+u)*4+ch])bad++;r.push(bad)}return r}""")
    col0 = page.evaluate("""()=>{const o=[];for(const im of [PT.ST.img.lantern,PT.ST.img.lanternLight]){const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(im,0,0,32,32,0,0,32,32);o.push(Array.from(x.getImageData(0,0,32,32).data))}return o}""")
    files = [np.array(Image.open(os.path.join(HERE, f)).convert('RGBA')).astype(int) for f in (BASE + '.png', BASE + '-light.png')]
    same0 = [int(((np.array(c).reshape(32, 32, 4)[..., 3] > 0) != (f[..., 3] > 0)).sum() + ((np.abs(np.array(c).reshape(32, 32, 4)[..., :3] - f[..., :3]).max(-1) > 0) & (f[..., 3] > 0)).sum()) for c, f in zip(col0, files)]
    ok('G2 the 8 columns of base and light = the S file pixels (column 1 vs file, columns 2-8 vs column 1)', cols == [0, 0] and same0 == [0, 0], {'columns_vs_col1': cols, 'col1_vs_file': same0})
    pw = {P_: [0, 0] for P_ in (100, 50, 10, 0)}
    for P_, rule in ((100, 'light'), (50, 'light'), (10, 0.35), (0, 'base')):
        for d in HOLD:
            for an, fi in (('idle', 0), ('walk', 2)):
                r = T(page, 'lightCheck', {'dir': d, 'anim': an, 'fi': fi, 'power': P_, 'fx': False, 'scene': 'light', 'clean': True}, rule); pw[P_][0] += r[0]; pw[P_][1] += r[1]
    ok('G3 light layer by power: 100/50 % = light colour, 10 % = 35 % glint, 0 % = dark glass (every light px, 7 dirs x idle/walk, +-2)', all(v[0] == 0 and v[1] > 0 for v in pw.values()), pw)
    glow = {}
    for d in HOLD:
        for sc in ('light', 'dark', 'cave'):
            for an, fi in (('idle', 0), ('walk', 2)):
                base = {'dir': d, 'scene': sc, 'anim': an, 'fi': fi, 'fx': True}
                g100 = T(page, 'compare', dict(base, power=100), dict(base, power=100), True); g50 = T(page, 'compare', dict(base, power=50), dict(base, power=50), True)
                c = T(page, 'compare', dict(base, power=100), dict(base, power=10)); c50 = T(page, 'compare', dict(base, power=50), dict(base, power=10)); c10 = T(page, 'compare', dict(base, power=10), dict(base, power=10), True); c0 = T(page, 'compare', dict(base, power=100), dict(base, power=0))   # G4c keeps its own 100-vs-0 comparison
                glow['%s %s %s' % (sc, d, an)] = {'glow100': {k: g100[k] for k in ('floor', 'body', 'lantern', 'light')}, 'glow50': {k: g50[k] for k in ('floor', 'body', 'lantern', 'light')},
                                                  'p50_ratio': round(c50['energy'] / c['energy'], 3) if c['energy'] else None, 'p10_floor': c10['floor'],
                                                  'p100_vs_0': {k: c0[k] for k in ('floor', 'body', 'lantern', 'light')}}
    R['glow'] = glow
    ok('G4 plan criterion 8: the Glow alone (same render with glow 0) changes 0 body / fist / face px, 0 lantern px, > 0 floor px (power 100 and 50 x 7 dirs x 3 scenes x idle/walk)',
       all(v[g]['body'] == 0 and v[g]['lantern'] == 0 and v[g]['light'] == 0 and v[g]['floor'] > 0 for v in glow.values() for g in ('glow100', 'glow50')),
       {'worst_body': max(v[g]['body'] for v in glow.values() for g in ('glow100', 'glow50')), 'worst_lantern': max(v[g]['lantern'] for v in glow.values() for g in ('glow100', 'glow50')),
        'min_floor': min(v[g]['floor'] for v in glow.values() for g in ('glow100', 'glow50'))})
    ok('G4b power 50 = about half the light around (floor energy 50/100 % in 0.35-0.65, baseline power 10 = C only) · power 10 = no glow (0 floor px)',
       all(v['p50_ratio'] is not None and 0.35 <= v['p50_ratio'] <= 0.65 and v['p10_floor'] == 0 for v in glow.values()),
       {'p50_ratio_min_max': [min(v['p50_ratio'] for v in glow.values()), max(v['p50_ratio'] for v in glow.values())], 'p10_floor_max': max(v['p10_floor'] for v in glow.values())})
    ok('G4c light / dark floor: power 100 vs 0 changes only floor + light px (0 body, 0 lantern metal)',
       all(v['p100_vs_0']['body'] == 0 and v['p100_vs_0']['lantern'] == 0 for k, v in glow.items() if not k.startswith('cave')),
       {k: v['p100_vs_0'] for k, v in list(glow.items()) if k.startswith('dark')} )
    rv = {}
    for d in HOLD:
        for an, fi, zoom, eoff in (('idle', 0, 1, None), ('walk', 2, 1, None), ('walk', 4, 0.75, None), ('idle', 1, 1, [2, -3]), ('walk', 1, 0.75, [-3, 2])):
            base = {'dir': d, 'scene': 'cave', 'anim': an, 'fi': fi, 'fx': True, 'zoom': zoom, 'eoff': eoff}
            k_ = '%s %s f%d z%s e%s' % (d, an, fi, zoom, eoff)
            rv['light ' + k_] = T(page, 'reveal', dict(base, power=100), dict(base, power=0))
            rv['C ' + k_] = T(page, 'reveal', dict(base, power=10), dict(base, power=10, fx=False))
    ok('G4d cave: the lantern light and C only uncover the body (every changed body px is at least as close to the true sprite colour) · never tint it (7 dirs x idle/walk x zoom 100/75 x eased offsets)',
       all(v[0] == 0 for v in rv.values()) and all(v[1] > 0 for v in rv.values()), {'bad_total': sum(v[0] for v in rv.values()), 'changed_body_px_min': min(v[1] for v in rv.values())})
    pool = {}
    for sc in ('dark', 'cave', 'light'):
        for d in HOLD:
            base = {'dir': d, 'scene': sc, 'power': 10}
            c = T(page, 'compare', dict(base, fx=True), dict(base, fx=False)); pool['%s %s' % (sc, d)] = {k: c[k] for k in ('floor', 'body', 'lantern', 'light', 'outCell')}
    ok('G5 C pool (fx on vs off at power 10): dark = behind the body (0 body / lantern px, > 0 floor px) · cave = only inside the player cell · light = no pool (0 px)',
       all((v['body'] == 0 and v['lantern'] == 0 and v['light'] == 0 and v['floor'] > 0) if k.startswith('dark') else (v['outCell'] == 0 and v['floor'] > 0) if k.startswith('cave') else sum(v.values()) == 0 for k, v in pool.items()), pool)
    rule = {}   # G5b (v2.2): direct flag assertions + 0 px where C must be off · dark floor and cave
    CASES = (('power 0', {'dir': 'S', 'power': 0, 'hold': True}, False), ('facing N', {'dir': 'N', 'power': 100, 'hold': True}, False),
             ('not holding', {'dir': 'S', 'power': 100, 'hold': False}, False), ('power 10', {'dir': 'S', 'power': 10, 'hold': True}, True),
             ('power 10 W walk', {'dir': 'W', 'power': 10, 'hold': True, 'anim': 'walk', 'fi': 3}, True), ('power 100 E', {'dir': 'E', 'power': 100, 'hold': True}, True))
    def flags(L): D = L['gm']['drawn']; return {'pool': D['pool'], 'glow': D['glow'], 'caveHole': D['caveHole']}
    for sc in ('dark', 'cave'):
        for lab, st, want in CASES:
            base = dict(st, scene=sc); F = flags(T(page, 'set', dict(base, fx=True))); nlight = sc == 'cave' and lab == 'facing N'   # v2.4: the N light (fx on only) is there on purpose
            if nlight: page.evaluate('PT.NHOLE.k=0')   # v2.4: same 0 px check as before with the N light switched off (k 0 = the old N) ...
            c = T(page, 'compare', dict(base, fx=True), dict(base, fx=False)) if not want else None
            if nlight: page.evaluate('PT.NHOLE.k=1')
            cd = T(page, 'cdraw', dict(base, fx=True)) if nlight else None   # ... + 0 C draw calls with the N light on (k 1)
            ok_ = F['pool'] == want and (c is None or sum(c[k] for k in ('floor', 'body', 'lantern', 'light', 'outCell')) == 0) and (cd is None or cd == [])
            if st['power'] == 10: ok_ = ok_ and F['glow'] is False and F['caveHole'] == 0       # power 10: C on, but no Glow and no cave lantern light
            rule['%s %s' % (sc, lab)] = dict(F, want_pool=want, px_fx_on_vs_off=(sum(c[k] for k in ('floor', 'body', 'lantern', 'light', 'outCell')) if c else None), c_draw_calls=(len(cd) if cd is not None else None), ok=ok_)
        F = flags(T(page, 'set', {'dir': 'S', 'power': 100, 'hold': True, 'scene': sc, 'fx': False})); rule['%s fx off' % sc] = dict(F, want_pool=False, ok=F['pool'] is False and F['glow'] is False)
    lp = ctx.new_page(); lp.route('**/%s-light.png' % BASE, lambda r: r.abort())   # light layer missing: no C (and no glow / cave light) at any power
    lp.goto(URL); lp.wait_for_function('PT.ST.ok.walkhold && PT.ST.ok.lantern && PT.FX.glow && PT.ST.last', timeout=15000); lp.evaluate(HELPERS)
    for sc in ('dark', 'cave'):
        for pw in (100, 10):
            F = flags(T(lp, 'set', {'dir': 'S', 'power': pw, 'hold': True, 'scene': sc, 'fx': True}))
            rule['%s light file missing power %d' % (sc, pw)] = dict(F, want_pool=False, ok=F['pool'] is False and F['glow'] is False and F['caveHole'] == 0)
    lp.close()
    ok('G5b rule (owner choice 26 Oct, v2.2 flags · v2.4 cave N: 0 px with k 0 + 0 C draw calls with k 1): C only with Glow+C on + held lantern + light layer + power > 0 + not N · pool=false (and 0 px) at power 0 / facing N / not holding / Glow+C off / light file missing · power 10: pool=true, glow=false, caveHole=0 · dark floor + cave',
       all(v['ok'] for v in rule.values()), rule)
    cs = {}   # G18 (v2.3): V0 = full C at power 10 · a) the C draw call itself at the real power 10 / 50 / 100 · b) the C pixels on screen
    for sc in ('dark', 'cave'):
        for d in HOLD:
            for an, fi in (('idle', 0), ('walk', 3)):
                st = {'dir': d, 'scene': sc, 'anim': an, 'fi': fi, 'hold': True, 'fx': True}
                calls = {pw: T(page, 'cdraw', dict(st, power=pw)) for pw in (10, 50, 100)}
                px = T(page, 'cstr', st)
                cs['%s %s %s' % (sc, d, an)] = dict(px, calls10=calls[10], same_call_as_50_100=calls[10] == calls[50] == calls[100],
                                                    ok=len(calls[10]) == 1 and calls[10] == calls[50] == calls[100] and calls[10][0][1] == 1
                                                    and px['pool10'] is True and px['px10'] > 0 and px['mismatch'] == 0 and px['ratio'] is not None and 0.98 <= px['ratio'] <= 1.02)
    ok('G18 V0: C at power 10 = the full C · a) one C draw per frame, same image / alpha 1 / blend / layer / place as at power 50 and 100 · b) C alone at 10 = C alone at 100 with Glow / cave light forced 0 (0 px differ outside the glass, ratio 1.00 +- 0.02) · dark floor + cave · 7 dirs x idle/walk',
       all(v['ok'] for v in cs.values()),
       {'cases': len(cs), 'bad': [k for k, v in cs.items() if not v['ok']], 'ratio_min_max': [min(v['ratio'] or 0 for v in cs.values()), max(v['ratio'] or 0 for v in cs.values())], 'mismatch_max': max(v['mismatch'] for v in cs.values()),
        'alpha10': sorted(set(c[1] for v in cs.values() for c in v['calls10'])), 'calls10_per_frame': sorted(set(len(v['calls10']) for v in cs.values())), 'px10_min': min(v['px10'] for v in cs.values()), 'by_case': cs})
    em = {}
    for d in HOLD:
        for an, fi, zoom, eoff in (('idle', 0, 1, None), ('walk', 2, 1, None), ('walk', 4, 0.75, None), ('idle', 1, 1, [2, -3]), ('walk', 1, 0.75, [-3, 2])):
            em['%s %s f%d z%s e%s' % (d, an, fi, zoom, eoff)] = T(page, 'lightCheck', {'dir': d, 'anim': an, 'fi': fi, 'zoom': zoom, 'eoff': eoff, 'power': 100, 'fx': True, 'scene': 'cave'}, 'light')
    ok('G6 cave: light px are not darkened (power 100 = light colour · 7 dirs x idle/walk x zoom 100/75 x eased offsets)', all(v[0] == 0 and v[1] > 0 for v in em.values()),
       {'bad': sum(v[0] for v in em.values()), 'light_px_min': min(v[1] for v in em.values()), 'cases': len(em)})
    uniq, uniq_cave, uniq_rev = {}, {}, {}
    for zoom in (1, 0.75):
        for sc in ('light', 'dark', 'cave'):
            for P_ in (100, 50, 10, 0):
                for d in HOLD:
                    u, ub = T(page, 'changed', {'dir': d, 'power': P_, 'fx': True, 'scene': sc, 'zoom': zoom}, sc == 'cave')
                    for c_ in u: (uniq if sc != 'cave' else uniq_cave)[c_] = 1
                    for c_ in ub: uniq_rev[c_] = 1
    rgb = lambda c_: ((c_ >> 16) & 255, (c_ >> 8) & 255, c_ & 255)
    def near_of(U): return {k: sorted({rgb(c_) for c_ in U if de00(rgb(c_), v) < 10}) for k, v in SIGNAL.items()}
    def closest(U, k): return round(min(de00(rgb(c_), SIGNAL[k]) for c_ in U), 2) if U else None
    nr, nc = near_of(uniq), near_of(uniq_cave)
    ok('G7 plan criterion 5 (light / dark floor, as worded): every on-screen colour the lantern, light or glow changes has dE00 >= 10 from #FFC857 and #5FE0FF (power 100/50/10/0 x 7 dirs x zoom 100/75)',
       all(not v for v in nr.values()), {'colours': len(uniq), 'near': {k: ['#%02X%02X%02X' % c_ for c_ in v[:5]] for k, v in nr.items()}, 'closest_gold': closest(uniq, 'gold #FFC857'), 'closest_cyan': closest(uniq, 'cyan #5FE0FF')})
    ok('G7b cave (extra): the same, except body px that the light only uncovers (the locked sprite colours, G4d)',
       all(not v for v in nc.values()), {'colours': len(uniq_cave), 'near': {k: ['#%02X%02X%02X' % c_ for c_ in v[:5]] for k, v in nc.items()}, 'closest_gold': closest(uniq_cave, 'gold #FFC857'),
                                         'uncovered_body_closest_gold_info': closest(uniq_rev, 'gold #FFC857'), 'sprite_cream_F9DA99_vs_gold_info': round(de00((0xF9, 0xDA, 0x99), SIGNAL['gold #FFC857']), 2)})
    nn = {}
    for sc in ('dark', 'cave'):
        L = T(page, 'set', {'dir': 'N', 'power': 100, 'fx': True, 'scene': sc}); nn[sc] = [L['lantern'], L['gm']['drawn']['glow'], L['gm']['drawn']['caveHole'], L['gm']['drawn']['pool']]
    turn = page.evaluate("""()=>{const P=PT,S=P.ST,o={};for(const [sc,pw] of [['cave',100],['dark',100],['cave',10],['dark',10]]){const k=sc+' '+pw;o[k]=[];for(const [a,c] of [['NE','N'],['N','NE'],['NW','N'],['N','NW']]){P.pause(true);P.set({dir:a,anim:'walk',fi:0,hold:true,power:pw,fx:true,scene:sc,lpos:null,ldir:null,clean:false});P.draw();
       for(let i=0;i<10;i++){P.step(16);P.draw()}S.dir=c;P.step(16);P.draw();o[k].push([!!S.last.lantern,S.last.gm.drawn.glow,S.last.gm.drawn.caveHole>0,S.last.gm.drawn.pool])}}return o}""")   # v2.3: + C, dark floor, power 10
    F_, T_ = False, True; TW = {'cave 100': [T_, T_, T_, T_], 'dark 100': [T_, T_, F_, T_], 'cave 10': [T_, F_, F_, T_], 'dark 10': [T_, F_, F_, T_]}   # first frame after turning away from N
    TN = {k: [F_, F_, k == 'cave 100', F_] for k in TW}   # v2.4 (O13 A): at N only the cave N light (cave + power 100/50), never lantern / glow / C
    NN = {'dark': [None, False, 0, False], 'cave': [None, False, 1, False]}
    ok('G8 N (v2.4 O13 A): no lantern, no glow, no C · cave light at N = 1 in the cave at power 100, 0 at power 10 and on the dark floor (N light; power 50 in test_g2_north_light.py) · turning N <-> NE/NW switches them (and C) on the same frame · cave + dark floor · power 100 + 10',
       nn == NN and turn == {k: [TN[k], w, TN[k], w] for k, w in TW.items()}, {'N': nn, 'turn': turn})
    fs = page.evaluate("""()=>{const P=PT;for(const sc of ['light','dark','cave'])for(const pw of [100,50,10,0]){P.set({scene:sc,power:pw,fx:true,hold:true,clean:false});for(let i=0;i<20;i++){P.step(16);P.draw()}}return window.__FILTER_SETS}""")
    ok('G9 ctx.filter set 0 times while drawing', fs == 0, fs)
    page.evaluate("()=>{PT.set({power:100,fx:true,scene:'light',zoom:1});PT.pause(false)}")
    seq = []
    for _ in range(4): page.click('#bPow'); seq.append(page.evaluate('PT.ST.power'))
    fx = []
    for _ in range(2): page.click('#bFx'); fx.append(page.evaluate('PT.ST.fx'))
    sc = []
    for _ in range(3): page.click('#bBg'); sc.append(page.evaluate('PT.ST.scene'))
    zm = []
    for _ in range(2): page.click('#bZoom'); zm.append(page.evaluate('PT.ST.zoom'))
    vis = page.evaluate("()=>['bPow','bFx'].map(i=>getComputedStyle(document.getElementById(i)).display!=='none')")
    ok('G10 GM buttons: power 50/10/0/100 · Glow+C off/on · floor dark/cave/light · zoom 75/100 % (fixed) · power and Glow+C buttons shown',
       seq == [50, 10, 0, 100] and fx == [False, True] and sc == ['dark', 'cave', 'light'] and zm == [0.75, 1] and vis == [True, True], {'power': seq, 'fx': fx, 'scene': sc, 'zoom': zm, 'visible': vis})
    cdp = ctx.new_cdp_session(page); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4}); vals = {False: [], True: []}
    for rnd in range(5):
        for h in ((False, True) if rnd % 2 == 0 else (True, False)):
            page.evaluate("(h)=>{PT.set({hold:h,power:100,fx:true,scene:'cave',clean:false,lpos:null,ldir:null,pos:{x:160,y:120},zoom:1});PT.pause(false);PT.walk('SE')}", h); page.wait_for_timeout(300)
            vals[h].append(page.evaluate("()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})"))
            page.evaluate('PT.stop()')
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    med = lambda v: sorted(v)[len(v) // 2]; R['fps'] = {'off': [round(v, 1) for v in vals[False]], 'on': [round(v, 1) for v in vals[True]], 'median': [round(med(vals[False]), 1), round(med(vals[True]), 1)]}
    cost = page.evaluate("""()=>{const P=PT;const run=(h)=>{P.pause(true);P.set({hold:h,power:100,fx:true,scene:'cave',dir:'SE',anim:'walk',fi:0,clean:false,lpos:null,ldir:null});for(let i=0;i<60;i++){P.step(16);P.draw()}
       const g=document.getElementById('cv').getContext('2d');g.getImageData(0,0,1,1);const t0=performance.now();for(let i=0;i<300;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);return (performance.now()-t0)/300};const r=[];for(let k=0;k<7;k++)r.push([run(false),run(true)]);return r}""")
    R['draw_ms'] = {'off_median7': round(med([c[0] for c in cost]), 3), 'on_median7': round(med([c[1] for c in cost]), 3)}
    scene_ms = page.evaluate("""()=>{const P=PT;const run=(sc)=>{P.pause(true);P.set({hold:true,power:100,fx:true,scene:sc,dir:'SE',anim:'walk',fi:0,clean:false,lpos:null,ldir:null});for(let i=0;i<60;i++){P.step(16);P.draw()}
       const g=document.getElementById('cv').getContext('2d');g.getImageData(0,0,1,1);const t0=performance.now();for(let i=0;i<300;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);return (performance.now()-t0)/300};const r={light:[],dark:[],cave:[]};for(let k=0;k<5;k++)for(const sc of ['light','dark','cave'])r[sc].push(run(sc));return r}""")
    R['scene_draw_ms_median5_cpu1x'] = {k: round(med(v), 3) for k, v in scene_ms.items()}
    ok('G11 FPS with the lantern (light + Glow + cave light) >= 90 % of the same cave scene without it (C and the cave on in both · rAF, 4x CPU, walking, median of 5) · draw ms per scene reported',
       med(vals[True]) >= 0.9 * med(vals[False]), dict(R['fps'], draw_ms_cave_on_off_cpu1x=R['draw_ms'], scene_draw_ms_cpu1x=R['scene_draw_ms_median5_cpu1x']))
    page.evaluate("()=>PT.pause(true)")
    for zoom, zk in ((1, '100'), (0.75, '75')):
        for scn in ('light', 'dark', 'cave'):
            for P_ in (100, 0):
                T(page, 'set', {'dir': 'SE', 'power': P_, 'fx': True, 'scene': scn, 'zoom': zoom}); page.screenshot(path=os.path.join(OUT, 'gm-844-z%s-%s-p%d.png' % (zk, scn, P_)))
    page.evaluate("()=>{PT.set({scene:'cave',power:100,fx:true,zoom:1,hold:true,clean:false,pos:{x:160,y:120}});PT.pause(false);PT.walk('SW')}"); page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, 'gm-844-cave-walk.png')); page.evaluate('PT.stop()')
    ctx2 = b.new_context(viewport={'width': 1180, 'height': 820}, device_scale_factor=2); pg2 = ctx2.new_page(); e2 = []
    pg2.on('pageerror', lambda e: e2.append(str(e))); pg2.on('console', lambda m: e2.append(m.text) if m.type == 'error' else None)
    pg2.goto(URL + '&scene=cave'); pg2.wait_for_function('PT.ST.ok.lantern && PT.ST.ok.walkhold && PT.FX.glow', timeout=15000)
    pg2.evaluate("()=>PT.walk('SE')"); pg2.wait_for_timeout(900); pg2.screenshot(path=os.path.join(OUT, 'gm-1180-cave-walk.png'))
    pg2.evaluate("()=>{PT.stop();PT.set({scene:'light'})}"); pg2.wait_for_timeout(300); pg2.screenshot(path=os.path.join(OUT, 'gm-1180-light.png'))
    ok('G12 iPad 1180x820 GM page: 0 errors, lantern drawn', not e2 and pg2.evaluate('!!PT.ST.last.lantern'), e2[:3])
    ctx2.close()
    fb = {}
    for name, pats in (('base_png', ['**/%s.png' % BASE]), ('json', ['**/%s.json' % BASE]), ('base_json', ['**/%s.png' % BASE, '**/%s.json' % BASE]), ('hold_json', ['**/c2-pilot-hold-anchors.json']), ('walkhold_png', ['**/c2-pilot-kid4-walkhold.png']),
                       ('light_png', ['**/%s-light.png' % BASE]), ('cave_floor', ['**/cave-floor.jpg']),
                       ('all_lantern', ['**/%s.png' % BASE, '**/%s-light.png' % BASE, '**/%s.json' % BASE])):
        pg = ctx.new_page(); errs = []; cons = []; rq = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: cons.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('request', lambda r: rq.append(r.url.rsplit('/', 1)[-1]))
        for pat in pats: pg.route(pat, lambda r: r.abort())
        pg.goto(URL + '&scene=cave'); pg.wait_for_timeout(1500)
        pg.evaluate("()=>PT.walk('E')"); pg.wait_for_timeout(600); shot = os.path.join(OUT, 'gm-fallback-%s.png' % name); pg.screenshot(path=shot)
        L = pg.evaluate("()=>{const L=PT.ST.last;return {lantern:!!L.lantern,sheet:L.sheet,gm:L.gm}}")
        ncol = pg.evaluate("()=>{const c=document.getElementById('cv'),D=c.getContext('2d').getImageData(0,0,c.width,c.height).data,u=new Set();for(let i=0;i<D.length;i+=4*7)u.add((D[i]<<16)|(D[i+1]<<8)|D[i+2]);return u.size}")
        im = np.array(Image.open(shot).convert('RGB')); white = float((im.min(-1) > 250).mean())
        pools = pg.evaluate("()=>{const o={};for(const sc of ['cave','dark'])for(const pw of [100,10]){PT.set({scene:sc,power:pw});PT.draw();o[sc+' '+pw]=PT.ST.last.gm.drawn.pool}return o}")   # v2.3: C at power 100 / 10, cave + dark floor (after the canvas checks)
        fb[name] = {'errors': len(errs) + len(cons), 'white': round(white, 3), 'canvas_colours': ncol, 'lantern': L['lantern'], 'walk_sheet': L['sheet'], 'glow': L['gm']['drawn']['glow'], 'cave_light': L['gm']['drawn']['caveHole'],
                    'light': L['gm']['drawn']['light'], 'pool': L['gm']['drawn']['pool'], 'pools': pools, 'kid_lantern_requested': 'kid-lantern.png' in rq}
        pg.close()
    want = {'base_png': (False, 'walk'), 'json': (False, 'walk'), 'base_json': (False, 'walk'), 'hold_json': (False, 'walk'), 'walkhold_png': (False, 'walk'), 'all_lantern': (False, 'walk'), 'light_png': (True, 'walkhold'), 'cave_floor': (True, 'walkhold')}
    ok('G13 missing files: base / json / both / hold anchors / walk-hold sheet -> no lantern (old walk sheet, never Set 08) and no C · light -> lantern without light, glow, cave light or C · C off at power 100 and 10 on cave and dark floor · cave floor -> still drawn, C on (control) · 0 errors, the canvas really drew (>= 50 colours, a sprite sheet)',
       all(v['errors'] == 0 and v['white'] < 0.5 and v['canvas_colours'] >= 50 and v['walk_sheet'] and not v['kid_lantern_requested'] and (v['lantern'], v['walk_sheet']) == want[k] for k, v in fb.items())
       and fb['light_png']['glow'] is False and fb['light_png']['cave_light'] == 0 and fb['light_png']['light'] == 0 and fb['light_png']['pool'] is False and fb['cave_floor']['glow'] is True
       and all(fb[k]['pool'] is False and not any(fb[k]['pools'].values()) for k in ('base_png', 'json', 'base_json', 'hold_json', 'walkhold_png', 'all_lantern', 'light_png'))
       and fb['cave_floor']['pool'] is True and all(fb['cave_floor']['pools'].values()), fb)   # v2.3
    far = {}
    for pos in ([600, 120], [160, 400], [160, -90], [-200, 500], [900, 700]):
        for d in ('SE', 'W'):
            base = {'dir': d, 'scene': 'cave', 'pos': {'x': pos[0], 'y': pos[1]}}
            c = T(page, 'compare', dict(base, power=100, fx=True), dict(base, power=0, fx=True)); cp = T(page, 'compare', dict(base, power=10, fx=True), dict(base, power=10, fx=False))
            far['%s %s' % (pos, d)] = [c['floor'], cp['floor'] + cp['body']]
    ok('G16 cave far from the start (5 places x 2 dirs): the lantern light and C still open the darkness (> 0 px changed)', all(v[0] > 0 and v[1] > 0 for v in far.values()), far)
    c3 = page.evaluate("""()=>{const P=PT,S=P.ST,o={};const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(S.img.lantern,0,0,32,32,0,0,32,32);const D=x.getImageData(0,0,32,32).data;
      let bot=0;for(let i=0;i<1024;i++)if(D[i*4+3])bot=Math.max(bot,Math.floor(i/32));
      for(const d of ['S','SE','E','NE','NW','W','SW'])for(const stp of [true,false]){P.pause(true);P.set({dir:d,anim:'idle',fi:0,t:0,hold:true,ease:true,easeStep:stp,lpos:null,ldir:null,lhist:null,moving:false,pos:{x:160,y:200},power:100,fx:true,scene:'cave',clean:false});P.draw();
        let worst=0;const run=(ms)=>{for(let e=0;e<ms;e+=16){P.step(16);P.draw();const L=S.last.lantern;if(L)worst=Math.max(worst,L.drawn[1]-S.lanHang[1]+bot)}};
        run(400);for(let k=0;k<6;k++){P.walk(d);run(1200+k*100+48);P.stop();run(800)}o[d+(stp?' step':' smooth')]=worst}return {bot,worst:o}}""")
    ok('G17 plan criterion 3: lantern bottom at the DRAWN position <= row 92 (walk / stop on each of 6 frames / start · 7 dirs · step and smooth ease)', all(v <= 92 for v in c3['worst'].values()), c3)
    ok('G14 page errors 0 (GM page)', not errors, errors[:3])
    if OLD:
        STATES = [{'dir': d, 'anim': an, 'fi': fi, 'hold': h, 'dark': dk, 'zoom': z} for d in DIRS for an, fi in (('idle', 0), ('walk', 2)) for h in (True, False) for dk in (False, True) for z in (1, 0.75)]
        res = {}
        for port in (OLD, PORT):
            pg = ctx.new_page(); pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html' % port); pg.wait_for_function('PT.ST.ok.walk && PT.ST.ok.idle && PT.ST.ok.hold && PT.ST.ok.lantern && PT.ST.ok.walkhold', timeout=15000)
            pg.evaluate(HELPERS); res[port] = [T(pg, 'hash', s_) for s_ in STATES]; pg.close()
        same = sum(a == c for a, c in zip(res[OLD], res[PORT]))
        ok('G15 without ?gm: same canvas pixels as the Pilot before this change (%d states: 8 dirs x idle/walk x hold on/off x light/dark x zoom 100/75)' % len(STATES), same == len(STATES), '%d/%d' % (same, len(STATES)))
    b.close()
R['checks'] = CHECK
json.dump(R, open(os.path.join(OUT, 'gm-lantern-test.json'), 'w'), indent=1, ensure_ascii=False)
for c in CHECK: print(('PASS ' if c['pass'] else 'FAIL ') + c['check'] + ' :: ' + json.dumps(c['value'], ensure_ascii=False)[:400])
print('TOTAL %d/%d PASS' % (sum(c['pass'] for c in CHECK), len(CHECK)))
sys.exit(0 if CHECK and all(c['pass'] for c in CHECK) else 1)   # v2.2: exit 1 when any check fails (v2.3: 25 checks with OLD_PORT · v2.4: same 25, G8 / G5b N rule for O13 A)
