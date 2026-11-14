# T48 — ตรวจหน้าวัดมือถือฉบับ 3

ฉบับ 1.0 · สรุป 14 พฤศจิกายน 2569 (ผลรัน 13 พ.ย.) · เครดิต 0 · ฐานรายงาน `claude/g2-pilot @ bdfcf6b` · โค้ดตรวจ `claude/g4-char2 @ c8d23f1` (bench v3 `eca2ff7`, เกม 2.43 `35b0ac4`) · ส่ง `codex/t48-review-bench3`

**กรณีเดิม T47-N1/N2/N4 ตรวจจับได้ 3/3 แต่ยังไม่รับรองให้เจ้าของวัดเพื่อปิด M6.** FULL selftest ได้ 20/21 exit 1 (ไม่ใช่ 21/21); พบช่องผ่านผิดใหม่ระดับกลาง 1 ข้อ: เนื้อไฟล์ที่ใช้วาดผิด แต่ server ส่งไฟล์ถูกต้องให้คำขอแฮชภายหลังแล้วหน้าวัดให้ pass.

## 1. ฐาน เครื่อง และการสร้างสำเนา

อ่าน HANDOFF งานบนสุด, `G4_6_REPORT.md` ฉบับ 1.2 ข้อ 2.6, หัวและ implementation ของ bench v3, builder, selftest และรายงาน T47 ข้อ 5. ช่วงเริ่ม environment unavailable ทำให้ `pwd` รันไม่ได้; เมื่อเครื่องพร้อมจึง fetch/archive และขอสิทธิ์รัน Chromium นอก sandbox สำเร็จ. ไม่มีการใช้ข้อมูลเก่ามาอ้างว่าได้รันในเครื่องใหม่

- Git archive ของ `c8d23f1` → `/tmp/t48/v3`; dependency Puppeteer 25.8.0 → `/tmp/t48/pp`; Chromium 151.0.7922.173, Node 24.19.0. ผลทั้งหมดอยู่ `/tmp/t48/out`
- build: **313 ไฟล์**, รวม **26,892,217 B**, parts **250+63**, page **1,623,430 B**. ตัด firebase-config.js / tk-test.js / tk-pack.bin ตามสเปก
- ตรวจเอง: metadata **313/313** ตรงขนาดและ SHA-256 ของ source ทุกไฟล์; page ต่างจาก index เฉพาะ 4 กลุ่มที่ระบุ ตรงทุกตัวอักษร; diff `index.html` / `sw.js` / `char2.js` จาก v2 เป็น 0
- ไม่มีไฟล์/รูป/โค้ดเกมของ Claude ถูกแก้; mutation เป็น page สำเนานอก repo. ไม่เผยแพร่หน้าวัด ไม่ต่อเซฟจริง แต่ละกรณีใช้ browser context ใหม่และ localhost origin แยก
- รัน browser tests ต่อกัน ไม่รัน benchmark ซ้อนกัน. มือถือจำลอง 844×390 DPR3 ไม่ใช่เครื่องเจ้าของ; ยังไม่ได้ตรวจ artifact host ส่วนตัว

## 2. FULL selftest ผลจริง

```sh
# cwd /tmp/t48/v3; รันนอก sandbox หลังอนุญาต
FULL=1 NODE_PATH=/tmp/t48/pp/node_modules CHROME_EXE=/usr/bin/chromium \
  node qa/g4/phone_bench_selftest.js /tmp/t48/bench3 /tmp/t48/out/selftest.json
```

**20/21 exit 1**, retried=['lite×3']. ไม่แก้ตัวตรวจ ไม่ตัดผลตก ไม่แทนผลรันของ Codex ด้วยตัวเลขของ Claude

| กรณี | selftest | ครั้งที่ใช้ | verdictIfCounted | reasons |
|---|---|---:|---|---|
| ok | ผ่าน | 1 | pass | mode |
| desktop | ผ่าน | 1 | void | mode,device |
| nofile | ผ่าน | 1 | void | mode,files |
| unlisted | ผ่าน | 1 | void | mode,files |
| build | ผ่าน | 1 | void | mode,build |
| c2fail | ผ่าน | 1 | void | mode,files |
| stall | ผ่าน | 1 | void | mode,interrupted,unstable |
| hidden | ผ่าน | 1 | void | mode,interrupted |
| slowoff | ผ่าน | 1 | void | mode,unstable |
| slowon | ผ่าน | 1 | fail | mode |
| lowfps | ผ่าน | 1 | void | mode,interrupted |
| nolantern | ผ่าน | 1 | fail | mode |
| nohold | ผ่าน | 1 | fail | mode |
| nooldbody | ผ่าน | 1 | fail | mode |
| nooldbody_late | ผ่าน | 1 | fail | mode |
| noshadow | ผ่าน | 1 | fail | mode |
| lite | ตก | 3 | void | mode,unstable |
| fewdraws | ผ่าน | 1 | fail | mode |
| wrongimage | ผ่าน | 1 | void | mode,files |
| wrongsame | ผ่าน | 1 | void | mode,files |
| full | ผ่าน | 1 | pass | ไม่มี |

`lite` ตกครบ 3 ครั้งเพราะผลจริงมี unstable (ครั้ง 2 มี interrupted เพิ่ม) ซึ่งทำให้ verdictIfCounted=void แต่ selftest คาด fail และไม่มี reasons อื่น. `more=true` ครบทุกครั้ง: ด่านโหมดกราฟิกจับฟาร์มได้จริง. รอบที่ 3 เมือง ratio=1.124 เกิน 1.10, ฟาร์ม why=`เกมเปลี่ยนโหมดกราฟิกเอง`; ไม่ใช่ทางผ่านผิดของหน้า แต่เป็นรอบที่เครื่องตรวจไม่ได้ผลตามที่ตรึงไว้. ยังไม่ยืนยันเกณฑ์ FULL 21/21; ไม่สรุปว่าเป็น regression ของเกมจากความแกว่งนี้

รอบ full ปกติผ่านครั้งแรก: reasons=[], ไฟล์ asked=198/hashed=198 ผิด/ขาด 0. ฉากเมือง/ฟาร์ม/ถ้ำ ratio=1.013/1.018/1.000. รายละเอียดทั้งรอบและ stdout ของการลองซ้ำเก็บใน /tmp ไม่ commit

## 3. Independent probes แบบรอบเต็ม

ใช้ harness ใหม่ `/tmp/t48/probe.cjs`, เวลาวัดเดิม 1.5s settle +5s ×18 รอบ, ไม่ใส่ `__benchTest` หรือ `?short`. Control → no-lantern → no-old-body → wrong-image รันครั้งเดียวต่อกรณี. ไม่แก้ค่าตัดสิน/counters ของ benchmark. อนุญาต data/blob/local requests; บล็อกเฉพาะ origin ภายนอก (พบ fonts.googleapis.com) เพื่อแยกงานจากระบบจริง. ทุกคำขอไฟล์ให้ browser โหลดตามปกติ เซิร์ฟเวอร์เป็นฝ่ายสลับ payload ในกรณี fault

| กรณี | verdict | reasons | ratio เมือง/ฟาร์ม/ถ้ำ | เหตุที่ตรวจพบ | hashed/asked / wrong |
|---|---|---|---|---|---|
| control | pass | ไม่มี | 0.994 / 1.029 / 1.017 | — | 198/198 / wrong 0 |
| no-lantern | fail | ไม่มี | 1.002 / 1.000 / 1.000 | ตะเกียงไม่ถูกวาด | 198/198 / wrong 0 |
| no-old-body | fail | ไม่มี | 0.997 / 0.967 / 1.000 | ตัวเดิมไม่ถูกวาด; ตัวเดิมไม่ถูกวาด; ตัวเดิมไม่ถูกวาด | 198/198 / wrong 0 |
| wrong-image | void | files | 0.995 / 1.002 / 1.010 | — | 198/198 / wrong 1 |
| swapback | pass | ไม่มี | 1.000 / 1.000 / 0.956 | — | 198/198 / wrong 0 |

- N1: `c234Hold=()=>false` ก่อนเริ่ม; wrapper ของ Codex อ่านค่า `c234DC()` จริงแยกจาก predicate ของ bench. ฉากมืดไม่มี held ที่ส่งให้ตัววาด → ถูกจับ
- N2: ห่อ `drawPlayer` ให้ return เฉพาะเมื่อ `!c234Use()` ก่อนเริ่ม; update/การเดิน/rAF ทำงานต่อ. v3 นับ old sheet blit =0 → ถูกจับ
- N4 เดิม: server ตอบ HTTP 200 เป็น PNG โปร่งใส 1×1 ขนาด 68 B แทน map-cave-mouth.jpg ทุกคำขอ. v3 ตรวจ wrong file → ไม่นับ
- control และ fault ทั้งสามไม่มี page error. หลักฐาน EV/runs ครบ 18 รอบและ image ขนาด/alpha เก็บแยกใน JSON ของแต่ละกรณี

**กรณีเดิมของ T47 ถูกจับครบสามแบบ**. การแก้ N4 ให้ผลถูกต้องเมื่อไฟล์ผิดคงเดิมทุกคำขอ แต่ไม่ได้พิสูจน์ว่าไฟล์ที่อ่านกลับมาตรวจคือไฟล์เดียวกับที่ใช้วาด ดูข้อ 6

## 4. ถอดด่านใหม่ 3 ตัว

สำเนา page 3 ชุด, ใช้ selftest ของ Claude เดิมทุกไบต์:

- lamp: เปลี่ยน `&& lamp(r)` ใน ok เป็น `&& true`; CASES=nolantern
- old: เปลี่ยนเงื่อนไข `r.ev.oldD >= 0.8 * r.frames` เป็น true; CASES=nooldbody
- sha: ถอดเฉพาะการเทียบ digest (`hex(await crypto.subtle.digest(...)) !== m[1]`) คง size check; CASES=wrongsame

| ด่านที่ถอด | case | exit | ok/cases | ลอง | checks ที่ตก (รอบสุดท้าย) |
|---|---|---:|---|---:|---|
| lamp | nolantern | 1 | 0/1 | 3 | verdictIfCounted, more |
| old | nooldbody | 1 | 0/1 | 3 | verdictIfCounted, more |
| sha | wrongsame | 1 | 0/1 | 3 | reasons, verdictIfCounted, more |

ตัวตรวจต้องตกและผลตรงตามนั้น; การลองซ้ำเป็น loop ของ selftest เดิม เก็บทุกครั้ง ไม่ใช้การเปลี่ยนเกณฑ์เพื่อให้ผ่าน

## 5. ตัวห่อทำให้ผลเอียงหรือไม่

**ติดตั้งทั้งสองฝั่งเหมือนกัน แต่ต้นทุนไม่เท่ากันโดยนิยาม.** `hook()` ใช้ instance ของ ctx หลักทั้ง on/off; ส่ง arguments ต่อไป prototype.drawImage และเรียก drawPlayer เดิม ไม่พบ instance override เดิมในเกมรุ่นที่ตรวจให้ถูกแทน. รูปแบบการวาดหลักจึงคงเดิมบน source นี้ แต่เส้นทางใหม่เพิ่มการอ่าน feet/dc/L และ counters หลายตัว ขณะที่จำนวน drawImage ของฉาก on/off ก็ไม่เท่ากัน. ความเท่ากันของ wrapper อย่างเดียวไม่พิสูจน์ว่าต้นทุนหักล้างกันหมด

ทำ timing เพิ่ม **หลัง** control เต็มจบแล้ว (ไม่ปนกับผลรับ): direct drawPlayer จริง bare vs hooked ที่ state/arguments เดียวกัน, 2,000 calls/batch ×7 คู่ สลับลำดับ และ warm-up ก่อน, 3 ฉาก×2 ธง. ตารางเป็น median ของส่วนต่าง hooked−bare หน่วย µs/call:

| ฉาก | off | on |
|---|---:|---:|
| capital | -27.75 | 52.55 |
| farm | -25.45 | 48.55 |
| cavemouth | -25.30 | -1.15 |

ค่ารายคู่แกว่งและมีทั้งบวก/ลบ (รวมช่วง −52.7 ถึง +59.2 µs/call) จึง **ไม่ใช้เป็น causal estimate ของ overhead จริงบนมือถือ**: เป็น loop สังเคราะห์ที่มี canvas batching/JIT/การคิวงาน ไม่ใช่ render loop จริงทั้งฉาก/GPU. ไม่ควรอ่านค่าลบว่า wrapper ทำให้เร็วขึ้น. ผลนี้ไม่พบหลักฐานที่เชื่อถือได้ว่าตัวห่อเอียงจนข้ามเกณฑ์ 90% บนเครื่องนี้ แต่ยืนยัน “ไม่มี bias” ไม่ได้; ผลควบคุมเต็มข้างบนเป็นผลที่น่าใช้กว่า และยังต้องวัดบนมือถือจริงหลังปิดช่องผ่านผิด. การเปรียบเทียบ JS เฉลี่ย v2/v3 คนละรอบของ Claude เป็นข้อมูลประกอบ ไม่ได้พิสูจน์ overhead เป็น 0

## 6. ช่องผ่านผิดใหม่

### T48-N1 · กลาง · แฮชคำขอที่สองไม่ยืนยัน bytes ที่เกมใช้วาด

`phone_bench.js` L119–120 ตรวจ **ขนาด** ของ response ที่ใช้จริง; L135–136 `fetch(..., {cache:'force-cache'})` แล้วแฮช **body ที่อ่านกลับมาอีกคำขอ**. ถ้า response เดิม no-store หรือไม่มี cache entry การอ่านครั้งนี้ไป network ใหม่ได้ จึงไม่รับรองว่าเป็น body เดิม

probe `swapback` ใช้ server เดียวกับ control:

1. คำขอแรกของ `map-cave-mouth.jpg`: HTTP 200 + Cache-Control:no-store, PNG โปร่งใส 1×1 เติม trailing bytes จนมี **462,551 B เท่าต้นฉบับ** (ไม่ได้แก้ manifest/metadata/ตัวตัดสิน)
2. คำขอที่สองสำหรับ verify: ให้ JPEG ต้นฉบับที่ถูกต้อง. request #1 SHA `0135866dc72bd3d0aec453bd51a15c756787e4007a27ec877c7485ce45804c35` ต่างจาก request #2 `2ee092ea0fdab0fc546acb38d5fab726eb8873122fe3d1036c40734b2410adf6`
3. ภาพในเกมตอนจบยังเป็น **1×1, opaque=0**. browser resource entries และ server บันทึกคำขอแยก 2 ครั้ง ขนาดเท่ากัน; hash ที่ verifier อ่านคือไฟล์ถูกต้องครั้งหลัง
4. หน้าให้ **pass**, reasons=[], hashed=198, wrong=[] / missing=[] / failed=[] และทั้งสามฉาก ✓. จึงอนุมัติผลฉากที่พื้นหลังไม่ได้เป็นไฟล์ที่อ้างอยู่จริง

**ข้อจำกัดของ probe ใหม่:** รอบ swapback ที่ให้ pass ใช้ request interception เพื่อบล็อก origin ภายนอก โดยอนุญาต data/blob/localhost และ server ตั้ง Cache-Control:no-store. Interception อาจกระทบพฤติกรรม cache; รอบทวนที่เตรียมให้ไม่ใช้ interception ถูกยกเลิกขณะรอสิทธิ์นอก sandbox จึง **ยังไม่ได้รัน** (ไม่มี swapback-native.log). ผลที่รายงานเป็น false pass ที่เกิดจริงภายใต้เงื่อนไข harness นี้ ไม่อ้างว่าได้พิสูจน์บนโฮสต์เจ้าของหรือในรอบไม่ intercept แล้ว. ควรให้ Claude ทวน negative control นี้แบบไม่ intercept ก่อนสรุปขอบเขต cache บนโฮสต์จริง

แนวแก้: ให้ขั้นตอน hash ยืนยัน body เดียวกับที่ loader ใช้วาด (ตรวจแล้วจึงส่ง bytes ที่ตรวจผ่านให้ image/loader) หรือมีกลไก cache/immutable resource ที่พิสูจน์การผูกนี้ได้ และ fail closed เมื่อพิสูจน์ไม่ได้. เพิ่ม negative control first-body-wrong-same-length → later-body-correct; ตรวจไฟล์ซ้ำที่ URL อย่างเดียวไม่พอ. ไม่ต้องแก้โค้ดเกมจริงเพื่อเก็บ negative control นี้

## 7. คำตอบส่งต่อ

1. T47-N1/N2 ปิดได้จาก full probes; กรณีเดิมทั้งสามจับได้ **3/3**. แต่ **N4 ยังไม่ปิดทั้งข้อ** เมื่อไฟล์เปลี่ยนระหว่างคำขอ ตาม T48-N1 ในข้อ 6
2. **ยังไม่ให้เจ้าของวัดเพื่อปิด M6**: เกณฑ์ FULL 21/21 ยังไม่ครบ และมีช่องผ่านผิด T48-N1 ระดับกลาง. ไม่ใช้ผลมือถือเก่าที่ถูกถอน และไม่เสนอรับ G4 จากงานนี้
3. ใหม่: สูง **0** / กลาง **1** / ต่ำ **0**. กรณี lite เป็นผลตรวจไม่ครบจากความแกว่ง/expectation ไม่ตรง ไม่ตั้งเป็นบั๊กหน้าวัดใหม่; ประเด็น wrapper มีข้อจำกัดการวัดที่เปิดเผยในข้อ 5

ส่งเฉพาะ `REVIEW_CODEX_T48_BENCH3.md` และ CODEX_STATUS 1 บรรทัด. ไม่ commit ผลดิบ/สำเนาฝังผิด/dependency ไม่เปิด PR ไม่ merge ไม่ push main ไม่ใช้เครดิต
