// test_122_spots.js — รุ่น 1.22: วาร์ปแบบ RO · ประตูบ้านกดได้ (ขอบเหลือง + ลูกศร) · จุดกดกิจกรรมตกปลา · ทดสอบด้วยการแตะจอจริง · PORT=... CHROME_EXE=...
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const out={};
out.setup=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}fpsChecks=6;GM.hour=10;goMap('farm');await sleep(1200);
 window._seen={};const _w=warpDraw;warpDraw=function(e){const ok=_w.apply(this,arguments);window._seen[e.id]=ok;return ok};await sleep(500);return{version:VERSION,drawnInCode:Object.assign({},window._seen)}});
const place=async(x,y)=>pg.evaluate(async(x,y)=>{try{closeModal()}catch(e){}PAUSE=false;DLG=null;HOLD=null;FISHING.on=false;FISHING.st='idle';P.x=x;P.y=y;P.path=null;P.act=null;await new Promise(r=>setTimeout(r,1500))},x,y);
const scr=async expr=>pg.evaluate(new Function('const cv=document.getElementById("c"),r=cv.getBoundingClientRect(),dpr=devicePixelRatio||1,w='+expr+';return [(w[0]-camX)*SC/dpr+r.left,(w[1]-camY)*SC/dpr+r.top,Math.round(Math.hypot(P.x-w[0],P.y-w[1]))]'));
// the fishing spot, tapped from the lawn
const fs=await pg.evaluate(()=>[M.fishSpot.x,M.fishSpot.y]);await pg.evaluate(()=>document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide')));await place(fs[0]+10,fs[1]-130);let c=await scr('[M.fishSpot.x,M.fishSpot.y]');out.tapPoint=[Math.round(c[0]),Math.round(c[1]),await pg.evaluate((x,y)=>{const e=document.elementFromPoint(x,y);return e?e.id||e.tagName:null},c[0],c[1])];await pg.touchscreen.tap(c[0],c[1]);await new Promise(r=>setTimeout(r,250));
const f0=await pg.evaluate(()=>({castAtOnce:FISHING.on,walking:!!(P.path&&P.path.length)}));let cast=null;for(let k=0;k<24&&cast===null;k++){await new Promise(r=>setTimeout(r,250));cast=await pg.evaluate(()=>FISHING.on?[FISHING.st,Math.round(Math.hypot(P.x-M.fishSpot.x,P.y-M.fishSpot.y))]:null)}
out.fishingSpot={tappedFromPx:c[2],castAtOnce:f0.castAtOnce,walking:f0.walking,castAfterWalking:cast};
await pg.evaluate(()=>document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide')));await place(fs[0]+10,fs[1]-110);await pg.screenshot({path:'s_fish.png'});
// the house door, tapped from the road
const dr=await pg.evaluate(()=>[G9.door[0]*T,G9.houseBase*T]);await place(dr[0]+90,dr[1]+170);await pg.screenshot({path:'s_door.png'});c=await scr('[G9.door[0]*T,G9.houseBase*T-50]');await pg.touchscreen.tap(c[0],c[1]);await new Promise(r=>setTimeout(r,250));
const d0=await pg.evaluate(()=>({insideAtOnce:M.kind==='room'||/^room/.test(M.id),walking:!!(P.path&&P.path.length)}));let inside=null;for(let k=0;k<28&&!inside;k++){await new Promise(r=>setTimeout(r,250));inside=await pg.evaluate(()=>(M.kind==='room'||/^room/.test(M.id))?M.id:null)}
out.houseDoor={tappedFromPx:c[2],insideAtOnce:d0.insideAtOnce,walking:d0.walking,endedIn:inside};
await pg.evaluate(async()=>{goMap('farm');await new Promise(r=>setTimeout(r,1000));P.x=G9.spawn[0]*T-40;P.y=G9.spawn[1]*T+30;await new Promise(r=>setTimeout(r,1800))});await pg.screenshot({path:'s_warp.png'});
console.log(JSON.stringify(out));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
