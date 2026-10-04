// test_112_g9b.js — ฉาก G9 แบบประกอบ (พื้น + ของแยกชิ้น) ในเกมรุ่น 1.12 · เปิดเซิร์ฟเวอร์ที่โฟลเดอร์เกมก่อน: python3 -m http.server 8775
// BLOCK=g9b-scene.json node test_112_g9b.js  -> ทดสอบว่าไฟล์หายแล้วเกมกลับไปใช้ฉากเดิม
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const BL=(process.env.BLOCK||'').split(',').filter(Boolean);if(BL.length){await pg.setRequestInterception(true);pg.on('request',r=>{if(BL.some(f=>r.url().includes(f)))r.abort();else r.continue()})}
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
await pg.goto(url,{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,newScene:!!G9B};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 delete CACHE.farm;const t0=performance.now();goMap('farm');o.buildMs=Math.round(performance.now()-t0);await sleep(900);
 o.map={id:M.id,w:M.w,h:M.h,g9b:!!M.g9b,painted:M.painted,things:M.objs.length,solid:M.SOLID.size,ground:M.ground?[M.ground.width,M.ground.height]:null,glows:M.glows.length};
 const seen=new Set(),st=[[Math.floor(G9.spawn[0]),Math.floor(G9.spawn[1])]];seen.add(st[0].join());
 while(st.length){const [x,y]=st.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,c=y+dy,k=a+','+c;if(a<0||c<0||a>=M.w||c>=M.h||seen.has(k)||M.SOLID.has(key(a,c)))continue;seen.add(k);st.push([a,c])}}
 const near=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(seen.has((Math.floor(x)+dx)+','+(Math.floor(y)+dy)))return true;return false};
 const tg={door:G9.door,shed:[M.shed.x/T,M.shed.y/T],mailbox:[M.mailbox.x/T,M.mailbox.y/T],fish:[M.fishSpot.x/T,M.fishSpot.y/T],camp:G9.camp,sign:G9.sign};if(M.crate)tg.crate=[M.crate.x/T,M.crate.y/T];
 M.plots.forEach((q,i)=>tg['plot'+i]=[q.x/T,q.y/T]);for(const e of M.exits)tg['exit '+e.id]=[Math.min(M.w-1,e.x/T),e.y/T];
 o.wildReachableNow=(M.wild||[]).filter(w=>near(w.tx,w.ty)).length;   // the ones in the middle of a bed open up as the outer ones are cleared; 15 are needed to unlock the next beds
 const bad=Object.entries(tg).filter(([k,v])=>!near(v[0],v[1])).map(([k])=>k);o.reach={freeTiles:seen.size,targets:Object.keys(tg).length,notReachable:bad};
 o.exits=M.exits.map(e=>e.id+(e.locked?'(locked)':'')+'>'+e.to).join(' ');o.plots=M.plots.length;o.wild=(M.wild||[]).length;
 const ho=M.objs.find(q=>q.farmHouse);o.house=ho?{tier:ho.tier,x:Math.round(ho.x),base:Math.round(ho.y),doorDx:Math.round(G9.door[0]*T-ho.x)}:null;
 o.lockTexts=['g9LockW','g9LockN','g9LockS'].map(k=>t(k).length>8);
 try{o.converter=convList().map(([x,y])=>[x,y,!M.SOLID.has(key(x,y))])}catch(e){o.converter='err '+e.message}
 // arriving from the village, going into the house and coming back out
 goMap('farm','e');await sleep(700);o.arriveEast={x:+(P.x/T).toFixed(1),y:+(P.y/T).toFixed(1),onOpenTile:!M.SOLID.has(key(Math.floor(P.x/T),Math.floor(P.y/T)))};
 const he=M.exits.find(e=>e.id==='home');useExit(he);await sleep(1800);o.insideHouse=M.kind==='room'||/^room/.test(M.id);
 const de=M.exits.find(e=>e.id==='door');if(de){useExit(de);await sleep(1800)}o.backOutOnFarm=M.id==='farm'&&!!M.g9;o.backAtDoor=Math.round(Math.hypot(P.x-G9.door[0]*T,P.y-G9.door[1]*T));
 // walking: ask for a path from the east entrance to the shed, the dock, the camp
 try{const from=[G9.spawn[0]*T,G9.spawn[1]*T];o.paths={};for(const [k,v] of [['shed',[M.shed.x,M.shed.y+20]],['dock',[M.fishSpot.x,M.fishSpot.y]],['camp',[G9.camp[0]*T,G9.camp[1]*T]],['door',[G9.door[0]*T,G9.door[1]*T+20]]]){const pa=findPath(M,from[0],from[1],v[0],v[1]);o.paths[k]=pa?pa.length:0}}catch(e){o.paths='err '+e.message}
 P.x=G9.door[0]*T;P.y=(G9.door[1]+2.2)*T;await sleep(600);return o});
await pg.screenshot({path:'g9b_door.png'});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));P.x=M.fishSpot.x+60;P.y=M.fishSpot.y-150;await sleep(500)});await pg.screenshot({path:'g9b_pond.png'});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));P.x=(G9.plots[5]||[0,0])[0]*T+20;P.y=(G9.plots[5]||[0,0])[1]*T+70;await sleep(500)});await pg.screenshot({path:'g9b_farm.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
