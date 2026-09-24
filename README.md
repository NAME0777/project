# Notes Hub — คลังโน้ตเรียนประจำสาขา

โปรเจกต์แยกเป็น 2 ส่วนอิสระ คุยกันผ่าน HTTP API เท่านั้น:

```
project/
├─ backend/     Express + TypeScript API (พอร์ต 4000)
├─ frontend/    React + Vite (พอร์ต 5173)
├─ start.bat    ดับเบิลคลิกรันทั้งคู่พร้อมกัน (Windows)
├─ start.sh     รันทั้งคู่พร้อมกัน (macOS/Linux)
└─ package.json สั่ง `npm run dev` ตัวเดียวเปิดทั้งคู่ได้เหมือนกัน
```

## วิธีรัน (เลือกวิธีเดียว)

### ทางลัดที่สุด — ดับเบิลคลิก (Windows)

ดับเบิลคลิกไฟล์ **`start.bat`** ในโฟลเดอร์นี้ได้เลย
ครั้งแรกจะติดตั้ง dependency ให้อัตโนมัติ (ใช้เวลาสักครู่) ครั้งต่อไปจะเปิดเร็วขึ้นมาก
เสร็จแล้วเปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

กด `Ctrl+C` ในหน้าต่างที่เปิดขึ้นมาเพื่อหยุดทั้งสองระบบพร้อมกัน

### หรือสั่งจาก terminal (Windows/macOS/Linux เหมือนกัน)

```bash
npm run install:all   # ติดตั้ง dependency ของ backend + frontend (ทำครั้งเดียว)
npm run dev             # เปิด backend (:4000) และ frontend (:5173) พร้อมกันในหน้าต่างเดียว
```

**ไม่ต้องเปิด 2 terminal แยกกันอีกต่อไป** — คำสั่ง `npm run dev` ตัวเดียวใช้ [concurrently](https://www.npmjs.com/package/concurrently)
เปิดทั้งสองฝั่งพร้อมกัน และติดป้าย `[BACKEND]` / `[FRONTEND]` แยกสีให้อ่าน log ง่าย

### macOS/Linux แบบสคริปต์

```bash
./start.sh
```

## ใช้งาน

เปิด http://localhost:5173 ล็อกอินด้วยอีเมลลงท้าย `@kmitl.ac.th` (อะไรก็ได้) รหัสผ่านอย่างน้อย 6 ตัวอักษร

## ทำไมถึงแยก backend/frontend แต่รันด้วยคำสั่งเดียว

| | ก่อนแยก | หลังแยก (แต่ยังรันง่าย) |
| --- | --- | --- |
| ข้อมูล | ฝังในโค้ด frontend | อยู่ที่ backend แหล่งเดียว |
| แก้ข้อมูลจากเครื่องอื่น | ทำไม่ได้ | ทำได้ผ่าน API |
| deploy | ไฟล์เดียวรวมกัน | แยก deploy ได้อิสระ |
| รันตอน dev | 1 คำสั่ง | ยังเป็น 1 คำสั่ง (`npm run dev` ที่ root) |

รายละเอียดเชิงลึกของแต่ละฝั่งอยู่ใน `backend/README.md` และ `frontend/README.md`
