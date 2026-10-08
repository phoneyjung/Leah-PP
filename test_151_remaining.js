// 1.51: BUG-3 legacy requests/fallbacks, BUG-4 real fishing, BUG-6 portable launch configuration.
// Also investigates BUG-5 through real rest/bench clicks and mouse/keyboard/touch movement.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const puppeteer=require('puppeteer'),out=process.env.OUT_DIR||'/tmp/leah-bugs-151';fs.mkdirSync(out,{recursive:true});
const root=__dirname,results={},errors=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const retired=['map-farm.jpg','robot-helper.png','wild-bush.png','wild-rock.png','wild-stump.png'];
const legacy=['qa_all_maps.js','test_103_village.js','test_104_lantern.js','test_105_gm.js','test_106_g9.js','test_107_h9.js','test_109_mail.js','test_110_neww.js','test_111_corners.js','test_decor_demo.js','test_water_demo.js'];
async function check(name,fn){if(process.env.CHECK_ONLY&&process.env.CHECK_ONLY!==name)return;try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
async function press(pg,id,touch=false){const e=await pg.$(id);assert(e,'button exists '+id);const r=await e.boundingBox();assert(r,'visible '+id);
 if(touch)await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(100)}
async function ground(pg,wx,wy,touch=false){const xy=await pg.evaluate((wx,wy)=>{const r=document.getElementById('c').getBoundingClientRect(),d=devicePixelRatio||1;return [(wx-camX)*SC/d+r.left,(wy-camY)*SC/d+r.top]},wx,wy);
 assert.equal(await pg.evaluate(([x,y])=>document.elementFromPoint(x,y)?.id,xy),'c','ground input reaches canvas');
 if(touch)await pg.touchscreen.tap(...xy);else await pg.mouse.click(...xy)}
async function boot(browser,missing=[],touch=false){const context=await browser.createBrowserContext(),pg=await context.newPage(),requests=[],notFound=[];
 await pg.setViewport({width:touch?812:1366,height:touch?375:768,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});
 pg.on('pageerror',e=>errors.push(e.message));pg.on('request',r=>requests.push(new URL(r.url()).pathname.split('/').pop()));pg.on('response',r=>{if(r.status()===404)notFound.push(new URL(r.url()).pathname.split('/').pop())});
 if(missing.length){await pg.setRequestInterception(true);pg.on('request',r=>missing.includes(new URL(r.url()).pathname.split('/').pop())?r.abort():r.continue())}
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
 await pg.waitForFunction(()=>!document.getElementById('load')&&typeof gmMakeSlot==='function',{timeout:30000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.mus=false;S.seen=S.seen||{};S.seen.intro=true;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;
  const h=farmSave();h.farm.robot=true;h.farm.robotOn=false;HOME.put(h);delete CACHE.farm;goMap('farm')});await sleep(1500);
 await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false;HOLD=null});return {context,pg,requests,notFound};}
async function inspectRobot(pg){return pg.evaluate(()=>{const o=M.robot&&M.robot.o,im=o&&IMG[o.img];let pixels=0;
 if(im&&im.getContext)pixels=[...im.getContext('2d').getImageData(0,0,im.width,im.height).data].filter((v,i)=>i%4===3&&v>0).length;
 return {map:M.id,painted:M.painted,g9b:!!M.g9b,walkable:walkable(M,Math.floor(P.x/T),Math.floor(P.y/T)),robot:!!o,size:im?[im.width,im.height]:null,pixels,walkSheet:!!IMG.robotWalk,oldRobotSheet:!!IMG.robotSheet,fourViews:!!IMG.farmArt2}})}
async function walkingTarget(pg){return pg.evaluate(()=>{for(const [dx,dy] of [[0,2],[-2,0],[2,0],[0,-2],[1,1]]){const x=Math.floor(P.x/T)+dx,y=Math.floor(P.y/T)+dy;
 if(walkable(M,x,y)&&findPath(M,P.x,P.y,x*T+16,y*T+16)&&!M.exits.some(e=>Math.hypot(x*T+16-e.x,y*T+16-e.y)<40))return [x*T+16,y*T+16]}return null})}
async function portableLaunches(){const files=fs.readdirSync(root).filter(n=>/^(test_|qa_).*\.js$/.test(n));
 for(const f of files){const s=fs.readFileSync(path.join(root,f),'utf8');assert(!/\/home\/claude/.test(s),'no old machine path: '+f);new vm.Script(s,{filename:f})}
 const captures=[];
 for(const f of legacy){const capture={},stop=new Error('launch inspected'),source=fs.readFileSync(path.join(root,f),'utf8');
  const pg={setViewport:async()=>{},on:()=>{},setRequestInterception:async()=>{},goto:async url=>{capture.url=url;throw stop}};
  const sandbox={process:{env:{PORT:'19876',CHROME_EXE:'/tmp/test-chrome'},argv:[]},require:name=>{assert.equal(name,'puppeteer');capture.module=name;return {launch:async options=>{capture.options=options;return {newPage:async()=>pg}}}}};
  try{await vm.runInNewContext(source,sandbox,{filename:f})}catch(e){if(e!==stop)throw e}
  assert.equal(capture.options.executablePath,'/tmp/test-chrome',f+' honors CHROME_EXE');assert.equal(new URL(capture.url).port,'19876',f+' honors PORT');
  captures.push({file:f,module:capture.module,port:new URL(capture.url).port});
 }return {checkedFiles:files.length,launchConfigurations:captures};}
(async()=>{await check('portable-suites',portableLaunches);
 await check('one-rollFish',async()=>{const s=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.equal((s.match(/function rollFish\(/g)||[]).length,1,'only the active rollFish remains');assert(/function fishWeights\(\)[\s\S]*?fwNow\(/.test(s),'rain/weather weights retained');return {definitions:1,weatherWeightsKept:true}});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{const normal=await boot(browser);const {pg}=normal;
  await check('retired-requests',async()=>{assert.deepEqual(normal.requests.filter(n=>retired.includes(n)),[],'retired files never requested');return {retiredRequests:0,remaining404:[...new Set(normal.notFound)]}});
  await check('fish-real-button',async()=>{await pg.evaluate(()=>{P.sit=null;P.x=M.fishSpot.x;P.y=M.fishSpot.y;P.path=null;FISHING.on=false;FISHING.st='idle';S.reelFish=false;S.fishBag=[];S.life.fish={lv:1,xp:0};
   window._getHours=Date.prototype.getHours;Date.prototype.getHours=()=>10;window._roll=rollFish;window._sample=0;
   rollFish=function(){const old=Math.random;Math.random=()=>window._sample;try{return window._roll()}finally{Math.random=old}}});await sleep(400);
   const samples=[];try{for(const seed of [.01,.5,.99]){await pg.evaluate(seed=>{window._sample=seed;FISHING.st='idle'},seed);await press(pg,'#bAtk');
    const a=await pg.evaluate(()=>({state:FISHING.st,fish:FISHING.fish,eligible:hourOk(10,FISH[FISHING.fish][3]),lake:FLOC.lake.includes(FISHING.fish)}));assert.equal(a.state,'wait');assert(a.eligible&&a.lake,'fish matches place and time');samples.push(a.fish);
   }const before=await pg.evaluate(()=>({n:(S.fishBag||[]).length,index:FISHING.fish}));
   await pg.waitForFunction(()=>FISHING.st==='bite',{timeout:8000});await press(pg,'#bAtk');
   const caught=await pg.evaluate(()=>({n:S.fishBag.length,last:S.fishBag.at(-1),state:FISHING.st}));assert.equal(caught.n,before.n+1);assert.equal(caught.last,before.index);assert.equal(caught.state,'idle');
   await pg.screenshot({path:path.join(out,'fishing.png')});return {samples,caught};
   }finally{await pg.evaluate(()=>{rollFish=window._roll;Date.prototype.getHours=window._getHours;FISHING.on=false;FISHING.st='idle'})}
  });
  await normal.context.close();
  for(const [name,missing] of [
   ['robot-four-views',['robot-walk.png']],['robot-procedural',['robot-walk.png','farm-art2.png']],
   ['legacy-farm',['robot-walk.png','farm-art2.png','map-G9-home-farm.jpg','map-G9-home-farm-hi.jpg','map-G9b-ground.jpg','g9b-sprites.png','g9b-plants.png','g9b-scene.json']]])await check(name,async()=>{
    const c=await boot(browser,missing);try{const a=await inspectRobot(c.pg);assert(a.robot&&a.pixels>50,'fallback robot has visible pixels');assert(!a.walkSheet,'missing walk sheet is really absent');assert(a.walkable,'fallback spawn walkable');
     if(name==='robot-four-views')assert(a.fourViews);else assert(!a.fourViews);
     if(name==='legacy-farm'){assert.equal(a.painted,'bgFarmGrey');const wild=await c.pg.evaluate(()=>['bush','rock','stump'].map(k=>{const im=wildImg(k);return {kind:k,pixels:[...im.getContext('2d').getImageData(0,0,im.width,im.height).data].filter((v,i)=>i%4===3&&v>0).length}}));assert(wild.every(a=>a.pixels>50),'legacy wild objects have procedural fallback');a.wild=wild}
     assert.deepEqual(c.requests.filter(n=>retired.includes(n)),[]);await press(c.pg,'#bBag');assert.equal(await c.pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')),false);await press(c.pg,'#mX');
     const start=await c.pg.evaluate(()=>[P.x,P.y]),target=await walkingTarget(c.pg);assert(target);await ground(c.pg,...target);await sleep(1300);
     a.walkedPx=await c.pg.evaluate(a=>Math.hypot(P.x-a[0],P.y-a[1]),start);assert(a.walkedPx>24,'click walks in fallback scene');
     await c.pg.screenshot({path:path.join(out,name+'.png')});return a;
    }finally{await c.context.close()}
   });
  await check('sit-investigation',async()=>{const pc=await boot(browser),phone=await boot(browser,[],true),report=[];
   try{for(const age of [30,7])for(const seat of ['ground','bench'])for(const input of ['click','arrow','stick']){
    const touch=input==='stick',c=touch?phone:pc;
    // 1.71 (owner, 8 Oct; edited by Claude): in kid mode a child's main screen has no rest button, so the child's ground seat runs with kid mode switched off in settings.
    await c.pg.evaluate((age,seat)=>{closeModal();DLG=null;PAUSE=false;HOLD=null;P.sit=null;P.path=null;P.act=null;P.target=null;FISHING.on=false;S.age=age;if(age<12)S.kidUI=false;else delete S.kidUI;hud();
     if(seat==='ground'){P.x=M.spawnDefault[0];P.y=M.spawnDefault[1];return}const q=g9bSeats()[0];
     for(let radius=0;radius<5;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      const tx=Math.floor(q.x/T)+dx,ty=Math.floor((q.by+50)/T)+dy;if(walkable(M,tx,ty)){P.x=tx*T+16;P.y=ty*T+16;return}}
    },age,seat);await sleep(500);
    assert.equal(await c.pg.evaluate(()=>walkable(M,Math.floor(P.x/T),Math.floor(P.y/T))),true,'start sitting from walkable ground');
    if(seat==='ground')await press(c.pg,'#bRest',touch);else{const q=await c.pg.evaluate(()=>{const q=g9bSeats()[0];return [q.x,q.by-12]});await ground(c.pg,...q,touch)}
    await c.pg.waitForFunction(()=>!!P.sit,{timeout:5000});await sleep(450);const start=await c.pg.evaluate(()=>[P.x,P.y]);
    if(input==='click'){const target=await walkingTarget(c.pg);assert(target,'reachable target from sitting spot');await ground(c.pg,...target,touch)}
    else{const axis=await c.pg.evaluate(()=>{let x=P.x,y=P.y;
     // The existing mouse stand-up moves to the free floor below a bench. Choose a direction with room to walk there.
     if(P.sit&&typeof P.sit==='object'&&!P.sit.free){for(const d of [20,28,36,44])if(!blockedAt(M,P.sit.x,P.sit.y+d)){x=P.sit.x;y=P.sit.y+d;break}}
     for(const [dx,dy,key] of [[0,1,'ArrowDown'],[0,-1,'ArrowUp'],[1,0,'ArrowRight'],[-1,0,'ArrowLeft']]){
     if([8,24,40].every(d=>!blockedAt(M,x+dx*d,y+dy*d)))return {dx,dy,key}}return null});assert(axis,'clear straight walking direction '+[age,seat,input].join('/'));
     if(input==='arrow'){await c.pg.keyboard.down(axis.key);await sleep(700);await c.pg.keyboard.up(axis.key)}
     else{const r=await c.pg.$eval('#joy',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
      await c.pg.touchscreen.touchStart(r.x,r.y);await c.pg.touchscreen.touchMove(r.x+axis.dx*38,r.y+axis.dy*38);await sleep(750);await c.pg.touchscreen.touchEnd()}}
    await sleep(1100);const a=await c.pg.evaluate(start=>({stillSitting:!!P.sit,walkedPx:Math.hypot(P.x-start[0],P.y-start[1]),free:walkable(M,Math.floor(P.x/T),Math.floor(P.y/T))}),start);report.push({age,seat,input,...a});assert(!a.stillSitting&&a.walkedPx>24,'sit exit '+[age,seat,input,JSON.stringify(a)].join('/'));
   }await phone.pg.screenshot({path:path.join(out,'sit-phone.png')});await pc.pg.screenshot({path:path.join(out,'sit-pc.png')});return report;}finally{await pc.context.close();await phone.context.close()}
  });
 }finally{await browser.close()}
 console.log(JSON.stringify(results));console.log('errors',errors.length,errors);if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
