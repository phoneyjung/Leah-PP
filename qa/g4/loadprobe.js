// Diagnostic for M1 test_227 branch run 1 (page-load wait 60 s timed out in round 7 of 8).
// N alternating ?gm loads per side in one browser (new context each, same as test_227 room()), time to `!$('load')&&ROOM2`,
// and any request still pending 8 s after goto. Prints one JSON line.
const puppeteer=require('puppeteer');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const N=+process.env.N||30,ports={main:+process.env.MAIN_PORT,branch:+process.env.PORT};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME_EXE,args:['--no-sandbox']});const R={main:[],branch:[],stalls:[],pe:{main:0,branch:0}};
 try{for(let i=0;i<N;i++)for(const side of (i%2?['branch','main']:['main','branch'])){const c=await b.createBrowserContext(),pg=await c.newPage();const pend=new Map();
   pg.on('pageerror',()=>R.pe[side]++);pg.on('request',r=>pend.set(r,r.url()));pg.on('requestfinished',r=>pend.delete(r));pg.on('requestfailed',r=>pend.delete(r));
   await pg.setViewport({width:667,height:375,deviceScaleFactor:2,isMobile:true,hasTouch:true});await pg.setBypassServiceWorker(true);
   const t0=Date.now();await pg.goto('http://localhost:'+ports[side]+'/?gm',{waitUntil:'load',timeout:90000}).catch(e=>R.stalls.push({side,i,goto:String(e.message).slice(0,80)}));
   const chk=setTimeout(()=>{if(pend.size)R.stalls.push({side,i,at8s:[...pend.values()].map(u=>u.replace(/^.*\//,'')).slice(0,6)})},8000);
   let ok=true;await pg.waitForFunction(()=>!document.getElementById('load')&&typeof ROOM2!=='undefined',{timeout:90000}).catch(()=>{ok=false});clearTimeout(chk);
   R[side].push(ok?Date.now()-t0:-1);await c.close()}}
 catch(e){R.crash=String(e).slice(0,200)}finally{await b.close()}
 const st=a=>{const v=a.filter(x=>x>=0).sort((x,y)=>x-y);return {n:a.length,hung:a.filter(x=>x<0).length,med:v[v.length>>1],max:v[v.length-1],over10s:v.filter(x=>x>10000).length}};
 console.log(JSON.stringify({main:st(R.main),branch:st(R.branch),stalls:R.stalls,pe:R.pe,crash:R.crash||null}))})();
