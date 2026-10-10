// Claude 2.12 (memory, owner 10 Oct "[No preference]" → Claude's pick): the joined floor-1 picture of the Amethyst Cave (3072×2048 = 24 MB) is no longer
// made at load for every player · it is made near the stairs (cave entrance / Crystal Cave floor 1) by a worker, handed over as one picture, and let go
// once floor 1 is built or the player walks away · the floor looks the same pixel for pixel as 2.11 (ground hash 1148728221)
// also: the worker-less way (main thread, half a room a frame), leaving before it is ready, the entry with no warm-up, and a missing room file (no link)
// and: the quest arrow / mission list / route finder read maps as data only (no picture), with the same answers
// and: objects with the same picture rectangle share one measurement + shadow silhouette (the farm: 809 objects, 1 canvas each before), same numbers
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-cave-212';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/?rank=1',HASH=1148728221;
const start=(p,age)=>p.evaluate(age=>{const d=Store.all();d.slots=[newSave({name:'P',kid:age<10?0:5,house:1,age})];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;ensureDaily();S.daily.seen=1;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},age);
const open=async(browser,vp,block)=>{const bc=await browser.createBrowserContext(),p=await bc.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport(vp);await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(()=>{window.__cv=[];const oc=Document.prototype.createElement;Document.prototype.createElement=function(t){const e=oc.apply(this,arguments);if(String(t).toLowerCase()==='canvas')window.__cv.push(new WeakRef(e));return e}});
  if(block){await p.setRequestInterception(true);p.on('request',r=>r.url().includes(block)?r.abort():r.continue())}
  await p.goto(base,{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load')&&typeof HUNT1L!=='undefined',{timeout:90000});await sleep(2500);return {bc,p,errors}};
const live=async p=>{const cdp=await p.target().createCDPSession();await cdp.send('HeapProfiler.collectGarbage');await sleep(400);
  return p.evaluate(()=>{let mb=0,big=0;for(const w of __cv){const e=w.deref();if(!e)continue;mb+=e.width*e.height*4;if(e.width===3072&&e.height===2048&&e!==(CACHE.hunt1&&CACHE.hunt1.ground))big++}return {mb:+(mb/1048576).toFixed(1),big}})};
const groundHash=p=>p.evaluate(()=>{const g=M.ground,d=g.getContext('2d').getImageData(0,0,g.width,g.height).data;let h=0;for(let i=0;i<d.length;i+=97)h=(h*31+d[i])>>>0;return [M.id,g.width,g.height,h]});
const frames=p=>p.evaluate(async()=>{const fr=[];let last=performance.now();const t0=last;await new Promise(res=>{const f=()=>{const t=performance.now();fr.push(t-last);last=t;if(t-t0<3500)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
  return {n:fr.length,over50:fr.filter(x=>x>50).length,worst:Math.round(Math.max(...fr))}});
const waitHeld=(p,ms)=>p.waitForFunction(()=>!!HUNT1L.c&&!HUNT1L.busy,{timeout:ms}).then(()=>p.evaluate(()=>HUNT1L.c.constructor.name)).catch(()=>null);
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),R={};let cur;
 try{
  // A. a grown-up on the owner's phone: nothing at start, made near the stairs, same floor, let go after
  {const {bc,p,errors}=cur=await open(browser,{width:915,height:412,deviceScaleFactor:2.625,isMobile:true,hasTouch:true});await start(p,30);await sleep(3000);
   R.start=await live(p);R.start.held=await p.evaluate(()=>!!HUNT1L.c);assert.equal(R.start.big,0,'no floor-1 picture at start');assert.equal(R.start.held,false);
   R.link=await p.evaluate(()=>{goMap('cavemouth');P.path=P.act=null;const e=M.exits.find(e=>e.id==='n');return e&&e.to});assert.equal(R.link,'hunt1','the cave entrance still leads to floor 1');
   R.cmFrames=await frames(p);R.warm=await waitHeld(p,8000);assert.equal(R.warm,'ImageBitmap','made by the worker near the stairs');assert(R.cmFrames.over50<=1,'frames over 50 ms while it is made: '+JSON.stringify(R.cmFrames));
   R.enterMs=await p.evaluate(()=>{const a=performance.now();goMap('hunt1');P.path=P.act=null;return Math.round(performance.now()-a)});await sleep(800);assert(R.enterMs<200,'floor 1 entry '+R.enterMs+' ms');
   R.ground=await groundHash(p);assert.deepEqual(R.ground,['hunt1',3072,2048,HASH],'floor 1 looks the same as 2.11');
   R.afterBuild=await p.evaluate(()=>!!HUNT1L.c);assert.equal(R.afterBuild,false,'let go once floor 1 is built');
   R.minimap=await p.evaluate(()=>!!(IMG.mapHunt1&&IMG.mapHunt1.width===3072));assert(R.minimap,'the minimap/thumbnail still find the picture (the floor ground)');
   await p.screenshot({path:path.join(out,'phone-hunt1.png')});
   // B. leaving the entrance before it is ready: nothing kept
   R.leaveEarly=await p.evaluate(async()=>{goMap('capital');delete CACHE.hunt1;goMap('cavemouth');P.path=P.act=null;await new Promise(r=>setTimeout(r,1150));goMap('capital');P.path=P.act=null;await new Promise(r=>setTimeout(r,3000));return {held:!!HUNT1L.c,busy:HUNT1L.busy}});
   assert.deepEqual(R.leaveEarly,{held:false,busy:0},'walking away before it is ready keeps nothing');
   // C. made at the entrance, then walking elsewhere lets it go
   R.leaveAfter=await p.evaluate(async()=>{goMap('cavemouth');P.path=P.act=null;for(let i=0;i<80&&!HUNT1L.c;i++)await new Promise(r=>setTimeout(r,100));const had=!!HUNT1L.c;goMap('farm');P.path=P.act=null;return {had,held:!!HUNT1L.c}});
   assert.deepEqual(R.leaveAfter,{had:true,held:false},'leaving the entrance lets the picture go');
   // D. straight into floor 1 with no warm-up (a warp): made on entry, same floor, let go after
   R.direct=await p.evaluate(()=>{goMap('capital');delete CACHE.hunt1;const a=performance.now();goMap('hunt1');P.path=P.act=null;return {ms:Math.round(performance.now()-a),held:!!HUNT1L.c}});await sleep(800);
   R.directGround=await groundHash(p);assert.deepEqual(R.directGround,['hunt1',3072,2048,HASH]);assert.equal(R.direct.held,false);
   // E. no worker: made on the main thread half a room a frame, same floor
   R.noWorker=await p.evaluate(async()=>{goMap('capital');delete CACHE.hunt1;HUNT1L.noWorker=1;goMap('cavemouth');P.path=P.act=null;for(let i=0;i<80&&!(HUNT1L.c&&!HUNT1L.busy);i++)await new Promise(r=>setTimeout(r,100));return HUNT1L.c&&HUNT1L.c.constructor.name});
   assert.equal(R.noWorker,'HTMLCanvasElement');await p.evaluate(()=>{goMap('hunt1');P.path=P.act=null});await sleep(800);R.noWorkerGround=await groundHash(p);assert.deepEqual(R.noWorkerGround,['hunt1',3072,2048,HASH]);
   // I. the quest arrow, the mission list and the world map's routes give the same answers from data-only maps as from fully built ones
   R.same=await p.evaluate(()=>{goMap('capital');P.path=P.act=null;const cm=MAPS.cavemouth().crystals.map(c=>c.id),h1=MAPS.hunt1().crystals.map(c=>c.id),keepQ=questStep187,keepI=mapInfo212;let diff=0,cases=0,found=0;
     const wipe=()=>{for(const k of Object.keys(CACHE))if(k!==M.id)delete CACHE[k];lightClear212()};
     for(const cr of [{},{cavemouth:cm},{cavemouth:cm,hunt1:h1.slice(0,2)},{cavemouth:cm,hunt1:h1}]){S.crystals=JSON.parse(JSON.stringify(cr));for(const n of [2,3,4,5,6]){questStep187=()=>({n,a:0,b:1,text:''});
       const run=()=>JSON.stringify([questPlace187(),...['wake','dig','fish','hunt'].map(missionPlace188),wmRoute186('capital','hunt1'),wmRoute186('capital','cave1'),wmRoute186('capital','farm')]);
       wipe();const a=run(),built=Object.keys(CACHE).filter(k=>k!==M.id).length;mapInfo212=id=>getMap(id);wipe();const b=run();mapInfo212=keepI;wipe();cases++;if(a!==b||built)diff++;if(JSON.parse(a)[0])found++}}
     questStep187=keepQ;S.crystals={};return {cases,diff,found}});
   assert.equal(R.same.diff,0,'data-only maps answer like full ones and build nothing: '+JSON.stringify(R.same));assert(R.same.found>=10);
   // J. the farm: the shared measurements equal a fresh one done the 2.11 way (same code, one canvas per object) for every object
   R.farm=await p.evaluate(()=>{goMap('capital');for(const k of Object.keys(CACHE))if(k!==M.id)delete CACHE[k];const a=performance.now();goMap('farm');P.path=P.act=null;const ms=Math.round(performance.now()-a);
     const fresh=o=>{const im=IMG[o.img];if(!im)return null;const c=document.createElement('canvas');c.width=o.sw;c.height=o.sh;const g=c.getContext('2d');g.drawImage(im,o.sx,o.sy,o.sw,o.sh,0,0,o.sw,o.sh);
       const d=g.getImageData(0,0,o.sw,o.sh).data,A=(x,y)=>d[(y*o.sw+x)*4+3]>40;let cb=o.sh-1;const row=y=>{for(let x=0;x<o.sw;x++)if(A(x,y))return 1;return 0};while(cb>0&&!row(cb))cb--;
       let x0=o.sw,x1=0;for(let y=Math.max(0,cb-5);y<=cb;y++)for(let x=0;x<o.sw;x++)if(A(x,y)){x0=Math.min(x0,x);x1=Math.max(x1,x)}return [cb,Math.max(8,x1-x0+1),(x0+x1)/2-o.sw/2]};
     let bad=0,checked=0;for(const o of M.objs){const f=fresh(o);if(!f)continue;checked++;if(f[0]!==o.cb||f[1]!==o.foot||f[2]!==o.fx)bad++}
     return {ms,objs:M.objs.length,sil:new Set(M.objs.map(x=>x.sil).filter(Boolean)).size,checked,bad}});
   assert.equal(R.farm.bad,0,'shared measurements match: '+JSON.stringify(R.farm));assert(R.farm.checked>=100&&R.farm.sil*3<R.farm.objs,'silhouettes shared: '+JSON.stringify(R.farm));assert(R.farm.ms<200,'farm entry '+R.farm.ms+' ms');
   assert.deepEqual(errors,[]);await bc.close()}
  // F. a 7-year-old on a small phone: nothing at start either
  {const {bc,p,errors}=cur=await open(browser,{width:844,height:390,deviceScaleFactor:3,isMobile:true,hasTouch:true});await start(p,7);await sleep(3000);
   R.kid=await live(p);assert.equal(R.kid.big,0,'kid: no floor-1 picture at start');
   // a kid done with the entrance crystals: the quest arrow points into floor 1, which used to build floor 1 in full (24 MB) from wherever the kid stood
   R.kidDone=await p.evaluate(async()=>{S.crystals={cavemouth:MAPS.cavemouth().crystals.map(c=>c.id)};await new Promise(r=>setTimeout(r,2500));return {maps:Object.keys(CACHE),place:questPlace187()}});
   R.kidDone.live=await live(p);assert.deepEqual(R.kidDone.maps,[await p.evaluate(()=>M.id)],'only the map the kid stands on is built');assert.equal(R.kidDone.live.big,0);await p.screenshot({path:path.join(out,'phone844-kid.png')});assert.deepEqual(errors,[]);await bc.close()}
  // G. iPad: the floor through the real entrance, looked at
  {const {bc,p,errors}=cur=await open(browser,{width:1180,height:820,deviceScaleFactor:2,isMobile:true,hasTouch:true});await start(p,30);await sleep(2000);
   await p.evaluate(()=>{goMap('cavemouth');P.path=P.act=null});R.ipadWarm=await waitHeld(p,8000);await p.evaluate(()=>{goMap('hunt1','s');P.path=P.act=null});await sleep(1200);
   R.ipadGround=await groundHash(p);assert.deepEqual(R.ipadGround,['hunt1',3072,2048,HASH]);await p.screenshot({path:path.join(out,'ipad-hunt1.png')});assert.deepEqual(errors,[]);await bc.close()}
  // H. one room file missing: the stairs are not linked, the game carries on
  {const {bc,p,errors}=cur=await open(browser,{width:844,height:390,deviceScaleFactor:3,isMobile:true,hasTouch:true},'hunt-NE.jpg');await start(p,30);await sleep(2500);
   R.missing=await p.evaluate(async()=>{goMap('cavemouth');P.path=P.act=null;await new Promise(r=>setTimeout(r,2500));const e=M.exits.find(e=>e.id==='n');return {to:e&&e.to,has:hunt1Has212(),img:IMG.mapHunt1===undefined,map:M.id}});
   assert.notEqual(R.missing.to,'hunt1');assert.equal(R.missing.has,false);assert.equal(R.missing.img,true);assert.equal(R.missing.map,'cavemouth');assert.deepEqual(errors,[]);await bc.close()}
  R.errors=0;console.log(JSON.stringify(R));console.log('errors 0')
 }catch(e){console.error(e);if(cur&&cur.p&&!cur.p.isClosed())await cur.p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(R));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
