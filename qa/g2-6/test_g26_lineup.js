// G2.6 A8 page check (Claude · 1 Nov 2569): "find yourself" on the portrait Pilot page. The owner + Leah do the real test (<= 3 s);
// this checks the page is fair and works: 20 shuffles -> the player's colours appear exactly once, the 4 houses are all different, no friend has
// the player's hair, positions vary; a REAL tap (touch) on the player's kid says "right" with a time, a tap on a friend only says "friend";
// buttons >= 44 CSS px; each kid drawn at a whole scale; JS errors 0. Phone 844x390 @2.625 and iPad 1180x820 @2.
// usage: PORT=<server at repo root> node qa/g2-6/test_g26_lineup.js OUT_DIR
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const PORT = process.env.PORT || 8797, OUT = process.argv[2] || '/tmp/g26-lineup'; fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + PORT + '/pilot-g2-portrait.html?gm';
(async () => {
  const b = await chromium.launch(); const R = []; let ok = true;
  for (const [name, w, h, dpr] of [['phone', 844, 390, 2.625], ['iPad', 1180, 820, 2]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, locale: 'th-TH' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL); await p.waitForFunction('window.PT&&PT.S.ready'); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /ผม.*Green/ }).tap(); await p.getByRole('button', { name: /บ้าน.*Sun/ }).tap();     // the player picks colours
    await p.locator('#luOpen').tap(); await p.waitForTimeout(300);
    const fair = await p.evaluate(() => { const me = JSON.stringify(PT.S.opts), pos = new Set(); let once = 0, houses = 0, hairClash = 0;
      for (let i = 0; i < 20; i++) { PT.luNew(); const s = PT.LU.sets; pos.add(PT.LU.me);
        if (s.filter(o => JSON.stringify(o) === me).length === 1 && JSON.stringify(s[PT.LU.me]) === me) once++;
        if (new Set(s.map(o => o.house)).size === 4) houses++;
        hairClash += s.filter((o, j) => j !== PT.LU.me && o.hair === PT.S.opts.hair).length; }
      return { shuffles: 20, me_once: once, houses_all_different: houses, friend_with_my_hair: hairClash, positions_seen: pos.size }; });
    // real taps: first a friend, then the player
    const geo = await p.evaluate(() => { const v = document.getElementById('luView'), q = v.getBoundingClientRect(), L = PT.LU, d = devicePixelRatio;
      const c = i => [q.left + (L.x0 + i * (96 * L.k + L.gap) + 48 * L.k) / d, q.top + (L.y0 + 60 * L.k) / d]; return { me: PT.LU.me, k: L.k, friend: c((PT.LU.me + 1) % 4), mine: c(PT.LU.me) }; });
    await p.waitForTimeout(400);
    await p.touchscreen.tap(...geo.friend); const msgFriend = await p.locator('#luMsg').textContent();
    await p.touchscreen.tap(...geo.mine); const msgMine = await p.locator('#luMsg').textContent();
    const hist = await p.evaluate(() => PT.LU.hist);
    const btn = await p.evaluate(() => ['luAgain', 'luBack'].map(id => { const q = document.getElementById(id).getBoundingClientRect(); return [id, +q.width.toFixed(0), +q.height.toFixed(0)]; }));
    await p.screenshot({ path: path.join(OUT, 'a8-' + name + '.png') });
    await p.locator('#luBack').tap(); await p.waitForTimeout(200); const closed = await p.evaluate(() => !document.getElementById('lu').classList.contains('on'));
    const r = { screen: name, fair, kid_scale: geo.k, msgFriend, msgMine, hist, buttons: btn, closed, errors: errs };
    r.pass = fair.me_once === 20 && fair.houses_all_different === 20 && fair.friend_with_my_hair === 0 && fair.positions_seen >= 3 && /เพื่อน/.test(msgFriend) && /ถูกแล้ว/.test(msgMine)
      && hist.length === 2 && hist[0].ok === false && hist[1].ok === true && btn.every(([, bw, bh]) => bw >= 44 && bh >= 44) && closed && errs.length === 0 && Number.isInteger(geo.k);
    ok = ok && r.pass; R.push(r); console.log(name, r.pass ? 'PASS' : 'FAIL', JSON.stringify({ fair, k: geo.k, msgFriend, msgMine, t: hist[1] && hist[1].s, btn, closed, errors: errs.length }));
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'a8.json'), JSON.stringify({ pass: ok, rows: R }, null, 1)); await b.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
