// test_111_corners.js — ยืนยันว่ามุมแผนที่ของ G9 และ H9 เดินเข้าได้แล้ว (ยกเว้นส่วนที่เป็นหิน/เนินจริง) · เปิดเซิร์ฟเวอร์ก่อน: python3 -m http.server 8775
const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 const Z={tl:[0,0,16,8],tr:[78,0,96,12],br:[76,56,96,64],bl:[0,56,14,64]};   // the old "screen corner" blocks, in game tiles
 for(const [id,sp] of [['farm',G9.spawn],['h9',H9.spawn]]){goMap(id);await sleep(700);const seen=new Set(),q=[[Math.floor(sp[0]),Math.floor(sp[1])]];seen.add(q[0].join());
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,c=y+dy,k=a+','+c;if(a<0||c<0||a>=M.w||c>=M.h||seen.has(k)||M.SOLID.has(key(a,c)))continue;seen.add(k);q.push([a,c])}}
  o[id]={free:seen.size,corners:{}};for(const [k,[x0,y0,x1,y1]] of Object.entries(Z)){let n=0,t2=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){t2++;if(seen.has(x+','+y))n++}o[id].corners[k]=Math.round(100*n/t2)}}
 return o});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
