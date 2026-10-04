// test_138_deco.js — รุ่น 1.38: จัดบ้านแบบใหม่ · เลือก ย้าย หมุน 4 ทิศ เก็บ หยิบออก · กติกากันวางผิดที่ · จำหลังโหลดใหม่ · PORT=... CHROME_EXE=...
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1000,height:640,isMobile:true,hasTouch:true,deviceScaleFactor:1});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const boot=async(clear)=>{await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});if(clear){await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'})}await new Promise(r=>setTimeout(r,6000));
 await pg.evaluate(async(clear)=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;goMap('room');await sleep(1200);try{closeModal()}catch(e){}DLG=null;PAUSE=false;HOLD=null;P.x=13*T;P.y=10.5*T;P.path=null;await sleep(400)},clear)};
await boot(true);const out={};
out.run=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));const dy=ROOM2.rowsAbovePlan,L=()=>M.layout2,ix=k=>L().findIndex(a=>a[0]===k),W=(x,y)=>[x*T,(y+dy)*T];
 let last=null;const _say=say;say=function(x){last=x;return _say.apply(this,arguments)};
 openDeco();await sleep(150);o.modeOn=DECO2.on&&!!document.getElementById('deco2')&&getComputedStyle(document.getElementById('act')).display==='none';
 // choose the bed by tapping its picture, move it to an open place in the bedroom
 const bed=L()[ix('bed')],v=ROOM2.pieces.bed[0];deco2Tap(...W(bed[2]+v[6]/2,bed[3]+1));o.choseBed=DECO2.sel===ix('bed');const before=bed.slice();
 deco2Tap(...W(20.0,3.0));await sleep(100);const b2=L()[ix('bed')];o.moved={from:[before[2],before[3]],to:[b2[2],b2[3]],saved:JSON.stringify(HOME.get().room2[ix('bed')])===JSON.stringify(b2)};
 // four turns bring it back to the first view; every view must be accepted in open floor
 const rs=[];for(let i=0;i<4;i++){deco2Turn();await sleep(60);rs.push(L()[ix('bed')][1])}o.turns=rs;
 // refused: into a wall, onto another piece, across the bedroom doorway
 const pos=()=>{const a=L()[DECO2.sel];return [a[2],a[3]]};let p0=pos();last=null;deco2Tap(...W(15.2,2.0));o.intoWall={refused:JSON.stringify(pos())===JSON.stringify(p0),said:last};
 p0=pos();last=null;const wr=L()[ix('wardrobe')];deco2Tap(...W(wr[2]+2.6,wr[3]+2.2));const near=pos();last=null;const w2=L()[ix('wardrobe')];
 DECO2.sel=ix('wardrobe');p0=pos();last=null;const bd=L()[ix('bed')];DECO2.sel=ix('wardrobe');
 // put the wardrobe on top of the desk: refused
 {const cur=L()[DECO2.sel],bd2=L()[ix('bed')];const it=[cur[0],cur[1],bd2[2],bd2[3]+0.5];o.ontoAnotherPiece={refused:f2Valid(it,cur)==='d2Over'}}
 // block the doorway of the bedroom (plan tiles 17-18, row 6 is the gap; standing just inside it on row 5)
 p0=pos();last=null;deco2Tap(...W(18.0,5.45));o.acrossDoorway={refused:JSON.stringify(pos())===JSON.stringify(p0),said:last};
 // put the plant away and take it out again somewhere else
 const n0=L().length;DECO2.sel=ix('plant');deco2Store();await sleep(60);o.store={pieces:[n0,L().length],inStore:(HOME.get().furn2||{}).plant||0,buttonShown:!!document.querySelector('#deco2 button[data-k="plant"]')};
 document.querySelector('#deco2 button[data-k="plant"]').click();await sleep(60);deco2Tap(...W(12.5,9.5));await sleep(60);o.takeOut={pieces:L().length,inStore:(HOME.get().furn2||{}).plant||0,plantAt:L()[ix('plant')].slice(2)};
 o.allRoomsStillReachable=f2Reach();o.final=JSON.stringify(L());say=_say;return o});
// a real finger: tap the sofa on the screen, it becomes the chosen piece
const tap=await pg.evaluate(()=>{const it=M.layout2.find(a=>a[0]==='sofa'),v=ROOM2.pieces.sofa[it[1]],cv=document.getElementById('c'),r=cv.getBoundingClientRect(),dq=devicePixelRatio||1,wx=(it[2]+v[6]/2)*T,wy=(it[3]+ROOM2.rowsAbovePlan+v[7]/2)*T;P.x=13*T;P.y=10.5*T;return [(wx-camX)*SC/dq+r.left,(wy-camY)*SC/dq+r.top]});
await new Promise(r=>setTimeout(r,900));const tap2=await pg.evaluate(()=>{const it=M.layout2.find(a=>a[0]==='sofa'),v=ROOM2.pieces.sofa[it[1]],cv=document.getElementById('c'),r=cv.getBoundingClientRect(),dq=devicePixelRatio||1;return [((it[2]+v[6]/2)*T-camX)*SC/dq+r.left,((it[3]+ROOM2.rowsAbovePlan+v[7]/2)*T-camY)*SC/dq+r.top]});
await pg.touchscreen.tap(tap2[0],tap2[1]);await new Promise(r=>setTimeout(r,400));out.finger=await pg.evaluate(()=>({choseSofa:DECO2.sel!=null&&M.layout2[DECO2.sel][0]==='sofa',playerDidNotWalk:!(P.path&&P.path.length)}));
await pg.screenshot({path:'dc_1.png'});
await pg.evaluate(()=>{document.querySelector('#deco2 button[data-a="done"]').click()});const fin=out.run.final;
await boot(false);out.afterReload=await pg.evaluate(async f=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const o={map:M&&M.id,newRoom:!!(M&&M.room2),filesReady:!!ROOM2,savedLayoutSame:JSON.stringify(HOME.get().room2)===f};if(!(M&&M.room2)){try{delete CACHE.room}catch(e){}goMap('room');await sleep(1200);o.mapAfterRetry=M.id;o.newRoomAfterRetry=!!M.room2}if(M.room2){o.roomShowsSameLayout=JSON.stringify(M.layout2)===f;o.pieces=M.layout2.length}o.modeOff=!DECO2.on;return o},fin);delete out.run.final;
console.log(JSON.stringify(out));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
