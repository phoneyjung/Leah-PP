// BUG-1/2: real entry + ground clicks, entrance placement taps, resize and touch rotation.
// PORT=8775 CHROME_EXE=... node test_150_bugs.js
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer'),out=process.env.OUT_DIR||'/tmp/leah-bugs-150';
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results={};
async function press(pg,selector,touch=false){const e=await pg.$(selector);assert(e,'exists '+selector);const r=await e.boundingBox();assert(r,'visible '+selector);
 if(touch)await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(200)}
async function ground(pg,x,y,touch=false){const r=await pg.evaluate((x,y)=>{const r=document.getElementById('c').getBoundingClientRect(),d=devicePixelRatio||1;return [(x-camX)*SC/d+r.left,(y-camY)*SC/d+r.top]},x,y);
 assert.equal(await pg.evaluate(([x,y])=>document.elementFromPoint(x,y)?.id,r),'c','ground click reaches game canvas');
 if(touch)await pg.touchscreen.tap(...r);else await pg.mouse.click(...r);await sleep(250)}
async function clear(pg){await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null})}
async function enter(pg,touch=false){const door=await pg.evaluate(()=>{goMap('farm');const e=M.exits.find(e=>e.id==='home');P.x=e.x;P.y=e.y+50;P.path=null;return [e.x,e.y]});await clear(pg);await sleep(700);
 await ground(pg,...door,touch);await pg.waitForFunction(()=>M.id==='room',{timeout:8000});await sleep(500);await clear(pg);
 assert.equal(await pg.evaluate(()=>M.id),'room','real click on house door enters')}
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{const pg=await browser.newPage();await pg.setViewport({width:1366,height:768});pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
 await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6});await sleep(1800);await clear(pg);
 for(const lv of [1,2,3])await check('entrance-L'+lv,async()=>{
  await pg.evaluate(lv=>{const h=HOME.get();h.lv=lv;if(h.house)h.house.lv=lv;delete h.room2;delete h.room2b;h.furn2={plant:2};HOME.put(h);delete CACHE.room;delete CACHE.room2;delete CACHE.farm},lv);
  await enter(pg);const probe=await pg.evaluate(()=>{const sp=M.spawnDefault,dy=ROOM2.rowsAbovePlan,i=M.layout2.findIndex(a=>a[0]==='plant'),d=M.r2.door;
   const rug=M.layout2.find(a=>a[0]==='rug');return {exact:f2Valid(['plant',0,Math.floor(sp[0]/T)+.1,Math.floor(sp[1]/T)-dy+.1],M.layout2[i]),both:[0,1].map(dx=>f2Valid(['plant',0,d[0]+dx+.1,d[1]-1+.1],M.layout2[i])),defaultRug:f2Valid(rug,rug),normalSpawn:walkable(M,Math.floor(sp[0]/T),Math.floor(sp[1]/T))}});
  assert.equal(probe.exact,'d2Block','reported fractional placement rejected');assert.deepEqual(probe.both,['d2Block','d2Block'],'both entrance tiles reserved');assert.equal(probe.defaultRug,'','walkable default rug stays valid');assert(probe.normalSpawn,'normal entrance stays walkable');
  await pg.evaluate(()=>{for(let y=4;y<M.h-4;y++)for(let x=6;x<M.w-3;x++)if(walkable(M,x,y)){P.x=x*T+16;P.y=y*T+16;P.path=null;return}});await sleep(400);
  await press(pg,'#bDeco');await press(pg,'#deco2 [data-k="plant"]');
  const target=await pg.evaluate(()=>{const d=M.r2.door,v=f2View('plant',0);window._before=JSON.stringify(M.layout2);return [(d[0]+1+v[6]/2)*T,(d[1]-1+ROOM2.rowsAbovePlan+v[7]/2)*T]});
  await ground(pg,...target);assert.equal(await pg.evaluate(()=>JSON.stringify(M.layout2)===window._before&&DECO2.hold==='plant'),true,'real placement click refused without consuming inventory');
  assert.equal(await pg.evaluate(()=>document.getElementById('msg').textContent),await pg.evaluate(()=>t('d2Block')),'real tap explains refusal');
  await press(pg,'#deco2 [data-a="done"]');
  await pg.evaluate(()=>{const h=HOME.get(),lay=JSON.parse(JSON.stringify(M.layout2)),i=lay.findIndex(a=>a[0]==='plant'),sp=M.spawnDefault;
   lay[i][2]=Math.floor(sp[0]/T)+.1;lay[i][3]=Math.floor(sp[1]/T)-ROOM2.rowsAbovePlan+.1;window._legacy=JSON.stringify(lay);h[M.layKey]=lay;HOME.put(h);delete CACHE.room});
  await enter(pg);const spawn=await pg.evaluate(()=>({free:walkable(M,Math.floor(P.x/T),Math.floor(P.y/T)),originalBlocked:!walkable(M,Math.floor(M.spawnDefault[0]/T),Math.floor(M.spawnDefault[1]/T)),furniturePreserved:JSON.stringify(M.layout2)===window._legacy,at:[P.x,P.y],default:M.spawnDefault}));assert(spawn.originalBlocked,'fixture really blocks original spawn');assert(spawn.furniturePreserved,'legacy furniture stays in place');assert(spawn.free,'legacy save spawns on free ground');
  const dest=await pg.evaluate(()=>{for(const [dx,dy] of [[-2,0],[0,-2],[2,0],[0,2],[-1,-1]]){const x=Math.floor(P.x/T)+dx,y=Math.floor(P.y/T)+dy;
   if(walkable(M,x,y)&&!M.exits.some(e=>Math.hypot(x*T+16-e.x,y*T+16-e.y)<35)&&findPath(M,P.x,P.y,x*T+16,y*T+16))return [x*T+16,y*T+16]}return null});assert(dest,'reachable walking target');
  await ground(pg,...dest);await sleep(1500);spawn.walkedPx=await pg.evaluate(a=>Math.hypot(P.x-a[0],P.y-a[1]),spawn.at);assert(spawn.walkedPx>24,'real click walks out of legacy blocked entrance');
  await pg.screenshot({path:path.join(out,'legacy-L'+lv+'.png')});return {probe,spawn};
 });
 await check('icons',async()=>{await pg.evaluate(()=>{goMap('farm');hud()});await sleep(350);
  const icons=await pg.evaluate(()=>Object.entries(UI150.labels).map(([id,names])=>{const b=document.getElementById(id),im=b.querySelector('img.pxi');return {id,label:b.querySelector('small').textContent,aria:b.getAttribute('aria-label'),width:im.naturalWidth,src:im.src,expected:names[0]}}));
  assert.equal(new Set(icons.map(a=>a.src)).size,6,'six distinct navigation pictures');
  const iconSize=await pg.evaluate(()=>typeof UI156!=='undefined'&&UI156.icons?64:32);
  for(const a of icons){assert.equal(a.width,iconSize,'painted icons 64px or procedural fallback 32px');assert.equal(a.label,a.expected);assert.equal(a.aria,a.expected)}
  await press(pg,'#bBag');assert.equal(await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')),false,'new bag picture still opens real bag menu');await press(pg,'#mX');
  await pg.screenshot({path:path.join(out,'icons-pc.png')});return icons.map(({src,...a})=>a);
 });
 await check('zoom-events',async()=>{await pg.evaluate(()=>{goMap('farm');setZoom(.8,true)});await sleep(400);
  const a=await pg.evaluate(()=>{const a=SC;dispatchEvent(new Event('resize'));return {before:a,after:SC,zoom:ZOOM}});assert.equal(a.after,a.before,'resize event preserves zoom scale');
  const sizes=[];for(const [width,height,touch] of [[1100,700,false],[812,375,true],[375,812,true],[812,375,true]]){
   await pg.setViewport({width,height,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});await sleep(450);
   const q=await pg.evaluate(()=>{const actual=SC;resize();const expected=SC;dispatchEvent(new Event('orientationchange'));return {actual,expected,afterOrientation:SC,zoom:ZOOM,saved:localStorage.getItem('la-zoom')}});
   assert.equal(q.actual,q.expected,'viewport event uses current resize');assert.equal(q.afterOrientation,q.expected);assert.equal(q.zoom,.8);assert.equal(Number(q.saved),.8);sizes.push({width,height,...q});
  }await pg.screenshot({path:path.join(out,'zoom-phone.png')});return {event:a,sizes};
 });
 }finally{await browser.close()}
 console.log(JSON.stringify(results));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
