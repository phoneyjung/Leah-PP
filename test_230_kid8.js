// 2.31: counts of eyes/mouths from kid8.json (Codex C2: 9 and 8) and the new 07↔08 map
// Claude 2.30 (owner 12 Oct "เสร็จแล้วเอาเข้าเกมใน GM ก่อน" + Codex 19:18 "ขอClaudeตรวจCและนำเข้าGMให้เจ้าของดู"): Codex set 08 (kid8.json, 51 layers) in the paperdoll, GM only
// · GM loads set 08: 16 hair · 1 face · 5 eyes · 5 mouths · 8 outfits, 2.29 off · every hair × outfit × view stands on row 62 · the scarf takes each house colour and
//   nothing else changes (the gold trim never) · hair colour only in the hair · skin tone only in skin/mouth shades
// · a set-07 look shows as its nearest set-08 pieces and the save is unchanged until the child saves · dressing: cancel keeps the save, a new hair saves as a set-08 look
// · boys see the boys' 4 outfits, girls all 8 · names on the buttons are Codex's · without GM (and with &kid7) set 07 as before, a set-08 look shows as set-07 pieces
// · BUG-40: a second "แต่งตัว" in the same game opens on the hairstyles again
// · kid8.json missing / the face missing → set 07 · one hairstyle missing → the rest · online: a set-08 look travels with ",8" · creator and world at 844×390 and 1180×820
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-kid8-230';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function tap(p,el){if(typeof el==='string'){const s=el;el=await p.$(s);if(!el)throw Error('no '+s)}const r=await el.boundingBox();if(!r)throw Error('hidden');await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(350)}
const open=async(p,q)=>{await p.goto(base+'?rank=1'+(q||''),{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1500)};
const start=(p,o)=>p.evaluate(o=>{const d=Store.all();const s=newSave({name:o.name||'Pim',kid:o.kid??0,house:o.house??1,age:o.age??7});if(o.pd)s.pd219=o.pd;if(o.g)s.gender194=o.g;d.slots=[s];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},o);
const ctx=async(browser,w,h,dpr)=>{const bc=await browser.createBrowserContext(),p=await bc.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport({width:w||844,height:h||390,deviceScaleFactor:dpr||1,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);return {bc,p,errors}};
const old07={v:1,hair:3,face:2,eyes:3,mouth:3,body:2,hc:-1,ec:-1,tn:1};   // set 07: buns, freckles, sleepy eyes, grin, shorts
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];
 try{
  // 1) GM: set 08 and its colours
  {const {bc,p,errors}=await ctx(browser);await open(p,'&gm');
   const R=await p.evaluate(async()=>{await pd219Load();const d=PD219.d,r={set:PD219.set,ok:PD219.ok,kid8:KID8.ok,err:KID8.err,fix:FIX229.on,avail:Object.fromEntries(PD219.P.map(k=>[k,PD219.avail[k].length])),def:PD219.def};
     const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
     // every hair × outfit × view: feet on row 62, nothing below
     let bad=0,frames=0;for(let h=1;h<=16;h++)for(let b=1;b<=8;b++){const s=px(pd219Full({v:1,set:8,hair:h,face:1,eyes:1,mouth:1,body:b,hc:-1,ec:-1,tn:1},0).stand);
       for(let i=0;i<8;i++){frames++;let low=-1,top=64;for(let y=0;y<64;y++)for(let x=i*64;x<i*64+64;x++)if(s[(y*512+x)*4+3]){if(y>low)low=y;if(y<top)top=y}if(low!==62||62-top+1<58)bad++}}
     r.frames=frames;r.badFeet=bad;
     // colours: one painted piece against Codex's own, pixel by pixel, by group
     const diff=(f,ch)=>{const a=px(toCanvas(PD219.img[f])),b=px(toCanvas(pd219Paint(f,Object.assign({hc:-1,ec:-1,b:0,tn:1},ch)))),cls=PD219.cls[f],n={};for(let j=0;j<cls.length;j++){const i=j*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3]){const k=cls[j];n[k]=(n[k]||0)+1}}return n};
     const hx=x=>parseInt(x.slice(1),16),trim=new Set(d.groups.trim.map(hx));r.house={};r.trimChanged=0;r.scarfHue={};
     for(let b=1;b<=8;b++){const f=pd219File('body',b),a=px(toCanvas(PD219.img[f]));for(let hb=0;hb<HOUSES.length;hb++){const n=diff(f,{b:hb});r.house[b+'/'+hb]=n;
       const q=px(toCanvas(pd219Paint(f,{hc:-1,ec:-1,b:hb,tn:1}))),cls=PD219.cls[f];let off=0,cnt=0;for(let j=0;j<cls.length;j++){const i=j*4;if(trim.has((a[i]<<16)|(a[i+1]<<8)|a[i+2])&&(a[i]!==q[i]||a[i+1]!==q[i+1]||a[i+2]!==q[i+2]))r.trimChanged++;
         if(cls[j]===5){cnt++;const [h,s]=hslOf(q[i]/255,q[i+1]/255,q[i+2]/255),w=HOUSES[hb].h[0];if(s>.12&&Math.min(Math.abs(h-w),360-Math.abs(h-w))>16)off++}}r.scarfHue[b+'/'+hb]=[cnt,off]}}
     r.hairCol=diff(pd219File('hair',12),{hc:3});r.tone={};for(const tn of [0,2,3])r.tone[tn]=Object.assign(diff(pd219File('face',1),{tn}),{mouth:diff(pd219File('mouth',1),{tn})});r.tone1=diff(pd219File('face',1),{tn:1});
     r.eyeCol=diff(pd219File('eyes',1),{ec:2});
     // a set-07 look in GM
     const m=pd230Map({v:1,hair:3,face:2,eyes:3,mouth:3,body:2,hc:-1,ec:-1,tn:1});r.map=[m.hair,m.face,m.eyes,m.mouth,m.body,m.set];r.look07=pd219Look({v:1,hair:3,face:2,eyes:3,mouth:3,body:2,hc:-1,ec:-1,tn:1});
     r.enc=pdEnc226({v:1,set:8,hair:12,face:1,eyes:2,mouth:3,body:7,hc:-1,ec:2,tn:3});r.dec=pdDec226(r.enc);r.dec07=pdDec226('3,2,3,3,2,0,0,1');r.decBad=pdDec226('1,1,1,1,1,0,0,1,7');
     return r});R.name='gm-load';
   assert(R.set===8&&R.ok&&R.kid8&&!R.err&&!R.fix,'GM loads set 08 '+JSON.stringify(R));const K8=JSON.parse(fs.readFileSync(path.join(__dirname,'kid8.json'),'utf8')),cnt=k=>K8.parts.filter(q=>q.part===k).length;assert.deepEqual(R.avail,{hair:16,face:1,eyes:cnt('eyes'),mouth:cnt('mouth'),body:8});
   assert.deepEqual([R.def.f.hair,R.def.f.body,R.def.m.hair,R.def.m.body],[1,1,9,5]);assert.equal(R.frames,1024);assert.equal(R.badFeet,0,'feet on row 62');
   for(const [k,n] of Object.entries(R.house)){assert(n[5]>40,'the scarf changes '+k+' '+JSON.stringify(n));assert.deepEqual(Object.keys(n),['5'],'only the scarf changes '+k+' '+JSON.stringify(n))}
   for(const [k,[cnt,off]] of Object.entries(R.scarfHue))assert(cnt>40&&off===0,'scarf in the house hue '+k+' '+cnt+'/'+off);assert.equal(R.trimChanged,0,'the gold trim never changes');
   assert(R.hairCol[1]>100&&Object.keys(R.hairCol).join()==='1','hair colour only in the hair '+JSON.stringify(R.hairCol));assert(R.eyeCol[2]>0&&Object.keys(R.eyeCol).join()==='2','eye colour '+JSON.stringify(R.eyeCol));
   for(const [tn,n] of Object.entries(R.tone)){assert(n[3]>300,'tone '+tn);assert(Object.keys(n).filter(k=>k!=='mouth').every(k=>k==='3'),'tone only in skin '+tn+' '+JSON.stringify(n));assert(Object.keys(n.mouth).every(k=>k==='3'||k==='4'),'mouth tone '+JSON.stringify(n.mouth))}
   assert.deepEqual(R.tone1,{});assert.deepEqual(R.map,[6,1,5,1,5,8]);assert(R.look07);
   assert.equal(R.enc,'12,1,2,3,7,-1,2,3,8');assert.deepEqual(R.dec,{v:1,hair:12,face:1,eyes:2,mouth:3,body:7,hc:-1,ec:2,tn:3,set:8});assert(R.dec07&&R.dec07.set===undefined);assert.equal(R.decBad,null);
   assert.deepEqual(errors,[]);R.errors=0;delete R.house;results.push(R);await bc.close()}
  // 2) GM: a child with a set-07 look → the world in set 08, the save untouched · dressing (cancel / new hair) · boys' outfits · names
  {const {bc,p,errors}=await ctx(browser);await open(p,'&gm');await p.evaluate(()=>pd219Load());await start(p,{age:7,g:'f',pd:old07,house:2});await sleep(2000);const R={name:'gm-dress'};
   R.world=await p.evaluate(o=>{const a=PS.stand.getContext('2d').getImageData(0,0,512,64).data,b=pd219Full({v:1,set:8,hair:6,face:1,eyes:5,mouth:1,body:5,hc:-1,ec:-1,tn:1},S.house).stand.getContext('2d').getImageData(0,0,512,64).data;
     return {flag:PS.pd219,same:a.every((v,i)=>v===b[i]),save:JSON.stringify(S.pd219)===JSON.stringify(o)}},old07);
   assert(R.world.flag&&R.world.same&&R.world.save,'set-07 look in set 08 '+JSON.stringify(R.world));
   await p.evaluate(()=>dress226Open());await sleep(1200);R.open=await p.evaluate(()=>({on:DRESS226.on,pd:CR_STATE.pd&&[CR_STATE.pd.hair,CR_STATE.pd.eyes,CR_STATE.pd.mouth,CR_STATE.pd.body],k8:$('cr').classList.contains('k8'),
     hairBtns:document.querySelectorAll('#pd219hair .opt').length,bodies:[...document.querySelectorAll('#pd219body .opt')].filter(b=>b.style.display!=='none').length,name7:(document.querySelector('#pd219hair .opt[data-n="7"] span')||{}).textContent,
     faceBtn:(document.querySelector('[data-sub="face:face"]')||{}).textContent,faceRow:getComputedStyle($('pd219face')).display}));
   assert(R.open.on&&R.open.k8,'dressing open '+JSON.stringify(R.open));assert.deepEqual(R.open.pd,[6,5,1,5]);assert.equal(R.open.hairBtns,16);assert.equal(R.open.bodies,8);assert.equal(R.open.name7,'ผมตรงหน้าม้า');assert.equal(R.open.faceBtn,'สีผิว');assert.equal(R.open.faceRow,'none');
   await p.screenshot({path:path.join(out,'dress-hair-844.png')});
   await tap(p,'#c3Back');await sleep(600);R.cancel=await p.evaluate(o=>JSON.stringify(S.pd219)===JSON.stringify(o),old07);assert(R.cancel,'cancel keeps the save');
   await p.evaluate(()=>dress226Open());await sleep(1200);R.reopen=await p.evaluate(()=>({sub:C193.sub&&C193.sub.hair,shown:[...document.querySelectorAll('#pd219hair .opt')].filter(b=>b.getBoundingClientRect().width>0).length}));
   assert(R.reopen.sub==='style'&&R.reopen.shown===16,'BUG-40: the second dressing shows the hairstyles '+JSON.stringify(R.reopen));const hb=await p.$('#pd219hair .opt[data-n="12"]');await hb.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(300);await tap(p,hb);await sleep(400);await tap(p,'#cgo');await sleep(1200);
   R.saved=await p.evaluate(()=>({pd:S.pd219,world:(()=>{const a=PS.stand.getContext('2d').getImageData(0,0,512,64).data,b=pd219Full(S.pd219,S.house).stand.getContext('2d').getImageData(0,0,512,64).data;return a.every((v,i)=>v===b[i])})()}));
   assert(R.saved.pd.set===8&&R.saved.pd.hair===12&&R.saved.pd.body===5&&R.saved.world,'new look saved as set 08 '+JSON.stringify(R.saved));
   // a boy: only the boys' outfits; a girl switching to ♂ gets a boy's outfit
   await p.evaluate(()=>{S.gender194='m';dress226Open()});await sleep(1200);R.boy=await p.evaluate(()=>[...document.querySelectorAll('#pd219body .opt')].filter(b=>b.style.display!=='none').map(b=>+b.dataset.n));
   assert.deepEqual(R.boy,[5,6,7,8]);await p.evaluate(()=>{C193.tab='body';crRefresh()});await sleep(500);await p.screenshot({path:path.join(out,'dress-body-boy-844.png')});
   // the names fit their buttons (two lines allowed)
   R.overflow=await p.evaluate(()=>[...document.querySelectorAll('#cr .pd219g .opt')].filter(b=>b.offsetParent).filter(b=>{const s=b.querySelector('span');return s&&(s.scrollWidth>s.clientWidth+1||s.getBoundingClientRect().right>b.getBoundingClientRect().right+1)}).map(b=>b.dataset.pd+b.dataset.n));
   assert.deepEqual(R.overflow,[],'names inside their buttons');await tap(p,'#c3Back');await sleep(500);
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // 3) a player without GM: set 07, a set-08 look shows as set-07 pieces · &kid7 in GM: set 07
  for(const [name,q] of [['player',''],['gm-kid7','&gm&kid7']]){const {bc,p,errors}=await ctx(browser);await open(p,q);
   const look={v:1,set:8,hair:12,face:1,eyes:2,mouth:3,body:7,hc:-1,ec:-1,tn:1};await start(p,{age:7,g:'m',pd:look});await sleep(2500);
   const R=await p.evaluate(o=>{const a=PS.stand.getContext('2d').getImageData(0,0,512,64).data,b=pd219Full({v:1,hair:2,face:1,eyes:1,mouth:1,body:2,hc:-1,ec:-1,tn:1},S.house).stand.getContext('2d').getImageData(0,0,512,64).data;
     return {set:PD219.set,ok:PD219.ok,kid8:KID8.ok,fix:FIX229.on,flag:PS.pd219,same:a.every((v,i)=>v===b[i]),save:JSON.stringify(S.pd219)===JSON.stringify(o),hair:PD219.avail.hair.length}},look);R.name=name;
   assert(R.set===7&&R.ok&&!R.kid8&&R.fix&&R.flag&&R.same&&R.save&&R.hair===3,name+' set 07 '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // 4) files missing in GM: kid8.json → set 07 · the face → set 07 · one hairstyle → the other 15
  for(const [name,re,want] of [['no-json',/kid8\.json/,7],['no-face',/kid8-face-1\.png/,7],['no-hair5',/kid8-(hair|hairback)-5\.png/,8]]){const {bc,p,errors}=await ctx(browser);
   await p.setRequestInterception(true);p.on('request',r=>re.test(r.url())?r.respond({status:404,body:''}):r.continue());await open(p,'&gm');
   const R=await p.evaluate(async()=>{await pd219Load();return {set:PD219.set,ok:PD219.ok,kid8:KID8.ok,hair:PD219.avail.hair,fix:FIX229.on,def:PD219.def.m.hair}});R.name=name;
   assert(R.ok&&R.set===want,name+' '+JSON.stringify(R));if(want===7)assert(R.fix&&R.hair.length===3&&R.def===2,name+' set 07 as before '+JSON.stringify(R));else assert(!R.hair.includes(5)&&R.hair.length===15,name+' '+JSON.stringify(R));
   await start(p,{age:7,g:'f',pd:old07});await sleep(2000);R.world=await p.evaluate(()=>PS.pd219);assert(R.world,name+' a child in pieces');
   assert.deepEqual(errors,[]);R.errors=0;R.hair=R.hair.length;results.push(R);await bc.close()}
  // 5) online: another player in a set-08 look, seen by a GM device (set 08) and by a player (set 07)
  for(const [name,q,want] of [['other-gm','&gm',8],['other-player','',7]]){const {bc,p,errors}=await ctx(browser);await open(p,q);await p.evaluate(()=>pd219Load());await start(p,{age:7,g:'f',pd:old07});await sleep(1500);
   const R=await p.evaluate(()=>{const s='12,1,2,3,7,-1,-1,1,8',n0=OTH226.drawn;OTH226.pd=s;let w;try{w=othSheets(0,2,-1,-1,null)}finally{OTH226.pd=null}
     const m=pd230Map(pdDec226(s)),b=pd219Full(m,2).stand.getContext('2d').getImageData(0,0,512,64).data,a=w.stand.getContext('2d').getImageData(0,0,512,64).data;
     return {set:PD219.set,drawn:OTH226.drawn-n0,same:a.every((v,i)=>v===b[i]),hair:m.hair}});R.name=name;
   assert(R.set===want&&R.drawn===1&&R.same&&R.hair===(want===8?12:2),name+' '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // 6) the create screen (GM, a new girl and a new boy) and the world, phone and iPad
  for(const [name,w,h,dpr] of [['phone844',844,390,3],['ipad1180',1180,820,2]]){const {bc,p,errors}=await ctx(browser,w,h,dpr);await open(p,'&gm');const R={name};
   await tap(p,'#cg194 [data-g="f"]');await sleep(1500);R.cr=await p.evaluate(()=>({pd:$('cr').classList.contains('pd219'),k8:$('cr').classList.contains('k8'),hair:document.querySelectorAll('#pd219hair .opt').length,look:pd219Cur()}));
   assert(R.cr.pd&&R.cr.k8&&R.cr.hair===16&&R.cr.look.set===8,'creator in set 08 '+JSON.stringify(R.cr));await p.evaluate(()=>{C193.tab='hair';crRefresh()});await sleep(500);await p.screenshot({path:path.join(out,name+'-creator-hair.png')});
   await p.evaluate(()=>{C193.tab='body';crRefresh()});await sleep(500);await p.screenshot({path:path.join(out,name+'-creator-body.png')});
   await p.evaluate(()=>{C193.tab='face';C193.sub.face='eyes';crRefresh()});await sleep(500);await p.screenshot({path:path.join(out,name+'-creator-eyes.png')});
   R.made=await p.evaluate(()=>{CR_STATE.pd.hair=8;CR_STATE.pd.body=4;CR_STATE.house=3;CR_STATE.age=7;crRefresh();const s=newSave({name:'Mai',kid:CR_STATE.kid,house:3,age:7});return s.pd219});
   assert(R.made&&R.made.set===8&&R.made.hair===8&&R.made.body===4,'new save keeps the set-08 look '+JSON.stringify(R.made));
   await start(p,{age:7,g:'f',pd:R.made,house:3});await sleep(2500);R.world=await p.evaluate(()=>({flag:PS.pd219,real:PS.pdWalk219,F:PS.F}));assert(R.world.flag&&!R.world.real&&R.world.F===64,'world '+JSON.stringify(R.world));
   for(const [dir,dx,dy] of [['east',220,0],['north',0,-200]]){await p.evaluate(([dx,dy])=>{P.path=null;const t=[P.x+dx,P.y+dy];P.path=findPath(M,P.x,P.y,t[0],t[1])||[{x:t[0],y:t[1]}]},[dx,dy]);await sleep(700);await p.screenshot({path:path.join(out,name+'-world-'+dir+'.png')})}
   R.fps=await p.evaluate(()=>new Promise(ok=>{let n=0;const t0=performance.now();const tick=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(tick);else ok(Math.round(n/((performance.now()-t0)/1000)))};requestAnimationFrame(tick)}));
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));console.log(JSON.stringify(results));await browser.close()}
 console.log('errors 0')})().catch(e=>{console.error(e);process.exit(1)});
