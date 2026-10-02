import json, math
exec(open('lay.py').read().split("im=im.filter(ImageFilter.SMOOTH)")[0])   # same terrain as the world map that worked
A=json.load(open('/mnt/user-data/outputs/world-atlas.json')); B=A['blocks']; T=A['towns']; N=20
GLOW={'ไลแลค':(200,160,255),'ทองอุ่น':(255,200,90),'รุ้งอ่อน':(250,235,255),'ชมพูเรือง':(255,140,210),'ฟ้าน้ำทะเล':(90,220,230),'ส้ม':(255,150,60),'ทองแดด':(250,210,100),'ฟ้าน้ำแข็ง':(170,230,255),'เขียวทองแดง':(90,200,160),'ขาวรุ้ง':(250,250,255),'ทองอ่อน':(250,230,150),'ทอง':(255,214,90),'ม่วงหม่น':(150,110,170)}
# remove the old single town dot and cave dot drawn by lay.py (repaint the valley there), then mark every town by its atlas block
d.ellipse((455,250,665,380),fill=(132,180,96)); d.line([(640,230),(630,290),(612,350),(590,420),(570,500),(560,580),(565,650)],fill=(70,120,200),width=10,joint='curve')
d.ellipse((548,236,572,256),fill=(26,20,34),outline=(255,214,90),width=2)            # mountain cave mouth above the capital
SIZE={'capital':30,'academy':20,'village':18,'town':24,'sky':18,'sanctuary':18,'fort':16,'tower':14}
for k,t in T.items():
    b=B[k]; x,y=(b['col']+.5)*1536/N,(b['row']+.5)*1024/N; r=SIZE.get(t[1],18); g=GLOW[t[3]]
    if t[1] not in('sky','sanctuary','fort','tower'): d.ellipse((x-r-10,y-r*0.7-6,x+r+10,y+r*0.7+6),fill=(214,190,140))   # the settlement
    d.polygon([(x,y-r*0.9),(x+r*0.45,y),(x,y+r*0.5),(x-r*0.45,y)],fill=g,outline=(40,30,60))                          # its crystal at the heart
im2=im.filter(ImageFilter.SMOOTH); im2.save('1_layout-world-v2.png')
L=im2.copy(); dl=ImageDraw.Draw(L)
def lab(x,y,s,sz=15,fill=(255,255,255)):
    for dx in (-2,-1,0,1,2):
        for dy in (-2,-1,0,1,2):
            if dx or dy: dl.text((x+dx,y+dy),s,font=F(sz),fill=(20,16,30),anchor='mm')
    dl.text((x,y),s,font=F(sz),fill=fill,anchor='mm')
for k,t in T.items():
    b=B[k]; x,y=(b['col']+.5)*1536/N,(b['row']+.5)*1024/N; dx=-40 if k=="G7" else (40 if k=="H7" else 0); lab(x+dx,y+26,f"{k} {t[0]}",13,(255,236,170))
lab(520,250,'ถ้ำภูเขา',12)
L.save('/mnt/user-data/outputs/world-layout-v2-labeled.png'); print('ok')
