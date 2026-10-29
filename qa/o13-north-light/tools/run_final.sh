#!/bin/bash
# O13 A final run (after the independent review fixes): every suite once, one after another
# NEW = WT on 8970 · OLD = 62f93a9 on 8961 · SIM = 62f93a9 + make_sim.py on 8962 · PREO3 = 4c938cc on 8964
WT=/tmp/claude-0/-home-claude-leah-pp/d3d34840-5e4e-52a0-a344-341c2cb1b80f/scratchpad/wt_pilot
B=/tmp/claude-0/-home-claude/d3d34840-5e4e-52a0-a344-341c2cb1b80f/scratchpad/o13real
O=$B/out/final; mkdir -p $O; cd /tmp
run(){ local tag=$1; shift; echo "== $tag: $*" >> $O/exit-codes.txt; "$@" > $O/$tag.log 2>&1; local e=$?; echo "$tag exit=$e" >> $O/exit-codes.txt; }
: > $O/exit-codes.txt
for p in 8961 8962 8964 8970; do echo "port $p page sha256 $(curl -s http://127.0.0.1:$p/pilot-g2-motion.html | sha256sum | cut -c1-16)" >> $O/exit-codes.txt; done
run north-NEW         python3 -I $WT/test_g2_north_light.py 8970 $O/north-NEW 8961 8962
run lantern-v24-NEW   python3 -I $WT/test_g2_lantern_gm.py 8970 $O/lantern-v24-NEW 8961
run hold-NEW          python3 -I $WT/test_g2_hold.py 8970 $O/hold-NEW gm
run offset-NEW        python3 -I $WT/test_g2_motion_offset.py 8970 $O/offset-NEW
run o3v3-PREO3vsNEW   python3 -I $WT/qa/o3-small-canvas/tools/test_o3_small_canvas.py 8964 8970 $O/o3v3
run cpool-OLDvsNEW    python3 -I $WT/qa/g2-5a-cpool/tools/test_cpool.py 8961 8970 $O/cpool.json
run shots-NEW         python3 -I $B/shots.py 8970 $O/shots
echo DONE >> $O/exit-codes.txt
