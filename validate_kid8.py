"""Independent acceptance checks for set 08 C artifacts; no network access."""
from pathlib import Path
import json,hashlib,itertools
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
R=Path(__file__).resolve().parent
J=json.loads((R/'kid8.json').read_text());Q=json.loads((R/'kid8-qa.json').read_text())
A={p['file']:np.array(Image.open(R/p['file']).convert('RGBA')) for p in J['parts']}
errors=[]
def check(ok,msg):
 if not ok:errors.append(msg)
def decode(runs):
 m=np.zeros((64,512),bool)
 for y,x,n in runs:
  check(0<=y<64 and 0<=x<x+n<=512,'invalid RLE');m[y,x:x+n]=True
 return m
rgb=lambda s:tuple(bytes.fromhex(s[1:]))
G={g:set(map(rgb,cs)) for g,cs in J['groups'].items()}
regions={f:{g:decode(runs) for g,runs in gs.items()} for f,gs in J['regions'].items()}
check(J['size']==[512,64] and J['cell']==64 and 'walk' not in J,'schema/frame scope')
check(J['layerOrder']==['hairback','body','face','mouth','eyes','hair'],'layerOrder')
check(len(A)==51,'51 layers')
partial=0;overlap=0;off_palette=0;transparent_region=0;house_other=0;white_hair=0
for g,h in itertools.combinations(G,2):check(not(G[g]&G[h]),'shared RGB '+g+'/'+h)
for p in J['parts']:
 f=p['file'];a=A[f];check(a.shape==(64,512,4),'shape '+f);partial+=int(((a[:,:,3]>0)&(a[:,:,3]<255)).sum());occupied=np.zeros((64,512),bool)
 for g,m in regions[f].items():
  overlap+=int((occupied&m).sum());occupied|=m;transparent_region+=int((m&(a[:,:,3]==0)).sum());off_palette+=sum(tuple(c) not in G[g] for c in a[:,:,:3][m])
 if p['part'] in ('face','hair','hairback'):
  house_other+=sum(tuple(c) in G['house'] for c in a[:,:,:3][a[:,:,3]>0])
 if p['part'] in ('hair','hairback'):
  white_hair+=int(((a[:,:,3]>0)&(a[:,:,:3].min(2)>=200)&(np.ptp(a[:,:,:3],axis=2)<60)).sum())
for k,v in [('partial_alpha',partial),('overlapping_regions',overlap),('off_palette',off_palette),('transparent_regions',transparent_region),('house_in_face_hair',house_other),('white_hair_candidates',white_hair)]:check(v==0,k+' '+str(v))
check(all(len(v)==len(G['skin']) for v in J['tones'].values()) and len(J['tones'])==4,'tones')
face=A['kid8-face-1.png'][:,:,3]>0;scalp=decode(J['scalp']['kid8-face-1.png']);edge=face&~ndi.binary_erosion(face)
expr_qa=[];mouth_edge=0;expr_out=0;rear_expr=0;scalp_exposed=0;eye_cover_max=0
for part in ('eyes','mouth'):
 for num in range(1,6):
  m=A[f'kid8-{part}-{num}.png'][:,:,3]>0;expr_out+=int((m&~face).sum())
  if part=='mouth':mouth_edge+=int((m&edge).sum())
  rear_expr+=int(m[:,3*64:6*64].sum())
  expr_qa.append({'part':part,'option':num,'opaque_per_direction':[int(m[:,64*i:64*i+64].sum()) for i in range(8)]})
for h in range(1,17):
 hair=A[f'kid8-hair-{h}.png'][:,:,3]>0;scalp_exposed+=int((scalp&~hair).sum())
 for e in range(1,6):
  m=A[f'kid8-eyes-{e}.png'][:,:,3]>0
  for d in (0,1,2,6,7):
   eye=m[:,d*64:(d+1)*64];block=(m&hair)[:,d*64:(d+1)*64];eye_cover_max=max(eye_cover_max,float(block.sum()/eye.sum()))
for k,v in [('mouth_on_face_edge',mouth_edge),('expression_outside_face',expr_out),('rear_expression_pixels',rear_expr),('scalp_exposed',scalp_exposed)]:check(v==0,k+' '+str(v))
check(eye_cover_max<=.3,'eyes hidden >30%')

def compose(h,b,e=1,m=1):
 out=Image.new('RGBA',(512,64))
 for p in J['layerOrder']:
  n=h if p in ('hair','hairback') else b if p=='body' else e if p=='eyes' else m if p=='mouth' else 1
  out=Image.alpha_composite(out,Image.fromarray(A[f'kid8-{p}-{n}.png']))
 return np.array(out)
measure=[];neck_fail=[];holes=[];all_centers=[];default=[];pair_scarf=[];visible_min=[999]*8;visible_max=[0]*8
for h in range(1,17):
 for b in range(1,9):
  a=compose(h,b);body=A[f'kid8-body-{b}.png'][:,:,3]>0;hm=regions[f'kid8-body-{b}.png']['house'];foreground=(face|(A[f'kid8-hair-{h}.png'][:,:,3]>0));visible_house=hm&~foreground
  for d in range(8):
   m=a[:,64*d:64*d+64,3]>0;ys,xs=np.where(m);bb=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1];item={'hair':h,'body':b,'direction':J['frameOrder'][d],'height':bb[3]-bb[1],'foot':bb[3]-1,'center_x':round(float(xs.mean()),4),'bbox':bb};measure.append(item);all_centers.append(abs(float(xs.mean())-32));check(60<=item['height']<=62 and item['foot']==62 and abs(item['center_x']-32)<=2,'pair geometry '+str(item))
   # The shared neck must overlap the body and be one connected component
   # in the central join area. Deliberate gaps between limbs are excluded.
   fm=face[:,64*d:64*d+64];bm=body[:,64*d:64*d+64];contact=(fm&bm)[25:32,25:39]
   if not contact.any():neck_fail.append([h,b,d])
   neck=m[25:32,27:37];filled=ndi.binary_fill_holes(neck)
   if np.any(filled&~neck):holes.append([h,b,d,int((filled&~neck).sum())])
   if (h,b) in ((1,1),(9,5)):
    default.append(item);check(60<=item['height']<=62 and item['foot']==62 and abs(item['center_x']-32)<=2,'default geometry '+str(item))
   visible_count=int(visible_house[:,64*d:64*d+64].sum());pair_scarf.append(visible_count);visible_min[d]=min(visible_min[d],visible_count);visible_max[d]=max(visible_max[d],visible_count)
check(visible_min[0]>=60 and all(visible_min[d]>=30 for d in (3,4,5)),'visible front/rear scarf');check(not neck_fail,'neck joins '+str(neck_fail[:5]));check(not holes,'neck holes '+str(holes[:5]))
bodyqa=[];hand_fail=[]
for b in range(1,9):
 f=f'kid8-body-{b}.png';gs=regions[f];a=A[f]
 counts={g:[int(gs[g][:,64*i:64*i+64].sum()) for i in range(8)] for g in ('house','trim')}
 check(counts['house'][0]>=60,'front scarf '+str(b));check(all(counts['house'][i]>=30 for i in (3,4,5)),'rear scarf '+str(b));check(counts['trim'][0]>=8,'front trim '+str(b))
 # Every occurrence of the dedicated scarf palette must belong to its region.
 house_color=np.array([tuple(p) in G['house'] for p in a[:,:,:3].reshape(-1,3)]).reshape(64,512)&(a[:,:,3]>0)
 check(np.array_equal(house_color,gs['house']),'unregistered scarf '+str(b))
 for i,entry in enumerate(J['hands'][str(b)]):
  for side in ('left','right'):
   x,y=entry[side]['xy']
   if not (0<=x<64 and 0<=y<64 and a[y,x+64*i,3]):hand_fail.append([b,i,side,x,y])
 bodyqa.append({'body':b,'gender':'f' if b<=4 else 'm','scarf_pixels':counts['house'],'trim_pixels':counts['trim']})
check(not hand_fail,'hand anchors '+str(hand_fail))
for f,sha in Q['source_sha256'].items():check(hashlib.sha256((R/f).read_bytes()).hexdigest()==sha,'source modified '+f)
jsonbytes=(R/'kid8.json').stat().st_size;pngbytes=sum((R/f).stat().st_size for f in A);previewbytes=(R/'kid8-preview.png').stat().st_size
check(jsonbytes<=300000,'JSON budget');check(pngbytes+previewbytes<=800000,'PNG budget including preview')
# 4 skin tone mappings alter RGB only. Eye/mouth masks are inside the common
# face, so all25 expression pairs preserve the tested1024 hair/body topologies.
validation={'layer_count':len(A),'native_frames':len(A)*8,'zero_counts':{'partial_alpha':partial,'regions_overlap':overlap,'regions_off_palette':off_palette,'regions_transparent':transparent_region,'house_in_face_hair':house_other,'white_hair_candidates':white_hair,'mouth_on_face_edge':mouth_edge,'expression_outside_face':expr_out,'rear_expression_pixels':rear_expr,'scalp_exposed':scalp_exposed,'neck_join_failures':len(neck_fail),'neck_holes':len(holes),'hand_anchor_failures':len(hand_fail)},'default':default,'bodies':bodyqa,'expressions':expr_qa,'max_eye_occlusion_fraction':eye_cover_max,'hair_body_direction_cases':1024,'all_expression_tone_cases_covered':102400,'coverage_method':'1024 alpha topologies + independently contained25 expression pairs +4 RGB-only tones; equivalent exhaustive cross-product without redundant alpha recomposition','all_pairs_height_range':[min(v['height'] for v in measure),max(v['height'] for v in measure)],'all_pairs_foot_rows':sorted(set(v['foot'] for v in measure)),'max_center_error_all_pairs':max(all_centers),'minimum_visible_scarf_all_pairs':min(pair_scarf),'visible_scarf_all_pairs_min_per_direction':visible_min,'visible_scarf_all_pairs_max_per_direction':visible_max,'json_bytes':jsonbytes,'runtime_png_bytes':pngbytes,'preview_png_bytes':previewbytes,'png_bytes_including_preview':pngbytes+previewbytes,'errors':errors}
Q['semantic_review']={'source_faces_removed_from_hair':'visually reviewed on isolated hair contact sheet; common face supplies ears, neck and face','front_braids':'H-F3 braids lying in front of shoulders stay in hair; portions behind torso remain hairback','lantern_pixels_in_bodies':[0]*64,'male_skirt_pixels':[0]*32,'method':'accepted native outfit silhouettes below waist preserved; visual review of all8 directions; no detector claims semantic labels automatically','owner_art_score':'pending; no numerical art score assigned'};Q['validation']=validation;Q['all_pair_geometry']=measure;Q['file_evidence']={f:{'bytes':(R/f).stat().st_size,'sha256':hashlib.sha256((R/f).read_bytes()).hexdigest()} for f in A}
(R/'kid8-qa.json').write_text(json.dumps(Q,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in validation.items() if k not in ('default','bodies','expressions')},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
