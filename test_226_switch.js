// Claude 2.26 (BUG-36, found overnight 12 Oct): switching players never makes a second copy of the same player
// real taps on a phone (844×390): two players (a child and a grown-up) → settings → "เปลี่ยนผู้เล่น"; a save() runs while the page is leaving (the 15 s autosave or any
// action can land there) → after the reload the select screen lists each player once · a save while no player is current updates that player's own slot ·
// a save while the list points at another player never overwrites that other player · a new player from the create screen is still added · no page errors
// Version 2.25 gives errors ≥ 1 here (the list shows the child twice); 2.26 gives errors 0.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-switch-226';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function tap(p,el){if(typeof el==='string'){const s=el;el=await p.$(s);if(!el)throw Error('no '+s)}await el.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(150);const r=await el.boundingBox();if(!r)throw Error('hidden');await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(350)}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),R={};let p;
 try{const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.setViewport({width:844,height:390,deviceScaleFactor:3,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1200);
  await p.evaluate(()=>{const d=Store.all();d.slots=[newSave({name:'Pim',kid:0,house:1,age:7}),newSave({name:'Mom',kid:5,house:2,age:30})];d.cur=0;Store.put(d);S=Store.all().slots[0];S.seen={intro:1};S.snd=S.mus=false;
    startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}});await sleep(1500);
  // 1. a save while no player is current, and a save while the list points at the other player
  R.unit=await p.evaluate(()=>{save();S.coins=77;const d=Store.all();d.cur=-1;Store.put(d);save();save();const a=Store.all();const r1={n:a.slots.length,cur:a.cur,pimCoins:a.slots.find(s=>s.name==='Pim').coins};
    S.coins=88;const d2=Store.all();d2.cur=1;Store.put(d2);save();const b=Store.all();const r2={n:b.slots.length,names:b.slots.map(s=>s.name),pimCoins:b.slots.find(s=>s.name==='Pim').coins};
    const d3=Store.all();d3.cur=0;Store.put(d3);return {r1,r2}});
  assert.deepEqual(R.unit.r1,{n:2,cur:-1,pimCoins:77},'no current player: the player\'s own slot');assert.deepEqual(R.unit.r2,{n:2,names:['Pim','Mom'],pimCoins:88},'the other player is never overwritten');
  // 2. settings → switch player, with a save() while the page leaves
  await p.evaluate(()=>{addEventListener('beforeunload',()=>{try{S.coins=99;save()}catch(e){}})});
  await tap(p,'#bSet');await sleep(500);await tap(p,'#swP');await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1500);
  R.after=await p.evaluate(()=>{const d=Store.all();return {names:d.slots.map(s=>s&&s.name),cur:d.cur,rows:document.querySelectorAll('#pk .pn').length,picker:$('cr').classList.contains('p193'),pimCoins:(d.slots.find(s=>s&&s.name==='Pim')||{}).coins}});
  await p.screenshot({path:path.join(out,'after-switch.png')});
  assert.deepEqual(R.after.names,['Pim','Mom'],'each player once '+JSON.stringify(R.after));assert(R.after.picker&&R.after.rows===2&&R.after.cur===-1&&R.after.pimCoins===99,'the select screen '+JSON.stringify(R.after));
  // 3. a new player from the create screen is still added
  await tap(p,'#pNew');await sleep(500);await tap(p,'#cg194 [data-g="f"]');await p.waitForFunction(()=>PD219.tried,{timeout:30000});await sleep(500);await tap(p,'#crnd');await tap(p,'#cgo');await sleep(2000);
  R.made=await p.evaluate(()=>{const d=Store.all();return {n:d.slots.length,cur:d.cur,name:S.name,sids:new Set(d.slots.map(s=>s.sid)).size}});assert(R.made.n===3&&R.made.cur===2&&R.made.sids===3,'a new player '+JSON.stringify(R.made));
  assert.deepEqual(errors,[]);R.errors=0;await bc.close();console.log(JSON.stringify(R));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(R));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
