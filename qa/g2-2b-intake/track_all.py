import sys,json; sys.path.insert(0,'g22'); sys.path.insert(0,'g22/hold8')
from sheet import newcells, L8
from fist_track import track, cells_from_sheet
import numpy as np
BOX={'S':{'R':((32,74),(26,66,38,80)),'L':((65,74),(59,66,71,80))},
     'SE':{'R':((39,76),(33,68,45,82)),'L':((66,72),(60,64,72,78))},
     'E':{'R':((56,76),(47,68,60,80))},
     'NE':{'R':((64,73),(58,64,70,78))},
     'N':{},
     'NW':{'L':((29,74),(23,66,35,80))},
     'W':{'L':((44,75),(37,67,50,81))},
     'SW':{'L':((56,76),(50,68,62,82)),'R':((28,71),(22,64,34,76))}}
out={}
for D in L8:
    cs=newcells(D); out[D]={}
    for hand,(a,box) in BOX[D].items():
        t=track(cs,box)
        pts=[[a[0]+o[1],a[1]+o[2]] for o in t]
        tsize=(box[2]-box[0])*(box[3]-box[1])
        out[D][hand]=dict(anchor=pts,mismatch=[o[0] for o in t],box_px=tsize,
            x_range=max(p[0] for p in pts)-min(p[0] for p in pts),y_range=max(p[1] for p in pts)-min(p[1] for p in pts),
            max_adj=max(max(abs(a_[0]-b_[0]),abs(a_[1]-b_[1])) for a_,b_ in zip(pts,pts[1:]+pts[:1])))
    # body metrics new vs old raw
    old=cells_from_sheet('wt_pilot/c2-pilot-kid4-walk-src.png',L8.index(D),6)
    def body(cells):
        tops=[];bots=[];cx=[]
        for c in cells:
            ys,xs=np.where(c[...,3]>0); tops.append(int(ys.min())); bots.append(int(ys.max()))
            sel=(ys>=52)&(ys<=86); cx.append(round(float(xs[sel].mean()),2))
        return dict(top=tops,bottom=bots,body_cx=cx,sway=round(max(cx)-min(cx),2),bob=max(tops)-min(tops))
    out[D]['body_new']=body(cs); out[D]['body_old']=body(old)
json.dump(out,open('g22/hold8/track_all.json','w'),indent=1)
for D in L8:
    s=' '.join(f"{h}: x{v['x_range']} y{v['y_range']} adj{v['max_adj']} mis{max(v['mismatch'])}/{v['box_px']} {v['anchor']}" for h,v in out[D].items() if h in('R','L'))
    bn,bo=out[D]['body_new'],out[D]['body_old']
    print(D,s,'| sway new',bn['sway'],'old',bo['sway'],'bob new',bn['bob'],'old',bo['bob'],'bottom new',bn['bottom'],'old',bo['bottom'])
