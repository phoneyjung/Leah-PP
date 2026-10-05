// 1.56: actual painted assets, live late refresh, independent fallbacks, real mouse/touch controls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const out=process.env.OUT_DIR||'/tmp/leah-ui-156';fs.mkdirSync(out,{recursive:true});
const errors=[],results={},sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(const file of ['ui-quietgold-art.json','ui-quietgold-icons.webp','ui-quietgold-frames.webp'])assert(fs.readFileSync(path.join(__dirname,'sw.js'),'utf8').includes("'"+file+"'"),'offline cache includes '+file);
async function press(pg,selector,touch){const el=await pg.$(selector);assert(el,'control '+selector);await el.scrollIntoView();const r=await el.boundingBox();assert(r,'visible '+selector);
 const x=r.x+r.width/2,y=r.y+r.height/2;assert(x>=0&&x<=pg.viewport().width&&y>=0&&y<=pg.viewport().height,'reachable '+selector);
 assert(await pg.evaluate(({x,y,selector})=>!!document.elementFromPoint(x,y)?.closest(selector),{x,y,selector}),'uncovered '+selector);
 if(touch)await pg.touchscreen.tap(x,y);else await pg.mouse.click(x,y);await sleep(110)}
async function boot(browser,w,h,touch,mode){const context=await browser.createBrowserContext(),pg=await context.newPage();await pg.setViewport({width:w,height:h,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});await pg.setBypassServiceWorker(true);pg.on('pageerror',e=>errors.push(mode+': '+e.message));
 let release;const gate=new Promise(r=>release=r);if(mode){await pg.setRequestInterception(true);pg.on('request',async r=>{try{
  const name=new URL(r.url()).pathname.split('/').pop();
  if(mode==='late'&&name==='ui-quietgold-art.json')await gate;
  if(mode==='all'&&['ui-quietgold-art.json','ui-quietgold-icons.webp','ui-quietgold-frames.webp'].includes(name)||mode==='manifest'&&name==='ui-quietgold-art.json'||mode===name.replace('ui-quietgold-','').replace('.webp',''))return r.respond({status:404,body:'missing'});
  if(mode==='invalid'&&name==='ui-quietgold-art.json'){const data=JSON.parse(fs.readFileSync(path.join(__dirname,name)));data.icons.tiles.bag.rect=[900,0,64,64];return r.respond({status:200,contentType:'application/json',body:JSON.stringify(data)})}
  if(mode==='corrupt'&&name==='ui-quietgold-icons.webp')return r.respond({status:200,contentType:'image/webp',body:'broken image'});
  return r.continue();
 }catch(e){errors.push('interception: '+e.message)}})}
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.age=18;S.name='ต้นกล้า';S.kid=5;S.lv=12;S.joy=true;S.coins=1500;S.seen={intro:true};S.snd=true;S.mus=false;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;goMap('farm')});await sleep(1000);
 await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null;S.inv=[mkItem('sw',0),mkItem('bow',2),mkGear('armor',2),mkGear('acc',1)];S.eq=0;S.eqA=2;S.eqC=3;S.age=18;S.hp=hpMax();buildPlayerSheets();gridFix();save();hud()});return {context,pg,release}}
async function iconSize(pg,selector,n){await pg.waitForFunction(({selector,n})=>{const im=document.querySelector(selector);return im?.complete&&im.naturalWidth===n},{timeout:4000},{selector,n})}
async function screenshot(pg,name){await pg.$eval('#mBody',e=>e.scrollTop=0);await pg.screenshot({path:path.join(out,name+'.png')})}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});try{
 for(const [name,w,h,touch,mode,wantIcons,wantFrames] of [
  ['pc',1366,768,false,'',true,true],['phone',812,330,true,'',true,true],['small',667,375,true,'',true,true],
  ['missing-manifest',812,375,true,'manifest',false,false],['missing-icons',812,375,true,'icons',false,true],['missing-frames',812,375,true,'frames',true,false],
  ['missing-all',812,375,true,'all',false,false],['invalid-rect',812,375,true,'invalid',false,true],['corrupt-image',812,375,true,'corrupt',false,true],['late-art',812,375,true,'late',true,true]
 ]){const {context,pg,release}=await boot(browser,w,h,touch,mode);try{
  if(mode==='late'){assert.equal(await pg.evaluate(()=>UI156.done),false,'play starts before optional paintings');await press(pg,'#bSet',touch);await iconSize(pg,'#sOn img',32);await press(pg,'#sOn',touch);assert.equal(await pg.evaluate(()=>SND),false);release()}
  await pg.waitForFunction(()=>typeof UI156!=='undefined'&&UI156.done,{timeout:12000});assert.deepEqual(await pg.evaluate(()=>({icons:UI156.icons,frames:UI156.frames})),{icons:wantIcons,frames:wantFrames});
  await iconSize(pg,'#bBag img',wantIcons?64:32);
  if(wantIcons){const visible=await pg.evaluate(async()=>{const counts=[];for(const src of Object.values(UI156.painted)){const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.drawImage(im,0,0);const a=g.getImageData(0,0,64,64).data;counts.push([...a].filter((v,i)=>i%4===3&&v>24).length)}return counts});assert.equal(visible.length,24);assert(visible.every(n=>n>200),'every painted icon contains actual pixels')}
  const skin=await pg.$eval('#hud',e=>getComputedStyle(e).borderImageSource);assert.equal(skin.startsWith('url("data:image/png'),wantFrames,'actual frame artwork applied');
  if(mode!=='late')await press(pg,'#bSet',touch);await iconSize(pg,'#sOn img',wantIcons?64:32);assert.equal(await pg.$$eval('.setting155-card',e=>e.length),7);
  if(mode==='late'){assert.equal(await pg.$eval('#sOn',e=>e.getAttribute('aria-pressed')),'false','late refresh keeps muted state');await press(pg,'#sOn',touch);assert.equal(await pg.evaluate(()=>SND),true)}
  const before=await pg.evaluate(()=>SND);await press(pg,'#sOn',touch);assert.equal(await pg.evaluate(()=>SND),!before);const count=await pg.evaluate(()=>UI149.sounds);await press(pg,'#jOn',touch);assert.equal(await pg.evaluate(()=>UI149.sounds),count,'muted controls retain sound behavior');await press(pg,'#jOn',touch);await press(pg,'#sOn',touch);
  const sizes=await pg.$$eval('.setting155-card button',bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,aria:b.getAttribute('aria-label')})));assert(sizes.every(s=>s.w>=44&&s.h>=44&&s.aria),'usable hit areas with labels');
  if(!mode)await screenshot(pg,name+'-settings');await press(pg,'#mX',touch);await press(pg,'#bBag',touch);
  const initial=await pg.evaluate(()=>S.inv.map(w=>w.u).sort()),portrait=await pg.$eval('#equipPortrait',c=>c.toDataURL());await press(pg,'.gbIt[data-src="bag"][data-i="1"]',touch);await press(pg,'#gbEqB',touch);assert.equal(await pg.evaluate(()=>weapon().type),'bow','painted/fallback button equips actual bow');assert.notEqual(await pg.$eval('#equipPortrait',c=>c.toDataURL()),portrait);
  const worn=await pg.evaluate(()=>[S.eq,S.eqA,S.eqC].map(i=>S.inv[i].u));await press(pg,'#gbSort',touch);assert.deepEqual(await pg.evaluate(()=>[S.eq,S.eqA,S.eqC].map(i=>S.inv[i].u)),worn);assert.deepEqual(await pg.evaluate(()=>S.inv.map(w=>w.u).sort()),initial);assert.equal(await pg.$eval('.slot154',e=>getComputedStyle(e).borderTopWidth),'1px','art preserves layout dimensions');
  if(!mode)await screenshot(pg,name+'-bag');await press(pg,'#mX',touch);if(!mode){await pg.screenshot({path:path.join(out,name+'-farm.png')});await pg.evaluate(()=>{goMap('room');closeModal();DLG=null;PAUSE=false;HOLD=null});await sleep(500);await press(pg,'#bDeco',touch);await press(pg,'#deco2 [data-a="shop"]',touch);await screenshot(pg,name+'-shop');await press(pg,'#mX',touch);await press(pg,'#deco2 [data-a="done"]',touch)}
  results[name]={size:[w,h],icons:wantIcons?24:'procedural fallback',frames:wantFrames?4:'CSS fallback',realToggles:true,realEquip:true,sortPreservesItems:true,lateRefresh:mode==='late'};
 }catch(e){errors.push(name+': '+e.message);await pg.screenshot({path:path.join(out,name+'-failure.png')})}finally{release();await context.close()}}
 }finally{await browser.close()}const runtimeBytes=['ui-quietgold-art.json','ui-quietgold-icons.webp','ui-quietgold-frames.webp'].reduce((sum,f)=>sum+fs.statSync(path.join(__dirname,f)).size,0);console.log(JSON.stringify({runtimeBytes,results}));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
