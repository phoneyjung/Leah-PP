// Claude 2.04: the two 72-frame models (chibi like the NPCs) in the GM trial — real taps on the owner's phone size, pixels untouched, height next to the NPCs, missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-204';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmAdult201');await p.waitForSelector('#ad201 .ad202v',{visible:true})}
const identical=(p,v)=>p.evaluate(v=>{const V=AD201.V[v],F=V.F,W=8*F,c=document.createElement('canvas');c.width=W;c.height=F;const g=c.getContext('2d');g.drawImage(AD201.sheets.im,0,0);const src=g.getImageData(0,0,W,F).data,st=PS.stand.getContext('2d').getImageData(0,0,W,F).data,dy=(F-2)-V.foot;let same=0;
  for(let r=0;r<8;r++){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=(y*W+r*F+x)*4,sy=y-dy,a=st[o+3],w=sy>=0&&sy<F?(sy*W+r*F+x)*4:-1,wa=w<0?0:src[w+3];if(wa!==a||(a&&(src[w]!==st[o]||src[w+1]!==st[o+1]||src[w+2]!==st[o+2])))bad++}if(!bad)same++}return same},v);
const tall=(c,F,col)=>{let top=-1,bot=-1;const d=c.getContext('2d').getImageData(col*F,0,F,F).data;for(let y=0;y<F;y++)for(let x=0;x<F;x++)if(d[(y*F+x)*4+3]>80){if(top<0)top=y;bot=y;break}return bot-top+1};
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-adult-204a.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};
  R.models=await p.$$eval('#ad201 .ad202v button',bs=>bs.map(b=>b.dataset.v));assert.deepEqual(R.models,['green','a128','r3','m72a','m72b']);
  await press(p,'#ad201 .ad202v [data-v="m72a"]');
  if(fail){await p.waitForFunction(()=>AD201.error&&!AD201.pending&&$('ad201st').textContent!=='…',{timeout:15000});assert(await p.$eval('#ad201use',b=>b.disabled),'missing 72 A: use stays off');
   await press(p,'#ad201 .ad202v [data-v="m72b"]');await p.waitForFunction(()=>AD201.v==='m72b'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});R.otherStillWorks=true;
   await press(p,'#ad201x');assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>AD201.v==='m72a'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await sleep(300);
  R.windowHeight=await p.evaluate(()=>AD201.h.a);assert(R.windowHeight>=66&&R.windowHeight<=72,'72 model measured: '+R.windowHeight);
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad201 .ad202v button,#ad201 .ad203z button,#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.dataset.z||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'buttons inside and 44 px+: '+JSON.stringify(R.buttons));await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#ad201use');R.applied=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202}));assert.deepEqual(R.applied,{F:72,v:'m72a'});
  R.identicalA=await identical(p,'m72a');assert.equal(R.identicalA,8,'72 A pixel-identical');
  // next to the NPC adults: 68–71 px against their 61–62 px
  R.vsNpc=await p.evaluate(()=>{const h=(im,F)=>{const c=toCanvas(im),d=c.getContext('2d').getImageData(0,0,F,F).data;let top=-1,bot=-1;for(let y=0;y<F;y++)for(let x=0;x<F;x++)if(d[(y*F+x)*4+3]>80){if(top<0)top=y;bot=y;break}return bot-top+1};
   const me=h(PS.stand,72),nuan=IMG.npc_nuan?h(IMG.npc_nuan,64):0,mom=IMG.npc_mom?h(IMG.npc_mom,64):0,leah=IMG.npc_leah?h(IMG.npc_leah,64):0;return {me,nuan,mom,leah,toNuan:nuan?+(me/nuan).toFixed(2):0,toLeah:leah?+(me/leah).toFixed(2):0}});
  assert(R.vsNpc.me>=66&&R.vsNpc.me<=72);if(R.vsNpc.nuan)assert(R.vsNpc.toNuan>=1.05&&R.vsNpc.toNuan<=1.2,'a little taller than grandma Nuan: '+R.vsNpc.toNuan);
  R.label=await p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got});
  assert(R.label>=70&&R.label<=78,'name just above the head: '+R.label);
  await p.evaluate(()=>{const n=(M.npcs||[]).find(n=>/nuan/.test(n.img||''));if(n){P.x=n.x+34;P.y=n.y+2;P.row=6}P.path=null});await sleep(800);await p.screenshot({path:path.join(out,name+'-nuan.png')});
  // the other 72 run, then back to the own character
  await open(p);await press(p,'#ad201 .ad202v [data-v="m72b"]');await p.waitForFunction(()=>AD201.v==='m72b'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await press(p,'#ad201use');
  R.identicalB=await identical(p,'m72b');assert.equal(R.identicalB,8,'72 B pixel-identical');
  await p.evaluate(()=>{goMap('room');P.path=P.act=null;P.row=0});await sleep(900);await p.screenshot({path:path.join(out,name+'-room.png')});
  await open(p);await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
