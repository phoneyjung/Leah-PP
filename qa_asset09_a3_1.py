#!/usr/bin/env python3
# Independent QA for ASSET_SPEC_09 v2.6 section 21 (09-A3.1: relabel small cape fragments near the legs). Claude.
# Codex may run it before delivery (copy it out of claude/g2-pilot; do not commit it to the asset branch).
# usage:
#   python3 -I qa_asset09_a3_1.py targets MASK_A3.png TARGETS_OUT.json                 (Claude: list the 20 pieces from the accepted A3 mask)
#   python3 -I qa_asset09_a3_1.py check A2.png MASK_A3.png MASK_A31.png MASK_A31.json CHANGES.json TARGETS.json EXPECTED_A3.json OUT_DIR
#   python3 -I qa_asset09_a3_1.py selftest A2.png MASK_A3.png TARGETS.json EXPECTED_A3.json   (in-memory checker tests; no file is written)
# Needs qa_asset09_a3.py (e1d74b4) in the same folder: the 17 A3 checks must still pass after A3.1.
import sys, os, json
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_asset09_a3 as q

ALLOWED_NEW = (6, 7)          # trousers/stockings cloth, boot leather; keeping 8 means "this really is cape seen behind the leg"
MIN_Y = 66; MAX_PX = 3

def pieces(M):
    """8-connected ID 8 pieces of <= 3 px lying entirely at y >= 66 of a 96 cell (the A3 report list)."""
    out = []
    for d, l in enumerate(q.L8):
        c = M[d * 96:(d + 1) * 96, :, 0] == 8; seen = np.zeros_like(c); k = 0
        for y0, x0 in zip(*np.nonzero(c)):
            if seen[y0, x0]: continue
            dq = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
            while dq:
                y, x = dq.popleft(); pts.append([int(x), int(y)])
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < 96 and 0 <= xx < 96 and c[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
            if len(pts) <= MAX_PX and min(p[1] for p in pts) >= MIN_Y:
                k += 1; out.append({'piece': '%s-%d' % (l, k), 'dir': l, 'px': sorted(pts)})
    return out

def check(A, M3, M31, J, C, T, E, png_size=None):
    R = {}; H = {}
    tp = {(p['dir'], x, y): p['piece'] for p in T['pieces'] for x, y in p['px']}
    diff = (M31 != M3).any(-1); ys, xs = np.nonzero(diff)
    changed = [(q.L8[y // 96], int(x), int(y % 96)) for y, x in zip(ys, xs)]
    R['changed_px'] = len(changed); R['outside_targets'] = [list(c) for c in changed if c not in tp]
    H['1_only_target_pixels_changed'] = not R['outside_targets']
    per = {}
    for p in T['pieces']:
        ids = sorted({int(M31[q.L8.index(p['dir']) * 96 + y, x, 0]) for x, y in p['px']})
        gs = sorted({int(M31[q.L8.index(p['dir']) * 96 + y, x, 1]) for x, y in p['px']})
        per[p['piece']] = {'new_ids': ids, 'G': gs, 'px': len(p['px'])}
    R['pieces'] = per
    H['2_whole_piece_same_decision'] = all(len(v['new_ids']) == 1 for v in per.values())
    H['3_new_id_6_7_or_kept_8'] = all(v['new_ids'][0] in ALLOWED_NEW + (8,) for v in per.values())
    H['4_fixed_G0'] = all(v['G'] == [0] for v in per.values() if v['new_ids'][0] in ALLOWED_NEW)
    H['5_kept_pieces_unchanged'] = all(not diff[q.L8.index(p['dir']) * 96 + y, x] for p in T['pieces'] for x, y in p['px'] if per[p['piece']]['new_ids'] == [8])
    # change list = rollback list
    rows = C.get('changes', []); rb = M31.copy(); bad = 0; seen = set()
    for r in rows:
        d, x, y = r['dir'], int(r['x']), int(r['y']); yy = q.L8.index(d) * 96 + y; seen.add((d, x, y))
        if list(M31[yy, x, :2]) != [r['new_id'], r['new_g']] or list(M3[yy, x, :2]) != [r['old_id'], r['old_g']]: bad += 1
        rb[yy, x, 0] = r['old_id']; rb[yy, x, 1] = r['old_g']
    R['change_rows'] = len(rows); R['change_rows_wrong'] = bad; R['change_rows_missing'] = [list(c) for c in changed if c not in seen]
    H['6_changes_json_exact'] = bad == 0 and not R['change_rows_missing'] and len(rows) == len(changed)
    H['7_rollback_equals_A3'] = bool((rb == M3).all())
    decided = {d.get('piece'): d for d in (C.get('decisions') or [])}
    R['decisions_missing'] = [p for p in per if p not in decided or not str(decided[p].get('reason', '')).strip()]
    H['8_every_piece_has_reason'] = not R['decisions_missing']
    R3, _, _ = q.check(A, M31, J, E, png_size); R['a3_checks'] = R3['hard']; R['a3_leak'] = R3['leak'] if isinstance(R3['leak'], dict) else R3['leak']
    H['9_a3_17_checks_still_pass'] = R3['PASS']
    R['counts_id8_6_7'] = {l: [int((M31[i * 96:(i + 1) * 96, :, 0] == k).sum()) for k in (8, 6, 7)] for i, l in enumerate(q.L8)}
    R['hard'] = H; R['PASS'] = all(H.values())
    return R

def legs_image(A, M3, M31, T, path):
    """Leg area, before/after A3.1, Sun and Flame capes, target pieces boxed."""
    s = 5; rows = []
    for name, M in (('A3', M3), ('A3.1', M31)):
        for h in (0, 3):
            rows.append(('%s %s' % (name, q.RAMPS['house'][h][0]), q.render(A, M[..., 0], M[..., 1], dict(q.DEFAULT, house=h))))
    W = 110 + 8 * (56 * s + 8); H = len(rows) * (30 * s + 20) + 4
    im = Image.new('RGBA', (W, H), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    for r, (name, img) in enumerate(rows):
        y = 4 + r * (30 * s + 20); d.text((4, y + 4), name, fill=(20, 20, 30))
        for i, l in enumerate(q.L8):
            x0 = 110 + i * (56 * s + 8); crop = np.ascontiguousarray(img[i * 96 + 66:i * 96 + 96, 20:76])
            bg = Image.new('RGBA', (56, 30), (232, 230, 240, 255)); bg.alpha_composite(Image.fromarray(crop, 'RGBA'))
            im.alpha_composite(bg.resize((56 * s, 30 * s), Image.NEAREST), (x0, y + 14)); d.text((x0, y + 2), l, fill=(20, 20, 30))
            for p in T['pieces']:
                if p['dir'] != l: continue
                for px, py in p['px']: d.rectangle((x0 + (px - 20) * s - 1, y + 14 + (py - 66) * s - 1, x0 + (px - 19) * s, y + 14 + (py - 65) * s), outline=(0, 0, 0, 255))
    im.save(path, optimize=True)

def selftest(a2, m3, tj, ej):
    A = q.load(a2); M3 = q.load(m3); T = json.load(open(tj, encoding='utf-8')); E = json.load(open(ej, encoding='utf-8')); ok = True; msgs = []
    def t(name, cond): nonlocal ok; ok &= bool(cond); msgs.append(('ok ' if cond else 'BAD ') + name)
    t('targets = 20 pieces / 28 px', len(T['pieces']) == 20 and sum(len(p['px']) for p in T['pieces']) == 28)
    t('targets re-derived from A3 mask match the file', pieces(M3) == T['pieces'])
    op = A[..., 3] > 0
    def jfor(M): return {'schema': 1, 'file': 'c2-pilot-kid4-mask.png', 'ids': {str(k): 1 for k in range(12)}, 'ramps': {'skin': 5, 'hair': 5, 'iris': 3, 'house': 4},
                         'source_colors': {str(k): sorted({q.hexc(c) for c in A[op & (M[..., 0] == k), :3]}) for k in range(1, 12)}}
    def make(dec, extra=None):
        M = M3.copy(); rows = []; decs = []
        for p in T['pieces']:
            nid = dec.get(p['piece'], 8); decs.append({'piece': p['piece'], 'id': nid, 'reason': 'test'})
            for x, y in p['px']:
                yy = q.L8.index(p['dir']) * 96 + y
                if nid != 8: rows.append({'dir': p['dir'], 'x': x, 'y': y, 'old_id': int(M[yy, x, 0]), 'old_g': int(M[yy, x, 1]), 'new_id': nid, 'new_g': 0}); M[yy, x, 0] = nid; M[yy, x, 1] = 0
        if extra: extra(M, rows)
        return M, {'changes': rows, 'decisions': decs}
    good = {p['piece']: 6 for p in T['pieces'][:12]}; good.update({p['piece']: 7 for p in T['pieces'][12:15]})
    M, C = make(good); R = check(A, M3, M, jfor(M), C, T, E); t('relabel 15 pieces to 6/7 + keep 5 -> PASS', R['PASS'])
    def stray(M, rows): M[30, 40, 0] = 6
    M, C = make(good, stray); R = check(A, M3, M, jfor(M), C, T, E); t('change outside the list is caught', not R['hard']['1_only_target_pixels_changed'])
    M, C = make(good); p = T['pieces'][0]; x, y = p['px'][0]
    if len(p['px']) > 1: M[q.L8.index(p['dir']) * 96 + y, x, 0] = 7
    R = check(A, M3, M, jfor(M), C, T, E); t('half-relabelled piece is caught', not R['PASS'])
    M, C = make(good); C['changes'] = C['changes'][1:]; R = check(A, M3, M, jfor(M), C, T, E); t('missing change row is caught', not R['hard']['6_changes_json_exact'])
    M, C = make({T['pieces'][0]['piece']: 3}); R = check(A, M3, M, jfor(M), C, T, E); t('relabel to skin (3) is caught', not R['hard']['3_new_id_6_7_or_kept_8'])
    print('\n'.join(msgs)); print('SELFTEST', 'PASS' if ok else 'FAIL'); return ok

def main():
    a = sys.argv[1:]
    if not a: print(open(__file__, encoding='utf-8').read().split('\nimport')[0]); return 2
    if a[0] == 'targets':
        M3 = q.load(a[1]); P = pieces(M3)
        json.dump({'spec': 'ASSET_SPEC_09 v2.6 section 21', 'base_mask_commit': 'd73cbd0', 'rule': 'ID 8 pieces, 8-connected, <= 3 px, all pixels at y >= 66 of the 96 cell',
                   'pieces_total': len(P), 'px_total': sum(len(p['px']) for p in P), 'pieces': P}, open(a[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('wrote', a[2], len(P), 'pieces'); return 0
    if a[0] == 'selftest': return 0 if selftest(*a[1:5]) else 1
    if a[0] == 'check':
        A = q.load(a[1]); M3 = q.load(a[2]); M31 = q.load(a[3]); J = json.load(open(a[4], encoding='utf-8')); C = json.load(open(a[5], encoding='utf-8'))
        T = json.load(open(a[6], encoding='utf-8')); E = json.load(open(a[7], encoding='utf-8')); od = a[8]; os.makedirs(od, exist_ok=True)
        R = check(A, M3, M31, J, C, T, E, os.path.getsize(a[3]))
        legs_image(A, M3, M31, T, os.path.join(od, 'a3-1-legs-before-after.png'))
        json.dump(R, open(os.path.join(od, 'a3-1-qa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        for k, v in R['hard'].items(): print(('PASS ' if v else 'FAIL ') + k)
        kept = [p for p, v in R['pieces'].items() if v['new_ids'] == [8]]
        print('changed px %d · pieces -> 6: %d, 7: %d, kept 8: %d %s' % (R['changed_px'], sum(v['new_ids'] == [6] for v in R['pieces'].values()),
              sum(v['new_ids'] == [7] for v in R['pieces'].values()), len(kept), kept))
        print('RESULT', 'PASS' if R['PASS'] else 'FAIL'); return 0 if R['PASS'] else 1
    print('unknown command'); return 2

if __name__ == '__main__':
    sys.exit(main())
