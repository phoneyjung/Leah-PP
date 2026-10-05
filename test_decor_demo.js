// test_decor_demo.js — เปิดหน้าลองแต่งห้องบนจอมือถือ แตะจริง แล้วนับผล · ต้องเปิดเซิร์ฟเวอร์ที่โฟลเดอร์นี้ก่อน (python3 -m http.server 8791)
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8791)+'/decor-demo.html',{waitUntil:'networkidle0'});
const tap=async(x,y)=>{const r=await pg.evaluate(()=>{const c=document.getElementById('cv').getBoundingClientRect();return {l:c.left,t:c.top,w:c.width}});const k=r.w/704;await pg.touchscreen.tap(r.l+(32+x*80+40)*k,r.t+(64+y*80+40)*k)};
const pick=async t=>pg.evaluate(t=>document.querySelector(`button[data-type="${t}"]`).click(),t);
const items=()=>pg.evaluate(()=>DEMO.room().items.map(i=>[i.type,i.x,i.y,i.dir].join(':')));
const o={};
await tap(0,2); o.bedLeftWall=(await items())[0];                 // เตียงชิดซ้าย -> หันขวา
await pick('table'); await tap(4,2); await pick('chair'); await tap(3,2); await tap(5,2); await tap(4,1); await tap(4,3);
o.chairs=(await items()).filter(s=>s.startsWith('chair')).map(s=>s.split(':')[3]).join();   // ต้องได้ right,left,front,back
await pick('wardrobe'); await tap(6,0); o.wardrobeBackWall=(await items()).pop();
await tap(6,0); await pg.click('#bRot'); o.afterRotate=(await items()).find(s=>s.startsWith('wardrobe'));
await tap(7,4); o.movedTo=(await items()).find(s=>s.startsWith('wardrobe'));                // ย้ายไปชิดขวา
await tap(7,4);                                                                              // ยกเลิกการเลือก
await pick('plant'); const n=(await items()).length; await tap(4,2); o.overlapRefused=(await items()).length===n; o.msg=await pg.evaluate(()=>document.getElementById('msg').textContent);
await new Promise(r=>setTimeout(r,600)); await pg.screenshot({path:'demo.png'});
o.noSideScroll=await pg.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
o.minButtonH=await pg.evaluate(()=>Math.min(...[...document.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)));
const missing=await b.newPage();await missing.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});missing.on('pageerror',e=>errs.push(e.message));
await missing.setBypassServiceWorker(true);await missing.setCacheEnabled(false);await missing.setRequestInterception(true);missing.on('request',r=>new URL(r.url()).pathname.endsWith('/decor.js')?r.abort():r.continue());
await missing.goto('http://localhost:'+(process.env.PORT||8791)+'/decor-demo.html?missing=1',{waitUntil:'networkidle0'});
o.libraryMissing=await missing.evaluate(()=>typeof Decor==='undefined');
o.fallbackShown=await missing.evaluate(()=>!document.getElementById('missing').hidden&&document.getElementById('app').hidden);
if(!o.libraryMissing||!o.fallbackShown){errs.push('missing decor.js did not show its fallback');process.exitCode=1}
console.log(JSON.stringify(o,null,1));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
