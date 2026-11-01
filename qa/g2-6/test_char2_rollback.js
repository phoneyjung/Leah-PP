// G2.6 A4 rollback (Claude · 1 Nov 2569): the REAL game 2.33 (index.html, unchanged) loads saves that already carry S.char2
// (as a future version would write them), the player plays and the game saves -> S.char2 must still be there, byte for byte,
// in the played slot AND in the other slot. Runs in a throw-away browser profile (never the owner's or Leah's saves).
// usage: PORT=<port of a server at the repo root> node qa/g2-6/test_char2_rollback.js [OUT.json]     exit 0 = pass
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8790, URL = 'http://127.0.0.1:' + PORT + '/?gm';
const C2 = (hair, iris, skin) => ({ v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: { hair: 'kid4', eyes: 'kid4', outfit: 'kid4', head: null, face_acc: null, back: null }, color: { hair, iris, skin }, from: 'pd219' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1180, height: 820 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL, { waitUntil: 'load', timeout: 60000 }); await sleep(2500);
  // 1) make two ordinary slots with the game's own GM helper, then add S.char2 to both IN THE STORED COPY (test data)
  const seeded = await p.evaluate((c2) => {
    if (!Store.all().slots.length) gmMakeSlot();                     // gmMakeSlot reuses the GM slot, so the 2nd slot = a copy with its own sid
    const d = JSON.parse(localStorage.getItem('leahpp2d-slots'));
    if (d.slots.length < 2) { const c = JSON.parse(JSON.stringify(d.slots[0])); c.sid = String(d.slots[0].sid || 's') + '-b'; delete c.gm; d.slots.push(c); }
    d.slots[0].char2 = c2[0]; d.slots[1].char2 = c2[1]; d.cur = 1;
    localStorage.setItem('leahpp2d-slots', JSON.stringify(d));
    return { slots: d.slots.length, sids: d.slots.map(s => s.sid || null), c2: d.slots.map(s => s.char2) };
  }, [C2('pink', 'amber', 'deep'), C2('green', 'blue', 'light')]);
  // 2) reload: game 2.33 reads the saves from scratch, starts slot 1 the way the suites do, the player walks, then a real save
  await p.reload({ waitUntil: 'load' }); await sleep(2500);
  await p.evaluate(() => { S = Store.all().slots[Store.all().cur]; S.snd = S.mus = false; S.seen = { intro: 1 }; ensureDaily(); S.daily.seen = 1; startGame();
    document.querySelectorAll('#cr,#title,#picker').forEach(e => e.classList.add('hide')); DLG = null; $('dlg').classList.add('hide'); closeModal(); });
  await sleep(1500);
  await p.keyboard.down('ArrowRight'); await sleep(600); await p.keyboard.up('ArrowRight');           // play a little
  await p.evaluate(() => openSettings()); await sleep(400);
  const before = await p.evaluate(() => localStorage.getItem('leahpp2d-slots'));
  await p.click('#sOn'); await sleep(500);                                                              // real button: sound toggle -> save()
  const after = await p.evaluate(() => localStorage.getItem('leahpp2d-slots'));
  const d = JSON.parse(after);
  const res = {
    seeded, saved: after !== before,
    played_slot_char2_kept: JSON.stringify(d.slots[1].char2) === JSON.stringify(seeded.c2[1]),
    other_slot_char2_kept: JSON.stringify(d.slots[0].char2) === JSON.stringify(seeded.c2[0]),
    sids_kept: JSON.stringify(d.slots.map(s => s.sid || null)) === JSON.stringify(seeded.sids),
    snd_changed_by_click: d.slots[1].snd === true, errors: errs,
  };
  res.pass = res.saved && res.played_slot_char2_kept && res.other_slot_char2_kept && res.sids_kept && res.snd_changed_by_click && errs.length === 0;
  console.log(JSON.stringify(res)); if (process.argv[2]) require('fs').writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
  await b.close(); process.exit(res.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
