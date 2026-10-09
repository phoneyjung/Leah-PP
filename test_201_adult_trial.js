// Claude 2.01: the owner's new adult model (PixelLab 128 px, 8 standing views) as a GM-only trial at its real size — real taps, pixels untouched, save, restore, missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-201';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s,touch=false){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('farm');P.path=P.act=null;fpsChecks=6});await sleep(2500)}
async function open(p,touch){await press(p,'#gmBtn',touch);await press(p,'#gmAdult201',touch)}
const important=p=>p.evaluate(()=>JSON.stringify({kid:S.kid,age:S.age,job:S.job,lv:S.lv,coins:S.coins,inv:S.inv,eq:S.eq,appearance:S.appearance169,hcol:S.hcol,ecol:S.ecol}));
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[],errorsAll=[];let p;
 try{for(const [name,width,height,touch,fail] of [['phone',844,390,true,''],['ipad',1180,820,true,''],['pc',1366,768,false,''],['missing',812,375,true,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-adult-201.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const before=await important(p),original=await p.evaluate(()=>PS.stand.toDataURL());await open(p,touch);const R={name};
  if(fail){await p.waitForFunction(()=>AD201.error&&!AD201.pending,{timeout:15000});R.useDisabled=await p.$eval('#ad201use',b=>b.disabled);R.status=await p.$eval('#ad201st',e=>e.textContent);
   assert(R.useDisabled,'missing file: the use button stays off');assert(/โหลดภาพไม่ได้|unavailable/.test(R.status),'missing file says so');
   await press(p,'#ad201x',touch);await p.evaluate(()=>{S.gmSprite170='adult201';buildPlayerSheets()});await sleep(600);R.sameCharacter=await p.evaluate(()=>PS.stand.toDataURL())===original;assert(R.sameCharacter,'missing file: the character stays');
   R.playable=await p.evaluate(async()=>{const a=P.x;P.path=null;keys.ArrowRight=1;await new Promise(r=>setTimeout(r,500));keys.ArrowRight=0;return Math.round(P.x-a)});assert(R.playable>20,'still walks');
   await p.evaluate(()=>{delete S.gmSprite170;save()});assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>AD201.sheets&&!$('ad201use').disabled,{timeout:15000});await sleep(300);
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'trial buttons inside the screen and 44 px+: '+JSON.stringify(R.buttons));
  R.heights=await p.evaluate(()=>({kid:AD201.h.k,adult:AD201.h.a}));assert(R.heights.kid>=50&&R.heights.kid<=64,'child height measured');assert(R.heights.adult>=85&&R.heights.adult<=92,'adult height measured (file 88–91 px)');
  R.ratio=+(R.heights.adult/R.heights.kid).toFixed(2);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'opening the window changes nothing');
  await p.screenshot({path:path.join(out,name+'-window.png')});await press(p,'#ad201x',touch);assert(await p.evaluate(()=>!S.gmSprite170));
  await open(p,touch);await p.waitForFunction(()=>!$('ad201use').disabled);await press(p,'#ad201use',touch);
  R.applied=await p.evaluate(()=>({ps:PS.gmSprite170,s:S.gmSprite170,saved:Store.all().slots[Store.all().cur].gmSprite170,F:PS.F}));assert.deepEqual(R.applied,{ps:true,s:'adult201',saved:'adult201',F:128});
  assert.equal(await important(p),before,'job, bag, money and look untouched');
  // the art itself: 8 standing views and 48 walk frames drawn, every pixel equal to the file, feet on the game's foot line
  R.art=await p.evaluate(()=>{const F=128,im=AD201.sheets.im,c=document.createElement('canvas');c.width=1024;c.height=128;const g=c.getContext('2d');g.drawImage(im,0,0);const src=g.getImageData(0,0,1024,128).data;
   const st=PS.stand.getContext('2d').getImageData(0,0,1024,128).data,dy=(F-2)-AD201.foot;let same=0,feet=[],walkFull=0;
   for(let r=0;r<8;r++){let bad=0,last=-1;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const sy=y-dy,o=(y*1024+r*F+x)*4;const a=st[o+3];if(a>80)last=y;
     const want=sy>=0&&sy<F?[src[(sy*1024+r*F+x)*4],src[(sy*1024+r*F+x)*4+1],src[(sy*1024+r*F+x)*4+2],src[(sy*1024+r*F+x)*4+3]]:[0,0,0,0];
     if(want[3]!==a||(a&&(want[0]!==st[o]||want[1]!==st[o+1]||want[2]!==st[o+2])))bad++}if(!bad)same++;feet.push(last)}
   const w=PS.walk.getContext('2d');for(let r=0;r<8;r++)for(let f=0;f<6;f++){const d=w.getImageData(f*F,r*F,F,F).data;let n=0;for(let j=3;j<d.length;j+=4)if(d[j]>80)n++;if(n>300)walkFull++}
   return {identical:same,feet,walkFull}});
  assert.equal(R.art.identical,8,'all 8 views pixel-identical to the file');assert(R.art.feet.every(y=>y>=123&&y<=127),'feet on the foot line: '+R.art.feet);assert.equal(R.art.walkFull,48);
  // walk the 8 ways with the real stick (or keys) and see every view drawn
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;window.draw201=[];const old=ctx.drawImage;ctx.drawImage=function(im,...a){if(im===PS.walk&&a.length>=8)draw201.push([a[0]/128,a[1]/128]);return old.call(this,im,...a)}});
  const poses=[['ArrowDown'],['ArrowDown','ArrowRight'],['ArrowRight'],['ArrowUp','ArrowRight'],['ArrowUp'],['ArrowUp','ArrowLeft'],['ArrowLeft'],['ArrowDown','ArrowLeft']],vec=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];R.walked=[];const cdp=touch?await p.createCDPSession():null;
  for(let i=0;i<8;i++){const a=await p.evaluate(()=>[P.x,P.y]);if(touch){const j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});const [x,y]=vec[i],n=Math.hypot(x,y);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]})}
    else for(const k of poses[i])await p.keyboard.down(k);await sleep(450);if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else for(const k of poses[i])await p.keyboard.up(k);await sleep(120);
    const z=await p.evaluate(()=>[P.x,P.y]);R.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}
  R.rows=await p.evaluate(()=>[...new Set(draw201.map(x=>x[1]))].sort());assert.equal(R.rows.length,8,'all 8 directions drawn: '+R.rows);assert(R.walked.every(d=>d>20),'walks every way: '+R.walked);
  await p.evaluate(()=>{gmGhost(false);P.row=0;P.path=null;P.moving=false;GM.hour=12});
  // beside the people of the village: the size the owner will judge
  const npc=await p.evaluate(async()=>{goMap('h9');await new Promise(r=>setTimeout(r,1500));closeModal();DLG=null;PAUSE=false;const n=(M.npcs||[])[0];if(!n)return null;P.x=n.x+34;P.y=n.y+4;P.path=P.act=null;P.row=6;return {name:n.name||n.id||'npc',x:n.x,y:n.y}});
  await sleep(700);R.village=npc;await p.screenshot({path:path.join(out,name+'-village.png')});
  // saved: a reload keeps it; restore brings the slot's own character back
  await p.reload({waitUntil:'load'});await enter(p);await p.waitForFunction(()=>PS.gmSprite170&&PS.F===128,{timeout:15000});R.reload=true;
  await open(p,touch);await press(p,'#ad201back',touch);await sleep(300);R.restored=await p.evaluate(()=>!S.gmSprite170&&!Store.all().slots[Store.all().cur].gmSprite170&&PS.F!==128);assert(R.restored,'back to the own character');
  assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'the very same pictures as before');assert.equal(await important(p),before);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
