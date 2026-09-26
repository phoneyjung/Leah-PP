import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
POINTER="""(async(type,pts,holdMs)=>{const cv=document.querySelector('#stage canvas');const mk=(n,x,y)=>new PointerEvent(n,{pointerId:7,pointerType:type,clientX:x,clientY:y,bubbles:true,isPrimary:true});
  cv.dispatchEvent(mk('pointerdown',pts[0][0],pts[0][1]));for(const [x,y] of pts.slice(1)){window.dispatchEvent(mk('pointermove',x,y));await new Promise(r=>setTimeout(r,16))}
  await new Promise(r=>setTimeout(r,holdMs));const l=pts[pts.length-1];window.dispatchEvent(mk('pointerup',l[0],l[1]))})"""
async def run(br,vw,vh,touch):
    ctx=await br.new_context(viewport={'width':vw,'height':vh},has_touch=touch,is_mobile=touch)
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    async def route(r):
        u=r.request.url
        if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
        if u.startswith('http://localhost'): return await r.continue_()
        return await r.abort()
    await pg.route('**/*',route)
    await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
    return pg,errs,ctx
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        # portrait phone -> rotate screen shown
        pg,errs,ctx=await run(br,390,844,True)
        print('portrait phone: rotate overlay shown',await pg.evaluate("!document.getElementById('rotate').hidden"));await pg.screenshot(path='o_portrait.png');await ctx.close()
        # desktop narrow window -> no overlay
        pg,errs,ctx=await run(br,700,900,False)
        print('desktop tall window: overlay shown',await pg.evaluate("!document.getElementById('rotate').hidden"));await ctx.close()
        # landscape phone
        pg,errs,ctx=await run(br,844,390,True)
        print('landscape phone: overlay shown',await pg.evaluate("!document.getElementById('rotate').hidden"))
        await pg.screenshot(path='o_title.png')
        await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.screenshot(path='o_dlg.png')
        await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']")
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.wait_for_timeout(500)
        cx,cy=422,120  # a spot above the player on screen
        res={}
        for name,type,pts,hold in [('quick tap','touch',[(cx,cy)],60),('long press 800ms','touch',[(cx,cy)],800),('tap with 15px wobble','touch',[(cx,cy),(cx+8,cy+6),(cx+14,cy+5)],120)]:
            await pg.evaluate("PP.player.x=PP.CAVE.start.x;PP.player.z=PP.CAVE.start.z;PP.player.path=null");await pg.wait_for_timeout(200)
            y0=await pg.evaluate('PP.yaw');await pg.evaluate(f"{POINTER}('{type}',{[list(p) for p in pts]},{hold})");await pg.wait_for_timeout(250)
            res[name]={'walks':await pg.evaluate('!!PP.player.path||Math.hypot(PP.player.x-PP.CAVE.start.x,PP.player.z-PP.CAVE.start.z)>0.05'),'camera turned':abs(await pg.evaluate('PP.yaw')-y0)>1e-3}
        y0=await pg.evaluate('PP.yaw');await pg.evaluate(f"{POINTER}('touch',[[300,200],[340,200],[380,200],[420,200]],50)");await pg.wait_for_timeout(200)
        res['one-finger swipe']={'camera turned':abs(await pg.evaluate('PP.yaw')-y0)>1e-3}
        y0=await pg.evaluate('PP.yaw');await pg.evaluate(f"{POINTER}('mouse',[[300,200],[340,200],[380,200],[420,200]],50)");await pg.wait_for_timeout(200)
        res['mouse drag']={'camera turned':abs(await pg.evaluate('PP.yaw')-y0)>1e-3,'walks':await pg.evaluate('!!PP.player.path')}
        y0=await pg.evaluate('PP.yaw');await pg.click('#rL');y1=await pg.evaluate('PP.yaw');await pg.click('#rR');await pg.click('#rR');y2=await pg.evaluate('PP.yaw')
        res['rotate buttons (deg)']=[round((y1-y0)*57.3),round((y2-y1)*57.3)]
        for k,v in res.items():print(' ',k,v)
        await pg.evaluate("PP.goScene('village','fromCave',true)");await pg.wait_for_timeout(300);print('camera reset on scene change',await pg.evaluate('PP.yaw'))
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.evaluate('PP.interact(PP.CRYS[0])');await pg.wait_for_timeout(300)
        await pg.screenshot(path='o_quiz.png')
        box=await pg.evaluate("(()=>{const r=document.querySelector('#quiz .card').getBoundingClientRect();return[r.top,r.bottom,innerHeight]})()")
        a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');nb=await pg.evaluate("document.getElementById('qNext').getBoundingClientRect().bottom")
        print('quiz card top/bottom/screen',box,'next button bottom',round(nb),'fits' if nb<=box[2] else 'NEEDS SCROLL')
        await pg.screenshot(path='o_quiz2.png')
        print('errors',errs);await ctx.close();await br.close()
asyncio.run(main())
