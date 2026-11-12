#!/usr/bin/env python3
"""G4.6 (plan G4_0 §9 · D-G4-7 "ค"): build the private test copy of the game that measures smoothness on the owner's real phone.
Version 2.

  python3 qa/g4/build_phone_bench.py <game dir (a checkout of the branch)> <out dir>

<out>/page.html = the game's index.html with only these differences (everything else byte-for-byte the game):
  1. the document wrapper tags are taken out (<!doctype html><html lang="th"><head> · </head><body> · </body></html>): the artifact
     host wraps the page itself; their contents stay in place, in the same order
  2. <title> → "LA วัดความลื่น" (the artifact's name)
  3. <script src="firebase-config.js"></script> removed: the copy never goes online (no real database, no other players)
  4. one inline <script> appended at the end: window.__benchBuild (the game version and the copy's file list) + qa/g4/phone_bench.js
<out>/files.json = {published path: source path} for every file of the copy · <out>/files.N.json = the same in parts of at most 250
files (one publish takes at most 255).

The copy's files (v2) = the game's OWN offline list: the FILES array of sw.js, the list the real game ships and caches — not a list
of requests seen in a run (v1 took such a list from a probe that changed what the page loaded, and 45 game files were left out).
Left out on purpose, and nothing else:
  './' · *.html     pages (the copy's page is page.html)
  firebase-config.js the copy never goes online (difference 3)
  sw.js             not in FILES; the copy installs no cache. The game asks for sw.js?check=… to look for a newer version; in the
                    copy that request fails and the game skips the check. phone_bench.js is told so (BUILD.absent).
Every listed file must exist, or the build stops. Whether the list is enough is checked where it matters: on the device,
phone_bench.js reads the browser's resource log and does not count a run in which the page asked for a file that is not in the copy
or that did not load (qa/g4/phone_bench_selftest.js proves that check).
"""
import json, os, re, sys

game, out = sys.argv[1], sys.argv[2]
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
ver = re.findall(r"const VERSION='([^']+)'", src)
if len(ver) != 1:
    sys.exit('expected one VERSION')

sw = open(os.path.join(game, 'sw.js'), encoding='utf-8').read()
m = re.search(r'const FILES=\[(.*?)\];', sw, re.S)
if not m:
    sys.exit('sw.js: FILES not found')
listed = re.findall(r"'([^']*)'", m.group(1))
if len(listed) != len(set(listed)) or len(listed) < 100:
    sys.exit('sw.js: FILES has repeats or is too short (%d)' % len(listed))
skip = lambda p: p == './' or p.endswith('.html') or p == 'firebase-config.js'
names = sorted(p for p in listed if not skip(p))
left_out = sorted(p for p in listed if skip(p))
fmap, size = {}, 0
for p in names:
    if not re.match(r'^[\w.@-]+$', p):
        sys.exit('unexpected path in FILES: %r' % p)
    fp = os.path.join(game, p)
    if not os.path.isfile(fp):
        sys.exit('listed in sw.js but not in the game: %s' % p)
    fmap[p] = os.path.abspath(fp)
    size += os.path.getsize(fp)
for must in ('char2.js', 'c2-pack.json', 'manifest.json'):
    if must not in fmap:
        sys.exit('%s is not in sw.js FILES' % must)

bench = open(os.path.join(here, 'phone_bench.js'), encoding='utf-8').read()
build = json.dumps({'version': ver[0], 'files': names, 'absent': ['sw.js']}, ensure_ascii=False, separators=(',', ':'))
if '</script' in bench or '</script' in build:
    sys.exit('the appended script must not contain </script')
page = page.rstrip() + '\n<script>\nwindow.__benchBuild=' + build + ';\n' + bench + '</script>\n'
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'page.html'), 'w', encoding='utf-8').write(page)
json.dump(fmap, open(os.path.join(out, 'files.json'), 'w'), indent=1, ensure_ascii=False)
parts = [names[i:i + 250] for i in range(0, len(names), 250)]
for i, part in enumerate(parts, 1):
    json.dump({p: fmap[p] for p in part}, open(os.path.join(out, 'files.%d.json' % i), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'version': ver[0], 'page_bytes': len(page.encode()), 'files': len(fmap), 'file_bytes': size, 'parts': [len(p) for p in parts],
                  'left_out': left_out}, ensure_ascii=False))
