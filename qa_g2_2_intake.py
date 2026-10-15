#!/usr/bin/env python3
# G2.2a intake check for the PixelLab motion ZIP (Breathing Idle + Walking 6 frames, 8 directions) · Claude · plan G2_2_MOTION_PLAN.md v1.1 steps 4/6.
# Reads the owner's ZIP as untrusted data (safe extract), places every frame into a 96x96 cell WITHOUT scaling or editing pixels,
# measures the raw (pre-cleanup) frames against QG-2a section 5, and writes review sheets + GIFs at game timing (idle 200 ms, walk 100 ms).
# Items that need Codex cleanup first (strap, holes, plum outline, mask, colour leak) are reported, not judged, here.
#
# usage: python3 -I qa_g2_2_intake.py check ZIP SRC_JSON OUT_DIR [ROTATIONS_ZIP]   (ROTATIONS_ZIP when the ZIP holds only GIFs)
#        python3 -I qa_g2_2_intake.py selftest SRC_ZIP SRC_JSON OUT_DIR      (SRC_ZIP = the 14 Oct `_4` PixelLab ZIP with Idle/rotations)
import sys, os, re, io, json, zipfile, hashlib
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageSequence

L8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
DIRNAME = {'south': 'S', 'south-east': 'SE', 'east': 'E', 'north-east': 'NE', 'north': 'N', 'north-west': 'NW', 'west': 'W', 'south-west': 'SW'}
PAIRS = [('S', 'SE'), ('SE', 'E'), ('E', 'NE'), ('NE', 'N'), ('N', 'NW'), ('NW', 'W'), ('W', 'SW'), ('SW', 'S')]
EXPECT = {'idle': 4, 'walk': 6}                     # Character Spec v2 section 3 (idle = 3 breathe + 1 blink)
MS = {'idle': 200, 'walk': 100}                     # game timing, not the GIF timing PixelLab exports
FEET = (48, 94); CELL = 96
LIGHT = (232, 230, 240); DARK = (30, 27, 46); GRASS = (140, 176, 112); GUIDE = (255, 64, 160)
PHONE = (844, 390); DPR = 2.625
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
MAX_FILE = 8 * 1024 * 1024; MAX_FILES = 2000

def sha(b): return hashlib.sha256(b).hexdigest()
def rhu(v): return int(np.floor(v + 0.5))           # round half up (plan 5: renderOffset)

# ---------------------------------------------------------------- reading
def safe_read(zpath):
    """return {name: bytes} for .png/.gif/.json members only; refuses absolute paths, '..', huge or too many files"""
    out = {}; bad = []
    with zipfile.ZipFile(zpath) as z:
        infos = z.infolist()
        if len(infos) > MAX_FILES: raise SystemExit('ZIP has %d members (limit %d)' % (len(infos), MAX_FILES))
        for i in infos:
            n = i.filename.replace('\\', '/')
            if i.is_dir(): continue
            if n.startswith('/') or '..' in n.split('/') or ':' in n: bad.append(n); continue
            if not n.lower().endswith(('.png', '.gif', '.json')): continue
            if i.file_size > MAX_FILE: bad.append(n + ' (too big)'); continue
            out[n] = z.read(i)
    return out, bad

def rgba(b):
    im = Image.open(io.BytesIO(b)); return np.array(im.convert('RGBA'), dtype=np.uint8)

def gif_frames(b):
    im = Image.open(io.BytesIO(b)); fr = []; ms = []
    for f in ImageSequence.Iterator(im):
        fr.append(np.array(f.convert('RGBA'), dtype=np.uint8)); ms.append(f.info.get('duration'))
    return fr, ms

def canon_dir(k):
    m = re.match(r'^(south-east|south-west|north-east|north-west|south|north|east|west)(?:-([0-9a-f]{6,}))?$', k.lower())
    return (DIRNAME[m.group(1)], m.group(2)) if m else (None, None)

def kind_of(name):
    n = name.lower()
    if 'walk' in n: return 'walk'
    if 'idle' in n or 'breath' in n: return 'idle'
    return 'other'

def parse(files):
    """-> rotations {D: array}, anims {kind: {D: [variants: {key, frames, names}]}}, notes"""
    notes = []; rot = {}; anims = {}
    metas = [n for n in files if n.endswith('metadata.json')]
    if metas:
        base = metas[0].rsplit('metadata.json', 1)[0]
        M = json.loads(files[metas[0]].decode('utf-8'))
        if len(metas) > 1: notes.append('more than one metadata.json; used ' + metas[0])
        for st in M.get('states', []):
            fr = st.get('frames', {})
            for k, p in fr.get('rotations', {}).items():
                D, _ = canon_dir(k)
                if D and base + p in files: rot[D] = rgba(files[base + p])
            for an, dirs in fr.get('animations', {}).items():
                kd = kind_of(an)
                for order, (k, paths) in enumerate(dirs.items()):
                    D, h = canon_dir(k)
                    if not D: notes.append('unknown direction key %r in %r' % (k, an)); continue
                    miss = [p for p in paths if base + p not in files]
                    if miss: notes.append('%s/%s: %d listed frames missing from ZIP' % (an, k, len(miss)))
                    frames = [rgba(files[base + p]) for p in paths if base + p in files]
                    anims.setdefault(kd, {}).setdefault(D, []).append({'anim': an, 'key': k, 'order': order, 'frames': frames, 'gif_ms': None})
        notes.append('read via metadata.json (export_version %s)' % M.get('export_version'))
    else:   # fallback: folders <anim>/<dir>/frame_NNN.png or GIF files named by direction
        for n in sorted(files):
            parts = n.split('/')
            if n.lower().endswith('.png') and len(parts) >= 3 and re.match(r'frame_\d+\.png$', parts[-1]):
                D, h = canon_dir(parts[-2]); an = parts[-3]
                if D:
                    lst = anims.setdefault(kind_of(an), {}).setdefault(D, [])
                    v = next((x for x in lst if x['key'] == parts[-2] and x['anim'] == an), None)
                    if not v: v = {'anim': an, 'key': parts[-2], 'order': len(lst), 'frames': [], 'gif_ms': None}; lst.append(v)
                    v['frames'].append(rgba(files[n]))
            elif n.lower().endswith('.png') and len(parts) >= 2 and parts[-2] == 'rotations':
                D, _ = canon_dir(parts[-1][:-4])
                if D: rot[D] = rgba(files[n])
            elif n.lower().endswith('.gif'):
                stem = parts[-1][:-4].lower(); D = None
                for k in sorted(DIRNAME, key=len, reverse=True):
                    if re.search(r'(^|[^a-z])' + k + r'($|[^a-z])', stem): D = DIRNAME[k]; break
                an = parts[-2] if len(parts) >= 2 else stem
                if D:
                    fr, ms = gif_frames(files[n])
                    anims.setdefault(kind_of(an + ' ' + stem), {}).setdefault(D, []).append({'anim': an, 'key': stem, 'order': 0, 'frames': fr, 'gif_ms': ms})
        notes.append('no metadata.json: read by folder / GIF names')
    return rot, anims, notes

# ---------------------------------------------------------------- geometry
def register(rot, fr):
    """best integer offset (ox, oy) of the 88 rotation inside an animation frame; returns (ox, oy, mismatch_px, union_px)"""
    H, W = fr.shape[:2]; h, w = rot.shape[:2]; ro = rot[..., 3] > 0; best = None
    ry, rx = np.nonzero(ro); fy, fx = np.nonzero(fr[..., 3] > 0)
    if not len(fy): return (0, 0, int(ro.sum()), int(ro.sum()))
    # candidates: bbox edges / centres aligned, +-4 px (full search only if nothing fits well)
    cx = {int(fx.min() - rx.min()), int(fx.max() - rx.max()), int(round((fx.min() + fx.max() - rx.min() - rx.max()) / 2))}
    cy = {int(fy.min() - ry.min()), int(fy.max() - ry.max())}
    def score(ox, oy):
        sub = fr[oy:oy + h, ox:ox + w]; so = sub[..., 3] > 0; u = ro | so
        return int((u & ((ro != so) | (np.abs(sub[..., :3].astype(int) - rot[..., :3]).sum(-1) > 0))).sum()), int(u.sum())
    def search(cands):
        nonlocal best
        for ox, oy in cands:
            if 0 <= ox <= W - w and 0 <= oy <= H - h:
                mis, uni = score(ox, oy)
                if best is None or mis < best[2]: best = (ox, oy, mis, uni)
    search({(x + d, y + e) for x in cx for y in cy for d in range(-4, 5) for e in range(-4, 5)})
    if best is None or best[2] > 0.25 * best[3]: search((x, y) for y in range(0, H - h + 1) for x in range(0, W - w + 1))
    return best

def place(fr, wx, wy):
    """copy the 96x96 window starting at (wx, wy) of the frame; returns cell, opaque pixels lost outside the window"""
    H, W = fr.shape[:2]; c = np.zeros((CELL, CELL, 4), np.uint8)
    x0, y0 = max(0, wx), max(0, wy); x1, y1 = min(W, wx + CELL), min(H, wy + CELL)
    if x1 > x0 and y1 > y0: c[y0 - wy:y1 - wy, x0 - wx:x1 - wx] = fr[y0:y1, x0:x1]
    lost = int((fr[..., 3] > 0).sum() - (c[..., 3] > 0).sum())
    return c, lost

def holes(c):
    t = c[..., 3] == 0; seen = np.zeros_like(t); out = []
    for y0, x0 in zip(*np.nonzero(t)):
        if seen[y0, x0]: continue
        dq = deque([(y0, x0)]); seen[y0, x0] = True; n = 0; edge = False
        while dq:
            y, x = dq.popleft(); n += 1; edge |= x in (0, CELL - 1) or y in (0, CELL - 1)
            for dx, dy in N4:
                yy, xx = y + dy, x + dx
                if 0 <= yy < CELL and 0 <= xx < CELL and t[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; dq.append((yy, xx))
        if not edge: out.append(n)
    return out

def fmetrics(c, ref=None):
    op = c[..., 3] > 0; ys, xs = np.nonzero(op)
    if not len(ys): return {'empty': True}
    body = [(x) for x, y in zip(xs, ys) if 52 <= y <= 86]; head = xs[ys <= 50]; low = xs[(ys >= 92) & (ys <= 94)]
    hs = holes(c)
    m = {'bottom_row': int(ys.max()), 'top_row': int(ys.min()), 'height': int(ys.max() - ys.min() + 1),
         'body_centre_x': round(float(np.mean(body)), 2) if body else None,
         'head_centre_x': round((int(head.min()) + int(head.max())) / 2, 1) if len(head) else None,
         'contact_x': [int(low.min()), int(low.max())] if len(low) else None,
         'below_94_px': int(op[95:].sum()), 'semi_alpha': int(((c[..., 3] > 0) & (c[..., 3] < 255)).sum()),
         'holes_any': len(hs), 'holes_1_3px': sum(1 for n in hs if n <= 3), 'opaque_px': int(op.sum())}
    if ref is not None:
        d = (c != ref).any(-1); m['changed_vs_frame0'] = int(d.sum()); m['face_changed_vs_frame0'] = int(d[26:46].sum())
    return m

def mirrored(a, b):
    """True if frame list b is an exact horizontal mirror of a (any placement)"""
    if len(a) != len(b): return False
    for fa, fb in zip(a, b):
        ma = fa[:, ::-1]; ya, xa = np.nonzero(ma[..., 3] > 0); yb, xb = np.nonzero(fb[..., 3] > 0)
        if len(ya) != len(yb) or not len(ya): return False
        ca = ma[ya.min():ya.max() + 1, xa.min():xa.max() + 1]; cb = fb[yb.min():yb.max() + 1, xb.min():xb.max() + 1]
        if ca.shape != cb.shape or not (ca == cb).all(): return False
    return True

# ---------------------------------------------------------------- pictures
def up(a, s): a = np.ascontiguousarray(a); return Image.fromarray(a, 'RGBA').resize((max(1, int(round(a.shape[1] * s))), max(1, int(round(a.shape[0] * s)))), Image.NEAREST)
def txt(d, xy, t, bg): d.text(xy, t, fill=(235, 235, 245) if sum(bg) < 300 else (20, 20, 30))

def cellbg(bg, s, guides=True):
    im = Image.new('RGBA', (CELL * s, CELL * s), bg + (255,))
    if guides:
        d = ImageDraw.Draw(im); c = GUIDE + (110,)
        d.line((0, FEET[1] * s + s - 1, CELL * s, FEET[1] * s + s - 1), fill=c); d.line((FEET[0] * s, 0, FEET[0] * s, CELL * s), fill=c)
    return im

def sheet(rows, s, bg, rlab, clab, head):
    lw, pad, ch = 70, 6, 34; cw = CELL * s + pad
    W = lw + max(len(r) for r in rows) * cw + pad; H = ch + len(rows) * (CELL * s + pad) + pad
    im = Image.new('RGBA', (W, H), bg + (255,)); d = ImageDraw.Draw(im); txt(d, (6, 4), head, bg)
    for i, t in enumerate(clab): txt(d, (lw + i * cw, 20), t, bg)
    for r, row in enumerate(rows):
        y = ch + r * (CELL * s + pad); txt(d, (6, y + 4), rlab[r], bg)
        for i, a in enumerate(row):
            if a is None: continue
            t = cellbg(bg, s); t.alpha_composite(up(a, s)); im.alpha_composite(t, (lw + i * cw, y))
    return im

def gif_strip(cells_by_dir, s, bg, ms, path, label):
    n = max(len(v) for v in cells_by_dir.values()); W = 8 * (CELL * s + 4) + 4; H = CELL * s + 22; fr = []
    for k in range(n):
        im = Image.new('RGBA', (W, H), bg + (255,)); d = ImageDraw.Draw(im); txt(d, (4, 4), '%s  frame %d/%d  %d ms' % (label, k + 1, n, ms), bg)
        for i, D in enumerate(L8):
            v = cells_by_dir.get(D)
            if not v: continue
            t = cellbg(bg, s); t.alpha_composite(up(v[k % len(v)], s)); im.alpha_composite(t, (4 + i * (CELL * s + 4), 18))
            txt(d, (8 + i * (CELL * s + 4), 20), D, bg)
        fr.append(im.convert('RGB').quantize(colors=255, method=Image.MEDIANCUT))
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=1, optimize=False)

def gif_phone(cells_by_dir, zoom, ms, path, label):
    """strip of an 844x390 @DPR 2.625 phone at device pixels; game scale SC = round(dh/384) * zoom; ground line where feet row 94 lands"""
    dw, dh = round(PHONE[0] * DPR), round(PHONE[1] * DPR); sc = max(1, round(dh / 384)) * zoom
    ch = int(CELL * sc) + 40; n = max(len(v) for v in cells_by_dir.values()); fr = []
    for k in range(n):
        im = Image.new('RGBA', (dw, ch), GRASS + (255,)); d = ImageDraw.Draw(im)
        d.text((8, 4), '%s · phone %dx%d @DPR %.3g · %.2f device px per art px (zoom %d%%) · %d ms' % (label, PHONE[0], PHONE[1], DPR, sc, round(zoom * 100), ms), fill=(20, 20, 30))
        step = dw / 8.4
        for i, D in enumerate(L8):
            v = cells_by_dir.get(D)
            if not v: continue
            a = up(v[k % len(v)], sc); x = int(step * (i + 0.7) - a.width / 2); im.alpha_composite(a, (max(0, x), 30))
        fr.append(im.convert('RGB').quantize(colors=255, method=Image.MEDIANCUT))
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=1)
    return sc

# ---------------------------------------------------------------- main check
def check(zpath, src_json, od, rot_zip=None):
    os.makedirs(od, exist_ok=True); S = json.load(open(src_json, encoding='utf-8')); pad = S['pad']
    files, bad = safe_read(zpath); rot, anims, notes = parse(files)
    if len(rot) < 8 and rot_zip:   # GIF-only download: take the 88 rotations from the locked 14 Oct `_4` ZIP
        rf, _ = safe_read(rot_zip); r2, _, _ = parse(rf); notes.append('rotations taken from %s (%d/8)' % (os.path.basename(rot_zip), len(r2))); rot = {**r2, **rot}; files = {**rf, **files}
    R = {'zip': os.path.basename(zpath), 'zip_sha256': sha(open(zpath, 'rb').read()), 'refused_members': bad, 'notes': notes}
    # same character as the locked `_4` source?
    inv = {v: k for k, v in DIRNAME.items()}
    R['rotations_88'] = '%d/8' % sum(1 for D in L8 if D in rot and rot[D].shape[:2] == (88, 88))
    # rotation PNGs identical to the locked 14 Oct `_4` files? (src.json source_sha256 = sha256 of those PNG files)
    R['rotations_sha256_png_match'] = '%d/8' % sum(1 for D in L8 if D in rot and S.get('source_sha256', {}).get(inv[D]) in
                                                  {sha(files[n]) for n in files if n.endswith('rotations/%s.png' % inv[D])})
    R['found'] = {k: {D: [{'key': v['key'], 'frames': len(v['frames']), 'canvas': list(v['frames'][0].shape[1::-1]) if v['frames'] else None} for v in vs] for D, vs in sorted(dd.items(), key=lambda t: L8.index(t[0]))} for k, dd in anims.items()}
    dup = {k: [D for D, vs in dd.items() if len(vs) > 1] for k, dd in anims.items()}
    R['duplicate_directions'] = {k: v for k, v in dup.items() if v}
    chosen = {k: {D: vs[-1] for D, vs in dd.items()} for k, dd in anims.items()}   # last listed = latest generation (flag for owner)
    # registration: anchor = idle frame 0 matched to the 88 rotation, placed like the locked static (dx, dy from src.json)
    win = {}; reg = {}
    for D in L8:
        if D not in rot: continue
        for k in ('idle', 'walk'):
            v = chosen.get(k, {}).get(D)
            if v and v['frames']:
                ox, oy, mis, uni = register(rot[D], v['frames'][0]); reg.setdefault(D, {})[k] = {'offset': [ox, oy], 'mismatch_px': mis, 'union_px': uni}
        a = reg.get(D, {}).get('idle') or reg.get(D, {}).get('walk')
        if a: p = pad[inv[D]]; win[D] = (a['offset'][0] - p['dx'], a['offset'][1] - p['dy'])
    R['registration'] = reg; R['window_xy'] = {D: list(v) for D, v in win.items()}
    def place_all():
        cells = {}; M = {}; lost_total = 0
        for k, dd in chosen.items():
            for D, v in dd.items():
                if D not in win: continue
                cs = []; ms = []
                for i, f in enumerate(v['frames']):
                    c, lost = place(f, *win[D]); lost_total += lost; cs.append(c)
                    m = fmetrics(c, cs[0] if i else None); m['lost_px'] = lost; ms.append(m)
                cells.setdefault(k, {})[D] = cs; M.setdefault(k, {})[D] = ms
        return cells, M, lost_total
    cells, M, lost_total = place_all()
    # D-IDLE mode (owner 15 Oct 18:1x): idle comes from the locked A2 static, so the walk is anchored to it:
    # feet = lowest foot of the cycle on row 94 · cycle-mean body centre = the static body centre of that direction (no jump idle <-> walk)
    didle = 'idle' not in chosen
    static_bc = {}
    for D in L8:
        if D in rot: st, _ = place(rot[D], -pad[inv[D]]['dx'], -pad[inv[D]]['dy']); static_bc[D] = fmetrics(st)['body_centre_x']
    R['mode'] = 'D-IDLE: walk anchored to the locked static (feet row 94 + cycle-mean body centre)' if didle else 'idle frame 0 anchored to the static'
    if didle and 'walk' in M:
        adj = {}
        for D, ms in M['walk'].items():
            fb = max(int(np.nonzero(f[..., 3] > 0)[0].max()) for f in chosen['walk'][D]['frames']) - win[D][1]   # unclipped lowest foot row
            ddy = 94 - fb; mb = float(np.mean([m['body_centre_x'] for m in ms]))
            ddx = rhu(static_bc[D] - mb); win[D] = (win[D][0] - ddx, win[D][1] - ddy); adj[D] = {'ddx': ddx, 'ddy': ddy}
        cells, M, lost_total = place_all()
        for D, ms in M['walk'].items():
            adj[D]['static_body_x'] = static_bc[D]; adj[D]['walk_mean_body_x'] = round(float(np.mean([m['body_centre_x'] for m in ms])), 2)
            adj[D]['walk_f1_body_x'] = ms[0]['body_centre_x']
        R['walk_anchor'] = adj; R['window_xy'] = {D: list(v) for D, v in win.items()}
    R['frames'] = M
    # per animation and direction summary
    summ = {}
    for k, dd in M.items():
        for D, ms in dd.items():
            bc = [m['body_centre_x'] for m in ms if m.get('body_centre_x') is not None]; tr = [m['top_row'] for m in ms]; br = [m['bottom_row'] for m in ms]
            summ.setdefault(k, {})[D] = {'frames': len(ms), 'body_x_range': round(max(bc) - min(bc), 2) if bc else None, 'bounce_top_row': max(tr) - min(tr),
                                         'bottom_rows': sorted(set(br)), 'frames_on_94': sum(1 for b in br if b == 94), 'below_94_px': sum(m['below_94_px'] for m in ms),
                                         'semi_alpha': sum(m['semi_alpha'] for m in ms), 'holes_any': [m['holes_any'] for m in ms],
                                         'face_changed': [m.get('face_changed_vs_frame0', 0) for m in ms], 'identical_frames': sum(1 for m in ms[1:] if m.get('changed_vs_frame0') == 0)}
    R['summary'] = summ
    # turning stability (idle frame 0 body centre, 8 adjacent pairs) + renderOffset proposal (plan 5)
    bc0 = {D: M['idle'][D][0]['body_centre_x'] for D in L8 if D in M.get('idle', {})} if not didle else {D: static_bc[D] for D in L8 if D in static_bc}
    turn = {}
    if len(bc0) == 8:
        off = {D: max(-3, min(3, rhu(48 - bc0[D]))) for D in L8}
        for a, b in PAIRS: turn['%s>%s' % (a, b)] = {'raw': round(abs(bc0[a] - bc0[b]), 2), 'after_offset': round(abs((bc0[a] + off[a]) - (bc0[b] + off[b])), 2)}
        R['render_offset_proposal'] = off
    R['body_centre_idle_f0'] = bc0; R['turning'] = turn
    # mirrored directions (spec: mirror_ok = false for `_4`)
    mir = []
    for k, dd in cells.items():
        for a, b in (('E', 'W'), ('SE', 'SW'), ('NE', 'NW')):
            if a in dd and b in dd and mirrored(dd[a], dd[b]): mir.append('%s %s<->%s' % (k, a, b))
    R['mirrored_pairs'] = mir
    # raw-stage criteria (pre-cleanup); the rest of QG-2a waits for Codex cleanup + mask
    sk = lambda k: summ.get(k, {})
    crit = {
        'ZIP read safely (no refused members)': not bad,
        'idle: 8 directions': len(sk('idle')) == 8, 'walk: 8 directions': len(sk('walk')) == 8,
        'idle: %d frames every direction' % EXPECT['idle']: bool(sk('idle')) and all(v['frames'] == EXPECT['idle'] for v in sk('idle').values()),
        'walk: %d frames every direction' % EXPECT['walk']: bool(sk('walk')) and all(v['frames'] == EXPECT['walk'] for v in sk('walk').values()),
        'one canvas size for all frames': len({tuple(f['canvas']) for k in R['found'].values() for vs in k.values() for f in vs if f['canvas']}) == 1,
        'no duplicate direction folders (else owner picks)': not R['duplicate_directions'],
        'no mirrored direction pairs': not mir,
        'placement into 96x96 lossless (0 px lost)': lost_total == 0 and bool(M),
        'idle frame 0 matches the 88 rotation (<= 2% px differ)': bool(reg) and all(r['idle']['mismatch_px'] <= 0.02 * r['idle']['union_px'] for r in reg.values() if 'idle' in r),
        'walk uses the same anchor as idle (offset within 1 px)': all(abs(r['walk']['offset'][0] - r['idle']['offset'][0]) <= 1 and abs(r['walk']['offset'][1] - r['idle']['offset'][1]) <= 1 for r in reg.values() if 'walk' in r and 'idle' in r),
        'semi-transparent 0': all(v['semi_alpha'] == 0 for k in summ.values() for v in k.values()),
        'idle bottom row 94 all frames': bool(sk('idle')) and all(v['bottom_rows'] == [94] for v in sk('idle').values()),
        'walk bottom row 92-94, >= 2 frames on 94, 0 px below 94': bool(sk('walk')) and all(min(v['bottom_rows']) >= 92 and max(v['bottom_rows']) <= 94 and v['frames_on_94'] >= 2 and v['below_94_px'] == 0 for v in sk('walk').values()),
        'in-cycle body centre drift <= 2 px': all(v['body_x_range'] is not None and v['body_x_range'] <= 2 for k in summ.values() for v in k.values()),
        'in-cycle bounce <= 2 px': all(v['bounce_top_row'] <= 2 for k in summ.values() for v in k.values()),
        'turning 8 pairs <= 2 px (after renderOffset)': len(turn) == 8 and all(t['after_offset'] <= 2 for t in turn.values()),
    }
    if didle:   # idle is not from PixelLab: drop idle criteria, check the walk sits on the static idle instead
        for c in [c for c in crit if c.startswith('idle') or c.startswith('walk uses the same anchor')]: crit.pop(c)
        wa = R.get('walk_anchor', {})
        crit['walk cycle-mean body centre = static idle centre (<= 1 px)'] = len(wa) == 8 and all(abs(v['walk_mean_body_x'] - v['static_body_x']) <= 1 for v in wa.values())
        crit['walk frame 1 body centre within 2 px of static idle'] = len(wa) == 8 and all(abs(v['walk_f1_body_x'] - v['static_body_x']) <= 2 for v in wa.values())
    R['criteria_raw_stage'] = crit; R['PASS_raw_stage'] = all(crit.values())
    R['waits_for_cleanup'] = ['strap pixels 0', 'enclosed holes 0', 'plum outer outline (A2 rule) 100%', 'mask on every opaque pixel', '640-combo leak test', 'signal colours', 'blink frame visual check (idle frame 4)']
    # ---------- pictures ----------
    made = []
    def save(im, n): im.save(os.path.join(od, n), optimize=True); made.append(n)
    for k in ('idle', 'walk'):
        if k not in cells: continue
        n = max(len(v) for v in cells[k].values()); rows = [cells[k].get(D, [None] * n) for D in L8]
        cl = ['f%d' % (i + 1) for i in range(n)]
        for bg, nm in ((LIGHT, 'light'), (DARK, 'dark')):
            save(sheet(rows, 3, bg, L8, cl, 'G2.2a %s · raw PixelLab frames placed in 96x96 (no scaling) · pink lines = feet row 94 and x 48 · %s' % (k, nm)), 'g22-%s-frames-%s.png' % (k, nm))
        gif_strip(cells[k], 3, LIGHT, MS[k], os.path.join(od, 'g22-%s-8dir.gif' % k), 'G2.2a %s raw' % k); made.append('g22-%s-8dir.gif' % k)
        for z, zn in ((1.0, '100'), (0.75, '75')):
            sc = gif_phone(cells[k], z, MS[k], os.path.join(od, 'g22-%s-phone-zoom%s.gif' % (k, zn)), 'G2.2a %s raw' % k); made.append('g22-%s-phone-zoom%s.gif' % (k, zn))
    if rot and 'idle' in cells:   # idle frame 0 vs the locked static rotation (same placement)
        rows = []
        for D in L8:
            if D not in rot or D not in cells['idle']: continue
            p = pad[inv[D]]; st, _ = place(rot[D], -p['dx'], -p['dy'])
            f0 = cells['idle'][D][0]; diff = np.zeros_like(st); dm = (st != f0).any(-1); diff[dm] = (255, 40, 90, 255)
            rows.append([st, f0, diff])
        save(sheet(rows, 3, LIGHT, [D for D in L8 if D in rot and D in cells['idle']], ['static _4 (rotation)', 'idle frame 1', 'pixels that differ'], 'G2.2a idle frame 1 vs locked static source (same 96 placement)'), 'g22-idle-vs-static.png')
    R['images'] = made
    json.dump(R, open(os.path.join(od, 'g22-intake-report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return R

def printout(R):
    print('found:', json.dumps({k: {D: [(x['key'], x['frames'], x['canvas']) for x in vs] for D, vs in dd.items()} for k, dd in R['found'].items()}))
    print('duplicates:', R['duplicate_directions'], '· mirrored:', R['mirrored_pairs'], '· refused:', R['refused_members'])
    print('registration (offset of 88 rotation in frame 1, mismatch px):', {D: {k: (v['offset'], v['mismatch_px']) for k, v in r.items()} for D, r in R['registration'].items()})
    for k, dd in R['summary'].items():
        for D in L8:
            if D in dd: v = dd[D]; print(' %-4s %-2s frames %d · bottom %s · on94 %d · body drift %s · bounce %d · holes %s · face changed %s · identical %d' % (k, D, v['frames'], v['bottom_rows'], v['frames_on_94'], v['body_x_range'], v['bounce_top_row'], v['holes_any'], v['face_changed'], v['identical_frames']))
    print('body centre idle f1:', R['body_centre_idle_f0']); print('renderOffset proposal:', R.get('render_offset_proposal'))
    print('turning:', {p: (t['raw'], t['after_offset']) for p, t in R['turning'].items()})
    for c, v in R['criteria_raw_stage'].items(): print(('PASS ' if v else 'FAIL ') + c)
    print('RAW STAGE', 'PASS' if R['PASS_raw_stage'] else 'FAIL', '· waits for cleanup:', ', '.join(R['waits_for_cleanup']))

# ---------------------------------------------------------------- self test
def make_zip(path, rot, idle_n=4, walk_n=6, canvas=132, base=22, dup=None, mirror=False, semi=False, edge=False, drift=0):
    """synthetic PixelLab-like ZIP from the real 88 rotations: lossless shifts only"""
    M = {'states': [{'character': {'name': 'Idle', 'size': {'width': 88, 'height': 88}}, 'folder': 'Idle', 'frames': {'rotations': {}, 'animations': {}}}], 'export_version': '3.1'}
    fr = M['states'][0]['frames']; z = zipfile.ZipFile(path, 'w')
    def png(a): b = io.BytesIO(); Image.fromarray(a, 'RGBA').save(b, 'PNG'); return b.getvalue()
    inv = {v: k for k, v in DIRNAME.items()}
    for D in L8:
        p = 'Idle/rotations/%s.png' % inv[D]; z.writestr(p, png(rot[D])); fr['rotations'][inv[D]] = p
    for an, n, kind in (('Breathing Idle', idle_n, 'idle'), ('Walking (6 frames)', walk_n, 'walk')):
        A = fr['animations'].setdefault(an, {})
        keys = [(D, inv[D]) for D in L8] + ([(dup, inv[dup] + '-a1b2c3d4')] if dup and kind == 'walk' else [])
        for D, key in keys:
            paths = []
            for i in range(n):
                c = np.zeros((canvas, canvas, 4), np.uint8); bx = base; ey = 10 if edge and D == 'E' and kind == 'walk' and i == 2 else 0
                dy = (0 if kind == 'idle' else [0, -1, -2, -1, 0, -1][i % 6]); dx = (drift if kind == 'walk' and i == 3 else 0)
                src = rot[D] if not (mirror and D == 'W') else rot['E'][:, ::-1]
                c[base + dy + ey:base + dy + ey + 88, bx + dx:bx + dx + 88] = src
                if kind == 'idle' and i == 3:   # fake blink: darken 6 px in the eye rows
                    ys, xs = np.nonzero(c[base + 30:base + 34, base + 30:base + 58, 3] > 0)
                    for y, x in list(zip(ys, xs))[:6]: c[base + 30 + y, base + 30 + x, :3] = (40, 20, 50)
                if kind == 'walk' and i in (1, 4):   # fake step: lift one foot 1 px (rows 86-88 of the 88 image)
                    pass
                if semi and D == 'S' and i == 0: ys, xs = np.nonzero(c[..., 3] > 0); c[ys[0], xs[0], 3] = 128
                p = 'Idle/animations/%s/%s/frame_%03d.png' % (an, key, i); z.writestr(p, png(c)); paths.append(p)
            A[key] = paths
    z.writestr('metadata.json', json.dumps(M)); z.close()

def selftest(src_zip, src_json, od):
    os.makedirs(od, exist_ok=True); files, _ = safe_read(src_zip); rot, _, _ = parse(files)
    assert len(rot) == 8, 'source ZIP must hold Idle/rotations for 8 directions'
    res = {}
    def run(name, expect_fail, **kw):
        zp = os.path.join(od, name + '.zip'); make_zip(zp, rot, **kw); R = check(zp, src_json, os.path.join(od, name))
        bad = [c for c, v in R['criteria_raw_stage'].items() if not v]
        res[name] = {'failed': bad, 'ok': (set(expect_fail) <= set(bad)) and (expect_fail or not bad) if expect_fail is not None else True,
                     'window': R['window_xy'], 'offset_S': R['registration']['S']['idle']['offset'], 'bc0': R['body_centre_idle_f0']}
        return R
    good = run('good', [])
    exp_off = {D: [22 - 4, 22 - p['dy']] for D, p in ((DIRNAME[k], v) for k, v in json.load(open(src_json))['pad'].items())}
    res['good']['window_matches_expected'] = good['window_xy'] == {D: exp_off[D] for D in L8}
    res['good']['identical_frame_count_idle'] = {D: v['identical_frames'] for D, v in good['summary']['idle'].items()}
    run('frames5', ['idle: 4 frames every direction'], idle_n=5)
    run('dupSE', ['no duplicate direction folders (else owner picks)'], dup='SE')
    run('mirrorW', ['no mirrored direction pairs'], mirror=True)
    run('semi', ['semi-transparent 0'], semi=True)
    run('edgeloss', ['placement into 96x96 lossless (0 px lost)'], edge=True)
    run('drift3', ['in-cycle body centre drift <= 2 px'], drift=3)
    json.dump(res, open(os.path.join(od, 'selftest.json'), 'w'), indent=1)
    for k, v in res.items(): print(('OK   ' if v['ok'] else 'MISS ') + k, '· failed criteria:', v['failed'])
    print('good: window == expected placement:', res['good']['window_matches_expected'], '· S offset', res['good']['offset_S'])
    allok = all(v['ok'] for v in res.values()) and res['good']['window_matches_expected']
    print('SELFTEST', 'PASS' if allok else 'FAIL'); return 0 if allok else 1

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'check' and len(a) in (4, 5): R = check(*a[1:]); printout(R); sys.exit(0 if R['PASS_raw_stage'] else 1)
    if a and a[0] == 'selftest' and len(a) == 4: sys.exit(selftest(*a[1:]))
    print(__doc__ or 'usage: check ZIP SRC_JSON OUT | selftest SRC_ZIP SRC_JSON OUT'); sys.exit(2)
