#!/usr/bin/env python3
"""G4.6 (plan G4_0 §9 · D-G4-7 "ค"): build the private test copy of the game that measures smoothness on the owner's real phone.

  python3 qa/g4/build_phone_bench.py <game dir (a checkout of the branch)> <out dir> [files.txt]

<out>/page.html = the game's index.html with only these differences (everything else byte-for-byte the game):
  1. the document wrapper tags are taken out (<!doctype html><html lang="th"><head> · </head><body> · </body></html>): the artifact
     host wraps the page itself; their contents stay in place, in the same order
  2. <title> → "LA วัดความลื่น" (the artifact's name)
  3. <script src="firebase-config.js"></script> removed: the copy never goes online (no real database, no other players)
  4. qa/g4/phone_bench.js appended as one inline <script> at the end
<out>/files.json = {published path: source path} for every file the copy may ask for: files.txt (one path per line — the requests
seen while the copy booted and ran the bench locally, see the report) + char2.js, c2-pack.json and every file the pack names.
firebase-config.js, sw.js and test files are never included. Prints the counts and bytes.
"""
import json, os, re, sys

game, out = sys.argv[1], sys.argv[2]
lst = sys.argv[3] if len(sys.argv) > 3 else None
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(game, 'index.html'), encoding='utf-8').read()
cut = [('<!doctype html><html lang="th"><head>', ''), ('</head><body>', '\n'), ('</body></html>', '')]
page = src
for a, b in cut:
    if page.count(a) != 1:
        sys.exit('expected exactly one %r' % a)
    page = page.replace(a, b)
t = re.findall(r'<title>[^<]*</title>', page)
if len(t) != 1:
    sys.exit('expected one <title>')
page = page.replace(t[0], '<title>LA วัดความลื่น</title>')
fb = '<script src="firebase-config.js"></script>'
if page.count(fb) != 1:
    sys.exit('expected one firebase-config.js script tag')
page = page.replace(fb, '')
bench = open(os.path.join(here, 'phone_bench.js'), encoding='utf-8').read()
if '</script' in bench:
    sys.exit('phone_bench.js must not contain </script')
page = page.rstrip() + '\n<script>\n' + bench + '</script>\n'
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'page.html'), 'w', encoding='utf-8').write(page)

files = set()
if lst:
    for line in open(lst, encoding='utf-8'):
        p = line.strip().split('?')[0].lstrip('/')
        if p:
            files.add(p)
pack = json.load(open(os.path.join(game, 'c2-pack.json'), encoding='utf-8'))
files |= {'char2.js', 'c2-pack.json'}
def walk(v):
    if isinstance(v, str) and re.match(r'^[\w.-]+\.(png|webp|json|js)$', v):
        files.add(v)
    elif isinstance(v, dict):
        for x in v.values():
            walk(x)
    elif isinstance(v, list):
        for x in v:
            walk(x)
walk(pack)
bad = re.compile(r'^(firebase-config\.js|sw\.js|test_.*|index\.html|page\.html)$')
fmap, size, missing = {}, 0, []
for p in sorted(files):
    if bad.match(p) or '..' in p:
        continue
    fp = os.path.join(game, p)
    if not os.path.isfile(fp):
        missing.append(p)
        continue
    fmap[p] = os.path.abspath(fp)
    size += os.path.getsize(fp)
json.dump(fmap, open(os.path.join(out, 'files.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'page_bytes': len(page.encode()), 'files': len(fmap), 'file_bytes': size, 'missing': missing}, ensure_ascii=False))
