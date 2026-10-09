// Claude 2.05: hair · eye · coat colours on the chosen adult "72 ก" in the GM trial — real taps, only the hair/eye/coat pixels change, everything else stays as drawn, back to "as drawn".
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-205';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmAdultCol;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmAdult201');await p.waitForSelector('#ad201 .ad205c',{visible:true})}
// compare the sprite in use with the file: per class, how many pixels changed / kept
const audit=p=>p.evaluate(()=>{const R=AD205.rules.m72a,W=AD201.sheets.stand.width,H=AD201.sheets.stand.height,a=AD201.sheets.stand.getContext('2d').getImageData(0,0,W,H).data,b=PS.stand.getContext('2d').getImageData(0,0,W,H).data,r={hair:[0,0],eye:[0,0],coat:[0,0],other:[0,0]},names=['other','hair','eye','coat'];
  for(let i=0;i<a.length;i+=4){if(a[i+3]<60)continue;const k=names[ad205Class(a[i],a[i+1],a[i+2],R)],same=a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2]&&a[i+3]===b[i+3];r[k][same?1:0]++}return r});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['phone',915,412,2.625],['phone844',844,390,3],['ipad',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};
  // other models: the colour buttons are off
  await press(p,'#ad201 .ad202v [data-v="green"]');await sleep(200);R.offOnGreen=await p.$$eval('#ad201 .ad205c button',bs=>bs.every(b=>b.disabled));assert(R.offOnGreen,'colour buttons off for the green coat');
  await press(p,'#ad201 .ad202v [data-v="m72a"]');await p.waitForFunction(()=>AD201.v==='m72a'&&AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await sleep(200);
  R.onOn72=await p.$$eval('#ad201 .ad205c button',bs=>bs.every(b=>!b.disabled));assert(R.onOn72,'colour buttons on for 72 ก');
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad201 .ad202v button,#ad201 .ad203z button,#ad201 .ad205c button,#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.dataset.z||b.dataset.k||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'all buttons inside and 44 px+: '+JSON.stringify(R.buttons));
  await press(p,'#ad201use');assert.equal(await p.evaluate(()=>PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()),true,'as drawn until a colour is picked');
  // hair → 3rd colour, eyes → 2nd, coat → 2nd house (taps from "as drawn")
  await open(p);for(let i=0;i<3;i++)await press(p,'#ad201 .ad205c [data-k="h"]');for(let i=0;i<2;i++)await press(p,'#ad201 .ad205c [data-k="e"]');for(let i=0;i<2;i++)await press(p,'#ad201 .ad205c [data-k="b"]');
  R.col=await p.evaluate(()=>S.gmAdultCol);assert.deepEqual(R.col,{h:2,e:1,b:1});await p.screenshot({path:path.join(out,name+'-window.png')});await press(p,'#ad201x');
  R.audit=await audit(p);assert.equal(R.audit.other[0],0,'nothing outside hair/eyes/coat changed');assert(R.audit.hair[0]>2000&&R.audit.hair[1]<R.audit.hair[0]*.02,'hair recoloured: '+JSON.stringify(R.audit.hair));
  assert(R.audit.eye[0]>=20,'eyes recoloured: '+JSON.stringify(R.audit.eye));assert(R.audit.coat[0]>2000&&R.audit.coat[1]<R.audit.coat[0]*.02,'coat recoloured: '+JSON.stringify(R.audit.coat));
  // the coat now sits on the house's hue
  R.coatHue=await p.evaluate(()=>{const R=AD205.rules.m72a,SW=AD201.sheets.stand.width,SH=AD201.sheets.stand.height,a=AD201.sheets.stand.getContext('2d').getImageData(0,0,SW,SH).data,b=PS.stand.getContext('2d').getImageData(0,0,SW,SH).data;let n=0,ok=0;const H=HOUSES[1].h[0];
    for(let i=0;i<a.length;i+=4){if(a[i+3]<60||ad205Class(a[i],a[i+1],a[i+2],R)!==3)continue;n++;const h=hslOf(b[i]/255,b[i+1]/255,b[i+2]/255)[0];if(Math.min(Math.abs(h-H),360-Math.abs(h-H))<12)ok++}return {n,ok}});
  assert(R.coatHue.ok/R.coatHue.n>.95,'coat on the house hue: '+JSON.stringify(R.coatHue));
  // the walk sheet follows, the choice survives a reload
  R.walkPainted=await p.evaluate(()=>PS.walk!==AD201.sheets.walk);assert(R.walkPainted);
  await p.evaluate(()=>{P.x+=0;P.row=0});await sleep(400);await p.screenshot({path:path.join(out,name+'-village.png')});
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{S=Store.all().slots[Store.all().cur];startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;closeModal();goMap('h9')});
  await p.waitForFunction(()=>PS.gmSprite170&&(PS.F===72||PS.F===112)&&PS.stand!==AD201.sheets?.stand,{timeout:15000});R.reload=await p.evaluate(()=>JSON.stringify(S.gmAdultCol));assert.equal(R.reload,'{"h":2,"e":1,"b":1}');
  // back to "as drawn": hair 8 more taps, eyes 4, coat 3 (each wraps to −1)
  await open(p);for(let i=0;i<HAIR_LEFT(await p.evaluate(()=>HAIRC.length));i++)await press(p,'#ad201 .ad205c [data-k="h"]');for(let i=0;i<await p.evaluate(()=>EYEC.length)-1;i++)await press(p,'#ad201 .ad205c [data-k="e"]');for(let i=0;i<await p.evaluate(()=>HOUSES.length)-1;i++)await press(p,'#ad201 .ad205c [data-k="b"]');
  R.back=await p.evaluate(()=>S.gmAdultCol);assert.deepEqual(R.back,{h:-1,e:-1,b:-1});await press(p,'#ad201x');
  assert.equal(await p.evaluate(()=>PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()),true,'as drawn again, pixel for pixel');
  await open(p);await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
function HAIR_LEFT(n){return n-2}   // from index 2 to −1: n−3 steps to the last colour, one more wraps
