// Claude 2.28 (overnight 12 Oct): every round button of the create screen's left rail is whole on the screen and ≥ 44 px, and a real tap on the last one opens it
// screens 812×330 · 740×360 · 667×375 · 844×390 · 1180×820 · a child (paperdoll screen: age hair face body house), a grown-up (1.94 screen: age hair face house hat), GM
// before 2.28 the fifth button ended 12–17 px below a 812×330 screen · no page errors
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://localhost:'+(process.env.PORT||8775)+'/';
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']}),R=[];let pg;
 try{for(const [w,h] of [[812,330],[740,360],[667,375],[844,390],[1180,820]])for(const who of ['kid','adult','gm']){const c=await b.createBrowserContext();pg=await c.newPage();const errors=[];pg.on('pageerror',e=>errors.push(e.message));
   await pg.setViewport({width:w,height:h,deviceScaleFactor:2,isMobile:true,hasTouch:true});await pg.setBypassServiceWorker(true);
   await pg.goto(base+'?rank=1'+(who==='gm'?'&gm':''),{waitUntil:'load'});await pg.waitForFunction(()=>!document.getElementById('load'),{timeout:90000});await sleep(900);
   const tap=async s=>{const e=await pg.$(s);const r=await e.boundingBox();await pg.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await sleep(350)};
   await tap('#cg194 [data-g="f"]');await pg.waitForFunction(()=>PD219.tried,{timeout:30000});await sleep(400);if(who==='adult'){await tap('#ca button[data-a="30"]');await sleep(400)}
   const rail=await pg.evaluate(()=>[...document.querySelectorAll('#cr .rail [data-tab]')].filter(b=>getComputedStyle(b).display!=='none').map(b=>{const q=b.getBoundingClientRect();return {t:b.dataset.tab,w:Math.round(q.width),h:Math.round(q.height),top:Math.round(q.top),bottom:Math.round(q.bottom)}}));
   const last=rail[rail.length-1];await tap(`#cr .rail [data-tab="${last.t}"]`);const opened=await pg.evaluate(t=>C193.tab===t,last.t);
   const r={screen:w+'x'+h,who,tabs:rail.map(x=>x.t).join(),lastBottom:last.bottom,minSide:Math.min(...rail.map(x=>Math.min(x.w,x.h))),opened};R.push(r);
   assert(rail.every(x=>x.top>=0&&x.bottom<=h)&&r.minSide>=44&&opened,'rail '+JSON.stringify(r));assert.deepEqual(errors,[]);await c.close()}
  console.log(JSON.stringify(R));console.log('errors 0')
 }catch(e){console.error(e);console.log(JSON.stringify(R));console.log('errors 1');process.exitCode=1}finally{await b.close()}})();
