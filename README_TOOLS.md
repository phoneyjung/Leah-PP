# tools/ — เครื่องมือที่ใช้สร้างงาน (ใช้ซ้ำในแชทใหม่)

แชทใหม่จะไม่มีไฟล์ทำงานจากแชทเก่า สคริปต์ทั้งหมดอยู่ที่นี่ · **พาธในสคริปต์เขียนแบบแชทเก่า** (`/mnt/user-data/outputs/…`, `/home/claude/…`) ให้แก้เป็นพาธใหม่ก่อนรัน · ไฟล์ในโปรเจกต์อยู่ที่ `/mnt/project/`

| สคริปต์ | ทำอะไร | ต้องใช้ |
|---|---|---|
| `build_atlas.py` | สร้าง `world-atlas.json/csv` จากภาพโลก (ภูมิประเทศ บทบาท 60/30/10 มอน อาคาร ดันเจี้ยน ถนน) | `world-map-art` · `world-blocks.json` (ใน world-atlas.json มีครบแล้ว) |
| `render.py` + `mon.json` | วาดภาพรวมแอตลาส | `world-atlas.json` · ภาพโลก |
| `world_layout_base.py` + `world_layout_v2.py` | ผังสีเรียบของโลก (ใช้สั่ง ChatGPT วาดแผนที่โลก) | – |
| `layout_H9_village.py` | ผังฉาก H9 + ตรวจทางเดิน/ประตู/มุมจอ + `map-H9-spec.json` | – · **ใช้เป็นต้นแบบผังฉากอื่น** |
| `build_kit.py` | ตัดแผ่นชุดของ → atlas + manifest | แผ่นชุดของ |
| `qa_all_maps.js` | ไล่ทุกแผนที่ × ผู้ใหญ่/เด็ก ด้วย puppeteer | เกมในโฟลเดอร์ทดสอบ |
| `test_103_village.js` · `test_104_lantern.js` | ทดสอบรุ่น 1.03 (หมู่บ้าน เซฟสำรอง ตัวกัน error) · 1.04 (แสงตะเกียง เครื่องแปลง กลับบ้านแบบไม่ตาย) | เกมในโฟลเดอร์ทดสอบ |

**⚠️ ภาพในไฟล์โปรเจกต์ Claude ถูกย่อขนาดอัตโนมัติ** (แผนที่โลกเหลือ 1344×896 · แผ่นคริสตัลเหลือ 1568×168) ใช้ดูได้ แต่**งานที่ต้องใช้ขนาดเต็มให้ดึงจาก GitHub:** `art-world-map.png` (1536×1024) · `art-crystal-*.png` (คริสตัล 12 ชิ้นแยก) · `art-town-crystals-sheet.png` + `.json` · `art-world-layout-v2.png` เช่น `curl -O https://raw.githubusercontent.com/phoneyjung/Leah-PP/main/art-world-map.png`

**ดึงเกมจาก GitHub มาทดสอบ:** `curl -L -o repo.zip https://codeload.github.com/phoneyjung/Leah-PP/zip/refs/heads/main` แล้วแตก · เปิดเซิร์ฟเวอร์ `python3 -m http.server 8775`
