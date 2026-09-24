# Notes Hub — คลังโน้ตเรียนประจำสาขา

โปรเจกต์แยกเป็น 2 ส่วนอิสระ คุยกันผ่าน HTTP API เท่านั้น ไม่มีการ import ไฟล์ข้ามฝั่งกัน:

```
project/
├─ backend/     Express + TypeScript API (พอร์ต 4000) — ข้อมูลและตรรกะฝั่งเซิร์ฟเวอร์
└─ frontend/    React + Vite (พอร์ต 5173) — หน้าตาและ interaction ล้วน ๆ
```

## รันพร้อมกันทั้งคู่ (เปิด 2 terminal)

```bash
# terminal 1
cd backend
npm install
npm run dev          # http://localhost:4000

# terminal 2
cd frontend
npm install
npm run dev           # http://localhost:5173 — proxy /api ไป backend ให้อัตโนมัติ
```

เปิด http://localhost:5173 แล้วใช้งานได้ทันที (ล็อกอินด้วยอีเมลลงท้าย `@kmitl.ac.th` อะไรก็ได้ อย่างน้อย 6 ตัวอักษรในรหัสผ่าน)

## ทำไมถึงแยกกันแบบนี้

| | ก่อนแยก | หลังแยก |
| --- | --- | --- |
| ข้อมูล (วิชา/โน้ต) | ฝังในโค้ด frontend | อยู่ที่ backend แหล่งเดียว |
| แก้ข้อมูลจากเครื่องอื่น | ทำไม่ได้ | ทำได้ผ่าน API |
| เพิ่มแอปมือถือ/แอปอื่นในอนาคต | ต้องเขียนตรรกะซ้ำ | เรียก API เดิมได้เลย |
| deploy | ไฟล์เดียวรวมกัน | แยก deploy ได้อิสระ (เช่น frontend ขึ้น Vercel, backend ขึ้น Railway) |

รายละเอียดของแต่ละฝั่งอยู่ใน `backend/README.md` และ `frontend/README.md`
