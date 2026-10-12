# ชุด 08 · B1 · พรอมป์เพื่ออนุมัติ (ยังไม่เจน)

วันที่ 12 ต.ค. 2569 · ASSET_SPEC_08 ฉบับ 7 · main `176287b` · branch `codex/asset-08-kid-base`

B0b `22119f4` ผ่านตามเจ้าของแล้ว ใช้หญิง 1/2/3/4ข และชาย 1/2/3/4ข; ธีม 4 คือชาวประมงริมน้ำเท่านั้น ไม่ทำภาพ B0b ใหม่ เอกสารนี้มีพรอมป์หลัก **24 อัน = หัว 16 + ชุด 8** อันเดียวต่อชิ้น ไม่มีพรอมป์สำรอง เจนจริงในรอบส่งเอกสาร **0 ครั้ง / 0 เครดิต**.

## วิธีใช้และค่ากลางที่เสนอให้อนุมัติ

| ช่อง | ค่าที่ใช้กับทั้ง 24 งาน |
|---|---|
| เครื่องมือ | PixelLab MCP `create_character` · Character Type: Humanoid · Generation Mode: Pro · Mode: **Pro Flash** |
| ขนาด | 64×64 ต่อทิศ; ตัวจริงสูง 60–62 px; center x=32; เท้าท่ายืนแถว 62; ไม่ใช้ค่าเริ่มต้น 48 |
| ทิศ/กล้อง | 8 directions · Low Top-Down · ส่งออกเรียง S, SE, E, NE, N, NW, W, SW |
| ท่า | Standing idle, empty hands; ไม่สั่งแอนิเมชันใน 24 งานนี้ |
| รูปแบบ | crisp pixel clusters; continuous dark outline; แสงซ้ายบน; เงา 3–4 ขั้น; medium detail อ่านออกที่ 1× |
| Style image | ภาพอนุพันธ์ 64×64 จาก `style-kid.png`; เอา Color palette ออก; เปิด Outline / Detail / Shading; Style Character ว่าง |
| Concept reference | ภาพเฉพาะตัว/หัวตามพิกัดในแต่ละข้อ; ไม่ส่งทั้งแผ่นที่มีตัวเลือกหลายตัวและข้อความ |
| พื้น/ขอบ | โปร่งใส ไม่มีเงาบนพื้น; ขอบใสอย่างน้อย 1 px; ส่งออก alpha 0/255 หลังตรวจและเกลาชิ้น |
| การสุ่ม/เพิ่มข้อความ | 1 งานต่อชิ้น ไม่มี batch variations; ไม่ใช้ AI enhance description; seed ค่าเดิมของบริการและบันทึกถ้ามี |
| งบเสนอ | 6–8 generations ต่อ 1 งานที่ได้ 8 ทิศ; กันงบ 8 ต่อชิ้น; ไม่ retry งานที่ timeout จนตรวจสถานะเดิมแล้ว |

ค่าข้างบนเป็น **ค่าหน้าเครื่องมือที่เสนอ** ไม่ใช่ JSON request ที่ยืนยัน schema แล้ว: ชื่อ `create_character` อ้าง ASSET_SPEC_08; Pro Flash 6–8 generations อ้าง [คู่มือ PixelLab](PIXELLAB_GUIDE.md) หัวข้อ Characters และอัปเดต 28 ก.ย. รอบนี้ไม่มี native PixelLab tools และ runtime ไม่มีตัวแปร `PIXELLAB_API_KEY` จึงยังไม่ได้ยืนยัน schema, โหมด Pro Flash ผ่าน MCP หรือยอดบัญชีล่าสุด ไม่ใช้ข้อมูลลับจากข้อความเก่าและไม่บันทึกข้อมูลลับลงไฟล์.

หลังเจ้าของอนุมัติ ให้ตรวจ `tools/list` และยอดคงเหลือแบบอ่านอย่างเดียวผ่านการเชื่อมต่อที่ตั้งค่าไว้อย่างปลอดภัยก่อน ตรวจว่า tool รองรับ 64 px, concept/style reference, Pro Flash และ 8 ทิศตรงตาราง หากรองรับไม่ครบหรือราคาต่อชิ้นเกิน 8 ให้รายงานความต่างก่อนใช้เครดิต ไม่เปลี่ยนโหมดหรือเพิ่มจำนวนเจนเอง ไม่ส่งฟิลด์สมมติเข้า API.

## เตรียมภาพอ้างอิงและการแยกหัว/ตัว (ไม่ใช้เครดิต)

1. `style-kid.png` จริงมีขนาด **358×540** ห้ามส่งเป็น style image ของงาน 64 px โดยตรง เตรียมสำเนาเฉพาะตัว ลบพื้นหลัง แล้ว fit ตามสัดส่วนใน 64×64 โดยเท้าแถว 62; ไม่แก้ต้นฉบับ ใช้เฉพาะแนวเส้นขอบ แสง และกลุ่มพิกเซล ไม่คัดลอกผ้าคลุม/สี/เครื่องประดับในภาพนั้น ไฟล์อนุพันธ์และภาพ crop ด้านล่างจะเตรียมหลังอนุมัติ ไม่ใช่ไฟล์ที่ส่งใน B1.
2. หัว: ใช้ `kid-looks-a0.png`/`kid-looks-a0.json` จาก A0c เป็น concept; crop ช่องเกมตามตารางและเอาเฉพาะหัว/ผม ไม่คัดลอกชุดเดิม กรอบอ้างอิงเป็น `[x,y,w,h]` จากมุมบนซ้าย; ภาพใหญ่ใน JSON ใช้ตรวจปอยผม/สีหน้าได้ แว่นและผ้าคาดหัวเป็นของสวมทีหลัง จึงไม่ติดไปกับชิ้นผม; กิ๊บเล็กของ F5 คงเป็นรายละเอียดสีคงที่ แยกจากกลุ่มสีผม.
3. ชุด: ใช้ `kid-outfits-b0b.png` เป็น concept ตามช่องเกมที่ระบุ ใช้ภาพใหญ่ของตัวเดียวกันตรวจรายละเอียด คงแบบเสื้อผ้าที่ผ่าน แก้เฉพาะตำแหน่งขอบทองชาย 1/2/4 และความกว้างตะเกียงชาย 4 ตามฉบับ 7.
4. `create_character` ให้ภาพตัวละครรวม ไม่ได้ให้ชั้น paperdoll สำเร็จ: ทั้งงานหัวและงานชุดใช้ตัวเต็มเป็นตัวช่วยจัดตำแหน่ง งานหัวเก็บเฉพาะหัว/ผมแล้วทิ้งตัวช่วย งานชุดเก็บตั้งแต่คอลงไปแล้วทิ้งหัวช่วย ภาพตัวเต็มเหล่านี้ไม่ใช่ตัวละครสำเร็จสำหรับเด็ก.
5. ใช้โครง 64 เดียวกัน: เส้นกลาง x32, เท้า y62; ทิศใต้ตั้งต้นหน้า x23–41/y13–29, ตาที่ (27,21)/(37,21), ปาก (32,26), ข้อต่อคอ (32,30). พิกัดใบหน้าเป็นเป้าหมายการเกลาร่วม ไม่รับรองว่าโมเดลจะทำตรงทันที ทิศอื่นใช้แม่แบบเดียวต่อทิศซึ่งกำหนดจากหัว F1 ที่ผ่าน ไม่ mirror ชิ้นไม่สมมาตร.
6. หลังเจนจึงแยก `hairback / face / eyes / mouth / hair` กับ `body` เก็บหลังผมให้อยู่หลังตัว และซ่อมส่วนที่เคยถูกผมบังบนตัว/หนังศีรษะ/คอในกริดเดียวกันด้วยงานพิกเซล ไม่ย่อหรือยืดชิ้นแต่ละชิ้นเพื่อบังคับให้ตรง หากทำให้สวยและวางตรงไม่ได้ ส่งภาพที่ติดพร้อมรายงานก่อนเจนเพิ่ม.
7. สีผม ตา ผิว ผ้าพันคอ และขอบทองต้องมี regions แยก: `hair`, `eye`, `skin`, `house`, `trim`; ทองของตะเกียงและขอบคงที่อยู่ `trim` ไม่เปลี่ยนตามบ้าน ผ้าพันคอสีเหลืองทองอยู่ `house` ใช้คนละ RGB ramp จาก `trim` แม้ใกล้กันทางสายตา โค้ดเปลี่ยนสีผม/ตา/ผิว 4 ระดับภายหลัง ไม่เจนแยกตามสี สีขอบของแต่ละกลุ่มต้องไม่ซ้ำข้ามกลุ่ม; ส่วนสีคงที่อื่นแยก regions ด้วย ไม่เลือก mask จาก hue ทั้งภาพอย่างเดียว.

## หัว 16 แบบ · ทรงผมเลือกได้ทุกเพศ

F/M ในรหัสคือที่มาบนแผ่น A0c เท่านั้น ไม่ใช่ข้อจำกัดการเลือกผม ตาและปากในพรอมป์เป็นต้นแบบแยกชิ้น ผู้เล่นเปลี่ยนคู่ผสมได้ แว่นและผ้าคาดหัวไม่อยู่ในรอบนี้.

### H-F1 · สดใส

ไทย: หัวต้นแบบ A0c หญิง 1 บุคลิกสดใส เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[228, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Two HIGH long flowing pigtails tied near the upper sides of the head, extending down behind the shoulders, open face. Not low braids. Hair color: auburn red-brown. Skin: medium warm peach. Eyes: Large round sparkling eyes, equally wide open. Brows: Raised happy curved eyebrows. Mouth: Wide joyful tooth-showing grin, clear white tooth band. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F2 · นักสำรวจ

ไทย: หัวต้นแบบ A0c หญิง 2 บุคลิกนักสำรวจ เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[508, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short tousled jaw-length bob, uneven chunky outward tips and one clear upward cowlick at the crown. Hair color: warm light brown. Skin: warm tan caramel. Eyes: Wide curious round eyes, both equally open. Brows: Both eyebrows visibly raised high in curiosity. Mouth: Small open round O mouth, a surprised curious expression. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F3 · ใจดี

ไทย: หัวต้นแบบ A0c หญิง 3 บุคลิกใจดี เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[788, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Two tidy LOW BRAIDS beside the neck, broad coherent hair highlights, face fully clear. Hair color: dark chestnut brown. Skin: fair warm ivory. Eyes: Matching upward-curved smiling crescent eyes, both gently closed to the same degree. Brows: Soft low rounded arches. Mouth: Gentle closed U-shaped smile. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F4 · กล้าหาญ

ไทย: หัวต้นแบบ A0c หญิง 4 บุคลิกกล้าหาญ เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1068, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short side-swept pixie hair with ONE distinctly longer side lock beside the right cheek, ending at the shoulder; swept fringe stays above eyes. Hair color: soft near-black brown. Skin: warm tan caramel. Eyes: Soft confident almond eyes, both equally open. Brows: Level relaxed confident brows, no inward frown. Mouth: Closed asymmetric one-corner smile, kind and self-assured. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F5 · นักคิด

ไทย: หัวต้นแบบ A0c หญิง 5 บุคลิกนักคิด เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1348, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Smooth rounded chin-length bob, a navy rectangular clip above the left temple, clear eye area. Hair color: reddish chestnut brown. Skin: medium warm peach. Eyes: Calm open oval eyes. Brows: Even gently arched eyebrows. Mouth: Tiny centered peaceful closed smile. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F6 · ขี้เล่น

ไทย: หัวต้นแบบ A0c หญิง 6 บุคลิกขี้เล่น เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1628, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Two compact rounded buns high on the crown with a tidy center part; clear face. Hair color: warm light brown. Skin: fair warm ivory. Eyes: Bright mischievous round sparkling eyes, both equally open. Brows: Light playful raised arches. Mouth: Very distinct double-curved cat mouth shaped like a rounded numeral 3 rotated sideways (omega smile). Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F7 · ขี้อาย

ไทย: หัวต้นแบบ A0c หญิง 7 บุคลิกขี้อาย เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1908, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Straight shoulder-length hair with a blunt straight fringe ending above both eyebrows; no hair crossing the eyes. Hair color: dark chocolate brown. Skin: fair rosy ivory. Eyes: Both gentle eyes exactly HALF-OPEN, matching horizontal upper lids, with visible brown pupils; strong rosy blush on both cheeks. Brows: Soft slight upward brows. Mouth: Tiny closed shy mouth. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-F8 · นักกีฬา

ไทย: หัวต้นแบบ A0c หญิง 8 บุคลิกนักกีฬา เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[2188, 232, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: One high ponytail tied behind the crown, eyes fully clear. Hair color: deep auburn brown. Skin: warm tan caramel. Eyes: Focused energetic open eyes, both equally open, friendly determination. Brows: Confident gently lifted brows, never pinched together. Mouth: Broad open athletic smile with a clear white tooth band. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M1 · สดใส

ไทย: หัวต้นแบบ A0c ชาย 1 บุคลิกสดใส เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[228, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short upright chunky spikes. Hair color: dark chestnut brown. Skin: medium warm peach. Eyes: Large round sparkling eyes, equally wide open. Brows: Raised happy curved eyebrows. Mouth: Wide joyful tooth-showing grin, clear white tooth band. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M2 · นักสำรวจ

ไทย: หัวต้นแบบ A0c ชาย 2 บุคลิกนักสำรวจ เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[508, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short softly tousled crop with broad irregular crown locks. Hair color: auburn red-brown. Skin: warm tan caramel. Eyes: Wide curious round eyes, both equally open. Brows: Both eyebrows visibly raised high in curiosity. Mouth: Small open round O mouth, a surprised curious expression. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M3 · ใจดี

ไทย: หัวต้นแบบ A0c ชาย 3 บุคลิกใจดี เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[788, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Soft rounded mushroom bowl cut, smooth domed outline, curved fringe above the eyebrows and tidy sides. Hair color: warm light brown. Skin: fair warm ivory. Eyes: Matching upward-curved smiling crescent eyes, both gently closed to the same degree. Brows: Soft low rounded arches. Mouth: Gentle closed U-shaped smile. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M4 · กล้าหาญ

ไทย: หัวต้นแบบ A0c ชาย 4 บุคลิกกล้าหาญ เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1068, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short tall swept-back hair with a broad backward quiff and tidy ears; open forehead. Hair color: soft near-black brown. Skin: warm tan caramel. Eyes: Soft confident almond eyes, both equally open. Brows: Level relaxed confident brows, no inward frown. Mouth: Closed asymmetric one-corner smile, kind and self-assured. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M5 · นักคิด

ไทย: หัวต้นแบบ A0c ชาย 5 บุคลิกนักคิด เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1348, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Neat short side part with one broad smooth wave, the same silhouette as A0b boy 2. Hair color: dark chocolate brown. Skin: medium warm peach. Eyes: Calm open oval eyes. Brows: Even gently arched eyebrows. Mouth: Tiny centered peaceful closed smile. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M6 · ขี้เล่น

ไทย: หัวต้นแบบ A0c ชาย 6 บุคลิกขี้เล่น เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1628, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Fluffy short curls made of large connected curl clusters. Hair color: warm light brown. Skin: fair warm ivory. Eyes: Bright mischievous round sparkling eyes, both equally open. Brows: Light playful raised arches. Mouth: Very distinct double-curved cat mouth shaped like a rounded numeral 3 rotated sideways (omega smile). Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M7 · ขี้อาย

ไทย: หัวต้นแบบ A0c ชาย 7 บุคลิกขี้อาย เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[1908, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Short tidy hair with one long rounded central forelock reaching the eyebrow line but never crossing an eye. Hair color: reddish chestnut brown. Skin: fair rosy ivory. Eyes: Both gentle eyes exactly HALF-OPEN, matching horizontal upper lids, with visible brown pupils; strong rosy blush on both cheeks. Brows: Soft slight upward brows. Mouth: Tiny closed shy mouth. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

### H-M8 · นักกีฬา

ไทย: หัวต้นแบบ A0c ชาย 8 บุคลิกนักกีฬา เพื่อแยกผม หน้า ตา ปาก; เลือกทรงนี้ได้ทุกเพศ.

อ้างอิง: `kid-looks-a0.png` ช่อง `[2188, 574, 64, 64]` เฉพาะหัว/ผม + style 64 ตามค่ากลาง.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child, age 7-8, oversized chibi head on a small neutral standing carrier body. Main deliverable: the head and hair in eight consistent views. Hair: Very short close-cropped buzz cut, no spikes or long fringe. Hair color: dark chestnut brown. Skin: warm tan caramel. Eyes: Focused energetic open eyes, both equally open, friendly determination. Brows: Confident gently lifted brows, never pinched together. Mouth: Broad open athletic smile with a clear white tooth band. Use the supplied head concept for the hairstyle and expression, not its clothing. Keep the same soft round face template and neck anchor across all hairstyles. Both eyes have matching openness; keep every fringe clear of the eyes. Preserve asymmetric locks in their actual position across views. Back, back-left and back-right views have no visible eyes or mouth. Hair must cover the entire scalp, including under the parting; long rear hair belongs behind the body. Neutral carrier: ivory shirt, brown shorts and boots, hands empty; its body will be discarded. No glasses, headband, hat or cape. Low top-down camera, full figure centered at x32, 60-62 pixels tall, soles on row 62 in each 64x64 frame. Front face target x23-41/y13-29; front eye centers (27,21) and (37,21), mouth (32,26), neck (32,30). Match the supplied style image only for crisp pixel clusters, continuous dark outlines, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text or labels. Separate hair, iris and skin color ramps for later recoloring; clear opaque pixels. Sweet youthful expression, relaxed brows, never a frown. One consistent character, eight standing directions.
```

## ชุด 8 แบบ · ใช้ชุด B0b ที่ผ่าน

หัวในงานชุดเป็นหัวช่วยหน้าตรงยิ้ม เพื่อไม่ให้ผมยาวบังเสื้อผ้าจะใช้ผมสั้นกลาง ๆ; ผลสุดท้ายทิ้งหัวช่วยและประกอบหัวจากชุด H แทน. ความต่างหญิง/ชายวัด silhouette ของตัวที่จัดตรง x32/เท้า62 เฉพาะแถว **34–63 คงที่ ≥80 จุด** ไม่ขยับแถวเริ่มตามเอว. ตัวเลขในพรอมป์เป็นเป้าหมายที่ต้องตรวจจริงหลังเจน ไม่ใช่ผลผ่านแล้ว.

### O-F1 · ศิษย์ตะเกียงหญิง

ไทย: ชุดศิษย์ตะเกียงหญิง ตาม B0b 1 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[243, 252, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A girl lantern apprentice. Ivory blouse with soft puff sleeves, a layered cream ruffled skirt, brown gloves and lace-up brown boots. Preserve the approved silhouette. One continuous warm-gold stripe along the lowest skirt hem, at least 8 clearly gold pixels in the front 64x64 view. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-F2 · นักสำรวจหญิง

ไทย: ชุดนักสำรวจหญิง ตาม B0b 2 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[543, 252, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A girl explorer. Ivory blouse with puffed shoulders and folded cuffs, a fitted brown vest, flared khaki skirt, leather map pouch, brown gloves and boots. One continuous warm-gold stripe along the skirt hem, at least 8 clearly gold pixels in the front 64x64 view. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-F3 · ชาวสวนหญิง

ไทย: ชุดชาวสวนหญิง ตาม B0b 3 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[843, 252, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A girl gardener. Ivory blouse with soft puff sleeves, a short olive-green apron with a broad seed pocket over brown shorts, brown gloves and boots. Preserve the approved broad apron silhouette and visible legs. One continuous warm-gold stripe along the apron hem, at least 8 clearly gold pixels in the front 64x64 view. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-F4 · ชาวประมงริมน้ำหญิง

ไทย: ชุดชาวประมงริมน้ำหญิง ตาม B0b 4ข พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[1443, 252, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A girl riverside fisher. Ivory blouse with soft puff sleeves, a flared muted blue-green skirt, a small woven net pouch, brown gloves and boots. One continuous warm-gold stripe along the skirt hem, at least 8 clearly gold pixels in the front 64x64 view. The blue-green cloth is matte, without luminous effects. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-M1 · ศิษย์ตะเกียงชาย

ไทย: ชุดศิษย์ตะเกียงชาย ตาม B0b 1 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[243, 595, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A boy lantern apprentice. Ivory straight-sleeved shirt with a short split hem, dark brown trousers and sturdy tall brown boots, leather gloves. Preserve the approved trouser silhouette. Strengthen one continuous warm-gold stripe on the exposed lower shirt edge across the front, at least 8 clearly gold pixels at 64x64, clear of the belt, scarf and hands. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-M2 · นักสำรวจชาย

ไทย: ชุดนักสำรวจชาย ตาม B0b 2 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[543, 595, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A boy explorer. Ivory rolled-sleeve shirt, straight brown vest, brown knee-length shorts, leather map pouch, gloves and brown boots. Strengthen one continuous warm-gold stripe along the lower vest edge, at least 8 clearly gold pixels at 64x64, clear of the scarf and belt buckle. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-M3 · ชาวสวนชาย

ไทย: ชุดชาวสวนชาย ตาม B0b 3 พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[843, 595, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A boy gardener. Ivory rolled-sleeve shirt under straight olive-green bib overalls with two separate trouser legs, seed pockets, brown gloves and boots. One continuous warm-gold stripe across the upper bib pocket edge, at least 8 clearly gold pixels at 64x64, fully below and separate from the scarf tails. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

### O-M4 · ชาวประมงริมน้ำชาย

ไทย: ชุดชาวประมงริมน้ำชาย ตาม B0b 4ข พร้อมผ้าพันคอใหญ่ ตะเกียงทอง และขอบทองตามตำแหน่งที่ระบุ.

อ้างอิง: `kid-outfits-b0b.png` ช่อง `[1443, 595, 64, 64]` เน้นชุด + style 64 ตามค่ากลาง; ใช้หัวช่วยเท่านั้น.

เครื่องมือ/ค่า: `create_character` · Humanoid / Pro Flash · 64×64 · 8 directions / Low Top-Down · standing · dark outline / upper-left light / medium detail · เจน **1 ครั้ง**, ประมาณ **6–8 generations**.

```text
Original friendly child age 7-8, oversized chibi head, small body, standing idle with empty hands. A boy riverside fisher. Ivory rolled-sleeve shirt, straight muted blue-green vest, rolled brown trousers, high brown boots, woven net pouch and gloves. Strengthen one continuous warm-gold stripe along the lower vest edge, at least 8 clearly gold pixels at 64x64, clear of the scarf and belt. Enlarge the belt lantern so its gold-pixel bounding box is at least 4 pixels wide, never 3, and at least 6 pixels tall. Keep the approved outfit concept and its proportions. Ivory cloth, warm brown leather and modest house-color accents. Add a large golden-yellow house scarf with a clear neck knot and TWO separate tails hanging down the chest: at least 60 house-color pixels in front, at least 30 in every other view; show a rear wrap and folded ends from behind. Scarf yellow must use a separate color ramp from fixed gold trim. A small warm gold-and-orange lantern hangs visibly from the leather belt beside a small pouch: its GOLD PIXELS must span at least 4x6 pixels and total at least 12 at native size; no blue light. The trim stripe is separate from scarf, lantern and buckle. No cape, cloak or hat. Use a gentle smiling face with short neutral hair above the collar as a removable head guide; ears and neck visible. Low top-down camera, all eight standing directions in consistent 64x64 frames, centered at x32, soles on row 62, painted height 60-62 pixels. Preserve front, side and rear clothing construction; connect the neck fully, no holes. Match the supplied style image only for continuous dark outlines, crisp pixel clusters, upper-left light, three to four shading steps and readable medium detail. Transparent background, no floor, shadow, text, weapons or extra objects. Clearly separated color groups for skin, cloth, leather, house scarf and fixed gold trim. Back-facing guide heads show no eyes or mouth.
```

## ตา 5 / ปาก 5 · แผนเพิ่ม 0 งานเจน

ใช้ผลหัวที่ต้องเจนอยู่แล้วเป็นต้นทาง เลือกจากรหัสหลักด้านล่างก่อน หากมีตำหนิให้ใช้รหัสสำรองที่อยู่ใน 16 งานเดิม; ไม่เรียก generator เพิ่มเพื่อสุ่มหาแบบ.

| ชั้น | แบบ | ต้นทางหลัก / สำรอง | การเตรียมชิ้น |
|---|---|---|---|
| eyes-1 | กลมประกาย | H-F1 / H-M1 | เก็บตาคู่และคิ้วอ่อนโยน พร้อมประกายขาว |
| eyes-2 | ยิ้มโค้ง | H-F3 / H-M3 | โค้งปิดเท่ากันสองข้าง; ไม่เพิ่มรูม่านตาปลอม |
| eyes-3 | โตตกใจ | H-F2 / H-M2 | ตาเปิดกลมโตเท่ากัน คิ้วเลิก |
| eyes-4 | ครึ่งปิดอ่อนโยน | H-F7 / H-M7 | ระดับเปลือกตาเท่ากัน มีรูม่านตา |
| eyes-5 | มุ่งมั่น | H-F8 / H-M8 | คิ้วมั่นใจไม่ขมวด คงความเป็นเด็ก |
| mouth-1 | ยิ้มกว้างเห็นฟัน | H-F1 / H-M1 | แถบฟันขาวชัด อยู่ในพื้นที่ปาก |
| mouth-2 | ยิ้มเล็ก | H-F5 / H-M5 | เส้นยิ้มเล็กสงบ |
| mouth-3 | อ้าปาก โอ | H-F2 / H-M2 | ปากกลมเปิด แยกจากผิว |
| mouth-4 | ยิ้มแมว | H-F6 / H-M6 | เส้นโค้งคู่ อ่านออกที่ 1× |
| mouth-5 | ยิ้มมุมปาก | H-F4 / H-M4 | ข้างที่ยกคงเดิมเมื่อหมุน ไม่ mirror สลับข้าง |

ขั้นตอนหลังได้รับภาพ:

1. ใช้โครงหน้า/หนังศีรษะของ H-F1 เป็นแม่แบบร่วม 8 ทิศ ทำหน้าฐานว่างโดยเอา pixels ตา/คิ้ว/ปากออกและเติมผิวตามระดับเงาเดิมอย่างต่อเนื่อง รวมพื้นที่ใต้ผมด้วย; ไม่เจนหน้าเปล่าเพิ่ม ไม่ใช้หน้า 16 รูปที่ขนาดต่างกันมาซ้อนกันโดยไม่จัดตำแหน่ง.
2. แยกตาพร้อมคิ้วและปากตาม mask จากภาพต้นทาง ไม่ตัดสี่เหลี่ยมที่มีสีผิว/ปอยผมติดมา เก็บประกาย/ฟันเป็นสีคงที่ ส่วนม่านตาใช้กลุ่ม `eye` ที่โค้ดเปลี่ยนสีได้. ทำเฉพาะ S/SE/E/W/SW ที่มองเห็นหน้า; NE/N/NW เป็นชั้นตาและปากว่าง.
3. เกลาทั้ง 10 ชิ้นในกริดแม่แบบเดียวต่อทิศ รักษาขนาดตาคู่และตำแหน่งปาก ไม่ stretch ทั้งชิ้น ไม่กลับด้านทรงไม่สมมาตร; รวมได้ 5×8=40 ช่องตา และ 5×8=40 ช่องปาก โดย 15 ช่องหลังของแต่ละชุดว่างอย่างตั้งใจ.
4. ทำ palette ผิว 4 ระดับด้วยโค้ดจากหน้า/คอ/มือชุดเดียว ไม่เรียก PixelLab 4 รอบ สี `skin`/`hair`/`eye` ไม่ใช้ RGB ซ้ำกับกลุ่มอื่น (รวม outline ของกลุ่ม); แว่นและผ้าคาดหัวคงแยกทีหลัง.
5. ตรวจประกอบผม 16 × ตา 5 × ปาก 5 × ชุด 8 × ผิว 4 = **12,800 แบบ**, ยืน 8 ทิศ = **102,400 กรณี** ก่อนรับ B2: หนังศีรษะโผล่ 0, ตา/ปากนอกหน้า 0, ทิศหลังตา/ปาก 0, ตาที่ควรมองเห็นถูกผมบังไม่เกิน 30%, คอต่อสนิท, ช่องโหว่ 0, กึ่งใส 0, regions ครบและสีผิดกลุ่ม 0. ไม่นับตาปิดยิ้มว่าเป็นตาหาย; มุมข้างนับเฉพาะตาที่ควรมองเห็นตามทิศ.
6. ตัวเลขข้างต้นเป็นแผนตรวจ ไม่ใช่ผลตรวจรอบนี้ หากต้นทางใช้ทำชิ้นไม่ได้หรือเกลาแล้วไม่สวย ส่งภาพ/ข้อขัดข้องก่อนเสนอเจนเพิ่ม ไม่เติมเครดิตเผื่อ retry เงียบ ๆ.

## งานท่าทางหลังยืนผ่าน — แยกจากงบ 24 งานนี้

หัววาด 8 ทิศครั้งเดียว ใช้ซ้ำกับทุกท่าด้วย `headOffset(dx,dy)`; ผมยาวอยู่ชั้นหลังตัวตามทิศ. ชุด 8 แบบต้องมีเดิน 6×8=48 เฟรม, ท่าหันหน้า 5 ชนิด (ไหว้/โบกมือ/ดีใจกระโดด/ปรบมือ/คิด) ชนิดละ 4=20 เฟรม และนั่ง 8 ทิศ รวมเพิ่ม **76 เฟรมต่อชุด / 608 เฟรม** นอกเหนือท่ายืน 64 เฟรม. ไม่มีท่าตี. เท้ายืน/เดินเทียบแถว 62; ท่ากระโดดหรือนั่งบันทึก anchor และ offset ตามการเคลื่อนไหว ไม่ยืดร่างให้เท้าติดแถวเดิมทุกเฟรม.

ยังไม่เรียก `animate_character` หรืออนุมัติค่าใช้จ่ายท่าเหล่านี้ใน B1: ต้องตรวจ schema ที่รองรับจำนวนเฟรม/นั่ง/ท่ามือและราคา แล้วเสนอจำนวนงาน/งบแยกหลังภาพยืนผ่าน. ไม่สมมติว่า 24 การเจนหัว/ชุดรวมแอนิเมชันด้วย. JSON ที่เกมโหลดเขียนแบบไม่เว้นบรรทัด ≤300 KB; หลักฐานตรวจอยู่ไฟล์ `-qa.json` ในขั้น B2 ไม่ใส่หลักฐานขนาดใหญ่ใน runtime JSON.

## สรุปจำนวนและงบเพื่ออนุมัติ

หน่วย `generations` ในคู่มือคือโควตา ไม่ใช่จำนวน MCP calls: 1 งาน Pro Flash ได้ 8 ทิศ แต่คิดประมาณ 6–8 หน่วย. ไม่มีการอ้างว่า read/poll/download เป็นการเจนเพิ่ม.

| รายการ | งานเจน | ภาพทิศที่คาด | งบประมาณ generations |
|---|---:|---:|---:|
| หัว 16 (ตัวเต็มช่วยจัดแนว แล้วแยกหัว) | 16 | 128 | 96–128 |
| ชุดหญิง 4 + ชาย 4 | 8 | 64 | 48–64 |
| หน้าว่าง/ตา 5/ปาก 5 จากผลเดิมและเกลาพิกเซล | 0 | 80 ช่องตา/ปากที่จัดแพ็กเอง | 0 |
| เปลี่ยนสีผม/ตา/ผิวด้วยโค้ด | 0 | ไม่เจนภาพเพิ่ม | 0 |
| **รวมงานยืนที่ขออนุมัติ** | **24** | **192 ภาพทิศจากบริการ** | **144–192** |
| ท่าเดิน/ท่าทาง/นั่งและการเจนซ้ำ | **0 ที่อนุมัติในเอกสารนี้** | แยกงานภายหลัง | **ยังไม่รวม/ยังไม่ทราบราคาจริง** |

ยอดอ้างอิงล่าสุดที่มีหลักฐานใน ASSET_SPEC_08 ฉบับ 6 คือ **3,209** ไม่ใช่ยอดสดที่ตรวจวันนี้: ถ้ายอดยังเท่าเดิม งบนี้เหลือ **3,065–3,017** หลังเจนยืนครบ 24 งาน; ใช้เพดานประมาณ **192 / 3,209 = 5.98%**. ต้องอ่านยอด/ราคาจริงก่อนใช้เครดิตและรายงานยอดก่อน–หลังแต่ละงาน เก็บ ID งานเพื่อตรวจผลเดิมเมื่อการเชื่อมต่อขาด. รอบส่ง B1 ใช้จริง **0**.

เจ้าของอนุมัติพรอมป์และเพดานงานยืนนี้ก่อน จึงเริ่มเจนผ่าน MCP ตาม schema/ราคาที่ตรวจแล้ว หากราคา/เครื่องมือเปลี่ยนจนเกินแผนให้รายงานก่อน ไม่สลับไปใช้โหมดที่แพงกว่าเอง. คะแนนความสวยยังให้โดยเจ้าของ; การรับเอกสารไม่ใช่การรับภาพที่ยังไม่ได้เจน.
