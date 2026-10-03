// test_107_h9.js — ทดสอบฉาก H9 หมู่บ้านพาเพลิน (ฉากใหม่) ในเกมจริง · เปิดเซิร์ฟเวอร์ก่อน: python3 -m http.server 8775 · PORT=... เปลี่ยนพอร์ต · อาร์กิวเมนต์ nopic = ทดสอบโฟลเดอร์ที่ไม่มีภาพ H9
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');const NOPIC=process.argv.includes('nopic');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const R=await pg.evaluate(async(NOPIC)=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});S.hp=hpMax();Store.save(S);startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 window._said=[];const _s=say;say=function(x){window._said.push(String(x));return _s.apply(this,arguments)};setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 // players: the village they use is still the old one, same exits as before
 goMap('capital');await sleep(500);o.player={map:M.id,capA:!!M.capA,size:[M.w,M.h],exits:M.exits.map(e=>e.id+(e.locked?'🔒':'')+'→'+e.to)};o.version=VERSION;
 gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 o.h9Listed=gmMaps().includes('h9');goMap('farm');await sleep(700);o.farmEast=M.exits.find(e=>e.id==='e').to;
 if(NOPIC)return o;
 goMap('h9');await sleep(900);o.map=M.id;o.name=t(M.nameKey);o.size=[M.w,M.h];o.painted=M.painted;o.ground=[M.ground.width,M.ground.height];o.exits=M.exits.map(e=>e.id+(e.locked?'🔒':'')+'→'+e.to);
 o.npcs=(M.npcs||[]).map(n=>n.npc);o.crystal=!!M.objs.find(q=>q.crystal)&&!!M.crystalAt;o.stone=M.stones.map(s=>s.id);
 const seen=new Set(),q=[[Math.floor(H9.spawn[0]),Math.floor(H9.spawn[1])]];seen.add(q[0].join());while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b2=y+dy,k=a+','+b2;if(a<0||b2<0||a>=M.w||b2>=M.h||seen.has(k)||M.SOLID.has(key(a,b2)))continue;seen.add(k);q.push([a,b2])}}
 const near=([x,y])=>{for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=1;dx++)if(seen.has((Math.floor(x)+dx)+','+(Math.floor(y)+dy)))return true;return false};
 const pts={...Object.fromEntries(Object.entries(H9.doors).map(([k,v])=>['door_'+k,[v[0],v[1]+1]])),...Object.fromEntries(M.exits.map(e=>['exit_'+e.id,[Math.min(M.w-1.5,Math.max(1.5,e.x/T)),Math.min(M.h-1.5,Math.max(1.5,e.y/T))]])),
   ...Object.fromEntries((M.npcs||[]).map(n=>['npc_'+n.npc,[n.x/T,n.y/T]])),stone:[H9.stone[0],H9.stone[1]],board:[H9.board[0],H9.board[1]],fish:H9.fish,crystal:[H9.crystal[0],H9.crystal[1]+4]};
 o.reach={n:Object.keys(pts).length,bad:Object.entries(pts).filter(([k,v])=>!near(v)).map(([k])=>k),free:seen.size};
 // closed roads
 try{closeModal()}catch(e){}PAUSE=false;o.pausedBefore=PAUSE;
 o.locks={};for(const id of ['e','n','s']){const e=M.exits.find(q2=>q2.id===id);window._said.length=0;exitCool=0;PAUSE=false;P.path=null;P.x=e.x+(id==='e'?-4:0);P.y=e.y+(id==='s'?-4:id==='n'?4:0);await sleep(500);o.locks[id]=[window._said.some(x=>x===t(e.msg)),M.id]}
 // west road -> farm -> back
 const w=M.exits.find(q2=>q2.id==='w');exitCool=0;PAUSE=false;P.x=w.x+4;P.y=w.y;await sleep(2200);o.toFarm=[M.id,+(P.x/T).toFixed(1),+(P.y/T).toFixed(1)];
 const fe=M.exits.find(q2=>q2.id==='e');exitCool=0;PAUSE=false;P.x=fe.x-4;P.y=fe.y;await sleep(2200);o.backToVillage=[M.id,+(P.x/T).toFixed(1),+(P.y/T).toFixed(1)];
 // the cave on the hill -> cave mouth -> back out
 const c=M.exits.find(q2=>q2.id==='cave');const pth=findPath(M,P.x,P.y,c.x,c.y+10);o.pathToCave=pth?pth.length:0;P.path=pth;GM.fast=4;PAUSE=false;for(let i=0;i<160&&M.id==='h9';i++)await sleep(250);GM.fast=1;await sleep(900);o.inCave=[M.id,S.caveFrom];
 const s2=M.exits.find(q2=>q2.id==='s');useExit(s2);await sleep(1900);o.outOfCave=[M.id,+(Math.hypot(P.x-H9.cave[0]*T,P.y-H9.cave[1]*T)/T).toFixed(1)];
 // light stone wakes, child lantern refills at the crystal
 try{closeModal()}catch(e){}PAUSE=false;P.path=null;P.x=H9.stone[0]*T+16;P.y=(H9.stone[1]+1.6)*T;await sleep(800);o.stoneAwake=S.stones.includes('h9');o.stoneDbg=[PAUSE,M.id,M.stones.length];
 gmAge(7);await sleep(400);S.lamp=.2;P.x=M.crystalAt[0];P.y=M.crystalAt[1]+130;await sleep(400);o.lampAtCrystal=S.lamp;gmAge(30);await sleep(300);
 P.x=H9.fish[0]*T;P.y=H9.fish[1]*T;await sleep(200);o.fish=fishNear();
 return o},NOPIC);
if(!NOPIC){await pg.evaluate(async()=>{closeModal();P.x=43.6*T;P.y=38*T;P.path=null;await new Promise(r=>setTimeout(r,2500))});await pg.screenshot({path:'h9_plaza.png'});
 await pg.evaluate(async()=>{P.x=83.4*T;P.y=19*T;await new Promise(r=>setTimeout(r,2200))});await pg.screenshot({path:'h9_cave.png'})}
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,5));await b.close()})();
