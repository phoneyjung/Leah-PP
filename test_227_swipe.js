// Claude 2.27 (BUG-37, overnight 12 Oct): a quick swipe on the decorating list of a busy phone scrolls the list — it never takes a piece out and puts it on the floor.
// Real touches on a 667×375 phone (GM home, every furniture kind in stock ×2): the finger lands on the first list item while the page is busy for 300 ms (the moves
// queue meanwhile, as a real finger's do), moves up 50 px and lifts · 8 rounds: list scrolled 8/8, stock unchanged 8/8 · then a real hold (400 ms still) and a drag
// still takes the piece out (stock −1, the piece on the floor) · no page errors.  Version 2.26 places a piece in about 1 of 12 busy swipes; 2.27 in 0.
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://localhost:'+(process.env.PORT||8775)+'/';
async function room(b){const c=await b.createBrowserContext(),pg=await c.newPage();const errors=[];pg.on('pageerror',e=>errors.push(e.message));await pg.setViewport({width:667,height:375,deviceScaleFactor:2,isMobile:true,hasTouch:true});await pg.setBypassServiceWorker(true);
 await pg.goto(base+'?gm',{waitUntil:'load'});await pg.waitForFunction(()=>!$('load')&&typeof ROOM2!=='undefined',{timeout:60000});
 await pg.evaluate(()=>{gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.seen={intro:1};S.snd=S.mus=false;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('room');P.x=11*T;P.y=8.5*T;P.path=null});await sleep(700);
 const bd=await pg.$('#bDeco');const r=await bd.boundingBox();await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(500);
 await pg.evaluate(()=>{const h=HOME.get();h.furn2=h.furn2||{};for(const k of Object.keys(F2N.th))h.furn2[k]=2;HOME.put(h);deco2UI()});await sleep(200);return {c,pg,errors}}
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),R={swipes:[]};let pg;
 try{for(let k=0;k<8;k++){const x0=await room(b);pg=x0.pg;const item=await pg.$('#deco2 [data-k]');const ib=await item.boundingBox(),x=ib.x+ib.width/2,y=ib.y+ib.height/2;const cdp=await pg.target().createCDPSession();
   const keep=await pg.evaluate(()=>JSON.stringify(HOME.get().furn2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
   const busy=pg.evaluate(()=>{const t=performance.now();while(performance.now()-t<300){}});const mv=[];for(let i=1;i<=10;i++){mv.push(cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*5,id:1}]}));await sleep(15)}
   await busy;await Promise.all(mv);await sleep(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(300);
   R.swipes.push(await pg.evaluate(k=>({scroll:document.querySelector('#deco2 .d2inventory').scrollTop,same:JSON.stringify(HOME.get().furn2)===k,paused:PAUSE,drag:document.body.classList.contains('deco160-drag')}),keep));
   assert.deepEqual(x0.errors,[]);await x0.c.close()}
  R.scrolled=R.swipes.filter(s=>s.scroll>20).length;R.placed=R.swipes.filter(s=>!s.same).length;
  assert(R.scrolled===8&&R.placed===0&&R.swipes.every(s=>!s.drag),'busy swipes scroll: '+JSON.stringify(R));
  // a real hold still drags a piece out of the list onto the floor
  {const x0=await room(b);pg=x0.pg;await pg.evaluate(()=>{const h=HOME.get();h.furn2={plant:2};HOME.put(h);deco2UI()});await sleep(200);const cdp=await pg.target().createCDPSession();const item=await pg.$('#deco2 [data-k]');const k=await item.evaluate(e=>e.dataset.k);const ib=await item.boundingBox(),x=ib.x+ib.width/2,y=ib.y+ib.height/2;
   const dest=await pg.evaluate(k=>{const v=f2View(k,0),r=cv.getBoundingClientRect(),d=devicePixelRatio||1;for(let yy=1;yy<M.r2.grid.length;yy+=.5)for(let xx=1;xx<M.w;xx+=.5){const it=[k,0,xx,yy],p=[((xx+v[6]/2)*T-camX)*SC/d+r.left,((yy+v[7]/2+ROOM2.rowsAbovePlan)*T-camY)*SC/d+r.top+54];if(p[0]>5&&p[1]>5&&p[0]<innerWidth-5&&p[1]<innerHeight-5&&document.elementFromPoint(...p)===cv&&!deco160Valid(it,null))return p}return null},k);assert(dest,'a free spot');
   const before=await pg.evaluate(k=>HOME.get().furn2[k],k);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await sleep(450);
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(dest[0]-x)*i/12,y:y+(dest[1]-y)*i/12,id:1}]});await sleep(25)}await sleep(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(400);
   R.hold=await pg.evaluate(([k,b0])=>({stock:HOME.get().furn2[k],before:b0,placed:M.layout2.filter(a=>a[0]===k).length}),[k,before]);assert.equal(R.hold.stock,R.hold.before-1,'the held piece left the list '+JSON.stringify(R.hold));
   assert.deepEqual(x0.errors,[]);await x0.c.close()}
  console.log(JSON.stringify(R));console.log('errors 0')
 }catch(e){console.error(e);console.log(JSON.stringify(R));console.log('errors 1');process.exitCode=1}finally{await b.close()}})();
