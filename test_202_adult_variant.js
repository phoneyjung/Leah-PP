// Claude 2.02: the GM adult trial with two models (green coat 88 px · run 1 green hair 121 px) — real taps, pixels untouched, saved choice, missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-202';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s,touch=false){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p,touch){await press(p,'#gmBtn',touch);await press(p,'#gmAdult201',touch);await p.waitForSelector('#ad201 .ad202v',{visible:true})}
const height=(p,which)=>p.evaluate(w=>{const c=w==='file'?(()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;c.getContext('2d').drawImage(AD201.sheets.im,0,0);return c})():PS.stand;
  return [0,1,2,3,4,5,6,7].map(col=>{const d=c.getContext('2d').getImageData(col*128,0,128,128).data;let top=-1,bot=-1;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(d[(y*128+x)*4+3]>80){if(top<0)top=y;bot=y;break}return [top,bot,bot-top+1]})},which);
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height0,touch,fail] of [['phone',915,412,true,''],['ipad',1180,820,true,''],['missing',844,390,true,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height:height0,isMobile:touch,hasTouch:touch});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-adult-202a.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p,touch);const R={name};
  R.startOn=await p.$eval('#ad201 .ad202v button.on',b=>b.dataset.v);assert.equal(R.startOn,'green','the trial opens on the green coat');
  await press(p,'#ad201 .ad202v [data-v="a128"]',touch);
  if(fail){await p.waitForFunction(()=>AD201.error&&!AD201.pending&&$('ad201st').textContent!=='…',{timeout:15000});R.useOff=await p.$eval('#ad201use',b=>b.disabled);R.status=await p.$eval('#ad201st',e=>e.textContent);
   assert(R.useOff,'missing run-1 file: the use button stays off');assert(/โหลดภาพไม่ได้|unavailable/.test(R.status));
   await press(p,'#ad201 .ad202v [data-v="green"]',touch);await p.waitForFunction(()=>AD201.sheets&&!$('ad201use').disabled,{timeout:15000});R.greenStillWorks=true;
   await press(p,'#ad201x',touch);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>AD201.v==='a128'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await sleep(300);
  R.on=await p.$eval('#ad201 .ad202v button.on',b=>b.dataset.v);assert.equal(R.on,'a128');
  R.windowHeight=await p.evaluate(()=>AD201.h.a);assert(R.windowHeight>=116&&R.windowHeight<=124,'run 1 measured in the window: '+R.windowHeight);
  R.buttons=await p.$$eval('#ad201 .ad202v button,#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'buttons inside and 44 px+: '+JSON.stringify(R.buttons));await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#ad201use',touch);R.applied=await p.evaluate(()=>({F:PS.F,ps:PS.gmSprite170,v:S.gmAdult202,saved:Store.all().slots[Store.all().cur].gmAdult202}));assert.deepEqual(R.applied,{F:128,ps:true,v:'a128',saved:'a128'});
  // pixels: every view equals the file moved down by its foot offset (1 px)
  R.identical=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const g=c.getContext('2d');g.drawImage(AD201.sheets.im,0,0);const src=g.getImageData(0,0,1024,128).data,st=PS.stand.getContext('2d').getImageData(0,0,1024,128).data,dy=126-AD201.V.a128.foot;let same=0;
   for(let r=0;r<8;r++){let bad=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const o=(y*1024+r*128+x)*4,sy=y-dy,a=st[o+3],w=sy>=0&&sy<128?(sy*1024+r*128+x)*4:-1,wa=w<0?0:src[w+3];if(wa!==a||(a&&(src[w]!==st[o]||src[w+1]!==st[o+1]||src[w+2]!==st[o+2])))bad++}if(!bad)same++}return same});
  assert.equal(R.identical,8,'all 8 views pixel-identical to gm-adult-202a.png');
  R.feet=(await height(p,'stand')).map(h=>h[1]);assert(R.feet.every(y=>y>=123&&y<=127),'feet on the foot line: '+R.feet);
  R.tall=(await height(p,'stand')).map(h=>h[2]);assert(R.tall.every(h=>h>=115&&h<=125),'121 px tall: '+R.tall);
  // the name sits just above this taller head (no 2.01 lift)
  R.label=await p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got});
  assert(R.label>=126&&R.label<=134,'name above the head: '+R.label);
  // walk two ways with the real stick
  const cdp=touch?await p.createCDPSession():null;R.walked=[];for(const [x,y] of [[1,0],[-1,0]]){const a=await p.evaluate(()=>[P.x,P.y]);const j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x,y:j.y+38*y,id:1}]});await sleep(450);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(120);
   const z=await p.evaluate(()=>[P.x,P.y]);R.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}assert(R.walked.every(d=>d>20),'walks: '+R.walked);
  await p.screenshot({path:path.join(out,name+'-village.png')});
  // the choice is saved: a reload walks with run 1 again
  await p.reload({waitUntil:'load'});await enter(p);await p.waitForFunction(()=>PS.gmSprite170&&PS.F===128&&AD201.v==='a128',{timeout:15000});R.reload=true;
  // back to the green coat, then back to the own character
  await open(p,touch);await press(p,'#ad201 .ad202v [data-v="green"]',touch);await p.waitForFunction(()=>AD201.v==='green'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await press(p,'#ad201use',touch);
  R.green=await p.evaluate(()=>({v:S.gmAdult202,tall:(()=>{const d=PS.stand.getContext('2d').getImageData(0,0,128,128).data;let top=-1,bot=-1;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(d[(y*128+x)*4+3]>80){if(top<0)top=y;bot=y;break}return bot-top+1})()}));
  assert.equal(R.green.v,'green');assert(R.green.tall>=86&&R.green.tall<=92,'green coat 88 px: '+R.green.tall);
  await open(p,touch);await press(p,'#ad201back',touch);await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'own character back, same pictures');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
