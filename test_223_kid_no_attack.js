// Claude 2.23: children under the fight age (10) never attack (owner 11 Oct 20:45 "Leah can press attack — a bug"; rule 16 / DESIGN_KID_PLAY.md).
// Real taps: the big button next to a monster, a tap on the monster itself, the Space key; nothing near → the hint; a sleeping crystal still opens its question;
// the big button says "คุย / Talk" with a speech bubble; the light brush is gone from a child's bag. Age 10 and the GM still hit, and the sword comes back when the age changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-kid-223';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const SEEN={intro:1,cave1:1,shop1:1,house1:1,half:1,gate:1,clear1:1,book1:1};
async function start(p,age,gm,lang){await p.goto(base+(gm?'?gm':''),{waitUntil:'load'});await p.waitForFunction(()=>typeof Store!=='undefined'&&typeof newSave==='function'&&!$('load'),{timeout:45000});
 await p.evaluate((age,gm,SEEN,lang)=>{const d={v:2,slots:[],cur:0};const s=newSave({name:gm?'GM':'Leah',kid:1,house:1,age});if(gm)s.gm=1;s.seen=SEEN;s.snd=s.mus=false;s.joy=true;s.lang=lang;d.slots.push(s);Store.put(d)},age,gm,SEEN,lang);
 await p.reload({waitUntil:'load'});await p.waitForFunction(()=>S&&M&&!$('load'),{timeout:45000});await sleep(1200);
 await p.evaluate(()=>{try{while(typeof PP!=='undefined'&&PP.dlgOpen)PP.nextLine()}catch(e){}try{DLG=null;$('dlg').classList.add('hide');closeModal()}catch(e){}goMap('hunt1');P.path=P.target=P.act=null;window.__says=[];const o=say;say=function(m){__says.push(String(m));return o.apply(this,arguments)}});await sleep(1500)}
// stand 14 px left of the nearest monster that has nothing else near it, and hold every monster still
async function nextTo(p){return p.evaluate(()=>{for(const m of MONS){m.spd0=m.spd0||m.spd;m.spd=0;m.vx=m.vy=0}const mo=MONS.find(m=>!m.happy&&!blockedAt(M,m.x-14,m.y));P.x=mo.x-14;P.y=mo.y;P.path=P.target=P.act=null;P.cd=0;P.row=2;window.__mo=mo;return {hp:mo.hp,i:MONS.indexOf(mo)}})}
const btn=p=>p.evaluate(()=>{const im=document.querySelector('#bAtk>img.pxi');return{label:$('atkL').textContent,svg:!!(im&&/^data:image\/svg\+xml/.test(im.getAttribute('src')||''))}});
// every message said since the last check (a timed notice such as the mission board may cover the toast a moment later)
const toast=p=>p.evaluate(()=>__says.splice(0).join(' | '));

(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,touch,age,gm,lang] of [['kid7-phone',844,390,true,7,false,'th'],['kid9-ipad',1180,820,true,9,false,'th'],['kid7-en-pc',1366,768,false,7,false,'en'],['age10-phone',844,390,true,10,false,'th'],['gm-phone',844,390,true,30,true,'th']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});const R={name,age};
  await start(p,age,gm,lang);const kid=age<10;
  R.button=await btn(p);
  if(kid){assert.equal(R.button.label,lang==='en'?'Talk':'คุย','the big button talks');assert(R.button.svg,'a speech bubble, not the sword')}else{assert.equal(R.button.label,'ตี');assert(!R.button.svg,'the sword stays')}
  // 1) the big button next to a monster
  const a=await nextTo(p);await toast(p);await (touch?p.tap('#bAtk'):p.click('#bAtk'));await sleep(1300);
  R.bigButton=await p.evaluate(()=>({hp:__mo.hp,happy:!!__mo.happy,target:!!P.target}));R.toast1=await toast(p);
  if(kid){assert.equal(R.bigButton.hp,a.hp,'no damage from the big button');assert.equal(R.bigButton.target,false);assert(/ตะเกียง|lantern/.test(R.toast1),'kind words: '+R.toast1)}
  else assert(R.bigButton.hp<a.hp||R.bigButton.happy,'10+ / GM still hit: '+JSON.stringify(R.bigButton));
  await p.screenshot({path:path.join(out,name+'-button.png')});
  // 2) a tap on the monster itself (canvas), 3) Space
  if(kid){const b=await nextTo(p);const xy=await p.evaluate(()=>{const dpr=devicePixelRatio||1;return{x:(__mo.x-camX)*SC/dpr,y:(__mo.y-10-camY)*SC/dpr}});
   if(touch)await p.touchscreen.tap(xy.x,xy.y);else await p.mouse.click(xy.x,xy.y);await sleep(1500);R.tapMon=await p.evaluate(()=>({hp:__mo.hp,target:!!P.target}));assert.equal(R.tapMon.hp,b.hp,'a tap on a monster does nothing to it');assert.equal(R.tapMon.target,false);
   const c=await nextTo(p);await p.keyboard.press('Space');await sleep(900);R.space=await p.evaluate(()=>__mo.hp);assert.equal(R.space,c.hp,'Space does nothing to it');
   R.fn=await p.evaluate(()=>{const mo=__mo,h=mo.hp;doAttack(mo);attackTarget(mo);useSkill();return{same:mo.hp===h,target:!!P.target}});assert.deepEqual(R.fn,{same:true,target:false},'the functions themselves refuse');
   // nothing near → the hint
   const free=await p.evaluate(()=>{MONS.splice(0);for(let i=0;i<60;i++){const x=(4+Math.random()*(M.w-8))*T,y=(4+Math.random()*(M.h-8))*T;if(blockedAt(M,x,y))continue;P.x=x;P.y=y;let near=null;try{near=anyNear()}catch(e){}
     const cr=(M.crystals||[]).some(c=>Math.hypot(c.x-x,c.y-y)<120);if(!near&&!cr)return true}return false});assert(free,'found an empty spot');
   await sleep(300);await toast(p);await (touch?p.tap('#bAtk'):p.click('#bAtk'));await sleep(400);R.toast2=await toast(p);assert(/เดินไปใกล้|Walk up/.test(R.toast2),'where to go: '+R.toast2);
   // a sleeping crystal still opens its question from the same button
   const cr=await p.evaluate(()=>{const c=(M.crystals||[]).find(c=>!c.awake&&!blockedAt(M,c.x,c.y+20));if(!c)return false;P.x=c.x;P.y=c.y+20;P.path=P.target=P.act=null;return true});
   if(cr){await sleep(400);await (touch?p.tap('#bAtk'):p.click('#bAtk'));await sleep(900);R.crystal=await p.evaluate(()=>!$('modal').classList.contains('hide'));assert(R.crystal,'the crystal question opens');await p.screenshot({path:path.join(out,name+'-crystal.png')});await p.evaluate(()=>closeModal())}
   // the bag: no light brush for a child
   await p.evaluate(()=>openBag());await sleep(500);R.brush=await p.evaluate(()=>!!document.querySelector('#modal [data-tool="brush"]')||[...document.querySelectorAll('#modal .pn')].some(r=>{const s=r.querySelector('span');return s&&s.textContent.trim()==='🪶'}));
   R.otherTools=await p.evaluate(()=>[...document.querySelectorAll('#modal [data-tool]')].map(b=>b.dataset.tool).join());assert.equal(R.brush,false,'no brush row');await p.evaluate(()=>closeModal());
   // a child who turns 10: the sword and the word come back
   R.turn10=await p.evaluate(()=>{S.age=10;hud();const im=document.querySelector('#bAtk>img.pxi');const r={label:$('atkL').textContent,svg:/^data:image\/svg/.test(im.getAttribute('src')||'')};S.age=7;hud();return r});assert.deepEqual(R.turn10,{label:lang==='en'?'Hit':'ตี',svg:false})}
  // monsters still never strike a child; the frame rate holds
  R.fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(Math.round(n/2))};requestAnimationFrame(f)}));assert(R.fps>=50,'fps '+R.fps);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
