// test_water_demo.js — ทดสอบ water-demo.html (ลมพัดต้นไม้ 3 ระดับ · น้ำขยับ · ใบบัว · เงาปลา) ด้วยเบราว์เซอร์จริงขนาดมือถือ
// เปิดเซิร์ฟเวอร์ที่โฟลเดอร์ที่มีไฟล์ก่อน: python3 -m http.server 8777   (PORT=... เปลี่ยนพอร์ต)
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8777)+'/water-demo.html',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,1500));
const R=await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));const A=window.__api,D=A.D;
 o.ready=!!A&&!!window.__dbg;
 // ---------- WIND: three height levels ----------
 const by={low:[],mid:[],small:[],high:[]};D.inst.forEach(i=>by[i.lv].push(i));o.count={low:by.low.length,mid:by.mid.length,small:by.small.length,high:by.high.length};
 // lean of the top of each thing over 120 s of wind, at each wind strength
 const span=(lv,str)=>{A.WIND.str=str;let mx=0;for(const i of by[lv])for(let t=0;t<120;t+=0.05)mx=Math.max(mx,Math.abs(Math.round(A.lean(i,t))));return mx};
 o.topMovesPx={};for(const [name,str] of [['light',0.6],['medium',1],['strong',1.5]])o.topMovesPx[name]={low:span('low',str),mid:span('mid',str),small:span('small',str),high:span('high',str)};
 A.WIND.str=1;
 // the foot never moves: the bottom rows of every frame slide 0, the top row slides the full amount
 let footMax=0,topOk=true;for(const hgt of [40,56,98,134,140])for(const k of [-4,-3,-2,-1,1,2,3,4]){for(let y=hgt-1;y>=Math.floor(hgt*0.8);y--)footMax=Math.max(footMax,Math.abs(A.rowSlide(k,hgt,y)));if(A.rowSlide(k,hgt,0)!==k)topOk=false}
 o.footSlidePx=footMax;o.topRowSlidesFull=topOk;
 // not all together: at one moment the trees show several different leans, and a tree on the right follows one on the left
 const trees=by.small.concat(by.high).sort((a,c)=>a.x-c.x);let distinct=0,same=0,N=0;for(let t=5;t<125;t+=0.5){const ks=trees.map(i=>Math.round(A.lean(i,t)));const s=new Set(ks);distinct+=s.size;if(s.size===1)same++;N++}
 o.together={trees:trees.length,avgDifferentLeansAtOnce:+(distinct/N).toFixed(1),momentsAllSamePct:+(100*same/N).toFixed(1)};
 // calm spells: share of the time the big trees are (nearly) still, and how strong the gusts get
 let calm=0,strong=0,full=0,M=0,gmin=9,gmax=0;for(let t=0;t<240;t+=0.1){const g=A.gust(t);gmin=Math.min(gmin,g);gmax=Math.max(gmax,g);const mx=Math.max(...by.high.map(i=>Math.abs(Math.round(A.lean(i,t)))));if(mx===0)calm++;if(mx>=2)strong++;if(mx>=3)full++;M++}
 o.gusts={min:+gmin.toFixed(2),max:+gmax.toFixed(2),bigTreesStillPct:+(100*calm/M).toFixed(0),bigTrees2pxOrMorePct:+(100*strong/M).toFixed(0),bigTreesFull3pxPct:+(100*full/M).toFixed(0)};
 // on screen: trees really change, low things and the road do not
 A.OPT.pads=false;A.OPT.glint=false;A.OPT.wave=false;await sleep(9500);
 const crownPts=[],lowPts=[];for(const i of by.high.concat(by.small)){crownPts.push([i.x+i.r[2]/2,i.y+4],[i.x+i.r[2]*0.3,i.y+i.r[3]*0.2])}
 const movers=by.mid.concat(by.small,by.high);const covered=(x,y,me)=>movers.some(m=>m.by>me.by&&x>=m.x-5&&x<=m.x+m.r[2]+5&&y>=m.y&&y<=m.y+m.r[3]);
 let hidden=0;for(const i of by.low){const q=[i.x+i.r[2]/2,i.y+i.r[3]/2];if(covered(q[0],q[1],i))hidden++;else lowPts.push(q)}
 let lowLean=0;for(const i of by.low)for(let t=0;t<120;t+=0.1)lowLean=Math.max(lowLean,Math.abs(A.lean(i,t)));o.lowThings={total:by.low.length,behindATree:hidden,maxLean:lowLean};
 const inView=([x,y])=>x>=1&&y>=1&&x<D.w-1&&y<D.h-1;const snap=pts=>pts.filter(inView).map(([x,y])=>A.px(x,y).join());
 const changed=async pts=>{const ch=new Set();const s0=snap(pts);for(let k=0;k<10;k++){await sleep(400);snap(pts).forEach((v,i)=>{if(v!==s0[i])ch.add(i)})}return [ch.size,s0.length]};
 o.onScreen={fishDuring:window.__dbg.fish.length,crownPointsChanged:await changed(crownPts),lowThingPointsChanged:await changed(lowPts)};
 A.OPT.tree=false;await sleep(300);o.onScreen.crownChangedWhenOff=await changed(crownPts);o.onScreen.allLeanZeroWhenOff=window.__dbg.ks.every(k=>k===0);A.OPT.tree=true;
 // ---------- WATER (same checks as before) ----------
 let maxMove=0,minRange=9;A.OPT.pads=true;for(const pad of A.PADS){const xs=[],ys=[];for(let t=0;t<12;t+=0.05){const [dx,dy]=A.padOffset(pad,t);xs.push(dx);ys.push(dy)}maxMove=Math.max(maxMove,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));minRange=Math.min(minRange,Math.max(...ys)-Math.min(...ys))}
 o.pads={groups:A.PADS.length,swingPx:[+minRange.toFixed(2),+maxMove.toFixed(2)]};
 let lo=9,hi=-9;for(let y=D.waveBox[1];y<D.waveBox[3];y+=2)for(let t=0;t<20;t+=0.1){const v=A.rowShift(y,t);lo=Math.min(lo,v);hi=Math.max(hi,v)}
 A.OPT.pads=false;A.OPT.tree=false;A.OPT.wave=true;await sleep(300);const wpts=D.deep.filter((q,i)=>i%3===0);o.water={rowShiftPx:[lo,hi],pointsChanged:await changed(wpts)};
 A.OPT.wave=false;await sleep(300);o.water.changedWhenOff=await changed(wpts);
 A.OPT.wave=true;A.OPT.pads=true;A.OPT.glint=true;A.OPT.tree=true;
 const ds=[];for(let i=0;i<2000;i++)ds.push(A.fishDelay());o.fishEverySec={min:+Math.min(...ds).toFixed(1),avg:+(ds.reduce((a,c)=>a+c,0)/ds.length).toFixed(1),max:+Math.max(...ds).toFixed(1)};
 let samples=0,inWater=0;for(let k=0;k<10;k++){A.spawnFish();for(let i=0;i<22;i++){await sleep(120);for(const [x,y] of window.__dbg.fish){if(x===undefined)continue;samples++;if(A.clipAt(x,y))inWater++}}}
 o.fish={samples,inWater,pct:+(100*inWater/samples).toFixed(1)};
 await sleep(2500);o.fpsAllOn=Math.round(window.__dbg.fps);o.swayFramesMade=A.frames.size;
 const bs=[...document.querySelectorAll('button')];o.buttons={n:bs.length,minH:Math.round(Math.min(...bs.map(x=>x.getBoundingClientRect().height)))};
 const bw=document.getElementById('bWind');const w0=A.WIND.str;bw.click();const w1=A.WIND.str;bw.click();bw.click();o.windButton=[w0,w1,A.WIND.str,bw.textContent];
 o.noSideScroll=document.documentElement.scrollWidth<=window.innerWidth+1;return o});
await pg.screenshot({path:'water_demo.png'});
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
