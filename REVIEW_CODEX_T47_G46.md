# T47 — ตรวจอิสระ G4.6 เกม 2.43

ฉบับ 1.0 · 13 พฤศจิกายน 2569 · Codex · งานหลัก @bab69ce + งานเพิ่ม @0d6dd53 · ส่ง `codex/t47-review-g46` · เครดิต 0

**T46-N1/N2 ปิด 2/2; M1–M10 ยืนยันได้ 9/10 ข้อ ยังไม่เสนอรับ G4.** FULL selftest หน้าวัด v2 @4fcb482 ผ่าน 12/12 exit 0 และถอดด่าน 2/2 ถูกจับได้ แต่ probe รอบเต็มของ Codex ยังให้ pass เมื่อตะเกียงไม่ถูกวาดและเมื่อไม่วาดตัวละครเดิม. ผลมือถือ 11 พ.ย. ถูกถอนแล้ว; **ยังไม่รับรอง v2 ให้เจ้าของวัดเพื่อปิด M6**. ผล runtime ล่าสุดและจำนวนข้อพบอยู่ข้อ 5; ข้อ 3–4 เก็บผล v1 พร้อมข้อจำกัดตามจริง

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

**ข้อจำกัด probe รอบนี้ที่ต้องเปิดเผย:** รอบแรกของ harness timeout ระหว่าง click จึงไม่นับ; รอบถัดมาปิดแท็บ sentinel/bringToFront แล้วจึงรันจบ. ระหว่างตรวจภายหลังพบว่า request filter ของ Codex จัด `data:` URL ไว้ในกลุ่ม external และเรียก abort ด้วย จึงไม่อ้างว่ารอบนี้คงทรัพยากรภายในเกมครบทุกภาพ. เตรียมตัวกรองที่ยอมให้ data/blob แล้ว แต่คำสั่งทวนถูกยกเลิกก่อนรัน (ไม่มีผล phone-final). ตัวเลขในตารางเป็นผลที่เกิดจริงพร้อมข้อจำกัดนี้; ข้อบกพร่องของ predicate/การไม่ตรวจการวาดเดิมยืนยันได้จากโค้ดด้านล่าง ผลทวนด้วย harness ที่แก้แล้วใน v2 อยู่ข้อ 5

ผล 120/120 fps ของเจ้าของเดิม **ถอนแล้ว ไม่รับเป็นด่านและไม่ขอให้ใช้ผลเก่าอีก**. เดิมเป็นเพียงสรุปอัตราส่วนมัธยฐาน ไม่พิสูจน์ว่าไม่เสียเฟรมเลยทุกเฟรม; การชนเพดานจอไม่บอก headroom และเครื่องเดียวไม่แทนเครื่องอื่น. ไม่ได้เข้าถึงมือถือหรือ DOM ของ artifact เจ้าของโดยตรง

## 4. ปัญหาใหม่และคำตอบเรื่องรับ G4

### T47-N1 — กลาง: ตัวตรวจตะเกียงอ่านเงื่อนไขที่ควรถือ ไม่ใช่สิ่งที่ตัววาดใช้จริง

`phone_bench.js` v1 L52 อ่าน `DARK()&&LKID()` แล้วนำไปตัดสิน L84. แทน `c234Hold` ด้วย false ในหน่วยความจำก่อนกดเริ่ม: ตัวเกมส่ง `dc` ที่ไม่มี held ให้ตัววาด แต่หน้าวัดยังอ่านเงื่อนไขเดิมเป็น true. probe บันทึก `cavemouth:false` 1,465 ครั้ง, ไม่มี `cavemouth:true`, แต่หน้าวัดให้ checks=true และ pass. ไม่ได้แก้ counter/สูตรตัดสิน/ค่าของ benchmark โดยตรง. ควรตรวจ actor/config/คำสั่งวาดตะเกียงจริง และคงข้อยกเว้นทิศ N ตามสเปก ไม่อ่าน predicate ซ้ำเพื่อพิสูจน์ตัวเอง

### T47-N2 — กลาง: ธงปิดตรวจแค่ว่า Char2 ไม่ถูกวาด จึงไม่รู้ว่าตัวเดิมหาย

L85 ตรวจ `off.every(r=>r.body===0)` แต่ไม่มีหลักฐานเชิงบวกของการวาดตัวเดิม. probe ห่อ `drawPlayer` ให้ return เมื่อ `!c234Use()`, ฝั่ง on เรียกฟังก์ชันเดิมตามปกติ; update/การเดิน/rAF ยังทำงาน. ตัดการวาดเดิม 857 ครั้ง แต่ result pass, checks=true ทั้งสามฉาก. ควรนับการวาดตัวผู้เล่นจริงทั้ง on/off และมี negative control ที่เอาตัวเดิมออกแล้วต้องไม่ผ่าน. ค่า rAF สูงอย่างเดียวไม่ยืนยันว่าตัวละครถูกวาด

### T47-N3 — ต่ำ: hidden attribute ไม่ซ่อนแผงที่มี inline display:flex ในหน้าทดสอบแบบ standalone

v1 L26 กำหนด inline display:flex; L57 ใช้ `box.hidden=true`. วัดหลังคลิกได้ hidden=true แต่ computed display=flex, rect=844×390 และปุ่มเริ่มยังอยู่บนแผงบังฉาก. มีภาพระหว่างรันใน /tmp. ไม่อ้างว่า artifact ของเจ้าของมีอาการเหมือนกัน เพราะ host อาจมี CSS reset ที่ต่างกัน; หน้าที่สร้างควรซ่อนตัวเองได้โดยไม่พึ่ง reset ภายนอก. v2 แก้ต้นเหตุแล้ว และผล runtime ในข้อ 5 ยืนยันว่าปิด N3 ได้

รวมข้อพบใน **v1** สูง 0 / กลาง 2 / ต่ำ 1 (ข้อจำกัด harness ข้างบนได้รับการทวนใหม่อย่างถูกต้องใน v2 ข้อ 5). ปัญหาไฟล์ไม่ครบ/เครื่องไม่ใช่มือถือ/การวัดสะดุดที่ Claude พบเองเป็นข้อมูลเพิ่มเติมตาม HANDOFF ไม่ได้อ้างว่าเป็นการค้นพบอิสระของ Codex

**ยังไม่เสนอรับ G4 และยังไม่ให้ใช้ผลมือถือเดิม.** ส่งข้อค้นพบ v1 นี้ก่อนตามคำสั่ง; ผลตรวจ v2 อยู่ในข้อ 5; runtime ยืนยันแล้วว่ายังผ่านผิดทั้งสองกรณี

ไฟล์ส่งมีเพียง `REVIEW_CODEX_T47_G46.md` และเพิ่ม `CODEX_STATUS.md` 1 บรรทัด. ไม่ส่ง raw/ภาพเต็ม/fixture/node_modules เข้า Git; ไม่เปิด PR ไม่ merge และไม่ push main


## 5. งานเพิ่ม @0d6dd53 — ยืนยันด้วย runtime v2 @4fcb482

### เตรียมเครื่องและความตรงของสำเนา

รอบก่อนติด sandbox (`setsockopt: Operation not permitted (1)`, selftest exit 2) และ push ถูกยกเลิกระหว่างรอสิทธิ์. รอบนี้เจ้าของสั่งให้ขอสิทธิ์อีกครั้ง: ติดตั้ง Puppeteer 25.8.0 และรัน Chromium **นอก sandbox หลังอนุญาตแล้ว** เปิดได้และรันครบ. `/tmp` จากเครื่องก่อนหายไป จึง archive/build ใหม่ทั้งหมด; ไม่เอาความล้มเหลวเปิด browser ไปนับเป็น assertion failure

- archive `4fcb482` → `/tmp/t47/v2`; build `/tmp/t47/bench2`: **313 ไฟล์ 26,892,217 bytes**, parts 250+63. ไม่รวม firebase-config.js / tk-test.js / tk-pack.bin. `page.html` 1,586,373 bytes. เนื้อหาเกมต่างเฉพาะ 4 กลุ่มที่กำหนด; index ของเกมยังตรง @0cd2fc1 ทุกไบต์
- ผล/dependency/สำเนาถอดด่านอยู่ `/tmp/t47` เท่านั้น. ไม่แก้เครื่องตรวจใน archive ไม่แก้ไฟล์ของ Claude ใน repo ไม่เผยแพร่หน้า ไม่แตะเซฟจริง
- ใช้ HTTP server 127.0.0.1 พอร์ตชั่วคราว, browser context ใหม่ต่อกรณี, UA/viewport จำลองมือถือ 844×390 DPR3. **นี่คือการทดสอบหน้าวัด ไม่ใช่ผลจากมือถือจริง**

### FULL selftest และการถอดด่าน

```sh
FULL=1 NODE_PATH=/tmp/t47/pp/node_modules CHROME_EXE=/usr/bin/chromium \
  node qa/g4/phone_bench_selftest.js /tmp/t47/bench2 /tmp/t47/out/selftest.json
```

**12/12, exit 0, retried=[]**: ok / desktop / nofile / unlisted / build / c2fail / stall / hidden / slowoff / slowon / lowfps / full ผ่านครั้งแรกทุกกรณี. รอบ full ได้ pass, reasons=[], files asked=198 / missing=0 / failed=0. อัตราส่วนเมือง/ฟาร์ม/ถ้ำ = 1.01 / 1.002 / 1. ทุกกรณี panelHidden=true และ noPageError=true

| สำเนานอก repo | สิ่งเดียวที่ถอดใน page.html | ตัวตรวจที่รัน | ผล |
|---|---|---|---|
| mut-device | `if (!dev.phone) reasons.push('device')` | `CASES=desktop` selftest เดิม | exit 1, 0/1, reasons + verdictIfCounted ตกทุกครั้ง 3/3 |
| mut-files | `if (!fl.ok) reasons.push('files')` | `CASES=unlisted` selftest เดิม | exit 1, 0/1, reasons + verdictIfCounted ตกทุกครั้ง 3/3 |

การลอง 3 ครั้งเป็นพฤติกรรมใน selftest ที่ล็อกเอง ไม่ได้คัดผลดีที่สุด; stdout เก็บครบ. ตัวตรวจทั้งสองจับการถอดด่านได้ **2/2**. ผล void ของโหมดย่อไม่ได้ถูกใช้แทนความถูกต้อง: ตัวตรวจเช็ก verdictIfCounted กับ reasons จึงยังตกเมื่อถอดด่าน

### ทวน false pass เดิมแบบรอบเต็ม และหาช่องใหม่

Harness ของ Codex (`/tmp/t47/own-probe.cjs`) ให้ server เสิร์ฟเฉพาะรายการ 313 ไฟล์ + page. ไม่กำหนด `__benchTest`/`?short`; เวลาเดิม 1.5s settle +5s วัด ×18 รอบ. รันทีละกรณีครั้งเดียวตามลำดับ control → no-lantern → no-old-body → wrong-image; ไม่รัน benchmark ซ้อนกัน. ไม่แก้ phone_bench/เกณฑ์/counters `C234.n.body`/ค่าผลตัดสิน. บล็อกปลายทางภายนอกเพื่อแยกเซฟ/ออนไลน์ แต่อนุญาต **data: / blob: / 127.0.0.1**; ไม่มีข้อผิดพลาด data URL ของ probe v1 แล้ว

| กรณี | ratio เมือง / ฟาร์ม / ถ้ำ | verdict / reasons | files asked / ขาด | หลักฐานอิสระ |
|---|---|---|---|---|
| control | 1.002 / 1.004 / 1.000 | pass / ไม่มี | 198 / 0 | ไม่ใส่ fault |
| no-lantern | 1.007 / 1.000 / 1.002 | pass / ไม่มี | 198 / 0 | cave dc.held=false 5900 / true 0 ครั้ง |
| no-old-body | 0.996 / 1.007 / 0.998 | pass / ไม่มี | 198 / 0 | งด drawPlayer เดิม 3518 ครั้ง |
| wrong-image | 1.001 / 1.004 / 1.001 | pass / ไม่มี | 198 / 0 | HTTP 200 ภาพถ้ำเหลือ 1×1 (เดิม 1536×1024) |

ทุกกรณี body/เดิน/แผนที่ตรวจ ✓ 3/3 ตามหน้าวัด; ไม่มี page error. เก็บตัวนับจาก wrapper อ่านค่าที่เกมใช้จริง ไม่อ่าน predicate ของ benchmark มายืนยันตัวมันเอง. แต่ละไฟล์ผลมี runs ครบ 18 รอบและผล cut/shaky เพื่อแยกการผ่านผิดออกจากความแกว่ง

**T47-N1 กลาง — ยังไม่ปิด (ยืนยัน v2):** แทน `c234Hold=()=>false` ก่อนกดเริ่ม แล้วอ่านผล `c234DC()` จริง. `phone_bench.js:110,114,146` ยังใช้ `DARK()&&LKID()` แทน actor/draw config. ฉากมืดยังได้ ✓ และ pass แม้ไม่มี dc.held. ต้องตรวจการถือที่ส่งเข้า renderer จริง พร้อม negative control นี้

**T47-N2 กลาง — ยังไม่ปิด (ยืนยัน v2):** ห่อ drawPlayer ให้ return เฉพาะเมื่อ `!c234Use()`; ฝั่ง on เรียกของเดิม. การเดิน/update/rAF คงทำงาน แต่ภาพตัวเดิมไม่ถูกวาด. `phone_bench.js:147` ตรวจ off/body=0 อย่างเดียวและยัง pass. ต้องมีหลักฐานเชิงบวกว่าฝั่ง off วาดตัวเดิมจริง และ test เอาการวาดเดิมออกแล้วต้องตก

**T47-N3 ต่ำ — ปิดใน v2:** ใช้ style.display แทน hidden; official 12 กรณี panelHidden=true และ harness ของ Codex ที่ไม่ใส่ CSS reset `[hidden]` ก็วัด startVisible=false. ไม่ใช้เพียงการอ่านโค้ดในการปิดข้อนี้

**T47-N4 กลาง — ใหม่: HTTP 200 ไม่พิสูจน์ว่าทรัพยากรที่โหลดเป็นภาพเกมถูกต้อง.** server ให้ `map-cave-mouth.jpg` เป็น PNG โปร่งใส 1×1 ที่ decode ได้จริง (68 bytes) แทนภาพถ้ำ 1536×1024; ไม่เปลี่ยนไฟล์ต้นทางหรือ manifest. full run เดิมบันทึก HTTP fault 1 ครั้งและ pass; probe สั้นแยกเพื่ออ่านชนิดภาพยืนยัน `IMG.mapCaveMouth` เป็น HTMLCanvasElement 1×1, alpha ทึบ 0 (เกมผ่าน plumCanvas) และ `MAPS.cavemouth` ใช้ painted map นี้ (`index.html:2766–2767`); แต่ `phone_bench.js:81–85` รับ HTTP 200, files.ok=true, missing/failed=0 และ full verdict=pass. จึงวัดฉากที่ภาพพื้นหลังหายเป็นหลักฐานผ่านได้. ควรตรวจความตรงของทรัพยากรสำคัญกับ build (เช่น hash หรือขนาดภาพที่ตรึง) พร้อม case HTTP 200 แต่ payload ผิด; ไม่ใช่เปลี่ยน threshold FPS

### ข้อสรุปล่าสุด

- T46-N1/N2 ปิด 2/2; หลักฐาน M1–M10 ข้อ 2 ยังยืนยัน 9/10; M6 มือถือยังไม่ครบ
- v2: สูง **0** / กลาง **3** / ต่ำ **0 ที่ค้าง**; N3 ปิดแล้ว. FULL selftest 12/12 ไม่ครอบคลุมสอง false pass เดิมและกรณีทรัพยากร HTTP 200 ผิดเนื้อหา
- **ยังไม่ให้เจ้าของใช้ v2 นี้วัดเพื่อรับงาน และไม่เสนอรับ G4**. ขอให้ Claude แก้ด่านตามข้อพบ เพิ่ม negative controls แล้วส่งให้ตรวจซ้ำ; ผลมือถือเดิมยังถูกถอน
- ไม่อ้างว่าได้ทดสอบ artifact host ส่วนตัวหรือมือถือจริง; ทุกผลใหม่คือ Chromium บนเครื่องทดสอบที่จำลอง UA/touch/viewport เท่านั้น

ไฟล์ส่งยังมีเพียง `REVIEW_CODEX_T47_G46.md` + `CODEX_STATUS.md` 1 บรรทัด; ผลดิบ/fixture/dependency ไม่อยู่ใน Git. ไม่มีการแก้เกม/ภาพ/เซฟจริง และไม่ใช้เครดิต
