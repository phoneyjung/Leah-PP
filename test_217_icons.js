// Claude 2.17 (Codex set 01 A1, ASSET_SPEC_01 ฉบับ 2, branch codex/asset-01-ui-buttons 0df2471): the guide · buff · sit icons and the compass stick — GM first
// real taps on the owner's phone sizes: a grown-up GM sees the three icons (24 px, the emoji hidden), the stick ring and knob; the buttons keep their size and labels, a tap still lands,
// the stick still walks; a child GM gets the sit icon and the stick; a computer keeps W A S D on the new ring · a player without GM keeps 🧭 ＋ and the 1.74 stick · files missing → the old look
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-icons-217';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const FILES=['ui-icons-2.png','joy-ring','joy-knob'];
const start=(p,age,gm)=>p.evaluate((age,gm)=>{const d=Store.all();d.slots=[newSave({name:'Pim',kid:age<10?0:5,house:1,age})];if(gm)d.slots[0].gm=1;d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};S.snd=S.mus=false;if(age>=10)S.lv=12;ensureDaily();S.daily.seen=1;
  startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}goMap('h9');P.path=P.act=null},age,gm);
const look=p=>p.evaluate(()=>{const one=id=>{const b=$(id);if(!b)return null;const r=b.getBoundingClientRect(),im=b.querySelector('img.ic217'),sm=b.querySelector('small'),cs=getComputedStyle(b);let vis=true,q=b;while(q){const t=getComputedStyle(q);if(t.display==='none'||t.visibility==='hidden'){vis=false;break}q=q.parentElement}
    const ir=im&&getComputedStyle(im).display!=='none'?im.getBoundingClientRect():null;return {vis,w:Math.round(r.width),h:Math.round(r.height),icon:im?im.dataset.k:null,iconShown:!!ir,iconSize:ir?[Math.round(ir.width),Math.round(ir.height)]:null,iconInside:!!ir&&ir.left>=r.left-1&&ir.right<=r.right+1&&ir.top>=r.top-1&&ir.bottom<=r.bottom+1,
      font:parseFloat(cs.fontSize),text:[...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.data).join('').trim(),label:sm?{px:parseFloat(getComputedStyle(sm).fontSize),cut:sm.scrollWidth>sm.clientWidth+1,text:sm.textContent}:null}};
  const r=$('bRest'),ri=r&&r.querySelector('img:not(.ic217)');return {quest:one('bQuest'),buff:one('bBuff'),rest:one('bRest'),restIcon:ri?(ri.src===ART217.url.sit?'sit':'old'):'none',
    joy:getComputedStyle($('joy')).backgroundImage,knob:getComputedStyle($('joyK')).backgroundImage,cls:['ic217','ring217','knob217'].filter(c=>document.body.classList.contains(c)).join(' ')}});
async function tapCount(p,sel){await p.evaluate(sel=>{window.tc217=0;document.querySelector(sel).addEventListener('click',()=>window.tc217++,{once:true})},sel);const r=await (await p.$(sel)).boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(400);return p.evaluate(()=>window.tc217)}
async function stick(p){const cdp=await p.createCDPSession(),a=await p.evaluate(()=>{gmGhost&&gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;return [P.x,P.y]}),j=await p.$eval('#joy',e=>{const b=e.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38,y:j.y,id:1}]});await sleep(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  const z=await p.evaluate(()=>{try{gmGhost(false)}catch(e){}return [P.x,P.y]});return Math.round(Math.hypot(z[0]-a[0],z[1]-a[1]))}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,mode,touch] of [['gm844',844,390,3,'gm',true],['gm1180',1180,820,2,'gm',true],['gmKid844',844,390,3,'kid',true],['gmPC',1280,720,1,'gm',false],['player844',844,390,3,'player',true],['missing844',844,390,3,'missing',true]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:touch,hasTouch:touch});await p.setBypassServiceWorker(true);
  if(mode==='missing'){await p.setRequestInterception(true);p.on('request',r=>FILES.some(f=>r.url().includes(f))?r.abort():r.continue())}
  await p.goto(base+'?rank=1',{waitUntil:'load'});await p.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(1500);
  await start(p,mode==='kid'?7:30,mode!=='player');await sleep(2000);const R={name};R.look=await look(p);const L=R.look;
  if(mode==='player'||mode==='missing'){assert.equal(L.cls,'',name+': no new look');assert.match(L.quest.text,/🧭/);assert.match(L.buff.text,/＋/);assert(L.quest.icon===null&&L.buff.icon===null&&L.restIcon==='old',name+': old icons');
   assert(/svg/.test(L.joy)&&!/joy-ring/.test(L.joy)&&!/joy-knob/.test(L.knob),name+': the 1.74 stick');R.walk=await stick(p);assert(R.walk>20,name+' stick walks: '+R.walk);
   await p.screenshot({path:path.join(out,name+'.png')});assert.deepEqual(errors,[]);R.errors=0;R.look=L.cls||'old';results.push(R);await bc.close();continue}
  assert(/joy-ring/.test(L.joy)&&/joy-knob/.test(L.knob),name+': the new stick '+L.joy.slice(0,80));assert.equal(L.restIcon,'sit',name+': sit icon');
  if(mode==='gm'){assert.equal(L.cls,'ic217 ring217 knob217');
   for(const k of ['quest','buff']){const b=L[k];assert(b.vis&&b.icon===(k==='quest'?'guide':'buff')&&b.iconShown&&b.iconSize[0]===24&&b.iconSize[1]===24&&b.iconInside&&b.font===0,name+' '+k+' icon: '+JSON.stringify(b));assert(b.label&&b.label.px>=12&&!b.label.cut,name+' '+k+' label: '+JSON.stringify(b.label))}
   assert(L.quest.w>=44&&L.buff.w>=44&&L.rest.w>=44,name+': buttons 44 px+');
   // BUG-32: no label is cut by a round button's edge (the buff label "เสริมพลัง" was, since 2.15)
   R.roundCut=await p.evaluate(()=>{const o=[];for(const b of document.querySelectorAll('#act button,#bRest')){const sm=b.querySelector('small');if(!sm||!b.getBoundingClientRect().width)continue;const cs=getComputedStyle(b),br=b.getBoundingClientRect();if(cs.overflow==='visible'||parseFloat(cs.borderTopLeftRadius)<br.width/2-1)continue;
     const cx=br.left+br.width/2,cy=br.top+br.height/2,R=br.width/2,rg=document.createRange();rg.selectNodeContents(sm);for(const r of rg.getClientRects())for(const [x,y] of [[r.left,r.top],[r.right,r.top],[r.left,r.bottom-r.height*.3],[r.right,r.bottom-r.height*.3]])if(Math.hypot(x-cx,y-cy)>R){o.push(b.id);break}}return o});
   assert.deepEqual(R.roundCut,[],name+': labels cut by a round edge');
   // a buff in the slot shows its own icon (the Codex icon is only for the empty slot)
   R.full=await p.evaluate(()=>{const f=$('bBuff');f.classList.remove('empty180');const im=f.querySelector('img.ic217'),r={img:getComputedStyle(im).display,font:parseFloat(getComputedStyle(f).fontSize)};f.classList.add('empty180');return r});assert(R.full.img==='none'&&R.full.font>0,'buff set: '+JSON.stringify(R.full));
   R.taps={};R.taps.rest=await tapCount(p,'#bRest');await p.evaluate(()=>{P.sit=0});await sleep(300);R.taps.quest=await tapCount(p,'#bQuest');assert.deepEqual(R.taps,{quest:1,rest:1},'taps land');await p.evaluate(()=>{try{closeModal()}catch(e){}DLG=null;$('dlg').classList.add('hide');P.sit=0});
   if(!touch){assert(/svg/.test(L.joy),'computer: W A S D stay on the ring')}}
  if(mode==='kid'){assert.equal(L.quest.vis,false);assert(L.rest.vis&&L.rest.w>=44)}
  if(touch){R.walk=await stick(p);assert(R.walk>20,name+' stick walks: '+R.walk)}
  await p.screenshot({path:path.join(out,name+'.png')});assert.deepEqual(errors,[]);R.errors=0;R.look=L.cls;R.sizes={quest:L.quest.w,buff:L.buff.w,rest:L.rest.w};results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
