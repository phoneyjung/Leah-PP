#!/usr/bin/env python3
# G2.3 S5 portrait Pilot page test (Claude · 1 Nov 2569) · ASSET_SPEC_14 v1.1 section 4.7 (screen) + page = Python renderer + fallbacks.
# Runs pilot-g2-portrait.html in Chromium on the phone sizes of 4.7 (740x360 / 844x390 / 915x412 at DPR 2 / 2.625 / 3) and iPad 1180x820 @ 2.
# usage: python3 -I test_g2_portrait.py PORT OUT_DIR      (exit 0 = all PASS)
import sys, os, json
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
PORT, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import qa_asset09_a3 as q
URL = 'http://127.0.0.1:%s/pilot-g2-portrait.html?gm' % PORT
GROUP = {3: 'skin', 4: 'hair', 5: 'iris', 8: 'house'}
pt = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-pt.png')).convert('RGBA'))
mk = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-pt-mask.png')).convert('RGBA'))
SM = json.load(open(os.path.join(HERE, 'c2-pilot-kid4-pt-shademap.json')))
IDX = {m: np.array(SM['materials'][str(m)]['shade_index_by_G']) for m in GROUP}
SA = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-idleanim.png')).convert('RGBA'))[0:96, 0:96]
SK = np.array(Image.open(os.path.join(HERE, 'c2-pilot-kid4-idleanim-mask.png')).convert('RGBA'))[0:96, 0:96]
def py_render(o):
    out = pt.copy(); R, G = mk[..., 0].astype(int), mk[..., 1].astype(int)
    for m, g in GROUP.items(): s = R == m; out[s, :3] = q.ramp_arr(g, o[g])[IDX[m][G[s]]]
    return out
CHECK = []; errs = []
def ok(name, cond, val): CHECK.append({'check': name, 'pass': bool(cond), 'value': val}); print(('PASS ' if cond else 'FAIL ') + name, '|', json.dumps(val, ensure_ascii=False)[:300], flush=True)
SETS = ['Brown/Green/Medium/Wing', 'Black/Brown/Light/Sun', 'Blonde/Blue/Deep/Sun', 'Red/Amber/Tan/Leaf', 'Pink/Black/Medium/Flame', 'Blue/Green/Light/Leaf',
        'Silver/Amber/Deep/Wing', 'Green/Blue/Tan/Flame', 'Black/Amber/Deep/Leaf', 'Blonde/Brown/Light/Flame', 'Brown/Amber/Tan/Sun', 'Red/Green/Deep/Flame',
        'Pink/Blue/Light/Wing', 'Blue/Brown/Medium/Sun', 'Silver/Black/Tan/Leaf', 'Green/Black/Medium/Wing']
def opts(s):
    h, e, k, u = s.split('/'); n = lambda g, x: [a for a, _ in q.RAMPS[g]].index(x)
    return {'hair': n('hair', h), 'iris': n('iris', e), 'skin': n('skin', k), 'house': n('house', u)}
GEO = """()=>{const V=PT.view(),d=devicePixelRatio;const art=[V.x/d,V.y/d,(V.x+384*V.k)/d,(V.y+384*V.k)/d],kid=[V.kx/d,V.ky/d,(V.kx+96*V.k2)/d,(V.ky+96*V.k2)/d];
  const bs=[...document.querySelectorAll('.sw')];const out={V,small:[],covered:[],overlapArt:[],overlapBtn:0,blitBad:PT.checkBlit()};
  const hitR=(c,r)=>c.left<r[2]&&r[0]<c.right&&c.top<r[3]&&r[1]<c.bottom,hit=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
  bs.forEach((b,i)=>{b.scrollIntoView({block:'nearest'});const c=b.getBoundingClientRect();if(c.width<44||c.height<44)out.small.push(i);
    const e=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);if(!(e===b||b.contains(e)))out.covered.push(i);if(hitR(c,art)||hitR(c,kid))out.overlapArt.push(i);
    bs.forEach((b2,j)=>{if(j>i&&hit(c,b2.getBoundingClientRect()))out.overlapBtn++})});
  const pan=document.getElementById('panel').getBoundingClientRect();out.panelHitsArt=hitR(pan,art)||hitR(pan,kid);
  out.artInView=V.x>=0&&V.y>=0&&V.x+384*V.k<=V.cw&&V.y+384*V.k<=V.ch&&V.kx+96*V.k2<=V.cw&&V.ky>=0;out.buttons=bs.length;return out}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    def page(vw, vh, dpr, block=None, collect=True):
        c = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr, has_touch=True); pg = c.new_page()
        for pat in block or []: pg.route(pat, lambda r: r.abort())
        pg.on('pageerror', lambda e: errs.append('pageerror ' + str(e)))
        if collect and not block: pg.on('console', lambda m: errs.append('console ' + m.text) if m.type == 'error' else None)
        pg.goto(URL); pg.wait_for_function('window.PT&&PT.S.ready', timeout=20000); return c, pg
    # ---- 4.7 screens: whole device-pixel scale, positions on whole device px, buttons >= 44 CSS px, not covered, not over the art ----
    geo = {}
    for vw, vh, dpr in [(740, 360, 2), (844, 390, 2.625), (915, 412, 3), (740, 360, 3), (915, 412, 2.625), (1180, 820, 2), (390, 844, 3)]:
        c, pg = page(vw, vh, dpr); g = pg.evaluate(GEO); pg.screenshot(path=os.path.join(OUT, 'pt-%dx%d@%s.png' % (vw, vh, dpr))); c.close()
        V = g['V']; whole = all(float(V[k]).is_integer() for k in ('x', 'y', 'kx', 'ky', 'k', 'k2'))
        g['ok'] = (whole and V['k'] >= 1 and abs(V['ratioW'] - 1) < 2e-3 and abs(V['ratioH'] - 1) < 2e-3 and g['blitBad'] == 0 and g['artInView'] and not g['small'] and not g['covered']
                   and not g['overlapArt'] and g['overlapBtn'] == 0 and not g['panelHitsArt'] and g['buttons'] == 21)
        geo['%dx%d@%s' % (vw, vh, dpr)] = {'k': V['k'], 'k2': V['k2'], 'ok': g['ok'], 'ratio': [round(V['ratioW'], 5), round(V['ratioH'], 5)], 'blitBad': g['blitBad'],
                                           'small': g['small'], 'covered': g['covered'], 'overlapArt': g['overlapArt'], 'overlapBtn': g['overlapBtn'], 'panelHitsArt': g['panelHitsArt']}
    ok('S5-4.7 screens 740x360 / 844x390 / 915x412 at DPR 2 / 2.625 / 3 (+ iPad, upright phone): one canvas = stage in device px (CSS x DPR / canvas = 1 +- 0.002), portrait 384 x whole k and kid 96 x whole k2 at whole offsets, every art device px = its art px (0 wrong), '
       '21 colour buttons >= 44 CSS px, none covered (after scrolling the panel), none over the art, none overlapping', all(v['ok'] for v in geo.values()), geo)
    # ---- page renderer = Python renderer (16 sets, portrait 384 x 384 and kid 96 x 96, exact RGBA) ----
    c, pg = page(844, 390, 2.625); diffs = {}
    for s in SETS:
        o = opts(s); pg.evaluate('o=>PT.set(o)', o)
        a = np.array(pg.evaluate('PT.ptPixels()'), np.uint8).reshape(384, 384, 4); k = np.array(pg.evaluate('PT.kidPixels()'), np.uint8).reshape(96, 96, 4)
        ka = q.render(SA, SK[..., 0], SK[..., 1], o).copy(); ka[ka[..., 3] == 0] = 0   # canvas reads transparent px as (0,0,0,0)
        diffs[s] = [int((a != py_render(o)).any(2).sum()), int((k != ka).any(2).sum())]
    ok('S5-r page colours = Python renderer (shade map D-PT-3) for all 16 sets: portrait px different 0 · in-game kid px different 0', all(v == [0, 0] for v in diffs.values()), diffs)
    # ---- real taps change the colour ----
    btn = pg.locator('.sw[data-group=hair][data-i="2"]'); btn.scroll_into_view_if_needed(); bb = btn.bounding_box()
    before = np.array(pg.evaluate('PT.ptPixels()'), np.uint8); pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.wait_for_timeout(100)
    after = np.array(pg.evaluate('PT.ptPixels()'), np.uint8).reshape(384, 384, 4); st = pg.evaluate("[PT.S.opts.hair,document.querySelector('.sw[data-group=hair][data-i=\"2\"]').getAttribute('aria-pressed')]")
    want = py_render(dict(pg.evaluate('PT.S.opts')))
    ok('S5-t tap the Blonde hair button: hair option 2, button pressed, portrait = Python render of the new set', st == [2, 'true'] and (after == want).all() and (before.reshape(384, 384, 4) != after).any(), {'state': st})
    pg.screenshot(path=os.path.join(OUT, 'pt-after-tap.png')); c.close()
    # ---- fallbacks: page never white / never stuck ----
    fb = {}
    for name, blk in [('portrait png', ['**/c2-pilot-kid4-pt.png']), ('mask png', ['**/c2-pilot-kid4-pt-mask.png']), ('shade map', ['**/c2-pilot-kid4-pt-shademap.json']),
                      ('kid files', ['**/c2-pilot-kid4-idleanim*.png']), ('every file', ['**/c2-pilot-kid4-*'])]:
        c, pg = page(844, 390, 2.625, block=blk)
        r = pg.evaluate("()=>{PT.set({hair:5});const a=PT.ptPixels();let lit=0;for(let i=3;i<a.length;i+=4)if(a[i])lit++;return{warn:PT.S.warn,warnShown:getComputedStyle(document.getElementById('warn')).display!=='none',drawnPx:lit,errors:PT.S.errors,buttons:document.querySelectorAll('.sw').length}}")
        fb[name] = r; c.close()
    good = (fb['portrait png']['warn'][:1] == ['noPt'] and fb['mask png']['warn'] == ['noMask'] and fb['shade map']['warn'] == ['noMap'] and fb['kid files']['warn'] == ['noKid']
            and all(v['warnShown'] and v['drawnPx'] > 0 and not v['errors'] and v['buttons'] == 21 for v in fb.values()))
    # half-written shade map (wrong length) -> treated as missing
    c, pg = page(844, 390, 2.625, collect=False)
    bad = json.loads(json.dumps(SM)); bad['materials']['4']['shade_index_by_G'] = bad['materials']['4']['shade_index_by_G'][:3]
    pg.route('**/c2-pilot-kid4-pt-shademap.json', lambda r: r.fulfill(status=200, body=json.dumps(bad), content_type='application/json')); pg.reload(); pg.wait_for_function('window.PT&&PT.S.ready')
    half = pg.evaluate('[PT.S.warn,PT.S.errors]'); c.close(); fb['half shade map'] = half
    ok('S5-f missing / broken files (portrait · mask · shade map · kid · every file · half-written shade map): a frame or the portrait as drawn is shown, a TH+EN note, 21 buttons, no error',
       good and half == [['noMap'], []], fb)
    b.close()
ok('S5-e JS errors 0 across every load (page errors + console errors; blocked-file loads count page errors only)', not errs, errs[:5])
p_ = sum(c['pass'] for c in CHECK); json.dump({'checks': CHECK, 'passed': p_, 'total': len(CHECK)}, open(os.path.join(OUT, 'results.json'), 'w'), ensure_ascii=False, indent=1)
print('%d/%d' % (p_, len(CHECK))); sys.exit(0 if p_ == len(CHECK) else 1)
