// Claude 2.20: GM trial · a ready-made character from a picture file kept on this device (never uploaded, never in the save).
// Real taps/clicks on the GM button, the real file chooser, the stick/keys; pixels equal to the file; reload keeps it; restore and delete bring the slot's own character back;
// a wrong-size file, a browser that refuses storage, and no file at all never break the game. The sheets are drawn by the test itself (no outside art in the repo).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-local-220';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s,touch=false){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('farm');P.path=P.act=null;fpsChecks=6});await sleep(2500)}
async function open(p,touch){await press(p,'#gmBtn',touch);await press(p,'#gmLocal220',touch);await p.waitForSelector('#lc220',{visible:true})}
const important=p=>p.evaluate(()=>JSON.stringify({kid:S.kid,age:S.age,job:S.job,lv:S.lv,coins:S.coins,inv:S.inv,eq:S.eq,appearance:S.appearance169,hcol:S.hcol,ecol:S.ecol,pd:S.pd219}));
// a test sheet: 7 columns × 8 rows of F px, one colour per direction, the walk frames marked by a stripe, feet on row F-2
async function makeSheet(p,file,F,hue,ok=true){const b64=await p.evaluate((F,hue,ok)=>{const c=document.createElement('canvas');c.width=ok?7*F:300;c.height=ok?8*F:200;const g=c.getContext('2d');
  if(ok)for(let r=0;r<8;r++)for(let col=0;col<7;col++){const x=col*F+F/2,y=r*F+F-1;   /* lowest painted row = F-2 */g.fillStyle=`hsl(${hue+r*40},70%,55%)`;g.fillRect(x-14,y-60,28,60);g.fillStyle='#ffe0c0';g.fillRect(x-12,y-72,24,14);g.fillStyle='#202020';g.fillRect(x-14+col*3,y-40,4,20)}
  else{g.fillStyle='#c33';g.fillRect(0,0,300,200)}return c.toDataURL('image/png').split(',')[1]},F,hue,ok);const fp=path.join(out,file);fs.writeFileSync(fp,Buffer.from(b64,'base64'));return fp}
async function pick(p,touch,files){const [ch]=await Promise.all([p.waitForFileChooser({timeout:8000}),(async()=>{await p.waitForSelector('#lc220pick',{visible:true});touch?await p.tap('#lc220pick'):await p.click('#lc220pick')})()]);await ch.accept(files);await sleep(900)}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[],errorsAll=[];let p;
 try{for(const [name,width,height,touch,mode] of [['phone',844,390,true,''],['ipad',1180,820,true,''],['pc',1366,768,false,''],['nostore',812,375,true,'nostore'],['nofile',844,390,true,'nofile']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});
  if(mode==='nostore')await p.evaluateOnNewDocument(()=>{try{Object.defineProperty(window,'indexedDB',{get(){throw Error('blocked by the test')}})}catch(e){}});
  await p.goto(url,{waitUntil:'load'});await enter(p);const before=await important(p),original=await p.evaluate(()=>PS.stand.toDataURL());const R={name};
  const good=await makeSheet(p,'trial-a.png',80,10),good2=await makeSheet(p,'trial-b.png',96,200),bad=await makeSheet(p,'wrong-size.png',80,0,false);
  await open(p,touch);
  if(mode==='nofile'){R.status=await p.$eval('#lc220st',e=>e.textContent);R.useOff=await p.$eval('#lc220use',b=>b.disabled);assert(R.useOff,'nothing to use yet');assert(/ยังไม่มีไฟล์|No file/.test(R.status),'says to pick a file');
   await pick(p,touch,[bad]);R.badStatus=await p.$eval('#lc220st',e=>e.textContent);assert(/wrong-size\.png/.test(R.badStatus)&&/ใช้ไม่ได้|Not usable/.test(R.badStatus),'a wrong file is named and refused: '+R.badStatus);
   assert(await p.$eval('#lc220use',b=>b.disabled),'still nothing to use');await press(p,'#lc220x',touch);
   await p.evaluate(()=>{S.gmSprite170='local220';S.gmLocal220='gone.png';buildPlayerSheets()});await sleep(800);R.sameCharacter=await p.evaluate(()=>PS.stand.toDataURL())===original&&!(await p.evaluate(()=>PS.local220));assert(R.sameCharacter,'a missing file keeps the own character');
   R.playable=await p.evaluate(async()=>{const a=P.x;P.path=null;keys.ArrowRight=1;await new Promise(r=>setTimeout(r,500));keys.ArrowRight=0;return Math.round(P.x-a)});assert(R.playable>20,'still walks');
   await p.evaluate(()=>{delete S.gmSprite170;delete S.gmLocal220;save()});assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await pick(p,touch,[good,good2,bad]);
  R.options=await p.$$eval('#lc220list .lc220opt',bs=>bs.map(b=>b.dataset.n));assert.deepEqual(R.options.sort(),['trial-a.png','trial-b.png'],'the two good files are offered');
  R.status=await p.$eval('#lc220st',e=>e.textContent);assert(/wrong-size\.png/.test(R.status),'the wrong file is named');
  if(mode==='nostore')assert(await p.evaluate(()=>!!LC220.mem),'kept in memory when storage is refused');
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  await press(p,'#lc220list .lc220opt[data-n="trial-a.png"]',touch);
  R.buttons=await p.$$eval('#lc220use,#lc220back,#lc220del,#lc220x,#lc220pick',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.every(b=>b.inside&&b.h>=44),'buttons inside the screen and 44 px+: '+JSON.stringify(R.buttons));
  assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'opening the window changes nothing');await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#lc220use',touch);
  R.applied=await p.evaluate(()=>({ps:PS.local220,s:S.gmSprite170,n:S.gmLocal220,saved:Store.all().slots[Store.all().cur].gmLocal220,F:PS.F}));assert.deepEqual(R.applied,{ps:true,s:'local220',n:'trial-a.png',saved:'trial-a.png',F:80});
  assert.equal(await important(p),before,'job, bag, money and look untouched');
  R.saveHasNoPicture=await p.evaluate(()=>!/data:image|blob:/.test(localStorage.getItem('leahpp2d-slots')||''));assert(R.saveHasNoPicture,'the picture is not in the save');
  // the art itself: 8 standing views and 48 walk frames equal to the file, feet on the foot line
  R.art=await p.evaluate(async src=>{const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src});const F=80,c=document.createElement('canvas');c.width=7*F;c.height=8*F;const g=c.getContext('2d');g.drawImage(im,0,0);const s=g.getImageData(0,0,7*F,8*F).data;
   const st=PS.stand.getContext('2d').getImageData(0,0,8*F,F).data,wk=PS.walk.getContext('2d').getImageData(0,0,6*F,8*F).data;let stand=0,walk=0,feet=[];
   for(let r=0;r<8;r++){let bad=0,last=-1;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=(y*8*F+r*F+x)*4,q=((r*F+y)*7*F+x)*4;if(st[o+3]>80)last=y;for(let k=0;k<4;k++)if(st[o+k]!==s[q+k])bad++}if(!bad)stand++;feet.push(last)}
   for(let r=0;r<8;r++)for(let f=0;f<6;f++){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const o=((r*F+y)*6*F+f*F+x)*4,q=((r*F+y)*7*F+F+f*F+x)*4;for(let k=0;k<4;k++)if(wk[o+k]!==s[q+k])bad++}if(!bad)walk++}
   return{stand,walk,feet}},'data:image/png;base64,'+fs.readFileSync(good).toString('base64'));
  assert.equal(R.art.stand,8,'8 standing views identical to the file');assert.equal(R.art.walk,48,'48 walk frames identical to the file');assert(R.art.feet.every(y=>y===78),'feet on row F-2: '+R.art.feet);
  // walk the 8 ways with the real stick (or keys) and see every direction drawn from the new sheet
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;window.draw220=[];const old=ctx.drawImage;ctx.drawImage=function(im,...a){if(im===PS.walk&&a.length>=8)draw220.push([a[0]/PS.F,a[1]/PS.F]);return old.call(this,im,...a)}});
  const poses=[['ArrowDown'],['ArrowDown','ArrowRight'],['ArrowRight'],['ArrowUp','ArrowRight'],['ArrowUp'],['ArrowUp','ArrowLeft'],['ArrowLeft'],['ArrowDown','ArrowLeft']],vec=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];R.walked=[];const cdp=touch?await p.createCDPSession():null;
  for(let i=0;i<8;i++){const a=await p.evaluate(()=>[P.x,P.y]);if(touch){const j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});const [x,y]=vec[i],n=Math.hypot(x,y);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]})}
    else for(const k of poses[i])await p.keyboard.down(k);await sleep(450);if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else for(const k of poses[i])await p.keyboard.up(k);await sleep(120);
    const z=await p.evaluate(()=>[P.x,P.y]);R.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}
  R.rows=await p.evaluate(()=>[...new Set(draw220.map(x=>x[1]))].sort());R.frames=await p.evaluate(()=>[...new Set(draw220.map(x=>x[0]))].length);
  assert.equal(R.rows.length,8,'all 8 directions drawn: '+R.rows);assert(R.frames>=4,'walk frames advance: '+R.frames);assert(R.walked.every(d=>d>20),'walks every way: '+R.walked);
  await p.evaluate(()=>{gmGhost(false);P.row=0;P.path=null;P.moving=false;GM.hour=12});
  R.label=await p.evaluate(()=>{let got=null;const o=label;label=function(x,y,s,c){if(Math.abs(x-(P.x-camX))<.5)got=(P.y-camY)-y;return o.apply(this,arguments)};return new Promise(r=>setTimeout(()=>{label=o;r(got)},300))});
  assert(R.label>=70&&R.label<=84,'the name sits just above the head: '+R.label);
  const npc=await p.evaluate(async()=>{goMap('h9');await new Promise(r=>setTimeout(r,1500));closeModal();DLG=null;PAUSE=false;const n=(M.npcs||[])[0];if(!n)return null;P.x=n.x+34;P.y=n.y+4;P.path=P.act=null;P.row=6;return {x:n.x,y:n.y}});
  await sleep(700);R.village=!!npc;await p.screenshot({path:path.join(out,name+'-village.png')});
  // reload: kept on this device (or, when the browser refused to keep it, the own character comes back and the game plays)
  await p.reload({waitUntil:'load'});await enter(p);
  if(mode==='nostore'){await sleep(1500);R.afterReload=await p.evaluate(()=>({local:!!PS.local220}));assert.equal(R.afterReload.local,false,'nothing kept → own character');assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
   R.playable=await p.evaluate(async()=>{const a=P.x;P.path=null;keys.ArrowRight=1;await new Promise(r=>setTimeout(r,500));keys.ArrowRight=0;return Math.round(P.x-a)});assert(R.playable>20,'still walks');
   await p.evaluate(()=>{delete S.gmSprite170;delete S.gmLocal220;save()})}
  else{await p.waitForFunction(()=>PS.local220&&PS.F===80,{timeout:15000});R.reload=true;
   await open(p,touch);R.optionsAfterReload=(await p.$$eval('#lc220list .lc220opt',bs=>bs.map(b=>b.dataset.n))).sort();assert.deepEqual(R.optionsAfterReload,['trial-a.png','trial-b.png'],'both files still on this device');
   if(name==='pc'){await press(p,'#lc220del',touch);await sleep(500);R.deleted=await p.evaluate(()=>({opts:document.querySelectorAll('#lc220list .lc220opt').length,s:!!S.gmSprite170,local:!!PS.local220}));assert.deepEqual(R.deleted,{opts:0,s:false,local:false},'delete removes the files and brings the own character back');await press(p,'#lc220x',touch)}
   else{await press(p,'#lc220back',touch);await sleep(300);R.restored=await p.evaluate(()=>!S.gmSprite170&&!S.gmLocal220&&!Store.all().slots[Store.all().cur].gmSprite170&&!PS.local220);assert(R.restored,'back to the own character')}
   assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'the very same pictures as before');assert.equal(await important(p),before)}
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
