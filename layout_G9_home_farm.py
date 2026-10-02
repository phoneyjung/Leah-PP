# layout_G9_home_farm.py — ผังฉาก G9 บ้านเรา·ฟาร์ม + ตรวจกติกาผัง (MAP_SPEC_H9 หัวข้อ 0) + map-G9-spec.json
# ต้นแบบ: layout_H9_village.py · รัน: python3 layout_G9_home_farm.py [โฟลเดอร์ปลายทาง]
import numpy as np, cv2, json, sys, os
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import CubicSpline
from collections import deque
OUT=sys.argv[1] if len(sys.argv)>1 else '.'
T=32; W,H=48*T,32*T; t=lambda v:int(round(v*T))
def smooth(pts,n=300):
    p=np.array(pts,float); u=np.linspace(0,1,n); tt=np.linspace(0,1,len(p)); return np.stack([CubicSpline(tt,p[:,0])(u),CubicSpline(tt,p[:,1])(u)],1)
def stroke(m,pts,w,v=255):
    p=smooth([(t(x),t(y)) for x,y in pts]) if len(pts)>2 else np.array([(t(x),t(y)) for x,y in pts],float)
    for i in range(len(p)-1): cv2.line(m,tuple(map(int,p[i])),tuple(map(int,p[i+1])),v,t(w),cv2.LINE_AA)
Z=lambda:np.zeros((H,W),np.uint8)
road=Z(); water=Z(); solid=Z(); corner=Z(); woods=Z(); field=Z(); knoll=Z(); rock=Z()
CORNERS=[(0,0,8,4),(39,0,48,6),(38,28,48,32),(0,28,7,32)]          # same HUD zones as H9
for x0,y0,x1,y1 in CORNERS: corner[t(y0):t(y1),t(x0):t(x1)]=255
# ---------- terrain ----------
cv2.ellipse(rock,(t(3.5),t(28.5)),(t(6),t(4.4)),0,0,360,255,-1)      # rocky foot of the mountain (world map: peak SW of G9)
cv2.ellipse(knoll,(t(21.6),t(7.6)),(t(8.8),t(5.4)),0,0,360,255,-1)   # low knoll under the house (visual level, walkable)
cv2.ellipse(woods,(t(4.5),t(8)),(t(9.5),t(7.6)),0,0,360,255,-1)         # north-west woods (F8 forest side)
woods[t(28.6):,t(7):t(38)]=255                                        # south tree line (G10 is forest)
cv2.ellipse(woods,(t(10),t(28)),(t(6),t(4.5)),0,0,360,255,-1)
# stream: spring at the rock foot -> pond (stays inside the block: no river edge contract)
stroke(water,[(7.4,25.4),(10,24.7),(13.5,25),(17.3,24.6)],0.9)
POND=(20.5,24.6,3.6,2.5); cv2.ellipse(water,(t(POND[0]),t(POND[1])),(t(POND[2]),t(POND[3])),0,0,360,255,-1)
# ---------- roads ----------
MAIN=[(48,15.88),(42,16.4),(35,15.7),(28,16.3),(21,17),(13,17.5),(6,16.9),(0,17)]     # E edge y16 = H9 contract · W edge y17 -> F9
stroke(road,MAIN,3)
NORTH=[(35,15.7),(34.5,11),(35.4,6),(35,0)]
stroke(road,NORTH,2.2)                 # north trail -> G8 meadow valley
stroke(road,[(12,17.6),(11.5,22),(12.4,27),(12,32)],2.2)               # south trail -> G10 forest camp (footbridge over the stream)
mainroad=road.copy()
stroke(road,[(35,17.2),(35.2,22),(35,27.3)],2)                           # farm lane between the plots
stroke(road,[(20.5,18.2),(20.4,20),(20.5,21.7)],2)
LOOP=[(35,27.3),(31,28.1),(27,27.6),(25.7,24),(25.2,21),(25,18.4)]
stroke(road,LOOP,2)                                                    # loop: farm lane -> pond bank -> back to the main road                     # path to the fishing dock
stroke(road,[(9,16.2),(9.4,14.5),(9.8,13)],2.2)                        # path to the big-tree camp clearing
CAMP=(9.8,11.0); cv2.circle(road,(t(CAMP[0]),t(CAMP[1])),t(2.6),255,-1)
TREE=(9.5,7.2)
# ---------- buildings (x_centre, y_base=door row, w, depth) : standard sizes house 4x3 ----------
B={'our_house':(19.5,10,4,3),'shed':(30.6,13.2,4,3),'friend_hut':(41.5,11.5,4,3)}
HOUSE_LOT=(14.5,3.4,29,10.5)                                           # reserved for 9 upgrade levels; the door never moves
STAGES={'lv1':(17.5,7,21.5,10),'lv2-4':(16.5,6.4,23.5,10),'lv5-6':(16,5,23.5,10),'lv7-9':(15.5,3.6,23.5,10)}   # picture envelope incl. roof (concept-house-levels.jpg): cottage / +wing+deck / 2 floors / 3 floors
HOUSE_MAX=STAGES['lv7-9']; POOL=(24.3,6,28.3,9)                         # pool 4x3 BESIDE the house (behind a 3-floor house it would be hidden)
FORECOURT=(17,10,22,12)                                                # paved front yard 5x2 so visitors never block the door
def build_solid(house_full=False,stage=None):
    s=Z()
    for n,(x,yb,w,dp) in B.items(): s[t(yb-dp):t(yb),t(x-w/2):t(x+w/2)]=255
    if house_full or stage:
        for x0,y0,x1,y1 in ((HOUSE_MAX,POOL) if house_full else (STAGES[stage],)): s[t(y0):t(y1),t(x0):t(x1)]=255
    s[rock>0]=255
    cv2.circle(s,(t(TREE[0]),t(TREE[1])),t(1.0),255,-1)        # big tree trunk
    cv2.circle(s,(t(CAMP[0]),t(CAMP[1])),t(.5),255,-1)         # campfire
    cv2.circle(s,(t(17.4),t(20.9)),t(.45),255,-1)              # well
    return s
solid=build_solid()
bridge=(water>0)&(road>0)
dock=Z(); dock[t(21.5):t(23.4),t(19.9):t(21.1)]=255
PLOTS={'plot1_start':(27,19,33,23),'plot2':(28,23.5,33,26.5),'plot3':(37,19,44,22),'plot4':(37,23,42,27)}   # staggered sizes, not a grid
for x0,y0,x1,y1 in PLOTS.values(): field[t(y0):t(y1),t(x0):t(x1)]=255
def tile_ok(x,y):
    if x<0 or y<0 or x>=48 or y>=32: return False
    X,Y=t(x+.5),t(y+.5); return corner[Y,X]==0 and solid[Y,X]==0 and field[Y,X]==0 and (water[Y,X]==0 or bridge[Y,X])
on_main=lambda x,y: mainroad[t(y+.5),t(x+.5)]>0
for n,(x,yb,w,dp) in B.items():                               # side path from every door to a main road (width 2)
    start=(int(x),int(yb)); prev={start:None}; q=deque([start]); goal=None
    while q:
        c=q.popleft()
        if on_main(*c): goal=c; break
        for dx,dy in ((0,1),(1,0),(-1,0),(0,-1)):
            nx,ny=c[0]+dx,c[1]+dy
            if (nx,ny) not in prev and tile_ok(nx,ny): prev[(nx,ny)]=c; q.append((nx,ny))
    path=[];c=goal
    while c: path.append(c); c=prev[c]
    path=path[::-1]
    for i in range(len(path)-1): stroke(road,[(path[i][0]+.5,path[i][1]+.5),(path[i+1][0]+.5,path[i+1][1]+.5)],2)
    road[t(yb):t(yb+.9),t(x-1):t(x+1)]=255
x0,y0,x1,y1=FORECOURT; road[t(y0):t(y1),t(x0):t(x1)]=255
road[solid>0]=0; road[(water>0)&~bridge]=0
# ---------- points ----------
EXITS={'e':(48,16),'w':(0,17),'n':(35,0),'s':(12,32)}
ARR={'from_e':(46,16),'from_w':(2,17),'from_n':(35,2),'from_s':(12,30),'from_house':(19.5,11.2),'warp_home':(19.5,13.4)}
PROPS={'mailbox':(21.3,14.1),'converter':(24,12.6),'shipping_bin':(26,11.8),'well':(17.4,20.9),'campfire':CAMP,'big_tree':TREE,
       'fishing_dock':(20.5,22.6),'scarecrow':(30,21),'spring':(7.4,25.4)}
NPC={'farm_guide':(31.5,18.4)}
LAMPS=[(38.9,18.0),(36.7,9.1),(23.2,18.8),(16.2,11.1),(8.8,19.4),(4.2,14.6),(22.6,11.1),(13,9.3),(29.6,18.5)]
LAMPS_PAINTED=[(36.7,9.1),(16.2,11.1),(22.6,11.1)]                     # measured on the chosen painting; the other 6 posts are drawn by the game (the two gate pillars carry lanterns too)
SIGNS=[(46.3,13.9),(2.3,14.3),(37,2.4),(14.5,29.8)]
DECOR={'slot1':(24.6,10.9),'slot2':(17.3,14.2),'slot3':(22.7,13.4),'slot4':(15.2,11.4)}   # fixed spots for front-yard decorations (rewards)
UPSIGN=(22.8,14.4)                                                    # house-upgrade sign (tap -> next level picture + price)
BANNER=(23.6,10.8)                                                     # house-colour banner pole
GATEPOST=[(43.3,13.9),(43.4,18.2)]; YARD_GATE=(41.5,13)
BENCH=[(6.6,11.6),(13,12),(22.6,21.2)]
BLOCK={'w_logs':(3,17),'n_gate':(35,3.2),'s_thicket':(12,29.6)}
MON={'woods_nw':(0.5,4.5,5,14),'woods_n':(8.5,0.5,13.5,3.2),'woods_s':(14,29.6,37,31.5)}   # never on the camp clearing, big tree or any path
# ---------- checks ----------
def walkmask(s): return ((corner==0)&(s==0)&(water==0))|bridge|(dock>0)
def reach(s):
    walk=walkmask(s)
    er=cv2.erode(walk.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45))); n,lab=cv2.connectedComponents(er,connectivity=4)
    def comp(x,y):
        X,Y=min(W-1,t(x)),min(H-1,t(y)); w=lab[max(0,Y-30):Y+31,max(0,X-30):X+31]; v=w[w>0]; return int(np.bincount(v).argmax()) if len(v) else None
    base=comp(28,16.3)
    pts={**{f'door:{n}':(x,yb+0.9) for n,(x,yb,w,dp) in B.items()},**{f'exit:{k}':(min(46.5,max(1.5,x)),min(30.5,max(1.5,y))) for k,(x,y) in EXITS.items()},
         **{f'arr:{k}':v for k,v in ARR.items()},'dock':(20.5,22.6),'camp':(9.8,12.6),'mailbox':(21.3,14.9),'converter':(24,13.4),'bin':(26,12.6),'forecourt':(19.5,11),'poolside':(26.3,9.8),'well':(17.4,21.9),
         'npc':NPC['farm_guide'],**{f'plot:{k}':((a+c)/2,(b+d)/2) for k,(a,b,c,d) in PLOTS.items()},'friend_yard':(41.5,12.6)}
    return [k for k,(x,y) in pts.items() if comp(x,y)!=base],len(pts)
bad,npts=reach(solid); bad_full,_=reach(build_solid(True)); bad_stage={k:reach(build_solid(stage=k))[0] for k in STAGES}
walk=walkmask(solid); tiles=walk.reshape(32,T,48,T).mean((1,3))>=.5
free=48*32-sum((x1-x0)*(y1-y0) for x0,y0,x1,y1 in CORNERS)
incorner=lambda x,y: any(x0<=x<=x1 and y0<=y<=y1 for x0,y0,x1,y1 in CORNERS)
def dcorner(x,y): return min(np.hypot(max(x0-x,0,x-x1),max(y0-y,0,y-y1)) for x0,y0,x1,y1 in CORNERS)
inter={**DECOR,'banner':BANNER,'upgrade_sign':UPSIGN,'yard_gate':YARD_GATE,**{f'door:{n}':(x,yb) for n,(x,yb,w,dp) in B.items()},**{f'exit:{k}':v for k,v in EXITS.items()},**{f'arr:{k}':v for k,v in ARR.items()},**PROPS,**NPC,**BLOCK,
       **{f'plot:{k}:{i}':p for k,(a,b,c,d) in PLOTS.items() for i,p in enumerate(((a,b),(c,b),(a,d),(c,d)))}}
corner_viol=[k for k,(x,y) in inter.items() if incorner(x,y)]
door_gap={n:round(float(dcorner(x,yb)),1) for n,(x,yb,w,dp) in B.items()}
door_linked={n:bool(road[t(yb+.4),t(x)]>0) for n,(x,yb,w,dp) in B.items()}
arr_ok={k:bool(abs(x-0)>=2 and abs(48-x)>=2 and abs(y)>=2 and abs(32-y)>=2 and not incorner(x,y)) for k,(x,y) in ARR.items()}
main_clear=int(((build_solid(True)>0)&(mainroad>0)).sum())
allroad=road>0
onroad=lambda x,y,r=.35: bool(allroad[t(y-r):t(y+r)+1,t(x-r):t(x+r)+1].any())
ALLP={**{f'lamp{i}':p for i,p in enumerate(LAMPS)},**{f'sign{i}':p for i,p in enumerate(SIGNS)},**{f'bench{i}':p for i,p in enumerate(BENCH)},
         'mailbox':PROPS['mailbox'],'converter':PROPS['converter'],'bin':PROPS['shipping_bin'],'well':PROPS['well'],'npc':NPC['farm_guide'],**DECOR,'banner':BANNER,'upgrade_sign':UPSIGN,
         **{f'gatepost{i}':p for i,p in enumerate(GATEPOST)}}
clutter=[k for k,v in ALLP.items() if onroad(*v)]
ks=list(ALLP); crowd=[(a,b) for i,a in enumerate(ks) for b in ks[i+1:] if np.hypot(ALLP[a][0]-ALLP[b][0],ALLP[a][1]-ALLP[b][1])<0.9]
in_house=[k for k,(x,y) in ALLP.items() if any(x0-.3<x<x1+.3 and y0-.3<y<y1+.3 for x0,y0,x1,y1 in (HOUSE_MAX,POOL))]
# monsters: spawn rects must not touch any path, the camp, corners or the safe farm side
mon_bad=[k for k,(x0,y0,x1,y1) in MON.items() if allroad[t(y0):t(y1),t(x0):t(x1)].any() or corner[t(y0):t(y1),t(x0):t(x1)].any() or np.hypot(max(x0-CAMP[0],0,CAMP[0]-x1),max(y0-CAMP[1],0,CAMP[1]-y1))<3]
# door paths: narrowest width from each door down to the main road
def doorwidth(n):
    x,yb,w,dp=B[n]; X=t(x); v=[]
    for Y in range(t(yb+.95),H):
        if mainroad[Y,X]>0: break
        row=road[Y]>0; l=X
        while l>0 and row[l-1]: l-=1
        r=X
        while r<W-1 and row[r+1]: r+=1
        v.append((r-l+1)/T)
    return round(min(v),1) if v else None
door_w={n:doorwidth(n) for n in B}
front_yard_depth=round(float(next(Y for Y in range(t(10),H) if mainroad[Y,t(19.5)]>0)/T-10),1)
# path width: narrowest paved width along every road centreline (distance transform x2)
dist=cv2.distanceTransform((road>0).astype(np.uint8),cv2.DIST_L2,5)
def minwidth(pts):
    p=smooth([(t(x),t(y)) for x,y in pts]); p=p[(p[:,0]>=0)&(p[:,0]<W)&(p[:,1]>=0)&(p[:,1]<H)]
    v=[dist[int(y),int(x)]*2/T for x,y in p if water[int(y),int(x)]==0 and solid[int(y),int(x)]==0]; return round(float(min(v)),1)
widths={'main':minwidth(MAIN),'north':minwidth(NORTH),'south':minwidth([(12,17.6),(11.5,22),(12.4,27),(12,32)]),
        'farm_lane':minwidth([(35,17.2),(35.2,22),(35,27.3)]),'loop':minwidth(LOOP),'dock':minwidth([(20.5,18.2),(20.4,20),(20.5,21.7)]),'camp':minwidth([(9,16.2),(9.4,14.5),(9.8,13)])}
# edge contract with H9: H9 west-edge road rows vs G9 east-edge road rows
h9=Z(); stroke(h9,[(17,15.6),(11,16.2),(5,15.6),(0,16)],3)
a=h9[:,0:3].max(1)>0; b=mainroad[:,W-3:W].max(1)>0
iou=(a&b).sum()/(a|b).sum(); ca=np.where(a)[0].mean()/T; cb=np.where(b)[0].mean()/T
cls=lambda m:int((m.reshape(32,T,48,T).mean((1,3))>=.5).sum())
n_water=cls(((water>0)&~bridge).astype(np.uint8)*255); n_solid=cls(solid); n_field=cls(field); n_woods=cls(((woods>0)&(solid==0)&(corner==0)&(water==0)).astype(np.uint8)*255)
n_road=cls(road); n_open=int(tiles.sum())-n_field-n_woods
R={'points_checked':npts,'unreachable':bad,'unreachable_house_max':bad_full,'walk_tiles':int(tiles.sum()),'free_tiles':free,'walk_pct':round(100*tiles.sum()/free,1),
   'open_ground_tiles':n_open,'open_pct_of_scene':round(100*n_open/free,1),'field_tiles':n_field,'woods_tiles':n_woods,'water_tiles':n_water,'road_tiles':n_road,
   'corner_violations':corner_viol,'door_to_corner_gap':door_gap,'door_linked':door_linked,'arrivals_ok':arr_ok,'main_road_blocked_px':main_clear,
   'props_on_walkway':clutter,'props_too_close':crowd,'props_inside_house_max_or_pool':in_house,'monster_zone_conflicts':mon_bad,'door_path_width':door_w,'front_yard_depth':front_yard_depth,'unreachable_by_house_stage':bad_stage,'field_under_path_px':int(((field>0)&(road>0)).sum()),'min_path_width':widths,'edge_H9':{'h9_centre_y':round(float(ca),2),'g9_centre_y':round(float(cb),2),'overlap_iou':round(float(iou),3)}}
print(json.dumps(R,ensure_ascii=False,indent=1))
# ---------- game systems for this block (light version, decided 2 Oct) : numbers are starting values, tune after real play ----------
SYSTEMS={
 'farm':{'loop':['buy seed at shed','tap plot to plant','water once','grows in real time (also offline)','harvest','put in shipping bin -> coins'],
   'crops':[{'id':'carrot','th':'แครอท','grow_min':5,'seed':5,'sell':9},{'id':'lettuce','th':'ผักกาด','grow_min':10,'seed':8,'sell':15},
            {'id':'tomato','th':'มะเขือเทศ','grow_min':30,'seed':15,'sell':32},{'id':'corn','th':'ข้าวโพด','grow_min':120,'seed':25,'sell':60},
            {'id':'pumpkin','th':'ฟักทอง','grow_min':480,'seed':40,'sell':120}],
   'crystal_crop':{'chance':0.05,'sell_x':5,'use':'sell or show on a display shelf / front-yard slot'},
   'never':['crops dying','seasons','quality stars','processing','orders'],'later':['friend monster waters for you','plots 2-4']},
 'house_upgrade':{'how':'tap the sign in front of the house -> picture of next level + price -> one button; coins only',
   'look':'concept-house-levels.jpg (9 exteriors, one per level; redraw top-down for the game)',
   'levels':[{'lv':1,'adds':'กระท่อมห้องเดียว','envelope':'lv1','cost':0},{'lv':2,'adds':'ปีกครัว','envelope':'lv2-4','cost':200},{'lv':3,'adds':'ห้องกว้างขึ้น (ห้องนั่งเล่น)','envelope':'lv2-4','cost':500},
             {'lv':4,'adds':'ระเบียงไม้ + สวนหน้าบ้าน','envelope':'lv2-4','cost':1000},{'lv':5,'adds':'ชั้น 2 + ห้องนอน + ห้องน้ำ','envelope':'lv5-6','cost':1500},{'lv':6,'adds':'ห้องกระจก','envelope':'lv5-6','cost':2500},
             {'lv':7,'adds':'ชั้น 3 + หอดูดาว','envelope':'lv7-9','cost':4000},{'lv':8,'adds':'ห้องบ่อบอล + สไลเดอร์','envelope':'lv7-9','cost':6000},{'lv':9,'adds':'สระว่ายน้ำ + สไลเดอร์น้ำ','envelope':'lv7-9 + pool','cost':10000}],
   'rules':['new room arrives with basic furniture','house gives no combat power','only the current level picture is loaded'],'phase1':'lv 1-3'},
 'decor':{'room_grid':{'lv1':[8,6],'lv2':[10,7]},'place':'tap item -> tap floor cell; snaps to grid',
   'auto_face':['chair/sofa next to a table -> face the table','against back wall -> face front','against left wall -> face right','against right wall -> face left','corner -> back wall wins','middle of room -> face front'],
   'rotate':'tap placed item -> rotate button, 90 deg per tap; skip a direction that faces straight into a visible wall (back/left/right) or overlaps another item','guard':'cannot place where it closes the walk from the door to bed / wardrobe / stairs',
   'auto_arrange_button':True,
   'categories':['floor & wallpaper','main furniture','floor items','wall items','table-top items','collection displays','crystal-powered items'],
   'sprites_per_item':{'round/symmetric':1,'bed/cabinet/shelf/table':2,'chair/sofa':3},'first_set':'~20 items ≈ 35 sprites',
   'interactive':{'wardrobe':'change outfit/hair/face','bed':'skip to morning/evening','display_shelf':'show stamps, monster book, crystal crops','pool & ball pit':'play with invited friends'},
   'sources':['ร้านยายนวล','รางวัลแสตมป์/สมุดประวัติมอน','ผลคริสตัลจากฟาร์ม']}}
# ---------- picture ----------
# layer 1 = what the PAINTED background contains (never changes) -> map-G9-home-farm-layout.png goes to the painter
# layer 2 = what the GAME draws on top (changes with progress): house per level, pool, decorations, banner, crops, weeds on unbought plots, phase-1 blockers
img=np.zeros((H,W,3),np.uint8); img[:]=(118,170,90)
img[woods>0]=(88,146,82); img[rock>0]=(140,134,128); img[corner>0]=(46,96,58)
img[field>0]=(134,92,58)
img[road>0]=(232,216,176); img[mainroad>0]=(222,204,160); img[water>0]=(60,110,200); img[bridge]=(150,140,130)
im=Image.fromarray(img); d=ImageDraw.Draw(im)
for k,(x0,y0,x1,y1) in PLOTS.items(): d.rectangle((t(x0),t(y0),t(x1),t(y1)),outline=(96,70,44),width=3)
d.rectangle((t(37.2),t(7),t(46),t(13)),outline=(150,105,60),width=3)                       # friend-monster yard fence
d.rectangle((t(YARD_GATE[0]-1),t(13)-3,t(YARD_GATE[0]+1),t(13)+3),fill=(232,216,176))       # open gate
ROOF={'our_house':(214,96,84),'shed':(150,110,70),'friend_hut':(120,170,200)}
def draw_building(dd,n):
    x,yb,w,dp=B[n]; dd.rectangle((t(x-w/2),t(yb-dp),t(x+w/2),t(yb)),fill=ROOF[n],outline=(60,40,30),width=3); dd.rectangle((t(x-.5),t(yb-.9),t(x+.5),t(yb)),fill=(70,45,30))
for n in ('shed','friend_hut'): draw_building(d,n)
d.rectangle((t(UPSIGN[0])-6,t(UPSIGN[1])-10,t(UPSIGN[0])+6,t(UPSIGN[1])+4),fill=(140,95,50))
d.rectangle((t(19.9),t(21.5),t(21.1),t(23.4)),fill=(150,110,70))
d.ellipse((t(TREE[0]-3),t(TREE[1]-3),t(TREE[0]+3),t(TREE[1]+3)),fill=(50,112,62),outline=(34,84,48),width=3); d.ellipse((t(TREE[0]-1),t(TREE[1]-1),t(TREE[0]+1),t(TREE[1]+1)),fill=(110,78,48))
d.ellipse((t(CAMP[0])-14,t(CAMP[1])-14,t(CAMP[0])+14,t(CAMP[1])+14),fill=(240,140,60),outline=(90,70,60),width=4)
d.ellipse((t(17.4)-10,t(20.9)-10,t(17.4)+10,t(20.9)+10),fill=(120,120,130),outline=(60,60,70),width=3)
d.ellipse((t(24)-12,t(12.6)-12,t(24)+12,t(12.6)+12),fill=(190,150,240),outline=(90,60,130),width=3)      # converter pad
d.rectangle((t(26)-12,t(11.8)-9,t(26)+12,t(11.8)+9),fill=(170,120,60),outline=(60,40,30),width=2)       # shipping bin
d.rectangle((t(21.3)-6,t(14.1)-10,t(21.3)+6,t(14.1)+6),fill=(220,70,70),outline=(60,40,30),width=2)          # mailbox
for x,y in BENCH: d.rectangle((t(x)-14,t(y)-5,t(x)+14,t(y)+5),fill=(150,105,60))
for x,y in LAMPS: d.ellipse((t(x)-6,t(y)-6,t(x)+6,t(y)+6),fill=(255,214,90))
for x,y in SIGNS: d.rectangle((t(x)-6,t(y)-10,t(x)+6,t(y)+4),fill=(140,95,50))
for x,y in GATEPOST: d.rectangle((t(x)-9,t(y)-9,t(x)+9,t(y)+9),fill=(150,150,160),outline=(60,60,70),width=2)   # farm gate posts
rng=np.random.RandomState(9); TREES=[]
def tree_ok(x,y):
    X,Y=t(x),t(y)
    if not(0<=X<W and 0<=Y<H): return False
    if HOUSE_LOT[0]-1<x<HOUSE_LOT[2]+1 and HOUSE_LOT[1]-1<y<HOUSE_LOT[3]+2: return False
    if road[max(0,Y-26):Y+27,max(0,X-26):X+27].any() or water[max(0,Y-20):Y+21,max(0,X-20):X+21].any() or field[Y,X] or solid[Y,X] or corner[Y,X]: return False
    return all(np.hypot(x-a,y-b)>1.5 for a,b in TREES) and np.hypot(x-TREE[0],y-TREE[1])>4
for _ in range(900):                                         # woods: trees stand apart so the forest floor stays walkable
    x,y=rng.uniform(0,48),rng.uniform(0,32)
    if woods[min(H-1,t(y)),min(W-1,t(x))] and tree_ok(x,y): TREES.append((round(x,1),round(y,1)))
for x,y in [(31.6,5),(38.5,3),(44.5,9),(46.5,20.5),(45,24.5),(24.5,29),(15.6,20.4),(46,12.5),(37.8,14)]:    # lawn trees (decor)
    if tree_ok(x,y): TREES.append((x,y))
for x,y in TREES: d.ellipse((t(x)-16,t(y)-16,t(x)+16,t(y)+16),fill=(60,120,70))
im.save(os.path.join(OUT,'map-G9-home-farm-layout.png'))
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',s)
L=im.copy(); dl=ImageDraw.Draw(L)
for k,(x0,y0,x1,y1) in PLOTS.items():                                    # game layer: weeds on unbought plots, furrows on the starter plot
    if k=='plot1_start':
        for r in range(1,4): dl.line((t(x0)+6,t(y0+r),t(x1)-6,t(y0+r)),fill=(104,70,44),width=3)
    else: dl.rectangle((t(x0),t(y0),t(x1),t(y1)),fill=(150,128,70),outline=(96,70,44),width=3)
x0,y0,x1,y1=HOUSE_LOT; dl.rectangle((t(x0),t(y0),t(x1),t(y1)),outline=(250,240,200),width=2)
for k in ('lv7-9','lv5-6','lv2-4'):
    x0,y0,x1,y1=STAGES[k]; dl.rectangle((t(x0),t(y0),t(x1),t(y1)),outline=(255,200,190),width=2)
x0,y0,x1,y1=POOL; dl.rectangle((t(x0),t(y0),t(x1),t(y1)),fill=(150,200,235),outline=(250,240,200),width=2)
draw_building(dl,'our_house')
for x,y in DECOR.values(): dl.ellipse((t(x)-9,t(y)-9,t(x)+9,t(y)+9),fill=(240,150,190),outline=(120,60,90),width=2)
dl.rectangle((t(BANNER[0])-4,t(BANNER[1])-14,t(BANNER[0])+4,t(BANNER[1])+6),fill=(255,214,90),outline=(60,40,30),width=2)
dl.rectangle((t(30)-5,t(21)-12,t(30)+5,t(21)+10),fill=(230,200,120))                                        # scarecrow
dl.rectangle((t(3)-18,t(17)-52,t(3)+18,t(17)+52),fill=(120,84,52),outline=(60,40,30),width=2)               # phase-1 blockers
dl.rectangle((t(35)-34,t(3.2)-6,t(35)+34,t(3.2)+6),fill=(170,125,80),outline=(60,40,30),width=2)
dl.ellipse((t(12)-34,t(29.6)-14,t(12)+34,t(29.6)+14),fill=(70,120,60),outline=(150,60,90),width=3)
def lab(x,y,s,sz=17):
    for dx in (-2,-1,0,1,2):
        for dy in (-2,-1,0,1,2):
            if dx or dy: dl.text((x+dx,y+dy),s,font=F(sz),fill=(20,16,30),anchor='mm')
    dl.text((x,y),s,font=F(sz),fill=(255,255,255),anchor='mm')
NM={'our_house':'บ้านเรา','shed':'โรงเก็บของ','friend_hut':'บ้านเพื่อนมอน'}
for n,(x,yb,w,dp) in B.items(): lab(t(x),t(yb-dp/2),NM[n],15)
lab(t(26.4),t(4.3),'ที่ดินบ้าน (9 ขั้น)',12); lab(t(26.3),t(7.5),'สระ',13); lab(t(19.5),t(4.3),'ขั้น 7-9',11); lab(t(19.5),t(5.7),'ขั้น 5-6',11); lab(t(19.5),t(11),'ลานหน้าบ้าน',11); lab(t(TREE[0]),t(TREE[1]-1.6),'ต้นไม้ใหญ่',14); lab(t(CAMP[0]),t(CAMP[1]+1.3),'ลานแคมป์·กองไฟ',12)
lab(t(20.5),t(25.2),'สระปลา',15); lab(t(22.9),t(22.3),'ท่าตกปลา',12); lab(t(30),t(19.7),'แปลงเริ่มต้น',14)
for k,s in (('plot2','แปลงขยาย 2'),('plot3','แปลงขยาย 3'),('plot4','แปลงขยาย 4')):
    a,b,c,e=PLOTS[k]; lab(t((a+c)/2),t((b+e)/2),s+' (รก)',13)
lab(t(41.6),t(7.6),'ลานเพื่อนมอน',12); lab(t(17.4),t(19.9),'บ่อน้ำ',12); lab(t(25.4),t(11.5),'เครื่องแปลง',11); lab(t(26.6),t(12.8),'กล่องส่งขาย',11); lab(t(20.2),t(14.9),'ตู้จดหมาย',11); lab(t(24.8),t(14.6),'ป้ายอัปเกรด',11)
lab(t(4.2),t(27.2),'ตีนเขาหิน + ตาน้ำ',12); lab(t(4.5),t(6.6),'ป่า (มอนแสง)',13); lab(t(27),t(30.6),'แนวป่า (มอนแสง)',13); lab(t(12),t(24),'สะพานไม้',11)
lab(t(45.4),t(17.9),'H9 >>',13); lab(t(6.4),t(20.4),'<< F9 ทุ่งดอกไม้',14); lab(t(30.4),t(1.6),'G8 ทุ่งหุบเขา (ขึ้นเหนือ)',13); lab(t(18),t(30.2),'G10 ป่าแคมป์ (ลงใต้)',13)
lab(t(43.5),t(13),'เสาหินประตูฟาร์ม',11); lab(t(3.2),t(19.2),'กองซุง',11); lab(t(38),t(4),'ประตูรั้ว',11); lab(t(12),t(28.6),'พุ่มเบอร์รี่รก',11)
for (x0,y0,x1,y1) in CORNERS: lab(t((x0+x1)/2),t((y0+y1)/2),'มุมจอ',13)
L.save(os.path.join(OUT,'map-G9-home-farm-layout-labeled.png'))
spec={'block':'G9','name':'บ้านเรา · ฟาร์ม','version':'1.5','background':{'file':'map-G9-home-farm.jpg','picked':'run 2 picture 4 (3 Oct 2026)','tone':'bright (kid) = the one tone for the whole game','score':9.5},'size':[48,32],'instance':'per_player (แต่ละคนมีฟาร์มของตัวเอง · เพื่อนเข้าได้เมื่อเชิญ)',
 'rule':'HUD corners: no door, exit, NPC, pickup or needed path inside them; every edge follows its neighbour block',
 'doors':{n:[x,yb] for n,(x,yb,w,dp) in B.items()},
 'house':{'lot':list(HOUSE_LOT),'door':[19.5,10],'door_fixed_all_levels':True,'levels':9,'stages':{k:list(v) for k,v in STAGES.items()},'pool_reserved':list(POOL),'forecourt':list(FORECOURT),
          'decor_slots':{k:list(v) for k,v in DECOR.items()},'banner_pole':list(BANNER),'upgrade_sign':list(UPSIGN),'grow_rule':'sideways + up only; never toward the road, never anything playable behind the house'},
 'exits':{'e':{'at':[48,16],'to':'H9 หมู่บ้านพาเพลิน'},
          'w':{'at':[0,17],'to':'F9 ทุ่งดอกไม้','phase1':'locked: กองซุงขวางถนน คนตัดไม้ยังขนไม่เสร็จ','blocker':list(BLOCK['w_logs'])},
          'n':{'at':[35,0],'to':'G8 ทุ่งหุบเขา','phase1':'locked: ประตูรั้วทุ่งหญ้าใส่กลอน เปิดเมื่อถึงบทที่ 2','blocker':list(BLOCK['n_gate'])},
          's':{'at':[12,32],'to':'G10 ป่าแคมป์','phase1':'locked: พุ่มเบอร์รี่ขึ้นรกปิดทาง ยังไม่มีกรรไกรตัดกิ่ง','blocker':list(BLOCK['s_thicket'])}},
 'arrivals':{k:list(v) for k,v in ARR.items()},
 'plots':{k:{'rect':list(v),'state':'cleared' if k=='plot1_start' else 'overgrown (ซื้อเพื่อเปิด)'} for k,v in PLOTS.items()},
 'pond':{'centre':[POND[0],POND[1]],'radius':[POND[2],POND[3]]},'stream':'spring at the rock foot → pond (ไม่ข้ามขอบ)','footbridge':[12,24.8],
 'fishing_dock':[20.5,22.6],'well':[17.4,20.9],'mailbox':list(PROPS['mailbox']),'shipping_bin':list(PROPS['shipping_bin']),'converter':list(PROPS['converter']),'big_tree':list(TREE),'campfire':list(CAMP),
 'friend_yard':[37.2,7,46,13],'friend_yard_gate':list(YARD_GATE),'farm_gate':[43.5,16],'lamps':[list(p) for p in LAMPS],'lamps_painted':[list(p) for p in LAMPS_PAINTED],'gate_pillars':[list(p) for p in GATEPOST],'signs':[list(p) for p in SIGNS],'benches':[list(p) for p in BENCH],
 'npc_spots':{k:list(v) for k,v in NPC.items()},'npc':{'farm_guide':'หุ่นช่วยงานที่จอมเวทลูมินสร้าง ใช้พลังจากเครื่องแปลง · สอนปลูกครั้งแรก'},'light_stone':None,
 'layers':{'painted_background':['roads & paths','knoll (empty) + forecourt','shed','friend hut + yard fence','plots as bare tilled soil','pond, stream, dock, footbridge, well','big tree, camp clearing, campfire stones (unlit), benches','3 lamp posts (unlit), signposts, mailbox, two stone gate pillars with lanterns, a signboard beside the shed','converter pad (empty)','woods, rocks, trees'],
           'drawn_by_game':['6 more lamp posts','shipping bin','our house (9 levels)','pool (lv 9)','front-yard decorations x4','house banner','converter','crops, scarecrow','weeds on unbought plots','phase-1 blockers (logs, closed gate, berry thicket)','campfire flame, all lights','monsters, NPC']},
 'safe_zone':'ทั้งฉากยกเว้น monster_zones · แสงตะเกียงไม่ลด (กลางแจ้ง)',
 'monster_zones':{k:{'rect':list(v),'light':['เห็ดน้อย','กระรอกลูกโอ๊ก'],'dark':[]} for k,v in MON.items()},
 'hud_zones':{'tl':[0,0,8,4],'tr':[39,0,48,6],'br':[38,28,48,32],'bl':[0,28,7,32]},
 'edges':{'e':{'neighbour':'H9','road':16,'river':None,'terrain':'lawns and a few trees (matches H9 west edge) · farm gate arch 4.5 tiles inside'},
          'w':{'neighbour':'F9','road':17,'river':None,'terrain':'woods thin out to meadow north of the road · rocky mountain foot in the south-west corner'},
          'n':{'neighbour':'G8','road':35,'road_width':2.2,'river':None,'terrain':'woods in the north-west, open lawn and knoll elsewhere (G8 is meadow valley)'},
          's':{'neighbour':'G10','road':12,'road_width':2.2,'river':None,'terrain':'tree line along the whole edge (G10 is forest) · stream stays inside G9'}},
 'systems':SYSTEMS,
 'checks':R}
json.dump(spec,open(os.path.join(OUT,'map-G9-spec.json'),'w'),ensure_ascii=False,indent=1)
