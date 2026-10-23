#!/usr/bin/env python3
# Design Preflight for ASSET_SPEC_13 (lantern L0, S view) - version 1.2c (Claude · 19 Oct 2569 · owner approved for the repo ~22:0x after ChatGPT static review, correction round 2; correction round 3 = blank path refused, owner approved 20 Oct 2569 ~09:5x; correction round 4 = OUT may not be any input file by real path or by file name, owner approved 20 Oct 2569 ~18:3x; correction round 5 = OUT only in a new empty folder outside every repository, real folders and repositories of the inputs protected, owner approved 20 Oct 2569 ~19:0x; correction round 6 = one real OUT path for checks and writes, bare repositories, never delete or overwrite, owner approved 20 Oct 2569 ~19:3x; correction round 7 = bare HEAD may be a symlink, OUT folder must open as the system opens it, stale text removed, scope and known limits stated, owner approved 22 Oct 2569 ~02:0x; text-only round 7b = limits worded as tested, owner approved 23 Oct 2569 ~01:1x; text-only round 7c = deleted working folder only with relative paths, X7 incl. reference folders, concurrent runs may both FAIL, owner approved 23 Oct 2569 ~16:1x)
#   --round fix3 = spec 10.10 (v1.2b): route M, sheet B fix2 -> new · the same D items and PASS rule as the 1.2b script at 75d7c47 (fix3 776eae0 can be re-checked)
#   --round fix4 = spec 10.11 (v1.2c): route K (B36) · P1a-P1d plan match (base 36 px, alpha, light layer, ON view) · P2 kept file · X1 numbers of the plan · sheet B fix3 -> new
# NOT a QA gate. The official QA stays qa_asset13.py QA 1.2a (24 gates, unchanged, SHA-256 pinned); this script runs it first, then the design checks.
# Read-only on every input. Writes only OUT_JSON (through OUT_JSON.tmp) and OUT_JSON.qa12a.json, into a NEW EMPTY folder (so an old result is never read).
# Refused (exit 2, nothing touched): the folder of OUT_JSON does not open as given, is not empty, cannot be listed, or is inside any git repository (bare
#   ones included, HEAD may be a symlink); OUT_JSON, OUT_JSON.qa12a.json or
#   OUT_JSON.tmp lies inside the delivery, a reference folder, the real folder of any input file or a repository that holds the script or an input
#   (subfolders included, real paths after symlinks), is a symlink or not a regular file, equals an input file or this script itself (protected even when
#   its folder is not in a repository), or has the file name of an input file. OUT_JSON is resolved ONCE to its real folder (symlinks and '..' as the
#   system resolves them) and every check and write uses that path. This script deletes nothing but its own new temp file and never replaces an
#   existing file: OUT_JSON.tmp is created new, OUT_JSON is published with a hard link that fails if it exists, a failed publish = FAIL, and the OUTPUT
#   line reports the real state of OUT_JSON, OUT_JSON.tmp and OUT_JSON.qa12a.json. Scope: protects against mistakes of whoever runs it, given a correctly
#   prepared OUT folder (new, empty, apart from repositories / inputs / references); it does not close every race. Never run two checks in one OUT
#   folder at the same time (if it happens: at most one publishes, both may FAIL, OUT_JSON.qa12a.json may come from the other run; no fake PASS seen).
#   Known limits, NOT fixed: R1 - OUT_JSON.qa12a.json is written by the unchanged QA 1.2a with a normal open (only checked to be absent before QA
#   starts), so another process that plants a symlink there while QA runs can make QA overwrite the target, and that run may still PASS; X7 - with a
#   mistyped (missing) input folder, OUT may be created in an empty subfolder of the real delivery or reference folder when that folder is outside a
#   protected repository (2 new files - OUT_JSON and OUT_JSON.qa12a.json - exit 1; nothing overwritten). Prepare a new folder for EVERY run:
#   OUTDIR=$(mktemp -d /tmp/preflight-XXXXXX) ; OUT_JSON=$OUTDIR/preflight.json
# Never crashes on bad input: anything that cannot be evaluated = FAIL (no fake PASS). One known exception: if the working folder has been deleted and a
#   path is given relative to it, Python stops with a traceback (exit 1, nothing written); with absolute paths the run is normal.
#   MANUAL items are judged by people and never count as PASS.
# usage: python3 -I qa_asset13_design.py --round fix3 DIR FIX1_DIR FIX2_DIR HOLD_ANCHORS_JSON OUT_JSON
#        python3 -I qa_asset13_design.py --round fix4 DIR FIX1_DIR FIX2_DIR FIX3_DIR HOLD_ANCHORS_JSON OUT_JSON
#   DIR      = delivery: 4 asset files + sheet A ...-fix2-compare-x8.png (fixed QA 10' name, fix1 -> new) + sheet B of the round
#   FIX1_DIR = fix1 12948e2 (QA 1.2a reference, sheet A "before") · FIX2_DIR = fix2 ca3d75b (D1d opaque limit, D3d colours, sheet B "before" in round fix3)
#   FIX3_DIR = fix3 776eae0 (round fix4 only: P1 base, sheet B "before")
#   pinned by SHA-256: qa_asset13.py, fix1, fix2, fix3 (round fix4), the hold anchors json and the 2 sprite sheets G3 uses; any mismatch = PREFLIGHT FAIL
# exit 0 = machine PREFLIGHT PASS · 1 = FAIL · 2 = usage/setup error. Every setup check runs before any file is touched, so exit 2 removes and writes nothing.
#   After exit 2 an OUT_JSON that already exists is from an earlier run and must never be read as a result.
# A reader takes a result as PASS only with: exit 0 · OUT_JSON preflight = PASS · run_id = the RUN_ID line printed by this run · round = the round asked for
#   · inputs_sha256 = the files meant to be checked. OUT_JSON records argv, time, run_id and the SHA-256 of every input.
# Result words: item = PASS / FAIL · D3c row = OK / REVERSED / N/A · route = M / K / UNCLEAR · items judged by people = MANUAL (never counted as PASS)
import sys, os, json, math, ast, hashlib, subprocess, datetime, uuid
import numpy as np
from PIL import Image

VERSION = '1.2c'
HERE = os.path.dirname(os.path.abspath(__file__)); QA = os.path.join(HERE, 'qa_asset13.py'); LOAD_ERR = None
HERE_REAL = os.path.dirname(os.path.realpath(__file__))   # the script's real folder (symlinks resolved): the repository holding it is protected from OUT_JSON
QA_SHA = '803625c902527922b2ee38ff0e3ee6d4501241d51a8d46b207adcc4c58508820'   # qa_asset13.py at a2efe77
try:   # the same L*/dE00 code as QA 1.2a, copied at run time from the unchanged file - only after its SHA-256 is confirmed
    _raw = open(QA, 'rb').read()
    if hashlib.sha256(_raw).hexdigest() != QA_SHA: raise ValueError('qa_asset13.py SHA-256 mismatch (not the a2efe77 file)')
    _src = _raw.decode('utf-8'); _ns = {'math': math}
    exec(_src[_src.index('def lab'):_src.index('def hexc')], _ns); lab, de00 = _ns['lab'], _ns['de00']
    EXPECTED_V12 = ast.literal_eval(next(x for x in _src.splitlines() if x.startswith('EXPECTED_V12 = ')).split('=', 1)[1].strip())   # the 24 gate ids of QA 1.2a
except Exception as e: lab = de00 = None; EXPECTED_V12 = []; LOAD_ERR = 'cannot load lab/de00/EXPECTED_V12 from qa_asset13.py: ' + repr(e)
BASE = 'c2-held-lantern_L0-S-trial'; SHEET_A = BASE + '-fix2-compare-x8.png'
SHEET_B = BASE + '-fix3-vs-fix2-x8.png'   # sheet B of round fix3 (name kept for the 1.2b test file); round fix4 uses ROUNDS['fix4']['sheet_B']
ANCH_FILES = ['c2-pilot-kid4-idleanim.png', 'c2-pilot-kid4-walkhold.png']   # the sprite sheets QA G3 reads (named in the pinned anchors json)
REF = {'qa_asset13.py (a2efe77)': QA_SHA,
       'fix1 12948e2 .png': '1b1ae264c8603a4be6c7551b3efe7f73b3eaf189b8c3d0b445cb470ca2c23fa7', 'fix1 12948e2 -light.png': 'd8e75b18f654468627feecf0d75ac991fb1fe3566e6fd629e7f80e0a8f42aeb4',
       'fix2 ca3d75b .png': 'b75105d97518b893179b7dbeaf2cbd10f63660cf640c2b3b2bf6b7aa21cd4409', 'fix2 ca3d75b -light.png': '349ed6efcd204b946d9ba04cf3bfa45060ea809c1d850768c0e77aaa3019388f',
       'hold anchors json (87bba95 = a2efe77)': '38f16cd4418e13b905b6b8fa53b8c307f09489b1248ef92515c601dc2094acba',
       'G3 sheet c2-pilot-kid4-idleanim.png (1714c65 = a2efe77)': '13182512fd2a0d6b2a1947fcc3eea9cd883d760c018792d5cc278ad144156045',
       'G3 sheet c2-pilot-kid4-walkhold.png (fd2a55f = a2efe77)': '3dbe652d8a5f18b869b42ddd27a523d1d03609096e397507839d82c6cb310553'}
REF_FIX3 = {'fix3 776eae0 .png': '6693413f3cf0e7d4c84b1e9032ae5c4ea7676d72e1a057bab7c052688961e0f2',   # round fix4 only: the base of the B36 plan
            'fix3 776eae0 -light.png': 'e86599ffcab25f03fc86ca774227806f1c506726ebe80657acbc88cfd645b8a5'}
FIX3_SHEET_B_SHA = '4170f28ee38ee99affa47e74492bddf3923d313d056e92dd64b10a1bd9410a06'   # fix3's sheet B (fix2 -> fix3): must stay byte-identical in a fix4 delivery (P2)
ROUTES = {'M': {'frame_left': ['#915B49'], 'frame_right': ['#67413A'], 'rib_left': ['#BB7A57'], 'rib_right': ['#915B49']},   # fix3 (spec 10.10)
          'K': {'frame_left': ['#BB7A57'], 'frame_right': ['#915B49'], 'rib_left': ['#BB7A57'], 'rib_right': ['#915B49']}}   # fix4 (spec 10.11)
ROUTE_TEXT = {'M': 'route M (owner-selected design direction)', 'K': 'route K (owner-selected design direction for fix4, spec 10.11)'}
PLUM = (0x3A, 0x1E, 0x3F); COPPER = [(0x3D, 0x29, 0x2C), (0x67, 0x41, 0x3A), (0x91, 0x5B, 0x49), (0xBB, 0x7A, 0x57)]
GLASS_L = (0xFF, 0xB3, 0x6B); BG_DARK = (0x1E, 0x1B, 0x2E)
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))   # 4-neighbour only, never diagonal
CX = 16                                    # centre column (grip x): left side = x <= 15, right side = x >= 17
ROWS_SIDE = range(12, 19); ROWS_D3C = range(10, 21); MIN_EVAL_D3C = 8; RIB_COLS = [14, 18]
D_IDS = ['D1a', 'D1b', 'D1c', 'D1d', 'D2a', 'D2b', 'D2c', 'D3a', 'D3b', 'D3c', 'D3d', 'D4a', 'D4b', 'D4c', 'D4d']
# spec 10.11 table B: (x, y, colour in fix3 776eae0, new colour) - base image only, 36 entries, nothing else may change
PLAN_B36 = tuple([(11, y, '#915B49', '#BB7A57') for y in range(12, 17)] + [(12, 17, '#915B49', '#BB7A57'), (12, 18, '#915B49', '#BB7A57')]     # left frame
               + [(21, y, '#67413A', '#915B49') for y in range(12, 17)] + [(20, 17, '#67413A', '#915B49'), (20, 18, '#67413A', '#915B49')]   # right frame
               + [(x, 11, '#67413A', '#915B49') for x in (18, 19, 20)]                                                                           # cap
               + [(x, 19, '#67413A', '#915B49') for x in (17, 18, 19, 20)]                                                                       # base
               + [(19, 12, '#71606A', '#55434C'), (20, 12, '#71606A', '#55434C')] + [(20, y, '#71606A', '#55434C') for y in range(13, 17)]
               + [(19, 17, '#71606A', '#55434C'), (19, 18, '#71606A', '#55434C'), (17, 18, '#71606A', '#55434C')]                               # right + centre glass
               + [(12, 13, '#71606A', '#A89AA1'), (12, 14, '#71606A', '#A89AA1')]                                                                 # left glass reflection
               + [(13, y, '#71606A', '#55434C') for y in (15, 16, 17, 18)])                                                                      # left glass gradient
# spec 10.11 table C: numbers of the B36 plan (fix3 + the 36 px, measured 18 Oct with the unchanged QA 1.2a code); X1 compares the run against them
EXPECTED_FIX4 = {'D4b_unlit_min (>=14)': 16.38, '8c_unlit_min (QA, >=10)': 16.38, '8c_lit_min (QA, >=10)': 19.11,
                 'C2_glass_min_unlit_lit (>=15)': [19.47, 19.11], 'C2_crystal_min_unlit_lit (>=15)': [18.23, 32.26],
                 'V5a_min (>=20)': 23.07, 'V5b_min (>=15)': 15.87, 'G1_glass_light_px (report only)': 37,
                 'G3_max_per_dir': {'S': 6, 'SE': 6, 'E': 8, 'NE': 4, 'NW': 4, 'W': 8, 'SW': 6},
                 'D3a_diff': 13.03, 'D3b_diff': 13.03, 'opaque_px': 168, 'n_colours': 9, 'outer_plum (QA 4)': '46/46'}
X1_MARGIN_KEYS = ['D4b_unlit_min (>=14)', '8c_unlit_min (QA, >=10)', '8c_lit_min (QA, >=10)', 'C2_glass_min_unlit_lit (>=15)', 'C2_crystal_min_unlit_lit (>=15)',
                  'V5a_min (>=20)', 'V5b_min (>=15)', 'G1_glass_light_px (report only)', 'G3_max_per_dir']
TOL = 0.01   # X1: a decimal may differ from table C by at most 0.01 (values are reported to 2-4 decimals); counts and text must be exact
MANUAL_FIX3 = [('M1 (D1e)', 'ChatGPT at 75% and 100%: the body y12-16 (13 px wide for 5 rows) no longer reads as a box'),
               ('M2 (G1)', 'ChatGPT: real brightness of the lit glass (G1 px reported) at 75% ON on light / dark / cave'),
               ('M3 (route M)', 'ChatGPT: the light right glass edge next to dark copper reads as a reflection, not reversed light - 75% OFF/ON x light/dark/cave'),
               ('M4 (sheets)', 'sheet A (fixed QA name, fix1 -> new) and sheet B (fix2 -> new) carry readable labels in the top bands; CODEX_STATUS says which is which; '
                               'the sheet background contrasts with the plum outline #3A1E3F (checked by eye - this script does not check it)')]
MANUAL_FIX4 = [('M1 (D1e)', 'ChatGPT at 75% and 100%: the body y12-16 (13 px wide for 5 rows) no longer reads as a box - B36 keeps the silhouette, judge it as it is'),
               ('M2 (G1)', 'ChatGPT: real brightness of the lit glass (G1 = 37 px) at 75% ON on light / dark / cave'),
               ('M3 (route K)', 'ChatGPT: the dark right glass reads as the shadow side of glass, not a hole; frame and rib of the same tone on each side do not read as bars - 75% OFF/ON x light/dark/cave'),
               ('M4 (sheets)', 'sheet A (fixed QA name, fix1 -> fix4) and sheet B (fix3 776eae0 -> fix4) carry readable labels in the top bands; CODEX_STATUS says which is which; '
                               'the sheet background contrasts with the plum outline #3A1E3F (checked by eye - this script does not check it)'),
               ('M5 (glass)', 'ChatGPT at 75% and 100% OFF on light / dark / cave: the glass reads as glass, not as locker vents; the 2-px reflection #A89AA1 does not read as a second crystal')]
ROUND_IDS_FIX4 = ['P1a', 'P1b', 'P1c', 'P1d', 'P2', 'X1']
ROUNDS = {'fix3': {'spec': '10.10 (v1.2b)', 'route': 'M', 'args': ['DIR', 'FIX1_DIR', 'FIX2_DIR', 'HOLD_ANCHORS_JSON', 'OUT_JSON'],
                   'sheet_B': SHEET_B, 'sheet_B_before': 'fix2', 'sheet_B_label': 'fix2 ca3d75b', 'plan': None, 'keep': {}, 'expected': None, 'round_ids': [], 'manual': MANUAL_FIX3},
          'fix4': {'spec': '10.11 (v1.2c)', 'route': 'K', 'args': ['DIR', 'FIX1_DIR', 'FIX2_DIR', 'FIX3_DIR', 'HOLD_ANCHORS_JSON', 'OUT_JSON'],
                   'sheet_B': BASE + '-fix4-vs-fix3-x8.png', 'sheet_B_before': 'fix3', 'sheet_B_label': 'fix3 776eae0', 'plan': PLAN_B36,
                   'keep': {SHEET_B: FIX3_SHEET_B_SHA}, 'expected': EXPECTED_FIX4, 'round_ids': ROUND_IDS_FIX4, 'manual': MANUAL_FIX4}}

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def hexc(c): return '#%02X%02X%02X' % tuple(int(v) for v in c[:3])

def load(d):
    a = np.array(Image.open(os.path.join(d, BASE + '.png')).convert('RGBA')).astype(int)
    l = np.array(Image.open(os.path.join(d, BASE + '-light.png')).convert('RGBA')).astype(int)
    if a.shape != (32, 32, 4) or l.shape != (32, 32, 4): raise ValueError('image size %s / %s, need 32x32' % (a.shape[:2], l.shape[:2]))
    return a, l

def qa_check(qa, gid):   # (pass, value) of one QA 1.2a gate · missing QA, missing gate, errors, exit code not explicitly 0 or pass not boolean true = never a pass
    if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list): return False, None
    for c in qa['checks']:
        if isinstance(c, dict) and str(c.get('check', '')).split(' ')[0] == gid:
            return c.get('pass') is True and not qa.get('errors') and qa.get('_exit_code') == 0, c.get('value')
    return False, None

def qa_gate(rc, qa):   # official QA counts only if: exit code 0, exactly the 24 expected gate ids once each, 24/24 PASS, no errors, nothing 'NOT EVALUATED'
    if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list): return False, {'exit_code': rc, 'result': 'QA json missing or malformed'}
    ch = qa['checks']; ids = [str(c.get('check', '')).split(' ')[0] if isinstance(c, dict) else '?' for c in ch]
    skipped = [str(c.get('check')) for c in ch if isinstance(c, dict) and 'NOT EVALUATED' in str(c.get('check', ''))]
    n_pass = sum(1 for c in ch if isinstance(c, dict) and c.get('pass') is True)
    missing = [g for g in EXPECTED_V12 if g not in ids]; unexpected = [i for i in ids if i not in EXPECTED_V12]; dup = sorted({i for i in ids if ids.count(i) > 1})
    ok = rc == 0 and len(EXPECTED_V12) == 24 and len(ch) == 24 and n_pass == 24 and not missing and not unexpected and not dup and not skipped and not qa.get('errors')
    return ok, {'exit_code': rc, 'gates': len(ch), 'pass': n_pass, 'errors': qa.get('errors'), 'skipped': skipped, 'missing_ids': missing, 'unexpected_ids': unexpected, 'duplicate_ids': dup}

def dv(v, k): return v.get(k) if isinstance(v, dict) else None   # safe read of a QA value (QA may be missing or partial)

def lit(b, li): o = b.copy(); m = li[..., 3] > 0; o[m] = li[m]; return o

def design_checks(a, l, f2, qa):
    """a, l = 32x32 RGBA int arrays of the delivery · f2 = (base, light) of fix2 or None · qa = QA 1.2a json dict or None"""
    if lab is None: raise RuntimeError(LOAD_ERR)
    if a.shape != (32, 32, 4) or l.shape != (32, 32, 4): raise ValueError('image size, need 32x32')
    op = a[..., 3] > 0; lop = l[..., 3] > 0; glass = lop & np.all(l[..., :3] == GLASS_L, axis=2)
    inb = lambda x, y: 0 <= x < 32 and 0 <= y < 32
    col = lambda x, y: tuple(int(v) for v in a[y, x, :3]) if inb(x, y) and op[y, x] else None   # None = transparent / outside
    iscop = lambda x, y: col(x, y) in COPPER
    onplum = lambda x, y: any(col(x + dx, y + dy) == PLUM for dx, dy in N4)
    Lof = lambda x, y: lab(col(x, y))[0]
    mean = lambda v: round(float(np.mean(v)), 2) if len(v) else None
    items, rep = [], {}
    def item(iid, text, fn):
        try: ok, val = fn()
        except Exception as e: ok, val = False, 'ERROR ' + repr(e)   # cannot evaluate = FAIL
        items.append({'id': iid, 'text': text, 'result': 'PASS' if ok else 'FAIL', 'value': val})
    # ---- D1 / D2 silhouette: width of every row y9-21 = rightmost - leftmost opaque x + 1 (0 = empty row)
    W = {y: (int(np.nonzero(op[y])[0].max() - np.nonzero(op[y])[0].min() + 1) if op[y].any() else 0) for y in range(9, 22)}
    rep['width_y9_21'] = [W[y] for y in range(9, 22)]; full = all(W[y] > 0 for y in range(9, 22))   # an empty row can never pass D1 (no vacuous PASS)
    item('D1a', 'width y9 -> y16 never decreases (every row y9-21 non-empty)', lambda: (full and all(W[y + 1] >= W[y] for y in range(9, 16)), [W[y] for y in range(9, 17)]))
    item('D1b', 'width y16 -> y21 never increases (every row y9-21 non-empty)', lambda: (full and all(W[y + 1] <= W[y] for y in range(16, 21)), [W[y] for y in range(16, 22)]))
    pinch = [y for y in range(10, 21) if W[y] < W[y - 1] and W[y] < W[y + 1]]
    item('D1c', 'no pinch row (narrower than both neighbours) in y10-20 (every row y9-21 non-empty)', lambda: (full and not pinch, {'pinch_rows': pinch, 'empty_rows': [y for y in range(9, 22) if W[y] == 0]}))
    n_op = int(op.sum()); n_f2 = int((f2[0][..., 3] > 0).sum()) if f2 else None
    item('D1d', 'S3 shape: cap y10-11 width <= 11, body y12-16 width = 13, opaque px <= fix2',
         lambda: (n_f2 is not None and W[10] <= 11 and W[11] <= 11 and all(W[y] == 13 for y in range(12, 17)) and n_op <= n_f2,
                  {'cap_y10_11': [W[10], W[11]], 'body_y12_16': [W[y] for y in range(12, 17)], 'opaque_px': n_op, 'fix2_opaque_px': n_f2}))
    item('D2a', 'rounded base: width y21 = width y20 - 2', lambda: (W[21] == W[20] - 2, {'y20': W[20], 'y21': W[21]}))
    ys, xs = np.nonzero(op); bb = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if op.any() else None
    item('D2b', 'bottom row y21 and bbox exactly [10,4,23,22]', lambda: (bb == [10, 4, 23, 22], {'bbox_xyxy_exclusive': bb}))
    g3ok, g3 = qa_check(qa, 'G3')
    def d2c():
        if not isinstance(g3, dict) or not isinstance(g3.get('max_increase_per_dir'), dict): return False, 'QA 1.2a G3 result missing'
        m = g3['max_increase_per_dir']; return g3ok and max(m.values()) <= 10, {'max_increase_per_dir': m, 'E': m.get('E'), 'W': m.get('W'), 'QA_G3': g3ok}
    item('D2c', 'G3 from QA 1.2a: every hold frame <= +10 vs fix1 (E/W reported; a QA run with errors = FAIL)', d2c)
    # ---- ribs (used by D3b and D4d): copper px in y12-18 with light on both 4-sides and no copper beside it = exactly 1 px wide
    rib = [(x, y) for y in ROWS_SIDE for x in range(1, 31) if iscop(x, y) and lop[y, x - 1] and lop[y, x + 1] and not iscop(x - 1, y) and not iscop(x + 1, y)]
    ribset = set(rib); rcols = sorted({x for x, _ in rib})
    # ---- D3 light from the upper left (L* of CIELAB D65, same code as QA)
    frames = {'L': [], 'R': []}   # frame = copper px in y12-18, 4-touching a plum px, not a rib column, not the centre column
    for y in ROWS_SIDE:
        for x in range(32):
            if x != CX and x not in RIB_COLS and iscop(x, y) and onplum(x, y): frames['L' if x < CX else 'R'].append((x, y))
    ribs = {'L': [(14, y) for y in ROWS_SIDE if (14, y) in ribset], 'R': [(18, y) for y in ROWS_SIDE if (18, y) in ribset]}
    def diff(pl, pr):
        mL, mR = mean([Lof(*p) for p in pl]), mean([Lof(*p) for p in pr])
        return (mL is not None and mR is not None and mL - mR >= 10), {'left_L': mL, 'right_L': mR, 'diff': round(mL - mR, 2) if None not in (mL, mR) else None, 'left_px': len(pl), 'right_px': len(pr)}
    item('D3a', 'mean L* left frame - right frame >= 10 (frame = copper 4-touching plum, y12-18)', lambda: diff(frames['L'], frames['R']))
    item('D3b', 'mean L* rib x14 - rib x18 >= 10 (rib px only, y12-18)', lambda: diff(ribs['L'], ribs['R']))
    sig = {k: sorted({'#%02X%02X%02X' % col(*q) for q in v}) for k, v in (('frame_left', frames['L']), ('frame_right', frames['R']), ('rib_left', ribs['L']), ('rib_right', ribs['R']))}
    rep['route'] = {'route': next((r for r, sg in ROUTES.items() if sig == sg), 'UNCLEAR'), 'signature': sig}   # exact colour signature, else UNCLEAR
    rows = {}
    for y in ROWS_D3C:
        lc = [Lof(x, y) for x in range(0, CX) if iscop(x, y)]; rc = [Lof(x, y) for x in range(CX + 1, 32) if iscop(x, y)]
        st = 'N/A' if not lc or not rc else ('OK' if np.mean(lc) >= np.mean(rc) - 1e-9 else 'REVERSED')
        rows[y] = {'copper_left_L': mean(lc), 'copper_right_L': mean(rc), 'status': st}
    ev = [y for y in rows if rows[y]['status'] != 'N/A']; rev = [y for y in rows if rows[y]['status'] == 'REVERSED']
    item('D3c', 'every row y10-20: mean L* copper left >= right; a row without copper on both sides = N/A (reported, not counted); >= 8 evaluable rows',
         lambda: (not rev and len(ev) >= MIN_EVAL_D3C, {'reversed_rows': rev, 'na_rows': [y for y in rows if rows[y]['status'] == 'N/A'], 'evaluable_rows': len(ev)}))
    f2cols = sorted({tuple(int(v) for v in p[:3]) for p in f2[0][f2[0][..., 3] > 0]}) if f2 else None
    cols = sorted({tuple(int(v) for v in p[:3]) for p in a[op]})
    item('D3d', 'no new colour: every opaque colour is one of the fix2 colours (Copper Trim 4 shades, plum, glass, crystal)',
         lambda: (f2cols is not None and len(cols) > 0 and set(cols) <= set(f2cols), {'n_colours': len(cols), 'new_colours': ['#%02X%02X%02X' % c for c in cols if not f2cols or c not in f2cols]}))
    rep['L_by_row'] = {y: {'frame_left': mean([Lof(x, yy) for x, yy in frames['L'] if yy == y]), 'frame_right': mean([Lof(x, yy) for x, yy in frames['R'] if yy == y]),
                           'rib_x14': round(Lof(14, y), 2) if (14, y) in ribset else None, 'rib_x18': round(Lof(18, y), 2) if (18, y) in ribset else None,
                           **rows.get(y, {})} for y in range(10, 21)}
    # ---- D4 seams
    gp = [[[int(x), int(y)], [int(x + dx), int(y + dy)]] for y, x in zip(*np.nonzero(glass)) for dx, dy in N4 if col(x + dx, y + dy) == PLUM]
    n_glass = int(glass.sum()); glass_no_base = int((glass & ~op).sum())   # no glass, or glass over nothing = cannot be judged -> FAIL
    item('D4a', 'glass px (light #FFB36B) 4-touching the plum outline = 0 (glass present, every glass px over a base px)',
         lambda: (not gp and n_glass > 0 and glass_no_base == 0, {'contacts': len(gp), 'first': gp[:6], 'glass_px': n_glass, 'glass_without_base': glass_no_base}))
    pairs = []; bad_light = 0   # (light px, 4-adjacent opaque unlit copper px of ALL 4 shades) - stricter than QA 8c, which skips #3D292C
    for y, x in zip(*np.nonzero(lop)):
        if not op[y, x]: bad_light += 1; continue   # light over a transparent base px cannot be measured -> D4b/D4c FAIL
        for dx, dy in N4:
            xx, yy = x + dx, y + dy
            if inb(xx, yy) and op[yy, xx] and not lop[yy, xx] and iscop(xx, yy):
                c = col(xx, yy); pairs.append(([int(x), int(y)], [int(xx), int(yy)], de00(col(x, y), c), de00(tuple(int(v) for v in l[y, x, :3]), c)))
    mu = min(p[2] for p in pairs) if pairs else None; ml = min(p[3] for p in pairs) if pairs else None
    ok8, v8 = qa_check(qa, '8c')
    item('D4b', 'seam unlit: every (light px, 4-adjacent copper px, all 4 shades) dE00 >= 14',
         lambda: (bool(pairs) and not bad_light and mu >= 14, {'pairs': len(pairs), 'light_px_without_base': bad_light, 'min_dE_unlit': round(mu, 2) if pairs else None,
                                                               'QA_8c_min_unlit': dv(v8, 'min_dE_unlit'), 'worst': [p[:2] for p in sorted(pairs, key=lambda p: p[2])[:3]]}))
    item('D4c', 'seam lit: QA 8c PASS and the same pairs lit dE00 >= 10', lambda: (ok8 and bool(pairs) and not bad_light and ml >= 10, {'min_dE_lit': round(ml, 2) if pairs else None, 'QA_8c': ok8}))
    def run(x):   # longest vertical run of rib px in column x
        best = cur = 0
        for y in ROWS_SIDE: cur = cur + 1 if (x, y) in ribset else 0; best = max(best, cur)
        return best
    extra = [[x, y] for y in ROWS_SIDE for x in range(32) if iscop(x, y) and not onplum(x, y) and (x, y) not in ribset]   # 2-px rib, crossbar, stray copper
    okC2, _ = qa_check(qa, 'C2'); okC2b, _ = qa_check(qa, 'C2b')
    item('D4d', 'ribs 1 px wide only at x14 and x18 (run >= 4); every other copper px in y12-18 is a frame px touching plum; QA C2 + C2b PASS',
         lambda: (rcols == RIB_COLS and all(run(x) >= 4 for x in rcols) and not extra and okC2 and okC2b,
                  {'rib_cols': rcols, 'runs': {x: run(x) for x in rcols}, 'extra_copper_px': extra[:8], 'QA_C2': okC2, 'QA_C2b': okC2b}))
    # ---- margins + G1 (report only, never a gate here; an error here never changes an item result)
    try:
        outer = {(x, y) for y, x in zip(*np.nonzero(op)) if col(x, y) == PLUM and any(col(x + dx, y + dy) is None for dx, dy in N4)}
        rim = [(x, y) for y, x in zip(*np.nonzero(op)) if y >= 10 and col(x, y) != PLUM and any((x + dx, y + dy) in outer for dx, dy in N4)]
        v5a = min((de00(col(x, y), BG_DARK) for x, y in rim), default=None)
        v5b = min((de00(col(x, y), BG_DARK) for y, x in zip(*np.nonzero(glass)) if col(x, y) is not None), default=None)
        _, c2 = qa_check(qa, 'C2'); g3m = dv(g3, 'max_increase_per_dir')
        g1_f2 = int(((f2[1][..., 3] > 0) & np.all(f2[1][..., :3] == GLASS_L, axis=2)).sum()) if f2 else None
        marg = {'G3_max_per_dir': g3m, 'G3_margin_to_10': (10 - max(g3m.values())) if isinstance(g3m, dict) and g3m else None,
                '8c_unlit_min (QA, >=10)': dv(v8, 'min_dE_unlit'), '8c_lit_min (QA, >=10)': dv(v8, 'min_dE_lit'), 'D4b_unlit_min (>=14)': round(mu, 2) if pairs else None,
                'C2_glass_min_unlit_lit (>=15)': dv(c2, 'glass_min_unlit_lit'), 'C2_crystal_min_unlit_lit (>=15)': dv(c2, 'crystal_min_unlit_lit'),
                'V5a_min (>=20)': round(v5a, 2) if v5a is not None else None, 'V5b_min (>=15)': round(v5b, 2) if v5b is not None else None,
                'G1_glass_light_px (report only)': int(glass.sum()), 'G1_fix2': g1_f2}
    except Exception as e: marg = {'error': repr(e)}
    return items, rep, marg

def check_sheet(C, before, after, name):
    """compare sheet 512x576, every px alpha 255 · 4 panels 256x256, nearest x8: (0,32) before unlit · (256,32) after unlit · (0,320) before lit · (256,320) after lit
       inside the panels: an opaque sprite cell = the exact sprite colour · a transparent sprite cell = the ONE sheet background colour (no stray px)
       bands y0-31 and y288-319 = labels (any colour, alpha 255) · sheet A = fix1 -> new (QA 10' name) · sheet B = the round's "before" -> new"""
    if C is None: return False, 'missing ' + name
    if C.shape[:2] != (576, 512): return False, {'size': [C.shape[1], C.shape[0]]}
    x8n = lambda img: np.repeat(np.repeat(img, 8, axis=0), 8, axis=1); bad_op, subs = {}, {}
    for k, (px, py, img) in {'before_unlit': (0, 32, before[0]), 'after_unlit': (256, 32, after[0]), 'before_lit': (0, 320, lit(*before)), 'after_lit': (256, 320, lit(*after))}.items():
        ref = x8n(img); sub = C[py:py + 256, px:px + 256]; m = ref[..., 3] > 0
        bad_op[k] = int((sub[m][:, :3] != ref[m][:, :3]).any(axis=1).sum()); subs[k] = sub[~m]
    allbg = np.concatenate(list(subs.values()))
    if not len(allbg): return False, 'no background cell to judge'
    vals, cnt = np.unique(allbg, axis=0, return_counts=True); bg = vals[cnt.argmax()]
    bad_bg = {k: int((v != bg).any(axis=1).sum()) for k, v in subs.items()}; alpha_bad = int((C[..., 3] != 255).sum())
    ok = all(v == 0 for v in bad_op.values()) and all(v == 0 for v in bad_bg.values()) and alpha_bad == 0
    return ok, {'size': [512, 576], 'opaque_mismatch': bad_op, 'stray_px_in_background': bad_bg, 'background': [int(v) for v in bg], 'alpha_not_255': alpha_bad}

def vis(img):   # what can be seen: a transparent px (alpha 0) counts as (0,0,0,0) whatever its RGB
    v = img.copy(); v[img[..., 3] == 0] = 0; return v

def plan_items(a, l, f3, plan, light_sha=None):
    """round fix4: P1a-P1d = the delivery vs fix3 776eae0 (pinned) and the plan table of spec 10.11 (x, y, colour in fix3, new colour)
       light_sha = SHA-256 of the delivered -light.png (None = not known -> P1c FAIL)"""
    T = {'P1a': 'base image (OFF): exactly the planned px changed, each to its planned colour, nothing else (visible compare)',
         'P1b': 'alpha of the base image: 0 px changed',
         'P1c': 'light layer untouched: RGBA of every px = fix3 (RGB of transparent px included) and the file SHA-256 = fix3 776eae0',
         'P1d': 'ON view (base + light layer on top, as drawn when lit): differs from fix3 ON exactly at the planned px the light layer does not cover'}
    if a is None or l is None or f3 is None: return [{'id': i, 'text': t, 'result': 'FAIL', 'value': 'NOT EVALUATED (delivery or fix3 missing)'} for i, t in T.items()]
    b, bl = f3; out = []
    want = {(x, y): new for x, y, old, new in plan}
    def item(iid, fn):
        try: ok, val = fn()
        except Exception as e: ok, val = False, 'ERROR ' + repr(e)
        out.append({'id': iid, 'text': T[iid], 'result': 'PASS' if ok else 'FAIL', 'value': val})
    def p1a():
        table = [[x, y] for x, y, old, new in plan if not (b[y, x, 3] == 255 and hexc(b[y, x]) == old)]   # the plan table must describe the pinned fix3
        diff = {(int(x), int(y)) for y, x in zip(*np.nonzero((vis(a) != vis(b)).any(axis=2)))}
        missing = sorted(p for p in want if p not in diff)
        wrong = sorted(p for p in want if p in diff and not (a[p[1], p[0], 3] == 255 and hexc(a[p[1], p[0]]) == want[p]))
        extra = sorted(p for p in diff if p not in want)
        return (len(want) == len(plan) > 0 and not table and not missing and not wrong and not extra,
                {'planned': len(want), 'changed': len(diff), 'missing': missing[:12], 'wrong_colour': wrong[:12], 'extra': extra[:12], 'plan_rows_not_matching_fix3': table[:12]})
    def p1b():
        n = int((a[..., 3] != b[..., 3]).sum()); return n == 0, {'alpha_px_changed': n}
    def p1c():   # stricter than P1a on purpose: the light layer must be the fix3 file itself, not only look the same
        n = int((l != bl).any(axis=2).sum()); same_file = light_sha is not None and light_sha == REF_FIX3['fix3 776eae0 -light.png']
        return n == 0 and np.array_equal(l, bl) and same_file, {'rgba_px_changed': n, 'sha256_same_as_fix3': same_file, 'sha256': light_sha}
    def p1d():
        on_want = {p for p in want if bl[p[1], p[0], 3] == 0}   # planned px that fix3's light layer does not cover
        on_diff = {(int(x), int(y)) for y, x in zip(*np.nonzero((vis(lit(a, l)) != vis(lit(b, bl))).any(axis=2)))}
        return (len(on_want) > 0 and on_diff == on_want,
                {'expected_px': len(on_want), 'changed_px': len(on_diff), 'hidden_by_light': len(want) - len(on_want), 'missing': sorted(on_want - on_diff)[:12], 'extra': sorted(on_diff - on_want)[:12]})
    for iid, fn in (('P1a', p1a), ('P1b', p1b), ('P1c', p1c), ('P1d', p1d)): item(iid, fn)
    return out

def same_num(e, v):   # X1: decimal = within TOL · int / text = exact · list / dict = element by element
    if isinstance(e, float): return isinstance(v, (int, float)) and not isinstance(v, bool) and abs(v - e) <= TOL + 1e-9
    if isinstance(e, list): return isinstance(v, list) and len(v) == len(e) and all(same_num(x, y) for x, y in zip(e, v))
    if isinstance(e, dict): return isinstance(v, dict) and set(v) == set(e) and all(same_num(e[k], v[k]) for k in e)
    return type(v) is type(e) and v == e

def expected_check(items, marg, qa, exp):   # X1: the numbers of this run vs table C of spec 10.11
    it = {i['id']: i.get('value') for i in items}; _, v4 = qa_check(qa, '4')
    act = {k: dv(marg, k) for k in X1_MARGIN_KEYS}
    act.update({'D3a_diff': dv(it.get('D3a'), 'diff'), 'D3b_diff': dv(it.get('D3b'), 'diff'), 'opaque_px': dv(it.get('D1d'), 'opaque_px'),
                'n_colours': dv(it.get('D3d'), 'n_colours'), 'outer_plum (QA 4)': dv(v4, 'outer_plum')})
    rows = {k: {'expected': e, 'actual': act.get(k), 'same': same_num(e, act.get(k))} for k, e in exp.items()}
    return all(r['same'] for r in rows.values()), {'checked': len(rows), 'tolerance_decimal': TOL, 'different': {k: r for k, r in rows.items() if not r['same']}}

def route_verdict(rt, want):
    if rt == want: return True, ROUTE_TEXT[rt]
    if rt in ROUTES: return False, 'ROUTE %s found but this round expects route %s -> FAIL' % (rt, want)
    if rt == 'UNCLEAR': return False, 'ROUTE UNCLEAR -> needs owner review, no automatic PASS'
    return False, 'route not evaluated -> FAIL'

def snapshot(paths):   # SHA-256 of every input file (None = missing or unreadable), taken before and after the run
    out = {}
    for k, p in paths.items():
        try: out[k] = sha(p)
        except Exception: out[k] = None
    return out

def parse_args(argv):   # --round fix3|fix4 first, then exactly the paths of that round
    if len(argv) < 2 or argv[0] != '--round': return None, 'the first two arguments must be --round fix3 or --round fix4'
    if argv[1] not in ROUNDS: return None, 'unknown round %r (only %s)' % (argv[1], ' / '.join(ROUNDS))
    names, rest = ROUNDS[argv[1]]['args'], argv[2:]
    if len(rest) != len(names): return None, 'round %s needs %d paths (%s), got %d' % (argv[1], len(names), ' '.join(names), len(rest))
    blank = [n for n, a in zip(names, rest) if not a.strip()]   # '' = the current folder (e.g. an unset shell variable); spaces only = almost surely a mistake
    if blank: return None, 'empty or blank path for %s (an unset shell variable?) - refused before any file is touched' % ' '.join(blank)
    return dict(zip(names, rest), round=argv[1]), None

def git_root(p):   # nearest folder at or above p (symlinks resolved) that holds a .git entry or is a bare repository (any HEAD entry - file, symlink even a dangling one, or folder; deliberately broad - + objects/ + refs/); None if there is none
    d = os.path.realpath(p)
    while True:
        if os.path.exists(os.path.join(d, '.git')) or (os.path.lexists(os.path.join(d, 'HEAD')) and os.path.isdir(os.path.join(d, 'objects')) and os.path.isdir(os.path.join(d, 'refs'))): return d
        up = os.path.dirname(d)
        if up == d: return None
        d = up

def inside(p, root):   # True when the real path p is root itself or anywhere below it (whole path parts, never a text prefix)
    try: return os.path.commonpath([p, root]) == root
    except ValueError: return False

def out_problem(outs, roots, files, names=()):   # checked before anything is touched · outs = OUT_JSON, OUT_JSON.qa12a.json, OUT_JSON.tmp · files = real paths of the inputs · names = their file names
    od = os.path.dirname(os.path.abspath(outs[0]))
    if not os.path.isdir(od): return 'folder of OUT_JSON does not exist: ' + outs[0]
    if os.path.basename(outs[0]) in ('', '.', '..'): return 'OUT_JSON is not a file name: ' + outs[0]
    for p in outs:
        if os.path.islink(p): return 'refused: %s is a symlink' % p
        if os.path.lexists(p) and not os.path.isfile(p): return 'refused: %s exists and is not a regular file' % p
        rp = os.path.realpath(p)
        if rp in files: return 'refused: %s is an input file' % p
        if os.path.basename(p) in names: return 'refused: %s has the file name of an input file (a mistyped folder could make it the real one)' % p
        for r in roots:
            if inside(rp, r): return 'refused: %s is inside the protected folder %s (the delivery, a reference folder or a repository)' % (p, r)
    return None

def out_dir_problem(out):   # the folder of OUT_JSON must be a new, empty folder outside every git repository; anything that cannot be confirmed = refused
    od = os.path.realpath(os.path.dirname(os.path.abspath(out)))
    try: entries = sorted(os.listdir(od))
    except Exception as e: return 'refused: the folder of %s cannot be listed (%r) - safety not confirmed' % (out, e)
    if entries: return 'refused: the folder of %s is not empty (%d entries, e.g. %r) - use a new empty folder for every run' % (out, len(entries), entries[0])
    g = git_root(od)
    if g: return 'refused: the folder of %s is inside the git repository %s - use a new empty folder outside every repository' % (out, g)
    return None

NOTHING_DONE = ' -> exit 2 · nothing was removed or written; an OUT_JSON that already exists is from an earlier run and is NOT a result'

def main(argv):
    A, err = parse_args(argv)
    if err:
        print('usage error: ' + err + NOTHING_DONE)
        for r, rd in ROUNDS.items(): print('usage: qa_asset13_design.py --round %s %s' % (r, ' '.join(rd['args'])))
        return 2
    rnd = A['round']; RD = ROUNDS[rnd]; j = os.path.join
    D, F1, F2, F3, ANCH, OUT_GIVEN = A['DIR'], A['FIX1_DIR'], A['FIX2_DIR'], A.get('FIX3_DIR'), A['HOLD_ANCHORS_JSON'], A['OUT_JSON']
    od_given = os.path.dirname(OUT_GIVEN) or '.'; od_real = os.path.realpath(od_given)
    try: same_dir = os.path.isdir(od_given) and os.path.samefile(od_given, od_real)   # the system must open the given folder AND it must be the resolved one (no 'missing/..')
    except OSError: same_dir = False
    if not same_dir: print('setup error: folder of OUT_JSON does not exist (or does not resolve to one real folder): ' + OUT_GIVEN + NOTHING_DONE); return 2
    OUT = os.path.join(od_real, os.path.basename(OUT_GIVEN))   # ONE real path: the folder resolved as the system does (symlink first, then '..'); checks and writes both use it
    adir = os.path.dirname(os.path.abspath(ANCH))
    qa_out, tmp_out = OUT + '.qa12a.json', OUT + '.tmp'
    dirs = [p for p in (D, F1, F2, F3, adir) if p is not None]   # every setup check below runs before any file is touched (FIX3_DIR is None in round fix3)
    roots = sorted({os.path.realpath(p) for p in dirs} | {g for g in (git_root(p) for p in [HERE_REAL] + dirs) if g})
    ref_paths = {'qa_asset13.py (a2efe77)': QA, 'fix1 12948e2 .png': j(F1, BASE + '.png'), 'fix1 12948e2 -light.png': j(F1, BASE + '-light.png'),
                 'fix2 ca3d75b .png': j(F2, BASE + '.png'), 'fix2 ca3d75b -light.png': j(F2, BASE + '-light.png'), 'hold anchors json (87bba95 = a2efe77)': ANCH,
                 'G3 sheet c2-pilot-kid4-idleanim.png (1714c65 = a2efe77)': j(adir, ANCH_FILES[0]), 'G3 sheet c2-pilot-kid4-walkhold.png (fd2a55f = a2efe77)': j(adir, ANCH_FILES[1])}
    want_ref = dict(REF)
    if rnd == 'fix4':
        ref_paths.update({'fix3 776eae0 .png': j(F3, BASE + '.png'), 'fix3 776eae0 -light.png': j(F3, BASE + '-light.png')}); want_ref.update(REF_FIX3)
    dir_paths = {n: j(D, n) for n in [BASE + s for s in ('.png', '-light.png', '.json', '-x8.png')] + [SHEET_A, RD['sheet_B']] + list(RD['keep'])}
    inputs = [QA, ANCH, __file__] + list(ref_paths.values()) + list(dir_paths.values())   # every input file + this script itself
    data_real = [os.path.realpath(p) for p in [ANCH] + [p for p in ref_paths.values() if p != QA] + list(dir_paths.values())]   # where the input data really is (symlinks followed)
    roots = sorted(set(roots) | {os.path.dirname(rp) for rp in data_real} | {g for g in (git_root(rp) for rp in data_real) if g})   # their real folders and repositories are protected too
    bad = out_problem([OUT, qa_out, tmp_out], roots, {os.path.realpath(p) for p in inputs}, {os.path.basename(p) for p in inputs})   # real paths (symlinks followed) + file names
    bad = bad or out_dir_problem(OUT)   # then: the folder of OUT_JSON must be new and empty, outside every git repository
    if bad: print('setup error: ' + bad + NOTHING_DONE); return 2
    if LOAD_ERR: print('setup error: ' + LOAD_ERR + NOTHING_DONE); return 2
    for p in (OUT, qa_out, tmp_out):   # the folder was empty a moment ago: anything here now is not ours -> refuse; this script never deletes a file that is not its own
        if os.path.lexists(p): print('setup error: refused: %s appeared after the checks' % p + NOTHING_DONE); return 2
    run_id = uuid.uuid4().hex   # printed and stored in OUT_JSON: a reader matches the two
    errors = []; qa = None; rc = None
    watch = {**{'ref ' + k: p for k, p in ref_paths.items()}, **{'dir ' + k: p for k, p in dir_paths.items()}}
    before = snapshot(watch)   # 0) pinned references + every delivery file, hashed before the run (and again after it)
    refs = {k: 'OK' if before['ref ' + k] == want_ref[k] else ('MISSING' if before['ref ' + k] is None else 'SHA-256 MISMATCH') for k in ref_paths}
    refs_ok = all(v == 'OK' for v in refs.values())
    if not refs_ok: errors.append('references: ' + json.dumps(refs))
    try:   # 1) official QA 1.2a, unchanged, in its own process; the OUT folder was empty, so its result file can only come from this run (limit R1: see the header)
        p = subprocess.run([sys.executable, '-I', QA, D, ANCH, qa_out, '1.2', F1], capture_output=True, text=True, timeout=900)
        rc = p.returncode
        with open(qa_out) as fh: qa = json.load(fh)
        if not isinstance(qa, dict) or not isinstance(qa.get('checks'), list) or not all(isinstance(c, dict) and 'check' in c and 'pass' in c for c in qa['checks']):
            errors.append('QA 1.2a result malformed'); qa = None
        else:
            qa['_exit_code'] = rc   # read by qa_check: QA-based D items never pass on a non-zero exit
            if rc != 0: errors.append('QA 1.2a exit code %d (must be 0)' % rc)
    except Exception as e: errors.append('QA 1.2a not run: ' + repr(e)); qa = None
    qsha = dv(dv(qa, 'measure'), 'sha256')   # 2) the QA result must describe exactly the 4 files hashed here
    bound = isinstance(qsha, dict) and all(before['dir ' + BASE + s] is not None and qsha.get(k) == before['dir ' + BASE + s]
                                           for k, s in (('png', '.png'), ('light', '-light.png'), ('json', '.json'), ('x8', '-x8.png')))
    if qa is not None and not bound: errors.append('QA 1.2a result is not bound to the delivery files (measure.sha256 missing or different)')
    p0, qa_info = qa_gate(rc, qa)
    qa_n = qa_info.get('gates', 0); qa_pass = qa_info.get('pass', 0)
    a = l = f1 = f2 = f3 = None
    try: a, l = load(D)
    except Exception as e: errors.append('delivery: ' + repr(e))
    try: f1 = load(F1)
    except Exception as e: errors.append('fix1: ' + repr(e))
    try: f2 = load(F2)
    except Exception as e: errors.append('fix2: ' + repr(e))
    if rnd == 'fix4':
        try: f3 = load(F3)
        except Exception as e: errors.append('fix3: ' + repr(e))
    items, rep, marg = [], {}, {}
    if a is not None:
        try: items, rep, marg = design_checks(a, l, f2, qa)
        except Exception as e: errors.append('design: ' + repr(e)); items = []
    done = {i['id'] for i in items}
    items += [{'id': i, 'text': 'NOT EVALUATED (missing or broken input)', 'result': 'FAIL', 'value': errors[-1] if errors else None} for i in D_IDS if i not in done]
    items.sort(key=lambda i: D_IDS.index(i['id']))
    def sheet(name, before_img):   # strict check of a compare sheet (A: before = fix1 · B: before = fix2 in round fix3, fix3 in round fix4)
        try:
            Cp = j(D, name)
            C = np.array(Image.open(Cp).convert('RGBA')).astype(int) if os.path.exists(Cp) else None
            return check_sheet(C, before_img, (a, l), name) if (a is not None and before_img is not None) else (False, 'delivery or reference images missing')
        except Exception as e: return False, 'ERROR ' + repr(e)
    sa, sb = sheet(SHEET_A, f1), sheet(RD['sheet_B'], f2 if RD['sheet_B_before'] == 'fix2' else f3)
    qa10_ok, _ = qa_check(qa, "10'")
    rt = (rep.get('route') or {}).get('route')
    route_ok, route_msg = route_verdict(rt, RD['route'])
    round_items = []
    if RD['plan'] is not None:   # 3) round fix4 only: plan match, kept file, numbers of the plan
        round_items += plan_items(a, l, f3, RD['plan'], before['dir ' + BASE + '-light.png'])
        for name, want in RD['keep'].items():
            got = before['dir ' + name]
            round_items.append({'id': 'P2', 'text': 'kept file %s byte-identical to fix3 776eae0 (not touched)' % name, 'result': 'PASS' if got == want else 'FAIL',
                                'value': {'present': got is not None, 'sha256': got, 'expected': want}})
        try: okx, vx = expected_check(items, marg, qa, RD['expected'])
        except Exception as e: okx, vx = False, 'ERROR ' + repr(e)
        round_items.append({'id': 'X1', 'text': 'numbers of the plan (spec 10.11 table C): decimals within %.2f, counts and text exact' % TOL, 'result': 'PASS' if okx else 'FAIL', 'value': vx})
    round_ok = [i['id'] for i in round_items] == RD['round_ids'] and all(i['result'] == 'PASS' for i in round_items)
    after = snapshot(watch); same_inputs = after == before   # 4) nothing may change while the check runs
    if not same_inputs: errors.append('an input file changed during the run: ' + json.dumps(sorted(k for k in watch if before[k] != after[k])))
    pre = refs_ok and p0 and all(i['result'] == 'PASS' for i in items) and route_ok and sa[0] and qa10_ok and sb[0] and round_ok and bound and same_inputs and not errors
    info = {}
    if rnd == 'fix3': info['delivery_is_fix3_776eae0 (report only)'] = (before['dir ' + BASE + '.png'] == REF_FIX3['fix3 776eae0 .png'] and before['dir ' + BASE + '-light.png'] == REF_FIX3['fix3 776eae0 -light.png'])
    R = {'version': VERSION, 'run_id': run_id, 'round': rnd, 'spec': RD['spec'], 'preflight': 'PASS' if pre else 'FAIL', 'manual': 'M items are judged by people in the Artistic Review (never counted here)',
         'references': refs, 'qa_1_2a': {**qa_info, 'all_24_pass_exit0': p0}, 'items': items,
         'route': {'result': 'PASS' if route_ok else 'FAIL', 'value': route_msg, 'expected': RD['route'], 'signature': (rep.get('route') or {}).get('signature')},
         'round_items': round_items,
         'sheet_A': {'result': 'PASS' if sa[0] and qa10_ok else 'FAIL', 'file': SHEET_A, 'before': 'fix1 12948e2', 'strict': sa[1], 'QA_10prime': qa10_ok},
         'sheet_B': {'result': 'PASS' if sb[0] else 'FAIL', 'file': RD['sheet_B'], 'before': RD['sheet_B_label'], 'strict': sb[1]},
         'guards': {'out_json_real': OUT, 'protected_roots': roots, 'qa_result_bound_to_delivery': bound, 'inputs_unchanged_during_run': same_inputs},
         'manual_for_artistic_review': [{'id': i, 'check': t, 'result': 'MANUAL'} for i, t in RD['manual']], 'report': rep, 'margins': marg, 'info': info, 'errors': errors,
         'argv': list(argv), 'run_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'), 'inputs_sha256': before,
         'rule': 'Design Preflight is not QA. A FAIL is reported to the owner; only the owner may approve an exception. Experimental scores never replace it.'}
    own_tmp = published = False
    try:   # 5) a NEW temp file (never an existing one), then published without replacing anything: a half-written or overwritten OUT_JSON never exists
        with open(tmp_out, 'x') as fh:
            own_tmp = True
            json.dump(R, fh, indent=1, ensure_ascii=False, default=str)
        os.link(tmp_out, OUT); published = True   # fails if OUT_JSON exists (or the file system has no hard links)
    except Exception as e: print('ERROR writing OUT_JSON - nothing was replaced: ' + repr(e)); pre = False
    if own_tmp:   # a temp file this run did not create is never removed (the OUTPUT line reports it)
        try: os.unlink(tmp_out)   # only this run's own new temp file
        except Exception as e: print('ERROR removing this run\'s own temp file %s: %r' % (tmp_out, e))
    print('DESIGN PREFLIGHT %s · round %s · spec %s · route expected %s' % (VERSION, rnd, RD['spec'], RD['route']))
    print('RUN_ID %s (OUT_JSON is the result of this run only if its run_id is the same)' % run_id)
    print('REFERENCES %s' % ('OK' if refs_ok else json.dumps(refs)))
    print('QA 1.2a: exit %s · %d/%d PASS%s' % (qa_info.get('exit_code'), qa_pass, qa_n, '' if p0 else '  -> not accepted (needs exit 0, the 24 gates, 24/24, no error, nothing skipped)'))
    for i in items: print('%-4s %-4s %s :: %s' % (i['result'], i['id'], i['text'], json.dumps(i['value'], ensure_ascii=False, default=str)[:220]))
    print('%-4s ROUTE %s :: %s' % (R['route']['result'], route_msg, json.dumps(R['route']['signature'])))
    print('%-4s SHEET-A %s (QA 10\' name, fix1 -> new) :: %s' % (R['sheet_A']['result'], SHEET_A, json.dumps(sa[1], default=str)[:200]))
    print('%-4s SHEET-B %s (%s -> new) :: %s' % (R['sheet_B']['result'], RD['sheet_B'], RD['sheet_B_label'], json.dumps(sb[1], default=str)[:200]))
    for i in round_items: print('%-4s %-4s %s :: %s' % (i['result'], i['id'], i['text'], json.dumps(i['value'], ensure_ascii=False, default=str)[:220]))
    print('%-4s GUARDS QA result bound to the delivery %s · inputs unchanged during the run %s' % ('PASS' if bound and same_inputs else 'FAIL', bound, same_inputs))
    if rep.get('L_by_row'):
        print('D3c rows (copper L* left/right, status): ' + ' · '.join('y%d %s/%s %s' % (y, v['copper_left_L'], v['copper_right_L'], v['status']) for y, v in rep['L_by_row'].items()))
    for i, t in RD['manual']: print('MANUAL %s %s' % (i, t))
    print('MARGINS ' + json.dumps(marg, ensure_ascii=False, default=str)); print('ERRORS ' + json.dumps(errors, default=str) if errors else 'ERRORS none')
    # 6) the real state of the three output files on disk (OUT_JSON written only if published; a temp file still present is reported, not removed)
    print('OUTPUT OUT_JSON %s · OUT_JSON.tmp %s · OUT_JSON.qa12a.json %s' % ('written: ' + OUT if published else 'NOT written', 'still present: ' + tmp_out if os.path.lexists(tmp_out) else 'none',
                                                                            'present' if os.path.lexists(qa_out) else 'none'))
    print('PREFLIGHT: %s' % ('PASS (machine checks only - MANUAL items are judged in the Artistic Review)' if pre else 'FAIL  -> report to the owner; an exception needs the owner\'s approval'))
    return 0 if pre else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
