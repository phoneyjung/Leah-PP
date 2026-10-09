// Claude 2.03: the two 96-frame models in the GM trial and the zoom row (75 · 100 · 133%) — real taps on the owner's phone size, pixels untouched, missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-203';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s,touch=false){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p,touch){await press(p,'#gmBtn',touch);await press(p,'#gmAdult201',touch);await p.waitForSelector('#ad201 .ad203z',{visible:true})}
const bounds=p=>p.$$eval('#ad201 .ad202v button,#ad201 .ad203z button,#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.dataset.z||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height),w:Math.round(r.width)}}));
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-adult-203a.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p,true);const R={name};
  R.models=await p.$$eval('#ad201 .ad202v button',bs=>bs.map(b=>b.dataset.v));assert.deepEqual(R.models,['green','a128','r3','m72a','m72b']);   /* 2.04: 96 B left the row, the two 72 runs joined */
  await press(p,'#ad201 .ad202v [data-v="r3"]',true);
  if(fail){await p.waitForFunction(()=>AD201.error&&!AD201.pending&&$('ad201st').textContent!=='…',{timeout:15000});R.useOff=await p.$eval('#ad201use',b=>b.disabled);assert(R.useOff,'missing 96 file: use stays off');
   await press(p,'#ad201 .ad202v [data-v="green"]',true);await p.waitForFunction(()=>AD201.v==='green'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});R.otherStillWorks=true;
   await press(p,'#ad201x',true);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>AD201.v==='r3'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await sleep(300);
  R.windowHeight=await p.evaluate(()=>AD201.h.a);assert(R.windowHeight>=90&&R.windowHeight<=95,'96 model measured: '+R.windowHeight);
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});R.buttons=await bounds(p);assert(R.buttons.every(b=>b.inside&&b.h>=44),'all buttons inside and 44 px+: '+JSON.stringify(R.buttons));
  await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#ad201use',true);R.applied=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202,saved:Store.all().slots[Store.all().cur].gmAdult202}));assert.deepEqual(R.applied,{F:96,v:'r3',saved:'r3'});
  R.identical=await p.evaluate(()=>{const F=96,W=768,c=document.createElement('canvas');c.width=W;c.height=F;const g=c.getContext('2d');g.drawImage(AD201.sheets.im,0,0);const src=g.getImageData(0,0,W,F).data,st=PS.stand.getContext('2d').getImageData(0,0,W,F).data,dy=(F-2)-AD201.V.r3.foot;let same=0;
   for(let r=0;r<8;r++){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=(y*W+r*F+x)*4,sy=y-dy,a=st[o+3],w=sy>=0&&sy<F?(sy*W+r*F+x)*4:-1,wa=w<0?0:src[w+3];if(wa!==a||(a&&(src[w]!==st[o]||src[w+1]!==st[o+1]||src[w+2]!==st[o+2])))bad++}if(!bad)same++}return same});
  assert.equal(R.identical,8,'all 8 views pixel-identical to gm-adult-203a.png');
  R.label=await p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got});
  assert(R.label>=95&&R.label<=102,'name just above the 92 px head: '+R.label);
  // the zoom row: 133% shows about 270 game pixels on the owner's phone (Alabaster Dawn), 75% and 100% as before
  R.zoom={};await open(p,true);for(const z of ['1.34','1','0.75']){await press(p,`#ad201 .ad203z [data-z="${z}"]`,true);await sleep(250);R.zoom[z]=await p.evaluate(()=>({ZOOM,SC:+SC.toFixed(2),rows:Math.round(cv.height/SC),on:document.querySelector('#ad201 .ad203z button.on')?.dataset.z}))}
  assert.equal(R.zoom['1.34'].on,'1.34');assert(Number.isInteger(R.zoom['1.34'].SC),'whole screen dots per game pixel at 133%');assert(R.zoom['1.34'].SC>R.zoom['1'].SC,'133% is nearer than 100%');assert(R.zoom['1'].SC>R.zoom['0.75'].SC);
  await press(p,`#ad201 .ad203z [data-z="1.34"]`,true);await press(p,'#ad201x',true);await sleep(500);
  const cdp=await p.createCDPSession(),a0=await p.evaluate(()=>[P.x,P.y]),j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38,y:j.y,id:1}]});await sleep(450);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
  const a1=await p.evaluate(()=>[P.x,P.y]);R.walkedAt133=Math.round(Math.hypot(a1[0]-a0[0],a1[1]-a0[1]));assert(R.walkedAt133>20,'walks at 133%');
  await p.screenshot({path:path.join(out,name+'-village-133.png')});
  // players (not GM) cannot go past 100%
  R.playerMax=await p.evaluate(()=>{const g=S.gm;S.gm=0;let r;try{setZoom(1.34,true);r=ZOOM}finally{S.gm=g}setZoom(.75,true);return r});assert(R.playerMax<=1,'non-GM zoom stays at 100% or less: '+R.playerMax);
  await open(p,true);await press(p,'#ad201back',true);await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
