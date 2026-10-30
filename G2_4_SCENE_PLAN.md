# G2.4 — ฉากทดลอง + มอน 1 ชนิด (Claude · แผน v1.2 · 30–31 ต.ค. 2569)

**สถานะ:** แผน v1.2 · **รอบ 1 กดแล้ว** (`qa/g2-4-scene/round1/README.md`: ไทล์ A B · สไลม์ ค 54 px · บ้านยาม 256 ประตู 52×103) · ผัง v2 (บ้าน 8 ช่อง) · สเปก `ASSET_SPEC_10_g24_scene.md` `ASSET_SPEC_11_g24_slime.md` · **รอบ 2 = ข้อ 5b รอ Codex ตรวจ (T3) แล้วเจ้าของอนุมัติครั้งเดียว** · (v1 = ผู้ตรวจอิสระ 13 ข้อ · v1.1 = Codex T2 · v1.2 = หลังรอบ 1)
**ที่มา:** เจ้าของ 30 ต.ค. 18:07 "Ok ผ่าน ต่อ" (QG-5a ตะเกียงผ่าน) → เลือก **G2.4** → **D6:** ธีม = **ชายหมู่บ้านหน้าปากถ้ำ ตอนพลบค่ำ** · มอน = **สไลม์**
**อ้างอิง:** แผน G2.0 ข้อ 5 G2.4 และ QG-4 (branch `plan/g1-3-character-art-direction-v2` `200c504`) · `SCENE_GUIDE.md` ข้อ 0–10 · `ART_DIRECTION.md` · `ART_GUIDE.md` · `PIXELLAB_GUIDE.md` · `STORY.md` ข้อ 5, 7–8, 14

## 1. เป้าหมายและขอบเขต
- ฉากเดียวในหน้า Pilot (GM) ที่ตัวละครใหม่ (ช่อง 96 · สูง 83 px) เดินได้จริง: ทางเดิน ขอบฉาก อาคาร + ประตู ต้นไม้ โคมไฟ ของเล็ก ทางออก 1 จุด + มอน 1 ชนิด
- ได้ลองตะเกียงที่เพิ่งผ่านในฉากจริง: **เขตปลอดภัยใต้ไฟถนน** (ฝั่งหมู่บ้าน) กับ **ทุ่งมืด** (ฝั่งตะวันออก สไลม์เดิน) ตาม `STORY.md` ข้อ 5, 7–8
- **ไม่อยู่ในงานนี้:** ระบบมอนตี/ไม่ตี การเก็บคริสตัลจริง ข้างในบ้านยาม ฉากในถ้ำใหม่ เกม 2.33 · เซฟ · ออนไลน์

## 2. ตัวเลขที่ล็อก (ไม่เปลี่ยน)
| เรื่อง | ค่า | ที่มา |
|---|---|---|
| ช่องพื้น | `T = 32` px · ชนด้วยจุดเท้า | G1.6 · G2.0 |
| ตัวละคร | ช่อง 96×96 · ตัว `_4` สูง 83 กว้าง 47 · เท้า `[48,94]` | G1.6 |
| ประตูที่เห็น | ~~≥ 64 px~~ → **ช่องในภาพ ≥ ตัวเด็ก + 4 px (กว้าง ≥ 51 · สูง ≥ 87)** | G2.0 ข้อ 16 · เจ้าของ 31 ต.ค. 23:48 (บ้าน 256 ได้ 52×103) |
| ฉาก | ≥ 28×14 ช่อง (896×448 px) | G2.0 |
| มอน | สูง 0.6–1.0 เท่าตัวเด็ก = **50–83 px** · ดุดันแต่ไม่น่ากลัว | G2.0 |
| สีสัญญาณ | ทอง `#FFC857` (แตะได้) · ฟ้า `#5FE0FF` / `#7FE0FF` (ความรู้ = ของที่เก็บได้) · ของประดับห้ามใช้ | `ART_DIRECTION.md` ข้อ 2 |
| วงแสงทางออก | ฟ้าขาว | `SCENE_GUIDE.md` ข้อ 4 (หมายเหตุ: `ART_DIRECTION.md` ข้อ 2 ใส่ "ทางออก" ไว้ในหมวดทอง · เอกสารสองฉบับไม่ตรงกัน · ใช้ข้อ 4 ไปก่อน ให้เจ้าของตัดสินภายหลัง) |

## 3. ผังฉาก v2 (`qa/g2-4-scene/layout-v2.png` · v1 = `layout-v1.png`)
```
   0         1         2
   0123456789012345678901234567
 0 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^   ^ หน้าผาหิน (แถว 0–2 = บนผา · แถว 3 = หน้าผา)
 1 ^^^^^^^^^^^^^^^CCCC^^^^^^^^^   C ปากถ้ำ (โขดหิน 128×128 ซ้อนบนหน้าผา)
 2 TT^^^^^^^^^^^^^CCCC^^^^^^^TT   X ทางออก (วงแสงวาร์ป) = จุดเดียวของฉาก
 3 TT^^^^^^^^^^^^^CCCC^^^^^^^TT   T ต้นไม้   H บ้านยาม 256 (8 ช่อง)   D ช่องประตู
 4 T.............L=XX=L.......T   L เสาไฟถนน (วงแสง 4.5 ช่อง)
 5 T...............==.........T   b ลัง   r ขดเชือก   R หิน
 6 T..HHHHHHHH....==.......R..T   f รั้ว   G ประตูรั้วหมู่บ้าน (ปิดตอนค่ำ)
 7 T..HHHHHHHH..L.==..........T   = ทางหลัก 2 ช่อง   - ทางรอง 1 ช่อง
 8 T..HHHDDHHHbr.==.......R.*.T   . หญ้า (สคริปต์ทำหญ้าที่ไกลไฟทุกต้น > 4.5 ช่อง เป็น "ทุ่งมืด")
 9 T...L---------==...........T   * เศษคริสตัล (ของที่เก็บได้)
10 T............L==...........T   S จุดเริ่ม
11 TT.......*.....=S.........TT
12 TTT..TT.......==.....TT..TTT
13 TTTTTTTTTTTTffGGffTTTTTTTTTT
```
**ทำไมของอยู่ตรงนี้ (`SCENE_GUIDE.md` ข้อ 3):**
- **ปากถ้ำ** ฝังในหน้าผาทางเหนือ (แบบที่ 1) = **จุดเด่นเดียว** ที่ 60.7 % ของความกว้าง (สัดส่วนทอง 61.8 %) · ทางหลักพาสายตาจากจุดเริ่มขึ้นไปปากถ้ำ · เสาไฟสองข้างปากถ้ำ (ชาวบ้านตั้งไว้)
- **บ้านยามปากถ้ำ** ฝั่งตะวันตก = คนเฝ้าทางเข้าถ้ำ · ประตูหันลงทางรอง · เสาไฟข้างประตู · ลังและขดเชือกวางข้างหน้าบ้าน (ไม่อยู่หลังภาพบ้าน)
- **เสาไฟ 5 ต้นอยู่ติดทางหรือประตูทุกต้น** · **ทุ่งมืด = หญ้าที่ไกลไฟทุกต้นเกิน 4.5 ช่อง** (สคริปต์คำนวณ ไม่ได้ระบายเอง) → ที่สไลม์เดินได้ = ทุ่งมืดฝั่งตะวันออก 47 ช่อง (คอลัมน์ 18–26) · อยู่ในแสงไฟ 0 ช่อง
- **เศษคริสตัล 2 ชิ้น:** ฝั่งสว่าง (9,11) ห่างไฟ 4.1 ช่อง ให้เด็กเจอง่าย · ฝั่งมืด (25,8) ห่างไฟ 7.2 ช่อง ต้องใช้ตะเกียง · ไม่มีชิ้นไหนอยู่หลังต้นไม้หรืออาคาร
- **ขอบฉาก** ปิดด้วยหน้าผาและแนวป่า (แถว 12 มีกลุ่มต้นไม้ยื่นเข้ามา ไม่เป็นแถวตรง) · ทิศใต้มี **ประตูรั้วหมู่บ้านที่ปิดตอนค่ำ** + เดินไปถึงแล้วขึ้นข้อความ "ประตูหมู่บ้านปิดตอนค่ำ / The village gate is closed at night"
- **ทางออก X** ในหน้า Pilot = เข้าโหมดถ้ำที่มีอยู่แล้ว (พื้นถ้ำ GM) และมีทางกลับ · ไม่สร้างฉากถ้ำใหม่ในงานนี้

**ตัวเลขผัง (`qa/g2-4-scene/tools/layout.py` · `layout-check.json`) — เป็นการตรวจแบบผังเท่านั้น:**
| ตรวจ | ได้ |
|---|---|
| ขนาด | 28×14 ช่อง = 896×448 px · `T = 32` |
| ช่องประตู | 2 ช่อง (คอลัมน์ 6–7) · ช่องในภาพบ้าน 52×103 px |
| คู่จุดสุ่มจากช่องที่เดินได้ทั้งหมด (seed 2410 · 8 ทิศ ไม่ตัดมุม) | **60/60** · รันซ้ำได้เส้นทางเดิม |
| จุดที่ต้องไปไม่ได้ 11 จุด | หาเส้นทางได้ **0/11** |
| ช่องที่เดินได้แต่ไปไม่ถึง · ทางตัน · ช่องแคบ 1 ช่อง | **0 · 0 · 0** |
| ไปถึงทางออก / ประตู / คริสตัล 2 ชิ้น | ✅ / ✅ / ✅ |
| พื้นที่เดินได้ | 49.2 % ทั้งฉาก · 67.0 % ใต้แนวหน้าผา (เกณฑ์ราว 60 %) · v1 = 50.5 / 68.8 |
| ช่องที่ตัวเด็กถูกงานภาพด้านหน้าบังเกินครึ่ง (v2 · บ้านจริง + ต้นไม้ทุกช่อง T) | 64 ช่อง (23 ในเขตสไลม์) → หน้า Pilot เลือกช่องวางต้นไม้ให้ ≤ 24 และ 0 ในเขตสไลม์ (`ASSET_SPEC_10` ข้อ 4) |
- **ข้อจำกัด (ผู้ตรวจอิสระ ข้อ 4):** จุดที่ต้องไปไม่ได้ทุกจุดเป็นช่องทึบ A* จึงปฏิเสธทันที · ช่องเดินได้ทุกช่องต่อถึงกันหมด จึงได้ 60/60 แน่นอน → ตัวเลขนี้ยืนยันแค่ว่า "ผังต่อกันครบ" · **การตรวจจริง (QG-4 ข้อ 1) ทำในหน้า Pilot ด้วยการเดินจริง**

## 4. รายการชิ้นภาพ
| รอบ | ชิ้น | เครื่องมือ PixelLab | ขนาด | ใช้ใน |
|---|---|---|---|---|
| **1** | **A** หญ้าหมู่บ้าน + ทางดิน | Map Workshop · Tileset Standard · Wang | ไทล์ 32 | `.` `=` `-` |
| **1** | **B** หญ้า + หน้าผาหิน | Map Workshop · Tileset (ใช้หญ้าจาก A) | ไทล์ 32 | `^` |
| **1** | **C** บ้านยามปากถ้ำ | Object Creator Pro · 1 ทิศ | 192×192 | `H` `D` |
| **1** | **D1** สไลม์ ทิศใต้ (เลือกแบบ) | Object Creator Pro · 1 ทิศ | 64×64 | มอน |
| 2 | **D2** สไลม์ครบ 8 ทิศ (จากแบบที่เลือก) | ตามเมนูที่มีจริง (ถามก่อน) | 64×64 | มอน |
| 2 | ปากถ้ำ = โขดหินมีปากถ้ำ ซ้อนบนหน้าผา | Object Creator Pro | 128×128 | `C` |
| 2 | ต้นไม้ 2 แบบ · เสาไฟถนน | Object Creator Pro | 128×128 (ฐาน 64,124) | `T` `L` |
| 2 | ของเล็ก 1 ชุด (ลัง ขดเชือก หิน รั้ว ประตูรั้ว กอหญ้า ดอกไม้ เศษคริสตัล) | Object Creator · Describe each item | 32–64 | `b` `r` `R` `f` `G` `*` |
- **ทำด้วยโค้ด (ไม่ใช้เครดิต):** วงแสงวาร์ป · แสงอุ่นลอดประตู · วงแสงเสาไฟ · ความมืดทุ่ง (หรี่ ไม่ดำ) · เงา Trickster · การเดินของสไลม์ (ข้อ 6)
- **รอบ 1 = 4 ชิ้นที่กำหนดลุค** · ดูผลก่อนกดรอบ 2 (ลุคไม่ใช่ จะได้ไม่เสียเครดิตทั้งชุด)
- **หน้าผาสูงแค่ไหนรู้หลังได้ไทล์ B** (หน้าผาจากไทล์อาจสูงไม่ถึง 1 ช่อง) · ปากถ้ำจึงเป็นโขดหินของตัวเองที่สูงพ้นหน้าผา ไม่ต้องพึ่งความสูงของไทล์ · ขนาดสุดท้ายออกในสเปกหลังวัดไทล์ B

## 5. รอบ 1 · วิธีกดและพรอมป์ (อันเดียวต่อชิ้น · ช่องตามลำดับบนหน้าจอ · คำต้องห้าม 0)
รูปอ้างอิงอยู่ใน `qa/g2-4-scene/refs/` (สร้างจากตัวเด็กที่ล็อก ไม่ย่อขยาย · `scale-board-3x.png` = ภาพเทียบขนาด ไม่ต้องอัปโหลด)
**ก่อนทุกงาน Object Creator:** กด 🗑 ล้างรูปเก่า · เช็กว่า Describe each item ว่าง · Auto-add to = Off · ดูบรรทัด Total ก่อนกด

### A · หญ้าหมู่บ้าน + ทางดิน (Map Workshop → New Tileset)
1. **Standard** · 2. Tile Size **32×32** · 3. **Top-down**
4. Lower Terrain (ติ๊ก **Walkable**):
```text
packed warm brown dirt footpath with small pebbles and faint cart ruts, soft dusk light
```
5. Upper Terrain (ติ๊ก **Walkable**):
```text
short soft village grass in muted blue-green with tiny clover and a few small cream flowers, calm dusk twilight
```
6. Transition **0%** · Edge **Round** · Roundness **60** · Raggedness **25** (ค่า A-07 ที่เคยได้ผล)
7. Enhance descriptions with AI **ติ๊ก** · **Medium detail** · **Medium shading** → Generate → ดาวน์โหลดแบบ **Wang**

### B · หญ้า + หน้าผาหิน (New Tileset)
1. **Standard** · 2. **32×32** · 3. **Top-down**
4. Lower Terrain: กด **✕ Cancel** แล้ว**เลือกหญ้าจากงาน A** (ติ๊ก Walkable)
5. Upper Terrain (**ไม่ติ๊ก** Walkable):
```text
top of a rocky hill, mossy purple-gray stone ledge with small grass tufts and creeping ivy
```
6. Transition **50%** · Edge **Round** · Roundness **40** · Raggedness **35** (ค่า A-17) · Side Wall Thickness ค่าเดิม (10%) · Side Wall Placement ค่าเดิม (50%)
   Transition Description:
```text
tall cliff face of layered purple-gray rock with hanging ivy, moss and dark plum cracks, no crystals
```
7. Enhance **ติ๊ก** · **Medium detail** · **Medium shading** → Generate → **Wang**

### C · บ้านยามปากถ้ำ (Object Creator)
1. Mode **Pro** · 2. Directions **1 Direction**
3. Style Reference Images: อัป `ref192-1-style-kid.png` แล้ว Add another: `ref192-2-shape-hut.png`
   - ต้องขึ้น **2/… at this size** · **ถ้าใส่ได้รูปเดียว หรือบรรทัด Total บอกว่าได้ภาพเดียว → หยุด ถ่ายภาพหน้าจอส่งมาก่อน** (คู่มือยืนยันจำนวนช่องไว้แค่ขนาด 64/128/256)
4. Object Description:
```text
A small cozy guard hut at the edge of a Lanna-style fantasy village, seen from the front, low top-down RPG view, on a 192x192 canvas. Weathered dark brown timber plank walls on a low gray stone base, a muted dark brick-brown clay tile gable roof with gently curled Lanna eave tips, one wide open doorway 64 px wide and 100 px tall at x 64-127, y 92-191, exactly where the dark rectangle is in the second reference, kept clear and unobstructed, a small round window with a dim soft orange glow, a small unlit cloth lantern in muted colors hanging beside the door. Muted materials only: no bright golden-yellow, no honey or amber wood, no cyan or sky-blue accents, no bright red. Use the pixel style, outline and shading of the first reference but do not draw the girl. Copy the size, outline shape and door position of the second reference exactly and keep the whole hut inside the canvas. Front view only, no diagonal angle, no isometric view, no ground plane, no ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```
5. Describe each item **ปิด** · Color palette **None** · Max colours **No limit**
6. ดูบรรทัด Total → Generate Object → เลือกแบบที่ประตูกว้างและหน้าตรงที่สุด 1–3 แบบ → Save Individually
- สีเลี่ยงทอง/ไม้สีน้ำผึ้ง/อำพัน (ชนทอง `#FFC857` และบ้านดวงอาทิตย์) และเลี่ยงแดงอิฐสด (ชนบ้านเปลวไฟ) · โคมข้างประตูไม่จุดไฟ (ไม่ให้ดูเหมือนของที่แตะได้)

### D1 · สไลม์ ทิศใต้ (Object Creator · เลือกแบบก่อนทำ 8 ทิศ)
1. Mode **Pro** · 2. Directions **1 Direction**
3. Style Reference Images: `ref64-1-style-kid.png` แล้ว Add another: `ref64-2-shape-slime.png` (2/8 at this size)
4. Object Description:
```text
A round friendly slime creature for a children's adventure game, facing the camera, low top-down RPG view, on a 64x64 canvas with the body about 60 px tall and 60 px wide, the complete shape inside the canvas. A soft dome-shaped jelly body in muted lavender-mauve with a slightly darker bottom, a few soft gray dust-mist patches clinging to its top as if it forgot who it is, two big round dark eyes with one white highlight each, small determined eyebrows and a tiny pout, sturdy and bouncy but cute, not threatening. Dark plum outline. No bright yellow, sky blue, leaf green, red, gold or cyan anywhere. Use the pixel style, outline and shading of the first reference but do not draw the girl. Copy the size and silhouette of the second reference. No ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```
5. Describe each item **ปิด** · Color palette **None** · Max colours **No limit** → ดู Total → Generate → เลือก 1–3 แบบ
- **ก่อนรอบ 2 (D2 · 8 ทิศ):** ถ่ายภาพเมนู Directions ส่งมา · ยังไม่เคยยืนยันว่า Object Creator ทำ 8 ทิศได้ (ชุดตะเกียง 8 ทิศเคยยกเลิก G2.5 ข้อ 19) · Claude เขียนวิธีรอบ 2 จากหน้าจอจริง

**ส่งกลับ:** Wang PNG (A, B) · zip ของแต่ละชิ้นที่เลือก (C, D1) · ไม่ต้องเปลี่ยนชื่อ · บอกแค่ "รอบ 1 A–D1"

## 5b. รอบ 2 · วิธีกดและพรอมป์ (v1.2 · 30 ต.ค. 2569 · หลังผลรอบ 1)
**ฐานจากรอบ 1** (`qa/g2-4-scene/round1/README.md`): ไทล์ A B ใช้ได้ · สไลม์แบบ ค (54 px) · บ้านยาม 256 (ประตู 52×103) · ผัง v2 (บ้าน 8 ช่อง)
**บทเรียนที่ใช้ในรอบนี้**
- PixelLab วาดช่องเปิด (ประตู/ปากถ้ำ) สูงราว 40 % ของตัวชิ้น ไม่ทำตามตัวเลข → เกณฑ์ปากถ้ำ "กว้าง ≥ 51 (เด็ก + 4) · สูง ≥ 72 (ยอดช่องสูงกว่าหัวเด็กที่ยืนบนทางออก)" (เป้าในพรอมป์ 64×88) · ได้ไม่ถึง → **ไม่กดซ้ำ** Codex ขยายช่องด้วยมือตามสเปกฉบับ 2 · ช่องมืดออกมาใส → Codex เติมสีเงามืด
- Object Creator ใส่รูปอ้างอิงได้: 64 px = 8 รูป · 192 px = 1 รูป · 128 px = ยังไม่รู้ → **ดู "(n/N at this size)" ก่อนกด** · ได้ 1/1 → ใช้ Creator "Create image" Pro แทน (ภาพสไตล์ = รูปเด็ก · reference image 1 = รูปทรง · Custom size 128) ข้อความพรอมป์ใช้ได้ทั้ง 2 เครื่องมือ
- ทุกชิ้น: ลบข้อความตัวอย่างในช่องก่อนพิมพ์ · Color palette None · Max colours No limit · Auto-add Off · Creator: ปิด "Copy from style image: Color palette" · เปิด Remove background
- รูปอ้างอิงอยู่ใน `qa/g2-4-scene/round2/refs/` (`round1/tools/make_refs_r2.py`) · ใช้เครดิตรวมราว **51 generations** ถ้า Object Creator 128 ใส่รูปอ้างอิงได้ 2 รูป · ถ้าต้องใช้ทางสำรอง ต้นไม้ 2 แบบ = 20 · เสาไฟ = 10 → รวมราว 61 (ใช้ไปแล้ว 55 จาก 5,000)

### E · ปากถ้ำ 128 (Creator · Create image Pro · 10)
ภาพสไตล์ `ref128-1-style-kid.png` · reference image 1 `ref128-2-shape-cave.png` ("copy this exact outline and the dark entrance") · reference image 2 = `qa/g2-4-scene/round1/img/b-tileset-grass-cliff.png` ("use the rock colors and texture only") · Custom size 128×128
```text
A rocky outcrop with a dark cave entrance at the foot of a purple-gray cliff, for a cozy fantasy village at dusk, seen from the front, low top-down RPG view, on a 128x128 canvas. Layered purple-gray rock with moss, small grass tufts and hanging ivy, the same rock colors and texture as reference image 2. Follow the outline of reference image 1: the rock fills x 2-125 and y 6-127, and the dark arched entrance is 64 px wide at x 32-95, rising from y 124 up to y 40 with a 3 px rock lip below it, taller than the girl in the style image, solid very dark inside, kept clear and unobstructed. No crystals, no bright yellow, no gold, no cyan or sky-blue glow, no bright red. Use the pixel style, outline and shading of the style image but do not draw the girl. Keep the whole outcrop inside the canvas with a 2 px clear margin at the left, right and top. Front view only, no isometric view, no ground plane, no ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```

### F · ต้นไม้ 2 แบบ (Object Creator · Pro · 1 Direction · 128 · 10 · ได้ 4 แบบ เลือก 2)
รูปอ้างอิง `ref128-1-style-kid.png` + `ref128-2-shape-tree.png` (ต้องขึ้น 2/N · ได้ 1/1 → Create image Pro 1 ภาพต่อครั้ง)
```text
A village tree for a cozy fantasy village at dusk, seen from the front, low top-down RPG view, on a 128x128 canvas. A rounded leafy crown in muted blue-green and deep teal with a few darker leaf clusters, a short sturdy brown trunk with small visible roots, the trunk base centered at x 64 at y 124. Follow the size and outline of the flat silhouette reference: crown about 96 px wide, the whole tree about 120 px tall. No flowers, no fruit, no bright leaf green, no bright yellow, no gold, no cyan, no bright red. Use the pixel style, outline and shading of the reference with the girl but do not draw the girl. Keep the whole tree inside the canvas. Front view only, no ground plane, no ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```

### G · เสาไฟถนน (Object Creator · Pro · 1 Direction · 128 · 10 · ได้ 4 แบบ เลือก 1)
รูปอ้างอิง `ref128-1-style-kid.png` + `ref128-2-shape-lamp.png`
```text
A wooden village street lamp post for a cozy fantasy village at dusk, seen from the front, low top-down RPG view, on a 128x128 canvas. A thin dark brown wooden post about 8 px wide with a short arm at the top, a small paper lantern in muted orange hanging from the arm, unlit because the game adds the light, a small stone footing, the base centered at x 64 at y 124, the whole lamp about 97 px tall. Follow the size and outline of the flat silhouette reference. No glow, no light rays, no bright yellow, no gold, no cyan, no bright red. Use the pixel style, outline and shading of the reference with the girl but do not draw the girl. Front view only, no ground plane, no ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```

### H · ของเล็ก 32 (Object Creator · Pro · 1 Direction · 32 · Describe each item **เปิด** · 10)
รูปอ้างอิง `ref32-1-style-grass.png` + `ref32-2-style-stone.png` (สีและลายของไทล์รอบ 1)
คำบรรยายหลัก:
```text
Small props for a cozy fantasy village edge at dusk, one object centered in each 32x32 frame, seen from the front, low top-down RPG view, matching the colors and pixel style of the grass and stone references, muted dusk colors, no bright leaf green, no bright yellow, no gold, no bright red, no cyan except on the crystal shard, dark single-color outline, soft shading, light from the top-left, no ground shadow, transparent background, pixel art
```
ช่อง 1–16: `a small wooden crate with dark iron corners` · `a coiled hemp rope` · `a mossy gray-purple boulder` · `a short horizontal wooden fence segment` · `a single wooden fence post` · `a clump of tall grass` · `a tuft of short grass with clover` · `a few tiny white wildflowers on green stems` · `a small lavender wildflower clump` · `a small glowing pale sky-blue crystal shard stuck in the ground` · `a small wooden barrel` · `a small round dark green bush` · `a flat stepping stone` · `a small stack of firewood` · `a wooden bucket` · `two small brown mushrooms`
- เศษคริสตัล (ช่อง 10) = ของที่เก็บได้ จึงใช้ฟ้าเรืองได้ · ชิ้นอื่นห้ามใกล้ทอง/ฟ้าสัญญาณ

### I · ประตูรั้วหมู่บ้าน 64 (Object Creator · Pro · 1 Direction · 64 · 10 · ได้ 16 แบบ เลือก 1)
รูปอ้างอิง `ref64-1-style-kid.png` + `ref64-2-shape-gate.png`
```text
A closed wooden village gate between two sturdy posts, for a cozy fantasy village at dusk, seen from the front, low top-down RPG view, on a 64x64 canvas. Follow the size and outline of the flat silhouette reference: a post at each side and closed plank doors in the middle with a simple crossbar, muted brown wood with dark iron hinges. No bright yellow, no gold, no cyan, no bright red. Use the pixel style, outline and shading of the reference with the girl but do not draw the girl. Front view only, no ground plane, no ground shadow, isolated on a transparent background. pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```

### D2 · สไลม์ 8 ทิศ (Creator → Rotate → Generate 8 rotations · Single reference · 1 generation)
รูปอ้างอิง `qa/g2-4-scene/round1/img/d1-slime-c-tall.png` (64×64 ขนาดจริง) · Transparent background เปิด · Description:
```text
the same round lavender slime from the reference seen from 8 directions, same size and colors; the back views show only the smooth back of the jelly body with no eyes and no mouth
```
**เกณฑ์รับรอบ 2:** `ASSET_SPEC_10` ข้อ 7 · `ASSET_SPEC_11` ข้อ 6 · หยุดถามเจ้าของถ้าเครื่องมือบนหน้าจอไม่ตรงข้อนี้

## 6. สไลม์เดินอย่างไร (เจ้าของเลือกตอนอนุมัติ · ไม่ย่อขยายภาพในโค้ด)
- สไลม์ไม่มีขา ท่าเดินคือ**กระโดด** · ภาพจาก Object Creator ใส่ท่าใน PixelLab ต่อไม่ได้
- **ทาง ก (แนะนำตอนนี้):** เด้งขึ้นลง 0–3 px ทีละพิกเซลเต็ม + เงาใต้ตัวเล็ก/ใหญ่ตามความสูง · ไม่ย่อขยายภาพ · ไม่ใช้เครดิต · ใช้ได้ทั้ง 8 ทิศ
- **ทาง ข:** Codex วาดเฟรมบีบ-ยืดเป็นพิกเซลจริง (4 เฟรม × 8 ทิศ = 32 เฟรม) หลังได้ D2 · สวยกว่า ใช้เวลามากกว่า · ไม่ใช้เครดิต
- ~~บีบ-ยืดด้วยโค้ด~~ ตัดออก (ผิดกติกาห้ามย่อขยายแบบไม่เต็มเท่า · ผู้ตรวจอิสระ ข้อ 3)
- สี: ม่วงลาเวนเดอร์ = สีโซนถ้ำคริสตัล · ห่างสีบ้าน 4 สีและทอง/ฟ้าสัญญาณ (วัดจริงใน S3) · ฝุ่นเทา = สายเลือด LA ของมอน (`ART_DIRECTION.md` ข้อ 5)

## 7. เกณฑ์รับงาน (QG-4 · ตัวเลข)
| # | เกณฑ์ | ค่า |
|---|---|---|
| 1 | ผัง | ตรวจแบบผัง ✅ (ข้อ 3) · **ตรวจจริงในหน้า Pilot:** เดินจริงด้วยระบบชนของหน้า 60/60 คู่ · รันซ้ำเหมือน 100 % · ไปไม่ได้ 0/≥10 (รวมจุดหลังของ/ซอกแคบที่ช่องรอบตัวเดินได้) |
| 2 | ประตู | ช่องประตูในภาพ ≥ ตัวเด็ก + 4 px (กว้าง ≥ 51 · สูง ≥ 87 · บ้าน 256 = 52×103) · จับเท้า x 224 · เท้า y ≥ 264 ในช่อง D · เดินเข้าช่องประตูได้ 100 % (จัดตัวเข้ากลางช่องประตู) · ช่องประตูในภาพเป็นพื้นใสหรือแยกชั้นมืดด้านใน วาดหลังตัว · ไหล่/ผมทับขอบประตูนอกแผนบัง 0 px (วัด) |
| 3 | ภาพ | alpha 0/255 เท่านั้น · ไม่ย่อขยายแบบไม่เต็มเท่า · ไทล์ Wang 16 แบบต่อกันไม่มีรอย |
| 4 | ความลึก | y-sort ถูกรอบของทุกชิ้น 8 ทิศ · ของสูงจางเมื่อเดินหลัง (40–50 % ใน 0.2 วิ) |
| 5 | สี | ของประดับที่ ΔE00 < 10 จาก `#FFC857` / `#5FE0FF` / `#7FE0FF` = 0 px (ยกเว้นของที่เก็บได้ + วงแสงทางออก) · สไลม์ห่างสีบ้าน 4 สี ΔE00 ≥ 10 |
| 6 | มอน | สูง 50–83 px · 8 ทิศเป็นตัวเดียวกัน · เดิน 8 ทิศตามข้อ 6 · อยู่ในเขตไฟ 0 เฟรม · คำต้องห้ามในพรอมป์ 0 |
| 7 | คะแนน | ฉาก ≥ 7.5 · ของที่แตะได้และมอน ≥ 8 (`ART_GUIDE.md`) · เจ้าของให้ |
| 8 | ใช้งาน | FPS ≥ 90 % ของหน้าเดิม (วิธีเดียวกับ G11) · error 0 · ไฟล์ภาพหาย → วาดสำรองด้วยสีพื้นตามผัง ไม่จอขาว · ทุ่งมืด "หรี่ไม่ดำ" (ความสว่างพื้น ≥ 35 % ของหญ้าที่ไฟถึง · เห็นสไลม์) · ข้อความประตูรั้วไทย+อังกฤษ · มือถือ 844×390 และ iPad 1180×820 อ่านฉากออก · **ลีอาลองเล่น** |

## 8. ขั้นตอนและจุดหยุด (อนุมัติงานละครั้ง)
| ขั้น | ใคร | งาน | หยุดรอ |
|---|---|---|---|
| S1 | Codex | ตรวจพรอมป์และวิธีกดรอบ 1 (งาน T2 · อ่านอย่างเดียว) | — |
| S2 | เจ้าของ | **อนุมัติครั้งเดียว:** กดรอบ 1 · ใครกด · ทางเดินสไลม์ (ก/ข) | **เจ้าของ** |
| S3 | เจ้าของ หรือ Codex | กด PixelLab รอบ 1 ตามข้อ 5 · ส่งไฟล์ | — |
| S4 | Claude | วัดไฟล์จริง · ภาพเทียบกับตัวเด็ก · `ASSET_SPEC_10` (ฉาก) `ASSET_SPEC_11` (สไลม์) ด้วยตัวเลขจริง · พรอมป์รอบ 2 | เจ้าของดูภาพ + อนุมัติรอบ 2 (ครั้งเดียว) |
| S5 | เจ้าของ/Codex · Codex | กดรอบ 2 · Codex เก็บพิกเซลตามสเปก ส่ง `codex/asset-10-*` `codex/asset-11-*` | — |
| S6 | Claude | หน้า `pilot-g2-scene.html?gm` · ชุดทดสอบ QG-4 · ผู้ตรวจอิสระ · Codex ตรวจโค้ด | เจ้าของ + **ลีอาลองเล่น** → QG-4 |

## 9. ความเสี่ยง
- Object Creator ที่ 192 px อาจใส่รูปอ้างอิงได้รูปเดียว → หยุดถามก่อนกด (ข้อ 5 C) · ทางสำรอง: ใช้ขนาด 128 (บ้านเล็กลง 4 ช่อง) หรือ 256 (รูปเดียว)
- Object Creator อาจไม่มี 8 ทิศ → รอบ 2 เขียนจากหน้าจอจริง
- บ้านอาจออกมามุมเฉียง → วิธี 2 รูปอ้างอิง (ได้ผล 12/12 กับสะพาน 28 ก.ย.) · ยังเฉียง → รูปที่ 2 เป็นภาพหน้าตรงจากคอนเซปต์
- ตัวกว้าง 47 px ชนด้วยจุดเท้า → ไหล่ทับขอบประตู/หินได้ · ผังไม่มีช่องแคบ 1 ช่อง · ประตูจัดตัวเข้ากลาง · วัดในหน้า Pilot (ไม่เปลี่ยน `T`)
- ไทล์ใหม่สีไม่เข้ากับตัวละคร → ดูภาพเทียบใน S4 ก่อนกดรอบ 2

## 10. เรื่องที่เจ้าของตัดสิน (S2 · ครั้งเดียว)
1. อนุมัติกดรอบ 1 (4 ชิ้น A B C D1)
2. ใครกด: เจ้าของกดเองตามข้อ 5 · หรือ Codex (ถ้าต่อ PixelLab ได้ · งาน T2 ถามแล้ว)
3. ทางเดินสไลม์: ก (เด้ง 0–3 px · แนะนำ) หรือ ข (Codex วาดเฟรม)

**ผล (เจ้าของ 30 ต.ค. ~18:4x):**
- ใครกด: **"คุณสั่ง pixellab เองเลย"** → **Claude กดเอง** ผ่านเบราว์เซอร์ในแอป Claude บนคอมของเจ้าของ (บัญชี PixelLab ของเจ้าของ) · กดหลัง Codex ตรวจพรอมป์ (T2) ตามที่ถามไว้ · Claude ไม่ใส่รหัสผ่าน → **เจ้าของต้องล็อกอิน PixelLab ในเบราว์เซอร์นั้นเองก่อน** (ตรวจ 30 ต.ค.: ยังไม่ได้ล็อกอิน)
- สไลม์เดิน: **ทาง ก** (เด้ง 0–3 px ทีละพิกเซลเต็ม · เงาตามความสูง · ไม่ย่อขยาย)
- รอบ 1 (A B C D1) = อนุมัติแล้ว เมื่อ Codex ตรวจผ่าน

**ผลรอบ 1 และมติเจ้าของ (30 ต.ค. 22:3x–23:48):**
- C ที่ 192 ใส่รูปอ้างอิงได้ 1/1 → หยุดตามกติกา → เจ้าของเลือก **Creator + Style image** → ประตู 36×69 → เจ้าของเลือก **กดใหม่เน้นผนังสูง** → ประตู 40×70 → เจ้าของเลือก **บ้าน 256** → ประตู 52×103 ✅
- สไลม์: เจ้าของเลือก **แบบ ค** (54 px)
- 23:48 "ok ต่อ" = รับ **บ้านยาม 256** + เกณฑ์ประตู **≥ ตัวเด็ก + 4 px** (แทน ≥ 64) และ **วงแสงตะเกียงในถ้ำ 130** (หน้า Pilot GM)
- เจ้าของลองหน้า Pilot แล้ว 23:26: "ตะเกียงมองเห็นได้แคบไป" → ปุ่มวงแสง 72/100/130/160 → ค่าเริ่ม 130
