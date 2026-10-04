// test_121_beds.js — รุ่น 1.21: ทุกแปลงปลูกได้ · บล็อกปลูกตรงกับแปลง · กองไฟติดเองตอนค่ำ · ป้ายขยายบ้านไม่ถูกบ้านบัง · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 try{for(let i=0;i<10&&DLG;i++){if(typeof dlgNext==='function')dlgNext();else DLG=null;await sleep(120)}DLG=null;PAUSE=false}catch(e){}fpsChecks=6;
 const h=farmSave();h.farm.cleared=[];try{HOME.put(HOME.get())}catch(e){}delete CACHE.farm;goMap('farm');await sleep(1500);
 o.bedsAtStart={plantable:M.plots.length,weeds:M.wild.length,weedsByBed:[3,4].map(n=>G9.wild.filter(w=>w[3]===n).length)};
 // every planting spot lies on a painted block: the ground there is earth, not grass
 const g=M._base?M._base.getContext('2d'):M.ground.getContext('2d');const all=[].concat(G9.plots,G9.extra,G9B.extra3,G9B.extra4);let earth=0;for(const [x,y] of all){const q=g.getImageData(Math.round(x*T)-8,Math.round(y*T)-5,16,10).data;let r=0,gr=0;for(let i=0;i<q.length;i+=4){r+=q[i];gr+=q[i+1]}if(r>gr*1.05)earth++}o.spotsOnPaintedBlocks=[earth,all.length];
 const tap=p0=>!!M.plots.find(pl=>Math.abs(pl.x-p0[0]*T)<16&&Math.abs(pl.y-8-(p0[1]*T-8))<16);o.rightBedBeforeClearing=tap(G9B.extra3[0]);
 for(const n of [3,4]){for(const w of M.wild.slice()){if(G9.wild[w.wildId][3]===n)for(let k=0;k<5&&M.wild.includes(w);k++)clearWild(w)}await sleep(200);o['afterClearingBed'+n]={plantable:M.plots.length,weedsLeft:M.wild.length}}
 o.rightBedAfterClearing=tap(G9B.extra3[0]);o.bed4AfterClearing=tap(G9B.extra4[0]);
 P.x=G9B.extra3[2][0]*T;P.y=G9B.extra3[2][1]*T+10;await sleep(500);const b0=document.getElementById('atkL').textContent;o.buttonOnRightBed=b0;
 // fire
 GM.hour=12;await sleep(400);const day=M._fireOn;GM.hour=19;await sleep(400);const eve=M._fireOn;GM.hour=2;await sleep(400);const night=M._fireOn;GM.hour=7;await sleep(400);o.fire={noon:day,evening:eve,deepNight:night,morning:M._fireOn};
 // the sign stays clear of the house at every size
 const sx=M.sign.x,sy=M.sign.y;o.sign={at:[Math.round(sx),Math.round(sy)],clearOfHouse:[1,2,3].map(k=>{const [x0,y0,x1]=G9.houseBox[k];return !(sx>x0*T-20&&sx<x1*T+20&&sy<G9.houseBase*T+24)})};
 GM.hour=19;P.x=G9.camp[0]*T+70;P.y=G9.camp[1]*T+30;await sleep(2500);return o});
await pg.evaluate(()=>document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide')));await pg.screenshot({path:'b_fire.png'});
await pg.evaluate(async()=>{GM.hour=10;const h=HOME.get();h.plots=h.plots||{};const now=Date.now();M.plots.forEach((pl,i)=>{if(i%3===0)h.plots[pl.i]={st:'ripe',crop:['cab','car','tom','pum'][i%4],w:false,t:now};else if(i%3===1)h.plots[pl.i]={st:'sprout',crop:['cab','car','tom','pum'][i%4],w:true,t:now}});HOME.put(h);P.x=G9.extra[5][0]*T+150;P.y=G9.extra[5][1]*T-10;await new Promise(r=>setTimeout(r,2500))});await pg.screenshot({path:'b_beds.png'});
await pg.evaluate(()=>{GM.hour=null});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
