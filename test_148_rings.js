// test_148_rings.js — รุ่น 1.48: วงบอกจุดยืนของของที่ใช้ได้ในบ้าน (แบบจุดตกปลา) · ทุกวงอยู่บนพื้นที่เดินถึง · ยืนในวงแล้วปุ่มใหญ่เป็นของชิ้นนั้น · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6500));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;
 const clear=async()=>{try{closeModal()}catch(e){}try{for(let i=0;i<12&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}}catch(e){}DLG=null;PAUSE=false;HOLD=null};
 const check=async()=>{const st=M.reach0,seen=new Set([key(st[0],st[1])]),q=[st.slice()];while(q.length){const [x,y]=q.pop();for(const [a,c] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,c);if(!seen.has(k)&&walkable(M,a,c)){seen.add(k);q.push([a,c])}}}
   const usable=M.objs.filter(z=>z.fu&&FURN_ACT[z.fu.k]).length,res={usablePieces:usable,rings:M._rings.length,ringsOnFloorYouCanReach:M._rings.filter(r=>seen.has(key(Math.floor(r.spot[0]/T),Math.floor(r.spot[1]/T)))).length,wrongButton:[]};
   for(const r of M._rings){P.x=r.spot[0];P.y=r.spot[1];P.path=null;await sleep(60);const c=anyNear();if(!c)res.wrongButton.push(r.of+':none')}
   await sleep(400);const a1=M._rings[0].a,f1=M._rings[0].sx;await sleep(350);res.ringsMove=M._rings[0].sx!==f1||Math.abs(M._rings[0].a-a1)>.01;return res};
 for(const lv of [1,3]){const h=HOME.get();h.lv=lv;if(h.house)h.house.lv=lv;HOME.put(h);delete CACHE.farm;goMap('farm');await sleep(1100);await clear();goMap('room');await sleep(1000);await clear();o['level'+lv]=await check()}
 useExit(M.exits.find(e=>e.id==='up'));await sleep(1800);await clear();o.upper=await check();
 bd=document.getElementById('bDeco');bd.click();await sleep(500);o.ringsHiddenWhileArranging=M._rings.every(r=>r.a<.25);bd.click();await sleep(100);
 goMap('room');await sleep(1000);await clear();document.querySelectorAll('#hud,#dlg').forEach(e=>e.classList.add('hide'));P.x=11*T;P.y=9.6*T;P.path=null;await sleep(1200);return o});
await pg.screenshot({path:'rg_1.png'});await pg.evaluate(async()=>{P.x=20*T;P.y=9.6*T;await new Promise(r=>setTimeout(r,1200))});await pg.screenshot({path:'rg_2.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
