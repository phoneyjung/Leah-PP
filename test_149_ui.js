// 1.49: real mouse/touch controls, short screens, a full inventory, muted sound and missing artwork.
// PORT=8775 CHROME_EXE=... node test_149_ui.js (screenshots and a sound sample go to OUT_DIR or /tmp).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer');
const output=process.env.OUT_DIR||'/tmp/leah-ui-149';fs.mkdirSync(output,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const results={},errors=[];
async function boot(browser,viewport,missing=false){
 const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport(viewport);
 page.on('pageerror',e=>errors.push(e.message));
 if(missing){await page.setRequestInterception(true);page.on('request',r=>r.url().endsWith('/ui-icons.png')?r.abort():r.continue())}
 await page.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});
 await page.waitForFunction(()=>!document.getElementById('load'),{timeout:30000});await sleep(500);
 await page.waitForFunction(()=>typeof ROOM2!=='undefined'&&ROOM2&&typeof gmMakeSlot==='function',{timeout:30000});
 await page.evaluate(async()=>{gmMakeSlot();const d=Store.all();S=d.slots[d.cur];S.name='ต้นกล้า';S.coins=24;S.gems=0;S.potions=1;S.lv=2;S.exp=17;S.snd=true;S.mus=false;
  S.seen=S.seen||{};S.seen.intro=true;S.hp=hpMax();save();startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;GM.hour=10;goMap('farm');
  await new Promise(r=>setTimeout(r,1600));closeModal();for(let i=0;i<20&&DLG;i++)nextLine();DLG=null;PAUSE=false;HOLD=null;
  P.x=G9.door[0]*T-80;P.y=G9.houseBase*T+75;P.path=null});
 await sleep(1000);return {context,page};
}
async function press(page,selector,touch){const element=await page.$(selector);assert(element,'button exists: '+selector);
 await element.scrollIntoView();
 const r=await element.boundingBox();assert(r,'button visible: '+selector);
 if(touch)await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await sleep(100)}
async function inspect(page){return page.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height}};
 const buttons=[...document.querySelectorAll('#act button,#btns button')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
 const map=rect(document.getElementById('mmw')),hud=rect(document.getElementById('hud'));
 return {version:VERSION,thumbs:document.body.classList.contains('thumbs'),buttons,map,hud,
  portraitPixels:[...document.getElementById('hudPortrait').getContext('2d').getImageData(0,0,64,64).data].filter((v,i)=>i%4===3&&v>0).length};
 })}
async function soundSamples(page){return page.evaluate(async()=>{
 const live=AC,enabled=SND;const report=[],samples=[];SND=true;
 try{for(const name of ['uiTap','uiOpen','uiClose','pick','coin','wrong','wake']){
  const offline=new OfflineAudioContext(1,44100,44100);AC=offline;sfx(name);const buffer=await offline.startRendering(),a=buffer.getChannelData(0);
  let peak=0,energy=0;for(const v of a){peak=Math.max(peak,Math.abs(v));energy+=v*v}report.push({name,peak,rms:Math.sqrt(energy/a.length)});samples.push(Array.from(a))}
  SND=false;const offline=new OfflineAudioContext(1,4410,44100);AC=offline;sfx('uiTap');const silent=await offline.startRendering();
  return {report,samples,mutedPeak:Math.max(...silent.getChannelData(0).map(Math.abs))};
 }finally{AC=live;SND=enabled}
 })}
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
 try{for(const [name,width,height,touch,dpr] of [['pc',1366,768,false,1],['phone',812,330,true,2.6],['small',667,375,true,2]]){
  const {context,page}=await boot(browser,{width,height,isMobile:touch,hasTouch:touch,deviceScaleFactor:dpr});
  const layout=await inspect(page);assert(layout.portraitPixels>50,'player artwork visible');assert(layout.thumbs,'phone layout on every device (owner, 9 Oct 2026, version 1.84)');
  for(const b of layout.buttons){assert(b.w>=44&&b.h>=44,b.id+' touch area');assert(b.x>=0&&b.y>=0&&b.x+b.w<=width+.1&&b.y+b.h<=height+.1,b.id+' fits viewport')}
  assert(layout.hud.x+layout.hud.w<width-318,'HUD leaves room for top buttons');
  for(const b of layout.buttons.filter(b=>b.id.startsWith('b')&&!['bBag','bMap','bEmo','bStat','bBook','bSet'].includes(b.id)))
   assert(!(b.x<layout.map.x+layout.map.w&&b.x+b.w>layout.map.x&&b.y<layout.map.y+layout.map.h&&b.y+b.h>layout.map.y),b.id+' clear of minimap');
  await page.screenshot({path:path.join(output,name+'-farm.png')});
  await page.evaluate(()=>{window.ui149TestSounds=[];const old=sfx;sfx=function(name){ui149TestSounds.push(name);return old.apply(this,arguments)}});
  let count=await page.evaluate(()=>UI149.sounds);await press(page,'#bSet',touch);
  assert(await page.evaluate(()=>!document.getElementById('modal').classList.contains('hide')),'settings opens through real button');
  assert.deepEqual(await page.evaluate(()=>ui149TestSounds.filter(n=>n==='uiOpen'||n==='uiTap')),['uiOpen'],'one sound per menu opening');
  await page.screenshot({path:path.join(output,name+'-settings.png')});
  await press(page,'#sOn',touch);assert.equal(await page.evaluate(()=>SND),false);count=await page.evaluate(()=>UI149.sounds);
  await press(page,'#jOn',touch);assert.equal(await page.evaluate(()=>UI149.sounds),count,'muted buttons are silent');
  await press(page,'#sOn',touch);assert.equal(await page.evaluate(()=>SND),true);await press(page,'#mX',touch);
  await page.evaluate(async()=>{goMap('room');await new Promise(r=>setTimeout(r,700));for(let i=0;i<20&&DLG;i++)nextLine();closeModal();PAUSE=false;HOLD=null;P.x=13*T;P.y=10.5*T;P.path=null});await sleep(300);
  await press(page,'#bDeco',touch);assert(await page.evaluate(()=>DECO2.on),'real decorating button');
  // A save with one of every movable furniture type: overflow must scroll while commands stay reachable.
  await page.evaluate(()=>{const h=HOME.get();h.furn2={};for(const k of Object.keys(ROOM2.pieces))if(!['slideL','stairs'].includes(k))h.furn2[k]=1;HOME.put(h);deco2UI()});
  const inv=await page.evaluate(()=>{const d=document.getElementById('deco2'),inventory=d.querySelector('.d2inventory'),r=d.getBoundingClientRect();
   return {count:inventory.children.length,pictures:inventory.querySelectorAll('canvas').length,y:r.y,height:r.height,scrollHeight:inventory.scrollHeight,clientHeight:inventory.clientHeight,
    commands:[...d.querySelectorAll('[data-a]')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})}});
  assert.equal(inv.pictures,inv.count);assert(inv.y>=0&&inv.y+inv.height<=height,'inventory stays on screen');
  assert(inv.scrollHeight>inv.clientHeight,'full inventory scrolls');
  for(const r of inv.commands)assert(r.h>=48&&r.y>=0&&r.y+r.h<=height,'commands reachable');
  await page.screenshot({path:path.join(output,name+'-inventory.png')});
  const scroll=await page.$eval('.d2inventory',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
  const zoom=await page.evaluate(()=>ZOOM);
  if(touch){await page.touchscreen.touchStart(scroll.x,scroll.y);for(let i=1;i<=5;i++){await page.touchscreen.touchMove(scroll.x,scroll.y-i*8);await sleep(35)}await page.touchscreen.touchEnd();await sleep(200)}
  else{await page.mouse.move(scroll.x,scroll.y);await page.mouse.wheel({deltaY:160});await sleep(200)}
  assert(await page.$eval('.d2inventory',e=>e.scrollTop>0),'inventory scrolls with wheel/finger');assert.equal(await page.evaluate(()=>ZOOM),zoom,'scrolling inventory does not zoom game');
  await page.evaluate(()=>document.querySelector('.d2inventory').scrollTop=10000);const last='#deco2 [data-k="stove_f"]';await press(page,last,touch);
  assert.equal(await page.evaluate(()=>DECO2.hold),'stove_f','last inventory item selectable');
  await press(page,'[data-a="shop"]',touch);assert.equal(await page.$$eval('[data-buy]',e=>e.length),9);await page.screenshot({path:path.join(output,name+'-shop.png')});
  await press(page,'#mX',touch);await press(page,'[data-a="done"]',touch);assert.equal(await page.evaluate(()=>DECO2.on),false);
  results[name]={layout,inventory:inv,settingsOpened:true,muteWorks:true,lastInventoryItemSelected:true,shopItems:9};
  if(name==='pc'){const audio=await soundSamples(page);for(const r of audio.report)assert(r.peak>.0001&&r.peak<.25,'audible, unclipped '+r.name);assert.equal(audio.mutedPeak,0);results.audio={report:audio.report,mutedPeak:audio.mutedPeak};
   const a=audio.samples.flat(),wav=Buffer.alloc(44+a.length*2);wav.write('RIFF');wav.writeUInt32LE(36+a.length*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(a.length*2,40);a.forEach((v,i)=>wav.writeInt16LE(Math.round(v*32767),44+i*2));fs.writeFileSync(path.join(output,'sounds.wav'),wav)}
  await context.close();
 }
 const {context,page}=await boot(browser,{width:812,height:375,isMobile:true,hasTouch:true,deviceScaleFactor:2},true);
 await press(page,'#bSet',true);assert(await page.evaluate(()=>!document.getElementById('modal').classList.contains('hide')));results.missingIcons={settingsOpened:true,themePresent:await page.$eval('#ui149',e=>!!e.textContent)};await context.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify(results));console.log('errors',errors.length,errors);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
