# REVIEW_CODEX_T7_G24_S6
วันที่ 31 ต.ค. 2569 · อ่านและทดสอบโดย Codex · ฐาน `f3ec51235b0b23ba0cb66305cc52adbfa479298c` · เครดิต 0

**สรุป: ชุดเดิมรันผ่าน 35/35, exit 0 แต่ยังพบปัญหา 7 ข้อ (กลาง 4 / ต่ำ 3) จึงยังไม่แนะนำปิดงานตรวจ S6.** ไม่แก้โค้ด/ภาพ/เครื่องตรวจของ Claude; ส่งเฉพาะรายงานนี้กับ CODEX_STATUS หนึ่งบรรทัด เจ้าของยังเป็นผู้ตัดสิน QG-4 และการลองบนมือถือ/ลีอายังจำเป็น

## วิธีตรวจและผลรันจริง
อ่าน HANDOFF T7, AGENTS, HANDOFF_TEAM_ROLES v2, แผน G2.4 §3/6/7, สเปก 10 §4/v1.2/v1.3, สเปก 11 §5 และ S6 README/REVIEW_S6 ที่ฐานข้างต้น

รันจากสำเนา repo ที่ commit เดิม ไม่แก้ test:
```text
python3 -m http.server 8777 --bind 127.0.0.1
python3 -I test_g2_scene.py 8777 /tmp/t7-out
35/35
SUITE_EXIT 0
python3 -I qa/g2-4-scene/tools/trees.py
TREES 16 · bushes 42 · walk_behind 24 · in_slime_zone []
```
Python 3.12, isolated venv ที่ใช้ system packages + scikit-image 0.26.0; Playwright ใช้ Chromium ที่ติดตั้งในเครื่อง 151.0.7922.173 ผ่าน symlink ใน PLAYWRIGHT_BROWSERS_PATH ภายนอก repo (ไม่ได้แก้ launch ของ test) ต้องให้สิทธิ์ network เฉพาะคำสั่งเพื่อให้ server/browser ติดต่อ localhost ได้ ผลและ probe อยู่ /tmp; ไม่ส่งเข้า Git

| ตัววัด | Codex รันจริง |
|---|---|
| เดิน / รันซ้ำ | 60/60 ถึง; เหมือน 60/60; รวม simulated 386.0 s |
| จุดทึบ | 17 เป้า: A* พบ 0, ดันเข้าได้ 0, เท้าในจุดทึบ 0; push_warped 1 ตามผลจริง |
| สุ่มเดิน 300 s | 18,750 steps; ทึบ 0 / นอกแมพ 0 / ผิดประตู 0; warp 1 |
| ประตู auto / directional | 10/10; 26/26 เริ่ม; อยู่ในประตู 3,081 เฟรม, x ผิด 0 / บังตัว 0 |
| ยืนในประตู | 400 poses; บังหัว/ตัว 0; พื้นรองเท้าหลังธรณีสูงสุด 36 px ตามข้อยกเว้นรายงานเดิม |
| Wang | 392 cells / 435 vertices / missing 0 / visible seam 0; 3 vertices ใต้ปากถ้ำยกเว้นตาม test |
| y-sort / fade | 160/160; alpha 0.55 ที่ 208 ms, กลับทึบได้ |
| สีในภาพวาด | 8,548,064 samples; ใกล้สีสัญญาณทั้ง 3 สี 0 px ตามบริเวณยกเว้นใน test |
| สไลม์ | 3 ตัว / 36 cells / 8 dirs / hop 0–3 / สูง 54–55; static lamp overlap 0 |
| ความสว่าง | ทุ่งมืด 49.186% ของหญ้าใต้ไฟ; ถ้ำมี/ไม่มีไฟล์ตะเกียง 58.7/41.4 (70.53%) |
| กล้อง | E/S อย่างละ 150 เฟรม × 5 จอ: เปลี่ยนทิศตำแหน่งหน้าจอ 0 ทุกกรณี |
| fallback / error | 7 cases ผ่าน assertion เดิม; JS errors 0; ข้อจำกัดดู R2–R5 |
| CPU×4 FPS median | scene 60.3 / old cave 51.2 / old empty dark 60.3 |
| FPS ratio / CPU×1 | scene/cave 1.177; scene/dark 1.000; step+draw batch 2.41 ms/frame |

ผลลัพธ์ `results.json` SHA-256: `a61e1b67dad381d6d70a75f7edad0797608269cd24d7b8fdfd41d07942957a96`.
ดูภาพจริง phone-start, phone-door, probe-missing-hut-door และ probe-door-real-key แล้ว; ไม่ใช่ผลวัดบนมือถือจริง

## 1. ข้อ A1–A10 แก้จริงไหม
ตำแหน่งบรรทัดทั้งหมดอ้างอิงฐาน f3ec512

| ข้อ | ผล / หลักฐาน / ที่ / วิธีลอง |
|---|---|
| A1 กล้องสั่น | ผ่านในขอบเขตที่ทดสอบ: page 228–230 + 300–302 ปัด pos เดียวกัน; S8j 5 จอ E/S 150 เฟรม ไม่มี reverse jump ทุกจอ |
| A2 แนวตั้ง | ผ่าน: page 222–223 ใช้ด้านสั้น; 390×844@3 scale 3 เห็น 12.2 ช่อง; 844×390@2.625 scale 3; 667×375@3 scale 3; 820×1180@2 scale 4; desktop scale 3 (ชื่อ test เขียน small phone 2 แต่ผลจริง 3) |
| A3 ประตู | ผ่านเมื่อ asset ครบ: page 234–240/283/342; S2a–c ผ่าน; เพิ่มกด ArrowUp จริง 2 s จาก (193,300): ถึง (224,264.0048), inDoor true, บังตัว 0/2741 px, hut alpha 1. กรณี fallback ยังมี R2 |
| A4 สไลม์ในไฟ | ผ่าน: page 205–210 กรอง bounding box เทียบวงไฟจริง; ชุดเดิมตรวจทุก 4 เฟรม จึงเพิ่ม probe ทุกเฟรม 11,250 เฟรม × 3 ตัว / 180 s: drawnLitPx 0, drawnLitFrames 0, outOfZone 0, litCellFrames 0; 36 ช่อง/ครบ 8 ทิศ |
| A5 วาร์ปตัดทาง | ผ่านกรณีเดิม: page 257–260 ตัด exit ที่ไม่ใช่เป้าจาก A*; ในถ้ำเดิน (2,8)→(10,8) ถึงโดยยังอยู่ถ้ำ |
| A6 ไฟล์ไม่ครบ | แก้ guard ชั้นบนแล้ว page 102/104/120/164/173 และ catch 110/375; 7 cases เดิมผ่าน แต่ validation รายเฟรมยังไม่ครบ (R3) และ fallback บ้านมี R2 จึงยังไม่ใช่ทุกข้อมูลเสียผ่าน |
| A7 S-only slime | แก้จริง page 295 เลือก di=0 เมื่อ width<512; case S-only boot/draw ผ่าน แต่ชุดเดิมไม่วัด visibility แยกครบ 8 ทิศ |
| A8 aria-live | ผ่าน: page 287 dedup id; S8m ได้ 2 DOM mutations ใน 120 steps |
| A9 input | blur และ touch ปกติแก้แล้ว page 379–388; probe ยกนิ้วจริงด้วย touchEnd ได้ pointerup N, เหลือ E 1 นิ้วและเดินต่อ, ปล่อยหมดหยุด; แต่ mouse release นอก pad ยังเดินค้าง R1 และ S8k จำลองยกนิ้วผิด R5 |
| A10 ไม่มีตะเกียง | ผ่านกรณีไฟล์หายที่กำหนด: page 361 เปิด fallback light; ถ้ำไม่มี lantern files ยังสว่าง 41.4 เทียบปกติ 58.7; การตั้ง power 0 มืดโดยตั้งใจ |

A1/A3/A4 มีผล runtime ของ Codex เองตามข้างต้น ไม่ใช้ตัวเลขเดิมของ Claude แทน

## 2. บั๊กใหม่ / ปัญหาที่ยังเหลือ
### R1 — กลาง: ปล่อยเมาส์นอกแผงลูกศรแล้วเดินค้าง
- ที่: `pilot-g2-scene.html:382–386`. pointerup/cancel รับเฉพาะ pad และ mouse ไม่มี implicit pointer capture.
- ทำให้เกิด: กด N ด้วยเมาส์ → ลากขณะกดไป canvas (400,150) → ปล่อย → รอ 500 ms โดยยังอยู่หน้าต่างเดิม.
- วัดจริง: หลังปล่อย moving=true, PADP.size=1, y=352.8032; หลัง 500 ms ยัง true/1 และ y=328.8032 (เดินต่อ 24 px).
- เสนอ: capture pointer ตั้งแต่ down หรือฟัง up/cancel บน window พร้อมกรอง id; cleanup lostpointercapture. เพิ่ม real mouse drag-out/release assertion ต้องหยุดและ pointer map ว่าง.
- สถานะ: ยังไม่ผ่าน; เกี่ยว A9 แต่เส้นทาง mouse นี้ไม่อยู่ใน S8d/S8k.

### R2 — กลาง: ภาพบ้านสำรองทับตัวเด็กในช่องประตู
- ที่: `pilot-g2-scene.html:185,293,342–345`.
- ทำให้เกิด: block เฉพาะ `g24-hut.png`, เดินจาก (9,10) เข้า (7,8).
- วัดจริง: ตัวอยู่ (224,268), inDoor=true, hut alpha=1 แต่ไม่เห็นตัวในภาพ. เปลี่ยนภาพ idle ของตัวออกชั่วคราวในหน่วยความจำแล้วจับภาพ canvas ก่อน/หลัง ต่าง 0 px (ตัวถูกบังอยู่แล้ว).
- สาเหตุ: บ้านสำรองเป็นสี่เหลี่ยมทึบ; `hole` วาดสีมืดทึบทับอีกครั้งหลัง kid แทนเว้นช่องใส. ชุด S8g ตรวจที่ทุ่ง ไม่เดินเข้าประตูตอนบ้านหาย.
- เสนอ: fallback facade เว้นช่องประตูจริง (วาดเฉพาะกรอบรอบช่อง) และให้ด้านในมืดอยู่ชั้นพื้น; ตรวจ visibility ตัวใน D เมื่อ hut หายแยกต่างหาก.

### R3 — ต่ำ: anchor รายเฟรมผิดรูปแต่ holdOn ยัง true และแสงหายได้
- ที่: `pilot-g2-scene.html:102,148–154,303–319,361`.
- ทำให้เกิด: ใน response ของ hold-anchors เท่านั้น เปลี่ยน idle_hold.S[0].anchor เป็น `{"x":48,"y":60}` แทน array; frame อื่นคงเดิม; ตั้ง S idle f0.
- วัดจริง: hold=true, loopErr=null, lpos มี undefined/NaN (serialize เป็น [null,null]), last.lan=true แม้พิกัดวาดไม่เป็น finite; ไม่มี fallback เพราะ holdOn ยัง true.
- เสนอ: validate ต่อ frame ว่า anchor เป็น array ของ finite numbers 2 ค่า และ fist เป็นคู่พิกัด; ปิด hold/เปิด fallback light เฉพาะ frame ที่ใช้ไม่ได้. เพิ่ม malformed entry tests ไม่ใช่เฉพาะ object ชั้นบน.
- ขอบเขต: เป็นความทนทานต่อ JSON เสีย; asset ปัจจุบันไม่ได้มีข้อมูลนี้.

ไม่พบการหลุดแมพ/ติดในการเดินชุดเดิม ไม่พบ warp ผิดในกรณี A5. y-sort ที่วัด 160 กรณีผ่าน; ไม่อ้างว่าครบทุกพิกเซล/ทุกการกด. จอ 5 ขนาดผ่าน scale/camera. ไม่ได้ทดสอบ heap ระยะยาวหรือมือถือจริง; จากโค้ด FIST/FX/world สร้างคงที่, lhist มีหน้าต่าง 120 ms แต่ ST.warps สะสมตามจำนวนวาร์ป (ข้อสังเกต ไม่พบ leak runtime ในงานนี้)

## 3. ข้อทดสอบที่ผ่านได้ทั้งที่เกณฑ์ไม่ผ่าน
### R4 — กลาง: S8g รายงานเดินถึงหลัง teleport ถึงเป้าเอง
- ที่: `test_g2_scene.py:229–235` (evaluate block ของ fallback).
- ลำดับคือ goto(20,9) → sim → teleport(20,9) เพื่อดู fallback → คืน walked จากตำแหน่งล่าสุด.
- พิสูจน์ใน browser แยก (ไม่แก้ไฟล์): แทน PS.goto ด้วย ()=>null ชั่วคราว แล้วรัน evaluate block เดิมกับ g24 files หาย; ยังได้ walked=[20,9], colours=670, meanLum=79, loopErr=null, buildErrors=[] และ fallbackHits หลัก >0 ทั้งหมด.
- เสนอเก็บตำแหน่ง/lastAuto.done/fail ก่อน teleport, assert ว่าเริ่มคนละช่อง และถึงด้วย auto จริง; assertion ภาพสำรองแยกจากเดิน.

### R5 — กลาง: S8k ไม่ได้ยกนิ้ว N จริง
- ที่: `test_g2_scene.py:255` (touchMove [P2]); ขัดวิธีใน AGENTS Running and testing.
- event probe จริง Chromium 151: touchStart N/E แล้ว touchMove มีแต่ E ได้แค่ pointerdown N/E ไม่มี pointerup; PADP ยังมี 2 นิ้ว. Assertion E,true ผ่านเพราะนิ้วล่าสุดเป็น E อยู่แล้ว.
- ลอง touchEnd [P1] จริง: ได้ pointerup N, map เหลือ E 1 รายการ; touchEnd [P2] แล้ว map ว่างและ moving=false — ตัวโค้ดผ่านในเส้นทางนี้ แต่ test ไม่ได้พิสูจน์.
- เสนอส่ง touchEnd ของนิ้วที่ยกตาม helper ทีม และ assert event/pointer count รวมถึง second_finger_E (ปัจจุบันบันทึกแต่ไม่ assert).

### R6 — ต่ำ: test process ไม่คืน nonzero เมื่อมี FAIL
- ที่: `test_g2_scene.py:21,311–314`. ok() สะสม bool/print; ท้ายไฟล์ dump/print ไม่มี sys.exit ตาม passed.
- เมื่อ assertion เป็น false โดยไม่มี exception จะพิมพ์ FAIL แต่จบ exit 0 ได้; ข้อนี้เป็นการตรวจโค้ด ไม่ได้แก้ผลชุดจริงให้ fail.
- เสนอ `sys.exit(0 if R['passed']==R['total'] else 1)` และทดสอบ failure path. ผลรันจริงครั้งนี้ยังเป็น 35/35 ไม่ใช่ fail ที่ถูกซ่อนด้วย exit.

ข้อจำกัดเพิ่มเติมของความครอบคลุม (ไม่รวมเป็นบั๊กเพิ่ม): S6b วัดภาพทุก 4 เฟรม ไม่ใช่ทุกเฟรมตามคำบรรยาย (probe เพิ่มครั้งนี้ทุกเฟรมได้ 0); S8g branch fake JSON เก็บ pageerror แต่ไม่ผูก console-error listener และไม่ assert buildErrors; S2b idle f3 ไม่บังคับ blinkNow จึงไม่รับประกันวัดภาพกะพริบจริงทุกทิศ; S4a ตรวจตัวแทนหนึ่งชิ้นต่อชนิด ไม่ใช่ทุกชิ้น แม้ S4d ช่วยตรวจ placement แล้ว; S3b เปรียบเทียบ Wang labels ไม่ได้เทียบพิกเซล seam. แนะนำตั้งชื่อผลให้ตรงจำนวน/สิ่งที่วัดและเพิ่มกรณีสำคัญก่อนอ้างครบ

## 4. ตัวเลขเทียบสเปก 10 §4 + v1.3
**หน้าเล่นตรงตาม placement ที่ตรวจ**; `trees.py` ยังมีแบบจำลองเก่า R7.

| รายการ | ค่าที่ตรวจ |
|---|---|
| โลก | 28×14, T32, 896×448 |
| ต้นไม้ | 16; TREES ตรงผลรัน trees.py ทุก tuple; offset 8 ต้นตรง v1.3 |
| พุ่ม | 42; sprites ของ 32 px รวม 52 = bushes42 + PROP_AT8 + crystals2; “ของ 32” หมายถึงขนาด ไม่ใช่จำนวน32ชิ้น |
| เสาไฟ | 5; TL(col×32−48,(row+1)×32−128); sort=(row+1)×32−4 |
| บ้าน/ประตู | TL(96,32), sort287; x224, y≥264 ใน D; D หลังบ้านไม่จาง |
| ประตูรั้ว | TL(448,384), sort446 |
| ของ32 | TL ตรงช่อง, sort=row×32+30 |
| ปากถ้ำ | page181–182 วาด ground ที่ (448,−48), หลัง sprites ตาม v1.3; 192×192; ช่องจาก asset T6 54×74, พื้น y171 ในภาพ→world123 |
| เขตสไลม์ | ZONE47 → SLIME_CELLS36, body±25/สูง60; light center(col×32−8,row×32+24), R144 |
| บังตัวเกินครึ่ง | runtime24 / zone0 ตรง spec และ output trees.py |

### R7 — ต่ำ: trees.py ยังวาง props ตาม bbox แทนสูตร v1.3
- ที่: `qa/g2-4-scene/tools/trees.py:21–23,29–30,67` เทียบ `pilot-g2-scene.html:168–170`.
- รันจริงได้ trees16/bushes42/covered24 เหมือนหน้า แต่ geometry ของของที่ใช้คัดต้นไม้ไม่ตรง:
  - crate(11,8): tool (352,257),sort284; page (352,256),sort286.
  - rope(12,8): tool (384,259),284; page (384,256),286.
  - boulder(24,6): tool (768,194),220; page (768,192),222.
  - fence(12,13): tool (384,419),444; page (384,416),446.
  - bush(0,3): tool (0,99),124; page (0,96),126.
- เสนอเปลี่ยน placed_prop ให้ใช้ TLcellและsort+30 แล้วรัน picker/เทียบ TREES ใหม่ก่อนเปลี่ยนภาพใด. ไม่จำเป็นต้องเปลี่ยน placement ของหน้าในงานนี้; ตอนนี้ page test ยืนยัน 24 จริง ไม่ใช่กล่าวว่าหน้าผิดเพราะ tool เก่า

## 5. กติกาโครงการ
ผ่านในส่วน static/runtime ที่ตรวจ: art วาด 1:1 ลง BUF แล้วขยายครั้งเดียวเต็มเท่าตาม device pixels; imageSmoothingEnabled=false; ไม่มี ctx.filter/rotate/setTransform, ไม่มี flip. breatheW (113–115) ใช้ crop/เลื่อน 1 px ไม่ใช่ย่อสัดส่วน; เอฟเฟกต์วงแสง/เงาวาดด้วยโค้ดตามแผน. ภาพ source 11 ไฟล์ alpha0/255. ข้อความเกมใหม่ gate/cave/GM มีไทย+อังกฤษ; aria-label pad เป็นทิศ N/SE ฯลฯ ตามเดิม.

มี fallback แยกทุกชนิดหลัก รวม scene/cave/character/lantern แต่ไม่รับรองว่า fallback “ถูกทุกสถานะ” เพราะ R2/R3. เปรียบเทียบ source ก่อน/หลังงานไม่มีการแก้ page/test/images/index/sw. การส่งนี้เพิ่มเพียง report + status; ไม่ใช้ PixelLab/เครดิต ไม่เพิ่ม PR ไม่แตะ main

## 6. ความเร็วและข้อเสนอ
ผลนี้ใช้เครื่องต่างจาก Claude: CPU×4 scene [60.4,60.3,60.3,60.3,60.3], cave [49.5,51.2,51.4,51.2,51.3], dark [60.3,60.5,60.4,60.3,60.3]. Median 60.3/51.2/60.3; scene/cave117.7% ผ่านเกณฑ์90% ตามฐานที่เจ้าของเลือกแล้ว. CPU×1 step+draw2.41ms เทียบ Claude3.3ms. ไม่ตีความว่าเร็วขึ้นจากโค้ด เพราะไม่มีการเปลี่ยนโค้ดและ scene ชนเพดาน rAF ประมาณ60Hz; ยังไม่ใช่ FPSมือถือจริง

ข้อเสนอให้ Claude พิจารณาโดยคงพิกเซลเดิม:
1. page344 cull sprites แล้ว แต่สร้าง/เรียง list และคัด shadow/slimes ทุกเฟรม; pre-sort รายการ static แล้ว merge kid/slimes ตาม keyเดิม (รักษากฎ equal-sort) ลด allocation.
2. page280–284 covered() สแกน mask ทุก2px ทุก step; cache ตาม rounded player position/object แทนสแกนซ้ำเมื่อยืนอยู่ และคงเงื่อนไขfade/dtเหมือนเดิม.
3. page346 และ359 clear+composite darkness ทุกเฟรม; ใช้ cached static scene ส่วนที่ไม่เปลี่ยน/skip งานนอกviewportตาม bboxจริง โดยต้องเทียบ screenshot pixel-equality ทุก power/direction ก่อนรับ.
4. ตรวจ ST.paused: loop375 ยัง draw ทุก rAF โดยตั้งใจสำหรับ test; ถ้าทำโหมด pause จริงเพิ่มในอนาคต ควรหยุด redraw เมื่อไม่มี visual invalidation แต่ไม่เปลี่ยน semantics ของ API test เอง.
5. วัด p95/p99 frame time, heap trend หลายรอบวาร์ป และมือถือเจ้าของเพิ่ม; ไม่ลด resolution/scale/ภาพหรือเปลี่ยน baseline เพื่อให้เลขผ่าน

**ส่งกลับ:** พบ R1–R7 รวมกลาง4/ต่ำ3; ไม่มีการแก้ในงานนี้. ชุดเดิม35/35ยืนยันได้ แต่ไม่ลบล้าง probe ที่พบ. ให้ Claude แก้/ตอบแล้วตรวจอิสระต่อ
