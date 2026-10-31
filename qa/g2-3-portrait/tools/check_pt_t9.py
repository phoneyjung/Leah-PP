#!/usr/bin/env python3
# G2.3 T9 acceptance checker (Claude · 1 Nov 2569) for ASSET_SPEC_14 v1.1 section 4 items 1-5.
# Codex runs it before sending; Claude runs it on the branch. Exit 0 = every check PASS, exit 1 = any FAIL.
# The expected mask comes from pt_mask_ref.py (the written rules in pt-rules.json), never from the files being checked.
# usage: python3 -I check_pt_t9.py REPO_ROOT [OUT.json]
#        python3 -I check_pt_t9.py REPO_ROOT --selftest      (the checker must PASS a correct set and FAIL each of 12 broken sets)
import sys, os, json, hashlib, shutil, tempfile, copy
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pt_mask_ref as ref

QA = 'qa/g2-3-portrait/'
F_PT, F_ED, F_MK, F_MJ = 'c2-pilot-kid4-pt.png', 'c2-pilot-kid4-pt-edits.json', 'c2-pilot-kid4-pt-mask.png', 'c2-pilot-kid4-pt-mask.json'
F_IMG = [QA + 'img/pt-edits-x4.png', QA + 'img/pt-mask-ids.png']
OPAQUE_AFTER, EXT_RING = 70133, 1172

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def hx(c): return '#%02X%02X%02X' % tuple(int(v) for v in c[:3])

def check(root, rules, src_path):
    C = []
    def ok(name, cond, val=None): C.append({'check': name, 'pass': bool(cond), 'value': val})
    J = lambda p: os.path.join(root, p)
    src = np.array(Image.open(src_path).convert('RGBA'))
    ok('4.1a source file unchanged (SHA-256)', sha(src_path) == rules['source_sha256'], sha(src_path))
    exp_a, exp_R, exp_G, info = ref.build(rules, src)
    try:
        im = Image.open(J(F_PT)); pt = np.array(im.convert('RGBA'))
        ok('4.1b %s is 384 x 384 RGBA, alpha only 0 / 255' % F_PT, im.size == (384, 384) and set(np.unique(pt[..., 3]).tolist()) <= {0, 255},
           {'size': im.size, 'mode': im.mode, 'alpha': sorted(np.unique(pt[..., 3]).tolist())})
    except Exception as e:
        ok('4.1b %s readable' % F_PT, False, str(e)); return C
    holes = {(x, y) for x0, y0, x1, y1 in rules['holes']['boxes'] for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
    diff = {(int(x), int(y)) for y, x in zip(*np.where((pt != src).any(2)))}
    want = [int(rules['holes']['colour'][k:k + 2], 16) for k in (1, 3, 5)] + [255]
    ok('4.2a pixels that differ from the source = exactly the 50 hole pixels, each now %s alpha 255' % rules['holes']['colour'],
       diff == holes and all(list(pt[y, x]) == want and src[y, x, 3] == 0 for x, y in holes), {'differ': len(diff), 'extra': sorted(diff - holes)[:10], 'missing': sorted(holes - diff)[:10]})
    try:
        E = json.load(open(J(F_ED))); ed = E['edits']
        keys = [(e['x'], e['y']) for e in ed]
        side = lambda x: 'hole-left' if x < 192 else 'hole-right'
        good = (E.get('schema') == 1 and E.get('source') == os.path.basename(src_path) and E.get('source_sha256') == rules['source_sha256'] and len(ed) == 50
                and len(set(keys)) == 50 and set(keys) == holes and all(list(e['before']) == [int(v) for v in src[e['y'], e['x']]] and list(e['after']) == [int(v) for v in pt[e['y'], e['x']]]
                and e.get('why') == side(e['x']) for e in ed))
        rep = src.copy(); rev = pt.copy()
        for e in ed: rep[e['y'], e['x']] = e['after']; rev[e['y'], e['x']] = e['before']
        ok('4.2b edits json: 50 entries, no repeats, = the hole set, before/after match the images, why = hole-left/right · replay = %s · revert = source' % F_PT,
           good and (rep == pt).all() and (rev == src).all(), {'entries': len(ed), 'unique': len(set(keys))})
    except Exception as e:
        ok('4.2b edits json readable and complete', False, str(e))
    op = pt[..., 3] == 255
    lab, n = ndimage.label(~op); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    enclosed = [i for i in range(1, n + 1) if i not in edge]
    ext = np.isin(lab, list(edge)) & ~op; ring = op & ndimage.binary_dilation(ext, structure=np.ones((3, 3)))
    white = ring & (pt[..., 0] > 230) & (pt[..., 1] > 230) & (pt[..., 2] > 230)
    ok('4.3 enclosed transparent areas 0 · half-transparent 0 · opaque %d · exterior ring %d px · near-white (all > 230) on it 0' % (OPAQUE_AFTER, EXT_RING),
       not enclosed and op.sum() == OPAQUE_AFTER and ring.sum() == EXT_RING and not white.any(),
       {'enclosed': len(enclosed), 'opaque': int(op.sum()), 'ext_ring': int(ring.sum()), 'near_white_on_ring': int(white.sum())})
    try:
        mi = Image.open(J(F_MK)); mk = np.array(mi.convert('RGBA'))
    except Exception as e:
        ok('4.4a %s readable' % F_MK, False, str(e)); return C
    R, G, B, A = (mk[..., k].astype(int) for k in range(4))
    ok('4.4a mask 384 x 384 · A 255 exactly on the opaque pixels of %s · transparent pixels (0,0,0,0) · B 0 everywhere' % F_PT,
       mi.size == (384, 384) and ((A == 255) == op).all() and ((A == 0) == ~op).all() and not mk[~op].any() and not B.any(),
       {'size': mi.size, 'A_mismatch': int(((A == 255) != op).sum()), 'B_nonzero': int((B != 0).sum()), 'transparent_not_zero': int(mk[~op].any(1).sum())})
    badR = op & (R != exp_R); badG = op & (G != exp_G)
    first = lambda m_: [[int(x), int(y), int(R[y, x]), int(exp_R[y, x])] for y, x in list(zip(*np.where(m_)))[:20]]
    ok('4.4b R = material id 1-11 on every opaque pixel and = the rule result (pt-rules.json) at 100 %', op.sum() and ((R >= 1) & (R <= 11))[op].all() and not badR.any(),
       {'wrong_px': int(badR.sum()), 'first_x_y_got_want': first(badR)})
    ok('4.4c G = shade rank by Y in each material (id 10: mouth 0-15 / cheek 16-31) and = the rule result at 100 %', not badG.any(),
       {'wrong_px': int(badG.sum()), 'first': [[int(x), int(y), int(G[y, x]), int(exp_G[y, x])] for y, x in list(zip(*np.where(badG)))[:20]]})
    try:
        MJ = json.load(open(J(F_MJ))); M = MJ['materials']; em = info['materials']
        same = MJ.get('schema') == 1 and MJ.get('file') == F_MK and MJ.get('image') == F_PT and MJ.get('image_sha256') == sha(J(F_PT)) and set(M) == set(em)
        for k in em:
            if not same: break
            if k == '10': same = all(M[k]['parts'][p_]['g0'] == em[k]['parts'][p_]['g0'] and M[k]['parts'][p_]['shades'] == em[k]['parts'][p_]['shades']
                                    and M[k]['parts'][p_]['px'] == em[k]['parts'][p_]['px'] for p_ in ('mouth', 'cheek'))
            else: same = M[k]['shades'] == em[k]['shades'] and M[k]['px'] == em[k]['px']
        # every opaque pixel: its colour = the json colour at its (R, G)
        look = 0
        if same:
            for y, x in zip(*np.where(op)):
                r_, g_ = str(int(R[y, x])), int(G[y, x])
                if r_ == '10':
                    p_ = 'mouth' if g_ < 16 else 'cheek'; sh = M['10']['parts'][p_]['shades']; i_ = g_ - M['10']['parts'][p_]['g0']
                else: sh = M[r_]['shades']; i_ = g_
                if not (0 <= i_ < len(sh)) or sh[i_] != hx(pt[y, x]): look += 1
        tot = sum(sum(v['px']) if k != '10' else sum(sum(p_['px']) for p_ in v['parts'].values()) for k, v in M.items())
        ok('4.4d mask json: schema 1, file names, image SHA, every material shade list (dark -> light) and px count = the rule result · every pixel colour = json shade at its (R, G) · px total = opaque',
           same and look == 0 and tot == int(op.sum()), {'materials': sorted(M, key=int), 'pixels_not_matching_json': look, 'px_total': tot})
    except Exception as e:
        ok('4.4d mask json readable and complete', False, str(e))
    cp = [(n_, x, y, e) for n_, (x, y, e) in rules['checkpoints'].items()]
    miss = [[n_, x, y, int(R[y, x]), e] for n_, x, y, e in cp if int(R[y, x]) != e] + [['RULE ' + n_, x, y, int(exp_R[y, x]), e] for n_, x, y, e in cp if int(exp_R[y, x]) != e]
    ok('4.4e %d hand-picked check points (eyes, iris, cheeks, mouth, brows, ears, neck, hair, holes, cape, shirt, copper, leather, lines) have the id Claude chose by eye' % len(cp), not miss, miss)
    ex = [p_ for p_ in F_IMG if os.path.isfile(J(p_))]
    okimg = True
    for p_ in ex:
        try: Image.open(J(p_)).verify()
        except Exception: okimg = False
    ok('4.4f review images present and readable: ' + ', '.join(F_IMG), len(ex) == len(F_IMG) and okimg, ex)
    return C

def write_set(root, rules, src_path, mutate=None):
    """a correct delivery built from the rules (used by --selftest only), then one mutation"""
    src = np.array(Image.open(src_path).convert('RGBA')); a, R, Gm, info = ref.build(rules, src)
    mk = ref.mask_png(R, Gm, a[..., 3] == 255)
    ed = [{'x': x, 'y': y, 'before': [int(v) for v in src[y, x]], 'after': [int(v) for v in a[y, x]], 'why': 'hole-left' if x < 192 else 'hole-right'} for x, y in info['edits']]
    E = {'schema': 1, 'source': os.path.basename(src_path), 'source_sha256': rules['source_sha256'], 'edits': ed}
    mats = copy.deepcopy(info['materials'])
    if mutate: a, mk, E, mats = mutate(a.copy(), mk.copy(), copy.deepcopy(E), mats)
    os.makedirs(os.path.join(root, QA, 'img'), exist_ok=True)
    Image.fromarray(a.astype(np.uint8)).save(os.path.join(root, F_PT)); Image.fromarray(mk).save(os.path.join(root, F_MK))
    json.dump(E, open(os.path.join(root, F_ED), 'w'))
    json.dump({'schema': 1, 'file': F_MK, 'image': F_PT, 'image_sha256': sha(os.path.join(root, F_PT)), 'materials': mats}, open(os.path.join(root, F_MJ), 'w'))
    for p_ in F_IMG: Image.new('RGB', (8, 8)).save(os.path.join(root, p_))

def selftest(rules, src_path):
    def px_skin_to_hair(a, mk, E, M): y, x = 150, 196; mk[y, x, 0] = 4; return a, mk, E, M
    def px_g(a, mk, E, M): mk[60, 200, 1] += 1; return a, mk, E, M
    def extra_edit(a, mk, E, M): a[200, 150, 0] ^= 1; return a, mk, E, M
    def hole_left_open(a, mk, E, M): a[183, 105] = 0; mk[183, 105] = 0; return a, mk, E, M
    def alpha_off(a, mk, E, M): mk[100, 200, 3] = 0; return a, mk, E, M
    def b_set(a, mk, E, M): mk[300, 170, 2] = 7; return a, mk, E, M
    def edit_missing(a, mk, E, M): E['edits'].pop(); return a, mk, E, M
    def shade_swap(a, mk, E, M): s = M['4']['shades']; s[0], s[1] = s[1], s[0]; return a, mk, E, M
    def cheek_as_mouth(a, mk, E, M): mk[166, 158, 1] = 0; return a, mk, E, M
    def eye_to_cape(a, mk, E, M): mk[145, 155, 0] = 8; return a, mk, E, M
    def hole_wrong_colour(a, mk, E, M): a[183, 282, :3] = (0x12, 0x00, 0x1E); return a, mk, E, M
    def no_review_img(a, mk, E, M): return a, mk, E, M
    neg = [('one skin pixel labelled hair', px_skin_to_hair, '4.4b'), ('one G off by 1', px_g, '4.4c'), ('one extra pixel edited', extra_edit, '4.2a'),
           ('one hole pixel left open', hole_left_open, '4.3'), ('mask alpha off on one pixel', alpha_off, '4.4a'), ('B channel set', b_set, '4.4a'),
           ('edits json missing one entry', edit_missing, '4.2b'), ('hair shades out of order in json', shade_swap, '4.4d'), ('cheek pixel marked as mouth', cheek_as_mouth, '4.4c'),
           ('pupil labelled cape', eye_to_cape, '4.4b'), ('hole filled with the outline colour', hole_wrong_colour, '4.2a'), ('review image missing', no_review_img, '4.4f')]
    res = []; tmp = tempfile.mkdtemp()
    try:
        write_set(tmp, rules, src_path); C = check(tmp, rules, src_path); pos = all(c['pass'] for c in C)
        res.append({'case': 'correct set', 'expect': 'all PASS', 'ok': pos, 'fails': [c['check'][:5] for c in C if not c['pass']]})
        for name, fn, key in neg:
            shutil.rmtree(tmp); os.makedirs(tmp); write_set(tmp, rules, src_path, fn)
            if name == 'review image missing': os.remove(os.path.join(tmp, F_IMG[1]))
            C = check(tmp, rules, src_path); fails = [c['check'].split(' ')[0] for c in C if not c['pass']]
            res.append({'case': name, 'expect': 'FAIL ' + key, 'ok': key in fails, 'fails': fails})
    finally: shutil.rmtree(tmp, ignore_errors=True)
    return res

if __name__ == '__main__':
    root = sys.argv[1]; rules = json.load(open(os.path.join(root, QA, 'pt-rules.json'))); src_path = os.path.join(root, rules['source'])
    if len(sys.argv) > 2 and sys.argv[2] == '--selftest':
        res = selftest(rules, src_path)
        for r in res: print(('OK   ' if r['ok'] else 'BAD  ') + r['case'] + ' -> expect ' + r['expect'] + ' | failed: ' + ','.join(r['fails']))
        n_ok = sum(r['ok'] for r in res); print('selftest %d/%d' % (n_ok, len(res))); sys.exit(0 if n_ok == len(res) else 1)
    C = check(root, rules, src_path)
    for c in C: print(('PASS ' if c['pass'] else 'FAIL ') + c['check'] + ' | ' + json.dumps(c['value'], ensure_ascii=False)[:300])
    p = sum(c['pass'] for c in C); print('%d/%d' % (p, len(C)))
    if len(sys.argv) > 2: json.dump({'checks': C, 'passed': p, 'total': len(C)}, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
    sys.exit(0 if p == len(C) else 1)
