// test_123_art2.js — รุ่น 1.23: หุ่นช่วยงาน · กล่องส่งขายปิดแล้วเปิดเมื่อเดินเข้าใกล้ · ป้ายขยายบ้านแบบใหม่ · เปลวไฟภาพจริง · ไอคอนแทน emoji · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,pictures:{farmThings2:!!IMG.farmArt2,icons:!!IMG.uiIcons}};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}fpsChecks=6;GM.hour=10;
 const h=farmSave();h.farm.robot=true;HOME.put(h);delete CACHE.farm;goMap('farm');await sleep(1500);
 const at=async(x,y)=>{try{closeModal()}catch(e){}PAUSE=false;DLG=null;P.x=x;P.y=y;P.path=null;P.act=null;await sleep(700)};
 const C=M._crateO;await at(M.crate.x+200,M.crate.y+80);o.crate=C?{farAway:C.o.img,size:[C.o.sw,C.o.sh]}:null;if(C){await at(M.crate.x+10,M.crate.y+28);o.crate.near=C.o.img;o.crate.sizeOpen=[C.o.sw,C.o.sh];await at(M.crate.x+200,M.crate.y+80);o.crate.farAgain=C.o.img}
 const bd=M.objs[G9B.tapInst.board];o.sign={picture:bd.img,size:[bd.sw,bd.sh]};
 const rb=M.robot&&M.robot.o;o.robot=rb?{size:[rb.sw,rb.sh],view:rb._v||null,canvas:[IMG._robot.width,IMG._robot.height]}:null;if(rb){const x0=rb.x;rb.x+=6;await sleep(120);const v1=rb._v;rb.x-=12;await sleep(120);const v2=rb._v;rb.y-=6;await sleep(120);const v3=rb._v;rb.y+=12;await sleep(120);o.robot.viewsWhenMoving={right:v1,left:v2,up:v3,down:rb._v}}
 await at(M.crate.x,M.crate.y+26);await sleep(400);const b=document.getElementById('bAtk'),sp=b.querySelector('.ctxIc');o.button={word:document.getElementById('atkL').textContent,pictureIcon:sp?sp.dataset.icon||null:null,hasCanvas:!!(sp&&sp.querySelector('canvas'))};
 await at(M.plots[0].x,M.plots[0].y+12);await sleep(400);const sp2=b.querySelector('.ctxIc');o.buttonOnBed={word:document.getElementById('atkL').textContent,pictureIcon:sp2?sp2.dataset.icon||null:null};
 GM.hour=20;await at(G9.camp[0]*T+60,G9.camp[1]*T+30);await sleep(1200);o.fire={on:M._fireOn,flamePicture:!!(IMG.farmArt2&&FARM_ART2.flame0)};return o});
await pg.evaluate(()=>document.querySelectorAll('#hud,#dlg').forEach(e=>e.classList.add('hide')));await pg.screenshot({path:'a_fire.png'});
await pg.evaluate(async()=>{GM.hour=10;P.x=M.crate.x-20;P.y=M.crate.y+30;P.path=null;await new Promise(r=>setTimeout(r,2500))});await pg.screenshot({path:'a_crate.png'});
await pg.evaluate(()=>{GM.hour=null});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
