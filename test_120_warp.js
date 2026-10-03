// test_120_warp.js — รุ่น 1.20: เครื่องหมายทางออกเป็นภาพ (วงแหวนฟ้า · พรมทองหน้าประตู) · PORT=... CHROME_EXE=... · MISSING=1 = ทดสอบตอนไม่มีไฟล์ warp-art.png
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,picture:!!IMG.warpArt,frames:Object.keys(WARP_ART).length};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}fpsChecks=6;
 let rings=0;const _r=ring;ring=function(){rings++;return _r.apply(this,arguments)};const seen={};const _w=warpDraw;warpDraw=function(e){const ok=_w.apply(this,arguments);seen[e.id]=ok;return ok};
 goMap('farm');await sleep(1200);P.x=G9.door[0]*T;P.y=(G9.door[1]+2)*T;rings=0;await sleep(1200);o.farm={markerDrawnAsPicture:Object.assign({},seen),lockedWaysShowNothing:!Object.keys(seen).some(k=>/^[wns]\d?$/.test(k)),oldRingsDrawnInOneSecond:rings};
 for(const k in seen)delete seen[k];goMap('h9');await sleep(1500);rings=0;await sleep(1000);o.village={markerDrawnAsPicture:Object.assign({},seen)};
 goMap('farm');await sleep(1000);P.x=G9.door[0]*T+30;P.y=(G9.door[1]+2.4)*T;await sleep(2200);return o});
await pg.evaluate(()=>document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide')));await pg.screenshot({path:'w_door.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
