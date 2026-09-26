import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE_JS=os.environ.get('THREE_JS',os.path.join(ROOT,'package/build/three.min.js'))
BASE=os.environ.get('BASE','http://localhost:'+os.environ.get('PORT','8799')+'/')
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await (await br.new_context(viewport={'width':1180,'height':820})).new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def route(r):
            u=r.request.url
            if 'three.min.js' in u: return await r.fulfill(path=THREE_JS)
            if u.startswith('http://localhost'): return await r.continue_()
            return await r.abort()
        await pg.add_init_script('/*AUTOSKIP*/setInterval(()=>{try{while(window.PP&&PP.dlgOpen)PP.nextLine()}catch(e){}},30)');await pg.route('**/*',route)
        await pg.goto(BASE+'index.html');await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_timeout(900)
        # ---- 1. layout statistics over 300 seeds
        stats=await pg.evaluate("""(()=>{const C=PP.CAVE,W=C.W,H=C.H,wall=(x,z)=>x<0||z<0||x>=W||z>=H||C.rows[z][x]==='#';
          const sx=Math.floor(C.start.x),sz=Math.floor(C.start.z),reach=new Set([sx+','+sz]),q=[[sx,sz]];
          while(q.length){const [x,z]=q.shift();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+a)+','+(z+b);if(!wall(x+a,z+b)&&!reach.has(k)){reach.add(k);q.push([x+a,z+b])}}}
          let bad=0,minSp=99,layouts=new Set(),overlap=0,prev=null,counts=[];
          for(let s=1;s<=300;s++){PP.layoutCave(s*2654435761>>>0);const cr=C.objs.filter(o=>o.type==='crystal'),dg=C.objs.filter(o=>o.type==='dig');counts.push(cr.length+'/'+dg.length);
            const all=[...cr,...dg];for(const o of all){if(wall(Math.floor(o.x),Math.floor(o.z))||!reach.has(Math.floor(o.x)+','+Math.floor(o.z)))bad++}
            const cells=new Set(all.map(o=>Math.floor(o.x)+','+Math.floor(o.z)));if(cells.size!==all.length)bad++;
            for(let i=0;i<cr.length;i++)for(let j=i+1;j<cr.length;j++)minSp=Math.min(minSp,Math.hypot(cr[i].x-cr[j].x,cr[i].z-cr[j].z));
            const key=cr.map(o=>o.x+','+o.z).sort().join('|');layouts.add(key);
            if(prev){overlap+=cr.filter(o=>prev.has(o.x+','+o.z)).length}prev=new Set(cr.map(o=>o.x+','+o.z))}
          return {hiddenSpots:C.hidden.length,freeCells:C.free.length,bad,minSpacing:+minSp.toFixed(2),distinct:layouts.size,avgSameAsLastRound:+(overlap/299).toFixed(2),counts:[...new Set(counts)]}})()""")
        print('layout',stats)
        # ---- 2. same layout after reload, new layout after clearing the cave
        await pg.click('#bStart');await pg.wait_for_timeout(1800);await pg.evaluate('while(PP.dlgOpen)PP.nextLine()')
        await pg.evaluate("PP.goScene('cave','start',true)")
        a=await pg.evaluate("PP.CRYS.map(o=>o.x+','+o.z).join(' ')")
        await pg.reload();await pg.wait_for_timeout(900);await pg.click('#rWho .char >> nth=0');await pg.wait_for_timeout(1500)
        b=await pg.evaluate("PP.CRYS.map(o=>o.x+','+o.z).join(' ')")
        await pg.evaluate("PP.command('clear',{});PP.goScene('cave','start',true)")
        c=await pg.evaluate("PP.CRYS.map(o=>o.x+','+o.z).join(' ')")
        print('same after reload',a==b,'| changed after clearing',a!=c)
        # ---- 3. adaptive difficulty
        res=await pg.evaluate("""(()=>{const S=PP.S,avg=()=>{let s=0;for(let i=0;i<60;i++){const q=PP.QB.pick(S.asked,S);s+=PP.QB.diff(q)}return +(s/60).toFixed(2)};
          S.skill=0;S.wrong=[];const base=avg();
          for(let i=0;i<10;i++)PP.command('answer',{qid:'x'+i,correct:true,target:{type:'none'}});const hi=avg(),skHi=S.skill;
          for(let i=0;i<15;i++)PP.command('answer',{qid:'y'+i,correct:false,target:{type:'none'}});const lo=avg(),skLo=S.skill;
          S.skill=0;S.wrong=[];const q0=PP.QB.all[5];PP.command('answer',{qid:q0.id,correct:false,target:{type:'none'}});
          let back=0;for(let i=0;i<200;i++){if(PP.QB.pick(S.asked.concat(Array(10).fill('z')),S).id===q0.id)back++}
          PP.command('answer',{qid:q0.id,correct:true,target:{type:'none'}});const cleared=!S.wrong.includes(q0.id);
          return {age:S.profile.age,ages:[...new Set(PP.QB.all.map(q=>q.age))].sort(),pool:PP.QB.all.length,avgDifficulty:{start:base,after10right:hi,after15wrong:lo},skill:{hi:skHi,lo:skLo},missedComesBack:back+'/200',removedWhenRight:cleared}})()""")
        print('adaptive',res)
        # ---- 4. markers: near crystal visible, far hidden
        m=await pg.evaluate("""(async()=>{const o=PP.CRYS[0];const mk=PP.marks.find(x=>x.obj===o);
          PP.player.x=PP.CAVE.start.x;PP.player.z=PP.CAVE.start.z;await new Promise(r=>setTimeout(r,500));const far=mk.sp.visible;
          const cells=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[o.x+a,o.z+b]).filter(([x,z])=>PP.CAVE.rows[Math.floor(z)][Math.floor(x)]!=='#');
          PP.player.x=cells[0][0];PP.player.z=cells[0][1];await new Promise(r=>setTimeout(r,500));const near=mk.sp.visible;return{far,near,total:PP.marks.length}})()""")
        print('crystal marker far/near',m)
        await pg.screenshot(path='m_cave.png')
        await pg.evaluate("PP.goScene('village','fromCave',true)");await pg.wait_for_timeout(500)
        v=await pg.evaluate("PP.marks.map(m=>m.sp.visible)");print('village markers visible',v)
        await pg.screenshot(path='m_village.png')
        print('errors',errs);await br.close()
asyncio.run(main())
