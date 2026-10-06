// Codex: real mouse/touch transactions in Thai and English, including a stale sign.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out='/tmp/leah-farm-162';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']});const results=[];
try{for(const touch of [false,true])for(const lang of ['th','en']){
 const ctx=await browser.createBrowserContext(),pg=await ctx.newPage(),errors=[];
 await pg.setViewport(touch?{width:667,height:375,isMobile:true,hasTouch:true}:{width:1366,height:768});pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined');
 await pg.evaluate(()=>{gmMakeSlot();S=Store.all().slots[Store.all().cur];S.mus=S.snd=false;S.seen={intro:1};startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));goMap('farm')});await sleep(2200);
 const press=async sel=>{await pg.waitForSelector(sel,{visible:true});const e=await pg.$(sel);await e.scrollIntoView();if(touch)await pg.tap(sel);else await pg.click(sel);await sleep(300)};
 await pg.evaluate(()=>{closeModal();DLG=null;PAUSE=false});await press('#bSet');await press(lang==='en'?'#lEn':'#lTh');await press('#mX');assert.equal(await pg.evaluate(()=>LANG),lang);
 const sign=async lv=>{await pg.evaluate(lv=>{closeModal();DLG=null;PAUSE=false;const h=HOME.get();h.lv=lv;HOME.put(h);P.x=M.sign.x;P.y=M.sign.y+30;P.path=null;P.sit=null},lv);await sleep(350);await press('#bAtk')};
 await pg.evaluate(()=>{window.feedback162=[];const old=say;window.say=function(s){feedback162.push(String(s));return old.apply(this,arguments)}});
 await sign(1);const offer=await pg.$eval('#hsUp',e=>e.textContent);assert(offer.includes('150'));assert(offer.includes(lang==='en'?'Expand house':'ขยายบ้าน'));
 await pg.evaluate(()=>{S.coins=10});await press('#hsUp');assert.deepEqual(await pg.evaluate(()=>[houseLv(),S.coins]),[1,10]);
 await pg.evaluate(()=>{S.coins=1000;feedback162=[]});await press('#hsUp');assert.deepEqual(await pg.evaluate(()=>[houseLv(),S.coins]),[2,850]);
 assert.equal(await pg.evaluate(()=>feedback162.filter(x=>/🏡|🏠/.test(x)).length),1);
 await sign(2);await pg.evaluate(()=>{feedback162=[]});await press('#hsUp');assert.deepEqual(await pg.evaluate(()=>[houseLv(),S.coins]),[3,550]);assert.equal(await pg.evaluate(()=>feedback162.filter(x=>/🏡|🏠/.test(x)).length),1);
 for(const lv of [3,4,9]){await sign(lv);assert.equal(await pg.$('#hsUp'),null);assert.equal(await pg.evaluate(()=>S.coins),550)}
 // Open an offer at L2, then another save/actor updates the house to L3 before purchase.
 await sign(2);await pg.evaluate(()=>{const h=HOME.get();h.lv=3;HOME.put(h)});await press('#hsUp');assert.deepEqual(await pg.evaluate(()=>[houseLv(),S.coins]),[3,550]);assert.equal(await pg.$('#hsUp'),null);
 await pg.screenshot({path:out+'/'+lang+'-'+(touch?'touch':'pc')+'-max.png'});
 // Existing produce is nonzero: feedback must report the increase, not the total.
 const yields=[];for(const star of [0,1]){
  await pg.evaluate(star=>{closeModal();DLG=null;PAUSE=false;const h=HOME.get(),p=M.plots[0];h.plots={};h.plots[p.i]={crop:'cab',st:'ripe',star,t:Date.now()};h.pantry.cab=20;HOME.put(h);P.x=p.x;P.y=p.y+18;P.path=null;feedback162=[]},star);await sleep(350);await press('#bAtk');
  const r=await pg.evaluate(()=>({added:HOME.get().pantry.cab-20,messages:feedback162.filter(x=>x.includes('🧺'))}));assert.equal(r.added,3+star);assert.equal(r.messages.length,1);assert(r.messages[0].endsWith('×'+r.added));yields.push(r);
 }
 // Use the existing shop button, then sell exactly one fish and the remainder by type.
 await pg.evaluate(()=>{closeModal();S.fishBag=[0,0,1];S.coins=1000;openShop()});await press('#fsBtn');assert.equal(await pg.evaluate(()=>S.fishBag.length),3);assert.equal(await pg.$eval('#mBody h2',e=>e.textContent.includes('ทั้งหมด')||e.textContent.includes('all')),false);
 const price=await pg.evaluate(()=>fishPrice(0));await press('[data-sell="0"]');assert.deepEqual(await pg.evaluate(()=>[S.fishBag.length,S.coins]),[2,1000+price]);await press('[data-sellall="0"]');await press('[data-sellall="1"]');assert.equal(await pg.evaluate(()=>S.fishBag.length),0);
 const note=await pg.$eval('#mBody',e=>e.innerText);assert(!/ชายหาด|น้ำตก|beach|waterfall/i.test(note));assert(/ฟาร์ม|farm/.test(note));assert.deepEqual(errors,[]);
 results.push({lang,touch,yields,errors:0});await ctx.close();
}console.log(JSON.stringify(results));console.log('errors 0');}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}})();
