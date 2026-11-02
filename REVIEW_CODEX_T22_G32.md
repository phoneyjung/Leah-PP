# T22 — ตรวจอิสระ G3.2 load/look

2 พ.ย. 2569 · ฐาน `5a7e27e8847a87ca22093b2aec6fc392fef1d850` · ส่ง `codex/t22-review-g32`

**ผลชุดที่ส่งมาตรงรายงานทั้งหมด แต่ยังไม่ควรปิดการตรวจ G3.2:** K2 **28/28**, K7 **35/35**, inject **4/4 exit1**, baseline SHA **20/20**, pack SHA **13/13** พบเพิ่ม **สูง0 / กลาง5 / ต่ำ1**: look โยน error กับ JSON ผิดรูป, ผลโหลดเก่ากลับมาหลัง release, แพ็กผิดผ่าน, จุดมือผิดผ่าน, ตารางเฉด portrait ผิดผ่าน และค่าบางตัวใน builder ยังพิมพ์เอง

อ่าน HANDOFF T22, `char2.js`, `c2-pack.json`, เครื่องมือใน `qa/g3/`, รายงาน G3.2, สัญญา renderer ข้อ7, migration ข้อ2–4 และแผนแถว load/look ไม่แก้ไฟล์ของ Claude/ภาพ/index.html ไม่ใช้เครดิต ไม่ใช้เซฟจริง การทดลองใช้หน้า `qa/g3/char2-test.html` และสำเนา JSON/ภาพเสียที่อยู่นอก checkout เท่านั้น

## 1. วิธีรันและตัวเลขจริง

สำเนาเสีย/สคริปต์เสริม/ผลตรวจอยู่ `/tmp/codex-t22/` นอก checkout `/workspace/t22-review` ไม่ได้ stage หรือ commit (`/tmp/.git` เป็นไดเรกทอรี placeholder ของ environment ไม่ใช่ repo งานนี้)

Playwright ใน environment หา bundled Chromium ไม่พบ จึงใช้ preload ภายนอก repo เลือก `/usr/bin/chromium` **151.0.7922.173** ให้ `chromium.launch()` เท่านั้น ไม่เปลี่ยน assertion, fixture, หน้า QA หรือไฟล์ชุดทดสอบของ Claude การพยายามครั้งแรกที่ browser หายเป็นข้อจำกัด environment ไม่ใช่ผลตกของผลิตภัณฑ์

```text
python3 -I qa/g3/build_pack.py . --check
python3 -I qa/g3/check_k1_k6.py . origin/main
python3 -I qa/g3/make_bad_files.py . /tmp/codex-t22/bad
python3 -m http.server 8792 --bind 127.0.0.1
PORT=8792 BAD=/tmp/codex-t22/bad node --require /tmp/codex-t22/chromium.cjs qa/g3/test_g32_load_look.js /tmp/codex-t22/out/normal.json
# ทำซ้ำด้วย INJECT=I1, I2, I3, I4 แยก OUT
```

preload ที่ใช้:

```js
const {chromium}=require('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=(opts={})=>launch({...opts,executablePath:'/usr/bin/chromium'});
```

| ตรวจ | ผลจริง | exit |
|---|---|---:|
| build_pack --check | matches · 4,022 B | 0 |
| check_k1_k6 | pass=true; index/sw/database rules ไม่ต่างจาก origin/main `eb60c65` | 0 |
| SHA baseline / pack | **20/20 / 13/13** | 0 |
| K2 ปกติ | **28/28**; page errors0, unhandled rejections0; โหลด7–166msในรอบนี้ | 0 |
| K7 ปกติ | **35/35**; 18ช่องจากT1–T12 +15กรณีchar2 +1กลุ่มไม่ใช่เซฟ(5ค่า) +1deprecated | 0 |
| I1 ข้ามตรวจ mask | K2 25/28 · K7 35/35 · fails3 | **1** |
| I2 ข้าม pd219 | K2 28/28 · K7 29/35 · fails6 | **1** |
| I3 look เขียน save | K2 28/28 · K7 2/35 · fails33 | **1** |
| I4 load โยนและเอา catch ออก | K2 23/28 · K7 35/35 · fails5 | **1** |

โหลดซ้ำหลังโหลดเสร็จคืนผลวัตถุเดิมจริง; release หลังเสร็จทำ total=0/look=null; โหลดใหม่ totalกลับเท่าเดิม แต่ไม่ได้ครอบคลุม release **ขณะยังโหลด** (R2)

ไฟล์: char2.js **16,384 B**, pack **4,022 B**, ไฟล์ที่แพ็กโหลดรวมแพ็ก **14ไฟล์ / 410,056 B** ตรงรายงาน ไม่เพิ่ม precache

fixed ที่ชุดตรวจอ่านจาก stats: images **5,308,416** + masks **5,308,416** + other **8,192** = **10,625,024 B** ตรงสูตรมิติ RGBA และผลรายงาน นี่ไม่ใช่การวัด peak/หน่วยความจำ browser อิสระของ K4 ซึ่งยังเป็นงานขั้นถัดไป

## 2. ตาราง load และ D1–D4

**เส้นทางสำรองของไฟล์หาย/ขนาดผิดที่ทดสอบตรงสัญญาข้อ7**: idleหายใช้walk f1 (แพ็กนี้ไม่ได้โหลด A2 สำรอง); walkหายใช้idle f1; ตัวหลักสองแผ่นหายกลับระบบเดิม; maskท่าเสียใช้สีดิบ; idle/walkhold/จุดมือ/ตะเกียงเสียปิดถือ; lightเสียยังถือได้ไม่เรือง; portraitหายไม่มีรูป และ mask/meta/shademapเสียควรใช้raw

ส่วนที่ยังไม่ยืนยันครบคือคำว่า **ข้อมูลเสีย** ทุกชนิด: ชุดเดิมส่วนใหญ่ทดสอบ404/ขนาดผิดหรือหนึ่งช่องที่เลือกไว้ จึงผ่านทั้งที่มี R3–R5 การคืน `modes` ถูกใน28กรณี ยังไม่ใช่การวาด fallback ถูกทุกพิกเซล (draw ยังไม่ผลิต)

| มติ | ข้อสรุป |
|---|---|
| D1 จุดมือเสียปิดถือ แพ็กเสียไม่พร้อม | รับหลักการตามสัญญาข้อ7; แยก core pack กับ optional hold เหมาะสม ควรปรับคำว่า “จุดยึดเสีย=ไม่พร้อม” ในแผนให้สอดคล้อง แต่ holdOk ปัจจุบันยังทำไม่ครบตามหลักการนี้ (R4) |
| D2 ฝัง renderOffset ในแพ็ก ไม่โหลด anchors ตอนเล่น | รับ: builder อ่าน renderOffset.dx จริงและ K1/rebuild ตรึงไว้; head_top จากalphaเป็นงานG3.3/K3b ไม่ได้ยืนยัน80เฟรมด้วย K2 นี้ |
| D3 ฝัง grip ไม่โหลด JSON ตะเกียงตอนเล่น | รับ: builder อ่าน lantern JSON grip จริง; ลดไฟล์ runtime โดยไม่เดาค่า |
| D4 SHAใช้ตอน QA ไม่คิดตอนเล่น | รับเป็นการเลือกวิธีตรวจ ไม่จำเป็นต้องเพิ่ม runtime SHA เพื่อแก้ข้อพบครั้งนี้ แต่ต้องตรวจ schema/ช่วงค่าที่นำไปใช้ให้ครบตาม R3–R5 ขนาดภาพตรงอย่างเดียวไม่ยืนยันข้อมูลทุกช่อง |

## 3. look, migration และ D5–D7

ลำดับสี pd219 → appearance169 → hcol/ecol → hc/ec → default แยกต่อสี, ค่า0ไม่หาย, ค่าติดลบ/null/ทศนิยม/เกินช่วงข้ามไปแหล่งถัดไป, เพศจาก gender194 ก่อน kid, ไม่มีฐานชายคืนnull ตรงเอกสาร สำหรับchar2 v2/setตรง ตรวจสี/ชิ้นทีละช่องและไม่แทนค่าที่ใช้ได้ด้วยค่าเก่า

รับ D5–D7 ทั้ง3ข้อในฐานะ API อ่านลุค:

- **D5:** Appearance ไม่มี from/บ้านเหมาะสม; fromเป็นข้อมูล audit ตอนย้ายเซฟ บ้านมาจากผู้เรียก renderer ไม่ใช่การลบข้อมูลออกจากsave
- **D6:** pd219Look แบบไม่มีแพ็กตรง dry-run oracle ที่ระบุ (v1 +5ชิ้นเป็นinteger≥1); ไม่อ้างว่าเทียบกับตัวตรวจที่โหลดชุดชิ้นส่วนแล้วครบทุกกรณี เช่นรหัสชิ้นเกินจำนวนสูงสุด งาน G4 ต้องคงสมมติฐานนี้ชัดเจน
- **D7:** objectใหม่เหมาะกับAPIไม่แก้input ต่างจากdry-runที่เก็บchar2เดิมได้โดยไม่ขัด T12 เพราะไม่มีการเขียนผลคืนsave

ชุดเดิม33กรณีที่เปรียบเทียบก่อน/หลัง save มี `unchanged=true` ทั้ง33 และ2กรณี JSON เพิ่มของ Codex ก็ไม่เปลี่ยนinput แต่ **โยน error** (R1) จึงยังไม่รับว่า look รับข้อมูลผิดรูปได้ครบ ไม่พบคำสั่ง localStorage/Store.save หรือทางเขียนเซฟจริงในโมดูล

## 4. ข้อพบที่ทำซ้ำได้

### R1 — กลาง: base ผิดรูปทำ look โยน error

`char2.js:198–202` ใช้ `p.bases[c.base]` ก่อนเช็กชนิดและ own property ทำให้ keyที่สืบทอดจากprototypeถูกอ่านเป็นbase หรือการแปลงobjectเป็นproperty keyโยนerror

หลังโหลดแพ็กจริงสำเร็จ เรียกด้วยข้อมูลที่ JSON.stringify/parse ได้ตามปกติ (ไม่มี getter/function):

```js
Char2.look({char2:{v:2,set:'c2',base:'__proto__'}})
// TypeError: Cannot read properties of undefined (reading 'hair')
Char2.look({char2:{v:2,set:'c2',base:{toString:null}}})
// TypeError: Cannot convert object to primitive value
```

ผลจริง **2/2โยน synchronously**, saveไม่เปลี่ยน ควรคืนnullเหมือนฐานที่ไม่รู้จัก ตาม API และไม่ทำผู้เรียกสะดุด แก้โดยตรวจ baseเป็นstring/own key ก่อน lookup และเพิ่มสองกรณีใน K7 ไม่ใช่แก้เฉพาะชื่อ `__proto__` แบบ blacklist

### R2 — กลาง: release ระหว่างโหลดปล่อยผลเก่ากลับมา และ stateไม่ตรงผล loadใหม่

`char2.js:138–142,177–181,230` ไม่มี generation/cancellation guard ก่อนกำหนด ST; releaseล้างตัวแปรแต่ doLoadเก่ายังทำงาน

วิธีทำซ้ำใช้ page.route หน่วงคำขอแพ็กA, เริ่ม load(A), เรียกrelease, แล้วปล่อยA:

- ทันทีหลังrelease: total **0**, look **null**
- เมื่อAเสร็จ: old result ready **true**, total **10,625,024**, lookกลับเป็นkid4 แม้ไม่ได้ขอโหลดรอบใหม่

ทดสอบเพิ่ม: หลังreleaseให้load(Bที่404)เสร็จก่อนปล่อยA ผลBเป็น `ready:false,failed:['pack']`; หลังAเสร็จการloadอีกครั้งยังคืนผลB **ready:false** แต่ stats=**10,625,024** และlookใช้แพ็กA เกิดผล/API stateคนละรุ่นจริง

ควรใช้หมายเลขรุ่นของการโหลดหรือยกเลิกคำขอ และไม่ให้ผลของรุ่นที่releaseแล้ว commit ST/CNT เพิ่ม regression ที่ควบคุมลำดับคำขออย่างนี้ ชุดเดิมรอโหลดจบก่อนrelease จึงไม่พบ

### R3 — กลาง: packOk ยังไม่ตรวจช่องที่จะใช้จริงครบ

`char2.js:28–59` ตรวจบางช่องเพียงชนิด แต่ไม่ได้ตรวจช่วง/ความสัมพันธ์ หรือไม่ตรวจเลย เปลี่ยนแพ็กทีละรายการผ่าน page.route โดยไฟล์อื่นเดิม:

| แก้หนึ่งจุด | ผลจริง |
|---|---|
| `timing.walk_ms=0` | ready=true, failed=[] |
| `timing.idle_loop=[99]` (idleมี4เฟรม) | ready=true, failed=[] |
| `budget.bytes=-1` | ready=true, failed=[] ขณะที่ total10,625,024 |
| `materials.recolour={}` | ready=true, failed=[]; raw=[] และ portrait='recolour' |
| ลบ `hold` descriptor | ready=false, failed=['internal'] แทนการจับแพ็กเสียที่ packOk |

กรณี recolourว่างทำ `Object.keys(R).every(...)` ใน kidMaskOk ผ่านโดยไม่มี4กลุ่มเลย ไม่ใช่ความผิดของภาพmaskหรือพิกัด จึงต้องตรวจ mapping/กลุ่มในแพ็กก่อนเข้าmask checkด้วย

ควรตรวจ descriptor hold/portrait และชนิดsrc/sizeครบ, ช่วงเวลา/loop/blink, งบและความสัมพันธ์ borrow, materialsและrampsตามschemaก่อนรับ แพ็กผิดต้องกลับระบบเดิมด้วย failed=['pack'] ยังไม่ควรส่งแพ็กเช่นนี้ไป G3.3 เพื่อให้tick/recolourไปเจอ99หรือ0ภายหลัง

ทดลองเพิ่มเติมเปลี่ยนชื่อสีแรกเป็น `__proto__` ก็ready=true แต่ไม่นับเป็นข้อผิดแยก เพราะ schema ยังไม่ได้ห้ามชื่อดังกล่าวโดยชัดแจ้ง ประเด็น R3 ยึดตัวเลข/ช่องที่ผิดความหมายแน่นอนในตารางข้างบน

### R4 — กลาง: holdOk อนุญาตมือว่างในทิศที่ต้องถือ

`char2.js:121–122` ยอมรับ anchor=nullทุกทิศ และ `[].every(...)` ผ่านสำหรับfistว่าง ไม่ได้จำกัดnullเฉพาะNตามD-HAND

เปลี่ยนสำเนาจุดมือทีละกรณี โดยไฟล์ภาพเดิม:

- `idle_hold.S[0].anchor=null`
- `walk_hold.SE[0].fist=[]` (metadata fist_pxเดิมยังมากกว่า0)

ทั้งสองกรณี **ready=true, failed=[], modes.hold=true** ซึ่งไม่ใช่การปิดถือเมื่อจุดมือเสียตามตารางload ควรเช็กทิศที่ต้องมีมือ/ความสอดคล้องรายการกำปั้นก่อนเปิดhold แล้วทดสอบว่าข้อมูลผิดนำไปสู่ failed=['hold'], hold=false ชุดเดิมทดสอบเพียงไฟล์หายและจำนวนเฟรม5

### R5 — กลาง: ตารางเฉดportraitผิดยังถูกเปิดโหมดrecolour

`char2.js:95` ตรวจแค่ Gอยู่ภายในความยาว `shade_index_by_G` ไม่ตรวจ **ค่าที่สมาชิกชี้ไป** ต่างจาก `pilot-g2-portrait.html:62–63` ซึ่งมี validMapตรวจintegerและช่วงของramp

ทำสำเนา shademap แล้วเปลี่ยน `materials['4'].shade_index_by_G` ทุกสมาชิกเป็น99 โดยคงความยาว ภาพmask/metaเดิม ผลจริง **ready=true, failed=[], portrait='recolour'** ทั้งที่hair rampมี5เฉด ต้องเป็นportraitrawพร้อมfailed=['portrait-mask']ตามรายงานข้อ2

ควรนำ semantic validation ของshademapมาตรวจครบก่อนเปิดrecolour ไม่ใช่อาศัย countของmaskแทนการตรวจlookup table ชุดเดิมตรวจshademap404 จึงไม่พบกรณีไฟล์โหลดได้แต่ค่าเสีย

### R6 — ต่ำ: builder ยังพิมพ์ค่า breathing และจำนวนเฟรมเองนอกข้อยกเว้นที่ประกาศ

`qa/g3/build_pack.py:62–65` เขียน frames4/6/6 และ `breathe={'dir':'W','frame':2,'cut':62}` เป็นliteral แม้มีข้อมูลใน JSON/Pilot ที่ล็อก รายงานข้อ1ระบุข้อยกเว้นเพียงbases/defaults/budget/blink_frame3 และบอกที่เหลืออ่านจากไฟล์ทั้งหมด จึงไม่ตรงโค้ด

พิสูจน์กับ **สำเนานอกrepo**: คัดลอกเฉพาะไฟล์ที่builderอ่านไป `/tmp/codex-t22/builder-copy/`, เปลี่ยน `anchors.anims.idle.code_breathing.W.cut_row` และ Pilot `cut=62,k=2` เป็น61ทั้งคู่ แล้วรันbuilderเดิม --checkกับโฟลเดอร์สำเนา ยังคง **exit0 / matches / 4022bytes**; outputไม่ได้ตามค่าbreathingที่ต้นทางเปลี่ยน

ค่าปัจจุบัน62และ4/6/6ถูกต้อง ไม่ได้พบภาพผิดวันนี้ และ K1 baseline SHA จะจับไฟล์ล็อกที่เปลี่ยนได้ จึงระดับต่ำ แนะนำอ่านค่า/deriveจากมิติจริง หรือassertว่าค่าที่อ่านเท่ากับliteralและเปิดเผยข้อยกเว้นในรายงาน แทนคำรับรองว่าอ่านทุกค่าแล้ว

## 5. build_pack: ส่วนที่อ่านจริง และข้อจำกัดของการยืนยัน

อ่านจริงจากดิสก์: มิติPNG/SHA13ไฟล์, renderOffset.dx, lantern.grip, RAMPS/RECOL/IDSผ่านAST, C/FEET/DIRS/เวลา/loop/blink/ease/NHOLE/ศูนย์แสง/กำลังlightผ่านregexจากPilot ตรงวิธีที่ระบุ; schema/id/ชื่อไฟล์เป็นโครงแพ็กและbases/defaults/budget/blink_frameเป็นค่าจากเอกสารที่เปิดเผยแล้ว ข้อยกเว้นที่ยังไม่เปิดเผยคือR6

`--check` ยืนยันว่า outputตรงกับวิธีสร้างในbuilder ไม่ได้พิสูจน์โดยตัวเองว่าทุกliteralถูกอ่านจากแหล่งอ้างอิง K1ช่วยตรึงSHAไฟล์ต้นทาง แต่ไม่แทนการอ่านโค้ดเรื่องนี้

## 6. สรุปความปลอดภัยของการเรียกและสิ่งที่ยังไม่ได้พิสูจน์

- **load Promise:** outercatchรับ error ของdoLoadและคืนผลfalseจริงในเส้นทางที่ตรวจ รวมแพ็ก descriptorหายที่ได้internal; ไม่พบ Promise rejection หลุดจากโมดูลปกติในชุดที่รัน แต่ไม่ยืนยันทุกเหตุขัดข้องเครือข่ายหรือคำขอที่ไม่ตอบกลับ
- **look:** ไม่เขียนsaveแต่มีsynchronous throwตามR1; การตรวจฐานผิดจึงยังไม่ครบ
- **ขอบภาพ:** pixelsเช็กnaturalWidth/Heightก่อนอ่าน และ breatheตรวจframe/cutอยู่ในช่องแล้ว ไม่พบการอ่านเกินขอบPNGจากเส้นทางปัจจุบันที่ตรวจ ค่าloop99เป็นข้อมูลที่หลุดไปขั้นถัดไป ยังไม่มีtick/drawให้กล่าวว่าเกิดการอ่านภาพผิดในตอนนี้
- **mask:** กรณีID0/G9/alphaไม่ตรงของชุดเดิมถูกจับ แต่การพึ่งmaterialsในแพ็กและการตรวจshademapยังมีR3/R5 ไม่อ้างว่าตรวจข้อมูลเสียได้ทุกแบบแล้ว
- **เกณฑ์ที่ยังรอ:** K2ภาพfallback/draw, K3, K4peak, K7encode/decode และชุดเกมK1ตามช่วงG3.5 ไม่ได้นับผ่านจากT22

เสนอแก้ R1–R5 และเพิ่ม regression ก่อนรับ load/look; R6 ปรับการอ่าน/ตรวจค่าหรือข้อความให้ตรง ไม่มีการแก้ผลิตภัณฑ์ในงานนี้

ส่งเฉพาะรายงานนี้ +1บรรทัด CODEX_STATUS.md สำเนาเสีย/ผลดิบ/preloadและprobeอยู่ภายนอกrepoทั้งหมด ต่างจากวิธีรันที่ระบุ: เลือกsystem Chromiumด้วยpreloadเพราะbundled browserไม่มี; ไม่เปลี่ยนเกณฑ์หรือชุดทดสอบ
