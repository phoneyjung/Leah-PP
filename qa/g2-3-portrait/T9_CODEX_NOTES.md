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


## T13 — ล้างเศษนอกเส้นขอบตามฉบับ 1.2 (D-PT-4)

1 พ.ย. 2569 · ฐาน `e5104c5` · branch `codex/t13-pt-debris` · เครดิต 0

เริ่มจากภาพ T9 หลังปิดรู 50 จุด ยืนยันตรงผลปิดรูจากต้นฉบับทุกพิกเซล คำนวณรายการเศษและตัดสินล้าง/ทาเส้นพร้อมกันจากภาพเดิมเพียงรอบเดียวด้วยเครื่องมือชั่วคราวของ Codex ผลตรง `pt_mask_ref.py` 106/106 จุด จากนั้นใช้ reference ตามข้อ 3.4 สร้าง R/G และรายการสีใหม่ ไม่อ้างว่า mask เป็น implementation อิสระจากเครื่องตรวจ

- ใหม่รอบนี้: ล้าง 88 จุดเป็น (0,0,0,0) + ทาเส้น 18 จุดเป็น #12001E/255 รวม 106 จุด / 28 กลุ่ม (8 ทิศ)
- edits รวม 156 รายการ = hole-left 25 + hole-right 25 + debris-clear 88 + debris-line 18 ไม่ซ้ำ; before อ้างอิงต้นฉบับ src เดิม; ย้อนกลับได้ครบ
- ภาพต่างจาก T9 เฉพาะ 106 จุด; ต่างจาก src 156 จุด; นอกชุดที่อนุมัติ 0 จุด ไม่มีการย่อ/ขยายภาพผลิต
- ทึบ 70,045; รูใสภายใน 0; กึ่งใส 0; ขอบนอก 1,161; จุดใกล้ขาวบนขอบ 0; เศษตามกติกาเหลือ 0
- mask R/G ต่างจากกติกา 0/0; checkpoint 35/35; ผม 24 สี ผ้าคลุม 10 สี; เส้นเดิมสีไม่เปลี่ยน 245 จุดเปลี่ยน ID ตามกติกาหน้ากากเดิมหลังล้าง (ไม่ใช่การแก้ภาพเกินขอบเขต)
- ID 1–11 = 3,848 / 1,657 / 5,766 / 18,361 / 227 / 11,761 / 5,704 / 13,757 / 1,736 / 498 / 6,730; พื้นใส 77,411
- `c2-pilot-kid4-pt-shademap.json` ตรงฐานทุกไบต์ ไม่สร้างใหม่ ไม่รัน S5/หน้าทดลองด้วยตารางเก่าที่จำนวนเฉดไม่ตรงแล้ว งานสร้าง map ใหม่เป็นของ Claude หลังรับ T13

### ดูด้วยตาจากไฟล์ส่งจริง

เปิดภาพหลังล้างขยาย 3 เท่า ภาพวัสดุพร้อมต้นฉบับ 2 เท่า และภาพก่อน/หลังเฉพาะทั้ง 28 กลุ่มที่ขยาย 5 เท่า (ภาพตรวจชั่วคราวอยู่ /tmp เท่านั้น)

| บริเวณ | ผลที่เห็น |
|---|---|
| บนหัว (154–167,25), (215–223,25) และขอบซ้ายบน (113–116,63) | เส้นสีฟ้าที่อยู่นอกขอบหาย เหลือเส้นเข้มเดิมต่อกับรูปหัว |
| ขวาบน (252,39), (257,40–42) และข้างผม x98 / x289 | จุดสว่างที่ยื่นนอกเส้นหาย ขอบผมยังต่อเนื่อง ไม่เห็นช่องแหว่งใหม่ |
| ปลายผมที่รูเดิมสองกรอบ (103–107,181–185), (280–284,181–185) | เงาผมที่เติมเดิมคงครบ ไม่มีรูใหม่ |
| ปก/ขอบผ้าคลุม (117–121,225), (266–270,224–225), x75 y313–321, x331 y360–373 | จุดสว่างนอกขอบหาย เส้นที่ทาแทนรักษาขอบผ้าไว้ ไม่เห็นเส้นเข้มยื่นใหม่จากการแก้ |
| หน้า ตา คิ้ว หู คอ เข็มกลัด กระดุม เข็มขัด ปลอกแขน | เทียบภาพจริงกับภาพแยก ID แล้วไม่พบข้อสังเกตวัสดุใหม่; V1 หัวเข็มขัดคง ID9 ตามมติที่รับไว้ ไม่เสนอแก้ซ้ำ |

ข้อสังเกตใหม่จากภาพ: **0 บริเวณ** ไม่พบขอบแหว่งหรือเส้นยื่นผิดรูปใหม่จาก 106 จุดนี้ รูปขั้นบันไดของเส้นขอบเดิมยังคงไว้ ไม่แตะนอกกติกา ข้อสังเกตขอบสว่างในบันทึก T9 ด้านบนเป็นประวัติก่อน D-PT-4 ซึ่งรอบนี้จัดการตามข้อ 2b แล้ว

ภาพตรวจที่ส่ง: `pt-edits-x4.png` 1536×1608 (ตัวภาพ 4 เท่าเริ่มที่ (0,72), สีฟ้า=รู 50, ชมพู=ล้าง 88, เหลือง=ทาเส้น 18 ทุกจุดเป็นบล็อก 4×4) และ `pt-mask-ids.png` 1536×940 (รูปจริงกับสีแทนรหัส 2 เท่า พร้อมตารางสี ID 1–11) การขยายใช้เฉพาะภาพตรวจ

### ผลเครื่องตรวจ — คัดลอก stdout จริง

ใช้ Python `/tmp/t11-venv/bin/python3` (dependencies พร้อม), `-I -B`; เครื่องตรวจและ rules จากฐาน e5104c5 ไม่แก้ ผลเขียนนอก repo

```sh
python3 -I -B qa/g2-3-portrait/tools/check_pt_t9.py . /tmp/t13-out/qa.json
```

exit 0

```text
PASS 4.1a source file unchanged (SHA-256) | "28c4bb6e65a975931dc467e7173842ca1f4ae819d8d9bfab608825d8257f94ef"
PASS 4.1b c2-pilot-kid4-pt.png is 384 x 384 RGBA, alpha only 0 / 255 | {"size": [384, 384], "mode": "RGBA", "alpha": [0, 255]}
PASS 4.2a pixels that differ from the source = exactly the 156 edited pixels of the rules (50 holes #2E0A27 alpha 255 + debris pass 2b), each = the rule result | {"differ": 156, "want": 156, "extra": [], "missing": [], "px_not_rule_result": 0}
PASS 4.2b edits json: 156 entries, no repeats, = the edited set, before/after match the images, why = hole-left/right / debris-clear / debris-line as the rules say · replay = c2-pilot-kid4-pt.png · revert = source | {"entries": 156, "unique": 156}
PASS 4.3 enclosed transparent areas 0 · half-transparent 0 · opaque 70045 · exterior ring 1161 px · near-white (all > 230) on it 0 · debris outside the outline 0 | {"enclosed": 0, "opaque": 70045, "ext_ring": 1161, "near_white_on_ring": 0, "debris": 0}
PASS 4.4a mask 384 x 384 · A 255 exactly on the opaque pixels of c2-pilot-kid4-pt.png · transparent pixels (0,0,0,0) · B 0 everywhere | {"size": [384, 384], "A_mismatch": 0, "B_nonzero": 0, "transparent_not_zero": 0}
PASS 4.4b R = material id 1-11 on every opaque pixel and = the rule result (pt-rules.json) at 100 % | {"wrong_px": 0, "first_x_y_got_want": []}
PASS 4.4c G = shade rank by Y in each material (id 10: mouth 0-15 / cheek 16-31) and = the rule result at 100 % | {"wrong_px": 0, "first": []}
PASS 4.4d mask json: schema 1, file names, image SHA, every material shade list (dark -> light) and px count = the rule result · every pixel colour = json shade at its (R, G) · px total = opaque | {"materials": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], "pixels_not_matching_json": 0, "px_total": 70045}
PASS 4.4e 35 hand-picked check points (eyes, iris, cheeks, mouth, brows, ears, neck, hair, holes, cape, shirt, copper, leather, lines) have the id Claude chose by eye | []
PASS 4.4f review images present and readable: qa/g2-3-portrait/img/pt-edits-x4.png, qa/g2-3-portrait/img/pt-mask-ids.png | ["qa/g2-3-portrait/img/pt-edits-x4.png", "qa/g2-3-portrait/img/pt-mask-ids.png"]
11/11
```

```sh
python3 -I -B qa/g2-3-portrait/tools/check_pt_t9.py . --selftest
```

exit 0

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
OK   debris left on the head (x 154 y 25) -> expect FAIL 4.3 | failed: 4.2a,4.2b,4.3,4.4a,4.4b,4.4d
OK   debris painted instead of cleared (x 257 y 40) -> expect FAIL 4.2a | failed: 4.2a,4.2b,4.3,4.4a,4.4b,4.4d
selftest 15/15
```

ต่างจากสเปก: ไม่มี · ส่ง 6 ไฟล์ภาพ/ข้อมูล + เพิ่มหัวข้อ T13 ในบันทึกนี้ + CODEX_STATUS 1 บรรทัด · ไม่แก้ไฟล์ของ Claude / src / shademap / ตัวในเกม
