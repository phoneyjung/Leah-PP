// BUG-7, 8, 9, 10, 12, 13, 14 (ฟาร์ม): เขียนโดย Claude ก่อนแก้ · รุ่น 1.58 ได้ errors 7 · แก้ครบแล้วต้องได้ errors 0
// BUG-8 เพิ่มเข้าชุดนี้ 5 ต.ค. หลังเจ้าของตัดสินว่า "ป้ายบ้านหยุดขายที่ขั้น 3" · ดูรายละเอียดทุกข้อใน BUG_REPORT.md
// PORT=8775 node test_bugs_7_14_farm.js
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],results={};
async function check(name,fn){try{results[name]=await fn()}catch(e){errors.push(name+': '+e.message)}}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{const pg=await browser.newPage(),pageErrors=[];await pg.setViewport({width:1366,height:768});pg.on('pageerror',e=>pageErrors.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
  await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined'&&ROOM2,{timeout:40000});
  await pg.evaluate(()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.seen=S.seen||{};S.seen.intro=true;S.mus=false;save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'))});await sleep(1500);
  const clear=()=>pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false});
  const farm=async()=>{await pg.evaluate(()=>{delete CACHE.farm;goMap('farm')});await sleep(1200);await clear();
   await pg.evaluate(()=>{if(!window._says){window._says=[];const o=window.say;window.say=function(s){window._says.push(String(s));return o.apply(this,arguments)}}})};
  const says=()=>pg.evaluate(()=>{const a=window._says.slice();window._says.length=0;return a});
  const at=async(x,y)=>{await pg.evaluate((x,y)=>{closeModal();DLG=null;PAUSE=false;P.x=x;P.y=y;P.path=null;P.sit=null},x,y);await sleep(350)};
  // 2.00: อายุ 10+ สิ่งที่ทำตรงหน้าอยู่บนปุ่มเล็กข้างปุ่มตี (#bCtx200) · เด็กใช้ปุ่มใหญ่
  const press=async()=>{const id=await pg.evaluate(()=>{try{ctxShow200()}catch(e){}const b=document.getElementById('bCtx200');return !isKid()&&b&&!b.classList.contains('hide')?'#bCtx200':'#bAtk'});const e=await pg.$(id);const r=await e.boundingBox();await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(350)};   // ปุ่มจริง
  const clickFirst=async()=>{const b=await pg.$('#mBody button:not(#mX)');   /* 1.92 put the close button (#mX) first in a slim top bar */const r=await b.boundingBox();await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(900)};
  const setLv=lv=>pg.evaluate(lv=>{const h=HOME.get();h.lv=lv;if(h.house)h.house.lv=lv;HOME.put(h)},lv);
  await farm();const sign=await pg.evaluate(()=>[M.sign.x,M.sign.y+30]),shed=await pg.evaluate(()=>[M.shed.x,M.shed.y+30]);

  await check('BUG-7 ปุ่มซื้อบนป้ายบ้าน',async()=>{await setLv(1);await at(...sign);await press();
   const b=await pg.evaluate(()=>document.querySelector('#mBody button:not(#mX)').textContent.trim());await clear();
   assert(!b.includes('แล้ว'),'ปุ่มซื้อต้องไม่มีคำว่า "แล้ว": '+b);assert(b.includes('150'),'ปุ่มซื้อต้องบอกราคา 150: '+b);return b});

  await check('BUG-8 ป้ายบ้านหยุดขายที่ขั้น 3',async()=>{await setLv(3);await pg.evaluate(()=>{S.coins=5000;save()});await at(...sign);await press();
   const m=await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')?null:{text:document.getElementById('mBody').innerText,buttons:[...document.querySelectorAll('#mBody button')].length});
   if(m){const bs=await pg.$$('#mBody button');for(const b of bs){const r=await b.boundingBox();if(r){await pg.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(500)}if(await pg.evaluate(()=>document.getElementById('modal').classList.contains('hide')))break}}
   const after=await pg.evaluate(()=>({lv:HOME.get().lv,coins:S.coins}));await clear();await setLv(1);
   assert.equal(after.lv,3,'บ้านขั้น 3 แล้วกดทุกปุ่มบนป้าย ระดับต้องยังเป็น 3 (ได้ '+after.lv+')');assert.equal(after.coins,5000,'บ้านขั้น 3 แล้วกดปุ่มบนป้าย เหรียญต้องไม่ลด (เหลือ '+after.coins+')');
   assert(!m||!/3\s*→\s*4/.test(m.text),'ป้ายต้องไม่เสนอขาย "ขั้น 3 → 4"');return {after,sign:m&&m.text.replace(/\n/g,' ').slice(0,80)}});

  await check('BUG-9 ข้อความหลังขยายบ้าน',async()=>{const out={};
   for(const [lv,want,old] of [[2,/หนังสือ|บอล/,'ห้องครัว'],[3,/ชั้นบน|ชั้น 2|สองชั้น/,'บ้านกว้างขึ้น']]){await setLv(lv-1);await at(...sign);await says();await press();await clickFirst();
    assert.equal(await pg.evaluate(()=>HOME.get().lv),lv,'ซื้อขั้น '+lv+' ได้จริง');const s=(await says()).filter(x=>/🏠|🏡/.test(x));out[lv]=s;
    assert.equal(s.length,1,'ซื้อขั้น '+lv+' ต้องขึ้นข้อความเรื่องบ้าน 1 ข้อความ พบ '+s.length+': '+s.join(' / '));
    assert(!s[0].includes(old),'ขั้น '+lv+' ยังใช้คำของบ้านแบบเก่า: '+s[0]);assert(want.test(s[0]),'ขั้น '+lv+' ต้องบอกของที่ได้จริง: '+s[0])}
   return out});

  await check('BUG-10 ระดับบ้านในโรงเก็บของ',async()=>{const out={};
   for(const lv of [1,2,3]){await setLv(lv);await at(...shed);await press();const tx=await pg.evaluate(()=>document.getElementById('mBody').innerText);await clear();
    const m=tx.match(/(\d)\/3(?![\s\S]*\d\/3)/);out[lv]=m&&m[0];assert(m&&+m[1]===lv,'บ้านขั้น '+lv+' แต่หน้าสรุปแสดง '+(m&&m[0]))}
   await setLv(1);return out});

  await check('BUG-12 ข้อความเก็บผักตรงกับของที่ได้',async()=>{const out={};
   const p=await pg.evaluate(()=>{const q=M.plots[0];return [q.x,q.y+18,q.i]}),age=()=>pg.evaluate(i=>{const h=HOME.get();h.plots[i].t-=9e7;HOME.put(h)},p[2]);
   for(const star of [0,1]){await pg.evaluate(()=>{const h=HOME.get();h.plots={};h.fert=0;h.seeds.cab=5;h.pantry.cab=0;HOME.put(h)});
    await at(p[0],p[1]);await press();await pg.evaluate(()=>document.querySelector('[data-sd="cab"]').click());await sleep(250);
    await at(p[0],p[1]);await press();await age();await sleep(400);if(star)await pg.evaluate(()=>{const h=HOME.get();h.fert=1;HOME.put(h)});
    await at(p[0],p[1]);await press();await age();await sleep(400);await says();await at(p[0],p[1]);await press();
    const got=await pg.evaluate(()=>HOME.get().pantry.cab),s=(await says()).find(x=>x.includes('🧺'))||'';out[star?'ใส่ปุ๋ย':'ธรรมดา']={got,said:s};
    const n=(s.match(/[×x]\s*(\d+)/)||[])[1];assert.equal(+n,got,(star?'ใส่ปุ๋ย':'ธรรมดา')+': ได้จริง '+got+' แต่ข้อความบอก '+s)}
   return out});

  await check('BUG-13 ข้อความเมื่อแปลงผักเปิดเพิ่ม',async()=>{await pg.evaluate(()=>{const h=HOME.get();h.farm.cleared=[];h.plots={};HOME.put(h)});await farm();await says();
   const wild=await pg.evaluate(()=>M.wild.map(w=>w.wildId)),steps=[];let plots=await pg.evaluate(()=>M.plots.length);
   for(const id of wild){for(let n=0;n<4;n++){if(await pg.evaluate(id=>!M.wild.some(w=>w.wildId===id),id))break;await pg.evaluate(id=>clearWild(M.wild.find(w=>w.wildId===id)),id);await sleep(60)}
    const now=await pg.evaluate(()=>M.plots.length),s=await says();if(now!==plots)steps.push({added:now-plots,said:s});
    if(now===plots)assert(!s.some(x=>/\d+\s*แปลง/.test(x)&&x.includes('เพิ่ม')),'ไม่มีแปลงเพิ่ม แต่ขึ้นข้อความว่าได้แปลง: '+s.join(' / '));plots=now}
   assert(steps.length>=1,'ถางครบแล้วต้องมีแปลงเพิ่ม');
   for(const st of steps)assert(st.said.some(x=>x.includes(String(st.added))&&x.includes('แปลง')),'เปิดเพิ่ม '+st.added+' แปลง แต่ไม่มีข้อความบอกจำนวนนี้: '+(st.said.join(' / ')||'(ไม่มีข้อความ)'));
   await pg.evaluate(()=>{const h=HOME.get();h.farm.cleared=[];HOME.put(h)});return steps});

  await check('BUG-14 ปุ่มขายปลาและที่ตกปลา',async()=>{await pg.evaluate(()=>{goMap('h9');S.fishBag=[0,0,1]});await sleep(1300);await clear();
   const nu=await pg.evaluate(()=>{const q=M.npcs.find(n=>n.img==='npc_nuan');return [q.x,q.y+40]});await at(...nu);await press();
   for(let j=0;j<12&&await pg.evaluate(()=>!!DLG);j++){await pg.keyboard.press('Space');await sleep(250)}
   const label=await pg.evaluate(()=>(document.getElementById('fsBtn')||{}).textContent||'');assert(label,'ร้านยายนวลต้องมีปุ่มขายปลา');
   await pg.evaluate(()=>document.getElementById('fsBtn').click());await sleep(300);const left=await pg.evaluate(()=>S.fishBag.length);
   assert(left===0||!label.includes('ทั้งหมด'),'ปุ่มเขียนว่า "'+label+'" แต่กดแล้วเปิดรายการ ปลายังเหลือ '+left+' ตัว');
   await pg.evaluate(()=>{S.fishBag=[];openFishSell()});await sleep(200);const note=await pg.evaluate(()=>document.getElementById('mBody').innerText);await clear();
   const gone=await pg.evaluate(()=>{const out=[];for(const [id,w] of [['beach','ชายหาด'],['mountain','น้ำตก']]){goMap(id);if(M.id!==id)out.push(w)}return out});
   for(const w of gone)assert(!note.includes(w),'ข้อความบอกให้ไปตกปลาที่ "'+w+'" แต่ตอนนี้ไปที่นั่นไม่ได้');return {label,left,note:note.replace(/\n/g,' ').slice(0,80)}});

  assert.deepEqual(pageErrors,[],'ไม่มี error ในหน้าเกม');
 }catch(e){errors.push('suite: '+e.message)}finally{await browser.close()}
 console.log(JSON.stringify({results,errors}));console.log('errors '+errors.length);process.exitCode=errors.length?1:0})();
