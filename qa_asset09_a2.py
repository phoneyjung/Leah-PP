# Independent QA for ASSET_SPEC_09 v2.1 section 11 (09-A2 outer outline). Claude.
# usage: python3 -I qa_asset09_a2.py A1.png A2.png outline.json out_dir   ·   self-test: python3 -I qa_asset09_a2.py A1.png --selftest
import sys,os,json,colorsys
from PIL import Image
from collections import deque
L8=['S','SE','E','NE','N','NW','W','SW'];PLUM=(0x3A,0x1E,0x3F)
N4=((1,0),(-1,0),(0,1),(0,-1));N8=N4+((1,1),(1,-1),(-1,1),(-1,-1))
def cells(im):return [im.crop((0,96*i,96,96*i+96)) for i in range(8)]
def dark(c):return (max(c[:3])+min(c[:3]))<=76            # L=(max+min)/2/255 < 0.15
def outside(p):
    ext=set();q=deque()
    for x in range(96):
        for y in range(96):
            if (x in(0,95) or y in(0,95)) and p[x,y][3]==0:ext.add((x,y));q.append((x,y))
    while q:
        a,b=q.popleft()
        for da,db in N4:
            n=(a+da,b+db)
            if 0<=n[0]<96 and 0<=n[1]<96 and n not in ext and p[n][3]==0:ext.add(n);q.append(n)
    return ext
def expected(a1):
    out={}
    for l,c in zip(L8,cells(a1)):
        p=c.load();ext=outside(p)
        op=[(x,y) for x in range(96) for y in range(96) if p[x,y][3]]
        edge=[(x,y) for x,y in op if any((x+a,y+b) in ext for a,b in N4)]
        exp=sorted(e for e in edge if dark(p[e]));nond=sorted(e for e in edge if not dark(p[e]))
        diag=sorted((x,y) for x,y in op if dark(p[x,y]) and (x,y) not in set(edge) and any((x+a,y+b) in ext for a,b in N8))
        inner=sorted((x,y) for x,y in op if dark(p[x,y]) and (x,y) not in set(exp))
        iris=[(x,y) for x,y in op if y<50 and (lambda h,l,s:90<=h*360<=170 and s>.3 and .15<l<.75)(*colorsys.rgb_to_hls(*[v/255 for v in p[x,y][:3]]))]   # same iris rule as the spec 10 analysis
        eye=None
        if len(iris)>=3:
            xs=[a for a,b in iris];ys=[b for a,b in iris];eye=(min(xs)-3,min(ys)-3,max(xs)+3,max(ys)+3)
        out[l]=dict(exp=exp,nondark=nond,diag=diag,inner=inner,eye=eye)
    return out
def check(a1,a2,js):
    E=expected(a1);R={};ok_all=True
    for i,(l,c1,c2) in enumerate(zip(L8,cells(a1),cells(a2))):
        p1,p2=c1.load(),c2.load();e=E[l]
        changed=[(x,y) for x in range(96) for y in range(96) if p1[x,y]!=p2[x,y]]
        ch=set(changed);ex=set(e['exp'])
        pal1=set(p1[x,y][:3] for x in range(96) for y in range(96) if p1[x,y][3])
        newc=set(p2[x,y][:3] for x,y in changed if p2[x,y][3])-pal1
        eyech=[p for p in changed if e['eye'] and e['eye'][0]<=p[0]<=e['eye'][2] and e['eye'][1]<=p[1]<=e['eye'][3]]
        # rollback
        rb=c2.copy();rp=rb.load();rows=js.get(l,[]) if js else []
        bad_json=0
        for r in rows:
            x,y,h=r;rgb=tuple(int(h[k:k+2],16) for k in (1,3,5));rp[x,y]=rgb+(p2[x,y][3],)
        rb_ok=rb.tobytes()==c1.tobytes()
        json_set=set((r[0],r[1]) for r in rows)
        bb1,bb2=c1.getbbox(),c2.getbbox()
        r=dict(changed=len(changed),expected=len(ex),missing=len(ex-ch),extra=len(ch-ex),
            all_plum=all(p2[x,y][:3]==PLUM and p2[x,y][3]==p1[x,y][3] for x,y in changed),
            nondark_touched=len(ch&set(e['nondark'])),inner_touched=len(ch&set(e['inner'])),diag_touched=len(ch&set(e['diag'])),
            eye_zone_changed=len(eyech),alpha_changed=sum(1 for x,y in changed if p1[x,y][3]!=p2[x,y][3]),
            partial=sum(1 for x in range(96) for y in range(96) if 0<p2[x,y][3]<255),
            new_colours=sorted('#%02X%02X%02X'%c for c in newc),bbox_same=bb1==bb2,feet_row=bb2[3]-1,height=bb2[3]-bb2[1],
            json_rows=len(rows),json_matches_changes=json_set==ch,rollback_rgba_equal=rb_ok)
        r['PASS']=(r['missing']==0 and r['extra']==0 and r['all_plum'] and r['nondark_touched']==0 and r['inner_touched']==0 and r['eye_zone_changed']==0
                   and r['alpha_changed']==0 and r['partial']==0 and set(r['new_colours'])<={'#3A1E3F'} and r['bbox_same'] and r['feet_row']==94
                   and r['json_matches_changes'] and r['rollback_rgba_equal'])
        ok_all&=r['PASS'];R[l]=r
    return ok_all,R,E
def previews(a1,a2,E,od):
    os.makedirs(od,exist_ok=True)
    for name,bg in (('light',(236,236,228,255)),('dark',(34,32,44,255))):
        Z=4;W=8*(96*Z+8)+8;sh=Image.new('RGBA',(W,2*(96*Z+8)+8),(128,128,128,255))
        for i,(c1,c2) in enumerate(zip(cells(a1),cells(a2))):
            for r,c in enumerate((c1,c2)):
                b=Image.new('RGBA',(96,96),bg);b.alpha_composite(c);sh.paste(b.resize((96*Z,96*Z),Image.NEAREST),(8+i*(96*Z+8),8+r*(96*Z+8)))
        sh.save(os.path.join(od,f'a2-before-after-{name}.png'),optimize=True)
    Z=6;sh=Image.new('RGBA',(8*(96*Z+8)+8,96*Z+16),(240,240,244,255))
    for i,(l,c2) in enumerate(zip(L8,cells(a2))):
        b=Image.new('RGBA',(96,96),(236,236,228,255));b.alpha_composite(c2);g=b.convert('L').convert('RGBA');px=g.load()
        for x,y in E[l]['diag']:px[x,y]=(255,140,0,255)
        for x,y in E[l]['exp']:px[x,y]=(58,30,63,255)
        sh.paste(g.resize((96*Z,96*Z),Image.NEAREST),(8+i*(96*Z+8),8))
    sh.save(os.path.join(od,'a2-diagonal-205-unchanged.png'),optimize=True)
if __name__=='__main__':
    a1=Image.open(sys.argv[1]).convert('RGBA')
    if sys.argv[2]=='--selftest':
        E=expected(a1);good=a1.copy();gp=good.load();js={}
        for i,l in enumerate(L8):
            js[l]=[]
            for x,y in E[l]['exp']:
                c=gp[x,96*i+y];js[l].append([x,y,'#%02X%02X%02X'%c[:3]]);gp[x,96*i+y]=(0x3A,0x1E,0x3F,c[3])
        ok,R,_=check(a1,good,js);print('selftest good ->',ok,{l:r['changed'] for l,r in R.items()})
        bad=good.copy();bp=bad.load();x,y=E['S']['diag'][0];bp[x,y]=(0x3A,0x1E,0x3F,255)   # touch one diagonal pixel
        ok2,R2,_=check(a1,bad,js);print('selftest bad (diag touched) ->',ok2,R2['S']['diag_touched'],R2['S']['extra'])
        js2=json.loads(json.dumps(js));js2['N']=js2['N'][1:]
        ok3,R3,_=check(a1,good,js2);print('selftest bad (json missing 1) ->',ok3,R3['N']['rollback_rgba_equal'])
        sys.exit(0)
    a2=Image.open(sys.argv[2]).convert('RGBA');js=json.load(open(sys.argv[3],encoding='utf-8'))
    ok,R,E=check(a1,a2,js);od=sys.argv[4]
    json.dump(dict(PASS=ok,rows=R),open(os.path.join(od,'a2-qa.json'),'w'),indent=1,ensure_ascii=False)
    previews(a1,a2,E,od);print('PASS' if ok else 'FAIL');[print(l,r) for l,r in R.items()]
