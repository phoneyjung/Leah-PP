from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math
W,H=1536,1024
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',s)
def blob(pts,jit=0,seed=1):
    import random; random.seed(seed); out=[]
    for i in range(len(pts)):
        a,b=pts[i],pts[(i+1)%len(pts)]
        for k in range(6):
            t=k/6; x=a[0]+(b[0]-a[0])*t; y=a[1]+(b[1]-a[1])*t
            out.append((x+random.uniform(-jit,jit),y+random.uniform(-jit,jit)))
    return out
SEA=(52,86,150); LAND=(118,160,88)
im=Image.new('RGB',(W,H),SEA); d=ImageDraw.Draw(im)
# continent outline (west and south coasts on the sea, north and east run off the edge)
cont=[(250,60),(1536,0),(1536,1024),(1180,1024),(1100,930),(960,960),(860,900),(700,940),(560,900),(420,960),(300,900),(230,820),(150,760),(120,640),(170,540),(110,450),(150,330),(120,220),(190,130)]
d.polygon(blob(cont,14,3),fill=LAND)
# islands
for (cx,cy,r) in [(70,300,30),(90,860,24),(520,985,20)]: d.ellipse((cx-r,cy-r*.7,cx+r,cy+r*.7),fill=LAND)
# realm tints: LIGHT west, MYSTERY centre, DARK east
mask=Image.new('L',(W,H),0); md=ImageDraw.Draw(mask)
md.polygon(blob([(250,60),(1536,0),(1536,1024),(1180,1024),(1100,930),(960,960),(860,900),(700,940),(560,900),(420,960),(300,900),(230,820),(150,760),(120,640),(170,540),(110,450),(150,330),(120,220),(190,130)],14,3),fill=255)
land=np.array(mask)>0
arr=np.array(im)
yy,xx=np.mgrid[0:H,0:W]
# border lines between realms (wavy)
b1=860+40*np.sin(yy/90.0)       # light | mystery
b2=1120+30*np.sin(yy/70.0+1)    # mystery | dark
light=land&(xx<b1); myst=land&(xx>=b1)&(xx<b2); dark=land&(xx>=b2)
arr[myst]=(150,120,190); arr[dark]=(84,74,92)
im=Image.fromarray(arr); d=ImageDraw.Draw(im)
# light-realm biomes
d.polygon(blob([(190,560),(430,520),(520,640),(470,800),(330,860),(220,800),(170,680)],10,5),fill=(214,184,122))   # desert SW
d.polygon(blob([(250,120),(470,90),(520,200),(380,260),(230,230)],10,6),fill=(232,236,244))                          # snow NW
d.polygon(blob([(140,330),(300,300),(330,420),(200,460),(130,420)],8,7),fill=(170,158,120))                          # clockwork plateau W
d.polygon(blob([(640,420),(820,380),(860,520),(820,640),(680,640),(620,540)],10,8),fill=(150,96,160))               # glowing mushroom forest E
d.polygon(blob([(690,110),(820,100),(850,200),(740,240),(680,190)],8,9),fill=(150,90,72))                             # volcano + hot springs NE
# great mountain arc across the north of the light realm (white ridge)
ridge=[(250,280),(330,240),(430,250),(520,230),(600,210),(690,240),(780,280),(840,330)]
for w,c in [(46,(130,124,132)),(26,(220,220,228)),(10,(250,250,252))]: d.line(ridge,fill=c,width=w,joint='curve')
# crystal library peak (highest point)
d.ellipse((560,170,640,240),fill=(240,240,250)); d.ellipse((585,190,615,220),fill=(196,160,240))
# Paplern valley + river from the mountains through the town to the lotus lake and the sea
d.ellipse((455,250,665,380),fill=(132,180,96))
river=[(640,230),(630,290),(612,350),(590,420),(570,500),(560,580),(565,650),(560,770),(580,850),(590,930)]
d.line(river,fill=(70,120,200),width=10,joint='curve')
d.ellipse((520,620,620,690),fill=(70,120,200))                       # lotus lake
d.ellipse((540,296,572,328),fill=(255,214,90),outline=(60,40,20),width=3)   # PAPLERN (town dot)
d.ellipse((548,236,572,256),fill=(26,20,34),outline=(255,214,90),width=2)       # cave mouth in the mountain face
# south coast bay with the coral city reef
d.ellipse((330,900,470,990),fill=SEA); d.ellipse((380,930,420,960),fill=(240,140,140))
# MYSTERY realm: mist ring, crater lake with a giant ancient tree, floating islands above
d.ellipse((900,330,1080,560),fill=(176,150,210)); d.ellipse((945,390,1035,500),fill=(90,110,170))
d.ellipse((975,425,1005,465),fill=(120,200,130))
for (cx,cy) in [(940,230),(1040,250),(990,640),(905,720)]: d.ellipse((cx-28,cy-14,cx+28,cy+14),fill=(196,186,230),outline=(120,100,160),width=3)
# LANTERN LINE: a chain of giant golden lanterns along the Mystery | Dark border
for y in range(80,1000,70):
    x=1120+30*math.sin(y/70.0+1); d.ellipse((x-9,y-9,x+9,y+9),fill=(255,214,90),outline=(80,50,20),width=2)
# DARK realm: ash plains, black thorn forest, drained mine, still mirror lake, the far tower
d.polygon(blob([(1180,140),(1360,120),(1400,260),(1260,300),(1170,240)],8,11),fill=(54,44,58))   # thorn forest
d.polygon(blob([(1200,560),(1330,520),(1380,640),(1260,700)],8,12),fill=(70,70,92))              # mirror lake
d.ellipse((1240,380,1300,430),fill=(40,32,46))                                                    # drained crystal mine
d.rectangle((1440,440,1470,520),fill=(30,24,34)); d.ellipse((1446,430,1464,448),fill=(224,87,60)) # far tower (ember tip)
im=im.filter(ImageFilter.SMOOTH)
im.save('1_layout-world.png')
# labelled copy for the owner (names are added by the game later, never painted)
L=im.copy(); dl=ImageDraw.Draw(L)
def lab(x,y,s,sz=18,fill=(255,255,255)):
    for dx in (-2,-1,0,1,2):
        for dy in (-2,-1,0,1,2):
            if dx or dy: dl.text((x+dx,y+dy),s,font=F(sz),fill=(20,16,30),anchor='mm')
    dl.text((x,y),s,font=F(sz),fill=fill,anchor='mm')
lab(420,40,'ดินแดนแห่งแสง',30,(255,226,140)); lab(990,40,'ดินแดนลึกลับ',30,(230,210,255)); lab(1330,40,'ดินแดนแห่งความมืด',28,(230,230,235))
for (x,y,s) in [(556,345,'เมืองพาเพลิน (เมืองหลวง)'),(570,705,'ทะเลสาบบัว'),(600,155,'หอสมุดคริสตัล'),(370,170,'ดินแดนหิมะ'),(770,150,'ภูเขาไฟ·น้ำพุร้อน'),(225,385,'เมืองกลไก'),(330,690,'ทะเลทราย·พีระมิด'),(740,520,'ป่าเห็ดเรืองแสง'),(400,990,'เมืองปะการัง'),(400,300,'แนวภูเขาใหญ่'),(640,262,'ถ้ำคริสตัล'),
                  (990,520,'ทะเลสาบปากปล่อง·ต้นไม้โบราณ'),(990,300,'เกาะลอยฟ้า'),(1150,880,'เส้นตะเกียงสุดท้าย'),(1290,210,'ป่าหนามดำ'),(1270,450,'เหมืองแสงร้าง'),(1290,610,'ทะเลสาบกระจกดับ'),(1455,560,'หอคอย')]:
    lab(x,y,s,16)
L.save('/mnt/user-data/outputs/world-terrain-layout-labeled.png'); print('ok')
