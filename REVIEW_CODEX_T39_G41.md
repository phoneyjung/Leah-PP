# T39 · ตรวจยืนยัน G4.1 เกม 2.35 · ฉบับ 1.0

งานวันที่ 8 พ.ย. 2569 (Asia/Bangkok) · ตรวจโดย Codex ตาม HANDOFF รอบ 3 `claude/g2-pilot @9e30b2a` · เกมที่ตรวจ `claude/g4-char2 @959b1b1` (โค้ดเกม `4ba6784`) · คู่เทียบ `main @eb60c65` · ส่งต่อ `codex/t39-review-g41` จาก `0be131f` · เครดิต 0

ฉบับนี้แทนสถานะ “ยังไม่รัน” ในฉบับ 0.1/0.2 ประวัติเดิมยังอยู่ใน Git (`cdc4de9`, `1d3184f`, `0be131f`) ผลด้านล่างรันโดย Codex เว้นแต่ระบุว่าเป็นรายงานของ Claude

## 0. เครื่องและวิธีรัน

- ด่านใหม่ผ่าน **exit 0**: `ok Chrome/151.0.7922.173 Lantern Academy` จาก Puppeteer ที่เปิด `http://localhost:8791/?gm`
- Node `v24.19.0`, Puppeteer **25.8.0**, `/usr/bin/chromium` **151.0.7922.173**; ต่างจาก Chrome 153/Node 22 ในรายงาน Claude จึงวัด main และ branch บนเครื่องเดียวกันใหม่
- สำเนาด้วย `git archive`: `/tmp/t39/main`, `/tmp/t39/b235`, `/tmp/t39/b234`; dependency `/tmp/t39/pp`; ผล `/tmp/t39/out` ตามอนุญาตรอบ 3 ไม่สร้าง worktree ใหม่และไม่ git add/commit ใน /tmp
- ใช้ `NODE_PATH=/tmp/t39/pp/node_modules`, `CHROME_EXE=/usr/bin/chromium`, `TMPDIR=/tmp/t39`; คำสั่ง browser/server ใช้สิทธิ์ `additional_permissions.network.enabled=true` ของเครื่องมือ ไม่มี Chrome flag พิเศษนอกจาก `--no-sandbox` ตามชุดทดสอบ
- server ผูก `127.0.0.1` พอร์ต 8791 (2.35) และ 8790 (2.33); หยุด server เตรียมเครื่องก่อนให้ runner เปิดเอง ไม่แตะเซฟจริง ใช้ BrowserContext/เซฟสังเคราะห์
- `index.html`, `sw.js`, `char2.js`, `c2-pack.json` ของสำเนา 959b1b1 ตรงโค้ด 4ba6784 ทุกไบต์; ชุด Char2 15 ไฟล์ **432,546 B** SHA ตรง Pilot @9e30b2a **15/15**

## 1. ผล test_234 ทั้ง 4 ชุด

รันชุดเดิมจาก `/tmp/t39/b235` โดยตั้ง `PORT=8791 MAIN_PORT=8790 OUT_DIR=/tmp/t39/out/test234-<ชื่อ>` ไม่แก้ test หรือโค้ดเกม

| ชุด | ผล Codex | รายละเอียด |
|---|---|---|
| flag | **errors 0 · exit 0** | ค่าไม่ใช่ true 5/5 off และไม่ขอ Char2; ใครใช้ได้ 36/36; on ขอ 15 ไฟล์ไม่ซ้ำ; ปิดระหว่างโหลด 4 รอยต่อผ่าน; A→B→A ไม่เขียน B; ปุ่ม/สองครั้งล้างผ่าน; cold SW Char2 0 B |
| files | **errors 0 · exit 0** | cold 16/16 failed; warm ลบ cache+บล็อก 15/15 failed และ control ready; bad image/JSON 5/5 failed; หน่วง 25s → timeout ที่ **19,954 ms**, ผลมาช้าไม่กลับ ready |
| save | **errors 0 · exit 0** | M แหล่งสี 9/9; fixture ช่องเดิมไม่เปลี่ยน 9/9; K **24 แถว = ready 3 + failed 21**, same **24/24**; ปิด/ล้าง/ย้ายใหม่ผ่าน; O รัน main 2.33 จริง **ไม่ skip** |
| net | **errors 0 · exit 0** | off/on ส่ง **18/18**, field 16 ช่อง (ไม่นับ t) ต่าง 0; pd=`1,1,1,1,1,4,3,2`; PS flags เท่าก่อนส่งภายในแต่ละ mode; page error 0 |

รายละเอียดสำคัญ:

- flag-off 5 แบบ: absent/false/1/"true"/{} → requests 0, ไม่มี script, ไม่มี S.char2, page error 0
- ปิดระหว่าง pack/body/lantern/portrait: off ทันทีและยัง off เมื่อผลเก่ามา ไม่มี char2; เปิดใหม่ ready; แต่ละกรณี script 1 ครั้ง, requests 15/unique 15 (การเรียก API load สองครั้งใช้ Promise เดิม ไม่ใช่ network ซ้ำ)
- A→B→A: B off ไม่มี char2 ทั้งหน่วยความจำ/เซฟ; A ready มี char2; requests ไม่ซ้ำ
- GM ปุ่มสูง **44 px**, เปิดค้างไว้แล้วสถานะแสดง ready; แตะล้างครั้งแรกยังมีลุค/ธง ครั้งที่สอง off และไม่มี char2 ใน Store
- cold SW: cache `lantern-v237`, มีไฟล์ทั่วไป 199; Char2 **0 ไฟล์ / 0 B**
- fallback hash อ่านทุก RGBA byte; ทุกกรณี failed แผ่นตรง ref `512x64:650618397|384x512:1654765220` และถูกวาดบน canvas **59–61 ครั้ง/ช่วงประมาณ 1 วินาที**; reference 60, ไม่จอขาว
- save O: `version=Lantern Academy 2.33`, `on=true`, `same=true`, `coins=5`, `pe=0` หลัง main เล่น/บันทึกข้อมูลใหม่ ไม่ใช่ errors 0 ที่ข้าม O

## 2. N1–N3 ปิดได้ไหม

### N1: ปิดได้

`c234Exact` ที่ `index.html:7781–7785` ตรวจรูปภายในหลัง Char2.look ก่อน ready อยู่ในชั้น G4 ไม่แก้ G3 และไม่เขียนข้อมูลเดิมทับ เกณฑ์ตาม REPORT ฉบับ 1.2 ข้อ 4 ชัดขึ้น: คีย์/ชิ้น/สี/เพศที่ไม่ตรงต้อง failed; ยอมเว้น `from` และ optional slots ได้

นอกจาก K 24 แถว รัน probe ของ Codex เพิ่มใน browser จริง (แต่ละแบบไม่อยู่ในรายการ K เดิม):

| เซฟผิดเพิ่ม | สถานะ | ค่า char2 ใน S และ Store หลัง save |
|---|---|---|
| `parts.eyes = 0` | failed / save look unreadable | เดิมทุกค่า |
| ลบ `parts.outfit` | failed / save look unreadable | เดิมทุกค่า |
| `color.skin = {name:'deep'}` | failed / save look unreadable | เดิมทุกค่า |
| `parts.face_acc = false` | failed / save look unreadable | เดิมทุกค่า |
| `from = null` | failed / save look unreadable | เดิมทุกค่า |

same ใน K/probe หมายถึงค่า `char2` ไม่ใช่อ้างว่าเวลา/ตำแหน่งหรือทุก field ของเกมที่กำลังเล่นหยุดเปลี่ยน; ช่องเก่าเทียบแยกใน fixture M 9/9

รวม **5/5 failed + same**, page errors 0, probe exit 0; ตัวอย่างปกติที่ไม่ใส่ optional slots/ไม่ใส่ from ยัง ready และไม่ถูกทับ **2/2** ไม่พบการปฏิเสธตัวอย่างปกติผิดจากชุดที่ตรวจ (ไม่อ้างว่าครอบคลุมเซฟทุกแบบ)

probe เสริม lifecycle: กัก c2-pack.json แล้วกดปุ่มเปลี่ยนผู้เล่นจริง `#swP` ใน Settings ให้ reload ก่อนปล่อยคำขอ → `S===null`, `cur=-1`, C234 off, หน้าเลือกแสดง, เซฟไม่มี char2; ไม่สร้างลุคย้อนหลังหลังออกหน้าเลือก

ไม่ได้รันตัวเลือก test_save รุ่นใหม่กับเกม 2.34 ทั้งชุด ตัวเลข “รุ่นเก่าผิด 15 แถว” เป็นของ Claude ไม่ใช่ผลรัน Codex ในรอบนี้

### N2: ปิดได้

พบ `play-src/src/45_net.js` ใน `play-src.zip` จริง ไม่ใช่ไฟล์ root เปรียบเทียบ bytes ของ `play-src.zip`, `database.rules.json`, `DATABASE.md` กับ main → ตรง **3/3**; ZIP ตรงจึงรวมสมาชิก 45_net.js ด้วย รายงานแก้ path แล้ว ส่วน Net ที่ runtime ใช้อยู่ใน index; diff 2.35 ไม่เปลี่ยนบล็อก Net เดิม และ test_net ยืนยัน payload จริง 18 คู่ต่าง 0 (ไม่ทดสอบ Firebase จริง/สองเครื่อง)

### N3: ปิดได้

`test_234_files.js:44` เปลี่ยน `i+=7` เป็น `i++` จริงและชุด browser ผ่าน Independent probe ใช้ฟังก์ชัน h ที่อ่านจากไฟล์เดิม/ใหม่ แก้ byte ทีละตำแหน่งใน RGBA 64 bytes: รุ่นเก่าจับ **10/64**, รุ่นใหม่ **64/64** ตรงช่องว่างที่แจ้งไว้ ไม่ได้เปลี่ยนเครื่องตรวจหรือ criteria

## 3. test_227 และ trace

คำสั่งจริง: `MAIN_DIR=/tmp/t39/main BRANCH_DIR=/tmp/t39/b235 OUT=/tmp/t39/out/t227 ONLY="test_227" RERUNS=4 bash qa/g4/suites_pair.sh` แล้วใช้ `suites_cmp.py` ในชุดเดียวกัน

- runner exit 0, comparator **exit 0**, `suites=1`, `runs=2`, `bothPass=1`, `bad=[]`, `undecided=[]`, `metaOk=true`
- main **1/1** errors 0 (**35.1s**), branch **1/1** errors 0 (**35.6s**); output hashes ตรง `420d22787fbae72e` ทั้งคู่
- ปัด scroll 50 ครบ **8/8**, stock คงเดิม, placed 0, ไม่ค้าง drag; กดค้าง/ลาก stock **2→1** ทั้งสองฝั่ง
- **RERUNS=4 เป็นจำนวน retry เมื่อมีรอบไม่ผ่าน**; เมื่อรอบแรกผ่านคู่ runner ไม่สร้างอีก 4 รอบ จึงไม่รายงานเป็น 5/5
- อ่าน `/tmp/t39/out/t227.trace`: `server.main.log` **2,503 บรรทัด**, `server.branch.log` **2,503 บรรทัด** ไม่พบ HTTP error line; `sys.tsv` **2 แถว** ตรงลำดับ main→branch; failure JSON **0 ไฟล์** ตามเงื่อนไข preload ที่เขียนเฉพาะ exit ไม่ใช่ 0 การไม่มี JSON ไม่ใช่คำอ้างว่ามี failure trace แล้วไม่พบ pending requests
- loadprobe N=30 ของ Codex: main **30/30**, med **976 ms**, max **1,243 ms**; branch **30/30**, med **992 ms**, max **1,152 ms**; hung 0 ทั้งคู่, over10s 0, stalls [], page errors 0, crash null, exit 0 ตัวตรวจนี้อ่าน pending ระหว่างรอถ้าเกิน 8s ไม่ใช่เก็บทุก request ต่ออีก 8s หลังทุกหน้าที่โหลดเร็ว

รอบ 2.34 เดิมยังไม่มีข้อมูลพอชี้ root cause; ไม่แก้ผล exit 1 เดิม ไม่เพิ่ม timeout และไม่แทน raw เดิมด้วยรอบที่ผ่าน รายงาน Claude ของ 2.35 เพิ่มหลักฐาน full suite 115 ชุด/242 รอบ exit 0 (112 ผ่านคู่, 3 ตกเดิม) แต่ Codex ไม่ได้รันครบ 115 เอง

**คำตัดสิน:** สำหรับ root cause ของเหตุการณ์ 2.34 เลือก **“ต้องหาสาเหตุต่อ”** — ไม่มี trace ของครั้งนั้นพอให้ยืนยันว่าเครื่องเป็นต้นเหตุหรือชี้ว่าโค้ดถอยหลังจริง ไม่ลงความเห็นว่า “พิสูจน์แล้วว่าเป็นเครื่อง” จากการรันซ้ำที่ผ่านเพียงอย่างเดียว

สำหรับการรับ **โค้ด 2.35** ใช้ผล M1 รอบใหม่ตามเกณฑ์เดิม: test227 ผ่านคู่, loadprobe 60 หน้าไม่ค้าง, ชุดคู่ที่เลือกด้านล่างไม่มี regression และข้อมูล full suite ของ Claude เป็นหลักฐานประกอบ จึงไม่ถือเหตุการณ์ที่ยังอธิบายไม่ได้ของรอบเก่าเป็นหลักฐานว่า 2.35 ตกโดยอัตโนมัติ เสนอให้เดินหน้าขั้นถัดไปได้โดยคงบันทึกเหตุการณ์เก่า/trace ต่อไป การตัดสินนี้ไม่เปลี่ยนผล exit 1 ของรอบ 2.34 เป็นผ่าน และไม่ประกาศว่าแก้สาเหตุโหลดค้างแล้ว

## 4. ชุดเกมคู่ที่เลือกเอง 5 ชุด

คำสั่ง runner v3.3: `MAIN_DIR=/tmp/t39/main BRANCH_DIR=/tmp/t39/b235 OUT=/tmp/t39/out/selected5 ONLY="test_103 test_105 test_109 test_170 test_178" bash qa/g4/suites_pair.sh` (RERUNS ค่าเดิม 2 สำหรับชุดที่ต้องตรวจซ้ำ)

**runner exit 0 · comparator exit 0 · suites 5 · runs 18 · bothPass 3 · bad=[] · undecided=[] · metaOk=true · kindsRechecked=5**

| ชุด | main (process exit ตามลำดับรอบ) | 2.35 (process exit ตามลำดับรอบ) | ตัวตัดสิน |
|---|---|---|---|
| test_103_village | 0,0,0 | 0,0,0 | ผลเท่ากัน 3/3 คู่; log มี errors 1 จาก `test boom` ที่ชุดฝังเอง จึงไม่อ้างว่าฟังก์ชันนี้ errors 0 |
| test_105_gm | 0 | 0 | ผ่านคู่; log ต่างเพียง VERSION ตามการ normalize ที่ตกลงไว้ |
| test_109_mail | 0 | 0 | ผ่านคู่; log ต่างเพียง VERSION |
| test_170_swordsman | 1,1,0 | 0,0,1 | ไม่มี failure ใหม่; ที่ตกทุกครั้งเป็น assert `!PS.gmSprite170&&!S.gmSprite170` จุดเดิม main:30:265; main ตก 2/3, branch ตก 1/3 |
| test_178_dig_button | 0 | 0 | ผ่านคู่ |

อ่าน trace ของ selected5 ด้วย: sys 18 แถว; failure JSON **3 ไฟล์** เป็น test170 main รอบ 1/2 และ branch รอบ 3, ทั้งสามมี page errors **0**, pending **0**; คำขอล้มเป็นฟอนต์ Google/manifest ping ยกเลิกตามที่บันทึก ไม่ใช่ loader ค้าง และไม่พบ failure line ใหม่จากโค้ดเกม 2.35 ผลนี้เป็นการใช้กติกา baseline เดิม ไม่เปลี่ยน assert หรือถือทุก process exit 0 เป็นผลผ่านโดยไม่อ่าน log

## 5. ข้อสังเกตใหม่

**สูง 0 · กลาง 0 · ต่ำ 1 (N4 · ภาพปุ่ม GM)** จากขอบเขตที่ตรวจ ไม่ใช่การรับรองว่าครบ M1–M10 ของ G4 ทั้งหมด

N4 (มีอยู่ในบล็อก C234 ตั้งแต่ 2.34 พบเพิ่มในการดูภาพรอบนี้): เมื่อพร้อม ปุ่ม “ปิดตัวละครรุ่น 2” อ่านยาก เพราะ C234 (`index.html:7807` และการสร้างปุ่มบรรทัด 7809) กำหนดตัวอักษร `#1b1330` บน background ทอง `#e8c46a` แต่กฎเดิม `body.art156-frames button` (`4654`) วาด **border-image slice 22 fill** สีม่วงทับพื้นปุ่ม; ไม่มี `.on`/`aria-pressed=true` ที่เลือก active art ตามบรรทัด 4655

เห็นในภาพจริงทั้ง `test234-flag/f-gm-row.png` (844×390) และ `probe-ui.png` (800×600) ภายใต้ /tmp/t39/out; computed color=`rgb(27,19,48)`, backgroundColor=`rgb(232,196,106)`, backgroundImage=none, height=44 แต่สีพื้นจาก border-image ไม่อยู่ใน backgroundImage จึงตรวจแค่ computed background ไม่พอ ปุ่มยังคลิก/ปิดได้ตาม test ไม่ใช่ disabled/ปัญหาเซฟ ขอ Claude ปรับข้อความ/skin ให้สอดคล้องกับกรอบจริงและดูสถานะเปิด–ปิดเมื่อโหลด art แล้ว (Codex ไม่แก้ไฟล์เกม/ภาพ)

## 6. คำตัดสินและขอบเขต

**ปิด N1/N2/N3 ได้ครบ 3/3 และเสนอรับ G4.1 (2.35) เพื่อให้เริ่ม G4.2 ได้** ตามผลชุดใหม่ที่ผ่านข้างต้น พร้อมข้อสังเกตต่ำ N4 เรื่องสีข้อความปุ่ม GM ให้ Claude เก็บงาน

แยกให้ชัด: รับด่านของโค้ด 2.35 จากผลทดสอบปัจจุบัน ไม่ใช่ปิด root cause ของ timeout 2.34 และไม่ใช่รับ G4 ทั้งหมด/อนุมัติเปิดตัวละครใหม่ให้ผู้เล่นทั่วไป M3–M7/M9 และ M8 ส่วนแต่งสีเต็มยังเป็นงานขั้นถัดไปตามแผน ไม่ได้วัด FPS/หน่วยความจำเต็มหรือทำออนไลน์สองอุปกรณ์ในงานนี้ ไม่ต้องรอรายงาน 115 ชุดของ Claude อีกเพราะรายงานฉบับ 1.2 ส่งแล้ว; หากจะปิด root cause เก่าต้องมีหลักฐานเพิ่มหรือการเกิดซ้ำพร้อม trace ไม่ใช่ลดเวลารอ/เปลี่ยนเกณฑ์

ผลดิบนอก repo ทั้งหมด; ไม่ commit ภาพ/trace/fixture/node_modules; ไฟล์ส่งเพียง REVIEW_CODEX_T39_G41.md กับ CODEX_STATUS.md หนึ่งบรรทัด ไม่ใช้เครดิต ไม่แตะเซฟจริง ไม่แก้ไฟล์ Claude และไม่ push main

หลักฐานระบุ SHA-256 16 ตัวแรกของผล Codex (ไฟล์อยู่ใต้ /tmp/t39/out):

| ไฟล์ | SHA-256 prefix |
|---|---|
| test234-flag.log | c297123019ba67e1 |
| test234-files.log | ef727ab72d296a1f |
| test234-save.log | 203a33e1f924f6b6 |
| test234-net.log | 01ba522d87787fba |
| probe-own.json | 63a28bd1a39facdd |
| hash-probe.json | 9d3458f6aa570ded |
| loadprobe.json | a432ae980d168d79 |
| t227-compare.log | 09157ecc1d54d1b1 |
| selected5-compare.log | d5994db232368a52 |
