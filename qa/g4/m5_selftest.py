# Self-test of the M5 judge (qa/g4/m5_cmp.py v2, Codex T40-N2): a GOOD pair of replay folders (flag OFF, flag ON) is copied to a temp
# folder and broken in one way per case; the judge must give the expected exit for every case. The good folders are never changed.
#   python3 -I -B qa/g4/m5_selftest.py OFF_DIR ON_DIR      → prints one line per case, then a JSON summary · exit 0 = every case as expected
import json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
JUDGE = os.path.join(HERE, 'm5_cmp.py')

def rj(p): return json.load(open(p))
def wj(p, o): json.dump(o, open(p, 'w'))

def cp_count(d): return len([f for f in os.listdir(d) if re.fullmatch(r'cp\d+\.json', f)])

def mid(d):   # a checkpoint in the middle of the run (cp13 when there are ≥ 13)
    n = cp_count(d); return 'cp%02d' % min(13, n)

def run_incomplete(off, on):            # T40-N2 case 1: run.complete false, checkpoints 1, expected kept
    p = os.path.join(on, 'run.json'); r = rj(p); r['complete'] = False; r['checkpoints'] = 1; wj(p, r)

def cp_vc_error(off, on):               # case 2: one checkpoint's virtual-clock error
    p = os.path.join(on, mid(on) + '.json'); c = rj(p); c['state']['vcErrors'] = {'n': 1, 'last': 'planted'}; wj(p, c)

def run_page_error(off, on):            # case 3: a page error in the run
    p = os.path.join(on, 'run.json'); r = rj(p); r['pageErrors'] = list(r.get('pageErrors') or []) + ['planted error']; wj(p, r)

def files_missing(off, on):             # case 4: cp02 … cpNN deleted on BOTH sides, run.json still says expected = checkpoints = N
    for d in (off, on):
        for f in os.listdir(d):
            m = re.fullmatch(r'cp(\d+)\.(json|draw\.txt|png|canvas\.png)', f)
            if m and int(m.group(1)) >= 2: os.remove(os.path.join(d, f))

def run_vc_error(off, on):              # the run's own virtual-clock counter
    p = os.path.join(off, 'run.json'); r = rj(p); r['vcErrors'] = {'n': 2, 'last': 'planted'}; wj(p, r)

def other_chromium(off, on):            # the two sides not run the same way
    p = os.path.join(on, 'run.json'); r = rj(p); r['chromium'] = '0.0.0.0'; wj(p, r)

def draw_missing(off, on):              # one draw log gone
    os.remove(os.path.join(on, mid(on) + '.draw.txt'))

def camera_plus1(off, on):              # negative: the camera one pixel off at one checkpoint
    p = os.path.join(on, mid(on) + '.json'); c = rj(p); c['state']['cam'][0] += 1; wj(p, c)

def player_first(off, on):              # negative: the player's lines moved before everything else (y-sort broken)
    p = os.path.join(on, mid(on) + '.draw.txt'); L = open(p).read().split('\n')
    P = [l for l in L if l.endswith('|P')]; rest = [l for l in L if not l.endswith('|P')]
    open(p, 'w').write('\n'.join(P + rest))

CASES = [('good pair', None, 0), ('run incomplete', run_incomplete, 3), ('checkpoint virtual-clock error', cp_vc_error, 1),
         ('page error', run_page_error, 1), ('cp02…cpNN missing both sides', files_missing, 3), ('run virtual-clock error', run_vc_error, 1),
         ('other Chromium on one side', other_chromium, 3), ('a draw log missing', draw_missing, 3),
         ('camera +1 px', camera_plus1, 1), ('player drawn first', player_first, 1)]

def main():
    off0, on0 = sys.argv[1], sys.argv[2]
    res, ok = [], True
    for name, fn, want in CASES:
        t = tempfile.mkdtemp(prefix='m5st-')
        try:
            off, on = os.path.join(t, 'off'), os.path.join(t, 'on')
            shutil.copytree(off0, off); shutil.copytree(on0, on)
            if fn: fn(off, on)
            p = subprocess.run([sys.executable, '-I', '-B', JUDGE, off, on], capture_output=True, text=True)
            last = (p.stdout.strip().split('\n') or [''])[-1]
            good = p.returncode == want; ok = ok and good
            res.append({'case': name, 'want': want, 'got': p.returncode, 'ok': good, 'judge': last[:200]})
            print('%-34s want %d got %d %s' % (name, want, p.returncode, 'ok' if good else 'WRONG'))
        finally:
            shutil.rmtree(t, ignore_errors=True)
    print(json.dumps({'cases': len(res), 'ok': sum(r['ok'] for r in res), 'verdict': 'pass' if ok else 'fail'}))
    sys.exit(0 if ok else 1)

main()
