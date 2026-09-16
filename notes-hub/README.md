# คลังโน้ตเรียนประจำสาขา (Notes Hub)

เว็บแอปให้นักศึกษาช่วยกันเขียนและแก้โน้ตแต่ละหัวข้อแบบวิกิ ทุกการแก้ไขเก็บเป็นเวอร์ชันใหม่

## เริ่มใช้งาน

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # ตรวจ type + build ลง dist/
```

## โครงสร้างไฟล์

```
src/
├─ main.tsx              จุดเริ่มต้นของแอป
├─ App.tsx               ตัวเลือกหน้า (routing) อย่างเดียว ไม่มี UI
├─ types.ts              ชนิดข้อมูลกลาง ไม่ import อะไรเลย
├─ index.css             ตัวแปรสไตล์และ base style
├─ data/
│  ├─ subjects.ts        รายวิชา + หัวข้อ + ฟังก์ชันค้นหา
│  └─ notes.ts           โน้ตตั้งต้นและข้อมูลหน้าภาพรวม
├─ hooks/                ตรรกะทั้งหมดอยู่ที่นี่ ไม่มี JSX
│  ├─ useRouter.ts       หน้าปัจจุบัน + ประวัติสำหรับปุ่มย้อนกลับ
│  ├─ useAuth.ts         ผู้ใช้ที่ล็อกอินอยู่
│  ├─ useNotes.ts        คลังโน้ต + บันทึกเวอร์ชันใหม่
│  ├─ useSpeech.ts       อ่านออกเสียงด้วย Web Speech API
│  └─ useOcr.ts          อัปโหลดภาพ ตรวจไฟล์ แปลงข้อความ
├─ components/           ชิ้นส่วนที่ใช้ซ้ำหลายหน้า
│  ├─ PageShell.tsx      โครงหน้าหลัง login (แถบเมนู + หัวข้อหน้า)
│  ├─ AuthCard.tsx       โครงหน้า login / register
│  ├─ NavBar.tsx  Button.tsx  Field.tsx  BackLink.tsx
└─ views/                หนึ่งหน้า = หนึ่งไฟล์
   ├─ LoginView.tsx  RegisterView.tsx  SubjectsView.tsx  TopicsView.tsx
   ├─ NoteView.tsx   EditorView.tsx    OcrView.tsx       DashboardView.tsx
   └─ note/RevisionList.tsx
```

## กติกาที่ใช้ในโปรเจกต์นี้

1. **ห้ามประกาศคอมโพเนนต์ซ้อนในคอมโพเนนต์** ทุกคอมโพเนนต์ประกาศระดับบนสุดของไฟล์ตัวเอง
2. **หน้า (views) รับทุกอย่างผ่าน props** ไม่ไปหยิบ state ข้ามไฟล์เอง
3. **ตรรกะอยู่ใน hooks, หน้าตาอยู่ใน views** ถ้าหน้าไหนเริ่มมี `setTimeout` หรือคำนวณเยอะ ให้ย้ายไป hook
4. **ข้อมูลอยู่ใน `data/`** ไม่ฮาร์ดโค้ดปนกับ JSX

## ต่อ backend ตรงไหน

| งาน | แก้ที่ไฟล์ |
| --- | --- |
| เข้าสู่ระบบจริง | `hooks/useAuth.ts` → `login()` |
| ดึง/บันทึกโน้ต | `hooks/useNotes.ts` |
| เรียก OCR API จริง | `hooks/useOcr.ts` → `run()` |
| ดึงรายวิชาจาก API | `data/subjects.ts` |
