const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage(); await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
await pg.goto('http://localhost:8775/',{waitUntil:'networkidle0'}); await pg.evaluate(()=>localStorage.clear()); await pg.reload({waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,4000));
const out=[];
for(const age of [30,7]){
 const ids=await pg.evaluate(async(age)=>{S=newSave({name:'QA',kid:1,house:0,age});startGame();await new Promise(r=>setTimeout(r,1200));document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
   window._qa=setInterval(()=>{LITE=false;fpsChecks=99;DLG=null;PAUSE=false;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'));try{closeModal()}catch(e){}},50);return Object.keys(MAPS)},age);
 for(const id of ids){
  const before=errs.length;
  const r=await pg.evaluate(async(id)=>{try{goMap(id);await new Promise(r=>setTimeout(r,600));const tx=Math.floor(P.x/T),ty=Math.floor(P.y/T);
     const t0=performance.now();for(let i=0;i<10;i++)render(performance.now()/1000);const ms=(performance.now()-t0)/10;
     return {id,ok:M&&M.id===id,w:M.w,h:M.h,stuck:M.SOLID.has(key(tx,ty)),exits:M.exits.length,objs:M.objs.length,ms:+ms.toFixed(1)}}catch(e){return {id,err:String(e).slice(0,120)}}},id);
  r.newErrors=errs.length-before;r.age=age;out.push(r)}
 await pg.evaluate(()=>clearInterval(window._qa));
}
const bad=out.filter(r=>r.err||!r.ok||r.stuck||r.newErrors);
console.log('maps tested:',out.length,'(adult+kid)');console.log('problems:',JSON.stringify(bad,null,0));
console.log('slowest:',JSON.stringify(out.filter(r=>r.ms).sort((a,b)=>b.ms-a.ms).slice(0,5).map(r=>r.id+':'+r.ms+'ms')));
console.log('errors',errs.length,errs.slice(0,6));await b.close();})();
