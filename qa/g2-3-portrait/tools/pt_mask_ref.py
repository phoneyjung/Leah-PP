#!/usr/bin/env python3
# G2.3 (Claude · 1 Nov 2569) reference for ASSET_SPEC_14 v1.1: fills the 2 holes and builds the material mask with the written rules
# in qa/g2-3-portrait/pt-rules.json (sections 2-3 of the spec). The acceptance checker compares Codex's files with this result pixel by pixel.
# It is a second, independent implementation of the same written rules - Codex builds the asset files with its own tools.
# usage: python3 -I pt_mask_ref.py RULES.json SOURCE.png OUT_DIR      -> OUT_DIR/ref-pt.png ref-pt-mask.png ref-pt-mask.json
#        (import) build(rules, rgba_source) -> filled rgba, R (ids), G, info
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

def hx(c): return '#%02X%02X%02X' % (int(c[0]), int(c[1]), int(c[2]))
def lum(h): r, g, b = (int(h[k:k + 2], 16) for k in (1, 3, 5)); return 0.2126 * r + 0.7152 * g + 0.0722 * b
D4 = ((0, -1), (1, 0), (0, 1), (-1, 0))   # up, right, down, left

def inbox(x, y, boxes): return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in boxes)

def fill_holes(rules, a):
    """Section 2: every pixel of the 2 hole boxes was alpha 0 -> rules.holes.colour, alpha 255. Nothing else changes."""
    out = a.copy(); c = rules['holes']['colour']; rgb = [int(c[k:k + 2], 16) for k in (1, 3, 5)]
    edits = []
    for x0, y0, x1, y1 in rules['holes']['boxes']:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if a[y, x, 3] != 0: raise ValueError('hole pixel %d,%d is not transparent in the source' % (x, y))
                out[y, x] = rgb + [255]; edits.append((x, y))
    return out, edits

def build(rules, src):
    a, edits = fill_holes(rules, src)
    H, W = a.shape[:2]; op = a[..., 3] == 255
    if ((a[..., 3] != 0) & ~op).any(): raise ValueError('half-transparent pixels')
    fam_of = {h: f for f, hs in rules['families'].items() for h in hs}
    hexes = np.empty((H, W), object); fam = np.empty((H, W), object)
    for y in range(H):
        for x in range(W):
            if op[y, x]:
                h = hx(a[y, x]); hexes[y, x] = h
                if h not in fam_of: raise ValueError('colour %s at %d,%d is in no family' % (h, x, y))
                fam[y, x] = fam_of[h]
    Z = rules['zones']; R = np.zeros((H, W), np.int16); part = {}   # part[(x,y)] = 'mouth' | 'cheek' for id 10
    def tr(x, y): return x < 0 or y < 0 or x >= W or y >= H or not op[y, x]
    # step 1: outline (id 1) - LINE pixel touching outside (8 directions), or a straight 4-direction run of LINE pixels reaching outside
    #         within outline_reach steps. Outside = transparent or beyond the left / top / right image edge (the bottom edge is a crop, not outside).
    def outside(x, y): return x < 0 or y < 0 or x >= W or (y < H and not op[y, x])
    reach = rules['outline_reach']
    for y in range(H):
        for x in range(W):
            if not op[y, x] or fam[y, x] != 'LINE': continue
            hit = any(outside(x + dx, y + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dx or dy) and y + dy < H)
            for dx, dy in D4:
                if hit: break
                for k in range(1, reach + 1):
                    qx, qy = x + dx * k, y + dy * k
                    if qy >= H: break
                    if outside(qx, qy): hit = True; break
                    if fam[qy, qx] != 'LINE': break
            if hit: R[y, x] = 1
    # step 2: feature boxes and families for every other pixel; LINE pixels wait for step 3; IRIS outside the eyes waits for step 4
    small = rules['small_brown_px']; head_y = Z['head_max_y']
    wait_line, wait_odd, brown_head = [], [], np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if not op[y, x] or R[y, x] == 1: continue
            f, h = fam[y, x], hexes[y, x]
            if inbox(x, y, Z['eyes']): R[y, x] = 5 if f == 'IRIS' else 3 if f == 'SKIN' else 2; continue
            if inbox(x, y, Z['mouth']) and h in rules['mouth_colours']: R[y, x] = 10; part[(x, y)] = 'mouth'; continue
            if inbox(x, y, Z['cheeks']) and h in rules['cheek_colours']: R[y, x] = 10; part[(x, y)] = 'cheek'; continue
            if f == 'LINE': wait_line.append((x, y)); continue
            if inbox(x, y, Z['ears']) or inbox(x, y, Z['neck']):
                R[y, x] = 8 if f == 'BLUE' else 3 if f != 'IRIS' else 0
                if f == 'IRIS': wait_odd.append((x, y))
                continue
            if inbox(x, y, Z['copper']):
                if f == 'BLUE': R[y, x] = 8
                elif f in ('BROWN', 'SKIN') or h == '#FEF6C6': R[y, x] = 9
                elif f == 'IVORY': R[y, x] = 6
                else: wait_odd.append((x, y))
                continue
            if f == 'BLUE': R[y, x] = 8; continue
            if f == 'IRIS': wait_odd.append((x, y)); continue
            if y <= head_y:
                if f == 'SKIN': R[y, x] = 3
                elif f == 'IVORY': R[y, x] = 4
                else: brown_head[y, x] = True       # BROWN: hair, or skin if a small patch touching skin (below)
            else:
                R[y, x] = 7 if f == 'BROWN' else 6
    lab, n = ndimage.label(brown_head)               # 4-connected
    skin_col = op & (fam == 'SKIN')
    pad = np.pad(skin_col, 1); near_skin = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]   # has a SKIN-family neighbour (4 dir)
    sizes = ndimage.sum(np.ones((H, W)), lab, index=range(1, n + 1)); touch = ndimage.maximum(near_skin, lab, index=range(1, n + 1))
    small_skin = {i + 1 for i in range(n) if sizes[i] < small and touch[i]}
    for y, x in zip(*np.where(brown_head)): R[y, x] = 3 if lab[y, x] in small_skin else 4
    # step 4 (before lines): odd pixels (IRIS colour outside the eyes) take the most common id among their 8 neighbours that are already set, tie -> lower id
    for x, y in wait_odd:
        c = {}
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                qx, qy = x + dx, y + dy
                if (dx or dy) and not tr(qx, qy) and fam[qy, qx] != 'LINE' and R[qy, qx] > 0: c[int(R[qy, qx])] = c.get(int(R[qy, qx]), 0) + 1
        R[y, x] = min(c, key=lambda k: (-c[k], k)) if c else 11
    # step 3: inner LINE pixels - walk up / right / down / left through LINE pixels to the first non-LINE pixel and take its id
    #         (transparent, image edge or more than ray_max steps = no answer). One id found -> that id; two or more, none,
    #         or the only id is a face feature (2 / 5 / 10) -> 11.
    rmax = rules['ray_max']; out = {}
    for x, y in wait_line:
        found = set()
        for dx, dy in D4:
            for k in range(1, rmax + 1):
                qx, qy = x + dx * k, y + dy * k
                if tr(qx, qy): break
                if fam[qy, qx] != 'LINE': found.add(int(R[qy, qx])); break
        v = next(iter(found)) if len(found) == 1 else 11
        out[(x, y)] = 11 if v in (2, 5, 10) else v
    for (x, y), v in out.items(): R[y, x] = v
    # G: in each id, the colours used, darkest first by Y = 0.2126 R + 0.7152 G + 0.0722 B (ties: hex text order).
    #    id 10: mouth colours G 0.., cheek colours G 16..
    Gm = np.zeros((H, W), np.int16); mats = {}
    for i in range(1, 12):
        ys, xs = np.where(R == i)
        if not len(xs): continue
        if i == 10:
            parts = {}
            for pname, g0 in (('mouth', 0), ('cheek', 16)):
                pts = [(x, y) for x, y in zip(xs, ys) if part.get((x, y)) == pname]
                cols = sorted({hexes[y, x] for x, y in pts}, key=lambda h: (lum(h), h))
                for x, y in pts: Gm[y, x] = g0 + cols.index(hexes[y, x])
                parts[pname] = {'g0': g0, 'shades': cols, 'px': [sum(1 for x, y in pts if hexes[y, x] == c) for c in cols]}
            mats['10'] = {'name': rules['ids']['10'], 'parts': parts}
        else:
            cols = sorted({hexes[y, x] for x, y in zip(xs, ys)}, key=lambda h: (lum(h), h))
            for x, y in zip(xs, ys): Gm[y, x] = cols.index(hexes[y, x])
            mats[str(i)] = {'name': rules['ids'][str(i)], 'shades': cols, 'px': [int(((R == i) & (hexes == c)).sum()) for c in cols]}
    return a, R, Gm, {'materials': mats, 'edits': edits, 'counts': {str(i): int((R == i).sum()) for i in range(12)}}

def mask_png(R, Gm, op):
    m = np.zeros(R.shape + (4,), np.uint8); m[..., 0] = R; m[..., 1] = Gm; m[..., 3] = np.where(op, 255, 0); m[~op] = 0
    return m

if __name__ == '__main__':
    rules = json.load(open(sys.argv[1])); src = np.array(Image.open(sys.argv[2]).convert('RGBA'))
    out = sys.argv[3]; os.makedirs(out, exist_ok=True)
    a, R, Gm, info = build(rules, src)
    Image.fromarray(a.astype(np.uint8)).save(os.path.join(out, 'ref-pt.png'))
    Image.fromarray(mask_png(R, Gm, a[..., 3] == 255)).save(os.path.join(out, 'ref-pt-mask.png'))
    json.dump({'schema': 1, 'materials': info['materials'], 'counts': info['counts']}, open(os.path.join(out, 'ref-pt-mask.json'), 'w'), indent=1)
    print(json.dumps(info['counts']))
