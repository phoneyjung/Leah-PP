# T47 — ตรวจอิสระ G4.6 เกม 2.43

ฉบับ 0.10 · ผลฉบับ 1 + ตรวจไฟล์/โค้ด v2; runtime v2 ติดเครื่อง · วันที่ 13 พฤศจิกายน 2569 (ผลรัน 12 พ.ย.) · Codex · งานจาก `HANDOFF_TO_CODEX.md` @ `bab69ce` · ส่ง `codex/t47-review-g46` · เครดิต 0

**T46-N1/N2 ปิด 2/2; ยืนยัน M1–M10 ได้ 9/10 ข้อ ส่วน M6 มือถือยังไม่ปิด.** ชุดหลัก 8/8 errors 0, ชุดเกมคู่ 10/10, replay 0 px, M5 สองซูมผ่าน, M9 อยู่ในงบ และ cost_probe normal/inject/drop ผ่าน. พบช่องผ่านผิดในหน้าวัดฉบับ 1 สองกรณี และปัญหาซ่อนแผงหนึ่งกรณี. **ผลมือถือ 11 พ.ย. ถูกถอนแล้วตาม HANDOFF @0d6dd53 จึงไม่ใช้รับ G4.** สร้าง v2 @4fcb482 ได้ 313 ไฟล์และตรวจโค้ดแล้ว แต่ FULL selftest เปิด Chromium ไม่ได้ (exit 2); ยังไม่ยืนยัน 12/12 และยังไม่อนุมัติให้นำ v2 ไปวัดเพื่อรับงาน.

## ฐานและขอบเขต

- ฐานรายงาน `claude/g2-pilot @ bab69ce`; โค้ด/เครื่องตรวจ `claude/g4-char2 @ 0cd2fc1` (เกม `35b0ac4`, 2.43); คู่เทียบ `main @ eb60c65` (2.33)
- อ่าน `G4_6_REPORT.md` ฉบับ 1.0, แผน G4 ฉบับ 1.3 §8/§9/D-G4-7, `g46-results.json`, คำตอบ T46 ใน `G4_5_REPORT.md` §5 และโค้ดหน้าวัดมือถือ
- `git archive` ลง `/tmp/t47/main`, `/tmp/t47/b243`; สำเนาฝังผิด/หน้าวัด/ผลดิบ/dependency อยู่ใต้ `/tmp/t47` เท่านั้น ไม่เผยแพร่หน้าวัด ไม่แตะเซฟจริง ไม่แก้เกม/ภาพ/เครื่องตรวจของ Claude ใน repo
- Chromium 151.0.7922.173, Node 24.19.0, Python 3.12.14, Puppeteer 25.8.0, Playwright 1.63.0. รันชุดวัดต่อกัน ไม่รัน browser benchmark ซ้อนกัน
- รอบคู่แรกหยุดและไม่นำมาตัดสิน เพราะ 8790/8791 ถูกเซิร์ฟเวอร์ T41 เดิมใช้ (`OSError: [Errno 98] Address already in use`); หยุดเซิร์ฟเวอร์เก่าที่ระบุได้ แล้วใช้ OUT ใหม่ `pairs-clean` ทั้งชุด ไม่เอาผลคนละเกมมารวม
- เซิร์ฟเวอร์ localhost main:8820 / branch:8821 / สำเนาถอด fix:8822 / หน้าวัด:8823. ชุดเกมคู่ใช้ runner v3.3 ที่ 8790/8791 พร้อม preload `/tmp/t47/local-only.cjs` บล็อก HTTPS/WebSocket ภายนอกเหมือนกันทั้งสองฝั่ง; preload ไม่เปลี่ยน DOM/เกม/ผลตัดสินและไม่เขียนไฟล์ลง OUT. Browser context และ storage สร้างใหม่
- SHA-256 ของ `index.html` ที่ตรวจ: `b0c02d12696eae9efd0f28500258f45ee2d783fc6aa81064e84a41c5c5e25252`; main: `9fdff13ad58a46d8c15d03d5ce7b41ed7f74c6b8579f3a099f8d5cc4f6d22ca6`

## 1. ยืนยัน T46-N1 และ N2

**ปิด 2/2**

| ข้อ | ผลที่รันเอง | ตัดสิน |
|---|---|---|
| T46-N1 แผงสีค้างหลัง ready → failed | `test_245_gm` errors 0; `N.broken`: opened=true, st=failed, why=`portrait gm`, row=true, panel=false, set=false, pe=0 | ปิด |
| พิสูจน์ N1 ว่าชุดตรวจจับผิดจริง | สำเนานอก repo ถอดเฉพาะ wrapper `c234Paint` ของ 2.43 ออก: exit 1 / errors 1 ตรง `N panel only when ready`; `N.broken.panel=true` | จับปัญหาเดิมได้ |
| T46-N2 จำนวน K | `test_234_save`: K 24 = ready 3 + failed 21, `same=true` 24/24; รายงาน G4.5 §5 แก้เป็น 24 แล้ว | ปิด |

ตัวห่อใหม่อยู่ `index.html:7965`; ไม่เปลี่ยนเงื่อนไขเขียนเซฟ/สี แต่ถอดแผงเมื่อ UI ใช้ตัวใหม่ไม่ได้แล้ว การกลับ ready และเปิดแผงใหม่ยังผ่าน

## 2. M1–M10

| เกณฑ์ | หลักฐานที่รันเอง | ผล |
|---|---|---|
| M1 ธงปิดเหมือนเดิม | replay 24/24 ภาพ/canvas/สถานะ/ลำดับวาดต่าง 0; ชุดคู่ 10/10, 20 รอบ exit 0; flag off 5/5, ไฟล์/ไบต์ Char2 เพิ่ม 0; อ่าน full 115 ของ Claude แยกจากผลเอง | ผ่านตามขอบเขต T47 |
| M2 ทางสำรอง | files errors 0: cold 16, warm 16 (15 ไฟล์ + control/กรณีรวม), ผิดรูป 5, โหลดช้า timeout 19,977 ms แล้ววาดตัวเดิม | ผ่าน |
| M3 วาดจริง | draw errors 0; ใหม่ 107/107 เฟรม, old=0, feetBad=0; ทิศ 8/8 บ้าน 4/4; ถือ 21/21 เฟรมในถ้ำและ hunt1, 0/21 ในเมือง/ฟาร์ม; K1–K3 fallback ผ่าน; ตารางสิทธิ์ flag B 36/36 | ผ่าน |
| M4 จุดยึด | anchor errors 0; source 37 จุด bad=0, สูตร 1,536 ค่า bad=0, box 96 ค่า bad=0, off 16 ค่า bad=0; คำสั่งวาด/เอฟเฟกต์ตรง | ผ่าน |
| M5 ประตู/กล้อง | m5_cmp exit 0 ทั้ง 0.75 และ 1, 69/69 ต่อซูม, bad/errors/meta=0; selftest 10/10 exit 0 | ผ่าน |
| M6 ความลื่น | cost_probe pass/faithful 3/3; inject seen 3/3; drop exit 2. แต่ด่านมือถือ v1 มีช่องผ่านผิดและผลจริงถูกถอน | **ยังไม่ปิด** |
| M7 หน้าจอ | screens และ GM errors 0 ทั้ง phone/iPad; fallback/หมุนจอ/ภาพตรง/ใบยืมและปุ่มผ่าน; ตรวจภาพ GM ที่บันทึกจริงด้วยตา | ผ่าน |
| M8 เซฟ | T1–T12 ครบ 18 แถว; K 24 = ready 3 failed 21, เซฟเดิมไม่ทับ 24/24; O เปิด-บันทึกบน 2.33 same=true; แตะสีแก้เฉพาะกลุ่มที่เลือก | ผ่าน |
| M9 หน่วยความจำ | Char2 peak 13.51 MiB; ทั้งเกมเพิ่มสูงสุด 15.22 MiB; ตารางด้านล่าง | ผ่าน |
| M10 ออนไลน์ | net errors 0; mock ส่ง 18 ครั้งทั้งสองฝั่ง, 16 ช่อง, diff=[], pd ตรง, PS flags เดิม; ไม่ต่อ Firebase จริง | ผ่าน |

ชุดหลักที่รันเอง:

| คำสั่ง (จากสำเนาเกม 2.43) | exit | errors |
|---|---:|---:|
| `PORT=8821 node test_245_gm.js` | 0 | 0 |
| `PORT=8821 MAIN_PORT=8820 node test_234_save.js` | 0 | 0 |
| `PORT=8821 node test_234_files.js` | 0 | 0 |
| `PORT=8821 node test_234_flag.js` | 0 | 0 |
| `PORT=8821 node test_240_screens.js` | 0 | 0 |
| `PORT=8821 node test_237_draw.js` | 0 | 0 |
| `PORT=8821 node test_239_anchor.js` | 0 | 0 |
| `PORT=8821 node test_234_net.js` | 0 | 0 |

### M1 ชุดเกมคู่และภาพซ้ำ

รัน `suites_pair.sh` v3.3 ด้วย `MAIN_DIR=/tmp/t47/main BRANCH_DIR=/tmp/t47/b243 OUT=/tmp/t47/out/pairs-clean RERUNS=4 ONLY="test_153 test_154 test_155 test_171 test_174 test_185 test_188 test_226 test_227"` แล้วรัน `python3 -I -B qa/g4/suites_cmp.py /tmp/t47/out/pairs-clean` ได้ **exit 0 / pass**:

- 10 ชุด: `test_153_menu_icons`, `test_154_equipment`, `test_155_quiet_gold`, `test_171_kid_hud`, `test_174_compass_sit`, `test_185_age_line`, `test_188_map_columns`, `test_226_dress`, `test_226_switch`, `test_227_swipe`
- 20 รอบ (main/branch อย่างละ 10), bothPass=10, bad=[], undecided=[], metaOk=true, kindsRechecked=10, legacy=0; ทุกชุดผ่านรอบแรก ไม่ต้องใช้ rerun
- `ALLDONE`: `manifest=c960bcc4be9d3bee suites_sha=108cf44cebd29241 env_sha=a5acc5559745bcf6 target_sha=4e2cf2ea9c66070e`
- ไม่ใช้ OUT รอบที่พอร์ตชน; สำเนาเป็น archive จึงไม่มี local HEAD ของตัวเอง อ้างอิง SHA ต้นทางและ hash ไฟล์เกมที่บันทึกไว้แทน

ตรวจเลขของ Claude ใน `g46-results.json.M1_suites_pair`: 115 ชุด, 112 ผ่านทั้งคู่ + 3 ชุด ok หลังรันซ้ำ = 115; 230 รอบแรก + 3×8 รอบเพิ่ม = 254 ตรง `ALLDONE`. bad=0, undecided=0, metaOk=true, legacy=32. `test_103`, `test_170`, `test_222` มีข้อจำกัดฐานตามที่รายงาน; flaky 157/176/risk_monthly ผ่านทั้งคู่รอบแรกตาม summary. **นี่เป็นการตรวจความสอดคล้องของหลักฐานย่อของ Claude ไม่ใช่การอ้างว่ารัน 115 ชุดเองหรืออ่านผลดิบ 254 รอบแล้ว**

M1 replay ของ Codex: 24/24 checkpoints, metaOk=true, bad=0, pxTotal=0, canvasPxTotal=0, stateTotal=0, drawDiff=0; pageErrors/vcErrors=0. ธงปิดไม่มี Char2 เพิ่มในแคช: 0 ไฟล์ / 0 ไบต์. `index.html` 1,527,627 → 1,558,275 B = +30,648 B (+2.01%). `database.rules.json` และ `DATABASE.md` ตรง main; `char2.js` และ `c2-pack.json` ตรงรุ่น T46 (สองไฟล์นี้ไม่ได้อยู่ใน main จึงไม่อ้างว่าเทียบกับ main แล้ว diff 0)

### M9 หน่วยความจำ

`memory.js` ปกติ/`--patch '{"char2On":true}'` exit 0 ทั้งคู่:

| ขั้น | ธงปิด MiB | ธงเปิด MiB | เพิ่ม MiB |
|---|---:|---:|---:|
| หน้าเริ่ม | 136.83 | 136.83 | 0.00 |
| เมือง | 160.54 | 174.06 | 13.52 |
| ฟาร์ม | 193.91 | 207.43 | 13.52 |
| ปากถ้ำ | 205.88 | 221.10 | 15.22 |

ผ่านเพดาน +20 MiB ทุกขั้น. `test_240` Char2 peak 13.51 MiB ≤24; `test_245` วนสี 8 ลุค peak 12.95, แต่ละลุค trim 1, borrowed=0, กลับสีเดิม HUD/preview เหมือนเดิม; ปิดธง cache=0. เวลาสร้างภาพจาก test_240: idle 10.6 / walk 9.0 / portrait 4.2 / stand8 4.8 ms (รายงาน ไม่ใช่เพดานรับ)

### M6 ต้นทุนในเครื่อง

`cost_probe.js` v2: Chromium 151, CPU 4×, N=15, BL=30; exit 0 / verdict=pass.

| ฉาก | เวลาเฟรมเดิม ms | ต้นทุนผู้เล่นเพิ่ม ms | สัดส่วน | faithful |
|---|---:|---:|---:|---|
| cavemouth | 17.320 | -0.097 | -0.6% | True |
| capital | 29.933 | -0.192 | -0.6% | True |
| farm | 41.327 | +0.091 | +0.2% | True |

ปากถ้ำ/เมือง old และ new replay bytesDiff=0 และ stateBad ว่าง; ฟาร์มไม่มี shadow call ในรอบที่วัด จึงไม่มี shadow box ให้เล่นซ้ำ (faithful=true ตามกติกาตัวตรวจ ไม่ได้สร้างกล่องขึ้นเอง).

`INJECT_MS=3 BL=10` exit 0 / `inject seen`: cavemouth 3.197 ms / capital 3.141 ms / farm 3.443 ms; เห็น ≥2.4 ms ครบ 3/3. `DROP_STATE=globalCompositeOperation,imageSmoothingEnabled BL=2 MAPS=cavemouth,capital` exit 2 / verdict=errors / faithful=false 2/2 ตามที่ต้องการ.

ตัวเลข FPS ของ Claude (3 รอบ, errors 0) อ่านจาก summary เป็นข้อมูลประกอบ ไม่ได้รัน `fps.js` เต็มอีกชุดใน T47; ด่านที่รันเองคือ cost_probe และหน้าวัดมือถือด้านล่าง ไม่อ้างผล cloud เป็นมือถือจริง.

## 3. หน้าวัดมือถือและหลักฐานจากเจ้าของ

สร้างด้วย builder @0cd2fc1 และเทียบ bytes อิสระ: `page.html` ต่างจากเกมเฉพาะ 4 กลุ่มที่ระบุ (wrapper/title/เอา script config ออก/ต่อ bench). ไม่มี active script โหลด `firebase-config.js` และไม่มีไฟล์นี้ใน manifest; ชื่อยังอยู่ในคอมเมนต์เดิมของเกมหนึ่งแห่ง. สแกนรูปแบบ credential ใน page/ไฟล์ข้อความชุดเริ่มต้นไม่พบ; ไม่ใช่การรับรอง artifact ที่เผยแพร่โดยไม่ได้เห็น manifest ของมัน

รอบ discovery ของ Codexเก็บไฟล์ที่ขอได้ 199 ไฟล์ แล้วรัน normal/fault ด้วย manifest นี้ (ไม่ใช่ 140 ไฟล์ของ artifact เจ้าของ และยังไม่ใช่ชุดเต็ม 313 ของ v2). แยก origin ด้วยพอร์ต 8823; sentinel ของ storage 8821 ไม่เปลี่ยน, มีเพียงเซฟทดลอง, FB_CONFIG=false, Net.online=false, pageErrors=0. ไฟล์สร้างเองไม่ถูกเผยแพร่

| probe v1 | ratio เมือง/ฟาร์ม/ถ้ำ (ปัด 3 ตำแหน่ง) | checks | ผลที่หน้ารายงาน |
|---|---|---|---|
| normal | 0.997 / 0.999 / 1.000 | true 3/3 | pass |
| `c234Hold=()=>false` | 1.001 / 1.002 / 1.000 | true 3/3 | **pass แม้ไม่มี dc.held ในถ้ำ** |
| ไม่เรียก drawPlayer เดิมเมื่อ `!c234Use()` | 1.007 / 1.083 / 1.000 | true 3/3 | **pass แม้ตัดการวาดตัวเดิม 857 ครั้ง** |

**ข้อจำกัด probe รอบนี้ที่ต้องเปิดเผย:** รอบแรกของ harness timeout ระหว่าง click จึงไม่นับ; รอบถัดมาปิดแท็บ sentinel/bringToFront แล้วจึงรันจบ. ระหว่างตรวจภายหลังพบว่า request filter ของ Codex จัด `data:` URL ไว้ในกลุ่ม external และเรียก abort ด้วย จึงไม่อ้างว่ารอบนี้คงทรัพยากรภายในเกมครบทุกภาพ. เตรียมตัวกรองที่ยอมให้ data/blob แล้ว แต่คำสั่งทวนถูกยกเลิกก่อนรัน (ไม่มีผล phone-final). ตัวเลขในตารางเป็นผลที่เกิดจริงพร้อมข้อจำกัดนี้; ข้อบกพร่องของ predicate/การไม่ตรวจการวาดเดิมยืนยันได้จากโค้ดด้านล่าง และจะทวนด้วย harness ที่แก้แล้วใน v2

ผล 120/120 fps ของเจ้าของเดิม **ถอนแล้ว ไม่รับเป็นด่านและไม่ขอให้ใช้ผลเก่าอีก**. เดิมเป็นเพียงสรุปอัตราส่วนมัธยฐาน ไม่พิสูจน์ว่าไม่เสียเฟรมเลยทุกเฟรม; การชนเพดานจอไม่บอก headroom และเครื่องเดียวไม่แทนเครื่องอื่น. ไม่ได้เข้าถึงมือถือหรือ DOM ของ artifact เจ้าของโดยตรง

## 4. ปัญหาใหม่และคำตอบเรื่องรับ G4

### T47-N1 — กลาง: ตัวตรวจตะเกียงอ่านเงื่อนไขที่ควรถือ ไม่ใช่สิ่งที่ตัววาดใช้จริง

`phone_bench.js` v1 L52 อ่าน `DARK()&&LKID()` แล้วนำไปตัดสิน L84. แทน `c234Hold` ด้วย false ในหน่วยความจำก่อนกดเริ่ม: ตัวเกมส่ง `dc` ที่ไม่มี held ให้ตัววาด แต่หน้าวัดยังอ่านเงื่อนไขเดิมเป็น true. probe บันทึก `cavemouth:false` 1,465 ครั้ง, ไม่มี `cavemouth:true`, แต่หน้าวัดให้ checks=true และ pass. ไม่ได้แก้ counter/สูตรตัดสิน/ค่าของ benchmark โดยตรง. ควรตรวจ actor/config/คำสั่งวาดตะเกียงจริง และคงข้อยกเว้นทิศ N ตามสเปก ไม่อ่าน predicate ซ้ำเพื่อพิสูจน์ตัวเอง

### T47-N2 — กลาง: ธงปิดตรวจแค่ว่า Char2 ไม่ถูกวาด จึงไม่รู้ว่าตัวเดิมหาย

L85 ตรวจ `off.every(r=>r.body===0)` แต่ไม่มีหลักฐานเชิงบวกของการวาดตัวเดิม. probe ห่อ `drawPlayer` ให้ return เมื่อ `!c234Use()`, ฝั่ง on เรียกฟังก์ชันเดิมตามปกติ; update/การเดิน/rAF ยังทำงาน. ตัดการวาดเดิม 857 ครั้ง แต่ result pass, checks=true ทั้งสามฉาก. ควรนับการวาดตัวผู้เล่นจริงทั้ง on/off และมี negative control ที่เอาตัวเดิมออกแล้วต้องไม่ผ่าน. ค่า rAF สูงอย่างเดียวไม่ยืนยันว่าตัวละครถูกวาด

### T47-N3 — ต่ำ: hidden attribute ไม่ซ่อนแผงที่มี inline display:flex ในหน้าทดสอบแบบ standalone

v1 L26 กำหนด inline display:flex; L57 ใช้ `box.hidden=true`. วัดหลังคลิกได้ hidden=true แต่ computed display=flex, rect=844×390 และปุ่มเริ่มยังอยู่บนแผงบังฉาก. มีภาพระหว่างรันใน /tmp. ไม่อ้างว่า artifact ของเจ้าของมีอาการเหมือนกัน เพราะ host อาจมี CSS reset ที่ต่างกัน; หน้าที่สร้างควรซ่อนตัวเองได้โดยไม่พึ่ง reset ภายนอก. v2 เปลี่ยนมาใช้ style.display แล้ว แต่ผลรัน v2 ยังรอในฉบับนี้

รวมข้อพบใน **v1** สูง 0 / กลาง 2 / ต่ำ 1 (ข้อจำกัด harness ข้างบนยังต้องทวน runtime อย่างถูกต้อง). ปัญหาไฟล์ไม่ครบ/เครื่องไม่ใช่มือถือ/การวัดสะดุดที่ Claude พบเองเป็นข้อมูลเพิ่มเติมตาม HANDOFF ไม่ได้อ้างว่าเป็นการค้นพบอิสระของ Codex

**ยังไม่เสนอรับ G4 และยังไม่ให้ใช้ผลมือถือเดิม.** ส่งข้อค้นพบ v1 นี้ก่อนตามคำสั่ง; ผลตรวจ v2 และรายการที่ติดเครื่องอยู่ในข้อ 5; ยังไม่มีหลักฐานเพียงพอให้ปิดข้อพบทั้งสอง

ไฟล์ส่งมีเพียง `REVIEW_CODEX_T47_G46.md` และเพิ่ม `CODEX_STATUS.md` 1 บรรทัด. ไม่ส่ง raw/ภาพเต็ม/fixture/node_modules เข้า Git; ไม่เปิด PR ไม่ merge และไม่ push main


## 5. งานเพิ่ม @0d6dd53 — หน้าวัด v2 @4fcb482

### ทำเสร็จโดยไม่ต้องใช้ browser

- อ่าน `G4_6_REPORT.md` ฉบับ 1.1 ข้อ 2, builder v2, phone_bench v2 และ selftest ใหม่จาก archive `/tmp/t47/v2`. `index.html` ตรง v1 ทุกไบต์ จึงไม่ใช้การเปลี่ยนเครื่องตรวจไปกล่าวว่าเกมเปลี่ยนแล้ว
- สร้าง `/tmp/t47/bench2`: manifest **313/313** จาก `sw.js` 319 ชื่อหลังตัดรายการที่ระบุ; ทุก source path มีไฟล์จริง; ส่วนย่อย 250+63; ไม่มี firebase-config.js / tk-test.js / tk-pack.bin. `page.html` 1,586,373 bytes
- เทียบเนื้อหา page กับ index โดยถอดเฉพาะ 4 กลุ่มที่อนุญาต: ตรงทุกตัวอักษร. ไม่เผยแพร่สำเนานี้
- T47-N3: โค้ดเปลี่ยนมาใช้ `style.display` จึงแก้ต้นเหตุ inline flex ที่พบใน v1 แล้ว; **ยังไม่ได้ยืนยัน DOM จริงของ v2**

### ข้อพบเดิมที่ยังปิดไม่ได้จากโค้ด v2

| ข้อ | หลักฐาน @4fcb482 | สถานะ |
|---|---|---|
| T47-N1 ตะเกียง | `phone_bench.js:110,114` ยังเก็บ `DARK() && LKID()`; ไม่มีการตรวจค่าที่ `c234Hold` / actor / คำสั่งวาดใช้จริง | ยังไม่ปิด; ต้องทวน fault เดิมด้วยรอบเต็ม |
| T47-N2 ตัวเดิมหาย | `phone_bench.js:147` ฝั่ง off ตรวจเฉพาะสถานะ off และ `body===0`; ยังไม่มีหลักฐานเชิงบวกว่าตัวเดิมถูกวาด | ยังไม่ปิด; ต้องทวน fault เดิมด้วยรอบเต็ม |

การเพิ่มด่านเครื่อง/ไฟล์/การสะดุดไม่ได้เพิ่มหลักฐานสองอย่างนี้. นี่เป็นผลอ่านโค้ด ไม่ใช่การอ้างว่ารันแล้วเห็น v2 pass ผิด. selftest ใช้ `verdictIfCounted` สำหรับโหมดย่อ ส่วน actual verdict ของโหมดย่อเป็น void อยู่แล้ว; การทวน fault เดิมต้องไม่ใช้ void เพราะโหมดย่อเป็นข้อพิสูจน์ว่าด่านจับ fault ได้

### ติดเครื่อง — ผลรันจริง

รัน `FULL=1 NODE_PATH=/tmp/t47/pp/node_modules CHROME_EXE=/usr/bin/chromium node /tmp/t47/v2/qa/g4/phone_bench_selftest.js /tmp/t47/bench2 /tmp/t47/out/selftest.json`:

```text
Error: Failed to launch the browser process:  Code: null
[443447:443447:1112/184312.184013:ERROR:third_party/crashpad/crashpad/util/linux/socket.cc:45] setsockopt: Operation not permitted (1)
exit=2
```

**ไม่มีผล 12/12**: เปิด browser ไม่สำเร็จ ไม่ใช่ assertion fail ของ benchmark. การตรวจ TCP socket ใน sandbox ก่อนหน้านี้ก็ได้ `PermissionError: [Errno 1] Operation not permitted`. คำสั่งที่ขอเพิ่มสิทธิ์สำหรับทวน probe และ push ถูกยกเลิกระหว่างรออนุญาต จึงไม่เปิดคำขอเดิมวนซ้ำ ไม่อ้างว่า push สำเร็จ และไม่สรุปว่าเป็นปัญหาสิทธิ์ GitHub/token

ยังไม่ได้รัน: selftest 12 กรณี, ถอดด่าน ≥2 ตัว, ทวน fault เดิม 2 แบบด้วย filter ที่อนุญาต data/blob และการพิสูจน์ false pass ใหม่. จากการอ่านพบจุดที่ควร probe ต่อ เช่นไฟล์เกม HTTP 200 แต่ payload รูปเสีย (การตรวจไฟล์อ่านสถานะ/จำนวน bytes ไม่ตรวจ decode) และช่วงก่อน callback แรกของการวัด (gap เริ่มวัดหลัง callback แรก); **ยังไม่ตั้งเป็นบั๊กใหม่หรือใส่จำนวนข้อพบ เพราะยังไม่พิสูจน์ผลตัดสิน**

### คำตอบส่งต่อ

**ยังไม่รับรองให้เจ้าของใช้ v2 วัดเพื่อผ่านด่าน และยังไม่เสนอรับ G4.** T46-N1/N2 ปิด 2/2; M1–M10 ยืนยันได้ 9/10 ส่วน M6 มือถือยังค้าง. ข้อพบ v1 สูง 0 / กลาง 2 / ต่ำ 1; v2 กลางเดิม 2 ข้อยังไม่ปิดจากโค้ด, ต่ำเดิมแก้ต้นเหตุแล้วแต่ยังไม่ทวน runtime. ไม่มีข้อพบ v2 ใหม่ที่พิสูจน์สำเร็จ ไม่เท่ากับยืนยันว่ามีปัญหาสูง/กลาง 0

รายงาน v1 ถูกเก็บใน local commit `7f1fe7b`; การ push รอบนั้นถูกยกเลิกและยังไม่มีการยืนยัน remote. ฉบับนี้ส่งผลที่ทำได้พร้อม blocker ตามคำสั่ง ไม่รอเงียบหรือใช้ตัวเลขของ Claude แทนผลรันของ Codex
