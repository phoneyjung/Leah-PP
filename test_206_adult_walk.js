// Claude 2.06 (+2.07 real west row): the chosen adult "72 ก" walks with the owner's PixelLab walk (5 rows + 3 mirrored) — real stick, pixels untouched, feet on the line, colours on the walk, missing walk file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-adult-206';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmAdultCol;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmAdult201');await p.waitForSelector('#ad201 .ad202v',{visible:true})}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['ipad',1180,820,2,''],['nowalk',844,390,3,'nowalk'],['nowest',844,390,3,'nowest']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){const block=fail==='nowalk'?'gm-adult-206w.png':'gm-adult-207w.png';await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes(block)?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};
  await press(p,'#ad201 .ad202v [data-v="m72a"]');await p.waitForFunction(()=>AD201.v==='m72a'&&AD201.sheets&&!$('ad201use').disabled,{timeout:20000});await sleep(300);
  if(fail==='nowalk'){R.state=await p.evaluate(()=>({walkReal:!!AD201.sheets.walkReal,F:ad201F(),failed:AD206.failed}));assert.deepEqual(R.state,{walkReal:false,F:72,failed:true},'no walk file: the 72 standing model still works');
   await press(p,'#ad201use');R.used=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202}));assert.deepEqual(R.used,{F:72,v:'m72a'});
   await open(p);await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  R.sheet=await p.evaluate(()=>({walkReal:AD201.sheets.walkReal,F:AD201.sheets.F,stand:[AD201.sheets.stand.width,AD201.sheets.stand.height],walk:[AD201.sheets.walk.width,AD201.sheets.walk.height]}));
  assert.deepEqual(R.sheet,{walkReal:true,F:112,stand:[896,112],walk:[672,896]});
  await press(p,'#ad201use');assert.equal(await p.evaluate(()=>PS.F),112);
  // pixels: every standing and walking frame is the file's own frame, only placed (and mirrored for W · NW · SW)
  R.check=await p.evaluate(()=>{const sh=AD201.sheets,F=112,S72=72,id=c=>c.getContext('2d').getImageData(0,0,c.width,c.height),st=id(sh.stand),wk=id(sh.walk),si=id(toCanvas(sh.im)),wi=id(toCanvas(sh.wim)),ww=sh.west?id(toCanvas(sh.west)):null;
   const px=(img,x,y)=>{if(x<0||y<0||x>=img.width||y>=img.height)return [0,0,0,0];const i=(y*img.width+x)*4;return [img.data[i],img.data[i+1],img.data[i+2],img.data[i+3]]},eq=(a,b)=>a[3]<1&&b[3]<1||a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3];
   let standOk=0,walkOk=0;const feet=[],heads=[];
   for(const o of sh.off){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const xm=o.mir?F-1-x:x,sx=xm-o.sdx,sy=y-o.sdy,want=sx>=0&&sx<S72&&sy>=0&&sy<S72?px(si,(o.sc!=null?o.sc:o.wr)*S72+sx,sy):[0,0,0,0];if(!eq(px(st,o.r*F+x,y),want))bad++}if(!bad)standOk++;
    let rowFoot=-1;for(let f=0;f<6;f++){let b2=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const xm=o.mir?F-1-x:x,sy=y-o.wdy,want=sy>=0&&sy<F?px(o.real?ww:wi,f*F+xm,(o.real?0:o.wr)*F+sy):[0,0,0,0],got=px(wk,f*F+x,o.r*F+y);if(!eq(got,want))b2++;if(got[3]>80)rowFoot=Math.max(rowFoot,y)}if(!b2)walkOk++}feet.push(rowFoot)}
   return {standOk,walkOk,feet,real:sh.off.map(o=>!!o.real),mir:sh.off.map(o=>!!o.mir)}});
  assert.equal(R.check.standOk,8,'8 standing frames as drawn');assert.equal(R.check.walkOk,48,'48 walking frames as drawn');assert(R.check.feet.every(y=>y===110),'feet on the foot line: '+R.check.feet);
  /* 2.07: the west row is the owner's own west walk (and the file's own standing west frame); without that file it is the 2.06 mirror */
  assert.deepEqual(R.check.real,(fail==='nowest'?[0,0,0,0,0,0,0,0]:[0,0,0,0,0,0,1,0]).map(Boolean),'real rows: '+R.check.real);assert.deepEqual(R.check.mir,fail==='nowest'?[0,0,0,0,0,1,1,1].map(Boolean):[0,0,0,0,0,1,0,1].map(Boolean),'mirrored rows: '+R.check.mir);
  R.label=await p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got-ad201Lift()});   /* this hook sits outside the lift wrapper, so the lift is taken off here */
  assert(R.label>=70&&R.label<=80,'name just above the head: '+R.label);
  // walk the 8 ways with the real stick: every row and every frame of the walk is drawn
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;window.d206=[];const o=ctx.drawImage;ctx.drawImage=function(im,...a){if(im===PS.walk&&a.length>=8)d206.push([a[0]/112,a[1]/112]);return o.call(this,im,...a)}});
  const cdp=await p.createCDPSession(),vec=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];R.walked=[];
  for(const [x,y] of vec){const a=await p.evaluate(()=>[P.x,P.y]),j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}),n=Math.hypot(x,y);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]});await sleep(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
   const z=await p.evaluate(()=>[P.x,P.y]);R.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}
  R.drawn=await p.evaluate(()=>({rows:[...new Set(d206.map(d=>d[1]))].sort(),frames:[...new Set(d206.map(d=>d[0]))].sort()}));
  assert.equal(R.drawn.rows.length,8,'8 rows drawn: '+R.drawn.rows);assert.equal(R.drawn.frames.length,6,'6 frames drawn: '+R.drawn.frames);assert(R.walked.every(d=>d>20),'walks every way: '+R.walked)   /* distance depends on how busy the machine is (37 px once under a full parallel run); this checks every push moves */;
  await p.evaluate(()=>gmGhost(false));
  // the 2.05 colours on the walk: only hair · eyes · coat pixels change
  await open(p);for(let i=0;i<3;i++)await press(p,'#ad201 .ad205c [data-k="h"]');for(let i=0;i<2;i++)await press(p,'#ad201 .ad205c [data-k="b"]');await press(p,'#ad201x');
  R.walkColour=await p.evaluate(()=>{const R=AD205.rules.m72a,a=AD201.sheets.walk.getContext('2d').getImageData(0,0,672,896).data,b=PS.walk.getContext('2d').getImageData(0,0,672,896).data;let other=0,cls=0,changed=0;
   for(let i=0;i<a.length;i+=4){if(a[i+3]<60)continue;const k=ad205Class(a[i],a[i+1],a[i+2],R),same=a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2];if(!k){if(!same)other++}else{cls++;if(!same)changed++}}return {other,cls,changed}});
  assert.equal(R.walkColour.other,0,'nothing else on the walk changes');assert(R.walkColour.changed>R.walkColour.cls*.9,'hair and coat on the walk recoloured: '+JSON.stringify(R.walkColour));
  await p.evaluate(()=>{P.x=1318;P.y=1250;P.row=2;P.path=null});await sleep(500);await p.screenshot({path:path.join(out,name+'-village.png')});
  await open(p);await p.screenshot({path:path.join(out,name+'-window.png')});await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
