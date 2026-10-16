#!/usr/bin/env python3
# G2 Pilot renderOffset experiment (Claude · 16 Oct 2569 · owner: APPROVED FOR PILOT TEST ONLY)
# Runs pilot-g2-motion.html in Chromium (844x390 @ DPR 2.625) and measures A (offset 0) vs B (offset table) from the drawn canvas pixels.
# usage: python3 test_g2_motion_offset.py PORT OUT_DIR   (serve this folder with python3 -m http.server PORT)
import sys, os, json, math
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']; PAIRS = [(DIRS[i], DIRS[(i + 1) % 8]) for i in range(8)]
DPR = 2.625
MEASURE = """() => { const P = PT, L = P.ST.last, cv = document.getElementById('cv'), g = cv.getContext('2d');
  const s = L.s, x0 = Math.max(0, Math.floor(L.sx)), y0 = Math.max(0, Math.floor(L.sy)), w = Math.ceil(96 * s), h = Math.ceil(96 * s);
  const D = g.getImageData(x0, y0, w, h).data; const band = (r0, r1) => { let sx = 0, n = 0, mn = 1e9, mx = -1e9;
    for (let y = Math.floor(r0 * s); y < Math.ceil((r1 + 1) * s) && y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
      if (D[i] === 0 && D[i + 1] === 255 && D[i + 2] === 0) continue; sx += x; n++; if (x < mn) mn = x; if (x > mx) mx = x }
    if (!n) return null; const c = (x0 + sx / n + 0.5 - L.fx) / s + 48; return { c, min: (x0 + mn - L.fx) / s + 48, max: (x0 + mx + 1 - L.fx) / s + 48 } };
  let top = null; for (let y = 0; y < h && top === null; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!(D[i] === 0 && D[i + 1] === 255 && D[i + 2] === 0)) { top = (y0 + y - L.fy) / s + 94; break } }
  return { s, dir: L.dir, anim: L.anim, frame: L.frame, dx: L.dx, body: band(52, 86), contact: band(92, 94), head: band(0, 50), top, tag: L.tag, fx: L.fx, fy: L.fy, headTop: L.headTop, pos: L.pos } }"""
TAB = {'S': 0, 'SE': 0, 'E': 3, 'NE': 1, 'N': 1, 'NW': -1, 'W': -2, 'SW': 0}
MODES = {'A': (False, TAB), 'B': (True, TAB), 'B2': (True, dict(TAB, W=-1))}   # B = formula table · B2 = table in use (W -1, Claude decision 16 Oct under team rule 0.2)
def setf(page, d, anim, fi, off, zoom=1, clean=True, tag='feet'):
    on, tab = MODES[off] if isinstance(off, str) else (off, TAB)
    page.evaluate("(a) => { PT.pause(true); PT.set({dir: a.d, anim: a.anim, fi: a.fi, off: a.off, offTable: a.tab, zoom: a.zoom, clean: a.clean, tag: a.tag, blinkNow: false}); PT.draw() }",
                  {'d': d, 'anim': anim, 'fi': fi, 'off': on, 'tab': tab, 'zoom': zoom, 'clean': clean, 'tag': tag})
    return page.evaluate(MEASURE)
R = {'meta': {'viewport': [844, 390], 'dpr': DPR, 'page': 'pilot-g2-motion.html', 'offset_table': None}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome' if os.path.exists('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') else None)
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=DPR); page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto('http://127.0.0.1:%s/pilot-g2-motion.html' % PORT); page.wait_for_function('PT.ST.ok.walk && PT.ST.ok.idle && PT.ST.ok.anc', timeout=15000)
    R['meta']['offset_table'] = page.evaluate('PT.OFF_TABLE')
    # T1 turn while standing (idle f1) + T5 turn while walking (same walk frame) · both zooms · A/B
    for zoom in (1, 0.75):
        zk = '100' if zoom == 1 else '75'
        for mode in ('A', 'B', 'B2'):
            off = mode
            idle = {d: setf(page, d, 'idle', 0, off, zoom) for d in DIRS}
            s = idle['S']['s']
            R.setdefault('turn_idle', {}).setdefault(zk, {})[mode] = {a + '>' + c: {'sprite_px': round(abs(idle[a]['body']['c'] - idle[c]['body']['c']), 2),
                                                                                  'screen_px': round(abs(idle[a]['body']['c'] - idle[c]['body']['c']) * s, 1),
                                                                                  'css_px': round(abs(idle[a]['body']['c'] - idle[c]['body']['c']) * s / DPR, 1)} for a, c in PAIRS}
            wj = {}
            for a, c in PAIRS:
                js = []
                for k in range(6):
                    ma = setf(page, a, 'walk', k, off, zoom); mc = setf(page, c, 'walk', k, off, zoom); js.append(abs(ma['body']['c'] - mc['body']['c']))
                wj[a + '>' + c] = {'max_sprite_px': round(max(js), 2), 'mean_sprite_px': round(sum(js) / 6, 2)}
            R.setdefault('turn_walk', {}).setdefault(zk, {})[mode] = wj
    # T2 feet contact vs shadow centre (logical feet) · T3 name tag (two policies) · zoom 100
    for mode in ('A', 'B', 'B2'):
        off = mode; fc = {}; tags = {'feet': {}, 'head': {}}
        for d in DIRS:
            vals = []
            for anim, nf in (('idle', 4), ('walk', 6)):
                for k in range(nf):
                    m = setf(page, d, anim, k, off)
                    if m['contact']: vals.append(m['contact']['c'] - 48)
            fc[d] = {'mean': round(sum(vals) / len(vals), 2), 'max_abs': round(max(abs(v) for v in vals), 2)}
            for pol in ('feet', 'head'):
                xs = []
                for anim, loop in (('idle', [0, 1, 2, 1]), ('walk', [0, 1, 2, 3, 4, 5])):
                    for k in loop:
                        on, tab = MODES[off]
                        page.evaluate("(a)=>{PT.pause(true);PT.set({dir:a.d,anim:a.anim,fi:a.fi,off:a.off,offTable:a.tab,zoom:1,clean:false,tag:a.pol,blinkNow:false});PT.draw()}", {'d': d, 'anim': anim, 'fi': k, 'off': on, 'tab': tab, 'pol': pol})
                        L = page.evaluate('PT.ST.last'); xs.append(((L['tag'][0] - L['fx']) / L['s'], (L['tag'][1] - L['fy']) / L['s']))
                tags[pol][d] = {'x_range': round(max(x for x, _ in xs) - min(x for x, _ in xs), 2), 'y_range': round(max(y for _, y in xs) - min(y for _, y in xs), 2),
                                'x_mean': round(sum(x for x, _ in xs) / len(xs), 2), 'gap_above_head_px': None}
        R.setdefault('feet_vs_shadow', {})[mode] = fc
        R.setdefault('name_tag', {})[mode] = tags
    # tag turn jumps (x mean per dir) and tag clearance over the head (tag bottom vs highest head pixel, sprite px)
    for mode in ('A', 'B', 'B2'):
        for pol in ('feet', 'head'):
            t = R['name_tag'][mode][pol]; R['name_tag'][mode][pol + '_turn_jump_max'] = round(max(abs(t[a]['x_mean'] - t[c]['x_mean']) for a, c in PAIRS), 2)
    # T4 walk -> stop (entry f3) and idle -> walk, head/body jump · B only (offset is the same on both sides of a same-direction switch)
    ws = {}
    for d in DIRS:
        idle = [setf(page, d, 'idle', k, True) for k in (0, 1, 2)]; walkf = [setf(page, d, 'walk', k, True) for k in range(6)]
        ws[d] = {'start_head_max': round(max(abs(i['head']['c'] - walkf[0]['head']['c']) for i in idle), 2),
                 'stop_head_max_entry_f3': round(max(abs(w['head']['c'] - idle[2]['head']['c']) for w in walkf), 2),
                 'stop_body_max_entry_f3': round(max(abs(w['body']['c'] - idle[2]['body']['c']) for w in walkf), 2)}
    R['walk_stop'] = ws
    se = {}
    for d in DIRS:
        page.evaluate("(d)=>{PT.pause(true);PT.set({dir:d,anim:'walk',fi:3,clean:false});PT.stop()}", d)
        se[d] = page.evaluate("()=>PT.ST.anim==='idle'&&PT.curFrame()===2")
    R['stop_enters_f3'] = {'ok': sum(se.values()), 'of': 8}
    # T6 world position + collision identical A vs B (deterministic steps, walk into the wall)
    script = [('E', 4000), ('N', 700), ('E', 1500), ('S', 1200), ('W', 900), ('SE', 800), ('stop', 300)]
    def run(off):
        page.evaluate("(o)=>{PT.pause(true);PT.set({pos:{x:160,y:120},off:o,anim:'idle',fi:0,t:0,moving:false})}", off); trace = []
        for d, ms in script:
            if d == 'stop': page.evaluate('PT.stop()')
            else: page.evaluate('(d)=>PT.walk(d)', d)
            for _ in range(ms // 16): page.evaluate('PT.step(16)')
            trace.append(page.evaluate('[PT.ST.pos.x, PT.ST.pos.y]'))
        return trace
    ta, tb = run(False), run(True)
    R['world'] = {'trace_A': ta, 'trace_B': tb, 'max_diff': max(abs(a[0] - b_[0]) + abs(a[1] - b_[1]) for a, b_ in zip(ta, tb)), 'wall_stopped_x': ta[0][0]}
    # T7 blink timing (simulated 90 s idle, S) and back dirs
    page.evaluate("()=>{PT.pause(true);PT.set({dir:'S',anim:'idle',fi:0,t:0,moving:false,blinkClock:0,blinks:[],blinkAt:4000})}")
    shown = []; tt = 0
    for _ in range(int(90000 / 16)):
        page.evaluate('PT.step(16)'); tt += 16
        if page.evaluate('PT.curFrame()') == 3 and (not shown or tt - shown[-1] > 400): shown.append(tt)
    iv = [round((b_ - a) / 1000, 2) for a, b_ in zip(shown, shown[1:])]
    R['blink'] = {'count_90s': len(shown), 'interval_s_min': min(iv) if iv else None, 'interval_s_max': max(iv) if iv else None}
    page.evaluate("()=>{PT.set({dir:'N',blinkNow:true,anim:'idle',fi:3})}"); R['blink']['back_dir_f4_shown'] = page.evaluate('PT.curFrame()') == 3
    # screenshots: A/B, zoom 100/75, light/dark, guides on, idle f1 for each dir
    for zoom, zk in ((1, '100'), (0.75, '75')):
        for dark in (False, True):
            for mode in ('A', 'B', 'B2'):
                on, tab = MODES[mode]
                for d in DIRS:
                    page.evaluate("(a)=>{PT.pause(true);PT.set({pos:{x:160,y:120},dir:a.d,anim:'idle',fi:0,off:a.off,offTable:a.tab,shadowFollow:a.sf,zoom:a.z,clean:false,dark:a.dark,guides:true,tag:'feet',blinkNow:false});PT.draw()}",
                                  {'d': d, 'off': on, 'tab': tab, 'sf': mode == 'B2', 'z': zoom, 'dark': dark})
                    page.screenshot(path=os.path.join(OUT, 'shot-%s-z%s-%s-%s.png' % (mode, zk, 'dark' if dark else 'light', d)), clip={'x': 422 - 60, 'y': 195 - 140 * zoom, 'width': 120, 'height': 160 * zoom + 10})
    # T9 fallbacks: missing files -> no white screen, no page errors
    fb = {}
    for name, pat in (('idle_png', '**/c2-pilot-kid4-idleanim.png'), ('walk_png', '**/c2-pilot-kid4-walk.png'), ('anchors', '**/c2-pilot-anchors.json'), ('all', '**/c2-pilot-*')):
        pg = ctx.new_page(); errs = []; cons = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: cons.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        pg.route(pat, lambda r: r.abort()); pg.goto('http://127.0.0.1:%s/pilot-g2-motion.html' % PORT); pg.wait_for_timeout(1200)
        pg.screenshot(path=os.path.join(OUT, 'fallback-%s.png' % name))
        pg.evaluate("()=>PT.walk('E')"); pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(OUT, 'fallback-%s-walking.png' % name)); walking_img = pg.evaluate("()=>!!(PT.ST.img.walk||PT.ST.img.idle)")
        im = np.array(Image.open(os.path.join(OUT, 'fallback-%s.png' % name)).convert('RGB')); white = float((im.min(-1) > 250).mean())
        fb[name] = {'page_errors': len(errs), 'console_errors': len(cons), 'white_fraction': round(white, 3), 'drawn_something': bool(pg.evaluate('!!PT.ST.last')), 'walking_uses_sprite': walking_img}
        pg.close()
    R['fallback'] = fb
    # T2b foot pixels (rows 92-94) outside the shadow ellipse (half width 14 art px) · shadow fixed at logical feet or following renderOffset
    EXT = """()=>{const L=PT.ST.last,cv=document.getElementById('cv'),g=cv.getContext('2d'),s=L.s,x0=Math.floor(L.sx),y0=Math.floor(L.sy),w=Math.ceil(96*s),h=Math.ceil(96*s),D=g.getImageData(x0,y0,w,h).data;
      let mn=1e9,mx=-1e9;for(let y=Math.floor(92*s);y<Math.ceil(95*s)&&y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(D[i]===0&&D[i+1]===255&&D[i+2]===0)continue;mn=Math.min(mn,x);mx=Math.max(mx,x)}
      return {cmin:(x0+mn-L.fx)/s,cmax:(x0+mx+1-L.fx)/s}}"""
    fs = {}
    for name, mode, follow in (('A_fixed', 'A', False), ('B_fixed', 'B', False), ('B_follow', 'B', True), ('B2_follow', 'B2', True)):
        on, tab = MODES[mode]; out_n = 0; worst = 0; n = 0
        for d in DIRS:
            for anim, nf in (('idle', 4), ('walk', 6)):
                for k in range(nf):
                    setf(page, d, anim, k, mode); m = page.evaluate(EXT); c0 = (tab[d] if (on and follow) else 0); n += 1
                    o = max(0, -14 - (m['cmin'] - c0), (m['cmax'] - c0) - 14); worst = max(worst, o); out_n += o > 0
        fs[name] = {'frames': n, 'frames_with_foot_outside_shadow': out_n, 'worst_outside_px': round(worst, 2)}
    R['feet_outside_shadow'] = fs
    R['page_errors'] = errors
    b.close()
json.dump(R, open(os.path.join(OUT, 'offset-test.json'), 'w'), indent=1)
# verdict
ti = R['turn_idle']; tw = R['turn_walk']
R2 = {}
for zk in ('100', '75'):
    for mode in ('A', 'B', 'B2'):
        R2['idle_turn_max_%s_%s' % (zk, mode)] = max(v['sprite_px'] for v in ti[zk][mode].values())
        R2['walk_turn_max_%s_%s' % (zk, mode)] = max(v['max_sprite_px'] for v in tw[zk][mode].values())
print(json.dumps(R2, indent=0))
print('turn idle 100:', {k: (ti['100']['A'][k]['sprite_px'], ti['100']['B'][k]['sprite_px']) for k in ti['100']['A']})
print('feet vs shadow A', R['feet_vs_shadow']['A']); print('feet vs shadow B', R['feet_vs_shadow']['B'])
print('tag A feet/head jump', R['name_tag']['A']['feet_turn_jump_max'], R['name_tag']['A']['head_turn_jump_max'], '| B', R['name_tag']['B']['feet_turn_jump_max'], R['name_tag']['B']['head_turn_jump_max'])
print('tag head-policy x_range per dir B', {d: R['name_tag']['B']['head'][d]['x_range'] for d in DIRS})
print('walk_stop', R['walk_stop']); print('stop enters', R['stop_enters_f3']); print('world', R['world']['max_diff'], R['world']['trace_A'][-1], R['world']['trace_B'][-1], 'wall x', R['world']['wall_stopped_x'])
print('feet outside shadow', R['feet_outside_shadow']); print('blink', R['blink']); print('fallback', R['fallback']); print('page errors', R['page_errors'][:5])
