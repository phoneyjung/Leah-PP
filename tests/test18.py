import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
exec(open('test17.py').read().split('async def run')[0])
JOYDRAG="""(async(dx,dy,ms)=>{const el=document.getElementById('joy');const r=el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
 const mk=(n,x,y)=>new PointerEvent(n,{pointerId:21,pointerType:'touch',clientX:x,clientY:y,bubbles:true,isPrimary:true});
 el.dispatchEvent(mk('pointerdown',cx,cy));el.dispatchEvent(mk('pointermove',cx+dx,cy+dy));await new Promise(r=>setTimeout(r,ms));el.dispatchEvent(mk('pointerup',cx+dx,cy+dy))})"""
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        async def open_(w,h,touch):
            ctx=await br.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            async def route(r):
                u=r.request.url
                if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
                if u.startswith('http://localhost'): return await r.continue_()
                return await r.abort()
            await pg.route('**/*',route)
            await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
            await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']")
            return ctx,pg,errs
        ctx,pg,errs=await open_(1280,720,False)
        print('PC: joystick shown',await pg.evaluate("!document.getElementById('joy').hidden"));await ctx.close()
        ctx,pg,errs=await open_(844,390,True)
        print('phone: joystick shown',await pg.evaluate("!document.getElementById('joy').hidden"))
        ov=await pg.evaluate("(()=>{const a=document.getElementById('joy').getBoundingClientRect(),b=document.getElementById('zoomBox').getBoundingClientRect(),c=document.querySelector('.tools').getBoundingClientRect();const hit=(p,q)=>!(p.right<q.left||q.right<p.left||p.bottom<q.top||q.bottom<p.top);return{joyVsZoom:hit(a,b),joyVsTools:hit(a,c)}})()")
        print('overlap',ov)
        await pg.evaluate("PP.goScene('village','start',true)");await pg.wait_for_timeout(300)
        for name,dx,dy in [('right',50,0),('up',0,-50),('left',-50,0)]:
            p0=await pg.evaluate('[PP.player.x,PP.player.z]');await pg.evaluate(f"{JOYDRAG}({dx},{dy},1500)");p1=await pg.evaluate('[PP.player.x,PP.player.z]')
            await pg.wait_for_timeout(600);p2=await pg.evaluate('[PP.player.x,PP.player.z]')
            print(f' joystick {name}: moved dx={p1[0]-p0[0]:+.2f} dz={p1[1]-p0[1]:+.2f} | after release still moving: {abs(p2[0]-p1[0])+abs(p2[1]-p1[1])>0.01}')
        # tap-walk still works with joystick on
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.wait_for_timeout(300)
        x0=await pg.evaluate('[PP.player.x,PP.player.z]');await pg.evaluate(f"{POINTER}('touch',[[422,120]],80)");await pg.wait_for_timeout(2500);x1=await pg.evaluate('[PP.player.x,PP.player.z]')
        print(' tap-walk with joystick on moved',round(((x1[0]-x0[0])**2+(x1[1]-x0[1])**2)**.5,2))
        # action button next to a crystal
        await pg.evaluate("(()=>{const o=PP.CRYS[0];const c=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[o.x+a,o.z+b]).find(([x,z])=>!PP.isWall(Math.floor(x),Math.floor(z)));PP.player.x=c[0];PP.player.z=c[1]})()");await pg.wait_for_timeout(700)
        shown=await pg.evaluate("!document.getElementById('bAct').hidden");label=await pg.text_content('#bAct')
        await pg.screenshot(path='j_cave.png')
        await pg.click('#bAct',force=True);await pg.wait_for_timeout(300);quiz=await pg.evaluate("!document.getElementById('quiz').hidden")
        print(' action button near crystal shown',shown,repr(label),'-> quiz opened',quiz)
        a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext');await pg.wait_for_timeout(600)
        print(' action button after crystal woke (should hide)',await pg.evaluate("!document.getElementById('bAct').hidden"))
        # menu toggle
        await pg.click('#bMenu');await pg.click('#sJoy');hid=await pg.evaluate("document.getElementById('joy').hidden");saved=await pg.evaluate('PP.Store.load(PP.S.id).settings.joy')
        print(' menu toggle -> joystick hidden',hid,'saved',saved,'errors',errs);await ctx.close();await br.close()
asyncio.run(main())
