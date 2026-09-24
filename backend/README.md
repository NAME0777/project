# Backend — Notes Hub API

REST API ด้วย Express + TypeScript ตอนนี้เก็บข้อมูลใน memory (รีสตาร์ตแล้วหาย)
โครงสร้างพร้อมสลับไปต่อฐานข้อมูลจริงได้โดยแก้แค่ `src/store.ts`

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env   # แก้ PORT / CORS_ORIGIN ตามจริงถ้าจำเป็น
npm run dev             # เปิด http://localhost:4000
npm run build && npm start   # build แล้วรันแบบ production
```

## โครงสร้างไฟล์

```
src/
├─ server.ts          ประกอบ Express app, ตั้ง CORS, เปิดพอร์ต
├─ store.ts             ★ ข้อมูลตั้งต้น + ฟังก์ชันอ่าน/แก้ไขข้อมูล (สลับเป็น DB จริงที่นี่)
├─ types.ts            ชนิดข้อมูล — ต้องตรงกับ frontend/src/types.ts
└─ routes/
   ├─ auth.ts          POST /api/auth/login, /api/auth/register
   ├─ subjects.ts      GET  /api/subjects, /api/subjects/:id/topics
   ├─ notes.ts         GET  /api/notes/:id · POST /api/notes · POST /api/notes/:id/revisions
   ├─ ocr.ts           POST /api/ocr  (mock — ดูจุดต่อ OCR engine จริงในไฟล์)
   └─ dashboard.ts     GET  /api/dashboard
```

## Endpoint ทั้งหมด

| Method | Path | หน้าที่ |
| --- | --- | --- |
| POST | `/api/auth/login` | ตรวจอีเมล/role แล้วคืนข้อมูลผู้ใช้ |
| POST | `/api/auth/register` | ตรวจฟอร์มสมัครสมาชิก |
| GET | `/api/subjects` | รายวิชาทั้งหมด |
| GET | `/api/subjects/:id/topics` | หัวข้อของวิชานั้น พร้อม `hasNote` |
| GET | `/api/notes/:id` | โน้ตหนึ่งฉบับพร้อมประวัติ |
| POST | `/api/notes` | สร้างโน้ตใหม่ (ใช้ตอนบันทึกผลจาก OCR) |
| POST | `/api/notes/:id/revisions` | บันทึกเวอร์ชันใหม่ของโน้ต (ของเดิมไม่ถูกทับ) |
| POST | `/api/ocr` | แปลงภาพเป็นข้อความ (mock) |
| GET | `/api/dashboard` | สถิติภาพรวมสำหรับหน้า admin |

## ต่อฐานข้อมูลจริง

แก้เฉพาะ `src/store.ts`: เปลี่ยนอาเรย์ในหน่วยความจำเป็นการ query จริง (Prisma/Drizzle/pg ฯลฯ)
แล้วทำให้ฟังก์ชันเป็น `async` — ไฟล์ `routes/*.ts` เรียกใช้เหมือนเดิม แค่เติม `await`

## ต่อระบบยืนยันตัวตนจริง

`routes/auth.ts` ตอนนี้ไม่เช็ครหัสผ่านกับฐานข้อมูลและไม่ออก token — มีคอมเมนต์ `TODO`
กำกับจุดที่ต้องเพิ่ม bcrypt (เข้ารหัสรหัสผ่าน) และ JWT (ออก token ตอน login) ไว้แล้ว
