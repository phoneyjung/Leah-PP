// test_143_fine.js — รุ่น 1.43: เฟอร์นิเจอร์ชุดสวย · วางแทนชุดธรรมดาที่เดิมได้พอดีทุกชิ้นทุกทิศ · ใช้งานได้เหมือนกัน · ไฟล์หายเกมยังเล่นได้ · MISSING=1 · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1000,height:640,isMobile:true,hasTouch:true,deviceScaleFactor:1});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6500));
const R=await pg.evaluate(async()=>{const o={version:VERSION,fineFileLoaded:!!IMG.furnFine,finePieces:(ROOM2.fine||[]).length};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;goMap('room');await sleep(1200);try{closeModal()}catch(e){}DLG=null;PAUSE=false;
 // swap every plain piece that has a fine twin for the fine one, in the same place and turned the same way
 let swapped=0,bad=[];for(const it of M.layout2){if(ROOM2.pieces[it[0]+'_f']){it[0]=it[0]+'_f';swapped++}}room2Place(M);
 for(const it of M.layout2){const e=f2Valid(it,it);if(e)bad.push(it[0]+':'+e)}o.swap={swapped,shown:M.objs.filter(q=>q.room2&&/_f$/.test(q.room2[0])).length,piecesInBadPlaces:bad,allRoomsStillReachable:f2Reach()};
 // every view of every fine piece has the same footprint as its plain twin
 o.sameFootprints=ROOM2.fine.every(k=>ROOM2.pieces[k].every((v,i)=>{const q=ROOM2.pieces[k.slice(0,-2)][i];return v[6]===q[6]&&v[7]===q[7]}));
 // the picture sits on its footprint: its bottom edge is no more than a few pixels from the front edge of the footprint (stools in front of the desk and the piano aside)
 o.worstGapBelowFootprintPx=Math.max(...ROOM2.fine.filter(k=>!/desk|piano/.test(k)).flatMap(k=>ROOM2.pieces[k].map(v=>Math.abs(v[3]-(v[5]+v[7]*T)))));
 const near=k=>{const ob=M.objs.find(q=>q.room2&&q.room2[0]===k);return ob&&ob.fu.k};o.use={bed:near('bed_f'),sofa:near('sofa_f'),piano:near('piano_f'),stove:near('stove_f')};
 openDeco();await sleep(100);DECO2.sel=M.layout2.findIndex(a=>a[0]==='sofa_f');deco2UI();o.nameShown=document.querySelector('#deco2 .d2t').textContent;const r0=M.layout2[DECO2.sel][1];deco2Turn();o.turns=M.layout2[DECO2.sel][1]!==r0;openDeco();
 document.querySelectorAll('#hud,#act,#dlg,#deco2').forEach(e=>e.classList.add('hide'));P.x=11*T;P.y=9.4*T;P.path=null;await sleep(1200);return o});
await pg.screenshot({path:'fn_1.png'});await pg.evaluate(async()=>{P.x=20*T;P.y=9.4*T;await new Promise(r=>setTimeout(r,1200))});await pg.screenshot({path:'fn_2.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
