# mutation check for N6b / N5b (v1.1): shift the N hole by 1 art px in the page and confirm the checks see it
import re, sys
from playwright.sync_api import sync_playwright
src = open(sys.argv[1], encoding='utf-8').read()
g = {k: re.search(k + r' = """(.*?)"""', src, re.S).group(1) for k in ('LIB', 'POS', 'ONE')}
with sync_playwright() as p:
    br = p.chromium.launch(); ctx = br.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2.625)
    pages = {}
    for n, port in (('new', 8970), ('sim', 8962)):
        pg = ctx.new_page(); pg.goto('http://127.0.0.1:%d/pilot-g2-motion.html?gm' % port)
        pg.wait_for_function("window.PT&&PT.ST.ok.walkhold&&PT.ST.img.lanternLight&&PT.FX.dark", timeout=20000); pg.evaluate(g['LIB']); pages[n] = pg
    new, sim = pages['new'], pages['sim']
    for mut in ({}, {'cx': 49}, {'cy': 85}, {'cx': 47.5}):
        new.evaluate("(m)=>{PT.NHOLE.cx=48;PT.NHOLE.cy=84;Object.assign(PT.NHOLE,m)}", mut)
        errs, diff = [], 0
        for z in (1, 0.75):
            for px, py in ([160, 120], [97.25, 203.75]):
                st = {'dir': 'N', 'anim': 'idle', 'fi': 0, 'hold': True, 'fx': True, 'power': 100, 'scene': 'cave', 'zoom': z, 'pos': {'x': px, 'y': py}}
                v = new.evaluate('(' + g['POS'] + ')', st); errs.append(max(abs(v['errX']), abs(v['errY'])))
                a = new.evaluate('(' + g['ONE'] + ')', {'c': {'k': 1}, 'st': st}); b = sim.evaluate('(' + g['ONE'] + ')', {'c': {'nh': {'cx': 48, 'cy': 84, 'k': 1}}, 'st': st}); diff += a != b
        print('mutation', mut or 'none', '-> N6b max err', round(max(errs), 3), 'pass' if max(errs) <= 0.5 else 'FAIL', '| N5b differ', diff, 'pass' if diff == 0 else 'FAIL')
    br.close()
