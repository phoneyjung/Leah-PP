"""C2 native PixelLab feature transfer. No synthetic eye/mouth glyphs.
Source masks, integer translations, skin-rank remaps and allowed S reflection
are recorded per pixel in kid8-c2-qa.json. No network or image resampling.
"""
from pathlib import Path
import json,hashlib,itertools
from collections import Counter
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
from polish_kid8_head_holes import runs
R=Path(__file__).resolve().parent;CFG=json.loads((R/'kid8-c2-source-masks.json').read_text())
DIRS=[0,1,2,6,7];DN=['S','SE','E','W','SW'];SKIN=[(172,99,67),(202,125,86),(227,147,104),(242,170,125),(248,185,143),(251,197,157)]
SOURCES={'pilot-hf1':[(172,99,67),(202,125,86),(227,147,104),(242,170,125),(248,185,143),(251,197,157)],'hf2':[(176,103,74),(190,112,79),(201,125,90),(218,137,98),(231,151,107),(249,168,117),(252,175,124)],'hf4':[(171,108,72),(191,110,67),(211,129,80),(223,143,89),(236,157,98),(245,172,111),(247,179,119)],'hf5':[(175,96,65),(211,127,86),(239,155,108),(250,175,130),(252,188,147)],'hf7':[(173,94,54),(199,116,74),(227,125,77),(238,153,108),(250,173,129),(254,192,153),(255,206,172)],'hm2':[(171,94,59),(192,112,73),(216,133,86),(238,154,102),(252,173,117)],'hm3':[(227,158,115),(247,193,152),(251,214,179)],'hm4':[(177,106,68),(190,116,76),(205,131,87),(218,144,95),(231,159,106),(240,169,115),(242,175,119)],'hm6':[(228,145,99),(246,172,128),(251,193,153)],'hf8v2':[(192,105,61),(223,133,82),(249,167,109)],'hm8':[(158,84,52),(177,102,66),(196,112,70),(213,131,85),(229,147,95),(249,171,113)]}
EYES=list(CFG['eye_boxes_exclusive']);MOUTHS=list(CFG['mouth_boxes_exclusive'])
EN=['Sparkle','Wide sparkle','Soft gaze','Bright gaze','Half-lidded','Round gentle','Closed smile','Calm gaze','Curly sparkle'];TH=['ตาประกาย','ตาโตใส','ตานุ่ม','ตาใส','ตาปรือ','ตากลม','หลับยิ้ม','ตาสงบ','ตาวาว']
MN=['Toothy smile','Tiny open','Soft smile','Small smile','Pursed smile','Bright smile','Flat smile','Wide grin'];MT=['ยิ้มฟัน','อ้าเล็ก','ยิ้มอ่อน','ยิ้มเล็ก','เม้มยิ้ม','ยิ้มใส','ยิ้มตรง','ยิ้มกว้าง']
TARGET={0:[(27,19),(37,19)],1:[(33,19),(41,19)],2:[(39,19)],6:[(25,19)],7:[(32,19),(23,19)]}
MTARGET={0:(32,25),1:(37,24),2:(40,24),6:(25,24),7:(26,24)}
J=json.loads((R/'kid8.json').read_text());face=np.array(Image.open(R/'kid8-face-1.png').convert('RGBA'));F=face[:,:,3]>0
AUDIT={'spec_revision':15,'credits':0,'source_files':{},'owner_authorized_edits':['Additional frontal eye reflection to satisfy symmetry','Redraw side mouth details to retain the frontal expression'], 'features':[]};NAMES={}

def extract(tag,d,box,part):
 path=R/('kid-b1-'+tag+'-raw.png');AUDIT['source_files'][path.name]=hashlib.sha256(path.read_bytes()).hexdigest();raw=np.array(Image.open(path).convert('RGBA'))[:,64*d:64*d+64]
 x1,y1,x2,y2=box;pts=[];skin=SOURCES[tag];base=set(skin[-2:])
 coordinates=CFG['mouth_native_pixels'][tag][DIRS.index(d)] if part=='mouth' else [[x,y] for y in range(y1,y2) for x in range(x1,x2)]
 skin_coordinates=CFG['mouth_skin_pixels'][tag][DIRS.index(d)] if part=='mouth' else []
 for x,y in coordinates:
   color=tuple(map(int,raw[y,x,:3]));alpha=int(raw[y,x,3])
   if not alpha or (part=='eyes' and color in base):continue
   group='eye' if part=='eyes' else 'mouth';out=color
   is_skin=(color in skin or (color[0]>205 and color[0]-color[2]>65 and color[1]>115)) if part=='eyes' else [x,y] in skin_coordinates
   if is_skin:
    near=min(range(len(skin)),key=lambda k:sum((skin[k][c]-color[c])**2 for c in range(3)))
    out=SKIN[round(near/(len(skin)-1)*5)];group='skin'
   pts.append({'source_xy':[x,y],'source_rgba':list(map(int,raw[y,x])),'xy':[x,y],'rgb':list(out),'group':group})

 return pts

def place(pts,d,target,part):
 assert pts,'empty feature';xs=[p['xy'][0] for p in pts];ys=[p['xy'][1] for p in pts];cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
 desired=(round(target[0]-cx),round(target[1]-cy));allowed=F[:,64*d:64*d+64].copy()
 if part=='mouth':allowed=ndi.binary_erosion(allowed);allowed[:23]=False
 else:allowed[23:]=False
 choices=[]
 for dy in range(desired[1]-5,desired[1]+6):
  for dx in range(desired[0]-5,desired[0]+6):
   if all(0<=p['xy'][0]+dx<64 and 0<=p['xy'][1]+dy<64 and allowed[p['xy'][1]+dy,p['xy'][0]+dx] for p in pts):choices.append(((dx-desired[0])**2+(dy-desired[1])**2,dx,dy))
 assert choices,('feature does not fit',part,d,target,len(pts),[min(xs),min(ys),max(xs),max(ys)])
 _,dx,dy=min(choices)
 out=[]
 for p in pts:out.append({**p,'xy':[p['xy'][0]+dx,p['xy'][1]+dy],'translation':[dx,dy]})
 return out

def reflect(pts):
 xs=[p['xy'][0] for p in pts];return [{**p,'xy':[min(xs)+max(xs)-p['xy'][0],p['xy'][1]],'reflected':True} for p in pts]

def sparkle_left(pts,tag):
 pts=[dict(p) for p in pts]
 # Explicit native glint selection, distinct from the white of the eye.
 source_glint={'pilot-hf1':[38,20],'hf2':[28,22]}.get(tag)
 if source_glint is None:return pts
 glint=next((p for p in pts if p['source_xy']==source_glint),None)
 if glint is None:return pts
 eye=[p for p in pts if p['group']=='eye'];xmin=min(p['xy'][0] for p in eye);ymin=min(p['xy'][1] for p in eye)
 target=[xmin+1,ymin+1]
 xmid=(xmin+max(p['xy'][0] for p in eye))/2
 candidates=[p for p in eye if p['xy'][0]<=xmid and p['xy'][1]>=ymin+1]
 q=min(candidates,key=lambda p:(p['xy'][0]-target[0])**2+(p['xy'][1]-target[1])**2)
 if q is not glint:
  glint['xy'],q['xy']=q['xy'],glint['xy'];q['highlight_swap']=True
 glint['highlight_swap']=True;glint['iris_glint']=True
 return pts

def source_label(tag):return 'H-F1' if tag=='pilot-hf1' else 'H-'+tag[1:].upper().replace('V2','')

def polish_profile(pieces,tag,n,d):
 """Owner explicitly authorized profile redraw after inspecting native limits.
 Keep native frontal designs; use their mouth RGBs for missing side details.
 """
 if d==0:return pieces
 patterns={1:['.T.','LLL'],2:['DD','PP'],6:['.TT.','LLLL'],8:['.TT.','LLLL','..L.']}
 if n not in patterns:return pieces
 teeth=any(min(p['rgb'])>=200 and max(p['rgb'])-min(p['rgb'])<50 for p in pieces[0])
 if n!=2 and teeth:return pieces
 front=extract(tag,0,CFG['mouth_boxes_exclusive'][tag][0],'mouth')
 native=[p['rgb'] for p in front if p['group']=='mouth']
 dark=min(native,key=sum);white=max(native,key=sum)
 pink=[187,96,77] if n==2 else dark
 colors={'T':white,'L':dark,'D':dark,'P':pink}
 shape=patterns[n];origin=min(p['xy'][0] for p in pieces[0]),min(p['xy'][1] for p in pieces[0])
 points=[]
 for y,row in enumerate(shape):
  for x,c in enumerate(row):
   if c!='.':points.append({'source_xy':None,'source_rgba':None,'xy':[origin[0]+x,origin[1]+y],'rgb':colors[c],'group':'mouth','edit':'owner_authorized_profile_redraw','color_source':'same head frontal mouth'})
 return [points]

def build():
 global J
 J['parts']=[p for p in J['parts'] if p['part'] not in ('eyes','mouth')]
 for key in list(J['regions']):
  if key.startswith(('kid8-eyes-','kid8-mouth-')):del J['regions'][key]
 for part,tags in [('eyes',EYES),('mouth',MOUTHS)]:
  for n,tag in enumerate(tags,1):
   out=np.zeros((64,512,4),np.uint8);regs={g:np.zeros((64,512),bool) for g in J['groups']}
   for di,d in enumerate(DIRS):
    boxes=CFG['eye_boxes_exclusive'][tag][di] if part=='eyes' else [CFG['mouth_boxes_exclusive'][tag][di]]
    pieces=[extract(tag,d,b,part) for b in boxes]
    if part=='mouth':pieces=polish_profile(pieces,tag,n,d)
    if part=='eyes' and d==0:
     chosen=pieces[1] if n==1 else pieces[0]
     pieces=[reflect(chosen),chosen] if n==1 else [chosen,reflect(chosen)]
     pieces=[sparkle_left(p,tag) for p in pieces]
    placed=[]
    for side,piece in enumerate(pieces):
     target=TARGET[d][side] if part=='eyes' else MTARGET[d];p=place(piece,d,target,part);placed+=p
     AUDIT['features'].append({'part':part,'option':n,'source':source_label(tag),'direction':DN[di],'side':side,'pixels':p})
    for p in placed:
     x,y=p['xy'];out[y,x+64*d]=[*p['rgb'],255];regs[p['group']][y,x+64*d]=1
   file=f'kid8-{part}-{n}.png';Image.fromarray(out).save(R/file,optimize=True);J['regions'][file]={g:runs(m) for g,m in regs.items() if m.any()}
   names=(TH[n-1],EN[n-1]) if part=='eyes' else (MT[n-1],MN[n-1]);J['parts'].append({'file':file,'part':part,'option':n,'nameTh':names[0],'nameEn':names[1],'source':source_label(tag)})
 # Rebuild palettes from all actual per-region pixels. RGB shared by source
 # whites/ink is safe because recolouring is scoped to non-overlapping RLE.
 for g in J['groups']:
  colors=set()
  for f,gs in J['regions'].items():
   if g not in gs:continue
   a=np.array(Image.open(R/f).convert('RGBA'))
   for y,x,length in gs[g]:colors.update(tuple(map(int,c)) for c in a[y,x:x+length,:3])
  old=J['groups'][g];new=['#'+''.join(f'{v:02X}' for v in c) for c in sorted(colors,key=sum)]
  if g=='skin':assert set(new)==set(old);new=old
  J['groups'][g]=new
 J['spec']='ASSET_SPEC_08_kid_base.md v15';J['revision']='C2';J['defaults']['f'].update(eyes=1,mouth=1);J['defaults']['m'].update(eyes=6,mouth=8)
 (R/'kid8.json').write_text(json.dumps(J,ensure_ascii=False,separators=(',',':'))+'\n');(R/'kid8-c2-qa.json').write_text(json.dumps(AUDIT,ensure_ascii=False,indent=2)+'\n')
 q=json.loads((R/'kid8-qa.json').read_text());q.update(spec_revision=15,base_spec_revision=13,reflected_pieces=9)
 q['c2']={'source_audit':'kid8-c2-qa.json','native_eye_options':9,'native_mouth_options':8,'owner_authorized_profile_redraw':True,'resampled_pieces':0}
 (R/'kid8-qa.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
 preview()

def preview():
 j=json.loads((R/'kid8.json').read_text());base=Image.new('RGBA',(512,64))
 for part in ('hairback','face','hair'):base=Image.alpha_composite(base,Image.open(R/f'kid8-{part}-{6 if part!="face" else 1}.png'))
 for part,count in [('eyes',9),('mouth',8)]:
  # Native face-only32px crops retain pixel size; 5x enlargement is review only.
  out=Image.new('RGB',(64+5*64*5,count*36*5+40),(60,70,80));dr=ImageDraw.Draw(out);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',28)
  for col,d in enumerate(DIRS):dr.text((64+col*320+140,4),DN[col],font=font,fill='white')
  for n in range(1,count+1):
   # Hair goes in front of the native facial features.
   a=Image.new('RGBA',(512,64))
   for p in ('hairback','face',part,'hair'):a=Image.alpha_composite(a,Image.open(R/f'kid8-{p}-{n if p==part else 1 if p=="face" else 6}.png'))
   dr.text((8,40+(n-1)*180+65),str(n),font=font,fill='white')
   for col,d in enumerate(DIRS):
    cell=a.crop((d*64,0,d*64+64,36)).resize((320,180),Image.Resampling.NEAREST);out.paste(cell,(64+col*320,40+(n-1)*180),cell)
  out.save(R/f'kid8-{part}-c2.png',optimize=True)
  from asset_png_lossless import optimize
  optimize(R/f'kid8-{part}-c2.png')
if __name__=='__main__':build()
