# G2.2b · Claude: hand (fist) anchors for idle_hold (= locked idle C+A) and walk_hold (part D) from the material masks.
# fist pixels = skin (ID 3) at rows >= 60 + leather (ID 7) within 2 px (Chebyshev) of that skin  (plan section 5)
# hold hand = D-HAND (owner 16 Oct): S SE E NE right hand · SW W NW left hand · N none (hidden under the cape)
# the hold-hand component is the fist component nearest to the expected point (<= 9 px); a frame without finger skin
# falls back to exact-pixel template tracking of the fist box from the nearest frame that has one (measured, not guessed)
# usage: python3 -I build_hand_anchors.py IDLE_PNG IDLE_MASK WALKHOLD_PNG WALKHOLD_MASK OUT_JSON
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as nd
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
HAND={'S':'R','SE':'R','E':'R','NE':'R','N':None,'NW':'L','W':'L','SW':'L'}
EXPECT={'S':(32,75),'SE':(39,76),'E':(55,76),'NE':(63,74),'NW':(30,75),'W':(44,75),'SW':(56,76)}
def load(p): return np.array(Image.open(p).convert('RGBA'))
def fists(m):
    sk=(m[...,0]==3)&(m[...,3]>0); sk[:60]=False
    near=nd.binary_dilation(sk,structure=np.ones((5,5)))
    f=sk|(near&(m[...,0]==7)&(m[...,3]>0))
    lab,n=nd.label(f,structure=np.ones((3,3))); out=[]
    for i in range(1,n+1):
        ys,xs=np.where(lab==i)
        if (sk&(lab==i)).any(): out.append(dict(px=[(int(x),int(y)) for x,y in zip(xs,ys)],c=(float(xs.mean()),float(ys.mean()))))
    return out
def track(cell_ref,cell,box):
    x0,y0,x1,y1=box; T=cell_ref[y0:y1,x0:x1]; best=None
    for oy in range(-6,7):
        for ox in range(-8,9):
            if y0+oy<0 or y1+oy>96 or x0+ox<0 or x1+ox>96: continue
            P=cell[y0+oy:y1+oy,x0+ox:x1+ox]; ta=T[...,3]>0; pa=P[...,3]>0
            m=int((ta!=pa).sum()+((ta&pa)&(np.abs(T[...,:3].astype(int)-P[...,:3].astype(int)).sum(-1)>0)).sum())
            if best is None or m<best[0]: best=(m,ox,oy)
    return best
def anchors(spr,msk,nf):
    res={}
    for r,D in enumerate(L8):
        if HAND[D] is None: res[D]=[dict(hand=None,anchor=None,why='hand hidden under the cape (D-HAND: N draws no lantern)') for _ in range(nf)]; continue
        ex=EXPECT[D]; rows=[]
        for k in range(nf):
            m=msk[r*C:(r+1)*C,k*C:(k+1)*C]; cand=fists(m)
            cand=[c for c in cand if max(abs(c['c'][0]-ex[0]),abs(c['c'][1]-ex[1]))<=9]
            if cand:
                c=min(cand,key=lambda c:(c['c'][0]-ex[0])**2+(c['c'][1]-ex[1])**2)
                a=(int(round(c['c'][0])),int(round(c['c'][1])))
                pxs=set(c['px'])
                if a not in pxs: a=min(pxs,key=lambda p:(p[0]-c['c'][0])**2+(p[1]-c['c'][1])**2)
                rows.append(dict(hand=HAND[D],anchor=list(a),fist_px=len(pxs),method='mask'))
            else: rows.append(None)
        for k in range(nf):
            if rows[k] is None:
                ref=min([j for j in range(nf) if rows[j]],key=lambda j:abs(j-k))
                ax,ay=rows[ref]['anchor']; box=(ax-6,ay-6,ax+7,ay+5)
                cr=spr[r*C:(r+1)*C,ref*C:(ref+1)*C]; ck=spr[r*C:(r+1)*C,k*C:(k+1)*C]
                mis,ox,oy=track(cr,ck,box); a=[ax+ox,ay+oy]
                mk=msk[r*C:(r+1)*C,k*C:(k+1)*C][a[1],a[0]]
                rows[k]=dict(hand=HAND[D],anchor=a,fist_px=None,method=f'template from f{ref+1} (mismatch {mis})',on_hand_px=bool(mk[3]>0 and mk[0] in (3,7)))
        res[D]=rows
    return res
IP,IM,WP,WM,OUT=sys.argv[1:6]
I,IMk,W,WMk=load(IP),load(IM),load(WP),load(WM)
idle=anchors(I,IMk,4); walk=anchors(W,WMk,6)
def rng(rows):
    a=[r['anchor'] for r in rows if r['anchor']]
    if not a: return None
    xs=[p[0] for p in a]; ys=[p[1] for p in a]
    adj=max(max(abs(p[0]-q[0]),abs(p[1]-q[1])) for p,q in zip(a,a[1:]+a[:1]))
    return dict(x=max(xs)-min(xs),y=max(ys)-min(ys),adjacent=adj)
summary={}
for D in L8:
    if HAND[D] is None: summary[D]=None; continue
    wa=[r['anchor'] for r in walk[D]]; ia=[r['anchor'] for r in idle[D]]
    J=[[max(abs(w[0]-i[0]),abs(w[1]-i[1])) for i in ia[:3]] for w in wa]
    summary[D]=dict(walk=rng(walk[D]),idle=rng(idle[D]),stop_into_f3=[row[2] for row in J],stop_into_best=[min(row) for row in J],
                    best_entry=[ 'f%d'%(row.index(min(row))+1) for row in J],start_from_idle_max=max(max(abs(wa[0][0]-i[0]),abs(wa[0][1]-i[1])) for i in ia[:3]),
                    L_max=92-max(p[1] for p in wa+ia))
json.dump(dict(schema=1,rule=open(__file__).read().split('\n')[1:6],hand_rule=HAND,idle_hold=idle,walk_hold=walk,summary=summary),open(OUT,'w'),indent=1)
for D in L8: print(D,summary[D])
