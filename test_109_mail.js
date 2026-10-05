// test_109_mail.js — ทดสอบระบบจดหมายบนฉาก H9 (และยืนยันว่าหมู่บ้านเดิมยังทำงานเหมือนเดิม) · เปิดเซิร์ฟเวอร์ก่อน: python3 -m http.server 8775
const p=require('puppeteer');
(async()=>{const b=await p.launch({executablePath:process.env.CHROME_EXE||undefined,args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8775)+'/?gm',{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,4500));
const R=await pg.evaluate(async()=>{const o={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));const quiet=()=>{try{closeModal()}catch(e){}PAUSE=false;DLG=null};
 // ---- the old village with a child's character: same letter game as before ----
 S=newSave({name:'ลีอา',kid:0,house:0,age:7});S.hp=hpMax();Store.save(S);startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 setInterval(()=>{DLG=null;document.querySelectorAll('#dlg').forEach(e=>e.classList.add('hide'))},50);o.version=VERSION;
 goMap('capital');await sleep(500);quiet();const at=async k=>{const [x,y]=mailDoorPt(k);P.path=null;P.x=x;P.y=y;quiet();for(let i=0;i<14;i++){await sleep(250);quiet()}};
 S.mail=null;const c0=S.coins;await at('post_office');o.old={got:S.mail.got,letters:S.mail.letters.map(l=>l.to)};const first=S.mail.letters[0].to;await at(first);o.old.delivered=S.mail.letters[0].done;o.old.coins=S.coins-c0;o.old.where=mailWhere('house_w2');
 const RD=Date;const fake=d=>{const base=new RD(2027,0,d,10,0,0).getTime();Date=class extends RD{constructor(...a){super(...(a.length?a:[base]))}static now(){return base}}};let mek=0,n=0;const days=new Set();for(let d=1;d<=60;d++){fake(d);days.add(today());const pk=mailPick();n+=pk.length;if(pk.includes('house_e2'))mek++}Date=RD;o.old.daysSimulated=days.size;o.old.mekIn60Days=mek;o.old.picks=n;o.old.mekStillInTable=!!MAIL_TO.house_e2;
 // ---- the new village with the GM ----
 gmMakeSlot();const d=Store.all();S=d.slots[d.cur];startGame();await sleep(1500);document.querySelectorAll('#cr,#title,#picker').forEach(e=>e.classList.add('hide'));
 goMap('h9');await sleep(900);quiet();
 o.doorPts=Object.keys(H9_MAIL).map(k=>{const [x,y]=mailDoorPt(k);return [k,!M.SOLID.has(key(Math.floor(x/T),Math.floor(y/T)))]});
 let mek2=0;for(let d2=1;d2<=60;d2++){fake(d2);if(mailPick().includes('house_e2'))mek2++}Date=RD;o.h9MekIn60Days=mek2;
 S.mail=null;const s0=S.stamps||0;S.stamps=0;const g0=S.coins;await at('post_office');o.h9={got:S.mail.got,letters:S.mail.letters.map(l=>l.to)};
 for(const l of S.mail.letters.slice())await at(l.to);o.h9.done=S.mail.letters.filter(l=>l.done).length;await at('post_office');o.h9.claimed=S.mail.claimed;o.h9.stamps=S.stamps;o.h9.coins=S.coins-g0;quiet();
 // every one of the 8 homes takes a letter
 S.mail={day:today(),got:true,claimed:false,letters:Object.keys(MAIL_TO).map(k=>({to:k,done:false}))};o.all8=S.mail.letters.length;for(const l of S.mail.letters.slice())await at(l.to);o.all8done=S.mail.letters.filter(l=>l.done).length;
 o.where={fon:mailWhere('house_w2'),dao:mailWhere('house_e1'),mek:mailWhere('house_e2'),daeng:mailWhere('house_w1')};
 S.mail={day:today(),got:true,claimed:false,letters:[{to:'house_e2',done:false},{to:'restaurant',done:false},{to:'clock_shop',done:false}]};const [mx,my]=mailDoorPt('restaurant');P.x=mx;P.y=my+150;quiet();return o});
await new Promise(r=>setTimeout(r,2500));await pg.evaluate(()=>{try{closeModal()}catch(e){}});await new Promise(r=>setTimeout(r,600));await pg.screenshot({path:'mail_h9.png'});
console.log(JSON.stringify(R,null,1));console.log('errors',errs.length,errs.slice(0,5));await b.close()})();
