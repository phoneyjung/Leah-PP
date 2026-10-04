// test_117_button.js — รุ่น 1.17: ปุ่มเดียวทำสิ่งที่อยู่ใกล้ · ป้ายหน้าบ้านขยายบ้าน · ของสูงจางเมื่อเดินไปหลัง · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));goMap('farm');await sleep(1200);
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}
 const face=()=>{const b=document.getElementById('bAtk'),sp=b.querySelector('.ctxIc');return (sp&&sp.style.display!=='none'?sp.textContent:'(own picture)')+' '+document.getElementById('atkL').textContent};
 window._did={};const wrap=(n,k)=>{const f=eval(n);eval(n+'=function(){window._did.'+k+'=(window._did.'+k+'||0)+1;return f.apply(this,arguments)}')};wrap('openCrate','crate');wrap('openFarmPanel','shed');wrap('fishAct','fish');wrap('plotAct','plot');wrap('openHouseSign','sign');
 const at=async(x,y)=>{try{closeModal()}catch(e){}PAUSE=false;DLG=null;P.x=x;P.y=y;P.path=null;P.act=null;await sleep(600);return face()};
 o.button={};o.button.farFromEverything=await at(G9.spawn[0]*T-60,G9.spawn[1]*T);const base=o.button.farFromEverything;
 o.button.byCrate=await at(M.crate.x,M.crate.y+26);autoAct();o.button.pressByCrate=window._did.crate||0;
 o.button.byShedDoor=await at(M.shed.x,M.shed.y+14);autoAct();o.button.pressByShed=window._did.shed||0;
 const h=HOME.get();h.plots={};HOME.put(h);o.button.onEmptyBed=await at(M.plots[0].x,M.plots[0].y+12);autoAct();await sleep(200);o.button.pressOnBed=window._did.plot||0;
 o.button.onDock=await at(M.fishSpot.x,M.fishSpot.y);autoAct();o.button.pressOnDock=window._did.fish||0;FISHING.on=false;FISHING.st='idle';
 o.button.bySign=await at(M.sign.x,M.sign.y+26);o.button.backFarAway=await at(G9.spawn[0]*T-60,G9.spawn[1]*T);o.button.restored=o.button.backFarAway===base;
 // things taller than the player fade while the player stands behind them, and come back
 const tree=M.objs.filter(q=>q.g9b&&q.swA>=2&&q.sh>90).map(q=>({q,d:Math.hypot(q.x-M.crate.x,q.y-M.crate.y)})).filter(e=>!M.SOLID.has(key(Math.floor(e.q.x/T),Math.floor((e.q.y-34)/T)))).sort((a,b)=>a.d-b.d)[0].q;
 await at(tree.x,tree.y-34);await sleep(700);const behind=+tree.a.toFixed(2);await at(tree.x,tree.y+40);await sleep(700);o.fade={behindTheTree:behind,inFrontOfIt:+tree.a.toFixed(2)};
 // the house sign
 const h0=HOME.get(),lv0=houseLv(h0),c0=S.coins;try{closeModal()}catch(e){}window._did={};wrap;await at(M.sign.x,M.sign.y+26);openHouseSign();await sleep(300);const btn=document.getElementById('hsUp');o.sign={outlined:/^_g9bTap_/.test(M.objs[G9B.tapInst.board].img),panelHasButton:!!btn,levelBefore:lv0,price:HCOST[lv0+1]};
 if(btn){btn.click();await sleep(500);o.sign.levelAfter=houseLv(HOME.get());o.sign.coinsPaid=c0-S.coins;const ho=M.objs.find(q=>q.farmHouse);o.sign.housePicture=ho?ho.img:null}
 return o});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
