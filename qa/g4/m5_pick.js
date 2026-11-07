// G4 M5 helper (run once in G4.0): lists every map's exits and its 1-tile passages in the real game (main), so the fixed door list
// qa/g4/m5-doors.json can be chosen with reasons. A 1-tile passage = a walkable tile whose two side neighbours are both solid
// (left+right → a north-south passage, or up+down → an east-west passage), the same rule as the G0 count (518 in 26/32 maps).
// For every exit it records: the tile, whether the tile or a tile next to it is a 1-tile passage, locked / boss rules, and a start tile
// 4 steps inside the map on the game's own path (findPath) so the walk is the same in every run.
//   BASE=http://127.0.0.1:8780 node qa/g4/m5_pick.js OUT.json
'use strict';
const fs = require('fs'), { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8780';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE || undefined });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, serviceWorkers: 'block', timezoneId: 'Asia/Bangkok' });
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); return (u.hostname === '127.0.0.1') ? r.continue() : r.abort(); });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForFunction(() => !document.getElementById('load'), null, { timeout: 90000 }); await p.waitForTimeout(800);
  await p.evaluate(() => { const d = Store.all(); d.slots = [newSave({ name: 'P', kid: 0, house: 1, age: 7 })]; d.cur = 0; Store.put(d); S = d.slots[0]; S.seen = { intro: 1 }; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; try { closeModal() } catch (e) {} });
  const ids = await p.evaluate(() => Object.keys(MAPS));
  const R = { maps: {}, narrowTotal: 0, mapsWithNarrow: 0, errors: errs };
  for (const id of ids) {
    const r = await p.evaluate(id => {
      try { goMap(id); P.path = P.act = null; } catch (e) { return { error: String(e).slice(0, 120) }; }
      if (!M || M.id !== id) return { error: 'landed on ' + (M && M.id) };
      const sol = (x, y) => x < 0 || y < 0 || x >= M.w || y >= M.h || M.SOLID.has(key(x, y));
      const narrow = new Set(); for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (!sol(x, y) && ((sol(x - 1, y) && sol(x + 1, y)) || (sol(x, y - 1) && sol(x, y + 1)))) narrow.add(x + ',' + y);
      const exits = (M.exits || []).map(e => { const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
        let nb = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (narrow.has((tx + dx) + ',' + (ty + dy))) nb = true;
        // a start tile 4 steps inside the map: breadth-first over walkable tiles from the exit tile (4 neighbours), the first tile at
        // distance 4 (else 3, else 2) that is not within 2 tiles of another exit and from which the game's own path reaches the exit
        const ok = (x, y) => !sol(x, y) && !blockedAt(M, x * T + T / 2, y * T + T / 2);
        const dist = new Map([[tx + ',' + ty, 0]]), q = [[tx, ty]];
        while (q.length) { const [x, y] = q.shift(), d = dist.get(x + ',' + y); if (d >= 4) continue;
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const k = (x + dx) + ',' + (y + dy); if (!dist.has(k) && ok(x + dx, y + dy)) { dist.set(k, d + 1); q.push([x + dx, y + dy]); } } }
        let start = null;
        for (const want of [4, 3, 2]) { for (const [k, d] of dist) { if (d !== want) continue; const [sx, sy] = k.split(',').map(Number), wx = sx * T + T / 2, wy = sy * T + T / 2;
            if ((M.exits || []).some(o => Math.hypot(o.x - wx, o.y - wy) < 2.5 * T)) continue; const pth = findPath(M, wx, wy, e.x, e.y); if (pth && pth.length) { start = [sx, sy, want]; break; } }
          if (start) break; }
        return { id: e.id, x: e.x, y: e.y, tile: [tx, ty], to: e.to, toExit: e.toExit, locked: !!e.locked, needBoss: !!e.needBoss, lockBoss: !!e.lockBoss, narrowAt: narrow.has(tx + ',' + ty), narrowNear: nb, start }; });
      // every 1-tile passage with its direction and a crossing (3 tiles before → 3 tiles after) when both ends are walkable
      const cells = [...narrow].map(k => { const [x, y] = k.split(',').map(Number), ns = sol(x - 1, y) && sol(x + 1, y);
        const a = ns ? [x, y - 3] : [x - 3, y], b = ns ? [x, y + 3] : [x + 3, y];
        const okc = ([cx, cy]) => !sol(cx, cy) && !blockedAt(M, cx * T + T / 2, cy * T + T / 2);
        const pth = okc(a) && okc(b) ? findPath(M, a[0] * T + T / 2, a[1] * T + T / 2, b[0] * T + T / 2, b[1] * T + T / 2) : null;
        const cross = !!pth;
        // T34-N1: the game's own path must go THROUGH the passage tile, not round it
        // the path is a list of turn points → walk the polyline from the start in steps of ≤ 4 px and look for the tile
        const passes = !!pth && (() => { const pts = [[a[0] * T + T / 2, a[1] * T + T / 2], ...pth];
          for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
            for (let j = 0; j <= n; j++) { const px = x0 + (x1 - x0) * j / n, py = y0 + (y1 - y0) * j / n; if (Math.floor(px / T) === x && Math.floor(py / T) === y) return true; } }
          return false; })();
        const nearExit = (M.exits || []).some(o => Math.hypot(o.x - (x * T + T / 2), o.y - (y * T + T / 2)) < 3 * T);
        return { x, y, dir: ns ? 'NS' : 'EW', cross: cross ? [a, b] : null, passes, nearExit }; });
      return { w: M.w, h: M.h, kind: M.kind || '', dark: DARK(), narrow: narrow.size, cells, exits };
    }, id);
    R.maps[id] = r; if (r.narrow) { R.narrowTotal += r.narrow; R.mapsWithNarrow++; }
    console.log(id, r.error || ('narrow ' + r.narrow + ' exits ' + r.exits.length + ' ' + r.exits.map(e => e.id + '>' + e.to + (e.narrowNear ? '*' : '') + (e.locked ? 'L' : '') + (e.start ? '' : '?')).join(' ')));
  }
  R.mapCount = ids.length;
  console.log(JSON.stringify({ maps: ids.length, narrowTotal: R.narrowTotal, mapsWithNarrow: R.mapsWithNarrow, errors: errs.length }));
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
