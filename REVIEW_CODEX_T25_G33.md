# T25 — ตรวจอิสระ G3.3 ฉบับ 1

2 พ.ย. 2569 · ฐาน `59e7da1` · branch `codex/t25-review-g33` · อ่านและรันเท่านั้น · เครดิต 0

**ตัวเลขชุดหลักตรงรายงานทุกกลุ่มที่รัน; ฉีดผิด 19/19 ได้ exit 1 จริง** รับ D8–D18 ได้ในขอบเขต Pilot/ขั้น G3.3 พร้อมข้อจำกัดด้านการวัดที่ระบุด้านล่าง พบใหม่ **สูง 0 / กลาง 0 / ต่ำ 1**: actor ที่ผู้เรียกทำค่า `fi` เสียอาจทำให้ `draw()` คืน true ทั้งที่ภาพว่าง (N1) ไม่พบอาการนี้ใน actor ที่สร้างและเดินเวลาด้วย API ปกติ

## 1. ผลรันจริง

| รายการ | ผล Codex | exit |
|---|---|---:|
| `build_char2.js --check` / terser 5.36.0 | สร้างซ้ำตรงทุกไบต์; char2.js 20,957 B, source 36,232 B | 0 |
| `check_k1_k6.py . origin/main` | SHA baseline 20/20 · reference 4/4 · pack 13/13 · pack rebuild ตรง · เกม 3 ไฟล์ไม่เปลี่ยน | 0 |
| K3a เต็ม | **18,518 ภาพ** (9,259 ต่อ DPR 3/1) · hash ต่าง 0 · blink ต่าง 0 · coverage 160/160 ต่อ DPR | 0 |
| K3d เต็ม | **2,858 ก้าว** (1,429 ต่อ DPR) · รูแสงต่าง 0 · emissive ต่าง 0 · coverage 80/80 ต่อ DPR | 0 |
| K3b | **2,560/2,560 แผ่น · 10,240/10,240 ภาพประกอบ · 309/309 anchor** · head_top เทียบ JSON 80/80 | 0 |
| A12 | **48/48 + 27/27** ต่าง 0 · แบบ full-size blit 1:1 ต่างสูงสุด 1 ระดับสีตาม D10 | 0 |
| K4 | **1,952 operations**, แบบจำลองต่าง 0 · **8/8 จุดตรวจ** ตรงไบต์ · สี 6/6 · peak อิสระ **41,420,436 B = 39.502 MiB** | 0 |
| G3.2 regression | **K2 44/44 · K7 41/41** · load twice/release ระหว่างโหลดผ่าน | 0 |
| S0 ต้นฉบับไม่ฉีดผิด | K3a เต็ม / K3b / K4 ผ่านเหมือนไฟล์สร้าง | 0 ทั้ง 3 |

K3d ต่อ DPR: รูแสงจริง 1,357 (N 190), emissive 1,183; D3–D6, ไฟล์ตะเกียง/ชั้นเรืองหาย, E1 anchor+dc และ E2 dt ใหญ่ ผ่านทั้งหมด K3a กะพริบเริ่มก้าว 288/588 = 4,608/9,408 ms ตรงทั้งสองฝั่งทุก A10

K6: pack 4,054 B · โหลด 14 ไฟล์รวม 410,088 B · ไม่มีชื่อใหม่ใน sw.js · เหลือ 9,763 B ถึงเพดาน char2.js 30 KiB ตัวเลขนี้ยังไม่รวมงาน G3.4 ที่ยังไม่มี

### คำตอบ Python สร้างใหม่เองนอก repo

| ผลลัพธ์ | bytes | SHA-256 ที่ได้ (ตรง baseline ข้อ 7) |
|---|---:|---|
| sheets.json | 215,712 | `2c818d2ccd4b3430daacdec0ed10beea6330ce1785bf3e7acdcdc86749d12f1d` |
| composed.json | 821,152 | `8f6e0abfb8ca0dc018d993272ee1e55617047983502dcb2afb42bf35c3762832` |
| anchors.json | 6,542 | `bcc11caafff9577a0f9beef0d346b9ed3ba41784919676b4cff4912f0f6689f7` |

สร้าง `k3a-ref` ใหม่ด้วย: PNG idle / walk / walkhold ตรง `26194c12…787172` / `dc473a2f…c11a5` / `6ead87a7…68fa90` **3/3**; SHA เต็มตรงตาราง baseline ไม่ใช้คำตอบ JSON ที่ Claude สร้างไว้แทนการรัน

### ฉีดผิด 19 กรณี

ทุกแถวต่อไปนี้ exit 1; กลุ่มเวลาเลือกเฉพาะที่ต้องจับความผิด แต่รันทั้ง DPR 3 และ 1

| ชุด / injection | ผลที่ตกจริง |
|---|---|
| K3b B1 | แผ่น 2,559/2,560; ภาพประกอบผ่าน (จุดผิดอยู่นอก f1) |
| K3b B2 | แผ่น 0/2,560; ประกอบ 0/10,240 |
| K3b B3 | แผ่นผ่าน; ประกอบ 1,280/10,240 |
| K3b B4 | แผ่นผ่าน; ประกอบ 8,960/10,240 |
| K3b B5 | แผ่นผ่าน; ประกอบ 1,280/10,240 |
| K3a T1 / A6 | ต่าง 152 ก้าวต่อ DPR |
| K3a T2 / A10-S | ต่าง 24 ก้าวต่อ DPR |
| K3a T3 / A6h | ต่าง 7 ก้าวต่อ DPR |
| K3a T4 / A10-S | ต่าง 12 ก้าวต่อ DPR |
| K3a B4 / A2 | ต่าง 40 ก้าวต่อ DPR |
| K3a B5 / A3,A4 | ต่าง 350 + 280 ก้าวต่อ DPR |
| K3d B5 / A3,A4 | รูแสงตรง แต่ emissive ต่าง 350 + 280 ต่อ DPR |
| K3d T3 / A6h | รูแสงและ emissive ต่างอย่างละ 7 ต่อ DPR |
| A12 X1 | ผ่านเพียง 6/48 + 3/27 |
| K4 M1 | แบบจำลองต่าง 297 operations; resident ไม่เท่า total 3 จุดตรวจ |
| K4 M2 | ผืนที่ควรไล่ยังไม่เป็น 0 จำนวน 3 ผืน; resident ไม่ตรงที่ trim/release; peak 41.751 MiB |
| K4 M3 | แบบจำลองต่าง 389 operations; ปฏิเสธการยืมผิดจากเพดาน/วาดไม่ครบ |
| K4 M4 | แบบจำลองต่าง 295 operations; borrowed ค้าง 5,314,068 B และผืนไม่ถูกไล่ครบ |
| K4 M5 | resident ไม่ตรง **8/8** จุดตรวจ; peak 121.039 MiB |

### K4: ตัวเลขตรงไบต์ทั้ง 8 จุด

| จุดตรวจ | resident อิสระ = stats.total (B) |
|---|---:|
| load + warm-up | 11,848,608 |
| ก | 18,941,076 |
| ข | 40,237,812 |
| ค ยืม | 39,619,428 |
| ค คืน | 39,619,428 |
| ค2 | 39,619,428 |
| ง trim | 14,213,856 |
| จ release | 0 |

`fixed.other` 49,152 B; scratch 0; hit 1,880 / miss 62 / evict 55 / refused 21 / rebuilt 19; peak Char2 41,417,460 B ≤ peak อิสระ 41,420,436 B; load peak 23,664,448 B; จองสะสม 208.6 MiB เป็นข้อมูลประกอบ ไม่ใช่ resident รัน K4 ปกติหนึ่งรอบและ S0 หนึ่งรอบ ไม่อ้างว่ารันปกติซ้ำ 10 รอบเหมือนรายงาน Claude

## 2. ตัวตรวจเทียบของจริงไหม / มีโอกาสผิดเหมือนกันไหม

**K3a/K3d:** `openPilot` route เฉพาะแท็บ P ไป PNG อ้างอิง; `openChar2` แท็บ C รับไฟล์ดิบและจด SHA จาก response จริง; `servedOk` เทียบสองชุด SHA ก่อนให้ผ่าน (test_g33_k3.js:68–105, 170–172) มี 2 แท็บใน context เดียว, state เริ่มต้น/เวลา/สุ่มตรึง และเรียก PT.step/PT.draw จริง ไม่มีการเปลี่ยนไฟล์ Pilot ตัว hash เดินทุกพิกเซลทั้งผืนสอง lane 32-bit พร้อมขนาด; ถ้าต่าง replay ก้าวแรกที่ต่างแล้วนับ RGB/alpha จาก bytes ดังนั้น "ต่าง 0" ในรอบปกติยืนยันด้วย hash ทั้งผืน ไม่ใช่นับเฉพาะจุดตัวอย่าง; ไม่อ้างว่าอ่านเปรียบเทียบ byte ต่อ byte ซ้ำทุกก้าวที่ hash ตรง

**K3b:** `ref_char2.py` เรียก `qa_asset09_a3.render` ที่ตรึง SHA และใช้ numpy ประกอบ/คำนวณ geometry; ไม่อ่าน Char2 จากนั้นเทียบ SHA-256 ของ bytes จาก canvas จริงทั้งแผ่น/ภาพประกอบ แหล่งร่วมคือภาพล็อก, palette/pack และ anchors ตามสัญญา ไม่ใช่ผลวาดของโมดูล ด่าน K1 + rebuild ช่วยกันกรณีทั้งสองฝั่งอ่าน metadata ที่ผิดพร้อมกัน แต่ไม่ได้พิสูจน์ความถูกของสเปกศิลป์ใหม่ งานนี้ไม่ใช่การรับงานภาพใหม่

**A12:** คำตอบใช้ Char2 วาด alpha=1 scale=1 แล้ววาดครั้งเดียวด้วย alpha (test_g33_k3.js:303–315) จึงไม่ใช่ oracle ภาพอิสระอีกชุดด้วยตัวเอง หาก alpha=1 ผิดทั้งสองฝั่ง A12 อาจผ่าน ต้องรับร่วมกับ K3a/K3b; X1 ทำให้ตกจริงและจับการใช้ alpha ซ้ำต่างจาก round-off 1 ระดับได้

**K4:** ตัวนับห่อ createElement/getContext/ขนาด canvas, ImageData/getImageData/createImageData, Image และ typed-array buffers ก่อนโหลดโมดูล; แยก identity บัฟเฟอร์, weak reference และ FinalizationRegistry ไม่หักยอดเพียงเพราะ Char2 บอก release แบบจำลอง LRU ที่ส่วนท้ายไฟล์ไม่เรียก CACHE/entry ภายในโมดูล; คำนวณขนาดแผ่นจากแพ็กและกำปั้นจาก JSON จริง ตรรกะ reserve `2*sheet+16 KiB` สอดคล้อง implementation จึงเป็น implementation-aware model ไม่ใช่หลักฐานอิสระทั้งหมดด้วยตัวเอง; `FX` ยังใช้ fixed ที่บันทึกจาก stats ตอน load ด้วย แต่มี counter ของ allocation และ M1/M2/M5 แยกตรวจอีกชั้น ไม่สามารถพิสูจน์ประวัติว่าเขียน model ก่อนโค้ดจากไฟล์ปลายทางอย่างเดียวได้

การวัด K4 หลัง GC และ peak ระหว่างขั้นตรงกติกาที่อนุมัติ; เรียก GC หลังการสร้างแผ่นเพื่อตัดขยะรอบก่อน ไม่ใช่ผล RAM/GPU จริงของ browser ที่ปล่อยให้ GC ทำเอง ไม่เอา 39.502 MiB ไปอ้างว่า Chromium ทั้งโปรเซสใช้แค่นี้

**ข้อจำกัดครอบคลุม:** K3b ประกอบทุกสีเฉพาะ f1 สองท่า; K3a ครอบคลุมเฟรม/เวลาเต็มที่ลุคเริ่มต้น ผลสองชุดเสริมกัน แต่ไม่เท่ากับทุกสี × ทุกเฟรม × input ผิดทุกชนิด การฉีดผิด 19 แบบจับข้อเสียที่กำหนด ไม่ได้พิสูจน์ว่าไม่มีบั๊กนอกชุดทดสอบ (ตัวอย่าง N1 ด้านล่าง)

## 3. D8–D18

| ข้อ | ความเห็น Codex |
|---|---|
| D8 | รับ: K6 วัดไฟล์ที่หน้าโหลดจริง 20,957 B; terser ตรึง 5.36.0 สร้างซ้ำตรง และ S0 ตรวจพฤติกรรมต้นฉบับ ชื่อ API/field ไม่ถูก mangle; G3.4 ต้องรักษาเพดานเดิม |
| D9 | รับ: stats.peak เป็นตัวเลขโมดูลที่ต้อง ≤ counter อิสระ ไม่ใช่ยอดจองสะสม; ส่วนต่าง 2,976 B เปิดเผยและถูก counter นับใน peak แล้ว |
| D10 | รับร่วมกับ K3a/K3b: ผืน art-scale แล้วขยายตรงสัญญา A3; 48+27 ต่าง 0; full-screen 1:1 ต่าง 1 ระดับเป็นผลปัดเศษ ไม่ใช่อนุญาต alpha ซ้ำ |
| D11 | รับสำหรับไฟล์ Pilot ปัจจุบัน: compBox ครอบ body + union ตะเกียงทุกจุดยึด; 96×96 และ fixed.other 49,152 B วัดตรง การรองรับภาพรุ่นใหม่ที่ทำให้กรอบใหญ่ขึ้นต้องตรวจงบซ้ำ |
| D12 | รับ: A6h เพิ่ม coverage ที่ทำให้ T3 ตกจริง 7 ก้าวต่อ DPR |
| D13 | รับ: ยังไม่มี portrait; K4 ครึ่งรูปหน้าใหญ่ต้องไป G3.4 ตามแผน ไม่ถือว่าปิด K4 ทั้งแพ็กแล้ว |
| D14 | รับ: buffer identity, weak tracking, reset-size และ async GC ตรงนิยาม T19; M5 ทำให้เห็นบัฟเฟอร์ค้างจริง ไม่ใช่แค่อ่านตัวเลขโมดูล |
| D15 | รับ: power 10/0 ที่ฉากไม่เจาะรู ตรวจ light กับตารางฉากและ emissive แยกกัน ไม่เหมารวมว่าไม่มีรูคือผิด |
| D16 | รับ: hash ทั้งผืนต่อก้าว, replay ก้าวผิด, timer polling ไม่พึ่ง RAF ที่ถูกปิด; injection จับความต่างจริง |
| D17 | รับ: จำกัด dt 60 s ป้องกัน loop ค้าง; E2 ผ่าน ผลที่ยืนยันเทียบ Pilot คือ timestep 16 ms และช่วงที่ Pilot รับได้ ไม่อ้างว่าเวลาเกิน 60 s จำลองครบ |
| D18 | รับ: dc เป็น optional argument ที่ช่วยให้ anchor ตรงแผ่นที่ draw เลือก; E1 ผ่าน ผู้เรียกที่ dc อาจปิดถือควรส่ง dc เดียวกับ draw |

## 4. ตรวจ API เพิ่มด้วยวิธี Codex

1. **128 การวาด**: 8 สภาพไฟล์ (ครบ + หายทีละ idle / walk / walkhold / walk-mask / hold JSON / lantern / light) × 4 ทิศ S/E/N/W × ยืน/เดิน × ถือ/ไม่ถือ ทั้งหมดวาดได้ไม่ว่างและ actor ไม่เปลี่ยน ไม่อ้างว่าตรวจพิกเซลทางสำรองเหล่านี้ตรง oracle ครบทุกจุด (รอบนี้วัด nonempty/ผล API และความคงที่ของ actor)
2. **48 การวาด**: freeze actor, 8 ทิศ × 2 ท่า × alpha 0/0.35/1; ผ่าน 48/48 ไม่มี error และคืน globalAlpha, imageSmoothingEnabled, transform, fillStyle ตรงก่อนเรียก ดูภาพตัวอย่าง 16 ช่องที่สร้างจาก API จริงแล้ว: ทิศหลังไม่มีหน้า ตะเกียง N ซ่อนตามสัญญา ไม่แก้ไฟล์ภาพ
3. **input ผิดทั่วไป 8/8**: null actor, ทิศผิด, null app, ชื่อสีผิด, null dc, x=NaN, scale=0, scale=1.5 → false และพิกเซลพื้นเดิมไม่เปลี่ยนทุกข้อ ไม่พบ false หลังวาดไปแล้วในกรณีเหล่านี้
4. **ขอบ borrowMax แบบอื่น:** ยืม stand8 ต่างลุค 17 ผืน ได้ 16 และปฏิเสธ 1; `16×768×96×4 = 4,718,592 B` เต็ม borrowMax พอดี ยืมซ้ำผืนแรกยังเป็นผืนเดิมและ +0 B จากนั้นวาด 80/80 ครั้งขณะยืมเต็ม ผืนตรึงยังครบ; trim ทำ cache=0/borrowed คงเดิม; คืนทุกใบแล้ว trim ผืนเดิมเป็น 0×0 ครบ; release total=0 ค่า peak ของโมดูลรอบนี้ 41,617,568 B < 40 MiB (ไม่อ้างเป็น peak อิสระของรอบนี้)

อ่านโค้ดเส้นทางปกติไม่พบ draw แก้ actor, ไล่ pinned entry, หรือนับผืนเดียวซ้ำใน cache/borrowed ใบยืม release ซ้ำได้ และ canvas=null; ถ้าผู้เรียกเก็บ reference ผืนเก่าไว้ trim/release ล้างขนาดจริง ไม่ใช้ reference นั้นต่อหลังคืนใบยืมตามสัญญา

## 5. N1 — ต่ำ: ค่าเฟรม actor ไม่ครบ/เสีย ทำให้ draw รายงานสำเร็จทั้งที่ไม่วาด

ตำแหน่ง: `char2.src.js:355–357` (`frame`) และ `:390–408` (`draw` ตรวจเพียง object/dir ก่อนนำ kk ไป crop)

ทำซ้ำด้วยแพ็กปกติที่โหลดผ่านและ app/dc ถูกต้อง:

```js
const a = Char2.actor();
a.anim = 'walk';
a.fi = NaN; // อีก 3 กรณี: delete a.fi, a.fi = -1, a.fi = Infinity
ctx.clearRect(0, 0, 160, 160);
const ok = Char2.draw(ctx, Char2.look({}), {house:'wing', held:null}, a, 80, 120, 1);
// ได้ ok === true แต่พิกเซล alpha > 0 = 0 ทั้ง 4 กรณี
```

`NaN/undefined/Infinity` ทำให้ source rectangle ไม่มีค่าตัวเลข; `-1` ทำให้ source x=-96 อยู่ก่อนแผ่นทั้งช่อง Canvas จึงไม่วาดและไม่ throw แต่โมดูลคืน true ผู้เรียกที่ใช้ false เพื่อวาดตัวสำรองจะไม่ทำ fallback จึงได้ตัวว่าง ถ้า `anim='jump'` ยังถูกตีความเป็น idle และคืน true เช่นกัน

**จำกัดระดับต่ำ:** ต้องมีผู้เรียกทำสถานะ actor เสีย/ส่ง actor ไม่ครบ; ไม่เกิดใน actor จาก actor()+tick() ปกติที่ทดสอบ 18,518 ภาพ ไม่มีหลักฐานว่าการเล่นปกติทำค่า fi เสีย ไม่ใช่ข้อผิดของภาพหรือ baseline

ข้อเสนอ: ตรวจ anim, fi เป็น finite integer ไม่ติดลบ และ kk อยู่ใน frame-count ของแผ่นที่เลือกก่อนวาดชั้นแรก; กรณีไม่ครบคืน false โดยพิกเซลไม่เปลี่ยน แล้วเพิ่ม regression ที่ใช้ canvas ใสและมีพื้นเดิมอย่างละแบบ ไม่ได้แก้โค้ดให้เอง

## 6. วิธีรัน/ขอบเขตส่ง

checkout `/workspace/t25-review`; fixture เสีย, reference ที่สร้างใหม่, helper, log และผล JSON อยู่ `/tmp/codex-t25/` นอก worktree เท่านั้น ไม่ commit

```sh
# HTTP server เฉพาะ localhost ที่ root
python3 -m http.server 8795 --bind 127.0.0.1
NODE_PATH=/tmp/codex-t25/deps/node_modules node qa/g3/build_char2.js --check
python3 -I qa/g3/check_k1_k6.py . origin/main
python3 -I qa/g3/ref_char2.py . sheets /tmp/codex-t25/ref/sheets.json
python3 -I qa/g3/ref_char2.py . composed /tmp/codex-t25/ref/composed.json
python3 -I qa/g3/ref_char2.py . anchors /tmp/codex-t25/ref/anchors.json
python3 -I qa/g3/ref_char2.py . k3a-ref /tmp/codex-t25/ref/png
PORT=8795 node --require /tmp/codex-t25/chromium.cjs qa/g3/test_g33_k3.js k3a /tmp/codex-t25/out/k3a.json
# เปลี่ยน mode เป็น k3d / a12; k3b เพิ่ม /tmp/codex-t25/ref เป็นอาร์กิวเมนต์ท้าย
PORT=8795 node --require /tmp/codex-t25/chromium.cjs qa/g3/test_g33_k4.js /tmp/codex-t25/out/k4.json /tmp/codex-t25/ref
python3 -I qa/g3/make_bad_files.py . /tmp/codex-t25/bad
PORT=8795 BAD=/tmp/codex-t25/bad node --require /tmp/codex-t25/chromium.cjs qa/g3/test_g32_load_look.js /tmp/codex-t25/out/g32.json
```

ฉีด INJECT ตามตารางส่วน 1; K3_GROUPS ตามชื่อกลุ่มในตาราง S0 รัน K3a เต็ม/K3b/K4 ไม่กรองกลุ่ม ใช้ system Chromium 151 โดย preload เปลี่ยนเฉพาะ executablePath ของ Playwright เพราะไม่มี bundled browser ไม่แก้ assertions/เครื่องตรวจ terser 5.36.0 ติดตั้งและ cache ไว้นอก repo ไม่มีการใช้ PixelLab/เครดิต ไม่เปิดเซฟจริง ไม่แก้ Claude/ภาพ/index.html ไม่รัน G3.4/G3.5 และไม่อ้างว่ารัน G3.2 inject I1–I4 ซ้ำในงานนี้

ส่งเฉพาะ `REVIEW_CODEX_T25_G33.md` และ 1 บรรทัด `CODEX_STATUS.md` ให้ Claude ตรวจและตัดสิน N1 ต่อ
