// Claude 2.29 (owner 12 Oct 16:26, three pictures from the game: "หน้ายังแสดงผิด และผ้าคลุมด้วย ลองเชคหน้าอื่นๆ ให้ดีและแก้ไข"): the set 07 pieces children dress in
// · the cape is the house colour all over: no crimson speck left inside it (every house; a shade Codex tagged as skin stays skin), the collar Codex painted into the face and back-hair layers is the house colour
//   too, the hands keep their skin (no light skin pixel joins the cape)
// · a mouth never sits on the face's outline (stand and walk, every mouth) · the freckled face shows face 1 in the turned views (SE E W SW) and its freckles from the front
// · nothing else moves: alpha of every piece unchanged except the shifted mouth frames · pd-kid.json of another set (no ASSET_SPEC_07) → no change at all
// · the world at 844×390 and 1180×820, walking right and walking away, no page errors · BUG-38: the wardrobe balloon shows a dress, not the magnifier
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-pieces-229';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const owner={v:1,hair:1,face:2,eyes:1,mouth:2,body:1,hc:4,ec:3,tn:1};
const check=()=>(async()=>{await pd219Load();const d=PD219.d,hx=x=>parseInt(x.slice(1),16),skin=new Set(d.groups.skin.map(hx)),coat=new Set(d.groups.coat.map(hx));
  const parts=d.parts.concat(d.walk.parts),px=f=>{const c=toCanvas(PD219.img[f]);return {W:c.width,H:c.height,d:c.getContext('2d').getImageData(0,0,c.width,c.height).data}};
  // a hand: a skin shade that is the peach light or touches it
  const hand=(j,W,H,p)=>{const x=j%W,y=(j/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const i=(Y*W+X)*4;if(p[i+3]&&skin.has((p[i]<<16)|(p[i+1]<<8)|p[i+2])&&fix229Light(p[i],p[i+1],p[i+2]))return true}return false};
  const r={on:FIX229.on,err:FIX229.err||null,specks:0,collar:0,handsInCape:0,mouthEdge:{},turned:{},front:{},cape:FIX229.cape};
  for(const q of parts){const f=q.file;pd219Cls(f);const cls=PD219.cls[f],{W,H,d:p}=px(f);
    if(q.part==='body')for(let j=0;j<cls.length;j++){const i=j*4;if(!p[i+3])continue;const [h,s,l]=hslOf(p[i]/255,p[i+1]/255,p[i+2]/255);
      if(cls[j]===5&&skin.has((p[i]<<16)|(p[i+1]<<8)|p[i+2])&&fix229Light(p[i],p[i+1],p[i+2]))r.handsInCape++;
      if(!cls[j]&&(h>=300||h<=15)&&s>=.2&&l>=.08&&!(skin.has((p[i]<<16)|(p[i+1]<<8)|p[i+2])&&hand(j,W,H,p))){const x=j%W,y=(j/W)|0;let c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&cls[Y*W+X]===5)c++}if(c>=5)r.specks++}}
    if(q.part==='face'||q.part==='hairback')for(let j=0;j<cls.length;j++){const i=j*4;if(!p[i+3]||cls[j]===5)continue;const v=(p[i]<<16)|(p[i+1]<<8)|p[i+2];if(coat.has(v)&&fix229Crimson(p[i],p[i+1],p[i+2]))r.collar++}}
  for(const walk of [false,true]){const ff=walk?d.walk.parts:d.parts,face=px(ff.find(q=>q.part==='face'&&q.option===1).file),{W,H}=face;
    const edge=(x,y)=>{if(!face.d[(y*W+x)*4+3])return true;for(const [ex,ey] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+ex,Y=y+ey;if(X<0||Y<0||X>=W||Y>=H||!face.d[(Y*W+X)*4+3])return true}return false};
    for(const q of ff.filter(q=>q.part==='mouth')){const m=px(q.file);let n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.d[(y*W+x)*4+3]&&edge(x,y))n++;r.mouthEdge[q.file]=n}
    const f2=px(ff.find(q=>q.part==='face'&&q.option===2).file),cells=walk?[1,2,6,7].map(k=>[0,k*64,384,64]):[1,2,6,7].map(k=>[k*64,0,64,64]),fr=walk?[[0,0,384,64]]:[[0,0,64,64]];
    const cnt=cs=>{let n=0;for(const [x0,y0,w,h] of cs)for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=(y*W+x)*4;for(let k=0;k<4;k++)if(face.d[i+k]!==f2.d[i+k]){n++;break}}return n};
    r.turned[walk?'walk':'stand']=cnt(cells);r.front[walk?'walk':'stand']=cnt(fr)}
  return r})();
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];
 try{
  // 1) the pieces as the game uses them
  {const bc=await browser.createBrowserContext(),p=await bc.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:844,height:390});await p.setBypassServiceWorker(true);
   await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(600);
   const t0=Date.now();const R=await p.evaluate(check);R.loadMs=Date.now()-t0;R.name='pieces';
   assert(R.on&&!R.err,'2.29 on '+JSON.stringify(R));assert.equal(R.specks,0,'crimson specks inside the cape');assert.equal(R.collar,0,'collar left red in the face/back-hair layers');assert.equal(R.handsInCape,0,'a hand joined the cape');
   assert(Object.values(R.mouthEdge).every(n=>n===0),'a mouth on the outline '+JSON.stringify(R.mouthEdge));assert(R.turned.stand===0&&R.turned.walk===0,'turned freckles '+JSON.stringify(R.turned));
   assert(R.front.stand>=20&&R.front.walk>=120,'freckles from the front '+JSON.stringify(R.front));assert(['pd-kid-body-1-walk.png','pd-kid-hairback-1-walk.png','pd-kid-face-1-walk.png'].every(f=>R.cape[f]>50),'cape grown '+JSON.stringify(R.cape));
   // the house colour on every cape: painted bodies of houses 0–2 keep no crimson that touches the cape
   R.house=await p.evaluate(()=>{const out={};for(const h of [0,1,2]){let n=0;for(const q of PD219.d.parts.concat(PD219.d.walk.parts).filter(q=>q.part==='body')){const c=toCanvas(pd219Paint(q.file,{hc:-1,ec:-1,b:h,tn:1})),W=c.width,H=c.height,d=c.getContext('2d').getImageData(0,0,W,H).data,cls=PD219.cls[q.file];
     for(let j=0;j<cls.length;j++){if(cls[j]===5)continue;const i=j*4;if(!d[i+3]||!fix229Crimson(d[i],d[i+1],d[i+2]))continue;const x=j%W,y=(j/W)|0;let c5=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if((dx||dy)&&X>=0&&Y>=0&&X<W&&Y<H&&cls[Y*W+X]===5)c5++}if(c5>=5)n++}}out[h]=n}return out});
   assert(Object.values(R.house).every(n=>n===0),'house colour '+JSON.stringify(R.house));
   // nothing else moved: every piece keeps Codex's alpha except the shifted mouth frames (their pixel count is kept)
   R.alpha=await p.evaluate(async()=>{const raw=f=>new Promise(ok=>{const im=new Image();im.onload=()=>ok(toCanvas(im));im.onerror=()=>ok(null);im.src=f});let moved=0,count=0,same=0;
     for(const q of PD219.d.parts.concat(PD219.d.walk.parts)){const a=await raw(q.file),b=toCanvas(PD219.img[q.file]);if(!a)continue;const A=a.getContext('2d').getImageData(0,0,a.width,a.height).data,B=b.getContext('2d').getImageData(0,0,b.width,b.height).data;
       let d=0,na=0,nb=0;for(let i=3;i<A.length;i+=4){if((A[i]>0)!==(B[i]>0))d++;if(A[i])na++;if(B[i])nb++}if(q.part==='mouth'){if(d)moved++;if(na!==nb)count++}else if(q.part!=='face'||q.option===1){if(!d)same++;else count+=1000}}return {moved,count,same}});
   assert(R.alpha.count===0&&R.alpha.moved===4&&R.alpha.same>=20,'alpha '+JSON.stringify(R.alpha));
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // 2) a pd-kid.json of another set: 2.29 stays off and the pieces are exactly Codex's
  {const bc=await browser.createBrowserContext(),p=await bc.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:844,height:390});await p.setBypassServiceWorker(true);
   await p.setRequestInterception(true);p.on('request',async r=>{if(/pd-kid\.json/.test(r.url())){const body=fs.readFileSync(path.join(__dirname,'pd-kid.json'),'utf8').replace(/"spec": "ASSET_SPEC_07[^"]*"/,'"spec": "ASSET_SPEC_99 test"');r.respond({status:200,contentType:'application/json',body})}else r.continue()});
   await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(600);
   const R=await p.evaluate(async()=>{await pd219Load();return {ok:PD219.ok,on:FIX229.on,cape:Object.keys(FIX229.cape).length,mouth:Object.keys(FIX229.mouth).length,face:Object.keys(FIX229.face).length}});R.name='other-set';
   assert(R.ok&&!R.on&&!R.cape&&!R.mouth&&!R.face,'another set is left alone '+JSON.stringify(R));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // 3) the world: the owner's look walking right and walking away, phone and iPad
  for(const [name,width,height,dpr] of [['phone844',844,390,3],['ipad1180',1180,820,2]]){const bc=await browser.createBrowserContext(),p=await bc.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1000);
   await p.evaluate(o=>{const d=Store.all();const s=newSave({name:'Leah',kid:0,house:0,age:7});s.pd219=o;s.gender194='f';d.slots=[s];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},owner);
   await sleep(2500);const R={name};R.world=await p.evaluate(()=>({flag:PS.pd219,real:PS.pdWalk219}));assert(R.world.flag&&R.world.real,'pieces in the world '+JSON.stringify(R.world));
   for(const [dir,dx,dy] of [['east',220,0],['north',0,-200]]){await p.evaluate(([dx,dy])=>{P.path=null;const t=[P.x+dx,P.y+dy];P.path=findPath(M,P.x,P.y,t[0],t[1])||[{x:t[0],y:t[1]}]},[dx,dy]);await sleep(700);await p.screenshot({path:path.join(out,name+'-'+dir+'.png')})}
   // BUG-38: by the wardrobe at home the balloon shows the dress symbol and the word แต่งตัว
   await p.evaluate(()=>goMap('room','door'));await sleep(1200);
   // (2.30) the letters popup ("ได้จดหมาย 3 ฉบับ!") can open on the way home in the evening: close it first, like a child would
   await p.evaluate(()=>{try{if(!$('modal').classList.contains('hide'))closeModal()}catch(e){}DLG=null});await sleep(300);
   R.balloon=await p.evaluate(()=>{try{if(!$('modal').classList.contains('hide'))closeModal()}catch(e){}const a=M.layout2.find(q=>q[0]==='wardrobe'),v=f2View(a[0],a[1]);for(let dy=0;dy<=2.2;dy+=.25)for(let dx=-1;dx<=v[6]+1;dx+=.25){const x=(a[2]+dx)*T,y=(a[3]+v[7]+dy+ROOM2.rowsAbovePlan)*T;if(blockedAt(M,x,y))continue;P.x=x;P.y=y;if(dress226Wardrobe()){P.path=null;return [x,y]}}return null});
   await sleep(1500);R.balloon=await p.evaluate(()=>{const b=$('context167');return b&&!b.hidden?{icon:b.dataset.icon,label:(b.querySelector('.context167-label')||{}).textContent,svg:!!(b.querySelector('svg path'))}:{hidden:true,ready:ctx167Ready(),near:(anyNear()||{}).k}});await p.screenshot({path:path.join(out,name+'-wardrobe.png')});assert(R.balloon&&R.balloon.icon==='dress'&&R.balloon.svg&&R.balloon.label==='แต่งตัว','wardrobe balloon '+JSON.stringify(R.balloon));
   const f=await p.evaluate(()=>new Promise(ok=>{let n=0;const t0=performance.now();const tick=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(tick);else ok(Math.round(n/((performance.now()-t0)/1000)))};requestAnimationFrame(tick)}));R.fps=f;
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));console.log(JSON.stringify(results));await browser.close()}
 console.log('errors 0')})().catch(e=>{console.error(e);process.exit(1)});
