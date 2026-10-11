// Claude 2.22: the owner's link opens the LOCKED Trickster set on the site (owner 11 Oct 18:12 "so my wife can open it and play without loading a file").
// The test locks its own tiny character (from test_221_tk.js) with a test key and serves it as tk-pack.bin, so the real set and the real key are never used here.
// Real taps: the link's button on a fresh phone (character screen) and on a phone that already has a player; the set downloads once, the window opens, a character is chosen,
// a name is set; the key leaves the address bar; reload does not download again; a wrong key, a missing set and no key never break the game; "delete" forgets the key.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),puppeteer=require('puppeteer');
const {nori,zip}=require('./test_221_tk.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-tk-222';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const b64u=b=>b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function seal(buf,key){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from('TKP1'));const ct=Buffer.concat([c.update(buf),c.final()]);return Buffer.concat([Buffer.from('TKP1'),iv,ct,c.getAuthTag()])}
const KEY=crypto.randomBytes(32),OTHER=crypto.randomBytes(32);
const PACK=seal(zip([['character/',Buffer.alloc(0),false],['character/chrT01.nri',nori(),true],['character/pal/jobT1.pal',Buffer.alloc(768,90),false]]),KEY);
const tap=async(p,s,touch)=>{await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)};
const msg=p=>p.evaluate(()=>($('msg')||{}).textContent||'');
async function ready(p){await p.waitForFunction(()=>window.TK221&&TK221.booted&&!$('load'),{timeout:45000});await sleep(400)}
// a phone with several players shows "who is playing?" after a reload: tap the GM card, then play (as the owner would)
async function pickGM(p,touch){if(await p.evaluate(()=>!S&&!!$('pk'))){const i=await p.evaluate(()=>Store.all().slots.findIndex(s=>s&&s.gm));await tap(p,'#pk>.pn:nth-child('+(i+1)+')',touch);await tap(p,'#pGo',touch);await sleep(1500)}}
async function quiet(p){await p.evaluate(()=>{try{S.snd=S.mus=false;S.joy=true}catch(e){}})}

(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,touch,mode] of (process.env.ONLY?[['has-player-ipad',1180,820,true,'player']]:null)||[['fresh-phone',844,390,true,'fresh'],['has-player-ipad',1180,820,true,'player'],['pc-link',1366,768,false,'fresh'],['wrong-key',844,390,true,'wrong'],['no-set',844,390,true,'nopack'],['no-key',844,390,true,'nokey']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});const R={name};
  await p.setBypassServiceWorker(true);await p.setRequestInterception(true);let asked=0;
  p.on('request',r=>{if(/\/tk-pack\.bin/.test(r.url())){asked++;if(mode==='nopack')return r.respond({status:404,contentType:'text/plain',body:'not found'});return r.respond({status:200,contentType:'application/octet-stream',headers:{'content-length':String(PACK.length)},body:PACK})}r.continue()});
  if(mode==='player'){await p.goto(base,{waitUntil:'load'});await p.waitForFunction(()=>typeof Store!=='undefined'&&typeof newSave==='function',{timeout:45000});
   await p.evaluate(()=>{const d=Store.all();const s=newSave({name:'Leah',kid:1,house:1,age:7});s.seen={intro:1};d.slots.push(s);d.cur=0;Store.put(d)})}
  const key=mode==='wrong'?OTHER:KEY;
  await p.goto(base+'?gm&tk'+(mode==='nokey'?'':'#tkk='+b64u(key)),{waitUntil:'load'});await ready(p);await quiet(p);
  R.address=await p.evaluate(()=>location.href.replace(location.origin,''));assert(!/tkk/.test(R.address),'the key leaves the address bar: '+R.address);assert(/\?gm&tk/.test(R.address));
  R.kept=await p.evaluate(()=>!!localStorage.getItem('la-tk222-key'));assert.equal(R.kept,mode!=='nokey');
  if(mode==='nokey'){await sleep(2500);R.button=await p.evaluate(()=>!!$('tk222go'));assert.equal(R.button,false,'no link, no button');
   await p.evaluate(()=>{gmMakeSlot()});await p.reload({waitUntil:'load'});await ready(p);await sleep(2500);R.asked=asked;assert.equal(asked,0,'no key: the set is never downloaded');
   R.gm=await p.evaluate(()=>gmOn());assert(R.gm);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // the link's button, on whatever screen the device is on
  await p.waitForSelector('#tk222go',{visible:true,timeout:8000});R.screen=await p.evaluate(()=>S?'game:'+S.name:'start');await p.screenshot({path:path.join(out,name+'-button.png')});
  R.before=await p.evaluate(()=>Store.all().slots.map(s=>({n:s.name,gm:!!s.gm,tk:!!s.tk221})));
  await Promise.all([p.waitForNavigation({waitUntil:'load',timeout:45000}),tap(p,'#tk222play',touch)]);await ready(p);await quiet(p);
  await p.waitForFunction(()=>gmOn(),{timeout:12000}).catch(()=>{});R.gm=await p.evaluate(()=>gmOn());assert(R.gm,'the button enters the GM slot (several players: the GM card is pressed for them)');
  R.after=await p.evaluate(()=>Store.all().slots.map(s=>({n:s.name,gm:!!s.gm,tk:!!s.tk221})));
  if(mode==='player'){assert.equal(R.after.length,2);assert.deepEqual(R.after[0],{n:'Leah',gm:false,tk:false},'the player slot is untouched')}
  if(mode==='wrong'||mode==='nopack'){await p.waitForFunction(()=>TK221.packTried&&!TK221.packing,{timeout:15000});await sleep(300);R.toast=await msg(p);R.ids=await p.evaluate(()=>(TK221.ids||[]).length);assert.equal(R.ids,0);
   assert(mode==='wrong'?/กุญแจ|key/.test(R.toast):/ยังไม่มีชุด|No character set/.test(R.toast),'says why: '+R.toast);R.window=await p.evaluate(()=>!!$('tk221'));assert.equal(R.window,false,'no window when nothing came');
   await p.evaluate(()=>openGM());await tap(p,'#gmTk221',touch);await p.waitForSelector('#tk221',{visible:true});R.status=await p.$eval('#tk221st',e=>e.textContent);assert(R.status.length>4,'the window says it too: '+R.status);R.retry=!!(await p.$('#tk222web'));assert(R.retry,'a button to try again');
   await p.evaluate(()=>closeModal());R.playable=await p.evaluate(async()=>{gmGhost(true);P.x=40*T;P.y=26*T;const a=P.x;P.path=null;keys.ArrowRight=1;await new Promise(r=>setTimeout(r,500));keys.ArrowRight=0;return Math.round(P.x-a)});assert(R.playable>20,'the game plays on');
   R.asked=asked;assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  // the set downloads once and the window opens by itself
  await p.waitForSelector('#tk221',{visible:true,timeout:20000});await p.waitForFunction(()=>document.querySelectorAll('#tk221chars .tkopt').length===1,{timeout:15000});
  R.asked=asked;assert.equal(asked,1,'downloaded once');R.ids=await p.evaluate(()=>TK221.ids.join());assert.equal(R.ids,'chrt01');R.web=!!(await p.$('#tk222web'));assert(R.web);
  R.saveHasNoPicture=await p.evaluate(()=>!/data:image|blob:|NORI|TKP1/.test(localStorage.getItem('leahpp2d-slots')||''));assert(R.saveHasNoPicture);
  await sleep(300);await p.screenshot({path:path.join(out,name+'-window.png')});
  await tap(p,'#tk221chars .tkopt[data-id="chrt01"]',touch);await p.waitForFunction(()=>PS.tk221,{timeout:15000});R.applied=await p.evaluate(()=>S.tk221.c);assert.equal(R.applied,'chrt01');
  // a name the other device sees
  await p.click('#tk222name',{clickCount:3});await p.keyboard.type('แป้งทดสอบชื่อยาวเกิน');await tap(p,'#tk222nameok',touch);R.nameSet=await p.evaluate(()=>S.name);assert.equal(R.nameSet,'แป้งทดสอบชื่อยาวเกิน'.slice(0,12),'12 letters at most (online rule)');
  R.sizes=await p.$$eval('#tk222web,#tk222nameok,#tk222name',bs=>bs.map(b=>Math.round(b.getBoundingClientRect().height)));assert(R.sizes.every(h=>h>=44),'44 px+: '+R.sizes);
  await tap(p,'#tk221x',touch);await sleep(600);R.shown=await p.evaluate(()=>TK221.shown&&TK221.shown[0]);assert(/^서있기_|^자동행동_/.test(R.shown||''),'drawn as the Trickster character: '+R.shown);
  await p.screenshot({path:path.join(out,name+'-world.png')});
  // reload: no second download, the character stays, no button
  await p.goto(base+'?gm&tk',{waitUntil:'load'});await ready(p);await pickGM(p,touch);await p.waitForFunction(()=>PS.tk221,{timeout:15000});await sleep(1500);R.reload={asked,char:await p.evaluate(()=>S.tk221.c),button:await p.evaluate(()=>!!$('tk222go'))};
  assert.equal(R.reload.asked,1,'no second download');assert.equal(R.reload.char,'chrt01');assert.equal(R.reload.button,false);
  if(name==='fresh-phone'){ // delete: files and key gone; the next open has no button and downloads nothing
   await p.evaluate(()=>openGM());await tap(p,'#gmTk221',touch);await p.waitForSelector('#tk221',{visible:true});await tap(p,'#tk221del',touch);await sleep(500);
   R.deleted=await p.evaluate(()=>({key:!!localStorage.getItem('la-tk222-key'),ids:(TK221.ids||[]).length,on:!!PS.tk221}));assert.deepEqual(R.deleted,{key:false,ids:0,on:false});
   await p.goto(base+'?gm&tk',{waitUntil:'load'});await ready(p);await sleep(2500);R.afterDelete={asked,button:await p.evaluate(()=>!!$('tk222go'))};assert.deepEqual(R.afterDelete,{asked:1,button:false})}
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
