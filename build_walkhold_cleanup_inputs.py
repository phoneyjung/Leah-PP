# G2.2b · Claude: cleanup inputs for ASSET_SPEC_12 part D (walk_hold) from c2-pilot-kid4-walkhold-src.png
#  - holes: enclosed transparent groups (4-neighbour flood from the cell border) per frame
#  - strap (SE, SW; S listed for reference): maroon band rule used for the idle (ASSET_SPEC_12 4.1):
#    strap_px = maroon pixels (R-G>=40, 70<=R<=175, B<R) in rows 58-62 forming the largest 8-connected band;
#    keep_px = other maroon pixels inside the band box +-1; rows <=57 brooch/rim keep; rows >=63 belt keep
# usage: python3 -I build_walkhold_cleanup_inputs.py SRC_PNG HOLES_JSON STRAP_JSON MARKS_PNG
import sys, json, numpy as np
from collections import deque
from PIL import Image, ImageDraw
from scipy import ndimage as nd
SRC, HOJ, STJ, MARK = sys.argv[1:5]
L8=['S','SE','E','NE','N','NW','W','SW']; C=96; N4=((1,0),(-1,0),(0,1),(0,-1))
A=np.array(Image.open(SRC).convert('RGBA'))
def cell(D,k): r=L8.index(D); return A[r*C:(r+1)*C,k*C:(k+1)*C]
def holes(c):
    t=c[...,3]==0; seen=np.zeros_like(t); out=[]
    for y0,x0 in zip(*np.nonzero(t)):
        if seen[y0,x0]: continue
        dq=deque([(y0,x0)]); seen[y0,x0]=True; pts=[]; edge=False
        while dq:
            y,x=dq.popleft(); pts.append([int(x),int(y)]); edge|=x in (0,C-1) or y in (0,C-1)
            for dx,dy in N4:
                yy,xx=y+dy,x+dx
                if 0<=yy<C and 0<=xx<C and t[yy,xx] and not seen[yy,xx]: seen[yy,xx]=True; dq.append((yy,xx))
        if not edge: out.append({'px':len(pts),'pts':sorted(pts)})
    return out
H={}
for D in L8:
    for k in range(6):
        h=holes(cell(D,k))
        if h: H[f'{D} f{k+1}']=h
sizes=[g['px'] for v in H.values() for g in v]
json.dump(dict(schema=1,file='c2-pilot-kid4-walkhold-src.png',coords='x,y inside each 96x96 cell (row = direction, col = frame)',
  rule='fill every hole of 1-3 px; holes > 3 px are listed with a Claude decision in ASSET_SPEC_12 part D',
  summary=dict(groups=len(sizes),px=sum(sizes),by_size={str(s):sizes.count(s) for s in sorted(set(sizes))}),holes=H),open(HOJ,'w'),indent=1)
def maroon(p): R,G,B=int(p[0]),int(p[1]),int(p[2]); return p[3]>0 and R-G>=40 and 70<=R<=175 and B<R
F={}
for D in ['S','SE','SW']:
    for k in range(6):
        c=cell(D,k); mm=np.zeros((C,C),bool)
        for y in range(58,63):
            for x in range(30,66):
                if maroon(c[y,x]): mm[y,x]=True
        lab,n=nd.label(mm,structure=np.ones((3,3)))
        big=max(range(1,n+1),key=lambda i:(lab==i).sum())
        band=sorted([[int(x),int(y)] for y,x in zip(*np.where(lab==big))])
        x0=min(p[0] for p in band)-1; y0=58; x1=max(p[0] for p in band)+1; y1=max(p[1] for p in band)+1
        keep=sorted([[int(x),int(y)] for y in range(y0,y1+1) for x in range(x0,x1+1) if maroon(c[y,x]) and [x,y] not in band])
        F[f'{D} f{k+1}']=dict(strap_px=band,keep_px=keep,box_x0y0x1y1=[x0,y0,x1,y1],n=len(band))
json.dump(dict(schema=1,file='c2-pilot-kid4-walkhold-src.png',method='maroon band rule (same as the idle, ASSET_SPEC_12 4.1): strap_px = maroon pixels (R-G>=40, 70<=R<=175, B<R) in rows 58-62 forming the largest 8-connected band; keep_px = other maroon pixels inside the band box; rows <=57 brooch/rim keep; rows >=63 belt keep; box = band columns +-1, rows 58..band bottom +1',
  use='SE and SW are cleaned (part D). S row is listed for reference only: S uses the locked walk (ASSET_SPEC_12 part B) and is not cleaned again.',
  no_strap_expected=['E','NE','N','NW','W'],frames=F),open(STJ,'w'),indent=1)
# marks image: S SE SW x 6 frames, 10x, crop x 28..68, y 50..68
S=10; X0,Y0,X1,Y1=28,50,68,68
im=Image.new('RGBA',(6*(X1-X0)*S+50,3*(Y1-Y0)*S+20),(40,38,56,255))
for i,D in enumerate(['S','SE','SW']):
    for k in range(6):
        c=Image.fromarray(np.ascontiguousarray(cell(D,k))).crop((X0,Y0,X1,Y1)).resize(((X1-X0)*S,(Y1-Y0)*S),Image.NEAREST); d=ImageDraw.Draw(c)
        f=F[f'{D} f{k+1}']; bx=f['box_x0y0x1y1']
        d.rectangle([(bx[0]-X0)*S,(bx[1]-Y0)*S,(bx[2]-X0+1)*S-1,(bx[3]-Y0+1)*S-1],outline=(255,40,40,255),width=2)
        for x,y in f['strap_px']: d.ellipse([(x-X0)*S+3,(y-Y0)*S+3,(x-X0)*S+7,(y-Y0)*S+7],fill=(255,230,0,255))
        for x,y in f['keep_px']: d.ellipse([(x-X0)*S+2,(y-Y0)*S+2,(x-X0)*S+8,(y-Y0)*S+8],outline=(80,200,255,255),width=2)
        im.alpha_composite(c,(k*((X1-X0)*S+10),i*((Y1-Y0)*S+10)))
im.save(MARK); print('holes',dict(groups=len(sizes),px=sum(sizes)),{k:v['n'] for k,v in F.items()})
