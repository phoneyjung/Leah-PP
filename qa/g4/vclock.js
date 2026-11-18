// G4.0 replay harness, part 1: the page-side init script (plan G4_0 §8.1).
// One virtual clock drives Date (constructor + Date.now), performance.now, requestAnimationFrame and all timers.
// Nothing moves unless the harness calls __VC.run(ms): timers fire in time order (ties by creation order), then one
// animation frame every 50/3 ms. Math.random is seeded. Every image / fetch / decode / bitmap / script load is counted
// as "pending" and run() stops before the next frame while one is pending, so the harness can wait for it in real time
// and every load lands between the same two virtual frames in every run. A draw recorder logs drawImage calls on the
// game canvas (#c) for one frame on request: the order is the y-sort order, the arguments + the full transform are the positions
// (fills, paths and text are not logged: the harness compares the canvas pixels themselves for those, cpNN.canvas.png).
// Used on main and on the G4 branch alike; it never edits the game.
// G4.2 (M5): a line gets a tag only when the harness sets window.__VC_TAG (replay.js with TAGP=1 / PATCH): '|P' = drawn inside drawPlayer,
// '|S' = the player's blurred shadow sheet. Unset (every M1 run) = the lines are exactly as before.
module.exports = ({ epoch, seed }) => `(()=>{
'use strict';
const EPOCH=${+epoch}, FRAME=50/3;
let vnow=0, seq=0, frames=0, errs=0, lastErr='';
const RD=Date;
const VDate=new Proxy(RD,{
  construct(t,a,nt){return Reflect.construct(t,a.length?a:[EPOCH+vnow],nt)},
  apply(){return new RD(EPOCH+vnow).toString()},
  get(t,k,r){if(k==='now')return ()=>EPOCH+Math.floor(vnow);return Reflect.get(t,k,r)}});
window.Date=VDate;
Object.defineProperty(Performance.prototype,'now',{value:function(){return vnow},configurable:true,writable:true});
{let s=${seed >>> 0};Math.random=function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
try{if(window.speechSynthesis)speechSynthesis.speak=function(){}}catch(e){}
// CSS transitions/animations run on real time and change compositing layers at real-time moments (seen in G4.0: 1–11 levels on the
// action button's edge after a transform transition) → zeroed for every run: they jump to their end state at once
document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.id='vc-noanim';
  st.textContent='*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important}';
  document.head.appendChild(st)});
const call=(f,a)=>{try{if(typeof f==='function')f.apply(window,a||[]);else (0,eval)(String(f))}catch(e){errs++;lastErr=String(e&&e.stack||e).slice(0,300);try{reportError(e)}catch(_){}}};
const T=new Map(),R=new Map();
const add=(fn,ms,args,iv)=>{const id=++seq;ms=Math.max(0,+ms||0);if(iv&&ms<1)ms=1;T.set(id,{at:vnow+ms,fn,args,iv:iv?ms:0,ord:id});return id};
window.setTimeout=function(fn,ms,...a){return add(fn,ms,a,false)};
window.setInterval=function(fn,ms,...a){return add(fn,ms,a,true)};
window.clearTimeout=window.clearInterval=function(id){T.delete(+id)};
window.requestAnimationFrame=function(fn){const id=++seq;R.set(id,fn);return id};
window.cancelAnimationFrame=function(id){R.delete(+id)};
// pending loads
let pend=0,pid=0;const PEND=new Map();
const track=desc=>{const id=++pid;pend++;PEND.set(id,String(desc).slice(0,90));let done=false;return ()=>{if(done)return;done=true;pend--;PEND.delete(id)}};
const watchEl=(el,desc)=>{const f=track(desc);el.addEventListener('load',f,{once:true});el.addEventListener('error',f,{once:true})};
for(const C of [HTMLImageElement,HTMLScriptElement]){const d=Object.getOwnPropertyDescriptor(C.prototype,'src');
  Object.defineProperty(C.prototype,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set(v){watchEl(this,(C===HTMLImageElement?'img ':'script ')+String(v).slice(0,80));d.set.call(this,v)}})}
const wrapP=(o,k,desc)=>{const f0=o[k];if(typeof f0!=='function')return;o[k]=function(...a){const done=track(desc(this,a));let p;try{p=f0.apply(this,a)}catch(e){done();throw e}Promise.resolve(p).then(done,done);return p}};
wrapP(window,'fetch',(t,a)=>'fetch '+String(a[0]&&a[0].url||a[0]));
wrapP(window,'createImageBitmap',()=>'createImageBitmap');
wrapP(HTMLImageElement.prototype,'decode',t=>'decode '+String(t.src).slice(0,60));
for(const k of ['json','text','blob','arrayBuffer'])wrapP(Response.prototype,k,t=>'body '+k+' '+t.url);
// draw recorder (one frame on request)
let REC=null;const IDS=new WeakMap();let nid=0;
const hs=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const imgId=im=>{if(!im)return 'null';if(im instanceof HTMLImageElement){const s=im.currentSrc||im.src||'';return s.startsWith('data:')?'data#'+hs(s)+':'+s.length:s.replace(/^.*\\//,'')}
  let v=IDS.get(im);if(!v){v=(im.constructor&&im.constructor.name||'x')+'#'+(++nid)+':'+(im.width|0)+'x'+(im.height|0);IDS.set(im,v)}return v};
const r2=x=>typeof x==='number'?Math.round(x*100)/100:x;
const DI=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(im,...a){if(REC&&this.canvas&&this.canvas.id==='c'){const m=this.getTransform();REC.push(imgId(im)+'|'+a.map(r2).join(',')+'|'+[m.a,m.b,m.c,m.d,m.e,m.f].map(r2).join(',')+'|'+r2(this.globalAlpha)+(typeof window.__VC_TAG==='function'?window.__VC_TAG(im):''))}return DI.call(this,im,...a)};
const flush=async()=>{for(let i=0;i<40;i++)await null};
async function frame(){const target=vnow+FRAME;
  for(;;){let bid=0,bt=null;for(const [id,t] of T)if(t.at<=target&&(!bt||t.at<bt.at||(t.at===bt.at&&t.ord<bt.ord))){bid=id;bt=t}
    if(!bt)break;if(bt.at>vnow)vnow=bt.at;if(bt.iv){bt.at+=bt.iv;bt.ord=++seq}else T.delete(bid);call(bt.fn,bt.args);await flush()}
  vnow=target;const cbs=[...R.values()];R.clear();for(const f of cbs)call(f,[vnow]);frames++;await flush()}
window.__VC={
  now:()=>vnow, frames:()=>frames, pending:()=>pend, pendingList:()=>[...PEND.values()], errors:()=>({n:errs,last:lastErr}),
  timers:()=>T.size, rafs:()=>R.size,
  // run up to nf frames (50/3 ms each); stops early (before the next frame) while a load is pending
  async run(nf){let n=0;while(n<nf){if(pend>0)break;await frame();n++}return {left:nf-n,pend,n}},
  async recFrame(){REC=[];await frame();const log=REC;REC=null;return {n:log.length,hash:hs(log.join('\\n')),log}}
};
})();`;
