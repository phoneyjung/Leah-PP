# T26 — ยืนยัน G3.3 ฉบับ 1.1 / T25 N1

2 พ.ย. 2569 · ฐาน `351a8ce` · diff จาก `59e7da1` · branch `codex/t26-confirm-g33`

**N1 เดิมปิดได้**: fi NaN / หาย / −1 / Infinity และ anim='jump' ถูกปฏิเสธแล้ว ไม่พบการปฏิเสธ actor ปกติผิดในชุดที่รัน **ยังไม่แนะนำปิด G3.3 โดยไม่มีข้อค้าง** เพราะพบ N2 ระดับต่ำใน guard ของ lpos: sparse array ผ่าน `.every()` แล้วคืนพิกัดแสง NaN ให้ Claude แก้หรือบันทึกการยอมรับข้อจำกัดนี้ก่อนปิดขั้น ไม่ใช่บั๊กที่พบในการเล่นปกติ

ข้อพบใหม่: **สูง 0 / กลาง 0 / ต่ำ 1** ไม่แก้โค้ดหรือไฟล์ภาพให้เอง

## 1. ผลรันจริง

| รายการ | ผล | exit |
|---|---|---:|
| build_char2.js --check, terser 5.36.0 | สร้างซ้ำตรงทุกไบต์ · char2.js **21,154 B**, source 36,680 B | 0 |
| check_k1_k6.py | baseline **20/20**, reference **4/4**, pack **13/13**; rebuild ตรง; เกม 3 ไฟล์ไม่เปลี่ยน | 0 |
| k3d เต็ม | **2,858 ก้าว** (1,429 ต่อ DPR 3/1), รูแสง/emissive ต่าง 0; E3 **18/18** + control ผ่าน | 0 |
| INJECT=X3, K3_GROUPS=A11, k3d | E3 **0/18** + control ผ่าน; fails 1 | **1** |
| INJECT=X2, K3_GROUPS=A11, k3d | E3 **10/18** + control ผ่าน; fails 1 | **1** |
| k3b | **2,560/2,560 แผ่น · 10,240/10,240 ประกอบ · 309/309 anchor** | 0 |
| a12 | **48/48 + 27/27** · ต่าง 0 | 0 |
| k4 | **8/8** จุดตรวจตรงไบต์ · model mismatch 0 · peak อิสระ **41,420,436 B = 39.502 MiB** ≤ 40 MiB | 0 |
| K3a กลุ่มที่เลือก | **6,020 ภาพต่าง 0** · 7 กลุ่ม × DPR 3/1 | 0 |
| G3.2 | **K2 44/44 · K7 41/41** · load twice/release ระหว่างโหลดผ่าน | 0 |

K3a รอบนี้เลือก A1,A2,A3,A4,A6h,A10-S,A10-W-hold: ครอบคลุมท่ายืน/เดิน ถือ/ไม่ถือทุกทิศ, เดิน→หยุดขณะถือ และกะพริบหน้า/ข้าง ไม่อ้างว่าได้รัน 18,518 ภาพเต็มซ้ำใน T26; ชุดเต็มนั้นผ่านใน T25 ที่ฐานเดิมแล้ว ตามงานนี้อนุญาต K3a บางกลุ่ม

K4: 1,952 operations; สี 6/6; peak ของ Char2 41,417,460 B ≤ อิสระ 41,420,436 B; ใช้นิยามการนับ/GC เดิมที่รับใน T25 ไม่ใช่ RAM ของ Chromium ทั้งโปรเซส K6 โหลด 14 ไฟล์รวม 410,088 B, pack 4,054 B, ไม่มีชื่อใหม่ใน sw.js

## 2. N1 เดิมปิดไหม / การทดสอบใหม่วัดจริงไหม

`actorOk` ที่ `char2.src.js:355–357` ตรวจ anim เป็น idle/walk, fi เป็น safe integer ≥0 ก่อนเข้า frame; `draw` ที่บรรทัด 394–396 ตรวจ actor และ kk เป็นเลขเต็มอยู่ในขอบแผ่นก่อนวาดชั้นแรก `anchor`/`light` ใช้ guard เดียวกันที่บรรทัด 425/437

ทำซ้ำด้วย probe ของ Codex จาก T25 บนไฟล์สร้างรุ่นใหม่: `delete a.fi`, `a.fi=NaN`, `a.fi=-1`, `a.fi=Infinity`, `a.anim='jump'` → **5/5 คืน false และพิกเซลทึบ 0** บนผืนใส ต่างจากรุ่นเดิมที่คืน true (สี่กรณีแรกภาพว่าง และ anim แปลกวาด idle)

E3 ตรวจ 9 แบบ × idle/walk = 18 กรณี แต่ละกรณีลองทั้งผืนใสและผืนมีสีพื้น วัด return=false, ผืนใสยังใส, bytes พื้นเดิมไม่เปลี่ยน, light/anchor=null และมี control actor ถูกต้องที่ต้องวาดภาพไม่ว่างจริง จึงไม่ได้ผ่านเพียงเพราะ renderer หยุดทำงานทั้งหมด

X3 คืน guard สองชั้นให้เหมือนรุ่นก่อน ทำให้ E3 ตก 18/18 โดย control ยังผ่าน; X2 คืนเฉพาะ actor guard เก่าแต่คง frame bound จึงยังจับปัญหาได้บางส่วน (ผ่าน 10/18, ทั้งชุด exit 1) ตรงการทำงานของสองชั้น การฉีดแก้ source ในหน่วยความจำตามรายการ ไม่แก้ไฟล์ใน repo

## 3. ตรวจว่า actor ปกติไม่ได้ถูกปฏิเสธผิด

- ชุด k3b/a12/k4/K3a/G3.2 ข้างบนยังผ่าน
- probe อิสระแบบเดิม **128 การวาด**: ไฟล์ครบและบล็อกหายทีละ idle/walk/walkhold/walk-mask/hold JSON/lantern/light × 4 ทิศ S/E/N/W × 2 ท่า × ถือ/ไม่ถือ ยังได้ true ภาพไม่ว่างและ actor ไม่เปลี่ยนทั้งหมด (วัดผล API/ไม่ว่าง ไม่อ้างพิกเซลทางสำรองตรง oracle ครบทุกจุด)
- actor ปกติที่ freeze ไม่ให้แก้: **48/48** (8 ทิศ × 2 ท่า × alpha 0/0.35/1) ยังวาดได้และคืน globalAlpha, smoothing, transform, fillStyle ตรงก่อนเรียก
- input ผิดทั่วไป **8/8** (null actor/dir ผิด/null app/สีผิด/null dc/x NaN/scale 0/scale 1.5) คืน false และพิกเซลพื้นเดิมไม่เปลี่ยน

ไม่พบ false rejection ในกรณีเหล่านี้ ไม่อ้างว่าครอบคลุม actor ที่ผู้เรียกสร้างเองทุกรูปแบบ

## 4. N2 — ต่ำ: lpos แบบ sparse array ยังผ่าน guard และ light ส่ง NaN ออกมา

ตำแหน่ง `char2.src.js:357`:

```js
Array.isArray(A.lpos) && A.lpos.length === 2 &&
A.lpos.every(v => Number.isFinite(v) && v >= 0 && v < ST.pack.cell)
```

`Array.every` ไม่เรียก predicate สำหรับช่องที่ไม่มีสมาชิก จึงยอมรับ array ความยาว 2 ที่ไม่มีค่าครบสองตัว ทั้งที่ข้อ 6 อธิบายว่า lpos ต้องเป็นเลข 2 ตัว

ทำซ้ำบนแพ็กปกติ ไม่ฉีดผิดใน Char2:

```js
const a = Char2.actor();
Char2.tick(a, 16, {moving:true, dir:'E', holding:true});
delete a.lpos[0];          // หรือ a.lpos = new Array(2)
const dc = {house:'wing', held:{id:'lantern_L0', on:true, lit:true, power:100}};
Char2.draw(ctx, Char2.look({}), dc, a, 80, 120, 1);
Char2.light(a, dc);
```

ผืนทดสอบ 160×160 พื้น #336699; ผลจริง:

| actor | draw | พิกเซลที่เปลี่ยน | light | head_top |
|---|---|---:|---|---|
| ปกติ | true | 2,454 | x=10,y=−10 finite | [47,11] |
| `new Array(2)` | **true** | **2,437** | **x=NaN,y=NaN**, lit=true | [47,11] |
| `delete a.lpos[0]` | **true** | **2,437** | **x=NaN,y=−10**, lit=true | [47,11] |
| `a.lpos[0]=undefined` (มีสมาชิกอยู่จริง) | false | 0 | null | null |

NaN ปรากฏเป็น null ใน JSON ที่ serialize จึงตรวจ `Number.isFinite(L.x) && Number.isFinite(L.y)` เพิ่มด้วยและได้ false จริงสำหรับสองแถว sparse ผลคือยังวาดตัวและคืน true แต่ตะเกียงไม่ได้วาดตามปกติ และส่งพิกัดที่ผู้วาดฉากใช้ไม่ได้ แทน false/null ตามเจตนาของ guard

**ระดับต่ำ** เพราะต้องมีผู้เรียกทำ actor เสีย ไม่มีหลักฐานว่า actor()+tick() ปกติสร้าง sparse lpos; ไม่เปิด N1 เดิมกลับมา ข้อนี้เป็นช่องว่างในการตรวจ lpos ที่เพิ่มรอบนี้

ข้อเสนอให้ Claude: ตรวจ A.lpos[0] และ A.lpos[1] อย่างชัดเจนว่ามีค่า finite อยู่ในช่วง (หรือบังคับให้ทั้งสอง index มีสมาชิกก่อน every); เพิ่มสองกรณี sparse เข้า E3 บนผืนใส/มีพื้น และตรวจพิกัด light ต้อง finite เมื่อไม่คืน null ไม่ต้องเปลี่ยนภาพหรือเกณฑ์ศิลป์

## 5. G3.3 ปิดได้ไหม / ขอบเขตการส่ง

**เกณฑ์ที่สั่งรันผ่านครบ และ N1 เดิมปิดได้** แต่ยังมี N2 ต่ำที่ทำซ้ำได้ จึงส่งกลับให้ Claude จัดการข้อค้างก่อนประกาศปิด G3.3 แบบไม่มีข้อยกเว้น ไม่ได้พบข้อสูง/กลางที่ขวางการวาด actor ปกติ D8–D18 และข้อจำกัดที่รับใน T25 ไม่ถูกเปิดตรวจซ้ำรอบนี้ ไม่ใช่การรับ G3 ทั้งระบบ (G3.4/G3.5 ยังตามแผน)

คำสั่งหลักใช้ port 8796 และ Playwright preload ที่เลือก system Chromium 151 แทน bundled browser ที่ไม่มี โดยไม่เปลี่ยน assertions:

```sh
NODE_PATH=/tmp/codex-t25/deps/node_modules node qa/g3/build_char2.js --check
python3 -I qa/g3/check_k1_k6.py . origin/main
PORT=8796 node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k3.js k3d /tmp/codex-t26/out/k3d.json
PORT=8796 INJECT=X3 K3_GROUPS=A11 node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k3.js k3d /tmp/codex-t26/out/k3d-X3.json
# X2 ใช้คำสั่งเดียวกันโดยเปลี่ยน INJECT และชื่อผล
PORT=8796 node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k3.js k3b /tmp/codex-t26/out/k3b.json /tmp/codex-t25/ref
PORT=8796 node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k3.js a12 /tmp/codex-t26/out/a12.json
PORT=8796 node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k4.js /tmp/codex-t26/out/k4.json /tmp/codex-t25/ref
PORT=8796 K3_GROUPS=A1,A2,A3,A4,A6h,A10-S,A10-W-hold node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g33_k3.js k3a /tmp/codex-t26/out/k3a.json
PORT=8796 BAD=/tmp/codex-t26/bad node --require /tmp/codex-t26/chromium.cjs qa/g3/test_g32_load_look.js /tmp/codex-t26/out/g32.json
```

ใช้คำตอบ Python ที่ Codex สร้างใน T25 นอก repo ซึ่งตรวจ SHA ซ้ำตรง baseline 3/3 และ diff รอบนี้ไม่แก้ oracle/ภาพ/pack ไม่ได้สร้างคำตอบใหม่รอบ T26 ไม่รันฉีดผิด 19 แบบเดิมหรือ S0 ซ้ำเพราะขอบเขตนี้ยืนยัน X2/X3 ผล/probe/สำเนาเสียอยู่ `/tmp/codex-t26/` นอก checkout; ส่งเฉพาะรายงานนี้ + 1 บรรทัด CODEX_STATUS ไม่แก้ Claude/ภาพ/index.html ไม่ใช้เครดิต ไม่แตะเซฟจริง
