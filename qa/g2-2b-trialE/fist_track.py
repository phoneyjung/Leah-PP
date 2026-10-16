# track a fist box across frames by exact-pixel template matching (alpha + RGB), report displacement
import sys, json, numpy as np
from PIL import Image, ImageSequence
def cells_from_gif(path,dx,dy):
    out=[]
    for f in ImageSequence.Iterator(Image.open(path)):
        c=Image.new('RGBA',(96,96),(0,0,0,0)); c.alpha_composite(f.convert('RGBA'),(dx,dy)); out.append(np.array(c))
    return out
def cells_from_sheet(path,row,n):
    a=np.array(Image.open(path).convert('RGBA')); return [a[row*96:(row+1)*96,k*96:(k+1)*96] for k in range(n)]
def track(cells,box,ref=0,rx=14,ry=8):
    x0,y0,x1,y1=box; T=cells[ref][y0:y1,x0:x1]; res=[]
    for c in cells:
        best=None
        for oy in range(-ry,ry+1):
            for ox in range(-rx,rx+1):
                if y0+oy<0 or y1+oy>96 or x0+ox<0 or x1+ox>96: continue
                P=c[y0+oy:y1+oy,x0+ox:x1+ox]
                ta=T[...,3]>0; pa=P[...,3]>0
                mism=int((ta!=pa).sum()+((ta&pa)&(np.abs(T[...,:3].astype(int)-P[...,:3].astype(int)).sum(-1)>0)).sum())
                if best is None or mism<best[0]: best=(mism,ox,oy)
        res.append(best)
    return res
if __name__=='__main__':
    pass
