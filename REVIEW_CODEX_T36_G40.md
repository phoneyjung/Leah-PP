# T36 — ยืนยัน G4.0 ฉบับ 1.2 หลัง T35

7 พ.ย. 2569 (เวลาไทย) · ฐาน `d866f5220515f6b7d576c762e1a26658ce24513b` · เกม `main eb60c650922e55c7d81b27b59f180e1f42c367b2` · ส่ง `codex/t36-confirm-g40-v12` · เครดิต 0

**ยังไม่แนะนำให้รับ G4.0 เป็นด่านครบเพื่อเริ่ม G4.1:** กรณีเดิมของ T35-N1 แก้ผ่าน 5/5, self-test 38/38 และคู่จริง main↔main ผ่าน แต่พบตัวตัดสินให้ผ่านข้อมูลเสียอีก **กลาง 2 ข้อ (T36-N1/N2)** จึงยังปิด R3/M1 ทั้งข้อไม่ได้ ส่วน **T35-N2 ปิดได้**: Offscreen ImageData ถูกนับเพิ่ม 64 MiB จริง สูง 0 / กลาง 2 / ต่ำ 0 ในขอบเขตที่ตรวจ

## วิธีตรวจและขอบเขต

อ่าน HANDOFF T36, BASELINE §11 ก่อน แล้ว §2/6/8 และ `g40-m1-v3.json`; ตรวจ `suites_pair.sh`, `suites_cmp.py`, self-test, memory และ fps จาก commit ฐาน ไม่แก้ไฟล์เหล่านี้ ใช้ Chromium 151.0.7922.173, Node 24.19.0, Puppeteer Core 24.26.1 ผ่าน alias ภายนอก repo; Playwright ของสภาพแวดล้อม ผลทั้งหมด/fixture/สำเนาฝังผิดอยู่ `/tmp/t36` นอก repository

ใช้ checkout main แยกและ browser profile ชั่วคราว ไม่มีเซฟผู้เล่นจริง ชุดคู่ใช้พอร์ต 8790/8791; memory ใช้ 8812 ไม่ได้รันครบ 115 ชุดหรือวัด M6 เต็ม (งานนี้ให้ตรวจโค้ด) ไม่ได้ตรวจมือถือจริง/Worker/ออนไลน์

`test_109_mail` เขียน screenshot ใน cwd เดิม จึงใช้ Node preload ภายนอก repo ย้ายเฉพาะปลายทาง `Page.screenshot({path})` ไป `OUT_DIR` ไม่เปลี่ยนภาพที่อ่าน เกม เงื่อนไข assertions หรือ stdout ของชุดทดสอบ ทั้งสองฝั่งใช้ preload เดียวกัน ครั้งแรกที่เตรียม memory พบ module path ไม่ครบและ server เก่า 8811 ตอบ `ERR_EMPTY_RESPONSE`; แก้เฉพาะสภาพแวดล้อมและเปิด server ใหม่ แล้วรันสองชุดใหม่จน exit 0 ไม่เอารอบที่ยังเปิดหน้าไม่ได้มานับเป็นผลเกม

## 1. T35-N1 — กรณีเดิมปิด แต่พบช่องโหว่ใหม่

`python3 -I -B qa/g4/suites_cmp_selftest.py` → **exit 0, 38/38, wrong=[]** แบ่งผลที่คาดเป็น exit 0 จำนวน 12, exit 1 จำนวน 11, exit 3 จำนวน 15 ตรงรายงาน Claude

สร้าง fixture เดิมใหม่เองพร้อม `env.txt`, `suites.tsv` และ `ALLDONE` ตาม v3 (ยกเว้นกรณีจงใจขาด) ไม่อาศัยเฉพาะ fixture ของ Claude:

| กรณี | จำนวนรอบต่อฝั่ง | ผล v3 จริง | ตรงที่ควร |
|---|---:|---:|---|
| ทั้งคู่ exit 1 / error A2 เดียวกัน | 3 | 0 | ใช่ |
| main A2; branch exit 124 + log ว่าง | 3 | 1 | ใช่ |
| main A2; branch A5 ข้อความส่วนอื่นเหมือนกัน | 3 | 1 | ใช่ |
| main A2; branch `new regression` | 3 | 1 | ใช่ |
| ทั้งคู่ A2 แต่มีรอบเดียว ไม่มี ALLDONE | 1 | 3 | ใช่ |

ตรวจเพิ่ม: SHA ของไฟล์ชุดสองฝั่งต่างกัน → exit 3; ลำดับ assert ก่อน/หลังและคนละคอลัมน์ครอบใน self-test ที่ผ่านจริง ไม่พบการตกผิดใหม่จากพอร์ต/โฟลเดอร์ในคู่จริง การแทนค่าตัวเลขเดี่ยวมีข้อจำกัดที่เอกสารยอมรับอยู่แล้ว: legacy `{"count":10}` → `{"count":0}` ยัง exit 0 จึงห้ามใช้ M1 นี้รับรองค่าตัวเลขเกมที่ legacy ไม่ assert; ไม่จัดเป็นข้อค้นพบใหม่ซ้ำข้อจำกัดที่ประกาศไว้

### T36-N1 — กลาง: ผล legacy หายบางบรรทัดยัง exit 0

ตำแหน่ง `qa/g4/suites_cmp.py:201–204` ใช้ `union(branch.out) - union(main.out)` เพียงทิศเดียว จึงเห็นบรรทัดเพิ่ม/เปลี่ยน แต่ไม่เห็นบรรทัดที่หาย และ set ไม่รักษาลำดับ/จำนวนซ้ำ

**วิธีทำซ้ำ:** fixture ชนิด legacy ใช้ชื่อและ SHA จริงของ `test_109_mail.js` ทั้งสองฝั่ง มี metadata ครบและ `ALLDONE` ระบุ 6 รอบ; main/branch ฝั่งละ 3 รอบ exit 0 ทั้งหมด main พิมพ์ JSON หลายบรรทัดที่มี `start`, `feature: true`, `end` และท้าย `errors 0 []`; branch พิมพ์เหมือนกันทุกบรรทัดแต่ลบบรรทัด `"feature": true,` ออกทั้ง 3 รอบ (เช่น property กลายเป็น undefined จน JSON.stringify ไม่พิมพ์)

**ผลจริง:** `metaOk=true`, runs=6, bothPass=1, verdict=pass, **exit 0** แม้ผลพิมพ์ไม่เท่ากันและ runner ขอ rerun แล้ว กรณีสลับ `alpha / beta` เป็น `beta / alpha` ก็ exit 0 เช่นกัน

**ควร:** อย่างน้อย `OUTPUT DIFFERS`, exit 3 ให้คนอ่าน มิใช่ผ่านอัตโนมัติ ขอให้ตรวจการหายด้วย ไม่ใช่เฉพาะรายการใหม่ และมี negative test สำหรับผลที่เป็น subset ของ main ถ้ามีรายการสุ่ม/ค่าผันผวนให้จำกัดขอบเขตที่ละเว้นโดยชัดเจน ความผิดนี้เกิดได้กับผลที่รันจบครบ ไม่ต้องลบไฟล์หรือแก้ metadata

### T36-N2 — กลาง: ลบรอบที่มี regression แล้วข้อมูลไม่ครบกลับผ่าน

ตำแหน่ง `qa/g4/suites_cmp.py:158,170–177`: ตรวจเพียงการมี ALLDONE จากนั้นกรองรอบที่หายออกและนับจำนวนที่เหลือ ไม่ยืนยันเลขรอบ 2–3 ตาม BASELINE §2.1 หรือจำนวนรอบใน ALLDONE

**วิธีทำซ้ำ:** fixture assert `test_178_dig_button` มีรอบ 1–5 ครบทั้งสองฝั่ง (10 การรัน); main A2 ทุกครั้ง, branch A2 ยกเว้นรอบ 2 เป็น `new regression`; SHA สองฝั่งตรง, `ALLDONE = DONE suites=1 runs=10`:

- ก่อนลบ → **exit 1**, runs=10, `NEW ERROR LINES` ถูกต้อง
- ลบไฟล์ `.main.2.log/.exit` และ `.branch.2.log/.exit` เพียง 4 ไฟล์ คง ALLDONE ไว้ → **exit 0**, runs=8, `metaOk=true`, verdict=pass ทั้งที่รอบที่มี regression หายไป
- อีก fixture ที่เหลือรอบ 1,3,4 เท่านั้นทั้งสองฝั่งก็ exit 0

**ควร:** ผลไม่ครบ → exit 3 ก่อนตัดสิน การรันตามปกติของ runner ไม่ได้ข้ามเลขรอบ แต่ด่านตรวจผลต้องไม่รับหลักฐานที่เสียหาย/ถูกลบบางรอบแล้วอ้างว่าครบ ขอให้ผูกผลกับรายการรอบที่คาดจาก runner, ตรวจลำดับต่อเนื่องและความครบของ log/exit รวมถึงจำนวนที่ประกาศ เพิ่ม self-test ที่ลบรอบซึ่งมี failure แล้วต้องไม่ผ่าน ไม่ต้องซ่อมชุดเกมเก่า

## 2. คู่จริงและสำเนาฝังผิด

คำสั่งหลัก (ตั้ง CHROME_EXE/NODE_PATH/NODE_OPTIONS ตามวิธีข้างต้น):

```sh
MAIN_DIR=/workspace/t14-main BRANCH_DIR=/workspace/t14-main \
ONLY="test_103 test_109 test_167 test_170 test_178" OUT=/tmp/t36/control \
bash qa/g4/suites_pair.sh
python3 -I -B qa/g4/suites_cmp.py /tmp/t36/control
```

**runner exit 0; comparator exit 0, 5 ชุด / 14 การรัน, bad 0, undecided 0, metaOk=true, bothPass=4**:

| ชุด | main exit | branch exit | ผลตัวตัดสิน |
|---|---|---|---|
| 103 legacy | 0,0,0 | 0,0,0 | fail ตาม page error `test boom` ที่ชุดจงใจสร้างทั้งคู่; ไม่มี failure ใหม่ จึงผ่านคู่ |
| 109 legacy | 0 | 0 | ผ่าน |
| 167 assert | 0 | 0 | ผ่าน |
| 170 assert | 0 | 0 | ผ่าน |
| 178 assert | 0 | 0 | ผ่าน |

ไม่ตกเพราะพอร์ต/โฟลเดอร์/เวลา และไม่มี exit 3 ที่ต้องเพิ่มเป็น 5 รอบ ในเครื่องนี้ 167/170/178 ผ่าน จึงไม่ถือผลตกจากประวัติ Claude เป็นค่าที่ต้องได้ซ้ำ

**สำเนาฝังผิดจริง:** export main `eb60c65` ไป `/tmp/t36/bad-main` แล้วเพิ่มเพียง `<script>setTimeout(()=>{throw new Error("T36 injected page error")},5000)</script>` ก่อน `</body>` ในสำเนา; ตรวจว่าถอดบรรทัดนี้แล้ว bytes ตรง main เดิม ใช้ `MAIN_DIR=/workspace/t14-main BRANCH_DIR=/tmp/t36/bad-main ONLY="test_104" OUT=/tmp/t36/planted` กับ runner/comparator เดิม

ผล **runner exit 0; comparator exit 1, NEW FAIL, metaOk=true, 1 legacy / 6 การรัน** main process exit `[0,0,0]`, branch `[0,0,0]` เช่นกัน แต่ branch มี page error `T36 injected page error` ทั้ง3รอบ จึงถูกปฏิเสธจริง ไม่ใช้ process exit 0 ของ legacy เป็นหลักฐานผ่าน ตรงข้อกำหนดอย่างน้อย1แบบที่ชุดเก่าเห็น สำเนานี้และผลทั้งหมดไม่อยู่ใน commit

## 3. กติกา exit 3 ของ legacy และ NEW STOP POINT

**รับหลักการ exit 3** สำหรับ OUTPUT DIFFERS ของ legacy 32 ชุด: ชุดไม่ได้มี assertion ที่บอกว่าค่าใดถูก และพบความสุ่ม/เวลาจริง เช่น mail และ fire จึงยังสรุป regression เป็น exit 1 จากผลพิมพ์ต่างอย่างเดียวไม่ได้ แต่ **ต้องตรวจผลต่างทั้งการเพิ่มและการหายตาม N1** และ exit 3 ต้องไม่ถูกนับเป็นผ่าน

รับการแยก assertion หยุดก่อนจุด main = 1; หลังทุกจุด main = 3 ให้ตรวจว่าเดินทางต่อไปได้จริง ไม่ควรรับโดยอ้างเลขบรรทัดอย่างเดียว เพราะโค้ดมี branch/loop/call helper การเก็บ `(line,column)` ช่วยแยก assert ในบรรทัดเดียวกันได้ ส่วน implementation ให้ NEW STOP POINT = 3 กับตำแหน่งใหม่ที่ไม่พิสูจน์ว่าอยู่ก่อนด้วย (รวมตำแหน่งเท่าเดิม/อ่านไม่ได้) กว้างกว่าคำว่า “ยกเว้นข้อเดียว” ใน §2.5 แต่ยังไม่ทำให้ผ่าน ควรบันทึกเป็น **unknown stop** และส่งคนอ่าน ไม่เรียกว่าไปได้ไกลกว่าโดยไม่มีหลักฐาน

รับขั้นตอน §2.6: รัน `RERUNS=4` ให้ครบ 5 ต่อฝั่งในโฟลเดอร์เดิม เก็บทุกผล ไม่เลือกชุดที่ดีกว่า; ถ้ายังค้าง3 ต้องรายงานทุกบรรทัด/เหตุผลให้ Codex ตรวจ ก่อนนับว่าผ่าน ไม่ควรเปลี่ยนทุก OUTPUT DIFFERS เป็น 1 เพื่อหลบการตรวจนี้ ทั้งนี้โฟลเดอร์เดิมต้องเป็น target/commit/ชุดเดิม; งานคนละ target ให้ใช้ OUT ใหม่

## 4. T35-N2 — ปิด: Offscreen เพิ่ม 64 MiB

รัน `memory.js` v3.1 เดิมกับเกม main ทั้งปกติและ `--inject offscreen` **exit 0 / page errors 0 ทั้งคู่**:

| จุดวัด resident | ปกติ MiB | offscreen MiB |
|---|---:|---:|
| capital | 160.54 | 160.54 |
| farm | 193.91 | 193.91 |
| cavemouth / peak ที่เก็บได้ | **205.88** | **269.88** |
| เพิ่ม | — | **64.00** |

ทำ probe T35 เดิมซ้ำด้วย HOOK/MEASURE ของฉบับนี้: เริ่ม0 → HTML canvas64 → เก็บ ImageData.data อีก64 รวม128 → เพิ่ม wrapper สองตัวแชร์ buffer ยังคง128 → เอา canvas ออกเหลือ64 → เก็บ Offscreen2D.getImageData().data อีก64และย่อ canvas เป็น0 → **128 MiB** (ฉบับก่อนยัง64) อ่าน buffer ทั้งสองได้จริง ตัวละ **67,108,864 bytes**, buffer Offscreen อ่านค่า77ได้ ไม่ได้นับ wrapper ซ้ำ

hook ครอบทั้ง CanvasRenderingContext2D และ OffscreenCanvasRenderingContext2D แล้ว ขอบเขตยังเป็นรูป/บัฟเฟอร์ที่เก็บได้ใน main thread และจุดวัดหลัง GC ไม่ใช่ process RSS หรือยอดสูงสุดทุกขณะ; Worker/WebGL/VideoFrame/ImageDecoder อยู่นอกขอบเขตตามหมายเหตุเดิม ไม่พบข้อใหม่ในเส้นทางที่ทดสอบ

## 5. M6 — คู่ควบคุมเปิดเองตามโค้ด

`qa/g4/fps.js:19–22` เมื่อมี 2 target และ CONTROL ไม่ใช่0 แทรกสำเนา targetแรกเป็น targetที่2 ทำให้วัด main/control/branch โดยอัตโนมัติ `:73–81` ใช้ targetสุดท้ายเป็น candidate, มัธยฐานอัตราส่วนที่จับคู่ตามรอบ และตรวจ control ±5%

ถ้าป้อน2เป้าและ `CONTROL=0`: ไม่เพิ่ม control, hard failure ยัง exit1 ได้; กรณีไม่ hard fail → `undecided: no control` และผลรวม exit3 (`:83–89`) จึงไม่ผ่านโดยลืมเปิด control แล้ว **รับการแก้ข้อนี้ในระดับโค้ด** ไม่ได้อ้างว่ารัน M6 เต็มใหม่ กรณี targetเดียวเป็นการวัดฐาน ไม่ใช่ด่านเปรียบเทียบสองเป้า

## 6. ข้อสรุปส่งกลับ

- ปิดกรณีเดิมของ T35-N1 5/5 แต่ **ยังไม่ปิด R3/M1 ทั้งข้อ** เพราะ T36-N1/N2 ทำให้ข้อมูลเสียผ่านอัตโนมัติ
- ปิด T35-N2; ฐาน205.88และ +64.00 ตรงทั้งสคริปต์จริงและ probe เดิม
- รับการเปิดคู่ควบคุม M6 และกระบวนการ exit3 ที่ต้องให้คนอ่าน โดยไม่ถือว่า exit3 คือผ่าน
- ใหม่ **สูง0 / กลาง2 / ต่ำ0**; ขอแก้เฉพาะตัวตรวจความครบและการเปรียบเทียบ legacy พร้อม negative tests แล้วตรวจซ้ำก่อนถือ G4.0 เป็นด่านครบสำหรับ G4.1 ไม่เสนอแก้ภาพ/เกม/เกณฑ์เอง

ไฟล์ส่งมีเพียงรายงานนี้กับ CODEX_STATUS.md เพิ่ม1บรรทัด ไม่มี raw log, ภาพ, สำเนาฝังผิด, fixture หรือสคริปต์ตรวจใน commit ไม่แก้ไฟล์ของ Claude/index.html/sw.js หรือภาพ ใช้เครดิต0
