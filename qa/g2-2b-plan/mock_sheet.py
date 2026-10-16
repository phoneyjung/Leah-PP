import sys, json
from PIL import Image, ImageDraw, ImageFont
WT, OUT = sys.argv[1], sys.argv[2]
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
mj=json.load(open(f'{OUT}/mock.json')); A=mj['anchors']['walk']; SM=mj['summary']['walk']
lan=Image.open(f'{WT}/kid-lantern.png').convert('RGBA'); RING=(16,6)
walk=Image.open(f'{WT}/c2-pilot-kid4-walk.png').convert('RGBA')
F=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',22)
Fs=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',18)
X0,Y0,X1,Y1=8,36,88,96; cw,ch=(X1-X0)*2,(Y1-Y0)*2; LW=330
note={'S':'มือนิ่ง (x 1 px) · ผ่าน','SE':'มือหาย f5–f6 · ตะเกียงกระโดดไปอีกมือ','E':'ตะเกียงเหวี่ยง 19 px','NE':'เหวี่ยง 8 px · มือหาย f6',
      'N':'ไม่เห็นมือเลย 0/6','NW':'เห็นมือ 1/6 เฟรม','W':'ตะเกียงเหวี่ยง 20 px','SW':'เหวี่ยง 10 px'}
im=Image.new('RGB',(LW+6*cw,70+8*ch),(28,26,40)); d=ImageDraw.Draw(im)
d.text((10,8),'ภาพจำลอง: ท่าเดินเดิม (ล็อก) + ตะเกียงชุด 08 เดิม ห้อยมือข้างที่หันหาจอ · เส้นเขียว = แถวเท้า 94',font=Fs,fill=(240,230,210))
d.text((10,36),'ไม่ใช่งานจริง · ใช้ตัดสินแผน G2.2b เท่านั้น',font=Fs,fill=(200,190,170))
for r,D in enumerate(L8):
    oy=70+r*ch
    s=SM[D]; bot=s.get('lantern_bottom_max')
    d.text((10,oy+10),D,font=F,fill=(255,214,120))
    d.text((10,oy+44),note[D],font=Fs,fill=(240,230,210))
    if bot: d.text((10,oy+72),f'ก้นตะเกียงลงถึงแถว {bot} (เท้า 94)',font=Fs,fill=(200,190,170))
    for f in range(6):
        cell=walk.crop((f*C,r*C,(f+1)*C,(r+1)*C)); p=A[D][f]
        lay=Image.new('RGBA',(C,C),(0,0,0,0))
        if p: lay.alpha_composite(lan.crop((r*32,0,(r+1)*32,32)),(p[0]-RING[0],p[1]-RING[1]))
        lay.alpha_composite(cell) if False else None
        base=Image.new('RGBA',(C,C),(0,0,0,0)); base.alpha_composite(cell); base.alpha_composite(lay)
        ImageDraw.Draw(base).line([(24,94),(72,94)],fill=(110,200,110,255))
        im.paste(base.crop((X0,Y0,X1,Y1)).resize((cw,ch),Image.NEAREST),(LW+f*cw,oy),base.crop((X0,Y0,X1,Y1)).resize((cw,ch),Image.NEAREST))
        if r==0: pass
    d.line([(0,oy),(im.width,oy)],fill=(60,56,80))
for f in range(6): d.text((LW+f*cw+cw//2-10,46),f'f{f+1}',font=Fs,fill=(240,230,210))
im.save(f'{OUT}/g22b-mock-walk-reuse.png'); print(im.size)
# small GIF: SE E W SW at 3x
sel=['SE','E','W','SW']; SC=3; fr=[]
for f in range(6):
    can=Image.new('RGBA',(len(sel)*C,C),(28,26,40,255))
    for i,D in enumerate(sel):
        r=L8.index(D); cell=walk.crop((f*C,r*C,(f+1)*C,(r+1)*C)); p=A[D][f]
        base=Image.new('RGBA',(C,C),(0,0,0,0)); base.alpha_composite(cell)
        if p: base.alpha_composite(lan.crop((r*32,0,(r+1)*32,32)),(p[0]-RING[0],p[1]-RING[1]))
        can.alpha_composite(base,(i*C,0))
    fr.append(can.resize((len(sel)*C*SC,C*SC),Image.NEAREST).convert('P',palette=Image.ADAPTIVE))
fr[0].save(f'{OUT}/g22b-mock-walk-reuse.gif',save_all=True,append_images=fr[1:],duration=100,loop=0,disposal=2)
