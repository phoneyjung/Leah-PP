# G4 M1 (v3 after Codex T35-N1, v3.1 after T36-N1/N2, v3.2 after T37-N1/N2): judges a suites_pair.sh folder. Main and branch come from the SAME session on the SAME machine.
#   python3 qa/g4/suites_cmp.py OUT [--json out.json]         judge the whole folder
#   python3 qa/g4/suites_cmp.py --needs-rerun OUT NAME         (used by suites_pair.sh) prints yes/no after the first round
#   exit 0 = pass · 1 = a regression on the branch · 3 = cannot judge (the folder is not complete, a main run broke, a flaky suite
#   or a legacy output needs a person) · 2 = this script crashed. Never 0 on data that cannot decide.
#
# 1. The folder must be complete before anything is judged (else exit 3): ALLDONE written by the runner with suites=, runs= and
#    manifest= · runs.tsv (every run as it ran: suite, side, run number, exit, sha of the log) whose hash is that manifest, whose count is
#    runs=, every listed run present and unchanged, no run on disk that it does not list (T36-N2: deleting a failing rerun can never
#    pass) · suites.tsv (the list the runner chose, with the kind and the sha256 of each suite file on both sides) · env.txt · runs of a
#    suite numbered 1…N with no gap, the same N on both sides, N ≥ 3 when rule 3 asks for reruns · no run of a suite outside the list ·
#    the suite file is the same on main and on the branch (a changed suite file makes the pair meaningless).
#    v3.2: ALLDONE also seals suites.tsv, env.txt and target.txt (suites_sha= env_sha= target_sha=) — the files that choose HOW a suite
#    is judged (its kind) and how logs are masked cannot change afterwards · a kind is 'assert' or 'legacy', nothing else · when the
#    checkouts named in env.txt still exist, every suite file is hashed again and its kind worked out again with the runner's own rule
#    (must match suites.tsv) · every run-like file (.exit OR .log) must be in runs.tsv · the top of OUT holds only the runner's files and
#    the suites' own out_<run> folders; anything else (a note, a report) makes the folder 'not complete' — keep reports outside OUT.
#    Out of reach: someone who rewrites the logs AND runs.tsv AND ALLDONE together (that is forging, not a broken run).
# 2. Every run gets a status. The runner's own failures are kept apart from the game's failures:
#      pass   = exit 0, a non-empty log, no failure line
#      fail   = exit 0 or 1 with at least one failure line (the suite said why)
#      broken = timeout (exit 124) · killed (137/143) · any other exit code · exit 1 with no failure line · an empty log
#    Failure lines: every string of an "errors":[…] array (the suites' own case codes, e.g. "A2: …") · the page-error list of the
#    legacy suites ("errors 3 [ … ]", N > 0) · an error headline at the start of a line (TypeError: …, Uncaught …, AssertionError …,
#    FAIL …) together with the lines printed under it (the failing assert expression) and WHERE in the suite file it was thrown
#    (L<line>C<col> of each frame in <suite>.js — the same file on both sides — so two different asserts never look alike);
#    other stack frames ("at …") are not failure lines.
#    Only values that really swing are masked: the two checkout folders and the output folder (<DIR>, <OUT>), 127.0.0.1/localhost ports
#    (<HOST>), and a number standing alone (coordinates, times, counts → #). A number glued to a letter, _ or # stays, so case codes
#    (A2 ≠ A5), suite names and ids (#context167) are compared as they are.
# 3. Reruns: a suite runs 3 times on each side (RERUNS=n in the runner: 1+n) when, after run 1, a side is not 'pass', or (legacy suites
#    only) the two outputs differ · both sides must have the same number of runs, at least 3.
# 4. Verdict per suite:
#      a branch run broke                        → 'BRANCH RUN BROKEN' (regression: the branch hung/crashed/said nothing)
#      a main run broke (branch did not)         → 'MAIN RUN BROKEN' (cannot judge)
#      main passed every run                     → the branch must pass every run, else 'NEW FAIL'
#      main failed in a run                      → every failure line of the branch must be one main showed in one of its runs,
#                                                  else 'NEW ERROR LINES'; a branch that passes is fine · one exception: when main
#                                                  itself stops on a thrown error (assert/timeout) and the branch stops at ANOTHER
#                                                  place that is not provably EARLIER, that is cannot judge: 'NEW STOP POINT' when it
#                                                  is later in the suite file than every main stop (it MAY have got further: seen on
#                                                  main itself, test_170 stopped at L30C265 9 times and at L30C472 once in 10 runs of one
#                                                  session — a hint only, a person checks), 'UNKNOWN STOP' otherwise · a stop EARLIER
#                                                  than every main stop (a check main passes now fails), new COLLECTED errors, or a throw
#                                                  where main never throws, stay regressions
#      legacy suites (no assert of their own: they print values for a person to read, 32 of 115) also: every branch run must print
#      EXACTLY what one main run printed — all lines, same order, same count, numbers masked (T36-N1: a line that disappears is a
#      difference too) — else 'OUTPUT DIFFERS' with the added and the missing lines (a person reads them: cannot judge)
#      the flaky three (test_157, test_176, test_risk_monthly) that are not ok → run them alone (cannot judge)
import difflib, hashlib, json, os, re, sys

FLAKY = ('test_157_equipment', 'test_176_steer_and_act', 'test_risk_monthly')
NUM = re.compile(r'(?<![A-Za-z_#\d.])-?\d+(?:\.\d+)?')
HEAD = re.compile(r'^\s*(?:Uncaught\s+)?(?:[A-Z][A-Za-z]*)?(?:Error|Exception)\b|^\s*(?:AssertionError|FAIL\b)')
LEGACY_ERR = re.compile(r'^errors (\d+)\b(.*)$')
KINDS = ('assert', 'legacy')                                       # T37-N1: nothing else is a kind
ASSERTS = re.compile(r'errors\.push|errors\.length|process\.exit|exitCode')   # the runner's own rule: a suite with none of these is 'legacy'
RUNNER_FILES = {'env.txt', 'suites.tsv', 'runs.tsv', 'target.txt', 'ALLDONE'}
BROKEN_EXIT = {124: 'timeout (300 s)', 137: 'killed (signal 9)', 143: 'stopped (signal 15)', 130: 'interrupted'}

def env(out):
    e = {}
    p = os.path.join(out, 'env.txt')
    if os.path.exists(p):
        for l in open(p, errors='replace'):
            k, _, v = l.rstrip('\n').partition(' ')
            e[k] = v
    return e

def masker(out):
    e = env(out)
    reps = [(e[k], tag) for k, tag in (('maindir', '<DIR>'), ('branchdir', '<DIR>'), ('out', '<OUT>')) if e.get(k)]
    reps.sort(key=lambda x: -len(x[0]))
    def m(s):
        for a, tag in reps: s = s.replace(a, tag)
        s = re.sub(r'out_[\w.-]+?\.(?:main|branch)(?:\.\d)?(?=[/\s\'"]|$)', 'out_<RUN>', s)
        s = re.sub(r'(?:127\.0\.0\.1|localhost):\d+', '<HOST>', s)
        s = NUM.sub('#', s)
        return re.sub(r'\s+', ' ', s).strip()      # never cut before comparing (T36 self-check: a 240-char cut hid a changed word)
    return m

def excerpt(line, others, w=70):
    """for display only: the part of a long line around its first difference from the most similar line of the other side"""
    if len(line) <= 2 * w: return line
    best = max(others or [''], key=lambda o: next((i for i, (a, b) in enumerate(zip(line, o)) if a != b), min(len(line), len(o))))
    i = next((i for i, (a, b) in enumerate(zip(line, best)) if a != b), min(len(line), len(best)))
    return ('…' if i > w else '') + line[max(0, i - w):i + w] + ('…' if i + w < len(line) else '')

def headline(lines, n, suite, m):
    """an error headline + the lines under it up to the stack (node's AssertionError prints the failing expression there) + where in
    the SUITE file it was thrown (L<line>C<col> of every frame in <suite>.js, innermost first): the suite file is the same on both sides
    (suites.tsv), so this names WHICH assert/wait failed — every assert of a suite prints the same headline"""
    more, chain, frames = [], [], False
    for l2 in lines[n + 1:n + 40]:
        s = l2.strip()
        if s.startswith('at '):
            frames = True
            g = re.search(re.escape(suite) + r'\.js:(\d+):(\d+)', s) if suite else None
            if g and len(chain) < 4: chain.append(f'L{g.group(1)}C{g.group(2)}')
        elif frames or (s and not l2[:1].isspace()): break      # the stack ended, or an unindented line = other output
        elif s and len(more) < 3: more.append(s)                # indented lines under the headline (the assert expression)
    return 'H ' + m(' '.join([lines[n]] + more)) + (' @' + '>'.join(chain) if chain else '')

def stop_pos(line):
    """(line, col) in the suite file of the OUTERMOST suite frame of a thrown-error line (its place in the suite's own flow), or None"""
    g = re.search(r'@((?:L\d+C\d+>?)+)$', line)
    if not g: return None
    l, c = re.findall(r'L(\d+)C(\d+)', g.group(1))[-1]
    return (int(l), int(c))

def failure_lines(text, m, suite=None):
    out = set()
    i = 0
    while True:   # "errors":[ … ] arrays, decoded as JSON (a ']' inside a message does not cut it short)
        k = text.find('"errors":', i)
        if k < 0: break
        j = text.find('[', k)
        i = k + 9
        if j < 0 or text[k + 9:j].strip(): continue
        try: arr, _ = json.JSONDecoder().raw_decode(text, j)
        except ValueError: continue
        for x in arr if isinstance(arr, list) else []: out.add('E ' + m(x if isinstance(x, str) else json.dumps(x, ensure_ascii=False)))
    lines = text.splitlines()
    for n, l in enumerate(lines):
        g = LEGACY_ERR.match(l.strip())
        if g and int(g.group(1)) > 0:      # legacy page-error list: "errors 2 [ 'Uncaught …', … ]" (may run over several lines)
            block = [g.group(2)]
            if g.group(2).strip() == '[':
                for l2 in lines[n + 1:n + 21]:
                    block.append(l2)
                    if l2.strip().startswith(']'): break
            out.add('P ' + (m(' '.join(block)) or '(page errors counted, none listed)'))
        elif HEAD.match(l) and not l.strip().startswith('at '):
            out.add(headline(lines, n, suite, m))
    return out

def run(out, n, side, k, m):
    pe, pl = os.path.join(out, f'{n}.{side}{k}.exit'), os.path.join(out, f'{n}.{side}{k}.log')
    if not (os.path.exists(pe) and os.path.exists(pl)): return None
    try: e = int(open(pe).read().split()[0])
    except (ValueError, IndexError): return {'status': 'broken', 'why': 'unreadable exit file', 'exit': None, 'lines': set(), 'out': []}
    t = open(pl, errors='replace').read()
    fl = failure_lines(t, m, n)
    outl = [m(x) for x in t.splitlines() if x.strip() and not x.strip().startswith('at ')]
    r = {'exit': e, 'lines': fl, 'out': outl}
    if not t.strip(): r.update(status='broken', why=f'exit {e}, empty log')
    elif e in BROKEN_EXIT: r.update(status='broken', why=BROKEN_EXIT[e])
    elif e not in (0, 1): r.update(status='broken', why=f'exit {e}')
    elif e == 1 and not fl: r.update(status='broken', why='exit 1 with no failure line')
    else: r.update(status='fail' if fl else 'pass', why='')
    return r

def suites_list(out):
    p = os.path.join(out, 'suites.tsv')
    if not os.path.exists(p): return None
    rows = {}
    for l in open(p):
        f = l.rstrip('\n').split('\t')
        if len(f) >= 4 and not l.startswith('#'): rows[f[0]] = {'kind': f[1], 'shaMain': f[2], 'shaBranch': f[3]}
    return rows

def recheck_kinds(out, lst):
    """T37-N1, second layer: when the checkouts named in env.txt are still there, the kind and the sha of every suite file are worked out
    again from the files themselves (the runner's rule) and must match suites.tsv. Returns (meta, how many suites were rechecked)"""
    e, meta, n_ok = env(out), [], 0
    md, bd = e.get('maindir'), e.get('branchdir')
    if not (md and os.path.isdir(md) and bd and os.path.isdir(bd)): return meta, 0
    for n, info in lst.items():
        pm, pb = os.path.join(md, n + '.js'), os.path.join(bd, n + '.js')
        if not (os.path.exists(pm) and os.path.exists(pb)): meta.append(f'{n}: the suite file is gone from a checkout named in env.txt'); continue
        sm = hashlib.sha256(open(pm, 'rb').read()).hexdigest()[:16]; sb = hashlib.sha256(open(pb, 'rb').read()).hexdigest()[:16]
        kind = 'assert' if ASSERTS.search(open(pm, errors='replace').read()) else 'legacy'
        if (sm, sb) != (info['shaMain'], info['shaBranch']): meta.append(f'{n}: the suite file sha differs from suites.tsv (the checkout changed after the run)')
        elif kind != info['kind']: meta.append(f"{n}: suites.tsv says kind '{info['kind']}', the suite file says '{kind}'")
        else: n_ok += 1
    return meta, n_ok

def manifest(out, lst):
    """T36-N2: the run list the runner wrote (runs.tsv, hashed into ALLDONE) must match the folder exactly: every listed run has its
    files, unchanged (exit + sha of the log) · no run file is unlisted · the counts agree. Returns (meta, {(suite, side): [run numbers]})"""
    pa, pr = os.path.join(out, 'ALLDONE'), os.path.join(out, 'runs.tsv')
    if not os.path.exists(pa): return ['no ALLDONE: the runner did not finish'], None
    FIELDS = {'suites', 'runs', 'manifest', 'suites_sha', 'env_sha', 'target_sha'}
    g = dict(re.findall(r'(suites_sha|env_sha|target_sha|suites|runs|manifest)=(\S+)', open(pa).read()))
    if set(g) != FIELDS: return ['ALLDONE lacks ' + '/'.join(sorted(FIELDS - set(g))) + ' (an older runner): run again into a new OUT'], None
    if not os.path.exists(pr): return ['no runs.tsv (the list of runs)'], None
    meta, raw = [], open(pr, 'rb').read()
    for f, k in (('suites.tsv', 'suites_sha'), ('env.txt', 'env_sha'), ('target.txt', 'target_sha')):   # T37-N1: the files that choose
        p = os.path.join(out, f)                                                                         # how a suite is judged
        if not os.path.exists(p): meta.append(f'no {f}')
        elif hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16] != g[k]: meta.append(f'{f} does not match {k} in ALLDONE (changed after the runner finished)')
    if hashlib.sha256(raw).hexdigest()[:16] != g['manifest']: meta.append('runs.tsv does not match the hash in ALLDONE (changed after the runner finished)')
    rows = [l.split('\t') for l in raw.decode(errors='replace').splitlines() if l.strip()]
    if not g['runs'].isdigit() or len(rows) != int(g['runs']): meta.append(f"ALLDONE says runs={g['runs']}, runs.tsv lists {len(rows)}")
    if not g['suites'].isdigit() or int(g['suites']) != len(lst): meta.append(f"ALLDONE says suites={g['suites']}, suites.tsv lists {len(lst)}")
    listed, idx = set(), {}
    for f in rows:
        if len(f) != 5 or not f[2].isdigit(): meta.append('runs.tsv: a line that is not suite/side/run/exit/sha'); continue
        n, side, k, e, h = f
        key = (n, side, int(k))
        if key in listed: meta.append(f'runs.tsv lists {n} {side} run {k} twice')
        listed.add(key); idx.setdefault((n, side), []).append(int(k))
        suf = '' if k == '1' else '.' + k
        pe, pl = os.path.join(out, f'{n}.{side}{suf}.exit'), os.path.join(out, f'{n}.{side}{suf}.log')
        if not (os.path.exists(pe) and os.path.exists(pl)): meta.append(f'{n} {side} run {k}: listed in runs.tsv but its files are gone'); continue
        if open(pe).read().split()[:1] != [e]: meta.append(f'{n} {side} run {k}: the exit file differs from runs.tsv')
        if hashlib.sha256(open(pl, 'rb').read()).hexdigest()[:16] != h: meta.append(f'{n} {side} run {k}: the log changed after the run')
    for f in sorted(os.listdir(out)):   # T37-N2: a run file (.exit OR .log) that the list does not know · anything else unknown
        g2 = re.match(r'(.+?)\.(main|branch)(?:\.(\d+))?\.(exit|log)$', f)
        if g2:
            if (g2.group(1), g2.group(2), int(g2.group(3) or 1)) not in listed: meta.append(f'{f}: a run file that runs.tsv does not list')
        elif f in RUNNER_FILES: pass
        elif f.startswith('out_') and os.path.isdir(os.path.join(out, f)): pass     # a suite's own OUT_DIR (screenshots …): not evidence
        else: meta.append(f'{f}: a file the runner never writes (keep reports and notes outside OUT)')
    return meta, idx

def files_idx(out, n, side):
    """run numbers present on disk for one suite and side (1 = the run without a suffix)"""
    ks = []
    for f in os.listdir(out):
        g = re.match(re.escape(n) + r'\.' + side + r'(?:\.(\d+))?\.exit$', f)
        if g: ks.append(int(g.group(1) or 1))
    return sorted(ks)

def needs_rerun(r1m, r1b, kind):
    if r1m is None or r1b is None: return False
    if r1m['status'] != 'pass' or r1b['status'] != 'pass': return True
    return kind == 'legacy' and r1m['out'] != r1b['out']

def judge(out):
    m = masker(out)
    meta = []
    if not os.path.exists(os.path.join(out, 'env.txt')): meta.append('no env.txt')
    lst = suites_list(out)
    if lst is None: meta.append('no suites.tsv: the list of suites the runner chose is missing'); lst = {}
    if not lst: meta.append('the suite list is empty')
    mm, _ = manifest(out, lst)
    meta += mm
    for n, info in lst.items():
        if info['kind'] not in KINDS: meta.append(f"{n}: kind '{info['kind']}' is not one of {'/'.join(KINDS)}")
    rk, rechecked = recheck_kinds(out, lst)
    meta += rk
    seen = {f.split('.')[0] for f in os.listdir(out) if f.endswith('.exit')}
    for x in sorted(seen - set(lst)): meta.append(f'{x}: runs found for a suite that is not in suites.tsv')
    rows, bad, undecided = [], [], []
    for n in sorted(lst):
        info = lst[n]
        r = {'suite': n, 'kind': info['kind'], 'flaky': n in FLAKY}
        if info['shaMain'] != info['shaBranch']: meta.append(f'{n}: the suite file differs between main and the branch'); r['verdict'] = 'SUITE FILE DIFFERS'
        im, ib = files_idx(out, n, 'main'), files_idx(out, n, 'branch')
        for side, ks in (('main', im), ('branch', ib)):    # T36-N2: runs 1…N with no gap (a deleted run 2 must never shrink to "2 runs")
            if ks and ks != list(range(1, len(ks) + 1)): meta.append(f'{n} {side}: runs {ks} have a gap (expected 1…{len(ks)})')
        sfx = lambda k: '' if k == 1 else f'.{k}'
        rm = [run(out, n, 'main', sfx(k), m) for k in im]
        rb = [run(out, n, 'branch', sfx(k), m) for k in ib]
        rm = [x for x in rm if x is not None]; rb = [x for x in rb if x is not None]
        if 1 not in im or 1 not in ib or not rm or not rb:
            meta.append(f'{n}: run 1 missing on ' + ' and '.join(s for s, x in (('main', im), ('branch', ib)) if 1 not in x))
            r['verdict'] = 'MISSING'; rows.append(r); continue
        if len(rm) != len(rb): meta.append(f'{n}: main has {len(rm)} runs, the branch {len(rb)} (must be the same)')
        if needs_rerun(rm[0], rb[0], info['kind']) and (len(rm) < 3 or len(rb) < 3):
            meta.append(f'{n}: needs at least 3 runs per side, has main {len(rm)} / branch {len(rb)}')
        r.update(main=[x['exit'] for x in rm], branch=[x['exit'] for x in rb], mainStatus=[x['status'] for x in rm], branchStatus=[x['status'] for x in rb])
        if 'verdict' in r: rows.append(r); continue
        if any(x['status'] == 'broken' for x in rb):
            r['verdict'] = 'BRANCH RUN BROKEN'; r['why'] = sorted({x['why'] for x in rb if x['status'] == 'broken'})
        elif any(x['status'] == 'broken' for x in rm):
            r['verdict'] = 'MAIN RUN BROKEN (cannot judge)'; r['why'] = sorted({x['why'] for x in rm if x['status'] == 'broken'})
        elif all(x['status'] == 'pass' for x in rm):
            if all(x['status'] == 'pass' for x in rb): r['verdict'] = 'ok'
            else: r['verdict'] = 'NEW FAIL'; r['newLines'] = [x[:240] for x in sorted(set().union(*[x['lines'] for x in rb]))[:8]]
        else:
            allowed = set().union(*[x['lines'] for x in rm])
            new = sorted(set().union(*[x['lines'] for x in rb]) - allowed)
            thrown = [x for x in new if x.startswith('H ')]          # a thrown error stops the suite there
            listed = [x for x in new if not x.startswith('H ')]      # errors the suite COLLECTS ("errors":[…], page errors): it ran on
            main_stops = [stop_pos(x) for x in allowed if x.startswith('H ')]
            known = [p for p in main_stops if p]
            earlier = [x for x in thrown if stop_pos(x) and known and stop_pos(x) < min(known)]
            if listed or (thrown and not main_stops) or earlier: r['verdict'] = 'NEW ERROR LINES' + (' (stops EARLIER in the suite than main ever did: a check main passes now fails)' if earlier and not listed else '')
            elif thrown:   # not provably earlier → a person reads; 'later' is only a hint (loops/helpers make file order ≠ run order)
                later = all(stop_pos(x) and known and stop_pos(x) > max(known) for x in thrown)
                r['verdict'] = ('NEW STOP POINT (cannot judge: stops LATER in the suite file than every main stop, it MAY have got further — a person checks; rerun with RERUNS=4)'
                                if later else 'UNKNOWN STOP (cannot judge: the new stop point cannot be placed before main\'s — a person reads; rerun with RERUNS=4)')
            else: r['verdict'] = 'ok (fails on main in this session too; no new failure line)'
            if new: r['newLines'] = [excerpt(x, sorted(allowed)) for x in new[:8]]
        if r['verdict'].startswith('ok') and info['kind'] == 'legacy':
            # T36-N1: every branch run must print EXACTLY what one main run printed (all lines, in order, as many times; numbers masked) —
            # a line that disappears, moves or repeats is a difference too, not only a new line. No tolerance for random lists: they
            # differ → a person reads (seen in one session the 5 legacy suites printed the same on both sides)
            mains = [x['out'] for x in rm]
            off = [i for i, x in enumerate(rb) if x['out'] not in mains]
            if off:
                b = rb[off[0]]['out']
                best = max(mains, key=lambda mo: difflib.SequenceMatcher(None, mo, b, autojunk=False).ratio())
                added, missing = [], []
                for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, best, b, autojunk=False).get_opcodes():
                    if op in ('replace', 'delete'): missing += best[i1:i2]
                    if op in ('replace', 'insert'): added += b[j1:j2]
                r['verdict'] = 'OUTPUT DIFFERS (a person reads the lines)'
                r['outRuns'] = [i + 1 for i in off]
                r['outAdded'] = [excerpt(x, best) for x in added[:6]]; r['outMissing'] = [excerpt(x, b) for x in missing[:6]]
                r['outAddedN'], r['outMissingN'] = len(added), len(missing)
        if r['flaky'] and not r['verdict'].startswith('ok'): r['verdict'] += ' · flaky: run it alone'
        if not r['verdict'].startswith('ok'):
            if r['flaky'] or r['verdict'].startswith(('MAIN RUN BROKEN', 'OUTPUT DIFFERS', 'NEW STOP POINT', 'UNKNOWN STOP')): undecided.append(n)
            else: bad.append(n)
        rows.append(r)
    code = 3 if meta else 1 if bad else 3 if undecided else 0
    e = env(out)
    sts = lambda r: r.get('mainStatus', []) + r.get('branchStatus', [])
    res = {'out': out, 'v': '3.2', 'main': e.get('main'), 'branch': e.get('branch'), 'control': bool(e.get('maindir')) and e.get('maindir') == e.get('branchdir'),
           'meta': meta, 'metaOk': not meta, 'suites': len(rows), 'kindsRechecked': rechecked, 'legacy': sum(r['kind'] == 'legacy' for r in rows),
           'bothPass': sum(bool(sts(r)) and all(s == 'pass' for s in sts(r)) for r in rows),
           'runs': sum(len(r.get('main', [])) + len(r.get('branch', [])) for r in rows),
           'bad': bad, 'undecided': undecided, 'exit': code, 'verdict': {0: 'pass', 1: 'regression', 3: 'cannot judge'}[code], 'rows': rows}
    return res

def main():
    a = sys.argv[1:]
    if a and a[0] == '--needs-rerun':
        out, n = a[1], a[2]
        m = masker(out); lst = suites_list(out) or {}
        print('yes' if needs_rerun(run(out, n, 'main', '', m), run(out, n, 'branch', '', m), (lst.get(n) or {}).get('kind', 'assert')) else 'no')
        return 0
    res = judge(a[0])
    if '--json' in a: json.dump(res, open(a[a.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
    for r in res['rows']:
        if r.get('verdict') != 'ok':
            print(r['suite'], r.get('main', ''), r.get('branch', ''), r['verdict'], r.get('why', ''), r.get('newLines', ''),
                  ('+' + str(r['outAdded']) + ' -' + str(r['outMissing'])) if 'outAdded' in r else '')
    for x in res['meta']: print('META', x)
    print(json.dumps({k: res[k] for k in ('suites', 'legacy', 'kindsRechecked', 'runs', 'bothPass', 'bad', 'undecided', 'metaOk', 'control', 'verdict', 'exit')}))
    return res['exit']

if __name__ == '__main__':
    try: sys.exit(main())
    except SystemExit: raise
    except Exception as ex:
        print('suites_cmp crashed:', repr(ex)); sys.exit(2)
