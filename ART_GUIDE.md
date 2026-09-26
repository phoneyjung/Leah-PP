# Leah-PP · คู่มือภาพสำหรับ PixelLab

## แนวภาพที่เลือก: "ผู้พิทักษ์แสง" แบบ 2D พิกเซล (ปรับ 26 ก.ย. 2569)
**2D ล้วนแบบ Stardew Valley** กล้องคงที่ไม่หมุน · พิกเซลขยายเป็นจำนวนเต็มเท่า · **เงาแบบ Trickster** (ทอดไปข้างหลัง เอียงขวา ขอบนุ่ม) · อารมณ์แสงแบบ Octopath (ตะเกียงอุ่นตัดคริสตัลเย็น ลำแดด ฝุ่นลอย)
**โลกสว่างและสีสดขึ้นตามคริสตัลที่ปลุก** (หมู่บ้านเริ่มหม่นอมฟ้า → เขียวสดแดดอุ่น เมื่อผ่านถ้ำ 3 ครั้ง) · กติกาจัดฉากทั้งหมดอยู่ใน `SCENE_GUIDE.md`
~~แนว 2 HD-2D (ภาพ 2D ตั้งในฉาก 3D)~~ เลิกใช้แล้ว เพราะดูเป็นกระดาษ

## หลักการ
- ผู้เล่นหลัก 6–12 ปี · **เล็งรสนิยมเด็ก 10 ขวบ**: ชิบิน่ารักแต่ไม่ดูเด็กเล็ก สีเข้มสด แสงเงาแบบผจญภัย ไม่ใช่พาสเทลของเล่น
- **60-30-10 ทุกเรื่อง**: สี (พื้น 60 · อาคาร/ของ 30 · คริสตัล/ของหายาก 10) · แสง (รอบทิศ 60 · หลัก 30 · เรือง 10) · เวลาเล่น (สำรวจ 60 · ตอบคำถาม 30 · เซอร์ไพรส์ 10)
- **หรี่ไม่ใช่ดำ**: ฉากที่แสงยังไม่กลับมาใช้สีหม่นอมฟ้า ห้ามมืดจนเด็กหาของไม่เจอ
- **แสงฟ้าเรืองใช้กับของที่เก็บได้เท่านั้น** (คริสตัลความรู้) · ของประดับเรืองต้องเป็นเหลือง/ส้ม · ประตูปัญญาเรืองสีทอง
- เส้นขอบสีเข้มชั้นเดียว · รายละเอียดสูง · แสงมาจากซ้ายบน · **32 พิกเซล = 1 ช่อง**
- ศัตรู/มอนสเตอร์: เท่และแข็งแรงได้ แต่น่ารัก ไม่น่ากลัว · **ห้ามใช้คำ** scary · evil · demonic · blood
- ห้ามลอกตัวละครจากเกมอื่น ออกแบบใหม่เสมอ · ทุกสิ่งต้องมีเหตุผลในเรื่อง (`WORLD.md`)
- PixelLab เสียเครดิต → **พรอมป์ที่ดีที่สุดอันเดียวต่อชิ้น** · ถ้าโค้ดวาดได้สวยพอ ให้โค้ดทำ (ไม่เสียเครดิต)
- ทุกครั้งที่ให้สร้างแมป/ไทล์ ต้องบอกครบทุกช่องตามลำดับบนหน้าจอ รวมช่องที่ปล่อยค่าเดิม

## จานสี (hex)
| ที่ | 60 | 30 | 10 |
|---|---|---|---|
| หมู่บ้าน ตอนแสงหรี่ | #4F6E5E เขียวหม่นอมฟ้า | #D9A86C ไม้/แสงอำพัน | #5FE0FF คริสตัล · #FFD27A ทอง |
| หมู่บ้าน ตอนแสงกลับมา | #6FB96A เขียวสด | #F0C98A แดดอุ่น | #5FE0FF · #FFD27A |
| ถ้ำ | #3B3050 หินม่วงคราม | #A8744A ดิน/แสงตะเกียง | #5FE0FF คริสตัล |

## คำท้ายพรอมป์มาตรฐาน (ต่อท้ายทุกพรอมป์ของ/ฉาก)
```
pixel art for a colorful adventure RPG, rich saturated colors, dark single-color outline, soft shading, light from the top-left
```

## มาตรฐานภาพตัวละคร (ทุกตัว ผู้เล่นและ NPC)
- ภาพ 64×64 px · 8 ทิศ เรียงแถว: ใต้ · ใต้-ออก · ออก · เหนือ-ออก · เหนือ · เหนือ-ตก · ตก · ใต้-ตก · ท่ายืน 1 เฟรมต่อทิศ + เดิน 6 เฟรม
- เท้าอยู่ที่แถวพิกเซลประมาณ 61 ทุกตัว · ส่วนสูงใกล้กัน (เด็กราว 3/4 ของผู้ใหญ่)
- **ตัวละครผู้เล่น:** ผมและชุดเป็นสีเรียบแยกกันชัด ไม่มีลายซับซ้อน (โค้ดเปลี่ยนสีผม/ชุดได้) · ไม่มีหมวกติดหัว (หมวกเป็นของแยกวางทับ)

## ค่ามาตรฐาน
| งาน | เครื่องมือ | ค่า |
|---|---|---|
| ตัวละคร | Character Creator · Create from Text | Humanoid (สัตว์ 4 ขา = Quadruped) · v3 · Low Top-Down · 64px · Highly detailed |
| ท่าเดิน | ในหน้าตัวละคร → Add Animation → Walking (6 frames) | กด 🚀 เฉพาะ South, North, East, South-East, North-West (ทิศที่เหลือเกมกลับด้านเอง) |
| พื้น/ผนัง | Map Workshop → Tilesets → Create Tileset (Standard) | 32×32 · Top-down · Edge Square · Transition Size 50% · Roundness 15% · Raggedness 15% |
| วัตถุ/ไอคอน | Object Creator | 32×32 หรือ 48×48 · พื้นหลังใส |

## ตัวละครที่มีแล้ว (ใช้พรอมป์นี้เป็นแบบอ้างอิงเวลาทำชุด/ท่าเพิ่ม)
| ตัว | ขนาดในเกม | พรอมป์ที่ใช้ |
|---|---|---|
| ลีอา | 1.45 (3/4 ของแม่) | Cute chibi little Asian girl, 5 years old, black hair parted in the middle tied into two pigtails, long hair ends hanging down past her shoulders, big dark eyes, gentle smile, wearing a one-piece powder blue dress, same color from collar to hem, front buttons, short sleeves, white clog shoes |
| พ่อมด | 2.3 (ตาระดับเดียวกับแม่ สูงกว่าเพราะหมวก) | Cute chibi chubby Asian man wizard, messy short black hair, round cheerful face, big smile, long deep purple wizard robe covered with gold stars and crescent moons, wide gold sash belt, tall purple pointed wizard hat with gold moon |
| เจ้าหญิง | 1.9 | Cute chibi Asian woman princess, very long straight brown hair past the waist, gentle smile, small gold tiara with purple gem, pink corset bodice with gold embroidery, cream puff sleeves, long cream ball gown with pink draped overskirt |
| Peb | 1.15 | Cute chubby round cave rock monster, mossy green stone body, row of glowing cyan crystal spikes on its head and back, big round googly eyes, wide happy grin with tiny teeth, short stubby arms and legs, walks on two feet, friendly and silly |
| ยายนวล | 1.75 (ยืนขายของ ไม่ต้องเดิน) | Cute chibi elderly Thai grandmother shopkeeper, short curly grey hair in a small bun, round kind face, gentle smile, small round glasses, cream blouse with a pink and orange floral apron, brown sarong skirt, simple sandals, warm grandma vibe |

## ชุดไทล์ถ้ำ (A-04)
- Lower terrain (ติ๊ก Walkable): `warm brown cobblestone cave floor with thin cracks and a few tiny glowing teal specks`
- Upper terrain: `raised purple-gray cave rock with glowing cyan crystal veins and patches of green moss on top`
- Transition: `steep rocky cliff face of layered purple-gray stone with small glowing crystals`
- Enhance descriptions with AI: เปิด · Medium detail · Medium shading

## การส่งต่อไฟล์ให้แชท 2
- ตัวละคร: ดาวน์โหลด zip จากการ์ด Idle ในหน้าตัวละคร (มีทั้งท่ายืนและท่าเดิน) ส่งทั้ง zip ห้ามแตก
- ชุดไทล์: ดาวน์โหลด PNG แบบ Wang tileset
- วัตถุ: PNG พื้นหลังใส ตั้งชื่อตามของ เช่น `obj-crystal.png`
- บอกเลขงาน (A-xx) ทุกครั้งที่ส่ง
