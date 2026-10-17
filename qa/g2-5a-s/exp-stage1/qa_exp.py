#!/usr/bin/env python3
# Stage-1 experiment QA + review sheets (Claude, scratch only, outside the repo). Read-only on sprite files.
# usage: python3 -I qa_exp.py EXP_DIR QA_ASSET13_PY OUT_DIR   (exp page served at http://127.0.0.1:8773/)
import sys, os, io, json, math, hashlib, statistics, time
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

E, QAPY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(OUT, exist_ok=True)
src = open(QAPY).read(); ns = {'math': math}; exec(src[src.index('def lab'):src.index('def hexc')], ns); de00 = ns['de00']
B2 = os.path.join(os.path.dirname(E.rstrip('/')), 'r2crit', 'fv_B2', 'c2-held-lantern_L0-S-trial')
base = np.array(Image.open(B2 + '.png').convert('RGBA')).astype(int); light = np.array(Image.open(B2 + '-light.png').convert('RGBA')).astype(int)
litc = base.copy(); m = light[..., 3] > 0; litc[m] = light[m]
A = json.load(open(os.path.join(E, 'c2-pilot-hold-anchors.json')))
VAR = [('1 B2 baseline (NO GLOW)', (0, 0, 0)), ('2 B2+Glow', (1, 0, 0)), ('3 B2+Glow+C *main*', (1, 1, 0)), ('4 B2+Glow+A', (1, 0, 1)), ('5 B2+Glow+A+C', (1, 1, 1))]
EXTRA = [('A only', (0, 0, 1)), ('C only', (0, 1, 0)), ('A+C only', (0, 1, 1))]   # for "glow fully off when OFF"
SCENES = ['light', 'dark', 'cave']; ZOOMS = [1, 0.75]
R = {'sha256': {}, 'sprite_exact_flat': [], 'cave_uniform': [], 'glow_off_when_off': [], 'C_scope': [], 'separation': [], 'filter_sets': None, 'perf': {}}

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
before = {l.split()[1].split('/')[-1]: l.split()[0] for l in open(os.path.join(E, 'SOURCE_SHA256_BEFORE.txt')) if l.strip()}
for f, p in (('c2-held-lantern_L0-S-trial.png', B2 + '.png'), ('c2-held-lantern_L0-S-trial-light.png', B2 + '-light.png'),
             ('kid-lantern-b2-base.png', os.path.join(E, 'kid-lantern-b2-base.png')), ('kid-lantern-b2-light.png', os.path.join(E, 'kid-lantern-b2-light.png'))):
    R['sha256'][f] = {'before': before.get(f), 'after': sha(p), 'same': before.get(f) == sha(p)}

def render(pg, scene, lit, fx, zoom):
    pg.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:'S',anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:a.z,clean:false,guides:false,blinkNow:false,scene:a.sc,lit:a.lit,fxGlow:!!a.fx[0],fxC:!!a.fx[1],fxA:!!a.fx[2]});PT.draw()}",
                {'sc': scene, 'lit': lit, 'fx': fx, 'z': zoom})
    info = pg.evaluate("({s:PT.ST.last.s,sx:PT.ST.last.sx,sy:PT.ST.last.sy,fx:PT.ST.last.fx,fy:PT.ST.last.fy,lan:PT.ST.lanDraw,lp:PT.ST.lpos,cvw:document.getElementById('cv').width,cvh:document.getElementById('cv').height})")
    im = np.array(Image.open(io.BytesIO(pg.screenshot())).convert('RGB')).astype(int)
    assert im.shape[1] == info['cvw'] and im.shape[0] == info['cvh'], (im.shape, info)
    return im, info

def fist_lan(info):   # fist pixels in lantern coords (S idle f0)
    lx, ly = round(info['lp'][0]), round(info['lp'][1]); fr = A['idle_hold']['S'][0]
    return {(fx - (lx - 16), fy - (ly - 6)) for fx, fy in fr['fist']}

def lan_px(im, info, spr):
    """device px of the lantern's opaque non-fist art px -> (mismatch vs spr colour, non-uniform art px count, art-centre colours)"""
    s = info['s']; _, x0, y0 = info['lan']; fist = fist_lan(info); mism = 0; groups = {}
    X0, Y0 = int(math.floor(x0 + 10 * s)) - 1, int(math.floor(y0 + 4 * s)) - 1
    for Y in range(Y0, int(math.ceil(y0 + 22 * s)) + 1):
        for X in range(X0, int(math.ceil(x0 + 23 * s)) + 1):
            u = math.floor((X + 0.5 - x0) / s); v = math.floor((Y + 0.5 - y0) / s)
            if not (0 <= u < 32 and 0 <= v < 32) or spr[v, u, 3] == 0 or (u, v) in fist: continue
            c = tuple(im[Y, X]); groups.setdefault((u, v), set()).add(c)
            if c != tuple(spr[v, u, :3]): mism += 1
    return mism, sum(1 for g in groups.values() if len(g) > 1), len(groups)

def separation(im, info, spr):   # median dE00 between lantern edge art px and the outside 8-neighbour art px (rows >= 10), sampled at art-px centres
    s = info['s']; _, x0, y0 = info['lan']; fist = fist_lan(info)
    at = lambda u, v: tuple(im[int(y0 + (v + 0.5) * s), int(x0 + (u + 0.5) * s)])
    op = lambda u, v: 0 <= u < 32 and 0 <= v < 32 and spr[v, u, 3] > 0
    vals = []
    for v in range(10, 32):
        for u in range(32):
            if not op(u, v) or (u, v) in fist: continue
            for dv in (-1, 0, 1):
                for du in (-1, 0, 1):
                    if (du or dv) and not op(u + du, v + dv): vals.append(de00(at(u, v), at(u + du, v + dv)))
    Ls = [ns['lab'](at(u, v))[0] for v in range(10, 32) for u in range(32) if op(u, v) and (u, v) not in fist]
    return round(statistics.median(vals), 2), len(vals), round(statistics.mean(Ls), 1)

def crops(im, info):
    s = info['s']; _, x0, y0 = info['lan']; mg = 12
    hb = (int(x0 + (10 - mg) * s), int(y0 + (4 - mg) * s), int(x0 + (23 + mg) * s), int(y0 + (22 + mg) * s))
    hand = Image.fromarray(im[hb[1]:hb[3], hb[0]:hb[2]].astype(np.uint8)); hand = hand.resize((hand.width * 4, hand.height * 4), Image.NEAREST)
    fx, fy = info['fx'], info['fy']; bb = (int(fx - 40 * s), int(fy - 104 * s), int(fx + 40 * s), int(fy + 8 * s))
    body = Image.fromarray(im[bb[1]:bb[3], bb[0]:bb[2]].astype(np.uint8))
    return hand, body

sheets = {}
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8773/exp-lantern.html?hold'); pg.wait_for_function('PT.ST.ok.hold && PT.ST.ok.lantern && PT.FX.ring && PT.FX.ring.length==8', timeout=15000)
    pg.add_style_tag(content='#ui,#pad{display:none!important}')
    for scene in SCENES:
        for zoom in ZOOMS:
            for lit in (False, True):
                spr = litc if lit else base; ims = {}
                for name, fx in VAR + (EXTRA if not lit else []):
                    im, info = render(pg, scene, lit, fx, zoom); ims[name] = (im, info)
                    if name in dict(VAR):
                        sheets[(name, scene, zoom, lit)] = crops(im, info)
                        mism, nonu, n = lan_px(im, info, spr)
                        if scene in ('light', 'dark'): R['sprite_exact_flat'].append({'v': name, 'scene': scene, 'zoom': zoom, 'lit': lit, 'mismatch_dev_px': mism, 'art_px': n})
                        else: R['cave_uniform'].append({'v': name, 'zoom': zoom, 'lit': lit, 'non_uniform_art_px': nonu, 'art_px': n})
                        if scene != 'light' or name.startswith('1'):
                            med, npairs, lm = separation(im, info, spr); R['separation'].append({'v': name, 'scene': scene, 'zoom': zoom, 'lit': lit, 'median_dE00': med, 'pairs': npairs, 'lantern_mean_L': lm})
                if scene in ('light', 'dark'):
                    pg.evaluate("()=>{PT.ST._lan=PT.ST.img.lantern;PT.ST._ll=PT.ST.img.lanternLight;const e=document.createElement('canvas');e.width=256;e.height=128;PT.ST.img.lantern=e;PT.ST.img.lanternLight=e}")
                    for name, fx in VAR:
                        im0, info0 = render(pg, scene, lit, fx, zoom); im1, info1 = ims[name]; s_ = info1['s']; _, x0, y0 = info1['lan']
                        bx = (int(x0 + 10 * s_) - 1, int(y0 + 4 * s_) - 1, int(x0 + 23 * s_) + 2, int(y0 + 22 * s_) + 2)
                        pal = {tuple(c[:3]) for c in np.concatenate([base.reshape(-1, 4), light.reshape(-1, 4)]) if c[3]} | {tuple(c) for c in im0[bx[1]:bx[3], bx[0]:bx[2]].reshape(-1, 3)}
                        newc = {tuple(c) for c in im1[bx[1]:bx[3], bx[0]:bx[2]].reshape(-1, 3)} - pal
                        R.setdefault('blur_new_colours', []).append({'v': name, 'scene': scene, 'zoom': zoom, 'lit': lit, 'new_colours': len(newc)})
                    pg.evaluate("()=>{PT.ST.img.lantern=PT.ST._lan;PT.ST.img.lanternLight=PT.ST._ll}")
                if not lit:   # glow must add nothing when OFF: (glow+X) vs (X) for X in {none, C, A, A+C}
                    for a_, b_ in (('2 B2+Glow', '1 B2 baseline (NO GLOW)'), ('3 B2+Glow+C *main*', 'C only'), ('4 B2+Glow+A', 'A only'), ('5 B2+Glow+A+C', 'A+C only')):
                        R['glow_off_when_off'].append({'scene': scene, 'zoom': zoom, 'pair': a_ + ' vs ' + b_, 'diff_px': int((ims[a_][0] != ims[b_][0]).any(axis=2).sum())})
                for a_, b_ in (('3 B2+Glow+C *main*', '2 B2+Glow'), ('5 B2+Glow+A+C', '4 B2+Glow+A')):   # C scope
                    d = (ims[a_][0] != ims[b_][0]).any(axis=2); info = ims[a_][1]; s = info['s']
                    ys, xs = np.nonzero(d); cell = (info['sx'], info['sy'], info['sx'] + 96 * s, info['sy'] + 96 * s)
                    inside = bool(len(xs) == 0 or (xs.min() >= cell[0] - 1 and ys.min() >= cell[1] - 1 and xs.max() <= cell[2] + 1 and ys.max() <= cell[3] + 1))
                    mk = None
                    if scene == 'cave':
                        ox = info['fx'] - 160 * s; oy = info['fy'] - 120 * s
                        mx0, my0 = int(ox + 52 * s), int(oy + 58 * s); mk = int(d[my0:my0 + int(12 * s) + 2, mx0:mx0 + int(9 * s) + 2].sum())
                    R['C_scope'].append({'scene': scene, 'zoom': zoom, 'lit': lit, 'pair': a_ + ' vs ' + b_, 'diff_px': int(d.sum()),
                                         'diff_bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None,
                                         'player_cell': [round(c) for c in cell], 'inside_cell': inside, 'hidden_marker_diff_px': mk})
    R['filter_sets'] = pg.evaluate('PT.filterSets()'); R['page_errors'] = errs
    # draw cost (mock only): median / p95 ms per PT.draw() incl. a 1-px readback to wait for the GPU, 150 frames, after 20 warm-up
    cdp = pg.context.new_cdp_session(pg)
    for rate in (1, 4):
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate}); R['perf'][str(rate) + 'x'] = {}
        for scene in ('dark', 'cave'):
            for name, fx in VAR:
                ms = pg.evaluate("""(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:'S',anim:'idle',fi:0,hold:true,lpos:null,ldir:null,zoom:1,scene:a.sc,lit:true,fxGlow:!!a.fx[0],fxC:!!a.fx[1],fxA:!!a.fx[2]});
                  const g=document.getElementById('cv').getContext('2d');const t=[];for(let i=0;i<170;i++){const t0=performance.now();PT.draw();g.getImageData(0,0,1,1);if(i>=20)t.push(performance.now()-t0)}
                  t.sort((x,y)=>x-y);return [t[t.length>>1],t[Math.floor(t.length*0.95)]]}""", {'sc': scene, 'fx': fx})
                R['perf'][str(rate) + 'x'][scene + ' · ' + name] = [round(ms[0], 2), round(ms[1], 2)]
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    b.close()
json.dump(R, open(os.path.join(OUT, 'qa-exp.json'), 'w'), indent=1, ensure_ascii=False)

# ---- review sheets: hand x4 per zoom (6 condition rows x 5 variants) · full body per zoom
HEAD = 'FEASIBILITY MOCK (Claude scratch, not repo) - B2 S view - SIZE PREVIEW ONLY - light layer 100% - cave light radius = PLACEHOLDER'
def sheet(kind, zoom, fname):
    rows = []
    for scene in SCENES:
        for lit in (False, True):
            cells = []
            for name, _ in VAR:
                im = sheets[(name, scene, zoom, lit)][0 if kind == 'hand' else 1]
                c = Image.new('RGB', (max(im.width, 230), im.height + 16), (30, 27, 46)); c.paste(im, (0, 16))
                ImageDraw.Draw(c).text((3, 2), '%s | %s %s %d%%' % (name, scene, 'ON' if lit else 'OFF', zoom * 100), fill=(255, 255, 255)); cells.append(c)
            r = Image.new('RGB', (sum(c.width + 5 for c in cells), max(c.height for c in cells)), (255, 255, 255)); x = 0
            for c in cells: r.paste(c, (x, 0)); x += c.width + 5
            rows.append(r)
    W = max(r.width for r in rows); H = sum(r.height + 5 for r in rows) + 22
    out = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(out); d.text((5, 5), HEAD + ' - ' + ('HAND x4' if kind == 'hand' else 'FULL BODY x1'), fill=(40, 20, 50)); y = 22
    for r in rows: out.paste(r, (0, y)); y += r.height + 5
    out.save(os.path.join(OUT, fname)); print(fname, out.size)
for z, tag in ((1, '100'), (0.75, '75')):
    sheet('hand', z, 'exp-hand-x4-%s.png' % tag); sheet('body', z, 'exp-body-%s.png' % tag)

# ---- summary
print('sha256 same:', all(v['same'] for v in R['sha256'].values()))
print('sprite exact (flat scenes) mismatching device px total:', sum(r['mismatch_dev_px'] for r in R['sprite_exact_flat']), 'over', len(R['sprite_exact_flat']), 'renders')
print('cave non-uniform art px:', {('%d%%' % (r['zoom'] * 100), 'ON' if r['lit'] else 'OFF', r['v'][:1]): r['non_uniform_art_px'] for r in R['cave_uniform'] if r['non_uniform_art_px']} or 0)
print('glow-off-when-OFF diff px total:', sum(r['diff_px'] for r in R['glow_off_when_off']), 'over', len(R['glow_off_when_off']), 'pairs')
print('C scope: all inside player cell:', all(r['inside_cell'] for r in R['C_scope']), '· light-scene C diff px:', sum(r['diff_px'] for r in R['C_scope'] if r['scene'] == 'light'),
      '· hidden marker diff px:', [r['hidden_marker_diff_px'] for r in R['C_scope'] if r['scene'] == 'cave'])
print('filter sets:', R['filter_sets'], '· page errors:', R['page_errors'])
print('blur new colours total:', sum(r['new_colours'] for r in R['blur_new_colours']), 'over', len(R['blur_new_colours']))
for r in R['separation']:
    if r['scene'] != 'light': print('sep', r['scene'], '%d%%' % (r['zoom'] * 100), 'ON ' if r['lit'] else 'OFF', r['v'][:1], 'edge dE', r['median_dE00'], 'L', r['lantern_mean_L'])
for k, v in R['perf'].items():
    for kk, vv in v.items(): print('perf', k, kk, vv)
