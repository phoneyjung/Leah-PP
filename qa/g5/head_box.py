# Head of idle f1 per direction (the reference frame for the hat): top row, head box (mask IDs 1-5,10,11 above the neck), hair box (ID 4),
# and the same for the portrait. Neck row = first row below the face where the opaque width shrinks to its minimum before the shoulders.
import sys, json
from PIL import Image
DIRS = ['S','SE','E','NE','N','NW','W','SW']
root = sys.argv[1]
m = Image.open(root + '/c2-pilot-kid4-idleanim-mask.png').convert('RGBA').load()
out = {}
for r, d in enumerate(DIRS):
    pts = [(x, y, m[x, r*96+y][0]) for y in range(96) for x in range(96) if m[x, r*96+y][3] > 0]
    top = min(y for x, y, i in pts)
    width = {y: len([1 for x, yy, i in pts if yy == y]) for y in range(top, 60)}
    # neck: narrowest row between top+18 and 55
    neck = min(range(top + 18, 56), key=lambda y: (width.get(y, 99), y))
    head = [(x, y) for x, y, i in pts if y < neck]
    hair = [(x, y) for x, y, i in pts if i == 4 and y < neck]
    bx = lambda p: [min(a for a, b in p), min(b for a, b in p), max(a for a, b in p), max(b for a, b in p)]
    out[d] = {'top': top, 'neck_row': neck, 'head_box': bx(head), 'head_w': bx(head)[2] - bx(head)[0] + 1, 'hair_box': bx(hair) if hair else None}
    print(d, out[d])
pm = Image.open(root + '/c2-pilot-kid4-pt-mask.png').convert('RGBA'); W, H = pm.size; p = pm.load()
hair = [(x, y) for y in range(H) for x in range(W) if p[x, y][3] > 0 and p[x, y][0] == 4]
op = [(x, y) for y in range(H) for x in range(W) if p[x, y][3] > 0]
out['portrait'] = {'size': [W, H], 'top': min(y for x, y in op), 'hair_box': [min(a for a, b in hair), min(b for a, b in hair), max(a for a, b in hair), max(b for a, b in hair)]}
print('portrait', out['portrait'])
json.dump(out, open(sys.argv[2], 'w'))
