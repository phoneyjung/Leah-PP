# check_H9_painted.py — ตรวจกติกาผัง (MAP_SPEC_H9 หัวข้อ 0) กับ "ภาพฉากจริง" ของ H9 + เขียน map-H9-spec.json ฉบับวัดจากภาพ
# รัน: python3 check_H9_painted.py map-H9-village.jpg [โฟลเดอร์ปลายทาง]
import numpy as np, cv2, json, sys, os
from PIL import Image, ImageDraw
SRC=sys.argv[1] if len(sys.argv)>1 else 'map-H9-village.jpg'; OUT=sys.argv[2] if len(sys.argv)>2 else '.'
T=32; W,H=48*T,32*T; t=lambda v:int(round(v*T))
img=Image.open(SRC).convert('RGB'); a=np.asarray(img); hsv=cv2.cvtColor(a,cv2.COLOR_RGB2HSV)
h,s,v=hsv[...,0].astype(int),hsv[...,1].astype(int),hsv[...,2].astype(int)
sand=(h>=14)&(h<=31)&(s>55)&(s<190)&(v>185); sand=cv2.morphologyEx(sand.astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5))); sand=cv2.morphologyEx(sand,cv2.MORPH_CLOSE,np.ones((11,11)))>0
water=(h>88)&(h<125)&(s>90)&(v>120); water=cv2.morphologyEx(water.astype(np.uint8),cv2.MORPH_OPEN,np.ones((7,7))); water=cv2.dilate(water,np.ones((9,9)))>0   # + rocky banks
# ---- measured on the painting (tile units) ----
CORNERS=[(0,0,8,4),(39,0,48,6),(38,28,48,32),(0,28,7,32)]
BLD={  # name: (x0, y0_top_of_roof, x1, y_base, door_x)
 'clock_shop':(4.1,5.4,8.5,9.75,6.3),'post_office':(11.9,6.4,17.2,10.8,14.4),'mage_tower':(24.7,4.4,28.3,10.5,26.55),'blacksmith':(33.9,7.9,38.7,11.8,36.3),
 'restaurant':(5.5,17.6,9.9,21.0,7.7),'item_shop_nuan':(12.4,17.5,16.9,21.0,14.7),'inn':(24.5,18.0,29.7,22.0,27.05),'fruit_stall':(34.7,17.6,37.4,19.85,36.05),
 'house_daeng':(4.1,22.7,8.2,26.0,6.1),'house_fon':(11.5,22.75,15.5,26.0,13.5),'house_dao':(35.65,22.3,39.2,25.4,37.4),'house_mek':(41.3,17.7,45.2,21.0,43.2)}
CRYSTAL=(21.8,14.75); LIGHT_STONE=(18.0,18.5); WELL=(9.5,11.25); BOARD=(25.7,17.2); PIER=(28.9,25.05,31.3,27.3); BRIDGE=(29.6,12.9,33.9,16.5)
HILL=(42.3,3.6,6.4,4.4); CAVE=(41.7,7.1); CAVE_PATH=(40.8,6.6,42.6,13.5)
EXITS={'w':(0,15.0),'e':(48,15.0),'n':(21.5,0),'s':(21.8,32)}
ARR={'from_w':(2,15.0),'from_e':(46,15.0),'from_n':(21.5,2.5),'from_s':(21.8,29.5),'from_cave':(41.7,9.2),'new_game':(21.8,18.6)}
NPC={'mage_lumin':(26.55,11.6),'nuan':(14.7,22.0),'mom':(19.4,17.6),'dad':(36.3,12.9),'leah':(21.0,18.9)}
LAMPS=[(11.3,10.9),(18.1,10.9),(23.6,5.7),(24.1,10.3),(39.9,9.0),(39.3,11.7),(10.4,20.4),(17.4,19.2),(8.8,25.0),(16.1,25.4),(23.7,20.8),(34.8,17.6),(40.7,19.9),(35.0,24.0)]
SIGNS=[(1.8,12.8),(23.5,1.4),(45.7,12.8),(23.0,28.6)]; BENCH=[(18.75,12.25),(24.6,12.0)]
# ---- collision from the painting ----
Z=lambda:np.zeros((H,W),np.uint8); corner=Z(); solid=Z()
for x0,y0,x1,y1 in CORNERS: corner[t(y0):t(y1),t(x0):t(x1)]=255
for n,(x0,y0,x1,yb,dx) in BLD.items(): solid[t(y0):t(yb),t(x0):t(x1)]=255
hill=Z(); cv2.ellipse(hill,(t(HILL[0]),t(HILL[1])),(t(HILL[2]),t(HILL[3])),0,0,360,255,-1); hill[t(CAVE_PATH[1]):t(CAVE_PATH[3]),t(CAVE_PATH[0]):t(CAVE_PATH[2])]=0; solid[hill>0]=255
cv2.circle(solid,(t(CRYSTAL[0]),t(CRYSTAL[1])),t(1.6),255,-1); cv2.circle(solid,(t(WELL[0]),t(WELL[1])),t(.6),255,-1); cv2.circle(solid,(t(BOARD[0]),t(BOARD[1])),t(.5),255,-1)
wat=water.copy(); wat[t(BRIDGE[1]):t(BRIDGE[3]),t(BRIDGE[0]):t(BRIDGE[2])]=False; wat[t(PIER[1]):t(PIER[3]),t(PIER[0]):t(PIER[2])]=False
wat[:,:t(27)]=False; wat[:,t(36.5):]=False                      # the only water is the river (the light-stone pad is pale blue stone)
walk=(corner==0)&(solid==0)&(~wat)
er=cv2.erode(walk.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(41,41))); num,lab=cv2.connectedComponents(er,connectivity=4)
def comp(x,y):
    X,Y=min(W-1,t(x)),min(H-1,t(y)); w=lab[max(0,Y-30):Y+31,max(0,X-30):X+31]; q=w[w>0]; return int(np.bincount(q).argmax()) if len(q) else None
base=comp(21.8,18.6)
pts={**{f'door:{n}':(dx,yb+0.8) for n,(x0,y0,x1,yb,dx) in BLD.items()},**{f'exit:{k}':(min(46.5,max(1.5,x)),min(30.5,max(1.5,y))) for k,(x,y) in EXITS.items()},
     **{f'arr:{k}':p for k,p in ARR.items()},'light_stone':(LIGHT_STONE[0],LIGHT_STONE[1]+1),'pier':((PIER[0]+PIER[2])/2-0.6,(PIER[1]+PIER[3])/2),'cave':(CAVE[0],CAVE[1]+1.2),'well':(WELL[0],WELL[1]+1.3),'board':(BOARD[0],BOARD[1]-1.1),
     'east_bank':(40,15),'crystal_front':(CRYSTAL[0],CRYSTAL[1]+2.4),**{f'npc:{k}':p for k,p in NPC.items()}}
bad=[k for k,(x,y) in pts.items() if comp(x,y)!=base]
incorner=lambda x,y: any(x0<=x<=x1 and y0<=y<=y1 for x0,y0,x1,y1 in CORNERS)
dcorner=lambda x,y: min(float(np.hypot(max(x0-x,0,x-x1),max(y0-y,0,y-y1))) for x0,y0,x1,y1 in CORNERS)
inter={**{f'door:{n}':(dx,yb) for n,(x0,y0,x1,yb,dx) in BLD.items()},**{f'exit:{k}':p for k,p in EXITS.items()},**{f'arr:{k}':p for k,p in ARR.items()},**{f'npc:{k}':p for k,p in NPC.items()},
       'light_stone':LIGHT_STONE,'well':WELL,'board':BOARD,'cave':CAVE,'crystal':CRYSTAL,'pier':((PIER[0]+PIER[2])/2,(PIER[1]+PIER[3])/2)}
corner_viol=[k for k,(x,y) in inter.items() if incorner(x,y)]
door_gap={n:round(dcorner(dx,yb),1) for n,(x0,y0,x1,yb,dx) in BLD.items()}
door_on_path={n:bool(sand[t(yb+0.15):t(yb+1.0),t(dx-.5):t(dx+.5)].mean()>.5) for n,(x0,y0,x1,yb,dx) in BLD.items()}
def run(mask,x=None,y=None):       # longest run of road pixels across a column (x) or a row (y)
    line=mask[:,t(x)] if x is not None else mask[t(y),:]; best=cur=0
    for q in line: cur=cur+1 if q else 0; best=max(best,cur)
    return best/T
road_w={'west':round(float(np.median([run(sand[t(11):t(19)],x=x) for x in (2,5,8,11)])),1),'east':round(float(np.median([run(sand[t(11):t(19)],x=x) for x in (38,43.5,46)])),1),
        'north':round(float(np.median([run(sand[:,t(17):t(26)],y=y) for y in (1.5,3,5)])),1),'south':round(float(np.median([run(sand[:,t(17):t(26)],y=y) for y in (24,27.5,30.5)])),1)}
arr_ok={k:bool(2<=x<=46 and 2<=y<=30 and not incorner(x,y) and sand[t(y),t(x)]) for k,(x,y) in ARR.items() if k not in('new_game',)}
tiles=walk.reshape(32,T,48,T).mean((1,3))>=.5; free=48*32-sum((x1-x0)*(y1-y0) for x0,y0,x1,y1 in CORNERS)
disc=np.zeros((H,W),bool); yy,xx=np.ogrid[:H,:W]; disc=((xx-t(CRYSTAL[0]))**2+(yy-t(CRYSTAL[1]))**2)<t(1.5)**2
centre_empty=round(float(((s<45)&(v>120))[disc].mean()*100),0)      # grey paving share inside the crystal spot
R={'points_checked':len(pts),'unreachable':bad,'corner_violations':corner_viol,'door_to_corner_gap_min':min(door_gap.values()),'doors_with_path':sum(door_on_path.values()),'doors_without_path':[k for k,q in door_on_path.items() if not q],
   'arrivals_on_road':arr_ok,'road_width':road_w,'walk_tiles':int(tiles.sum()),'free_tiles':free,'walk_pct':round(100*tiles.sum()/free,1),'crystal_spot_grey_paving_pct':centre_empty,'buildings':len(BLD)}
print(json.dumps(R,ensure_ascii=False,indent=1))
spec={'block':'H9','name':'หมู่บ้านพาเพลิน','version':'1.4','size':[48,32],'measured_from':'map-H9-village.jpg (ภาพฉากจริง · ตำแหน่งทั้งหมดวัดจากภาพ)',
 'rule':'HUD corners: no door, exit, NPC, pickup or needed path inside them; collision = painted building boxes + river + hill + crystal; trees are decor (walkable)',
 'buildings':{n:{'box':[x0,y0,x1,yb],'door':[dx,yb]} for n,(x0,y0,x1,yb,dx) in BLD.items()},'doors':{n:[dx,yb] for n,(x0,y0,x1,yb,dx) in BLD.items()},
 'exits':{'n':{'at':list(EXITS['n']),'to':'H8 → H7 capital','phase1':'locked: ต้นไม้ล้มขวางทางไปเมืองหลวง ช่างกำลังเคลียร์'},'w':{'at':list(EXITS['w']),'to':'G9 home+farm'},
          'e':{'at':list(EXITS['e']),'to':'I9 (บ้านต้นเห็ด) → J9 mushroom village','phase1':'locked: หมอกยังหนาทางไปหมู่บ้านเห็ด'},'s':{'at':list(EXITS['s']),'to':'H10 forest','phase1':'locked: ป่าทางใต้ยังรก ผู้พิทักษ์กำลังเปิดทาง'}},
 'arrivals':{k:list(p) for k,p in ARR.items()},'crystal':list(CRYSTAL),'crystal_drawn_by_game':'crystal-paplern.png (ภาพฉากเว้นลานหินว่าง)','light_stone':list(LIGHT_STONE),
 'cave_mouth':list(CAVE),'hill':{'centre':[HILL[0],HILL[1]],'radius':[HILL[2],HILL[3]],'cave_path':list(CAVE_PATH)},'bridge':list(BRIDGE),'fishing_pier':list(PIER),'well':list(WELL),'notice_board':list(BOARD),
 'river':'north → south, east of the plaza; crosses the top edge at x 31.6 and the bottom edge at x 33.8; stone bridge on the east road',
 'npc_spots':{k:list(p) for k,p in NPC.items()},'lamps':[list(p) for p in LAMPS],'signs':[list(p) for p in SIGNS],'benches':[list(p) for p in BENCH],
 'hud_zones':{'tl':[0,0,8,4],'tr':[39,0,48,6],'br':[38,28,48,32],'bl':[0,28,7,32]},
 'edges':{'n':{'neighbour':'H8','road':21.5,'river':31.6},'s':{'neighbour':'H10','road':21.8,'river':33.8},'w':{'neighbour':'G9','road':15.0,'river':None},'e':{'neighbour':'I9','road':15.0,'river':None}},
 'checks':R}
json.dump(spec,open(os.path.join(OUT,'map-H9-spec.json'),'w'),ensure_ascii=False,indent=1)
# overlay picture
o=img.copy(); d=ImageDraw.Draw(o,'RGBA')
ov=np.zeros((H,W,4),np.uint8); ov[wat]=(255,0,0,70); ov[hill>0]=(255,0,0,70); o.alpha_composite(Image.fromarray(ov)) if o.mode=='RGBA' else None
o=Image.alpha_composite(img.convert('RGBA'),Image.fromarray(ov)); d=ImageDraw.Draw(o,'RGBA')
for n,(x0,y0,x1,yb,dx) in BLD.items(): d.rectangle((t(x0),t(y0),t(x1),t(yb)),outline=(255,255,255,255),width=3); d.ellipse((t(dx)-8,t(yb)-8,t(dx)+8,t(yb)+8),fill=(255,60,60,255),outline=(255,255,255,255),width=2)
d.ellipse((t(CRYSTAL[0]-1.6),t(CRYSTAL[1]-1.6),t(CRYSTAL[0]+1.6),t(CRYSTAL[1]+1.6)),outline=(190,120,255,255),width=4)
for k,(x,y) in ARR.items(): d.rectangle((t(x)-6,t(y)-6,t(x)+6,t(y)+6),fill=(80,255,255,230))
for k,(x,y) in NPC.items(): d.ellipse((t(x)-6,t(y)-6,t(x)+6,t(y)+6),fill=(255,160,220,255))
for x,y in LAMPS: d.ellipse((t(x)-7,t(y)-7,t(x)+7,t(y)+7),outline=(255,230,80,255),width=3)
for nm,(x,y) in (('ls',LIGHT_STONE),('well',WELL),('board',BOARD),('cave',CAVE)): d.rectangle((t(x)-9,t(y)-9,t(x)+9,t(y)+9),outline=(255,255,255,255),width=2)
d.rectangle((t(PIER[0]),t(PIER[1]),t(PIER[2]),t(PIER[3])),outline=(255,255,255,255),width=2); d.rectangle((t(BRIDGE[0]),t(BRIDGE[1]),t(BRIDGE[2]),t(BRIDGE[3])),outline=(255,255,255,255),width=2)
for x0,y0,x1,y1 in CORNERS: d.rectangle((t(x0),t(y0),t(x1),t(y1)),fill=(20,16,30,110))
o.convert('RGB').save(os.path.join(OUT,'H9-check-overlay.jpg'),quality=88)
