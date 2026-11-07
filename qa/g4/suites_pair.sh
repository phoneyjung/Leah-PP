#!/bin/bash
# G4 M1 (v3 after Codex T35-N1): the game's own suites, main and the G4 branch in the SAME environment and the SAME session.
# Every suite runs once on main and once on the branch, one at a time, the order flipping from suite to suite (main first on odd ones),
# so a slow spell of the machine hits both sides alike. A stored baseline from another day or machine is never used as the reference.
#   MAIN_DIR=<checkout of main> BRANCH_DIR=<checkout of the branch> OUT=<folder outside the repo> [ONLY="test_170 test_178"] [RERUNS=2] bash qa/g4/suites_pair.sh
#   then: python3 qa/g4/suites_cmp.py $OUT          (exit 0 pass · 1 regression · 3 cannot judge)
# Needs: CHROME_EXE, NODE_PATH with puppeteer (as for the suites themselves). Ports 8790 (main) and 8791 (branch) are served here.
# v3: suites.tsv = the list chosen here (name · kind · sha256 of the suite file on main · on the branch; kind 'legacy' = a suite with no
# assert of its own, it prints values for a person to read) · env.txt also keeps both folders and OUT (the comparator masks them) ·
# reruns are decided by the comparator's own rule (suites_cmp.py --needs-rerun), so the runner and the judge never disagree ·
# resumable: a run with an .exit file is not run again · ALLDONE is written last, with the counts.
# v3.1 (after Codex T36-N2): runs.tsv = every run in the order it ran (suite · side · run number · exit · sha256-16 of its log), written
# right after the run · ALLDONE carries suites=, runs= and manifest= (sha256-16 of runs.tsv), so a deleted, added or edited run shows ·
# v3.2 (after Codex T37): ALLDONE also carries suites_sha=, env_sha=, target_sha= (sha256-16 of suites.tsv, env.txt, target.txt as they
# stand when the runner finishes), so the files that choose HOW a suite is judged (kind) cannot change afterwards without showing ·
# target.txt = what this OUT measures (both folders, both HEADs, sha of the game files): resuming an OUT with another target is refused
# (exit 2: use a new OUT).
set -u
: "${MAIN_DIR:?}" "${BRANCH_DIR:?}" "${OUT:?}"
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT"
python3 -m http.server 8790 --bind 127.0.0.1 --directory "$MAIN_DIR" >/dev/null 2>&1 & S1=$!
python3 -m http.server 8791 --bind 127.0.0.1 --directory "$BRANCH_DIR" >/dev/null 2>&1 & S2=$!
trap 'kill $S1 $S2 2>/dev/null' EXIT
sleep 1
# the game files that make the target (index.html, sw.js, every root *.js but the suites): a resumed OUT must measure the same thing
game() { (cd "$1" && ls index.html sw.js *.js 2>/dev/null | grep -v '^test_' | sort | xargs -r sha256sum | sha256sum | cut -c1-16); }
TARGET="main $(git -C "$MAIN_DIR" rev-parse HEAD 2>/dev/null) $(game "$MAIN_DIR") $MAIN_DIR | branch $(git -C "$BRANCH_DIR" rev-parse HEAD 2>/dev/null) $(game "$BRANCH_DIR") $BRANCH_DIR"
if [ -f "$OUT/target.txt" ]; then
  [ "$(cat "$OUT/target.txt")" = "$TARGET" ] || { echo "OUT $OUT belongs to another target (folders/HEAD/game files differ): use a new OUT"; exit 2; }
else echo "$TARGET" > "$OUT/target.txt"; fi
rm -f "$OUT/ALLDONE"
[ -f "$OUT/env.txt" ] || { echo "chromium $("${CHROME_EXE:-chromium}" --version 2>/dev/null)"; echo "node $(node --version)"; echo "main $(git -C "$MAIN_DIR" rev-parse HEAD 2>/dev/null)"; echo "branch $(git -C "$BRANCH_DIR" rev-parse HEAD 2>/dev/null)";
  echo "maindir $MAIN_DIR"; echo "branchdir $BRANCH_DIR"; echo "out $OUT"; echo "only ${ONLY:-}"; echo "start $(date -Is)"; } > "$OUT/env.txt"
sha() { [ -f "$1" ] && sha256sum "$1" | cut -c1-16 || echo missing; }
if [ ! -f "$OUT/suites.tsv" ]; then
  echo "# name	kind	sha256-16 main	sha256-16 branch" > "$OUT/suites.tsv"
  for f in $(cd "$MAIN_DIR" && ls test_*.js | sort); do
    n=${f%.js}
    if [ -n "${ONLY:-}" ] && ! echo " $ONLY " | grep -q " ${n%%_[a-z]*} \| $n "; then continue; fi
    if grep -qE 'errors\.push|errors\.length|process\.exit|exitCode' "$MAIN_DIR/$f"; then kind=assert; else kind=legacy; fi
    printf '%s\t%s\t%s\t%s\n' "$n" "$kind" "$(sha "$MAIN_DIR/$f")" "$(sha "$BRANCH_DIR/$f")" >> "$OUT/suites.tsv"
  done
fi
one() { # one run: $1 suite name · $2 side · $3 run suffix ('' or .2 / .3)
  local n=$1 side=$2 k=$3 dir port t0 t1 e
  [ -f "$OUT/$n.$side$k.exit" ] && return
  if [ "$side" = main ]; then dir=$MAIN_DIR; port=8790; else dir=$BRANCH_DIR; port=8791; fi
  t0=$(date +%s.%N); (cd "$dir" && PORT=$port OUT_DIR="$OUT/out_$n.$side$k" timeout 300 node "$n.js" > "$OUT/$n.$side$k.log" 2>&1); e=$?; t1=$(date +%s.%N)
  echo "$e $(python3 -c "print(round($t1-$t0,1))")" > "$OUT/$n.$side$k.exit"
  local r=${k#.}
  printf '%s\t%s\t%s\t%s\t%s\n' "$n" "$side" "${r:-1}" "$e" "$(sha256sum "$OUT/$n.$side$k.log" | cut -c1-16)" >> "$OUT/runs.tsv"
}
i=0
for n in $(grep -v '^#' "$OUT/suites.tsv" | cut -f1); do
  i=$((i+1)); if [ $((i % 2)) -eq 1 ]; then order="main branch"; else order="branch main"; fi
  for side in $order; do one "$n" "$side" ""; done
done
# a suite that is not 'pass' on either side (or a legacy suite whose two outputs differ) runs RERUNS (default 2) more times on BOTH sides
# (alternating; RERUNS=4 → 5 runs per side, e.g. after a 'NEW STOP POINT' — resumable, so the same OUT can be run again): a failing
# suite may fail at different places from run to run (seen in G4.0: test_167 timed out at #context167 in one run, at inspect() in the next)
for n in $(grep -v '^#' "$OUT/suites.tsv" | cut -f1); do
  [ "$(python3 "$HERE/suites_cmp.py" --needs-rerun "$OUT" "$n")" = yes ] || continue
  for i in $(seq 2 $((1 + ${RERUNS:-2}))); do one "$n" main ".$i"; one "$n" branch ".$i"; done
done
echo "end $(date -Is)" >> "$OUT/env.txt"
h() { sha256sum "$1" | cut -c1-16; }
echo "DONE suites=$(grep -vc '^#' "$OUT/suites.tsv") runs=$(wc -l < "$OUT/runs.tsv") manifest=$(h "$OUT/runs.tsv") suites_sha=$(h "$OUT/suites.tsv") env_sha=$(h "$OUT/env.txt") target_sha=$(h "$OUT/target.txt")" > "$OUT/ALLDONE"
