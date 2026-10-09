// Version 1.77 (Claude, on the owner's decision of 8 Oct): a child goes on to the next age's questions only after finishing the
// questions of their own age, questions answered right are never asked again, and one answered wrong comes back later until it is
// answered right (DESIGN_QUESTION_ORDER.md).
// Part A asks the game's own chooser thousands of times and records each answer through the game's own qResult: fast enough to walk
// through a whole age (843 questions). Part B goes through the real question window with real taps on the answer buttons, to prove the
// window uses that chooser and records the answers. Part C plays with the question files missing.
// The clock is moved with a Date.now offset (questions answered wrong wait 10 minutes). Prints one JSON line, then `errors N`.
// Run: PORT=8775 CHROME_EXE=/path/to/chromium node test_177_question_order.js   (serve the repo root first)
// Version 1.76 gives about 38 errors (the count moves a little: the old chooser is random); 1.77 must give errors 0.
const fs = require('node:fs'), path = require('node:path'), puppeteer = require('puppeteer');
const out = process.env.OUT_DIR || '/tmp/leah-177-question-order'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:' + (process.env.PORT || 8775) + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms)), errors = [], results = {};
const fail = m => { errors.push(m); };

// a brand-new player made with real taps in the creator (?rank=1: no automation shortcuts)
async function player(browser, age, opts = {}) {
  const ctx = await browser.createBrowserContext(), pg = await ctx.newPage();
  pg.on('pageerror', e => fail('page error: ' + e.message));
  await pg.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await pg.setBypassServiceWorker(true);
  await pg.evaluateOnNewDocument(() => { const real = Date.now.bind(Date); window.__skew = 0; Date.now = () => real() + window.__skew; });
  if (opts.noFiles) { await pg.setRequestInterception(true); pg.on('request', r => { if (/\/q-[a-z]+-\d+\.json/.test(r.url())) r.respond({ status: 404, body: '' }); else r.continue(); }); }
  await pg.goto(base + '?rank=1', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('load'), { timeout: 90000 }); await sleep(2500);
  const press = async el => { await el.scrollIntoView(); const r = await el.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(320); };
  { const gb = await pg.$('#cg194 [data-g="f"]'); if (gb) { await press(gb); await sleep(400); } } const ages = await pg.$$('#ca button'); await press(age >= 18 ? ages[ages.length - 1] : ages[age - 6]); await press(await pg.$('#cgo')); await sleep(2300);
  for (let k = 0; k < 4; k++) { for (let i = 0; i < 15 && await pg.evaluate(() => !!DLG); i++) await press(await pg.$('#dlg')); await pg.evaluate(() => { try { closeModal(); } catch (e) { } PAUSE = false; }); await sleep(500); }
  if (!opts.noFiles) await pg.waitForFunction(() => QBANK.length > 2000, { timeout: 60000 });
  await sleep(800);
  await pg.evaluate(() => { const A = window.__a177 = {};
    A.reset = (recent) => { S.qr = {}; S.qd = {}; S.qs = {}; S.recent = recent || []; S.subOff = {}; window.__skew = 0; };
    // ask n questions; answer(q, i) says whether the first choice is right (null = do not answer)
    A.run = (n, answer) => { const seq = []; for (let i = 0; i < n; i++) { const q = pickQuestion(); const a = answer ? answer(q, i) : null; seq.push([q.id, q.age, q.subject, q.level || 1, q._review ? 1 : 0]); if (a !== null) qResult(q, !!a); } return seq; };
    A.count = () => { const c = {}; for (const q of QBANK) { if (!q[LANG] || (LANG === 'en' && q.subject === 'thai')) continue; const k = q.subject + ':' + q.age; c[k] = (c[k] || 0) + 1; } return c; };
  });
  return { ctx, pg };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_EXE || undefined, args: ['--no-sandbox'] });
  try {
    // ================= Part A: the chooser, at scale =================
    { const { ctx, pg } = await player(browser, 7), R = results.chooser = {};
      R.version = await pg.evaluate(() => VERSION); R.bank = await pg.evaluate(() => QBANK.length);
      // A1: a 7-year-old who answers everything right: no repeats; age 8 of a subject only after all of its age 7; age 6 only after 7 and 8
      { const r = await pg.evaluate(() => { const A = __a177; A.reset(); const c = A.count(), subs = [...new Set(Object.keys(c).map(k => k.split(':')[0]))];
          const n7 = subs.reduce((s, k) => s + (c[k + ':7'] || 0), 0), n8 = subs.reduce((s, k) => s + (c[k + ':8'] || 0), 0), seq = A.run(n7 + n8 + 80, () => true);
          const ids = seq.map(x => x[0]), up = ids.slice(0, n7 + n8), per = {};
          for (const k of subs) { const mine = seq.map((x, i) => [x, i]).filter(([x]) => x[2] === k), first8 = mine.findIndex(([x]) => x[1] === 8); const first6 = mine.findIndex(([x]) => x[1] === 6), upTo6 = first6 < 0 ? mine : mine.slice(0, first6); per[k] = { age7inBank: c[k + ':7'] || 0, age7beforeFirst8: first8 < 0 ? mine.filter(([x]) => x[1] === 7).length : mine.slice(0, first8).filter(([x]) => x[1] === 7).length, otherAgesBeforeFirst8: (first8 < 0 ? mine : mine.slice(0, first8)).filter(([x]) => x[1] !== 7).length, got8: first8 >= 0,
              age8inBank: c[k + ':8'] || 0, age8beforeFirst6: upTo6.filter(([x]) => x[1] === 8).length, got6: first6 >= 0, age7or8afterFirst6: first6 < 0 ? 0 : mine.slice(first6).filter(([x]) => x[1] !== 6).length }; }
          return { n7, n8, asked: seq.length, repeatsInOwnAndNext: up.length - new Set(up).size, first300Repeats: 300 - new Set(ids.slice(0, 300)).size, agesInFirst300: [...new Set(seq.slice(0, 300).map(x => x[1]))], repeatsInWholeRun: seq.length - new Set(ids).size, per }; });
        R['answers everything right'] = r;
        if (r.first300Repeats) fail('a 7-year-old answering right: ' + r.first300Repeats + ' repeated questions in the first 300'); if (r.agesInFirst300.join() !== '7') fail('a 7-year-old: the first 300 questions came from ages ' + r.agesInFirst300.join(' '));
        if (r.repeatsInOwnAndNext) fail('a 7-year-old answering right: ' + r.repeatsInOwnAndNext + ' repeats in the first ' + (r.n7 + r.n8) + ' questions'); if (r.repeatsInWholeRun) fail(r.repeatsInWholeRun + ' repeats in the whole run of ' + r.asked);
        for (const [k, v] of Object.entries(r.per)) { if (!v.got8) fail(k + ': never reached age 8 after finishing age 7'); if (v.age7beforeFirst8 !== v.age7inBank) fail(k + ': the first age-8 question came after ' + v.age7beforeFirst8 + ' of ' + v.age7inBank + ' age-7 questions'); if (v.otherAgesBeforeFirst8) fail(k + ': ' + v.otherAgesBeforeFirst8 + ' questions of another age before age 7 was finished');
          if (v.got6 && v.age8beforeFirst6 !== v.age8inBank) fail(k + ': the first age-6 question came after ' + v.age8beforeFirst6 + ' of ' + v.age8inBank + ' age-8 questions'); if (v.age7or8afterFirst6) fail(k + ': ' + v.age7or8afterFirst6 + ' questions of ages 7 or 8 after the subject had moved down to age 6'); }
        if (!Object.values(r.per).some(v => v.got6)) fail('no subject went on to the unseen age-6 questions after finishing ages 7 and 8');
      }
      // A2: answered wrong: not back within 10 minutes, back after that (marked as a review, never twice running), and gone once answered right
      { const r = await pg.evaluate(() => { const A = __a177; A.reset(); const wrong = A.run(12, () => false).map(x => x[0]), W = new Set(wrong);
          const soon = A.run(40, () => true), soonBack = soon.filter(x => W.has(x[0])).length; window.__skew += 11 * 60000;
          const later = A.run(260, () => true), back = later.filter(x => W.has(x[0])), marked = back.filter(x => x[4] === 1).length; let adjacent = 0; const all = wrong.concat(soon.map(x => x[0]), later.map(x => x[0])); for (let i = 1; i < all.length; i++) if (all[i] === all[i - 1]) adjacent++;
          const after = A.run(300, () => true).filter(x => W.has(x[0])).length; window.__skew += 2 * 864e5; const nextDays = A.run(300, () => true), seen = new Set(all.concat(nextDays.map(x => x[0])));
          return { wrong: wrong.length, backWithin10Min: soonBack, backAfter10Min: new Set(back.map(x => x[0])).size, timesBack: back.length, markedReview: marked, adjacent, backAgainAfterRight: after, repeatsTwoDaysLater: all.length + nextDays.length - seen.size - back.length, agesServedInFirst312: [...new Set(soon.concat(later).map(x => x[1]))] }; });
        R['answers wrong then right'] = r;
        if (r.backWithin10Min) fail(r.backWithin10Min + ' questions answered wrong came back within 10 minutes'); if (r.backAfter10Min !== r.wrong) fail('only ' + r.backAfter10Min + ' of ' + r.wrong + ' questions answered wrong came back after 10 minutes'); if (r.timesBack !== r.wrong) fail('questions answered wrong came back ' + r.timesBack + ' times, expected once each (' + r.wrong + ')');
        if (r.markedReview !== r.timesBack) fail('only ' + r.markedReview + ' of ' + r.timesBack + ' returning questions were marked as a review'); if (r.adjacent) fail(r.adjacent + ' questions were asked twice running'); if (r.backAgainAfterRight) fail(r.backAgainAfterRight + ' questions came back after being answered right');
        if (r.repeatsTwoDaysLater) fail(r.repeatsTwoDaysLater + ' questions answered right were asked again within two days'); if (r.agesServedInFirst312.join() !== '7') fail('with age 7 unfinished, questions came from ages ' + r.agesServedInFirst312.join(' ')); }
      // A3: a child who is struggling gets the easiest level of their age first; a child doing well is not held to it
      { const r = await pg.evaluate(() => { const A = __a177, low = {}; for (const q of QBANK) if (q.age === 7 && q.th) low[q.subject] = Math.min(low[q.subject] || 9, q.level || 1);
          A.reset([0, 0, 0, 0, 1, 0, 0, 0, 0, 0]); const weak = A.run(250, () => null); A.reset([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]); const strong = A.run(250, () => null);
          return { weakAboveEasiest: weak.filter(x => x[3] !== low[x[2]]).length, weakAges: [...new Set(weak.map(x => x[1]))], strongAboveEasiest: strong.filter(x => x[3] !== low[x[2]]).length, strongAges: [...new Set(strong.map(x => x[1]))], distinctOf250: new Set(strong.map(x => x[0])).size }; });
        R['struggling and doing well'] = r; if (r.weakAboveEasiest) fail('a struggling child got ' + r.weakAboveEasiest + ' questions above the easiest level of their age'); if (r.weakAges.join() !== '7') fail('a struggling 7-year-old got ages ' + r.weakAges.join(' '));
        if (!r.strongAboveEasiest) fail('a child doing well never got a question above the easiest level'); if (r.strongAges.join() !== '7') fail('a 7-year-old doing well got ages ' + r.strongAges.join(' ') + ' with age 7 unfinished'); }
      // A4: an old save: box 1 and above = the last answer was right (never again); box 0 = wrong (comes back)
      { const r = await pg.evaluate(() => { const A = __a177; A.reset(); delete S.qd; const m = QBANK.filter(q => q.age === 7 && q.subject === 'math').slice(0, 4), past = Date.now() - 864e5;   // a save from 1.76 has no S.qd
          S.qr[m[0].id] = { box: 2, n: 1, due: past }; S.qr[m[1].id] = { box: 1, n: 2, due: past }; S.qr[m[2].id] = { box: 3, n: 3, due: past }; S.qr[m[3].id] = { box: 0, n: 1, due: past };
          const seq = A.run(500, () => true), n = id => seq.filter(x => x[0] === id).length; return { box2: n(m[0].id), box1: n(m[1].id), box3: n(m[2].id), box0: n(m[3].id) }; });
        R['old save'] = r; if (r.box2 || r.box1 || r.box3) fail('an old save: questions already answered right were asked again (box 2: ' + r.box2 + ', box 1: ' + r.box1 + ', box 3: ' + r.box3 + ')'); if (r.box0 !== 1) fail('an old save: the question last answered wrong was asked ' + r.box0 + ' times, expected 1'); }
      // A5: subjects the parent switched off, playing in English, other ages of player, and an age that is not open yet (9)
      { const r = await pg.evaluate(() => { const A = __a177, res = {}; A.reset(); S.subOff = { math: 1, english: 1, chinese: 1, general: 1 }; res.onlyThai = [...new Set(A.run(60, () => true).map(x => x[2]))];
          A.reset(); const lang = LANG; LANG = 'en'; const en = A.run(200, () => true); LANG = lang; res.english = { subjects: [...new Set(en.map(x => x[2]))].sort(), ages: [...new Set(en.map(x => x[1]))] };
          const age = S.age; for (const a of [6, 8, 10, 30]) { S.age = a; A.reset(); res['age ' + a] = [...new Set(A.run(300, () => true).map(x => x[1]))]; } S.age = age;
          A.reset(); QBANK.push({ id: 'zz-age9', age: 9, subject: 'math', level: 3, answer: 0, th: { q: '9?', choices: ['a', 'b', 'c', 'd'] }, en: { q: '9?', choices: ['a', 'b', 'c', 'd'] } }); for (const q of QBANK) if (q.age <= 8) S.qd[q.id] = 1;
          let threw = null, seq = []; try { seq = A.run(80, () => true); } catch (e) { threw = String(e); } QBANK.pop(); let adjacent = 0; for (let i = 1; i < seq.length; i++) if (seq[i][0] === seq[i - 1][0]) adjacent++;
          res.allFinished = { threw, asked: seq.length, age9: seq.filter(x => x[1] === 9).length, distinct: new Set(seq.map(x => x[0])).size, adjacent, markedReview: seq.filter(x => x[4] === 1).length, saveBytesForFinished: JSON.stringify(S.qd).length, records: Object.keys(S.qr).length }; A.reset(); return res; });
        R['settings and ages'] = r; if (r.onlyThai.join() !== 'thai') fail('with four subjects switched off the questions came from ' + r.onlyThai.join(' ')); if (r.english.subjects.includes('thai')) fail('playing in English asked the Thai subject'); if (r.english.ages.join() !== '7') fail('playing in English: ages ' + r.english.ages.join(' '));
        if (r['age 6'].join() !== '6') fail('a 6-year-old: ages ' + r['age 6'].join(' ')); if (r['age 8'].join() !== '8') fail('an 8-year-old: ages ' + r['age 8'].join(' ')); if (r['age 10'].join() !== '8') fail('a 10-year-old: ages ' + r['age 10'].join(' ') + ' (the bank is open up to age 8)'); if (r['age 30'].join() !== '8') fail('an adult: ages ' + r['age 30'].join(' '));
        const f = r.allFinished; if (f.threw) fail('with every question finished the chooser failed: ' + f.threw); if (f.asked !== 80) fail('with every question finished only ' + f.asked + ' of 80 questions were given'); if (f.age9) fail(f.age9 + ' questions of age 9 were asked (that age is not open)'); if (f.adjacent) fail('with every question finished ' + f.adjacent + ' were asked twice running'); if (f.distinct < 60) fail('with every question finished only ' + f.distinct + ' different questions came in 80'); if (f.markedReview !== f.asked) fail('with every question finished ' + (f.asked - f.markedReview) + ' of ' + f.asked + ' were not marked as a review'); }
      await ctx.close(); }
    // ================= Part B: the real question window, real taps =================
    { const { ctx, pg } = await player(browser, 7), R = results.window = {};
      await pg.evaluate(async () => { __a177.reset(); goMap('cavemouth'); await new Promise(r => setTimeout(r, 1300)); try { closeModal(); } catch (e) { } PAUSE = false; S.tts = false; });
      const round = async (how) => {   // open the window on a crystal (setup), then answer on the real buttons
        await pg.evaluate(() => { while (DLG) nextLine(); try { closeModal(); } catch (e) { } PAUSE = false; const c = M.crystals[(window.__r177 = (window.__r177 || 0) + 1) % M.crystals.length]; c.awake = false; openQuiz(c); }); await sleep(200);
        const shown = await pg.evaluate(() => { const text = document.querySelector('#mBody .qz').textContent, choices = [...document.querySelectorAll('#mBody .ch button')].map(b => b.textContent), q = QBANK.find(q => q.th.q === text && q.th.choices.join('|') === choices.join('|')); return q ? { id: q.id, age: q.age, subject: q.subject, answer: q.answer, review: /🔁/.test(document.querySelector('#mBody h2').textContent) } : null; });
        if (!shown) { fail('the question in the window was not found in the bank'); return null; }
        const tapChoice = async i => { const b = (await pg.$$('#mBody .ch button'))[i], r = await b.boundingBox(); await pg.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(150); };
        if (how === 'wrong') { await tapChoice((shown.answer + 1) % 4); await sleep(250); await tapChoice(shown.answer); } else await tapChoice(shown.answer);
        await sleep(900); shown.closed = await pg.evaluate(() => document.getElementById('modal').classList.contains('hide')); Object.assign(shown, await pg.evaluate(id => ({ box: (S.qr[id] || {}).box, finished: !!(S.qd && S.qd[id]) }), shown.id)); return shown; };
      const seen = []; let wrongQ = null, bad = 0;
      for (let i = 0; i < 11; i++) { const s = await round(i === 5 ? 'wrong' : 'right'); if (!s) { bad++; continue; } seen.push(s); if (i === 5) wrongQ = s;
        if (!s.closed) fail('question window ' + (i + 1) + ' did not close after the right answer'); if (i === 5 ? (s.box !== 0 || s.finished) : !s.finished) fail('question window ' + (i + 1) + ': recorded as ' + (s.finished ? 'finished' : 'not finished') + ', box ' + s.box + (i === 5 ? ' (expected not finished, box 0: the first choice was wrong)' : ' (expected finished)')); }
      R.first11 = { distinct: new Set(seen.map(s => s.id)).size, ages: [...new Set(seen.map(s => s.age))], reviews: seen.filter(s => s.review).length };
      if (R.first11.distinct !== seen.length) fail('the window repeated a question within the first 11'); if (R.first11.ages.join() !== '7') fail('the window asked ages ' + R.first11.ages.join(' ') + ' of a 7-year-old'); if (R.first11.reviews) fail('a question was marked as a review before 10 minutes had passed');
      await pg.evaluate(() => { window.__skew += 11 * 60000; }); let back = null, tries = 0;
      for (; tries < 150 && !back; tries++) { const s = await round('right'); if (!s) continue; if (wrongQ && s.id === wrongQ.id) back = s; else seen.push(s); }
      R.wrongOneCameBack = back ? { afterWindows: tries, markedReview: back.review, finishedAfterRight: back.finished } : null;
      if (!back) fail('the question answered wrong in the window did not come back within 150 windows after 10 minutes'); else { if (!back.review) fail('the returning question was not marked 🔁 in the window'); if (!back.finished) fail('the returning question answered right was not recorded as finished'); }
      let again = 0; for (let i = 0; i < 15; i++) { const s = await round('right'); if (s && wrongQ && s.id === wrongQ.id) again++; if (s) seen.push(s); }
      R.total = { windows: seen.length + (back ? 1 : 0), distinct: new Set(seen.map(s => s.id)).size, cameBackAgain: again }; if (again) fail('the question came back ' + again + ' more times after it was answered right'); if (R.total.distinct !== seen.length) fail('the window repeated ' + (seen.length - R.total.distinct) + ' questions that were answered right');
      await pg.screenshot({ path: path.join(out, 'window.png') }); await ctx.close(); }
    // ================= Part C: the question files are missing =================
    { const { ctx, pg } = await player(browser, 7, { noFiles: true }), R = results.noFiles = {};
      const r = await pg.evaluate(() => { let threw = null, seq = []; __a177.reset(); try { seq = __a177.run(150, () => true); } catch (e) { threw = String(e); } let adjacent = 0; for (let i = 1; i < seq.length; i++) if (seq[i][0] === seq[i - 1][0]) adjacent++; return { bank: QBANK.length, threw, asked: seq.length, distinct: new Set(seq.map(x => x[0])).size, adjacent, canvas: !!document.getElementById('c') }; });
      Object.assign(R, r); if (r.threw) fail('with the question files missing the chooser failed: ' + r.threw); if (r.asked !== 150) fail('with the question files missing only ' + r.asked + ' of 150 questions were given'); if (r.adjacent) fail('with the question files missing ' + r.adjacent + ' questions were asked twice running'); if (r.distinct < Math.min(40, r.bank)) fail('with the question files missing only ' + r.distinct + ' of the ' + r.bank + ' built-in questions were used');
      await ctx.close(); }
  } catch (e) { fail('test crashed: ' + (e && e.stack || e)); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  console.log('errors', errors.length, errors);
  if (errors.length) process.exitCode = 1;
})();
