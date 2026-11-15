# T49 — ตรวจหน้าวัดมือถือฉบับ 4 · ฉบับ 1.0

วันที่ 15 พ.ย. 2569 · ฐานงาน `claude/g2-pilot @ b8f5fdf` · ตรวจ `claude/g4-char2 @ dbe6371` / bench v4 `9ca003c` · ส่ง `codex/t49-review-bench4`

**T48-N1 ปิดได้: swapback แบบไม่ intercept ทั้งภาพ 1×1 และภาพขนาดเดิมถูกจับในรอบเต็ม ส่วน control ผ่าน. แต่ T47-N4 ยังปิดทั้งข้อไม่ได้ และยังไม่รับรองให้เจ้าของวัดเพื่อปิด M6:** พบทางผ่านผิดใหม่ระดับกลาง 1 ข้อ — GET ตอบ 304 ไม่มี body แล้วเกมใช้ฉากสำรอง แต่หน้าวัดให้ full pass. พบข้อสังเกตต่ำ 1 ข้อเรื่องเก็บภาพอ้างอิงค้างหลังตรวจ. สูง 0 / กลาง 1 / ต่ำ 1.

## 1. วิธีตรวจและความตรงของสำเนา

อ่านงาน T49, `G4_6_REPORT.md` ฉบับ 1.3 ข้อ 2.7, หัวไฟล์ bench/prelude และรายงาน T48 ข้อ 6 ก่อนตรวจ. ใช้ `git archive dbe6371` ไป `/tmp/t49/v4`; dependency, fixture, ผลดิบและภาพทั้งหมดอยู่ใน `/tmp/t49` ไม่ commit.

- Node 24.19.0 · Puppeteer 25.8.0 · Chromium **151.0.7922.173** · รัน Chromium **นอก sandbox หลังได้รับอนุญาต**
- browser context ใหม่ทุกกรณี; จำลองมือถือ 844×390, DPR 3, touch/coarse pointer. ชุด Claude ใช้ UA 153 ตามสคริปต์เดิม; probe อิสระใช้ UA 151. **ทั้งสองอย่างเป็นเครื่องจำลอง ไม่ใช่มือถือจริงของเจ้าของ**
- รัน browser workload ทีละชุด; ไม่เปลี่ยนเกณฑ์หรือเครื่องตรวจของ Claude. ไม่มี request interception ใน selftest และ probe อิสระ
- ทุก full probe กดปุ่มเริ่มจริง, ไม่มี `?short` / `__benchTest`, 18 รอบ: settle 1,500 ms + วัด 5,000 ms ต่อรอบ. ตรวจท้ายรอบว่า `FB_CONFIG` undefined และ `Net.online=false`; ใช้เซฟสังเคราะห์ใน context ของตนเอง

| รายการ | วัดได้ |
|---|---|
| build | 313 ไฟล์ · 26,892,217 bytes · แบ่ง 250+63 |
| `page.html` | 1,632,941 bytes |
| ขนาดและ SHA-256 เทียบ manifest กับ source | ตรง 313/313 |
| ความต่างจาก `index.html` | เฉพาะ 5 กลุ่มที่ระบุ; ถอดส่วนแทรกแล้วเทียบส่วนที่เหลือได้ตรง |
| 5 กลุ่ม | เอา document wrapper ออก · เปลี่ยน title · เอา firebase-config script ออก · แทรก build+prelude หลัง title · ต่อ bench script ท้ายหน้า |
| firebase-config | ไม่มีใน manifest และไม่มี script tag ในหน้า |
| ไฟล์ตรวจหลังรัน | index/sw/char2 และ builder/bench/prelude/selftest รวม 7 ไฟล์ ตรง `dbe6371` ทุกไบต์ |

## 2. ชุดของ Claude

คำสั่งที่รันบน source archive:

```sh
python3 -B qa/g4/build_phone_bench.py /tmp/t49/v4 /tmp/t49/bench4
FULL=1 NODE_PATH=/tmp/t49/pp/node_modules CHROME_EXE=/usr/bin/chromium \
  node qa/g4/phone_bench_selftest.js /tmp/t49/bench4 /tmp/t49/out/selftest.json
```

**26/26, exit 0 · retried=[] · noisy=[]**. ไม่รันชุดเต็มซ้ำเพื่อเลือกผล. ทั้ง 25 กรณีสั้นและ full ผ่านครั้งแรก; `lite` จับโหมดกราฟิกผิดได้และไม่มีเหตุ noise เพิ่ม. กรณี `stall` ได้ interrupted+unstable ตาม `wantHas` เดิม ไม่ใช่การผ่อนเงื่อนไขใหม่.

Full ของชุดนี้: pass, reasons=[], ทุกฉาก ok; อัตราส่วนเมือง/ฟาร์ม/ถ้ำ **1.004 / 1.001 / 0.999**. ไฟล์ asked/hashed **198/198**, images equal **172/172**, fetched bodies **28**, `char2.js` guarded=true/state=loaded; missing/failed/wrong=0. ตรวจไฟล์ท้ายรอบ 5,977 ms.

กรณีใหม่ทั้ง 5 (`firstwrong`, `firstwrong_nostore`, `firstsame_nostore`, `firstjson_nostore`, `firstscript_nostore`) ได้ void/files ตามคาด. ตัวตรวจ 26 ข้อนี้ยังไม่ครอบคลุม HTTP 304 ที่พบในข้อ 5.

## 3. Probe อิสระเต็มรอบ — ไม่ intercept

สร้าง HTTP server ของ Codex แยกจาก selftest; serve เฉพาะ page และไฟล์ใน manifest. ทุกคำตอบตั้ง `Cache-Control: no-store`. ไม่แก้ page, manifest, ตัวตัดสิน หรือไฟล์ต้นทาง. บันทึก status/ขนาด/SHA ของคำตอบจริงที่ server ส่งและ resource log ของ browser.

| กรณี | ผลจริง | อัตราส่วน S1/S2/S3 | ภาพถ้ำที่เกมถือ | ภาพตรง |
|---|---|---|---|---|
| control | **pass**, reasons=[] | 0.9970 / 1.0071 / 0.9998 | 1536×1024, ทึบ 1,572,864 จุด | 172/172 |
| swapback PNG 1×1 | **void**, reasons=[files] | 1.0003 / 0.9980 / 1.0001 | canvas 1×1, ทึบ 0 จุด | 171/172 |
| swapback JPEG ขนาดเดิม | **void**, reasons=[files] | 1.0078 / 1.0004 / 1.0002 | image 1536×1024 | 171/172 |

ทั้งสามกรณี: exit ของ harness 0, pageErrors=0, ทุกฉาก ok ไม่มี cut/shaky; asked/hashed=198/198, fetched bodies=28. สองกรณีเสียมี wrong เพียง `map-cave-mouth.jpg`, missing/failed=0. จึงตกด้วยการตรวจไฟล์จริง ไม่ได้อาศัยความแกว่งหรือการสะดุดให้ตก. ดู screenshot ของ control และผลท้ายรอบประกอบแล้ว.

รายละเอียดคำตอบแรกของ `map-cave-mouth.jpg`:

- PNG โปร่งใส 1×1 เติมท้ายจน **462,551 bytes** เท่าต้นฉบับ. SHA `0135866dc72bd3d0aec453bd51a15c756787e4007a27ec877c7485ce45804c35`
- JPEG: ใช้ bytes เดิม แต่ทาช่วง `[floor(length×0.57), +3333)` เป็น 0. ยัง **462,551 bytes / 1536×1024**; Pillow decode พบต่าง 220,182 พิกเซล. SHA `ca89ff9ae412d7d7557fab81c90a1337ad2b545dd9d8f73cf3ea69cb6bc60647` (จำนวนจุดนี้มาจาก Pillow ไม่ใช่ตัวเลข comparator ของ browser)
- ทั้งคู่: คำตอบครั้งที่สองเป็น JPEG ต้นฉบับ SHA `2ee092ea0fdab0fc546acb38d5fab726eb8873122fe3d1036c40734b2410adf6`. server ยืนยัน GET แยก 2 ครั้ง; ภาพที่เกมถือยังเป็นคำตอบแรก. จึงยืนยัน **T48-N1 ปิด** ในเงื่อนไข no-store โดยไม่พึ่ง interception

## 4. ถอดด่านและตรวจ load record

แก้เฉพาะสำเนา `page.html` ใน `/tmp/t49/mut-*` ทีละจุด และใช้ selftest เดิมของ Claude. ทุกแบบตกครบ **3 ครั้ง** ตาม retry ที่สคริปต์มีอยู่ แล้ว exit 1; ไม่เปลี่ยนผลคาดหวัง.

| ด่านที่ถอด | CASES | ผลตัวตรวจ | หลักฐาน |
|---|---|---|---|
| `same(el,im)` → true | firstsame_nostore | 0/1, exit 1 | bench verdictIfCounted=pass ทั้งที่ภาพผิด; reasons/more ไม่ผ่าน |
| ข้ามเงื่อนไข hash ของ body ใน `gets` | firstjson_nostore | 0/1, exit 1 | bench verdictIfCounted=pass ทั้งที่ JSON ครั้งแรกผิด; reasons/more ไม่ผ่าน |
| ไม่ใส่ค่า `integrity` ใน script src setter | firstscript_nostore | 0/1, exit 1 | script guarded=false/state=loaded, Char2 พร้อม; `more` ไม่ผ่าน เพราะสคริปต์ผิดไม่ได้ถูก browser ปฏิเสธ |

แบบ integrity ยังได้ void/files จากด่าน `guarded` อีกชั้นหนึ่งอยู่แล้ว — **ไม่อ้างว่าทั้งสาม mutation ทำให้ bench pass**. สิ่งที่ยืนยันครบ 3/3 คือ selftest ตรวจพบการถอดด่านตามโจทย์.

ตรวจ request/response แยกโดยใช้หน้าเล็กที่โหลด prelude ไฟล์เดิม เทียบ native กับ recorded ใน context ใหม่: GET แบบ string, GET แบบ Request, POST, HEAD, Image.src และ Script.src รวม **6 คำขอ**. URL/method/body/custom header/cache-control/pragma ที่ server ได้ตรงกัน; status/type/body ของ fetch ทั้ง **4/4** ตรงกัน; image decode และ script side effect ตรง. ไม่มีคำขอซ้ำจากการ clone. ชุดนี้ exit 0.

จากโค้ด `phone_bench_prelude.js:20–26`: ส่ง arguments เดิมให้ fetch0, clone เพื่ออ่านอีกสาย และคืน Response ตัวเดิม. Image setter ส่ง src เดิมให้ native setter. ข้อยกเว้นที่ตั้งใจคือใส่ SRI ให้สคริปต์ ซึ่งเปลี่ยนสิทธิ์ในการรันเมื่อเนื้อไฟล์ไม่ตรง แม้ไม่ได้เปลี่ยน body ที่ server ตอบ. ตัวห่อเพิ่ม microtask/clone และเก็บ reference; จึงไม่อ้างว่าไม่มี overhead. Hash/เทียบภาพทำหลัง 18 รอบ; capture ทำตอนโหลด รวมโหลด Char2 ในช่วงเตรียมก่อนวัด.

## 5. ปัญหาใหม่

### T49-N1 · กลาง — GET ที่ไม่มี body ถูกข้ามเหมือน HEAD ทำให้ฉากสำรองผ่าน

ตำแหน่ง `qa/g4/phone_bench_prelude.js:25` และ `qa/g4/phone_bench.js:132–134,163–165`:

- prelude เก็บ body เฉพาะ GET ที่ `res.ok`; GET 304 จึงมี status=304, body=null
- verifier ปฏิเสธ status ≥400 หรือ 0 เท่านั้น; จากนั้น `if (!g.body) continue; // a HEAD` โดยไม่ยืนยันว่าเป็น HEAD จริง
- resource check ก็ไม่ปฏิเสธ 304 และข้ามการเทียบขนาดเมื่อ decodedBodySize=0. การอ่าน reference ครั้งใหม่ถูกต้องจึงทำให้ files.ok=true

**ทำซ้ำกับไฟล์เดิมโดยไม่เปลี่ยนโค้ดหรือ counter:** context ใหม่; GET แรก `g9b-scene.json` → **304, no-store, body 0 bytes**; คำขอถัดไป → **200, no-store, JSON ต้นฉบับ 36,647 bytes**, SHA `0d2cbd07678c50f94099803a3df94442c5fa7d0ac421732b5236496df9d00885`. ไม่ใช่การจำลอง cache hit ที่สำเร็จ: browser ส่ง status=304/body=null ให้ game จริงและ `G9B` คง null. Loader ที่ `index.html:3569` ปฏิเสธ `!r.ok`; factory ฟาร์มถัดไปใช้ `_f12` เป็น fallback.

| หลักฐาน | รอบสั้นสำรวจ | รอบเต็มยืนยัน |
|---|---|---|
| verdict | void เพราะ mode; verdictIfCounted=pass | **pass**, reasons=[] |
| G9B / load record | null / GET 304 body=false | **null / GET 304 body=false** |
| files | ok=true; missing/failed/wrong=0 | **ok=true; missing/failed/wrong=0** |
| hash / ภาพ / fetch bodies | 198/198 · 172/172 · 27 | **198/198 · 172/172 · 27** (control=28) |
| อัตราส่วนเมือง/ฟาร์ม/ถ้ำ | 1.0046 / 0.9994 / 1.0035 | **1.0000 / 0.9969 / 1.0030** |
| error | pageErrors=0 | pageErrors=0, 18 รอบ, ไม่มี test timing/interception |

รอบเต็มมี 296–302 frames ต่อรอบ, ทุกฉาก ok ไม่มี cut/shaky. ฟาร์มใช้คำสั่ง draw ต่อเฟรมเพียง **17.23/18.23 เปิด/ปิด** เทียบ control **249.93/250.71** แต่ยังรายงานตรวจ ✓ และ “ผ่าน”. ดู screenshot ยืนยันข้อความบนหน้าจอแล้ว. เป็นการยอมรับ workload คนละฉาก ไม่ใช่เพียงรายงานจำนวนไฟล์คลาดเคลื่อน.

ข้อเสนอให้ Claude: GET ของ asset ที่ไม่มีคำตอบสำเร็จ/body ที่พิสูจน์ได้ต้องไม่นับ; แยก HEAD โดย method จริง ไม่ใช้ body=null เป็นตัวแทน HEAD. เพิ่ม first-304-empty → next-200-correct ใน selftest และ full negative control. คง positive case HEAD และการใช้ HTTP cache ตามปกติไว้ — cached revalidation ที่ browser คืน representation สำเร็จให้ game ต่างจาก raw 304/body ว่างใน probe นี้. **ไม่ควรแก้ด้วยการตรึง fetched bodies=28 อย่างเดียว.** ยังไม่ได้แก้โค้ดให้ Claude.

### T49-N2 · ต่ำ — ภาพอ้างอิงถูก load record เก็บค้างเองหลังตรวจ

`phone_bench.js:169` อ่าน setter หลัง prelude ห่อแล้ว; `setSrc.call(im,u)` ที่บรรทัด 184 จึงเข้า `phone_bench_prelude.js:19` และเพิ่มภาพ blob อ้างอิงทุกตัวลง `LOADS.img`. revokeObjectURL ไม่ได้ลบ element ออกจาก array. ขัดกับคอมเมนต์บรรทัด 176 ที่ว่าไม่เก็บภาพที่ decode ไว้.

Control หลังจบ: `LOADS.img` 384 ตัวไม่ซ้ำ; ในนี้มี **blob reference images 172 ตัว**. ผลรวม naturalWidth×naturalHeight×4 ของภาพอ้างอิง **184,479,144 B = 175.93 MiB**. ตัวเลขนี้เป็นขนาดพิกเซลสมมุติ RGBA **ไม่ใช่ RAM/RSS ที่วัดจริง** และไม่พิสูจน์ว่า browser ไม่ evict decoded data. ไม่พบ crash ในเครื่องนี้.

เป็นการเก็บวัตถุเกินจำเป็นหลังช่วงวัด ไม่ใช่ false pass หรือหลักฐานว่า FPS เอียง. เสนอให้ verifier ใช้ native setter ที่ไม่บันทึกตัวเอง หรือเลิกถือ reference ของภาพชั่วคราวเมื่อใช้เสร็จ. จัดต่ำและไม่ใช้ข้อนี้เพียงข้อเดียวขวางการวัดมือถือ.

## 6. ขอบเขตและคำตอบส่งต่อ

1. **T48-N1 ปิดได้**: control pass และ swapback no-store ทั้งสองแบบ void/files ใน full run แบบไม่ intercept. **T47-N4 ยังปิดทั้งข้อไม่ได้** เพราะ T49-N1 ยังยอมรับไฟล์ฉากที่ game ไม่ได้โหลดสำเร็จ
2. **ยังไม่ให้เจ้าของใช้ฉบับ 4 นี้วัดเพื่อปิด M6**: FULL 26/26 และถอดด่าน 3/3 ผ่านตามโจทย์ แต่ยังมีปัญหากลาง 1. ต้องแก้และยืนยันกรณี GET ไม่มี body ก่อน. ไม่เสนอรับ G4 จากผลจำลองนี้ และไม่ใช้ผลมือถือ 11 พ.ย. ที่ถอนแล้ว
3. CSS ภาพ HUD/หน้าที่ซ่อน และการอ่านซ้ำใน hunting-map worker: ยอมรับเป็นข้อจำกัดระดับต่ำเฉพาะสามฉากที่ตรึงไว้ ตามเส้นทาง `hunt1Warm212`/HUNT1W และรูป CSS ใน index; ไม่ใช่การรับรอง integrity ของทุกจอ/แผนที่. ต้องทบทวนเมื่อเพิ่มฉากหรือมี worker วาดลง canvas ที่วัด. ส่วน GET ที่ขาดของฉากฟาร์มในข้อ 5 อยู่ **ใน** ขอบเขต จึงยกเว้นแบบเดียวกันไม่ได้
4. การจำลองมือถือผ่าน device gate ได้เป็นข้อจำกัดที่ประกาศไว้; ผลจากเครื่องนี้พิสูจน์กลไกตรวจ ไม่แทนผลบนมือถือเจ้าของ. ยังไม่ได้ตรวจโฮสต์จริง/CSP/CORS/blob/SRI บนโฮสต์นั้น และไม่ได้เผยแพร่หน้าวัด
5. ไม่พบการเขียนทับ payload ของเกมโดย load record ในกรณีที่ตรวจ; มี extra clone/Promise/retained images และ draw wrappers. **ยังพิสูจน์ zero bias ไม่ได้**; ช่วง ±50 µs จาก T48 ไม่ใช่ขอบบนที่พิสูจน์แล้ว จึงไม่ใช้คำว่า “ไม่เกิน 0.6%” เป็นหลักประกันบนมือถือทุกเครื่อง

สรุปใหม่ **สูง 0 / กลาง 1 (T49-N1) / ต่ำ 1 (T49-N2)**. ส่งเฉพาะรายงานนี้กับ CODEX_STATUS หนึ่งบรรทัด; ไม่แก้ไฟล์ของ Claude/เกม/ภาพ/เซฟจริง, ไม่ใช้เครดิต, ไม่ commit ผลดิบหรือ dependency.
