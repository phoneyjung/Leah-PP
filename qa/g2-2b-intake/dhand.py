# D-HAND comparison: rule 1 right hand always (Spec v2) vs rule 2 camera-side hand; stand-in Set-08 L0 lantern; mock only
# usage: python3 -I dhand.py WT TRACK_ALL_JSON OUTDIR
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
WT, TRK, OUT = sys.argv[1:4]
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
idle=Image.open(f'{WT}/c2-pilot-kid4-idleanim.png').convert('RGBA'); IM=np.array(Image.open(f'{WT}/c2-pilot-kid4-idleanim-mask.png').convert('RGBA'))
wh=Image.open(f'{WT}/c2-pilot-kid4-walkhold-src.png').convert('RGBA')
lan=Image.open(f'{WT}/kid-lantern.png').convert('RGBA')
mock=json.load(open(f'{WT}/qa/g2-2b-plan/mock.json'))['anchors']['idle']
trk=json.load(open(TRK))
def idle_far_sw(f):
    c=IM[7*C:8*C,f*C:(f+1)*C]; sk=(c[...,0]==3)&(c[...,3]>0); sk[:60]=False; sk[:,45:]=False
    ys,xs=np.where(sk); return [round(float(xs.mean())),round(float(ys.mean()))] if len(xs) else None
RULE={'A':{'S':'R','SE':'R','E':'R','NE':'R','N':None,'NW':None,'W':None,'SW':'Rback'},
      'B':{'S':'R','SE':'R','E':'R','NE':'R','N':None,'NW':'L','W':'L','SW':'L'}}
def anchor(rule,D,anim,f):
    h=RULE[rule][D]
    if h is None: return None,False
    if anim=='idle': return (idle_far_sw(f),True) if h=='Rback' else (mock[D][f],False)
    return (trk['SW']['R']['anchor'][f],True) if h=='Rback' else (trk[D][h]['anchor'][f],False)
F=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',22); Fs=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',17)
S=2; LW=170
def frame(anim,f):
    W=LW+8*C*S; H=70+2*(C*S+34)
    can=Image.new('RGBA',(W,H),(28,26,40,255)); d=ImageDraw.Draw(can)
    d.text((10,8),('ท่าเดินถือ (ยังไม่เก็บงาน)' if anim=='walk' else 'ท่ายืนถือ')+' · ตะเกียงตัวแทนชุด 08 · ภาพจำลอง',font=F,fill=(255,214,120))
    for i,D in enumerate(L8): d.text((LW+i*C*S+C*S//2-12,44),D,font=F,fill=(240,230,210))
    for ri,(rule,lab1,lab2) in enumerate([('A','แบบ 1','มือขวาตลอด'),('B','แบบ 2 (แนะนำ)','มือฝั่งจอ')]):
        y0=70+ri*(C*S+34)
        d.text((10,y0+60),lab1,font=Fs if rule=='B' else F,fill=(255,214,120)); d.text((10,y0+92),lab2,font=Fs,fill=(240,230,210))
        for i,D in enumerate(L8):
            r=L8.index(D); body=(idle if anim=='idle' else wh).crop((f*C,r*C,(f+1)*C,(r+1)*C))
            p,back=anchor(rule,D,anim,f)
            b=Image.new('RGBA',(C,C),(0,0,0,0)); L=lan.crop((r*32,0,(r+1)*32,32))
            if p and back: b.alpha_composite(L,(p[0]-16,p[1]-6))
            b.alpha_composite(body)
            if p and not back: b.alpha_composite(L,(p[0]-16,p[1]-6))
            can.alpha_composite(b.resize((C*S,C*S),Image.NEAREST),(LW+i*C*S,y0))
        cnt=sum(1 for D in L8 if RULE[rule][D])
        d.text((LW,y0+C*S+6),f'เห็นตะเกียง {cnt}/8 ทิศ'+(' · SW อยู่หลังตัว · W NW N ไม่เห็น' if rule=='A' else ' · N ไม่เห็น · ย้ายมือเมื่อหันข้าม S/N'),font=Fs,fill=(200,190,170))
    return can
fr=[frame('walk',f).convert('P',palette=Image.ADAPTIVE) for f in range(6)]
fr[0].save(f'{OUT}/dhand-walk-compare.gif',save_all=True,append_images=fr[1:],duration=100,loop=0,disposal=2)
frame('idle',0).convert('RGB').save(f'{OUT}/dhand-idle-compare.png')
frame('walk',0).convert('RGB').save(f'{OUT}/dhand-walk-f1.png')
print('ok')
