# G2.2b feasibility mock (scratch only, not a deliverable):
# hang the existing Set-08 L0 lantern on the visible fist of the LOCKED idle/walk frames.
# Fist = skin (mask ID 3) pixels below row 60, grouped; near-camera hand rule.
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
WT, OUT = sys.argv[1], sys.argv[2]
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
lan=Image.open(f'{WT}/kid-lantern.png').convert('RGBA')
RING=(16,6)  # ring centre in the 32x32 lantern cell (grip top is (16,4))
def fists(mask_cell):
    sk=(mask_cell[...,0]==3)&(mask_cell[...,3]>0); sk[:60]=False
    # merge pixels within 4 px into one fist
    lab,n=nd.label(nd.binary_dilation(sk,iterations=2),structure=np.ones((3,3)))
    out=[]
    for i in range(1,n+1):
        ys,xs=np.where((lab==i)&sk)
        if len(xs): out.append((float(xs.mean()),float(ys.mean()),len(xs)))
    return out
def pick(cands, prev, D):
    if not cands: return None
    if prev is None:
        if D=='S': return min(cands,key=lambda c:c[0])          # character's right hand = screen left
        return max(cands,key=lambda c:(c[1],c[2]))                # nearest camera = lowest on screen
    return min(cands,key=lambda c:(c[0]-prev[0])**2+(c[1]-prev[1])**2)
res={}
for anim,nf,fn in [('idle',4,'idleanim'),('walk',6,'walk')]:
    S=Image.open(f'{WT}/c2-pilot-kid4-{fn}.png').convert('RGBA')
    M=np.array(Image.open(f'{WT}/c2-pilot-kid4-{fn}-mask.png').convert('RGBA'))
    res[anim]={}
    for r,D in enumerate(L8):
        prev=None; rows=[]
        for f in range(nf):
            c=pick(fists(M[r*C:(r+1)*C,f*C:(f+1)*C]),prev,D)
            if c: prev=c
            rows.append(None if c is None else [round(c[0]),round(c[1])])
        res[anim][D]=rows
def stats(rows):
    v=[p for p in rows if p]
    if not v: return dict(visible=0)
    xs=[p[0] for p in v]; ys=[p[1] for p in v]
    bottom=max(ys)-RING[1]+25   # lantern last opaque row 25 in its cell
    return dict(visible=len(v),x_range=max(xs)-min(xs),y_range=max(ys)-min(ys),lantern_bottom_max=bottom,below_feet_rows=max(0,bottom-94))
summary={a:{D:stats(res[a][D]) for D in L8} for a in res}
json.dump(dict(anchors=res,summary=summary,note='MOCK ONLY: skin-pixel fist, not the G2.2b anchor method'),open(f'{OUT}/mock.json','w'),indent=1)
for a in summary:
    print(a); [print(' ',D,summary[a][D]) for D in L8]
# render GIFs: 8 directions side by side, dark cave bg, x3
SC=3
def frame(anim,fn,nf,f,bg):
    S=Image.open(f'{WT}/c2-pilot-kid4-{fn}.png').convert('RGBA')
    can=Image.new('RGBA',(8*C,C),bg)
    for r,D in enumerate(L8):
        cell=S.crop((f*C,r*C,(f+1)*C,(r+1)*C))
        p=res[anim][D][f]
        L=lan.crop((r*32,0,(r+1)*32,32))
        layer=Image.new('RGBA',(C,C),(0,0,0,0))
        back = D in ('N','NW','W','SW')
        if p: 
            pos=(p[0]-RING[0],p[1]-RING[1])
        if p and back: layer.alpha_composite(L,pos)
        layer.alpha_composite(cell)
        if p and not back: layer.alpha_composite(L,pos)
        d=ImageDraw.Draw(layer); d.line([(30,94),(66,94)],fill=(120,200,120,255))  # feet row 94
        can.alpha_composite(layer,(r*C,0))
    return can.resize((8*C*SC,C*SC),Image.NEAREST)
for anim,fn,nf,ms in [('idle','idleanim',4,200),('walk','walk',6,100)]:
    for bgname,bg in [('dark',(28,26,40,255)),('light',(205,214,190,255))]:
        seq=[0,1,2,1] if anim=='idle' else list(range(6))
        fr=[frame(anim,fn,nf,f,bg).convert('P',palette=Image.ADAPTIVE) for f in seq]
        fr[0].save(f'{OUT}/mock-{anim}-{bgname}.gif',save_all=True,append_images=fr[1:],duration=ms,loop=0,disposal=2)
    frame(anim,fn,nf,0,(28,26,40,255)).save(f'{OUT}/mock-{anim}-f1.png')
