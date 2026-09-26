# คู่มือใช้ PixelLab สำหรับ Leah-PP

ฉบับ 26 ก.ย. 2569 · เขียนจากหน้าจอจริงที่เจ้าของใช้ (มือถือ Android · Chrome · Tier 1)
อ่านคู่กับ `ART_GUIDE.md` (แนวภาพ จานสี คำท้ายพรอมป์) · **อัปเดตไฟล์นี้ทุกครั้งที่เจอหน้าจอใหม่ และส่งต่อทุกครั้งที่ย้ายแชท**

---

## กติกาการทำงานกับเจ้าของ
- พรอมป์ที่ดีที่สุด **อันเดียวต่อชิ้น** (เสียเครดิต) · ก๊อปวางได้ทันที
- บอก **ครบทุกช่องตามลำดับบนหน้าจอ** รวมช่องที่ปล่อยค่าเดิม
- ถ้ามีรูปอ้างอิง **แนบไฟล์มาในข้อความเดียวกันทุกครั้ง** แม้เคยส่งแล้ว
- ก่อนกด Generate ให้ดูเลขเครดิต ถ้าเกิน 40 ต่อชิ้นต้องบอกก่อน
- ถ้าหน้าจอไม่ตรงกับคู่มือ ให้ขอภาพหน้าจอก่อนกด แล้วแก้คู่มือนี้

## เครดิต (Tier 1 ราว 2,000 generations ต่อเดือน)
| งาน | ใช้ |
|---|---|
| ไทล์ Standard | 3–4 |
| Object Creator แบบ Pro 64px | 20 ต่อครั้ง (ได้ 16 ภาพ ตาราง 4×4) |
| ท่าเดิน 1 ทิศ (ตัวละครเดิม) | ราว 1 |

---

## 1. Map Workshop → Tilesets (ทำไทล์พื้น/ผนัง)
เข้าจาก https://pixellab.ai/select-interface → Map Workshop → New Tileset

หน้าจอเรียงจากบนลงล่าง
1. แท็บ **Standard** | Pro → ใช้ Standard
2. **Tile Size** 16×16 · 24×24 (BETA) · **32×32** ← เกมเราใช้ 32
3. **Map orientation** **Top-down** | Sidescroller
4. **Lower Terrain** มีป้าย "CREATING NEW TERRAIN" กับปุ่ม ✕ Cancel (กด Cancel = เลือกพื้นที่เคยทำไว้) · ช่องข้อความ · ช่องติ๊ก **Walkable**
5. **Upper Terrain** เหมือนข้อ 4
6. **Transition & Shape** มีภาพตัวอย่างสีส้ม
   - **Transition Size** 0% = ต่อกันตรง ๆ แบบเรียบ · มากขึ้น = มีแถบรอยต่อ มักเป็นขอบสูงต่ำ (หน้าผา)
   - **Edge shape** Square (เหลี่ยม) | Round (โค้ง)
   - **Roundness** 0 เหลี่ยม – 100 มน
   - **Raggedness** 0 เส้นตรง – 100 หยัก · มีปุ่ม **Reshuffle (#n)** = สุ่มรูปขอบใหม่ (ไม่ต้องกด)
   - **Side Wall Thickness** (default 10%) · **Side Wall Placement** (default 50%) — **โผล่เฉพาะตอน Transition มากกว่า 0%**
   - **Transition Description** — **โผล่เฉพาะตอน Transition มากกว่า 0%**
7. **Enhance descriptions with AI** (ติ๊ก) + เมนู detail (Medium detail) + เมนู shading (Medium shading)
8. ปุ่ม **Generate**

หน้ารายการไทล์: แท็บตามขนาด (16×16 / 24×24 / 32×32 / 64×64) · แตะไทล์ → กล่อง **Download tileset** มี 15-tileset | **Wang** | Godot (3×3) → เราใช้ **Wang**
ไฟล์ Wang ที่ได้: PNG 160×128 (ถ้ากดดาวน์โหลดหลายชุดติดกัน อาจมาใน zip เดียวกัน · ชื่อไฟล์ขึ้นต้นด้วยคำบรรยายที่ AI เขียนใหม่) (ไทล์ 32px 5×4 ช่อง = 16 แบบ + พื้นสำรอง 1) ส่งมาเป็น zip ไม่มี .json · โค้ดอ่านมุมของแต่ละไทล์เองได้

**ค่าที่ใช้แล้วได้ผลดี**
| งาน | Transition | Edge | Roundness | Raggedness |
|---|---|---|---|---|
| พื้นถ้ำ + ผนังหิน (A-04) | 50% | Square | 15% | 15% |
| ทางดิน + หญ้า เรียบ (A-07) | 0% | Round | 60% | 25% |
| หญ้า + พุ่มไม้ (A-08) | 50% | Square | 30% | 20% |

## 2. Object Creator (Create Object · ของ/อาคาร/ต้นไม้)
หน้าจอเรียงจากบนลงล่าง
1. **Mode** **Pro** | Pro Flash (BETA · Fast & Cheap) → ใช้ Pro
2. **Directions** เมนู · ใช้ **1 Direction**
3. **Style Reference Images** ปุ่มอัปโหลด ⬆ และถังขยะ 🗑 มุมขวา · "Pick from gallery" / "Add another from gallery" · ตัวเลข **(n/N at this size)** บอกจำนวนรูปที่ใส่ได้ (64px ใส่ได้ 8)
   - ⚠️ **ขนาดภาพที่ได้ = ขนาดรูปอ้างอิง** · ใส่รูปกว้าง 256px → เครื่องเปลี่ยนเป็น 256px ได้ 1 ภาพ และช่อง Size กับ View หายไป
   - จึงต้องใช้รูปอ้างอิง **ขนาดเท่าที่ต้องการ**: ของ 64px ใช้ `ref64-*.png` (64×64) · ของ 32px ใช้รูป 32×32
   - มุมมองก็ตามรูปอ้างอิง (ตัวละครเราเป็น Low top-down อยู่แล้ว)
4. **Size** แถบเลื่อน 16–256px (หายไปเมื่อใส่รูปอ้างอิง)
5. **View** เมนู (ค่าเริ่ม Top-Down · หายไปเมื่อใส่รูปอ้างอิง)
6. **Object Description** ช่องข้อความหลัก
7. **Describe each item (16)** กดเปิด = ใส่ของคนละอย่างต่อช่อง (ทำเป็นชุด/Pack) · ไม่เปิด = ได้ของชิ้นเดียวกัน 16 แบบให้เลือก
   - ใต้ช่องสุดท้ายมีข้อความ "Leave blank to let AI choose. Unfilled slots use the general description." = ช่องที่เว้นว่าง เครื่องคิดของเองจากข้อความหลัก (ได้ของแปลกใหม่มาให้เลือก)
   - ⚠️ ของที่มีตัวหนังสือ (ป้าย) มักสะกดเพี้ยน อย่าเลือกมาใช้
8. บรรทัดสีเขียว เช่น **"Total: 20 generations for 16 frames at 64px (4×4 grid)"** → เช็กทุกครั้งก่อนกด
9. ปุ่ม **Generate Object**

**หน้าผล "Review Generated Frames"** (โผล่หลังกด Generate)
- ขนาดภาพกำหนดจำนวนภาพ: 32px ได้ 64 ภาพ (8×8) · 64px ได้ 16 ภาพ (4×4) · 128px ได้ 4 ภาพ (2×2) · ใช้ 20 generations เท่ากัน
- ถ้าสั่งหลายงานต่อกัน ด้านบนหน้าผลมีแถบชื่องาน (Click to review frames) ให้กดสลับดูแต่ละงาน
- ภาพทั้งหมดในตาราง 4×4 · บรรทัด "0 of 16 selected" · ปุ่ม **Select All** / **Clear** มุมขวา
- แตะภาพเพื่อเลือก (นับเบอร์ 1–16 จากซ้ายไปขวา บนลงล่าง)
- ปุ่มล่าง: **Dismiss Remaining** (ทิ้งภาพที่ไม่เลือก) · **Save Individually** (เก็บภาพที่เลือกแยกเป็นชิ้น ๆ) · **Save with Tag** (เก็บรวมใต้ป้ายชื่อเดียว)
- ของชิ้นเดียวหลายแบบ (เช่น น้ำพุ): เลือกเบอร์ที่ Claude บอก → Save Individually
- ดาวน์โหลด: เปิดของแต่ละชิ้นในรายการ → ได้ zip ต่อชิ้น (รวมหลาย zip เป็น zip เดียวแล้วส่งมาได้) ข้างในมี `metadata.json` + `ชื่อของ/rotations/ชื่อของ.png` (64×64) ส่งมาทั้ง zip ได้เลย

รูปอ้างอิงที่มีแล้ว: `ref64-nuan.png` `ref64-leah.png` `ref64-princess.png` `ref64-wizard.png` (64×64 · ใช้กับของ 64px) · `ref32-grass.png` `ref32-path.png` (32×32 จากไทล์ A-07 · ใช้กับของหมู่บ้าน 32px) · `ref128-family.png` (128×128 ตัวละคร 4 ตัว 2×2 · ใช้กับอาคาร 128px) · `ref32-cavefloor.png` `ref32-cavewall.png` (32×32 จากไทล์ถ้ำ · ของในถ้ำ 32px) · `ref64-peb.png` `ref64-cave.png` (64×64 · ของในถ้ำ 64px)
- เคล็ดลับ: อยากได้ภาพใหญ่แต่รักษาความละเอียดพิกเซลเดิม ให้เอารูปขนาดปกติหลายรูปมาเรียงเป็นตาราง (เช่น 64px 4 รูป = 128px) ไม่ใช่ขยายรูป · `ref-A05-style.png` (192×128 ใช้กับของในถ้ำ — ⚠️ ต้องทำใหม่เป็น 32×32 ก่อนใช้ตามข้อ 3)

## 3. Characters (ตัวละครและท่าทาง)

### หน้าสร้างตัวละคร (Create Character) · เห็นจริง 26 ก.ย. 2569
แท็บบนสุด: **Create from Text** | Create from Reference

**Create from Text** เรียงจากบนลงล่าง
1. **Character Type:** **Humanoid** | Quadruped (EXPERIMENTAL)
2. **Generation Mode:** **v3** (NEW) | Pro (NEW) | Standard — ช่องด้านล่างเปลี่ยนตามโหมด
3. **Character Description** (REQUIRED สูงสุด 2000 ตัวอักษร) · มีปุ่ม ✨ มุมขวาล่างของช่อง = ให้ AI เขียนคำบรรยายเพิ่ม (ไม่ต้องกด)
4. **Camera View:** Sidescroller | **Low Top-Down** | High Top-Down | Oblique (ใช้ไม่ได้)
5. **Sprite Size** (โหมด v3): ปุ่ม 32 · 48 · 56 · **64** · 80 · 96 · 128 + แถบ Width/Height · ⚠️ **ค่าเริ่มต้นคือ 48 ต้องกด 64px ทุกครั้ง**
6. **Detail:** **Highly detailed** · **Outline:** Default
7. บรรทัด "Costs 2 generations." → ปุ่ม **Generate v3 Character**

โหมดอื่นในหน้าเดียวกัน
- **Pro** (20 generations ต่อตัว 8 ทิศ): Mode Pro | Pro Flash · Character Size · Reference images (ได้ถึง 4 รูป) · **Style Character → "Choose from my characters"** (ใช้ตัวละครที่มีแล้ว เช่น ลีอา เป็นแบบสไตล์) · Style image
- **Pro Flash** (8 generations ต่อตัว): Sprite Size 16–256 · Style Character / Style image ได้เหมือนกัน
- **Standard:** ปรับสัดส่วนตัวได้ (หัว แขน ขา ไหล่ สะโพก) มี Quick Presets: Default · **Chibi** · Cartoon · Stylized · Realistic · Heroic

**Create from Reference:** อัปภาพตัวละครหันหน้า (ทิศใต้) ท่ายืน → ให้เครื่องหมุนครบ 8 ทิศ (v3 = Generate v3 Rotation · Pro = Rotate Character หรือ Create with Style/Concept 20 generations · Standard อัปรูปทีละทิศได้ 8 ช่อง)

**ที่ใช้กับเกมเรา:** ตัวละครใหม่ใช้ **v3 · Low Top-Down · 64px · Highly detailed** (แบบเดียวกับลีอา ถูกสุด 2 generations) · ถ้าได้สไตล์ไม่เข้ากับลีอา ค่อยเจนใหม่ด้วย **Pro Flash + Style Character = ลีอา** (8 generations)

เข้า https://www.pixellab.ai/create-character
- ตัวละครที่มีแล้ว: ลีอา · พ่อมด · เจ้าหญิง · Peb · ยายนวล (ค่าที่ใช้สร้างอยู่ใน `ART_GUIDE.md`)
- ท่าเดิน: เปิดตัวละคร → **Add Animation** → **Walking (6 frames)** → แต่ละทิศมีปุ่ม 🚀 (สร้างทันที) และ ⚙️ (ตั้งค่า) → กด 🚀 เฉพาะ South · North · East · South-East · North-West (โค้ดกลับด้านให้ครบ 8 ทิศ)
- ดาวน์โหลด: ปุ่มบนการ์ด **Idle** → zip (มีท่ายืน + ท่าเดิน) ส่งมาทั้ง zip ไม่ต้องแตก

## 4. ส่งไฟล์กลับให้ Claude
- ไม่ต้องเปลี่ยนชื่อไฟล์บนมือถือ บอกแค่เลขงาน (A-xx)
- ไทล์: zip/PNG แบบ Wang · ของ: zip หรือภาพหน้าจอหน้าผล (Claude บอกเบอร์ที่เก็บ) · ตัวละคร: zip จากการ์ด Idle

## 5. บทเรียนที่เจอแล้ว (อัปเดต 26 ก.ย. 2569)
- **รูปอ้างอิงที่เป็นลายเต็มกรอบ** (เช่น ไทล์ผนังหินเต็ม 128×128) ทำให้ของที่ได้มีพื้นหลังผนังติดมาด้วย → ของชิ้นเดี่ยวควรใช้รูปอ้างอิงที่ **พื้นหลังโปร่งใส** (เช่น ตัวละคร หรือของที่เจนแล้ว)
- **ไทล์ที่ต่อกับหญ้าหมู่บ้าน** ให้กด ✕ Cancel ที่ช่อง Lower/Upper Terrain แล้ว **เลือกหญ้าเดิม (A-07)** สีจะตรงกันเป๊ะ (ไทล์น้ำ A-18 ทำแบบนี้แล้วตรง) · ถ้าพิมพ์ข้อความใหม่ สีหญ้าจะเพี้ยน (หน้าผา A-17 ต้องแก้สีด้วยโค้ดทีหลัง)
- ของที่มีป้าย/ตัวหนังสือ มักสะกดเพี้ยน หรือออกมาเป็นตัวอักษรแปลก ๆ (ศิลาแสงบางแบบมีตัวอักษรจีน) → ไม่เลือก

**ค่าที่ใช้แล้วได้ผลดี (เพิ่ม)**
| งาน | Transition | Edge | Roundness | Raggedness |
|---|---|---|---|---|
| หญ้า + หน้าผาหินม่วงเทา (A-17) | 50% | Round | 40% | 35% |
| น้ำ + หญ้า ฝั่งทราย (A-18) | 30% | Round | 60% | 30% |
