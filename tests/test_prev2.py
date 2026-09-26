import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await (await br.new_context(viewport={'width':1180,'height':820})).new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http'): return await r.abort()
            return await r.continue_()
        await pg.route('**/*',route)
        await pg.goto('file:///mnt/user-data/outputs/leah-pp-preview.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        await pg.click('#rLang >> text=English');await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1']")
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='cave'))");await pg.wait_for_timeout(800)
        await pg.evaluate("PP.interact(PP.CRYS[0])");await pg.wait_for_timeout(200);q=await pg.evaluate('PP.quiz.q.en.q')
        print('scene',await pg.evaluate('PP.S.scene'),'q',q[:60],'n',await pg.evaluate('PP.QB.all.length'),'errors',errs);await br.close()
asyncio.run(main())
