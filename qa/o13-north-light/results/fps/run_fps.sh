#!/bin/bash
# O13 A paired FPS remeasurement · follows PROTOCOL.txt in this folder (written before the run)
S=/tmp/claude-0/-home-claude/d3d34840-5e4e-52a0-a344-341c2cb1b80f/scratchpad; F=$S/o13real/fps; L=$F/runs.tsv; cd /tmp
OLDT=$S/o13sim/orig; CANDT=/tmp/claude-0/-home-claude-leah-pp/d3d34840-5e4e-52a0-a344-341c2cb1b80f/scratchpad/wt_pilot
{ echo "servers: old=$(curl -s http://127.0.0.1:8961/pilot-g2-motion.html | sha256sum | cut -c1-16) cand=$(curl -s http://127.0.0.1:8970/pilot-g2-motion.html | sha256sum | cut -c1-16)"; echo "protocol: $(sha256sum $F/PROTOCOL.txt | cut -c1-16) set2: $(sha256sum $F/PROTOCOL_SET2.txt | cut -c1-16)"; } > $F/env.txt
printf "test\tpair\tslot\tpage\tstart_utc\tend_utc\tload_before\tload_after\texit\tOFF\tON\tratio\ttest_pass\tfailed_checks\n" > $L
measure(){ # test pair slot page
  local test=$1 pair=$2 slot=$3 page=$4 port out dir
  [ $page = OLD ] && { port=8961; dir=$OLDT; } || { port=8970; dir=$CANDT; }
  out=$F/raw/$test-p$pair-$slot-$page; mkdir -p $out
  sleep 15
  local lb=$(cut -d' ' -f1-3 /proc/loadavg) t0=$(date -u +%FT%TZ)
  ps -eo pcpu,cmd --sort=-pcpu | head -6 | cut -c1-120 > $out/top-before.txt
  if [ $test = G11 ]; then python3 -I $dir/test_g2_lantern_gm.py $port $out 8961 > $out/run.log 2>&1
  else python3 -I $dir/test_g2_hold.py $port $out gm > $out/run.log 2>&1; fi
  local e=$? t1=$(date -u +%FT%TZ) la=$(cut -d' ' -f1-3 /proc/loadavg)
  local row; row=$(python3 -I - "$test" "$out" <<'EOF'
import json,sys,glob
test,out=sys.argv[1:3]
f=glob.glob(out+('/gm-lantern-test.json' if test=='G11' else '/hold-test.json'))
if not f: print('NA\tNA\tNA\tNA\tno json'); sys.exit(3)
d=json.load(open(f[0])); ch=d['checks']
if test=='G11':
    c=[c for c in ch if c['check'].startswith('G11')][0]; off,on=c['value']['median']
else:
    c=[c for c in ch if c['check'].startswith('9 ')][0]; off,on=c['value']['raf_cpu4x_median5']
fails=[x['check'].split(' ')[0] for x in ch if not x['pass']]
print('%s\t%s\t%.1f\t%s\t%s' % (off,on,on/off*100,c['pass'],','.join(fails) or '-'))
EOF
); local pe=$?
  printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" $test $pair $slot $page $t0 $t1 "$lb" "$la" $e "$row" >> $L
  if [ $pe -ne 0 ] || { [ $e -ne 0 ] && [ $e -ne 1 ]; }; then echo "STOP: $test pair $pair $page exit=$e parse=$pe" >> $L; return 1; fi
  return 0
}
ok=1
for test in G11; do   # set 2: G11 only (PROTOCOL_SET2.txt)
  for pair in 1 2 3 4 5; do
    if [ $((pair % 2)) -eq 1 ]; then A=OLD; B=CAND; else A=CAND; B=OLD; fi
    measure $test $pair 1 $A || { ok=0; break 2; }
    measure $test $pair 2 $B || { ok=0; break 2; }
  done
done
[ $ok = 1 ] && echo "DONE all 10 (set 2)" >> $L || echo "ENDED EARLY" >> $L
