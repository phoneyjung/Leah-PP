// Claude 2.15 (Codex set 04 f1, owner passed 10 Oct): colour buttons for woman 1 (cf1) in the GM "new characters" window — real taps, owner's phone sizes
// 2.16 (Codex set 04 b2 + g3 + f1 walk regions): boy 2 and girl 3 have their files too, and every walking file has its own regions — each file checked the same way
// on her standing file a colour change touches only Codex's region for that group with that group's colours (nothing outside) · medium skin = the file · the line-up picture
// and the character in the world follow · walking frames change too · back round to "as drawn" gives the file again · boy 1 (no colour file) shows the buttons off
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-colours-215';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;delete S.gmAdultSkin;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmStageC207');await p.waitForSelector('#ad207 .ad207g',{visible:true})}
// what one choice changes on one file (standing or walking) of one character, by group, against Codex's regions for that file
const onFile=(p,v,f,c,tn)=>p.evaluate(async(v,f,c,tn)=>{await ad215Load(v);const d=AD215.data[v],im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=f}),a=toCanvas(im),W=a.width,H=a.height,A=a.getContext('2d').getImageData(0,0,W,H).data,
  B=ad215Paint(im,f,v,c,tn).getContext('2d').getImageData(0,0,W,H).data,where=new Int8Array(W*H),hx=x=>parseInt(x.slice(1),16);
  AD215.G.forEach((g,gi)=>{const set=new Set(d.groups[g].map(hx));for(const [y,x,n] of (d.regions[f]||{})[g]||[])for(let k=0;k<n;k++){const j=y*W+x+k,i=j*4;if(A[i+3]&&set.has((A[i]<<16)|(A[i+1]<<8)|A[i+2]))where[j]=gi+1}});
  const res={regions:!!d.regions[f],changed:0,alpha:0,by:{}};for(let j=0;j<W*H;j++){const i=j*4;if(A[i+3]!==B[i+3])res.alpha++;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]){res.changed++;const g=where[j]?AD215.G[where[j]-1]:'outside';res.by[g]=(res.by[g]||0)+1}}return res},v,f,c,tn);
const FILES={cf1:['gm-c207-f1.png','gm-c214-f1-walk.png','gm-c214-f1-west.png'],cb2:['gm-c207-b2.png','gm-c214-b2-walk.png'],cg3:['gm-c213-g3.png','gm-c214-g3-walk.png']};
async function filesCheck(p){const out={};for(const [v,fs] of Object.entries(FILES))for(const f of fs){
  const r={hair:await onFile(p,v,f,{h:1,e:-1,b:-1},null),eye:await onFile(p,v,f,{h:-1,e:0,b:-1},null),coat:await onFile(p,v,f,{h:-1,e:-1,b:1},null),deep:await onFile(p,v,f,{h:-1,e:-1,b:-1},'deep'),medium:await onFile(p,v,f,{h:-1,e:-1,b:-1},'medium')},k=v+':'+f;
  assert(Object.values(r).every(x=>x.regions),k+' has its own regions');
  assert(r.hair.changed>1500&&Object.keys(r.hair.by).join()==='hair',k+' hair only: '+JSON.stringify(r.hair));
  assert(r.eye.changed>=30&&Object.keys(r.eye.by).join()==='eye',k+' eyes only: '+JSON.stringify(r.eye));
  assert(r.coat.changed>1000&&Object.keys(r.coat.by).join()==='coat',k+' coat only: '+JSON.stringify(r.coat));
  assert(r.deep.changed>300&&Object.keys(r.deep.by).every(g=>g==='skin'||g==='mouth'),k+' skin (and mouth shades) only: '+JSON.stringify(r.deep));
  assert.equal(r.medium.changed,0,k+' medium skin = the file');assert(Object.values(r).every(x=>x.alpha===0),k+' no alpha change');
  out[k]=Object.fromEntries(Object.entries(r).map(([g,x])=>[g,x.changed]))}return out}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-c207-f1.palette.json')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};
  await press(p,'#ad207 .ad207g [data-v="cf1"]');await p.waitForFunction(()=>AD201.v==='cf1'&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad207use').disabled,{timeout:20000});
  await p.waitForFunction(()=>AD215.tried.cf1,{timeout:15000});await sleep(300);
  R.row=await p.$$eval('#ad207 .ad215c button',bs=>bs.map(b=>b.dataset.k+(b.disabled?':off':':on')));
  if(fail){assert.deepEqual(R.row,['h:off','e:off','b:off','s:off'],'no colour file: buttons off');await press(p,'#ad207use');assert.equal(await p.evaluate(()=>PS.F),112,'she still works');
   await open(p);await press(p,'#ad207back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  assert.deepEqual(R.row,['h:on','e:on','b:on','s:on'],'colour buttons on for woman 1');
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.sizes=await p.$$eval('#ad207 .ad207g button,#ad207 .ad215c button,#ad207use,#ad207back,#ad207x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.dataset.k||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height),w:Math.round(r.width)}}));
  assert(R.sizes.every(b=>b.inside&&b.h>=44&&b.w>=44),'all buttons inside and 44 px+: '+JSON.stringify(R.sizes.filter(b=>!(b.inside&&b.h>=44&&b.w>=44))));
  // per group on every file of the three characters (standing and walking): only that group's region pixels change
  if(name==='phone')R.file=await filesCheck(p);
  // real taps: hair ×2 (brown), coat ×2 (wing blue), skin ×3 (as drawn → light → tan → deep) → the save, the line-up, the character
  const before=await p.evaluate(()=>{const c=$('ad207cv');return c.toDataURL()});
  for(let i=0;i<2;i++)await press(p,'#ad207 .ad215c [data-k="h"]');for(let i=0;i<2;i++)await press(p,'#ad207 .ad215c [data-k="b"]');for(let i=0;i<3;i++)await press(p,'#ad207 .ad215c [data-k="s"]');
  R.saved=await p.evaluate(()=>({h:S.gmAdultCol.h,b:S.gmAdultCol.b,s:S.gmAdultSkin}));assert.deepEqual(R.saved,{h:1,b:1,s:'deep'});await sleep(500);
  R.lineupChanged=await p.evaluate(b=>$('ad207cv').toDataURL()!==b,before);assert(R.lineupChanged,'the line-up shows the colours');await p.screenshot({path:path.join(out,name+'-window.png')});
  await press(p,'#ad207use');R.world=await p.evaluate(()=>{const base=AD201.sheets,d=(x,y)=>{const a=x.getContext('2d').getImageData(0,0,x.width,x.height).data,b=y.getContext('2d').getImageData(0,0,y.width,y.height).data;let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;return n};
    return {F:PS.F,standChanged:d(base.stand,PS.stand),walkChanged:d(base.walk,PS.walk),sameSize:PS.walk.width===base.walk.width&&PS.walk.height===base.walk.height}});
  assert(R.world.F===112&&R.world.standChanged>5000&&R.world.walkChanged>20000&&R.world.sameSize,'in the world, standing and walking coloured: '+JSON.stringify(R.world));
  await p.evaluate(()=>{const n=(M.npcs||[]).find(n=>/leah/.test(n.img||''));if(n){P.x=n.x+34;P.y=n.y+2;P.row=0}P.path=null});await sleep(800);await p.screenshot({path:path.join(out,name+'-world.png')});
  // back round to as drawn: the built sheets again
  await open(p);const nh=await p.evaluate(()=>HAIRC.length),nb=await p.evaluate(()=>HOUSES.length);for(let i=0;i<nh-1;i++)await press(p,'#ad207 .ad215c [data-k="h"]');for(let i=0;i<nb-1;i++)await press(p,'#ad207 .ad215c [data-k="b"]');await press(p,'#ad207 .ad215c [data-k="s"]');
  R.back=await p.evaluate(()=>({h:S.gmAdultCol.h,b:S.gmAdultCol.b,s:S.gmAdultSkin===undefined?-1:S.gmAdultSkin}));assert.deepEqual(R.back,{h:-1,b:-1,s:-1});await press(p,'#ad207x');await sleep(300);
  R.asDrawn=await p.evaluate(()=>PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()&&PS.walk.toDataURL()===AD201.sheets.walk.toDataURL());assert(R.asDrawn,'as drawn again');
  // boy 2 and girl 3 (2.16): their own colour files — buttons on, one hair tap colours them in the world, standing and walking
  R.kids={};for(const v of ['cb2','cg3']){await open(p);await press(p,`#ad207 .ad207g [data-v="${v}"]`);await p.waitForFunction(v=>AD201.v===v&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad207use').disabled&&AD215.tried[v],{timeout:20000},v);await sleep(300);
   const row=await p.$$eval('#ad207 .ad215c button',bs=>bs.map(b=>b.disabled?0:1).join(''));assert.equal(row,'1111',v+' colour buttons on');
   await press(p,'#ad207 .ad215c [data-k="h"]');await press(p,'#ad207use');
   R.kids[v]=await p.evaluate(()=>{const base=AD201.sheets,d=(x,y)=>{const a=x.getContext('2d').getImageData(0,0,x.width,x.height).data,b=y.getContext('2d').getImageData(0,0,y.width,y.height).data;let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;return n};
     return {F:PS.F,stand:d(base.stand,PS.stand),walk:d(base.walk,PS.walk)}});assert(R.kids[v].F===96&&R.kids[v].stand>2000&&R.kids[v].walk>10000,v+' coloured in the world: '+JSON.stringify(R.kids[v]));
   if(name==='phone844')await p.screenshot({path:path.join(out,name+'-'+v+'-world.png')});await p.evaluate(()=>{delete S.gmAdultCol})}
  // boy 1 has no colour file: buttons off, he still works
  await open(p);await press(p,'#ad207 .ad207g [data-v="cb1"]');await p.waitForFunction(()=>AD201.v==='cb1'&&AD201.sheets&&!$('ad207use').disabled,{timeout:20000});await sleep(500);
  R.boyRow=await p.$$eval('#ad207 .ad215c button',bs=>bs.every(b=>b.disabled));assert(R.boyRow,'boy 1: buttons off (no colour file)');await press(p,'#ad207back');await sleep(300);
  assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'back to the own character');
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
