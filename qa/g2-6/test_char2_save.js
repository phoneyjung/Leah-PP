// G2.6 A4 (Claude · 1 Nov 2569): dry run of the char2 save read on COPIES of sample saves T1-T12 (DESIGN_CHAR2_SAVE_MIGRATION.md section 7).
// Each sample = a copy of localStorage {key: string}. The reader must not change one field of any slot (JSON before == after),
// must give the S.char2 the table says, must not make one for boys (T8) and must keep an existing one (T12).
// usage: node qa/g2-6/test_char2_save.js [OUT.json]      exit 0 = 12/12
'use strict';
const { char2FromSave, readSlots } = require('./char2_save.js');
const base = (o) => Object.assign({ v: 1, snd: true, name: 'Test', kid: 0, house: 'sun', age: 7, lang: 'th', lv: 3, exp: 10, coins: 20, sid: 's1' }, o);
const pd = (o) => Object.assign({ v: 1, hair: 1, face: 1, eyes: 1, mouth: 1, body: 1, hc: 2, ec: 4, tn: 1 }, o);
const one = (S) => ({ 'leahpp2d-slots': JSON.stringify({ v: 2, slots: [S], cur: 0 }) });
const C = (hair, iris, skin, from) => ({ hair, iris, skin, from });

const cases = [
  ['T1 old save, no colour fields', one(base({})), [C('brown', 'green', 'medium', 'default')]],
  ['T2 hc / ec (<= 1.70)', one(base({ kid: 1, hc: 3, ec: 4 })), [C('red', 'amber', 'medium', 'hc')]],
  ['T3 hcol / ecol dye (1.94) beats hc', one(base({ hc: 0, ec: 0, hcol: 5, ecol: 3, gender194: 'f' })), [C('blue', 'blue', 'medium', 'hcol')]],
  ['T4 appearance169 (GM 1.69)', one(base({ hc: 0, ec: 0, appearance169: { v: 1, hair: 1, face: 2, hc: 6, ec: 1 } })), [C('silver', 'black', 'medium', 'appearance169')]],
  ['T5 gmSprite170 + appearance169', one(base({ gmSprite170: { v: 1, on: true }, appearance169: { v: 1, hair: 0, face: 0, hc: 7, ec: 2 } })), [C('green', 'green', 'medium', 'appearance169')]],
  ['T6 pd219 set 07, tn 0-3', { 'leahpp2d-slots': JSON.stringify({ v: 2, cur: 1, slots: [0, 1, 2, 3].map(t => base({ sid: 's' + t, pd219: pd({ tn: t }) })) }) },
    [C('blonde', 'amber', 'light', 'pd219'), C('blonde', 'amber', 'medium', 'pd219'), C('blonde', 'amber', 'tan', 'pd219'), C('blonde', 'amber', 'deep', 'pd219')]],
  ['T7 pd219 set 08 (2.30), hc -1 = drawn colour -> next source', one(base({ hcol: 4, pd219: pd({ set: 8, hc: -1, ec: 3, tn: 2 }) })), [C('pink', 'blue', 'tan', 'hcol')]],
  ['T8 boy (gender194 m)', one(base({ kid: 4, gender194: 'm', hc: 1, ec: 1 })), [null]],
  ['T9 broken values', one(base({ hc: 99, ec: null, hcol: 'x', ecol: 2.5, appearance169: null, pd219: { v: 1, hair: 1, tn: -5 } })), [C('brown', 'green', 'medium', 'default')]],
  ['T10 4 slots + cur in the middle + sid', { 'leahpp2d-slots': JSON.stringify({ v: 2, cur: 2, slots: [
      base({ sid: 'a', hc: 0, ec: 1 }), base({ sid: 'b', kid: 3, gender194: 'm' }), base({ sid: 'c', pd219: pd({ hc: 7, ec: 0, tn: 3 }) }), base({ sid: 'd' })] }) },
    [C('black', 'black', 'medium', 'hc'), null, C('green', 'brown', 'deep', 'pd219'), C('brown', 'green', 'medium', 'default')]],
  ['T11 old key leahpp2d-v1 only', { 'leahpp2d-v1': JSON.stringify(base({ hc: 2, ec: 2 })) }, [C('blonde', 'green', 'medium', 'hc')]],
  ['T12 S.char2 already there', one(base({ hc: 1, ec: 1, char2: { v: 2, set: 'c2', base: 'kid4', gender: 'f', parts: {}, color: { hair: 'pink', iris: 'amber', skin: 'deep' }, from: 'owner' } })),
    [C('pink', 'amber', 'deep', 'owner')]],
];

const res = []; let changed = 0;
for (const [name, ls, want] of cases) {
  const before = JSON.stringify(ls);
  const d = readSlots(JSON.parse(JSON.stringify(ls)));      // a copy, as the spec says
  const snap = d.slots.map(s => JSON.stringify(s));
  const got = d.slots.map(s => { const r = char2FromSave(s).char2; return r ? C(r.color.hair, r.color.iris, r.color.skin, r.from) : null; });
  const fieldsChanged = d.slots.reduce((n, s, i) => n + (JSON.stringify(s) === snap[i] ? 0 : 1), 0) + (JSON.stringify(ls) === before ? 0 : 1);
  changed += fieldsChanged;
  const ok = JSON.stringify(got) === JSON.stringify(want) && fieldsChanged === 0 && d.slots.length === want.length;
  // T12: the returned object must be the SAME object (kept), not a rebuilt one
  const kept = name.startsWith('T12') ? char2FromSave(d.slots[0]).char2 === d.slots[0].char2 : null;
  res.push({ case: name, ok: ok && kept !== false, slots: d.slots.length, cur: d.cur, got, want, fieldsChanged, kept });
}
for (const r of res) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.case + ' | ' + JSON.stringify(r.got));
const p = res.filter(r => r.ok).length;
console.log('read %d/%d · slots/keys changed by the reader %d', p, res.length, changed);
if (process.argv[2]) require('fs').writeFileSync(process.argv[2], JSON.stringify({ passed: p, total: res.length, changed, cases: res }, null, 1));
process.exit(p === res.length && changed === 0 ? 0 : 1);
