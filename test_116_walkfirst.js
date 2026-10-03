// test_116_walkfirst.js — แตะของจากระยะไกลด้วยการแตะจอจริง: ตัวละครต้องเดินไปถึงก่อน แล้วหน้าต่างจึงเปิด (กล่องส่งขาย · โรงเก็บของ) · PORT=... CHROME_EXE=...
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));goMap('farm');await sleep(1200);
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}
 window._op={};const _c=openCrate;openCrate=function(){window._op.crate=Math.round(Math.hypot(P.x-M.crate.x,P.y-M.crate.y));return _c.apply(this,arguments)};const _f=openFarmPanel;openFarmPanel=function(){window._op.shed=Math.round(Math.hypot(P.x-M.shed.x,P.y-M.shed.y));return _f.apply(this,arguments)}});
const out=[];
for(const [name,what,dx,dy,key] of [['crate, from the south','crate',-40,170,'crate'],['crate, from the west','crate',-220,30,'crate'],['shed, from the road','shed',60,190,'shed'],['crate, standing next to it','crate',0,26,'crate']]){
 const c=await pg.evaluate(async(what,dx,dy)=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));try{document.querySelectorAll('.modal,#modal').forEach(e=>e.classList.add('hide'));PAUSE=false;DLG=null;HOLD=null}catch(e){}window._op={};const o=M[what];P.x=o.x+dx;P.y=o.y+dy;P.path=null;P.act=null;P.target=null;await sleep(1500);
  const cv=document.getElementById('c'),r=cv.getBoundingClientRect(),dpr=devicePixelRatio||1,w=[o.x,o.y-(what==='shed'?40:14)];return [(w[0]-camX)*SC/dpr+r.left,(w[1]-camY)*SC/dpr+r.top,Math.round(Math.hypot(P.x-o.x,P.y-o.y))]},what,dx,dy);
 await pg.touchscreen.tap(c[0],c[1]);await new Promise(r=>setTimeout(r,200));const at0=await pg.evaluate(k=>window._op[k]!==undefined,key);
 let got=null;for(let k=0;k<24&&got===null;k++){await new Promise(r=>setTimeout(r,250));got=await pg.evaluate(k=>window._op[k]===undefined?null:window._op[k],key)}
 out.push({case:name,tappedFromPx:c[2],openedAtOnce:at0,openedWhenPxAway:got})}
console.log(JSON.stringify(out));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
