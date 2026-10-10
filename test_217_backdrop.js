// Claude 2.17 (owner 10 Oct 18:31 "อยากให้สวยกว่านี้" → "ลองดูตามแนะนำก่อน"): the gender, create and select screens' backdrop comes alive (code over the 1.97 picture, GM first)
// real taps on a phone (844×390) and an iPad (1180×820) with ?gm: the effect canvas sits right over the picture on the same pixel grid, it draws about 30 times a second,
// its pixels change from one moment to the next, the crystals glow where the picture's crystals are, it stops once the game starts, and the page keeps its frame rate (not 10 % lower)
// · a player without GM gets none of it · with the pictures missing there is no effect and no error · "reduce motion" draws one still frame
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-backdrop-217';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const state=p=>p.evaluate(()=>{const c=$('fx217'),bg=$('bg197');return {fx:!!c,after:!!(c&&bg&&c.previousSibling===bg),same:!!(c&&bg&&c.width===bg.width&&c.height===bg.height&&c.style.width===bg.style.width),frames:FX217.frames||0,sel:FX217.sel,
  P:Object.fromEntries(Object.entries(FX217.P).map(([k,v])=>[k,v.length])),shown:!!(c&&getComputedStyle(c).display!=='none')}});
const snap=p=>p.evaluate(()=>{const c=$('fx217');return c?c.toDataURL():''});
// glow where a crystal of the picture is (alpha summed in a small box around its grid point)
const crystal=p=>p.evaluate(()=>{const A=FX217.A[FX217.sel],[x,y]=fxP217(A.crys[0][0],A.crys[0][1]),c=$('fx217'),d=c.getContext('2d').getImageData(Math.max(0,Math.round(x)-3),Math.max(0,Math.round(y)-3),7,7).data;let a=0;for(let i=3;i<d.length;i+=4)a+=d[i];return {x:Math.round(x),y:Math.round(y),inside:x>=0&&y>=0&&x<c.width&&y<c.height,alpha:a}});
const rate=p=>p.evaluate(async()=>{const f0=FX217.frames||0,t0=performance.now();await new Promise(r=>setTimeout(r,1000));return Math.round(((FX217.frames||0)-f0)/((performance.now()-t0)/1000))});
const fps=p=>p.evaluate(async()=>{let n=0,last=performance.now(),hitch=0;const t0=last;await new Promise(res=>{const f=()=>{const t=performance.now();if(t-last>50)hitch++;last=t;n++;if(t-t0<2500)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});return {fps:+(n/2.5).toFixed(1),hitch}});
async function tap(p,sel){const e=await p.$(sel);const r=await e.boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(300)}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,mode] of [['phone',844,390,3,'gm'],['ipad',1180,820,2,'gm'],['player',844,390,3,'player'],['missing',844,390,3,'missing'],['calm',844,390,3,'calm']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  if(mode==='missing'){await p.setRequestInterception(true);p.on('request',r=>/bg-(create|select)\.jpg/.test(r.url())?r.abort():r.continue())}
  if(mode==='calm')await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await p.goto(base+'?rank=1'+(mode==='player'?'':'&gm'),{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2500);const R={name};
  if(mode==='player'||mode==='missing'){R.gender=await state(p);assert.equal(R.gender.fx,false,name+': no effect canvas');assert.equal(R.gender.frames,0,name+': nothing drawn');
   await tap(p,'#cg194 [data-g="f"]');await sleep(1500);R.create=await state(p);assert.equal(R.create.fx,false);assert.equal(R.create.frames,0);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  if(mode==='calm'){R.gender=await state(p);const f1=R.gender.frames;await sleep(1500);R.after=(await state(p)).frames;assert(R.gender.fx&&f1>=1&&R.after===f1,'reduce motion: one still frame '+JSON.stringify([f1,R.after]));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // A. gender screen
  R.gender=await state(p);assert(R.gender.fx&&R.gender.after&&R.gender.same&&R.gender.shown,'gender: effect canvas over the picture '+JSON.stringify(R.gender));
  R.genderRate=await rate(p);assert(R.genderRate>=20&&R.genderRate<=34,'gender: about 30 drawings a second: '+R.genderRate);
  {const a=await snap(p);await sleep(400);R.genderMoves=a!==await snap(p);assert(R.genderMoves,'gender: it moves')}R.genderCrystal=await crystal(p);assert(R.genderCrystal.inside&&R.genderCrystal.alpha>0,'gender: glow on the crystal '+JSON.stringify(R.genderCrystal));
  await p.screenshot({path:path.join(out,name+'-gender.png')});
  // B. create screen (a real tap on the girl)
  await tap(p,'#cg194 [data-g="f"]');await sleep(2000);R.create=await state(p);assert(R.create.fx&&R.create.after&&R.create.same&&R.create.sel==='c','create: '+JSON.stringify(R.create));
  assert(R.create.P.pt>0&&R.create.P.bf===3&&R.create.P.po>0,'create: petals, butterflies, pollen '+JSON.stringify(R.create.P));
  {const a=await snap(p);await sleep(400);R.createMoves=a!==await snap(p);assert(R.createMoves)}
  // frames of the page with and without the effect
  await fps(p);R.fps=await fps(p);await p.evaluate(()=>{FX217.off=true;const c=$('fx217');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)});await sleep(200);R.fpsWithout=await fps(p);await p.evaluate(()=>{FX217.off=false;fxStart217()});
  assert(R.fps.fps>=0.9*R.fpsWithout.fps,'frames with/without the effect: '+JSON.stringify([R.fps,R.fpsWithout]));await p.screenshot({path:path.join(out,name+'-create.png')});
  // C. select screen
  await p.evaluate(()=>{const d=Store.all();d.slots.push(newSave({name:'Mango',kid:2,house:2,age:9}));d.cur=-1;Store.put(d)});await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(3000);
  R.select=await state(p);assert(R.select.fx&&R.select.after&&R.select.same&&R.select.sel==='s'&&R.select.P.ff===8,'select: '+JSON.stringify(R.select));R.selectCrystal=await crystal(p);assert(R.selectCrystal.inside&&R.selectCrystal.alpha>0,'select: glow on the crystal');
  {const a=await snap(p);await sleep(400);R.selectMoves=a!==await snap(p);assert(R.selectMoves)}await p.screenshot({path:path.join(out,name+'-select.png')});
  // D. into the game: the effect stops
  await tap(p,'#pGo');await sleep(1500);const f1=(await state(p)).frames;await sleep(1000);R.stopped=(await state(p)).frames===f1;assert(R.stopped,'the effect stops in the game');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
