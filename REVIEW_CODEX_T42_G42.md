# T42 · ยืนยันปิด G4.2 · ฉบับ 1.0

10 พ.ย. 2569 · คำสั่ง `HANDOFF_TO_CODEX.md` @ `cb4d2c6` · ฐานส่ง `codex/t42-close-g42` · ตรวจ `claude/g4-char2` @ `39459d2` (`cost_probe.js` v2 @ `6594d7d`, เกม 2.38 @ `568bd87`) · คู่เทียบที่ตรึงไว้ `main` @ `eb60c65`

**เสนอปิด T41-N1 และรับ G4.2 เพื่อเริ่ม G4.3 ตาม D-G4-7 ที่เจ้าของอนุมัติแล้ว** เครื่องวัดใหม่ผ่านทุกเงื่อนไขบน Chromium 151 มีข้อสังเกตต่ำ 1 ข้อเรื่องข้อความหัวเครื่องมือ ไม่ขวางการรับขั้นนี้ การวัดมือถือจริงยังต้องทำก่อนรับ G4 ใน G4.6

## 1. ผลรันจริง

Node 24.19.0 · Python 3.12.14 · Puppeteer 25.8.0 · Playwright 1.63.0 · Chromium **151.0.7922.173** · viewport 844×390 DPR3 · CPU4 · N=15 · BL=30 · LIMIT=.10 · รันแต่ละชุดต่อกัน ไม่มี browser test อื่นซ้อนระหว่างจับเวลา

### ปกติ: exit 0 / pass / faithful ทุกฉาก

หน่วย ms; ผลต่างแต่ละส่วนเป็นมัธยฐานของคู่ on−off ตามเครื่องตรวจ ไม่ใช่ผลลบของมัธยฐาน on กับ off

| ฉาก | body ต่าง | shadow ต่าง | tick ต่าง | playerDiff | frameMs เดิม | share ที่พิมพ์ | ผล |
|---|---:|---:|---:|---:|---:|---:|---|
| ปากถ้ำ | +.150 | −.263 | +.007 | **−.106** | 19.713 | −.005 | pass |
| เมือง | +.073 | −.263 | +.001 | **−.189** | 31.593 | −.006 | pass |
| ฟาร์ม | +.080 | 0 | +.001 | **+.081** | 42.840 | .002 | pass |

ทั้ง 3 ฉาก ready, page error 0, faithful=true; ต้นทุนเพิ่มสูงสุดที่วัดคือฟาร์ม .081 ms เทียบงบ 4.284 ms (10% ของ frameMs) ผ่านตามด่านใหม่ ไม่ใช้ตัวเลขนี้อ้างว่า FPS จริงดีขึ้นตามเปอร์เซ็นต์เดียวกัน

| ฉาก / เงา | สถานะที่เก็บก่อนเรียก | ไบต์ที่เทียบ | bytesDiff | stateBad | changedByReal |
|---|---|---:|---:|---:|---:|
| ปากถ้ำ / เดิม | multiply, smoothing=true, alpha=.3 | 67,800 | **0** | **0** | 18,264 |
| ปากถ้ำ / ใหม่ | multiply, smoothing=true, alpha=.55 | 8,316 | **0** | **0** | 2,205 |
| เมือง / เดิม | multiply, smoothing=true, alpha=.4 | 67,800 | **0** | **0** | 18,722 |
| เมือง / ใหม่ | multiply, smoothing=true, alpha=.55 | 8,316 | **0** | **0** | 2,205 |
| ฟาร์ม | ใช้ softAO เดิมทั้งสองทาง | N/A | N/A | N/A | N/A |

รวมการเทียบเงาที่มีจริง 4/4 ผ่าน 0 ไบต์ต่าง และทุกภาพมีการวาดเปลี่ยนพิกเซลจริง ไม่ใช่ภาพว่างเท่ากัน ฟาร์ม check.old/new=null เพราะไม่มีแผ่นเงา/ellipse ชุดนี้ จึงเป็น N/A ไม่อ้างว่าได้เทียบเงาฟาร์มเป็นศูนย์ไบต์ ส่วนสถานะเงาใหม่ในตารางเป็น **ก่อนเข้า c234Shadow**; helper ตั้ง source-over และ alpha=1 ภายในเอง จึงไม่ขัดกับการวาด ellipse จริง

### ตัดสถานะออก: exit 2 / errors

`DROP_STATE=globalCompositeOperation,imageSmoothingEnabled BL=2 MAPS=cavemouth,capital`

| ฉาก | เงาเดิม bytesDiff | เงาใหม่ bytesDiff | stateBad เดิม/ใหม่ | faithful |
|---|---:|---:|---|---|
| ปากถ้ำ | **14,072** | 0 | 2 / 2 | false |
| เมือง | **13,825** | 0 | 2 / 2 | false |

ชื่อที่ผิดตรงกับ 2 ค่าที่ตัดออก ทั้งสองฉากยัง ready และ page error 0 แม้ช่อง m6b คำนวณต้นทุนว่า pass แต่ผลรวมเป็น **exit 2** เพราะ replay ไม่ตรง จึงไม่เปิดทางให้ตัวเลขต้นทุนดีมาลบล้างหลักฐานที่ผิด เงาใหม่อาจเท่ากันหลัง helper ตั้งสถานะเอง แต่ stateBad ยังตรวจพบ ไม่ได้ใช้แค่ bytesDiff อย่างเดียว

### ฉีดความช้า: exit 0 / inject seen

`INJECT_MS=3 BL=10` ครบ 3 ฉาก; เกณฑ์วัดพบ ≥2.4 ms แยกจากด่านต้นทุน 10% ตามสเปกใหม่

| ฉาก | body ต่าง | shadow ต่าง | tick ต่าง | playerDiff | ขั้นต่ำ | ผล |
|---|---:|---:|---:|---:|---:|---|
| ปากถ้ำ | 3.375 | −.257 | .006 | **3.124** | 2.4 | inject seen |
| เมือง | 3.367 | −.277 | .001 | **3.091** | 2.4 | inject seen |
| ฟาร์ม | 3.459 | 0 | 0 | **3.459** | 2.4 | inject seen |

faithful=true, ready, page error 0 ทุกฉาก ไม่ตีความ exit 0 นี้ว่าโค้ดที่ฉีดช้าผ่านงบ 10%; หมายถึง negative control ถูกตรวจพบตามโหมดฉีดเท่านั้น

## 2. ตรวจโค้ดและ probe อิสระ

**snap/apply/same ครบสำหรับการเรียกที่วัดใน W3 ปัจจุบัน** (`qa/g4/cost_probe.js:49–52,73–84`): transform 6 ค่า, globalAlpha, globalCompositeOperation, smoothing enabled/quality, filter, shadow blur/color/offset ทั้งสองแกน เก็บและคืนจาก canvas เดียวกัน ไม่คำนวณสถานะที่คาดขึ้นมาแทนของจริง ไม่มี clip ครอบ W3; fillStyle/path ถูก c234Shadow ตั้งใหม่ก่อน fill จึงไม่ใช่สถานะค้างที่ต้องใช้กับ drawImage ส่วน stroke/font ไม่เกี่ยวกับการเรียกนี้

**before/after ยุติธรรมในขอบเขตปัจจุบัน:** เก็บพื้นใต้เงาก่อนและหลังเรียกจริงทันที จากนั้นวาง before เดิมคืนด้วย putImageData แล้ว replay ด้วยภาพ/argument/สถานะที่บันทึก; เทียบกับ after จริง และบังคับ changedByReal>0 กรอบคำนวณจากปลายสี่มุมที่ transform แล้วบวกขอบ 2 px ครอบการวาดนี้ ซึ่ง filter=none, shadowBlur=0 ไม่ใช้สูตรสร้างภาพเฉลยเดียวกับ replay เพื่อยืนยันตัวเอง กรณีในอนาคตเพิ่ม clip/filter/เงาฟุ้งต้องทบทวนกรอบและ state อีกครั้ง ไม่ใช่ oracle ทั่วไปสำหรับ canvas ทุกชนิด

**probe Codex เพิ่ม (exit 0):** ดัก drawImage ของ PS.shW/PS.shS และดักทางเข้า c234Shadow บนเฟรมจริง แยกจาก snap/apply/same ของเครื่องมือ พบเงาเดิมปากถ้ำ multiply/true/.3 และเมือง multiply/true/.4; เงาใหม่ขาเข้า multiply/true/.55; quality=low, filter=none, shadowBlur=0, shadowColor โปร่งใส, offsets=0 ตรงค่าที่ v2 เก็บ ฟาร์มไม่มีการเรียกสองทางนี้จริง probe เสริมใช้ viewport 844×390 DPR1 แบบ T41; ตัวตรวจพิกเซลและชุดจับเวลาหลักทั้งหมดใช้ DPR3 ตามข้อ 1

**tick วัดงานแกนหลักที่เพิ่มใน update จริง:** `cost_probe.js:85–92` เรียก c234Use + Char2.tick แบบ moving=true, dt=1000/60 และ holding ตามฉาก รวม animation/งาน lpos history ที่อยู่ใน Char2.tick; เทียบกับทางปิดที่ c234Use=false อย่างไรก็ตามไม่ใช่การจับเวลาทั้ง update wrapper: ใช้ dt คงที่, จับ dirs/holding ไว้ข้างนอก, ไม่รวม step/counter increments และ guard PAUSE/dead ทุกครั้ง จึงควรอ่านว่าเป็นต้นทุนแกน tick ใน microbenchmark ไม่ใช่เวลาของ update เกมทั้งหมด

การเพิ่ม tick ใช้ actor เดิม: probe อิสระเรียก 300 ครั้งแบบเครื่องมือแล้วได้ idle→walk, moving=true, fi=50 ทั้ง 3 ฉาก ขณะที่ P.moving=false ดังนั้นตำแหน่งผู้เล่นในโลกยังนิ่ง แต่ actor ไม่ได้ค้างท่า idle เดียวตลอด การวัดนี้ไม่ได้แทนเส้นทางเดินจริง/ทุกเฟรม/การเปลี่ยนทิศ/หน่วงการแตะบนมือถือ

## 3. ด่าน M6 และการรับ G4.2

**ตาม D-G4-7 ผ่าน:** cost ปกติ exit0 ทุกฉาก + faithful3/3 (เงาที่มีจริง 4/4 ต่าง0ไบต์) + DROP_STATE exit2 + inject exit0 พบครบ3/3 จึงปิด **T41-N1** ได้

ตรวจ diff `297c8b0..39459d2` แล้วเปลี่ยนเฉพาะ cost_probe, รายงาน และผล JSON; index.html/sw.js/char2.js/c2-* **diff0** เกมยังเป็น 2.38 จึงใช้หลักฐานฟังก์ชันและ FPS จาก T41 สำหรับขั้น G4.2 เดิม ไม่รัน FPS ใหม่ใน T42 ซึ่งคำสั่งรอบนี้ขอเฉพาะเครื่องวัด v2:

- T41: test237+test234 ครบ 5 ชุด errors0, M5 69+69/selftest10/10, M1 24/24 ต่าง0px
- FPS เดิมครบ 60 รัน/5 รอบ ไม่เลือกผล: เมือง ratio1.052/control.974, ฟาร์ม .970/.945, ปากถ้ำ .981/1.039; ผลเดิมยังเป็น **exit3** ไม่แก้ให้เป็น exit0
- ด่านแข็ง FPS เดิมผ่าน: pins/map/held/เดินจริง 60/60, ตัวใหม่ ready และวาด 10,478/10,478 เฟรม ครบ15/15ชุดที่เปิดธง

มติใหม่ทำให้อัตราส่วน FPS เป็นข้อมูลประกอบ จึงไม่ขวางการรับ G4.2 ครั้งนี้ ไม่ได้พิสูจน์ย้อนหลังว่า .883 ของ T40 เกิดจากเครื่องทั้งหมด การวัดความลื่นมือถือจริงก่อนรับ G4.6 ยังคงเป็นข้อบังคับ และรายงานนี้ไม่ใช่การรับ G4 ทั้งโครงการหรืออนุญาตเปิดให้ผู้เล่นทั่วไป

**เสนอรับ G4.2 เพื่อเริ่ม G4.3 ได้** ไม่มีปัญหาใหม่ระดับสูง/กลางจากขอบเขตที่ตรวจ

## 4. ข้อสังเกตต่ำ 1 ข้อ (T42-N1 · ข้อความหัวเครื่องมือ)

`cost_probe.js:2–4,20–21` ยังเขียนว่า “Not a gate yet / owner to decide” และว่า walking frames/easing ไม่อยู่ในเครื่องมือ ทั้งที่เจ้าของเลือก D-G4-7 แล้วและ v2 เพิ่ม walking tick บน actor ที่ใช้ต่อในบล็อกถัดไป ข้อจำกัดจริงคือยังไม่มีการเดินในโลก/ไม่ได้ครอบคลุมทุกท่าและการตอบสนองทั้งเกม อีกทั้งการวัดในหน้าเดียวช่วยลดผล drift แต่ไม่ได้พิสูจน์ว่าเครื่องแกว่ง “cannot enter” เลย

เสนอให้ Claude ปรับคำอธิบายให้ตรงกับมติและขอบเขตที่วัด ไม่ต้องแก้เกณฑ์หรือผลทดสอบ และไม่ขวางการรับ G4.2 ข้อจำกัด GPU/compositor นอก canvas, batching/forced readback, off=2.38 เอา actor ออกแทน main และ cache misses ที่ไม่ได้จำลอง ยังต้องคงไว้ ไม่อ้างว่าด่านนี้แทนมือถือจริงได้

## 5. วิธีรันและขอบเขตไฟล์

สำเนา `git archive 39459d2` อยู่ `/tmp/t42/b238`; dependency คัดจาก T41 มาที่ `/tmp/t42/pp` (เวอร์ชันเดิม) ด่านเครื่องผ่าน `ok Chrome/151.0.7922.173 Lantern Academy` และ `pw ok 151.0.7922.173`

ความต่างด้านเตรียมเครื่อง: พอร์ต8791มี server เดิมอยู่ (`OSError: [Errno 98] Address already in use`) จึงไม่ปิดบริการที่ระบุ process ไม่ได้ ใช้บริการเดิมหลังอ่าน HTTP เทียบ archive ใหม่ตรงทุกไบต์ **17/17 ไฟล์** ได้แก่ index/sw/char2 และ c2-*; cost_probe v2 ที่รันอ่านจาก `/tmp/t42/b238` โดยตรง ไม่ได้โหลดเครื่องมือรุ่นเก่าจาก HTTP ผลตรวจฐานอยู่ `/tmp/t42/out/http-source.json`

```sh
cd /tmp/t42/b238
export NODE_PATH=/tmp/t42/pp/node_modules CHROME_EXE=/usr/bin/chromium TMPDIR=/tmp/t42 PORT=8791
node qa/g4/cost_probe.js /tmp/t42/out/cost.json
DROP_STATE=globalCompositeOperation,imageSmoothingEnabled BL=2 MAPS=cavemouth,capital node qa/g4/cost_probe.js /tmp/t42/out/drop.json
INJECT_MS=3 BL=10 node qa/g4/cost_probe.js /tmp/t42/out/inject.json
OUT_DIR=/tmp/t42/out/own-shadow node /tmp/t42/own-shadow.js
```

ส่งเฉพาะรายงานนี้และเพิ่ม CODEX_STATUS.md 1 บรรทัด ไม่แก้โค้ด/ภาพ/สเปก/เครื่องตรวจของ Claude ไม่แตะเซฟจริง ใช้แต่ context ใหม่และเซฟสังเคราะห์ เครดิต0 ไม่ commit dependency/ผลดิบ/fixture/probe
