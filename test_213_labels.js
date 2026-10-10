// Claude 2.13 (Codex set 05 A1, owner 10 Oct 12:0x "ผ่าน · เด็กไม่เห็นตัวเลข EXP"): the labels a child reads every day, measured as seen (HUD scale included)
// ASSET_SPEC_05 §6: every label ≥ 11 px seen (12 recommended: asserted 12) · no label cut or outside its button / the screen · main buttons 44 px+ and not on top of each other
// · frames not lower than the same page without the new sheet (within 10 %) · plus the owner's choice: a child (< 10) sees the EXP bar without its numbers, a grown-up sees the numbers
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-labels-213';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?rank=1';
const start=(p,age)=>p.evaluate(age=>{const d=Store.all();d.slots=[newSave({name:'Pim',kid:age<10?0:5,house:1,age})];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;if(age>=10)S.lv=12;ensureDaily();S.daily.seen=1;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}goMap('capital');P.path=P.act=null},age);
// a label as seen: font size × the scale of its boxes (the HUD is drawn at 0.7), cut text, inside its button and the screen
const LABELS=p=>p.evaluate(()=>{const seen=e=>{const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')return false;let q=e;while(q){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'||+t.opacity<.2)return false;q=q.parentElement}const b=e.getBoundingClientRect();return b.width>1&&b.height>1};
  const one=(e,name)=>{const b=e.getBoundingClientRect(),sc=e.offsetHeight?b.height/e.offsetHeight:1,fs=parseFloat(getComputedStyle(e).fontSize)*sc,btn=e.closest('button'),bb=btn?btn.getBoundingClientRect():null;
    return {name,text:e.textContent.trim(),px:+fs.toFixed(1),cut:e.scrollWidth>e.clientWidth+1,inBtn:!bb||(b.left>=bb.left-1&&b.right<=bb.right+1&&b.top>=bb.top-1&&b.bottom<=bb.bottom+1),inScreen:b.left>=0&&b.top>=0&&b.right<=innerWidth+.5&&b.bottom<=innerHeight+.5}};
  const L=[];for(const e of document.querySelectorAll('#btns .ui150-label'))if(seen(e))L.push(one(e,'top:'+(e.closest('button')||{}).id));
  for(const [sel,name] of [['#restL','rest'],['#atkL','hit'],['#mmn','mapName'],['#xpT','exp']]){const e=document.querySelector(sel);if(e&&seen(e))L.push(one(e,name))}return L});
const BUTTONS=p=>p.evaluate(()=>{const bs=[...document.querySelectorAll('#btns button,#act button,#bRest')].filter(b=>{let q=b;while(q){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden')return false;q=q.parentElement}const r=b.getBoundingClientRect();return r.width>1&&r.height>1});
  const R=bs.map(b=>{const r=b.getBoundingClientRect();return {id:b.id,x:r.left,y:r.top,w:r.width,h:r.height}});let over=[];for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],c=R[j],ox=Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x),oy=Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y);if(ox>1&&oy>1)over.push(a.id+'/'+c.id)}
  return {n:R.length,small:R.filter(b=>Math.min(b.w,b.h)<44-.5).map(b=>b.id+' '+Math.round(b.w)+'×'+Math.round(b.h)),over}});
const fps=p=>p.evaluate(async()=>{let last=performance.now(),n=0,hitch=0;const t0=last,pts=[[1,0],[0,1],[-1,0],[0,-1]];let k=0;const iv=setInterval(()=>{const q=pts[k++%4];P.path=[[P.x+q[0]*96,P.y+q[1]*96]]},700);
  await new Promise(res=>{const f=()=>{const t=performance.now();if(t-last>50)hitch++;last=t;n++;if(t-t0<3000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});clearInterval(iv);return {fps:+(n/3).toFixed(1),hitch}});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['phone844',844,390,3],['owner915',915,412,2.625],['ipad',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(url,{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2500);const R={name};
  // the creator's left rail (a fresh phone shows the creator first)
  {const g=await p.$('#cg194 [data-g="f"]');if(g){const b=await g.boundingBox();if(b){await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await sleep(600)}}}   // the rail shows once a gender is picked (as test_210)
  await p.waitForSelector('#cr.c193 .rail button small',{visible:true,timeout:20000});
  R.rail=await p.$$eval('#cr.c193 .rail button',bs=>bs.map(b=>{const s=b.querySelector('small'),r=b.getBoundingClientRect(),t=s.getBoundingClientRect();return {text:s.textContent.trim(),px:parseFloat(getComputedStyle(s).fontSize),w:Math.round(r.width),h:Math.round(r.height),cut:s.scrollWidth>s.clientWidth+1,inBtn:t.left>=r.left-1&&t.right<=r.right+1&&t.bottom<=r.bottom+1,inScreen:r.bottom<=innerHeight+.5}}));
  assert(R.rail.length>=5&&R.rail.every(b=>b.px>=12&&!b.cut&&b.inBtn&&b.inScreen&&b.w>=44&&b.h>=44),'creator rail: '+JSON.stringify(R.rail));await p.screenshot({path:path.join(out,name+'-creator.png')});
  // a 7-year-old: labels, no EXP numbers, buttons, frames
  await start(p,7);await sleep(2000);R.kid=await LABELS(p);
  assert(R.kid.length>=5,'labels found: '+JSON.stringify(R.kid));assert(!R.kid.some(l=>l.name==='exp'),'a child sees no EXP numbers');
  assert(R.kid.every(l=>l.px>=12&&!l.cut&&l.inBtn&&l.inScreen),'kid labels: '+JSON.stringify(R.kid));
  R.expBar=await p.$eval('#xpw',e=>{const r=e.getBoundingClientRect();return r.width>20&&r.height>4&&getComputedStyle(e).visibility!=='hidden'});assert(R.expBar,'the EXP bar is still there');
  R.kidBtn=await BUTTONS(p);assert(R.kidBtn.small.length===0&&R.kidBtn.over.length===0,'kid buttons: '+JSON.stringify(R.kidBtn));
  // frames with the new sheet against the same page without it (CLAUDE.md rule 5: not more than 10 % lower)
  await fps(p);   // warm-up walk (the first 3 s after a start build the scene: measured 56 vs 59 later, with and without the sheet alike)
  R.kidFps=await fps(p);await p.evaluate(()=>{$('ui213').disabled=true});R.fpsWithout=await fps(p);await p.evaluate(()=>{$('ui213').disabled=false});await sleep(300);
  assert(R.kidFps.fps>=0.9*R.fpsWithout.fps&&R.kidFps.hitch===0,'frames with/without: '+JSON.stringify([R.kidFps,R.fpsWithout]));await p.screenshot({path:path.join(out,name+'-kid.png')});
  // a tap on the bag still opens it
  {const b=await (await p.$('#bBag')).boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await sleep(600);R.bagOpens=await p.evaluate(()=>!$('modal').classList.contains('hide'));assert(R.bagOpens);await p.evaluate(()=>closeModal());await sleep(300)}
  // a grown-up: the EXP numbers show and are big enough
  // a grown-up: 2.15 Codex set 05 A2 (its own sheet ui215, selectors body:not(.kidmin171)) · every label ≥ 12 px seen, EXP numbers ≥ 12 · nothing cut, no button over another or the map box
  await start(p,30);await sleep(2000);R.adult=await LABELS(p);const ex=R.adult.find(l=>l.name==='exp');assert(ex&&ex.px>=12&&!ex.cut,'grown-up EXP numbers: '+JSON.stringify(ex));
  R.adultSheet=await p.evaluate(()=>document.body.classList.contains('kidmin171'));assert.equal(R.adultSheet,false);
  assert(R.adult.every(l=>l.px>=12&&!l.cut&&l.inScreen),'adult labels: '+JSON.stringify(R.adult));R.adultBtn=await BUTTONS(p);assert(R.adultBtn.small.length===0&&R.adultBtn.over.length===0,'adult buttons: '+JSON.stringify(R.adultBtn));
  // the grown-ups' guide (and bot) buttons are never under the map box, also with a two-line map name (2.11 overlapped by 8 px there)
  R.guide=await p.evaluate(async()=>{const res={};for(const m of ['capital','royal','hunt1']){if(!MAPS[m])continue;goMap(m);P.path=P.act=null;await new Promise(r=>setTimeout(r,500));const mm=$('mmw').getBoundingClientRect(),o={lines:Math.round($('mmn').getBoundingClientRect().height/parseFloat(getComputedStyle($('mmn')).lineHeight))};
    for(const id of ['bQuest','bAuto']){const b=$(id);if(!b)continue;{let q=b,hid=false;while(q){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'){hid=true;break}q=q.parentElement}if(hid||!b.getBoundingClientRect().width)continue}const c=b.getBoundingClientRect(),ox=Math.min(mm.right,c.right)-Math.max(mm.left,c.left),oy=Math.min(mm.bottom,c.bottom)-Math.max(mm.top,c.top);o[id]={over:ox>1&&oy>1,inScreen:c.left>=0&&c.right<=innerWidth+.5&&c.top>=0}}res[m]=o}goMap('capital');P.path=P.act=null;return res});
  assert(R.guide.capital&&R.guide.capital.bQuest&&Object.values(R.guide).every(o=>Object.entries(o).every(([k,b])=>k==='lines'||(!b.over&&b.inScreen))),'guide button clear of the map box: '+JSON.stringify(R.guide));
  R.adultBtn2=await BUTTONS(p);assert(R.adultBtn2.over.length===0,'after the move: '+JSON.stringify(R.adultBtn2));
  await p.screenshot({path:path.join(out,name+'-adult.png')});await p.evaluate(()=>{goMap('royal');P.path=P.act=null});await sleep(700);await p.screenshot({path:path.join(out,name+'-adult-royal.png')});
  assert.deepEqual(errors,[]);R.errors=0;R.kid=R.kid.map(l=>l.name+' '+l.px);R.adult=R.adult.map(l=>l.name+' '+l.px);R.rail=R.rail.map(b=>b.text+' '+b.px);results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
