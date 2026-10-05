// minigames.js — มินิเกมที่คริสตัลสำหรับผู้เล่นอายุ 18 ขึ้นไป (DESIGN_CRYSTAL_JOB.md ข้อ 5)
// เขียนโดย Claude เป็นไฟล์แยก ยังไม่ผูกกับ index.html · Codex เป็นคนนำเข้าเกมในขั้น 4 ของสเปก
// ไม่ใช้ไฟล์ภาพหรือไลบรารีใด ๆ · วาดด้วยโค้ดทั้งหมด · เล่นได้ทั้งนิ้วและเมาส์ · ลองเล่นได้ที่ minigames-demo.html
//
// วิธีเรียก:
//   const r = await CrystalGames.play({game:'random', level:S.lv, lang:LANG});
//   r = {game:'memory'|'odd'|'pipes', win:true|false, reason:'win'|'wrong'|'timeout'|'quit', ms, level}
//   ระหว่างเล่นโมดูลสร้างแผ่นทับเต็มจอของตัวเอง (id="cgOverlay") และลบออกเองเมื่อจบ · ไม่แตะตัวแปรของเกม
// ตัวเลขทุกตัวอยู่ในตาราง CrystalGames.CFG ที่เดียว (เป็นค่าเสนอ ปรับได้)
(function(){'use strict';
const CFG={
  timeScale:1,                     // ชุดทดสอบตั้งให้มากกว่า 1 เพื่อเร่งเวลา · เกมจริงใช้ 1
  endDelay:900,                    // ค้างผลไว้กี่ ms ก่อนปิด
  memory:{rounds:[3,5,7],inputSec:6,showMs:[620,500,400],gapMs:160,shards:[4,5,6]},       // ค่าที่เป็นชุด 3 ตัว = ระดับง่าย กลาง ยาก
  odd:{grids:3,totalSec:30,penaltySec:3,size:[4,5,6],shade:[.20,.14,.09],rot:[42,30,20]},
  pipes:{totalSec:45,size:[4,4,5],tee:[0,.25,.4]},
  tier(level){return level>=40?2:level>=20?1:0}       // เลเวล 1-19 ง่าย · 20-39 กลาง · 40 ขึ้นไป ยาก
};
const TXT={
  th:{memory:'จำแสงคริสตัล',odd:'จับผิดผลึก',pipes:'ต่อเส้นพลัง',watch:'ดูลำดับแสงให้ดี',repeat:'แตะตามลำดับเดิม',find:'แตะผลึกที่ไม่เหมือนเพื่อน',turn:'แตะเพื่อหมุนท่อ ต่อพลังจากซ้ายไปถึงคริสตัล',
      round:'รอบ',win:'สำเร็จ!',wrong:'พลาดแล้ว',timeout:'หมดเวลา',quit:'เลิกเล่น'},
  en:{memory:'Crystal Lights',odd:'Odd Crystal Out',pipes:'Power Line',watch:'Watch the lights',repeat:'Tap them in the same order',find:'Tap the crystal that is different',turn:'Tap to turn the pipes. Link the power to the crystal',
      round:'Round',win:'Done!',wrong:'Missed',timeout:'Time is up',quit:'Quit'}
};
const GAMES=['memory','odd','pipes'];
function rng(seed){let a=(seed>>>0)||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,n)=>Math.floor(r()*n);

// ---------------------------------------------------------------- ตัวสร้างด่าน (ไม่มีการวาด ทดสอบแยกได้)
function makeMemory(level,rand){const t=CFG.tier(level),n=CFG.memory.shards[t];
  return {n,rounds:CFG.memory.rounds.map(len=>{const s=[];while(s.length<len){const k=pick(rand,n);if(s[s.length-1]!==k)s.push(k)}return s}),showMs:CFG.memory.showMs[t]}}
function makeOdd(level,rand){const t=CFG.tier(level),n=CFG.odd.size[t],kind=['shade','rot','sides'][pick(rand,3)];
  return {n,kind,odd:pick(rand,n*n),hue:[190,265,150,320][pick(rand,4)],base:pick(rand,4)*15,shade:CFG.odd.shade[t],rot:CFG.odd.rot[t]}}
const OPEN={I:[0,2],L:[0,1],T:[0,1,2]};                       // ทิศที่ท่อเปิดเมื่อยังไม่หมุน · 0 บน 1 ขวา 2 ล่าง 3 ซ้าย
const opens=(type,rot)=>OPEN[type].map(d=>(d+rot)%4),DX=[0,1,0,-1],DY=[-1,0,1,0];
function makePipes(level,rand){const t=CFG.tier(level),n=CFG.pipes.size[t],r0=pick(rand,n),r1=pick(rand,n);
  // 1) วางเส้นทางที่ต่อได้จริงจากขอบซ้าย (แถว r0) ไปขอบขวา (แถว r1) ด้วยการเดินไม่ทับทางเดิม
  let path=null;for(let tries=0;tries<200&&!path;tries++){const seen=new Set([r0*n]),p=[[0,r0]];let x=0,y=r0;
    for(let step=0;step<n*n*2;step++){if(x===n-1&&y===r1){path=p;break}
      const opts=[[1,0],[1,0],[0,1],[0,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&b>=0&&a<n&&b<n&&!seen.has(b*n+a));
      if(!opts.length)break;[x,y]=opts[pick(rand,opts.length)];seen.add(y*n+x);p.push([x,y])}}
  if(!path){path=[];for(let x=0;x<n;x++)path.push([x,r0]);for(let y=r0;y!==r1;y+=Math.sign(r1-r0))path.push([n-1,y+Math.sign(r1-r0)])}
  // 2) ท่อบนเส้นทาง: ต้องเปิดด้านเข้าและด้านออก · ช่องอื่นสุ่ม
  const tiles=[];for(let i=0;i<n*n;i++)tiles.push({type:['I','L','L','T'][pick(rand,4)],rot:pick(rand,4),sol:-1});
  const dirOf=(a,b)=>b[0]>a[0]?1:b[0]<a[0]?3:b[1]>a[1]?2:0;
  path.forEach((c,k)=>{const inD=k===0?3:(dirOf(path[k-1],c)+2)%4,outD=k===path.length-1?1:dirOf(c,path[k+1]);
    let type=(inD+2)%4===outD?'I':'L';if(rand()<CFG.pipes.tee[t])type='T';
    let sol=0;for(let r=0;r<4;r++){const o=opens(type,r);if(o.includes(inD)&&o.includes(outD)){sol=r;break}}
    tiles[c[1]*n+c[0]]={type,rot:sol,sol}});
  // 3) สุ่มหมุนท่อบนเส้นทาง จนกว่าด่านจะ "ยังไม่ต่อ" ตั้งแต่เริ่ม
  const st={n,r0,r1,tiles,path};
  for(let tries=0;tries<50;tries++){for(const c of path){const tl=tiles[c[1]*n+c[0]];tl.rot=pick(rand,4)}if(!pipesLit(st).solved)break}
  if(pipesLit(st).solved){const tl=tiles[path[0][1]*n+path[0][0]];tl.rot=(tl.sol+1)%4;if(pipesLit(st).solved)tl.rot=(tl.sol+2)%4}
  return st}
// ไล่พลังจากขอบซ้าย: คืนชุดช่องที่มีพลัง และบอกว่าถึงคริสตัลที่ขอบขวาหรือยัง
function pipesLit(st){const {n,r0,r1,tiles}=st,lit=new Set(),first=tiles[r0*n];if(!opens(first.type,first.rot).includes(3))return {lit,solved:false};
  const q=[[0,r0]];lit.add(r0*n);while(q.length){const [x,y]=q.pop(),o=opens(tiles[y*n+x].type,tiles[y*n+x].rot);
    for(const d of o){const a=x+DX[d],b=y+DY[d];if(a<0||b<0||a>=n||b>=n||lit.has(b*n+a))continue;const t2=tiles[b*n+a];if(opens(t2.type,t2.rot).includes((d+2)%4)){lit.add(b*n+a);q.push([a,b])}}}
  const last=tiles[r1*n+n-1];return {lit,solved:lit.has(r1*n+n-1)&&opens(last.type,last.rot).includes(1)}}

// ---------------------------------------------------------------- ตัวเล่น (แผ่นทับ + ผืนวาด)
let ACTIVE=null;
function play(opts){opts=opts||{};if(ACTIVE)return Promise.reject(new Error('CrystalGames: a game is already running'));
  const level=Math.max(1,opts.level|0||1),L=TXT[opts.lang==='en'?'en':'th'],rand=rng(opts.seed!=null?opts.seed:(Date.now()^(Math.random()*1e9)));
  const game=GAMES.includes(opts.game)?opts.game:GAMES[pick(rand,GAMES.length)],sc=()=>CFG.timeScale||1,t0=performance.now();
  return new Promise(resolve=>{
    const ov=document.createElement('div');ov.id='cgOverlay';ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(12,7,24,.82);touch-action:none;user-select:none;-webkit-user-select:none';
    const cv=document.createElement('canvas');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';ov.appendChild(cv);(opts.parent||document.body).appendChild(ov);
    const g=cv.getContext('2d');let W=0,H=0,box={x:0,y:0,w:0,h:0},area={x:0,y:0,w:0,h:0},quitR={x:0,y:0,w:0,h:0},raf=0,done=false;
    const st={game,level,phase:'play',hits:[],msg:'',result:null,flash:null,L};ACTIVE=st;
    function size(){const d=Math.min(2,window.devicePixelRatio||1);W=ov.clientWidth;H=ov.clientHeight;cv.width=Math.round(W*d);cv.height=Math.round(H*d);g.setTransform(d,0,0,d,0,0);
      const w=Math.min(W-12,900),h=Math.min(H-12,620);box={x:(W-w)/2,y:(H-h)/2,w,h};const head=Math.max(64,Math.min(84,h*.2));area={x:box.x+12,y:box.y+head,w:w-24,h:h-head-12};quitR={x:box.x+w-52,y:box.y+6,w:46,h:46};layout()}
    function end(win,reason){if(done||st.result)return;st.result={game,win,reason,ms:Math.round(performance.now()-t0),level};st.phase='end';st.endAt=performance.now()+CFG.endDelay/sc()}
    function finish(){if(done)return;done=true;cancelAnimationFrame(raf);removeEventListener('resize',size);ov.remove();ACTIVE=null;if(typeof opts.onEnd==='function'){try{opts.onEnd(st.result)}catch(e){}}resolve(st.result)}

    // ----- เกม 1: จำแสงคริสตัล -----
    let mem,odd,pp,oddLeft,oddFound=0,oddT,ppT;
    function memStart(k){st.round=k;st.seq=mem.rounds[k];st.pos=0;st.phase='show';st.showAt=performance.now()+500/sc();st.lit=-1}
    // ----- เกม 2: จับผิดผลึก -----
    function oddNew(){odd=makeOdd(level,rand);st.odd=odd.odd;st.n=odd.n;st.kind=odd.kind;layout()}
    // ----- จัดวางช่องให้กดได้ (st.hits = รายการสี่เหลี่ยมที่แตะได้ ลำดับเดียวกับหมายเลขช่อง) -----
    function layout(){st.hits=[];if(!area.w)return;
      if(game==='memory'){const n=mem.n,cx=area.x+area.w/2,cy=area.y+area.h/2+6,rx=Math.min(area.w*.36,area.h*.95),ry=Math.min(area.h*.32,rx*.6),r=Math.max(26,Math.min(area.h*.2,area.w/(n*2.6)));
        for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;st.hits.push({x:cx+Math.cos(a)*rx-r,y:cy+Math.sin(a)*ry-r,w:r*2,h:r*2})}}
      else{const n=game==='odd'?odd.n:pp.n,side=Math.min(area.h,area.w*(game==='pipes'?.72:.9)),c=side/n,x0=area.x+(area.w-side)/2,y0=area.y+(area.h-side)/2;
        for(let i=0;i<n*n;i++)st.hits.push({x:x0+(i%n)*c,y:y0+Math.floor(i/n)*c,w:c,h:c})}}
    function tap(px,py){if(st.phase==='end')return;if(px>=quitR.x&&px<=quitR.x+quitR.w&&py>=quitR.y&&py<=quitR.y+quitR.h){end(false,'quit');return}
      const i=st.hits.findIndex(r=>px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h);if(i<0)return;const now=performance.now();
      if(game==='memory'){if(st.phase!=='input')return;st.flash={i,until:now+220/sc(),ok:i===st.seq[st.pos]};
        if(i!==st.seq[st.pos]){end(false,'wrong');return}st.pos++;if(st.pos>=st.seq.length){if(st.round+1>=mem.rounds.length)end(true,'win');else{st.phase='pause';st.nextAt=now+650/sc()}}}
      else if(game==='odd'){if(i===st.odd){oddFound++;st.found=oddFound;st.flash={i,until:now+200/sc(),ok:true};if(oddFound>=CFG.odd.grids)end(true,'win');else oddNew()}else{oddLeft-=CFG.odd.penaltySec*1000;st.flash={i,until:now+260/sc(),ok:false}}}
      else{const tl=pp.tiles[i];tl.rot=(tl.rot+1)%4;const r=pipesLit(pp);st.lit=r.lit;if(r.solved)end(true,'win')}}
    function tick(now){
      if(game==='memory'){if(st.phase==='show'){const step=(mem.showMs+CFG.memory.gapMs)/sc(),k=Math.floor((now-st.showAt)/step);
          if(now<st.showAt)st.lit=-1;else if(k>=st.seq.length){st.phase='input';st.lit=-1;st.inputEnd=now+CFG.memory.inputSec*1000/sc()}else st.lit=(now-st.showAt)-k*step<mem.showMs/sc()?st.seq[k]:-1}
        else if(st.phase==='input'){st.left=(st.inputEnd-now)*sc();if(now>=st.inputEnd)end(false,'timeout')}
        else if(st.phase==='pause'&&now>=st.nextAt)memStart(st.round+1)}
      else if(game==='odd'&&st.phase==='play'){oddLeft-=(now-oddT)*sc();oddT=now;st.left=oddLeft;if(oddLeft<=0)end(false,'timeout')}
      else if(game==='pipes'&&st.phase==='play'){st.left=CFG.pipes.totalSec*1000-(now-ppT)*sc();if(st.left<=0)end(false,'timeout')}
      if(st.phase==='end'&&now>=st.endAt)finish()}

    // ----- วาด -----
    function gem(cx,cy,r,sides,rotDeg,hue,light,glow){g.save();g.translate(cx,cy);g.rotate(rotDeg*Math.PI/180);if(glow){g.shadowColor=`hsla(${hue},95%,75%,.95)`;g.shadowBlur=r*.9}
      g.beginPath();for(let k=0;k<sides;k++){const a=-Math.PI/2+k*2*Math.PI/sides,rr=r*(k%2?.78:1);g.lineTo(Math.cos(a)*rr*.74,Math.sin(a)*rr)}g.closePath();
      const gr=g.createLinearGradient(-r,-r,r,r);gr.addColorStop(0,`hsl(${hue},80%,${Math.min(96,light+22)}%)`);gr.addColorStop(1,`hsl(${hue},70%,${Math.max(8,light-14)}%)`);g.fillStyle=gr;g.fill();
      g.shadowBlur=0;g.lineWidth=Math.max(1.5,r*.07);g.strokeStyle=`hsla(${hue},90%,92%,.75)`;g.stroke();g.beginPath();g.moveTo(0,-r*.9);g.lineTo(0,r*.9);g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=1;g.stroke();g.restore()}
    function draw(now){g.clearRect(0,0,W,H);const b=box;g.fillStyle='#241738';g.strokeStyle='#d9b56a';g.lineWidth=2;g.beginPath();if(g.roundRect)g.roundRect(b.x,b.y,b.w,b.h,14);else g.rect(b.x,b.y,b.w,b.h);g.fill();g.stroke();
      const small=b.h<420,fs=small?17:21;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#f6e2ad';g.font=`700 ${fs}px system-ui,sans-serif`;g.fillText('✨ '+L[game],b.x+16,b.y+22);
      g.font=`${small?13:15}px system-ui,sans-serif`;g.fillStyle='#d8cdea';const hint=game==='memory'?(st.phase==='show'||st.phase==='pause'?L.watch:L.repeat):game==='odd'?L.find:L.turn;g.fillText(hint,b.x+16,b.y+(small?44:48));
      g.textAlign='right';g.fillStyle='#f6e2ad';g.font=`600 ${small?14:16}px system-ui,sans-serif`;
      const prog=game==='memory'?`${L.round} ${(st.round||0)+1}/${mem.rounds.length}`:game==='odd'?`${Math.min(CFG.odd.grids,oddFound+1)}/${CFG.odd.grids}`:'';if(prog)g.fillText(prog,quitR.x-10,b.y+22);
      // ปุ่มเลิกเล่น
      g.fillStyle='rgba(255,255,255,.08)';g.strokeStyle='#d9b56a';g.lineWidth=1.5;g.beginPath();if(g.roundRect)g.roundRect(quitR.x,quitR.y,quitR.w,quitR.h,10);else g.rect(quitR.x,quitR.y,quitR.w,quitR.h);g.fill();g.stroke();
      g.textAlign='center';g.fillStyle='#f6e2ad';g.font='700 20px system-ui,sans-serif';g.fillText('✕',quitR.x+quitR.w/2,quitR.y+quitR.h/2+1);
      // แถบเวลา
      const total=game==='memory'?CFG.memory.inputSec*1000:game==='odd'?CFG.odd.totalSec*1000:CFG.pipes.totalSec*1000,showBar=game!=='memory'||st.phase==='input',fr=showBar?Math.max(0,Math.min(1,(st.left||0)/total)):1;
      const bx=b.x+16,by=area.y-10,bw=b.w-32;g.fillStyle='rgba(255,255,255,.10)';g.fillRect(bx,by,bw,5);g.fillStyle=fr<.25?'#ff8a70':'#8ff4ff';g.fillRect(bx,by,bw*fr,5);
      const fl=st.flash&&now<st.flash.until?st.flash:null;
      if(game==='memory'){const hues=[190,265,45,150,320,20];st.hits.forEach((r,i)=>{const on=st.lit===i||(fl&&fl.i===i);gem(r.x+r.w/2,r.y+r.h/2,r.w/2,6,0,hues[i],on?72:30,on)})}
      else if(game==='odd'){st.hits.forEach((r,i)=>{const isOdd=i===odd.odd,light=44+(isOdd&&odd.kind==='shade'?odd.shade*100:0),rot=odd.base+(isOdd&&odd.kind==='rot'?odd.rot:0),sides=6+(isOdd&&odd.kind==='sides'?2:0);
          gem(r.x+r.w/2,r.y+r.h/2,r.w*.36,sides,rot,odd.hue,light,false);if(fl&&fl.i===i){g.strokeStyle=fl.ok?'#8dffb0':'#ff7a6b';g.lineWidth=3;g.strokeRect(r.x+3,r.y+3,r.w-6,r.h-6)}})}
      else{const n=pp.n,lit=st.lit||new Set(),c=st.hits[0].w,x0=st.hits[0].x,y0=st.hits[0].y;
        st.hits.forEach((r,i)=>{g.fillStyle=(i%n+Math.floor(i/n))%2?'#2f2148':'#33254e';g.fillRect(r.x+1,r.y+1,r.w-2,r.h-2);const tl=pp.tiles[i],cx=r.x+r.w/2,cy=r.y+r.h/2,on=lit.has(i);
          g.lineCap='round';g.lineWidth=Math.max(6,c*.2);g.strokeStyle=on?'#8ff4ff':'#8a7aa8';if(on){g.shadowColor='#8ff4ff';g.shadowBlur=10}
          for(const d of opens(tl.type,tl.rot)){g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+DX[d]*c/2,cy+DY[d]*c/2);g.stroke()}g.shadowBlur=0;g.fillStyle=on?'#d6fbff':'#b3a6cc';g.beginPath();g.arc(cx,cy,g.lineWidth*.62,0,7);g.fill()});
        // แหล่งพลังทางซ้าย และคริสตัลทางขวา
        const sy=y0+(pp.r0+.5)*c,ey=y0+(pp.r1+.5)*c;g.fillStyle='#ffd77a';g.shadowColor='#ffd77a';g.shadowBlur=14;g.beginPath();g.arc(x0-c*.32,sy,c*.2,0,7);g.fill();g.shadowBlur=0;
        g.strokeStyle='#ffd77a';g.lineWidth=Math.max(6,c*.2);g.beginPath();g.moveTo(x0-c*.14,sy);g.lineTo(x0,sy);g.stroke();gem(x0+n*c+c*.42,ey,c*.34,6,0,190,st.result&&st.result.win?74:36,!!(st.result&&st.result.win))}
      if(st.result){g.fillStyle='rgba(12,7,24,.55)';g.fillRect(b.x+2,b.y+2,b.w-4,b.h-4);g.textAlign='center';g.font=`800 ${small?30:40}px system-ui,sans-serif`;g.fillStyle=st.result.win?'#8dffb0':'#ffb3a3';
        g.fillText(st.result.win?L.win:st.result.reason==='timeout'?L.timeout:st.result.reason==='quit'?L.quit:L.wrong,b.x+b.w/2,b.y+b.h/2)}}
    function loop(now){if(done)return;tick(now);if(!done){draw(now);raf=requestAnimationFrame(loop)}}

    if(game==='memory'){mem=makeMemory(level,rand);st.n=mem.n;st.rounds=mem.rounds}
    else if(game==='odd'){oddLeft=CFG.odd.totalSec*1000;oddT=performance.now();st.found=0;odd=makeOdd(level,rand);st.odd=odd.odd;st.n=odd.n;st.kind=odd.kind}
    else{pp=makePipes(level,rand);st.n=pp.n;st.tiles=pp.tiles;st.path=pp.path;st.lit=pipesLit(pp).lit;ppT=performance.now()}
    size();if(game==='memory')memStart(0);
    addEventListener('resize',size);
    ov.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const r=cv.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top)});
    for(const ev of ['click','touchstart','touchend','mousedown','mouseup'])ov.addEventListener(ev,e=>{e.stopPropagation()});   // ไม่ให้การแตะทะลุไปถึงเกมข้างหลัง
    st.quitRect=()=>quitR;st.box=()=>box;raf=requestAnimationFrame(loop)})}

window.CrystalGames={version:1,list:GAMES.slice(),CFG,TXT,play,state:()=>ACTIVE,_make:{memory:makeMemory,odd:makeOdd,pipes:makePipes},_pipesLit:pipesLit,_rng:rng};
})();
