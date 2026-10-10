// Claude 2.14 (owner 10 Oct 11:31, PixelLab "Walking (6 frames)" GIFs, 5 directions): woman 1 (cf1), boy 2 (cb2) and girl 3 (cg3) walk for real in the GM trial
// real taps on the owner's phone sizes · every standing and walking frame is the file's own frame, only placed (W NW SW mirrored) · every row's feet on the foot line ·
// woman 1's W NW SW are her own (gm-c214-f1-west.png; without it, the mirror) · the 8 rows and 6 frames are drawn while walking with the real stick · the name just over the head · a missing walk file leaves the standing glide working
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-walks-214';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
const WHO={cf1:{C:112,S:72,label:[70,80],mir:'00000000'},cb2:{C:96,S:64,label:[60,70],mir:'00000111'},cg3:{C:96,S:64,label:[60,70],mir:'00000111'}};   // woman 1 has her own NW W SW (gm-c214-f1-west.png)
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmStageC207');await p.waitForSelector('#ad207 .ad207g',{visible:true})}
const check=(p,C,S)=>p.evaluate((F,S)=>{const sh=AD201.sheets,id=c=>c.getContext('2d').getImageData(0,0,c.width,c.height),st=id(sh.stand),wk=id(sh.walk),si=id(toCanvas(sh.im)),wi=id(toCanvas(sh.wim)),ww=sh.west?id(toCanvas(sh.west)):null;
  const px=(img,x,y)=>{if(x<0||y<0||x>=img.width||y>=img.height)return [0,0,0,0];const i=(y*img.width+x)*4;return [img.data[i],img.data[i+1],img.data[i+2],img.data[i+3]]},eq=(a,b)=>a[3]<1&&b[3]<1||a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3];
  let standOk=0,walkOk=0;const feet=[];
  for(const o of sh.off){let bad=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const xm=o.mir?F-1-x:x,sx=xm-o.sdx,sy=y-o.sdy,want=sx>=0&&sx<S&&sy>=0&&sy<S?px(si,(o.sc!=null?o.sc:o.wr)*S+sx,sy):[0,0,0,0];if(!eq(px(st,o.r*F+x,y),want))bad++}if(!bad)standOk++;
   let rowFoot=-1;for(let f=0;f<6;f++){let b2=0;for(let y=0;y<F;y++)for(let x=0;x<F;x++){const xm=o.mir?F-1-x:x,sy=y-o.wdy,want=sy>=0&&sy<F?px(o.real?ww:wi,f*F+xm,o.wr*F+sy):[0,0,0,0],got=px(wk,f*F+x,o.r*F+y);if(!eq(got,want))b2++;if(got[3]>80)rowFoot=Math.max(rowFoot,y)}if(!b2)walkOk++}feet.push(rowFoot)}
  return {standOk,walkOk,feet,mir:sh.off.map(o=>o.mir?1:0).join('')}},C,S);
const label=p=>p.evaluate(async()=>{let got=null;const o=label;label=function(x,y,s,c){if(s&&String(s).includes(S.name))got=Math.round(P.y-camY-y);return o.apply(this,arguments)};await new Promise(r=>setTimeout(r,300));label=o;return got-ad201Lift()});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['nowalk',844,390,3,'nowalk'],['nowest',844,390,3,'nowest']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes(fail==='nowalk'?'gm-c214-b2-walk.png':'gm-c214-f1-west.png')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());const R={name};
  if(fail==='nowalk'){await open(p);await press(p,'#ad207 .ad207g [data-v="cb2"]');await p.waitForFunction(()=>AD201.v==='cb2'&&AD201.sheets&&!$('ad207use').disabled,{timeout:20000});await sleep(500);
   R.state=await p.evaluate(()=>({walkReal:!!AD201.sheets.walkReal,F:ad201F(),failed:!!(AD214.cb2&&AD214.cb2.failed)}));assert.deepEqual(R.state,{walkReal:false,F:64,failed:true},'no walk file: boy 2 still stands and glides');
   await press(p,'#ad207use');R.used=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202}));assert.deepEqual(R.used,{F:64,v:'cb2'});
   await open(p);await press(p,'#ad207 .ad207g [data-v="cg3"]');await p.waitForFunction(()=>AD201.v==='cg3'&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad207use').disabled,{timeout:20000});R.otherWalks=true;
   await press(p,'#ad207back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  for(const [k,W] of Object.entries(WHO)){if(fail==='nowest'&&k!=='cf1')continue;const r={};
   await open(p);await press(p,`#ad207 .ad207g [data-v="${k}"]`);await p.waitForFunction(k=>AD201.v===k&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad207use').disabled,{timeout:20000},k);
   r.sheet=await p.evaluate(()=>({F:AD201.sheets.F,stand:[AD201.sheets.stand.width,AD201.sheets.stand.height],walk:[AD201.sheets.walk.width,AD201.sheets.walk.height]}));
   assert.deepEqual(r.sheet,{F:W.C,stand:[8*W.C,W.C],walk:[6*W.C,8*W.C]},k+' sheet');
   r.check=await check(p,W.C,W.S);assert.equal(r.check.standOk,8,k+' 8 standing frames as drawn');assert.equal(r.check.walkOk,48,k+' 48 walking frames as drawn');
   assert(r.check.feet.every(y=>y===W.C-2),k+' feet on the foot line: '+r.check.feet);assert.equal(r.check.mir,(fail==='nowest'&&k==='cf1')?'00000111':W.mir,k+' mirrored rows (W NW SW mirrored unless real)');
   await press(p,'#ad207use');r.used=await p.evaluate(()=>({F:PS.F,v:S.gmAdult202}));assert.deepEqual(r.used,{F:W.C,v:k});
   r.label=await label(p);assert(r.label>=W.label[0]&&r.label<=W.label[1],k+' name just over the head: '+r.label);
   // the 8 ways with the real stick: every row and frame drawn, every push moves
   await p.evaluate(C=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;window.d214=[];const o=ctx.drawImage;window.d214o=o;ctx.drawImage=function(im,...a){if(im===PS.walk&&a.length>=8)d214.push([a[0]/C,a[1]/C]);return o.call(this,im,...a)}},W.C);
   const cdp=await p.createCDPSession(),vec=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];r.walked=[];
   for(const [x,y] of vec){const a=await p.evaluate(()=>[P.x,P.y]),j=await p.$eval('#joy',e=>{const b=e.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}}),n=Math.hypot(x,y);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]});await sleep(700);
    if(x===1&&y===0&&name==='phone844')await p.screenshot({path:path.join(out,name+'-'+k+'-walking.png')});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);const z=await p.evaluate(()=>[P.x,P.y]);r.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}
   r.drawn=await p.evaluate(()=>{ctx.drawImage=d214o;return {rows:[...new Set(d214.map(d=>d[1]))].length,frames:[...new Set(d214.map(d=>d[0]))].length}});
   assert.deepEqual(r.drawn,{rows:8,frames:6},k+' rows and frames drawn');assert(r.walked.every(d=>d>20),k+' walks every way: '+r.walked);await p.evaluate(()=>gmGhost(false));
   r.nearLeah=await p.evaluate(()=>{const n=(M.npcs||[]).find(n=>/leah/.test(n.img||''));if(n){P.x=n.x+30;P.y=n.y+2;P.row=6}P.path=null;return !!n});await sleep(800);await p.screenshot({path:path.join(out,name+'-'+k+'-leah.png')});
   R[k]={walked:r.walked,label:r.label,feet:r.check.feet[0]}}
  await open(p);await press(p,'#ad207back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'back to the own character');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
