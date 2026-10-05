// Wrong twice: read for ten real seconds, then close with a mouse/touch.
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const puppeteer=require('puppeteer'), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'q-thai-9.json'),'utf8')).questions.sort((a,b)=>b.th.explain.length-a.th.explain.length)[0];
const out=process.env.OUT_DIR||'/tmp/leah-questions-158';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']});const results=[];
 try{for(const vp of [{width:1366,height:768},{width:780,height:360,isMobile:true,hasTouch:true},{width:667,height:375,isMobile:true,hasTouch:true}]){
  const pg=await browser.newPage(),errors=[];await pg.setViewport(vp);pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
  await pg.waitForFunction(()=>!document.getElementById('load')&&QBANK.length>50);
  await pg.evaluate(q=>{gmMakeSlot();S=Store.all().slots[Store.all().cur];S.age=7;S.mus=false;S.snd=false;S.seen={intro:1};startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('cavemouth');MONS=[];const c=M.crystals[0];S.crystals[M.id]=[];c.awake=false;P.x=c.x;P.y=c.y+40;P.path=null;P.act=null;window.test158Crystal=c;window.test158Question=q;window.pick158=pickQuestion;window.pickQuestion=()=>window.test158Question;},fixture);
  await pg.waitForFunction(()=>{const a=anyNear();return a&&a.k==='actWake'||$('bAtk').textContent.includes('ปลุก')});
  const click=async sel=>vp.hasTouch?pg.tap(sel):pg.click(sel);
  await click('#bAtk');await pg.waitForSelector('.ch button',{visible:true,timeout:10000});
  const answer=await pg.evaluate(()=>window.test158Question.answer),wrong=[0,1,2,3].filter(i=>i!==answer);
  await click('.ch button[data-i="'+wrong[0]+'"]');await click('.ch button[data-i="'+wrong[1]+'"]');
  const start=Date.now();await sleep(10200);
  const state=await pg.evaluate(()=>{const b=$('qClose'),q=window.test158Question,r=b.getBoundingClientRect();return {open:!$('modal').classList.contains('hide'),explanation:$('qfb').textContent,expected:t('answer')+' '+q.th.choices[q.answer]+' · '+q.th.explain,disabled:[...document.querySelectorAll('.ch button')].every(b=>b.disabled),awake:window.test158Crystal.awake,stored:(S.crystals[M.id]||[]).includes(window.test158Crystal.id),width:r.width,height:r.height,coins:S.coins,book:S.book.filter(b=>b.id===q.id).length,label:b.textContent,color:getComputedStyle(b).color}});
  assert(state.open,'explanation stays open after ten seconds');assert.equal(state.explanation,state.expected);assert(state.disabled&&state.awake&&state.stored);assert(state.width>=48&&state.height>=48);assert.equal(state.book,1);assert.equal(state.label,'ปิด');assert.equal(state.color,'rgb(255, 240, 216)');
  await pg.evaluate(()=>{$('qfb').scrollIntoView({block:'center'});});await pg.screenshot({path:path.join(out,'explanation-'+vp.width+'.png')});
  await pg.evaluate(()=>{$('qClose').scrollIntoView({block:'center'});});await click('#qClose');
  assert(await pg.evaluate(()=>$('modal').classList.contains('hide')));assert.equal(await pg.evaluate(()=>S.coins),state.coins,'close does not award twice');assert.deepEqual(errors,[]);
  // A later wrong or correct button cannot reward the already completed quiz.
  await pg.evaluate(()=>document.querySelectorAll('.ch button').forEach(b=>b.click()));assert.equal(await pg.evaluate(()=>S.coins),state.coins);
  results.push({viewport:vp.width+'x'+vp.height,waitMs:Date.now()-start,button:state.width+'x'+state.height,explanationChars:state.explanation.length,awake:true,errors:errors.length});await pg.close();
 }console.log(JSON.stringify(results));console.log('errors 0');}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();}})();
