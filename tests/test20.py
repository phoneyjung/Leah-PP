import asyncio
from playwright.async_api import async_playwright
exec(open('test17.py').read().split('async def run')[0])
# 2D village: tapping a building / stall / person walks there and uses it; also checks errors
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']);ctx=await b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    async def route(r):
      u=r.request.url
      if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
      if u.startswith('http://localhost'): return await r.continue_()
      return await r.abort()
    await pg.route('**/*',route)
    await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
    await pg.click('#bStart');await pg.wait_for_timeout(1500);await pg.evaluate("while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']")
    for name,wx,wy,exp in [('house roof',6*32,7*32-80,'house'),('shop awning',20*32,7*32-100,'shop'),('cave rocks',13*32-40,60,'cave'),('nuan',22.1*32,7.75*32-30,'shop')]:
      await pg.evaluate("PP.goScene('village','start',true)");await pg.wait_for_timeout(500)
      sx,sy=await pg.evaluate(f"(()=>{{const c=document.getElementById('v2d').getBoundingClientRect(),V=PP.V2;return[({wx}-V.camX)/V.VW*c.width+c.left,({wy}-V.camY)/V.VH*c.height+c.top]}})()")
      await pg.evaluate(f"{POINTER}('touch',[[{sx},{sy}]],60)");await pg.wait_for_timeout(6000)
      st=await pg.evaluate("({scene:PP.S.scene,shop:!document.getElementById('shop').hidden})")
      print(name,'->',st,'expected',exp)
      if st['shop']: await pg.click('#shopClose')
    print('errors',errs);await b.close()
asyncio.run(m())
