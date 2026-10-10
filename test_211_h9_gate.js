// Claude 2.11 (owner 10 Oct 09:25): the painted village h9 only for the GM (or the new-world switch) — players walk the farm road to the start village; the map page's edge arrows are 30 px thick and work with a real tap.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-h9-211';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const start=(p,gm)=>p.evaluate(gm=>{if(gm){const d0=Store.all();d0.slots=[];d0.cur=-1;Store.put(d0);gmMakeSlot();S=Store.all().slots[Store.all().cur]}else{const d=Store.all();d.slots=[newSave({name:'Pim',kid:5,house:1,age:30})];d.cur=0;Store.put(d);S=d.slots[0]}
  S.seen={intro:1};S.snd=S.mus=false;ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},gm);
const farmEast=p=>p.evaluate(()=>{goMap('farm');P.path=P.act=null;const e=M.exits.find(e=>e.id==='e');return {map:M.id,g9:!!M.g9,to:e&&e.to,h9On:h9On()}});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['phone',915,412,2.625],['ipad',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  // a player
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:60000});await start(p,false);await sleep(1500);const R={name};
  R.player=await farmEast(p);assert(R.player.h9On,'the h9 picture is in the game');assert.equal(R.player.to,'capital','the farm road leads to the start village');
  R.jump=await p.evaluate(()=>{goMap('h9');return M.id});assert.equal(R.jump,'capital','no way into h9');
  await p.evaluate(()=>{S.pos={map:'h9',x:40*T,y:30*T};save()});await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:60000});
  await p.evaluate(()=>{const d=Store.all();S=d.slots[d.cur];startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}});await sleep(1500);
  R.saved=await p.evaluate(()=>M.id);assert.notEqual(R.saved,'h9','a save made in h9 starts elsewhere');
  // the map page arrows: 30 px thick, a tap moves the view by 2 squares
  await p.evaluate(()=>{goMap('capital');P.path=P.act=null});await sleep(800);
  const bm=await p.$('#bMap');const bb=await bm.boundingBox();await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await sleep(900);
  R.arrows=await p.$$eval('.pe199',bs=>bs.filter(b=>b.style.display!=='none'&&b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return {d:b.classList[1],w:Math.round(r.width),h:Math.round(r.height)}}));
  assert(R.arrows.length>=1&&R.arrows.every(a=>Math.min(a.w,a.h)>=30),'arrows 30 px thick: '+JSON.stringify(R.arrows));
  const a=R.arrows[0],before=await p.evaluate(()=>[WM186.cx,WM186.cy]),ab=await (await p.$('.pe199.'+a.d)).boundingBox();await p.touchscreen.tap(ab.x+ab.width/2,ab.y+ab.height/2);await sleep(500);
  const after=await p.evaluate(()=>[WM186.cx,WM186.cy]);R.moved=[after[0]-before[0],after[1]-before[1]];assert.equal(Math.abs(R.moved[0])+Math.abs(R.moved[1]),2,'a tap moves the view 2 squares: '+R.moved);
  await p.screenshot({path:path.join(out,name+'-map.png')});await p.evaluate(()=>{try{closeWorldMap186()}catch(e){}closeModal()});
  // the GM still has the new village
  await p.goto(base+'?gm',{waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:60000});await start(p,true);await sleep(1500);
  R.gm=await farmEast(p);assert.equal(R.gm.to,'h9','GM: the farm road leads to h9');R.gmJump=await p.evaluate(()=>{goMap('h9');return M.id});assert.equal(R.gmJump,'h9');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
