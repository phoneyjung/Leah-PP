# T27 — ยืนยัน G3.3 ฉบับ 1.2 / T26 N2

2 พ.ย. 2569 · ฐาน `009f413` · diff จาก `351a8ce` · branch `codex/t27-confirm-g33`

**N2 ปิดได้ และ G3.3 ปิดได้ในขอบเขตขั้นนี้จากผลตรวจอิสระ** N1 ปิดใน T26 แล้ว; รอบนี้ปิด N2 ที่ค้าง โดยชุดเดิมที่รันยังผ่าน ไม่พบปัญหาใหม่ **สูง 0 / กลาง 0 / ต่ำ 0** ไม่ใช่การปิด G3 ทั้งระบบ: G3.4/G3.5 และข้อจำกัดที่รับไว้ใน T25 ยังเป็นไปตามแผน

## 1. ตัวเลขจริง

| รายการ | ผล Codex | exit |
|---|---|---:|
| build_char2.js --check (terser 5.36.0) | สร้างซ้ำตรงทุกไบต์ · char2.js **21,176 B**, source 36,769 B | 0 |
| check_k1_k6.py | baseline **20/20**, reference **4/4**, pack **13/13**; pack rebuild ตรง; เกม 3 ไฟล์ไม่เปลี่ยน | 0 |
| k3d เต็ม | **2,858 ก้าว** (DPR 3/1), รูแสง/emissive ต่าง 0; **E3 24/24 + control ผ่าน** | 0 |
| INJECT=X4 K3_GROUPS=A11 k3d | **E3 18/24**: ตกเฉพาะ sparse 6 กรณี; control ยังผ่าน | **1** |
| k3b | **2,560/2,560 แผ่น · 10,240/10,240 ภาพประกอบ · 309/309 anchor** | 0 |
| a12 | **48/48 + 27/27** ต่าง 0 | 0 |
| k4 | **8/8** จุดตรวจตรงไบต์ · model mismatch 0 · peak อิสระ **41,420,436 B = 39.502 MiB** ≤ 40 MiB | 0 |
| K3a บางกลุ่ม | **6,020 ภาพต่าง 0** · 7 กลุ่ม × DPR 3/1 | 0 |
| Probe N2 ของ Codex | `new Array(2)` และ `delete a.lpos[0]` ปฏิเสธถูกต้อง **2/2** | 0 |

K3a เลือก A1,A2,A3,A4,A6h,A10-S,A10-W-hold ครอบคลุม 8 ทิศของยืน/เดิน ถือ/ไม่ถือ การหยุดขณะถือ และการกะพริบหน้า/ข้าง รอบนี้ไม่ได้รันครบ 18,518 ภาพซ้ำ ไม่อ้างผลเต็มเป็นผลใหม่ของ T27

K4 มี 1,952 operations, สี 6/6, stats.peak 41,417,460 B ≤ peak อิสระ 41,420,436 B; ใช้นิยาม GC/บัฟเฟอร์เดิม ไม่ใช่ RAM/GPU ทั้ง browser K6 pack 4,054 B และ 14 ไฟล์โหลดรวม 410,088 B ไม่มีชื่อใหม่ใน sw.js

## 2. ยืนยันสาเหตุและการแก้ N2

`char2.src.js:355–358` แยก `inCell(v)` ตรวจ finite และช่วง `0 ≤ v < cell` แล้วเรียกกับ `lpos[0]` และ `lpos[1]` โดยตรง จึงอ่านสมาชิกที่หายเป็น undefined แล้วปฏิเสธ แทน `.every()` ที่ข้ามช่องว่าง การตรวจยังใช้ร่วมกันก่อน draw/anchor/light เหมือน T26

สำหรับ array ปกติความยาว 2 เงื่อนไขใหม่เทียบเท่าเงื่อนไขเดิม: ต้องผ่านทั้งสองค่า ไม่มีการเพิ่มเงื่อนไขว่าต้องเป็นจำนวนเต็มให้พิกัดตะเกียง จึงยังยอมรับค่าทศนิยม finite ในช่วงตามเดิม รวมถึง null/undefined ที่ใช้เลือกตำแหน่งเป้าหมายเมื่อยังไม่มี lpos

ทำซ้ำ probe เดิมจาก T26 บนไฟล์สร้างจริง โดยไม่ฉีดแก้ Char2: actor เดิน E ถือ L0 หลัง tick 16 ms บนผืน 160×160 พื้น #336699

| lpos | draw | พิกเซลที่เปลี่ยน | light | head_top |
|---|---|---:|---|---|
| ปกติ | true | 2,454 | x=10,y=−10 เป็น finite | [47,11] |
| `new Array(2)` | **false** | **0** | **null** | **null** |
| `delete a.lpos[0]` | **false** | **0** | **null** | **null** |
| `a.lpos[0]=undefined` | false | 0 | null | null |

สองกรณี sparse ต่างจาก T26 ที่ draw=true, พื้นเปลี่ยน 2,437 จุด และ light มี NaN จึงปิด N2 ได้จากพฤติกรรมจริง ไม่ใช่เพียงอ่าน diff

## 3. E3/X4 วัดความผิดจริงไหม

E3 เพิ่ม array ว่างทั้งสองช่อง, ช่อง 0 หาย, ช่อง 1 หาย × ยืน/เดิน = 6 กรณีใหม่ รวมเดิมเป็น 24 กรณี แต่ละกรณีตรวจ draw=false ทั้งบนผืนใสและพื้นมีสี, พิกเซลไม่เปลี่ยน และ light/anchor=null

X4 เปลี่ยนเฉพาะการตรวจ lpos กลับเป็น `.every(inCell)` ใน source ที่ส่งผ่าน route ในหน่วยความจำ ผลตกพอดี:

- `lpos new Array(2)` ยืนและเดิน
- `lpos hole at 0` ยืนและเดิน
- `lpos hole at 1` ยืนและเดิน

18 กรณีเดิมยังผ่าน และ control actor ปกติยังวาดไม่ว่างพร้อมแสง finite จึงยืนยันว่า regression จับช่องว่าง array โดยเฉพาะ ไม่ใช่ผ่านเพราะหยุดวาดทั้งหมด หรือ fail เพราะ runtime เปิดหน้าไม่ได้

ตรวจตำแหน่ง `.every()` ที่เหลือแล้ว ไม่พบทางรับ lpos จาก caller ผ่านทุกตัวแบบเดิมอีก ส่วน validation แพ็ก/จุดยึดอ่าน JSON ซึ่งไม่มี sparse holes; การวน constant arrays เช่นรายการชื่อ part ไม่ใช่การวน array ที่ caller ทำช่องว่างไว้

## 4. ข้อสรุปและขอบเขต

- **N2 ปิด:** probe เดิม 2/2 + E3 24/24 และ X4 ตกตรง 6 กรณี
- **ไม่พบ false rejection ของ actor ปกติ** ใน control และชุด k3b/a12/k4/K3a ที่รัน
- **G3.3 ปิดได้ในขั้นนี้:** เกณฑ์หลักยืนยันใน T25, N1 ปิดใน T26, N2 ปิดใน T27; ไม่มีข้อค้างใหม่จากการตรวจรอบนี้ ขอบเขต K4 ส่วน portrait และงาน G3.4/G3.5 ยังไม่ถูกรับรวม
- **ปัญหาใหม่:** สูง 0 · กลาง 0 · ต่ำ 0 ในขอบเขต diff และการทดสอบข้างต้น ไม่อ้างว่าทดสอบ actor ที่ caller ทำเสียทุกชนิดหรือรับประกันไม่มีบั๊กทั้งหมด

## 5. วิธีรัน / สิ่งที่ส่ง

ใช้ checkout `/workspace/t27-review` และผล/probe นอก repo ที่ `/tmp/codex-t27/` ทดสอบผ่าน localhost port 8797; Playwright preload เลือก system Chromium 151 แทน bundled browser ที่ไม่มี เปลี่ยนเฉพาะ executablePath ไม่เปลี่ยน assertions/เครื่องตรวจ

```sh
NODE_PATH=/tmp/codex-t25/deps/node_modules node qa/g3/build_char2.js --check
python3 -I qa/g3/check_k1_k6.py . origin/main
PORT=8797 node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k3.js k3d /tmp/codex-t27/out/k3d.json
PORT=8797 INJECT=X4 K3_GROUPS=A11 node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k3.js k3d /tmp/codex-t27/out/k3d-X4.json
PORT=8797 node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k3.js k3b /tmp/codex-t27/out/k3b.json /tmp/codex-t25/ref
PORT=8797 node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k3.js a12 /tmp/codex-t27/out/a12.json
PORT=8797 node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k4.js /tmp/codex-t27/out/k4.json /tmp/codex-t25/ref
PORT=8797 K3_GROUPS=A1,A2,A3,A4,A6h,A10-S,A10-W-hold node --require /tmp/codex-t27/chromium.cjs qa/g3/test_g33_k3.js k3a /tmp/codex-t27/out/k3a.json
node /tmp/codex-t27/lpos.cjs
```

ใช้คำตอบ Python ที่ Codex สร้างใน T25 นอก repo ตรวจ SHA ซ้ำตรง baseline **3/3** และ diff ไม่แก้ oracle/pack/ภาพ ไม่สร้างใหม่ใน T27 ไม่รัน G3.2, X2/X3, S0 หรือ injection 19 แบบเดิมซ้ำ เพราะงานนี้ยืนยัน N2/X4 และ regression ที่ระบุ อาศัยผลรอบก่อนเฉพาะข้อที่ปิดแล้ว

ส่งเฉพาะ `REVIEW_CODEX_T27_G33.md` + หนึ่งบรรทัด `CODEX_STATUS.md` ไม่แก้ไฟล์ Claude/ภาพ/index.html ไม่แตะเซฟจริง ไม่ใช้เครดิต ไม่ commit helper/ผลดิบ
