"""G3.1 inventory checker (read-only).

Every evidence pair in the inventory is written as  L<line> `<code text>`  .
This script checks that each code text really appears on that line of index.html,
counts the P1-P23, H1-H4 and U1-U5 rows (U added in inventory v1.1 after Codex T20), and checks the file hash quoted in the inventory.

usage: python3 -I qa/g3/check_inventory.py G3_ANCHOR_INVENTORY.md index.html
exit 0 = every pair found, 23 P rows, 4 H rows, 5 U rows, hash matches.
"""
import hashlib, re, sys

inv_path, game_path = sys.argv[1], sys.argv[2]
inv = open(inv_path, encoding='utf-8').read()
raw = open(game_path, 'rb').read()
lines = raw.decode('utf-8').split('\n')

pairs = re.findall(r'L(\d{2,4}) `([^`]+)`', inv)
miss = [(n, s) for n, s in pairs if s not in lines[int(n) - 1]]
p_rows = sorted(set(re.findall(r'^\| (P\d+) \|', inv, re.M)), key=lambda x: int(x[1:]))
h_rows = sorted(set(re.findall(r'^\| (H\d) \|', inv, re.M)))
u_rows = sorted(set(re.findall(r'^\| (U\d+) \|', inv, re.M)))
sha = hashlib.sha256(raw).hexdigest()
sha_ok = sha in inv

for n, s in miss:
    print('MISS', n, s)
print(f'pairs {len(pairs)} found {len(pairs) - len(miss)} miss {len(miss)} | '
      f'P rows {len(p_rows)} ({p_rows[0] if p_rows else "-"}..{p_rows[-1] if p_rows else "-"}) | '
      f'H rows {len(h_rows)} | U rows {len(u_rows)} | lines {len(lines)} | sha {"ok" if sha_ok else "DIFFERENT " + sha}')
sys.exit(0 if (not miss and len(p_rows) == 23 and len(h_rows) == 4 and len(u_rows) == 5 and sha_ok) else 1)
