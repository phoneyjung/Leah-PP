// test_136_house.js — รุ่น 1.36: บ้านด้านนอกแบบใหม่ 3 ขั้น · ประตูตรงทางเดิน · แตะประตูเข้าบ้านได้ทุกขั้น · ไม่มีของทับบ้าน · PORT=... CHROME_EXE=...
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:620,isMobile:true,hasTouch:true,deviceScaleFactor:1});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const out={};
out.setup=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;window._clear=async()=>{try{closeModal()}catch(e){}try{for(let i=0;i<12&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(130)}}catch(e){}DLG=null;PAUSE=false;HOLD=null};return{version:VERSION}});
for(const lv of [1,2,3]){
 const r=await pg.evaluate(async lv=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const h=HOME.get();h.lv=lv;if(h.house)h.house.lv=lv;HOME.put(h);delete CACHE.farm;goMap('farm');await sleep(1300);await window._clear();document.querySelectorAll('#hud,#dlg,#act').forEach(e=>e.classList.add('hide'));
  const ho=M.objs.find(q=>q.farmHouse),[x0,y0,x1]=G9.houseBox[ho.tier];const o={levelAsked:lv,tier:ho.tier,picture:ho.img,size:[ho.sw,ho.sh],left:Math.round(ho.x-ho.sw/2),right:Math.round(ho.x+ho.sw/2),foot:Math.round(ho.y)};
  o.doorOnPath=Math.round(G9.door[0]*T);   // the door leaf centre is at this x by construction; check the picture's steps really sit there
  const im=IMG[ho.img],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const row=g.getImageData(0,im.height-4,im.width,1).data;let a=-1,bb=-1;for(let x=0;x<im.width;x++)if(row[x*4+3]>0){if(a<0)a=x;bb=x}o.stepsMiddleAtX=Math.round(ho.x-ho.sw/2+(a+bb)/2);
  // nothing that stands in the scene may have its foot inside the house box
  o.thingsInsideHouse=M.objs.filter(q=>q.g9b&&q.x>x0*T+6&&q.x<x1*T-6&&q.y>y0*T&&q.y<G9.houseBase*T-4).length;
  const sh=M.objs[G9B.tapInst.shed];o.gapToShedPx=Math.round((sh.x-sh.sw/2)-(ho.x+ho.sw/2));
  P.x=G9.door[0]*T+70;P.y=(G9.door[1]+3.4)*T;P.path=null;P.act=null;await sleep(1400);const cv=document.getElementById('c'),rc=cv.getBoundingClientRect(),dpr=devicePixelRatio||1;o.tap=[((G9.door[0]*T)-camX)*SC/dpr+rc.left,((G9.houseBase*T-60)-camY)*SC/dpr+rc.top];return o},lv);
 await pg.screenshot({path:'hs_'+lv+'.png'});
 await pg.touchscreen.tap(r.tap[0],r.tap[1]);let inside=null;for(let k=0;k<28&&!inside;k++){await new Promise(q=>setTimeout(q,250));inside=await pg.evaluate(()=>(M.kind==='room'||/^room/.test(M.id))?M.id:null)}
 r.tapDoorEnters=inside;delete r.tap;out['level'+lv]=r}
console.log(JSON.stringify(out));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
