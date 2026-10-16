# G2.2b intake: PixelLab walk GIFs (Skeleton v3 Walking 6 frames, arm swing 0x) -> lossless 96x96 cells
# placement = same rule as c2-pilot-kid4-walk-src (lowest foot of the cycle on row 94; cycle-mean body centre rows 52-86 = locked static body centre)
# usage: python3 -I build_walkhold_src.py GIFDIR OUT_PNG OUT_JSON ZIP_SHA256
import sys, json, glob, hashlib, os, numpy as np
from PIL import Image, ImageSequence
GIFDIR, OUTP, OUTJ, ZIPSHA = sys.argv[1:5]
L8=['S','SE','E','NE','N','NW','W','SW']; names={'S':'south','SE':'south-east','E':'east','NE':'north-east','N':'north','NW':'north-west','W':'west','SW':'south-west'}
here=os.path.dirname(os.path.abspath(__file__))
walk_src=json.load(open(os.path.join(here,'c2-pilot-kid4-walk-src.json')))
sheet=np.zeros((8*96,6*96,4),np.uint8); per={}; anchor={}
for r,D in enumerate(L8):
    f=[p for p in glob.glob(os.path.join(GIFDIR,'*.gif')) if f'frames_{names[D]} (' in os.path.basename(p) or os.path.basename(p).endswith(f'frames_{names[D]}.gif')]
    assert len(f)==1,(D,f)
    raw=open(f[0],'rb').read(); g=Image.open(f[0])
    fr=[np.array(x.convert('RGBA')) for x in ImageSequence.Iterator(g)]; ms=[x.info.get('duration') for x in ImageSequence.Iterator(Image.open(f[0]))]
    assert len(fr)==6,(D,len(fr))
    for a in fr: assert not ((a[...,3]>0)&(a[...,3]<255)).any()
    op=[a[...,3]>0 for a in fr]
    low=max(int(np.where(o.any(1))[0].max()) for o in op); dy=94-low
    bx=[]
    for o in op:
        ys,xs=np.where(o); sel=(ys+dy>=52)&(ys+dy<=86); bx.append(float(xs[sel].mean()))
    static=walk_src['walk_anchor'][D]['static_body_x']; dx=round(static-float(np.mean(bx)))
    for k,a in enumerate(fr):
        ys,xs=np.where(op[k]); Y=ys+dy; X=xs+dx
        assert ((Y>=0)&(Y<96)&(X>=0)&(X<96)).all(),(D,k,'pixels outside cell')
        sheet[r*96+Y,k*96+X]=a[ys,xs]
    per[D]=dict(gif=os.path.basename(f[0]),sha256=hashlib.sha256(raw).hexdigest(),canvas=list(g.size),window_xy=[-dx,-dy],frames=6,gif_ms=ms)
    anchor[D]=dict(static_body_x=static,walkhold_mean_body_x=round(float(np.mean(bx))+dx,2),walkhold_f1_body_x=round(bx[0]+dx,2))
Image.fromarray(sheet,'RGBA').save(OUTP,optimize=True)
json.dump(dict(schema=1,file=os.path.basename(OUTP),cell=[96,96],rows=L8,cols=['f1','f2','f3','f4','f5','f6'],feet=[48,94],fps=10,ms_per_frame=100,
  source='PixelLab Add Animation · Template motion · Skeleton v3 · Walking (6 frames) · Motion settings: Arm swing 0x, Stride 1x, Advanced untouched (owner screenshot 16 Oct 14:54) · character _4 (88x88) · owner generated 16 Oct 2026 (E 16:0x trial, other 7 by 16:24) · downloaded as 8 GIFs (128x128)',
  placement=walk_src['placement'],zip_sha256=ZIPSHA,per_direction=per,walkhold_anchor=anchor,
  note='Raw PixelLab pixels, no scaling, no colour change. Not cleaned: Codex cleans per ASSET_SPEC_12 part D. Plan: G2_2B_LANTERN_HOLD_PLAN.md'),open(OUTJ,'w'),indent=1)
print('ok',OUTP)
