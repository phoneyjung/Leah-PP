import json
from PIL import Image, ImageDraw, ImageFont
A=json.load(open('/mnt/user-data/outputs/world-atlas.json')); B=A['blocks']; N=20; COL='ABCDEFGHIJKLMNOPQRST'
art=Image.open('/mnt/user-data/outputs/world-map-art.png').convert('RGB'); k=2; S=art.resize((1536*k,1024*k),Image.LANCZOS); d=ImageDraw.Draw(S,'RGBA'); bw,bh=1536*k/N,1024*k/N
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',s)
def lab(x,y,s,sz,fill=(255,255,255),anchor='mm'):
    for dx in (-2,-1,0,1,2):
        for dy in (-2,-1,0,1,2):
            if dx or dy: d.text((x+dx,y+dy),s,font=F(sz),fill=(20,16,30),anchor=anchor)
    d.text((x,y),s,font=F(sz),fill=fill,anchor=anchor)
RC={'D':(255,214,90),'P':(235,95,85),'S':(120,200,255)}
GLOW={'ไลแลค':(200,160,255),'ทองอุ่น':(255,200,90),'รุ้งอ่อน':(255,240,255),'ชมพูเรือง':(255,140,210),'ฟ้าน้ำทะเล':(90,220,230),'ส้ม':(255,150,60),'ทองแดด':(250,210,100),'ฟ้าน้ำแข็ง':(170,230,255),'เขียวทองแดง':(90,200,160),'ขาวรุ้ง':(250,250,255),'ทองอ่อน':(250,230,150),'ทอง':(255,214,90),'ม่วงหม่น':(150,110,170)}
for kk,b in B.items():
    if b['realm']=='sea': continue
    x0,y0=b['col']*bw,b['row']*bh; c=RC[b['role']]
    d.rectangle((x0+3,y0+3,x0+bw-3,y0+bh-3),fill=c+(38,),outline=c+(200,),width=2)
    if b['road']: d.ellipse((x0+bw/2-5,y0+bh/2-5,x0+bw/2+5,y0+bh/2+5),fill=(240,226,190,230))
    if 'เครื่องแปลงพลังงาน' in b.get('buildings',[]): d.rectangle((x0+bw-22,y0+8,x0+bw-10,y0+20),fill=(200,160,255,255),outline=(30,20,40))
    if b.get('dungeon'): d.polygon([(x0+10,y0+bh-10),(x0+22,y0+bh-30),(x0+34,y0+bh-10)],fill=(30,22,40,240),outline=(255,214,90)); 
    lab(x0+16,y0+14,kk,12,(255,255,255),'mm')
for kk,t in A['towns'].items():
    b=B[kk]; x,y=b['col']*bw+bw/2,b['row']*bh+bh/2; g=GLOW.get(t[3],(255,255,255))
    for r,a in [(26,60),(18,110),(10,255)]: d.ellipse((x-r,y-r,x+r,y+r),fill=g+(a,))
    d.polygon([(x,y-14),(x+7,y),(x,y+14),(x-7,y)],fill=(255,255,255,255),outline=(40,30,60))
    lab(x,y+bh*.36,t[0],15,(255,236,170))
for i in range(N): lab((i+.5)*bw,12,COL[i],18,(255,226,140)); lab(14,(i+.5)*bh,str(i+1),16,(255,226,140))
lab(40,1024*k-56,'ทอง = จุดหมาย 60% · แดง = ทางผ่านมีมอน 30% · ฟ้า = ชมวิว 10% · เพชรเรือง = คริสตัลกลางเมือง (สีตามเมือง) · สามเหลี่ยมดำ = ดันเจี้ยน · จุดครีม = ถนน · สี่เหลี่ยมม่วง = เครื่องแปลงพลังงาน',22,(255,255,255),'ls')
S.save('/mnt/user-data/outputs/world-atlas-overview.jpg',quality=86); S.resize((1536,1024)).save('/tmp/atlas_small.jpg',quality=85)
