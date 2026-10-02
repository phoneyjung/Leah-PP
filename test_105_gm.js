// test_105_gm.js — ทดสอบตัวละคร GM ของรุ่น 1.05 ด้วยเบราว์เซอร์จริง · เปิดเซิร์ฟเวอร์ที่โฟลเดอร์เกมก่อน: python3 -m http.server 8775
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const boot=async(q)=>{await pg.goto('http://localhost:8775/'+(q||''),{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500))};
await boot();await pg.evaluate(()=>localStorage.clear());await boot();
const R={};
// 1) a normal child character: no GM anywhere
Object.assign(R,await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 localStorage.setItem('leahpp2d-home',JSON.stringify({plots:{},seeds:{cab:1},pantry:{},dishes:{},lv:2}));
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});S.hp=hpMax();Store.save(S);startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 window._k=setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 o.kidVersion=VERSION;o.kidGmBtn=getComputedStyle(document.getElementById('gmBtn')).display;o.kidGrant=gmGrant();o.kidCoins=S.coins;
 openSettings();o.kidSettingsRow=!!document.getElementById('gmRow');closeModal();
 // 8) the shop lamp upgrade no longer changes the lantern light
 S.coins=500;S.lamp=1;S.lampLv=0;openShop();const btn=[...document.querySelectorAll('#mBody button')].find(x=>x.textContent.includes(t('it_lamp')));o.shopBtn=!!btn;if(btn)btn.click();await sleep(200);o.shopAfter={lamp:S.lamp,lampLv:S.lampLv};closeModal();S.coins=0;S.lampLv=0;save();return o}));
// settings with ?gm shows the row
await boot('?gm');
Object.assign(R,await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));const d=Store.all();S=d.slots[0];startGame();await sleep(1200);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 openSettings();o.gmRowWithParam=!!document.getElementById('gmRow');closeModal();
 // 2) make the GM slot and enter it
 gmMakeSlot();const d2=Store.all();o.slots=d2.slots.length;o.cur=d2.cur;S=d2.slots[d2.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 window._k=setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 const h=HOME.get(),main=JSON.parse(localStorage.getItem('leahpp2d-home'));
 o.gm={name:S.name,coins:S.coins,gems:S.gems,gear:S.inv.filter(i=>i.gm).length,cardsEach:Object.keys(CARDS).map(k=>S.cards.filter(c=>c===k).length),book:S.cardBook.length,pets:S.pets.length,fish:Object.keys(S.fish).length,fossils:Object.keys(S.fossils).length,
   tools:Object.values(S.tools),life:Object.values(S.life).map(x=>x.lv),rank:S.rank,lv:S.lv,stamps:S.stamps,skills:S.learn.length,hp:S.hp===hpMax()};
 o.gmHome={key:HOME.key,seeds:Object.values(h.seeds),dishes:Object.values(h.dishes).length,furnKinds:Object.keys(h.furn).length,furnMin:Math.min(...Object.values(h.furn))};o.mainHomeUntouched=JSON.stringify(main)===JSON.stringify({plots:{},seeds:{cab:1},pantry:{},dishes:{},lv:2});
 o.btn=getComputedStyle(document.getElementById('gmBtn')).display;
 // 3) pressing again never duplicates
 gmGrant();gmGrant();o.again={gear:S.inv.filter(i=>i.gm).length,inv:S.inv.length,cards:S.cards.length,pets:S.pets.length,fishBag:S.fishBag.length};
 // panel opens and has buttons
 openGM();o.panelButtons=document.querySelectorAll('[data-gm]').length;o.minBtnH=Math.min(...[...document.querySelectorAll('[data-gm]')].map(x=>x.getBoundingClientRect().height));closeModal();
 // 4) modes
 goMap('capital');await sleep(500);GM.god=true;S.hp=1;await sleep(200);o.god=S.hp===hpMax();GM.god=false;
 const n0=M.SOLID.size;gmGhost(true);const n1=M.SOLID.size;gmGhost(false);o.ghost=[n0,n1,M.SOLID.size];
 const lockedW=M.exits.find(e=>e.id==='w');o.lockW=!!lockedW.locked;useExit(lockedW);await sleep(300);o.closedStays=M.id;GM.open=true;useExit(lockedW);await sleep(1800);o.openGoes=M.id;GM.open=false;
 goMap('capital');await sleep(400);
 const walk=async f=>{GM.fast=f;P.x=24*T;P.y=17.5*T;P.path=[[40*T,17.5*T]];PAUSE=false;const x0=P.x;await sleep(600);const dx=P.x-x0;P.path=null;return Math.round(dx)};
 const d1=await walk(1),d4=await walk(4);GM.fast=1;o.fast={x1:d1,x4:d4,ratio:+(d4/d1).toFixed(2)};
 GM.hour=22;o.night=[dayPhase(),phaseK()];GM.hour=12;o.day=[dayPhase(),phaseK()];GM.hour=null;
 GM.pos=true;await sleep(200);GM.pos=false;
 // 5) age
 gmAge(7);await sleep(300);o.kid=[isKid(),getComputedStyle(document.getElementById('lampBar')).display];gmAge(30);await sleep(300);o.adult=[isKid(),getComputedStyle(document.getElementById('lampBar')).display];
 gmJob('mage');o.job=S.job;
 // 6) house level
 gmHouse(7);o.house=[houseLv(),houseTier(),JSON.parse(localStorage.getItem('leahpp2d-home')).lv];gmHouse(1);
 // 7) farm
 goMap('farm');await sleep(600);const total=M.plots.length;const pl=gmFarm('plant');o.farm={plots:total,planted:pl,ripe:M.plots.filter(q=>plotState(q).st==='ripe').length};
 gmFarm('clear');await sleep(500);o.farm.cleared=farmSave().farm.cleared.length;o.farm.plotsAfter=M.plots.length;gmFarm('robot');await sleep(200);o.farm.robot=!!M.robot;
 // lantern
 gmLamp(.15);o.lamp=S.lamp;S.lamp=3;S.lampLv=0;startGame();await sleep(1200);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));o.migrate={lamp:S.lamp,lampLv:S.lampLv};S.lampLv=0;
 return o}));
// 9) warp to the first maps
R.warp=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const out=[];for(const id of gmMaps().slice(0,9)){const ok=gmWarp(id);await sleep(1700);out.push([id,ok,M.id])}return out});
await pg.evaluate(()=>{openGM()});await new Promise(r=>setTimeout(r,400));await pg.screenshot({path:'gm_panel.png'});
// 10) back to the child's character: nothing leaked
Object.assign(R,await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));closeModal();save();const d=Store.all();S=d.slots[0];startGame();await sleep(1300);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 o.back={name:S.name,gm:!!S.gm,coins:S.coins,inv:S.inv.length,homeKey:HOME.key,seeds:HOME.get().seeds,btn:getComputedStyle(document.getElementById('gmBtn')).display,grant:gmGrant(),fast:GM.fast,god:GM.god};
 GM.open=true;goMap('capital');await sleep(400);const e=M.exits.find(q=>q.id==='w');useExit(e);await sleep(1500);o.back.lockedStillLocked=M.id;return o}));
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,5));await b.close()})();
