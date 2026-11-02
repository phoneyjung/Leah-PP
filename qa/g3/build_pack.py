#!/usr/bin/env python3
"""G3.2 (Claude · 2 Nov 2569): build c2-pack.json from the LOCKED files only (no value typed by hand when a locked file has it).

- sizes + SHA-256 of every file the pack points at (read from disk)
- renderOffset = c2-pilot-anchors.json renderOffset.dx (B2 · Pilot)
- lantern grip = c2-held-lantern_L0-S-trial.json grip (cell 32)
- palettes / recolour ids / material id range = qa_asset09_a3.py RAMPS RECOL IDS (read with ast, not imported) in save-file order
- light centre [16,15] = the +16 / +15 of the Pilot Glow line · typed from documents (not from a locked file): bases + defaults
  (DESIGN_CHAR2_SAVE_MIGRATION.md section 2), budget (G3_0_RENDERER_PLAN.md section 4), blink_frame 3 (idle f4 = blink)
- frame counts = PNG width / cell · W breathing = c2-pilot-anchors.json code_breathing, asserted equal to the Pilot breatheW line ·
  hidden lantern dirs = the Pilot O13 line (T22 R6)
- timing / ease / blink / N hole = the constants of pilot-g2-motion.html (read with regex, so a changed Pilot shows up)

usage: python3 -I qa/g3/build_pack.py REPO_ROOT [--check]
  --check: build in memory and compare with the c2-pack.json on disk (exit 1 if different)
"""
import ast, hashlib, json, re, struct, sys
from pathlib import Path

ROOT = Path(sys.argv[1]); CHECK = '--check' in sys.argv

def sha(p): return hashlib.sha256((ROOT / p).read_bytes()).hexdigest()
def png_size(p):
    b = (ROOT / p).read_bytes()
    assert b[:8] == b'\x89PNG\r\n\x1a\n', p
    return list(struct.unpack('>II', b[16:24]))
def ref_const(name):   # a literal constant of qa_asset09_a3.py, read with ast (the file is not imported)
    src = (ROOT / 'qa_asset09_a3.py').read_text(encoding='utf-8')
    for node in ast.parse(src).body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if getattr(t, 'id', None) == name: return ast.literal_eval(node.value)
                if isinstance(t, ast.Tuple) and name in [getattr(e, 'id', None) for e in t.elts]:
                    return ast.literal_eval(node.value.elts[[getattr(e, 'id', None) for e in t.elts].index(name)])
    raise SystemExit(name + ' not found')
def ramps(): return ref_const('RAMPS')
def pilot_const(name, text):
    m = re.search(r'\b' + name + r'\s*=\s*(\[[^\]]*\]|[^,;\[]+?)(?=[,;])', text)
    if not m: raise SystemExit('Pilot constant missing: ' + name)
    return json.loads(m.group(1).replace("'", '"'))

motion = (ROOT / 'pilot-g2-motion.html').read_text(encoding='utf-8')
anchors = json.loads((ROOT / 'c2-pilot-anchors.json').read_text(encoding='utf-8'))
lantern = json.loads((ROOT / 'c2-held-lantern_L0-S-trial.json').read_text(encoding='utf-8'))
nhole = re.search(r'const NHOLE=\{cx:(\d+),cy:(\d+)', motion)
blink = re.search(r'ST\.blinkAt=(\d+)\+Math\.random\(\)\*(\d+)', motion)
lc = re.search(r'gx=LW\[0\]\+(\d+)-GLOW\.R,gy=LW\[1\]\+(\d+)-GLOW\.R', motion)   # light centre = lantern cell corner + [16,15]
gm_pow = re.search(r'const GM_POW=\{100:\{light:([\d.]+)[^}]*\},50:\{light:([\d.]+)[^}]*\},10:\{light:([\d.]+)[^}]*\},0:\{light:([\d.]+)', motion)
hid = re.findall(r"if\(d==='([A-Z]+)'&&H&&!lanXY", motion)                     # O13: facing these dirs the lantern is hidden
brp = re.search(r"const w=DIRS\.indexOf\('([A-Z]+)'\),cut=(\d+),k=(\d+)", motion)   # Pilot breatheW: dir, cut row, frame index
assert nhole and blink and gm_pow and lc and hid and brp, 'Pilot constants changed'
# W breathing: the locked anchors JSON and the Pilot code must say the same (T22 R6) - the pack takes the JSON value
cb = anchors['anims']['idle']['code_breathing']; assert len(cb) == 1, 'one breathing direction expected'
b_dir, b = next(iter(cb.items())); b_frame = b['dy'].index(-1)
assert (b_dir, b['cut_row'], b_frame) == (brp.group(1), int(brp.group(2)), int(brp.group(3))), 'breathing: anchors JSON != Pilot'
C = pilot_const('C', motion)
frames = lambda src: png_size(src)[0] // C   # frame count = sheet width / cell (height checked = 8 dirs in char2.js)

R = ramps()
pal = {g: [[n.lower(), [h.upper() for h in hexes]] for n, hexes in R[g]] for g in ('hair', 'iris', 'skin', 'house')}
DIRS = pilot_const('DIRS', motion)
sheet = lambda key, src, mask: {'src': src, 'mask': mask, 'size': png_size(src), 'frames': frames(src),
                                        'sha256': sha(src), 'mask_sha256': sha(mask)}
pack = {
    'schema': 'c2-pack/1', 'id': 'c2-pilot', 'version': 1, 'set': 'c2',
    'note': 'G3 Char2 pack (Claude). Points at locked files only; values copied from them by qa/g3/build_pack.py. Pilot whole-body sheets + colour masks, not the G5 layered art.',
    'cell': C, 'feet': pilot_const('FEET', motion), 'dirs': DIRS,
    'bases': {'kid4': {'gender': 'f', 'parts': {'hair': ['kid4'], 'eyes': ['kid4'], 'outfit': ['kid4'], 'head': [], 'face_acc': [], 'back': []},
                       'defaults': {'hair': 'brown', 'iris': 'green', 'skin': 'medium'}}},
    'deprecated': [],
    'sheets': {
        'idle': dict(sheet('idle', 'c2-pilot-kid4-idleanim.png', 'c2-pilot-kid4-idleanim-mask.png'),
                     breathe={'dir': b_dir, 'frame': b_frame, 'cut': b['cut_row']}),
        'walk': sheet('walk', 'c2-pilot-kid4-walk.png', 'c2-pilot-kid4-walk-mask.png'),
        'walkhold': sheet('walkhold', 'c2-pilot-kid4-walkhold.png', 'c2-pilot-kid4-walkhold-mask.png'),
    },
    'hold': {'src': 'c2-pilot-hold-anchors.json', 'sha256': sha('c2-pilot-hold-anchors.json')},
    'lantern': {'id': 'lantern_L0', 'src': 'c2-held-lantern_L0-S-trial.png', 'light': 'c2-held-lantern_L0-S-trial-light.png',
                'size': png_size('c2-held-lantern_L0-S-trial.png'), 'cell': pilot_const('LAN_CELL', motion), 'grip': lantern['grip'],
                'light_centre': [int(lc.group(1)), int(lc.group(2))], 'n_hole': [int(nhole.group(1)), int(nhole.group(2))], 'hidden_dirs': hid,
                'power_light': {'100': float(gm_pow.group(1)), '50': float(gm_pow.group(2)), '10': float(gm_pow.group(3)), '0': float(gm_pow.group(4))},
                'sha256': sha('c2-held-lantern_L0-S-trial.png'), 'light_sha256': sha('c2-held-lantern_L0-S-trial-light.png')},
    'portrait': {'src': 'c2-pilot-kid4-pt.png', 'mask': 'c2-pilot-kid4-pt-mask.png', 'mask_meta': 'c2-pilot-kid4-pt-mask.json',
                 'shademap': 'c2-pilot-kid4-pt-shademap.json', 'size': png_size('c2-pilot-kid4-pt.png'),
                 'sha256': sha('c2-pilot-kid4-pt.png'), 'mask_sha256': sha('c2-pilot-kid4-pt-mask.png'),
                 'mask_meta_sha256': sha('c2-pilot-kid4-pt-mask.json'), 'shademap_sha256': sha('c2-pilot-kid4-pt-shademap.json')},
    'render_offset': {d: anchors['renderOffset']['dx'][d] for d in DIRS},
    'timing': {'walk_ms': pilot_const('WALK_MS', motion), 'idle_ms': pilot_const('IDLE_MS', motion), 'idle_loop': pilot_const('IDLE_LOOP', motion),
               'blink_dirs': pilot_const('BLINK_DIRS', motion), 'blink_min_ms': int(blink.group(1)), 'blink_span_ms': int(blink.group(2)), 'blink_frame': 3},
    'ease': {'max_px': pilot_const('EASE_MAX', motion), 'window_ms': pilot_const('EASE_WIN', motion)},
    'materials': {'recolour': {str(k): v for k, v in sorted(ref_const('RECOL').items())}, 'ids': [min(i for i in ref_const('IDS') if i), max(ref_const('IDS'))]},
    'palette': pal,
    'budget': {'bytes': 40 * 1048576, 'borrow_max': 4718592, 'fixed_other_max': 262144},
}
text = json.dumps(pack, ensure_ascii=False, separators=(',', ':')) + '\n'
out = ROOT / 'c2-pack.json'
if CHECK:
    same = out.exists() and out.read_text(encoding='utf-8') == text
    print('c2-pack.json', 'matches' if same else 'DIFFERS from', 'the locked files ·', len(text.encode()), 'bytes')
    sys.exit(0 if same else 1)
out.write_text(text, encoding='utf-8')
print('wrote c2-pack.json', len(text.encode()), 'bytes')
