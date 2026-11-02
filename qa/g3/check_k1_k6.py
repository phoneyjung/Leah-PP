#!/usr/bin/env python3
"""G3 K1 + K6 file checks (Claude · read only).
K1: index.html / sw.js / database.rules.json identical to main · every SHA-256 in G3_0_BASELINE.md section 1 matches the file ·
    every sha256 in c2-pack.json matches the file and the baseline · c2-pack.json == what qa/g3/build_pack.py builds from the locked files.
K6: char2.js <= 30 KiB · c2-pack.json <= 8 KiB · all files the pack loads <= 3 MiB · sw.js precache unchanged (+0).
usage: python3 -I qa/g3/check_k1_k6.py REPO_ROOT [MAIN_REF]      exit 0 = all pass
"""
import hashlib, json, re, subprocess, sys
from pathlib import Path

root = Path(sys.argv[1]); ref = sys.argv[2] if len(sys.argv) > 2 else 'origin/main'
sha = lambda f: hashlib.sha256((root / f).read_bytes()).hexdigest()
res, ok = {}, True

diff = subprocess.run(['git', '-C', str(root), 'diff', '--name-only', ref, '--', 'index.html', 'sw.js', 'database.rules.json'],
                      capture_output=True, text=True)
res['game_files_changed_vs_' + ref] = diff.stdout.split() if diff.returncode == 0 else 'git error: ' + diff.stderr.strip()
ok &= diff.returncode == 0 and not diff.stdout.strip()

base = (root / 'G3_0_BASELINE.md').read_text(encoding='utf-8')
rows = re.findall(r'^\|[^|]*\| `([^`]+)`[^|]*\| `([0-9a-f]{64})` \|', base, re.M)
bad = [f for f, h in rows if not (root / f).exists() or sha(f) != h]
res['baseline_sha'] = f'{len(rows) - len(bad)}/{len(rows)}' + (f' bad {bad}' if bad else '')
ok &= len(rows) == 20 and not bad
known = {f: h for f, h in rows}

pack = json.loads((root / 'c2-pack.json').read_text(encoding='utf-8'))
pairs = []
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and k in ('src', 'mask', 'light', 'mask_meta', 'shademap'):
                hk = {'src': 'sha256', 'mask': 'mask_sha256', 'light': 'light_sha256', 'mask_meta': 'mask_meta_sha256', 'shademap': 'shademap_sha256'}[k]
                pairs.append((v, o.get(hk)))
            walk(v)
walk(pack)
pbad = [f for f, h in pairs if h is None or sha(f) != h or (f in known and known[f] != h)]
res['pack_sha'] = f'{len(pairs) - len(pbad)}/{len(pairs)}' + (f' bad {pbad}' if pbad else '')
ok &= not pbad
chk = subprocess.run([sys.executable, '-I', str(root / 'qa/g3/build_pack.py'), str(root), '--check'], capture_output=True, text=True)
res['pack_rebuild'] = chk.stdout.strip(); ok &= chk.returncode == 0

files = sorted({f for f, _ in pairs})
k6 = {'char2.js': (root / 'char2.js').stat().st_size, 'c2-pack.json': (root / 'c2-pack.json').stat().st_size,
      'loaded_files': len(files) + 1, 'loaded_bytes': sum((root / f).stat().st_size for f in files) + (root / 'c2-pack.json').stat().st_size}
sw = (root / 'sw.js').read_text(encoding='utf-8')
k6['sw_mentions_char2'] = [n for n in ['char2.js', 'c2-pack.json'] + files if n in sw]
res['k6'] = k6
ok &= k6['char2.js'] <= 30 * 1024 and k6['c2-pack.json'] <= 8 * 1024 and k6['loaded_bytes'] <= 3 * 1048576 and not k6['sw_mentions_char2']
res['pass'] = bool(ok)
print(json.dumps(res, indent=1, ensure_ascii=False))
sys.exit(0 if ok else 1)
