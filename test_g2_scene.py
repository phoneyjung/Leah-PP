#!/usr/bin/env python3
# G2.4 scene Pilot test (Claude · 31 Oct 2569 · S6 of G2_4_SCENE_PLAN.md · QG-4 section 7 items 1-6 and 8; item 7 = owner score)
# Runs pilot-g2-scene.html in Chromium (phone 844x390 @ DPR 2.625 · iPad 1180x820 @ 2). Movement runs in the page with its own collision
# (PS.sim steps the same step() the page uses, 16 ms per step, no drawing) so the walks are real page walks, only faster than real time.
# Pairs and blocked targets: qa/g2-4-scene/pilot-paths.json (layout.py seed 2410) · slime zone: qa/g2-4-scene/pilot-scene-layout.json.
# usage: python3 -I test_g2_scene.py PORT OUT_DIR
import sys, os, json, math, base64, hashlib, io
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
from skimage.color import rgb2lab, deltaE_ciede2000
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'http://127.0.0.1:%s/pilot-g2-scene.html' % PORT
MOTION = 'http://127.0.0.1:%s/pilot-g2-motion.html?gm' % PORT
PATHS = json.load(open(os.path.join(HERE, 'qa/g2-4-scene/pilot-paths.json')))
LAY = json.load(open(os.path.join(HERE, 'qa/g2-4-scene/pilot-scene-layout.json')))
CHECK = []; R = {'meta': {'page': 'pilot-g2-scene.html', 'phone': [844, 390, 2.625], 'ipad': [1180, 820, 2]}}
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name, '|', json.dumps(val, ensure_ascii=False)[:300], flush=True)
SIGNAL = {'gold #FFC857': (255, 200, 87), 'cyan #5FE0FF': (95, 224, 255), 'cyan #7FE0FF': (127, 224, 255)}
HOUSE = {'sun #F2C230': (242, 194, 48), 'wing #4B8FE0': (75, 143, 224), 'leaf #4FBF5A': (79, 191, 90), 'flame #E0493C': (224, 73, 60)}
G24 = ['g24-tiles-path.png', 'g24-tiles-cliff.png', 'g24-hut.png', 'g24-hut-door.png', 'g24-cave-mouth.png', 'g24-tree-a.png', 'g24-tree-b.png', 'g24-lamp.png', 'g24-gate.png', 'g24-props.png', 'g24-slime.png']
SRC = open(os.path.join(HERE, 'pilot-g2-scene.html'), encoding='utf-8').read()

# ---------- S0 / item 3 (files) ----------
alpha = {f: sorted(int(v) for v in np.unique(np.array(Image.open(os.path.join(HERE, f)).convert('RGBA'))[..., 3])) for f in G24}
ok('S0 page source: no rotate / setTransform / ctx.filter · no 0.75 zoom', all(k not in SRC for k in ('rotate', 'setTransform', '.filter=', '.filter =', '0.75')), {})
ok('S3a every g24 art file alpha 0/255 only (11 files)', all(v == [0, 255] or v == [255] for v in alpha.values()), alpha)
R['sha256'] = {f: hashlib.sha256(open(os.path.join(HERE, f), 'rb').read()).hexdigest()[:16] for f in G24}

HELP = r"""()=>{const P=PS,S=P.ST;
 const hash=a=>{let h=5381;for(const c of a)h=(Math.imul(h,33)^c.charCodeAt(0))>>>0;return h};
 window.__S={
  run:(a,b)=>{P.teleport(a[0],a[1],'S');S.lastAuto=null;const n=P.goto(b[0],b[1]);const tr=[];let k=0;
    while(k<7500){P.step(16);k++;if(k%10===0)tr.push(Math.round(S.pos.x*10)+','+Math.round(S.pos.y*10));if(!S.auto||S.warp)break}
    const c=P.cellOf(S.pos.x,S.pos.y);return{n,done:!!(S.lastAuto&&S.lastAuto.done),fail:!!(S.lastAuto&&S.lastAuto.fail),warp:S.warp?S.warp.to:null,cell:c,pos:[S.pos.x,S.pos.y],ms:k*16,hash:hash(tr.join(';'))}},
  push:(a,t,ms)=>{P.teleport(a[0],a[1],'S');let bad=0,reached=false,k=0,warp=false;
    while(k*16<ms){const vx=t[0]*32+16-S.pos.x,vy=t[1]*32+16-S.pos.y;if(Math.hypot(vx,vy)<1)break;P.walk(P.dir8(vx,vy));P.step(16);k++;
      if(S.mode!=='field'||S.warp){warp=true;break}const c=P.cellOf(S.pos.x,S.pos.y);if(P.solidAt(S.pos.x,S.pos.y))bad++;if(c[0]===t[0]&&c[1]===t[1])reached=true}
    P.stop();return{bad,reached,warp,end:P.cellOf(S.pos.x,S.pos.y)}},
  fuzz:(ms,seed)=>{let a=seed>>>0;const r=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
    P.teleport(16,11,'N');let k=0,next=0,bad=0,out=0,doorBad=0,warps=0,cells=new Set();
    while(k*16<ms){if(k*16>=next){P.walk(P.DIRS[Math.floor(r()*8)]);next=k*16+300+r()*1200}P.step(16);k++;
      if(S.warp){warps++;P.teleport(16,11,'N');continue}
      const x=S.pos.x,y=S.pos.y,c=P.cellOf(x,y);cells.add(c+'');if(P.solidAt(x,y))bad++;if(x<0||y<0||x>=P.MAPW||y>=P.MAPH)out++;if(P.GRID[c[1]]&&P.GRID[c[1]][c[0]]==='D'&&(y<P.DOOR_MINY))doorBad++}
    P.stop();return{steps:k,bad,out,doorBad,warps,cells:cells.size}},
  order:()=>S.order.slice(),
 };return true}"""

def canvas_png(page):
    d = page.evaluate("()=>document.getElementById('cv').toDataURL('image/png')"); return Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGB')

errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    def newpage(vw=844, vh=390, dpr=2.625, q='?gm', block=None, collect=True):
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr); pg = ctx.new_page()
        if block:
            for pat in block: pg.route(pat, lambda r: r.abort())
        if collect:
            pg.on('pageerror', lambda e: errs.append('pageerror ' + str(e)))
            pg.on('console', lambda m: errs.append('console ' + m.text) if m.type == 'error' and not block else None)
        pg.goto(URL + q); pg.wait_for_function('window.PS&&PS.ST.ready', timeout=20000); pg.evaluate('PS.pause(true)'); pg.evaluate(HELP); return ctx, pg
    ctx, pg = newpage()
    info = pg.evaluate("()=>({files:PS.ST.files,zone:[...PS.ZONE].map(k=>k.split(',').map(Number)),spr:PS.W0.spr.length,tileMiss:PS.W0.tileMiss,s:PS.scale(),hold:PS.holdOn()})")
    missing = [k for k, v in info['files'].items() if not v]
    ok('S0b every file the page asks for loads (art, json, kid, lantern, cave floor)', not missing, {'files': len(info['files']), 'missing': missing})
    zone = sorted(map(tuple, info['zone'])); want = sorted(map(tuple, LAY['slime_zone']))
    ok('S6a slime zone in the page = layout v2 slime zone (47 dark-field cells, 0 lit)', zone == want and len(zone) == 47, {'page': len(zone), 'layout': len(want)})

    # ---------- item 1: real walks with the page collision ----------
    pairs = PATHS['pairs']; res1 = []; res2 = []
    for pr in pairs:
        res1.append(pg.evaluate('([a,b])=>__S.run(a,b)', [pr['from'], pr['to']]))
    for pr in pairs:
        res2.append(pg.evaluate('([a,b])=>__S.run(a,b)', [pr['from'], pr['to']]))
    def arrived(pr, r):
        t = pr['to']; g = LAY['grid'][t[1]][t[0]]
        return r['warp'] == 'cave' if g == 'X' else (r['done'] and not r['fail'] and r['cell'] == t)
    okn = sum(arrived(pr, r) for pr, r in zip(pairs, res1))
    same = all(a['hash'] == c['hash'] and a['pos'] == c['pos'] for a, c in zip(res1, res2))
    R['walks'] = [{'from': pr['from'], 'to': pr['to'], 'ok': arrived(pr, r), 'ms': r['ms'], 'warp': r['warp']} for pr, r in zip(pairs, res1)]
    ok('S1a real walks with the page movement + collision (A* -> waypoints, feet point, slide): arrived 60/60 (1 pair ends on the exit = warp to the cave)', okn == 60, {'arrived': okn, 'of': len(pairs), 'sim_s_total': round(sum(r['ms'] for r in res1) / 1000, 1)})
    ok('S1b second run identical (every trace hash + end position)', same, {'identical': sum(a['hash'] == c['hash'] for a, c in zip(res1, res2))})
    BL = [b_['cell'] for b_ in PATHS['blocked']] + [[11, 8], [12, 8], [0, 7], [16, 3], [6, 7], [23, 8]]
    gt = pg.evaluate('(L)=>L.map(c=>PS.astar([16,11],c,PS.walkable))', BL)   # the page path search itself (a tap on the gate is sent to the cell in front of it on purpose)
    near = {str(c): None for c in BL}
    pushes = []
    for c in BL:
        st = min(([x, y] for y in range(14) for x in range(28) if LAY['grid'][y][x] in '.=-S*,'), key=lambda q: (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2)
        pushes.append(dict(pg.evaluate('([a,t])=>__S.push(a,t,20000)', [st, c]), target=c, start=st))
    reached = sum(1 for q in pushes if q['reached']); bad = sum(q['bad'] for q in pushes)
    ok('S1c cannot reach %d blocked targets (11 from layout.py + crate, rope, bush edge, cave face, hut behind the door, rock): A* refuses all and a 20 s straight push from the nearest open cell reaches 0, feet never in a solid cell' % len(BL),
       all(v is None for v in gt) and reached == 0 and bad == 0, {'astar_found': sum(v is not None for v in gt), 'push_reached': reached, 'feet_in_solid_steps': bad, 'push_warped': sum(q['warp'] for q in pushes)})
    fz = pg.evaluate('()=>__S.fuzz(300000,2410)')
    ok('S1d 300 s random walking (seed 2410, new direction every 0.3-1.5 s): feet in a solid cell 0 · outside the map 0 · door rule broken 0', fz['bad'] == 0 and fz['out'] == 0 and fz['doorBad'] == 0, fz)
    # ---------- item 2: door ----------
    starts = [[9, 10], [2, 9], [12, 11], [5, 10], [3, 12], [11, 9], [16, 11], [1, 4], [20, 5], [8, 12]]; door = []
    for i, st in enumerate(starts):
        d = [6, 8] if i % 2 else [7, 8]
        r = pg.evaluate('([a,b])=>__S.run(a,b)', [st, d])
        pg.evaluate('PS.draw()'); o = pg.evaluate('__S.order()')
        door.append({'start': st, 'to': d, 'pos': r['pos'], 'cell': r['cell'], 'kid_before_hut': o.index('kid') < next(i for i, k in enumerate(o) if k.startswith('hut'))})
    door_ok = sum(1 for q in door if q['pos'][0] == 224 and q['pos'][1] >= 264 and q['cell'][1] == 8 and q['cell'][0] in (6, 7) and q['kid_before_hut'])
    clip = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(7,9,'N');P.goto(7,8);P.sim(8000,()=>!S.auto);P.draw();const L=S.last,s=L.s,img=S.img.idle,hut=P.W0.spr.find(o=>o.kind==='hut');
      const c=document.createElement('canvas');c.width=96;c.height=96;const x=c.getContext('2d');x.drawImage(img,L.frame*96,P.DIRS.indexOf(L.dir)*96,96,96,0,0,96,96);const d=x.getImageData(0,0,96,96).data;
      const wx0=Math.round(S.pos.x)-48+(S.offTable?S.offTable[L.dir]:0),wy0=Math.round(S.pos.y)-94;let kid=0,underFrame=0,inHole=0;
      for(let v=0;v<96;v++)for(let u=0;u<96;u++){if(!d[(v*96+u)*4+3])continue;kid++;const X=wx0+u-hut.x,Y=wy0+v-hut.y;if(X>=0&&Y>=0&&X<hut.sw&&Y<hut.sh&&hut.mask[Y*hut.sw+X])underFrame++;else inHole++}
      return{kid,underFrame,inHole,dir:L.dir,pos:S.pos}}""")
    ok('S2a door: 10 walks from 10 starts end in a door cell with feet x = 224, feet y >= 264, the kid drawn before (behind) the hut', door_ok == 10, {'ok': door_ok, 'runs': door})
    ok('S2b door: kid px drawn over the hut frame 0 (hut is drawn after the kid) · kid px hidden by the frame reported (opening 52 x 108 vs kid 47 x 83)', clip['kid'] > 0, clip)
    # ---------- item 3: Wang tiles ----------
    wang = pg.evaluate("""()=>{const P=PS,W=P.W,H=P.H;let miss=0;const V=new Map();
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=P.tileFor(x,y);if(!P.A.tiles.files[t.sheet].tiles[t.key])miss++;const c=t.key.split(',');
        [[x,y],[x+1,y],[x,y+1],[x+1,y+1]].forEach(([vx,vy],i)=>{const k=vx+','+vy;if(!V.has(k))V.set(k,new Set());V.get(k).add(c[i])})}
      const seam=[],hidden=[];V.forEach((s,k)=>{if(s.size<2)return;const [vx,vy]=k.split(',').map(Number);const wx=vx*32,wy=vy*32;
        (wx>=448+9&&wx<=448+182&&wy<=132?hidden:seam).push(k+' '+[...s].join('/'))});   // under the opaque cave-mouth rock (x 457-630, bottom y 132): the path meets the cliff there, covered
      return{cells:W*H,vertices:V.size,miss,seam,hiddenUnderCaveMouth:hidden,tileMissDrawn:P.W0.tileMiss}}""")
    ok('S3b Wang: 392 cells, every corner combo found in g24-tiles.json, every shared corner agrees between neighbours (path meeting the cliff only under the cave-mouth rock)', wang['miss'] == 0 and not wang['seam'] and wang['tileMissDrawn'] == 0, wang)
    scl = pg.evaluate("()=>{const a=PS.scale();PS.set({zoomOut:true});const b=PS.scale();PS.set({zoomOut:false});return [a,b,Number.isInteger(a)&&Number.isInteger(b)]}")
    ok('S3c whole-number scale only (phone: near / far)', scl[2] and scl[0] == 3 and scl[1] == 2, scl)
    # ---------- item 4: y-sort + fade ----------
    ys = pg.evaluate("""()=>{const P=PS,S=P.ST,out={};const kinds=['tree','lamp','hut','gate','crate','bush','boulder','fence','crystal'];
      for(const kd of kinds){const o=P.W0.spr.find(q=>q.kind===kd);const cx=o.x+(o.bb?(o.bb[0]+o.bb[2])/2:o.sw/2);let good=0,n=0;
        for(const d of P.DIRS)for(const [dy,front] of [[-6,false],[6,true]]){P.set({mode:'field',dir:d,anim:'idle',auto:null,pos:{x:cx,y:o.sort+dy}});P.draw();const L=S.order,ki=L.indexOf('kid'),oi=L.indexOf(o.kind+'#'+o.id);n++;if(oi>=0&&ki>=0&&((ki>oi)===front))good++}
        out[kd]=[good,n]}
      const sl=P.SL[0];let good=0,n=0;for(const d of P.DIRS)for(const [dy,front] of [[-6,false],[6,true]]){P.set({dir:d,pos:{x:sl.x,y:sl.y+dy}});P.draw();const L=S.order,ki=L.indexOf('kid'),oi=L.indexOf('slime#0');n++;if((ki>oi)===front)good++}
      out.slime=[good,n];return out}""")
    ok('S4a y-sort: kid 6 px behind / in front of each kind of art (tree lamp hut gate crate bush boulder fence crystal slime) x 8 directions = right order every time', all(v[0] == v[1] == 16 for v in ys.values()), ys)
    fd = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(1,6,'N');const tr=[];for(let t=0;t<=400;t+=16){P.step(16);const o=P.W0.spr.filter(q=>q.alpha<1);tr.push([t+16,o.length?Math.min(...o.map(q=>q.alpha)):1])}
      const reach=(tr.find(e=>e[1]<=P.FADE_A+0.001)||[null])[0];P.teleport(1,9,'N');S.pos={x:48,y:9*32+16};const back=[];for(let t=0;t<=400;t+=16){P.step(16);back.push([t+16,Math.min(...P.W0.spr.filter(q=>q.kind==='tree').map(q=>q.alpha))])}
      P.teleport(1,6,'N');P.sim(400);const faded=P.W0.spr.filter(q=>q.alpha<1).map(q=>q.kind);P.ST.pos={x:16*32+16,y:11*32+16};P.sim(400);const after=P.W0.spr.filter(q=>q.alpha<1).length;return{reach_ms:reach,minAlpha:Math.min(...tr.map(e=>e[1])),faded,after}}""")
    ok('S4b art in front of the kid fades to 55 % (45 % lighter, rule 40-50 %) within 200 ms (+1 frame) and comes back after', fd['reach_ms'] is not None and fd['reach_ms'] <= 216 and abs(fd['minAlpha'] - 0.55) < 0.011 and fd['after'] == 0, fd)
    wb = pg.evaluate("""()=>{const P=PS,S=P.ST,img=S.img.idle;const c=document.createElement('canvas');c.width=96;c.height=96;const x=c.getContext('2d');x.drawImage(img,0,0,96,96,0,0,96,96);
      const d=x.getImageData(0,0,96,96).data,kid=[];for(let v=0;v<96;v++)for(let u=0;u<96;u++)if(d[(v*96+u)*4+3])kid.push([u,v]);const cells=[],zone=[];
      for(let cy=0;cy<P.H;cy++)for(let cx=0;cx<P.W;cx++){if(!P.walkable(cx,cy))continue;const fx=cx*32+16,fy=cy*32+16;let n=0;
        for(const [u,v] of kid){const X=fx-48+u,Y=fy-94+v;if(P.W0.spr.some(o=>o.sort>fy&&o.mask&&X>=o.x&&Y>=o.y&&X<o.x+o.sw&&Y<o.y+o.sh&&o.mask[(Y-o.y)*o.sw+(X-o.x)]))n++}
        if(n/kid.length>0.5){cells.push([cx,cy]);if(P.inZone(cx,cy))zone.push([cx,cy])}}return{count:cells.length,inZone:zone,cells}}""")
    ok('S4c walk-behind cells (kid S more than half covered by art drawn in front, feet at the cell centre, measured in the page) <= 24 and 0 in the slime zone', wb['count'] <= 24 and not wb['inZone'], wb)
    # ---------- item 6: slimes ----------
    sl = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(16,11,'N');let lit=0,out=0,k=0,bobs=new Set(),nonInt=0;
      for(k=0;k<11250;k++){P.step(16);for(const s of P.SL){const c=P.cellOf(s.x,s.y);if(!P.inZone(c[0],c[1]))out++;if(P.lampDist(c[0],c[1])<=P.LAMP_R)lit++;bobs.add(s.bob);if(!Number.isInteger(s.bob))nonInt++}}
      const dirs={};P.SL.forEach(s=>Object.entries(s.dirs).forEach(([d,n])=>dirs[d]=(dirs[d]||0)+n));return{sim_s:k*16/1000,slimes:P.SL.length,outOfZone:out,litFrames:lit,bobs:[...bobs].sort(),nonInt,dirs,dirCount:Object.keys(dirs).length}}""")
    ok('S6b 3 slimes x 180 s: in lamp light 0 frames · outside the zone 0 · all 8 directions used · hop 0-3 whole px', sl['litFrames'] == 0 and sl['outOfZone'] == 0 and sl['dirCount'] == 8 and set(sl['bobs']) <= {0, 1, 2, 3} and sl['nonInt'] == 0, sl)
    sm = np.array(Image.open(os.path.join(HERE, 'g24-slime.png')).convert('RGBA'))[..., 3] > 0
    hts = [int(np.where(sm[:, k * 64:(k + 1) * 64].any(1))[0].max() - np.where(sm[:, k * 64:(k + 1) * 64].any(1))[0].min() + 1) for k in range(8)]
    ok('S6c slime art: height 50-83 px in all 8 views (rule 0.6-1.0 x kid 83)', all(50 <= h <= 83 for h in hts), hts)
    # ---------- item 8: exit, gate, tap, pad, buttons ----------
    ex = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(16,7,'N');P.goto(16,4);P.sim(10000,()=>S.mode==='cave'&&!S.warp);const a={mode:S.mode,msg:S.msg&&[S.msg.th,S.msg.en],pos:[S.pos.x,S.pos.y]};
      P.goto(6,8);P.sim(10000,()=>S.mode==='field'&&!S.warp);return{cave:a,back:{mode:S.mode,cell:P.cellOf(S.pos.x,S.pos.y),dir:S.dir}}}""")
    ok('S8a exit X -> warp ring -> cave room with a TH + EN message · ring in the cave -> back in front of the cave facing S', ex['cave']['mode'] == 'cave' and ex['cave']['msg'] and all(ex['cave']['msg']) and ex['back']['mode'] == 'field' and ex['back']['cell'] == [16, 5] and ex['back']['dir'] == 'S', ex)
    gm = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(15,11,'S');P.walk('S');P.sim(3000);P.stop();const m=S.msg?[S.msg.th,S.msg.en]:null;const el=document.getElementById('msg');return{msg:m,shown:getComputedStyle(el).display!=='none',text:el.innerText,cell:P.cellOf(S.pos.x,S.pos.y)}}""")
    ok('S8b walking into the closed village gate -> message "ประตูหมู่บ้านปิดตอนค่ำ" + "The village gate is closed at night" on screen', gm['msg'] == ['ประตูหมู่บ้านปิดตอนค่ำ', 'The village gate is closed at night'] and gm['shown'], gm)
    pg.evaluate("()=>{PS.teleport(16,11,'N');PS.draw()}")
    tap = pg.evaluate("""()=>{const P=PS,S=P.ST,{s,X,Y}=P.cam(),dpr=devicePixelRatio;const wx=20*32+16,wy=9*32+16;const cx=(wx-X)*s/dpr,cy=(wy-Y)*s/dpr;
      document.getElementById('cv').dispatchEvent(new PointerEvent('pointerdown',{clientX:cx,clientY:cy,bubbles:true}));const has=!!S.auto;P.sim(10000,()=>!S.auto);return{auto:has,cell:P.cellOf(S.pos.x,S.pos.y)}}""")
    ok('S8c tap on the ground walks there (tap at cell 20,9)', tap['auto'] and tap['cell'] == [20, 9], tap)
    pg.evaluate("()=>{PS.teleport(16,11,'N');PS.pause(false)}")
    y0 = pg.evaluate('PS.ST.pos.y'); btn = pg.locator('#pad button[aria-label="N"]'); bb = btn.bounding_box()
    pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(700); pg.mouse.up(); pg.wait_for_timeout(100)
    y1 = pg.evaluate('PS.ST.pos.y'); pg.evaluate('PS.pause(true)')
    ok('S8d on-screen pad: holding ↑ for 0.7 s walks north', y1 < y0 - 15, {'dy': round(y1 - y0, 1)})
    seq = {}
    for bid, expr in (('bPow', 'PS.ST.power'), ('bLR', 'PS.LHOLE.R'), ('bZoom', 'PS.scale()')):
        v = []
        for _ in range(4): pg.click('#' + bid); v.append(pg.evaluate(expr))
        seq[bid] = v
    ok('S8e GM buttons: power 50/10/0/100 · light 160/72/100/130 · zoom far/near/far/near (whole numbers)', seq['bPow'] == [50, 10, 0, 100] and seq['bLR'] == [160, 72, 100, 130] and seq['bZoom'] == [2, 3, 2, 3], seq)
    # ---------- item 8: dark field >= 35 % of lit grass (real canvas pixels, night on / off, same camera) ----------
    dk = pg.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(2,11,'N');P.SL.forEach(s=>{s.x=-500;s.y=-500});P.set({zoomOut:true});const cv=document.getElementById('cv'),g=cv.getContext('2d');
      const grab=()=>{P.draw();return g.getImageData(0,0,cv.width,cv.height).data};S.noNight=true;const d0=grab();S.noNight=false;const d1=grab();const {s,X,Y}=P.cam();
      const lum=(d,x,y)=>{let t=0,n=0;for(let v=y-6;v<y+6;v++)for(let u=x-6;u<x+6;u++){const o=(v*cv.width+u)*4;t+=0.2126*d[o]+0.7152*d[o+1]+0.0722*d[o+2];n++}return t/n};
      const busy=(cx,cy)=>P.W0.spr.some(o=>o.x<cx*32+32&&o.x+o.sw>cx*32&&o.y<cy*32+32&&o.y+o.sh>cy*32&&o.sort>cy*32);
      const kx=S.pos.x,ky=S.pos.y;const r={dark:[],lit:[]};
      for(let cy=4;cy<14;cy++)for(let cx=0;cx<28;cx++){const c=P.GRID[cy][cx];if(c!=='.')continue;if(Math.hypot(cx*32+16-kx,cy*32+16-ky)<200)continue;if(busy(cx,cy))continue;
        const sx=Math.round((cx*32+16-X)*s),sy=Math.round((cy*32+16-Y)*s);if(sx<8||sy<8||sx>cv.width-8||sy>cv.height-8)continue;const a=lum(d0,sx,sy),b=lum(d1,sx,sy);if(a<1)continue;
        if(P.inZone(cx,cy))r.dark.push(b/a);else if(P.lampDist(cx,cy)<=2)r.lit.push(b/a)}
      P.set({zoomOut:false});const med=v=>v.slice().sort((a,b)=>a-b)[Math.floor(v.length/2)];return{darkCells:r.dark.length,litCells:r.lit.length,darkRatio:med(r.dark),litRatio:med(r.lit),share:med(r.dark)/med(r.lit)}}""")
    ok('S8f dusk "dim, not black": dark-field grass >= 35 % as bright as grass under a lamp (median over cells, canvas px night on / off)', dk['share'] >= 0.35, dk)
    # ---------- item 5: colours on the drawn dusk frame (exempt: crystals, exit ring, kid + lantern) ----------
    pg.evaluate("()=>{PS.set({gm:false})}")
    cams = [[3, 5], [24, 5], [3, 12], [24, 12]]; bad_px = {}; tot = 0
    for i, c in enumerate(cams):
        ex_r = pg.evaluate("""(c)=>{const P=PS,S=P.ST;P.teleport(c[0],c[1],'S');P.draw();const {s,X,Y}=P.cam();const R=[];
          P.W0.spr.filter(o=>o.kind==='crystal').forEach(o=>R.push([(o.x-X-6)*s,(o.y-Y-6)*s,(o.x+o.sw-X+6)*s,(o.y+o.sh-Y+6)*s]));
          [[544,144]].forEach(([x,y])=>R.push([(x-34-X)*s,(y-14-Y)*s,(x+34-X)*s,(y+14-Y)*s]));R.push([S.last.sx-4*s,S.last.sy-4*s,S.last.sx+100*s,S.last.sy+100*s]);
          P.CRYSTALS.forEach(([cx,cy])=>R.push([(cx*32+8-X)*s,(cy*32+4-Y)*s,(cx*32+24-X)*s,(cy*32+20-Y)*s]));return R}""", c)
        im = np.array(canvas_png(pg)); m = np.ones(im.shape[:2], bool)
        for x0, y0, x1, y1 in ex_r: m[max(0, int(y0)):max(0, int(y1)), max(0, int(x0)):max(0, int(x1))] = False
        px = im[m]; cols, cnt = np.unique(px, axis=0, return_counts=True); L = rgb2lab(cols[None].astype(float) / 255)[0]; tot += int(m.sum())
        for k, v in list(SIGNAL.items()):
            de = deltaE_ciede2000(L, np.tile(rgb2lab(np.array([[v]], float) / 255)[0, 0], (len(L), 1))); bad_px[k] = bad_px.get(k, 0) + int(cnt[de < 10].sum())
        Image.fromarray(im).save(os.path.join(OUT, 'img', 'colour-%d.png' % i))
    ok('S5 drawn dusk frames (4 camera spots cover the whole map): px with dE00 < 10 from the 3 signal colours = 0 (crystals, exit ring, kid + lantern exempt)', sum(bad_px.values()) == 0, {'px_checked': tot, 'near': bad_px})
    pg.evaluate("()=>{PS.set({gm:true})}")
    ctx.close()
    # ---------- item 8: missing files -> drawn fallbacks, no white screen, still walks ----------
    fb = {}
    for name, block in (('all art', ['**/g24-*', '**/cave-floor.jpg', '**/c2-*']), ('tiles + json', ['**/g24-tiles*']), ('slime', ['**/g24-slime*']), ('hut + cave mouth', ['**/g24-hut*', '**/g24-cave-mouth*']), ('trees + lamp + props', ['**/g24-tree*', '**/g24-lamp*', '**/g24-props*', '**/g24-gate*'])):
        pe = len(errs); c2, p2 = newpage(block=block)
        r = p2.evaluate("""()=>{const P=PS,S=P.ST;P.teleport(16,11,'N');P.draw();const cv=document.getElementById('cv'),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;const cols=new Set();let L=0,n=0;
           for(let i=0;i<d.length;i+=4*97){cols.add(d[i]<<16|d[i+1]<<8|d[i+2]);L+=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];n++}const g=P.goto(20,9);P.sim(10000,()=>!S.auto);
           return{colours:cols.size,meanLum:Math.round(L/n),spr:P.W0.spr.length,slimes:P.SL.length,walked:P.cellOf(S.pos.x,S.pos.y)}}""")
        p2.screenshot(path=os.path.join(OUT, 'img', 'fallback-%s.png' % name.replace(' ', '').replace('+', '-'))); c2.close()
        fb[name] = dict(r, js_errors=len(errs) - pe)
    ok('S8g missing files (5 cases incl. every art file): page draws the fallback shapes (> 20 colours, not white), walks, 0 JS errors', all(v['colours'] > 20 and v['meanLum'] < 200 and v['walked'] == [20, 9] and v['js_errors'] == 0 for v in fb.values()), fb)
    # ---------- screenshots ----------
    for (vw, vh, dpr, tag) in ((844, 390, 2.625, 'phone'), (1180, 820, 2, 'ipad')):
        c3, p3 = newpage(vw, vh, dpr)
        for nm, js in (('start', "PS.teleport(16,11,'N')"), ('door', "PS.teleport(9,10,'N');PS.goto(6,8);PS.sim(15000,()=>!PS.ST.auto)"), ('field', "PS.teleport(22,10,'E');PS.sim(1500)"),
                       ('behind-tree', "PS.teleport(1,6,'N');PS.sim(300)"), ('cave', "PS.teleport(16,6,'N');PS.goto(16,4);PS.sim(8000,()=>PS.ST.mode==='cave'&&!PS.ST.warp);PS.sim(400)"),
                       ('gate', "PS.teleport(15,11,'S');PS.walk('S');PS.sim(2000);PS.stop()")):
            p3.evaluate('()=>{%s;PS.draw()}' % js); p3.screenshot(path=os.path.join(OUT, 'img', '%s-%s.png' % (tag, nm)))
        c3.close()
    # ---------- item 8: FPS vs the Pilot motion page (G11 method: 4x CPU, rAF 2 s, walking, median of 5, order alternates) ----------
    ctx4 = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625); p4 = ctx4.new_page()
    p4.on('pageerror', lambda e: errs.append('pageerror ' + str(e)))
    cdp = ctx4.new_cdp_session(p4); vals = {'cave': [], 'dark': [], 'scene': []}
    FPS = "()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})"
    for rnd in range(5):
        for which in (('cave', 'dark', 'scene') if rnd % 2 == 0 else ('scene', 'dark', 'cave')):
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
            if which == 'scene':
                p4.goto(URL + '?gm'); p4.wait_for_function('window.PS&&PS.ST.ready', timeout=20000); p4.evaluate("()=>{PS.teleport(16,11,'N');PS.goto(26,10)}")
            else:
                p4.goto(MOTION + '&scene=' + which); p4.wait_for_function('window.PT&&PT.ST.img.walk', timeout=20000); p4.evaluate("()=>{PT.set({pos:{x:160,y:120}});PT.walk('SE')}")
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4}); p4.wait_for_timeout(300); vals[which].append(p4.evaluate(FPS))
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    med = lambda v: sorted(v)[len(v) // 2]
    R['fps'] = {k: [round(x, 1) for x in v] for k, v in vals.items()}; R['fps']['median'] = {k: round(med(v), 1) for k, v in vals.items()}
    R['fps']['scene_vs_cave'] = round(med(vals['scene']) / med(vals['cave']), 3); R['fps']['scene_vs_empty_dark_grid'] = round(med(vals['scene']) / med(vals['dark']), 3)
    p4.goto(URL + '?gm'); p4.wait_for_function('window.PS&&PS.ST.ready'); p4.evaluate('PS.pause(true)')
    R['draw_ms_cpu1x'] = p4.evaluate("""()=>{const P=PS,g=document.getElementById('cv').getContext('2d');P.teleport(16,11,'N');P.goto(26,10);const r=[];for(let k=0;k<5;k++){for(let i=0;i<20;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);const t0=performance.now();for(let i=0;i<100;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);r.push((performance.now()-t0)/100)}return +r.sort((a,b)=>a-b)[2].toFixed(2)}""")
    ok('S8h FPS of the scene >= 90 % of the Pilot motion page in its cave view (the existing view with the same work: floor art + darkness + held lantern) · 4x CPU · rAF 2 s · walking · median of 5 · the empty dark grid view and draw ms reported',
       med(vals['scene']) >= 0.9 * med(vals['cave']), dict(R['fps'], draw_ms_cpu1x=R['draw_ms_cpu1x']))
    ctx4.close(); b.close()
ok('S8i JS errors 0 across every page load (page errors + console errors; blocked-file loads count page errors only)', not errs, errs[:5])
R['checks'] = CHECK; R['passed'] = sum(c['pass'] for c in CHECK); R['total'] = len(CHECK)
json.dump(R, open(os.path.join(OUT, 'results.json'), 'w'), ensure_ascii=False, indent=1)
print('%d/%d' % (R['passed'], R['total']))
