const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8775/',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,5000));
const r=await pg.evaluate(async()=>{const o={};S=newSave({name:'ลีอา',kid:0,house:0,age:7});startGame();await new Promise(r=>setTimeout(r,1800));document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 setInterval(()=>{LITE=false;fpsChecks=99;DLG=null;PAUSE=false;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 o.start=M.id;o.name=t(M.nameKey);o.crystal=!!M.objs.find(x=>x.crystal);o.fountainGone=!M.objs.find(x=>x.img==='fountCapA');o.exits=M.exits.map(e=>e.id+'→'+e.to+(e.locked?'🔒':''));
 // walk north: into the cave, and back
 const n=M.exits.find(e=>e.id==='n');o.reachN=!!findPath(M,M.spawnDefault[0],M.spawnDefault[1],n.x,n.y+20);goMap(n.to,n.toExit);await new Promise(r=>setTimeout(r,500));o.north=M.id;
 const s2=M.exits.find(e=>e.id==='s');goMap(s2.to,s2.toExit);await new Promise(r=>setTimeout(r,500));o.back=M.id;o.stuck=M.SOLID.has(key(Math.floor(P.x/T),Math.floor(P.y/T)));
 // locked roads say why
 const said=[];const _s=say;say=function(x){said.push(String(x));return _s.apply(this,arguments)};for(const id of ['w','e','s'])useExit(M.exits.find(e=>e.id===id));o.lockMsgs=said;
 // backups
 save();backupNow();o.backups=['leahpp2d-bak0','leahpp2d-bak1','leahpp2d-bak2'].filter(k=>localStorage.getItem(k)).length;
 // error guard: a thrown error inside the frame must not stop the game
 const f0=window._frames=0;const _r=render;let boom=1;render=function(){if(boom){boom=0;throw new Error('test boom')}window._frames++;return _r.apply(this,arguments)};await new Promise(r=>setTimeout(r,1200));o.framesAfterError=window._frames;render=_r;
 o.errLog=JSON.parse(localStorage.getItem('la-errors')||'[]').length;return o});
console.log(JSON.stringify(r,null,1));
// corrupt the main save, reload: the newest backup must come back
const rr=await pg.evaluate(async()=>{localStorage.setItem('leahpp2d-slots','{broken');return 1});await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4000));
console.log('after corrupt+reload:',JSON.stringify(await pg.evaluate(()=>{const d=Store.all();return {slots:d.slots.length,name:d.slots[0]&&d.slots[0].name}})));
await pg.evaluate(async()=>{const d=Store.all();S=d.slots[d.cur>=0?d.cur:0];startGame();await new Promise(r=>setTimeout(r,1500));document.querySelectorAll('#cr,#title,#picker,#dlg').forEach(e=>e.classList.add('hide'));setInterval(()=>{LITE=false;fpsChecks=99;DLG=null;PAUSE=false;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);goMap('capital');const o=M.objs.find(x=>x.crystal);P.x=o.x+90;P.y=o.y+60});
await new Promise(r=>setTimeout(r,2500));await pg.screenshot({path:'/tmp/v103.png'});console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
