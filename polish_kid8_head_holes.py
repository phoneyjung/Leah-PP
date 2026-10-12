"""Spec14 head-hole repair: only native hairback pixels and hair regions change."""
from pathlib import Path
import json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
R=Path(__file__).resolve().parent
CROSS=ndi.generate_binary_structure(2,1)
def head_holes(alpha,face):
    enclosed=ndi.binary_fill_holes(alpha,structure=CROSS)&~alpha
    touch=ndi.binary_dilation(face,structure=CROSS)
    result=enclosed&touch;result[28:]=False
    return result

def runs(m):
    out=[]
    for y,row in enumerate(m):
        edges=np.diff(np.r_[False,row,False].astype(int));out.extend([y,int(a),int(b-a)] for a,b in zip(np.where(edges==1)[0],np.where(edges==-1)[0]))
    return out

def repair():
    j=json.loads((R/'kid8.json').read_text());q=json.loads((R/'kid8-qa.json').read_text())
    ims={p['file']:np.array(Image.open(R/p['file']).convert('RGBA')) for p in j['parts']}
    face=ims['kid8-face-1.png'][:,:,3]>0;totals=[];patches={}
    for h in range(1,17):
        file=f'kid8-hairback-{h}.png';back=ims[file];front=ims[f'kid8-hair-{h}.png'];before=0;repairmask=np.zeros((64,512),bool)
        for b in range(1,9):
            alpha=(back[:,:,3]>0)|(front[:,:,3]>0)|face|(ims[f'kid8-body-{b}.png'][:,:,3]>0)
            for d in range(8):
                sl=slice(d*64,d*64+64);holes=head_holes(alpha[:,sl],face[:,sl]);before+=int(holes.sum());repairmask[:,sl]|=holes
        palette=sorted({tuple(map(int,p[:3])) for a in (back,front) for p in a.reshape(-1,4) if p[3]},key=sum)
        shade=palette[max(0,len(palette)//5)]
        back[repairmask]=(*shade,255)
        Image.fromarray(back).save(R/file,optimize=True)
        j['regions'][file]['hair']=runs(back[:,:,3]>0)
        col='#'+''.join(f'{v:02X}' for v in shade)
        assert col in j['groups']['hair']
        totals.append(before);patches[file]={'rgb':list(shade),'patch_rle':runs(repairmask),'unique_pixels':int(repairmask.sum())}
    if sum(totals):
        record={'definition':'4-connected enclosed transparent pixels, y<=27, 4-neighbour to common face','before_total':sum(totals),'before_per_hair':totals,'after_total':0,'patches':patches,'skin_pixels_added':0}
        old=q.get('head_hole_repair_v14')
        if old:
            for file,patch in patches.items():
                m=np.zeros((64,512),bool)
                for y,x,n in old['patches'][file]['patch_rle']+patch['patch_rle']:m[y,x:x+n]=True
                patch['patch_rle']=runs(m);patch['unique_pixels']=int(m.sum())
            record['before_total']=old['before_total'];record['before_per_hair']=old['before_per_hair']
        q['head_hole_repair_v14']=record
    j['spec']='ASSET_SPEC_08_kid_base.md v14';j['revision']='C-head-seal'
    (R/'kid8.json').write_text(json.dumps(j,ensure_ascii=False,separators=(',',':'))+'\n');(R/'kid8-qa.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
    print('Head holes before',sum(totals),totals,'unique patches',sum(v['unique_pixels'] for v in patches.values()))
    return sum(totals)
if __name__=='__main__':
    for _ in range(8):
        if repair()==0:break
    else:raise RuntimeError('head repair did not converge')
