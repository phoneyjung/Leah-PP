// Claude 2.21: the Trickster test mode (?gm&tk). The test builds its own tiny character file in the same format (NORI v303, 8-bit + palette, 36 actions × 8 directions)
// and zips it, so no outside picture is needed or stored. Real taps on the GM button, the file chooser, the action buttons and the stick; the game's own buttons and functions
// (emote, blink, sit, attack, hurt, faint, dig, idle) switch the move; reload keeps it; the online record carries the character; another device's player is drawn from the zip;
// without ?tk nothing is fetched; a missing tk-test.js, a refused browser store and a broken file never break the game.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-tk-221';fs.mkdirSync(out,{recursive:true});
const base='http://localhost:'+(process.env.PORT||8775)+'/';
const KR={"서있기":"bcadc0d6b1e2","걷기":"b0c8b1e2","달리기":"b4deb8aeb1e2","공격":"b0f8b0dd","공격2":"b0f8b0dd32","무기크리티컬":"b9abb1e2c5a9b8aec6bcc4c3","마법":"b8b6b9fd","기모으기":"b1e2b8f0c0b8b1e2","던지기":"b4f8c1f6b1e2","공격준비":"b0f8b0ddc1d8baf1","공격모드":"b0f8b0ddb8f0b5e5","피격":"c7c7b0dd","기절":"b1e2c0fd","아래":"bec6b7a1","피하기":"c7c7c7cfb1e2","막기":"b8b7b1e2","방패막기":"b9e6c6d0b8b7b1e2","점프":"c1a1c7c1","기뻐하기":"b1e2bbb5c7cfb1e2","화내기":"c8adb3bbb1e2","슬퍼하기":"bdbdc6dbc7cfb1e2","자동행동":"c0dab5bfc7e0b5bf","자동행동2":"c0dab5bfc7e0b5bf32","잠자기":"c0e1c0dab1e2","앉기":"bec9b1e2","의자앉기1":"c0c7c0dabec9b1e231","의자앉기2":"c0c7c0dabec9b1e232","땅파기0":"b6a5c6c4b1e230","땅파기1":"b6a5c6c4b1e231","땅파기2":"b6a5c6c4b1e232","땅파기3":"b6a5c6c4b1e233","땅파기4":"b6a5c6c4b1e234","땅파기5":"b6a5c6c4b1e235","땅파기6":"b6a5c6c4b1e236","땅파기7":"b6a5c6c4b1e237","땅파기8":"b6a5c6c4b1e238","대각오른쪽앞":"b4ebb0a2bfc0b8a5c2cabed5","오른쪽":"bfc0b8a5c2ca","대각오른쪽뒤":"b4ebb0a2bfc0b8a5c2cab5da","위":"c0a7","대각왼쪽뒤":"b4ebb0a2bfdec2cab5da","왼쪽":"bfdec2ca","대각왼쪽앞":"b4ebb0a2bfdec2cabed5"};
const ACTS=['서있기','걷기','달리기','공격','공격2','무기크리티컬','마법','기모으기','던지기','공격준비','공격모드','피격','기절','아래','피하기','막기','방패막기','점프','기뻐하기','화내기','슬퍼하기','자동행동','자동행동2','잠자기','앉기','의자앉기1','의자앉기2','땅파기0','땅파기1','땅파기2','땅파기3','땅파기4','땅파기5','땅파기6','땅파기7','땅파기8'];
const DIRS=['아래','대각오른쪽앞','오른쪽','대각오른쪽뒤','위','대각왼쪽뒤','왼쪽','대각왼쪽앞'];
// one bitmap per action (24×40, palette colour 1+action) and per direction a 2-pixel marker so every view is different; walk/run 6 frames of 0.1 s, the others 3 frames of 0.2 s (a one-time move lasts 0.6 s, so the checks never sit on its last instant)
function nori(){const W=24,H=40,bm=[];for(let a=0;a<ACTS.length;a++)for(let d=0;d<8;d++){const px=Buffer.alloc(W*H);for(let y=2;y<H;y++)for(let x=4;x<W-4;x++)px[y*W+x]=1+a;px[1*W+2+d*2]=200;bm.push(px)}
 const pal=Buffer.alloc(768);for(let a=0;a<ACTS.length;a++){pal[(1+a)*3]=(a*7)&255;pal[(1+a)*3+1]=255-a*5;pal[(1+a)*3+2]=40+a*6}pal[600]=255;pal[601]=255;pal[602]=255;
 const u32=v=>{const b=Buffer.alloc(4);b.writeUInt32LE(v>>>0);return b},i32=v=>{const b=Buffer.alloc(4);b.writeInt32LE(v);return b};
 const frames=Buffer.concat(bm.map(px=>Buffer.concat([u32(1),u32(px.length),u32(W),u32(H),u32(0),u32(0),u32(0),px])));
 const anims=[];for(let a=0;a<ACTS.length;a++)for(let d=0;d<8;d++){const name=Buffer.alloc(32);Buffer.from(KR[ACTS[a]]+'5f'+KR[DIRS[d]],'hex').copy(name);const nf=(a===1||a===2)?6:3;
  const fr=[];for(let f=0;f<nf;f++)fr.push(Buffer.concat([u32(nf===6?100:200),u32(1),i32(a*8+d),i32(-12+f),i32(-38),i32(100),i32(0),i32(0),i32(16),u32(0)]));
  const offs=[];let o=0;for(const b of fr){offs.push(u32(o));o+=b.length}anims.push(Buffer.concat([name,u32(nf),...offs,...fr]))}
 const aoffs=[];let o=0;for(const b of anims){aoffs.push(u32(o));o+=b.length}
 const palBlock=Buffer.concat([Buffer.from('PAL_'),u32(100),Buffer.alloc(16),u32(0),u32(800),pal]);
 const nb=bm.length,head=Buffer.concat([Buffer.from('NORI'),u32(303),Buffer.alloc(20),u32(anims.length),u32(0),u32(0),Buffer.from('GAWI'),u32(300),u32(8),u32(0),u32(1),Buffer.alloc(16),u32(nb),u32(frames.length)]);
 return Buffer.concat([head,palBlock,Buffer.alloc(4*nb),frames,...aoffs,...anims])}
function crc32(b){let c,crc=0xffffffff;for(let n=0;n<b.length;n++){c=(crc^b[n])&255;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c}return (crc^0xffffffff)>>>0}
function zip(files){const parts=[],cd=[];let off=0;for(const [name,data,deflate] of files){const nm=Buffer.from(name),comp=deflate?zlib.deflateRawSync(data):data,crc=crc32(data);
  const lh=Buffer.alloc(30);lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt16LE(deflate?8:0,8);lh.writeUInt32LE(crc,14);lh.writeUInt32LE(comp.length,18);lh.writeUInt32LE(data.length,22);lh.writeUInt16LE(nm.length,26);parts.push(lh,nm,comp);
  const ch=Buffer.alloc(46);ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);ch.writeUInt16LE(deflate?8:0,10);ch.writeUInt32LE(crc,16);ch.writeUInt32LE(comp.length,20);ch.writeUInt32LE(data.length,24);ch.writeUInt16LE(nm.length,28);ch.writeUInt32LE(off,42);cd.push(ch,nm);off+=30+nm.length+comp.length}
 const cdb=Buffer.concat(cd),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(files.length,8);e.writeUInt16LE(files.length,10);e.writeUInt32LE(cdb.length,12);e.writeUInt32LE(off,16);return Buffer.concat([...parts,cdb,e])}
const zipPath=path.join(out,'character-test.zip'),badPath=path.join(out,'chrbad.nri');
fs.writeFileSync(zipPath,zip([['character/',Buffer.alloc(0),false],['character/chrT01.nri',nori(),true],['character/pal/jobT1.pal',Buffer.alloc(768,90),false]]));fs.writeFileSync(badPath,Buffer.from('this is not a picture file'));
async function press(p,s,touch=false){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await(touch?p.tap(s):p.click(s));await sleep(150)}
async function enter(p,mapId='h9'){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(m=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};S.age=12;ensureDaily();S.daily.seen=1;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap(m);P.path=P.act=null;fpsChecks=6},mapId);await sleep(2500)}
async function pick(p,touch,files){const [ch]=await Promise.all([p.waitForFileChooser({timeout:8000}),(async()=>{await p.waitForSelector('#tk221pick',{visible:true});touch?await p.tap('#tk221pick'):await p.click('#tk221pick')})()]);await ch.accept(files);await sleep(1200)}
const shown=p=>p.evaluate(()=>TK221.shown&&TK221.shown.join('#'));
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,touch,mode] of [['phone',844,390,true,''],['ipad',1180,820,true,''],['pc',1366,768,false,''],['plain',844,390,true,'plain'],['nojs',844,390,true,'nojs'],['nostore',812,375,true,'nostore']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,isMobile:touch,hasTouch:touch});const R={name};
  const asked=[];p.on('request',r=>{if(r.url().includes('tk-test.js'))asked.push(r.url())});
  if(mode==='nojs'){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('tk-test.js')?r.abort():r.continue())}
  if(mode==='nostore')await p.evaluateOnNewDocument(()=>{try{Object.defineProperty(window,'indexedDB',{get(){throw Error('blocked by the test')}})}catch(e){}});
  if(mode==='plain'){await p.goto(base+'?gm',{waitUntil:'load'});await enter(p);await p.evaluate(()=>{S.tk221={c:'chrT01',p:''};buildPlayerSheets()});await sleep(800);
   R.fetched=asked.length;R.button=await p.evaluate(()=>{openGM();const b=!!document.getElementById('gmTk221');closeModal();return b});R.drawn=await p.evaluate(()=>!PS.tk221&&!window.TK221);
   assert.equal(R.fetched,0,'without ?tk the test file is never fetched');assert.equal(R.button,false);assert(R.drawn,'the normal character');await p.evaluate(()=>{delete S.tk221;save()});assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.goto(base+'?gm&tk',{waitUntil:'load'});await enter(p);
  if(mode==='nojs'){await sleep(500);R.loaded=await p.evaluate(()=>!!window.TK221);assert.equal(R.loaded,false);R.playable=await p.evaluate(async()=>{const a=P.x;P.path=null;keys.ArrowRight=1;await new Promise(r=>setTimeout(r,500));keys.ArrowRight=0;return Math.round(P.x-a)});assert(R.playable>20,'plays without the test file');
   assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>window.TK221&&TK221.booted,{timeout:15000});const original=await p.evaluate(()=>PS.stand.toDataURL());
  await press(p,'#gmBtn',touch);await press(p,'#gmTk221',touch);await p.waitForSelector('#tk221',{visible:true});
  R.empty=await p.$eval('#tk221st',e=>e.textContent);assert(/ยังไม่มีไฟล์|No file/.test(R.empty));
  await pick(p,touch,[badPath]);await p.waitForSelector('#tk221chars .tkopt[data-id="chrbad"]');await p.$eval('#tk221chars .tkopt[data-id="chrbad"]',b=>b.click());await sleep(600);R.bad={on:await p.evaluate(()=>!!PS.tk221),status:await p.$eval('#tk221st',e=>e.textContent)};assert.equal(R.bad.on,false,'a broken file is not used');assert(/ใช้ไม่ได้|Not usable/.test(R.bad.status),'says so: '+R.bad.status);
  await pick(p,touch,[zipPath]);await p.waitForFunction(()=>document.querySelectorAll('#tk221chars .tkopt').length===2,{timeout:15000});
  if(mode==='nostore')assert(await p.evaluate(()=>!!TK221.mem),'kept in memory when the browser refuses');
  await p.$eval('#tk221chars .tkopt[data-id="chrt01"]',b=>b.scrollIntoView());await press(p,'#tk221chars .tkopt[data-id="chrt01"]',touch);
  await p.waitForFunction(()=>PS.tk221,{timeout:15000});R.applied=await p.evaluate(()=>({c:S.tk221.c,saved:Store.all().slots[Store.all().cur].tk221.c,acts:Object.keys(TK221.cur.N.anims).length,F:PS.F,FA:TK221.cur.FA}));
  assert.equal(R.applied.c,'chrt01');assert.equal(R.applied.saved,'chrt01');assert.equal(R.applied.acts,288,'36 moves × 8 directions read');
  R.saveHasNoPicture=await p.evaluate(()=>!/data:image|blob:|NORI/.test(localStorage.getItem('leahpp2d-slots')||''));assert(R.saveHasNoPicture);
  R.buttons=await p.$$eval('#tk221 .tkb button,#tk221pick',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return Math.round(r.height)}));assert(R.buttons.every(h=>h>=44),'buttons 44 px+: '+R.buttons);
  await p.screenshot({path:path.join(out,name+'-window.png')});
  // a move from the window's own buttons, shown in the facing direction with the file's own pixels
  await p.evaluate(()=>{P.row=2});await p.$eval('#tk221acts .tkopt[data-act="기뻐하기"]',b=>b.scrollIntoView());await press(p,'#tk221acts .tkopt[data-act="기뻐하기"]',touch);await sleep(150);
  R.happy=await shown(p);assert(/^기뻐하기_오른쪽#/.test(R.happy),'happy, facing right: '+R.happy);
  R.pixel=await p.evaluate(()=>{const c=TK221.scratch,g=c.getContext('2d'),F=c.width,d=g.getImageData(F/2,F-20,1,1).data;return [d[0],d[1],d[2],d[3]]});assert.deepEqual(R.pixel,[18*7,255-18*5,40+18*6,255],'the file colour of that move');
  await sleep(500);R.happyEnds=await shown(p);assert(/^서있기_/.test(R.happyEnds),'a one-time move goes back to standing: '+R.happyEnds);
  // walking the 8 ways: every direction's walk drawn
  await p.evaluate(()=>{gmGhost(true);P.x=40*T;P.y=26*T;P.path=P.act=null;window.tkSeen=new Set();const o=drawPlayer;drawPlayer=function(){const r=o.apply(this,arguments);if(TK221.shown)tkSeen.add(TK221.shown[0]);return r}});
  const poses=[['ArrowDown'],['ArrowDown','ArrowRight'],['ArrowRight'],['ArrowUp','ArrowRight'],['ArrowUp'],['ArrowUp','ArrowLeft'],['ArrowLeft'],['ArrowDown','ArrowLeft']],vec=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];const cdp=touch?await p.createCDPSession():null;R.walked=[];
  for(let i=0;i<8;i++){const a=await p.evaluate(()=>[P.x,P.y]);if(touch){const j=await p.$eval('#joy',e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});const [x,y]=vec[i],n=Math.hypot(x,y);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:j.x,y:j.y,id:1}]});await sleep(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:j.x+38*x/n,y:j.y+38*y/n,id:1}]})}
    else for(const k of poses[i])await p.keyboard.down(k);await sleep(450);if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else for(const k of poses[i])await p.keyboard.up(k);await sleep(120);
    const z=await p.evaluate(()=>[P.x,P.y]);R.walked.push(Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])))}
  R.walkDirs=await p.evaluate(()=>[...tkSeen].filter(n=>n.startsWith('걷기_')).length);assert.equal(R.walkDirs,8,'walk drawn in all 8 directions');assert(R.walked.every(d=>d>20),'walks every way: '+R.walked);
  await p.evaluate(()=>{gmGhost(false);P.path=null;P.moving=false;P.row=0;for(const m of MONS)m.happy=1});await sleep(300);
  // the game's own buttons and functions
  const look=async ms=>{await sleep(ms);return (await shown(p)||'').split('_')[0]};R.moves={};
  await p.evaluate(()=>{$('bEmo').click();document.querySelector('#emo button').click()});R.moves.emote=await look(200);
  await sleep(2600);await p.evaluate(()=>{lastMove.x=1;lastMove.y=0;const b=$('bDash');b?b.click():doDash()});R.moves.blink=await look(60);
  await sleep(1500);await p.evaluate(()=>{const b=$('bSit');b?b.click():toggleSit()});R.moves.sit=await look(500);await p.evaluate(()=>{P.sit=0});
  await sleep(300);await p.evaluate(()=>{P.cd=0;doAttack({x:P.x+30,y:P.y,hp:99,max:99})});R.moves.attack=await look(80);
  await sleep(1200);await p.evaluate(()=>hurtPlayer(1));R.moves.hurt=await look(40);
  await sleep(800);await p.evaluate(()=>{P.atkAnim=0;P.dead=1});R.moves.faint=await look(300);await p.evaluate(()=>{P.dead=0;S.hp=hpMax()});R.moves.back=await look(200);
  await p.evaluate(()=>{DIG={d:{},t:0,c:.5,g:.2,done:false}});R.moves.dig=await look(300);await p.evaluate(()=>{DIG=null;PAUSE=false});
  await p.evaluate(()=>{TK221.idle0=performance.now()-8000});R.moves.idle=await look(200);
  assert.deepEqual(R.moves,{emote:'기뻐하기',blink:'피하기',sit:'앉기',attack:'공격',hurt:'피격',faint:'기절',back:'서있기',dig:'땅파기0',idle:'자동행동'},JSON.stringify(R.moves));
  R.label=await p.evaluate(()=>{TK221.labelLift=null;return new Promise(r=>setTimeout(()=>r(TK221.labelLift),300))});
  assert.equal(R.label,await p.evaluate(()=>TK221.cur.h+6),'the name sits just above the head');
  // online: my record carries the character and the move; another device's player with the same character is drawn from the zip
  R.net=await p.evaluate(()=>{let got=null;const keep=[Net.online,Net.me],fb=window.firebase;if(!fb||!fb.database||!fb.database.ServerValue)window.firebase={database:{ServerValue:{TIMESTAMP:0}}};Net.online=true;Net.me={set(v){got=v}};try{TK221.play('화내기');Net.send(true)}finally{[Net.online,Net.me]=keep;if(window.firebase!==fb)window.firebase=fb}return got&&got.tk});
  assert.equal(R.net.c,'chrt01');assert.equal(R.net.a,await p.evaluate(()=>TK221.ACT.findIndex(a=>a[0]==='화내기')));assert(R.net.n>0);
  R.other=await p.evaluate(async()=>{const mk=(c,uid)=>({p:{n:'Bot',lv:5,h:0,k:0,r:2,w:0,m:mapKey(),x:P.x+60,y:P.y,tk:{c,p:'',a:3,n:1}},x:P.x+60,y:P.y,tx:P.x+60,ty:P.y,dist:0});const a=mk('chrt01'),b=mk('nobody');Net.others={a,b};
    await new Promise(r=>setTimeout(r,500));const res={known:a.tkDrawn||0,unknown:b.tkDrawn||0};Net.others={};return res});assert.deepEqual(R.other,{known:1,unknown:0},'same zip → Trickster look, unknown → the normal look');
  await p.screenshot({path:path.join(out,name+'-world.png')});
  // reload: kept on this device (or, when refused, the own character comes back)
  await p.reload({waitUntil:'load'});await enter(p);await p.waitForFunction(()=>window.TK221&&TK221.booted,{timeout:15000});await sleep(800);
  if(mode==='nostore'){R.afterReload=await p.evaluate(()=>!!PS.tk221);assert.equal(R.afterReload,false);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);await p.evaluate(()=>{delete S.tk221;save()})}
  else{await p.waitForFunction(()=>PS.tk221,{timeout:15000});R.reload=true;await press(p,'#gmBtn',touch);await press(p,'#gmTk221',touch);
   if(name==='pc'){await press(p,'#tk221del',touch);await sleep(500);R.deleted=await p.evaluate(()=>({n:(TK221.ids||[]).length,on:!!PS.tk221,s:!!S.tk221}));assert.deepEqual(R.deleted,{n:0,on:false,s:false});await press(p,'#tk221x',touch)}
   else{await press(p,'#tk221back',touch);await sleep(300);R.restored=await p.evaluate(()=>!PS.tk221&&!S.tk221);assert(R.restored)}
   assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original,'the very same pictures as before')}
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
