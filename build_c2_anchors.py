#!/usr/bin/env python3
# Build c2-pilot-anchors.json from the locked G2.2a files (Claude tooling · data only · no image is changed).
# usage: python3 -I build_c2_anchors.py WALK.png WALKMASK.png IDLE.png IDLEMASK.png OUT.json
# rules (DESIGN_CHAR2_RENDER_CONTRACT.md section 4): feet fixed [48,94] · head_top = [centre x of the head box, top row]
# head box = mask ID 1-5 or 10 in rows <= 50 · face = centre of the eye box (ID 2/5, rows <= 50) · back = [mean x of cape (ID 8) on row y, y, z]
# with y = first row >= 40 holding >= 3 cape px, plus 6 · z = -1 (behind the body) for S SE E W SW, +1 (in front) for NE N NW · hands = G2.2b
import sys, json, numpy as np
from PIL import Image
L8 = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']; C = 96; BACKZ = {'NE': 1, 'N': 1, 'NW': 1}
CUT = 62; W_DY = [0, 0, -1, 0]   # W idle code breathing B (owner 16 Oct): rows 0..61 up 1 px in f3, row 62 repeated
def load(p): return np.array(Image.open(p).convert('RGBA'))
def breathe(a, dy):
    if dy == 0: return a
    o = a.copy(); o[0:CUT] = a[1:CUT + 1]; return o
def anchors(spr, msk):
    ID = msk[..., 0].astype(int); op = spr[..., 3] > 0
    head = np.isin(ID, [1, 2, 3, 4, 5, 10]) & op; head[51:] = False
    ys, xs = np.nonzero(head); ht = [int(np.floor((xs.min() + xs.max()) / 2 + 0.5)), int(ys.min())]
    eye = np.isin(ID, [2, 5]); eye[51:] = False; ey, ex = np.nonzero(eye)
    face = [int(np.floor((ex.min() + ex.max()) / 2 + 0.5)), int(np.floor((ey.min() + ey.max()) / 2 + 0.5))] if len(ex) else None
    cape = ID == 8; rows = [y for y in range(40, C) if cape[y].sum() >= 3]
    by = rows[0] + 6 if rows else None
    bx = int(np.floor(np.nonzero(cape[by])[0].mean() + 0.5)) if by is not None and cape[by].any() else None
    return {'feet': [48, 94], 'head_top': ht, 'face': face, 'back_xy': [bx, by] if bx is not None else None, 'top': int(np.nonzero(op.any(1))[0][0]), 'bottom': int(np.nonzero(op.any(1))[0][-1])}
def main(wp, wmp, ip, imp, out):
    W, WM, I, IM = load(wp), load(wmp), load(ip), load(imp)
    res = {}
    for anim, S_, M_, nf in (('walk', W, WM, 6), ('idle', I, IM, 4)):
        res[anim] = {}
        for i, D in enumerate(L8):
            fr = []
            for k in range(nf):
                s = S_[i * C:(i + 1) * C, k * C:(k + 1) * C]; m = M_[i * C:(i + 1) * C, k * C:(k + 1) * C]
                if anim == 'idle' and D == 'W': s = breathe(s, W_DY[k]); m = breathe(m, W_DY[k])
                a = anchors(s, m); a['back'] = a['back_xy'] + [BACKZ.get(D, -1)] if a['back_xy'] else None; del a['back_xy']
                a['hand_r'] = None; a['hand_l'] = None; fr.append(a)
            res[anim][D] = fr
    # turn stability + renderOffset proposal (G2_2 plan section 5): round-half-up(48 - idle f1 body centre), clamp +-3
    body = []
    for i in range(8):
        c = I[i * C:(i + 1) * C, 0:C]; y, x = np.nonzero(c[52:87, :, 3] > 0); body.append(float(x.mean()))
    ro = {D: max(-3, min(3, int(np.floor(48 - b + 0.5)))) for D, b in zip(L8, body)}
    pairs = [(L8[j], L8[(j + 1) % 8]) for j in range(8)]
    J = {'schema': 1, 'set': 'c2', 'base': 'kid4', 'cell': [96, 96], 'feet': [48, 94], 'dirs': L8,
         'files': {'walk': ['c2-pilot-kid4-walk.png', 'c2-pilot-kid4-walk-mask.png'], 'idle': ['c2-pilot-kid4-idleanim.png', 'c2-pilot-kid4-idleanim-mask.png']},
         'locked': {'walk': 'codex/asset-12-c2-motion b5d2830', 'idle': 'Codex local 5246d7c via ZIP · sha256 in qa/asset12-CA/delivery-5246d7c/SHA256SUMS'},
         'anims': {'walk': {'frames': 6, 'ms': 100, 'loop': [1, 2, 3, 4, 5, 6], 'start': 1},
                   'idle': {'frames': 4, 'ms': 200, 'loop': [1, 2, 3, 2], 'entry_after_walk': 3,
                            'blink': {'frame': 4, 'dirs': ['S', 'SE', 'E', 'W', 'SW'], 'every_s': [3, 6], 'slot': 'the f2 after f3 (loop index 4)'},
                            'code_breathing': {'W': {'cut_row': CUT, 'dy': W_DY, 'rule': 'after recolour: rows 0..cut-1 take rows 1..cut (up 1 px), row cut repeats; anchors below already include it'}}}},
         'renderOffset': {'status': 'APPROVED FOR PILOT TEST ONLY (owner 16 Oct 2569 ~12:4x) - not for game 2.33 or Production; results in DESIGN_CHAR2_RENDER_CONTRACT.md 6.1', 'formula': 'round-half-up(48 - idle f1 body centre rows 52-86), clamp +-3, same for every frame of every anim of that direction, x only, at draw time',
                          'dx': ro, 'idle_f1_body_centre': {D: round(b, 2) for D, b in zip(L8, body)},
                          'turn_jump_before': {a + '>' + b: round(abs(body[L8.index(a)] - body[L8.index(b)]), 2) for a, b in pairs},
                          'turn_jump_after': {a + '>' + b: round(abs(body[L8.index(a)] + ro[a] - body[L8.index(b)] - ro[b]), 2) for a, b in pairs}},
         'anchor_rules': {'feet': 'fixed [48,94], the ground point, not the foot pixels', 'head_top': '[centre x of the head box (mask ID 1-5,10, rows <= 50), top row]', 'face': 'centre of the eye box (ID 2/5) - checks only, null on back views',
                          'back': '[mean x of cape ID 8 on row y, y = first row >= 40 with >= 3 cape px + 6, z] z -1 behind body (S SE E W SW), +1 in front (NE N NW) - wings later', 'hand_r/hand_l': 'null until G2.2b (idle_hold / walk_hold)',
                          'coords': 'cell pixels before renderOffset; the renderer adds renderOffset dx to sprite and anchors alike'},
         'frames': res}
    json.dump(J, open(out, 'w'), indent=1)
    print('renderOffset', ro); print('turn after', J['renderOffset']['turn_jump_after'])
if __name__ == '__main__':
    main(*sys.argv[1:6])
