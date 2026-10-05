// 1.53: real menu clicks/taps, persistent toggle states, bag actions and furniture purchases.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer'),out=process.env.OUT_DIR||'/tmp/leah-ui-153';fs.mkdirSync(out,{recursive:true});
const errors=[],results={},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function press(pg,id,touch){const e=await pg.$(id);assert(e,'button '+id);await e.scrollIntoView();const r=await e.boundingBox();assert(r,'visible '+id);
 const size=pg.viewport();assert(r.x>=0&&r.y>=0&&r.x+r.width<=size.width+.1&&r.y+r.height<=size.height+.1,'button on screen '+id);
 if(touch)await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(160)}
async function boot(browser,width,height,touch){const context=await browser.createBrowserContext(),pg=await context.newPage();
 await pg.setViewport({width,height,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});await pg.setBypassServiceWorker(true);
 pg.on('pageerror',e=>errors.push(e.message));await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
 await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;S.snd=true;S.joy=true;S.coins=1000;save();startGame();
  document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;goMap('farm')});await sleep(1700);
 await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null;S.inv.push({...S.inv[S.eq],rar:0,gx:null,gy:null});gridFix();save()});return {context,pg};}
async function icons(pg,ids){await pg.waitForFunction(ids=>ids.every(id=>{const i=document.getElementById(id)?.querySelector('img.ui153-icon');return i&&i.complete&&i.naturalWidth===32}),{timeout:4000},ids);
 return pg.evaluate(ids=>ids.map(id=>{const b=document.getElementById(id),i=b.querySelector('img.ui153-icon');return {id,width:i.naturalWidth,label:b.querySelector('.ui153-label').textContent,aria:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),src:i.src}}),ids);}
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{for(const [name,w,h,touch] of [['pc',1366,768,false],['phone',812,330,true],['small',667,375,true]])await check(name,async()=>{
  const c=await boot(browser,w,h,touch),{pg}=c;try{
   await press(pg,'#bSet',touch);const toggleIds=['sOn','mOn','jOn','kOn','tOn','gOn','ecoB'];const initial=await icons(pg,toggleIds.concat(['bkUp','mX']));
   for(const a of initial.slice(0,7)){assert(['เปิด','ปิด'].includes(a.label),'Thai toggle words');assert(['true','false'].includes(a.pressed),'toggle exposes actual state');assert(a.aria.endsWith(a.label))}
   const speaker=initial.find(a=>a.id==='sOn').src;await press(pg,'#sOn',touch);const muted=(await icons(pg,['sOn']))[0];
   assert.equal(await pg.evaluate(()=>SND),false);assert.equal(muted.label,'ปิด');assert.equal(muted.pressed,'false');assert.notEqual(muted.src,speaker,'mute has a different picture');
   const count=await pg.evaluate(()=>UI149.sounds),joy=await pg.evaluate(()=>S.joy);await press(pg,'#jOn',touch);
   assert.equal(await pg.evaluate(()=>S.joy),!joy);assert.equal(await pg.evaluate(()=>UI149.sounds),count,'muted controls stay silent');
   for(const [id,expr] of [['gOn','S.guide!==false'],['ecoB','!!S.eco'],['kOn','kidUI()'],['tOn','ttsOn()'],['mOn','MUS']]){
    const before=await pg.evaluate(expr);await press(pg,'#'+id,touch);assert.equal(await pg.evaluate(expr),!before);
    assert.equal((await icons(pg,[id]))[0].pressed,String(!before));
    if(['kOn','tOn','mOn'].includes(id)){await press(pg,'#'+id,touch);assert.equal(await pg.evaluate(expr),before)}
   }await press(pg,'#sOn',touch);await pg.screenshot({path:path.join(out,name+'-settings.png')});
   await press(pg,'#lEn',touch);const english=await icons(pg,toggleIds);assert(english.every(a=>['On','Off'].includes(a.label)),'English toggle words');
   await press(pg,'#lTh',touch);await press(pg,'#mX',touch);assert(await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')));
   await press(pg,'#bBag',touch);await icons(pg,['gbSort','gbJunk','gbStore','gbOld','bCardBook','bStampBook','mX']);
   const equipment=await pg.evaluate(()=>[S.inv[S.eq],S.inv[S.eqA],S.inv[S.eqC]].filter(Boolean).map(a=>JSON.stringify(a)));
   await press(pg,'#gbSort',touch);const after=await pg.evaluate(()=>[S.inv[S.eq],S.inv[S.eqA],S.inv[S.eqC]].filter(Boolean).map(a=>JSON.stringify(a)));
   assert.deepEqual(after,equipment,'real sort preserves worn equipment');await icons(pg,['gbSort','bCardBook','bStampBook']);
   await press(pg,'#gbStore',touch);assert(await pg.evaluate(()=>GB.store&&!!document.querySelector('[data-grid="store"]')));await icons(pg,['gbStore','bCardBook','bStampBook']);
   await press(pg,'#gbStore',touch);assert.equal(await pg.evaluate(()=>GB.store),false);await icons(pg,['bCardBook','bStampBook']);
   const junk=await pg.evaluate(()=>({n:S.inv.length,coins:S.coins,count:S.inv.filter((w,i)=>w.rar===0&&!isWorn(i)).length,price:SELL[0]}));assert(junk.count>0,'fixture has ordinary unworn items');
   await press(pg,'#gbJunk',touch);assert.deepEqual(await pg.evaluate(()=>({n:S.inv.length,coins:S.coins})),{n:junk.n-junk.count,coins:junk.coins+junk.count*junk.price},'real sell-all button removes only ordinary unworn items');
   await icons(pg,['bCardBook','bStampBook']);
   await press(pg,'#bCardBook',touch);assert(await pg.$('#cbGrid'),'real card tab opens card book');await press(pg,'#mX',touch);
   await press(pg,'#bBag',touch);await press(pg,'#bStampBook',touch);assert(await pg.evaluate(()=>document.querySelector('#mBody h2').textContent.includes(t('stampBook'))),'real stamp tab opens book');await press(pg,'#mX',touch);
   await press(pg,'#bBag',touch);await press(pg,'#gbOld',touch);assert(await pg.$('#bagBar'),'real list-view button still works');await press(pg,'#mX',touch);
   await press(pg,'#bBag',touch);await pg.screenshot({path:path.join(out,name+'-bag.png')});await press(pg,'#mX',touch);
   await pg.evaluate(()=>{goMap('room');closeModal();DLG=null;PAUSE=false;HOLD=null});await sleep(700);await press(pg,'#bDeco',touch);await press(pg,'#deco2 [data-a="shop"]',touch);
   const buys=await pg.$$eval('[data-buy]',bs=>bs.map(b=>({key:b.dataset.buy,icon:!!b.querySelector('img.ui153-icon'),text:b.textContent})));assert.equal(buys.length,9);assert(buys.every(a=>a.icon&&a.text.includes('ซื้อ')));
   const k=buys[0].key,before=await pg.evaluate(k=>({coins:S.coins,n:HOME.get().furn2?.[k]||0,price:F2PRICE[k]}),k);await press(pg,'[data-buy="'+k+'"]',touch);
   const bought=await pg.evaluate(k=>({coins:S.coins,n:HOME.get().furn2?.[k]||0}),k);assert.equal(bought.coins,before.coins-before.price);assert.equal(bought.n,before.n+1);
   await pg.screenshot({path:path.join(out,name+'-shop.png')});await press(pg,'#mX',touch);await press(pg,'#deco2 [data-a="done"]',touch);
   // Force only the new speaker picture to fail; the label and original click handler must remain usable.
   await pg.evaluate(()=>{UI153.art.speaker='data:image/png;base64,broken';SND=true;S.snd=true});await press(pg,'#bSet',touch);
   await pg.waitForFunction(()=>document.querySelector('#sOn img.ui153-icon')?.hidden,{timeout:4000});assert.equal(await pg.$eval('#sOn .ui153-label',e=>e.textContent),'เปิด');
   await press(pg,'#sOn',touch);assert.equal(await pg.evaluate(()=>SND),false);await press(pg,'#mX',touch);
   return {size:[w,h],settingsIcons:initial.length,sevenToggleStates:true,englishLabels:true,muteWorks:true,bagActions:true,soldOrdinaryItems:junk.count,bookTabsKeptAfterSortStoreSell:true,buyButtons:buys.length,purchase:bought,brokenIconStillClickable:true};
  }catch(e){await pg.screenshot({path:path.join(out,name+'-failure.png')});throw e}finally{await c.context.close()}
 });}finally{await browser.close()}
 console.log(JSON.stringify(results));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
