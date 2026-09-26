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
            if u.startswith('http://localhost'): return await r.continue_()
            return await r.abort()
        await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1']")
        # first card through the real quiz -> book1 dialogue
        await pg.evaluate("PP.goScene('cave','start',true)");await pg.evaluate('PP.interact(PP.CRYS[0])');await pg.wait_for_timeout(200)
        a=await pg.evaluate('PP.quiz.q.answer');await pg.click(f'#qOpts .opt >> nth={a}');await pg.click('#qNext');await pg.wait_for_timeout(1600)
        d=[]
        while await pg.evaluate('PP.dlgOpen'):d.append(await pg.text_content('#dText'));await pg.click('#dlg')
        print('first card dialogue',len(d),'lines | hud',await pg.text_content('#hBook'))
        # 11 more correct + 3 wrong + 1 repeat
        r=await pg.evaluate("""(()=>{const S=PP.S,c0=S.coins,qs=PP.QB.all.filter(q=>!S.book.includes(q.id)).slice(0,14);let rewards=[];
          qs.slice(0,11).forEach(q=>{const r=PP.command('answer',{qid:q.id,correct:true,target:{type:'none'}});if(r.bookReward)rewards.push(r.bookReward)});
          qs.slice(11,14).forEach(q=>PP.command('answer',{qid:q.id,correct:false,target:{type:'none'}}));
          PP.command('answer',{qid:qs[0].id,correct:true,target:{type:'none'}});
          return {book:S.book.length,unique:new Set(S.book).size,coinGain:S.coins-c0,rewards,paid:S.bookPaid}})()""")
        print('after 11 right, 3 wrong, 1 repeat:',r,'| hud',await pg.text_content('#hBook'))
        await pg.click('#bBook');await pg.wait_for_timeout(300)
        n=await pg.locator('#bkList .kcard').count();tabs=await pg.eval_on_selector_all('#bkTabs .chip','e=>e.map(x=>x.textContent)')
        nxt=await pg.text_content('#bkNext')
        await pg.click('#bkList .kcard >> nth=0');exp=await pg.evaluate("!document.querySelector('#bkList .kcard .kx').hidden")
        await pg.screenshot(path='bk.png')
        await pg.click('#bkTabs .chip >> nth=1');n1=await pg.locator('#bkList .kcard').count()
        print('book cards shown',n,'tabs',tabs,'| next reward:',nxt,'| tap shows explanation',exp,'| filtered',n1)
        await pg.click('#bkClose')
        await pg.reload();await pg.wait_for_timeout(900);await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        print('after reload book',await pg.evaluate('PP.S.book.length'),'paid',await pg.evaluate('PP.S.bookPaid'),'hud',await pg.text_content('#hBook'))
        # english profile shows english cards and no thai text
        await pg.evaluate("PP.S.profile.lang='en'");await pg.evaluate("PP.Store.save(PP.S)");await pg.reload();await pg.wait_for_timeout(900);await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        await pg.evaluate('PP.openBook()');txt=await pg.text_content('#bkList');print('english book sample:',txt[:90])
        print('errors',errs);await br.close()
asyncio.run(main())
