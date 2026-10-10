// Claude 2.18 (Codex set 06 A1, ASSET_SPEC_06, owner passed 10 Oct "ผ่าน ใส่ GM ก่อน"): the create screen's right panel in Quiet Gold — GM first
// 4 screens (812×330 · 844×390 · 915×412 · 1180×820), every tab and sub-tab, real taps: every target 44×44 px+, no two over each other, inside the screen; text ≥ 12 px, none cut,
// contrast ≥ 4.5:1 against the solid colour behind it; the chosen age / sub-tab / hairstyle / colour / house differs by a frame or mark, not only its fill; the panel never covers
// the character; the create button on screen; the frames not lower (within 10 %) than the same page without the sheet · then a character made with real taps keeps every choice
// · a player without GM keeps the 2.17 panel · 2.19: the tabs are read from the rail (GM: age · hair · face · body · house)
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-panel-218';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function tap(p,el){if(typeof el==='string')el=await p.$(el);const r=await el.boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(300)}
const audit=p=>p.evaluate(()=>{const side=document.querySelector('#cr .side'),sr=side.getBoundingClientRect();const seen=e=>{let q=e;while(q&&q!==document.body){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'||+t.opacity<.1)return false;q=q.parentElement}const b=e.getBoundingClientRect();return b.width>1&&b.height>1};
  const T=[...side.querySelectorAll('button,.opt,.sw,.sp')].filter(e=>seen(e)&&!e.parentElement.closest('button,.opt,.sp'));const cg=document.getElementById('cgo');if(cg&&seen(cg)&&!T.includes(cg))T.push(cg);
  const rects=T.map(e=>{const b=e.getBoundingClientRect();return {id:(e.id||e.className||e.tagName).toString().slice(0,24),x:b.left,y:b.top,w:b.width,h:b.height}});
  const small=rects.filter(r=>r.w<43.5||r.h<43.5).map(r=>r.id+' '+Math.round(r.w)+'×'+Math.round(r.h));const over=[];for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],c=rects[j];if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>1&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>1)over.push(a.id+'/'+c.id)}
  const outScreen=rects.filter(r=>r.x<-.5||r.y<-.5||r.x+r.w>innerWidth+.5||r.y+r.h>innerHeight+.5).map(r=>r.id);
  const lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)},rgb=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0]};
  let minPx=99,minC=99,cut=0,worst='',checked=0;for(const e of side.querySelectorAll('*')){if(!seen(e)||![...e.childNodes].some(n=>n.nodeType===3&&n.data.trim()))continue;const cs=getComputedStyle(e);minPx=Math.min(minPx,parseFloat(cs.fontSize));if(e.scrollWidth>e.clientWidth+1&&cs.overflow!=='visible')cut++;
    let q=e,bg=null;while(q){const t=getComputedStyle(q),c=rgb(t.backgroundColor);if(t.backgroundImage!=='none'&&!(c[3]>.9)){bg=null;break}if(c.length<4||c[3]>.9){bg=c;break}q=q.parentElement}if(!bg)continue;checked++;
    const L1=lum(rgb(cs.color)),L2=lum(bg),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);if(cr<minC){minC=cr;worst=e.textContent.trim().slice(0,14)}}
  const cpv=document.getElementById('cpv').getBoundingClientRect(),cover=Math.min(cpv.right,sr.right)-Math.max(cpv.left,sr.left)>1&&Math.min(cpv.bottom,sr.bottom)-Math.max(cpv.top,sr.top)>1;
  const marks={};for(const g of ['#ca button','.tp.on .sub4 button','.tp.on .sp','.tp.on .sw','#ch .opt']){const es=[...side.querySelectorAll(g)].filter(seen);const on=es.find(e=>e.classList.contains('on')||/rgb\(66, 82, 196\)/.test(e.getAttribute('style')||'')),off=es.find(e=>e!==on);if(!on||!off)continue;
    const k=e=>{const s=getComputedStyle(e);return [s.borderTopColor,s.borderTopWidth,s.outlineStyle,s.boxShadow,getComputedStyle(e,'::before').content,getComputedStyle(e,'::after').content].join('|')};marks[g]=k(on)!==k(off)}
  return {side:[Math.round(sr.width),Math.round(sr.height)],n:rects.length,small,over,outScreen,minPx,minContrast:+minC.toFixed(2),worst,checked,cut,cover,marks,cream:getComputedStyle(side).backgroundColor}});
const fps=p=>p.evaluate(async()=>{let n=0,last=performance.now(),hitch=0;const t0=last;await new Promise(res=>{const f=()=>{const t=performance.now();if(t-last>50)hitch++;last=t;n++;if(t-t0<2500)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});return {fps:+(n/2.5).toFixed(1),hitch}});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,gm] of [['812x330',812,330,3,1],['844x390',844,390,3,1],['915x412',915,412,2.625,1],['1180x820',1180,820,2,1],['player844',844,390,3,0]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(base+'?rank=1'+(gm?'&gm':''),{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2000);await tap(p,'#cg194 [data-g="f"]');await sleep(1200);const R={name,tabs:{}};
  if(!gm){R.look=await audit(p);assert.equal(R.look.cream,'rgba(255, 248, 236, 0.933)','a player keeps the 2.17 panel');assert.deepEqual(errors,[]);R.errors=0;results.push({name,errors:0});await bc.close();continue}
  for(const tb of await p.evaluate(()=>[...document.querySelectorAll('#cr .rail [data-tab]')].map(b=>b.dataset.tab))){   /* 2.19: GM gets the paperdoll tabs (the body in place of the hat) */await tap(p,`#cr .rail [data-tab="${tb}"]`);const subs=(await p.$$('#cr .side .tp.on .sub4 button')).length;
   for(let si=0;si<Math.max(1,subs);si++){if(subs)await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[si]);const k=tb+(subs?si:''),A=await audit(p);R.tabs[k]=A;
    assert(A.small.length===0&&A.over.length===0&&A.outScreen.length===0,name+' '+k+' targets: '+JSON.stringify(A));assert(A.minPx>=12&&A.cut===0,name+' '+k+' text: '+JSON.stringify(A));
    assert(A.checked>0&&A.minContrast>=4.5,name+' '+k+' contrast: '+A.minContrast+' '+A.worst);assert(!A.cover,name+' '+k+' covers the character');assert(Object.values(A.marks).every(v=>v),name+' '+k+' chosen mark: '+JSON.stringify(A.marks));
    if(name==='844x390'||name==='1180x820')await p.screenshot({path:path.join(out,name+'-'+k+'.png')})}}
  // frames with and without the sheet
  await fps(p);{const on=[],off=[];for(let i=0;i<3;i++){on.push((await fps(p)).fps);await p.evaluate(()=>{$('ui218').disabled=true});off.push((await fps(p)).fps);await p.evaluate(()=>{$('ui218').disabled=false})}   /* three turns each: one 2.5 s sample swings ±10 % on the iPad size here */
   const avg=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);R.fps=avg(on);R.fpsWithout=avg(off);assert(R.fps>=0.9*R.fpsWithout,'frames: '+JSON.stringify([on,off]))}
  // a character made with real taps keeps every choice
  await tap(p,'#cr .rail [data-tab="age"]');await tap(p,(await p.$$('#ca button'))[3]);
  await tap(p,'#cr .rail [data-tab="hair"]');await tap(p,(await p.$$('#cr .side .tp.on .sp'))[1]);await tap(p,(await p.$$('#cr .side .tp.on .sub4 button'))[1]);await tap(p,(await p.$$('#cr .side .tp.on .sw'))[2]);
  await tap(p,'#cr .rail [data-tab="house"]');await tap(p,(await p.$$('#ch .opt'))[2]);R.chosen=await p.evaluate(()=>({...CR_STATE}));await tap(p,'#crnd');await tap(p,'#cgo');await sleep(1800);
  R.made=await p.evaluate(()=>S&&{age:S.age,kid:S.kid,house:S.house,hc:S.hc});assert(R.made&&R.made.age===R.chosen.age&&R.made.kid===R.chosen.kid&&R.made.house===2&&R.made.hc===R.chosen.hc,'made with the choices: '+JSON.stringify([R.chosen,R.made]));
  assert.deepEqual(errors,[]);R.errors=0;R.tabs=Object.fromEntries(Object.entries(R.tabs).map(([k,v])=>[k,{side:v.side,n:v.n,px:v.minPx,c:v.minContrast}]));results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
