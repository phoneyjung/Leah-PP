// Claude 2.13 (owner 10 Oct, tap answers): the remade girl "ใหม่ 3" (PixelLab ZIP 10:42, braids, sky-blue eyes) joins the GM trial window as "ด.ญ. 3" (cg3)
// real taps on the owner's phone sizes: 9 buttons all on screen and 44 px+, her 8 views pixel for pixel, her height like the other children, the name over her head,
// walking with the real stick, next to Leah · a missing file shows "?" and keeps "use" off while the others still work
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-girl3-213';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmStageC207');await p.waitForSelector('#ad207 .ad207g',{visible:true})}
const identical=(p,v)=>p.evaluate(v=>{const V=AD201.V[v],F=V.F,W=8*F,c=document.createElement('canvas');c.width=W;c.height=F;const g=c.getContext('2d');g.drawImage(AD201.sheets.im,0,0);const src=g.getImageData(0,0,W,F).data,st=AD201.sheets.stand.getContext('2d').getImageData(0,0,W,F).data,dy=(F-2)-V.foot;let same=0;
  for(let r=0;r<8;r++){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=(y*W+r*F+x)*4,sy=y-dy,a=st[o+3],w=sy>=0&&sy<F?(sy*W+r*F+x)*4:-1,wa=w<0?0:src[w+3];if(wa!==a||(a&&(src[w]!==st[o]||src[w+1]!==st[o+1]||src[w+2]!==st[o+2])))bad++}if(!bad)same++}return same},v);
const label=p=>p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got-ad201Lift()});
async function walk(p,cdp,vec){const res=[];for(const [x,y] of vec){const a=await p.evaluate(()=>[P.x,P.y]),j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}),n=Math.hypot(x,y);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]});await sleep(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
  const z=await p.evaluate(()=>[P.x,P.y]);res.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}return res}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  // 2.14: the walk files are kept away here (standing file checks); test_214_walks.js checks her walk
  await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>(r.url().includes('gm-c214-')||(fail&&r.url().includes('gm-c213-g3.png')))?r.abort():r.continue());
  await p.goto(url,{waitUntil:'load'});await enter(p);await open(p);const R={name};
  R.tiles=await p.$$eval('#ad207 .ad207g button',bs=>bs.map(b=>b.dataset.v+':'+b.textContent.trim()));assert.equal(R.tiles.length,9);assert.match(R.tiles[8],/^cg3:/);
  await p.waitForFunction(()=>[...document.querySelectorAll('#ad207 .ad207g button')].every(b=>b.classList.contains('bad')||(()=>{const d=b.querySelector('canvas').getContext('2d').getImageData(0,0,32,28).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>80)n++;return n>300})()),{timeout:20000});
  R.face3=await p.$eval('#ad207 .ad207g [data-v="cg3"]',b=>b.classList.contains('bad')?'?':'face');assert.equal(R.face3,fail?'?':'face');
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad207 .ad207g button,#ad207use,#ad207back,#ad207x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height),w:Math.round(r.width)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44&&b.w>=44),'all 12 buttons inside and 44 px+: '+JSON.stringify(R.buttons));
  if(fail){await press(p,'#ad207 .ad207g [data-v="cg3"]');await p.waitForFunction(()=>$('ad207st').textContent!=='…'&&AD201.v==='cg3',{timeout:15000});R.missingUse=await p.$eval('#ad207use',b=>b.disabled);assert(R.missingUse,'missing girl 3: use stays off');
   await press(p,'#ad207 .ad207g [data-v="cb2"]');await p.waitForFunction(()=>AD201.v==='cb2'&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000});R.otherStillWorks=await identical(p,'cb2');assert.equal(R.otherStillWorks,8);
   await press(p,'#ad207x');assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await press(p,'#ad207 .ad207g [data-v="cg3"]');await p.waitForFunction(()=>AD201.v==='cg3'&&AD201.sheets&&!$('ad207use').disabled,{timeout:15000});
  R.same=await identical(p,'cg3');assert.equal(R.same,8,'her 8 views pixel for pixel');
  R.h=await p.evaluate(()=>ad201Height(AD201.sheets.stand,64,0));assert(R.h>=58&&R.h<=63,'height like the other children: '+R.h);
  R.lineup=await p.evaluate(()=>{const c=$('ad207cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height-14).data,W=c.width,cnt=x0=>{let n=0;for(let y=0;y<c.height-14;y++)for(let x=x0-24;x<x0+24;x++)if(d[(y*W+x)*4+3]>200)n++;return n};return [40,120,200,282].map(cnt)});
  assert(R.lineup.every(n=>n>500),'four figures in the line-up: '+R.lineup);await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#ad207use');R.girl=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202,same:PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()}));assert.deepEqual(R.girl,{F:64,v:'cg3',same:true});
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null});const cdp=await p.createCDPSession();R.walk=await walk(p,cdp,[[1,0],[0,1],[-1,0],[0,-1]]);assert(R.walk.every(d=>d>20),'she walks every way: '+R.walk);await p.evaluate(()=>gmGhost(false));
  R.label=await label(p);assert(R.label>=62&&R.label<=70,'name over her head: '+R.label);
  R.nearLeah=await p.evaluate(()=>{const n=(M.npcs||[]).find(n=>/leah/.test(n.img||''));if(n){P.x=n.x+30;P.y=n.y+2;P.row=6}P.path=null;return !!n});await sleep(800);await p.screenshot({path:path.join(out,name+'-girl3-leah.png')});
  // kept after a reload
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{S=Store.all().slots[Store.all().cur];startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;closeModal();goMap('h9')});
  await p.waitForFunction(()=>PS.gmSprite170&&PS.F===64&&AD201.v==='cg3',{timeout:15000});R.kept=await p.evaluate(()=>S.gmAdult202);assert.equal(R.kept,'cg3');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
