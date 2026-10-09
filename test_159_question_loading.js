// Count real HTTP requests from the page AND service worker, with isolated saved players.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=process.env.OUT_DIR||'/tmp/leah-questions-159';fs.mkdirSync(out,{recursive:true});
const index=JSON.parse(fs.readFileSync(path.join(__dirname,'questions-index.json')));
let requests=[],failure='',delay=false;
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
 const question=/^q-[a-z]+-\d+\.json$/.test(name);if(question)requests.push(name);const failForRequest=failure;
 const send=()=>{if((failForRequest==='all'&&(question||name==='questions-index.json'))||failForRequest===name){res.writeHead(404);return res.end('missing')}
  if(failForRequest==='corrupt'&&name==='q-math-7.json'){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{broken')}
  const p=path.resolve(__dirname,name);if(!p.startsWith(__dirname+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end('missing')}
   const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg'};
   res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)})};
 if(delay&&(/-6\.json$/.test(name)||/-7\.json$/.test(name)))setTimeout(send,900);else send();
});
function expected(age){return index.files.filter(f=>f.age>=6&&f.age<=8).map(f=>f.file).sort()}
function counts(age){assert.deepEqual(requests.slice().sort(),expected(age),'exact real question requests for age '+age);return {age,files:requests.length,requestedAges:[...new Set(requests.map(f=>Number(f.match(/-(\d+)\.json$/)[1])))].sort()}}
async function press(pg,sel,touch){const e=await pg.$(sel);assert(e,sel);await e.scrollIntoView();if(touch)await pg.tap(sel);else await pg.click(sel)}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/?gm';
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']});const results={};
 async function setup(age,touch=false,mode=''){
  failure=mode;requests=[];const ctx=await browser.createBrowserContext(),pg=await ctx.newPage(),errors=[];
  await pg.setViewport({width:touch?780:1366,height:touch?360:768,isMobile:touch,hasTouch:touch});pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto(url,{waitUntil:'load'});await pg.waitForFunction(()=>!$('load')&&QBANK.length>=60,{timeout:40000});
  await pg.evaluate(()=>navigator.serviceWorker.ready.then(r=>r.active.state));assert.deepEqual(requests,[],'no question precache before a player is selected');
  await pg.evaluate(a=>{const s=newSave({name:'age '+a,kid:0,house:0,age:a});s.gm=1;s.gmInit=1;s.seen={intro:1,first:1,floor:1};s.snd=s.mus=false;Store.put({v:2,cur:0,slots:[s]})},age);
  requests=[];await pg.reload({waitUntil:'load'});await pg.waitForFunction(()=>S&&M&&!$('load'),{timeout:40000});await pg.evaluate(()=>QUESTION_LOAD);
  return {ctx,pg,errors};
 }
 async function playQuiz(pg,touch){await pg.evaluate(()=>{DLG=null;$('dlg').classList.add('hide');closeModal();goMap('cavemouth');MONS=[];const c=M.crystals[0];c.awake=false;S.crystals[M.id]=[];P.x=c.x;P.y=c.y+40;P.path=P.act=null;window.fixture159=c});
  // 2.00: age 10+ explores with the small button beside the attack button (#bCtx200); a child with the big one
  await pg.waitForFunction(()=>isKid()?$('atkL').textContent===t('actExplore'):!$('bCtx200').classList.contains('hide')&&$('bCtx200').querySelector('.w200').textContent===t('actExplore'));
  await press(pg,await pg.evaluate(()=>isKid()?'#bAtk':'#bCtx200'),touch);await pg.waitForSelector('.ch button',{visible:true});
  const a=await pg.evaluate(()=>QBANK.find(q=>q.id===lastQ).answer),wrong=[0,1,2,3].filter(i=>i!==a);
  await press(pg,'.ch button[data-i="'+wrong[0]+'"]',touch);await press(pg,'.ch button[data-i="'+wrong[1]+'"]',touch);await press(pg,'#qClose',touch);await sleep(400);
  assert(await pg.evaluate(()=>$('modal').classList.contains('hide')&&window.fixture159.awake));
 }
 try{
  for(const [tag,age,touch,mode] of [['pc7',7,false,''],['touch7',7,true,''],['age6',6,false,''],['age8',8,false,''],['age9',9,false,''],['age10',10,false,''],['age12',12,false,''],['missing-one',7,false,'q-math-7.json'],['corrupt',7,false,'corrupt'],['all-missing',7,true,'all'],['adult',30,false,'']]){
   const {ctx,pg,errors}=await setup(age,touch,mode);try{
    if(mode==='all')assert.deepEqual(requests,[],'missing index uses embedded fallback without requesting files');else results[tag]=counts(age);
    const bank=await pg.evaluate(()=>({count:QBANK.length,bankAges:[...new Set(QBANK.map(q=>q.age))],pick:pickQuestion().age,ids:new Set(QBANK.map(q=>q.id)).size}));assert.equal(bank.ids,bank.count);assert(bank.pick<=8,'legacy question selection preserved');assert(bank.bankAges.every(a=>a>=6&&a<=8),'only supported ages in bank');if(!mode){const variety=await pg.evaluate(()=>{S.qr={};S.recent=[];return new Set(Array.from({length:400},()=>pickQuestion().id)).size});assert(variety>=250,'at least 250 distinct questions for '+age);bank.distinct=variety;}
    if(mode==='all')assert.equal(bank.count,60);else if(!mode)assert.equal(bank.count,2498);if(mode==='q-math-7.json'||mode==='corrupt')assert.equal(await pg.evaluate(()=>QBANK.filter(q=>q.age===7&&q.subject==='math').length),4,'missing group gets embedded questions');
    if(tag==='pc7'){
     await press(pg,'#gmBtn',false);requests=[];await press(pg,'[data-gm="age:9"]',false);await pg.evaluate(()=>QUESTION_LOAD);results.ageChange=counts(9);
     await press(pg,'#mX',false);
     await pg.evaluate(()=>{const d=Store.all();const q=newSave({name:'second age 7',age:7,kid:0,house:0});q.gm=q.gmInit=1;q.seen={intro:1};q.snd=q.mus=false;d.slots.push(q);Store.put(d)});
     await press(pg,'#bSet',false);requests=[];await Promise.all([pg.waitForNavigation({waitUntil:'load'}),press(pg,'#swP',false)]);await pg.waitForSelector('#pk .pn',{visible:true});await press(pg,'#pk .pn:nth-child(2) b',false);await press(pg,'#pGo',false);/* 1.93: a tap picks the player, 'adventure on' starts */await pg.evaluate(()=>QUESTION_LOAD);results.slotChange=counts(7);
     requests=[];delay=true;failure='q-math-7.json';const old=pg.evaluate(()=>{S.age=6;return loadQuestions(S.age,true)});await sleep(100);delay=false;failure='';const newer=pg.evaluate(()=>{S.age=9;return loadQuestions(S.age,true)});await Promise.all([old,newer]);delay=false;
     const state=await pg.evaluate(()=>({target:QUESTIONS_AGE,count:QBANK.length,age9:QBANK.filter(q=>q.age===9).length,age6:QBANK.filter(q=>q.age===6).length}));assert.equal(state.target,9);assert.equal(state.count,2498,'late missing-file result must not replace the newer full bank');assert.equal(state.age9,0);assert(state.age6>500);results.race=state;
     await pg.evaluate(()=>{S.age=7;return loadQuestions(S.age,true)});
    }
    await playQuiz(pg,touch);await pg.screenshot({path:path.join(out,tag+'.png')});assert.deepEqual(errors,[]);results[tag]={...(results[tag]||{}),...bank,played:true,errors:0};
   }finally{delay=false;await ctx.close()}
  }
  console.log(JSON.stringify(results));console.log('errors 0');
 }catch(e){console.error(e);process.exitCode=1}finally{await browser.close();await new Promise(r=>server.close(r))}
})();
