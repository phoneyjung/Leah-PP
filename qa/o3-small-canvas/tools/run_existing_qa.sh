#!/bin/bash
# Existing QA on the throwaway copies (one after another so the FPS check G11 does not share the CPU)
# OLD = 4c938cc page on :8931 · FIX = scale() change on :8932
O=/tmp/claude-0/-home-claude/d3d34840-5e4e-52a0-a344-341c2cb1b80f/scratchpad/o3
R=$O/results/existing; mkdir -p $R; cd /tmp
run(){ local tag=$1; shift; echo "== $tag: $*" >> $R/exit-codes.txt; "$@" > $R/$tag.log 2>&1; local e=$?; echo "$tag exit=$e" >> $R/exit-codes.txt; }
: > $R/exit-codes.txt
run v23-FIX  python3 -I $O/fix/test_g2_lantern_gm.py 8932 $R/v23-FIX 8931
run v23-OLD  python3 -I $O/old/test_g2_lantern_gm.py 8931 $R/v23-OLD 8931
run hold-FIX python3 -I $O/fix/test_g2_hold.py 8932 $R/hold-FIX gm
run hold-OLD python3 -I $O/old/test_g2_hold.py 8931 $R/hold-OLD gm
run cpool-OLDvsFIX python3 -I $O/fix/qa/g2-5a-cpool/tools/test_cpool.py 8931 8932 $R/cpool-OLDvsFIX.json
run offset-FIX python3 -I $O/fix/test_g2_motion_offset.py 8932 $R/offset-FIX
run offset-OLD python3 -I $O/old/test_g2_motion_offset.py 8931 $R/offset-OLD
echo DONE >> $R/exit-codes.txt
