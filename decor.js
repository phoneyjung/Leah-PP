// decor.js — วางเฟอร์นิเจอร์ในห้อง: หันอัตโนมัติ · หมุนเอง · กันปิดทางเดิน  (MAP_SPEC_G9 หัวข้อ 4d)
// ไม่แตะ DOM · ใช้ได้ทั้งในเกม (global Decor) และใน node (require)
// ห้อง = {w,h,door:{x,y},items:[]} · ช่อง (0,0) = มุมซ้ายบน · ผนังที่มองเห็น = หลัง (y=0) ซ้าย (x=0) ขวา (x=w-1) · ด้านล่างคือฝั่งกล้อง
(function (root) {
  'use strict';
  var DIRS = ['front', 'left', 'back', 'right'];            // ลำดับปุ่มหมุน ทีละ 90°
  var STEP = { front: [0, 1], left: [-1, 0], back: [0, -1], right: [1, 0] };   // ช่องที่ของ "หันหน้าไปหา"

  // ชนิดของ: w,h = ขนาดตอนหันหน้าออก · dirs = ทิศที่มีภาพ · layer 'floor' = พรม (เดินทับได้ วางของทับได้)
  // seat = หันเข้าหาโต๊ะ · table = โต๊ะ · reach = ต้องเดินไปถึงได้เสมอ
  var TYPES = {
    bed:      { th: 'เตียง',        w: 2, h: 1, dirs: ['front', 'left', 'right'], reach: true },
    wardrobe: { th: 'ตู้เสื้อผ้า',   w: 1, h: 1, dirs: ['front', 'left', 'right'], reach: true },
    shelf:    { th: 'ชั้นโชว์',      w: 2, h: 1, dirs: ['front', 'left', 'right'], reach: true },
    table:    { th: 'โต๊ะ',          w: 1, h: 1, dirs: ['front'], table: true },
    chair:    { th: 'เก้าอี้',       w: 1, h: 1, dirs: DIRS, seat: true },
    sofa:     { th: 'โซฟา',          w: 2, h: 1, dirs: DIRS, seat: true },
    plant:    { th: 'กระถางต้นไม้',  w: 1, h: 1, dirs: ['front'] },
    lamp:     { th: 'โคมตั้งพื้น',   w: 1, h: 1, dirs: ['front'] },
    rug:      { th: 'พรม',           w: 2, h: 2, dirs: ['front'], layer: 'floor' }
  };

  function newRoom(w, h, doorX) {
    return { w: w, h: h, door: { x: doorX == null ? Math.floor(w / 2) : doorX, y: h - 1 }, items: [], nextId: 1 };
  }
  function size(type, dir) {                                  // หันข้าง = สลับกว้าง/ลึก
    var t = TYPES[type], side = dir === 'left' || dir === 'right';
    return side ? { w: t.h, h: t.w } : { w: t.w, h: t.h };
  }
  function cellsOf(type, x, y, dir) {
    var s = size(type, dir), out = [];
    for (var j = 0; j < s.h; j++) for (var i = 0; i < s.w; i++) out.push([x + i, y + j]);
    return out;
  }
  function layerOf(type) { return TYPES[type].layer || 'solid'; }
  function solidMap(room, ignoreId) {                         // ช่องที่มีของทึบอยู่ -> id
    var m = {};
    room.items.forEach(function (it) {
      if (it.id === ignoreId || layerOf(it.type) !== 'solid') return;
      cellsOf(it.type, it.x, it.y, it.dir).forEach(function (c) { m[c[0] + ',' + c[1]] = it.id; });
    });
    return m;
  }
  function fits(room, type, x, y, dir, ignoreId) {            // อยู่ในห้อง ไม่ทับของชั้นเดียวกัน ไม่ทับช่องประตู
    var cs = cellsOf(type, x, y, dir), lay = layerOf(type);
    for (var k = 0; k < cs.length; k++) {
      var cx = cs[k][0], cy = cs[k][1];
      if (cx < 0 || cy < 0 || cx >= room.w || cy >= room.h) return false;
      if (lay === 'solid' && cx === room.door.x && cy === room.door.y) return false;
    }
    for (var n = 0; n < room.items.length; n++) {
      var it = room.items[n];
      if (it.id === ignoreId || layerOf(it.type) !== lay) continue;
      var oc = cellsOf(it.type, it.x, it.y, it.dir);
      for (var a = 0; a < cs.length; a++) for (var b = 0; b < oc.length; b++)
        if (cs[a][0] === oc[b][0] && cs[a][1] === oc[b][1]) return false;
    }
    return true;
  }
  function facesWall(room, type, x, y, dir) {                 // หันหน้าชนผนังที่มองเห็น (หลัง/ซ้าย/ขวา) = ห้าม
    var s = size(type, dir);
    if (dir === 'back') return y === 0;
    if (dir === 'left') return x === 0;
    if (dir === 'right') return x + s.w - 1 === room.w - 1;
    return false;                                             // หันหน้าออกหากล้องได้เสมอ
  }
  function legal(room, type, x, y, dir, ignoreId) {
    return TYPES[type].dirs.indexOf(dir) >= 0 && fits(room, type, x, y, dir, ignoreId) && !facesWall(room, type, x, y, dir);
  }
  function tableDir(room, type, x, y, ignoreId) {             // ทิศที่หันเข้าหาโต๊ะที่ติดกัน (ถ้ามี)
    var tables = {};
    room.items.forEach(function (it) {
      if (it.id !== ignoreId && TYPES[it.type].table) cellsOf(it.type, it.x, it.y, it.dir).forEach(function (c) { tables[c[0] + ',' + c[1]] = 1; });
    });
    for (var d = 0; d < DIRS.length; d++) {
      var dir = DIRS[d], cs = cellsOf(type, x, y, dir), st = STEP[dir];
      for (var k = 0; k < cs.length; k++) if (tables[(cs[k][0] + st[0]) + ',' + (cs[k][1] + st[1])]) return dir;
    }
    return null;
  }
  // ทิศอัตโนมัติ: 1) ที่นั่งติดโต๊ะ -> หันเข้าโต๊ะ 2) ชิดผนังหลัง -> หน้าออก 3) ชิดซ้าย -> หันขวา 4) ชิดขวา -> หันซ้าย 5) กลางห้อง -> หน้าออก
  // ถ้าทิศที่อยากได้วางไม่ลง ไล่ทิศอื่นตามลำดับ · คืน null ถ้าวางไม่ได้เลย
  function autoFace(room, type, x, y, ignoreId) {
    var t = TYPES[type], want = [];
    if (t.seat) { var td = tableDir(room, type, x, y, ignoreId); if (td) want.push(td); }
    if (y === 0) want.push('front');
    else if (x === 0) want.push('right');
    else if (x === room.w - 1) want.push('left');
    want = want.concat(['front', 'right', 'left', 'back']);
    for (var k = 0; k < want.length; k++) if (legal(room, type, x, y, want[k], ignoreId)) return want[k];
    return null;
  }
  // ของที่ต้องเดินถึง (เตียง ตู้ ชั้นโชว์) ต้องมีช่องว่างติดกันอย่างน้อย 1 ช่องที่เดินจากประตูมาถึง · คืนรายชื่อ id ที่ไปไม่ถึง
  function unreachable(room) {
    var solid = solidMap(room), seen = {}, q = [[room.door.x, room.door.y]];
    seen[room.door.x + ',' + room.door.y] = 1;
    while (q.length) {
      var c = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) {
        var nx = c[0] + s[0], ny = c[1] + s[1], k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h || seen[k] || solid[k]) return;
        seen[k] = 1; q.push([nx, ny]);
      });
    }
    return room.items.filter(function (it) {
      if (!TYPES[it.type].reach) return false;
      return !cellsOf(it.type, it.x, it.y, it.dir).some(function (c) {
        return seen[(c[0] + 1) + ',' + c[1]] || seen[(c[0] - 1) + ',' + c[1]] || seen[c[0] + ',' + (c[1] + 1)] || seen[c[0] + ',' + (c[1] - 1)];
      });
    }).map(function (it) { return it.id; });
  }
  function byId(room, id) { for (var k = 0; k < room.items.length; k++) if (room.items[k].id === id) return room.items[k]; return null; }
  function refaceSeats(room) {                                // ที่นั่งที่ยังไม่เคยหมุนเอง หันตามโต๊ะข้าง ๆ
    room.items.forEach(function (it) {
      if (!TYPES[it.type].seat || !it.auto) return;
      var d = tableDir(room, it.type, it.x, it.y, it.id);
      if (d && d !== it.dir && legal(room, it.type, it.x, it.y, d, it.id)) it.dir = d;
    });
  }
  // ลองเปลี่ยนสถานะ ถ้าทำให้ของที่ต้องเดินถึงถูกปิดทาง -> คืนค่าเดิม
  function commit(room, change, undo) {
    change();
    if (unreachable(room).length) { undo(); return { ok: false, reason: 'ปิดทางเดิน' }; }
    refaceSeats(room);
    return { ok: true };
  }
  function place(room, type, x, y) {
    if (!TYPES[type]) return { ok: false, reason: 'ไม่รู้จักของชิ้นนี้' };
    var dir = autoFace(room, type, x, y);
    if (!dir) return { ok: false, reason: 'วางตรงนี้ไม่ได้' };
    var it = { id: room.nextId++, type: type, x: x, y: y, dir: dir, auto: true };
    var r = commit(room, function () { room.items.push(it); }, function () { room.items.pop(); room.nextId--; });
    if (r.ok) { r.id = it.id; r.dir = it.dir; }
    return r;
  }
  function move(room, id, x, y) {
    var it = byId(room, id); if (!it) return { ok: false, reason: 'ไม่พบของชิ้นนี้' };
    var old = { x: it.x, y: it.y, dir: it.dir };
    var dir = it.auto ? autoFace(room, it.type, x, y, id) : (legal(room, it.type, x, y, it.dir, id) ? it.dir : autoFace(room, it.type, x, y, id));
    if (!dir) return { ok: false, reason: 'วางตรงนี้ไม่ได้' };
    var r = commit(room, function () { it.x = x; it.y = y; it.dir = dir; }, function () { it.x = old.x; it.y = old.y; it.dir = old.dir; });
    if (r.ok) r.dir = it.dir;
    return r;
  }
  function rotate(room, id) {                                 // หมุนไปทิศถัดไปที่วางได้ · ข้ามทิศที่ชนผนังหรือทับของอื่น
    var it = byId(room, id); if (!it) return { ok: false, reason: 'ไม่พบของชิ้นนี้' };
    var start = DIRS.indexOf(it.dir), old = { dir: it.dir, auto: it.auto };
    for (var k = 1; k < 4; k++) {
      var d = DIRS[(start + k) % 4];
      if (!legal(room, it.type, it.x, it.y, d, id)) continue;
      var r = commit(room, function () { it.dir = d; it.auto = false; }, function () { it.dir = old.dir; it.auto = old.auto; });
      if (r.ok) { r.dir = d; return r; }
    }
    return { ok: false, reason: 'หมุนไม่ได้ตรงนี้' };
  }
  function remove(room, id) {
    var n = room.items.length;
    room.items = room.items.filter(function (it) { return it.id !== id; });
    return { ok: room.items.length < n };
  }
  function itemAt(room, x, y) {                               // ของชิ้นบนสุดในช่องนั้น (ของทึบก่อนพรม)
    var hit = null;
    room.items.forEach(function (it) {
      var on = cellsOf(it.type, it.x, it.y, it.dir).some(function (c) { return c[0] === x && c[1] === y; });
      if (on && (!hit || layerOf(it.type) === 'solid')) hit = it;
    });
    return hit;
  }

  var api = { DIRS: DIRS, TYPES: TYPES, newRoom: newRoom, size: size, cellsOf: cellsOf, fits: fits, facesWall: facesWall, legal: legal,
    autoFace: autoFace, unreachable: unreachable, place: place, move: move, rotate: rotate, remove: remove, itemAt: itemAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Decor = api;
})(typeof window !== 'undefined' ? window : this);
