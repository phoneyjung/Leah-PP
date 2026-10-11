// Claude 2.23 (owner 11 Oct 22:17 "ตอนนี้เด็กตีมอนเตอร์ได้ ซึ่งผิด"): a child (under 10) never fights — real taps on a phone, in the cave mouth beside a monster
// ages 7 and 9: a tap on the monster, the big button and the weapon/job skills take 0 HP from any monster in 3 s · the big button reads 👋 "โบกมือ" with nothing else near,
// a wave everyone online sees (myEmote 👋) and a heart over the monster · near a sleeping crystal the button still shows the crystal (the wave never hides a real action)
// ages 10 and 30: the same tap and button still hit (HP goes down), the button reads "ตี" · no page errors
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-kid-223';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const start=(p,age)=>p.evaluate(age=>{const d=Store.all();d.slots=[newSave({name:'Pim',kid:age<10?0:5,house:1,age})];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;if(age>=10)S.lv=12;ensureDaily();S.daily.seen=1;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}goMap('cavemouth');P.path=P.act=null},age);
// one monster beside the player, the others far away; returns where to tap it on the screen
const setup=p=>p.evaluate(()=>{try{closeModal()}catch(e){}DLG=null;PAUSE=false;P.target=null;P.path=null;P.act=null;if(S.hp!=null)S.hp=9999;
  const o=MONS.find(m=>!m.happy&&!m.gone);if(!o)return null;for(const m of MONS)if(m!==o){m.x+=6000}o.x=P.x+34;o.y=P.y;o.vx=o.vy=0;o.hp=o.maxHp||o.hp;window.__o=o;window.__hp0=o.hp;
  const dpr=devicePixelRatio||1;return {x:(o.x-camX)*SC/dpr,y:(o.y-(o.h||22)/2-camY)*SC/dpr,hp:o.hp}});
const hold=p=>p.evaluate(()=>{const o=window.__o;if(o){o.x=P.x+34;o.y=P.y;o.vx=o.vy=0}});
async function tapAt(p,x,y){await p.touchscreen.tap(x,y);await sleep(200)}
async function tapEl(p,sel){const r=await (await p.$(sel)).boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(200)}
const watch=async(p,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){await hold(p);await sleep(150)}return p.evaluate(()=>({lost:window.__hp0-window.__o.hp,target:!!P.target}))};
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const age of [7,9,10,30]){const kid=age<10;const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport({width:844,height:390,deviceScaleFactor:3,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1500);
  await start(p,age);await sleep(2200);const R={age};
  // 1. a real tap on the monster
  let at=await setup(p);assert(at,'a monster in the cave mouth');await sleep(300);at=await setup(p);await tapAt(p,at.x,at.y);R.tap=await watch(p,3000);
  R.tapWave=await p.evaluate(()=>({waves:KID223.waves,emote:myEmote,hearts:KID223.hearts}));
  // 2. the big button (its word with only the monster near, then a real tap)
  await setup(p);await sleep(500);R.label=await p.evaluate(()=>$('atkL').textContent);const w0=await p.evaluate(()=>KID223.waves);await tapEl(p,'#bAtk');R.button=await watch(p,3000);R.buttonWave=(await p.evaluate(()=>KID223.waves))-w0;
  // 3. the weapon skill and the job skills
  await setup(p);await p.evaluate(()=>{P.skCd=0;try{useSkill()}catch(e){}try{useJob((S.slots||[])[0])}catch(e){}});R.skill=await watch(p,1500);
  // 4. near a sleeping crystal the big button is the crystal's, not the wave
  R.crystal=await p.evaluate(()=>{const c=(M.crystals||[]).find(c=>!c.awake);if(!c)return 'none';for(const m of MONS)m.x+=6000;P.x=c.x;P.y=c.y+16;const a=anyNear();return a?a.k:null});
  R.buttons=await p.evaluate(()=>[...document.querySelectorAll('#act button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().width>0).map(b=>b.id).join(' '));
  if(kid){assert.equal(R.tap.lost,0,age+': the tap took HP');assert(!R.tap.target,age+': the tap made a target');assert(R.tapWave.waves>=1&&R.tapWave.emote==='👋'&&R.tapWave.hearts>=1,age+': wave and heart '+JSON.stringify(R.tapWave));
   assert.equal(R.label,'โบกมือ',age+': the big button word');assert.equal(R.button.lost,0,age+': the big button took HP');assert(R.buttonWave>=1,age+': the big button waves');assert.equal(R.skill.lost,0,age+': a skill took HP');
   assert(R.crystal!=='kidWave',age+': the wave hid the crystal ('+R.crystal+')')}
  else{assert(R.tap.lost>0,age+': a grown-up tap hit nothing '+JSON.stringify(R.tap));assert.equal(R.label,'ตี',age+': the grown-up button word');assert(R.button.lost>0,age+': the grown-up button hit nothing')}
  await p.screenshot({path:path.join(out,'age'+age+'.png')});assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
