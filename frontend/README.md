# Frontend — คลังโน้ตเรียนประจำสาขา

React + TypeScript + Vite ไม่มีข้อมูลฝังในโค้ดแล้ว — ทุกอย่างดึงจาก **backend** ผ่าน `src/api.ts`

## เริ่มใช้งาน

ต้องมี backend รันอยู่ก่อน (ดู `../backend/README.md`) แล้วค่อยรันฝั่งนี้:

```bash
npm install
npm run dev      # เปิด http://localhost:5173
```

ตอน dev, `vite.config.ts` ตั้ง proxy ให้ `/api/*` วิ่งไป `http://localhost:4000` อัตโนมัติ
ไม่ต้องตั้งค่า CORS หรือ URL เอง

### ต่อ backend ที่ไม่ได้รันบนเครื่องเดียวกัน

สร้างไฟล์ `.env` แล้วใส่:
```
VITE_API_URL=https://api.your-domain.com/api
```

## โครงสร้างไฟล์

```
src/
├─ main.tsx        จุดเริ่มต้น
├─ App.tsx          ตัวเลือกหน้า (routing) — ไม่มี UI, ไม่มีข้อมูลฝัง
├─ api.ts            ★ จุดเดียวที่คุยกับ backend (fetch ทั้งหมดอยู่ที่นี่)
├─ types.ts          ชนิดข้อมูล — ต้องตรงกับ backend/src/types.ts
├─ index.css         สไตล์ทั้งระบบ
├─ hooks.ts           ★ ตรรกะฝั่ง frontend (เรียก api.ts, จัดการ state/loading/error)
├─ ui.tsx             ★ ชิ้นส่วน UI ใช้ซ้ำ (Button, Field, NavBar, PageShell, AuthCard)
└─ views/
   ├─ AuthViews.tsx     Login + Register
   ├─ CatalogViews.tsx  Subjects + Topics
   ├─ NoteViews.tsx     Note + Editor + RevisionList
   └─ ToolViews.tsx     Ocr + Dashboard
```

## กติกาของโปรเจกต์นี้

1. **ห้าม `fetch()` นอก `api.ts`** — ถ้า backend เปลี่ยน endpoint ต้องแก้ที่เดียว
2. **ห้ามฮาร์ดโค้ดข้อมูล** — วิชา/หัวข้อ/โน้ตทั้งหมดมาจาก backend เท่านั้น
3. **ห้ามประกาศคอมโพเนนต์ซ้อนในคอมโพเนนต์** ทุกคอมโพเนนต์อยู่ระดับบนสุดของไฟล์
4. **ตรรกะอยู่ใน hooks.ts, หน้าตาอยู่ใน views/**
