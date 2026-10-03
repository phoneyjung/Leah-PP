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
 // 4) buttons: big enough to tap, and the switches work
 const bs=[...document.querySelectorAll('button')];o.buttons={n:bs.length,minH:Math.min(...bs.map(x=>x.getBoundingClientRect().height))};
 document.getElementById('bPads').click();await sleep(150);const q0=window.__dbg.pad0.slice();await sleep(500);const q1=window.__dbg.pad0.slice();o.padsOffStill=q0[0]===0&&q0[1]===0&&q1[0]===0&&q1[1]===0;document.getElementById('bPads').click();
 o.noSideScroll=document.documentElement.scrollWidth<=window.innerWidth+1;return o});
await pg.evaluate(()=>{window.__api.spawnFish();window.__api.spawnFish()});await new Promise(r=>setTimeout(r,2600));await pg.screenshot({path:'water_demo.png'});
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
