import json, random, math, numpy as np
from PIL import Image
from collections import Counter, deque
random.seed(42)
W=json.load(open('/mnt/user-data/outputs/world-blocks.json')); B=W['blocks']; N=20; COL='ABCDEFGHIJKLMNOPQRST'
art=np.asarray(Image.open('/mnt/user-data/outputs/world-map-art.png').convert('RGB')).astype(int); BW,BH=1536/N,1024/N
bid=lambda c,r:f'{COL[c]}{r+1}'
# 1) refine terrain from the painted world map (forest / mountain / water / meadow) for land blocks of the light realm
for k,b in B.items():
    c,r=b['col'],b['row']; px=art[int(r*BH):int((r+1)*BH),int(c*BW):int((c+1)*BW)].reshape(-1,3)
    R,G,Bl=px[:,0],px[:,1],px[:,2]; L=(R+G+Bl)/3
    water=((Bl>R+25)&(Bl>G)).mean(); forest=((G>R+8)&(G>Bl)&(L<95)).mean(); grey=((abs(R-G)<14)&(abs(G-Bl)<16)&(L>150)).mean()
    b['f']={'water':round(float(water),2),'forest':round(float(forest),2),'stone':round(float(grey),2)}
    if b['biome'] in('grass','valley'):
        if grey>.2: b['biome']='mountain'
        elif forest>.33: b['biome']='forest'
        elif water>.25: b['biome']='water'
        else: b['biome']='meadow'
    if b['biome']=='mist': b['biome']='mystery'
    if b['biome'] in('thorn','mirror'): b['realm']='dark'
land=lambda k:B[k]['realm']!='sea'
# 2) towns with their crystal (CRYSTAL_BIBLE) · chapter
TOWNS={'H9':('หมู่บ้านพาเพลิน','village','กอผลึกอเมทิสต์เส้นใบไม้เขียว · กลาง','ไลแลค',1),
 'H7':('นครประทีป','capital','ยอดผลึกทองอำพันหลายชั้นทรงโคม งอกจากลานกลางเมือง · ใหญ่','ทองอุ่น',2),
 'G7':('Lantern Academy','academy','ผลึกมุกทรงกลมงอกจากแท่นราก มีห่วงทองครอบ · กลาง','รุ้งอ่อน',2),
 'J9':('หมู่บ้านเห็ด','village','ผลึกทรงหมวกเห็ด · กลาง','ชมพูเรือง',2),
 'F19':('เมืองปะการัง','town','กิ่งปะการังผลึก · ใหญ่','ฟ้าน้ำทะเล',3),
 'J3':('หมู่บ้านน้ำพุร้อน','village','จีโอดผ่าซีกไส้ส้ม · ใหญ่','ส้ม',4),
 'D12':('เมืองพีระมิด','town','บุษราคัมทรงพีระมิดคว่ำ · กลาง','ทองแดด',5),
 'E4':('หมู่บ้านหิมะ','village','ปริซึมน้ำแข็ง 3 แท่งงอกจากพื้นหิมะ · กลาง','ฟ้าน้ำแข็ง',6),
 'C7':('เมืองกลไก','town','ผลึกในกรงทองเหลืองมีเฟือง · กลาง','เขียวทองแดง',7),
 'M5':('เกาะลอยฟ้า','sky','ผลึกขาวรุ้งงอกจากเกาะ รากผลึกห้อยลงถึงพื้นดิน · ใหญ่','ขาวรุ้ง',8),
 'M9':('วิหารต้นไม้โบราณ','sanctuary','ผลึกรากต้นไม้โบราณ · ยักษ์','ทองอ่อน',9),
 'O10':('ป้อมตะเกียงสุดท้าย','fort','ผลึกทองงอกกลางป้อม จุดโคมยักษ์ตามแนว · ใหญ่','ทอง',10),
 'S10':('หอคอยผู้กลืนแสง','tower','ออบซิเดียน · ใหญ่','ม่วงหม่น',10)}
for k in TOWNS: B[k]['realm']=B[k]['realm'] if B[k]['realm']!='sea' else 'light'
# 3) dungeons (defined now, built later): entrance block, floors, boss every 3 floors, chapter
DUNGEONS={'H9':('ถ้ำอเมทิสต์ (เนินในหมู่บ้าน)',6,1,'มอนมืดสิงผู้พิทักษ์หิน · ชั้น 6 หลังลานบอสมีหินถล่มทางต่อ'),
 'H5':('ถ้ำหน้าผา → ทางขึ้นหอสมุด',6,9,'ทางขึ้นหอสมุดคริสตัล'),'J10':('ถ้ำรากเห็ด',6,2,'ราดำยักษ์'),'G18':('ถ้ำแนวปะการัง',6,3,'ปลิงเงายักษ์'),
 'J4':('ปล่องภูเขาไฟ',6,4,'ก้อนลาวาเงา'),'D13':('พีระมิดใต้ทราย',6,5,'งูเงาทราย'),'E3':('ถ้ำน้ำแข็ง',6,6,'หมาป่าน้ำแข็งเงา'),
 'C8':('โรงงานเฟือง',6,7,'หุ่นเฟืองเงา'),'M4':('วิหารลอยฟ้า',3,8,'เงาพายุ'),'M10':('รากต้นไม้โบราณ',6,9,'เงาของผู้สร้าง (ไม่ต่อสู้ · ปริศนา)'),
 'P8':('เหมืองแสงร้าง',9,10,'ผู้ใหญ่เท่านั้น'),'S11':('ใต้หอคอย',9,10,'ผู้กลืนแสง (ตอนจบ · สมดุล)')}
# 4) monster tables by terrain: (light monsters, dark monsters)
MON={'meadow':(['สไลม์อเมทิสต์','กระต่ายใบไม้','ผึ้งดอกไม้'],['เงาหญ้า']),'forest':(['เห็ดน้อย','กระรอกลูกโอ๊ก','นกฮูกโคม'],['หมาป่าเงา']),
 'mountain':(['ค้างคาวอเมทิสต์','โกเลมหินจิ๋ว','แพะภูเขา'],['ค้างคาวเงา','ก้อนหินเงา']),'snow':(['แมวน้ำหิมะ','เพนกวินขนฟู'],['หมาป่าน้ำแข็งเงา']),
 'desert':(['กิ้งก่าทราย','แมงป่องจิ๋ว'],['งูเงาทราย']),'volcano':(['ซาลาแมนเดอร์จิ๋ว','ไก่ไฟ'],['ก้อนลาวาเงา']),'mushroom':(['เห็ดเรืองแสง','ผีเสื้อสปอร์'],['ราดำ']),
 'water':(['กบบัว','ปูน้อย'],['ปลิงเงา']),'plateau':(['หุ่นเฟืองน้อย','นกทองเหลือง'],['หุ่นเฟืองเงา']),'mystery':(['วิญญาณดาว','กวางแสง'],['เงาหมอก']),
 'dark':([],['เงาเถ้า','อัศวินเงา','ผีเสื้อมืด']),'thorn':([],['เถาหนามเงา','หมาป่าเงาใหญ่']),'mirror':([],['เงาสะท้อน'])}
DECOR={'meadow':'ทุ่งหญ้า ดอกไม้ป่า ก้อนหิน รั้วไม้ ทางดิน','forest':'ต้นโอ๊ก ต้นสน พุ่มเบอร์รี่ เห็ด ขอนไม้ ลำธารเล็ก','mountain':'หน้าผา ก้อนหินใหญ่ สนภูเขา ทางชัน น้ำตกเล็ก',
 'snow':'กองหิมะ สนหิมะ น้ำแข็ง หินคริสตัลน้ำแข็ง','desert':'เนินทราย กระบองเพชร ซากเสาหิน ต้นปาล์ม','volcano':'หินลาวาเย็น บ่อน้ำร้อน ไอน้ำ หินดำ',
 'mushroom':'เห็ดยักษ์เรืองแสง เถาวัลย์ สปอร์ลอย','water':'กอบัว ดงกก ท่าน้ำ หินริมน้ำ','plateau':'ที่ราบหิน เฟืองโบราณ ท่อทองเหลือง',
 'mystery':'หมอกม่วงเงิน เกาะลอย น้ำตกกลับหัว ออโรร่า','dark':'ทุ่งเถ้า ต้นไม้แห้ง หินดำ หมอกต่ำ','thorn':'ต้นหนามดำ เถาวัลย์ดำ','mirror':'น้ำนิ่งสีดำ หินเงา'}
PURPOSE={'meadow':['ทุ่งดอกไม้·จับผีเสื้อ','บ่อตกปลา','สวนผลไม้·เก็บผล','หมู่บ้านเล็ก','ค่ายพ่อค้าเร่','ฟาร์มแกะ'],'forest':['พุ่มเบอร์รี่·เก็บผล','บ้านคนตัดไม้','ลานแคมป์·กองไฟ','วงเห็ดนางฟ้า·ความลับ','ซากศาลโคม'],
 'mountain':['เหมืองหินเล็ก·ขุดแร่','ถ้ำเล็ก·ของซ่อน','ทะเลสาบบนเขา·ตกปลา'],'snow':['บ่อน้ำแข็งตกปลา','กระท่อมนักเดินทาง'],'desert':['โอเอซิส','ซากเมืองเก่า·ขุด','กองคาราวาน'],
 'volcano':['บ่อน้ำพุร้อน','เหมืองหินไฟ'],'mushroom':['เก็บสปอร์เรืองแสง','บ้านต้นเห็ด'],'water':['ท่าตกปลา','บึงจับกบ'],'plateau':['ซากเครื่องจักร·ขุดเฟือง'],
 'mystery':['เกาะลอยมีหีบ','ศิลาจารึกผู้สร้าง'],'dark':['ค่ายผู้พิทักษ์','ซากหมู่บ้าน'],'thorn':['ค่ายผู้พิทักษ์'],'mirror':['ศิลาจารึกเงา']}
SCENIC={'meadow':'เนินชมวิว','forest':'ลานแสงลอดใบไม้','mountain':'จุดชมน้ำตก','snow':'หน้าผาออโรร่า','desert':'เนินทรายพระอาทิตย์ตก','volcano':'ขอบปล่องชมลาวา',
 'mushroom':'สระสะท้อนเห็ดเรืองแสง','water':'ริมน้ำพระอาทิตย์ตก','plateau':'หอดูดาวเก่า','mystery':'สะพานเมฆ','dark':'จุดชมดาวมืด','thorn':'จุดชมดาวมืด','mirror':'ทะเลสาบกระจก'}
# 5) roads: shortest land paths between towns (Paplern first), avoid sea
def bfs(a,b):
    prev={a:None}; q=deque([a])
    while q:
        k=q.popleft()
        if k==b: break
        c,r=B[k]['col'],B[k]['row']
        for dc,dr in((1,0),(-1,0),(0,1),(0,-1)):
            cc,rr=c+dc,r+dr
            if 0<=cc<N and 0<=rr<N:
                n=bid(cc,rr)
                if n not in prev and land(n): prev[n]=k; q.append(n)
    path=[];k=b
    while k: path.append(k); k=prev.get(k)
    return path[::-1] if path and path[-1]==a else []
road=set()
for a,b in [('H9','H7'),('H7','G7'),('H9','J9'),('H9','F19'),('H7','J3'),('H9','D12'),('H7','E4'),('G7','C7'),('J9','M9'),('M9','O10'),('O10','S10'),('H7','H5'),('M9','M5')]:
    road|=set(bfs(a,b))
# 6) roles 60/30/10 per realm (towns, dungeon entrances = destinations)
safe=lambda k:min(abs(B[k]['col']-B[t]['col'])+abs(B[k]['row']-B[t]['row']) for t in TOWNS if TOWNS[t][1] in('village','capital','academy','town','sky','sanctuary'))
for realm in('light','mystery','dark'):
    ks=[k for k,b in B.items() if b['realm']==realm]; fixed=[k for k in ks if k in TOWNS or k in DUNGEONS]
    rest=[k for k in ks if k not in fixed]; random.shuffle(rest)
    nD=round(.6*len(ks))-len(fixed); nS=round(.1*len(ks))
    # scenic prefers edges/coast/mountain; destinations prefer near roads and towns
    rest.sort(key=lambda k:(-(B[k]['f']['water']+B[k]['f']['stone']),))
    S=set(rest[:nS]); others=[k for k in rest if k not in S]
    others.sort(key=lambda k:(k not in road, safe(k)+random.random()))
    D=set(others[:max(0,nD)])
    for k in ks: B[k]['role']='D' if (k in fixed or k in D) else 'S' if k in S else 'P'
# 7) fill each map
conv=0
for k,b in B.items():
    if b['realm']=='sea': continue
    t=b['biome']; light,dark=MON.get(t,([],[])); d=safe(k)
    near= d<=1 and b['realm']=='light'
    b['monsters']={'light':[] if b['role']=='S' or k in TOWNS else light[:2 if near else 3],'dark':[] if (b['role']=='S' or k in TOWNS or near) else dark[:1 if d<=3 else 2]}
    b['decor']=DECOR.get(t,'')
    if k in TOWNS:
        n,kind,cr,glow,ch=TOWNS[k]; b.update(name=n,kind=kind,chapter=ch,crystal={'shape':cr,'glow':glow},
          buildings=['ลานคริสตัลกลางเมือง + นักเวทประจำเมือง','ร้านอาวุธ/อุปกรณ์','ร้านของใช้','โรงเตี๊ยม','บ้านชาวบ้าน','บอร์ดภารกิจ']+(['ปราสาท/ลานพระราชวัง','ตลาดใหญ่','สมาคมอาชีพ (เปลี่ยนอาชีพ)'] if kind=='capital' else [])+(['ห้องเรียน','หอสมุด','สนามฝึก'] if kind=='academy' else [])+(['ไปรษณีย์','ร้านยายนวล','บ้านของเรา (ประตูไปบ้าน+ฟาร์ม)'] if k=='H9' else []))
    else:
        if b['role']=='D': b['purpose']=random.choice(PURPOSE.get(t,['จุดพัก']))
        if b['role']=='S': b['purpose']=SCENIC.get(t,'จุดชมวิว')
        if b['role']=='P': b['purpose']='ทางผ่าน·มีมอน'
        b['buildings']=(['กระท่อม 3–5 หลัง','เครื่องแปลงพลังงาน'] if 'หมู่บ้านเล็ก' in b.get('purpose','') else [])
        if b['role']=='P' and k in road:
            conv+=1
            if conv%2==0: b['buildings']=b['buildings']+['เครื่องแปลงพลังงาน']
    if k in DUNGEONS: dn,fl,ch,boss=DUNGEONS[k]; b['dungeon']={'name':dn,'floors':fl,'boss_every':3,'chapter':ch,'note':boss,'built':k=='H9'}
    b['road']=k in road
    c,r=b['col'],b['row']; b['exits']=[d2 for d2,(dc,dr) in {'n':(0,-1),'s':(0,1),'w':(-1,0),'e':(1,0)}.items() if 0<=c+dc<N and 0<=r+dr<N and land(bid(c+dc,r+dr))]
    if 'chapter' not in b:
        nearest=min((t for t in TOWNS),key=lambda t:abs(B[t]['col']-c)+abs(B[t]['row']-r)); b['chapter']=TOWNS[nearest][4]
for k,v in {'G9':'บ้านเรา · ฟาร์ม (ประตูจากหมู่บ้าน)','H8':'ทางเชื่อม·ทุ่งนา','H10':'ป่า·ทางเดิน','H11':'สระบัว·ตกปลา','H6':'ลานพระราชวัง','H4':'หอสมุดคริสตัล (ยอดเขา)','G14':'ทะเลสาบใหญ่'}.items():
    B[k]['name']=v; B[k]['role']='D'
json.dump({'grid':[N,N],'tiles_per_map':[48,32],'towns':TOWNS,'dungeons':DUNGEONS,'blocks':B},open('/mnt/user-data/outputs/world-atlas.json','w'),ensure_ascii=False,indent=0)
# CSV for the phone (opens in Sheets)
import csv
with open('/mnt/user-data/outputs/world-atlas.csv','w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f); w.writerow(['บล็อก','ดินแดน','ภูมิประเทศ','บทบาท','ชื่อ/หน้าที่','มอนแสง','มอนมืด','อาคาร','ของตกแต่ง','ดันเจี้ยน','ถนน','ทางออก','บท'])
    for r in range(N):
        for c in range(N):
            k=bid(c,r); b=B[k]
            if b['realm']=='sea': continue
            w.writerow([k,b['realm'],b['biome'],{'D':'จุดหมาย','P':'ทางผ่าน·มีมอน','S':'ชมวิว'}[b['role']],b.get('name') or b.get('purpose',''),' '.join(b['monsters']['light']),' '.join(b['monsters']['dark']),' · '.join(b.get('buildings',[])),b['decor'],b.get('dungeon',{}).get('name',''),'✓' if b['road'] else '',''.join(b['exits']),b['chapter']])
cnt=Counter((b['realm'],b['role']) for b in B.values() if b['realm']!='sea')
for realm in('light','mystery','dark'):
    tot=sum(v for (re,ro),v in cnt.items() if re==realm); print(realm,tot,{ro:f"{cnt[(realm,ro)]} ({round(100*cnt[(realm,ro)]/tot)}%)" for ro in 'DPS'})
print('road maps',len(road),'converters',sum('เครื่องแปลงพลังงาน' in b.get('buildings',[]) for b in B.values()),'terrain',Counter(b['biome'] for b in B.values() if b['realm']!='sea'))
