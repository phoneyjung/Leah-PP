// มินิเกม 18+ (minigames.js · DESIGN_CRYSTAL_JOB.md ข้อ 5): ด่านที่สร้างแก้ได้เสมอ · แต่ละเกมชนะได้ แพ้ได้ หมดเวลาได้ ด้วยการแตะ/คลิกจริง · พอดีจอมือถือ
// เขียนโดย Claude · PORT=8775 node test_minigames.js · ต้องได้ errors 0
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results={},url='http://localhost:'+(process.env.PORT||8775)+'/minigames-demo.html';
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message.split('\n')[0])}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']}),pageErrors=[];
 try{
  const page=async vp=>{const pg=await browser.newPage();await pg.setViewport(vp);pg.on('pageerror',e=>pageErrors.push(e.message));await pg.goto(url,{waitUntil:'load'});await pg.waitForFunction(()=>!!window.CrystalGames);return pg};
  const PC={width:1366,height:768},PHONE={width:667,height:375,isMobile:true,hasTouch:true,deviceScaleFactor:2};
  let pg=await page(PC);

  await check('1 ตัวสร้างด่าน 500 ด่านต่อระดับ',async()=>{const r=await pg.evaluate(()=>{const G=CrystalGames,out={};
    for(const lv of [1,25,50]){const o={pipesUnsolvedAtStart:0,pipesSolvable:0,pipesPathOk:0,oddOk:0,memOk:0};
     for(let s=1;s<=500;s++){const rand=G._rng(s*7+lv);
      const p=G._make.pipes(lv,rand);if(!G._pipesLit(p).solved)o.pipesUnsolvedAtStart++;
      const first=p.path[0],last=p.path[p.path.length-1];if(first[0]===0&&first[1]===p.r0&&last[0]===p.n-1&&last[1]===p.r1&&new Set(p.path.map(c=>c[1]*p.n+c[0])).size===p.path.length)o.pipesPathOk++;
      for(const c of p.path){const t=p.tiles[c[1]*p.n+c[0]];t.rot=t.sol}if(G._pipesLit(p).solved)o.pipesSolvable++;
      const d=G._make.odd(lv,rand);if(d.odd>=0&&d.odd<d.n*d.n&&['shade','rot','sides'].includes(d.kind)&&d.n===G.CFG.odd.size[G.CFG.tier(lv)])o.oddOk++;
      const m=G._make.memory(lv,rand);if(m.rounds.map(x=>x.length).join()===G.CFG.memory.rounds.join()&&m.rounds.every(x=>x.every((v,i)=>v>=0&&v<m.n&&v!==x[i-1])))o.memOk++}
     out[lv]=o}return out});
   for(const [lv,o] of Object.entries(r))for(const [k,v] of Object.entries(o))assert.equal(v,500,'เลเวล '+lv+' '+k+' = '+v+' จาก 500');return r});

  // ---- เล่นจริง: เริ่มเกมด้วยเมล็ดสุ่มคงที่ แล้วแตะตามตำแหน่งที่โมดูลบอก ----
  const startGame=(pg,game,level,seed,scale)=>pg.evaluate((game,level,seed,scale)=>{CrystalGames.CFG.timeScale=scale||1;CrystalGames.CFG.endDelay=200;window._res=null;CrystalGames.play({game,level,seed,lang:'th'}).then(r=>window._res=r);return true},game,level,seed,scale);
  const tapCell=async(pg,i,touch)=>{const p=await pg.evaluate(i=>{const r=CrystalGames.state().hits[i];return [r.x+r.w/2,r.y+r.h/2]},i);if(touch)await pg.touchscreen.tap(p[0],p[1]);else await pg.mouse.click(p[0],p[1]);await sleep(60)};
  const result=async pg=>{await pg.waitForFunction(()=>window._res,{timeout:15000});const r=await pg.evaluate(()=>({res:window._res,overlay:!!document.getElementById('cgOverlay'),active:!!CrystalGames.state()}));assert(!r.overlay&&!r.active,'จบแล้วต้องลบแผ่นทับออก');return r.res};
  const fits=pg=>pg.evaluate(()=>{const s=CrystalGames.state(),b=s.box(),q=s.quitRect();return {inside:b.x>=0&&b.y>=0&&b.x+b.w<=innerWidth&&b.y+b.h<=innerHeight&&s.hits.every(r=>r.x>=b.x&&r.y>=b.y&&r.x+r.w<=b.x+b.w+1&&r.y+r.h<=b.y+b.h+1),minCell:Math.round(Math.min(...s.hits.map(r=>Math.min(r.w,r.h)))),quit:Math.round(Math.min(q.w,q.h)),n:s.hits.length}});
  const winMemory=async(pg,touch)=>{for(let k=0;k<3;k++){await pg.waitForFunction(k=>{const s=CrystalGames.state();return s&&s.round===k&&s.phase==='input'},{timeout:15000},k);const seq=await pg.evaluate(()=>CrystalGames.state().seq.slice());for(const i of seq)await tapCell(pg,i,touch)}};
  const winOdd=async(pg,touch)=>{for(let k=0;k<3;k++){await pg.waitForFunction(k=>{const s=CrystalGames.state();return s&&s.found===k},{timeout:8000},k);await tapCell(pg,await pg.evaluate(()=>CrystalGames.state().odd),touch)}};
  const winPipes=async(pg,touch)=>{const todo=await pg.evaluate(()=>{const s=CrystalGames.state();return s.path.map(c=>{const i=c[1]*s.n+c[0],t=s.tiles[i];return [i,(t.sol-t.rot+4)%4]})});
   for(const [i,n] of todo)for(let k=0;k<n;k++){if(await pg.evaluate(()=>!CrystalGames.state()||CrystalGames.state().phase==='end'))return;await tapCell(pg,i,touch)}};

  for(const [tag,vp,touch] of [['คอม 1366x768',PC,false],['มือถือ 667x375',PHONE,true]]){await pg.close();pg=await page(vp);
   await check('2 ชนะได้ด้วยการ'+(touch?'แตะ':'คลิก')+'จริง · '+tag,async()=>{const out={};
    for(const lv of [1,25,50])for(const [g,fn] of [['memory',winMemory],['odd',winOdd],['pipes',winPipes]]){await startGame(pg,g,lv,lv*31+g.length,g==='memory'?4:1);await sleep(150);const f=await fits(pg);
      assert(f.inside,g+' เลเวล '+lv+': ช่องเกมล้นจอ');assert(f.minCell>=44,g+' เลเวล '+lv+': ช่องที่ต้องแตะเล็กแค่ '+f.minCell+' px (ต้องอย่างน้อย 44)');assert(f.quit>=44,'ปุ่มเลิกเล่นเล็กเกิน');
      await fn(pg,touch);const r=await result(pg);assert(r.win&&r.reason==='win'&&r.game===g,g+' เลเวล '+lv+': ต้องชนะ ได้ '+JSON.stringify(r));out[g+' lv'+lv]=f.n+' ช่อง · เล็กสุด '+f.minCell+' px'}
    return out});
   await check('3 แพ้ได้และหมดเวลาได้ · '+tag,async()=>{const out={};
    // จำแสง: แตะผิดช่อง = แพ้ทันที
    await startGame(pg,'memory',1,5,4);await pg.waitForFunction(()=>CrystalGames.state().phase==='input',{timeout:15000});await tapCell(pg,await pg.evaluate(()=>{const s=CrystalGames.state();return (s.seq[0]+1)%s.n}),touch);
    let r=await result(pg);assert(!r.win&&r.reason==='wrong','จำแสง แตะผิดต้องแพ้: '+JSON.stringify(r));out.memoryWrong=r.reason;
    // จำแสง: ไม่แตะเลย = หมดเวลา (เร่งเวลา 40 เท่า)
    await startGame(pg,'memory',1,6,40);r=await result(pg);assert(!r.win&&r.reason==='timeout','จำแสง ไม่แตะต้องหมดเวลา: '+JSON.stringify(r));out.memoryTimeout=r.reason;
    // จับผิด: แตะผิดหักเวลา 3 วินาที และยังไม่แพ้ทันที · ไม่แตะต่อ = หมดเวลา
    await startGame(pg,'odd',1,7,1);await sleep(150);const before=await pg.evaluate(()=>CrystalGames.state().left);await tapCell(pg,await pg.evaluate(()=>{const s=CrystalGames.state();return (s.odd+1)%(s.n*s.n)}),touch);
    const after=await pg.evaluate(()=>({left:CrystalGames.state().left,phase:CrystalGames.state().phase}));out.oddPenaltyMs=Math.round(before-after.left);assert(after.phase==='play','จับผิด แตะผิดครั้งเดียวต้องยังเล่นต่อ');assert(out.oddPenaltyMs>=2900&&out.oddPenaltyMs<=3600,'จับผิด แตะผิดต้องหักราว 3 วินาที หักจริง '+out.oddPenaltyMs+' ms');
    await pg.evaluate(()=>{CrystalGames.CFG.timeScale=60});r=await result(pg);assert(!r.win&&r.reason==='timeout','จับผิด ต้องหมดเวลา: '+JSON.stringify(r));out.oddTimeout=r.reason;
    // ต่อเส้น: ไม่แตะ = หมดเวลา
    await startGame(pg,'pipes',1,8,90);r=await result(pg);assert(!r.win&&r.reason==='timeout','ต่อเส้น ต้องหมดเวลา: '+JSON.stringify(r));out.pipesTimeout=r.reason;
    // ปุ่มเลิกเล่น
    await startGame(pg,'pipes',1,9,1);await sleep(150);const q=await pg.evaluate(()=>{const q=CrystalGames.state().quitRect();return [q.x+q.w/2,q.y+q.h/2]});if(touch)await pg.touchscreen.tap(q[0],q[1]);else await pg.mouse.click(q[0],q[1]);
    r=await result(pg);assert(!r.win&&r.reason==='quit','กดเลิกเล่น: '+JSON.stringify(r));out.quit=r.reason;return out})}

  await check('4 สุ่มเกมได้ครบ 3 เกม และเรียกซ้อนกันไม่ได้',async()=>{const r=await pg.evaluate(async()=>{CrystalGames.CFG.timeScale=400;CrystalGames.CFG.endDelay=10;const seen=new Set();let twice='';
     for(let s=1;s<=30;s++){const p=CrystalGames.play({game:'random',level:1,seed:s});if(s===1){try{await CrystalGames.play({game:'odd'});twice='allowed'}catch(e){twice='refused'}}
      const q=CrystalGames.state().quitRect();document.getElementById('cgOverlay').dispatchEvent(new PointerEvent('pointerdown',{clientX:q.x+5,clientY:q.y+5,bubbles:true}));seen.add((await p).game)}
     return {games:[...seen].sort(),twice}});assert.deepEqual(r.games,['memory','odd','pipes']);assert.equal(r.twice,'refused','เรียกเกมซ้อนขณะเล่นอยู่ต้องถูกปฏิเสธ');return r});
  await check('5 ไม่มี error ในหน้า',async()=>{assert.deepEqual(pageErrors,[]);return 0});
 }catch(e){errors.push('suite: '+e.message.split('\n')[0])}finally{await browser.close()}
 console.log(JSON.stringify({results,errors}));console.log('errors '+errors.length);process.exitCode=errors.length?1:0})();
