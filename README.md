# CodeMentor AI

ระบบช่วยตรวจโค้ด Python และวิเคราะห์ประสิทธิภาพผู้เรียนด้วยเทคโนโลยี AI สำหรับสถานศึกษา

## โครงสร้างโปรเจค

โปรเจคนี้ประกอบด้วย 2 ส่วนหลัก:
1. backend: ระบบ API พัฒนาด้วย Node.js (Express), Prisma (ORM) และ MongoDB
2. frontend: ส่วนติดต่อผู้ใช้งานพัฒนาด้วย Next.js และ Tailwind CSS

---

## การติดตั้งและตั้งค่า Backend

### ความต้องการของระบบ
- Node.js (เวอร์ชัน 18.0.0 ขึ้นไป)
- MongoDB Database

### ขั้นตอนการติดตั้ง
1. เข้าไปยังโฟลเดอร์ backend
   cd backend

2. ติดตั้งโมดูลที่จำเป็น
   npm install

3. ตั้งค่าสภาพแวดล้อม (Environment Variables)
   สร้างไฟล์ .env ภายในโฟลเดอร์ backend และกำหนดค่าดังต่อไปนี้:
   
   DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>"
   JWT_SECRET="กำหนดรหัสลับสำหรับความปลอดภัยของ Token"
   EMAIL_USER="อีเมลสำหรับใช้ส่งการแจ้งเตือน (Gmail)"
   EMAIL_PASS="รหัสผ่าน App Password ของ Gmail"
   GOOGLE_GENERATIVE_AI_API_KEY="API Key จาก Google AI Studio"
   PORT=1337

4. สร้างไฟล์เชื่อมต่อฐานข้อมูล (Prisma Generate)
   npx prisma generate

5. เริ่มต้นการทำงานในโหมดพัฒนา
   npm run dev

---

## การติดตั้งและตั้งค่า Frontend

### ความต้องการของระบบ
- Node.js (เวอร์ชัน 18.0.0 ขึ้นไป)

### ขั้นตอนการติดตั้ง
1. เข้าไปยังโฟลเดอร์ frontend
   cd frontend

2. ติดตั้งโมดูลที่จำเป็น
   npm install

3. ตั้งค่าสภาพแวดล้อม (Environment Variables)
   สร้างไฟล์ .env ภายในโฟลเดอร์ frontend และกำหนดค่าดังต่อไปนี้:
   
   NEXT_PUBLIC_API_URL="http://localhost:1337/api"
   JWT_SECRET="กำหนดรหัสลับ (ต้องตรงกับที่ตั้งไว้ใน Backend)"

4. เริ่มต้นการทำงานในโหมดพัฒนา
   npm run dev

---

## ข้อมูลการเข้าใช้งานระบบ

- ส่วนของ Frontend: เข้าใช้งานผ่านบราวเซอร์ที่ http://localhost:3000
- ส่วนของ Backend API: ทำงานที่ http://localhost:1337

## หมายเหตุการใช้งาน
- การส่งอีเมลแจ้งเตือนจำเป็นต้องตั้งค่า App Password ในบัญชี Google
- การตรวจโค้ดด้วย AI จำเป็นต้องมีการเชื่อมต่ออินเทอร์เน็ตเพื่อติดต่อกับ Gemini API
- ในการใช้งานครั้งแรก หากยังไม่มีข้อมูลในฐานข้อมูล ให้เข้าใช้งานผ่านสิทธิ์ ADMIN เพื่อจัดการข้อมูลผู้ใช้เบื้องต้น
