# T38 — ยืนยัน G4.0 ฉบับ 1.4 หลัง T37

7 พ.ย. 2569 (เวลาไทย) · ฐาน `e1a2e96d098eb140899b5f1be84de122896b9a38` · เกม `main eb60c650922e55c7d81b27b59f180e1f42c367b2` · ส่ง `codex/t38-confirm-g40-v14` · เครดิต0

**ปิดการแก้ T37-N1/N2 ตามกรณีที่กำหนดได้ 2/2**: self-test58/58, คู่จริง main↔main exit0, สำเนา page error exit1, สำเนาคำบนปุ่ม exit3 และการแก้ kind/เพิ่ม log99/ไฟล์แปลกถูกปฏิเสธแล้ว **เสนอรับ G4.0 ในขอบเขตค่าฐานและเครื่องตรวจเพื่อให้เข้าสู่ G4.1 ได้** มีข้อสังเกตใหม่ **สูง0 / กลาง0 / ต่ำ1** เรื่องชื่อ log ทางเลือกของรอบ1 ซึ่งไม่เปลี่ยนผลของหลักฐานจริงที่ตรวจ hash; รายละเอียดและขอบเขตการรับอยู่ข้อ4

## วิธีตรวจและขอบเขต

อ่าน HANDOFF T38, BASELINE §13 ก่อน แล้ว §2.1, `manifest`/`recheck_kinds`, runner บรรทัด ALLDONE, self-test K01–K09 และ `g40-m1-v3_2.json` ตรวจ diff AGENTS/กติกาทีมแล้วไม่เปลี่ยนจาก T37 ไม่แก้ไฟล์เหล่านี้ ใช้ Chromium151.0.7922.173, Node24.19.0, Puppeteer Core24.26.1 เหมือน T37 (ต่างจากเครื่อง Claude ที่รายงาน puppeteer25.8/Chromium build1243)

รันเกม main จาก checkout แยกที่ localhost8790/8791 ใช้ profile/เซฟทดสอบชั่วคราว ผลดิบ/สำเนาฝังผิด/fixture อยู่ `/tmp/t38` และใช้สำเนาเกมผิดเดิมของ T37 ใน `/tmp/t37` ซึ่งไม่ได้แก้เพิ่ม ทุก OUT ของการรัน v3.2 เป็นโฟลเดอร์ใหม่ รายงาน JSON/log ของคำสั่งเปรียบเทียบเก็บข้าง OUT ไม่วางบนสุดใน OUT

ใช้ preload เดิม ย้ายเฉพาะปลายทาง `Page.screenshot({path})` ไป `OUT_DIR` ของแต่ละรอบ ทั้งสองฝั่งเหมือนกัน ไม่แก้เกม/ข้อทดสอบ/stdout ไม่ติดตั้ง dependency ลง repo ไม่รันครบ115ชุดหรือ M5/M6/M9 ซ้ำ เพราะงานนี้ยืนยันตัวตัดสิน M1; ข้อที่ปิดใน T34–T37 ไม่ได้ถูกถือว่าเป็นการวัดใหม่ใน T38

## 1. T37-N1 — การเลือกชนิดชุดตรวจ

`python3 -I -B qa/g4/suites_cmp_selftest.py` → **exit0, 58/58, wrong=[]**; แบ่งควรผ่าน14 / ถอยหลัง12 / ตัดสินไม่ได้32 ตรงเอกสาร กรณี K01/K02/M16 อ่านก่อนเขียนจริงแล้ว ตรวจว่าไฟล์ที่เปลี่ยนไม่กลายเป็นไฟล์ว่างโดยผิดเจตนา

**หลักฐาน T37 เดิม:** คัดลอกโฟลเดอร์ผลจริงคำบนปุ่มของ Codex (`test_121_beds`, เปลี่ยน `ตี`→`ตีเลย`) มาเป็น fixture โดยไม่เปลี่ยน log/exit/runs.tsv; เติมเฉพาะ checksumสามช่องใหม่ใน ALLDONE เพื่อให้ทดสอบกติกา v3.2 ได้ ไม่เอาการตกเพราะ “ALLDONE รุ่นเก่า” มานับว่าแก้สำเร็จ ก่อนแก้ชนิดยังเป็น OUTPUT DIFFERS/exit3, metaOk=true จากนั้น:

| แก้หลังปิดผล | ผลจริง | เหตุที่ปฏิเสธ |
|---|---:|---|
| `legacy`→`legacY` | 3 | suites_sha ต่าง + kind ไม่อยู่ใน enum + ไม่ตรงไฟล์ชุด |
| `legacy`→`assert` | 3 | suites_sha ต่าง + ไฟล์ชุดจริงยังเป็น legacy |
| เปลี่ยนเป็น assert และปรับเฉพาะ suites_sha ให้ตรงด้วย | 3 | ชั้นตรวจไฟล์ชุด: `suite file says 'legacy'` |

**ผลจาก runner v3.2 ใหม่:** รันสำเนาคำบนปุ่มเดิม (`ONLY=test_121`) อีกครั้งใน OUT ใหม่ด้วย runner v3.2 จบ6การรัน: runner exit0; comparator **exit3 OUTPUT DIFFERS, metaOk=true, kindsRechecked=1** แสดงทั้ง `"buttonOnRightBed":"ตีเลย"` และค่าที่หาย `"ตี"` จากนั้นคัดลอก OUT นี้แล้วทำสามกรณีในตารางซ้ำ → **exit3 ทั้ง3/3** ด้วยเหตุ hash/enum/source-kind ข้างต้น ไม่ใช่เพราะ metadata ของรุ่นเก่า ล็อกผลเดิมทุกไฟล์ไว้และไม่แก้เครื่องตรวจ

ALLDONE ล็อก suites.tsv/env.txt/target.txt เพิ่มจาก runs.tsv; kind ต้องเป็น enum ที่รู้จัก และ `recheck_kinds` คำนวณ SHA/ชนิดจากไฟล์ชุดด้วยกติกาเดียวกับ runner อีกครั้ง จึงไม่ข้ามการเทียบ legacy ด้วยการแก้ช่องเดียวแบบ T37 แล้ว **ปิด T37-N1 ได้**

ข้อจำกัดประกาศชัด: การตรวจจากไฟล์ชุดจะทำได้เมื่อโฟลเดอร์ทั้งสองยังอยู่ ด่านจริงควรตัดสินทันทีหลังรัน; checksum ไม่ได้ป้องกันผู้ตั้งใจปลอมหลักฐานทุกไฟล์พร้อมกัน ข้อจำกัดนี้ไม่ใช่ปัญหาใหม่

## 2. T37-N2 — log ไม่มีคู่และไฟล์แปลก

คัดลอก OUT คู่ควบคุมจริงจาก v3.2 แล้วทดลองทีละกรณี โดยคง ALLDONE และรายการเดิมไว้:

| กรณี | ผลจริง |
|---|---:|
| เพิ่ม `test_103_village.branch.99.log` ไม่มี exit | **3**, run file not listed |
| เพิ่ม `notes.txt` บนสุด OUT | **3**, file the runner never writes |
| เพิ่ม `extra-test.txt` ใต้ `out_test_103_village.branch/` | **0**, ไม่ตกผิด |
| แก้ env.txt หลัง runner จบ | **3**, env_sha ไม่ตรง |

ทั้ง3กรณีแรกตรงเกณฑ์ **3/3** และผลเหมือนที่ทดลองกับสำเนา control T37 เดิมหลังเติม checksum metadata ใหม่ ผลปกติและภาพจาก preload ไม่ต้องลบทิ้งเพื่อให้ผ่าน

โฟลเดอร์ out_ เป็นที่เก็บ screenshot/ผลประกอบของชุด ไม่ถูกใช้แทนหลักฐาน log/exit ที่ตรวจ hash **ปิด T37-N2 ตามกรณีเดิม** ส่วนชื่อ log ทางเลือกที่ยังหลุดมีข้อสังเกตระดับต่ำในข้อ4

## 3. รันเกมจริงด้วย runner v3.2

คำสั่ง (ตั้ง CHROME_EXE/NODE_PATH/NODE_OPTIONS สำหรับเครื่องนี้ตามวิธีข้างต้น):

```sh
MAIN_DIR=/workspace/t14-main BRANCH_DIR=/workspace/t14-main \
ONLY="test_103 test_109 test_167 test_170 test_178" OUT=/tmp/t38/control \
bash qa/g4/suites_pair.sh
python3 -I -B qa/g4/suites_cmp.py /tmp/t38/control --json /tmp/t38/control-compare.json
```

**runner exit0; comparator exit0**: suites5, legacy2, runs14, bothPass4, bad=[], undecided=[], metaOk=true, **kindsRechecked=5/5** ไม่มี exit3 จากไฟล์แปลก จึงไม่ต้องขยายเป็น5รอบ

103 มี process exit0 แต่ page error `test boom` ที่ชุดฝังเองเหมือนกันทั้งสองฝั่ง3รอบ จึงไม่ถือว่าถอยหลัง; 109/167/170/178 ผ่านทั้งสองฝั่งรอบแรกทุกชุด ชุด167/170/178 ไม่ต้องตกตามฐานเก่าที่บันทึกไว้เพราะเปรียบเทียบภายใน session เดียวกัน

ตรวจ checksum อิสระอีกครั้ง: ALLDONE ผูกไฟล์หลัก **4/4** ตรง และ log SHA/exit ตรง runs.tsv **14/14**; บนสุด OUT มีเฉพาะไฟล์ runner5ไฟล์, log/exit28ไฟล์ และโฟลเดอร์ out_ ของภาพ/ผลประกอบ

สำเนาฝัง page error เดิมของ Codex มีเพียง script เพิ่มที่โยน `T37 injected page error` หลังโหลด5วินาทีใน index.html ของสำเนานอก repo (ไม่เปลี่ยนข้อความเป็นT38เพราะใช้สำเนาเดิม) รัน `ONLY=test_104` ด้วย runner v3.2 และ OUT ใหม่:

**runner exit0; comparator exit1 NEW FAIL**: legacy1ชุด, runs6, kindsRechecked=1, metaOk=true; process exit ของทั้ง main และ branch เป็น0ทั้ง3รอบ แต่ branchมี page error `T37 injected page error` ครบ3รอบ จึงไม่ถูกปล่อยผ่านเพราะใช้ชุดเก่าที่ process exit0

**ไฟล์จาก preload:** ทุกภาพถูกเก็บใต้ `OUT/out_<ชื่อชุด>.<main|branch>[.<รอบ>]/` เท่านั้น ไม่มีไฟล์จาก preload บนสุด OUT รายชื่อ basename ที่เกิดจริง (แต่ละชื่ออาจมีทั้งสองฝั่ง/หลายรอบ):

| ชุด | ชื่อไฟล์ภาพ |
|---|---|
| 103 | `v103.png` |
| 109 | `mail_h9.png` |
| 167 | `pc-bed.png` · `pc-board.png` · `pc-crate.png` · `pc-door.png` · `phone-bed.png` · `phone-board.png` · `phone-crate.png` · `phone-door.png` · `small-missing-icons-bed.png` · `small-missing-icons-board.png` · `small-missing-icons-crate.png` · `small-missing-icons-door.png` |
| 170 | `pc-farm.png` · `pc-house.png` · `pc-menu.png` · `phone-farm.png` · `phone-house.png` · `phone-menu.png` |
| 178 | `a_adult_dig_button.png` · `adult_end.png` · `b_adult_cancelled.png` · `k_kid_dig_button.png` |

ไม่มีไฟล์แปลกบนสุดของ OUT ในการรันปกติ ตัวตรวจใหม่ไม่ทำให้คู่ควบคุมตกผิดเพราะ screenshot; report/progress/JSON เปรียบเทียบอยู่ภายนอก OUT ทั้งหมด

## 4. ปัญหาใหม่และข้อเสนอรับ G4.0

**ใหม่ สูง0 / กลาง0 / ต่ำ1 — T38-N1: ชื่อ log ของรอบ1 ที่เขียนได้หลายแบบยังถูกข้าม** (`qa/g4/suites_cmp.py:208–211`)

ในสำเนา OUT คู่ควบคุม v3.2 ที่จบแล้ว เพิ่มไฟล์ใหม่เพียงไฟล์เดียวชื่อ `test_103_village.branch.1.log` ที่มี `Error: new regression` โดยคง `test_103_village.branch.log` และ manifest เดิมทั้งหมด → ตัวตัดสิน **exit0, metaOk=true**; ชื่อ `.branch.01.log` ให้ผลเหมือนกัน ขณะที่ `.branch.99.log` ถูกปฏิเสธแล้ว

เหตุ: การตรวจไฟล์เพิ่มแปลงเลขในชื่อเป็น `int(...)` แล้วเทียบแค่ `(suite, side, run)` จึงถือว่า `.1.log`/`.01.log` คือรอบ1ที่อยู่ในรายการ ทั้งที่ชื่อไฟล์จริงที่ runner ใช้คือ `.branch.log` และไฟล์เพิ่มไม่ได้ถูกนำไปตรวจ hash/อ่านเป็นผล

จัด **ต่ำและไม่ขวางการรับฐาน G4.0** เพราะไฟล์ log/exit ตามชื่อที่ runner สร้างยังถูกตรวจ hash และถูกตัดสินครบ ไม่สามารถใช้การเพิ่มไฟล์นี้เพียงอย่างเดียวเปลี่ยน failure ที่มีอยู่ให้ผ่าน ไม่มีการปิดผลของรอบจริงเหมือนช่องโหว่เดิม เป็นความไม่ครบของกติกา “ไม่มีไฟล์รอบนอกรายการ” ขอเก็บงานโดยเทียบชุดชื่อไฟล์ canonical ที่คาดจาก runs.tsv ด้วย และเพิ่มกรณี `.1.log`/`.01.log` ต้องได้3 ไม่ต้องแก้เกมหรือรันชุดเกมเต็มใหม่เพื่อยืนยันการแก้ชื่อไฟล์นี้

**ข้อเสนอ: รับ G4.0 ในขอบเขตค่าฐานและเครื่องตรวจเพื่อให้เข้าสู่ G4.1 ได้** ปิด T37-N1/N2 ครบ2/2 และไม่มีข้อใหม่ระดับสูง/กลางที่ขวาง ข้อสังเกตต่ำข้างต้นบันทึกไว้ให้ Claude เก็บงาน ไม่ใช่การรับโค้ด G4.1 ซึ่งยังไม่มีในฐานนี้ และเจ้าของยังเป็นผู้ตัดสิน/มอบหมายขั้นถัดไป

ยังคงข้อจำกัดที่ตกลงไว้: ชุด legacy ตรวจเฉพาะข้อความที่พิมพ์และปิดตัวเลข; exit3 ไม่ใช่ผ่าน ต้องทำตาม §2.6; การแก้ checksum/หลักฐานทุกชิ้นร่วมกันอยู่นอกขอบเขต; การตรวจไฟล์ชุดซ้ำต้องมี checkout; การรันครบ115ชุดแบบคู่ทำใน G4.1 ไม่อ้างว่าทำครบในงานนี้


ไฟล์ส่งมีเพียงรายงานนี้และ CODEX_STATUS.md เพิ่ม1บรรทัด ไม่ใส่ผลดิบ/ภาพเต็ม/fixture/สำเนาฝังผิดใน repo ไม่แก้ไฟล์ Claude/ภาพ/index.html/sw.js ไม่ใช้เครดิต ไม่แตะเซฟจริง ไม่ push main/force push และไม่ได้เริ่ม G4.1 เอง
