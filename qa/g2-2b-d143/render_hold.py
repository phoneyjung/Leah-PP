import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
L8=['S','SE','E','NE','N','NW','W','SW']; C=96
WT='.'; Z='../g22/d143/zip'
A=json.load(open('../g22/d143/hand-anchors.json'))
def load(p): return np.array(Image.open(p).convert('RGBA'))
WS,WMk=load(f'{Z}/c2-pilot-kid4-walkhold.png'),load(f'{Z}/c2-pilot-kid4-walkhold-mask.png')
IS,IMk=load('c2-pilot-kid4-idleanim.png'),load('c2-pilot-kid4-idleanim-mask.png')
LAN=Image.open('kid-lantern.png').convert('RGBA')
F=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',20)
def fistmask(m,a):
    sk=(m[...,0]==3)&(m[...,3]>0); sk[:60]=False
    f=sk|(nd.binary_dilation(sk,structure=np.ones((5,5)))&(m[...,0]==7)&(m[...,3]>0))
    lab,n=nd.label(f,structure=np.ones((3,3)))
    if a is None or not f[a[1],a[0]]: return np.zeros_like(f)
    return lab==lab[a[1],a[0]]
def cell(D,anim,k,lan_xy=None,overlay=True):
    r=L8.index(D); S,M=(WS,WMk) if anim=='walk' else (IS,IMk)
    s=S[r*C:(r+1)*C,k*C:(k+1)*C]; m=M[r*C:(r+1)*C,k*C:(k+1)*C]
    a=A['walk_hold' if anim=='walk' else 'idle_hold'][D][k]['anchor']
    im=Image.fromarray(np.ascontiguousarray(s))
    p=lan_xy if lan_xy is not None else a
    if p is not None:
        b=Image.new('RGBA',(C,C),(0,0,0,0)); b.alpha_composite(im); b.alpha_composite(LAN.crop((r*32,0,(r+1)*32,32)),(int(round(p[0]))-16,int(round(p[1]))-6))
        if overlay and a is not None:
            fm=fistmask(m,a); arr=np.array(b); arr[fm]=s[fm]; b=Image.fromarray(arr)
        im=b
    return im,a
def walk_gif(out,SC=3):
    frames=[]
    for k in range(6):
        can=Image.new('RGBA',(8*C*SC,C*SC+40),(28,26,40,255)); d=ImageDraw.Draw(can)
        d.text((10,8),'ท่าเดินถือ (เก็บงานแล้ว) · ตะเกียงตัวแทนชุด 08 · ถือมือฝั่งจอ · นิ้วทับห่วง',font=F,fill=(255,214,120))
        for i,D in enumerate(L8):
            im,_=cell(D,'walk',k); can.alpha_composite(im.resize((C*SC,C*SC),Image.NEAREST),(i*C*SC,40))
        frames.append(can.convert('P',palette=Image.ADAPTIVE))
    frames[0].save(out,save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
def transition_gif(D,out,tween,SC=4):
    # 100 ms ticks: idle 2 loops (f1 f2 f3 f2 · 200 ms each) -> walk 2 loops (100 ms) -> stop -> idle from f3 (2 loops)
    ticks=[('idle',k) for _ in range(2) for k in (0,1,2,1) for _ in range(2)]+[('walk',k) for _ in range(2) for k in range(6)]+[('idle',k) for _ in range(2) for k in (2,1,0,1) for _ in range(2)]
    frames=[]; pos=None
    for anim,k in ticks:
        a=A['walk_hold' if anim=='walk' else 'idle_hold'][D][k]['anchor']
        if pos is None or not tween: pos=list(a)
        else: pos=[pos[0]+max(-3,min(3,a[0]-pos[0])),pos[1]+max(-3,min(3,a[1]-pos[1]))]
        im,_=cell(D,anim,k,lan_xy=pos)
        can=Image.new('RGBA',(C*SC,C*SC+36),(28,26,40,255)); dr=ImageDraw.Draw(can)
        lab='ตะเกียงตามมือแบบหน่วง ไม่เกิน 3 px ต่อ 0.1 วิ' if tween else 'ตะเกียงติดมือทันที (กระโดด)'
        dr.text((8,6),f'{D} · {lab} · {"เดิน" if anim=="walk" else "ยืน"}',font=F,fill=(255,214,120))
        can.alpha_composite(im.resize((C*SC,C*SC),Image.NEAREST),(0,36))
        frames.append(can.convert('P',palette=Image.ADAPTIVE))
    frames[0].save(out,save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
if __name__=='__main__':
    od=sys.argv[1]
    walk_gif(f'{od}/walkhold-lantern-8dir.gif')
    for D in ('E','W'):
        transition_gif(D,f'{od}/stop-{D}-snap.gif',False); transition_gif(D,f'{od}/stop-{D}-tween.gif',True)
    # still sheet for a quick look: walk f1 + idle f1
    can=Image.new('RGBA',(8*C*3,2*C*3),(28,26,40,255))
    for i,D in enumerate(L8):
        for j,anim in enumerate(('idle','walk')):
            im,_=cell(D,anim,0); can.alpha_composite(im.resize((C*3,C*3),Image.NEAREST),(i*C*3,j*C*3))
    can.convert('RGB').save(f'{od}/hold-still.png')
    print('ok')
