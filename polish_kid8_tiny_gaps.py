"""Spec16: fill only 4-connected enclosed alpha-zero components of size1–3.
Shared layers are repaired to a fixed point across all1024 compositions.
"""
from pathlib import Path
from collections import Counter
import json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
from polish_kid8_head_holes import runs
R=Path(__file__).resolve().parent;CROSS=ndi.generate_binary_structure(2,1)

def small_holes(alpha):
 holes=ndi.binary_fill_holes(alpha,structure=CROSS)&~alpha
 labels,n=ndi.label(holes,structure=CROSS);sizes=np.bincount(labels.ravel());chosen=(sizes>=1)&(sizes<=3);chosen[0]=False
 return chosen[labels],labels,sizes

def measure(j,a):
 total=head=body=0;hh=[];bh=[]
 for h in range(1,17):
  hc=bc=0
  for b in range(1,9):
   alpha=np.logical_or.reduce([a[f'kid8-{p}-{h if p in ("hair","hairback") else b if p=="body" else 1}.png'][:,:,3]>0 for p in j['layerOrder']])
   for d in range(8):
    small,labs,sizes=small_holes(alpha[:,d*64:d*64+64]);total+=int(small.sum())
    for k in np.where((sizes>=1)&(sizes<=3))[0]:
     if not k:continue
     y,x=np.where(labs==k)
     # A component belongs to the head if its top row is y<=27.
     if int(y.min())<=27:hc+=len(y)
     else:bc+=len(y)
  hh.append(hc);bh.append(bc);head+=hc;body+=bc
 return {'total_pixels':total,'head_pixels':head,'body_pixels':body,'head_per_hair':hh,'body_per_hair':bh,'classification':'whole component: min(y)<=27 is head; otherwise body'}

def repair():
 j=json.loads((R/'kid8.json').read_text());q=json.loads((R/'kid8-qa.json').read_text());a={p['file']:np.array(Image.open(R/p['file']).convert('RGBA')) for p in j['parts']}
 region={}
 for f,gs in j['regions'].items():
  region[f]={}
  for g,rs in gs.items():
   m=np.zeros((64,512),bool)
   for y,x,n in rs:m[y,x:x+n]=True
   region[f][g]=m
 before=measure(j,a);record={'definition':'enclosed by 4-connectivity; entire component size1–3','before':before,'passes':[],'patches':[],'skin_pixels_added_to_hair':0,'existing_opaque_pixels_changed':0,'unchanged_face_eyes_mouth_front_hair_files':sum(p['part'] in ('face','eyes','mouth','hair') for p in j['parts'])};changed=set()
 for iteration in range(16):
  pending={};count=0
  for h in range(1,17):
   for b in range(1,9):
    files=[f'kid8-{p}-{h if p in ("hair","hairback") else b if p=="body" else 1}.png' for p in j['layerOrder']]
    alpha=np.zeros((64,512),bool);visible=np.zeros((64,512),int);rgba=np.zeros((64,512,4),np.uint8)
    for i,f in enumerate(files):
     m=a[f][:,:,3]>0;alpha|=m;visible[m]=i+1;rgba[m]=a[f][m]
    for d in range(8):
     sl=slice(d*64,d*64+64);small,labs,sizes=small_holes(alpha[:,sl])
     if not small.any():continue
     for lab in np.where((sizes>=1)&(sizes<=3))[0]:
      if not lab:continue
      component=labs==lab;ys,xs=np.where(component);boundary=ndi.binary_dilation(component,structure=CROSS)&~component;v=visible[:,sl];hair_boundary=boundary&np.isin(v,[1,6]);body_boundary=boundary&(v==2)
      hair=int(ys.min())<=27 or int(hair_boundary.sum())>int(body_boundary.sum())
      f=f'kid8-hairback-{h}.png' if hair else f'kid8-body-{b}.png';group='hair' if hair else None
      if hair:
       cand=hair_boundary;colors=[tuple(map(int,c[:3])) for c in rgba[:,sl][cand]]
       if not colors:
        near=ndi.binary_dilation(component,structure=np.ones((3,3)),iterations=4);colors=[tuple(map(int,c[:3])) for hf in (f,f'kid8-hair-{h}.png') for c in a[hf][:,sl][near&(a[hf][:,sl,3]>0)]]
      else:
       cand=body_boundary.copy();house=region[f].get('house',np.zeros_like(alpha))[:,sl]
       if cand.any() and (cand&house).sum()==cand.sum():group='house'
       else:
        for excluded in ('skin','house','trim'):cand&=~region[f].get(excluded,np.zeros_like(alpha))[:,sl]
       colors=[tuple(map(int,c[:3])) for c in a[f][:,sl][cand]]
       if not colors:
        near=ndi.binary_dilation(component,structure=np.ones((3,3)),iterations=4)&(a[f][:,sl,3]>0)
        for excluded in ('skin','house','trim'):near&=~region[f].get(excluded,np.zeros_like(alpha))[:,sl]
        colors=[tuple(map(int,c[:3])) for c in a[f][:,sl][near]]
      assert colors,('no surrounding layer colour',h,b,d,lab)
      # Prefer the most repeated surrounding native shade, darker on ties.
      counts=Counter(colors);color=min(counts,key=lambda c:(-counts[c],sum(c)))
      for x,y in zip(xs,ys):
       key=(f,int(x+d*64),int(y));pending.setdefault(key,(color,group));count+=1
  if not pending:
   record['after']=measure(j,a);break
  for (f,x,y),(rgb,g) in pending.items():
   assert a[f][y,x,3]==0; a[f][y,x]=[*rgb,255];changed.add(f)
   if g:
    region[f].setdefault(g,np.zeros((64,512),bool))[y,x]=True
    assert '#'+''.join(f'{c:02X}' for c in rgb) in j['groups'][g]
   record['patches'].append({'file':f,'xy':[x,y],'rgb':list(rgb),'region':g,'pass':iteration+1})
  record['passes'].append({'pass':iteration+1,'case_pixels_before':count,'unique_pixels_added':len(pending)})
 else:raise RuntimeError('tiny gap repair did not converge')
 assert record['after']['total_pixels']==0
 if changed:
  for f in changed:Image.fromarray(a[f]).save(R/f,optimize=True);j['regions'][f]={g:runs(m) for g,m in region[f].items() if m.any()}
  q['tiny_gap_repair_v16']=record
 j.update(spec='ASSET_SPEC_08_kid_base.md v16',revision='C2-tiny-seal');q['spec_revision']=16
 (R/'kid8.json').write_text(json.dumps(j,ensure_ascii=False,separators=(',',':'))+'\n');(R/'kid8-qa.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'before':before,'after':record['after'],'passes':record['passes'],'changed_files':sorted(changed),'unique_pixels':len(record['patches'])},ensure_ascii=False))
if __name__=='__main__':repair()
