// Claude 2.10 (night check 10 Oct): tap targets a child uses every day are 44 px+, and one tap = one action where a player is made, started or deleted (BUG-27).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-taps-210';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?rank=1';
const size=(p,sel)=>p.$eval(sel,e=>{const b=e.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['phone',844,390,3],['owner',915,412,2.625],['ipad',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(url,{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2500);const R={name};
  const tap=async sel=>{const el=await p.$(sel);const b=await el.boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await sleep(400)};
  // the creator's small round buttons
  await tap('#cg194 [data-g="f"]');await sleep(400);R.creator={f:await size(p,'#cgF'),m:await size(p,'#cgM'),rnd:await size(p,'#crnd'),lang:await size(p,'#cLang')};
  assert(Object.values(R.creator).every(([w,h])=>w>=44&&h>=44),'creator buttons 44 px+: '+JSON.stringify(R.creator));
  R.noteVisible=await p.$eval('#cr .namebar',e=>e.getBoundingClientRect().bottom<=innerHeight);assert(R.noteVisible,'the name bar stays on screen');
  // two clicks reaching "create" make one player
  R.create=await p.evaluate(async()=>{const before=Store.all().slots.length,b=document.getElementById('cgo');b.dispatchEvent(new MouseEvent('click',{bubbles:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,1500));return {before,after:Store.all().slots.length}});
  assert.deepEqual(R.create,{before:0,after:1},'one player from two clicks');
  for(let i=0;i<20&&await p.evaluate(()=>!!DLG);i++)await tap('#dlg');await p.evaluate(()=>{try{closeModal()}catch(e){}});
  // the window's close button (bag) and, for an adult, the loot filter
  await tap('#bBag');await sleep(500);R.close=await size(p,'#mX');assert(R.close[1]>=44,'close button 44 px+: '+R.close);await p.evaluate(()=>closeModal());
  await p.evaluate(()=>{S.age=30;save();hud()});await sleep(300);await tap('#bSet');await sleep(500);R.loot=await p.$('#lootMin')?await size(p,'#lootMin'):null;if(R.loot)assert(R.loot[1]>=44,'loot filter 44 px+: '+R.loot);await p.evaluate(()=>closeModal());
  // the select screen: two clicks on delete remove one player, two on start start once
  await p.evaluate(()=>{const d=Store.all();d.slots.push(newSave({name:'Mango',kid:1,house:2,age:9}),newSave({name:'Rocky',kid:5,house:3,age:30}));d.cur=-1;Store.put(d)});
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2500);
  R.del=await p.evaluate(async()=>{const before=Store.all().slots.map(s=>s.name);document.querySelectorAll('#pk .pn')[0].click();await new Promise(r=>setTimeout(r,200));const b=document.getElementById('pDel');
    b.dispatchEvent(new MouseEvent('click',{bubbles:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,500));
    const n=document.getElementById('pDel');if(n)n.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,300));return {before:before.length,after:Store.all().slots.length}});
  assert.deepEqual(R.del,{before:3,after:2},'one player deleted by a quick double tap');
  await sleep(700);R.del2=await p.evaluate(async()=>{document.querySelectorAll('#pk .pn')[0].click();await new Promise(r=>setTimeout(r,200));document.getElementById('pDel').click();await new Promise(r=>setTimeout(r,300));return Store.all().slots.length});
  assert.equal(R.del2,1,'a deliberate second delete later still works');
  R.start=await p.evaluate(async()=>{let n=0;const o=startGame;startGame=function(){n++;return o.apply(this,arguments)};const b=document.getElementById('pGo');b.dispatchEvent(new MouseEvent('click',{bubbles:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,800));startGame=o;return {starts:n,slots:Store.all().slots.length}});
  assert.deepEqual(R.start,{starts:1,slots:1},'the adventure starts once');
  await p.screenshot({path:path.join(out,name+'-world.png')});
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
