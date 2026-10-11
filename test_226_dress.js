// Claude 2.26 (overnight round, owner 12 Oct 00:20 "ขัดเกลาส่วนเด็ก" — Leah loved changing hair, face, eyes, mouth and clothes): a child under 10 dresses up again
// real taps on the owner's phone sizes and the iPad:
// · the bag has "👗 แต่งตัว" → the paperdoll screen for the character they already have: only hair · face · body tabs (no age, no house), the name shown but locked,
//   nothing of the game on top of it, every target 44 px+, nothing overlapping, no scrolling · "แต่งตัวเสร็จ" keeps the new pieces (world sheet, HUD portrait), the house,
//   the name and the age stay · "ไม่เปลี่ยน" keeps the old look · ten dice never change the house · the language button keeps the dressing screen
// · a child made before 2.24 (no pieces, the curly sprite) gets the pieces of that gender and keeps its sprite number
// · at home, standing by the wardrobe, the big button reads "แต่งตัว" and a tap opens the same screen; a step away it does not
// · a grown-up: no bag button, nothing at the wardrobe · pd-kid.json missing: no bag button, nothing opens, the game plays · no page errors
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-dress-226';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function tap(p,el){if(typeof el==='string'){const s=el;el=await p.$(s);if(!el)throw Error('no '+s)}const r=await el.boundingBox();if(!r)throw Error('hidden');await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(350)}
const start=(p,o)=>p.evaluate(o=>{const d=Store.all();const s=newSave({name:o.name||'Pim',kid:o.kid??0,house:o.house??1,age:o.age});if(o.pd)s.pd219=o.pd;if(o.g)s.gender194=o.g;d.slots=[s];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},o);
const audit=p=>p.evaluate(()=>{const side=document.querySelector('#cr .side'),seen=e=>{let q=e;while(q&&q!==document.body){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'||+t.opacity<.1)return false;q=q.parentElement}const b=e.getBoundingClientRect();return b.width>1&&b.height>1};
  const T=[...document.querySelectorAll('#cr button')].filter(seen),rects=T.map(e=>{const b=e.getBoundingClientRect();return {id:(e.id||e.dataset.sub||e.dataset.tab||e.dataset.pd&&e.dataset.pd+e.dataset.n||e.className||'b').toString().slice(0,20),x:b.left,y:b.top,w:b.width,h:b.height}});
  const small=rects.filter(r=>r.w<43.5||r.h<43.5).map(r=>r.id+' '+Math.round(r.w)+'×'+Math.round(r.h)),over=[];for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],c=rects[j];if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>1&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>1)over.push(a.id+'/'+c.id)}
  const cr=$('cr');let onTop=0;for(let y=5;y<innerHeight;y+=15)for(let x=5;x<innerWidth;x+=15){const e=document.elementFromPoint(x,y);if(e&&!cr.contains(e))onTop++}
  let minPx=99,cut=0;for(const e of side.querySelectorAll('*')){if(!seen(e)||![...e.childNodes].some(n=>n.nodeType===3&&n.data.trim()))continue;minPx=Math.min(minPx,parseFloat(getComputedStyle(e).fontSize));const r=e.getBoundingClientRect(),pr=e.closest('button')?.getBoundingClientRect();if(pr&&(r.left<pr.left-1||r.right>pr.right+1))cut++}
  const body=side.querySelector('.body');return {n:rects.length,small,over,onTop,minPx,cut,scroll:body.scrollHeight-body.clientHeight}});
const look=p=>p.evaluate(()=>({on:DRESS226.on,pd:$('cr').classList.contains('pd219'),hidden:$('cr').classList.contains('hide'),tabs:[...document.querySelectorAll('#cr .rail [data-tab]')].filter(b=>b.offsetParent&&getComputedStyle(b).display!=='none').map(b=>b.dataset.tab).join(),
  title:(document.querySelector('#cr .top h1')||{}).textContent,go:($('cgo')||{}).textContent,nameRO:!!($('cname')&&$('cname').readOnly),name:($('cname')||{}).value,paused:PAUSE}));
const world=p=>p.evaluate(()=>({pd:S.pd219,house:S.house,name:S.name,age:S.age,kid:S.kid,g:S.gender194,flag:PS.pd219,paused:PAUSE,cr:$('cr').classList.contains('hide'),hud:PD219.hud}));
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,mode] of [['phone844',844,390,3,'full'],['phone667',667,375,2,'look'],['ipad1180',1180,820,2,'look'],['old844',844,390,3,'old'],['home844',844,390,3,'home'],['adult844',844,390,3,'adult'],['online844',844,390,3,'online'],['nojson844',844,390,3,'nojson']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  if(mode==='nojson'){await p.setRequestInterception(true);p.on('request',r=>/pd-kid\.json/.test(r.url())?r.abort():r.continue())}
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1200);const R={name};
  const made={v:1,hair:1,face:1,eyes:1,mouth:1,body:1,hc:-1,ec:-1,tn:1};
  if(mode==='adult'){await start(p,{age:30,kid:5});await sleep(1500);await tap(p,'#bBag');await sleep(800);R.bagBtn=!!(await p.$('#bDress226'));await p.evaluate(()=>{closeModal();goMap('room')});await sleep(900);
   R.wardrobe=await p.evaluate(()=>{const a=M.layout2.find(q=>q[0]==='wardrobe'),v=f2View(a[0],a[1]);P.x=(a[2]+v[6]/2)*T;P.y=(a[3]+v[7]+.6+ROOM2.rowsAbovePlan)*T;KID223.btn=1;const c=anyNear();KID223.btn=0;return c?c.k:null});
   assert(!R.bagBtn&&R.wardrobe!=='dress226','a grown-up does not dress up here '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  if(mode==='online'){
   // the child sends the pieces as a short text; a grown-up's device (no pieces loaded yet) draws that player in the pieces, a record without or with a broken text draws the usual sprite
   await start(p,{age:7,pd:{v:1,hair:3,face:2,eyes:3,mouth:2,body:2,hc:4,ec:3,tn:2},g:'f'});await sleep(1800);
   R.sent=await p.evaluate(()=>{let got=null;const keep=[Net.online,Net.me],fb=window.firebase;if(!fb||!fb.database)window.firebase={database:{ServerValue:{TIMESTAMP:0}}};Net.online=true;Net.me={set(v){got=v}};try{Net.send(true)}finally{[Net.online,Net.me]=keep;if(window.firebase!==fb)window.firebase=fb}return got&&{pd:got.pd,k:got.k,n:got.n}});
   assert.equal(R.sent.pd,'3,2,3,2,2,4,3,2','the record carries the pieces');
   // the grown-up is another device: a fresh browser profile that never loaded the pieces
   await bc.close();const bc2=await browser.createBrowserContext();p=await bc2.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
   await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1200);
   // (a new device opens on the gender screen, which already loads the pieces for a child; the grown-up's device here has its own save and reopens straight into the game)
   await start(p,{age:30,kid:5,name:'Mom'});await sleep(800);await p.evaluate(()=>save());await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1500);
   await p.evaluate(()=>{document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}if(!M||!S)startGame()});await sleep(1500);
   R.before=await p.evaluate(()=>({ok:PD219.ok,tried:PD219.tried,age:S&&S.age,map:M&&M.id}));
   R.other=await p.evaluate(async()=>{const mk=(pd,id)=>({p:{n:'Kid'+id,lv:1,h:2,k:0,a:1,r:0,w:0,m:mapKey(),x:P.x+60,y:P.y,pd},x:P.x+60,y:P.y,tx:P.x+60,ty:P.y,dist:0});
     Net.others={a:mk('3,2,3,2,2,4,3,2','a')};for(let i=0;i<60&&!PD219.ok;i++)await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,500));const d0=OTH226.drawn;await new Promise(r=>setTimeout(r,400));const drawn=OTH226.drawn-d0;
     const w=OTH226.cache.get('3,2,3,2,2,4,3,2|2'),ref=pd219World(pdDec226('3,2,3,2,2,4,3,2'),2).stand,same=!!w&&w.stand.getContext('2d').getImageData(0,0,512,64).data.every((v,i)=>v===ref.getContext('2d').getImageData(0,0,512,64).data[i]);
     Net.others={b:mk(undefined,'b'),c:mk('x,1,2','c')};const d1=OTH226.drawn;await new Promise(r=>setTimeout(r,400));const plain=OTH226.drawn-d1;Net.others={};return {ok:PD219.ok,drawn,same,plain}});
   await p.screenshot({path:path.join(out,name+'-other.png')});
   assert(!R.before.ok&&R.other.ok&&R.other.drawn>0&&R.other.same&&R.other.plain===0,'another player in pieces '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc2.close();continue}
  if(mode==='nojson'){await start(p,{age:7});await sleep(1500);await tap(p,'#bBag');await sleep(1500);R.bagBtn=!!(await p.$('#bDress226'));await p.evaluate(()=>{closeModal();dress226Open()});await sleep(1200);R.open=await p.evaluate(()=>({on:DRESS226.on,cr:$('cr').classList.contains('hide'),paused:PAUSE}));
   assert(!R.bagBtn&&!R.open.on&&R.open.cr&&!R.open.paused,'no pieces: nothing opens '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  if(mode==='old'){await start(p,{age:8,kid:3,house:2,name:'Tao'});await sleep(1800);await tap(p,'#bBag');await p.waitForSelector('#bDress226',{timeout:20000});await tap(p,'#bDress226');await sleep(900);R.screen=await look(p);
   assert(R.screen.on&&R.screen.pd&&R.screen.tabs==='hair,face,body','an old child gets the paperdoll '+JSON.stringify(R.screen));await tap(p,'#cgo');await sleep(900);R.after=await world(p);
   assert(R.after.pd&&R.after.flag&&R.after.kid===3&&R.after.house===2&&R.after.name==='Tao'&&R.after.age===8&&R.after.pd.body===2,'an old child keeps its sprite number and gets the pieces '+JSON.stringify(R.after));
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await start(p,{age:7,pd:made,g:'f',house:1,name:'Mina'});await sleep(1800);
  if(mode==='home'){await p.evaluate(()=>goMap('room'));await sleep(1200);
   const near=await p.evaluate(()=>{const a=M.layout2.find(q=>q[0]==='wardrobe'),v=f2View(a[0],a[1]);for(let dy=0;dy<=2.2;dy+=.25)for(let dx=-1;dx<=v[6]+1;dx+=.25){const x=(a[2]+dx)*T,y=(a[3]+v[7]+dy+ROOM2.rowsAbovePlan)*T;if(blockedAt(M,x,y))continue;P.x=x;P.y=y;if(dress226Wardrobe())return [x,y]}return null});
   assert(near,'a free spot by the wardrobe');await p.evaluate(([x,y])=>{P.x=x;P.y=y;P.path=null},near);await sleep(900);R.word=await p.evaluate(()=>$('atkL').textContent);await p.screenshot({path:path.join(out,name+'-wardrobe.png')});
   await tap(p,'#bAtk');await sleep(900);R.screen=await look(p);assert.equal(R.word,'แต่งตัว','the big button by the wardrobe');assert(R.screen.on&&R.screen.pd,'the wardrobe opens dressing '+JSON.stringify(R.screen));
   await tap(p,'#c3Back');await sleep(500);R.away=await p.evaluate(()=>{P.y+=5*T;P.x+=6*T;KID223.btn=1;const c=anyNear();KID223.btn=0;return c?c.k:null});assert(R.away!=='dress226','away from the wardrobe '+R.away);
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // the bag button, then the screen
  await tap(p,'#bBag');await p.waitForSelector('#bDress226',{timeout:20000});R.bagBtn=await p.evaluate(()=>{const b=$('bDress226').getBoundingClientRect();return [Math.round(b.width),Math.round(b.height),$('bDress226').textContent]});
  if(width===844)await p.screenshot({path:path.join(out,name+'-bag.png')});await tap(p,'#bDress226');await sleep(900);R.screen=await look(p);
  assert(R.screen.on&&R.screen.pd&&!R.screen.hidden&&R.screen.tabs==='hair,face,body'&&R.screen.nameRO&&R.screen.name==='Mina'&&R.screen.paused&&/แต่งตัว/.test(R.screen.title)&&/แต่งตัวเสร็จ/.test(R.screen.go),'the dressing screen '+JSON.stringify(R.screen));
  R.tabs={};for(const tb of ['hair','face','body']){await tap(p,`#cr .rail [data-tab="${tb}"]`);const n=(await p.$$('#cr .side .tp.on .sub4 button')).length;
   for(let si=0;si<Math.max(1,n);si++){if(n)await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[si]);const A=await audit(p),k=tb+(n?si:'');R.tabs[k]=[A.n,A.onTop,A.scroll,A.minPx];
    assert(!A.small.length&&!A.over.length&&A.onTop===0&&A.scroll<=1&&A.minPx>=12&&A.cut===0,name+' '+k+': '+JSON.stringify(A));if(width===844||width===1180)await p.screenshot({path:path.join(out,name+'-'+k+'.png')})}}
  if(mode!=='full'){await tap(p,'#cgo');await sleep(700);R.after=await world(p);assert(R.after.cr&&!R.after.paused&&R.after.flag,'closed '+JSON.stringify(R.after));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // keep: "ไม่เปลี่ยน" after changing things leaves the look as it was
  await tap(p,'#cr .rail [data-tab="hair"]');await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[0]);await tap(p,'#pd219hair .opt[data-n="3"]');await tap(p,'#c3Back');await sleep(700);R.kept=await world(p);
  assert(R.kept.cr&&!R.kept.paused&&JSON.stringify(R.kept.pd)===JSON.stringify(made)&&R.kept.house===1,'"keep my look" '+JSON.stringify(R.kept));
  // change: hair 3 · eyes 3 · mouth 2 · body 2 · hair colour 4, then the dice ten times never moves the house; the language button keeps the screen
  await tap(p,'#bBag');await p.waitForSelector('#bDress226');await tap(p,'#bDress226');await sleep(800);
  {const houses=new Set();for(let i=0;i<10;i++){await tap(p,'#c3Rand');houses.add(await p.evaluate(()=>CR_STATE.house))}R.diceHouses=[...houses];assert.deepEqual(R.diceHouses,[1],'the dice keeps the house')}
  await tap(p,'#cLang');await sleep(600);R.en=await look(p);assert(R.en.on&&R.en.pd&&R.en.tabs==='hair,face,body'&&/Dress up/.test(R.en.title)&&/Done/.test(R.en.go),'English keeps dressing '+JSON.stringify(R.en));await tap(p,'#cLang');await sleep(600);
  await p.evaluate(m=>{Object.assign(CR_STATE.pd,{hair:m.hair,face:m.face,eyes:m.eyes,mouth:m.mouth,body:m.body,tn:m.tn});CR_STATE.hcol=null;CR_STATE.ecol=null;crRefresh()},made);
  for(const [tb,si,sel] of [['hair',0,'#pd219hair .opt[data-n="3"]'],['face',1,'#pd219eyes .opt[data-n="3"]'],['face',3,'#pd219mouth .opt[data-n="2"]'],['body',null,'#pd219body .opt[data-n="2"]'],['hair',1,'#chc .sw[data-v="4"]']]){
   await tap(p,`#cr .rail [data-tab="${tb}"]`);if(si!=null)await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[si]);await tap(p,sel)}
  await p.screenshot({path:path.join(out,name+'-changed.png')});const hud0=await p.evaluate(()=>{const c=$('hudPortrait');return c?c.toDataURL():''});
  await tap(p,'#cgo');await sleep(1200);R.after=await world(p);await p.screenshot({path:path.join(out,name+'-world.png')});
  assert.deepEqual(R.after.pd,{v:1,hair:3,face:1,eyes:3,mouth:2,body:2,hc:4,ec:-1,tn:1},'the new pieces');assert(R.after.flag&&R.after.cr&&!R.after.paused&&R.after.house===1&&R.after.name==='Mina'&&R.after.age===7&&R.after.g==='f','in the world '+JSON.stringify(R.after));
  R.sheet=await p.evaluate(()=>{const {stand}=pd219Full(S.pd219,S.house),a=PS.stand.getContext('2d').getImageData(0,0,512,64).data,b=stand.getContext('2d').getImageData(0,0,512,64).data;return a.every((v,i)=>v===b[i])});assert(R.sheet,'the world sheet is the new look');
  R.hudChanged=await p.evaluate(h0=>{const c=$('hudPortrait');return !!c&&c.toDataURL()!==h0},hud0);assert(R.hudChanged,'the HUD portrait follows');
  R.saved=await p.evaluate(()=>JSON.stringify(Store.all().slots[0].pd219));assert.equal(R.saved,JSON.stringify(R.after.pd),'saved');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
