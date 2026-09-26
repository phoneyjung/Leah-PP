import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio,json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        ctx=await br.new_context(viewport={'width':1180,'height':820},has_touch=True);pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
        pg.on('console',lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http://localhost'): return await r.continue_()
            return await r.abort()
        await pg.add_init_script('/*AUTOSKIP*/setInterval(()=>{try{while(window.PP&&PP.dlgOpen)PP.nextLine()}catch(e){}},30)');await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(1000)
        await pg.click('#bStart');await pg.wait_for_timeout(2000);await pg.evaluate('while(PP.dlgOpen)PP.nextLine()');await pg.wait_for_timeout(600)
        print('scene at start',await pg.evaluate("PP.S.scene"),'questions',await pg.evaluate('PP.QB.all.length'))
        await pg.screenshot(path='v_village.png')
        # walk to cave by tapping the entrance object
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='cave'))");await pg.wait_for_timeout(900)
        print('after cave entrance',await pg.evaluate("PP.S.scene"))
        # dig all, wake all crystals
        await pg.evaluate("PP.M.objs.filter(o=>o.type==='dig').forEach(o=>PP.interact(o))")
        for c in range(10):
            await pg.evaluate(f'PP.interact(PP.CRYS[{c}])');await pg.wait_for_timeout(60)
            a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext')
        st=await pg.evaluate('({awake:PP.S.awake.length,coins:PP.S.coins,bag:PP.S.bag,gate:PP.gateIsOpen()})');print('cave done',st)
        await pg.evaluate("PP.interact({type:'gate'})");await pg.wait_for_timeout(200);await pg.click('#mOk');await pg.wait_for_timeout(900)
        print('after gate',await pg.evaluate("({scene:PP.S.scene,clears:PP.S.clears,awake:PP.S.awake.length})"))
        # shop: sell everything, buy furniture
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='shop'))");await pg.wait_for_timeout(300)
        await pg.screenshot(path='v_shop_sell.png')
        before=await pg.evaluate('PP.S.coins')
        n=0
        while await pg.locator('#shopGrid .item button').count()>0 and n<20:
            await pg.click('#shopGrid .item button >> nth=0');n+=1
        after=await pg.evaluate('PP.S.coins');print('sold',n,'items coins',before,'->',after,'bag',await pg.evaluate('PP.S.bag'))
        await pg.click('#tabBuy');await pg.wait_for_timeout(200)
        bought=[]
        for k in ['rug','plant','chair','table']:
            r=await pg.evaluate(f"PP.command('buy',{{furn:'{k}'}})");bought.append((k,r['ok']))
        await pg.evaluate('PP.openShop("buy")');await pg.screenshot(path='v_shop_buy.png');await pg.click('#shopClose')
        print('bought',bought,'coins',await pg.evaluate('PP.S.coins'),'furn',await pg.evaluate('PP.S.furn'))
        # house
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='door'))");await pg.wait_for_timeout(900)
        print('in house',await pg.evaluate('PP.S.scene'))
        await pg.click('#bDeco');await pg.wait_for_timeout(200)
        res=[]
        for (x,z) in [(2,2),(6,2),(3,4),(5,4),(4,5)]:
            await pg.evaluate(f'PP.decoTap({x}.5,{z}.5)');res.append(await pg.evaluate('PP.S.placed.length'))
        await pg.evaluate('PP.decoTap(2.5,2.5)');picked=await pg.evaluate('({placed:PP.S.placed.length,furn:PP.S.furn})')
        await pg.evaluate('PP.decoTap(2.5,2.5)')
        await pg.screenshot(path='v_house.png')
        print('placements after each tap',res,'after pick',picked,'final placed',await pg.evaluate('PP.S.placed'))
        await pg.click('#bDeco')
        await pg.evaluate("PP.interact(PP.M.objs.find(o=>o.type==='exit'))");await pg.wait_for_timeout(900)
        print('back outside',await pg.evaluate('PP.S.scene'))
        # persistence
        await pg.reload();await pg.wait_for_timeout(1000);print('who cards:',await pg.eval_on_selector_all('#rWho .char','e=>e.map(x=>x.textContent)'))
        await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        print('after reload',await pg.evaluate("({scene:PP.S.scene,coins:PP.S.coins,placed:PP.S.placed.length,clears:PP.S.clears})"))
        # migrate v1 save
        await pg.evaluate("""localStorage.setItem('leahpp-save',JSON.stringify({v:1,profile:{name:'Old',char:'leah',age:7,lang:'th'},coins:33,awake:['c0'],dug:[],asked:[],peb:true,clears:1,introSeen:true,log:[]}))""")
        await pg.reload();await pg.wait_for_timeout(1000);print('v1 migrate cards:',await pg.eval_on_selector_all('#rWho .char','e=>e.map(x=>x.textContent)'))
        await pg.click('#rWho .char >> text=Old');await pg.wait_for_timeout(1300);print('v1 state',await pg.evaluate("({v:PP.S.v,scene:PP.S.scene,bag:PP.S.bag,placed:PP.S.placed.length,coins:PP.S.coins})"))
        print('errors',errs[:6]);await br.close()
asyncio.run(main())
