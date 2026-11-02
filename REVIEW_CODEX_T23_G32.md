# T23 — ตรวจซ้ำ G3.2 ฉบับ 1.1 / R1–R6

2 พ.ย. 2569 · ฐาน `d206fd569480378071da8f270ae1aa7c86c2f447` · ส่ง `codex/t23-recheck-g32`

**ปิด R1/R2/R4/R5/R6 ได้ 5/6 ข้อ; R3 แก้กรณีเดิมแล้ว แต่ยังไม่ปิดทั้งหมด** เพราะพบช่องโหว่ใหม่ในชนิดชื่อสี (N1 กลาง) ชุดปกติ **K2 41/41 · K7 41/41 · release ระหว่างโหลดผ่าน**; inject **4/4 exit1**; โค้ดรุ่นแรก **exit1 ตก15** ตรงรายงาน ไม่มีการปฏิเสธข้อมูลถูกต้องใน4กรณีเสริมที่ลอง

ขอบเขต: อ่าน diff จาก `5a7e27e` ของโมดูล/แพ็ก/builder/fixtures/tests และรายงานข้อ8; ไม่ตรวจ D1–D7 ซ้ำ ไม่แก้ไฟล์ของ Claude/ภาพ/index.html ไม่ใช้เครดิต ไม่แตะเซฟจริง ผลดิบและสำเนาเสียอยู่ `/tmp/codex-t23/` นอก checkout `/workspace/t23-review` ไม่ commit

## 1. วิธีและผลรันจริง

ใช้ Chromium ระบบเหมือน T22 ผ่าน preload นอก repo ซึ่งเปลี่ยนเฉพาะ executablePath ของ Playwright เป็น `/usr/bin/chromium` ไม่แก้ assertions หรือ source ชุดทดสอบของ Claude

```text
python3 -I qa/g3/build_pack.py . --check
python3 -I qa/g3/check_k1_k6.py . origin/main
python3 -I qa/g3/make_bad_files.py . /tmp/codex-t23/bad
python3 -m http.server 8793 --bind 127.0.0.1
PORT=8793 BAD=/tmp/codex-t23/bad node --require /tmp/codex-t23/chromium.cjs qa/g3/test_g32_load_look.js <OUT>
# ทำซ้ำ INJECT=I1..I4; อีกครั้ง C2_FILE=/tmp/codex-t23/char2-first.js
# char2-first.js อ่านด้วย git show 5a7e27e:char2.js
```

| รัน | K2 | K7 | release ระหว่างโหลด | ข้อตกทั้งหมด | exit |
|---|---:|---:|---|---:|---:|
| ปกติ | **41/41** | **41/41** | ผ่าน | 0 | **0** |
| I1 | 38/41 | 41/41 | ผ่าน | 3 | **1** |
| I2 | 41/41 | 35/41 | ผ่าน | 6 | **1** |
| I3 | 41/41 | 2/41 | ผ่าน | 39 | **1** |
| I4 | 30/41 | 41/41 | ตกตามคาด | 12 | **1** |
| C2_FILE รุ่นแรก `5a7e27e` | 29/41 | 39/41 | ตก | **15** | **1** |

โหลดซ้ำ/releaseหลังโหลดเสร็จผ่านทั้ง6รัน ตัวเลขfailsของ I4 รวม release raceอีก1ข้อ ไม่ใช่เฉพาะ K2 ข้อตกของรุ่นแรกแยกเป็น K2 **12**, K7 **2**, release race **1** จึงยืนยันว่ากรณีทดสอบเพิ่มจับข้อบกพร่องของโค้ดเดิมได้จริง

ตรวจไฟล์: build --checkตรง **4,042 B**, K1/K6 pass=true, SHA baseline **20/20**, pack **13/13**, เกม3ไฟล์ไม่เปลี่ยนเทียบmain; char2.js **19,659 B**, ไฟล์ที่แพ็กโหลด **410,076 B** ปัจจุบัน fixedหลังโหลดครบยังเป็น **10,625,024 B** ไม่ใช่การวัดpeak/K4ในงานนี้

## 2. ผล R1–R6 ทีละข้อ (กรณีของ Codex จาก T22 รันซ้ำเอง)

| ข้อ | ผลซ้ำและการอ่านโค้ด | ตัดสิน |
|---|---|---|
| R1 look โยน error | `base:'__proto__'` โดยไม่มีgender/parts และ `base:{toString:null}` คืนnullทั้ง2 ไม่โยนและinputไม่เปลี่ยน; มี own-string-key ก่อน lookup และ catchของlook | **ปิด** |
| R2 ผลโหลดเก่ากลับหลังrelease | หน่วงแพ็กแล้วrelease: ทันทีและหลังปล่อยคำขอ total=0/look=null; ผลเก่าready=false นอกจากนี้ลองโหลดBที่404ระหว่างรอA: Bและloadซ้ำยังfalse, Aไม่กลับมาตั้งST; ชุดหลักยืนยัน failed=['released'], state=null, againIsB=true | **ปิด** |
| R3 แพ็กผิดผ่าน | walk_ms0, loop[99], budget−1, recolour{}, ไม่มีhold ทั้ง5กรณีคืนready=false/failed=['pack']/total0; ชื่อ `__proto__` ที่เพิ่มตรวจคืนpackเช่นกัน แต่พบ N1 ในตัวตรวจชื่อสี | **ยังไม่ปิดครบ** (กรณีเดิมผ่าน) |
| R4 จุดมือผิดผ่าน | S idle f1 anchor=null และSE walk f1 fist=[] คืนfailed=['hold'], hold=false ทั้ง2; ชุดใหม่จับกำปั้นบนพื้นใส/มือในN/มือสลับระหว่างเฟรมเพิ่มได้ | **ปิด** |
| R5 ตารางเฉด99ผ่าน | เปลี่ยนสมาชิกhair shade_index_by_Gเป็น99ทุกตัวโดยคงความยาว → failed=['portrait-mask'], portrait='raw'; ชุดใหม่จับความยาวขาด1ด้วย ตรวจทั้งinteger/rangeและจำนวนเฉดก่อนใช้mask | **ปิด** |
| R6 builderพิมพ์ค่าที่ควรอ่าน | ดูรายละเอียดการเปลี่ยนต้นทางในสำเนาข้างล่าง; frame countอ่านจากwidth/C, breathingอ่านJSONและassertกับPilot, hidden_dirsอ่านO13 | **ปิด** |

### พิสูจน์ R6 ด้วยสำเนานอก repo

คัดลอกเฉพาะไฟล์ที่ builder อ่านไป `/tmp/codex-t23/builder-copy/` แล้วใช้ builder ของ Claude โดยไม่แก้สคริปต์:

1. สำเนาเดิม → `--check` **exit0**, matches4042bytes
2. เปลี่ยน JSON `code_breathing.W.cut_row=61` แต่Pilotยัง62 → **exit1**, `AssertionError: breathing: anchors JSON != Pilot`
3. เปลี่ยนPilotเป็น61ด้วย โดยpackเดิมยัง62 → **exit1**, `c2-pack.json DIFFERS from the locked files`
4. ให้builderเขียนแพ็ก **เฉพาะโฟลเดอร์สำเนา** → exit0, ผล `breathe={dir:'W',frame:2,cut:61}`, framesยัง4/6/6

ต่างจากT22ที่เปลี่ยนต้นทางทั้งสองแล้ว --checkยังผ่านด้วยค่า62 แสดงว่าตอนนี้ค่าในแพ็กตามต้นทางและจับความไม่สอดคล้องได้จริง ไม่ได้เปลี่ยนไฟล์ล็อกในrepo

## 3. ปฏิเสธข้อมูลถูกต้องผิดพลาดหรือไม่

นอกเหนือจาก full setเดิมและdeprecated fixtureที่ผ่านในชุดหลัก ลองข้อมูลที่มีความหมายเดิม **4/4 ผ่าน** ผ่านpublic loadจริง โดยส่งสำเนาด้วย page.route:

| กรณี | ผล |
|---|---|
| สลับลำดับคีย์ระดับบนของแพ็ก | ready=true, failed=[] |
| กลับลำดับรายการพิกเซลกำปั้นทุกเฟรม โดยพิกัดทั้งหมดเดิม | ready=true, failed=[], hold=true |
| ละ `fist_px` metadata (optionalตามตัวตรวจ) | ready=true, failed=[], hold=true |
| ละ `group` ในรายการshademap (optionalตามตัวตรวจ) | ready=true, failed=[], portrait='recolour' |

ทั้ง4กรณี `look({hc:0})` ได้blackและมีชื่อblackเป็นstringอยู่ในpaletteจริง ยังไม่อ้างว่ารองรับแพ็กทุกชนิดในอนาคต แต่ไม่พบ false rejection ในข้อมูลที่ล็อกและกรณีเสริมเหล่านี้ ความเข้มงวดเรื่องanchorอยู่ในfist/พิกเซลต้องทึบจึงไม่ได้ทำให้ชุดที่ใช้จริงปิดholdโดยผิดพลาด

## 4. N1 — กลาง: regex ยอมแปลงชนิดชื่อสี ทำให้แพ็กผิดผ่าน (ค้างใน R3)

**ตำแหน่ง:** `char2.js:45` ใน packOk ใช้ `NAME.test(e[0])` โดยไม่มี `typeof e[0] === 'string'` ซึ่งรุ่นแรกเคยตรวจชนิดไว้ RegexของJavaScriptแปลงค่าเป็นstringเพื่อทดสอบ แต่ตัวแพ็กเก็บค่าเดิม จึงรับarray/nullได้

ทำซ้ำหลังเปิดหน้าQAใหม่แต่ละกรณี แก้สำเนาแพ็กเพียงช่องเดียว แล้ว routeแทนc2-pack.json:

```js
pack.palette.hair[0][0] = ['black']; // กรณี1
// หรือ
pack.palette.hair[0][0] = null;      // กรณี2
```

ผลจริงทั้ง **2/2**:

```text
load: ready=true, failed=[], raw=[], hold=true, portrait='recolour'
look({hc:0}).color.hair: 'black'
loadedPack.palette.hair.some(e => e[0] === 'black'): false
```

`NAME.test(['black'])` ทดสอบข้อความblack; `NAME.test(null)` ทดสอบข้อความnull ซึ่งตรง `[a-z][a-z0-9_]*` ทั้งคู่ จึงไม่ใช่เพียงชื่อแปลกที่ยังไม่ตกลงให้ห้าม เป็น **ชนิดข้อมูลผิด** และเกิดผลลัพธ์ลุคที่ไม่อยู่ในpaletteที่รับโหลดแล้วจริง แม้ยังไม่มีrendererขั้นถัดไปให้วัดภาพผิด

**ควรแก้:** ตรวจชนิดstringก่อนNAME.testและเพิ่ม2กรณีนี้ให้ K2 ต้องready=false/failed=['pack']; ตรวจการใช้regexกับhexสมาชิกในบรรทัดเดียวกันด้วย เพราะเป็นจุดที่อาศัยการแปลงชนิดเช่นกัน (ยังไม่อ้างผลรันhexกรณีอื่น) คงกรณีstringที่ถูกต้อง/ชื่อไม่ซ้ำ/ค่าเริ่มต้นไว้ แล้วทดสอบไม่ถดถอย

ข้อนี้เป็นข้อพบใหม่ **สูง0 กลาง1 ต่ำ0** และนับอยู่ใน R3 ไม่ได้เปิด R1/R2/R4/R5/R6 กลับมา ไม่จำเป็นต้องย้อนตรวจD1–D7

## 5. ขอบเขตและการส่ง

ส่งเฉพาะรายงานนี้กับ1บรรทัด CODEX_STATUS.md ไม่แก้โค้ดหรือชุดตรวจของ Claude สำเนาเสีย ผลดิบ และสคริปต์probeทั้งหมดอยู่นอกrepo หยุดหลังpush

ต่างจากวิธีรันมาตรฐาน: ใช้preloadภายนอกเลือกsystem Chromiumเนื่องจากbundled browserไม่พร้อมเหมือนT22 และใช้พอร์ต8793; ไม่เปลี่ยนเกณฑ์หรือผลที่คาด ไม่ใช้เครดิต ไม่แตะเซฟจริง
