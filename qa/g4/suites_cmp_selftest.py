# G4 M1 v3: proves suites_cmp.py on made-up folders (T35-N1 · Codex's false passes + the other ways a pair can lie).
#   python3 qa/g4/suites_cmp_selftest.py            exit 0 only when every case gets the expected exit code (and --needs-rerun agrees)
# The folders are written to a temporary folder outside the repo and deleted at the end. Nothing here runs the game.
import glob, hashlib, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
CMP = os.path.join(HERE, 'suites_cmp.py')
MD, BD = '/srv/checkout-main', '/srv/checkout-branch'      # two different folders, as in a real pair

def stack(side):   # stack frames differ by folder and port on the two sides: they must never decide anything
    d, p = (MD, 8790) if side == 'main' else (BD, 8791)
    return f'    at async press ({d}/test_x.js:4:41)\n    at http://127.0.0.1:{p}/index.html:{6000 if side == "main" else 6012}:17\n'
def jerr(*codes, side='main', extra=''):
    return json.dumps({'results': {'n': 10, 'player': [1101.008, 782.992] if side == 'main' else [1100.5, 783.25]}, 'errors': list(codes)}, separators=(',', ':')) + '\n' + extra + stack(side)   # as JSON.stringify writes it
A2 = 'A2: the action button did not start the dig'
PASS = lambda side='main': json.dumps({'results': {'n': 10, 'ms': [1, 2, 1], 'url': f'http://127.0.0.1:{8790 if side == "main" else 8791}/'}, 'errors': []}, separators=(',', ':')) + '\n'
def asrt(side, expr='assert(await p.evaluate(()=>!PS.gmSprite170&&!S.gmSprite170))', at=(30, 265), head='AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:'):
    d = MD if side == 'main' else BD   # node's own layout: headline · blank · the expression (indented) · blank · frames · error fields
    return (f'{head}\n\n  {expr}\n\n    at {d}/test_170_swordsman.js:{at[0]}:{at[1]} {{\n  generatedMessage: true,\n  code: \'ERR_ASSERTION\'\n}}\n'
            f'{{ swError: false, swReady: {"true" if side == "main" else "false"} }}\n')
def tmo(side, at='27:324'):
    d = MD if side == 'main' else BD
    return (f'TimeoutError: Waiting for selector `#context167` failed: Waiting failed: 30000ms exceeded\n    at new WaitTask (/srv/node_modules/puppeteer-core/WaitTask.js:48:34)\n'
            f'    at async press ({d}/test_167_context_bubble.js:4:41)\n    at async {d}/test_167_context_bubble.js:{at}\n{{\n  map: \'farm\',\n  player: [ 1101.008, 782.992 ]\n}}\n')
LEG = lambda lamp=1, extra='': json.dumps({'version': 'Lantern Academy 2.33', 'adultLamp': lamp, 'msgs': ['เติมแสงแล้ว'], 'took': 1234, 'x': -12.5}) + '\nerrors 0 []\n' + extra

def write(d, suites, runs, alldone=True, env=True, tsv=True, sha=None, tamper=None, files=None):
    """a folder as suites_pair.sh v3.1 leaves it: runs.tsv in run order + ALLDONE with suites=/runs=/manifest= ·
    alldone='old' = the older runner's bare ALLDONE · tamper(d) is applied after everything is written (deleting/changing evidence)"""
    os.makedirs(d)
    md, bd = MD, BD
    if files:   # real checkouts holding the suite files (so suites_cmp can work the kind out again from the file itself)
        md, bd = d + '_main', d + '_branch'
        for x in (md, bd):
            os.makedirs(x)
            for n, src in files.items(): open(os.path.join(x, n + '.js'), 'w').write(src)
        sha = {n: hashlib.sha256(src.encode()).hexdigest()[:16] for n, src in files.items()}
    if env:
        open(os.path.join(d, 'env.txt'), 'w').write(f'chromium test\nmain aaaa\nbranch bbbb\nmaindir {md}\nbranchdir {bd}\nout {d}\n')
    open(os.path.join(d, 'target.txt'), 'w').write(f'main aaaa 1111 {MD} | branch bbbb 1111 {BD}\n')
    if tsv:
        with open(os.path.join(d, 'suites.tsv'), 'w') as f:
            f.write('# name\tkind\tsha main\tsha branch\n')
            for n, kind in suites.items(): f.write(f'{n}\t{kind}\t{(sha or {}).get(n, "1111") if files else "1111"}\t{(sha or {}).get(n, "1111")}\n')
    num = lambda k: 1 if k == '' else int(k[1:])
    lines = []
    for (n, side, k), (e, log) in sorted(runs.items(), key=lambda x: (num(x[0][2]), x[0][0], x[0][1])):
        open(os.path.join(d, f'{n}.{side}{k}.exit'), 'w').write(f'{e} 12.3\n')
        open(os.path.join(d, f'{n}.{side}{k}.log'), 'w').write(log)
        lines.append(f'{n}\t{side}\t{num(k)}\t{e}\t{hashlib.sha256(log.encode()).hexdigest()[:16]}\n')
    open(os.path.join(d, 'runs.tsv'), 'w').write(''.join(lines))
    if alldone == 'old': open(os.path.join(d, 'ALLDONE'), 'w').write('DONE\n')
    elif alldone:
        h = lambda f: hashlib.sha256(open(os.path.join(d, f), 'rb').read()).hexdigest()[:16] if os.path.exists(os.path.join(d, f)) else 'none'
        man = hashlib.sha256(''.join(lines).encode()).hexdigest()[:16]
        open(os.path.join(d, 'ALLDONE'), 'w').write(f'DONE suites={len(suites)} runs={len(lines)} manifest={man} suites_sha={h("suites.tsv")} env_sha={h("env.txt")} target_sha={h("target.txt")}\n')
    if tamper: tamper(d)

def edit(d, f, old, new):
    """change one file of a finished folder: read it first, then write it back (never open for writing before reading)"""
    p = os.path.join(d, f); s = open(p).read()
    assert old in s, (f, old)
    open(p, 'w').write(s.replace(old, new))

def three(n, f, n_runs=3):
    """f(side, k) -> (exit, log) or None (no such run) · k is '' (run 1), '.2', '.3'"""
    return {(n, side, k): f(side, k) for k in ('', '.2', '.3')[:n_runs] for side in ('main', 'branch')}

S = 'test_178_dig_button'
CASES = [
 # (id, why, expected exit, suites, runs, write-options, expected --needs-rerun for S or None)
 ('C01', 'control: both pass · ports and folders differ in the logs', 0, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {}, 'no'),
 ('C02', 'control: both fail A2 ×3 · stack frames, ports, coordinates differ', 0, {S: 'assert'},
  three(S, lambda s, k: (1, jerr(A2, side=s, extra='TimeoutError: Waiting failed: 30000ms exceeded\n'))), {}, 'yes'),
 ('T35a', 'Codex: branch timeout (exit 124), empty log ×3', 1, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s)) if s == 'main' else (124, '')), {}, 'yes'),
 ('T35b', 'Codex: main A2 · branch A5 with the same message', 1, {S: 'assert'},
  three(S, lambda s, k: (1, jerr(A2 if s == 'main' else A2.replace('A2', 'A5'), side=s))), {}, 'yes'),
 ('T35c', 'Codex: main A2 · branch "new regression"', 1, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2 if s == 'main' else 'new regression', side=s))), {}, 'yes'),
 ('T35d', 'Codex: 1 failing run per side, no ALLDONE', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s)), 1), {'alldone': False}, 'yes'),
 ('M01', 'failing, ALLDONE written, but only 1 run per side', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s)), 1), {}, 'yes'),
 ('M02', 'failing, 3 runs on main but 2 on the branch', 3, {S: 'assert'},
  {k: v for k, v in three(S, lambda s, k: (1, jerr(A2, side=s))).items() if k != (S, 'branch', '.3')}, {}, 'yes'),
 ('M03', 'run 1 missing on the branch', 3, {S: 'assert'}, {(S, 'main', ''): (0, PASS())}, {}, 'no'),
 ('M04', 'no suites.tsv (the runner list is missing)', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {'tsv': False}, None),
 ('M05', 'runs of a suite that is not in the list', 3, {S: 'assert'},
  {**three(S, lambda s, k: (0, PASS(s)), 1), **three('test_999_extra', lambda s, k: (0, PASS(s)), 1)}, {}, 'no'),
 ('M06', 'the suite file differs between main and the branch', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {'sha': {S: '2222'}}, 'no'),
 ('M07', 'no env.txt', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {'env': False}, 'no'),
 ('B01', 'main passes · branch exit 0 with an empty log ×3', 1, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)) if s == 'main' else (0, '')), {}, 'yes'),
 ('B02', 'main fails A2 · branch exit 1 with no failure line ×3', 1, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s)) if s == 'main' else (1, 'something happened\n' + stack(s))), {}, 'yes'),
 ('B03', 'main passes · branch exit 2 ×3', 1, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)) if s == 'main' else (2, 'x\n')), {}, 'yes'),
 ('B04', 'main killed (137) ×3 · branch passes: cannot judge', 3, {S: 'assert'}, three(S, lambda s, k: (137, 'partial\n') if s == 'main' else (0, PASS(s))), {}, 'yes'),
 ('B05', 'main passes ×3 · branch fails A2 in run 2 only', 1, {S: 'assert'},
  three(S, lambda s, k: (0, PASS(s)) if s == 'main' or k != '.2' else (1, jerr(A2, side=s))), {}, None),
 ('B06', 'main fails A2 in run 1 only · branch passes ×3', 0, {S: 'assert'},
  three(S, lambda s, k: (1, jerr(A2, side=s)) if s == 'main' and k == '' else (0, PASS(s))), {}, 'yes'),
 ('B07', 'main fails A2 and A5 · branch fails only A2 (fewer)', 0, {S: 'assert'},
  three(S, lambda s, k: (1, jerr(A2, A2.replace('A2', 'A5'), side=s)) if s == 'main' else (1, jerr(A2, side=s))), {}, 'yes'),
 ('B08', 'an error message holding "]" · main and branch the same', 0, {S: 'assert'},
  three(S, lambda s, k: (1, jerr('C1: list [1,2] not [3]', side=s))), {}, 'yes'),
 ('B09', 'test_103 style: exit 0 + the same page error on both sides ×3', 0, {'test_103_village': 'legacy'},
  three('test_103_village', lambda s, k: (0, LEG().replace('errors 0 []', "errors 1 [ 'Uncaught Error: test boom' ]"))), {}, None),
 ('L01', 'legacy: branch exit 0 but a new page error (errors 2 […])', 1, {'test_104_lantern': 'legacy'},
  three('test_104_lantern', lambda s, k: (0, LEG()) if s == 'main' else (0, LEG().replace('errors 0 []', "errors 2 [ 'Uncaught TypeError: x is null', 'y' ]"))), {}, None),
 ('L02', 'legacy: a printed value changes (adultLamp 1 → false) ×3', 3, {'test_104_lantern': 'legacy'},
  three('test_104_lantern', lambda s, k: (0, LEG(1 if s == 'main' else False))), {}, None),
 ('L03', 'legacy: only numbers differ (times, coordinates)', 0, {'test_104_lantern': 'legacy'},
  three('test_104_lantern', lambda s, k: (0, LEG() if s == 'main' else LEG().replace('1234', '987').replace('-12.5', '3')), 1), {}, None),
 ('L04', 'legacy: a random pick list that differs from run to run → cannot judge (no tolerance for random lists)', 3, {'test_109_mail': 'legacy'},
  three('test_109_mail', lambda s, k: (0, LEG(extra={('main', ''): '"clock_shop"\n"house_w2"\n', ('main', '.2'): '"blacksmith"\n"stall"\n', ('main', '.3'): '"house_w1"\n"stall"\n',
        ('branch', ''): '"blacksmith"\n"house_w1"\n', ('branch', '.2'): '"stall"\n"clock_shop"\n', ('branch', '.3'): '"house_w2"\n"house_w1"\n'}[(s, k)]))), {}, None),
 ('A01', 'node assert: the same assert fails on both sides (folders and printed state differ)', 0, {'test_170_swordsman': 'assert'},
  three('test_170_swordsman', lambda s, k: (1, asrt(s))), {}, 'yes'),
 ('A02', 'node assert: the branch stops at a LATER assert than main (same headline) → cannot judge', 3, {'test_170_swordsman': 'assert'},
  three('test_170_swordsman', lambda s, k: (1, asrt(s) if s == 'main' else asrt(s, 'assert(await p.evaluate(()=>SW170.sheets))', (31, 12)))), {}, 'yes'),
 ('A03', 'puppeteer timeout: same wait, same place, both sides', 0, {'test_167_context_bubble': 'assert'},
  three('test_167_context_bubble', lambda s, k: (1, tmo(s))), {}, 'yes'),
 ('A04', 'puppeteer timeout: same message, thrown from a LATER line of the suite on the branch → cannot judge', 3, {'test_167_context_bubble': 'assert'},
  three('test_167_context_bubble', lambda s, k: (1, tmo(s, '27:324' if s == 'main' else '41:88'))), {}, 'yes'),
 ('A08', 'node assert: the branch stops EARLIER in the suite than main ever did → regression', 1, {'test_170_swordsman': 'assert'},
  three('test_170_swordsman', lambda s, k: (1, asrt(s) if s == 'main' else asrt(s, 'assert(await p.evaluate(()=>gmOn()))', (12, 5)))), {}, 'yes'),
 ('A05', 'main fails only with COLLECTED errors (A2) · the branch also throws a TypeError → regression', 1, {S: 'assert'},
  three(S, lambda s, k: (1, jerr(A2, side=s)) if s == 'main' else (1, jerr(A2, side=s) + "TypeError: Cannot read properties of null (reading 'x')\n" + stack(s))), {}, 'yes'),
 ('A06', 'main passes · the branch stops on an assert → regression', 1, {'test_170_swordsman': 'assert'},
  three('test_170_swordsman', lambda s, k: (0, '{ swError: false }\n') if s == 'main' else (1, asrt(s))), {}, 'yes'),
 ('A07', 'main stops at an assert in run 1 and another in run 2 · the branch at either → ok', 0, {'test_170_swordsman': 'assert'},
  three('test_170_swordsman', lambda s, k: (1, asrt(s) if (s, k) in (('main', ''), ('branch', '.2'), ('branch', '.3')) else asrt(s, 'assert(await p.evaluate(()=>PS.gmSprite170))', (30, 472)))), {}, 'yes'),
 ('M08', '5 runs per side after RERUNS=4 (allowed)', 0, {S: 'assert'},
  {(S, side, k): (1, jerr(A2, side=side)) for k in ('', '.2', '.3', '.4', '.5') for side in ('main', 'branch')}, {}, 'yes'),
 ('M09', '5 runs on main, 3 on the branch', 3, {S: 'assert'},
  {(S, side, k): (1, jerr(A2, side=side)) for k in ('', '.2', '.3', '.4', '.5') for side in ('main', 'branch') if side == 'main' or k in ('', '.2', '.3')}, {}, 'yes'),
 ('L05', 'legacy: ONE long line (> 240 chars, as the suites print) changes one word near its end (ตี → ตีเลย)', 3, {'test_121_beds': 'legacy'},
  three('test_121_beds', lambda s, k: (0, json.dumps({'version': 'Lantern Academy 2.33', 'bedsAtStart': {'plantable': 3, 'weeds': 5}, 'pad': 'x' * 300,
        'buttonOnRightBed': 'ตี' if s == 'main' else 'ตีเลย'}, ensure_ascii=False, separators=(',', ':')) + '\nerrors 0 []\n')), {}, None),
 ('L06', 'Codex T36-N1: legacy, the branch prints everything but ONE line (feature: true) ×3', 3, {'test_109_mail': 'legacy'},
  three('test_109_mail', lambda s, k: (0, '{\n  "start": 1,\n' + ('  "feature": true,\n' if s == 'main' else '') + '  "end": 2\n}\nerrors 0 []\n')), {}, None),
 ('L07', 'Codex T36-N1: legacy, two lines swap order (alpha/beta → beta/alpha) ×3', 3, {'test_109_mail': 'legacy'},
  three('test_109_mail', lambda s, k: (0, ('alpha\nbeta\n' if s == 'main' else 'beta\nalpha\n') + 'errors 0 []\n')), {}, None),
 ('L08', 'legacy: a line printed twice on main, once on the branch ×3', 3, {'test_109_mail': 'legacy'},
  three('test_109_mail', lambda s, k: (0, ('"stall"\n"stall"\n' if s == 'main' else '"stall"\n') + 'errors 0 []\n')), {}, None),
 ('L09', 'legacy: several lines, the same on both sides but every number differs (1 run)', 0, {'test_109_mail': 'legacy'},
  three('test_109_mail', lambda s, k: (0, '{\n  "start": %d,\n  "feature": true,\n  "x": [%s]\n}\nerrors 0 []\n' % ((1, '1.5, -2') if s == 'main' else (7, '3.25, 9'))), 1), {}, 'no'),
 ('M10', 'Codex T36-N2 (before): 5 runs per side, the branch has "new regression" in run 2 only', 1, {S: 'assert'},
  {(S, side, k): (1, jerr(A2 if not (side == 'branch' and k == '.2') else 'new regression', side=side)) for k in ('', '.2', '.3', '.4', '.5') for side in ('main', 'branch')}, {}, 'yes'),
 ('M11', 'Codex T36-N2: the same folder with run 2 deleted on both sides (4 files), ALLDONE kept', 3, {S: 'assert'},
  {(S, side, k): (1, jerr(A2 if not (side == 'branch' and k == '.2') else 'new regression', side=side)) for k in ('', '.2', '.3', '.4', '.5') for side in ('main', 'branch')},
  {'tamper': lambda d: [os.remove(f) for f in glob.glob(os.path.join(d, '*.2.*'))]}, 'yes'),
 ('M12', 'Codex T36-N2: only runs 1, 3, 4 on both sides, and runs.tsv/ALLDONE agree with that', 3, {S: 'assert'},
  {(S, side, k): (1, jerr(A2, side=side)) for k in ('', '.3', '.4') for side in ('main', 'branch')}, {}, 'yes'),
 ('M13', 'ALLDONE of an older runner (no suites=/runs=/manifest=)', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {'alldone': 'old'}, 'no'),
 ('M14', 'a log changed after the run (a failure line removed)', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s)) if s == 'main' else (1, jerr(A2, 'new regression', side=s))),
  {'tamper': lambda d: open(os.path.join(d, f'{S}.branch.2.log'), 'w').write(jerr(A2, side='branch'))}, 'yes'),
 ('M15', 'a run on disk that runs.tsv does not list (branch run 4 added later)', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s))),
  {'tamper': lambda d: (open(os.path.join(d, f'{S}.branch.4.exit'), 'w').write('0 1\n'), open(os.path.join(d, f'{S}.branch.4.log'), 'w').write(PASS('branch')))}, 'yes'),
 ('M16', 'runs.tsv edited (one line dropped) without ALLDONE', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s))),
  {'tamper': lambda d: edit(d, 'runs.tsv', open(os.path.join(d, 'runs.tsv')).readlines()[-1], '')}, 'yes'),
 ('K01', 'Codex T37-N1: the word-change folder (OUTPUT DIFFERS) with kind legacy → legacY in suites.tsv after the run', 3, {'test_121_beds': 'legacy'},
  three('test_121_beds', lambda s, k: (0, LEG(1 if s == 'main' else False))),
  {'tamper': lambda d: edit(d, 'suites.tsv', '\tlegacy\t', '\tlegacY\t')}, None),
 ('K02', 'Codex T37-N1: the same folder with kind legacy → assert (a real kind, not the one the runner chose)', 3, {'test_121_beds': 'legacy'},
  three('test_121_beds', lambda s, k: (0, LEG(1 if s == 'main' else False))),
  {'tamper': lambda d: edit(d, 'suites.tsv', '\tlegacy\t', '\tassert\t')}, None),
 ('K03', 'a kind that is not legacy/assert, written so by the runner itself (hashes agree)', 3, {S: 'Assert'}, three(S, lambda s, k: (0, PASS(s)), 1), {}, 'no'),
 ('K04', 'env.txt changed after the run (the folders used for masking)', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1),
  {'tamper': lambda d: open(os.path.join(d, 'env.txt'), 'a').write('maindir /elsewhere\n')}, 'no'),
 ('K05', 'Codex T37-N2: a log of run 99 with "Error: new regression" and no exit, not in runs.tsv', 3, {'test_103_village': 'legacy'},
  three('test_103_village', lambda s, k: (0, LEG())),
  {'tamper': lambda d: open(os.path.join(d, 'test_103_village.branch.99.log'), 'w').write('Error: new regression\n')}, None),
 ('K06', 'a file the runner never writes, at the top of OUT', 3, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1),
  {'tamper': lambda d: open(os.path.join(d, 'notes.txt'), 'w').write('x')}, 'no'),
 ('K07', 'a suite\'s own output folder out_<run> with files in it (allowed, not evidence)', 0, {S: 'assert'}, three(S, lambda s, k: (0, PASS(s)), 1),
  {'tamper': lambda d: (os.makedirs(os.path.join(d, f'out_{S}.branch')), open(os.path.join(d, f'out_{S}.branch', 'shot.png'), 'w').write('x'))}, 'no'),
 ('K08', 'the runner itself wrote kind assert for a suite file with no assert (hashes all agree): worked out again from the file', 3, {S: 'assert'},
  three(S, lambda s, k: (0, PASS(s)), 1), {'files': {S: "const p=require('puppeteer');(async()=>{console.log('errors',0,[])})()\n"}}, 'no'),
 ('K09', 'control for K08: the suite file has errors.push and suites.tsv says assert', 0, {S: 'assert'},
  three(S, lambda s, k: (0, PASS(s)), 1), {'files': {S: "const errors=[];errors.push('x');process.exit(errors.length?1:0)\n"}}, 'no'),
 ('K10', 'Codex T38-N1: an extra test_103_village.branch.1.log ("Error: new regression") beside the real run-1 log', 3, {'test_103_village': 'legacy'},
  three('test_103_village', lambda s, k: (0, LEG())), {'tamper': lambda d: open(os.path.join(d, 'test_103_village.branch.1.log'), 'w').write('Error: new regression\n')}, None),
 ('K11', 'Codex T38-N1: the same with .branch.01.log', 3, {'test_103_village': 'legacy'},
  three('test_103_village', lambda s, k: (0, LEG())), {'tamper': lambda d: open(os.path.join(d, 'test_103_village.branch.01.log'), 'w').write('Error: new regression\n')}, None),
 ('K12', 'an extra .main.02.exit beside a real run 2 (leading zero)', 3, {S: 'assert'}, three(S, lambda s, k: (1, jerr(A2, side=s))),
  {'tamper': lambda d: open(os.path.join(d, f'{S}.main.02.exit'), 'w').write('0 1\n')}, 'yes'),
 ('F01', 'flaky suite: branch timeout ×3 → run it alone (cannot judge)', 3, {'test_176_steer_and_act': 'assert'},
  three('test_176_steer_and_act', lambda s, k: (0, PASS(s)) if s == 'main' else (124, 'half\n')), {}, None),
]

def main():
    keep = os.environ.get('SELFTEST_KEEP')   # a folder outside the repo: keep the made-up folders there (e.g. to run an older comparator on them)
    root = keep or tempfile.mkdtemp(prefix='g4_m1_selftest_')
    ok = 0
    rows = []
    try:
        for cid, why, want, suites, runs, opt, rer in CASES:
            runs = {k: v for k, v in runs.items() if v is not None}
            d = os.path.join(root, cid)
            write(d, suites, runs, **opt)
            p = subprocess.run([sys.executable, '-I', '-B', CMP, d, '--json', d + '.json'], capture_output=True, text=True)
            got = p.returncode
            res = json.load(open(d + '.json')) if os.path.exists(d + '.json') else {}
            verd = '; '.join(r.get('verdict', '') for r in res.get('rows', []))
            rr = None
            if rer is not None:
                q = subprocess.run([sys.executable, '-I', '-B', CMP, '--needs-rerun', d, next(iter(suites))], capture_output=True, text=True)
                rr = q.stdout.strip()
            good = got == want and (rer is None or rr == rer)
            ok += good
            rows.append((cid, want, got, rr, 'OK' if good else 'WRONG', why, ('META ' + res['meta'][0]) if res.get('meta') else verd))
    finally:
        if not keep: shutil.rmtree(root, ignore_errors=True)
    for r in rows: print('%-5s want %d got %d rerun %-4s %-5s %s → %s' % (r[0], r[1], r[2], r[3] or '-', r[4], r[5], r[6][:110]))
    print(json.dumps({'cases': len(CASES), 'right': ok, 'wrong': [r[0] for r in rows if r[4] != 'OK'],
                      'byWant': {w: sum(1 for c in CASES if c[2] == w) for w in (0, 1, 3)}}))
    sys.exit(0 if ok == len(CASES) else 1)

main()
