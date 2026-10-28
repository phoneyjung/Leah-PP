#!/usr/bin/env python3
# O3 small-canvas regression (Claude · 28 Oct 2569 · throwaway copies of claude/g2-pilot @ 4c938cc, no repo change)
# OLD = pilot-g2-motion.html as in 4c938cc · FIX = the same page with the one-line scale() change (o3_scale_fix.diff)
# usage: python3 -I test_o3_small_canvas.py OLD_PORT FIX_PORT OUT_DIR      -> exit 0 only when every FIX check passes
#
# Part E (exact canvas): the canvas is set to an exact height H (width = round(H*844/390)) and draw() is called directly
#   H 0 1 64 191 192 193 383 384 1024 x zoom 100/75 x DPR 1/2.625 x (?gm: light/dark/cave x power 100/10 | no ?gm: light/dark) x 3 poses
# Part V (real viewport): the browser window is resized while the page keeps running (no reload): normal -> small sizes -> normal,
#   then the canvas must equal a freshly loaded page; plus OLD vs FIX pixels on fresh pages at 844x390 and 1180x820
import sys, os, json, base64
from playwright.sync_api import sync_playwright
PO, PF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
PAGES = {'OLD': PO, 'FIX': PF}
HEIGHTS = [0, 1, 64, 191, 192, 193, 383, 384, 1024]
DPRS = [1, 2.625]
POSES = [['idle', 'S', 0], ['walk', 'E', 2], ['idle', 'N', 0]]
MODES = {'gm': {'q': '?gm', 'scenes': ['light', 'dark', 'cave'], 'powers': [100, 10]}, 'nogm': {'q': '', 'scenes': ['light', 'dark'], 'powers': [100]}}
VP_SMALL = {1: [0, 1, 64, 191, 192, 193, 383, 384, 1024], 2.625: [0, 1, 24, 72, 73, 146, 147, 390]}   # DPR 2.625: canvas = round(h*2.625) -> 0 3 63 189 192 383 386 1024
SAVE = {(1, 'gm', 'cave', 191), (1, 'gm', 'light', 191), (1, 'nogm', 'light', 64), (2.625, 'gm', 'cave', 1024), (1, 'gm', 'cave', 64)}

JS_LIB = """window.__O3={
 h(D){let a=2166136261>>>0,b=0x811c9dc5^0x5bd1e995;for(let i=0;i<D.length;i++){a=Math.imul(a^D[i],16777619)>>>0;b=Math.imul(b^D[i],0x01000193^0x2f)>>>0;b=(b<<13|b>>>19)>>>0}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')},
 fin(v){return typeof v==='number'?Number.isFinite(v):Array.isArray(v)?v.every(x=>__O3.fin(x)):v&&typeof v==='object'?Object.values(v).every(x=>__O3.fin(x)):true},
 nums(){const L=PT.ST.last;if(!L)return null;return{s:L.s,fx:L.fx,fy:L.fy,sx:L.sx,sy:L.sy,dx:L.dx,tag:L.tag,headTop:L.headTop||[],lan:L.lantern?{t:L.lantern.target,d:L.lantern.drawn,o:L.lantern.off}:{}}},
 state(gm,sc,pw,z,pose){const st={pos:{x:160,y:120},dir:pose[1],anim:pose[0],fi:pose[2],t:0,lpos:null,ldir:null,lhist:null,zoom:z,clean:false,blinkNow:false,guides:false,moving:false,mv:null};
  if(gm){st.scene=sc;st.power=pw;st.fx=true;st.hold=true}else st.dark=(sc==='dark');PT.pause(true);PT.set(st)},
 snap(){const cv=document.getElementById('cv'),g=cv.getContext('2d');const W=cv.width,H=cv.height;
  return{innerW:innerWidth,innerH:innerHeight,dpr:devicePixelRatio,W,H,s:PT.scale(),lt:PT.ST.lt,nums:__O3.nums(),fin:__O3.fin(__O3.nums()),
   dark:PT.ST.gm&&PT.ST.scene==='cave'?[PT.FX.dark.width,PT.FX.dark.height]:null,hash:W>0&&H>0?__O3.h(g.getImageData(0,0,W,H).data):null}},
 frames(n){return new Promise(r=>{let k=0;const f=()=>{if(++k>=n)r();else requestAnimationFrame(f)};requestAnimationFrame(f)})}};"""

EXACT = """(a)=>{const P=PT,S=P.ST,cv=document.getElementById('cv'),g=cv.getContext('2d'),out=[],img={};
 for(const H of a.heights)for(const z of [1,0.75])for(const sc of a.scenes)for(const pw of a.powers)for(const pose of a.poses){
  const W=Math.round(H*844/390);__O3.state(a.gm,sc,pw,z,pose);cv.width=W;cv.height=H;S.last=null;
  let err=null;try{P.draw()}catch(e){err=e.name+': '+e.message}
  const nums=__O3.nums();const r={H,W,z,sc,pw,pose:pose.join(' '),err,s:P.scale(),fin:nums?__O3.fin(nums):false,nums,
   dark:a.gm&&sc==='cave'?[P.FX.dark.width,P.FX.dark.height]:null,hash:W>0&&H>0?__O3.h(g.getImageData(0,0,W,H).data):null};
  out.push(r);
  if(a.save.includes(H+' '+sc)&&z===1&&pw===100&&pose[1]==='S')img[H+' '+sc]=cv.toDataURL('image/png')}
 return {out,img}}"""

R = {'meta': {'pages': {k: 'http://127.0.0.1:%s/pilot-g2-motion.html' % v for k, v in PAGES.items()}, 'heights': HEIGHTS, 'dprs': DPRS, 'poses': POSES,
              'viewport_small': {str(k): v for k, v in VP_SMALL.items()}}, 'exact': {}, 'viewport': {}, 'fresh': {}, 'pageerrors': {}}
CHECK = []
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name + ' · ' + json.dumps(val, ensure_ascii=False)[:300], flush=True)

def open_page(ctx, port, mode, errs):
    pg = ctx.new_page(); tag = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html%s' % (port, MODES[mode]['q']))
    pg.wait_for_function("window.PT&&PT.ST.ok.walk&&PT.ST.ok.idle&&(!PT.ST.gm||(PT.FX.dark&&PT.ST.ok.lantern))", timeout=20000)
    pg.evaluate(JS_LIB); pg.evaluate("()=>__O3.frames(3)")
    return pg

with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- Part E: exact canvas heights ----------
    for name, port in PAGES.items():
        for dpr in DPRS:
            ctx = br.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=dpr)
            for mode, M in MODES.items():
                errs = []; pg = open_page(ctx, port, mode, errs)
                save = ['%d %s' % (H, sc) for (d_, m_, sc, H) in SAVE if d_ == dpr and m_ == mode]
                res = pg.evaluate(EXACT, {'heights': HEIGHTS, 'scenes': M['scenes'], 'powers': M['powers'], 'poses': POSES, 'gm': mode == 'gm', 'save': save})
                pg.evaluate("()=>__O3.frames(3)")
                for k, url in res['img'].items():
                    open(os.path.join(OUT, 'img', 'exact-%s-dpr%s-%s-%s.png' % (name, dpr, mode, k.replace(' ', '-'))), 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                R['exact']['%s dpr%s %s' % (name, dpr, mode)] = res['out']; R['pageerrors']['exact %s dpr%s %s' % (name, dpr, mode)] = errs
                pg.close()
            ctx.close()
    # ---------- Part V: real viewport, resize without reload ----------
    for name, port in PAGES.items():
        for dpr in DPRS:
            for mode, M in MODES.items():
                for sc in M['scenes']:
                    for z in (1, 0.75):
                        key = '%s dpr%s %s %s z%s' % (name, dpr, mode, sc, z)
                        ctx = br.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=dpr)
                        # fresh page: never shrunk -> reference pixels at 844x390 and 1180x820
                        e0 = []; pf = open_page(ctx, port, mode, e0); pf.evaluate("(a)=>__O3.state(a.gm,a.sc,100,a.z,['idle','S',0])", {'gm': mode == 'gm', 'sc': sc, 'z': z})
                        pf.evaluate("()=>__O3.frames(4)"); f844 = pf.evaluate("()=>__O3.snap()")
                        pf.set_viewport_size({'width': 1180, 'height': 820}); pf.evaluate("()=>__O3.frames(4)"); f1180 = pf.evaluate("()=>__O3.snap()")
                        pf.close(); R['fresh'][key] = {'844x390': f844, '1180x820': f1180}; R['pageerrors']['fresh ' + key] = e0
                        # shrink -> small sizes -> back to 844x390, same page, no reload
                        e1 = []; pg = open_page(ctx, port, mode, e1); pg.evaluate("(a)=>__O3.state(a.gm,a.sc,100,a.z,['idle','S',0])", {'gm': mode == 'gm', 'sc': sc, 'z': z})
                        pg.evaluate("()=>__O3.frames(4)"); steps = []
                        for h in VP_SMALL[dpr] + [390]:
                            lt0 = pg.evaluate("()=>PT.ST.lt"); pg.set_viewport_size({'width': 844, 'height': h})
                            try:
                                pg.evaluate("()=>Promise.race([__O3.frames(5),new Promise(r=>setTimeout(r,1500))])")
                                sn = pg.evaluate("()=>__O3.snap()"); sn['alive'] = sn['lt'] != lt0
                            except Exception as ex:
                                sn = {'exception': str(ex)[:200], 'alive': False}
                            sn['vh'] = h; sn['errs_so_far'] = len(e1); steps.append(sn)
                        R['viewport'][key] = steps; R['pageerrors']['viewport ' + key] = e1
                        if name == 'FIX' and dpr == 1 and mode == 'gm' and sc == 'cave' and z == 1 or name == 'OLD' and dpr == 1 and mode == 'gm' and sc == 'cave' and z == 1:
                            pg.screenshot(path=os.path.join(OUT, 'img', 'after-expand-%s-dpr1-gm-cave.png' % name))
                        pg.close(); ctx.close()
    br.close()

json.dump(R, open(os.path.join(OUT, 'o3-raw.json'), 'w'), ensure_ascii=False)

# ---------- judge ----------
def exact(name): return [dict(r, key=k) for k, rows in R['exact'].items() if k.startswith(name + ' ') for r in rows]
EF, EO = exact('FIX'), exact('OLD')
ok('E1 FIX: draw() throws 0 times (exact canvas, all cases)', sum(1 for r in EF if r['err']) == 0, '%d errors / %d cases' % (sum(1 for r in EF if r['err']), len(EF)))
bad_s = [(r['key'], r['H'], r['z'], r['s']) for r in EF if not (r['s'] > 0 and r['s'] == max(1, int(r['H'] / 384 + 0.5)) * r['z'])]
ok('E2 FIX: s > 0 and s = max(1, round(H/384)) x zoom in every case', not bad_s, '%d bad / %d · s at H<192 = %s' % (len(bad_s), len(EF), sorted({r['s'] for r in EF if r['H'] < 192})))
ok('E3 FIX: no NaN / Infinity in s, feet, sprite, tag, head, lantern numbers', all(r['fin'] for r in EF), '%d / %d finite' % (sum(1 for r in EF if r['fin']), len(EF)))
dk = [r for r in EF if r['dark'] is not None]
ok('E4 FIX: cave darkness layer has a finite size > 0 in every cave case', all(r['dark'][0] > 0 and r['dark'][1] > 0 for r in dk), '%d / %d · smallest %s' % (sum(1 for r in dk if r['dark'][0] > 0 and r['dark'][1] > 0), len(dk), min((tuple(r['dark']) for r in dk), default=None)))
pair = {(r['key'].replace('FIX ', ''), r['H'], r['z'], r['sc'], r['pw'], r['pose']): r for r in EF}
same = diff = 0; dlist = []
for r in EO:
    f = pair[(r['key'].replace('OLD ', ''), r['H'], r['z'], r['sc'], r['pw'], r['pose'])]
    if r['H'] >= 192:
        if r['hash'] == f['hash'] and r['s'] == f['s'] and r['err'] is None and f['err'] is None: same += 1
        else: diff += 1; dlist.append((r['key'], r['H'], r['z'], r['sc'], r['pose']))
ok('E5 OLD vs FIX: identical pixels + same s for every case with H >= 192', diff == 0 and same > 0, '%d same / %d · diff %s' % (same, same + diff, dlist[:5]))
ok('E6 FIX: H < 192 -> s = zoom (1 or 0.75), never 0', all(r['s'] == r['z'] for r in EF if r['H'] < 192), sorted({(r['z'], r['s']) for r in EF if r['H'] < 192}))
# character visible: the 3 poses must draw different pixels (only the pose changes) for H >= 64
grp = {}
for r in EF:
    if r['H'] >= 64: grp.setdefault((r['key'], r['H'], r['z'], r['sc'], r['pw']), set()).add(r['hash'])
vis = sum(1 for v in grp.values() if len(v) == 3)
ok('E7 FIX: character drawn at every H >= 64 (3 poses -> 3 different canvases)', vis == len(grp), '%d / %d groups' % (vis, len(grp)))
# bug reproduced on OLD (proves the test sees it)
old_small = [r for r in EO if r['H'] < 192]
old_cave_err = [r for r in old_small if r['sc'] == 'cave' and r['err']]
old_vis = {}
for r in EO:
    if 64 <= r['H'] < 192: old_vis.setdefault((r['key'], r['H'], r['z'], r['sc'], r['pw']), set()).add(r['hash'])
ok('E8 OLD reproduces O3: s = 0 for H < 192 · cave draw() throws · other scenes draw no character', all(r['s'] == 0 for r in old_small) and len(old_cave_err) == sum(1 for r in old_small if r['sc'] == 'cave') and all(len(v) == 1 for k, v in old_vis.items() if k[3] != 'cave'),
   {'s values': sorted({r['s'] for r in old_small}), 'cave throws': '%d / %d' % (len(old_cave_err), sum(1 for r in old_small if r['sc'] == 'cave')), 'error': (old_cave_err[0]['err'] if old_cave_err else None),
    'non-cave poses identical (blank)': '%d / %d' % (sum(1 for k, v in old_vis.items() if k[3] != 'cave' and len(v) == 1), sum(1 for k in old_vis if k[3] != 'cave')), 'OLD throws outside cave H<192': sum(1 for r in EO if r['err'] and not (r['sc'] == 'cave' and r['H'] < 192))})
# viewport part
VF = {k: v for k, v in R['viewport'].items() if k.startswith('FIX ')}; VO = {k: v for k, v in R['viewport'].items() if k.startswith('OLD ')}
ok('V1 FIX: pageerror 0 (exact + fresh + resize runs)', sum(len(v) for k, v in R['pageerrors'].items() if k.split(' ')[1] == 'FIX') == 0, {'FIX pageerrors': sum(len(v) for k, v in R['pageerrors'].items() if k.split(' ')[1] == 'FIX'), 'FIX runs': sum(1 for k in R['pageerrors'] if k.split(' ')[1] == 'FIX'), 'OLD pageerrors': sum(len(v) for k, v in R['pageerrors'].items() if k.split(' ')[1] == 'OLD')})
ok('V2 FIX: page keeps drawing after every resize (loop alive)', all(s['alive'] for v in VF.values() for s in v), '%d / %d steps' % (sum(1 for v in VF.values() for s in v if s['alive']), sum(len(v) for v in VF.values())))
ok('V3 FIX: s > 0 and numbers finite after every resize', all(s.get('s', 0) > 0 and s.get('fin') for v in VF.values() for s in v), '%d / %d' % (sum(1 for v in VF.values() for s in v if s.get('s', 0) > 0 and s.get('fin')), sum(len(v) for v in VF.values())))
back = [(k, v[-1]['hash'] == R['fresh'][k]['844x390']['hash']) for k, v in VF.items()]
ok('V4 FIX: shrink -> expand without reload = same pixels as a fresh page at 844x390', all(b for _, b in back), '%d / %d' % (sum(1 for _, b in back if b), len(back)))
fr = [(k, sz, R['fresh'][k][sz]['hash'] == R['fresh'][k.replace('FIX ', 'OLD ', 1)][sz]['hash']) for k in R['fresh'] if k.startswith('FIX ') for sz in ('844x390', '1180x820')]
ok('V5 OLD vs FIX fresh pages: identical pixels at 844x390 and 1180x820 (DPR 1/2.625, all scenes, zoom 100/75, ?gm / no ?gm)', all(b for *_, b in fr), '%d / %d' % (sum(1 for *_, b in fr if b), len(fr)))
cv_h = {str(d): sorted({s.get('H') for k, v in VF.items() if ('dpr%s ' % d) in k for s in v}) for d in DPRS}
R['viewport_canvas_heights_seen'] = cv_h
oc = VO['OLD dpr1 gm cave z1']
ok('V6 OLD reproduces O3 (dpr1 ?gm cave): pageerror, page stops drawing, still blank after expanding back', len(R['pageerrors']['viewport OLD dpr1 gm cave z1']) > 0 and not oc[-1]['alive'] and oc[-1]['hash'] != R['fresh']['OLD dpr1 gm cave z1']['844x390']['hash'],
   {'pageerrors': len(R['pageerrors']['viewport OLD dpr1 gm cave z1']), 'first': (R['pageerrors']['viewport OLD dpr1 gm cave z1'] or [''])[0][:120], 'alive after expand': oc[-1]['alive'],
    'old runs that died': sorted(k for k, v in VO.items() if not v[-1]['alive'])})
R['checks'] = CHECK
json.dump({'checks': CHECK, 'viewport_canvas_heights_seen': cv_h}, open(os.path.join(OUT, 'o3-result.json'), 'w'), ensure_ascii=False, indent=1)
n = sum(c['pass'] for c in CHECK); print('O3 TOTAL %d/%d' % (n, len(CHECK)))
sys.exit(0 if n == len(CHECK) else 1)
