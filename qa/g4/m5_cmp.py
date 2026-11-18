# G4.2 M5 (plan G4_0 §8 M5): the same branch, the same door list (m5-doors.json), flag OFF (TAGP=1) vs flag ON (PATCH='{"char2On":true}'),
# both written by qa/g4/replay.js. The new body may look different; everything AROUND it must not:
#   · every checkpoint on the same map with the kid on the same spot and the same camera (cam = camX, camY, SC, VW, VH) → doors passed the same
#   · the y-sort order (picture numbers '#N' dropped: they count creation order, and Char2 makes canvases of its own): the draw log with the player's own lines ('|P', drawn inside drawPlayer) folded into ONE token 'P' and the player's blurred
#     shadow sheet ('|S', replaced by an ellipse when on) left out must be IDENTICAL line by line (every other picture, its arguments and transform)
#   · flag ON: C234 ready at every checkpoint, no failure · flag OFF: Char2 not used
# v2 (Codex T40-N2): the evidence must be complete and clean BEFORE anything is compared (the meta checks of compare.py):
#   cannot judge (exit 3): run.json missing on a side · the wrong tags/patch · a run not complete (complete != true, checkpoints != expected) ·
#     the checkpoint files not exactly cp01 … cpNN with N = expected (none missing, none extra, k = its number, every cpNN.draw.txt there) ·
#     the two sides not run the same way (base scenHash zoom epoch seed save intro args chromium expected) · the checkpoint names differ
#   bad (exit 1): page errors in a run · virtual-clock errors in a run or in any checkpoint (a run that threw is a failure, not a pass)
# exit 0 = pass · 1 = a difference or errors · 3 = cannot judge · qa/g4/m5_selftest.py proves every rule on copies of a good pair
#   python3 qa/g4/m5_cmp.py OFF_DIR ON_DIR [--json OUT.json]
import json, os, re, sys

SAME = ('base', 'scenHash', 'zoom', 'epoch', 'seed', 'save', 'intro', 'args', 'chromium', 'expected')
CP = re.compile(r'cp(\d+)\.json$')

def load(d, side, meta):
    p = os.path.join(d, 'run.json')
    if not os.path.isfile(p):
        meta.append('%s: no run.json (the run did not finish)' % side); return None, []
    run = json.load(open(p))
    exp = run.get('expected')
    if run.get('complete') is not True or not isinstance(exp, int) or exp < 1 or run.get('checkpoints') != exp:
        meta.append('%s: incomplete run %s/%s complete=%s' % (side, run.get('checkpoints'), exp, run.get('complete')))
    names = sorted((m.group(0)[:-5] for m in (CP.match(f) for f in os.listdir(d)) if m), key=lambda n: int(n[2:]))
    want = ['cp%02d' % k for k in range(1, (exp if isinstance(exp, int) else 0) + 1)]
    if names != want:
        meta.append('%s: checkpoint files %d (%s … %s), expected cp01 … cp%02d' % (side, len(names), names[0] if names else '-', names[-1] if names else '-', exp if isinstance(exp, int) else 0))
    cps = []
    for i, n in enumerate(names):
        cp = json.load(open(os.path.join(d, n + '.json')))
        if cp.get('k') != int(n[2:]):
            meta.append('%s %s: k = %s' % (side, n, cp.get('k')))
        dp = os.path.join(d, n + '.draw.txt')
        if not os.path.isfile(dp):
            meta.append('%s %s: no draw log' % (side, n)); cp['_draw'] = []
        else:
            cp['_draw'] = open(dp).read().split('\n')
        cp['_name'] = n
        cps.append(cp)
    return run, cps

ID = re.compile(r'#\d+(?=:)')   # vclock numbers pictures in creation order; Char2 makes its own canvases first when on → compare without the number

def fold(lines):
    out, inP = [], False
    for l in lines:
        if not l:
            continue
        l = ID.sub('#', l)
        if l.endswith('|S'):
            continue
        if l.endswith('|P'):
            if not inP:
                out.append('P')
            inP = True
            continue
        inP = False
        out.append(l)
    return out

def main():
    a, b = sys.argv[1], sys.argv[2]
    jout = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    R = {'off': a, 'on': b, 'checkpoints': 0, 'meta': [], 'errors': [], 'bad': [], 'notes': []}

    def done(code, verdict, msg=None):
        R['verdict'] = verdict
        if jout: json.dump(R, open(jout, 'w'), indent=1)
        if msg: print(msg)
        for m in R['meta']: print('META', m)
        for m in R['errors']: print('ERROR', m)
        for q in R['bad'][:12]: print('cp%02d %s: %s' % (q['k'], q['case'], ' · '.join(q['why'])[:400]))
        print(json.dumps({'checkpoints': R['checkpoints'], 'meta': len(R['meta']), 'errors': len(R['errors']), 'bad': len(R['bad']), 'playerTagged': R.get('playerTagged', 0), 'verdict': verdict}))
        sys.exit(code)

    try:
        ra, ca = load(a, 'OFF', R['meta'])
        rb, cb = load(b, 'ON', R['meta'])
    except Exception as e:
        R['meta'].append('unreadable evidence: %s' % e); done(3, 'cannot judge')
    if ra is None or rb is None:
        done(3, 'cannot judge')
    if not ra.get('tagp') or not rb.get('tagp') or (rb.get('patch') or {}).get('char2On') is not True or ra.get('patch'):
        R['meta'].append('tags: OFF needs TAGP=1 without a patch, ON needs TAGP=1 with PATCH {"char2On":true}')
    for k in SAME:
        if ra.get(k) != rb.get(k): R['meta'].append('run field differs: %s (%s vs %s)' % (k, str(ra.get(k))[:60], str(rb.get(k))[:60]))
    if [c['_name'] for c in ca] != [c['_name'] for c in cb]:
        R['meta'].append('checkpoint names differ: OFF %d, ON %d' % (len(ca), len(cb)))
    if not ca:
        R['meta'].append('no checkpoints')
    if R['meta']:
        done(3, 'cannot judge')
    for side, run, cps in (('OFF', ra, ca), ('ON', rb, cb)):
        if run.get('pageErrors'): R['errors'].append('%s: page errors %d: %s' % (side, len(run['pageErrors']), str(run['pageErrors'][0])[:120]))
        if (run.get('vcErrors') or {}).get('n'): R['errors'].append('%s: virtual-clock errors %s' % (side, run['vcErrors']['n']))
        for c in cps:
            if ((c.get('state') or {}).get('vcErrors') or {}).get('n'): R['errors'].append('%s %s: virtual-clock errors %s' % (side, c['_name'], c['state']['vcErrors']['n']))
    tagged = 0
    for x, y in zip(ca, cb):
        k = x['k']; sx, sy = x['state'], y['state']; R['checkpoints'] += 1
        why = []
        if sx['map'] != sy['map']: why.append('map %s vs %s' % (sx['map'], sy['map']))
        for f in ('x', 'y', 'row', 'moving'):
            if sx['P'].get(f) != sy['P'].get(f): why.append('P.%s %s vs %s' % (f, sx['P'].get(f), sy['P'].get(f)))
        if sx['cam'] != sy['cam']: why.append('camera %s vs %s' % (sx['cam'], sy['cam']))
        c2a, c2b = sx.get('c2') or {}, sy.get('c2') or {}
        if c2a.get('st') not in (None, 'off') or any((c2a.get('n') or {}).values()): why.append('OFF used Char2 %s' % c2a)
        if c2b.get('st') != 'ready': why.append('ON not ready: %s %s' % (c2b.get('st'), c2b.get('why')))
        fa, fb = fold(x['_draw']), fold(y['_draw'])
        if any(l.endswith('|P') for l in x['_draw']) or any(l.endswith('|P') for l in y['_draw']): tagged += 1
        if fa != fb:
            i = next((i for i, (p, q) in enumerate(zip(fa, fb)) if p != q), min(len(fa), len(fb)))
            why.append('y-sort/draw differs at line %d of %d/%d: %r vs %r' % (i, len(fa), len(fb), fa[i] if i < len(fa) else None, fb[i] if i < len(fb) else None))
        if why: R['bad'].append({'k': k, 'case': x.get('case'), 'why': why})
    R['playerTagged'] = tagged
    if tagged == 0:
        R['meta'].append('no player line tagged in any checkpoint'); done(3, 'cannot judge')
    if R['errors'] or R['bad']:
        done(1, 'fail')
    done(0, 'pass')

main()
