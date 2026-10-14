# LANTERN ACADEMY — VISUAL BIBLE G1 v1.1
**วันที่จัดทำ:** 14 ต.ค. 2026
**สถานะ:** G1 PREPARATION / เอกสารและ Prompt Spec เท่านั้น / ไม่มีภาพใหม่ ไม่มีโค้ดเกมใหม่ / ห้าม Generate ก่อนแจ้งราคาและเจ้าของอนุมัติ
**ใช้คู่กับ:** `GAME_REBOOT_MASTER_PLAN_2026-10-13.md` (PR #6), `DESIGN_CHARACTER_SYSTEM_SPEC_V2.md` (PR #5), `ART_DIRECTION.md`, `ART_GUIDE.md`, `SCENE_GUIDE.md`, `CLAUDE.md`, `AGENTS.md`.

## 0. จุดมุ่งหมาย G1 และเงื่อนไขห้ามข้าม

G1 คือการพิสูจน์ว่า **หน้าตาตัวละครใหม่มีรายละเอียดชวนรัก อ่านชัดแม้ย่อบนมือถือ เข้ากับโลกโคมไฟ/แสง/ความมืด และขยายเป็นงานภาพของทั้งเกมได้** ก่อนผลิต Sprite Sheet แอนิเมชันทั้งหมด. ไม่ใช่การเขียนระบบตัวละครใหม่ในขั้นนี้

**Owner approval ที่มีแล้ว:** ตัวละครเด็ก Canvas 96×96 (รูปร่างสูง 80–88), feet [48,94], logic tile T=32, Portrait 384×384 แยก, 128×128 ทำเป็นภาพนิ่ง **เพียง 1 ภาพ** สำหรับเทียบ, Adult (ภายหลัง) Canvas 128 สูงประมาณ 108–112, ฉาก/ประตูใหม่ปรับด้านภาพแต่คง logic T32, G0 2.33 ผ่านภายหลังรัน flaky tests ซ้ำ. อนุญาต **เตรียม** G1 ภายใต้งบประมาณ ~65 PixelLab credits แต่ **ทุก Generate ต้องแจ้งราคาจริงและรออนุมัติก่อนกด**.

**ห้าม:** สร้างภาพเองโดยไม่อนุมัติราคาจริง, แก้โค้ดเกม `index.html`/`sw.js`/`test_*.js`, เปลี่ยน Firebase/save/T32/Camera, push หรือ merge `main`, ลบภาพเก่า, ย้าย engine ไป Phaser, อ้างว่าทดสอบมือถือจริงทั้งที่ตรวจแค่ Chromium simulator.

## 1. Art Identity — “Lantern Fantasy / Light and Darkness”

**เอกลักษณ์:** เด็กนักเรียนผู้พิทักษ์โคมไฟแห่ง Lantern Academy, ปลูกแสงแห่งความรู้ ปลุกคริสตัล ฟื้นเมืองจากความหม่น เหมาะกับเด็กและครอบครัว ไม่สยอง ไม่เน้นรุนแรงสำหรับเด็กอายุต่ำกว่า 10 ปี

**อารมณ์:** น่ารักแต่ไม่เหมือนของเล่นเด็กเล็ก; สัดส่วน chibi กลมมน; สีเข้ม/สว่างอย่างมีน้ำหนัก ไม่ใช้ flat pastel ผืนเดียว; ผิว/เส้นผม/งานโลหะ/ผ้ามีรายละเอียดเป็นกลุ่ม pixel จริง

**สไตล์ภาพ:** Cute Modern Pixel Art 2.5D, low-top-down / 3/4 มุมคงที่, เส้นขอบพลัมแยกฉากและตัวละคร, เงาหลักมาจากบนซ้าย, เงาของพื้น/ตัวละครแบบ Trickster engine วาดเอง ไม่ติดใน PNG. Pixel cluster คม ไม่เบลอ; การเรืองแสงเวทเป็น FX แยกชั้นภาพ

**Visual Pillars**
1. “Face first”: ดวงตา ปาก แก้ม คิ้วและปอยผมมีบุคลิก โดยไม่แน่นจนตัวเล็กเละ
2. “One world”: วัสดุและแนวเงาเดียวกันทั้งตัวละคร อาคาร มอน อาวุธ
3. “Light has meaning”: สัญญาณสีต้องสื่อได้ว่าจะกดอะไร/เกี่ยวกับคริสตัล/มีเบาะแส
4. “Modular & mobile”: แยกชิ้นงานและ color regions ชัด มีหน้าจอ Portrait ขยาย; ยืนรวม 4 ตัวแล้วเด็กรู้ทันทีว่าตัวเองคือใคร
5. “Performance measured”: ใช้ภาพเป็นช่วงโหลดเมื่อใช้และทดสอบที่ซูม 75% / 100%; ไม่บีบของทั้งหมดเป็น PWA initial download

## 2. Common Visual Contract

- Camera direction: `S SE E NE N NW W SW` ตามเกมปัจจุบัน. G1 ขอ **5 รูปมุมสำหรับตรวจ** (S, SE, E, NE, N) เพื่อเห็นรูปหน้า/โครงหน้า/หลัง. ชุด gameplay ใน G2–G5 ต้องมีภาพวาดทั้ง 8 ทิศสำหรับชิ้นที่ไม่สมมาตร; ไม่ปล่อยให้ mirroring ผิดด้าน
- Pixel outline หลัก: `#3A1E3F` (พลัม) และน้ำหนักแนวเส้นคงที่ทั้งโลก; **upper eyelid / eyelashes = fixed black** (ตัวอย่าง `#101016`, ไม่เปลี่ยนเมื่อเปลี่ยนสีม่านตา)
- Main light มาจากซ้ายบน; 3–4 shading steps ต่อวัสดุเท่าที่อ่านบนจอได้
- 60% local body/nature/material identity; 30% Lantern Academy color DNA/shadows; 10% story/interactive accents
- สีเขียวหม่น `#4F6E5E` และเขียวสด `#6FB96A` ใช้กับโลกแสงหรี่/แสงกลับ; ครีม `#F3E3C3`, น้ำตาลไม้ `#A8744A`, เงาม่วง `#4B3F72`
- Semantic colors **ห้ามสับสน**:
  - `#FFC857` ทอง = **แตะ/โต้ตอบได้** เท่านั้น
  - `#5FE0FF` ฟ้าเรือง = **คริสตัลความรู้** เท่านั้น
  - `#B8C3CC` เทาเงิน = **เบาะแส** (ค่า Hex ข้อเสนอ ต้องให้เจ้าของดู)
  - **ไฟโคม:** แกนแสงสีแอปริคอต `#FFB36B`, ขอบแสงครีม `#FFF0C9` เป็น **ข้อเสนอ** และต้องพิสูจน์ในภาพ ไม่ใช้ทอง #FFC857 จนเหมือนจุดกด
- Shadow: material cast shading อนุญาต แต่ **ห้าม baked ground cast shadow**; เล่นจริง engine สร้าง Trickster-style cast shadow โดยแยก FX
- ทุกภาพต้องมี original design ไม่ยืมคาแรกเตอร์/อาคาร/ทรัพย์สินทางปัญญาของเกมอื่น

## 3. Character — ตัวนำร่องหนึ่งตัว

**ชื่อเชิงแบบ:** Apprentice of the First Lantern / ศิษย์ผู้พิทักษ์โคมแรก
**อายุภาพ:** ดูเป็นเด็ก 7–10 ปี ไม่ระบุว่าเป็นลีอาจริงหรือหน้าคนจริง
**รูปร่าง:** Chibi ความสูงตัวในกรอบ 96x96 = **80–88 pixels**, หัว ~40–45% ของความสูงภาพตัวจริง, มือสองข้างมองเห็น/แยกแขนชัดเพื่อรองรับ hand grip, เท้าที่ [48,94] ทุก direction. ภาพเด็กไม่ติดหมวก ปีก ดาบ หรือเงาพื้น.
**ใบหน้า:** ตากลมมี upper eyelid ดำคงที่, iris แยก mask, sparkle คงที่มุมบนซ้าย, คิ้วสื่ออารมณ์, จมูกเล็ก ปากเป็นทรงเดียวกันอย่างสมเหตุผลทุกมุม, สีผิว/แก้ม 3–5 เฉด โดยไม่เผาสัดส่วนหน้า
**ผม:** ผมเป็นกลุ่มใหญ่มีลอน/จังหวะชัด (front/back เป็นคู่รหัสเดียวกัน), ไม่สร้างขนละเอียดกระจาย. ในตัวคอนเซปต์ใช้ทรงเดียวเพื่อวัดสัดส่วน
**เครื่องแบบ:** เสื้อสีงาช้าง หนังน้ำตาลอุ่น ผ้าสีบ้าน 4 สีตาม `S.house`, แถบโลหะอุ่นที่ไม่ใช้สีทองสัญญาณ. มีเครื่องหมายโคมไฟขนาดเล็ก; คอนเซปต์ตัวเปล่าไม่จำเป็นต้องถือโคมถ้ายังไม่ทดลอง pose
**สีและเรื่องราว:** ความอบอุ่นของแสงโคม + เงาพลัมเย็นเล็กน้อย; ไม่มีความดุดันหรืออาวุธติดถาวรบน base
**G1 5 View Sheet:** S front 3/4 top-down, SE front diagonal, E side, NE rear diagonal, N back, เว้นช่องและแสดงพื้นหลัง neutral/transparent; ตัวละครต้องเป็นคนเดิมในทุกภาพ ผม/ชุด/ตา/สัดส่วนตรงกัน
**G1 vs G2:** 5-view sheet อาจเป็นภาพคอนเซปต์ ไม่ใช่ Sprite Sheet production. หลัง G1 อนุมัติจึงผลิต 8-direction idle/walk/hold พร้อม 96px grid/feet metadata

## 4. Portrait 384×384 — ห้ามใช้เพียง Upscale Sprite 96

**หน้าที่:** ใช้ในหน้าสร้างตัว/แก้หน้าตา/กล่องข้อมูล ให้เห็นตา/ปาก/แก้ม/ทรงผมชัดที่ผู้เล่นอายุ 7 ขวบเลือกได้
- PNG 384×384 transparent, สไตล์ pixel art เดียวกับ sprite แต่ละเอียดกว่า มุมหน้าตรง/เฉียงหน้าเล็กน้อย, ครึ่งตัว, เสื้อ/ผม/ตา/ผิวเป็น material ที่แตกชั้นได้ในการผลิตจริง
- **รอบ G1:** ทำ Portrait รูปเดียวเป็น Style Master; ยังไม่ต้องสร้างชุด layer ทุกตัวเลือก
- **รอบ G3:** รหัส `hairId`, `eyeId`, `mouthId`, `outfitId`, `skinId` ของ Portrait ต้องตรงกับ sprite, ไม่ใช่ภาพหน้าใหญ่ที่ไม่ sync กับการแต่งตัว
- **มือถือแนวนอนที่ต้องวัด:** 740×360, 844×390, Android 915×412 ใช้ข้อเสนอ initial preview ความกว้าง **128–160 CSS px** และรักษาปุ่มใหญ่ >=44 CSS px; เมื่อแผงเตี้ยให้ย่อลงโดยไม่บังปุ่ม/ตัวเลือก
- iPad 1180×820: preview portrait ประมาณ **216–280 CSS px** ถ้ามีที่พอ; PC 1920×1080 ปรับ responsively ตาม UI. ไม่ fix ขนาด CSS จากสูตร `384 / devicePixelRatio` อย่างเดียว
- ดูความคมที่ device DPR 2.625 จริง; ใช้การแสดง pixel art ที่คมและตรวจ sampling ไม่เปลี่ยนสี/ขอบดำ

## 5. Material Palette Sheet v1.1 (ต้นแบบสเปก ไม่ใช่สีอนุมัติหมดแล้ว)

**ก่อนสร้างภาพจริง** ให้ Claude เปรียบเทียบ `HAIRC`, `EYEC`, `HOUSES`, `AD208.order` จากเกมเดิม แล้วทำตารางจับคู่ Hex ที่ **ใช้งานจริง** กับข้อเสนอใน Bible นี้. ห้ามแทนค่าระบบเกมเดิมเพื่อให้คล้ายชีต

| Material ramp | จำนวนเฉดต่อสี | ตัวเลือกเกมเดิม | ตัวอย่างค่าสี (ข้อเสนอเพื่อจัดภาพดู) |
| --- | ---: | --- | --- |
| Skin | 5 | ผิว 4 ระดับ | `#6E3E3C #A7614E #CF8F70 #EDBD93 #FFE0B8` (ตัวอย่าง medium) |
| Hair | 5 | สีผม 8 สี | `#342A40 #654159 #956A62 #BB8C65 #DFB681` (ตัวอย่าง warm brown) |
| Iris | 3 | สีตา 5 สี | `#604553 #9B6751 #D5A46E` (ตัวอย่าง amber eyes) |
| House Scarf | 4 × 4 houses | `S.house`: ทอง ฟ้า เขียว แดง | ดู ramp 4 บ้านด้านล่าง |
| Fixed Trim / Outlines | 4 | ขอบคงที่ | `#493141 #80604E #C49B67 #F1D5A2` (trim ตัวอย่าง ไม่แทนขอบพลัม/ขอบตาดำ) |

**House fabric ramps (4 เฉด × 4 บ้าน — ตัวอย่างก่อนเทียบ HOUSES เดิม):**
- Gold house: `#6F4B35 #A7783B #C99C52 #E6C88A` (ไม่ใช้ #FFC857 เป็นสีหลักของผ้า)
- Blue house: `#33446A #526E9C #86A8CC #BDD1E8` (ไม่ใช้ #5FE0FF ซึ่งสงวนให้คริสตัล)
- Green house: `#2E5946 #4D8360 #80AE77 #B7D7A2`
- Red house: `#693944 #A1515B #D47B7E #EDB3A6`

**ต้องคงที่:** outline #3A1E3F, upper lid/eyelashes #101016 (fixed black), whites/highlight, brass trim ถาวร, lantern light source. **ห้ามสีเปลี่ยนไปทับ** ดวงตา/ขนตา/ขอบทรง/ผิวคนละวัสดุ. Palette Sheet ต้องแสดงค่าสี Hex แต่ละกลุ่มบนพื้น neutral รวมทั้งตัวอย่าง character เปลี่ยนสีแยกวัสดุ.

> หมายเหตุ: Hex ในตารางที่ระบุว่า “ตัวอย่าง” เป็น **proposal สำหรับชิ้นภาพ G1** ไม่ใช่การอนุมัติ palette gameplay ทั้งเกม; สีจริงต้องเทียบของเก่าและให้เจ้าของตรวจ.

## 6. Asset Contract และ Quality Gate G1

**Target concept output:** 1) 96px base style sheet 5 มุมโดยใช้ reference เดียวกัน, 2) half-body Portrait 384, 3) Material Palette Sheet พร้อม swatches Hex, 4) **128×128 static single comparator** 1 ภาพเพื่อดูความคุ้มของ detail ไม่ต้อง 8 directions

**Technical spec เมื่อทำ G2:** ตัวละคร PNG RGBA ด้วย alpha 0 หรือ 255, 96×96 frame, feet [48,94], 8 rows ordered S SE E NE N NW W SW, no baked floor shadow, no upscale/downscale generated pixels, scale/color/per-layer metadata; direction + action + frame metadata, no rotate-image weapon. G1 concept output อาจใช้แผ่นพรีวิวที่รวม 5 view ได้ แต่ต้องระบุว่า **ยังไม่ใช่ gameplay-ready**.

**Scale comparison:** 96 vs 128 ต้องเทียบทั้งหน้าแต่งตัวและบนฉากเดียวกันภายใต้ zoom **75% และ 100%**. เนื่องจาก G1 ห้ามแก้ code ให้ใช้ screenshots/mock contact-sheet เปรียบเทียบแบบอ่านง่ายจากเอกสาร/ตัวช่วยภายนอก ไม่เปิด feature flag ในเกมจริงโดยไม่อนุมัติ.

**Review thresholds:**
- Owner score: Face Appeal/Identity **>=9.5/10**, all-world style coherence >=9/10, mobile face readability >=9/10
- 5 view มีสัดส่วน/ชุด/ทรงผมเป็นตัวเดียวกัน, ไม่มี extra accessories หรืออาวุธติดถาวร, 0 accidental cropped limbs
- ภาพ Portrait 384 มีรายละเอียดจริง ไม่ใช่ upscale sprite 96
- แยกทองโต้ตอบ/ฟ้าคริสตัล/แสงโคมชัดเจน
- Sample at 75% + 100% readable; เมื่อรวม 4 คนใน pilot ภายหลัง เจ้าของ/ลีอาชี้ตัวเองได้ภายใน 3 วินาที (G4)
- FPS regression ตกไม่เกิน 10% และ memory/load bounds เป็นเกณฑ์ G4 **ยังไม่อ้างผ่านใน G1**
- โปรเจกต์ 2.33 เดิมยังไม่เปลี่ยนไฟล์เกม เซฟ กฎฐานข้อมูล หรือ install cache

## 7. Credit Plan & PixelLab Preflight — ช่วงนี้ยังไม่ Generate

**เพดาน G1:** ประมาณ **65 PixelLab credits** ตามที่เจ้าของอนุมัติเป็นกรอบ ไม่ใช่ค่าใช้จ่ายอัตโนมัติ.

**ลำดับผลิตแบบใช้เครดิตคุ้ม:**
1. ตรวจค่า `get_balance`, available tools, exact price UI/API read-only **โดยไม่เรียก generator**; ถ้า Codex MCP ยังเชื่อมไม่ได้ ให้เจ้าของส่ง screenshot เฉพาะหน้าตั้งค่า/ราคาโดยปิด API Key และข้อมูลลับ
2. สร้างแผ่นสี (ข้อมูล Hex/ตัวอย่าง color swatch) ด้วยวิธีไม่เสีย PixelLab credits ก่อน
3. เมื่อเจ้าของอนุมัติราคา **ต่อหนึ่งงาน** แล้ว จึงสร้าง 96px style/5-view concept ภายใต้ตัวเลือก PixelLab ที่ได้จริง (Character Pro 8-view อาจใช้เป็น source 5-view ได้ แต่ต้องไม่อ้างว่าภาพเหล่านั้นพร้อมใช้เป็น gameplay sprites)
4. หลังตรวจ style ผ่าน ให้ขออนุมัติราคา Portrait 384 ก่อนสร้าง
5. 128px ทำ **ภาพนิ่งหนึ่งภาพ** เพื่อเทียบเท่านั้น โดยขออนุมัติราคา และห้ามสร้างชุด 8 ทิศ/animation
6. ทุกครั้งหลัง Generate: รายงานค่าใช้จริง + remaining budget, รายการไฟล์ output, สิ่งที่ผ่าน/ไม่ผ่าน และหยุดขออนุมัติรอบถัดไป

**ต้นทุนอ้างอิงจากรายงาน Claude ไม่ใช่ราคายืนยัน ณ ตอนกด:** PixelLab 8-direction Pro ที่ขนาด 86–113 px เคยระบุ 15 credits; Portrait 342–512 px เคยระบุ 25 credits; 128 static comparator ขึ้นกับเครื่องมือที่เลือก. ห้ามคำนวณเป็นราคาจริงจนอ่านหน้า UI/API ว่าคิดเท่าไร. หากรวมเกิน 65 ให้ **หยุด** และเสนอทางเลือกกับเจ้าของ ห้ามใช้ส่วนเกินเอง

**ความปลอดภัย:** หาก PixelLab API Key เคยปรากฏใน screenshot หรือตำแหน่งที่ไม่ปลอดภัย ให้เจ้าของ rotate/revoke และตั้งค่าลับใหม่ก่อน Generate. ห้ามคัดลอก API Key เข้าเอกสาร, GitHub, Prompt, screenshot ที่แชร์ หรือ Commit.

## 8. G1 Workflow — ทีละขั้น ไม่ข้าม

**Step G1.0 (ทำตอนนี้ / ไม่มีเครดิต):** Claude อ่าน Visual Bible นี้ + PR #6 + PR #5, ยืนยัน source code unchanged; ประเมินข้อขัดแย้ง (96 vs 128, Portrait 384 vs 256, T=32 vs tile proposal 48, RGB/alpha, no weapon rotation, appearance source), ตรวจ PixelLab pricing/balance read-only และรายงาน "G1 Preflight" ให้เจ้าของส่ง ChatGPT.

**Step G1.1 (ยังไม่มี Generate):** ChatGPT สรุป palette/materials และ Asset Prompt 96px สำหรับ PixelLab เพียงงานเดียว พร้อม setting ค่าทุกช่องจากหน้าจอจริง และแจ้งราคาจริงจาก G1.0; เจ้าของอนุมัติจึงกด

**Step G1.2:** ตรวจภาพ 5 view บนหน้าจอมือถือซูม 75/100 และสไตล์ตรง Bible. ถ้าไม่ผ่าน ให้แก้ prompt ตามข้อบกพร่อง ไม่เติมจำนวนเครดิตโดยไม่อนุมัติ

**Step G1.3:** Portrait 384 พร้อมแก้สี/หน้าคู่กันตาม approved style; ขอราคาก่อน Generate

**Step G1.4:** Static 128 comparator หนึ่งภาพเท่านั้น พร้อมภาพเทียบ; ถ้า 96 + Portrait พอ ก็อาจไม่ต้องใช้เครดิต 128 (แต่การตัดสินว่าข้าม comparator ต้องให้เจ้าของอนุมัติ)

**Step G1.5:** ตัดสินใจล็อก Visual Bible, ชนิดตัวละคร, palette, scale และเทคนิคการบันทึก assets ก่อนเริ่ม G2 Vertical Slice.

## 9. Prompt Design Rules สำหรับ PixelLab ใน G1 (ก่อนเห็นหน้าจอจริงยังไม่ใช่คำสั่งกด Generate)

**English brief / reference for the eventual first job:**

Original friendly young Lantern Academy apprentice, cute modern 2.5D low-top-down pixel-art game style. Chibi proportions with a large readable face, expressive symmetrical eyes with fixed black upper eyelashes, distinct iris colors and highlights, a gentle expressive mouth, rounded cheek silhouette, hair with clean chunky pixel clusters, ivory academy tunic, warm leather accessories, a subtle brass lantern-school insignia, and a house-color scarf. Deep-plum clean outlines, warm upper-left lighting, three or four material shading steps, subtle cool violet shadows. Full-body character, empty clearly separated hands for later modular equipment; no permanent weapon, wings, hat, cast floor shadow, scenery, UI, letters or watermark. Crisp square pixels, transparent background, same face, hair, outfit and feet positions across directional views. Expressive but not babyish, readable on a landscape mobile game screen. Preserve Lantern Academy visual semantics: clickable gold, knowledge-crystal cyan, lantern warm apricot glow distinct from gold UI cues.

**Do not Generate yet.** Claude ต้องอ่านราคาจริงก่อน แยกสิ่งที่เป็น G1 concept กับ sprite gameplay และเชื่อม reference ที่เจ้าของเลือกไว้ให้ PixelLab เท่านั้น.
