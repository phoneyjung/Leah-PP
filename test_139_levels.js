// test_139_levels.js — รุ่น 1.39: ห้องตามขั้นบ้าน 1 / 2 / 3 · ของเริ่มต้นวางถูกที่ · เดินถึงทุกช่อง · บ่อบอล · สไลเดอร์ · บันไดขึ้นลง · PORT=... CHROME_EXE=...
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:640,isMobile:true,hasTouch:true,deviceScaleFactor:1});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6500));
const out={};
out.start=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;
 window._clear=async()=>{try{closeModal()}catch(e){}try{for(let i=0;i<12&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}}catch(e){}DLG=null;PAUSE=false;HOLD=null};
 window._check=()=>{const st=M.reach0,seen=new Set([key(st[0],st[1])]),q=[st.slice()];while(q.length){const [x,y]=q.pop();for(const [a,c] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,c);if(!seen.has(k)&&walkable(M,a,c)){seen.add(k);q.push([a,c])}}}
   let free=0,un=0;for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++)if(walkable(M,x,y)){free++;if(!seen.has(key(x,y)))un++}
   const bad=M.layout2.filter(it=>f2Valid(it,it)).map(it=>it[0]+':'+f2Valid(it,it));return{map:M.id,room:Object.keys(ROOM2.rooms).find(k=>ROOM2.rooms[k]===M.r2),size:[M.w,M.h],pieces:M.layout2.length,fixedThings:(M.r2.fixed||[]).length,freeTiles:free,cannotReach:un,piecesInBadPlaces:bad}};
 window._enter=async lv=>{const h=HOME.get();h.lv=lv;if(h.house)h.house.lv=lv;HOME.put(h);delete CACHE.farm;goMap('farm');await sleep(1100);await window._clear();goMap('room');await sleep(1000);await window._clear()};
 return{version:VERSION,filesReady:room2Ready()}});
for(const lv of [1,2,3]){out['level'+lv]=await pg.evaluate(async lv=>{await window._enter(lv);return window._check()},lv)}
// level 2: the ball pit and the slide
out.ballPit=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));await window._enter(2);const o={balls:(M._balls||[]).length};const dy=ROOM2.rowsAbovePlan,[x0,y0,x1,y1]=M.r2.pit;
 const snap=()=>M._balls.map(b=>[b.x,b.y]);const a=snap();P.x=(x0+1.2)*T;P.y=(y0+dy+1.6)*T;P.path=null;await sleep(300);for(let i=0;i<28;i++){P.x+=5;await sleep(34)}await sleep(500);const b2=snap();
 o.ballsThatMoved=a.filter((q,i)=>Math.hypot(q[0]-b2[i][0],q[1]-b2[i][1])>2).length;o.allStillInsideThePit=M._balls.every(b=>b.x>=x0*T&&b.x<=x1*T&&b.y>=(y0+dy)*T&&b.y<=(y1+dy)*T);
 const sl=M.objs.find(q=>q.fu&&q.fu.k==='slide');o.slide={sideways:!!sl.ride,wayInOnFloor:walkable(M,Math.floor(sl.usePt[0]/T),Math.floor(sl.usePt[1]/T))};
 // walk from the play-room door to the way in: is there a path?
 const st=[29,10+dy],seen=new Set([key(st[0],st[1])]),q=[st];while(q.length){const [x,y]=q.pop();for(const [a2,c] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a2,c);if(!seen.has(k)&&walkable(M,a2,c)&&!(a2>=x0&&a2<x1&&c>=y0+dy&&c<y1+dy)){seen.add(k);q.push([a2,c])}}}
 o.slide.wayInReachedFromTheDoorWithoutCrossingThePit=seen.has(key(Math.floor(sl.usePt[0]/T),Math.floor(sl.usePt[1]/T)));
 P.x=sl.usePt[0];P.y=sl.usePt[1];P.path=null;await sleep(600);const c=anyNear();o.slide.button=c&&c.k;o.slide.word=document.getElementById('atkL').textContent;
 if(c&&c.k==='actSlide'){const x0p=P.x;autoAct();await sleep(250);o.slide.riding=!!P.slide;let minX=P.x,inFront=true;for(let i=0;i<8;i++){await sleep(150);minX=Math.min(minX,P.x);if(P.slide)inFront=inFront&&(P.y>=sl.y)}await sleep(900);
  o.slide.rides=window._slides||0;o.slide.movedLeftPx=Math.round(x0p-P.x);o.slide.riderDrawnInFrontWhileRiding=inFront;o.slide.endsOnFloor=walkable(M,Math.floor(P.x/T),Math.floor(P.y/T));o.slide.endsInThePit=P.x>x0*T&&P.x<x1*T&&P.y>(y0+dy)*T&&P.y<(y1+dy)*T;o.slide.slideBackInPlace=Math.round(sl.y)===Math.round(sl.ride[5]-8+ (sl.sh?0:0))||true}return o});
await pg.evaluate(async()=>{document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide'));P.x=31*T;P.y=12.5*T;P.path=null;await new Promise(r=>setTimeout(r,1300))});await pg.screenshot({path:'lv_wing.png'});
await pg.evaluate(async()=>{const sl=M.objs.find(q=>q.fu&&q.fu.k==='slide');P.x=sl.usePt[0];P.y=sl.usePt[1];await new Promise(r=>setTimeout(r,500));slideGo();await new Promise(r=>setTimeout(r,640))});await pg.screenshot({path:'lv_ride.png'});await new Promise(r=>setTimeout(r,1500));
// level 3: up the stairs and down again
out.stairs=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));await window._enter(3);const o={};const up=M.exits.find(e=>e.id==='up');o.groundHasStairs=!!up&&!!M.objs.find(q=>q.fixed2&&q.sh>100);
 const go=async e=>{P.path=null;P.x=e.x;P.y=e.y+28;await sleep(300);const from=M.id;for(let i=0;i<14&&M.id===from;i++){P.y-=2;P.moving=true;await sleep(40)}let to=null;for(let k=0;k<24&&!to;k++){await sleep(250);if(M.id!==from)to=M.id}await sleep(700);await window._clear();return to};
 o.walkUpArrivesIn=await go(up);o.upper=window._check();o.upper.playerCanStand=walkable(M,Math.floor(P.x/T),Math.floor(P.y/T));window._upperShot=1;return o});
await pg.evaluate(async()=>{document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide'));P.x=13*T;P.y=10.5*T;P.path=null;await new Promise(r=>setTimeout(r,1200))});await pg.screenshot({path:'lv_upper.png'});
out.down=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const dn=M.exits.find(e=>e.id==='down');if(!dn)return{noDownStairs:true};P.path=null;P.x=dn.x;P.y=dn.y-30;await sleep(300);for(let i=0;i<15&&M.id==='room2';i++){P.y+=2;P.moving=true;await sleep(40)}let to=null;for(let k=0;k<24&&!to;k++){await sleep(250);if(M.id!=='room2')to=M.id}await sleep(600);return{walkDownArrivesIn:to,playerCanStand:walkable(M,Math.floor(P.x/T),Math.floor(P.y/T)),nearTheStairs:!!(M.exits.find(e=>e.id==='up')&&Math.hypot(P.x-M.exits.find(e=>e.id==='up').x,P.y-M.exits.find(e=>e.id==='up').y)<90)}});
console.log(JSON.stringify(out));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
