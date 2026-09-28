# เมืองหลวงพาเพลิน (Paphloen Capital) · แบบโครงสร้างแผนที่ v1
28 ก.ย. 2569 · ใช้คู่กับ `capital-blueprint.png` (มีป้าย) และ `capital-blueprint-clean.png` (ไม่มีป้าย ใช้แนบ ChatGPT)

## 1. แนวคิด
- **เมืองหลวงที่เดินแล้วว้าว** แบบ Prontera ของ RO: ลานน้ำพุกลางเมือง ถนนใหญ่ 4 ทิศ + **ถนนเฉียง 4 สาย** ไปย่านต่าง ๆ มีจุดสำคัญครบในแผนที่เดียว
- **ตัวตนของ LA:** เมืองริมคลองแบบล้านนา 3 ชั้นขั้นบันได (ตามผังเมืองที่ชอบ) · Lantern Academy บนเนิน · วิหารตะเกียงแรกต้นน้ำตก · ท่าเรือกระทงด้านล่าง
- **ขนาด:** 48 × 32 ช่อง = **1536 × 1024 px** เท่าภาพ ChatGPT พอดี (ใช้ภาพ 1:1 ไม่ต้องย่อ คมที่สุด) · ใหญ่กว่าลานน้ำพุเดิม (36×24) ราว 1.8 เท่า · ซูมไกลสุดเห็นเกือบทั้งเมือง
- **แทนที่ลานน้ำพุเดิม** (รหัสแผนที่ `plaza` เดิม ทุกทางเชื่อมเดิมยังใช้ได้)

## 2. โครง 3 ชั้น
| ชั้น | แถว | มีอะไร | ความรู้สึก |
|---|---|---|---|
| **บน · เนิน Academy** | 0–8 | Lantern Academy · วิหารตะเกียงแรก (น้ำตกต้นคลอง) · หอสมาคมอาชีพ · ประตูเหนือ | สง่า ศักดิ์สิทธิ์ |
| กำแพงหินครีม + บันได 4 จุด | 9 | | |
| **กลาง · ลานน้ำพุ** | 10–20 | ลานน้ำพุกลม · ศาลโคม (วาร์ป) · กระดานประกาศ · ย่านบ้านฝั่งตะวันตก · ย่านการค้าฝั่งตะวันออก · ประตูตะวันตก/ตะวันออก | คึกคัก ศูนย์กลาง |
| กำแพงหินครีม + บันได 3 จุด | 21 | | |
| **ล่าง · สวนและท่าเรือ** | 22–28 | สวนดอกไม้+ศาลา · ลานฝึกมือใหม่ · ทางเดินเลียบริมน้ำ · ท่าเรือ | ผ่อนคลาย |
| ทะเลสาบ | 29–31 | เรือ กระทงลอย · ท่าเรือใต้ | |

**คลอง:** เริ่มจากน้ำตกข้างวิหาร ไหลเฉียงลงทะเลสาบ ผ่านใต้ **สะพานโค้ง 3 จุด** (ถนนชั้นบน · ถนนตะวันตก · ทางเดินชั้นล่าง)

## 3. อาคารและหน้าที่ในเกม
| อาคาร | ตำแหน่ง (ช่อง) | ใช้ทำอะไร | สถานะ |
|---|---|---|---|
| 🏫 **Lantern Academy** | 26–36 × 1–7 | ครูพ่อมด (ขึ้นชั้นเรียน) · **ประตูเข้าหอฝึกแห่งแสง** | มีระบบแล้ว ย้ายจุดมาที่นี่ |
| ⛩️ **วิหารตะเกียงแรก** | 2–9 × 1–6 | **ประตูปริศนา → ห้องที่ถูกลืม 4 ห้อง** · จุดเฉลยเรื่องเป๊บ | มีระบบแล้ว |
| ⚔️ หอสมาคมอาชีพ | 39–46 × 1–6 | เลือกอาชีพ Lv10 · เลื่อนขั้น · ฝึกปราณ | มีระบบแล้ว (ตอนนี้กดจากเมนู) |
| ✨ ศาลโคม | 27–29 × 12–14 | ศิลาแสงวาร์ป | มีแล้ว |
| 📜 กระดานประกาศ | 19–20 × 12–13 | ภารกิจรายวัน | มีแล้ว |
| 🏠 บ้านล้านนา 3 หลัง | ฝั่งตะวันตก | บ้านเพื่อนร่วมโรงเรียน (เยี่ยมบ้านออนไลน์) | ตกแต่ง |
| 🍲 ร้านอาหารแม่ครัว | 8–12 × 18–20 | ขายอาหารบัฟ · สอนสูตรใหม่ | ใหม่ (ต่อจากระบบครัว) |
| 🛒 ตลาด | 32–42 × 11–14 | ซื้อเมล็ดผัก ของใช้ · ขายปลา | ใหม่ (ยายนวลยังอยู่ถนนตลาด) |
| 🔨 ร้านตีเหล็ก | 43–46 × 11–14 | ใส่การ์ด · ตีบวก (อนาคต) | ใหม่ |
| 🎁 ไปรษณีย์ของขวัญ | 32–36 × 18–20 | กล่องของขวัญครอบครัว · ตู้จดหมาย | มีระบบแล้ว |
| 📦 คลังเก็บของ | 38–42 × 18–20 | คลังแบบตาราง (Kafra) | มีระบบแล้ว |
| 🎓 ห้องเรียนชั้น | 43–46 × 18–20 | ดูชั้นเรียน · ภารกิจชั้นถัดไป | มีระบบแล้ว |
| 🎯 ลานฝึกมือใหม่ | 30–40 × 22–23 | หุ่นฝึกตี (ผู้ใหญ่) · ฝึกส่องแสง (เด็ก) | ใหม่ |
| 🌸 สวนดอกไม้ ศาลา | 4–14 × 22–23 | นั่งพัก ฟื้นพลัง · จุดอีเวนต์เทศกาล | ใหม่ |
| ⛵ ท่าเรือ | 21–26 × 27–28 | ทางไปทะเลสาบ · (อนาคต) นั่งเรือ | ใหม่ |

## 4. จุดเชื่อมกับแผนที่เดิม
| ประตู | ตำแหน่ง | ไปที่ | หมายเหตุ |
|---|---|---|---|
| ประตูเหนือ | (18–19, 0) | ตีนเขา · ถ้ำคริสตัล | เหมือนเดิม |
| ประตูตะวันตก | (0, 16–17) | บ้าน | เหมือนเดิม |
| ประตูตะวันออก | (47, 16–17) | ถนนตลาด (ยายนวล) | เหมือนเดิม |
| ท่าเรือใต้ | (23–24, 31) | **ทะเลสาบ** | **เปิดใหม่** (เดิมประตูใต้ปิด) · ทะเลสาบได้ทางขึ้นเพิ่ม 1 ทาง |

## 5. สัดส่วนทองและ 60-30-10
- **จุดเด่น:** Academy อยู่ที่ ~62% ของความกว้าง (แถวบน) · น้ำพุกลางเมือง · เส้นแบ่งชั้นอยู่ใกล้ 38% และ 62% ของความสูง
- **60% ตัวตนเมืองหลวง:** หินครีม ปูถนน หลังคาดินเผา ไม้สัก สวนเขียว
- **30% สายเลือด LA:** เงาม่วงพลบค่ำ เส้นขอบพลัม แสงครีมอุ่น (**ไม่ใช่แดดบ่ายทอง** · บทเรียนจากภาพรอบก่อน)
- **10% สัญญาณ:** ทองเฉพาะประตูที่เข้าได้ กระดาน ป้ายร้าน · ฟ้าเฉพาะคริสตัลศาลโคม · โคมตกแต่งใช้แสงครีมอุ่น

## 6. ขั้นตอนทำ
1. ✅ แบบโครงสร้าง (ไฟล์นี้) → **รอคุณอนุมัติ/แก้**
2. ChatGPT วาดภาพเมืองหลวง 1536×1024 ตามผังไม่มีป้าย (พรอมป์ข้อ 7)
3. Claude: ปรับสี LA → ตารางชน (น้ำจากสี + กำแพง + อาคาร) → จุดโปร่งแสง → ประตู 4 ทิศ → ย้ายจุดกดของทุกอาคาร → ทดสอบเดินถึงทุกจุด
4. ขนาดไฟล์ภาพ ~650–750 KB (JPG) ⚠️ หนักกว่าลานน้ำพุเดิม ~300 KB

## 7. พรอมป์ ChatGPT (ใช้หลังอนุมัติผัง)
แนบ 3 รูป: `capital-blueprint-clean.png` · `concept-town-plan.png` · `la-style-sheet.jpg`
```
Paint the first attached image, a game map blueprint, as one finished background painting of the capital city "Paphloen" for the 2D pixel art game "Lantern Academy". Output landscape 1536x1024 at exactly the same layout; every tile of the blueprint is 32x32 pixels, so keep every element in exactly the same position and size. Use the style, detail and mood of the second attached image (the town plan) and the attached style sheet.
Keep exactly: three terrace levels separated by low cream stone retaining walls with stairs where the blueprint shows steps; the round cobblestone fountain plaza in the centre with the blue fountain; the straight cobblestone avenues to the four edges and the four diagonal avenues; the canal flowing from a waterfall beside the temple at the top left, diagonally down to the lake, with three arched cream stone bridges; the lake along the bottom with the wooden pier and boats.
Buildings exactly on their footprints: the grand Lantern Academy with a tall lantern tower (top centre-right), the Temple of the First Lantern with an old sealed door (top left), a guild hall (top right), a small lantern shrine with a light-blue crystal (right of the plaza), a notice board (left of the plaza), Lanna-style wooden houses and a cozy restaurant (west side), a market with striped purple and cream stalls, a blacksmith, a post office, a storage house and a small classroom (east side), a flower garden with a pavilion (lower left) and a training yard with wooden practice dummies (lower right).
Fill free grass with trees, flower beds, hedges, benches, potted plants and a few Lanna paper lanterns.
Colour: about 60% cream stone, terracotta roofs, warm teak and garden greens; about 30% dusk violet shadows, plum outlines and warm cream light; about 10% lantern gold only on doors, shop signs and lanterns, crystal cyan only on the shrine crystal. Early dusk with soft violet shadows, not a golden afternoon. Crisp pixel art, top-down with a slight three-quarter tilt. No characters, no people, no animals, no text, no labels, no UI.
```


---
# v2 · ปรับหลังลองวาดรอบแรก (28 ก.ย. 2569)
**ผลรอบแรก:** ภาพสวยแต่ **ลายละเอียดแน่นเกิน · ถนนแคบ (2 ช่อง เดินได้ทีละคน) · บางจุดเดินไม่ได้ · ไม่มีที่ให้คนในเมืองเดิน**
**ทดสอบขนาด** (`capital-scale-test.png`): ขยาย 1× แคบ · **1.5× พอดี** (ถนนโล่ง น้ำพุใหญ่ คนเดินสวนกันได้) · 2× ใหญ่เกิน เดินไกล

## กติกาขนาด (ใช้กับทุกแผนที่เมืองจากนี้)
| ของ | ขนาด |
|---|---|
| ตัวละคร | สูง 2 ช่อง |
| ถนนหลัก | **กว้าง 5 ช่อง** |
| ถนนเฉียง / ทางเลียบน้ำ | 4 ช่อง |
| ลานน้ำพุ | รัศมี 10 ช่อง (มีทางเดินรอบน้ำพุกว้าง 7 ช่อง) |
| บันได | กว้างเท่าถนนที่ขึ้น |
| บ้าน / ร้าน | 6–9 × 4–6 ช่อง · ห่างกันอย่างน้อย 4 ช่อง |
| ของตกแต่ง | อยู่ในแปลงดอกไม้/ริมอาคาร **ไม่วางกลางทาง** |
| พื้นที่เดินได้ | อย่างน้อย 45% ของแผนที่ |

## แผนที่ v2
- **72 × 48 ช่อง** (โลกในเกม 2304 × 1536) · ภาพ ChatGPT 1536×1024 แสดงขยาย 1.5× · **ขนาดไฟล์เท่าเดิม**
- โครง 3 ชั้น + คลอง + 4 ประตู เหมือนเดิม · **อาคารน้อยลงแต่ใหญ่ขึ้น:** ห้องเรียนชั้นรวมเข้า Academy · ไปรษณีย์รวมกับคลังเก็บของ
- **คนในเมือง (แนว Goemon):** ทางเดินวน 6 เส้น (จุดชมพูในผัง) + ที่ยืนประจำ 10 จุด (จุดเหลือง) · เล่นคนเดียวเมืองก็ยังมีชีวิต
- ผังใหม่: `capital-blueprint-v2.png` (มีป้าย) · `capital-blueprint-v2-clean.png` (แนบ ChatGPT)

## ขั้นต่อไปตาม PIPELINE
1. คุณอนุมัติผัง v2
2. **ผังเปล่าเล่นได้** 72×48 พร้อมคนในเมืองเดินจริง → เดินบนมือถือ ดูระยะ
3. ล็อกผัง → ChatGPT วาด (พรอมป์ v2: "fewer, larger elements, wide open cobblestone streets")


## สัดส่วนของ (รอบวาด v2) · ใช้ร่วมกับ `scale-guide.png`
**ปัญหารอบแรก:** ChatGPT วาดตามสัดส่วนของตัวเอง โคมไฟ ก้อนหินปูพื้น และอาคาร เลยไม่เข้ากับตัวละครในเกม
**แก้:** แนบ **ภาพสัดส่วน** ที่ทำจากของจริงในเกม + บอกขนาดเป็นพิกเซลในพรอมป์ (ภาพ 1536×1024 · 1 ช่อง = 21 px)
| ของ | ช่อง | พิกเซลในภาพ |
|---|---|---|
| เด็ก / ผู้ใหญ่ | สูง 2 / 2.5 | 43 / 53 |
| เสาโคม | สูง 2.6 | 55 |
| ประตูบ้าน | สูง 2.4 | 51 |
| บ้าน | 7 × 6 | 150 × 128 |
| แผงตลาด | 5 × 4 | 107 × 85 |
| ต้นไม้ | 3 × 4 | 64 × 85 |
| ม้านั่ง | 2.4 × 1.3 | 51 × 28 |
| น้ำพุ | กว้าง 6 | 128 |
| ก้อนหินปูพื้น | ครึ่งช่อง | ~10 |
| ถนนหลัก / ถนนรอง | 5 / 4 | 107 / 85 |

## พรอมป์วาด v2 (ใช้หลังล็อกผัง)
แนบ 4 รูปตามลำดับ: `capital-blueprint-v2-clean.png` · `scale-guide.png` · `concept-town-plan.png` · `la-style-sheet.jpg`
```
Paint the first attached image, a game map blueprint, as one finished background painting of the capital city "Paphloen" for the 2D pixel art game "Lantern Academy". Output landscape 1536x1024 with exactly the same layout. The map is 72 x 48 tiles, so one tile is about 21 pixels in the output.
Follow the second attached image, the scale guide, for the size of everything: a child is 43 px tall and an adult 53 px, lamp posts 55 px tall, house doors 51 px tall, houses about 150 x 128 px, market stalls 107 x 85 px, trees about 64 x 85 px, benches 51 x 28 px, the fountain 128 px wide, cobblestones about 10 px each, main streets 107 px wide and side paths 85 px wide. Do not draw the example figures from the scale guide.
Use the style, colours and mood of the third image (the town plan) and the attached style sheet, but with fewer and larger elements, calm open cobblestone streets and plazas, and decorations only in flower beds and along building fronts, never in the middle of a street.
Keep exactly: three terraces with low cream stone retaining walls and wide stairs where the blueprint shows steps; the round fountain plaza in the centre; the straight avenues to the four edges and the four diagonal avenues; the canal from the waterfall by the temple at the top left down to the lake, with three arched cream stone bridges; the lake along the bottom with the wooden pier. Every building on its footprint: Lantern Academy with a lantern tower (top right of centre), Temple of the First Lantern with an old sealed door (top left), guild hall (top right), small lantern shrine with a light-blue crystal (right of the plaza), notice board (left of the plaza), Lanna houses and a restaurant (west), a market with purple and cream stalls, a blacksmith, a post office with storage and a Lanna house (east), a flower garden with a pavilion (lower left), a training yard with wooden practice dummies (lower right).
Colour: 60% cream stone, terracotta roofs, teak and garden greens; 30% dusk violet shadows, plum outlines and warm cream light; 10% lantern gold only on doors, signs and lanterns, crystal cyan only on the shrine crystal. Early dusk with soft violet shadows, not a golden afternoon. Crisp pixel art, top-down with a slight three-quarter tilt. No characters, no people, no animals, no text, no labels, no UI.
```


---
# v3 · ขยายผังให้โล่ง (28 ก.ย. 2569) ← ใช้อันนี้
**เหตุผล:** v2 ยังแน่น · ขยายแผนที่แต่ **อาคารและถนนขนาดเท่าเดิม** แค่ห่างกันมากขึ้น
| | v2 | **v3** |
|---|---|---|
| ขนาด | 72 × 48 ช่อง | **96 × 64 ช่อง** |
| พื้นที่เดินได้ | 58% | **69%** |
| เดินข้ามเมือง (ความเร็วเดิน) | ~23 วินาที | ~31 วินาที (มีตัวเบา + ศาลโคมวาร์ป) |
| ลานน้ำพุ | รัศมี 10 | **รัศมี 12** |
| ภาพ ChatGPT | 1536×1024 แสดง 1.5× | 1536×1024 แสดง **2× พอดีเป๊ะ** (พิกเซลคมทุกจุด) · ขนาดไฟล์เท่าเดิม |
ผัง: `capital-blueprint-v3.png` (มีป้าย) · `capital-blueprint-v3-clean.png` (แนบ ChatGPT) · สัดส่วน: `scale-guide-v3.png` (1 ช่อง = 16 px ในภาพ)

## พรอมป์วาด v3
แนบ 4 รูปตามลำดับ: `capital-blueprint-v3-clean.png` · `scale-guide-v3.png` · `concept-town-plan.png` · `la-style-sheet.jpg`
```
Paint the first attached image, a game map blueprint, as one finished background painting of the capital city "Paphloen" for the 2D pixel art game "Lantern Academy". Output landscape 1536x1024 with exactly the same layout. The map is 96 x 64 tiles, so one tile is 16 pixels in the output.
Follow the second attached image, the scale guide, for the size of everything: a child is 32 px tall and an adult 40 px, lamp posts 42 px tall, house doors 38 px tall, houses about 112 x 99 px, market stalls 80 x 64 px, trees about 51 x 67 px, benches 38 x 21 px, the fountain 96 px wide, cobblestones about 8 px each, main streets 80 px wide and side paths 64 px wide. Do not draw the example figures from the scale guide.
Use the style, colours and mood of the third image (the town plan) and the attached style sheet, but keep it calm and spacious: fewer and larger elements, wide open cobblestone streets and plazas, soft lawns, decorations only in flower beds and along building fronts, never in the middle of a street.
Keep exactly: three terraces with low cream stone retaining walls and wide stairs where the blueprint shows steps; the round fountain plaza in the centre; the straight avenues to the four edges and the four diagonal avenues; the canal from the waterfall by the temple at the top left down to the lake, with three arched cream stone bridges; the lake along the bottom with the wooden pier. Every building on its footprint: Lantern Academy with a lantern tower, Temple of the First Lantern with an old sealed door, guild hall, small lantern shrine with a light-blue crystal, notice board, Lanna houses and a restaurant, a market with purple and cream stalls, a blacksmith, a post office with storage, a flower garden with a pavilion and a training yard with wooden practice dummies.
Colour: 60% cream stone, terracotta roofs, teak and garden greens; 30% dusk violet shadows, plum outlines and warm cream light; 10% lantern gold only on doors, signs and lanterns, crystal cyan only on the shrine crystal. Early dusk with soft violet shadows, not a golden afternoon. Crisp pixel art, top-down with a slight three-quarter tilt. No characters, no people, no animals, no text, no labels, no UI.
```


---
# v3.1 · โซนกิจกรรม 4 ลาน (28 ก.ย. 2569) ← ผังล่าสุด
ผัง `capital-blueprint-v3.png` · `capital-blueprint-v3-clean.png` อัปเดตแล้ว · พื้นที่เดินได้ 67%
| ลาน | ตำแหน่ง | ขนาด (ช่อง) | ใช้ทำอะไร | ทำเมื่อไร |
|---|---|---|---|---|
| 🏮 **ลานเทศกาลโคม + เวที** | ชั้นล่าง ริมทะเลสาบ ข้างท่าเรือ (ถนนใต้ผ่านกลางลาน) | 26 × 7 · เวที 4 × 6 | **เทศกาลตามฤดู:** ลอยกระทง ยี่เป็ง สงกรานต์ ปีใหม่ · **ตอบคำถามแข่งกันทั้งห้อง** (ครูจัดได้) · ประกาศรางวัล | ลานใน M1 · กิจกรรมทีละงาน |
| 🛒 **ถนนตั้งแผง (ตลาดนัดผู้เล่น)** | ถนนตะวันออก ระหว่างลานน้ำพุกับประตูตะวันออก | 33 × 8 · **16 ช่องแผง** | ผู้ใหญ่ตั้งแผงขายของที่เก็บ/ทำได้ ราคาตายตัว · เด็ก **ให้ของขวัญได้อย่างเดียว** · เฉพาะในบ้าน/ห้องเรียนเดียวกัน | ⚠️ **M4** (ต้องมีระบบตรวจโกงก่อน) · M1 เป็นลานโล่ง + NPC ขายของ |
| 📸 **ลานหน้า Academy + ซุ้มถ่ายรูปรวม** | ชั้นบน หน้าบันได Academy | 20 × 5 · ซุ้มเดินลอดได้ | ยืนในกรอบแล้วกด 📸 ได้ภาพรวมพร้อมฉาก Academy + กรอบลายโคม · บันทึกลงเครื่อง | หลัง M1 |
| 💬 **จุดนัดพบน้ำพุ** | ใต้น้ำพุกลางเมือง | 12 × 4 · ป้ายนัด 1 ป้าย | จุดเกิดเวลาเข้าเมือง · **ป้ายนัดรวมกลุ่ม** ชวนคนในบ้าน/ห้องไปถ้ำด้วยกัน · อีโมตรวมกลุ่ม | ลานใน M1 · ป้ายหลัง M1 |
**หลักคิด:** ลานกิจกรรมอยู่ **บนทางหลัก** ทุกลาน เด็กเดินผ่านเจอเองโดยไม่ต้องหา · ตลาดนัดอยู่ถนนแยกออกไป ไม่บังทางคนเดินปกติ · ซุ้มถ่ายรูปมีฉากหลังสวยสุดของเมือง (Academy + หอโคม)

## เพิ่มในพรอมป์วาด v3 (ต่อท้ายประโยค "Every building on its footprint")
```
Also paint the four open event areas exactly where the blueprint shows them: a lantern festival square by the lake with a small wooden stage at its east end and strings of paper lanterns above it; a market street along the east avenue with sixteen empty wooden stall frames on both sides; a flower arch photo spot on the terrace in front of the Lantern Academy stairs; and a meeting spot just south of the fountain with a small wooden meeting board. Keep all four areas open, flat and easy to walk on.
```


---
# v3.2 · วัด 60-30-10 และสัดส่วนทอง (28 ก.ย. 2569) ← ผังล่าสุด
## 60-30-10 ใช้ 2 แบบ วัดคนละวิธี
| แบบ | วัดอะไร | วัดยังไง | เป้า | v3.1 | **v3.2** |
|---|---|---|---|---|---|
| **1 · พื้นที่ (ผัง)** | โล่ง (ถนน ลาน สนามหญ้า) / มวล (อาคาร ต้นไม้ แปลงดอก กำแพง) / น้ำ+จุดเด่น | นับพิกเซลของผังตามสีแต่ละกลุ่ม | 60 / 30 / 10 | 67.7 / 23.1 / 9.2 | **61.5 / 29.3 / 9.1** ✅ |
| **2 · สี (ภาพวาด)** | ตัวตนเมือง / สายเลือด LA / สัญญาณ | ตัวจำแนกสีเดิม (เทียบจานสี LA + สัญญาณทอง/ฟ้า) หลังได้ภาพวาด | 60 / 30 / 10 | — | วัดหลังวาด |
**ถนน+ลานยังกว้างเท่าเดิม (28%)** ที่ลดลงคือหญ้าว่าง เปลี่ยนเป็นแปลงดอกหน้าอาคาร รั้วต้นไม้ข้างอาคารใหญ่ และดงไม้ตามมุม · เมืองโล่งแต่ไม่โหรงเหรง

## สัดส่วนทอง (เส้น 38.2% / 61.8%)
| จุดเด่น | v3.1 (แนวนอน) | **v3.2** |
|---|---|---|
| **Lantern Academy** (จุดเด่นอันดับ 1) | 68% | **61.8%** ✅ ย้ายมาบนเส้นทอง พร้อมลานถ่ายรูปและถนนขึ้น Academy |
| น้ำพุ (ศูนย์กลาง) | 51% | 51% (ตั้งใจไว้กลางแบบ Prontera) |
| กระดาน / ศาลโคม | ใกล้เส้น 38% / 62% | เหมือนเดิม |
| ถนนหลักตะวันออก-ตะวันตก | สูง 52% | เหมือนเดิม |
