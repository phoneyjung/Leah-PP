// Claude 2.07: the stage C characters (woman 72 ×3 · boy 64 ×3 · girl 64 ×2) in the GM trial — real taps on the owner's phone sizes, pixels untouched, heights next to the NPCs, walking in the world, the choice kept, a missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-stagec-207';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
const KEYS=['cf1','cf2','cf3','cb1','cb2','cb3','cg1','cg2','cg3'];   // 2.13: the remade girl 3 joins (test_213_girl3.js checks her on her own)
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmStageC207');await p.waitForSelector('#ad207 .ad207g',{visible:true})}
// the built standing sheet is the file's 8 views, only moved down so the feet sit on the game's foot line
const identical=(p,v)=>p.evaluate(v=>{const V=AD201.V[v],F=V.F,W=8*F,c=document.createElement('canvas');c.width=W;c.height=F;const g=c.getContext('2d');g.drawImage(AD201.sheets.im,0,0);const src=g.getImageData(0,0,W,F).data,st=AD201.sheets.stand.getContext('2d').getImageData(0,0,W,F).data,dy=(F-2)-V.foot;let same=0;
  for(let r=0;r<8;r++){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=(y*W+r*F+x)*4,sy=y-dy,a=st[o+3],w=sy>=0&&sy<F?(sy*W+r*F+x)*4:-1,wa=w<0?0:src[w+3];if(wa!==a||(a&&(src[w]!==st[o]||src[w+1]!==st[o+1]||src[w+2]!==st[o+2])))bad++}if(!bad)same++}return same},v);
const label=p=>p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got-ad201Lift()});
async function walk(p,cdp,vec){const res=[];for(const [x,y] of vec){const a=await p.evaluate(()=>[P.x,P.y]),j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}),n=Math.hypot(x,y);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]});await sleep(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
  const z=await p.evaluate(()=>[P.x,P.y]);res.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}return res}
const nextTo=(p,who)=>p.evaluate(who=>{const n=(M.npcs||[]).find(n=>new RegExp(who).test(n.img||''));if(n){P.x=n.x+30;P.y=n.y+2;P.row=6}P.path=null;return !!n},who);
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-c207-g2.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};
  R.tiles=await p.$$eval('#ad207 .ad207g button',bs=>bs.map(b=>b.dataset.v));assert.deepEqual(R.tiles,KEYS);
  // every button shows its face (or a "?" when its file is missing)
  await p.waitForFunction(()=>[...document.querySelectorAll('#ad207 .ad207g button')].every(b=>b.classList.contains('bad')||(()=>{const d=b.querySelector('canvas').getContext('2d').getImageData(0,0,32,28).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>80)n++;return n>300})()),{timeout:20000});
  R.faces=await p.$$eval('#ad207 .ad207g button',bs=>bs.map(b=>b.classList.contains('bad')?'?':(()=>{const d=b.querySelector('canvas').getContext('2d').getImageData(0,0,32,28).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>80)n++;return n})()));
  if(fail)assert.deepEqual(R.faces.map(f=>f==='?'),KEYS.map(k=>k==='cg2'),'only the missing girl 2 shows "?"');else assert(R.faces.every(n=>n>300),'all faces drawn: '+R.faces);
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad207 .ad207g button,#ad207use,#ad207back,#ad207x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'all buttons inside and 44 px+: '+JSON.stringify(R.buttons));
  if(fail){await press(p,'#ad207 .ad207g [data-v="cg2"]');await p.waitForFunction(()=>$('ad207st').textContent!=='…'&&AD201.v==='cg2',{timeout:15000});R.missingUse=await p.$eval('#ad207use',b=>b.disabled);assert(R.missingUse,'missing girl 2: use stays off');
   await press(p,'#ad207 .ad207g [data-v="cg1"]');await p.waitForFunction(()=>AD201.v==='cg1'&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000});R.otherStillWorks=await identical(p,'cg1');assert.equal(R.otherStillWorks,8);
   await press(p,'#ad207x');assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // each one: pixels as drawn, height in its range
  R.h={};R.same={};for(const k of KEYS){await press(p,`#ad207 .ad207g [data-v="${k}"]`);await p.waitForFunction(k=>AD201.v===k&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000},k);
   R.same[k]=await identical(p,k);R.h[k]=await p.evaluate(k=>ad201Height(AD201.sheets.stand,AD201.V[k].F,0),k)}
  assert(KEYS.every(k=>R.same[k]===8),'pixel-identical: '+JSON.stringify(R.same));
  assert(KEYS.every(k=>k[1]==='f'?R.h[k]>=66&&R.h[k]<=72:R.h[k]>=58&&R.h[k]<=63),'heights: '+JSON.stringify(R.h));
  R.on=await p.$$eval('#ad207 .ad207g button.on',bs=>bs.map(b=>b.dataset.v));assert.deepEqual(R.on,[KEYS[KEYS.length-1]]);
  // the line-up shows four figures (Leah · 72 ก · the picked one · Nuan) standing on one line
  R.lineup=await p.evaluate(()=>{const c=$('ad207cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height-14).data,W=c.width,cnt=x0=>{let n=0;for(let y=0;y<c.height-14;y++)for(let x=x0-24;x<x0+24;x++)if(d[(y*W+x)*4+3]>200)n++;return n};return [40,120,200,282].map(cnt)});
  assert(R.lineup.every(n=>n>500),'four figures in the line-up: '+R.lineup);await p.screenshot({path:path.join(out,name+'-window.png')});
  // boy 2 in the world: 64 frame like the children, the name over his head, walks with the real stick
  await press(p,'#ad207 .ad207g [data-v="cb2"]');await p.waitForFunction(()=>AD201.v==='cb2'&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000});await press(p,'#ad207use');
  R.boy=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202,same:PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()}));assert.deepEqual(R.boy,{F:64,v:'cb2',same:true});
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null});const cdp=await p.createCDPSession();R.boyWalk=await walk(p,cdp,[[1,0],[0,1],[-1,0],[0,-1]]);assert(R.boyWalk.every(d=>d>20),'boy walks every way: '+R.boyWalk)   /* the distance depends on how busy the machine is; this checks that each push moves him */;await p.evaluate(()=>gmGhost(false));
  R.boyLabel=await label(p);assert(R.boyLabel>=62&&R.boyLabel<=70,'name over the boy: '+R.boyLabel);
  R.nearLeah=await nextTo(p,'leah');await sleep(800);await p.screenshot({path:path.join(out,name+'-boy-leah.png')});
  // woman 1 in the world: 72 frame, a little taller than Nuan
  await open(p);await press(p,'#ad207 .ad207g [data-v="cf1"]');await p.waitForFunction(()=>AD201.v==='cf1'&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000});await press(p,'#ad207use');
  R.woman=await p.evaluate(()=>{const h=(im,F)=>{const c=toCanvas(im),d=c.getContext('2d').getImageData(0,0,F,F).data;let top=-1,bot=-1;for(let y=0;y<F;y++)for(let x=0;x<F;x++)if(d[(y*F+x)*4+3]>80){if(top<0)top=y;bot=y;break}return bot-top+1};
   const me=h(PS.stand,PS.F),nuan=IMG.npc_nuan?h(IMG.npc_nuan,64):0;return {F:PS.F,v:S.gmAdult202,me,nuan,toNuan:nuan?+(me/nuan).toFixed(2):0}});
  assert(R.woman.F===72&&R.woman.v==='cf1'&&R.woman.me>=66&&R.woman.me<=72);if(R.woman.nuan)assert(R.woman.toNuan>=1.05&&R.woman.toNuan<=1.2,'a little taller than Nuan: '+R.woman.toNuan);
  R.womanLabel=await label(p);assert(R.womanLabel>=70&&R.womanLabel<=78,'name over the woman: '+R.womanLabel);
  R.nearNuan=await nextTo(p,'nuan');await sleep(800);await p.screenshot({path:path.join(out,name+'-woman-nuan.png')});
  // the choice is kept after a reload
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{S=Store.all().slots[Store.all().cur];startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;closeModal();goMap('h9')});
  await p.waitForFunction(()=>PS.gmSprite170&&PS.F===72&&AD201.v==='cf1',{timeout:15000});R.kept=await p.evaluate(()=>S.gmAdult202);assert.equal(R.kept,'cf1');
  await open(p);R.reopenOn=await p.$$eval('#ad207 .ad207g button.on',bs=>bs.map(b=>b.dataset.v));assert.deepEqual(R.reopenOn,['cf1']);
  await press(p,'#ad207back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
