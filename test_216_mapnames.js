// Claude 2.16 (Codex set 05 A3, ASSET_SPEC_05 ฉบับ 3): the map name under the small map never breaks inside a place name — measured on every real name in the game
// 4 screens (812×330 · 844×390 · 915×412 · 1180×820) × child (7) / grown-up (30) × Thai / English × 7 map names (+ the rain and dawn icons, the longest prefix) + the GM name "(ฉากใหม่)"
// each: one line · no letter over the small map · font seen ≥ 12 px · name inside the map card and the card inside the screen · the card over no button and not over the HUD · the small map keeps its size
// · the same page without the new sheet (ui216 off) is measured too, to show what it fixes · frames with/without the sheet (CLAUDE.md rule 5: not more than 10 % lower)
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-mapnames-216';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const MAPS=['h9','farm','royal','cavemouth','hunt1','town2','room'];
const start=(p,age,lang)=>p.evaluate((age,lang)=>{const d=Store.all();d.slots=[newSave({name:'Pim',kid:age<10?0:5,house:1,age})];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;S.lang=lang;LANG=lang;if(age>=10)S.lv=12;ensureDaily();S.daily.seen=1;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}goMap('h9');P.path=P.act=null},age,lang);
// one map: the name as the game shows it, then with the longest prefix (dawn + rain), measured at once before the HUD writes it again
const measure=(p,m)=>p.evaluate(async m=>{try{goMap(m)}catch(e){return null}P.path=P.act=null;await new Promise(r=>setTimeout(r,450));if(!M||!M.nameKey)return null;
  const e=$('mmn'),w=$('mmw'),cv=$('mm'),shown=e.textContent;
  const seen=el=>{let q=el;while(q){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'||+t.opacity<.2)return false;q=q.parentElement}const b=el.getBoundingClientRect();return b.width>1&&b.height>1};
  const one=()=>{const b=e.getBoundingClientRect(),wb=w.getBoundingClientRect(),cb=cv.getBoundingClientRect(),cs=getComputedStyle(e),lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2,sc=e.offsetHeight?b.height/e.offsetHeight:1;
    // lines from the rows the letters sit on
    let onMap=0;const tops=new Set(),wk=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=wk.nextNode())for(let i=0;i<n.length;i++){const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);for(const r of rg.getClientRects())if(r.width>0){tops.add(Math.round(r.top/4));if(Math.min(r.right,cb.right)-Math.max(r.left,cb.left)>0.5&&Math.min(r.bottom,cb.bottom)-Math.max(r.top,cb.top)>0.5)onMap++}}
    const others=[...document.querySelectorAll('button,#hud')].filter(x=>!w.contains(x)&&!x.closest('#modal,#cr,#title,#picker,#dlg')&&seen(x)),over=[];
    for(const x of others){const r=x.getBoundingClientRect(),ox=Math.min(wb.right,r.right)-Math.max(wb.left,r.left),oy=Math.min(wb.bottom,r.bottom)-Math.max(wb.top,r.top);if(ox>1&&oy>1)over.push((x.id||x.className||x.tagName)+' '+Math.round(ox)+'×'+Math.round(oy))}
    return {lines:tops.size,px:+(parseFloat(cs.fontSize)*sc).toFixed(1),cut:e.scrollWidth>e.clientWidth+1,inCard:b.left>=wb.left-1&&b.right<=wb.right+1&&b.top>=wb.top-1&&b.bottom<=wb.bottom+1,
      inScreen:wb.left>=0&&wb.top>=0&&wb.right<=innerWidth+.5&&wb.bottom<=innerHeight+.5,cardW:Math.round(wb.width),cardH:Math.round(wb.height),map:[Math.round(cb.width),Math.round(cb.height)],onMap,over}};
  const a=one();e.textContent='🌅🌧️ '+t(M.nameKey);const b=one();e.textContent=shown;return {m,name:shown,shown:a,longest:b}},m);
const fps=p=>p.evaluate(async()=>{let last=performance.now(),n=0,hitch=0;const t0=last,pts=[[1,0],[0,1],[-1,0],[0,-1]];let k=0;const iv=setInterval(()=>{const q=pts[k++%4];P.path=[[P.x+q[0]*96,P.y+q[1]*96]]},700);
  await new Promise(res=>{const f=()=>{const t=performance.now();if(t-last>50)hitch++;last=t;n++;if(t-t0<3000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});clearInterval(iv);return {fps:+(n/3).toFixed(1),hitch}});
const ok=x=>x.onMap===0&&x.lines===1&&x.px>=12&&!x.cut&&x.inCard&&x.inScreen&&x.over.length===0;
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['812x330',812,330,3],['844x390',844,390,3],['915x412',915,412,2.625],['1180x820',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2000);const R={name,cases:0,bad:[],before:{multi:0},cardW:[0,0],map:null};
  R.map={};for(const age of [7,30])for(const lang of ['th','en']){await start(p,age,lang);await sleep(1500);
   // first the same names without the new sheet: how many broke over lines before, and the small map's size per map
   await p.evaluate(()=>{$('ui216').disabled=true});const was={};for(const m of MAPS){const x=await measure(p,m);if(!x)continue;if(x.shown.lines>1)R.before.multi++;was[m]=x.shown.map}await p.evaluate(()=>{$('ui216').disabled=false});
   for(const m of MAPS){const x=await measure(p,m);if(!x)continue;if(lang==='en'&&m!=='room'&&!/[A-Za-z]/.test(x.name)||lang==='th'&&!/[\u0E00-\u0E7F]/.test(x.name))R.bad.push({age,lang,m,notInLang:x.name});for(const k of ['shown','longest']){R.cases++;const v=x[k];if(!ok(v))R.bad.push({age,lang,m,k,name:x.name,...v});R.cardW[age<10?0:1]=Math.max(R.cardW[age<10?0:1],v.cardW);
     if(was[m]&&(v.map[0]!==was[m][0]||v.map[1]!==was[m][1]))R.bad.push({age,lang,m,k,mapSize:v.map,was:was[m]})}R.map[(age<10?'kid':'adult')]=x.shown.map}
   if(age===30&&lang==='th'&&name==='844x390'){await p.evaluate(()=>{goMap('royal');P.path=P.act=null});await sleep(700);await p.screenshot({path:path.join(out,name+'-adult-royal.png')});
    await p.evaluate(()=>{goMap('town2');P.path=P.act=null});await sleep(700);await p.screenshot({path:path.join(out,name+'-adult-town2.png')})}
   if(age===7&&lang==='th'){await p.evaluate(()=>{goMap('royal');P.path=P.act=null});await sleep(700);await p.screenshot({path:path.join(out,name+'-kid-royal.png')})}
   if(age===30&&lang==='en'&&name==='844x390'){await p.evaluate(()=>{goMap('town2');P.path=P.act=null});await sleep(700);await p.screenshot({path:path.join(out,name+'-adult-en-town2.png')})}}
  // the small map: the same size with and without the sheet (checked above, map size per age before vs after)
  // frames with and without the sheet (grown-up, the wider card)
  await start(p,30,'th');await sleep(1500);await p.evaluate(()=>{goMap('royal');P.path=P.act=null});await sleep(600);await fps(p);R.fps=await fps(p);await p.evaluate(()=>{$('ui216').disabled=true});R.fpsWithout=await fps(p);await p.evaluate(()=>{$('ui216').disabled=false});
  assert(R.fps.fps>=0.9*R.fpsWithout.fps,'frames with/without the sheet: '+JSON.stringify([R.fps,R.fpsWithout]));
  assert.deepEqual(R.bad,[],name+': '+JSON.stringify(R.bad.slice(0,6)));assert.equal(R.cases,56,'7 maps × 2 prefixes × child/grown-up × Thai/English');assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  // GM: the owner's own view of the village says "(ฉากใหม่)"
  for(const [name,width,height,dpr] of [['gm844',844,390,3],['gm1180',1180,820,2]]){const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});await p.setBypassServiceWorker(true);await p.goto(base+'?gm',{waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:60000});
   await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.seen={intro:1};ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2000);
   const x=await measure(p,'h9'),R={name,text:x.name,shown:x.shown,longest:x.longest};assert(ok(x.shown)&&ok(x.longest),name+' GM village name: '+JSON.stringify(x));await p.screenshot({path:path.join(out,name+'-village.png')});
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
