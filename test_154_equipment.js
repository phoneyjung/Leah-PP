// 1.54: equip through actual mouse/touch controls, inspect rendered pixels, preserve items and saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const out=process.env.OUT_DIR||'/tmp/leah-ui-154';fs.mkdirSync(out,{recursive:true});
const errors=[],results={},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function press(pg,selector,touch){const el=await pg.$(selector);assert(el,'control exists '+selector);await el.scrollIntoView();const r=await el.boundingBox();assert(r,'visible '+selector);
 const x=r.x+r.width/2,y=r.y+r.height/2;assert(x>=0&&x<=pg.viewport().width&&y>=0&&y<=pg.viewport().height,'reachable '+selector);
 assert(await pg.evaluate(({x,y,selector})=>document.elementFromPoint(x,y)?.closest(selector)!=null,{x,y,selector}),'control is not covered '+selector);
 if(touch)await pg.touchscreen.tap(x,y);else await pg.mouse.click(x,y);await sleep(100)}
async function boot(browser,w,h,touch,missing=false){const context=await browser.createBrowserContext(),pg=await context.newPage();await pg.setViewport({width:w,height:h,isMobile:touch,hasTouch:touch,deviceScaleFactor:1});await pg.setBypassServiceWorker(true);
 pg.on('pageerror',e=>errors.push(e.message));if(missing){await pg.setRequestInterception(true);pg.on('request',r=>/kid-spiky-(idle|stand|walk)\.png/.test(r.url())?r.abort():r.continue())}
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.name='ต้นกล้า';S.age=18;S.kid=5;S.lv=12;S.potions=2;S.snd=true;S.mus=false;S.seen={intro:true};S.inv=[mkItem('sw',0),mkItem('sw',2),mkItem('bow',1),mkItem('staff',3),mkItem('dag',4),mkGear('armor',2),mkGear('acc',3),mkGear('armor',1)];S.eq=0;S.eqA=S.eqC=-1;S.store=[];save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;goMap('farm')});await sleep(1800);
 await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null;S.name='ต้นกล้า';S.age=18;S.kid=5;S.lv=12;S.potions=2;S.inv=[mkItem('sw',0),mkItem('sw',2),mkItem('bow',1),mkItem('staff',3),mkItem('dag',4),mkGear('armor',2),mkGear('acc',3),mkGear('armor',1)];S.eq=0;S.eqA=S.eqC=-1;S.store=[];buildPlayerSheets();gridFix();S.hp=hpMax()-30;save()});return {context,pg}}
async function pixels(pg){return pg.$eval('#equipPortrait',c=>({image:c.toDataURL(),visible:[...c.getContext('2d').getImageData(0,0,c.width,c.height).data].filter((v,i)=>i%4===3&&v).length}))}
async function equip(pg,i,touch){await press(pg,'.gbIt[data-src="bag"][data-i="'+i+'"]',touch);assert.deepEqual(await pg.evaluate(()=>GB.sel),{src:'bag',i},'selected equipment '+i);await press(pg,'#gbEqB',touch)}
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});try{
 for(const [name,w,h,touch,missing] of [['pc',1366,768,false,false],['phone',812,330,true,false],['small',667,375,true,false],['fallback',812,375,true,true]])await check(name,async()=>{
  const {context,pg}=await boot(browser,w,h,touch,missing);try{
   await press(pg,'#bBag',touch);assert(await pg.$('#equipPortrait'),'wardrobe portrait');const baseline=await pixels(pg);assert(baseline.visible>300,'character and held item have visible pixels');
   if(name==='small'){await press(pg,'#scroll154bag',touch);assert(await pg.$eval('.wardrobe154-grid-scroll',e=>e.scrollLeft)>0,'touch slider pans the wide grid')}
   const initial=await pg.evaluate(()=>({uids:S.inv.map(w=>w.u).sort(),atk:atkPow(),def:defVal()}));let last=baseline.image;const weapons=[];
   for(const i of [1,2,3,4]){await equip(pg,i,touch);assert.equal(await pg.evaluate(()=>S.eq),i,'real equip changes weapon');const p=await pixels(pg);assert.notEqual(p.image,last,'held weapon picture changes');last=p.image;weapons.push(await pg.evaluate(()=>weapon().type))}
   await equip(pg,5,touch);assert.equal(await pg.evaluate(()=>S.eqA),5);assert(await pg.evaluate(()=>defVal())>initial.def,'armor affects actual defense');const armored=await pixels(pg);assert.notEqual(armored.image,last,'worn armor is visible');last=armored.image;
   await equip(pg,6,touch);assert.equal(await pg.evaluate(()=>S.eqC),6);assert.notEqual((await pixels(pg)).image,last,'accessory is visible');
   assert.deepEqual(await pg.evaluate(()=>S.inv.map(w=>w.u).sort()),initial.uids,'all items preserved after equips');
   await press(pg,'[data-eqslot="armor"]',touch);assert(await pg.$eval('#gbInfo',e=>e.textContent.includes('เกราะเหล็ก')),'slot opens actual equipped-item details');
   if(!touch){const from=await pg.$('.gbIt[data-src="bag"][data-i="7"]');await from.scrollIntoView();const a=await from.boundingBox(),slot=await pg.$('[data-eqslot="armor"]');await slot.scrollIntoView();const b=await slot.boundingBox();
    await pg.mouse.move(a.x+a.width/2,a.y+a.height/2);await pg.mouse.down();await pg.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await pg.mouse.up();await sleep(150);assert.equal(await pg.evaluate(()=>S.eqA),7,'drag to armor slot equips');
   }
   const worn=await pg.evaluate(()=>[S.eq,S.eqA,S.eqC].map(i=>S.inv[i].u));await press(pg,'#gbSort',touch);assert.deepEqual(await pg.evaluate(()=>[S.eq,S.eqA,S.eqC].map(i=>S.inv[i].u)),worn);assert(await pg.$('#bCardBook'));assert(await pg.$('#bStampBook'));
   await press(pg,'#gbStore',touch);assert(await pg.$('[data-grid="store"]'));await press(pg,'#gbStore',touch);
   await press(pg,'#tab154-usable',touch);const before=await pg.evaluate(()=>({hp:S.hp,p:S.potions,max:hpMax()}));await press(pg,'#use154Potion',touch);assert.deepEqual(await pg.evaluate(()=>({hp:S.hp,p:S.potions})),{hp:Math.min(before.max,before.hp+Math.round(before.max*.6)),p:before.p-1});
   await press(pg,'#tab154-collection',touch);await press(pg,'#bStampBook',touch);assert(await pg.evaluate(()=>document.querySelector('#mBody h2').textContent.includes(t('stampBook'))));assert.equal(await pg.$('#equipPortrait'),null,'other modal does not retain wardrobe');await press(pg,'#mX',touch);
   await press(pg,'#bBag',touch);assert.equal(await pg.$eval('#tab154-equipment',e=>e.getAttribute('aria-pressed')),'true');
   if(name==='phone'){await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});await sleep(250);await press(pg,'#tab154-usable',true);await press(pg,'#tab154-equipment',true);await pg.$eval('#mBody',e=>e.scrollTop=0);await pg.screenshot({path:path.join(out,'portrait-bag.png')});await pg.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:1})}
   await pg.$eval('#mBody',e=>e.scrollTop=0);await pg.screenshot({path:path.join(out,name+'-bag.png')});
   const saved=await pg.evaluate(()=>({all:S.inv.map(w=>w.u).sort(),worn:[S.eq,S.eqA,S.eqC].map(i=>S.inv[i].u)}));await pg.reload({waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load'),{timeout:30000});
   assert.deepEqual(await pg.evaluate(()=>{const d=Store.all(),s=d.slots[d.cur];return {all:s.inv.map(w=>w.u).sort(),worn:[s.eq,s.eqA,s.eqC].map(i=>s.inv[i].u)}}),saved,'saved inventory and equipment survive reload');
   if(name==='pc'){await pg.evaluate(()=>{S.age=7;hud();closeModal()});await press(pg,'#bBag',false);assert(await pg.$('#kbOther'),'child tools bag is preserved');assert.equal(await pg.$('#equipPortrait'),null);await press(pg,'#mX',false)}
   return {viewport:[w,h],weapons,armorAndAccessoryVisible:true,visiblePixels:baseline.visible,itemsPreserved:initial.uids.length,mouseDrag:!touch,sortAndStore:true,consumable:true,book:true,reload:true,missingArt:missing};
  }catch(e){await pg.screenshot({path:path.join(out,name+'-failure.png')});throw e}finally{await context.close()}
 });
 }finally{await browser.close()}console.log(JSON.stringify(results));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
