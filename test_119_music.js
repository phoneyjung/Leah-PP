// test_119_music.js — รุ่น 1.19: เพลงฟาร์ม 2 เพลง (กลางวัน/ค่ำ) + เงาของเครื่องแปลงพลังงาน · PORT=... CHROME_EXE=...
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}fpsChecks=6;
 const st=()=>({track:FARM_BGM.cur,dayPlaying:!!(FARM_BGM.el.day&&!FARM_BGM.el.day.paused),nightPlaying:!!(FARM_BGM.el.night&&!FARM_BGM.el.night.paused),volume:+(((FARM_BGM.el[FARM_BGM.cur||'day']||{}).volume)||0).toFixed(2),oldTuneRunning:!!BGM.timer,bad:Object.keys(FARM_BGM.bad)});
 MUS=true;SND=true;o.musicSwitches={MUS,SND};goMap('h9');await sleep(1500);o.inVillage=st();
 GM.hour=10;goMap('farm');await sleep(4500);o.farmByDay=st();o.farmByDay.seconds=FARM_BGM.el.day?+FARM_BGM.el.day.currentTime.toFixed(1):null;o.farmByDay.length=FARM_BGM.el.day?Math.round(FARM_BGM.el.day.duration):null;
 GM.hour=21;await sleep(4500);o.farmAtNight=st();
 MUS=false;await sleep(3500);o.musicSwitchedOff=st();MUS=true;await sleep(3000);o.musicBackOn=st();
 GM.hour=10;goMap('h9');await sleep(4500);o.backInVillage=st();
 // the converter casts a real shadow now
 goMap('farm');await sleep(1500);P.x=G9.fish[0]*T;P.y=(G9.fish[1]-3)*T;await sleep(800);const c=M._convO,n=G9SH.now;if(c&&n){const A=u=>G9SH.cast.getContext('2d').getImageData(Math.round((c.x+n.sx*c.sh*u)*.5),Math.round((c.y+n.sy*c.sh*u-1)*.5),1,1).data[3];o.converterShadow={upright:!c.hz,lengthPx:Math.round(n.sx*c.sh),darkAtMiddle:A(.5)>60,darkNearTop:A(.8)>40}}
 GM.hour=null;return o});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
