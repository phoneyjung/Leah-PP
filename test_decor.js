// test_decor.js — ทดสอบ decor.js ด้วยตัวเลข · รัน: node test_decor.js (หรือ node tools/test_decor.js)
const fs = require('fs'), path = require('path');
const D = require(fs.existsSync(path.join(__dirname, 'decor.js')) ? './decor.js' : '../decor.js');   // วางคู่กับ decor.js หรือใน tools/ ก็ได้
let pass = 0, fail = 0; const bad = [];
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; bad.push(name + (info ? ' -> ' + info : '')); } };
const W = 8, H = 6;

// 1) ทิศอัตโนมัติของตู้ 1x1 ทุกช่องในห้อง 8x6 (ช่องประตูวางไม่ได้)
let n1 = 0, t1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const r = D.newRoom(W, H), got = D.autoFace(r, 'wardrobe', x, y);
  const door = x === r.door.x && y === r.door.y;
  const want = door ? null : y === 0 ? 'front' : x === 0 ? 'right' : x === W - 1 ? 'left' : 'front';
  t1++; if (got === want) n1++; else bad.push(`autoFace ${x},${y} got ${got} want ${want}`);
}
ok('1 ทิศอัตโนมัติทุกช่อง', n1 === t1, `${n1}/${t1}`);

// 2) เก้าอี้ติดโต๊ะ 4 ด้าน หันเข้าโต๊ะ · มุมห้องที่ติดโต๊ะ โต๊ะชนะผนัง
let n2 = 0;
[[0, -1, 'front'], [0, 1, 'back'], [-1, 0, 'right'], [1, 0, 'left']].forEach(([dx, dy, want]) => {
  const r = D.newRoom(W, H); D.place(r, 'table', 3, 2);
  if (D.place(r, 'chair', 3 + dx, 2 + dy).dir === want) n2++;
});
{ const r = D.newRoom(W, H); D.place(r, 'table', 1, 0); if (D.place(r, 'chair', 0, 0).dir === 'right') n2++; }
ok('2 เก้าอี้หันเข้าโต๊ะ', n2 === 5, `${n2}/5`);

// 3) เตียง 2x1: ชิดผนังซ้าย -> หันขวา กินที่ 1x2 · มุมซ้ายล่างที่ 1x2 ไม่พอ -> ถอยไปทิศที่วางได้ · มุมขวาบน -> หันซ้าย
{ const r = D.newRoom(W, H); const a = D.place(r, 'bed', 0, 2), s = D.size('bed', a.dir);
  ok('3a เตียงชิดซ้าย', a.ok && a.dir === 'right' && s.w === 1 && s.h === 2, JSON.stringify(a)); }
{ const r = D.newRoom(W, H); const a = D.place(r, 'bed', 0, H - 1);
  ok('3b เตียงมุมซ้ายล่าง', a.ok && a.dir === 'front', JSON.stringify(a)); }
{ const r = D.newRoom(W, H); const a = D.place(r, 'bed', W - 1, 0);
  ok('3c เตียงมุมขวาบน', a.ok && a.dir === 'left', JSON.stringify(a)); }

// 4) หมุน: ทุกช่อง หมุนเก้าอี้วนจนกลับทิศเดิม ไม่มีทิศไหนหันชนผนัง และจำนวนทิศ >= 2
let n4 = 0, t4 = 0, minDirs = 9;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const r = D.newRoom(W, H), a = D.place(r, 'chair', x, y); if (!a.ok) continue;
  t4++; const seen = [a.dir]; let wall = false;
  for (let k = 0; k < 4; k++) { const b = D.rotate(r, a.id); if (!b.ok) break; if (D.facesWall(r, 'chair', x, y, b.dir)) wall = true; if (b.dir === a.dir) break; seen.push(b.dir); }
  minDirs = Math.min(minDirs, seen.length);
  if (!wall && r.items[0].dir === a.dir && seen.length >= 2) n4++; else bad.push(`rotate ${x},${y} ${seen}`);
}
ok('4 หมุนวนครบและไม่ชนผนัง', n4 === t4, `${n4}/${t4} · ทิศน้อยสุด ${minDirs}`);
{ const r = D.newRoom(W, H), a = D.place(r, 'plant', 3, 3); ok('4b ของภาพเดียวหมุนไม่ได้', !D.rotate(r, a.id).ok); }
{ const r = D.newRoom(W, H), a = D.place(r, 'wardrobe', 3, 3); const ds = [D.rotate(r, a.id).dir, D.rotate(r, a.id).dir, D.rotate(r, a.id).dir];
  ok('4c ตู้ไม่มีภาพด้านหลัง', ds.indexOf('back') < 0, ds.join()); }

// 5) ทับกันไม่ได้ · พรมอยู่ใต้ของได้ · พรมทับพรมไม่ได้ · ออกนอกห้องไม่ได้ · ทับช่องประตูไม่ได้
{ const r = D.newRoom(W, H); D.place(r, 'table', 3, 3);
  ok('5a ทับของ', !D.place(r, 'plant', 3, 3).ok);
  ok('5b พรมใต้โต๊ะ', D.place(r, 'rug', 3, 3).ok);
  ok('5c พรมทับพรม', !D.place(r, 'rug', 4, 4).ok);
  ok('5d นอกห้อง', !D.place(r, 'plant', W, 2).ok && !D.place(r, 'plant', -1, 2).ok);
  ok('5e ช่องประตู', !D.place(r, 'plant', r.door.x, r.door.y).ok);
  const r2 = D.newRoom(W, H); ok('5f พรมบนช่องประตูได้', D.place(r2, 'rug', r2.door.x - 1, r2.door.y - 1).ok); }

// 6) กันปิดทาง: ล้อมเตียงด้วยกระถางจนเข้าไม่ถึง ชิ้นสุดท้ายต้องถูกปฏิเสธ และห้องต้องเหมือนเดิม
{ const r = D.newRoom(W, H); D.place(r, 'bed', 0, 0);                    // เตียงมุมซ้ายบน หันหน้าออก กิน (0,0),(1,0)
  const a = D.place(r, 'plant', 2, 0), b = D.place(r, 'plant', 0, 1), n = r.items.length, c = D.place(r, 'plant', 1, 1);
  ok('6a ปิดทางถูกปฏิเสธ', a.ok && b.ok && !c.ok && c.reason === 'ปิดทางเดิน' && r.items.length === n, JSON.stringify(c));
  const w = D.place(r, 'wardrobe', 5, 0); let sealed = 0;                 // ล้อมตู้: (4,0) (6,0) แล้ว (5,1) ต้องไม่ผ่าน
  D.place(r, 'plant', 4, 0); D.place(r, 'plant', 6, 0); if (!D.place(r, 'plant', 5, 1).ok) sealed++;
  ok('6b ล้อมตู้ไม่ได้', w.ok && sealed === 1);
  const p = D.place(r, 'plant', 6, 4), mv = D.move(r, p.id, 1, 1), now = r.items.find(i => i.id === p.id);
  ok('6c ย้ายแล้วปิดทางก็ไม่ได้', p.ok && !mv.ok && now.x === 6 && now.y === 4, JSON.stringify(mv)); }

// 7) วางโต๊ะทีหลัง เก้าอี้ที่ยังไม่เคยหมุนเองหันตาม · ที่หมุนเองแล้วไม่ถูกแก้
{ const r = D.newRoom(W, H); const c1 = D.place(r, 'chair', 2, 3), c2 = D.place(r, 'chair', 4, 3);
  D.rotate(r, c2.id); const manual = r.items[1].dir; D.place(r, 'table', 3, 3);
  ok('7 เก้าอี้หันตามโต๊ะที่วางทีหลัง', r.items[0].dir === 'right' && r.items[1].dir === manual, `${r.items[0].dir},${r.items[1].dir}`); }

// 8) สุ่ม 3,000 คำสั่ง (วาง ย้าย หมุน ลบ) แล้วตรวจกติกาทุกครั้ง
let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const types = Object.keys(D.TYPES); let ops = 0, viol = 0, accepted = 0; const byOp = { place: 0, move: 0, rotate: 0, remove: 0 };
const room = D.newRoom(W, H);
for (let k = 0; k < 3000; k++) {
  const op = rnd(10), it = room.items.length ? room.items[rnd(room.items.length)] : null; let r, name;
  if (op < 4 || !it) { name = 'place'; r = D.place(room, types[rnd(types.length)], rnd(W), rnd(H)); }
  else if (op < 6) { name = 'move'; r = D.move(room, it.id, rnd(W), rnd(H)); }
  else if (op < 8) { name = 'rotate'; r = D.rotate(room, it.id); }
  else { name = 'remove'; r = D.remove(room, it.id); }
  ops++; if (r.ok) { accepted++; byOp[name]++; }
  const solid = {}, floor = {};
  for (const i of room.items) {
    if (D.TYPES[i.type].dirs.indexOf(i.dir) < 0 || D.facesWall(room, i.type, i.x, i.y, i.dir)) viol++;
    for (const [x, y] of D.cellsOf(i.type, i.x, i.y, i.dir)) {
      const m = D.TYPES[i.type].layer === 'floor' ? floor : solid, key = x + ',' + y;
      if (x < 0 || y < 0 || x >= W || y >= H || m[key]) viol++;
      if (m === solid && x === room.door.x && y === room.door.y) viol++;
      m[key] = 1;
    }
  }
  if (D.unreachable(room).length) viol++;
}
ok('8 สุ่ม 3,000 คำสั่ง ไม่ผิดกติกา', viol === 0, `ผิด ${viol} · รับ ${accepted}/${ops} ${JSON.stringify(byOp)}`);

console.log(`ผ่าน ${pass}/${pass + fail}` + (fail ? '\nไม่ผ่าน:\n  ' + bad.join('\n  ') : ''));
console.log(`สรุป: ทิศอัตโนมัติ ${n1}/${t1} · หันเข้าโต๊ะ ${n2}/5 · หมุน ${n4}/${t4} (ทิศน้อยสุด ${minDirs}) · สุ่ม ${ops} คำสั่ง ผิดกติกา ${viol} (รับ ${accepted}: วาง ${byOp.place} ย้าย ${byOp.move} หมุน ${byOp.rotate} ลบ ${byOp.remove})`);
process.exit(fail ? 1 : 0);
