import sys, json, numpy as np
sys.path.insert(0,'g22')
from fist_track import cells_from_sheet
from PIL import Image
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
trk=json.load(open('g22/hold8/track_all.json'))
BOX={'S':('R',(26,66,38,80)),'SE':('R',(33,68,45,82)),'E':('R',(47,68,60,80)),'NE':('R',(58,64,70,78)),'NW':('L',(23,66,35,80)),'W':('L',(37,67,50,81)),'SW':('L',(50,68,62,82))}
def match(T,c,box,rx=8,ry=6):
    x0,y0,x1,y1=box; best=None
    for oy in range(-ry,ry+1):
        for ox in range(-rx,rx+1):
            if y0+oy<0 or y1+oy>96 or x0+ox<0 or x1+ox>96: continue
            P=c[y0+oy:y1+oy,x0+ox:x1+ox]; ta=T[...,3]>0; pa=P[...,3]>0
            m=int((ta!=pa).sum()+((ta&pa)&(np.abs(T[...,:3].astype(int)-P[...,:3].astype(int)).sum(-1)>0)).sum())
            if best is None or m<best[0]: best=(m,ox,oy)
    return best
def headx(c):
    ys,xs=np.where(c[...,3]>0); sel=(ys>=8)&(ys<=50); return float(xs[sel].mean()), int(ys.min())
out={}
for D,(h,box) in BOX.items():
    r=L8.index(D)
    walk=cells_from_sheet('wt_pilot/c2-pilot-kid4-walkhold-src.png',r,6) if D!='S' else cells_from_sheet('wt_pilot/c2-pilot-kid4-walk.png',r,6)
    idle=cells_from_sheet('wt_pilot/c2-pilot-kid4-idleanim.png',r,4)
    T=walk[0][box[1]:box[3],box[0]:box[2]]
    wa=[match(T,c,box) for c in walk]; ia=[match(T,c,box) for c in idle]
    wpos=[(o[1],o[2]) for o in wa]; ipos=[(o[1],o[2]) for o in ia]
    wh=[headx(c) for c in walk]; ih=[headx(c) for c in idle]
    M=[[max(abs(wpos[w][0]-ipos[i][0]),abs(wpos[w][1]-ipos[i][1])) for i in range(3)] for w in range(6)]
    H=[[round(abs(wh[w][0]-ih[i][0]),2) for i in range(3)] for w in range(6)]
    out[D]=dict(walk_fist_offset=wpos,idle_fist_offset=ipos,walk_mis=[o[0] for o in wa],idle_mis=[o[0] for o in ia],hand_jump=M,head_jump=H)
    f3=[M[w][2] for w in range(6)]
    best=[min(range(3),key=lambda i:(M[w][i],H[w][i])) for w in range(6)]
    print(D,'idle fist',ipos,'| walk fist',wpos,'| jump->f3',f3,'max',max(f3),'| best idle per walk frame',[(f'f{b+1}',M[w][b],H[w][b]) for w,b in enumerate(best)])
json.dump(out,open('g22/hold8/seam_same_method.json','w'),indent=1)
