# Expected-vs-actual test report for QA 1.2a (Claude · 18 Oct 2569). usage: python3 -I qa/g2-5a-s/qa12a/run_tests.py WT LOCKED_QA_PY OUT_MD
#   LOCKED_QA_PY = qa_asset13.py of commit 6b71b62 (e.g. git show 6b71b62:qa_asset13.py > /tmp/qa_6b71b62.py) · compared with WT/qa_asset13.py (1.2a)
import sys, subprocess, re, os
WT, LOCKQA, OUT = sys.argv[1:4]; Q = os.path.join(WT, 'qa/g2-5a-s'); MUT = os.path.join(Q, 'qa12a/mutants'); A = os.path.join(WT, 'c2-pilot-hold-anchors.json'); F = os.path.join(WT, 'qa/g2-5a-s/delivery-12948e2')
LOCK = LOCKQA; PROP = os.path.join(WT, 'qa_asset13.py')
def run(script, d, *extra):
    r = subprocess.run([sys.executable, '-I', script, d, A, '/dev/null'] + list(extra), capture_output=True, text=True)
    out = r.stdout + r.stderr; fails = [m.group(1) for m in re.finditer(r'^FAIL (\S+)', out, re.M)]
    tot = re.search(r'TOTAL (\d+)/(\d+)', out); crash = 'Traceback' in out
    return {'fails': fails, 'total': (int(tot.group(1)), int(tot.group(2))) if tot else None, 'crash': crash, 'exit': r.returncode, 'out': out[-300:]}
sets = [('fix2 ca3d75b (Codex real)', os.path.join(Q, 'delivery-ca3d75b'), 24, []),
        ('B2 mock', os.path.join(WT, 'qa/g2-5a-s/r2-v12/fv_B2'), 22, ['6', "10'"]),
        ('B mock', os.path.join(WT, 'qa/g2-5a-s/r2-v12/fv_B'), 20, ['6', "10'", 'V5a', 'V5b']),
        ('A mock', os.path.join(WT, 'qa/g2-5a-s/r2-v12/fv_A'), 19, ['6', "10'", 'C2b', 'V5a', 'V5b']),
        ('fix1 12948e2', F, 16, ["10'", 'C1', 'C3', 'C2', 'C2b', 'C4a', 'V5a', 'V5b']),
        ('ea1dccc', os.path.join(WT, 'qa/g2-5a-s/delivery-ea1dccc'), 15, ['5', '8d', "10'", 'C1', 'C3', 'C2', 'C2b', 'V5a', 'V5b'])]
M = MUT; M2 = MUT
neg = [('frame 12 px wide', os.path.join(M, 'h2_width12_clean'), ['2'], []),
       ('body shifted 1 px left', os.path.join(M2, 'mut_bodyshift'), ['2', 'C2b'], []),
       ('rib in crystal centre column', os.path.join(M, 'd2_centre_rib'), ['C2'], []),
       ('rib 2 px wide', os.path.join(M, 'a_rib2px'), ['C2', 'C2b'], []),
       ('copper under light beside rib', os.path.join(M, 'b_copper_under_light'), ['5', 'C2'], []),
       ('crystal moved down 1 px', os.path.join(M, 'c_crystal_down'), ['C4a'], []),
       ('third rib column', os.path.join(M, 'd_third_rib'), ['C2'], []),
       ('ribs #67413A', os.path.join(M, 'e_rib_673'), ['C2'], []),
       ('#3D292C on inner rim', os.path.join(M, 'f_rim_3d_r18'), ['V5a'], []),
       ('row 7 recoloured', os.path.join(M, 'g_row7'), ['G2'], []),
       ('row 7 px made transparent (shape)', os.path.join(M2, 'm2_g2_hole_row7'), ['G2'], []),
       ('row 5 px made opaque (shape)', os.path.join(M2, 'm2_g2_add_row5'), ['G2'], []),
       ('x8: 1 off-centre px in a block', os.path.join(M2, 'm2_x8_one_px'), ['6b'], []),
       ('x8: 1 background px', os.path.join(M2, 'm2_x8_bg_px'), ['6b'], []),
       ('transparent px saved as white (no shape change)', os.path.join(M, 't_transparent_white'), [], ['G2']),
       ('no crystal', os.path.join(M, 'n1_no_crystal'), ['5', '8d'], []),
       ('no light layer', os.path.join(M, 'n2_no_light'), ['5'], []),
       ('lantern at the right edge', os.path.join(M, 'n3_at_right_edge'), ['2'], []),
       ('light file missing', os.path.join(M2, 'm2_missing_light'), ['1a'], [])]
L = ['# QA 1.2a test report (expected vs actual) · locked = qa_asset13.py @6b71b62 · 1.2a = qa_asset13.py in this commit', '',
     '## Sets (mode 1.2 with FIX1_DIR) · locked = qa_asset13.py @6b71b62 · 1.2a = proposal', '',
     '| set | expected 1.2a | actual 1.2a | locked | match |', '|---|---|---|---|---|']
ok_all = True
for name, d, exp_n, exp_f in sets:
    p = run(PROP, d, '1.2', F); l = run(LOCK, d, '1.2', F)
    match = p['total'] == (exp_n, 24) and sorted(p['fails']) == sorted(exp_f); ok_all &= match
    L.append('| %s | %d/24 fail %s | %s/%s fail %s | %s | %s |' % (name, exp_n, ' '.join(exp_f) or '-', p['total'][0], p['total'][1], ' '.join(p['fails']) or '-',
             ('%d/%d' % l['total']) if l['total'] else 'CRASH', 'yes' if match else 'NO'))
L += ['', '## Negative tests (mode 1.2a) · must fail the listed gates, never crash, always 24 gates', '', '| case | must fail | must NOT fail | actual fails | total | locked | ok |', '|---|---|---|---|---|---|---|']
for name, d, must, mustnot in neg:
    p = run(PROP, d, '1.2', F); l = run(LOCK, d, '1.2', F)
    good = (not p['crash']) and p['total'] and p['total'][1] == 24 and all(g in p['fails'] for g in must) and not any(g in p['fails'] for g in mustnot); ok_all &= bool(good)
    L.append('| %s | %s | %s | %s | %s | %s | %s |' % (name, ' '.join(must) or '-', ' '.join(mustnot) or '-', ' '.join(p['fails']) or '-',
             '%d/%d' % p['total'] if p['total'] else 'none', 'CRASH' if l['crash'] else ('%d/%d fail %s' % (l['total'][0], l['total'][1], ' '.join(l['fails']) or '-')), 'yes' if good else 'NO'))
nf = run(PROP, os.path.join(WT, 'qa/g2-5a-s/r2-v12/fv_B2'), '1.2'); good = nf['exit'] != 0 and 'needs FIX1_DIR' in nf['out'] and not nf['total']; ok_all &= good
L += ['', '## Missing FIX1_DIR', '', '- 1.2a: exit %d, message "%s", no TOTAL printed → %s' % (nf['exit'], 'needs FIX1_DIR' if 'needs FIX1_DIR' in nf['out'] else '?', 'ok' if good else 'NO'),
      '- locked: ' + ('%d/%d PASS (G2/G3/10\' silently skipped)' % run(LOCK, os.path.join(WT, 'qa/g2-5a-s/r2-v12/fv_B2'), '1.2')['total'])]
L += ['', '## Regression (modes 1 and 1.1 unchanged)', '', '| mode | set | locked | 1.2a | same |', '|---|---|---|---|---|']
for mode, d, extra in (('1', F, []), ('1.1', F, ['1.1', os.path.join(WT, 'qa/g2-5a-s/delivery-ea1dccc')]), ('1', os.path.join(WT, 'qa/g2-5a-s/delivery-ea1dccc'), []),
                       ('1.1', os.path.join(Q, 'delivery-ca3d75b'), ['1.1', F])):
    l = run(LOCK, d, *extra); p = run(PROP, d, *extra); same = l['total'] == p['total'] and l['fails'] == p['fails']; ok_all &= same
    L.append('| %s | %s | %s | %s | %s |' % (mode, os.path.basename(d), '%d/%d' % l['total'], '%d/%d' % p['total'], 'yes' if same else 'NO'))
L += ['', '**ALL EXPECTATIONS MET: %s**' % ('YES' if ok_all else 'NO')]
open(OUT, 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
