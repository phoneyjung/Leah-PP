// ระบบคริสตัล ขั้น 1: บาเรีย + ปุ่มสำรวจ (DESIGN_CRYSTAL_JOB.md ข้อ 4.1 และตารางข้อ 6)
// เขียนโดย Claude "ก่อน" ลงมือทำ · Codex แก้ index.html จนชุดนี้ได้ errors 0 · ห้ามแก้ไฟล์นี้ (ถ้าเห็นว่าชุดทดสอบผิด ให้แจ้งเจ้าของ)
//
//   PORT=8775 node test_crystal_step1_barrier.js            รุ่น 1.58 (ยังไม่มีบาเรีย) ได้ errors 6
//   SHIM=1 PORT=8775 node test_crystal_step1_barrier.js     ใส่บาเรียจำลองจากชุดทดสอบเอง เพื่อพิสูจน์ว่าชุดทดสอบผ่านได้จริง
//                                                           (ตัวจำลองไม่ใช่โค้ดที่ต้องนำไปใช้ · ได้ errors 0)
// เจ้าของตัดสิน 5 ต.ค.: รัศมีบาเรีย 48 px ไม่ย้ายคริสตัล (ที่ 96 px บาเรียตัดทางเดินในถ้ำ)
//
// ข้อตกลงที่ชุดทดสอบใช้ (มีแค่ 3 อย่าง นอกนั้นวัดจากพฤติกรรม):
//   1. รัศมีบาเรีย: ถ้าเกมประกาศค่าคงที่ CRYSTAL_BARRIER_R ชุดทดสอบใช้ค่านั้น ไม่งั้นใช้ 48 px ตามสเปก · ศูนย์กลาง = (c.x, c.y) ของ M.crystals
//   2. คำบนปุ่มใหญ่เมื่ออยู่ในบาเรีย = t('actExplore') และต้องมีคำนี้ทั้งไทยและอังกฤษ
//   3. ผู้เล่นเสียเลือดผ่านค่า S.hp (ของเดิม)
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results={};
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message.split('\n')[0])}}
const MAPS_WITH_CRYSTALS=['cavemouth','hunt1'];

(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{const pg=await browser.newPage(),pageErrors=[];await pg.setViewport({width:1366,height:768});pg.on('pageerror',e=>pageErrors.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
  await pg.waitForFunction(()=>!document.getElementById('load')&&typeof QBANK!=='undefined'&&QBANK.length>50&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:40000});
  const start=async(kid)=>{await pg.evaluate(kid=>{if(kid){const d=Store.all(),g=newSave({name:'Kid',kid:1,house:0,age:7});d.slots.push(g);d.cur=d.slots.length-1;Store.put(d)}else gmMakeSlot();
    const d=Store.all();S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;S.tts=false;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'))},kid);await sleep(1500)};
  await start(false);

  if(process.env.SHIM)await pg.evaluate(()=>{   // ---- บาเรียจำลอง: ใช้พิสูจน์ชุดทดสอบเท่านั้น ----
   window.CRYSTAL_BARRIER_R=48;TX.th.actExplore='สำรวจ';TX.en.actExplore='Explore';
   const inB=(x,y)=>((M&&M.crystals)||[]).find(c=>Math.hypot(c.x-x,c.y-y)<48);
   const _u=update;update=function(){const r=_u.apply(this,arguments);try{for(const mo of MONS){const c=inB(mo.x,mo.y);if(c){const a=Math.atan2(mo.y-c.y,mo.x-c.x);mo.x=c.x+Math.cos(a)*48;mo.y=c.y+Math.sin(a)*48}}if(P&&inB(P.x,P.y))P.target=null}catch(e){}return r};
   const _h=hurtPlayer;hurtPlayer=function(){if(P&&inB(P.x,P.y))return;return _h.apply(this,arguments)};
   const go=()=>{const c=inB(P.x,P.y);P.target=null;if(c&&!c.awake)tapWorld(c.x,c.y-10)};
   const _n=anyNear;anyNear=function(){if(S&&M&&P&&!PAUSE&&!DLG&&inB(P.x,P.y))return {ic:'\u{1F48E}',k:'actExplore',fn:go};return _n.apply(this,arguments)};
   const _a=autoAct;autoAct=function(){if(P&&inB(P.x,P.y)){go();return}return _a.apply(this,arguments)};
   const _s=useSkill;useSkill=function(){if(P&&inB(P.x,P.y))return;return _s.apply(this,arguments)};
   const _j=useJob;useJob=function(){if(P&&inB(P.x,P.y))return;return _j.apply(this,arguments)}});

  // ---- ตัวช่วยฝั่งหน้าเกม ----
  const install=()=>pg.evaluate(()=>{const BR=typeof CRYSTAL_BARRIER_R==='number'?CRYSTAL_BARRIER_R:48,cs=()=>M.crystals||[];
   const dC=(x,y)=>Math.min(...cs().map(c=>Math.hypot(c.x-x,c.y-y)));
   const spot=(c,dist,only)=>{const out=[];for(let a=0;a<24;a++){const x=c.x+Math.cos(a*Math.PI/12)*dist,y=c.y+Math.sin(a*Math.PI/12)*dist;if(!blockedAt(M,x,y)&&cs().every(o=>o===c||Math.hypot(o.x-x,o.y-y)>BR+30))out.push([x,y])}return only?out[0]||null:out};
   const best=()=>cs().map((c,i)=>({i,n:spot(c,BR+70).length,inside:!!spot(c,BR*.85,1)&&!!spot(c,BR*.6,1)})).filter(o=>o.inside).sort((a,b)=>b.n-a.n)[0];
   window._bt={BR,dC,spot,best,clear(){closeModal();DLG=null;PAUSE=false;P.path=null;P.target=null;P.act=null;P.sit=null},
    put(x,y){this.clear();P.x=x;P.y=y},
    pack(c,dist,n){const ps=spot(c,dist),ms=MONS.filter(m=>!m.happy&&!m.boss).slice(0,n),used=[];ms.forEach((m,k)=>{const p=ps[Math.floor(k*ps.length/ms.length)];if(!p)return;m.x=p[0];m.y=p[1];m.hp=m.max=1e6;m.st='chase';m.stun=0;used.push(m)});return used}}});
  const enter=async id=>{await pg.evaluate(id=>{try{delete CACHE[id]}catch(e){}goMap(id)},id);await sleep(1300);await install();await pg.evaluate(()=>_bt.clear());
   assert.equal(await pg.evaluate(()=>M.id),id,'เปิดฉาก '+id+' ได้');assert(await pg.evaluate(()=>(M.crystals||[]).length>0),'ฉาก '+id+' มีคริสตัล')};
  const label=()=>pg.evaluate(()=>document.getElementById('atkL').textContent.trim());
  const pressBig=async()=>{const e=await pg.$('#bAtk');const r=await e.boundingBox();await pg.mouse.click(r.x+r.width/2,r.y+r.height/2)};   // ปุ่มใหญ่จริง
  const quizOpen=()=>pg.evaluate(()=>!document.getElementById('modal').classList.contains('hide')&&document.querySelectorAll('#mBody .ch button').length===4);
  // ยืนที่จุด [x,y] แล้วปล่อยฝูงมอนสเตอร์ที่ถูกสั่งให้ไล่ตลอดเวลา (กรณีแย่ที่สุด เช่นโดนสกิลยั่ว) · คืนเลือดก่อน/หลัง และระยะใกล้คริสตัลที่สุดที่มอนสเตอร์เข้าไปถึง
  const siege=(ci,stand,sec,dist)=>pg.evaluate(async(ci,stand,sec,dist)=>{const c=M.crystals[ci];_bt.put(stand[0],stand[1]);const ms=_bt.pack(c,dist,6),hp0=S.hp;let minC=1e9,minP=1e9;
    const t0=performance.now();while(performance.now()-t0<sec*1000){await new Promise(r=>setTimeout(r,50));for(const m of ms){m.st='chase';m.taunt=performance.now()+2000;m.hp=m.max;minC=Math.min(minC,Math.hypot(m.x-c.x,m.y-c.y));minP=Math.min(minP,Math.hypot(m.x-P.x,m.y-P.y))}
     P.x=stand[0];P.y=stand[1];P.target=null;P.path=null;if(PAUSE||DLG){closeModal();DLG=null;PAUSE=false}}
    return {mons:ms.length,hp0,hp1:S.hp,dead:!!P.dead,minToCrystal:Math.round(minC),minToPlayer:Math.round(minP),BR:_bt.BR}},ci,stand,sec,dist);

  await enter('hunt1');
  const pick=await pg.evaluate(()=>_bt.best());assert(pick&&pick.n>=3,'หาคริสตัลที่มีที่ว่างรอบ ๆ พอสำหรับทดสอบได้');
  const geo=await pg.evaluate(i=>{const c=M.crystals[i];return {BR:_bt.BR,in40:_bt.spot(c,_bt.BR*.6,1),in80:_bt.spot(c,_bt.BR*.85,1),out:_bt.spot(c,_bt.BR+60,1),c:[c.x,c.y]}},pick.i);
  results.setup={map:'hunt1',crystal:pick.i,ring:pick.n,BR:geo.BR};

  await check('1 คำว่า สำรวจ มีทั้งไทยและอังกฤษ',async()=>{const w=await pg.evaluate(()=>({th:TX.th.actExplore,en:TX.en.actExplore}));
   assert(w.th&&w.en,'ต้องมีคำ actExplore ทั้งไทยและอังกฤษ พบ '+JSON.stringify(w));return w});

  await check('2 ปุ่มใหญ่เป็น สำรวจ เมื่ออยู่ในบาเรีย',async()=>{const want=await pg.evaluate(()=>t('actExplore')),out={want};
   for(const [nm,p] of [['ในบาเรีย ใกล้คริสตัล',geo.in40],['ในบาเรีย ใกล้ขอบ',geo.in80]]){await pg.evaluate(p=>_bt.put(p[0],p[1]),p);await sleep(500);out[nm]=await label();
    assert.notEqual(want,'actExplore','ยังไม่มีคำ actExplore');assert.equal(out[nm],want,nm+': ปุ่มต้องเขียนว่า '+want)}
   await pg.evaluate(p=>_bt.put(p[0],p[1]),geo.out);await sleep(500);out['นอกบาเรีย 60 px']=await label();assert.notEqual(out['นอกบาเรีย 60 px'],want,'นอกบาเรียปุ่มต้องไม่ใช่ สำรวจ');return out});

  await check('3 กด สำรวจ จากในบาเรีย แล้วเดินไปเปิดกิจกรรมของคริสตัล',async()=>{await pg.evaluate(p=>_bt.put(p[0],p[1]),geo.in80);await sleep(400);await pressBig();
   let open=false;for(let k=0;k<30&&!open;k++){await sleep(200);open=await quizOpen()}const d=await pg.evaluate(c=>Math.round(Math.hypot(P.x-c[0],P.y-c[1])),geo.c);await pg.evaluate(()=>_bt.clear());
   assert(open,'กดปุ่มใหญ่จากใกล้ขอบบาเรีย แล้ว 6 วินาทีต้องเห็นหน้าคำถาม 4 ตัวเลือก (ตัวละครอยู่ห่างคริสตัล '+d+' px)');return {opened:open,endDist:d}});

  await check('4 ในบาเรียโจมตีและใช้สกิลไม่ได้',async()=>{const out={};
   const prep=()=>pg.evaluate((ci,p)=>{const c=M.crystals[ci];_bt.put(p[0],p[1]);const a=Math.atan2(p[1]-c.y,p[0]-c.x),m=MONS.find(m=>!m.happy&&!m.boss);m.x=c.x+Math.cos(a)*(_bt.BR+24);m.y=c.y+Math.sin(a)*(_bt.BR+24);m.hp=m.max=5000;m.st='wander';m.stun=99;
     MONS.forEach(o=>{if(o!==m){o.hp=o.max}});window._m4=m;return {gap:Math.round(Math.hypot(m.x-P.x,m.y-P.y)),sum:MONS.reduce((s,o)=>s+o.hp,0)}},pick.i,geo.in80);
   const sum=()=>pg.evaluate(()=>MONS.reduce((s,o)=>s+o.hp,0));
   let b=await prep();assert(b.gap<170,'มอนสเตอร์เป้าหมายอยู่ในระยะโจมตี ('+b.gap+' px)');await sleep(300);await pressBig();await sleep(2500);await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false});out['ปุ่มใหญ่']=b.sum-await sum();
   for(const k of ['1','2','3']){b=await prep();await sleep(300);await pg.keyboard.press(k);await sleep(1500);out['ปุ่ม '+k]=b.sum-await sum()}
   await pg.evaluate(()=>{window._m4.stun=0;_bt.clear()});
   for(const [k,v] of Object.entries(out))assert.equal(v,0,k+': มอนสเตอร์เสียเลือด '+v+' ทั้งที่ผู้เล่นอยู่ในบาเรีย');return out});

  await check('5 ยืนในบาเรียกลางฝูง 10 วินาที เลือดไม่ลด และมอนสเตอร์หยุดที่ขอบ',async()=>{await enter('hunt1');const r=await siege(pick.i,geo.in40,10,geo.BR+70);
   assert(r.mons>=3,'มีมอนสเตอร์ในฝูงอย่างน้อย 3 ตัว (มี '+r.mons+')');assert.equal(r.hp1,r.hp0,'เลือดลดจาก '+r.hp0+' เหลือ '+r.hp1);assert(!r.dead,'ผู้เล่นต้องไม่ล้ม');
   assert(r.minToCrystal>=r.BR-8,'มอนสเตอร์เข้าไปถึงระยะ '+r.minToCrystal+' px จากคริสตัล (ขอบบาเรีย '+r.BR+' px)');return r});

  await check('6 คริสตัลที่เก็บแล้วก็มีบาเรีย',async()=>{await enter('hunt1');await pg.evaluate(i=>{const c=M.crystals[i];c.awake=true;S.crystals=S.crystals||{};S.crystals[M.id]=[...new Set([...(S.crystals[M.id]||[]),c.id])]},pick.i);
   const r=await siege(pick.i,geo.in40,5,geo.BR+70);await pg.evaluate(p=>_bt.put(p[0],p[1]),geo.in40);await sleep(500);r.label=await label();const want=await pg.evaluate(()=>t('actExplore'));
   assert.equal(r.hp1,r.hp0,'เลือดลดจาก '+r.hp0+' เหลือ '+r.hp1);assert(r.minToCrystal>=r.BR-8,'มอนสเตอร์เข้าไปถึงระยะ '+r.minToCrystal+' px');assert.equal(r.label,want,'ปุ่มข้างคริสตัลที่เก็บแล้วต้องเป็น '+want);return r});

  await check('7 นอกบาเรียยังอันตรายเหมือนเดิม และมอนสเตอร์กลับมาไล่ได้',async()=>{await enter('hunt1');
   const far=await pg.evaluate(()=>{let b=null;for(const m of MONS){const d=_bt.dC(m.hx,m.hy);if(!blockedAt(M,m.hx,m.hy)&&(!b||d>b.d))b={d,p:[m.hx,m.hy]}}return b});assert(far&&far.d>geo.BR+120,'มีจุดที่ห่างคริสตัลพอสำหรับทดสอบ');
   const r=await pg.evaluate(async(p)=>{_bt.put(p[0],p[1]);const hp0=S.hp,ms=_bt.pack({x:p[0],y:p[1]},60,6);let minP=1e9;const t0=performance.now();
     while(performance.now()-t0<12000&&S.hp===hp0){await new Promise(r=>setTimeout(r,50));for(const m of ms){m.st='chase';m.taunt=performance.now()+2000;m.hp=m.max;minP=Math.min(minP,Math.hypot(m.x-P.x,m.y-P.y))}P.x=p[0];P.y=p[1];P.target=null}
     return {mons:ms.length,hp0,hp1:S.hp,minToPlayer:Math.round(minP),sec:Math.round((performance.now()-t0)/100)/10}},far.p);
   assert(r.hp1<r.hp0,'ยืนนอกบาเรียกลางฝูง 12 วินาที เลือดต้องลด (บาเรียต้องไม่ทำให้ผู้เล่นอมตะทั้งฉาก) เลือด '+r.hp0+' → '+r.hp1);return r});

  await check('8 เด็กก็เห็นปุ่ม สำรวจ และเปิดคำถามได้',async()=>{await start(true);await enter('hunt1');const want=await pg.evaluate(()=>t('actExplore'));
   await pg.evaluate(p=>_bt.put(p[0],p[1]),geo.in80);await sleep(500);const lab=await label();assert.equal(lab,want,'เด็ก: ปุ่มต้องเขียนว่า '+want);
   await pressBig();let open=false;for(let k=0;k<30&&!open;k++){await sleep(200);open=await quizOpen()}await pg.evaluate(()=>_bt.clear());assert(open,'เด็ก: กดแล้วต้องเห็นหน้าคำถาม');return {label:lab,opened:open,kid:await pg.evaluate(()=>isKid())}});

  await check('9 ผังฉาก: บาเรียไม่ตัดทางเดิน และมอนสเตอร์ไม่เกิดในบาเรีย',async()=>{const out={};
   for(const id of MAPS_WITH_CRYSTALS){await enter(id);out[id]=await pg.evaluate(()=>{const BR=_bt.BR,inB=(x,y)=>M.crystals.some(c=>Math.hypot(c.x-x,c.y-y)<BR),ok=(x,y)=>walkable(M,x,y)&&!inB(x*T+16,y*T+16),seen=new Set(),parts=[];
     for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){if(seen.has(x+','+y)||!ok(x,y))continue;let n=0;const q=[[x,y]];seen.add(x+','+y);while(q.length){const [a,b]=q.pop();n++;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(a+dx)+','+(b+dy);if(a+dx<0||b+dy<0||a+dx>=M.w||b+dy>=M.h||seen.has(k)||!ok(a+dx,b+dy))continue;seen.add(k);q.push([a+dx,b+dy])}}parts.push(n)}
     return {parts:parts.filter(n=>n>=4).sort((a,b)=>b-a),monsInBarrier:MONS.filter(m=>inB(m.hx,m.hy)).length,spawnInBarrier:inB(M.spawnDefault[0],M.spawnDefault[1]),exitsInBarrier:M.exits.filter(e=>inB(e.x,e.y)).map(e=>e.id)}})}
   for(const [id,r] of Object.entries(out)){assert.equal(r.monsInBarrier,0,id+': มอนสเตอร์เกิดในบาเรีย '+r.monsInBarrier+' ตัว');assert(!r.spawnInBarrier,id+': จุดเกิดผู้เล่นอยู่ในบาเรีย');assert.deepEqual(r.exitsInBarrier,[],id+': ทางออกอยู่ในบาเรีย');
    assert.equal(r.parts.length,1,id+': บาเรียตัดพื้นที่เดินได้ของมอนสเตอร์เป็น '+r.parts.length+' ส่วน (ขนาด '+r.parts.join(', ')+' ช่อง) ต้องเหลือส่วนเดียว')}
   return out});

  await check('10 ไม่มี error ในหน้าเกม',async()=>{assert.deepEqual(pageErrors,[]);return 0});
 }catch(e){errors.push('suite: '+e.message.split('\n')[0])}finally{await browser.close()}
 console.log(JSON.stringify({results,errors}));console.log('errors '+errors.length);process.exitCode=errors.length?1:0})();
