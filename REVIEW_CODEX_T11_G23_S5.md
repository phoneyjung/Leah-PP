# T11 — ตรวจอิสระ G2.3 S5 รูปหน้าใหญ่เปลี่ยนสี

ฐาน `claude/g2-pilot @46e1c4f8922b7bf2f82d8876aa46fa9652353d7c` · 1 พ.ย. 2569 · เครดิต 0

**ผล:** ไฟล์ปกติเปลี่ยนสีถูกตาม D-PT-3 ก; `pt_s5.py` exit 0 และ `test_g2_portrait.py` **5/5 exit 0**. ตรวจหน้าเว็บจริงเพิ่มครบ **640 ชุด**: RGB ผิด 0, สีคงที่เปลี่ยน 0, alpha เปลี่ยน 0. **พบ 4 ข้อ (กลาง 2 / ต่ำ 2)**: เครื่องตรวจสีสัญญาณมี false positive, mask ตัวเล็กหายไม่แจ้ง, mask มี G เสียไม่แจ้ง, และหน้าต่าง DPR 1 ขนาดเล็กตัดภาพ. ไม่แก้ไฟล์ของ Claude; ข้อ 4.8/QG-3 ยังให้เจ้าของดูและตัดสิน

## วิธีตรวจ

อ่าน HANDOFF T11, AGENTS, HANDOFF_TEAM_ROLES v2, README S5, สคริปต์สองไฟล์, page, shademap, ASSET_SPEC_14 4.5–4.8 และ D-PT-3. อ่าน Palette v1.2 จาก `7d5d152` เพื่อเทียบสี/ลำดับแยกจาก constants ของหน้า

- Python 3.12 · Pillow 12.3 / NumPy 2.3.5 / scikit-image 0.26 · system Chromium ผ่าน Playwright
- ชุดหลักใช้ไฟล์จากฐานข้างต้น ไม่แก้ runner ให้ผ่าน
- `pt_s5.py` **เป็น generator ด้วย** (บรรทัด 47 เขียน shademap ลง ROOT): รันในสำเนาชั่วคราว `/tmp/t11-runroot` ไม่ใช่ checkout ส่งงาน. shademap ที่สร้างตรงไฟล์ฐานทุกไบต์; แผ่น 16 ชุดที่สร้างตรงภาพฐานทุกพิกเซล
- server และ outputs อยู่ /tmp; branch ส่งมีรายงานนี้และ CODEX_STATUS เพิ่ม 1 บรรทัดเท่านั้น

```sh
# สำเนาข้อมูลจากฐาน (ไม่ได้แก้ไฟล์ภาพ/Claude ใน checkout)
cd /tmp/t11-runroot
/tmp/t11-venv/bin/python3 -I qa/g2-3-portrait/tools/pt_s5.py . /tmp/t11-out/numeric
# exit 0

# server เปิดที่ root checkout อีก process
python3 -m http.server 8783 --bind 127.0.0.1
/tmp/t11-venv/bin/python3 -I test_g2_portrait.py 8783 /tmp/t11-out/browser
# 5/5, exit 0
```

Playwright ใช้ `PLAYWRIGHT_BROWSERS_PATH=/tmp/t11-browser` กับ symlink ไป `/usr/bin/chromium`. การทดสอบปกติและ probes สำเร็จ; คำสั่ง screenshot เพิ่มเติมรอบท้ายถูกเครื่องมือปฏิเสธสิทธิ์ (`denied`, ไม่ให้เหตุผล) จึง **ไม่ได้** ตรวจเทียบทุกพิกเซลของ screenshot หลัง browser compositor. ผล full-scale ที่รายงานคือการตรวจ canvas/device geometry + screenshot ที่เปิดดูจริง ไม่อ้างว่าผ่านการตรวจเพิ่มเติมที่ไม่ได้รัน

## 1. ตารางเฉดกับ D-PT-3 ก — ผ่าน

`pt_s5.py:35–46` เลือกฐานด้วยค่าเฉลี่ย ΔE00 ถ่วงจำนวนพิกเซล: แต่ละสีต้นฉบับหาเฉดของ option ที่ใกล้ที่สุด แล้วเลือก option ที่คะแนนต่ำสุด. จากนั้นจับ G แต่ละตัวกับ Y = 0.2126R+0.7152G+0.0722B ที่ใกล้ที่สุดในฐานนั้น; เสมอเลือก index ต่ำกว่า. ใช้ index เดียวกับทุก option และคืน hex จาก Palette เท่านั้น. ไม่ interpolate ไม่สร้าง ramp ใหม่

ตรวจซ้ำจาก **สี/จำนวนพิกเซลจริงใน PNG+mask** ด้วยฟังก์ชัน CIEDE2000 อีก implementation (`qa_asset09_a3.de00`, ไม่ใช่ skimage ที่ pt_s5 ใช้) และแยก parse ตาราง Markdown Palette: สี 91 ช่อง + ลำดับ 21 options ตรง; G→index **59/59** ตรง; ลำดับย้อนหลัง 0. D-PT-3 ก ไม่บังคับว่าทุกเฉดต้องมีพิกเซล จึงไม่ควรบังคับกระจายให้ครบโดยเปลี่ยนมติเอง

| วัสดุ | ฐาน / ΔE00 ที่ใช้เลือกฐาน | G ที่ตรวจ | จำนวนพิกเซลเฉดเข้ม→อ่อน | ข้อสังเกต |
|---|---|---:|---|---|
| ผิว | Light / 4.0548 | 17 | 325 / 1604 / **2** / 1536 / 2299 | เฉดกลางแทบไม่ใช้ เป็นผล nearest-Y จริง ไม่ใช่ index หลุด |
| ผม | Red / 11.2221 | 28 | 8664 / 4337 / 2701 / 1808 / 929 | หลายสีเข้มรวมเฉด 0; รายละเอียดมืดลดลงตามทาง ก |
| ม่านตา | Green / 9.6709 | 3 | **0** / 96 / 131 | map=[1,1,2]; สีเข้มสุดในรูปใกล้ Y เฉด 1 มากกว่าเฉด 0 จึงข้ามเฉดเข้มสุดตามสูตร |
| ผ้าคลุม | Wing / 9.2109 | 11 | 3032 / 4476 / **202** / 6075 | เฉดที่ 3 พื้นที่น้อย แต่ยังไม่กลับลำดับ |

ฐานที่ใช้จับเฉด **ไม่ใช่ default หน้าทดลอง**: default ยัง Brown/Green/Medium/Wing ตาม sprite. ค่า `base_mean_dE00` เป็นคะแนน nearest-ΔE ตอนเลือกฐาน ไม่ใช่ fidelity หลัง nearest-Y: fidelity หลัง mapping ผิว/ผม/ตา/บ้าน = **4.06/11.71/9.67/9.23**; p95 = **7.79/23.75/18.21/11.33**. README ควรอ่านตัวเลขทั้งสองอย่างแยกกัน

## 2. 640 ชุด / สีสัญญาณ — ไฟล์จริงผ่าน แต่ QA มีช่องโหว่ R1

### สิ่งที่วัดจริง

ชุด `pt_s5.py:64–70` สร้าง 640 combinations (cache ทำให้เรียก render 1,871 ครั้ง) แล้วเปรียบเทียบ RGBA ก่อน/หลังเปลี่ยนแต่ละ group เป็น option ถัดไป รวม 2,560 comparisons. cross_material/fixed/alpha = **0/0/0**; unchanged เมื่อเปลี่ยน option = 0 สำหรับ palette ปัจจุบัน

ความแยกของ mask และ `out[R==mid]` ทำให้ข้อสีรั่วผ่านโดยโครงสร้างได้ง่าย: ใช้ mask เดียวทั้ง render และ assert จึง **ไม่พิสูจน์ว่า ID ถูกเชิงวัสดุ**; หน้า/ผมต้องพึ่ง T9+ข้อ 3.5/เจ้าของ. Renderer ที่ไม่เปลี่ยนสีเลยก็ไม่มี cross-material leakage; ตัวนับ unchanged เป็นข้อมูล ไม่ได้ assert. ไม่ควรใช้ PASS นี้แทนการยืนยันเปลี่ยนสีถูก

ผมตรวจเพิ่มใน **browser renderer จริง** โดยเลือกทุก option 8×5×4×4 ผ่าน PT.set แล้วอ่าน OFF.pt pixels ทุกชุด เทียบ expected ที่ใช้ PNG/mask/Palette และ map ซึ่งคำนวณยืนยันแยกแล้ว: **640 ชุด, RGB ผิด 0, fixed เปลี่ยน 0, alpha เปลี่ยน 0, errors=[]**. PT.set ใช้สำหรับ exhaustiveness; พฤติกรรม UI แยกลองด้วย tap จริงครบ 21 ปุ่มและ keyboard ด้านล่าง

สีทึบที่อ่านได้จาก output browser รวม **128 สี**; นำไปวัด ΔE00 ด้วยอีก implementation ได้ hits 5 สีเดิมเท่านั้น, unexpected=0. สีใกล้ cyan ทั้งสอง=0. ข้อยกเว้นจับทั้ง group/option/shade และ hex ตาม Palette/สเปก ไม่เหมารวมว่าสีเหลืองอะไรก็ยกเว้น

| ข้อยกเว้น | Hex | ΔE00 ถึง #FFC857 | px เมื่อเลือก option นั้น |
|---|---|---:|---:|
| Blonde shade 4 | #F0CC70 | 5.1045 | 1808 |
| Amber shade 3 | #E6B446 | 5.2869 | 131 |
| Sun shade 2 | #F0B512 | 5.8323 | 4476 |
| Sun shade 3 | #F3C546 | 3.4814 | 202 |
| Sun shade 4 | #F6D579 | 6.2874 | 6075 |

### R1 — กลาง: signal check ตรวจตารางแทนสีที่ renderer วาด จึงผ่านภาพผิดได้

- **ตำแหน่ง:** `qa/g2-3-portrait/tools/pt_s5.py:77–81,116–118`.
- `colour_src` สร้างจาก source สีคงที่ + RAMPS ที่ควรใช้ ไม่อ่านภาพจาก `render()`. วิธีนี้ครอบคลุม palette ได้ แต่ยืนยันภาพผลลัพธ์ได้ต่อเมื่อ renderer ถูกอยู่ก่อน
- **พิสูจน์:** สำเนาสคริปต์ใน /tmp เท่านั้น แทรก `out[R == 4, :3] = [255,200,87]` ก่อน `return out` ของ render แล้วรันทั้งชุด. ผมในภาพ sheet ที่สร้างมี **#FFC857 จริง 18,439 px** ในช่องแรก (ΔE00=0, ไม่ใช่ข้อยกเว้น); แต่ผลยัง `hits=5`, `unexpected=0`, `pass 4.5=true / 4.6=true`, **exit 0**. unchanged พุ่งเป็น 11,800,960 แต่ไม่ทำให้ตก. ไฟล์ renderer/ภาพจริงใน branch ไม่ได้เปลี่ยน
- **ผลกระทบ:** regression ที่วาดผิดสีเฉพาะวัสดุตัวเองหรือไม่เปลี่ยนสีอาจผ่านตัวตรวจ S5 และภาพ 16 ชุดที่ generator ทำ แม้เป็นสีสัญญาณต้องห้าม
- **เสนอ:** เก็บ unique RGB พร้อม material/option provenance จาก **output render จริง** ของ 640 ชุดและตรวจ membership ใน expected ramp แยกต่างหาก; ถ้าตรวจแบบ union ทางคณิตศาสตร์ให้ assert ว่า output ตรง lookup ที่อนุมัติทุก pixel ก่อน. เพิ่ม self-test นี้ให้ exit 1. เทียบ shademap ที่ส่งกับ expected ก่อนเขียนทับ/แยก build กับ check เพื่อไม่ให้ generator ซ่อนไฟล์ผิด

## 3. หน้าทดลอง — ผ่านชุดกำหนด; พบ R2/R3/R4 เพิ่ม

### ขนาดจอและการกด

- ชุดหลัก 7 จอผ่าน: canvas blitBad=0, 21 ปุ่ม ≥44 CSS px, ไม่บัง/ไม่ทับรูปหรือกันเองเมื่อเลื่อน panel ไปปุ่มนั้น. DPR2.625 ที่ 844×390 ให้ k=2,k2=4, ratioW=1.0001944 / ratioH=0.9997559; คลาดจาก 1 ไม่เกิน 0.025% เพราะปัด physical canvas เป็นจำนวนเต็ม
- ลองเพิ่มสี่คู่ที่ชุดหลักไม่ได้ทดสอบ: **740×360@2.625, 844×390@2, 844×390@3, 915×412@2**: blitBad=0 และไม่หลุด stage. เมื่อรวมของเดิม ครบทั้ง 9 คู่ของ 3 ขนาด landscape × DPR2/2.625/3
- จออื่น **320×568@2, 360×740@2, 1280×720@1** ผ่าน geometry/ภาพเต็ม; **800×600@1 และ 390×844@1 ไม่ผ่าน** ตาม R4
- เพิ่ม tap จริงครบ **21/21** ปุ่ม (8ผม/5ตา/4ผิว/4บ้าน): opts ตรง index, aria-pressed=true; focus ปุ่มผมดำแล้ว Enter ได้ hair=0/pressed=true
- resize 844×390→390×844→844×390→740×360 ที่ DPR2.625: blitBad=0 ทุกครั้ง, error=0
- locale th-TH แสดงหัวข้อ/ข้อความ fallback ไทย + อังกฤษจริง; ชุดปกติของ test ใช้ locale browser ค่าเริ่มต้น. อังกฤษมีข้อความใน T.en. ไม่ได้ทดสอบบนโทรศัพท์จริงหรือรับรอง browser ทุกยี่ห้อ

### R2 — กลาง: mask ของตัวเล็กหายเดี่ยว ๆ ไม่แจ้ง ทำให้ภาพเทียบสีไม่ตรงกัน

- **ตำแหน่ง:** `pilot-g2-portrait.html:89` ไม่มี else/warn สำหรับ kidMask; `test_g2_portrait.py:76–77` ทดสอบ block sprite+mask รวมกัน จึงไม่จับกรณีนี้
- **ทำซ้ำ:** block เฉพาะ `**/c2-pilot-kid4-idleanim-mask.png` แล้วแตะปุ่มผม Blue (index5) จริง
- **ผล:** ready=true, opts.hair=5, รูปใหญ่เปลี่ยน **18,439 px**, ตัวเล็กเปลี่ยน **0 px**, warn=[], warnShown=false, errors=[]; เปิด screenshot พบรูปใหญ่ผมฟ้าแต่ตัวเล็กผมน้ำตาลเดิม. ผู้ดูอาจเข้าใจว่าเป็นปัญหางานภาพแทนไฟล์หาย
- **เสนอ:** ตรวจ kidMask แยก (รวม width/height) แล้วแจ้ง TH/EN ว่าตัวเล็กแสดงสีต้นฉบับ เปลี่ยนสีไม่ได้; เพิ่มกรณี mask หายเดี่ยวและ assertion พิกเซลหลัง tap ใน S5-f

### R3 — ต่ำ: mask PNG อ่านได้แต่ G ผิดช่วง ถูกข้ามเงียบ

- **ตำแหน่ง:** `pilot-g2-portrait.html:54,87–88`; validMap ตรวจตาราง แต่ไม่มี validation ช่องข้อมูล mask
- **ทำซ้ำ:** สร้าง response PNG ในหน่วยความจำจาก mask เดิม ขนาด/alpha เดิม ตั้ง G=255 เฉพาะ ID4 แล้ว route แทนไฟล์ก่อน boot; ไม่เขียนทับไฟล์จริง
- **ผล:** จุด G เสีย 18,439; แตะ Blue แล้ว opts.hair=5 แต่ portrait เปลี่ยน **0 px**, warn=[], errors=[]. `k===undefined` ข้ามทุกจุด ทำให้การเปลี่ยนสีดูเหมือนทำงานแต่ไม่มีผล
- **เสนอ:** validate R/G/B/alpha และจำนวน shade ก่อนใช้ mask (อย่างน้อย index bounds ของ IDs ที่เปลี่ยนสี); เสียให้ fallback ทั้งภาพพร้อมคำเตือน แทนปล่อย recolour บางส่วนเงียบ. เพิ่ม test valid-PNG-but-invalid-mask; ไฟล์ฐานปัจจุบันถูกต้อง ไม่ได้พบ G เสียในไฟล์จริง

### R4 — ต่ำ: หน้าต่างเล็ก DPR1 ตัดตัวเล็ก เพราะบังคับ k/k2≥1 และ overflow hidden

- **ตำแหน่ง:** `pilot-g2-portrait.html:5–6,66–70`.
- **ทำซ้ำ:** เปิด/resize viewport **800×600 DPR1**. stage=464×600, kid x=400,width=96 จึงเกินขวา **32 device px**; blitBad=285 และ screenshot เห็นตัวเล็กขาดด้านขวา
- ที่ **390×844 DPR1** stage=390×490: portrait box เกินขวา2, kid box เกิน106 และตัวเล็กอยู่นอก stage ทั้งตัว; blitBad=2920
- **ขอบเขต:** อยู่นอก DPR2/2.625/3 ของ acceptance matrix §4.7 จึงไม่กล่าวว่าชุด matrix ที่ผ่านนั้นตก แต่เป็นปัญหาหน้าต่าง PC/การทดสอบจออื่นตาม T11
- **เสนอ:** เมื่อความกว้าง physical ไม่พอ minimum 384+96+gaps ให้แยกแนวตั้ง/สลับดู/scroll stage โดยรักษา pixel scale จำนวนเต็ม; ไม่แก้ด้วยย่อแบบเศษส่วน. เพิ่ม viewport DPR1 แคบใน regression

### Fallback อื่นที่ลองเพิ่ม

`pt-mask.json` หายและ shademap JSON syntax เสีย → noMap แสดงไทย/อังกฤษ; portrait คงเดิม0pxเปลี่ยน ตัวเล็กเปลี่ยน855pxเมื่อแตะ Blue; mask PNG decode ไม่ได้ → noMask; pageerror/internal errors=0 ทั้งหมด. ผลนี้แยกจาก R3 ซึ่ง PNG decode ได้แต่ข้อมูล mask ไม่ถูก

## 4. ข้อสังเกตภาพทั้ง 16 ชุด — ไม่ให้คะแนนแทนเจ้าของ

เปิดภาพฐาน `qa/g2-3-portrait/s5/img/pt-16-sets.png` และ crop ดูที่ขนาดพิกเซลเดิมครบ16ช่อง (ไฟล์ภาพฐานไม่แก้). รูปใหญ่และ sprite ใช้ palette เดียวกัน แต่การกระจายเฉดต่างกันตาม mask/รายละเอียดคนละภาพ; ไม่ถือว่าสีรั่วเพราะหน้าดูสว่างต่างกันอย่างเดียว

| ชุด | ข้อสังเกต |
|---:|---|
| 1 Brown/Green/Medium/Wing | ไม่เห็นสีรั่วใหม่; ผิวช่วงแก้ม/หน้าผากเป็นพื้นที่ค่อนข้างเรียบ สอดคล้องเฉดกลางแทบไม่ใช้ |
| 2 Black/Brown/Light/Sun | หน้ากับผมแยกชัด; รายละเอียดเงามืดผมส่วนล่างรวมเป็นก้อนมากกว่าต้นฉบับ |
| 3 Blonde/Blue/Deep/Sun | แก้มชมพูเป็นสี่เหลี่ยมเด่นบน Deep; ผมทองกับ Sun ใกล้กันแต่มีเส้นคั่น; ให้เจ้าของดูความเข้มแก้มเป็นพิเศษ |
| 4 Red/Amber/Tan/Leaf | สีตาอำพันเล็กแต่แยกออก; แก้ม/ปากเด่นกว่า Light ไม่พบการลากสี Leaf เข้าหน้า |
| 5 Pink/Black/Medium/Flame | ตาดำใกล้เส้นตาตามตั้งใจ; ยังมีตาขาวและประกาย; ผมชมพูไม่ไหลเข้าแก้ม |
| 6 Blue/Green/Light/Leaf | หูสองข้างยังเป็นสีผิว ไม่ใช่สีน้ำเงิน/เขียว; จุดสว่างขอบผมเดิมยังเห็น |
| 7 Silver/Amber/Deep/Wing | แก้มและปากคงที่เด่นบนผิวเข้ม; ผมเงินเห็นขอบ highlight เป็นบล็อกชัด ไม่ใช่รูหรือ alpha ใหม่ |
| 8 Green/Blue/Tan/Flame | แก้มอ่านเป็นปื้นสองข้าง; ผม/ผ้าคลุมยังแยกจากใบหน้าด้วยเส้นขอบ |
| 9 Black/Amber/Deep/Leaf | ผมดำส่วนเงากลืนกับเส้นเข้มที่สุด; แก้มสว่างเทียบผิว Deep เห็นชัด ให้เจ้าของดูพร้อมชุด3/7/12 |
| 10 Blonde/Brown/Light/Flame | ใบหน้าสว่างและเรียบ แต่ตา/ยิ้มยังอ่านได้; ทองแดงไม่เปลี่ยนตาม Flame |
| 11 Brown/Amber/Tan/Sun | ตา Amber กับผ้า Sun มีสีใกล้สัญญาณตามข้อยกเว้นเดิม; ไม่เห็นสีบ้านเข้าหูหรือผิว |
| 12 Red/Green/Deep/Flame | แก้มและเส้นปากยังสีเดิมจึงเด่นเมื่อเทียบ Deep; ผม/ผ้าคลุมโทนแดงใกล้กันแต่ขอบคั่นอยู่ |
| 13 Pink/Blue/Light/Wing | ผิว Light บนหน้าใหญ่เป็นแผ่นเรียบกว่าตัวเล็ก; คิ้วตามผม แต่ขนตายังเข้มคงที่ |
| 14 Blue/Brown/Medium/Sun | หูคงกลุ่มผิว; ผมฟ้า/ผ้าเหลืองไม่เห็นรั่วข้ามกัน; จุดสว่างขอบผม/ผ้าคลุมเดิมยังอยู่ |
| 15 Silver/Black/Tan/Leaf | หู/คอเป็นผิว Tan; ตาดำติดเส้นตาเป็นธรรมชาติของ ramp, ไม่ใช่การย้อมขอบตา |
| 16 Green/Black/Medium/Wing | วัสดุหลักแยกได้; เงาผมช่วงมืดรวมตามทาง ก เช่นเดียวกับชุดสีอื่น |

**ประเด็นรวมสำหรับเจ้าของ:** ชุด Deep 3/7/9/12 มีแก้ม/ปากคงที่เด่นมากกว่าชุด Light 2/6/10/13; ผิวหน้าแบนลงบางส่วนเพราะเฉดกลางใช้2px และตาใช้2ใน3เฉด. ไม่พบหลักฐานว่ารั่วตาม mask ใน16ชุด; หูที่สว่างยัง recolour เป็นผิวได้. คง V1 หัวเข็มขัด ID9 ตามมติล่าสุด; ไม่ขอแก้ปาก/แก้ม/เพิ่มเฉดเอง. จุดสว่างขอบเดิมของ T9 ไม่ถือเป็นบั๊กใหม่ของ S5

## 5. สรุปบั๊กใหม่และข้อเสนอ

R1 กลาง = false positive ของ signal QA; R2 กลาง = kid mask หายไม่แจ้ง; R3 ต่ำ = mask G เสียข้ามเงียบ; R4 ต่ำ = clip ที่ DPR1 แคบ. รวม **4 ข้อ (กลาง2 ต่ำ2)**. รายงานนี้ไม่เปลี่ยนสเปกหรือเกณฑ์ และไม่ให้คะแนนงานศิลป์; ให้ Claude แก้/ตอบตามบทบาท ก่อนเจ้าของตัดสิน QG-3

## หลักฐานรัน

### ชุดหลัก numeric — exit 0

```text
{"base": {"skin": "Light", "hair": "Red", "iris": "Green", "house": "Wing"}, "leak": {"combos": 640, "renders": 1871, "cross_material_px": 0, "fixed_changed_px": 0, "alpha_changed_px": 0, "unchanged_when_option_changes_px": 0}, "hits": 5, "unexpected": 0, "exception_px": {"hair Blonde shade 4 #F0CC70": 1808, "iris Amber shade 3 #E6B446": 131, "house Sun shade 2 #F0B512": 4476, "house Sun shade 3 #F3C546": 202, "house Sun shade 4 #F6D579": 6075}, "fidelity": {"skin": {"mean_dE00": 4.06, "p95_dE00": 7.79}, "hair": {"mean_dE00": 11.71, "p95_dE00": 23.75}, "iris": {"mean_dE00": 9.67, "p95_dE00": 18.21}, "house": {"mean_dE00": 9.23, "p95_dE00": 11.33}}, "pass": {"4.5 cross-material px = 0, fixed px changed = 0, alpha changed = 0 over 640 combos": true, "4.6 signal hits outside the 5 locked exceptions = 0": true}}
```

### ชุดหลัก browser — 5/5 exit 0

```text
PASS S5-4.7 screens 740x360 / 844x390 / 915x412 at DPR 2 / 2.625 / 3 (+ iPad, upright phone): one canvas = stage in device px (CSS x DPR / canvas = 1 +- 0.002), portrait 384 x whole k and kid 96 x whole k2 at whole offsets, every art device px = its art px (0 wrong), 21 colour buttons >= 44 CSS px, none covered (after scrolling the panel), none over the art, none overlapping | {"740x360@2": {"k": 1, "k2": 2, "ok": true, "ratio": [1, 1], "blitBad": 0, "small": [], "covered": [], "overlapArt": [], "overlapBtn": 0, "panelHitsArt": false}, "844x390@2.625": {"k": 2, "k2": 4, "ok": true, "ratio": [1.00019, 0.99976], "blitBad": 0, "small": [], "covered": [], "overlapArt": [], "o
PASS S5-r page colours = Python renderer (shade map D-PT-3) for all 16 sets: portrait px different 0 · in-game kid px different 0 | {"Brown/Green/Medium/Wing": [0, 0], "Black/Brown/Light/Sun": [0, 0], "Blonde/Blue/Deep/Sun": [0, 0], "Red/Amber/Tan/Leaf": [0, 0], "Pink/Black/Medium/Flame": [0, 0], "Blue/Green/Light/Leaf": [0, 0], "Silver/Amber/Deep/Wing": [0, 0], "Green/Blue/Tan/Flame": [0, 0], "Black/Amber/Deep/Leaf": [0, 0], "B
PASS S5-t tap the Blonde hair button: hair option 2, button pressed, portrait = Python render of the new set | {"state": [2, "true"]}
PASS S5-f missing / broken files (portrait · mask · shade map · kid · every file · half-written shade map): a frame or the portrait as drawn is shown, a TH+EN note, 21 buttons, no error | {"portrait png": {"warn": ["noPt"], "warnShown": true, "drawnPx": 110656, "errors": [], "buttons": 21}, "mask png": {"warn": ["noMask"], "warnShown": true, "drawnPx": 70133, "errors": [], "buttons": 21}, "shade map": {"warn": ["noMap"], "warnShown": true, "drawnPx": 70133, "errors": [], "buttons": 2
PASS S5-e JS errors 0 across every load (page errors + console errors; blocked-file loads count page errors only) | []
5/5
```

### Fault injection ยืนยัน R1 — exit 0 ทั้งที่มีสีต้องห้าม

```text
{"base": {"skin": "Light", "hair": "Red", "iris": "Green", "house": "Wing"}, "leak": {"combos": 640, "renders": 1871, "cross_material_px": 0, "fixed_changed_px": 0, "alpha_changed_px": 0, "unchanged_when_option_changes_px": 11800960}, "hits": 5, "unexpected": 0, "exception_px": {"hair Blonde shade 4 #F0CC70": 1808, "iris Amber shade 3 #E6B446": 131, "house Sun shade 2 #F0B512": 4476, "house Sun shade 3 #F3C546": 202, "house Sun shade 4 #F6D579": 6075}, "fidelity": {"skin": {"mean_dE00": 4.06, "p95_dE00": 7.79}, "hair": {"mean_dE00": 61.7, "p95_dE00": 84.23}, "iris": {"mean_dE00": 9.67, "p95_dE00": 18.21}, "house": {"mean_dE00": 9.23, "p95_dE00": 11.33}}, "pass": {"4.5 cross-material px = 0, fixed px changed = 0, alpha changed = 0 over 640 combos": true, "4.6 signal hits outside the 5 locked exceptions = 0": true}}
```

Browser exhaustive 640 ชุด (actual colours นำไปวัดแยก):

```json
{
  "combos": 640,
  "wrong_rgb_px": 0,
  "fixed_changed_px": 0,
  "alpha_changed_px": 0,
  "errors": []
}
```

SHA-256 หลักฐาน local (ไม่ได้ commit logs/ภาพทดสอบ):

- `numeric/s5.json`: `ec879deb6d780acf7912509a3b11151cea2ec0e1009e68af86b2ffd8cb0a7fcb`
- `browser/results.json`: `e1233e4024ff5c081db3c056a666e0a83c18b64aad5fad037c1a947d17c27cb4`
- `probe/results.json`: `5296f8e2021ef0b7393d1916ad1b54b3419c0d3053afe7b9877f273277219d41`
- `independent.json`: `05a65a99331c6c20f0a6d2f22586e63e2c88d6de584471d0bc2c61d784288f69`
- `actual-signal.json`: `eb1f8e12a13f85d5dc66d572943104b613899a1859dff72865293bf6a96dde35`
- `mutation/s5.json`: `2d194cac131042f355fcd5837a247dd454821d7f1bcc46324b54785111b777e2`

ต่างจากงานที่สั่ง: ไม่มีการแก้ไฟล์ Claude/ภาพ/เกม; รัน numeric ในสำเนาเพื่อหลีกเลี่ยงการเขียนทับ shademap. การตรวจ screenshot เพิ่มเติมที่เครื่องมือปฏิเสธไม่ได้ถูกนับว่าผ่าน
