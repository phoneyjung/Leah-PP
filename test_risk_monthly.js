// Claude 2.10 (10 Oct, monthly RISK_CHECKLIST): the numbers of items 2 and 7, measured on the game as it is now (the old play-src tools ran on the 2D preview).
// asserts: meta spread ≤ 15 % at Lv 30 and 60 (mean of 8 fixed item rolls) · run it alone, not in the parallel full run (frame and map-change times) · 55+ frames a second · no frame over 50 ms in 4 s of walking · every map change under 120 ms
// reports only (the owner decides the fix): pictures held in memory (limit 60 MB) — printed as "imgMB" with a warning line
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const url='http://localhost:'+(process.env.PORT||8775)+'/?rank=1';
// the damage-per-second model of tests/balance.py (play-src.zip), unchanged
const SIM=(lv)=>{const S=GAME.S,res={};const plan={sw:['str','str','vit'],dag:['agi','str','dex'],bow:['dex','dex','agi'],staff:['int','int','vit']};
  const J={sword:{w:'sw',sk:['bash','provoke']},archer:{w:'bow',sk:['shower','evade']},mage:{w:'staff',sk:['fire','bolt']},hunter:{w:'dag',sk:['steal','dash']}};
  const MULT={bash:[2.8,1,1],shower:[1.3,5,1],fire:[1.8,3,1],bolt:[1.4,3,1],ice:[1.2,1,1]};const WS={sw:[1.6,4],bow:[1.2*3,1],staff:[2.2,1.3],dag:[.9*2,1]};
  for(const [job,c] of Object.entries(J)){S.lv=lv;S.st={str:1,agi:1,vit:1,int:1,dex:1};let i=0;while(spLeft()>=statCost(S.st[plan[c.w][i%3]])){S.st[plan[c.w][i%3]]++;i++;if(i>600)break}
    S.inv=[mkItem(c.w,2)];S.inv[0].aff=[];S.inv[0].cards=[];S.eq=0;S.eqA=-1;S.eqC=-1;S.job=job;S.learn=JOBS[job].sk.slice();S.carry=null;S.buff=null;S.buff2=null;S.pets=[];
    const pow=atkPow(),cr=critCh(),cm=job==='hunter'?1.65:1.5,crit=1+cr*(cm-1),hitCd=WEP[c.w].cd/(S.inv[0].spd||1)/aspdMul();
    let single=pow*crit/hitCd,group=single*(c.w==='staff'?1.6:1);const [wm,wt]=WS[c.w],wcd=SKILL[c.w].cd*cdrMul();single+=pow*crit*wm/wcd;group+=pow*crit*wm*wt/wcd;
    for(const k of c.sk){const m=MULT[k];if(!m)continue;const cd=SK[k][1]*cdrMul();single+=pow*crit*m[0]/cd;group+=pow*crit*m[0]*Math.min(5,m[1])/cd}
    res[job]={single:Math.round(single),group:Math.round(group)}}
  const sv=Object.values(res).map(r=>r.single);res.spreadSingle=Math.round(100*(Math.max(...sv)/Math.min(...sv)-1));return res};
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),R={};let pg;
 try{for(const who of ['kid7','adult']){pg=await browser.newPage();const errors=[];pg.on('pageerror',e=>errors.push(e.message));await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});await pg.setBypassServiceWorker(true);
  await pg.goto(url,{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(2000);
  await pg.evaluate(who=>{const d=Store.all();d.slots=[newSave({name:'P',kid:who==='kid7'?0:5,house:1,age:who==='kid7'?7:30})];d.cur=0;Store.put(d);S=d.slots[0];S.seen={intro:1};startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;try{closeModal()}catch(e){}},who);await sleep(2500);
  const r=await pg.evaluate(async()=>{const res={};
   const walk=async ms=>{let last=performance.now(),n=0,hitch=0,worst=0;const t0=last,pts=[[1,0],[0,1],[-1,0],[0,-1]];let k=0;const iv=setInterval(()=>{const p=pts[k++%4];P.path=[[P.x+p[0]*96,P.y+p[1]*96]]},700);
     await new Promise(res=>{const f=()=>{const t=performance.now(),d=t-last;last=t;n++;if(d>50)hitch++;if(d>worst)worst=d;if(t-t0<ms)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});clearInterval(iv);return {fps:+(n/(ms/1000)).toFixed(1),hitch,worst:Math.round(worst)}};
   res.walkStart=await walk(4000);res.mapMs={};for(const m of ['farm','cavemouth','h9','room','capital']){const a=performance.now();goMap(m);P.path=P.act=null;res.mapMs[m]=Math.round(performance.now()-a);await new Promise(r=>setTimeout(r,600))}
   res.walkFarm=await walk(4000);let img=0;for(const v of Object.values(IMG)){if(v&&(v.naturalWidth||v.width))img+=(v.naturalWidth||v.width)*(v.naturalHeight||v.height)*4}res.imgMB=+(img/1048576).toFixed(1);return res});
  // the item rolls are random (one roll gave 17 %, another 13 %): the mean of 8 fixed rolls per job, so the number only moves when the game's numbers move
  if(who==='adult')for(const lv of [30,60])r['lv'+lv]=await pg.evaluate((src,lv)=>{const SIM=eval('('+src+')'),orig=Math.random,acc={},one=[];
    for(let k=1;k<=8;k++){let x=k*7919;Math.random=()=>{x=(x*9301+49297)%233280;return x/233280};const q=SIM(lv);one.push(q.spreadSingle);for(const j of ['sword','archer','mage','hunter'])(acc[j]=acc[j]||[]).push(q[j].single)}
    Math.random=orig;const mean=Object.fromEntries(Object.entries(acc).map(([j,a])=>[j,Math.round(a.reduce((x,y)=>x+y,0)/a.length)])),v=Object.values(mean);
    return {mean,spreadSingle:Math.round(100*(Math.max(...v)/Math.min(...v)-1)),rollSpread:[Math.min(...one),Math.max(...one)]}},SIM.toString(),lv);
  r.errors=errors.length;r.firstErrors=[...new Set(errors)].slice(0,3);R[who]=r;await pg.close()}
  console.log(JSON.stringify(R));
  for(const [who,r] of Object.entries(R)){for(const w of [r.walkStart,r.walkFarm]){assert(w.fps>=55,who+' frames '+w.fps);assert.equal(w.hitch,0,who+' frames over 50 ms')}
   assert(Object.values(r.mapMs).every(ms=>ms<120),who+' map change '+JSON.stringify(r.mapMs));assert.equal(r.errors,0);if(r.imgMB>60)console.log('WARNING '+who+': pictures in memory '+r.imgMB+' MB (checklist limit 60)')}
  assert(R.adult.lv30.spreadSingle<=15&&R.adult.lv60.spreadSingle<=15,'meta spread '+R.adult.lv30.spreadSingle+'% / '+R.adult.lv60.spreadSingle+'%');
  console.log('errors 0')
 }catch(e){console.error(e);console.log(JSON.stringify(R));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
