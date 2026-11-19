# REVIEW_CODEX_T53_TESTFIX — ตรวจชุดทดสอบฐาน 3 ชุด

19 พ.ย. 2569 · Codex ตรวจอิสระ · งาน T53 ตาม `HANDOFF_TO_CODEX.md` @ `956923f` · เครดิต 0

- ฐานส่งรายงาน: `claude/g2-pilot` @ `956923f0cf8b8f58f140c5ca07c717c68fe15fb4` → `codex/t53-review-testfix`
- ตรวจ: `claude/fix-base-tests` @ `b63dfaf19c8015d8b6cc1da7239f08ef2d0eb3af` (โค้ด `85cb973`)
- คู่เทียบ: `main` @ `b51b5d3cff647539a6199ec0161fac83640ea0ae` เกม 2.44
- เครื่อง: Linux · Node 24.19.0 · Python 3.12.14 · Puppeteer 25.8.0 · Chromium 151.0.7922.173 · รัน Chromium นอก sandbox หลังขอสิทธิ์แล้ว
- ใช้ `git archive` และเก็บ dependencies, สำเนา, fixture, trace, ผลดิบทั้งหมดใน `/tmp/t53` · รันเบราว์เซอร์ทีละงาน · เซฟจำลองใน browser context ทดสอบเท่านั้น · ไม่แตะเซฟจริง/ภาพ/เกมใน repo

**ผล:** ยังไม่เสนอขึ้น main ทั้งแพตช์ · สูง 0 / กลาง 2 / ต่ำ 0 · selftest 15/15; พบผ่านผิดจากเกมรอแบบ synchronous และ trace ขาด task (ข้อ 4–5) · การแก้ช่องชื่อผ่านครบ

## 1. ขอบเขต diff

`git diff b51b5d3 b63dfaf --name-status` ได้เพียง 6 ไฟล์ตามรายงาน: เพิ่ม `TESTFIX_2026_11_19.md`, `qa/frames.js`, `qa/frames_selftest.js`; แก้ `test_213_labels.js`, `test_222_tk_pack.js`, `test_risk_monthly.js` เท่านั้น ไม่มี diff ของ `index.html`, `sw.js`, เกมอื่น หรือภาพ การแก้ `{count:3}` พร้อมตรวจ selection ใน test_222 ตรงปัญหาเดิม ชื่อสูงสุด 12 ตัวของเกมไม่ได้เปลี่ยน

## 2. Selftest และชุดเดี่ยว

คำสั่งใช้ไฟล์ของ Claude ตาม commit ที่ระบุ ไม่แก้ให้ผ่าน:

```sh
NODE_PATH=/tmp/t53/pp/node_modules CHROME_EXE=/usr/bin/chromium node qa/frames_selftest.js
PORT=8791 NODE_PATH=/tmp/t53/pp/node_modules CHROME_EXE=/usr/bin/chromium node qa/frames_selftest.js
# วน 3 รอบ เรียง 222 → 213 → risk; แต่ละชุดใช้ OUT_DIR แยกและรันทีละชุด
PORT=8791 NODE_PATH=/tmp/t53/pp/node_modules CHROME_EXE=/usr/bin/chromium node <suite>.js
```

| งาน | ผลจริง |
|---|---|
| selftest A ไม่มี PORT | 11/11 · exit 0; B ข้ามตามโหมด |
| selftest A+B มี PORT | 15/15 · exit 0; B3/B4 ใช้ POSIX kill จริง ไม่ข้าม |
| test_222_tk_pack | exits **[0,0,0]** · errors 0 ทั้ง 3 รอบ รวมส่วนหลังตรวจชื่อ |
| test_213_labels | exits **[1,1,1]** · ตก assert frames with/without |
| test_risk_monthly | exits **[1,1,1]** · ตกเกณฑ์เฟรม; ไม่ใช่ launch/network error |

selftest B: control สะอาด 1 รอบ; ฝังงาน 70 ms จับ gap 87 ms / main CPU 74 ms เป็น own และไม่ลองใหม่; SIGSTOP ครั้งแรก gap 86 ms / main CPU 3.3 ms แล้วรอบ 2 สะอาด; SIGSTOP ทุกรอบได้ 3 windows CPU 3/2.6/2.9 ms และยังมี hitch 1 จึงตรงเงื่อนไขที่ selftest คาดให้ suite ตก

ผลชุดเดี่ยวนี้ **ไม่เหมือนผล 2/2 ของ Claude**: กติกาใหม่ไม่ได้ทำให้ 213/risk ผ่านบนเครื่องนี้ทุกครั้ง จึงไม่รายงานว่าทั้ง 3 ชุดผ่านครบ หัวข้อท้ายคัด windows ที่มีช่องว่างทั้งหมด รวมรอบที่ลองใหม่และรอบสะอาดถัดมา

## 3. ชุดคู่เดิม main ↔ branch

ใช้ `qa/g4/suites_pair.sh` ของ branch โดยไม่แก้: `MAIN_DIR=/tmp/t53/main BRANCH_DIR=/tmp/t53/game OUT=/tmp/t53/pair ONLY="test_213_labels test_222_tk_pack test_risk_monthly"` (RERUNS ค่าเดิม 2) แล้ว `python3 -I -B qa/g4/suites_cmp.py /tmp/t53/pair --json /tmp/t53/out/pair.json`

| ชุด | main exits | branch exits | ผล |
|---|---|---|---|
| test_213_labels | [1,1,1] | [0,0,1] | main ตกเฟรม; branch รอบ 3 ตกเฟรม |
| test_222_tk_pack | [1,1,1] | [0,0,0] | main ตก `12 letters at most`; branch ผ่านครบ |
| test_risk_monthly | [1,1,0] | [1,1,0] | สองรอบแรกตกเฟรม; รอบ 3 ผ่านทั้งคู่ |

runner **exit 0**, ALLDONE ครบ **3 suites / 18 runs**; comparator **exit 3 / cannot judge / SUITE FILE DIFFERS ทั้ง 3** ตาม HANDOFF ไม่ใช่การถอยหลังของเกม และไม่ตีความ exit 3 ว่าผ่านทั้งสามชุด

## 4. Probe ของ Codex เองบนหน้าเกมจริง

ใช้ `qa/frames.js` ตัวจริง; เซิร์ฟสำเนาเกมที่ 127.0.0.1:8802 และเปิดหน้าใหม่ด้วย Puppeteer; เด็กหญิง 7 ปี จอ 844×390 DPR 1 เซฟจำลอง; warm-up แล้ววัด 4 วินาทีต่อ window ไม่ได้แก้ไฟล์เกมของ Claude ปิดเฉพาะคำขอ Firebase/Google ภายนอกใน context ทดสอบ ไม่มีการ intercept endpoint หน่วงเวลา

ในตารางนี้ “ผ่านด่านเฟรม” = `fps >= 55 && own === 0 && hitch === 0` ซึ่งเป็นเงื่อนไขเฟรมของ risk จริง ไม่อ้างว่าเป็นการรัน risk ทั้ง suite อีกครั้ง

| probe | gap / CPU ที่จับได้ | ผลจาก helper | ผ่านด่านเฟรม? |
|---|---|---|---|
| control | ไม่มี; worst 20 ms | fps 60.3, own 0, hitch 0, tries 1 | ผ่าน |
| งาน CPU 70 ms ใน `window.loop` ครั้งเดียว | 118 / 97.2 ms main | own 1, hitch 1, tries 1 | ไม่ผ่าน |
| งาน CPU 45 ms ใน `window.loop` ครั้งเดียว | 62 / 47 ms main | own 1, hitch 1, tries 1 | ไม่ผ่าน |
| รอ synchronous HTTP 90 ms ใน `window.loop` ครั้งเดียว | 120 / 10.4 ms main; callback บล็อกจริง 102.1 ms | window แรก outside 1; window 2 สะอาด → own 0, hitch 0, fps 60.3, tries 2 | **ผ่านผิด: N1** |
| รอ synchronous HTTP ซ้ำทุก ~2 s | 99–115 / 5.1–5.9 ms main; ครบทั้ง 3 windows | own 0, hitch 2, tries 3 | ไม่ผ่านตามที่ควร |
| งาน CPU 70 ms แต่ส่ง trace ที่ตัด RunTask ออก คง marker/metadata | 87 / **0 ms, by null** | window แรก outside 1; window 2 สะอาด → own 0, hitch 0, fps 60.3, tries 2 | **ผ่านผิด: N2** |

สคริปต์ probe จบ exit 0 หมายถึงเก็บผลครบ ไม่ได้หมายความว่าทุกกรณีควรผ่าน รายละเอียด windows ของสองกรณีผ่านผิด:

```json
{"mode":"sync90","fps":60.3,"hitch":0,"own":0,"tries":2,"windows":[{"fps":58.8,"worst":120,"own":0,"outside":1,"gaps":[[1486,120,10.4,"main"]]},{"fps":60.3,"worst":22,"own":0,"outside":0,"gaps":[]}]}
{"mode":"marker-no-tasks","fps":60.3,"hitch":0,"own":0,"tries":2,"windows":[{"fps":59.5,"worst":87,"own":0,"outside":1,"gaps":[[1479,87,0,null]]},{"fps":60.3,"worst":20,"own":0,"outside":0,"gaps":[]}]}
```

## 5. ปัญหาใหม่และคำตอบเรื่อง CPU

### T53-N1 — กลาง: CPU ต่ำไม่ได้พิสูจน์ว่าเฟรมช้ามาจากนอกเกม

จุดเกี่ยวข้อง: `qa/frames.js:45–47` และ `:57–62`; คำอธิบายเหตุ/ผลใน `TESTFIX_2026_11_19.md` ข้อ 2

ฝังใน callback `window.loop` หลังเริ่มวัด ~1.5 s เพียงครั้งเดียว:

```js
const x = new XMLHttpRequest();
x.open('GET', '/__delay?ms=90', false);
x.send();
```

เซิร์ฟเวอร์ Node ที่แยกจาก browser ตอบ `done` หลัง `setTimeout(...,90)` และ `Cache-Control: no-store` ไม่ใช้ SIGSTOP/CPU throttle และไม่บิดคำตอบ trace เกมรอใน main thread ด้วยคำสั่งของมันเองจริงจนเฟรมขาด 120 ms แต่ CPU ใช้เพียง 10.4 ms กติกาจึงตั้ง outside แล้วทิ้งผลเมื่อรอบถัดไปสะอาด เป็นตัวอย่างหักล้างคำอ้างว่า “ของเกมเองตกทันที ไม่ลองใหม่” สำหรับ **เกมบล็อกด้วยการรอ** แม้จับ busy-loop 45/70 ms ได้ดี กรณีนี้เป็น fault ที่ Codex ฝัง ไม่กล่าวหาว่าเกมปัจจุบันมี synchronous XHR นี้

ข้อจำกัดตัวเลขที่เกี่ยวข้อง (ตรวจด้วย `F.attribute` ตัวจริงเพิ่มเติม):

- main ใช้ CPU 30 ms ช่วง [100,130] แล้ว compositor ใช้ 30 ms ช่วง [130,160] ในช่องว่าง [100,165] → max = 30, outside; จึงไม่ได้ครอบ critical path แบบต่อกันข้ามเธรด การมี CPU ≥33.3 ในเธรดเดียวเป็นเพียงเงื่อนไขหนึ่ง ไม่ใช่นิยามครบของเหตุจากเกม
- งานยาว 200 ms รวม CPU 50 ms แล้ว overlap ช่องว่าง 80 ms → ประมาณ CPU 20 ms; `tdur` รวมทั้งงานไม่บอกว่า CPU ไปกระจุกอยู่ตรงไหนในงาน จึงไม่ใช่ค่าที่วัดตรงภายในช่องว่างเสมอ
- A5 ใน selftest เรียก “two threads at once” แต่ fixture main [1000,1022] และ viz [1025,1047] ไม่ซ้อนกัน นี่ช่วยแสดงว่าการผ่าน selftest ไม่ได้พิสูจน์การแยกสาเหตุใน critical path; นับรวมใน N1 ไม่เปิดข้อซ้ำ

ขอให้แยก `outside` ที่พิสูจน์ได้จาก `unknown/waiting` และไม่ให้ช่องว่างที่ยังอธิบายไม่ได้กลายเป็น “ผ่านสะอาด” อัตโนมัติ หากเจ้าของจะยอมให้ลองซ้ำเพราะเป็นการสุ่มช่วงวัด ต้องระบุความหมาย/ข้อยกเว้นให้ตรง ไม่อ้างว่าแยกเหตุเกมกับเครื่องได้ครบด้วย CPU ตัวเดียว เพิ่ม regression test แบบ synchronous wait และงานต่อข้ามเธรด โดยไม่ต้องลดเกณฑ์ 50 ms หรือ 55 fps

### T53-N2 — กลาง: มี marker แต่ไม่มีหลักฐาน task กลับถูกนับเป็น CPU ศูนย์

จุดเกี่ยวข้อง: `qa/frames.js:35–47` โดยเฉพาะ `:43`, `:45`; fallback “ไม่มี marker” ใช้ได้ แต่กรณี marker อยู่และ task หายยังไม่ครอบ

probe ฝัง busy-loop 70 ms ในเกมเหมือนตัวที่จับได้ แล้วห่อ `page.tracing.stop()` **เฉพาะในสคริปต์ทดสอบภายนอก repo**: เก็บ trace จริงไว้ก่อน จากนั้นส่ง JSON ที่กรองรายการ `ph === 'X' && /RunTask$/.test(name)` ออกให้ helper; marker และ metadata คงเดิม ชุดวัดพบ gap 87 ms แต่ helper เริ่ม `cpu=0` แล้วไม่พบ task จึงคืน `cpu:0, by:null, own:false` และลองใหม่จนผ่าน ไม่มี error บอกว่าหลักฐานไม่พอ เมื่อนำ trace จริงที่เก็บไว้ก่อนกรองมาคิดใหม่ด้วยช่วงเวลาที่ปัดแล้วเดียวกัน ได้ main CPU 73.6 ms / own true จึงยืนยันว่าการหายของ task เปลี่ยนผลจริง

fixture สั้นที่ทำซ้ำได้โดยไม่เปิด browser: `F.attribute([marker ของ F.MARK], {gaps:[[100,180]]})` คืน gap 80, CPU 0, by null, own false; เช่นเดียวกับ task CPU 70 ที่ชื่อไม่ตรง `/RunTask$/` ผลนี้ไม่ได้พิสูจน์ว่า trace ในรอบปกติหายจริง แต่พิสูจน์ว่าตัวตรวจยอมรับหลักฐานไม่ครบเมื่อเกิดขึ้น (เช่น format/name เปลี่ยนหรือ trace ไม่ครบ)

ขอให้ตรวจความครบ/ความใช้ได้ของ task evidence และให้ unknown ตกหรือไม่นับแทน outside; เพิ่ม selftest marker-only, task ที่อ่านไม่ได้/ชื่อไม่รองรับ และ CPU counter ผิดรูป ไม่พอมีเฉพาะ no-marker กับ task ที่ไม่มี tdur

## 6. เฟรม 52–58 ms ของ T52 เป็นเกมหรือเครื่อง?

**ยังชี้สาเหตุย้อนหลังไม่ได้**: T52 ไม่มี CPU trace ของช่องว่างเหล่านั้น การตกทั้ง main และ branch บอกได้ว่ามีปัญหาร่วม แต่ไม่ได้พิสูจน์ว่าเกิดจากตัวเครื่องอย่างเดียว ส่วน T53 เป็นคนละรอบ/เกมฐาน/สภาพเครื่อง ห้ามใช้ CPU ของรอบนี้สวมให้เฟรมเก่า

ใน T53 พบทั้ง CPU สูงในสายวาด (เช่น gap 162 ms / main CPU 151.2 ms; gap 121 ms / viz CPU 68.8 ms) และ CPU ต่ำ (เช่น gap 154 ms / main CPU 12 ms แล้วลองใหม่สะอาด) รายงานได้ว่า helper จัดประเภทอย่างไร แต่ “CPU ต่ำ = เครื่องเป็นต้นเหตุ” ยังรับรองไม่ได้ตาม N1 และ CPU ที่ attribute แจกตามสัดส่วนเป็นค่าประมาณ ไม่ใช่ attribution เชิงเหตุครบทุกทาง

## 7. ถอดด่านเอง 3 แบบ — ตรวจจับได้ 3/3

สำเนาอยู่ `/tmp/t53/mutants` เท่านั้น ไม่เขียนทับ source ของ Claude:

| สิ่งที่ถอด/ทำให้ผิด | เครื่องตรวจที่รัน | ผลและเหตุผลที่ตรง fault |
|---|---|---|
| `OWN = 100/3` → `OWN = 1000` | selftest A+B กับ helper สำเนา | exit 1; A2/A3/A4/A6/A9/A10 ตก และ **B2 ตก**: งานฝัง 70 ms ให้ gap 87 / CPU 72.3 แต่ own 0 แล้ว retry จนสะอาด |
| return `hitch: last.own` ตัด `last.outside` ออก | selftest A+B กับ helper สำเนา | exit 1; **B4 ตก**: SIGSTOP ทุก window ครบ 3 ครั้ง แต่ hitch ผิดเป็น 0 |
| ในสำเนา `tk-test.js` เปลี่ยน maxlength 12→13 และ `.slice(0,12)`→13 | test_222 ตัวใหม่เดิม ผ่าน HTTP server ที่เสิร์ฟเฉพาะ tk-test.js สำเนา | exit 1 ที่ `12 letters at most` บรรทัด 56: actual `แป้งทดสอบชื่อ` / expected `แป้งทดสอบชื่` |

รายงานส่วนที่แกว่งด้วย: mutant OWN=1000 มี B1 ตกเพิ่มจาก outside gap 98 ms ที่ทำให้ tries=2; mutant drop-outside มี B3 ตกเพิ่มจาก outside gap 71 ms ในรอบที่สอง ทำให้ tries=3 แทน 2 จึงไม่ใช้เพียง exit 1 เหล่านี้อ้างว่าจับ fault ได้ แต่ยืนยันจาก **B2 / B4 / assertion ชื่อ** ข้างต้นโดยตรง selftest ตัวเดิม A+B ก่อน mutation ยังเป็น 15/15 ตามข้อ 2

## 8. ข้อเสนอส่งกลับ

- ใหม่ **สูง 0 / กลาง 2 (T53-N1, T53-N2) / ต่ำ 0** ไม่รวมผลเฟรมตกบนเครื่องนี้เป็นบั๊กเกมใหม่โดยไม่มีการแยกสาเหตุ
- **ยังไม่เสนอขึ้น main ทั้งแพตช์**: helper ยังปล่อยการบล็อกเฟรมจริงที่เกิดครั้งเดียวผ่าน และยอมให้ trace ขาด task เป็นศูนย์ CPU ได้ ขอแก้/กำหนดความหมายของ unknown แล้วเพิ่ม test ปิดสองทางนี้ก่อน
- การแก้ชื่อใน test_222 รับได้ในขอบเขตที่ตรวจ: เดี่ยว 3/3 + คู่ branch 3/3 และ fault ชื่อ 13 ตัวถูกจับ; สามารถแยกเสนอเจ้าของได้ ไม่จำเป็นต้องโยงการแก้ชื่อเข้ากับความพร้อมของกติกาเฟรม
- ไม่มีไฟล์ Claude/เกม/ภาพเปลี่ยน ไม่มีเครดิต ไม่มีเซฟจริง ไม่มี merge หรือ push main; ส่งเฉพาะรายงานนี้และ CODEX_STATUS 1 บรรทัด
- เครื่องเริ่มใหม่ระหว่างรอสิทธิ์ probe; ผลเดี่ยว/คู่และสำเนายังอยู่ครบ ไม่รันซ้ำเพื่อเลือกผลสวย probe/mutation รันต่อภายหลัง มี control ของตัวเองผ่านตามข้อ 4 ผลคู่ทั้งสองฝั่งมาจาก runner เดียวกันก่อนเริ่มใหม่

## ภาคผนวก: windows ที่มี gap จากทุกชุดที่รันด้วย helper ใหม่

คัดค่าจาก stdout/ข้อความ assert ของ suite โดยไม่แก้ตัวเลข ตัดเฉพาะ walk ที่ทุก window สะอาดและข้อมูล UI อื่นออก; walk ที่ลองใหม่คง **windows ครบ รวม window สะอาด** ไม่มี raw trace หรือภาพเต็มใน repo

- `gaps` แต่ละรายการ = `[เวลาเริ่มหลัง marker ms, ความยาวช่องว่าง ms, CPU ms, เธรด]`; helper ปัดเวลาเป็นจำนวนเต็ม จึงมีช่องที่พิมพ์ `50` แม้ค่าจริงก่อนปัดมากกว่า 50
- `tries` = จำนวน window; `own`/`outside` = การจัดประเภทของ helper ไม่ใช่ข้อสรุปเชิงเหตุที่ Codex รับรอง
- path `$[0][i]` / `$[1][i]` จาก assertion `kidFpsRuns` = เปิด/ปิดชุดป้ายตามลำดับ; path มี `.kidFpsRuns` จากผลเต็ม = index จอ phone844/owner915/ipad ตามลำดับ; risk ระบุ kid7/adult และ walkStart/walkFarm ตรง ๆ
- main ชุดเดิมไม่มี CPU/threads/windows ให้คัด จึงรายงาน exits ทั้งหมดในข้อ 3 ไม่สร้างข้อมูล CPU ขึ้นเอง

### out/test_213_labels.1.log (exit 1)

```json
{"path":"$[0][0]","fps":54.3,"worst":162,"hitch":3,"own":3,"tries":1,"windows":[{"fps":54.3,"worst":162,"own":3,"outside":0,"gaps":[[304,61,58.9,"main"],[488,162,151.2,"main"],[904,129,128.5,"main"]]}]}
{"path":"$[0][1]","fps":52.7,"worst":136,"hitch":4,"own":4,"tries":1,"windows":[{"fps":52.7,"worst":136,"own":4,"outside":0,"gaps":[[718,75,74.3,"main"],[1118,136,131.2,"main"],[1802,122,112.8,"main"],[2619,88,86.8,"viz"]]}]}
{"path":"$[1][0]","fps":51.3,"worst":159,"hitch":4,"own":3,"tries":1,"windows":[{"fps":51.3,"worst":159,"own":3,"outside":1,"gaps":[[79,154,153.1,"main"],[479,159,158.5,"main"],[1679,69,68.7,"main"],[2179,102,19.9,"main"]]}]}
{"path":"$[1][1]","fps":53.3,"worst":157,"hitch":5,"own":5,"tries":1,"windows":[{"fps":53.3,"worst":157,"own":5,"outside":0,"gaps":[[187,157,107.6,"main"],[1189,54,36.9,"viz"],[1487,111,111.4,"main"],[1987,80,33.6,"main"],[2987,69,66.7,"main"]]}]}
{"path":"$[0].kidFpsRuns[1][1]","fps":60.3,"worst":30,"hitch":0,"own":0,"tries":2,"windows":[{"fps":57.3,"worst":154,"own":0,"outside":1,"gaps":[[1627,154,12,"main"]]},{"fps":60.3,"worst":30,"own":0,"outside":0,"gaps":[]}]}
```

### out/test_213_labels.2.log (exit 1)

```json
{"path":"$[0][0]","fps":51.3,"worst":157,"hitch":5,"own":5,"tries":1,"windows":[{"fps":51.3,"worst":157,"own":5,"outside":0,"gaps":[[269,157,156.1,"main"],[517,60,57.6,"main"],[1167,146,144.7,"main"],[2200,56,55.1,"main"],[2845,124,121.9,"main"]]}]}
{"path":"$[0][1]","fps":59.3,"worst":55,"hitch":1,"own":1,"tries":1,"windows":[{"fps":59.3,"worst":55,"own":1,"outside":0,"gaps":[[268,55,54.5,"main"]]}]}
{"path":"$[1][0]","fps":58.7,"worst":105,"hitch":1,"own":1,"tries":1,"windows":[{"fps":58.7,"worst":105,"own":1,"outside":0,"gaps":[[501,105,105.6,"main"]]}]}
```

### out/test_213_labels.3.log (exit 1)

```json
{"path":"$[0][0]","fps":57.3,"worst":166,"hitch":2,"own":1,"tries":1,"windows":[{"fps":57.3,"worst":166,"own":1,"outside":1,"gaps":[[2844,87,11,"main"],[2962,166,157.1,"main"]]}]}
{"path":"$[1][0]","fps":56.7,"worst":112,"hitch":2,"own":2,"tries":1,"windows":[{"fps":56.7,"worst":112,"own":2,"outside":0,"gaps":[[1113,112,111.5,"main"],[2697,61,56.2,"main"]]}]}
```

### out/test_risk_monthly.1.log (exit 1)

```json
{"path":"$.kid7.walkStart","fps":53.5,"worst":142,"hitch":6,"own":6,"tries":1,"windows":[{"fps":53.5,"worst":142,"own":6,"outside":0,"gaps":[[246,50,46.5,"main"],[1104,113,95.9,"viz"],[1505,142,131.1,"main"],[2520,88,53.2,"viz"],[3225,118,112,"main"],[3720,98,97.2,"main"]]}]}
{"path":"$.kid7.walkFarm","fps":56.8,"worst":120,"hitch":4,"own":2,"tries":1,"windows":[{"fps":56.8,"worst":120,"own":2,"outside":2,"gaps":[[971,87,69,"main"],[1670,120,7.6,"main"],[2670,82,55.7,"compositor"],[3670,78,4.8,"main"]]}]}
```

### out/test_risk_monthly.2.log (exit 1)

```json
{"path":"$.adult.walkStart","fps":58.3,"worst":97,"hitch":2,"own":1,"tries":1,"windows":[{"fps":58.3,"worst":97,"own":1,"outside":1,"gaps":[[1807,89,3,"main"],[2807,97,72.1,"main"]]}]}
{"path":"$.adult.walkFarm","fps":55.3,"worst":156,"hitch":5,"own":3,"tries":1,"windows":[{"fps":55.3,"worst":156,"own":3,"outside":2,"gaps":[[1621,79,62.6,"main"],[1954,53,32.9,"viz"],[2338,98,73.7,"main"],[2488,59,50.6,"compositor"],[2843,156,22.9,"viz"]]}]}
```

### out/test_risk_monthly.3.log (exit 1)

```json
{"path":"$.kid7.walkFarm","fps":59.8,"worst":80,"hitch":1,"own":1,"tries":1,"windows":[{"fps":59.8,"worst":80,"own":1,"outside":0,"gaps":[[2924,80,61.6,"main"]]}]}
{"path":"$.adult.walkStart","fps":55.3,"worst":200,"hitch":3,"own":2,"tries":1,"windows":[{"fps":55.3,"worst":200,"own":2,"outside":1,"gaps":[[2654,55,17.3,"viz"],[3122,148,128.8,"main"],[3537,200,135.9,"main"]]}]}
```

### pair/test_213_labels.branch.2.log (exit 0)

```json
{"path":"$[0].kidFpsRuns[1][0]","fps":60,"worst":57,"hitch":1,"own":1,"tries":1,"windows":[{"fps":60,"worst":57,"own":1,"outside":0,"gaps":[[1049,57,55.9,"main"]]}]}
```

### pair/test_213_labels.branch.3.log (exit 1)

```json
{"path":"$[0][1]","fps":56.7,"worst":125,"hitch":2,"own":1,"tries":1,"windows":[{"fps":56.7,"worst":125,"own":1,"outside":1,"gaps":[[1981,90,13.7,"main"],[2182,125,124.5,"main"]]}]}
{"path":"$[1].kidFpsRuns[1][0]","fps":58.3,"worst":75,"hitch":1,"own":1,"tries":1,"windows":[{"fps":58.3,"worst":75,"own":1,"outside":0,"gaps":[[2879,75,75.1,"main"]]}]}
```

### pair/test_213_labels.branch.log (exit 0)

```json
{"path":"$[2].kidFpsRuns[1][0]","fps":59,"worst":77,"hitch":1,"own":1,"tries":1,"windows":[{"fps":59,"worst":77,"own":1,"outside":0,"gaps":[[1702,77,76.9,"main"]]}]}
```

### pair/test_risk_monthly.branch.2.log (exit 1)

```json
{"path":"$.kid7.walkFarm","fps":59.3,"worst":93,"hitch":1,"own":1,"tries":1,"windows":[{"fps":59.3,"worst":93,"own":1,"outside":0,"gaps":[[2619,93,71.1,"main"]]}]}
{"path":"$.adult.walkFarm","fps":59.5,"worst":61,"hitch":2,"own":1,"tries":1,"windows":[{"fps":59.5,"worst":61,"own":1,"outside":1,"gaps":[[42,61,41,"main"],[2100,57,24.4,"viz"]]}]}
```

### pair/test_risk_monthly.branch.3.log (exit 0)

```json
{"path":"$.adult.walkFarm","fps":59.8,"worst":49,"hitch":0,"own":0,"tries":2,"windows":[{"fps":59.5,"worst":77,"own":0,"outside":1,"gaps":[[1441,77,4.5,"main"]]},{"fps":59.8,"worst":49,"own":0,"outside":0,"gaps":[]}]}
```

### pair/test_risk_monthly.branch.log (exit 1)

```json
{"path":"$.adult.walkFarm","fps":58.8,"worst":121,"hitch":1,"own":1,"tries":1,"windows":[{"fps":58.8,"worst":121,"own":1,"outside":0,"gaps":[[1413,121,68.8,"viz"]]}]}
```
