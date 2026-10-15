# HANDOFF_CODEX_LEAD.md — Codex รับหน้าที่ ChatGPT เดิม (Claude เขียน · 15 ต.ค. 2569)

**ทำไมมีไฟล์นี้:** 15 ต.ค. 2569 09:38 เจ้าของรวมหน้าที่ ChatGPT (แผนแม่บท · อาร์ตไดเรกชัน · ตรวจสเปก) เข้ากับ Codex เป็นแชตเดียว · **Codex ไม่มีความจำของแชต ChatGPT** · ทุกอย่างที่ ChatGPT ออกแบบแล้วจดลง repo อยู่ในไฟล์ด้านล่าง · เรื่องที่คุยในแชต ChatGPT แต่ไม่ได้จดลงไฟล์ Codex จะไม่รู้ (ดูข้อ 5)

## 1. อ่านตามลำดับนี้ (เอกสารยังไม่อยู่ใน `main` · อยู่ใน PR · ลิงก์ตรึงตาม commit)
| # | เอกสาร | เนื้อหา | branch / commit |
|---|---|---|---|
| 1 | `CLAUDE.md` (ส่วนบน) | แบ่งงาน Claude/Codex · มติ G1.6 · การรวมบทบาท 15 ต.ค. | PR #5 `claude/character-reboot` [`6a64e6d`](https://github.com/phoneyjung/Leah-PP/blob/6a64e6d/CLAUDE.md) |
| 2 | `GAME_REBOOT_MASTER_PLAN_2026-10-13.md` v1.2 | แผนแม่บทของ ChatGPT: เป้าหมายผู้เล่น · Gate G0–G10 (ตอนนี้อยู่ G2 Pilot · ทำ Gate เดียวต่อรอบ) · เกณฑ์อนุมัติ · ข้อ 13–16 = ผล G0–G1.6 | PR #6 `plan/lantern-reboot-master-20261013` [`7d5d152`](https://github.com/phoneyjung/Leah-PP/blob/7d5d152/GAME_REBOOT_MASTER_PLAN_2026-10-13.md) |
| 3 | `VISUAL_BIBLE_G1_V1_1.md` (ฉบับ 1.2) | แนวภาพทั้งโลก "Lantern Fantasy / Light and Darkness" · สัญญาภาพ · เกณฑ์ G1 | PR #6 [`7d5d152`](https://github.com/phoneyjung/Leah-PP/blob/7d5d152/VISUAL_BIBLE_G1_V1_1.md) |
| 4 | `G1_MATERIAL_PALETTE_V1_2.md` | ค่าสีผม/ตา/บ้าน (ล็อก ลำดับผูกเซฟ) · ผิว 4×5 และ Copper Trim (ข้อเสนอ) · ΔE00 | PR #6 [`7d5d152`](https://github.com/phoneyjung/Leah-PP/blob/7d5d152/G1_MATERIAL_PALETTE_V1_2.md) |
| 5 | `DESIGN_CHARACTER_REBOOT_PLAN.md` · `DESIGN_CHARACTER_SYSTEM_SPEC_V2.md` | แผนรีบูตตัวละคร · ระบบตัวละคร v2 (ชั้นภาพ สีกุญแจ เซฟ) | PR #5 [`6a64e6d`](https://github.com/phoneyjung/Leah-PP/tree/6a64e6d) |
| 6 | `CHARACTER_ART_DIRECTION_V2.md` | G1.3 "Soft Heroic Pixel" · ผลรอบ 2–5 · ต้นแบบ `_4` · Portrait G1.4 · ภาพนิ่ง G1.5 · มติ G1.6 | PR #7 `plan/g1-3-character-art-direction-v2` [`fc7460a`](https://github.com/phoneyjung/Leah-PP/blob/fc7460a/CHARACTER_ART_DIRECTION_V2.md) |
| 7 | `G2_0_VERTICAL_SLICE_PLAN.md` v1.1 | แผน G2 (Pilot) G2.1–G2.6 · Quality Gate · งบเครดิต · ข้อตัดสิน D1–D10 · บันทึกความคืบหน้า | PR #7 [`fc7460a`](https://github.com/phoneyjung/Leah-PP/blob/fc7460a/G2_0_VERTICAL_SLICE_PLAN.md) |
| 8 | `ASSET_SPEC_09_c2_pilot_kid.md` | งานภาพ G2.1: A1 → A2 → A3 → A3.1 · มติ P1–P3 D3 · ผลตรวจ | `claude/g2-pilot` (ไฟล์นี้อยู่ branch เดียวกัน) |
- `main` (`eb60c65`) = เกม 2.33 ที่เล่นอยู่ · `ART_GUIDE.md` ใน main มีค่าช่อง 64/72 ของภาพเดิม **ห้ามใช้กับตัวละครใหม่**

## 2. มติที่ล็อกแล้ว (ย่อ · รายละเอียดในเอกสารข้อ 1)
- **G0** อนุมัติ · **G1.3** แนว "Soft Heroic Pixel" (แนวทาง A) · ต้นแบบ G1 = รอบ 5 ไฟล์ `_4`
- **G1.6 (14 ต.ค. แบบมีเงื่อนไข):** Sprite 96×96 · ตัวสูง 80–88 · เท้า `[48,94]` · Portrait 384 · `T=32` เดิม · ปากไม่ใช่ตัวเลือก
- **G2.0:** D1 เริ่ม G2.1 · Pilot เป็นหน้าแยก · ภาพชิ้นเดียว + Material Mask (พิสูจน์การเปลี่ยนสีเท่านั้น · การสลับชั้นผม/ตา/ชุดเลื่อนไป G3) · D2 Codex แก้พิกเซล · D3 ผิว 4×5 ใช้ใน Pilot เท่านั้น
- **Asset 09:** A1 รับ (`4ede68e`) · A2 ขอบนอกพลัม ล็อก (`5bfda3b`) · A3 Material Mask รับ (`d73cbd0`) · A3.1 รอเจ้าของรับ (`2813279`)
- **Mask:** ID 0–11 (ข้อ 12 ของ ASSET_SPEC_09) · P1 ID 11 เส้นในคงที่ · P2 แถบส้ม = ทองแดง ID 9 · P3 แก้มคงที่ (ทดลอง) · ไม่ทำ mask ชั่วคราว
- **สีสัญญาณ:** ทองปุ่มกด `#FFC857` · ฟ้าคริสตัล `#5FE0FF` · ΔE00 ≥ 10 · ข้อยกเว้น: Sun เฉด 2/3/4 · Blonde 4 · Amber 3 · `#F9DA99` 6 px ID 9
- **ลำดับสีที่ผูกเซฟ:** ผม 8 · ตา 5 · บ้าน Sun Wing Leaf Flame · ห้ามเปลี่ยนค่าหรือสลับ

## 3. เรื่องที่รอเจ้าของ (ถามทีละข้อ เมื่อถึงช่วงนั้น)
1. รับ A3.1
2. **D-A3-1** สีเริ่มต้น: ก ramp ทางการ / ข คงสีของ `_4` (ภาพเทียบอยู่ใน `qa/asset09-a3-1/`)
3. G2.1 ส่วนที่เหลือตามแผน G2 ข้อ 5 · จากนั้น D4 (ราคาท่าเดิน + เพดานเครดิต G2) ก่อน G2.2 · D5–D10 ตามแผน G2 ข้อ 8

## 4. กติกาทำงาน (ย่อ)
- **เจ้าของตัดสินทุกเรื่อง** · ถามทีละ 1 ข้อ · ตัวเลือก 2–3 ข้อ ⭐ ที่แนะนำ พร้อมเหตุผลสั้น · คำแนะนำของ AI ≠ การอนุมัติ
- Codex ผลิตภาพและตรวจงานตัวเองได้ แต่ **นับเป็นการตรวจตัวเอง** · Claude ตรวจงานภาพทุกชุดอย่างอิสระด้วยสคริปต์ · เจ้าของตัดสินภาพ
- Claude เขียนสเปก (`ASSET_SPEC_*`) ก่อนผลิตทุกชุด · Codex ส่งงานทาง branch `codex/asset-NN-*` ไม่ push `main` ไม่ force push · ไม่แก้ไฟล์ของอีกฝ่าย (ส่งข้อเสนอแทน)
- PixelLab: แจ้งราคาก่อนกดทุกครั้ง · พรอมป์ที่ดีที่สุดอันเดียวต่อชิ้น · ห้ามคำ scary / evil / demonic / blood
- ภาพ Ragnarok/Trickster เป็นข้อมูลอ้างอิงเท่านั้น ห้ามใช้เป็นภาพอ้างอิงใน PixelLab และห้าม commit
- token/คีย์: ส่งให้ Codex โดยตรงทางเดียว ห้ามใส่ใน GitHub ห้ามส่งผ่าน Claude
- คลังคำถามเป็นงานของ Claude + Gemini (ผู้ตรวจคนที่สอง) แยกจากงานภาพ

## 5. สิ่งที่อาจยังไม่อยู่ในไฟล์
- ไอเดียหรือข้อตกลงที่คุยในแชต ChatGPT แต่ไม่ได้ส่งต่อเป็นเอกสาร · แนะนำให้เจ้าของขอสรุปสุดท้ายจากแชต ChatGPT เดิม (เรื่องที่ยังเปิดอยู่ หรือยังไม่ได้จดลงไฟล์) แล้วส่งให้ Claude รวมเข้าไฟล์นี้
