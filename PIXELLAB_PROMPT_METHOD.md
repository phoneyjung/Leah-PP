# วิธี "LA-PIX 7" · คู่มือเขียนพรอมป์และส่งงาน PixelLab · Lantern Academy
ฉบับ 1 ต.ค. 2569 · ใช้คู่กับ `PIXELLAB_GUIDE.md` (หน้าจอจริงทุกช่อง) · **แชทไหนจะส่งงาน PixelLab ต้องอ่านไฟล์นี้ก่อน**

---
## 1. หลัก 5 ข้อ (ห้ามข้าม)
1. **พรอมป์ที่ดีที่สุดอันเดียวต่อชิ้น** เสียเครดิต ห้ามส่งหลายตัวเลือกให้ลองเอง
2. **บอกครบทุกช่องตามลำดับบนจอ** รวมช่องที่ "ปล่อยค่าเดิม" และช่องที่ต้อง "กดล้าง"
3. **ลิงก์ตรงหน้าที่ใช้:** ตัวละคร/มอนสเตอร์ → https://www.pixellab.ai/create-character · ของ/อาคาร → https://www.pixellab.ai · ไทล์/แผนที่ → https://pixellab.ai/select-interface (Map Workshop)
4. **รูปอ้างอิงแนบทุกครั้ง** แม้เคยส่งแล้ว · **1 พรอมป์ = 1 zip** ที่มีเฉพาะรูปที่ต้องแนบ ตั้งชื่อเรียงลำดับ (`1-style.png` `2-camera.png`) เปิดแล้วลากใส่ได้เลย
5. **บอกเครดิตก่อนกด** เกิน 40 ต่อชิ้นต้องถามก่อน

---
## 2. สูตรพรอมป์ 7 ส่วน (เขียนเรียงตามนี้ทุกครั้ง)
| # | ส่วน | เขียนอะไร | ตัวอย่างวลี |
|---|---|---|---|
| 1 | **WHAT** สิ่งที่ทำ + หน้าที่ในเกม | ของชิ้นเดียว เป็นอะไร ใช้ที่ไหน | `A small wooden farm shed for a cozy fantasy farm game` |
| 2 | **LOOK** รูปร่าง วัสดุ สี | ลักษณะเด่น 2–4 อย่าง · สี 60-30-10 (ตัวตน / ม่วงพลบค่ำ / ทองจุดแตะได้) | `teak walls, terracotta roof, one warm gold lantern by the door` |
| 3 | **STYLE** อ้างอิงสไตล์ | บอกว่ารูปไหนคือสไตล์ | `Use the pixel style and colours of the first reference exactly` |
| 4 | **CAMERA** มุมกล้อง | มุมบนเอียงนิด หน้าตรง ห้ามเฉียง | `copy the straight top-down three-quarter camera angle of the second reference. No diagonal angle, no isometric view` |
| 5 | **FRAME** กรอบภาพ | ชิ้นเดียว กลางภาพ ครบทั้งชิ้น ฐานชิดล่าง พื้นหลังใส | `one object, centred, fully visible, base at the bottom edge, isolated on a transparent background, no ground tile, no square shadow` |
| 6 | **MOOD** อารมณ์ | เป็นมิตร น่ารัก ไม่น่ากลัว แสงอุ่น | `cute and friendly, not scary, warm early-evening light, soft violet shadows` |
| 7 | **NOT** สิ่งที่ห้าม | ตัวหนังสือ คน ของเกิน | `no text, no letters, no people, no extra objects` |

**คำห้ามใช้เด็ดขาด:** scary · evil · demonic · blood (ศัตรูใช้ "strong, tough, fierce-looking but friendly for kids")
**ตัวละครผู้เล่น:** ต้องมี 3 สีกุญแจในส่วน LOOK: ผม `bright lime green` · ตา `bright cyan eyes with white highlights` · ผ้าคลุม `short solid royal purple cape` · ห้ามสีชุดใกล้สีกุญแจ (เขียวมะนาว ฟ้าอมเขียว ม่วง)

---
## 3. แบบฟอร์มส่งงาน (ใช้ทุกครั้ง เรียงตามนี้)
```
## [ชื่องาน] · PixelLab [ชื่อเครื่องมือ] · [เครดิต] generations
เข้า 👉 [ลิงก์ตรง]
แนบ: [ชื่อ zip] (ข้างในมี 1-xxx.png, 2-xxx.png) ← ส่งไฟล์มาในข้อความเดียวกัน
| ลำดับบนจอ | ช่อง | ตั้งค่า |
| 1 | ... | ... |
(ทุกช่อง รวม "ปล่อยค่าเดิม" และ "กด 🗑 ล้าง")
พรอมป์ (กล่องก๊อป 1 กล่อง)
Describe each item (ถ้าใช้): กล่องก๊อปแยกทีละบรรทัด
เช็กก่อนกด: บรรทัดสีเขียวต้องขึ้น "..."
หลังได้ผล: เลือก → Save Individually → ดาวน์โหลด zip → ส่งมาทั้ง zip + บอกเบอร์ที่ชอบ
เกณฑ์ผ่าน: [คะแนนตามชนิด]
```

---
## 4. เลือกเครื่องมือ/โหมดให้ถูก
| ของที่ต้องการ | ใช้ | ค่าหลัก | เครดิต |
|---|---|---|---|
| ตัวละครเด็ก/NPC | Create Character · **v3** | Low Top-Down · **64** · Highly detailed | 2 |
| ตัวละครผู้ใหญ่ / ต้องเหมือนสไตล์ลีอา | Create Character · **Pro Flash** + Style Character | 84px (80 แล้วเลื่อน 1 ขั้น) · เอาติ๊ก Color palette ออก | 6–8 |
| ท่าเดิน | Add Animation · **Skeleton v3** → Walking (6 frames) | ปล่อย Motion ค่าเดิม · กด 🚀 ให้ครบ 8 ทิศ | ~1/ทิศ |
| ของชุดหลายแบบ | Object Creator · Pro · 1 Direction · **Describe each item เปิด** | รูปอ้างอิง 64px ได้ 16 ภาพ | 20 |
| ของชิ้นเดียว/อาคาร | Object Creator · Pro · 1 Direction · Describe ปิด | รูปอ้างอิงขนาดที่อยากได้ (128 → 4 ภาพ · 256 → 1 ภาพ) | 20 |
| สะพาน บันได ท่าเรือ (ต่อกับพื้น) | Object Creator · **รูปอ้างอิง 2 รูปขนาดเท่ากัน** (สไตล์ + มุมกล้อง) | ทำทีละชิ้น | 20 |
| พื้น/ผนัง/น้ำ | Map Workshop · Tilesets · Standard | 32×32 · Top-down · Wang | 3–4 |

**กฎขนาด:** ภาพที่ได้ = ขนาดรูปอ้างอิง · ห้ามปนรูปต่างขนาดในงานเดียว · อยากได้ใหญ่แต่พิกเซลเท่าเดิม → เรียงรูปเล็กเป็นตาราง ไม่ขยายรูป · ของที่จะวางบนภาพวาดฉาก ตัดรูปอ้างอิงจากภาพวาดที่ขนาดพิกเซลจริง (เกมขยาย 2 เท่าเอง)

---
## 5. ตัวอย่างเต็ม 4 แบบ

### ตัวอย่าง A · ของชุด 16 แบบ (พุ่มไม้ หิน ตอไม้ ถางได้)
**Object Creator · 20 generations** · 👉 https://www.pixellab.ai · แนบ `wild-refs.zip` (`1-stump.png` `2-rock.png` `3-bush.png` ขนาด 64×64 ตัดจากภาพคอนเซปต์ฟาร์ม)
| ลำดับ | ช่อง | ตั้งค่า |
|---|---|---|
| 1 | Mode | Pro |
| 2 | Directions | 1 Direction |
| 3 | Style Reference Images | กด 🗑 ล้าง → อัป 3 รูป (ขึ้น 3/8 at this size) |
| 4–5 | Size · View | หายไปเอง (ปกติ) |
| 6 | Object Description | วางพรอมป์ |
| 7 | Describe each item (16) | **เปิด** ใส่ทีละช่อง |
| 8 | บรรทัดเขียว | `Total: 20 generations for 16 frames at 64px (4×4 grid)` |
```
Small wild-land obstacles for a farm in a cozy fantasy village, in exactly the pixel style, colours and top-down three-quarter camera angle of the reference images. One object per image, centred, fully visible, standing on the ground with its base at the bottom, isolated on a transparent background. No grass tile under it, no square shadow, no text. Warm early-evening light with soft violet shadows. Cute and friendly, not scary.
```
Describe each item (ก๊อปทีละบรรทัด): `a round overgrown green bush` · `a mossy grey-lilac boulder` · `an old tree stump with roots` · … (ครบ 16)

### ตัวอย่าง B · อาคารหน้าตรงชิ้นเดียว (บ้านฟาร์ม ชั้นเดียว)
**Object Creator · 20 generations · ได้ 1 ภาพ 256px** · 👉 https://www.pixellab.ai · แนบ `house1-refs.zip` (`1-farmhouse-256.png`)
| ลำดับ | ช่อง | ตั้งค่า |
|---|---|---|
| 1 | Mode | Pro |
| 2 | Directions | 1 Direction |
| 3 | Style Reference Images | 🗑 ล้าง → อัป 1 รูป (1/1 at this size) |
| 6 | Object Description | วางพรอมป์ |
| 7 | Describe each item | **ปิด (ว่าง)** |
```
The same wooden farmhouse as the reference, one storey: terracotta tiled roof with curled gable ends, teak walls, warm glowing windows, a front door facing the viewer with two small stone steps and flower pots. Copy the pixel style and the straight top-down three-quarter camera angle of the reference exactly. Only the house: no yard, no fence, no road, no lamp posts, no people. Isolated on a transparent background with the base of the house at the bottom edge. No diagonal angle, no isometric view. No text.
```

### ตัวอย่าง C · ตัวละคร NPC/ผู้ช่วย (หุ่นยนต์ช่วยสวน)
**Create Character · v3 · 2 generations** · 👉 https://www.pixellab.ai/create-character · ไม่มีรูปแนบ
| ลำดับ | ช่อง | ตั้งค่า |
|---|---|---|
| 0 | แท็บ | Create from Text |
| 1 | Character Type | Humanoid |
| 2 | Generation Mode | v3 |
| 3 | Character Description | วางพรอมป์ (ไม่กด ✨) |
| 4 | Camera View | Low Top-Down |
| 5 | Sprite Size | **กด 64** (ค่าเดิม 48) |
| 6 | Detail · Outline | Highly detailed · Default |
| 7 | บรรทัด | `Costs 2 generations.` → Generate v3 Character |
```
A small cute friendly garden helper robot for a cozy fantasy farm game, about the height of a child. Round soft-edged body in pale lilac-grey metal with warm teak-brown wooden panels, a round head with a dark visor showing two warm cream glowing dot eyes and a happy smile, a small antenna with a warm golden bulb, short arms with one hand holding a tiny green watering can, short stubby legs, a small green leaf emblem on the chest. Gentle and toy-like, not scary, no weapons.
```
หลังได้ผล: การ์ด **Idle** → ดาวน์โหลด zip → ส่งมาทั้ง zip · ถ้าสไตล์ไม่เข้ากับลีอา → ทำใหม่ Pro Flash + Style Character = ลีอา

### ตัวอย่าง D · ไทล์พื้น (ทางดิน + หญ้า)
**Map Workshop · Tilesets · Standard · 3–4 generations** · 👉 https://pixellab.ai/select-interface → Map Workshop → New Tileset
| ลำดับ | ช่อง | ตั้งค่า |
|---|---|---|
| 1 | แท็บ | Standard |
| 2 | Tile Size | 32×32 |
| 3 | Map orientation | Top-down |
| 4 | Lower Terrain | ✕ Cancel → เลือกหญ้าเดิม (A-07) · ติ๊ก Walkable |
| 5 | Upper Terrain | พิมพ์ `warm packed earth path with small pebbles` · ติ๊ก Walkable |
| 6 | Transition · Edge · Roundness · Raggedness | 0% · Round · 60% · 25% |
| 7 | Enhance descriptions with AI | ติ๊ก · Medium detail · Medium shading |
ดาวน์โหลด: แตะไทล์ → Download tileset → **Wang** → ส่ง PNG/zip

---
## 6. ตรวจผลที่ได้ (ก่อนใส่เกมทุกครั้ง)
- **เกณฑ์ผ่าน:** จุดขายความสวย (หมวก หน้า ปาก) ≥9.5 · ชุด/อุปกรณ์ ≥8.5 · ของที่แตะได้ ≥8 · ฉากประกอบ ≥7.5 · ฉากหลังไกล ≥7
- ดูที่ขนาดจริง · มุมกล้องตรงไหม (ไม่เฉียง) · พื้นหลังใสจริงไหม · ฐานชิดล่างไหม · สีเข้าจานสี LA ไหม (วัด 60-30-10) · มีตัวหนังสือเพี้ยนไหม (มี = ไม่เลือก) · ขนาดเทียบลีอาถูกไหม
- วิจารณ์เป็น: **คะแนนรวม + รายส่วน + วิธีแก้ + ใช้เครื่องมือไหนแก้**

## 7. ความผิดพลาดที่เจอแล้ว
| อาการ | สาเหตุ | แก้ |
|---|---|---|
| ภาพที่ได้ขนาดผิด / ช่อง Size หาย | ขนาดตามรูปอ้างอิง | ใช้รูปอ้างอิงขนาดที่อยากได้ |
| สะพาน บันได ออกมาเฉียง | ของที่ต่อกับพื้น | รูปอ้างอิง 2 รูป (สไตล์ + มุมกล้อง) ทำทีละชิ้น |
| ของมีพื้นผนังติดมา | รูปอ้างอิงเป็นลายเต็มกรอบ | ใช้รูปอ้างอิงพื้นหลังใส |
| สีหญ้าไทล์ไม่ตรงเดิม | พิมพ์ข้อความใหม่ | ✕ Cancel แล้วเลือกพื้นเดิม |
| ผ้าคลุม/ผิวสีตามรูปสไตล์ | ติ๊ก Color palette ไว้ | เอาติ๊กออก |
| ขึ้นกรอบเหลือง Generate กดไม่ได้ | รูปสไตล์ใหญ่กว่าตัวละคร | ขนาดตัวละคร ≥ รูปสไตล์ |
| "Character not found" | เว็บดึงข้อมูลไม่ได้ | อย่ากดซ้ำ ดูรายการก่อน F5 รอ |
| ป้ายสะกดเพี้ยน/อักษรแปลก | AI เขียนตัวหนังสือไม่ได้ | ใส่ "no text" · ไม่เลือกภาพนั้น |
| เจ้าของต้องไล่หาไฟล์แนบ | ส่งรูปแยกหลายที่ | 1 พรอมป์ = 1 zip เฉพาะรูปที่แนบ |
