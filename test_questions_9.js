// คลังคำถามอายุ 9 ในเกมจริง (DESIGN_CRYSTAL_JOB.md ข้อ 4.7): ไฟล์โหลดได้ · เปิดหน้าคำถามได้ทุกข้อ · กดเฉลยแล้วเกมนับว่าถูก · ข้อความไม่ล้นจอ · ไฟล์หายเกมยังเล่นได้
// แก้ 5 ต.ค. (Claude): ชุดนี้ดึงไฟล์คำถามเอง ไม่พึ่งว่าเกมโหลดไฟล์ไหนเข้า QBANK จึงใช้ได้ทั้งเกมที่โหลดทั้งคลังและเกมที่โหลดตามอายุ
// PORT=8775 node test_questions_9.js            (ตรวจทุกวิชาของอายุ 9 ที่มีไฟล์อยู่ในโฟลเดอร์)
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer'),out=process.env.OUT_DIR||'/tmp/leah-q9';fs.mkdirSync(out,{recursive:true});
const AGE=9,base='http://localhost:'+(process.env.PORT||8775)+'/?gm',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const idx=JSON.parse(fs.readFileSync(path.join(__dirname,'questions-index.json'),'utf8'));
const mine=idx.files.filter(f=>f.age===AGE),want=idx.files.reduce((a,f)=>a+f.count,0),wantAge=mine.reduce((a,f)=>a+f.count,0);
async function boot(browser,vp,block){const pg=await browser.newPage(),errs=[];await pg.setViewport(vp);pg.on('pageerror',e=>errs.push(e.message));
 if(block){await pg.setBypassServiceWorker(true);await pg.setRequestInterception(true);pg.on('request',r=>block.some(b=>r.url().includes(b))?r.respond({status:404,body:'gone'}):r.continue())}
 await pg.goto(base,{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load')&&typeof QBANK!=='undefined'&&QBANK.length>50,{timeout:40000});
 await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'))});await sleep(1200);
 return {pg,errs}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']}),R={};
 try{assert(mine.length,'questions-index.json มีไฟล์อายุ '+AGE);
  // 1) โหลดคลัง
  let {pg,errs}=await boot(browser,{width:780,height:360,isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const st=await pg.evaluate(async a=>{const idx=await fetch('questions-index.json',{cache:'no-cache'}).then(r=>r.json()),all=[],bad=[];
    for(const f of idx.files){try{const j=await fetch(f.file,{cache:'no-cache'}).then(r=>r.json());if(j.questions.length!==f.count)bad.push(f.file+' '+j.questions.length+'≠'+f.count);all.push(...j.questions)}catch(e){bad.push(f.file+' โหลดไม่ได้')}}
    window._Q9=all.filter(q=>q.age===a);return {all:all.length,age:window._Q9.length,ids:new Set(all.map(q=>q.id)).size,bad}},AGE);
  assert.deepEqual(st.bad,[],'ทุกไฟล์ในดัชนีโหลดได้และจำนวนข้อตรง');assert.equal(st.all,want,'จำนวนข้อทั้งคลังตรงกับดัชนี');assert.equal(st.age,wantAge,'จำนวนข้ออายุ '+AGE+' ตรงกับดัชนี');assert.equal(st.ids,st.all,'id ไม่ซ้ำทั้งคลัง');R.load=st;
  // 2) เปิดหน้าคำถามจริงทุกข้อ ทั้งสองภาษา กดเฉลย แล้ววัดว่าเกมนับถูกและข้อความไม่ล้น
  for(const vp of [{width:780,height:360,isMobile:true,hasTouch:true,deviceScaleFactor:2},{width:1024,height:768}]){await pg.setViewport(vp);await sleep(300);
   const r=await pg.evaluate(async a=>{if(!window._Q9){const idx=await fetch('questions-index.json',{cache:'no-cache'}).then(r=>r.json());window._Q9=[];for(const f of idx.files.filter(f=>f.age===a))window._Q9.push(...(await fetch(f.file,{cache:'no-cache'}).then(r=>r.json())).questions)}const qs=window._Q9,res={shown:0,rightAccepted:0,wrongRejected:0,overflow:[],offscreen:[]};
    const keep={pick:pickQuestion,wake:wakeCrystal,speak:window.speak,sfx:window.sfx,lang:LANG};let woke=null;
    window.wakeCrystal=(c,full)=>{woke=full};window.speak=()=>{};window.sfx=()=>{};
    for(const lang of ['th','en']){LANG=lang;for(const q of qs){if(lang==='en'&&q.subject==='thai')continue;
      window.pickQuestion=()=>q;woke=null;openQuiz({id:'t',x:0,y:0,awake:false});res.shown++;
      const bs=[...document.querySelectorAll('.ch button')],L=q[lang];
      if(bs.length!==4||bs.some((b,i)=>b.textContent!==L.choices[i])||document.querySelector('.qz').textContent!==L.q){res.overflow.push(q.id+':'+lang+':render');continue}
      const box=document.getElementById('mBody'),bad=[...bs,document.querySelector('.qz')].some(e=>e.scrollWidth>e.clientWidth+1),rc=box.getBoundingClientRect();
      if(bad)res.overflow.push(q.id+':'+lang);
      if(box.scrollHeight>box.clientHeight+1&&getComputedStyle(box).overflowY==='visible'||rc.right>innerWidth+1||rc.left<-1||(rc.bottom>innerHeight+1&&!['auto','scroll'].includes(getComputedStyle(box.parentElement).overflowY)&&!['auto','scroll'].includes(getComputedStyle(box).overflowY)))res.offscreen.push(q.id+':'+lang);
      const wrong=(q.answer+1)%4;bs[wrong].click();if(woke===null&&bs[wrong].disabled)res.wrongRejected++;
      bs[q.answer].click();if(woke===false)res.rightAccepted++;                 // ถูกหลังผิด 1 ครั้ง = ปลุกได้แต่ไม่เต็ม
      closeModal()}}
    window.pickQuestion=keep.pick;window.wakeCrystal=keep.wake;window.speak=keep.speak;window.sfx=keep.sfx;LANG=keep.lang;return res},AGE);
   const tag=vp.width+'x'+vp.height;R['quiz '+tag]={shown:r.shown,rightAccepted:r.rightAccepted,wrongRejected:r.wrongRejected,overflow:r.overflow.length,offscreen:r.offscreen.length,first:r.overflow.concat(r.offscreen).slice(0,6)};
   assert.equal(r.rightAccepted,r.shown,tag+' กดเฉลยแล้วเกมนับถูกทุกข้อ');assert.equal(r.wrongRejected,r.shown,tag+' กดตัวลวงแล้วเกมนับผิดทุกข้อ');
   assert.equal(r.overflow.length,0,tag+' ข้อความล้นปุ่ม: '+r.overflow.slice(0,6));assert.equal(r.offscreen.length,0,tag+' หน้าคำถามล้นจอ: '+r.offscreen.slice(0,6));
   // ภาพข้อที่ยาวที่สุดไว้ดูด้วยตา (รอให้ตัวปิดหน้าต่างที่ค้างจากข้อก่อน ๆ ทำงานจบก่อน)
   await sleep(3200);await pg.evaluate(async a=>{if(!window._Q9){const idx=await fetch('questions-index.json',{cache:'no-cache'}).then(r=>r.json());window._Q9=[];for(const f of idx.files.filter(f=>f.age===a))window._Q9.push(...(await fetch(f.file,{cache:'no-cache'}).then(r=>r.json())).questions)}const qs=window._Q9.slice(),len=q=>q.th.q.length+q.th.choices.join('').length,q=qs.sort((x,y)=>len(y)-len(x))[0];window._pk=pickQuestion;window.pickQuestion=()=>q;LANG='th';openQuiz({id:'t',x:0,y:0,awake:false});window.pickQuestion=window._pk},AGE);
   await sleep(300);await pg.screenshot({path:path.join(out,'longest-'+tag+'.png')});await pg.evaluate(()=>closeModal())}
  // 3) ตัวเลือกคำถามของเกมรุ่นนี้ยังไม่ส่งข้ออายุ 9 ให้ใคร (บันทึกไว้ให้ขั้น 2 ของสเปกแก้) · ไม่ใช่เกณฑ์ผ่าน/ตก
  R.pick=await pg.evaluate(a=>{const out={};for(const age of [8,9,10]){S.age=age;S.recent=[1,1,1,1,1,1,1,1,1,1];S.qr={};let n=0;for(let i=0;i<1000;i++)if(pickQuestion().age===a)n++;out['อายุ '+age]=n+'/1000'}return out},AGE);
  assert.deepEqual(errs,[],'ไม่มี error ในหน้าเกม');await pg.close();
  // 4) ไฟล์อายุ 9 หาย: เกมต้องเปิดได้ มีคำถามเดิมครบ ไม่จอขาว
  ({pg,errs}=await boot(browser,{width:1024,height:768},mine.map(f=>f.file)));
  const gone=await pg.evaluate(a=>({all:QBANK.length,age:QBANK.filter(q=>q.age===a).length,canPick:!!pickQuestion().id,canvas:!!document.getElementById('c')}),AGE);
  assert(gone.all>=20,'ไฟล์หาย: เกมยังมีคำถามให้ถาม (มี '+gone.all+' ข้อ)');assert.equal(gone.age,0);assert(gone.canPick&&gone.canvas,'ไฟล์หาย: เกมยังถามคำถามได้');assert.deepEqual(errs,[],'ไฟล์หาย: ไม่มี error');R.missingFile=gone;
  console.log(JSON.stringify(R,null,1));console.log('PASS test_questions_9');
 }catch(e){console.log(JSON.stringify(R,null,1));console.error('FAIL',e.message);process.exitCode=1}finally{await browser.close()}})();
