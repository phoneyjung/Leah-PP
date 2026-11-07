# T37 — ยืนยัน G4.0 ฉบับ 1.3 หลัง T36

7 พ.ย. 2569 (เวลาไทย) · ฐาน `aed59fb59ed03aed59327ad31fd2f820bccf0e13` · เกม `main eb60c650922e55c7d81b27b59f180e1f42c367b2` · ส่ง `codex/t37-confirm-g40-v13` · เครดิต0

**ปิดกรณีเดิม T36-N1/N2 ได้ 2/2**: self-test49/49, fixtureเดิมทั้ง4แบบไม่ผ่านผิดแล้ว, คู่จริง main↔main exit0 และสำเนาฝัง page error exit1, resumeผิดเป้าexit2 แต่พบใหม่ **สูง0 / กลาง1 / ต่ำ1** — metadata `kind` เปลี่ยนแล้วข้ามการเทียบ legacy ได้ และ log ที่ไม่มีคู่ exit ถูกข้าม **ยังไม่แนะนำรับ G4.0 เป็นด่านครบเพื่อเริ่ม G4.1** จนปิดข้อกลาง T37-N1 รายละเอียดข้อ5

## วิธีตรวจ

อ่าน HANDOFF T37, BASELINE §12 ก่อน แล้ว §2 และ `qa/g4/g40-m1-v3_1.json`; ตรวจ diff และโค้ด runner/comparator/self-test จากฐานงาน อ่าน AGENTS/กติกาทีม และยืนยันว่าไม่ได้เปลี่ยนจากฐาน T36 ใช้ Chromium151.0.7922.173, Node24.19.0, Puppeteer Core24.26.1 ผ่าน alias นอก repo

หลัง environment กลับมาเชื่อมต่อ `/workspace` ยังอยู่ แต่ `/tmp` ของ T36 หายไป จึงสร้าง fixture/probe เดิมใหม่จากรายงาน T36 ติดตั้ง dependency นอก repo และสร้าง OUT ใหม่ทั้งหมดใน `/tmp/t37` ใช้เกม main ที่ localhost8790/8791 กับ browser profile ชั่วคราว ไม่มีเซฟผู้เล่นจริง ไม่แตะไฟล์ภาพ/เกม/ไฟล์เครื่องตรวจของ Claude

เหมือน T36: Node preload เปลี่ยนเฉพาะปลายทาง `Page.screenshot({path})` ไป OUT_DIR เพื่อไม่ให้ `test_109_mail` สร้าง `mail_h9.png` ใน repo ใช้เหมือนกันทั้งสองฝั่ง ไม่เปลี่ยนเกม/ข้อทดสอบ/ผล stdout ไม่รันครบ115ชุดหรือวัด FPS/หน่วยความจำซ้ำ เพราะ T37 เป็นงานตัวตัดสิน M1 และคำอธิบายด่าน

## 1. T36-N1 — fixture เดิมปิด

`python3 -I -B qa/g4/suites_cmp_selftest.py` → **exit0, 49/49, wrong=[]**: คาด0 จำนวน12, คาด1 จำนวน12, คาด3 จำนวน25 ตรงรายงาน Claude

สร้าง fixture ของ Codex เองพร้อม suites.tsv/env/runs.tsv/ALLDONE v3.1 ไม่ใช้ผลของ self-test มาตอบแทน:

| กรณี | ผลจริง | รายละเอียด |
|---|---:|---|
| ลบบรรทัด `"feature": true,` จาก branch ทั้ง3รอบ | exit3 | OUTPUT DIFFERS; missing ระบุบรรทัดนั้น, metaOk=true |
| `alpha / beta` สลับเป็น `beta / alpha` ทั้ง3รอบ | exit3 | OUTPUT DIFFERS; ลำดับไม่ถูกทำเป็น set แล้ว |
| main/branch A2 เหมือนกัน ฝั่งละ3รอบ | exit0 | control ไม่ถูกปฏิเสธผิด |
| legacy ต่างเฉพาะตัวเลขเดี่ยว | exit0 | ตรงขอบเขต masking เดิม ไม่ได้รับรองค่าตัวเลขเกม |

โค้ด `suites_cmp.py:254–271` เทียบ list ของผลแต่ละรอบ branch กับผล main หนึ่งรอบทั้งก้อน รักษาลำดับและจำนวนซ้ำ พร้อม added/missing ผ่านกรณี L06–L09 จริง **ปิดการแก้ T36-N1 ตามกรณีเดิม**; ช่องทาง metadata ใหม่แยกในข้อ5

## 2. T36-N2 — การลบรอบและหลักฐานหลังรัน

fixture ของ Codex:

- ก่อนลบ: main A2 ทั้ง5รอบ; branch A2 ยกเว้นรอบ2 เป็น `new regression` → exit1, runs10 ถูกต้อง
- ลบ `.main.2.log/.exit` และ `.branch.2.log/.exit` โดยคง runs.tsv/ALLDONE → **exit3**, meta ระบุไฟล์ที่หาย + เลขรอบขาด; ไม่กลับผ่านเหมือน v3
- สร้างรอบ **1,3,4** ทั้งสองฝั่ง โดย runs.tsv/ALLDONE ตรงกับไฟล์จริง → **exit3**, meta ระบุ gap; พิสูจน์ว่าไม่ได้อาศัยแค่ checksum ต่าง

คัดลอก OUT ที่ runner v3.1 สร้างจริงหลังคู่ควบคุมจบ (ไม่แตะต้นฉบับผล) แล้วแก้ทีละแบบ:

| การทำหลักฐานเสีย | ผลจริง |
|---|---:|
| ลบรอบ2ของ103 ทั้งสองฝั่ง4ไฟล์ | exit3 |
| ลบเฉพาะ branch log รอบ1 | exit3 |
| แทน log ด้วย `errors 0 []` | exit3 |
| เปลี่ยน exit เป็น124 | exit3 |
| เพิ่ม newline ใน runs.tsv โดยคง ALLDONE | exit3 |
| เปลี่ยน ALLDONE suites5→4 | exit3 |
| ลบ env.txt | exit3 |
| เปลี่ยน SHA ฝั่ง branch ใน suites.tsv | exit3 |
| เพิ่มรอบ4ทั้ง log/exit ที่ runs.tsv ไม่ได้ระบุ | exit3 |
| เพิ่มเฉพาะ log รอบ99 โดยไม่มี exit | **exit0** — ข้อสังเกตต่ำ T37-N2 |

เก้ากรณีแรกปฏิเสธ **9/9** ตรงเกณฑ์ การลบรอบเดิมของ T36-N2 ปิดได้ ส่วนไฟล์ log ที่ไม่มีคู่แยกอธิบายในข้อ5

ไม่ปลอม runs.tsv และ ALLDONE พร้อมกันเพื่อหลบ hash ตามขอบเขตที่ประกาศไว้

## 3. คู่จริง / สำเนาฝังผิด / resume ผิดเป้า

```sh
MAIN_DIR=/workspace/t14-main BRANCH_DIR=/workspace/t14-main \
ONLY="test_103 test_109 test_167 test_170 test_178" OUT=/tmp/t37/control \
bash qa/g4/suites_pair.sh
python3 -I -B qa/g4/suites_cmp.py /tmp/t37/control
```

**runner exit0; comparator exit0**: suites5, legacy2, runs14, bothPass4, bad=[], undecided=[], metaOk=true พร้อม ALLDONE ของ v3.1 ตรวจแฮช log และ exit จาก runs.tsv ซ้ำด้วยโค้ดของ Codex ตรง **14/14**

| ชุด | main exit | branch exit | ผล |
|---|---|---|---|
| 103 legacy | 0,0,0 | 0,0,0 | page error `test boom` ที่ชุดฝังเองเท่ากัน จึงไม่ถอยหลัง |
| 109 legacy | 0 | 0 | ผ่าน |
| 167 assert | 0 | 0 | ผ่าน |
| 170 assert | 0 | 0 | ผ่าน |
| 178 assert | 0 | 0 | ผ่าน |

ไม่มี exit3 ในคู่ควบคุม จึงไม่ต้องขยายเป็น5รอบ; ไม่ตกเพราะพอร์ต/โฟลเดอร์/เวลา

สำเนาฝัง page error: export main ไป `/tmp/t37/bad-main` เพิ่ม script `setTimeout(()=>{throw new Error("T37 injected page error")},5000)` ก่อนปิด body ในสำเนาเท่านั้น ใช้ runner v3.1 `ONLY=test_104` และ OUT ใหม่

**runner exit0; comparator exit1 NEW FAIL**: legacy1ชุด, runs6, metaOk=true; main process exit0ทั้ง3รอบและ branch process exit0ทั้ง3รอบ แต่ branch log มี `T37 injected page error` ทั้ง3รอบ ตัวตัดสินจึงปฏิเสธข้อมูลผิดจริงแม้ legacy ไม่คืน process exit1

หลัง control จบ รัน runner อีกครั้งใน OUT เดิมโดยเปลี่ยนเฉพาะ BRANCH_DIR ไปสำเนาฝังผิด → **exit2**, ข้อความ `belongs to another target (folders/HEAD/game files differ): use a new OUT` คำนวณ SHA-256 ของไฟล์ทั้งโฟลเดอร์ก่อน/หลัง **85/85 เหมือนเดิม** รวม ALLDONE/runs.tsv ไม่ได้ลบหลักฐานเก่าทิ้งก่อนปฏิเสธ

## 4. NEW STOP POINT / UNKNOWN STOP / exit3

**ตรงที่ขอและปิดได้ในระดับกติกา:** โค้ด `suites_cmp.py:241–248` ใช้ NEW STOP POINT เมื่อเลขตำแหน่งอยู่หลังทุกจุดของ main โดยเขียน `MAY have got further — a person checks` และ UNKNOWN STOP เมื่อจัดตำแหน่งก่อน main ไม่ได้ ทั้งสองเป็น exit3 ไม่ได้อ้างลำดับในไฟล์ว่าเป็นลำดับการวิ่งแน่นอน ข้อ2.5 ระบุ loop/helper และข้อ2.6 ยังคง rerunครบ5ต่อฝั่ง (`RERUNS=4`) แล้วส่งทุกประเด็นที่ยังค้างให้ Codex อ่าน ห้ามเลือกผลที่ดีกว่า/นับ3เป็นผ่าน/เปลี่ยน OUTPUT DIFFERS เป็นตกเพื่อหลบการตรวจ

ทำ STOP probe ของ Codex เพิ่มเอง 3 แบบ (มี manifest v3.1 ครบ): mainหยุดL100C10 → branchหยุดL200C10ได้ NEW STOP POINT/exit3; branchหยุดL50C10ได้ NEW ERROR LINES/exit1; branchไม่มีตำแหน่งใน suiteได้ UNKNOWN STOP/exit3 **ตรง3/3**

ตำแหน่งก่อน main และ collected error ใหม่ยังเป็น exit1 ตามเดิม จำนวนและผล self-test ของกรณี assertion ตรงกัน ความต่างของ legacy ที่ยังตีความไม่ได้ยังควรเป็น3 ไม่ใช่ผ่านและไม่ใช่ regression โดยอัตโนมัติ

## 5. ปัญหาใหม่และความพร้อม G4.1

### T37-N1 — กลาง: kind ใน suites.tsv ผิดแล้วข้ามการเทียบ legacy

`qa/g4/suites_cmp.py:145–151` รับค่า kind ใด ๆ โดยไม่ตรวจ enum; `:254` ตรวจผลพิมพ์เฉพาะเมื่อเท่ากับ `legacy` เท่านั้น ขณะเดียวกันแฮชใน ALLDONE ผูกกับ runs.tsv ไม่ได้ผูก suites.tsv ค่า kind จึงเปลี่ยนได้โดย meta ยังผ่าน และไม่มีการตรวจใหม่ว่าตรงชนิดที่ runner เลือก

ยืนยันจากผล runner จริงเพิ่มเติม: export main ไปสำเนานอก repo เปลี่ยนคำ `hit:'ตี'` เป็น `hit:'ตีเลย'` เพียง1จุด (ไม่ใช้สำเนา page error) รัน `ONLY=test_121` ใน OUT ใหม่ครบ6การรัน → เดิม **exit3 OUTPUT DIFFERS** เห็นคำบนปุ่มที่ต่างกัน แล้วคัดลอกโฟลเดอร์ผลไปทดสอบสองกรณี:

| แก้ไฟล์เดียวหลัง runner จบ | ผลตัวตัดสิน |
|---|---|
| suites.tsv: `legacy` → `legacY` (ค่าไม่อยู่ในชนิดที่รู้จัก) | **exit0, metaOk=true, legacy=0** |
| suites.tsv: `legacy` → `assert` | **exit0, metaOk=true, legacy=0** |

log, exit, runs.tsv, ALLDONE และเกมที่ใช้สร้างหลักฐาน **ไม่เปลี่ยน** ในสองกรณีนี้ ไม่ใช่การปลอม runs.tsv+ALLDONE พร้อมกันซึ่งงานยกเว้นไว้ ทำซ้ำกับ fixture featureหายก็ให้ผล3→0เช่นกัน จึงมีช่องโหว่ในข้อมูลที่ใช้เลือกวิธีตรวจ ไม่ใช่ความแกว่งของเกม

ขอให้ปฏิเสธ kind นอก `legacy/assert` และผูก metadata ที่เลือกวิธีตรวจ (อย่างน้อย suites.tsv) กับหลักฐานที่ runner ปิดท้าย เช่น checksum ที่รวมอยู่ใน completion manifest พร้อมทดสอบการเปลี่ยน kind ทั้งค่าสะกดผิดและค่าถูก enum แต่ไม่ตรงต้นฉบับ ไม่จำเป็นต้องทำระบบป้องกันผู้โจมตีที่ปลอมหลักฐานทั้งหมด; เป็นการป้องกันผลที่เปลี่ยน/เสียหายบางไฟล์ตามขอบเขตงานนี้

### T37-N2 — ต่ำ: เพิ่ม log รอบที่ไม่มีใน runs.tsv ยังไม่ถูกแจ้ง

`qa/g4/suites_cmp.py:179–181,184–190` หาไฟล์รอบจาก `.exit` เท่านั้น เมื่อเพิ่ม `test_103_village.branch.99.log` ที่มี `Error: new regression` ในสำเนา OUT ของคู่ควบคุม โดยไม่มี `.exit` และไม่แก้ manifest → **exit0, metaOk=true** ไฟล์เพิ่มไม่ถูกมองเห็น

จัดต่ำเพราะไม่ได้เปลี่ยน verdict ของรอบที่อยู่ใน manifest และ runner ปกติลบ ALLDONE ก่อนเริ่มรอบใหม่ จึงไม่ใช่หลักฐานว่าเกมที่ถอยหลังจริงผ่านจากกรณีนี้โดยตัวมันเอง แต่ไม่ตรงคำว่าไม่มีไฟล์รอบนอกรายการ ควรตรวจชื่อ `.log` ที่ไม่มีคู่ `.exit`/ไม่มีรายการด้วย แล้วให้ exit3 หรือล็อกขอบเขตให้ชัดว่าไฟล์ประเภทใดเป็น artifact ที่ข้ามได้ กรณีนี้ต่างจากการเพิ่ม log+exit ซึ่งถูกปฏิเสธแล้ว

**ข้อเสนอ:** ปิด T36-N1/N2 ตามการแก้เดิมได้ 2/2 และรับ STOP/ขั้นตอน exit3 แต่ **ยังไม่แนะนำรับ G4.0 เป็นด่านครบเพื่อเริ่ม G4.1** จนปิด T37-N1 ที่ทำให้ข้าม legacy ได้; T37-N2 เป็นข้อเก็บงานความครบของ artifact ใหม่ **สูง0 / กลาง1 / ต่ำ1** ไม่เสนอแก้เกม ภาพ หรือเพิ่มงานผลิต


ไฟล์ส่งเฉพาะ `REVIEW_CODEX_T37_G40.md` และ `CODEX_STATUS.md` เพิ่ม1บรรทัด ไม่ใส่ผลดิบ/fixture/สำเนาฝังผิด/ภาพใน repo ไม่แก้ Claude/index.html/sw.js/ภาพ ไม่ใช้เครดิต ไม่แตะเซฟจริง ไม่ push main หรือ force push
