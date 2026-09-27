# ตั้งค่าเล่นออนไลน์ (Firebase) · Leah พาเพลิน 2D

ทำครั้งเดียว ประมาณ 10 นาที ทำจากมือถือได้ ถ้ายังไม่ทำ เกมเล่นคนเดียวได้ตามปกติ

## สิ่งที่ออนไลน์ส่งกัน (ปลอดภัยสำหรับเด็ก)
- ชื่อเล่น ตัวละคร สีบ้าน เลเวล แผนที่ และตำแหน่งในแผนที่
- อีโม 5 แบบ (❤️ ⭐ 🎵 👋 😂) · **ไม่มีช่องพิมพ์แชท**
- คะแนนบ้านของทั้งห้อง
- ไม่มีอีเมล ไม่มีชื่อจริง · เข้าแบบไม่ระบุตัวตน (Anonymous)

## ขั้นตอน
1. เปิด https://console.firebase.google.com → **Add project** → ตั้งชื่อ เช่น `leah-paphloen` → ปิด Google Analytics ได้ → Create
2. เมนู **Authentication → Get started → Sign-in method → Anonymous → Enable → Save** แล้วแท็บ **Settings → Authorized domains → Add domain → `phoneyjung.github.io`**
3. เมนู **Realtime Database** (⚠️ ไม่ใช่ Firestore) **→ Create database** → ตำแหน่ง **Singapore (asia-southeast1)** → เลือก **Start in locked mode** → Enable
4. ในหน้า Realtime Database แท็บ **Rules** → ลบของเดิม → วางทั้งหมดจากไฟล์ `database.rules.json` → **Publish**
5. กลับหน้าแรกของโปรเจกต์ → ไอคอน **</>** (Web) → ตั้งชื่อแอป → Register → จะเห็นกล่อง `firebaseConfig = {...}`
6. เปิดไฟล์ `firebase-config.js` ใน GitHub (กดรูปดินสอแก้ไข) → ลบบรรทัด `window.FB_CONFIG=null;` → วางแทนด้วย
   `window.FB_CONFIG={apiKey:"...",authDomain:"...",databaseURL:"...",projectId:"...",appId:"..."};`
   (คัดลอกค่าจากข้อ 5 · ต้องมี `databaseURL` ถ้าไม่มี ให้ดูที่หน้า Realtime Database บรรทัดบนสุด)
7. Commit แล้วเปิด https://phoneyjung.github.io/Leah-PP/play.html → ⚙️ ตั้งค่า → 🌐 เล่นออนไลน์ → ใส่รหัสห้อง (เช่น `LEAH01`) → เข้าห้อง
8. เครื่องอื่นใส่รหัสห้องเดียวกัน จะเห็นกันในแผนที่เดียวกัน

## หมายเหตุ
- โครงสร้างข้อมูล ความจุแพ็กฟรี และระบบกันล่ม ดู `DATABASE.md`
- ค่า `apiKey` ของ Firebase เว็บไม่ใช่รหัสลับ ใส่ใน GitHub ได้ ความปลอดภัยอยู่ที่ Rules ในข้อ 4
- ออนไลน์ = เห็นกัน · ส่งอีโม · คะแนนบ้านรวม · **มอนสเตอร์ในถ้ำเป็นตัวเดียวกันทุกเครื่อง** (เครื่องที่รหัสน้อยสุดในชั้นนั้นเป็นคนคุมมอน คนอื่นส่งการตีไปให้) · มอนไล่ตีเฉพาะผู้ใหญ่ ไม่ตีเด็ก · คริสตัลกับจุดขุดยังเป็นของแต่ละคน (เด็กแต่ละคนได้ตอบคำถามเอง)
- ถ้าเคยวางกติกา (ข้อ 4) ไปแล้ว ให้วางใหม่จากไฟล์ `database.rules.json` ฉบับนี้ (เพิ่มส่วน maps)
