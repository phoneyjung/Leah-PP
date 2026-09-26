# Leah-PP · คู่มือช่าง (แชท 2)

## โค้ดอยู่ที่ไหน
- **ของจริงอยู่ใน GitHub** `phoneyjung/Leah-PP` (public) ดึงด้วย
  `curl -O https://raw.githubusercontent.com/phoneyjung/Leah-PP/main/index.html`
- เกมทั้งหมดอยู่ใน `index.html` ไฟล์เดียว (HTML + CSS + JS) ภาพและคำถามเป็นไฟล์แยกที่ root
- ในโค้ดมีคำถามสำรอง 60 ข้อฝังอยู่ (`const FALLBACK_Q=[…]` บรรทัดยาวมาก) อย่าลบ
- three.js r128 โหลดจาก cdnjs · ใช้ `THREE.ACESFilmicToneMapping` ในถ้ำ และไม่ใช้ tone mapping ในหมู่บ้าน/บ้าน

## โครงสร้าง index.html (ส่วนหลักในสคริปต์)
1 TEXT (ไทย/อังกฤษ ทุกข้อความอยู่ใน `T.th` / `T.en`) · 2 DATA (แผนที่ `MAPS` คลังคำถาม `QB`) · 3 SAVE (`Store` หลายผู้เล่น เซฟ v3) · 3b SOUND · 3c MUSIC · 4 GAME RULES (`command()` ทุกการเปลี่ยนเงิน/ของผ่านที่นี่) · 5 VIEW (ถ้ำ/บ้าน 3D ถ้ำมีระบบมองเห็น) · 5b VIEW 2D (หมู่บ้าน: `v2Build` `v2Draw` ผังอยู่ใน `VL`) · 6 INPUT · 7 ACTIONS (`interact` `walkTo` `goScene`) · 8 QUIZ · 8a JOYSTICK · 8b DIALOGUE (`say` `once`) · 8c KNOWLEDGE BOOK · 9 SHOP & HOUSE · 10 EFFECTS · 11 TITLE · 12 ENGINE LOOP · 13 BOOT

## กติกาที่ต้องทำทุกครั้ง
- แก้แบบเจาะจง ไม่รื้อของที่ทำงานอยู่
- ทุกไฟล์ภายนอกต้องมีสำรอง ไฟล์หายต้องเล่นต่อได้ ไม่จอขาว
- **เพิ่มไฟล์ใหม่ → ใส่ชื่อใน `sw.js`** และ**เปลี่ยนเลข `leahpp-vXX` ทุกครั้งที่แก้เกม**
- ข้อความใหม่ต้องมีทั้งไทยและอังกฤษ
- ทดสอบด้วย Playwright/Puppeteer และรายงานเป็นตัวเลข
- ไฟล์ให้ผู้ใช้อัปวางที่ root (อัปโฟลเดอร์จากมือถือไม่ได้)

## จุดทดสอบ (window.PP)
`PP.S` สถานะผู้เล่น · `PP.M` แผนที่ปัจจุบัน · `PP.CRYS` คริสตัลรอบนี้ · `PP.player` · `PP.interact(obj)` · `PP.goScene(name,'start',true)` · `PP.command(type,data)` · `PP.quiz` · `PP.nextLine()` / `PP.dlgOpen` · `PP.isWall(x,z)` · `PP.JOY` · `PP.MUSIC` · `PP.QB` · `PP.V2` (หมู่บ้าน 2D: กล้อง `camX/camY` ขนาด `VW/VH` `SC`)
ปิดบทพูดตอนทดสอบ: `while(PP.dlgOpen)PP.nextLine();PP.S.seen=['intro','cave1','shop1','house1','half','gate','clear1','book1']`

## ชุดทดสอบที่ต้องผ่านก่อนส่ง (อยู่ใน Leah-PP-tests.zip)
| ไฟล์ | ตรวจอะไร |
|---|---|
| `test_walk.py` | **แตะเดินจริงทั้ง 3 ฉาก** + ตรวจแผนที่ว่าจุดเริ่มเดินได้และเข้าถึงวัตถุครบ |
| `test12.py` | วงจรหมู่บ้าน → ถ้ำ → ขาย → ซื้อ → จัดบ้าน → เซฟ |
| `test14.py` | สุ่มที่ซ่อน 300 รอบ ปรับยาก ลูกศรชี้ |
| `test15.py` | บทพูดทุกฉาก |
| `test16.py` | สมุดความรู้ |
| `test18.py` | จอย ปุ่มใช้งาน จอมือถือแนวนอน |
| `test19.py` | เพลง |
| `test20.py` | หมู่บ้าน 2D: แตะหลังคาบ้าน/กันสาดร้าน/หินปากถ้ำ/ยายนวล แล้วเดินไปใช้งานถูกที่ |
เตรียม: `npm pack three@0.128.0 && tar xzf three-0.128.0.tgz` แล้วแก้ path ใน route ของแต่ละไฟล์ · เปิดเซิร์ฟเวอร์ `python3 -m http.server <พอร์ต>` แล้วแก้พอร์ตในไฟล์ทดสอบให้ตรง

## บทเรียนจากบั๊กที่เคยเกิด
- ตัวอักษรในแผนที่มีความหมายต่างกันแต่ละฉาก (S = ร้านในหมู่บ้าน แต่ = จุดเริ่มในถ้ำ) เคยทำให้เกิดในกำแพงแล้วเดินไม่ได้ → ของที่เดินทะลุไม่ได้แยกตามฉากใน `SOLID`
- ทดสอบด้วยการพาตัวละครวาร์ปไปหาของอย่างเดียวไม่พอ ต้องมีทดสอบ**แตะเดินจริง**เสมอ
- ปุ่มที่มีแอนิเมชันเด้ง Playwright กดไม่ได้ ใช้ `click(force=True)`
- ส่วนหัว `.tool` เคยทับ `[hidden]` จนปุ่มที่ควรซ่อนโผล่ → มี `[hidden]{display:none!important}` แล้ว
