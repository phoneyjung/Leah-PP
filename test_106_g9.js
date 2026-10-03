// test_106_g9.js — ทดสอบฉาก G9 บ้านเรา·ฟาร์ม ในเกมจริง · เปิดเซิร์ฟเวอร์ที่โฟลเดอร์เกมก่อน: python3 -m http.server 8775 · ใส่ nopic เป็นอาร์กิวเมนต์เพื่อทดสอบกรณีไม่มีภาพฉาก
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');const NOPIC=process.argv.includes('nopic');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
if(NOPIC){await pg.setRequestInterception(true);pg.on('request',r=>/map-G9-home-farm/.test(r.url())?r.abort():r.continue())}
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const R=await pg.evaluate(async(NOPIC)=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 // a child's character first: the village west road must still be closed
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});S.hp=hpMax();Store.save(S);startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 window._said=[];const _s=say;say=function(x){window._said.push(String(x));return _s.apply(this,arguments)};
 setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 goMap('capital');await sleep(500);const w=M.exits.find(e=>e.id==='w');o.villageWestLocked=!!w.locked;o.villageHomeDoor=!!M.exits.find(e=>e.id==='home');o.version=VERSION;
 // the GM
 gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 goMap('farm');await sleep(900);o.g9=!!M.g9;o.size=[M.w,M.h];o.nameKey=M.nameKey;o.name=t(M.nameKey);o.painted=M.painted;o.plots=M.plots.length;
 if(NOPIC)return o;
 o.ground=[M.ground.width,M.ground.height];o.exits=M.exits.map(e=>e.id+(e.locked?'🔒':'')+'→'+e.to);o.wild=M.wild.length;o.house=M.objs.filter(q=>q.farmHouse).map(q=>[q.img,q.sw,q.sh,q.x/T,q.y/T]);
 // reach everything on foot (4-way walk over free tiles from the arrival point)
 const reach=()=>{const seen=new Set(),q=[[Math.floor(G9.spawn[0]),Math.floor(G9.spawn[1])]];seen.add(q[0].join());while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b2=y+dy,k=a+','+b2;if(a<0||b2<0||a>=M.w||b2>=M.h||seen.has(k)||M.SOLID.has(key(a,b2)))continue;seen.add(k);q.push([a,b2])}}return seen};
 const pts=()=>({door:[G9.door[0],G9.door[1]],shed:[G9.shed[0],G9.shed[1]+1],mailbox:[G9.mailbox[0],G9.mailbox[1]+1],fish:G9.fish,camp:[G9.camp[0],G9.camp[1]+1.6],conv:convList()[0],exitE:[94,G9.exitE[1]],
   ...Object.fromEntries(M.plots.map((q,i)=>['plot'+i,[q.x/T,q.y/T+1]])),...Object.fromEntries(M.exits.filter(e=>e.locked).map(e=>['lock_'+e.id,[e.x/T,e.y/T]]))});
 const check=()=>{const s=reach(),P2=pts();const bad=Object.entries(P2).filter(([k,[x,y]])=>!s.has(Math.floor(x)+','+Math.floor(y))).map(([k])=>k);return{n:Object.keys(P2).length,bad,free:s.size}};
 o.reach=check();o.wildNoWay=M.wild.filter(q=>![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reach().has((q.tx+dx)+','+(q.ty+dy)))).length;
 // house levels 1..3: picture, collision, door still reachable
 o.levels=[];for(const lv of [1,2,3,9]){gmHouse(lv);await sleep(150);const h=M.objs.find(q=>q.farmHouse);const c=check();o.levels.push([lv,h.img,h.sw,M._hs.length,c.bad.length,!M.SOLID.has(key(Math.floor(G9.door[0]),Math.floor(G9.door[1])))])}gmHouse(1);await sleep(150);
 // walk from the east road to the front door, go in, come back out
 goMap('farm','e');await sleep(400);o.arriveE=[+(P.x/T).toFixed(1),+(P.y/T).toFixed(1)];const pth=findPath(M,P.x,P.y,G9.door[0]*T,G9.door[1]*T);o.pathToDoor=pth?pth.length:0;P.path=pth;GM.fast=4;PAUSE=false;
 for(let i=0;i<120&&M.id==='farm';i++)await sleep(250);GM.fast=1;await sleep(800);o.enteredHouse=M.id;o.homeFrom=S.homeFrom;
 const dr=M.exits.find(e=>e.id==='door');useExit(dr);await sleep(1800);o.backOut=[M.id,+(Math.hypot(P.x-G9.door[0]*T,P.y-G9.door[1]*T)/T).toFixed(1)];
 // the three closed ways: message + stay on the farm
 o.locks={};for(const id of ['w','n','s']){const e=M.exits.find(q=>q.id===id);window._said.length=0;exitCool=0;P.path=null;P.x=e.x;P.y=e.y;await sleep(500);o.locks[id]=[window._said.some(x=>x===t(e.msg)),M.id,Math.hypot(P.x-e.x,P.y-e.y)>12]}
 // farming on the starter plot, clearing wild land, extra beds, robot
 const n=gmFarm('plant');const hp0=HOME.get().pantry[HOME.get().plots[M.plots[0].i].crop]||0;const crop=HOME.get().plots[M.plots[0].i].crop;plotAct(M.plots[0]);await sleep(200);closeModal();
 o.farm={planted:n,harvest:(HOME.get().pantry[crop]||0)-hp0};const h0=HOME.get();h0.farm.cleared=[];HOME.put(h0);delete CACHE.farm;goMap('farm');await sleep(500);
 const wl=M.wild.slice(0,15);for(const q of wl){q.hp=1;clearWild(q)}o.farm.cleared=farmSave().farm.cleared.length;o.farm.plotsAfter=M.plots.length;o.farm.extraAt=M.plots.filter(q=>q.i>=220&&q.i<240).every((q,k)=>Math.abs(q.x/T-G9.extra[q.i-220][0])<.01);o.farm.wildLeft=M.wild.length;
 gmFarm('robot');await sleep(300);o.farm.robot=!!M.robot;
 // converter (child) and fishing spot
 gmAge(7);await sleep(400);const [cx,cy]=convList()[0];o.convTileFree=!M.SOLID.has(key(cx,cy));S.conv={};S.lamp=.3;P.x=cx*T+16;P.y=cy*T+16;await sleep(400);o.convRefill=+S.lamp.toFixed(2);gmAge(30);await sleep(300);
 P.x=G9.fish[0]*T;P.y=G9.fish[1]*T;await sleep(200);o.fish=[fishNear(),!M.SOLID.has(key(Math.floor(G9.fish[0]),Math.floor(G9.fish[1])))];
 return o},NOPIC);
if(!NOPIC){await pg.evaluate(async()=>{closeModal();setZoom(.4,true);P.x=44*T;P.y=30*T;await new Promise(r=>setTimeout(r,2500))});await pg.screenshot({path:'g9_far.png'});
 await pg.evaluate(async()=>{setZoom(.75,true);gmHouse(2);P.x=40*T;P.y=22.5*T;await new Promise(r=>setTimeout(r,2500))});await pg.screenshot({path:'g9_house.png'});
 await pg.evaluate(async()=>{P.x=11*T;P.y=34*T;await new Promise(r=>setTimeout(r,2000))});await pg.screenshot({path:'g9_logs.png'});
 await pg.evaluate(async()=>{P.x=66*T;P.y=43*T;await new Promise(r=>setTimeout(r,2000))});await pg.screenshot({path:'g9_plots.png'})}
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,5));await b.close()})();
