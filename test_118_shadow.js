// test_118_shadow.js — รุ่น 1.18: เงาสดตามเวลาและฝนในฉาก G9 · PORT=... CHROME_EXE=...
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,live:!!(G9B&&G9B.liveShadow)};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));goMap('farm');await sleep(1500);
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}
 fpsChecks=6;LITE=false;   // this test forces eight shadow rebuilds in two seconds, which would trip the game's automatic smooth mode (average frame over 22 ms in the first 24 s) and switch the water off
 P.x=G9.fish[0]*T;P.y=(G9.fish[1]-3)*T;await sleep(2500);
 // one lamp post: how far does its shadow reach, and to which side, by the hour? (dark pixels of the cast layer in a box around its foot)
 const lamp=M.objs.filter(q=>q.g9b&&q.shOn&&!q.hz&&q.sw<34&&q.sh>70&&q.sh<110).sort((a,b)=>Math.hypot(a.x-900,a.y-700)-Math.hypot(b.x-900,b.y-700))[0];o.lamp={at:[Math.round(lamp.x),Math.round(lamp.y)],size:[lamp.sw,lamp.sh]};
 // the shadow of one post: length from the sun of that hour, and is the cast layer really dark at the middle and near the tip of where it should lie?
 const measure=()=>{const n=G9SH.now,c=G9SH.cast.getContext('2d'),A=u=>c.getImageData(Math.round((lamp.x+n.sx*lamp.sh*u)*.5),Math.round((lamp.y+n.sy*lamp.sh*u-1)*.5),1,1).data[3];return{lengthPx:Math.round(n.sx*lamp.sh),darkAtMiddle:A(.5)>60,darkNearTip:A(.8)>40,strength:+n.cast.toFixed(2),foot:n.foot,moon:n.moon}};
 o.byHour={};for(const hr of [6.5,8,10,12,14,16,17.5,21]){GM.hour=hr;await sleep(260);o.byHour[hr]=measure()}
 // open water stays clear of shadows; a low thing keeps its shadow at every hour
 GM.hour=9;await sleep(260);const W=M._w;let onW=0,nW=0;if(W&&W.ready){const c=G9SH.cast.getContext('2d'),f=G9SH.foot.getContext('2d');for(const [x,y] of G9B.water.deep.filter((q,i)=>i%2===0)){nW++;if(c.getImageData(Math.round(x*.5),Math.round(y*.5),1,1).data[3]>8||f.getImageData(Math.round(x*.5),Math.round(y*.5),1,1).data[3]>8)onW++}}o.shadowOnOpenWater=[onW,nW];
 const b0=G9SH.builds;await sleep(3000);o.rebuildsIn3sWhenNothingChanges=G9SH.builds-b0;
 const low=M.objs.find(q=>q.g9b&&q.hz>5&&q.hz<12&&q.sw>40);const lowAt=()=>G9SH.foot.getContext('2d').getImageData(Math.round((low.x+low.sw/2-4)*.5),Math.round((low.y-6)*.5),1,1).data[3];o.lowThingShadow={};for(const hr of [8,12,22]){GM.hour=hr;await sleep(260);o.lowThingShadow[hr]=lowAt()}
 // the ground really shown is darker where a shadow lies, and water still moves on screen
 GM.hour=10;await sleep(300);const g=M.ground.getContext('2d'),bb=M._base.getContext('2d');const px=[Math.round(lamp.x+G9SH.now.sx*lamp.sh*.5),Math.round(lamp.y+G9SH.now.sy*lamp.sh*.5-1)];const lum=c=>{const q=c.getImageData(px[0]-3,px[1]-2,7,5).data;let s=0;for(let i=0;i<q.length;i+=4)s+=q[i]+q[i+1]+q[i+2];return s/(q.length/4*3)};o.groundBesideTheLamp={shown:Math.round(lum(g)),bare:Math.round(lum(bb)),sameCanvasAsDrawn:M.shadow===M.ground};
 const cvs=document.getElementById('c'),sx=cvs.getContext('2d');if(M._w){M._w.next=1e9;M._w.fish.length=0}await sleep(600);const pts=G9B.water.deep.filter((q,i)=>i%3===0).map(([x,y])=>[Math.round((x-camX)*SC),Math.round((y-camY)*SC)]).filter(([x,y])=>x>4&&y>4&&x<cvs.width-4&&y<cvs.height-4);const snap=()=>pts.map(([x,y])=>Array.from(sx.getImageData(x,y,1,1).data).join());const s0=snap(),chg=new Set();for(let k=0;k<5;k++){await sleep(300);snap().forEach((v,i)=>{if(v!==s0[i])chg.add(i)})}o.waterOnScreen=[chg.size,pts.length];o.smoothModeOn=LITE;
 let n=0;const t0=performance.now();await new Promise(res=>{const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});o.fps=Math.round(n/3);
 const t1=performance.now();M._shKey='';g9bShadows();o.oneRebuildMs=Math.round(performance.now()-t1);GM.hour=10;P.x=G9.door[0]*T+10;P.y=(G9.door[1]+3)*T;await sleep(2500);return o});
await pg.evaluate(()=>document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide')));
for(const hr of [8,12,17,21]){await pg.evaluate(async h=>{GM.hour=h;await new Promise(r=>setTimeout(r,500))},hr);await pg.screenshot({path:'sh_'+hr+'.png'})}
await pg.evaluate(()=>{GM.hour=null});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
