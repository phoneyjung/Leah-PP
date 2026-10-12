"""Rebuild owner overview from current native production layers, nearest 4x."""
from pathlib import Path
import json
from PIL import Image
R=Path(__file__).resolve().parent

def rebuild():
    j=json.loads((R/'kid8.json').read_text());ims={p['file']:Image.open(R/p['file']).convert('RGBA') for p in j['parts']}
    def comp(h,b,e=None,m=None):
        df=j['defaults']['f' if b<=4 else 'm'];e=df['eyes'] if e is None else e;m=df['mouth'] if m is None else m
        out=Image.new('RGBA',(512,64))
        for p in j['layerOrder']:
            n=h if p in ('hair','hairback') else b if p=='body' else e if p=='eyes' else m if p=='mouth' else 1
            out=Image.alpha_composite(out,ims[f'kid8-{p}-{n}.png'])
        return out
    ec=max(p['option'] for p in j['parts'] if p['part']=='eyes');mc=max(p['option'] for p in j['parts'] if p['part']=='mouth')
    er=(ec+7)//8;mr=(mc+7)//8;out=Image.new('RGBA',(512,(24+er+mr)*64),(66,74,82,255))
    for h in range(1,17):out.alpha_composite(comp(h,1 if h<=8 else 5),(0,(h-1)*64))
    for b in range(1,9):out.alpha_composite(comp(1 if b<=4 else 9,b),(0,(15+b)*64))
    for k in range(ec):out.alpha_composite(comp(6,1,e=k+1).crop((0,0,64,64)),((k%8)*64,(24+k//8)*64))
    for k in range(mc):out.alpha_composite(comp(6,1,m=k+1).crop((0,0,64,64)),((k%8)*64,(24+er+k//8)*64))
    out.convert('RGB').resize((2048,out.height*4),Image.Resampling.NEAREST).save(R/'kid8-preview.png',optimize=True)
if __name__=='__main__':rebuild()
from asset_png_lossless import optimize
optimize(R/'kid8-preview.png')
