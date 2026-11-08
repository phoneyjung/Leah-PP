# G4.2 M5 (plan G4_0 §8 M5): the same branch, the same door list (m5-doors.json), flag OFF (TAGP=1) vs flag ON (PATCH='{"char2On":true}'),
# both written by qa/g4/replay.js. The new body may look different; everything AROUND it must not:
#   · every checkpoint on the same map with the kid on the same spot and the same camera (cam = camX, camY, SC, VW, VH) → doors passed the same
#   · the y-sort order (picture numbers '#N' dropped: they count creation order, and Char2 makes canvases of its own): the draw log with the player's own lines ('|P', drawn inside drawPlayer) folded into ONE token 'P' and the player's blurred
#     shadow sheet ('|S', replaced by an ellipse when on) left out must be IDENTICAL line by line (every other picture, its arguments and transform)
#   · flag ON: C234 ready at every checkpoint, no failure · flag OFF: Char2 not used
# exit 0 = pass · 1 = a difference · 3 = cannot judge (missing / unequal folders, wrong tags)
#   python3 qa/g4/m5_cmp.py OFF_DIR ON_DIR [--json OUT.json]
import json, os, re, sys

def load(d):
    run = json.load(open(os.path.join(d, 'run.json')))
    cps = []
    k = 1
    while os.path.exists(os.path.join(d, 'cp%02d.json' % k)):
        cp = json.load(open(os.path.join(d, 'cp%02d.json' % k)))
        cp['_draw'] = open(os.path.join(d, 'cp%02d.draw.txt' % k)).read().split('\n')
        cps.append(cp)
        k += 1
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
    R = {'off': a, 'on': b, 'checkpoints': 0, 'bad': [], 'notes': []}
    try:
        ra, ca = load(a)
        rb, cb = load(b)
    except Exception as e:
        print('cannot judge: ' + str(e)); sys.exit(3)
    if not ra.get('tagp') or not rb.get('tagp') or (rb.get('patch') or {}).get('char2On') is not True or ra.get('patch'):
        print('cannot judge: OFF needs TAGP=1 without a patch, ON needs PATCH {"char2On":true}'); sys.exit(3)
    if len(ca) != len(cb) or not ca or ra.get('scenHash') != rb.get('scenHash') or ra.get('zoom') != rb.get('zoom'):
        print('cannot judge: checkpoints %d vs %d, scenario %s vs %s, zoom %s vs %s' % (len(ca), len(cb), ra.get('scenHash'), rb.get('scenHash'), ra.get('zoom'), rb.get('zoom'))); sys.exit(3)
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
        print('cannot judge: no player line tagged in any checkpoint'); sys.exit(3)
    R['verdict'] = 'pass' if not R['bad'] else 'fail'
    if jout: json.dump(R, open(jout, 'w'), indent=1)
    for q in R['bad'][:12]: print('cp%02d %s: %s' % (q['k'], q['case'], ' · '.join(q['why'])[:400]))
    print(json.dumps({'checkpoints': R['checkpoints'], 'bad': len(R['bad']), 'playerTagged': tagged, 'verdict': R['verdict']}))
    sys.exit(0 if not R['bad'] else 1)

main()
