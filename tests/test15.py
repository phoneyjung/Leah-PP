import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio,sys
from playwright.async_api import async_playwright
BLOCK=sys.argv[1:]
async def lines(pg):
    n=0;who=[]
    while await pg.evaluate('PP.dlgOpen') and n<20:
        who.append(await pg.text_content('#dWho'));face=await pg.evaluate("document.querySelector('#dFace canvas')?'img':document.getElementById('dFace').textContent")
        who[-1]+=f'[{face}]';await pg.click('#dlg');n+=1
    return who
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await (await br.new_context(viewport={'width':1180,'height':820})).new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http://localhost'):
                if any(b in u for b in BLOCK): return await r.fulfill(status=404,body='')
                return await r.continue_()
            return await r.abort()
        await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        await pg.click('#bStart');await pg.wait_for_timeout(1800)
        await pg.screenshot(path='d_intro.png')
        print('intro',await lines(pg))
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.id==='nuan'))");await pg.wait_for_timeout(200)
        print('shop first time',await lines(pg),'shop open after',await pg.evaluate("!document.getElementById('shop').hidden"))
        await pg.click('#shopClose');await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.id==='nuan'))");await pg.wait_for_timeout(200)
        print('shop 2nd time: dialog',await pg.evaluate('PP.dlgOpen'),'shop open',await pg.evaluate("!document.getElementById('shop').hidden"));await pg.click('#shopClose')
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.wait_for_timeout(300)
        print('cave first entry',await lines(pg))
        await pg.evaluate("PP.interact(PP.CAVE.objs.find(o=>o.type==='peb'))");await pg.wait_for_timeout(200)
        print('peb meet',await lines(pg))
        a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext');await pg.wait_for_timeout(200)
        print('peb friend',await lines(pg))
        await pg.evaluate("PP.interact(PP.CAVE.objs.find(o=>o.type==='peb'))");print('peb hint',await lines(pg))
        got=[]
        for c in range(10):
            await pg.evaluate(f'PP.interact(PP.CRYS[{c}])');await pg.wait_for_timeout(60)
            a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext');await pg.wait_for_timeout(60)
            l=await lines(pg)
            if l: got.append((c+1,l))
        print('crystal dialogs',got)
        await pg.evaluate("PP.interact({type:'gate'})");await pg.wait_for_timeout(200)
        print('clear',await lines(pg),'win modal',await pg.evaluate("!document.getElementById('msg').hidden"))
        await pg.click('#mOk');await pg.wait_for_timeout(700)
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='door'))");await pg.wait_for_timeout(700)
        print('house first',await lines(pg))
        await pg.screenshot(path='d_house.png')
        await pg.reload();await pg.wait_for_timeout(900);await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        print('after reload dialog open?',await pg.evaluate('PP.dlgOpen'),'seen',await pg.evaluate('PP.S.seen'))
        # dad player: helpers are mom and leah
        await pg.evaluate("localStorage.clear()");await pg.reload();await pg.wait_for_timeout(900)
        await pg.click('#rChar .char >> nth=1');await pg.fill('#iName','Pho');await pg.click('#bStart');await pg.wait_for_timeout(1500)
        print('dad intro speakers',await lines(pg))
        print('errors',errs);await br.close()
asyncio.run(main())
