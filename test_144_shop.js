// test_144_shop.js — รุ่น 1.44: ร้านของแต่งบ้าน · ซื้อชุดสวยด้วยเหรียญ · เงินไม่พอซื้อไม่ได้ · ซื้อแล้วเข้าคลังและวางได้ · PORT=... CHROME_EXE=...
const p=(()=>{try{return require('puppeteer')}catch(e){return require('/home/claude/.npm-global/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer')}})();
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:812,height:375,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6500));
const R=await pg.evaluate(async()=>{const o={version:VERSION};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));fpsChecks=6;goMap('room');await sleep(1200);try{closeModal()}catch(e){}DLG=null;PAUSE=false;
 openDeco();await sleep(150);const sb=document.querySelector('#deco2 button[data-a="shop"]');o.shopButtonInBar=!!sb;sb.click();await sleep(300);
 const md=document.querySelector('#modal:not(.hide)');o.barHiddenWhileShopOpen=getComputedStyle(document.getElementById('deco2')).display==='none';o.shop={opened:!!md,items:document.querySelectorAll('[data-buy]').length,pictures:[...document.querySelectorAll('canvas[data-ic]')].filter(c=>{const g=c.getContext('2d').getImageData(0,0,72,72).data;let n=0;for(let i=3;i<g.length;i+=4)if(g[i]>0)n++;return n>200}).length,prices:Object.values(F2PRICE).sort((a,b)=>a-b)};
 // not enough coins: nothing is bought
 S.coins=100;document.querySelector('[data-buy="sofa_f"]').click();await sleep(200);o.poor={coins:S.coins,inStore:(HOME.get().furn2||{}).sofa_f||0};
 // enough coins: the price comes off, the sofa is in the store
 S.coins=500;openFurnShop();await sleep(150);document.querySelector('[data-buy="sofa_f"]').click();await sleep(300);o.bought={coins:S.coins,inStore:(HOME.get().furn2||{}).sofa_f||0,shopShowsOne:/: 1/.test(document.querySelector('[data-buy="sofa_f"]').parentElement.textContent)};
 closeModal();await sleep(150);PAUSE=false;o.storeButtonInBar=!!document.querySelector('#deco2 button[data-k="sofa_f"]');o.barBackAfterClosing=getComputedStyle(document.getElementById('deco2')).display!=='none';
 // swap: put the plain sofa away, put the fine one where it stood
 const i=M.layout2.findIndex(a=>a[0]==='sofa'),old=M.layout2[i].slice();DECO2.sel=i;deco2Store();await sleep(80);document.querySelector('#deco2 button[data-k="sofa_f"]').click();await sleep(80);const v=ROOM2.pieces.sofa_f[0];deco2Tap((old[2]+v[6]/2)*T,(old[3]+ROOM2.rowsAbovePlan+v[7]/2)*T);await sleep(120);
 const nw=M.layout2.find(a=>a[0]==='sofa_f');o.placed={fineSofaAt:nw&&nw.slice(2),plainSofaStood:old.slice(2),plainInStore:(HOME.get().furn2||{}).sofa||0,fineLeftInStore:(HOME.get().furn2||{}).sofa_f||0};
 openDeco();return o});
await pg.evaluate(async()=>{openDeco();await new Promise(r=>setTimeout(r,100));openFurnShop();await new Promise(r=>setTimeout(r,500))});await pg.screenshot({path:'sp_1.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
