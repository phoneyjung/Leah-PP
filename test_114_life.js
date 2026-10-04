// test_114_life.js — ฉาก G9 มีชีวิตในเกมรุ่น 1.14: ลม 3 ระดับ · น้ำขยับ · ใบบัว · เงาปลา · ประตูรั้วเปิดปิด · ประกายของที่กดได้
// เปิดเซิร์ฟเวอร์ที่โฟลเดอร์เกมก่อน: python3 -m http.server 8775  (PORT=... เปลี่ยนพอร์ต · CHROME_EXE=... ที่อยู่ Chrome)
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,newScene:!!G9B,lite:LITE};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 goMap('farm');await sleep(1500);
 // ---- wind ----
 const by={0:[],1:[],2:[],3:[]};M.objs.forEach(q=>{if(q.g9b)by[q.swA|0].push(q)});o.windCount={still:by[0].length,bushes:by[1].length,smallTrees:by[2].length,bigTrees:by[3].length};
 const span=l=>{let mx=0;for(const q of by[l])for(let t=0;t<120;t+=.1)mx=Math.max(mx,Math.abs(Math.round(g9bLean(q,t))));return mx};o.topLeansPx={still:span(0),bushes:span(1),smallTrees:span(2),bigTrees:span(3)};
 const trees=by[2].concat(by[3]);let same=0,N=0,dif=0;for(let t=5;t<125;t+=.5){const s=new Set(trees.map(q=>Math.round(g9bLean(q,t))));dif+=s.size;if(s.size===1)same++;N++}o.together={trees:trees.length,differentLeansAtOnce:+(dif/N).toFixed(1),allSamePct:+(100*same/N).toFixed(1)};
 // ---- water ----
 P.x=G9.fish[0]*T;P.y=(G9.fish[1]-3)*T;await sleep(2500);const W=M._w;o.water={ready:!!(W&&W.ready),box:W&&W.box,pads:W?W.pads.length:0};
 if(W&&W.ready){const g=M.ground.getContext('2d'),pts=G9B.water.deep.filter((q,i)=>i%2===0),snap=()=>pts.map(([x,y])=>Array.from(g.getImageData(x,y,1,1).data).join());
  const land=[];for(let i=0;i<200;i++){const x=W.box[0]+((i*53)%W.w),y=W.box[1]+((i*29)%W.h);if(!g9bInWater(W,x,y)&&!g9bInWater(W,x+3,y)&&!g9bInWater(W,x-3,y)&&!g9bInWater(W,x,y+3)&&!g9bInWater(W,x,y-3))land.push([x,y])}
  const snapL=()=>land.map(([x,y])=>Array.from(g.getImageData(x,y,1,1).data).join());W.next=1e9;W.fish.length=0;await sleep(300);
  const s0=snap(),l0=snapL(),ch=new Set(),chL=new Set();for(let k=0;k<6;k++){await sleep(350);snap().forEach((v,i)=>{if(v!==s0[i])ch.add(i)});snapL().forEach((v,i)=>{if(v!==l0[i])chL.add(i)})}
  o.water.waterPointsChanged=[ch.size,pts.length];o.water.bankPointsInsideBoxChanged=[chL.size,land.length];
  let ok=0,smp=0,inw=0;for(let k=0;k<8;k++){if(g9bFish(W,performance.now()/1000))ok++}o.water.fishSpawned=[ok,8];
  const ds=[];for(let i=0;i<1;i++)ds.push(0);await sleep(1200);for(const f of W.fish){if(f.x===undefined)continue;smp++;if(g9bInWater(W,f.x,f.y))inw++}o.water.fishInWater=[inw,smp]}
 // ---- is the moving water really on the SCREEN (not only in the map's ground picture)? and does a tapped thing wait until the player has walked up to it? ----
 {const cvs=document.getElementById('c'),sx=cvs.getContext('2d');P.x=G9.fish[0]*T+10;P.y=(G9.fish[1]-2.6)*T;P.path=null;if(M._w){M._w.next=1e9;M._w.fish.length=0}await sleep(2500);
  const pts=G9B.water.deep.filter((q,i)=>i%3===0).map(([x,y])=>[Math.round((x-camX)*SC),Math.round((y-camY)*SC)]).filter(([x,y])=>x>4&&y>4&&x<cvs.width-4&&y<cvs.height-4);
  const snap=()=>pts.map(([x,y])=>Array.from(sx.getImageData(x,y,1,1).data).join());const s0=snap(),ch=new Set();for(let k=0;k<6;k++){await sleep(300);snap().forEach((v,i)=>{if(v!==s0[i])ch.add(i)})}
  o.onScreen={waterPointsOnScreen:pts.length,changed:ch.size,groundIsWhatIsDrawn:M.shadow===M.ground};
  try{DLG=null;PAUSE=false}catch(e){}                                  // the welcome talk pauses walking: close it first
  let opened=0;P.x=M.crate.x+220;P.y=M.crate.y+60;P.path=null;await sleep(300);g9WalkThen(M.crate.x,M.crate.y+22,()=>{opened=performance.now()});const t0=performance.now();o.walkFirst={openedAtOnceFromFar:opened>0,walking:!!(P.path&&P.path.length)};
  for(let k=0;k<40&&!opened;k++)await sleep(250);o.walkFirst.openedAfterMs=opened?Math.round(opened-t0):null;o.walkFirst.distanceWhenOpened=opened?Math.round(Math.hypot(P.x-M.crate.x,P.y-(M.crate.y+22))):null;
  let near=0;g9WalkThen(M.crate.x,M.crate.y+22,()=>{near=1});o.walkFirst.opensAtOnceWhenNear=!!near;
  o.outlined=Object.entries(G9B.tapInst||{}).map(([k,ix])=>k+':'+(M.objs[ix]&&/^_g9bTap_/.test(M.objs[ix].img)));
  o.cells=!!(G9B.cellPic&&G9B.rects[G9B.cellPic[0]]);FISHING.on=false;P.x=M.fishSpot.x;P.y=M.fishSpot.y;await sleep(300);fishAct();const st1=FISHING.st;FISHING.t=0;await sleep(400);const st2=FISHING.st;fishAct();o.fishing={afterCast:st1,thenBite:st2,afterSecondPress:FISHING.st,reelGame:FISHING.st==='reel'}}   // 'idle' after the second press = the fish is caught (the bag itself is capped, so its length cannot be compared)
 // ---- yard gate ----
 const G=M._gate;if(G){o.gate={tilesSolid:G9B.gate.tiles.map(([x,y])=>M.SOLID.has(key(x,y))),shutAtStart:!G.open};P.x=G.cx;P.y=G.cy+120;await sleep(500);o.gate.farAway=G.open;P.x=G.cx;P.y=G.cy+40;await sleep(500);o.gate.near=G.open;o.gate.leafPicWhenOpen=[G.L.sw,G.L.sh];o.gate.leavesCross=(G.L.x+G.L.sw/2)>(G.R.x-G.R.sw/2);
  try{const pa=findPath(M,G.cx,G.cy+60,G.cx,G.cy-50);o.gate.pathIntoYard=pa?pa.length:0}catch(e){o.gate.pathIntoYard='err'}
  P.x=G.cx;P.y=G.cy-60;await sleep(500);o.gate.insideYardNear=G.open;P.x=G.cx-10;P.y=G.cy-150;await sleep(500);o.gate.insideYardFar=G.open;P.x=G.cx;P.y=G.cy+160;await sleep(500);o.gate.backOutFar=G.open}
 // ---- tappable marks ----
 P.x=M.crate.x+30;P.y=M.crate.y+20;await sleep(600);o.marks=(M._taps||[]).length;
 // ---- smoothness with everything running ----
 let n=0;const t0=performance.now();await new Promise(res=>{const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});o.fps=Math.round(n/3);
 LITE=true;await sleep(400);const w1=M._w?M._w.at:0;await sleep(600);o.liteStopsWater=M._w?M._w.at===w1:true;LITE=false;return o});
await pg.screenshot({path:'l_crate.png'});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const G=M._gate;P.x=G.cx;P.y=G.cy+44;await sleep(700)});await pg.screenshot({path:'l_gate.png'});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));P.x=G9.fish[0]*T+30;P.y=(G9.fish[1]-4.5)*T;g9bFish(M._w,performance.now()/1000);await sleep(2600)});await pg.screenshot({path:'l_pond.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
