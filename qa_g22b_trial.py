# G2.2b step 3: measure one PixelLab walk GIF (low arm swing) against the locked walk (same method on both).
# usage: python3 -I qa_g22b_trial.py WT DIR GIF OUTDIR   (self-test: a GIF rebuilt from walk-src.png row reproduces head diff 0, new colours 0, pass_hand False for E)
import sys, json, numpy as np
from PIL import Image, ImageSequence, ImageDraw
from scipy import ndimage as nd
WT, D, GIF, OUT = sys.argv[1:5]
L8=['S','SE','E','NE','N','NW','W','SW']; C=96; r=L8.index(D)
src=json.load(open(f'{WT}/c2-pilot-kid4-walk-src.json'))
static_x=src['walk_anchor'][D]['static_body_x']
g=Image.open(GIF); fr=[]; ms=[]
for f in ImageSequence.Iterator(g):
    fr.append(np.array(f.convert('RGBA'))); ms.append(f.info.get('duration'))
fr=np.stack(fr); fr[...,3]=np.where(fr[...,3]>0,255,0)
n,H,W,_=fr.shape
op=fr[...,3]>0
ys=np.where(op.any(axis=(0,2)))[0]; low=int(ys.max())
dy=94-low
# cycle-mean body centre rows 52-86 after dy
bx=[]
for k in range(n):
    yy,xx=np.where(op[k]); sel=(yy+dy>=52)&(yy+dy<=86); bx.append(xx[sel].mean())
dx=round(static_x-float(np.mean(bx)))
cells=np.zeros((n,C,C,4),np.uint8)
for k in range(n):
    yy,xx=np.where(op[k]); Y=yy+dy; X=xx+dx
    ok=(Y>=0)&(Y<C)&(X>=0)&(X<C)
    lost=int((~ok).sum())
    cells[k,Y[ok],X[ok]]=fr[k,yy[ok],xx[ok]]
# palettes from locked files
def cols(img): a=np.array(img.convert('RGBA')).reshape(-1,4); return {tuple(p[:3]) for p in a if p[3]}
locked=cols(Image.open(f'{WT}/c2-pilot-kid4-walk-src.png'))|cols(Image.open(f'{WT}/c2-pilot-kid4-walk.png'))|cols(Image.open(f'{WT}/c2-pilot-kid4-idleanim.png'))
W_=np.array(Image.open(f'{WT}/c2-pilot-kid4-walk.png').convert('RGBA')); WM=np.array(Image.open(f'{WT}/c2-pilot-kid4-walk-mask.png').convert('RGBA'))
# skin colours = colours used as ID 3 in >=85% of their locked uses and >=100 px (PixelLab shares colours across materials)
from collections import defaultdict
use=defaultdict(lambda:defaultdict(int))
for fn in ['walk','idleanim']:
    I_=np.array(Image.open(f'{WT}/c2-pilot-kid4-{fn}.png').convert('RGBA')); M_=np.array(Image.open(f'{WT}/c2-pilot-kid4-{fn}-mask.png').convert('RGBA'))
    o=I_[...,3]>0
    for c,i in zip(map(tuple,I_[o][:,:3]),M_[o][:,0]): use[tuple(int(v) for v in c)][int(i)]+=1
skin={c for c,v in use.items() if v.get(3,0)>=100 and v.get(3,0)/sum(v.values())>=0.85}
newc={}
for k in range(n):
    for p in cells[k][cells[k][...,3]>0][:,:3]:
        t=tuple(int(v) for v in p)
        if t not in locked: newc[t]=newc.get(t,0)+1
def fists(cell):
    sk=np.zeros(cell.shape[:2],bool)
    for yy in range(60,C):
        for xx in range(C):
            if cell[yy,xx,3] and tuple(int(v) for v in cell[yy,xx,:3]) in skin: sk[yy,xx]=True
    lab,m=nd.label(nd.binary_dilation(sk,iterations=2),structure=np.ones((3,3))); out=[]
    for i in range(1,m+1):
        yy,xx=np.where((lab==i)&sk)
        if len(xx)>=2: out.append((float(xx.mean()),float(yy.mean()),len(xx)))
    return out
track=[]; prev=None
for k in range(n):
    c=fists(cells[k])
    if not c: track.append(None); continue
    p=max(c,key=lambda q:(q[2],q[1])) if prev is None else min(c,key=lambda q:(q[0]-prev[0])**2+(q[1]-prev[1])**2)
    prev=p; track.append([round(p[0]),round(p[1])])
vis=[t for t in track if t]
# baseline: same method on the locked raw walk (walk-src.png) of this direction
WS=np.array(Image.open(f'{WT}/c2-pilot-kid4-walk-src.png').convert('RGBA'))[r*C:(r+1)*C]
bt=[];bp=None
for k in range(6):
    c=fists(WS[:,k*C:(k+1)*C])
    if not c: bt.append(None); continue
    q=max(c,key=lambda q:(q[2],q[1])) if bp is None else min(c,key=lambda q:(q[0]-bp[0])**2+(q[1]-bp[1])**2)
    bp=q; bt.append([round(q[0]),round(q[1])])
bv=[t for t in bt if t]
baseline=dict(near_hand=bt,visible=f'{len(bv)}/6',x_range=(max(v[0] for v in bv)-min(v[0] for v in bv)) if bv else None,y_range=(max(v[1] for v in bv)-min(v[1] for v in bv)) if bv else None)
jumps=[max(abs(a[0]-b[0]),abs(a[1]-b[1])) for a,b in zip(track,track[1:]+track[:1]) if a and b]
# locked walk same direction for comparison
LW=np.array(Image.open(f'{WT}/c2-pilot-kid4-walk.png').convert('RGBA'))[r*C:(r+1)*C]
head_diff=[]
for k in range(min(n,6)):
    a=cells[k][:52]; best=None
    for sx in range(-3,4):
        for sy in range(-3,4):
            b=np.roll(np.roll(WS[:52,k*C:(k+1)*C],sy,0),sx,1)
            d=int(((a[...,3]>0)!=(b[...,3]>0)).sum()+((a[...,3]>0)&(b[...,3]>0)&(np.abs(a[...,:3].astype(int)-b[...,:3].astype(int)).sum(-1)>0)).sum())
            if best is None or d<best[0]: best=(d,sx,sy)
    head_diff.append(best)
rep=dict(direction=D,gif=GIF,frames=n,gif_ms=ms,canvas=[W,H],placement_dxdy=[dx,dy],pixels_lost_outside_cell=lost,
  lowest_row=94,new_colours_not_in_locked=len(newc),new_colour_pixels=sum(newc.values()),
  near_hand=track,visible=f'{len(vis)}/{n}',
  x_range=(max(v[0] for v in vis)-min(v[0] for v in vis)) if vis else None,
  y_range=(max(v[1] for v in vis)-min(v[1] for v in vis)) if vis else None,
  max_adjacent_jump=max(jumps) if jumps else None,
  head_rows0_51_diff_vs_raw_walk_best_shift=head_diff,
  baseline_locked_walk_same_method=baseline,
  pass_hand=bool(vis and len(vis)==n and (max(v[0] for v in vis)-min(v[0] for v in vis))<=4 and (max(v[1] for v in vis)-min(v[1] for v in vis))<=3 and max(jumps)<=3))
json.dump(rep,open(f'{OUT}/trial-{D}.json','w'),indent=1); print(json.dumps(rep))
# side-by-side GIF with stand-in lantern: locked walk | trial
lan=Image.open(f'{WT}/kid-lantern.png').convert('RGBA').crop((r*32,0,(r+1)*32,32))
mock=json.load(open(f'{WT}/qa/g2-2b-plan/mock.json'))['anchors']['walk'][D]
SC=4; frames=[]
for k in range(n):
    can=Image.new('RGBA',(2*C,C),(28,26,40,255))
    for i,(cell,p) in enumerate([(Image.fromarray(LW[:,(k%6)*C:((k%6)+1)*C]),mock[k%6]),(Image.fromarray(cells[k]),track[k])]):
        b=Image.new('RGBA',(C,C),(0,0,0,0)); b.alpha_composite(cell)
        if p: b.alpha_composite(lan,(p[0]-16,p[1]-6))
        ImageDraw.Draw(b).line([(24,94),(72,94)],fill=(110,200,110,255)); can.alpha_composite(b,(i*C,0))
    frames.append(can.resize((2*C*SC,C*SC),Image.NEAREST).convert('P',palette=Image.ADAPTIVE))
frames[0].save(f'{OUT}/trial-{D}-vs-locked.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
