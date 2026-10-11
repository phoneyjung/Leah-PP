// ================= 2.21 Claude · Trickster test mode (owner 11 Oct 17:17: "a separate version with every Trickster move, attack and character, in the LA structure, for my own tests, online too")
// Loaded by index.html ONLY with ?tk (and it works only on a GM slot). Players never download it.
// No Trickster picture is in this repo: the game reads the owner's own character.zip (or loose .nri files) picked on his device and keeps it in that browser (IndexedDB 'la-tk221').
// Files: chrNNN.nri = one character, 167 animations "<action>_<direction>" (36 actions × 8 directions) · 8/16/24-bit frames (raw · row-RLE · LZ4 "CC FC A0 CC") · palette block "PAL_" · pal/job*.pal = 768-byte colour sets.
// Drawing: the player keeps the game's drawPlayer chain (behind-roof fade, seats, pools); during the call PS.stand/PS.walk/PS.F point at one scratch frame of the current Trickster action.
// Online: Net.send adds {tk:{c,a,n,p}} to the player record (rules accept extra fields); a device with the same zip draws that player as the Trickster character, others see the normal look.
(function(){
'use strict';
const TK={files:[],ent:{},chars:{},cur:null,st:{a:'',t0:0,n:0},mem:null,err:'',busy:false,FA:0,scratch:null,last:{},idle0:0,pals:{}};
window.TK221=TK;
const DIRK=['아래','대각오른쪽앞','오른쪽','대각오른쪽뒤','위','대각왼쪽뒤','왼쪽','대각왼쪽앞'];   // the game's rows S SE E NE N NW W SW
// the 36 actions: key, Thai, English, how it plays (loop / once / hold = stay on the last frame)
const ACT=[['서있기','ยืน','Stand','loop'],['걷기','เดิน','Walk','loop'],['달리기','วิ่ง','Run','loop'],['공격','โจมตี','Attack','once'],['공격2','โจมตี 2','Attack 2','once'],['무기크리티컬','คริติคอล','Critical','once'],
 ['마법','ร่ายเวท','Magic','once'],['기모으기','รวมพลัง','Charge','once'],['던지기','ขว้าง','Throw','once'],['공격준비','เตรียมตี','Ready','once'],['공격모드','โหมดสู้','Battle stance','loop'],['피격','โดนตี','Hit','once'],
 ['기절','สลบ','Faint','hold'],['아래','ล้ม','Down','hold'],['피하기','หลบ','Dodge','once'],['막기','กัน','Block','once'],['방패막기','ยกโล่','Shield','once'],['점프','กระโดด','Jump','once'],
 ['기뻐하기','ดีใจ','Happy','once'],['화내기','โกรธ','Angry','once'],['슬퍼하기','เสียใจ','Sad','once'],['자동행동','ท่าว่าง','Idle','once'],['자동행동2','ท่าว่าง 2','Idle 2','once'],['잠자기','นอน','Sleep','loop'],
 ['앉기','นั่ง','Sit','hold'],['의자앉기1','นั่งเก้าอี้ 1','Chair 1','hold'],['의자앉기2','นั่งเก้าอี้ 2','Chair 2','hold'],
 ['땅파기0','ขุด 0','Dig 0','loop'],['땅파기1','ขุด 1','Dig 1','loop'],['땅파기2','ขุด 2','Dig 2','loop'],['땅파기3','ขุด 3','Dig 3','loop'],['땅파기4','ขุด 4','Dig 4','loop'],['땅파기5','ขุด 5','Dig 5','loop'],['땅파기6','ขุด 6','Dig 6','loop'],['땅파기7','ขุด 7','Dig 7','loop'],['땅파기8','ขุด 8','Dig 8','loop']];
const AI={};ACT.forEach((a,i)=>AI[a[0]]=i);TK.ACT=ACT;TK.DIRK=DIRK;
const JOBMAP={bash:'무기크리티컬',guard:'방패막기',provoke:'화내기',shower:'던지기',evade:'피하기',fire:'마법',ice:'마법',bolt:'마법',steal:'던지기',dash:'달리기'};
const WEPMAP={sw:'공격2',bow:'던지기',staff:'마법',dag:'무기크리티컬'};
const EMOMAP={'❤️':'기뻐하기','⭐':'기모으기','🎵':'자동행동2','👋':'자동행동','😂':'기뻐하기'};
const L=()=>{try{return LANG==='en'}catch(e){return false}};const tx=(th,en)=>L()?en:th;
const on=()=>{try{return gmOn()&&S&&S.tk221&&TK.cur&&TK.cur.ok&&S.tk221.c===TK.cur.id}catch(e){return false}};
TK.on=on;

// ---------- files: zip index (stored / deflate) and IndexedDB keeping ----------
function idb(){return new Promise((res,rej)=>{try{const r=indexedDB.open('la-tk221',1);r.onupgradeneeded=()=>{try{r.result.createObjectStore('s')}catch(e){}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(Error('blocked'))}catch(e){rej(e)}})}
function keepGet(){if(TK.mem)return Promise.resolve(TK.mem.slice());return idb().then(db=>new Promise(res=>{try{const q=db.transaction('s').objectStore('s').get('files');q.onsuccess=()=>res(Array.isArray(q.result)?q.result:[]);q.onerror=()=>res([])}catch(e){res([])}})).catch(()=>[])}
function keepPut(list){return idb().then(db=>new Promise(res=>{try{const t=db.transaction('s','readwrite');t.objectStore('s').put(list,'files');t.oncomplete=()=>res(true);t.onerror=t.onabort=()=>res(false)}catch(e){res(false)}})).catch(()=>false).then(ok=>{if(!ok)TK.mem=list.slice();return ok})}
async function zipIndex(blob,src){const n=blob.size,tail=new Uint8Array(await blob.slice(Math.max(0,n-65558)).arrayBuffer());let e=-1;for(let i=tail.length-22;i>=0;i--)if(tail[i]===0x50&&tail[i+1]===0x4b&&tail[i+2]===5&&tail[i+3]===6){e=i;break}
 if(e<0)throw Error('not a zip');const dv=new DataView(tail.buffer,tail.byteOffset);const cnt=dv.getUint16(e+10,true),cdSize=dv.getUint32(e+12,true),cdOff=dv.getUint32(e+16,true);
 const cd=new Uint8Array(await blob.slice(cdOff,cdOff+cdSize).arrayBuffer()),cv=new DataView(cd.buffer);const out=[];let p=0;const dec=new TextDecoder('utf-8');
 for(let i=0;i<cnt&&p+46<=cd.length;i++){if(cv.getUint32(p,true)!==0x02014b50)break;const method=cv.getUint16(p+10,true),csize=cv.getUint32(p+20,true),usize=cv.getUint32(p+24,true),nl=cv.getUint16(p+28,true),el=cv.getUint16(p+30,true),cl=cv.getUint16(p+32,true),lho=cv.getUint32(p+42,true);
  const name=dec.decode(cd.subarray(p+46,p+46+nl));out.push({name,method,csize,usize,lho,src});p+=46+nl+el+cl}return out}
async function zipRead(e){const blob=e.src;if(e.loose)return new Uint8Array(await blob.arrayBuffer());const lh=new DataView(await blob.slice(e.lho,e.lho+30).arrayBuffer());const st=e.lho+30+lh.getUint16(26,true)+lh.getUint16(28,true),part=blob.slice(st,st+e.csize);
 if(e.method===0)return new Uint8Array(await part.arrayBuffer());if(e.method===8)return new Uint8Array(await new Response(part.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());throw Error('zip method '+e.method)}
const base=n=>n.split('/').pop();
async function indexAll(list){TK.ent={};for(const f of list){try{if(/\.zip$/i.test(f.name)){for(const e of await zipIndex(f.blob,f.blob))if(!/\/$/.test(e.name))TK.ent[base(e.name).toLowerCase()]=e}
  else TK.ent[base(f.name).toLowerCase()]={name:f.name,loose:true,src:f.blob}}catch(err){TK.err=f.name+': '+err.message}}
 TK.ids=Object.keys(TK.ent).filter(n=>/^(chr|trs)\w*\.nri$/i.test(n)).map(n=>n.replace(/\.nri$/i,'')).sort();
 TK.palIds=Object.keys(TK.ent).filter(n=>/\.pal$/i.test(n)).map(n=>n.replace(/\.pal$/i,'')).sort();return TK.ids}

// ---------- NORI ----------
function lz4(src){const out=[];let i=0;while(i<src.length){const t=src[i++];let Ln=t>>4;if(Ln===15){let b;do{b=src[i++];Ln+=b}while(b===255)}for(let k=0;k<Ln;k++)out.push(src[i++]);if(i>=src.length)break;const off=src[i]|(src[i+1]<<8);i+=2;let M=t&15;if(M===15){let b;do{b=src[i++];M+=b}while(b===255)}M+=4;for(let k=0;k<M;k++)out.push(out[out.length-off])}return Uint8Array.from(out)}
async function unpack(u8){if(u8.length>14&&u8[12]===0x78&&new DataView(u8.buffer,u8.byteOffset).getUint32(8,true)===u8.length-12)return new Uint8Array(await new Response(new Blob([u8.subarray(12)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());return u8}
const KR=(()=>{try{return new TextDecoder('euc-kr')}catch(e){return new TextDecoder('utf-8')}})();
function cstr(u8,p,n){let e=p;while(e<p+n&&u8[e])e++;return KR.decode(u8.subarray(p,e))}
function noriParse(u8){const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),u32=p=>dv.getUint32(p,true),i32=p=>dv.getInt32(p,true);
 if(String.fromCharCode(u8[0],u8[1],u8[2],u8[3])!=='NORI')throw Error('not NORI');const nanim=u32(0x1c),g=0x28;if(String.fromCharCode(u8[g],u8[g+1],u8[g+2],u8[g+3])!=='GAWI')throw Error('no GAWI');
 const bpp=u32(g+8),nb=u32(g+0x24);let p=g+0x2c,pal=null;if(String.fromCharCode(u8[p],u8[p+1],u8[p+2],u8[p+3])==='PAL_'){pal=u8.slice(p+0x20,p+0x20+768);p+=u32(p+0x1c)}p+=4*nb;
 const frames=[];for(let i=0;i<nb;i++){const sz=i32(p+4),w=i32(p+8),h=i32(p+12);frames.push({w,h,data:u8.subarray(p+28,p+28+sz)});p+=28+sz}
 const anims={};if(nanim){const A=p+4*nanim;for(let i=0;i<nanim;i++){const q=A+u32(p+4*i),name=cstr(u8,q,32),nf=u32(q+32),F=q+36+4*nf,fl=[];
   for(let f=0;f<nf;f++){let r=F+u32(q+36+4*f);const delay=u32(r),ns=u32(r+4);r+=8;const spr=[];for(let k=0;k<ns;k++,r+=28)spr.push([i32(r),i32(r+4),i32(r+8),i32(r+12),i32(r+16),i32(r+20)]);fl.push({delay,spr})}
   if(!anims[name])anims[name]=fl}}
 return {bpp,pal,frames,anims}}
function decodeBmp(fr,bpp,pal){const w=fr.w,h=fr.h;let d=fr.data;if(w<=0||h<=0)return null;if(d[0]===0xcc&&d[1]===0xfc&&d[2]===0xa0&&d[3]===0xcc)d=lz4(d.subarray(4));
 const B=bpp===24?3:bpp===8?1:2,img=new ImageData(w,h),o=img.data;let x0=w,y0=h,x1=-1,y1=-1;
 const put=(x,y,q)=>{let r,g,b;if(B===1){const v=d[q];if(!v)return;r=pal[v*3];g=pal[v*3+1];b=pal[v*3+2]}else if(B===2){const v=d[q]|(d[q+1]<<8);if(v===0x7c1f)return;r=((v>>10)&31)*255/31|0;g=((v>>5)&31)*255/31|0;b=(v&31)*255/31|0}else{b=d[q];g=d[q+1];r=d[q+2];if(r===255&&g===0&&b===255)return}
  const k=(y*w+x)*4;o[k]=r;o[k+1]=g;o[k+2]=b;o[k+3]=255;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y};
 if(d.length===w*h*B){for(let y=0;y<h;y++)for(let x=0;x<w;x++)put(x,y,(y*w+x)*B)}
 else{let p=0;for(let y=0;y<h&&p+2<=d.length;y++){const rl=d[p]|(d[p+1]<<8);if(rl<2)break;const end=p+rl;let q=p+2,x=0;while(q+4<=end){const skip=d[q]|(d[q+1]<<8),cnt=d[q+2]|(d[q+3]<<8);q+=4;x+=skip;for(let k=0;k<cnt;k++,x++,q+=B)if(x<w)put(x,y,q)}p=end}}
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(img,0,0);c.bb=x1<0?null:[x0,y0,x1+1,y1+1];return c}

// ---------- one character ----------
async function loadChar(id,palId){const key=id+'|'+(palId||'');if(TK.chars[key])return TK.chars[key];const e=TK.ent[(id+'.nri').toLowerCase()];if(!e)return null;
 const N=noriParse(await unpack(await zipRead(e)));let pal=N.pal;if(palId&&TK.ent[(palId+'.pal').toLowerCase()]){const pu=await zipRead(TK.ent[(palId+'.pal').toLowerCase()]);if(pu.length>=768)pal=pu.slice(0,768)}
 const bmp=N.frames.map(f=>decodeBmp(f,N.bpp,pal||new Uint8Array(768))),C={id,pal:palId||'',N,bmp,comp:{},ok:false};
 // composite boxes (anchor = the file's object point; the feet are a few pixels below it)
 const box=fr=>{let a=[1e9,1e9,-1e9,-1e9];for(const s of fr.spr){if(s[5]===6)continue;const b=bmp[s[0]];if(!b||!b.bb)continue;const bx=s[4]?b.width-b.bb[2]:b.bb[0],bx2=s[4]?b.width-b.bb[0]:b.bb[2];a=[Math.min(a[0],s[1]+bx),Math.min(a[1],s[2]+b.bb[1]),Math.max(a[2],s[1]+bx2),Math.max(a[3],s[2]+b.bb[3])]}return a[2]<a[0]?null:a};
 let foot=0,top=0;for(const d of DIRK){const fr=(N.anims['서있기_'+d]||[])[0];const b=fr&&box(fr);if(b){foot=Math.max(foot,b[3]);top=Math.min(top,b[1])}}
 let half=0,up=0,down=0;for(const k in N.anims)for(const fr of N.anims[k]){const b=box(fr);if(!b)continue;half=Math.max(half,-b[0],b[2]);up=Math.max(up,-b[1]);down=Math.max(down,b[3])}
 C.foot=foot;C.h=foot-top;const sz=v=>[64,72,80,96,112,128,160,192,224,256,320].find(s=>s>=v)||320;
 C.FA=sz(Math.max(2*half+4,up+foot+4,Math.min(down,foot+40)+up+4));
 let bh=0,bu=0;for(const d of DIRK)for(const k of ['서있기_','걷기_'])for(const fr of (N.anims[k+d]||[])){const b=box(fr);if(b){bh=Math.max(bh,-b[0],b[2]);bu=Math.max(bu,-b[1])}}C.F=sz(Math.max(2*bh+2,bu+foot+2));
 C.box=box;TK.chars[key]=C;C.ok=!!N.anims['서있기_아래'];return C}
function comp(C,name,fi){const fl=C.N.anims[name];if(!fl||!fl.length)return null;fi=((fi%fl.length)+fl.length)%fl.length;const k=name+'|'+fi;if(C.comp[k])return C.comp[k];
 const fr=fl[fi],b=C.box(fr);if(!b){C.comp[k]={cv:null,ax:0,ay:0};return C.comp[k]}const cv=document.createElement('canvas');cv.width=b[2]-b[0];cv.height=b[3]-b[1];const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
 for(const s of fr.spr){if(s[5]===6)continue;const im=C.bmp[s[0]];if(!im)continue;g.save();if(s[3]>0&&s[3]<100)g.globalAlpha=s[3]/100;if(s[5]===4)g.globalCompositeOperation='lighter';if(s[4]){g.translate(s[1]-b[0]+im.width,s[2]-b[1]);g.scale(-1,1);g.drawImage(im,0,0)}else g.drawImage(im,s[1]-b[0],s[2]-b[1]);g.restore()}
 return C.comp[k]={cv,ax:-b[0],ay:-b[1]}}
// anim lookup: the action in this direction, else the mirrored side, else standing
function animFor(C,act,row){const N=C.N.anims;let n=act+'_'+DIRK[row];if(N[n])return n;for(const d of DIRK)if(N[act+'_'+d])return act+'_'+d;return N['서있기_'+DIRK[row]]?'서있기_'+DIRK[row]:'서있기_아래'}
// the game's stand (8F×F) and walk (6F×8F) sheets from the Trickster frames: shadows, the HUD portrait and the bag use these
function sheets(C){if(C.sh)return C.sh;const F=C.F,st=document.createElement('canvas'),wk=document.createElement('canvas');st.width=8*F;st.height=F;wk.width=6*F;wk.height=8*F;const sg=st.getContext('2d'),wg=wk.getContext('2d');sg.imageSmoothingEnabled=wg.imageSmoothingEnabled=false;
 for(let r=0;r<8;r++){const s=comp(C,animFor(C,'서있기',r),0);if(s&&s.cv)sg.drawImage(s.cv,r*F+F/2-s.ax,(F-1)-C.foot-s.ay);const nm=animFor(C,'걷기',r),n=(C.N.anims[nm]||[]).length||1;for(let f=0;f<6;f++){const w=comp(C,nm,Math.round(f*n/6));if(w&&w.cv)wg.drawImage(w.cv,f*F+F/2-w.ax,r*F+(F-1)-C.foot-w.ay)}}
 return C.sh={stand:st,walk:wk,F}}
// draw one action frame into the shared FA×FA scratch, feet on row FA-2
function scratchOf(C,name,fi){const FA=C.FA;let c=TK.scratch;if(!c||c.width!==FA){c=TK.scratch=document.createElement('canvas');c.width=c.height=FA}const g=c.getContext('2d');g.clearRect(0,0,FA,FA);const s=comp(C,name,fi);if(s&&s.cv)g.drawImage(s.cv,FA/2-s.ax,(FA-1)-C.foot-s.ay);return c}

// ---------- what the player is doing ----------
function frameAt(fl,ms,loop){let tot=0;for(const f of fl)tot+=Math.max(40,f.delay||100);if(!loop&&ms>=tot)return -1;let m=loop?ms%tot:ms;for(let i=0;i<fl.length;i++){m-=Math.max(40,fl[i].delay||100);if(m<0)return i}return fl.length-1}
function play(act){if(!(act in AI))return;TK.st={a:act,t0:performance.now(),n:(TK.st.n||0)+1};TK.idle0=performance.now();try{if(Net.online)Net.send(true)}catch(e){}}
TK.play=play;
function watch(){const now=performance.now(),l=TK.last;   // read the game's own state each frame, so early-bound buttons count too
 const atk=P.atkAnim||0;if(atk>(l.atk||0)+.01&&!P.dead&&!(typeof DIG!=='undefined'&&DIG)){let a='공격';try{if((P.skCd||0)>(l.skCd||0)+.01)a=WEPMAP[weapon().type]||'공격2';else if(typeof JCD!=='undefined'){for(const k in JCD)if(JCD[k]!==(l.jcd||{})[k]&&JCD[k]>now){a=JOBMAP[k]||'마법';break}}}catch(e){}play(a)}
 l.atk=atk;l.skCd=P.skCd||0;try{l.jcd=Object.assign({},JCD)}catch(e){}
 if((P.hurt||0)>(l.hurt||0)+.01&&!['공격','공격2','무기크리티컬','마법'].includes(TK.st.a))play('피격');l.hurt=P.hurt||0;
 try{if(DASH&&DASH!==l.dash&&DASH.t>0)play('피하기');l.dash=DASH}catch(e){}
 try{if(myEmoteT>(l.emoT||0)+.5&&myEmote)play(EMOMAP[myEmote]||'기뻐하기');l.emoT=myEmoteT}catch(e){}
 if(P.moving||P.path&&P.path.length||P.sit||P.dead)TK.idle0=now}
function current(C){const now=performance.now(),row=P.row||0,st=TK.st;
 if(P.dead)return [animFor(C,'기절',row),'hold',st.a==='기절'?st.t0:(TK.st={a:'기절',t0:now,n:st.n+1}).t0];
 if(st.a==='기절')TK.st={a:'',t0:0,n:st.n};
 try{if(typeof DIG!=='undefined'&&DIG)return [animFor(C,'땅파기0',row),'loop',DIG.t0||(DIG.t0=now)]}catch(e){}
 if(st.a&&!['서있기','걷기','달리기','기절'].includes(st.a)){const mode=ACT[AI[st.a]][3],nm=animFor(C,st.a,row),fl=C.N.anims[nm];
  if(fl&&!(P.moving&&mode!=='loop'&&now-st.t0>250)){if(mode!=='once'||frameAt(fl,now-st.t0,false)>=0)return [nm,mode,st.t0]}TK.st={a:'',t0:0,n:st.n}}
 if(P.sit){const chair=typeof P.sit==='object'&&P.sit.side&&P.sit.side!=='ground';return [animFor(C,chair?'의자앉기1':'앉기',row),'hold',P.sit.t0||TK.sitT0||(TK.sitT0=now)]}TK.sitT0=0;
 if(P.moving){let run=false;try{run=(S.eff&&S.eff.dash>Date.now())||(S.eff&&S.eff.dash>now)}catch(e){}return [animFor(C,run?'달리기':'걷기',row),'walk',0]}
 if(now-TK.idle0>7000){play('자동행동');return current(C)}
 return [animFor(C,'서있기',row),'loop',TK.idle0]}
function frameNow(C,cur){const fl=C.N.anims[cur[0]]||[];if(!fl.length)return 0;if(cur[1]==='walk')return Math.floor((P.dist||0)/10)%fl.length;const ms=performance.now()-cur[2];if(cur[1]==='hold'){const i=frameAt(fl,ms,false);return i<0?fl.length-1:i}return frameAt(fl,ms,true)}

// ---------- hooks into the game ----------
// the slot asks for a character that is not loaded yet (after a reload or a slot change): load it, then rebuild the sheets
function want(){try{if(!S||!S.tk221||!gmOn()||TK.loading)return;const w=S.tk221;if(TK.cur&&TK.cur.id===w.c&&(TK.cur.pal||'')===(w.p||''))return;TK.loading=1;const owner=S;
  (TK.bootP||Promise.resolve()).then(()=>loadChar(w.c,w.p||'')).then(C=>{TK.loading=0;if(C&&C.ok&&S===owner&&S.tk221&&S.tk221.c===C.id&&(S.tk221.p||'')===(C.pal||'')){TK.cur=C;buildPlayerSheets()}}).catch(()=>{TK.loading=0})}catch(e){TK.loading=0}}
{const old=buildPlayerSheets;buildPlayerSheets=function(){const r=old.apply(this,arguments);PS.tk221=false;try{want()}catch(e){}try{if(on()){const sh=sheets(TK.cur);PS.stand=sh.stand;PS.walk=sh.walk;PS.F=sh.F;PS.pd219=false;PS.local220=false;PS.silS=silOf(PS.stand);PS.silW=silOf(PS.walk);PS.sc=0;PS.shS=blurSheet(PS.silS);PS.shW=blurSheet(PS.silW);PS.gmSprite170=true;PS.tk221=true}}catch(e){}return r}}
{const old=drawPlayer;drawPlayer=function(sx,sy){if(!on()||!PS.tk221)return old.apply(this,arguments);let cur,fi;try{watch();cur=current(TK.cur);fi=frameNow(TK.cur,cur)}catch(e){return old.apply(this,arguments)}
  const C=TK.cur,c=scratchOf(C,cur[0],fi),sv=[PS.stand,PS.walk,PS.F,P.moving];TK.shown=[cur[0],fi];PS.stand=PS.walk=c;PS.F=C.FA;P.moving=false;try{return old.call(this,0,0)}finally{PS.stand=sv[0];PS.walk=sv[1];PS.F=sv[2];P.moving=sv[3]}}}
// the name and an emote just above the head
{const o=label;label=function(x,y,s,col){try{if(PS.tk221&&TK.cur&&Math.abs(x-(P.x-camX))<.5&&Math.abs(y-(P.y-camY-PS.F-2))<.5)y=P.y-camY-TK.cur.h-6;TK.labelLift=Math.round((P.y-camY)-y)}catch(e){}return o.apply(this,[x,y,s,col])}}
{const o=emoteBubble;emoteBubble=function(x,y,e,tt){try{if(PS.tk221&&TK.cur&&Math.abs(x-(P.x-camX))<.5&&Math.abs(y-(P.y-camY-PS.F-16))<.5)y=P.y-camY-TK.cur.h-20}catch(err){}return o.apply(this,[x,y,e,tt])}}
// online: tell the others which character and action (a = index in ACT, n = how many actions so far)
{const old=Net.send;Net.send=function(force){if(!on()||!this.me)return old.apply(this,arguments);const me=this.me,set=me.set;me.set=function(v){try{if(v&&typeof v==='object'){const a=AI[TK.st.a];v.tk={c:TK.cur.id,p:TK.cur.pal||'',a:a==null?-1:a,n:TK.st.n||0}}}catch(e){}return set.apply(this,arguments)};try{return old.apply(this,arguments)}finally{me.set=set}}}
const othLoad={};
{const old=drawOther;drawOther=function(o){try{const p=o&&o.p,tk=p&&p.tk;if(tk&&typeof tk.c==='string'&&TK.ent[(tk.c+'.nri').toLowerCase()]){const key=tk.c+'|'+(tk.p||'');const C=TK.chars[key];
   if(!C){if(!othLoad[key]){othLoad[key]=1;loadChar(tk.c,tk.p||'').catch(()=>{})}return old.apply(this,arguments)}
   if(C.ok){const now=performance.now();if(o.tkN!==tk.n){o.tkN=tk.n;o.tkT0=now;o.tkA=tk.a}const mv=p.w&&Math.hypot(o.tx-o.x,o.ty-o.y)>1,row=p.r||0;let nm,fi;
    const act=o.tkA>=0&&ACT[o.tkA]?ACT[o.tkA]:null;if(act&&act[3]!=='loop'&&!(mv&&now-o.tkT0>250)){nm=animFor(C,act[0],row);const fl=C.N.anims[nm]||[];fi=frameAt(fl,now-o.tkT0,false);if(fi<0)fi=act[3]==='hold'?fl.length-1:-1}
    if(fi==null||fi<0){nm=animFor(C,mv?'걷기':(act&&act[3]==='loop'?act[0]:'서있기'),row);const fl=C.N.anims[nm]||[];fi=mv?Math.floor((o.dist||0)/10)%Math.max(1,fl.length):frameAt(fl,now-(o.tkT0||0),true)}
    if(p.z)ctx.globalAlpha=.4;ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalCompositeOperation='multiply';softAO(ctx,o.x-camX,o.y-camY,22,.8);ctx.restore();
    const s=comp(C,nm,fi);if(s&&s.cv)ctx.drawImage(s.cv,Math.round(o.x-camX-s.ax),Math.round(o.y-camY-1-C.foot-s.ay));
    label(o.x-camX,o.y-camY-C.h-6,(p.ti?'«'+p.ti+'» ':'')+p.n+' Lv'+p.lv,HOUSES[p.h].col);if(o.emoteT>0)emoteBubble(o.x-camX,o.y-camY-C.h-20,o.emote,o.emoteT);ctx.globalAlpha=1;if(p.z)label(o.x-camX,o.y-camY+8,'💤 '+t('away'));o.tkDrawn=1;return}}}catch(e){}
  return old.apply(this,arguments)}}

// ---------- choose / load ----------
async function apply(id,pal){TK.busy=true;try{let C=null;try{C=await loadChar(id,pal)}catch(e){TK.err=id+': '+e.message;return false}if(!C||!C.ok)return false;TK.cur=C;S.tk221={c:id,p:pal||''};TK.st={a:'',t0:0,n:TK.st.n||0};TK.idle0=performance.now();buildPlayerSheets();save();try{if(Net.online)Net.send(true)}catch(e){}return true}finally{TK.busy=false}}
TK.apply=apply;
function restore(){delete S.tk221;TK.cur=null;buildPlayerSheets();save();try{if(Net.online)Net.send(true)}catch(e){}}
async function boot(){TK.files=await keepGet();if(TK.files.length)await indexAll(TK.files);try{if(S&&S.tk221&&gmOn()){await apply(S.tk221.c,S.tk221.p)}}catch(e){}TK.booted=true}
TK.boot=boot;

// ---------- the GM window ----------
async function thumbOf(id){TK.thumbs=TK.thumbs||{};if(TK.thumbs[id])return TK.thumbs[id];const e=TK.ent[(id+'.nri').toLowerCase()];if(!e)return null;const N=noriParse(await unpack(await zipRead(e)));
 const fr=(N.anims['서있기_아래']||N.anims['서있기_대각오른쪽앞']||[])[0];if(!fr)return null;const bm={};for(const s of fr.spr)if(!(s[0] in bm)&&N.frames[s[0]])bm[s[0]]=decodeBmp(N.frames[s[0]],N.bpp,N.pal||new Uint8Array(768));
 const C={N:{anims:{'서있기_아래':[fr]}},bmp:bm,comp:{},foot:0};let a=[1e9,1e9,-1e9,-1e9];for(const s of fr.spr){if(s[5]===6)continue;const b=bm[s[0]];if(!b||!b.bb)continue;a=[Math.min(a[0],s[1]+(s[4]?b.width-b.bb[2]:b.bb[0])),Math.min(a[1],s[2]+b.bb[1]),Math.max(a[2],s[1]+(s[4]?b.width-b.bb[0]:b.bb[2])),Math.max(a[3],s[2]+b.bb[3])]}
 if(a[2]<a[0])return null;C.box=()=>a;C.foot=a[3];return TK.thumbs[id]=thumb(C)}
function thumb(C){const s=comp(C,animFor(C,'서있기',0),0),c=document.createElement('canvas');c.width=c.height=72;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(s&&s.cv){const k=Math.min(1,68/Math.max(s.cv.width,s.cv.height));g.drawImage(s.cv,36-s.ax*k,70-(C.foot+1)*k-s.ay*k,s.cv.width*k,s.cv.height*k)}return c}
function openTK(){if(!gmOn())return;const owner=S;let closed=false;const live=()=>!closed&&$('tk221')&&!$('modal').classList.contains('hide')&&S===owner;
 modal(`<div id="tk221"><h2>${tx('ทดสอบตัวละคร Trickster','Trickster test')}</h2><p class="tkp">${tx('เลือก character.zip (หรือไฟล์ .nri) จากมือถือ · ไฟล์อยู่ในเครื่องนี้เท่านั้น ไม่ขึ้นเว็บ ไม่อยู่ในเซฟ · เฉพาะเซฟ GM','Pick character.zip (or .nri files) from this phone · kept on this device only · GM slot only')}</p>
  <div class="tkrow"><label id="tk221pick" class="tkpick" role="button" tabindex="0">${tx('เลือกไฟล์…','Pick files…')}<input type="file" id="tk221file" accept=".zip,.nri,.pal,application/zip" multiple></label><p id="tk221st" class="tkp" role="status"></p></div>
  <h3>${tx('ตัวละคร','Character')}</h3><div id="tk221chars" class="tkgrid"></div>
  <h3>${tx('สีชุด (บางชุดทำมาให้ตัวอื่น สีอาจเพี้ยน)','Colours (some sets belong to other characters)')}</h3><div id="tk221pals" class="tkgrid small"></div>
  <h3>${tx('ลองท่า (ทิศที่หันอยู่)','Play a move (current facing)')}</h3><div id="tk221acts" class="tkgrid small"></div>
  <div class="tkb"><button id="tk221turn">⟳ ${tx('หมุนตัว','Turn')}</button><button id="tk221back">${tx('กลับตัวเดิม','Back to my character')}</button><button id="tk221del">${tx('ลบไฟล์ในเครื่อง','Delete files')}</button><button id="tk221x">${tx('ปิด','Close')}</button></div></div>`,false);
 document.querySelector('#modal>.pn')?.classList.add('tk221-panel');
 const status=s=>{if(live())$('tk221st').textContent=s};
 const paint=async()=>{if(!live())return;const box=$('tk221chars');box.innerHTML='';const ids=TK.ids||[];
  if(!ids.length){status(TK.err||tx('ยังไม่มีไฟล์ · กด "เลือกไฟล์" แล้วเลือก character.zip','No file yet · pick character.zip'));}else status(tx('ตัวละคร ','Characters ')+ids.length+(TK.mem?tx(' · เครื่องนี้ไม่ยอมเก็บ ใช้ได้จนปิดเกม',' · this browser will not keep them'):''));
  for(const id of ids){const b=document.createElement('button');b.className='tkopt'+(S.tk221&&S.tk221.c===id?' on':'');b.dataset.id=id;const sp=document.createElement('span');sp.textContent=id;b.appendChild(sp);box.appendChild(b);
   b.onclick=async()=>{if(!live())return;status(tx('กำลังโหลด ','Loading ')+id+'…');const ok=await apply(id,'');await paint();status(ok?tx('ใช้ ','Using ')+id:tx('ไฟล์นี้ใช้ไม่ได้: ','Not usable: ')+id)};
   TK.tq=(TK.tq||Promise.resolve()).then(()=>thumbOf(id)).then(c=>{if(c&&b.isConnected){const k=document.createElement('canvas');k.width=k.height=72;k.getContext('2d').drawImage(c,0,0);b.prepend(k)}}).catch(()=>{})}
  const pb=$('tk221pals');pb.innerHTML='';if(S.tk221){for(const pid of ['',...(TK.palIds||[])]){const b=document.createElement('button');b.className='tkopt'+((S.tk221.p||'')===pid?' on':'');b.textContent=pid||tx('สีเดิม','Original');b.dataset.pal=pid;b.onclick=async()=>{if(!live())return;await apply(S.tk221.c,pid);paint()};pb.appendChild(b)}}
  const ab=$('tk221acts');ab.innerHTML='';if(S.tk221)for(const a of ACT){const b=document.createElement('button');b.className='tkopt';b.dataset.act=a[0];b.textContent=tx(a[1],a[2]);b.onclick=()=>{if(!on())return;closed=true;closeModal();play(a[0])};ab.appendChild(b)}};
 $('tk221x').onclick=()=>{closed=true;closeModal()};$('tk221back').onclick=()=>{if(!live())return;restore();closed=true;closeModal();say(tx('กลับเป็นตัวเดิมแล้ว','Your character is back'))};
 $('tk221turn').onclick=()=>{if(!live())return;P.row=((P.row||0)+1)%8};
 $('tk221del').onclick=async()=>{if(!live())return;await keepPut([]);TK.mem=null;TK.files=[];TK.ent={};TK.ids=[];TK.palIds=[];TK.chars={};if(S.tk221)restore();paint()};
 $('tk221pick').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('tk221file').click()}};
 $('tk221file').onchange=async e=>{const fs=[...(e.target.files||[])];e.target.value='';if(!fs.length||!live())return;status(tx('กำลังอ่านไฟล์…','Reading…'));let list=await keepGet();for(const f of fs){list=list.filter(x=>x.name!==f.name);list.push({name:f.name,blob:f})}
  TK.err='';const okKeep=await keepPut(list);TK.files=list;TK.chars={};await indexAll(list);if(!okKeep)TK.mem=list.slice();paint()};
 paint()}
TK.open=openTK;
{const old=openGM;openGM=function(){const r=old.apply(this,arguments);try{if(gmOn()&&!$('gmTk221')){const b=document.createElement('button');b.id='gmTk221';b.textContent=tx('ทดสอบ Trickster (?tk)','Trickster test (?tk)');b.style.minHeight='48px';b.onclick=()=>openTK();$('mBody').prepend(b)}}catch(e){}return r}}
{const old=modal;modal=function(){document.querySelector('#modal>.pn')?.classList.remove('tk221-panel');return old.apply(this,arguments)}}
{const st=document.createElement('style');st.textContent=`#tk221 h2{margin:0 0 4px}#tk221 h3{margin:8px 0 4px;font-size:14px}#tk221 .tkp{font-size:12px;margin:4px 0;opacity:.92}
#tk221 .tkrow{display:flex;gap:8px;align-items:center}#tk221 .tkpick{flex:none;display:flex;align-items:center;justify-content:center;min-height:48px;min-width:110px;padding:6px 12px;border-radius:10px;border:2px solid #ffdfa0;background:#594263;color:#ffefc8;font-weight:700;position:relative;overflow:hidden;cursor:pointer}
#tk221 .tkpick input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}#tk221 .tkgrid{display:flex;flex-wrap:wrap;gap:6px;max-height:34vh;overflow:auto}#tk221 .tkgrid.small{max-height:22vh}
#tk221 .tkopt{display:flex;flex-direction:column;align-items:center;min-width:56px;min-height:44px;padding:4px 6px;border-radius:8px;border:2px solid #ffffff22;background:#2c2340;font-size:12px}#tk221 .tkopt.on{border-color:#ffdfa0;box-shadow:inset 0 -3px 0 #ffdfa0}
#tk221 .tkopt canvas{width:56px;height:56px;image-rendering:pixelated;pointer-events:none}#tk221 .tkopt span{pointer-events:none}#tk221 .tkb{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}#tk221 .tkb button{min-height:44px;padding:8px 12px}`;document.head.appendChild(st)}
TK.bootP=boot().catch(()=>{TK.booted=true});
})();
