import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
exec(open('test17.py').read().split('async def run')[0])
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        ctx=await br.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True);pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http://localhost'): return await r.continue_()
            return await r.abort()
        await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']")
        # 1. map audit: start cell open, every object reachable from the start
        audit=await pg.evaluate("""(()=>{const out={};for(const k of ['village','cave','house']){PP.goScene(k,'start',true);const M=PP.M,st=k==='house'?M.start:M.start;
            const W=M.W,H=M.H,sx=Math.floor(st.x),sz=Math.floor(st.z),seen=new Set([sx+','+sz]),q=[[sx,sz]];
            while(q.length){const [x,z]=q.shift();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,nz=z+b,kk=nx+','+nz;if(!PP.isWall(nx,nz)&&!seen.has(kk)){seen.add(kk);q.push([nx,nz])}}}
            let free=0;for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(!PP.isWall(x,z))free++;
            const objs=M.objs.map(o=>{const cx=Math.floor(o.x),cz=Math.floor(o.z);const near=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>seen.has((cx+a)+','+(cz+b)));return near});
            out[k]={startOpen:!PP.isWall(sx,sz),reachable:seen.size+'/'+free,objectsReachable:objs.filter(Boolean).length+'/'+objs.length}}return out})()""")
        print('map audit',audit)
        # 2. real walking by taps in each scene: distance actually moved
        for scene in ['cave','village','house']:
            await pg.evaluate(f"PP.goScene('{scene}','start',true)");await pg.wait_for_timeout(400)
            moved=[]
            for pt in [(422,120),(250,250),(600,250),(422,330)]:
                x0=await pg.evaluate('[PP.player.x,PP.player.z]')
                await pg.evaluate(f"{POINTER}('touch',[[{pt[0]},{pt[1]}]],80)");await pg.wait_for_timeout(2500)
                x1=await pg.evaluate('[PP.player.x,PP.player.z]');moved.append(round(((x1[0]-x0[0])**2+(x1[1]-x0[1])**2)**.5,2))
            print(scene,'distance moved per tap',moved)
        # 3. old broken save standing on a blocked cell gets pushed out
        await pg.evaluate("PP.goScene('village','start',true);PP.player.x=19.5;PP.player.z=5.5");r=await pg.evaluate('PP.unstick()');print('unstick from inside the shop',r,await pg.evaluate('[PP.player.x,PP.player.z]'))
        await pg.screenshot(path='w_land.png')
        print('errors',errs);await br.close()
asyncio.run(main())
