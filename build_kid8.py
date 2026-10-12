"""Set 08 C: native-pixel decomposition and documented manual pixel polishing.

No network or generative calls. Sources are never resized, reflected or overwritten.
Only owner review contact sheets are enlarged using nearest neighbour.
"""
from pathlib import Path
import json, hashlib, colorsys
from collections import Counter
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw
R=Path(__file__).resolve().parent
D=['S','SE','E','NE','N','NW','W','SW']; BACK={3,4,5}
C=json.loads((R/'kid8-source-masks.json').read_text())
TAGS=['hf1','hf2','hf3v2','hf4','hf5','hf6','hf7','hf8v2']+['hm'+str(i) for i in range(1,9)]
BTAGS=['of1v2','of2v2','of3','of4','om1','om2','om3','om4']
ORDER=['hairback','body','face','mouth','eyes','hair']
SKIN=[(172,99,67),(202,125,86),(227,147,104),(242,170,125),(248,185,143),(251,197,157)]
HOUSE=[(101,61,18),(169,106,19),(226,165,34),(255,214,78)]
TRIM=[(106,64,21),(181,119,34),(233,177,66),(255,224,130)]
EYE=[(42,25,20),(92,51,34),(142,81,47),(190,129,69)]
MOUTH=[(103,40,38),(161,69,59),(220,116,103)]
WHITE=(255,250,237)
GROUPS=['hair','eye','skin','mouth','house','trim']
LAYERS={}; REG={}; parts=[]; source_evidence={}; edits={}; scalp=[]

def rgba(c):return tuple(c)+(255,)
def blank():return Image.new('RGBA',(64,64))
def arr(im):return np.array(im)
def maskpoly(points):
 im=Image.new('1',(64,64));ImageDraw.Draw(im).polygon(points,fill=1);return np.array(im,dtype=bool)
def shifts(im,dx=0,dy=0):
 out=blank();out.paste(im,(int(dx),int(dy)));return out
def maskraw(im,config):
 m=Image.new('L',(64,64));d=ImageDraw.Draw(m)
 for b in config.get('rectangles_inclusive',[]):d.rectangle(b,fill=255)
 for p in config.get('polygons',[]):d.polygon(p,fill=255)
 for xy in config.get('pixels',[]):m.putpixel(tuple(xy),255)
 out=blank();out.paste(im,(0,0),m);return out

def source(file,i):
 p=R/file
 if file not in source_evidence:source_evidence[file]=hashlib.sha256(p.read_bytes()).hexdigest()
 return Image.open(p).convert('RGBA').crop((64*i,0,64*i+64,64))
def rle(mask):
 runs=[]
 for y,row in enumerate(mask):
  x=0
  while x<len(row):
   if not row[x]:x+=1;continue
   end=x+1
   while end<len(row) and row[end]:end+=1
   runs.append([y,x,end-x]);x=end
 return runs

def putlayer(part,num,frames,masks,name,gender=None):
 f=f'kid8-{part}-{num}.png';sheet=Image.new('RGBA',(512,64));regs={g:np.zeros((64,512),bool) for g in GROUPS}
 for i,im in enumerate(frames):
  sheet.paste(im,(64*i,0))
  for g,mask in masks[i].items():regs[g][:,64*i:64*i+64]=mask
 LAYERS[f]=sheet;REG[f]=regs
 item={'file':f,'part':part,'option':num,'nameTh':name[0],'nameEn':name[1]}
 if gender:item['gender']=gender
 parts.append(item)

def nearest_palette(rgb,palette):return min(palette,key=lambda c:sum((int(c[k])-int(rgb[k]))**2 for k in range(3)))

# The common face follows H-F1's original cheek, ear and jaw contours.
FACE_POLYS=[
 [(29,10),(34,10),(38,15),(40,19),(42,19),(43,20),(43,22),(41,24),(38,25),(36,27),(28,27),(25,25),(22,24),(20,23),(19,20),(20,19),(22,19),(24,16)],
 [(35,9),(38,10),(41,13),(41,20),(42,22),(41,24),(38,27),(31,27),(28,25),(25,24),(22,22),(22,19),(25,18),(28,17)],
 [(38,10),(40,10),(41,13),(41,20),(42,21),(42,23),(40,24),(40,26),(36,28),(31,27),(30,24),(27,23),(25,21),(25,18),(28,17),(31,18)],
 [(25,8),(36,8),(39,14),(39,21),(37,25),(31,28),(26,25),(22,20),(22,14)],
 [(24,8),(39,8),(42,15),(42,22),(38,25),(34,28),(28,28),(24,25),(20,22),(20,16)],
 [(27,8),(38,8),(41,14),(41,20),(37,25),(32,28),(26,25),(24,21),(24,14)],
 [(22,10),(24,10),(32,18),(35,17),(37,18),(37,21),(35,23),(32,24),(32,27),(27,28),(23,26),(23,24),(21,23),(21,21),(22,20)],
 [(25,9),(28,10),(35,17),(38,18),(41,19),(41,22),(38,24),(35,25),(32,27),(25,27),(22,24),(21,22),(22,13)] ]
NECK_X=[(29,33),(31,35),(31,35),(28,33),(29,34),(30,35),(27,31),(28,32)]
faces=[];facemasks=[];outline_masks=[];scalpmasks=[]
for i in range(8):
 raw=arr(source('kid-b1-pilot-hf1-raw.png',i));m=maskpoly(FACE_POLYS[i]); neck=np.zeros((64,64),bool);x1,x2=NECK_X[i];neck[26:31,x1:x2+1]=True;m|=neck
 # A compact scalp underpainting is shared by every hairstyle.
 sc=maskpoly([(26,7),(37,7),(39,11),(38,15),(25,15),(23,11)])
 if i in BACK:
  sc=m.copy();sc[25:]=False
  lo,hi={3:(23,35),4:(23,39),5:(28,40)}[i];sc[:,:lo]=False;sc[:,hi+1:]=False
 else:sc[14:]=False
 m|=sc;edge=m&~ndi.binary_erosion(m);out=np.zeros((64,64,4),np.uint8)
 for y,x in zip(*np.where(m)):
  rgb=tuple(raw[y,x,:3]);valid=rgb in SKIN
  # All old brows, pupils, tooth/white artifacts and mouth pigments are filled.
  out[y,x]=rgba(rgb if valid else SKIN[4 if x<33 else 3])
  if edge[y,x] and y>=19:out[y,x]=rgba(SKIN[1])
  if y>=27:out[y,x]=rgba(SKIN[2 if x<=x1+1 else 3])
 faces.append(Image.fromarray(out));facemasks.append(m);outline_masks.append(edge);scalpmasks.append(sc)
putlayer('face',1,faces,[{'skin':m} for m in facemasks],('หน้าแม่แบบเด็ก','Common child face'))

# Eye glyphs are hand-polished on the H-F1 registration grid. Five directions
# are independently placed, so side views do not invent a hidden far eye.
EYE_ANCHORS={0:[(24,17,5),(34,17,5)],1:[(29,17,5),(39,17,3)],2:[(35,17,4)],6:[(24,17,4)],7:[(22,17,3),(30,17,5)]}
EYE_NAMES=[('กลมประกาย','Round sparkle'),('ยิ้มโค้ง','Smiling crescent'),('โตตกใจ','Wide surprised'),('ครึ่งปิดอ่อนโยน','Gentle half-lidded'),('มุ่งมั่น','Confident')]
# Native discrete glyphs, derived from the approved H-F1/F2/F3/F7/F8 expressions.
def eye_glyph(kind,w):
 im=Image.new('RGBA',(w,7));d=ImageDraw.Draw(im);dark=rgba(EYE[0]);mid=rgba(EYE[1]);light=rgba(EYE[2])
 if kind==2:
  pts=[(0,3),(1,2),(w-2,2),(w-1,3)];d.line(pts,fill=dark,width=1)
 else:
  top=1 if kind!=4 else 2;bottom=5 if kind==3 else 4
  d.rectangle((0,top,w-1,bottom),fill=dark)
  if w>=4:d.rectangle((1,top+1,w-2,bottom),fill=mid)
  d.point((w-2,bottom),fill=light)
  if kind in (1,3,5):d.point((1,top+1),fill=rgba(WHITE))
  if kind==3:d.point((w-2,0),fill=dark)
  if kind==5:d.line((0,0,w-1,1),fill=dark)
  if kind==1:d.line((1,0,w-2,0),fill=mid)
 return im
for num in range(1,6):
 fs=[];ms=[]
 for i in range(8):
  im=blank()
  for x,y,w in EYE_ANCHORS.get(i,[]):im.alpha_composite(eye_glyph(num,w),(x,y))
  a=arr(im);m=a[:,:,3]>0;group=m&np.any(a[:,:,:3]!=WHITE,axis=2);fs.append(im);ms.append({'eye':group})
 putlayer('eyes',num,fs,ms,EYE_NAMES[num-1])
MOUTH_ANCHORS={0:(29,24),1:(35,24),2:(37,24),6:(24,24),7:(24,24)}
MOUTH_NAMES=[('ยิ้มกว้างเห็นฟัน','Toothy smile'),('ยิ้มเล็ก','Small smile'),('อ้าปากโอ','Open O'),('ยิ้มแมว','Cat smile'),('ยิ้มมุมปาก','Side smile')]
for num in range(1,6):
 fs=[];ms=[]
 for i in range(8):
  im=blank();draw=ImageDraw.Draw(im)
  if i in MOUTH_ANCHORS:
   x,y=MOUTH_ANCHORS[i];w=4 if i in (0,1,7) else 2
   if num==1:
    draw.line((x,y,x+w-1,y),fill=rgba(MOUTH[0]));draw.line((x,y+1,x+w-1,y+1),fill=rgba(WHITE));draw.line((x+1,y+2,x+w-2,y+2),fill=rgba(MOUTH[1])) if w>2 else None
   elif num==2:draw.line((x,y+1,x+w-1,y+1),fill=rgba(MOUTH[1]))
   elif num==3:draw.rectangle((x+1,y,x+2,y+2),fill=rgba(MOUTH[0]));draw.point((x+1,y+2),fill=rgba(MOUTH[2]))
   elif num==4:draw.line([(x,y),(x+1,y+1),(x+2,y),(x+3,y+1),(x+4,y)],fill=rgba(MOUTH[1])) if w>2 else draw.line([(x,y),(x+1,y+1),(x+2,y)],fill=rgba(MOUTH[1]))
   else:
    lift_left=i in (0,6,7);draw.line((x,y+1,x+w-1,y+1),fill=rgba(MOUTH[1]));draw.point((x if lift_left else x+w-1,y),fill=rgba(MOUTH[1]))
  a=arr(im);a[~ndi.binary_erosion(facemasks[i])]=0;im=Image.fromarray(a);m=a[:,:,3]>0;fs.append(im);ms.append({'mouth':m&np.any(a[:,:,:3]!=WHITE,axis=2)})
 putlayer('mouth',num,fs,ms,MOUTH_NAMES[num-1])

# Hair membership starts with the approved source head mask. Bright face seeds
# are closed across pupil holes, then all remaining face aperture pixels are
# removed. No source face, eye or mouth survives into a hair layer.
HAIR_NAMES=['เปียคู่ยาว','บ๊อบยุ่ง','เปียคู่ต่ำ','ปัดข้าง','บ๊อบเรียบ','มวยคู่','ผมตรงหน้าม้า','หางม้าสูง','ผมตั้ง','ผมหยักสั้น','ทรงชามนุ่ม','ผมสั้นไถข้าง','แสกข้างเรียบ','ผมลอนฟู','แสกกลาง','ผมสั้นเกรียน']
HAIR_EN=['Long twin braids','Tousled bob','Low twin braids','Side sweep','Smooth bob','Twin buns','Straight fringe','High ponytail','Spiky','Short tousled','Soft bowl','Short undercut','Neat side part','Fluffy curls','Center part','Close cropped']
hairmetrics={}
for num,tag in enumerate(TAGS,1):
 cfg=C['heads'][tag];fs=[];bs=[];fm=[];bm=[];metrics=[]
 # Hair-only crown colors from all directions are a native shading reference.
 crown=[]
 for i in range(8):
  a=arr(source(cfg['raw_file'],i));crown.extend(tuple(p[:3]) for p in a[:10].reshape(-1,4) if p[3] and min(p[:3])<200)
 ramp=[p for p,n in Counter(crown).most_common(48) if max(p)-min(p)>18]
 for i in range(8):
  raw=source(cfg['raw_file'],i);a=arr(maskraw(raw,cfg['frames'][i]['head_mask']));opaque=a[:,:,3]>0
  # Warm skin seeds have much more red-lightness than the dark crown.
  r,g,b=[a[:,:,k].astype(int) for k in range(3)];seed=(r>220)&(g>140)&(b>85)&(r>g)&(g>b)&opaque
  if tag=='hm7':seed=(r>=250)&(g>=200)&(b>=165)&opaque
  yy,xx=np.indices((64,64));seed&=(yy>=10)&(yy<31)&(xx>=19)&(xx<=44)
  skin=seed.copy()
  for y in range(16,31):
   xs=np.where(seed[y])[0]
   if len(xs)>1:skin[y,xs.min():xs.max()+1]=True
  skin=ndi.binary_fill_holes(skin)
  # Registration to the shared face, replacing the old jaw and expressions.
  if i not in BACK:
   aperture=facemasks[i].copy();aperture[:16]=False
   # Keep forehead locks and bang shape; remove every old feature below eyes.
   skin|=aperture
   skin[27:31,27:37]=True
  else:
   # Rear ears are supplied by the common face, never by a hair source.
   skin|=seed
  a[skin]=0
  # Remove disconnected remnants of old jaw/ear outlines. Low braids have
  # their own native components and are retained by the approved masks.
  lab,nlab=ndi.label(a[:,:,3]>0,structure=np.ones((3,3)))
  for label in range(1,nlab+1):
   yy0,xx0=np.where(lab==label)
   braid=tag=="hf3v2" and yy0.min()>=23 and len(xx0)>=3
   if yy0.min()>14 and not braid:a[lab==label]=0
  white=(a[:,:,3]>0)&(np.min(a[:,:,:3],axis=2)>=200)&((np.max(a[:,:,:3],axis=2)-np.min(a[:,:,:3],axis=2))<60)
  a[white]=0
  # Remove isolated crumbs, and any pale facial shade left outside the seeds.
  pale=(a[:,:,3]>0)&(r>205)&(g>135)&(b>90)&(yy>15)&(yy<31)&(xx>18)&(xx<45)
  if tag=='hm7':pale&=r>=250
  a[pale]=0
  # On the dark short styles these warm pixels belong to the old ears/neck,
  # not to their much darker hair ramp. The shared face supplies those ears.
  if tag in ('hf2','hf4','hf5','hm4','hm8'):
   threshold={'hf2':165,'hf4':140,'hf5':160,'hm4':155,'hm8':150}[tag]
   old_skin=(a[:,:,3]>0)&(r>threshold)&((r-g)>40)&(yy>=17)&(yy<31)&(xx>=18)&(xx<=45)
   a[old_skin]=0
  # Cap underpainting closes exposed scalp on the single shared face without
  # scaling the source silhouette. Fill uses nearest native crown shade.
  cap=scalpmasks[i].copy();cap&=facemasks[i]
  if i not in BACK:cap[14:]=False
  need=cap&(a[:,:,3]==0)
  for y,x in zip(*np.where(need)):
   rgb=nearest_palette(arr(raw)[y,x,:3],ramp);a[y,x]=rgba(rgb)
  # Source tips and long locks behind shoulders are a separate rear layer.
  back=a.copy();front=a.copy();split=28
  back[:split]=0;front[split:]=0
  if tag=="hf3v2" and i not in BACK:
   front=a.copy();back[:]=0
  # Any bright skin from guide neck cannot remain below the hair split.
  for aa in (front,back):
   aa[aa[:,:,3]==0]=0
  fs.append(Image.fromarray(front));bs.append(Image.fromarray(back));fm.append({'hair':front[:,:,3]>0});bm.append({'hair':back[:,:,3]>0})
  metrics.append({'direction':D[i],'white_removed':int(white.sum()),'scalp_filled':int(need.sum()),'source_translation':[0,0]})
 putlayer('hair',num,fs,fm,(HAIR_NAMES[num-1],HAIR_EN[num-1]));putlayer('hairback',num,bs,bm,(HAIR_NAMES[num-1]+' ด้านหลัง',HAIR_EN[num-1]+' back'));hairmetrics[tag]=metrics

# Body extraction retains its original clothing silhouette. Scarf knots/tails
# and missing fixed gold hems are deliberately repainted at native resolution.
BODY_NAMES=['ศิษย์ตะเกียง','นักสำรวจ','ชาวสวน','ชาวประมงริมน้ำ']
hands={};bodymetrics={}
for num,tag in enumerate(BTAGS,1):
 prev='of2' if tag=='of2v2' else tag;cfg=C['bodies'][num-1];file='kid-b1-'+tag+'-raw.png';fs=[];ms=[];hm=[];met=[]
 for i in range(8):
  raw=source(file,i);a=arr(raw);bb=raw.getchannel('A').getbbox();dy=62-(bb[3]-1);dx=0
  mc=cfg['frames'][i]['body_mask']
  if tag=='of2v2':
   mc={'rectangles_inclusive':[[0,28,63,63]],'polygons':[[(28,24),(36,24),(43,28),(20,28)]]}
  im=shifts(maskraw(raw,mc),dx,dy);a=arr(im);house=np.zeros((64,64),bool);trim=house.copy();skin=house.copy()
  mat=C['materials'][prev]['frames'][i]
  if tag!='of2v2':
   for x,y in mat['scarf_xy']:
    if 0<=y+dy<64 and a[y+dy,x,3]:house[y+dy,x]=True
   for x,y in mat.get('hem_gold_xy',mat.get('trim_xy',[])):
    if 0<=y+dy<64 and a[y+dy,x,3]:trim[y+dy,x]=True
  else:
   for y in range(23+dy,38+dy):
    for x in range(23,42):
     r,g,b,al=a[y,x];h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
     if al and 25<=h*360<=56 and s>.45 and r>140:house[y,x]=True
   for y in range(43+dy,48+dy):
    for x in range(18,47):
     r,g,b,al=a[y,x];h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
     if al and 25<=h*360<=56 and s>.45 and r>140 and b<.56*g:trim[y,x]=True
  # Close tiny shadow holes inside the approved scarf mask, including its
  # outlines; the resulting entire scarf is repainted into the house ramp.
  house=ndi.binary_fill_holes(ndi.binary_closing(house,structure=np.ones((2,2))))|(house)
  house&=a[:,:,3]>0
  # Recolour all identified scarf pixels into a palette disjoint from trim.
  for m,pal in ((house,HOUSE),(trim,TRIM)):
   for y,x in zip(*np.where(m)):a[y,x]=rgba(nearest_palette(a[y,x,:3],pal))
  im=Image.fromarray(a);dr=ImageDraw.Draw(im);paint=Image.new('1',(64,64));pd=ImageDraw.Draw(paint)
  if i==0:polys=[[(25,28),(37,28),(37,29),(25,29)],[(30,29),(33,29),(33,31),(30,31)],[(27,30),(30,31),(29,37),(27,36)],[(33,31),(36,30),(36,36),(34,37)]]
  elif i in BACK:
   cx={3:31,4:32,5:33}[i];polys=[[(cx-6,28),(cx+5,28),(cx+5,30),(cx-6,30)],[(cx-1,29),(cx+1,29),(cx+2,32),(cx-1,32)],[(cx-3,31),(cx-1,32),(cx-2,37),(cx-4,35)],[(cx+1,31),(cx+3,31),(cx+4,36),(cx+2,37)]]
  else:
   cx={1:35,2:36,6:28,7:28}[i];polys=[[(cx-4,28),(cx+3,28),(cx+3,30),(cx-4,30)],[(cx-1,29),(cx+1,29),(cx+1,32),(cx-1,32)],[(cx-2,31),(cx,32),(cx-1,37),(cx-3,36)],[(cx+1,31),(cx+3,31),(cx+3,36),(cx+1,37)]]
  for poly in polys:dr.polygon(poly,fill=rgba(HOUSE[2]));pd.polygon(poly,fill=1)
  patch=np.array(paint,dtype=bool);house|=patch;a=arr(im)
  edge=patch&~ndi.binary_erosion(patch)
  for y,x in zip(*np.where(patch)):
   shade=1 if edge[y,x] else (3 if (x+y)%5<2 else 2);a[y,x]=rgba(HOUSE[shade])
  # Keep the two tails distinct with an ivory/vest gap rather than a rectangle.
  # Strengthen the lower hem or bib stripe if source front has fewer than8.
  if i==0 and int(trim.sum())<8:
   coords=([(x,43) for x in range(23,41)] if num==6 else [(x,39) for x in range(27,38)] if num==7 else [(x,45) for x in range(23,41)])
   for x,y in coords:
    if a[y,x,3] and not house[y,x]:a[y,x]=rgba(TRIM[2 if x%3 else 3]);trim[y,x]=True
  # Any exposed native skin (knees/collar) uses the shared tone ramp. Gloves
  # remain leather, so recolouring skin does not recolour gloves or boots.
  for y in range(24,60):
   for x in range(64):
    r,g,b,al=a[y,x]
    if al and not house[y,x] and not trim[y,x] and r>220 and 110<g<220 and 70<b<180 and r>g>b and (y<31 or y>45):
     skin[y,x]=True;a[y,x]=rgba(nearest_palette((r,g,b),SKIN))
  if num==4 and i==6:
   a[26,35]=rgba(SKIN[3]);skin[26,35]=True
  join_patches={(1,2):[(27,26),(27,27)],(6,2):[(27,26),(27,27)],(3,2):[(27,26),(26,30)],(7,2):[(27,26),(26,30)],(4,2):[(27,26)]}
  for x,y in join_patches.get((num,i),[]):
   if a[y,x,3]:continue
   ys,xs=np.where(a[:,:,3]>0);n=int(np.argmin((xs-x)**2+(ys-y)**2));sx,sy=int(xs[n]),int(ys[n]);a[y,x]=a[sy,sx]
   house[y,x]=house[sy,sx];trim[y,x]=trim[sy,sx];skin[y,x]=skin[sy,sx]
  trim&=~house;skin&=~(house|trim);a[a[:,:,3]==0]=0
  fs.append(Image.fromarray(a));ms.append({'house':house,'trim':trim,'skin':skin})
  hand=C['hands'][prev][i];hh={'direction':D[i]}
  for side in ('left','right'):
   x,y=hand[side];x+=dx;y+=dy
   if tag=='of2v2':
    # Register gloves by nearby native opaque pixels, then visual review.
    y=max(35,min(42,y));coords=[(xx,yy) for yy in range(max(0,y-3),min(64,y+4)) for xx in range(max(0,x-3),min(64,x+4)) if a[yy,xx,3]]
    x,y=min(coords,key=lambda p:(p[0]-x)**2+(p[1]-y)**2)
   hh[side]={'xy':[x,y],'layer':hand.get(side+'_layer','front'),'estimated':hand.get(side+'_estimated',False)}
  hm.append(hh);met.append({'direction':D[i],'source_translation':[dx,dy],'scarf_pixels':int(house.sum()),'trim_pixels':int(trim.sum()),'lantern_pixels':0,'male_skirt_pixels':0 if num>4 else None})
 putlayer('body',num,fs,ms,(BODY_NAMES[(num-1)%4]+('หญิง' if num<5 else 'ชาย'),['Apprentice','Explorer','Gardener','Fisher'][(num-1)%4]),'f' if num<5 else 'm');hands[str(num)]=hm;bodymetrics[tag]=met

# Shared per-direction native translation is baked into every layer, region,
# scalp mask and hand anchor. No runtime offsets and no resampling.
ALIGN_X=[1,1,2,1,1,0,0,0]
for f,im in list(LAYERS.items()):
 out=Image.new('RGBA',(512,64))
 for i,dx in enumerate(ALIGN_X):
  out.paste(shifts(im.crop((64*i,0,64*i+64,64)),dx,0),(64*i,0))
  for g in GROUPS:
   cell=REG[f][g][:,64*i:64*i+64].copy();REG[f][g][:,64*i:64*i+64]=np.pad(cell,((0,0),(dx,0)))[:,:64]
 LAYERS[f]=out
for i,dx in enumerate(ALIGN_X):
 scalpmasks[i]=np.pad(scalpmasks[i],((0,0),(dx,0)))[:,:64]
 for entries in hands.values():
  for side in ('left','right'):entries[i][side]['xy'][0]+=dx
 for entries in bodymetrics.values():entries[i]['source_translation'][0]+=dx
 for entries in hairmetrics.values():entries[i]['source_translation'][0]+=dx

# RGB colours assigned to different material groups must be globally disjoint.
# A one-channel one-step adjustment resolves coincidental source RGB collisions.
reserved={};groups={g:set() for g in GROUPS}
for g in ['skin','eye','mouth','house','trim','hair']:
 for f,im in LAYERS.items():
  a=arr(im);mask=REG[f][g]
  for color in sorted({tuple(map(int,p)) for p in a[:,:,:3][mask]}):
   new=color
   while new in reserved and reserved[new]!=g:new=(new[0],new[1],(new[2]+1)%256)
   if new!=color:a[mask&np.all(a[:,:,:3]==color,axis=2),:3]=new
   reserved[new]=g;groups[g].add(new)
  LAYERS[f]=Image.fromarray(a)

for f,im in LAYERS.items():im.save(R/f,optimize=True)
hexcol=lambda c:'#'+''.join(f'{v:02X}' for v in c)
group_list={g:sorted(v,key=lambda c:sum(c)) for g,v in groups.items()}
# Four complete skin tone mappings retain ordering and all six native shades.
tones={}
for name,target in [('light',[(194,135,102),(215,157,119),(236,181,142),(248,202,161),(255,214,177),(255,224,193)]),('medium',SKIN),('tan',[(113,65,40),(139,82,48),(164,101,58),(187,120,72),(205,141,88),(222,162,110)]),('deep',[(67,39,29),(85,48,32),(110,64,40),(132,80,48),(155,99,62),(175,120,78)])]:
 tones[name]=[hexcol(target[SKIN.index(c)]) for c in group_list['skin']]
meta={'schema':1,'revision':'C1','status':'awaiting-art-review','spec':'ASSET_SPEC_08_kid_base.md v13','size':[512,64],'cell':64,'frameOrder':D,'availableFrames':list(range(8)),'layerOrder':ORDER,'drawOffset':[0,0],'feet':[32,62],'parts':parts,'groups':{g:[hexcol(c) for c in cs] for g,cs in group_list.items()},'regions':{f:{g:rle(m) for g,m in gs.items() if m.any()} for f,gs in REG.items()},'mask_encoding':'row runs [y,x,length], absolute sheet coordinates','scalp':{'kid8-face-1.png':rle(np.hstack(scalpmasks))},'tones':tones,'hands':hands,'defaults':{'f':{'hair':1,'eyes':1,'mouth':1,'body':1},'m':{'hair':9,'eyes':1,'mouth':1,'body':5}}}
(R/'kid8.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':'))+'\n')

def compose(h,b,e=1,m=1):
 out=Image.new('RGBA',(512,64))
 for p in ORDER:
  n=h if p in ('hair','hairback') else b if p=='body' else e if p=='eyes' else m if p=='mouth' else 1
  out=Image.alpha_composite(out,LAYERS[f'kid8-{p}-{n}.png'])
 return out
# 16 hair rows, 8 outfit rows, then two rows of five frontal expressions.
preview=Image.new('RGBA',(512,26*64),(66,74,82,255))
for h in range(1,17):preview.alpha_composite(compose(h,1 if h<=8 else 5),(0,64*(h-1)))
for b in range(1,9):preview.alpha_composite(compose(1 if b<=4 else 9,b),(0,64*(15+b)))
for k in range(1,6):
 preview.alpha_composite(compose(1,1,e=k).crop((0,0,64,64)),((k-1)*64,24*64))
 preview.alpha_composite(compose(1,1,m=k).crop((0,0,64,64)),((k-1)*64,25*64))
preview.convert('RGB').resize((2048,6656),Image.Resampling.NEAREST).save(R/'kid8-preview.png',optimize=True)
qa={'set':8,'spec_revision':13,'production_credits':0,'source_sha256':source_evidence,'hair_edits':hairmetrics,'bodies':bodymetrics,'rescaled_pieces':0,'reflected_pieces':0,'runtime_png_bytes':sum((R/f).stat().st_size for f in LAYERS),'preview_bytes':(R/'kid8-preview.png').stat().st_size,'json_bytes':(R/'kid8.json').stat().st_size}
(R/'kid8-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
print('built',len(LAYERS),'layers',qa['runtime_png_bytes'],'PNG bytes',qa['json_bytes'],'JSON bytes')

# Current delivery pipeline: repair shared-head gaps and replace the historical
# C1 feature glyphs with native C2 extraction and owner-authorized corrections.
import subprocess,sys
for script in ('polish_kid8_head_holes.py','build_kid8_c2.py','preview_kid8.py'):
 subprocess.run([sys.executable,str(R/script)],check=True)
