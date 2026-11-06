#!/bin/bash
# G4 M1 (v2 after Codex T34-R3): the game's own suites, main and the G4 branch in the SAME environment and the SAME session.
# Every suite runs once on main and once on the branch, one at a time, the order flipping from suite to suite (main first on odd ones),
# so a slow spell of the machine hits both sides alike. A stored baseline from another day or machine is never used as the reference.
#   MAIN_DIR=<checkout of main> BRANCH_DIR=<checkout of the branch> OUT=<folder outside the repo> [ONLY="test_170 test_178"] bash qa/g4/suites_pair.sh
#   then: python3 qa/g4/suites_cmp.py $OUT
# Needs: CHROME_EXE, NODE_PATH with puppeteer (as for the suites themselves). Ports 8790 (main) and 8791 (branch) are served here.
set -u
: "${MAIN_DIR:?}" "${BRANCH_DIR:?}" "${OUT:?}"
mkdir -p "$OUT"
python3 -m http.server 8790 --bind 127.0.0.1 --directory "$MAIN_DIR" >/dev/null 2>&1 & S1=$!
python3 -m http.server 8791 --bind 127.0.0.1 --directory "$BRANCH_DIR" >/dev/null 2>&1 & S2=$!
trap 'kill $S1 $S2 2>/dev/null' EXIT
sleep 1
{ echo "chromium $("${CHROME_EXE:-chromium}" --version 2>/dev/null)"; echo "node $(node --version)"; echo "main $(git -C "$MAIN_DIR" rev-parse HEAD)"; echo "branch $(git -C "$BRANCH_DIR" rev-parse HEAD)"; echo "start $(date -Is)"; } > "$OUT/env.txt"
i=0
for f in $(cd "$MAIN_DIR" && ls test_*.js | sort); do
  n=${f%.js}
  if [ -n "${ONLY:-}" ] && ! echo " $ONLY " | grep -q " ${n%%_[a-z]*} \| $n "; then continue; fi
  i=$((i+1)); if [ $((i % 2)) -eq 1 ]; then order="main branch"; else order="branch main"; fi
  for side in $order; do
    [ -f "$OUT/$n.$side.exit" ] && continue
    if [ $side = main ]; then dir=$MAIN_DIR; port=8790; else dir=$BRANCH_DIR; port=8791; fi
    t0=$(date +%s.%N); (cd "$dir" && PORT=$port OUT_DIR="$OUT/out_$n.$side" timeout 300 node "$f" > "$OUT/$n.$side.log" 2>&1); e=$?; t1=$(date +%s.%N)
    echo "$e $(python3 -c "print(round($t1-$t0,1))")" > "$OUT/$n.$side.exit"
  done
done
# a suite that failed on either side runs 2 more times on BOTH sides (alternating): a failing suite may fail at different places
# from run to run (seen in G4.0: test_167 timed out at #context167 in one run and at inspect() in the next, on main itself)
for x in "$OUT"/*.main.exit; do
  n=$(basename "$x" .main.exit); f=$n.js
  read em _ < "$OUT/$n.main.exit"; read eb _ < "$OUT/$n.branch.exit"
  [ "$em" = 0 ] && [ "$eb" = 0 ] && continue
  for k in 2 3; do for side in main branch; do
    [ -f "$OUT/$n.$side.$k.exit" ] && continue
    if [ $side = main ]; then dir=$MAIN_DIR; port=8790; else dir=$BRANCH_DIR; port=8791; fi
    t0=$(date +%s.%N); (cd "$dir" && PORT=$port OUT_DIR="$OUT/out_$n.$side.$k" timeout 300 node "$f" > "$OUT/$n.$side.$k.log" 2>&1); e=$?; t1=$(date +%s.%N)
    echo "$e $(python3 -c "print(round($t1-$t0,1))")" > "$OUT/$n.$side.$k.exit"
  done; done
done
echo "end $(date -Is)" >> "$OUT/env.txt"
echo DONE > "$OUT/ALLDONE"
