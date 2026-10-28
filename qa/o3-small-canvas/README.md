# O3 · บั๊กจอเล็ก · DRAFT FIX (NOT APPROVED)
Claude · 28 ต.ค. 2569 · branch ร่าง `claude/o3-draft` · ฐาน `claude/g2-pilot` @ `4c938cc` · **ยังไม่อนุมัติ · ห้าม merge · QG-5a = OPEN · O3 = OPEN / DRAFT FIX**

เจ้าของอนุมัติให้ขึ้น branch ร่างนี้เพื่อให้ 🟧 ChatGPT อ่านจาก GitHub ได้โดยตรง · `claude/g2-pilot` และ `main` ไม่เปลี่ยน

| ไฟล์ | เนื้อหา |
|---|---|
| `O3_DRAFT_REPORT.txt` | รายงานฉบับเต็ม (ข้อ 1–10 ตามที่ ChatGPT ขอ) |
| `RCA_O3.md` | สาเหตุ ทีละบรรทัด |
| `o3_scale_fix.diff` | diff 1 บรรทัด (ใน commit นี้ใช้กับ `pilot-g2-motion.html` แล้ว) |
| `REVIEW_O3.md` | ผู้ตรวจอิสระ 2 รอบ |
| `O3-PROOF-1of2-small-canvas.jpg` · `O3-PROOF-2of2-shrink-expand.jpg` | ภาพเทียบ OLD / FIX (code O3-2810) |
| `tools/test_o3_small_canvas.py` | ชุดทดสอบ O3 v3 (v1 v2 เก็บไว้) · `python3 -I test_o3_small_canvas.py OLD_PORT FIX_PORT OUT` |
| `tools/run_existing_qa.sh` | คำสั่งที่ใช้รัน QA เดิม (path ของเครื่องทดสอบ) |
| `results/` | ผล O3 v3 (17/17) · v2 (16/16) · v1 (14/14) · QA เดิม (exit-codes.txt) |
| `proposed/pilot-g2-motion.html` | สำเนาหน้าที่แก้ (= ไฟล์ที่ root ของ commit นี้) |

`SHA256SUMS.txt` = SHA-256 ของทุกไฟล์ในโฟลเดอร์นี้
