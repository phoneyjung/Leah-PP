import numpy as np, cv2, json
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import CubicSpline
from collections import deque
T=32; W,H=48*T,32*T; t=lambda v:int(round(v*T))
def smooth(pts,n=300):
    p=np.array(pts,float); u=np.linspace(0,1,n); tt=np.linspace(0,1,len(p)); return np.stack([CubicSpline(tt,p[:,0])(u),CubicSpline(tt,p[:,1])(u)],1)
def stroke(m,pts,w,v=255):
    p=smooth([(t(x),t(y)) for x,y in pts]) if len(pts)>2 else np.array([(t(x),t(y)) for x,y in pts],float)
    for i in range(len(p)-1): cv2.line(m,tuple(map(int,p[i])),tuple(map(int,p[i+1])),v,t(w),cv2.LINE_AA)
road=np.zeros((H,W),np.uint8); water=np.zeros_like(road); solid=np.zeros_like(road)
# ONLY the four screen corners are closed (under the HUD); everything else is the village
CORNERS=[(0,0,8,4),(39,0,48,6),(38,28,48,32),(0,28,7,32)]
corner=np.zeros_like(road)
for x0,y0,x1,y1 in CORNERS: corner[t(y0):t(y1),t(x0):t(x1)]=255
# river: through the village EAST of the plaza (the village sits on its west bank, as on the world map), north to south
stroke(water,[(31.4,0),(32.4,6),(31.5,12),(32.3,18),(31.4,24),(32,32)],2.3)
# roads: plaza; north (to H8 / capital), south (to H10 forest), west (to G9 home+farm), east over the bridge (to I9 -> J9 mushroom village)
PC=(22,15.4); cv2.circle(road,(t(PC[0]),t(PC[1])),t(5),255,-1)
stroke(road,[(22,11),(21.6,6),(22.4,3),(22,0)],3)
stroke(road,[(22,20),(22.6,25),(21.8,29),(22.3,32)],3)
stroke(road,[(17,15.6),(11,16.2),(5,15.6),(0,16)],3)
stroke(road,[(27,15.4),(32,15.6),(38,15.2),(43,15.8),(48,15.6)],3)
stroke(road,[(40.2,15),(40,12.5),(40.4,10.4)],2.2)          # up the little hill to the cave
bridge=(water>0)&(road>0)
hill=np.zeros_like(road); cv2.ellipse(hill,(t(41.6),t(6.2)),(t(5),t(3.6)),0,0,360,255,-1)
B={'post_office':(14.4,11.4,5,3),'clock_shop':(6.2,9.6,4,3),'mage_tower':(26.6,10.4,4,4),'blacksmith':(36.4,12.2,5,3),
   'restaurant':(8.6,22,5,3),'item_shop_nuan':(15.2,21.8,5,3),'inn':(27.4,22.6,5,3),'fruit_stall':(36,20.6,3,2),
   'house_daeng':(6.6,26.6,4,3),'house_fon':(13.8,26.8,4,3),'house_dao':(37.4,26.2,4,3),'house_mek':(43.4,21.8,4,3)}
for n,(x,yb,w,dp) in B.items(): solid[t(yb-dp):t(yb),t(x-w/2):t(x+w/2)]=255
cv2.circle(solid,(t(PC[0]),t(PC[1]-.2)),t(1.6),255,-1)                   # crystal bed
cv2.circle(solid,(t(10.4),t(13.4)),t(.45),255,-1)                       # well
solid[(hill>0)&(road==0)]=255
mainroad=road.copy()
def tile_ok(x,y):
    if x<0 or y<0 or x>=48 or y>=32: return False
    X,Y=t(x+.5),t(y+.5); return corner[Y,X]==0 and solid[Y,X]==0 and (water[Y,X]==0 or bridge[Y,X])
on_main=lambda x,y: mainroad[t(y+.5),t(x+.5)]>0
for n,(x,yb,w,dp) in B.items():
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
    for i in range(len(path)-1): stroke(road,[(path[i][0]+.5,path[i][1]+.5),(path[i+1][0]+.5,path[i+1][1]+.5)],1.5)
    road[t(yb):t(yb+.9),t(x-.8):t(x+.8)]=255
road[solid>0]=0; road[(water>0)&~bridge]=0
dock=np.zeros_like(road); dock[t(27.2):t(28.2),t(29.6):t(31.6)]=255
walk=((corner==0)&(solid==0)&(water==0))|bridge|(dock>0)
er=cv2.erode(walk.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45))); n,lab=cv2.connectedComponents(er,connectivity=4)
def comp(x,y):
    X,Y=t(x),t(y); w=lab[max(0,Y-30):Y+31,max(0,X-30):X+31]; v=w[w>0]; return int(np.bincount(v).argmax()) if len(v) else None
base=comp(22,19.5)
pts={'lightstone':(18.2,19.4),'dock':(29.2,27.7),'cave_mouth':(40.4,10.6),**{f'door:{n}':(x,yb+0.9) for n,(x,yb,w,dp) in B.items()},'exit:n':(22,1.5),'exit:w':(1.5,16),'exit:e':(46.5,15.6),'exit:s':(22.3,30.5)}
bad=[k for k,(x,y) in pts.items() if comp(x,y)!=base]
tiles=walk.reshape(32,T,48,T).mean((1,3))>=.5
hud=[int(tiles[y0:y1,x0:x1].sum()) for (x0,y0,x1,y1) in CORNERS]
# every door has a paved side path that reaches a main road
door_linked=all(road[t(yb+.4),t(x)]>0 for n,(x,yb,w,dp) in B.items())
print('unreachable',bad,'| HUD corners walkable',hud,'| walk tiles',int(tiles.sum()),'of',48*32-sum((x1-x0)*(y1-y0) for x0,y0,x1,y1 in CORNERS),'| all doors on a path',door_linked)
# picture
img=np.zeros((H,W,3),np.uint8); img[:]=(118,170,90)
img[corner>0]=(46,96,58); img[hill>0]=(92,140,80); img[road>0]=(232,216,176); img[mainroad>0]=(222,204,160); img[water>0]=(60,110,200); img[bridge]=(150,140,130)
im=Image.fromarray(img); d=ImageDraw.Draw(im)
ROOF={'mage_tower':(120,80,170),'item_shop_nuan':(200,120,70),'blacksmith':(90,90,110),'inn':(190,90,70),'post_office':(200,60,60),'restaurant':(214,130,70),'clock_shop':(60,120,120),'fruit_stall':(170,110,190)}
for n,(x,yb,w,dp) in B.items(): d.rectangle((t(x-w/2),t(yb-dp),t(x+w/2),t(yb)),fill=ROOF.get(n,(190,96,64)),outline=(60,40,30),width=3); d.rectangle((t(x-.5),t(yb-.9),t(x+.5),t(yb)),fill=(70,45,30))
d.ellipse((t(PC[0]-1.7),t(PC[1]-1.9),t(PC[0]+1.7),t(PC[1]+1.5)),fill=(150,90,220),outline=(230,220,255),width=4)
d.ellipse((t(40.4-1.0),t(8.2),t(40.4+1.0),t(9.9)),fill=(25,20,30),outline=(255,214,90),width=3)
d.rectangle((t(29.6),t(27.2),t(31.6),t(28.2)),fill=(150,110,70))
d.ellipse((t(18.2)-12,t(19.4)-12,t(18.2)+12,t(19.4)+12),fill=(120,200,230),outline=(40,60,80),width=3)
d.ellipse((t(10.4)-10,t(13.4)-10,t(10.4)+10,t(13.4)+10),fill=(120,120,130),outline=(60,60,70),width=3)
d.rectangle((t(25.2),t(18.2),t(26.2),t(19.0)),fill=(130,90,50))
for x,y in [(18.6,12),(25.4,12.2)]: d.rectangle((t(x)-14,t(y)-5,t(x)+14,t(y)+5),fill=(150,105,60))
for x,y in [(18,11),(26,19.6),(18,19.6),(26,11),(10,14),(36,13.8),(20.4,25),(24,5.5),(44,14)]: d.ellipse((t(x)-6,t(y)-6,t(x)+6,t(y)+6),fill=(255,214,90))
for x,y in [(2.4,14),(45.6,13.8),(24.2,30),(24.2,1.6)]: d.rectangle((t(x)-6,t(y)-10,t(x)+6,t(y)+4),fill=(140,95,50))
# trees and flower beds fill the open lawns (decor, soft collision handled after painting)
for x,y in [(3,5),(11,4.6),(17,5),(30,4.8),(35,5),(3,21),(20,23),(29,13.5),(44,26),(35,23.6),(10,30),(27,30)]: d.ellipse((t(x)-16,t(y)-16,t(x)+16,t(y)+16),fill=(60,120,70))
im.save('1_layout-village.png')
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',s)
L=im.copy(); dl=ImageDraw.Draw(L)
NM={'mage_tower':'หอนักเวท','item_shop_nuan':'ร้านยายนวล','blacksmith':'ช่างตีเหล็ก/อาวุธ','inn':'โรงเตี๊ยม','post_office':'ไปรษณีย์','clock_shop':'ร้านนาฬิกา','restaurant':'ร้านอาหาร','fruit_stall':'แผงผลไม้','house_mek':'บ้านตาเมฆ','house_daeng':'บ้านยายแดง','house_fon':'บ้านน้องฝน','house_dao':'บ้านพี่ดาว'}
def lab(x,y,s,sz=17):
    for dx in (-2,-1,0,1,2):
        for dy in (-2,-1,0,1,2):
            if dx or dy: dl.text((x+dx,y+dy),s,font=F(sz),fill=(20,16,30),anchor='mm')
    dl.text((x,y),s,font=F(sz),fill=(255,255,255),anchor='mm')
for n,(x,yb,w,dp) in B.items(): lab(t(x),t(yb-dp/2),NM[n])
lab(t(PC[0]),t(PC[1]),'คริสตัล',17); lab(t(41.6),t(6.0),'เนิน + ปากถ้ำ',15); lab(t(27),t(1.2),'↑ H8 → เมืองหลวง',15); lab(t(4),t(17.8),'← G9 บ้านเรา·ฟาร์ม',14)
lab(t(43.5),t(17.2),'I9 → หมู่บ้านเห็ด →',14); lab(t(27),t(30.8),'↓ H10 ป่า',15); lab(t(25.7),t(19.6),'บอร์ด',12); lab(t(18.2),t(20.6),'ศิลาแสง',12); lab(t(30.6),t(29),'ท่าตกปลา',12); lab(t(10.4),t(14.6),'บ่อน้ำ',12)
for (x0,y0,x1,y1) in CORNERS: lab(t((x0+x1)/2),t((y0+y1)/2),'มุมจอ',13)
L.save('/mnt/user-data/outputs/map-H9-village-layout-labeled.png')
spec={'block':'H9','size':[48,32],'rule':'only the four HUD corners are closed; everything else is the village',
 'doors':{n:[x,yb] for n,(x,yb,w,dp) in B.items()},
 'exits':{'n':{'at':[22,0],'to':'H8 → H7 capital','phase1':'locked: ต้นไม้ล้มขวางทางไปเมืองหลวง ช่างกำลังเคลียร์'},'w':{'at':[0,16],'to':'G9 home+farm'},
          'e':{'at':[48,15.6],'to':'I9 (บ้านต้นเห็ด) → J9 mushroom village','phase1':'locked: หมอกยังหนาทางไปหมู่บ้านเห็ด'},'s':{'at':[22.3,32],'to':'H10 forest','phase1':'locked: ป่าทางใต้ยังรก ผู้พิทักษ์กำลังเปิดทาง'}},
 'river':'north → south, east of the plaza; bridge on the east road','cave_mouth':[40.4,9.4],
 'arrivals':{'from_cave':[40.4,11.4],'from_n':[22,2.5],'from_w':[2,16],'from_e':[46,15.6],'from_s':[22.3,30],'new_game':[22,19.8]},
 'crystal':[22,15.2],'light_stone':[18.2,19.4],'fishing_pier':[30.6,27.7],'well':[10.4,13.4],'notice_board':[25.7,18.6],
 'npc_spots':{'mage_lumin':[26.6,11.6],'nuan':[15.2,23],'mom':[19.4,18.6],'dad':[36.4,13.4],'leah':[21,20]}}
json.dump(spec,open('/mnt/user-data/outputs/map-H9-spec.json','w'),ensure_ascii=False,indent=1)
