// test_water_demo.js — ทดสอบหน้าลองดูน้ำด้วยเบราว์เซอร์จริง · เปิดเซิร์ฟเวอร์ที่โฟลเดอร์ที่มี water-demo.html ก่อน: python3 -m http.server 8777
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8777)+'/water-demo.html',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,1200));
const R=await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 o.ready=!!window.__api&&!!window.__dbg;o.msg=document.getElementById('msg').textContent;
 // 1) lily pads move, a little: sample every pad over 12 s of its own motion
 const A=window.__api;let maxMove=0,minRange=9;for(const pad of A.PADS){let xs=[],ys=[];for(let t=0;t<12;t+=0.05){const [dx,dy]=A.padOffset(pad,t);xs.push(dx);ys.push(dy)}
   const rx=Math.max(...xs)-Math.min(...xs),ry=Math.max(...ys)-Math.min(...ys);maxMove=Math.max(maxMove,rx,ry);minRange=Math.min(minRange,ry)}
 o.pads={groups:A.PADS.length,biggestSwingPx:+maxMove.toFixed(2),smallestSwingPx:+minRange.toFixed(2)};
 const p0=window.__dbg.pad0.slice();await sleep(900);const p1=window.__dbg.pad0.slice();o.pads.movedOnScreen=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])>0.05;
 // 2) fish: only now and then
 const ds=[];for(let i=0;i<2000;i++)ds.push(A.fishDelay());o.fishEverySec={min:+Math.min(...ds).toFixed(1),avg:+(ds.reduce((a,c)=>a+c,0)/ds.length).toFixed(1),max:+Math.max(...ds).toFixed(1)};
 o.fishBefore=window.__dbg.fish.length;
 // 3) fish stay in the water: 12 fish, sampled along their whole swim
 let samples=0,inWater=0,seen=0;for(let k=0;k<12;k++){A.spawnFish();for(let i=0;i<24;i++){await sleep(120);for(const [x,y] of window.__dbg.fish){if(x===undefined)continue;samples++;if(A.clipAt(x,y))inWater++}seen=Math.max(seen,window.__dbg.fish.length)}}
 o.fish={samples,inWater,pct:+(100*inWater/samples).toFixed(1),mostAtOnce:seen};
 await sleep(9000);o.fishGoneAfter=window.__dbg.fish.length;o.fps=Math.round(window.__dbg.fps);
 // 5) the water surface itself moves, only the water, and only a little
 const A2=window.__api;let lo=9,hi=-9;for(let y=D.waveBox[1];y<D.waveBox[3];y+=2)for(let t=0;t<20;t+=0.1){const v=A2.rowShift(y,t);lo=Math.min(lo,v);hi=Math.max(hi,v)}
 o.wave={rowShiftPx:[lo,hi]};
 A2.OPT.pads=false;A2.OPT.glint=false;await sleep(9500);                       // no fish, pads and glints off: anything that changes now is the water surface
 const wpts=D.deep.filter((p,i)=>i%3===0),land=[];for(let i=0;i<220;i++){const x=6+((i*53)%(D.w-12)),y=(i%2)?4+((i*17)%80):D.h-4-((i*29)%70);if(!A2.clipAt(x,y))land.push([x,y])}
 const snap=pts=>pts.map(([x,y])=>A2.px(x,y).join());
 const count=async(pts)=>{let ch=new Set();const s0=snap(pts);for(let k=0;k<6;k++){await sleep(350);const s1=snap(pts);s1.forEach((v,i)=>{if(v!==s0[i])ch.add(i)})}return ch.size};
 A2.OPT.wave=true;await sleep(300);o.wave.fishDuring=window.__dbg.fish.length;o.wave.waterPointsChanged=[await count(wpts),wpts.length];o.wave.landPointsChanged=[await count(land),land.length];
 A2.OPT.wave=false;await sleep(300);o.wave.waterChangedWhenOff=[await count(wpts),wpts.length];
 A2.OPT.wave=true;A2.OPT.pads=true;A2.OPT.glint=true;A2.spawnFish();await sleep(700);o.wave.ringWithFish=A2.rings.length>0;await sleep(2500);o.fpsAllOn=Math.round(window.__dbg.fps);
 // 4) buttons: big enough to tap, and the switches work
 const bs=[...document.querySelectorAll('button')];o.buttons={n:bs.length,minH:Math.min(...bs.map(x=>x.getBoundingClientRect().height))};
 document.getElementById('bPads').click();await sleep(150);const q0=window.__dbg.pad0.slice();await sleep(500);const q1=window.__dbg.pad0.slice();o.padsOffStill=q0[0]===0&&q0[1]===0&&q1[0]===0&&q1[1]===0;document.getElementById('bPads').click();
 o.noSideScroll=document.documentElement.scrollWidth<=window.innerWidth+1;return o});
await pg.evaluate(()=>{window.__api.spawnFish();window.__api.spawnFish()});await new Promise(r=>setTimeout(r,2600));await pg.screenshot({path:'water_demo.png'});
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
