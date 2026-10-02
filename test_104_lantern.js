const p=require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
(async()=>{const b=await p.launch({executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8775/',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const r=await pg.evaluate(async()=>{const o={};const said=[];const _s=say;say=function(x){said.push(String(x).slice(0,30));return _s.apply(this,arguments)};
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});startGame();await new Promise(r=>setTimeout(r,1500));document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 setInterval(()=>{LITE=false;fpsChecks=99;DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);
 // converter tiles must be open floor
 o.convOpen={};for(const [id,list] of Object.entries(CONVERTERS)){goMap(id,'s');await new Promise(r=>setTimeout(r,300));o.convOpen[id]=convList().map(([x,y])=>!M.SOLID.has(key(x,y)))}
 // walk 100 tiles in the cave: lantern must drop by 100/500 = 20 %
 goMap('cavemouth','s');await new Promise(r=>setTimeout(r,300));S.lamp=1;const x0=P.x,y0=P.y;
 PAUSE=false;for(let i=0;i<100;i++){P.x=x0+((i%2)?16:0);P.y=y0;await new Promise(r=>requestAnimationFrame(r))}
 o.after100=S.lamp;
 // converter: stand on it -> +50 %, again -> resting
 S.lamp=.3;const [cx,cy]=convList()[0];P.x=cx*T+16;P.y=cy*T+16;await new Promise(r=>setTimeout(r,300));o.afterConv=+S.lamp.toFixed(2);
 S.lamp=.3;P.x+=100;await new Promise(r=>setTimeout(r,200));P.x-=100;await new Promise(r=>setTimeout(r,300));o.secondTry=+S.lamp.toFixed(2);
 // run out: 5 s walking back -> fade -> village beside the crystal, full lantern
 S.lamp=0.002;P.x=x0;P.y=y0;await new Promise(r=>requestAnimationFrame(r));for(let i=0;i<6;i++){P.x+=20;await new Promise(r=>requestAnimationFrame(r))}
 const t0=performance.now();for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,100));if(M.id==='capital')break}
 o.outMs=Math.round(performance.now()-t0);o.wokeIn=M.id;o.lampNow=S.lamp;await new Promise(r=>setTimeout(r,1200));
 // adults: no lantern drain
 S.age=30;goMap('cavemouth','s');await new Promise(r=>setTimeout(r,300));S.lamp=1;for(let i=0;i<40;i++){P.x+=(i%2?-16:16);await new Promise(r=>requestAnimationFrame(r))}o.adultLamp=S.lamp;
 o.msgs=said.filter(x=>/แสง|เติม|ลูมิน|เครื่อง/.test(x));return o});
console.log(JSON.stringify(r,null,1));console.log('errors',errs.length,errs.slice(0,3));await b.close()})();
