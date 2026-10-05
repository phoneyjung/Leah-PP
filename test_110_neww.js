// test_110_neww.js — ทดสอบรุ่น 1.10: สวิตช์โลกใหม่ (เฉพาะ GM) · กล่องส่งขาย · ผลคริสตัล · เปิดเซิร์ฟเวอร์ก่อน: python3 -m http.server 8775
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const R=await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));const quiet=()=>{try{closeModal()}catch(e){}PAUSE=false;DLG=null};const hide=()=>document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 // players: nothing changes
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});S.hp=hpMax();Store.save(S);startGame();await sleep(1500);hide();setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 o.version=VERSION;o.player={neww:NEWW(),start:M.id,goal:t('goalTown')};goMap('plaza');await sleep(400);o.player.plaza=M.id;const c0=S.coins;
 // GM with the new-world switch on, as a 7-year-old
 gmMakeSlot();let d=Store.all();S=d.slots[d.cur];S.gmNew=true;S.age=7;S.pos=null;Store.save(S);startGame();await sleep(1500);hide();quiet();
 o.neww={on:NEWW(),start:M.id,goal:t('goalTown'),spawn:[+(P.x/T).toFixed(1),+(P.y/T).toFixed(1)]};goMap('capital');await sleep(400);o.neww.capital=M.id;goMap('plaza');await sleep(400);o.neww.plaza=M.id;
 const step=async(e,dx,dy)=>{exitCool=0;PAUSE=false;P.path=null;P.x=e.x+(dx||0);P.y=e.y+(dy||0);for(let i=0;i<10;i++){await sleep(250);quiet()}};
 await step(M.exits.find(e=>e.id==='w'),4,0);o.neww.west=M.id;await step(M.exits.find(e=>e.id==='home'));o.neww.home=M.id;
 useExit(M.exits.find(e=>e.id==='door'));await sleep(1900);quiet();o.neww.outOfHome=[M.id,+(Math.hypot(P.x-G9.door[0]*T,P.y-G9.door[1]*T)/T).toFixed(1)];
 await step(M.exits.find(e=>e.id==='e'),-4,0);o.neww.backEast=M.id;await step(M.exits.find(e=>e.id==='cave'),0,6);o.neww.cave=M.id;
 useExit(M.exits.find(e=>e.id==='s'));await sleep(1900);quiet();o.neww.outOfCave=[M.id,+(Math.hypot(P.x-H9.cave[0]*T,P.y-H9.cave[1]*T)/T).toFixed(1)];
 // leave and come back: still in the new village, at the same place
 P.x=44*T;P.y=46*T;save();const saved=[S.pos.map,Math.round(S.pos.x/T)];d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);hide();quiet();o.neww.resume=[saved,M.id,Math.round(P.x/T)];
 // the lantern runs out in the cave -> wake beside the crystal of the new village
 goMap('capital');await sleep(300);o.neww.wakeNearCrystal=[M.id,!!M.crystalAt];
 // switch off again -> the old village
 S.gmNew=false;newwApply();for(const k of Object.keys(CACHE))delete CACHE[k];goMap('capital');await sleep(500);o.off={map:M.id,goal:t('goalTown')===o.player.goal};
 // ---- shipping crate ----
 gmAge(30);goMap('farm');await sleep(700);quiet();const h=HOME.get();h.pantry={cab:3,pum:2};h.cry={cab:1};HOME.put(h);const g0=S.coins;
 openCrate();o.crate={rows:document.querySelectorAll('[data-cs]').length/2};document.querySelector('[data-cs="cab:0:0"]').click();o.crate.sell1=S.coins-g0;document.querySelector('[data-cs="cab:1:1"]').click();o.crate.crystal=S.coins-g0;
 document.querySelector('[data-cs="pum:0:1"]').click();document.querySelector('[data-cs="cab:0:1"]').click();o.crate.total=S.coins-g0;o.crate.left=JSON.stringify([HOME.get().pantry,HOME.get().cry]);o.crate.emptyText=document.getElementById('mBody').textContent.includes(t('crateEmpty'));closeModal();
 // tapping the crate on screen opens it
 P.x=M.crate.x;P.y=M.crate.y+70;await sleep(900);quiet();const cv=document.getElementById('c'),r=cv.getBoundingClientRect(),dpr=devicePixelRatio||1,cx=(M.crate.x-camX)*SC/dpr+r.left,cy=(M.crate.y-24-camY)*SC/dpr+r.top;
 cv.dispatchEvent(new PointerEvent('pointerup',{clientX:cx,clientY:cy,bubbles:true}));await sleep(200);o.crate.tapOpens=!!document.querySelector('#modal:not(.hide)')&&document.getElementById('mBody').textContent.includes(t('crate'));closeModal();
 // ---- crystal crops ----
 const harvest=()=>{const H=HOME.get();H.plots[M.plots[0].i]={crop:'cab',st:'ripe',w:true,t:Date.now()};HOME.put(H);plotAct(M.plots[0])};const cry=()=>(HOME.get().cry||{}).cab||0;
 GM.luck=true;const a=cry();harvest();o.cry={luck100:cry()-a};GM.luck=false;const _r=Math.random;Math.random=()=>.049;const b1=cry();harvest();o.cry.at049=cry()-b1;Math.random=()=>.051;const b2=cry();harvest();o.cry.at051=cry()-b2;Math.random=_r;
 const b3=cry();for(let i=0;i<1000;i++)harvest();o.cry.in1000=cry()-b3;FX.length=0;quiet();
 // the child's character is untouched by all of this
 save();d=Store.all();S=d.slots[0];startGame();await sleep(1300);hide();o.back={name:S.name,coins:S.coins===c0,map:M.id,neww:NEWW()};return o});
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,5));await b.close()})();
