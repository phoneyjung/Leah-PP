"""Independent pixel acceptance checks for C2; reads delivered PNG/RLE/raw."""
from pathlib import Path
import json,itertools,hashlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
R=Path(__file__).resolve().parent
J=json.loads((R/'kid8.json').read_text());Q=json.loads((R/'kid8-c2-qa.json').read_text())
A={p['file']:np.array(Image.open(R/p['file']).convert('RGBA')) for p in J['parts']}
D=[0,1,2,6,7];DN=['S','SE','E','W','SW'];F=A['kid8-face-1.png'][:,:,3]>0;edge=F&~ndi.binary_erosion(F)
errors=[]
def check(ok,msg):
 if not ok:errors.append(msg)
def mask(f,g):
 out=np.zeros((64,512),bool)
 for y,x,n in J['regions'][f].get(g,[]):out[y,x:x+n]=True
 return out
outside=edge_count=rear=partial=unassigned=off=0
sym=[];heights=[];components=[];closed=[];allmasks={}
for part,count in [('eyes',9),('mouth',8)]:
 for n in range(1,count+1):
  f=f'kid8-{part}-{n}.png';a=A[f];m=a[:,:,3]>0;allmasks[part,n]=m
  outside+=int((m&~F).sum());rear+=int(m[:,192:384].sum());partial+=int(((a[:,:,3]>0)&(a[:,:,3]<255)).sum())
  edge_count+=int((m&edge).sum()) if part=='mouth' else 0
  assigned=np.zeros_like(m)
  for g,rs in J['regions'][f].items():
   gm=mask(f,g);assigned|=gm;palette={tuple(bytes.fromhex(c[1:])) for c in J['groups'][g]};off+=sum(tuple(c) not in palette for c in a[:,:,:3][gm])
  unassigned+=int((m^assigned).sum())
  meta=next(p for p in J['parts'] if p['file']==f)
  check(len(meta['nameTh'])<=10 and len(meta['nameEn'])<=14,'name length '+f)
  check(meta['source'].startswith(('H-F','H-M')),'source '+f)
  if part=='eyes':
   em=mask(f,'eye');shapes=[]
   for side in (em[:,:32],em[:,32:64]):
    y,x=np.where(side);shapes.append(side[y.min():y.max()+1,x.min():x.max()+1])
   l,r=shapes;r=r[:,::-1];pad=np.zeros((max(l.shape[0],r.shape[0]),max(l.shape[1],r.shape[1])),int);pad[:l.shape[0],:l.shape[1]]+=l;pad[:r.shape[0],:r.shape[1]]-=r
   delta=int((pad!=0).sum());sym.append({'option':n,'reflected_shape_difference':delta});check(delta<=2,'S symmetry '+str(n))
   for direction in ('SE','SW'):
    feature=next(v for v in Q['features'] if v['part']=='eyes' and v['option']==n and v['direction']==direction and v['side']==1)
    ys=[p['xy'][1] for p in feature['pixels'] if p['group']=='eye'];height=max(ys)-min(ys)+1
    heights.append({'option':n,'direction':direction,'far_eye_height':height});check(height>=2,'far eye '+str(n)+direction)
   hh=[]
   for d in (2,6):
    y,x=np.where(em[:,64*d:64*d+64]);hh.append(int(y.max()-y.min()+1))
   heights.append({'option':n,'E_W_heights':hh});check(abs(hh[0]-hh[1])<=1,'profile eye height '+str(n))
   if n==7:
    for d in D:
     fm=em[:,64*d:64*d+64];y,x=np.where(fm);colors=a[:,64*d:64*d+64,:3][fm]
     closed.append({'direction':J['frameOrder'][d],'curve_height':int(y.max()-y.min()+1),'bright_eye_pixels':int((colors.min(1)>190).sum())})
     check(y.max()-y.min()+1<=3 and not (colors.min(1)>190).any(),'closed smiling eye '+str(d))
  else:
   for d in D:
    _,k=ndi.label(m[:,64*d:64*d+64],structure=np.ones((3,3)));components.append({'option':n,'direction':J['frameOrder'][d],'components':k});check(k==1,'mouth disconnected '+str(n)+' '+str(d))
overlap=sum(int((allmasks['eyes',e]&allmasks['mouth',m]).sum()) for e in range(1,10) for m in range(1,9))
near=[];near_masks=[]
for part,count in [('eyes',9),('mouth',8)]:
 for a,b in itertools.combinations(range(1,count+1),2):
  aa=A[f'kid8-{part}-{a}.png'][:,:64];bb=A[f'kid8-{part}-{b}.png'][:,:64]
  delta=int(np.any(aa!=bb,axis=2).sum());md=int(((aa[:,:,3]>0)^(bb[:,:,3]>0)).sum())
  if delta<=6:near.append({'part':part,'options':[a,b],'different_RGBA_pixels':delta})
  if md<=6:near_masks.append({'part':part,'options':[a,b],'different_silhouette_pixels':md})
glints=[]
for f in Q['features']:
 if f['part']=='eyes' and f['direction']=='S' and f['option'] in (1,2):
  ps=[p for p in f['pixels'] if p['group']=='eye'];xs=[p['xy'][0] for p in ps];ys=[p['xy'][1] for p in ps];gs=[p for p in ps if p.get('iris_glint')]
  check(len(gs)==1,'missing native glint')
  for p in gs:
   upper_left=p['xy'][0]<=(min(xs)+max(xs))/2 and p['xy'][1]<=(min(ys)+max(ys))/2
   glints.append({'option':f['option'],'side':f['side'],'xy':p['xy'],'upper_left':upper_left});check(upper_left,'glint upper left')
source_mismatch=0;native=redrawn=0
for f,sha in Q['source_files'].items():check(hashlib.sha256((R/f).read_bytes()).hexdigest()==sha,'source hash '+f)
for feature in Q['features']:
 for p in feature['pixels']:
  if p.get('edit'):redrawn+=1;continue
  native+=1;tag=feature['source'].lower().replace('h-','h')
  tag={'hf1':'pilot-hf1','hf8':'hf8v2'}.get(tag,tag)
  raw=np.array(Image.open(R/('kid-b1-'+tag+'-raw.png')).convert('RGBA'));d=J['frameOrder'].index(feature['direction']);x,y=p['source_xy']
  source_mismatch+=int(list(map(int,raw[y,x+d*64]))!=p['source_rgba'])
zeros={'outside_face':outside,'mouth_on_face_edge':edge_count,'eye_mouth_overlap_all_360_pairs':overlap,'rear_expression':rear,'partial_alpha':partial,'unassigned_pixels':unassigned,'off_palette':off,'source_pixel_mismatch':source_mismatch}
for k,v in zeros.items():check(v==0,k+' '+str(v))
check(J['defaults']['f']['eyes']==1 and J['defaults']['f']['mouth']==1 and J['defaults']['m']['eyes']==6 and J['defaults']['m']['mouth']==8,'defaults')
report={'zero_counts':zeros,'frontal_symmetry':sym,'native_glints_1_2':glints,'eye_heights':heights,'closed_smile_7':closed,'mouth_components':components,'near_duplicate_frontal_RGBA':near,'near_duplicate_frontal_silhouettes':near_masks,'native_source_pixels':native,'owner_authorized_redrawn_pixels':redrawn,'resampled_runtime_pieces':0,'errors':errors}
Q['validation']=report;(R/'kid8-c2-qa.json').write_text(json.dumps(Q,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
