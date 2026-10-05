// test_115_farmart.js — ภาพพืชผัก 4 ระยะโต + เครื่องแปลงพลังงานเป็นภาพ ในเกมรุ่น 1.15 · เปิดเซิร์ฟเวอร์ที่โฟลเดอร์เกมก่อน (PORT=... CHROME_EXE=...)
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await new Promise(r=>setTimeout(r,6000));
const R=await pg.evaluate(async()=>{const o={version:VERSION,art:!!IMG.farmArt,pictures:Object.keys(FARM_ART).length};const sleep=ms=>new Promise(r=>setTimeout(r,ms));gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker,#dlg').forEach(e=>e.classList.add('hide'));
 delete CACHE.farm;goMap('farm');await sleep(900);try{DLG=null}catch(e){}
 // growth steps: what is shown for each state of a plant
 const half=CROPS.cab.min*60000/2*(typeof farmMul==='function'?farmMul():1),now=Date.now();
 o.steps={justSown:cropStage({st:'seed',crop:'cab',w:false,t:now}),sownWateredLate:cropStage({st:'seed',crop:'cab',w:true,t:now-half*.7}),sproutEarly:cropStage({st:'sprout',crop:'cab',w:true,t:now-half*.2}),sproutLate:cropStage({st:'sprout',crop:'cab',w:true,t:now-half*.8}),sproutDry:cropStage({st:'sprout',crop:'cab',w:false,t:now-half*.8}),ripe:cropStage({st:'ripe',crop:'cab'}),empty:cropStage({st:'empty'})};
 o.hasPicture={cab:!!FARM_ART.cab_s4,car:!!FARM_ART.car_s4,tom:!!FARM_ART.tom_s4,pum:!!FARM_ART.pum_s4,str:!!CROP_ART.str,cornReady:!!FARM_ART.corn_s4};
 // a full bed: every crop at every step, drawn for real for two seconds
 const h=HOME.get();h.plots=h.plots||{};const crops=['cab','car','tom','pum','str'];M.plots.forEach((pl,i)=>{const c=crops[i%5],k=i%4;h.plots[pl.i]=k===0?{st:'seed',crop:c,w:true,t:now-half*.9}:k===1?{st:'sprout',crop:c,w:true,t:now}:k===2?{st:'sprout',crop:c,w:true,t:now-CROPS[c].min*60000/2*.45}:{st:'ripe',crop:c,w:false,t:now}});HOME.put(h);
 P.x=G9.plots[5][0]*T;P.y=G9.plots[5][1]*T+70;await sleep(2200);o.drawn=M.plots.map(pl=>{const q=plotState(pl);return q.crop+cropStage(q)}).join(' ');
 // converter
 const c=M._convO;o.converter=c?{picture:[c.sw,c.sh],at:[Math.round(c.x/T*10)/10,Math.round(c.y/T*10)/10],solidTile:M.SOLID.has(key(G9.conv[0],G9.conv[1])),list:convList()}:null;
 if(c){S.conv=S.conv||{};S.conv['farm:0']=0;await sleep(300);o.converter.readyPic=c.sx===FARM_ART.conv_on[0]&&c.sy===FARM_ART.conv_on[1];S.conv['farm:0']=Date.now()+60000;await sleep(300);o.converter.restingPic=c.sx===FARM_ART.conv_off[0]&&c.sy===FARM_ART.conv_off[1];S.conv['farm:0']=0;}   // refilling the lantern at the converter is checked by test_106_g9.js (convRefill)
 return o});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));document.querySelectorAll('#hud,#act,#dlg').forEach(e=>e.classList.add('hide'));P.x=G9.plots[5][0]*T+10;P.y=G9.plots[5][1]*T+76;await sleep(3200)});await pg.screenshot({path:'f_bed.png'});
await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const c=M._convO;if(c){P.x=c.x-60;P.y=c.y+10}await sleep(3200)});await pg.screenshot({path:'f_conv.png'});
console.log(JSON.stringify(R));console.log('errors',errs.length,errs.slice(0,4));await b.close()})();
