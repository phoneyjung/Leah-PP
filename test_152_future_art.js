// 1.52: BUG-3 default requests, explicit future-art activation and missing-file fallbacks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer'),out=process.env.OUT_DIR||'/tmp/leah-bugs-152';fs.mkdirSync(out,{recursive:true});
const future=['map-north.jpg','map-east.jpg','map-south.jpg','map-capital.jpg','map-G9-home-farm-hi.jpg','map-H9-village-hi.jpg'];
const retired=['map-farm.jpg','robot-helper.png','wild-bush.png','wild-rock.png','wild-stump.png'];
const keys=['mapNorth','mapEast','mapSouth','mapCapital','mapG9hi','mapH9hi'];
const image=fs.readFileSync(path.join(__dirname,'map-G9-home-farm.jpg'));
const results={},errors=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
async function press(pg,id,touch){const e=await pg.$(id);assert(e,'button '+id);await e.scrollIntoView();const r=await e.boundingBox();assert(r,'visible '+id);
 assert(r.x>=0&&r.y>=0&&r.x+r.width<=pg.viewport().width&&r.y+r.height<=pg.viewport().height,'button on screen '+id);
 if(touch)await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(150)}
async function ground(pg,wx,wy,touch){const xy=await pg.evaluate((wx,wy)=>{const r=document.getElementById('c').getBoundingClientRect(),d=devicePixelRatio||1;return [(wx-camX)*SC/d+r.left,(wy-camY)*SC/d+r.top]},wx,wy);
 assert.equal(await pg.evaluate(([x,y])=>document.elementFromPoint(x,y)?.id,xy),'c','input reaches canvas '+JSON.stringify({world:[wx,wy],screen:xy}));
 if(touch)await pg.touchscreen.tap(...xy);else await pg.mouse.click(...xy)}
async function boot(browser,mode='default',touch=false){const context=await browser.createBrowserContext(),pg=await context.newPage(),requests=[],notFound=[];
 await pg.setViewport({width:touch?812:1366,height:touch?375:768,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});
 await pg.setBypassServiceWorker(true);await pg.setCacheEnabled(false);
 pg.on('pageerror',e=>errors.push(mode+': '+e.message));pg.on('response',r=>{if(r.status()===404)notFound.push(new URL(r.url()).pathname.split('/').pop())});
 await pg.evaluateOnNewDocument((mode,future,data)=>{
  if(mode==='enabled'||mode==='missing')window.ENABLED_FUTURE_ART=future;
  if(mode==='embedded')window.EMBED_ASSETS=Object.fromEntries(future.map(f=>[f,data]));
 },mode,future,mode==='embedded'?'data:image/jpeg;base64,'+image.toString('base64'):null);
 await pg.setRequestInterception(true);pg.on('request',r=>{const f=new URL(r.url()).pathname.split('/').pop();requests.push(f);
  if(mode==='enabled'&&future.includes(f))return r.respond({status:200,contentType:'image/jpeg',body:image});
  if(mode==='missing'&&future.includes(f))return r.respond({status:404,contentType:'text/plain',body:'missing future art'});
  return r.continue()});
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
 await pg.waitForFunction(()=>!document.getElementById('load')&&typeof gmMakeSlot==='function',{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.mus=false;S.seen=S.seen||{};S.seen.intro=true;save();startGame();
  document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;delete CACHE.farm;goMap('farm')});
 await sleep(1400);await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null});return {context,pg,requests,notFound};}
async function play(c,touch){const {pg}=c;
 await press(pg,'#bBag',touch);assert.equal(await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')),false,'bag opens');await press(pg,'#mX',touch);
 assert.equal(await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')),true,'real close button closes bag');
 const start=await pg.evaluate(()=>[P.x,P.y]),target=await pg.evaluate(()=>{for(const [dx,dy] of [[0,2],[-2,0],[2,0],[0,-2]]){const x=Math.floor(P.x/T)+dx,y=Math.floor(P.y/T)+dy;
  if(walkable(M,x,y)&&findPath(M,P.x,P.y,x*T+16,y*T+16)&&!M.exits.some(e=>Math.hypot(x*T+16-e.x,y*T+16-e.y)<40))return [x*T+16,y*T+16]}return null});
 assert(target,'reachable floor');await ground(pg,...target,touch);await sleep(1300);const walkedPx=await pg.evaluate(a=>Math.hypot(P.x-a[0],P.y-a[1]),start);assert(walkedPx>24,'real floor input walks');
 const door=await pg.evaluate(()=>{const e=M.exits.find(e=>e.id==='home');P.x=e.x;P.y=e.y+50;P.path=null;return [e.x,e.y]});await sleep(650);
 await ground(pg,...door,touch);await pg.waitForFunction(()=>M.id==='room',{timeout:8000});await sleep(450);
 assert.equal(await pg.evaluate(()=>walkable(M,Math.floor(P.x/T),Math.floor(P.y/T))),true,'real door enters on free floor');return {walkedPx,enteredHouse:true};}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{for(const [name,mode,touch] of [['default-pc','default',false],['default-touch','default',true],['enabled-files','enabled',false],['embedded-files','embedded',false],['enabled-missing','missing',false]])await check(name,async()=>{
  const c=await boot(browser,mode,touch);try{
   const state=await c.pg.evaluate(keys=>({loaded:keys.map(k=>!!IMG[k]),missing:keys.map(k=>MISSING.has(k)),base:[!!IMG.mapG9,!!IMG.mapH9],g9b:!!M.g9b}),keys);
   assert(state.base.every(Boolean),'existing base G9/H9 images still load');assert(state.g9b,'composed farm remains active');
   assert.deepEqual(c.requests.filter(f=>retired.includes(f)),[],'retired requests remain absent');
   const network=c.requests.filter(f=>future.includes(f)),bad=c.notFound.filter(f=>future.includes(f));
   if(mode==='default'||mode==='embedded'){assert.deepEqual(network,[],'no network requests for future images');assert.deepEqual(bad,[])}
   else{assert.deepEqual([...new Set(network)].sort(),[...future].sort(),'all six enabled slots requested');assert.equal(network.length,6,'one request per slot')}
   assert.deepEqual(state.loaded,keys.map(()=>mode==='enabled'||mode==='embedded'),'only supplied art is loaded');
   if(mode==='missing'){assert.deepEqual([...new Set(bad)].sort(),[...future].sort());assert.deepEqual(state.missing.slice(0,4),[true,true,true,true])}
   const played=await play(c,touch);await c.pg.screenshot({path:path.join(out,name+'.png')});
   return {futureRequests:network.length,future404:bad.length,retiredRequests:0,...state,...played};
  }catch(e){await c.pg.screenshot({path:path.join(out,name+'-failure.png')});throw e}finally{await c.context.close()}
 });
 console.log(JSON.stringify(results));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
