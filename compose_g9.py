# compose_g9.py — ประกอบฉาก G9 จากผัง + วัตถุแยกชิ้น (ภาพตัวอย่างนอกเกม เพื่อตรวจหน้าตาก่อนเขียนตัวประกอบในเกม)
import numpy as np, cv2, json, random
from PIL import Image, ImageDraw, ImageFilter
random.seed(9); rs=np.random.RandomState(9)
S=json.load(open('/home/claude/g9/map-G9-spec.json')); U=64; W,H=48*U,32*U
plan=np.asarray(Image.open('/home/claude/g9/map-G9-home-farm-layout.png').convert('RGB')).astype(int)
def mask(cols,tol=10):
    m=np.zeros(plan.shape[:2],bool)
    for c in cols: m|=(np.abs(plan-np.array(c)).sum(-1)<tol)
    return m
def up(m,blur=7):                       # 2x, smooth outline
    a=cv2.resize(m.astype(np.uint8)*255,(W,H),interpolation=cv2.INTER_LINEAR); a=cv2.GaussianBlur(a,(0,0),blur); return a>127
road=up(mask([(222,204,160),(232,216,176)])); water=up(mask([(60,110,200)]),6); woods=up(mask([(88,146,82),(46,96,58),(60,120,70),(50,112,62),(34,84,48)]),10)
rockm=np.zeros((H,W),np.uint8); cv2.ellipse(rockm,(int(3.5*U),int(28.5*U)),(int(6*U),int(4.4*U)),0,0,360,1,-1); rockm=rockm>0
# bridge / dock gaps in the plan road mask are fine; water under them is drawn first
def tile(img,w,h):
    t=np.asarray(img.convert('RGB')); th,tw=t.shape[:2]; t2=np.concatenate([t,t[:,::-1]],1); t4=np.concatenate([t2,t2[::-1]],0)
    return np.tile(t4,(h//(2*th)+1,w//(2*tw)+1,1))[:h,:w].copy()
src=Image.open('/home/claude/q4/r1.png').convert('RGB')
def quilt(img,w,h,p=56,step=40):          # non-repeating ground: random soft-edged patches of the sample
    t=np.asarray(img.convert('RGB')).astype(np.float32); th,tw=t.shape[:2]; acc=np.zeros((h+p,w+p,3),np.float32); wt=np.zeros((h+p,w+p,1),np.float32)
    yy,xx=np.mgrid[:p,:p]; m=(np.minimum(np.minimum(xx,p-1-xx),np.minimum(yy,p-1-yy))/(p*0.28)).clip(0,1)[...,None]+1e-3
    for y in range(0,h,step):
        for x in range(0,w,step):
            sx=rs.randint(0,tw-p); sy=rs.randint(0,th-p); patch=t[sy:sy+p,sx:sx+p]
            if rs.rand()<.5: patch=patch[:,::-1]
            acc[y:y+p,x:x+p]+=patch*m; wt[y:y+p,x:x+p]+=m
    return (acc/np.maximum(wt,1e-3))[:h,:w].astype(np.uint8)
grass=quilt(Image.open('/home/claude/scale/grass_plain.png'),W,H); dirt=quilt(src.crop((640,935,790,1005)),W,H,p=48,step=34)
g=grass.astype(np.float32)
dark=np.clip(g*np.array([.74,.86,.80]),0,255)                                  # forest floor
sm=lambda m,b: cv2.GaussianBlur(m.astype(np.float32),(0,0),b)[...,None]
g=g*(1-sm(woods,18))+dark*sm(woods,18)
# rock foot: grey-green ground
grey=np.clip(grass.astype(np.float32)*np.array([.78,.74,.80])+np.array([40,36,34]),0,255); g=g*(1-sm(rockm,14))+grey*sm(rockm,14)
# road with a darker rim
rim=cv2.dilate(road.astype(np.uint8),np.ones((9,9)))>0
g[rim&~road]=g[rim&~road]*np.array([.92,.80,.55])+np.array([40,22,0])
g[road]=dirt[road]
# water: flat blue with soft ripples + pale shore line + dark bank
yy,xx=np.mgrid[:H,:W]; wav=(np.sin(xx/9.0+yy/23.0)+np.sin(xx/17.0-yy/11.0))*6
wcol=np.stack([58+wav*0.6,132+wav,216+wav*0.8],-1)
bank=cv2.dilate(water.astype(np.uint8),np.ones((13,13)))>0; g[bank&~water]=g[bank&~water]*np.array([.62,.58,.50])+np.array([30,24,14])
g[water]=wcol[water]; shore=water&~(cv2.erode(water.astype(np.uint8),np.ones((7,7)))>0); g[shore]=g[shore]*.35+np.array([210,236,255])*.65
ground=Image.fromarray(np.clip(g,0,255).astype(np.uint8)).convert('RGBA')
# ---- sprites ----
A2=Image.open('objects-2.png').convert('RGBA'); P2=json.load(open('objects-2.json'))
A1=Image.open('/home/claude/v108/objects-1.png').convert('RGBA'); P1=json.load(open('/home/claude/v108/objects-1.json'))
def spr(n,scale=1.0,h=None):
    if n in P2: x,y,w,hh=P2[n]; im=A2.crop((x,y,x+w,y+hh))
    else: x,y,w,hh=P1[n]; im=A1.crop((x,y,x+w,y+hh))
    if h: scale=h/im.height
    return im if scale==1 else im.resize((max(2,round(im.width*scale)),max(2,round(im.height*scale))),Image.LANCZOS)
house=Image.open('/home/claude/hs/farm-house-1.png').convert('RGBA'); house=house.resize((245,round(313*245/256)),Image.LANCZOS)
OB=[]   # (base_y, x_centre, sprite)  in px
def add(n,tx,ty,im=None,**k): OB.append((ty*U,tx*U,im if im is not None else spr(n,**k),n))
def nine(n,w,h,c=22):                    # stretch a framed sprite to any size, corners kept
    s=spr(n); sw,sh=s.size; out=Image.new('RGBA',(w,h)); xs=[0,c,sw-c,sw]; ys=[0,c,sh-c,sh]; xd=[0,c,w-c,w]; yd=[0,c,h-c,h]
    for j in range(3):
        for i in range(3):
            p=s.crop((xs[i],ys[j],xs[i+1],ys[j+1])).resize((xd[i+1]-xd[i],yd[j+1]-yd[j]),Image.LANCZOS); out.paste(p,(xd[i],yd[j]))
    return out
FLAT=[]  # things lying on the ground (drawn before everything else)
x0,y0,x1,y1=S['house']['forecourt']; FLAT.append((nine('terrace',int((x1-x0)*U),int((y1-y0)*U)+16,40),x0*U,y0*U))
for k,v in S['plots'].items():
    x0,y0,x1,y1=v['rect']; FLAT.append((nine('plot',int((x1-x0)*U),int((y1-y0)*U)),x0*U,y0*U))
bx,by=S['footbridge']; b=spr('bridge'); FLAT.append((b,bx*U-b.width//2,by*U-b.height//2))
dx,dy=S['fishing_dock']; d=spr('dock'); FLAT.append((d,dx*U-d.width//2,dy*U-d.height//2+10))
cx,cy=S['converter']; p=spr('pad'); FLAT.append((p,cx*U-p.width//2,cy*U-p.height//2))
# buildings and props from the spec
hd=S['doors']['our_house']; add('house',hd[0]+0.02,10.15,im=house)
add('shed',S['doors']['shed'][0],S['doors']['shed'][1]); add('hut',S['doors']['friend_hut'][0],S['doors']['friend_hut'][1])
add('oak',S['big_tree'][0],S['big_tree'][1]+1.5)
for x,y in S['lamps']: add('lamp',x,y,h=88)
for x,y in S['gate_pillars']: add('pillar',x,y)
add('mailbox',*S['mailbox']); add('board',22.9,10.9)
for x,y in S['signs']: add('sign',x,y)
for x,y in S['benches']: add('bench',x,y)
add('well',S['well'][0],S['well'][1]+.3); fx,fy=S['campfire']; add('firepit',fx,fy+.2); add('logSeatL',fx-1.1,fy+.5); add('logSeatR',fx+1.1,fy+.5); add('log',fx,fy+1.3)
add('crate',S['shipping_bin'][0],S['shipping_bin'][1],h=36); add('scarecrow',27.6,20.2)
# paddock fence with an open gate
fx0,fy0,fx1,fy1=S['friend_yard']; gx=S['friend_yard_gate'][0]
x=fx0
while x<fx1-0.5:
    add('fenceH',x+0.75,fy0+.25)
    if not (gx-1.2<x+0.75<gx+1.2): add('fenceH',x+0.75,fy1)
    x+=1.5
y=fy0+1.1
while y<fy1+.2: add('fenceV',fx0,y); add('fenceV',fx1,y); y+=1.1
add('gate',gx-0.75,fy1); add('gatePost',gx+0.85,fy1)
# closed ways
add('logs',3.2,16.7); add('logs',2.8,18.3); add('gate',35,3.6,im=spr('gate')) ; OB.pop(); 
g1=A1.crop((P1['gate'][0],P1['gate'][1],P1['gate'][0]+P1['gate'][2],P1['gate'][1]+P1['gate'][3])); OB.append((3.7*U,35*U,g1,'lockgate')); add('thicket',12,30.2)
# trees: plan dots + forest fill
dots=mask([(60,120,70),(50,112,62)]).astype(np.uint8); n,lab,st,cen=cv2.connectedComponentsWithStats(dots,connectivity=8); k=0
for i in range(1,n):
    if st[i][4]<60: continue
    cx,cy=cen[i]/32; 
    if abs(cx-S['big_tree'][0])<2.5 and abs(cy-S['big_tree'][1])<2.5: continue
    add('tree1' if k%2 else 'tree2',cx,cy+1.2); k+=1
wm=mask([(88,146,82),(46,96,58),(34,84,48)]); placed=[]
for ty in np.arange(0.8,32.5,1.55):
    for tx in np.arange(0.4,48,1.75):
        x=tx+rs.uniform(-.45,.45); y=ty+rs.uniform(-.35,.35); px,py=int(min(47.9,max(0,x))*32),int(min(31.9,max(0,y-0.6))*32)
        if not wm[py,px]: continue
        if abs(x-S['big_tree'][0])<4 and abs(y-S['big_tree'][1]-1)<3.2: continue
        if abs(x-fx)<2.2 and abs(y-fy)<2.4: continue
        if np.hypot(x-3.5,y-28.5)<5.2 or (abs(x-12)<1.6 and y>27) : continue
        add('tree1' if rs.rand()<.55 else 'tree2',x,y)
# small decor on the lawn (never on a road, water, building or plot)
block=mask([(222,204,160),(232,216,176),(60,110,200),(134,92,58),(150,110,70),(140,134,128)]); block=cv2.dilate(block.astype(np.uint8),np.ones((13,13)))>0
def free(x,y):
    if not(0.5<x<47.5 and 0.6<y<31.5): return False
    if block[int(y*32),int(x*32)]: return False
    for (by2,bx2,im,nm) in OB:
        if nm in('house','shed','hut','oak') and abs(x*U-bx2)<im.width/2+12 and by2-im.height*0.55<y*U<by2+14: return False
    xs,ys,xe,ye=S['house']['forecourt']; 
    return not (xs-.3<x<xe+.3 and ys-.2<y<ye+.5)
def scatter(names,count,hrange=None):
    c=0; tries=0
    while c<count and tries<count*40:
        tries+=1; x=rs.uniform(0.6,47.4); y=rs.uniform(0.8,31.4)
        if free(x,y): add(names[rs.randint(len(names))],x,y); c+=1
scatter(['flowerW','flowerY','flowerR'],70); scatter(['grass'],90); scatter(['bush','bushFlower'],14); scatter(['rockS','rockM'],10); scatter(['mushroom'],8); scatter(['log'],2)
pc=S['pond']['centre']; pr=S['pond']['radius']
for ang in [200,235,300,330,20,150]:
    a=np.deg2rad(ang); add('reeds',pc[0]+np.cos(a)*(pr[0]+.15),pc[1]+np.sin(a)*(pr[1]+.2)+.3)
for dxp,dyp in [(-1.4,.6),(1.2,.9),(.2,1.5),(1.9,-.2)]: l=spr('lily'); FLAT.append((l,(pc[0]+dxp)*U,(pc[1]+dyp)*U))
for x,y,sc in [(1.2,27.2,2.6),(4.2,28.6,3.0),(2.4,30.6,2.4),(6.6,30.2,2.2),(7.6,27.6,1.8)]: add('rockM',x,y,scale=sc)
# ---- draw ----
out=ground.copy()
for im,x,y in FLAT: out.alpha_composite(im,(int(x),int(y)))
sh=Image.new('RGBA',(W,H),(0,0,0,0)); sd=ImageDraw.Draw(sh)
for by2,bx2,im,nm in OB:
    if im.height>=30: sd.ellipse((bx2-im.width*.36,by2-im.height*.07-4,bx2+im.width*.36,by2+im.height*.05+4),fill=(20,40,20,70))
out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(3)))
for by2,bx2,im,nm in sorted(OB,key=lambda o:o[0]): out.alpha_composite(im,(int(bx2-im.width/2),int(by2-im.height)))
out.convert('RGB').save('g9-assembled.png'); out.convert('RGB').save('g9-assembled.jpg',quality=88)
import collections; print(W,H,'objects',len(OB),'flat',len(FLAT),collections.Counter(o[3] for o in OB).most_common(12))
