# T9 — ตรวจไฟล์รูปหน้าใหญ่และผลกติกา v1.1

ฐาน: claude/g2-pilot @56d3d8c · วันที่ 1 พ.ย. 2569 (UTC+7) · เครดิต 0

ใช้ `pt_mask_ref.py` ที่ฐานนี้สร้างภาพและ mask ตามข้อ 3.4 ไม่ได้อ้างว่าเป็น implementation อิสระ ส่วนตรวจด้วยตาด้านล่างตรวจภาพที่ส่งจริงและภาพขยายเปรียบเทียบเอง เครื่องตรวจเทียบกับ reference เดียวกันจึงไม่ได้พิสูจน์ความหมายวัสดุโดยลำพัง

แก้ RGBA เฉพาะรูสองกรอบ รวม 50 จุดเป็น #2E0A27/255; edits ย้อนกลับได้ตรงต้นฉบับ ไม่มีการแก้จุดอื่น ไม่มีการปรับขนาดภาพผลิต ไม่มีสีใหม่ในพิกเซลที่เดิมทึบ ภาพขยายเป็นภาพตรวจเท่านั้น

## ตรวจด้วยตาตามข้อ 3.5

เปิด pt-mask-ids.png เทียบภาพจริงทั้งภาพและขยายเฉพาะหน้า เข็มกลัด หัวเข็มขัด และปลอกแขน; กรอบพิกัดด้านล่างรวมปลายทั้งสองด้าน

| บริเวณที่ตรวจ | ผลจากภาพที่ส่ง |
|---|---|
| ตาซ้าย [140,129,182,157] / ขวา [210,129,247,157] | ขอบตา รูม่านตา ตาขาวและประกายเป็น 2; ม่านตาสีเขียวเป็น 5; ส่วนผิวในกล่องเป็น 3 ไม่พบจุดผิดวัสดุชัดเจน |
| คิ้วซ้าย/ขวา [140,120,247,128] | เส้นคิ้วสีน้ำตาลต่อเนื่องเป็น 4 รวมจุด (175,126),(215,126); ไม่ถูกเปลี่ยนตามสีตา |
| ขอบหน้า–ผม [135,78,255,193] | ผม 4 ผิว 3 เส้นคั่น 11; เงาตามรอยผมแบ่งตามกติกา ไม่พบปื้นผมถูกส่งไปสีผิวชัดเจน |
| หู [117,134,121,152] / [266,134,270,156] | ส่วนสว่างเป็นผิว 3 ไม่กลายเป็นผม |
| คอ [182,191,209,220] | ผิว 3 ระหว่างปกผ้าคลุม 8 อ่านต่อกับใบหน้า |
| ปลายผม [103,181,107,185] / [280,181,284,185] | ทั้ง 50 จุดที่เติมเป็นผม 4 ไม่เหลือช่องใส |
| ปก/ขอบผ้าคลุม [75,191,319,383] | ผ้าสีน้ำเงินเป็น 8 เส้นแบ่งเป็น 11/ขอบนอก 1 ไม่พบก้อนผ้าหรือหนังบนผ้าคลุมที่ผิดชัดเจน |
| เข็มกลัด [173,221,214,257] | พื้นโลหะและรูปโคมกลางเป็น 9 กรอบยังอ่านได้; ไม่ตีความแสงในรูปโคมเป็นวัสดุเรืองแสงใหม่ |
| กระดุม [196,267,203,275], [196,290,203,298], [194,345,202,354] | โลหะ 9 บนผ้า 6 ครบสามเม็ด |
| เข็มขัด [140,305,245,349] | สายหนัง 7 หัว 9; มีข้อสังเกตพื้นที่ภายในหัวเข็มขัด V1 ด้านล่าง |
| ปลอกแขน/ถุงมือ [76,309,142,383] / [248,309,313,383] | หนัง 7 ผ้าข้อมือ 6 ผ้าคลุม 8 และเส้นแบ่ง 11 แยกกัน ไม่พบจุดผิดวัสดุใหม่ชัดเจน |

## ข้อสังเกตให้ Claude ตัดสิน — 1 บริเวณ (ไม่ได้แก้ mask)

**V1: ภายในหัวเข็มขัด [190,313,200,326]** — ได้ ID 9 ทั้งบริเวณตามกล่อง copper; ตัวอย่าง (193,315) #461625, (199,319) #3D1123. จากรูปทรงมองได้ว่าเป็นสายหนังที่ลอดด้านในหัวเข็มขัด จึงเสนอ **ID 7 เฉพาะส่วนหนังด้านใน** หาก Claude ยืนยันการตีความนี้; กรอบและเดือยทองแดงยังควรเป็น 9. เหตุผลคือบริเวณมืดอยู่ในช่องสี่เหลี่ยมกลางกรอบ ไม่ใช่แถบโลหะขอบบน/ล่าง และต่อแนวกับสายหนังรอบหัว. นี่เป็นข้อสงสัยด้านวัสดุ ไม่ใช่ข้อผิดพลาดเชิงตัวเลขที่ยืนยันแล้ว; หากแบบตั้งใจเป็นหัวทึบโลหะก็อาจคง 9 ได้. ส่งภาพ/กติกาเดิมตรง 100% ให้ Claude ตัดสินตามข้อ 3.5 ไม่ปรับกติกาเอง

จุดสว่างขอบเดิมที่ x75/x98/x289 และผมบนขวา (252,39),(257,40–42) คงไว้ตามข้อ 3.5 ไม่มีการเกลาต้นฉบับเพิ่ม

## ตัวเลข

opaque 70,133 · รูในตัว 0 · กึ่งใส 0 · ขอบนอก 1,172 · จุดใกล้ขาวบนขอบ 0 · R/G ต่างจากกติกา 0/0 · checkpoint 35/35 · source SHA-256 28c4bb6e65a975931dc467e7173842ca1f4ae819d8d9bfab608825d8257f94ef

ID 1–11: 3,624 / 1,657 / 5,766 / 18,439 / 227 / 11,788 / 5,705 / 13,785 / 1,736 / 498 / 6,908. ID 10 ปาก 122 / แก้ม 376. พื้นใส 77,323

คำสั่งใช้ Python ของ /tmp/t7-venv ซึ่งมี dependencies พร้อม; เครื่องตรวจและ reference เป็นไฟล์ pinned @56d3d8c ไม่ได้แก้

### QA — exit 0

```text
PASS 4.1a source file unchanged (SHA-256) | "28c4bb6e65a975931dc467e7173842ca1f4ae819d8d9bfab608825d8257f94ef"
PASS 4.1b c2-pilot-kid4-pt.png is 384 x 384 RGBA, alpha only 0 / 255 | {"size": [384, 384], "mode": "RGBA", "alpha": [0, 255]}
PASS 4.2a pixels that differ from the source = exactly the 50 hole pixels, each now #2E0A27 alpha 255 | {"differ": 50, "extra": [], "missing": []}
PASS 4.2b edits json: 50 entries, no repeats, = the hole set, before/after match the images, why = hole-left/right · replay = c2-pilot-kid4-pt.png · revert = source | {"entries": 50, "unique": 50}
PASS 4.3 enclosed transparent areas 0 · half-transparent 0 · opaque 70133 · exterior ring 1172 px · near-white (all > 230) on it 0 | {"enclosed": 0, "opaque": 70133, "ext_ring": 1172, "near_white_on_ring": 0}
PASS 4.4a mask 384 x 384 · A 255 exactly on the opaque pixels of c2-pilot-kid4-pt.png · transparent pixels (0,0,0,0) · B 0 everywhere | {"size": [384, 384], "A_mismatch": 0, "B_nonzero": 0, "transparent_not_zero": 0}
PASS 4.4b R = material id 1-11 on every opaque pixel and = the rule result (pt-rules.json) at 100 % | {"wrong_px": 0, "first_x_y_got_want": []}
PASS 4.4c G = shade rank by Y in each material (id 10: mouth 0-15 / cheek 16-31) and = the rule result at 100 % | {"wrong_px": 0, "first": []}
PASS 4.4d mask json: schema 1, file names, image SHA, every material shade list (dark -> light) and px count = the rule result · every pixel colour = json shade at its (R, G) · px total = opaque | {"materials": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], "pixels_not_matching_json": 0, "px_total": 70133}
PASS 4.4e 35 hand-picked check points (eyes, iris, cheeks, mouth, brows, ears, neck, hair, holes, cape, shirt, copper, leather, lines) have the id Claude chose by eye | []
PASS 4.4f review images present and readable: qa/g2-3-portrait/img/pt-edits-x4.png, qa/g2-3-portrait/img/pt-mask-ids.png | ["qa/g2-3-portrait/img/pt-edits-x4.png", "qa/g2-3-portrait/img/pt-mask-ids.png"]
11/11
```

### Self-test — exit 0

```text
OK   correct set -> expect all PASS | failed: 
OK   one skin pixel labelled hair -> expect FAIL 4.4b | failed: 4.4b,4.4d,4.4e
OK   one G off by 1 -> expect FAIL 4.4c | failed: 4.4c,4.4d
OK   one extra pixel edited -> expect FAIL 4.2a | failed: 4.2a,4.2b,4.4d
OK   one hole pixel left open -> expect FAIL 4.3 | failed: 4.2a,4.2b,4.3,4.4d,4.4e
OK   mask alpha off on one pixel -> expect FAIL 4.4a | failed: 4.4a
OK   B channel set -> expect FAIL 4.4a | failed: 4.4a
OK   edits json missing one entry -> expect FAIL 4.2b | failed: 4.2b
OK   hair shades out of order in json -> expect FAIL 4.4d | failed: 4.4d
OK   cheek pixel marked as mouth -> expect FAIL 4.4c | failed: 4.4c,4.4d
OK   pupil labelled cape -> expect FAIL 4.4b | failed: 4.4b,4.4d,4.4e
OK   hole filled with the outline colour -> expect FAIL 4.2a | failed: 4.2a,4.2b,4.4d
OK   review image missing -> expect FAIL 4.4f | failed: 4.4f
selftest 13/13
```

S5 สีรั่ว 640 ชุด/หน้าทดลองมือถือ/ชุดสีทั้ง 16 ยังไม่อยู่ในงาน T9 จึงไม่ได้รายงานว่าได้ทดสอบหรือรับงานแทนเจ้าของ

ต่างจากสเปก: ไม่มี — ข้อสงสัย V1 บันทึกตามข้อ 3.5 โดยคงผลกติกาเดิม
