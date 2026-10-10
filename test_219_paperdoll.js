// Claude 2.19 (Codex set 07 stage A, ASSET_SPEC_07 v4/v5, branch codex/asset-07-paperdoll-a ec17508 · owner 11 Oct "ผ่าน ใส่ GM + Codex ทำขั้น B คู่กัน"): the paperdoll creator — GM first
// real taps on the owner's phone sizes and the iPad: hair · face · eyes · eye colour · mouth · body · skin tone each its own choice, every option and swatch 44 px+, none over another,
// nothing to scroll, text 12 px+ · the pieces are drawn as delivered (only the cape, and the colours the child picks, change — and only inside Codex's regions for that group)
// · the made child keeps every choice, walks with Codex's south walk, shows in the HUD and on the select screen after a reload · the frames do not drop (within 10 %)
// · a device without GM gets the gender's own sprite · a player without GM keeps the 2.18 creator · json missing → the 2.18 creator · one piece missing → only that option goes
// · stage B (B1 11d6ce1): the 8-direction walking pieces, unmoved, coloured only in their regions · walking pieces missing → stage A's south walk and the glide
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-pd-219';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function tap(p,el){if(typeof el==='string'){const s=el;el=await p.$(s);if(!el)throw Error('no '+s)}const r=await el.boundingBox();if(!r)throw Error('hidden');await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(300)}
const open=async(p,q)=>{await p.goto(base+'?rank=1'+(q||''),{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1800)};
// every target the child can tap on the right panel (inside the sub-panels too), the text, and whether the panel has to scroll
const audit=p=>p.evaluate(()=>{const side=document.querySelector('#cr .side'),seen=e=>{let q=e;while(q&&q!==document.body){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'||+t.opacity<.1)return false;q=q.parentElement}const b=e.getBoundingClientRect();return b.width>1&&b.height>1};
  const T=[...side.querySelectorAll('button')].filter(seen),rects=T.map(e=>{const b=e.getBoundingClientRect();return {id:(e.id||e.dataset.sub||e.dataset.pd&&e.dataset.pd+e.dataset.n||e.className||'b').toString().slice(0,20),x:b.left,y:b.top,w:b.width,h:b.height}});
  const small=rects.filter(r=>r.w<43.5||r.h<43.5).map(r=>r.id+' '+Math.round(r.w)+'×'+Math.round(r.h)),over=[];for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],c=rects[j];if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>1&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>1)over.push(a.id+'/'+c.id)}
  const outS=rects.filter(r=>r.x<-.5||r.y<-.5||r.x+r.w>innerWidth+.5||r.y+r.h>innerHeight+.5).map(r=>r.id);let minPx=99,cut=0;
  for(const e of side.querySelectorAll('*')){if(!seen(e)||![...e.childNodes].some(n=>n.nodeType===3&&n.data.trim()))continue;const cs=getComputedStyle(e);minPx=Math.min(minPx,parseFloat(cs.fontSize));const r=e.getBoundingClientRect(),pr=e.closest('button')?.getBoundingClientRect();if(pr&&(r.left<pr.left-1||r.right>pr.right+1))cut++}
  const body=side.querySelector('.body');return {n:rects.length,small,over,outS,minPx,cut,scroll:body.scrollHeight-body.clientHeight}});
// which group (1 hair · 2 eye · 3 skin · 4 mouth · 5 cape) the top piece has at each pixel where two looks differ
const diff=(p,a,ha,b,hb)=>p.evaluate((a,ha,b,hb)=>{const px=c=>c.getContext('2d').getImageData(0,0,896,64).data,A=a==='raw'?null:px(pd219Full(a,ha).full),B=px(pd219Full(b,hb).full);
  const raw=document.createElement('canvas');raw.width=896;raw.height=64;const rg=raw.getContext('2d');const L=pd219Layers(b);for(const f of L)rg.drawImage(PD219.img[f],0,0);const R=A||px(raw);
  const al=L.map(f=>{const c=document.createElement('canvas');c.width=896;c.height=64;c.getContext('2d').drawImage(PD219.img[f],0,0);return c.getContext('2d').getImageData(0,0,896,64).data});
  const n=[0,0,0,0,0,0];let total=0;for(let j=0;j<896*64;j++){const i=j*4;if(R[i]===B[i]&&R[i+1]===B[i+1]&&R[i+2]===B[i+2]&&R[i+3]===B[i+3])continue;total++;let top=-1;for(let k=L.length-1;k>=0;k--)if(al[k][i+3]){top=k;break}n[top<0?0:PD219.cls[L[top]][j]]++}return {total,n}},a,ha,b,hb);
const fps=p=>p.evaluate(async()=>{let n=0;const t0=performance.now();await new Promise(res=>{const f=()=>{n++;if(performance.now()-t0<2500)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});return +(n/2.5).toFixed(1)});
const avg=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,mode] of [['gm844',844,390,3,'full'],['gm812',812,330,3,'look'],['gm915',915,412,2.625,'look'],['gm1180',1180,820,2,'look'],['gmEN844',844,390,3,'en'],['player844',844,390,3,'player'],['nojson844',844,390,3,'nojson'],['nohair3',844,390,3,'nohair3'],['noface1',844,390,3,'noface1'],['nowalk844',844,390,3,'nowalk']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  const block={nojson:/pd-kid\.json/,nohair3:/pd-kid-hair-3\.png/,noface1:/pd-kid-face-1\.png/,nowalk:/-walk\.png/}[mode];if(block){await p.setRequestInterception(true);p.on('request',r=>block.test(r.url())?r.abort():r.continue())}
  await open(p,mode==='player'?'':'&gm');await tap(p,'#cg194 [data-g="f"]');await sleep(1200);const R={name};
  R.state=await p.evaluate(()=>({ok:PD219.ok,pd:$('cr').classList.contains('pd219'),tabs:[...document.querySelectorAll('#cr .rail [data-tab]')].map(b=>b.dataset.tab),hair:document.querySelectorAll('#pd219hair .opt').length,ck:getComputedStyle($('ck')).display}));
  if(mode==='player'||mode==='nojson'||mode==='noface1'){assert(!R.state.pd&&R.state.tabs.join()==='age,hair,face,house,hat'&&R.state.hair===0,name+': the 2.18 creator '+JSON.stringify(R.state));
   await tap(p,'#cgo');await sleep(1500);R.made=await p.evaluate(()=>({pd:'pd219' in S,kid:S.kid,F:PS.F,pdSheet:!!PS.pd219}));assert(!R.made.pd&&R.made.kid===0&&!R.made.pdSheet,name+': an old-style child '+JSON.stringify(R.made));
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  assert(R.state.ok&&R.state.pd&&R.state.tabs.join()==='age,hair,face,body,house'&&R.state.ck==='none',name+': the paperdoll creator '+JSON.stringify(R.state));
  if(mode==='nowalk'){await tap(p,'#cgo');await sleep(2000);R.made=await p.evaluate(()=>{const {full}=pd219Full(S.pd219,S.house),a=document.createElement('canvas');a.width=384;a.height=64;a.getContext('2d').drawImage(full,512,0,384,64,0,0,384,64);const b=document.createElement('canvas');b.width=384;b.height=64;b.getContext('2d').drawImage(PS.walk,0,0,384,64,0,0,384,64);
     const x=a.getContext('2d').getImageData(0,0,384,64).data,y=b.getContext('2d').getImageData(0,0,384,64).data;return {real:PS.pdWalk219,flag:PS.pd219,row0:x.every((v,i)=>v===y[i])}});
   assert(R.made.flag&&R.made.real===false&&R.made.row0,'walking pieces missing: stage A walk '+JSON.stringify(R.made));assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  if(mode==='nohair3'){assert.equal(R.state.hair,2,'hair 3 missing: two hairstyles');assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  assert.equal(R.state.hair,3);
  if(mode==='en'){await tap(p,'#cLang');await sleep(500);assert.equal(await p.evaluate(()=>LANG),'en')}
  // every tab and sub-tab: the targets, the text, no scrolling
  R.tabs={};for(const tb of ['hair','face','body']){await tap(p,`#cr .rail [data-tab="${tb}"]`);const n=(await p.$$('#cr .side .tp.on .sub4 button')).length;
   for(let si=0;si<Math.max(1,n);si++){if(n)await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[si]);const A=await audit(p),k=tb+(n?si:'');R.tabs[k]=[A.n,A.scroll,A.minPx];
    assert(!A.small.length&&!A.over.length&&!A.outS.length,name+' '+k+' targets: '+JSON.stringify(A));assert(A.minPx>=12&&A.cut===0,name+' '+k+' text: '+JSON.stringify(A));assert(A.scroll<=1,name+' '+k+' scrolls '+A.scroll);
    if(width===844||width===1180)await p.screenshot({path:path.join(out,name+'-'+k+'.png')})}}
  assert.equal(Object.keys(R.tabs).length,7,'hair ×2 · face ×4 · body');
  if(mode==='en'){R.words=await p.evaluate(()=>[...document.querySelectorAll('#cr .side .sub4 button,#cr .pd219g .opt span,#cr .rail small')].map(e=>e.textContent));assert(R.words.every(w=>/^[\x20-\x7e·]+$/.test(w)),'English words: '+R.words)}
  if(mode!=='full'){assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // the pieces as delivered: with the original colours only the cape (house colour) differs from Codex's layers stacked at (0,0)
  const o0={v:1,hair:1,face:1,eyes:1,mouth:1,body:1,hc:-1,ec:-1,tn:1};R.asIs=await diff(p,'raw',0,o0,0);assert(R.asIs.total>0&&R.asIs.total===R.asIs.n[5],'only the cape: '+JSON.stringify(R.asIs));
  // each colour changes only its own group
  for(const [k,o,h,g] of [['hair',{...o0,hc:2},0,1],['eye',{...o0,ec:3},0,2],['tone',{...o0,tn:3},0,[3,4]],['house',o0,2,5]]){const d=await diff(p,o0,0,o,h),gs=[].concat(g);R[k]=d;assert(d.total>40&&gs.reduce((s,x)=>s+d.n[x],0)===d.total,k+' only in its regions: '+JSON.stringify(d))}
  // each option looks different from the first one
  R.distinct={};for(const [part,ns] of [['hair',[2,3]],['face',[2]],['eyes',[2,3]],['mouth',[2,3]],['body',[2]]])for(const n of ns){const d=await diff(p,o0,0,{...o0,[part]:n},0);R.distinct[part+n]=d.total;assert(d.total>=8,part+n+' differs: '+d.total)}
  // real taps: each option, then the colours, tone, house — the preview follows every tap
  const pv=()=>p.evaluate(()=>{const c=$('cpv');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.reduce((h,v,i)=>(h*31+v*(i%7+1))>>>0,7)});
  R.taps=0;const pick=async(tb,si,sel)=>{await tap(p,`#cr .rail [data-tab="${tb}"]`);if(si!=null)await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[si]);const a=await pv();await tap(p,sel);await sleep(150);const b=await pv();if(a!==b)R.taps++;return a!==b};
  for(const [tb,si,sel] of [['hair',0,'#pd219hair .opt[data-n="3"]'],['face',0,'#pd219face .opt[data-n="2"]'],['face',0,'#pd219tone .sw[data-v="2"]'],['face',1,'#pd219eyes .opt[data-n="3"]'],['face',2,'#cec .sw[data-v="3"]'],['face',3,'#pd219mouth .opt[data-n="2"]'],['body',null,'#pd219body .opt[data-n="2"]'],['hair',1,'#chc .sw[data-v="4"]'],['house',null,'#ch .opt:nth-child(3)']])
   assert(await pick(tb,si,sel),'the preview changes: '+sel);
  R.marks=await p.evaluate(()=>[...document.querySelectorAll('.pd219g')].map(g=>[...g.querySelectorAll('.opt')].filter(b=>b.classList.contains('on')).map(b=>b.dataset.pd+b.dataset.n).join()));
  assert.deepEqual(R.marks,['hair3','face2','eyes3','mouth2','body2'],'one chosen each');R.chosen=await p.evaluate(()=>({...pd219Cur(),house:CR_STATE.house}));
  assert.deepEqual(R.chosen,{v:1,hair:3,face:2,eyes:3,mouth:2,body:2,hc:4,ec:3,tn:2,house:2});
  // the chosen mark is a frame and a tick, not only a colour
  R.mark=await p.evaluate(()=>{const on=document.querySelector('#pd219body .opt.on'),off=document.querySelector('#pd219body .opt:not(.on)'),k=e=>[getComputedStyle(e).borderTopColor,getComputedStyle(e).boxShadow,getComputedStyle(e,'::after').content].join('|');return k(on)!==k(off)&&getComputedStyle(on,'::after').content.includes('✓')});assert(R.mark);
  // the turn button turns the paperdoll through its 8 views
  R.turn=new Set();for(let i=0;i<8;i++){R.turn.add(await pv());await tap(p,'#c3Turn')}R.turn=R.turn.size;assert(R.turn>=7,'8 views: '+R.turn);
  // the frames with the paperdoll and with the old creator drawing (three turns each)
  {const on=[],off=[];for(let i=0;i<3;i++){on.push(await fps(p));await p.evaluate(()=>{PD219.ok=false});off.push(await fps(p));await p.evaluate(()=>{PD219.ok=true})}R.fps=[avg(on),avg(off)];assert(R.fps[0]>=.9*R.fps[1],'creator frames '+JSON.stringify([on,off]))}
  // the dice: different looks, always valid
  {const seen=new Set();for(let i=0;i<10;i++){await tap(p,'#c3Rand');const c=await p.evaluate(()=>{const c=pd219Cur();return pd219Look(c)?JSON.stringify(c):'bad'});assert.notEqual(c,'bad');seen.add(c)}R.dice=seen.size;assert(R.dice>=5,'dice looks: '+R.dice)}
  // back to the chosen look, then make the child
  await p.evaluate(c=>{Object.assign(CR_STATE.pd,{hair:c.hair,face:c.face,eyes:c.eyes,mouth:c.mouth,body:c.body,tn:c.tn});CR_STATE.hcol=c.hc;CR_STATE.ecol=c.ec;CR_STATE.house=c.house;crRefresh()},R.chosen);
  await tap(p,'#cname');await p.keyboard.type('Mina');await tap(p,'#cgo');await sleep(2200);
  R.made=await p.evaluate(()=>{const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]),{full,stand}=pd219Full(S.pd219,S.house);
    const w=document.createElement('canvas');w.width=384;w.height=64;w.getContext('2d').drawImage(full,512,0,384,64,0,0,384,64);const row0=document.createElement('canvas');row0.width=384;row0.height=64;row0.getContext('2d').drawImage(PS.walk,0,0,384,64,0,0,384,64);
    const hp=document.getElementById('hudPortrait'),hc=document.createElement('canvas');hc.width=hc.height=64;hc.getContext('2d').drawImage(stand,0,0,64,64,0,0,64,64);
    return {pd:S.pd219,kid:S.kid,house:S.house,name:S.name,F:PS.F,stand:same(px(PS.stand),px(stand)),walkS:same(px(row0),px(w)),walk:[PS.walk.width,PS.walk.height],hud:!!hp&&same(px(hp),px(hc)),flag:PS.pd219}});
  const {house,...look}=R.chosen;assert.deepEqual(R.made.pd,look,'saved pieces');assert(R.made.kid===0&&R.made.house===2&&R.made.name==='Mina'&&R.made.F===64&&R.made.stand&&R.made.walkS&&R.made.walk.join()==='384,512'&&R.made.flag,'in the world: '+JSON.stringify(R.made));
  assert(R.made.hud,'HUD portrait');
  // stage B: Codex's walking pieces in all 8 rows — nothing moved (the outline is exactly his pieces stacked), colours changed only inside his regions, each row a real stride
  R.walkB=await p.evaluate(()=>{const L=pd219WLayers(S.pd219),raw=document.createElement('canvas');raw.width=384;raw.height=512;const rg=raw.getContext('2d');for(const f of L)rg.drawImage(PD219.img[f],0,0);
    const A=rg.getImageData(0,0,384,512).data,B=PS.walk.getContext('2d').getImageData(0,0,384,512).data,al=L.map(f=>toCanvas(PD219.img[f]).getContext('2d').getImageData(0,0,384,512).data);let alpha=0,outside=0,changed=0;
    for(let j=0;j<384*512;j++){const i=j*4;if((A[i+3]>0)!==(B[i+3]>0))alpha++;if(A[i]===B[i]&&A[i+1]===B[i+1]&&A[i+2]===B[i+2])continue;changed++;let top=-1;for(let k=L.length-1;k>=0;k--)if(al[k][i+3]){top=k;break}if(top<0||!PD219.cls[L[top]][j])outside++}
    const stride=[];for(let r=0;r<8;r++){let d=0;for(let y=r*64;y<r*64+64;y++)for(let x=0;x<64;x++){const a0=B[(y*384+x)*4+3]>0,a2=B[(y*384+x+128)*4+3]>0;if(a0!==a2)d++}stride.push(d)}return {real:PS.pdWalk219,files:L.length,alpha,changed,outside,stride}});
  assert(R.walkB.real&&R.walkB.files===6&&R.walkB.alpha===0&&R.walkB.changed>500&&R.walkB.outside===0&&R.walkB.stride.every(d=>d>=40),'walking pieces: '+JSON.stringify(R.walkB));
  // walking south uses Codex's walk frames, the other directions glide on their own view
  R.walkDraw=await p.evaluate(async()=>{try{DLG=null;closeModal()}catch(e){}document.querySelectorAll('#cr').forEach(e=>e.classList.add('hide'));const seen=new Set(),rows=new Set();P.path=P.act=null;gmGhost(true);
    for(const [k,row] of [['ArrowDown',0],['ArrowRight',2],['ArrowUp',4]]){keys[k]=1;for(let i=0;i<20;i++){PAUSE=false;DLG=null;await new Promise(r=>setTimeout(r,40));if(P.moving){rows.add(P.row);seen.add(Math.floor(P.dist/10)%6)}}keys[k]=0;await new Promise(r=>setTimeout(r,150))}gmGhost(false);return {rows:[...rows].sort(),frames:seen.size}});
  assert(R.walkDraw.rows.length>=2&&R.walkDraw.frames>=3,'walks: '+JSON.stringify(R.walkDraw));await p.screenshot({path:path.join(out,name+'-world.png')});
  {const on=[],off=[];for(let i=0;i<3;i++){on.push(await fps(p));await p.evaluate(()=>{window.__pd=S.pd219;delete S.pd219;buildPlayerSheets()});off.push(await fps(p));await p.evaluate(()=>{S.pd219=window.__pd;buildPlayerSheets()})}R.fpsWorld=[avg(on),avg(off)];assert(R.fpsWorld[0]>=.9*R.fpsWorld[1],'world frames '+JSON.stringify([on,off]))}
  await p.evaluate(()=>{save();const d=Store.all();d.cur=-1;Store.put(d)});   /* the select screen on the next open (else the game resumes this child) */
  // reload (GM): the select screen shows the paperdoll in the list and on the stand; starting keeps it
  await open(p,'&gm');R.pick=await p.evaluate(()=>{const s=Store.all().slots[0],c=document.querySelector('#pk .pn canvas'),e=document.createElement('canvas');e.width=e.height=64;const g=e.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(pd219Full(s.pd219,s.house).stand,0,0,64,64,-8,-4,80,80);
    const a=c.getContext('2d').getImageData(0,0,64,64).data,b=g.getImageData(0,0,64,64).data;let d=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])d++;return {p193:$('cr').classList.contains('p193'),diff:d,pd:!!s.pd219}});
  assert(R.pick.p193&&R.pick.pd&&R.pick.diff===0,'select list: '+JSON.stringify(R.pick));await p.screenshot({path:path.join(out,name+'-select.png')});
  await tap(p,'#pGo');await sleep(2000);R.again=await p.evaluate(()=>{const {stand}=pd219Full(S.pd219,S.house),a=PS.stand.getContext('2d').getImageData(0,0,512,64).data,b=stand.getContext('2d').getImageData(0,0,512,64).data;return a.every((v,i)=>v===b[i])});assert(R.again,'after reload');
  // the same save on a device without GM: the gender's own sprite in the chosen hair and eye colours
  await p.evaluate(()=>{save();const d=Store.all();d.cur=-1;Store.put(d)});await open(p,'');R.noGM=await p.evaluate(()=>({tried:PD219.tried,p193:$('cr').classList.contains('p193')}));await tap(p,'#pGo');await sleep(2000);
  R.noGM=Object.assign(R.noGM,await p.evaluate(()=>({flag:PS.pd219,F:PS.F,kid:S.kid,hcol:S.hcol,ecol:S.ecol,pd:!!S.pd219})));assert(!R.noGM.tried&&!R.noGM.flag&&R.noGM.F===64&&R.noGM.kid===0&&R.noGM.hcol===4&&R.noGM.ecol===3&&R.noGM.pd,'without GM: '+JSON.stringify(R.noGM));
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
