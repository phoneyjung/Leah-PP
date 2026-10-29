#!/usr/bin/env python3
# O13 option D visual simulation (Claude · 29 Oct 2569 · throwaway copy, never committed)
# Adds ONE cave-darkness hole when facing N, only if: ST.nh set + facing N + cave + holding (holdOn) + Glow+C on + lit (light layer ok, power > 0) + power hole > 0 (100/50)
# ST.nh = {cx, cy, k}: hole centre in sprite-cell art px (cell 96x96, feet [48,94]) and strength = power-table hole x k. Default = NH_DEFAULT (null = baseline).
# usage: python3 -I make_sim.py SRC_PAGE OUT_PAGE [cx,cy,k]
import sys
src, out = sys.argv[1], sys.argv[2]; dflt = sys.argv[3] if len(sys.argv) > 3 else None
b = open(src, encoding='utf-8').read()
def rep(a, c):
    global b
    assert b.count(a) == 1, a[:60]; b = b.replace(a, c)
nd = 'null' if not dflt else '{cx:%s,cy:%s,k:%s}' % tuple(dflt.split(','))
rep("const FX={};", "const NH_DEFAULT=%s;   // O13 SIM ONLY (throwaway copy)\nconst FX={};" % nd)
rep("    if(cOn){x.drawImage(FX.poolHole,",
    "    if(ST.nh&&d==='N'&&H&&ST.fx&&lit&&P_.hole>0){const a_=P_.hole*ST.nh.k;x.globalAlpha=a_;x.drawImage(FX.lhole,Math.round((sx-DX)/s)+ST.nh.cx-LHOLE.R,Math.round((sy-DY)/s)+ST.nh.cy-LHOLE.R);x.globalAlpha=1;ST.gmDraw.caveHole=a_;ST.gmDraw.nHole=true}   // O13 SIM ONLY\n    if(cOn){x.drawImage(FX.poolHole,")
rep("sync();boot();", "ST.nh=NH_DEFAULT;if(q.has('nh')){const v=q.get('nh').split(',').map(Number);ST.nh=v.length===3&&v.every(Number.isFinite)?{cx:v[0],cy:v[1],k:v[2]}:null}   // O13 SIM ONLY\nsync();boot();")
open(out, 'w', encoding='utf-8').write(b); print('written', out, 'default', nd)
