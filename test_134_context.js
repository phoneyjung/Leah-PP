// test_134_context.js — รุ่น 1.34: ปุ่มใหญ่เปลี่ยนตามสิ่งที่อยู่ใกล้ในหมู่บ้าน (คุย · ภารกิจ) · ปุ่มนั่งพักปุ่มเดียว · PORT=... CHROME_EXE=...
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:812,height:330,isMobile:true,hasTouch:true,deviceScaleFactor:2.6});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;goMap('h9');await sleep(1500);
 const clear=async()=>{try{closeModal()}catch(e){}try{for(let i=0;i<14&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(130)}}catch(e){}DLG=null;PAUSE=false;HOLD=null};await clear();
 const open=(x,y)=>{let best=null;for(let r=0;r<4&&!best;r++)for(let dy=-r;dy<=r&&!best;dy++)for(let dx=-r;dx<=r&&!best;dx++){const tx=Math.floor(x/T)+dx,ty=Math.floor(y/T)+dy;if(!M.SOLID.has(key(tx,ty)))best=[tx*T+16,ty*T+16]}return best};
 const face=()=>{const sp=document.querySelector('#bAtk .ctxIc');return{word:document.getElementById('atkL').textContent,icon:sp&&sp.style.display!=='none'?sp.dataset.icon||sp.textContent:null}};
 const at=async(x,y)=>{await clear();const q=open(x,y);P.x=q[0];P.y=q[1];P.path=null;P.act=null;P.sit=0;await sleep(700);return face()};
 o.scene={map:M.id,people:(M.npcs||[]).length,board:!!M.board};
 // far from everyone
 let far=null;for(let ty=2;ty<M.h-2&&!far;ty++)for(let tx=2;tx<M.w-2&&!far;tx++){if(M.SOLID.has(key(tx,ty)))continue;const x=tx*T+16,y=ty*T+16;if((M.npcs||[]).every(n=>Math.hypot(n.x-x,n.y-y)>160)&&(!M.board||Math.hypot(M.board.x-x,M.board.y-y)>160))far=[x,y]}
 o.farFromEverything=await at(far[0],far[1]);
 const n=M.npcs[0];o.besideAPerson=await at(n.x+6,n.y+26);o.besideAPerson.distance=Math.round(Math.hypot(P.x-n.x,P.y-n.y));autoAct();await sleep(700);o.pressBesidePerson={somethingOpened:!!DLG||PAUSE,talkLines:!!DLG,gamePausedForAWindow:PAUSE};   // a villager answers with talk lines or with a window (shop, requests): either way the game pausesawait clear();
 if(M.board){o.atTheBoard=await at(M.board.x,M.board.y+26);let opened=0;const _ob=openBoard;openBoard=function(){opened++;return _ob.apply(this,arguments)};autoAct();await sleep(500);o.pressAtBoard={boardOpened:opened};openBoard=_ob;await clear()}
 o.farAgain=await at(far[0],far[1]);
 // the rest button: a grown-up rests the old "meditate" way; the meditate button is hidden
 const sitBtn=document.getElementById('bSit');o.meditateButtonShowing=!!(sitBtn&&getComputedStyle(sitBtn).display!=='none');
 S.age=30;await sleep(200);o.grownUp={isKid:isKid()};document.getElementById('bRest').click();await sleep(500);o.grownUp.restState=P.sit;o.grownUp.word=document.getElementById('restL').textContent;await sleep(600);document.getElementById('bRest').click();await sleep(300);o.grownUp.afterSecondPress=P.sit;
 return o});
await pg.evaluate(async()=>{const n=M.npcs[0];P.x=n.x+30;P.y=n.y+30;P.sit=0;P.path=null;await new Promise(r=>setTimeout(r,1500))});await pg.screenshot({path:'k_talk.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
