# ASSET_SPEC_02_key_adult.md — ชุดที่ 2 ฉบับ 3: ผู้ใหญ่ชายช่อง 72 (ตัวที่เจ้าของเลือก) · ท่าเดิน · สีกุญแจ (Claude → Codex/เจ้าของ · 9 ต.ค. 2569 23:00 · ฉบับ 3)

**ฉบับนี้แทนฉบับ 2 (ผู้ใหญ่ช่อง 128 ตัวเสื้อเขียว) และฉบับ 1 (เด็กผมเปีย) ทั้งหมด**

## 0. หัวเรื่อง
- **ที่มา (9 ต.ค.)**
  - 17:25 เจ้าของอยากเปลี่ยนต้นแบบเป็นนักดาบผู้ใหญ่ · ลองใน GM หลายขนาด (รุ่น 2.01–2.04)
  - 128 (ตัวสูง 121) และ 96 (ตัวสูง 92) ตัวใหญ่เกินเมื่อเทียบ NPC ผู้ใหญ่และของในบ้าน
  - วัดแล้ว NPC ทุกตัว (ลีอา แม่/เจ้าหญิง พ่อ ยายนวล) และเด็กผู้เล่น สูง 61–62 px ในช่อง 64 ฉากและของในบ้านทำมาให้ขนาดนี้
  - **22:57 เจ้าของตกลงใช้ช่อง 72 แบบหัวโต รอบที่ 2 ("72 ก")** = `gm-adult-204a.png` ใน repo
- **ตัวที่เลือกมีสีกุญแจอยู่แล้ว** (ผมเขียว ตาฟ้าเขียว เสื้อบานเย็นอมแดง) **จึงไม่ต้องสร้างตัวใหม่** ทำท่าเพิ่มจากตัวนี้ได้เลย
- **ทำ 3 ขั้น · ตอนนี้ทำขั้น A**
  - **ขั้น A (ตอนนี้):** ท่าเดิน 8 ทิศ ของตัว "72 ก" ใน PixelLab
  - **ขั้น B:** ท่ายืนหายใจ ท่าตี · และ (เมื่อ Codex พร้อม) แปลงผิวเป็น 4 ค่าตรงตัว เพื่อเปิดปุ่มเปลี่ยนสีผิว
  - **ขั้น C:** ผู้ใหญ่หญิงช่อง 72 และเด็กชาย/หญิงช่อง 64 แนวเดียวกัน (พรอมป์หัวโตชุดเดียวกัน) · Claude ออกฉบับ 4 หลังขั้น A ผ่าน
- **ตัดออกจากแผน:** ปุ่มเปลี่ยนสีปาก (ปากมีแค่ 1–2 พิกเซล เปลี่ยนสีไปก็มองไม่เห็น)

## 1. ไฟล์ที่ต้องส่ง (ขั้น A)
| ไฟล์ | ชนิด | เนื้อหา |
|---|---|---|
| ZIP ที่ดาวน์โหลดจาก PixelLab ของตัว "72 ก" หลังเพิ่มท่าเดิน | ZIP ตามที่ PixelLab ให้ ห้ามแก้ภาพ | `metadata.json` + `rotations/` 8 ทิศ + โฟลเดอร์ท่าเดิน 8 ทิศ |
- Claude เป็นคนเรียงเป็นแผ่นภาพของเกมเอง (`adult-m-72-walk.png` · เฟรมกว้าง/สูงตามจริง × 8 แถว) · Codex/เจ้าของไม่ต้องเรียง

## 2. ขนาดและมาตราส่วน
- 32 px = 1 ช่องพื้น · ช่องภาพ 72×72 · ตัวสูง 66–72 px (ไฟล์ที่เลือกสูง 68–70)
- PixelLab อาจขยายช่องของท่าเดินเองเมื่อท่ากว้างกว่าเดิม ("Animations automatically get a larger canvas") → **ส่งตามที่ได้ ห้ามย่อ/ตัด** Claude วัดเส้นเท้าทุกเฟรมเอง
- ความสูงตัวในท่าเดินต้องต่างจากท่ายืนทิศเดียวกันไม่เกิน 3 px

## 3. เฟรมและลำดับ
- ท่าเดิน: **8 ทิศ** จำนวนเฟรมตามที่ PixelLab ให้ (ปกติ 6 หรือ 8) · ทุกทิศต้องเท่ากัน
- ลำดับทิศในเกม: ใต้ · ใต้-ขวา · ขวา · บน-ขวา · บน · บน-ซ้าย · ซ้าย · ใต้-ซ้าย (Claude จับคู่จากชื่อโฟลเดอร์ `south` `south-east` … เอง)
- เดินวนต่อกันได้ไม่สะดุด (เฟรมสุดท้ายต่อเฟรมแรก)

## 4. จุดยึด
- แถวล่างสุดที่ไม่ใส (ปลายรองเท้า) ของท่ายืน 69–72 · ของท่าเดินห่างจากท่ายืนไม่เกิน 3 px (เท้ายกขึ้นตอนก้าวได้)
- ตัวไม่เลื่อนซ้าย-ขวาเกิน 4 px ระหว่างเฟรม (เดินอยู่กับที่ เกมเป็นคนเลื่อนตัว)

## 5. สีกุญแจ (ฝั่งโค้ด · ไม่ต้องวาดใหม่)
| ส่วน | สีในตัว "72 ก" | วิธีของเกม |
|---|---|---|
| ผม | เขียว hue ~70–170° | Claude ปรับช่วงสีของ `keyFix` ให้ตัวนี้ แยกด้วยตำแหน่งบนหัว (เพราะเงาผมเขียวเข้มไปชนช่วงสีตา) |
| ตา | ฟ้าเขียว | แยกด้วยตำแหน่งในหน้า |
| เสื้อคลุม (สีบ้าน) | บานเย็นอมแดง hue ~300–340° | Claude ขยายช่วงสีของ `recolorKey` ให้ตัวนี้ โดยไม่แตะปากและแก้ม |
| ผิว | ส้มอ่อนตามที่ PixelLab ให้ | **ขั้น B:** Codex แปลงเป็น 4 ค่า `#FCE0C8` `#F2BE98` `#DC966E` `#B06A4C` (สคริปต์เดียวใช้ทุกเฟรม) |
- ท่าเดินที่ PixelLab ทำจากตัวนี้จะใช้สีชุดเดิม จึงเปลี่ยนสีได้ด้วยวิธีเดียวกัน

## 6. วิธีทำใน PixelLab (เจ้าของทำเองได้ ไม่ต้องรอ Codex)
1. เปิดตัว "72 ก" (adult_male_swordsman_front_view รอบที่ 2 สร้าง 22:29 · ขนาด 72×72) ในคลังตัวละคร
2. กด **Add Animation** → เลือกแบบ **Template** → **Walking** (หรือ Walk) → ทำ **8 ทิศ**
3. ถ้ามีให้เลือกโครงกระดูก ให้ใช้แบบเดียวกับตัวละคร (ค่าที่ PixelLab ตั้งให้)
4. ดาวน์โหลด ZIP ทั้งตัว แล้วส่งให้ Claude
- ห้ามคำ scary evil demonic blood ถ้ามีช่องพิมพ์คำบรรยายท่า

## 7. ภาพสำรองเมื่อไฟล์หาย (Claude เขียนในโค้ด)
- ไม่มีไฟล์ท่าเดิน → ใช้ท่ายืน 8 ทิศที่มีอยู่ (`gm-adult-204a.png`) แบบเลื่อนตัว + ขยับขึ้นลง 1 px เหมือนรุ่น 2.04
- ไม่มีไฟล์ตัวนี้เลย → ผู้เล่นใช้ตัวเดิม
- แสดงเฉพาะใน GM จนเจ้าของอนุมัติให้ผู้เล่นเห็น

## 8. เกณฑ์รับงาน (Claude วัดด้วยสคริปต์)
1. ครบ 8 ทิศ ทุกทิศจำนวนเฟรมเท่ากัน (≥ 4) · ไม่มีเฟรมว่าง (ทุกเฟรม ≥ 2% ของช่องไม่ใส)
2. ความสูงตัวทุกเฟรม 64–74 px · ต่างจากท่ายืนทิศเดียวกัน ≤ 3 px
3. เส้นเท้าทุกเฟรมห่างจากท่ายืน ≤ 3 px · ตัวเลื่อนซ้าย-ขวาระหว่างเฟรม ≤ 4 px
4. หน้าเหมือนท่ายืน: สีผม สีตา สีเสื้อ ชุดเดียวกัน (นับสีที่ไม่เคยมีในท่ายืน ≤ 5% ของพิกเซล)
5. เดินในเกม 8 ทิศด้วยจอยจริง: เดินได้ทุกทิศ ≥ 40 px ใน 0.5 วินาที · เฟรมเรตไม่ตกเกิน 10% จากรุ่นก่อน
6. เจ้าของดูใน GM: ท่าเดินเป็นธรรมชาติ ≥ 8.5 (ชุด/ท่า) · หน้า ≥ 9.5 คงเดิม

## 9. วิธีส่ง
- ส่ง ZIP ผ่านเจ้าของมาที่แชท Claude (หรือ branch `codex/asset-02-key-adult` ถ้า Codex ทำ) · ไม่ push เข้า `main`
- ถ้า Codex ทำ เพิ่ม 1 บรรทัดใน `CODEX_STATUS.md`: `ชุด 02 ฉบับ 3 · รุ่น A1 · วันที่ · ไฟล์ … · ต่างจากสเปก: ไม่มี/ระบุ`
- ถ้าข้อใดทำไม่ได้ (เช่น PixelLab ไม่มีท่าเดินแบบ 8 ทิศ) ให้บอก แล้วรอฉบับแก้

## 10. พรอมป์ขั้น C (Claude · 10 ต.ค. 00:55 · ทำคู่กับขั้น A ได้เลย)
ตั้งค่าทุกตัว: Create from Text · Humanoid · Standard (โหมดเดียวกับ 72 ก) · Low Top-Down · Highly detailed · Outline Default · ใช้คำบรรยายหน้าและสีกุญแจชุดเดียวกับ 72 ก เพื่อให้หน้าตาเป็นครอบครัวเดียวกันและเกมเปลี่ยนสีได้
- **ผู้ใหญ่หญิง · ช่อง 72×72**
```
adult female swordswoman, front view, standing idle, empty hands, no weapon, nothing on her back, cute chibi proportions with a big head about one third of her height, big round bright cyan eyes with a dark upper lash line and a white shine, small friendly smile, long bright grass-green hair in a high ponytail that does not cover the eyes, long bright magenta coat with gold trim, white blouse, brown leather straps and belt with gold buckle, steel shoulder armor on her right shoulder only, ruby red collar clasps, brown leather gloves with gold cuffs, dark brown leggings, brown leather boots with gold knee guards, fantasy magic academy style, clean dark outline
```
- **เด็กชาย · ช่อง 64×64**
```
young boy student about 10 years old, front view, standing idle, empty hands, no weapon, nothing on his back, cute chibi proportions with a big head, big round bright cyan eyes with a dark upper lash line and a white shine, cheerful smile, short messy bright grass-green hair that does not cover the eyes, short bright magenta cape with gold trim, white shirt, brown leather belt with gold buckle, dark brown shorts, brown leather boots, fantasy magic academy style, clean dark outline
```
- **เด็กหญิง · ช่อง 64×64**
```
young girl student about 10 years old, front view, standing idle, empty hands, no weapon, nothing on her back, cute chibi proportions with a big head, big round bright cyan eyes with a dark upper lash line and a white shine, cheerful smile, bright grass-green hair in two short braids that do not cover the eyes, short bright magenta cape with gold trim, white blouse, brown leather belt with gold buckle, dark brown skirt over leggings, brown leather boots, fantasy magic academy style, clean dark outline
```
- เกณฑ์รับ: ผู้ใหญ่หญิงสูง 66–72 px · เด็กสูง 58–63 px (เท่าลีอา 61) · ผมเขียว ตาฟ้า ผ้าคลุม/เสื้อบานเย็น · ไม่มีอาวุธหรือของสะพายหลัง · หน้า ≥ 9.5 เมื่อเจ้าของดูใน GM
