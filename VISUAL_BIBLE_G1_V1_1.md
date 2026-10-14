# LANTERN ACADEMY — VISUAL BIBLE G1 v1.2
**วันที่จัดทำ:** 14 ต.ค. 2026
**สถานะ:** G1.0 preflight reviewed / G1.1 first Prompt prepared / ยังไม่สร้างภาพ ไม่ใช้เครดิต ไม่แก้โค้ดเกม / ห้าม Generate ก่อนแจ้งราคาจริงและเจ้าของอนุมัติ
**สีวัสดุและตารางสีที่มีผล:** `G1_MATERIAL_PALETTE_V1_2.md` (ตารางอ้างอิงล่าสุด; คงลำดับสีเดิมทั้งหมด)  
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

## 2. Common Visual Contract (G1.0 corrected)

- Camera direction: `S SE E NE N NW W SW` ตามเกมปัจจุบัน. G1 ขอ **5 มุมสำหรับตรวจ** (S, SE, E, NE, N); ภาพต้นแบบ 5 มุมยังไม่ใช่ production sprites; ชิ้นจริงที่ไม่สมมาตรต้องวาดครบ 8 ทิศ.
- Pixel outline ภายนอก `#3A1E3F` พลัมคมชัด ไม่เบลอ; upper eyelid/eyelashes = **ดำคงที่ #101016**, ไม่เปลี่ยนเมื่อเปลี่ยนสีม่านตา
- Main light บนซ้าย; 3–4 shading steps ต่อวัสดุ; 60/30/10 เป็นสัดส่วนภาพไม่ใช่โควตา pigment รายจุด
- สถานะแสงหรี่ใช้เขียวหม่น `#4F6E5E`, แสงกลับใช้ `#6FB96A`; ครีม `#F3E3C3`, ไม้ `#A8744A`, เงาม่วง `#4B3F72`
- Semantic palette **ห้ามใช้ปะปนกับวัสดุของตัวละครในภาพ G1**:
  - **#FFC857** = ปุ่ม/จุดที่ผู้เล่นแตะโต้ตอบได้ (ห้ามใช้เป็น sparkle ชุดตัวละคร)
  - **#5FE0FF** = คริสตัลความรู้เท่านั้น (ห้ามใช้เป็นสีเอฟเฟกต์ตัวเอกโดยไม่มีเหตุ)
  - **#B9B7CF** = เบาะแส สีอ้างอิง ART_DIRECTION เดิม (ข้อเสนอให้เจ้าของรับรอง)
  - **#FFB36B / #FFF0C9** = แสงโคมอุ่นแกน/ขอบ (ข้อเสนอ): ΔE00 จากทองโต้ตอบประมาณ 11.4 / 17.0
- Copper Trim ที่เสนอสำหรับโลหะเครื่องแต่งกาย ใช้ `#3D292C #67413A #915B49 #BB7A57`, ค่าสีนี้เป็น **proposed art** ไม่ใช่ค่าโลหะเกมที่เปลี่ยนแล้ว
- เทียบ `G1_MATERIAL_PALETTE_V1_2.md` เป็นหลัก: HAIRC/EYEC/HOUSES เดิมคงเลข/ลำดับและรหัส Hex. คู่สีที่มีหน้าที่ต่างกันและอยู่ติดกันใช้ ΔE00 ≥10 เมื่อทำได้; ถ้าเป็นสีบ้านเดิมที่ชน UI gold/หญ้า ให้แก้ด้วยเส้นขอบ รูปทรง การวาง และสัญลักษณ์ ไม่เปลี่ยนสีเดิม
- Shadow: **เงาทอดลงพื้นแบบ Trickster วาดด้วย engine** ห้าม bake ลง PNG; วัสดุมี highlight/shading ตามปกติได้
- **ห้ามหมุนภาพอาวุธหรือโคมไฟด้วยโค้ด**: ทุกทิศที่แสดงจริงใช้ภาพถือที่วาดตามทิศนั้นและ per-view grip/hand anchor
- เด็กอายุ **ต่ำกว่า 10 ไม่ตีมอน**: แสดงท่าโบกมือ/ท่าถือตะเกียง; ภาพ/ท่าโจมตีดาบตรวจเฉพาะผู้ใหญ่หรือโหมดทดสอบ GM ไม่ปลดล็อกให้เด็ก
- ภาพและโลกต้องเป็น original IP ของ Lantern Academy ไม่คัดลอก art จากเกมอื่น

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

## 4. Portrait 384×384 — Quality + Display Pixel Contract

**ต้นฉบับ:** PNG transparent **384×384** ภาพครึ่งตัววาดละเอียดใหม่ แยกจาก Sprite 96×96 ไม่ใช้ upscale; ผม ตา ปาก ผิว ชุด ที่ผู้เล่นเลือกต้อง map ID ตรงกับในเกมเมื่อเข้าสู่ G3.

**ความคมบนจอ:** ขนาด CSS เป้าหมายแบบ **1 source pixel ≈ 1 physical display pixel** คือ `384 / devicePixelRatio` CSS px หาก layout รองรับ และไม่เกิด fractional resampling ที่ทำให้ภาพเบลอ. ไม่ใช่เพียงกำหนด CSS width เป็นจำนวนเต็มแล้วถือว่า pixel-perfect.
| อุปกรณ์ทดสอบ | DPR จากรายงาน/ตัวอย่าง | เป้าหมาย CSS สำหรับ 1:1 | วิธีตรวจ |
| --- | --- | --- | --- |
| Android DPR 3 | 3 | **128 CSS px** | แสดง preview ราว 128 CSS, ตรวจรายละเอียดหน้าและปุ่ม 44 CSS |
| Android DPR 2.625 | 2.625 | **146.286 CSS px** ทางคณิตศาสตร์ (`146px` เป็นการปัดใกล้เคียง **ไม่ใช่ 1:1 เป๊ะ**) | ตรวจ nearest-neighbor/pixelated กับ browser screenshot จริง รวมทั้ง 146 และ 146.286 CSS |
| iPad DPR 2 | 2 | **192 CSS px** หรือ **384 CSS px** ที่ device scale 2 เท่า (ถ้ามีที่พอ) | แนะนำ 192 บนหน้าแต่งตัว, ดูว่าตัวเลือกไม่ถูกบัง |
| PC DPR 1 ตัวอย่าง | 1 | **384 CSS px** หรือย่อ responsive อย่างระมัดระวัง | ตรวจความคมพร้อมพื้นที่ UI |

ในมือถือแนวนอนเล็ก 740×360 / 844×390 / 915×412 **ให้ความสำคัญกับไม่บังหน้าต่าง/ปุ่มก่อน**; หากจำเป็นต้องย่อ ใช้ nearest-neighbor/pixelated หรือ render ไป canvas ที่มีขนาดพื้นผิวเหมาะสมและ **ทดสอบภาพจริง**. การสเกล CSS, device DPR, zoom และการปัด subpixel อาจทำให้ไม่ pixel-perfect แม้คำนวณสัดส่วนถูก

**G1:** เพียงกำหนดกติกา, ภาพ Portrait Style Master 1 ภาพหลังอนุมัติราคา; **G4:** ทดสอบ Android จริง 740×360, 844×390, 915×412, iPad 1180×820 และ PC 1920×1080

## 5. Material Palette Sheet v1.2 — รักษาค่าสีจริงจากเกม

**เอกสารหลักที่ต้องใช้แทนตัวอย่างเก่า:** [G1_MATERIAL_PALETTE_V1_2.md](G1_MATERIAL_PALETTE_V1_2.md).

- HAIRC **8 สี × 5 เฉด** จากเกมจริง ห้ามเปลี่ยนลำดับ Index
- EYEC **5 สี × 3 เฉด**; เปลี่ยนเฉพาะม่านตา ขอบตาบนและขนตาคงที่
- HOUSES **4 บ้าน × 4 เฉด**; บ้านดูจาก `S.house`, ห้ามเปลี่ยนค่าหลัก/ลำดับ
- Skin **4 ระดับ × 5 เฉด** ใหม่เป็น *ข้อเสนอเพื่อทดลองภาพ G1* (ค่ารหัสเดิมของ `AD208.order` และจำนวนตัวเลือกต้องคงเดิม)
- Copper Trim **4 เฉดใหม่** เป็น *ข้อเสนอ* ลดการชนกับสีบ้าน Sun; copper มี ΔE00 ต่ำสุดกับ House Sun/Wing/Leaf/Flame ประมาณ **19.8/23.4/38.4/13.8**
- Silver clue **#B9B7CF** แทนตัวอย่างใหม่เก่า `#B8C3CC` ตาม ART_DIRECTION เดิม; แสงโคม **#FFB36B/#FFF0C9** ทดลองร่วมกับ Gold UI `#FFC857`
- **ข้อยกเว้น ΔE00:** Sun บ้านเดิม vs Gold UI บาง shade≈3.5, Leaf vs Grass≈9.0, Black Hair vs Black Iris≈1.7; **ห้ามทำให้ทุกคู่ผ่านด้วยการเปลี่ยนสีที่ผูกกับเซฟ** ใช้ shape/outline/placement แทน

**G1 selected materials สำหรับตัวละครต้นแบบ:** ผม **Brown**, ม่านตา **Green**, สีผิว **Medium**, ผ้าพันคอ **Wing Blue**, trimmed metal copper ในปริมาณน้อย. วัสดุนี้ใช้แยกชั้นสีและตรวจหน้าตาตอนซูม 75/100 ได้ชัด

## 6. Asset Contract และ Quality Gate G1

**Concept deliverables ตามที่อนุมัติเมื่อทราบราคา:** 1) ตัวละคร 96px target (ดูเงื่อนไข PixelLab 88px) ตรวจ 5 มุม S/SE/E/NE/N; 2) Portrait 384 ครึ่งตัวหนึ่งภาพ; 3) Material Palette Sheet เชิงตัวเลข/hex; 4) ภาพนิ่ง 128px **หนึ่งภาพเท่านั้น** สำหรับเทียบ หลังเจ้าของอนุมัติราคา

**PixelLab v3 preflight constraint:** ในหน้าจอที่ Claude ตรวจ ท่านตั้ง **88 px ได้แต่ 96 px ไม่ได้**. งานแรกถ้า Generate 88 px ให้ระบุว่า **Source 88** ไม่ใช่เกม-ready 96; ต้อง **pad ผืนโปร่งใสเป็น 96×96 โดยไม่ resize pixels หรือหมุนภาพ** และ align feet [48,94] ภายหลังในขั้นทดสอบ asset. หาก 88px ขนาดตัวจริงสูงไม่ถึง 80–88 ให้ประเมินใหม่ก่อนสร้าง animation ห้ามย่อ/ยืดให้ถึงตัวเลขโดยพลการ

**Production ต่อใน G2:** PNG RGBA (pixel sprites alpha 0 หรือ 255), Frame 96×96, feet [48,94], 8 views `S SE E NE N NW W SW`, hand/head/back anchors ต่อทิศ/เฟรม, no baked floor shadow, no image rotation lantern/weapon, no nearest-neighbor violations; metadata manifest; portrait แยก 384.

**คุณภาพที่เจ้าของตัดสิน:** Face Appeal >=9.5/10; Visual Cohesion >=9/10; mobile readability ซูม **75% และ 100%** >=9/10; เห็นมือทั้งสองข้าง ผ้าบ้านไม่ขาด ไม่มีแสง/อาวุธ/โคมติดถาวร, ไม่มีสีที่ทำให้ทองโต้ตอบหรือฟ้าคริสตัลสับสน

**เทคนิคที่ต้องวัด:** ทิศทั้ง 8 เหมือนคนเดียว, รูปและเท้าแต่ละมุมลงกรอบถูก; กึ่งใส/รูใสโดยไม่ตั้งใจเป็น 0 ใน asset ที่ใช้จริง; ตาหน้าตรงไม่เอียงและไม่กินกรอบหน้า, ผมหน้า/หลังเป็นคู่; ค่าสีไม่ leak mask; ไม่ถือว่า "ผ่าน" ถ้ามีแค่ concept sheet

**Performance:** G1 ยังไม่แก้เกมและยังไม่อ้าง FPS ใหม่; G4 ต้องเทียบ baseline 2.33 ที่เดสก์ท็อปและทดสอบมือถือจริง, FPS regression ไม่เกิน 10%, lazy-load ชุดใหม่ (ไม่เพิ่ม 23.2MB PWA initial download)

## 7. Credit Plan — PixelLab Preflight (ไม่ Generate ใน G1.0)

**เพดานงบประมาณ G1 = ~65 credits** (เจ้าของอนุมัติเป็นเพดานเตรียมงาน) แต่ **ราคาจริงยังไม่ทราบ**. Claude ตรวจครั้งล่าสุดไม่สามารถอ่านราคาจาก UI/API ได้ จึงไม่มีสิทธิ์เริ่ม Generate เอง

| งาน | เครื่องมือเสนอ | คาดเพดานงานจากเอกสารเก่า | สะสมสูงสุด |
|---|---|---:|---:|
| ตัวละครรอบแรก **v3 88px** (target padded 96) | Create Character v3 / Low Top-Down | 9 | 9 |
| เผื่อแก้ภาพ 1 รอบ (ไม่จำเป็นต้องใช้) | v3 | 9 | 18 |
| Portrait 384×384 | Create S-XL Pro | 25 | 43 |
| ภาพนิ่งเปรียบเทียบ 128px เพียง 1 ภาพ | v3 (ราคาไม่ยืนยัน) | 9 | 52 |

**ส่วนเผื่อเหลือจากเพดาน ≈13 credits** ภายใต้ราคาประเมินทั้งหมด. ถ้าราคาจริงต่างจากนี้ต้องปรับตารางและขออนุมัติใหม่ก่อนกด. ราคาทางเลือก Pro สำหรับ base อาจทำให้งบเกิน 65, จึงแนะนำ v3 รอบแรกเพื่อพิสูจน์รูปลักษณ์

**บัญชี PixelLab:** เครดิตคงเหลือไม่ทราบ; ห้ามอ้างยอดประมาณเดิม (เหลือ ~3009 ณ 13 ต.ค.) เป็นยอดปัจจุบัน. ถ้ามี API Key เคยติดภาพหน้าจอ ให้เจ้าของ rotate ก่อนใช้ใหม่. ห้ามแสดง API Key ในภาพและแชต

**ก่อนสั่ง Generate ครั้งแรก ต้องมีครบ:** (1) screenshot ยอดเครดิตแบบไม่ติด secret (2) screenshot ตรงบรรทัด `Costs N generations` ของตัว 88 หรือ 96 ถ้าตั้งได้จริง (3) screenshot ราคา S-XL 384 เพื่อวางงบ (4) เจ้าของตอบอนุมัติ **ราคาจริงสำหรับงานแรก**. ถ้า screenshot ไม่ชัด ให้ขอใหม่ก่อน ไม่เดาราคา

## 8. G1 Workflow — ทำทีละขั้น

1. **G1.0 COMPLETE**: Claude G1.0 report 14 ต.ค. ชี้ 6 จุดต้องแก้ใน Bible, รายงานสีจริง HAIRC/EYEC/HOUSES/AD208 และต้นทุนจากเอกสารเก่า, ยังไม่ได้ราคา UI จริง
2. **G1.1 PREPARED (NO CREDIT)**: Bible v1.2 + Material Palette Sheet v1.2 + **PixelLab prompt เดียว** สำหรับตัวละคร 88px source/96 target ตามข้อ 9; เจ้าของตรวจสไตล์และยอดเครดิตก่อน
3. **G1.1 PRICE GATE**: เจ้าของส่งภาพหน้า Account เฉพาะยอด, `Costs N generations` ของงาน v3, ราคา S-XL 384 (ไม่มี key); ChatGPT เทียบกับเพดาน 65 แล้ว **ขออนุมัติราคางานแรก**; ห้าม Generate ก่อน
4. **G1.2 (AFTER PRICE APPROVAL)**: Generate รอบแรกเพียงงานเดียว; ส่ง ZIP/PNG ให้ ChatGPT ตรวจสไตล์และ Claude วัด 5 view/height/feet/alpha; เทียบ 75%/100%. ไม่เปิดงานอื่นเอง
5. **G1.3**: Portrait 384 ภายใต้ราคา/การอนุมัติใหม่; ตรวจ detail จริงไม่ upscale
6. **G1.4**: 128px static comparator 1 ภาพ ภายใต้อนุมัติ; เปรียบเทียบที่ขนาดแสดงผลเดียวกัน; ไม่สร้าง 8-direction 128
7. **G1.5**: เจ้าของลงมติ visual identity + ตัวละคร 96 + palette; ผ่านแล้วไป G2 Vertical Slice

## 9. PixelLab G1.1 — Prompt งานแรก (ฉบับตรวจแล้ว / ยังไม่ Generate)

**ตั้งค่าที่ Claude รายงาน:** Characters → Create Character → Create from Text → Humanoid → **Generation Mode: v3** → Camera: **Low Top-Down** → Sprite Size: **88 px** (เพราะ 96 ไม่มีในเครื่องมือที่ตรวจ; 88px เป็น source, **ไม่ใช่ output ready-96**) → Detail: **Highly detailed** → Outline: **Default** → ไม่ใส่ Style Reference → ปิด Enhancer/ความสามารถอัตโนมัติที่เพิ่มรายละเอียดไม่คุม ถ้าหน้าจอมี. ถ้า label หน้าจอไม่ตรง ให้หยุดและขอ screenshot ก่อนกด

**Final prompt English — paste เฉพาะข้อความในกรอบนี้ ลง Character Description** (ไม่มีคำสั่งให้ PixelLab ใส่ gold/cyan sparks; ความหมายสีอยู่ใน Bible ไม่ต้องยัดใน prompt ตัวละคร)

```text
Create one original young female apprentice from Lantern Academy, age appearance 8–9, for a cute modern pixel-art browser RPG.

Camera: low top-down 3/4 view. Create consistent eight-direction character views. Chibi shape about 2.5 heads tall, a charming larger face, expressive big symmetrical eyes, a fixed very dark upper eyelid and eyelashes, small distinct irises, clear eyebrows, gentle natural smile and softly rounded cheeks. Rich detail made of crisp pixel clusters, not blurry or smooth.

Hair: shoulder-length warm chestnut brown, arranged in simple large locks, a clean forehead silhouette. Iris color: leafy green. Skin: natural medium warm tone. Outfit: ivory Lantern Academy apprentice tunic with subtle layered seams, soft warm leather boots and belt, a deep bright blue school-house scarf, small muted copper metal fasteners. The costume should suggest a thoughtful lantern scholar without holding any lantern.

Make the entire body readable at a small size. Both arms slightly separated from the torso; both empty hands and fingers readable for future modular equipment. Proportions, hair, eyes, outfit and feet must remain consistent across every view. Warm light from the upper left, cool gentle plum shadows, clean deep-plum outlines. Full body centered on a transparent background.

No hat, wings, weapons, held objects, permanent glow, floating sparks, crystals, scenery, cast floor shadow, labels or watermark. No blur or anti-aliased pixel edges. No extra characters.
```

**ผลที่ต้องได้หลัง Generate (ไม่ใช่คำมั่นว่า AI จะทำถูก):**
- 8 ทิศ `S SE E NE N NW W SW` คนเดียวกัน; คอนเซปต์ใช้ตรวจ 5 มุมหลัก `S SE E NE N`
- ตรวจความสูงใน **88px source** ว่าอยู่ในช่วง **80–88 px**; ถ้าได้ต่ำกว่า 80 หรือมือ/เท้าหายให้หยุดและทบทวน
- **G1 concept / source**: ห้ามอ้าง frame 96×96 ก่อนทำ transparent padding + align [48,94] โดยไม่ resample; ห้ามเปลี่ยน T=32 หรือปรับซูมเกม
- ห้ามมี pixel กึ่งใสที่ไม่ตั้งใจหรือรูบนหน้า/ตัว; ตาหน้าตรงสมดุล, ผ้าสีน้ำเงินเห็นชัด, มือทั้งสองไม่ติดลำตัว, ใบหน้าน่ารักได้คะแนนเจ้าของ >=9.5
- ห้ามตัวละครมีโคมไฟ/อาวุธ/แสงเวท/ทองโต้ตอบ/ฟ้าคริสตัลติดถาวร; สีตัวละครวัดจริงเมื่อได้ภาพ
- ให้ Claude ส่งราคา **ก่อน** และรายงาน actual credits **หลัง** โดยไม่เริ่มทำครั้งต่อไปเอง

## 10. G1.0 Preflight corrections accepted
Claude ตรวจและขอแก้ 6 จุด: (ก) prompt ไม่ชวนสร้างทอง/ฟ้าเรือง; (ข) responsive Portrait DPR 3/2.625/2 แบบ pixel mapping (ค) fixed trim copper แยกบ้านทอง (ง) House Colors เดิมทุกลำดับ + exceptions (จ) hair/iris วัสดุมี mask และ ΔE เฉพาะคู่สำคัญ (ฉ) ห้าม rotate lantern และเด็กต่ำกว่า10ไม่โจมตี. ทั้งหมดบรรจุใน Bible v1.2 นี้และ Material Palette Sheet ใหม่แล้ว

