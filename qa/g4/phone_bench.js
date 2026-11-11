// G4.6 (plan G4_0 §9 G4.6 · D-G4-7 "ค"): smoothness of character v2 on the owner's REAL phone, once, before "รับ G4".
// Added only to the private test copy of the game (built by qa/g4/build_phone_bench.py); the game in the repo never loads it.
// One button: a synthetic save of its own (this copy has its own storage — no real save is read or written, nothing goes online),
// then 3 fixed scenes of M6 (qa/g4/m6-scenes.json: town · farm · dark cave mouth with the lantern), the kid walking back and forth
// on the game's own path. In each scene 3 pairs, the flag switched in the same page (new character ON / OFF = the old drawing),
// order alternating (on-off · off-on · on-off): settle 1.5 s, count frames 5 s. Pins as M6: LITE off, eco off, fpsChecks 6.
// Per scene: ratio = the median of the 3 paired ratios ON ÷ OFF · pass = every scene ≥ 90 % (plan) and the checks below.
// Checks per run (so a frozen or empty screen cannot pass): the right map, the kid walked, ON = the new character drawn on ≥ 80 % of
// frames (C234.n.body) and state ready · OFF = drawn 0 times · lantern held exactly in the dark scene.
// Result: a table on screen and one line to copy and send back. Takes about 2 minutes; the screen must not be touched.
(function () {
  'use strict';
  const SCENES = [
    { id: 'S1', name: 'เมือง', map: 'capital', go: [5, 0], dark: false },
    { id: 'S2', name: 'ฟาร์ม', map: 'farm', go: [0, 4], dark: false },
    { id: 'S3', name: 'ปากถ้ำ (มืด · ถือตะเกียง)', map: 'cavemouth', go: [4, 0], dark: true },
  ];
  const Q = new URLSearchParams(location.search), SHORT = Q.has('short') || window.__benchShort;
  const SETTLE = SHORT ? 400 : 1500, MEAS = SHORT ? 1200 : 5000, PAIRS = 3, GATE = 0.90;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  const el = (tag, css, html) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; return e; };
  let box, pill, lock = null;
  const FONT = 'font:16px/1.45 system-ui,-apple-system,"Noto Sans Thai",sans-serif';
  function panel(html) {
    if (!box) { box = el('div', 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:#0b0816cc;padding:max(16px,env(safe-area-inset-left,0px));' + FONT + ';color:#f4ecd8');
      document.body.appendChild(box); }
    box.innerHTML = '<div style="max-width:620px;width:100%;max-height:92vh;overflow:auto;background:#1d1530;border:2px solid #c9a24a;border-radius:14px;padding:16px 18px;box-shadow:0 8px 30px #0008">' + html + '</div>';
    box.hidden = false; return box;
  }
  function btn(label, fn, main) {
    const b = el('button', 'min-height:48px;min-width:120px;margin:6px 8px 0 0;padding:8px 18px;border-radius:10px;border:2px solid #c9a24a;' + FONT + ';font-weight:700;cursor:pointer;' +
      (main ? 'background:#c9a24a;color:#1d1530' : 'background:#2b2142;color:#f4ecd8'), label); b.onclick = fn; return b;
  }
  function showPill(t) { if (!pill) { pill = el('div', 'position:fixed;top:calc(6px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:2147483000;pointer-events:none;background:#1d1530e6;border:1px solid #c9a24a;border-radius:20px;padding:4px 14px;' + FONT + ';font-size:14px;color:#f4ecd8'); document.body.appendChild(pill); }
    pill.textContent = t; pill.hidden = false; }
  function start() {
    const b = panel('<h2 style="margin:0 0 8px;font-size:20px">วัดความลื่นตัวละครรุ่น 2 (G4.6)</h2>' +
      '<p style="margin:0 0 6px">หน้านี้เป็น<b>สำเนาทดสอบ</b>ของเกม 2.43 · ใช้เซฟทดลองของมันเอง ไม่แตะเซฟของลีอา ไม่ต่อออนไลน์</p>' +
      '<p style="margin:0 0 6px">กดเริ่มแล้ว <b>วางมือถือแนวนอนนิ่ง ๆ ไม่ต้องแตะจอ</b> ประมาณ <b>2 นาที</b> · ตัวละครจะเดินเองใน 3 ฉาก สลับเปิด-ปิดตัวใหม่ 6 ครั้งต่อฉาก</p>' +
      '<p style="margin:0 0 10px;color:#d8c8a0">ผ่านเมื่อเปิดตัวใหม่แล้วยังลื่นอย่างน้อย 90 % ของตอนปิด ทุกฉาก</p>');
    const row = el('div'); row.appendChild(btn('เริ่มวัด', run, true)); b.firstChild.appendChild(row);
  }
  async function setFlag(on) {
    S.char2On = on; try { c234Sync(); } catch (e) {}
    if (on) { const t0 = performance.now(); while (C234.st !== 'ready' && C234.st !== 'failed' && performance.now() - t0 < 20000) await sleep(100); }
    return C234.st;
  }
  function pin() { try { LITE = false; fpsChecks = 6; S.eco = false; } catch (e) {} }
  function measure(ms) {
    return new Promise((r) => { let n = 0; const b0 = C234.n.body, w0 = window.__bw, t0 = performance.now(), held0 = [];
      const f = () => { n++; if (n % 10 === 0) held0.push(!!(DARK() && LKID())); if (performance.now() - t0 < ms) requestAnimationFrame(f);
        else { const dt = (performance.now() - t0) / 1000; r({ fps: n / dt, frames: n, body: C234.n.body - b0, walked: Math.round(window.__bw - w0), map: M && M.id, st: C234.st, held: held0.length ? held0.every(Boolean) : !!(DARK() && LKID()), heldAny: held0.some(Boolean) }); } };
      requestAnimationFrame(f); });
  }
  async function run() {
    box.hidden = true; try { lock = await navigator.wakeLock.request('screen'); } catch (e) {}
    const runs = [];
    try {
      const d = Store.all(); d.slots = [Object.assign(newSave({ name: 'ทดสอบ', kid: 0, house: 1, age: 7 }), { gender194: 'f', hc: 3, char2On: false })]; d.cur = 0; Store.put(d);
      S = d.slots[0]; S.seen = { intro: 1 }; S.snd = S.mus = false; startGame();
      document.querySelectorAll('#cr,#title,#picker').forEach((e) => e.classList.add('hide')); DLG = null; try { closeModal(); } catch (e) {}
      for (let si = 0; si < SCENES.length; si++) {
        const sc = SCENES[si]; showPill('ฉาก ' + (si + 1) + '/3 ' + sc.name + ' · เตรียม…');
        goMap(sc.map); P.path = P.act = null; DLG = null; try { closeModal(); } catch (e) {} pin();
        const a = [P.x, P.y], b = [P.x + sc.go[0] * T, P.y + sc.go[1] * T]; let k = 0, lx = P.x, ly = P.y; window.__bw = 0; clearInterval(window.__bwk);
        window.__bwk = setInterval(() => { if (!P.path || !P.path.length) { k ^= 1; const g = k ? b : a; P.path = findPath(M, P.x, P.y, g[0], g[1]) || [[g[0], g[1]]]; }
          window.__bw += Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y; }, 100);
        for (let pi = 0; pi < PAIRS; pi++) for (const on of (pi % 2 ? [false, true] : [true, false])) {
          showPill('ฉาก ' + (si + 1) + '/3 ' + sc.name + ' · คู่ ' + (pi + 1) + '/3 · ตัวใหม่ ' + (on ? 'เปิด' : 'ปิด') + ' · อย่าแตะจอ');
          const st = await setFlag(on); pin(); DLG = null; await sleep(SETTLE); pin();
          const m = await measure(MEAS); m.scene = sc.id; m.on = on; m.pair = pi; m.stSet = st; runs.push(m);
        }
        clearInterval(window.__bwk);
      }
    } catch (e) { runs.err = String(e && e.message || e).slice(0, 200); }
    try { if (lock) lock.release(); } catch (e) {}
    if (pill) pill.hidden = true; report(runs);
  }
  function report(runs) {
    const rows = SCENES.map((sc) => {
      const rs = runs.filter((r) => r.scene === sc.id), on = rs.filter((r) => r.on), off = rs.filter((r) => !r.on);
      const pairs = [0, 1, 2].map((i) => { const a = on.find((r) => r.pair === i), b = off.find((r) => r.pair === i); return a && b && b.fps > 0 ? a.fps / b.fps : null; }).filter((x) => x !== null);
      const ok = rs.length === 6 && rs.every((r) => r.map === sc.map && r.walked > 20 && r.held === sc.dark && (sc.dark || !r.heldAny)) &&
        on.every((r) => r.st === 'ready' && r.body >= 0.8 * r.frames) && off.every((r) => r.body === 0);
      const ratio = pairs.length === 3 ? med(pairs) : null;
      return { sc, ratio, pairs, ok, fpsOn: on.length ? med(on.map((r) => r.fps)) : 0, fpsOff: off.length ? med(off.map((r) => r.fps)) : 0,
        why: !rs.length ? 'ไม่ได้วัด' : rs.some((r) => r.map !== sc.map) ? 'แผนที่ผิด' : rs.some((r) => r.walked <= 20) ? 'ตัวไม่เดิน' : on.some((r) => r.st !== 'ready') ? 'ตัวใหม่ไม่พร้อม' : on.some((r) => r.body < 0.8 * r.frames) ? 'ตัวใหม่วาดไม่ครบ' : off.some((r) => r.body) ? 'ปิดแล้วยังวาดตัวใหม่' : rs.some((r) => r.held !== sc.dark) ? 'ตะเกียงไม่ตรง' : '' };
    });
    const pass = !runs.err && rows.every((r) => r.ok && r.ratio !== null && r.ratio >= GATE);
    const pct = (x) => (x === null ? '–' : Math.round(x * 100) + ' %');
    const scr = Math.round(screen.width) + '×' + Math.round(screen.height) + ' @' + (Math.round(devicePixelRatio * 100) / 100);
    const ua = (navigator.userAgent.match(/Android[^;)]*|iPhone OS [\d_]+|iPad|Chrome\/[\d.]+|Version\/[\d.]+ Mobile/g) || []).join(' ');
    const line = 'G4.6 มือถือจริง · เกม ' + (typeof VERSION === 'string' ? VERSION.replace('Lantern Academy ', '') : '?') + ' · ' +
      rows.map((r) => r.sc.name.split(' ')[0] + ' ' + pct(r.ratio)).join(' · ') + ' → ' + (pass ? 'ผ่าน' : 'ไม่ผ่าน') + ' (เกณฑ์ ≥ 90 %) · fps เปิด/ปิด ' +
      rows.map((r) => r.fpsOn.toFixed(1) + '/' + r.fpsOff.toFixed(1)).join(' · ') + ' · ตรวจ ' + rows.map((r) => (r.ok ? '✓' : '✗' + r.why)).join(' ') +
      ' · ' + scr + ' · ' + ua + (runs.err ? ' · error ' + runs.err : '') + (SHORT ? ' · (รอบสั้นทดสอบ)' : '');
    window.__benchResult = { pass, rows: rows.map((r) => ({ id: r.sc.id, ratio: r.ratio, pairs: r.pairs, ok: r.ok, why: r.why, fpsOn: r.fpsOn, fpsOff: r.fpsOff })), runs, line };
    const tr = rows.map((r) => '<tr><td style="padding:4px 8px">' + r.sc.name + '</td><td style="padding:4px 8px;text-align:right">' + r.fpsOn.toFixed(1) + '</td><td style="padding:4px 8px;text-align:right">' + r.fpsOff.toFixed(1) +
      '</td><td style="padding:4px 8px;text-align:right;font-weight:700">' + pct(r.ratio) + '</td><td style="padding:4px 8px">' + (r.ok ? '✓' : '✗ ' + r.why) + '</td></tr>').join('');
    const b = panel('<h2 style="margin:0 0 8px;font-size:20px">ผล: ' + (pass ? '<span style="color:#8fd18f">ผ่าน</span>' : '<span style="color:#ff9a8a">ไม่ผ่าน</span>') + '</h2>' +
      '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:15px"><tr style="color:#d8c8a0"><th style="text-align:left;padding:4px 8px">ฉาก</th><th style="padding:4px 8px">fps เปิด</th><th style="padding:4px 8px">fps ปิด</th><th style="padding:4px 8px">เปิด ÷ ปิด</th><th style="padding:4px 8px">ตรวจ</th></tr>' + tr + '</table></div>' +
      '<p style="margin:10px 0 4px">กด "คัดลอกผล" แล้วส่งข้อความนี้กลับมาให้ Claude:</p><textarea readonly style="width:100%;min-height:96px;box-sizing:border-box;background:#120d20;color:#f4ecd8;border:1px solid #6b5a8a;border-radius:8px;padding:8px;font-size:13px">' + line.replace(/</g, '&lt;') + '</textarea>');
    const row = el('div'), msg = el('span', 'margin-left:6px;color:#8fd18f');
    row.appendChild(btn('คัดลอกผล', () => { const ta = b.querySelector('textarea'); const done = () => { msg.textContent = 'คัดลอกแล้ว'; };
      try { navigator.clipboard.writeText(line).then(done, () => { ta.focus(); ta.select(); msg.textContent = 'เลือกข้อความแล้ว กดคัดลอกเอง'; }); } catch (e) { ta.focus(); ta.select(); } }, true));
    row.appendChild(btn('วัดอีกครั้ง', () => location.reload())); row.appendChild(msg); b.firstChild.appendChild(row);
  }
  const boot = () => { if (document.getElementById('load') || typeof Store !== 'object' || typeof C234 !== 'object') return setTimeout(boot, 300); start(); };
  boot();
})();
