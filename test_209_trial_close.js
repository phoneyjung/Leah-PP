// Claude 2.09: a GM trial window that shows another model and is closed without "use" leaves the model in use as it was — the name and emote stay just over the head (night check 10 Oct).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-trial-209';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;delete S.gmAdultSkin;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
// where the name and an emote are drawn, measured from the feet (what the player sees)
// where the name is drawn over the feet: the label hook sees it before the 2.01 lift wrapper, which adds the lift only while the shown model is the one in use (its own rule)
const marks=p=>p.evaluate(async()=>{const ol=label;let raw=null;label=function(x,y,s,c){if(s&&String(s).includes(S.name))raw=Math.round(P.y-camY-y);return ol.apply(this,arguments)};
  await new Promise(r=>setTimeout(r,300));label=ol;const applies=PS.F===ad201F()&&ad201Selected();return {raw,lift:applies?ad201Lift():0,shown:raw-(applies?ad201Lift():0),v:AD201.v,F:PS.F}});
(async()=>{let name=null,emo=null;const oc=ctx.fillText;ctx.fillText=function(s,x,y){if(String(s).includes(S.name)&&name==null)name=Math.round((P.y-camY)*SC-y);return oc.apply(this,arguments)};
  const ol=label;let raw=null;label=function(x,y,s,c){if(s&&String(s).includes(S.name))raw=Math.round(P.y-camY-y);return ol.apply(this,arguments)};
  await new Promise(r=>setTimeout(r,300));ctx.fillText=oc;label=ol;return {raw,lift:ad201Lift(),v:AD201.v,F:PS.F}});
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr] of [['phone',915,412,2.625],['ipad',1180,820,2]]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  await p.goto(url,{waitUntil:'load'});await enter(p);const R={name};
  // 72 ก with its walk in use: the name sits 74 px over the feet (the 112 cell, lifted)
  await press(p,'#gmBtn');await press(p,'#gmAdult201');await press(p,'#ad201 .ad202v [data-v="m72a"]');await p.waitForFunction(()=>AD201.v==='m72a'&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad201use').disabled,{timeout:20000});await press(p,'#ad201use');await sleep(300);
  R.before=await marks(p);const shown=R.before.shown;assert(shown>=70&&shown<=78,'name over the head at the start: '+JSON.stringify(R.before));
  // the new-characters window: look at woman 2, close with ✕
  await press(p,'#gmBtn');await press(p,'#gmStageC207');await press(p,'#ad207 .ad207g [data-v="cf2"]');await p.waitForFunction(()=>AD201.v==='cf2'&&AD201.sheets,{timeout:15000});await press(p,'#ad207x');await sleep(300);
  R.afterC=await marks(p);assert.equal(R.afterC.v,'m72a','the model in use is the shown one again');assert.equal(R.afterC.shown,shown,'the name stays over the head: '+JSON.stringify(R.afterC));
  // the adult window: look at 72 ข, close with the panel's close
  await press(p,'#gmBtn');await press(p,'#gmAdult201');await press(p,'#ad201 .ad202v [data-v="m72b"]');await p.waitForFunction(()=>AD201.v==='m72b'&&AD201.sheets,{timeout:15000});await press(p,'#ad201x');await sleep(300);
  R.afterA=await marks(p);assert.equal(R.afterA.v,'m72a');assert.equal(R.afterA.shown,shown,'still over the head: '+JSON.stringify(R.afterA));
  // and over another window that replaces it (the GM menu opened on top)
  await press(p,'#gmBtn');await press(p,'#gmStageC207');await press(p,'#ad207 .ad207g [data-v="cb1"]');await p.waitForFunction(()=>AD201.v==='cb1'&&AD201.sheets,{timeout:15000});
  await p.evaluate(()=>openGM());await sleep(200);await p.evaluate(()=>closeModal());await sleep(300);R.afterGM=await marks(p);assert.equal(R.afterGM.v,'m72a');assert.equal(R.afterGM.shown,shown);
  await p.evaluate(()=>{P.x=1318;P.y=1250;P.row=0;P.path=null});await sleep(500);await p.screenshot({path:path.join(out,name+'-village.png')});
  assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
