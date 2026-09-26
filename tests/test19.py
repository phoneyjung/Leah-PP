import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        pg=await (await br.new_context(viewport={'width':1180,'height':820})).new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http://localhost'): return await r.continue_()
            return await r.abort()
        await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        print('title: music playing',await pg.evaluate('!!PP.MUSIC.timer'))
        await pg.click('#bStart');await pg.wait_for_timeout(1500)
        print('intro dialogue: level',await pg.evaluate('PP.MUSIC.level()'))
        await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']")
        async def count(ms):
            a=await pg.evaluate('PP.MUSIC.notes');await pg.wait_for_timeout(ms);b=await pg.evaluate('PP.MUSIC.notes');return b-a
        print('village track',await pg.evaluate('PP.MUSIC.name'),'notes in 3s',await count(3000),'level',await pg.evaluate('PP.MUSIC.level()'))
        await pg.evaluate("PP.goScene('cave','start',true)");print('cave track',await pg.evaluate('PP.MUSIC.name'),'notes in 3s',await count(3000))
        await pg.evaluate("PP.goScene('house','start',true)");print('house track',await pg.evaluate('PP.MUSIC.name'),'notes in 3s',await count(3000))
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.evaluate('PP.interact(PP.CRYS[0])');await pg.wait_for_timeout(300)
        print('during quiz level',await pg.evaluate('PP.MUSIC.level()'))
        a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext');await pg.wait_for_timeout(1500)
        while await pg.evaluate('PP.dlgOpen'): await pg.evaluate('PP.nextLine()')
        await pg.click('#bMenu');await pg.click('#sMusic');print('music off: timer',await pg.evaluate('!!PP.MUSIC.timer'),'notes in 2s',await count(2000),'saved',await pg.evaluate('PP.Store.load(PP.S.id).settings.music'))
        await pg.click('#sMusic');print('music on again: track',await pg.evaluate('PP.MUSIC.name'),'notes in 2s',await count(2000))
        await pg.click('#mOk')
        await pg.reload();await pg.wait_for_timeout(900);await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        print('after reload continuing in',await pg.evaluate('PP.S.scene'),'track',await pg.evaluate('PP.MUSIC.name'))
        await pg.evaluate('PP.S.settings.music=false;PP.Store.save(PP.S)');await pg.click('#bMenu');await pg.click('#mAlt');await pg.wait_for_timeout(300)
        print('back to title: music stopped',not await pg.evaluate('!!PP.MUSIC.timer'))
        print('errors',errs);await br.close()
asyncio.run(main())
