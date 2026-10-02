# PIXELLAB_GUIDE · ภาคผนวก 1 ต.ค. 2569 (หน้าจอใหม่ที่เจ้าของส่งมา)

อ่านคู่กับ `PIXELLAB_GUIDE.md` ข้อ 3 (Characters) · หน้าจอนี้ **มาแทน** ส่วน "Character Type" เดิม

## Create Character → Character Type มี 3 แบบแล้ว
เข้า https://www.pixellab.ai/create-character → แท็บ **Create from Text**

| แบบ | ป้าย | ใช้กับ | โครงกระดูก/ท่า |
|---|---|---|---|
| **Humanoid** | – | คน หุ่นยนต์ มอนสองขา (เช่น บอสโกเลม) | มีโครงคน · ท่าเดินจาก Skeleton v3 |
| **Quadruped** | EXPERIMENTAL | สัตว์สี่ขา | มีช่องใหม่ **Quadruped model** (เมนู เช่น Bear) = ใช้โครง สัดส่วน และท่าเดินของสัตว์แบบนั้น แล้วบรรยายเป็นสัตว์อะไรก็ได้ · โหมด v3 ใช้ไม่ได้ (เทา) |
| **Custom** | BETA | **ทุกอย่างที่ไม่ใช่สองข้อบน**: สไลม์ ค้างคาว ผี ก้อนหิน ของที่มีชีวิต | ไม่มีโครงสำเร็จรูป · ทำท่าด้วย **V3 moves (walk, run, sprint, idle)** หรือพิมพ์บรรยายท่าเอง |

## Custom · ช่องเรียงจากบนลงล่าง
1. **Character Type:** Custom
2. **Generation Mode:** v3 (NEW) | **Pro (RECOMMENDED)** | Standard (กดไม่ได้)
   - ข้อความส้มเตือน: *Pro is recommended for custom characters — v3 assumes a standing, full-body subject and tends to add limbs.* → **มอนไม่มีขาให้ใช้ Pro เสมอ** (v3 จะงอกแขนขาให้)
3. (เมื่อเลือก Pro) **Mode:** **Pro** | Pro Flash (BETA · Fast & Cheap) · ข้อความ "AI-powered generation (168×168 max) with reference & concept images"
4. **Character Description** (REQUIRED · 2000 ตัวอักษร) · "This base character will be used for all rotations."
5. **Character Size:** ปุ่ม 32 · 48 · 56 · 64 · 80 · 96 · 128 · 168 + แถบ **Custom Size** (32–168) · ค่าเริ่ม 48 · "Approximate height of your character in pixels" (Pro ไม่ขยายผืนเผื่อท่า ต่างจาก Standard ที่เผื่อ ~40%)
6. **Camera View:** Sidescroller | **Low Top-Down** | High Top-Down | Oblique (UNAVAILABLE)
7. กล่องข้อมูล: "Pro mode generates 8 rotations using advanced AI. Supports sizes 32×32 to 168×168."
8. **Reference images (optional)** อัปได้ 4 รูป (0/4) · ย่ออัตโนมัติไม่เกิน 1024×1024 · ใช้กำหนดตัว ท่า เสื้อผ้า · ต้องบรรยายในข้อความว่าแต่ละรูปใช้ทำอะไร
9. **Style Character (RECOMMENDED)** → ปุ่ม **Choose from my characters** = ใช้ตัวละครที่มีแล้ว (ทั้ง 8 ทิศ) เป็นแบบสไตล์
10. **Style Image (optional)** อัป 1 รูป
11. บรรทัด **"Total: 20 generations for all 8 directions."** → ปุ่ม **Generate Character**

## v3 (Humanoid) · ที่เปลี่ยน
- **Sprite Size** มีถึง **256px** (32 · 48 · 56 · 64 · 80 · 96 · 128 · 168 · 256) + แถบ **Width / Height** แยกกัน · ค่าเริ่ม 48
- บรรทัดราคา **"Costs 2 generations."** → ปุ่ม **Generate v3 Character**

## เปลี่ยนวิธีทำมอนของเรา (เสนอ)
| มอน | เดิม | ต่อไป |
|---|---|---|
| ไม่มีขา / รูปร่างแปลก (สไลม์ ค้างคาว ผี) | Object Creator 1 ทิศ + ท่าขยับด้วยโค้ด | **Custom · Pro · Low Top-Down · 64 · Style Character = มอนตัวที่ผ่านแล้ว** → ได้ 8 ทิศ + ทำท่า idle/walk ด้วย V3 moves (20 generations) |
| สองขา (โกเลม คน) | Humanoid · v3 | เหมือนเดิม · บอสใช้ขนาด 128 |
| สี่ขา (หมาป่า สุนัขจิ้งจอก) | – | **Quadruped · Pro · เลือก Quadruped model ใกล้เคียง** |

ข้อดี: ได้ภาพหันได้ 8 ทิศและท่าจริงจาก PixelLab แทนท่าโยกด้วยโค้ด · ข้อเสีย: 20 generations ต่อตัว (เท่า Object Creator) แต่ได้ตัวเดียว ไม่ได้ 16 แบบให้เลือก → ทำหลังจากได้แบบที่ผ่านแล้วจาก Object Creator และใช้ภาพนั้นเป็น Reference image
