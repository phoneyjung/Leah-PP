# T24 — ยืนยัน G3.2 ฉบับ 1.2 / T23 N1

วันที่ 2 พ.ย. 2569 · ฐาน `19113f1` · เทียบ `d206fd5` · branch `codex/t24-confirm-g32`

**ปิด N1 ได้ → ปิด R3 ทั้งข้อได้ → ปิดขั้น G3.2 (load/look/ทางสำรอง) ได้ในขอบเขตการตรวจอิสระนี้** ไม่พบปัญหาใหม่: สูง 0 / กลาง 0 / ต่ำ 0

## 1. ผลรันจริง

| การตรวจ | ผลจริง | exit |
|---|---|---:|
| ชุดปกติ `test_g32_load_look.js` ที่ `19113f1` | K2 **44/44** · K7 **41/41** · fails 0 | 0 |
| load twice / release ระหว่างโหลด | ผ่านในชุดปกติ | 0 |
| ชุดเดียวกัน โดย `C2_FILE` เป็น `char2.js` จาก `d206fd5` | K2 **41/44** · K7 **41/41** · fails **3 พอดี** | 1 |
| กรณีอิสระชื่อสี `['black']` และ `null` | ปฏิเสธแพ็กถูกต้อง **2/2**: `ready:false`, `failed:['pack']` | 0 |
| กรณีข้อมูลถูกต้องเสริมจาก T23 | ยอมรับ **4/4**: `ready:true`, `failed:[]` | 0 |

สามข้อที่โค้ด `d206fd5` ตกคือ `pack colour name is an array`, `pack colour name is null`, `pack hex is an array`; ทั้งสามยังคืน `ready:true, failed:[]` ในรุ่นเก่า จึงยืนยันว่าข้อทดสอบใหม่จับพฤติกรรมเสียเดิมได้จริง ไม่ใช่เพียงเช็กหมายเลขรุ่น รุ่นใหม่ผ่านทั้งสามและไม่มีข้อเดิมตกเพิ่ม

## 2. ยืนยันกรณีของ Codex และตรวจ diff

เปิด browser context ใหม่ต่อกรณี ใช้ `page.route` ส่งสำเนา JSON แทนแพ็กให้หน้า `qa/g3/char2-test.html` โดยเปลี่ยนเฉพาะ `palette.hair[0][0]` เป็น `['black']` หรือ `null` แล้วเรียก `Char2.load` และ `Char2.look({hc:0})` ตาม probe T23 ผลทั้งสองปฏิเสธแพ็ก ต่างจาก T23 ที่รับแพ็กและคืนชื่อ black ซึ่งไม่มีเป็น string ใน palette

`char2.js:26` เพิ่ม `isName` / `isHex` ตรวจ `typeof v === 'string'` ก่อน regex; `packOk` ใช้ทั้งชื่อสีและแต่ละค่าสีที่บรรทัด 45 และใช้ `isName` กับชื่อ base ที่บรรทัด 54 ตรวจค้น `.test(` แล้วเหลือเพียงสอง helper นี้ จึงไม่มีทางเดิมที่ regex แปลง array/null เป็นข้อความก่อนตรวจ ความหมายของ regex สำหรับ string ที่ถูกต้องไม่เปลี่ยน

ลองข้อมูลถูกต้องเพิ่มเติมแบบเดิมทั้งสี่: สลับลำดับ key JSON, กลับลำดับจุดกำปั้น, ลบ optional `fist_px`, ลบ optional shade `group` ทุกกรณีโหลดสำเร็จ เปิด hold/light/portrait recolour ได้ และ `look({hc:0})` คืน black ที่มีชื่อ string ตรงในแพ็ก **4/4** ไม่พบการปฏิเสธข้อมูลถูกต้องในกรณีที่ลองนี้

## 3. ข้อสรุปการปิด

- **N1 ปิด:** ชนิดที่ผิดถูกปฏิเสธก่อน regex ทั้งชื่อและค่าสี; กรณีอิสระสองข้อและ regression สามข้อผ่าน
- **R3 ปิดทั้งข้อ:** T23 ยืนยันกรณีแพ็กเดิมแล้ว แต่ค้าง N1 เพียงข้อเดียว; T24 ปิด N1 และชุดปกติทั้งหมดผ่าน จึงไม่มีข้อค้าง R3 จาก T22/T23
- **G3.2 ปิดได้:** R1/R2/R4/R5/R6 ปิดจาก T23 และ diff นี้ไม่แก้ทางเหล่านั้น ตอนนี้ R1–R6 ปิด **6/6** ในงาน load/look/ทางสำรอง ไม่มีข้อใหม่ที่ขวางขั้นนี้ การปิดนี้ไม่ใช่การรับ G3 ทั้งระบบ: draw/แคช/portrait encode-decode และเกณฑ์ขั้น G3.3–G3.5 ยังต้องตรวจตามลำดับแผน
- **ปัญหาใหม่:** สูง 0 · กลาง 0 · ต่ำ 0 ในขอบเขต diff และกรณีข้างต้น ไม่อ้างว่าครอบคลุมแพ็กทุกชนิดในอนาคต

## 4. วิธีรันและขอบเขต

ใช้สำเนาเสีย/โค้ดเก่าและผลรันที่ `/tmp/codex-t24/` นอก checkout `/workspace/t24-review`; HTTP server เฉพาะ `127.0.0.1:8794` เปิดเฉพาะหน้า QA ไม่เปิดเซฟจริง

```sh
python3 -I qa/g3/make_bad_files.py . /tmp/codex-t24/bad
git show d206fd5:char2.js > /tmp/codex-t24/char2-v11.js
PORT=8794 BAD=/tmp/codex-t24/bad node --require /tmp/codex-t24/chromium.cjs qa/g3/test_g32_load_look.js /tmp/codex-t24/out/normal.json
PORT=8794 BAD=/tmp/codex-t24/bad C2_FILE=/tmp/codex-t24/char2-v11.js node --require /tmp/codex-t24/chromium.cjs qa/g3/test_g32_load_look.js /tmp/codex-t24/out/old.json
node /tmp/codex-t24/additional.cjs
```

ต่างวิธีรันเฉพาะ preload เลือก `/usr/bin/chromium` (Chromium 151) เพราะไม่มี bundled Chromium ของ Playwright; helper เปลี่ยนเฉพาะ executablePath ของ `chromium.launch` ไม่แก้ assertions/fixtures/โค้ดของ Claude ไม่รัน INJECT I1–I4 หรือ SHA/builder ซ้ำในรอบนี้เพราะ T24 จำกัดการยืนยัน N1 และ diff ไม่แตะสิ่งเหล่านั้น ใช้ผลเดิม T23 ประกอบเฉพาะการปิดข้อก่อนหน้า

ส่งเฉพาะรายงานนี้ + หนึ่งบรรทัด `CODEX_STATUS.md`; ไม่แก้โค้ด/ภาพ/index.html ไม่ใช้เครดิต ไม่แตะเซฟจริง และไม่ commit fixture เสียหรือผลดิบ
