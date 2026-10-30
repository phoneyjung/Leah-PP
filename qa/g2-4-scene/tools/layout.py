#!/usr/bin/env python3
# G2.4 scene pilot - layout v1 (Claude · 30 Oct 2569 · v1 = fixes from the independent review): village edge in front of the cave mouth at dusk (owner D6 18:1x)
# Grid only (no art yet): collision on T = 32 px tiles, feet-point movement, 8 directions without corner cutting.
# Grass is drawn '.'; the script marks grass farther than LAMP_R tiles from every lamp as dark (',') = where the slime may walk.
# NOTE: this is a GRID DESIGN CHECK only. Pairs come from all walkable cells, blocked targets are solid cells (A* refuses them at once),
#       so 60/60 and 0/11 mostly prove the grid is connected; the real check runs later in the Pilot page with real movement.
# Writes: pilot-scene-layout.json (grid + legend + points) · pilot-paths.json (seed 2410: 60 pairs + 11 blocked targets)
#         layout-v0.png (labelled map, 1 tile = 24 px) · layout-check.json (numbers vs plan G2.0 / G2.4 criteria)
# usage: python3 -I layout.py OUT_DIR
import sys, os, json, heapq, random, hashlib
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
T = 32
GRID = [  # 28 x 14 · row 0 = top (north) · rows 0-3 = cliff (row 3 = cliff face) · see LEGEND
    "^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
    "^^^^^^^^^^^^^^^CCCC^^^^^^^^^",
    "TT^^^^^^^^^^^^^CCCC^^^^^^^TT",
    "TT^^^^^^^^^^^^^CCCC^^^^^^^TT",
    "T.............L=XX=L.......T",
    "T...............==.........T",
    "T..HHHHHH......==.......R..T",
    "T..HHHHHHb...L.==..........T",
    "T..HHDDHHbr...==.......R.*.T",
    "T...L---------==...........T",
    "T............L==...........T",
    "TT.......*.....=S.........TT",
    "TTT..TT.......==.....TT..TTT",
    "TTTTTTTTTTTTffGGffTTTTTTTTTT",
]
LEGEND = {  # char: (name Thai, walkable, colour)
    '^': ('หน้าผาหิน (ไทล์มีความสูง)', False, (93, 80, 120)),
    'C': ('ปากถ้ำฝังในหน้าผา', False, (40, 30, 60)),
    'X': ('ทางออกฉาก = ปากถ้ำ (วงแสงวาร์ป)', True, (95, 224, 255)),
    'T': ('ต้นไม้/แนวป่า', False, (47, 92, 70)),
    'H': ('บ้านยามปากถ้ำ (ฐานอาคาร)', False, (200, 110, 80)),
    'D': ('ช่องประตูบ้านยาม (2 ช่อง = 64 px)', True, (255, 200, 87)),
    'L': ('เสาไฟถนน (โคมอุ่น)', False, (255, 170, 90)),
    'b': ('ลัง/ถังของชาวบ้าน', False, (150, 100, 60)),
    'r': ('ขดเชือก (เตี้ย)', False, (170, 130, 80)),
    'f': ('รั้วไม้', False, (130, 90, 55)),
    'G': ('ประตูรั้วหมู่บ้าน (ปิดตอนค่ำ)', False, (160, 110, 60)),
    'R': ('ก้อนหิน', False, (120, 115, 140)),
    '=': ('ทางดินหลัก (2 ช่อง)', True, (196, 160, 110)),
    '-': ('ทางรอง (1 ช่อง)', True, (176, 142, 98)),
    '.': ('หญ้าหมู่บ้าน (แสงไฟถึง)', True, (79, 110, 94)),
    ',': ('ทุ่งหญ้ามืด (ไกลไฟทุกต้น > 4.5 ช่อง · สไลม์เดินได้เฉพาะที่นี่)', True, (52, 70, 72)),
    '*': ('เศษคริสตัล (ของที่เก็บได้ · ฟ้า)', True, (95, 224, 255)),
    'S': ('จุดเริ่ม', True, (255, 255, 255)),
}
LAMP_R = 4.5   # lamp light radius in tiles (code light, 144 art px) · grass farther than this from every lamp = dark
H, W = len(GRID), len(GRID[0])
assert all(len(r) == W for r in GRID) and (W, H) == (28, 14), (W, H)
assert all(c in LEGEND for r in GRID for c in r)
_lamps = [(x, y) for y in range(H) for x in range(W) if GRID[y][x] == 'L']
GRID = [''.join((',' if c == '.' and min(((x - lx) ** 2 + (y - ly) ** 2) ** 0.5 for lx, ly in _lamps) > LAMP_R else c) for x, c in enumerate(r)) for y, r in enumerate(GRID)]
walk = [[LEGEND[c][1] for c in r] for r in GRID]
def cells(ch): return [(x, y) for y in range(H) for x in range(W) if GRID[y][x] == ch]
start = cells('S')[0]; exits = cells('X'); doors = cells('D'); crystal = cells('*')
DIRS8 = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
def nb(x, y):
    for dx, dy in DIRS8:
        nx, ny = x + dx, y + dy
        if not (0 <= nx < W and 0 <= ny < H) or not walk[ny][nx]: continue
        if dx and dy and not (walk[y][nx] and walk[ny][x]): continue   # no corner cutting
        yield nx, ny, (1.41421356 if dx and dy else 1.0)
def astar(a, b):
    if not (0 <= b[0] < W and 0 <= b[1] < H) or not walk[b[1]][b[0]] or not walk[a[1]][a[0]]: return None
    h = lambda p: max(abs(p[0] - b[0]), abs(p[1] - b[1])) + 0.41421356 * min(abs(p[0] - b[0]), abs(p[1] - b[1]))
    openq = [(h(a), 0.0, a)]; g = {a: 0.0}; came = {}
    while openq:
        f, gc, cur = heapq.heappop(openq)
        if cur == b:
            path = [cur]
            while cur in came: cur = came[cur]; path.append(cur)
            return path[::-1]
        if gc > g[cur] + 1e-9: continue
        for nx, ny, c in nb(*cur):
            ng = gc + c
            if ng < g.get((nx, ny), 1e18) - 1e-9: g[(nx, ny)] = ng; came[(nx, ny)] = cur; heapq.heappush(openq, (ng + h((nx, ny)), ng, (nx, ny)))
    return None
# reachable region from the start
seen = {start}; q = [start]
while q:
    c = q.pop()
    for nx, ny, _ in nb(*c):
        if (nx, ny) not in seen: seen.add((nx, ny)); q.append((nx, ny))
walk_cells = [(x, y) for y in range(H) for x in range(W) if walk[y][x]]
unreach = [c for c in walk_cells if c not in seen]
rng = random.Random(2410); pool = sorted(walk_cells); pairs = []
while len(pairs) < 60:
    a, b = rng.choice(pool), rng.choice(pool)
    if a != b: pairs.append([list(a), list(b)])
run1 = [astar(tuple(a), tuple(b)) for a, b in pairs]; run2 = [astar(tuple(a), tuple(b)) for a, b in pairs]
BLOCKED = [  # target cells that must never be reachable: (x, y, why) · all solid, so A* refuses them before searching (grid design check)
    (5, 1, 'ในหน้าผา'), (17, 2, 'ในปากถ้ำ'), (4, 7, 'ในบ้านยาม'), (7, 6, 'ในบ้านยาม (หลังประตู)'), (5, 12, 'ในต้นไม้'),
    (14, 4, 'ฐานเสาไฟปากถ้ำ'), (24, 6, 'ในก้อนหิน'), (12, 13, 'ในรั้ว'), (14, 13, 'ประตูรั้วหมู่บ้านที่ปิด'), (30, 7, 'นอกขอบฉาก (ตะวันออก)'), (13, -1, 'นอกขอบฉาก (เหนือ)')]
blocked = [{'cell': [x, y], 'why': why, 'path_found': astar(start, (x, y)) is not None} for x, y, why in BLOCKED]
to_exit = [astar(start, e) for e in exits]; to_door = [astar(start, d) for d in doors]; to_crystal = [astar(start, c) for c in crystal]
open_px = sum(1 for c in walk_cells); n = W * H
cliff = sum(1 for r in GRID for c in r if c in '^C')
area = {'walkable_open': open_px, 'blocked': n - open_px, 'pct_walkable': round(100 * open_px / n, 1),
        'pct_walkable_below_cliff': round(100 * open_px / (n - cliff), 1), 'cliff_tiles': cliff}
cx = (cells('C')[0][0] + cells('C')[-1][0] + 1) / 2
def nb4(x, y): return [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and walk[y + dy][x + dx]]
special = set(doors) | set(exits)
dead_ends = [list(c) for c in walk_cells if c not in special and len(nb4(*c)) <= 1]
narrow = [list(c) for c in walk_cells if c not in special and ((c[0] - 1 < 0 or not walk[c[1]][c[0] - 1]) and (c[0] + 1 >= W or not walk[c[1]][c[0] + 1])
          or (c[1] - 1 < 0 or not walk[c[1] - 1][c[0]]) and (c[1] + 1 >= H or not walk[c[1] + 1][c[0]]))]
dark = cells(','); lamp_d = lambda c: min(((c[0] - lx) ** 2 + (c[1] - ly) ** 2) ** 0.5 for lx, ly in _lamps)
lit_grass = cells('.')
regions, left = [], set(dark)   # 4-connected regions of dark grass (the crystal cell counts as dark ground when it is dark)
for c in crystal:
    if lamp_d(c) > LAMP_R: left.add(c)
while left:
    st = [left.pop()]; reg = {st[0]}
    while st:
        c = st.pop()
        for n in nb4(*c):
            if n in left: left.discard(n); reg.add(n); st.append(n)
    regions.append(reg)
slime_zone = next((r for r in regions if any(c in r for c in crystal)), max(regions, key=len) if regions else set())
check = {
    'size_tiles': [W, H], 'size_px': [W * T, H * T], 'T': T,
    'door_opening_px': len(doors) * T, 'door_rule_ge_64': len(doors) * T >= 64,
    'exits': len(exits), 'single_exit_point': len({e[1] for e in exits}) == 1 and len(exits) == 2,
    'reachable_pairs_ok': sum(1 for p in run1 if p) , 'pairs': len(pairs), 'repeat_identical': run1 == run2,
    'blocked_found': sum(1 for b in blocked if b['path_found']), 'blocked_targets': len(blocked),
    'exit_reachable': all(to_exit), 'door_reachable': all(to_door), 'crystal_reachable': all(to_crystal),
    'unreachable_walkable_cells': [list(c) for c in unreach],
    'area': area, 'focal_cave_x_pct': round(100 * cx / W, 1),
    'path_len_start_to_exit_tiles': min(len(p) - 1 for p in to_exit), 'path_len_start_to_door_tiles': min(len(p) - 1 for p in to_door),
    'lamps': [list(l) for l in _lamps], 'lamp_r_tiles': LAMP_R, 'dark_cells': len(dark), 'dark_regions': sorted((len(r) for r in regions), reverse=True), 'slime_zone_cells': len(slime_zone),
    'slime_zone_x_range': [min(c[0] for c in slime_zone), max(c[0] for c in slime_zone)] if slime_zone else None, 'slime_zone_lit_cells': sum(1 for c in slime_zone if lamp_d(c) <= LAMP_R), 'lit_grass_cells': len(lit_grass),
    'crystal_light': {str(list(c)): ('dark' if lamp_d(c) > LAMP_R else 'lit') + ' %.1f tiles from a lamp' % lamp_d(c) for c in crystal}, 'lamps_next_to_path_or_door': {str(list(l)): any(GRID[y][x] in '=-XD' for x, y in [(l[0] + dx, l[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)] if 0 <= x < W and 0 <= y < H) for l in _lamps},
    'dead_ends': dead_ends, 'narrow_1_tile': narrow,
}
json.dump({'version': 'v1', 'lamp_r_tiles': LAMP_R, 'slime_zone': sorted(list(c) for c in slime_zone), 'T': T, 'size': [W, H], 'grid': GRID, 'legend': {k: {'name': v[0], 'walkable': v[1]} for k, v in LEGEND.items()},
           'start': list(start), 'exits': [list(e) for e in exits], 'doors': [list(d) for d in doors], 'crystals': [list(c) for c in crystal]},
          open(os.path.join(OUT, 'pilot-scene-layout.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'seed': 2410, 'movement': '8 directions, no corner cutting, feet point on T = 32 tiles', 'pairs': [{'from': a, 'to': b, 'len': len(p) - 1 if p else None} for (a, b), p in zip(pairs, run1)],
           'blocked': blocked}, open(os.path.join(OUT, 'pilot-paths.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(check, open(os.path.join(OUT, 'layout-check.json'), 'w'), ensure_ascii=False, indent=1)
# picture
S = 24; PADL = 30; legend_h = 22 * ((len(LEGEND) + 1) // 2) + 30
img = Image.new('RGB', (PADL + W * S + 10, PADL + H * S + legend_h), (245, 243, 238)); d = ImageDraw.Draw(img)
F = ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma.otf', 14) if os.path.exists('/usr/share/fonts/opentype/tlwg/Loma.otf') else ImageFont.load_default()
FB = ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf', 15) if os.path.exists('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf') else F
for y in range(H):
    d.text((4, PADL + y * S + 4), str(y), fill=(90, 90, 90), font=F)
    for x in range(W):
        c = GRID[y][x]; col = LEGEND[c][2]; x0, y0 = PADL + x * S, PADL + y * S
        d.rectangle([x0, y0, x0 + S - 1, y0 + S - 1], fill=col, outline=(30, 30, 40) if not LEGEND[c][1] else (120, 130, 120))
        if c in 'XDS*LbrGR': d.text((x0 + 6, y0 + 3), c, fill=(0, 0, 0) if c in 'XD*S' else (255, 255, 255), font=FB)
for x in range(W): d.text((PADL + x * S + 6, 8), str(x % 10), fill=(90, 90, 90), font=F)
p = to_exit[0]
d.line([(PADL + px * S + S // 2, PADL + py * S + S // 2) for px, py in p], fill=(255, 255, 255), width=2)
gx = PADL + int(W * S * 0.618); d.line([(gx, PADL), (gx, PADL + H * S)], fill=(255, 80, 80), width=1)
ly = PADL + H * S + 10
for i, (k, v) in enumerate(LEGEND.items()):
    x0 = 10 + (i % 2) * ((W * S) // 2); y0 = ly + (i // 2) * 22
    d.rectangle([x0, y0, x0 + 16, y0 + 16], fill=v[2], outline=(30, 30, 40)); d.text((x0 + 22, y0), '%s  %s%s' % (k, v[0], '' if v[1] else ' · เดินไม่ได้'), fill=(20, 20, 20), font=F)
for lx, ly in _lamps:
    cxp, cyp, rr = PADL + lx * S + S // 2, PADL + ly * S + S // 2, LAMP_R * S
    d.ellipse([cxp - rr, cyp - rr, cxp + rr, cyp + rr], outline=(255, 190, 90), width=1)
img.save(os.path.join(OUT, 'layout-v1.png'))
print(json.dumps({k: v for k, v in check.items() if k not in ('unreachable_walkable_cells',)}, ensure_ascii=False), 'unreachable', len(unreach))
