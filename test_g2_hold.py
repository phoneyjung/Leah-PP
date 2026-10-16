#!/usr/bin/env python3
# G2.2b Pilot lantern-hold test (Claude · 16 Oct 2569 · Pilot only, no index.html / sw.js / save)
# Runs pilot-g2-motion.html?hold in Chromium (844x390 @ DPR 2.625) and measures QG-2b criteria 1, 3, 4, 5, 6, 7, 8, 9, 10, 11
# from the drawn canvas pixels and the drawn lantern position (D-EASE: at most 3 art px per 100 ms per axis, snap on a direction change).
# usage: python3 -I test_g2_hold.py PORT OUT_DIR   (serve this folder with python3 -m http.server PORT)
import sys, os, json
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']; HOLD = [d for d in DIRS if d != 'N']
DPR = 2.625; URL = 'http://127.0.0.1:%s/pilot-g2-motion.html?hold' % PORT
R = {'meta': {'viewport': [844, 390], 'dpr': DPR, 'page': 'pilot-g2-motion.html?hold'}}; CHECK = []
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val})

# ---------- file-level checks (criteria 1, 3, 8, 11) ----------
A = json.load(open(os.path.join(HERE, 'c2-pilot-hold-anchors.json')))
mask_i = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-idleanim-mask.png')).convert('RGB')) if os.path.exists(os.path.join(HERE, 'c2-pilot-kid4-idleanim-mask.png')) else None
mask_w = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-walkhold-mask.png')).convert('RGB'))
nfr = sum(len(A[a][d]) for a in ('idle_hold', 'walk_hold') for d in DIRS)
ok('1 frames idle_hold 8x4 + walk_hold 8x6', nfr == 80 and all(len(A['idle_hold'][d]) == 4 and len(A['walk_hold'][d]) == 6 for d in DIRS), nfr)
on_fist = tot = id_ok = id_tot = 0
for a, m in (('idle_hold', mask_i), ('walk_hold', mask_w)):
    for i, d in enumerate(DIRS):
        for k, f in enumerate(A[a][d]):
            if d == 'N': continue
            tot += 1; on_fist += f['anchor'] in f['fist']
            if m is not None:
                for x, y in f['fist']:
                    id_tot += 1; id_ok += m[i * 96 + y, k * 96 + x, 0] in (3, 7)
ok('3 target anchor on a fist pixel (70 frames, N = no lantern)', on_fist == tot == 70, '%d/%d' % (on_fist, tot))
ok('3b fist pixels are skin ID3 or leather ID7 in the masks', id_ok == id_tot and id_tot > 0, '%d/%d' % (id_ok, id_tot))
R['L_max'] = {d: 92 - max(f['anchor'][1] for a in ('idle_hold', 'walk_hold') for f in A[a][d]) for d in HOLD}
ok('8 L_max per dir (92 - lowest hand row) reported, all 15-17', all(15 <= v <= 17 for v in R['L_max'].values()), R['L_max'])
def body_x(png, nf):
    im = np.array(Image.open(os.path.join(HERE, png)).convert('RGBA'))[..., 3]; out = {}
    for i, d in enumerate(DIRS):
        xs = []
        for k in range(nf):
            c = im[i * 96 + 52:i * 96 + 87, k * 96:k * 96 + 96]; ys, xx = np.nonzero(c); xs.append(xx.mean())
        out[d] = float(np.mean(xs))
    return out
bw, bh = body_x('c2-pilot-kid4-walk.png', 6), body_x('c2-pilot-kid4-walkhold.png', 6)
R['b2_body_diff'] = {d: round(abs(bw[d] - bh[d]), 2) for d in DIRS}
ok('11 walk_hold body centre vs walk <= 1 px per dir (B2 table reused)', max(R['b2_body_diff'].values()) <= 1, R['b2_body_diff'])
def head_x(png, nf, rows=(0, 51)):
    im = np.array(Image.open(os.path.join(HERE, png)).convert('RGBA'))[..., 3]
    return {d: [float(np.nonzero(im[i * 96 + rows[0]:i * 96 + rows[1], k * 96:k * 96 + 96])[1].mean()) for k in range(nf)] for i, d in enumerate(DIRS)}
hw, hi = head_x('c2-pilot-kid4-walkhold.png', 6), head_x('c2-pilot-kid4-idleanim.png', 4)
HJ = {d: max(abs(x - hi[d][2]) for x in hw[d]) for d in DIRS}                       # unrounded (reviewer: rounding hid N 1.002)
R['stop_head_jump_entry_f3'] = {d: round(HJ[d], 3) for d in DIRS}
hw43, hi43 = head_x('c2-pilot-kid4-walkhold.png', 6, (0, 44)), head_x('c2-pilot-kid4-idleanim.png', 4, (0, 44)); hwl = head_x('c2-pilot-kid4-walk.png', 6)
R['stop_head_jump_rows0_43'] = {d: round(max(abs(x - hi43[d][2]) for x in hw43[d]), 3) for d in DIRS}
R['stop_head_jump_locked_walk'] = {d: round(max(abs(x - hi[d][2]) for x in hwl[d]), 3) for d in DIRS}
ok('6a stop (walk_hold -> idle f3) head jump <= 1 px (unrounded, rows 0-50)', max(HJ.values()) <= 1.0, {'over_1': {d: round(v, 3) for d, v in HJ.items() if v > 1}, 'all': R['stop_head_jump_entry_f3']})
src = open(os.path.join(HERE, 'pilot-g2-motion.html'), encoding='utf-8').read()
ok('7b no rotation in the page (rotate / setTransform count)', src.count('rotate') + src.count('setTransform') == 0, src.count('rotate') + src.count('setTransform'))

# ---------- in-page checks ----------
COMPOSITE = """(a)=>{const P=PT,S=P.ST,C=96;P.pause(true);
 const grid=()=>{const L=S.last,s=L.s,x0=Math.round(L.sx-16*s),y0=Math.round(L.sy),w=128,h=104,cv=document.getElementById('cv'),g=cv.getContext('2d');
   const D=g.getImageData(x0,y0,w*s,h*s).data,o=new Uint8ClampedArray(w*h*4),hs=Math.floor(s/2);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=((y*s+hs)*w*s+(x*s+hs))*4,i=(y*w+x)*4;o[i]=D[j];o[i+1]=D[j+1];o[i+2]=D[j+2];o[i+3]=D[j+3]}return o};
 const set=()=>{P.set({dir:a.d,anim:a.anim,fi:a.fi,t:0,hold:true,ease:true,lpos:null,ldir:null,clean:true,zoom:1,off:true,blinkNow:a.blink,nofist:false})};
 set();P.draw();const L1=S.last,G1=grid(),lan=L1.lantern;
 const keep=S.img.lantern,blank=document.createElement('canvas');blank.width=keep.width;blank.height=keep.height;S.img.lantern=blank;set();P.draw();const G0=grid();S.img.lantern=keep;
 set();S.nofist=true;P.draw();const G2=grid();S.nofist=false;
 if(!lan)return{lan:null,sheet:L1.sheet,diff:[...G1].some((v,i)=>v!==G0[i])};
 const lc=document.createElement('canvas');lc.width=keep.width;lc.height=keep.height;const lx=lc.getContext('2d');lx.drawImage(keep,0,0);
 const di=P.DIRS.indexOf(a.d),LD=lx.getImageData(di*32,0,32,32).data;
 const fr=S.hanc[a.anim==='walk'?'walk_hold':'idle_hold'][a.d][L1.frame],fist=new Set(fr.fist.map(([x,y])=>x+','+y));
 let bad=0,lanPx=0,fistOver=0,fistOverNofistLantern=0,outside=0,front=0;const [dxl,dyl]=lan.drawn;
 for(let y=0;y<104;y++)for(let x=0;x<128;x++){const ax=x-16,ay=y,i=(y*128+x)*4,lxp=ax-dxl+16,lyp=ay-dyl+6;
   const inL=lxp>=0&&lxp<32&&lyp>=0&&lyp<32&&LD[(lyp*32+lxp)*4+3]>0;const eq=(G,H)=>G[i]===H[i]&&G[i+1]===H[i+1]&&G[i+2]===H[i+2];
   if(!inL){if(!eq(G1,G0))outside++;continue}
   lanPx++;const li=(lyp*32+lxp)*4,isL=(G)=>G[i]===LD[li]&&G[i+1]===LD[li+1]&&G[i+2]===LD[li+2];
   if(fist.has(ax+','+ay)){fistOver++;if(!eq(G1,G0))bad++;if(isL(G2))fistOverNofistLantern++}
   else{if(!isL(G1))bad++;else front++}}
 return{lan,sheet:L1.sheet,frame:L1.frame,lanPx,front,bad,outside,fistOver,fistOverNofistLantern,dx:L1.dx}}"""
SIM = """(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:a.d,anim:'idle',fi:0,t:0,hold:true,ease:a.ease,easeStep:!!a.step,lpos:null,ldir:null,lhist:null,clean:true,zoom:1,off:true,blinkNow:false,moving:false,pos:{x:160,y:200}});P.draw();
 const rec=[];let t=0;const run=(ms)=>{for(let e=0;e<ms;e+=16){P.step(16);t+=16;P.draw();const L=S.last.lantern;rec.push({t,anim:S.anim,f:S.last.frame,dir:S.dir,tg:L?L.target:null,dr:L?L.drawn:null})}};
 for(const [cmd,ms] of a.script){if(cmd==='stop')P.stop();else if(cmd==='walk')P.walk(a.d);else if(cmd.startsWith('dir:'))P.walk(cmd.slice(4));run(ms)}
 return rec}"""
def jump_stats(rec, t0, t1):
    seg = [r for r in rec if t0 <= r['t'] <= t1 and r['dr']]
    mx = [0, 0]; dev = 0
    for i, r in enumerate(seg):
        dev = max(dev, max(abs(r['dr'][0] - r['tg'][0]), abs(r['dr'][1] - r['tg'][1])))
        for q in seg[i + 1:]:
            if q['t'] - r['t'] > 100: break
            mx = [max(mx[0], abs(q['dr'][0] - r['dr'][0])), max(mx[1], abs(q['dr'][1] - r['dr'][1]))]
    settle = next((r['t'] - t0 for r in seg if r['t'] > t0 and r['dr'] == r['tg']), None)   # first frame after t0 where the lantern is back on the hand
    gt3 = 16 * sum(1 for r in seg if max(abs(r['dr'][0] - r['tg'][0]), abs(r['dr'][1] - r['tg'][1])) > 3)   # ms with ring > 3 px from the fist point
    return {'max_per_100ms_x': mx[0], 'max_per_100ms_y': mx[1], 'max_off_from_hand': dev, 'settle_ms': settle, 'ms_off_gt3': gt3}
errors = []
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=DPR); page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(URL); page.wait_for_function('PT.ST.ok.walk && PT.ST.ok.idle && PT.ST.ok.hold && PT.ST.ok.lantern && PT.ST.ok.walkhold', timeout=15000)
    ok('page opens in hold mode (?hold) with all files', page.evaluate('PT.holdOn()'), page.evaluate('PT.ST.ok'))
    # criterion 7 + 3 on the canvas: exact composite per frame (lantern in front, fist pixels over the ring, no scaling/rotation, B2 offset applies)
    comp = {}; tot = {'frames': 0, 'bad': 0, 'outside': 0, 'lanPx': 0, 'front': 0, 'fistOver': 0, 'fistOverNofistLantern': 0, 'settled_eq_target': 0, 'n_sheet_ok': 0}
    for anim, nf in (('idle', 4), ('walk', 6)):
        for d in DIRS:
            for k in range(nf):
                fi = k; blink = False
                if anim == 'idle':   # loop index for frames 0,1,2 ; f4 = blink slot (loop index 3 + blinkNow, only blink dirs) -> force via fi=3 + blinkNow
                    fi = {0: 0, 1: 1, 2: 2, 3: 3}[k]; blink = k == 3
                r = page.evaluate(COMPOSITE, {'d': d, 'anim': anim, 'fi': fi, 'blink': blink}); key = '%s %s f%d' % (anim, d, k + 1); comp[key] = r
                if d == 'N':
                    tot.setdefault('N_lantern_drawn', 0); tot['N_lantern_drawn'] += bool(r['lan']); continue
                if r['lan'] is None: tot.setdefault('missing', []).append(key); continue
                tot['frames'] += 1
                for f in ('bad', 'outside', 'lanPx', 'front', 'fistOver', 'fistOverNofistLantern'): tot[f] += r[f]
                tot['settled_eq_target'] += r['lan']['drawn'] == r['lan']['target']
                tot['n_sheet_ok'] += r['sheet'] == ('walkhold' if anim == 'walk' else 'idle')
    R['composite'] = tot
    ok('7 lantern drawn in front, fist pixels redrawn over the ring, exact pixels (bad + outside = 0)', tot['bad'] == 0 and tot['outside'] == 0 and tot['frames'] > 0,
       {k: tot[k] for k in ('frames', 'lanPx', 'front', 'fistOver', 'bad', 'outside')})
    conv = page.evaluate("""()=>{const P=PT,S=P.ST;let ok=0,n=0,worst=0;for(const [anim,nf] of [['idle',4],['walk',6]])for(const d of P.DIRS){if(d==='N')continue;for(let k=0;k<nf;k++){
        P.pause(true);P.set({dir:d,anim,fi:k,t:0,hold:true,ease:true,lpos:null,ldir:null,blinkNow:anim==='idle'&&k===3});P.draw();const t=P.lanternTarget();
        S.lpos=[t[0]+6,t[1]-6];S.ldir=d;let ms=0;while(ms<400){P.easeLantern(16);ms+=16;P.draw();const L=S.last.lantern;if(L.drawn[0]===t[0]&&L.drawn[1]===t[1])break}
        n++;const L=S.last.lantern;if(L.drawn[0]===t[0]&&L.drawn[1]===t[1]){ok++;worst=Math.max(worst,ms)}}}return {ok,n,worst_ms:worst}}""")
    ok('3c eased lantern converges onto the frame target from 6 px away (every frame, within 256 ms)', conv['ok'] == conv['n'] == 70 and conv['worst_ms'] <= 256, conv)   # 6 px at <= 3 px per 120 ms window (100 ms rule + 20 ms jitter margin) -> <= 256 ms
    ok('7c ?nofist shows the ring over the fist (overlay really does something)', tot['fistOverNofistLantern'] > 0, tot['fistOverNofistLantern'])
    ok('N draws no lantern (D-HAND)', tot.get('N_lantern_drawn', 0) == 0, tot.get('N_lantern_drawn', 0))
    ok('walk in hold mode uses the walk_hold sheet', tot['n_sheet_ok'] == tot['frames'], '%d/%d' % (tot['n_sheet_ok'], tot['frames']))
    # which frames idle uses when the visible idle frame is the blink slot in a non-blink dir: curFrame() returns 3 only for blink dirs
    # B2 offset applies to the lantern: same frame with offset on/off -> screen x differs by dx*s
    b2 = {}
    for d in HOLD:
        xs = []
        for off in (True, False):
            page.evaluate("(a)=>{PT.pause(true);PT.set({dir:a.d,anim:'idle',fi:0,hold:true,lpos:null,ldir:null,off:a.off,zoom:1,clean:true});PT.draw()}", {'d': d, 'off': off})
            xs.append(page.evaluate("()=>[PT.ST.last.sx,PT.ST.last.s,PT.ST.last.dx]"))
        b2[d] = round((xs[0][0] - xs[1][0]) / xs[0][1], 2) == xs[0][2]
    ok('11b lantern moves with the B2 renderOffset (sprite and lantern share sx)', all(b2.values()), b2)
    # criterion 4 + 5 + 6 on the drawn lantern position (D-EASE) and the snap mode for comparison
    sim = {}
    EMODES = (('ease', True, False), ('snap', False, False), ('step', True, True))   # ease = smooth 0.03 px/ms (baseline A) · step = jump as far as the last 100 ms allow
    for mode, ease, stp in EMODES:
        sim[mode] = {}
        for d in HOLD:
            rec = page.evaluate(SIM, {'d': d, 'ease': ease, 'step': stp, 'script': [['idle', 1600], ['walk', 2400], ['stop', 1600], ['walk', 1200], ['stop', 800]]})
            walk_seg = [r for r in rec if 2000 <= r['t'] <= 4000 and r['dr']]
            idle_seg = [r for r in rec if 400 <= r['t'] <= 1600 and r['dr']]
            xs = [r['dr'][0] for r in walk_seg]; ys = [r['dr'][1] for r in walk_seg]
            ix = [r['dr'][0] for r in idle_seg]; iy = [r['dr'][1] for r in idle_seg]
            sim[mode][d] = {'walk_x_range': max(xs) - min(xs), 'walk_y_range': max(ys) - min(ys), 'walk': jump_stats(rec, 2000, 4000),
                            'idle_x_range': max(ix) - min(ix), 'idle_y_range': max(iy) - min(iy), 'idle': jump_stats(rec, 0, 1600),
                            'stop': jump_stats(rec, 4000, 5600), 'start': jump_stats(rec, 1600, 2000), 'stop2': jump_stats(rec, 6800, 7600)}
    R['sim'] = sim
    e = sim['ease']
    ok('4 walk_hold drawn lantern: x range <= 4, y range <= 3, per 100 ms <= 3 (ease)',
       all(e[d]['walk_x_range'] <= 4 and e[d]['walk_y_range'] <= 3 and e[d]['walk']['max_per_100ms_x'] <= 3 and e[d]['walk']['max_per_100ms_y'] <= 3 for d in HOLD),
       {d: [e[d]['walk_x_range'], e[d]['walk_y_range'], e[d]['walk']['max_per_100ms_x'], e[d]['walk']['max_per_100ms_y']] for d in HOLD})
    ok('5 idle_hold drawn lantern moves <= 3 px', all(e[d]['idle_x_range'] <= 3 and e[d]['idle_y_range'] <= 3 for d in HOLD), {d: [e[d]['idle_x_range'], e[d]['idle_y_range']] for d in HOLD})
    ok('6b stop (walk -> idle f3) drawn lantern jump <= 3 px per 100 ms (ease)',
       all(max(e[d][s]['max_per_100ms_x'], e[d][s]['max_per_100ms_y']) <= 3 for d in HOLD for s in ('stop', 'stop2')),
       {d: [max(e[d]['stop']['max_per_100ms_x'], e[d]['stop']['max_per_100ms_y']), e[d]['stop']['max_off_from_hand'], e[d]['stop']['settle_ms'], e[d]['stop']['ms_off_gt3']] for d in HOLD})
    R['ring_vs_fist'] = {d: {s_: [e[d][s_]['max_off_from_hand'], e[d][s_]['ms_off_gt3']] for s_ in ('walk', 'idle', 'stop', 'start')} for d in HOLD}
    R['start_report'] = {d: [max(e[d]['start']['max_per_100ms_x'], e[d]['start']['max_per_100ms_y']), e[d]['start']['max_off_from_hand'], e[d]['start']['settle_ms'], e[d]['start']['ms_off_gt3']] for d in HOLD}
    R['snap_for_comparison'] = {d: {'walk_per100': max(sim['snap'][d]['walk']['max_per_100ms_x'], sim['snap'][d]['walk']['max_per_100ms_y']),
                                    'stop_per100': max(sim['snap'][d]['stop']['max_per_100ms_x'], sim['snap'][d]['stop']['max_per_100ms_y'])} for d in HOLD}
    R['ease_max_off_from_hand'] = max(max(e[d][s]['max_off_from_hand'] for s in ('walk', 'idle', 'stop', 'start')) for d in HOLD)
    # criterion 6 for every walk frame the player can stop on (6 per dir): walk 1.2 s + k*100 ms, stop, watch 0.8 s
    stops = {}
    for mode, ease, stp in EMODES:
        stops[mode] = {}
        for d in HOLD:
            per = []
            for k in range(6):
                rec = page.evaluate(SIM, {'d': d, 'ease': ease, 'step': stp, 'script': [['idle', 800], ['walk', 1200 + k * 100 + 48], ['stop', 800]]})
                walk_recs = [r for r in rec if r['anim'] == 'walk']; t0 = walk_recs[-1]['t']
                st = jump_stats(rec, t0, t0 + 800); st['stop_frame'] = walk_recs[-1]['f'] + 1; per.append(st)
            stops[mode][d] = {'stop_frames': sorted(x['stop_frame'] for x in per), 'max_per_100ms': max(max(x['max_per_100ms_x'], x['max_per_100ms_y']) for x in per),
                              'max_off_from_hand': max(x['max_off_from_hand'] for x in per), 'settle_ms_max': max(x['settle_ms'] or 0 for x in per), 'ms_off_gt3_max': max(x['ms_off_gt3'] for x in per)}
    R['stop_all_frames'] = stops
    se = stops['ease']
    ok('6c stop from each of the 6 walk frames: drawn lantern <= 3 px per 100 ms (ease)', all(se[d]['max_per_100ms'] <= 3 and se[d]['stop_frames'] == [1, 2, 3, 4, 5, 6] for d in HOLD),
       {d: [se[d]['max_per_100ms'], se[d]['max_off_from_hand'], se[d]['settle_ms_max'], se[d]['ms_off_gt3_max']] for d in HOLD})
    st_ = sim['step']; ss = stops['step']
    ok('4s step ease: walk x range <= 4, y range <= 3, per 100 ms <= 3', all(st_[d]['walk_x_range'] <= 4 and st_[d]['walk_y_range'] <= 3 and max(st_[d]['walk']['max_per_100ms_x'], st_[d]['walk']['max_per_100ms_y']) <= 3 for d in HOLD),
       {d: [st_[d]['walk_x_range'], st_[d]['walk_y_range'], max(st_[d]['walk']['max_per_100ms_x'], st_[d]['walk']['max_per_100ms_y'])] for d in HOLD})
    ok('6s step ease: stop from each of the 6 walk frames and start <= 3 px per 100 ms', all(ss[d]['max_per_100ms'] <= 3 and ss[d]['stop_frames'] == [1, 2, 3, 4, 5, 6] and max(st_[d]['start']['max_per_100ms_x'], st_[d]['start']['max_per_100ms_y']) <= 3 for d in HOLD),
       {d: [ss[d]['max_per_100ms'], ss[d]['max_off_from_hand'], ss[d]['settle_ms_max'], ss[d]['ms_off_gt3_max']] for d in HOLD})
    R['ring_vs_fist_compare'] = {d: {m: {'stop_all_frames': [stops[m][d]['max_off_from_hand'], stops[m][d]['ms_off_gt3_max']], 'start': [sim[m][d]['start']['max_off_from_hand'], sim[m][d]['start']['ms_off_gt3']],
                                         'walk': [sim[m][d]['walk']['max_off_from_hand'], sim[m][d]['walk']['ms_off_gt3']]} for m in ('ease', 'step')} for d in HOLD}
    # live run (requestAnimationFrame, real frame times, CPU 1x and 4x): walk 1.5 s, stop, 1.1 s - measured on real time stamps, both ease modes
    LIVE = """(a)=>new Promise(res=>{const rec=[];PT.set({hold:true,ease:true,easeStep:a.step,lpos:null,ldir:null,lhist:null,pos:{x:160,y:200},clean:false});PT.pause(false);
      const t0=performance.now();let stopped=false;PT.walk(a.d);const f=()=>{const now=performance.now()-t0;const L=PT.ST.last&&PT.ST.last.lantern;rec.push([now,L?L.drawn:null,L?L.target:null]);
      if(!stopped&&now>1500){PT.stop();stopped=true}if(now<2600)requestAnimationFrame(f);else{PT.pause(true);res(rec)}};requestAnimationFrame(f)})"""
    cdp2 = ctx.new_cdp_session(page); live = {}
    for rate in (1, 4):
        cdp2.send('Emulation.setCPUThrottlingRate', {'rate': rate})
        for mname, stp in (('smooth', False), ('step', True)):
            for d in ('E', 'W', 'NE', 'SE'):
                rec = [r for r in page.evaluate(LIVE, {'d': d, 'step': stp}) if r[1]]; mx = off = 0
                for i, (t, dr, tg) in enumerate(rec):
                    off = max(off, abs(dr[0] - tg[0]), abs(dr[1] - tg[1]))
                    for t2, dr2, _ in rec[i + 1:]:
                        if t2 - t > 100: break
                        mx = max(mx, abs(dr2[0] - dr[0]), abs(dr2[1] - dr[1]))
                live['cpu%d %s %s' % (rate, mname, d)] = [mx, off, rec[-1][1] == rec[-1][2]]
    cdp2.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    R['live'] = live
    ok('live rAF (CPU 1x/4x, real time): <= 3 px per 100 ms, ends on the hand, both ease modes', all(v[0] <= 3 and v[2] for v in live.values()), live)
    # turning into / out of N (no lantern in N): lantern hides / shows on the same frame as the body turns, on the hand, no flicker
    nt = []
    for a, c in (('NE', 'N'), ('N', 'NE'), ('NW', 'N'), ('N', 'NW')):
        for anim in ('walk', 'idle'):
            nt.append(page.evaluate("""(a)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:a.from,anim:a.anim,fi:0,t:0,hold:true,ease:true,easeStep:false,lpos:null,ldir:null,moving:false,clean:true});P.draw();
              for(let i=0;i<20;i++){P.step(16);P.draw()}S.dir=a.to;const seq=[];for(let i=0;i<8;i++){P.step(16);P.draw();const L=S.last.lantern;seq.push(L?[L.drawn,L.target]:null)}
              const want=a.to!=='N';return seq.every(v=>!!v===want)&&(!want||seq[0][0][0]===seq[0][1][0]&&seq[0][0][1]===seq[0][1][1])}""", {'from': a, 'to': c, 'anim': anim}))
    ok('N <-> NE/NW: lantern hides/shows on the turn frame, on the hand, no flicker', all(nt), '%d/%d' % (sum(nt), len(nt)))
    # hand switch: direction change snaps (drawn = target on the first frame after the change), all 7x6 pairs, walking and standing
    sw_ok = sw_n = 0
    for a in HOLD:
        for c in HOLD:
            if a == c: continue
            for anim in ('walk', 'idle'):
                r = page.evaluate("""(x)=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:x.a,anim:x.anim,fi:0,t:0,hold:true,ease:true,lpos:null,ldir:null,clean:true,moving:false});P.draw();
                  for(let i=0;i<20;i++){P.step(16);P.draw()}S.dir=x.c;P.step(16);P.draw();const L=S.last.lantern;return L?[L.drawn,L.target]:null}""", {'a': a, 'c': c, 'anim': anim})
                sw_n += 1; sw_ok += bool(r) and r[0] == r[1]
    ok('hand switch on a direction change snaps (drawn = target at once)', sw_ok == sw_n, '%d/%d' % (sw_ok, sw_n))
    nr = page.evaluate("""()=>{const P=PT,S=P.ST;P.pause(true);P.set({dir:'E',anim:'walk',fi:0,hold:true,lpos:null,ldir:null});P.step(16);P.draw();S.dir='N';P.step(16);P.draw();const a=S.last.lantern;S.dir='W';P.step(16);P.draw();const b=S.last.lantern;return [a,b?b.drawn[0]===b.target[0]&&b.drawn[1]===b.target[1]:null]}""")
    ok('E -> N hides the lantern, N -> W snaps', nr[0] is None and nr[1] is True, nr)
    # criterion 9: FPS hold on vs off (draw cost + rAF under 4x CPU throttle while walking)
    # draw cost: getImageData before/after = wait for the GPU, so the time includes the real drawing (reviewer: CPU-only timing was noise)
    cost = page.evaluate("""()=>{const P=PT,S=P.ST;const run=(h)=>{P.pause(true);P.set({hold:h,dir:'SE',anim:'walk',fi:0,clean:false,lpos:null,ldir:null});for(let i=0;i<100;i++){P.step(16);P.draw()}
       const g=document.getElementById('cv').getContext('2d');g.getImageData(0,0,1,1);const t0=performance.now();for(let i=0;i<600;i++){P.step(16);P.draw()}g.getImageData(0,0,1,1);return (performance.now()-t0)/600};const r=[];for(let k=0;k<15;k++){r.push([run(false),run(true)])}return r}""")
    med = lambda v: sorted(v)[len(v) // 2]
    off_ms = med([c[0] for c in cost]); on_ms = med([c[1] for c in cost])
    cdp = ctx.new_cdp_session(page); fps = {}
    for rate in (4, 10):                                    # 5 alternating rounds (off/on, then on/off ...) x 2 s each, median - single runs at 10x were noisy (44 vs 36, then 48 vs 51)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate}); vals = {False: [], True: []}
        for rnd in range(5):
            for h in ((False, True) if rnd % 2 == 0 else (True, False)):
                page.evaluate("(h)=>{PT.set({hold:h,clean:false,lpos:null,ldir:null,pos:{x:160,y:120}});PT.pause(false);PT.walk('SE')}", h); page.wait_for_timeout(300)
                vals[h].append(page.evaluate("()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})"))
                page.evaluate('PT.stop()')
        for h in (False, True): fps[(rate, h)] = sorted(vals[h])[2]
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    R['fps'] = {'draw_ms_off_median15': round(off_ms, 3), 'draw_ms_on_median15': round(on_ms, 3), 'draw_extra_ms': round(on_ms - off_ms, 3), 'extra_pct_of_16_7ms': round((on_ms - off_ms) / 16.67 * 100, 1),
                'raf_cpu4x': [round(fps[(4, False)], 1), round(fps[(4, True)], 1)], 'raf_cpu10x': [round(fps[(10, False)], 1), round(fps[(10, True)], 1)]}
    ok('9 FPS hold on >= 90 % of off (rAF median of 5 alternating rounds, 4x and 10x CPU throttle, walking) · real phone in G2.6', all(fps[(r_, True)] >= 0.9 * fps[(r_, False)] for r_ in (4, 10)), R['fps'])
    # screenshots: 844x390 idle + walking per dir (hold), light / dark, zoom 100 / 75, nofist comparison
    for zoom, zk in ((1, '100'), (0.75, '75')):
        for dark in (False, True):
            for d in DIRS:
                for anim, fi in (('idle', 0), ('walk', 1)):
                    page.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:a.d,anim:a.anim,fi:a.fi,hold:true,lpos:null,ldir:null,zoom:a.z,clean:false,dark:a.dark,guides:false,blinkNow:false,nofist:false});PT.draw()}",
                                  {'d': d, 'anim': anim, 'fi': fi, 'z': zoom, 'dark': dark})
                    page.screenshot(path=os.path.join(OUT, 'hold-z%s-%s-%s-%s.png' % (zk, 'dark' if dark else 'light', anim, d)), clip={'x': 422 - 60, 'y': 195 - 140 * zoom, 'width': 120, 'height': 160 * zoom + 10})
    page.evaluate("()=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:'SE',anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:1,clean:false,dark:false})}")
    page.screenshot(path=os.path.join(OUT, 'full-844x390-hold.png'))
    page.evaluate("()=>{PT.set({nofist:true});PT.draw()}"); page.screenshot(path=os.path.join(OUT, 'nofist-SE.png'), clip={'x': 362, 'y': 55, 'width': 120, 'height': 170})
    page.evaluate("()=>{PT.set({nofist:false});PT.draw()}"); page.screenshot(path=os.path.join(OUT, 'fist-SE.png'), clip={'x': 362, 'y': 55, 'width': 120, 'height': 170})
    # iPad 1180x820
    ctx2 = b.new_context(viewport={'width': 1180, 'height': 820}, device_scale_factor=2); pg2 = ctx2.new_page(); e2 = []
    pg2.on('pageerror', lambda e: e2.append(str(e))); pg2.goto(URL); pg2.wait_for_function('PT.ST.ok.hold && PT.ST.ok.walkhold', timeout=15000)
    pg2.evaluate("()=>{PT.walk('SW')}"); pg2.wait_for_timeout(900); pg2.screenshot(path=os.path.join(OUT, 'full-1180x820-hold-walk.png'))
    R['ipad'] = {'page_errors': e2, 'lantern': pg2.evaluate('PT.ST.last.lantern')}
    ctx2.close()
    # criterion 10: missing files -> old sheets, no lantern, no white screen, no page errors
    fb = {}
    for name, pats in (('walkhold_png', ['**/c2-pilot-kid4-walkhold.png']), ('lantern_png', ['**/kid-lantern.png']), ('hold_anchors', ['**/c2-pilot-hold-anchors.json']),
                       ('idle_png', ['**/c2-pilot-kid4-idleanim.png']), ('all_hold', ['**/c2-pilot-kid4-walkhold.png', '**/kid-lantern.png', '**/c2-pilot-hold-anchors.json'])):
        pg = ctx.new_page(); errs = []; cons = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: cons.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        for pat in pats: pg.route(pat, lambda r: r.abort())
        pg.goto(URL); pg.wait_for_timeout(1200)
        st = pg.evaluate("()=>{const L=PT.ST.last;return {hold:PT.holdOn(),lantern:L?L.lantern:null}}")
        pg.evaluate("()=>PT.walk('E')"); pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(OUT, 'fallback-%s-walking.png' % name))
        wl = pg.evaluate("()=>({sheet:PT.ST.last.sheet,lantern:PT.ST.last.lantern})")
        im = np.array(Image.open(os.path.join(OUT, 'fallback-%s-walking.png' % name)).convert('RGB')); white = float((im.min(-1) > 250).mean())
        fb[name] = {'page_errors': len(errs), 'console_errors': len(cons), 'white_fraction': round(white, 3), 'holdOn': st['hold'], 'lantern_idle': st['lantern'], 'walk_sheet': wl['sheet'], 'lantern_walking': wl['lantern']}
        pg.close()
    R['fallback'] = fb
    ok('10 missing files -> no lantern, old walk sheet, no white screen, 0 errors',
       all(v['page_errors'] == 0 and v['console_errors'] == 0 and v['white_fraction'] < 0.5 and not v['holdOn'] and v['lantern_idle'] is None and v['lantern_walking'] is None and v['walk_sheet'] in ('walk', 'idle') for v in fb.values()),
       {k: [v['walk_sheet'], v['page_errors'], v['white_fraction']] for k, v in fb.items()})
    # hold off = page exactly as before (no lantern, walk sheet)
    page.evaluate("()=>{PT.pause(true);PT.set({hold:false,dir:'E',anim:'walk',fi:2,lpos:null});PT.draw()}")
    ok('hold off -> walk sheet, no lantern (old Pilot unchanged)', page.evaluate("()=>PT.ST.last.sheet==='walk'&&PT.ST.last.lantern===null"), page.evaluate('PT.ST.last.sheet'))
    R['page_errors'] = errors
    ok('page errors 0', not errors, errors[:3])
    b.close()
# 8-direction contact sheet from the per-direction shots, then drop the 64 single shots (kept out of the repo)
rows = [('z100', 'light', 'idle'), ('z100', 'light', 'walk'), ('z100', 'dark', 'idle'), ('z75', 'dark', 'walk')]
ims = [[Image.open(os.path.join(OUT, 'hold-%s-%s-%s-%s.png' % (z, l, a, d))).convert('RGB') for d in DIRS] for z, l, a in rows]
sw_, sh_ = max(i.width for r in ims for i in r), [max(i.height for i in r) for r in ims]
sheet = Image.new('RGB', (sw_ * 8, sum(sh_)), 'white'); y_ = 0
for r, hh in zip(ims, sh_):
    for j, im_ in enumerate(r): sheet.paste(im_, (j * sw_, y_))
    y_ += hh
sheet.resize((sheet.width // 2, sheet.height // 2), Image.NEAREST).save(os.path.join(OUT, 'hold-8dir-sheet.png'))
for f in os.listdir(OUT):
    if f.startswith('hold-z') and f.endswith('.png'): os.remove(os.path.join(OUT, f))
R['checks'] = CHECK
json.dump(R, open(os.path.join(OUT, 'hold-test.json'), 'w'), indent=1, ensure_ascii=False)
for c in CHECK: print(('PASS ' if c['pass'] else 'FAIL ') + c['check'] + ' :: ' + json.dumps(c['value'], ensure_ascii=False)[:400])
print('start (walk begins) per dir [max per 100 ms, max off from hand]:', R['start_report'])
print('snap mode for comparison:', R['snap_for_comparison'])
print('ease max off from hand (px):', R['ease_max_off_from_hand'])
print('stop all frames: frames', {d: R['stop_all_frames']['ease'][d]['stop_frames'] for d in HOLD}, '| snap max per 100 ms:', {d: R['stop_all_frames']['snap'][d]['max_per_100ms'] for d in HOLD})
print('ring vs fist per dir {phase: [max px, ms > 3 px]}:', R['ring_vs_fist'])
print('ring vs fist smooth (ease) vs step [max px, ms > 3 px]:', json.dumps(R['ring_vs_fist_compare']))
print('head jump rows 0-43:', R['stop_head_jump_rows0_43'], '| locked walk rows 0-50:', R['stop_head_jump_locked_walk'])
print('TOTAL %d/%d PASS' % (sum(c['pass'] for c in CHECK), len(CHECK)))
