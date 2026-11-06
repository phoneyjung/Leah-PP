# G4 M1 (v2 after Codex T34-R3): judges a suites_pair.sh folder. Main and branch come from the SAME session on the SAME machine.
# Per suite (a suite that failed on either side has 3 runs per side, else 1):
#   main passed every run → the branch must pass every run ('NEW FAIL' otherwise)
#   main failed in at least one run → "fails on main in this session": the branch may fail, but each error line of the branch must be
#   one main also showed in one of its runs (numbers masked) — else 'NEW ERROR LINES' for a human to read; a branch that passes is fine
#   the flaky three (test_157, test_176, test_risk_monthly) are reported apart and do not decide alone (rerun them alone)
#   python3 qa/g4/suites_cmp.py OUT [--json out.json]     exit 0 only when no non-flaky suite breaks the rule
import json, os, re, sys
OUT = sys.argv[1]
FLAKY = ('test_157_equipment', 'test_176_steer_and_act', 'test_risk_monthly')
def runs(n, side):
    r = []
    for suf in ('', '.2', '.3'):
        p = os.path.join(OUT, f'{n}.{side}{suf}.exit')
        if not os.path.exists(p): continue
        e = int(open(p).read().split()[0]); t = open(os.path.join(OUT, f'{n}.{side}{suf}.log'), errors='replace').read()
        m = re.search(r'"errors":(\[[^\]]*\])', t)
        ls = (json.loads(m.group(1)) if m else []) + [l.strip() for l in t.splitlines() if re.search(r'Error|assert|FAIL', l)][:20]
        r.append((e, {re.sub(r'\d+(\.\d+)?', '#', x)[:200] for x in ls}))
    return r
rows, bad = [], []
names = sorted({f.split('.')[0] for f in os.listdir(OUT) if f.endswith('.exit')})
for n in names:
    rm, rb = runs(n, 'main'), runs(n, 'branch')
    r = {'suite': n, 'main': [e for e, _ in rm], 'branch': [e for e, _ in rb], 'flaky': n in FLAKY}
    if not rm or not rb: r['verdict'] = 'missing'
    elif all(e == 0 for e, _ in rm): r['verdict'] = 'ok' if all(e == 0 for e, _ in rb) else 'NEW FAIL'
    else:
        allowed = set().union(*[l for e, l in rm if e])
        new = sorted(set().union(*[l for e, l in rb if e]) - allowed) if any(e for e, _ in rb) else []
        r['verdict'] = 'ok (fails on main in this session; no new error line)' if not new else 'NEW ERROR LINES'
        if new: r['newLines'] = new[:8]
    if r['flaky'] and not r['verdict'].startswith('ok'): r['verdict'] += ' · flaky: rerun alone'
    rows.append(r)
    if not r['verdict'].startswith('ok') and not r['flaky']: bad.append(n)
res = {'out': OUT, 'suites': len(rows), 'bothPass': sum(all(e == 0 for e in r['main'] + r['branch']) for r in rows),
       'mainFails': [r['suite'] for r in rows if any(r['main'])], 'branchFails': [r['suite'] for r in rows if any(r['branch'])], 'bad': bad, 'rows': rows}
if '--json' in sys.argv: json.dump(res, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
for r in rows:
    if r['verdict'] != 'ok': print(r['suite'], r['main'], r['branch'], r['verdict'], r.get('newLines', ''))
print(json.dumps({k: res[k] for k in ('suites', 'bothPass', 'mainFails', 'branchFails', 'bad')}))
sys.exit(0 if not bad and rows else 1)
