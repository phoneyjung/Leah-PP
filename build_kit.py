"""Kit pipeline (step 4 of KIT_SYSTEM.md): approved pieces -> one atlas + one manifest.
Input : the reviewed piece sheets already cut and scaled (buildings, nature, details) with their meta.
Output: kit-town.png (atlas, 2 px padding, shelf-packed 1024 wide) + kit-town.json (manifest the game reads)."""
import json
from PIL import Image
T=32
SRC=[('/mnt/user-data/outputs/kit-town-buildings.png','/home/claude/kit2/kit_meta.json','b'),
     ('/mnt/user-data/outputs/kit-town-nature.png','/home/claude/kit2/kit_meta.json','n'),
     ('/mnt/user-data/outputs/kit-town-details.png','/home/claude/kit3/kit3_meta.json',None)]
# id -> (source key, tag, review)   tag decides behaviour in the game (see "tags" below)
SPEC={
 'house.restaurant':('restaurant','house',9.3,'buildings B2#1'),'house.clock':('clock','house',9.3,'buildings B2#2'),'house.post':('post','house',9.3,'buildings B2#3'),
 'house.smith':('smith','house',9.3,'buildings B4#4'),'house.red':('houseRed','house',9.2,'buildings B2#5'),'house.navy':('houseNavy','house',9.2,'buildings B2#6'),
 'tree.round':('treeRound','tree',9.2,'nature N2#1'),'tree.oak':('treeOak','tree',9.3,'nature N3#2'),'tree.blossom':('treeBlossom','tree',9.4,'nature N2#3'),'tree.mango':('treeMango','tree',9.3,'nature N2#4'),
 'pine.tall':('pineTall','tree',9.2,'nature N1#5'),'pine.small':('pineSmall','tree',9.1,'nature N2#6'),'bush.round':('bush','bush',9.2,'nature N2#7'),'bush.flower':('bushFlower','bush',9.3,'nature N2#8'),
 'low.flowers':('flowers','low',9.2,'nature N2#9'),'low.grass':('grassTall','low',9.1,'nature N2#10'),'rock.moss':('rocks','rock',9.2,'nature N2#11'),'lamp.street':('lamp','lamp',9.2,'nature N2#12'),
 'wall.low':('wall','wall',9.2,'details K2#1'),'wall.post':('post','wall',9.1,'details K2#2'),'deck.stairs':('stairs','deck',9.2,'details K3#3'),'deck.bridge':('bridge','deck',9.2,'details K3#4'),
 'water.fall':('waterfall','prop',9.2,'details K2#5'),'fence.picket':('fence','wall',9.1,'details K2#6'),'prop.flowerbed':('flowerbed','prop',9.3,'details K5#7'),'prop.well':('well','prop',9.3,'details K2#8'),
 'prop.barrels':('barrels','prop',9.2,'details K2#9'),'house.stall':('stall2','house',9.3,'details K2#10'),'prop.bench':('bench2','prop',9.1,'details K1#11'),'prop.sign':('signpost','prop',9.2,'details K2#12')}
pieces={}
for path,metap,key in SRC:
    im=Image.open(path).convert('RGBA');meta=json.load(open(metap));meta=meta[key] if key else meta
    for pid,(src,tag,score,where) in SPEC.items():
        if src in meta and pid not in pieces and ((key=='b')==(tag=='house' and src!='stall2') or key is None or key=='n'):
            x,y,w,h=meta[src][:4]
            if key=='n' and tag=='house': continue
            pieces[pid]=(im.crop((x,y,x+w,y+h)),tag,score,where)
missing=[p for p in SPEC if p not in pieces]; assert not missing, missing
# shelf packing
order=sorted(pieces,key=lambda p:-pieces[p][0].height); W=1024; x=y=sh=0; pos={}
for p in order:
    im=pieces[p][0]
    if x+im.width+2>W: x=0;y+=sh+2;sh=0
    pos[p]=(x,y);x+=im.width+2;sh=max(sh,im.height)
H=y+sh; atlas=Image.new('RGBA',(W,H))
for p,(px,py) in pos.items(): atlas.alpha_composite(pieces[p][0],(px,py))
atlas.save('/mnt/user-data/outputs/kit-town.png',optimize=True)
def foot(pid,im,tag):
    w=max(1,round(im.width/T))
    return {'house':[w,3],'tree':[1,1],'bush':[1,1],'rock':[max(1,round(im.width/T)),1],'lamp':[1,1],'wall':[w,1],'prop':[w,1],'deck':[w,max(1,round(im.height/T))],'low':[0,0]}[tag]
man={'kit':'town','version':3,'tile':T,'atlas':'kit-town.png','size':[W,H],
 'tiles':{'ground':'tiles-town-meadow.png','water':'tiles-town-water.png'},
 'tone':{'grass':[[112,150,66],[38,36,22]],'road':[[226,204,168],[22,22,24]],'water':[[42,124,179],[29,37,40]],'calm':0.10},
 'tags':{'house':{'solid':'foot','occlude':1,'night':'windows'},'tree':{'solid':'foot','occlude':1,'sway':1},'bush':{'solid':'foot'},'rock':{'solid':'foot'},
         'low':{'solid':0},'lamp':{'solid':'foot','occlude':1,'light':1},'wall':{'solid':'foot'},'prop':{'solid':'foot'},'deck':{'solid':0,'flat':1}},
 'pieces':{}}
for p,(px,py) in sorted(pos.items()):
    im,tag,score,where=pieces[p]; e={'rect':[px,py,im.width,im.height],'tag':tag,'foot':foot(p,im,tag),'review':{'score':score,'from':where}}
    if tag=='house': e['door']=round(im.width/T/2,2); e['windows']=[[-.24,-.36],[.24,-.36]]
    if tag=='lamp': e['light']=[0,-(im.height-10),40]
    man['pieces'][p]=e
json.dump(man,open('/mnt/user-data/outputs/kit-town.json','w'),ensure_ascii=False,indent=1)
import os; print('atlas',W,'x',H,os.path.getsize('/mnt/user-data/outputs/kit-town.png')//1024,'KB · pieces',len(man['pieces']),'· manifest',os.path.getsize('/mnt/user-data/outputs/kit-town.json'),'bytes')
print('lowest review score',min(v['review']['score'] for v in man['pieces'].values()))
