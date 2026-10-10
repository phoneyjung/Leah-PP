// Claude 2.08 (+2.15: set 03 A2 adds the west walk's places, so the west row is toned for real): skin tones on 72 ก from Codex set 03 A1 (gm-adult-204a.palette.json) in the GM trial — real taps, only Codex's skin/mouth places change, hair · eyes · coat keep working on top, the choice kept, missing file.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),out=process.env.OUT_DIR||'/tmp/leah-skin-208';fs.mkdirSync(out,{recursive:true});
const url='http://localhost:'+(process.env.PORT||8775)+'/?gm';
async function press(p,s){await p.waitForSelector(s,{visible:true});await (await p.$(s)).scrollIntoView();await p.tap(s);await sleep(150)}
async function enter(p){await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{if(!Store.all().slots.length)gmMakeSlot();S=Store.all().slots[Store.all().cur];S.gmInit=1;S.snd=S.mus=false;S.joy=true;S.seen={intro:1};ensureDaily();S.daily.seen=1;delete S.gmSprite170;delete S.gmAdult202;delete S.gmAdultCol;delete S.gmAdultSkin;startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;$('dlg').classList.add('hide');closeModal();goMap('h9');P.path=P.act=null});await sleep(2500)}
async function open(p){await press(p,'#gmBtn');await press(p,'#gmAdult201');await p.waitForSelector('#ad201 .ad205c',{visible:true})}
async function pick72(p){await press(p,'#ad201 .ad202v [data-v="m72a"]');await p.waitForFunction(()=>AD201.v==='m72a'&&AD201.sheets&&AD201.sheets.walkReal&&!$('ad201use').disabled,{timeout:20000});await sleep(200)}
// the source files in a tone against the files: what changed, where, and how light
const source=p=>p.evaluate(()=>{const d=AD208.data,sh=AD201.sheets,res={};
  for(const [file,src,C] of [['gm-adult-204a.png',sh.im,72],['gm-adult-206w.png',sh.wim,112],['gm-adult-207w.png',sh.west,112]]){if(!src||!d.regions[file])continue;const set=new Set(),skin=new Set(d.skin.map(c=>parseInt(c.slice(1),16)));for(const kind of ['skin','mouth'])for(const [y,x,n] of d.regions[file][kind])for(let k=0;k<n;k++)set.add(y*100000+x+k);
    const a=toCanvas(src),A=a.getContext('2d').getImageData(0,0,a.width,a.height).data,W=a.width;res[file]={};
    for(const tn of ['light','medium','tan','deep']){const b=ad208Paint(src,file,tn),B=b.getContext('2d').getImageData(0,0,W,a.height).data;let changed=0,outside=0,alpha=0,expect=0,lumA=0,lumB=0;const perCell={};
      for(let i=0;i<A.length;i+=4){const j=i/4,x=j%W,y=(j-x)/W,inside=set.has(y*100000+x);if(A[i+3]!==B[i+3])alpha++;const same=A[i]===B[i]&&A[i+1]===B[i+1]&&A[i+2]===B[i+2];
        if(inside&&A[i+3]&&skin.has((A[i]<<16)|(A[i+1]<<8)|A[i+2]))expect++;if(!same){changed++;if(!inside)outside++;lumA+=.3*A[i]+.59*A[i+1]+.11*A[i+2];lumB+=.3*B[i]+.59*B[i+1]+.11*B[i+2];const key=Math.floor(y/C)+','+Math.floor(x/C);perCell[key]=(perCell[key]||0)+1}}
      res[file][tn]={changed,outside,alpha,expect,lumFrom:changed?Math.round(lumA/changed):0,lumTo:changed?Math.round(lumB/changed):0,perCell}}}
  return res});
const diffRows=(p,tn)=>p.evaluate(tn=>{const base=AD201.sheets,b=AD208.built.get(base)[tn],F=112,px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  const cnt=(x,y,cells)=>{const A=px(x),B=px(y),W=x.width;return cells.map(list=>{let n=0;for(const [x0,y0] of list)for(let yy=0;yy<F;yy++)for(let xx=0;xx<F;xx++){const i=((y0+yy)*W+x0+xx)*4;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]||A[i+3]!==B[i+3])n++}return n})};
  const rows=[0,1,2,3,4,5,6,7];
  return {stand:cnt(base.stand,b.stand,rows.map(r=>[[r*F,0]])),walk:cnt(base.walk,b.walk,rows.map(r=>[0,1,2,3,4,5].map(f=>[f*F,r*F]))),off6:{mir:b.off[6].mir,real:!!b.off[6].real},baseOff6:{mir:base.off[6].mir,real:!!base.off[6].real},wr:b.off.map(o=>o.wr)}},tn);
(async()=>{const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),results=[];let p;
 try{for(const [name,width,height,dpr,fail] of [['phone',915,412,2.625,''],['phone844',844,390,3,''],['ipad',1180,820,2,''],['missing',915,412,2.625,'missing']]){
  const bc=await browser.createBrowserContext();p=await bc.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
  if(fail){await p.setBypassServiceWorker(true);await p.setRequestInterception(true);p.on('request',r=>r.url().includes('gm-adult-204a.palette.json')?r.abort():r.continue())}
  await p.goto(url,{waitUntil:'load'});await enter(p);const original=await p.evaluate(()=>PS.stand.toDataURL());await open(p);const R={name};await pick72(p);
  if(fail){await p.waitForFunction(()=>AD208.tried&&!AD208.pending,{timeout:15000});await sleep(200);R.buttons=await p.$$eval('#ad201 .ad205c button',bs=>bs.map(b=>b.dataset.k+(b.disabled?':off':':on')));
   assert.deepEqual(R.buttons,['h:on','e:on','b:on','s:off'],'no palette file: skin off, the rest work');await press(p,'#ad201use');assert.equal(await p.evaluate(()=>PS.F),112);
   await open(p);await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);assert.deepEqual(errors,[]);R.errors=0;results.push(R);await bc.close();continue}
  await p.waitForFunction(()=>AD208.data&&!$('ad201').querySelector('.ad205c [data-k="s"]').disabled,{timeout:15000});
  await p.evaluate(()=>{const b=document.getElementById('mBody');if(b)b.scrollTop=0});
  R.buttons=await p.$$eval('#ad201 .ad202v button,#ad201 .ad203z button,#ad201 .ad205c button,#ad201use,#ad201back,#ad201x',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.v||b.dataset.z||b.dataset.k||b.id,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,h:Math.round(r.height)}}));
  assert(R.buttons.some(b=>b.id==='s')&&R.buttons.every(b=>b.inside&&b.h>=44),'all buttons (with skin) inside and 44 px+: '+JSON.stringify(R.buttons));
  // the files in each tone: medium = the file; light/tan/deep change exactly the skin-coloured pixels in Codex's places, nothing outside, no alpha; light is lighter, deep darker
  R.src=await source(p);assert(R.src['gm-adult-207w.png'],'2.15: the west walk has Codex places (set 03 A2)');for(const f of ['gm-adult-204a.png','gm-adult-206w.png','gm-adult-207w.png']){const s=R.src[f];assert.equal(s.medium.changed,0,f+' medium = as drawn');
   for(const tn of ['light','tan','deep']){assert.equal(s[tn].outside,0,f+' '+tn+' outside the places');assert.equal(s[tn].alpha,0);assert.equal(s[tn].changed,s[tn].expect,f+' '+tn+' every skin pixel in the places: '+s[tn].changed+'/'+s[tn].expect)}
   assert(s.light.lumTo>s.light.lumFrom&&s.deep.lumTo<s.deep.lumFrom-40,f+' light lighter, deep darker: '+JSON.stringify([s.light.lumFrom,s.light.lumTo,s.deep.lumTo]))}
  R.front=R.src['gm-adult-204a.png'].light.perCell['0,0'];assert(R.front>=120,'front face pixels '+R.front);
  // light in the world: the sheet in use is the toned one; per row the same pixels as in the file's view; 2.15: the west row is the real west walk, toned in its own places
  await press(p,'#ad201 .ad205c [data-k="s"]');R.s1=await p.evaluate(()=>S.gmAdultSkin);assert.equal(R.s1,'light');await press(p,'#ad201use');
  R.rows=await diffRows(p,'light');const sc=R.src['gm-adult-204a.png'].light.perCell,wc=R.src['gm-adult-206w.png'].light.perCell;
  const ec=R.src['gm-adult-207w.png'].light.perCell;
  for(let r=0;r<8;r++){const wr=R.rows.wr[r];if(r===6){assert.equal(R.rows.stand[6],sc['0,6']||0,'stand row 6 (the file\'s own west view)');let w=0;for(let f=0;f<6;f++)w+=ec['0,'+f]||0;assert.equal(R.rows.walk[6],w,'walk row 6 (the real west walk)');continue}
    assert.equal(R.rows.stand[r],sc['0,'+wr]||0,'stand row '+r);let w=0;for(let f=0;f<6;f++)w+=wc[wr+','+f]||0;assert.equal(R.rows.walk[r],w,'walk row '+r)}
  assert.deepEqual(R.rows.off6,{mir:false,real:true});assert.deepEqual(R.rows.baseOff6,{mir:false,real:true});
  R.inUse=await p.evaluate(()=>PS.stand===AD208.built.get(AD201.sheets).light.stand||PS.stand.toDataURL()===AD208.built.get(AD201.sheets).light.stand.toDataURL());assert(R.inUse,'the toned sheet is in use');
  // deep + hair colour: hair changes on top, the skin stays the deep tone
  await open(p);await press(p,'#ad201 .ad205c [data-k="s"]');await press(p,'#ad201 .ad205c [data-k="s"]');await press(p,'#ad201 .ad205c [data-k="h"]');R.col=await p.evaluate(()=>({s:S.gmAdultSkin,c:S.gmAdultCol}));assert.deepEqual(R.col,{s:'deep',c:{h:0,e:-1,b:-1}});
  await p.screenshot({path:path.join(out,name+'-window.png')});await press(p,'#ad201x');
  R.layer=await p.evaluate(()=>{const t=AD208.built.get(AD201.sheets).deep.stand,A=t.getContext('2d').getImageData(0,0,t.width,t.height).data,B=PS.stand.getContext('2d').getImageData(0,0,t.width,t.height).data,Rl=AD205.rules.m72a;let hair=0,other=0;
    for(let i=0;i<A.length;i+=4){if(A[i+3]<60)continue;const same=A[i]===B[i]&&A[i+1]===B[i+1]&&A[i+2]===B[i+2];if(same)continue;if(ad205Class(A[i],A[i+1],A[i+2],Rl)===1)hair++;else other++}return {hair,other}});
  assert(R.layer.hair>2000&&R.layer.other===0,'hair on top of the deep skin, nothing else: '+JSON.stringify(R.layer));
  await p.evaluate(()=>{P.x=1318;P.y=1250;P.row=0;P.path=null});await sleep(600);await p.screenshot({path:path.join(out,name+'-village.png')});
  // kept after a reload
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!$('load')&&ROOM2,{timeout:45000});await p.evaluate(()=>{S=Store.all().slots[Store.all().cur];startGame();document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));DLG=null;closeModal();goMap('h9')});
  await p.waitForFunction(()=>PS.gmSprite170&&PS.F===112&&AD208.data&&AD208.built.get(AD201.sheets)&&AD208.built.get(AD201.sheets).deep,{timeout:20000});R.kept=await p.evaluate(()=>S.gmAdultSkin);assert.equal(R.kept,'deep');
  // back to as drawn (skin one more tap, hair round to "as drawn"): the file pixel for pixel, the real west row again
  await open(p);await press(p,'#ad201 .ad205c [data-k="s"]');const nh=await p.evaluate(()=>HAIRC.length);for(let i=0;i<nh;i++)await press(p,'#ad201 .ad205c [data-k="h"]');
  R.back=await p.evaluate(()=>({s:S.gmAdultSkin===undefined?-1:S.gmAdultSkin,h:S.gmAdultCol.h}));assert.deepEqual(R.back,{s:-1,h:-1});await press(p,'#ad201x');
  assert.equal(await p.evaluate(()=>PS.stand.toDataURL()===AD201.sheets.stand.toDataURL()&&PS.walk.toDataURL()===AD201.sheets.walk.toDataURL()),true,'as drawn again');
  await open(p);await press(p,'#ad201back');await sleep(300);assert.equal(await p.evaluate(()=>PS.stand.toDataURL()),original);
  assert.deepEqual(errors,[]);R.errors=0;delete R.src;results.push(R);await bc.close()}
  console.log(JSON.stringify(results));console.log('errors 0')
 }catch(e){console.error(e);if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log(JSON.stringify(results));console.log('errors 1');process.exitCode=1}finally{await browser.close()}})();
