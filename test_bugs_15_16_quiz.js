// BUG-15 (ปุ่มปิดคำอธิบายเฉลยหลุดจอมือถือ) และ BUG-16 (การโหลดคำถามตามอายุทำให้ผู้เล่นอายุ 9 ขึ้นไปเหลือคำถามไม่กี่ข้อ)
// เขียนโดย Claude ก่อนแก้ · ห้ามแก้ไฟล์นี้ (ถ้าเห็นว่าชุดทดสอบผิด ให้แจ้งเจ้าของ) · รายละเอียดใน BUG_REPORT.md รอบที่ 4
//   PORT=8775 node test_bugs_15_16_quiz.js      main รุ่น 1.58 ได้ errors 2 · กิ่งร่าง 1.59 ได้ errors 4 · แก้ครบแล้วต้องได้ errors 0
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results={},base='http://localhost:'+(process.env.PORT||8775)+'/';
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message.split('\n')[0])}}
const AGES=[6,7,8,9,10,12,30],PHONES=[[667,375],[780,360],[844,390]];
const shut=async c=>{try{for(const p of await c.pages())await p.close()}catch(e){}try{await c.close()}catch(e){}};
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']}),pageErrors=[];
 // เปิดเกมในบริบทใหม่ (เซฟว่าง) สร้างผู้เล่นอายุที่กำหนด · นับคำขอไฟล์คำถามจริงทุกครั้ง
 async function open(age,vp,block){const ctx=await browser.createBrowserContext(),pg=await ctx.newPage(),req=[];await pg.setViewport(vp||{width:1366,height:768});
  pg.on('pageerror',e=>pageErrors.push(e.message));await pg.setBypassServiceWorker(true);
  if(block){await pg.setRequestInterception(true);pg.on('request',r=>/\/q-[a-z]+-\d+\.json/.test(r.url())?r.respond({status:404,body:'gone'}):r.continue())}
  pg.on('request',r=>{const m=r.url().match(/q-[a-z]+-(\d+)\.json/);if(m)req.push(+m[1])});
  await pg.goto(base,{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load')&&typeof newSave==='function'&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:40000});
  const play=async a=>{await pg.evaluate(a=>{const d=Store.all(),g=newSave({name:'T'+a,kid:a<12?1:0,house:0,age:a});d.slots.push(g);d.cur=d.slots.length-1;Store.put(d);S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;S.tts=false;save();startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'))},a);await sleep(2600);await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false})};
  await play(age);return {ctx,pg,req,play}}
 // สุ่มคำถามแบบที่เกมสุ่มจริง 3 สภาพ (ยังไม่มีสถิติ · ตอบเก่ง · ตอบพลาดบ่อย) แล้วดูว่าได้ข้อไม่ซ้ำกี่ข้อ และเป็นของอายุใดบ้าง
 const sample=pg=>pg.evaluate(()=>{const run=(recent,n)=>{S.qr={};S.recent=recent;const ids=new Set(),ages=new Set();for(let i=0;i<n;i++){const q=pickQuestion();ids.add(q.id);ages.add(q.age)}return {distinct:ids.size,ages:[...ages]}};
   const a=run([],400),b=run([1,1,1,1,1,1,1,1,1,1],300),c=run([0,0,0,0,0,0,0,0,0,0],300);S.qr={};S.recent=[];return {distinct:a.distinct,served:[...new Set([...a.ages,...b.ages,...c.ages])].sort((x,y)=>x-y),bank:QBANK.length}});
 try{
  await check('BUG-15 ปุ่มปิดคำอธิบายเฉลยอยู่ในจอมือถือ',async()=>{const out={};
   for(const [w,h] of PHONES){const {ctx,pg}=await open(7,{width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const r=await pg.evaluate(()=>{window.speak=()=>{};const qs=QBANK.slice().sort((a,b)=>b.th.explain.length-a.th.explain.length),res=[];
      for(const q of [qs[0],qs[qs.length-1]]){const pk=pickQuestion;window.pickQuestion=()=>q;const c={id:'t15',x:0,y:0,awake:false},wk=wakeCrystal;window.wakeCrystal=()=>{c.awake=true};openQuiz(c);window.pickQuestion=pk;
       const bs=[...document.querySelectorAll('#mBody .ch button')];bs[(q.answer+1)%4].click();bs[(q.answer+2)%4].click();window.wakeCrystal=wk;
       const cl=[...document.querySelectorAll('#mBody button')].filter(b=>!b.closest('.ch')).pop(),rc=cl.getBoundingClientRect(),fb=document.getElementById('qfb');
       res.push({id:q.id,open:!document.getElementById('modal').classList.contains('hide'),below:Math.round(rc.bottom-innerHeight),h:Math.round(rc.height),explainShown:!!fb&&fb.textContent.includes(q.th.explain.slice(0,12)),pt:[rc.left+rc.width/2,rc.top+rc.height/2]});
       if(res.length===1)closeModal()}return res});
    // แตะปุ่มปิดของข้อสุดท้ายด้วยนิ้วจริง โดยไม่เลื่อนจอ
    const last=r[r.length-1];if(last.below<=0){await pg.touchscreen.tap(last.pt[0],last.pt[1]);await sleep(400)}last.closed=await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide'));
    out[w+'x'+h]=r.map(x=>({id:x.id,below:x.below,h:x.h,closed:x.closed}));await shut(ctx);
    for(const x of r){assert(x.open&&x.explainShown,w+'x'+h+' '+x.id+': ตอบผิด 2 ครั้งแล้วต้องเห็นคำอธิบายค้างอยู่');assert(x.below<=0,w+'x'+h+' '+x.id+': ปุ่มปิดอยู่ต่ำกว่าขอบจอ '+x.below+' px ต้องเลื่อนจึงจะเห็น');assert(x.h>=44,w+'x'+h+': ปุ่มปิดสูง '+x.h+' px (ต้องอย่างน้อย 44)')}
    assert(last.closed,w+'x'+h+': แตะปุ่มปิดแล้วหน้าต่างต้องปิด')}
   return out});

  const per={};
  for(const age of AGES){const {ctx,pg,req}=await open(age);per[age]={...(await sample(pg)),fileAges:[...new Set(req)].sort((a,b)=>a-b),files:req.length};await shut(ctx)}
  results.perAge=per;
  await check('BUG-16ก ทุกอายุมีคำถามให้สุ่มหลากหลาย',async()=>{for(const [age,r] of Object.entries(per))assert(r.distinct>=250,'อายุ '+age+': สุ่ม 400 ครั้งได้คำถามไม่ซ้ำแค่ '+r.distinct+' ข้อ (ต้องอย่างน้อย 250) · คลังที่โหลด '+r.bank+' ข้อ · ไฟล์อายุ ['+r.fileAges+']');return Object.fromEntries(Object.entries(per).map(([a,r])=>[a,r.distinct]))});
  await check('BUG-16ข ไม่โหลดไฟล์ของอายุที่เกมไม่มีทางถาม',async()=>{for(const [age,r] of Object.entries(per)){const waste=r.fileAges.filter(a=>!r.served.includes(a));assert.deepEqual(waste,[],'อายุ '+age+': โหลดไฟล์อายุ ['+waste+'] แต่สุ่ม 1,000 ครั้งไม่เคยได้ข้อของอายุนั้น (ถามได้จริงแค่อายุ ['+r.served+'])')}
   return Object.fromEntries(Object.entries(per).map(([a,r])=>[a,r.files+' ไฟล์ อายุ '+r.fileAges.join(',')]))});
  await check('BUG-16ค เปลี่ยนช่องเซฟจากเด็ก 7 ขวบเป็นผู้ใหญ่ 30 แล้วยังมีคำถามหลากหลาย',async()=>{const {ctx,pg,play}=await open(7);const a=await sample(pg);await play(30);const b=await sample(pg);await shut(ctx);
   assert(a.distinct>=250,'เด็ก 7 ขวบ: ไม่ซ้ำ '+a.distinct);assert(b.distinct>=250,'ผู้ใหญ่ 30 หลังเปลี่ยนช่องเซฟ: ไม่ซ้ำแค่ '+b.distinct+' ข้อ (คลัง '+b.bank+')');return {kid7:a.distinct,adult30:b.distinct}});
  await check('ไฟล์คำถามหายทั้งหมด เกมยังถามได้',async()=>{const {ctx,pg}=await open(7,null,true);const r=await pg.evaluate(()=>{const q=pickQuestion();return {bank:QBANK.length,ok:!!(q&&q.id&&q.th&&q.th.choices.length===4),canvas:!!document.getElementById('c')}});await shut(ctx);
   assert(r.ok&&r.canvas&&r.bank>=20,'ไฟล์หาย: ต้องยังมีคำถามสำรอง '+JSON.stringify(r));return r});
  await check('ไม่มี error ในหน้าเกม',async()=>{assert.deepEqual(pageErrors,[]);return 0});
 }catch(e){errors.push('suite: '+e.message.split('\n')[0])}finally{await browser.close()}
 console.log(JSON.stringify({results,errors}));console.log('errors '+errors.length);process.exitCode=errors.length?1:0})();
